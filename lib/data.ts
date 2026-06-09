import { createSupabaseServerClient } from "@/lib/supabase/server";
import { withSignedAttachmentUrls } from "@/lib/storage";
import type {
  ActivityLog,
  AppContext,
  Attachment,
  CurrencyCode,
  DashboardData,
  MonthlyExpense,
  Profile,
  Repayment,
  Transaction,
  TransactionStatus,
  TransactionType
} from "@/lib/types";

const BALANCE_STATUSES: TransactionStatus[] = ["confirmed", "completed"];

export type TransactionFilters = {
  status?: string;
  type?: string;
  currency?: string;
  person?: string;
  query?: string;
  from?: string;
  to?: string;
};

function emptyDashboard(): DashboardData {
  return {
    transactions: [],
    repayments: [],
    activities: [],
    officialBalance: 0,
    officialBalances: [],
    pendingImpact: 0,
    pendingBalances: [],
    currencyTotals: [],
    monthlyTotal: 0,
    biggestTransaction: null,
    lastRepayment: null
  };
}

function directionForCurrent(
  paidByUserId: string,
  currentProfileId: string | undefined
) {
  return paidByUserId === currentProfileId ? 1 : -1;
}

export function transactionBalanceImpact(
  transaction: Pick<Transaction, "paid_by_user_id" | "converted_amount_base">,
  currentProfileId: string | undefined
) {
  return (
    directionForCurrent(transaction.paid_by_user_id, currentProfileId) *
    Number(transaction.converted_amount_base)
  );
}

function sortBalances(
  balances: Array<{ currency: CurrencyCode; amount: number }>
) {
  return balances
    .filter((item) => Math.abs(item.amount) >= 0.01)
    .sort((a, b) => {
      if (a.currency === "EGP") return -1;
      if (b.currency === "EGP") return 1;
      return a.currency.localeCompare(b.currency);
    });
}

function addBalance(
  totals: Map<CurrencyCode, number>,
  currency: CurrencyCode,
  amount: number
) {
  totals.set(currency, (totals.get(currency) ?? 0) + amount);
}

export function repaymentBalanceImpact(
  repayment: Pick<Repayment, "paid_by_user_id" | "converted_amount_base">,
  currentProfileId: string | undefined
) {
  return (
    directionForCurrent(repayment.paid_by_user_id, currentProfileId) *
    Number(repayment.converted_amount_base)
  );
}

function isOfficial(status: TransactionStatus) {
  return BALANCE_STATUSES.includes(status);
}

async function getProfilesByIds(ids: string[]) {
  const supabase = await createSupabaseServerClient();

  if (!supabase || !ids.length) {
    return new Map<string, Profile>();
  }

  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  const { data } = await supabase.from("profiles").select("*").in("id", uniqueIds);

  return new Map((data ?? []).map((profile) => [profile.id, profile as Profile]));
}

async function attachTransactionProfiles(transactions: Transaction[]) {
  const profileIds = transactions.flatMap((transaction) => [
    transaction.paid_by_user_id,
    transaction.related_user_id,
    transaction.created_by
  ]);
  const profiles = await getProfilesByIds(profileIds);

  return transactions.map((transaction) => ({
    ...transaction,
    paid_by: profiles.get(transaction.paid_by_user_id),
    related_user: profiles.get(transaction.related_user_id),
    creator: profiles.get(transaction.created_by)
  }));
}

async function attachRepaymentProfiles(repayments: Repayment[]) {
  const profileIds = repayments.flatMap((repayment) => [
    repayment.paid_by_user_id,
    repayment.paid_to_user_id,
    repayment.created_by
  ]);
  const profiles = await getProfilesByIds(profileIds);

  return repayments.map((repayment) => ({
    ...repayment,
    paid_by: profiles.get(repayment.paid_by_user_id),
    paid_to: profiles.get(repayment.paid_to_user_id)
  }));
}

async function attachMonthlyExpenseProfiles(expenses: MonthlyExpense[]) {
  const profileIds = expenses.flatMap((expense) => [
    expense.paid_by_user_id,
    expense.related_user_id,
    expense.created_by
  ]);
  const profiles = await getProfilesByIds(profileIds);

  return expenses.map((expense) => ({
    ...expense,
    paid_by: profiles.get(expense.paid_by_user_id),
    related_user: profiles.get(expense.related_user_id),
    creator: profiles.get(expense.created_by)
  }));
}

async function attachActivityProfiles(activities: ActivityLog[]) {
  const profiles = await getProfilesByIds(
    activities.map((activity) => activity.performed_by)
  );

  return activities.map((activity) => ({
    ...activity,
    performer: profiles.get(activity.performed_by)
  }));
}

function applyFilters(
  transactions: Transaction[],
  filters: TransactionFilters = {}
) {
  const search = filters.query?.trim().toLowerCase();

  return transactions.filter((transaction) => {
    if (filters.status && transaction.status !== filters.status) return false;
    if (filters.type && transaction.type !== filters.type) return false;
    if (filters.currency && transaction.original_currency !== filters.currency) {
      return false;
    }
    if (
      filters.person &&
      transaction.paid_by_user_id !== filters.person &&
      transaction.related_user_id !== filters.person
    ) {
      return false;
    }
    if (filters.from && transaction.transaction_date < filters.from) return false;
    if (filters.to && transaction.transaction_date > filters.to) return false;
    if (
      search &&
      !`${transaction.description} ${transaction.notes ?? ""}`
        .toLowerCase()
        .includes(search)
    ) {
      return false;
    }

    return true;
  });
}

export async function getTransactions(
  context: AppContext,
  filters: TransactionFilters = {}
) {
  const supabase = await createSupabaseServerClient();

  if (!supabase || !context.accountSpace) {
    return [];
  }

  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("account_space_id", context.accountSpace.id)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  const transactions = await attachTransactionProfiles(
    ((data ?? []) as Transaction[]).map((transaction) => ({
      ...transaction,
      original_amount: Number(transaction.original_amount),
      exchange_rate_to_base: Number(transaction.exchange_rate_to_base),
      converted_amount_base: Number(transaction.converted_amount_base)
    }))
  );

  return applyFilters(transactions, filters);
}

export async function getTransactionById(context: AppContext, id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase || !context.accountSpace) {
    return null;
  }

  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("account_space_id", context.accountSpace.id)
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const [transaction] = await attachTransactionProfiles([
    {
      ...(data as Transaction),
      original_amount: Number(data.original_amount),
      exchange_rate_to_base: Number(data.exchange_rate_to_base),
      converted_amount_base: Number(data.converted_amount_base)
    }
  ]);

  const { data: attachmentsData } = await supabase
    .from("attachments")
    .select("*")
    .eq("account_space_id", context.accountSpace.id)
    .eq("transaction_id", id)
    .order("created_at", { ascending: false });

  const attachments = await withSignedAttachmentUrls(
    supabase,
    (attachmentsData ?? []) as Attachment[]
  );

  return {
    ...transaction,
    attachments
  } as Transaction;
}

export async function getRepayments(context: AppContext) {
  const supabase = await createSupabaseServerClient();

  if (!supabase || !context.accountSpace) {
    return [];
  }

  const { data } = await supabase
    .from("repayments")
    .select("*")
    .eq("account_space_id", context.accountSpace.id)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  return attachRepaymentProfiles(
    ((data ?? []) as Repayment[]).map((repayment) => ({
      ...repayment,
      original_amount: Number(repayment.original_amount),
      exchange_rate_to_base: Number(repayment.exchange_rate_to_base),
      converted_amount_base: Number(repayment.converted_amount_base)
    }))
  );
}

export async function getMonthlyExpenses(context: AppContext) {
  const result = await getMonthlyExpensesState(context);
  return result.expenses;
}

export async function getMonthlyExpensesState(context: AppContext): Promise<{
  expenses: MonthlyExpense[];
  schemaMissing: boolean;
}> {
  const supabase = await createSupabaseServerClient();

  if (!supabase || !context.accountSpace) {
    return { expenses: [], schemaMissing: false };
  }

  const { data, error } = await supabase
    .from("monthly_expenses")
    .select("*")
    .eq("account_space_id", context.accountSpace.id)
    .order("is_active", { ascending: false })
    .order("due_day", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load monthly expenses", error.message);
    return {
      expenses: [],
      schemaMissing: error.code === "PGRST205"
    };
  }

  const expenses = await attachMonthlyExpenseProfiles(
    ((data ?? []) as MonthlyExpense[]).map((expense) => ({
      ...expense,
      amount: Number(expense.amount),
      due_day: Number(expense.due_day)
    }))
  );

  return { expenses, schemaMissing: false };
}

export async function getActivities(context: AppContext, limit = 30) {
  const supabase = await createSupabaseServerClient();

  if (!supabase || !context.accountSpace) {
    return [];
  }

  const { data } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("account_space_id", context.accountSpace.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return attachActivityProfiles((data ?? []) as ActivityLog[]);
}

export function calculateOfficialBalance(
  transactions: Transaction[],
  repayments: Repayment[],
  currentProfileId: string | undefined
) {
  const transactionBalance = transactions
    .filter((transaction) => isOfficial(transaction.status))
    .reduce(
      (total, transaction) =>
        total + transactionBalanceImpact(transaction, currentProfileId),
      0
    );

  const repaymentBalance = repayments
    .filter((repayment) => isOfficial(repayment.status))
    .reduce(
      (total, repayment) =>
        total + repaymentBalanceImpact(repayment, currentProfileId),
      0
    );

  return transactionBalance + repaymentBalance;
}

export function calculateOfficialBalances(
  transactions: Transaction[],
  repayments: Repayment[],
  currentProfileId: string | undefined
) {
  const totals = new Map<CurrencyCode, number>();

  transactions
    .filter((transaction) => isOfficial(transaction.status))
    .forEach((transaction) => {
      addBalance(
        totals,
        transaction.base_currency,
        transactionBalanceImpact(transaction, currentProfileId)
      );
    });

  repayments
    .filter((repayment) => isOfficial(repayment.status))
    .forEach((repayment) => {
      addBalance(
        totals,
        repayment.base_currency,
        repaymentBalanceImpact(repayment, currentProfileId)
      );
    });

  return sortBalances(
    Array.from(totals.entries()).map(([currency, amount]) => ({
      currency,
      amount
    }))
  );
}

export function calculatePendingImpact(
  transactions: Transaction[],
  repayments: Repayment[],
  currentProfileId: string | undefined
) {
  const transactionImpact = transactions
    .filter((transaction) => transaction.status === "pending_confirmation")
    .reduce(
      (total, transaction) =>
        total + transactionBalanceImpact(transaction, currentProfileId),
      0
    );

  const repaymentImpact = repayments
    .filter((repayment) => repayment.status === "pending_confirmation")
    .reduce(
      (total, repayment) =>
        total + repaymentBalanceImpact(repayment, currentProfileId),
      0
    );

  return transactionImpact + repaymentImpact;
}

export function calculatePendingBalances(
  transactions: Transaction[],
  repayments: Repayment[],
  currentProfileId: string | undefined
) {
  const totals = new Map<CurrencyCode, number>();

  transactions
    .filter((transaction) => transaction.status === "pending_confirmation")
    .forEach((transaction) => {
      addBalance(
        totals,
        transaction.base_currency,
        transactionBalanceImpact(transaction, currentProfileId)
      );
    });

  repayments
    .filter((repayment) => repayment.status === "pending_confirmation")
    .forEach((repayment) => {
      addBalance(
        totals,
        repayment.base_currency,
        repaymentBalanceImpact(repayment, currentProfileId)
      );
    });

  return sortBalances(
    Array.from(totals.entries()).map(([currency, amount]) => ({
      currency,
      amount
    }))
  );
}

function getCurrencyTotals(transactions: Transaction[], repayments: Repayment[]) {
  const totals = new Map<
    string,
    {
      currency: CurrencyCode;
      baseCurrency: CurrencyCode;
      originalTotal: number;
      convertedTotal: number;
    }
  >();

  const add = (
    currency: CurrencyCode,
    baseCurrency: CurrencyCode,
    originalAmount: number,
    convertedAmount: number
  ) => {
    const key = `${currency}-${baseCurrency}`;
    const current = totals.get(key) ?? {
      currency,
      baseCurrency,
      originalTotal: 0,
      convertedTotal: 0
    };

    current.originalTotal += originalAmount;
    current.convertedTotal += convertedAmount;
    totals.set(key, current);
  };

  transactions
    .filter((transaction) => isOfficial(transaction.status))
    .forEach((transaction) => {
      add(
        transaction.original_currency,
        transaction.base_currency,
        transaction.original_amount,
        transaction.converted_amount_base
      );
    });

  repayments
    .filter((repayment) => isOfficial(repayment.status))
    .forEach((repayment) => {
      add(
        repayment.original_currency,
        repayment.base_currency,
        repayment.original_amount,
        repayment.converted_amount_base
      );
    });

  return Array.from(totals.values()).sort((a, b) =>
    `${a.currency}-${a.baseCurrency}`.localeCompare(`${b.currency}-${b.baseCurrency}`)
  );
}

export async function getDashboardData(
  context: AppContext
): Promise<DashboardData> {
  if (!context.accountSpace) {
    return emptyDashboard();
  }

  const [transactions, repayments, activities] = await Promise.all([
    getTransactions(context),
    getRepayments(context),
    getActivities(context, 8)
  ]);

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const officialTransactions = transactions.filter((transaction) =>
    isOfficial(transaction.status)
  );

  return {
    transactions,
    repayments,
    activities,
    officialBalance: calculateOfficialBalance(
      transactions,
      repayments,
      context.profile?.id
    ),
    officialBalances: calculateOfficialBalances(
      transactions,
      repayments,
      context.profile?.id
    ),
    pendingImpact: calculatePendingImpact(
      transactions,
      repayments,
      context.profile?.id
    ),
    pendingBalances: calculatePendingBalances(
      transactions,
      repayments,
      context.profile?.id
    ),
    currencyTotals: getCurrencyTotals(transactions, repayments),
    monthlyTotal: officialTransactions
      .filter((transaction) => {
        const date = new Date(transaction.transaction_date);
        return (
          transaction.base_currency === "EGP" &&
          date.getFullYear() === year &&
          date.getMonth() === month
        );
      })
      .reduce(
        (total, transaction) =>
          total + Math.abs(transaction.converted_amount_base),
        0
      ),
    biggestTransaction:
      officialTransactions.sort(
        (a, b) =>
          Math.abs(b.converted_amount_base) - Math.abs(a.converted_amount_base)
      )[0] ?? null,
    lastRepayment:
      repayments
        .filter((repayment) => isOfficial(repayment.status))
        .sort(
          (a, b) =>
            new Date(b.payment_date).getTime() -
            new Date(a.payment_date).getTime()
        )[0] ?? null
  };
}

export function isTransactionType(value: string): value is TransactionType {
  return [
    "paid_for_other",
    "saved_with_other",
    "repayment",
    "shared_expense",
    "manual_adjustment",
    "other"
  ].includes(value);
}
