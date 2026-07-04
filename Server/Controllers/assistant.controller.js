import { generateGeminiResponse } from "../Configs/gemini.js";
import User from "../Models/user.model.js";
import { decrypt } from "../utils/crypto.js";
import Conversation from "../Models/conversation.model.js";
import { RetrievalService } from "../Services/RetrievalService.js";
import { PromptBuilder } from "../Services/PromptBuilder.js";

/**
 * GET /api/assistant/config/:userId
 * Returns assistant configuration for the embedded widget.
 * Unchanged from original.
 */
export const getAssistantConfig = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select("-geminiApiKey");
        if (!user) {
            return res.status(404).json({ message: "failed to get user" });
        }

        return res.status(200).json({ message: "Assistant Config data ", user });

    } catch (error) {
        return res.status(500).json({ message: `Assistant Config failed ${error}` });
    }
};

/**
 * POST /api/assistant/ask
 *
 * RAG-powered chat endpoint.
 *
 * Pipeline:
 *   1. Validate request + user
 *   2. Check plan limits
 *   3. Navigation intent detection (unchanged)
 *   4. Retrieve relevant knowledge via RetrievalService
 *   5. Load recent conversation history
 *   6. Build prompt via PromptBuilder
 *   7. Generate Gemini response
 *   8. Log conversation
 *
 * API contract: identical to original — no frontend changes needed.
 */
export const askAssistant = async (req, res) => {
    try {
        const { message, userId, sessionId } = req.body;
        console.log(`[askAssistant] userId=${userId}, message="${message}", sessionId=${sessionId}`);

        if (!message || !userId) {
            return res.status(400).json({ message: "Message and UserId are required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User is not found" });
        }

        // Get Gemini API key
        let geminiApiKey = null;
        if (user.geminiApiKey) {
            geminiApiKey = decrypt(user.geminiApiKey);
        } else if (process.env.GEMINI_API_KEY) {
            geminiApiKey = process.env.GEMINI_API_KEY;
        }

        if (!geminiApiKey) {
            return res.status(400).json({ message: "gemini apikey is not added" });
        }

        // Plan limits check
        if (user.plan === "free" && user.totalMessages >= user.requestLimit) {
            return res.status(400).json({ message: "Free limit reached" });
        }

        if (user.plan === "pro" && new Date(user.proExpiresAt) < new Date()) {
            user.plan = "free";
            await user.save();
            return res.status(400).json({ message: "Pro plan expired" });
        }

        // ── Navigation Intent Detection (unchanged from original) ──────────────
        const cleanMessage = message.toLowerCase();

        if (user.enableNavigation) {
            const navigationWords = ["open", "go", "start", "show", "navigate", "take me"];
            const wantsNavigation = navigationWords.some(word => cleanMessage.startsWith(word));

            if (wantsNavigation) {
                const matchedPage = user.pages.find(page =>
                    page.keywords.some(keyword => cleanMessage.includes(keyword.toLowerCase()))
                );

                if (matchedPage) {
                    if (req.body.currentPath === matchedPage.path) {
                        return res.json({ success: true, response: `${matchedPage.name} already open` });
                    }
                    return res.json({
                        success: true,
                        action: "navigate",
                        path: matchedPage.path,
                        response: `Opening ${matchedPage.name}`
                    });
                }
            }
        }
        // ────────────────────────────────────────────────────────────────────────

        // ── RAG: Retrieve Relevant Context ──────────────────────────────────────
        let retrievalResults = [];
        try {
            retrievalResults = await RetrievalService.retrieve({
                userId: user._id.toString(),
                query: message,
                geminiApiKey,
                maxResults: 5,
                similarityThreshold: 0.4
            });
        } catch (ragError) {
            console.error("[askAssistant] Retrieval error (continuing without context):", ragError.message);
        }

        const context = RetrievalService.formatContext(retrievalResults);
        // ────────────────────────────────────────────────────────────────────────

        // ── Load Conversation History ────────────────────────────────────────────
        let conversationHistory = [];
        if (sessionId) {
            try {
                const session = await Conversation.findOne({
                    userId: user._id,
                    sessionId
                }).select("messages").lean();

                if (session?.messages) {
                    conversationHistory = session.messages.slice(-12); // Last 6 turns
                }
            } catch (histErr) {
                console.warn("[askAssistant] Could not load conversation history:", histErr.message);
            }
        }
        // ────────────────────────────────────────────────────────────────────────

        // ── Build Prompt ─────────────────────────────────────────────────────────
        const prompt = PromptBuilder.buildChatPrompt({
            user,
            context,
            conversationHistory,
            message,
            historyWindow: 6
        });
        // ────────────────────────────────────────────────────────────────────────

        // ── Generate Gemini Response ─────────────────────────────────────────────
        const geminiStart = Date.now();
        const aiResponse = await generateGeminiResponse({ prompt, apikey: geminiApiKey, user });
        console.log(`[askAssistant] Gemini response in ${Date.now() - geminiStart}ms`);
        // ────────────────────────────────────────────────────────────────────────

        // Increment message count for free users
        if (user.plan === "free") {
            user.totalMessages += 1;
            await user.save();
        }

        // Log conversation (async, fire-and-forget)
        const activeSessionId = sessionId || `sess_fallback_${Date.now()}`;
        Conversation.findOneAndUpdate(
            { userId: user._id, sessionId: activeSessionId },
            {
                $push: {
                    messages: [
                        { sender: "user", text: message },
                        { sender: "assistant", text: aiResponse }
                    ]
                }
            },
            { upsert: true }
        ).catch(err => console.error("[askAssistant] Failed to log conversation:", err));

        return res.json({ success: true, aiResponse });

    } catch (error) {
        console.error("[askAssistant] Error:", error);
        return res.status(500).json({ success: false, message: "Assistant AI Error" });
    }
};
