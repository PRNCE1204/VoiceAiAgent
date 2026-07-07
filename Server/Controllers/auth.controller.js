import bcrypt from "bcryptjs";
import crypto from "crypto";
import { genToken } from "../Configs/token.js";
import User from "../Models/user.model.js";
import { sendOtpEmail, sendWelcomeEmail } from "../Services/EmailService.js";

// ── Helper: generate a 6-digit numeric OTP ────────────────────────────────
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// ── Helper: hash OTP (one-way, same as password but we compare plain) ─────
const hashOtp = async (otp) => bcrypt.hash(otp, 10);

// ── Helper: issue JWT cookie ───────────────────────────────────────────────
const issueTokenCookie = async (res, userId) => {
    const token = await genToken(userId);
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

// ── Google OAuth ───────────────────────────────────────────────────────────
export const googleAuth = async (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) {
            return res.status(400).json({ message: "Access Token is required" });
        }

        const response = await fetch(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
        );
        if (!response.ok) {
            return res.status(400).json({ message: "Failed to verify access token with Google" });
        }

        const data = await response.json();
        const { name, email } = data;
        if (!email) {
            return res.status(400).json({ message: "Email not retrieved from Google profile" });
        }

        let user = await User.findOne({ email });
        const isNewUser = !user;

        if (!user) {
            user = await User.create({
                name,
                email,
                authProvider: "google",
                isEmailVerified: true,
                isFirstLogin: true,
            });
        }

        // Send welcome email on first login (Google)
        if (user.isFirstLogin) {
            user.isFirstLogin = false;
            await user.save();
            sendWelcomeEmail(email, name).catch(() => {}); // non-blocking
        }

        await issueTokenCookie(res, user._id);
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: `Google auth error ${error}` });
    }
};

// ── Register (email + password) ───────────────────────────────────────────
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            // ── Case 1: Google account OR already-verified email account ──
            // Either way, the email is taken — block with a clear message
            if (existing.authProvider === "google" || existing.isEmailVerified) {
                return res.status(409).json({
                    message: "An account with this email already exists. Please sign in instead.",
                    alreadyExists: true,
                });
            }

            // ── Case 2: Unverified email account — resend OTP ─────────────
            const otp = generateOtp();
            existing.otp        = await hashOtp(otp);
            existing.otpExpiry  = new Date(Date.now() + 10 * 60 * 1000);
            existing.otpPurpose = "verify_email";
            existing.name       = name;
            existing.password   = await bcrypt.hash(password, 12);
            await existing.save();
            try {
                await sendOtpEmail(email, otp, "verify_email");
            } catch (emailErr) {
                console.error("[Email] OTP send failed:", emailErr.message);
                return res.status(500).json({ message: "Account saved but OTP email could not be sent. Check server email config." });
            }
            return res.status(200).json({ message: "A verification OTP has been re-sent to your email." });
        }

        // ── New account ────────────────────────────────────────────────────
        const hashedPassword = await bcrypt.hash(password, 12);
        const otp = generateOtp();
        const hashedOtp = await hashOtp(otp);

        await User.create({
            name,
            email,
            password: hashedPassword,
            authProvider: "email",
            isEmailVerified: false,
            isFirstLogin: true,
            otp: hashedOtp,
            otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
            otpPurpose: "verify_email",
        });

        try {
            await sendOtpEmail(email, otp, "verify_email");
        } catch (emailErr) {
            console.error("[Email] OTP send failed:", emailErr.message);
            return res.status(500).json({ message: "Account created but OTP email could not be sent. Check EMAIL_USER / EMAIL_PASS in .env." });
        }

        return res.status(201).json({ message: "OTP sent to your email. Please verify your account." });
    } catch (error) {
        console.error("[Register] Error:", error);
        return res.status(500).json({ message: `Registration failed: ${error.message}` });
    }
};

// ── Verify Email OTP ───────────────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email, otpPurpose: "verify_email" });
        if (!user) {
            return res.status(404).json({ message: "No pending verification found for this email." });
        }
        if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }
        const valid = await bcrypt.compare(otp, user.otp);
        if (!valid) {
            return res.status(400).json({ message: "Incorrect OTP. Please try again." });
        }

        user.isEmailVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        user.otpPurpose = null;
        user.isFirstLogin = false;
        await user.save();

        // Send welcome email (non-blocking)
        sendWelcomeEmail(email, user.name).catch(() => {});

        await issueTokenCookie(res, user._id);
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: `Verification failed: ${error}` });
    }
};

// ── Email Login ────────────────────────────────────────────────────────────
export const emailLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || user.authProvider !== "email") {
            return res.status(401).json({ message: "Invalid email or password." });
        }
        if (!user.isEmailVerified) {
            return res.status(403).json({ message: "Please verify your email before signing in.", needsVerification: true });
        }
        const valid = await bcrypt.compare(password, user.password || "");
        if (!valid) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        await issueTokenCookie(res, user._id);
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: `Login failed: ${error}` });
    }
};

// ── Forgot Password (send OTP) ────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        // Always return success to avoid email enumeration
        if (!user || user.authProvider !== "email") {
            return res.status(200).json({ message: "If this email is registered, you will receive a reset OTP." });
        }

        const otp = generateOtp();
        user.otp = await hashOtp(otp);
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.otpPurpose = "reset_password";
        await user.save();

        await sendOtpEmail(email, otp, "reset_password");
        return res.status(200).json({ message: "Password reset OTP sent to your email." });
    } catch (error) {
        return res.status(500).json({ message: `Failed to send reset OTP: ${error}` });
    }
};

// ── Reset Password ────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ email, otpPurpose: "reset_password" });
        if (!user) {
            return res.status(404).json({ message: "No password reset request found for this email." });
        }
        if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }
        const valid = await bcrypt.compare(otp, user.otp);
        if (!valid) {
            return res.status(400).json({ message: "Incorrect OTP. Please try again." });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        user.otp = null;
        user.otpExpiry = null;
        user.otpPurpose = null;
        await user.save();

        return res.status(200).json({ message: "Password reset successfully. You can now sign in." });
    } catch (error) {
        return res.status(500).json({ message: `Password reset failed: ${error}` });
    }
};

// ── Resend OTP ─────────────────────────────────────────────────────────────
export const resendOtp = async (req, res) => {
    try {
        const { email, purpose } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "No account found with this email." });
        }

        const otp = generateOtp();
        user.otp = await hashOtp(otp);
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.otpPurpose = purpose;
        await user.save();

        await sendOtpEmail(email, otp, purpose);
        return res.status(200).json({ message: "A new OTP has been sent to your email." });
    } catch (error) {
        return res.status(500).json({ message: `Failed to resend OTP: ${error}` });
    }
};

// ── Log Out ────────────────────────────────────────────────────────────────
export const logOut = async (req, res) => {
    try {
        const isProd = process.env.NODE_ENV === "production";
        await res.clearCookie("token", {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
        });
        return res.status(200).json({ message: "LogOut Successfully" });
    } catch (error) {
        return res.status(500).json({ message: `LogOut Failed ${error}` });
    }
};