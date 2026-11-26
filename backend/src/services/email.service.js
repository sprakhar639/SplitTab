import transporter from "../config/mail.config.js";

export async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"SplitTab" <${process.env.GOOGLE_USER}>`,
      to,
      subject,
      html,
    });

    return info.messageId;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw error;
  }
}