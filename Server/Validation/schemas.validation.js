import { z } from "zod";

export const googleAuthSchema = z.object({
    body: z.object({
        accessToken: z.string().min(1, "Google Access Token is required"),
    }),
});

export const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
    }),
});

export const verifyEmailSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        otp: z.string().length(6, "OTP must be 6 digits"),
    }),
});

export const emailLoginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        otp: z.string().length(6, "OTP must be 6 digits"),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
    }),
});

export const resendOtpSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        purpose: z.enum(["verify_email", "reset_password"]),
    }),
});

export const askAssistantSchema = z.object({
    body: z.object({
        message: z.string().min(1, "Message cannot be empty"),
        userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid User ID format"),
        sessionId: z.string().optional(),
    }),
});

export const saveAssistantSchema = z.object({
    body: z.object({
        assistantName: z.string().min(1, "Assistant name is required"),
        businessName: z.string().min(1, "Business name is required"),
        businessType: z.string().min(1, "Business type is required"),
        businessDescription: z.string().min(1, "Business description is required"),
        tone: z.string().min(1, "Tone is required"),
        theme: z.string().optional(),
        geminiApiKey: z.string().optional(),
        assistantAvatar: z.string().optional(),
        pages: z.array(
            z.object({
                name: z.string().min(1, "Page name is required"),
                path: z.string().min(1, "Page path is required"),
                keywords: z.array(z.string()).min(1, "At least one keyword is required"),
            })
        ).optional(),
    }),
});

export const scrapeUrlSchema = z.object({
    body: z.object({
        url: z.string().url("Invalid website URL format"),
    }),
});
