"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BASE_CURRENCY } from "@/lib/constants";
import { parseNumber, todayIsoDate } from "@/lib/format";
import { logActivity } from "@/lib/activity";
import { ensureMember, requireActionContext } from "@/lib/action-context";
import { sendEmailNotification } from "@/lib/email/send-notification";
import type { CurrencyCode, TransactionStatus } from "@/lib/types";

const currencySchema = z.enum(["EGP", "USD", "SAR", "AED", "EUR", "GBP"]);

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function parseCurrency(value: FormDataEntryValue | null): CurrencyCode {
  return currencySchema.catch(BASE_CURRENCY).parse(String(value ?? BASE_CURRENCY));
}

function exchangeFields(formData: FormData, currency: CurrencyCode, amount: number) {
  if (currency === BASE_CURRENCY) {
    return {
      exchangeRateToBase: 1,
      convertedAmountBase: amount,
      exchangeRateSource: "base",
      exchangeRateDate: todayIsoDate(),
      rateIsManual: false
    };
  }

  const exchangeRateToBase = parseNumber(formData.get("exchange_rate_to_base"), 0);
  const convertedAmountBase = parseNumber(
    formData.get("converted_amount_base"),
    amount * exchangeRateToBase
  );

  return {
    exchangeRateToBase,
    convertedAmountBase,
    exchangeRateSource: cleanText(formData.get("exchange_rate_source")) || "manual",
    exchangeRateDate:
      cleanText(formData.get("exchange_rate_date")) || todayIsoDate(),
    rateIsManual:
      formData.get("rate_is_manual") === "true" ||
      formData.get("rate_is_manual") === "on"
  };
}

export async function createRepaymentAction(formData: FormData) {
  const { context, supabase } = await requireActionContext();
  const memberIds = context.members.map((member) => member.user_id);
  const amount = parseNumber(formData.get("original_amount"));
  const currency = parseCurrency(formData.get("original_currency"));
  const rate = exchangeFields(formData, currency, amount);
  const paidByUserId = ensureMember(memberIds, formData.get("paid_by_user_id"));
  const paidToUserId = ensureMember(memberIds, formData.get("paid_to_user_id"));
  const paymentDate = cleanText(formData.get("payment_date")) || todayIsoDate();
  const notes = cleanText(formData.get("notes"));
  const transactionId = cleanText(formData.get("transaction_id")) || null;

  if (amount <= 0 || rate.exchangeRateToBase <= 0) {
    redirect("/repayments?error=required");
  }

  const { data: repayment, error } = await supabase
    .from("repayments")
    .insert({
      account_space_id: context.accountSpace.id,
      transaction_id: transactionId,
      original_amount: amount,
      original_currency: currency,
      base_currency: BASE_CURRENCY,
      exchange_rate_to_base: rate.exchangeRateToBase,
      converted_amount_base: rate.convertedAmountBase,
      exchange_rate_source: rate.exchangeRateSource,
      exchange_rate_date: rate.exchangeRateDate,
      rate_is_manual: rate.rateIsManual,
      payment_date: paymentDate,
      paid_by_user_id: paidByUserId,
      paid_to_user_id: paidToUserId,
      notes: notes || null,
      status: "pending_confirmation",
      created_by: context.profile.id
    })
    .select("*")
    .single();

  if (error || !repayment) {
    redirect("/repayments?error=save");
  }

  await logActivity({
    supabase,
    accountSpaceId: context.accountSpace.id,
    entityType: "repayment",
    entityId: repayment.id,
    action: "أضاف سداد",
    newValue: { amount, currency, status: "pending_confirmation" },
    performedBy: context.profile.id
  });

  const recipient = context.members.find(
    (member) => member.user_id !== context.profile.id
  );

  if (recipient) {
    await sendEmailNotification(
      "repayment_created",
      "repayment",
      repayment.id,
      recipient.user_id
    );
  }

  revalidatePath("/");
  revalidatePath("/repayments");
}

async function getOwnedRepayment(id: string) {
  const { context, supabase } = await requireActionContext();
  const { data: repayment } = await supabase
    .from("repayments")
    .select("*")
    .eq("account_space_id", context.accountSpace.id)
    .eq("id", id)
    .maybeSingle();

  if (!repayment) {
    redirect("/repayments?error=missing");
  }

  return { context, supabase, repayment };
}

export async function confirmRepaymentAction(formData: FormData) {
  const id = cleanText(formData.get("id"));
  const { context, supabase, repayment } = await getOwnedRepayment(id);

  if (repayment.created_by === context.profile.id) {
    redirect("/repayments?error=creator-confirm");
  }

  const { error } = await supabase
    .from("repayments")
    .update({
      status: "confirmed" satisfies TransactionStatus,
      confirmed_by: context.profile.id,
      confirmed_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("account_space_id", context.accountSpace.id);

  if (!error) {
    await logActivity({
      supabase,
      accountSpaceId: context.accountSpace.id,
      entityType: "repayment",
      entityId: id,
      action: "أكد السداد",
      oldValue: { status: repayment.status },
      newValue: { status: "confirmed" },
      performedBy: context.profile.id
    });

    await sendEmailNotification(
      "repayment_confirmed",
      "repayment",
      id,
      repayment.created_by
    );
  }

  revalidatePath("/");
  revalidatePath("/repayments");
}
