# تطبيق HSE - نسخة Supabase

نسخة **مطابقة للنسخة الحالية** من التطبيق تعمل على **Supabase** (قاعدة بيانات PostgreSQL + Edge Functions) بدلاً من Google Sheets و Google Apps Script، مع الحفاظ على نفس الموديولات والواجهات والعلاقات.

## هيكل المشروع

```
SupabaseApp/
  Frontend/     # واجهة أمامية كاملة (نسخة من التطبيق الأصلي مع تكامل Supabase)
  Backend/      # خلفية Supabase (ترحيلات SQL + Edge Function واحدة)
```

## الإعداد السريع

### 1) إنشاء مشروع Supabase

1. سجّل دخولك في [supabase.com](https://supabase.com) وأنشئ مشروعاً جديداً.
2. من **Settings → API** انسخ:
   - **Project URL**
   - **anon public** key

### 2) تطبيق الترحيلات ونشر الدالة

```bash
cd SupabaseApp/Backend
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy hse-api
```

### 3) إعداد الواجهة الأمامية

افتح `Frontend/js/modules/app-utils.js` وضبط القيم الافتراضية (أو من واجهة الإعدادات إن وُجدت):

```javascript
useSupabaseBackend: true,
supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
supabaseAnonKey: 'YOUR_ANON_KEY',
```

### 4) تشغيل الواجهة

- افتح `Frontend/index.html` عبر خادم محلي (مثل `npx serve Frontend` أو استضافة ثابتة).
- أو انشر مجلد `Frontend` على Netlify / Vercel / أي استضافة ثابتة.

## الفرق عن النسخة الأصلية

| العنصر | النسخة الأصلية | نسخة Supabase |
|--------|-----------------|----------------|
| الخلفية | Google Apps Script + Google Sheets | Supabase (PostgreSQL + Edge Functions) |
| التكامل في الواجهة | `google-integration.js` | `supabase-integration.js` (نفس الواجهة البرمجية) |
| الإعداد | scriptUrl + spreadsheetId | supabaseUrl + supabaseAnonKey |

باقي الموديولات والواجهات تبقى كما هي؛ التطبيق يستدعي `GoogleIntegration.sendRequest`/`callBackend` وتقوم نسخة Supabase بإرسال الطلبات إلى Edge Function بدلاً من Google.

## التوثيق الإضافي

- **Backend:** راجع `Backend/README.md` لتفاصيل الترحيلات والـ Edge Function والإعداد المحلي.
- **من الصفر إلى الإنتاج:** راجع **`خطوات_النشر_على_Supabase.md`** للخطوات الكاملة: إنشاء المشروع، ربط المشروع المحلي، تطبيق الترحيلات، نشر Edge Function، إعداد الواجهة، التشغيل المحلي، والنشر إلى الإنتاج.
