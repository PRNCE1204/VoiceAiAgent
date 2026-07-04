/**
 * EmbeddingService — Abstract base class / interface
 *
 * All embedding provider implementations must extend this class and implement
 * the three abstract methods. This allows swapping providers (Voyage → Gemini,
 * or any future provider) without touching the rest of the application.
 *
 * Usage:
 *   import { getEmbeddingService } from "./embeddingFactory.js";
 *   const svc = getEmbeddingService();
 *   const vector = await svc.embed("Hello world");
 */
export class EmbeddingService {
    /**
     * Generate an embedding vector for a single piece of text.
     * @param {string} text — The input text to embed.
     * @returns {Promise<number[]>} — The embedding vector.
     */
    async embed(text) {
        throw new Error("EmbeddingService.embed() must be implemented by subclass");
    }

    /**
     * Generate embedding vectors for a batch of texts in a single API call.
     * Implementations should use the provider's native batch endpoint when available.
     * @param {string[]} texts — Array of input texts.
     * @returns {Promise<number[][]>} — Array of embedding vectors (same order as input).
     */
    async embedBatch(texts) {
        throw new Error("EmbeddingService.embedBatch() must be implemented by subclass");
    }

    /**
     * Return the output dimension of vectors produced by this provider/model.
     * Used for validation when switching providers to detect dimension mismatches.
     * @returns {number}
     */
    getDimension() {
        throw new Error("EmbeddingService.getDimension() must be implemented by subclass");
    }

    /**
     * Human-readable provider name (e.g. "voyage", "gemini").
     * Stored in chunk metadata for provenance.
     * @returns {string}
     */
    getProviderName() {
        throw new Error("EmbeddingService.getProviderName() must be implemented by subclass");
    }
}
