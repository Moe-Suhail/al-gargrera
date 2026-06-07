import { APP_NAME, TRANSACTION_STATUSES } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import type {
  EmailEventType,
  NotificationEntity
} from "@/lib/email/types";
import type { Profile } from "@/lib/types";

const EVENT_LABELS: Record<EmailEventType, string> = {
  transaction_created: "تمت إضافة عملية جديدة",
  transaction_confirmed: "تم تأكيد العملية",
  transaction_rejected: "تم رفض العملية",
  transaction_completed: "اكتملت العملية",
  repayment_created: "تمت إضافة سداد جديد",
  repayment_confirmed: "تم تأكيد السداد",
  receipt_uploaded: "تم رفع إيصال",
  password_changed: "تم تغيير كلمة المرور",
  pending_confirmation_reminder: "لديك عملية بانتظار التأكيد"
};

function statusLabel(status?: string) {
  if (!status) return "";
  return TRANSACTION_STATUSES[status as keyof typeof TRANSACTION_STATUSES]?.label ?? status;
}

function entityDate(entity: NotificationEntity) {
  const value = entity.transaction_date ?? entity.payment_date;
  return value ? formatDate(value) : formatDate(new Date());
}

function appUrl(path = "/") {
  return `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}${path}`;
}

export function buildEmailTemplate({
  eventType,
  entityType,
  entity,
  recipient
}: {
  eventType: EmailEventType;
  entityType: string;
  entity: NotificationEntity;
  recipient: Profile;
}) {
  const label = EVENT_LABELS[eventType];
  const detailPath =
    entityType === "transaction"
      ? `/transactions/${entity.id}`
      : entityType === "repayment"
        ? "/repayments"
        : "/profile";
  const link = appUrl(detailPath);
  const amount =
    entity.original_amount && entity.original_currency
      ? formatMoney(Number(entity.original_amount), entity.original_currency)
      : null;

  const safeLines =
    eventType === "password_changed"
      ? ["تم تغيير كلمة المرور بنجاح."]
      : [
          amount ? `المبلغ: ${amount}` : null,
          entity.status ? `الحالة: ${statusLabel(entity.status)}` : null,
          `التاريخ: ${entityDate(entity)}`
        ].filter(Boolean);

  const subject =
    eventType === "transaction_completed"
      ? `اكتملت عملية في ${APP_NAME}`
      : `${label} في ${APP_NAME}`;

  const text = [
    `مرحبًا ${recipient.display_name}،`,
    `${label} في ${APP_NAME}.`,
    "",
    ...safeLines,
    "",
    "يمكنك فتح التطبيق لمراجعة التفاصيل.",
    link
  ].join("\n");

  const html = `
    <div dir="rtl" style="font-family:Segoe UI,Tahoma,Arial,sans-serif;background:#FBFCF5;padding:24px;color:#1F2A1F">
      <div style="max-width:560px;margin:auto;background:#ffffff;border:1px solid #E1E8D8;border-radius:8px;padding:24px">
        <p style="margin:0 0 12px;color:#667066">مرحبًا ${recipient.display_name}،</p>
        <h1 style="margin:0 0 16px;font-size:22px;color:#2F6B3F">${label}</h1>
        <p style="margin:0 0 16px;line-height:1.8">${label} في ${APP_NAME}.</p>
        <div style="background:#F8FAF3;border-radius:8px;padding:14px;margin-bottom:18px;line-height:1.9">
          ${safeLines.map((line) => `<div>${line}</div>`).join("")}
        </div>
        <a href="${link}" style="display:inline-block;background:#2F6B3F;color:#fff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700">عرض التفاصيل</a>
        <p style="margin:18px 0 0;color:#667066;font-size:13px;line-height:1.7">لا يتم إرفاق الإيصالات أو الملاحظات الخاصة في البريد.</p>
      </div>
    </div>
  `;

  return {
    subject,
    text,
    html
  };
}

export { EVENT_LABELS };
