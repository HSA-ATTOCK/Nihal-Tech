import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport(
  {
    host: "smtp.zoho.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
  {
    from: `Nihal Tech <${process.env.EMAIL_USER}>`,
  },
);

// Verify transporter configuration
transporter.verify((error) => {
  if (error) {
    console.error("Email transporter error:", error);
    console.log("⚠️  Email service may not be configured correctly");
    console.log("   Make sure your Zoho email and password are correct");
    console.log(
      "   If using 2FA, generate an app-specific password at: https://accounts.zoho.com/home#security/application",
    );
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});
