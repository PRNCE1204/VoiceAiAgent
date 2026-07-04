import { VoyageEmbeddingService } from "./VoyageEmbeddingService.js";
import { GeminiEmbeddingService } from "./GeminiEmbeddingService.js";

/**
 * Embedding Service Factory
 *
 * Selects and returns the configured embedding provider based on the
 * EMBEDDING_PROVIDER environment variable.
 *
 * Configuration:
 *   EMBEDDING_PROVIDER=voyage  → VoyageEmbeddingService (recommended, default)
 *   EMBEDDING_PROVIDER=gemini  → GeminiEmbeddingService (legacy, no new API key needed)
 *
 * The Voyage instance is a singleton — created once and reused across all requests.
 * The Gemini instance requires a per-request API key so it is created fresh each time.
 *
 * Usage:
 *   // For document ingestion (Voyage is singleton, Gemini requires apiKey):
 *   const svc = getEmbeddingService({ geminiApiKey });
 *   const vectors = await svc.embedBatch(chunks);
 *
 *   // For query embedding (use embedQuery for best retrieval quality):
 *   const queryVector = await svc.embedQuery(userMessage);
 */

let _voyageSingleton = null;

/**
 * Returns an EmbeddingService instance for the configured provider.
 *
 * @param {Object} options
 * @param {string} [options.geminiApiKey] — Required when EMBEDDING_PROVIDER=gemini
 * @returns {import("./EmbeddingService.js").EmbeddingService}
 */
export function getEmbeddingService(options = {}) {
    const provider = (process.env.EMBEDDING_PROVIDER || "voyage").toLowerCase();

    if (provider === "voyage") {
        // Voyage is stateless (apiKey from env) — use singleton
        if (!_voyageSingleton) {
            _voyageSingleton = new VoyageEmbeddingService();
        }
        return _voyageSingleton;
    }

    if (provider === "gemini") {
        const { geminiApiKey } = options;
        if (!geminiApiKey) {
            throw new Error(
                "getEmbeddingService: geminiApiKey is required when EMBEDDING_PROVIDER=gemini"
            );
        }
        // Gemini requires a per-user API key — create fresh instance
        return new GeminiEmbeddingService(geminiApiKey);
    }

    throw new Error(
        `getEmbeddingService: Unknown provider "${provider}". Set EMBEDDING_PROVIDER to "voyage" or "gemini".`
    );
}

/**
 * Convenience: get the currently configured provider name without instantiating.
 * @returns {"voyage"|"gemini"}
 */
export function getProviderName() {
    return (process.env.EMBEDDING_PROVIDER || "voyage").toLowerCase();
}
// Trigger reload

