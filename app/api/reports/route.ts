import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/current-context";
import { getRepayments, getTransactions } from "@/lib/data";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const context = await getCurrentContext();

  if (!context.isConfigured || !context.user || !context.accountSpace) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [transactions, repayments] = await Promise.all([
    getTransactions(context),
    getRepayments(context)
  ]);

  const rows = [
    [
      "kind",
      "date",
      "description",
      "amount",
      "currency",
      "balance_amount",
      "balance_currency",
      "status",
      "paid_by",
      "related"
    ],
    ...transactions.map((transaction) => [
      "transaction",
      transaction.transaction_date,
      transaction.description,
      transaction.original_amount,
      transaction.original_currency,
      transaction.converted_amount_base,
      transaction.base_currency,
      transaction.status,
      transaction.paid_by?.display_name ?? "",
      transaction.related_user?.display_name ?? ""
    ]),
    ...repayments.map((repayment) => [
      "repayment",
      repayment.payment_date,
      repayment.notes ?? "سداد",
      repayment.original_amount,
      repayment.original_currency,
      repayment.converted_amount_base,
      repayment.base_currency,
      repayment.status,
      repayment.paid_by?.display_name ?? "",
      repayment.paid_to?.display_name ?? ""
    ])
  ];

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=al-gargeera-report.csv"
    }
  });
}
