import type { EmailPayload, EmailSendResult } from "@/lib/email/types";
import { sendWithResend } from "@/lib/email/resend";

export async function sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
  const provider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();

  if (provider === "resend") {
    return sendWithResend(payload);
  }

  throw new Error(`Unsupported email provider: ${provider}`);
}
