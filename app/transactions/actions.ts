"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BASE_CURRENCY, EMPTY_STATES } from "@/lib/constants";
import { parseNumber, todayIsoDate } from "@/lib/format";
import { logActivity } from "@/lib/activity";
import { requireActionContext, ensureMember } from "@/lib/action-context";
import { isTransactionType } from "@/lib/data";
import { uploadTransactionAttachment } from "@/lib/storage";
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
  const requestedBaseCurrency = parseCurrency(formData.get("base_currency"));
  const settlementMode = cleanText(formData.get("settlement_mode"));

  if (
    currency === BASE_CURRENCY ||
    requestedBaseCurrency === currency ||
    settlementMode === "keep_original"
  ) {
    return {
      baseCurrency: currency,
      exchangeRateToBase: 1,
      convertedAmountBase: amount,
      exchangeRateSource: currency === BASE_CURRENCY ? "base" : "same-currency",
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
    baseCurrency: BASE_CURRENCY,
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

export async function createTransactionAction(formData: FormData) {
  const { context, supabase } = await requireActionContext();
  const memberIds = context.members.map((member) => member.user_id);
  const type = cleanText(formData.get("type"));

  if (!isTransactionType(type)) {
    redirect("/transactions/new?error=type");
  }

  const amount = parseNumber(formData.get("original_amount"));
  const currency = parseCurrency(formData.get("original_currency"));
  const description = cleanText(formData.get("description"));
  const notes = cleanText(formData.get("notes"));
  const paidByUserId = ensureMember(memberIds, formData.get("paid_by_user_id"));
  const relatedUserId = ensureMember(memberIds, formData.get("related_user_id"));
  const transactionDate = cleanText(formData.get("transaction_date")) || todayIsoDate();

  if (amount <= 0 || !description) {
    redirect("/transactions/new?error=required");
  }

  if (type === "manual_adjustment" && !notes) {
    redirect("/transactions/new?error=note");
  }

  const rate = exchangeFields(formData, currency, amount);

  if (rate.exchangeRateToBase <= 0 || rate.convertedAmountBase <= 0) {
    redirect("/transactions/new?error=rate");
  }

  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({
      account_space_id: context.accountSpace.id,
      type,
      status: "pending_confirmation",
      original_amount: amount,
      original_currency: currency,
      base_currency: rate.baseCurrency,
      exchange_rate_to_base: rate.exchangeRateToBase,
      converted_amount_base: rate.convertedAmountBase,
      exchange_rate_source: rate.exchangeRateSource,
      exchange_rate_date: rate.exchangeRateDate,
      rate_is_manual: rate.rateIsManual,
      transaction_date: transactionDate,
      paid_by_user_id: paidByUserId,
      related_user_id: relatedUserId,
      description,
      notes: notes || null,
      created_by: context.profile.id
    })
    .select("*")
    .single();

  if (error || !transaction) {
    redirect("/transactions/new?error=save");
  }

  await logActivity({
    supabase,
    accountSpaceId: context.accountSpace.id,
    entityType: "transaction",
    entityId: transaction.id,
    action: "أضاف عملية",
    newValue: {
      amount,
      currency,
      status: "pending_confirmation",
      description
    },
    performedBy: context.profile.id
  });

  const confirmationRecipient = context.members.find(
    (member) => member.user_id !== context.profile.id
  );

  if (confirmationRecipient) {
    await sendEmailNotification(
      "transaction_created",
      "transaction",
      transaction.id,
      confirmationRecipient.user_id
    );
  }

  const receipt = formData.get("receipt");

  if (receipt instanceof File && receipt.size > 0) {
    try {
      await uploadTransactionAttachment({
        supabase,
        file: receipt,
        accountSpaceId: context.accountSpace.id,
        transactionId: transaction.id,
        uploadedBy: context.profile.id
      });

      await logActivity({
        supabase,
        accountSpaceId: context.accountSpace.id,
        entityType: "transaction",
        entityId: transaction.id,
        action: "أضاف إيصال",
        performedBy: context.profile.id
      });

      if (confirmationRecipient) {
        await sendEmailNotification(
          "receipt_uploaded",
          "transaction",
          transaction.id,
          confirmationRecipient.user_id
        );
      }
    } catch (uploadError) {
      console.error(EMPTY_STATES.attachmentUploadError, uploadError);
    }
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  redirect(`/transactions/${transaction.id}`);
}

async function getOwnedTransaction(id: string) {
  const { context, supabase } = await requireActionContext();
  const { data: transaction } = await supabase
    .from("transactions")
    .select("*")
    .eq("account_space_id", context.accountSpace.id)
    .eq("id", id)
    .maybeSingle();

  if (!transaction) {
    redirect("/transactions?error=missing");
  }

  return { context, supabase, transaction };
}

export async function confirmTransactionAction(formData: FormData) {
  const id = cleanText(formData.get("id"));
  const { context, supabase, transaction } = await getOwnedTransaction(id);

  if (transaction.created_by === context.profile.id) {
    redirect(`/transactions/${id}?error=creator-confirm`);
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      status: "confirmed" satisfies TransactionStatus,
      confirmed_by: context.profile.id,
      confirmed_at: new Date().toISOString(),
      rejected_by: null,
      rejected_at: null,
      rejection_reason: null
    })
    .eq("id", id)
    .eq("account_space_id", context.accountSpace.id);

  if (!error) {
    await logActivity({
      supabase,
      accountSpaceId: context.accountSpace.id,
      entityType: "transaction",
      entityId: id,
      action: "أكد العملية",
      oldValue: { status: transaction.status },
      newValue: { status: "confirmed" },
      performedBy: context.profile.id
    });

    await sendEmailNotification(
      "transaction_confirmed",
      "transaction",
      id,
      transaction.created_by
    );
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath(`/transactions/${id}`);
}

export async function rejectTransactionAction(formData: FormData) {
  const id = cleanText(formData.get("id"));
  const reason = cleanText(formData.get("rejection_reason")) || "تم الرفض";
  const { context, supabase, transaction } = await getOwnedTransaction(id);

  if (transaction.created_by === context.profile.id) {
    redirect(`/transactions/${id}?error=creator-reject`);
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      status: "rejected" satisfies TransactionStatus,
      rejected_by: context.profile.id,
      rejected_at: new Date().toISOString(),
      rejection_reason: reason
    })
    .eq("id", id)
    .eq("account_space_id", context.accountSpace.id);

  if (!error) {
    await logActivity({
      supabase,
      accountSpaceId: context.accountSpace.id,
      entityType: "transaction",
      entityId: id,
      action: "رفض العملية",
      oldValue: { status: transaction.status },
      newValue: { status: "rejected", reason },
      performedBy: context.profile.id
    });

    await sendEmailNotification(
      "transaction_rejected",
      "transaction",
      id,
      transaction.created_by
    );
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath(`/transactions/${id}`);
}

export async function cancelTransactionAction(formData: FormData) {
  const id = cleanText(formData.get("id"));
  const { context, supabase, transaction } = await getOwnedTransaction(id);

  const { error } = await supabase
    .from("transactions")
    .update({
      status: "cancelled" satisfies TransactionStatus,
      cancelled_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("account_space_id", context.accountSpace.id);

  if (!error) {
    await logActivity({
      supabase,
      accountSpaceId: context.accountSpace.id,
      entityType: "transaction",
      entityId: id,
      action: "ألغى العملية",
      oldValue: { status: transaction.status },
      newValue: { status: "cancelled" },
      performedBy: context.profile.id
    });
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath(`/transactions/${id}`);
}

export async function completeTransactionAction(formData: FormData) {
  const id = cleanText(formData.get("id"));
  const { context, supabase, transaction } = await getOwnedTransaction(id);

  const { error } = await supabase
    .from("transactions")
    .update({
      status: "completed" satisfies TransactionStatus,
      completed_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("account_space_id", context.accountSpace.id);

  if (!error) {
    await logActivity({
      supabase,
      accountSpaceId: context.accountSpace.id,
      entityType: "transaction",
      entityId: id,
      action: "أكمل العملية",
      oldValue: { status: transaction.status },
      newValue: { status: "completed" },
      performedBy: context.profile.id
    });

    await Promise.all(
      context.members.map((member) =>
        sendEmailNotification(
          "transaction_completed",
          "transaction",
          id,
          member.user_id
        )
      )
    );
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath(`/transactions/${id}`);
}

export async function archiveTransactionAction(formData: FormData) {
  const id = cleanText(formData.get("id"));
  const { context, supabase } = await getOwnedTransaction(id);

  const { error } = await supabase
    .from("transactions")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("account_space_id", context.accountSpace.id);

  if (!error) {
    await logActivity({
      supabase,
      accountSpaceId: context.accountSpace.id,
      entityType: "transaction",
      entityId: id,
      action: "أرشف العملية",
      performedBy: context.profile.id
    });
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath(`/transactions/${id}`);
}

export async function updateTransactionAction(formData: FormData) {
  const id = cleanText(formData.get("id"));
  const { context, supabase, transaction } = await getOwnedTransaction(id);
  const memberIds = context.members.map((member) => member.user_id);
  const amount = parseNumber(formData.get("original_amount"));
  const currency = parseCurrency(formData.get("original_currency"));
  const description = cleanText(formData.get("description"));
  const notes = cleanText(formData.get("notes"));
  const paidByUserId = ensureMember(memberIds, formData.get("paid_by_user_id"));
  const relatedUserId = ensureMember(memberIds, formData.get("related_user_id"));
  const transactionDate = cleanText(formData.get("transaction_date")) || todayIsoDate();
  const rate = exchangeFields(formData, currency, amount);
  const shouldReturnPending = ["confirmed", "completed"].includes(transaction.status);

  if (amount <= 0 || !description || rate.exchangeRateToBase <= 0) {
    redirect(`/transactions/${id}?error=required`);
  }

  const nextStatus: TransactionStatus = shouldReturnPending
    ? "pending_confirmation"
    : transaction.status;

  const { error } = await supabase
    .from("transactions")
    .update({
      status: nextStatus,
      original_amount: amount,
      original_currency: currency,
      base_currency: rate.baseCurrency,
      exchange_rate_to_base: rate.exchangeRateToBase,
      converted_amount_base: rate.convertedAmountBase,
      exchange_rate_source: rate.exchangeRateSource,
      exchange_rate_date: rate.exchangeRateDate,
      rate_is_manual: rate.rateIsManual,
      transaction_date: transactionDate,
      paid_by_user_id: paidByUserId,
      related_user_id: relatedUserId,
      description,
      notes: notes || null,
      confirmed_by: shouldReturnPending ? null : transaction.confirmed_by,
      confirmed_at: shouldReturnPending ? null : transaction.confirmed_at,
      completed_at: shouldReturnPending ? null : transaction.completed_at
    })
    .eq("id", id)
    .eq("account_space_id", context.accountSpace.id);

  if (!error) {
    await logActivity({
      supabase,
      accountSpaceId: context.accountSpace.id,
      entityType: "transaction",
      entityId: id,
      action: "حفظ تعديل",
      oldValue: {
        amount: transaction.original_amount,
        currency: transaction.original_currency,
        status: transaction.status
      },
      newValue: { amount, currency, status: nextStatus },
      performedBy: context.profile.id
    });
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath(`/transactions/${id}`);
}

export async function addAttachmentAction(formData: FormData) {
  const id = cleanText(formData.get("id"));
  const receipt = formData.get("receipt");
  const { context, supabase } = await getOwnedTransaction(id);

  if (!(receipt instanceof File) || receipt.size === 0) {
    redirect(`/transactions/${id}?error=receipt`);
  }

  try {
    await uploadTransactionAttachment({
      supabase,
      file: receipt,
      accountSpaceId: context.accountSpace.id,
      transactionId: id,
      uploadedBy: context.profile.id
    });

    await logActivity({
      supabase,
      accountSpaceId: context.accountSpace.id,
      entityType: "transaction",
      entityId: id,
      action: "أضاف إيصال",
      performedBy: context.profile.id
    });

    const recipient = context.members.find(
      (member) => member.user_id !== context.profile.id
    );

    if (recipient) {
      await sendEmailNotification(
        "receipt_uploaded",
        "transaction",
        id,
        recipient.user_id
      );
    }
  } catch (error) {
    console.error(error);
    redirect(`/transactions/${id}?error=receipt`);
  }

  revalidatePath(`/transactions/${id}`);
}
