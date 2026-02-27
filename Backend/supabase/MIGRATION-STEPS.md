# خطوات ترحيل قاعدة البيانات — استعادة صلاحيات المدير

## ⚠️ مهم: لماذا تعود الحسابات إلى "مستخدم" بعد الدخول/الخروج؟

الواجهة أحياناً تحفظ قائمة المستخدمين كاملة (`autoSave('Users', AppState.appData.users)`). إذا كانت القائمة تحتوي دور "user" للمدير (من جلسة سابقة أو مزامنة قديمة)، كان الـ Backend يستبدل دور المدير في قاعدة البيانات.

**ما تم إصلاحه في الكود (يحتاج نشر الدالة):**
- في **saveToSheet**: إذا كان السجل في قاعدة البيانات مديراً والبيانات المرسلة تحتوي `role: "user"` → لا نستبدل، نبقى على `admin`.
- في **updateUser**: نفس الحماية.
- في **getFromSheet**: عدم تعبئة تلقائية بدور "user" عندما يوجد أكثر من مستخدم.

**يجب تنفيذ الترحيل (SQL) ثم إعادة نشر دالة hse-api (Edge Function) حتى يكتمل الإصلاح.**

---

## ما الذي يفعله الترحيل؟

الملف `20260227120000_restore_admin_role_after_login_fix.sql` يقوم بـ:

- تعيين **دور مدير** (`role: "admin"`) في عمود `data` لجدول `users` للمستخدمين:
  - `yasser@icapp.com`
  - `yasser.diab@icapp.com.eg`
  - `admin@test.com`
- يُنفَّذ فقط على الصفوف التي دورها الحالي **ليس** `admin` (لا يغيّر من هم مديرون بالفعل).

---

## الطريقة 1: عبر Supabase CLI (مُفضّلة)

1. **التأكد من تثبيت Supabase CLI** (إن لم يكن مثبتاً):
   ```bash
   npm install -g supabase
   ```

2. **الانتقال لمجلد المشروع الذي فيه `supabase`**:
   ```bash
   cd d:\Apps\2026\SupabaseApp\Backend
   ```

3. **ربط المشروع بمشروعك على Supabase** (مرة واحدة فقط، إذا لم يكن مربوطاً):
   ```bash
   supabase login
   supabase link --project-ref <معرف-المشروع>
   ```
   (معرف المشروع من: Supabase Dashboard → Project Settings → General → Reference ID)

4. **تشغيل الترحيلات المعلّقة**:
   ```bash
   supabase db push
   ```
   أو لتشغيل ترحيل واحد فقط:
   ```bash
   supabase migration up
   ```

---

## الطريقة 2: عبر Supabase Dashboard (بدون CLI)

1. افتح [Supabase Dashboard](https://supabase.com/dashboard) واختر مشروعك.

2. من القائمة الجانبية: **SQL Editor**.

3. انقر **New query**.

4. انسخ محتوى الملف التالي والصقه في المحرر:
   ```
   Backend/supabase/migrations/20260227120000_restore_admin_role_after_login_fix.sql
   ```

5. انقر **Run** (أو Ctrl+Enter).

6. تأكد من ظهور رسالة نجاح (مثل: `Success. No rows returned` أو عدد الصفوف المحدَّثة).

---

## الطريقة 3: تشغيل محلي (Supabase Local)

إذا كنت تشغّل قاعدة البيانات محلياً:

```bash
cd d:\Apps\2026\SupabaseApp\Backend
supabase db push
```

أو بعد `supabase start`:

```bash
supabase migration up
```

---

## نشر دالة الـ Backend (مهم جداً)

بدون إعادة نشر الدالة `hse-api` ستبقى الحماية الجديدة غير مفعّلة وسيعود المدير إلى "مستخدم" عند أي حفظ من الواجهة.

```bash
cd d:\Apps\2026\SupabaseApp\Backend
supabase functions deploy hse-api
```

أو من Supabase Dashboard: Deploy the Edge Function من مصدر المشروع.

---

## بعد الترحيل والنشر

1. **تنفيذ ترحيل SQL** (الطريقة 1 أو 2 أعلاه) لاستعادة دور المدير في الجدول.
2. **نشر الدالة** `hse-api` كما في القسم السابق.
3. **تسجيل خروج ثم دخول** بحساب المدير، أو انتظار مزامنة المستخدمين في التطبيق.
4. التحقق من أن صلاحيات المدير تظهر بشكل صحيح ولا تتغيّر بعد تسجيل الدخول أو الخروج.
5. (اختياري) من Supabase Dashboard → Table Editor → `users`: تأكد أن صف المدير في عمود `data` يحتوي على `"role":"admin"`.

---

## إضافة مدير جديد لاحقاً

إذا أردت أن يشمَل الترحيل بريداً إلكترونياً آخر، أضفه في قائمة الـ `IN (...)` داخل الملف:

```sql
LOWER(TRIM(COALESCE(data->>'email', data->>'Email', id))) IN (
  'yasser@icapp.com',
  'yasser.diab@icapp.com.eg',
  'admin@test.com',
  'البريد@الجديد.com'
)
```

ثم نفّذ الترحيل مرة أخرى بالطريقة 1 أو 2 أعلاه.
