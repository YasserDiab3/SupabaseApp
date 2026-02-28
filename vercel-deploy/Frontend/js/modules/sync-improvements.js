/**
 * تحسينات المزامنة مع قاعدة البيانات
 * Sync Improvements Module
 * 
 * Features:
 * - Batch processing للتخفيف من الحمل
 * - Progress indicator لعرض التقدم
 * - Auto-save بعد كل دفعة
 * - Error handling محسّن
 */

(function() {
    'use strict';
    
    const SyncImprovements = {
        /** حالة إخفاء النافذة (التحميل يستمر في الخلفية) */
        _progressHidden: false,
        _totalSheets: 0,

        /**
         * إنشاء مؤشر التقدم
         */
        createProgressIndicator(totalSheets) {
            // حذف أي مؤشر قديم أولاً
            this.removeProgressIndicator();
            this._progressHidden = false;
            this._totalSheets = totalSheets;

            const progressIndicator = document.createElement('div');
            progressIndicator.id = 'sync-progress-indicator';
            progressIndicator.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 10001;
                text-align: center;
                min-width: 350px;
                direction: rtl;
            `;
            progressIndicator.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <i class="fas fa-sync fa-spin" style="font-size: 36px; color: #3B82F6;"></i>
                </div>
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #1F2937;">
                    جاري تحميل قاعدة البيانات  Database loaded.
                </div>
                <div style="margin-bottom: 15px;">
                    <div style="background: #E5E7EB; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div id="sync-progress-bar" style="background: #3B82F6; height: 100%; width: 0%; transition: width 0.3s;"></div>
                    </div>
                </div>
                <div id="sync-progress-text" style="color: #6B7280; font-size: 14px;">
                    0 من ${totalSheets} (0%)
                </div>
                <div style="margin-top: 15px; color: #9CA3AF; font-size: 12px;">
                    يرجى عدم إغلاق المتصفح أو إعادة تحميل الصفحة
                </div>
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #E5E7EB;">
                    <button type="button" id="sync-progress-hide-btn" style="
                        background: #F3F4F6;
                        color: #4B5563;
                        border: 1px solid #D1D5DB;
                        padding: 8px 16px;
                        border-radius: 8px;
                        font-size: 14px;
                        cursor: pointer;
                        font-family: inherit;
                    " title="إخفاء النافذة مع استمرار التحميل في الخلفية">إخفاء النافذة</button>
                </div>
            `;
            document.body.appendChild(progressIndicator);

            const hideBtn = document.getElementById('sync-progress-hide-btn');
            if (hideBtn) {
                hideBtn.addEventListener('click', () => this.hideProgressIndicator());
            }
            return progressIndicator;
        },

        /**
         * إخفاء نافذة التقدم مع استمرار التحميل في الخلفية
         */
        hideProgressIndicator() {
            const el = document.getElementById('sync-progress-indicator');
            if (!el) return;
            el.style.display = 'none';
            this._progressHidden = true;
            this._createFloatingShowButton();
        },

        /**
         * إظهار نافذة التقدم مرة أخرى
         */
        showProgressIndicator() {
            const el = document.getElementById('sync-progress-indicator');
            if (el) {
                el.style.display = '';
                this._progressHidden = false;
            }
            this._removeFloatingShowButton();
        },

        /**
         * إنشاء زر عائم لإظهار نافذة التقدم
         */
        _createFloatingShowButton() {
            this._removeFloatingShowButton();
            const floating = document.createElement('div');
            floating.id = 'sync-progress-floating';
            floating.style.cssText = `
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10002;
                display: flex;
                align-items: center;
                gap: 10px;
                background: white;
                padding: 10px 16px;
                border-radius: 24px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                direction: rtl;
                font-size: 14px;
                color: #374151;
            `;
            const progressSpan = document.createElement('span');
            progressSpan.id = 'sync-progress-floating-text';
            progressSpan.textContent = 'جاري تحميل البيانات من قاعدة البيانات... 0 من ' + (this._totalSheets || '?') + ' (0%)';
            const showBtn = document.createElement('button');
            showBtn.type = 'button';
            showBtn.textContent = 'إظهار';
            showBtn.style.cssText = `
                background: #3B82F6;
                color: white;
                border: none;
                padding: 6px 14px;
                border-radius: 8px;
                font-size: 13px;
                cursor: pointer;
                font-family: inherit;
            `;
            showBtn.addEventListener('click', () => this.showProgressIndicator());
            floating.appendChild(progressSpan);
            floating.appendChild(showBtn);
            document.body.appendChild(floating);
        },

        _removeFloatingShowButton() {
            const floating = document.getElementById('sync-progress-floating');
            if (floating && floating.parentNode) {
                floating.parentNode.removeChild(floating);
            }
        },
        
        /**
         * تحديث مؤشر التقدم
         */
        updateProgress(completed, total) {
            const percent = Math.round((completed / total) * 100);
            const progressBar = document.getElementById('sync-progress-bar');
            const progressText = document.getElementById('sync-progress-text');
            if (progressBar) progressBar.style.width = `${percent}%`;
            if (progressText) progressText.textContent = `${completed} من ${total} (${percent}%)`;
            // تحديث النص في الزر العائم عند إخفاء النافذة
            if (this._progressHidden) {
                const floatingText = document.getElementById('sync-progress-floating-text');
                if (floatingText) floatingText.textContent = `جاري تحميل البيانات من قاعدة البيانات... ${completed} من ${total} (${percent}%)`;
            }
        },
        
        /**
         * إزالة مؤشر التقدم والزر العائم
         */
        removeProgressIndicator() {
            this._progressHidden = false;
            this._removeFloatingShowButton();
            const progressIndicator = document.getElementById('sync-progress-indicator');
            if (progressIndicator && progressIndicator.parentNode) {
                progressIndicator.parentNode.removeChild(progressIndicator);
            }
        },
        
        /**
         * معالجة دفعة من الأوراق
         */
        async processBatch(batch, readFromSheetsFunc, sheetMapping, shouldLog) {
            const results = await Promise.allSettled(
                batch.map(sheetName =>
                    readFromSheetsFunc(sheetName)
                        .then(data => ({ sheetName, data, success: true }))
                        .catch(error => ({ sheetName, error, success: false }))
                )
            );
            
            let syncedInBatch = 0;
            const failedInBatch = [];
            
            results.forEach((result, index) => {
                let sheetName, data, error, success;
                
                if (result.status === 'fulfilled') {
                    ({ sheetName, data, error, success } = result.value);
                } else {
                    // معالجة الرفض
                    sheetName = batch[index];
                    error = result.reason?.message || result.reason || 'خطأ غير معروف';
                    success = false;
                }
                
                const key = sheetMapping[sheetName];
                
                if (!key) {
                    if (shouldLog) {
                        Utils.safeWarn(`⚠ لم يتم تعيين مفتاح لـ ورقة العمل ${sheetName}`);
                    }
                    return;
                }
                
                if (!success || error) {
                    failedInBatch.push(sheetName);
                    if (shouldLog) {
                        Utils.safeWarn(`⚠ فشل تحميل ${sheetName}:`, error?.message || error);
                    }
                    return;
                }
                
                if (Array.isArray(data)) {
                    AppState.appData[key] = data;
                    if (data.length > 0) {
                        syncedInBatch++;
                        if (shouldLog) {
                            Utils.safeLog(`✅ تم تحميل ${data.length} سجل من ${sheetName}`);
                        }
                    } else if (shouldLog) {
                        Utils.safeLog(`✅ ${sheetName} فارغة (تم التخطي بشكل آمن)`);
                    }
                } else {
                    // ✅ تحسين: التحقق من وجود بيانات قديمة قبل استبدالها بمصفوفة فارغة
                    const oldData = AppState.appData[key] || [];
                    if (oldData.length > 0) {
                        // الاحتفاظ بالبيانات القديمة
                        if (shouldLog) {
                            Utils.safeLog(`⚠️ ${sheetName} لم تُرجع array - الاحتفاظ بالبيانات الحالية (${oldData.length} سجل)`);
                        }
                    } else {
                        // فقط إذا لم تكن هناك بيانات قديمة، نستخدم مصفوفة فارغة
                        AppState.appData[key] = [];
                        if (shouldLog) {
                            Utils.safeLog(`✅ ${sheetName} فارغة وتطبيق بـ array فارغ كقيمة افتراضية آمنة`);
                        }
                    }
                }
            });
            
            return { syncedInBatch, failedInBatch };
        }
    };
    
    // تصدير للاستخدام العام
    window.SyncImprovements = SyncImprovements;
    
    // Monkey patch لدالة syncData في GoogleIntegration
    // ننتظر حتى يتم تحميل GoogleIntegration ثم نقوم بالـ patch
    document.addEventListener('DOMContentLoaded', function() {
        // استخدام setTimeout للتأكد من تحميل جميع الملفات
        setTimeout(function() {
            if (typeof GoogleIntegration !== 'undefined' && GoogleIntegration.syncData) {
                const originalSyncData = GoogleIntegration.syncData;
                
                GoogleIntegration.syncData = async function(options = {}) {
                    const {
                        silent = false,
                        showLoader = false,
                        notifyOnSuccess = !silent,
                        notifyOnError = !silent,
                        includeUsersSheet = true,
                        // ✅ دعم تحديد أوراق معينة (للاستخدام في تحديثات الموديولات بدون مزامنة كاملة)
                        sheets: requestedSheets = null
                    } = options;
                    
                    var useSupabase = AppState.useSupabaseBackend === true;
                    var hasGoogleSheets = AppState.googleConfig?.appsScript?.enabled && AppState.googleConfig?.appsScript?.scriptUrl;
                    if (!useSupabase && !hasGoogleSheets) {
                        if (!silent) {
                            Utils.safeLog('قاعدة البيانات غير متصلة (لا Supabase ولا قاعدة البيانات) - سيتم استخدام البيانات المحلية');
                            Notification.warning('قاعدة البيانات غير متصلة. يتم استخدام البيانات المحلية فقط');
                        }
                        return false;
                    }
                    
                    try {
                        const shouldLog = AppState.debugMode && !silent;
                        if (shouldLog) {
                            Utils.safeLog('🔄  تحميل قاعدة البيانات    Database loading');
                        }
                        
                        if (showLoader && typeof Loading !== 'undefined') {
                            Loading.show('جاري تحميل البيانات من قاعدة البيانات');
                        }
                        
                        // جلب قائمة الأوراق (نسخة من الكود الأصلي)
                        const baseSheets = [
                            'Users', 'Incidents', 'NearMiss', 'PTW', 'Training',
                            'ClinicVisits', 'Medications', 'SickLeave', 'Injuries', 'ClinicInventory',
                            'FireEquipment', 'FireEquipmentAssets', 'FireEquipmentInspections',
                            'PeriodicInspectionCategories', 'PeriodicInspectionRecords', 'PeriodicInspectionSchedules', 'PeriodicInspectionChecklists',
                            'PPE', 'ViolationTypes', 'Violations',
                            'Contractors', 'ApprovedContractors', 'ContractorEvaluations',
                            'ContractorApprovalRequests', 'ContractorDeletionRequests',
                            'Employees', 'BehaviorMonitoring', 'ChemicalSafety', 'DailyObservations',
                            'ISODocuments', 'ISOProcedures', 'ISOForms', 'SOPJHA', 'RiskAssessments',
                            'LegalDocuments', 'HSEAudits', 'HSENonConformities', 'HSECorrectiveActions',
                            'HSEObjectives', 'HSERiskAssessments', 'EnvironmentalAspects', 'EnvironmentalMonitoring',
                            'Sustainability', 'CarbonFootprint', 'WasteManagement', 'EnergyEfficiency',
                            'WaterManagement', 'RecyclingPrograms', 'EmergencyAlerts', 'EmergencyPlans',
                            'SafetyTeamMembers', 'SafetyOrganizationalStructure', 'SafetyJobDescriptions',
                            'SafetyTeamKPIs', 'SafetyTeamAttendance', 'SafetyTeamLeaves', 'SafetyTeamTasks',
                            'SafetyBudgets', 'SafetyBudgetTransactions', 'SafetyPerformanceKPIs',
                            'ActionTrackingRegister', 'UserActivityLog', 'Notifications'
                        ];
                        
                        // تطبيق نفس منطق التصفية من الكود الأصلي
                        let sheets = baseSheets.slice();

                        // ✅ إذا تم تحديد sheets في options، استخدمها بدلاً من baseSheets
                        if (requestedSheets && Array.isArray(requestedSheets) && requestedSheets.length > 0) {
                            sheets = requestedSheets.slice();
                            if (shouldLog) {
                                Utils.safeLog(`✅ استخدام أوراق محددة في syncData: ${sheets.join(', ')}`);
                            }
                        }
                        const sheetMapping = {
                            'Users': 'users', 'Incidents': 'incidents', 'NearMiss': 'nearmiss',
                            'PTW': 'ptw', 'Training': 'training', 'ClinicVisits': 'clinicVisits',
                            'Medications': 'medications', 'SickLeave': 'sickLeave', 'Injuries': 'injuries',
                            'ClinicInventory': 'clinicInventory', 'FireEquipment': 'fireEquipment',
                            'FireEquipmentAssets': 'fireEquipmentAssets', 'FireEquipmentInspections': 'fireEquipmentInspections',
                            'PeriodicInspectionCategories': 'periodicInspectionCategories',
                            'PeriodicInspectionRecords': 'periodicInspectionRecords',
                            'PeriodicInspectionSchedules': 'periodicInspectionSchedules',
                            'PeriodicInspectionChecklists': 'periodicInspectionChecklists',
                            'PPE': 'ppe', 'ViolationTypes': 'violationTypes', 'Violations': 'violations',
                            'Contractors': 'contractors', 'ApprovedContractors': 'approvedContractors',
                            'ContractorEvaluations': 'contractorEvaluations',
                            'ContractorApprovalRequests': 'contractorApprovalRequests',
                            'ContractorDeletionRequests': 'contractorDeletionRequests',
                            'Employees': 'employees',
                            'BehaviorMonitoring': 'behaviorMonitoring', 'ChemicalSafety': 'chemicalSafety',
                            'DailyObservations': 'dailyObservations', 'ISODocuments': 'isoDocuments',
                            'ISOProcedures': 'isoProcedures', 'ISOForms': 'isoForms',
                            'SOPJHA': 'sopJHA', 'RiskAssessments': 'riskAssessments',
                            'LegalDocuments': 'legalDocuments', 'HSEAudits': 'hseAudits',
                            'HSENonConformities': 'hseNonConformities', 'HSECorrectiveActions': 'hseCorrectiveActions',
                            'HSEObjectives': 'hseObjectives', 'HSERiskAssessments': 'hseRiskAssessments',
                            'EnvironmentalAspects': 'environmentalAspects', 'EnvironmentalMonitoring': 'environmentalMonitoring',
                            'Sustainability': 'sustainability', 'CarbonFootprint': 'carbonFootprint',
                            'WasteManagement': 'wasteManagement', 'EnergyEfficiency': 'energyEfficiency',
                            'WaterManagement': 'waterManagement', 'RecyclingPrograms': 'recyclingPrograms',
                            'EmergencyAlerts': 'emergencyAlerts', 'EmergencyPlans': 'emergencyPlans',
                            'SafetyTeamMembers': 'safetyTeamMembers',
                            'SafetyOrganizationalStructure': 'safetyOrganizationalStructure',
                            'SafetyJobDescriptions': 'safetyJobDescriptions',
                            'SafetyTeamKPIs': 'safetyTeamKPIs', 'SafetyTeamAttendance': 'safetyTeamAttendance',
                            'SafetyTeamLeaves': 'safetyTeamLeaves', 'SafetyTeamTasks': 'safetyTeamTasks',
                            'SafetyBudgets': 'safetyBudgets', 'SafetyBudgetTransactions': 'safetyBudgetTransactions',
                            'SafetyPerformanceKPIs': 'safetyPerformanceKPIs',
                            'ActionTrackingRegister': 'actionTrackingRegister',
                            'UserActivityLog': 'user_activity_log',
                            'Notifications': 'notifications'
                        };
                        
                        // تطبيق صلاحيات المستخدم (منطق مبسط)
                        if (AppState.currentUser && AppState.currentUser.role !== 'admin' && typeof Permissions !== 'undefined') {
                            const accessibleModules = Permissions.getAccessibleModules(true);
                            const moduleSheetsMap = {
                                'users': ['Users'], 'incidents': ['Incidents'], 'nearmiss': ['NearMiss'],
                                'ptw': ['PTW'], 'training': ['Training'],
                                'clinic': ['ClinicVisits', 'Medications', 'SickLeave', 'Injuries', 'ClinicInventory'],
                                'fire-equipment': ['FireEquipment', 'FireEquipmentAssets', 'FireEquipmentInspections'],
                                'periodic-inspections': ['PeriodicInspectionCategories', 'PeriodicInspectionRecords', 'PeriodicInspectionSchedules', 'PeriodicInspectionChecklists'],
                                'ppe': ['PPE'], 'violations': ['Violations', 'ViolationTypes'],
                                'contractors': ['Contractors', 'ApprovedContractors', 'ContractorEvaluations', 'ContractorApprovalRequests', 'ContractorDeletionRequests'],
                                'employees': ['Employees'], 'behavior-monitoring': ['BehaviorMonitoring'],
                                'chemical-safety': ['ChemicalSafety'], 'daily-observations': ['DailyObservations'],
                                'iso': ['ISODocuments', 'ISOProcedures', 'ISOForms', 'HSEAudits'],
                                'sop-jha': ['SOPJHA'], 'risk-assessment': ['RiskAssessments', 'HSERiskAssessments'],
                                'legal-documents': ['LegalDocuments'],
                                'sustainability': ['Sustainability', 'EnvironmentalAspects', 'EnvironmentalMonitoring', 'CarbonFootprint', 'WasteManagement', 'EnergyEfficiency', 'WaterManagement', 'RecyclingPrograms'],
                                'emergency': ['EmergencyAlerts', 'EmergencyPlans'],
                                'safety-budget': ['SafetyBudgets', 'SafetyBudgetTransactions'],
                                'safety-performance-kpis': ['SafetyPerformanceKPIs', 'SafetyTeamKPIs'],
                                'safety-health-management': ['SafetyTeamMembers', 'SafetyOrganizationalStructure', 'SafetyJobDescriptions', 'SafetyTeamKPIs', 'SafetyTeamAttendance', 'SafetyTeamLeaves', 'SafetyTeamTasks'],
                                'action-tracking': ['ActionTrackingRegister', 'HSECorrectiveActions', 'HSENonConformities', 'HSEObjectives'],
                                'users': ['Users', 'Notifications']
                            };
                            
                            const allowedSheets = new Set(includeUsersSheet ? ['Users'] : []);
                            accessibleModules.forEach(module => {
                                const moduleSheets = moduleSheetsMap[module];
                                if (Array.isArray(moduleSheets)) {
                                    moduleSheets.forEach(sheet => allowedSheets.add(sheet));
                                }
                            });
                            
                            // ✅ إصلاح: إضافة أوراق المقاولين تلقائياً عند وجود صلاحيات لمديولات تحتاجها
                            // المديولات التي تحتاج قائمة المقاولين (dropdown/select):
                            // - clinic: تسجيل تردد المقاولين بالعيادة
                            // - training: تسجيل تدريب للمقاولين
                            // - ptw: إضافة مقاولين في تصاريح العمل (teamMembers, authorizedParty)
                            // - violations: تسجيل مخالفات للمقاولين
                            const modulesNeedingContractors = ['clinic', 'training', 'ptw', 'violations'];
                            const needsContractors = modulesNeedingContractors.some(module => accessibleModules.includes(module));
                            
                            if (needsContractors && !accessibleModules.includes('contractors')) {
                                // إضافة أوراق المقاولين الأساسية فقط (بدون التقييمات وطلبات الموافقة)
                                const contractorSheets = ['Contractors', 'ApprovedContractors'];
                                contractorSheets.forEach(sheet => {
                                    // إضافة الورقة إلى sheets إذا لم تكن موجودة
                                    if (!sheets.includes(sheet)) {
                                        sheets.push(sheet);
                                    }
                                    // إضافة الورقة إلى allowedSheets
                                    allowedSheets.add(sheet);
                                });
                            }
                            
                            sheets = sheets.filter(sheet => allowedSheets.has(sheet));
                        }
                        
                        if (sheets.length === 0) {
                            if (showLoader && typeof Loading !== 'undefined') {
                                Loading.hide();
                            }
                            if (shouldLog) {
                                Utils.safeLog('❌ لا يوجد أوراق عمل للمزامنة');
                            }
                            return true;
                        }
                        
                        // ========================================
                        // البدء في المعالجة المحسّنة
                        // ========================================
                        const BATCH_SIZE = 5;
                        let syncedCount = 0;
                        const failedSheets = [];
                        
                        // عرض مؤشر التقدم
                        if (showLoader) {
                            SyncImprovements.createProgressIndicator(sheets.length);
                            // بدء التقدم من 0%
                            SyncImprovements.updateProgress(0, sheets.length);
                        }
                        
                        // معالجة الأوراق على دفعات
                        for (let i = 0; i < sheets.length; i += BATCH_SIZE) {
                            const batch = sheets.slice(i, Math.min(i + BATCH_SIZE, sheets.length));
                            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
                            const totalBatches = Math.ceil(sheets.length / BATCH_SIZE);
                            
                            if (shouldLog) {
                                Utils.safeLog(`🔄 معالجة الدفعة ${batchNumber} من ${totalBatches} (${batch.length} أوراق)`);
                            }
                            
                            // معالجة الدفعة
                            const { syncedInBatch, failedInBatch } = await SyncImprovements.processBatch(
                                batch,
                                GoogleIntegration.readFromSheets.bind(GoogleIntegration),
                                sheetMapping,
                                shouldLog
                            );
                            
                            syncedCount += syncedInBatch;
                            failedSheets.push(...failedInBatch);
                            
                            // تحديث مؤشر التقدم بعد معالجة الدفعة
                            const completedSheets = Math.min(i + batch.length, sheets.length);
                            if (showLoader) {
                                SyncImprovements.updateProgress(completedSheets, sheets.length);
                            }
                            
                            // حفظ البيانات بعد كل دفعة
                            const dm = (typeof window !== 'undefined' && window.DataManager) || 
                                       (typeof DataManager !== 'undefined' && DataManager);
                            if (dm && typeof dm.save === 'function') {
                                dm.save();
                            }
                            
                            // تأخير قصير جداً بين الدفعات (بدون تأخير ملحوظ للمستخدم)
                            if (i + BATCH_SIZE < sheets.length) {
                                await new Promise(resolve => setTimeout(resolve, 0));
                            }
                        }
                        
                        // تحديث مؤشر التقدم إلى 100% قبل الحفظ النهائي
                        if (showLoader) {
                            SyncImprovements.updateProgress(sheets.length, sheets.length);
                        }
                        
                        // التهيئة النهائية
                        if (typeof ViolationTypesManager !== 'undefined') {
                            ViolationTypesManager.ensureInitialized();
                        }
                        if (typeof PeriodicInspectionStore !== 'undefined') {
                            PeriodicInspectionStore.ensureInitialized();
                        }
                        
                        // حفظ نهائي مع انتظار اكتمال الحفظ
                        const dm = (typeof window !== 'undefined' && window.DataManager) || 
                                   (typeof DataManager !== 'undefined' && DataManager);
                        if (dm && typeof dm.save === 'function') {
                            dm.save();
                        }
                        
                        // إرسال حدث لإعلام الوحدات بتحديث الواجهة
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('syncDataCompleted', {
                                detail: { 
                                    syncedCount,
                                    failedSheets,
                                    sheets: sheets.map(s => sheetMapping[s] || s).filter(Boolean)
                                }
                            }));
                        }
                        
                        // إزالة مؤشر التقدم بعد التأكد من اكتمال الحفظ
                        if (showLoader) {
                            SyncImprovements.removeProgressIndicator();
                        }
                        
                        if (showLoader && typeof Loading !== 'undefined') {
                            Loading.hide();
                        }
                        
                        const success = failedSheets.length === 0;
                        
                        if (success) {
                            if (notifyOnSuccess && syncedCount > 0) {
                                Notification.success('  ✅ تم تحميل قاعدة البيانات  بنجاح Database loaded successfully.');
                            } else if (shouldLog) {
                                Utils.safeLog(`✅ مزامنة البيانات: ${syncedCount} ورقة تحتوي على بيانات`);
                            }
                        } else {
                            if (notifyOnError) {
                                Notification.warning(`فشل مزامنة بعض الأوراق: ${failedSheets.join(', ')}`);
                            }
                            if (shouldLog) {
                                Utils.safeWarn('⚠ الأوراق التي فشلت في المزامنة:', failedSheets);
                            }
                        }
                        
                        return success || syncedCount > 0;
                    } catch (error) {
                        if (showLoader) {
                            SyncImprovements.removeProgressIndicator();
                            if (typeof Loading !== 'undefined') {
                                Loading.hide();
                            }
                        }
                        Utils.safeError('خطأ في المزامنة:', error);
                        if (notifyOnError) {
                            Notification.error('خطأ في المزامنة مع قاعدة البيانات: ' + error.message);
                        }
                        return false;
                    }
                };
                
                Utils.safeLog('✅ تم تطبيق تحسينات المزامنة بنجاح');
            }
        }, 2000); // انتظار 2 ثانية للتأكد من تحميل جميع الملفات
    });
})();

