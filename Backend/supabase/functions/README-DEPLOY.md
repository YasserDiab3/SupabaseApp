# نشر دالة HSE API على Supabase

لتوقف رسالة **400 - Action not implemented: getAllIssues** (وباقي الإجراءات المضافة حديثاً)، يجب **إعادة نشر** الدالة `hse-api` على مشروعك.

## من سطر الأوامر

1. تثبيت Supabase CLI إن لم يكن مثبتاً:
   ```bash
   npm install -g supabase
   ```

2. تسجيل الدخول (مرة واحدة):
   ```bash
   supabase login
   ```

3. من مجلد المشروع، ربط المشروع إن لم يكن مربوطاً:
   ```bash
   cd "d:\App\v.2-ok run\SupabaseApp\Backend"
   supabase link --project-ref rtxleteymcqmtzrozckh
   ```

4. نشر الدالة:
   ```bash
   supabase functions deploy hse-api
   ```

بعد النشر، استدعاءات `getAllIssues` و`addIssue` ستُلبى من الخادم ولن تظهر 400.

## استرجاع كلمة المرور عبر البريد

لتشغيل ميزة «نسيت كلمة المرور» (إرسال رابط إلى البريد):

1. **تشغيل الترحيل** لجدول الرموز:
   ```bash
   supabase db push
   ```
   (يُنشئ جدول `password_reset_tokens` إذا استخدمت الترحيل `20260221130000_password_reset_tokens.sql`.)

2. **إعداد إرسال البريد (Resend)** — لا تضف المفتاح في الكود، استخدم **Secrets** فقط:

   **من سطر الأوامر (بعد الربط):**
   ```powershell
   npx supabase secrets set RESEND_API_KEY=المفتاح_من_Resend
   npx supabase secrets set RESEND_FROM_EMAIL="Password Reset <onboarding@resend.dev>"
   ```
   استبدل `المفتاح_من_Resend` بمفتاحك. مع الحساب المجاني لـ Resend يمكن استخدام `onboarding@resend.dev` كمرسل للتجربة.

   **أو من لوحة Supabase:** Project Settings → Edge Functions → إضافة Secrets للدالة (إن وُجدت في واجهة المشروع).

   - `RESEND_API_KEY`: مفتاح API من [resend.com](https://resend.com)
   - `RESEND_FROM_EMAIL`: عنوان المرسل، مثال: `استرجاع كلمة المرور <onboarding@resend.dev>` أو من نطاقك بعد التحقق
   - (اختياري) `PASSWORD_RESET_APP_URL`: عنوان التطبيق لبناء رابط الاسترجاع، إن لم يُرسل من الواجهة.

   بعد تعيين الـ Secrets لا حاجة لإعادة نشر الدالة؛ تُحمّل تلقائياً.

بدون `RESEND_API_KEY` سترد الدالة بأن خدمة الاسترجاع غير مفعّلة.

## تجنب خطأ 401 (غير مصرح بالوصول)

Supabase **لا يسمح** بإنشاء أو تعديل أسرار تبدأ أسماؤها بـ `SUPABASE_`. استخدم السر التالي بدلاً من ذلك:

**أضف في أسرار الدالة (Secrets):**

- **الاسم:** `HSE_ANON_KEY` (لا تستخدم `SUPABASE_ANON_KEY` — غير مسموح)
- **القيمة:** نسخ **المفتاح العام (anon/public)** من Supabase → **Project Settings** → **API** → Project API keys → الحقل **anon** (يبدأ عادةً بـ `eyJ...`)

بعد إضافة `HSE_ANON_KEY` وإعادة نشر الدالة، الطلبات مع `Authorization: Bearer <anon key>` ستُقبل ولن تحتاج إلى تعيين `HSE_API_SECRET` في الواجهة.

(بديل: تعيين `HSE_API_SECRET` في الأسرار ثم نفس القيمة في `Frontend/js/config.js` أو عبر `scripts/inject-secret.js` عند البناء.)

## من لوحة Supabase

- من **Edge Functions** انسخ محتوى `hse-api/index.ts` والصقه في المحرر ثم احفظ/انشر، أو استخدم ربط المستودع ونشر تلقائي إن كان مفعّلاً.

## الجدول issue_tracking

تأكد من تشغيل الترحيلات لإنشاء جدول تتبع المشاكل:

```bash
cd "d:\App\v.2-ok run\SupabaseApp\Backend"
supabase db push
```
