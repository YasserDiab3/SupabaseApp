/**
 * SafetyHealthManagement Module
 * ØªÙ… Ø§Ø³ØªØ®Ø±Ø§Ø¬Ù‡ Ù…Ù† app-modules.js
 */
// ===== Safety & Health Management Module (موديول إدارة السلامة والصحة المهنية) =====
const SafetyHealthManagement = {
    currentView: 'team', // team, structure, job-descriptions, kpis, reports, settings
    currentMemberId: null,
    filters: {
        department: '',
        jobTitle: '',
        period: '',
        search: ''
    },
    // التحقق من تفعيل الخادم (للتوافق مع النسخة القديمة)
    isGoogleAppsScriptEnabled() {
        if (typeof AppState === 'undefined' || !AppState.googleConfig) return false;
        const appsScriptConfig = AppState.googleConfig?.appsScript;
        if (!appsScriptConfig || appsScriptConfig.enabled !== true) return false;
        const scriptUrl = appsScriptConfig.scriptUrl;
        if (!scriptUrl || typeof scriptUrl !== 'string' || scriptUrl.trim() === '') return false;
        if (typeof GoogleIntegration === 'undefined' || typeof GoogleIntegration.sendRequest !== 'function') return false;
        return true;
    },

    // التحقق من تفعيل خلفية Supabase (النظام الجديد)
    isSupabaseBackendEnabled() {
        if (typeof AppState !== 'undefined' && AppState.useSupabaseBackend === true) {
            const url = (AppState.supabaseUrl || '').toString().trim();
            const key = (AppState.supabaseAnonKey || '').toString().trim();
            if ((url && key) || (typeof SupabaseIntegration !== 'undefined' && typeof SupabaseIntegration.sendRequest === 'function')) return true;
        }
        return false;
    },

    // هل يوجد اتصال بخلفية (Google أو Supabase) — يُستخدم لإظهار النماذج والبيانات
    isBackendAvailable() {
        return this.isGoogleAppsScriptEnabled() || this.isSupabaseBackendEnabled();
    },

    hasLocalDataAvailable(action, data = {}) {
        try {
            if (typeof GoogleIntegration === 'undefined' || typeof GoogleIntegration.getLocalData !== 'function') return false;
            const localData = GoogleIntegration.getLocalData(action, data);
            return localData !== null && localData !== undefined;
        } catch (error) {
            return false;
        }
    },

    canAccessData(action = null, data = {}) {
        if (this.isBackendAvailable()) return true;
        if (action && this.hasLocalDataAvailable(action, data)) return true;
        return false;
    },

    getDataAccessMessage(action = null, data = {}) {
        if (this.isBackendAvailable()) return null;
        if (action && this.hasLocalDataAvailable(action, data)) return null;
        return 'الاتصال بقاعدة البيانات غير مفعّل. يرجى تفعيله من الإعدادات (Supabase أو Google).';
    },
    // تحسينات الأداء: Cache و Debounce
    cache: {
        members: null,
        structure: null,
        jobDescriptions: null,
        kpis: new Map(),
        lastLoad: null,
        cacheTimeout: 3 * 60 * 1000 // 3 دقائق (تحسين الأداء)
    },
    // منع العمليات المتزامنة
    loadingStates: {
        team: false,
        structure: false,
        jobDescriptions: false,
        kpis: false,
        reports: false,
        settings: false
    },
    // Debounce timers
    debounceTimers: new Map(),

    async load() {
        const section = document.getElementById('safety-health-management-section');
        if (!section) {
            if (typeof Utils !== 'undefined' && Utils.safeError) {
                Utils.safeError('قسم safety-health-management-section غير موجود!');
            } else {
                console.error('قسم safety-health-management-section غير موجود!');
            }
            return;
        }

        try {
            // تحميل المحتوى بشكل فوري بدون تأخير
            let content = '';
            try {
                content = await this.render();
            } catch (error) {
                if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                    Utils.safeWarn('⚠️ خطأ في تحميل محتوى الواجهة:', error);
                } else {
                    console.warn('⚠️ خطأ في تحميل محتوى الواجهة:', error);
                }
                // عرض محتوى افتراضي مع إمكانية إعادة المحاولة
                content = `
                    <div class="section-header">
                        <div>
                            <h1 class="section-title">
                                <i class="fas fa-user-shield ml-3"></i>
                                إدارة السلامة والصحة المهنية
                            </h1>
                        </div>
                    </div>
                    <div class="content-card mt-6">
                        <div class="card-body">
                            <div class="empty-state">
                                <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                                <p class="text-gray-500 mb-4">حدث خطأ في تحميل البيانات</p>
                                <button onclick="SafetyHealthManagement.load()" class="btn-primary">
                                    <i class="fas fa-redo ml-2"></i>
                                    إعادة المحاولة
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }

            section.innerHTML = content;
            
            // تهيئة الأحداث فوراً بعد عرض الواجهة
            try {
                this.setupEventListeners();
                
                // ✅ تحميل محتوى التبويب الأول (team) فوراً بعد عرض الواجهة
                setTimeout(async () => {
                    try {
                        const tabContent = document.getElementById('shm-tab-content');
                        if (!tabContent) return;
                        
                        // تحميل محتوى فريق السلامة
                        const teamContent = await this.renderTeamView().catch(error => {
                            Utils.safeWarn('⚠️ خطأ في تحميل فريق السلامة:', error);
                            return `
                                <div class="content-card">
                                    <div class="card-body">
                                        <div class="empty-state">
                                            <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                                            <p class="text-gray-500 mb-4">حدث خطأ في تحميل البيانات</p>
                                            <button onclick="SafetyHealthManagement.load()" class="btn-primary">
                                                <i class="fas fa-redo ml-2"></i>
                                                إعادة المحاولة
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        
                        tabContent.innerHTML = teamContent;
                        
                        // ربط زر إضافة عضو جديد بعد وجود الزر في DOM
                        this.setupEventListeners();
                        // تحميل البيانات بعد عرض الواجهة
                        this.loadTeamMembers().catch(() => {});
                    } catch (error) {
                        Utils.safeWarn('⚠️ خطأ في تحميل التبويب:', error);
                    }
                }, 0);
            } catch (error) {
                if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                    Utils.safeWarn('⚠️ خطأ في setupEventListeners:', error);
                } else {
                    console.warn('⚠️ خطأ في setupEventListeners:', error);
                }
            }
        } catch (error) {
            if (typeof Utils !== 'undefined' && Utils.safeError) {
                Utils.safeError('❌ خطأ في تحميل مديول إدارة السلامة والصحة المهنية:', error);
            } else {
                console.error('❌ خطأ في تحميل مديول إدارة السلامة والصحة المهنية:', error);
            }
            section.innerHTML = `
                <div class="content-card">
                    <div class="card-body">
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                            <p class="text-gray-500 mb-2">حدث خطأ أثناء تحميل البيانات</p>
                            <p class="text-sm text-gray-400 mb-4">${error && error.message ? Utils.escapeHTML(error.message) : 'خطأ غير معروف'}</p>
                            <button onclick="SafetyHealthManagement.load()" class="btn-primary">
                                <i class="fas fa-redo ml-2"></i>
                                إعادة المحاولة
                            </button>
                        </div>
                    </div>
                </div>
            `;
            if (typeof Notification !== 'undefined' && Notification.error) {
                Notification.error('حدث خطأ أثناء تحميل إدارة السلامة والصحة المهنية. يُرجى المحاولة مرة أخرى.', { duration: 5000 });
            }
        }
    },

    async render() {
        return `
            <div class="section-header">
                <div class="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 class="section-title">
                            <i class="fas fa-user-shield ml-3"></i>
                            إدارة السلامة والصحة المهنية
                        </h1>
                        <p class="section-subtitle">إدارة شاملة لفريق السلامة، الهيكل الوظيفي، الوصف الوظيفي، مؤشرات الأداء وتقارير الأداء</p>
                    </div>
                    <div class="flex gap-2">
                        <button id="shm-export-excel-btn" class="btn-success btn-sm">
                            <i class="fas fa-file-excel ml-2"></i>
                            تصدير Excel
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tabs Navigation -->
            <div class="mt-6">
                <div class="flex items-center gap-2 border-b border-gray-200" style="border-bottom: 2px solid #e5e7eb; overflow-x: auto;">
                    <button class="shm-tab-btn active" data-tab="team" onclick="SafetyHealthManagement.switchTab('team')" style="padding: 12px 20px; border: none; background: transparent; color: #6b7280; font-weight: 500; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s; white-space: nowrap;">
                        <i class="fas fa-users ml-2"></i>
                        فريق السلامة
                    </button>
                    <button class="shm-tab-btn" data-tab="structure" onclick="SafetyHealthManagement.switchTab('structure')" style="padding: 12px 20px; border: none; background: transparent; color: #6b7280; font-weight: 500; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s; white-space: nowrap;">
                        <i class="fas fa-sitemap ml-2"></i>
                        الهيكل الوظيفي
                    </button>
                    <button class="shm-tab-btn" data-tab="job-descriptions" onclick="SafetyHealthManagement.switchTab('job-descriptions')" style="padding: 12px 20px; border: none; background: transparent; color: #6b7280; font-weight: 500; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s; white-space: nowrap;">
                        <i class="fas fa-file-alt ml-2"></i>
                        الوصف الوظيفي
                    </button>
                    <button class="shm-tab-btn" data-tab="kpis" onclick="SafetyHealthManagement.switchTab('kpis')" style="padding: 12px 20px; border: none; background: transparent; color: #6b7280; font-weight: 500; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s; white-space: nowrap;">
                        <i class="fas fa-chart-line ml-2"></i>
                        مؤشرات الأداء
                    </button>
                    <button class="shm-tab-btn" data-tab="reports" onclick="SafetyHealthManagement.switchTab('reports')" style="padding: 12px 20px; border: none; background: transparent; color: #6b7280; font-weight: 500; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s; white-space: nowrap;">
                        <i class="fas fa-file-chart-line ml-2"></i>
                        تقارير الأداء
                    </button>
                    <button class="shm-tab-btn" data-tab="attendance" onclick="SafetyHealthManagement.switchTab('attendance')" style="padding: 12px 20px; border: none; background: transparent; color: #6b7280; font-weight: 500; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s; white-space: nowrap;">
                        <i class="fas fa-calendar-check ml-2"></i>
                        الحضور والإجازات
                    </button>
                    <button class="shm-tab-btn" data-tab="analysis" onclick="SafetyHealthManagement.switchTab('analysis')" style="padding: 12px 20px; border: none; background: transparent; color: #6b7280; font-weight: 500; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s; white-space: nowrap;">
                        <i class="fas fa-chart-bar ml-2"></i>
                        تحليل البيانات
                    </button>
                    ${AppState.currentUser?.role === 'admin' ? `
                    <button class="shm-tab-btn" data-tab="settings" onclick="SafetyHealthManagement.switchTab('settings')" style="padding: 12px 20px; border: none; background: transparent; color: #6b7280; font-weight: 500; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s; white-space: nowrap;">
                        <i class="fas fa-cog ml-2"></i>
                        الإعدادات
                    </button>
                    ` : ''}
                </div>
                <style>
                    /* تحسين ألوان التبويبات بشكل مطور ومحسن */
                    .shm-tab-btn {
                        position: relative;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .shm-tab-btn::before {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        right: 0;
                        width: 0;
                        height: 3px;
                        background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
                        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        border-radius: 3px 3px 0 0;
                    }
                    .shm-tab-btn:hover {
                        color: #3b82f6 !important;
                        background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
                        transform: translateY(-1px);
                    }
                    .shm-tab-btn:hover::before {
                        width: 100%;
                    }
                    .shm-tab-btn.active {
                        color: #3b82f6 !important;
                        background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
                        font-weight: 600 !important;
                        border-bottom: 3px solid transparent;
                        position: relative;
                    }
                    .shm-tab-btn.active::before {
                        width: 100%;
                        background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
                    }
                    .shm-tab-btn.active::after {
                        content: '';
                        position: absolute;
                        bottom: -3px;
                        right: 0;
                        width: 100%;
                        height: 3px;
                        background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
                        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
                    }
                    .shm-tab-btn i {
                        transition: transform 0.3s ease;
                    }
                    .shm-tab-btn:hover i {
                        transform: scale(1.1);
                    }
                    .shm-tab-btn.active i {
                        color: #3b82f6;
                        transform: scale(1.15);
                    }
                    .member-card {
                        transition: transform 0.2s, box-shadow 0.2s;
                    }
                    .member-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    }
                    .kpi-card {
                        border-radius: 12px;
                        padding: 20px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        position: relative;
                        overflow: hidden;
                    }
                    .kpi-card::before {
                        content: '';
                        position: absolute;
                        top: -50%;
                        right: -50%;
                        width: 200%;
                        height: 200%;
                        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                        pointer-events: none;
                    }
                    .kpi-card.success { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
                    .kpi-card.warning { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
                    .kpi-card.info { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
                    .kpi-card.danger { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
                    .chart-container {
                        position: relative;
                        height: 300px;
                        width: 100%;
                    }
                    
                    /* تحسين جميع الأزرار داخل التبويبات */
                    #shm-tab-content .btn-primary,
                    #shm-tab-content .btn-secondary,
                    #shm-tab-content .btn-success,
                    #shm-tab-content .btn-danger,
                    #shm-tab-content .btn-icon {
                        padding: 12px 24px;
                        font-size: 14px;
                        font-weight: 600;
                        border-radius: 8px;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        position: relative;
                        overflow: hidden;
                        border: none;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                    
                    /* زر أساسي (Primary) */
                    #shm-tab-content .btn-primary {
                        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                        color: white;
                        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                    }
                    #shm-tab-content .btn-primary::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        right: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }
                    #shm-tab-content .btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
                    }
                    #shm-tab-content .btn-primary:hover::before {
                        opacity: 1;
                    }
                    #shm-tab-content .btn-primary:active {
                        transform: translateY(0);
                        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                    }
                    #shm-tab-content .btn-primary i {
                        position: relative;
                        z-index: 1;
                    }
                    #shm-tab-content .btn-primary span,
                    #shm-tab-content .btn-primary {
                        position: relative;
                        z-index: 1;
                    }
                    
                    /* زر ثانوي (Secondary) */
                    #shm-tab-content .btn-secondary {
                        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                        color: white;
                        box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
                    }
                    #shm-tab-content .btn-secondary::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        right: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }
                    #shm-tab-content .btn-secondary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(107, 114, 128, 0.4);
                    }
                    #shm-tab-content .btn-secondary:hover::before {
                        opacity: 1;
                    }
                    #shm-tab-content .btn-secondary:active {
                        transform: translateY(0);
                        box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3);
                    }
                    #shm-tab-content .btn-secondary i {
                        position: relative;
                        z-index: 1;
                    }
                    
                    /* زر نجاح (Success) */
                    #shm-tab-content .btn-success {
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                    }
                    #shm-tab-content .btn-success::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        right: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(135deg, #059669 0%, #047857 100%);
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }
                    #shm-tab-content .btn-success:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
                    }
                    #shm-tab-content .btn-success:hover::before {
                        opacity: 1;
                    }
                    #shm-tab-content .btn-success:active {
                        transform: translateY(0);
                        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
                    }
                    #shm-tab-content .btn-success i {
                        position: relative;
                        z-index: 1;
                    }
                    
                    /* زر خطر (Danger) */
                    #shm-tab-content .btn-danger {
                        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                        color: white;
                        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                    }
                    #shm-tab-content .btn-danger::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        right: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }
                    #shm-tab-content .btn-danger:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
                    }
                    #shm-tab-content .btn-danger:hover::before {
                        opacity: 1;
                    }
                    #shm-tab-content .btn-danger:active {
                        transform: translateY(0);
                        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
                    }
                    #shm-tab-content .btn-danger i {
                        position: relative;
                        z-index: 1;
                    }
                    
                    /* أزرار صغيرة (Small) */
                    #shm-tab-content .btn-sm {
                        padding: 10px 18px;
                        font-size: 13px;
                        font-weight: 600;
                        border-radius: 6px;
                    }
                    #shm-tab-content .btn-sm:hover {
                        transform: translateY(-1px);
                    }
                    
                    /* أزرار في الكروت */
                    .member-card .btn-primary,
                    .member-card .btn-secondary,
                    .member-card .btn-danger {
                        padding: 10px 18px;
                        font-size: 13px;
                        font-weight: 600;
                    }
                    
                    /* أزرار في الجداول والقوائم */
                    .org-node .btn-icon,
                    .bg-white.border .btn-icon {
                        width: 36px;
                        height: 36px;
                        padding: 8px;
                    }
                    
                    /* تحسين أزرار الفلترة */
                    #shm-tab-content .form-input + button,
                    #shm-tab-content select + button {
                        margin-top: 0;
                    }
                    
                    /* أزرار في الـ Header الرئيسي */
                    .section-header .btn-success,
                    .section-header .btn-secondary {
                        padding: 12px 24px;
                        font-size: 14px;
                        font-weight: 600;
                        border-radius: 8px;
                    }
                    
                    /* تحسين أزرار التصدير */
                    #shm-export-excel-btn {
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        padding: 10px 20px;
                        font-size: 13px;
                        font-weight: 600;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                        transition: all 0.3s ease;
                    }
                    #shm-export-excel-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
                        background: linear-gradient(135deg, #059669 0%, #047857 100%);
                    }
                    #shm-export-excel-btn i {
                        transition: transform 0.3s ease;
                    }
                    #shm-export-excel-btn:hover i {
                        transform: scale(1.15);
                    }
                    
                    /* أزرار الأيقونات */
                    #shm-tab-content .btn-icon {
                        padding: 10px;
                        width: 40px;
                        height: 40px;
                        border-radius: 8px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                    }
                    #shm-tab-content .btn-icon-primary {
                        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                        color: white;
                        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                    }
                    #shm-tab-content .btn-icon-primary:hover {
                        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                        transform: translateY(-2px) scale(1.05);
                        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                    }
                    #shm-tab-content .btn-icon-danger {
                        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                        color: white;
                        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
                    }
                    #shm-tab-content .btn-icon-danger:hover {
                        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                        transform: translateY(-2px) scale(1.05);
                        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
                    }
                    
                    /* تأثيرات الأيقونات داخل الأزرار */
                    #shm-tab-content .btn-primary i,
                    #shm-tab-content .btn-secondary i,
                    #shm-tab-content .btn-success i,
                    #shm-tab-content .btn-danger i {
                        transition: transform 0.3s ease;
                    }
                    #shm-tab-content .btn-primary:hover i,
                    #shm-tab-content .btn-secondary:hover i,
                    #shm-tab-content .btn-success:hover i,
                    #shm-tab-content .btn-danger:hover i {
                        transform: scale(1.15);
                    }
                    
                    /* أزرار في الـ Header */
                    .card-header .btn-primary,
                    .card-header .btn-secondary,
                    .card-header .btn-success {
                        padding: 12px 24px;
                        font-size: 14px;
                        font-weight: 600;
                    }
                    
                    /* أزرار في الـ Modal */
                    .modal-footer .btn-primary,
                    .modal-footer .btn-secondary {
                        padding: 12px 24px;
                        font-size: 14px;
                        font-weight: 600;
                        min-width: 120px;
                        border-radius: 8px;
                    }
                    
                    /* تحسين أزرار النماذج */
                    .modal-overlay .btn-primary,
                    .modal-overlay .btn-secondary {
                        padding: 12px 24px;
                        font-size: 14px;
                        font-weight: 600;
                        border-radius: 8px;
                    }
                    
                    /* أزرار في الـ Card Header */
                    .card-header button {
                        padding: 12px 24px;
                        font-size: 14px;
                        font-weight: 600;
                        border-radius: 8px;
                    }
                    
                    /* تحسين أزرار الحضور والإجازات */
                    #attendance-member-select + button,
                    #add-attendance-btn,
                    #add-leave-btn {
                        padding: 12px 24px;
                        font-size: 14px;
                        font-weight: 600;
                        border-radius: 8px;
                    }
                    
                    /* تحسين أزرار التقارير */
                    #report-member-select + button,
                    #generate-report-btn {
                        padding: 12px 24px;
                        font-size: 14px;
                        font-weight: 600;
                        border-radius: 8px;
                    }
                    
                    /* تحسين أزرار KPIs */
                    #kpi-member-select + button,
                    #calculate-kpis-btn {
                        padding: 14px 28px;
                        font-size: 15px;
                        font-weight: 600;
                        border-radius: 10px;
                        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                        color: white;
                        border: none;
                        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
                        transition: all 0.3s ease;
                        position: relative;
                        overflow: hidden;
                    }
                    #calculate-kpis-btn::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        right: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }
                    #calculate-kpis-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
                    }
                    #calculate-kpis-btn:hover::before {
                        opacity: 1;
                    }
                    #calculate-kpis-btn:active {
                        transform: translateY(0);
                        box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
                    }
                    #calculate-kpis-btn i {
                        position: relative;
                        z-index: 1;
                    }
                    #calculate-kpis-btn span,
                    #calculate-kpis-btn {
                        position: relative;
                        z-index: 1;
                    }
                    
                    /* تحسين أزرار التبويبات الفرعية للحضور */
                    .attendance-tab-btn {
                        padding: 10px 16px;
                        font-size: 14px;
                        font-weight: 500;
                        border-radius: 8px 8px 0 0;
                        transition: all 0.3s ease;
                    }
                    .attendance-tab-btn:hover {
                        background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
                    }
                    .attendance-tab-btn.active {
                        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
                        color: #3b82f6;
                        font-weight: 600;
                    }
                    
                    /* تحسين أزرار الإعدادات */
                    #settings-container .btn-primary,
                    #settings-container .btn-secondary,
                    #settings-container .btn-danger {
                        padding: 10px 20px;
                        font-size: 13px;
                        font-weight: 600;
                        border-radius: 8px;
                    }
                    
                    /* تحسين أزرار الاستيراد */
                    #import-employee-btn {
                        padding: 10px 16px;
                        font-size: 13px;
                        font-weight: 600;
                        border-radius: 6px;
                    }
                </style>
            </div>
            
            <!-- Tab Content -->
            <div id="shm-tab-content" class="mt-6">
                <div class="content-card">
                    <div class="card-body">
                        <div class="empty-state">
                            <div style="width: 300px; margin: 0 auto 16px;">
                                <div style="width: 100%; height: 6px; background: rgba(59, 130, 246, 0.2); border-radius: 3px; overflow: hidden;">
                                    <div style="height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb, #3b82f6); background-size: 200% 100%; border-radius: 3px; animation: loadingProgress 1.5s ease-in-out infinite;"></div>
                                </div>
                            </div>
                            <p class="text-gray-500">جاري تحميل فريق السلامة...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async switchTab(tabName) {
        try {
        this.currentView = tabName;

        // Update tab buttons
        document.querySelectorAll('.shm-tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Load appropriate content
        const contentContainer = document.getElementById('shm-tab-content');
            if (!contentContainer) {
                Utils.safeError('عنصر المحتوى غير موجود');
                return;
            }

            // لا نعرض تحذير هنا - سيتم التعامل مع الأخطاء في كل دالة على حدة

        switch (tabName) {
            case 'team':
                contentContainer.innerHTML = await this.renderTeamView();
                    // استخدام requestAnimationFrame لضمان تحميل DOM أولاً وربط زر إضافة عضو
                    requestAnimationFrame(() => {
                        this.setupEventListeners();
                        this.loadTeamMembers();
                    });
                break;
            case 'structure':
                contentContainer.innerHTML = await this.renderStructureView();
                // ربط زر إضافة المنصب فوراً باستخدام requestAnimationFrame
                requestAnimationFrame(() => {
                    const addBtn = document.getElementById('add-structure-btn');
                    if (addBtn) {
                        // إزالة أي مستمعين سابقين
                        const newBtn = addBtn.cloneNode(true);
                        addBtn.parentNode.replaceChild(newBtn, addBtn);
                        newBtn.addEventListener('click', () => this.showStructureForm());
                    }
                    // تحميل البيانات بشكل متوازي
                    this.loadOrganizationalStructure();
                });
                break;
            case 'job-descriptions':
                contentContainer.innerHTML = await this.renderJobDescriptionsView();
                    requestAnimationFrame(() => {
                        // ربط زر إضافة وصف وظيفي فوراً (يعمل حتى مع عدم وجود أعضاء بعد)
                        const addJdBtn = document.getElementById('add-job-description-btn');
                        if (addJdBtn) {
                            const newJdBtn = addJdBtn.cloneNode(true);
                            addJdBtn.parentNode.replaceChild(newJdBtn, addJdBtn);
                            newJdBtn.addEventListener('click', () => this.showJobDescriptionForm());
                        }
                        this.loadJobDescriptions();
                    });
                break;
            case 'kpis':
                contentContainer.innerHTML = await this.renderKPIsView();
                    requestAnimationFrame(() => {
                this.loadKPIs();
                    });
                break;
            case 'reports':
                contentContainer.innerHTML = await this.renderReportsView();
                    requestAnimationFrame(() => {
                this.loadReports();
                    });
                    break;
                case 'attendance':
                    contentContainer.innerHTML = await this.renderAttendanceView();
                    requestAnimationFrame(() => {
                        this.loadAttendance();
                    });
                break;
            case 'analysis':
                contentContainer.innerHTML = await this.renderAnalysisView();
                requestAnimationFrame(() => {
                    this.loadAnalysis();
                });
                break;
            case 'settings':
                if (AppState.currentUser?.role === 'admin') {
                    contentContainer.innerHTML = await this.renderSettingsView();
                        requestAnimationFrame(() => {
                    this.loadSettings();
                        });
                    } else {
                        Notification.error('ليس لديك صلاحية للوصول إلى الإعدادات');
                        // العودة إلى تبويب فريق السلامة
                        await this.switchTab('team');
                }
                break;
                default:
                    Utils.safeWarn('تبويب غير معروف: ' + tabName);
                break;
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في تبديل التبويب:', errorMessage, error);
            Notification.error('حدث خطأ أثناء تحميل التبويب: ' + errorMessage);
        }
    },

    // ===== Team Management =====
    async renderTeamView() {
        return `
            <div class="content-card">
                <div class="card-header">
                    <div class="flex items-center justify-between flex-wrap gap-4">
                        <h2 class="card-title"><i class="fas fa-users ml-2"></i>إدارة فريق السلامة</h2>
                        <button id="add-team-member-btn" class="btn-primary">
                            <i class="fas fa-plus ml-2"></i>
                            إضافة عضو جديد
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Filters -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">البحث</label>
                            <input type="text" id="filter-search" class="form-input" placeholder="اسم الموظف..." oninput="SafetyHealthManagement.applyFilters()">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">القسم</label>
                            <select id="filter-department" class="form-input" onchange="SafetyHealthManagement.applyFilters()">
                                <option value="">جميع الأقسام</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">الوظيفة</label>
                            <select id="filter-job-title" class="form-input" onchange="SafetyHealthManagement.applyFilters()">
                                <option value="">جميع الوظائف</option>
                            </select>
                        </div>
                        <div class="flex items-end">
                            <button onclick="SafetyHealthManagement.clearFilters()" class="btn-secondary w-full">
                                <i class="fas fa-times ml-2"></i>إعادة تعيين
                            </button>
                        </div>
                    </div>
                    <div id="team-members-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <div class="empty-state">
                            <p class="text-gray-500">جاري التحميل...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadTeamMembers() {
        const container = document.getElementById('team-members-list');
        if (!container) return;

        // منع العمليات المتزامنة
        if (this.loadingStates.team) {
            Utils.safeLog('⚠️ loadTeamMembers: عملية قيد التنفيذ، تم تجاهل الطلب');
            return;
        }
        this.loadingStates.team = true;

        // استخدام Cache إذا كان متاحاً
        if (this.cache.members && this.cache.lastLoad &&
            (Date.now() - this.cache.lastLoad) < this.cache.cacheTimeout) {
            this.renderTeamMembers(this.cache.members);
            this.loadFilterOptions(this.cache.members);
            this.loadingStates.team = false;
            return;
        }

        try {
            Loading.show();
            
            // التحقق من إمكانية الوصول للبيانات (الخادم أو بيانات محلية)
            const accessMessage = this.getDataAccessMessage('getSafetyTeamMembers', {});
            if (accessMessage) {
                container.innerHTML = `<div class="empty-state col-span-full"><p class="text-yellow-600">${accessMessage}</p></div>`;
                Loading.hide();
                this.loadingStates.team = false;
                return;
            }
            
            // محاولة جلب البيانات (سيعيد البيانات المحلية تلقائياً إذا لم يكن الخادم مفعّلاً)
            const response = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamMembers',
                data: {}
            });

            // Handle both success and failure cases gracefully
            if (response && response.success && response.data) {
                const members = Array.isArray(response.data) ? response.data : [];
                this.allMembers = members; // Store for filtering

                // حفظ في Cache
                this.cache.members = members;
                this.cache.lastLoad = Date.now();

                if (members.length === 0) {
                    container.innerHTML = '<div class="empty-state col-span-full"><p class="text-gray-500">لا توجد أعضاء مسجلين</p></div>';
                    Loading.hide();
                    this.loadingStates.team = false;
                    return;
                }

                // Load filter options
                this.loadFilterOptions(members);

                // Apply filters and render
                this.renderTeamMembers(members);
            } else {
                // Handle case when backend is not enabled or returns empty result
                // Don't show error, just show empty state
                container.innerHTML = '<div class="empty-state col-span-full"><p class="text-gray-500">لا توجد أعضاء مسجلين</p></div>';
            }
        } catch (error) {
            // تجاهل أخطاء Chrome Extensions تلقائياً
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            const isChromeExtensionError = errorMessage.includes('runtime.lastError') ||
                errorMessage.includes('message port closed') ||
                errorMessage.includes('Receiving end does not exist') ||
                errorMessage.includes('Could not establish connection') ||
                errorMessage.includes('Extension context invalidated') ||
                errorMessage.includes('The message port closed before a response was received');

            // إذا كان خطأ Chrome Extension، نتجاهله تماماً ونحاول مرة أخرى
            if (isChromeExtensionError) {
                Utils.safeLog('⚠ تم تجاهل خطأ Chrome Extension في loadTeamMembers');
                // إعادة المحاولة بعد ثانية واحدة
                setTimeout(() => {
                    this.loadTeamMembers();
                }, 1000);
                Loading.hide();
                return;
            }

            // Don't log errors for backend not enabled - just show empty state
            if (!errorMessage.includes('الخادم') && !errorMessage.includes('غير مفعّل') && !errorMessage.includes('الاتصال')) {
                Utils.safeError('خطأ في تحميل أعضاء الفريق:', errorMessage, error);
            }

            // Show empty state instead of error message for better UX
            container.innerHTML = '<div class="empty-state col-span-full"><p class="text-gray-500">لا توجد أعضاء مسجلين</p></div>';
        } finally {
            Loading.hide();
            this.loadingStates.team = false;
        }
    },

    loadFilterOptions(members) {
        // Load departments
        const departments = [...new Set(members.map(m => m.department).filter(Boolean))];
        const deptSelect = document.getElementById('filter-department');
        if (deptSelect) {
            deptSelect.innerHTML = '<option value="">جميع الأقسام</option>' +
                departments.map(d => `<option value="${Utils.escapeHTML(d)}">${Utils.escapeHTML(d)}</option>`).join('');
        }

        // Load job titles
        const jobTitles = [...new Set(members.map(m => m.jobTitle).filter(Boolean))];
        const jobSelect = document.getElementById('filter-job-title');
        if (jobSelect) {
            jobSelect.innerHTML = '<option value="">جميع الوظائف</option>' +
                jobTitles.map(j => `<option value="${Utils.escapeHTML(j)}">${Utils.escapeHTML(j)}</option>`).join('');
        }
    },

    applyFilters() {
        if (!this.allMembers) return;

        const search = (document.getElementById('filter-search')?.value || '').toLowerCase();
        const department = document.getElementById('filter-department')?.value || '';
        const jobTitle = document.getElementById('filter-job-title')?.value || '';

        this.filters.search = search;
        this.filters.department = department;
        this.filters.jobTitle = jobTitle;

        const filtered = this.allMembers.filter(member => {
            const matchesSearch = !search ||
                (member.name || '').toLowerCase().includes(search) ||
                (member.email || '').toLowerCase().includes(search) ||
                (member.phone || '').includes(search);
            const matchesDept = !department || member.department === department;
            const matchesJob = !jobTitle || member.jobTitle === jobTitle;

            return matchesSearch && matchesDept && matchesJob;
        });

        this.renderTeamMembers(filtered);
    },

    clearFilters() {
        if (document.getElementById('filter-search')) document.getElementById('filter-search').value = '';
        if (document.getElementById('filter-department')) document.getElementById('filter-department').value = '';
        if (document.getElementById('filter-job-title')) document.getElementById('filter-job-title').value = '';
        this.filters = { department: '', jobTitle: '', period: '', search: '' };
        if (this.allMembers) {
            this.renderTeamMembers(this.allMembers);
        }
    },

    renderTeamMembers(members) {
        const container = document.getElementById('team-members-list');
        if (!container) return;

        if (members.length === 0) {
            container.innerHTML = '<div class="empty-state col-span-full"><p class="text-gray-500">لا توجد نتائج</p></div>';
            return;
        }

        container.innerHTML = members.map(member => `
            <div class="member-card bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div class="flex flex-col items-center text-center mb-3">
                    ${member.photo ? `
                        <img src="${Utils.escapeHTML(member.photo)}" alt="${Utils.escapeHTML(member.name)}" 
                             class="w-20 h-20 rounded-full object-cover border-4 border-blue-100 mb-3">
                    ` : `
                        <div class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-3 shadow-lg">
                            <i class="fas fa-user text-3xl text-white"></i>
                        </div>
                    `}
                    <div class="w-full">
                        <h3 class="font-bold text-gray-800 text-lg mb-1">${Utils.escapeHTML(member.name || '')}</h3>
                        <p class="text-sm font-semibold text-blue-600 mb-1">${Utils.escapeHTML(member.jobTitle || '')}</p>
                        <p class="text-xs text-gray-500 mb-2">${Utils.escapeHTML(member.department || '')}</p>
                        ${member.positionLevel ? `<span class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">${Utils.escapeHTML(member.positionLevel)}</span>` : ''}
                    </div>
                </div>
                <div class="space-y-2 text-sm text-gray-600 mb-4 pt-4 border-t border-gray-100">
                    ${member.email ? `
                        <div class="flex items-center gap-2">
                            <i class="fas fa-envelope text-blue-500 w-4"></i>
                            <span class="truncate">${Utils.escapeHTML(member.email)}</span>
                        </div>
                    ` : ''}
                    ${member.phone ? `
                        <div class="flex items-center gap-2">
                            <i class="fas fa-phone text-green-500 w-4"></i>
                            <span>${Utils.escapeHTML(member.phone)}</span>
                        </div>
                    ` : ''}
                    ${member.appointmentDate ? `
                        <div class="flex items-center gap-2">
                            <i class="fas fa-calendar text-purple-500 w-4"></i>
                            <span>تاريخ التعيين: ${Utils.formatDate(member.appointmentDate)}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="flex gap-2 pt-3 border-t border-gray-200">
                    <button onclick="SafetyHealthManagement.viewMember('${member.id}')" class="btn-primary btn-sm flex-1">
                        <i class="fas fa-eye ml-1"></i>
                        عرض
                    </button>
                    <button onclick="SafetyHealthManagement.showMemberForm(${JSON.stringify(member).replace(/"/g, '&quot;')})" class="btn-secondary btn-sm" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="SafetyHealthManagement.deleteMember('${member.id}')" class="btn-danger btn-sm" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    setupEventListeners() {
        // استخدام requestAnimationFrame للسرعة بدلاً من setTimeout
        requestAnimationFrame(() => {
            const addBtn = document.getElementById('add-team-member-btn');
            if (addBtn) {
                // إزالة المستمع السابق إن وجد لتجنب التكرار
                const newBtn = addBtn.cloneNode(true);
                addBtn.parentNode.replaceChild(newBtn, addBtn);
                newBtn.addEventListener('click', () => this.showMemberForm());
            }
            
            // Export Excel button
            const exportExcelBtn = document.getElementById('shm-export-excel-btn');
            if (exportExcelBtn) {
                // إزالة المستمع السابق إن وجد
                const newExportBtn = exportExcelBtn.cloneNode(true);
                exportExcelBtn.parentNode.replaceChild(newExportBtn, exportExcelBtn);
                newExportBtn.addEventListener('click', () => this.exportAllToExcel());
            }
        });
    },

    async showMemberForm(data = null) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2 class="modal-title">${data ? 'تعديل عضو الفريق' : 'إضافة عضو جديد'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="team-member-form" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الاسم *</label>
                                <input type="text" id="member-name" required class="form-input" 
                                    value="${Utils.escapeHTML(data?.name || '')}" placeholder="اسم العضو">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الوظيفة *</label>
                                <input type="text" id="member-job-title" required class="form-input" 
                                    value="${Utils.escapeHTML(data?.jobTitle || '')}" placeholder="الوظيفة">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">القسم *</label>
                                <input type="text" id="member-department" required class="form-input" 
                                    value="${Utils.escapeHTML(data?.department || '')}" placeholder="القسم">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">البريد الإلكتروني</label>
                                <input type="email" id="member-email" class="form-input" 
                                    value="${Utils.escapeHTML(data?.email || '')}" placeholder="email@example.com">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الهاتف</label>
                                <input type="tel" id="member-phone" class="form-input" 
                                    value="${Utils.escapeHTML(data?.phone || '')}" placeholder="0123456789">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">تاريخ التعيين</label>
                                <input type="date" id="member-appointment-date" class="form-input" 
                                    value="${data?.appointmentDate ? new Date(data.appointmentDate).toISOString().split('T')[0] : ''}">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الدرجة الوظيفية</label>
                                <input type="text" id="member-position-level" class="form-input" 
                                    value="${Utils.escapeHTML(data?.positionLevel || '')}" placeholder="مثال: مدير، مشرف">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">رمز الموظف (الكود الوظيفي)</label>
                                <div class="flex gap-2">
                                    <input type="text" id="member-employee-code" class="form-input flex-1" 
                                        value="${Utils.escapeHTML(data?.employeeCode || '')}" placeholder="أدخل الكود الوظيفي">
                                    <button type="button" id="import-employee-btn" class="btn-secondary" title="استيراد من قاعدة بيانات الموظفين">
                                        <i class="fas fa-download ml-1"></i>
                                        استيراد
                                    </button>
                                </div>
                                <p class="text-xs text-gray-500 mt-1">أدخل الكود الوظيفي واضغط على "استيراد" لملء البيانات تلقائياً</p>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">صورة شخصية (رابط URL)</label>
                            <input type="url" id="member-photo" class="form-input" 
                                value="${Utils.escapeHTML(data?.photo || '')}" placeholder="https://example.com/photo.jpg">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button type="button" id="save-member-btn" class="btn-primary">حفظ</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Setup employee import functionality
        const importBtn = modal.querySelector('#import-employee-btn');
        const employeeCodeInput = modal.querySelector('#member-employee-code');

        if (importBtn && employeeCodeInput) {
            importBtn.addEventListener('click', () => this.importEmployeeFromDatabase(modal));

            // Also allow Enter key to trigger import
            employeeCodeInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.importEmployeeFromDatabase(modal);
                }
            });
        }

        const saveBtn = modal.querySelector('#save-member-btn');
        const form = modal.querySelector('#team-member-form');
        saveBtn.addEventListener('click', () => this.handleMemberSubmit(form, data?.id, modal));

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async importEmployeeFromDatabase(modal) {
        const employeeCodeInput = modal.querySelector('#member-employee-code');
        if (!employeeCodeInput) return;

        const employeeCode = employeeCodeInput.value.trim();
        if (!employeeCode) {
            Notification.error('يرجى إدخال الكود الوظيفي أولاً');
            employeeCodeInput.focus();
            return;
        }

        try {
            Loading.show();

            // Try to find employee using EmployeeHelper first (from cached data)
            let employee = null;
            if (typeof EmployeeHelper !== 'undefined' && EmployeeHelper.findByCode) {
                employee = EmployeeHelper.findByCode(employeeCode);
            }

            // If not found in cache, try to fetch from قاعدة البيانات
            if (!employee) {
                try {
                    // Try to read from Employees sheet directly
                    const response = await GoogleIntegration.sendRequest({
                        action: 'readFromSheet',
                        data: { sheetName: 'Employees' }
                    });

                    if (response.success && response.data) {
                        const employees = Array.isArray(response.data) ? response.data : [];
                        employee = employees.find(emp => {
                            const code = String(emp.employeeNumber || emp.sapId || emp.employeeCode || emp.id || '').trim();
                            return code === employeeCode || code.toLowerCase() === employeeCode.toLowerCase();
                        });
                    }
                } catch (error) {
                    Utils.safeError('خطأ في جلب بيانات الموظفين:', error);
                    // Try alternative: use EmployeeHelper's cached data if available
                    if (typeof EmployeeHelper !== 'undefined' && EmployeeHelper.findByPartial) {
                        employee = EmployeeHelper.findByPartial(employeeCode);
                    }
                }
            }

            if (!employee) {
                Notification.error('لم يتم العثور على موظف بهذا الكود الوظيفي: ' + employeeCode);
                Loading.hide();
                return;
            }

            // Fill form fields with employee data
            const nameInput = modal.querySelector('#member-name');
            const jobTitleInput = modal.querySelector('#member-job-title');
            const departmentInput = modal.querySelector('#member-department');
            const emailInput = modal.querySelector('#member-email');
            const phoneInput = modal.querySelector('#member-phone');
            const appointmentDateInput = modal.querySelector('#member-appointment-date');
            const positionLevelInput = modal.querySelector('#member-position-level');
            const photoInput = modal.querySelector('#member-photo');

            if (nameInput && employee.name) nameInput.value = employee.name;
            if (jobTitleInput && (employee.job || employee.position || employee.jobTitle)) {
                jobTitleInput.value = employee.job || employee.position || employee.jobTitle;
            }
            if (departmentInput && employee.department) departmentInput.value = employee.department;
            if (emailInput && employee.email) emailInput.value = employee.email;
            if (phoneInput && employee.phone) phoneInput.value = employee.phone;
            if (appointmentDateInput && employee.hireDate) {
                const hireDate = new Date(employee.hireDate);
                if (!isNaN(hireDate.getTime())) {
                    appointmentDateInput.value = hireDate.toISOString().split('T')[0];
                }
            }
            if (positionLevelInput && employee.position) positionLevelInput.value = employee.position;
            if (photoInput && employee.photo) photoInput.value = employee.photo;

            // Update employee code if needed
            if (employeeCodeInput) {
                const primaryCode = employee.employeeNumber || employee.sapId || employee.employeeCode || employeeCode;
                employeeCodeInput.value = primaryCode;
            }

            Notification.success('تم استيراد بيانات الموظف بنجاح');
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في استيراد بيانات الموظف:', errorMessage, error);
            Notification.error('حدث خطأ أثناء الاستيراد: ' + errorMessage);
        } finally {
            Loading.hide();
        }
    },

    async handleMemberSubmit(form, editId = null, modal) {
        if (!form || !form.checkValidity()) {
            if (form) form.reportValidity();
            return;
        }

        try {
            const nameInput = document.getElementById('member-name');
            const jobTitleInput = document.getElementById('member-job-title');
            const departmentInput = document.getElementById('member-department');
            const emailInput = document.getElementById('member-email');
            const phoneInput = document.getElementById('member-phone');
            const appointmentDateInput = document.getElementById('member-appointment-date');
            const positionLevelInput = document.getElementById('member-position-level');
            const employeeCodeInput = document.getElementById('member-employee-code');
            const photoInput = document.getElementById('member-photo');

            if (!nameInput || !jobTitleInput || !departmentInput) {
                Notification.error('حدث خطأ: بعض الحقول المطلوبة غير موجودة');
                return;
            }

            const formData = {
                name: nameInput.value.trim(),
                jobTitle: jobTitleInput.value.trim(),
                department: departmentInput.value.trim(),
                email: emailInput ? emailInput.value.trim() : '',
                phone: phoneInput ? phoneInput.value.trim() : '',
                appointmentDate: appointmentDateInput && appointmentDateInput.value ? appointmentDateInput.value : null,
                positionLevel: positionLevelInput ? positionLevelInput.value.trim() : '',
                employeeCode: employeeCodeInput ? employeeCodeInput.value.trim() : '',
                photo: photoInput ? photoInput.value.trim() : '',
                status: 'active'
            };

            // Validate required fields (البريد الإلكتروني غير مطلوب)
            if (!formData.name || !formData.jobTitle || !formData.department) {
                Notification.error('يرجى ملء جميع الحقول المطلوبة');
                return;
            }

            // منع العمليات المتزامنة
            if (this.loadingStates.team) {
                Notification.warning('جاري تنفيذ عملية أخرى، يرجى الانتظار...');
                return;
            }
            this.loadingStates.team = true;

            Loading.show();
            const action = editId ? 'updateSafetyTeamMember' : 'addSafetyTeamMember';
            const payload = editId ? { memberId: editId, updateData: formData } : formData;

            const response = await GoogleIntegration.sendRequest({
                action: action,
                data: payload
            });

            if (response.success) {
                Notification.success(editId ? 'تم تحديث بيانات العضو بنجاح' : 'تم إضافة العضو بنجاح');
                // مسح Cache
                this.cache.members = null;
                if (modal) modal.remove();
                await this.loadTeamMembers();
            } else {
                const errorMessage = response.message || 'فشل الحفظ';
                Notification.error('حدث خطأ: ' + errorMessage);
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في حفظ بيانات العضو:', errorMessage, error);
            Notification.error('حدث خطأ: ' + errorMessage);
        } finally {
            Loading.hide();
            this.loadingStates.team = false;
        }
    },

    async viewMember(memberId) {
        if (!memberId) {
            Notification.error('معرف العضو غير صحيح');
            return;
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamMember',
                data: { memberId: memberId }
            });

            if (response.success && response.data) {
                const member = response.data;
                // Switch to KPIs tab and select the member
                this.currentMemberId = memberId;
                await this.switchTab('kpis');

                // استخدام requestAnimationFrame للسرعة بدلاً من setTimeout
                requestAnimationFrame(() => {
                    const kpiMemberSelect = document.getElementById('kpi-member-select');
                    if (kpiMemberSelect) {
                        kpiMemberSelect.value = memberId;
                        this.loadMemberKPIs();
                    } else {
                        // Retry مرة واحدة فقط باستخدام requestAnimationFrame
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                const retrySelect = document.getElementById('kpi-member-select');
                                if (retrySelect) {
                                    retrySelect.value = memberId;
                                    this.loadMemberKPIs();
                                }
                            });
                        });
                    }
                });
            } else {
                const errorMessage = response.message || 'عضو الفريق غير موجود';
                Notification.error(errorMessage);
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في عرض بيانات العضو:', errorMessage, error);
            Notification.error('حدث خطأ: ' + errorMessage);
        } finally {
            Loading.hide();
        }
    },

    async deleteMember(memberId) {
        if (!memberId) {
            Notification.error('معرف العضو غير صحيح');
            return;
        }

        if (!confirm('هل أنت متأكد من حذف هذا العضو من فريق السلامة؟\n\nهذه العملية لا يمكن التراجع عنها.')) {
            return;
        }

        try {
            // منع العمليات المتزامنة
            if (this.loadingStates.team) {
                Notification.warning('جاري تنفيذ عملية أخرى، يرجى الانتظار...');
                return;
            }
            this.loadingStates.team = true;

            Loading.show();

            const response = await GoogleIntegration.sendRequest({
                action: 'deleteSafetyTeamMember',
                data: { memberId: memberId }
            });

            if (response.success) {
                Notification.success('تم حذف العضو بنجاح');
                // مسح Cache
                this.cache.members = null;
                await this.loadTeamMembers();
            } else {
                const errorMessage = response.message || 'فشل الحذف';
                Notification.error('حدث خطأ: ' + errorMessage);
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في حذف العضو:', errorMessage, error);
            Notification.error('حدث خطأ: ' + errorMessage);
        } finally {
            Loading.hide();
            this.loadingStates.team = false;
        }
    },

    // ===== Organizational Structure View =====
    async renderStructureView() {
        return `
            <div class="content-card">
                <div class="card-header">
                    <div class="flex items-center justify-between">
                        <h2 class="card-title"><i class="fas fa-sitemap ml-2"></i>الهيكل الوظيفي لفريق السلامة</h2>
                        <button id="add-structure-btn" class="btn-primary">
                            <i class="fas fa-plus ml-2"></i>
                            إضافة منصب
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="organizational-structure-container" class="org-structure-tree">
                        <div class="empty-state">
                            <p class="text-gray-500">لا يوجد هيكل وظيفي مسجل</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadOrganizationalStructure() {
        const container = document.getElementById('organizational-structure-container');
        if (!container) return;

        // منع العمليات المتزامنة
        if (this.loadingStates.structure) {
            Utils.safeLog('⚠️ loadOrganizationalStructure: عملية قيد التنفيذ، تم تجاهل الطلب');
            return;
        }
        this.loadingStates.structure = true;

        // استخدام Cache إذا كان متاحاً
        if (this.cache.structure && this.cache.lastLoad &&
            (Date.now() - this.cache.lastLoad) < this.cache.cacheTimeout) {
            const structure = this.cache.structure;
            structure.sort((a, b) => (a.order || 0) - (b.order || 0));
            container.innerHTML = structure.map(item => `
                <div class="org-node" data-id="${item.id}">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-800">${Utils.escapeHTML(item.position || '')}</h3>
                            <p class="text-sm text-gray-600">${Utils.escapeHTML(item.memberName || 'غير محدد')}</p>
                            <p class="text-xs text-gray-500">${Utils.escapeHTML(item.positionLevel || '')}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="SafetyHealthManagement.editStructure('${item.id}')" class="btn-icon btn-icon-primary">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="SafetyHealthManagement.deleteStructure('${item.id}')" class="btn-icon btn-icon-danger">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            // Setup add button فوراً
            requestAnimationFrame(() => {
                const addBtn = document.getElementById('add-structure-btn');
                if (addBtn) {
                    const newBtn = addBtn.cloneNode(true);
                    addBtn.parentNode.replaceChild(newBtn, addBtn);
                    newBtn.addEventListener('click', () => this.showStructureForm());
                }
            });
            this.loadingStates.structure = false;
            return;
        }

        // التحقق من إمكانية الوصول للبيانات
        const accessMessage = this.getDataAccessMessage('getOrganizationalStructure', {});
        if (accessMessage) {
            container.innerHTML = `<div class="empty-state"><p class="text-gray-500">${accessMessage}</p></div>`;
            Loading.hide();
            this.loadingStates.structure = false;
            return;
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'getOrganizationalStructure',
                data: {}
            });

            if (response.success && response.data) {
                const structure = Array.isArray(response.data) ? response.data : [];

                if (structure.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p class="text-gray-500">لا يوجد هيكل وظيفي مسجل</p></div>';
                    Loading.hide();
                    return;
                }

                // Sort by order
                structure.sort((a, b) => (a.order || 0) - (b.order || 0));

                // حفظ في Cache
                this.cache.structure = structure;
                this.cache.lastLoad = Date.now();

                container.innerHTML = structure.map(item => `
                    <div class="org-node" data-id="${item.id}">
                        <div class="flex items-center justify-between">
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-800">${Utils.escapeHTML(item.position || '')}</h3>
                                <p class="text-sm text-gray-600">${Utils.escapeHTML(item.memberName || 'غير محدد')}</p>
                                <p class="text-xs text-gray-500">${Utils.escapeHTML(item.positionLevel || '')}</p>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="SafetyHealthManagement.editStructure('${item.id}')" class="btn-icon btn-icon-primary">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="SafetyHealthManagement.deleteStructure('${item.id}')" class="btn-icon btn-icon-danger">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');

                // Setup add button فوراً
                requestAnimationFrame(() => {
                    const addBtn = document.getElementById('add-structure-btn');
                    if (addBtn) {
                        const newBtn = addBtn.cloneNode(true);
                        addBtn.parentNode.replaceChild(newBtn, addBtn);
                        newBtn.addEventListener('click', () => this.showStructureForm());
                    }
                });
            } else {
                container.innerHTML = '<div class="empty-state"><p class="text-gray-500">لا يوجد هيكل وظيفي مسجل</p></div>';
                // Setup add button even when there's no data
                requestAnimationFrame(() => {
                    const addBtn = document.getElementById('add-structure-btn');
                    if (addBtn) {
                        const newBtn = addBtn.cloneNode(true);
                        addBtn.parentNode.replaceChild(newBtn, addBtn);
                        newBtn.addEventListener('click', () => this.showStructureForm());
                    }
                });
            }
        } catch (error) {
            // تجاهل أخطاء Chrome Extensions تلقائياً
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            const isChromeExtensionError = errorMessage.includes('runtime.lastError') ||
                errorMessage.includes('message port closed') ||
                errorMessage.includes('Receiving end does not exist') ||
                errorMessage.includes('Could not establish connection') ||
                errorMessage.includes('Extension context invalidated') ||
                errorMessage.includes('The message port closed before a response was received');

            // إذا كان خطأ Chrome Extension، نتجاهله تماماً ونحاول مرة أخرى
            if (isChromeExtensionError) {
                Utils.safeLog('⚠ تم تجاهل خطأ Chrome Extension في loadOrganizationalStructure');
                setTimeout(() => {
                    this.loadOrganizationalStructure();
                }, 1000);
                Loading.hide();
                return;
            }

            // لا نعرض خطأ في Console إذا كان الخادم غير مفعّل (تم التحقق مسبقاً)
            if (this.isBackendAvailable()) Utils.safeError('خطأ في تحميل الهيكل الوظيفي:', errorMessage, error);

            let displayMessage = 'لا يوجد هيكل وظيفي مسجل';
            let showError = false;

            if (errorMessage.includes('غير معترف به') || errorMessage.includes('Action not recognized') || errorMessage.includes('ACTION_NOT_RECOGNIZED')) {
                displayMessage = errorMessage;
                showError = isGoogleEnabled;
            } else if (errorMessage.includes('غير مفعّل') && errorMessage.includes('الاتصال')) {
                displayMessage = 'الاتصال بقاعدة البيانات غير مفعّل. يرجى تفعيله من الإعدادات';
                    showError = false;
            } else if (isGoogleEnabled && (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('CORS'))) {
                    displayMessage = 'فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت والإعدادات';
                showError = true;
            } else if (isGoogleEnabled && errorMessage.includes('فشل الاتصال')) {
                displayMessage = errorMessage;
                showError = true;
            }

            container.innerHTML = `
                <div class="empty-state">
                    <p class="${showError ? 'text-red-500' : 'text-gray-500'} mb-2">${Utils.escapeHTML(displayMessage)}</p>
                    ${showError ? `
                    <button onclick="SafetyHealthManagement.loadOrganizationalStructure()" class="btn-secondary btn-sm mt-2">
                        <i class="fas fa-redo ml-1"></i>إعادة المحاولة
                    </button>
                    ` : ''}
                </div>
            `;
        } finally {
            Loading.hide();
            this.loadingStates.structure = false;
        }
    },

    async showStructureForm(data = null) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 class="modal-title">${data ? 'تعديل المنصب' : 'إضافة منصب جديد'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="structure-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">المنصب *</label>
                            <input type="text" id="structure-position" required class="form-input" 
                                value="${Utils.escapeHTML(data?.position || '')}" placeholder="مثال: مدير السلامة">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">الدرجة الوظيفية</label>
                            <input type="text" id="structure-position-level" class="form-input" 
                                value="${Utils.escapeHTML(data?.positionLevel || '')}" placeholder="مثال: مدير">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">عضو الفريق</label>
                            <select id="structure-member-id" class="form-input">
                                <option value="">اختر عضو الفريق</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">الترتيب</label>
                            <input type="number" id="structure-order" class="form-input" 
                                value="${data?.order || 0}" min="0">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">الوصف</label>
                            <textarea id="structure-description" class="form-input" rows="3" 
                                placeholder="وصف المنصب">${Utils.escapeHTML(data?.description || '')}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button type="button" id="save-structure-btn" class="btn-primary">حفظ</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Load team members for dropdown
        await this.loadTeamMembersForDropdown(modal.querySelector('#structure-member-id'), data?.memberId);

        const saveBtn = modal.querySelector('#save-structure-btn');
        const form = modal.querySelector('#structure-form');
        saveBtn.addEventListener('click', () => this.handleStructureSubmit(form, data?.id, modal));

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async loadTeamMembersForDropdown(selectElement, selectedId = null) {
        if (!selectElement) return;

        // التحقق من إمكانية الوصول للبيانات
        const accessMessage = this.getDataAccessMessage('getSafetyTeamMembers', {});
        if (accessMessage) {
            selectElement.innerHTML = `<option value="">${accessMessage}</option>`;
            return;
        }

        try {
            const response = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamMembers',
                data: {}
            });

            if (response.success && response.data) {
                const members = Array.isArray(response.data) ? response.data : [];
                selectElement.innerHTML = '<option value="">اختر عضو الفريق</option>' +
                    members.map(m => `
                        <option value="${m.id}" ${m.id === selectedId ? 'selected' : ''}>
                            ${Utils.escapeHTML(m.name || '')} - ${Utils.escapeHTML(m.jobTitle || '')}
                        </option>
                    `).join('');
            }
        } catch (error) {
            Utils.safeError('خطأ في تحميل أعضاء الفريق:', error);
        }
    },

    async handleStructureSubmit(form, editId = null, modal) {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const memberId = document.getElementById('structure-member-id').value;
        let memberName = '';
        if (memberId) {
            try {
                const response = await GoogleIntegration.sendRequest({
                    action: 'getSafetyTeamMember',
                    data: { memberId: memberId }
                });
                if (response.success && response.data) {
                    memberName = response.data.name || '';
                }
            } catch (e) {
                // Ignore
            }
        }

        const formData = {
            position: document.getElementById('structure-position').value.trim(),
            positionLevel: document.getElementById('structure-position-level').value.trim(),
            memberId: memberId || null,
            memberName: memberName,
            order: parseInt(document.getElementById('structure-order').value) || 0,
            description: document.getElementById('structure-description').value.trim()
        };
        if (editId) formData.id = editId;

        // منع العمليات المتزامنة
        if (this.loadingStates.structure) {
            Notification.warning('جاري تنفيذ عملية أخرى، يرجى الانتظار...');
            return;
        }
        this.loadingStates.structure = true;

        Loading.show();
        try {
            const response = await GoogleIntegration.sendRequest({
                action: 'saveOrganizationalStructure',
                data: formData
            });

            if (response.success) {
                Notification.success(editId ? 'تم تحديث المنصب بنجاح' : 'تم إضافة المنصب بنجاح');
                // مسح Cache
                this.cache.structure = null;
                modal.remove();
                await this.loadOrganizationalStructure();
            } else {
                Notification.error('حدث خطأ: ' + (response.message || 'فشل الحفظ'));
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في حفظ المنصب:', errorMessage, error);
            Notification.error('حدث خطأ: ' + errorMessage);
        } finally {
            Loading.hide();
            this.loadingStates.structure = false;
        }
    },

    async editStructure(id) {
        // منع العمليات المتزامنة
        if (this.loadingStates.structure) {
            Notification.warning('جاري تنفيذ عملية أخرى، يرجى الانتظار...');
            return;
        }

        try {
            Loading.show();
            // استخدام Cache إذا كان متاحاً
            let structure = this.cache.structure;
            if (!structure) {
                const response = await GoogleIntegration.sendRequest({
                    action: 'getOrganizationalStructure',
                    data: {}
                });
                if (response.success && response.data) {
                    structure = Array.isArray(response.data) ? response.data : [];
                    this.cache.structure = structure;
                } else {
                    Notification.error('فشل جلب بيانات الهيكل الوظيفي');
                    Loading.hide();
                    return;
                }
            }

            const item = structure.find(s => s.id === id);
            if (item) {
                this.showStructureForm(item);
            } else {
                Notification.error('المنصب غير موجود');
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في تحميل المنصب:', errorMessage, error);
            Notification.error('حدث خطأ: ' + errorMessage);
        } finally {
            Loading.hide();
        }
    },

    async deleteStructure(id) {
        if (!confirm('هل أنت متأكد من حذف هذا المنصب؟\n\nهذه العملية لا يمكن التراجع عنها.')) return;

        try {
            // منع العمليات المتزامنة
            if (this.loadingStates.structure) {
                Notification.warning('جاري تنفيذ عملية أخرى، يرجى الانتظار...');
                return;
            }
            this.loadingStates.structure = true;

            Loading.show();

            // الحصول على الهيكل الحالي
            const response = await GoogleIntegration.sendRequest({
                action: 'getOrganizationalStructure',
                data: {}
            });

            if (response.success && response.data) {
                const structure = Array.isArray(response.data) ? response.data : [];
                const filtered = structure.filter(item => item.id !== id);

                // حفظ الهيكل المحدث
                const saveResponse = await GoogleIntegration.sendRequest({
                    action: 'saveOrganizationalStructure',
                    data: { structure: filtered }
                });

                if (saveResponse.success) {
                    Notification.success('تم حذف المنصب بنجاح');
                    // مسح Cache
                    this.cache.structure = null;
                    await this.loadOrganizationalStructure();
                } else {
                    Notification.error('حدث خطأ: ' + (saveResponse.message || 'فشل الحذف'));
                }
            } else {
                Notification.error('فشل جلب بيانات الهيكل الوظيفي');
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في حذف المنصب:', errorMessage, error);
            Notification.error('حدث خطأ: ' + errorMessage);
        } finally {
            Loading.hide();
            this.loadingStates.structure = false;
        }
    },

    // ===== Job Descriptions View =====
    async renderJobDescriptionsView() {
        return `
            <div class="content-card">
                <div class="card-header">
                    <div class="flex items-center justify-between">
                        <h2 class="card-title"><i class="fas fa-file-alt ml-2"></i>الوصف الوظيفي</h2>
                        <button id="add-job-description-btn" class="btn-primary">
                            <i class="fas fa-plus ml-2"></i>
                            إضافة وصف وظيفي
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="job-descriptions-list" class="space-y-4">
                        <div class="empty-state">
                            <p class="text-gray-500">لا توجد أوصاف وظيفية مسجلة</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadJobDescriptions() {
        const container = document.getElementById('job-descriptions-list');
        if (!container) return;

        // التحقق من إمكانية الوصول للبيانات
        const accessMessage = this.getDataAccessMessage('getJobDescriptions', {});
        if (accessMessage) {
            container.innerHTML = `<div class="empty-state"><p class="text-gray-500">${accessMessage}</p></div>`;
            Loading.hide();
            return;
        }

        try {
            Loading.show();
            // Get all team members first
            const membersResponse = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamMembers',
                data: {}
            });

            if (membersResponse.success && membersResponse.data) {
                const members = Array.isArray(membersResponse.data) ? membersResponse.data : [];

                if (members.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p class="text-gray-500">لا توجد أعضاء لإضافة أوصاف وظيفية</p></div>';
                    Loading.hide();
                    return;
                }

                // Load job descriptions for each member
                const jobDescriptions = [];
                for (const member of members) {
                    try {
                        const jdResponse = await GoogleIntegration.sendRequest({
                            action: 'getJobDescription',
                            data: { memberId: member.id }
                        });
                        if (jdResponse.success && jdResponse.data) {
                            jobDescriptions.push({ ...jdResponse.data, member: member });
                        } else {
                            jobDescriptions.push({ member: member, hasDescription: false });
                        }
                    } catch (e) {
                        jobDescriptions.push({ member: member, hasDescription: false });
                    }
                }

                if (jobDescriptions.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p class="text-gray-500">لا توجد أوصاف وظيفية مسجلة</p></div>';
                    Loading.hide();
                    return;
                }

                container.innerHTML = jobDescriptions.map(jd => `
                    <div class="bg-white border border-gray-200 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <h3 class="font-semibold text-gray-800">${Utils.escapeHTML(jd.member.name || '')}</h3>
                                <p class="text-sm text-gray-600">${Utils.escapeHTML(jd.member.jobTitle || '')}</p>
                            </div>
                            <button onclick="SafetyHealthManagement.showJobDescriptionForm('${jd.member.id}', ${jd.hasDescription !== false ? JSON.stringify(jd).replace(/"/g, '&quot;') : 'null'})" class="btn-primary btn-sm">
                                <i class="fas fa-${jd.hasDescription !== false ? 'edit' : 'plus'} ml-2"></i>
                                ${jd.hasDescription !== false ? 'تعديل' : 'إضافة'}
                            </button>
                        </div>
                        ${jd.hasDescription !== false ? `
                            <div class="mt-3 space-y-2">
                                <div><strong>الدور الوظيفي:</strong> ${Utils.escapeHTML(jd.roleDescription || '—')}</div>
                                <div><strong>المسؤوليات:</strong> ${Utils.escapeHTML(jd.responsibilities || '—')}</div>
                                <div><strong>المهام:</strong> ${Utils.escapeHTML(jd.tasks || '—')}</div>
                            </div>
                        ` : '<p class="text-gray-500 text-sm">لا يوجد وصف وظيفي مسجل</p>'}
                    </div>
                `).join('');

                // زر إضافة وصف وظيفي مربوط مسبقاً في switchTab
            }
        } catch (error) {
            // تجاهل أخطاء Chrome Extensions تلقائياً
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            const isChromeExtensionError = errorMessage.includes('runtime.lastError') ||
                errorMessage.includes('message port closed') ||
                errorMessage.includes('Receiving end does not exist') ||
                errorMessage.includes('Could not establish connection') ||
                errorMessage.includes('Extension context invalidated') ||
                errorMessage.includes('The message port closed before a response was received');

            // إذا كان خطأ Chrome Extension، نتجاهله تماماً ونحاول مرة أخرى
            if (isChromeExtensionError) {
                Utils.safeLog('⚠ تم تجاهل خطأ Chrome Extension في loadJobDescriptions');
                setTimeout(() => {
                    this.loadJobDescriptions();
                }, 1000);
                Loading.hide();
                return;
            }

            // لا نعرض خطأ في Console إذا كان الخادم غير مفعّل (تم التحقق مسبقاً)
            if (this.isBackendAvailable()) Utils.safeError('خطأ في تحميل الأوصاف الوظيفية:', errorMessage, error);

            let displayMessage = 'لا توجد أوصاف وظيفية مسجلة';
            let showError = false;

            if (errorMessage.includes('غير معترف به') || errorMessage.includes('Action not recognized') || errorMessage.includes('ACTION_NOT_RECOGNIZED')) {
                displayMessage = errorMessage;
                showError = isGoogleEnabled;
            } else if (errorMessage.includes('غير مفعّل') && errorMessage.includes('الاتصال')) {
                displayMessage = 'الاتصال بقاعدة البيانات غير مفعّل. يرجى تفعيله من الإعدادات';
                    showError = false;
            } else if (isGoogleEnabled && (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('CORS'))) {
                    displayMessage = 'فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت والإعدادات';
                showError = true;
            } else if (isGoogleEnabled && errorMessage.includes('فشل الاتصال')) {
                displayMessage = errorMessage;
                showError = true;
            }

            container.innerHTML = `
                <div class="empty-state">
                    <p class="${showError ? 'text-red-500' : 'text-gray-500'} mb-2">${Utils.escapeHTML(displayMessage)}</p>
                    ${showError ? `
                    <button onclick="SafetyHealthManagement.loadJobDescriptions()" class="btn-secondary btn-sm mt-2">
                        <i class="fas fa-redo ml-1"></i>إعادة المحاولة
                    </button>
                    ` : ''}
                </div>
            `;
        } finally {
            Loading.hide();
        }
    },

    async showJobDescriptionForm(memberId = null, data = null) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2 class="modal-title">${data ? 'تعديل الوصف الوظيفي' : 'إضافة وصف وظيفي'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="job-description-form" class="space-y-4">
                        ${!data ? `
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">عضو الفريق *</label>
                            <select id="jd-member-id" required class="form-input">
                                <option value="">اختر عضو الفريق</option>
                            </select>
                        </div>
                        ` : ''}
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">الوظيفة</label>
                            <input type="text" id="jd-job-title" class="form-input" 
                                value="${Utils.escapeHTML(data?.jobTitle || '')}" placeholder="الوظيفة">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">الدور الوظيفي بالتفصيل *</label>
                            <textarea id="jd-role-description" required class="form-input" rows="4" 
                                placeholder="وصف تفصيلي للدور الوظيفي">${Utils.escapeHTML(data?.roleDescription || '')}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">المسؤوليات والمهام الأساسية *</label>
                            <textarea id="jd-responsibilities" required class="form-input" rows="5" 
                                placeholder="قائمة المسؤوليات والمهام">${Utils.escapeHTML(data?.responsibilities || '')}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">المهام الإضافية</label>
                            <textarea id="jd-tasks" class="form-input" rows="4" 
                                placeholder="المهام الإضافية">${Utils.escapeHTML(data?.tasks || '')}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">نطاق العمل</label>
                            <textarea id="jd-work-scope" class="form-input" rows="3" 
                                placeholder="نطاق العمل">${Utils.escapeHTML(data?.workScope || '')}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">المؤهلات المطلوبة</label>
                            <textarea id="jd-required-qualifications" class="form-input" rows="4" 
                                placeholder="المؤهلات المطلوبة">${Utils.escapeHTML(data?.requiredQualifications || '')}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button type="button" id="save-jd-btn" class="btn-primary">حفظ</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Load team members for dropdown if needed
        if (!data && memberId) {
            document.getElementById('jd-member-id').value = memberId;
        } else if (!data) {
            await this.loadTeamMembersForDropdown(modal.querySelector('#jd-member-id'));
        }

        const saveBtn = modal.querySelector('#save-jd-btn');
        const form = modal.querySelector('#job-description-form');
        saveBtn.addEventListener('click', () => this.handleJobDescriptionSubmit(form, data?.id, data?.memberId || memberId, modal));

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async handleJobDescriptionSubmit(form, editId = null, memberId = null, modal) {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const finalMemberId = memberId || document.getElementById('jd-member-id').value;
        if (!finalMemberId) {
            Notification.error('يرجى اختيار عضو الفريق');
            return;
        }

        const formData = {
            memberId: finalMemberId,
            jobTitle: document.getElementById('jd-job-title').value.trim(),
            roleDescription: document.getElementById('jd-role-description').value.trim(),
            responsibilities: document.getElementById('jd-responsibilities').value.trim(),
            tasks: document.getElementById('jd-tasks').value.trim(),
            workScope: document.getElementById('jd-work-scope').value.trim(),
            requiredQualifications: document.getElementById('jd-required-qualifications').value.trim()
        };

        Loading.show();
        try {
            const action = editId ? 'updateJobDescription' : 'saveJobDescription';
            const payload = editId ? { jobDescriptionId: editId, updateData: formData } : formData;

            const response = await GoogleIntegration.sendRequest({
                action: action,
                data: payload
            });

            if (response.success) {
                Notification.success(editId ? 'تم تحديث الوصف الوظيفي بنجاح' : 'تم إضافة الوصف الوظيفي بنجاح');
                modal.remove();
                this.loadJobDescriptions();
            } else {
                Notification.error('حدث خطأ: ' + (response.message || 'فشل الحفظ'));
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    // ===== KPIs View =====
    async renderKPIsView() {
        return `
            <div class="content-card">
                <div class="card-header">
                    <div class="flex items-center justify-between">
                        <h2 class="card-title"><i class="fas fa-chart-line ml-2"></i>مؤشرات الأداء</h2>
                        <div class="flex gap-2">
                            <select id="kpi-member-select" class="form-input" style="min-width: 200px;">
                                <option value="">جميع الأعضاء</option>
                            </select>
                            <select id="kpi-period-select" class="form-input">
                                <option value="">الفترة الحالية</option>
                                <option value="2024-01">يناير 2024</option>
                                <option value="2024-02">فبراير 2024</option>
                                <option value="2024-03">مارس 2024</option>
                            </select>
                            <button id="calculate-kpis-btn" class="btn-primary" style="padding: 14px 28px; font-size: 15px; font-weight: 600; border-radius: 10px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; border: none; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); transition: all 0.3s ease; position: relative; overflow: hidden;">
                                <i class="fas fa-calculator ml-2"></i>
                                <span>حساب مؤشرات الأداء</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div id="kpis-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="empty-state">
                            <p class="text-gray-500">اختر عضو الفريق لحساب مؤشرات الأداء</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadKPIs() {
        const container = document.getElementById('kpis-container');
        const memberSelect = document.getElementById('kpi-member-select');
        const periodSelect = document.getElementById('kpi-period-select');
        const calculateBtn = document.getElementById('calculate-kpis-btn');

        if (!container || !memberSelect) {
            Utils.safeError('عناصر KPIs غير موجودة في الصفحة');
            return;
        }

        // التحقق من إمكانية الوصول للبيانات
        const accessMessage = this.getDataAccessMessage('getSafetyTeamKPIs', {});
        if (accessMessage) {
            memberSelect.innerHTML = `<option value="">${accessMessage}</option>`;
            container.innerHTML = `<div class="empty-state"><p class="text-gray-500">${accessMessage}</p></div>`;
            return;
        }

        try {
            // Load team members for dropdown
            const membersResponse = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamMembers',
                data: {}
            });

            if (membersResponse.success && membersResponse.data) {
                const members = Array.isArray(membersResponse.data) ? membersResponse.data : [];
                memberSelect.innerHTML = '<option value="">اختر عضو الفريق</option>' +
                    members.map(m => `
                        <option value="${m.id}" ${m.id === this.currentMemberId ? 'selected' : ''}>
                            ${Utils.escapeHTML(m.name || '')}
                        </option>
                    `).join('');

                // Generate period options dynamically
                if (periodSelect) {
                    const now = new Date();
                    const currentYear = now.getFullYear();
                    const currentMonth = now.getMonth();
                    let periodOptions = '<option value="">الفترة الحالية</option>';

                    // Add last 6 months
                    for (let i = 0; i < 6; i++) {
                        const date = new Date(currentYear, currentMonth - i, 1);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const period = `${year}-${month}`;
                        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                        periodOptions += `<option value="${period}">${monthNames[date.getMonth()]} ${year}</option>`;
                    }
                    periodSelect.innerHTML = periodOptions;
                }

                // Setup event listeners
                memberSelect.addEventListener('change', () => this.loadMemberKPIs());
                if (periodSelect) {
                    periodSelect.addEventListener('change', () => {
                        if (memberSelect.value) {
                            this.loadMemberKPIs();
                        }
                    });
                }
                if (calculateBtn) {
                    calculateBtn.addEventListener('click', () => this.calculateKPIs());
                }

                // Auto-load KPIs if member is already selected
                if (this.currentMemberId && memberSelect.value === this.currentMemberId) {
                    this.loadMemberKPIs();
                }
            } else {
                const errorMessage = membersResponse.message || 'فشل تحميل أعضاء الفريق';
                container.innerHTML = `<div class="empty-state"><p class="text-red-500">${Utils.escapeHTML(errorMessage)}</p></div>`;
            }
        } catch (error) {
            // تجاهل أخطاء Chrome Extensions تلقائياً
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            const isChromeExtensionError = errorMessage.includes('runtime.lastError') ||
                errorMessage.includes('message port closed') ||
                errorMessage.includes('Receiving end does not exist') ||
                errorMessage.includes('Could not establish connection') ||
                errorMessage.includes('Extension context invalidated') ||
                errorMessage.includes('The message port closed before a response was received');

            // إذا كان خطأ Chrome Extension، نتجاهله تماماً ونحاول مرة أخرى
            if (isChromeExtensionError) {
                Utils.safeLog('⚠ تم تجاهل خطأ Chrome Extension في loadKPIs');
                setTimeout(() => {
                    this.loadKPIs();
                }, 1000);
                return;
            }

            // لا نعرض خطأ في Console إذا كان الخادم غير مفعّل (تم التحقق مسبقاً)
            if (this.isBackendAvailable() && container) Utils.safeError('خطأ في تحميل مؤشرات الأداء:', errorMessage, error);

            if (container) {
                let displayMessage = 'اختر عضو الفريق لحساب مؤشرات الأداء';
                let showError = false;

                if (errorMessage.includes('غير معترف به') || errorMessage.includes('Action not recognized') || errorMessage.includes('ACTION_NOT_RECOGNIZED')) {
                    displayMessage = errorMessage;
                    showError = isGoogleEnabled;
                } else if (errorMessage.includes('غير مفعّل') && errorMessage.includes('الاتصال')) {
                    displayMessage = 'الاتصال بقاعدة البيانات غير مفعّل. يرجى تفعيله من الإعدادات';
                        showError = false;
                } else if (isGoogleEnabled && (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('CORS'))) {
                        displayMessage = 'فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت والإعدادات';
                    showError = true;
                } else if (isGoogleEnabled && errorMessage.includes('فشل الاتصال')) {
                    displayMessage = errorMessage;
                    showError = true;
                }

                container.innerHTML = `
                    <div class="empty-state">
                        <p class="${showError ? 'text-red-500' : 'text-gray-500'} mb-2">${Utils.escapeHTML(displayMessage)}</p>
                        ${showError ? `
                        <button onclick="SafetyHealthManagement.loadKPIs()" class="btn-secondary btn-sm mt-2">
                            <i class="fas fa-redo ml-1"></i>إعادة المحاولة
                        </button>
                        ` : ''}
                    </div>
                `;
            }
        }
    },

    async loadMemberKPIs() {
        const memberSelect = document.getElementById('kpi-member-select');
        const periodSelect = document.getElementById('kpi-period-select');
        const container = document.getElementById('kpis-container');

        if (!memberSelect || !container) {
            Utils.safeError('عناصر KPIs غير موجودة في الصفحة');
            return;
        }

        const memberId = memberSelect.value;
        const period = periodSelect ? periodSelect.value : '';

        if (!memberId) {
            if (container) {
                container.innerHTML = '<div class="empty-state"><p class="text-gray-500">اختر عضو الفريق لحساب مؤشرات الأداء</p></div>';
            }
            return;
        }

        // منع العمليات المتزامنة
        if (this.loadingStates.kpis) {
            Utils.safeLog('⚠️ loadMemberKPIs: عملية قيد التنفيذ، تم تجاهل الطلب');
            return;
        }
        this.loadingStates.kpis = true;

        // استخدام Cache إذا كان متاحاً
        const cacheKey = `kpi_${memberId}_${period || 'current'}`;
        if (this.cache.kpis.has(cacheKey)) {
            const cached = this.cache.kpis.get(cacheKey);
            if (cached && cached.data && (Date.now() - cached.timestamp) < this.cache.cacheTimeout) {
                this.renderKPIs(cached.data, container);
                this.loadingStates.kpis = false;
                return;
            }
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamKPIs',
                data: { memberId: memberId, period: period || null }
            });

            if (response.success && response.data) {
                const kpis = Array.isArray(response.data) ? response.data : [response.data];
                const kpi = kpis.length > 0 ? kpis[0] : null;

                if (!kpi) {
                    container.innerHTML = '<div class="empty-state"><p class="text-gray-500">لا توجد مؤشرات أداء محسوبة. اضغط على "حساب KPIs"</p></div>';
                    Loading.hide();
                    return;
                }

                // حساب مؤشرات الأداء بشكل صحيح
                const inspectionsProgress = (kpi.targetInspections || 20) > 0 
                    ? Math.min(((kpi.inspectionsCount || 0) / (kpi.targetInspections || 20)) * 100, 100) 
                    : 0;
                // حساب نسبة الإجراءات المغلقة بشكل صحيح (نسبة مئوية من الهدف)
                const actionsProgress = (kpi.targetActionsClosure || 80);
                const observationsProgress = (kpi.targetObservations || 15) > 0 
                    ? Math.min(((kpi.observationsCount || 0) / (kpi.targetObservations || 15)) * 100, 100) 
                    : 0;
                const trainingsProgress = (kpi.targetTrainings || 2) > 0 
                    ? Math.min(((kpi.trainingsCount || 0) / (kpi.targetTrainings || 2)) * 100, 100) 
                    : 0;
                // التأكد من أن commitmentProgress رقم وليس كائن
                const commitmentProgress = typeof kpi.commitmentRate === 'number' ? kpi.commitmentRate : 
                    (typeof kpi.commitmentRate === 'object' && kpi.commitmentRate !== null ? 0 : 
                    (parseFloat(kpi.commitmentRate) || 0));

                container.innerHTML = `
                    <div class="mb-4 flex justify-end">
                        <button onclick="SafetyHealthManagement.editKPIs('${kpi.id || ''}', '${memberId}')" class="btn-primary btn-sm">
                            <i class="fas fa-edit ml-2"></i>
                            تعديل المؤشرات يدوياً
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div class="kpi-card success">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="font-semibold">الجولات التفتيشية</h3>
                                <i class="fas fa-clipboard-check text-2xl"></i>
                            </div>
                            <p class="text-3xl font-bold mb-1">${kpi.inspectionsCount || 0}</p>
                            <p class="text-sm opacity-90 mb-2">الهدف: ${kpi.targetInspections || 20}</p>
                            <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                                <div class="bg-white rounded-full h-2" style="width: ${inspectionsProgress}%"></div>
                            </div>
                        </div>
                        <div class="kpi-card warning">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="font-semibold">الإجراءات المغلقة</h3>
                                <i class="fas fa-check-circle text-2xl"></i>
                            </div>
                            <p class="text-3xl font-bold mb-1">${kpi.closedActionsCount || 0}</p>
                            <p class="text-sm opacity-90 mb-2">نسبة الإغلاق المستهدفة: ${kpi.targetActionsClosure || 80}%</p>
                            <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                                <div class="bg-white rounded-full h-2" style="width: ${Math.min(actionsProgress, 100)}%"></div>
                            </div>
                        </div>
                        <div class="kpi-card info">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="font-semibold">الملاحظات</h3>
                                <i class="fas fa-eye text-2xl"></i>
                            </div>
                            <p class="text-3xl font-bold mb-1">${kpi.observationsCount || 0}</p>
                            <p class="text-sm opacity-90 mb-2">الهدف: ${kpi.targetObservations || 15}</p>
                            <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                                <div class="bg-white rounded-full h-2" style="width: ${observationsProgress}%"></div>
                            </div>
                        </div>
                        <div class="kpi-card">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="font-semibold">التدريبات</h3>
                                <i class="fas fa-graduation-cap text-2xl"></i>
                            </div>
                            <p class="text-3xl font-bold mb-1">${kpi.trainingsCount || 0}</p>
                            <p class="text-sm opacity-90 mb-2">الهدف: ${kpi.targetTrainings || 2}</p>
                            <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                                <div class="bg-white rounded-full h-2" style="width: ${trainingsProgress}%"></div>
                            </div>
                        </div>
                        <div class="kpi-card ${commitmentProgress >= 95 ? 'success' : 'warning'}">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="font-semibold">نسبة الالتزام</h3>
                                <i class="fas fa-percentage text-2xl"></i>
                            </div>
                            <p class="text-3xl font-bold mb-1">${commitmentProgress.toFixed(1)}%</p>
                            <p class="text-sm opacity-90 mb-2">الهدف: ${kpi.targetCommitment || 95}%</p>
                            <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                                <div class="bg-white rounded-full h-2" style="width: ${commitmentProgress}%"></div>
                            </div>
                        </div>
                        ${kpi.incidentsHandledCount !== undefined ? `
                        <div class="kpi-card danger">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="font-semibold">الحوادث المعالجة</h3>
                                <i class="fas fa-exclamation-triangle text-2xl"></i>
                            </div>
                            <p class="text-3xl font-bold">${kpi.incidentsHandledCount || 0}</p>
                        </div>
                        ` : ''}
                        ${kpi.nearMissCount !== undefined ? `
                        <div class="kpi-card warning">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="font-semibold">Near Miss</h3>
                                <i class="fas fa-exclamation-circle text-2xl"></i>
                            </div>
                            <p class="text-3xl font-bold">${kpi.nearMissCount || 0}</p>
                        </div>
                        ` : ''}
                        ${kpi.ptwCount !== undefined ? `
                        <div class="kpi-card info">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="font-semibold">PTW المعالجة</h3>
                                <i class="fas fa-file-alt text-2xl"></i>
                            </div>
                            <p class="text-3xl font-bold">${kpi.ptwCount || 0}</p>
                        </div>
                        ` : ''}
                    </div>
                    <!-- Chart Visualization -->
                    <div class="bg-white border border-gray-200 rounded-lg p-6 mt-6">
                        <h3 class="font-semibold text-gray-700 mb-4">مقارنة الأداء مع الأهداف</h3>
                        <div class="space-y-4">
                            ${this.renderKPIChartBar('الجولات التفتيشية', kpi.inspectionsCount || 0, kpi.targetInspections || 20)}
                            ${this.renderKPIChartBar('الإجراءات المغلقة', kpi.closedActionsCount || 0, Math.max(kpi.closedActionsCount || 0, 10))}
                            ${this.renderKPIChartBar('الملاحظات', kpi.observationsCount || 0, kpi.targetObservations || 15)}
                            ${this.renderKPIChartBar('التدريبات', kpi.trainingsCount || 0, kpi.targetTrainings || 2)}
                        </div>
                    </div>
                    ${kpi.isManual ? '<div class="mt-2 text-sm text-yellow-600"><i class="fas fa-info-circle ml-1"></i>تم تعديل هذه المؤشرات يدوياً</div>' : ''}
                `;
                
                // حفظ في Cache
                this.cache.kpis.set(cacheKey, {
                    data: kpi,
                    timestamp: Date.now()
                });
            } else {
                container.innerHTML = '<div class="empty-state"><p class="text-gray-500">لا توجد مؤشرات أداء محسوبة</p></div>';
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في تحميل مؤشرات الأداء:', errorMessage, error);

            // التحقق من حالة الخادم قبل إظهار الرسالة
            const backendAvailable = this.isBackendAvailable();
            let displayMessage = 'حدث خطأ في تحميل مؤشرات الأداء';
            let showError = true;

            if (errorMessage.includes('غير معترف به') || errorMessage.includes('Action not recognized') || errorMessage.includes('ACTION_NOT_RECOGNIZED')) {
                displayMessage = errorMessage; // Use the detailed error message from sendRequest
            } else if (errorMessage.includes('غير مفعّل') || errorMessage.includes('الاتصال بقاعدة البيانات غير مفعّل') || errorMessage.includes('Supabase غير مفعّل')) {
                if (!backendAvailable) {
                    displayMessage = 'الاتصال بقاعدة البيانات غير مفعّل. يرجى التحقق من الإعدادات والاتصال بالإنترنت';
                } else {
                    displayMessage = 'لا توجد مؤشرات أداء محسوبة. اضغط على "حساب KPIs"';
                    showError = false;
                }
            } else if (!backendAvailable && (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('CORS'))) {
                displayMessage = 'لا توجد مؤشرات أداء محسوبة. اضغط على "حساب KPIs"';
                showError = false;
            } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('CORS')) {
                if (backendAvailable) {
                    displayMessage = 'فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت والإعدادات';
                } else {
                    displayMessage = 'لا توجد مؤشرات أداء محسوبة. اضغط على "حساب KPIs"';
                    showError = false;
                }
            } else {
                if (!backendAvailable) {
                    displayMessage = 'لا توجد مؤشرات أداء محسوبة. اضغط على "حساب KPIs"';
                    showError = false;
                }
            }

            container.innerHTML = `
                <div class="empty-state">
                    <p class="${showError ? 'text-red-500' : 'text-gray-500'} mb-2">${Utils.escapeHTML(displayMessage)}</p>
                    ${showError ? `
                    <button onclick="SafetyHealthManagement.loadMemberKPIs()" class="btn-secondary btn-sm mt-2">
                        <i class="fas fa-redo ml-1"></i>إعادة المحاولة
                    </button>
                    ` : ''}
                </div>
            `;
        } finally {
            Loading.hide();
            this.loadingStates.kpis = false;
        }
    },
    
    renderKPIs(kpi, container) {
        if (!kpi || !container) return;
        
        // حساب مؤشرات الأداء بشكل صحيح
        const inspectionsProgress = (kpi.targetInspections || 20) > 0 
            ? Math.min(((kpi.inspectionsCount || 0) / (kpi.targetInspections || 20)) * 100, 100) 
            : 0;
        // حساب نسبة الإجراءات المغلقة بشكل صحيح (نسبة مئوية من الهدف)
        const actionsProgress = (kpi.targetActionsClosure || 80);
        const observationsProgress = (kpi.targetObservations || 15) > 0 
            ? Math.min(((kpi.observationsCount || 0) / (kpi.targetObservations || 15)) * 100, 100) 
            : 0;
        const trainingsProgress = (kpi.targetTrainings || 2) > 0 
            ? Math.min(((kpi.trainingsCount || 0) / (kpi.targetTrainings || 2)) * 100, 100) 
            : 0;
        const commitmentProgress = typeof kpi.commitmentRate === 'number' ? kpi.commitmentRate : 
            (typeof kpi.commitmentRate === 'object' && kpi.commitmentRate !== null ? 0 : 
            (parseFloat(kpi.commitmentRate) || 0));
        
        container.innerHTML = `
            <div class="mb-4 flex justify-end">
                <button onclick="SafetyHealthManagement.editKPIs('${kpi.id || ''}', '${kpi.memberId || ''}')" class="btn-primary btn-sm">
                    <i class="fas fa-edit ml-2"></i>
                    تعديل المؤشرات يدوياً
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div class="kpi-card success">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold">الجولات التفتيشية</h3>
                        <i class="fas fa-clipboard-check text-2xl"></i>
                    </div>
                    <p class="text-3xl font-bold mb-1">${kpi.inspectionsCount || 0}</p>
                    <p class="text-sm opacity-90 mb-2">الهدف: ${kpi.targetInspections || 20}</p>
                    <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                        <div class="bg-white rounded-full h-2" style="width: ${inspectionsProgress}%"></div>
                    </div>
                </div>
                <div class="kpi-card warning">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold">الإجراءات المغلقة</h3>
                        <i class="fas fa-check-circle text-2xl"></i>
                    </div>
                    <p class="text-3xl font-bold mb-1">${kpi.closedActionsCount || 0}</p>
                    <p class="text-sm opacity-90 mb-2">نسبة الإغلاق المستهدفة: ${kpi.targetActionsClosure || 80}%</p>
                    <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                        <div class="bg-white rounded-full h-2" style="width: ${Math.min(actionsProgress, 100)}%"></div>
                    </div>
                </div>
                <div class="kpi-card info">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold">الملاحظات</h3>
                        <i class="fas fa-eye text-2xl"></i>
                    </div>
                    <p class="text-3xl font-bold mb-1">${kpi.observationsCount || 0}</p>
                    <p class="text-sm opacity-90 mb-2">الهدف: ${kpi.targetObservations || 15}</p>
                    <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                        <div class="bg-white rounded-full h-2" style="width: ${observationsProgress}%"></div>
                    </div>
                </div>
                <div class="kpi-card">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold">التدريبات</h3>
                        <i class="fas fa-graduation-cap text-2xl"></i>
                    </div>
                    <p class="text-3xl font-bold mb-1">${kpi.trainingsCount || 0}</p>
                    <p class="text-sm opacity-90 mb-2">الهدف: ${kpi.targetTrainings || 2}</p>
                    <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                        <div class="bg-white rounded-full h-2" style="width: ${trainingsProgress}%"></div>
                    </div>
                </div>
                <div class="kpi-card ${commitmentProgress >= 95 ? 'success' : 'warning'}">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold">نسبة الالتزام</h3>
                        <i class="fas fa-percentage text-2xl"></i>
                    </div>
                    <p class="text-3xl font-bold mb-1">${commitmentProgress.toFixed(1)}%</p>
                    <p class="text-sm opacity-90 mb-2">الهدف: ${kpi.targetCommitment || 95}%</p>
                    <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                        <div class="bg-white rounded-full h-2" style="width: ${commitmentProgress}%"></div>
                    </div>
                </div>
                ${kpi.incidentsHandledCount !== undefined ? `
                <div class="kpi-card danger">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold">الحوادث المعالجة</h3>
                        <i class="fas fa-exclamation-triangle text-2xl"></i>
                    </div>
                    <p class="text-3xl font-bold">${kpi.incidentsHandledCount || 0}</p>
                </div>
                ` : ''}
                ${kpi.nearMissCount !== undefined ? `
                <div class="kpi-card warning">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold">Near Miss</h3>
                        <i class="fas fa-exclamation-circle text-2xl"></i>
                    </div>
                    <p class="text-3xl font-bold">${kpi.nearMissCount || 0}</p>
                </div>
                ` : ''}
                ${kpi.ptwCount !== undefined ? `
                <div class="kpi-card info">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold">PTW المعالجة</h3>
                        <i class="fas fa-file-alt text-2xl"></i>
                    </div>
                    <p class="text-3xl font-bold">${kpi.ptwCount || 0}</p>
                </div>
                ` : ''}
            </div>
            <!-- Chart Visualization -->
            <div class="bg-white border border-gray-200 rounded-lg p-6 mt-6">
                <h3 class="font-semibold text-gray-700 mb-4">مقارنة الأداء مع الأهداف</h3>
                <div class="space-y-4">
                    ${this.renderKPIChartBar('الجولات التفتيشية', kpi.inspectionsCount || 0, kpi.targetInspections || 20)}
                    ${this.renderKPIChartBar('الإجراءات المغلقة', kpi.closedActionsCount || 0, Math.max(kpi.closedActionsCount || 0, 10))}
                    ${this.renderKPIChartBar('الملاحظات', kpi.observationsCount || 0, kpi.targetObservations || 15)}
                    ${this.renderKPIChartBar('التدريبات', kpi.trainingsCount || 0, kpi.targetTrainings || 2)}
                </div>
            </div>
            ${kpi.isManual ? '<div class="mt-2 text-sm text-yellow-600"><i class="fas fa-info-circle ml-1"></i>تم تعديل هذه المؤشرات يدوياً</div>' : ''}
        `;
    },

    async calculateKPIs() {
        // التحقق من إمكانية الوصول للبيانات (لحساب KPIs يجب أن يكون الخادم مفعّلاً)
        if (!this.isBackendAvailable()) {
            const accessMessage = this.getDataAccessMessage('calculateSafetyTeamKPIs', {});
            Notification.error(accessMessage || 'لا يمكن حساب مؤشرات الأداء بدون تفعيل الاتصال بقاعدة البيانات');
            return;
        }

        const memberSelect = document.getElementById('kpi-member-select');
        const periodSelect = document.getElementById('kpi-period-select');
        const calculateBtn = document.getElementById('calculate-kpis-btn');

        if (!memberSelect) {
            Notification.error('عنصر اختيار العضو غير موجود');
            return;
        }

        const memberId = memberSelect.value;
        const period = periodSelect ? periodSelect.value : '';

        if (!memberId) {
            Notification.error('يرجى اختيار عضو الفريق');
            memberSelect.focus();
            return;
        }

        // تعطيل الزر أثناء الحساب
        if (calculateBtn) {
            calculateBtn.disabled = true;
            calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i><span>جاري الحساب...</span>';
        }

        try {
            Loading.show();
            
            // التحقق من صحة البيانات قبل الإرسال
            if (!memberId || memberId.trim() === '') {
                throw new Error('معرف العضو غير صحيح');
            }

            const response = await GoogleIntegration.sendRequest({
                action: 'calculateSafetyTeamKPIs',
                data: { 
                    memberId: memberId.trim(), 
                    period: period && period.trim() !== '' ? period.trim() : null 
                }
            });

            if (response.success && response.data) {
                // التأكد من وجود البيانات قبل الحفظ
                const kpiData = response.data;
                
                // التحقق من صحة البيانات المحسوبة
                if (!kpiData.memberId) {
                    kpiData.memberId = memberId.trim();
                }
                if (!kpiData.period && period && period.trim() !== '') {
                    kpiData.period = period.trim();
                }
                
                // إضافة تاريخ الحساب
                kpiData.calculatedAt = new Date().toISOString();
                kpiData.calculatedBy = AppState.currentUser?.id || AppState.currentUser?.username || 'unknown';
                
                // حفظ المؤشرات المحسوبة
                const saveResponse = await GoogleIntegration.sendRequest({
                    action: 'addSafetyTeamKPI',
                    data: kpiData
                });

                if (saveResponse.success || saveResponse.success === undefined) {
                    Notification.success('تم حساب وحفظ مؤشرات الأداء بنجاح');
                    // مسح Cache لإعادة تحميل البيانات
                    const cacheKey = `kpi_${memberId}_${period || 'current'}`;
                    if (this.cache && this.cache.kpis) {
                        this.cache.kpis.delete(cacheKey);
                    }
                    // إعادة تحميل المؤشرات
                    await this.loadMemberKPIs();
                } else {
                    // حتى لو فشل الحفظ، نعرض البيانات المحسوبة
                    Notification.success('تم حساب مؤشرات الأداء بنجاح');
                    const cacheKey = `kpi_${memberId}_${period || 'current'}`;
                    if (this.cache && this.cache.kpis) {
                        this.cache.kpis.delete(cacheKey);
                    }
                    await this.loadMemberKPIs();
                }
            } else {
                const errorMsg = response.message || response.error || 'فشل الحساب';
                Notification.error('حدث خطأ: ' + errorMsg);
                Utils.safeError('خطأ في حساب مؤشرات الأداء:', errorMsg, response);
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'حدث خطأ غير معروف';
            Notification.error('حدث خطأ: ' + errorMessage);
            Utils.safeError('خطأ في حساب مؤشرات الأداء:', errorMessage, error);
        } finally {
            Loading.hide();
            // إعادة تفعيل الزر
            if (calculateBtn) {
                calculateBtn.disabled = false;
                calculateBtn.innerHTML = '<i class="fas fa-calculator ml-2"></i><span>حساب مؤشرات الأداء</span>';
            }
        }
    },

    async editKPIs(kpiId, memberId) {
        if (!kpiId || !memberId) {
            Notification.error('بيانات غير صحيحة');
            return;
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamKPIs',
                data: { memberId: memberId }
            });

            if (response.success && response.data && response.data.length > 0) {
                const kpi = response.data.find(k => k.id === kpiId) || response.data[0];
                this.showKPIEditForm(kpi);
            } else {
                Notification.error('لم يتم العثور على المؤشرات');
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    showKPIEditForm(kpi) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2 class="modal-title">تعديل مؤشرات الأداء</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="kpi-edit-form" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الجولات التفتيشية</label>
                                <input type="number" id="inspectionsCount" value="${kpi.inspectionsCount || 0}" class="form-input" min="0">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الإجراءات المغلقة</label>
                                <input type="number" id="closedActionsCount" value="${kpi.closedActionsCount || 0}" class="form-input" min="0">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الملاحظات</label>
                                <input type="number" id="observationsCount" value="${kpi.observationsCount || 0}" class="form-input" min="0">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">التدريبات</label>
                                <input type="number" id="trainingsCount" value="${kpi.trainingsCount || 0}" class="form-input" min="0">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الحوادث المعالجة</label>
                                <input type="number" id="incidentsHandledCount" value="${kpi.incidentsHandledCount || 0}" class="form-input" min="0">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Near Miss</label>
                                <input type="number" id="nearMissCount" value="${kpi.nearMissCount || 0}" class="form-input" min="0">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">PTW المعالجة</label>
                                <input type="number" id="ptwCount" value="${kpi.ptwCount || 0}" class="form-input" min="0">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">نسبة الالتزام (%)</label>
                                <input type="number" id="commitmentRate" value="${kpi.commitmentRate || 0}" class="form-input" min="0" max="100" step="0.1">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button type="button" id="save-kpi-btn" class="btn-primary">حفظ التعديلات</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const saveBtn = modal.querySelector('#save-kpi-btn');
        saveBtn.addEventListener('click', async () => {
            const updateData = {
                inspectionsCount: parseInt(document.getElementById('inspectionsCount').value) || 0,
                closedActionsCount: parseInt(document.getElementById('closedActionsCount').value) || 0,
                observationsCount: parseInt(document.getElementById('observationsCount').value) || 0,
                trainingsCount: parseInt(document.getElementById('trainingsCount').value) || 0,
                incidentsHandledCount: parseInt(document.getElementById('incidentsHandledCount').value) || 0,
                nearMissCount: parseInt(document.getElementById('nearMissCount').value) || 0,
                ptwCount: parseInt(document.getElementById('ptwCount').value) || 0,
                commitmentRate: parseFloat(document.getElementById('commitmentRate').value) || 0
            };

            try {
                Loading.show();
                const response = await GoogleIntegration.sendRequest({
                    action: 'updateSafetyTeamKPI',
                    data: { kpiId: kpi.id, updateData: updateData }
                });

                if (response.success) {
                    Notification.success('تم تحديث المؤشرات بنجاح');
                    modal.remove();
                    this.loadMemberKPIs();
                } else {
                    Notification.error('حدث خطأ: ' + (response.message || 'فشل التحديث'));
                }
            } catch (error) {
                Notification.error('حدث خطأ: ' + error.message);
            } finally {
                Loading.hide();
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    // ===== Helper Methods =====
    renderKPIChartBar(label, current, target) {
        const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
        const color = percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';
        return `
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span class="font-medium text-gray-700">${label}</span>
                    <span class="text-gray-600">${current} / ${target}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-4">
                    <div class="${color} h-4 rounded-full flex items-center justify-end pr-2" style="width: ${percentage}%">
                        <span class="text-xs text-white font-semibold">${percentage.toFixed(0)}%</span>
                    </div>
                </div>
            </div>
        `;
    },

    // ===== Legacy Methods (kept for backward compatibility) =====
    async renderTasksView() {
        return `
            <div class="content-card">
                <div class="card-header">
                    <div class="flex items-center justify-between">
                        <h2 class="card-title"><i class="fas fa-tasks ml-2"></i>إدارة المهام اليدوية</h2>
                        <div class="flex gap-2">
                            <select id="task-member-select" class="form-input" style="min-width: 200px;">
                                <option value="">اختر عضو الفريق</option>
                            </select>
                            <button id="add-task-btn" class="btn-primary">
                                <i class="fas fa-plus ml-2"></i>
                                إضافة مهمة جديدة
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div id="tasks-container">
                        <div class="empty-state">
                            <p class="text-gray-500">اختر عضو الفريق لعرض المهام</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadTasks() {
        const memberSelect = document.getElementById('task-member-select');
        const container = document.getElementById('tasks-container');
        if (!memberSelect || !container) return;

        try {
            // Load team members for dropdown
            const membersResponse = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamMembers',
                data: {}
            });

            if (membersResponse.success && membersResponse.data) {
                const members = Array.isArray(membersResponse.data) ? membersResponse.data : [];
                memberSelect.innerHTML = '<option value="">اختر عضو الفريق</option>' +
                    members.map(m => `
                        <option value="${m.id}">${Utils.escapeHTML(m.name || '')}</option>
                    `).join('');

                // Setup event listeners
                memberSelect.addEventListener('change', () => this.loadMemberTasks());
                document.getElementById('add-task-btn')?.addEventListener('click', () => this.showTaskForm());
            }
        } catch (error) {
            Utils.safeError('خطأ في تحميل المهام:', error);
        }
    },

    async loadMemberTasks() {
        const memberId = document.getElementById('task-member-select').value;
        const container = document.getElementById('tasks-container');

        if (!memberId) {
            container.innerHTML = '<div class="empty-state"><p class="text-gray-500">اختر عضو الفريق لعرض المهام</p></div>';
            return;
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamTasks',
                data: { memberId: memberId }
            });

            if (response.success && response.data) {
                const tasks = Array.isArray(response.data) ? response.data : [];

                if (tasks.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p class="text-gray-500">لا توجد مهام مسجلة</p></div>';
                    Loading.hide();
                    return;
                }

                container.innerHTML = `
                    <div class="space-y-3">
                        ${tasks.map(task => `
                            <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div class="flex items-start justify-between">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-2">
                                            <h3 class="font-semibold text-gray-800">${Utils.escapeHTML(task.taskTitle || '')}</h3>
                                            <span class="px-2 py-1 text-xs rounded ${task.priority === 'عالي' || task.priority === 'high' ? 'bg-red-100 text-red-800' : task.priority === 'منخفض' || task.priority === 'low' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                                ${Utils.escapeHTML(task.priority || 'متوسط')}
                                            </span>
                                            <span class="px-2 py-1 text-xs rounded ${task.status === 'مكتمل' || task.status === 'completed' ? 'bg-green-100 text-green-800' : task.status === 'قيد التنفيذ' || task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
                                                ${Utils.escapeHTML(task.status || 'قيد التنفيذ')}
                                            </span>
                                        </div>
                                        <p class="text-sm text-gray-600 mb-2">${Utils.escapeHTML(task.taskDescription || '')}</p>
                                        <div class="flex items-center gap-4 text-xs text-gray-500">
                                            ${task.dueDate ? `<span><i class="fas fa-calendar ml-1"></i>تاريخ الاستحقاق: ${Utils.formatDate(task.dueDate)}</span>` : ''}
                                            ${task.taskType ? `<span><i class="fas fa-tag ml-1"></i>${Utils.escapeHTML(task.taskType)}</span>` : ''}
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <button onclick="SafetyHealthManagement.editTask('${task.id}')" class="btn-icon btn-icon-primary">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="SafetyHealthManagement.deleteTask('${task.id}')" class="btn-icon btn-icon-danger">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                container.innerHTML = '<div class="empty-state"><p class="text-gray-500">لا توجد مهام مسجلة</p></div>';
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في تحميل المهام:', errorMessage, error);
            container.innerHTML = `<div class="empty-state"><p class="text-red-500">حدث خطأ في تحميل البيانات: ${Utils.escapeHTML(errorMessage)}</p></div>`;
        } finally {
            Loading.hide();
        }
    },

    showTaskForm(task = null) {
        const memberId = document.getElementById('task-member-select')?.value;
        if (!memberId && !task) {
            Notification.error('يرجى اختيار عضو الفريق أولاً');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 class="modal-title">${task ? 'تعديل مهمة' : 'إضافة مهمة جديدة'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="task-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">عنوان المهمة *</label>
                            <input type="text" id="taskTitle" required class="form-input" value="${task ? Utils.escapeHTML(task.taskTitle || '') : ''}">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">وصف المهمة</label>
                            <textarea id="taskDescription" class="form-input" rows="3">${task ? Utils.escapeHTML(task.taskDescription || '') : ''}</textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">نوع المهمة</label>
                                <select id="taskType" class="form-input">
                                    <option value="تفتيش" ${task && task.taskType === 'تفتيش' ? 'selected' : ''}>تفتيش</option>
                                    <option value="تدريب" ${task && task.taskType === 'تدريب' ? 'selected' : ''}>تدريب</option>
                                    <option value="إجراء تصحيحي" ${task && task.taskType === 'إجراء تصحيحي' ? 'selected' : ''}>إجراء تصحيحي</option>
                                    <option value="مراجعة" ${task && task.taskType === 'مراجعة' ? 'selected' : ''}>مراجعة</option>
                                    <option value="أخرى" ${task && task.taskType === 'أخرى' ? 'selected' : ''}>أخرى</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الأولوية</label>
                                <select id="priority" class="form-input">
                                    <option value="منخفض" ${task && task.priority === 'منخفض' ? 'selected' : ''}>منخفض</option>
                                    <option value="متوسط" ${!task || task.priority === 'متوسط' ? 'selected' : ''}>متوسط</option>
                                    <option value="عالي" ${task && task.priority === 'عالي' ? 'selected' : ''}>عالي</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">تاريخ الاستحقاق</label>
                                <input type="date" id="dueDate" class="form-input" value="${task && task.dueDate ? Utils.formatDateForInput(task.dueDate) : ''}">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الحالة</label>
                                <select id="status" class="form-input">
                                    <option value="قيد التنفيذ" ${!task || task.status === 'قيد التنفيذ' ? 'selected' : ''}>قيد التنفيذ</option>
                                    <option value="مكتمل" ${task && task.status === 'مكتمل' ? 'selected' : ''}>مكتمل</option>
                                    <option value="ملغي" ${task && task.status === 'ملغي' ? 'selected' : ''}>ملغي</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">ملاحظات</label>
                            <textarea id="notes" class="form-input" rows="2">${task ? Utils.escapeHTML(task.notes || '') : ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button type="button" id="save-task-btn" class="btn-primary">حفظ</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const saveBtn = modal.querySelector('#save-task-btn');
        saveBtn.addEventListener('click', async () => {
            const taskData = {
                memberId: task ? task.memberId : memberId,
                taskTitle: document.getElementById('taskTitle').value.trim(),
                taskDescription: document.getElementById('taskDescription').value.trim(),
                taskType: document.getElementById('taskType').value,
                priority: document.getElementById('priority').value,
                dueDate: document.getElementById('dueDate').value || null,
                status: document.getElementById('status').value,
                notes: document.getElementById('notes').value.trim(),
                assignedBy: AppState.currentUser?.id || AppState.currentUser?.name || ''
            };

            if (!taskData.taskTitle) {
                Notification.error('يرجى إدخال عنوان المهمة');
                return;
            }

            try {
                Loading.show();
                const response = task
                    ? await GoogleIntegration.sendRequest({
                        action: 'updateSafetyTeamTask',
                        data: { taskId: task.id, updateData: taskData }
                    })
                    : await GoogleIntegration.sendRequest({
                        action: 'addSafetyTeamTask',
                        data: taskData
                    });

                if (response.success) {
                    Notification.success(task ? 'تم تحديث المهمة بنجاح' : 'تم إضافة المهمة بنجاح');
                    modal.remove();
                    this.loadMemberTasks();
                } else {
                    Notification.error('حدث خطأ: ' + (response.message || 'فشل الحفظ'));
                }
            } catch (error) {
                Notification.error('حدث خطأ: ' + error.message);
            } finally {
                Loading.hide();
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async editTask(taskId) {
        try {
            Loading.show();
            const memberId = document.getElementById('task-member-select').value;
            const response = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamTasks',
                data: { memberId: memberId }
            });

            if (response.success && response.data) {
                const task = response.data.find(t => t.id === taskId);
                if (task) {
                    this.showTaskForm(task);
                } else {
                    Notification.error('لم يتم العثور على المهمة');
                }
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    async deleteTask(taskId) {
        if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
            return;
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'deleteSafetyTeamTask',
                data: { taskId: taskId }
            });

            if (response.success) {
                Notification.success('تم حذف المهمة بنجاح');
                this.loadMemberTasks();
            } else {
                Notification.error('حدث خطأ: ' + (response.message || 'فشل الحذف'));
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    // ===== Performance Reports View =====
    async renderReportsView() {
        return `
            <div class="content-card">
                <div class="card-header">
                    <div class="flex items-center justify-between">
                        <h2 class="card-title"><i class="fas fa-file-chart-line ml-2"></i>تقارير الأداء</h2>
                        <div class="flex gap-2">
                            <select id="report-member-select" class="form-input" style="min-width: 200px;">
                                <option value="">اختر عضو الفريق</option>
                            </select>
                            <button id="generate-report-btn" class="btn-primary">
                                <i class="fas fa-file-pdf ml-2"></i>
                                إنشاء تقرير
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div id="reports-container">
                        <div class="empty-state">
                            <p class="text-gray-500">اختر عضو الفريق وإنشاء تقرير الأداء</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadReports() {
        const memberSelect = document.getElementById('report-member-select');
        if (!memberSelect) return;

        // التحقق من إمكانية الوصول للبيانات
        const accessMessage = this.getDataAccessMessage('generateSafetyTeamPerformanceReport', {});
        if (accessMessage) {
            memberSelect.innerHTML = `<option value="">${accessMessage}</option>`;
            const container = document.getElementById('reports-container');
            if (container) {
                container.innerHTML = `<div class="empty-state"><p class="text-gray-500">${accessMessage}</p></div>`;
            }
            return;
        }

        try {
            // Load team members for dropdown
            const membersResponse = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamMembers',
                data: {}
            });

            if (membersResponse.success && membersResponse.data) {
                const members = Array.isArray(membersResponse.data) ? membersResponse.data : [];
                memberSelect.innerHTML = '<option value="">اختر عضو الفريق</option>' +
                    members.map(m => `
                        <option value="${m.id}">${Utils.escapeHTML(m.name || '')}</option>
                    `).join('');

                // Setup event listener
                document.getElementById('generate-report-btn')?.addEventListener('click', () => this.generateReport());
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في تحميل التقارير:', errorMessage, error);

            if (memberSelect) {
                const backendAvailable = this.isBackendAvailable();
                let displayMessage = 'حدث خطأ في تحميل التقارير';
                let showError = true;

                if (errorMessage.includes('غير معترف به') || errorMessage.includes('Action not recognized') || errorMessage.includes('ACTION_NOT_RECOGNIZED')) {
                    displayMessage = errorMessage;
                } else if (errorMessage.includes('غير مفعّل') || errorMessage.includes('الاتصال بقاعدة البيانات غير مفعّل') || errorMessage.includes('Supabase غير مفعّل')) {
                    if (!backendAvailable) displayMessage = 'الاتصال بقاعدة البيانات غير مفعّل. يرجى التحقق من الإعدادات والاتصال بالإنترنت';
                    else { displayMessage = 'اختر عضو الفريق وإنشاء تقرير الأداء'; showError = false; }
                } else if (!backendAvailable && (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('CORS'))) {
                    displayMessage = 'اختر عضو الفريق وإنشاء تقرير الأداء';
                    showError = false;
                } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('CORS')) {
                    if (backendAvailable) displayMessage = 'فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت والإعدادات';
                    else { displayMessage = 'اختر عضو الفريق وإنشاء تقرير الأداء'; showError = false; }
                } else {
                    if (!backendAvailable) { displayMessage = 'اختر عضو الفريق وإنشاء تقرير الأداء'; showError = false; }
                }

                memberSelect.innerHTML = `
                    <option value="">${showError ? 'خطأ في التحميل' : 'اختر عضو الفريق'}</option>
                `;

                const container = document.getElementById('reports-container');
                if (container) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <p class="${showError ? 'text-red-500' : 'text-gray-500'} mb-2">${Utils.escapeHTML(displayMessage)}</p>
                            ${showError ? `
                            <button onclick="SafetyHealthManagement.loadReports()" class="btn-secondary btn-sm mt-2">
                                <i class="fas fa-redo ml-1"></i>إعادة المحاولة
                            </button>
                            ` : ''}
                        </div>
                    `;
                }
            }
        }
    },

    async generateReport() {
        const memberId = document.getElementById('report-member-select').value;
        if (!memberId) {
            Notification.error('يرجى اختيار عضو الفريق');
            return;
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'generateSafetyTeamPerformanceReport',
                data: { memberId: memberId }
            });

            if (response.success && response.data) {
                const report = response.data;
                const container = document.getElementById('reports-container');

                container.innerHTML = `
                    <div class="bg-white border border-gray-200 rounded-lg p-6">
                        <div class="mb-6">
                            <h3 class="text-xl font-bold text-gray-800 mb-2">تقرير أداء: ${Utils.escapeHTML(report.member?.name || '')}</h3>
                            <p class="text-sm text-gray-600">الفترة: ${Utils.formatDate(report.period?.startDate)} - ${Utils.formatDate(report.period?.endDate)}</p>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h4 class="font-semibold text-gray-700 mb-3">ملخص الأداء</h4>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <span>الجولات التفتيشية:</span>
                                        <strong>${report.summary?.totalInspections || 0}</strong>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>الإجراءات التصحيحية:</span>
                                        <strong>${report.summary?.totalActions || 0}</strong>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>الإجراءات المغلقة:</span>
                                        <strong>${report.summary?.closedActions || 0}</strong>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>الملاحظات:</span>
                                        <strong>${report.summary?.totalObservations || 0}</strong>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>التدريبات:</span>
                                        <strong>${report.summary?.totalTrainings || 0}</strong>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>نسبة الالتزام:</span>
                                        <strong>${(report.summary?.commitmentRate || 0).toFixed(1)}%</strong>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-700 mb-3">الوصف الوظيفي</h4>
                                <div class="text-sm text-gray-600">
                                    ${report.jobDescription ? `
                                        <p><strong>الدور:</strong> ${Utils.escapeHTML(report.jobDescription.roleDescription || '—')}</p>
                                        <p class="mt-2"><strong>المسؤوليات:</strong> ${Utils.escapeHTML(report.jobDescription.responsibilities || '—')}</p>
                                    ` : '<p class="text-gray-500">لا يوجد وصف وظيفي مسجل</p>'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-6">
                            <button onclick="SafetyHealthManagement.exportReport('${memberId}')" class="btn-primary">
                                <i class="fas fa-download ml-2"></i>
                                تصدير PDF
                            </button>
                            <button onclick="SafetyHealthManagement.exportReportExcel('${memberId}')" class="btn-success ml-2">
                                <i class="fas fa-file-excel ml-2"></i>
                                تصدير Excel
                            </button>
                        </div>
                    </div>
                `;
            } else {
                Notification.error('حدث خطأ: ' + (response.message || 'فشل إنشاء التقرير'));
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    renderKPIChartBar(label, current, target) {
        const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
        const color = percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';
        return `
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span class="font-medium text-gray-700">${label}</span>
                    <span class="text-gray-600">${current} / ${target}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-4">
                    <div class="${color} h-4 rounded-full flex items-center justify-end pr-2" style="width: ${percentage}%">
                        <span class="text-xs text-white font-semibold">${percentage.toFixed(0)}%</span>
                    </div>
                </div>
            </div>
        `;
    },

    async exportReport(memberId) {
        if (!memberId) {
            Notification.error('يرجى اختيار عضو الفريق');
            return;
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'generateSafetyTeamPerformanceReport',
                data: { memberId: memberId }
            });

            if (response.success && response.data) {
                const report = response.data;
                const member = report.member || {};
                const kpis = report.kpis || {};
                const summary = report.summary || {};

                // Create PDF content
                const pdfContent = `
                    <div style="font-family: Arial, sans-serif; padding: 20px; direction: rtl;">
                        <h1 style="text-align: center; color: #2563eb; margin-bottom: 30px;">
                            تقرير أداء موظف - ${Utils.escapeHTML(member.name || '')}
                        </h1>
                        
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <h2 style="color: #1f2937; margin-bottom: 10px;">بيانات الموظف</h2>
                            <p><strong>الاسم:</strong> ${Utils.escapeHTML(member.name || '—')}</p>
                            <p><strong>الوظيفة:</strong> ${Utils.escapeHTML(member.jobTitle || '—')}</p>
                            <p><strong>القسم:</strong> ${Utils.escapeHTML(member.department || '—')}</p>
                            <p><strong>البريد الإلكتروني:</strong> ${Utils.escapeHTML(member.email || '—')}</p>
                            <p><strong>الهاتف:</strong> ${Utils.escapeHTML(member.phone || '—')}</p>
                            ${member.appointmentDate ? `<p><strong>تاريخ التعيين:</strong> ${Utils.formatDate(member.appointmentDate)}</p>` : ''}
                        </div>

                        ${report.jobDescription ? `
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <h2 style="color: #1f2937; margin-bottom: 10px;">الوصف الوظيفي</h2>
                            <p><strong>الدور الوظيفي:</strong></p>
                            <p style="margin-bottom: 10px;">${Utils.escapeHTML(report.jobDescription.roleDescription || '—')}</p>
                            <p><strong>المسؤوليات:</strong></p>
                            <p>${Utils.escapeHTML(report.jobDescription.responsibilities || '—')}</p>
                        </div>
                        ` : ''}

                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <h2 style="color: #1f2937; margin-bottom: 10px;">ملخص الأداء</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>الجولات التفتيشية:</strong></td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: left;">${summary.totalInspections || 0}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>الإجراءات التصحيحية:</strong></td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: left;">${summary.totalActions || 0}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>الإجراءات المغلقة:</strong></td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: left;">${summary.closedActions || 0}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>الملاحظات:</strong></td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: left;">${summary.totalObservations || 0}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>التدريبات:</strong></td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: left;">${summary.totalTrainings || 0}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px;"><strong>نسبة الالتزام:</strong></td>
                                    <td style="padding: 8px; text-align: left;">${(summary.commitmentRate || 0).toFixed(1)}%</td>
                                </tr>
                            </table>
                        </div>

                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <h2 style="color: #1f2937; margin-bottom: 10px;">مؤشرات الأداء</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>الجولات التفتيشية:</strong></td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: left;">${kpis.inspectionsCount || 0} / ${kpis.targetInspections || 20}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>الإجراءات المغلقة:</strong></td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: left;">${kpis.closedActionsCount || 0}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>الملاحظات:</strong></td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: left;">${kpis.observationsCount || 0} / ${kpis.targetObservations || 15}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>التدريبات:</strong></td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: left;">${kpis.trainingsCount || 0} / ${kpis.targetTrainings || 2}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px;"><strong>نسبة الالتزام:</strong></td>
                                    <td style="padding: 8px; text-align: left;">${(kpis.commitmentRate || 0).toFixed(1)}% / ${kpis.targetCommitment || 95}%</td>
                                </tr>
                            </table>
                        </div>

                        <div style="text-align: center; color: #6b7280; margin-top: 30px; font-size: 12px;">
                            <p>تم إنشاء التقرير في: ${new Date().toLocaleDateString('ar-SA')}</p>
                        </div>
                    </div>
                `;

                // Use PDFTemplates if available, otherwise fallback to window.print
                if (typeof PDFTemplates !== 'undefined' && PDFTemplates.buildDocument) {
                    const formCode = `SAFETY-TEAM-PERFORMANCE-${member.id?.substring(0, 8) || 'UNKNOWN'}`;
                    const html = PDFTemplates.buildDocument({
                        title: `تقرير أداء - ${Utils.escapeHTML(member.name || '')}`,
                        formCode: formCode,
                        content: pdfContent,
                        createdAt: new Date(),
                        meta: {
                            'اسم الموظف': Utils.escapeHTML(member.name || ''),
                            'الوظيفة': Utils.escapeHTML(member.jobTitle || ''),
                            'القسم': Utils.escapeHTML(member.department || '')
                        }
                    });
                    
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                        printWindow.document.write(html);
                        printWindow.document.close();
                        setTimeout(() => printWindow.print(), 500);
                    }
                } else {
                    // Fallback: open in new window for printing
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                        <!DOCTYPE html>
                        <html dir="rtl">
                        <head>
                            <meta charset="UTF-8">
                            <title>تقرير أداء - ${Utils.escapeHTML(member.name || '')}</title>
                            <style>
                                @media print {
                                    @page { margin: 1cm; }
                                    body { margin: 0; }
                                }
                            </style>
                        </head>
                        <body>${pdfContent}</body>
                        </html>
                    `);
                    printWindow.document.close();
                    setTimeout(() => printWindow.print(), 250);
                }

                Notification.success('تم إنشاء التقرير بنجاح');
            } else {
                Notification.error('حدث خطأ: ' + (response.message || 'فشل إنشاء التقرير'));
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    async exportReportExcel(memberId) {
        if (!memberId) {
            Notification.error('يرجى اختيار عضو الفريق');
            return;
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'generateSafetyTeamPerformanceReport',
                data: { memberId: memberId }
            });

            if (response.success && response.data) {
                const report = response.data;
                const member = report.member || {};
                const kpis = report.kpis || {};
                const summary = report.summary || {};

                // Check if XLSX library is available
                if (typeof XLSX === 'undefined') {
                    Notification.error('مكتبة Excel غير متوفرة. يرجى التأكد من تحميل المكتبة');
                    Loading.hide();
                    return;
                }

                // Create Excel workbook
                const wb = XLSX.utils.book_new();

                // Sheet 1: Employee Info & Summary
                const summaryData = [
                    ['تقرير أداء موظف'],
                    [''],
                    ['بيانات الموظف'],
                    ['الاسم', member.name || '—'],
                    ['الوظيفة', member.jobTitle || '—'],
                    ['القسم', member.department || '—'],
                    ['البريد الإلكتروني', member.email || '—'],
                    ['الهاتف', member.phone || '—'],
                    ['تاريخ التعيين', member.appointmentDate ? Utils.formatDate(member.appointmentDate) : '—'],
                    [''],
                    ['ملخص الأداء'],
                    ['الجولات التفتيشية', summary.totalInspections || 0],
                    ['الإجراءات التصحيحية', summary.totalActions || 0],
                    ['الإجراءات المغلقة', summary.closedActions || 0],
                    ['الملاحظات', summary.totalObservations || 0],
                    ['التدريبات', summary.totalTrainings || 0],
                    ['نسبة الالتزام', (summary.commitmentRate || 0).toFixed(1) + '%'],
                    [''],
                    ['مؤشرات الأداء'],
                    ['الجولات التفتيشية', kpis.inspectionsCount || 0, '/', kpis.targetInspections || 20],
                    ['الإجراءات المغلقة', kpis.closedActionsCount || 0],
                    ['الملاحظات', kpis.observationsCount || 0, '/', kpis.targetObservations || 15],
                    ['التدريبات', kpis.trainingsCount || 0, '/', kpis.targetTrainings || 2],
                    ['نسبة الالتزام', (kpis.commitmentRate || 0).toFixed(1) + '%', '/', (kpis.targetCommitment || 95) + '%']
                ];

                const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
                XLSX.utils.book_append_sheet(wb, ws1, 'ملخص الأداء');

                // Sheet 2: Activities
                if (report.activities) {
                    const activitiesData = [
                        ['الجولات التفتيشية'],
                        ['التاريخ', 'الموقع', 'الحالة'],
                        ...(report.activities.inspections || []).map(act => [
                            act.inspectionDate ? Utils.formatDate(act.inspectionDate) : '—',
                            act.location || '—',
                            act.status || '—'
                        ]),
                        [''],
                        ['الإجراءات التصحيحية'],
                        ['التاريخ', 'الوصف', 'الحالة'],
                        ...(report.activities.actions || []).map(act => [
                            act.createdAt ? Utils.formatDate(act.createdAt) : '—',
                            act.description || '—',
                            act.status || '—'
                        ]),
                        [''],
                        ['الملاحظات'],
                        ['التاريخ', 'الوصف', 'النوع'],
                        ...(report.activities.observations || []).map(obs => [
                            obs.date ? Utils.formatDate(obs.date) : '—',
                            obs.description || '—',
                            obs.type || '—'
                        ]),
                        [''],
                        ['التدريبات'],
                        ['التاريخ', 'الموضوع', 'المشاركون'],
                        ...(report.activities.trainings || []).map(training => [
                            training.startDate ? Utils.formatDate(training.startDate) : '—',
                            training.topic || '—',
                            training.participants ? (Array.isArray(training.participants) ? training.participants.length : '—') : '—'
                        ])
                    ];

                    const ws2 = XLSX.utils.aoa_to_sheet(activitiesData);
                    XLSX.utils.book_append_sheet(wb, ws2, 'الأنشطة');
                }

                // Generate filename
                const filename = `تقرير_أداء_${member.name || 'موظف'}_${new Date().toISOString().split('T')[0]}.xlsx`;

                // Export to file
                XLSX.writeFile(wb, filename);

                Notification.success('تم تصدير التقرير بنجاح');
            } else {
                Notification.error('حدث خطأ: ' + (response.message || 'فشل إنشاء التقرير'));
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    async generateAttendanceReport() {
        const memberSelect = document.getElementById('attendance-member-select');
        const memberId = memberSelect?.value;

        if (!memberId) {
            Notification.error('يرجى اختيار عضو الفريق أولاً');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 class="modal-title">تقرير حضور/غياب</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="attendance-report-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">نوع التقرير *</label>
                            <select id="report-period" required class="form-input">
                                <option value="monthly">شهري</option>
                                <option value="yearly">سنوي</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">السنة *</label>
                            <input type="number" id="report-year" required class="form-input" 
                                   value="${new Date().getFullYear()}" min="2020" max="2100">
                        </div>
                        <div id="report-month-container">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">الشهر</label>
                            <select id="report-month" class="form-input">
                                <option value="0">يناير</option>
                                <option value="1">فبراير</option>
                                <option value="2">مارس</option>
                                <option value="3">أبريل</option>
                                <option value="4">مايو</option>
                                <option value="5">يونيو</option>
                                <option value="6">يوليو</option>
                                <option value="7">أغسطس</option>
                                <option value="8">سبتمبر</option>
                                <option value="9">أكتوبر</option>
                                <option value="10">نوفمبر</option>
                                <option value="11">ديسمبر</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button type="button" id="generate-attendance-report-btn" class="btn-primary">إنشاء التقرير</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Show/hide month selector based on period type
        const periodSelect = modal.querySelector('#report-period');
        const monthContainer = modal.querySelector('#report-month-container');
        periodSelect.addEventListener('change', () => {
            monthContainer.style.display = periodSelect.value === 'monthly' ? 'block' : 'none';
        });
        monthContainer.style.display = 'block';

        const generateBtn = modal.querySelector('#generate-attendance-report-btn');
        generateBtn.addEventListener('click', async () => {
            const period = periodSelect.value;
            const year = parseInt(document.getElementById('report-year').value);
            const month = period === 'monthly' ? parseInt(document.getElementById('report-month').value) : null;

            modal.remove();

            try {
                Loading.show();
                const response = await GoogleIntegration.sendRequest({
                    action: 'generateAttendanceReport',
                    data: { memberId: memberId, period: period, year: year, month: month }
                });

                if (response.success && response.data) {
                    const report = response.data;
                    const reportModal = document.createElement('div');
                    reportModal.className = 'modal-overlay';
                    reportModal.innerHTML = `
                        <div class="modal-content" style="max-width: 700px;">
                            <div class="modal-header">
                                <h2 class="modal-title">تقرير حضور/غياب</h2>
                                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-4">
                                    <h3 class="font-semibold text-gray-800 mb-2">الفترة: ${period === 'monthly' ? 'شهري' : 'سنوي'} - ${year}${month !== null ? ` - ${['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][month]}` : ''}</h3>
                                </div>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div class="bg-green-50 p-3 rounded-lg">
                                        <p class="text-sm text-gray-600">أيام الحضور</p>
                                        <p class="text-2xl font-bold text-green-600">${report.statistics?.presentDays || 0}</p>
                                    </div>
                                    <div class="bg-yellow-50 p-3 rounded-lg">
                                        <p class="text-sm text-gray-600">أيام التأخير</p>
                                        <p class="text-2xl font-bold text-yellow-600">${report.statistics?.lateDays || 0}</p>
                                    </div>
                                    <div class="bg-red-50 p-3 rounded-lg">
                                        <p class="text-sm text-gray-600">أيام الغياب</p>
                                        <p class="text-2xl font-bold text-red-600">${report.statistics?.absentDays || 0}</p>
                                    </div>
                                    <div class="bg-blue-50 p-3 rounded-lg">
                                        <p class="text-sm text-gray-600">نسبة الحضور</p>
                                        <p class="text-2xl font-bold text-blue-600">${(report.statistics?.attendanceRate || 0).toFixed(1)}%</p>
                                    </div>
                                </div>
                                <div class="mb-4">
                                    <p class="text-sm text-gray-600">إجمالي أيام الإجازة: <strong>${report.statistics?.leaveDays || 0} يوم</strong></p>
                                    <p class="text-sm text-gray-600">عدد الإجازات: <strong>${report.statistics?.totalLeaves || 0}</strong></p>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إغلاق</button>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(reportModal);
                    reportModal.addEventListener('click', (e) => {
                        if (e.target === reportModal) reportModal.remove();
                    });
                } else {
                    Notification.error('حدث خطأ: ' + (response.message || 'فشل إنشاء التقرير'));
                }
            } catch (error) {
                Notification.error('حدث خطأ: ' + error.message);
            } finally {
                Loading.hide();
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    // ===== Attendance & Leaves View =====
    async renderAttendanceView() {
        return `
            <div class="content-card">
                <div class="card-header">
                    <div class="flex items-center justify-between">
                        <h2 class="card-title"><i class="fas fa-calendar-check ml-2"></i>الحضور والإجازات</h2>
                        <div class="flex gap-2">
                            <select id="attendance-member-select" class="form-input" style="min-width: 200px;">
                                <option value="">اختر عضو الفريق</option>
                            </select>
                            <button id="add-attendance-btn" class="btn-primary">
                                <i class="fas fa-plus ml-2"></i>
                                تسجيل حضور
                            </button>
                            <button id="add-leave-btn" class="btn-secondary">
                                <i class="fas fa-calendar-times ml-2"></i>
                                تسجيل إجازة
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 class="font-semibold text-gray-700 mb-3">سجل الحضور</h3>
                            <div id="attendance-list" class="space-y-2">
                                <div class="empty-state">
                                    <p class="text-gray-500">اختر عضو الفريق لعرض سجل الحضور</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-700 mb-3">سجل الإجازات</h3>
                            <div id="leaves-list" class="space-y-2">
                                <div class="empty-state">
                                    <p class="text-gray-500">اختر عضو الفريق لعرض سجل الإجازات</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadAttendance() {
        const memberSelect = document.getElementById('attendance-member-select');
        if (!memberSelect) return;

        try {
            // Load team members for dropdown
            const membersResponse = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamMembers',
                data: {}
            });

            if (membersResponse.success && membersResponse.data) {
                const members = Array.isArray(membersResponse.data) ? membersResponse.data : [];
                memberSelect.innerHTML = '<option value="">اختر عضو الفريق</option>' +
                    members.map(m => `
                        <option value="${m.id}">${Utils.escapeHTML(m.name || '')}</option>
                    `).join('');

                // Setup event listeners
                memberSelect.addEventListener('change', () => {
                    const memberId = memberSelect.value;
                    if (memberId) {
                        this.loadMemberAttendance(memberId);
                        this.loadMemberLeaves(memberId);
                    } else {
                        document.getElementById('attendance-list').innerHTML = '<div class="empty-state"><p class="text-gray-500">اختر عضو الفريق لعرض سجل الحضور</p></div>';
                        document.getElementById('leaves-list').innerHTML = '<div class="empty-state"><p class="text-gray-500">اختر عضو الفريق لعرض سجل الإجازات</p></div>';
                    }
                });

                document.getElementById('add-attendance-btn')?.addEventListener('click', () => this.showAttendanceForm());
                document.getElementById('add-leave-btn')?.addEventListener('click', () => this.showLeaveForm());

                // Add report generation button
                const reportBtn = document.createElement('button');
                reportBtn.className = 'btn-success btn-sm ml-2';
                reportBtn.innerHTML = '<i class="fas fa-file-alt ml-2"></i>تقرير حضور/غياب';
                reportBtn.addEventListener('click', () => this.generateAttendanceReport());
                memberSelect.parentElement.appendChild(reportBtn);
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في تحميل الحضور والإجازات:', errorMessage, error);
        }
    },

    async loadMemberAttendance(memberId) {
        const container = document.getElementById('attendance-list');
        if (!container) return;

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamAttendance',
                data: { memberId: memberId }
            });

            if (response.success && response.data) {
                const attendance = Array.isArray(response.data) ? response.data : [];

                if (attendance.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p class="text-gray-500">لا توجد سجلات حضور</p></div>';
                    Loading.hide();
                    return;
                }

                // Sort by date descending
                attendance.sort((a, b) => new Date(b.date) - new Date(a.date));

                container.innerHTML = attendance.slice(0, 10).map(record => `
                    <div class="bg-white border border-gray-200 rounded-lg p-3">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-semibold text-gray-800">${Utils.formatDate(record.date)}</p>
                                <p class="text-sm text-gray-600">
                                    ${record.checkIn ? `دخول: ${record.checkIn}` : ''} 
                                    ${record.checkOut ? ` | خروج: ${record.checkOut}` : ''}
                                    ${record.workDuration ? ` | مدة: ${record.workDuration} ساعة` : ''}
                                </p>
                            </div>
                            <span class="badge badge-${record.status === 'حاضر' ? 'success' : record.status === 'متأخر' ? 'warning' : record.status === 'غائب' ? 'danger' : 'info'}">
                                ${Utils.escapeHTML(record.status || '')}
                            </span>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<div class="empty-state"><p class="text-gray-500">لا توجد سجلات حضور</p></div>';
            }
        } catch (error) {
            Utils.safeError('خطأ في تحميل سجل الحضور:', error);
            container.innerHTML = '<div class="empty-state"><p class="text-red-500">حدث خطأ في تحميل البيانات</p></div>';
        } finally {
            Loading.hide();
        }
    },

    async loadMemberLeaves(memberId) {
        const container = document.getElementById('leaves-list');
        if (!container) return;

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamLeaves',
                data: { memberId: memberId }
            });

            if (response.success && response.data) {
                const leaves = Array.isArray(response.data) ? response.data : [];

                if (leaves.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p class="text-gray-500">لا توجد سجلات إجازات</p></div>';
                    Loading.hide();
                    return;
                }

                // Sort by start date descending
                leaves.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

                container.innerHTML = leaves.slice(0, 10).map(leave => `
                    <div class="bg-white border border-gray-200 rounded-lg p-3">
                        <div class="flex items-center justify-between mb-2">
                            <div>
                                <p class="font-semibold text-gray-800">${Utils.escapeHTML(leave.leaveType || '')}</p>
                                <p class="text-sm text-gray-600">
                                    ${Utils.formatDate(leave.startDate)} - ${Utils.formatDate(leave.endDate)}
                                    ${leave.daysCount ? ` (${leave.daysCount} يوم)` : ''}
                                </p>
                            </div>
                            <span class="badge badge-${leave.approvalStatus === 'معتمد' ? 'success' : leave.approvalStatus === 'مرفوض' ? 'danger' : 'warning'}">
                                ${Utils.escapeHTML(leave.approvalStatus || 'قيد المراجعة')}
                            </span>
                        </div>
                        ${leave.reason ? `<p class="text-xs text-gray-500">${Utils.escapeHTML(leave.reason)}</p>` : ''}
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<div class="empty-state"><p class="text-gray-500">لا توجد سجلات إجازات</p></div>';
            }
        } catch (error) {
            Utils.safeError('خطأ في تحميل سجل الإجازات:', error);
            container.innerHTML = '<div class="empty-state"><p class="text-red-500">حدث خطأ في تحميل البيانات</p></div>';
        } finally {
            Loading.hide();
        }
    },

    async showAttendanceForm() {
        const memberSelect = document.getElementById('attendance-member-select');
        const selectedMemberId = memberSelect?.value;

        if (!selectedMemberId) {
            Notification.error('يرجى اختيار عضو الفريق أولاً');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 class="modal-title">تسجيل حضور</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="attendance-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">التاريخ *</label>
                            <input type="date" id="attendance-date" required class="form-input" 
                                value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">وقت الدخول</label>
                                <input type="time" id="attendance-check-in" class="form-input">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">وقت الخروج</label>
                                <input type="time" id="attendance-check-out" class="form-input">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">الحالة *</label>
                            <select id="attendance-status" required class="form-input">
                                <option value="حاضر">حاضر</option>
                                <option value="متأخر">متأخر</option>
                                <option value="غائب">غائب</option>
                                <option value="عمل ميداني">عمل ميداني</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">ملاحظات</label>
                            <textarea id="attendance-notes" class="form-input" rows="3" placeholder="ملاحظات"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button type="button" id="save-attendance-btn" class="btn-primary">حفظ</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const saveBtn = modal.querySelector('#save-attendance-btn');
        const form = modal.querySelector('#attendance-form');
        saveBtn.addEventListener('click', () => this.handleAttendanceSubmit(form, selectedMemberId, modal));

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async handleAttendanceSubmit(form, memberId, modal) {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = {
            memberId: memberId,
            date: document.getElementById('attendance-date').value,
            checkIn: document.getElementById('attendance-check-in').value || null,
            checkOut: document.getElementById('attendance-check-out').value || null,
            status: document.getElementById('attendance-status').value,
            notes: document.getElementById('attendance-notes').value.trim()
        };

        Loading.show();
        try {
            const response = await GoogleIntegration.sendRequest({
                action: 'addSafetyTeamAttendance',
                data: formData
            });

            if (response.success) {
                Notification.success('تم تسجيل الحضور بنجاح');
                modal.remove();
                this.loadMemberAttendance(memberId);
            } else {
                Notification.error('حدث خطأ: ' + (response.message || 'فشل الحفظ'));
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    async showLeaveForm() {
        const memberSelect = document.getElementById('attendance-member-select');
        const selectedMemberId = memberSelect?.value;

        if (!selectedMemberId) {
            Notification.error('يرجى اختيار عضو الفريق أولاً');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 class="modal-title">تسجيل إجازة</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="leave-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">نوع الإجازة *</label>
                            <select id="leave-type" required class="form-input">
                                <option value="سنوية">سنوية</option>
                                <option value="مرضية">مرضية</option>
                                <option value="طارئة">طارئة</option>
                                <option value="أخرى">أخرى</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">تاريخ البداية *</label>
                                <input type="date" id="leave-start-date" required class="form-input">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">تاريخ النهاية *</label>
                                <input type="date" id="leave-end-date" required class="form-input">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">سبب الإجازة</label>
                            <textarea id="leave-reason" class="form-input" rows="3" placeholder="سبب الإجازة"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">حالة الاعتماد</label>
                            <select id="leave-approval-status" class="form-input">
                                <option value="قيد المراجعة">قيد المراجعة</option>
                                <option value="معتمد">معتمد</option>
                                <option value="مرفوض">مرفوض</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button type="button" id="save-leave-btn" class="btn-primary">حفظ</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const saveBtn = modal.querySelector('#save-leave-btn');
        const form = modal.querySelector('#leave-form');
        saveBtn.addEventListener('click', () => this.handleLeaveSubmit(form, selectedMemberId, modal));

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async handleLeaveSubmit(form, memberId, modal) {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = {
            memberId: memberId,
            leaveType: document.getElementById('leave-type').value,
            startDate: document.getElementById('leave-start-date').value,
            endDate: document.getElementById('leave-end-date').value,
            reason: document.getElementById('leave-reason').value.trim(),
            approvalStatus: document.getElementById('leave-approval-status').value
        };

        Loading.show();
        try {
            const response = await GoogleIntegration.sendRequest({
                action: 'addSafetyTeamLeave',
                data: formData
            });

            if (response.success) {
                Notification.success('تم تسجيل الإجازة بنجاح');
                modal.remove();
                this.loadMemberLeaves(memberId);
            } else {
                Notification.error('حدث خطأ: ' + (response.message || 'فشل الحفظ'));
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    // ===== Settings View =====
    async renderSettingsView() {
        if (AppState.currentUser?.role !== 'admin') {
            return `<div class="content-card"><div class="card-body"><p class="text-red-500">غير مصرح لك بالوصول إلى هذه الصفحة</p></div></div>`;
        }

        return `
            <div class="content-card">
                <div class="card-header">
                    <h2 class="card-title"><i class="fas fa-cog ml-2"></i>إعدادات الموديول</h2>
                </div>
                <div class="card-body">
                    <div id="settings-container" class="space-y-6">
                        <div class="empty-state">
                            <p class="text-gray-500">جاري تحميل الإعدادات...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadSettings() {
        if (AppState.currentUser?.role !== 'admin') return;

        const container = document.getElementById('settings-container');
        if (!container) return;

        // التحقق من إمكانية الوصول للبيانات (للإعدادات، نحاول جلبها حتى لو لم يكن مفعلاً لعرض القيم الافتراضية)
        if (!this.isBackendAvailable()) {
            // عرض الإعدادات الافتراضية إذا لم يكن الاتصال بقاعدة البيانات مفعّلاً
            const defaultSettings = {
                leaveTypes: ['سنوية', 'مرضية', 'طارئة', 'أخرى'],
                attendanceStatuses: ['حاضر', 'متأخر', 'غائب', 'عمل ميداني'],
                kpiTargets: {
                    targetInspections: 20,
                    targetActionsClosure: 80,
                    targetObservations: 15,
                    targetTrainings: 3,
                    targetCommitment: 95,
                    inspectionsPerMonth: 20,
                    actionsClosureRate: 80,
                    observationsPerMonth: 15,
                    trainingsPerMonth: 2,
                    commitmentRate: 95
                }
            };
            this.renderSettingsContent(container, defaultSettings);
            return;
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'getSafetyHealthManagementSettings',
                data: {}
            });

            if (response.success && response.data) {
                const settings = response.data;
                this.renderSettingsContent(container, settings);
            } else {
                // عرض الإعدادات الافتراضية في حالة فشل التحميل
                const defaultSettings = {
                    leaveTypes: ['سنوية', 'مرضية', 'طارئة', 'أخرى'],
                    attendanceStatuses: ['حاضر', 'متأخر', 'غائب', 'عمل ميداني'],
                    kpiTargets: {
                        targetInspections: 20,
                        targetActionsClosure: 80,
                        targetObservations: 15,
                        targetTrainings: 3,
                        targetCommitment: 95,
                        inspectionsPerMonth: 20,
                        actionsClosureRate: 80,
                        observationsPerMonth: 15,
                        trainingsPerMonth: 2,
                        commitmentRate: 95
                    }
                };
                this.renderSettingsContent(container, defaultSettings);
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            
            if (this.isBackendAvailable()) Utils.safeError('خطأ في تحميل الإعدادات:', errorMessage, error);

            // عرض الإعدادات الافتراضية في حالة الخطأ
            const defaultSettings = {
                leaveTypes: ['سنوية', 'مرضية', 'طارئة', 'أخرى'],
                attendanceStatuses: ['حاضر', 'متأخر', 'غائب', 'عمل ميداني'],
                kpiTargets: {
                    targetInspections: 20,
                    targetActionsClosure: 80,
                    targetObservations: 15,
                    targetTrainings: 3,
                    targetCommitment: 95,
                    inspectionsPerMonth: 20,
                    actionsClosureRate: 80,
                    observationsPerMonth: 15,
                    trainingsPerMonth: 2,
                    commitmentRate: 95
                }
            };
            this.renderSettingsContent(container, defaultSettings);
        } finally {
            Loading.hide();
        }
    },

    renderSettingsContent(container, settings) {
        if (!container || !settings) return;

                container.innerHTML = `
                    <div>
                        <h3 class="font-semibold text-gray-700 mb-3">أنواع الإجازات</h3>
                        <div id="leave-types-container" class="space-y-2">
                            ${(settings.leaveTypes || ['سنوية', 'مرضية', 'طارئة', 'أخرى']).map((type, index) => `
                                <div class="flex items-center gap-2">
                                    <input type="text" class="form-input flex-1 leave-type-input" 
                                           value="${Utils.escapeHTML(type)}" data-index="${index}">
                                    <button onclick="SafetyHealthManagement.removeLeaveType(${index})" class="btn-danger btn-sm">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <button onclick="SafetyHealthManagement.addLeaveType()" class="btn-secondary btn-sm mt-2">
                            <i class="fas fa-plus ml-2"></i>
                            إضافة نوع إجازة
                        </button>
                        <button onclick="SafetyHealthManagement.saveLeaveTypes()" class="btn-primary btn-sm mt-2 ml-2">
                            <i class="fas fa-save ml-2"></i>
                            حفظ أنواع الإجازات
                        </button>
                    </div>
                    
                    <div class="border-t border-gray-200 pt-6 mt-6">
                        <h3 class="font-semibold text-gray-700 mb-3">تصنيفات الحضور</h3>
                        <div id="attendance-statuses-container" class="space-y-2">
                            ${(settings.attendanceStatuses || ['حاضر', 'متأخر', 'غائب', 'عمل ميداني']).map((status, index) => `
                                <div class="flex items-center gap-2">
                                    <input type="text" class="form-input flex-1 attendance-status-input" 
                                           value="${Utils.escapeHTML(status)}" data-index="${index}">
                                    <button onclick="SafetyHealthManagement.removeAttendanceStatus(${index})" class="btn-danger btn-sm">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <button onclick="SafetyHealthManagement.addAttendanceStatus()" class="btn-secondary btn-sm mt-2">
                            <i class="fas fa-plus ml-2"></i>
                            إضافة تصنيف حضور
                        </button>
                        <button onclick="SafetyHealthManagement.saveAttendanceStatuses()" class="btn-primary btn-sm mt-2 ml-2">
                            <i class="fas fa-save ml-2"></i>
                            حفظ تصنيفات الحضور
                        </button>
                    </div>
                    
                    <div class="border-t border-gray-200 pt-6 mt-6">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-semibold text-gray-700">أهداف مؤشرات الأداء الافتراضية</h3>
                            <button onclick="SafetyHealthManagement.showKPITargetsForm()" class="btn-secondary btn-sm">
                                <i class="fas fa-edit ml-2"></i>
                                تعديل الأهداف الافتراضية
                            </button>
                        </div>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">الجولات التفتيشية الشهرية:</span>
                                    <span class="font-semibold">${settings.kpiTargets?.inspectionsPerMonth || 20}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">نسبة إغلاق الإجراءات:</span>
                                    <span class="font-semibold">${settings.kpiTargets?.actionsClosureRate || 80}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">الملاحظات الشهرية:</span>
                                    <span class="font-semibold">${settings.kpiTargets?.observationsPerMonth || 15}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">التدريبات الشهرية:</span>
                                    <span class="font-semibold">${settings.kpiTargets?.trainingsPerMonth || 2}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">نسبة الالتزام:</span>
                                    <span class="font-semibold">${settings.kpiTargets?.commitmentRate || 95}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="border-t border-gray-200 pt-6 mt-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-semibold text-gray-700">إدارة مؤشرات الأداء المخصصة</h3>
                            <button onclick="SafetyHealthManagement.showCustomKPIForm()" class="btn-primary btn-sm">
                                <i class="fas fa-plus ml-2"></i>
                                إضافة مؤشر جديد
                            </button>
                        </div>
                        <div id="custom-kpis-container" class="space-y-3">
                            <div class="empty-state">
                                <p class="text-gray-500">جاري تحميل المؤشرات المخصصة...</p>
                            </div>
                        </div>
                    </div>
                `;

                // Store settings for later use
                this.currentSettings = settings;

        // ربط جميع الأزرار بعد عرض المحتوى
        requestAnimationFrame(() => {
            // ربط أزرار إضافة وحذف أنواع الإجازات
            const addLeaveTypeBtn = container.querySelector('button[onclick*="addLeaveType"]');
            if (addLeaveTypeBtn) {
                const newBtn = addLeaveTypeBtn.cloneNode(true);
                addLeaveTypeBtn.parentNode.replaceChild(newBtn, addLeaveTypeBtn);
                newBtn.addEventListener('click', () => this.addLeaveType());
            }

            const saveLeaveTypesBtn = container.querySelector('button[onclick*="saveLeaveTypes"]');
            if (saveLeaveTypesBtn) {
                const newBtn = saveLeaveTypesBtn.cloneNode(true);
                saveLeaveTypesBtn.parentNode.replaceChild(newBtn, saveLeaveTypesBtn);
                newBtn.addEventListener('click', () => this.saveLeaveTypes());
            }

            // ربط أزرار إضافة وحذف تصنيفات الحضور
            const addAttendanceStatusBtn = container.querySelector('button[onclick*="addAttendanceStatus"]');
            if (addAttendanceStatusBtn) {
                const newBtn = addAttendanceStatusBtn.cloneNode(true);
                addAttendanceStatusBtn.parentNode.replaceChild(newBtn, addAttendanceStatusBtn);
                newBtn.addEventListener('click', () => this.addAttendanceStatus());
            }

            const saveAttendanceStatusesBtn = container.querySelector('button[onclick*="saveAttendanceStatuses"]');
            if (saveAttendanceStatusesBtn) {
                const newBtn = saveAttendanceStatusesBtn.cloneNode(true);
                saveAttendanceStatusesBtn.parentNode.replaceChild(newBtn, saveAttendanceStatusesBtn);
                newBtn.addEventListener('click', () => this.saveAttendanceStatuses());
            }

            // ربط أزرار KPIs
            const showKPITargetsBtn = container.querySelector('button[onclick*="showKPITargetsForm"]');
            if (showKPITargetsBtn) {
                const newBtn = showKPITargetsBtn.cloneNode(true);
                showKPITargetsBtn.parentNode.replaceChild(newBtn, showKPITargetsBtn);
                newBtn.addEventListener('click', () => this.showKPITargetsForm());
            }

            const showCustomKPIFormBtn = container.querySelector('button[onclick*="showCustomKPIForm"]');
            if (showCustomKPIFormBtn) {
                const newBtn = showCustomKPIFormBtn.cloneNode(true);
                showCustomKPIFormBtn.parentNode.replaceChild(newBtn, showCustomKPIFormBtn);
                newBtn.addEventListener('click', () => this.showCustomKPIForm());
            }
        });

        // Load custom KPIs after rendering
        this.loadCustomKPIs();
    },

    addLeaveType() {
        const container = document.getElementById('leave-types-container');
        if (!container) return;

        const index = container.children.length;
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2';
        div.innerHTML = `
            <input type="text" class="form-input flex-1 leave-type-input" 
                   placeholder="نوع الإجازة" data-index="${index}">
            <button onclick="SafetyHealthManagement.removeLeaveType(${index})" class="btn-danger btn-sm">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(div);
    },

    removeLeaveType(index) {
        const container = document.getElementById('leave-types-container');
        if (!container) return;
        const input = container.querySelector(`[data-index="${index}"]`)?.closest('.flex');
        if (input) input.remove();
    },

    async saveLeaveTypes() {
        const container = document.getElementById('leave-types-container');
        if (!container) return;

        // التحقق من حالة الخادم قبل محاولة الحفظ
        // عمليات الحفظ تتطلب الاتصال بالخادم
        if (!this.isBackendAvailable()) {
            Notification.warning('الاتصال بقاعدة البيانات غير مفعّل. يرجى تفعيله من الإعدادات');
            return;
        }

        const leaveTypes = Array.from(container.querySelectorAll('.leave-type-input'))
            .map(input => input.value.trim())
            .filter(value => value !== '');

        if (leaveTypes.length === 0) {
            Notification.error('يرجى إضافة نوع إجازة واحد على الأقل');
            return;
        }

        Loading.show();
        try {
            const response = await GoogleIntegration.sendRequest({
                action: 'updateLeaveTypes',
                data: { leaveTypes: leaveTypes }
            });

            if (response.success) {
                Notification.success('تم حفظ أنواع الإجازات بنجاح');
                this.loadSettings();
            } else {
                Notification.error('حدث خطأ: ' + (response.message || 'فشل الحفظ'));
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    addAttendanceStatus() {
        const container = document.getElementById('attendance-statuses-container');
        if (!container) return;

        const index = container.children.length;
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2';
        div.innerHTML = `
            <input type="text" class="form-input flex-1 attendance-status-input" 
                   placeholder="تصنيف الحضور" data-index="${index}">
            <button onclick="SafetyHealthManagement.removeAttendanceStatus(${index})" class="btn-danger btn-sm">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(div);
    },

    removeAttendanceStatus(index) {
        const container = document.getElementById('attendance-statuses-container');
        if (!container) return;
        const input = container.querySelector(`[data-index="${index}"]`)?.closest('.flex');
        if (input) input.remove();
    },

    async saveAttendanceStatuses() {
        const container = document.getElementById('attendance-statuses-container');
        if (!container) return;

        // التحقق من حالة الخادم قبل محاولة الحفظ
        if (!this.isBackendAvailable()) {
            Notification.warning('الاتصال بقاعدة البيانات غير مفعّل. يرجى تفعيله من الإعدادات');
            return;
        }

        const statuses = Array.from(container.querySelectorAll('.attendance-status-input'))
            .map(input => input.value.trim())
            .filter(value => value !== '');

        if (statuses.length === 0) {
            Notification.error('يرجى إضافة تصنيف حضور واحد على الأقل');
            return;
        }

        Loading.show();
        try {
            const response = await GoogleIntegration.sendRequest({
                action: 'updateAttendanceStatuses',
                data: { statuses: statuses }
            });

            if (response.success) {
                Notification.success('تم حفظ تصنيفات الحضور بنجاح');
                this.loadSettings();
            } else {
                Notification.error('حدث خطأ: ' + (response.message || 'فشل الحفظ'));
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    showKPITargetsForm() {
        const settings = this.currentSettings || {};
        const kpiTargets = settings.kpiTargets || {};
        
        // الحصول على الأهداف المخصصة الإضافية
        const customTargets = this.getCustomKPITargets(kpiTargets);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2 class="modal-title">تعديل أهداف مؤشرات الأداء الافتراضية</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="kpi-targets-form" class="space-y-4">
                        <h3 class="text-lg font-semibold text-gray-700 mb-3">الأهداف الافتراضية</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الجولات التفتيشية الشهرية *</label>
                                <input type="number" id="kpi-target-inspections" required class="form-input" 
                                       value="${kpiTargets.inspectionsPerMonth || 20}" min="0">
                                <p class="text-xs text-gray-500 mt-1">عدد الجولات التفتيشية المطلوبة شهرياً</p>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">نسبة إغلاق الإجراءات (%) *</label>
                                <input type="number" id="kpi-target-actions-closure" required class="form-input" 
                                       value="${kpiTargets.actionsClosureRate || 80}" min="0" max="100">
                                <p class="text-xs text-gray-500 mt-1">نسبة الإجراءات المغلقة من إجمالي الإجراءات</p>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الملاحظات الشهرية *</label>
                                <input type="number" id="kpi-target-observations" required class="form-input" 
                                       value="${kpiTargets.observationsPerMonth || 15}" min="0">
                                <p class="text-xs text-gray-500 mt-1">عدد الملاحظات المطلوبة شهرياً</p>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">التدريبات الشهرية *</label>
                                <input type="number" id="kpi-target-trainings" required class="form-input" 
                                       value="${kpiTargets.trainingsPerMonth || 2}" min="0">
                                <p class="text-xs text-gray-500 mt-1">عدد التدريبات المطلوبة شهرياً</p>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">نسبة الالتزام (%) *</label>
                                <input type="number" id="kpi-target-commitment" required class="form-input" 
                                       value="${kpiTargets.commitmentRate || 95}" min="0" max="100">
                                <p class="text-xs text-gray-500 mt-1">نسبة الالتزام بالحضور والمهام المطلوبة</p>
                            </div>
                        </div>
                        
                        <div class="border-t border-gray-200 pt-4 mt-4">
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="text-lg font-semibold text-gray-700">أهداف إضافية</h3>
                                <button type="button" id="add-custom-target-btn" class="btn-secondary btn-sm">
                                    <i class="fas fa-plus ml-1"></i>إضافة هدف جديد
                                </button>
                            </div>
                            <div id="custom-targets-container" class="space-y-3">
                                ${this.renderCustomTargets(customTargets)}
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button type="button" id="save-kpi-targets-btn" class="btn-primary">حفظ التعديلات</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // ربط حدث إضافة هدف جديد
        const addBtn = modal.querySelector('#add-custom-target-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addCustomTarget(modal));
        }

        const saveBtn = modal.querySelector('#save-kpi-targets-btn');
        saveBtn.addEventListener('click', () => this.saveKPITargets(modal));

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },
    
    getCustomKPITargets(kpiTargets) {
        const defaultKeys = ['inspectionsPerMonth', 'actionsClosureRate', 'observationsPerMonth', 
                           'trainingsPerMonth', 'commitmentRate', 'targetInspections', 
                           'targetActionsClosure', 'targetObservations', 'targetTrainings', 
                           'targetCommitment'];
        const custom = {};
        for (const key in kpiTargets) {
            if (!defaultKeys.includes(key)) {
                custom[key] = kpiTargets[key];
            }
        }
        return custom;
    },
    
    renderCustomTargets(customTargets) {
        if (!customTargets || Object.keys(customTargets).length === 0) {
            return '<p class="text-sm text-gray-500">لا توجد أهداف إضافية</p>';
        }
        
        let html = '';
        for (const key in customTargets) {
            html += `
                <div class="flex items-center gap-2 custom-target-item" data-key="${Utils.escapeHTML(key)}">
                    <input type="text" class="form-input flex-1" value="${Utils.escapeHTML(key)}" 
                           placeholder="اسم الهدف" readonly>
                    <input type="number" class="form-input w-32" value="${customTargets[key]}" 
                           placeholder="القيمة" min="0" data-target-key="${Utils.escapeHTML(key)}">
                    <button type="button" class="btn-icon btn-icon-danger" onclick="this.closest('.custom-target-item').remove()">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }
        return html;
    },
    
    addCustomTarget(modal) {
        const container = modal.querySelector('#custom-targets-container');
        if (!container) return;
        
        const newKey = `custom_${Date.now()}`;
        const newItem = document.createElement('div');
        newItem.className = 'flex items-center gap-2 custom-target-item';
        newItem.setAttribute('data-key', newKey);
        newItem.innerHTML = `
            <input type="text" class="form-input flex-1" placeholder="اسم الهدف (مثال: عدد التقارير)" 
                   id="custom-target-name-${newKey}">
            <input type="number" class="form-input w-32" value="0" placeholder="القيمة" min="0" 
                   data-target-key="${newKey}" id="custom-target-value-${newKey}">
            <button type="button" class="btn-icon btn-icon-danger" onclick="this.closest('.custom-target-item').remove()">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(newItem);
        
        // التركيز على حقل الاسم فوراً
        requestAnimationFrame(() => {
            const nameInput = newItem.querySelector(`#custom-target-name-${newKey}`);
            if (nameInput) nameInput.focus();
        });
    },

    async saveKPITargets(modal = null) {
        // التحقق من حالة الخادم قبل محاولة الحفظ
        // عمليات الحفظ تتطلب الاتصال بالخادم
        if (!this.isBackendAvailable()) {
            Notification.warning('الاتصال بقاعدة البيانات غير مفعّل. يرجى تفعيله من الإعدادات');
            return;
        }

        const targets = {
            inspectionsPerMonth: parseInt(document.getElementById('kpi-target-inspections')?.value) || 20,
            actionsClosureRate: parseInt(document.getElementById('kpi-target-actions-closure')?.value) || 80,
            observationsPerMonth: parseInt(document.getElementById('kpi-target-observations')?.value) || 15,
            trainingsPerMonth: parseInt(document.getElementById('kpi-target-trainings')?.value) || 2,
            commitmentRate: parseInt(document.getElementById('kpi-target-commitment')?.value) || 95,
            // إضافة الأهداف الأساسية أيضاً
            targetInspections: parseInt(document.getElementById('kpi-target-inspections')?.value) || 20,
            targetActionsClosure: parseInt(document.getElementById('kpi-target-actions-closure')?.value) || 80,
            targetObservations: parseInt(document.getElementById('kpi-target-observations')?.value) || 15,
            targetTrainings: parseInt(document.getElementById('kpi-target-trainings')?.value) || 2,
            targetCommitment: parseInt(document.getElementById('kpi-target-commitment')?.value) || 95
        };

        // جمع الأهداف الإضافية المخصصة
        if (modal) {
            const customItems = modal.querySelectorAll('.custom-target-item');
            customItems.forEach(item => {
                const nameInput = item.querySelector('input[type="text"]');
                const valueInput = item.querySelector('input[type="number"]');
                if (nameInput && valueInput) {
                    const name = nameInput.value.trim();
                    const value = parseInt(valueInput.value) || 0;
                    if (name) {
                        targets[name] = value;
                    }
                }
            });
        }

        Loading.show();
        try {
            const response = await GoogleIntegration.sendRequest({
                action: 'updateKPITargets',
                data: { targets: targets }
            });

            if (response.success) {
                Notification.success('تم حفظ أهداف KPIs بنجاح');
                if (modal) modal.remove();
                this.loadSettings();
            } else {
                Notification.error('حدث خطأ: ' + (response.message || 'فشل الحفظ'));
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    // ===== Custom KPIs Management =====
    async loadCustomKPIs() {
        const container = document.getElementById('custom-kpis-container');
        if (!container) return;

        // التحقق من إمكانية الوصول للبيانات
        const accessMessage = this.getDataAccessMessage('getCustomKPIs', {});
        if (accessMessage) {
            container.innerHTML = `
                <div class="empty-state">
                    <p class="text-gray-500 mb-2">${accessMessage}</p>
                    <p class="text-xs text-gray-400">لا توجد مؤشرات مخصصة متاحة</p>
                </div>
            `;
            return;
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'getSafetyHealthManagementSettings',
                data: {}
            });

            if (response.success && response.data) {
                const settings = response.data;
                this.currentSettings = settings; // Store for later use
                const customKPIs = settings.customKPIs || [];

                if (customKPIs.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <p class="text-gray-500 mb-2">لا توجد مؤشرات مخصصة مسجلة</p>
                            <p class="text-xs text-gray-400">يمكنك إضافة مؤشرات أداء جديدة وربطها بالموديولات المختلفة</p>
                        </div>
                    `;
                    Loading.hide();
                    return;
                }

                container.innerHTML = customKPIs.map((kpi, index) => `
                    <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div class="flex items-start justify-between mb-3">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-2">
                                    <h4 class="font-semibold text-gray-800">${Utils.escapeHTML(kpi.name || '')}</h4>
                                    <span class="px-2 py-1 text-xs rounded ${this.getKPICategoryColor(kpi.category)}">
                                        ${Utils.escapeHTML(this.getKPICategoryLabel(kpi.category || ''))}
                                    </span>
                                    ${kpi.isActive !== false ? '<span class="badge badge-success text-xs">نشط</span>' : '<span class="badge badge-secondary text-xs">غير نشط</span>'}
                                </div>
                                <p class="text-sm text-gray-600 mb-2">${Utils.escapeHTML(kpi.description || '')}</p>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                    <div>
                                        <span class="text-gray-500">الموديول:</span>
                                        <span class="font-semibold">${Utils.escapeHTML(this.getModuleLabel(kpi.module || ''))}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">الهدف الشهري:</span>
                                        <span class="font-semibold">${kpi.targetValue || 0}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">وحدة القياس:</span>
                                        <span class="font-semibold">${Utils.escapeHTML(kpi.unit || 'عدد')}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">تاريخ الإنشاء:</span>
                                        <span class="font-semibold">${kpi.createdAt ? Utils.formatDate(kpi.createdAt) : '—'}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="SafetyHealthManagement.editCustomKPI('${kpi.id || index}')" class="btn-icon btn-icon-primary" title="تعديل">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="SafetyHealthManagement.deleteCustomKPI('${kpi.id || index}')" class="btn-icon btn-icon-danger" title="حذف">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في تحميل المؤشرات المخصصة:', errorMessage, error);
            container.innerHTML = `
                <div class="empty-state">
                    <p class="text-red-500 mb-2">حدث خطأ في تحميل المؤشرات المخصصة</p>
                    <button onclick="SafetyHealthManagement.loadCustomKPIs()" class="btn-secondary btn-sm mt-2">
                        <i class="fas fa-redo ml-1"></i>إعادة المحاولة
                    </button>
                </div>
            `;
        } finally {
            Loading.hide();
        }
    },

    showCustomKPIForm(kpiData = null) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2 class="modal-title">${kpiData ? 'تعديل مؤشر الأداء' : 'إضافة مؤشر أداء جديد'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="custom-kpi-form" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">اسم المؤشر *</label>
                                <input type="text" id="custom-kpi-name" required class="form-input" 
                                       value="${Utils.escapeHTML(kpiData?.name || '')}" 
                                       placeholder="مثال: عدد الحوادث الوشيكة المعالجة">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الفئة *</label>
                                <select id="custom-kpi-category" required class="form-input">
                                    <option value="">اختر الفئة</option>
                                    <option value="inspections" ${kpiData?.category === 'inspections' ? 'selected' : ''}>الجولات والفحوصات</option>
                                    <option value="training" ${kpiData?.category === 'training' ? 'selected' : ''}>التدريب</option>
                                    <option value="observations" ${kpiData?.category === 'observations' ? 'selected' : ''}>الملاحظات</option>
                                    <option value="near-miss" ${kpiData?.category === 'near-miss' ? 'selected' : ''}>الحوادث الوشيكة</option>
                                    <option value="actions" ${kpiData?.category === 'actions' ? 'selected' : ''}>الإجراءات التصحيحية</option>
                                    <option value="other" ${kpiData?.category === 'other' ? 'selected' : ''}>أخرى</option>
                                </select>
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الوصف</label>
                                <textarea id="custom-kpi-description" class="form-input" rows="2" 
                                          placeholder="وصف تفصيلي للمؤشر">${Utils.escapeHTML(kpiData?.description || '')}</textarea>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الموديول المرتبط *</label>
                                <select id="custom-kpi-module" required class="form-input">
                                    <option value="">اختر الموديول</option>
                                    <option value="PeriodicInspectionRecords" ${kpiData?.module === 'PeriodicInspectionRecords' ? 'selected' : ''}>الجولات والفحوصات الدورية</option>
                                    <option value="Training" ${kpiData?.module === 'Training' ? 'selected' : ''}>التدريب</option>
                                    <option value="DailyObservations" ${kpiData?.module === 'DailyObservations' ? 'selected' : ''}>الملاحظات اليومية</option>
                                    <option value="NearMiss" ${kpiData?.module === 'NearMiss' ? 'selected' : ''}>الحوادث الوشيكة</option>
                                    <option value="ActionTrackingRegister" ${kpiData?.module === 'ActionTrackingRegister' ? 'selected' : ''}>سجل متابعة الإجراءات</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الهدف الشهري *</label>
                                <input type="number" id="custom-kpi-target" required class="form-input" 
                                       value="${kpiData?.targetValue || 0}" min="0" step="0.01">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">وحدة القياس</label>
                                <input type="text" id="custom-kpi-unit" class="form-input" 
                                       value="${Utils.escapeHTML(kpiData?.unit || 'عدد')}" 
                                       placeholder="مثال: عدد، نسبة، ساعة">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">حقل البيانات المراد عدّه</label>
                                <input type="text" id="custom-kpi-field" class="form-input" 
                                       value="${Utils.escapeHTML(kpiData?.fieldName || '')}" 
                                       placeholder="مثال: status, type, category">
                                <p class="text-xs text-gray-500 mt-1">اسم الحقل في البيانات المراد استخدامه (اختياري)</p>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">قيمة الفلترة (اختياري)</label>
                                <input type="text" id="custom-kpi-filter-value" class="form-input" 
                                       value="${Utils.escapeHTML(kpiData?.filterValue || '')}" 
                                       placeholder="مثال: مكتمل، active، closed">
                                <p class="text-xs text-gray-500 mt-1">قيمة الفلترة للحقل المحدد (اختياري)</p>
                            </div>
                            <div class="md:col-span-2">
                                <label class="flex items-center gap-2">
                                    <input type="checkbox" id="custom-kpi-active" ${kpiData?.isActive !== false ? 'checked' : ''} class="form-checkbox">
                                    <span class="text-sm font-semibold text-gray-700">المؤشر نشط</span>
                                </label>
                                <p class="text-xs text-gray-500 mt-1">عند التفعيل، سيتم حساب هذا المؤشر تلقائياً في تقارير الأداء</p>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button type="button" id="save-custom-kpi-btn" class="btn-primary">${kpiData ? 'تحديث' : 'حفظ'}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const saveBtn = modal.querySelector('#save-custom-kpi-btn');
        saveBtn.addEventListener('click', () => this.handleCustomKPISubmit(modal, kpiData?.id));

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async handleCustomKPISubmit(modal, kpiId = null) {
        // التحقق من حالة الخادم قبل محاولة الحفظ
        // عمليات الحفظ تتطلب الاتصال بالخادم
        if (!this.isBackendAvailable()) {
            Notification.warning('الاتصال بقاعدة البيانات غير مفعّل. يرجى تفعيله من الإعدادات');
            return;
        }

        const form = modal.querySelector('#custom-kpi-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const kpiData = {
            name: document.getElementById('custom-kpi-name').value.trim(),
            category: document.getElementById('custom-kpi-category').value,
            description: document.getElementById('custom-kpi-description').value.trim(),
            module: document.getElementById('custom-kpi-module').value,
            targetValue: parseFloat(document.getElementById('custom-kpi-target').value) || 0,
            unit: document.getElementById('custom-kpi-unit').value.trim() || 'عدد',
            fieldName: document.getElementById('custom-kpi-field').value.trim() || null,
            filterValue: document.getElementById('custom-kpi-filter-value').value.trim() || null,
            isActive: document.getElementById('custom-kpi-active').checked
        };

        if (!kpiData.name || !kpiData.category || !kpiData.module) {
            Notification.error('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        Loading.show();
        try {
            const action = kpiId ? 'updateCustomKPI' : 'addCustomKPI';
            const payload = kpiId ? { kpiId: kpiId, updateData: kpiData } : kpiData;

            const response = await GoogleIntegration.sendRequest({
                action: action,
                data: payload
            });

            if (response.success) {
                Notification.success(kpiId ? 'تم تحديث المؤشر بنجاح' : 'تم إضافة المؤشر بنجاح');
                modal.remove();
                this.loadCustomKPIs();
                this.loadSettings();
            } else {
                Notification.error('حدث خطأ: ' + (response.message || 'فشل الحفظ'));
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    async editCustomKPI(kpiId) {
        if (!this.isBackendAvailable()) {
            Notification.warning('الاتصال بقاعدة البيانات غير مفعّل. لا يمكن تعديل المؤشر');
            return;
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'getSafetyHealthManagementSettings',
                data: {}
            });

            if (response.success && response.data) {
                const settings = response.data;
                const customKPIs = settings.customKPIs || [];
                const kpi = customKPIs.find(k => (k.id || '').toString() === kpiId.toString() || customKPIs.indexOf(k).toString() === kpiId.toString());

                if (kpi) {
                    this.showCustomKPIForm(kpi);
                } else {
                    Notification.error('لم يتم العثور على المؤشر');
                }
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    async deleteCustomKPI(kpiId) {
        if (!this.isBackendAvailable()) {
            Notification.warning('الاتصال بقاعدة البيانات غير مفعّل. لا يمكن حذف المؤشر');
            return;
        }

        if (!confirm('هل أنت متأكد من حذف هذا المؤشر؟ سيتم إزالة جميع البيانات المرتبطة به.')) {
            return;
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'deleteCustomKPI',
                data: { kpiId: kpiId }
            });

            if (response.success) {
                Notification.success('تم حذف المؤشر بنجاح');
                this.loadCustomKPIs();
            } else {
                Notification.error('حدث خطأ: ' + (response.message || 'فشل الحذف'));
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    // ===== Export All Data to Excel =====
    async exportAllToExcel() {
        try {
            Loading.show();

            // Check if XLSX library is available
            if (typeof XLSX === 'undefined') {
                Notification.error('مكتبة Excel غير متوفرة. يرجى التأكد من تحميل المكتبة');
                Loading.hide();
                return;
            }

            const wb = XLSX.utils.book_new();

            // Sheet 1: Team Members
            try {
                const membersResponse = await GoogleIntegration.sendRequest({
                    action: 'getSafetyTeamMembers',
                    data: {}
                });

                if (membersResponse.success && membersResponse.data) {
                    const members = Array.isArray(membersResponse.data) ? membersResponse.data : [];
                    const membersData = [
                        ['الاسم', 'الوظيفة', 'القسم', 'البريد الإلكتروني', 'الهاتف', 'تاريخ التعيين', 'الدرجة الوظيفية', 'رمز الموظف']
                    ];

                    members.forEach(member => {
                        membersData.push([
                            member.name || '',
                            member.jobTitle || '',
                            member.department || '',
                            member.email || '',
                            member.phone || '',
                            member.appointmentDate ? Utils.formatDate(member.appointmentDate) : '',
                            member.positionLevel || '',
                            member.employeeCode || ''
                        ]);
                    });

                    const ws1 = XLSX.utils.aoa_to_sheet(membersData);
                    XLSX.utils.book_append_sheet(wb, ws1, 'فريق السلامة');
                }
            } catch (error) {
                Utils.safeLog('خطأ في تصدير فريق السلامة:', error);
            }

            // Sheet 2: Organizational Structure
            try {
                const structureResponse = await GoogleIntegration.sendRequest({
                    action: 'getOrganizationalStructure',
                    data: {}
                });

                if (structureResponse.success && structureResponse.data) {
                    const structure = Array.isArray(structureResponse.data) ? structureResponse.data : [];
                    const structureData = [
                        ['المنصب', 'اسم العضو', 'الدرجة الوظيفية', 'الترتيب']
                    ];

                    structure.forEach(item => {
                        structureData.push([
                            item.position || '',
                            item.memberName || '',
                            item.positionLevel || '',
                            item.order || ''
                        ]);
                    });

                    const ws2 = XLSX.utils.aoa_to_sheet(structureData);
                    XLSX.utils.book_append_sheet(wb, ws2, 'الهيكل الوظيفي');
                }
            } catch (error) {
                Utils.safeLog('خطأ في تصدير الهيكل الوظيفي:', error);
            }

            // Sheet 3: Job Descriptions
            try {
                const membersResponse = await GoogleIntegration.sendRequest({
                    action: 'getSafetyTeamMembers',
                    data: {}
                });

                if (membersResponse.success && membersResponse.data) {
                    const members = Array.isArray(membersResponse.data) ? membersResponse.data : [];
                    const jobDescriptionsData = [
                        ['اسم العضو', 'الوظيفة', 'الدور الوظيفي', 'المسؤوليات', 'المهام', 'نطاق العمل', 'المؤهلات المطلوبة']
                    ];

                    for (const member of members) {
                        try {
                            const jdResponse = await GoogleIntegration.sendRequest({
                                action: 'getJobDescription',
                                data: { memberId: member.id }
                            });

                            if (jdResponse.success && jdResponse.data) {
                                const jd = jdResponse.data;
                                jobDescriptionsData.push([
                                    member.name || '',
                                    jd.jobTitle || '',
                                    jd.roleDescription || '',
                                    jd.responsibilities || '',
                                    jd.tasks || '',
                                    jd.workScope || '',
                                    jd.requiredQualifications || ''
                                ]);
                            }
                        } catch (error) {
                            // Skip this member if there's an error
                        }
                    }

                    if (jobDescriptionsData.length > 1) {
                        const ws3 = XLSX.utils.aoa_to_sheet(jobDescriptionsData);
                        XLSX.utils.book_append_sheet(wb, ws3, 'الوصف الوظيفي');
                    }
                }
            } catch (error) {
                Utils.safeLog('خطأ في تصدير الأوصاف الوظيفية:', error);
            }

            // Generate filename with current date
            const fileName = `إدارة_السلامة_والصحة_المهنية_${new Date().toISOString().slice(0, 10)}.xlsx`;

            // Write file
            XLSX.writeFile(wb, fileName);

            Loading.hide();
            Notification.success('تم تصدير البيانات بنجاح');
        } catch (error) {
            Loading.hide();
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في تصدير البيانات:', errorMessage, error);
            Notification.error('حدث خطأ في التصدير: ' + errorMessage);
        }
    },

    // Helper functions
    getKPICategoryLabel(category) {
        const labels = {
            'inspections': 'الجولات والفحوصات',
            'training': 'التدريب',
            'observations': 'الملاحظات',
            'near-miss': 'الحوادث الوشيكة',
            'actions': 'الإجراءات التصحيحية',
            'other': 'أخرى'
        };
        return labels[category] || category;
    },

    getKPICategoryColor(category) {
        const colors = {
            'inspections': 'bg-blue-100 text-blue-800',
            'training': 'bg-green-100 text-green-800',
            'observations': 'bg-yellow-100 text-yellow-800',
            'near-miss': 'bg-orange-100 text-orange-800',
            'actions': 'bg-purple-100 text-purple-800',
            'other': 'bg-gray-100 text-gray-800'
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    },

    getModuleLabel(module) {
        const labels = {
            'PeriodicInspectionRecords': 'الجولات والفحوصات الدورية',
            'Training': 'التدريب',
            'DailyObservations': 'الملاحظات اليومية',
            'NearMiss': 'الحوادث الوشيكة',
            'ActionTrackingRegister': 'سجل متابعة الإجراءات'
        };
        return labels[module] || module;
    },

    // ===== Attendance & Leaves View =====
    async renderAttendanceView() {
        return `
            <div class="content-card">
                <div class="card-header">
                    <div class="flex items-center justify-between flex-wrap gap-4">
                        <h2 class="card-title"><i class="fas fa-calendar-check ml-2"></i>الحضور والإجازات</h2>
                        <div class="flex gap-2">
                            <select id="attendance-member-select" class="form-input" style="min-width: 200px;">
                                <option value="">اختر عضو الفريق</option>
                            </select>
                            <button id="add-attendance-btn" class="btn-primary">
                                <i class="fas fa-plus ml-2"></i>
                                تسجيل حضور
                            </button>
                            <button id="add-leave-btn" class="btn-secondary">
                                <i class="fas fa-calendar-times ml-2"></i>
                                تسجيل إجازة
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Tabs for Attendance and Leaves -->
                    <div class="mb-6">
                        <div class="flex items-center gap-2 border-b border-gray-200">
                            <button class="attendance-tab-btn active" data-subtab="attendance" onclick="SafetyHealthManagement.switchAttendanceTab('attendance')" style="padding: 10px 16px; border: none; background: transparent; color: #6b7280; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.3s;">
                                <i class="fas fa-clock ml-2"></i>
                                سجل الحضور
                            </button>
                            <button class="attendance-tab-btn" data-subtab="leaves" onclick="SafetyHealthManagement.switchAttendanceTab('leaves')" style="padding: 10px 16px; border: none; background: transparent; color: #6b7280; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.3s;">
                                <i class="fas fa-calendar-alt ml-2"></i>
                                سجل الإجازات
                            </button>
                        </div>
                        <style>
                            .attendance-tab-btn:hover {
                                color: #3b82f6 !important;
                            }
                            .attendance-tab-btn.active {
                                color: #3b82f6 !important;
                                border-bottom-color: #3b82f6 !important;
                                font-weight: 600 !important;
                            }
                        </style>
                    </div>
                    
                    <!-- Attendance Content -->
                    <div id="attendance-content" class="attendance-subtab-content">
                        <div id="attendance-list" class="space-y-3">
                            <div class="empty-state">
                                <p class="text-gray-500">اختر عضو الفريق لعرض سجل الحضور</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Leaves Content -->
                    <div id="leaves-content" class="attendance-subtab-content" style="display: none;">
                        <div id="leaves-list" class="space-y-3">
                            <div class="empty-state">
                                <p class="text-gray-500">اختر عضو الفريق لعرض سجل الإجازات</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadAttendance() {
        const memberSelect = document.getElementById('attendance-member-select');
        const addAttendanceBtn = document.getElementById('add-attendance-btn');
        const addLeaveBtn = document.getElementById('add-leave-btn');
        
        if (!memberSelect) return;

        // التحقق من إمكانية الوصول للبيانات
        const accessMessage = this.getDataAccessMessage('getSafetyTeamAttendance', {});
        if (accessMessage) {
            memberSelect.innerHTML = `<option value="">${Utils.escapeHTML(accessMessage)}</option>`;
            const attendanceList = document.getElementById('attendance-list');
            const leavesList = document.getElementById('leaves-list');
            if (attendanceList) attendanceList.innerHTML = '<div class="empty-state"><p class="text-gray-500">' + Utils.escapeHTML(accessMessage) + '</p></div>';
            if (leavesList) leavesList.innerHTML = '<div class="empty-state"><p class="text-gray-500">' + Utils.escapeHTML(accessMessage) + '</p></div>';
            return;
        }

        try {
            // Load team members
            const membersResponse = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamMembers',
                data: {}
            });

            if (membersResponse.success && membersResponse.data) {
                const members = Array.isArray(membersResponse.data) ? membersResponse.data : [];
                memberSelect.innerHTML = '<option value="">اختر عضو الفريق</option>' +
                    members.map(m => `
                        <option value="${m.id}">${Utils.escapeHTML(m.name || '')} - ${Utils.escapeHTML(m.jobTitle || '')}</option>
                    `).join('');

                // Setup event listeners
                memberSelect.addEventListener('change', () => {
                    const memberId = memberSelect.value;
                    if (memberId) {
                        this.loadMemberAttendance();
                        this.loadMemberLeaves();
                    } else {
                        document.getElementById('attendance-list').innerHTML = '<div class="empty-state"><p class="text-gray-500">اختر عضو الفريق لعرض سجل الحضور</p></div>';
                        document.getElementById('leaves-list').innerHTML = '<div class="empty-state"><p class="text-gray-500">اختر عضو الفريق لعرض سجل الإجازات</p></div>';
                    }
                });

                if (addAttendanceBtn) {
                    addAttendanceBtn.addEventListener('click', () => this.showAttendanceForm());
                }
                if (addLeaveBtn) {
                    addLeaveBtn.addEventListener('click', () => this.showLeaveForm());
                }
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في تحميل الحضور والإجازات:', errorMessage, error);
        }
    },

    switchAttendanceTab(subtab) {
        document.querySelectorAll('.attendance-tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.subtab === subtab) {
                btn.classList.add('active');
            }
        });

        const attendanceContent = document.getElementById('attendance-content');
        const leavesContent = document.getElementById('leaves-content');
        if (attendanceContent) {
            attendanceContent.style.display = subtab === 'attendance' ? 'block' : 'none';
        }
        if (leavesContent) {
            leavesContent.style.display = subtab === 'leaves' ? 'block' : 'none';
        }
    },

    async loadMemberAttendance() {
        const memberSelect = document.getElementById('attendance-member-select');
        const container = document.getElementById('attendance-list');
        
        if (!memberSelect || !container) return;

        const memberId = memberSelect.value;
        if (!memberId) {
            container.innerHTML = '<div class="empty-state"><p class="text-gray-500">اختر عضو الفريق لعرض سجل الحضور</p></div>';
            return;
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamAttendance',
                data: { memberId: memberId }
            });

            if (response.success && response.data) {
                const attendance = Array.isArray(response.data) ? response.data : [];
                
                if (attendance.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p class="text-gray-500">لا توجد سجلات حضور</p></div>';
                    Loading.hide();
                    return;
                }

                // Sort by date descending
                attendance.sort((a, b) => {
                    const dateA = new Date(a.date || 0);
                    const dateB = new Date(b.date || 0);
                    return dateB - dateA;
                });

                container.innerHTML = attendance.map(record => {
                    const statusColors = {
                        'حاضر': 'bg-green-100 text-green-800',
                        'متأخر': 'bg-yellow-100 text-yellow-800',
                        'غائب': 'bg-red-100 text-red-800',
                        'عمل ميداني': 'bg-blue-100 text-blue-800'
                    };
                    const statusColor = statusColors[record.status] || 'bg-gray-100 text-gray-800';
                    
                    return `
                        <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center gap-3 mb-2">
                                        <span class="font-semibold text-gray-800">${Utils.formatDate(record.date)}</span>
                                        <span class="px-2 py-1 text-xs rounded ${statusColor}">${Utils.escapeHTML(record.status || '—')}</span>
                                    </div>
                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                        ${record.checkIn ? `<div><i class="fas fa-sign-in-alt ml-1 text-green-600"></i>دخول: ${this.formatTime(record.checkIn)}</div>` : ''}
                                        ${record.checkOut ? `<div><i class="fas fa-sign-out-alt ml-1 text-red-600"></i>خروج: ${this.formatTime(record.checkOut)}</div>` : ''}
                                        ${record.workDuration ? `<div><i class="fas fa-clock ml-1 text-blue-600"></i>المدة: ${record.workDuration} ساعة</div>` : ''}
                                    </div>
                                    ${record.notes ? `<p class="text-xs text-gray-500 mt-2">${Utils.escapeHTML(record.notes)}</p>` : ''}
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="SafetyHealthManagement.editAttendance('${record.id}')" class="btn-icon btn-icon-primary">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="SafetyHealthManagement.deleteAttendance('${record.id}')" class="btn-icon btn-icon-danger">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                container.innerHTML = '<div class="empty-state"><p class="text-gray-500">لا توجد سجلات حضور</p></div>';
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في تحميل سجل الحضور:', errorMessage, error);
            container.innerHTML = `<div class="empty-state"><p class="text-red-500">حدث خطأ: ${Utils.escapeHTML(errorMessage)}</p></div>`;
        } finally {
            Loading.hide();
        }
    },

    async loadMemberLeaves() {
        const memberSelect = document.getElementById('attendance-member-select');
        const container = document.getElementById('leaves-list');
        
        if (!memberSelect || !container) return;

        const memberId = memberSelect.value;
        if (!memberId) {
            container.innerHTML = '<div class="empty-state"><p class="text-gray-500">اختر عضو الفريق لعرض سجل الإجازات</p></div>';
            return;
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamLeaves',
                data: { memberId: memberId }
            });

            if (response.success && response.data) {
                const leaves = Array.isArray(response.data) ? response.data : [];
                
                if (leaves.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p class="text-gray-500">لا توجد سجلات إجازات</p></div>';
                    Loading.hide();
                    return;
                }

                // Sort by start date descending
                leaves.sort((a, b) => {
                    const dateA = new Date(a.startDate || 0);
                    const dateB = new Date(b.startDate || 0);
                    return dateB - dateA;
                });

                container.innerHTML = leaves.map(leave => {
                    const approvalColors = {
                        'معتمد': 'bg-green-100 text-green-800',
                        'قيد المراجعة': 'bg-yellow-100 text-yellow-800',
                        'مرفوض': 'bg-red-100 text-red-800'
                    };
                    const approvalColor = approvalColors[leave.approvalStatus] || 'bg-gray-100 text-gray-800';
                    
                    return `
                        <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center gap-3 mb-2">
                                        <span class="font-semibold text-gray-800">${Utils.escapeHTML(leave.leaveType || '—')}</span>
                                        <span class="px-2 py-1 text-xs rounded ${approvalColor}">${Utils.escapeHTML(leave.approvalStatus || '—')}</span>
                                    </div>
                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                                        <div><i class="fas fa-calendar-alt ml-1"></i>من: ${Utils.formatDate(leave.startDate)}</div>
                                        <div><i class="fas fa-calendar-check ml-1"></i>إلى: ${Utils.formatDate(leave.endDate)}</div>
                                        <div><i class="fas fa-calendar-day ml-1"></i>عدد الأيام: ${leave.daysCount || 0}</div>
                                    </div>
                                    ${leave.reason ? `<p class="text-sm text-gray-600 mb-1"><strong>السبب:</strong> ${Utils.escapeHTML(leave.reason)}</p>` : ''}
                                    ${leave.notes ? `<p class="text-xs text-gray-500 mt-1">${Utils.escapeHTML(leave.notes)}</p>` : ''}
                                    ${leave.approvedBy ? `<p class="text-xs text-gray-500 mt-1">معتمد من: ${Utils.escapeHTML(leave.approvedBy)}</p>` : ''}
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="SafetyHealthManagement.editLeave('${leave.id}')" class="btn-icon btn-icon-primary">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="SafetyHealthManagement.deleteLeave('${leave.id}')" class="btn-icon btn-icon-danger">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                container.innerHTML = '<div class="empty-state"><p class="text-gray-500">لا توجد سجلات إجازات</p></div>';
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في تحميل سجل الإجازات:', errorMessage, error);
            container.innerHTML = `<div class="empty-state"><p class="text-red-500">حدث خطأ: ${Utils.escapeHTML(errorMessage)}</p></div>`;
        } finally {
            Loading.hide();
        }
    },

    showAttendanceForm(data = null) {
        const memberSelect = document.getElementById('attendance-member-select');
        const memberId = memberSelect ? memberSelect.value : (data ? data.memberId : '');
        
        if (!memberId && !data) {
            Notification.error('يرجى اختيار عضو الفريق أولاً');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 class="modal-title">${data ? 'تعديل سجل الحضور' : 'تسجيل حضور جديد'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="attendance-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">التاريخ *</label>
                            <input type="date" id="attendance-date" required class="form-input" 
                                value="${data && data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">وقت الدخول</label>
                                <input type="time" id="attendance-check-in" class="form-input" 
                                    value="${data && data.checkIn ? new Date(data.checkIn).toTimeString().slice(0, 5) : ''}">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">وقت الخروج</label>
                                <input type="time" id="attendance-check-out" class="form-input" 
                                    value="${data && data.checkOut ? new Date(data.checkOut).toTimeString().slice(0, 5) : ''}">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">الحالة *</label>
                            <select id="attendance-status" required class="form-input">
                                <option value="حاضر" ${data && data.status === 'حاضر' ? 'selected' : ''}>حاضر</option>
                                <option value="متأخر" ${data && data.status === 'متأخر' ? 'selected' : ''}>متأخر</option>
                                <option value="غائب" ${data && data.status === 'غائب' ? 'selected' : ''}>غائب</option>
                                <option value="عمل ميداني" ${data && data.status === 'عمل ميداني' ? 'selected' : ''}>عمل ميداني</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">ملاحظات</label>
                            <textarea id="attendance-notes" class="form-input" rows="3">${data ? Utils.escapeHTML(data.notes || '') : ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button type="button" id="save-attendance-btn" class="btn-primary">حفظ</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const saveBtn = modal.querySelector('#save-attendance-btn');
        saveBtn.addEventListener('click', async () => {
            const form = modal.querySelector('#attendance-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const attendanceData = {
                memberId: data ? data.memberId : memberId,
                date: document.getElementById('attendance-date').value,
                checkIn: document.getElementById('attendance-check-in').value ? 
                    new Date(document.getElementById('attendance-date').value + 'T' + document.getElementById('attendance-check-in').value).toISOString() : null,
                checkOut: document.getElementById('attendance-check-out').value ? 
                    new Date(document.getElementById('attendance-date').value + 'T' + document.getElementById('attendance-check-out').value).toISOString() : null,
                status: document.getElementById('attendance-status').value,
                notes: document.getElementById('attendance-notes').value.trim()
            };

            try {
                Loading.show();
                const response = data
                    ? await GoogleIntegration.sendRequest({
                        action: 'updateSafetyTeamAttendance',
                        data: { attendanceId: data.id, updateData: attendanceData }
                    })
                    : await GoogleIntegration.sendRequest({
                        action: 'addSafetyTeamAttendance',
                        data: attendanceData
                    });

                if (response.success) {
                    Notification.success(data ? 'تم تحديث سجل الحضور بنجاح' : 'تم تسجيل الحضور بنجاح');
                    modal.remove();
                    this.loadMemberAttendance();
                } else {
                    Notification.error('حدث خطأ: ' + (response.message || 'فشل الحفظ'));
                }
            } catch (error) {
                Notification.error('حدث خطأ: ' + error.message);
            } finally {
                Loading.hide();
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    showLeaveForm(data = null) {
        const memberSelect = document.getElementById('attendance-member-select');
        const memberId = memberSelect ? memberSelect.value : (data ? data.memberId : '');
        
        if (!memberId && !data) {
            Notification.error('يرجى اختيار عضو الفريق أولاً');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 class="modal-title">${data ? 'تعديل إجازة' : 'تسجيل إجازة جديدة'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="leave-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">نوع الإجازة *</label>
                            <select id="leave-type" required class="form-input">
                                <option value="سنوية" ${data && data.leaveType === 'سنوية' ? 'selected' : ''}>سنوية</option>
                                <option value="مرضية" ${data && data.leaveType === 'مرضية' ? 'selected' : ''}>مرضية</option>
                                <option value="طارئة" ${data && data.leaveType === 'طارئة' ? 'selected' : ''}>طارئة</option>
                                <option value="أخرى" ${data && data.leaveType === 'أخرى' ? 'selected' : ''}>أخرى</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">تاريخ البداية *</label>
                                <input type="date" id="leave-start-date" required class="form-input" 
                                    value="${data && data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : ''}">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">تاريخ النهاية *</label>
                                <input type="date" id="leave-end-date" required class="form-input" 
                                    value="${data && data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : ''}">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">السبب</label>
                            <textarea id="leave-reason" class="form-input" rows="3">${data ? Utils.escapeHTML(data.reason || '') : ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">حالة الاعتماد</label>
                            <select id="leave-approval-status" class="form-input">
                                <option value="قيد المراجعة" ${!data || data.approvalStatus === 'قيد المراجعة' ? 'selected' : ''}>قيد المراجعة</option>
                                <option value="معتمد" ${data && data.approvalStatus === 'معتمد' ? 'selected' : ''}>معتمد</option>
                                <option value="مرفوض" ${data && data.approvalStatus === 'مرفوض' ? 'selected' : ''}>مرفوض</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">ملاحظات</label>
                            <textarea id="leave-notes" class="form-input" rows="2">${data ? Utils.escapeHTML(data.notes || '') : ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button type="button" id="save-leave-btn" class="btn-primary">حفظ</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Calculate days count when dates change
        const startDateInput = modal.querySelector('#leave-start-date');
        const endDateInput = modal.querySelector('#leave-end-date');
        const calculateDays = () => {
            if (startDateInput.value && endDateInput.value) {
                const start = new Date(startDateInput.value);
                const end = new Date(endDateInput.value);
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                // You can show this in a label if needed
            }
        };
        startDateInput.addEventListener('change', calculateDays);
        endDateInput.addEventListener('change', calculateDays);

        const saveBtn = modal.querySelector('#save-leave-btn');
        saveBtn.addEventListener('click', async () => {
            const form = modal.querySelector('#leave-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const startDate = new Date(document.getElementById('leave-start-date').value);
            const endDate = new Date(document.getElementById('leave-end-date').value);
            const diffTime = Math.abs(endDate - startDate);
            const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const leaveData = {
                memberId: data ? data.memberId : memberId,
                leaveType: document.getElementById('leave-type').value,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                daysCount: daysCount,
                reason: document.getElementById('leave-reason').value.trim(),
                approvalStatus: document.getElementById('leave-approval-status').value,
                notes: document.getElementById('leave-notes').value.trim()
            };

            try {
                Loading.show();
                const response = data
                    ? await GoogleIntegration.sendRequest({
                        action: 'updateSafetyTeamLeave',
                        data: { leaveId: data.id, updateData: leaveData }
                    })
                    : await GoogleIntegration.sendRequest({
                        action: 'addSafetyTeamLeave',
                        data: leaveData
                    });

                if (response.success) {
                    Notification.success(data ? 'تم تحديث الإجازة بنجاح' : 'تم تسجيل الإجازة بنجاح');
                    modal.remove();
                    this.loadMemberLeaves();
                } else {
                    Notification.error('حدث خطأ: ' + (response.message || 'فشل الحفظ'));
                }
            } catch (error) {
                Notification.error('حدث خطأ: ' + error.message);
            } finally {
                Loading.hide();
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async editAttendance(attendanceId) {
        try {
            Loading.show();
            const memberSelect = document.getElementById('attendance-member-select');
            const memberId = memberSelect ? memberSelect.value : '';
            
            if (!memberId) {
                Notification.error('يرجى اختيار عضو الفريق');
                Loading.hide();
                return;
            }

            const response = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamAttendance',
                data: { memberId: memberId }
            });

            if (response.success && response.data) {
                const attendance = Array.isArray(response.data) ? response.data : [];
                const record = attendance.find(a => a.id === attendanceId);
                if (record) {
                    this.showAttendanceForm(record);
                } else {
                    Notification.error('لم يتم العثور على سجل الحضور');
                }
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    async deleteAttendance(attendanceId) {
        if (!confirm('هل أنت متأكد من حذف سجل الحضور هذا؟')) {
            return;
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'deleteSafetyTeamAttendance',
                data: { attendanceId: attendanceId }
            });

            if (response.success) {
                Notification.success('تم حذف سجل الحضور بنجاح');
                this.loadMemberAttendance();
            } else {
                Notification.error('حدث خطأ: ' + (response.message || 'فشل الحذف'));
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    async editLeave(leaveId) {
        try {
            Loading.show();
            const memberSelect = document.getElementById('attendance-member-select');
            const memberId = memberSelect ? memberSelect.value : '';
            
            if (!memberId) {
                Notification.error('يرجى اختيار عضو الفريق');
                Loading.hide();
                return;
            }

            const response = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamLeaves',
                data: { memberId: memberId }
            });

            if (response.success && response.data) {
                const leaves = Array.isArray(response.data) ? response.data : [];
                const leave = leaves.find(l => l.id === leaveId);
                if (leave) {
                    this.showLeaveForm(leave);
                } else {
                    Notification.error('لم يتم العثور على الإجازة');
                }
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    renderAnalysisView() {
        return `
            <div class="card">
                <div class="card-header">
                    <div class="flex items-center justify-between">
                        <h2 class="card-title"><i class="fas fa-chart-bar ml-2"></i>تحليل البيانات الشامل</h2>
                        <div class="flex gap-2">
                            <select id="analysis-member-select" class="form-input" style="min-width: 200px;">
                                <option value="">اختر عضو الفريق</option>
                            </select>
                            <button id="analyze-data-btn" class="btn-primary" style="padding: 14px 28px; font-size: 15px; font-weight: 600; border-radius: 10px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; border: none; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); transition: all 0.3s ease; position: relative; overflow: hidden;">
                                <i class="fas fa-search ml-2"></i>
                                <span>تحليل البيانات</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div id="analysis-container">
                        <div class="empty-state">
                            <i class="fas fa-chart-line text-6xl text-gray-300 mb-4"></i>
                            <p class="text-gray-500 text-lg">اختر عضو الفريق لعرض تحليل شامل لجميع بياناته من جميع المديولات</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadAnalysis() {
        const container = document.getElementById('analysis-container');
        const memberSelect = document.getElementById('analysis-member-select');
        const analyzeBtn = document.getElementById('analyze-data-btn');

        if (!container || !memberSelect) {
            Utils.safeError('عناصر التحليل غير موجودة في الصفحة');
            return;
        }

        // التحقق من إمكانية الوصول للبيانات
        const accessMessage = this.getDataAccessMessage('getAllIncidents', {});
        if (accessMessage) {
            memberSelect.innerHTML = `<option value="">${accessMessage}</option>`;
            container.innerHTML = `<div class="empty-state"><p class="text-gray-500">${accessMessage}</p></div>`;
            return;
        }

        try {
            // تحميل أعضاء الفريق
            const membersResponse = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamMembers',
                data: {}
            });

            if (membersResponse.success && membersResponse.data) {
                const members = Array.isArray(membersResponse.data) ? membersResponse.data : [];
                memberSelect.innerHTML = '<option value="">اختر عضو الفريق</option>' +
                    members.map(m => `
                        <option value="${m.id}">
                            ${Utils.escapeHTML(m.name || '')}
                        </option>
                    `).join('');

                // إعداد مستمع الأحداث
                if (analyzeBtn) {
                    analyzeBtn.addEventListener('click', () => {
                        const memberId = memberSelect.value;
                        if (!memberId) {
                            Notification.error('يرجى اختيار عضو الفريق');
                            return;
                        }
                        this.performComprehensiveAnalysis(memberId);
                    });
                }
            }
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في تحميل التحليل:', errorMessage, error);
            container.innerHTML = `<div class="empty-state"><p class="text-red-500">${Utils.escapeHTML(errorMessage)}</p></div>`;
        }
    },

    async performComprehensiveAnalysis(memberId) {
        const container = document.getElementById('analysis-container');
        
        if (!container) {
            Notification.error('عنصر التحليل غير موجود');
            return;
        }

        try {
            Loading.show();
            container.innerHTML = '<div class="empty-state"><p class="text-gray-500">جاري تحليل البيانات...</p></div>';

            // جلب بيانات العضو
            const memberResponse = await GoogleIntegration.sendRequest({
                action: 'getSafetyTeamMember',
                data: { memberId: memberId }
            });

            if (!memberResponse.success || !memberResponse.data) {
                Notification.error('لم يتم العثور على عضو الفريق');
                return;
            }

            const member = memberResponse.data;

            // جلب جميع البيانات المتعلقة بالعضو من جميع المديولات
            const [incidentsResponse, nearMissResponse, ptwResponse, trainingResponse, 
                   inspectionsResponse, attendanceResponse, leavesResponse, kpisResponse] = await Promise.allSettled([
                GoogleIntegration.sendRequest({ action: 'getAllIncidents', data: { filters: {} } }),
                GoogleIntegration.sendRequest({ action: 'getAllNearMisses', data: { filters: {} } }),
                GoogleIntegration.sendRequest({ action: 'getAllPTWs', data: { filters: {} } }),
                GoogleIntegration.sendRequest({ action: 'getAllTrainings', data: { filters: {} } }),
                GoogleIntegration.sendRequest({ action: 'getAllPeriodicInspectionRecords', data: { filters: {} } }),
                GoogleIntegration.sendRequest({ action: 'getSafetyTeamAttendance', data: { memberId: memberId } }),
                GoogleIntegration.sendRequest({ action: 'getSafetyTeamLeaves', data: { memberId: memberId } }),
                GoogleIntegration.sendRequest({ action: 'getSafetyTeamKPIs', data: { memberId: memberId } })
            ]);

            // محاولة جلب المخالفات من AppState أو استخدام array فارغ
            let violationsData = [];
            try {
                if (AppState.appData && AppState.appData.violations) {
                    violationsData = AppState.appData.violations;
                }
            } catch (e) {
                Utils.safeError('خطأ في جلب المخالفات:', e);
            }

            // معالجة البيانات
            const incidents = incidentsResponse.status === 'fulfilled' && incidentsResponse.value.success 
                ? (incidentsResponse.value.data || []).filter(i => 
                    i.reportedBy === memberId || i.investigatedBy === memberId || i.responsible === memberId || 
                    i.assignedTo === memberId || (i.assignees && Array.isArray(i.assignees) && i.assignees.includes(memberId))
                ) : [];
            
            const nearMisses = nearMissResponse.status === 'fulfilled' && nearMissResponse.value.success
                ? (nearMissResponse.value.data || []).filter(nm => 
                    nm.reportedBy === memberId || nm.investigatedBy === memberId || nm.responsible === memberId ||
                    nm.assignedTo === memberId
                ) : [];
            
            const ptws = ptwResponse.status === 'fulfilled' && ptwResponse.value.success
                ? (ptwResponse.value.data || []).filter(p => 
                    p.requestedBy === memberId || p.approvedBy === memberId || p.supervisedBy === memberId ||
                    p.assignedTo === memberId || (p.permitHolders && Array.isArray(p.permitHolders) && p.permitHolders.includes(memberId))
                ) : [];
            
            const violations = Array.isArray(violationsData) ? violationsData.filter(v => 
                v.reportedBy === memberId || v.investigatedBy === memberId || v.assignedTo === memberId ||
                (v.reporterId && v.reporterId === memberId) || (v.inspectorId && v.inspectorId === memberId)
            ) : [];
            
            const trainings = trainingResponse.status === 'fulfilled' && trainingResponse.value.success
                ? (trainingResponse.value.data || []).filter(t => {
                    if (t.participants && Array.isArray(t.participants)) {
                        return t.participants.some(p => p.id === memberId || p === memberId);
                    }
                    if (t.instructor && (t.instructor.id === memberId || t.instructor === memberId)) {
                        return true;
                    }
                    return t.conductedBy === memberId || t.organizedBy === memberId;
                }) : [];
            
            const inspections = inspectionsResponse.status === 'fulfilled' && inspectionsResponse.value.success
                ? (inspectionsResponse.value.data || []).filter(ins => 
                    ins.inspector === memberId || ins.responsible === memberId || ins.assignedTo === memberId
                ) : [];
            
            const attendance = attendanceResponse.status === 'fulfilled' && attendanceResponse.value.success
                ? (attendanceResponse.value.data || []) : [];
            
            const leaves = leavesResponse.status === 'fulfilled' && leavesResponse.value.success
                ? (leavesResponse.value.data || []) : [];
            
            const kpis = kpisResponse.status === 'fulfilled' && kpisResponse.value.success
                ? (kpisResponse.value.data || []) : [];

            // حساب الإحصائيات
            const stats = {
                totalIncidents: incidents.length,
                totalNearMisses: nearMisses.length,
                totalPTWs: ptws.length,
                totalViolations: violations.length,
                totalTrainings: trainings.length,
                totalInspections: inspections.length,
                totalAttendanceDays: attendance.length,
                presentDays: attendance.filter(a => a.status === 'حاضر' || a.status === 'present').length,
                absentDays: attendance.filter(a => a.status === 'غائب' || a.status === 'absent').length,
                totalLeaves: leaves.length,
                activeLeaves: leaves.filter(l => l.status === 'موافق' || l.status === 'approved').length,
                latestKPI: kpis.length > 0 ? kpis[0] : null
            };

            // حساب معدل الحضور
            const attendanceRate = stats.totalAttendanceDays > 0 
                ? ((stats.presentDays / stats.totalAttendanceDays) * 100).toFixed(1) 
                : 0;

            // عرض النتائج
            container.innerHTML = `
                <div class="space-y-6">
                    <!-- معلومات العضو -->
                    <div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h3 class="text-2xl font-bold text-gray-800 mb-1">${Utils.escapeHTML(member.name || '')}</h3>
                                <p class="text-gray-600">${Utils.escapeHTML(member.position || '')} - ${Utils.escapeHTML(member.department || '')}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-sm text-gray-500">تاريخ التحليل</p>
                                <p class="text-lg font-semibold text-gray-700">${new Date().toLocaleDateString('ar-SA')}</p>
                            </div>
                        </div>
                    </div>

                    <!-- إحصائيات سريعة -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-semibold text-gray-700">الحوادث</h4>
                                <i class="fas fa-exclamation-triangle text-red-500 text-xl"></i>
                            </div>
                            <p class="text-3xl font-bold text-red-600">${stats.totalIncidents}</p>
                            <p class="text-sm text-gray-500 mt-1">إجمالي الحوادث المعالجة</p>
                        </div>

                        <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-semibold text-gray-700">Near Miss</h4>
                                <i class="fas fa-exclamation-circle text-orange-500 text-xl"></i>
                            </div>
                            <p class="text-3xl font-bold text-orange-600">${stats.totalNearMisses}</p>
                            <p class="text-sm text-gray-500 mt-1">إجمالي الحوادث المحتملة</p>
                        </div>

                        <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-semibold text-gray-700">التفتيشات</h4>
                                <i class="fas fa-search text-blue-500 text-xl"></i>
                            </div>
                            <p class="text-3xl font-bold text-blue-600">${stats.totalInspections}</p>
                            <p class="text-sm text-gray-500 mt-1">إجمالي الجولات التفتيشية</p>
                        </div>

                        <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-semibold text-gray-700">التدريبات</h4>
                                <i class="fas fa-chalkboard-teacher text-green-500 text-xl"></i>
                            </div>
                            <p class="text-3xl font-bold text-green-600">${stats.totalTrainings}</p>
                            <p class="text-sm text-gray-500 mt-1">إجمالي التدريبات</p>
                        </div>
                    </div>

                    <!-- تفاصيل إضافية -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <h4 class="font-semibold text-gray-700 mb-4 flex items-center">
                                <i class="fas fa-calendar-check text-purple-500 ml-2"></i>
                                الحضور والإجازات
                            </h4>
                            <div class="space-y-3">
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600">أيام الحضور:</span>
                                    <span class="font-bold text-green-600">${stats.presentDays}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600">أيام الغياب:</span>
                                    <span class="font-bold text-red-600">${stats.absentDays}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600">معدل الحضور:</span>
                                    <span class="font-bold text-blue-600">${attendanceRate}%</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600">الإجازات:</span>
                                    <span class="font-bold text-purple-600">${stats.totalLeaves} (${stats.activeLeaves} نشطة)</span>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <h4 class="font-semibold text-gray-700 mb-4 flex items-center">
                                <i class="fas fa-tasks text-indigo-500 ml-2"></i>
                                الأنشطة الأخرى
                            </h4>
                            <div class="space-y-3">
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600">PTW:</span>
                                    <span class="font-bold text-indigo-600">${stats.totalPTWs}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600">المخالفات:</span>
                                    <span class="font-bold text-yellow-600">${stats.totalViolations}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    ${stats.latestKPI ? `
                    <!-- مؤشرات الأداء الأخيرة -->
                    <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <h4 class="font-semibold text-gray-700 mb-4 flex items-center">
                            <i class="fas fa-chart-line text-blue-500 ml-2"></i>
                            مؤشرات الأداء (آخر فترة)
                        </h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p class="text-sm text-gray-500">الجولات التفتيشية</p>
                                <p class="text-2xl font-bold text-blue-600">${stats.latestKPI.inspectionsCount || 0}</p>
                                <p class="text-xs text-gray-400">الهدف: ${stats.latestKPI.targetInspections || 20}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">الإجراءات المغلقة</p>
                                <p class="text-2xl font-bold text-green-600">${stats.latestKPI.closedActionsCount || 0}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">الملاحظات</p>
                                <p class="text-2xl font-bold text-purple-600">${stats.latestKPI.observationsCount || 0}</p>
                                <p class="text-xs text-gray-400">الهدف: ${stats.latestKPI.targetObservations || 15}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">التدريبات</p>
                                <p class="text-2xl font-bold text-orange-600">${stats.latestKPI.trainingsCount || 0}</p>
                                <p class="text-xs text-gray-400">الهدف: ${stats.latestKPI.targetTrainings || 2}</p>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    <!-- تفاصيل البيانات -->
                    <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <h4 class="font-semibold text-gray-700 mb-4 flex items-center">
                            <i class="fas fa-list text-gray-500 ml-2"></i>
                            تفاصيل البيانات
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h5 class="font-medium text-gray-600 mb-2">الحوادث (${stats.totalIncidents})</h5>
                                <div class="space-y-1 max-h-40 overflow-y-auto">
                                    ${incidents.slice(0, 5).map(inc => `
                                        <div class="text-sm text-gray-500 p-2 bg-gray-50 rounded">
                                            ${Utils.escapeHTML(inc.title || inc.description || '')} - ${inc.date ? new Date(inc.date).toLocaleDateString('ar-SA') : ''}
                                        </div>
                                    `).join('')}
                                    ${incidents.length > 5 ? `<p class="text-xs text-gray-400 mt-2">و ${incidents.length - 5} أكثر...</p>` : ''}
                                </div>
                            </div>
                            <div>
                                <h5 class="font-medium text-gray-600 mb-2">التفتيشات (${stats.totalInspections})</h5>
                                <div class="space-y-1 max-h-40 overflow-y-auto">
                                    ${inspections.slice(0, 5).map(ins => `
                                        <div class="text-sm text-gray-500 p-2 bg-gray-50 rounded">
                                            ${Utils.escapeHTML(ins.categoryName || ins.inspectionType || '')} - ${ins.inspectionDate ? new Date(ins.inspectionDate).toLocaleDateString('ar-SA') : ''}
                                        </div>
                                    `).join('')}
                                    ${inspections.length > 5 ? `<p class="text-xs text-gray-400 mt-2">و ${inspections.length - 5} أكثر...</p>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف';
            Utils.safeError('خطأ في تحليل البيانات:', errorMessage, error);
            container.innerHTML = `<div class="empty-state"><p class="text-red-500">حدث خطأ أثناء تحليل البيانات: ${Utils.escapeHTML(errorMessage)}</p></div>`;
            Notification.error('حدث خطأ أثناء تحليل البيانات');
        } finally {
            Loading.hide();
        }
    },

    async deleteLeave(leaveId) {
        if (!confirm('هل أنت متأكد من حذف هذه الإجازة؟')) {
            return;
        }

        try {
            Loading.show();
            const response = await GoogleIntegration.sendRequest({
                action: 'deleteSafetyTeamLeave',
                data: { leaveId: leaveId }
            });

            if (response.success) {
                Notification.success('تم حذف الإجازة بنجاح');
                this.loadMemberLeaves();
            } else {
                Notification.error('حدث خطأ: ' + (response.message || 'فشل الحذف'));
            }
        } catch (error) {
            Notification.error('حدث خطأ: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    // Helper function to format time
    formatTime(dateString) {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '—';
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        } catch (e) {
            return '—';
        }
    }
};

// ===== Export module to global scope =====
// تصدير الموديول إلى window فوراً لضمان توافره
(function () {
    'use strict';
    try {
        if (typeof window !== 'undefined' && typeof SafetyHealthManagement !== 'undefined') {
            window.SafetyHealthManagement = SafetyHealthManagement;
            
            // إشعار عند تحميل الموديول بنجاح
            if (typeof AppState !== 'undefined' && AppState.debugMode && typeof Utils !== 'undefined' && Utils.safeLog) {
                Utils.safeLog('✅ SafetyHealthManagement module loaded and available on window.SafetyHealthManagement');
            }
        }
    } catch (error) {
        console.error('❌ خطأ في تصدير SafetyHealthManagement:', error);
        // محاولة التصدير مرة أخرى حتى في حالة الخطأ
        if (typeof window !== 'undefined' && typeof SafetyHealthManagement !== 'undefined') {
            try {
                window.SafetyHealthManagement = SafetyHealthManagement;
            } catch (e) {
                console.error('❌ فشل تصدير SafetyHealthManagement:', e);
            }
        }
    }
})();
