-- مراجعة التصميم: فهارس إضافية للأداء دون تغيير بنية الجداول
-- جميع الجداول مطابقة للمشروع (id text PK, data jsonb, created_at, updated_at)

-- تسريع البحث بالبريد في users (تسجيل الدخول والتحقق من المستخدم)
CREATE INDEX IF NOT EXISTS idx_users_data_email ON public.users ((data->>'email'));

-- تسريع ترتيب وعرض السجلات الحديثة
CREATE INDEX IF NOT EXISTS idx_user_activity_log_updated ON public.user_activity_log(updated_at);
CREATE INDEX IF NOT EXISTS idx_notifications_updated ON public.notifications(updated_at);
CREATE INDEX IF NOT EXISTS idx_company_settings_updated ON public.company_settings(updated_at);
