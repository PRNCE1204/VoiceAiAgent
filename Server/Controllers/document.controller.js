import KnowledgeDocument from "../Models/document.model.js";
import ProcessingJob from "../Models/processingJob.model.js";
import KnowledgeChunk from "../Models/chunk.model.js";
import User from "../Models/user.model.js";
import { decrypt } from "../utils/crypto.js";
import { KnowledgeService } from "../Services/KnowledgeService.js";
import { CrawlerService } from "../Services/CrawlerService.js";
import { jobQueue } from "../Services/JobQueue.js";

/**
 * Helper: Get decrypted Gemini API key for a user.
 * Only needed when EMBEDDING_PROVIDER=gemini.
 */
const getGeminiKey = (user) => {
    if (user.geminiApiKey) return decrypt(user.geminiApiKey);
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    return null;
};

/**
 * POST /api/user/document/upload
 * Accepts: multipart/form-data with a single "file" field
 *
 * Supported types: PDF, TXT, DOCX, MD
 *
 * Flow (async):
 *   1. Validate file type
 *   2. Parse file synchronously (extract text)
 *   3. Create KnowledgeDocument record with status="pending"
 *   4. Enqueue background job for chunking + embedding
 *   5. Return immediately with document ID + jobId
 */
export const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const { originalname, buffer } = req.file;
        const fileExtension = originalname.split(".").pop().toLowerCase();

        const SUPPORTED_TYPES = ["pdf", "txt", "docx", "md"];
        if (!SUPPORTED_TYPES.includes(fileExtension)) {
            return res.status(400).json({
                message: `Unsupported file type ".${fileExtension}". Supported: ${SUPPORTED_TYPES.join(", ")}`
            });
        }

        console.log(`[uploadDocument] User ${req.userId} uploading: ${originalname} (${fileExtension})`);

        // Step 1: Parse file (extract text) synchronously before responding
        let parseResult;
        try {
            parseResult = await KnowledgeService.parseFile(buffer, fileExtension);
        } catch (parseErr) {
            console.error("[uploadDocument] Parsing failed:", parseErr.message);
            return res.status(400).json({ message: `Failed to parse file: ${parseErr.message}` });
        }

        if (!parseResult.fullText || parseResult.fullText.trim().length < 20) {
            return res.status(400).json({ message: "Unable to extract meaningful text from this file." });
        }

        // Step 2: Get API key (needed for Gemini embedding provider)
        const user = await User.findById(req.userId);
        const geminiApiKey = getGeminiKey(user);

        // Step 3: Create document record (status=pending)
        const document = await KnowledgeDocument.create({
            userId: req.userId,
            filename: originalname,
            fileType: fileExtension,
            content: parseResult.fullText, // Stored for reprocessing
            status: "pending",
            wordCount: parseResult.wordCount || 0
        });

        // Step 4: Enqueue background ingestion job
        const { jobId } = await jobQueue.enqueue({
            userId: req.userId,
            documentId: document._id.toString(),
            handler: async (job, updateProgress) => {
                return KnowledgeService.ingest({
                    userId: req.userId,
                    documentId: document._id.toString(),
                    parseResult,
                    metadata: {
                        sourceFilename: originalname,
                        fileType: fileExtension
                    },
                    geminiApiKey,
                    onProgress: updateProgress
                });
            }
        });

        // Step 5: Return immediately (don't wait for embedding)
        const docObj = document.toObject();
        delete docObj.content; // Don't send full text back to client

        console.log(`[uploadDocument] Document ${document._id} queued with job ${jobId}`);

        return res.status(201).json({
            message: "Document uploaded and queued for processing",
            document: docObj,
            jobId
        });

    } catch (error) {
        console.error("[uploadDocument] Error:", error);
        return res.status(500).json({ message: `Document upload failed: ${error.message}` });
    }
};

/**
 * POST /api/user/document/scrape
 * Body: { url: string }
 *
 * Flow (async):
 *   1. Validate URL
 *   2. Crawl website (multi-page if configured)
 *   3. Create document record
 *   4. Enqueue embedding job
 *   5. Return immediately
 */
export const scrapeUrl = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ message: "URL is required" });
        }

        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch {
            return res.status(400).json({ message: "Invalid URL format" });
        }

        console.log(`[scrapeUrl] User ${req.userId} scraping: ${url}`);

        // Crawl the website
        const crawler = new CrawlerService();
        let crawledPages;
        try {
            crawledPages = await crawler.crawl(url, {
                maxDepth: 1,  // Crawl start page + 1 level of links by default
                maxPages: 20,
                minContentLength: 150
            });
        } catch (crawlErr) {
            console.error("[scrapeUrl] Crawl failed:", crawlErr.message);
            return res.status(400).json({ message: `Failed to crawl URL: ${crawlErr.message}` });
        }

        if (!crawledPages || crawledPages.length === 0) {
            return res.status(400).json({ message: "No readable content found at this URL." });
        }

        // Convert crawled pages to parse result format
        const parseResult = KnowledgeService.parseScrapedPages(crawledPages);

        if (parseResult.fullText.trim().length < 50) {
            return res.status(400).json({ message: "Scraped page contains insufficient readable text." });
        }

        // Get Gemini key (for Gemini embedding provider)
        const user = await User.findById(req.userId);
        const geminiApiKey = getGeminiKey(user);

        // Build filename from hostname + pathname
        const docFilename = parsedUrl.hostname +
            (parsedUrl.pathname === "/" ? "" : parsedUrl.pathname);

        // Create document record
        const document = await KnowledgeDocument.create({
            userId: req.userId,
            filename: docFilename,
            fileType: "url",
            content: parseResult.fullText,
            status: "pending",
            url: url,
            wordCount: parseResult.wordCount || 0
        });

        // Enqueue embedding job
        const { jobId } = await jobQueue.enqueue({
            userId: req.userId,
            documentId: document._id.toString(),
            handler: async (job, updateProgress) => {
                return KnowledgeService.ingest({
                    userId: req.userId,
                    documentId: document._id.toString(),
                    parseResult,
                    metadata: {
                        sourceFilename: docFilename,
                        fileType: "url",
                        url: url
                    },
                    geminiApiKey,
                    onProgress: updateProgress
                });
            }
        });

        const docObj = document.toObject();
        delete docObj.content;

        console.log(`[scrapeUrl] Document ${document._id} queued with job ${jobId} (${crawledPages.length} pages crawled)`);

        return res.status(201).json({
            message: `Website crawled (${crawledPages.length} page${crawledPages.length !== 1 ? "s" : ""}) and queued for processing`,
            document: docObj,
            jobId,
            pagesCrawled: crawledPages.length
        });

    } catch (error) {
        console.error("[scrapeUrl] Error:", error);
        return res.status(500).json({ message: `Scraping failed: ${error.message}` });
    }
};

/**
 * GET /api/user/documents
 * Returns list of all knowledge sources for the current user (without content).
 */
export const getDocuments = async (req, res) => {
    try {
        const documents = await KnowledgeDocument.find({ userId: req.userId })
            .select("-content") // Exclude large text field
            .sort({ createdAt: -1 });

        return res.status(200).json(documents);
    } catch (error) {
        console.error("[getDocuments] Error:", error);
        return res.status(500).json({ message: "Failed to load documents" });
    }
};

/**
 * DELETE /api/user/document/:docId
 * Deletes a document and all its associated chunks.
 */
export const deleteDocument = async (req, res) => {
    try {
        const { docId } = req.params;

        await KnowledgeService.deleteKnowledgeSource(req.userId, docId);

        return res.status(200).json({ message: "Document and all associated chunks deleted successfully" });
    } catch (error) {
        console.error("[deleteDocument] Error:", error);
        if (error.message.includes("not found") || error.message.includes("access denied")) {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: "Failed to delete document" });
    }
};

/**
 * GET /api/user/document/:docId/status
 * Returns the current processing job status for a document.
 */
export const getDocumentStatus = async (req, res) => {
    try {
        const { docId } = req.params;

        const document = await KnowledgeDocument.findOne({ _id: docId, userId: req.userId })
            .select("status chunkCount wordCount processingJobId errorMessage filename");

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        let jobDetails = null;
        if (document.processingJobId) {
            jobDetails = await ProcessingJob.findById(document.processingJobId)
                .select("status progress stage totalChunks errorMessage startedAt completedAt");
        }

        return res.status(200).json({
            documentId: docId,
            filename: document.filename,
            status: document.status,
            chunkCount: document.chunkCount,
            wordCount: document.wordCount,
            errorMessage: document.errorMessage,
            job: jobDetails
        });

    } catch (error) {
        console.error("[getDocumentStatus] Error:", error);
        return res.status(500).json({ message: "Failed to get document status" });
    }
};

/**
 * POST /api/user/document/:docId/reprocess
 * Re-runs the chunking + embedding pipeline for an existing document.
 * Useful after switching embedding providers.
 */
export const reprocessDocument = async (req, res) => {
    try {
        const { docId } = req.params;

        const user = await User.findById(req.userId);
        const geminiApiKey = getGeminiKey(user);

        const { jobId } = await KnowledgeService.reprocessDocument(req.userId, docId, geminiApiKey);

        return res.status(200).json({
            message: "Document queued for reprocessing",
            jobId
        });

    } catch (error) {
        console.error("[reprocessDocument] Error:", error);
        if (error.message.includes("not found") || error.message.includes("access denied")) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes("already being processed")) {
            return res.status(409).json({ message: error.message });
        }
        return res.status(500).json({ message: `Reprocessing failed: ${error.message}` });
    }
};
