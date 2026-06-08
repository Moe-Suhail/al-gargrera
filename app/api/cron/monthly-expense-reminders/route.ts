import { NextResponse } from "next/server";
import { createPrivilegedSupabaseClient } from "@/lib/supabase/admin";
import { sendEmailNotification } from "@/lib/email/send-notification";
import {
  daysUntilDue,
  monthlyPeriod
} from "@/lib/monthly-expenses";

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

  const period = monthlyPeriod();
  const { data: expenses } = await supabase
    .from("monthly_expenses")
    .select("*")
    .eq("is_active", true)
    .eq("reminder_enabled", true)
    .limit(100);

  let sent = 0;
  let checked = 0;

  for (const expense of expenses ?? []) {
    checked += 1;

    if (
      expense.last_completed_period === period ||
      expense.last_reminded_period === period
    ) {
      continue;
    }

    const dueIn = daysUntilDue(Number(expense.due_day));

    if (dueIn < 0 || dueIn > 2) {
      continue;
    }

    const { data: members } = await supabase
      .from("account_members")
      .select("user_id")
      .eq("account_space_id", expense.account_space_id);

    for (const member of members ?? []) {
      await sendEmailNotification(
        "monthly_expense_reminder",
        "monthly_expense",
        expense.id,
        member.user_id
      );
      sent += 1;
    }

    await supabase
      .from("monthly_expenses")
      .update({ last_reminded_period: period })
      .eq("id", expense.id);
  }

  return NextResponse.json({ checked, sent });
}
