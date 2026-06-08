import type { MonthlyExpense } from "@/lib/types";

export function monthlyPeriod(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function dueDateForMonth(dueDay: number, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(Math.max(Math.trunc(dueDay), 1), lastDay);

  return new Date(year, month, safeDay);
}

export function dueDateIso(dueDay: number, date = new Date()) {
  const dueDate = dueDateForMonth(dueDay, date);
  const year = dueDate.getFullYear();
  const month = String(dueDate.getMonth() + 1).padStart(2, "0");
  const day = String(dueDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function startOfMonthIso(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

export function daysUntilDue(dueDay: number, date = new Date()) {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dueDate = dueDateForMonth(dueDay, date);
  const diff = dueDate.getTime() - today.getTime();

  return Math.round(diff / (24 * 60 * 60 * 1000));
}

export function isCompletedThisPeriod(expense: MonthlyExpense, date = new Date()) {
  return expense.last_completed_period === monthlyPeriod(date);
}
