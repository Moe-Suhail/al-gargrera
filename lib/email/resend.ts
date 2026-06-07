import type { EmailPayload, EmailSendResult } from "@/lib/email/types";

export async function sendWithResend(
  payload: EmailPayload
): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("Email provider is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html
    })
  });

  const data = (await response.json().catch(() => ({}))) as { id?: string };

  if (!response.ok) {
    throw new Error("Resend failed to send email.");
  }

  return {
    provider: "resend",
    messageId: data.id ?? null
  };
}
