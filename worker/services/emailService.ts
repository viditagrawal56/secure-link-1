import { Resend } from "resend";

export class EmailService {
  private resend: Resend;

  constructor(resendApiKey: string) {
    this.resend = new Resend(resendApiKey);
  }

  async sendVerificationEmail(visitorEmail: string, verificationUrl: string) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: "onboarding@resend.dev",
        to: visitorEmail,
        subject: "Your Magic Link for URL Access",
        html: `
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px;">
            <h2>Access Your Requested URL</h2>
            <p>You requested access to a shortened URL. Click the link below to proceed:</p>
            <p>
              <a href="${verificationUrl}" style="color: #1a73e8; font-weight: bold;">
                Click here to access your requested URL
              </a>
            </p>
            <p>This link will expire in 15 minutes.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </body>
        </html>
      `,
      });

      if (error) {
        console.error("Resend error:", error);
        return false;
      }

      console.log("Verification email sent:", data);
      return true;
    } catch (error) {
      console.error("Error sending verification email:", error);
      return false;
    }
  }
}
