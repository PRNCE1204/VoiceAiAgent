import express from "express"
import { askAssistant, getAssistantConfig } from "../Controllers/assistant.controller.js"
import { askLimiter } from "../Middleware/rateLimiter.js"
import { validate } from "../Middleware/validate.js"
import { askAssistantSchema } from "../Validation/schemas.validation.js"


const assistantRouter = express.Router()

assistantRouter.get("/config/:userId" , getAssistantConfig)
assistantRouter.post("/ask", askLimiter, validate(askAssistantSchema), askAssistant)

export default assistantRouter