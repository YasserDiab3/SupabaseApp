-- إصلاح صفوف المستخدمين التي تحتوي على قيمة غير صالحة في عمود permissions (مثل 0 أو null)
-- بحيث يصبح العمود دائماً كائناً يحتوي على role على الأقل

UPDATE public.users u
SET
  permissions = jsonb_build_object(
    'role',
    COALESCE(
      NULLIF(TRIM((CASE WHEN jsonb_typeof(u.permissions) = 'object' THEN u.permissions->>'role' ELSE NULL END)), ''),
      NULLIF(TRIM(u.data->>'role'), ''),
      NULLIF(TRIM(u.data->>'Role'), ''),
      'user'
    )
  ),
  updated_at = now()
WHERE u.id IS NOT NULL
  AND (
    u.permissions IS NULL
    OR jsonb_typeof(u.permissions) != 'object'
    OR u.permissions = '0'::jsonb
    OR u.permissions = '[]'::jsonb
  );
