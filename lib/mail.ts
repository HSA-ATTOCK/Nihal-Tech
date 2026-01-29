import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error) => {
  if (error) {
    console.error("Email transporter error:", error);
    console.log("⚠️  Email service may not be configured correctly");
    console.log(
      "   Make sure to use a Gmail App Password, not your regular password",
    );
    console.log(
      "   Generate one at: https://myaccount.google.com/apppasswords",
    );
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});
