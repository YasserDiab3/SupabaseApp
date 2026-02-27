-- 1) استعادة بيانات data للمستخدمين الذين تم استبدال data لديهم بـ postLoginPolicySeenAt فقط (بعد تحديث updateUser)
--    نعيد name, email من id (إن كان بريداً) و role للمديرين المعروفين
UPDATE public.users u
SET
  data = COALESCE(u.data, '{}'::jsonb)
    || jsonb_build_object(
         'name',  COALESCE(NULLIF(TRIM(u.data->>'name'), ''), NULLIF(TRIM(u.data->>'Name'), ''), SPLIT_PART(u.id, '@', 1), u.id),
         'email', COALESCE(NULLIF(TRIM(LOWER(u.data->>'email')), ''), NULLIF(TRIM(LOWER(u.data->>'Email')), ''), LOWER(TRIM(u.id))),
         'role',  CASE
                    WHEN LOWER(TRIM(COALESCE(u.data->>'email', u.data->>'Email', u.id))) IN (
                      'yasser@icapp.com', 'yasser.diab@icapp.com.eg', 'yasser.diala@icapp.com.eg', 'admin@test.com'
                    ) THEN 'admin'
                    ELSE COALESCE(NULLIF(TRIM(u.data->>'role'), ''), NULLIF(TRIM(u.data->>'Role'), ''), 'user')
                  END
       ),
  updated_at = now()
WHERE u.id IS NOT NULL
  AND (
    u.data IS NULL
    OR u.data = '{}'::jsonb
    OR (
      (COALESCE(u.data->>'name', u.data->>'Name', '')) = ''
      AND (COALESCE(u.data->>'email', u.data->>'Email', '')) = ''
    )
  );

-- 2) نقل data->'permissions' (إن وُجد) إلى عمود permissions
UPDATE public.users
SET
  permissions = data->'permissions',
  updated_at = now()
WHERE data->'permissions' IS NOT NULL
  AND jsonb_typeof(data->'permissions') = 'object'
  AND (data->'permissions') != 'null'::jsonb
  AND (permissions IS NULL OR permissions = '[]'::jsonb OR permissions = '{}'::jsonb);

-- 3) ملء عمود permissions من data (role من data.role، ودمج data.permissions إن وُجد)
--    حتى تظهر الصلاحيات/الدور في عمود permissions وليس في data فقط
UPDATE public.users u
SET
  permissions = COALESCE(u.data->'permissions', '{}'::jsonb)
                || jsonb_build_object(
                     'role',
                     COALESCE(NULLIF(TRIM(u.data->>'role'), ''), NULLIF(TRIM(u.data->>'Role'), ''), 'user')
                   ),
  updated_at = now()
WHERE u.id IS NOT NULL
  AND (u.permissions IS NULL OR u.permissions = '[]'::jsonb OR u.permissions = '{}'::jsonb);
