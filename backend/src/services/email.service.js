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














// import { Resend } from "resend";

// if (!process.env.RESEND_API_KEY) {
//   throw new Error("Missing environment variable: RESEND_API_KEY");
// }

// const resend = new Resend(process.env.RESEND_API_KEY);

// const SENDER_EMAIL = "SplitTab <onboarding@resend.dev>";

// export async function sendEmail({ to, subject, html }) {
//   try {
//     const { data, error } = await resend.emails.send({
//       from: SENDER_EMAIL,
//       to,
//       subject,
//       html,
//     });

//     if (error) {
//       throw new Error(error.message);
//     }

//     return data.id;
//   } catch (error) {
//     console.error("Email sending failed:", error.message);
//     throw error;
//   }
// }













