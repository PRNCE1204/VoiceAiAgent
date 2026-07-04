import ProcessingJob from "../Models/processingJob.model.js";
import KnowledgeDocument from "../Models/document.model.js";

/**
 * JobQueue — In-Process Async Job Queue
 *
 * A simple, Redis-free async job queue that processes embedding jobs in the background.
 * Jobs are serialized (one per user at a time) to avoid hammering embedding API rate limits.
 *
 * Architecture:
 *   - Jobs are stored in MongoDB (ProcessingJob collection) for persistence & polling
 *   - An in-memory queue drives actual processing
 *   - One global worker processes jobs sequentially
 *   - Jobs survive server restarts (pending jobs are re-enqueued on startup)
 *
 * Usage:
 *   import { jobQueue } from "./JobQueue.js";
 *   const job = await jobQueue.enqueue({ userId, documentId, handler });
 *   // job.id → poll /api/user/document/:docId/status
 */
class JobQueue {
    constructor() {
        this._queue = [];
        this._processing = false;
        this._handlers = new Map(); // jobId → async handler function
    }

    /**
     * Add a job to the queue.
     *
     * @param {Object} params
     * @param {string} params.userId — MongoDB ObjectId string
     * @param {string} params.documentId — MongoDB ObjectId string
     * @param {Function} params.handler — async function(job) that does the actual work
     * @returns {Promise<{ jobId: string }>}
     */
    async enqueue({ userId, documentId, handler }) {
        // Create persistent job record in MongoDB
        const job = await ProcessingJob.create({
            userId,
            documentId,
            status: "pending",
            stage: "Queued",
            progress: 0
        });

        // Update document to link to this job and set status to pending
        await KnowledgeDocument.findByIdAndUpdate(documentId, {
            processingJobId: job._id,
            status: "pending"
        });

        // Register handler and push to in-memory queue
        this._handlers.set(job._id.toString(), handler);
        this._queue.push(job._id.toString());

        console.log(`[JobQueue] Enqueued job ${job._id} for document ${documentId}`);

        // Start processing if idle
        this._process();

        return { jobId: job._id.toString() };
    }

    /**
     * Internal: process jobs from the queue sequentially.
     * @private
     */
    async _process() {
        if (this._processing || this._queue.length === 0) return;

        this._processing = true;
        const jobId = this._queue.shift();
        const handler = this._handlers.get(jobId);

        if (!handler) {
            console.warn(`[JobQueue] No handler for job ${jobId}`);
            this._processing = false;
            this._process();
            return;
        }

        try {
            // Load job from DB
            const job = await ProcessingJob.findById(jobId);
            if (!job) {
                console.warn(`[JobQueue] Job ${jobId} not found in DB`);
                this._processing = false;
                this._process();
                return;
            }

            // Mark as processing
            job.status = "processing";
            job.stage = "Starting";
            job.startedAt = new Date();
            job.progress = 0;
            await job.save();

            await KnowledgeDocument.findByIdAndUpdate(job.documentId, {
                status: "processing"
            });

            // Create a progress reporter the handler can call
            const updateProgress = async (progress, stage) => {
                job.progress = progress;
                job.stage = stage;
                await job.save();
                console.log(`[JobQueue] Job ${jobId}: ${stage} (${progress}%)`);
            };

            // Execute the handler
            const result = await handler(job, updateProgress);

            // Mark as completed
            job.status = "completed";
            job.stage = "Done";
            job.progress = 100;
            job.completedAt = new Date();
            if (result?.totalChunks !== undefined) {
                job.totalChunks = result.totalChunks;
            }
            await job.save();

            await KnowledgeDocument.findByIdAndUpdate(job.documentId, {
                status: "synced",
                chunkCount: result?.totalChunks || 0,
                errorMessage: null
            });

            console.log(`[JobQueue] ✓ Job ${jobId} completed (${result?.totalChunks || 0} chunks)`);

        } catch (err) {
            console.error(`[JobQueue] ✗ Job ${jobId} failed:`, err.message);

            // Mark as failed in DB
            try {
                await ProcessingJob.findByIdAndUpdate(jobId, {
                    status: "failed",
                    stage: "Failed",
                    errorMessage: err.message,
                    completedAt: new Date()
                });

                const job = await ProcessingJob.findById(jobId);
                if (job) {
                    await KnowledgeDocument.findByIdAndUpdate(job.documentId, {
                        status: "failed",
                        errorMessage: err.message
                    });
                }
            } catch (dbErr) {
                console.error("[JobQueue] Failed to update job status in DB:", dbErr.message);
            }
        }

        // Clean up handler
        this._handlers.delete(jobId);
        this._processing = false;

        // Process next job
        this._process();
    }

    /**
     * Get the current number of pending jobs in the queue.
     * @returns {number}
     */
    get pendingCount() {
        return this._queue.length;
    }
}

// Singleton instance — shared across all requests
export const jobQueue = new JobQueue();
