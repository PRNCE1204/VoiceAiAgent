/**
 * VoyageRerankService
 *
 * Optional reranker using Voyage AI's /rerank endpoint.
 * Activated when ENABLE_RERANKING=true is set in environment.
 *
 * Reranking improves retrieval quality by using a cross-encoder model
 * that scores (query, document) pairs jointly — more accurate than
 * bi-encoder cosine similarity alone.
 *
 * Configuration:
 *   VOYAGE_API_KEY      — Same key as VoyageEmbeddingService
 *   VOYAGE_RERANK_MODEL — Optional, defaults to "rerank-2-lite"
 *   ENABLE_RERANKING    — Must be "true" to activate
 *
 * Pipeline:
 *   Vector Search (top N=15)
 *     → VoyageRerankService.rerank(query, topN, K=5)
 *     → Returns top K results in new relevance order
 */
export class VoyageRerankService {
    /**
     * Rerank a set of retrieved documents for a given query.
     *
     * @param {Object} params
     * @param {string} params.query — The user's query
     * @param {Array<{ text: string, score: number, metadata: Object }>} params.documents — Pre-retrieved chunks
     * @param {number} [params.topK=5] — How many results to return after reranking
     * @returns {Promise<Array<{ text: string, score: number, metadata: Object, rerankScore: number }>>}
     */
    static async rerank({ query, documents, topK = 5 }) {
        const apiKey = process.env.VOYAGE_API_KEY;
        const model = process.env.VOYAGE_RERANK_MODEL || "rerank-2-lite";

        if (!apiKey) {
            throw new Error("VOYAGE_API_KEY is not configured — cannot use reranker");
        }

        if (!documents || documents.length === 0) {
            return [];
        }

        const startTime = Date.now();

        const response = await fetch("https://api.voyageai.com/v1/rerank", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                query,
                documents: documents.map(d => d.text),
                model,
                top_k: Math.min(topK, documents.length),
                return_documents: false // We already have the text
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Voyage rerank error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const latency = Date.now() - startTime;

        console.log(`[VoyageRerankService] Reranked ${documents.length} docs → top ${topK} in ${latency}ms`);

        // Map reranked indices back to original documents
        return data.data.map(item => ({
            ...documents[item.index],
            rerankScore: item.relevance_score
        }));
    }
}
