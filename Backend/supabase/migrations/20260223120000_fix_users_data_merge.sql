-- اختياري: تعيين مدير نظام محدد (مرة واحدة فقط إن رغبت).
-- التطبيق يحفظ name/email/role تلقائياً في Supabase عند قراءة المستخدمين (بدون تشغيل SQL يدوياً).
-- هذا الاستعلام يُستخدم فقط إذا أردت أن يكون مستخدم معيّن مديراً دون تعديله من واجهة "إدارة المستخدمين".
-- غيّر id والاسم والبريد إن لزم، ثم نفّذ من SQL Editor مرة واحدة إن رغبت.

UPDATE public.users
SET data = COALESCE(data, '{}'::jsonb) || '{"name":"Yasser Diab","email":"yasser.diab@icapp.com.eg","role":"admin"}'::jsonb,
    updated_at = now()
WHERE id = 'yasser.diab@icapp.com.eg'
  AND (data IS NULL OR NOT (data ? 'role') OR (data->>'role') IS NULL OR (data->>'role') = '');
