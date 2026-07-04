import KnowledgeDocument from "../Models/document.model.js";
import KnowledgeChunk from "../Models/chunk.model.js";
import { chunkTextRich, chunkPages } from "../utils/splitter.js";
import { getEmbeddingService, getProviderName } from "./embeddingFactory.js";
import { jobQueue } from "./JobQueue.js";

// Parsers
import { PdfParser } from "./parsers/PdfParser.js";
import { TxtParser } from "./parsers/TxtParser.js";
import { MarkdownParser } from "./parsers/MarkdownParser.js";
import { DocxParser } from "./parsers/DocxParser.js";

/**
 * KnowledgeService
 *
 * Central orchestrator for the RAG knowledge ingestion pipeline.
 *
 * Responsibilities:
 *   - Route file buffers to the correct parser
 *   - Chunk extracted text with rich metadata
 *   - Batch embed chunks via the configured EmbeddingService
 *   - Store chunks in MongoDB with full metadata
 *   - Update document stats (chunkCount, wordCount, status)
 *   - Provide reprocessing (delete old chunks, re-run pipeline)
 *
 * All embedding-heavy work runs inside JobQueue handlers (non-blocking).
 */
export class KnowledgeService {
    /**
     * Parse a file buffer into a standard parse result.
     *
     * @param {Buffer} buffer — Raw file bytes
     * @param {string} fileType — "pdf" | "txt" | "docx" | "md"
     * @returns {Promise<{ fullText: string, pages: Array<{ pageNumber, text }>, wordCount: number }>}
     */
    static async parseFile(buffer, fileType) {
        switch (fileType.toLowerCase()) {
            case "pdf": {
                const parser = new PdfParser();
                return parser.parse(buffer);
            }
            case "txt": {
                const parser = new TxtParser();
                return parser.parse(buffer); // sync
            }
            case "md":
            case "markdown": {
                const parser = new MarkdownParser();
                return parser.parse(buffer); // sync
            }
            case "docx": {
                const parser = new DocxParser();
                return parser.parse(buffer);
            }
            default:
                throw new Error(`KnowledgeService: Unsupported file type "${fileType}"`);
        }
    }

    /**
     * Parse scraped web page text into standard parse result format.
     * Crawler already returns clean text, so this just wraps it.
     *
     * @param {{ url: string, title: string, text: string }[]} crawledPages
     * @returns {{ fullText: string, pages: Array<{ pageNumber, text }>, wordCount: number }}
     */
    static parseScrapedPages(crawledPages) {
        // Concatenate all pages into one document (each page = one "section")
        const fullText = crawledPages
            .map(p => `## ${p.title || p.url}\n\n${p.text}`)
            .join("\n\n---\n\n");

        const wordCount = fullText.split(/\s+/).filter(Boolean).length;

        // Each crawled page becomes a numbered "page" for metadata
        const pages = crawledPages.map((p, i) => ({
            pageNumber: i + 1,
            text: p.text,
            url: p.url,
            title: p.title
        }));

        return { fullText, pages, wordCount };
    }

    /**
     * Ingest a parsed document: chunk → embed → store.
     * This is designed to run INSIDE a JobQueue handler for non-blocking operation.
     *
     * @param {Object} params
     * @param {string} params.userId
     * @param {string} params.documentId
     * @param {{ fullText: string, pages: Array<{pageNumber, text}>, wordCount: number }} params.parseResult
     * @param {{ sourceFilename: string, fileType: string, url?: string }} params.metadata
     * @param {string|null} [params.geminiApiKey] — Required when EMBEDDING_PROVIDER=gemini
     * @param {Function} [params.onProgress] — async (progress: 0-100, stage: string) => void
     * @returns {Promise<{ totalChunks: number }>}
     */
    static async ingest({ userId, documentId, parseResult, metadata, geminiApiKey, onProgress }) {
        const report = onProgress || (async () => {});

        await report(5, "Chunking text");
        console.log(`[KnowledgeService] Starting ingestion for doc ${documentId}`);

        // Update wordCount on document
        await KnowledgeDocument.findByIdAndUpdate(documentId, {
            wordCount: parseResult.wordCount
        });

        // Step 1: Chunk the text (page-aware if multiple pages available)
        let richChunks;
        if (parseResult.pages && parseResult.pages.length > 1) {
            richChunks = chunkPages(parseResult.pages, { chunkSize: 800, overlap: 200 });
        } else {
            richChunks = chunkTextRich(parseResult.fullText, { chunkSize: 800, overlap: 200 });
        }

        if (richChunks.length === 0) {
            throw new Error("No usable text chunks could be extracted from this document.");
        }

        console.log(`[KnowledgeService] Doc ${documentId}: ${richChunks.length} chunks generated`);
        await report(15, `Chunking complete (${richChunks.length} chunks)`);

        // Step 2: Get embedding service
        const embeddingService = getEmbeddingService({ geminiApiKey });
        const providerName = embeddingService.getProviderName();

        // Step 3: Batch embed all chunk texts
        const chunkTexts = richChunks.map(c => c.text);
        await report(20, "Generating embeddings");

        const startEmbedTime = Date.now();
        let embeddings;
        try {
            // Use embedBatch for efficient bulk embedding
            embeddings = await embeddingService.embedBatch(chunkTexts);
            console.log(`[KnowledgeService] Embedded ${richChunks.length} chunks in ${Date.now() - startEmbedTime}ms`);
        } catch (err) {
            throw new Error(`Embedding generation failed: ${err.message}`);
        }

        await report(75, "Storing chunks");

        // Step 4: Bulk insert chunks into MongoDB
        const uploadedAt = new Date();
        const chunkDocs = richChunks.map((chunk, i) => ({
            userId,
            documentId,
            text: chunk.text,
            embedding: embeddings[i],
            chunkIndex: chunk.chunkIndex,
            metadata: {
                sourceFilename: metadata.sourceFilename || "",
                fileType: metadata.fileType || "",
                pageNumber: chunk.pageNumber || null,
                url: metadata.url || null,
                chunkOrder: chunk.chunkIndex,
                uploadedAt,
                embeddingProvider: providerName
            }
        }));

        // Delete any existing chunks for this document (for reprocessing)
        await KnowledgeChunk.deleteMany({ documentId });

        // Bulk insert
        await KnowledgeChunk.insertMany(chunkDocs);

        await report(95, "Finalizing");
        console.log(`[KnowledgeService] ✓ Ingested ${chunkDocs.length} chunks for doc ${documentId}`);

        return { totalChunks: chunkDocs.length };
    }

    /**
     * Delete all knowledge data for a document (chunks + document record).
     *
     * @param {string} userId
     * @param {string} documentId
     */
    static async deleteKnowledgeSource(userId, documentId) {
        // Verify ownership
        const doc = await KnowledgeDocument.findOne({ _id: documentId, userId });
        if (!doc) {
            throw new Error("Document not found or access denied");
        }

        await KnowledgeChunk.deleteMany({ documentId });
        await KnowledgeDocument.deleteOne({ _id: documentId });

        console.log(`[KnowledgeService] Deleted document ${documentId} and all associated chunks`);
    }

    /**
     * Queue a reprocessing job for an existing document.
     * Deletes old chunks and re-runs the full ingestion pipeline.
     *
     * @param {string} userId
     * @param {string} documentId
     * @param {string|null} geminiApiKey
     * @returns {Promise<{ jobId: string }>}
     */
    static async reprocessDocument(userId, documentId, geminiApiKey) {
        const doc = await KnowledgeDocument.findOne({ _id: documentId, userId });
        if (!doc) {
            throw new Error("Document not found or access denied");
        }

        if (doc.status === "processing" || doc.status === "pending") {
            throw new Error("Document is already being processed. Please wait.");
        }

        if (!doc.content) {
            throw new Error("Original document content is no longer available for reprocessing.");
        }

        // Determine fileType
        const fileType = doc.fileType || "txt";

        // Re-enqueue the ingestion job
        const { jobId } = await jobQueue.enqueue({
            userId,
            documentId,
            handler: async (job, updateProgress) => {
                // For reprocessing, we have the content stored as text
                const parseResult = {
                    fullText: doc.content,
                    pages: [{ pageNumber: 1, text: doc.content }],
                    wordCount: doc.content.split(/\s+/).filter(Boolean).length
                };

                const metadata = {
                    sourceFilename: doc.filename,
                    fileType: doc.fileType,
                    url: doc.url || null
                };

                return KnowledgeService.ingest({
                    userId,
                    documentId,
                    parseResult,
                    metadata,
                    geminiApiKey,
                    onProgress: updateProgress
                });
            }
        });

        return { jobId };
    }
}
