import KnowledgeChunk from "../Models/chunk.model.js";
import { getEmbeddingService } from "./embeddingFactory.js";
import { cosineSimilarity } from "../utils/vector.js";

/**
 * RetrievalService
 *
 * Handles the retrieval step of the RAG pipeline:
 *   1. Embed the user's query via the configured EmbeddingService
 *   2. Search only this assistant's chunks (scoped by userId)
 *   3. Score results by cosine similarity
 *   4. Filter by similarity threshold
 *   5. Return top-K results with source metadata
 *   6. Optional: pass through reranker (when ENABLE_RERANKING=true)
 *
 * Security:
 *   All queries are scoped to userId — a customer can NEVER retrieve
 *   another customer's knowledge base data.
 *
 * Usage:
 *   const results = await RetrievalService.retrieve({
 *     userId, query: "What is your return policy?",
 *     geminiApiKey  // only needed when EMBEDDING_PROVIDER=gemini
 *   });
 *   // results: [{ text, score, chunkIndex, metadata }]
 */
export class RetrievalService {
    /**
     * Retrieve relevant chunks for a user query.
     *
     * @param {Object} params
     * @param {string} params.userId — Scopes search to this user's knowledge
     * @param {string} params.query — The user's question or message
     * @param {string|null} [params.geminiApiKey] — Required when EMBEDDING_PROVIDER=gemini
     * @param {number} [params.maxResults=5] — Max chunks to return after filtering
     * @param {number} [params.similarityThreshold=0.4] — Min cosine similarity score
     * @param {boolean} [params.includeMetadata=true] — Include source metadata in results
     * @returns {Promise<Array<{ text: string, score: number, chunkIndex: number, metadata: Object }>>}
     */
    static async retrieve(params) {
        const {
            userId,
            query,
            geminiApiKey = null,
            maxResults = 8,
            similarityThreshold = 0.3,
            includeMetadata = true
        } = params;

        if (!userId || !query) {
            throw new Error("RetrievalService.retrieve: userId and query are required");
        }

        const startTime = Date.now();

        // Step 1: Embed the query (use embedQuery for asymmetric retrieval quality)
        let queryVector;
        try {
            const embeddingService = getEmbeddingService({ geminiApiKey });

            // Use embedQuery if available (Voyage AI), fall back to embed()
            if (typeof embeddingService.embedQuery === "function") {
                queryVector = await embeddingService.embedQuery(query);
            } else {
                queryVector = await embeddingService.embed(query);
            }
        } catch (err) {
            console.error(`[RetrievalService] Query embedding failed: ${err.message}`);
            throw new Error(`Failed to embed query: ${err.message}`);
        }

        const embedLatency = Date.now() - startTime;

        // Step 2: Fetch all chunks for this user
        // Note: For very large knowledge bases (>100k chunks), this should use
        // a dedicated vector database (Qdrant, Pinecone) instead.
        // MongoDB $vectorSearch (Atlas) can also be used as an upgrade path.
        const searchStart = Date.now();
        const chunks = await KnowledgeChunk.find({ userId })
            .select("text embedding chunkIndex metadata")
            .lean(); // lean() for performance — no Mongoose overhead

        if (!chunks || chunks.length === 0) {
            console.log(`[RetrievalService] No chunks found for userId ${userId}`);
            return [];
        }

        // Step 3: Score all chunks by cosine similarity
        const scored = chunks.map(chunk => ({
            text: chunk.text,
            score: cosineSimilarity(queryVector, chunk.embedding),
            chunkIndex: chunk.chunkIndex || 0,
            metadata: chunk.metadata || {}
        }));

        // Step 4: Sort descending by score, filter by threshold, take top N
        let results = scored
            .sort((a, b) => b.score - a.score)
            .filter(r => r.score >= similarityThreshold)
            .slice(0, maxResults);

        const searchLatency = Date.now() - searchStart;
        const totalLatency = Date.now() - startTime;

        console.log(
            `[RetrievalService] Retrieved ${results.length}/${chunks.length} chunks ` +
            `| embed: ${embedLatency}ms | search: ${searchLatency}ms | total: ${totalLatency}ms ` +
            `| best: ${results[0]?.score.toFixed(3) ?? "n/a"}`
        );

        // Step 5: Optional reranking (when ENABLE_RERANKING=true)
        if (process.env.ENABLE_RERANKING === "true" && results.length > 1) {
            try {
                const { VoyageRerankService } = await import("./VoyageRerankService.js");
                results = await VoyageRerankService.rerank({
                    query,
                    documents: results,
                    topK: maxResults
                });
                console.log(`[RetrievalService] Reranked to ${results.length} results`);
            } catch (err) {
                console.warn(`[RetrievalService] Reranking failed, using pre-rank results: ${err.message}`);
            }
        }

        if (!includeMetadata) {
            return results.map(r => ({ text: r.text, score: r.score }));
        }

        return results;
    }

    /**
     * Format retrieved chunks into a context string for prompt injection.
     * Each chunk is labeled with its source and score for transparency.
     *
     * @param {Array<{ text: string, score: number, metadata: Object }>} retrievalResults
     * @returns {string} — Formatted context block
     */
    static formatContext(retrievalResults) {
        if (!retrievalResults || retrievalResults.length === 0) {
            return "";
        }

        return retrievalResults
            .map((result, idx) => {
                const source = result.metadata?.sourceFilename
                    || result.metadata?.url
                    || "Knowledge Base";
                const page = result.metadata?.pageNumber
                    ? ` (Page ${result.metadata.pageNumber})`
                    : "";
                return `[Source ${idx + 1}: ${source}${page}]\n${result.text}`;
            })
            .join("\n\n---\n\n");
    }
}
