-- إضافة/تحديث مستخدم للتسجيل: yasser.diab@icapp.com.eg / كلمة المرور 123@654
-- ⚠️ نفّذ هذا من "SQL Editor" في Supabase (وليس من Table Editor أو داخل خلية password_hash)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public.users (id, data, password_hash, updated_at)
VALUES (
  'yasser.diab@icapp.com.eg',
  '{"name":"Yasser Diab","email":"yasser.diab@icapp.com.eg","role":"admin"}'::jsonb,
  encode(extensions.digest('123@654'::text, 'sha256'::text), 'hex'),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  password_hash = EXCLUDED.password_hash,
  updated_at = now();
