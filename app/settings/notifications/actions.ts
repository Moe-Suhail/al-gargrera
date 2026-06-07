"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { requireActionContext } from "@/lib/action-context";

const BOOLEAN_FIELDS = [
  "receive_email_notifications",
  "notify_on_transaction_created",
  "notify_on_transaction_confirmed",
  "notify_on_transaction_completed",
  "notify_on_repayment",
  "notify_on_pending_reminder"
] as const;

export async function updateNotificationSettingsAction(formData: FormData) {
  const { context, supabase } = await requireActionContext();
  const updates = Object.fromEntries(
    BOOLEAN_FIELDS.map((field) => [field, formData.get(field) === "on"])
  );

  const { error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", context.profile.id)
    .eq("auth_user_id", context.user.id);

  if (error) {
    redirect("/settings/notifications?error=save");
  }

  await logActivity({
    supabase,
    accountSpaceId: context.accountSpace.id,
    entityType: "profile",
    entityId: context.profile.id,
    action: "حدّث تنبيهات البريد",
    oldValue: null,
    newValue: updates,
    performedBy: context.profile.id
  });

  revalidatePath("/profile");
  revalidatePath("/settings/notifications");
  redirect("/settings/notifications?success=1");
}
