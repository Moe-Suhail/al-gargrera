import {
  Activity,
  Archive,
  Banknote,
  CheckCircle2,
  Clock3,
  Coins,
  HandCoins,
  ReceiptText,
  RotateCcw,
  SplitSquareHorizontal,
  XCircle
} from "lucide-react";

export const APP_NAME = "الجرجيرة 💰";
export const APP_TAGLINE = "مساحة خاصة لترتيب المدفوعات والرصيد بوضوح";
export const BASE_CURRENCY = "EGP";

export const SUPPORTED_CURRENCIES = [
  { code: "EGP", name: "جنيه مصري", shortName: "جنيه" },
  { code: "USD", name: "دولار أمريكي", shortName: "دولار" },
  { code: "SAR", name: "ريال سعودي", shortName: "ريال" },
  { code: "AED", name: "درهم إماراتي", shortName: "درهم" },
  { code: "EUR", name: "يورو", shortName: "يورو" },
  { code: "GBP", name: "جنيه إسترليني", shortName: "إسترليني" }
] as const;

export const TRANSACTION_TYPES = {
  paid_for_other: {
    label: "دفعة بالنيابة",
    description: "مبلغ دفعه طرف بدل الطرف الآخر",
    icon: HandCoins
  },
  saved_with_other: {
    label: "مبلغ محفوظ",
    description: "مبلغ موجود عند الطرف الآخر",
    icon: Banknote
  },
  repayment: {
    label: "سداد",
    description: "سداد كامل أو جزئي من الرصيد",
    icon: RotateCcw
  },
  shared_expense: {
    label: "مصروف مشترك",
    description: "مصروف مشترك بتوزيع واضح",
    icon: SplitSquareHorizontal
  },
  manual_adjustment: {
    label: "تصحيح سريع",
    description: "تعديل صغير مع سبب واضح",
    icon: Activity
  },
  other: {
    label: "عملية أخرى",
    description: "لأي حالة خاصة لا تناسب الخيارات",
    icon: ReceiptText
  }
} as const;

export const TRANSACTION_STATUSES = {
  pending_confirmation: {
    label: "بانتظار الموافقة",
    chip: "border-amber-200 bg-amber-50 text-amber-800",
    icon: Clock3
  },
  confirmed: {
    label: "مؤكدة",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2
  },
  completed: {
    label: "مكتملة",
    chip: "border-leaf/20 bg-limeSoft/80 text-leaf",
    icon: CheckCircle2
  },
  rejected: {
    label: "مرفوضة",
    chip: "border-red-200 bg-red-50 text-red-700",
    icon: XCircle
  },
  cancelled: {
    label: "ملغاة",
    chip: "border-slate-200 bg-slate-50 text-slate-600",
    icon: Archive
  }
} as const;

export const QUICK_ACTIONS = [
  { href: "/transactions/new", label: "عملية جديدة", icon: ReceiptText },
  { href: "/repayments", label: "تسجيل سداد", icon: RotateCcw },
  { href: "/converter", label: "تحويل عملة", icon: Coins },
  { href: "/reports", label: "التقارير", icon: Activity }
];

export const EMPTY_STATES = {
  loading: "جاري تحميل البيانات...",
  noTransactions: "لا توجد عمليات حتى الآن",
  noPending: "لا توجد عمليات تنتظر الموافقة",
  exchangeRateError: "لم نتمكن من جلب سعر الصرف الآن",
  attachmentUploadError: "لم يتم رفع الإيصال، جرّب مرة أخرى",
  unauthorized: "لا يمكنك الوصول إلى هذه الصفحة",
  genericError: "حدث خطأ غير متوقع"
};

export const SUCCESS_MESSAGES = {
  transactionCreated: "تم تسجيل العملية",
  transactionConfirmed: "تمت الموافقة على العملية",
  transactionRejected: "تم رفض العملية",
  editSaved: "تم حفظ التحديث",
  attachmentUploaded: "تم رفع الإيصال"
};
