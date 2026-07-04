import nodemailer from "nodemailer";

// ── Lazy transporter — created on first use so dotenv has already run ──────
let _transporter = null;

const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return _transporter;
};

// ── Helper: clean HTML email base ─────────────────────────────────────────
const baseHtml = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { margin:0; padding:0; background:#070913; font-family:'Segoe UI',Arial,sans-serif; }
    .wrap { max-width:560px; margin:40px auto; background:#0c0f22; border:1px solid rgba(139,92,246,0.2); border-radius:16px; overflow:hidden; }
    .header { background:linear-gradient(135deg,#7c3aed,#4f46e5,#10b981); padding:32px 40px; text-align:center; }
    .header h1 { margin:0; font-size:28px; color:#fff; font-weight:900; letter-spacing:2px; }
    .header p  { margin:6px 0 0; color:rgba(255,255,255,0.75); font-size:13px; }
    .body { padding:36px 40px; color:#c4c9e4; line-height:1.7; font-size:15px; }
    .otp-box { background:#070913; border:1px solid rgba(139,92,246,0.35); border-radius:12px; text-align:center; padding:24px; margin:24px 0; }
    .otp { font-size:38px; font-weight:900; letter-spacing:12px; color:#a78bfa; font-family:monospace; }
    .otp-note { font-size:12px; color:#64748b; margin-top:8px; }
    .btn { display:inline-block; margin-top:20px; padding:14px 32px; background:linear-gradient(135deg,#7c3aed,#10b981); color:#fff; font-weight:700; border-radius:10px; text-decoration:none; font-size:14px; }
    .footer { padding:20px 40px; border-top:1px solid rgba(255,255,255,0.05); text-align:center; color:#374151; font-size:12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>VoxaAI</h1>
      <p>AI Voice Assistant Platform</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">© ${new Date().getFullYear()} VoxaAI · All rights reserved<br/>This email was sent automatically. Please do not reply.</div>
  </div>
</body>
</html>`;

// ── Send OTP Email ─────────────────────────────────────────────────────────
export const sendOtpEmail = async (email, otp, purpose) => {
  const isReset = purpose === "reset_password";
  const subject  = isReset ? "VoxaAI — Reset Your Password" : "VoxaAI — Verify Your Email";
  const heading  = isReset ? "Password Reset OTP" : "Email Verification OTP";
  const subtext  = isReset
    ? "You requested to reset your password. Use the OTP below:"
    : "You're almost there! Use the OTP below to verify your email address:";

  const html = baseHtml(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:800;">${heading}</h2>
    <p style="margin:0 0 20px;color:#94a3b8;">${subtext}</p>
    <div class="otp-box">
      <div class="otp">${otp}</div>
      <div class="otp-note">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</div>
    </div>
    <p style="color:#64748b;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
  `);

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `"VoxaAI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
  });

  console.log(`[EmailService] ✅ OTP email sent to ${email} (purpose: ${purpose})`);
};

// ── Send Welcome Email ─────────────────────────────────────────────────────
export const sendWelcomeEmail = async (email, name) => {
  const html = baseHtml(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:22px;font-weight:800;">Welcome to VoxaAI, ${name}! 🎉</h2>
    <p>We're thrilled to have you on board. You now have access to the full VoxaAI platform — build powerful AI voice assistants for any website in minutes.</p>
    <p><strong style="color:#a78bfa;">Your free plan includes:</strong></p>
    <ul style="color:#94a3b8;padding-left:20px;">
      <li>200 AI-powered responses per month</li>
      <li>Custom voice assistant builder</li>
      <li>One-script embed for any website</li>
      <li>Real-time voice &amp; text conversations</li>
      <li>RAG document upload support</li>
    </ul>
    <p>Ready to build your first AI voice assistant?</p>
    <a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}/builder">Start Building Free →</a>
    <p style="margin-top:28px;color:#64748b;font-size:13px;">Need help? Reply to this email and our team will get back to you shortly.</p>
  `);

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `"VoxaAI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Welcome to VoxaAI, ${name}! 🎉`,
    html,
  });

  console.log(`[EmailService] ✅ Welcome email sent to ${email}`);
};
