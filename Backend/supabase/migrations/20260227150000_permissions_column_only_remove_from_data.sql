-- تفعيل عمود permissions كمصدر وحيد للدور والصلاحيات، وإزالة role و permissions من عمود data

-- 1) التأكد من أن عمود permissions يحتوي على role (من data إن لم يكن موجوداً)
UPDATE public.users u
SET
  permissions = COALESCE(
                  CASE
                    WHEN u.permissions IS NULL OR u.permissions = '[]'::jsonb OR u.permissions = '{}'::jsonb
                    THEN '{}'::jsonb
                    ELSE u.permissions
                  END,
                  '{}'::jsonb
                )
                || jsonb_build_object(
                     'role',
                     COALESCE(
                       NULLIF(TRIM((u.permissions->>'role')), ''),
                       NULLIF(TRIM(u.data->>'role'), ''),
                       NULLIF(TRIM(u.data->>'Role'), ''),
                       'user'
                     )
                   ),
  updated_at = now()
WHERE u.id IS NOT NULL;

-- 2) إزالة role و Role و permissions من عمود data (لا تُخزَّن بعد الآن إلا في عمود permissions)
UPDATE public.users u
SET
  data = (COALESCE(u.data, '{}'::jsonb) - 'role' - 'Role' - 'permissions'),
  updated_at = now()
WHERE u.id IS NOT NULL
  AND (u.data ? 'role' OR u.data ? 'Role' OR u.data ? 'permissions');
