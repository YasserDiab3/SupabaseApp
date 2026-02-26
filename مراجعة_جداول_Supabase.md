# مراجعة جداول Supabase وتصميمها

## خلاصة المراجعة

تمت مراجعة جميع الجداول والترحيلات. **التصميم مطابق للمشروع** ولا توجد اختلافات تؤثر على عمل التطبيق أو سرعته.

---

## 1. البنية الموحدة للجداول

كل الجداول تتبع نفس النمط المطابق لـ Google Sheets في النسخة الأصلية:

| العمود      | النوع       | الوصف |
|------------|-------------|--------|
| `id`       | `text` PK   | معرف فريد (غالباً مثل البريد أو UUID) |
| `data`     | `jsonb`     | كل الحقول المرنة (name, email, role, …) |
| `created_at` | `timestamptz` | وقت الإنشاء |
| `updated_at` | `timestamptz` | وقت آخر تحديث |

- **لماذا jsonb؟** مطابقة لطريقة تخزين الصفوف في الأوراق؛ يسمح بحقول ديناميكية دون تغيير المخطط، ومناسب لـ PostgreSQL في الاستعلام والفلترة.
- **لماذا id كنص؟** مطابقة للمشروع (بريد، معرفات مخصصة، رموز مثل CRQ_1).

---

## 2. جدول users (من لقطة الشاشة)

- **الأعمدة:** `id`, `data`, **`password_hash`** (حقل منفصل), `created_at`, `updated_at`.
- **الهاش في حقل منفصل:** عمود **`password_hash`** يطابق عمود `passwordHash` في ورقة Users؛ الـ API يقرأه ويُرجع للمستخدمين كـ `passwordHash`.
- **المحتوى في `data`:** `name`, `email`, `role` وغيرها.
- الترحيل `20260221110000_users_password_hash_column.sql` يضيف العمود وينقل القيم من `data->>'passwordHash'` للصفوف الموجودة.

لا توجد اختلافات في تصميم الجدول تؤثر على العمل أو السرعة.

---

## 3. قائمة الجداول المطبقة

- **الترحيل الأول (20260205000001):** users, incidents, near_miss, ptw, training, clinic_visits, medications, sick_leave, injuries, clinic_inventory, fire_equipment, ppe, violations, employees, behavior_monitoring, approved_contractors, contractor_evaluations, contractor_approval_requests, contractor_deletion_requests, ptw_map_coordinates, ptw_default_coordinates, form_settings_db, violation_types_db, form_sites, form_places, form_departments, form_safety_team, safety_alerts, incident_notifications, module_management, user_tasks, notifications, audit_log, action_tracking_register, action_tracking_settings, safety_team_members, safety_health_management_settings, contractor_trainings, employee_training_matrix, chemical_safety, daily_observations, risk_assessments, legal_documents, periodic_inspections, backup_log, backup_settings, annual_training_plans.
- **الترحيل الثاني (20260221000001):** change_requests.
- **الترحيل الثالث (20260221000002):** incident_analysis_settings, incidents_registry, ptw_registry, clinic_contractor_visits, blacklist_register, contractors, chemical_register, iso_*, hse_*, environmental_*, carbon_footprint, waste_management_*, water_management*, gas_*, electricity_*, energy_efficiency, recycling_programs, safety_budget, budget, kpis, emergency_*, periodic_inspection_*, fire_equipment_*, violation_types, safety_budgets, safety_budget_transactions, ppe_matrix, ppe_stock, ppe_transactions, user_activity_log, ai_assistant_settings, user_ai_log, observation_sites, safety_organizational_structure, safety_job_descriptions, safety_team_*, user_instructions, s_o_p_j_h_a, company_settings.
- **الترحيل الرابع (20260221000003):** بذرة مستخدم افتراضي في `users`.
- **الترحيل الخامس (20260221100000):** فهارس إضافية للأداء فقط (بدون تغيير بنية الجداول).

---

## 4. التحويل من أسماء الأوراق إلى أسماء الجداول (API)

- الدالة `sheetNameToTable` في الدالة `hse-api` تحول أسماء الأوراق (مثل `Users`, `PTW_MAP_COORDINATES`, `ChangeRequests`) إلى أسماء الجداول بالأحرف الصغيرة والشرطة السفلية (مثل `users`, `ptw_map_coordinates`, `change_requests`).
- تم تصحيح التحويل للأسماء التي تحتوي على `_` (مثل `PTW_MAP_COORDINATES`) حتى تُحوَّل إلى `ptw_map_coordinates` وليس صيغة خاطئة، فلا اختلاف بين أسماء الجداول في الترحيلات وما يستخدمه الـ API.

---

## 5. الفهارس والأداء

- موجودة فهارس على `updated_at` للجداول الأكثر استخداماً (مثل users, incidents, ptw, employees, approved_contractors, incidents_registry, ptw_registry, contractors, daily_observations, change_requests).
- تمت إضافة فهارس في الترحيل `20260221100000_review_indexes.sql`:
  - `idx_users_data_email` على `(data->>'email')` لجدول `users` لدعم أي بحث أو تحقق بالبريد لاحقاً.
  - فهارس على `updated_at` لـ user_activity_log, notifications, company_settings لتحسين الترتيب والعرض.

لا تغيير في بنية الجداول؛ فقط تحسين استعلامات القراءة.

---

## 6. الخلاصة

- **المطابقة للمشروع:** نعم — نفس فكرة الورقة = جدول، مع `id` + `data` (jsonb).
- **تأثير على العمل:** لا توجد اختلافات في التصميم تؤثر على عمل التطبيق.
- **تأثير على السرعة:** التصميم الحالي مع الفهارس المذكورة مناسب؛ إضافة الفهارس في الترحيل الأخير تدعم الأداء دون تغيير المنطق.

بعد تطبيق الترحيلات (بما فيها `20260221100000_review_indexes.sql`) عبر `supabase db push` من مجلد `SupabaseApp/Backend` تكون الجداول والفهارس مطابقة للمراجعة أعلاه.
