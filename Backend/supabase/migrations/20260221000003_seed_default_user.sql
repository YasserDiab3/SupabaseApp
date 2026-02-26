-- مستخدم افتراضي للاختبار فقط (يمكن حذفه لاحقاً في الإنتاج)
-- تسجيل الدخول: البريد admin@test.com ، كلمة المرور admin123
-- الهاش يُخزّن في data ثم يُنسخ إلى عمود password_hash بترحيل لاحق (20260221110000)

INSERT INTO public.users (id, data)
VALUES (
  'admin@test.com',
  '{"name":"مدير الاختبار","email":"admin@test.com","role":"admin","passwordHash":"240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
