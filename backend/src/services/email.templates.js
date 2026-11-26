export function passwordResetTemplate(resetLink) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>

      <body style="margin: 0; padding: 30px; background-color: #f4f4f5; font-family: Arial, sans-serif;">

        <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 10px;">

          <h2 style="color: #18181b;">Reset Your Password</h2>

          <p style="color: #52525b; line-height: 1.6;">
            We received a request to reset your SplitTab account password.
          </p>

          <p style="color: #52525b;">
            Click the button below to reset your password.
          </p>

          <a
            href="${resetLink}"
            style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;"
          >
            Reset Password
          </a>

          <p style="color: #dc2626; margin-top: 25px;">
            This link will expire in 5 minutes.
          </p>

          <p style="color: #71717a; font-size: 13px;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>

          <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 25px 0;" />

          <p style="color: #a1a1aa; font-size: 12px;">
            © ${new Date().getFullYear()} SplitTab. All rights reserved.
          </p>

        </div>

      </body>
    </html>
  `;
}