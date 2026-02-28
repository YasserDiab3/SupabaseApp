// HSE App - Supabase Edge Function (واجهة API موحدة مطابقة للتطبيق الأصلي)
// تستقبل { action, data } وترد { success, data?, message? }
// أمان: عند تعيين HSE_API_SECRET في البيئة يُطلب رأس X-API-Key أو Authorization Bearer مطابق.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

function getCorsHeaders(req: Request): Record<string, string> {
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN")?.trim();
  const origin = req.headers.get("origin") || "";
  const allowOrigin =
    allowedOrigin && allowedOrigin !== "*"
      ? allowedOrigin
      : origin || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// تصحيح أسماء أوراق → جداول عندما التحويل التلقائي ينتج اسمًا خاطئًا (مثلاً KPIs -> k_p_is بدل kpis)
const SHEET_TO_TABLE_OVERRIDE: Record<string, string> = {
  SafetyTeamKPIs: "safety_team_kpis",
  PTWRegistry: "ptw_registry",
};

// تحويل اسم الورقة إلى اسم جدول (snake_case)
function sheetNameToTable(sheetName: string): string {
  if (!sheetName || typeof sheetName !== "string") return "";
  const s = sheetName.trim();
  const override = SHEET_TO_TABLE_OVERRIDE[s];
  if (override) return override;
  // أسماء تحتوي على _ مثل PTW_MAP_COORDINATES -> ptw_map_coordinates
  if (s.includes("_")) {
    return s.split("_").map((p) => p.toLowerCase()).join("_").replace(/[^a-z0-9_]/g, "_");
  }
  // PascalCase مثل FormSettingsDB -> form_settings_db
  let t = s.replace(/([A-Z])/g, "_$1").toLowerCase();
  t = t.replace(/^_/, "").replace(/__+/g, "_").replace(/[^a-z0-9_]/g, "_");
  return t || sheetName.toLowerCase();
}

// مساعد: هل الخطأ يعني أن الجدول غير موجود؟ (لتجنب 400 عند أوراق/جداول غير منشأة بعد)
function isTableMissingError(err: { message?: string; code?: string }): boolean {
  const msg = String((err && err.message) || "").toLowerCase();
  const code = String((err && (err as { code?: string }).code) ?? "");
  return (
    code === "42P01" ||
    msg.includes("does not exist") ||
    (msg.includes("relation") && msg.includes("exist")) ||
    msg.includes("schema cache") ||
    msg.includes("could not find the table") ||
    msg.includes("not find")
  );
}

// خريطة action -> اسم الورقة (للعمليات غير readFromSheet/saveToSheet/appendToSheet)
const ACTION_SHEET_MAP: Record<string, string> = {
  getIncident: "Incidents", getAllIncidents: "Incidents", addIncident: "Incidents", updateIncident: "Incidents", deleteIncident: "Incidents",
  getSafetyAlert: "SafetyAlerts", getAllSafetyAlerts: "SafetyAlerts", addSafetyAlert: "SafetyAlerts", updateSafetyAlert: "SafetyAlerts", deleteSafetyAlert: "SafetyAlerts",
  getNearMiss: "NearMiss", getAllNearMisses: "NearMiss", addNearMiss: "NearMiss", updateNearMiss: "NearMiss", deleteNearMiss: "NearMiss",
  getPTW: "PTW", getAllPTWs: "PTW", addPTW: "PTW", updatePTW: "PTW", deletePTW: "PTW",
  getTraining: "Training", getAllTrainings: "Training", addTraining: "Training", updateTraining: "Training", deleteTraining: "Training",
  getAllClinicVisits: "ClinicVisits", addClinicVisit: "ClinicVisits", updateClinicVisit: "ClinicVisits",
  getAllMedications: "Medications", addMedication: "Medications", updateMedication: "Medications", deleteMedication: "Medications",
  getAllSickLeaves: "SickLeave", addSickLeave: "SickLeave", updateSickLeave: "SickLeave",
  getAllInjuries: "Injuries", addInjury: "Injuries", updateInjury: "Injuries",
  getAllClinicInventory: "ClinicInventory", addClinicInventory: "ClinicInventory", updateClinicInventory: "ClinicInventory",
  getEmployee: "Employees", getAllEmployees: "Employees", addEmployee: "Employees", updateEmployee: "Employees", deleteEmployee: "Employees", deactivateEmployee: "Employees",
  getAllApprovedContractors: "ApprovedContractors", addApprovedContractor: "ApprovedContractors", updateApprovedContractor: "ApprovedContractors", deleteApprovedContractor: "ApprovedContractors",
  getAllContractorEvaluations: "ContractorEvaluations", addContractorEvaluation: "ContractorEvaluations", updateContractorEvaluation: "ContractorEvaluations",
  getAllContractorApprovalRequests: "ContractorApprovalRequests", addContractorApprovalRequest: "ContractorApprovalRequests", updateContractorApprovalRequest: "ContractorApprovalRequests",
  approveContractorApprovalRequest: "ContractorApprovalRequests", rejectContractorApprovalRequest: "ContractorApprovalRequests",
  getAllContractorDeletionRequests: "ContractorDeletionRequests", addContractorDeletionRequest: "ContractorDeletionRequests", updateContractorDeletionRequest: "ContractorDeletionRequests",
  approveContractorDeletionRequest: "ContractorDeletionRequests", rejectContractorDeletionRequest: "ContractorDeletionRequests",
  getMapCoordinates: "PTW_MAP_COORDINATES", saveMapCoordinates: "PTW_MAP_COORDINATES", PTW_MAP_COORDINATES: "PTW_MAP_COORDINATES",
  getDefaultCoordinates: "PTW_DEFAULT_COORDINATES", saveDefaultCoordinates: "PTW_DEFAULT_COORDINATES", PTW_DEFAULT_COORDINATES: "PTW_DEFAULT_COORDINATES",
  addUser: "Users", updateUser: "Users", deleteUser: "Users", resetUserPassword: "Users",
  addViolation: "Violations", deleteViolationFromSheet: "Violations",
  getEmployeeTrainingMatrix: "EmployeeTrainingMatrix", addEmployeeTrainingMatrix: "EmployeeTrainingMatrix", updateEmployeeTrainingMatrix: "EmployeeTrainingMatrix",
  addContractorTraining: "ContractorTrainings", getAllContractorTrainings: "ContractorTrainings",
  addAnnualTrainingPlan: "AnnualTrainingPlans",
  getAllTrainingSessions: "Training", getAllTrainingCertificates: "Training", getAllTrainingAttendance: "Training",
  getAllBehaviors: "BehaviorMonitoring", addBehavior: "BehaviorMonitoring", updateBehavior: "BehaviorMonitoring", getBehavior: "BehaviorMonitoring", deleteBehavior: "BehaviorMonitoring",
  getAllActionTracking: "ActionTrackingRegister", getActionTracking: "ActionTrackingRegister",
  getSafetyTeamMembers: "SafetyTeamMembers", getSafetyHealthManagementSettings: "SafetyHealthManagementSettings", getActionTrackingSettings: "ActionTrackingSettings",
  getData: "ModuleManagement",
  getAllChangeRequests: "ChangeRequests", getChangeRequest: "ChangeRequests", addChangeRequest: "ChangeRequests", updateChangeRequest: "ChangeRequests",
  getAllIssues: "IssueTracking", getIssue: "IssueTracking", addIssue: "IssueTracking", updateIssue: "IssueTracking",
  addNotification: "Notifications", addIncidentNotification: "IncidentNotifications",
  deleteObservation: "DailyObservations", deleteAllObservations: "DailyObservations",
  getDailyObservationsPptTemplateId: "DailyObservationsPptTemplate", setDailyObservationsPptTemplateId: "DailyObservationsPptTemplate",
  createActionFromModule: "ActionTrackingRegister", deleteContractor: "Contractors",
  deletePPE: "PPE", deletePPEStockItem: "PPE",
  getAllPPE: "PPE", getPPEItemsList: "PPE",
  getAllPPEStockItems: "PPEStockItems", addOrUpdatePPEStockItem: "PPEStockItems",
  getAllPPETransactions: "PPETransactions", addPPETransaction: "PPETransactions",
  addMedicationDeletionRequest: "MedicationDeletionRequests", getAllMedicationDeletionRequests: "MedicationDeletionRequests", approveMedicationDeletion: "MedicationDeletionRequests", rejectMedicationDeletion: "MedicationDeletionRequests",
  addSupplyRequest: "SupplyRequests", getAllSupplyRequests: "SupplyRequests", approveSupplyRequest: "SupplyRequests", rejectSupplyRequest: "SupplyRequests",
  getActionTrackingKPIs: "SafetyPerformanceKPIs", getAllUserTasks: "UserTasks",
  getSafetyTeamMember: "SafetyTeamMembers", deleteSafetyTeamMember: "SafetyTeamMembers",
  addSafetyTeamMember: "SafetyTeamMembers", updateSafetyTeamMember: "SafetyTeamMembers",
  getOrganizationalStructure: "SafetyOrganizationalStructure", saveOrganizationalStructure: "SafetyOrganizationalStructure", deleteStructure: "SafetyOrganizationalStructure",
  getJobDescription: "SafetyJobDescriptions", getJobDescriptions: "SafetyJobDescriptions", saveJobDescription: "SafetyJobDescriptions", updateJobDescription: "SafetyJobDescriptions",
  calculateSafetyTeamKPIs: "SafetyTeamKPIs", addSafetyTeamKPI: "SafetyTeamKPIs",
  getSafetyTeamAttendance: "SafetyTeamAttendance", addSafetyTeamAttendance: "SafetyTeamAttendance", updateSafetyTeamAttendance: "SafetyTeamAttendance", deleteSafetyTeamAttendance: "SafetyTeamAttendance",
  getSafetyTeamLeaves: "SafetyTeamLeaves", addSafetyTeamLeave: "SafetyTeamLeaves", updateSafetyTeamLeave: "SafetyTeamLeaves", deleteSafetyTeamLeave: "SafetyTeamLeaves",
  getAllPeriodicInspections: "PeriodicInspectionRecords", addPeriodicInspection: "PeriodicInspectionRecords", updatePeriodicInspection: "PeriodicInspectionRecords",
  saveTestReport: "TestReports",
};

const GENERIC_ERROR_MESSAGE = "حدث خطأ في الخادم. يرجى المحاولة لاحقاً.";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  const jsonHeaders = { ...cors, "Content-Type": "application/json; charset=utf-8" };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, message: "Method not allowed" }),
      { status: 405, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  let body: { action?: string; data?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: "Invalid JSON body", data: [] }),
      { status: 200, headers: jsonHeaders }
    );
  }

  // مصادقة API: قبول HSE_API_SECRET أو HSE_ANON_KEY (اسم مسموح في Supabase؛ لا يُقبل prefix SUPABASE_)
  const apiSecret = Deno.env.get("HSE_API_SECRET")?.trim();
  const allowedAnonKey = Deno.env.get("HSE_ANON_KEY")?.trim();
  if (apiSecret && apiSecret.length > 0) {
    const sentKey = req.headers.get("x-api-key")?.trim() || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    const validBySecret = sentKey === apiSecret;
    const validByAnon = allowedAnonKey && allowedAnonKey.length > 0 && sentKey === allowedAnonKey;
    if (!validBySecret && !validByAnon) {
      return new Response(
        JSON.stringify({ success: false, message: "غير مصرح بالوصول إلى الخادم." }),
        { status: 401, headers: jsonHeaders }
      );
    }
  }

  const action = typeof body.action === "string" ? body.action.trim() : "";
  const payload = body.data != null ? body.data : body;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (!action) {
    return new Response(
      JSON.stringify({ success: false, message: "يجب تحديد action في الطلب", data: [] }),
      { status: 200, headers: jsonHeaders }
    );
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: jsonHeaders });

  try {
    // —— اختبار الاتصال ——
    if (action === "testConnection") {
      return json({ success: true, message: "الاتصال بالخلفية يعمل بنجاح", timestamp: new Date().toISOString(), serverTime: new Date().toISOString() });
    }

    // —— تهيئة الاتصال بقاعدة البيانات ——
    if (action === "initializeSheets" || action === "initializeBackend") {
      return json({ success: true, message: "تم تهيئة الاتصال بقاعدة البيانات بنجاح" });
    }

    // —— إعدادات الشركة (كائن واحد) ——
    if (action === "getCompanySettings") {
      const { data: rows, error } = await supabase.from("company_settings").select("id, data").order("updated_at", { ascending: false }).limit(1);
      if (error) return json({ success: false, message: error.message }, 400);
      const first = (rows || [])[0] as { data?: Record<string, unknown> } | undefined;
      return json({ success: true, data: first?.data ?? {} });
    }
    if (action === "saveCompanySettings") {
      const data = (payload as { data?: Record<string, unknown> }).data ?? (payload as Record<string, unknown>);
      const id = (payload as { id?: string }).id ?? "default";
      const { error } = await supabase.from("company_settings").upsert({ id: String(id), data: data ?? {}, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (error) return json({ success: false, message: error.message }, 400);
      return json({ success: true });
    }

    // —— إعدادات النماذج (كائن واحد، مواقع وأماكن) ——
    if (action === "getFormSettings") {
      const { data: rows, error } = await supabase.from("form_settings_db").select("id, data").order("updated_at", { ascending: false }).limit(1);
      if (error) return json({ success: false, message: error.message }, 400);
      const first = (rows || [])[0] as { data?: Record<string, unknown> } | undefined;
      return json({ success: true, data: first?.data ?? { sites: [] } });
    }
    if (action === "saveFormSettings") {
      const data = (payload as { data?: Record<string, unknown> }).data ?? (payload as Record<string, unknown>);
      const id = (payload as { id?: string }).id ?? "default";
      const payloadData = (data ?? {}) as { sites?: Array<{ id: string; name: string; places?: Array<{ id: string; name: string; siteId: string }> }> };
      const { error: errSettings } = await supabase.from("form_settings_db").upsert({ id: String(id), data: data ?? {}, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (errSettings) return json({ success: false, message: errSettings.message }, 400);
      const sites = Array.isArray(payloadData.sites) ? payloadData.sites : [];
      const siteIds: string[] = [];
      const placeIds: string[] = [];
      for (const site of sites) {
        if (!site || typeof site.id !== "string") continue;
        siteIds.push(site.id);
        const { error: errSite } = await supabase.from("form_sites").upsert({
          id: site.id,
          data: { id: site.id, name: site.name ?? "", places: site.places ?? [] },
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });
        if (errSite) return json({ success: false, message: "form_sites: " + errSite.message }, 400);
        const places = Array.isArray(site.places) ? site.places : [];
        for (const place of places) {
          if (!place || typeof place.id !== "string") continue;
          placeIds.push(place.id);
          const { error: errPlace } = await supabase.from("form_places").upsert({
            id: place.id,
            data: { id: place.id, name: place.name ?? "", siteId: place.siteId ?? site.id },
            updated_at: new Date().toISOString(),
          }, { onConflict: "id" });
          if (errPlace) return json({ success: false, message: "form_places: " + errPlace.message }, 400);
        }
      }
      const allSiteIds = await supabase.from("form_sites").select("id").then((r) => (r.data ?? []).map((r: { id: string }) => r.id));
      const toDeleteSites = (allSiteIds as string[]).filter((sid) => !siteIds.includes(sid));
      if (toDeleteSites.length > 0) await supabase.from("form_sites").delete().in("id", toDeleteSites);
      const allPlaceIds = await supabase.from("form_places").select("id").then((r) => (r.data ?? []).map((r: { id: string }) => r.id));
      const toDeletePlaces = (allPlaceIds as string[]).filter((pid) => !placeIds.includes(pid));
      if (toDeletePlaces.length > 0) await supabase.from("form_places").delete().in("id", toDeletePlaces);
      return json({ success: true });
    }

    // —— مهام المستخدم (مصفوفة مُرشَّحة حسب userId) ——
    if (action === "getUserTasksByUserId") {
      const userId = (payload as { userId?: string }).userId ?? (payload as { id?: string }).id;
      const { data: rows, error } = await supabase.from("user_tasks").select("id, data").order("updated_at", { ascending: false });
      if (error) return json({ success: false, message: error.message }, 400);
      const list = (rows || []).map((r: { id: string; data: Record<string, unknown> }) => ({ id: r.id, ...r.data }));
      const filtered = userId
        ? list.filter((t: Record<string, unknown>) => String(t.userId ?? t.user_id ?? "").trim() === String(userId).trim())
        : list;
      return json({ success: true, data: filtered });
    }

    // —— قالب PPT للملاحظات اليومية (اختياري: لا جدول مخصص في Supabase) ——
    if (action === "getDailyObservationsPptTemplateId") {
      return json({ success: true, templateId: null });
    }
    if (action === "setDailyObservationsPptTemplateId") {
      return json({ success: true });
    }
    if (action === "exportDailyObservationsPptReport") {
      return json({ success: false, message: "تصدير PPT غير متاح في نسخة Supabase. استخدم التطبيق الأصلي أو فعّل التصدير لاحقاً." });
    }

    // —— الملاحظات اليومية: getObservation / updateObservationStatus / addObservationUpdate / addObservationComment ——
    const dailyObsTable = "daily_observations";
    if (action === "getObservation") {
      const observationId = (payload as { observationId?: string }).observationId ?? (payload as { id?: string }).id;
      if (!observationId) return json({ success: false, message: "observationId مطلوب" }, 400);
      const { data: row, error } = await supabase.from(dailyObsTable).select("id, data").eq("id", String(observationId)).maybeSingle();
      if (error) return json({ success: false, message: error.message }, 400);
      if (!row) return json({ success: false, message: "الملاحظة غير موجودة" }, 404);
      const out = { id: row.id, ...(row as { data?: Record<string, unknown> }).data };
      return json({ success: true, data: out });
    }
    if (action === "updateObservationStatus") {
      const observationId = (payload as { observationId?: string }).observationId ?? (payload as { id?: string }).id;
      const statusData = (payload as { statusData?: Record<string, unknown> }).statusData ?? {};
      if (!observationId) return json({ success: false, message: "observationId مطلوب" }, 400);
      const { data: existing, error: fetchErr } = await supabase.from(dailyObsTable).select("data").eq("id", String(observationId)).maybeSingle();
      if (fetchErr || !existing) return json({ success: false, message: "الملاحظة غير موجودة" }, 400);
      const merged = { ...(existing as { data?: Record<string, unknown> }).data, ...statusData, updatedAt: new Date().toISOString() };
      const { error } = await supabase.from(dailyObsTable).upsert({ id: String(observationId), data: merged, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (error) return json({ success: false, message: error.message }, 400);
      return json({ success: true });
    }
    if (action === "addObservationUpdate") {
      const observationId = (payload as { observationId?: string }).observationId;
      const user = (payload as { user?: string }).user ?? "System";
      const update = (payload as { update?: string }).update ?? "";
      const progress = (payload as { progress?: string }).progress;
      if (!observationId) return json({ success: false, message: "observationId مطلوب" }, 400);
      const { data: existing, error: fetchErr } = await supabase.from(dailyObsTable).select("data").eq("id", String(observationId)).maybeSingle();
      if (fetchErr || !existing) return json({ success: false, message: "الملاحظة غير موجودة" }, 400);
      const data = (existing as { data?: Record<string, unknown> }).data ?? {};
      const updates = Array.isArray(data.updates) ? [...data.updates] : [];
      updates.push({ id: "upd-" + Date.now(), user, update, progress: progress ?? "", timestamp: new Date().toISOString() });
      const merged = { ...data, updates, updatedAt: new Date().toISOString() };
      const { error } = await supabase.from(dailyObsTable).upsert({ id: String(observationId), data: merged, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (error) return json({ success: false, message: error.message }, 400);
      return json({ success: true });
    }
    if (action === "addObservationComment") {
      const observationId = (payload as { observationId?: string }).observationId;
      const user = (payload as { user?: string }).user ?? "System";
      const comment = (payload as { comment?: string }).comment ?? "";
      if (!observationId) return json({ success: false, message: "observationId مطلوب" }, 400);
      const { data: existing, error: fetchErr } = await supabase.from(dailyObsTable).select("data").eq("id", String(observationId)).maybeSingle();
      if (fetchErr || !existing) return json({ success: false, message: "الملاحظة غير موجودة" }, 400);
      const data = (existing as { data?: Record<string, unknown> }).data ?? {};
      const comments = Array.isArray(data.comments) ? [...data.comments] : [];
      comments.push({ id: "CMT-" + Date.now(), user, comment, timestamp: new Date().toISOString() });
      const merged = { ...data, comments, updatedAt: new Date().toISOString() };
      const { error } = await supabase.from(dailyObsTable).upsert({ id: String(observationId), data: merged, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (error) return json({ success: false, message: error.message }, 400);
      return json({ success: true });
    }

    // —— قراءة من ورقة (مرن: أي خطأ جدول/صلاحية يُرجع مصفوفة فارغة، أبداً لا 400) ——
    if (action === "readFromSheet") {
      const sheetName = (payload as { sheetName?: string }).sheetName ?? (typeof payload === "string" ? payload : "") ?? "";
      const sheetStr = typeof sheetName === "string" ? sheetName.trim() : "";
      if (!sheetStr) return json({ success: true, data: [] });
      const table = sheetNameToTable(sheetStr);
      if (!table) return json({ success: true, data: [] });
      const selectCols = table === "users" ? "id, data, password_hash, permissions, created_at, updated_at" : "id, data, created_at, updated_at";
      const { data: rows, error } = await supabase.from(table).select(selectCols).order("updated_at", { ascending: false });
      if (error) {
        return json({ success: true, data: [] });
      }
      const out = (rows || []).map((r: { id: string; data: Record<string, unknown>; password_hash?: string | null; permissions?: unknown; created_at?: string; updated_at?: string }) => {
        const flat: Record<string, unknown> = { id: r.id, ...r.data };
        if (table === "users") {
          if ("password_hash" in r) {
            const hash = (r as { password_hash?: string | null }).password_hash ?? (r.data?.passwordHash as string | undefined);
            flat.passwordHash = hash ?? (r.data?.passwordHash as string | undefined);
          }
          const permsCol = r.permissions != null && typeof r.permissions === "object" && !Array.isArray(r.permissions) ? r.permissions as Record<string, unknown> : null;
          if (permsCol != null) {
            flat.permissions = r.permissions;
          } else if (flat.permissions == null && r.data?.permissions != null && typeof r.data.permissions === "object") {
            flat.permissions = r.data.permissions;
          } else if (flat.permissions == null) {
            flat.permissions = {};
          }
          const emailVal = flat.email ?? (r.data?.Email ?? r.data?.email);
          if (emailVal != null && String(emailVal).trim() !== "") {
            flat.email = typeof emailVal === "string" ? emailVal.trim().toLowerCase() : String(emailVal);
          } else if (r.id && /@/.test(String(r.id))) {
            flat.email = String(r.id).trim().toLowerCase();
          }
          const nameVal = flat.name ?? (r.data?.Name ?? r.data?.name);
          if (nameVal != null && String(nameVal).trim() !== "") {
            flat.name = typeof nameVal === "string" ? nameVal.trim() : String(nameVal);
          } else if (flat.email) {
            flat.name = String(flat.email).split("@")[0] || flat.email;
          }
          const roleFromPerms = permsCol?.role != null && String(permsCol.role).trim() !== "" ? permsCol.role : null;
          const roleVal = roleFromPerms ?? flat.role ?? (r.data?.Role ?? r.data?.role);
          if (roleVal != null && String(roleVal).trim() !== "") flat.role = typeof roleVal === "string" ? roleVal.trim() : String(roleVal);
          const deptVal = flat.department ?? (r.data?.Department ?? r.data?.department);
          if (deptVal != null && String(deptVal).trim() !== "") flat.department = typeof deptVal === "string" ? deptVal.trim() : String(deptVal);
          if (r.created_at) flat.createdAt = r.created_at;
          if (r.updated_at) flat.updatedAt = r.updated_at;
        }
        return flat;
      });
      // حفظ تلقائي في Supabase عند نقص بيانات المستخدم (name/email/role) — بدون المساس بالدور أو الصلاحيات (الصلاحيات من العمود فقط)
      // ⚠️ لا نكتب role: "user" أبداً عند وجود أكثر من مستخدم لتجنب استبدال صلاحيات المدير بعد تسجيل الدخول
      if (table === "users" && rows && rows.length > 0) {
        const now = new Date().toISOString();
        const isOnlyUser = rows.length === 1;
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i] as { id: string; data: Record<string, unknown>; permissions?: unknown };
          const existing = r.data ?? {};
          const flat = out[i] as Record<string, unknown>;
          const permsObj = r.permissions != null && typeof r.permissions === "object" && !Array.isArray(r.permissions) ? r.permissions as Record<string, unknown> : {};
          const existingRoleVal = (permsObj.role != null && String(permsObj.role).trim() !== "" ? permsObj.role : null) ?? (existing.Role != null && String(existing.Role).trim() !== "" ? existing.Role : null) ?? (existing.role != null && String(existing.role).trim() !== "" ? existing.role : null);
          const hasRole = existingRoleVal != null;
          const hasName = (existing.name != null && String(existing.name).trim() !== "") || (existing.Name != null && String(existing.Name).trim() !== "");
          const hasEmail = (existing.email != null && String(existing.email).trim() !== "") || (existing.Email != null && String(existing.Email).trim() !== "");
          if (!hasRole || !hasName || !hasEmail) {
            const merged: Record<string, unknown> = { ...existing };
            if (!hasName && flat.name) merged.name = flat.name;
            if (!hasEmail && flat.email) merged.email = flat.email;
            let roleForPerms: string | undefined;
            if (!hasRole) {
              const explicitRole = (flat.role && String(flat.role).trim()) || null;
              roleForPerms = isOnlyUser ? (explicitRole || "admin") : (explicitRole ?? undefined) ?? undefined;
            } else {
              roleForPerms = String(existingRoleVal);
            }
            const wouldOverwriteAdminWithUser = !hasRole && !isOnlyUser && (roleForPerms === "user" || roleForPerms == null);
            delete (merged as Record<string, unknown>).permissions;
            delete (merged as Record<string, unknown>).role;
            delete (merged as Record<string, unknown>).Role;
            const payload: { id: string; data: Record<string, unknown>; updated_at: string; permissions?: unknown } = { id: r.id, data: merged, updated_at: now };
            const permsPayload = { ...permsObj } as Record<string, unknown>;
            if (roleForPerms != null) permsPayload.role = roleForPerms;
            if (Object.keys(permsPayload).length > 0) payload.permissions = permsPayload;
            if (!wouldOverwriteAdminWithUser) {
              await supabase.from(table).upsert(payload, { onConflict: "id" });
              if (merged.name != null) flat.name = merged.name;
              if (merged.email != null) flat.email = merged.email;
              if (roleForPerms != null) flat.role = roleForPerms;
            }
          }
        }
      }
      return json({ success: true, data: out });
    }

    // —— حفظ (استبدال/تحديث) ورقة ——
    if (action === "saveToSheet") {
      const sheetName = (payload as { sheetName?: string }).sheetName;
      const data = (payload as { data?: unknown }).data;
      if (!sheetName) return json({ success: false, message: "sheetName is required" }, 400);
      const table = sheetNameToTable(sheetName);
      const rows = Array.isArray(data) ? data : (data != null ? [data] : []);
      for (const row of rows) {
        const id = row?.id ?? row?.ID ?? crypto.randomUUID();
        let dataObj: Record<string, unknown> = typeof row === "object" && row !== null ? { ...row } as Record<string, unknown> : { id, value: row };
        // جدول users: دمج مع البيانات الحالية وعدم المساس بالصلاحيات أو الدور إلا عند قدومها صراحة من مدير (منع التغيير التلقائي بعد تسجيل الدخول)
        if (table === "users") {
          const { data: existingRow } = await supabase.from(table).select("data,password_hash,permissions").eq("id", String(id)).maybeSingle();
          const ex = existingRow as { data?: Record<string, unknown>; password_hash?: string | null; permissions?: unknown } | null;
          const existingData = ex?.data ?? {};
          const existingPermissionsCol = ex?.permissions != null && typeof ex.permissions === "object" && !Array.isArray(ex.permissions) ? ex.permissions as Record<string, unknown> : null;
          const merged: Record<string, unknown> = { ...existingData, ...dataObj };
          const existingRoleVal = (existingPermissionsCol?.role != null && String(existingPermissionsCol.role).trim() !== "" ? existingPermissionsCol.role : null) ?? (existingData.Role != null && String(existingData.Role).trim() !== "" ? existingData.Role : null) ?? (existingData.role != null && String(existingData.role).trim() !== "" ? existingData.role : null);
          const incomingRole = dataObj.role != null && String(dataObj.role).trim() !== "" ? dataObj.role : (dataObj.Role != null && String(dataObj.Role).trim() !== "" ? dataObj.Role : undefined);
          if (incomingRole === undefined && existingRoleVal != null) {
            merged.role = existingRoleVal;
          } else if (incomingRole === "user" && existingRoleVal === "admin") {
            merged.role = "admin";
          }
          const hasExplicitPermissions = Object.prototype.hasOwnProperty.call(dataObj, "permissions");
          const mergedPerms: Record<string, unknown> = { ...(existingPermissionsCol || {}), ...(hasExplicitPermissions && merged.permissions != null && typeof merged.permissions === "object" ? (merged.permissions as Record<string, unknown>) : {}) };
          if (merged.role != null) mergedPerms.role = merged.role;
          if (merged.name == null && existingData.name != null) merged.name = existingData.name;
          if (merged.email == null && existingData.email != null) merged.email = existingData.email;
          const ph = (row as { passwordHash?: string })?.passwordHash ?? ex?.password_hash;
          delete (merged as Record<string, unknown>).passwordHash;
          delete (merged as Record<string, unknown>).permissions;
          delete (merged as Record<string, unknown>).role;
          delete (merged as Record<string, unknown>).Role;
          const dataForCol = { ...merged };
          const rowPayload: { id: string; data: Record<string, unknown>; updated_at: string; password_hash?: string | null; permissions?: unknown } = {
            id: String(id),
            data: dataForCol,
            updated_at: new Date().toISOString(),
          };
          if (ph != null) rowPayload.password_hash = ph;
          rowPayload.permissions = mergedPerms;
          const { error } = await supabase.from(table).upsert(rowPayload, { onConflict: "id" });
          if (error) {
            if (isTableMissingError(error)) return json({ success: true, message: "تم الحفظ" });
            return json({ success: false, message: error.message }, 400);
          }
          continue;
        }
        const { error } = await supabase.from(table).upsert({ id: String(id), data: dataObj, updated_at: new Date().toISOString() }, { onConflict: "id" });
        if (error) {
          if (isTableMissingError(error)) return json({ success: true, message: "تم الحفظ" });
          return json({ success: false, message: error.message }, 400);
        }
      }
      return json({ success: true, message: "تم الحفظ" });
    }

    // —— إلحاق صفوف ——
    if (action === "appendToSheet") {
      const sheetName = (payload as { sheetName?: string }).sheetName;
      const data = (payload as { data?: unknown }).data;
      if (!sheetName) return json({ success: false, message: "sheetName is required" }, 400);
      const table = sheetNameToTable(sheetName);
      const rows = Array.isArray(data) ? data : (data != null ? [data] : []);
      for (const row of rows) {
        const id = row?.id ?? row?.ID ?? crypto.randomUUID();
        const dataObj = typeof row === "object" && row !== null ? { ...row } : { id, value: row };
        const { error } = await supabase.from(table).insert({ id: String(id), data: dataObj });
        if (error) {
          if (isTableMissingError(error)) return json({ success: true, message: "تمت الإضافة" });
          return json({ success: false, message: error.message }, 400);
        }
      }
      return json({ success: true, message: "تمت الإضافة" });
    }

    // —— عمليات مرتبطة بالخرائط والإحداثيات ——
    if (action === "getMapCoordinates" || action === "PTW_MAP_COORDINATES") {
      const table = sheetNameToTable("PTW_MAP_COORDINATES");
      const { data: rows, error } = await supabase.from(table).select("id, data");
      if (error) return json({ success: false, message: error.message }, 400);
      return json({ success: true, data: (rows || []).map((r: { data: Record<string, unknown> }) => r.data) });
    }
    if (action === "saveMapCoordinates") {
      const table = sheetNameToTable("PTW_MAP_COORDINATES");
      const items = Array.isArray((payload as { data?: unknown }).data) ? (payload as { data: unknown[] }).data : [(payload as { coordinates?: unknown }).coordinates ?? payload];
      for (const item of items) {
        const id = (item as { id?: string })?.id ?? crypto.randomUUID();
        const { error } = await supabase.from(table).upsert({ id, data: item, updated_at: new Date().toISOString() }, { onConflict: "id" });
        if (error) return json({ success: false, message: error.message }, 400);
      }
      return json({ success: true });
    }
    if (action === "getDefaultCoordinates") {
      const table = sheetNameToTable("PTW_DEFAULT_COORDINATES");
      const { data: rows, error } = await supabase.from(table).select("id, data").limit(1);
      if (error) return json({ success: false, message: error.message }, 400);
      const first = (rows && rows[0]) as { data?: unknown } | undefined;
      return json({ success: true, data: first?.data ?? null });
    }
    if (action === "saveDefaultCoordinates") {
      const table = sheetNameToTable("PTW_DEFAULT_COORDINATES");
      const data = (payload as { coordinates?: unknown }).coordinates ?? payload;
      const id = (data as { id?: string })?.id ?? "default";
      const { error } = await supabase.from(table).upsert({ id, data, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (error) return json({ success: false, message: error.message }, 400);
      return json({ success: true });
    }
    if (action === "initMapCoordinatesTable") return json({ success: true });

    // —— تتبع المشاكل: getAllIssues مع فلترة اختيارية (إذا الجدول غير موجود نرجع مصفوفة فارغة) ——
    if (action === "getAllIssues") {
      const table = sheetNameToTable("IssueTracking");
      const { data: rows, error } = await supabase.from(table).select("id, data").order("updated_at", { ascending: false });
      if (error) {
        const msg = (error as { message?: string }).message || "";
        if (msg.includes("does not exist") || msg.includes("42P01") || (error as { code?: string }).code === "42P01") {
          return json({ success: true, data: [] });
        }
        return json({ success: false, message: error.message }, 400);
      }
      let out = (rows || []).map((r: { id: string; data: Record<string, unknown> }) => ({ id: r.id, ...r.data }));
      const filters = (payload as { filters?: Record<string, string> }).filters;
      if (filters && typeof filters === "object") {
        if (filters.status) out = out.filter((i: { status?: string }) => (i.status || "").toLowerCase() === String(filters!.status).toLowerCase());
        if (filters.priority) out = out.filter((i: { priority?: string }) => (i.priority || "").toLowerCase() === String(filters!.priority).toLowerCase());
      }
      return json({ success: true, data: out });
    }

    // —— جلب عضو فريق واحد بالمعرف ——
    if (action === "getSafetyTeamMember") {
      const memberId = (payload as { memberId?: string }).memberId ?? (payload as { id?: string }).id;
      if (!memberId) return json({ success: false, message: "memberId مطلوب" }, 400);
      const table = sheetNameToTable("SafetyTeamMembers");
      const { data: row, error } = await supabase.from(table).select("id, data").eq("id", String(memberId)).maybeSingle();
      if (error) return json({ success: false, message: error.message }, 400);
      if (!row) return json({ success: false, message: "عضو الفريق غير موجود" }, 404);
      const out = { id: row.id, ...(row as { data?: Record<string, unknown> }).data };
      return json({ success: true, data: out });
    }

    // —— جلب وصف وظيفي لعضو بالمعرف ——
    if (action === "getJobDescription") {
      const memberId = (payload as { memberId?: string }).memberId ?? (payload as { id?: string }).id;
      if (!memberId) return json({ success: false, message: "memberId مطلوب" }, 400);
      const table = sheetNameToTable("SafetyJobDescriptions");
      const { data: rows, error } = await supabase.from(table).select("id, data").order("updated_at", { ascending: false });
      if (error) return json({ success: false, message: error.message }, 400);
      const list = (rows || []).map((r: { id: string; data: Record<string, unknown> }) => ({ id: r.id, ...r.data }));
      const one = list.find((j: Record<string, unknown>) => String(j.memberId ?? j.member_id ?? j.id ?? "").trim() === String(memberId).trim());
      if (!one) return json({ success: true, data: null });
      return json({ success: true, data: one });
    }

    // —— getOrganizationalStructure: إرجاع مصفوفة جميع مناصب الهيكل ——
    if (action === "getOrganizationalStructure") {
      const table = sheetNameToTable("SafetyOrganizationalStructure");
      const { data: rows, error } = await supabase.from(table).select("id, data").order("updated_at", { ascending: false });
      if (error) return json({ success: false, message: error.message }, 400);
      const list = (rows || []).map((r: { id: string; data: Record<string, unknown> }) => ({ id: r.id, ...r.data }));
      return json({ success: true, data: list });
    }
    // —— saveOrganizationalStructure: دعم مصفوفة كاملة (استبدال) أو عنصر واحد (إضافة/تحديث) ——
    if (action === "saveOrganizationalStructure") {
      const table = sheetNameToTable("SafetyOrganizationalStructure");
      const structure = (payload as { structure?: unknown[] }).structure;
      if (Array.isArray(structure)) {
        const now = new Date().toISOString();
        const toUpsert = structure.map((item: unknown) => {
          const rec = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
          return {
            id: String(rec.id ?? (rec as { ID?: string }).ID ?? crypto.randomUUID()),
            data: rec,
            updated_at: now,
          };
        });
        const ids = toUpsert.map((r) => r.id);
        const { data: existingRows } = await supabase.from(table).select("id");
        const existingIds = (existingRows || []).map((r: { id: string }) => r.id);
        for (const oldId of existingIds) {
          if (!ids.includes(oldId)) {
            await supabase.from(table).delete().eq("id", oldId);
          }
        }
        for (const row of toUpsert) {
          const { error } = await supabase.from(table).upsert({ id: row.id, data: row.data, updated_at: row.updated_at }, { onConflict: "id" });
          if (error) return json({ success: false, message: error.message }, 400);
        }
        return json({ success: true });
      }
      const data = (payload as { data?: Record<string, unknown> }).data ?? (payload as Record<string, unknown>);
      const id = (payload as { id?: string }).id ?? (data as { id?: string })?.id ?? crypto.randomUUID();
      const { error } = await supabase.from(table).upsert({ id: String(id), data: data ?? {}, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (error) return json({ success: false, message: error.message }, 400);
      return json({ success: true });
    }

    // —— updateSafetyTeamMember: دمج التحديث مع السجل الموجود ——
    if (action === "updateSafetyTeamMember") {
      const memberId = (payload as { memberId?: string }).memberId ?? (payload as { id?: string }).id;
      const updateData = (payload as { updateData?: Record<string, unknown> }).updateData ?? payload;
      if (!memberId) return json({ success: false, message: "memberId مطلوب" }, 400);
      const table = sheetNameToTable("SafetyTeamMembers");
      const { data: existing, error: fetchErr } = await supabase.from(table).select("id, data").eq("id", String(memberId)).maybeSingle();
      if (fetchErr) return json({ success: false, message: fetchErr.message }, 400);
      const current = (existing as { data?: Record<string, unknown> } | null)?.data ?? {};
      const merged = { ...current, ...(updateData as Record<string, unknown>), id: memberId };
      const { error } = await supabase.from(table).upsert({ id: String(memberId), data: merged, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (error) return json({ success: false, message: error.message }, 400);
      return json({ success: true });
    }

    // —— getSafetyTeamAttendance: جلب سجلات الحضور (اختياري: فلترة حسب memberId) ——
    if (action === "getSafetyTeamAttendance") {
      const table = sheetNameToTable("SafetyTeamAttendance");
      const { data: rows, error } = await supabase.from(table).select("id, data").order("updated_at", { ascending: false });
      if (error) return json({ success: true, data: [] });
      let list = (rows || []).map((r: { id: string; data: Record<string, unknown> }) => ({ id: r.id, ...r.data }));
      const memberId = (payload as { memberId?: string }).memberId;
      if (memberId) list = list.filter((r: Record<string, unknown>) => String(r.memberId ?? r.member_id ?? "").trim() === String(memberId).trim());
      return json({ success: true, data: list });
    }

    // —— getSafetyTeamLeaves: جلب سجلات الإجازات (اختياري: فلترة حسب memberId) ——
    if (action === "getSafetyTeamLeaves") {
      const table = sheetNameToTable("SafetyTeamLeaves");
      const { data: rows, error } = await supabase.from(table).select("id, data").order("updated_at", { ascending: false });
      if (error) return json({ success: true, data: [] });
      let list = (rows || []).map((r: { id: string; data: Record<string, unknown> }) => ({ id: r.id, ...r.data }));
      const memberId = (payload as { memberId?: string }).memberId;
      if (memberId) list = list.filter((r: Record<string, unknown>) => String(r.memberId ?? r.member_id ?? "").trim() === String(memberId).trim());
      return json({ success: true, data: list });
    }

    // —— saveJobDescription: إدراج أو تحديث حسب memberId (وصف واحد لكل عضو) ——
    if (action === "saveJobDescription") {
      const formData = (payload as { data?: Record<string, unknown> }).data ?? (payload as Record<string, unknown>);
      const memberId = (formData as { memberId?: string }).memberId ?? (formData as { member_id?: string }).member_id;
      if (!memberId) return json({ success: false, message: "memberId مطلوب" }, 400);
      const table = sheetNameToTable("SafetyJobDescriptions");
      const id = (formData as { id?: string }).id ?? String(memberId);
      const { error } = await supabase.from(table).upsert({ id, data: formData, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (error) return json({ success: false, message: error.message }, 400);
      return json({ success: true });
    }
    // —— updateJobDescription: تحديث حسب jobDescriptionId مع دمج البيانات ——
    if (action === "updateJobDescription") {
      const jobDescriptionId = (payload as { jobDescriptionId?: string }).jobDescriptionId ?? (payload as { id?: string }).id;
      const updateData = (payload as { updateData?: Record<string, unknown> }).updateData ?? payload;
      if (!jobDescriptionId) return json({ success: false, message: "jobDescriptionId مطلوب" }, 400);
      const table = sheetNameToTable("SafetyJobDescriptions");
      const { data: existing, error: fetchErr } = await supabase.from(table).select("id, data").eq("id", String(jobDescriptionId)).maybeSingle();
      if (fetchErr) return json({ success: false, message: fetchErr.message }, 400);
      const current = (existing as { data?: Record<string, unknown> } | null)?.data ?? {};
      const merged = { ...current, ...(updateData as Record<string, unknown>), id: jobDescriptionId };
      const { error } = await supabase.from(table).upsert({ id: String(jobDescriptionId), data: merged, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (error) return json({ success: false, message: error.message }, 400);
      return json({ success: true });
    }

    // —— calculateSafetyTeamKPIs: إرجاع مصفوفة من جدول KPIs أو فارغة ——
    if (action === "calculateSafetyTeamKPIs") {
      const table = sheetNameToTable("SafetyTeamKPIs");
      const { data: rows, error } = await supabase.from(table).select("id, data").order("updated_at", { ascending: false });
      if (error) return json({ success: true, data: [] });
      const list = (rows || []).map((r: { id: string; data: Record<string, unknown> }) => ({ id: r.id, ...r.data }));
      return json({ success: true, data: list });
    }

    // —— اعتماد/رفض طلب مقاول: دمج التحديث مع السجل الموجود + إنشاء سجل معتمد عند الاعتماد ——
    if (action === "approveContractorApprovalRequest" || action === "rejectContractorApprovalRequest") {
      const requestId = (payload as { requestId?: string }).requestId ?? (payload as { id?: string }).id;
      if (!requestId) return json({ success: false, message: "requestId مطلوب" }, 400);
      const table = sheetNameToTable("ContractorApprovalRequests");
      const { data: existing, error: fetchErr } = await supabase.from(table).select("id, data").eq("id", String(requestId)).maybeSingle();
      if (fetchErr) return json({ success: false, message: fetchErr.message }, 400);
      const current = (existing as { data?: Record<string, unknown> } | null)?.data ?? {};
      const userData = (payload as { userData?: Record<string, unknown> }).userData ?? {};
      const merged: Record<string, unknown> = { ...current };
      if (action === "approveContractorApprovalRequest") {
        merged.status = "approved";
        merged.approvedAt = new Date().toISOString();
        merged.approvedBy = (userData as { id?: string }).id ?? "";
        merged.approvedByName = (userData as { name?: string }).name ?? "";
      } else {
        merged.status = "rejected";
        merged.rejectionReason = (payload as { rejectionReason?: string }).rejectionReason ?? "";
        merged.rejectedAt = new Date().toISOString();
        merged.rejectedBy = (userData as { id?: string }).id ?? "";
        merged.rejectedByName = (userData as { name?: string }).name ?? "";
      }
      merged.updatedAt = new Date().toISOString();
      const { error } = await supabase.from(table).upsert({ id: String(requestId), data: merged, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (error) return json({ success: false, message: error.message }, 400);

      // عند الاعتماد: إنشاء سجل في ApprovedContractors وإرجاع approvedEntity للواجهة
      if (action === "approveContractorApprovalRequest") {
        const requestType = (merged.requestType as string) || (current as { requestType?: string }).requestType || "contractor";
        if (requestType === "contractor" || requestType === "supplier") {
          const approvedTable = sheetNameToTable("ApprovedContractors");
          const companyName = (merged.companyName as string) || (current as { companyName?: string }).companyName || "";
          const approvedId = "AC_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
          const approvedEntity: Record<string, unknown> = {
            id: approvedId,
            contractorId: (merged.contractorId as string) ?? (current as { contractorId?: string }).contractorId ?? null,
            companyName: companyName,
            entityType: requestType,
            serviceType: (merged.serviceType as string) ?? (current as { serviceType?: string }).serviceType ?? "",
            licenseNumber: (merged.licenseNumber as string) ?? (current as { licenseNumber?: string }).licenseNumber ?? "",
            code: (merged.code as string) ?? (current as { code?: string }).code ?? "",
            isoCode: (merged.isoCode as string) ?? (current as { isoCode?: string }).isoCode ?? "",
            approvedAt: merged.approvedAt,
            approvedBy: merged.approvedBy,
            approvedByName: merged.approvedByName,
            createdAt: new Date().toISOString(),
            updatedAt: merged.updatedAt,
          };
          const { error: insertErr } = await supabase.from(approvedTable).insert({ id: approvedId, data: approvedEntity, updated_at: new Date().toISOString() });
          if (insertErr) return json({ success: false, message: insertErr.message }, 400);
          return json({ success: true, approvedEntity });
        }
      }
      return json({ success: true });
    }

    // —— getAllUserTasks: قراءة من user_tasks (بدون فلتر) ——
    if (action === "getAllUserTasks") {
      const { data: rows, error } = await supabase.from("user_tasks").select("id, data").order("updated_at", { ascending: false });
      if (error) return json({ success: false, message: error.message }, 400);
      const list = (rows || []).map((r: { id: string; data: Record<string, unknown> }) => ({ id: r.id, ...r.data }));
      return json({ success: true, data: list });
    }

    // —— saveTestReport: إلحاق تقرير اختبار ——
    if (action === "saveTestReport") {
      const table = sheetNameToTable("TestReports");
      const row = typeof payload === "object" && payload !== null ? { ...(payload as object), id: (payload as { id?: string }).id ?? crypto.randomUUID() } : { id: crypto.randomUUID(), value: payload };
      const { error } = await supabase.from(table).insert({ id: String(row.id), data: row });
      if (error) return json({ success: true });
      return json({ success: true });
    }

    // —— سجل نشاط المستخدم (اختياري: لا جدول مخصص بعد، نرجع نجاح لتجنب 400) ——
    if (action === "addUserActivityLog") {
      return json({ success: true, data: [] });
    }

    // —— عمليات أخرى: ربط بـ readFromSheet حسب خريطة الـ action ——
    const sheet = ACTION_SHEET_MAP[action];
    if (sheet) {
      const table = sheetNameToTable(sheet);
      const op = action.startsWith("getAll") || (action.startsWith("get") && !action.includes("User")) ? "read" : action.startsWith("add") || action.startsWith("approve") || action.startsWith("reject") || action.startsWith("create") ? "append" : action.startsWith("delete") ? "delete" : "save";
      if (op === "read") {
        const { data: rows, error } = await supabase.from(table).select("id, data").order("updated_at", { ascending: false });
        if (error) {
          if (isTableMissingError(error)) return json({ success: true, data: [] });
          return json({ success: false, message: error.message }, 400);
        }
        const out = (rows || []).map((r: { id: string; data: Record<string, unknown> }) => ({ id: r.id, ...r.data }));
        return json({ success: true, data: out });
      }
      if (op === "append") {
        let payloadData: Record<string, unknown> = typeof payload === "object" && payload !== null ? (payload as object) as Record<string, unknown> : {};
        if (payloadData.data && typeof payloadData.data === "object" && !Array.isArray(payloadData.data) && Object.keys(payloadData).length === 1) {
          payloadData = payloadData.data as Record<string, unknown>;
        }
        const one = (payloadData as { id?: string }).id ?? (payloadData as { visitId?: string }).visitId ?? (payloadData as { incidentId?: string }).incidentId;
        const row = typeof payloadData === "object" && payloadData !== null ? { ...payloadData, id: one ?? crypto.randomUUID() } : { id: crypto.randomUUID(), value: payload };
        const { error } = await supabase.from(table).insert({ id: String(row.id), data: row });
        if (error) return json({ success: false, message: error.message }, 400);
        return json({ success: true, data: row });
      }
      if (op === "delete") {
        const id = (payload as { id?: string }).id
          ?? (payload as { observationId?: string }).observationId
          ?? (payload as { contractorId?: string }).contractorId
          ?? (payload as { approvedContractorId?: string }).approvedContractorId
          ?? (payload as { incidentId?: string }).incidentId
          ?? (payload as { medicationId?: string }).medicationId
          ?? (payload as { alertId?: string }).alertId
          ?? (payload as { ppeId?: string }).ppeId
          ?? (payload as { itemId?: string }).itemId
          ?? (payload as { trainingId?: string }).trainingId
          ?? (payload as { leaveId?: string }).leaveId
          ?? (payload as { violationId?: string }).violationId
          ?? (payload as { behaviorId?: string }).behaviorId
          ?? (payload as { memberId?: string }).memberId
          ?? (payload as { attendanceId?: string }).attendanceId
          ?? (payload as { leaveId?: string }).leaveId;
        if (action === "deleteAllObservations" && !id) {
          const { error } = await supabase.from(table).delete().neq("id", "");
          if (error) return json({ success: false, message: error.message }, 400);
        } else if (id) {
          const { error } = await supabase.from(table).delete().eq("id", String(id));
          if (error) return json({ success: false, message: error.message }, 400);
        }
        return json({ success: true });
      }
      if (op === "save") {
        const id = (payload as { requestId?: string }).requestId
          ?? (payload as { userId?: string }).userId
          ?? (payload as { id?: string }).id
          ?? (payload as { incidentId?: string }).incidentId
          ?? (payload as { ptwId?: string }).ptwId
          ?? (payload as { leaveId?: string }).leaveId
          ?? (payload as { trainingId?: string }).trainingId
          ?? (payload as { medicationId?: string }).medicationId
          ?? (payload as { alertId?: string }).alertId
          ?? (payload as { visitId?: string }).visitId
          ?? (payload as { injuryId?: string }).injuryId
          ?? (payload as { ppeId?: string }).ppeId
          ?? (payload as { itemId?: string }).itemId
          ?? (payload as { memberId?: string }).memberId
          ?? (payload as { requestId?: string }).requestId
          ?? (payload as { approvedContractorId?: string }).approvedContractorId
          ?? (payload as { employeeId?: string }).employeeId
          ?? (payload as { attendanceId?: string }).attendanceId
          ?? (payload as { jobDescriptionId?: string }).jobDescriptionId;
        if (!id) return json({ success: false, message: "id or update target required" }, 400);
        const updateData = (payload as { updateData?: Record<string, unknown> }).updateData ?? payload;
        const { error } = await supabase.from(table).upsert({ id: String(id), data: updateData, updated_at: new Date().toISOString() }, { onConflict: "id" });
        if (error) return json({ success: false, message: error.message }, 400);
        return json({ success: true });
      }
    }

    // —— إجراءات المستخدمين (جدول users: الهاش في عمود منفصل password_hash مطابق للنظام السابق) ——
    if (action === "addUser" || action === "updateUser" || action === "deleteUser" || action === "resetUserPassword") {
      const table = "users";
      if (action === "addUser") {
        const email = (payload as { email?: string }).email != null ? String((payload as { email: string }).email).trim().toLowerCase() : "";
        const user = (payload as { id?: string }).id != null && String((payload as { id: string }).id).trim() !== ""
          ? String((payload as { id: string }).id).trim().toLowerCase()
          : email || crypto.randomUUID();
        let id = email && /@/.test(email) ? email : user;
        const hash = (payload as { passwordHash?: string }).passwordHash ?? null;
        const dataWithoutHash = { ...(payload as object) };
        delete (dataWithoutHash as Record<string, unknown>).passwordHash;
        const dataObj = dataWithoutHash as Record<string, unknown>;
        if (dataObj.email == null && email) dataObj.email = email;
        if (dataObj.name == null && (payload as { name?: string }).name) dataObj.name = (payload as { name: string }).name;
        if (dataObj.role == null && (payload as { role?: string }).role) dataObj.role = (payload as { role: string }).role;
        if (dataObj.permissions == null && (payload as { permissions?: unknown }).permissions != null) dataObj.permissions = (payload as { permissions: unknown }).permissions;
        // عمود permissions يجب أن يكون دائماً كائناً (لا يُخزّن 0 أو null) — المصدر الوحيد للدور والصلاحيات
        const rawPerms = dataObj.permissions;
        const permissionsVal: Record<string, unknown> =
          rawPerms != null && typeof rawPerms === "object" && !Array.isArray(rawPerms)
            ? (rawPerms as Record<string, unknown>)
            : {};
        const roleVal = dataObj.role != null ? String(dataObj.role).trim() : "";
        permissionsVal.role = roleVal || "user";
        const dataWithoutPerms = { ...dataObj };
        delete (dataWithoutPerms as Record<string, unknown>).permissions;
        delete (dataWithoutPerms as Record<string, unknown>).role;
        delete (dataWithoutPerms as Record<string, unknown>).Role;
        // إذا وُجد مستخدم بنفس البريد وله id مختلف (مثلاً UUID قديم)، نحدّث ذلك السجل بدل إنشاء مكرر
        if (email && /@/.test(email)) {
          const { data: byId } = await supabase.from(table).select("id").eq("id", id).maybeSingle();
          if (!(byId as { id?: string } | null)?.id) {
            const { data: byEmailRow } = await supabase.from(table).select("id, data").filter("data->>email", "eq", email).limit(1).maybeSingle();
            const existing = byEmailRow as { id?: string } | null;
            if (existing?.id) id = existing.id;
          }
        }
        const row: { id: string; data: Record<string, unknown>; password_hash?: string | null; updated_at: string; permissions?: unknown } = {
          id,
          data: dataWithoutPerms,
          updated_at: new Date().toISOString(),
        };
        if (hash != null) row.password_hash = hash;
        row.permissions = permissionsVal;
        let err = await supabase.from(table).upsert(row, { onConflict: "id" });
        if (err.error) {
          const msg = (err.error as { message?: string }).message || "";
          const isDuplicate = /duplicate|unique constraint|violates unique/i.test(msg);
          if (isDuplicate && email && /@/.test(email)) {
            let existingByEmail = await supabase.from(table).select("id, data, permissions").filter("data->>email", "eq", email).limit(1).maybeSingle();
            if (existingByEmail.data == null && existingByEmail.error == null) {
              const alt = await supabase.from(table).select("id, data, permissions").filter("data->>Email", "eq", email).limit(1).maybeSingle();
              if (alt.data) existingByEmail = { ...existingByEmail, data: alt.data };
            }
            const existing = existingByEmail.data as { id?: string; data?: Record<string, unknown>; permissions?: unknown } | null;
            if (existing?.id) {
              const mergedData = { ...(existing.data ?? {}), ...dataWithoutPerms };
              delete (mergedData as Record<string, unknown>).permissions;
              delete (mergedData as Record<string, unknown>).role;
              delete (mergedData as Record<string, unknown>).Role;
              const existingPerms = existing.permissions;
              const existingPermsObj = existingPerms != null && typeof existingPerms === "object" && !Array.isArray(existingPerms) ? (existingPerms as Record<string, unknown>) : {};
              const mergedPerms = { ...existingPermsObj, ...permissionsVal };
              const mergedRow = { id: existing.id, data: mergedData, updated_at: new Date().toISOString(), permissions: mergedPerms } as typeof row;
              if (hash != null) (mergedRow as { password_hash?: string }).password_hash = hash;
              err = await supabase.from(table).upsert(mergedRow, { onConflict: "id" });
              if (!err.error) return json({ success: true, data: { ...(payload as object), id: existing.id } });
            }
          }
          return json({ success: false, message: err.error.message }, 400);
        }
        return json({ success: true, data: { ...(payload as object), id } });
      }
      if (action === "updateUser") {
        const idRaw = (payload as { userId?: string }).userId ?? (payload as { id?: string }).id;
        const updateData = (payload as { updateData?: Record<string, unknown> }).updateData ?? payload;
        if (!idRaw) return json({ success: false, message: "userId or id required" }, 400);
        const idStr = String(idRaw).trim();
        const hash = (updateData as { passwordHash?: string })?.passwordHash ?? null;
        const dataWithoutHash = typeof updateData === "object" && updateData !== null ? { ...(updateData as object) } : {};
        delete (dataWithoutHash as Record<string, unknown>).passwordHash;
        let { data: existingRow } = await supabase.from(table).select("id,data,permissions").eq("id", idStr).maybeSingle();
        if ((existingRow as { id?: string } | null) == null && /@/.test(idStr)) {
          const { data: byLower } = await supabase.from(table).select("id,data,permissions").eq("id", idStr.toLowerCase()).maybeSingle();
          if ((byLower as { id?: string } | null) != null) existingRow = byLower;
        }
        const resolvedId = (existingRow as { id?: string } | null)?.id ?? idStr;
        const existingData = (existingRow as { data?: Record<string, unknown> } | null)?.data ?? {};
        const existingPermissionsCol = (existingRow as { permissions?: unknown } | null)?.permissions;
        const existingPermsObj = existingPermissionsCol != null && typeof existingPermissionsCol === "object" && !Array.isArray(existingPermissionsCol) ? existingPermissionsCol as Record<string, unknown> : null;
        const existingRole = (existingPermsObj?.role != null && String(existingPermsObj.role).trim() !== "" ? existingPermsObj.role : null) ?? (existingData.Role != null && String(existingData.Role).trim() !== "" ? existingData.Role : null) ?? (existingData.role != null && String(existingData.role).trim() !== "" ? existingData.role : null);
        const mergedData: Record<string, unknown> = { ...existingData, ...dataWithoutHash };
        const incomingRole = (dataWithoutHash as Record<string, unknown>).role ?? (dataWithoutHash as Record<string, unknown>).Role;
        const incomingRoleOk = incomingRole != null && String(incomingRole).trim() !== "";
        if (!incomingRoleOk && existingRole != null) {
          mergedData.role = existingRole;
        } else if (incomingRoleOk && String(incomingRole).trim() === "user" && existingRole === "admin") {
          mergedData.role = "admin";
        }
        const hasPermissionsInPayload = Object.prototype.hasOwnProperty.call(dataWithoutHash as Record<string, unknown>, "permissions");
        const mergedPerms: Record<string, unknown> = { ...(existingPermsObj || {}), ...(hasPermissionsInPayload && mergedData.permissions != null && typeof mergedData.permissions === "object" ? (mergedData.permissions as Record<string, unknown>) : {}) };
        if (mergedData.role != null) mergedPerms.role = mergedData.role;
        const dataForCol = { ...mergedData };
        delete (dataForCol as Record<string, unknown>).permissions;
        delete (dataForCol as Record<string, unknown>).role;
        delete (dataForCol as Record<string, unknown>).Role;
        const row: { id: string; data: Record<string, unknown>; password_hash?: string | null; updated_at: string; permissions?: unknown } = {
          id: resolvedId,
          data: dataForCol,
          updated_at: new Date().toISOString(),
        };
        if (hash != null) row.password_hash = hash;
        row.permissions = mergedPerms;
        const { error } = await supabase.from(table).upsert(row, { onConflict: "id" });
        if (error) return json({ success: false, message: error.message }, 400);
        return json({ success: true });
      }
      if (action === "deleteUser" || action === "resetUserPassword") {
        let id = (payload as { userId?: string }).userId ?? (payload as { id?: string }).id ?? (payload as { email?: string }).email;
        if (!id) return json({ success: false, message: "userId or id or email required" }, 400);
        const idStr = String(id).trim();
        // مطابقة حالة الأحرف مع الجدول (المعرّف يُخزَّن كبريد بصيغة lowercase)
        const normalizedId = /@/.test(idStr) ? idStr.toLowerCase() : idStr;
        if (action === "deleteUser") {
          const { data: byId } = await supabase.from(table).select("id").eq("id", normalizedId).maybeSingle();
          const deleteId = (byId as { id?: string } | null)?.id ?? normalizedId;
          const { error } = await supabase.from(table).delete().eq("id", deleteId);
          if (error) return json({ success: false, message: error.message }, 400);
        } else {
          const newHash = (payload as { newPassword?: string }).newPassword ?? null;
          if (newHash == null) return json({ success: false, message: "newPassword required" }, 400);
          let { data: existingRow } = await supabase.from(table).select("id, data").eq("id", normalizedId).maybeSingle();
          if ((existingRow as { id?: string } | null) == null && /@/.test(idStr)) {
            const { data: byLowerRow } = await supabase.from(table).select("id, data").eq("id", idStr.toLowerCase()).maybeSingle();
            if ((byLowerRow as { id?: string } | null) != null) existingRow = byLowerRow;
          }
          const resolvedId = (existingRow as { id?: string } | null)?.id ?? normalizedId;
          const row: { id: string; data: Record<string, unknown>; password_hash: string; updated_at: string } = {
            id: resolvedId,
            data: (existingRow as { data?: Record<string, unknown> } | null)?.data ?? {},
            password_hash: newHash,
            updated_at: new Date().toISOString(),
          };
          const { error } = await supabase.from(table).upsert(row, { onConflict: "id" });
          if (error) return json({ success: false, message: error.message }, 400);
        }
        return json({ success: true });
      }
    }

    // —— رفع صورة المستخدم إلى Supabase Storage (لنسخة Supabase) ——
    // يتطلب إنشاء bucket باسم "user-photo" في Storage مع صلاحية Public للقراءة
    if (action === "uploadUserPhoto") {
      const base64Data = (payload as { base64Data?: string }).base64Data;
      const fileName = String((payload as { fileName?: string }).fileName || "photo.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
      const mimeType = (payload as { mimeType?: string }).mimeType || "image/jpeg";
      if (!base64Data || typeof base64Data !== "string") {
        return json({ success: false, message: "base64Data مطلوب لرفع صورة المستخدم" }, 400);
      }
      const MAX_BASE64_SIZE = 3 * 1024 * 1024; // ~2MB صورة بعد الترميز
      if (base64Data.length > MAX_BASE64_SIZE) {
        return json({ success: false, message: "حجم الصورة كبير جداً. الحد الأقصى 2 ميجابايت." }, 400);
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(mimeType)) {
        return json({ success: false, message: "نوع الملف غير مدعوم. استخدم صورة (JPEG, PNG, GIF, WEBP)." }, 400);
      }
      try {
        const binaryString = atob(base64Data.replace(/^data:image\/\w+;base64,/, ""));
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const bucket = "user-photo";
        const path = fileName;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, bytes, {
          contentType: mimeType,
          upsert: true,
        });
        if (uploadError) {
          return json(
            { success: false, message: "فشل رفع الصورة: " + (uploadError.message || "تأكد من إنشاء bucket باسم user-photo في Storage") },
            400
          );
        }
        // للـ bucket العام (public): الرابط العام أكثر استقراراً ويقلل 503 من خدمة التوقيع
        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
        const publicUrl = publicUrlData?.publicUrl || "";
        // إذا فشل الرابط العام (bucket خاص): استخدام رابط موقع كبديل
        let photoUrl = publicUrl;
        if (!publicUrl) {
          const expiresIn = 60 * 60 * 24 * 365; // 1 year
          const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
          if (signedData?.signedUrl) photoUrl = signedData.signedUrl;
        }
        return json({ success: true, directLink: photoUrl, publicUrl: photoUrl });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "خطأ غير متوقع عند رفع الصورة";
        return json({ success: false, message: msg }, 400);
      }
    }

    // —— جلب صورة الملف الشخصي عبر الـ Edge Function (لتجاوز 503 من Storage المباشر) ——
    if (action === "getProfileImage") {
      let path = typeof (payload as { path?: string }).path === "string" ? (payload as { path: string }).path.trim() : "";
      if (!path || path.includes("..") || path.includes("/") || path.includes("\\")) {
        return json({ success: false, message: "path مطلوب (اسم الملف فقط داخل user-photo)" }, 400);
      }
      try {
        const bucket = "user-photo";
        const { data: blob, error: downloadError } = await supabase.storage.from(bucket).download(path);
        if (downloadError || !blob) {
          return json({ success: false, message: downloadError?.message || "الملف غير موجود" }, 404);
        }
        const buf = await blob.arrayBuffer();
        const bytes = new Uint8Array(buf);
        const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB
        if (bytes.byteLength > MAX_IMAGE_SIZE) {
          return json({ success: false, message: "حجم الصورة كبير جداً" }, 413);
        }
        let binary = "";
        const len = bytes.byteLength;
        const chunk = 8192;
        for (let i = 0; i < len; i += chunk) {
          const end = Math.min(i + chunk, len);
          binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, end)));
        }
        const base64 = btoa(binary);
        const dotIdx = path.toLowerCase().lastIndexOf(".");
        const ext = dotIdx > 0 ? path.toLowerCase().slice(dotIdx) : "";
        const mime = ext === ".png" ? "image/png" : ext === ".gif" ? "image/gif" : ext === ".webp" ? "image/webp" : "image/jpeg";
        const dataUri = `data:${mime};base64,${base64}`;
        return json({ success: true, dataUri });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "خطأ عند جلب الصورة";
        return json({ success: false, message: msg }, 500);
      }
    }

    // —— إدارة التغيرات: طلب واحد بالمعرف ——
    if (action === "getChangeRequest") {
      const requestId = (payload as { requestId?: string }).requestId ?? (payload as { id?: string }).id;
      if (!requestId) return json({ success: false, message: "requestId مطلوب" }, 400);
      const table = sheetNameToTable("ChangeRequests");
      const { data: row, error } = await supabase.from(table).select("id, data").eq("id", String(requestId)).maybeSingle();
      if (error) return json({ success: false, message: error.message }, 400);
      if (!row) return json({ success: false, message: "طلب التغيير غير موجود" }, 404);
      const out = { id: row.id, ...(row as { data?: Record<string, unknown> }).data };
      return json({ success: true, data: out });
    }

    // —— الرقم المسلسل التالي لطلب التغيير (صيغة MOC-1, MOC-2, ...) ——
    if (action === "getNextChangeRequestNumber") {
      const table = sheetNameToTable("ChangeRequests");
      const { data: rows } = await supabase.from(table).select("id");
      let nextNum = 1;
      if (rows && rows.length > 0) {
        const nums = (rows as { id: string }[])
          .map((r) => {
            const id = String(r.id || "").trim();
            const mocMatch = id.match(/^MOC-?(\d+)$/i);
            if (mocMatch) return parseInt(mocMatch[1], 10);
            const crqMatch = id.match(/^CRQ_?(\d+)$/i);
            if (crqMatch) return parseInt(crqMatch[1], 10);
            return NaN;
          })
          .filter((n) => !isNaN(n));
        if (nums.length) nextNum = Math.max(...nums) + 1;
      }
      const nextId = "MOC-" + nextNum;
      return json({ success: true, data: { requestNumber: nextId, id: nextId } });
    }

    // —— إحصائيات طلبات التغيير ——
    if (action === "getChangeRequestStatistics") {
      const table = sheetNameToTable("ChangeRequests");
      const { data: rows, error } = await supabase.from(table).select("id, data").order("updated_at", { ascending: false });
      if (error) return json({ success: false, message: error.message }, 400);
      const list = (rows || []).map((r: { id: string; data: Record<string, unknown> }) => ({ id: r.id, ...r.data }));
      const byStatus: Record<string, number> = {};
      const byChangeType: Record<string, number> = {};
      const byPriority: Record<string, number> = {};
      const byImpact: Record<string, number> = {};
      for (const item of list) {
        const s = (item as { status?: string }).status || "Unknown";
        byStatus[s] = (byStatus[s] || 0) + 1;
        const ct = (item as { changeType?: string }).changeType || "Unknown";
        byChangeType[ct] = (byChangeType[ct] || 0) + 1;
        const p = (item as { priority?: string }).priority || "Unknown";
        byPriority[p] = (byPriority[p] || 0) + 1;
        const im = (item as { impact?: string }).impact || "Unknown";
        byImpact[im] = (byImpact[im] || 0) + 1;
      }
      return json({
        success: true,
        data: { total: list.length, byStatus, byChangeType, byPriority, byImpact },
      });
    }

    // —— استرجاع كلمة المرور: طلب رابط عبر البريد ——
    if (action === "requestPasswordReset") {
      const email = typeof (payload as { email?: string }).email === "string" ? (payload as { email: string }).email.trim().toLowerCase() : "";
      if (!email) return json({ success: false, message: "البريد الإلكتروني مطلوب" }, 400);
      const resetBaseUrl = typeof (payload as { resetBaseUrl?: string }).resetBaseUrl === "string" ? (payload as { resetBaseUrl: string }).resetBaseUrl.replace(/\/$/, "") : "";
      const { data: userRows } = await supabase.from("users").select("id, data");
      const user = (userRows || []).find((r: { id: string; data?: { email?: string } }) => (r.data?.email || "").toString().toLowerCase().trim() === email);
      if (!user) return json({ success: true, message: "إذا كان البريد مسجلاً ستتلقى رسالة خلال دقائق." });
      const token = crypto.randomUUID() + "-" + Date.now();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const { error: insertErr } = await supabase.from("password_reset_tokens").insert({ email, token, expires_at: expiresAt });
      if (insertErr) return json({ success: false, message: "تعذر إنشاء رابط الاسترجاع. حاول لاحقاً." }, 400);
      const resendKey = Deno.env.get("RESEND_API_KEY");
      const appUrl = resetBaseUrl || Deno.env.get("PASSWORD_RESET_APP_URL") || "";
      const resetLink = appUrl ? `${appUrl}?resetToken=${encodeURIComponent(token)}` : "";
      if (resendKey && resetLink) {
        try {
          const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Password Reset <onboarding@resend.dev>";
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + resendKey },
            body: JSON.stringify({
              from: fromEmail,
              to: [email],
              subject: "استرجاع كلمة المرور - نظام السلامة والصحة المهنية",
              html: `<p>مرحباً،</p><p>تم طلب إعادة تعيين كلمة المرور لحسابك. اضغط على الرابط التالي خلال ساعة لإكمال العملية:</p><p><a href="${resetLink}">${resetLink}</a></p><p>إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p>`,
            }),
          });
          const errBody = await res.text();
          if (!res.ok) throw new Error(errBody || res.statusText);
        } catch (e) {
          const errMsg = (e instanceof Error ? e.message : String(e)).slice(0, 200);
          return json({ success: false, message: "تعذر إرسال البريد. يرجى التحقق من إعدادات Resend (عنوان المرسل والتحقق من النطاق). التفاصيل: " + errMsg }, 500);
        }
      } else if (!resendKey) {
        return json({ success: false, message: "خدمة استرجاع كلمة المرور غير مفعّلة. يرجى التواصل مع مدير النظام." }, 503);
      }
      return json({ success: true, message: "إذا كان البريد مسجلاً ستتلقى رسالة خلال دقائق." });
    }

    // —— استرجاع كلمة المرور: تعيين كلمة جديدة باستخدام الرمز ——
    if (action === "resetPasswordWithToken") {
      const token = typeof (payload as { token?: string }).token === "string" ? (payload as { token: string }).token.trim() : "";
      const newPassword = typeof (payload as { newPassword?: string }).newPassword === "string" ? (payload as { newPassword: string }).newPassword : "";
      if (!token) return json({ success: false, message: "رمز الاسترجاع مطلوب" }, 400);
      if (!newPassword || newPassword.length < 6) return json({ success: false, message: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" }, 400);
      const { data: row, error: tokenErr } = await supabase.from("password_reset_tokens").select("email").eq("token", token).gt("expires_at", new Date().toISOString()).maybeSingle();
      if (tokenErr || !row) return json({ success: false, message: "الرابط غير صالح أو منتهي الصلاحية. اطلب رابطاً جديداً." }, 400);
      const email = (row as { email: string }).email;
      const { data: userRows } = await supabase.from("users").select("id, data");
      const user = (userRows || []).find((r: { id: string; data?: { email?: string } }) => (r.data?.email || "").toString().toLowerCase().trim() === email);
      if (!user) return json({ success: false, message: "المستخدم غير موجود." }, 400);
      const hashed = await sha256Hex(newPassword);
      const { data: existing } = await supabase.from("users").select("data").eq("id", user.id).maybeSingle();
      const { error: updateErr } = await supabase.from("users").upsert({
        id: user.id,
        data: (existing as { data?: Record<string, unknown> } | null)?.data ?? {},
        password_hash: hashed,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (updateErr) return json({ success: false, message: updateErr.message }, 400);
      await supabase.from("password_reset_tokens").delete().eq("token", token);
      return json({ success: true, message: "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن." });
    }

    // —— getPublicIP (اختياري: نرجع رسالة) ——
    if (action === "getPublicIP") {
      return json({ success: false, message: "getPublicIP not available on Supabase backend" });
    }

    // أي إجراء غير معروف: إرجاع 200 مع data فارغ لتجنب سلسلة 400 بعد تسجيل الدخول (المزامنة والوحدات تستدعي إجراءات قد لا تكون منفذة بعد)
    const actionLower = action.toLowerCase();
    if (actionLower === "readfromsheets" || (actionLower.includes("read") && actionLower.includes("sheet"))) {
      return json({ success: true, data: [] });
    }
    return json({ success: true, data: [] });
  } catch (err) {
    console.error("[hse-api] error:", err);
    return json({ success: false, message: GENERIC_ERROR_MESSAGE }, 500);
  }
});
