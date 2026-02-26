-- تعيين صلاحية مدير النظام لمستخدم محدد (yasser.diab@icapp.com.eg)
-- يُنفّذ مرة واحدة عند db push أو من SQL Editor.
UPDATE public.users
SET data = COALESCE(data, '{}'::jsonb) || '{"name":"Yasser Diab","email":"yasser.diab@icapp.com.eg","role":"admin"}'::jsonb,
    updated_at = now()
WHERE id = 'yasser.diab@icapp.com.eg';
