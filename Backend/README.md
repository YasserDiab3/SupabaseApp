# خلفية تطبيق HSE - Supabase

نسخة الخلفية المعتمدة على **Supabase** (قاعدة بيانات PostgreSQL + Edge Functions) ومتوافقة مع واجهة التطبيق الحالية.

## المتطلبات

- [Supabase CLI](https://supabase.com/docs/guides/cli) (للتشغيل المحلي أو ربط المشروع السحابي)
- حساب [Supabase](https://supabase.com)

## الهيكل

```
Backend/
  supabase/
    config.toml          # إعدادات المشروع المحلي
    migrations/          # ترحيلات SQL لإنشاء الجداول
    functions/
      hse-api/           # Edge Function واحدة تستقبل { action, data } وترد بنفس شكل التطبيق الأصلي
        index.ts
```

## الإعداد

### 1) مشروع Supabase سحابي

1. أنشئ مشروعاً جديداً من [Supabase Dashboard](https://app.supabase.com).
2. من **Settings → API** انسخ:
   - **Project URL** (مثل `https://xxxx.supabase.co`)
   - **anon public** key

### 2) ربط المشروع المحلي بالمشروع السحابي (اختياري)

من مجلد `Backend`:

```bash
cd Backend
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 3) نشر Edge Function

```bash
supabase functions deploy hse-api
```

بعد النشر، عنوان الدالة سيكون:

`https://YOUR_PROJECT_REF.supabase.co/functions/v1/hse-api`

### 4) إعداد الواجهة الأمامية

في مجلد `Frontend` (أو من واجهة التطبيق):

- عيّن في الحالة الافتراضية أو من الإعدادات:
  - `AppState.useSupabaseBackend = true`
  - `AppState.supabaseUrl = 'https://YOUR_PROJECT_REF.supabase.co'`
  - `AppState.supabaseAnonKey = 'YOUR_ANON_KEY'`

يمكن تعيينها من **app-utils.js** (القيم الافتراضية) أو من شاشة إعدادات التطبيق إذا تم ربطها.

## التشغيل المحلي (اختياري)

```bash
cd Backend
supabase start
supabase functions serve hse-api
```

ثم استخدم في الواجهة:

- `supabaseUrl`: `http://127.0.0.1:54321` (أو حسب إعداداتك)
- `supabaseAnonKey`: المفتاح من `supabase status`

## الجداول (الترحيلات)

الترحيلات التالية تنشئ جداول مطابقة لأوراق النسخة الحالية، كل جدول يحتوي على:

- `id` (text, primary key)
- `data` (jsonb)
- `created_at`, `updated_at`

أسماء الجداول بصيغة snake_case (مثل `users`, `clinic_visits`, `ptw`).

- `20260205000001_initial_sheets_tables.sql` — الجداول الأساسية
- `20260221000001_change_requests_table.sql` — إدارة التغيرات
- `20260221000002_complete_sheets_tables.sql` — إكمال جميع جداول النسخة الحالية

## الـ Actions المدعومة

- `testConnection`, `initializeSheets`
- `readFromSheet`, `saveToSheet`, `appendToSheet`
- `getMapCoordinates`, `saveMapCoordinates`, `getDefaultCoordinates`, `saveDefaultCoordinates`
- إجراءات المستخدمين: `addUser`, `updateUser`, `deleteUser`, `resetUserPassword`
- إجراءات مرتبطة بالجداول عبر خريطة (مثل `getAllClinicVisits`, `addClinicVisit`, …)

الواجهة ترسل الطلبات بنفس الشكل المستخدم مع الخادم (Script/Supabase)؛ الدالة `hse-api` ترد بنفس شكل الرد المتوقع.
