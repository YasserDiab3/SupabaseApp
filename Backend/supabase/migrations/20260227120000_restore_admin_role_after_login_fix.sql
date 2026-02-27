-- استعادة دور مدير النظام للمستخدمين المعروفين بعد إصلاح مشكلة تغيير الصلاحيات بعد تسجيل الدخول
-- السبب: التعبئة التلقائية في getFromSheet أو ترحيل سابق كان يعيّن role = 'user' عند غياب القيمة
UPDATE public.users
SET
  data = jsonb_set(
    COALESCE(data, '{}'::jsonb),
    '{role}',
    '"admin"'::jsonb
  ),
  updated_at = now()
WHERE
  (
    LOWER(TRIM(COALESCE(data->>'email', data->>'Email', id))) IN (
      'yasser@icapp.com',
      'yasser.diab@icapp.com.eg',
      'yasser.diala@icapp.com.eg',
      'admin@test.com'
    )
  )
  AND (
    (data->>'role') IS NULL
    OR LOWER(TRIM(data->>'role')) <> 'admin'
    OR (data->>'Role') IS NULL
    OR LOWER(TRIM(data->>'Role')) <> 'admin'
  );

COMMENT ON TABLE public.users IS 'جدول المستخدمين — لا تُستبدل role أو permissions تلقائياً بـ user/0 عند جلب الورقة (انظر hse-api getFromSheet)';
