import mongoose from "mongoose";

const processingJobSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "KnowledgeDocument",
            required: true,
            index: true
        },
        // Lifecycle: pending → processing → completed | failed
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending",
            index: true
        },
        // 0–100 progress percentage updated at each pipeline stage
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        // Current pipeline stage label (e.g. "Parsing", "Chunking", "Embedding 12/48")
        stage: {
            type: String,
            default: "Queued"
        },
        // Total chunks produced (populated when completed)
        totalChunks: {
            type: Number,
            default: 0
        },
        // Error details when status = "failed"
        errorMessage: {
            type: String,
            default: null
        },
        // Timestamps for SLA tracking
        startedAt: {
            type: Date,
            default: null
        },
        completedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// TTL index: auto-delete old completed/failed jobs after 7 days (604800 seconds)
processingJobSchema.index(
    { completedAt: 1 },
    { expireAfterSeconds: 604800, partialFilterExpression: { status: { $in: ["completed", "failed"] } } }
);

const ProcessingJob = mongoose.model("ProcessingJob", processingJobSchema);
export default ProcessingJob;
