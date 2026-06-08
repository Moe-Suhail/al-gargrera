import type { User } from "@supabase/supabase-js";

export type TransactionType =
  | "paid_for_other"
  | "saved_with_other"
  | "repayment"
  | "shared_expense"
  | "manual_adjustment"
  | "other";

export type TransactionStatus =
  | "pending_confirmation"
  | "confirmed"
  | "completed"
  | "rejected"
  | "cancelled";

export type CurrencyCode = "EGP" | "USD" | "SAR" | "AED" | "EUR" | "GBP";

export type Profile = {
  id: string;
  auth_user_id: string;
  display_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  current_residence_label: string | null;
  default_currency: CurrencyCode;
  timezone: string | null;
  profile_image_url: string | null;
  receive_email_notifications: boolean;
  notify_on_transaction_created: boolean;
  notify_on_transaction_confirmed: boolean;
  notify_on_transaction_completed: boolean;
  notify_on_repayment: boolean;
  notify_on_pending_reminder: boolean;
  notify_on_monthly_expense_reminder: boolean;
  created_at: string;
  updated_at: string;
};

export type AccountSpace = {
  id: string;
  name: string;
  base_currency: CurrencyCode;
  created_by: string | null;
  created_at: string;
};

export type AccountMember = {
  id: string;
  account_space_id: string;
  user_id: string;
  role: "owner" | "member";
  created_at: string;
  profile: Profile;
};

export type Transaction = {
  id: string;
  account_space_id: string;
  type: TransactionType;
  status: TransactionStatus;
  original_amount: number;
  original_currency: CurrencyCode;
  base_currency: CurrencyCode;
  exchange_rate_to_base: number;
  converted_amount_base: number;
  exchange_rate_source: string;
  exchange_rate_date: string;
  rate_is_manual: boolean;
  transaction_date: string;
  paid_by_user_id: string;
  related_user_id: string;
  description: string;
  notes: string | null;
  created_by: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  paid_by?: Profile;
  related_user?: Profile;
  creator?: Profile;
  attachments?: Attachment[];
};

export type Repayment = {
  id: string;
  account_space_id: string;
  transaction_id: string | null;
  original_amount: number;
  original_currency: CurrencyCode;
  base_currency: CurrencyCode;
  exchange_rate_to_base: number;
  converted_amount_base: number;
  exchange_rate_source: string;
  exchange_rate_date: string;
  rate_is_manual: boolean;
  payment_date: string;
  paid_by_user_id: string;
  paid_to_user_id: string;
  notes: string | null;
  status: TransactionStatus;
  created_by: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  paid_by?: Profile;
  paid_to?: Profile;
};

export type MonthlyExpense = {
  id: string;
  account_space_id: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  due_day: number;
  paid_by_user_id: string;
  related_user_id: string;
  transaction_type: TransactionType;
  notes: string | null;
  is_active: boolean;
  reminder_enabled: boolean;
  last_completed_period: string | null;
  last_completed_transaction_id: string | null;
  last_reminded_period: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  paid_by?: Profile;
  related_user?: Profile;
  creator?: Profile;
};

export type Attachment = {
  id: string;
  account_space_id: string;
  transaction_id: string;
  file_url: string | null;
  file_path: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string;
  created_at: string;
  signed_url?: string;
};

export type ActivityLog = {
  id: string;
  account_space_id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  performed_by: string;
  created_at: string;
  performer?: Profile;
};

export type AppContext = {
  isConfigured: boolean;
  user: User | null;
  profile: Profile | null;
  accountSpace: AccountSpace | null;
  members: AccountMember[];
};

export type ExchangeRateResult = {
  baseCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  rate: number;
  provider: string;
  fetchedAt: string;
  isManual: boolean;
  validForDate?: string;
};

export type DashboardData = {
  transactions: Transaction[];
  repayments: Repayment[];
  activities: ActivityLog[];
  officialBalance: number;
  pendingImpact: number;
  currencyTotals: Array<{
    currency: CurrencyCode;
    originalTotal: number;
    convertedTotal: number;
  }>;
  monthlyTotal: number;
  biggestTransaction: Transaction | null;
  lastRepayment: Repayment | null;
};
