# نشر تطبيق HSE (Supabase) على Netlify

## الطريقة الموصى بها

1. **ربط المستودع**
   - في Netlify: Site setup → Build & deploy → Link repository.
   - اختر المستودع والفرع (مثلاً `main`).

2. **إعدادات البناء**
   - **Base directory:** `SupabaseApp/Frontend`
   - **Build command:** مُعرّف في `netlify.toml`: `node scripts/inject-secret.js` (يحقن المفتاح السري في `js/config.js` من متغير البيئة).
   - **Publish directory:** `.` (نسبةً إلى Base directory).

   إذا تركت Base directory = `SupabaseApp/Frontend` فإن Publish directory = `.` يعني نشر محتويات `SupabaseApp/Frontend` فقط.

3. **إخفاء المفتاح السري (HSE_API_SECRET)**
   - المفتاح **لا يُخزَّن** في المستودع؛ الملف `js/config.js` في المشروع يحتوي على قيمة فارغة.
   - في Netlify: **Site settings** → **Environment variables** → **Add a variable**:
     - **Key:** `HSE_API_SECRET`
     - **Value:** نفس القيمة المُضافة في Supabase (Edge Functions → Secrets).
     - فعّل **Encrypt** أو **Sensitive** إن وُجد.
   - عند كل بناء، السكربت `scripts/inject-secret.js` يقرأ هذا المتغير ويكتب قيمته في `js/config.js` قبل النشر، فيظهر المفتاح في الموقع المنشور فقط ولا يظهر في المستودع.

4. **ملف الإعداد**
   - الملف `netlify.toml` داخل `SupabaseApp/Frontend` يحدد:
     - أمر البناء (حقن المفتاح)، إعادة التوجيه لـ SPA، ترويسات الأمان و CORS و Cache.

5. **متغيرات البيئة (اختياري أخرى)**
   - الواجهة تقرأ `supabaseUrl` و `supabaseAnonKey` من `js/modules/app-utils.js`.
   - يمكن لاحقاً حقنها أيضاً من متغيرات Netlify (مثل `SUPABASE_URL`, `SUPABASE_ANON_KEY`) عند البناء.

6. **بعد النشر**
   - تأكد أن عنوان واجهة الـ API (Supabase Edge Function أو الخادم الذي يستدعي قاعدة البيانات) مسموح في CORS من نطاق موقعك على Netlify (مثلاً `https://your-site.netlify.app`).

---

## نشر من فرع واحد مع مجلدين (Frontend القديم + SupabaseApp/Frontend)

- لنسخة **Supabase فقط**: استخدم Base directory = `SupabaseApp/Frontend` كما أعلاه.
- لنسخة Google Sheets القديمة: استخدم Base directory = `Frontend` (الجذر الآخر).

لا تحتاج إلى أوامر بناء؛ الموقع ثابت (HTML/JS/CSS).
