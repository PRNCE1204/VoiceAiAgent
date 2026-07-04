import express from "express"
import multer from "multer"
import { isAuth } from "../Middleware/isAuth.js"
import { getCurrentUser, saveAssistant, getConversations } from "../Controllers/user.controller.js"
import { validate } from "../Middleware/validate.js"
import { saveAssistantSchema, scrapeUrlSchema } from "../Validation/schemas.validation.js"
import {
    uploadDocument,
    getDocuments,
    deleteDocument,
    scrapeUrl,
    getDocumentStatus,
    reprocessDocument
} from "../Controllers/document.controller.js"

const userRouter = express.Router()
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
})

userRouter.get("/current-user", isAuth, getCurrentUser)
userRouter.post("/save-assistant", isAuth, validate(saveAssistantSchema), saveAssistant)

// ── Knowledge Base Routes ───────────────────────────────────────────────────
// Upload file (PDF, TXT, DOCX, MD)
userRouter.post("/document/upload", isAuth, upload.single("file"), uploadDocument)

// Scrape a website URL
userRouter.post("/document/scrape", isAuth, validate(scrapeUrlSchema), scrapeUrl)

// List all documents (no content)
userRouter.get("/documents", isAuth, getDocuments)

// Delete a document + its chunks
userRouter.delete("/document/:docId", isAuth, deleteDocument)

// Get processing job status for a document (for UI polling)
userRouter.get("/document/:docId/status", isAuth, getDocumentStatus)

// Reprocess an existing document (re-embed with current provider)
userRouter.post("/document/:docId/reprocess", isAuth, reprocessDocument)
// ────────────────────────────────────────────────────────────────────────────

// Conversation transcripts
userRouter.get("/conversations", isAuth, getConversations)

export default userRouter