# الجرجيرة

تطبيق ويب خاص لترتيب التعاملات الشخصية بين طرفين موثوقين. التطبيق لا يحوّل أموالًا ولا يعمل كبنك أو نظام محاسبة؛ هو فقط يسجل العمليات، السداد، الموافقات، الرصيد، العملات، الإيصالات، والنشاط.

## التقنيات

- Next.js + TypeScript
- Tailwind CSS
- Supabase Auth للبريد وكلمة المرور
- Supabase Postgres مع RLS
- Supabase Storage لإيصالات العمليات
- Vercel للنشر
- Resend اختياري لتنبيهات البريد

## التشغيل المحلي

```bash
npm install
cp .env.example .env.local
npm run dev
```

افتح `http://localhost:3000`.

## متغيرات البيئة

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
EXCHANGE_RATE_API_KEY=
EXCHANGE_RATE_PROVIDER=frankfurter
EMAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM="الجرجيرة <no-reply@your-domain.com>"
CRON_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY` و `RESEND_API_KEY` للخادم فقط. لا تضفهما إلى أي كود يعمل في المتصفح.

## إعداد Supabase

1. أنشئ مشروع Supabase جديد.
2. فعّل Email/Password من Auth.
3. افتح SQL Editor وشغّل [supabase/schema.sql](./supabase/schema.sql).
4. أنشئ المستخدمين الاثنين من Authentication أو دع كل مستخدم يسجل الدخول أول مرة.
5. اربط المستخدمين في `account_members` حسب قسم seed guidance في آخر ملف `schema.sql`.
6. تأكد أن bucket باسم `transaction-attachments` موجود وخاص. الملف ينشئه إن أمكن.

## تنبيهات البريد

- استخدم Supabase Auth لرسائل المصادقة مثل reset password.
- استخدم Resend لتنبيهات التطبيق.
- أضف `RESEND_API_KEY` و `EMAIL_FROM` في Vercel Environment Variables.
- التنبيهات لا ترسل الملاحظات الخاصة ولا ترفق الإيصالات.
- كل محاولة إرسال تسجل في `email_notifications`.

للتذكير اليومي الاختياري على Vercel:

```text
/api/cron/pending-confirmation-reminders
/api/cron/monthly-expense-reminders
```

ضع `CRON_SECRET` وأرسل الهيدر:

```text
Authorization: Bearer <CRON_SECRET>
```

## النشر على Vercel

1. اربط المستودع مع Vercel.
2. أضف كل متغيرات البيئة المطلوبة.
3. اضبط `NEXT_PUBLIC_SITE_URL` على رابط التطبيق.
4. شغّل build:

```bash
npm run build
```

5. انشر التطبيق.

## ملاحظات أمان

- كل الجداول عليها Row Level Security.
- المستخدم يرى فقط المساحة الخاصة التي هو عضو فيها.
- لا يوجد حذف دائم للعمليات المالية؛ استخدم الإلغاء أو الأرشفة.
- كلمات المرور لا تخزن في قاعدة البيانات ولا تظهر في السجلات.
- الإيصالات في bucket خاص وتعرض عبر signed URLs قصيرة.
