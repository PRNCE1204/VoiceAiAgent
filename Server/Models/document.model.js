import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        filename: {
            type: String,
            required: true
        },
        fileType: {
            type: String,
            // Extended to support docx and markdown in addition to existing types
            enum: ["pdf", "txt", "url", "docx", "md"],
            required: true
        },
        content: {
            type: String,
            // Full raw extracted text — may be large; excluded from list queries
            required: false,
            default: ""
        },
        status: {
            type: String,
            // pending: queued, processing: embedding in progress, synced: ready, failed: error
            enum: ["pending", "processing", "synced", "failed"],
            default: "pending"
        },
        url: {
            type: String,
            default: null // Only populated for scraped URL sources
        },
        // Denormalized count for fast UI display — updated after embedding completes
        chunkCount: {
            type: Number,
            default: 0
        },
        wordCount: {
            type: Number,
            default: 0
        },
        // Links to the background ProcessingJob for status polling
        processingJobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProcessingJob",
            default: null
        },
        // Error message stored when status = "failed"
        errorMessage: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

const KnowledgeDocument = mongoose.model("KnowledgeDocument", documentSchema);
export default KnowledgeDocument;
