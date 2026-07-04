import { EmbeddingService } from "./EmbeddingService.js";

/**
 * VoyageEmbeddingService
 *
 * Implements EmbeddingService using the Voyage AI REST API.
 * Voyage AI provides state-of-the-art embedding models optimized for retrieval.
 *
 * Configuration (via environment variables):
 *   VOYAGE_API_KEY          — Required. Your Voyage AI API key from https://www.voyageai.com
 *   VOYAGE_EMBEDDING_MODEL  — Optional. Defaults to "voyage-3-lite" (512-dim, fastest/cheapest).
 *                             Other options: "voyage-3" (1024-dim), "voyage-3-large" (2048-dim)
 *
 * Model Dimensions:
 *   voyage-3-lite  → 512
 *   voyage-3       → 1024
 *   voyage-3-large → 2048
 *
 * Pricing (as of 2024): ~$0.02 per 1M tokens on free tier (50M tokens/month free)
 *
 * Batch API: Voyage supports up to 128 texts per batch request. We use this for
 * efficient bulk embedding during document ingestion.
 */
export class VoyageEmbeddingService extends EmbeddingService {
    constructor() {
        super();
        this.apiKey = process.env.VOYAGE_API_KEY;
        this.model = process.env.VOYAGE_EMBEDDING_MODEL || "voyage-3-lite";
        this.baseUrl = "https://api.voyageai.com/v1/embeddings";

        // Dimension lookup table
        this._dimensionMap = {
            "voyage-3-lite": 512,
            "voyage-3": 1024,
            "voyage-3-large": 2048,
            "voyage-2": 1024,
            "voyage-2-lite": 384
        };

        if (!this.apiKey) {
            console.warn("[VoyageEmbeddingService] VOYAGE_API_KEY is not set. Embedding calls will fail.");
        }

        console.log(`[VoyageEmbeddingService] Initialized with model: ${this.model} (${this.getDimension()}-dim)`);
    }

    /**
     * Embed a single text string.
     */
    async embed(text) {
        if (!text || typeof text !== "string") {
            throw new Error("VoyageEmbeddingService.embed: text must be a non-empty string");
        }
        const vectors = await this.embedBatch([text]);
        return vectors[0];
    }

    /**
     * Embed multiple texts in a single API call (up to 128 per request).
     * Automatically batches larger inputs into multiple requests.
     */
    async embedBatch(texts) {
        if (!Array.isArray(texts) || texts.length === 0) {
            throw new Error("VoyageEmbeddingService.embedBatch: texts must be a non-empty array");
        }
        if (!this.apiKey) {
            throw new Error("VOYAGE_API_KEY environment variable is not configured");
        }

        const MAX_BATCH = 128;
        const allEmbeddings = [];

        // Split into batches of MAX_BATCH
        for (let i = 0; i < texts.length; i += MAX_BATCH) {
            const batch = texts.slice(i, i + MAX_BATCH);
            const batchEmbeddings = await this._callVoyageAPI(batch);
            allEmbeddings.push(...batchEmbeddings);
        }

        return allEmbeddings;
    }

    /**
     * Make a single Voyage AI API call for a batch of texts.
     * @private
     */
    async _callVoyageAPI(texts) {
        const startTime = Date.now();

        const response = await fetch(this.baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                input: texts,
                input_type: "document" // "document" for ingestion, "query" for retrieval
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Voyage AI API error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const latency = Date.now() - startTime;

        console.log(`[VoyageEmbeddingService] Embedded ${texts.length} texts in ${latency}ms`);

        // Voyage returns data.data[i].embedding — ensure order is preserved
        return data.data
            .sort((a, b) => a.index - b.index)
            .map(item => item.embedding);
    }

    /**
     * Embed a query string (uses query input_type for better retrieval quality).
     * Use this for user questions, not for document ingestion.
     */
    async embedQuery(text) {
        if (!this.apiKey) {
            throw new Error("VOYAGE_API_KEY environment variable is not configured");
        }

        const response = await fetch(this.baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                input: [text],
                input_type: "query" // asymmetric retrieval: query vs document
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Voyage AI API error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
    }

    getDimension() {
        return this._dimensionMap[this.model] || 512;
    }

    getProviderName() {
        return "voyage";
    }
}
