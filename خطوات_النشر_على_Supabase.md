# دليل نشر تطبيق HSE على Supabase — من الصفر إلى الإنتاج

هذا الدليل يوضح خطوات تشغيل ونشر نسخة تطبيق HSE المعتمدة على **Supabase** (قاعدة بيانات PostgreSQL + Edge Functions) من البداية حتى التشغيل في بيئة الإنتاج.

---

## المرحلة 0: المتطلبات المسبقة

| المتطلب | الوصف |
|---------|--------|
| حساب Supabase | [إنشاء حساب](https://supabase.com) ثم تسجيل الدخول في [Dashboard](https://app.supabase.com). |
| Supabase CLI | [تثبيت CLI](https://supabase.com/docs/guides/cli) على جهازك (لترحيلات قاعدة البيانات ونشر الدوال). |
| Node.js (اختياري) | لتشغيل خادم محلي للواجهة (مثل `npx serve`) أو لأدوات البناء. |
| Git (اختياري) | لإدارة نسخ المشروع ونشره من مستودع. |

---

## المرحلة 1: إنشاء مشروع Supabase (من الصفر)

### 1.1 إنشاء المشروع

1. ادخل إلى [Supabase Dashboard](https://app.supabase.com).
2. اضغط **New Project**.
3. اختر **Organization** (أو أنشئ واحدة).
4. أدخل:
   - **Name**: اسم المشروع (مثل `hse-app-prod`).
   - **Database Password**: كلمة مرور قوية لحساب قاعدة البيانات (احفظها).
   - **Region**: المنطقة الأقرب للمستخدمين.
5. اضغط **Create new project** وانتظر اكتمال الإنشاء.

### 1.2 الحصول على بيانات الاتصال

1. من القائمة الجانبية: **Settings** → **API**.
2. انسخ واحتفظ بـ:
   - **Project URL** (مثل: `https://xxxxxxxxxxxx.supabase.co`).
   - **anon public** (المفتاح العام للواجهة الأمامية — آمن للاستخدام من المتصفح).
   - **project_id** أو **Reference ID** (معرف المشروع، يظهر في الرابط أو في **Settings → General**)، سنسميه `YOUR_PROJECT_REF`.

---

## المرحلة 2: إعداد المشروع المحلي وربطه بـ Supabase

### 2.1 فتح المشروع المحلي

من الجذر الذي يحتوي مجلد `SupabaseApp`:

```bash
cd SupabaseApp/Backend
```

### 2.2 تسجيل الدخول وربط المشروع

```bash
supabase login
```

اتبع التعليمات في المتصفح لتسجيل الدخول، ثم:

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

استبدل `YOUR_PROJECT_REF` بمعرف المشروع من لوحة Supabase. بعد الربط بنجاح، يصبح هذا المجلد مرتبطاً بمشروعك السحابي.

---

## المرحلة 3: تطبيق ترحيلات قاعدة البيانات

ترحيلات SQL تنشئ جميع الجداول المطلوبة للتطبيق (مطابقة لأوراق النسخة الأصلية).

### 3.1 تنفيذ الترحيلات

من مجلد `SupabaseApp/Backend`:

```bash
supabase db push
```

هذا ينفذ بالترتيب:

- `20260205000001_initial_sheets_tables.sql` — الجداول الأساسية (المستخدمين، الحوادث، PTW، العيادة، المقاولين، …).
- `20260221000001_change_requests_table.sql` — جدول طلبات التغيير (إدارة التغيرات).
- `20260221000002_complete_sheets_tables.sql` — إكمال جميع جداول النسخة الحالية (سجلات الحوادث، PTW، العيادة المقاولين، ISO، الاستدامة، الطوارئ، المعدات، الميزانية، إعدادات الشركة، …).

### 3.2 في حال وجود أخطاء

- إذا ظهر خطأ أن الجدول موجود مسبقاً: الترحيلات تستخدم `CREATE TABLE IF NOT EXISTS`، فعادةً المشكلة من ترحيل آخر. راجع الرسالة وتأكد من عدم تعارض أسماء الجداول.
- إذا ظهر خطأ صلاحيات: تأكد أن المشروع مرتبط بـ `supabase link` وأنك مسجّل الدخول بحساب له صلاحية على المشروع.

---

## المرحلة 4: نشر Edge Function (واجهة API التطبيق)

الدالة `hse-api` هي الواجهة الموحدة التي تستقبل طلبات التطبيق (بديل Google Apps Script).

### 4.1 النشر

من مجلد `SupabaseApp/Backend`:

```bash
supabase functions deploy hse-api
```

### 4.2 التحقق

بعد النشر، عنوان الاستدعاء:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/hse-api
```

من **Dashboard** → **Edge Functions** يمكنك التأكد من أن الدالة `hse-api` موجودة وحالة النشر ناجحة. الدالة تستخدم تلقائياً `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY` من المشروع؛ لا حاجة لتعيينهما يدوياً في النشر العادي.

---

## المرحلة 5: إعداد الواجهة الأمامية للاتصال بـ Supabase

### 5.1 تعيين بيانات الاتصال في الكود (قبل أول تشغيل)

افتح الملف:

```
SupabaseApp/Frontend/js/modules/app-utils.js
```

وابحث عن القسم الافتراضي (مثل `defaultConfig` أو القيم الأولية) وعدّل:

```javascript
useSupabaseBackend: true,
supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
supabaseAnonKey: 'YOUR_ANON_KEY',
```

- استبدل `YOUR_PROJECT_REF` بمعرف مشروعك.
- استبدل `YOUR_ANON_KEY` بمفتاح **anon public** من **Settings → API**.

### 5.2 (اختياري) الإعداد من واجهة التطبيق

إذا كانت شاشة الإعدادات تدعم تعيين الخلفية، يمكن لاحقاً تعيين نفس القيم من داخل التطبيق بعد أول تشغيل ناجح.

---

## المرحلة 6: التشغيل المحلي (اختبار قبل الإنتاج)

### 6.1 تشغيل خادم محلي للواجهة

من مجلد الواجهة:

```bash
cd SupabaseApp/Frontend
npx serve .
```

أو:

```bash
python -m http.server 8080
```

ثم افتح في المتصفح العنوان المعروض (مثل `http://localhost:3000` أو `http://localhost:8080`).

### 6.2 التحقق السريع

1. فتح التطبيق وتسجيل الدخول.
2. فتح قسم **إدارة التغيرات** (أو أي موديول يعتمد على الخلفية).
3. إضافة أو تحميل بيانات والتأكد من عدم ظهور أخطاء شبكة أو رسائل "فشل الاتصال" في الكونسول (F12).

إذا عملت الشاشات والبيانات كما هو متوقع، تكون البيئة جاهزة للنشر إلى الإنتاج.

---

## المرحلة 7: النشر إلى الإنتاج (استضافة الواجهة الأمامية)

التطبيق يعمل كـ **واجهة ثابتة (Static)**؛ لا حاجة لخادم تطبيق، يكفي استضافة الملفات.

### 7.1 ما الذي يُنشر؟

انشر **بالكامل** محتويات مجلد:

```
SupabaseApp/Frontend
```

بما في ذلك:

- `index.html`
- مجلدات `js/`, `css/`, `icons/` وجميع الملفات الثابتة الأخرى.

### 7.2 منصات مقترحة

| المنصة | ملاحظات |
|--------|---------|
| **Netlify** | ربط مجلد أو مستودع Git، تعيين مجلد النشر إلى `SupabaseApp/Frontend` أو جذر المشروع مع Base directory. |
| **Vercel** | نفس الفكرة؛ تعيين Root Directory إلى `SupabaseApp/Frontend` إن لزم. |
| **Cloudflare Pages** | رفع مجلد `SupabaseApp/Frontend` أو ربط Git. |
| أي استضافة ثابتة | رفع محتويات `SupabaseApp/Frontend` عبر FTP/SFTP أو واجهة الملفات، مع جعل `index.html` الصفحة الافتراضية. |

### 7.3 نقاط مهمة للإنتاج

- **لا** تضع مفاتيح **service_role** في الواجهة الأمامية؛ استخدم فقط **anon public** في `supabaseAnonKey`.
- إن أمكن، استخدم **نطاقاً خاصاً (Custom Domain)** وربطه في لوحة الاستضافة و/أو Supabase إن كان مطلوباً.
- تفعيل **HTTPS** من منصة الاستضافة لضمان اتصال آمن بـ Supabase.

---

## المرحلة 8: التحقق النهائي في الإنتاج

1. فتح عنوان التطبيق المنشور في المتصفح.
2. تسجيل الدخول وتجربة الموديولات الرئيسية (مستخدمون، حوادث، إدارة التغيرات، …).
3. مراقبة تبويب **Network** (F12) للتأكد من أن طلبات `hse-api` ترجع حالة 200 وبدون أخطاء CORS.
4. إن وُجدت أخطاء: مراجعة أن `supabaseUrl` و `supabaseAnonKey` صحيحان وأن Edge Function `hse-api` منشورة وتعمل من **Dashboard** → **Edge Functions**.

---

## ملخص الأوامر من الصفر إلى الإنتاج

```bash
# 1) الدخول لمجلد الخلفية
cd SupabaseApp/Backend

# 2) تسجيل الدخول وربط المشروع
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# 3) تطبيق الترحيلات
supabase db push

# 4) نشر الدالة
supabase functions deploy hse-api
```

ثم:

- تعيين **supabaseUrl** و **supabaseAnonKey** في `SupabaseApp/Frontend/js/modules/app-utils.js`.
- تشغيل محلي: من `SupabaseApp/Frontend` تشغيل `npx serve .` والتحقق.
- نشر محتويات `SupabaseApp/Frontend` إلى منصة الاستضافة المختارة.

---

## مزامنة نسخة Supabase مع النسخة الحالية (Frontend/Backend)

للمحافظة على تطابق نسخة Supabase مع النسخة الحالية للمشروع:

1. **الواجهة:** انسخ الملفات المحدثة من `Frontend/` إلى `SupabaseApp/Frontend/` (موديولات، خدمات، CSS، إلخ)، مع الإبقاء على:
   - تحميل **supabase-integration.js** (وليس google-integration.js) في `index.html`.
   - القيم الافتراضية الخاصة بـ Supabase في `app-utils.js`: `useSupabaseBackend: true`, `supabaseUrl`, `supabaseAnonKey`.
2. **الخلفية:** عند إضافة موديول/ورقة جديدة:
   - إضافة ترحيل SQL جديد في `SupabaseApp/Backend/supabase/migrations/` لإنشاء الجدول المناسب.
   - تحديث `SupabaseApp/Backend/supabase/functions/hse-api/index.ts` (خريطة الـ actions والجداول أو المعالجات الخاصة) ليدعم الـ actions الجديدة.

بهذا يكون التشغيل والتطبيق على Supabase من الصفر إلى الإنتاج موثقاً وواضحاً.
