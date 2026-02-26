# نسخة النشر على Vercel

نسخة من المشروع جاهزة للنشر على [Vercel](https://vercel.com) تحتوي على:

- **Frontend** — الواجهة الأمامية (نسخة من مجلد Frontend الرئيسي)
- **Backend** — مجلد الخلفية (للكود والخدمات الخلفية)
- **api** — دوال Vercel Serverless (نقاط نهاية API)

## النشر

1. ثبّت [Vercel CLI](https://vercel.com/cli): `npm i -g vercel`
2. من هذا المجلد نفّذ: `vercel`
3. أو اربط المستودع من [dashboard.vercel.com](https://vercel.com/dashboard) واختر مجلد `vercel-deploy` كجذر للمشروع

## الهيكل

```
vercel-deploy/
├── Frontend/     # الواجهة الأمامية (HTML, CSS, JS)
├── Backend/      # كود الخلفية
├── api/          # دوال Serverless (مثلاً /api/hello)
├── vercel.json   # إعدادات Vercel
└── README.md
```

## ملاحظة

بعد النشر، تأكد من تعيين متغيرات البيئة في إعدادات المشروع على Vercel (Supabase URL و Anon Key وغيرها حسب الحاجة).
