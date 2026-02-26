-- عمود منفصل للصلاحيات في جدول المستخدمين (مصدر واحد للحقيقة — يمنع فقدان الصلاحيات عند تحديث data)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}';

-- نقل الصلاحيات الموجودة من data إلى العمود الجديد (مرة واحدة)
UPDATE public.users
SET permissions = COALESCE(data->'permissions', '{}'::jsonb)
WHERE data->'permissions' IS NOT NULL AND (permissions = '{}'::jsonb OR permissions IS NULL);

COMMENT ON COLUMN public.users.permissions IS 'صلاحيات المستخدم (وحدات وصلاحيات تفصيلية) — عمود منفصل عن data لتفادي الاستبدال عند التحديث';
