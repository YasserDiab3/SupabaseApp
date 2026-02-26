# أوامر الترحيل والنشر — Supabase HSE App

## المتطلبات

- [Supabase CLI](https://supabase.com/docs/guides/cli) مثبت (`supabase --version`)
- مشروع Supabase (سحابي) أو تشغيل محلي

---

## التشغيل الآلي (موصى به)

من مجلد **Backend** شغّل السكربت لتنفيذ الخطوات بالترتيب تلقائياً:

```powershell
cd d:\App\v.2-ok run\SupabaseApp\Backend
.\deploy.ps1
```

**ماذا يفعل السكربت (بالترتيب):**

| الخطوة | الأمر | الشرح |
|--------|--------|--------|
| 1 | `supabase link` | يربط مجلد المشروع بالمشروع السحابي (معرف `rtxleteymcqmtzrozckh`) حتى تعمل الأوامر التالية على المشروع الصحيح. يُنفَّذ مرة واحدة أو عند تغيير المشروع. |
| 2 | `supabase db push` | يطبّق ملفات الـ migrations (من `supabase/migrations/`) على قاعدة البيانات السحابية: إنشاء/تعديل الجداول، الفهارس، وسياسات RLS. |
| 3 | `supabase functions deploy hse-api` | يرفع دالة **hse-api** (Edge Function) إلى السحابة لتصبح واجهة API التي يتصل بها الواجهة الأمامية. |
| 4 (اختياري) | إنشاء bucket | إنشاء حاوية **user-photo** في Storage لصور الملف الشخصي. يحتاج مفتاح Service Role. |

**تخطي الربط** (إذا كان المشروع مرتبطاً مسبقاً):

```powershell
.\deploy.ps1 -SkipLink
```

**تشغيل مع إنشاء bucket صور المستخدمين** (بعد تعيين المفتاح السري مرة واحدة):

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="<مفتاح service_role من Dashboard → Project Settings → API>"
.\deploy.ps1 -CreateBucket
```

(السكربت يستخدم تلقائياً `SUPABASE_URL` للمشروع الحالي إن لم يُعيّن.)

---

## 1. ربط المشروع السحابي (مرة واحدة)

من مجلد **Backend** أو من جذر **SupabaseApp** حيث يوجد مجلد `supabase`:

```bash
cd Backend
supabase link --project-ref rtxleteymcqmtzrozckh
```

أو من جذر المستودع إذا كان `supabase` تحت مسار المشروع:

```bash
cd d:\App\v.2-ok run\SupabaseApp\Backend
supabase link --project-ref rtxleteymcqmtzrozckh
```

معرف المشروع الحالي: `rtxleteymcqmtzrozckh` (من الرابط `https://rtxleteymcqmtzrozckh.supabase.co`).

---

## 2. ترحيل قاعدة البيانات (تطبيق الـ migrations)

من نفس المجلد (`Backend`):

```bash
supabase db push
```

أو لتشغيل الـ migrations على المشروع المرتبط فقط دون تطبيق محلي:

```bash
supabase migration up
```

للمشروع السحابي المرتبط عادةً يُستخدم:

```bash
supabase db push
```

---

## 3. نشر Edge Function (دالة hse-api)

من مجلد **Backend**:

```bash
supabase functions deploy hse-api
```

لتعيين أسرار الدالة (مثلاً مفتاح API أو Anon للمصادقة):

```bash
supabase secrets set HSE_API_SECRET=your_secret_here
supabase secrets set HSE_ANON_KEY=your_anon_key_here
```

---

## 4. إنشاء bucket صور المستخدمين (مرة واحدة)

يُستخدم الـ bucket **user-photo** لرفع صورة الملف الشخصي من لوحة التحكم.

### الطريقة أ: السكربت (موصى به)

من مجلد **Backend**:

```bash
node supabase/scripts/create-user-photos-bucket.mjs
```

يجب تعيين المتغيرات قبل التشغيل:

- **Windows (PowerShell):**
  ```powershell
  $env:SUPABASE_URL="https://rtxleteymcqmtzrozckh.supabase.co"
  $env:SUPABASE_SERVICE_ROLE_KEY="<مفتاح service_role من Dashboard → Project Settings → API>"
  node supabase/scripts/create-user-photos-bucket.mjs
  ```

- **Linux / macOS:**
  ```bash
  export SUPABASE_URL="https://rtxleteymcqmtzrozckh.supabase.co"
  export SUPABASE_SERVICE_ROLE_KEY="<مفتاح service_role من Dashboard → Project Settings → API>"
  node supabase/scripts/create-user-photos-bucket.mjs
  ```

مفتاح **Service Role** من: Supabase Dashboard → Project Settings → API → `service_role` (سري، لا تشاركه في الواجهة).

### الطريقة ب: من لوحة Supabase

1. الدخول إلى **Supabase Dashboard** → المشروع.
2. **Storage** → **New bucket**.
3. الاسم: **user-photo**.
4. تفعيل **Public bucket** (للقراءة العامة للصور).
5. (اختياري) تحديد حد الحجم 2MB وأنواع MIME: صور فقط.

---

## 5. ملخص الأوامر بالترتيب (يدوياً)

يمكن تنفيذ نفس الخطوات يدوياً إن رغبت (أو استخدم `.\deploy.ps1` من مجلد Backend للآلي):

```bash
# من مجلد Backend
cd d:\App\v.2-ok run\SupabaseApp\Backend

# 1) ربط المشروع (مرة واحدة)
supabase link --project-ref rtxleteymcqmtzrozckh

# 2) ترحيل قاعدة البيانات
supabase db push

# 3) نشر الدالة
supabase functions deploy hse-api

# 4) إنشاء bucket صور المستخدمين (مرة واحدة، مع تعيين SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY ثم)
node supabase/scripts/create-user-photos-bucket.mjs
```

بعد تنفيذ هذه الخطوات يكون التطبيق جاهزاً مع دعم رفع صورة الملف الشخصي في نسخة Supabase.
