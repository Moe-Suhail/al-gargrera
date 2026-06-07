import { NextResponse } from "next/server";
import { createPrivilegedSupabaseClient } from "@/lib/supabase/admin";
import { sendEmailNotification } from "@/lib/email/send-notification";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = await createPrivilegedSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const olderThan = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentSince = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("status", "pending_confirmation")
    .lt("created_at", olderThan)
    .limit(50);

  let sent = 0;

  for (const transaction of transactions ?? []) {
    const { data: member } = await supabase
      .from("account_members")
      .select("user_id")
      .eq("account_space_id", transaction.account_space_id)
      .neq("user_id", transaction.created_by)
      .limit(1)
      .maybeSingle();

    if (!member?.user_id) continue;

    const { data: recent } = await supabase
      .from("email_notifications")
      .select("id")
      .eq("account_space_id", transaction.account_space_id)
      .eq("recipient_user_id", member.user_id)
      .eq("event_type", "pending_confirmation_reminder")
      .eq("entity_type", "transaction")
      .eq("entity_id", transaction.id)
      .gte("created_at", recentSince)
      .limit(1)
      .maybeSingle();

    if (recent) continue;

    await sendEmailNotification(
      "pending_confirmation_reminder",
      "transaction",
      transaction.id,
      member.user_id
    );
    sent += 1;
  }

  return NextResponse.json({ checked: transactions?.length ?? 0, sent });
}
