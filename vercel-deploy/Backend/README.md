# مجلد الخلفية (Backend)

هذا المجلد مخصص لكود الخلفية (الخوادم، المنطق، قواعد البيانات).

## مع Vercel

- **دوال Serverless (API):** ضع ملفات الـ API في مجلد `../api` في الجذر.
  - مثال: `api/hello.js` يصبح مساراً: `GET /api/hello`
- يمكنك وضع هنا خدمات مشتركة أو كود يُستورد من دوال مجلد `api`.

## متغيرات البيئة

عيّن في Vercel → Project → Settings → Environment Variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `HSE_API_SECRET` (إن وُجد)
