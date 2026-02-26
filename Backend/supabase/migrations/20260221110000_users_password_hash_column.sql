-- مطابقة جدول users للنظام السابق: الهاش في حقل منفصل (كما في ورقة Users)
-- العمود password_hash يطابق عمود passwordHash في Google Sheets

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash text;

-- نقل القيم الموجودة من data->>'passwordHash' إلى العمود الجديد
UPDATE public.users
SET password_hash = data->>'passwordHash'
WHERE password_hash IS NULL AND (data->>'passwordHash') IS NOT NULL AND (data->>'passwordHash') <> '';

-- فهرس اختياري للبحث (الجدول صغير عادة)
CREATE INDEX IF NOT EXISTS idx_users_password_hash_not_null ON public.users (id) WHERE password_hash IS NOT NULL;

COMMENT ON COLUMN public.users.password_hash IS 'كلمة المرور مشفرة SHA-256 (مطابق لعمود passwordHash في ورقة Users)';
