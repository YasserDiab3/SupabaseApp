-- ترحيل بيانات فقط (لا يغيّر بنية الجدول)
-- يملأ role, name, email في data للمستخدمين الذين يفتقدونها (مثل السجلات التي تحتوي فقط على postLoginPolicySeenAt)

UPDATE public.users u
SET
  data = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(u.data, '{}'::jsonb),
        '{role}',
        to_jsonb(COALESCE(u.data->>'role', u.data->>'Role', 'user')::text)
      ),
      '{name}',
      to_jsonb(
        COALESCE(
          NULLIF(TRIM(u.data->>'name'), ''),
          NULLIF(TRIM(u.data->>'Name'), ''),
          SPLIT_PART(u.id, '@', 1),
          u.id
        )::text
      )
    ),
    '{email}',
    to_jsonb(LOWER(TRIM(COALESCE(u.data->>'email', u.data->>'Email', u.id)::text)))
  ),
  updated_at = now()
WHERE
  u.id IS NOT NULL
  AND (
    (u.data->>'role') IS NULL
    OR TRIM(COALESCE(u.data->>'role', u.data->>'Role', '')) = ''
    OR (u.data->>'name') IS NULL
    OR TRIM(COALESCE(u.data->>'name', u.data->>'Name', '')) = ''
    OR (u.data->>'email') IS NULL
    OR TRIM(COALESCE(u.data->>'email', u.data->>'Email', '')) = ''
  );
