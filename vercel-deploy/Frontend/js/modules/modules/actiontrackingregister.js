/**
 * ActionTrackingRegister Module
 * ØªÙ… Ø§Ø³ØªØ®Ø±Ø§Ø¬Ù‡ Ù…Ù† app-modules.js
 */
// ===== Action Tracking Register Module (سجل متابعة الإجراءات) - النسخة المحسنة =====
const ActionTrackingRegister = {
    settings: null,
    currentView: 'register', // register, settings, details

    async load() {
        // التحقق من وجود التبعيات المطلوبة
        if (typeof Utils === 'undefined') {
            console.error('Utils غير متوفر!');
            return;
        }
        const section = document.getElementById('action-tracking-section');
        if (!section) {
            if (typeof Utils !== 'undefined' && Utils.safeError) {
                Utils.safeError(' قسم action-tracking-section غير موجود!');
            } else {
                console.error(' قسم action-tracking-section غير موجود!');
            }
            return;
        }

        if (typeof AppState === 'undefined') {
            // لا تترك الواجهة فارغة
            section.innerHTML = `
                <div class="content-card">
                    <div class="card-body">
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                            <p class="text-gray-500 mb-2">تعذر تحميل سجل متابعة الإجراءات</p>
                            <p class="text-sm text-gray-400">AppState غير متوفر حالياً. جرّب تحديث الصفحة.</p>
                            <button onclick="location.reload()" class="btn-primary mt-4">
                                <i class="fas fa-redo ml-2"></i>
                                تحديث الصفحة
                            </button>
                        </div>
                    </div>
                </div>
            `;
            Utils.safeError('AppState غير متوفر!');
            return;
        }

        try {
            // Skeleton فوري قبل أي عمليات render قد تكون بطيئة
            section.innerHTML = `
                <div class="section-header">
                    <div class="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 class="section-title">
                                <i class="fas fa-clipboard-list-check ml-3"></i>
                                سجل متابعة الإجراءات
                            </h1>
                            <p class="section-subtitle">جاري التحميل...</p>
                        </div>
                    </div>
                </div>
                <div class="mt-6">
                    <div class="content-card">
                        <div class="card-body">
                            <div class="empty-state">
                                <div style="width: 300px; margin: 0 auto 16px;">
                                    <div style="width: 100%; height: 6px; background: rgba(59, 130, 246, 0.2); border-radius: 3px; overflow: hidden;">
                                        <div style="height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb, #3b82f6); background-size: 200% 100%; border-radius: 3px; animation: loadingProgress 1.5s ease-in-out infinite;"></div>
                                    </div>
                                </div>
                                <p class="text-gray-500">جاري تجهيز الواجهة...</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // التأكد من وجود البيانات
            if (!AppState.appData) {
                AppState.appData = {};
            }
            if (!AppState.appData.actionTracking) {
                AppState.appData.actionTracking = [];
            }
            // تحميل الإعدادات بشكل غير متزامن (لا ننتظرها)
            // استخدام الإعدادات الافتراضية أولاً ثم تحديثها عند الحاجة
            this.settings = this.getDefaultSettings();
            this.loadSettings().catch(() => {
                // في حالة الفشل، نستخدم الإعدادات الافتراضية
                this.settings = this.getDefaultSettings();
            });

            const actionTitle = (typeof i18n !== 'undefined' && i18n.translate) ? i18n.translate('action.title') : 'سجل متابعة الإجراءات';
            const actionSubtitle = (typeof i18n !== 'undefined' && i18n.translate) ? i18n.translate('action.subtitle') : 'نظام متقدم لإدارة جميع الإجراءات التصحيحية والوقائية';

            section.innerHTML = `
            <div class="section-header">
                <div class="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 class="section-title">
                            <i class="fas fa-clipboard-list-check ml-3"></i>
                            ${actionTitle}
                        </h1>
                        <p class="section-subtitle">${actionSubtitle}</p>
                    </div>
                    <div class="flex gap-2">
                        ${this.hasSettingsPermission() ? `
                            <button id="action-settings-btn" class="btn-secondary">
                                <i class="fas fa-cog ml-2"></i>
                                الإعدادات
                            </button>
                        ` : ''}
                        <button id="add-action-btn" class="btn-primary">
                            <i class="fas fa-plus ml-2"></i>
                            إضافة إجراء جديد
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Navigation Tabs -->
            <div class="mt-6">
                <div class="action-tabs-container">
                    <button class="action-tab-btn active" data-tab="register" onclick="ActionTrackingRegister.switchView('register')">
                        <i class="fas fa-list ml-2"></i>السجل
                    </button>
                    ${this.hasSettingsPermission() ? `
                        <button class="action-tab-btn" data-tab="settings" onclick="ActionTrackingRegister.switchView('settings')">
                            <i class="fas fa-cog ml-2"></i>الإعدادات
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <div id="action-content-area" class="mt-6">
                <div class="content-card">
                    <div class="card-body">
                        <div class="empty-state">
                            <div style="width: 300px; margin: 0 auto 16px;">
                                <div style="width: 100%; height: 6px; background: rgba(59, 130, 246, 0.2); border-radius: 3px; overflow: hidden;">
                                    <div style="height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb, #3b82f6); background-size: 200% 100%; border-radius: 3px; animation: loadingProgress 1.5s ease-in-out infinite;"></div>
                                </div>
                            </div>
                            <p class="text-gray-500">جاري تحميل السجل...</p>
                        </div>
                    </div>
                </div>
            </div>
            `;

            this.setupEventListeners();
            
            // ✅ تحميل محتوى السجل الكامل فوراً بعد عرض الواجهة
            setTimeout(async () => {
                try {
                    const contentArea = document.getElementById('action-content-area');
                    if (!contentArea) return;
                    
                    // تحميل محتوى السجل الكامل
                    const registerContent = await this.renderRegister().catch(error => {
                        Utils.safeWarn('⚠️ خطأ في تحميل محتوى السجل:', error);
                        return `
                            <div class="content-card">
                                <div class="card-body">
                                    <div class="empty-state">
                                        <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                                        <p class="text-gray-500 mb-4">حدث خطأ في تحميل البيانات</p>
                                        <button onclick="ActionTrackingRegister.load()" class="btn-primary">
                                            <i class="fas fa-redo ml-2"></i>
                                            إعادة المحاولة
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    
                    contentArea.innerHTML = registerContent;
                    this.setupEventListeners();
                    
                    // تحميل البيانات بعد عرض الواجهة
                    this.loadKPIs().catch(() => {});
                    this.loadActionList().catch(() => {});
                } catch (error) {
                    Utils.safeWarn('⚠️ خطأ في تحميل السجل:', error);
                }
            }, 0);
        } catch (error) {
            Utils.safeError('❌ خطأ في تحميل مديول سجل متابعة الإجراءات:', error);
            section.innerHTML = `
                <div class="section-header">
                    <div>
                        <h1 class="section-title">
                            <i class="fas fa-clipboard-list-check ml-3"></i>
                            سجل متابعة الإجراءات
                        </h1>
                    </div>
                </div>
                <div class="mt-6">
                    <div class="content-card">
                        <div class="card-body">
                            <div class="empty-state">
                                <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                                <p class="text-gray-500 mb-2">حدث خطأ أثناء تحميل البيانات</p>
                                <p class="text-sm text-gray-400 mb-4">${error && error.message ? Utils.escapeHTML(error.message) : 'خطأ غير معروف'}</p>
                                <button onclick="ActionTrackingRegister.load()" class="btn-primary">
                                    <i class="fas fa-redo ml-2"></i>
                                    إعادة المحاولة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            if (typeof Notification !== 'undefined' && Notification.error) {
                Notification.error('حدث خطأ أثناء تحميل سجل متابعة الإجراءات. يُرجى المحاولة مرة أخرى.', { duration: 5000 });
            }
        }
    },

    isAdmin() {
        const user = AppState.currentUser;
        return user && (user.role === 'admin' || user.role === 'safety_officer');
    },

    hasSettingsPermission() {
        const user = AppState.currentUser;
        if (!user) {
            return false;
        }

        // التحقق من الدور
        const userRole = (user.role || '').toLowerCase();
        const allowedRoles = ['admin', 'safety_officer', 'manager'];
        if (allowedRoles.includes(userRole)) {
            return true;
        }

        // التحقق من الصلاحيات المخصصة
        const permissions = user.permissions || {};
        if (typeof permissions === 'string') {
            try {
                permissions = JSON.parse(permissions);
            } catch (e) {
                permissions = {};
            }
        }

        // التحقق من صلاحية 'action-tracking-settings' أو 'admin' أو 'manage-settings'
        return permissions['action-tracking-settings'] === true ||
            permissions['admin'] === true ||
            permissions['manage-settings'] === true;
    },

    async loadSettings() {
        // التحقق من تفعيل Google Integration قبل إجراء الطلبات
        if (!AppState.googleConfig?.appsScript?.enabled || !AppState.googleConfig?.appsScript?.scriptUrl) {
            this.settings = this.getDefaultSettings();
            return;
        }

        // التحقق من توفر GoogleIntegration
        if (typeof GoogleIntegration === 'undefined' || typeof GoogleIntegration.sendRequest !== 'function') {
            this.settings = this.getDefaultSettings();
            return;
        }

        try {
            const timeout = 60000; // 60 ثانية timeout
            const response = await Utils.promiseWithTimeout(
                GoogleIntegration.sendRequest({ action: 'getActionTrackingSettings', data: {} }),
                timeout,
                'انتهت مهلة الاتصال بالخادم'
            );

            if (response && response.success && response.data) {
                this.settings = response.data;
            } else {
                this.settings = this.getDefaultSettings();
            }
        } catch (error) {
            // Don't log errors for backend not enabled - just use default settings
            const errorMessage = error?.message || '';
            if (!errorMessage.includes('الاتصال بالخادم') && !errorMessage.includes('غير مفعّل') && !errorMessage.includes('انتهت مهلة الاتصال')) {
                Utils.safeWarn('خطأ في تحميل إعدادات Action Tracking:', error);
            }
            this.settings = this.getDefaultSettings();
        }
    },

    getDefaultSettings() {
        return {
            typeOfIssueList: ['Observations', 'Incidents', 'NearMiss', 'Inspections', 'ManagementReviews', 'Audits', 'Other'],
            classificationList: ['Safety Violation', 'Environmental Issue', 'Health Concern', 'Process Deviation', 'Equipment Failure', 'Training Gap', 'Documentation Issue', 'Other'],
            rootCauseList: ['Lack of Training', 'Inadequate Procedures', 'Equipment Failure', 'Human Error', 'Management System Failure', 'Environmental Factors', 'Communication Gap', 'Other'],
            typeClassificationMapping: {
                'Observations': ['Safety Violation', 'Environmental Issue', 'Health Concern', 'Process Deviation', 'Other'],
                'Incidents': ['Safety Violation', 'Equipment Failure', 'Health Concern', 'Other'],
                'NearMiss': ['Safety Violation', 'Process Deviation', 'Equipment Failure', 'Other'],
                'Inspections': ['Safety Violation', 'Equipment Failure', 'Process Deviation', 'Documentation Issue', 'Other'],
                'ManagementReviews': ['Process Deviation', 'Documentation Issue', 'Training Gap', 'Other']
            },
            classificationRootCauseMapping: {
                'Safety Violation': ['Lack of Training', 'Inadequate Procedures', 'Human Error', 'Management System Failure', 'Other'],
                'Environmental Issue': ['Inadequate Procedures', 'Equipment Failure', 'Environmental Factors', 'Other'],
                'Health Concern': ['Lack of Training', 'Inadequate Procedures', 'Environmental Factors', 'Other'],
                'Process Deviation': ['Inadequate Procedures', 'Management System Failure', 'Communication Gap', 'Other'],
                'Equipment Failure': ['Equipment Failure', 'Inadequate Procedures', 'Other'],
                'Training Gap': ['Lack of Training', 'Management System Failure', 'Other'],
                'Documentation Issue': ['Inadequate Procedures', 'Management System Failure', 'Communication Gap', 'Other']
            },
            statusList: ['Open', 'In Progress', 'Closed', 'Overdue'],
            riskRatingList: ['Low', 'Medium', 'High', 'Critical'],
            departmentList: ['Production', 'Maintenance', 'Quality', 'Safety', 'HR', 'Admin', 'Other'],
            locationList: ['Factory A', 'Factory B', 'Warehouse', 'Office', 'Other'],
            responsibleList: [],
            shiftList: ['Morning', 'Afternoon', 'Night']
        };
    },

    switchView(view, options = {}) {
        this.currentView = view;

        // التحقق من الصلاحيات قبل الوصول إلى الإعدادات
        if (view === 'settings' && !this.hasSettingsPermission()) {
            Notification.error('ليس لديك صلاحية للوصول إلى إعدادات Action Tracking. يجب أن تكون مدير النظام أو لديك صلاحية خاصة.');
            return;
        }

        // Update tab buttons
        document.querySelectorAll('.action-tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === view) {
                btn.classList.add('active');
            }
        });

        const contentArea = document.getElementById('action-content-area');
        if (!contentArea) return;

        if (view === 'register') {
            this.renderRegister().then(html => {
                contentArea.innerHTML = html;
                this.setupEventListeners();
                this.loadKPIs();
                this.loadActionList();
            });
        } else if (view === 'settings') {
            if (!this.hasSettingsPermission()) {
                Notification.error('ليس لديك صلاحية للوصول إلى الإعدادات');
                return;
            }
            this.renderSettings().then(html => {
                contentArea.innerHTML = html;
                setTimeout(() => {
                    this.setupSettingsEvents();
                }, 100);
            });
        }
    },

    async renderRegister() {
        // عرض الكروت الإحصائية فوراً بقيم افتراضية (0) حتى يتم تحميل البيانات
        const defaultKPIs = { total: 0, open: 0, inProgress: 0, closed: 0, overdue: 0 };
        
        // ✅ تحميل القائمة بشكل آمن
        let listContent = '';
        try {
            listContent = await this.renderList();
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في تحميل قائمة الإجراءات:', error);
            listContent = `
                <div class="content-card">
                    <div class="card-body">
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                            <p class="text-gray-500 mb-4">حدث خطأ في تحميل البيانات</p>
                            <button onclick="ActionTrackingRegister.load()" class="btn-primary">
                                <i class="fas fa-redo ml-2"></i>
                                إعادة المحاولة
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return `
            <!-- KPIs Cards - ثابتة من البداية -->
            <div id="action-kpis-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                ${this.renderKPIsHTML(defaultKPIs)}
            </div>
            
            <!-- Filters and Register -->
            ${listContent}
        `;
    },

    async loadKPIs() {
        const container = document.getElementById('action-kpis-container');
        if (!container) return;

        // حساب KPIs من البيانات المحلية أولاً (عرض فوري)
        const calculateKPIsFromLocal = () => {
            const actions = AppState.appData?.actionTracking || [];
            return {
                total: actions.length,
                open: actions.filter(a => a.status === 'Open' || a.status === 'مفتوح').length,
                inProgress: actions.filter(a => a.status === 'In Progress' || a.status === 'قيد التنفيذ').length,
                closed: actions.filter(a => a.status === 'Closed' || a.status === 'مكتمل').length,
                overdue: actions.filter(a => {
                    if (a.status === 'Closed' || a.status === 'مكتمل') return false;
                    if (a.dueDate) {
                        const dueDate = new Date(a.dueDate);
                        return dueDate < new Date();
                    }
                    return false;
                }).length
            };
        };

        // عرض البيانات المحلية فوراً
        const localKPIs = calculateKPIsFromLocal();
        this.renderKPIs(localKPIs);

        // التحقق من تفعيل Google Integration قبل إجراء الطلبات
        if (!AppState.googleConfig?.appsScript?.enabled || !AppState.googleConfig?.appsScript?.scriptUrl) {
            return; // البيانات المحلية معروضة بالفعل
        }

        // التحقق من توفر GoogleIntegration
        if (typeof GoogleIntegration === 'undefined' || typeof GoogleIntegration.sendRequest !== 'function') {
            return; // البيانات المحلية معروضة بالفعل
        }

        // تحديث KPIs من Backend في الخلفية (بدون تأخير العرض)
        Promise.resolve().then(async () => {
            try {
                const timeout = 30000; // تقليل timeout إلى 30 ثانية لتسريع الاستجابة
                const response = await Utils.promiseWithTimeout(
                    GoogleIntegration.sendRequest({ action: 'getActionTrackingKPIs', data: {} }),
                    timeout,
                    'انتهت مهلة الاتصال بالخادم'
                );

                if (response && response.success && response.data) {
                    const kpis = response.data;
                    const currentContainer = document.getElementById('action-kpis-container');
                    if (currentContainer) {
                        this.renderKPIs(kpis);
                    }
                }
            } catch (error) {
                // Don't log errors for backend not enabled - just use local data
                const errorMessage = error?.message || '';
                if (!errorMessage.includes('الاتصال بالخادم') && !errorMessage.includes('غير مفعّل') && !errorMessage.includes('انتهت مهلة الاتصال')) {
                    Utils.safeWarn('خطأ في تحميل KPIs:', error);
                }
                // في حالة الخطأ، البيانات المحلية معروضة بالفعل
            }
        }).catch(() => {
            // تجاهل الأخطاء - البيانات المحلية معروضة بالفعل
        });
    },

    renderKPIsHTML(kpis) {
        if (!kpis) kpis = { total: 0, open: 0, inProgress: 0, closed: 0, overdue: 0 };
        return `
            <div class="content-card" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; border: 2px solid #1e40af; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div class="flex items-center justify-between">
                    <div>
                        <p style="font-size: 14px; opacity: 0.95; color: #ffffff; margin-bottom: 8px;">إجمالي الإجراءات</p>
                        <h3 id="kpi-total" style="font-size: 32px; font-weight: bold; color: #ffffff; margin: 0;">${kpis.total || 0}</h3>
                    </div>
                    <i class="fas fa-clipboard-list" style="font-size: 48px; opacity: 0.7; color: #ffffff;"></i>
                </div>
            </div>
            <div class="content-card" style="background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); color: #ffffff; border: 2px solid #a16207; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div class="flex items-center justify-between">
                    <div>
                        <p style="font-size: 14px; opacity: 0.95; color: #ffffff; margin-bottom: 8px;">الإجراءات المفتوحة</p>
                        <h3 id="kpi-open" style="font-size: 32px; font-weight: bold; color: #ffffff; margin: 0;">${kpis.open || 0}</h3>
                    </div>
                    <i class="fas fa-folder-open" style="font-size: 48px; opacity: 0.7; color: #ffffff;"></i>
                </div>
            </div>
            <div class="content-card" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; border: 2px solid #c2410c; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div class="flex items-center justify-between">
                    <div>
                        <p style="font-size: 14px; opacity: 0.95; color: #ffffff; margin-bottom: 8px;">قيد التنفيذ</p>
                        <h3 id="kpi-inprogress" style="font-size: 32px; font-weight: bold; color: #ffffff; margin: 0;">${kpis.inProgress || 0}</h3>
                    </div>
                    <i class="fas fa-spinner" style="font-size: 48px; opacity: 0.7; color: #ffffff;"></i>
                </div>
            </div>
            <div class="content-card" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; border: 2px solid #b91c1c; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div class="flex items-center justify-between">
                    <div>
                        <p style="font-size: 14px; opacity: 0.95; color: #ffffff; margin-bottom: 8px;">الإجراءات المتأخرة</p>
                        <h3 id="kpi-overdue" style="font-size: 32px; font-weight: bold; color: #ffffff; margin: 0;">${kpis.overdue || 0}</h3>
                    </div>
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; opacity: 0.7; color: #ffffff;"></i>
                </div>
            </div>
            <div class="content-card" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; border: 2px solid #15803d; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div class="flex items-center justify-between">
                    <div>
                        <p style="font-size: 14px; opacity: 0.95; color: #ffffff; margin-bottom: 8px;">الإجراءات المكتملة</p>
                        <h3 id="kpi-closed" style="font-size: 32px; font-weight: bold; color: #ffffff; margin: 0;">${kpis.closed || 0}</h3>
                    </div>
                    <i class="fas fa-check-circle" style="font-size: 48px; opacity: 0.7; color: #ffffff;"></i>
                </div>
            </div>
        `;
    },

    renderKPIs(kpis) {
        // تحديث القيم فقط بدلاً من استبدال الكروت بالكامل
        if (!kpis) kpis = { total: 0, open: 0, inProgress: 0, closed: 0, overdue: 0 };
        
        const totalEl = document.getElementById('kpi-total');
        const openEl = document.getElementById('kpi-open');
        const inProgressEl = document.getElementById('kpi-inprogress');
        const overdueEl = document.getElementById('kpi-overdue');
        const closedEl = document.getElementById('kpi-closed');
        
        if (totalEl) totalEl.textContent = kpis.total || 0;
        if (openEl) openEl.textContent = kpis.open || 0;
        if (inProgressEl) inProgressEl.textContent = kpis.inProgress || 0;
        if (overdueEl) overdueEl.textContent = kpis.overdue || 0;
        if (closedEl) closedEl.textContent = kpis.closed || 0;
        
        // إذا لم تكن الكروت موجودة بعد، قم بإنشائها
        const container = document.getElementById('action-kpis-container');
        if (container && (!totalEl || !openEl || !inProgressEl || !overdueEl || !closedEl)) {
            container.innerHTML = this.renderKPIsHTML(kpis);
        }
    },

    async renderList() {
        const settings = this.settings || this.getDefaultSettings();
        const statusList = settings.statusList || ['Open', 'In Progress', 'Closed', 'Overdue'];
        const typeList = settings.typeOfIssueList || [];
        const riskList = settings.riskRatingList || [];
        const deptList = settings.departmentList || [];
        const responsibleList = settings.responsibleList || [];

        return `
            <div class="content-card">
                <div class="card-header">
                    <div class="flex items-center justify-between flex-wrap gap-4">
                        <h2 class="card-title"><i class="fas fa-list ml-2"></i>سجل الإجراءات</h2>
                        <div class="flex items-center gap-2 flex-wrap">
                            <input type="text" id="action-search" class="form-input" style="max-width: 250px;" placeholder="🔍 البحث...">
                            <select id="action-filter-type" class="form-input" style="max-width: 180px;">
                                <option value="">جميع الأنواع</option>
                                ${typeList.map(t => `<option value="${Utils.escapeHTML(t)}">${Utils.escapeHTML(t)}</option>`).join('')}
                            </select>
                            <select id="action-filter-classification" class="form-input" style="max-width: 180px;">
                                <option value="">جميع التصنيفات</option>
                            </select>
                            <select id="action-filter-status" class="form-input" style="max-width: 150px;">
                                <option value="">جميع الحالات</option>
                                ${statusList.map(s => `<option value="${Utils.escapeHTML(s)}">${Utils.escapeHTML(s)}</option>`).join('')}
                            </select>
                            <select id="action-filter-risk" class="form-input" style="max-width: 150px;">
                                <option value="">جميع المستويات</option>
                                ${riskList.map(r => `<option value="${Utils.escapeHTML(r)}">${Utils.escapeHTML(r)}</option>`).join('')}
                            </select>
                            <select id="action-filter-department" class="form-input" style="max-width: 150px;">
                                <option value="">جميع الأقسام</option>
                                ${deptList.map(d => `<option value="${Utils.escapeHTML(d)}">${Utils.escapeHTML(d)}</option>`).join('')}
                            </select>
                            <select id="action-filter-responsible" class="form-input" style="max-width: 150px;">
                                <option value="">جميع المسؤولين</option>
                                ${responsibleList.map(r => `<option value="${Utils.escapeHTML(r)}">${Utils.escapeHTML(r)}</option>`).join('')}
                            </select>
                            <input type="date" id="action-filter-date-from" class="form-input" style="max-width: 150px;" placeholder="من تاريخ">
                            <input type="date" id="action-filter-date-to" class="form-input" style="max-width: 150px;" placeholder="إلى تاريخ">
                            <button id="action-reset-filters" class="btn-secondary btn-sm">
                                <i class="fas fa-redo ml-1"></i>إعادة تعيين
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                        <button id="action-print-all-btn" class="btn-secondary btn-sm" title="طباعة جميع الإجراءات">
                            <i class="fas fa-print ml-1"></i>طباعة الكل
                        </button>
                        <div class="dropdown" style="position: relative;">
                            <button id="action-export-all-btn" class="btn-secondary btn-sm" title="تصدير جميع الإجراءات">
                                <i class="fas fa-file-export ml-1"></i>تصدير الكل
                                <i class="fas fa-chevron-down mr-1" style="font-size: 10px;"></i>
                            </button>
                            <div class="dropdown-menu" id="action-export-all-menu" style="position: absolute; top: 100%; right: 0; margin-top: 4px; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); min-width: 150px; z-index: 1000; display: none;">
                                <a href="#" onclick="ActionTrackingRegister.exportAllToExcel(); return false;" class="dropdown-item" style="display: block; padding: 8px 12px; color: #333; text-decoration: none; border-bottom: 1px solid #eee;">
                                    <i class="fas fa-file-excel ml-2" style="color: #1d6f42;"></i>تصدير Excel
                                </a>
                                <a href="#" onclick="ActionTrackingRegister.exportAllToPDF(); return false;" class="dropdown-item" style="display: block; padding: 8px 12px; color: #333; text-decoration: none;">
                                    <i class="fas fa-file-pdf ml-2" style="color: #dc3545;"></i>تصدير PDF
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div id="action-table-container">
                        <!-- هيكل الجدول ثابت من البداية -->
                        <div class="overflow-x-auto">
                            <table class="data-table table-header-orange">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>تاريخ الملاحظة</th>
                                        <th>نوع الملاحظة</th>
                                        <th>التصنيف</th>
                                        <th>الملاحظة / الخطر</th>
                                        <th>المسؤول</th>
                                        <th>تاريخ التنفيذ المستهدف</th>
                                        <th>الحالة</th>
                                        <th>مستوى الخطورة</th>
                                        <th>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody id="action-table-body">
                                    <tr>
                                        <td colspan="10" style="text-align: center; padding: 40px;">
                                            <div style="width: 300px; margin: 0 auto 16px;">
                                                <div style="width: 100%; height: 6px; background: rgba(59, 130, 246, 0.2); border-radius: 3px; overflow: hidden;">
                                                    <div style="height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb, #3b82f6); background-size: 200% 100%; border-radius: 3px; animation: loadingProgress 1.5s ease-in-out infinite;"></div>
                                                </div>
                                            </div>
                                            <p class="text-gray-500">جاري تحميل البيانات...</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadActionList() {
        // تحديث محتوى الجدول فقط (tbody) بدلاً من استبدال الحاوية بالكامل
        const tableBody = document.getElementById('action-table-body');
        const container = document.getElementById('action-table-container');
        
        if (!tableBody && !container) return;

        // عرض البيانات المحلية فوراً إذا كانت موجودة (بدون انتظار Backend)
        const localItems = AppState.appData.actionTracking || AppState.appData.actionTrackingRegister || [];
        if (localItems.length > 0) {
            // عرض البيانات المحلية فوراً
            this.renderActionListItems(localItems, tableBody);
        }

        // تحميل البيانات من Backend في الخلفية (بدون تأخير العرض)
        const isGoogleEnabled = AppState.googleConfig?.appsScript?.enabled && AppState.googleConfig?.appsScript?.scriptUrl;
        const isGoogleIntegrationAvailable = typeof GoogleIntegration !== 'undefined' && typeof GoogleIntegration.sendRequest === 'function';

        if (isGoogleEnabled && isGoogleIntegrationAvailable) {
            // تحميل البيانات من Backend بشكل غير متزامن (لا ننتظر)
            Promise.resolve().then(async () => {
                try {
                    const timeout = 30000; // تقليل timeout إلى 30 ثانية لتسريع الاستجابة
                    const response = await Utils.promiseWithTimeout(
                        GoogleIntegration.sendRequest({ action: 'getAllActionTracking', data: {} }),
                        timeout,
                        'انتهت مهلة الاتصال بالخادم'
                    );

                    if (response && response.success && Array.isArray(response.data)) {
                        // تحديث البيانات في AppState
                        AppState.appData.actionTracking = response.data;
                        AppState.appData.actionTrackingRegister = response.data;
                        
                        // تحديث العرض فقط إذا تغيرت البيانات
                        const currentTableBody = document.getElementById('action-table-body');
                        if (currentTableBody) {
                            this.renderActionListItems(response.data, currentTableBody);
                        }
                    }
                } catch (error) {
                    // Don't log errors for backend not enabled - just use local data
                    const errorMessage = error?.message || '';
                    if (!errorMessage.includes('الاتصال بالخادم') && !errorMessage.includes('غير مفعّل') && !errorMessage.includes('انتهت مهلة الاتصال')) {
                        Utils.safeWarn('خطأ في تحميل الإجراءات من Backend:', error);
                    }
                    // في حالة الخطأ، نستخدم البيانات المحلية (تم عرضها بالفعل)
                }
            }).catch(() => {
                // تجاهل الأخطاء - البيانات المحلية معروضة بالفعل
            });
        }

        // إذا لم تكن هناك بيانات محلية، نعرض رسالة فارغة
        if (localItems.length === 0 && (!isGoogleEnabled || !isGoogleIntegrationAvailable)) {
            this.renderActionListItems([], tableBody);
        }
    },

    renderActionListItems(items, tableBody) {
        if (!tableBody) return;
        
        const itemsToRender = items || [];

        // تحديد لون الحالة
        const getStatusColor = (status) => {
            const s = (status || '').toLowerCase();
            if (s.includes('overdue') || s.includes('متأخر')) return 'danger';
            if (s.includes('progress') || s.includes('تنفيذ') || s.includes('جاري')) return 'warning';
            if (s.includes('closed') || s.includes('مغلق') || s.includes('مكتمل')) return 'success';
            return 'info'; // Open/New
        };

        // إذا كان tbody موجوداً، قم بتحديثه فقط
        if (tableBody) {
            if (itemsToRender.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="10" style="text-align: center; padding: 40px;">
                            <i class="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
                            <p class="text-gray-500 mb-4">لا توجد إجراءات مسجلة</p>
                            <button id="add-action-empty-btn" class="btn-primary">
                                <i class="fas fa-plus ml-2"></i>
                                إضافة إجراء جديد
                            </button>
                        </td>
                    </tr>
                `;
                const addBtn = document.getElementById('add-action-empty-btn');
                if (addBtn) addBtn.addEventListener('click', () => this.showActionForm());
                return;
            }

            const filters = this.getFilters();
            const filteredItems = this.filterItems(itemsToRender, filters);

            if (filteredItems.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="10" style="text-align: center; padding: 40px;">
                            <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                            <p class="text-gray-500">لا توجد نتائج للبحث</p>
                        </td>
                    </tr>
                `;
                return;
            }

            // تحديث محتوى tbody فقط
            tableBody.innerHTML = filteredItems.map((action, index) => {
                const isOverdue = action.originalTargetDate && new Date(action.originalTargetDate) < new Date() &&
                    !(action.status || '').toLowerCase().includes('closed') &&
                    !(action.status || '').toLowerCase().includes('مغلق');
                const statusColor = isOverdue ? 'danger' : getStatusColor(action.status);
                return `
                    <tr class="${isOverdue ? 'bg-red-50' : ''}" style="${isOverdue ? 'background-color: #fef2f2;' : ''}">
                        <td>${Utils.escapeHTML(action.serialNumber || action.id || (index + 1).toString())}</td>
                        <td>${action.issueDate ? Utils.formatDate(action.issueDate) : '-'}</td>
                        <td><span class="badge badge-info">${Utils.escapeHTML(action.typeOfIssue || '')}</span></td>
                        <td><span class="badge badge-secondary">${Utils.escapeHTML(action.observationClassification || '')}</span></td>
                        <td title="${Utils.escapeHTML(action.observationIssueHazard || '')}">
                            ${Utils.escapeHTML((action.observationIssueHazard || '').substring(0, 40))}${(action.observationIssueHazard || '').length > 40 ? '...' : ''}
                        </td>
                        <td>${Utils.escapeHTML(action.responsible || '')}</td>
                        <td class="${isOverdue ? 'text-red-600 font-bold' : ''}">
                            ${action.originalTargetDate ? Utils.formatDate(action.originalTargetDate) : '-'}
                            ${isOverdue ? ' ⚠️' : ''}
                        </td>
                        <td>
                            <span class="badge badge-${statusColor}">
                                ${Utils.escapeHTML(action.status || '')}
                            </span>
                        </td>
                        <td>
                            <span class="badge badge-${(action.riskRating || '').toLowerCase() === 'critical' || (action.riskRating || '').toLowerCase() === 'high' ? 'danger' : (action.riskRating || '').toLowerCase() === 'medium' ? 'warning' : 'info'}">
                                ${Utils.escapeHTML(action.riskRating || '')}
                            </span>
                        </td>
                        <td>
                            <div class="flex gap-1">
                                <button onclick="ActionTrackingRegister.viewAction('${action.id}')" class="btn-icon btn-icon-primary" title="عرض التفاصيل">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <div class="dropdown" style="position: relative;">
                                    <button class="btn-icon btn-icon-secondary" title="طباعة وتصدير" style="position: relative;">
                                        <i class="fas fa-print"></i>
                                    </button>
                                    <div class="dropdown-menu" style="position: absolute; top: 100%; left: 0; margin-top: 4px; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); min-width: 180px; z-index: 1000; display: none;">
                                        <a href="#" onclick="ActionTrackingRegister.printAction('${action.id}'); return false;" class="dropdown-item" style="display: block; padding: 8px 12px; color: #333; text-decoration: none; border-bottom: 1px solid #eee;">
                                            <i class="fas fa-print ml-2"></i>طباعة
                                        </a>
                                        <a href="#" onclick="ActionTrackingRegister.exportActionToExcel('${action.id}'); return false;" class="dropdown-item" style="display: block; padding: 8px 12px; color: #333; text-decoration: none; border-bottom: 1px solid #eee;">
                                            <i class="fas fa-file-excel ml-2" style="color: #1d6f42;"></i>تصدير Excel
                                        </a>
                                        <a href="#" onclick="ActionTrackingRegister.exportActionToPDF('${action.id}'); return false;" class="dropdown-item" style="display: block; padding: 8px 12px; color: #333; text-decoration: none;">
                                            <i class="fas fa-file-pdf ml-2" style="color: #dc3545;"></i>تصدير PDF
                                        </a>
                                    </div>
                                </div>
                                <button onclick="ActionTrackingRegister.editEntry('${action.id}')" class="btn-icon btn-icon-info" title="تعديل">
                                    <i class="fas fa-edit"></i>
                                </button>
                                ${this.isAdmin() ? `
                                    <button onclick="ActionTrackingRegister.deleteEntry('${action.id}')" class="btn-icon btn-icon-danger" title="حذف">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            
            // إعادة ربط الأحداث للقوائم المنسدلة بعد تحديث الجدول
            // القوائم المنسدلة تستخدم onclick handlers في HTML، لذا لا حاجة لإعادة الربط
            // لكن setupEventListeners العامة ستعمل تلقائياً مع querySelectorAll
            
            return;
        }

        // إذا لم يكن tbody موجوداً، استخدم الطريقة القديمة (للتوافق مع الإصدارات السابقة)
        if (container) {
            if (items.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">لا توجد إجراءات مسجلة</p>
                        <button id="add-action-empty-btn" class="btn-primary mt-4">
                            <i class="fas fa-plus ml-2"></i>
                            إضافة إجراء جديد
                        </button>
                    </div>
                `;
                const addBtn = document.getElementById('add-action-empty-btn');
                if (addBtn) addBtn.addEventListener('click', () => this.showActionForm());
                return;
            }

            const filters = this.getFilters();
            const filteredItems = this.filterItems(items, filters);

            if (filteredItems.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">لا توجد نتائج للبحث</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="overflow-x-auto">
                    <table class="data-table table-header-orange">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>تاريخ الملاحظة</th>
                                <th>نوع الملاحظة</th>
                                <th>التصنيف</th>
                                <th>الملاحظة / الخطر</th>
                                <th>المسؤول</th>
                                <th>تاريخ التنفيذ المستهدف</th>
                                <th>الحالة</th>
                                <th>مستوى الخطورة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredItems.map((action, index) => {
                const isOverdue = action.originalTargetDate && new Date(action.originalTargetDate) < new Date() &&
                    !(action.status || '').toLowerCase().includes('closed') &&
                    !(action.status || '').toLowerCase().includes('مغلق');
                const statusColor = isOverdue ? 'danger' : getStatusColor(action.status);
                return `
                                <tr class="${isOverdue ? 'bg-red-50' : ''}" style="${isOverdue ? 'background-color: #fef2f2;' : ''}">
                                    <td>${Utils.escapeHTML(action.serialNumber || action.id || (index + 1).toString())}</td>
                                    <td>${action.issueDate ? Utils.formatDate(action.issueDate) : '-'}</td>
                                    <td><span class="badge badge-info">${Utils.escapeHTML(action.typeOfIssue || '')}</span></td>
                                    <td><span class="badge badge-secondary">${Utils.escapeHTML(action.observationClassification || '')}</span></td>
                                    <td title="${Utils.escapeHTML(action.observationIssueHazard || '')}">
                                        ${Utils.escapeHTML((action.observationIssueHazard || '').substring(0, 40))}${(action.observationIssueHazard || '').length > 40 ? '...' : ''}
                                    </td>
                                    <td>${Utils.escapeHTML(action.responsible || '')}</td>
                                    <td class="${isOverdue ? 'text-red-600 font-bold' : ''}">
                                        ${action.originalTargetDate ? Utils.formatDate(action.originalTargetDate) : '-'}
                                        ${isOverdue ? ' ⚠️' : ''}
                                    </td>
                                    <td>
                                        <span class="badge badge-${statusColor}">
                                            ${Utils.escapeHTML(action.status || '')}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge badge-${(action.riskRating || '').toLowerCase() === 'critical' || (action.riskRating || '').toLowerCase() === 'high' ? 'danger' : (action.riskRating || '').toLowerCase() === 'medium' ? 'warning' : 'info'}">
                                            ${Utils.escapeHTML(action.riskRating || '')}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="flex gap-1">
                                            <button onclick="ActionTrackingRegister.viewAction('${action.id}')" class="btn-icon btn-icon-primary" title="عرض التفاصيل">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <div class="dropdown" style="position: relative;">
                                                <button class="btn-icon btn-icon-secondary" title="طباعة وتصدير" style="position: relative;">
                                                    <i class="fas fa-print"></i>
                                                </button>
                                                <div class="dropdown-menu" style="position: absolute; top: 100%; left: 0; margin-top: 4px; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); min-width: 180px; z-index: 1000; display: none;">
                                                    <a href="#" onclick="ActionTrackingRegister.printAction('${action.id}'); return false;" class="dropdown-item" style="display: block; padding: 8px 12px; color: #333; text-decoration: none; border-bottom: 1px solid #eee;">
                                                        <i class="fas fa-print ml-2"></i>طباعة
                                                    </a>
                                                    <a href="#" onclick="ActionTrackingRegister.exportActionToExcel('${action.id}'); return false;" class="dropdown-item" style="display: block; padding: 8px 12px; color: #333; text-decoration: none; border-bottom: 1px solid #eee;">
                                                        <i class="fas fa-file-excel ml-2" style="color: #1d6f42;"></i>تصدير Excel
                                                    </a>
                                                    <a href="#" onclick="ActionTrackingRegister.exportActionToPDF('${action.id}'); return false;" class="dropdown-item" style="display: block; padding: 8px 12px; color: #333; text-decoration: none;">
                                                        <i class="fas fa-file-pdf ml-2" style="color: #dc3545;"></i>تصدير PDF
                                                    </a>
                                                </div>
                                            </div>
                                            <button onclick="ActionTrackingRegister.editEntry('${action.id}')" class="btn-icon btn-icon-info" title="تعديل">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            ${this.isAdmin() ? `
                                                <button onclick="ActionTrackingRegister.deleteEntry('${action.id}')" class="btn-icon btn-icon-danger" title="حذف">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `;
            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    },

    getFilters() {
        return {
            search: (document.getElementById('action-search')?.value || '').toLowerCase(),
            type: document.getElementById('action-filter-type')?.value || '',
            classification: document.getElementById('action-filter-classification')?.value || '',
            status: document.getElementById('action-filter-status')?.value || '',
            risk: document.getElementById('action-filter-risk')?.value || '',
            department: document.getElementById('action-filter-department')?.value || '',
            responsible: document.getElementById('action-filter-responsible')?.value || '',
            dateFrom: document.getElementById('action-filter-date-from')?.value || '',
            dateTo: document.getElementById('action-filter-date-to')?.value || ''
        };
    },

    renderAll() {
        this.loadActionList();
    },

    filterItems(items, filters) {
        return items.filter(action => {
            // البحث النصي
            const matchesSearch = !filters.search ||
                (action.observationIssueHazard || '').toLowerCase().includes(filters.search) ||
                (action.correctivePreventiveAction || '').toLowerCase().includes(filters.search) ||
                (action.responsible || '').toLowerCase().includes(filters.search) ||
                (action.observerName || '').toLowerCase().includes(filters.search) ||
                (action.id || '').toLowerCase().includes(filters.search) ||
                (action.serialNumber || '').toLowerCase().includes(filters.search);

            // الفلاتر
            const matchesType = !filters.type || (action.typeOfIssue || '') === filters.type;
            const matchesClassification = !filters.classification || (action.observationClassification || '') === filters.classification;
            const matchesStatus = !filters.status || (action.status || '') === filters.status;
            const matchesRisk = !filters.risk || (action.riskRating || '') === filters.risk;
            const matchesDepartment = !filters.department || (action.department || '') === filters.department;
            const matchesResponsible = !filters.responsible || (action.responsible || '') === filters.responsible;

            // فلتر التاريخ
            let matchesDate = true;
            if (filters.dateFrom || filters.dateTo) {
                const issueDate = action.issueDate ? new Date(action.issueDate) : null;
                if (filters.dateFrom && issueDate) {
                    const fromDate = new Date(filters.dateFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    if (issueDate < fromDate) matchesDate = false;
                }
                if (filters.dateTo && issueDate) {
                    const toDate = new Date(filters.dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (issueDate > toDate) matchesDate = false;
                }
            }

            return matchesSearch && matchesType && matchesClassification && matchesStatus &&
                matchesRisk && matchesDepartment && matchesResponsible && matchesDate;
        });
    },

    setupEventListeners() {
        setTimeout(() => {
            const addBtn = document.getElementById('add-action-btn');
            if (addBtn) addBtn.addEventListener('click', () => this.showActionForm());

            const settingsBtn = document.getElementById('action-settings-btn');
            if (settingsBtn) settingsBtn.addEventListener('click', () => this.switchView('settings'));

            // البحث والفلاتر
            const searchInput = document.getElementById('action-search');
            if (searchInput) {
                searchInput.addEventListener('input', () => this.loadActionList());
            }

            const typeFilter = document.getElementById('action-filter-type');
            if (typeFilter) {
                typeFilter.addEventListener('change', () => {
                    this.updateClassificationFilter();
                    this.loadActionList();
                });
            }

            const classificationFilter = document.getElementById('action-filter-classification');
            if (classificationFilter) {
                classificationFilter.addEventListener('change', () => {
                    this.updateRootCauseFilter();
                    this.loadActionList();
                });
            }

            const statusFilter = document.getElementById('action-filter-status');
            if (statusFilter) {
                statusFilter.addEventListener('change', () => this.loadActionList());
            }

            const riskFilter = document.getElementById('action-filter-risk');
            if (riskFilter) {
                riskFilter.addEventListener('change', () => this.loadActionList());
            }

            const deptFilter = document.getElementById('action-filter-department');
            if (deptFilter) {
                deptFilter.addEventListener('change', () => this.loadActionList());
            }

            const responsibleFilter = document.getElementById('action-filter-responsible');
            if (responsibleFilter) {
                responsibleFilter.addEventListener('change', () => this.loadActionList());
            }

            const dateFromFilter = document.getElementById('action-filter-date-from');
            if (dateFromFilter) {
                dateFromFilter.addEventListener('change', () => this.loadActionList());
            }

            const dateToFilter = document.getElementById('action-filter-date-to');
            if (dateToFilter) {
                dateToFilter.addEventListener('change', () => this.loadActionList());
            }

            const resetFiltersBtn = document.getElementById('action-reset-filters');
            if (resetFiltersBtn) {
                resetFiltersBtn.addEventListener('click', () => this.resetFilters());
            }

            // أزرار الطباعة والتصدير
            const printAllBtn = document.getElementById('action-print-all-btn');
            if (printAllBtn) {
                printAllBtn.addEventListener('click', () => this.printAllActions());
            }

            const exportAllBtn = document.getElementById('action-export-all-btn');
            const exportAllMenu = document.getElementById('action-export-all-menu');
            if (exportAllBtn && exportAllMenu) {
                exportAllBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isVisible = exportAllMenu.style.display === 'block';
                    exportAllMenu.style.display = isVisible ? 'none' : 'block';
                });

                // إخفاء القائمة عند النقر خارجها
                document.addEventListener('click', (e) => {
                    if (!exportAllBtn.contains(e.target) && !exportAllMenu.contains(e.target)) {
                        exportAllMenu.style.display = 'none';
                    }
                });
            }

            // إضافة event listeners للقوائم المنسدلة في الجدول
            document.querySelectorAll('.dropdown > button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const menu = btn.nextElementSibling;
                    if (menu && menu.classList.contains('dropdown-menu')) {
                        const isVisible = menu.style.display === 'block';
                        // إخفاء جميع القوائم الأخرى
                        document.querySelectorAll('.dropdown-menu').forEach(m => {
                            if (m !== menu) m.style.display = 'none';
                        });
                        menu.style.display = isVisible ? 'none' : 'block';
                    }
                });
            });

            // إخفاء القوائم المنسدلة عند النقر خارجها
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.dropdown')) {
                    document.querySelectorAll('.dropdown-menu').forEach(menu => {
                        menu.style.display = 'none';
                    });
                }
            });
        }, 100);
    },

    updateClassificationFilter() {
        const typeFilter = document.getElementById('action-filter-type');
        const classificationFilter = document.getElementById('action-filter-classification');

        if (!typeFilter || !classificationFilter) return;

        const selectedType = typeFilter.value;
        const settings = this.settings || this.getDefaultSettings();
        const mapping = settings.typeClassificationMapping || {};

        // تفريغ القائمة
        classificationFilter.innerHTML = '<option value="">جميع التصنيفات</option>';
        classificationFilter.disabled = !selectedType;

        if (selectedType && mapping[selectedType]) {
            mapping[selectedType].forEach(classification => {
                const option = document.createElement('option');
                option.value = classification;
                option.textContent = classification;
                classificationFilter.appendChild(option);
            });
        } else if (selectedType) {
            // إذا لم يكن هناك mapping، نعرض جميع التصنيفات
            const allClassifications = settings.classificationList || [];
            allClassifications.forEach(classification => {
                const option = document.createElement('option');
                option.value = classification;
                option.textContent = classification;
                classificationFilter.appendChild(option);
            });
        }
    },

    updateRootCauseFilter() {
        // هذه الدالة ستستخدم في النموذج عند اختيار التصنيف
    },

    resetFilters() {
        document.getElementById('action-search').value = '';
        document.getElementById('action-filter-type').value = '';
        document.getElementById('action-filter-classification').value = '';
        document.getElementById('action-filter-classification').disabled = true;
        document.getElementById('action-filter-status').value = '';
        document.getElementById('action-filter-risk').value = '';
        document.getElementById('action-filter-department').value = '';
        document.getElementById('action-filter-responsible').value = '';
        document.getElementById('action-filter-date-from').value = '';
        document.getElementById('action-filter-date-to').value = '';
        this.loadActionList();
    },

    async showActionForm(actionData = null) {
        const isEdit = !!actionData;
        const settings = this.settings || this.getDefaultSettings();
        const typeList = settings.typeOfIssueList || [];
        const statusList = settings.statusList || [];
        const riskList = settings.riskRatingList || [];
        const deptList = settings.departmentList || [];
        const locationList = settings.locationList || [];
        const responsibleList = settings.responsibleList || [];
        const shiftList = settings.shiftList || [];

        const currentType = actionData?.typeOfIssue || '';
        const currentClassification = actionData?.observationClassification || '';
        const currentRootCause = actionData?.rootCause || '';

        const availableClassifications = currentType && settings.typeClassificationMapping?.[currentType]
            ? settings.typeClassificationMapping[currentType]
            : settings.classificationList || [];

        const availableRootCauses = currentClassification && settings.classificationRootCauseMapping?.[currentClassification]
            ? settings.classificationRootCauseMapping[currentClassification]
            : settings.rootCauseList || [];

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2 class="modal-title">${isEdit ? 'تعديل إجراء' : 'إضافة إجراء جديد'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="action-form" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2"># (تسلسل تلقائي)</label>
                                <input type="text" id="action-serial" class="form-input" value="${actionData?.serialNumber || 'سيتم التوليد تلقائياً'}" disabled>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">تاريخ الملاحظة *</label>
                                <input type="date" id="action-issue-date" required class="form-input"
                                    value="${actionData?.issueDate ? (new Date(actionData.issueDate).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]}">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">نوع الملاحظة *</label>
                                <select id="action-type-of-issue" required class="form-input">
                                    <option value="">اختر نوع الملاحظة</option>
                                    ${typeList.map(t => `<option value="${Utils.escapeHTML(t)}" ${currentType === t ? 'selected' : ''}>${Utils.escapeHTML(t)}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label for="action-classification" class="block text-sm font-semibold text-gray-700 mb-2">تصنيف المخالفة *</label>
                                <select id="action-classification" required class="form-input" ${!currentType ? 'disabled' : ''}>
                                    <option value="">${currentType ? 'اختر التصنيف' : 'اختر نوع الملاحظة أولاً'}</option>
                                    ${availableClassifications.map(c => `<option value="${Utils.escapeHTML(c)}" ${currentClassification === c ? 'selected' : ''}>${Utils.escapeHTML(c)}</option>`).join('')}
                                </select>
                            </div>
                            <div class="col-span-2">
                                <label for="action-observation-issue-hazard" class="block text-sm font-semibold text-gray-700 mb-2">الملاحظة / الخطر *</label>
                                <textarea id="action-observation-issue-hazard" required class="form-input" rows="3" 
                                    placeholder="وصف الملاحظة أو الخطر...">${Utils.escapeHTML(actionData?.observationIssueHazard || '')}</textarea>
                            </div>
                            <div class="col-span-2">
                                <label for="action-corrective-preventive" class="block text-sm font-semibold text-gray-700 mb-2">الإجراء التصحيحي أو الوقائي *</label>
                                <textarea id="action-corrective-preventive" required class="form-input" rows="3" 
                                    placeholder="وصف الإجراء التصحيحي أو الوقائي...">${Utils.escapeHTML(actionData?.correctivePreventiveAction || '')}</textarea>
                            </div>
                            <div>
                                <label for="action-root-cause" class="block text-sm font-semibold text-gray-700 mb-2">السبب الجذري *</label>
                                <select id="action-root-cause" required class="form-input" ${!currentClassification ? 'disabled' : ''}>
                                    <option value="">${currentClassification ? 'اختر السبب الجذري' : 'اختر التصنيف أولاً'}</option>
                                    ${availableRootCauses.map(r => `<option value="${Utils.escapeHTML(r)}" ${currentRootCause === r ? 'selected' : ''}>${Utils.escapeHTML(r)}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">القسم التابع *</label>
                                <select id="action-department" required class="form-input">
                                    <option value="">اختر القسم</option>
                                    ${deptList.map(d => `<option value="${Utils.escapeHTML(d)}" ${actionData?.department === d ? 'selected' : ''}>${Utils.escapeHTML(d)}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الموقع بالمصنع *</label>
                                <select id="action-location" required class="form-input">
                                    <option value="">اختر الموقع</option>
                                    ${locationList.map(l => `<option value="${Utils.escapeHTML(l)}" ${actionData?.location === l ? 'selected' : ''}>${Utils.escapeHTML(l)}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">معدل الخطورة *</label>
                                <select id="action-risk-rating" required class="form-input">
                                    <option value="">اختر مستوى الخطورة</option>
                                    ${riskList.map(r => `<option value="${Utils.escapeHTML(r)}" ${actionData?.riskRating === r ? 'selected' : ''}>${Utils.escapeHTML(r)}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">المسؤول عن التنفيذ *</label>
                                ${responsibleList.length > 0 ? `
                                    <select id="action-responsible" required class="form-input">
                                        <option value="">اختر المسؤول</option>
                                        ${responsibleList.map(r => `<option value="${Utils.escapeHTML(r)}" ${actionData?.responsible === r ? 'selected' : ''}>${Utils.escapeHTML(r)}</option>`).join('')}
                                    </select>
                                ` : `
                                    <input type="text" id="action-responsible" required class="form-input"
                                        value="${Utils.escapeHTML(actionData?.responsible || '')}" placeholder="أدخل اسم المسؤول">
                                `}
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">تاريخ التنفيذ المستهدف *</label>
                                <input type="date" id="action-target-date" required class="form-input"
                                    value="${actionData?.originalTargetDate ? (new Date(actionData.originalTargetDate).toISOString().split('T')[0]) : ''}">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الحالة *</label>
                                <select id="action-status" required class="form-input">
                                    <option value="">اختر الحالة</option>
                                    ${statusList.map(s => `<option value="${Utils.escapeHTML(s)}" ${actionData?.status === s ? 'selected' : ''}>${Utils.escapeHTML(s)}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">اسم صاحب الملاحظة *</label>
                                <input type="text" id="action-observer-name" required class="form-input"
                                    value="${Utils.escapeHTML(actionData?.observerName || '')}" placeholder="اسم صاحب الملاحظة">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الوردية</label>
                                <select id="action-shift" class="form-input">
                                    <option value="">اختر الوردية</option>
                                    ${shiftList.map(s => `<option value="${Utils.escapeHTML(s)}" ${actionData?.shift === s ? 'selected' : ''}>${Utils.escapeHTML(s)}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="flex items-center justify-end gap-4 pt-4 border-t">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save ml-2"></i>${isEdit ? 'حفظ التعديلات' : 'إضافة الإجراء'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // إعداد الفلاتر الذكية
        const typeSelect = modal.querySelector('#action-type-of-issue');
        const classificationSelect = modal.querySelector('#action-classification');
        const rootCauseSelect = modal.querySelector('#action-root-cause');

        if (typeSelect && classificationSelect) {
            typeSelect.addEventListener('change', () => {
                const selectedType = typeSelect.value;
                const mapping = settings.typeClassificationMapping || {};
                const available = selectedType && mapping[selectedType] ? mapping[selectedType] : settings.classificationList || [];

                classificationSelect.innerHTML = '<option value="">اختر التصنيف</option>';
                classificationSelect.disabled = !selectedType;

                available.forEach(c => {
                    const option = document.createElement('option');
                    option.value = c;
                    option.textContent = c;
                    classificationSelect.appendChild(option);
                });

                if (rootCauseSelect) {
                    rootCauseSelect.innerHTML = '<option value="">اختر التصنيف أولاً</option>';
                    rootCauseSelect.disabled = true;
                }
            });
        }

        if (classificationSelect && rootCauseSelect) {
            classificationSelect.addEventListener('change', () => {
                const selectedClassification = classificationSelect.value;
                const mapping = settings.classificationRootCauseMapping || {};
                const available = selectedClassification && mapping[selectedClassification]
                    ? mapping[selectedClassification]
                    : settings.rootCauseList || [];

                rootCauseSelect.innerHTML = '<option value="">اختر السبب الجذري</option>';
                rootCauseSelect.disabled = !selectedClassification;

                available.forEach(r => {
                    const option = document.createElement('option');
                    option.value = r;
                    option.textContent = r;
                    rootCauseSelect.appendChild(option);
                });
            });
        }

        const form = modal.querySelector('#action-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit(e, actionData, modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async handleSubmit(e, actionData, modal) {
        e.preventDefault();

        try {
            // التحقق من الحقول المطلوبة
            const issueDate = document.getElementById('action-issue-date')?.value;
            const typeOfIssue = document.getElementById('action-type-of-issue')?.value;
            const classification = document.getElementById('action-classification')?.value;
            const observationIssueHazard = document.getElementById('action-observation-issue-hazard')?.value.trim();
            const correctivePreventive = document.getElementById('action-corrective-preventive')?.value.trim();
            const rootCause = document.getElementById('action-root-cause')?.value;
            const department = document.getElementById('action-department')?.value;
            const location = document.getElementById('action-location')?.value;
            const riskRating = document.getElementById('action-risk-rating')?.value;
            const targetDate = document.getElementById('action-target-date')?.value;
            const status = document.getElementById('action-status')?.value;
            const observerName = document.getElementById('action-observer-name')?.value.trim();

            const responsibleEl = document.getElementById('action-responsible');
            if (!responsibleEl) {
                throw new Error('حقل المسؤول غير موجود');
            }
            const responsible = responsibleEl.tagName === 'SELECT' ? responsibleEl.value : responsibleEl.value.trim();

            const shiftEl = document.getElementById('action-shift');
            const shift = shiftEl ? shiftEl.value : '';

            // التحقق من الحقول المطلوبة
            if (!issueDate || !typeOfIssue || !classification || !observationIssueHazard ||
                !correctivePreventive || !rootCause || !department || !location ||
                !riskRating || !responsible || !targetDate || !status || !observerName) {
                Notification.error('يرجى ملء جميع الحقول المطلوبة');
                return;
            }

            const formData = {
                id: actionData?.id || 'ATR-' + Date.now().toString(36).toUpperCase(),
                serialNumber: actionData?.serialNumber || '',
                issueDate: issueDate,
                typeOfIssue: typeOfIssue,
                observationClassification: classification,
                observationIssueHazard: observationIssueHazard,
                correctivePreventiveAction: correctivePreventive,
                rootCause: rootCause,
                department: department,
                location: location,
                riskRating: riskRating,
                responsible: responsible,
                originalTargetDate: targetDate,
                status: status,
                observerName: observerName,
                shift: shift,
                createdAt: actionData?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: AppState.currentUser?.name || 'System',
                updatedBy: AppState.currentUser?.name || 'System'
            };

            // توليد رقم تسلسلي إذا كان جديداً
            if (!actionData || !actionData.serialNumber) {
                try {
                    const allActionsResponse = await GoogleIntegration.callBackend('getAllActionTracking', {});
                    const allActions = allActionsResponse.success ? (allActionsResponse.data || []) : (AppState.appData.actionTrackingRegister || []);
                    formData.serialNumber = (allActions.length + 1).toString();
                } catch (error) {
                    const allActions = AppState.appData.actionTrackingRegister || [];
                    formData.serialNumber = (allActions.length + 1).toString();
                }
            }

            Loading.show();
            try {
                let result;
                if (actionData) {
                    result = await GoogleIntegration.callBackend('updateActionTracking', {
                        actionId: actionData.id,
                        updateData: {
                            ...formData,
                            updateNote: 'تم تحديث الإجراء',
                            updatedBy: AppState.currentUser?.name || 'System'
                        }
                    });
                } else {
                    result = await GoogleIntegration.callBackend('addActionTracking', formData);
                }

                if (result.success) {
                    // 1. حفظ البيانات فوراً في الذاكرة
                    if (actionData) {
                        const index = AppState.appData.actionTrackingRegister.findIndex(a => a.id === actionData.id);
                        if (index !== -1) {
                            AppState.appData.actionTrackingRegister[index] = { ...actionData, ...formData };
                        }
                    } else {
                        AppState.appData.actionTrackingRegister.push(formData);
                    }
                    
                    // حفظ البيانات باستخدام window.DataManager
                    if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                        window.DataManager.save();
                    } else {
                        Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
                    }

                    // 2. إغلاق النموذج فوراً بعد الحفظ في الذاكرة
                    modal.remove();
                    
                    // 3. عرض رسالة نجاح فورية
                    Notification.success(`تم ${actionData ? 'تحديث' : 'إضافة'} الإجراء بنجاح`);
                    
                    // 4. تحديث القائمة فوراً
                    this.load();
                } else {
                    throw new Error(result.message || 'حدث خطأ أثناء الحفظ');
                }
            } catch (error) {
                Notification.error('حدث خطأ: ' + (error.message || error));
            } finally {
                Loading.hide();
            }
        } catch (error) {
            Loading.hide();
            Notification.error('حدث خطأ في التحقق من البيانات: ' + (error.message || error));
        }
    },

    async editEntry(id) {
        // محاولة تحميل البيانات من Backend أولاً
        try {
            const response = await GoogleIntegration.callBackend('getActionTracking', { actionId: id });
            if (response.success && response.data) {
                const index = AppState.appData.actionTrackingRegister.findIndex(a => a.id === id);
                if (index !== -1) {
                    AppState.appData.actionTrackingRegister[index] = response.data;
                } else {
                    AppState.appData.actionTrackingRegister.push(response.data);
                }
            }
        } catch (error) {
            Utils.safeWarn('خطأ في تحميل بيانات الإجراء:', error);
        }

        const action = AppState.appData.actionTrackingRegister.find(a => a.id === id);
        if (!action) {
            Notification.error('لم يتم العثور على الإجراء');
            return;
        }
        await this.showActionForm(action);
    },

    async deleteEntry(id) {
        if (!confirm('هل أنت متأكد من حذف هذا الإجراء؟')) return;

        Loading.show();
        try {
            const result = await GoogleIntegration.callBackend('deleteActionTracking', { actionId: id });

            if (result.success) {
                AppState.appData.actionTrackingRegister = AppState.appData.actionTrackingRegister.filter(a => a.id !== id);
                // حفظ البيانات باستخدام window.DataManager
        if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
            window.DataManager.save();
        } else {
            Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
        }
                Notification.success('تم حذف الإجراء بنجاح');
                await this.load();
            } else {
                throw new Error(result.message || 'حدث خطأ أثناء الحذف');
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + (error.message || error));
        } finally {
            Loading.hide();
        }
    },

    async viewAction(id) {
        // محاولة تحميل البيانات من Backend
        try {
            const response = await GoogleIntegration.callBackend('getActionTracking', { actionId: id });
            if (response.success && response.data) {
                const index = AppState.appData.actionTrackingRegister.findIndex(a => a.id === id);
                if (index !== -1) {
                    AppState.appData.actionTrackingRegister[index] = response.data;
                } else {
                    AppState.appData.actionTrackingRegister.push(response.data);
                }
            }
        } catch (error) {
            Utils.safeWarn('خطأ في تحميل تفاصيل الإجراء:', error);
        }

        const action = AppState.appData.actionTrackingRegister.find(a => a.id === id);
        if (!action) {
            Notification.error('لم يتم العثور على الإجراء');
            return;
        }

        // تحليل السجل الزمني والتحديثات والتعليقات
        let timeLog = [];
        let updates = [];
        let comments = [];

        try {
            if (action.timeLog) {
                timeLog = typeof action.timeLog === 'string' ? JSON.parse(action.timeLog) : action.timeLog;
            }
        } catch (e) {
            timeLog = [];
        }

        try {
            if (action.updates) {
                updates = typeof action.updates === 'string' ? JSON.parse(action.updates) : action.updates;
            }
        } catch (e) {
            updates = [];
        }

        try {
            if (action.comments) {
                comments = typeof action.comments === 'string' ? JSON.parse(action.comments) : action.comments;
            }
        } catch (e) {
            comments = [];
        }

        const isOverdue = action.originalTargetDate && new Date(action.originalTargetDate) < new Date() &&
            !(action.status || '').toLowerCase().includes('closed') &&
            !(action.status || '').toLowerCase().includes('مغلق');

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 95vw; width: 1400px; max-height: 95vh; overflow-y: auto; background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; background: #f9fafb;">
                    <h2 class="modal-title" style="font-size: 24px; font-weight: 600; color: #111827; margin: 0;">
                        <i class="fas fa-clipboard-list-check ml-2"></i>
                        تفاصيل الإجراء #${Utils.escapeHTML(action.serialNumber || action.id || '')}
                    </h2>
                    <div class="flex gap-2">
                        <button onclick="ActionTrackingRegister.printAction('${action.id}');" class="btn-secondary btn-sm" title="طباعة">
                            <i class="fas fa-print ml-1"></i>
                            طباعة
                        </button>
                        <div class="dropdown" style="position: relative;">
                            <button class="btn-secondary btn-sm" title="تصدير">
                                <i class="fas fa-file-export ml-1"></i>
                                تصدير
                                <i class="fas fa-chevron-down mr-1" style="font-size: 10px;"></i>
                            </button>
                            <div class="dropdown-menu" style="position: absolute; top: 100%; left: 0; margin-top: 4px; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); min-width: 150px; z-index: 10000; display: none;">
                                <a href="#" onclick="ActionTrackingRegister.exportActionToExcel('${action.id}'); return false;" class="dropdown-item" style="display: block; padding: 8px 12px; color: #333; text-decoration: none; border-bottom: 1px solid #eee;">
                                    <i class="fas fa-file-excel ml-2" style="color: #1d6f42;"></i>Excel
                                </a>
                                <a href="#" onclick="ActionTrackingRegister.exportActionToPDF('${action.id}'); return false;" class="dropdown-item" style="display: block; padding: 8px 12px; color: #333; text-decoration: none;">
                                    <i class="fas fa-file-pdf ml-2" style="color: #dc3545;"></i>PDF
                                </a>
                            </div>
                        </div>
                        ${AppState.currentUser && (AppState.currentUser.role === 'admin' || AppState.currentUser.role === 'system-manager') ? `
                        <button onclick="if(confirm('هل أنت متأكد من حذف هذا الإجراء؟')) { ActionTrackingRegister.deleteEntry('${action.id}'); this.closest('.modal-overlay').remove(); }" class="btn-danger btn-sm" title="حذف">
                            <i class="fas fa-trash ml-1"></i>
                            حذف
                        </button>
                        ` : ''}
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="background: transparent; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="modal-body" style="padding: 30px;">
                    <div class="space-y-6">
                        <!-- معلومات أساسية -->
                        <div class="content-card">
                            <h3 class="text-lg font-semibold mb-4"><i class="fas fa-info-circle ml-2"></i>المعلومات الأساسية</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="text-sm font-semibold text-gray-600"># (التسلسل):</label>
                                    <p class="text-gray-800">${Utils.escapeHTML(action.serialNumber || action.id || '')}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">تاريخ الملاحظة:</label>
                                    <p class="text-gray-800">${action.issueDate ? Utils.formatDate(action.issueDate) : '-'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">نوع الملاحظة:</label>
                                    <p class="text-gray-800"><span class="badge badge-info">${Utils.escapeHTML(action.typeOfIssue || '')}</span></p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">تصنيف المخالفة:</label>
                                    <p class="text-gray-800"><span class="badge badge-secondary">${Utils.escapeHTML(action.observationClassification || '')}</span></p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">السبب الجذري:</label>
                                    <p class="text-gray-800">${Utils.escapeHTML(action.rootCause || '')}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">القسم التابع:</label>
                                    <p class="text-gray-800">${Utils.escapeHTML(action.department || '')}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">الموقع:</label>
                                    <p class="text-gray-800">${Utils.escapeHTML(action.location || '')}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">معدل الخطورة:</label>
                                    <p class="text-gray-800">
                                        <span class="badge badge-${(action.riskRating || '').toLowerCase() === 'critical' || (action.riskRating || '').toLowerCase() === 'high' ? 'danger' : (action.riskRating || '').toLowerCase() === 'medium' ? 'warning' : 'info'}">
                                            ${Utils.escapeHTML(action.riskRating || '')}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">المسؤول عن التنفيذ:</label>
                                    <p class="text-gray-800">${Utils.escapeHTML(action.responsible || '')}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">تاريخ التنفيذ المستهدف:</label>
                                    <p class="text-gray-800 ${isOverdue ? 'text-red-600 font-bold' : ''}">
                                        ${action.originalTargetDate ? Utils.formatDate(action.originalTargetDate) : '-'}
                                        ${isOverdue ? ' ⚠️ متأخر' : ''}
                                    </p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">الحالة:</label>
                                    <p class="text-gray-800">
                                        <span class="badge badge-${isOverdue ? 'danger' : (action.status || '').toLowerCase().includes('progress') || (action.status || '').toLowerCase().includes('تنفيذ') ? 'warning' : (action.status || '').toLowerCase().includes('closed') || (action.status || '').toLowerCase().includes('مغلق') ? 'success' : 'info'}">
                                            ${Utils.escapeHTML(action.status || '')}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">اسم صاحب الملاحظة:</label>
                                    <p class="text-gray-800">${Utils.escapeHTML(action.observerName || '')}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">الوردية:</label>
                                    <p class="text-gray-800">${Utils.escapeHTML(action.shift || '')}</p>
                                </div>
                            </div>
                            <div class="mt-4">
                                <label class="text-sm font-semibold text-gray-600">الملاحظة / الخطر:</label>
                                <p class="text-gray-800 bg-gray-50 p-3 rounded">${Utils.escapeHTML(action.observationIssueHazard || '')}</p>
                            </div>
                            <div class="mt-4">
                                <label class="text-sm font-semibold text-gray-600">الإجراء التصحيحي أو الوقائي:</label>
                                <p class="text-gray-800 bg-gray-50 p-3 rounded">${Utils.escapeHTML(action.correctivePreventiveAction || '')}</p>
                            </div>
                        </div>
                        
                        <!-- التحديثات -->
                        <div class="content-card">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-semibold"><i class="fas fa-sync-alt ml-2"></i>التحديثات (${updates.length})</h3>
                                <button class="btn-primary btn-sm" onclick="ActionTrackingRegister.showAddUpdateModal('${action.id}')">
                                    <i class="fas fa-plus ml-1"></i>إضافة تحديث
                                </button>
                            </div>
                            ${updates.length > 0 ? `
                                <div class="space-y-3">
                                    ${updates.map(update => `
                                        <div class="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded">
                                            <div class="flex items-center justify-between">
                                                <span class="text-sm font-semibold">${Utils.escapeHTML(update.user || '')}</span>
                                                <span class="text-xs text-gray-500">${update.timestamp ? Utils.formatDate(update.timestamp) : ''}</span>
                                            </div>
                                            <p class="text-sm text-gray-700 mt-1">${Utils.escapeHTML(update.update || '')}</p>
                                            ${update.progress !== undefined ? `
                                                <div class="mt-2">
                                                    <div class="flex items-center justify-between text-xs mb-1">
                                                        <span>التقدم</span>
                                                        <span>${update.progress}%</span>
                                                    </div>
                                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                                        <div class="bg-blue-500 h-2 rounded-full" style="width: ${update.progress}%"></div>
                                                    </div>
                                                </div>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p class="text-gray-500 text-sm">لا توجد تحديثات</p>'}
                        </div>
                        
                        <!-- التعليقات -->
                        <div class="content-card">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-semibold"><i class="fas fa-comments ml-2"></i>التعليقات (${comments.length})</h3>
                                <button class="btn-primary btn-sm" onclick="ActionTrackingRegister.showAddCommentModal('${action.id}')">
                                    <i class="fas fa-plus ml-1"></i>إضافة تعليق
                                </button>
                            </div>
                            ${comments.length > 0 ? `
                                <div class="space-y-3">
                                    ${comments.map(comment => `
                                        <div class="border-l-4 border-green-500 pl-4 py-2 bg-gray-50 rounded">
                                            <div class="flex items-center justify-between">
                                                <span class="text-sm font-semibold">${Utils.escapeHTML(comment.user || '')}</span>
                                                <span class="text-xs text-gray-500">${comment.timestamp ? Utils.formatDate(comment.timestamp) : ''}</span>
                                            </div>
                                            <p class="text-sm text-gray-700 mt-1">${Utils.escapeHTML(comment.comment || '')}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p class="text-gray-500 text-sm">لا توجد تعليقات</p>'}
                        </div>
                        
                        <!-- السجل الزمني -->
                        <div class="content-card">
                            <h3 class="text-lg font-semibold mb-4"><i class="fas fa-history ml-2"></i>السجل الزمني</h3>
                            ${timeLog.length > 0 ? `
                                <div class="space-y-2">
                                    ${timeLog.map(log => `
                                        <div class="flex items-start gap-3 p-3 bg-gray-50 rounded">
                                            <i class="fas fa-circle text-xs text-blue-500 mt-1"></i>
                                            <div class="flex-1">
                                                <div class="flex items-center justify-between">
                                                    <span class="text-sm font-semibold">${Utils.escapeHTML(log.user || '')}</span>
                                                    <span class="text-xs text-gray-500">${log.timestamp ? Utils.formatDate(log.timestamp) : ''}</span>
                                                </div>
                                                <p class="text-sm text-gray-700 mt-1">${Utils.escapeHTML(log.note || '')}</p>
                                                ${log.action === 'status_changed' && log.oldStatus && log.newStatus ? `
                                                    <p class="text-xs text-gray-500 mt-1">
                                                        من: <span class="badge badge-secondary">${Utils.escapeHTML(log.oldStatus)}</span>
                                                        إلى: <span class="badge badge-info">${Utils.escapeHTML(log.newStatus)}</span>
                                                    </p>
                                                ` : ''}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p class="text-gray-500 text-sm">لا يوجد سجل زمني</p>'}
                        </div>
                        
                        <div class="flex items-center justify-end gap-4 pt-4 border-t">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إغلاق</button>
                            <button type="button" class="btn-primary" onclick="ActionTrackingRegister.editEntry('${action.id}'); this.closest('.modal-overlay').remove();">
                                <i class="fas fa-edit ml-2"></i>تعديل
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // إضافة event listeners للقائمة المنسدلة في modal
        setTimeout(() => {
            const exportDropdownBtn = modal.querySelector('.dropdown > button');
            const exportDropdownMenu = modal.querySelector('.dropdown-menu');
            if (exportDropdownBtn && exportDropdownMenu) {
                exportDropdownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isVisible = exportDropdownMenu.style.display === 'block';
                    exportDropdownMenu.style.display = isVisible ? 'none' : 'block';
                });
            }
        }, 100);

        // إخفاء القائمة المنسدلة عند النقر خارجها
        const hideDropdown = (e) => {
            const exportDropdownBtn = modal.querySelector('.dropdown > button');
            const exportDropdownMenu = modal.querySelector('.dropdown-menu');
            if (exportDropdownMenu && exportDropdownBtn && !exportDropdownBtn.contains(e.target) && !exportDropdownMenu.contains(e.target)) {
                exportDropdownMenu.style.display = 'none';
            }
        };
        document.addEventListener('click', hideDropdown);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.removeEventListener('click', hideDropdown);
                modal.remove();
            }
        });
    },

    async showAddUpdateModal(actionId) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 class="modal-title">إضافة تحديث</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="update-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">التحديث *</label>
                            <textarea id="update-text" required class="form-input" rows="4" placeholder="اكتب التحديث..."></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">نسبة التقدم (%)</label>
                            <input type="number" id="update-progress" class="form-input" min="0" max="100" value="0">
                        </div>
                        <div class="flex items-center justify-end gap-4 pt-4 border-t">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save ml-2"></i>إضافة التحديث
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#update-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const updateText = modal.querySelector('#update-text').value.trim();
            const progress = parseInt(modal.querySelector('#update-progress').value) || 0;

            if (!updateText) {
                Notification.error('يرجى إدخال التحديث');
                return;
            }

            Loading.show();
            try {
                const result = await GoogleIntegration.callBackend('addActionUpdate', {
                    actionId: actionId,
                    user: AppState.currentUser?.name || 'System',
                    update: updateText,
                    progress: progress
                });

                if (result.success) {
                    Notification.success('تم إضافة التحديث بنجاح');
                    modal.remove();
                    await this.viewAction(actionId);
                } else {
                    throw new Error(result.message || 'حدث خطأ');
                }
            } catch (error) {
                Notification.error('حدث خطأ: ' + (error.message || error));
            } finally {
                Loading.hide();
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async showAddCommentModal(actionId) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 class="modal-title">إضافة تعليق</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="comment-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">التعليق *</label>
                            <textarea id="comment-text" required class="form-input" rows="4" placeholder="اكتب التعليق..."></textarea>
                        </div>
                        <div class="flex items-center justify-end gap-4 pt-4 border-t">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save ml-2"></i>إضافة التعليق
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#comment-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const commentText = modal.querySelector('#comment-text').value.trim();

            if (!commentText) {
                Notification.error('يرجى إدخال التعليق');
                return;
            }

            Loading.show();
            try {
                const result = await GoogleIntegration.callBackend('addActionComment', {
                    actionId: actionId,
                    user: AppState.currentUser?.name || 'System',
                    comment: commentText
                });

                if (result.success) {
                    Notification.success('تم إضافة التعليق بنجاح');
                    modal.remove();
                    await this.viewAction(actionId);
                } else {
                    throw new Error(result.message || 'حدث خطأ');
                }
            } catch (error) {
                Notification.error('حدث خطأ: ' + (error.message || error));
            } finally {
                Loading.hide();
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async renderSettings() {
        const settings = this.settings || this.getDefaultSettings();

        return `
            <div class="content-card">
                <div class="card-header">
                    <h2 class="card-title"><i class="fas fa-cog ml-2"></i>إعدادات Action Tracking</h2>
                </div>
                <div class="card-body space-y-6">
                    <p class="text-sm text-gray-600">
                        من هنا يمكنك إدارة جميع القوائم والربط بين نوع الملاحظة والتصنيف والسبب الجذري.
                    </p>
                    
                    <!-- إدارة القوائم -->
                    <div>
                        <h3 class="text-lg font-semibold mb-4"><i class="fas fa-list ml-2"></i>إدارة القوائم</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">أنواع الملاحظات</label>
                                <div id="settings-type-list" class="space-y-2 mb-2"></div>
                                <button type="button" class="btn-secondary btn-sm" onclick="ActionTrackingRegister.addListItem('type')">
                                    <i class="fas fa-plus ml-1"></i>إضافة
                                </button>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">التصنيفات</label>
                                <div id="settings-classification-list" class="space-y-2 mb-2"></div>
                                <button type="button" class="btn-secondary btn-sm" onclick="ActionTrackingRegister.addListItem('classification')">
                                    <i class="fas fa-plus ml-1"></i>إضافة
                                </button>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الأسباب الجذرية</label>
                                <div id="settings-rootcause-list" class="space-y-2 mb-2"></div>
                                <button type="button" class="btn-secondary btn-sm" onclick="ActionTrackingRegister.addListItem('rootcause')">
                                    <i class="fas fa-plus ml-1"></i>إضافة
                                </button>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الحالات</label>
                                <div id="settings-status-list" class="space-y-2 mb-2"></div>
                                <button type="button" class="btn-secondary btn-sm" onclick="ActionTrackingRegister.addListItem('status')">
                                    <i class="fas fa-plus ml-1"></i>إضافة
                                </button>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">مستويات الخطورة</label>
                                <div id="settings-risk-list" class="space-y-2 mb-2"></div>
                                <button type="button" class="btn-secondary btn-sm" onclick="ActionTrackingRegister.addListItem('risk')">
                                    <i class="fas fa-plus ml-1"></i>إضافة
                                </button>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الأقسام</label>
                                <div id="settings-department-list" class="space-y-2 mb-2"></div>
                                <button type="button" class="btn-secondary btn-sm" onclick="ActionTrackingRegister.addListItem('department')">
                                    <i class="fas fa-plus ml-1"></i>إضافة
                                </button>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">المواقع</label>
                                <div id="settings-location-list" class="space-y-2 mb-2"></div>
                                <button type="button" class="btn-secondary btn-sm" onclick="ActionTrackingRegister.addListItem('location')">
                                    <i class="fas fa-plus ml-1"></i>إضافة
                                </button>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">المسؤولون</label>
                                <div id="settings-responsible-list" class="space-y-2 mb-2"></div>
                                <button type="button" class="btn-secondary btn-sm" onclick="ActionTrackingRegister.addListItem('responsible')">
                                    <i class="fas fa-plus ml-1"></i>إضافة
                                </button>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الورديات</label>
                                <div id="settings-shift-list" class="space-y-2 mb-2"></div>
                                <button type="button" class="btn-secondary btn-sm" onclick="ActionTrackingRegister.addListItem('shift')">
                                    <i class="fas fa-plus ml-1"></i>إضافة
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- إدارة الربط -->
                    <div class="border-t pt-6">
                        <h3 class="text-lg font-semibold mb-4"><i class="fas fa-link ml-2"></i>إدارة الربط</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 class="text-sm font-semibold mb-3">ربط نوع الملاحظة → التصنيف</h4>
                                <div id="settings-type-classification-mapping" class="space-y-2"></div>
                            </div>
                            <div>
                                <h4 class="text-sm font-semibold mb-3">ربط التصنيف → السبب الجذري</h4>
                                <div id="settings-classification-rootcause-mapping" class="space-y-2"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-end gap-4 pt-4 border-t">
                        <button type="button" class="btn-secondary" onclick="ActionTrackingRegister.resetSettings()">
                            <i class="fas fa-undo ml-2"></i>إعادة تعيين
                        </button>
                        <button type="button" class="btn-primary" onclick="ActionTrackingRegister.saveSettings()">
                            <i class="fas fa-save ml-2"></i>حفظ الإعدادات
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    setupSettingsEvents() {
        // تحديث قوائم الإعدادات عند التحميل
        setTimeout(() => {
            this.renderSettingsLists();
        }, 100);
    },

    renderSettingsLists() {
        if (!this.settings) {
            this.settings = this.getDefaultSettings();
        }
        const settings = this.settings;

        // عرض قائمة أنواع الملاحظات
        const typeListEl = document.getElementById('settings-type-list');
        if (typeListEl) {
            const typeList = settings.typeOfIssueList || [];
            if (typeList.length === 0) {
                typeListEl.innerHTML = '<p class="text-sm text-gray-500">لا توجد عناصر</p>';
            } else {
                typeListEl.innerHTML = typeList.map((item, index) => `
                    <div class="flex items-center gap-2 p-2 border border-gray-200 rounded bg-white">
                        <input type="text" class="form-input flex-1" value="${Utils.escapeHTML(String(item))}" 
                            onchange="ActionTrackingRegister.updateListItem('type', ${index}, this.value)">
                        <button type="button" class="btn-danger btn-xs" onclick="ActionTrackingRegister.removeListItem('type', ${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }
        }

        // عرض قائمة التصنيفات
        const classificationListEl = document.getElementById('settings-classification-list');
        if (classificationListEl) {
            const classificationList = settings.classificationList || [];
            if (classificationList.length === 0) {
                classificationListEl.innerHTML = '<p class="text-sm text-gray-500">لا توجد عناصر</p>';
            } else {
                classificationListEl.innerHTML = classificationList.map((item, index) => `
                    <div class="flex items-center gap-2 p-2 border border-gray-200 rounded bg-white">
                        <input type="text" class="form-input flex-1" value="${Utils.escapeHTML(String(item))}" 
                            onchange="ActionTrackingRegister.updateListItem('classification', ${index}, this.value)">
                        <button type="button" class="btn-danger btn-xs" onclick="ActionTrackingRegister.removeListItem('classification', ${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }
        }

        // عرض قائمة الأسباب الجذرية
        const rootCauseListEl = document.getElementById('settings-rootcause-list');
        if (rootCauseListEl) {
            const rootCauseList = settings.rootCauseList || [];
            if (rootCauseList.length === 0) {
                rootCauseListEl.innerHTML = '<p class="text-sm text-gray-500">لا توجد عناصر</p>';
            } else {
                rootCauseListEl.innerHTML = rootCauseList.map((item, index) => `
                    <div class="flex items-center gap-2 p-2 border border-gray-200 rounded bg-white">
                        <input type="text" class="form-input flex-1" value="${Utils.escapeHTML(String(item))}" 
                            onchange="ActionTrackingRegister.updateListItem('rootcause', ${index}, this.value)">
                        <button type="button" class="btn-danger btn-xs" onclick="ActionTrackingRegister.removeListItem('rootcause', ${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }
        }

        // عرض قائمة الحالات
        const statusListEl = document.getElementById('settings-status-list');
        if (statusListEl) {
            const statusList = settings.statusList || [];
            if (statusList.length === 0) {
                statusListEl.innerHTML = '<p class="text-sm text-gray-500">لا توجد عناصر</p>';
            } else {
                statusListEl.innerHTML = statusList.map((item, index) => `
                    <div class="flex items-center gap-2 p-2 border border-gray-200 rounded bg-white">
                        <input type="text" class="form-input flex-1" value="${Utils.escapeHTML(String(item))}" 
                            onchange="ActionTrackingRegister.updateListItem('status', ${index}, this.value)">
                        <button type="button" class="btn-danger btn-xs" onclick="ActionTrackingRegister.removeListItem('status', ${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }
        }

        // عرض قائمة مستويات الخطورة
        const riskListEl = document.getElementById('settings-risk-list');
        if (riskListEl) {
            const riskList = settings.riskRatingList || [];
            if (riskList.length === 0) {
                riskListEl.innerHTML = '<p class="text-sm text-gray-500">لا توجد عناصر</p>';
            } else {
                riskListEl.innerHTML = riskList.map((item, index) => `
                    <div class="flex items-center gap-2 p-2 border border-gray-200 rounded bg-white">
                        <input type="text" class="form-input flex-1" value="${Utils.escapeHTML(String(item))}" 
                            onchange="ActionTrackingRegister.updateListItem('risk', ${index}, this.value)">
                        <button type="button" class="btn-danger btn-xs" onclick="ActionTrackingRegister.removeListItem('risk', ${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }
        }

        // عرض قائمة الأقسام
        const deptListEl = document.getElementById('settings-department-list');
        if (deptListEl) {
            const deptList = settings.departmentList || [];
            if (deptList.length === 0) {
                deptListEl.innerHTML = '<p class="text-sm text-gray-500">لا توجد عناصر</p>';
            } else {
                deptListEl.innerHTML = deptList.map((item, index) => `
                    <div class="flex items-center gap-2 p-2 border border-gray-200 rounded bg-white">
                        <input type="text" class="form-input flex-1" value="${Utils.escapeHTML(String(item))}" 
                            onchange="ActionTrackingRegister.updateListItem('department', ${index}, this.value)">
                        <button type="button" class="btn-danger btn-xs" onclick="ActionTrackingRegister.removeListItem('department', ${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }
        }

        // عرض قائمة المواقع
        const locationListEl = document.getElementById('settings-location-list');
        if (locationListEl) {
            const locationList = settings.locationList || [];
            if (locationList.length === 0) {
                locationListEl.innerHTML = '<p class="text-sm text-gray-500">لا توجد عناصر</p>';
            } else {
                locationListEl.innerHTML = locationList.map((item, index) => `
                    <div class="flex items-center gap-2 p-2 border border-gray-200 rounded bg-white">
                        <input type="text" class="form-input flex-1" value="${Utils.escapeHTML(String(item))}" 
                            onchange="ActionTrackingRegister.updateListItem('location', ${index}, this.value)">
                        <button type="button" class="btn-danger btn-xs" onclick="ActionTrackingRegister.removeListItem('location', ${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }
        }

        // عرض قائمة المسؤولين
        const responsibleListEl = document.getElementById('settings-responsible-list');
        if (responsibleListEl) {
            const responsibleList = settings.responsibleList || [];
            if (responsibleList.length === 0) {
                responsibleListEl.innerHTML = '<p class="text-sm text-gray-500">لا توجد عناصر</p>';
            } else {
                responsibleListEl.innerHTML = responsibleList.map((item, index) => `
                    <div class="flex items-center gap-2 p-2 border border-gray-200 rounded bg-white">
                        <input type="text" class="form-input flex-1" value="${Utils.escapeHTML(String(item))}" 
                            onchange="ActionTrackingRegister.updateListItem('responsible', ${index}, this.value)">
                        <button type="button" class="btn-danger btn-xs" onclick="ActionTrackingRegister.removeListItem('responsible', ${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }
        }

        // عرض قائمة الورديات
        const shiftListEl = document.getElementById('settings-shift-list');
        if (shiftListEl) {
            const shiftList = settings.shiftList || [];
            if (shiftList.length === 0) {
                shiftListEl.innerHTML = '<p class="text-sm text-gray-500">لا توجد عناصر</p>';
            } else {
                shiftListEl.innerHTML = shiftList.map((item, index) => `
                    <div class="flex items-center gap-2 p-2 border border-gray-200 rounded bg-white">
                        <input type="text" class="form-input flex-1" value="${Utils.escapeHTML(String(item))}" 
                            onchange="ActionTrackingRegister.updateListItem('shift', ${index}, this.value)">
                        <button type="button" class="btn-danger btn-xs" onclick="ActionTrackingRegister.removeListItem('shift', ${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }
        }
    },

    addListItem(listType) {
        // التحقق من الصلاحيات
        if (!this.hasSettingsPermission()) {
            Notification.error('ليس لديك صلاحية لتعديل الإعدادات');
            return;
        }

        if (!this.settings) {
            this.settings = this.getDefaultSettings();
        }

        const listMap = {
            'type': 'typeOfIssueList',
            'classification': 'classificationList',
            'rootcause': 'rootCauseList',
            'status': 'statusList',
            'risk': 'riskRatingList',
            'department': 'departmentList',
            'location': 'locationList',
            'responsible': 'responsibleList',
            'shift': 'shiftList'
        };

        const listKey = listMap[listType];
        if (!listKey) {
            Notification.error('نوع القائمة غير صحيح');
            return;
        }

        const newItem = prompt('أدخل العنصر الجديد:');
        if (newItem && newItem.trim()) {
            if (!this.settings[listKey]) {
                this.settings[listKey] = [];
            }
            this.settings[listKey].push(newItem.trim());
            this.renderSettingsLists();
            Notification.success('تم إضافة العنصر بنجاح');
        }
    },

    updateListItem(listType, index, newValue) {
        if (!this.settings) {
            this.settings = this.getDefaultSettings();
        }

        const listMap = {
            'type': 'typeOfIssueList',
            'classification': 'classificationList',
            'rootcause': 'rootCauseList',
            'status': 'statusList',
            'risk': 'riskRatingList',
            'department': 'departmentList',
            'location': 'locationList',
            'responsible': 'responsibleList',
            'shift': 'shiftList'
        };

        const listKey = listMap[listType];
        if (!listKey || !this.settings[listKey]) {
            return;
        }

        if (index >= 0 && index < this.settings[listKey].length) {
            this.settings[listKey][index] = newValue.trim();
        }
    },

    removeListItem(listType, index) {
        // التحقق من الصلاحيات
        if (!this.hasSettingsPermission()) {
            Notification.error('ليس لديك صلاحية لتعديل الإعدادات');
            return;
        }

        if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;

        if (!this.settings) {
            this.settings = this.getDefaultSettings();
        }

        const listMap = {
            'type': 'typeOfIssueList',
            'classification': 'classificationList',
            'rootcause': 'rootCauseList',
            'status': 'statusList',
            'risk': 'riskRatingList',
            'department': 'departmentList',
            'location': 'locationList',
            'responsible': 'responsibleList',
            'shift': 'shiftList'
        };

        const listKey = listMap[listType];
        if (!listKey || !this.settings[listKey]) {
            return;
        }

        if (index >= 0 && index < this.settings[listKey].length) {
            this.settings[listKey].splice(index, 1);
            this.renderSettingsLists();
            Notification.success('تم حذف العنصر بنجاح');
        }
    },

    resetSettings() {
        // التحقق من الصلاحيات
        if (!this.hasSettingsPermission()) {
            Notification.error('ليس لديك صلاحية لتعديل الإعدادات');
            return;
        }

        if (!confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟ سيتم فقدان جميع التعديلات.')) {
            return;
        }

        this.settings = this.getDefaultSettings();
        this.renderSettingsLists();
        Notification.success('تم إعادة تعيين الإعدادات');
    },

    async saveSettings() {
        // التحقق من الصلاحيات قبل الحفظ
        if (!this.hasSettingsPermission()) {
            Notification.error('ليس لديك صلاحية لحفظ إعدادات Action Tracking. يجب أن تكون مدير النظام أو لديك صلاحية خاصة.');
            return;
        }

        if (!this.settings) {
            this.settings = this.getDefaultSettings();
        }

        Loading.show();
        try {
            // إضافة بيانات المستخدم للتحقق من الصلاحيات في Backend
            const user = AppState.currentUser;
            const payload = {
                ...this.settings,
                userData: {
                    role: user?.role || '',
                    permissions: user?.permissions || {},
                    email: user?.email || '',
                    name: user?.name || ''
                }
            };

            const result = await GoogleIntegration.callBackend('saveActionTrackingSettings', payload);
            if (result.success) {
                Notification.success('تم حفظ الإعدادات بنجاح');
                await this.loadSettings();
                this.renderSettingsLists();
            } else {
                if (result.errorCode === 'PERMISSION_DENIED') {
                    Notification.error('ليس لديك صلاحية لحفظ الإعدادات: ' + (result.message || ''));
                } else {
                    throw new Error(result.message || 'حدث خطأ');
                }
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + (error.message || error));
        } finally {
            Loading.hide();
        }
    },

    // ===== دوال الطباعة والتصدير =====

    /**
     * طباعة إجراء واحد
     */
    async printAction(actionId) {
        const action = AppState.appData.actionTrackingRegister.find(a => a.id === actionId);
        if (!action) {
            Notification.error('الإجراء غير موجود');
            return;
        }

        try {
            Loading.show();

            // تحليل البيانات
            let timeLog = [], updates = [], comments = [];
            try {
                if (action.timeLog) timeLog = typeof action.timeLog === 'string' ? JSON.parse(action.timeLog) : action.timeLog;
                if (action.updates) updates = typeof action.updates === 'string' ? JSON.parse(action.updates) : action.updates;
                if (action.comments) comments = typeof action.comments === 'string' ? JSON.parse(action.comments) : action.comments;
            } catch (e) { }

            const isOverdue = action.originalTargetDate && new Date(action.originalTargetDate) < new Date() &&
                !(action.status || '').toLowerCase().includes('closed') &&
                !(action.status || '').toLowerCase().includes('مغلق');

            const badgeClass = (action.riskRating || '').toLowerCase() === 'critical' || (action.riskRating || '').toLowerCase() === 'high' ? 'badge-danger' : (action.riskRating || '').toLowerCase() === 'medium' ? 'badge-warning' : 'badge-info';
            const statusBadgeClass = isOverdue ? 'badge-danger' : (action.status || '').toLowerCase().includes('progress') || (action.status || '').toLowerCase().includes('تنفيذ') ? 'badge-warning' : (action.status || '').toLowerCase().includes('closed') || (action.status || '').toLowerCase().includes('مغلق') ? 'badge-success' : 'badge-info';

            const content = `
                <style>
                    .badge {
                        display: inline-block;
                        padding: 4px 10px;
                        border-radius: 4px;
                        font-size: 13px;
                        font-weight: bold;
                    }
                    .badge-info { background: #d1ecf1; color: #0c5460; }
                    .badge-warning { background: #fff3cd; color: #856404; }
                    .badge-danger { background: #f8d7da; color: #721c24; }
                    .badge-success { background: #d4edda; color: #155724; }
                    .text-area {
                        background: #f9f9f9;
                        padding: 15px;
                        border-radius: 5px;
                        border: 1px solid #ddd;
                        min-height: 50px;
                        white-space: pre-wrap;
                        margin-top: 10px;
                    }
                    .timeline-item {
                        padding: 10px;
                        margin-bottom: 10px;
                        border-right: 3px solid #007bff;
                        background: #f9f9f9;
                    }
                    .timeline-user {
                        font-weight: bold;
                        color: #007bff;
                    }
                    .timeline-date {
                        color: #666;
                        font-size: 12px;
                    }
                </style>
                <div class="summary-grid">
                    <div class="summary-card">
                        <span class="summary-label"># (التسلسل)</span>
                        <span class="summary-value">${Utils.escapeHTML(action.serialNumber || action.id || '')}</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-label">تاريخ الملاحظة</span>
                        <span class="summary-value">${action.issueDate ? Utils.formatDate(action.issueDate) : '-'}</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-label">نوع الملاحظة</span>
                        <span class="summary-value"><span class="badge badge-info">${Utils.escapeHTML(action.typeOfIssue || '')}</span></span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-label">تصنيف المخالفة</span>
                        <span class="summary-value"><span class="badge badge-warning">${Utils.escapeHTML(action.observationClassification || '')}</span></span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-label">القسم التابع</span>
                        <span class="summary-value">${Utils.escapeHTML(action.department || '')}</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-label">الموقع</span>
                        <span class="summary-value">${Utils.escapeHTML(action.location || '')}</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-label">معدل الخطورة</span>
                        <span class="summary-value"><span class="badge ${badgeClass}">${Utils.escapeHTML(action.riskRating || '')}</span></span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-label">المسؤول عن التنفيذ</span>
                        <span class="summary-value">${Utils.escapeHTML(action.responsible || '')}</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-label">تاريخ التنفيذ المستهدف</span>
                        <span class="summary-value ${isOverdue ? 'badge badge-danger' : ''}">
                            ${action.originalTargetDate ? Utils.formatDate(action.originalTargetDate) : '-'}
                            ${isOverdue ? ' ⚠️ متأخر' : ''}
                        </span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-label">الحالة</span>
                        <span class="summary-value">
                            <span class="badge ${statusBadgeClass}">${Utils.escapeHTML(action.status || '')}</span>
                        </span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-label">اسم صاحب الملاحظة</span>
                        <span class="summary-value">${Utils.escapeHTML(action.observerName || '')}</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-label">الوردية</span>
                        <span class="summary-value">${Utils.escapeHTML(action.shift || '')}</span>
                    </div>
                </div>
                ${action.rootCause ? `
                <div class="section-title">السبب الجذري</div>
                <div class="text-area">${Utils.escapeHTML(action.rootCause || '')}</div>
                ` : ''}
                <div class="section-title">الملاحظة / الخطر</div>
                <div class="text-area">${Utils.escapeHTML(action.observationIssueHazard || '')}</div>
                <div class="section-title">الإجراء التصحيحي أو الوقائي</div>
                <div class="text-area">${Utils.escapeHTML(action.correctivePreventiveAction || '')}</div>
                ${updates.length > 0 ? `
                    <div class="section-title">التحديثات (${updates.length})</div>
                    ${updates.map(update => `
                        <div class="timeline-item">
                            <div class="timeline-user">${Utils.escapeHTML(update.user || '')}</div>
                            <div class="timeline-date">${update.timestamp ? Utils.formatDate(update.timestamp) : ''}</div>
                            <div style="margin-top: 8px;">${Utils.escapeHTML(update.update || '')}</div>
                            ${update.progress !== undefined ? `
                                <div style="margin-top: 8px;">
                                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                                        <span>التقدم</span>
                                        <span>${update.progress}%</span>
                                    </div>
                                    <div style="width: 100%; background: #e9ecef; border-radius: 4px; height: 8px;">
                                        <div style="background: #007bff; height: 8px; border-radius: 4px; width: ${update.progress}%;"></div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                ` : ''}
                ${comments.length > 0 ? `
                    <div class="section-title">التعليقات (${comments.length})</div>
                    ${comments.map(comment => `
                        <div class="timeline-item" style="border-right-color: #28a745;">
                            <div class="timeline-user">${Utils.escapeHTML(comment.user || '')}</div>
                            <div class="timeline-date">${comment.timestamp ? Utils.formatDate(comment.timestamp) : ''}</div>
                            <div style="margin-top: 8px;">${Utils.escapeHTML(comment.comment || '')}</div>
                        </div>
                    `).join('')}
                ` : ''}
                ${timeLog.length > 0 ? `
                    <div class="section-title">السجل الزمني</div>
                    ${timeLog.map(log => `
                        <div class="timeline-item">
                            <div class="timeline-user">${Utils.escapeHTML(log.user || '')}</div>
                            <div class="timeline-date">${log.timestamp ? Utils.formatDate(log.timestamp) : ''}</div>
                            <div style="margin-top: 8px;">${Utils.escapeHTML(log.note || '')}</div>
                            ${log.action === 'status_changed' && log.oldStatus && log.newStatus ? `
                                <div style="margin-top: 8px; font-size: 12px; color: #666;">
                                    من: <span class="badge badge-warning">${Utils.escapeHTML(log.oldStatus)}</span>
                                    إلى: <span class="badge badge-info">${Utils.escapeHTML(log.newStatus)}</span>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                ` : ''}
            `;

            const formCode = action.serialNumber || `ACTION-${action.id?.substring(0, 8) || 'UNKNOWN'}`;
            const htmlContent = typeof FormHeader !== 'undefined' && FormHeader.generatePDFHTML
                ? FormHeader.generatePDFHTML(
                    formCode,
                    `تفاصيل الإجراء #${Utils.escapeHTML(action.serialNumber || action.id || '')}`,
                    content,
                    false,
                    true,
                    {
                        version: action.version || '1.0',
                        releaseDate: action.issueDate || action.createdAt,
                        revisionDate: action.updatedAt || action.issueDate,
                        qrData: {
                            type: 'ActionTracking',
                            id: action.id,
                            serialNumber: action.serialNumber,
                            code: formCode
                        }
                    },
                    action.createdAt || action.issueDate,
                    action.updatedAt || action.createdAt
                )
                : `<html><body>${content}</body></html>`;

            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.print();
                        setTimeout(() => {
                            URL.revokeObjectURL(url);
                            Loading.hide();
                            Notification.success('تم تجهيز التقرير للطباعة');
                        }, 1000);
                    }, 500);
                };
            } else {
                Loading.hide();
                Notification.error('يرجى السماح بالنوافذ المنبثقة لعرض التقرير.');
            }
        } catch (error) {
            Loading.hide();
            Notification.error('حدث خطأ في الطباعة: ' + (error.message || error));
        }
    },

    /**
     * طباعة جميع الإجراءات
     */
    async printAllActions() {
        const filters = this.getFilters();
        const items = AppState.appData.actionTrackingRegister || [];
        const filteredItems = this.filterItems(items, filters);

        if (filteredItems.length === 0) {
            Notification.warning('لا توجد إجراءات للطباعة');
            return;
        }

        try {
            Loading.show();

            const tableRows = filteredItems.map(action => {
                const isOverdue = action.originalTargetDate && new Date(action.originalTargetDate) < new Date() &&
                    !(action.status || '').toLowerCase().includes('closed') &&
                    !(action.status || '').toLowerCase().includes('مغلق');

                return `
                    <tr>
                        <td>${Utils.escapeHTML(action.serialNumber || action.id || '')}</td>
                        <td>${action.issueDate ? Utils.formatDate(action.issueDate) : '-'}</td>
                        <td>${Utils.escapeHTML(action.typeOfIssue || '')}</td>
                        <td>${Utils.escapeHTML(action.observationClassification || '')}</td>
                        <td>${Utils.escapeHTML((action.observationIssueHazard || '').substring(0, 50))}${(action.observationIssueHazard || '').length > 50 ? '...' : ''}</td>
                        <td>${Utils.escapeHTML(action.responsible || '')}</td>
                        <td class="${isOverdue ? 'badge badge-danger' : ''}">${action.originalTargetDate ? Utils.formatDate(action.originalTargetDate) : '-'}</td>
                        <td>${Utils.escapeHTML(action.status || '')}</td>
                        <td>${Utils.escapeHTML(action.riskRating || '')}</td>
                    </tr>
                `;
            }).join('');

            const content = `
                <div class="summary-grid">
                    <div class="summary-card">
                        <span class="summary-label">العدد الإجمالي</span>
                        <span class="summary-value">${filteredItems.length}</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-label">تاريخ الطباعة</span>
                        <span class="summary-value">${Utils.formatDate(new Date().toISOString())}</span>
                    </div>
                </div>
                <div class="section-title">سجل متابعة الإجراءات</div>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>تاريخ الملاحظة</th>
                            <th>نوع الملاحظة</th>
                            <th>التصنيف</th>
                            <th>الملاحظة / الخطر</th>
                            <th>المسؤول</th>
                            <th>تاريخ التنفيذ المستهدف</th>
                            <th>الحالة</th>
                            <th>مستوى الخطورة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            `;

            const formCode = `ACTION-TRACKING-REGISTER-${new Date().toISOString().slice(0, 10)}`;
            const htmlContent = typeof FormHeader !== 'undefined' && FormHeader.generatePDFHTML
                ? FormHeader.generatePDFHTML(
                    formCode,
                    'سجل متابعة الإجراءات',
                    content,
                    false,
                    true,
                    {
                        version: '1.0',
                        source: 'ActionTrackingRegister',
                        count: filteredItems.length,
                        qrData: {
                            type: 'ActionTrackingRegister',
                            count: filteredItems.length,
                            date: new Date().toISOString()
                        }
                    },
                    new Date().toISOString(),
                    new Date().toISOString()
                )
                : `<html><body>${content}</body></html>`;

            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.print();
                        setTimeout(() => {
                            URL.revokeObjectURL(url);
                            Loading.hide();
                            Notification.success('تم تجهيز التقرير للطباعة');
                        }, 1000);
                    }, 500);
                };
            } else {
                Loading.hide();
                Notification.error('يرجى السماح بالنوافذ المنبثقة لعرض التقرير.');
            }
        } catch (error) {
            Loading.hide();
            Notification.error('حدث خطأ في الطباعة: ' + (error.message || error));
        }
    },

    /**
     * تصدير إجراء واحد إلى Excel
     */
    async exportActionToExcel(actionId) {
        const action = AppState.appData.actionTrackingRegister.find(a => a.id === actionId);
        if (!action) {
            Notification.error('الإجراء غير موجود');
            return;
        }

        try {
            Loading.show();

            // تحليل البيانات
            let timeLog = [], updates = [], comments = [];
            try {
                if (action.timeLog) timeLog = typeof action.timeLog === 'string' ? JSON.parse(action.timeLog) : action.timeLog;
                if (action.updates) updates = typeof action.updates === 'string' ? JSON.parse(action.updates) : action.updates;
                if (action.comments) comments = typeof action.comments === 'string' ? JSON.parse(action.comments) : action.comments;
            } catch (e) { }

            const wb = XLSX.utils.book_new();

            // ورقة المعلومات الأساسية
            const basicData = [
                ['# (التسلسل)', action.serialNumber || action.id || ''],
                ['تاريخ الملاحظة', action.issueDate ? Utils.formatDate(action.issueDate) : ''],
                ['نوع الملاحظة', action.typeOfIssue || ''],
                ['تصنيف المخالفة', action.observationClassification || ''],
                ['السبب الجذري', action.rootCause || ''],
                ['القسم التابع', action.department || ''],
                ['الموقع', action.location || ''],
                ['معدل الخطورة', action.riskRating || ''],
                ['المسؤول عن التنفيذ', action.responsible || ''],
                ['تاريخ التنفيذ المستهدف', action.originalTargetDate ? Utils.formatDate(action.originalTargetDate) : ''],
                ['الحالة', action.status || ''],
                ['اسم صاحب الملاحظة', action.observerName || ''],
                ['الوردية', action.shift || ''],
                ['الملاحظة / الخطر', action.observationIssueHazard || ''],
                ['الإجراء التصحيحي أو الوقائي', action.correctivePreventiveAction || '']
            ];
            const ws1 = XLSX.utils.aoa_to_sheet(basicData);
            XLSX.utils.book_append_sheet(wb, ws1, 'المعلومات الأساسية');

            // ورقة التحديثات
            if (updates.length > 0) {
                const updatesData = [
                    ['المستخدم', 'التاريخ', 'التحديث', 'التقدم (%)']
                ];
                updates.forEach(update => {
                    updatesData.push([
                        update.user || '',
                        update.timestamp ? Utils.formatDate(update.timestamp) : '',
                        update.update || '',
                        update.progress || 0
                    ]);
                });
                const ws2 = XLSX.utils.aoa_to_sheet(updatesData);
                XLSX.utils.book_append_sheet(wb, ws2, 'التحديثات');
            }

            // ورقة التعليقات
            if (comments.length > 0) {
                const commentsData = [
                    ['المستخدم', 'التاريخ', 'التعليق']
                ];
                comments.forEach(comment => {
                    commentsData.push([
                        comment.user || '',
                        comment.timestamp ? Utils.formatDate(comment.timestamp) : '',
                        comment.comment || ''
                    ]);
                });
                const ws3 = XLSX.utils.aoa_to_sheet(commentsData);
                XLSX.utils.book_append_sheet(wb, ws3, 'التعليقات');
            }

            // ورقة السجل الزمني
            if (timeLog.length > 0) {
                const timeLogData = [
                    ['المستخدم', 'التاريخ', 'الإجراء', 'الملاحظة']
                ];
                timeLog.forEach(log => {
                    timeLogData.push([
                        log.user || '',
                        log.timestamp ? Utils.formatDate(log.timestamp) : '',
                        log.action || '',
                        log.note || ''
                    ]);
                });
                const ws4 = XLSX.utils.aoa_to_sheet(timeLogData);
                XLSX.utils.book_append_sheet(wb, ws4, 'السجل الزمني');
            }

            const fileName = `الإجراء_${action.serialNumber || action.id || actionId}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

            Loading.hide();
            Notification.success('تم تصدير الإجراء إلى Excel بنجاح');
        } catch (error) {
            Loading.hide();
            Notification.error('حدث خطأ في التصدير: ' + (error.message || error));
        }
    },

    /**
     * تصدير جميع الإجراءات إلى Excel
     */
    async exportAllToExcel() {
        const filters = this.getFilters();
        const items = AppState.appData.actionTrackingRegister || [];
        const filteredItems = this.filterItems(items, filters);

        if (filteredItems.length === 0) {
            Notification.warning('لا توجد إجراءات للتصدير');
            return;
        }

        try {
            Loading.show();

            const data = [
                ['#', 'تاريخ الملاحظة', 'نوع الملاحظة', 'التصنيف', 'الملاحظة / الخطر', 'المسؤول', 'تاريخ التنفيذ المستهدف', 'الحالة', 'مستوى الخطورة', 'القسم', 'الموقع', 'السبب الجذري', 'الإجراء التصحيحي']
            ];

            filteredItems.forEach(action => {
                data.push([
                    action.serialNumber || action.id || '',
                    action.issueDate ? Utils.formatDate(action.issueDate) : '',
                    action.typeOfIssue || '',
                    action.observationClassification || '',
                    action.observationIssueHazard || '',
                    action.responsible || '',
                    action.originalTargetDate ? Utils.formatDate(action.originalTargetDate) : '',
                    action.status || '',
                    action.riskRating || '',
                    action.department || '',
                    action.location || '',
                    action.rootCause || '',
                    action.correctivePreventiveAction || ''
                ]);
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, 'سجل الإجراءات');

            const fileName = `سجل_الإجراءات_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

            Loading.hide();
            Notification.success(`تم تصدير ${filteredItems.length} إجراء إلى Excel بنجاح`);
        } catch (error) {
            Loading.hide();
            Notification.error('حدث خطأ في التصدير: ' + (error.message || error));
        }
    },

    /**
     * تصدير إجراء واحد إلى PDF
     */
    async exportActionToPDF(actionId) {
        // استخدام نفس كود الطباعة للتصدير إلى PDF
        await this.printAction(actionId);
    },

    /**
     * تصدير جميع الإجراءات إلى PDF
     */
    async exportAllToPDF() {
        // استخدام نفس كود الطباعة للتصدير إلى PDF
        await this.printAllActions();
    }
};

// ===== Export module to global scope =====
// تصدير الموديول إلى window فوراً لضمان توافره
(function () {
    'use strict';
    try {
        if (typeof window !== 'undefined' && typeof ActionTrackingRegister !== 'undefined') {
            window.ActionTrackingRegister = ActionTrackingRegister;
            
            // إشعار عند تحميل الموديول بنجاح
            if (typeof AppState !== 'undefined' && AppState.debugMode && typeof Utils !== 'undefined' && Utils.safeLog) {
                Utils.safeLog('✅ ActionTrackingRegister module loaded and available on window.ActionTrackingRegister');
            }
        }
    } catch (error) {
        console.error('❌ خطأ في تصدير ActionTrackingRegister:', error);
        // محاولة التصدير مرة أخرى حتى في حالة الخطأ
        if (typeof window !== 'undefined' && typeof ActionTrackingRegister !== 'undefined') {
            try {
                window.ActionTrackingRegister = ActionTrackingRegister;
            } catch (e) {
                console.error('❌ فشل تصدير ActionTrackingRegister:', e);
            }
        }
    }
})();