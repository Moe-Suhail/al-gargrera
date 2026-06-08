import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Coins,
  PauseCircle,
  PlayCircle,
  ReceiptText,
  WalletCards
} from "lucide-react";
import {
  SUPPORTED_CURRENCIES,
  TRANSACTION_TYPES
} from "@/lib/constants";
import { getCurrentContext } from "@/lib/current-context";
import { getMonthlyExpensesState } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import {
  daysUntilDue,
  isCompletedThisPeriod
} from "@/lib/monthly-expenses";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProfileAvatar } from "@/components/profile-avatar";
import { SetupState } from "@/components/setup-state";
import {
  completeMonthlyExpenseAction,
  createMonthlyExpenseAction,
  toggleMonthlyExpenseAction
} from "@/app/monthly-expenses/actions";

const inputClass =
  "min-h-11 w-full rounded-lg border border-white/75 bg-white/72 px-3 py-2 text-sm text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.68)] outline-none backdrop-blur-xl transition placeholder:text-sage/70 focus:border-coin/55 focus:bg-white focus:ring-2 focus:ring-coinSoft/45";
const labelClass = "text-[13px] font-black text-ink";

const ERROR_COPY: Record<string, string> = {
  required: "أكمل اسم المصروف، المبلغ، ويوم الاستحقاق.",
  members: "اختر طرفين مختلفين للمصروف.",
  save: "تعذر حفظ المصروف الثابت.",
  missing: "هذا المصروف غير موجود.",
  inactive: "فعّل المصروف أولًا قبل إكماله.",
  completed: "تم إكمال هذا المصروف لهذا الشهر بالفعل.",
  rate: "تعذر جلب سعر الصرف لهذا المصروف.",
  transaction: "تعذر إنشاء العملية من المصروف الثابت."
};

const SUCCESS_COPY: Record<string, string> = {
  created: "تم إضافة المصروف الشهري الثابت.",
  saved: "تم حفظ التحديث."
};

export const dynamic = "force-dynamic";

export default async function MonthlyExpensesPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const context = await getCurrentContext();

  if (!context.isConfigured) return <SetupState />;
  if (!context.user) redirect("/login");
  if (!context.accountSpace || !context.profile) {
    return <SetupState title="المساحة غير جاهزة" />;
  }

  const { expenses, schemaMissing } = await getMonthlyExpensesState(context);
  const otherMember =
    context.members.find((member) => member.user_id !== context.profile?.id) ??
    context.members[0];
  const error = resolvedSearchParams.error
    ? ERROR_COPY[resolvedSearchParams.error]
    : null;
  const success = resolvedSearchParams.success
    ? SUCCESS_COPY[resolvedSearchParams.success]
    : null;
  const activeExpenses = expenses.filter((expense) => expense.is_active);
  const completedThisMonth = expenses.filter((expense) =>
    isCompletedThisPeriod(expense)
  ).length;
  const nextExpense = activeExpenses
    .filter((expense) => !isCompletedThisPeriod(expense))
    .sort((a, b) => daysUntilDue(a.due_day) - daysUntilDue(b.due_day))[0];
  const nextDue = nextExpense
    ? `${nextExpense.name} · يوم ${nextExpense.due_day}`
    : "لا يوجد استحقاق مفتوح";

  return (
    <AppShell context={context}>
      <PageHeader
        title="المصاريف الثابتة"
        subtitle="استحقاقاتك الشهرية، جاهزة للتحويل إلى عمليات بضغطة."
      />

      <section className="mb-5 overflow-hidden rounded-lg border border-white/75 bg-white/58 p-5 shadow-[0_24px_70px_rgba(31,42,31,0.10)] ring-1 ring-white/70 backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-leaf">نظام المصاريف المتكررة</p>
            <h2 className="mt-1 text-2xl font-black leading-tight text-ink">
              متابعة شهرية بلا فوضى
            </h2>
          </div>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-coin/35 bg-gradient-to-br from-leaf to-[#12351f] text-coinSoft shadow-elevated">
            <WalletCards className="h-6 w-6" />
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-lg border border-white/65 bg-white/44 backdrop-blur-xl">
          <div className="px-3 py-3">
            <p className="text-[11px] font-bold text-sage">نشطة</p>
            <p className="mt-1 text-xl font-black text-ink">{activeExpenses.length}</p>
          </div>
          <div className="border-x border-white/65 px-3 py-3">
            <p className="text-[11px] font-bold text-sage">مكتملة</p>
            <p className="mt-1 text-xl font-black text-ink">{completedThisMonth}</p>
          </div>
          <div className="px-3 py-3">
            <p className="text-[11px] font-bold text-sage">القادم</p>
            <p className="mt-1 truncate text-sm font-black text-ink">{nextDue}</p>
          </div>
        </div>
      </section>

      {success ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/85 px-3 py-2 text-sm font-semibold text-emerald-700">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50/85 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      {schemaMissing ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50/85 px-3 py-2 text-sm font-semibold leading-7 text-amber-800">
          قاعدة البيانات تحتاج تحديثًا قبل استخدام المصاريف الثابتة. افتح Supabase SQL Editor وشغّل ملف{" "}
          <span dir="ltr">supabase/schema.sql</span>
          {" "}ثم أعد تحميل الصفحة.
        </p>
      ) : null}

      <form
        action={createMonthlyExpenseAction}
        className="relative overflow-hidden rounded-lg border border-white/75 bg-white/62 p-5 shadow-[0_22px_62px_rgba(31,42,31,0.10)] ring-1 ring-white/70 backdrop-blur-2xl"
      >
        <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-l from-transparent via-coin/45 to-transparent" />
        <div className="mb-5 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-leaf to-[#163c24] text-coinSoft shadow-soft">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-ink">مصروف شهري جديد</h2>
            <p className="text-sm text-sage">إيجار، اشتراك، قسط، أو أي بند يتكرر.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-2 lg:col-span-2">
            <span className={labelClass}>اسم المصروف</span>
            <input
              className={inputClass}
              name="name"
              placeholder="إيجار الشقة"
              required
            />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>المبلغ</span>
            <input
              className={inputClass}
              inputMode="decimal"
              min="0"
              name="amount"
              required
              step="0.01"
              type="number"
            />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>العملة</span>
            <select
              className={inputClass}
              defaultValue={context.profile.default_currency ?? "EGP"}
              name="currency"
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>يستحق يوم</span>
            <input
              className={inputClass}
              max="31"
              min="1"
              name="due_day"
              placeholder="1"
              required
              type="number"
            />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>من يدفع</span>
            <select
              className={inputClass}
              defaultValue={context.profile.id}
              name="paid_by_user_id"
            >
              {context.members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.profile.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>لمن / الطرف المرتبط</span>
            <select
              className={inputClass}
              defaultValue={otherMember?.user_id ?? context.profile.id}
              name="related_user_id"
            >
              {context.members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.profile.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>نوع العملية عند الإكمال</span>
            <select className={inputClass} name="transaction_type">
              {Object.entries(TRANSACTION_TYPES).map(([value, item]) => (
                <option key={value} value={value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 sm:col-span-2 lg:col-span-4">
            <span className={labelClass}>ملاحظات</span>
            <textarea
              className={`${inputClass} min-h-24 resize-y leading-7`}
              name="notes"
              placeholder="تفصيل مختصر يظهر داخل العملية عند إكمال المصروف"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 text-sm font-bold text-ink">
            <input
              className="h-5 w-5 accent-leaf"
              defaultChecked
              name="reminder_enabled"
              type="checkbox"
            />
            تذكير شهري قبل موعد الاستحقاق
          </label>
          <button
            className="rounded-lg bg-gradient-to-b from-leaf to-[#173f26] px-5 py-3 text-sm font-black text-white shadow-soft transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
            disabled={schemaMissing}
            type="submit"
          >
            حفظ المصروف
          </button>
        </div>
      </form>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-ink">المصاريف المحفوظة</h2>
          <span className="text-sm font-bold text-sage">{expenses.length} بند</span>
        </div>
        <div className="grid gap-3">
          {expenses.length ? (
            expenses.map((expense) => {
              const completed = isCompletedThisPeriod(expense);
              const dueIn = daysUntilDue(expense.due_day);
              const dueText =
                dueIn === 0
                  ? "اليوم"
                  : dueIn > 0
                    ? `بعد ${dueIn} يوم`
                    : `متأخر ${Math.abs(dueIn)} يوم`;

              return (
                <article
                  key={expense.id}
                  className="rounded-lg border border-white/75 bg-white/62 p-4 shadow-card ring-1 ring-white/70 backdrop-blur-2xl"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-coin/30 bg-coinSoft/70 text-leaf shadow-sm">
                          <Coins className="h-5 w-5" />
                        </span>
                        <h3 className="text-lg font-black text-ink">{expense.name}</h3>
                        <span
                          className={
                            expense.is_active
                              ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"
                              : "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600"
                          }
                        >
                          {expense.is_active ? "نشط" : "متوقف"}
                        </span>
                        {completed ? (
                          <span className="rounded-full border border-leaf/20 bg-limeSoft px-2.5 py-1 text-xs font-bold text-leaf">
                            مكتمل هذا الشهر
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-2xl font-black text-ink">
                        {formatMoney(expense.amount, expense.currency)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-sm text-sage">
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/55 px-3 py-1 backdrop-blur-xl">
                          <CalendarClock className="h-4 w-4" />
                          يوم {expense.due_day} · {dueText}
                        </span>
                        {expense.reminder_enabled ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/55 px-3 py-1 backdrop-blur-xl">
                            <Bell className="h-4 w-4" />
                            التذكير مفعل
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {[expense.paid_by, expense.related_user].filter(Boolean).map((profile) => (
                          <div
                            key={profile?.id}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/70 bg-white/50 px-2 py-1.5 backdrop-blur-xl"
                          >
                            <ProfileAvatar
                              imageUrl={profile?.profile_image_url}
                              name={profile?.display_name}
                              size="sm"
                            />
                            <span className="text-sm font-bold text-ink">
                              {profile?.display_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-2 sm:min-w-44">
                      {expense.last_completed_transaction_id ? (
                        <Link
                          href={`/transactions/${expense.last_completed_transaction_id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/75 bg-white/55 px-4 py-2 text-sm font-bold text-leaf transition hover:bg-limeSoft/70"
                        >
                          <ReceiptText className="h-4 w-4" />
                          آخر عملية
                        </Link>
                      ) : null}
                      <form action={completeMonthlyExpenseAction}>
                        <input type="hidden" name="id" value={expense.id} />
                        <button
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-leaf to-[#173f26] px-4 py-2 text-sm font-black text-white shadow-soft transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
                          disabled={!expense.is_active || completed}
                          type="submit"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          إكمال هذا الشهر
                        </button>
                      </form>
                      <form action={toggleMonthlyExpenseAction}>
                        <input type="hidden" name="id" value={expense.id} />
                        <input
                          type="hidden"
                          name="is_active"
                          value={expense.is_active ? "false" : "true"}
                        />
                        <button
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/75 bg-white/55 px-4 py-2 text-sm font-bold text-ink transition hover:bg-white"
                          type="submit"
                        >
                          {expense.is_active ? (
                            <PauseCircle className="h-4 w-4 text-sage" />
                          ) : (
                            <PlayCircle className="h-4 w-4 text-leaf" />
                          )}
                          {expense.is_active ? "إيقاف مؤقت" : "تفعيل"}
                        </button>
                      </form>
                    </div>
                  </div>
                  {expense.notes ? (
                    <p className="mt-3 rounded-lg border border-white/65 bg-white/46 px-3 py-2 text-sm leading-6 text-sage backdrop-blur-xl">
                      {expense.notes}
                    </p>
                  ) : null}
                </article>
              );
            })
          ) : (
            <p className="rounded-lg border border-white/75 bg-white/62 p-5 text-sm text-sage shadow-card ring-1 ring-white/70 backdrop-blur-2xl">
              لا توجد مصاريف ثابتة بعد.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
