/**
 * PromptBuilder
 *
 * Constructs the final LLM prompt by assembling:
 *   1. System instructions (persona, business context, tone rules)
 *   2. Retrieved knowledge context (from RetrievalService)
 *   3. Conversation history (windowed to last N turns)
 *   4. User question
 *
 * Key behaviors:
 *   - If context is available, the LLM is instructed to answer from it
 *   - If context is empty, the LLM responds from business description only
 *   - If neither has the answer, the LLM is instructed to say so honestly
 *   - Voice mode gets a conciseness override (≤15 words for audio playback)
 *   - Conversation history is windowed to stay within token limits
 */
export class PromptBuilder {
    /**
     * Build a chat prompt for HTTP REST chat endpoint.
     *
     * @param {Object} params
     * @param {Object} params.user — Mongoose User document
     * @param {string} params.context — Formatted context string from RetrievalService.formatContext()
     * @param {Array<{ sender: string, text: string }>} [params.conversationHistory=[]] — Recent messages
     * @param {string} params.message — Current user message
     * @param {number} [params.historyWindow=6] — Max messages from history to include
     * @returns {string} — Complete prompt string ready for Gemini
     */
    static buildChatPrompt({ user, context, conversationHistory = [], message, historyWindow = 6 }) {
        const systemBlock = PromptBuilder._buildSystemBlock(user);
        const contextBlock = PromptBuilder._buildContextBlock(context);
        const historyBlock = PromptBuilder._buildHistoryBlock(conversationHistory, historyWindow);
        const questionBlock = `User Question:\n${message}`;

        return [systemBlock, contextBlock, historyBlock, questionBlock]
            .filter(Boolean)
            .join("\n\n");
    }

    /**
     * Build a voice prompt — identical RAG pipeline but with brevity constraints.
     * Voice requires short responses (≤15 words) for audio playback.
     *
     * @param {Object} params — Same as buildChatPrompt
     * @returns {string}
     */
    static buildVoicePrompt({ user, context, conversationHistory = [], message, historyWindow = 4 }) {
        const systemBlock = PromptBuilder._buildSystemBlock(user, { isVoice: true });
        const contextBlock = PromptBuilder._buildContextBlock(context);
        const historyBlock = PromptBuilder._buildHistoryBlock(conversationHistory, historyWindow);
        const questionBlock = `User Question:\n${message}`;

        return [systemBlock, contextBlock, historyBlock, questionBlock]
            .filter(Boolean)
            .join("\n\n");
    }

    /**
     * System instructions block.
     * @private
     */
    static _buildSystemBlock(user, options = {}) {
        const { isVoice = false } = options;

        const voiceRules = isVoice
            ? `- Speak conversationally, warmly, and naturally — you are a live voice concierge for a premium restaurant
- Keep responses concise (1 to 3 sentences) but NEVER cut off important details like prices, package names, or contact info
- Do NOT use markdown, bullet points, headers, or numbered lists — they sound unnatural when spoken aloud
- Speak directly to the caller with warmth and hospitality
- When asked about menu items, always mention the price if you have it from the knowledge base
- When asked about events or packages, always mention the starting price and what is included
- Use light, natural phrases like "Of course!", "Absolutely!", "Great choice!" to keep the conversation warm
- If the user is interested in booking, guide them through it step by step — ask one question at a time
- Always end your response with a helpful follow-up question or offer to assist further`
            : `- Keep replies concise and natural
- Avoid unnecessary verbosity
- Use markdown sparingly`;

        const toolInstruction = isVoice
            ? `

⚠️ CRITICAL TOOL USAGE RULE — READ CAREFULLY:
You have access to the \`search_knowledge_base\` tool. This tool searches the complete restaurant knowledge base.

You MUST call \`search_knowledge_base\` BEFORE answering ANY question about:
- Menu items, dishes, food, drinks, mocktails, prices, cuisine types
- Birthday packages, anniversary packages, event packages, pricing
- Restaurant address, location, phone number, email, hours
- Reservation process, booking process, table reservations
- Event types, themes, decorations, add-ons, entertainment
- Restaurant policies (cancellation, delivery, dietary options)
- Anything about the restaurant, business, or its services

Do NOT try to answer these questions from memory — ALWAYS call the tool first. Only answer from what the tool returns.
If the tool returns no results, say: "Let me connect you with our team at +91 85117 27429 who can give you the exact details."
The ONLY exception is when the user says hello/hi or asks a completely off-topic general knowledge question.`
            : ``;

        return `You are ${user.assistantName}, a warm and professional AI voice concierge for ${user.businessName}.

Business Name: ${user.businessName}
Business Type: ${user.businessType}
Business Description: ${user.businessDescription}
Assistant Tone: ${user.tone}

Core Rules:
- NEVER fabricate menu items, prices, package details, or policies — only use what the knowledge base returns
- NEVER claim Prime Dine offers food delivery or home delivery — it is strictly a dine-in restaurant and event venue
- If you genuinely cannot find the answer after calling the tool, direct the caller to call +91 85117 27429 or email events@primedine.com
- Stay in character as ${user.assistantName} at all times — warm, premium, and hospitality-focused
${voiceRules}${toolInstruction}`;
    }

    /**
     * Retrieved knowledge context block.
     * @private
     */
    static _buildContextBlock(context) {
        if (!context || context.trim() === "") {
            return `Knowledge Context:\n[No relevant knowledge found for this query. Answer from business description only.]`;
        }

        return `Knowledge Context (retrieved from your knowledge base — use this to answer):\n${context}`;
    }

    /**
     * Conversation history block — windowed to last N messages.
     * @private
     */
    static _buildHistoryBlock(history, windowSize) {
        if (!history || history.length === 0) return "";

        // Take the last `windowSize` messages
        const recent = history.slice(-windowSize);

        const formatted = recent
            .map(msg => `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.text}`)
            .join("\n");

        return `Conversation History:\n${formatted}`;
    }
}
