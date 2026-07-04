import User from "../Models/user.model.js";
import Conversation from "../Models/conversation.model.js";
import { decrypt } from "../utils/crypto.js";
import { RetrievalService } from "../Services/RetrievalService.js";
import { PromptBuilder } from "../Services/PromptBuilder.js";
import WebSocket from "ws";

/**
 * Socket.IO streaming handler — Real-time Gemini Multimodal Live API Proxy.
 */
export const handleSocketConnection = (socket, io) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    let geminiWs = null;
    let user = null;
    let geminiApiKey = null;
    let userUtterance = "";
    let assistantUtterance = "";

    // ── Handshake / Connection Initialization ─────────────────────────────────
    const initSession = async () => {
        try {
            const userId = socket.handshake.query.userId;
            const sessionId = socket.handshake.query.sessionId;

            if (!userId) {
                socket.emit("stream-error", { message: "UserId query parameter is required" });
                socket.disconnect();
                return;
            }

            user = await User.findById(userId);
            if (!user) {
                socket.emit("stream-error", { message: "User not found" });
                socket.disconnect();
                return;
            }

            // Get API key
            if (user.geminiApiKey) {
                geminiApiKey = decrypt(user.geminiApiKey);
            } else if (process.env.GEMINI_API_KEY) {
                geminiApiKey = process.env.GEMINI_API_KEY;
            }

            if (!geminiApiKey) {
                socket.emit("stream-error", { message: "Gemini API key is missing" });
                socket.disconnect();
                return;
            }

            // Plan limit checks
            if (user.plan === "free" && user.totalMessages >= user.requestLimit) {
                socket.emit("stream-error", { message: "Free limit reached" });
                socket.disconnect();
                return;
            }

            if (user.plan === "pro" && new Date(user.proExpiresAt) < new Date()) {
                user.plan = "free";
                await user.save();
                socket.emit("stream-error", { message: "Pro plan expired" });
                socket.disconnect();
                return;
            }

            // Establish Gemini WebSocket connection
            const geminiLiveUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${geminiApiKey}`;
            geminiWs = new WebSocket(geminiLiveUrl);

            geminiWs.on("open", () => {
                console.log(`[Socket ${socket.id}] Connected to Gemini Live API`);

                // Send setup message
                const systemInstruction = PromptBuilder._buildSystemBlock(user, { isVoice: true });
                const setupMsg = {
                    setup: {
                        model: "models/gemini-2.5-flash-native-audio-latest",
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            thinkingConfig: {
                                thinkingBudget: 0
                            },
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: "Aoede" // Core choices: Puck, Charon, Kore, Fenrir, Aoede
                                    }
                                }
                            }
                        },
                        systemInstruction: {
                            parts: [
                                { text: systemInstruction }
                            ]
                        },
                        tools: [
                            {
                                functionDeclarations: [
                            {
                                        name: "search_knowledge_base",
                                        description: `MANDATORY: Search the complete Prime Dine restaurant knowledge base. You MUST call this tool before answering any question about: menu items (food, drinks, mocktails, desserts), prices, birthday packages, anniversary packages, custom events, event pricing, restaurant address, phone number, email, opening hours, reservation process, themes, decorations, dietary options (veg/jain/non-veg), cancellation policy, or any other factual detail about ${user.businessName}. Do NOT guess or answer from memory — always search first.`,
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                query: {
                                                    type: "STRING",
                                                    description: "Specific search query. Use relevant keywords. Examples: 'birthday package price', 'mocktail menu', 'address phone number', 'anniversary silver package includes', 'cancellation policy'."
                                                }
                                            },
                                            required: ["query"]
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                };

                geminiWs.send(JSON.stringify(setupMsg));
            });

            geminiWs.on("message", async (data) => {
                try {
                    const message = JSON.parse(data.toString());

                    // 1. Setup complete
                    if (message.setupComplete) {
                        console.log(`[Socket ${socket.id}] Gemini Live setup complete`);
                        socket.emit("agent-ready");
                        return;
                    }

                    // 2. Server response content (Audio / Text)
                    if (message.serverContent) {
                        if (message.serverContent.interrupted) {
                            console.log(`[Socket ${socket.id}] Gemini interrupted response generation`);
                            socket.emit("bot-interrupted");
                            assistantUtterance = "";
                            return;
                        }

                        const modelTurn = message.serverContent.modelTurn;
                        if (modelTurn && modelTurn.parts) {
                            for (const part of modelTurn.parts) {
                                // Text transcript
                                if (part.text) {
                                    assistantUtterance += part.text;
                                    socket.emit("bot-transcript", { text: part.text });
                                }
                                // Audio binary data
                                if (part.inlineData && part.inlineData.mimeType.startsWith("audio/pcm")) {
                                    const audioBuffer = Buffer.from(part.inlineData.data, "base64");
                                    socket.emit("audio-chunk", audioBuffer);
                                }
                            }
                        }

                        if (message.serverContent.turnComplete) {
                            console.log(`[Socket ${socket.id}] Gemini Turn Complete`);
                            socket.emit("bot-done", { fullResponse: assistantUtterance });

                            // Save conversation turn
                            saveTurn(sessionId);
                            assistantUtterance = "";
                        }
                    }

                    // 3. Tool call requested by Gemini
                    if (message.toolCall && message.toolCall.functionCalls) {
                        for (const call of message.toolCall.functionCalls) {
                            if (call.name === "search_knowledge_base") {
                                const { query } = call.args;
                                console.log(`[Socket ${socket.id}] Tool Call: search_knowledge_base for "${query}"`);

                                let retrievalResults = [];
                                try {
                                    retrievalResults = await RetrievalService.retrieve({ userId: user._id.toString(), query, geminiApiKey });
                                } catch (ragErr) {
                                    console.error("RAG Tool Retrieval error:", ragErr.message);
                                }

                                const context = RetrievalService.formatContext(retrievalResults);

                                // Send response back to Gemini
                                const responseMsg = {
                                    toolResponse: {
                                        functionResponses: [
                                            {
                                                name: "search_knowledge_base",
                                                id: call.id,
                                                response: { output: context || "No relevant information found." }
                                            }
                                        ]
                                    }
                                };
                                if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
                                    geminiWs.send(JSON.stringify(responseMsg));
                                }
                            }
                        }
                    }

                    // 4. Interruption / Tool Cancellation
                    if (message.toolCallCancellation) {
                        console.log(`[Socket ${socket.id}] Gemini cancelled tool call / response generation`);
                        socket.emit("bot-interrupted");
                        assistantUtterance = "";
                    }

                } catch (err) {
                    console.error("Error handling Gemini WS message:", err);
                }
            });

            geminiWs.on("error", (error) => {
                console.error(`[Socket ${socket.id}] Gemini WS error:`, error);
                socket.emit("stream-error", { message: "Gemini connection error" });
            });

            geminiWs.on("close", (code, reason) => {
                console.log(`[Socket ${socket.id}] Gemini WS connection closed. Code: ${code}, Reason: ${reason ? reason.toString() : "None"}`);
            });

        } catch (err) {
            console.error("Failed to initialize session:", err);
            socket.emit("stream-error", { message: "Internal server error" });
            socket.disconnect();
        }
    };

    const saveTurn = (sessionId) => {
        if (!user || (!userUtterance && !assistantUtterance)) return;

        const activeSessionId = sessionId || `sess_fallback_${Date.now()}`;
        Conversation.findOneAndUpdate(
            { userId: user._id, sessionId: activeSessionId },
            {
                $push: {
                    messages: [
                        { sender: "user", text: userUtterance || "Voice input" },
                        { sender: "assistant", text: assistantUtterance }
                    ]
                }
            },
            { upsert: true }
        )
        .then(() => {
            userUtterance = ""; // reset after saving
        })
        .catch(err => console.error("[Socket] Failed to save conversation turn:", err));

        // Increment message counter for free users
        if (user.plan === "free") {
            user.totalMessages += 1;
            user.save().catch(err => console.error("Failed to save user limits:", err));
        }
    };

    initSession();

    // ── Client events forwarding ──────────────────────────────────────────────
    socket.on("audio-chunk", (data) => {
        // data is binary raw 16kHz 16-bit PCM audio buffer from client
        if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            const base64Audio = data.toString("base64");
            const clientMsg = {
                realtimeInput: {
                    mediaChunks: [
                        {
                            mimeType: "audio/pcm;rate=16000",
                            data: base64Audio
                        }
                    ]
                }
            };
            geminiWs.send(JSON.stringify(clientMsg));
        }
    });

    socket.on("user-transcript", (data) => {
        // Save the transcribed user voice message from the browser SpeechRecognition in parallel
        if (data && data.text) {
            userUtterance = data.text;
        }
    });

    socket.on("stop-generation", () => {
        // Send empty content or tell Gemini to stop if user interrupts manually
        console.log(`[Socket ${socket.id}] User manually interrupted playback`);
        if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            // Sending a client content turn complete can help reset turn
            const stopMsg = {
                clientContent: {
                    turns: [],
                    turnComplete: true
                }
            };
            geminiWs.send(JSON.stringify(stopMsg));
        }
    });

    socket.on("stop-recording", () => {
        console.log(`[Socket ${socket.id}] User stopped recording manually. Requesting response.`);
        if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            const stopMsg = {
                clientContent: {
                    turns: [],
                    turnComplete: true
                }
            };
            geminiWs.send(JSON.stringify(stopMsg));
        }
    });

    socket.on("start-recording", async () => {
        console.log(`[Socket ${socket.id}] User started recording`);
        if (!geminiWs || geminiWs.readyState !== WebSocket.OPEN) {
            console.log(`[Socket ${socket.id}] Gemini WS connection not open. Re-initializing session...`);
            if (geminiWs) {
                try {
                    geminiWs.close();
                } catch (e) {}
                geminiWs = null;
            }
            await initSession();
        }
    });

    socket.on("disconnect", () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
        if (geminiWs) {
            try {
                geminiWs.close();
            } catch (err) {
                // ignore
            }
        }
    });
};
