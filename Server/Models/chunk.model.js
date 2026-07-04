import mongoose from "mongoose";

const chunkMetadataSchema = new mongoose.Schema(
    {
        sourceFilename: { type: String, default: "" },
        fileType: { type: String, default: "" },
        pageNumber: { type: Number, default: null },
        url: { type: String, default: null },
        chunkOrder: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: Date.now },
        embeddingProvider: {
            type: String,
            enum: ["gemini", "voyage"],
            default: "gemini"
        }
    },
    { _id: false }
);

const chunkSchema = new mongoose.Schema(
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
        text: {
            type: String,
            required: true
        },
        embedding: {
            type: [Number],
            required: true
        },
        chunkIndex: {
            type: Number,
            default: 0
        },
        metadata: {
            type: chunkMetadataSchema,
            default: () => ({})
        }
    },
    { timestamps: true }
);

// Compound index for scoped vector search (userId + documentId)
chunkSchema.index({ userId: 1, documentId: 1 });



const KnowledgeChunk = mongoose.model("KnowledgeChunk", chunkSchema);
export default KnowledgeChunk;
