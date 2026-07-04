import express from "express"
import {
    googleAuth,
    register,
    verifyEmail,
    emailLogin,
    forgotPassword,
    resetPassword,
    resendOtp,
    logOut
} from "../Controllers/auth.controller.js"
import { authLimiter } from "../Middleware/rateLimiter.js"
import { validate } from "../Middleware/validate.js"
import {
    googleAuthSchema,
    registerSchema,
    verifyEmailSchema,
    emailLoginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    resendOtpSchema
} from "../Validation/schemas.validation.js"

const authRouter = express.Router()

authRouter.post("/google",          authLimiter, validate(googleAuthSchema),       googleAuth)
authRouter.post("/register",        authLimiter, validate(registerSchema),          register)
authRouter.post("/verify-email",    authLimiter, validate(verifyEmailSchema),       verifyEmail)
authRouter.post("/login",           authLimiter, validate(emailLoginSchema),        emailLogin)
authRouter.post("/forgot-password", authLimiter, validate(forgotPasswordSchema),    forgotPassword)
authRouter.post("/reset-password",  authLimiter, validate(resetPasswordSchema),     resetPassword)
authRouter.post("/resend-otp",      authLimiter, validate(resendOtpSchema),         resendOtp)
authRouter.get("/logout",           logOut)

export default authRouter