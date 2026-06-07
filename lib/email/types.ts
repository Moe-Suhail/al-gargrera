export type EmailEventType =
  | "transaction_created"
  | "transaction_confirmed"
  | "transaction_rejected"
  | "transaction_completed"
  | "repayment_created"
  | "repayment_confirmed"
  | "receipt_uploaded"
  | "password_changed"
  | "pending_confirmation_reminder";

export type EmailEntityType = "transaction" | "repayment" | "profile";

export type EmailStatus = "pending" | "sent" | "failed" | "skipped";

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailSendResult = {
  provider: string;
  messageId?: string | null;
};

export type NotificationEntity = {
  id: string;
  account_space_id: string;
  original_amount?: number;
  original_currency?: string;
  status?: string;
  transaction_date?: string;
  payment_date?: string;
  created_by?: string;
};
