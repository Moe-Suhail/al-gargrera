import { createPrivilegedSupabaseClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/provider";
import { buildEmailTemplate } from "@/lib/email/templates";
import { startOfMonthIso } from "@/lib/monthly-expenses";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  EmailEntityType,
  EmailEventType,
  NotificationEntity
} from "@/lib/email/types";
import type { Profile } from "@/lib/types";

type AnySupabase = SupabaseClient<any, "public", any>;

const SETTING_BY_EVENT: Partial<Record<EmailEventType, keyof Profile>> = {
  transaction_created: "notify_on_transaction_created",
  transaction_confirmed: "notify_on_transaction_confirmed",
  transaction_completed: "notify_on_transaction_completed",
  transaction_rejected: "notify_on_transaction_confirmed",
  repayment_created: "notify_on_repayment",
  repayment_confirmed: "notify_on_repayment",
  pending_confirmation_reminder: "notify_on_pending_reminder",
  monthly_expense_reminder: "notify_on_monthly_expense_reminder"
};

async function getEntity(
  supabase: AnySupabase,
  entityType: EmailEntityType,
  entityId: string
) {
  if (entityType === "transaction") {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", entityId)
      .maybeSingle();
    return data as NotificationEntity | null;
  }

  if (entityType === "repayment") {
    const { data } = await supabase
      .from("repayments")
      .select("*")
      .eq("id", entityId)
      .maybeSingle();
    return data as NotificationEntity | null;
  }

  if (entityType === "monthly_expense") {
    const { data } = await supabase
      .from("monthly_expenses")
      .select("*")
      .eq("id", entityId)
      .maybeSingle();
    return data as NotificationEntity | null;
  }

  const { data: member } = await supabase
    .from("account_members")
    .select("account_space_id")
    .eq("user_id", entityId)
    .limit(1)
    .maybeSingle();

  return {
    id: entityId,
    account_space_id: member?.account_space_id ?? ""
  } satisfies NotificationEntity;
}

async function insertEmailLog({
  supabase,
  accountSpaceId,
  recipient,
  eventType,
  entityType,
  entityId,
  subject,
  status,
  errorMessage
}: {
  supabase: AnySupabase;
  accountSpaceId: string;
  recipient: Profile;
  eventType: EmailEventType;
  entityType: EmailEntityType;
  entityId: string;
  subject: string;
  status: "pending" | "skipped" | "failed";
  errorMessage?: string | null;
}) {
  const { data } = await supabase
    .from("email_notifications")
    .insert({
      account_space_id: accountSpaceId,
      recipient_user_id: recipient.id,
      recipient_email: recipient.email,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      subject,
      status,
      error_message: errorMessage ?? null
    })
    .select("*")
    .single();

  return data as { id: string } | null;
}

export async function sendEmailNotification(
  eventType: EmailEventType,
  entityType: EmailEntityType,
  entityId: string,
  recipientUserId: string
) {
  const supabase = await createPrivilegedSupabaseClient();

  if (!supabase) {
    return;
  }

  try {
    const [entity, recipientResult] = await Promise.all([
      getEntity(supabase, entityType, entityId),
      supabase.from("profiles").select("*").eq("id", recipientUserId).maybeSingle()
    ]);
    const recipient = recipientResult.data as Profile | null;

    if (!entity || !entity.account_space_id || !recipient?.email) {
      return;
    }

    const { data: membership } = await supabase
      .from("account_members")
      .select("id")
      .eq("account_space_id", entity.account_space_id)
      .eq("user_id", recipientUserId)
      .maybeSingle();

    if (!membership) {
      return;
    }

    const settingKey = SETTING_BY_EVENT[eventType];
    const enabled =
      recipient.receive_email_notifications !== false &&
      (settingKey ? recipient[settingKey] !== false : true);

    const template = buildEmailTemplate({
      eventType,
      entityType,
      entity,
      recipient
    });

    const { data: existing } = await supabase
      .from("email_notifications")
      .select("id,status")
      .eq("account_space_id", entity.account_space_id)
      .eq("recipient_user_id", recipientUserId)
      .eq("event_type", eventType)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .gte(
        "created_at",
        eventType === "monthly_expense_reminder"
          ? startOfMonthIso()
          : "1970-01-01T00:00:00.000Z"
      )
      .in("status", ["pending", "sent"])
      .limit(1)
      .maybeSingle();

    if (existing) {
      await insertEmailLog({
        supabase,
        accountSpaceId: entity.account_space_id,
        recipient,
        eventType,
        entityType,
        entityId,
        subject: template.subject,
        status: "skipped",
        errorMessage: "duplicate"
      });
      return;
    }

    if (!enabled) {
      await insertEmailLog({
        supabase,
        accountSpaceId: entity.account_space_id,
        recipient,
        eventType,
        entityType,
        entityId,
        subject: template.subject,
        status: "skipped",
        errorMessage: "disabled"
      });
      return;
    }

    const log = await insertEmailLog({
      supabase,
      accountSpaceId: entity.account_space_id,
      recipient,
      eventType,
      entityType,
      entityId,
      subject: template.subject,
      status: "pending"
    });

    if (!log) {
      return;
    }

    try {
      const result = await sendEmail({
        to: recipient.email,
        subject: template.subject,
        text: template.text,
        html: template.html
      });

      await supabase
        .from("email_notifications")
        .update({
          status: "sent",
          provider: result.provider,
          provider_message_id: result.messageId,
          sent_at: new Date().toISOString()
        })
        .eq("id", log.id);
    } catch (error) {
      await supabase
        .from("email_notifications")
        .update({
          status: "failed",
          error_message:
            error instanceof Error ? error.message : "Email provider failed."
        })
        .eq("id", log.id);

      console.error("Email provider failed", error);
    }
  } catch (error) {
    console.error("Email notification failed", error);
  }
}
