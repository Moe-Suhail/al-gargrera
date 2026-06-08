"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BASE_CURRENCY } from "@/lib/constants";
import { logActivity } from "@/lib/activity";
import { ensureMember, requireActionContext } from "@/lib/action-context";
import { getExchangeRateWithCache } from "@/lib/exchange-rates/cache";
import { parseNumber, todayIsoDate } from "@/lib/format";
import {
  dueDateIso,
  isCompletedThisPeriod,
  monthlyPeriod
} from "@/lib/monthly-expenses";
import { sendEmailNotification } from "@/lib/email/send-notification";
import type { CurrencyCode, MonthlyExpense, TransactionType } from "@/lib/types";

const currencySchema = z.enum(["EGP", "USD", "SAR", "AED", "EUR", "GBP"]);
const transactionTypeSchema = z.enum([
  "paid_for_other",
  "saved_with_other",
  "repayment",
  "shared_expense",
  "manual_adjustment",
  "other"
]);

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function parseCurrency(value: FormDataEntryValue | null): CurrencyCode {
  return currencySchema.catch(BASE_CURRENCY).parse(String(value ?? BASE_CURRENCY));
}

function parseTransactionType(value: FormDataEntryValue | null): TransactionType {
  return transactionTypeSchema
    .catch("paid_for_other")
    .parse(String(value ?? "paid_for_other"));
}

async function exchangeFields(
  supabase: Awaited<ReturnType<typeof requireActionContext>>["supabase"],
  currency: CurrencyCode,
  amount: number
): Promise<{
  exchangeRateToBase: number;
  convertedAmountBase: number;
  exchangeRateSource: string;
  exchangeRateDate: string;
  rateIsManual: boolean;
}> {
  if (currency === BASE_CURRENCY) {
    return {
      exchangeRateToBase: 1,
      convertedAmountBase: amount,
      exchangeRateSource: "base",
      exchangeRateDate: todayIsoDate(),
      rateIsManual: false
    };
  }

  const rate = await getExchangeRateWithCache({
    supabase,
    fromCurrency: currency,
    toCurrency: BASE_CURRENCY
  });

  return {
    exchangeRateToBase: rate.rate,
    convertedAmountBase: amount * rate.rate,
    exchangeRateSource: rate.provider,
    exchangeRateDate: rate.validForDate ?? todayIsoDate(),
    rateIsManual: rate.isManual
  };
}

export async function createMonthlyExpenseAction(formData: FormData) {
  const { context, supabase } = await requireActionContext();
  const memberIds = context.members.map((member) => member.user_id);
  const name = cleanText(formData.get("name"));
  const amount = parseNumber(formData.get("amount"));
  const currency = parseCurrency(formData.get("currency"));
  const dueDay = Math.trunc(parseNumber(formData.get("due_day")));
  const paidByUserId = ensureMember(memberIds, formData.get("paid_by_user_id"));
  const relatedUserId = ensureMember(memberIds, formData.get("related_user_id"));
  const transactionType = parseTransactionType(formData.get("transaction_type"));
  const notes = cleanText(formData.get("notes"));

  if (!name || amount <= 0 || dueDay < 1 || dueDay > 31) {
    redirect("/monthly-expenses?error=required");
  }

  if (paidByUserId === relatedUserId) {
    redirect("/monthly-expenses?error=members");
  }

  const { data: duplicates } = await supabase
    .from("monthly_expenses")
    .select("id")
    .eq("account_space_id", context.accountSpace.id)
    .eq("name", name)
    .eq("amount", amount)
    .eq("currency", currency)
    .eq("due_day", dueDay)
    .eq("paid_by_user_id", paidByUserId)
    .eq("related_user_id", relatedUserId)
    .limit(1);

  if (duplicates?.length) {
    redirect("/monthly-expenses?error=duplicate");
  }

  const { data: expense, error } = await supabase
    .from("monthly_expenses")
    .insert({
      account_space_id: context.accountSpace.id,
      name,
      amount,
      currency,
      due_day: dueDay,
      paid_by_user_id: paidByUserId,
      related_user_id: relatedUserId,
      transaction_type: transactionType,
      notes: notes || null,
      reminder_enabled: formData.get("reminder_enabled") === "on",
      created_by: context.profile.id
    })
    .select("*")
    .single();

  if (error || !expense) {
    redirect("/monthly-expenses?error=save");
  }

  await logActivity({
    supabase,
    accountSpaceId: context.accountSpace.id,
    entityType: "monthly_expense",
    entityId: expense.id,
    action: "أضاف مصروفًا شهريًا ثابتًا",
    newValue: { name, amount, currency, due_day: dueDay },
    performedBy: context.profile.id
  });

  revalidatePath("/");
  revalidatePath("/monthly-expenses");
  redirect("/monthly-expenses?success=created");
}

async function getOwnedMonthlyExpense(id: string) {
  const { context, supabase } = await requireActionContext();
  const { data: expense } = await supabase
    .from("monthly_expenses")
    .select("*")
    .eq("account_space_id", context.accountSpace.id)
    .eq("id", id)
    .maybeSingle();

  if (!expense) {
    redirect("/monthly-expenses?error=missing");
  }

  return {
    context,
    supabase,
    expense: {
      ...(expense as MonthlyExpense),
      amount: Number(expense.amount),
      due_day: Number(expense.due_day)
    }
  };
}

export async function toggleMonthlyExpenseAction(formData: FormData) {
  const id = cleanText(formData.get("id"));
  const isActive = formData.get("is_active") === "true";
  const { context, supabase, expense } = await getOwnedMonthlyExpense(id);

  const { error } = await supabase
    .from("monthly_expenses")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("account_space_id", context.accountSpace.id);

  if (error) {
    redirect("/monthly-expenses?error=save");
  }

  await logActivity({
    supabase,
    accountSpaceId: context.accountSpace.id,
    entityType: "monthly_expense",
    entityId: id,
    action: isActive ? "فعّل مصروفًا شهريًا" : "أوقف مصروفًا شهريًا",
    oldValue: { is_active: expense.is_active },
    newValue: { is_active: isActive },
    performedBy: context.profile.id
  });

  revalidatePath("/monthly-expenses");
  redirect("/monthly-expenses?success=saved");
}

export async function updateMonthlyExpenseAction(formData: FormData) {
  const id = cleanText(formData.get("id"));
  const { context, supabase, expense } = await getOwnedMonthlyExpense(id);
  const memberIds = context.members.map((member) => member.user_id);
  const name = cleanText(formData.get("name"));
  const amount = parseNumber(formData.get("amount"));
  const currency = parseCurrency(formData.get("currency"));
  const dueDay = Math.trunc(parseNumber(formData.get("due_day")));
  const paidByUserId = ensureMember(memberIds, formData.get("paid_by_user_id"));
  const relatedUserId = ensureMember(memberIds, formData.get("related_user_id"));
  const transactionType = parseTransactionType(formData.get("transaction_type"));
  const notes = cleanText(formData.get("notes"));
  const reminderEnabled = formData.get("reminder_enabled") === "on";

  if (!name || amount <= 0 || dueDay < 1 || dueDay > 31) {
    redirect("/monthly-expenses?error=required");
  }

  if (paidByUserId === relatedUserId) {
    redirect("/monthly-expenses?error=members");
  }

  const { error } = await supabase
    .from("monthly_expenses")
    .update({
      name,
      amount,
      currency,
      due_day: dueDay,
      paid_by_user_id: paidByUserId,
      related_user_id: relatedUserId,
      transaction_type: transactionType,
      notes: notes || null,
      reminder_enabled: reminderEnabled
    })
    .eq("id", id)
    .eq("account_space_id", context.accountSpace.id);

  if (error) {
    redirect("/monthly-expenses?error=save");
  }

  await logActivity({
    supabase,
    accountSpaceId: context.accountSpace.id,
    entityType: "monthly_expense",
    entityId: id,
    action: "عدّل مصروفًا شهريًا",
    oldValue: {
      name: expense.name,
      amount: expense.amount,
      currency: expense.currency,
      due_day: expense.due_day
    },
    newValue: { name, amount, currency, due_day: dueDay },
    performedBy: context.profile.id
  });

  revalidatePath("/monthly-expenses");
  redirect("/monthly-expenses?success=saved");
}

export async function deleteMonthlyExpenseAction(formData: FormData) {
  const id = cleanText(formData.get("id"));
  const { context, supabase, expense } = await getOwnedMonthlyExpense(id);

  const { error } = await supabase
    .from("monthly_expenses")
    .delete()
    .eq("id", id)
    .eq("account_space_id", context.accountSpace.id);

  if (error) {
    redirect("/monthly-expenses?error=delete");
  }

  await logActivity({
    supabase,
    accountSpaceId: context.accountSpace.id,
    entityType: "monthly_expense",
    entityId: id,
    action: "حذف مصروفًا شهريًا",
    oldValue: {
      name: expense.name,
      amount: expense.amount,
      currency: expense.currency,
      due_day: expense.due_day
    },
    performedBy: context.profile.id
  });

  revalidatePath("/");
  revalidatePath("/monthly-expenses");
  redirect("/monthly-expenses?success=deleted");
}

export async function completeMonthlyExpenseAction(formData: FormData) {
  const id = cleanText(formData.get("id"));
  const { context, supabase, expense } = await getOwnedMonthlyExpense(id);

  if (!expense.is_active) {
    redirect("/monthly-expenses?error=inactive");
  }

  if (isCompletedThisPeriod(expense)) {
    redirect("/monthly-expenses?error=completed");
  }

  let rate: Awaited<ReturnType<typeof exchangeFields>>;

  try {
    rate = await exchangeFields(supabase, expense.currency, expense.amount);
  } catch {
    redirect("/monthly-expenses?error=rate");
  }

  const period = monthlyPeriod();
  const transactionDate = dueDateIso(expense.due_day);
  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({
      account_space_id: context.accountSpace.id,
      type: expense.transaction_type,
      status: "pending_confirmation",
      original_amount: expense.amount,
      original_currency: expense.currency,
      base_currency: BASE_CURRENCY,
      exchange_rate_to_base: rate.exchangeRateToBase,
      converted_amount_base: rate.convertedAmountBase,
      exchange_rate_source: rate.exchangeRateSource,
      exchange_rate_date: rate.exchangeRateDate,
      rate_is_manual: rate.rateIsManual,
      transaction_date: transactionDate,
      paid_by_user_id: expense.paid_by_user_id,
      related_user_id: expense.related_user_id,
      description: expense.name,
      notes: expense.notes
        ? `مصروف شهري ثابت. ${expense.notes}`
        : "مصروف شهري ثابت.",
      created_by: context.profile.id
    })
    .select("*")
    .single();

  if (error || !transaction) {
    redirect("/monthly-expenses?error=transaction");
  }

  await supabase
    .from("monthly_expenses")
    .update({
      last_completed_period: period,
      last_completed_transaction_id: transaction.id
    })
    .eq("id", expense.id)
    .eq("account_space_id", context.accountSpace.id);

  await Promise.all([
    logActivity({
      supabase,
      accountSpaceId: context.accountSpace.id,
      entityType: "monthly_expense",
      entityId: expense.id,
      action: "أكمل مصروفًا شهريًا",
      newValue: { period, transaction_id: transaction.id },
      performedBy: context.profile.id
    }),
    logActivity({
      supabase,
      accountSpaceId: context.accountSpace.id,
      entityType: "transaction",
      entityId: transaction.id,
      action: "أضاف عملية من مصروف شهري",
      newValue: {
        amount: expense.amount,
        currency: expense.currency,
        monthly_expense_id: expense.id
      },
      performedBy: context.profile.id
    })
  ]);

  const recipient = context.members.find(
    (member) => member.user_id !== context.profile.id
  );

  if (recipient) {
    await sendEmailNotification(
      "transaction_created",
      "transaction",
      transaction.id,
      recipient.user_id
    );
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/monthly-expenses");
  redirect(`/transactions/${transaction.id}`);
}
