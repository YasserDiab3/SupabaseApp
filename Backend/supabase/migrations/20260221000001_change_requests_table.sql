-- إدارة التغيرات (Change Management) - جدول طلبات التغيير
-- مطابق لورقة ChangeRequests في النسخة الأصلية

CREATE TABLE IF NOT EXISTS public.change_requests (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_change_requests_updated ON public.change_requests(updated_at);
