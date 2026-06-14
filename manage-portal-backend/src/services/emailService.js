const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ── Send OTP for forgot password ──
const sendOTPEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"ManagePortal" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your Password Reset OTP — ManagePortal",
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#2563eb;color:#fff;font-size:18px;font-weight:700;padding:8px 20px;border-radius:8px;">ManagePortal</div>
        </div>
        <h2 style="color:#0f172a;font-size:20px;margin-bottom:8px;">Password Reset OTP</h2>
        <p style="color:#64748b;font-size:14px;margin-bottom:24px;">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#f0f6ff;border:1px solid #bfdbfe;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px;">
          <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#2563eb;">${otp}</div>
        </div>
        <p style="color:#94a3b8;font-size:12px;">If you didn't request this, ignore this email. Your password won't change.</p>
      </div>
    `,
  });
};

// ── Send welcome email on registration ──
const sendWelcomeEmail = async (to, firstName, password) => {
  await transporter.sendMail({
    from: `"ManagePortal" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Welcome to ManagePortal 🎉",
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#2563eb;color:#fff;font-size:18px;font-weight:700;padding:8px 20px;border-radius:8px;">ManagePortal</div>
        </div>
        <h2 style="color:#0f172a;font-size:20px;margin-bottom:8px;">Welcome, ${firstName}! 👋</h2>
        <p style="color:#64748b;font-size:14px;margin-bottom:24px;">Your account has been created. Here are your login credentials:</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin-bottom:24px;">
          <div style="margin-bottom:10px;"><span style="font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;">Email</span><br/><span style="font-size:15px;color:#0f172a;font-weight:600;">${to}</span></div>
          <div><span style="font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;">Password</span><br/><span style="font-size:15px;color:#0f172a;font-weight:600;font-family:monospace;">${password}</span></div>
        </div>
        <p style="color:#64748b;font-size:13px;">Please change your password after your first login.</p>
        <a href="http://localhost:5173/login" style="display:block;text-align:center;background:#2563eb;color:#fff;padding:12px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:20px;">Login to ManagePortal</a>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px;text-align:center;">ManagePortal · Central Park Corp</p>
      </div>
    `,
  });
};

// ── Send custom email to employee ──
const sendCustomEmail = async (to, subject, message, fromName) => {
  await transporter.sendMail({
    from: `"${fromName} via ManagePortal" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#2563eb;color:#fff;font-size:18px;font-weight:700;padding:8px 20px;border-radius:8px;">ManagePortal</div>
        </div>
        <div style="color:#0f172a;font-size:14px;line-height:1.7;white-space:pre-wrap;">${message}</div>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #f1f5f9;">
          <p style="color:#94a3b8;font-size:12px;">Sent by <strong>${fromName}</strong> via ManagePortal</p>
        </div>
      </div>
    `,
  });
};

module.exports = { sendOTPEmail, sendWelcomeEmail, sendCustomEmail };