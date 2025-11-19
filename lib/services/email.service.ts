import { Resend } from "resend";

import { generateVerificationEmailHTML } from "@/lib/email-templates/verification";

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailService = {
  /**
   * Send verification email to user
   */
  sendVerificationEmail: async (options: { email: string; username?: string; otp: string }) => {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?email=${encodeURIComponent(options.email)}`;

    try {
      const response = await resend.emails.send({
        from: process.env.RESEND_EMAIL_FROM!,
        to: options.email,
        subject: "Verify your email - JobSearch",
        html: generateVerificationEmailHTML({
          username: options.username || "there",
          otp: options.otp,
          verificationUrl,
        }),
      });

      if (response.error) {
        throw new Error(`Failed to send email: ${response.error.message}`);
      }

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch {
      throw new Error("Failed to send verification email");
    }
  },
};
