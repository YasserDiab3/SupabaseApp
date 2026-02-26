-- HSE App - جداول مطابقة لأوراق التطبيق (id + data jsonb)
-- كل جدول = ورقة واحدة. الأسماء بصيغة snake_case من أسماء الأوراق.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- الجداول الأساسية (مطابقة لأوراق Config.gs)
CREATE TABLE IF NOT EXISTS public.users (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.incidents (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.near_miss (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.ptw (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.training (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.clinic_visits (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.medications (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.sick_leave (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.injuries (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.clinic_inventory (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.fire_equipment (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.ppe (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.violations (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.employees (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.behavior_monitoring (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.approved_contractors (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.contractor_evaluations (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.contractor_approval_requests (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.contractor_deletion_requests (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.ptw_map_coordinates (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.ptw_default_coordinates (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.form_settings_db (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.violation_types_db (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.form_sites (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.form_places (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.form_departments (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.form_safety_team (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.safety_alerts (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.incident_notifications (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.module_management (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.user_tasks (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.notifications (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.audit_log (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.action_tracking_register (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.action_tracking_settings (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.safety_team_members (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.safety_health_management_settings (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.contractor_trainings (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.employee_training_matrix (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.chemical_safety (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.daily_observations (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.risk_assessments (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.legal_documents (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.periodic_inspections (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.backup_log (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.backup_settings (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.annual_training_plans (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

-- فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_users_updated ON public.users(updated_at);
CREATE INDEX IF NOT EXISTS idx_incidents_updated ON public.incidents(updated_at);
CREATE INDEX IF NOT EXISTS idx_ptw_updated ON public.ptw(updated_at);
CREATE INDEX IF NOT EXISTS idx_clinic_visits_updated ON public.clinic_visits(updated_at);
CREATE INDEX IF NOT EXISTS idx_employees_updated ON public.employees(updated_at);
CREATE INDEX IF NOT EXISTS idx_approved_contractors_updated ON public.approved_contractors(updated_at);
