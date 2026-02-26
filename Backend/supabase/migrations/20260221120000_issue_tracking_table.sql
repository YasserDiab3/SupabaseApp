-- جدول تتبع المشاكل (Issue Tracking) - يستخدمه موديول issue-tracking.js
CREATE TABLE IF NOT EXISTS public.issue_tracking (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_issue_tracking_updated ON public.issue_tracking(updated_at);
