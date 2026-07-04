import { EmbeddingService } from "./EmbeddingService.js";

/**
 * GeminiEmbeddingService
 *
 * Implements EmbeddingService using Google Gemini's text-embedding-004 model.
 * This is the existing embedding provider used in the project.
 *
 * Configuration:
 *   geminiApiKey — passed per-call (decrypted from user's stored key or env fallback)
 *
 * Model: text-embedding-004
 * Dimensions: 768
 *
 * Note: Gemini does not support native batch embedding — each text requires
 * a separate API call. For large documents, this is slower than Voyage AI.
 * We fan out with Promise.all but with a concurrency limit to avoid rate limits.
 */
export class GeminiEmbeddingService extends EmbeddingService {
    /**
     * @param {string} apiKey — Decrypted Gemini API key
     */
    constructor(apiKey) {
        super();
        this.apiKey = apiKey;
        this.embeddingUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";
        this.MAX_CONCURRENCY = 5; // Limit parallel Gemini calls to avoid quota errors
    }

    /**
     * Embed a single text string.
     */
    async embed(text) {
        if (!this.apiKey) {
            throw new Error("Gemini API key is not configured");
        }

        const response = await fetch(`${this.embeddingUrl}?key=${this.apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "models/gemini-embedding-001",
                content: { parts: [{ text }] }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini embedding error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        return data.embedding.values;
    }

    /**
     * Embed multiple texts with controlled concurrency.
     * Gemini has no batch endpoint, so we fan out with a concurrency limit.
     */
    async embedBatch(texts) {
        if (!this.apiKey) {
            throw new Error("Gemini API key is not configured");
        }

        const results = new Array(texts.length);
        const queue = texts.map((text, index) => ({ text, index }));

        // Process in chunks of MAX_CONCURRENCY
        for (let i = 0; i < queue.length; i += this.MAX_CONCURRENCY) {
            const chunk = queue.slice(i, i + this.MAX_CONCURRENCY);
            const embeddings = await Promise.all(
                chunk.map(({ text }) => this.embed(text))
            );
            chunk.forEach(({ index }, j) => {
                results[index] = embeddings[j];
            });
        }

        return results;
    }

    /**
     * Gemini uses the same model for queries and documents.
     * Provided for interface compatibility with VoyageEmbeddingService.
     */
    async embedQuery(text) {
        return this.embed(text);
    }

    getDimension() {
        return 3072;
    }

    getProviderName() {
        return "gemini";
    }
}
