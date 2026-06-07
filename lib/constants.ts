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

export const APP_NAME = "الجرجيرة 🌳";
export const APP_TAGLINE = "تعاملاتنا الشخصية بشكل واضح وآمن";
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
    label: "دفعت عنه",
    description: "مبلغ دفعه شخص بدل الآخر",
    icon: HandCoins
  },
  saved_with_other: {
    label: "مبلغ محفوظ عنده",
    description: "مبلغ محفوظ مع الشخص الآخر",
    icon: Banknote
  },
  repayment: {
    label: "سداد",
    description: "سداد كامل أو جزئي",
    icon: RotateCcw
  },
  shared_expense: {
    label: "مصروف مشترك",
    description: "مصروف يتم تقسيمه أو تحديده",
    icon: SplitSquareHorizontal
  },
  manual_adjustment: {
    label: "تعديل بسيط",
    description: "تصحيح يدوي مع ملاحظة",
    icon: Activity
  },
  other: {
    label: "أخرى",
    description: "عملية مرنة حسب الحاجة",
    icon: ReceiptText
  }
} as const;

export const TRANSACTION_STATUSES = {
  pending_confirmation: {
    label: "بانتظار التأكيد",
    chip: "border-amber-200 bg-amber-50 text-amber-800",
    icon: Clock3
  },
  confirmed: {
    label: "تم التأكيد",
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
  { href: "/transactions/new", label: "إضافة عملية", icon: ReceiptText },
  { href: "/repayments", label: "إضافة سداد", icon: RotateCcw },
  { href: "/converter", label: "محول العملات", icon: Coins },
  { href: "/reports", label: "كشف بسيط", icon: Activity }
];

export const EMPTY_STATES = {
  loading: "جاري تحميل البيانات...",
  noTransactions: "لا توجد عمليات بعد",
  noPending: "لا توجد عمليات بانتظار التأكيد",
  exchangeRateError: "تعذر جلب سعر الصرف الحالي",
  attachmentUploadError: "تعذر رفع الإيصال، حاول مرة أخرى",
  unauthorized: "لا يمكنك الوصول إلى هذه الصفحة",
  genericError: "حدث خطأ غير متوقع"
};

export const SUCCESS_MESSAGES = {
  transactionCreated: "تمت إضافة العملية بنجاح",
  transactionConfirmed: "تم تأكيد العملية",
  transactionRejected: "تم رفض العملية",
  editSaved: "تم حفظ التعديل",
  attachmentUploaded: "تم رفع الإيصال"
};
