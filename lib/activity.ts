import type { SupabaseClient } from "@supabase/supabase-js";

type AnySupabase = SupabaseClient<any, "public", any>;

type LogActivityInput = {
  supabase: AnySupabase;
  accountSpaceId: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  performedBy: string;
};

export async function logActivity({
  supabase,
  accountSpaceId,
  entityType,
  entityId,
  action,
  oldValue = null,
  newValue = null,
  performedBy
}: LogActivityInput) {
  const { error } = await supabase.from("activity_logs").insert({
    account_space_id: accountSpaceId,
    entity_type: entityType,
    entity_id: entityId ?? null,
    action,
    old_value: oldValue,
    new_value: newValue,
    performed_by: performedBy
  });

  if (error) {
    console.error("Unable to log activity", error.message);
  }
}
