/**
 * RAG Diagnostic Script
 * Run: node diagnose_rag.mjs
 * Checks: documents stored, chunks count, embedding dimensions, and text extraction quality.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGODB_URL || process.env.MONGODB_URI || process.env.MONGO_URI;

const docSchema = new mongoose.Schema({}, { strict: false });
const chunkSchema = new mongoose.Schema({}, { strict: false });
const Doc = mongoose.model("KnowledgeDocument", docSchema, "knowledgedocuments");
const Chunk = mongoose.model("KnowledgeChunk", chunkSchema, "knowledgechunks");

async function run() {
    if (!MONGO_URI) { console.error("MONGODB_URI not found in .env"); process.exit(1); }
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB\n");

    const docs = await Doc.find({}).lean();
    console.log("=== DOCUMENTS ===");
    console.log("Total Documents:", docs.length);
    if (docs.length === 0) { console.log("NO DOCUMENTS FOUND - PDF was never uploaded or ingestion failed."); process.exit(0); }
    for (const doc of docs) {
        console.log(`\n  File: ${doc.filename || doc.name || "unnamed"}`);
        console.log(`  Status: ${doc.status}`);
        console.log(`  Type: ${doc.fileType}`);
        console.log(`  Chunks: ${doc.chunkCount ?? "not set"}`);
        console.log(`  Words: ${doc.wordCount ?? "not set"}`);
        console.log(`  UserId: ${doc.userId}`);
    }

    const totalChunks = await Chunk.countDocuments({});
    console.log("\n=== CHUNKS ===");
    console.log("Total Chunks:", totalChunks);
    if (totalChunks === 0) { console.log("NO CHUNKS FOUND - embedding step failed."); process.exit(0); }

    const sampleChunks = await Chunk.find({}).limit(5).lean();
    console.log("\n=== SAMPLE CHUNK TEXTS (first 5) ===");
    for (const c of sampleChunks) {
        const embLen = Array.isArray(c.embedding) ? c.embedding.length : "NOT AN ARRAY";
        console.log(`\nChunk #${c.chunkIndex} | embedding dims: ${embLen} | text chars: ${c.text?.length ?? 0}`);
        console.log(`Text: "${c.text?.slice(0, 150).replace(/\n/g, " ")}"`);
        console.log(`Has valid embedding: ${Array.isArray(c.embedding) && c.embedding.length > 10 ? "YES" : "NO"}`);
    }

    const allChunks = await Chunk.find({}).select("text embedding chunkIndex").lean();
    const emptyText = allChunks.filter(c => !c.text || c.text.trim().length < 10).length;
    const noEmbedding = allChunks.filter(c => !Array.isArray(c.embedding) || c.embedding.length < 10).length;
    console.log("\n=== HEALTH CHECK ===");
    console.log(`Chunks with empty/short text: ${emptyText} / ${totalChunks}`);
    console.log(`Chunks missing embeddings: ${noEmbedding} / ${totalChunks}`);

    const birthdayChunks = allChunks.filter(c => c.text?.toLowerCase().includes("birthday") || c.text?.toLowerCase().includes("package"));
    console.log(`\nChunks containing 'birthday' or 'package': ${birthdayChunks.length}`);
    if (birthdayChunks.length === 0) {
        console.log("CRITICAL: PDF text was NOT extracted properly - no restaurant content found in chunks.");
    } else {
        console.log("GOOD: Restaurant content found in chunks.");
        console.log(`Sample: "${birthdayChunks[0]?.text?.slice(0, 200).replace(/\n/g, " ")}"`);
    }

    await mongoose.disconnect();
    console.log("\nDiagnosis complete.");
}
run().catch(e => { console.error("Error:", e.message); process.exit(1); });
