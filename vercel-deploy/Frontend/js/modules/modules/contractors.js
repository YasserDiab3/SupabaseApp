/**
 * Contractors Module
 * تم استخراجه من app-modules.js
 */

// ===== Constants =====
const APPROVED_ENTITY_STATUS_OPTIONS = {
    approved: 'معتمد',
    under_review: 'تحت المراجعة',
    rejected: 'مرفوض',
    pending: 'تم الإرسال'
};

const APPROVED_ENTITY_TYPE_OPTIONS = {
    contractor: 'مقاول',
    supplier: 'مورد'
};

// ===== Default Evaluation Criteria =====
const CONTRACTOR_EVALUATION_DEFAULT_ITEMS = [
    'يلتزم المقاول بالقوانين والتشريعات والمتطلبات الأخرى',
    'يلتزم جميع العاملين بالمشروع بجميع التعليمات والمتطلبات الخاصة بالموقع',
    'توفر العمالة المدربة والمؤهلة',
    'توفر مشرف مؤهل طوال فترة تنفيذ المشروع (للأعمال التي تتجاوز أسبوع عمل)',
    'توفر مهمات الوقاية الشخصية الخاصة بالعاملين بحالة جيدة',
    'توفر المعدات المناسبة لأداء العمل وتحقق اشتراطات السلامة',
    'توفر أجهزة الإطفاء المناسبة (نوعًا وحجمًا) طبقًا للتعاقد',
    'يلتزم المقاول باستخراج تصاريح العمل اللازمة واعتمادها من إدارة السلامة',
    'الالتزام بقواعد التخزين الآمن وتخزين المواد والمعدات في الأماكن المخصصة',
    'الحفاظ على النظافة والتخلص الآمن من المخلفات',
    'الإبلاغ الفوري عن أي حادث واتخاذ الإجراءات لمنع تكراره',
    'الالتزام بتنفيذ المشروع طبقًا للمخطط الزمني المعتمد',
    'سرعة التواصل بين المقاول أو من يمثله وإدارة المشروع',
    'سرعة الاستجابة لملاحظات مسؤولي السلامة بالموقع',
    'الرأي العام للمشرف علي المقاول / الإدارة المعنية / مدير المشروع'
];

// ===== Requirement Categories =====
const REQUIREMENT_CATEGORIES = {
    legal: { id: 'legal', label: 'التراخيص القانونية', icon: 'fa-file-contract', color: '#3b82f6' },
    safety: { id: 'safety', label: 'السلامة والصحة المهنية', icon: 'fa-hard-hat', color: '#ef4444' },
    training: { id: 'training', label: 'التدريب والكفاءات', icon: 'fa-graduation-cap', color: '#10b981' },
    equipment: { id: 'equipment', label: 'المعدات والموارد', icon: 'fa-tools', color: '#f59e0b' },
    financial: { id: 'financial', label: 'الجوانب المالية', icon: 'fa-dollar-sign', color: '#8b5cf6' },
    quality: { id: 'quality', label: 'الجودة والامتثال', icon: 'fa-award', color: '#06b6d4' },
    other: { id: 'other', label: 'أخرى', icon: 'fa-folder', color: '#6b7280' }
};

// ===== Requirement Priority Levels =====
const REQUIREMENT_PRIORITIES = {
    critical: { id: 'critical', label: 'حرج', color: '#ef4444', order: 1 },
    high: { id: 'high', label: 'عالي', color: '#f59e0b', order: 2 },
    medium: { id: 'medium', label: 'متوسط', color: '#3b82f6', order: 3 },
    low: { id: 'low', label: 'منخفض', color: '#6b7280', order: 4 }
};

// ===== Default Approval Requirements (Enhanced) =====
const CONTRACTOR_APPROVAL_REQUIREMENTS_DEFAULT = [
    {
        id: 'req_1',
        label: 'تقديم ملف السلامة الخاص بالشركة (HSE Profile)',
        type: 'document',
        required: true,
        order: 1,
        category: 'safety',
        priority: 'critical',
        hasExpiry: true,
        expiryMonths: 12,
        description: 'ملف السلامة والصحة المهنية الشامل للشركة',
        applicableTypes: ['contractor', 'supplier'] // أنواع المقاولين المنطبق عليها
    },
    {
        id: 'req_2',
        label: 'تقديم شهادات تدريب العاملين على أعمال الموقع',
        type: 'document',
        required: true,
        order: 2,
        category: 'training',
        priority: 'high',
        hasExpiry: true,
        expiryMonths: 24,
        description: 'شهادات تدريب العاملين على السلامة وأعمال الموقع',
        applicableTypes: ['contractor']
    },
    {
        id: 'req_3',
        label: 'تقديم سجل الحوادث وآخر 12 شهر (Incident Log)',
        type: 'document',
        required: true,
        order: 3,
        category: 'safety',
        priority: 'critical',
        hasExpiry: false,
        description: 'سجل الحوادث والإصابات للفترة الماضية',
        applicableTypes: ['contractor', 'supplier']
    },
    {
        id: 'req_4',
        label: 'وجود خطة الطوارئ الخاصة بالمقاول',
        type: 'document',
        required: true,
        order: 4,
        category: 'safety',
        priority: 'critical',
        hasExpiry: true,
        expiryMonths: 12,
        description: 'خطة الطوارئ والإخلاء للمشروع',
        applicableTypes: ['contractor']
    },
    {
        id: 'req_5',
        label: 'تقديم تراخيص العمل أو السجل التجاري',
        type: 'document',
        required: true,
        order: 5,
        category: 'legal',
        priority: 'critical',
        hasExpiry: true,
        expiryMonths: 12,
        description: 'التراخيص القانونية والسجل التجاري',
        applicableTypes: ['contractor', 'supplier']
    },
    {
        id: 'req_6',
        label: 'تقديم تقييم المخاطر لنوع العمل المطلوب (Risk Assessment)',
        type: 'document',
        required: true,
        order: 6,
        category: 'safety',
        priority: 'high',
        hasExpiry: true,
        expiryMonths: 6,
        description: 'تقييم المخاطر المحددة لنوع العمل',
        applicableTypes: ['contractor']
    },
    {
        id: 'req_7',
        label: 'توفير مسؤول سلامة معتمد للمشروع',
        type: 'text',
        required: true,
        order: 7,
        category: 'safety',
        priority: 'high',
        hasExpiry: false,
        description: 'اسم وبيانات مسؤول السلامة المعتمد',
        applicableTypes: ['contractor']
    },
    {
        id: 'req_8',
        label: 'التأكد من التزام الجهة باستخدام معدات الوقاية',
        type: 'checkbox',
        required: true,
        order: 8,
        category: 'safety',
        priority: 'high',
        hasExpiry: false,
        description: 'التأكد من توفر واستخدام معدات الوقاية الشخصية',
        applicableTypes: ['contractor']
    },
    {
        id: 'req_9',
        label: 'توفير شهادات معايرة للمعدات المستخدمة إذا كانت مطلوبة',
        type: 'document',
        required: false,
        order: 9,
        category: 'equipment',
        priority: 'medium',
        hasExpiry: true,
        expiryMonths: 12,
        description: 'شهادات معايرة وصيانة المعدات',
        applicableTypes: ['contractor']
    }
];

// ===== Contractors Module (إدارة المقاولين) =====
const Contractors = {
    currentTab: 'approval-request',
    _abortController: null, // ✅ للتحكم في إلغاء جميع event listeners
    _eventListeners: [], // ✅ تتبع جميع event listeners المُضافة
    
    /**
     * ✅ دالة تنظيف شاملة لإزالة جميع event listeners
     * تُستدعى قبل تغيير التبويبات أو إعادة رسم المحتوى
     */
    cleanup() {
        try {
            // ✅ إلغاء جميع event listeners باستخدام AbortController
            if (this._abortController) {
                this._abortController.abort();
                this._abortController = null;
            }
            
            // ✅ إنشاء AbortController جديد
            this._abortController = new AbortController();
            
            // ✅ إزالة data-listener-attached من جميع الأزرار لإتاحة إعادة ربط الـ listeners
            const elementsWithListeners = document.querySelectorAll('[data-listener-attached]');
            elementsWithListeners.forEach(el => {
                el.removeAttribute('data-listener-attached');
            });
            
            // ✅ إزالة broadcast listener إذا كان موجوداً
            if (this._broadcastListener && typeof RealtimeSyncManager !== 'undefined' && 
                RealtimeSyncManager.state?.broadcastChannel) {
                try {
                    RealtimeSyncManager.state.broadcastChannel.removeEventListener('message', this._broadcastListener);
                    this._broadcastListener = null;
                } catch (e) {
                    Utils.safeWarn('⚠️ خطأ في إزالة broadcast listener:', e);
                }
            }
            
            // ✅ إيقاف أي عمليات loading معلقة
            this._isLoading = false;
            
            // ✅ إيقاف أي عمليات bootstrapping معلقة
            this._isBootstrapping = false;
            this._bootstrapScheduled = false;
            
            // ✅ إيقاف أي عمليات refresh معلقة
            this._isRefreshingApprovalRequests = false;
            
            // ✅ إعادة تعيين flags الـ listeners
            this._eventListenersAttached = false;
            this._realtimeListenersSetup = false;
            this._syncListenerAttached = false;
            this._isSwitchingTab = false;
            
            // ✅ إلغاء أي timeouts معلقة
            if (this._refreshApprovalTimeout) {
                clearTimeout(this._refreshApprovalTimeout);
                this._refreshApprovalTimeout = null;
            }
            
            if (this._refreshApprovalRAF) {
                cancelAnimationFrame(this._refreshApprovalRAF);
                this._refreshApprovalRAF = null;
            }
            
            if (this._approvalRefreshRetryTimeout) {
                clearTimeout(this._approvalRefreshRetryTimeout);
                this._approvalRefreshRetryTimeout = null;
            }
            
            if (this._switchTabTimeout) {
                clearTimeout(this._switchTabTimeout);
                this._switchTabTimeout = null;
            }
            
            Utils.safeLog('✅ تم تنظيف جميع event listeners والعمليات المعلقة بنجاح');
        } catch (error) {
            Utils.safeError('❌ خطأ في cleanup:', error);
        }
    },
    
    /**
     * ✅ دالة مساعدة آمنة للوصول إلى عناصر DOM
     * تتحقق من وجود العنصر في DOM قبل الوصول إليه
     */
    safeGetElementById(id) {
        try {
            if (!id) return null;
            const element = document.getElementById(id);
            if (element && document.contains(element)) {
                return element;
            }
            return null;
        } catch (error) {
            Utils.safeWarn('⚠️ safeGetElementById error for id=' + id + ':', error);
            return null;
        }
    },
    
    /**
     * ✅ دالة مساعدة آمنة لتحديث innerHTML
     * تتحقق من وجود العنصر في DOM قبل التحديث
     */
    safeSetInnerHTML(element, html) {
        try {
            if (!element) {
                Utils.safeWarn('⚠️ safeSetInnerHTML: element is null or undefined');
                return false;
            }
            if (!document.contains(element)) {
                Utils.safeWarn('⚠️ safeSetInnerHTML: element is not in DOM. id=' + (element.id || 'unknown'));
                return false;
            }
            element.innerHTML = html;
            return true;
        } catch (error) {
            Utils.safeError('❌ safeSetInnerHTML error:', error);
            return false;
        }
    },
    
    /**
     * ✅ دالة مساعدة آمنة للبحث عن عناصر داخل container
     * تتحقق من وجود container في DOM قبل البحث
     */
    safeQuerySelector(container, selector) {
        try {
            if (!container || !selector) return null;
            if (!document.contains(container)) {
                Utils.safeWarn('⚠️ safeQuerySelector: container is not in DOM');
                return null;
            }
            return container.querySelector(selector);
        } catch (error) {
            Utils.safeWarn('⚠️ safeQuerySelector error:', error);
            return null;
        }
    },
    currentEvaluationFilter: '',
    approvedFilters: {
        search: '',
        status: '',
        type: '',
        startDate: '',
        endDate: ''
    },

    async load(preserveCurrentTab = false) {
        // ✅ CRITICAL: منع استدعاء load() أكثر من مرة في نفس الوقت
        if (this._isLoading) {
            Utils.safeLog('⚠️ load() قيد التنفيذ بالفعل - تم تجاهل الاستدعاء');
            return;
        }
        
        this._isLoading = true;
        
        try {
            const section = document.getElementById('contractors-section');
            if (!section) {
                if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                    Utils.safeWarn('⚠️ قسم contractors-section غير موجود');
                } else {
                    console.warn('⚠️ قسم contractors-section غير موجود');
                }
                this._isLoading = false;
                return;
            }

            // ✅ إصلاح نهائي: حفظ التبويب الحالي قبل إعادة التحميل
            const previousTab = this.currentTab || 'approval-request';
            const targetTab = preserveCurrentTab ? previousTab : 'approval-request';
            this.currentTab = targetTab;

            // ✅ إصلاح شامل: حقن CSS optimizations لتقليل layout shifts والاهتزاز
            this.injectAntiShakeStyles();

            // عرض رسالة تحميل
            // ✅ استخدام الدالة الآمنة لتحديث innerHTML
            const loadingHTML = `
                <div class="content-card">
                    <div class="card-body">
                        <div class="flex items-center justify-center py-12">
                            <div class="text-center">
                                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                <p class="text-gray-600">جاري تحميل بيانات المقاولين...</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            // ✅ فعلياً عرض شاشة التحميل لتفادي “وميض/اهتزاز” واجهة فارغة أثناء البناء
            this.safeSetInnerHTML(section, loadingHTML);

            // ✅ إصلاح: التأكد من تحميل بيانات طلبات الاعتماد قبل الرسم
            this.ensureApprovedSetup();
            this.ensureEvaluationSetup();
            this.ensureApprovalRequestsSetup();
            this.ensureDeletionRequestsSetup();

            // ✅ تحسين: الانتظار حتى تكون AppState و appData جاهزة (تسريع التحميل)
            if (!AppState || !AppState.appData) {
                // الانتظار حتى تكون البيانات جاهزة (بحد أقصى 1 ثانية بدلاً من 2 ثانية)
                // تحسين: تقليل التأخير من 50ms إلى 25ms لتسريع التحميل أكثر
                let attempts = 0;
                const maxAttempts = 40; // 1 ثانية (40 * 25ms)
                while ((!AppState || !AppState.appData) && attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 25));
                    attempts++;
                }
                
                // إذا لم تصبح البيانات جاهزة بعد، إنشاء AppState.appData
                if (!AppState) {
                    if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                        Utils.safeWarn('⚠️ AppState غير موجود - إنشاء جديد');
                    }
                    window.AppState = window.AppState || {};
                }
                if (!AppState.appData) {
                    AppState.appData = {};
                }
            }

            // تحميل المحتوى بشكل متوازي لتحسين الأداء
            const isAdmin = Permissions.isAdmin();

            // دالة مساعدة لمعالجة الأخطاء
            const handleError = (sectionName, error) => {
                if (typeof Utils !== 'undefined' && Utils.safeError) {
                    Utils.safeError(`خطأ في تحميل ${sectionName}:`, error);
                } else {
                    console.error(`خطأ في تحميل ${sectionName}:`, error);
                }
                return `
                    <div class="content-card">
                        <div class="card-body">
                            <div class="empty-state">
                                <i class="fas fa-exclamation-triangle text-4xl text-yellow-400 mb-3"></i>
                                <p class="text-gray-500">حدث خطأ في تحميل ${sectionName}</p>
                                <button onclick="Contractors.load()" class="btn-secondary mt-3">إعادة المحاولة</button>
                            </div>
                        </div>
                    </div>
                `;
            };

            // ✅ تحسين: تحميل جميع الأقسام بشكل متوازي مباشر بدون await إضافي
            // استخدام Promise.all مباشرة لتسريع التحميل
            const [
                approvedSectionHTML,
                evaluationsSectionHTML,
                requirementsSectionHTML,
                analyticsSectionHTML
            ] = await Promise.all([
                Promise.resolve().then(() => this.renderApprovedEntitiesSection()).catch(err => handleError('قائمة المعتمدين', err)),
                Promise.resolve().then(() => this.renderEvaluationsSection()).catch(err => handleError('التقييمات', err)),
                Promise.resolve().then(() => this.renderRequirementsManagementSection()).catch(err => handleError('الاشتراطات', err)),
                isAdmin ? Promise.resolve().then(() => this.renderAnalyticsSection()).catch(err => handleError('التحليلات', err)) : Promise.resolve('')
            ]);

            // ✅ استخدام الدالة الآمنة لتحديث innerHTML
            const mainHTML = `
                <div class="section-header">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="section-title">
                            <i class="fas fa-users-cog ml-3"></i>
                            إدارة المقاولين
                        </h1>
                        <p class="section-subtitle">إدارة بيانات المقاولين والمتعاقدين</p>
                    </div>
                </div>
            </div>
            
            <!-- تبويبات الموديول -->
            <div class="mt-6 mb-4">
                <div class="contractors-tabs-wrapper">
                    <div class="contractors-tabs-container">
                        <button id="contractors-tab-approval-request" class="contractors-tab-btn active px-6 py-3 font-semibold text-blue-600 border-b-2 border-blue-600" onclick="Contractors.switchTab('approval-request')">
                            <i class="fas fa-paper-plane ml-2"></i>
                            إرسال طلب اعتماد مقاول أو مقدم خدمة
                        </button>
                        <button id="contractors-tab-approved" class="contractors-tab-btn px-6 py-3 font-semibold text-gray-500 hover:text-blue-600" onclick="Contractors.switchTab('approved')">
                            <i class="fas fa-check-circle ml-2"></i>
                            قائمة المقاولين والموردين المعتمدين
                        </button>
                        <button id="contractors-tab-evaluations" class="contractors-tab-btn px-6 py-3 font-semibold text-gray-500 hover:text-blue-600" onclick="Contractors.switchTab('evaluations')">
                            <i class="fas fa-clipboard-check ml-2"></i>
                            تقييم وتأهيل المقاولين
                        </button>
                        ${isAdmin ? `
                        <button id="contractors-tab-analytics" class="contractors-tab-btn px-6 py-3 font-semibold text-gray-500 hover:text-blue-600" onclick="Contractors.switchTab('analytics')">
                            <i class="fas fa-chart-line ml-2"></i>
                            تحليل بيانات المقاولين
                        </button>
                        ` : ''}
                        <button id="contractors-tab-requirements" class="contractors-tab-btn px-6 py-3 font-semibold text-gray-500 hover:text-blue-600" onclick="Contractors.switchTab('requirements')">
                            <i class="fas fa-cog ml-2"></i>
                            إدارة اشتراطات اعتماد المقاولين
                        </button>
                        <button id="contractors-btn-refresh" type="button" class="contractors-tab-btn px-6 py-3 font-semibold text-gray-500 hover:text-blue-600" onclick="Contractors.refreshModule()" title="تحديث البيانات">
                            <i class="fas fa-sync-alt ml-2"></i>
                            تحديث
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- محتوى التبويبات -->
            <div id="contractors-tab-content">
                <!-- ✅ إصلاح جذري: إزالة content-visibility لمنع الاهتزاز -->
                <div id="contractors-approval-request-content" class="contractors-tab-content active" style="display: block;">
                    ${this.renderApprovalRequestSection()}
                </div>
                <div id="contractors-approved-content" class="contractors-tab-content" style="display: none;">
                    ${approvedSectionHTML}
                </div>
                <div id="contractors-evaluations-content" class="contractors-tab-content" style="display: none;">
                    ${evaluationsSectionHTML}
                </div>
                ${isAdmin ? `
                <div id="contractors-analytics-content" class="contractors-tab-content" style="display: none;">
                    ${analyticsSectionHTML}
                </div>
                ` : ''}
                <div id="contractors-requirements-content" class="contractors-tab-content" style="display: none;">
                    ${requirementsSectionHTML}
                </div>
            </div>
        `;
            // ✅ تحديث المحتوى مباشرة
            this.safeSetInnerHTML(section, mainHTML);

            // ✅ إعداد event listeners مرة واحدة فقط
            if (!this._listenersInitialized) {
                this._listenersInitialized = true;
                this.setupEventListeners();
                this.setupRealtimeListeners();
            }

            // ✅ ربط زر إرسال الطلب
            const sendBtn = document.getElementById('send-approval-request-btn');
            if (sendBtn && !sendBtn.hasAttribute('data-listener-attached')) {
                sendBtn.setAttribute('data-listener-attached', 'true');
                sendBtn.addEventListener('click', () => this.showApprovalRequestForm());
            }

            // ✅ إصلاح: استعادة التبويب المرئي بعد الرسم لتفادي العودة لتبويب "إرسال طلب اعتماد"
            if (this.currentTab && this.currentTab !== 'approval-request') {
                this.switchTab(this.currentTab);
            }

            // ✅ التحميل اكتمل بنجاح
            this._isLoading = false;

        } catch (error) {
            this._isLoading = false; // ✅ تنظيف في حالة الخطأ
            
            const section = document.getElementById('contractors-section');
            if (typeof Utils !== 'undefined' && Utils.safeError) {
                Utils.safeError('خطأ فادح في تحميل موديول المقاولين:', error);
            } else {
                console.error('خطأ فادح في تحميل موديول المقاولين:', error);
            }
            // ✅ استخدام الدالة الآمنة لتحديث innerHTML
            if (section) {
                const errorHTML = `
                    <div class="content-card">
                        <div class="card-body">
                            <div class="empty-state">
                                <i class="fas fa-exclamation-circle text-4xl text-red-400 mb-3"></i>
                                <h3 class="text-lg font-semibold text-gray-800 mb-2">حدث خطأ في تحميل الموديول</h3>
                                <p class="text-gray-500 mb-4">${error.message || 'خطأ غير معروف'}</p>
                                <button onclick="Contractors.load()" class="btn-primary">
                                    <i class="fas fa-redo ml-2"></i>
                                    إعادة المحاولة
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                this.safeSetInnerHTML(section, errorHTML);
            }
        }
    },

    /**
     * تحديث المديول (إعادة تحميل البيانات مع الحفاظ على التبويب الحالي)
     */
    refreshModule() {
        const btn = document.getElementById('contractors-btn-refresh');
        if (btn) {
            btn.disabled = true;
            const icon = btn.querySelector('i.fa-sync-alt');
            if (icon) icon.classList.add('fa-spin');
        }
        this.load(true).finally(() => {
            const refBtn = document.getElementById('contractors-btn-refresh');
            if (refBtn) {
                refBtn.disabled = false;
                const refIcon = refBtn.querySelector('i.fa-sync-alt');
                if (refIcon) refIcon.classList.remove('fa-spin');
            }
        });
    },

    /**
     * ✅ مزامنة/تحميل بيانات طلبات الاعتماد
     * ✅ معطل مؤقتاً لمنع الاهتزاز
     */
    async bootstrapApprovalRequestsData() {
        // ✅ معطل مؤقتاً - كان يسبب مزامنة متكررة واهتزاز
        return;
    },

    /**
     * التبديل بين التبويبات
     * ✅ إصلاح بسيط ومستقر
     */
    switchTab(tab) {
        // ✅ التحقق من وجود التبويب
        if (!tab) return;
        
        // ✅ منع التبديل المتكرر لنفس التبويب
        if (this.currentTab === tab) return;
        
        // ✅ حفظ التبويب
        this.currentTab = tab;

        // ✅ تحديث أزرار التبويب
        const tabBtns = document.querySelectorAll('.contractors-tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.remove('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
            btn.classList.add('text-gray-500');
        });

        const activeBtn = document.getElementById(`contractors-tab-${tab}`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
            activeBtn.classList.remove('text-gray-500');
        }

        // ✅ إخفاء جميع المحتويات وإظهار المطلوب فقط
        const contents = document.querySelectorAll('.contractors-tab-content');
        contents.forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });

        const activeContent = document.getElementById(`contractors-${tab}-content`);
        if (activeContent) {
            activeContent.classList.add('active');
            activeContent.style.display = 'block';
        }

        // ✅ عند التبديل إلى تبويب التقييمات: ربط الـ listeners ثم تحميل التقييمات إن كانت غير محملة
        if (tab === 'evaluations') {
            this.ensureEvaluationsEventListeners();
            this.ensureEvaluationsDataLoaded();
        }
    },

    /**
     * ✅ التأكد من تحميل بيانات التقييمات عند فتح التبويب (مزامنة من Backend إن كانت القائمة فارغة)
     */
    ensureEvaluationsDataLoaded() {
        const evaluations = AppState.appData.contractorEvaluations;
        const hasData = Array.isArray(evaluations) && evaluations.length > 0;
        if (hasData) return;

        const canSync = typeof GoogleIntegration !== 'undefined' &&
            typeof GoogleIntegration.syncData === 'function' &&
            (AppState.useSupabaseBackend === true || (AppState.googleConfig?.appsScript?.enabled && AppState.googleConfig?.appsScript?.scriptUrl));

        if (!canSync) return;

        GoogleIntegration.syncData({
            sheets: ['ContractorEvaluations'],
            silent: true,
            showLoader: false,
            notifyOnSuccess: false,
            notifyOnError: true
        }).then(() => {
            const after = AppState.appData.contractorEvaluations || [];
            if (Array.isArray(after) && after.length > 0) {
                this.refreshEvaluationsList(this.currentEvaluationFilter || '');
            }
        }).catch(() => {});
    },

    /**
     * ✅ التأكد من تحميل بيانات المقاولين والمعتمدين للاستخدام في الموديولات (العيادة، التدريب، إلخ)
     * يُستدعى قبل تعبئة قوائم المقاولين في النماذج لضمان استدعاء صحيح وبدون أخطاء.
     * @returns {Promise<void>}
     */
    ensureContractorsAndApprovedForModules() {
        const approved = AppState.appData.approvedContractors;
        const contractors = AppState.appData.contractors;
        const hasApproved = Array.isArray(approved) && approved.length > 0;
        const hasContractors = Array.isArray(contractors) && contractors.length > 0;
        if (hasApproved || hasContractors) return Promise.resolve();

        const canSync = typeof GoogleIntegration !== 'undefined' &&
            typeof GoogleIntegration.syncData === 'function' &&
            (AppState.useSupabaseBackend === true || (AppState.googleConfig?.appsScript?.enabled && AppState.googleConfig?.appsScript?.scriptUrl));
        if (!canSync) return Promise.resolve();

        return GoogleIntegration.syncData({
            sheets: ['ApprovedContractors', 'Contractors'],
            silent: true,
            showLoader: false,
            notifyOnSuccess: false,
            notifyOnError: false
        }).then(() => {
            this.ensureApprovedSetup();
        }).catch(() => {});
    },

    /**
     * ✅ إصلاح: تحميل محتوى تبويب طلبات الاعتماد
     */
    loadApprovalRequestTab(container, skipIfExists = false) {
        try {
            if (!container) {
                return;
            }
            
            // إذا كان المحتوى موجوداً بالفعل، لا نفعل شيئاً
            if (skipIfExists && container.innerHTML.trim() !== '') {
                return;
            }
            
            // تحميل المحتوى مباشرة
            this.ensureData();
            const approvalHTML = this.renderApprovalRequestSection();
            this.safeSetInnerHTML(container, approvalHTML);
            
            // ربط event listener مباشرة
            const sendBtn = document.getElementById('send-approval-request-btn');
            if (sendBtn && !sendBtn.hasAttribute('data-listener-attached')) {
                sendBtn.setAttribute('data-listener-attached', 'true');
                sendBtn.addEventListener('click', () => this.showApprovalRequestForm());
            }
        } catch (error) {
            Utils.safeError('خطأ في تحميل تبويب طلبات الاعتماد:', error);
            
            if (container && document.contains(container)) {
                const errorHTML = `
                    <div class="content-card">
                        <div class="card-body">
                            <div class="empty-state">
                                <i class="fas fa-exclamation-triangle text-4xl text-yellow-400 mb-3"></i>
                                <p class="text-gray-500">حدث خطأ في تحميل البيانات</p>
                                <button onclick="Contractors.switchTab('approval-request')" class="btn-secondary mt-3">إعادة المحاولة</button>
                            </div>
                        </div>
                    </div>
                `;
                this.safeSetInnerHTML(container, errorHTML);
            }
        }
    },

    /**
     * حساب إحصائيات قائمة المقاولين
     */
    getContractorsStats() {
        const contractors = AppState.appData.contractors || [];

        // إحصائيات حسب نوع الخدمة
        const serviceTypes = {};
        contractors.forEach(c => {
            const serviceType = c.serviceType || 'غير محدد';
            serviceTypes[serviceType] = (serviceTypes[serviceType] || 0) + 1;
        });

        // إحصائيات حسب حالة الاشتراطات
        let requirementsMet = 0;
        let requirementsPartial = 0;
        let requirementsNotMet = 0;

        contractors.forEach(c => {
            const reqStatus = this.getContractorRequirementsStatus(c.id);
            if (reqStatus.allMet) {
                requirementsMet++;
            } else if (reqStatus.completed > 0) {
                requirementsPartial++;
            } else {
                requirementsNotMet++;
            }
        });

        // إحصائيات حسب الحالة
        const statusCounts = {
            'نشط': 0,
            'منتهي': 0,
            'معلق': 0,
            'أخرى': 0
        };

        contractors.forEach(c => {
            const status = c.status || 'أخرى';
            if (statusCounts.hasOwnProperty(status)) {
                statusCounts[status]++;
            } else {
                statusCounts['أخرى']++;
            }
        });

        return {
            total: contractors.length,
            serviceTypes,
            requirements: {
                met: requirementsMet,
                partial: requirementsPartial,
                notMet: requirementsNotMet
            },
            status: statusCounts
        };
    },

    /**
     * رسم كارت إحصائيات قائمة المقاولين
     */
    renderContractorsStats() {
        const stats = this.getContractorsStats();
        const topServiceTypes = Object.entries(stats.serviceTypes)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="content-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">إجمالي المقاولين</p>
                            <p class="text-2xl font-bold text-blue-600">${stats.total}</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-users-cog text-blue-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="content-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">أكثر أنواع الخدمات</p>
                            <p class="text-lg font-semibold text-green-600">
                                ${topServiceTypes.length > 0 ? topServiceTypes[0][0] : 'لا يوجد'}
                            </p>
                            <p class="text-xs text-gray-500">${topServiceTypes.length > 0 ? topServiceTypes[0][1] : 0} مقاول</p>
                        </div>
                        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-tools text-green-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="content-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">حالة الاشتراطات</p>
                            <p class="text-lg font-semibold text-purple-600">
                                ${stats.requirements.met} مستوفي
                            </p>
                            <p class="text-xs text-gray-500">
                                ${stats.requirements.partial} جزئي / ${stats.requirements.notMet} غير مستوفي
                            </p>
                        </div>
                        <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-clipboard-check text-purple-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="content-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">الحالة</p>
                            <p class="text-lg font-semibold text-orange-600">
                                ${stats.status['نشط']} نشط
                            </p>
                            <p class="text-xs text-gray-500">
                                ${stats.status['منتهي']} منتهي / ${stats.status['معلق']} معلق
                            </p>
                        </div>
                        <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-chart-line text-orange-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },


    /**
     * توليد كود تلقائي للمقاول (مثل: CON-001, CON-002)
     */
    generateContractorCode() {
        const contractors = AppState.appData.contractors || [];
        let maxNumber = 0;

        // البحث عن أكبر رقم في الأكواد الموجودة
        contractors.forEach(contractor => {
            if (contractor.code) {
                const match = contractor.code.match(/CON-(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNumber) {
                        maxNumber = num;
                    }
                }
            }
        });

        // توليد كود جديد
        const newNumber = maxNumber + 1;
        return `CON-${String(newNumber).padStart(3, '0')}`;
    },

    /**
     * ✅ استخراج الرقم من كود المقاول للترتيب الصحيح
     * مثال: CON-001 → 1, CON-010 → 10, CON-100 → 100
     */
    extractContractorCodeNumber(code) {
        if (!code) return 0;
        const match = String(code).match(/CON-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    },

    /**
     * ✅ دالة مقارنة لترتيب المقاولين حسب كود المقاول
     * الترتيب: CON-001, CON-002, ..., CON-010, ..., CON-100
     */
    sortByContractorCode(a, b) {
        const codeA = a.code || a.contractorCode || '';
        const codeB = b.code || b.contractorCode || '';
        
        const numA = Contractors.extractContractorCodeNumber(codeA);
        const numB = Contractors.extractContractorCodeNumber(codeB);
        
        // إذا كان لديهما أرقام، الترتيب حسب الرقم
        if (numA > 0 && numB > 0) {
            return numA - numB;
        }
        
        // إذا كان أحدهما فقط لديه رقم، الذي لديه رقم يأتي أولاً
        if (numA > 0) return -1;
        if (numB > 0) return 1;
        
        // إذا لم يكن لديهما أرقام، الترتيب أبجدياً حسب الاسم
        const nameA = a.companyName || a.name || '';
        const nameB = b.companyName || b.name || '';
        return nameA.localeCompare(nameB, 'ar', { sensitivity: 'base' });
    },

    normalizeApprovedStatus(value) {
        const normalized = (value || '').toString().trim().toLowerCase();
        if (!normalized) return 'under_review';
        if (['approved', 'معتمد', 'accept', 'accepted', 'active', 'valid', 'pass'].includes(normalized)) {
            return 'approved';
        }
        if (['rejected', 'مرفوض', 'رفض', 'cancelled', 'canceled', 'denied', 'invalid', 'expired'].includes(normalized)) {
            return 'rejected';
        }
        return 'under_review';
    },

    normalizeApprovedEntityType(value) {
        const normalized = (value || '').toString().trim().toLowerCase();
        if (['supplier', 'مورد', 'مورّد', 'vendor'].includes(normalized)) {
            return 'supplier';
        }
        return 'contractor';
    },

    getApprovedStatusLabel(status) {
        return APPROVED_ENTITY_STATUS_OPTIONS[status] || 'تحت المراجعة';
    },

    getApprovedTypeLabel(entityType) {
        return APPROVED_ENTITY_TYPE_OPTIONS[entityType] || APPROVED_ENTITY_TYPE_OPTIONS.contractor;
    },

    getApprovedStatusBadgeClass(status) {
        if (status === 'approved') return 'badge-success';
        if (status === 'under_review') return 'badge-warning';
        return 'badge-danger';
    },

    isApprovalExpired(record) {
        if (!record?.expiryDate) return false;
        const expiry = new Date(record.expiryDate);
        if (Number.isNaN(expiry.getTime())) return false;
        const today = new Date();
        expiry.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return expiry < today;
    },

    isApprovalActive(record, includeExpired = false) {
        if (!record) return false;
        
        // ✅ إصلاح: قبول جميع قيم الحالة التي تعني "معتمد"
        // دعم القيم: 'approved', 'معتمد', 'نشط', 'active', أو أي سجل بدون status (للتوافق مع البيانات القديمة)
        const status = (record.status || '').toString().toLowerCase().trim();
        const approvedStatuses = ['approved', 'معتمد', 'نشط', 'active', ''];
        
        // إذا كان status موجود ولكن ليس من القيم المقبولة، ارفض السجل
        if (record.status && !approvedStatuses.includes(status)) {
            return false;
        }
        
        if (includeExpired) return true;
        return !this.isApprovalExpired(record);
    },

    /**
     * ✅ دالة تشخيصية: فحص حالة مقاول معين
     * يمكن استدعاؤها من Console للتحقق من سبب عدم ظهور مقاول
     * @param {string} codeOrName - كود المقاول (مثل CON-056) أو اسمه
     */
    debugContractorVisibility(codeOrName) {
        console.log('🔍 فحص حالة المقاول:', codeOrName);
        
        // البحث في قائمة المعتمدين
        const approvedList = AppState.appData.approvedContractors || [];
        const approved = approvedList.find(a => 
            (a.code && a.code === codeOrName) || 
            (a.isoCode && a.isoCode === codeOrName) || 
            (a.companyName && a.companyName.includes(codeOrName))
        );
        
        if (!approved) {
            console.error('❌ المقاول غير موجود في قائمة المعتمدين (AppState.appData.approvedContractors)');
            return {
                found: false,
                message: 'المقاول غير موجود في قائمة المعتمدين'
            };
        }
        
        console.log('✅ المقاول موجود في قائمة المعتمدين:', approved);
        
        // فحص الحالة - تحديث للقيم المقبولة
        const status = (approved.status || '').toString().toLowerCase().trim();
        const approvedStatuses = ['approved', 'معتمد', 'نشط', 'active', ''];
        const isApproved = approvedStatuses.includes(status);
        console.log(`📊 الحالة (status): "${approved.status}"`, isApproved ? '✅ معتمد' : '❌ غير معتمد');
        
        // فحص الصلاحية
        const isExpired = this.isApprovalExpired(approved);
        console.log(`📅 تاريخ الانتهاء (expiryDate): ${approved.expiryDate || 'غير محدد'}`, isExpired ? '❌ منتهي' : '✅ ساري');
        
        // فحص نشاط الاعتماد
        const isActive = this.isApprovalActive(approved, false);
        console.log(`🔄 نشط (isApprovalActive): ${isActive}`, isActive ? '✅' : '❌');
        
        // فحص الاشتراطات (إذا كان له contractorId)
        let requirementsMet = true;
        if (approved.contractorId) {
            requirementsMet = this.checkAllRequirementsMet(approved.contractorId);
            console.log(`📋 الاشتراطات (checkAllRequirementsMet): ${requirementsMet}`, requirementsMet ? '✅ مستوفاة' : '❌ غير مستوفاة');
        } else {
            console.log('ℹ️ لا يوجد contractorId - لا حاجة لفحص الاشتراطات');
        }
        
        // التحقق من الظهور في getAllContractorsForModules
        const allContractors = this.getAllContractorsForModules();
        const appearsInList = allContractors.some(c => 
            c.id === approved.id || 
            c.id === approved.contractorId || 
            (c.name && approved.companyName && c.name === approved.companyName)
        );
        console.log(`📋 يظهر في قائمة المديولات (getAllContractorsForModules): ${appearsInList}`, appearsInList ? '✅' : '❌');

        // التحقق من الظهور في getContractorOptionsForModules
        const forForms = this.getContractorOptionsForModules();
        const appearsInForms = forForms.some(c => 
            c.id === approved.id || 
            c.id === approved.contractorId || 
            (c.name && approved.companyName && c.name === approved.companyName)
        );
        console.log(`📝 يظهر في النماذج (getContractorOptionsForModules): ${appearsInForms}`, appearsInForms ? '✅' : '❌');
        
        return {
            found: true,
            approved: approved,
            checks: {
                isApproved: isApproved,
                isExpired: isExpired,
                isActive: isActive,
                requirementsMet: requirementsMet,
                appearsInList: appearsInList,
                appearsInForms: appearsInForms
            },
            shouldAppear: isActive,
            message: isActive ? 'يجب أن يظهر المقاول في النماذج' : 'المقاول لا يستوفي معايير الظهور'
        };
    },

    /**
     * ✅ دالة تشخيصية شاملة: فحص جميع المقاولين المعتمدين
     * تعرض أسباب عدم ظهور كل مقاول في النماذج
     */
    debugAllContractorsVisibility() {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔍 فحص شامل لجميع المقاولين المعتمدين');
        console.log('═══════════════════════════════════════════════════════════');
        
        const approvedList = AppState.appData.approvedContractors || [];
        const forForms = this.getContractorOptionsForModules();
        const allFromModules = this.getAllContractorsForModules();
        
        console.log(`📊 إجمالي سجلات المعتمدين: ${approvedList.length}`);
        console.log(`📊 المقاولين في getAllContractorsForModules: ${allFromModules.length}`);
        console.log(`📊 المقاولين في getContractorOptionsForModules (للنماذج): ${forForms.length}`);
        console.log('═══════════════════════════════════════════════════════════');
        
        const results = {
            total: approvedList.length,
            visible: 0,
            hidden: 0,
            reasons: {
                statusNotApproved: [],
                expired: [],
                noName: [],
                notInForms: []
            }
        };
        
        approvedList.forEach((record, index) => {
            const name = record.companyName || record.name || '(بدون اسم)';
            const code = record.code || record.isoCode || '(بدون كود)';
            const status = (record.status || '').toString();
            
            const isActive = this.isApprovalActive(record, true);
            const isExpired = this.isApprovalExpired(record);
            
            const appearsInForms = forForms.some(c => 
                c.id === record.id || 
                c.id === record.contractorId || 
                (c.name && record.companyName && c.name === record.companyName)
            );
            
            if (appearsInForms) {
                results.visible++;
                console.log(`✅ ${index + 1}. ${code} - ${name} [status: "${status}"]`);
            } else {
                results.hidden++;
                let reason = '';
                
                if (!isActive) {
                    const statusLower = status.toLowerCase().trim();
                    const approvedStatuses = ['approved', 'معتمد', 'نشط', 'active', ''];
                    if (!approvedStatuses.includes(statusLower)) {
                        reason = `حالة غير معتمدة: "${status}"`;
                        results.reasons.statusNotApproved.push({ name, code, status });
                    }
                }
                
                if (isExpired) {
                    reason = `منتهي الصلاحية: ${record.expiryDate}`;
                    results.reasons.expired.push({ name, code, expiryDate: record.expiryDate });
                }
                
                if (!name || name === '(بدون اسم)') {
                    reason = 'بدون اسم';
                    results.reasons.noName.push({ id: record.id, code });
                }
                
                if (!reason) {
                    reason = 'سبب غير معروف - يحتاج فحص يدوي';
                    results.reasons.notInForms.push({ name, code, record });
                }
                
                console.log(`❌ ${index + 1}. ${code} - ${name} [status: "${status}"] → ${reason}`);
            }
        });
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`📊 الملخص: ${results.visible} يظهر ✅ | ${results.hidden} لا يظهر ❌`);
        console.log('═══════════════════════════════════════════════════════════');
        
        if (results.reasons.statusNotApproved.length > 0) {
            console.log('\n⚠️ مقاولين بحالة غير "approved":');
            console.table(results.reasons.statusNotApproved);
        }
        
        if (results.reasons.expired.length > 0) {
            console.log('\n⚠️ مقاولين منتهية صلاحيتهم:');
            console.table(results.reasons.expired);
        }
        
        if (results.reasons.noName.length > 0) {
            console.log('\n⚠️ سجلات بدون اسم:');
            console.table(results.reasons.noName);
        }
        
        if (results.reasons.notInForms.length > 0) {
            console.log('\n⚠️ مقاولين لم يظهروا لسبب غير واضح:');
            results.reasons.notInForms.forEach(item => {
                console.log('   -', item.name, item.code);
                console.log('     السجل الكامل:', item.record);
            });
        }
        
        return results;
    },

    ensureApprovedSetup() {
        // ✅ حماية: التأكد من وجود AppState و appData قبل الوصول
        if (!AppState || !AppState.appData) {
            if (typeof window !== 'undefined') {
                window.AppState = window.AppState || {};
                window.AppState.appData = window.AppState.appData || {};
            } else {
                return; // لا يمكن المتابعة بدون AppState
            }
        }
        
        const collection = AppState.appData.approvedContractors;
        if (!Array.isArray(collection)) {
            AppState.appData.approvedContractors = [];
            return;
        }

        // تحويل الأكواد القديمة APP-xxx إلى CON-xxx
        this.convertOldApprovedCodes();

        let mutated = false;
        AppState.appData.approvedContractors = collection.map((item) => {
            const normalized = Object.assign({}, item);
            if (!normalized.id) {
                normalized.id = Utils.generateId('APPCON');
                mutated = true;
            }

            const companyName = (normalized.companyName || normalized.name || '').trim();
            if (companyName !== normalized.companyName) {
                normalized.companyName = companyName;
                mutated = true;
            }

            const entityType = this.normalizeApprovedEntityType(normalized.entityType || normalized.type);
            if (entityType !== normalized.entityType) {
                normalized.entityType = entityType;
                mutated = true;
            }

            const serviceType = (normalized.serviceType || normalized.activity || normalized.service || '').trim();
            if (serviceType !== normalized.serviceType) {
                normalized.serviceType = serviceType;
                mutated = true;
            }

            const licenseNumber = (normalized.licenseNumber || normalized.commercialNumber || normalized.license || '').trim();
            if (licenseNumber !== normalized.licenseNumber) {
                normalized.licenseNumber = licenseNumber;
                mutated = true;
            }

            const safetyReviewer = (normalized.safetyReviewer || normalized.reviewer || '').trim();
            if (safetyReviewer !== normalized.safetyReviewer) {
                normalized.safetyReviewer = safetyReviewer;
                mutated = true;
            }

            const notes = (normalized.notes || normalized.remark || '').trim();
            if (notes !== normalized.notes) {
                normalized.notes = notes;
                mutated = true;
            }

            const status = this.normalizeApprovedStatus(normalized.status || normalized.statusLabel);
            if (status !== normalized.status) {
                normalized.status = status;
                mutated = true;
            }

            normalized.approvalDate = normalized.approvalDate || normalized.accreditationDate || '';
            normalized.expiryDate = normalized.expiryDate || normalized.expirationDate || '';
            normalized.createdAt = normalized.createdAt || new Date().toISOString();
            normalized.updatedAt = normalized.updatedAt || new Date().toISOString();

            // قراءة كود المقاول من قاعدة البيانات (دعم أسماء الحقول المختلفة)
            let contractorCode = normalized.isoCode || normalized.code ||
                normalized.contractorCode || normalized['كود المقاول'] ||
                normalized['كود'] || normalized.codeNumber || '';

            // تحويل الأكواد القديمة APP-xxx إلى CON-xxx
            if (contractorCode && contractorCode.match(/^APP-(\d+)$/)) {
                const match = contractorCode.match(/^APP-(\d+)$/);
                if (match) {
                    contractorCode = `CON-${match[1]}`;
                    mutated = true;
                }
            }

            // إذا كان هناك contractorId، البحث عن كود المقاول في قائمة المقاولين
            if (!contractorCode && normalized.contractorId) {
                const contractors = AppState.appData.contractors || [];
                const contractor = contractors.find(c => c.id === normalized.contractorId);
                if (contractor && contractor.code) {
                    contractorCode = contractor.code;
                    mutated = true;
                }
            }

            // توليد كود تلقائي إذا لم يكن موجوداً - استخدام CON-xxx فقط
            if (!contractorCode) {
                // البحث عن أكبر رقم في الأكواد الموجودة (CON-xxx و APP-xxx القديمة)
                const contractors = AppState.appData.contractors || [];
                let maxNumber = 0;

                // البحث في قائمة المقاولين
                contractors.forEach(contractor => {
                    if (contractor.code) {
                        const match = contractor.code.match(/CON-(\d+)/);
                        if (match) {
                            const num = parseInt(match[1], 10);
                            if (num > maxNumber) {
                                maxNumber = num;
                            }
                        }
                    }
                });

                // البحث في قائمة المعتمدين
                collection.forEach(entity => {
                    const code = entity.isoCode || entity.code || entity.contractorCode ||
                        entity['كود المقاول'] || entity['كود'] || entity.codeNumber;
                    if (code) {
                        // البحث عن كود CON-xxx
                        let match = code.match(/CON-(\d+)/);
                        if (match) {
                            const num = parseInt(match[1], 10);
                            if (num > maxNumber) {
                                maxNumber = num;
                            }
                        }
                        // البحث عن كود APP-xxx القديم (للتحويل)
                        match = code.match(/APP-(\d+)/);
                        if (match) {
                            const num = parseInt(match[1], 10);
                            if (num > maxNumber) {
                                maxNumber = num;
                            }
                        }
                    }
                });

                const newNumber = maxNumber + 1;
                contractorCode = `CON-${String(newNumber).padStart(3, '0')}`;
                mutated = true;
            }

            // استخدام الكود الموجود أو المولد
            normalized.isoCode = contractorCode;
            normalized.code = contractorCode;
            // التأكد من تطابق الحقلين
            if (normalized.isoCode !== normalized.code) {
                normalized.code = normalized.isoCode;
                mutated = true;
            }

            return normalized;
        });

        if (mutated) {
            // حفظ البيانات باستخدام window.DataManager
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            } else {
                Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
            }
        }
    },

    /**
     * تحويل الأكواد القديمة APP-xxx إلى CON-xxx
     */
    convertOldApprovedCodes() {
        const approvedContractors = AppState.appData.approvedContractors || [];
        const contractors = AppState.appData.contractors || [];
        let mutated = false;

        approvedContractors.forEach(entity => {
            const oldCode = entity.isoCode || entity.code;
            if (oldCode && oldCode.match(/^APP-(\d+)$/)) {
                const match = oldCode.match(/^APP-(\d+)$/);
                if (match) {
                    const newCode = `CON-${match[1]}`;

                    // التحقق من عدم وجود كود CON-xxx مكرر
                    const existingWithNewCode = contractors.find(c => c.code === newCode) ||
                        approvedContractors.find(e => (e.isoCode === newCode || e.code === newCode) && e.id !== entity.id);

                    if (!existingWithNewCode) {
                        entity.isoCode = newCode;
                        entity.code = newCode;
                        mutated = true;
                    } else {
                        // إذا كان الكود مكرراً، توليد كود جديد
                        let maxNumber = 0;
                        contractors.forEach(c => {
                            if (c.code) {
                                const m = c.code.match(/CON-(\d+)/);
                                if (m) {
                                    const num = parseInt(m[1], 10);
                                    if (num > maxNumber) maxNumber = num;
                                }
                            }
                        });
                        approvedContractors.forEach(e => {
                            const code = e.isoCode || e.code;
                            if (code) {
                                let m = code.match(/CON-(\d+)/);
                                if (m) {
                                    const num = parseInt(m[1], 10);
                                    if (num > maxNumber) maxNumber = num;
                                }
                            }
                        });
                        const newNumber = maxNumber + 1;
                        const finalCode = `CON-${String(newNumber).padStart(3, '0')}`;
                        entity.isoCode = finalCode;
                        entity.code = finalCode;
                        mutated = true;
                    }
                }
            }
        });

        if (mutated) {
            AppState.appData.approvedContractors = approvedContractors;
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            }
        }
    },

    getFilteredApprovedEntities() {
        this.ensureApprovedSetup();

        // دمج قائمة المعتمدين مع قائمة المقاولين العادية
        const approvedRecords = (AppState.appData.approvedContractors || []).slice();
        const regularContractors = (AppState.appData.contractors || []).slice();

        // تحويل المقاولين العاديين إلى نفس تنسيق المعتمدين للتوحيد
        const convertedContractors = regularContractors.map(contractor => {
            // التأكد من وجود كود للمقاول
            if (!contractor.code) {
                contractor.code = this.generateContractorCode();
            }

            // البحث عن سجل معتمد مرتبط بهذا المقاول
            const relatedApproved = approvedRecords.find(ap => ap.contractorId === contractor.id);

            return {
                id: contractor.id,
                contractorId: contractor.id,
                companyName: contractor.name || contractor.company || '',
                entityType: 'contractor',
                serviceType: contractor.serviceType || '',
                licenseNumber: contractor.licenseNumber || contractor.contractNumber || '',
                approvalDate: relatedApproved?.approvalDate || contractor.startDate || '',
                expiryDate: relatedApproved?.expiryDate || contractor.endDate || '',
                safetyReviewer: relatedApproved?.safetyReviewer || '',
                notes: relatedApproved?.notes || contractor.notes || '',
                status: relatedApproved?.status || (contractor.status === 'نشط' ? 'approved' : 'under_review'),
                createdAt: contractor.createdAt || new Date().toISOString(),
                updatedAt: contractor.updatedAt || new Date().toISOString(),
                code: contractor.code,
                contractNumber: contractor.contractNumber,
                isRegularContractor: true, // علامة للتمييز
                requirementsStatus: this.getContractorRequirementsStatus(contractor.id)
            };
        });

        // دمج القوائم مع تجنب التكرار (إذا كان المقاول موجود في المعتمدين، نستخدم بيانات المعتمدين)
        // التحقق من التكرار بناءً على contractorId أولاً، ثم الكود، ثم الاسم
        const allRecords = [...approvedRecords];
        const addedIds = new Set(approvedRecords.map(r => r.contractorId || r.id).filter(Boolean));

        convertedContractors.forEach(converted => {
            // التحقق من التكرار بناءً على contractorId
            if (converted.contractorId && addedIds.has(converted.contractorId)) {
                return; // المقاول موجود بالفعل في قائمة المعتمدين
            }

            // التحقق من التكرار بناءً على الكود
            const convertedCode = converted.code || converted.isoCode;
            if (convertedCode) {
                const existsByCode = allRecords.find(r => {
                    const rCode = r.code || r.isoCode;
                    return rCode && rCode === convertedCode;
                });
                if (existsByCode) {
                    return; // الكود موجود بالفعل
                }
            }

            // التحقق من التكرار بناءً على الاسم
            const convertedName = (converted.companyName || '').trim().toLowerCase();
            if (convertedName) {
                const existsByName = allRecords.find(r => {
                    const rName = (r.companyName || '').trim().toLowerCase();
                    return rName && rName === convertedName && r.entityType === converted.entityType;
                });
                if (existsByName) {
                    return; // الاسم موجود بالفعل
                }
            }

            // إضافة المقاول إذا لم يكن مكرراً
            allRecords.push(converted);
            if (converted.contractorId) {
                addedIds.add(converted.contractorId);
            }
        });

        if (allRecords.length === 0) return [];

        const { search, status, type, startDate, endDate } = this.approvedFilters;
        const normalizedSearch = (search || '').trim().toLowerCase();
        const hasSearch = normalizedSearch.length > 0;
        const fromDate = startDate ? new Date(startDate) : null;
        const toDate = endDate ? new Date(endDate) : null;
        if (toDate) {
            toDate.setHours(23, 59, 59, 999);
        }

        return allRecords.filter((record) => {
            if (status && record.status !== status) return false;
            if (type && record.entityType !== type) return false;

            const approvalDate = record.approvalDate ? new Date(record.approvalDate) : null;
            if (fromDate && approvalDate && approvalDate < fromDate) return false;
            if (toDate && approvalDate && approvalDate > toDate) return false;

            if (hasSearch) {
                const haystack = [
                    record.companyName,
                    record.serviceType,
                    record.licenseNumber,
                    record.safetyReviewer,
                    record.notes,
                    this.getApprovedStatusLabel(record.status),
                    this.getApprovedTypeLabel(record.entityType),
                    record.code || '',
                    record.contractNumber || ''
                ].join(' ').toLowerCase();
                if (!haystack.includes(normalizedSearch)) return false;
            }
            return true;
        }).sort((a, b) => {
            // ✅ الترتيب حسب كود المقاول (CON-001, CON-002, ...)
            return Contractors.sortByContractorCode(a, b);
        });
    },

    /**
     * حساب إحصائيات قائمة المعتمدين (بما في ذلك المقاولين العاديين)
     */
    getApprovedEntitiesStats() {
        const approvedEntities = AppState.appData.approvedContractors || [];
        const regularContractors = AppState.appData.contractors || [];

        // عدد المقاولين والموردين من المعتمدين
        const approvedContractorsCount = approvedEntities.filter(e => e.entityType === 'contractor').length;
        const suppliersCount = approvedEntities.filter(e => e.entityType === 'supplier').length;

        // إضافة المقاولين العاديين (الذين ليسوا في قائمة المعتمدين)
        const regularOnlyCount = regularContractors.filter(rc => {
            return !approvedEntities.some(ae => ae.contractorId === rc.id);
        }).length;

        const contractorsCount = approvedContractorsCount + regularOnlyCount;

        // توزيع حسب نوع الجهة
        const entityTypeDistribution = {
            'مقاول': contractorsCount,
            'مورد': suppliersCount
        };

        // حساب الفترة المستغرقة للاعتماد (متوسط)
        let totalApprovalTime = 0;
        let validApprovals = 0;

        approvedEntities.forEach(entity => {
            if (entity.approvalDate && entity.createdAt) {
                const approvalDate = new Date(entity.approvalDate);
                const requestDate = new Date(entity.createdAt);

                if (!isNaN(approvalDate.getTime()) && !isNaN(requestDate.getTime()) && approvalDate >= requestDate) {
                    const diffTime = approvalDate - requestDate;
                    const diffDays = diffTime / (1000 * 60 * 60 * 24);
                    totalApprovalTime += diffDays;
                    validApprovals++;
                }
            }
        });

        const avgApprovalTime = validApprovals > 0 ? Math.round(totalApprovalTime / validApprovals) : 0;

        return {
            contractorsCount,
            suppliersCount,
            total: approvedEntities.length + regularOnlyCount,
            entityTypeDistribution,
            avgApprovalTime
        };
    },

    /**
     * رسم كارت إحصائيات قائمة المعتمدين
     */
    renderApprovedEntitiesStats() {
        const stats = this.getApprovedEntitiesStats();

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="content-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">عدد المقاولين</p>
                            <p class="text-2xl font-bold text-blue-600">${stats.contractorsCount}</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-users-cog text-blue-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="content-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">عدد الموردين</p>
                            <p class="text-2xl font-bold text-green-600">${stats.suppliersCount}</p>
                        </div>
                        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-truck text-green-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="content-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">نوع الجهة</p>
                            <p class="text-lg font-semibold text-purple-600">
                                ${stats.entityTypeDistribution['مقاول'] > stats.entityTypeDistribution['مورد'] ? 'مقاول' : 'مورد'}
                            </p>
                            <p class="text-xs text-gray-500">
                                ${stats.entityTypeDistribution['مقاول']} مقاول / ${stats.entityTypeDistribution['مورد']} مورد
                            </p>
                        </div>
                        <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-building text-purple-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="content-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">الفترة المستغرقة للاعتماد</p>
                            <p class="text-2xl font-bold text-orange-600">${stats.avgApprovalTime}</p>
                            <p class="text-xs text-gray-500">يوم (متوسط)</p>
                        </div>
                        <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-clock text-orange-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderApprovedEntitiesSection() {
        const isAdmin = Permissions.isAdmin();
        const tableHtml = this.renderApprovedEntitiesTable(this.getFilteredApprovedEntities(), isAdmin);
        const statusOptions = Object.entries(APPROVED_ENTITY_STATUS_OPTIONS).map(([value, label]) => `
            <option value="${value}" ${this.approvedFilters.status === value ? 'selected' : ''}>${label}</option>
        `).join('');
        const typeOptions = Object.entries(APPROVED_ENTITY_TYPE_OPTIONS).map(([value, label]) => `
            <option value="${value}" ${this.approvedFilters.type === value ? 'selected' : ''}>${label}</option>
        `).join('');

        return `
            <div class="content-card" id="approved-contractors-card">
                <div class="card-header">
                    <div class="flex items-center justify-between flex-wrap gap-4">
                        <h2 class="card-title flex items-center gap-2">
                            <i class="fas fa-check-circle ml-2"></i>
                            قائمة المقاولين والموردين المعتمدين
                        </h2>
                        <div class="flex items-center gap-2 flex-wrap">
                            <button id="export-approved-contractors-pdf-btn" class="btn-secondary">
                                <i class="fas fa-file-pdf ml-2"></i>
                                تصدير PDF
                            </button>
                            <button id="export-approved-contractors-excel-btn" class="btn-success">
                                <i class="fas fa-file-excel ml-2"></i>
                                تصدير Excel
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body space-y-4">
                    ${this.renderApprovedEntitiesStats()}
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">بحث عام</label>
                            <input type="text" id="approved-contractors-search" class="form-input" placeholder="بحث بالاسم، الخدمة، الترخيص..." value="${Utils.escapeHTML(this.approvedFilters.search)}">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">الحالة</label>
                            <select id="approved-contractors-status" class="form-input">
                                <option value="">جميع الحالات</option>
                                ${statusOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">نوع الجهة</label>
                            <select id="approved-contractors-type" class="form-input">
                                <option value="">جميع الأنواع</option>
                                ${typeOptions}
                            </select>
                        </div>
                        <div class="flex flex-col md:flex-row gap-3 md:col-span-2 xl:col-span-1">
                            <div class="flex-1">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">تاريخ الاعتماد من</label>
                                <input type="date" id="approved-contractors-start" class="form-input" value="${this.approvedFilters.startDate || ''}">
                            </div>
                            <div class="flex-1">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">إلى</label>
                                <input type="date" id="approved-contractors-end" class="form-input" value="${this.approvedFilters.endDate || ''}">
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-end">
                        <button id="approved-contractors-reset" class="btn-secondary btn-sm">
                            <i class="fas fa-undo-alt ml-2"></i>
                            إعادة تعيين الفلاتر
                        </button>
                    </div>
                    <div id="approved-contractors-container">
                        ${tableHtml}
                    </div>
                </div>
            </div>
        `;
    },

    renderApprovedEntitiesTable(records, isAdmin = false) {
        if (!records || records.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-clipboard-check text-4xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500">لا توجد جهات معتمدة أو مقاولين مسجلين حالياً.</p>
                </div>
            `;
        }

        const rowsHtml = records.map((record) => {
            const statusBadgeClass = this.getApprovedStatusBadgeClass(record.status);
            const statusLabel = this.getApprovedStatusLabel(record.status);
            const typeLabel = this.getApprovedTypeLabel(record.entityType);
            const approvalDate = record.approvalDate ? Utils.formatDate(record.approvalDate) : '—';
            const expiryDate = record.expiryDate ? Utils.formatDate(record.expiryDate) : '—';
            const isExpired = this.isApprovalExpired(record);
            const expiryBadge = isExpired ? '<span class="badge badge-danger ml-2">منتهي</span>' : '';

            // قراءة كود المقاول من قاعدة البيانات (دعم أسماء الحقول المختلفة)
            let contractorCode = record.code || record.isoCode ||
                record.contractorCode || record['كود المقاول'] ||
                record['كود'] || record.codeNumber || '';

            // تحويل الأكواد القديمة APP-xxx إلى CON-xxx
            if (contractorCode && contractorCode.match(/^APP-(\d+)$/)) {
                const match = contractorCode.match(/^APP-(\d+)$/);
                if (match) {
                    contractorCode = `CON-${match[1]}`;
                    record.code = contractorCode;
                    record.isoCode = contractorCode;
                    // تحديث السجل في AppState
                    const approvedEntities = AppState.appData.approvedContractors || [];
                    const approvedIndex = approvedEntities.findIndex(e => e.id === record.id);
                    if (approvedIndex !== -1) {
                        approvedEntities[approvedIndex] = record;
                        AppState.appData.approvedContractors = approvedEntities;
                    }
                }
            }

            // إذا كان هناك contractorId، البحث عن كود المقاول في قائمة المقاولين
            if (!contractorCode && record.contractorId) {
                const contractors = AppState.appData.contractors || [];
                const contractor = contractors.find(c => c.id === record.contractorId);
                if (contractor && contractor.code) {
                    contractorCode = contractor.code;
                    record.code = contractorCode;
                    record.isoCode = contractorCode;
                    // تحديث السجل في AppState
                    const approvedEntities = AppState.appData.approvedContractors || [];
                    const approvedIndex = approvedEntities.findIndex(e => e.id === record.id);
                    if (approvedIndex !== -1) {
                        approvedEntities[approvedIndex] = record;
                        AppState.appData.approvedContractors = approvedEntities;
                    }
                }
            }

            // توليد كود تلقائي إذا لم يكن موجوداً (يتم تلقائياً بعد الاعتماد) - استخدام CON-xxx فقط
            if (!contractorCode && record.status === 'approved') {
                // توليد كود تلقائي CON-xxx
                const contractors = AppState.appData.contractors || [];
                const approvedEntities = AppState.appData.approvedContractors || [];
                let maxNumber = 0;

                // البحث في قائمة المقاولين
                contractors.forEach(contractor => {
                    if (contractor.code) {
                        const match = contractor.code.match(/CON-(\d+)/);
                        if (match) {
                            const num = parseInt(match[1], 10);
                            if (num > maxNumber) {
                                maxNumber = num;
                            }
                        }
                    }
                });

                // البحث في قائمة المعتمدين
                approvedEntities.forEach(entity => {
                    const code = entity.isoCode || entity.code;
                    if (code) {
                        // البحث عن كود CON-xxx
                        let match = code.match(/CON-(\d+)/);
                        if (match) {
                            const num = parseInt(match[1], 10);
                            if (num > maxNumber) {
                                maxNumber = num;
                            }
                        }
                        // البحث عن كود APP-xxx القديم (للتحويل)
                        match = code.match(/APP-(\d+)/);
                        if (match) {
                            const num = parseInt(match[1], 10);
                            if (num > maxNumber) {
                                maxNumber = num;
                            }
                        }
                    }
                });

                const newNumber = maxNumber + 1;
                contractorCode = `CON-${String(newNumber).padStart(3, '0')}`;
                // حفظ الكود في السجل وفي AppState
                record.code = contractorCode;
                record.isoCode = contractorCode;
                // تحديث السجل في AppState
                const approvedIndex = approvedEntities.findIndex(e => e.id === record.id);
                if (approvedIndex !== -1) {
                    approvedEntities[approvedIndex] = record;
                    AppState.appData.approvedContractors = approvedEntities;
                    // حفظ التغييرات
                    if (typeof GoogleIntegration !== 'undefined' && GoogleIntegration.sendRequest) {
                        GoogleIntegration.sendRequest({
                            action: 'updateApprovedContractor',
                            data: record
                        }).catch(err => Utils.safeWarn('خطأ في حفظ كود المقاول:', err));
                    }
                }
            }

            // حالة الاشتراطات للمقاولين العاديين
            let requirementsBadge = '';
            if (record.isRegularContractor && record.requirementsStatus) {
                const reqStatus = record.requirementsStatus;
                requirementsBadge = reqStatus.allMet
                    ? '<span class="badge badge-success ml-2">مستوفي</span>'
                    : `<span class="badge badge-warning ml-2">${reqStatus.completed}/${reqStatus.total}</span>`;
            }

            // تحديد الإجراءات بناءً على نوع السجل
            const isRegular = record.isRegularContractor;
            const contractorId = record.contractorId || record.id;

            // أزرار الإجراءات - دعم كلا النوعين
            const actionsHtml = isRegular ? `
                <div class="flex items-center gap-2">
                    <button class="btn-icon btn-icon-primary" title="عرض المقاول" onclick="Contractors.viewContractor('${contractorId}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-icon-info" title="تعديل المقاول" onclick="Contractors.editContractor('${contractorId}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-icon-success" title="إضافة تقييم" onclick="Contractors.showEvaluationForm('${contractorId}')">
                        <i class="fas fa-clipboard-check"></i>
                    </button>
                    <button class="btn-icon btn-icon-warning" title="سجل التقييمات" onclick="Contractors.openEvaluationHistory('${contractorId}')">
                        <i class="fas fa-clipboard-list"></i>
                    </button>
                    ${isAdmin ? `
                    <button class="btn-icon btn-icon-danger" title="حذف المقاول" onclick="Contractors.requestDeleteContractor('${contractorId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </div>
            ` : `
                <div class="flex items-center gap-2">
                    <button class="btn-icon btn-icon-info" title="عرض التفاصيل" onclick="Contractors.viewApprovedEntity('${record.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-icon-primary" title="تعديل" onclick="Contractors.showApprovedEntityForm('${record.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-icon-success" title="إضافة تقييم" onclick="Contractors.showEvaluationFormForApproved('${record.id}')">
                        <i class="fas fa-clipboard-check"></i>
                    </button>
                    <button class="btn-icon btn-icon-warning" title="سجل التقييمات" onclick="Contractors.openEvaluationHistoryForApproved('${record.id}')">
                        <i class="fas fa-clipboard-list"></i>
                    </button>
                    ${isAdmin ? `
                    <button class="btn-icon btn-icon-danger" title="حذف" onclick="Contractors.requestDeleteApprovedEntity('${record.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </div>
            `;

            return `
                <tr>
                    <td>
                        ${contractorCode ? `
                            <span class="font-mono text-sm font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block">
                                ${Utils.escapeHTML(contractorCode)}
                            </span>
                        ` : '<span class="text-gray-400">—</span>'}
                    </td>
                    <td>
                        <div class="font-semibold text-gray-800">${Utils.escapeHTML(record.companyName || '')}</div>
                        <div class="text-xs text-gray-500 mt-1">
                            ${Utils.escapeHTML(record.serviceType || '')}
                        </div>
                    </td>
                    <td>${typeLabel}</td>
                    <td>${Utils.escapeHTML(record.licenseNumber || record.contractNumber || '') || '—'}</td>
                    <td>${approvalDate}</td>
                    <td>${expiryDate} ${expiryBadge}</td>
                    <td>${Utils.escapeHTML(record.safetyReviewer || '') || '—'}</td>
                    <td>
                        <span class="badge ${statusBadgeClass}">
                            ${statusLabel}
                        </span>
                        ${requirementsBadge}
                    </td>
                    <td>${Utils.escapeHTML(record.notes || '') || '—'}</td>
                    <td>${actionsHtml}</td>
                </tr>
            `;
        }).join('');

        return `
            <div class="table-wrapper">
                <table class="data-table table-header-orange">
                    <thead>
                        <tr>
                            <th>كود المقاول</th>
                            <th>اسم الشركة / المقاول</th>
                            <th>نوع الجهة</th>
                            <th>السجل التجاري / الترخيص</th>
                            <th>تاريخ الاعتماد</th>
                            <th>تاريخ انتهاء الاعتماد</th>
                            <th>مسؤول السلامة للمراجعة</th>
                            <th>الحالة</th>
                            <th>ملاحظات</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;
    },

    refreshApprovedEntitiesList() {
        const container = document.getElementById('approved-contractors-container');
        if (!container) return;
        const isAdmin = Permissions.isAdmin();
        const approvedHTML = this.renderApprovedEntitiesTable(this.getFilteredApprovedEntities(), isAdmin);
        this.safeSetInnerHTML(container, approvedHTML);
    },

    handleApprovedFilterChange(field, value) {
        if (!Object.prototype.hasOwnProperty.call(this.approvedFilters, field)) return;
        this.approvedFilters[field] = value;
        this.refreshApprovedEntitiesList();
    },

    resetApprovedFilters() {
        this.approvedFilters = {
            search: '',
            status: '',
            type: '',
            startDate: '',
            endDate: ''
        };

        const searchInput = document.getElementById('approved-contractors-search');
        const statusSelect = document.getElementById('approved-contractors-status');
        const typeSelect = document.getElementById('approved-contractors-type');
        const startInput = document.getElementById('approved-contractors-start');
        const endInput = document.getElementById('approved-contractors-end');

        if (searchInput) searchInput.value = '';
        if (statusSelect) statusSelect.value = '';
        if (typeSelect) typeSelect.value = '';
        if (startInput) startInput.value = '';
        if (endInput) endInput.value = '';

        this.refreshApprovedEntitiesList();
    },

    getActiveApprovedEntities(options = {}) {
        this.ensureApprovedSetup();
        const includeExpired = options.includeExpired === true;
        const checkRequirements = options.checkRequirements === true; // ✅ إضافة خيار للتحقق من الاشتراطات
        
        let list = (AppState.appData.approvedContractors || []).filter((record) => this.isApprovalActive(record, includeExpired));

        // ✅ إصلاح: تصفية الاشتراطات اختيارية فقط
        // ✅ المنطق الصحيح: إذا كان المقاول في قائمة المعتمدين بحالة 'approved'، يجب أن يظهر
        // ✅ التحقق من الاشتراطات يكون فقط عند الطلب الصريح (checkRequirements = true)
        if (checkRequirements) {
            list = list.filter(record => {
                if (record.contractorId) {
                    // إذا كان هناك معرف مقاول، نتحقق من الاشتراطات
                    return this.checkAllRequirementsMet(record.contractorId);
                }
                // إذا لم يكن هناك معرف مقاول، نعتبره معتمداً (للتوافق مع البيانات القديمة)
                return true;
            });
        }

        // ✅ ترتيب حسب كود المقاول (CON-001, CON-002, ...)
        return list.sort((a, b) => Contractors.sortByContractorCode(a, b));
    },

    getApprovedOptions(includeExpired = false) {
        return this.getActiveApprovedEntities({ includeExpired }).map((record) => ({
            id: record.id,
            name: record.companyName,
            entityType: record.entityType,
            serviceType: record.serviceType,
            licenseNumber: record.licenseNumber,
            contractorId: record.contractorId || null // إضافة contractorId للربط
        }));
    },

    /**
     * الحصول على مقاول بالمعرف (من قائمة المقاولين أو المعتمدين)
     */
    getContractorById(contractorId) {
        if (!contractorId) return null;

        // البحث في قائمة المقاولين أولاً
        const contractors = AppState.appData.contractors || [];
        let contractor = contractors.find(c => c.id === contractorId);

        if (contractor) {
            return contractor;
        }

        // إذا لم يوجد، البحث في قائمة المعتمدين
        this.ensureApprovedSetup();
        const approvedContractors = AppState.appData.approvedContractors || [];
        const approved = approvedContractors.find(ac => ac.id === contractorId || ac.contractorId === contractorId);

        if (approved) {
            // محاولة العثور على المقاول المرتبط
            if (approved.contractorId) {
                contractor = contractors.find(c => c.id === approved.contractorId);
                if (contractor) {
                    return contractor;
                }
            }

            // إرجاع بيانات المعتمد كبديل
            return {
                id: approved.id,
                name: approved.companyName,
                serviceType: approved.serviceType,
                contractNumber: approved.licenseNumber,
                entityType: approved.entityType,
                approvedEntityId: approved.id
            };
        }

        return null;
    },

    /**
     * الحصول على مقاول بالاسم (من قائمة المقاولين أو المعتمدين)
     */
    getContractorByName(contractorName) {
        if (!contractorName) return null;

        const normalizedName = contractorName.trim().toLowerCase();

        // البحث في قائمة المقاولين أولاً
        const contractors = AppState.appData.contractors || [];
        let contractor = contractors.find(c =>
            (c.name || '').toLowerCase() === normalizedName ||
            (c.company || '').toLowerCase() === normalizedName ||
            (c.contractorName || '').toLowerCase() === normalizedName
        );

        if (contractor) {
            return contractor;
        }

        // إذا لم يوجد، البحث في قائمة المعتمدين
        this.ensureApprovedSetup();
        const approvedContractors = AppState.appData.approvedContractors || [];
        const approved = approvedContractors.find(ac =>
            (ac.companyName || '').toLowerCase() === normalizedName
        );

        if (approved) {
            // محاولة العثور على المقاول المرتبط
            if (approved.contractorId) {
                contractor = contractors.find(c => c.id === approved.contractorId);
                if (contractor) {
                    return contractor;
                }
            }

            // إرجاع بيانات المعتمد كبديل
            return {
                id: approved.id,
                name: approved.companyName,
                serviceType: approved.serviceType,
                contractNumber: approved.licenseNumber,
                entityType: approved.entityType,
                approvedEntityId: approved.id
            };
        }

        return null;
    },

    /**
     * الحصول على جميع المقاولين (من قائمة المقاولين والمعتمدين معاً)
     * هذه الدالة تضمن أن جميع الوحدات الأخرى يمكنها الوصول للمقاولين
     * ✅ تم التعديل: استخدام getActiveApprovedEntities() لضمان عرض المقاولين المعتمدين فقط
     */
    getAllContractorsForModules() {
        // ✅ حماية: التأكد من وجود AppState و appData قبل الوصول
        if (!AppState || !AppState.appData) {
            if (typeof window !== 'undefined') {
                window.AppState = window.AppState || {};
                window.AppState.appData = window.AppState.appData || {};
            } else {
                return []; // إرجاع مصفوفة فارغة إذا لم يكن AppState متاحاً
            }
        }
        
        const contractorMap = new Map(); // ✅ إزالة التكرار (محسّن)

        const normalizeText = (value) => (value ?? '').toString().trim();
        const normalizeCode = (value) => normalizeText(value).toUpperCase();
        const normalizeLicense = (value) => normalizeText(value);
        const normalizeName = (value) => normalizeText(value).toLowerCase();

        const computeIdentityKey = (record) => {
            // الأفضلية: code (CON-xxx) → licenseNumber → contractorId/id → name
            const code = normalizeCode(record.code || record.isoCode || record.contractorCode);
            if (/^CON-\d+$/i.test(code)) return `CODE:${code}`;

            const license = normalizeLicense(record.licenseNumber || record.contractNumber);
            if (license) return `LIC:${license}`;

            const contractorId = normalizeText(record.contractorId);
            if (contractorId) return `CID:${contractorId}`;

            const id = normalizeText(record.id);
            if (id) return `ID:${id}`;

            const name = normalizeName(record.name || record.companyName || record.company || record.contractorName);
            if (name) return `NAME:${name}`;

            return '';
        };

        const chooseBetter = (current, incoming) => {
            if (!current) return incoming;
            if (!incoming) return current;

            // ✅ إصلاح: دمج السجلات مع الحفاظ على approvedEntityId
            // الأهم: إذا أحدهما له approvedEntityId، يجب الحفاظ عليه
            const merged = { ...current, ...incoming };
            
            // ✅ حفظ approvedEntityId من أي من السجلين
            if (current.approvedEntityId || incoming.approvedEntityId) {
                merged.approvedEntityId = current.approvedEntityId || incoming.approvedEntityId;
            }

            const currentName = normalizeText(current.name);
            const incomingName = normalizeText(incoming.name);

            const currentHasRealName = currentName && currentName !== 'غير معروف';
            const incomingHasRealName = incomingName && incomingName !== 'غير معروف';
            
            // تفضيل الاسم الحقيقي
            if (incomingHasRealName && !currentHasRealName) {
                merged.name = incoming.name;
            } else if (currentHasRealName) {
                merged.name = current.name;
            }

            // تفضيل وجود code / license
            if (normalizeText(incoming.code)) merged.code = incoming.code;
            else if (normalizeText(current.code)) merged.code = current.code;
            
            if (normalizeText(incoming.licenseNumber)) merged.licenseNumber = incoming.licenseNumber;
            else if (normalizeText(current.licenseNumber)) merged.licenseNumber = current.licenseNumber;

            return merged;
        };

        const upsert = (record) => {
            const key = computeIdentityKey(record);
            if (!key) return;
            const existing = contractorMap.get(key);
            contractorMap.set(key, chooseBetter(existing, record));
        };

        // ✅ إضافة المقاولين من قائمة المقاولين (بدون اشتراط contractor.name فقط)
        const allContractors = AppState.appData.contractors || [];
        allContractors.forEach((contractor) => {
            if (!contractor) return;
            const id = contractor.id || contractor.contractorId || '';
            const name = contractor.name || contractor.company || contractor.contractorName || contractor.companyName || '';
            if (!id && !name) return;

            upsert({
                id: id,
                contractorId: contractor.contractorId || null,
                name: name || 'غير معروف',
                serviceType: contractor.serviceType || '',
                licenseNumber: contractor.licenseNumber || contractor.contractNumber || '',
                entityType: contractor.entityType || 'contractor',
                approvedEntityId: contractor.approvedEntityId || null,
                code: contractor.code || contractor.isoCode || ''
            });
        });

        // ✅ إضافة المقاولين من قائمة المعتمدين
        // ✅ مهم للنماذج: نُظهر جميع "approved" حتى لو منتهية الصلاحية (للتسجيل/التوثيق التاريخي)
        this.ensureApprovedSetup();
        const approvedForModules = this.getActiveApprovedEntities({ includeExpired: true });
        if (AppState?.debugMode && typeof Utils !== 'undefined' && Utils.safeLog) {
            Utils.safeLog(`✅ getAllContractorsForModules: approved=${approvedForModules.length}, contractorsSheet=${(AppState.appData.contractors || []).length}`);
        }

        approvedForModules.forEach((approved) => {
            if (!approved) return;
            const name = approved.companyName || approved.name || '';
            if (!name) return;

            upsert({
                id: approved.contractorId || approved.id,
                contractorId: approved.contractorId || null,
                name: name,
                serviceType: approved.serviceType || '',
                licenseNumber: approved.licenseNumber || '',
                entityType: approved.entityType || 'contractor',
                approvedEntityId: approved.id,
                code: approved.code || approved.isoCode || ''
            });
        });

        const finalList = Array.from(contractorMap.values())
            .filter((c) => c && normalizeText(c.name))
            .sort((a, b) => Contractors.sortByContractorCode(a, b));

        if (AppState?.debugMode && typeof Utils !== 'undefined' && Utils.safeLog) {
            Utils.safeLog(`✅ getAllContractorsForModules: إجمالي ${finalList.length} مقاول متاح للمديولات`);
        }

        return finalList;
    },

    /**
     * ✅ مصدر موحّد لاستخدام المقاولين في جميع النماذج
     * يعيد قائمة مرتّبة ومزالة التكرار للاستخدام في select/datalist.
     *
     * @param {object} options
     * @param {boolean} [options.includeSuppliers=false] - تضمين الموردين مع المقاولين
     * @returns {Array<{id:string,name:string,serviceType:string,licenseNumber:string,code:string,entityType:string,approvedEntityId:string|null}>}
     */
    getContractorOptionsForModules(options = {}) {
        const includeSuppliers = options.includeSuppliers === true;
        const approvedOnly = options.approvedOnly !== false; // ✅ افتراضي: المقاولين/الموردين المعتمدين فقط
        const list = this.getAllContractorsForModules() || [];

        return list
            .filter((c) => {
                if (!c) return false;
                if (approvedOnly && !c.approvedEntityId) return false;
                if (includeSuppliers) return true;
                return (c.entityType || 'contractor') === 'contractor';
            })
            .map((c) => ({
                id: (c.id || '').toString(),
                name: (c.name || c.companyName || '').toString().trim(),
                serviceType: (c.serviceType || '').toString().trim(),
                licenseNumber: (c.licenseNumber || c.contractNumber || '').toString().trim(),
                code: (c.code || c.isoCode || '').toString().trim(),
                entityType: (c.entityType || 'contractor').toString(),
                approvedEntityId: c.approvedEntityId || null
            }))
            .filter((c) => c.name);
    },

    /**
     * ✅ توحيد تعبئة select الخاص بالمقاولين في كل الموديولات
     *
     * @param {HTMLSelectElement} selectElement
     * @param {object} options
     * @param {string} [options.placeholder='-- اختر المقاول --']
     * @param {string} [options.selectedValue=''] - الاسم/القيمة المختارة مسبقاً
     * @param {string} [options.selectedContractorId=''] - المعرف المختار مسبقاً
     * @param {'name'|'id'} [options.valueMode='name'] - قيمة option: الاسم أو المعرف
     * @param {boolean} [options.showServiceType=true]
     * @param {boolean} [options.includeSuppliers=false]
     */
    populateContractorSelect(selectElement, options = {}) {
        if (!selectElement || selectElement.tagName !== 'SELECT') return;

        const placeholder = options.placeholder || '-- اختر المقاول --';
        const selectedValue = (options.selectedValue || '').toString();
        const selectedContractorId = (options.selectedContractorId || '').toString();
        const valueMode = options.valueMode === 'id' ? 'id' : 'name';
        const showServiceType = options.showServiceType !== false;
        const includeSuppliers = options.includeSuppliers === true;

        const contractors = this.getContractorOptionsForModules({ includeSuppliers });

        // مسح الخيارات الحالية
        selectElement.innerHTML = `<option value="">${Utils.escapeHTML(placeholder)}</option>`;

        const fragment = document.createDocumentFragment();
        contractors.forEach((contractor) => {
            const option = document.createElement('option');
            option.value = valueMode === 'id' ? (contractor.id || '') : (contractor.name || '');
            option.textContent = contractor.name;
            if (showServiceType && contractor.serviceType) {
                option.textContent += ` - ${contractor.serviceType}`;
            }
            option.dataset.contractorId = contractor.id || '';
            if (contractor.code) option.dataset.contractorCode = contractor.code;

            if (selectedContractorId && contractor.id === selectedContractorId) {
                option.selected = true;
            } else if (selectedValue) {
                // دعم الحفظ القديم بالاسم
                if (valueMode === 'name' && contractor.name === selectedValue) option.selected = true;
                if (valueMode === 'id' && contractor.id === selectedValue) option.selected = true;
            }

            fragment.appendChild(option);
        });
        selectElement.appendChild(fragment);
    },

    getApprovedEntityMap(includeExpired = false) {
        return new Map(this.getApprovedOptions(includeExpired).map((item) => [item.id, item]));
    },

    showApprovedEntityForm(id = null) {
        this.ensureApprovedSetup();
        const existing = id ? (AppState.appData.approvedContractors || []).find((item) => item.id === id) : null;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 720px;">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-check-circle ml-2"></i>
                        ${existing ? 'تعديل جهة معتمدة' : 'إضافة جهة معتمدة'}
                    </h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="approved-contractor-form" class="space-y-5">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">اسم الشركة / المقاول *</label>
                            <input type="text" id="approved-company-name" class="form-input" required value="${Utils.escapeHTML(existing?.companyName || '')}" placeholder="مثال: شركة السلامة المتقدمة">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">نوع الجهة *</label>
                            <select id="approved-entity-type" class="form-input" required>
                                <option value="contractor" ${existing?.entityType === 'supplier' ? '' : 'selected'}>مقاول</option>
                                <option value="supplier" ${existing?.entityType === 'supplier' ? 'selected' : ''}>مورد</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">النشاط / نوع الخدمة *</label>
                            <input type="text" id="approved-service-type" class="form-input" required value="${Utils.escapeHTML(existing?.serviceType || '')}" placeholder="مثال: أعمال الصيانة الكهربائية">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">رقم السجل التجاري / الترخيص</label>
                            <input type="text" id="approved-license-number" class="form-input" value="${Utils.escapeHTML(existing?.licenseNumber || '')}" placeholder="رقم السجل التجاري أو بيانات الترخيص">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">تاريخ الاعتماد *</label>
                            <input type="date" id="approved-approval-date" class="form-input" required value="${existing?.approvalDate ? new Date(existing.approvalDate).toISOString().slice(0, 10) : ''}">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">تاريخ انتهاء الاعتماد *</label>
                            <input type="date" id="approved-expiry-date" class="form-input" required value="${existing?.expiryDate ? new Date(existing.expiryDate).toISOString().slice(0, 10) : ''}">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">مسؤول السلامة للمراجعة</label>
                            <input type="text" id="approved-safety-reviewer" class="form-input" value="${Utils.escapeHTML(existing?.safetyReviewer || '')}" placeholder="اسم المسؤول عن مراجعة الاعتماد">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">حالة الاعتماد *</label>
                            <select id="approved-status" class="form-input" required>
                                <option value="approved" ${existing?.status === 'approved' ? 'selected' : ''}>معتمد</option>
                                <option value="under_review" ${existing?.status === 'under_review' || !existing ? 'selected' : ''}>تحت المراجعة</option>
                                <option value="rejected" ${existing?.status === 'rejected' ? 'selected' : ''}>مرفوض</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">ملاحظات</label>
                        <textarea id="approved-notes" class="form-input" rows="3" placeholder="ملاحظات إضافية">${Utils.escapeHTML(existing?.notes || '')}</textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save ml-2"></i>
                            ${existing ? 'تحديث' : 'حفظ'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const form = modal.querySelector('#approved-contractor-form');
        form?.addEventListener('submit', (event) => {
            event.preventDefault();
            
            // ✅ التحقق من أن modal لا يزال موجوداً في DOM
            if (!modal || !document.contains(modal)) {
                Utils.safeWarn('⚠️ submit approved-contractor-form: modal غير موجود أو تم حذفه');
                return;
            }
            
            // ✅ التحقق من أن form لا يزال موجوداً في DOM
            if (!form || !document.contains(form)) {
                Utils.safeWarn('⚠️ submit approved-contractor-form: form غير موجود أو تم حذفه');
                return;
            }
            
            try {
                // ✅ حفظ مراجع العناصر قبل أي عمليات async
                const companyInput = form.querySelector('#approved-company-name');
                const entityTypeSelect = form.querySelector('#approved-entity-type');
                const serviceInput = form.querySelector('#approved-service-type');
                const licenseInput = form.querySelector('#approved-license-number');
                const approvalDateInput = form.querySelector('#approved-approval-date');
                const expiryDateInput = form.querySelector('#approved-expiry-date');
                const safetyReviewerInput = form.querySelector('#approved-safety-reviewer');
                const statusSelect = form.querySelector('#approved-status');
                const notesTextarea = form.querySelector('#approved-notes');
                
                const companyName = companyInput?.value.trim() || '';
                const entityType = entityTypeSelect?.value || '';
                const serviceType = serviceInput?.value.trim() || '';
                const licenseNumber = licenseInput?.value.trim() || '';
                const approvalDate = approvalDateInput?.value || '';
                const expiryDate = expiryDateInput?.value || '';
                const safetyReviewer = safetyReviewerInput?.value.trim() || '';
                const status = statusSelect?.value || '';
                const notes = notesTextarea?.value.trim() || '';

                if (!companyName || !serviceType || !approvalDate || !expiryDate) {
                    Notification.warning('يرجى تعبئة الحقول الأساسية (الاسم، نوع الخدمة، تاريخ الاعتماد، تاريخ الانتهاء)');
                    return;
                }

                const approvalISO = new Date(approvalDate).toISOString();
                const expiryISO = new Date(expiryDate).toISOString();
                if (new Date(expiryISO) < new Date(approvalISO)) {
                    Notification.warning('تاريخ انتهاء الاعتماد يجب أن يكون بعد تاريخ الاعتماد');
                    return;
                }

                // التحقق من عدم وجود تكرار قبل الحفظ (للحالات الجديدة فقط)
                if (!existing) {
                    const approvedEntities = AppState.appData.approvedContractors || [];
                    const normalizedCompanyName = companyName.trim().toLowerCase();
                    const normalizedEntityType = this.normalizeApprovedEntityType(entityType);
                    const normalizedLicenseNumber = licenseNumber.trim();

                    // فحص التكرار بناءً على اسم الشركة + نوع الجهة
                    const duplicateByName = approvedEntities.find(item =>
                        item.companyName &&
                        item.companyName.trim().toLowerCase() === normalizedCompanyName &&
                        this.normalizeApprovedEntityType(item.entityType) === normalizedEntityType &&
                        (!existing || item.id !== existing.id)
                    );

                    if (duplicateByName) {
                        Notification.error(`يوجد بالفعل مقاول/مورد معتمد بنفس الاسم (${companyName}) ونوع الجهة. يرجى التحقق من القائمة.`);
                        return;
                    }

                    // فحص التكرار بناءً على السجل التجاري (إذا كان موجوداً)
                    if (normalizedLicenseNumber) {
                        const duplicateByLicense = approvedEntities.find(item =>
                            item.licenseNumber &&
                            item.licenseNumber.trim() === normalizedLicenseNumber &&
                            (!existing || item.id !== existing.id)
                        );

                        if (duplicateByLicense) {
                            Notification.error(`يوجد بالفعل مقاول/مورد معتمد بنفس السجل التجاري (${licenseNumber}). يرجى التحقق من القائمة.`);
                            return;
                        }
                    }
                }

                // توليد كود تلقائي للكيانات الجديدة - استخدام CON-xxx فقط
                let entityCode = existing?.isoCode || existing?.code || '';
                if (!entityCode) {
                    // البحث عن مقاول موجود أولاً لاستخدام كوده
                    const contractors = AppState.appData.contractors || [];
                    const existingContractor = contractors.find(c =>
                        c.name === companyName ||
                        (licenseNumber && c.contractNumber === licenseNumber)
                    );

                    if (existingContractor && existingContractor.code) {
                        // استخدام كود المقاول الموجود
                        entityCode = existingContractor.code;
                    } else {
                        // توليد كود جديد CON-xxx
                        const approvedEntities = AppState.appData.approvedContractors || [];
                        let maxNumber = 0;

                        // البحث في قائمة المقاولين
                        contractors.forEach(contractor => {
                            if (contractor.code) {
                                const match = contractor.code.match(/CON-(\d+)/);
                                if (match) {
                                    const num = parseInt(match[1], 10);
                                    if (num > maxNumber) {
                                        maxNumber = num;
                                    }
                                }
                            }
                        });

                        // البحث في قائمة المعتمدين
                        approvedEntities.forEach(entity => {
                            const code = entity.isoCode || entity.code;
                            if (code) {
                                let match = code.match(/CON-(\d+)/);
                                if (match) {
                                    const num = parseInt(match[1], 10);
                                    if (num > maxNumber) {
                                        maxNumber = num;
                                    }
                                }
                                // البحث عن كود APP-xxx القديم (للتحويل)
                                match = code.match(/APP-(\d+)/);
                                if (match) {
                                    const num = parseInt(match[1], 10);
                                    if (num > maxNumber) {
                                        maxNumber = num;
                                    }
                                }
                            }
                        });

                        const newNumber = maxNumber + 1;
                        entityCode = `CON-${String(newNumber).padStart(3, '0')}`;
                    }
                } else {
                    // التحقق من عدم تكرار الكود (للحالات الجديدة فقط)
                    if (!existing) {
                        const approvedEntities = AppState.appData.approvedContractors || [];
                        const duplicateByCode = approvedEntities.find(item => {
                            const itemCode = item.isoCode || item.code;
                            return itemCode && itemCode === entityCode && (!existing || item.id !== existing.id);
                        });

                        if (duplicateByCode) {
                            Notification.error(`يوجد بالفعل مقاول/مورد معتمد بنفس الكود (${entityCode}). سيتم توليد كود جديد تلقائياً.`);
                            // توليد كود جديد CON-xxx
                            const contractors = AppState.appData.contractors || [];
                            let maxNumber = 0;

                            // البحث في قائمة المقاولين
                            contractors.forEach(contractor => {
                                if (contractor.code) {
                                    const match = contractor.code.match(/CON-(\d+)/);
                                    if (match) {
                                        const num = parseInt(match[1], 10);
                                        if (num > maxNumber) {
                                            maxNumber = num;
                                        }
                                    }
                                }
                            });

                            // البحث في قائمة المعتمدين
                            approvedEntities.forEach(entity => {
                                const code = entity.isoCode || entity.code;
                                if (code) {
                                    let match = code.match(/CON-(\d+)/);
                                    if (match) {
                                        const num = parseInt(match[1], 10);
                                        if (num > maxNumber) {
                                            maxNumber = num;
                                        }
                                    }
                                    // البحث عن كود APP-xxx القديم (للتحويل)
                                    match = code.match(/APP-(\d+)/);
                                    if (match) {
                                        const num = parseInt(match[1], 10);
                                        if (num > maxNumber) {
                                            maxNumber = num;
                                        }
                                    }
                                }
                            });

                            const newNumber = maxNumber + 1;
                            entityCode = `CON-${String(newNumber).padStart(3, '0')}`;
                        }
                    }
                }

                const record = {
                    id: existing?.id || Utils.generateId('APPCON'),
                    companyName,
                    entityType: this.normalizeApprovedEntityType(entityType),
                    serviceType,
                    licenseNumber,
                    approvalDate: approvalISO,
                    expiryDate: expiryISO,
                    safetyReviewer,
                    status: this.normalizeApprovedStatus(status),
                    notes,
                    isoCode: entityCode,
                    code: entityCode,
                    createdAt: existing?.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                this.persistApprovedEntity(record, existing);
                Notification.success(existing ? 'تم تحديث بيانات الجهة المعتمدة' : 'تم حفظ الجهة المعتمدة بنجاح');

                // تحديث قائمة المعتمدين
                if (this.currentTab === 'approved') {
                    this.refreshApprovedEntitiesList();
                }

                // ✅ التحقق من أن modal لا يزال موجوداً في DOM قبل الإزالة
                if (modal && document.contains(modal)) {
                    try {
                modal.remove();
                    } catch (removeError) {
                        Utils.safeWarn('⚠️ خطأ في إزالة modal:', removeError);
                        // محاولة بديلة
                        const modalParent = modal.parentNode;
                        if (modalParent) {
                            try {
                                modalParent.removeChild(modal);
                            } catch (e) {
                                Utils.safeWarn('⚠️ فشلت المحاولة البديلة لإزالة modal:', e);
                            }
                        }
                    }
                }
            } catch (error) {
                Utils.safeError('خطأ في حفظ بيانات الجهات المعتمدة:', error);
                Notification.error('تعذر حفظ بيانات الجهة: ' + error.message);
            }
        });

        modal.addEventListener('click', (event) => {
            if (event.target === modal) modal.remove();
        });
    },

    viewApprovedEntity(id) {
        this.ensureApprovedSetup();
        const record = (AppState.appData.approvedContractors || []).find((item) => item.id === id);
        if (!record) {
            Notification.error('السجل المطلوب غير موجود');
            return;
        }

        const statusLabel = this.getApprovedStatusLabel(record.status);
        const typeLabel = this.getApprovedTypeLabel(record.entityType);
        const approvalDate = record.approvalDate ? Utils.formatDate(record.approvalDate) : '—';
        const expiryDate = record.expiryDate ? Utils.formatDate(record.expiryDate) : '—';
        const expiredBadge = this.isApprovalExpired(record) ? '<span class="badge badge-danger ml-2">منتهي</span>' : '';

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 680px;">
                <div class="modal-header">
                    <h2 class="modal-title"><i class="fas fa-id-card ml-2"></i>تفاصيل الجهة المعتمدة</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="text-sm font-semibold text-gray-600">كود المقاول</label>
                            <p class="text-gray-800">
                                ${(() => {
                const contractorCode = record.code || record.isoCode ||
                    record.contractorCode || record['كود المقاول'] ||
                    record['كود'] || record.codeNumber || '';
                return contractorCode ? `
                                        <span class="font-mono text-sm font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                            ${Utils.escapeHTML(contractorCode)}
                                        </span>
                                    ` : '<span class="text-gray-400">—</span>';
            })()}
                            </p>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">اسم الشركة / المقاول</label>
                            <p class="text-gray-800">${Utils.escapeHTML(record.companyName || '')}</p>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">نوع الجهة</label>
                            <p class="text-gray-800">${typeLabel}</p>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">النشاط / نوع الخدمة</label>
                            <p class="text-gray-800">${Utils.escapeHTML(record.serviceType || '')}</p>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">السجل التجاري / الترخيص</label>
                            <p class="text-gray-800">${Utils.escapeHTML(record.licenseNumber || '') || '—'}</p>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">تاريخ الاعتماد</label>
                            <p class="text-gray-800">${approvalDate}</p>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">تاريخ انتهاء الاعتماد</label>
                            <p class="text-gray-800">${expiryDate} ${expiredBadge}</p>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">مسؤول السلامة للمراجعة</label>
                            <p class="text-gray-800">${Utils.escapeHTML(record.safetyReviewer || '') || '—'}</p>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">حالة الاعتماد</label>
                            <span class="badge ${this.getApprovedStatusBadgeClass(record.status)} mt-1">${statusLabel}</span>
                        </div>
                    </div>
                    ${record.notes ? `
                        <div class="bg-gray-50 border border-gray-200 rounded p-3">
                            <label class="text-sm font-semibold text-gray-600 block mb-2">ملاحظات</label>
                            <p class="text-gray-700 whitespace-pre-line">${Utils.escapeHTML(record.notes)}</p>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إغلاق</button>
                    <button class="btn-success" onclick="Contractors.exportApprovedEntitiesPDF('${record.id}')">
                        <i class="fas fa-file-pdf ml-2"></i>
                        تصدير PDF
                    </button>
                    <button class="btn-primary" onclick="Contractors.showApprovedEntityForm('${record.id}'); this.closest('.modal-overlay').remove();">
                        <i class="fas fa-edit ml-2"></i>
                        تعديل
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) modal.remove();
        });
    },

    persistApprovedEntity(record, existing = null) {
        this.ensureApprovedSetup();

        // التأكد من قراءة البيانات الكاملة من AppState قبل التعديل
        let collection = AppState.appData.approvedContractors || [];

        // إذا كانت البيانات غير موجودة أو غير صحيحة، نحاول قراءتها من Google Sheets
        if (!Array.isArray(collection) || collection.length === 0) {
            // محاولة قراءة البيانات من Google Sheets إذا كانت متاحة
            try {
                if (typeof GoogleIntegration !== 'undefined' && GoogleIntegration.syncData) {
                    // سنقوم بمزامنة البيانات في الخلفية ولكن لا ننتظرها
                    GoogleIntegration.syncData({
                        silent: true,
                        showLoader: false,
                        notifyOnSuccess: false,
                        notifyOnError: false,
                        sheets: ['ApprovedContractors']
                    }).then(() => {
                        // بعد المزامنة، نتحقق من البيانات مرة أخرى
                        collection = AppState.appData.approvedContractors || [];
                        if (Array.isArray(collection) && collection.length > 0) {
                            // إعادة محاولة الحفظ بعد المزامنة
                            this.persistApprovedEntity(record, existing);
                        }
                    }).catch(() => {
                        // في حالة فشل المزامنة، نتابع بالبيانات الحالية
                    });
                }
            } catch (error) {
                Utils.safeWarn('فشل محاولة مزامنة البيانات:', error);
            }
        }

        // إنشاء نسخة من المصفوفة لتجنب التعديل المباشر
        collection = [...collection];

        if (existing) {
            const index = collection.findIndex((item) => item.id === existing.id);
            if (index !== -1) {
                collection[index] = { ...record };
            } else {
                collection.push({ ...record });
            }
        } else {
            // توليد كود تلقائي للكيانات الجديدة إذا لم يكن موجوداً
            if (!record.isoCode && !record.code) {
                let maxNumber = 0;
                collection.forEach(entity => {
                    const code = entity.isoCode || entity.code;
                    if (code) {
                        const match = code.match(/APP-(\d+)/);
                        if (match) {
                            const num = parseInt(match[1], 10);
                            if (num > maxNumber) {
                                maxNumber = num;
                            }
                        }
                    }
                });

                const newNumber = maxNumber + 1;
                record.isoCode = `APP-${String(newNumber).padStart(3, '0')}`;
                record.code = record.isoCode;
            }

            // التحقق من عدم وجود سجل مكرر قبل الإضافة
            // فحص التكرار بناءً على: المعرف، الكود، اسم الشركة + نوع الجهة، السجل التجاري
            const duplicateIndex = collection.findIndex((item) => {
                // فحص التكرار بناءً على المعرف
                if (item.id === record.id) return true;

                // فحص التكرار بناءً على الكود (إذا كان موجوداً)
                if (record.isoCode || record.code) {
                    const recordCode = record.isoCode || record.code;
                    const itemCode = item.isoCode || item.code;
                    if (recordCode && itemCode && recordCode === itemCode) return true;
                }

                // فحص التكرار بناءً على اسم الشركة + نوع الجهة
                if (record.companyName && item.companyName &&
                    record.companyName.trim().toLowerCase() === item.companyName.trim().toLowerCase() &&
                    record.entityType === item.entityType) {
                    return true;
                }

                // فحص التكرار بناءً على السجل التجاري (إذا كان موجوداً)
                if (record.licenseNumber && item.licenseNumber &&
                    record.licenseNumber.trim() === item.licenseNumber.trim()) {
                    return true;
                }

                return false;
            });

            if (duplicateIndex !== -1) {
                // تحديث السجل الموجود بدلاً من إضافة جديد
                const existing = collection[duplicateIndex];
                // الحفاظ على المعرف الأصلي وتاريخ الإنشاء
                collection[duplicateIndex] = {
                    ...record,
                    id: existing.id,
                    createdAt: existing.createdAt || record.createdAt
                };
                Utils.safeWarn(`⚠️ تم اكتشاف تكرار للمقاول/المورد: ${record.companyName} - تم التحديث بدلاً من الإضافة`);
            } else {
                collection.push({ ...record });
            }
        }

        // حفظ البيانات المحدثة
        AppState.appData.approvedContractors = collection;

        // حفظ البيانات باستخدام window.DataManager
        if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
            window.DataManager.save();
        } else {
            Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
        }

        try {
            // التأكد من إرسال البيانات الكاملة وليس فقط السجل الجديد
            GoogleIntegration.autoSave?.('ApprovedContractors', AppState.appData.approvedContractors).catch(error => {
                Utils.safeWarn('فشل الحفظ التلقائي لجهات الاعتماد:', error);
            });
        } catch (error) {
            Utils.safeWarn('فشل الحفظ التلقائي لجهات الاعتماد:', error);
        }

        this.refreshApprovedEntitiesList();
    },

    async requestDeleteApprovedEntity(id) {
        if (!id) return;

        // التحقق من الصلاحيات - فقط المدير يمكنه حذف مباشرة
        if (Permissions.isAdmin()) {
            if (!confirm('هل أنت متأكد من حذف هذه الجهة من قائمة الاعتماد؟')) {
                return;
            }
            // المدير يمكنه الحذف مباشرة
            return this.deleteApprovedEntity(id);
        }

        // المستخدمون العاديون يرسلون طلب حذف
        this.ensureApprovedSetup();
        const collection = AppState.appData.approvedContractors || [];
        const record = collection.find((item) => item.id === id);
        if (!record) {
            Notification.error('السجل المطلوب غير موجود');
            return;
        }

        if (!confirm('سيتم إرسال طلب حذف هذه الجهة إلى مدير النظام للموافقة. هل تريد المتابعة؟')) {
            return;
        }

        const currentUser = AppState.currentUser;
        const deletionRequest = {
            id: Utils.generateId('DELRQ'),
            requestType: 'approved_entity',
            entityId: id,
            entityName: record.companyName || record.name || '',
            entityType: record.entityType || 'contractor',
            reason: prompt('يرجى إدخال سبب طلب الحذف:') || 'طلب حذف من المستخدم',
            createdBy: currentUser?.id || '',
            createdByName: currentUser?.name || '',
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        // إرسال طلب الحذف
        await this.submitDeletionRequest(deletionRequest);
        this.refreshApprovalRequestsSection();
    },

    async deleteApprovedEntity(id) {
        if (!id) return;
        if (!Permissions.isAdmin()) {
            Notification.error('ليس لديك صلاحية للحذف المباشر');
            return;
        }

        if (!confirm('هل أنت متأكد من حذف هذه الجهة المعتمدة؟ سيتم حذفها من قائمة المعتمدين والمقاولين.')) {
            return;
        }

        // Optimistic UI update
        this.ensureApprovedSetup();
        const collection = AppState.appData.approvedContractors || [];
        const index = collection.findIndex((item) => item.id === id);

        if (index === -1) {
            Notification.error('السجل المطلوب غير موجود');
            return;
        }

        const record = collection[index];
        collection.splice(index, 1);
        AppState.appData.approvedContractors = collection;

        if (record.contractorId) {
            const contractors = AppState.appData.contractors || [];
            const cIndex = contractors.findIndex(c => c.id === record.contractorId);
            if (cIndex !== -1) {
                contractors.splice(cIndex, 1);
                AppState.appData.contractors = contractors;
            }
        }

        try {
            Loading.show();
            // Call Backend
            const result = await GoogleIntegration.sendToAppsScript('deleteApprovedContractor', { approvedContractorId: id });

            if (result.success) {
                Notification.success('تم حذف الجهة المعتمدة بنجاح');
                // DataManager Update
                if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                    window.DataManager.save();
                }
                this.load(true); // ✅ Refresh full state to sync - preserve current tab
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            Loading.hide();
            // Utils.safeError('فشل حذف الجهة المعتمدة:', error); // safeError might not exist or be needed
            console.error('فشل حذف الجهة المعتمدة:', error);
            Notification.error('فشل حذف الجهة المعتمدة: ' + error.message);
            this.load(true); // ✅ Rollback - preserve current tab
        } finally {
            Loading.hide();
            this.refreshApprovedEntitiesList();
        }
    },

    exportApprovedEntitiesExcel() {
        this.ensureApprovedSetup();
        const records = this.getFilteredApprovedEntities();
        if (!records.length) {
            Notification.warning('لا توجد بيانات لتصديرها');
            return;
        }

        if (typeof XLSX === 'undefined') {
            Notification.error('مكتبة SheetJS غير محمّلة. يرجى تحديث الصفحة أو تحميل المكتبة.');
            return;
        }

        const data = records.map((record) => ({
            'اسم الشركة / المقاول': record.companyName || '',
            'نوع الجهة': this.getApprovedTypeLabel(record.entityType),
            'النشاط / نوع الخدمة': record.serviceType || '',
            'السجل التجاري / الترخيص': record.licenseNumber || '',
            'تاريخ الاعتماد': record.approvalDate ? Utils.formatDate(record.approvalDate) : '',
            'تاريخ انتهاء الاعتماد': record.expiryDate ? Utils.formatDate(record.expiryDate) : '',
            'مسؤول السلامة': record.safetyReviewer || '',
            'الحالة': this.getApprovedStatusLabel(record.status),
            'ملاحظات': record.notes || ''
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = [
            { wch: 30 },
            { wch: 16 },
            { wch: 28 },
            { wch: 24 },
            { wch: 16 },
            { wch: 18 },
            { wch: 22 },
            { wch: 16 },
            { wch: 40 }
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'الجهات المعتمدة');
        const fileName = `الجهات_المعتمدة_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        Notification.success('تم تصدير قائمة الجهات المعتمدة بنجاح');
    },

    exportApprovedEntitiesPDF(id = null) {
        this.ensureApprovedSetup();
        const records = id
            ? (AppState.appData.approvedContractors || []).filter((item) => item.id === id)
            : this.getFilteredApprovedEntities();

        if (!records.length) {
            Notification.warning('لا توجد بيانات لتصديرها');
            return;
        }

        try {
            Loading.show();
            const rowsHtml = records.map((record, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${Utils.escapeHTML(record.companyName || '')}</td>
                    <td>${this.getApprovedTypeLabel(record.entityType)}</td>
                    <td>${Utils.escapeHTML(record.serviceType || '')}</td>
                    <td>${Utils.escapeHTML(record.licenseNumber || '')}</td>
                    <td>${record.approvalDate ? Utils.formatDate(record.approvalDate) : '-'}</td>
                    <td>${record.expiryDate ? Utils.formatDate(record.expiryDate) : '-'}</td>
                    <td>${Utils.escapeHTML(record.safetyReviewer || '')}</td>
                    <td>${this.getApprovedStatusLabel(record.status)}</td>
                    <td>${Utils.escapeHTML(record.notes || '')}</td>
                </tr>
            `).join('');

            const content = `
                <div class="section-title">بيانات الجهات المعتمدة</div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>الجهة</th>
                            <th>النوع</th>
                            <th>النشاط / الخدمة</th>
                            <th>السجل التجاري / الترخيص</th>
                            <th>تاريخ الاعتماد</th>
                            <th>تاريخ الانتهاء</th>
                            <th>مسؤول السلامة</th>
                            <th>الحالة</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            `;

            const formCode = id
                ? (records[0]?.isoCode || `APPCON-${records[0]?.id?.substring(0, 6) || ''}`)
                : `APPCON-LIST-${new Date().toISOString().slice(0, 10)}`;

            const htmlContent = typeof FormHeader !== 'undefined' && typeof FormHeader.generatePDFHTML === 'function'
                ? FormHeader.generatePDFHTML(
                    formCode,
                    id ? 'نموذج جهة معتمدة' : 'قائمة الجهات المعتمدة',
                    content,
                    false,
                    true,
                    { version: '1.0', qrData: id ? `approved-contractor:${id}` : 'approved-contractors:list' },
                    records.reduce((earliest, record) => {
                        const created = new Date(record.createdAt || record.approvalDate || new Date());
                        if (!earliest || created < earliest) return created;
                        return earliest;
                    }, null) || new Date(),
                    new Date()
                )
                : content;

            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const printWindow = window.open(url, '_blank');

            if (printWindow) {
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.print();
                        Loading.hide();
                    }, 500);
                };
            } else {
                Loading.hide();
                Notification.error('يرجى السماح بنوافذ منبثقة للطباعة');
            }
        } catch (error) {
            Loading.hide();
            Utils.safeError('خطأ في تصدير الجهات المعتمدة:', error);
            Notification.error('فشل في تصدير قائمة الجهات المعتمدة: ' + error.message);
        }
    },

    async renderEvaluationsSection() {
        const approvedOptions = this.getApprovedOptions(true);
        const legacyContractors = AppState.appData.contractors || [];
        const filterOptions = approvedOptions.length > 0 ? approvedOptions : legacyContractors.map(contractor => ({
            id: contractor.id,
            name: contractor.name || contractor.company || contractor.contractorName || ''
        }));
        const options = filterOptions.length
            ? filterOptions.map(contractor => `<option value="${contractor.id}">${Utils.escapeHTML(contractor.name || '')}</option>`).join('')
            : '';
        const hasContractors = filterOptions.length > 0;
        const evaluationsTable = this.renderEvaluationsTable(this.currentEvaluationFilter || '');
        const isAdmin = (AppState.currentUser && AppState.currentUser.role === 'admin');

        return `
            <div class="content-card" id="contractor-evaluation-card">
                <div class="card-header">
                    <div class="flex items-center justify-between flex-wrap gap-4">
                        <h2 class="card-title flex items-center gap-2">
                            <i class="fas fa-clipboard-check ml-2"></i>
                            تقييم وتأهيل المقاولين
                        </h2>
                        <div class="flex items-center gap-3 flex-wrap">
                            <select id="contractor-evaluation-filter" class="form-input" style="min-width: 220px;">
                                <option value="">جميع المقاولين</option>
                                ${options}
                            </select>
                            <button id="add-contractor-evaluation-btn" class="btn-primary" ${hasContractors ? '' : 'disabled'}>
                                <i class="fas fa-plus ml-2"></i>
                                إضافة تقييم
                            </button>
                            ${isAdmin ? `
                                <button id="contractor-evaluation-settings-btn" class="btn-secondary">
                                    <i class="fas fa-sliders-h ml-2"></i>
                                    تعديل بنود التقييم
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div id="contractor-evaluations-container">
                        ${evaluationsTable}
                    </div>
                </div>
            </div>
        `;
    },

    renderEvaluationsTable(contractorId = '') {
        // ✅ إصلاح: تجميع البنود من صفوف منفصلة
        const allRecords = AppState.appData.contractorEvaluations || [];
        
        // تجميع البنود حسب evaluationId
        const evaluationsMap = new Map();
        
        allRecords.forEach(record => {
            // ✅ إصلاح: التجميع حسب evaluationId عند وجوده لضمان تجميع كل صفوف التقييم الواحد
            const evalId = record.evaluationId || record.id;
            if (!evalId) return;
            
            // تصفية حسب contractorId إذا كان محدداً
            if (contractorId && record.contractorId !== contractorId) return;
            
            if (!evaluationsMap.has(evalId)) {
                // ✅ إصلاح: تحويل finalScore إلى رقم إذا كان نصاً
                let finalScore = record.finalScore;
                if (typeof finalScore === 'string' && finalScore !== '') {
                    finalScore = parseFloat(finalScore);
                    if (isNaN(finalScore)) finalScore = null;
                } else if (typeof finalScore !== 'number') {
                    finalScore = null;
                }
                
                // ✅ إصلاح: تحويل compliantCount و totalItems إلى أرقام
                let compliantCount = record.compliantCount;
                if (typeof compliantCount === 'string') compliantCount = parseInt(compliantCount) || 0;
                let totalItems = record.totalItems;
                if (typeof totalItems === 'string') totalItems = parseInt(totalItems) || 0;
                
                // ✅ إصلاح: إذا لم يوجد finalScore ولكن يوجد compliantCount و totalItems، احسب النسبة
                if (finalScore === null && compliantCount > 0 && totalItems > 0) {
                    finalScore = Math.round((compliantCount / totalItems) * 100);
                }
                
                // إنشاء سجل التقييم الأساسي
                evaluationsMap.set(evalId, {
                    id: evalId,
                    contractorId: record.contractorId,
                    contractorName: record.contractorName,
                    evaluationDate: record.evaluationDate,
                    evaluatorName: record.evaluatorName,
                    projectName: record.projectName,
                    location: record.location,
                    generalNotes: record.generalNotes,
                    compliantCount: compliantCount ?? 0,
                    totalItems: totalItems ?? 0,
                    finalScore: finalScore,
                    finalRating: record.finalRating || '',
                    isoCode: record.isoCode,
                    createdAt: record.createdAt,
                    updatedAt: record.updatedAt,
                    createdBy: record.createdBy,
                    updatedBy: record.updatedBy,
                    items: []
                });
            }
            
            // إضافة البند إلى المصفوفة
            const evaluation = evaluationsMap.get(evalId);
            if (record.criteriaId || record.title) {
                evaluation.items.push({
                    criteriaId: record.criteriaId,
                    title: record.title,
                    status: record.status,
                    notes: record.notes
                });
            }
        });
        
        const records = Array.from(evaluationsMap.values()).sort((a, b) => {
            const dateA = new Date(a.evaluationDate || a.createdAt || 0);
            const dateB = new Date(b.evaluationDate || b.createdAt || 0);
            return dateB - dateA;
        });

        if (records.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-clipboard-check text-4xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500">لا توجد تقييمات مسجلة${contractorId ? ' لهذا المقاول' : ''}</p>
                </div>
            `;
        }

        return `
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>المقاول</th>
                            <th>تاريخ التقييم</th>
                            <th>المقيّم</th>
                            <th>الموقع / المشروع</th>
                            <th>عدد البنود المطابقة</th>
                            <th>إجمالي البنود</th>
                            <th>النسبة</th>
                            <th>التقييم النهائي</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(record => `
                            <tr>
                                <td>${Utils.escapeHTML(record.contractorName || '')}</td>
                                <td>${record.evaluationDate ? Utils.formatDate(record.evaluationDate) : '-'}</td>
                                <td>${Utils.escapeHTML(record.evaluatorName || '')}</td>
                                <td>${Utils.escapeHTML(record.projectName || record.location || '')}</td>
                                <td>${record.compliantCount ?? 0}</td>
                                <td>${record.totalItems ?? (Array.isArray(record.items) ? record.items.length : (record.items ? Object.keys(record.items).length : 0))}</td>
                                <td>${typeof record.finalScore === 'number' ? record.finalScore.toFixed(0) + '%' : '-'}</td>
                                <td>
                                    <span class="badge ${record.finalScore >= 90 ? 'badge-success' : record.finalScore >= 75 ? 'badge-info' : record.finalScore >= 60 ? 'badge-warning' : 'badge-danger'}">
                                        ${Utils.escapeHTML(record.finalRating || '')}
                                    </span>
                                </td>
                                <td>
                                    <div class="flex items-center gap-2">
                                        <button class="btn-icon btn-icon-info" title="عرض التفاصيل" onclick="Contractors.viewEvaluation('${record.id}')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        ${Permissions.isAdmin() ? `
                                        <button class="btn-icon btn-icon-primary" title="تعديل التقييم" onclick="Contractors.showEvaluationForm('${record.contractorId}', ${JSON.stringify(record).replace(/"/g, '&quot;')})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-icon btn-icon-danger" title="حذف التقييم" onclick="Contractors.requestDeleteEvaluation('${record.id}')">
                                            <i class="fas fa-trash"></i>
                                            </button>
                                        ` : ''}
                                        <button class="btn-icon btn-icon-success" title="تصدير PDF" onclick="Contractors.exportEvaluationPDF('${record.id}')">
                                            <i class="fas fa-file-pdf"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async renderRequirementsManagementSection() {
        const isAdmin = (AppState.currentUser && AppState.currentUser.role === 'admin');
        if (!isAdmin) {
            return `
                <div class="content-card">
                    <div class="card-body">
                        <div class="empty-state">
                            <i class="fas fa-lock text-4xl text-gray-300 mb-3"></i>
                            <p class="text-gray-500">هذه الصفحة متاحة للمدير فقط</p>
                        </div>
                    </div>
                </div>
            `;
        }

        this.ensureRequirementsSetup();
        const requirements = this.getApprovalRequirements();
        
        // تجميع الاشتراطات حسب الفئة
        const requirementsByCategory = {};
        requirements.forEach(req => {
            const category = req.category || 'other';
            if (!requirementsByCategory[category]) {
                requirementsByCategory[category] = [];
            }
            requirementsByCategory[category].push(req);
        });

        // إحصائيات سريعة
        const stats = {
            total: requirements.length,
            required: requirements.filter(r => r.required).length,
            withExpiry: requirements.filter(r => r.hasExpiry).length,
            critical: requirements.filter(r => r.priority === 'critical').length
        };

        return `
            <div class="content-card">
                <div class="card-header">
                    <div class="flex items-center justify-between">
                        <h2 class="card-title">
                            <i class="fas fa-cog ml-2"></i>
                            إدارة اشتراطات اعتماد المقاولين
                        </h2>
                        <div class="flex items-center gap-3">
                            <button onclick="Contractors.exportRequirementsTemplate()" class="btn-secondary btn-sm">
                                <i class="fas fa-download ml-2"></i>
                                تصدير قالب
                            </button>
                            <button onclick="Contractors.importRequirementsTemplate()" class="btn-secondary btn-sm">
                                <i class="fas fa-upload ml-2"></i>
                                استيراد قالب
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <!-- إحصائيات سريعة -->
                    <div class="grid grid-cols-4 gap-4 mb-6">
                        <div class="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm text-blue-600 mb-1">إجمالي الاشتراطات</p>
                                    <p class="text-2xl font-bold text-blue-800">${stats.total}</p>
                                </div>
                                <i class="fas fa-list text-3xl text-blue-400"></i>
                            </div>
                        </div>
                        <div class="p-4 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm text-red-600 mb-1">اشتراطات مطلوبة</p>
                                    <p class="text-2xl font-bold text-red-800">${stats.required}</p>
                                </div>
                                <i class="fas fa-exclamation-circle text-3xl text-red-400"></i>
                            </div>
                        </div>
                        <div class="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm text-orange-600 mb-1">مع تاريخ انتهاء</p>
                                    <p class="text-2xl font-bold text-orange-800">${stats.withExpiry}</p>
                                </div>
                                <i class="fas fa-calendar-times text-3xl text-orange-400"></i>
                            </div>
                        </div>
                        <div class="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm text-purple-600 mb-1">أولوية حرجة</p>
                                    <p class="text-2xl font-bold text-purple-800">${stats.critical}</p>
                                </div>
                                <i class="fas fa-exclamation-triangle text-3xl text-purple-400"></i>
                            </div>
                        </div>
                    </div>

                    <div class="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <div class="flex items-start gap-3">
                            <i class="fas fa-info-circle text-blue-600 text-xl mt-1"></i>
                            <div class="flex-1">
                                <p class="text-sm font-semibold text-blue-900 mb-1">نظام إدارة اشتراطات متقدم</p>
                                <p class="text-sm text-blue-700">
                                    يمكنك إدارة الاشتراطات بشكل متطور مع دعم التصنيفات، الأولويات، وتواريخ الانتهاء. 
                                    استخدم السحب والإفلات لإعادة ترتيب الاشتراطات.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- فلتر حسب الفئة -->
                    <div class="mb-4 flex items-center gap-3 flex-wrap">
                        <label class="text-sm font-semibold text-gray-700">فلتر حسب الفئة:</label>
                        <button onclick="Contractors.filterRequirementsByCategory('all')" 
                            class="requirement-category-filter active px-4 py-2 rounded-lg text-sm font-medium transition-all"
                            data-category="all">
                            <i class="fas fa-th ml-2"></i>
                            الكل
                        </button>
                        ${Object.values(REQUIREMENT_CATEGORIES).map(cat => `
                            <button onclick="Contractors.filterRequirementsByCategory('${cat.id}')" 
                                class="requirement-category-filter px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                data-category="${cat.id}"
                                style="border: 2px solid ${cat.color}; color: ${cat.color};">
                                <i class="fas ${cat.icon} ml-2"></i>
                                ${cat.label}
                            </button>
                        `).join('')}
                    </div>
                    
                    <!-- قائمة الاشتراطات مع التصنيفات -->
                    <div id="requirements-list" class="space-y-4 mb-4">
                        ${Object.keys(requirementsByCategory).map(categoryId => {
                            const category = REQUIREMENT_CATEGORIES[categoryId] || REQUIREMENT_CATEGORIES.other;
                            const categoryReqs = requirementsByCategory[categoryId];
                            
                            return `
                                <div class="requirement-category-group" data-category="${categoryId}">
                                    <div class="flex items-center gap-3 mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div class="w-1 h-8 rounded" style="background: ${category.color};"></div>
                                        <i class="fas ${category.icon} text-xl" style="color: ${category.color};"></i>
                                        <h3 class="text-lg font-bold text-gray-800">${category.label}</h3>
                                        <span class="badge badge-info">${categoryReqs.length} اشتراط</span>
                                    </div>
                                    <div class="space-y-3 ml-6">
                                        ${categoryReqs.map((req, index) => {
                                            const priority = REQUIREMENT_PRIORITIES[req.priority] || REQUIREMENT_PRIORITIES.medium;
                                            return `
                                                <div class="requirement-item p-4 border-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-all cursor-move" 
                                                     data-requirement-id="${req.id}"
                                                     data-category="${categoryId}"
                                                     draggable="true"
                                                     style="border-color: ${priority.color}20;">
                                                    <div class="flex items-start gap-4">
                                                        <!-- Handle for drag -->
                                                        <div class="drag-handle cursor-grab active:cursor-grabbing pt-1">
                                                            <i class="fas fa-grip-vertical text-gray-400 text-xl"></i>
                                                        </div>
                                                        
                                                        <div class="flex-1">
                                                            <div class="flex items-center gap-3 mb-3">
                                                                <span class="px-2 py-1 text-xs font-bold rounded" style="background: ${priority.color}20; color: ${priority.color};">
                                                                    ${priority.label}
                                                                </span>
                                                                <span class="text-sm font-semibold text-gray-500">#${req.order}</span>
                                                                ${req.required ? '<span class="badge badge-danger text-xs">مطلوب</span>' : '<span class="badge badge-secondary text-xs">اختياري</span>'}
                                                                ${req.hasExpiry ? `<span class="badge badge-warning text-xs"><i class="fas fa-calendar ml-1"></i> ${req.expiryMonths} شهر</span>` : ''}
                                                            </div>
                                                            
                                                            <input type="text" 
                                                                class="form-input mb-3 font-semibold text-gray-800" 
                                                                value="${Utils.escapeHTML(req.label)}"
                                                                data-field="label"
                                                                placeholder="اسم الاشتراط">
                                                            
                                                            ${req.description ? `
                                                                <textarea class="form-input mb-3 text-sm" 
                                                                    data-field="description"
                                                                    placeholder="وصف الاشتراط"
                                                                    rows="2">${Utils.escapeHTML(req.description || '')}</textarea>
                                                            ` : `
                                                                <textarea class="form-input mb-3 text-sm" 
                                                                    data-field="description"
                                                                    placeholder="وصف الاشتراط (اختياري)"
                                                                    rows="2"></textarea>
                                                            `}
                                                            
                                                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                <select class="form-input text-sm" data-field="type">
                                                                    <option value="document" ${req.type === 'document' ? 'selected' : ''}>📄 مستند</option>
                                                                    <option value="checkbox" ${req.type === 'checkbox' ? 'selected' : ''}>☑️ مربع اختيار</option>
                                                                    <option value="text" ${req.type === 'text' ? 'selected' : ''}>📝 نص</option>
                                                                </select>
                                                                
                                                                <select class="form-input text-sm" data-field="category">
                                                                    ${Object.values(REQUIREMENT_CATEGORIES).map(cat => `
                                                                        <option value="${cat.id}" ${req.category === cat.id ? 'selected' : ''}>${cat.label}</option>
                                                                    `).join('')}
                                                                </select>
                                                                
                                                                <select class="form-input text-sm" data-field="priority">
                                                                    ${Object.values(REQUIREMENT_PRIORITIES).map(pri => `
                                                                        <option value="${pri.id}" ${req.priority === pri.id ? 'selected' : ''}>${pri.label}</option>
                                                                    `).join('')}
                                                                </select>
                                                                
                                                                <label class="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                                                                    <input type="checkbox" 
                                                                        data-field="required" 
                                                                        ${req.required ? 'checked' : ''}
                                                                        class="cursor-pointer">
                                                                    <span class="text-sm text-gray-700">مطلوب</span>
                                                                </label>
                                                            </div>
                                                            
                                                            <div class="grid grid-cols-2 gap-3 mt-3">
                                                                <label class="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                                                                    <input type="checkbox" 
                                                                        data-field="hasExpiry" 
                                                                        ${req.hasExpiry ? 'checked' : ''}
                                                                        class="cursor-pointer"
                                                                        onchange="Contractors.toggleExpiryFields(this)">
                                                                    <span class="text-sm text-gray-700">له تاريخ انتهاء</span>
                                                                </label>
                                                                ${req.hasExpiry ? `
                                                                    <div class="expiry-fields">
                                                                        <input type="number" 
                                                                            class="form-input text-sm" 
                                                                            value="${req.expiryMonths || 12}"
                                                                            data-field="expiryMonths"
                                                                            placeholder="عدد الأشهر"
                                                                            min="1" max="60">
                                                                    </div>
                                                                ` : `
                                                                    <div class="expiry-fields" style="display: none;">
                                                                        <input type="number" 
                                                                            class="form-input text-sm" 
                                                                            value="12"
                                                                            data-field="expiryMonths"
                                                                            placeholder="عدد الأشهر"
                                                                            min="1" max="60">
                                                                    </div>
                                                                `}
                                                            </div>
                                                        </div>
                                                        
                                                        <div class="flex flex-col gap-2">
                                                            <button onclick="Contractors.moveRequirementUp('${req.id}')" 
                                                                class="btn-icon btn-icon-info" 
                                                                title="نقل لأعلى"
                                                                ${index === 0 ? 'disabled' : ''}>
                                                                <i class="fas fa-arrow-up"></i>
                                                            </button>
                                                            <button onclick="Contractors.moveRequirementDown('${req.id}')" 
                                                                class="btn-icon btn-icon-info" 
                                                                title="نقل لأسفل"
                                                                ${index === categoryReqs.length - 1 ? 'disabled' : ''}>
                                                                <i class="fas fa-arrow-down"></i>
                                                            </button>
                                                            <button onclick="Contractors.deleteRequirement('${req.id}')" 
                                                                class="btn-icon btn-icon-danger" 
                                                                title="حذف">
                                                                <i class="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <div class="flex items-center justify-between pt-4 border-t">
                        <div class="flex items-center gap-3">
                            <button onclick="Contractors.addNewRequirement()" class="btn-secondary">
                                <i class="fas fa-plus ml-2"></i>
                                إضافة اشتراط جديد
                            </button>
                            <button onclick="Contractors.bulkEditRequirements()" class="btn-secondary">
                                <i class="fas fa-edit ml-2"></i>
                                تعديل جماعي
                            </button>
                        </div>
                        <button onclick="Contractors.saveRequirements()" class="btn-primary">
                            <i class="fas fa-save ml-2"></i>
                            حفظ جميع التغييرات
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    setupEventListeners() {
        // ✅ منع إعادة ربط الـ listeners إذا كانت مربوطة بالفعل
        if (this._eventListenersAttached) {
            return;
        }
        this._eventListenersAttached = true;
        
        // ✅ استخدام signal من AbortController لإمكانية إلغاء جميع الـ listeners
        const signal = this._abortController?.signal;
        if (!signal) {
            // إنشاء AbortController جديد إذا لم يكن موجوداً
            this._abortController = new AbortController();
        }
        const activeSignal = this._abortController?.signal;

        const exportApprovedExcelBtn = document.getElementById('export-approved-contractors-excel-btn');
        if (exportApprovedExcelBtn) exportApprovedExcelBtn.addEventListener('click', () => this.exportApprovedEntitiesExcel(), { signal: activeSignal });

        const exportApprovedPdfBtn = document.getElementById('export-approved-contractors-pdf-btn');
        if (exportApprovedPdfBtn) exportApprovedPdfBtn.addEventListener('click', () => this.exportApprovedEntitiesPDF(), { signal: activeSignal });

        const approvedSearchInput = document.getElementById('approved-contractors-search');
        if (approvedSearchInput) {
            approvedSearchInput.addEventListener('input', (event) => this.handleApprovedFilterChange('search', event.target.value || ''), { signal: activeSignal });
        }

        const approvedStatusSelect = document.getElementById('approved-contractors-status');
        if (approvedStatusSelect) {
            approvedStatusSelect.addEventListener('change', (event) => this.handleApprovedFilterChange('status', event.target.value || ''), { signal: activeSignal });
        }

        const approvedTypeSelect = document.getElementById('approved-contractors-type');
        if (approvedTypeSelect) {
            approvedTypeSelect.addEventListener('change', (event) => this.handleApprovedFilterChange('type', event.target.value || ''), { signal: activeSignal });
        }

        const approvedStartInput = document.getElementById('approved-contractors-start');
        if (approvedStartInput) {
            approvedStartInput.addEventListener('change', (event) => this.handleApprovedFilterChange('startDate', event.target.value || ''), { signal: activeSignal });
        }

        const approvedEndInput = document.getElementById('approved-contractors-end');
        if (approvedEndInput) {
            approvedEndInput.addEventListener('change', (event) => this.handleApprovedFilterChange('endDate', event.target.value || ''), { signal: activeSignal });
        }

        const approvedResetBtn = document.getElementById('approved-contractors-reset');
        if (approvedResetBtn) approvedResetBtn.addEventListener('click', () => this.resetApprovedFilters(), { signal: activeSignal });

        const addEvaluationBtn = document.getElementById('add-contractor-evaluation-btn');
        if (addEvaluationBtn) addEvaluationBtn.addEventListener('click', () => this.handleAddEvaluationClick(), { signal: activeSignal });

        const filterSelect = document.getElementById('contractor-evaluation-filter');
        if (filterSelect) {
            if (this.currentEvaluationFilter) {
                filterSelect.value = this.currentEvaluationFilter;
            }
            filterSelect.addEventListener('change', (event) => {
                this.currentEvaluationFilter = event.target.value || '';
                this.refreshEvaluationsList(this.currentEvaluationFilter);
            }, { signal: activeSignal });
        }

        const settingsBtn = document.getElementById('contractor-evaluation-settings-btn');
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.openEvaluationSettings(), { signal: activeSignal });

        const manageRequirementsBtn = document.getElementById('manage-requirements-btn');
        if (manageRequirementsBtn) manageRequirementsBtn.addEventListener('click', () => this.openRequirementsManagement(), { signal: activeSignal });

        const sendApprovalRequestBtn = document.getElementById('send-approval-request-btn');
        if (sendApprovalRequestBtn) sendApprovalRequestBtn.addEventListener('click', () => this.showApprovalRequestForm(), { signal: activeSignal });

        // ✅ معطل مؤقتاً - كان يسبب تحديثات متكررة واهتزاز
        // الاستماع لحدث اكتمال المزامنة
    },

    /**
     * ✅ إعداد Listeners للتحديثات Real-time
     * ✅ معطل مؤقتاً لمنع الاهتزاز
     */
    setupRealtimeListeners() {
        // ✅ معطل مؤقتاً - كان يسبب تحديثات متكررة واهتزاز
        return;
    },

    /**
     * ✅ التأكد من ربط event listeners لأزرار التقييمات
     * يتم استدعاؤها عند التبديل إلى تبويب التقييمات
     * ✅ يتم إعادة ربط الـ listeners حتى لو تم إلغاؤها سابقاً
     */
    ensureEvaluationsEventListeners() {
        // ✅ ربط زر إضافة تقييم
        const addEvaluationBtn = document.getElementById('add-contractor-evaluation-btn');
        if (addEvaluationBtn && !addEvaluationBtn.hasAttribute('data-listener-attached')) {
            addEvaluationBtn.setAttribute('data-listener-attached', 'true');
            addEvaluationBtn.addEventListener('click', () => this.handleAddEvaluationClick());
        }

        // ✅ ربط زر تعديل بنود التقييم
        const settingsBtn = document.getElementById('contractor-evaluation-settings-btn');
        if (settingsBtn && !settingsBtn.hasAttribute('data-listener-attached')) {
            settingsBtn.setAttribute('data-listener-attached', 'true');
            settingsBtn.addEventListener('click', () => this.openEvaluationSettings());
        }

        // ✅ ربط فلتر المقاولين
        const filterSelect = document.getElementById('contractor-evaluation-filter');
        if (filterSelect && !filterSelect.hasAttribute('data-listener-attached')) {
            filterSelect.setAttribute('data-listener-attached', 'true');
            if (this.currentEvaluationFilter) {
                filterSelect.value = this.currentEvaluationFilter;
            }
            filterSelect.addEventListener('change', (event) => {
                this.currentEvaluationFilter = event.target.value || '';
                this.refreshEvaluationsList(this.currentEvaluationFilter);
            });
        }
    },

    handleAddEvaluationClick() {
        // ✅ استخدام نفس المنطق المستخدم في renderEvaluationsSection
        const approvedOptions = this.getApprovedOptions(true);
        const legacyContractors = AppState.appData.contractors || [];
        const filterOptions = approvedOptions.length > 0 ? approvedOptions : legacyContractors.map(contractor => ({
            id: contractor.id,
            name: contractor.name || contractor.company || contractor.contractorName || ''
        }));

        if (filterOptions.length === 0) {
            Notification.warning('لا توجد شركات مقاولين مسجلة. يرجى إضافة مقاول أولاً.');
            return;
        }

        const filterSelect = document.getElementById('contractor-evaluation-filter');
        const selectedId = filterSelect?.value || '';

        if (selectedId) {
            this.showEvaluationForm(selectedId);
            return;
        }

        if (filterOptions.length === 1) {
            this.showEvaluationForm(filterOptions[0].id);
            return;
        }

        this.showEvaluationContractorPicker();
    },

    showEvaluationContractorPicker() {
        // ✅ استخدام نفس المنطق المستخدم في renderEvaluationsSection
        const approvedOptions = this.getApprovedOptions(true);
        const legacyContractors = AppState.appData.contractors || [];
        const filterOptions = approvedOptions.length > 0 ? approvedOptions : legacyContractors.map(contractor => ({
            id: contractor.id,
            name: contractor.name || contractor.company || contractor.contractorName || ''
        }));

        if (filterOptions.length === 0) {
            Notification.warning('لا توجد شركات مقاولين مسجلة. يرجى إضافة مقاول أولاً.');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 480px;">
                <div class="modal-header">
                    <h2 class="modal-title"><i class="fas fa-clipboard-check ml-2"></i>اختيار المقاول</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="contractor-evaluation-picker" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">اختر المقاول</label>
                            <select id="contractor-evaluation-picker-select" class="form-input" required>
                                <option value="">-- اختر المقاول --</option>
                                ${filterOptions.map(contractor => `
                                    <option value="${contractor.id}">${Utils.escapeHTML(contractor.name || '')}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="flex items-center justify-end gap-3">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-arrow-right ml-2"></i>
                                متابعة
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const form = modal.querySelector('#contractor-evaluation-picker');
        form?.addEventListener('submit', (event) => {
            event.preventDefault();
            const select = modal.querySelector('#contractor-evaluation-picker-select');
            const contractorId = select?.value || '';
            if (!contractorId) {
                Notification.warning('يرجى اختيار المقاول أولاً');
                return;
            }
            modal.remove();
            this.showEvaluationForm(contractorId);
        });

        modal.addEventListener('click', (event) => {
            if (event.target === modal) modal.remove();
        });
    },

    ensureEvaluationSetup() {
        let shouldSave = false;

        if (!Array.isArray(AppState.appData.contractorEvaluations)) {
            AppState.appData.contractorEvaluations = [];
            shouldSave = true;
        }

        const criteria = AppState.appData.contractorEvaluationCriteria;
        if (!Array.isArray(criteria) || criteria.length === 0) {
            AppState.appData.contractorEvaluationCriteria = CONTRACTOR_EVALUATION_DEFAULT_ITEMS.map((label, index) => ({
                id: `criteria_${index + 1}`,
                label
            }));
            shouldSave = true;
        } else {
            const normalized = criteria.map((item, index) => {
                if (typeof item === 'string') {
                    shouldSave = true;
                    return {
                        id: `criteria_${index + 1}`,
                        label: item.trim()
                    };
                }
                return {
                    id: item.id || `criteria_${index + 1}`,
                    label: (item.label || item.title || '').trim()
                };
            }).filter(item => item.label);

            if (normalized.length !== criteria.length) {
                shouldSave = true;
            }

            AppState.appData.contractorEvaluationCriteria = normalized;
        }

        if (shouldSave) {
            // حفظ البيانات باستخدام window.DataManager
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            } else {
                Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
            }
        }
    },

    getEvaluationCriteria() {
        this.ensureEvaluationSetup();
        return (AppState.appData.contractorEvaluationCriteria || []).map((item, index) => ({
            id: item.id || `criteria_${index + 1}`,
            label: item.label || item.title || ''
        })).filter(item => item.label);
    },

    collectEvaluationItems(container) {
        if (!container || !document.contains(container)) return [];
        
        try {
        return Array.from(container.querySelectorAll('tbody tr[data-criteria-id]')).map(row => {
                // ✅ التحقق من أن الصف لا يزال موجوداً في DOM
                if (!document.contains(row)) {
                    return null;
                }
                
            const criteriaId = row.getAttribute('data-criteria-id') || '';
            const title = row.getAttribute('data-criteria-label') || '';
            const selected = row.querySelector('input[type="radio"]:checked');
                const status = selected && document.contains(selected) ? selected.value : '';
            const notesField = row.querySelector('textarea');
                const notes = notesField && document.contains(notesField) ? notesField.value.trim() : '';
            return { criteriaId, title, status, notes };
            }).filter(item => item !== null); // ✅ إزالة العناصر null
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في collectEvaluationItems:', error);
            return [];
        }
    },

    calculateEvaluationSummary(items) {
        const evaluated = items.filter(item => item.status === 'compliant' || item.status === 'non_compliant');
        const compliantCount = evaluated.filter(item => item.status === 'compliant').length;
        const totalItems = evaluated.length;
        const finalScore = totalItems > 0 ? Math.round((compliantCount / totalItems) * 100) : null;
        const finalRating = this.getFinalRating(finalScore, totalItems);

        return { compliantCount, totalItems, finalScore, finalRating };
    },

    bindEvaluationFormInteractions(modal) {
        if (!modal) return;
        const updateSummary = () => {
            // ✅ التحقق من أن modal لا يزال موجوداً في DOM
            if (!modal || !document.contains(modal)) {
                Utils.safeLog('⚠️ updateSummary: modal غير موجود أو تم حذفه');
                return;
            }
            
            const items = this.collectEvaluationItems(modal);
            const summary = this.calculateEvaluationSummary(items);

            const compliantInput = modal.querySelector('#contractor-evaluation-compliant');
            const totalInput = modal.querySelector('#contractor-evaluation-total');
            const scoreInput = modal.querySelector('#contractor-evaluation-final-score');
            const ratingInput = modal.querySelector('#contractor-evaluation-final-rating');
            
            // ✅ التحقق من وجود العناصر قبل الوصول إليها
            if (!compliantInput || !totalInput || !scoreInput || !ratingInput) {
                Utils.safeLog('⚠️ updateSummary: بعض العناصر غير موجودة');
                return;
            }

            if (compliantInput) compliantInput.value = summary.compliantCount ?? 0;
            if (totalInput) totalInput.value = summary.totalItems ?? 0;
            if (scoreInput) scoreInput.value = summary.finalScore !== null ? summary.finalScore.toFixed(0) + '%' : '';
            if (ratingInput) ratingInput.value = summary.finalRating || '';

            // Update visual styling of summary inputs based on values
            if (compliantInput) {
                const count = parseInt(compliantInput.value) || 0;
                compliantInput.style.background = count > 0 ? '#dcfce7' : '#f1f5f9';
                compliantInput.style.borderColor = count > 0 ? '#10b981' : '#cbd5e1';
                compliantInput.style.color = count > 0 ? '#059669' : '#64748b';
            }

            if (scoreInput) {
                const score = parseFloat(scoreInput.value) || 0;
                let bgColor = '#f1f5f9';
                let borderColor = '#cbd5e1';
                let textColor = '#64748b';

                if (score >= 80) {
                    bgColor = '#dcfce7';
                    borderColor = '#10b981';
                    textColor = '#059669';
                } else if (score >= 60) {
                    bgColor = '#fef3c7';
                    borderColor = '#f59e0b';
                    textColor = '#d97706';
                } else if (score > 0) {
                    bgColor = '#fee2e2';
                    borderColor = '#ef4444';
                    textColor = '#dc2626';
                }

                scoreInput.style.background = bgColor;
                scoreInput.style.borderColor = borderColor;
                scoreInput.style.color = textColor;
            }

            if (ratingInput) {
                const rating = ratingInput.value.toLowerCase();
                let bgColor = '#f1f5f9';
                let borderColor = '#cbd5e1';
                let textColor = '#64748b';

                if (rating.includes('ممتاز') || rating.includes('excellent')) {
                    bgColor = '#dcfce7';
                    borderColor = '#10b981';
                    textColor = '#059669';
                } else if (rating.includes('جيد') || rating.includes('good')) {
                    bgColor = '#dbeafe';
                    borderColor = '#3b82f6';
                    textColor = '#1e40af';
                } else if (rating.includes('مقبول') || rating.includes('acceptable')) {
                    bgColor = '#fef3c7';
                    borderColor = '#f59e0b';
                    textColor = '#d97706';
                } else if (rating.includes('ضعيف') || rating.includes('poor')) {
                    bgColor = '#fee2e2';
                    borderColor = '#ef4444';
                    textColor = '#dc2626';
                }

                ratingInput.style.background = bgColor;
                ratingInput.style.borderColor = borderColor;
                ratingInput.style.color = textColor;
            }
        };

        const updateRadioButtonStyles = () => {
            // ✅ التحقق من أن modal لا يزال موجوداً في DOM
            if (!modal || !document.contains(modal)) {
                return;
            }
            
            try {
            modal.querySelectorAll('input[type="radio"][name^="criteria-"]').forEach(input => {
                    if (!document.contains(input)) return; // ✅ تخطي العناصر المحذوفة
                    
                const label = input.closest('label');
                const row = input.closest('tr');
                const isCompliant = input.value === 'compliant' && input.checked;
                const isNonCompliant = input.value === 'non_compliant' && input.checked;

                    if (label && document.contains(label)) {
                    if (isCompliant) {
                        label.style.background = '#dcfce7';
                        label.style.border = '2px solid #10b981';
                            const span = label.querySelector('span');
                            if (span) span.style.color = '#059669';
                    } else if (isNonCompliant) {
                        label.style.background = '#fee2e2';
                        label.style.border = '2px solid #ef4444';
                            const span = label.querySelector('span');
                            if (span) span.style.color = '#dc2626';
                    } else {
                        label.style.background = '#f1f5f9';
                        label.style.border = '2px solid #cbd5e1';
                            const span = label.querySelector('span');
                            if (span) span.style.color = '#64748b';
                    }
                }
            });
            } catch (error) {
                Utils.safeWarn('⚠️ خطأ في updateRadioButtonStyles:', error);
            }
        };

        try {
        modal.querySelectorAll('input[type="radio"][name^="criteria-"]').forEach(input => {
            input.addEventListener('change', () => {
                    // ✅ التحقق من أن modal لا يزال موجوداً في DOM
                    if (!modal || !document.contains(modal)) {
                        return;
                    }
                    
                // Reset all radio buttons in the same row
                const row = input.closest('tr');
                    if (row && document.contains(row)) {
                    row.querySelectorAll('input[type="radio"]').forEach(radio => {
                            if (!document.contains(radio)) return;
                        const label = radio.closest('label');
                            if (label && document.contains(label) && !radio.checked) {
                            label.style.background = '#f1f5f9';
                            label.style.border = '2px solid #cbd5e1';
                            const span = label.querySelector('span');
                            if (span) span.style.color = '#64748b';
                        }
                    });
                }
                updateRadioButtonStyles();
                updateSummary();
            });
        });
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في إعداد event listeners لراديو buttons:', error);
        }

        // Add hover effects to radio button labels
        try {
        modal.querySelectorAll('label').forEach(label => {
                if (!document.contains(label)) return;
                
            const radio = label.querySelector('input[type="radio"]');
                if (radio && document.contains(radio)) {
                label.addEventListener('mouseenter', () => {
                        if (!document.contains(label) || !document.contains(radio)) return;
                    if (!radio.checked) {
                        label.style.transform = 'scale(1.05)';
                        label.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                    }
                });
                label.addEventListener('mouseleave', () => {
                        if (!document.contains(label) || !document.contains(radio)) return;
                    if (!radio.checked) {
                        label.style.transform = 'scale(1)';
                        label.style.boxShadow = 'none';
                    }
                });
            }
        });
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في إعداد hover effects:', error);
        }

        // Add focus styles to form inputs
        try {
        modal.querySelectorAll('.form-input').forEach(input => {
                if (!document.contains(input)) return;
                
            input.addEventListener('focus', () => {
                    if (!document.contains(input)) return;
                input.style.borderColor = '#2563eb';
                input.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
            });
            input.addEventListener('blur', () => {
                    if (!document.contains(input)) return;
                input.style.boxShadow = 'none';
            });
        });
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في إعداد focus styles:', error);
        }

        updateRadioButtonStyles();
        updateSummary();
    },

    showEvaluationForm(contractorId, existing = null, contractorNameOverride = null) {
        this.ensureEvaluationSetup();

        const contractors = AppState.appData.contractors || [];
        let contractor = contractors.find(c => c.id === contractorId) || null;

        // إذا لم نجد المقاول في قائمة المقاولين، نبحث في قائمة المعتمدين
        if (!contractor) {
            this.ensureApprovedSetup();
            const approvedEntities = AppState.appData.approvedContractors || [];
            const approvedEntity = approvedEntities.find(ae => ae.id === contractorId || ae.contractorId === contractorId);

            if (approvedEntity) {
                // إنشاء كائن مقاول مؤقت من بيانات المعتمد
                contractor = {
                    id: approvedEntity.contractorId || approvedEntity.id,
                    name: approvedEntity.companyName,
                    company: approvedEntity.companyName,
                    contractorName: approvedEntity.companyName,
                    serviceType: approvedEntity.serviceType,
                    isFromApproved: true
                };
            }
        }

        // ✅ إصلاح: إذا كان existing موجوداً ولكن contractor غير موجود، نحاول البحث عن المقاول من contractorId
        if (!contractor && existing) {
            const existingContractorId = existing.contractorId;
            if (existingContractorId) {
                // البحث في قائمة المقاولين
                contractor = contractors.find(c => c.id === existingContractorId) || null;
                
                // إذا لم نجد، البحث في قائمة المعتمدين
                if (!contractor) {
                    this.ensureApprovedSetup();
                    const approvedEntities = AppState.appData.approvedContractors || [];
                    const approvedEntity = approvedEntities.find(ae => 
                        ae.id === existingContractorId || 
                        ae.contractorId === existingContractorId
                    );
                    
                    if (approvedEntity) {
                        contractor = {
                            id: approvedEntity.contractorId || approvedEntity.id,
                            name: approvedEntity.companyName,
                            company: approvedEntity.companyName,
                            contractorName: approvedEntity.companyName,
                            serviceType: approvedEntity.serviceType,
                            isFromApproved: true
                        };
                    }
                }
            }
        }

        // ✅ إصلاح: إذا كان existing موجوداً ولكن contractor غير موجود، نحاول البحث عن المقاول من contractorId
        if (!contractor && existing) {
            const existingContractorId = existing.contractorId;
            if (existingContractorId) {
                // البحث في قائمة المقاولين
                contractor = contractors.find(c => c.id === existingContractorId) || null;
                
                // إذا لم نجد، البحث في قائمة المعتمدين
                if (!contractor) {
                    this.ensureApprovedSetup();
                    const approvedEntities = AppState.appData.approvedContractors || [];
                    const approvedEntity = approvedEntities.find(ae => 
                        ae.id === existingContractorId || 
                        ae.contractorId === existingContractorId
                    );
                    
                    if (approvedEntity) {
                        contractor = {
                            id: approvedEntity.contractorId || approvedEntity.id,
                            name: approvedEntity.companyName,
                            company: approvedEntity.companyName,
                            contractorName: approvedEntity.companyName,
                            serviceType: approvedEntity.serviceType,
                            isFromApproved: true
                        };
                    }
                }
            }
        }

        if (!contractor && !existing) {
            Notification.error('المقاول غير موجود');
            return;
        }

        const criteria = this.getEvaluationCriteria();
        if (criteria.length === 0) {
            Notification.error('قائمة بنود التقييم غير متاحة. يرجى التواصل مع مدير النظام.');
            return;
        }

        // ✅ إصلاح: إذا كان existing موجوداً، نحصل على البيانات من الصفوف المنفصلة
        let evaluationData = existing;
        if (existing && existing.id) {
            const fullEvaluation = this.getEvaluationWithItems(existing.id);
            if (fullEvaluation) {
                evaluationData = fullEvaluation;
            }
        }
        
        const existingItems = Array.isArray(evaluationData?.items) ? evaluationData.items : [];
        const existingById = new Map(existingItems.map(item => [(item.criteriaId || item.id || item.title || '').toString(), item]));

        const rowsData = criteria.map((criterion) => {
            const key = existingById.get(criterion.id) || existingById.get(criterion.label) || null;
            return {
                criteriaId: criterion.id,
                title: criterion.label,
                status: key?.status || '',
                notes: key?.notes || ''
            };
        });

        const initialSummary = this.calculateEvaluationSummary(rowsData);

        const defaultDate = evaluationData?.evaluationDate
            ? new Date(evaluationData.evaluationDate).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10);
        const evaluatorName = evaluationData?.evaluatorName || AppState.currentUser?.name || '';
        const projectName = evaluationData?.projectName || '';
        const location = evaluationData?.location || '';
        const generalNotes = evaluationData?.generalNotes || evaluationData?.notes || '';
        // ✅ إصلاح: استخدام contractorNameOverride إذا كان متوفراً، وإلا استخدام القيم الافتراضية مع أولوية evaluationData.contractorName
        const contractorName = contractorNameOverride || evaluationData?.contractorName || contractor?.name || contractor?.company || contractor?.contractorName || '';

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 95vw; width: 1400px; max-height: 95vh;">
                <div class="modal-header" style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); border-bottom: none; padding: 1.75rem 2rem;">
                    <h2 class="modal-title" style="color: #ffffff; font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 0.75rem;">
                        <i class="fas fa-clipboard-check" style="font-size: 1.5rem;"></i>
                        ${existing ? 'تحديث تقييم المقاول' : 'تقييم المقاول وتأهيله'}
                    </h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="color: #ffffff; background: rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 0.5rem 0.75rem; transition: all 0.3s ease;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding: 2rem; background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%);">
                    <form id="contractor-evaluation-form" class="space-y-6">
                        <div style="background: #ffffff; border-radius: 12px; padding: 1.75rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
                            <h3 style="font-size: 1.125rem; font-weight: 700; color: #1e293b; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-info-circle" style="color: #2563eb;"></i>
                                المعلومات الأساسية
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label class="block text-sm font-semibold text-gray-800 mb-2" style="color: #334155; font-weight: 600;">المقاول</label>
                                    <input type="text" class="form-input" value="${Utils.escapeHTML(contractorName)}" readonly style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; font-weight: 500;">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-800 mb-2" style="color: #334155; font-weight: 600;">تاريخ التقييم <span style="color: #ef4444;">*</span></label>
                                    <input type="date" id="contractor-evaluation-date" class="form-input" required value="${defaultDate}" style="border: 1px solid #cbd5e1; transition: all 0.3s ease;">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-800 mb-2" style="color: #334155; font-weight: 600;">اسم المقيم <span style="color: #ef4444;">*</span></label>
                                    <input type="text" id="contractor-evaluation-evaluator" class="form-input" required value="${Utils.escapeHTML(evaluatorName)}" placeholder="اسم الشخص الذي قام بالتقييم" style="border: 1px solid #cbd5e1; transition: all 0.3s ease;">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-800 mb-2" style="color: #334155; font-weight: 600;">الموقع / المشروع</label>
                                    <input type="text" id="contractor-evaluation-project" class="form-input" value="${Utils.escapeHTML(projectName)}" placeholder="اسم المشروع أو الموقع" style="border: 1px solid #cbd5e1; transition: all 0.3s ease;">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-800 mb-2" style="color: #334155; font-weight: 600;">الموقع التفصيلي</label>
                                    <input type="text" id="contractor-evaluation-location" class="form-input" value="${Utils.escapeHTML(location)}" placeholder="المنطقة أو القسم" style="border: 1px solid #cbd5e1; transition: all 0.3s ease;">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-800 mb-2" style="color: #334155; font-weight: 600;">ملاحظات عامة</label>
                                    <textarea id="contractor-evaluation-general-notes" class="form-input" rows="2" placeholder="ملاحظات عامة حول التقييم" style="border: 1px solid #cbd5e1; transition: all 0.3s ease;">${Utils.escapeHTML(generalNotes)}</textarea>
                                </div>
                            </div>
                        </div>

                        <div style="background: #ffffff; border-radius: 12px; padding: 1.75rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
                            <h3 style="font-size: 1.125rem; font-weight: 700; color: #1e293b; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-list-check" style="color: #2563eb;"></i>
                                بنود التقييم
                            </h3>
                            <div class="table-wrapper" style="overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0;">
                                <table class="data-table" style="width: 100%; border-collapse: separate; border-spacing: 0;">
                                    <thead>
                                        <tr style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);">
                                            <th style="width: 60px; padding: 1rem; text-align: center; color: #ffffff; font-weight: 700; border: none; border-right: 1px solid rgba(255, 255, 255, 0.2);">#</th>
                                            <th style="padding: 1rem; text-align: right; color: #ffffff; font-weight: 700; border: none; border-right: 1px solid rgba(255, 255, 255, 0.2);">بند التقييم</th>
                                            <th style="width: 140px; padding: 1rem; text-align: center; color: #ffffff; font-weight: 700; border: none; border-right: 1px solid rgba(255, 255, 255, 0.2);">مطابق</th>
                                            <th style="width: 140px; padding: 1rem; text-align: center; color: #ffffff; font-weight: 700; border: none; border-right: 1px solid rgba(255, 255, 255, 0.2);">غير مطابق</th>
                                            <th style="padding: 1rem; text-align: right; color: #ffffff; font-weight: 700; border: none;">ملاحظات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${rowsData.map((row, index) => `
                                            <tr data-criteria-id="${row.criteriaId}" data-criteria-label="${Utils.escapeHTML(row.title).replace(/"/g, '&quot;')}" style="border-bottom: 1px solid #e2e8f0; transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='#ffffff'">
                                                <td style="padding: 1rem; text-align: center; font-weight: 600; color: #64748b; background: #f8fafc; border-right: 1px solid #e2e8f0;">${index + 1}</td>
                                                <td style="padding: 1rem; text-align: right; color: #1e293b; font-weight: 500; border-right: 1px solid #e2e8f0;">${Utils.escapeHTML(row.title)}</td>
                                                <td style="padding: 1rem; text-align: center; border-right: 1px solid #e2e8f0;">
                                                    <label class="inline-flex items-center justify-center gap-2" style="cursor: pointer; padding: 0.5rem 1rem; border-radius: 8px; transition: all 0.3s ease; ${row.status === 'compliant' ? 'background: #dcfce7; border: 2px solid #10b981;' : 'background: #f1f5f9; border: 2px solid #cbd5e1;'}">
                                                        <input type="radio" name="criteria-${index}" value="compliant" ${row.status === 'compliant' ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer; accent-color: #10b981;">
                                                        <span style="color: ${row.status === 'compliant' ? '#059669' : '#64748b'}; font-weight: 600;">مطابق</span>
                                                    </label>
                                                </td>
                                                <td style="padding: 1rem; text-align: center; border-right: 1px solid #e2e8f0;">
                                                    <label class="inline-flex items-center justify-center gap-2" style="cursor: pointer; padding: 0.5rem 1rem; border-radius: 8px; transition: all 0.3s ease; ${row.status === 'non_compliant' ? 'background: #fee2e2; border: 2px solid #ef4444;' : 'background: #f1f5f9; border: 2px solid #cbd5e1;'}">
                                                        <input type="radio" name="criteria-${index}" value="non_compliant" ${row.status === 'non_compliant' ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer; accent-color: #ef4444;">
                                                        <span style="color: ${row.status === 'non_compliant' ? '#dc2626' : '#64748b'}; font-weight: 600;">غير مطابق</span>
                                                    </label>
                                                </td>
                                                <td style="padding: 1rem;">
                                                    <textarea class="form-input" rows="2" placeholder="أدخل ملاحظاتك (إن وجدت)" style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.75rem; width: 100%; resize: vertical; transition: all 0.3s ease;">${Utils.escapeHTML(row.notes || '')}</textarea>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 1.75rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); border: 2px solid #0ea5e9;">
                            <h3 style="font-size: 1.125rem; font-weight: 700; color: #0c4a6e; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-chart-line" style="color: #0ea5e9;"></i>
                                ملخص التقييم
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
                                <div style="background: #ffffff; border-radius: 10px; padding: 1.25rem; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); border: 1px solid #bae6fd;">
                                    <label class="block text-sm font-semibold mb-2" style="color: #0369a1; font-weight: 600; margin-bottom: 0.75rem;">عدد البنود المطابقة</label>
                                    <input type="text" id="contractor-evaluation-compliant" class="form-input" readonly value="${initialSummary.compliantCount ?? 0}" style="background: #dcfce7; border: 2px solid #10b981; color: #059669; font-weight: 700; font-size: 1.25rem; text-align: center; padding: 0.75rem;">
                                </div>
                                <div style="background: #ffffff; border-radius: 10px; padding: 1.25rem; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); border: 1px solid #bae6fd;">
                                    <label class="block text-sm font-semibold mb-2" style="color: #0369a1; font-weight: 600; margin-bottom: 0.75rem;">إجمالي بنود التقييم</label>
                                    <input type="text" id="contractor-evaluation-total" class="form-input" readonly value="${initialSummary.totalItems ?? 0}" style="background: #f1f5f9; border: 2px solid #64748b; color: #475569; font-weight: 700; font-size: 1.25rem; text-align: center; padding: 0.75rem;">
                                </div>
                                <div style="background: #ffffff; border-radius: 10px; padding: 1.25rem; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); border: 1px solid #bae6fd;">
                                    <label class="block text-sm font-semibold mb-2" style="color: #0369a1; font-weight: 600; margin-bottom: 0.75rem;">نسبة التقييم</label>
                                    <input type="text" id="contractor-evaluation-final-score" class="form-input" readonly value="${initialSummary.finalScore !== null ? initialSummary.finalScore.toFixed(0) + '%' : ''}" style="background: #fef3c7; border: 2px solid #f59e0b; color: #d97706; font-weight: 700; font-size: 1.25rem; text-align: center; padding: 0.75rem;">
                                </div>
                                <div style="background: #ffffff; border-radius: 10px; padding: 1.25rem; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); border: 1px solid #bae6fd;">
                                    <label class="block text-sm font-semibold mb-2" style="color: #0369a1; font-weight: 600; margin-bottom: 0.75rem;">التقييم النهائي</label>
                                    <input type="text" id="contractor-evaluation-final-rating" class="form-input" readonly value="${initialSummary.finalRating || ''}" style="background: #ddd6fe; border: 2px solid #8b5cf6; color: #7c3aed; font-weight: 700; font-size: 1.25rem; text-align: center; padding: 0.75rem;">
                                </div>
                            </div>
                        </div>

                        <div class="modal-footer" style="background: #f8fafc; border-top: 2px solid #e2e8f0; padding: 1.5rem 2rem; margin: 0 -2rem -2rem -2rem; border-radius: 0 0 12px 12px;">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; transition: all 0.3s ease;">إلغاء</button>
                            <button type="submit" class="btn-primary" style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-weight: 700; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3); transition: all 0.3s ease;">
                                <i class="fas fa-save ml-2"></i>
                                ${existing ? 'تحديث التقييم' : 'حفظ التقييم'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const form = modal.querySelector('#contractor-evaluation-form');
        form?.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                const evaluationDate = form.querySelector('#contractor-evaluation-date')?.value;
                const evaluator = form.querySelector('#contractor-evaluation-evaluator')?.value.trim();

                if (!evaluationDate || !evaluator) {
                    Notification.warning('يرجى استكمال البيانات الأساسية للتقييم (التاريخ واسم المقيم)');
                    return;
                }

                const items = this.collectEvaluationItems(form);
                const summary = this.calculateEvaluationSummary(items);

                const record = {
                    id: evaluationData?.id || Utils.generateId('CTREVAL'),
                    contractorId: contractor?.id || evaluationData?.contractorId || contractorId,
                    contractorName,
                    evaluationDate: new Date(evaluationDate).toISOString(),
                    evaluatorName: evaluator,
                    projectName: form.querySelector('#contractor-evaluation-project')?.value.trim() || '',
                    location: form.querySelector('#contractor-evaluation-location')?.value.trim() || '',
                    generalNotes: form.querySelector('#contractor-evaluation-general-notes')?.value.trim() || '',
                    items,
                    compliantCount: summary.compliantCount ?? 0,
                    totalItems: summary.totalItems ?? 0,
                    finalScore: summary.finalScore,
                    finalRating: summary.finalRating || '',
                    isoCode: evaluationData?.isoCode || (typeof generateISOCode === 'function' ? generateISOCode('CTREV', AppState.appData.contractorEvaluations) : ''),
                    createdAt: evaluationData?.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    createdBy: evaluationData?.createdBy || AppState.currentUser?.id || '',
                    updatedBy: AppState.currentUser?.id || ''
                };

                if (!record.contractorId) {
                    Notification.error('تعذر ربط التقييم بالمقاول.');
                    return;
                }

                // التحقق من الصلاحيات - فقط المدير يمكنه اعتماد التقييمات مباشرة
                const isAdmin = Permissions.isAdmin();

                if (evaluationData) {
                    // التعديل - فقط المدير
                    if (!isAdmin) {
                        Notification.error('ليس لديك صلاحية لتعديل التقييمات. يرجى التواصل مع مدير النظام.');
                        return;
                    }
                    this.persistEvaluation(record, evaluationData);
                    Notification.success('تم تحديث تقييم المقاول بنجاح');
                    modal.remove();
                } else {
                    // إضافة تقييم جديد - إرسال طلب اعتماد
                    // ✅ إزالة توليد ID من Frontend - Backend سيتولى توليده بشكل تسلسلي (CAR_1, CAR_2, ...)
                    const approvalRequest = {
                        // id سيتم توليده في Backend باستخدام generateSequentialId('CAR', ...)
                        requestType: 'evaluation',
                        contractorId: record.contractorId,
                        contractorName: record.contractorName,
                        evaluationData: record,
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                        createdBy: AppState.currentUser?.id || '',
                        createdByName: AppState.currentUser?.name || ''
                    };

                    this.ensureApprovalRequestsSetup();
                    
                    // ✅ إصلاح: استخدام addContractorApprovalRequest مباشرة بدلاً من autoSave
                    // ✅ هذا يضمن عدم حذف الطلبات الموجودة في Google Sheets
                    try {
                        const backendResult = await GoogleIntegration.sendRequest({
                            action: 'addContractorApprovalRequest',
                            data: approvalRequest
                        });

                        if (backendResult && backendResult.success) {
                            // ✅ بعد نجاح الحفظ في Backend، إضافة الطلب إلى AppState محلياً
                            AppState.appData.contractorApprovalRequests.push(approvalRequest);
                            
                            // حفظ البيانات محلياً
                            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                                window.DataManager.save();
                            } else {
                                Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
                            }
                            
                            Utils.safeLog('✅ تم حفظ طلب اعتماد التقييم في Google Sheets بنجاح');
                        } else {
                            // إذا فشل الحفظ في Backend، نضيف محلياً فقط
                            AppState.appData.contractorApprovalRequests.push(approvalRequest);
                            
                            // حفظ البيانات محلياً
                            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                                window.DataManager.save();
                            } else {
                                Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
                            }
                            
                            Utils.safeWarn('⚠️ فشل حفظ طلب اعتماد التقييم في Google Sheets، تم الحفظ محلياً فقط');
                        }
                    } catch (error) {
                        // في حالة الخطأ، نضيف محلياً فقط
                        AppState.appData.contractorApprovalRequests.push(approvalRequest);
                        
                        // حفظ البيانات محلياً
                        if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                            window.DataManager.save();
                        } else {
                            Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
                        }
                        
                        Utils.safeWarn('⚠️ خطأ في حفظ طلب اعتماد التقييم في Google Sheets:', error);
                    }

                    Notification.success('تم إرسال طلب اعتماد التقييم بنجاح. سيتم مراجعته من قبل مدير النظام.');
                    modal.remove();
                    this.refreshApprovalRequestsSection();

                    // تحديث الإشعارات
                    if (typeof AppUI !== 'undefined' && AppUI.updateNotificationsBadge) {
                        AppUI.updateNotificationsBadge();
                    }
                }
            } catch (error) {
                Utils.safeError('خطأ في حفظ تقييم المقاولين:', error);
                Notification.error('تعذر حفظ تقييم المقاول: ' + error.message);
            }
        });

        modal.addEventListener('click', (event) => {
            if (event.target === modal) modal.remove();
        });

        this.bindEvaluationFormInteractions(modal);
    },

    persistEvaluation(record, existing = null) {
        if (!Array.isArray(AppState.appData.contractorEvaluations)) {
            AppState.appData.contractorEvaluations = [];
        }

        // ✅ إصلاح: حفظ كل بند كسجل منفصل في الجدول
        const evaluationId = record.id;
        const evaluationBaseData = {
            id: evaluationId,
            evaluationId: evaluationId,
            contractorId: record.contractorId,
            contractorName: record.contractorName,
            evaluationDate: record.evaluationDate,
            evaluatorName: record.evaluatorName,
            projectName: record.projectName || '',
            location: record.location || '',
            generalNotes: record.generalNotes || '',
            compliantCount: record.compliantCount ?? 0,
            totalItems: record.totalItems ?? 0,
            finalScore: record.finalScore,
            finalRating: record.finalRating || '',
            isoCode: record.isoCode || '',
            createdAt: record.createdAt || new Date().toISOString(),
            updatedAt: record.updatedAt || new Date().toISOString(),
            createdBy: record.createdBy || AppState.currentUser?.id || '',
            updatedBy: record.updatedBy || AppState.currentUser?.id || ''
        };

        // ✅ حذف البنود القديمة للتقييم إذا كان تعديل (مطابقة id أو evaluationId)
        if (existing) {
            AppState.appData.contractorEvaluations = AppState.appData.contractorEvaluations.filter(
                item => (item.evaluationId || item.id) !== evaluationId
            );
        }

        // ✅ حفظ كل بند كسجل منفصل
        const items = Array.isArray(record.items) ? record.items : [];
        const now = new Date().toISOString();
        const userId = AppState.currentUser?.id || '';

        items.forEach((item, index) => {
            const evaluationRecord = {
                ...evaluationBaseData,
                // ✅ إضافة معلومات البند
                criteriaId: item.criteriaId || '',
                title: item.title || item.label || '',
                status: item.status || '',
                notes: item.notes || '',
                itemIndex: index + 1,
                // ✅ الحقول المطلوبة لكل بند
                createdAt: existing ? (item.createdAt || evaluationBaseData.createdAt) : now,
                updatedAt: now,
                createdBy: existing ? (item.createdBy || evaluationBaseData.createdBy) : userId,
                updatedBy: userId,
                // ✅ معرف فريد لكل صف
                rowId: existing && item.rowId ? item.rowId : Utils.generateId('CEVROW')
            };
            AppState.appData.contractorEvaluations.push(evaluationRecord);
        });

        // حفظ البيانات باستخدام window.DataManager
        if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
            window.DataManager.save();
        } else {
            Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
        }
        try {
            GoogleIntegration.autoSave?.('ContractorEvaluations', AppState.appData.contractorEvaluations);
        } catch (error) {
            Utils.safeWarn('فشل الحفظ التلقائي لتقييمات المقاولين:', error);
        }

        this.refreshEvaluationsList(this.currentEvaluationFilter || '');
        this.updateContractorEvaluationSummary(record.contractorId);
    },

    refreshEvaluationsList(contractorId = '') {
        const container = document.getElementById('contractor-evaluations-container');
        if (!container) return;
        const evaluationsHTML = this.renderEvaluationsTable(contractorId);
        this.safeSetInnerHTML(container, evaluationsHTML);
    },

    openEvaluationHistory(contractorId) {
        if (!contractorId) return;
        this.currentEvaluationFilter = contractorId;

        const filterSelect = document.getElementById('contractor-evaluation-filter');
        if (filterSelect) {
            filterSelect.value = contractorId;
        }

        this.refreshEvaluationsList(contractorId);

        // ✅ إصلاح: منع scrollIntoView من التسبب في scroll jumps
        const evaluationCard = document.getElementById('contractor-evaluation-card');
        if (evaluationCard) {
            // ✅ استخدام requestAnimationFrame لتأخير scroll حتى لا يسبب اهتزاز
            requestAnimationFrame(() => {
                // ✅ حفظ موضع التمرير الحالي
                const currentScrollY = window.scrollY;
                evaluationCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // ✅ التأكد من عدم حدوث scroll jump كبير
                requestAnimationFrame(() => {
                    const newScrollY = window.scrollY;
                    const scrollDiff = Math.abs(newScrollY - currentScrollY);
                    // إذا كان الفرق كبير جداً، إلغاء scroll
                    if (scrollDiff > window.innerHeight) {
                        window.scrollTo({ top: currentScrollY, behavior: 'auto' });
                    }
                });
            });
        }
    },

    /**
     * إضافة تقييم لجهة معتمدة (من قائمة المعتمدين)
     */
    showEvaluationFormForApproved(approvedEntityId) {
        if (!approvedEntityId) {
            Notification.error('معرف الجهة المعتمدة غير محدد');
            return;
        }

        this.ensureApprovedSetup();
        const approvedEntities = AppState.appData.approvedContractors || [];
        const approvedEntity = approvedEntities.find(ae => ae.id === approvedEntityId);

        if (!approvedEntity) {
            Notification.error('الجهة المعتمدة غير موجودة');
            return;
        }

        // البحث عن المقاول المرتبط بالجهة المعتمدة
        let contractorId = approvedEntity.contractorId;
        let contractorName = approvedEntity.companyName || '';

        // إذا لم يكن هناك معرف مقاول مباشر، نبحث بالاسم
        if (!contractorId) {
            const contractors = AppState.appData.contractors || [];
            const contractor = contractors.find(c =>
                c.name === approvedEntity.companyName ||
                (c.approvedEntityId === approvedEntityId) ||
                (c.company === approvedEntity.companyName)
            );

            if (contractor) {
                contractorId = contractor.id;
                contractorName = contractor.name || contractor.company || contractorName;
            } else {
                // إذا لم نجد مقاول، نستخدم معرف المعتمد مباشرة
                // ✅ إصلاح: نستخدم معرف المعتمد كـ contractorId ونتأكد من تمرير اسم المقاول
                contractorId = approvedEntityId;
                // contractorName محدد بالفعل من approvedEntity.companyName
            }
        } else {
            // إذا كان هناك معرف مقاول، نبحث عن اسمه
            const contractors = AppState.appData.contractors || [];
            const contractor = contractors.find(c => c.id === contractorId);
            if (contractor) {
                contractorName = contractor.name || contractor.company || contractorName;
            }
        }

        // ✅ إصلاح: فتح نموذج التقييم مع تمرير اسم المقاول لضمان ظهوره في النموذج
        // إذا كان المقاول غير موجود في قائمة المقاولين، نستخدم معرف المعتمد
        this.showEvaluationForm(contractorId, null, contractorName);
    },

    /**
     * فتح سجل التقييمات لجهة معتمدة (من قائمة المعتمدين)
     */
    openEvaluationHistoryForApproved(approvedEntityId) {
        if (!approvedEntityId) {
            Notification.error('معرف الجهة المعتمدة غير محدد');
            return;
        }

        this.ensureApprovedSetup();
        const approvedEntities = AppState.appData.approvedContractors || [];
        const approvedEntity = approvedEntities.find(ae => ae.id === approvedEntityId);

        if (!approvedEntity) {
            Notification.error('الجهة المعتمدة غير موجودة');
            return;
        }

        // البحث عن المقاول المرتبط بالجهة المعتمدة
        let contractorId = approvedEntity.contractorId;

        // إذا لم يكن هناك معرف مقاول مباشر، نبحث بالاسم
        if (!contractorId) {
            const contractors = AppState.appData.contractors || [];
            const contractor = contractors.find(c =>
                c.name === approvedEntity.companyName ||
                (c.approvedEntityId === approvedEntityId)
            );

            if (contractor) {
                contractorId = contractor.id;
            } else {
                Notification.warning('لم يتم العثور على المقاول المرتبط. سيتم البحث بالتقييمات المرتبطة بالاسم.');
                // البحث بالتقييمات باستخدام اسم الشركة
                const evaluations = AppState.appData.contractorEvaluations || [];
                const relatedEvaluation = evaluations.find(e =>
                    e.contractorName === approvedEntity.companyName
                );

                if (relatedEvaluation && relatedEvaluation.contractorId) {
                    contractorId = relatedEvaluation.contractorId;
                } else {
                    Notification.error('لم يتم العثور على تقييمات مرتبطة بهذه الجهة');
                    return;
                }
            }
        }

        // فتح سجل التقييمات
        this.openEvaluationHistory(contractorId);

        // التبديل إلى تبويب التقييمات إذا لم يكن مفتوحاً
        if (this.currentTab !== 'evaluations') {
            this.switchTab('evaluations');
        }
    },

    renderEvaluationDetails(evaluation) {
        if (!evaluation) return '';
        const statusLabel = (status) => status === 'compliant' ? 'مطابق' : status === 'non_compliant' ? 'غير مطابق' : '-';

        // ✅ إصلاح: التأكد من أن items هي مصفوفة ومعالجة البيانات بشكل صحيح
        let items = [];
        if (Array.isArray(evaluation.items)) {
            items = evaluation.items;
        } else if (evaluation.items && typeof evaluation.items === 'object') {
            // إذا كان كائن، نحوله إلى مصفوفة
            items = Object.values(evaluation.items);
        }
        
        // ✅ تصفية البنود الفارغة وإظهار فقط البنود التي لها عنوان أو حالة
        // نعرض البند إذا كان له عنوان أو إذا كان له حالة (حتى لو العنوان فارغ)
        items = items.filter(item => {
            if (!item || typeof item !== 'object') return false;
            // نعرض البند إذا كان له عنوان أو حالة
            const hasTitle = item.title || item.label || item.criteriaId;
            const hasStatus = item.status && (item.status === 'compliant' || item.status === 'non_compliant');
            return hasTitle || hasStatus;
        });
        
        const itemsRows = items.length > 0 ? items.map((item, index) => {
            // ✅ محاولة الحصول على العنوان من مصادر متعددة
            let title = item.title || item.label || '';
            // إذا لم يكن هناك عنوان، نحاول الحصول عليه من criteriaId أو من معايير التقييم
            if (!title && item.criteriaId) {
                const criteria = this.getEvaluationCriteria();
                const criterion = criteria.find(c => c.id === item.criteriaId);
                if (criterion) {
                    title = criterion.label || criterion.title || '';
                }
            }
            // إذا لم يكن هناك عنوان بعد، نستخدم criteriaId كبديل
            if (!title) {
                title = item.criteriaId || `بند ${index + 1}`;
            }
            
            const status = item.status || '';
            const notes = item.notes || '';
            return `
            <tr>
                <td>${index + 1}</td>
                <td>${Utils.escapeHTML(title)}</td>
                <td>${statusLabel(status)}</td>
                <td>${Utils.escapeHTML(notes)}</td>
            </tr>
        `;
        }).join('') : '<tr><td colspan="4" class="text-center text-gray-500 py-4">لا توجد بنود مسجلة</td></tr>';

        return `
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="text-sm font-semibold text-gray-600">المقاول</label>
                        <p class="text-gray-800">${Utils.escapeHTML(evaluation.contractorName || '')}</p>
                    </div>
                    <div>
                        <label class="text-sm font-semibold text-gray-600">تاريخ التقييم</label>
                        <p class="text-gray-800">${evaluation.evaluationDate ? Utils.formatDate(evaluation.evaluationDate) : '-'}</p>
                    </div>
                    <div>
                        <label class="text-sm font-semibold text-gray-600">اسم المقيم</label>
                        <p class="text-gray-800">${Utils.escapeHTML(evaluation.evaluatorName || '')}</p>
                    </div>
                    <div>
                        <label class="text-sm font-semibold text-gray-600">الموقع / المشروع</label>
                        <p class="text-gray-800">${Utils.escapeHTML(evaluation.projectName || evaluation.location || '')}</p>
                    </div>
                    <div>
                        <label class="text-sm font-semibold text-gray-600">عدد البنود المطابقة</label>
                        <p class="text-gray-800">${evaluation.compliantCount ?? 0}</p>
                    </div>
                    <div>
                        <label class="text-sm font-semibold text-gray-600">إجمالي البنود</label>
                        <p class="text-gray-800">${evaluation.totalItems ?? (Array.isArray(evaluation.items) ? evaluation.items.length : (evaluation.items ? Object.keys(evaluation.items).length : 0))}</p>
                    </div>
                    <div>
                        <label class="text-sm font-semibold text-gray-600">نسبة التقييم</label>
                        <p class="text-gray-800">${typeof evaluation.finalScore === 'number' ? evaluation.finalScore.toFixed(0) + '%' : '-'}</p>
                    </div>
                    <div>
                        <label class="text-sm font-semibold text-gray-600">التقييم النهائي</label>
                        <p class="text-gray-800">${Utils.escapeHTML(evaluation.finalRating || '')}</p>
                    </div>
                </div>

                ${evaluation.generalNotes ? `
                    <div class="bg-gray-50 border border-gray-200 rounded p-3">
                        <label class="text-sm font-semibold text-gray-600 block mb-1">ملاحظات عامة</label>
                        <p class="text-gray-700 whitespace-pre-line">${Utils.escapeHTML(evaluation.generalNotes)}</p>
                    </div>
                ` : ''}

                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width: 50px;">#</th>
                                <th>بند التقييم</th>
                                <th style="width: 140px;">الحالة</th>
                                <th>ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsRows || `<tr><td colspan="4" class="text-center text-gray-500 py-4">لا توجد بنود مسجلة</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * ✅ تجميع بنود التقييم من الصفوف المنفصلة
     */
    getEvaluationWithItems(evaluationId) {
        const allRecords = AppState.appData.contractorEvaluations || [];
        const evaluationRecords = allRecords.filter(r => (r.id === evaluationId || r.evaluationId === evaluationId));
        
        if (evaluationRecords.length === 0) return null;
        
        // استخدام أول سجل كأساس
        const firstRecord = evaluationRecords[0];
        
        // ✅ إصلاح: تحويل finalScore إلى رقم إذا كان نصاً
        let finalScore = firstRecord.finalScore;
        if (typeof finalScore === 'string' && finalScore !== '') {
            finalScore = parseFloat(finalScore);
            if (isNaN(finalScore)) finalScore = null;
        } else if (typeof finalScore !== 'number') {
            finalScore = null;
        }
        
        // ✅ إصلاح: تحويل compliantCount و totalItems إلى أرقام
        let compliantCount = firstRecord.compliantCount;
        if (typeof compliantCount === 'string') compliantCount = parseInt(compliantCount) || 0;
        let totalItems = firstRecord.totalItems;
        if (typeof totalItems === 'string') totalItems = parseInt(totalItems) || 0;
        
        // ✅ إصلاح: إذا لم يوجد finalScore ولكن يوجد compliantCount و totalItems، احسب النسبة
        if (finalScore === null && compliantCount > 0 && totalItems > 0) {
            finalScore = Math.round((compliantCount / totalItems) * 100);
        }
        
        const evaluation = {
            id: firstRecord.id || firstRecord.evaluationId,
            contractorId: firstRecord.contractorId,
            contractorName: firstRecord.contractorName,
            evaluationDate: firstRecord.evaluationDate,
            evaluatorName: firstRecord.evaluatorName,
            projectName: firstRecord.projectName,
            location: firstRecord.location,
            generalNotes: firstRecord.generalNotes,
            compliantCount: compliantCount ?? 0,
            totalItems: totalItems ?? 0,
            finalScore: finalScore,
            finalRating: firstRecord.finalRating || '',
            isoCode: firstRecord.isoCode,
            createdAt: firstRecord.createdAt,
            updatedAt: firstRecord.updatedAt,
            createdBy: firstRecord.createdBy,
            updatedBy: firstRecord.updatedBy,
            items: []
        };
        
        // تجميع البنود
        evaluationRecords.forEach(record => {
            if (record.criteriaId || record.title) {
                evaluation.items.push({
                    criteriaId: record.criteriaId,
                    title: record.title,
                    status: record.status,
                    notes: record.notes
                });
            }
        });
        
        return evaluation;
    },

    viewEvaluation(evaluationId) {
        const evaluation = this.getEvaluationWithItems(evaluationId);
        if (!evaluation) {
            Notification.error('السجل المطلوب غير موجود');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h2 class="modal-title"><i class="fas fa-clipboard-check ml-2"></i>تفاصيل تقييم المقاول</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${this.renderEvaluationDetails(evaluation)}
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إغلاق</button>
                    <button class="btn-success" onclick="Contractors.exportEvaluationPDF('${evaluation.id}')">
                        <i class="fas fa-file-pdf ml-2"></i>تصدير PDF
                    </button>
                    ${Permissions.isAdmin() ? `
                    <button class="btn-primary" onclick="Contractors.showEvaluationForm('${evaluation.contractorId}', ${JSON.stringify(evaluation).replace(/"/g, '&quot;')}); this.closest('.modal-overlay').remove();">
                        <i class="fas fa-edit ml-2"></i>تعديل
                    </button>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) modal.remove();
        });
    },

    exportEvaluationPDF(evaluationId) {
        const evaluation = this.getEvaluationWithItems(evaluationId);
        if (!evaluation) {
            Notification.error('السجل المطلوب غير موجود');
            return;
        }

        try {
            Loading.show();

            const statusLabel = (status) => status === 'compliant' ? 'مطابق' : status === 'non_compliant' ? 'غير مطابق' : '-';

            const summaryTable = `
                <table>
                    <tr><th>المقاول</th><td>${Utils.escapeHTML(evaluation.contractorName || '')}</td></tr>
                    <tr><th>تاريخ التقييم</th><td>${evaluation.evaluationDate ? Utils.formatDate(evaluation.evaluationDate) : '-'}</td></tr>
                    <tr><th>اسم المقيم</th><td>${Utils.escapeHTML(evaluation.evaluatorName || '')}</td></tr>
                    <tr><th>الموقع / المشروع</th><td>${Utils.escapeHTML(evaluation.projectName || evaluation.location || '')}</td></tr>
                    <tr><th>عدد البنود المطابقة</th><td>${evaluation.compliantCount ?? 0}</td></tr>
                    <tr><th>إجمالي البنود الفعلية</th><td>${evaluation.totalItems ?? (Array.isArray(evaluation.items) ? evaluation.items.length : (evaluation.items ? Object.keys(evaluation.items).length : 0))}</td></tr>
                    <tr><th>نسبة التقييم</th><td>${typeof evaluation.finalScore === 'number' ? evaluation.finalScore.toFixed(0) + '%' : '-'}</td></tr>
                    <tr><th>التقييم النهائي</th><td>${Utils.escapeHTML(evaluation.finalRating || '')}</td></tr>
                </table>
            `;

            // ✅ إصلاح: التأكد من أن items هي مصفوفة ومعالجة البيانات بشكل صحيح
            let items = [];
            if (Array.isArray(evaluation.items)) {
                items = evaluation.items;
            } else if (evaluation.items && typeof evaluation.items === 'object') {
                // إذا كان كائن، نحوله إلى مصفوفة
                items = Object.values(evaluation.items);
            }
            
            // ✅ تصفية البنود الفارغة وإظهار فقط البنود التي لها عنوان أو حالة
            items = items.filter(item => {
                if (!item || typeof item !== 'object') return false;
                // نعرض البند إذا كان له عنوان أو حالة
                const hasTitle = item.title || item.label || item.criteriaId;
                const hasStatus = item.status && (item.status === 'compliant' || item.status === 'non_compliant');
                return hasTitle || hasStatus;
            });
            
            const itemsTable = items.length > 0 ? `
                <div class="section-title">تفاصيل بنود التقييم</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th>البند</th>
                            <th style="width: 140px;">الحالة</th>
                            <th>الملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item, index) => {
                            // ✅ محاولة الحصول على العنوان من مصادر متعددة
                            let title = item.title || item.label || '';
                            // إذا لم يكن هناك عنوان، نحاول الحصول عليه من criteriaId أو من معايير التقييم
                            if (!title && item.criteriaId) {
                                const criteria = this.getEvaluationCriteria();
                                const criterion = criteria.find(c => c.id === item.criteriaId);
                                if (criterion) {
                                    title = criterion.label || criterion.title || '';
                                }
                            }
                            // إذا لم يكن هناك عنوان بعد، نستخدم criteriaId كبديل
                            if (!title) {
                                title = item.criteriaId || `بند ${index + 1}`;
                            }
                            
                            const status = item.status || '';
                            const notes = item.notes || '';
                            return `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${Utils.escapeHTML(title)}</td>
                                <td>${statusLabel(status)}</td>
                                <td>${Utils.escapeHTML(notes)}</td>
                            </tr>
                        `;
                        }).join('')}
                    </tbody>
                </table>
            ` : '<div class="section-title">تفاصيل بنود التقييم</div><p class="text-gray-500 text-center py-4">لا توجد بنود مسجلة</p>';

            const notesSection = evaluation.generalNotes
                ? `
                    <div class="section-title">ملاحظات عامة</div>
                    <p>${Utils.escapeHTML(evaluation.generalNotes)}</p>
                `
                : '';

            const content = `
                <div class="section-title">معلومات التقييم</div>
                ${summaryTable}
                ${notesSection}
                ${itemsTable}
            `;

            const formCode = evaluation.isoCode || `CTREVAL-${evaluation.id?.substring(0, 6) || ''}`;

            const htmlContent = typeof FormHeader !== 'undefined' && typeof FormHeader.generatePDFHTML === 'function'
                ? FormHeader.generatePDFHTML(
                    formCode,
                    'نموذج تقييم وتأهيل المقاولين',
                    content,
                    false,
                    true,
                    { version: '1.0', qrData: `contractor-evaluation:${evaluation.id}` },
                    evaluation.createdAt,
                    evaluation.updatedAt
                )
                : content;

            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const printWindow = window.open(url, '_blank');

            if (printWindow) {
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.print();
                        Loading.hide();
                    }, 500);
                };
            } else {
                Loading.hide();
                Notification.error('يرجى السماح بالنوافذ المنبثقة للطباعة');
            }
        } catch (error) {
            Loading.hide();
            Utils.safeError('خطأ في تصدير تقييم المقاولين:', error);
            Notification.error('فشل في تصدير تقرير التقييم: ' + error.message);
        }
    },

    async requestDeleteEvaluation(evaluationId) {
        if (!evaluationId) return;

        // التحقق من الصلاحيات - فقط المدير يمكنه حذف مباشرة
        if (Permissions.isAdmin()) {
            if (!confirm('هل أنت متأكد من حذف هذا التقييم؟ لا يمكن التراجع عن هذه العملية.')) {
                return;
            }
            // المدير يمكنه الحذف مباشرة
            return this.deleteEvaluation(evaluationId);
        }

        // المستخدمون العاديون لا يمكنهم حذف التقييمات - فقط المدير
        Notification.error('ليس لديك صلاحية لحذف التقييمات. يرجى التواصل مع مدير النظام.');
    },

    deleteEvaluation(evaluationId) {
        if (!evaluationId) return;

        // التحقق من الصلاحيات - فقط المدير يمكنه حذف التقييمات
        if (!Permissions.isAdmin()) {
            Notification.error('ليس لديك صلاحية لحذف التقييمات. يرجى التواصل مع مدير النظام.');
            return;
        }

        if (!confirm('هل أنت متأكد من حذف هذا التقييم؟ لا يمكن التراجع عن هذه العملية.')) {
            return;
        }

        const collection = AppState.appData.contractorEvaluations || [];
        
        // ✅ إصلاح: البحث عن جميع الصفوف المرتبطة بالتقييم (التقييمات تُخزن كصفوف متعددة)
        const relatedRecords = collection.filter(item => item.id === evaluationId || item.evaluationId === evaluationId);
        if (relatedRecords.length === 0) {
            Notification.error('السجل المطلوب غير موجود');
            return;
        }

        const contractorId = relatedRecords[0]?.contractorId;
        
        // ✅ حذف جميع الصفوف المرتبطة بالتقييم
        for (let i = collection.length - 1; i >= 0; i--) {
            if (collection[i].id === evaluationId || collection[i].evaluationId === evaluationId) {
                collection.splice(i, 1);
            }
        }
        
        // حفظ البيانات باستخدام window.DataManager
        if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
            window.DataManager.save();
        } else {
            Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
        }

        try {
            GoogleIntegration.autoSave?.('ContractorEvaluations', AppState.appData.contractorEvaluations);
        } catch (error) {
            Utils.safeWarn('فشل تحديث تقييمات المقاولين في الحفظ السحابي:', error);
        }

        this.refreshEvaluationsList(this.currentEvaluationFilter || '');
        this.updateContractorEvaluationSummary(contractorId);
        Notification.success('تم حذف التقييم بنجاح');
    },

    getFinalRating(score, totalItems = 0) {
        if (score === null || totalItems === 0) {
            return 'لم يتم التقييم بعد';
        }

        if (score >= 90) return 'ممتاز';
        if (score >= 75) return 'جيد جداً';
        if (score >= 60) return 'بحاجة إلى تحسين';
        return 'غير مؤهل';
    },

    openEvaluationSettings() {
        const currentUser = AppState.currentUser;
        if (!currentUser || currentUser.role !== 'admin') {
            Notification.error('هذه الميزة متاحة لمدير النظام فقط.');
            return;
        }

        this.ensureEvaluationSetup();
        const criteria = this.getEvaluationCriteria();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 640px;">
                <div class="modal-header">
                    <h2 class="modal-title"><i class="fas fa-sliders-h ml-2"></i>تعديل بنود تقييم المقاولين</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="contractor-evaluation-settings-form" class="space-y-4">
                        <div class="bg-blue-50 border border-blue-200 text-blue-800 rounded p-3 text-sm">
                            <p class="font-semibold mb-1">تعليمات:</p>
                            <ul class="list-disc mr-6 space-y-1">
                                <li>أدخل كل بند تقييم في سطر منفصل.</li>
                                <li>سيتم تطبيق التغييرات على التقييمات الجديدة فقط. التقييمات السابقة ستظل محفوظة كما هي.</li>
                                <li>تأكد من شمول جميع المتطلبات المطلوبة لتقييم المقاولين.</li>
                            </ul>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">بنود التقييم</label>
                            <textarea id="contractor-evaluation-settings-textarea" class="form-input" rows="12" placeholder="أدخل كل بند في سطر جديد">${criteria.map(item => item.label).join('\\n')}</textarea>
                        </div>
                        <div class="flex items-center justify-end gap-3">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save ml-2"></i>حفظ التعديلات
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const form = modal.querySelector('#contractor-evaluation-settings-form');
        form?.addEventListener('submit', (event) => {
            event.preventDefault();
            const textarea = modal.querySelector('#contractor-evaluation-settings-textarea');
            const value = textarea?.value || '';
            const saved = this.saveEvaluationCriteriaFromInput(value);
            if (saved) {
                Notification.success('تم تحديث بنود التقييم بنجاح');
                modal.remove();
            }
        });

        modal.addEventListener('click', (event) => {
            if (event.target === modal) modal.remove();
        });
    },

    saveEvaluationCriteriaFromInput(rawInput) {
        const lines = (rawInput || '').split('\n').map(line => line.trim()).filter(Boolean);
        if (lines.length === 0) {
            Notification.error('لا يمكن حفظ قائمة فارغة. يرجى إضافة بند واحد على الأقل.');
            return false;
        }

        AppState.appData.contractorEvaluationCriteria = lines.map((label, index) => ({
            id: `criteria_${index + 1}`,
            label
        }));

        // حفظ البيانات باستخدام window.DataManager
        if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
            window.DataManager.save();
        } else {
            Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
        }
        this.ensureEvaluationSetup();
        this.refreshEvaluationsList(this.currentEvaluationFilter || '');
        return true;
    },

    buildContractorEvaluationSummary(contractorId) {
        const evaluations = (AppState.appData.contractorEvaluations || []).filter(item => item.contractorId === contractorId).sort((a, b) => new Date(b.evaluationDate || b.createdAt || 0) - new Date(a.evaluationDate || a.createdAt || 0));
        if (evaluations.length === 0) {
            return `<div class="text-gray-500 text-sm">لا توجد تقييمات مسجلة لهذا المقاول.</div>`;
        }

        const latest = evaluations[0];
        const latestScore = typeof latest.finalScore === 'number' ? latest.finalScore : null;
        const badgeClass = latestScore === null
            ? 'badge-info'
            : latestScore >= 90
                ? 'badge-success'
                : latestScore >= 75
                    ? 'badge-info'
                    : latestScore >= 60
                        ? 'badge-warning'
                        : 'badge-danger';
        const maxScore = Math.max(...evaluations.map(item => (typeof item.finalScore === 'number' ? item.finalScore : 0)));
        return `
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-sm font-semibold text-gray-700">آخر تقييم</div>
                        <div class="text-sm text-gray-600">${latest.evaluationDate ? Utils.formatDate(latest.evaluationDate) : '-'}</div>
                    </div>
                    <div>
                        <span class="badge ${badgeClass}">
                            ${Utils.escapeHTML(latest.finalRating || '')}
                        </span>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
                    <div class="p-2 border rounded bg-gray-50">
                        <div class="font-semibold text-gray-600">عدد التقييمات</div>
                        <div class="text-lg">${evaluations.length}</div>
                    </div>
                    <div class="p-2 border rounded bg-gray-50">
                        <div class="font-semibold text-gray-600">أعلى نسبة</div>
                        <div class="text-lg">${isFinite(maxScore) ? maxScore.toFixed(0) + '%' : '-'}</div>
                    </div>
                    <div class="p-2 border rounded bg-gray-50">
                        <div class="font-semibold text-gray-600">آخر مقيم</div>
                        <div>${Utils.escapeHTML(latest.evaluatorName || '')}</div>
                    </div>
                </div>
                <button class="btn-secondary text-sm" onclick="Contractors.openEvaluationHistory('${contractorId}')">
                    <i class="fas fa-clipboard-list ml-2"></i>
                    عرض جميع التقييمات
                </button>
            </div>
        `;
    },

    updateContractorEvaluationSummary(contractorId) {
        if (!contractorId) return;
        const container = this.safeGetElementById(`contractor-evaluation-summary-${contractorId}`);
        if (!container) return;
        // ✅ استخدام safeSetInnerHTML بدلاً من innerHTML مباشرة
        const summaryHTML = this.buildContractorEvaluationSummary(contractorId);
        this.safeSetInnerHTML(container, summaryHTML);
    },

    async showContractorForm(contractorData = null) {
        const isEdit = !!contractorData;
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2 class="modal-title">${isEdit ? 'تعديل مقاول' : 'إضافة مقاول جديد'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="contractor-form" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">اسم المقاول *</label>
                                <input type="text" id="contractor-name" required class="form-input"
                                    value="${contractorData?.name || ''}" placeholder="اسم المقاول">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">نوع الخدمة *</label>
                                <input type="text" id="contractor-service-type" required class="form-input"
                                    value="${contractorData?.serviceType || ''}" placeholder="نوع الخدمة">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">رقم العقد *</label>
                                <input type="text" id="contractor-contract-number" required class="form-input"
                                    value="${contractorData?.contractNumber || ''}" placeholder="رقم العقد">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">تاريخ البدء *</label>
                                <input type="date" id="contractor-start-date" required class="form-input"
                                    value="${contractorData?.startDate ? new Date(contractorData.startDate).toISOString().slice(0, 10) : ''}">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">تاريخ الانتهاء *</label>
                                <input type="date" id="contractor-end-date" required class="form-input"
                                    value="${contractorData?.endDate ? new Date(contractorData.endDate).toISOString().slice(0, 10) : ''}">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الحالة *</label>
                                <select id="contractor-status" required class="form-input">
                                    <option value="">اختر الحالة</option>
                                    <option value="نشط" ${contractorData?.status === 'نشط' ? 'selected' : ''}>نشط</option>
                                    <option value="منتهي" ${contractorData?.status === 'منتهي' ? 'selected' : ''}>منتهي</option>
                                    <option value="معلق" ${contractorData?.status === 'معلق' ? 'selected' : ''}>معلق</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الشخص المسؤول</label>
                                <input type="text" id="contractor-contact-person" class="form-input"
                                    value="${contractorData?.contactPerson || ''}" placeholder="اسم الشخص المسؤول">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الهات</label>
                                <input type="tel" id="contractor-phone" class="form-input"
                                    value="${contractorData?.phone || ''}" placeholder="رقم الهات">
                            </div>
                            <div class="col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">البريد الإلكتروني</label>
                                <input type="email" id="contractor-email" class="form-input"
                                    value="${contractorData?.email || ''}" placeholder="البريد الإلكتروني">
                            </div>
                        </div>
                        
                        ${isEdit ? `
                        <div class="border-t pt-4 mt-4">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i class="fas fa-clipboard-check ml-2"></i>
                                اشتراطات الاعتماد
                            </h3>
                            <div id="contractor-requirements-section" class="space-y-3">
                                ${this.renderRequirementsSection(contractorData?.id || '')}
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="flex items-center justify-end gap-4 pt-4 border-t">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save ml-2"></i>${isEdit ? 'حفظ التعديلات' : 'إضافة المقاول'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const form = modal.querySelector('#contractor-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // منع النقر المتكرر
            const submitBtn = form?.querySelector('button[type="submit"]') ||
                e.target?.querySelector('button[type="submit"]');

            if (submitBtn && submitBtn.disabled) {
                return; // النموذج قيد المعالجة
            }

            // تعطيل الزر لمنع النقر المتكرر
            let originalText = '';
            if (submitBtn) {
                originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i> جاري الحفظ...';
            }

            const contractorId = contractorData?.id || Utils.generateId('CONTRACTOR');

            // توليد كود تلقائي إذا لم يكن موجوداً
            let contractorCode = contractorData?.code;
            if (!contractorCode) {
                contractorCode = this.generateContractorCode();
            }

            // فحص العناصر قبل الاستخدام
            const nameEl = document.getElementById('contractor-name');
            const serviceTypeEl = document.getElementById('contractor-service-type');
            const contractNumberEl = document.getElementById('contractor-contract-number');
            const startDateEl = document.getElementById('contractor-start-date');
            const endDateEl = document.getElementById('contractor-end-date');
            const statusEl = document.getElementById('contractor-status');
            const contactPersonEl = document.getElementById('contractor-contact-person');
            const phoneEl = document.getElementById('contractor-phone');
            const emailEl = document.getElementById('contractor-email');

            if (!nameEl || !serviceTypeEl || !contractNumberEl || !startDateEl || !endDateEl || !statusEl || !contactPersonEl || !phoneEl || !emailEl) {
                Notification.error('بعض الحقول المطلوبة غير موجودة. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
                return;
            }

            const formData = {
                id: contractorId,
                code: contractorCode, // كود تلقائي للمقاول
                name: nameEl.value.trim(),
                serviceType: serviceTypeEl.value.trim(),
                contractNumber: contractNumberEl.value.trim(),
                startDate: new Date(startDateEl.value).toISOString(),
                endDate: new Date(endDateEl.value).toISOString(),
                status: statusEl.value,
                contactPerson: contactPersonEl.value.trim(),
                phone: phoneEl.value.trim(),
                email: emailEl.value.trim(),
                createdAt: contractorData?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // الحفاظ على approvalRequirements إذا كانت موجودة
            if (contractorData?.approvalRequirements) {
                formData.approvalRequirements = contractorData.approvalRequirements;
            }

            Loading.show();
            try {
                if (isEdit) {
                    // التعديل مسموح مباشرة
                    const index = AppState.appData.contractors.findIndex(c => c.id === contractorData.id);
                    if (index !== -1) {
                        // الحفاظ على approvalRequirements عند التعديل
                        if (AppState.appData.contractors[index].approvalRequirements) {
                            formData.approvalRequirements = AppState.appData.contractors[index].approvalRequirements;
                        }
                        AppState.appData.contractors[index] = formData;
                    }
                    // حفظ البيانات
                    if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                        window.DataManager.save();
                    } else {
                        Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
                    }
                    // حفظ تلقائي في Google Sheets
                    await GoogleIntegration.autoSave('Contractors', AppState.appData.contractors);

                    // تحديث حالة الاعتماد بعد الحفظ
                    if (formData.approvalRequirements) {
                        this.updateContractorApprovalStatus(contractorId);
                    }

                    Loading.hide();
                    Notification.success('تم تحديث المقاول بنجاح');

                    // استعادة الزر بعد النجاح
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                    }

                    modal.remove();
                    this.load(true); // ✅ Preserve current tab after saving
                } else {
                    // إضافة مقاول جديد - إرسال طلب اعتماد
                    // ✅ إزالة توليد ID من Frontend - Backend سيتولى توليده بشكل تسلسلي (CAR_1, CAR_2, ...)
                    const approvalRequest = {
                        // id سيتم توليده في Backend باستخدام generateSequentialId('CAR', ...)
                        requestType: 'contractor',
                        companyName: formData.name,
                        serviceType: formData.serviceType,
                        licenseNumber: formData.contractNumber,
                        contactPerson: formData.contactPerson,
                        phone: formData.phone,
                        email: formData.email,
                        notes: `طلب اعتماد مقاول جديد: ${formData.name}`,
                        status: 'pending',
                        contractorData: formData, // حفظ بيانات المقاول مع الطلب
                        createdAt: new Date().toISOString(),
                        createdBy: AppState.currentUser?.id || '',
                        createdByName: AppState.currentUser?.name || ''
                    };

                    this.ensureApprovalRequestsSetup();
                    
                    // ✅ إصلاح: استخدام addContractorApprovalRequest مباشرة بدلاً من autoSave
                    // ✅ هذا يضمن عدم حذف الطلبات الموجودة في Google Sheets
                    try {
                        const backendResult = await GoogleIntegration.sendRequest({
                            action: 'addContractorApprovalRequest',
                            data: approvalRequest
                        });

                        if (backendResult && backendResult.success) {
                            // ✅ بعد نجاح الحفظ في Backend، إضافة الطلب إلى AppState محلياً
                            AppState.appData.contractorApprovalRequests.push(approvalRequest);
                            
                            // حفظ البيانات محلياً
                            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                                window.DataManager.save();
                            } else {
                                Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
                            }
                            
                            Utils.safeLog('✅ تم حفظ طلب اعتماد المقاول في Google Sheets بنجاح');
                        } else {
                            // إذا فشل الحفظ في Backend، نضيف محلياً فقط
                            AppState.appData.contractorApprovalRequests.push(approvalRequest);
                            
                            // حفظ البيانات محلياً
                            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                                window.DataManager.save();
                            } else {
                                Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
                            }
                            
                            Utils.safeWarn('⚠️ فشل حفظ طلب اعتماد المقاول في Google Sheets، تم الحفظ محلياً فقط');
                        }
                    } catch (error) {
                        // في حالة الخطأ، نضيف محلياً فقط
                        AppState.appData.contractorApprovalRequests.push(approvalRequest);
                        
                        // حفظ البيانات محلياً
                        if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                            window.DataManager.save();
                        } else {
                            Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
                        }
                        
                        Utils.safeWarn('⚠️ خطأ في حفظ طلب اعتماد المقاول في Google Sheets:', error);
                    }

                    Loading.hide();
                    Notification.success('تم إرسال طلب اعتماد المقاول بنجاح. سيتم مراجعته من قبل مدير النظام.');

                    // استعادة الزر بعد النجاح
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                    }

                    modal.remove();
                    this.load(true); // ✅ Preserve current tab after saving
                }
            } catch (error) {
                Loading.hide();
                Notification.error('حدث خطأ: ' + error.message);

                // استعادة الزر في حالة الخطأ
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async viewContractor(id) {
        const contractor = AppState.appData.contractors.find(c => c.id === id);
        if (!contractor) return;

        // التأكد من وجود كود للمقاول، وإضافته إذا لم يكن موجوداً
        if (!contractor.code) {
            contractor.code = this.generateContractorCode();
            // حفظ التغيير
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            }
            GoogleIntegration.autoSave?.('Contractors', AppState.appData.contractors).catch(() => { });
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2 class="modal-title">تفاصيل المقاول</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            ${contractor.code ? `
                            <div>
                                <label class="text-sm font-semibold text-gray-600">كود المقاول:</label>
                                <p class="text-gray-800 font-mono">${Utils.escapeHTML(contractor.code)}</p>
                            </div>
                            ` : ''}
                            <div>
                                <label class="text-sm font-semibold text-gray-600">اسم المقاول:</label>
                                <p class="text-gray-800">${Utils.escapeHTML(contractor.name || '')}</p>
                            </div>
                            <div>
                                <label class="text-sm font-semibold text-gray-600">نوع الخدمة:</label>
                                <p class="text-gray-800">${Utils.escapeHTML(contractor.serviceType || '')}</p>
                            </div>
                            <div>
                                <label class="text-sm font-semibold text-gray-600">رقم العقد:</label>
                                <p class="text-gray-800">${Utils.escapeHTML(contractor.contractNumber || '')}</p>
                            </div>
                            <div>
                                <label class="text-sm font-semibold text-gray-600">تاريخ البدء:</label>
                                <p class="text-gray-800">${contractor.startDate ? Utils.formatDate(contractor.startDate) : '-'}</p>
                            </div>
                            <div>
                                <label class="text-sm font-semibold text-gray-600">تاريخ الانتهاء:</label>
                                <p class="text-gray-800">${contractor.endDate ? Utils.formatDate(contractor.endDate) : '-'}</p>
                            </div>
                            <div>
                                <label class="text-sm font-semibold text-gray-600">الحالة:</label>
                                <span class="badge badge-${contractor.status === 'نشط' ? 'success' : contractor.status === 'منتهي' ? 'danger' : 'warning'}">
                                    ${contractor.status || '-'}
                                </span>
                            </div>
                            <div>
                                <label class="text-sm font-semibold text-gray-600">الشخص المسؤول:</label>
                                <p class="text-gray-800">${Utils.escapeHTML(contractor.contactPerson || '')}</p>
                            </div>
                            <div>
                                <label class="text-sm font-semibold text-gray-600">الهات:</label>
                                <p class="text-gray-800">${Utils.escapeHTML(contractor.phone || '')}</p>
                            </div>
                            <div class="col-span-2">
                                <label class="text-sm font-semibold text-gray-600">البريد الإلكتروني:</label>
                                <p class="text-gray-800">${Utils.escapeHTML(contractor.email || '')}</p>
                            </div>
                            <div class="col-span-2">
                                <label class="text-sm font-semibold text-gray-600">سجل تقييمات المقاول:</label>
                                <div id="contractor-evaluation-summary-${contractor.id}" class="mt-2">
                                    ${this.buildContractorEvaluationSummary(contractor.id)}
                                </div>
                            </div>
                            <div class="col-span-2">
                                <label class="text-sm font-semibold text-gray-600">حالة اشتراطات الاعتماد:</label>
                                <div id="contractor-requirements-summary-${contractor.id}" class="mt-2">
                                    ${this.renderRequirementsSummary(contractor.id)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إغلاق</button>
                    <button class="btn-success" onclick="Contractors.showEvaluationForm('${contractor.id}'); this.closest('.modal-overlay').remove();">
                        <i class="fas fa-clipboard-check ml-2"></i>
                        تقييم المقاول
                    </button>
                    <button class="btn-primary" onclick="Contractors.showContractorForm(${JSON.stringify(contractor).replace(/"/g, '&quot;')}); this.closest('.modal-overlay').remove();">
                        <i class="fas fa-edit ml-2"></i>تعديل
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async editContractor(id) {
        const contractor = AppState.appData.contractors.find(c => c.id === id);
        if (contractor) await this.showContractorForm(contractor);
    },

    async requestDeleteContractor(id) {
        if (!id) return;

        const contractor = AppState.appData.contractors.find(c => c.id === id);
        if (!contractor) {
            Notification.error('المقاول غير موجود');
            return;
        }

        // التحقق من الصلاحيات - فقط المدير يمكنه حذف مباشرة
        if (Permissions.isAdmin()) {
            if (!confirm('هل أنت متأكد من حذف هذا المقاول؟ سيتم حذفه من قائمة المقاولين وقائمة المعتمدين. لا يمكن التراجع عن هذه العملية.')) {
                return;
            }
            // المدير يمكنه الحذف مباشرة
            return this.deleteContractor(id);
        }

        // المستخدمون العاديون يرسلون طلب حذف
        if (!confirm('سيتم إرسال طلب حذف هذا المقاول إلى مدير النظام للموافقة. هل تريد المتابعة؟')) {
            return;
        }

        const currentUser = AppState.currentUser;
        const deletionRequest = {
            id: Utils.generateId('DELRQ'),
            requestType: 'contractor',
            entityId: id,
            entityName: contractor.name || '',
            reason: prompt('يرجى إدخال سبب طلب الحذف:') || 'طلب حذف من المستخدم',
            createdBy: currentUser?.id || '',
            createdByName: currentUser?.name || '',
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        // إرسال طلب الحذف
        await this.submitDeletionRequest(deletionRequest);
        this.refreshApprovalRequestsSection();
    },

    async deleteContractor(id) {
        if (!id) return;
        if (!Permissions.isAdmin()) {
            Notification.error('ليس لديك صلاحية للحذف المباشر');
            return;
        }

        const contractors = AppState.appData.contractors || [];
        const index = contractors.findIndex(c => c.id === id);

        if (index === -1) {
            Notification.error('المقاول غير موجود');
            return;
        }

        if (!confirm('هل أنت متأكد من حذف هذا المقاول؟ سيتم حذفه من قائمة المقاولين وقائمة المعتمدين.')) {
            return;
        }

        // Optimistic Delete
        contractors.splice(index, 1);
        AppState.appData.contractors = contractors;

        // Cascade delete from approved locally
        const approvedContractors = AppState.appData.approvedContractors || [];
        const approvedIndex = approvedContractors.findIndex(ac => ac.contractorId === id || ac.id === id);
        if (approvedIndex !== -1) {
            approvedContractors.splice(approvedIndex, 1);
            AppState.appData.approvedContractors = approvedContractors;
        }

        try {
            Loading.show();
            const result = await GoogleIntegration.sendToAppsScript('deleteContractor', { contractorId: id });

            if (result.success) {
                Notification.success('تم حذف المقاول بنجاح');
                if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                    window.DataManager.save();
                }
                this.load(true); // ✅ Preserve current tab after deletion
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            Loading.hide();
            console.error('فشل حذف المقاول:', error);
            Notification.error('فشل حذف المقاول: ' + error.message);
            this.load(true); // ✅ Reload to rollback - preserve current tab
        } finally {
            Loading.hide();
        }
    },

    // ===== نظام الاشتراطات للمقاولين =====

    /**
     * التأكد من وجود إعدادات الاشتراطات
     */
    ensureRequirementsSetup() {
        if (!AppState.companySettings) {
            AppState.companySettings = {};
        }
        if (!Array.isArray(AppState.companySettings.contractorApprovalRequirements)) {
            AppState.companySettings.contractorApprovalRequirements = CONTRACTOR_APPROVAL_REQUIREMENTS_DEFAULT.map(req => ({ ...req }));
            // حفظ البيانات باستخدام window.DataManager
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            } else {
                Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
            }
        }
    },

    /**
     * الحصول على قائمة الاشتراطات (محدث لدعم الحقول الجديدة)
     */
    getApprovalRequirements(contractorType = null) {
        this.ensureRequirementsSetup();
        let requirements = (AppState.companySettings.contractorApprovalRequirements || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // تصفية حسب نوع المقاول إذا تم تحديده
        if (contractorType) {
            requirements = requirements.filter(req => {
                const applicableTypes = req.applicableTypes || ['contractor', 'supplier'];
                return applicableTypes.includes(contractorType);
            });
        }
        
        // ضمان وجود الحقول الجديدة للاشتراطات القديمة
        return requirements.map(req => ({
            ...req,
            category: req.category || 'other',
            priority: req.priority || 'medium',
            hasExpiry: req.hasExpiry || false,
            expiryMonths: req.expiryMonths || 12,
            description: req.description || '',
            applicableTypes: req.applicableTypes || ['contractor', 'supplier']
        }));
    },

    /**
     * التحقق من استيفاء جميع الاشتراطات المطلوبة
     */
    checkAllRequirementsMet(contractorId) {
        // استخدام الدالة المساعدة للبحث عن المقاول
        const contractor = this.getContractorById(contractorId);
        if (!contractor) {
            // إذا لم نجد المقاول، نعتبر الاشتراطات مستوفاة (للتوافق مع البيانات القديمة)
            Utils.safeWarn(`⚠️ المقاول بالمعرف ${contractorId} غير موجود في قائمة المقاولين`);
            return true; // نعتبره معتمداً للتوافق مع البيانات القديمة
        }

        const requirements = this.getApprovalRequirements();
        const contractorRequirements = contractor.approvalRequirements || {};

        for (const req of requirements) {
            if (!req.required) continue; // تخطي الاشتراطات غير المطلوبة

            const reqData = contractorRequirements[req.id];

            if (req.type === 'document') {
                // يجب أن يكون هناك مستند مرفوع
                if (!reqData || !reqData.documentLink || !reqData.completed) {
                    return false;
                }
            } else if (req.type === 'checkbox') {
                // يجب أن يكون محدد
                if (!reqData || !reqData.completed) {
                    return false;
                }
            } else if (req.type === 'text') {
                // يجب أن يكون هناك نص
                if (!reqData || !reqData.value || !reqData.completed) {
                    return false;
                }
            }
        }

        return true;
    },

    /**
     * الحصول على حالة الاشتراطات للمقاول (محسّن مع دعم انتهاء الصلاحية)
     */
    getContractorRequirementsStatus(contractorId) {
        const contractor = (AppState.appData.contractors || []).find(c => c.id === contractorId);
        if (!contractor) {
            return {
                allMet: false,
                completed: 0,
                total: 0,
                requirements: [],
                expiring: 0,
                expired: 0
            };
        }

        const requirements = this.getApprovalRequirements();
        const contractorRequirements = contractor.approvalRequirements || {};

        let expiringCount = 0;
        let expiredCount = 0;

        const status = requirements.map(req => {
            const reqData = contractorRequirements[req.id];
            let completed = false;
            let isExpiring = false;
            let isExpired = false;

            if (req.type === 'document') {
                completed = !!(reqData && reqData.documentLink && reqData.completed);
                
                // التحقق من انتهاء الصلاحية
                if (req.hasExpiry && reqData && reqData.expiryDate) {
                    const expiryDate = new Date(reqData.expiryDate);
                    const today = new Date();
                    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                    
                    if (daysUntilExpiry < 0) {
                        isExpired = true;
                        expiredCount++;
                    } else if (daysUntilExpiry <= 30) {
                        isExpiring = true;
                        expiringCount++;
                    }
                }
            } else if (req.type === 'checkbox') {
                completed = !!(reqData && reqData.completed);
            } else if (req.type === 'text') {
                completed = !!(reqData && reqData.value && reqData.completed);
            }

            return {
                id: req.id,
                label: req.label,
                type: req.type,
                required: req.required,
                completed: completed,
                isExpiring: isExpiring,
                isExpired: isExpired,
                expiryDate: reqData?.expiryDate || null,
                data: reqData || null
            };
        });

        const requiredCount = status.filter(s => s.required).length;
        const completedCount = status.filter(s => s.required && s.completed && !s.isExpired).length;
        const allMet = completedCount === requiredCount && expiredCount === 0;

        return {
            allMet,
            completed: completedCount,
            total: requiredCount,
            requirements: status,
            expiring: expiringCount,
            expired: expiredCount
        };
    },

    /**
     * الحصول على قائمة المستندات المنتهية أو القريبة من الانتهاء
     */
    getExpiringRequirements(contractorId = null) {
        const contractors = contractorId 
            ? [(AppState.appData.contractors || []).find(c => c.id === contractorId)].filter(Boolean)
            : (AppState.appData.contractors || []);
        
        const expiringItems = [];
        const today = new Date();

        contractors.forEach(contractor => {
            if (!contractor.approvalRequirements) return;

            const requirements = this.getApprovalRequirements();
            requirements.forEach(req => {
                if (req.type !== 'document' || !req.hasExpiry) return;

                const reqData = contractor.approvalRequirements[req.id];
                if (!reqData || !reqData.expiryDate) return;

                const expiryDate = new Date(reqData.expiryDate);
                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry <= 60) { // تحذير قبل 60 يوم
                    expiringItems.push({
                        contractorId: contractor.id,
                        contractorName: contractor.name,
                        requirementId: req.id,
                        requirementLabel: req.label,
                        expiryDate: reqData.expiryDate,
                        daysUntilExpiry: daysUntilExpiry,
                        isExpired: daysUntilExpiry < 0,
                        documentLink: reqData.documentLink,
                        fileName: reqData.fileName
                    });
                }
            });
        });

        return expiringItems.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    },

    /**
     * عرض ملخص الاشتراطات
     */
    renderRequirementsSummary(contractorId) {
        const status = this.getContractorRequirementsStatus(contractorId);

        if (status.total === 0) {
            return '<div class="text-gray-500 text-sm">لا توجد اشتراطات محددة</div>';
        }

        const bgClass = status.allMet ? 'bg-green-50' : 'bg-orange-50';
        const borderClass = status.allMet ? 'border-green-200' : 'border-orange-200';
        const textClass = status.allMet ? 'text-green-800' : 'text-orange-800';
        const badgeClass = status.allMet ? 'badge-success' : 'badge-warning';
        const statusText = status.allMet ? '✅ جميع الاشتراطات مستوفاة' : '⚠️ اشتراطات غير مكتملة';

        return `
            <div class="space-y-2">
                <div class="flex items-center justify-between p-2 ${bgClass} border ${borderClass} rounded">
                    <span class="text-sm font-semibold ${textClass}">
                        ${statusText}
                    </span>
                    <span class="badge ${badgeClass}">
                        ${status.completed} / ${status.total}
                    </span>
                </div>
                <div class="text-xs text-gray-600 space-y-1">
                    ${status.requirements.filter(r => r.required).map(req => {
            const iconClass = req.completed ? 'fas fa-check-circle text-green-600' : 'fas fa-times-circle text-red-600';
            const textColorClass = req.completed ? 'text-green-700' : 'text-red-700';
            return `
                        <div class="flex items-center gap-2">
                            <i class="${iconClass}"></i>
                            <span class="${textColorClass}">${Utils.escapeHTML(req.label)}</span>
                        </div>
                    `;
        }).join('')}
                </div>
            </div>
        `;
    },

    /**
     * عرض قسم الاشتراطات في النموذج (محسّن مع التصنيفات والأولويات)
     */
    renderRequirementsSection(contractorId) {
        const contractor = contractorId ? (AppState.appData.contractors || []).find(c => c.id === contractorId) : null;
        const contractorType = contractor?.type || 'contractor';
        const requirements = this.getApprovalRequirements(contractorType);
        const contractorRequirements = contractor?.approvalRequirements || {};

        const status = this.getContractorRequirementsStatus(contractorId);

        // تجميع حسب الفئة
        const requirementsByCategory = {};
        requirements.forEach(req => {
            const category = req.category || 'other';
            if (!requirementsByCategory[category]) {
                requirementsByCategory[category] = [];
            }
            requirementsByCategory[category].push(req);
        });

        // شريط التقدم
        const progressPercentage = status.total > 0 ? (status.completed / status.total) * 100 : 0;

        return `
            <!-- حالة الاشتراطات مع شريط التقدم -->
            <div class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-blue-100 rounded-lg">
                            <i class="fas fa-clipboard-check text-blue-600 text-xl"></i>
                        </div>
                        <div>
                            <h4 class="text-lg font-bold text-gray-800">حالة الاشتراطات</h4>
                            <p class="text-sm text-gray-600">${status.completed} من ${status.total} اشتراط مكتمل</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-bold ${status.allMet ? 'text-green-600' : 'text-orange-600'}">
                            ${Math.round(progressPercentage)}%
                        </div>
                        <span class="badge ${status.allMet ? 'badge-success' : 'badge-warning'} text-sm">
                            ${status.allMet ? 'جاهز للاعتماد' : 'غير مكتمل'}
                        </span>
                    </div>
                </div>
                
                <!-- شريط التقدم -->
                <div class="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div class="h-3 rounded-full transition-all duration-500 ${status.allMet ? 'bg-green-500' : 'bg-orange-500'}" 
                         style="width: ${progressPercentage}%"></div>
                </div>
                
                ${status.allMet ? `
                    <div class="flex items-center gap-2 text-green-700">
                        <i class="fas fa-check-circle"></i>
                        <span class="text-sm font-semibold">جميع الاشتراطات مستوفاة - المقاول جاهز للاعتماد</span>
                    </div>
                ` : `
                    <div class="flex items-center gap-2 text-orange-700">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span class="text-sm font-semibold">يرجى استكمال ${status.total - status.completed} اشتراط متبقي للاعتماد</span>
                    </div>
                `}
            </div>
            
            <!-- عرض الاشتراطات حسب الفئة -->
            <div class="space-y-6">
                ${Object.keys(requirementsByCategory).map(categoryId => {
                    const category = REQUIREMENT_CATEGORIES[categoryId] || REQUIREMENT_CATEGORIES.other;
                    const categoryReqs = requirementsByCategory[categoryId];
                    const categoryCompleted = categoryReqs.filter(req => {
                        const reqData = contractorRequirements[req.id] || {};
                        if (req.type === 'document') {
                            return !!(reqData && reqData.documentLink && reqData.completed);
                        } else if (req.type === 'checkbox') {
                            return !!(reqData && reqData.completed);
                        } else if (req.type === 'text') {
                            return !!(reqData && reqData.value && reqData.completed);
                        }
                        return false;
                    }).length;
                    const categoryProgress = categoryReqs.length > 0 ? (categoryCompleted / categoryReqs.length) * 100 : 0;

                    return `
                        <div class="requirement-category-section border-2 rounded-lg overflow-hidden" style="border-color: ${category.color}40;">
                            <!-- رأس الفئة -->
                            <div class="p-4 bg-gradient-to-r" style="background: linear-gradient(135deg, ${category.color}15, ${category.color}05);">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="p-2 rounded-lg" style="background: ${category.color}20;">
                                            <i class="fas ${category.icon} text-xl" style="color: ${category.color};"></i>
                                        </div>
                                        <div>
                                            <h5 class="font-bold text-gray-800">${category.label}</h5>
                                            <p class="text-xs text-gray-600">${categoryCompleted} / ${categoryReqs.length} مكتمل</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-2xl font-bold" style="color: ${category.color};">
                                            ${Math.round(categoryProgress)}%
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                                    <div class="h-2 rounded-full transition-all" 
                                         style="width: ${categoryProgress}%; background: ${category.color};"></div>
                                </div>
                            </div>
                            
                            <!-- اشتراطات الفئة -->
                            <div class="p-4 space-y-3 bg-white">
                                ${categoryReqs.map(req => {
                                    const reqData = contractorRequirements[req.id] || {};
                                    const isCompleted = reqData.completed || false;
                                    const priority = REQUIREMENT_PRIORITIES[req.priority] || REQUIREMENT_PRIORITIES.medium;
                                    
                                    // التحقق من انتهاء الصلاحية للمستندات
                                    let expiryWarning = '';
                                    if (req.hasExpiry && reqData.documentLink && reqData.expiryDate) {
                                        const expiryDate = new Date(reqData.expiryDate);
                                        const today = new Date();
                                        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                                        
                                        if (daysUntilExpiry < 0) {
                                            expiryWarning = '<span class="badge badge-danger text-xs"><i class="fas fa-exclamation-triangle ml-1"></i> منتهي الصلاحية</span>';
                                        } else if (daysUntilExpiry <= 30) {
                                            expiryWarning = `<span class="badge badge-warning text-xs"><i class="fas fa-clock ml-1"></i> ينتهي خلال ${daysUntilExpiry} يوم</span>`;
                                        }
                                    }

                                    let inputHTML = '';
                                    if (req.type === 'document') {
                                        inputHTML = `
                                            <div class="space-y-2">
                                                <input type="file" 
                                                    id="req-${req.id}-file" 
                                                    class="form-input" 
                                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                    onchange="Contractors.handleRequirementFileChange('${contractorId}', '${req.id}', this)">
                                                ${reqData.documentLink ? `
                                                    <div class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                        <i class="fas fa-check-circle text-green-600"></i>
                                                        <a href="${reqData.documentLink}" target="_blank" 
                                                           class="flex-1 text-sm text-green-700 hover:underline font-medium">
                                                            <i class="fas fa-file ml-1"></i>
                                                            ${reqData.fileName || 'المستند المرفوع'}
                                                        </a>
                                                        ${reqData.uploadedAt ? `
                                                            <span class="text-xs text-gray-500">
                                                                ${Utils.formatDate(reqData.uploadedAt)}
                                                            </span>
                                                        ` : ''}
                                                        ${expiryWarning}
                                                        <button onclick="Contractors.removeRequirementDocument('${contractorId}', '${req.id}')" 
                                                            class="btn-icon btn-icon-danger btn-sm" title="حذف المستند">
                                                            <i class="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        `;
                                    } else if (req.type === 'checkbox') {
                                        inputHTML = `
                                            <label class="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                                                <input type="checkbox" 
                                                    id="req-${req.id}-checkbox" 
                                                    ${isCompleted ? 'checked' : ''}
                                                    onchange="Contractors.handleRequirementCheckboxChange('${contractorId}', '${req.id}', this.checked)"
                                                    class="cursor-pointer">
                                                <span class="text-sm text-gray-700">تم الاستيفاء</span>
                                            </label>
                                        `;
                                    } else if (req.type === 'text') {
                                        inputHTML = `
                                            <div class="space-y-2">
                                                <input type="text" 
                                                    id="req-${req.id}-text" 
                                                    class="form-input" 
                                                    value="${Utils.escapeHTML(reqData.value || '')}"
                                                    placeholder="أدخل ${req.label.toLowerCase()}"
                                                    onchange="Contractors.handleRequirementTextChange('${contractorId}', '${req.id}', this.value)">
                                                ${reqData.value && isCompleted ? `
                                                    <div class="text-xs text-green-600 flex items-center gap-1">
                                                        <i class="fas fa-check-circle"></i>
                                                        تم إدخال البيانات
                                                    </div>
                                                ` : ''}
                                            </div>
                                        `;
                                    }

                                    return `
                                        <div class="p-4 border-2 rounded-lg transition-all ${isCompleted ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}" 
                                             data-requirement-id="${req.id}"
                                             style="border-left: 4px solid ${priority.color};">
                                            <div class="flex items-start justify-between mb-3">
                                                <div class="flex-1">
                                                    <div class="flex items-center gap-2 mb-2 flex-wrap">
                                                        <span class="px-2 py-1 text-xs font-bold rounded" style="background: ${priority.color}20; color: ${priority.color};">
                                                            ${priority.label}
                                                        </span>
                                                        ${req.required ? '<span class="badge badge-danger text-xs">مطلوب</span>' : '<span class="badge badge-secondary text-xs">اختياري</span>'}
                                                        ${req.hasExpiry ? `<span class="badge badge-info text-xs"><i class="fas fa-calendar ml-1"></i> ${req.expiryMonths} شهر</span>` : ''}
                                                        ${expiryWarning}
                                                    </div>
                                                    <label class="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                                        ${req.required ? '<span class="text-red-500 text-lg">*</span>' : ''}
                                                        ${req.label}
                                                    </label>
                                                    ${req.description ? `
                                                        <p class="text-xs text-gray-600 mt-1">${Utils.escapeHTML(req.description)}</p>
                                                    ` : ''}
                                                </div>
                                                <span class="badge ${isCompleted ? 'badge-success' : 'badge-warning'} text-xs">
                                                    ${isCompleted ? '✓ مكتمل' : '✗ غير مكتمل'}
                                                </span>
                                            </div>
                                            ${inputHTML}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * معالجة رفع ملف اشتراط
     */
    async handleRequirementFileChange(contractorId, requirementId, fileInput) {
        if (!contractorId || !requirementId || !fileInput) {
            Notification.error('بيانات غير كاملة');
            return;
        }

        if (!fileInput.files || fileInput.files.length === 0) return;

        const file = fileInput.files[0];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (file.size > maxSize) {
            Notification.error('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت');
            fileInput.value = '';
            return;
        }

        Loading.show();
        try {
            // تحويل الملف إلى Base64
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const base64Data = e.target.result.split(',')[1];
                    const mimeType = file.type;
                    const fileName = file.name;

                    // رفع الملف إلى Google Drive
                    const uploadResult = await GoogleIntegration.uploadFileToDrive(
                        base64Data,
                        fileName,
                        mimeType,
                        'Contractors'
                    );

                    if (uploadResult && uploadResult.success) {
                        // حفظ رابط المستند في بيانات المقاول
                        const contractor = (AppState.appData.contractors || []).find(c => c.id === contractorId);
                        if (contractor) {
                            if (!contractor.approvalRequirements) {
                                contractor.approvalRequirements = {};
                            }

                            // الحصول على معلومات الاشتراط
                            const requirements = this.getApprovalRequirements();
                            const requirement = requirements.find(r => r.id === requirementId);
                            
                            // حساب تاريخ الانتهاء إذا كان الاشتراط له تاريخ انتهاء
                            let expiryDate = null;
                            if (requirement && requirement.hasExpiry && requirement.expiryMonths) {
                                const expiry = new Date();
                                expiry.setMonth(expiry.getMonth() + requirement.expiryMonths);
                                expiryDate = expiry.toISOString();
                            }

                            contractor.approvalRequirements[requirementId] = {
                                completed: true,
                                documentLink: uploadResult.shareableLink || uploadResult.directLink,
                                fileName: fileName,
                                fileId: uploadResult.fileId,
                                uploadedAt: new Date().toISOString(),
                                expiryDate: expiryDate,
                                expiryMonths: requirement?.expiryMonths || null
                            };

                            // حفظ البيانات باستخدام window.DataManager
                            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                                window.DataManager.save();
                            } else {
                                Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
                            }
                            await GoogleIntegration.autoSave('Contractors', AppState.appData.contractors);

                            // تحديث حالة الاعتماد
                            this.updateContractorApprovalStatus(contractorId);

                            // تحديث العرض
                            const section = this.safeGetElementById('contractor-requirements-section');
                            if (section) {
                                const html = this.renderRequirementsSection(contractorId);
                                this.safeSetInnerHTML(section, html);
                            }

                            Notification.success('تم رفع المستند بنجاح');
                        } else {
                            Notification.error('المقاول غير موجود');
                        }
                    } else {
                        Notification.error('فشل رفع المستند: ' + (uploadResult?.message || 'خطأ غير معروف'));
                    }
                } catch (error) {
                    Utils.safeError('خطأ في معالجة الملف:', error);
                    Notification.error('حدث خطأ أثناء رفع المستند: ' + (error.message || 'خطأ غير معروف'));
                } finally {
                    Loading.hide();
                }
            };
            reader.onerror = () => {
                Loading.hide();
                Notification.error('فشل قراءة الملف');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            Loading.hide();
            Utils.safeError('خطأ في قراءة الملف:', error);
            Notification.error('حدث خطأ أثناء قراءة الملف: ' + (error.message || 'خطأ غير معروف'));
        }
    },

    /**
     * معالجة تغيير checkbox اشتراط
     */
    async handleRequirementCheckboxChange(contractorId, requirementId, checked) {
        if (!contractorId || !requirementId) {
            Notification.error('بيانات غير كاملة');
            return;
        }

        const contractor = (AppState.appData.contractors || []).find(c => c.id === contractorId);
        if (contractor) {
            if (!contractor.approvalRequirements) {
                contractor.approvalRequirements = {};
            }

            contractor.approvalRequirements[requirementId] = {
                completed: checked,
                updatedAt: new Date().toISOString()
            };

            // حفظ البيانات باستخدام window.DataManager
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            } else {
                Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
            }
            try {
                await GoogleIntegration.autoSave('Contractors', AppState.appData.contractors);
            } catch (error) {
                Utils.safeWarn('فشل الحفظ التلقائي:', error);
            }

            // تحديث حالة الاعتماد
            this.updateContractorApprovalStatus(contractorId);

            // تحديث العرض
            const section = this.safeGetElementById('contractor-requirements-section');
            if (section) {
                const html = this.renderRequirementsSection(contractorId);
                this.safeSetInnerHTML(section, html);
            }
        } else {
            Notification.error('المقاول غير موجود');
        }
    },

    /**
     * معالجة تغيير نص اشتراط
     */
    async handleRequirementTextChange(contractorId, requirementId, value) {
        if (!contractorId || !requirementId) {
            Notification.error('بيانات غير كاملة');
            return;
        }

        const contractor = (AppState.appData.contractors || []).find(c => c.id === contractorId);
        if (contractor) {
            if (!contractor.approvalRequirements) {
                contractor.approvalRequirements = {};
            }

            const trimmedValue = (value || '').trim();
            contractor.approvalRequirements[requirementId] = {
                completed: trimmedValue.length > 0,
                value: trimmedValue,
                updatedAt: new Date().toISOString()
            };

            // حفظ البيانات باستخدام window.DataManager
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            } else {
                Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
            }
            try {
                await GoogleIntegration.autoSave('Contractors', AppState.appData.contractors);
            } catch (error) {
                Utils.safeWarn('فشل الحفظ التلقائي:', error);
            }

            // تحديث حالة الاعتماد
            this.updateContractorApprovalStatus(contractorId);

            // تحديث العرض
            const section = this.safeGetElementById('contractor-requirements-section');
            if (section) {
                const html = this.renderRequirementsSection(contractorId);
                this.safeSetInnerHTML(section, html);
            }
        } else {
            Notification.error('المقاول غير موجود');
        }
    },

    /**
     * حذف مستند اشتراط
     */
    async removeRequirementDocument(contractorId, requirementId) {
        if (!confirm('هل أنت متأكد من حذف هذا المستند؟')) return;

        const contractor = (AppState.appData.contractors || []).find(c => c.id === contractorId);
        if (contractor && contractor.approvalRequirements && contractor.approvalRequirements[requirementId]) {
            delete contractor.approvalRequirements[requirementId];

            // حفظ البيانات باستخدام window.DataManager
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            } else {
                Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
            }
            await GoogleIntegration.autoSave('Contractors', AppState.appData.contractors);

            // تحديث حالة الاعتماد
            this.updateContractorApprovalStatus(contractorId);

            // تحديث العرض
            const section = this.safeGetElementById('contractor-requirements-section');
            if (section) {
                const html = this.renderRequirementsSection(contractorId);
                this.safeSetInnerHTML(section, html);
            }

            Notification.success('تم حذف المستند');
        }
    },

    /**
     * تحديث حالة اعتماد المقاول بناءً على الاشتراطات
     */
    updateContractorApprovalStatus(contractorId) {
        const contractor = (AppState.appData.contractors || []).find(c => c.id === contractorId);
        if (!contractor) return;

        const allMet = this.checkAllRequirementsMet(contractorId);

        // تحديث حالة المقاول
        if (allMet && contractor.approvalStatus !== 'approved') {
            contractor.approvalStatus = 'approved';
            contractor.approvedAt = new Date().toISOString();

            // إضافة المقاول تلقائياً إلى قائمة المعتمدين إذا لم يكن موجوداً
            this.ensureApprovedSetup();
            const approvedContractors = AppState.appData.approvedContractors || [];
            const contractorName = contractor.name || '';
            const normalizedContractorName = contractorName.trim().toLowerCase();
            const normalizedLicenseNumber = contractor.contractNumber ? contractor.contractNumber.trim() : '';

            // فحص التكرار بناءً على: contractorId، اسم الشركة + نوع الجهة، السجل التجاري
            const existingApproved = approvedContractors.find(ac => {
                // فحص التكرار بناءً على contractorId
                if (ac.contractorId === contractorId) return true;

                // فحص التكرار بناءً على اسم الشركة + نوع الجهة
                if (ac.companyName &&
                    ac.companyName.trim().toLowerCase() === normalizedContractorName &&
                    ac.entityType === 'contractor') {
                    return true;
                }

                // فحص التكرار بناءً على السجل التجاري (إذا كان موجوداً)
                if (normalizedLicenseNumber && ac.licenseNumber &&
                    ac.licenseNumber.trim() === normalizedLicenseNumber) {
                    return true;
                }

                return false;
            });

            if (!existingApproved) {
                // استخدام كود المقاول الموجود أو توليد كود جديد CON-xxx
                let entityCode = contractor.code || '';

                if (!entityCode) {
                    // توليد كود تلقائي CON-xxx
                    const contractors = AppState.appData.contractors || [];
                    let maxNumber = 0;

                    // البحث في قائمة المقاولين
                    contractors.forEach(c => {
                        if (c.code) {
                            const match = c.code.match(/CON-(\d+)/);
                            if (match) {
                                const num = parseInt(match[1], 10);
                                if (num > maxNumber) {
                                    maxNumber = num;
                                }
                            }
                        }
                    });

                    // البحث في قائمة المعتمدين
                    approvedContractors.forEach(entity => {
                        const code = entity.isoCode || entity.code;
                        if (code) {
                            // البحث عن كود CON-xxx
                            let match = code.match(/CON-(\d+)/);
                            if (match) {
                                const num = parseInt(match[1], 10);
                                if (num > maxNumber) {
                                    maxNumber = num;
                                }
                            }
                            // البحث عن كود APP-xxx القديم (للتحويل)
                            match = code.match(/APP-(\d+)/);
                            if (match) {
                                const num = parseInt(match[1], 10);
                                if (num > maxNumber) {
                                    maxNumber = num;
                                }
                            }
                        }
                    });

                    const newNumber = maxNumber + 1;
                    entityCode = `CON-${String(newNumber).padStart(3, '0')}`;

                    // تحديث كود المقاول
                    contractor.code = entityCode;
                }

                const approvedRecord = {
                    id: Utils.generateId('APPCON'),
                    contractorId: contractorId,
                    companyName: contractorName,
                    entityType: 'contractor',
                    serviceType: contractor.serviceType || '',
                    licenseNumber: contractor.contractNumber || '',
                    approvalDate: new Date().toISOString(),
                    expiryDate: contractor.endDate || '',
                    safetyReviewer: contractor.contactPerson || '',
                    status: 'approved',
                    notes: 'تم الاعتماد تلقائياً بعد استيفاء جميع الاشتراطات',
                    isoCode: entityCode, // استخدام كود CON-xxx
                    code: entityCode, // استخدام كود CON-xxx
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                approvedContractors.push(approvedRecord);
                AppState.appData.approvedContractors = approvedContractors;
            }
        } else if (!allMet && contractor.approvalStatus === 'approved') {
            contractor.approvalStatus = 'pending';
            contractor.approvedAt = null;
        }

        // حفظ البيانات باستخدام window.DataManager
        if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
            window.DataManager.save();
        } else {
            Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
        }
        try {
            GoogleIntegration.autoSave?.('Contractors', AppState.appData.contractors);
            GoogleIntegration.autoSave?.('ApprovedContractors', AppState.appData.approvedContractors);
        } catch (error) {
            Utils.safeWarn('فشل الحفظ التلقائي:', error);
        }
    },

    /**
     * فتح واجهة إدارة الاشتراطات (للمدير فقط)
     */
    openRequirementsManagement() {
        const isAdmin = (AppState.currentUser && AppState.currentUser.role === 'admin');
        if (!isAdmin) {
            Notification.error('هذه الصفحة متاحة للمدير فقط');
            return;
        }

        this.ensureRequirementsSetup();
        const requirements = this.getApprovalRequirements();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-cog ml-2"></i>
                        إدارة اشتراطات اعتماد المقاولين
                    </h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p class="text-sm text-blue-800">
                            <i class="fas fa-info-circle ml-2"></i>
                            يمكنك إضافة أو تعديل أو حذف الاشتراطات المطلوبة لاعتماد المقاولين. 
                            المقاولون لن يظهرون في قائمة المعتمدين إلا بعد استيفاء جميع الاشتراطات المطلوبة.
                        </p>
                    </div>
                    
                    <div id="requirements-list" class="space-y-3 mb-4">
                        ${requirements.map((req, index) => `
                            <div class="p-3 border rounded bg-white" data-requirement-id="${req.id}">
                                <div class="flex items-start gap-3">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-2">
                                            <span class="text-sm font-semibold text-gray-600">#${index + 1}</span>
                                            <label for="req-label-${req.id}" class="sr-only">اسم الاشتراط</label>
                                            <input type="text" 
                                                id="req-label-${req.id}"
                                                class="form-input flex-1" 
                                                value="${Utils.escapeHTML(req.label)}"
                                                data-field="label"
                                                placeholder="اسم الاشتراط">
                                        </div>
                                        <div class="grid grid-cols-2 gap-2 mt-2">
                                            <label for="req-type-${req.id}" class="sr-only">نوع الاشتراط</label>
                                            <select id="req-type-${req.id}" class="form-input" data-field="type">
                                                <option value="document" ${req.type === 'document' ? 'selected' : ''}>مستند</option>
                                                <option value="checkbox" ${req.type === 'checkbox' ? 'selected' : ''}>مربع اختيار</option>
                                                <option value="text" ${req.type === 'text' ? 'selected' : ''}>نص</option>
                                            </select>
                                            <label class="flex items-center gap-2">
                                                <input type="checkbox" 
                                                    data-field="required" 
                                                    ${req.required ? 'checked' : ''}>
                                                <span class="text-sm text-gray-700">مطلوب</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <button onclick="Contractors.moveRequirementUp('${req.id}')" 
                                            class="btn-icon btn-icon-info" 
                                            title="نقل لأعلى"
                                            ${index === 0 ? 'disabled' : ''}>
                                            <i class="fas fa-arrow-up"></i>
                                        </button>
                                        <button onclick="Contractors.moveRequirementDown('${req.id}')" 
                                            class="btn-icon btn-icon-info" 
                                            title="نقل لأسفل"
                                            ${index === requirements.length - 1 ? 'disabled' : ''}>
                                            <i class="fas fa-arrow-down"></i>
                                        </button>
                                        <button onclick="Contractors.deleteRequirement('${req.id}')" 
                                            class="btn-icon btn-icon-danger" 
                                            title="حذف">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <button onclick="Contractors.addNewRequirement()" class="btn-secondary w-full">
                        <i class="fas fa-plus ml-2"></i>
                        إضافة اشتراط جديد
                    </button>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button onclick="Contractors.saveRequirements()" class="btn-primary">
                        <i class="fas fa-save ml-2"></i>
                        حفظ التغييرات
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (event) => {
            if (event.target === modal) modal.remove();
        });
    },

    /**
     * إضافة اشتراط جديد
     */
    addNewRequirement() {
        const list = document.getElementById('requirements-list');
        if (!list) return;

        // إيجاد أول فئة (أو إنشاء فئة "أخرى" إذا لم تكن موجودة)
        let targetCategory = list.querySelector('.requirement-category-group');
        if (!targetCategory) {
            // إنشاء فئة "أخرى" إذا لم تكن موجودة
            const otherCategory = REQUIREMENT_CATEGORIES.other;
            const categoryHTML = `
                <div class="requirement-category-group" data-category="other">
                    <div class="flex items-center gap-3 mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div class="w-1 h-8 rounded" style="background: ${otherCategory.color};"></div>
                        <i class="fas ${otherCategory.icon} text-xl" style="color: ${otherCategory.color};"></i>
                        <h3 class="text-lg font-bold text-gray-800">${otherCategory.label}</h3>
                        <span class="badge badge-info">0 اشتراط</span>
                    </div>
                    <div class="space-y-3 ml-6"></div>
                </div>
            `;
            list.insertAdjacentHTML('beforeend', categoryHTML);
            targetCategory = list.querySelector('.requirement-category-group');
        }

        const categoryContainer = targetCategory.querySelector('.space-y-3');
        const existingItems = categoryContainer.querySelectorAll('.requirement-item').length;
        const newId = `req_${Date.now()}`;
        const priority = REQUIREMENT_PRIORITIES.medium;

        const reqHTML = `
            <div class="requirement-item p-4 border-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-all cursor-move" 
                 data-requirement-id="${newId}"
                 data-category="${targetCategory.getAttribute('data-category')}"
                 draggable="true"
                 style="border-color: ${priority.color}20;">
                <div class="flex items-start gap-4">
                    <div class="drag-handle cursor-grab active:cursor-grabbing pt-1">
                        <i class="fas fa-grip-vertical text-gray-400 text-xl"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3">
                            <span class="px-2 py-1 text-xs font-bold rounded" style="background: ${priority.color}20; color: ${priority.color};">
                                ${priority.label}
                            </span>
                            <span class="text-sm font-semibold text-gray-500">#${existingItems + 1}</span>
                            <span class="badge badge-danger text-xs">مطلوب</span>
                        </div>
                        <input type="text" 
                            class="form-input mb-3 font-semibold text-gray-800" 
                            value="اشتراط جديد"
                            data-field="label"
                            placeholder="اسم الاشتراط">
                        <textarea class="form-input mb-3 text-sm" 
                            data-field="description"
                            placeholder="وصف الاشتراط (اختياري)"
                            rows="2"></textarea>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <select class="form-input text-sm" data-field="type">
                                <option value="document" selected>📄 مستند</option>
                                <option value="checkbox">☑️ مربع اختيار</option>
                                <option value="text">📝 نص</option>
                            </select>
                            <select class="form-input text-sm" data-field="category">
                                ${Object.values(REQUIREMENT_CATEGORIES).map(cat => `
                                    <option value="${cat.id}" ${cat.id === targetCategory.getAttribute('data-category') ? 'selected' : ''}>${cat.label}</option>
                                `).join('')}
                            </select>
                            <select class="form-input text-sm" data-field="priority">
                                ${Object.values(REQUIREMENT_PRIORITIES).map(pri => `
                                    <option value="${pri.id}" ${pri.id === 'medium' ? 'selected' : ''}>${pri.label}</option>
                                `).join('')}
                            </select>
                            <label class="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                                <input type="checkbox" 
                                    data-field="required" 
                                    checked
                                    class="cursor-pointer">
                                <span class="text-sm text-gray-700">مطلوب</span>
                            </label>
                        </div>
                        <div class="grid grid-cols-2 gap-3 mt-3">
                            <label class="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                                <input type="checkbox" 
                                    data-field="hasExpiry" 
                                    class="cursor-pointer"
                                    onchange="Contractors.toggleExpiryFields(this)">
                                <span class="text-sm text-gray-700">له تاريخ انتهاء</span>
                            </label>
                            <div class="expiry-fields" style="display: none;">
                                <input type="number" 
                                    class="form-input text-sm" 
                                    value="12"
                                    data-field="expiryMonths"
                                    placeholder="عدد الأشهر"
                                    min="1" max="60">
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <button onclick="Contractors.moveRequirementUp('${newId}')" 
                            class="btn-icon btn-icon-info" 
                            title="نقل لأعلى">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button onclick="Contractors.moveRequirementDown('${newId}')" 
                            class="btn-icon btn-icon-info" 
                            title="نقل لأسفل">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button onclick="Contractors.deleteRequirement('${newId}')" 
                            class="btn-icon btn-icon-danger" 
                            title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        categoryContainer.insertAdjacentHTML('beforeend', reqHTML);
        
        // تحديث عدد الاشتراطات في الفئة
        const badge = targetCategory.querySelector('.badge');
        if (badge) {
            const count = categoryContainer.querySelectorAll('.requirement-item').length;
            badge.textContent = `${count} اشتراط`;
        }

        // إعداد السحب والإفلات للعنصر الجديد
        this.setupDragAndDropForItem(categoryContainer.querySelector(`[data-requirement-id="${newId}"]`));
    },

    /**
     * إعداد السحب والإفلات للاشتراطات
     */
    setupDragAndDrop() {
        const list = document.getElementById('requirements-list');
        if (!list) return;

        list.querySelectorAll('.requirement-item').forEach(item => {
            this.setupDragAndDropForItem(item);
        });
    },

    /**
     * إعداد السحب والإفلات لعنصر واحد
     */
    setupDragAndDropForItem(item) {
        if (!item) return;

        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', item.outerHTML);
            e.dataTransfer.setData('text/plain', item.getAttribute('data-requirement-id'));
            item.classList.add('dragging');
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = this.getDragAfterElement(item.parentElement, e.clientY);
            const dragging = document.querySelector('.dragging');
            
            if (afterElement == null) {
                item.parentElement.appendChild(dragging);
            } else {
                item.parentElement.insertBefore(dragging, afterElement);
            }
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            this.saveRequirements(); // حفظ الترتيب الجديد
        });
    },

    /**
     * الحصول على العنصر الذي يجب إدراج العنصر المسحوب بعده
     */
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.requirement-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },

    /**
     * حفظ الاشتراطات (محدث لدعم الحقول الجديدة)
     */
    saveRequirements() {
        const list = document.getElementById('requirements-list');
        if (!list) return;

        // جمع جميع الاشتراطات من جميع الفئات
        const allItems = [];
        list.querySelectorAll('.requirement-category-group').forEach(group => {
            group.querySelectorAll('.requirement-item').forEach(item => {
                allItems.push(item);
            });
        });

        const requirements = allItems.map((item, index) => {
            const reqId = item.getAttribute('data-requirement-id');
            const labelInput = item.querySelector('[data-field="label"]');
            const typeSelect = item.querySelector('[data-field="type"]');
            const requiredCheckbox = item.querySelector('[data-field="required"]');
            const categorySelect = item.querySelector('[data-field="category"]');
            const prioritySelect = item.querySelector('[data-field="priority"]');
            const hasExpiryCheckbox = item.querySelector('[data-field="hasExpiry"]');
            const expiryMonthsInput = item.querySelector('[data-field="expiryMonths"]');
            const descriptionTextarea = item.querySelector('[data-field="description"]');

            const requirement = {
                id: reqId,
                label: labelInput?.value.trim() || '',
                type: typeSelect?.value || 'document',
                required: requiredCheckbox?.checked || false,
                order: index + 1,
                category: categorySelect?.value || 'other',
                priority: prioritySelect?.value || 'medium',
                hasExpiry: hasExpiryCheckbox?.checked || false,
                expiryMonths: hasExpiryCheckbox?.checked ? parseInt(expiryMonthsInput?.value || 12) : null,
                description: descriptionTextarea?.value.trim() || '',
                applicableTypes: ['contractor', 'supplier'] // افتراضي لجميع الأنواع
            };

            return requirement;
        }).filter(req => req.label.length > 0);

        if (requirements.length === 0) {
            Notification.warning('يجب إضافة اشتراط واحد على الأقل');
            return;
        }

        this.ensureRequirementsSetup();
        AppState.companySettings.contractorApprovalRequirements = requirements;
        
        // حفظ البيانات باستخدام window.DataManager
        if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
            window.DataManager.save();
        } else {
            Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
        }

        Notification.success(`تم حفظ ${requirements.length} اشتراط بنجاح`);

        // تحديث محتوى تبويب الاشتراطات إذا كان مفتوحاً
        const requirementsContent = this.safeGetElementById('contractors-requirements-content');
        if (requirementsContent && this.currentTab === 'requirements') {
            this.renderRequirementsManagementSection().then(html => {
                // ✅ استخدام safeSetInnerHTML بدلاً من innerHTML مباشرة
                if (this.safeSetInnerHTML(requirementsContent, html)) {
                    this.setupDragAndDrop(); // إعادة إعداد السحب والإفلات
                }
            });
        }

        // إغلاق النافذة إذا كانت مفتوحة
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
    },

    /**
     * نقل اشتراط لأعلى
     */
    moveRequirementUp(reqId) {
        const list = document.getElementById('requirements-list');
        if (!list) return;

        const items = Array.from(list.children);
        const index = items.findIndex(item => item.getAttribute('data-requirement-id') === reqId);

        if (index > 0) {
            const item = items[index];
            const prevItem = items[index - 1];
            list.insertBefore(item, prevItem);
        }
    },

    /**
     * نقل اشتراط لأسفل
     */
    moveRequirementDown(reqId) {
        const list = document.getElementById('requirements-list');
        if (!list) return;

        const items = Array.from(list.children);
        const index = items.findIndex(item => item.getAttribute('data-requirement-id') === reqId);

        if (index < items.length - 1) {
            const item = items[index];
            const nextItem = items[index + 1];
            list.insertBefore(item, nextItem.nextSibling);
        }
    },

    /**
     * حذف اشتراط
     */
    deleteRequirement(reqId) {
        if (!confirm('هل أنت متأكد من حذف هذا الاشتراط؟')) return;

        const list = document.getElementById('requirements-list');
        if (!list) return;

        const item = list.querySelector(`[data-requirement-id="${reqId}"]`);
        if (item) {
            item.remove();
        }
    },

    /**
     * فلترة الاشتراطات حسب الفئة
     */
    filterRequirementsByCategory(categoryId) {
        // تحديث الأزرار النشطة
        document.querySelectorAll('.requirement-category-filter').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-category') === categoryId) {
                btn.classList.add('active');
            }
        });

        // إظهار/إخفاء الاشتراطات
        document.querySelectorAll('.requirement-category-group').forEach(group => {
            if (categoryId === 'all' || group.getAttribute('data-category') === categoryId) {
                group.style.display = 'block';
                group.style.animation = 'fadeIn 0.3s ease-in';
            } else {
                group.style.display = 'none';
            }
        });
    },

    /**
     * تبديل حقول تاريخ الانتهاء
     */
    toggleExpiryFields(checkbox) {
        const item = checkbox.closest('.requirement-item');
        if (!item) return;
        const expiryFields = item.querySelector('.expiry-fields');
        if (!expiryFields) return;
        if (checkbox.checked) {
            expiryFields.style.display = 'block';
            const expiryInput = expiryFields.querySelector('input');
            if (expiryInput) {
                expiryInput.value = expiryInput.value || '12';
            }
        } else {
            expiryFields.style.display = 'none';
        }
    },

    /**
     * تصدير قالب الاشتراطات
     */
    exportRequirementsTemplate() {
        this.ensureRequirementsSetup();
        const requirements = this.getApprovalRequirements();
        
        const template = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            requirements: requirements
        };

        const dataStr = JSON.stringify(template, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contractor-requirements-template-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        Notification.success('تم تصدير قالب الاشتراطات بنجاح');
    },

    /**
     * استيراد قالب الاشتراطات
     */
    importRequirementsTemplate() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const template = JSON.parse(text);
                
                if (!template.requirements || !Array.isArray(template.requirements)) {
                    Notification.error('ملف القالب غير صحيح');
                    return;
                }

                if (!confirm(`هل تريد استيراد ${template.requirements.length} اشتراط؟ سيتم استبدال الاشتراطات الحالية.`)) {
                    return;
                }

                this.ensureRequirementsSetup();
                // تحديث المعرفات والترتيب
                template.requirements.forEach((req, index) => {
                    req.id = req.id || `req_${Date.now()}_${index}`;
                    req.order = index + 1;
                    // تعيين قيم افتراضية للحقول المفقودة
                    req.category = req.category || 'other';
                    req.priority = req.priority || 'medium';
                    req.hasExpiry = req.hasExpiry || false;
                    req.expiryMonths = req.expiryMonths || 12;
                    req.applicableTypes = req.applicableTypes || ['contractor', 'supplier'];
                });

                AppState.companySettings.contractorApprovalRequirements = template.requirements;
                
                if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                    window.DataManager.save();
                }

                Notification.success('تم استيراد القالب بنجاح');
                
                // إعادة تحميل الواجهة
                if (this.currentTab === 'requirements') {
                    const requirementsContent = this.safeGetElementById('contractors-requirements-content');
                    if (requirementsContent) {
                        this.renderRequirementsManagementSection().then(html => {
                            // ✅ استخدام safeSetInnerHTML بدلاً من innerHTML مباشرة
                            this.safeSetInnerHTML(requirementsContent, html);
                        });
                    }
                }
            } catch (error) {
                Utils.safeError('خطأ في استيراد القالب:', error);
                Notification.error('فشل استيراد القالب: ' + error.message);
            }
        };
        input.click();
    },

    /**
     * تعديل جماعي للاشتراطات
     */
    bulkEditRequirements() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 class="modal-title">التعديل الجماعي</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">تغيير الفئة لجميع الاشتراطات المحددة:</label>
                            <select id="bulk-category" class="form-input">
                                <option value="">لا تغيير</option>
                                ${Object.values(REQUIREMENT_CATEGORIES).map(cat => `
                                    <option value="${cat.id}">${cat.label}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">تغيير الأولوية لجميع الاشتراطات المحددة:</label>
                            <select id="bulk-priority" class="form-input">
                                <option value="">لا تغيير</option>
                                ${Object.values(REQUIREMENT_PRIORITIES).map(pri => `
                                    <option value="${pri.id}">${pri.label}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="flex items-center gap-2">
                                <input type="checkbox" id="bulk-required">
                                <span class="text-sm text-gray-700">تعيين جميع الاشتراطات كمطلوبة</span>
                            </label>
                        </div>
                        <div>
                            <label class="flex items-center gap-2">
                                <input type="checkbox" id="bulk-has-expiry">
                                <span class="text-sm text-gray-700">إضافة تاريخ انتهاء لجميع الاشتراطات</span>
                            </label>
                        </div>
                        ${document.getElementById('bulk-has-expiry') ? '' : `
                            <div id="bulk-expiry-months-container" style="display: none;">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">عدد أشهر الصلاحية:</label>
                                <input type="number" id="bulk-expiry-months" class="form-input" value="12" min="1" max="60">
                            </div>
                        `}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button class="btn-primary" onclick="Contractors.applyBulkEdit()">تطبيق التعديلات</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // إضافة مستمع لتغيير checkbox تاريخ الانتهاء
        setTimeout(() => {
            const expiryCheckbox = document.getElementById('bulk-has-expiry');
            const expiryContainer = document.getElementById('bulk-expiry-months-container');
            if (expiryCheckbox && expiryContainer) {
                expiryCheckbox.addEventListener('change', (e) => {
                    expiryContainer.style.display = e.target.checked ? 'block' : 'none';
                });
            }
        }, 100);
    },

    /**
     * تطبيق التعديلات الجماعية
     */
    applyBulkEdit() {
        const list = document.getElementById('requirements-list');
        if (!list) return;

        const category = document.getElementById('bulk-category')?.value;
        const priority = document.getElementById('bulk-priority')?.value;
        const required = document.getElementById('bulk-required')?.checked;
        const hasExpiry = document.getElementById('bulk-has-expiry')?.checked;
        const expiryMonths = document.getElementById('bulk-expiry-months')?.value;

        const items = list.querySelectorAll('.requirement-item');
        let updated = 0;

        items.forEach(item => {
            if (category) {
                const categorySelect = item.querySelector('[data-field="category"]');
                if (categorySelect) categorySelect.value = category;
            }
            if (priority) {
                const prioritySelect = item.querySelector('[data-field="priority"]');
                if (prioritySelect) prioritySelect.value = priority;
            }
            if (required !== undefined) {
                const requiredCheckbox = item.querySelector('[data-field="required"]');
                if (requiredCheckbox) requiredCheckbox.checked = required;
            }
            if (hasExpiry !== undefined) {
                const expiryCheckbox = item.querySelector('[data-field="hasExpiry"]');
                if (expiryCheckbox) {
                    expiryCheckbox.checked = hasExpiry;
                    this.toggleExpiryFields(expiryCheckbox);
                    if (hasExpiry && expiryMonths) {
                        const expiryInput = item.querySelector('[data-field="expiryMonths"]');
                        if (expiryInput) expiryInput.value = expiryMonths;
                    }
                }
            }
            updated++;
        });

        Notification.success(`تم تحديث ${updated} اشتراط`);
        document.querySelector('.modal-overlay')?.remove();
    },

    // ===== نظام اعتماد المقاولين =====

    /**
     * التأكد من وجود بيانات طلبات الاعتماد
     * ✅ إصلاح: التأكد من وجود AppState و appData قبل الوصول للبيانات
     */
    /**
     * ✅ إصلاح شامل: دالة ensureData مثل العيادة الطبية - تحفظ البيانات في localStorage
     * تأكد من وجود جميع البيانات وحفظها بشكل ثابت
     */
    ensureData() {
        if (!AppState) {
            if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                Utils.safeWarn('⚠️ AppState غير موجود');
            }
            return;
        }
        
        const data = AppState.appData || {};
        let mutated = false;
        
        // ✅ التأكد من وجود جميع المصفوفات (مثل العيادة الطبية)
        if (!Array.isArray(data.contractorApprovalRequests)) {
            data.contractorApprovalRequests = [];
            mutated = true;
        }
        if (!Array.isArray(data.contractorDeletionRequests)) {
            data.contractorDeletionRequests = [];
            mutated = true;
        }
        if (!Array.isArray(data.approvedContractors)) {
            data.approvedContractors = [];
            mutated = true;
        }
        if (!Array.isArray(data.contractorEvaluations)) {
            data.contractorEvaluations = [];
            mutated = true;
        }
        if (!Array.isArray(data.contractors)) {
            data.contractors = [];
            mutated = true;
        }
        
        // ✅ حفظ البيانات في AppState مباشرة
        AppState.appData = data;
        
        // ✅ حفظ في localStorage فقط عند تغيير البيانات (منع استدعاء الحفظ عند كل دخول للموديول)
        if (mutated && typeof window.DataManager !== 'undefined' && window.DataManager.save) {
            try {
                window.DataManager.save();
            } catch (saveErr) {
                Utils.safeWarn('⚠️ فشل حفظ البيانات المحلية عند تهيئة المقاولين:', saveErr);
            }
        }
    },

    ensureApprovalRequestsSetup() {
        // ✅ إصلاح: استخدام ensureData الشاملة بدلاً من الكود المتكرر
        this.ensureData();
    },

    ensureDeletionRequestsSetup() {
        // ✅ إصلاح: استخدام ensureData الشاملة بدلاً من الكود المتكرر
        this.ensureData();
    },

    /**
     * إرسال طلب حذف (وظيفة مساعدة)
     */
    async submitDeletionRequest(deletionRequest) {
        this.ensureDeletionRequestsSetup();
        AppState.appData.contractorDeletionRequests.push(deletionRequest);

        // حفظ محلي
        if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
            window.DataManager.save();
        }

        // حفظ في Google Sheets
        try {
            const result = await GoogleIntegration.callBackend('addContractorDeletionRequest', deletionRequest);
            if (result && result.success) {
                Notification.success('تم إرسال طلب الحذف بنجاح. سيتم مراجعته من قبل مدير النظام.');
                return true;
            } else {
                Notification.warning('تم حفظ الطلب محلياً. سيتم مزامنته عند الاتصال بالإنترنت.');
                return false;
            }
        } catch (error) {
            Utils.safeWarn('فشل إرسال طلب الحذف:', error);
            Notification.warning('تم حفظ الطلب محلياً. سيتم مزامنته عند الاتصال بالإنترنت.');
            return false;
        }
    },

    /**
     * عرض قسم إرسال طلب الاعتماد
     * ✅ إصلاح: جعلها synchronous لضمان التحميل الفوري
     * ✅ محسّن: استخدام cache وتحسين الوصول للبيانات
     */
    renderApprovalRequestSection() {
        // ✅ إصلاح: التأكد من الإعداد مرة واحدة فقط
        this.ensureApprovalRequestsSetup();
        this.ensureDeletionRequestsSetup();
        
        // ✅ إصلاح: التأكد من وجود AppState و appData قبل الوصول للبيانات
        if (!AppState || !AppState.appData) {
            // إذا لم تكن البيانات جاهزة، عرض placeholder ثم تحديثه لاحقاً
            return this.renderApprovalRequestSectionPlaceholder();
        }
        
        const isAdmin = Permissions.isAdmin();
        
        // ✅ تحسين: استخدام try-catch لتجنب الأخطاء التي قد تبطئ التحميل
        let myRequests = [];
        let pendingRequests = [];
        
        try {
            // ✅ إصلاح: التأكد من أن البيانات موجودة قبل الوصول إليها
            if (Array.isArray(AppState.appData.contractorApprovalRequests) && 
                Array.isArray(AppState.appData.contractorDeletionRequests)) {
                myRequests = this.getMyApprovalRequests();
            }
        } catch (error) {
            Utils.safeWarn('خطأ في تحميل طلباتي:', error);
            myRequests = [];
        }
        
        if (isAdmin) {
            try {
                if (Array.isArray(AppState.appData.contractorApprovalRequests) && 
                    Array.isArray(AppState.appData.contractorDeletionRequests)) {
                    pendingRequests = this.getPendingApprovalRequests();
                }
            } catch (error) {
                Utils.safeWarn('خطأ في تحميل طلبات المراجعة:', error);
                pendingRequests = [];
            }
        }

        return `
            <div class="content-card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-paper-plane ml-2"></i>
                        إرسال طلب اعتماد مقاول أو مقدم خدمة
                    </h2>
                </div>
                <div class="card-body space-y-6">
                    <div class="bg-blue-50 border border-blue-200 rounded p-4">
                        <p class="text-sm text-blue-800">
                            <i class="fas fa-info-circle ml-2"></i>
                            يمكنك إرسال طلب اعتماد مقاول أو مقدم خدمة جديد. سيتم إرسال الطلب إلى مدير النظام للمراجعة والموافقة.
                        </p>
                    </div>
                    
                    <div>
                        <button id="send-approval-request-btn" class="btn-primary">
                            <i class="fas fa-plus ml-2"></i>
                            إرسال طلب اعتماد جديد
                        </button>
                    </div>

                    <div class="border-t pt-4">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">
                            <i class="fas fa-list ml-2"></i>
                            طلباتي
                        </h3>
                        <div id="my-approval-requests-container">
                            ${this.renderApprovalRequestsTable(myRequests, false)}
                        </div>
                    </div>

                    ${isAdmin ? `
                        <div class="border-t pt-4">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i class="fas fa-clipboard-check ml-2"></i>
                                طلبات قيد المراجعة (للمدير)
                            </h3>
                            <div id="pending-approval-requests-container">
                                ${this.renderApprovalRequestsTable(pendingRequests, true)}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * ✅ إصلاح: عرض placeholder عند عدم جاهزية البيانات
     */
    renderApprovalRequestSectionPlaceholder() {
        const isAdmin = Permissions.isAdmin();
        const circuitOpen = (typeof GoogleIntegration !== 'undefined' &&
            GoogleIntegration?._circuitBreaker?.isOpen);
        const remainingSeconds = circuitOpen && GoogleIntegration?._circuitBreaker?.openUntil
            ? Math.max(0, Math.ceil((GoogleIntegration._circuitBreaker.openUntil - Date.now()) / 1000))
            : null;

        return `
            <div class="content-card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-paper-plane ml-2"></i>
                        إرسال طلب اعتماد مقاول أو مقدم خدمة
                    </h2>
                </div>
                <div class="card-body space-y-6">
                    <div class="bg-blue-50 border border-blue-200 rounded p-4">
                        <p class="text-sm text-blue-800">
                            <i class="fas fa-info-circle ml-2"></i>
                            يمكنك إرسال طلب اعتماد مقاول أو مقدم خدمة جديد. سيتم إرسال الطلب إلى مدير النظام للمراجعة والموافقة.
                        </p>
                    </div>

                    ${circuitOpen ? `
                        <div class="bg-yellow-50 border border-yellow-200 rounded p-4">
                            <p class="text-sm text-yellow-800">
                                <i class="fas fa-exclamation-triangle ml-2"></i>
                                تعذر الاتصال بالخادم مؤقتاً (Circuit Breaker مفتوح)
                                ${remainingSeconds !== null ? `- إعادة المحاولة بعد ${remainingSeconds} ثانية` : ''}
                            </p>
                            <div class="mt-3">
                                <button type="button" class="btn-secondary" onclick="Contractors.bootstrapApprovalRequestsData()">
                                    <i class="fas fa-sync ml-2"></i>
                                    إعادة المحاولة
                                </button>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div>
                        <button id="send-approval-request-btn" class="btn-primary">
                            <i class="fas fa-plus ml-2"></i>
                            إرسال طلب اعتماد جديد
                        </button>
                    </div>

                    <div class="border-t pt-4">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">
                            <i class="fas fa-list ml-2"></i>
                            طلباتي
                        </h3>
                        <div id="my-approval-requests-container">
                            <div class="empty-state">
                                <div style="width: 300px; margin: 0 auto 16px;">
                                    <div style="width: 100%; height: 6px; background: rgba(59, 130, 246, 0.2); border-radius: 3px; overflow: hidden;">
                                        <div style="height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb, #3b82f6); background-size: 200% 100%; border-radius: 3px; animation: loadingProgress 1.5s ease-in-out infinite;"></div>
                                    </div>
                                </div>
                                <p class="text-gray-500">جاري تحميل البيانات...</p>
                            </div>
                        </div>
                    </div>

                    ${isAdmin ? `
                        <div class="border-t pt-4">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i class="fas fa-clipboard-check ml-2"></i>
                                طلبات قيد المراجعة (للمدير)
                            </h3>
                            <div id="pending-approval-requests-container">
                                <div class="empty-state">
                                    <div style="width: 300px; margin: 0 auto 16px;">
                                        <div style="width: 100%; height: 6px; background: rgba(59, 130, 246, 0.2); border-radius: 3px; overflow: hidden;">
                                            <div style="height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb, #3b82f6); background-size: 200% 100%; border-radius: 3px; animation: loadingProgress 1.5s ease-in-out infinite;"></div>
                                        </div>
                                    </div>
                                    <p class="text-gray-500">جاري تحميل البيانات...</p>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * عرض جدول طلبات الاعتماد
     */
    renderApprovalRequestsTable(requests, isAdminView = false) {
        if (!requests || requests.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-inbox text-4xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500">لا توجد طلبات ${isAdminView ? 'قيد المراجعة' : 'مسجلة'}</p>
                </div>
            `;
        }

        return `
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>نوع الطلب</th>
                            <th>اسم المقاول / الجهة</th>
                            <th>تاريخ الإرسال</th>
                            <th>الحالة</th>
                            ${isAdminView ? '<th>الإجراءات</th>' : '<th>التفاصيل</th>'}
                        </tr>
                    </thead>
                    <tbody>
                        ${requests.map(request => {
            // ✅ تحسين: إظهار حالة المزامنة للطلبات المحلية
            let syncStatusBadge = '';
            if (request._isPendingSync) {
                syncStatusBadge = '<span class="badge badge-info" title="قيد المزامنة مع الخادم"><i class="fas fa-sync fa-spin ml-1"></i> قيد المزامنة</span>';
            } else if (request._syncError) {
                syncStatusBadge = '<span class="badge badge-warning" title="' + (request._syncErrorMessage || 'فشل المزامنة') + '"><i class="fas fa-exclamation-triangle ml-1"></i> خطأ في المزامنة</span>';
            }
            
            const statusBadge = this.getApprovalRequestStatusBadge(request.status);
            const isDeletionRequest = request.requestCategory === 'deletion';
            const isEvaluationRequest = !isDeletionRequest && request.requestType === 'evaluation';
            let requestType;
            if (isDeletionRequest) {
                requestType = request.requestType === 'contractor' ? 'حذف مقاول' :
                    request.requestType === 'approved_entity' ? 'حذف معتمد' :
                        request.requestType === 'evaluation' ? 'حذف تقييم' : 'حذف';
            } else if (isEvaluationRequest) {
                requestType = 'طلب تقييم';
            } else {
                requestType = request.requestType === 'contractor' ? 'اعتماد مقاول' : 'اعتماد مورد';
            }
            const entityName = isDeletionRequest
                ? (request.entityName || request.companyName || '')
                : isEvaluationRequest
                    ? (request.contractorName || '')
                    : (request.companyName || request.contractorName || '');

            return `
                                <tr ${request._isPendingSync ? 'style="opacity: 0.8;"' : ''}>
                                    <td>
                                        ${isDeletionRequest ? '<span class="badge badge-warning">حذف</span> ' : ''}
                                        ${isEvaluationRequest ? '<span class="badge badge-info">تقييم</span> ' : ''}
                                        ${requestType}
                                    </td>
                                    <td>${Utils.escapeHTML(entityName)}</td>
                                    <td>${request.createdAt ? Utils.formatDate(request.createdAt) : '-'}</td>
                                    <td>
                                        ${statusBadge}
                                        ${syncStatusBadge ? '<br>' + syncStatusBadge : ''}
                                    </td>
                                    <td>
                                        ${isAdminView ? `
                                            <div class="flex items-center gap-2">
                                                <button class="btn-icon btn-icon-info" title="عرض التفاصيل" onclick="Contractors.viewApprovalRequest('${request.id}', '${isDeletionRequest ? 'deletion' : 'approval'}')">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                ${(request.status === 'pending' || request.status === 'under_review') ? `
                                                    <button class="btn-icon btn-icon-success" title="اعتماد" onclick="Contractors.approveRequest('${request.id}', '${isDeletionRequest ? 'deletion' : 'approval'}')">
                                                        <i class="fas fa-check"></i>
                                                    </button>
                                                    <button class="btn-icon btn-icon-danger" title="رفض" onclick="Contractors.rejectRequest('${request.id}', '${isDeletionRequest ? 'deletion' : 'approval'}')">
                                                        <i class="fas fa-times"></i>
                                                    </button>
                                                ` : ''}
                                            </div>
                                        ` : `
                                            <button class="btn-icon btn-icon-info" title="عرض التفاصيل" onclick="Contractors.viewApprovalRequest('${request.id}', '${isDeletionRequest ? 'deletion' : 'approval'}')">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        `}
                                    </td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * الحصول على طلبات الاعتماد الخاصة بالمستخدم
     * ✅ محسّن: تحسين الأداء وتقليل العمليات غير الضرورية
     */
    getMyApprovalRequests() {
        // ✅ تحسين: التأكد من الإعداد مرة واحدة فقط
        if (!Array.isArray(AppState.appData.contractorApprovalRequests)) {
            AppState.appData.contractorApprovalRequests = [];
        }
        if (!Array.isArray(AppState.appData.contractorDeletionRequests)) {
            AppState.appData.contractorDeletionRequests = [];
        }
        
        const currentUserId = AppState.currentUser?.id || '';
        if (!currentUserId) return [];
        
        // ✅ تحسين: استخدام filter و map بشكل أكثر كفاءة
        const approvalRequests = AppState.appData.contractorApprovalRequests
            .filter(req => req && req.createdBy === currentUserId)
            .map(req => ({ ...req, requestCategory: 'approval' }));
        
        const deletionRequests = AppState.appData.contractorDeletionRequests
            .filter(req => req && req.createdBy === currentUserId)
            .map(req => ({ ...req, requestCategory: 'deletion' }));
        
        // ✅ تحسين: دمج وترتيب في خطوة واحدة
        const allRequests = [...approvalRequests, ...deletionRequests];
        return allRequests.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA; // الأحدث أولاً
        });
    },

    /**
     * الحصول على طلبات الاعتماد قيد المراجعة (للمدير)
     * ✅ إصلاح: استثناء الطلبات التي أنشأها المدير نفسه لمنع التكرار
     */
    getPendingApprovalRequests() {
        // ✅ تحسين: التأكد من الإعداد مرة واحدة فقط
        if (!Array.isArray(AppState.appData.contractorApprovalRequests)) {
            AppState.appData.contractorApprovalRequests = [];
        }
        if (!Array.isArray(AppState.appData.contractorDeletionRequests)) {
            AppState.appData.contractorDeletionRequests = [];
        }
        
        // ✅ إصلاح: الحصول على ID المستخدم الحالي لاستثناء طلباته من قائمة المراجعة
        const currentUserId = AppState.currentUser?.id || '';
        
        // ✅ إصلاح: فلترة الطلبات قيد المراجعة مع استثناء طلبات المستخدم نفسه
        const approvalRequests = AppState.appData.contractorApprovalRequests
            .filter(req => req && 
                (req.status === 'pending' || req.status === 'under_review') &&
                req.createdBy !== currentUserId) // ✅ استثناء طلبات المستخدم نفسه
            .map(req => ({ ...req, requestCategory: 'approval' }));
        
        const deletionRequests = AppState.appData.contractorDeletionRequests
            .filter(req => req && 
                (req.status === 'pending' || req.status === 'under_review') &&
                req.createdBy !== currentUserId) // ✅ استثناء طلبات المستخدم نفسه
            .map(req => ({ ...req, requestCategory: 'deletion' }));
        
        // ✅ تحسين: دمج وترتيب في خطوة واحدة
        const allRequests = [...approvalRequests, ...deletionRequests];
        return allRequests.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA - dateB; // الأقدم أولاً (للمراجعة)
        });
    },

    /**
     * الحصول على شارة حالة طلب الاعتماد
     */
    getApprovalRequestStatusBadge(status) {
        const normalizedStatus = String(status || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/-/g, '_');
        const statusMap = {
            'pending': { label: 'تم الإرسال', class: 'badge-warning' },
            'under_review': { label: 'تحت المراجعة', class: 'badge-info' },
            'approved': { label: 'معتمد', class: 'badge-success' },
            'rejected': { label: 'مرفوض', class: 'badge-danger' }
        };
        const statusInfo = statusMap[normalizedStatus] || { label: 'غير معروف', class: 'badge-secondary' };
        return `<span class="badge ${statusInfo.class}">${statusInfo.label}</span>`;
    },

    /**
     * عرض نموذج إرسال طلب الاعتماد
     */
    showApprovalRequestForm() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-paper-plane ml-2"></i>
                        إرسال طلب اعتماد مقاول أو مقدم خدمة
                    </h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="approval-request-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">نوع الطلب *</label>
                            <select id="approval-request-type" class="form-input" required>
                                <option value="">اختر نوع الطلب</option>
                                <option value="contractor">اعتماد مقاول جديد</option>
                                <option value="supplier">اعتماد مورد جديد</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">اسم الشركة / المقاول *</label>
                                <input type="text" id="approval-request-company-name" class="form-input" required placeholder="اسم الشركة أو المقاول">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">نوع الخدمة / النشاط *</label>
                                <input type="text" id="approval-request-service-type" class="form-input" required placeholder="نوع الخدمة أو النشاط">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">رقم السجل التجاري / الترخيص</label>
                                <input type="text" id="approval-request-license" class="form-input" placeholder="رقم السجل التجاري أو الترخيص">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الشخص المسؤول</label>
                                <input type="text" id="approval-request-contact-person" class="form-input" placeholder="اسم الشخص المسؤول">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">رقم الهاتف</label>
                                <input type="tel" id="approval-request-phone" class="form-input" placeholder="رقم الهاتف">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">البريد الإلكتروني</label>
                                <input type="email" id="approval-request-email" class="form-input" placeholder="البريد الإلكتروني">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">ملاحظات إضافية</label>
                            <textarea id="approval-request-notes" class="form-input" rows="4" placeholder="أي معلومات إضافية قد تساعد في مراجعة الطلب"></textarea>
                        </div>
                        <div class="border-t pt-4">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-paperclip ml-2"></i>
                                المرفقات
                            </label>
                            <input type="file" id="approval-request-attachments" class="form-input" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx">
                            <p class="text-xs text-gray-500 mt-1">يمكنك رفع ملفات متعددة (PDF, Word, Excel, صور). الحد الأقصى لحجم كل ملف 5MB.</p>
                            <div id="approval-request-attachments-list" class="mt-3 space-y-2"></div>
                        </div>
                        ${Permissions.isAdmin() ? `
                        <div class="border-t pt-4">
                            <div class="flex items-center justify-between mb-2">
                                <label class="block text-sm font-semibold text-gray-700">
                                    <i class="fas fa-cog ml-2"></i>
                                    البنود المطلوبة الإضافية (للمدير فقط)
                                </label>
                                <button type="button" id="add-custom-field-btn" class="btn-secondary btn-sm">
                                    <i class="fas fa-plus ml-1"></i>
                                    إضافة بند
                                </button>
                            </div>
                            <div id="custom-fields-container" class="space-y-2"></div>
                        </div>
                        ` : ''}
                        <div class="modal-footer">
                            <button type="button" class="btn-secondary" id="approval-request-cancel-btn" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                            <button type="submit" class="btn-primary" id="approval-request-submit-btn">
                                <i class="fas fa-paper-plane ml-2"></i>
                                <span class="submit-text">إرسال الطلب</span>
                                <span class="submitting-text" style="display: none;">
                                    <i class="fas fa-spinner fa-spin ml-2"></i>
                                    جاري الإرسال...
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // إعداد معالجة المرفقات
        const attachmentsInput = modal.querySelector('#approval-request-attachments');
        const attachmentsList = modal.querySelector('#approval-request-attachments-list');
        const attachments = [];

        if (attachmentsInput && attachmentsList) {
            attachmentsInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                files.forEach(file => {
                    if (file.size > 5 * 1024 * 1024) {
                        Notification.warning(`الملف ${file.name} يتجاوز الحد الأقصى المسموح (5MB)`);
                        return;
                    }
                    attachments.push(file);
                    const fileItem = document.createElement('div');
                    fileItem.className = 'flex items-center justify-between p-2 bg-gray-50 rounded border';
                    fileItem.setAttribute('data-file-name', file.name);
                    fileItem.innerHTML = `
                        <div class="flex items-center gap-2">
                            <i class="fas fa-file text-blue-600"></i>
                            <span class="text-sm text-gray-700">${Utils.escapeHTML(file.name)}</span>
                            <span class="text-xs text-gray-500">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button type="button" class="text-red-600 hover:text-red-800 remove-attachment-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    const removeBtn = fileItem.querySelector('.remove-attachment-btn');
                    removeBtn.addEventListener('click', () => {
                        const fileName = fileItem.getAttribute('data-file-name');
                        const index = attachments.findIndex(f => f.name === fileName);
                        if (index !== -1) {
                            attachments.splice(index, 1);
                        }
                        fileItem.remove();
                    });
                    attachmentsList.appendChild(fileItem);
                });
                e.target.value = '';
            });
        }

        // إعداد الحقول المخصصة للمدير
        if (Permissions.isAdmin()) {
            const addCustomFieldBtn = modal.querySelector('#add-custom-field-btn');
            const customFieldsContainer = modal.querySelector('#custom-fields-container');
            let customFieldIndex = 0;

            if (addCustomFieldBtn && customFieldsContainer) {
                addCustomFieldBtn.addEventListener('click', () => {
                    const fieldId = `custom-field-${customFieldIndex++}`;
                    const fieldItem = document.createElement('div');
                    fieldItem.className = 'flex items-center gap-2 p-2 bg-gray-50 rounded border';
                    fieldItem.innerHTML = `
                        <input type="text" class="form-input flex-1" placeholder="اسم البند المطلوب" data-field-id="${fieldId}">
                        <select class="form-input" style="width: 120px;" data-field-type="${fieldId}">
                            <option value="text">نص</option>
                            <option value="document">مستند</option>
                            <option value="checkbox">خانة اختيار</option>
                        </select>
                        <label class="flex items-center gap-1 text-sm">
                            <input type="checkbox" data-field-required="${fieldId}">
                            <span>إلزامي</span>
                        </label>
                        <button type="button" class="text-red-600 hover:text-red-800" onclick="this.parentElement.remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    customFieldsContainer.appendChild(fieldItem);
                });
            }
        }

        const form = modal.querySelector('#approval-request-form');
        const submitBtn = modal.querySelector('#approval-request-submit-btn');
        const cancelBtn = modal.querySelector('#approval-request-cancel-btn');
        let isSubmitting = false; // ✅ منع التكرار
        
        // ✅ التحقق من وجود form قبل إضافة event listener
        if (!form) {
            Utils.safeWarn('⚠️ showApprovalRequestForm: form غير موجود');
            modal.remove();
            return;
        }
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // ✅ التحقق من أن modal لا يزال موجوداً في DOM
            if (!modal || !document.contains(modal)) {
                Utils.safeWarn('⚠️ submit: modal غير موجود أو تم حذفه');
                return;
            }
            
            // ✅ منع التكرار - التحقق من حالة المعالجة
            if (isSubmitting) {
                Utils.safeLog('⚠️ محاولة إرسال مكررة - تم تجاهلها');
                return;
            }
            
            this.submitApprovalRequest(modal, attachments, () => {
                // ✅ Callback لتعطيل الزر - التحقق من وجود العناصر أولاً
                isSubmitting = true;
                if (submitBtn && document.contains(submitBtn)) {
                    submitBtn.disabled = true;
                    const submitText = submitBtn.querySelector('.submit-text');
                    const submittingText = submitBtn.querySelector('.submitting-text');
                    if (submitText) submitText.style.display = 'none';
                    if (submittingText) submittingText.style.display = 'inline';
                }
                if (cancelBtn && document.contains(cancelBtn)) {
                    cancelBtn.disabled = true;
                }
            }, () => {
                // ✅ Callback لإعادة تفعيل الزر (في حالة الخطأ) - التحقق من وجود العناصر أولاً
                isSubmitting = false;
                if (submitBtn && document.contains(submitBtn)) {
                    submitBtn.disabled = false;
                    const submitText = submitBtn.querySelector('.submit-text');
                    const submittingText = submitBtn.querySelector('.submitting-text');
                    if (submitText) submitText.style.display = 'inline';
                    if (submittingText) submittingText.style.display = 'none';
                }
                if (cancelBtn && document.contains(cancelBtn)) {
                    cancelBtn.disabled = false;
                }
            });
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    /**
     * إرسال طلب الاعتماد
     * ✅ محسّن: استجابة سريعة، حفظ محلي أولاً، إغلاق سريع، مزامنة في الخلفية
     */
    async submitApprovalRequest(modal, attachments = [], onStart = null, onError = null) {
        try {
            // ✅ التحقق من وجود modal قبل الاستمرار
            if (!modal || !modal.parentNode) {
                Utils.safeWarn('⚠️ submitApprovalRequest: modal غير موجود أو تم حذفه');
                if (onError) onError();
                return;
            }
            
            // ✅ استدعاء callback لتعطيل الزر ومنع التكرار
            if (onStart) onStart();
            
            const form = modal.querySelector('#approval-request-form');
            // ✅ التحقق من وجود form قبل الاستمرار
            if (!form) {
                Utils.safeWarn('⚠️ submitApprovalRequest: form غير موجود');
                Loading.hide();
                if (onError) onError();
                return;
            }

            // جمع الحقول المخصصة للمدير
            const customFields = [];
            if (Permissions.isAdmin()) {
                const customFieldsContainer = form.querySelector('#custom-fields-container');
                if (customFieldsContainer) {
                    const fieldItems = customFieldsContainer.querySelectorAll('[data-field-id]');
                    fieldItems.forEach(item => {
                        const fieldId = item.getAttribute('data-field-id');
                        const fieldName = item.value.trim();
                        if (fieldName) {
                            const fieldType = form.querySelector(`[data-field-type="${fieldId}"]`)?.value || 'text';
                            const isRequired = form.querySelector(`[data-field-required="${fieldId}"]`)?.checked || false;
                            customFields.push({
                                id: Utils.generateId('CUSTOM'),
                                name: fieldName,
                                type: fieldType,
                                required: isRequired
                            });
                        }
                    });
                }
            }

            // ✅ حفظ مراجع العناصر قبل أي عمليات async
            const typeSelect = form.querySelector('#approval-request-type');
            const companyInput = form.querySelector('#approval-request-company-name');
            const serviceInput = form.querySelector('#approval-request-service-type');
            const licenseInput = form.querySelector('#approval-request-license');
            const contactInput = form.querySelector('#approval-request-contact-person');
            const phoneInput = form.querySelector('#approval-request-phone');
            const emailInput = form.querySelector('#approval-request-email');
            const notesTextarea = form.querySelector('#approval-request-notes');
            
            // ✅ التحقق من وجود الحقول المطلوبة
            if (!typeSelect || !companyInput || !serviceInput) {
                Utils.safeWarn('⚠️ submitApprovalRequest: الحقول المطلوبة غير موجودة');
                Loading.hide();
                Notification.warning('حدث خطأ في النموذج. يرجى تحديث الصفحة وإعادة المحاولة.');
                if (onError) onError();
                return;
            }
            
            // ✅ إزالة توليد ID من Frontend - Backend سيتولى توليده بشكل تسلسلي (CAR_1, CAR_2, ...)
            const requestData = {
                // id سيتم توليده في Backend باستخدام generateSequentialId('CAR', ...)
                requestType: typeSelect.value,
                companyName: companyInput.value.trim(),
                serviceType: serviceInput.value.trim(),
                licenseNumber: (licenseInput?.value || '').trim(),
                contactPerson: (contactInput?.value || '').trim(),
                phone: (phoneInput?.value || '').trim(),
                email: (emailInput?.value || '').trim(),
                notes: (notesTextarea?.value || '').trim(),
                attachments: [], // ✅ سيتم ملء المرفقات لاحقاً في الخلفية
                attachmentFiles: attachments, // ✅ حفظ الملفات للرفع لاحقاً
                customFields: customFields,
                status: 'pending',
                createdAt: new Date().toISOString(),
                createdBy: AppState.currentUser?.id || '',
                createdByName: AppState.currentUser?.name || ''
            };

            if (!requestData.companyName || !requestData.serviceType || !requestData.requestType) {
                Loading.hide();
                Notification.warning('يرجى تعبئة جميع الحقول المطلوبة');
                if (onError) onError();
                return;
            }

            this.ensureApprovalRequestsSetup();
            
            // ✅ حفظ محلياً أولاً للاستجابة السريعة
            const tempId = 'TEMP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            requestData.id = tempId;
            requestData._isPendingSync = true;
            
            AppState.appData.contractorApprovalRequests.push(requestData);
            
            // حفظ البيانات محلياً
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            }
            
            Utils.safeLog('✅ تم حفظ الطلب محلياً. ID مؤقت: ' + tempId);
            
            // ✅ الإغلاق الفوري للنموذج بعد الحفظ المحلي — لا انتظار للمزامنة
            Loading.hide();
            Notification.success('تم حفظ الطلب بنجاح. جاري المزامنة مع الخادم...');
            
            try {
                if (modal && modal.parentNode) {
                    modal.remove();
                }
            } catch (removeError) {
                Utils.safeWarn('⚠️ خطأ في إزالة النموذج:', removeError);
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }
            
            // ✅ تحديث قائمة الطلبات مباشرة بعد الحفظ المحلي
            this.refreshApprovalRequestsSection();
            
            // ✅ المزامنة مع Backend في الخلفية فقط (لا await — لا تغيير في بنية التطبيق)
            this.syncApprovalRequestToBackend(requestData, attachments, tempId).then(() => {
                Utils.safeLog('✅ تمت مزامنة الطلب بنجاح. يمكن الآن اعتماد الطلب.');
                // ✅ تحديث العرض بعد المزامنة لضمان تحديث ID من TEMP_ إلى CAR_
                this.refreshApprovalRequestsSection();
            }).catch(error => {
                Utils.safeError('❌ خطأ في مزامنة الطلب مع Backend:', error);
                // إظهار تنبيه خفيف للمستخدم
                Notification.warning('تم حفظ الطلب محلياً. سيتم المزامنة تلقائياً لاحقاً.');
            });
            
        } catch (error) {
            Loading.hide();
            Utils.safeError('خطأ في إرسال طلب الاعتماد:', error);
            Notification.error('تعذر إرسال طلب الاعتماد: ' + error.message);
            if (onError) onError();
        }
    },
    
    /**
     * ✅ جديد: مزامنة طلب الاعتماد مع Backend في الخلفية
     */
    async syncApprovalRequestToBackend(requestData, attachments = [], tempId) {
        // ✅ إضافة حماية من المزامنة المتكررة لنفس الطلب
        const syncKey = `sync_${tempId || requestData.id || Date.now()}`;
        if (this._activeSyncs && this._activeSyncs[syncKey]) {
            Utils.safeLog('⚠️ syncApprovalRequestToBackend: مزامنة قيد المعالجة لنفس الطلب - تم تجاهل الاستدعاء المكرر');
            return;
        }
        
        // ✅ تسجيل المزامنة النشطة
        if (!this._activeSyncs) {
            this._activeSyncs = {};
        }
        this._activeSyncs[syncKey] = true;
        
        try {
            // ✅ رفع المرفقات في الخلفية (متوازي إذا أمكن)
            let attachmentUrls = [];
            if (attachments && attachments.length > 0) {
                try {
                    // ✅ رفع الملفات بشكل متوازي لتحسين الأداء
                    const uploadPromises = attachments.map(async (file) => {
                        try {
                        // تحويل الملف إلى base64
                        const base64Data = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                                const base64 = reader.result.split(',')[1];
                                resolve(base64);
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                        });

                        const uploadResult = await GoogleIntegration.uploadFileToDrive(
                            base64Data,
                            file.name,
                            file.type,
                            'contractor-approval-attachments'
                        );
                        if (uploadResult && uploadResult.url) {
                                return {
                                name: file.name,
                                url: uploadResult.url,
                                size: file.size,
                                type: file.type
                                };
                            }
                            return null;
                        } catch (error) {
                            Utils.safeWarn('فشل رفع الملف ' + file.name + ':', error);
                            return null;
                        }
                    });
                    
                    const results = await Promise.all(uploadPromises);
                    attachmentUrls = results.filter(url => url !== null);
                    
                    if (attachmentUrls.length < attachments.length) {
                        Utils.safeWarn('⚠️ فشل رفع بعض المرفقات. تم رفع ' + attachmentUrls.length + ' من ' + attachments.length);
                    }
                } catch (error) {
                    Utils.safeWarn('فشل رفع بعض المرفقات:', error);
                }
            }
            
            // ✅ تحديث requestData بالمرفقات المرفوعة
            requestData.attachments = attachmentUrls;
            delete requestData.attachmentFiles; // ✅ حذف الملفات الأصلية بعد الرفع
            
            // ✅ إصلاح مهم: إزالة tempId قبل إرسال الطلب إلى Backend
            // ✅ Backend يجب أن يولد ID جديد (CAR_1, CAR_2, ...) وليس استخدام tempId
            const tempIdToReplace = requestData.id; // حفظ tempId للاستبدال لاحقاً (يجب أن يكون tempId الذي تم إنشاؤه في submitApprovalRequest)
            
            // ✅ تحديد actualTempId للاستخدام في جميع أنحاء الدالة
            // ✅ التحقق من أن tempIdToReplace يطابق tempId الذي تم تمريره
            let actualTempId;
            if (tempIdToReplace && tempIdToReplace === tempId) {
                actualTempId = tempId;
            } else if (tempIdToReplace) {
                Utils.safeWarn('⚠️ تحذير: tempIdToReplace (' + tempIdToReplace + ') لا يطابق tempId (' + tempId + ') - سيتم استخدام tempIdToReplace');
                actualTempId = tempIdToReplace;
            } else {
                Utils.safeWarn('⚠️ تحذير: tempIdToReplace غير موجود - سيتم استخدام tempId الممرر');
                actualTempId = tempId;
            }
            
            // ✅ حذف tempId قبل الإرسال لضمان توليد ID جديد من Backend
            delete requestData.id; // ✅ حذف tempId قبل الإرسال لضمان توليد ID جديد من Backend
            delete requestData._isPendingSync; // ✅ حذف flag مؤقت أيضاً
            
            Utils.safeLog('🔄 إرسال الطلب إلى Backend بدون ID (tempId=' + actualTempId + ' سيتم استبداله بـ CAR_... من Backend)');
            
            // ✅ إرسال الطلب إلى Backend
                const backendResult = await GoogleIntegration.sendRequest({
                    action: 'addContractorApprovalRequest',
                    data: requestData
                });

                if (backendResult && backendResult.success) {
                // ✅ بعد نجاح الحفظ في Backend، استخدام البيانات من Backend مع ID المُرجَع (CAR_ أو UUID)
                const savedRequest = backendResult.data || requestData;
                if (!savedRequest.id || String(savedRequest.id).startsWith('TEMP_')) {
                    savedRequest.id = 'CAR_' + Date.now();
                }
                // ✅ actualTempId تم تعريفه سابقاً في بداية الدالة
                // ✅ استخدامه للبحث عن الطلب المؤقت واستبداله
                
                Utils.safeLog('✅ تم استبدال tempId=' + actualTempId + ' بالـ ID الفعلي=' + savedRequest.id);
                
                // ✅ إيجاد الطلب المؤقت واستبداله بالطلب الفعلي (البحث بكل الاحتمالات)
                let tempIndex = AppState.appData.contractorApprovalRequests.findIndex(r => r.id === actualTempId);
                
                // ✅ إذا لم يوجد بـ actualTempId، البحث بـ tempId
                if (tempIndex === -1 && actualTempId !== tempId) {
                    tempIndex = AppState.appData.contractorApprovalRequests.findIndex(r => r.id === tempId);
                }
                
                // ✅ إذا لم يوجد بعد، البحث بـ companyName و status pending
                if (tempIndex === -1) {
                    tempIndex = AppState.appData.contractorApprovalRequests.findIndex(r => 
                        r.companyName === requestData.companyName && 
                        r.status === 'pending' && 
                        (r.id?.startsWith('TEMP_') || r._isPendingSync)
                    );
                }
                
                if (tempIndex !== -1) {
                    // ✅ تحديث الطلب بالبيانات الفعلية من Backend (مع ID الجديد)
                    // ✅ استبدال كامل للطلب المؤقت بالطلب الفعلي
                    const oldId = AppState.appData.contractorApprovalRequests[tempIndex].id;
                    AppState.appData.contractorApprovalRequests[tempIndex] = {
                        ...AppState.appData.contractorApprovalRequests[tempIndex],
                        ...savedRequest,
                        id: savedRequest.id, // ✅ التأكد من استخدام ID الجديد (CAR_...)
                        _isPendingSync: false,
                        _syncError: false
                    };
                    delete AppState.appData.contractorApprovalRequests[tempIndex]._isPendingSync;
                    delete AppState.appData.contractorApprovalRequests[tempIndex]._syncError;
                    delete AppState.appData.contractorApprovalRequests[tempIndex]._syncErrorMessage;
                    
                    Utils.safeLog('✅ تم استبدال الطلب المؤقت في AppState. oldID=' + oldId + ' -> newID=' + savedRequest.id + ', tempIndex=' + tempIndex);
                } else {
                    // ✅ إذا لم يوجد الطلب المؤقت، إضافته مباشرة
                    Utils.safeWarn('⚠️ تحذير: لم يتم العثور على الطلب المؤقت في AppState. tempId=' + actualTempId);
                    if (!savedRequest.id || String(savedRequest.id).startsWith('TEMP_')) {
                        savedRequest.id = 'CAR_' + Date.now();
                    }
                    savedRequest._isPendingSync = false;
                    AppState.appData.contractorApprovalRequests.push(savedRequest);
                    Utils.safeLog('✅ تم إضافة الطلب الجديد مباشرة إلى AppState. newID=' + savedRequest.id);
                }
                
                // ✅ تحديث requestData بالبيانات الكاملة من Backend (مع ID الجديد)
                Object.assign(requestData, savedRequest);
                requestData.id = savedRequest.id; // ✅ التأكد من استخدام ID الجديد
                
                // حفظ البيانات المحلية المحدثة
                if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                    window.DataManager.save();
                }
                
                Utils.safeLog('✅ تم مزامنة طلب الاعتماد مع Backend بنجاح. ID: ' + (requestData.id || 'N/A'));
                
                // ✅ تحديث العرض بعد المزامنة الناجحة (مع حماية من التحديثات المتكررة)
                // ✅ استخدام debounced refresh لمنع التحديثات المتكررة
                if (this.currentTab === 'approval-request') {
            this.refreshApprovalRequestsSection();
                }

                // ✅ إرسال إشعارات Real-time لجميع المديرين المتصلين
            try {
                if (typeof RealtimeSyncManager !== 'undefined' && RealtimeSyncManager.notifyChange) {
                    RealtimeSyncManager.notifyChange('contractorApprovalRequests', 'add', requestData.id);
                    Utils.safeLog('✅ تم إرسال إشعار Real-time بالطلب الجديد');
                }

                // تحديث البيانات عبر BroadcastChannel للتبويبات المفتوحة
                if (typeof RealtimeSyncManager !== 'undefined' && RealtimeSyncManager.state && RealtimeSyncManager.state.broadcastChannel) {
                    RealtimeSyncManager.state.broadcastChannel.postMessage({
                        type: 'DATA_CHANGED',
                        module: 'contractors',
                        action: 'approvalRequestAdded',
                        data: {
                            requestId: requestData.id,
                            companyName: requestData.companyName,
                                createdBy: AppState.currentUser?.id || ''
                        }
                    });
                    Utils.safeLog('✅ تم إرسال إشعار Broadcast للتبويبات المفتوحة');
                }
            } catch (notifyError) {
                Utils.safeWarn('⚠️ فشل إرسال إشعارات Real-time:', notifyError);
            }
                
                // ✅ إرسال إشعارات للمديرين في الخلفية
                this.notifyAdminsAboutApprovalRequest(requestData).catch(error => {
                    Utils.safeWarn('⚠️ فشل إرسال إشعارات للمديرين:', error);
                });

            // تحديث الإشعارات
            if (typeof AppUI !== 'undefined' && AppUI.updateNotificationsBadge) {
                AppUI.updateNotificationsBadge();
                }
                
                // ✅ إظهار إشعار النجاح النهائي
                Notification.success('تم إرسال طلب الاعتماد بنجاح. سيتم مراجعته من قبل مدير النظام.');
            } else {
                // ✅ في حالة فشل المزامنة، الحفاظ على الطلب المحلي
                Utils.safeWarn('⚠️ فشل مزامنة طلب الاعتماد مع Backend، تم الحفظ محلياً فقط');
                const tempIndex = AppState.appData.contractorApprovalRequests.findIndex(r => r.id === tempId);
                if (tempIndex !== -1) {
                    AppState.appData.contractorApprovalRequests[tempIndex]._syncError = true;
                    AppState.appData.contractorApprovalRequests[tempIndex]._syncErrorMessage = backendResult?.message || 'فشل المزامنة';
                }
                
                // حفظ البيانات المحلية
                if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                    window.DataManager.save();
                }
                
                Notification.warning('تم حفظ الطلب محلياً. سيتم المزامنة تلقائياً لاحقاً.');
            }
        } catch (error) {
            // ✅ في حالة الخطأ، الحفاظ على الطلب المحلي
            Utils.safeError('❌ خطأ في مزامنة طلب الاعتماد مع Backend:', error);
            const tempIndex = AppState.appData.contractorApprovalRequests.findIndex(r => r.id === tempId);
            if (tempIndex !== -1) {
                AppState.appData.contractorApprovalRequests[tempIndex]._syncError = true;
                AppState.appData.contractorApprovalRequests[tempIndex]._syncErrorMessage = error.message || 'خطأ في المزامنة';
            }
            
            // حفظ البيانات المحلية
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            }
            
            throw error; // إعادة رمي الخطأ للمعالجة الأعلى
        } finally {
            // ✅ إزالة المزامنة النشطة بعد الانتهاء
            if (this._activeSyncs && this._activeSyncs[syncKey]) {
                delete this._activeSyncs[syncKey];
            }
        }
    },

    /**
     * إرسال إشعارات للمديرين عند إرسال طلب اعتماد
     */
    async notifyAdminsAboutApprovalRequest(requestData) {
        try {
            // الحصول على جميع المستخدمين المدراء
            const users = AppState.appData.users || [];
            const admins = users.filter(user => {
                if (!user || user.active === false) return false;
                const role = (user.role || '').toLowerCase();
                return role === 'admin' || role === 'مدير' ||
                    (user.permissions && (user.permissions.isAdmin === true || user.permissions.admin === true));
            });

            if (admins.length === 0) {
                // إذا لم نجد مدراء محلياً، نحاول قراءتهم من Google Sheets
                try {
                    const usersResult = await GoogleIntegration.sendRequest({
                        action: 'readFromSheet',
                        data: { sheetName: 'Users' }
                    });

                    if (usersResult && usersResult.success && Array.isArray(usersResult.data)) {
                        admins.push(...usersResult.data.filter(user => {
                            if (!user || user.active === false) return false;
                            const role = (user.role || '').toLowerCase();
                            return role === 'admin' || role === 'مدير';
                        }));
                    }
                } catch (error) {
                    Utils.safeWarn('فشل قراءة المستخدمين من Google Sheets:', error);
                }
            }

            const requestTypeLabel = {
                'contractor': 'مقاول',
                'supplier': 'مورد',
                'evaluation': 'تقييم'
            }[requestData.requestType] || requestData.requestType || 'غير محدد';

            // إرسال إشعار لكل مدير
            for (const admin of admins) {
                if (admin.id || admin.email) {
                    try {
                        await GoogleIntegration.sendRequest({
                            action: 'addNotification',
                            data: {
                                userId: admin.id || admin.email,
                                title: 'طلب اعتماد جديد يحتاج مراجعة',
                                message: `طلب ${AppState.currentUser?.name || 'مستخدم'} اعتماد ${requestTypeLabel}: "${requestData.companyName || ''}"`,
                                type: 'contractor_approval',
                                priority: 'high',
                                link: '#contractors-section',
                                data: {
                                    module: 'contractors',
                                    action: 'approval_request',
                                    requestId: requestData.id,
                                    requestType: requestData.requestType
                                }
                            }
                        }).catch(error => {
                            Utils.safeWarn('فشل إرسال الإشعار للمدير:', error);
                        });
                    } catch (error) {
                        Utils.safeWarn('خطأ في إرسال الإشعار للمدير:', error);
                    }
                }
            }
        } catch (error) {
            Utils.safeWarn('خطأ في إرسال الإشعارات للمديرين:', error);
        }
    },

    /**
     * تحديث قسم طلبات الاعتماد
     * ✅ إصلاح: تحديث بسيط بدون debounce أو تعقيد
     */
    refreshApprovalRequestsSection() {
        // ✅ التحقق من أن التبويب نشط
        if (this.currentTab !== 'approval-request') {
            return;
        }
        
        // ✅ منع التحديثات المتكررة
        if (this._isRefreshingApprovalRequests) {
            return;
        }
        
        this._isRefreshingApprovalRequests = true;
        
        try {
            const myContainer = document.getElementById('my-approval-requests-container');
            const pendingContainer = document.getElementById('pending-approval-requests-container');
            
            if (myContainer) {
                const myRequests = this.getMyApprovalRequests();
                myContainer.innerHTML = this.renderApprovalRequestsTable(myRequests, false);
            }

            if (Permissions.isAdmin() && pendingContainer) {
                const pendingRequests = this.getPendingApprovalRequests();
                pendingContainer.innerHTML = this.renderApprovalRequestsTable(pendingRequests, true);
            }
        } catch (error) {
            Utils.safeError('خطأ في تحديث قسم طلبات الاعتماد:', error);
        } finally {
            this._isRefreshingApprovalRequests = false;
        }
    },
    
    /**
     * عرض تفاصيل طلب الاعتماد أو الحذف
     */
    viewApprovalRequest(requestId, requestCategory = 'approval') {
        this.ensureApprovalRequestsSetup();
        this.ensureDeletionRequestsSetup();

        let request;
        if (requestCategory === 'deletion') {
            request = (AppState.appData.contractorDeletionRequests || []).find(r => r.id === requestId);
        } else {
            request = (AppState.appData.contractorApprovalRequests || []).find(r => r.id === requestId);
        }

        if (!request) {
            Notification.error('الطلب غير موجود');
            return;
        }

        const isAdmin = Permissions.isAdmin();
        const statusBadge = this.getApprovalRequestStatusBadge(request.status);
        const isDeletionRequest = requestCategory === 'deletion';
        const isEvaluationRequest = !isDeletionRequest && request.requestType === 'evaluation';
        const canEdit = isAdmin && !isDeletionRequest && (request.status === 'pending' || request.status === 'under_review');

        // ✅ إصلاح: البحث عن بيانات التقييم في عدة أماكن
        let evaluationData = null;
        if (isEvaluationRequest) {
            // محاولة الحصول على evaluationData من الطلب
            evaluationData = request.evaluationData;
            
            // ✅ تحليل evaluationData إذا كان نصاً (JSON string) - معالجة التشفير المزدوج
            let parseAttempts = 0;
            while (evaluationData && typeof evaluationData === 'string' && parseAttempts < 3) {
                try {
                    evaluationData = JSON.parse(evaluationData);
                    parseAttempts++;
                } catch (error) {
                    Utils.safeWarn('⚠️ فشل تحليل evaluationData من النص (محاولة ' + parseAttempts + '):', error);
                    break;
                }
            }
            
            // ✅ التحقق من أن evaluationData كائن صالح
            if (evaluationData && typeof evaluationData !== 'object') {
                Utils.safeWarn('⚠️ evaluationData ليس كائناً صالحاً:', typeof evaluationData);
                evaluationData = null;
            }
            
            // ✅ إذا لم يوجد evaluationData أو كان فارغاً، استخدام بيانات الطلب مباشرة
            const hasValidData = evaluationData && (
                evaluationData.evaluationDate ||
                evaluationData.evaluatorName ||
                evaluationData.projectName ||
                evaluationData.location ||
                evaluationData.finalScore !== undefined ||
                (evaluationData.items && evaluationData.items.length > 0)
            );
            
            if (!hasValidData) {
                Utils.safeLog('📋 evaluationData فارغ أو غير صالح، استخدام بيانات الطلب مباشرة');
                evaluationData = {
                    evaluationDate: request.evaluationDate || (evaluationData?.evaluationDate) || null,
                    evaluatorName: request.evaluatorName || (evaluationData?.evaluatorName) || request.createdByName || '',
                    projectName: request.projectName || (evaluationData?.projectName) || request.location || '',
                    location: request.location || (evaluationData?.location) || request.projectName || '',
                    compliantCount: request.compliantCount ?? (evaluationData?.compliantCount) ?? 0,
                    totalItems: request.totalItems ?? (evaluationData?.totalItems) ?? 0,
                    finalScore: request.finalScore ?? (evaluationData?.finalScore) ?? null,
                    finalRating: request.finalRating || (evaluationData?.finalRating) || '',
                    generalNotes: request.generalNotes || (evaluationData?.generalNotes) || request.notes || '',
                    items: request.items || (evaluationData?.items) || [],
                    id: request.entityId || request.evaluationId || (evaluationData?.id) || null
                };
            }
            
            // ✅ تحليل items إذا كانت نصاً - معالجة التشفير المزدوج
            let itemsParseAttempts = 0;
            while (evaluationData?.items && typeof evaluationData.items === 'string' && itemsParseAttempts < 3) {
                try {
                    evaluationData.items = JSON.parse(evaluationData.items);
                    itemsParseAttempts++;
                } catch (error) {
                    Utils.safeWarn('⚠️ فشل تحليل بنود التقييم من النص:', error);
                    evaluationData.items = [];
                    break;
                }
            }
            
            Utils.safeLog('📋 بيانات التقييم المستخرجة:', evaluationData);
            Utils.safeLog('📋 بيانات الطلب الأصلية:', request);
        }
        
        const evaluationItems = Array.isArray(evaluationData?.items)
            ? evaluationData.items
            : (evaluationData?.items && typeof evaluationData.items === 'object')
                ? Object.values(evaluationData.items)
                : [];
        const evaluationScoreRaw = evaluationData?.finalScore;
        const evaluationScore = typeof evaluationScoreRaw === 'number'
            ? evaluationScoreRaw
            : (evaluationScoreRaw !== undefined && evaluationScoreRaw !== null && !isNaN(parseFloat(evaluationScoreRaw)))
                ? parseFloat(evaluationScoreRaw)
                : null;

        let requestType, entityName;
        if (isDeletionRequest) {
            requestType = request.requestType === 'contractor' ? 'حذف مقاول' :
                request.requestType === 'approved_entity' ? 'حذف معتمد' :
                    request.requestType === 'evaluation' ? 'حذف تقييم' : 'حذف';
            entityName = request.entityName || request.companyName || '';
        } else if (isEvaluationRequest) {
            requestType = 'طلب تقييم مقاول';
            entityName = request.contractorName || '';
        } else {
            requestType = request.requestType === 'contractor' ? 'اعتماد مقاول' : 'اعتماد مورد';
            entityName = request.companyName || request.contractorName || '';
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2 class="modal-title">${isDeletionRequest ? 'تفاصيل طلب الحذف' : 'تفاصيل طلب الاعتماد'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${canEdit ? `
                        <div class="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                            <div class="flex items-center justify-between">
                                <p class="text-sm text-blue-800">
                                    <i class="fas fa-info-circle ml-2"></i>
                                    يمكنك تعديل بيانات الطلب قبل الموافقة عليه
                                </p>
                                <button id="toggle-edit-mode-btn" class="btn-sm btn-secondary" onclick="Contractors.toggleEditMode()">
                                    <i class="fas fa-edit ml-1"></i>
                                    تفعيل التعديل
                                </button>
                            </div>
                        </div>
                    ` : ''}
                    <form id="request-details-form">
                        <div class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">نوع الطلب</label>
                                    <p class="text-gray-800">${requestType}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">الحالة</label>
                                    <p>${statusBadge}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">${isDeletionRequest ? 'اسم العنصر المراد حذفه' : isEvaluationRequest ? 'اسم المقاول' : 'اسم الشركة / المقاول'}</label>
                                    ${!isEvaluationRequest ? `
                                    <input type="text" id="edit-companyName" class="form-input edit-field" disabled value="${Utils.escapeHTML(entityName)}" style="display: none;" />
                                    <p id="view-companyName" class="text-gray-800 view-field" style="display: block;">${Utils.escapeHTML(entityName)}</p>
                                    ` : canEdit ? `
                                    <input type="text" id="edit-companyName" class="form-input edit-field" value="${Utils.escapeHTML(entityName)}" style="display: none;" />
                                    <p id="view-companyName" class="text-gray-800 view-field" style="display: block;">${Utils.escapeHTML(entityName)}</p>
                                    ` : `
                                    <p class="text-gray-800">${Utils.escapeHTML(entityName)}</p>
                                    `}
                                </div>
                                ${isEvaluationRequest && evaluationData ? `
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">تاريخ التقييم</label>
                                    <input type="date" id="edit-evaluationDate" class="form-input edit-field" disabled value="${evaluationData.evaluationDate ? (typeof evaluationData.evaluationDate === 'string' ? evaluationData.evaluationDate.slice(0, 10) : new Date(evaluationData.evaluationDate).toISOString().slice(0, 10)) : ''}" style="display: none;" />
                                    <p id="view-evaluationDate" class="text-gray-800 view-field" style="display: block;">${evaluationData.evaluationDate ? Utils.formatDate(evaluationData.evaluationDate) : '—'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">اسم المقيّم</label>
                                    <input type="text" id="edit-evaluatorName" class="form-input edit-field" disabled value="${Utils.escapeHTML(evaluationData.evaluatorName || '')}" style="display: none;" />
                                    <p id="view-evaluatorName" class="text-gray-800 view-field" style="display: block;">${Utils.escapeHTML(evaluationData.evaluatorName || '') || '—'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">الموقع / المشروع</label>
                                    <input type="text" id="edit-projectName" class="form-input edit-field" disabled value="${Utils.escapeHTML(evaluationData.projectName || evaluationData.location || '')}" style="display: none;" />
                                    <p id="view-projectName" class="text-gray-800 view-field" style="display: block;">${Utils.escapeHTML(evaluationData.projectName || evaluationData.location || '') || '—'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">عدد البنود المطابقة</label>
                                    <p class="text-gray-800">${evaluationData.compliantCount ?? 0} من ${evaluationData.totalItems ?? evaluationItems.length ?? 0}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">نسبة التقييم</label>
                                    <p class="text-gray-800 font-bold ${evaluationScore >= 90 ? 'text-green-600' : evaluationScore >= 75 ? 'text-blue-600' : evaluationScore >= 60 ? 'text-yellow-600' : evaluationScore === null ? 'text-gray-500' : 'text-red-600'}">${typeof evaluationScore === 'number' ? evaluationScore.toFixed(0) + '%' : '—'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">التقييم النهائي</label>
                                    <span class="badge ${evaluationScore >= 90 ? 'badge-success' : evaluationScore >= 75 ? 'badge-info' : evaluationScore >= 60 ? 'badge-warning' : evaluationScore === null ? 'badge-secondary' : 'badge-danger'}">${Utils.escapeHTML(evaluationData.finalRating || '')}</span>
                                </div>
                                ` : ''}
                                ${isDeletionRequest && request.reason ? `
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">سبب طلب الحذف</label>
                                    <p class="text-gray-800">${Utils.escapeHTML(request.reason)}</p>
                                </div>
                                ` : ''}
                                ${!isDeletionRequest && !isEvaluationRequest ? `
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">نوع الخدمة / النشاط</label>
                                    <input type="text" id="edit-serviceType" class="form-input edit-field" disabled value="${Utils.escapeHTML(request.serviceType || '')}" style="display: none;" />
                                    <p id="view-serviceType" class="text-gray-800 view-field" style="display: block;">${Utils.escapeHTML(request.serviceType || '')}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">رقم السجل التجاري / الترخيص</label>
                                    <input type="text" id="edit-licenseNumber" class="form-input edit-field" disabled value="${Utils.escapeHTML(request.licenseNumber || '')}" style="display: none;" />
                                    <p id="view-licenseNumber" class="text-gray-800 view-field" style="display: block;">${Utils.escapeHTML(request.licenseNumber || '') || '—'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">الشخص المسؤول</label>
                                    <input type="text" id="edit-contactPerson" class="form-input edit-field" disabled value="${Utils.escapeHTML(request.contactPerson || '')}" style="display: none;" />
                                    <p id="view-contactPerson" class="text-gray-800 view-field" style="display: block;">${Utils.escapeHTML(request.contactPerson || '') || '—'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">رقم الهاتف</label>
                                    <input type="text" id="edit-phone" class="form-input edit-field" disabled value="${Utils.escapeHTML(request.phone || '')}" style="display: none;" />
                                    <p id="view-phone" class="text-gray-800 view-field" style="display: block;">${Utils.escapeHTML(request.phone || '') || '—'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">البريد الإلكتروني</label>
                                    <input type="email" id="edit-email" class="form-input edit-field" disabled value="${Utils.escapeHTML(request.email || '')}" style="display: none;" />
                                    <p id="view-email" class="text-gray-800 view-field" style="display: block;">${Utils.escapeHTML(request.email || '') || '—'}</p>
                                </div>
                                ` : ''}
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">تاريخ الإرسال</label>
                                    <p class="text-gray-800">${request.createdAt ? Utils.formatDate(request.createdAt) : '—'}</p>
                                </div>
                                <div>
                                    <label class="text-sm font-semibold text-gray-600">أرسل بواسطة</label>
                                    <p class="text-gray-800">${Utils.escapeHTML(request.createdByName || '') || '—'}</p>
                                </div>
                            </div>
                            ${isEvaluationRequest && evaluationItems.length > 0 ? `
                                <div class="bg-gray-50 border border-gray-200 rounded p-3">
                                    <label class="text-sm font-semibold text-gray-600 block mb-3">
                                        <i class="fas fa-clipboard-list ml-2"></i>
                                        تفاصيل بنود التقييم (${evaluationItems.length} بند)
                                    </label>
                                    <div class="overflow-x-auto">
                                        <table class="min-w-full divide-y divide-gray-200">
                                            <thead class="bg-gray-100">
                                                <tr>
                                                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">البند</th>
                                                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                                                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الملاحظات</th>
                                                </tr>
                                            </thead>
                                            <tbody class="bg-white divide-y divide-gray-200">
                                                ${evaluationItems.map((item, idx) => {
                                                    const statusLabel = item.status === 'compliant' ? 'مطابق' : item.status === 'non_compliant' ? 'غير مطابق' : '—';
                                                    const statusClass = item.status === 'compliant' ? 'text-green-600' : item.status === 'non_compliant' ? 'text-red-600' : 'text-gray-500';
                                                    const statusIcon = item.status === 'compliant' ? 'fa-check-circle' : item.status === 'non_compliant' ? 'fa-times-circle' : 'fa-minus-circle';
                                                    return `
                                                    <tr>
                                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-700">${idx + 1}</td>
                                                        <td class="px-3 py-2 text-sm text-gray-700">${Utils.escapeHTML(item.title || item.label || '')}</td>
                                                        <td class="px-3 py-2 whitespace-nowrap text-sm ${statusClass}">
                                                            <i class="fas ${statusIcon} ml-1"></i>
                                                            ${statusLabel}
                                                        </td>
                                                        <td class="px-3 py-2 text-sm text-gray-600">${Utils.escapeHTML(item.notes || '—')}</td>
                                                    </tr>
                                                    `;
                                                }).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ` : ''}
                            ${isEvaluationRequest && evaluationData ? `
                                <div class="bg-blue-50 border border-blue-200 rounded p-3">
                                    <label class="text-sm font-semibold text-blue-800 block mb-2">الملاحظات العامة</label>
                                    <textarea id="edit-generalNotes" class="form-input edit-field" disabled rows="3" style="display: none;">${Utils.escapeHTML(evaluationData.generalNotes || '')}</textarea>
                                    <p id="view-generalNotes" class="text-blue-700 whitespace-pre-line view-field" style="display: block;">${Utils.escapeHTML(evaluationData.generalNotes || '') || '—'}</p>
                                </div>
                            ` : ''}
                            ${!isDeletionRequest && !isEvaluationRequest && request.notes ? `
                                <div class="bg-gray-50 border border-gray-200 rounded p-3">
                                    <label class="text-sm font-semibold text-gray-600 block mb-2">ملاحظات</label>
                                    <textarea id="edit-notes" class="form-input edit-field" disabled rows="3" style="display: none;">${Utils.escapeHTML(request.notes)}</textarea>
                                    <p id="view-notes" class="text-gray-700 whitespace-pre-line view-field" style="display: block;">${Utils.escapeHTML(request.notes)}</p>
                                </div>
                            ` : ''}
                            ${canEdit ? `
                                <div id="save-changes-section" class="border-t pt-4" style="display: none;">
                                    <button type="button" id="save-changes-btn" class="btn-primary">
                                        <i class="fas fa-save ml-2"></i>
                                        حفظ التعديلات
                                    </button>
                                    <button type="button" class="btn-secondary" onclick="Contractors.toggleEditMode()">
                                        <i class="fas fa-times ml-2"></i>
                                        إلغاء
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </form>
                    ${!isDeletionRequest && request.attachments && request.attachments.length > 0 ? `
                            <div class="bg-blue-50 border border-blue-200 rounded p-3">
                                <label class="text-sm font-semibold text-blue-800 block mb-2">
                                    <i class="fas fa-paperclip ml-2"></i>
                                    المرفقات (${request.attachments.length})
                                </label>
                                <div class="space-y-2">
                                    ${request.attachments.map(att => `
                                        <div class="flex items-center justify-between p-2 bg-white rounded border">
                                            <div class="flex items-center gap-2">
                                                <i class="fas fa-file text-blue-600"></i>
                                                <span class="text-sm text-gray-700">${Utils.escapeHTML(att.name)}</span>
                                                ${att.size ? `<span class="text-xs text-gray-500">(${(att.size / 1024 / 1024).toFixed(2)} MB)</span>` : ''}
                                            </div>
                                            ${att.url ? `
                                                <a href="${att.url}" target="_blank" class="btn-secondary btn-sm">
                                                    <i class="fas fa-download ml-1"></i>
                                                    تحميل
                                                </a>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        ${!isDeletionRequest && request.customFields && request.customFields.length > 0 ? `
                            <div class="bg-purple-50 border border-purple-200 rounded p-3">
                                <label class="text-sm font-semibold text-purple-800 block mb-2">
                                    <i class="fas fa-list-check ml-2"></i>
                                    البنود المطلوبة الإضافية (${request.customFields.length})
                                </label>
                                <div class="space-y-2">
                                    ${request.customFields.map(field => `
                                        <div class="flex items-center gap-2 p-2 bg-white rounded border">
                                            <span class="text-sm text-gray-700">${Utils.escapeHTML(field.name)}</span>
                                            <span class="badge badge-info text-xs">${field.type === 'text' ? 'نص' : field.type === 'document' ? 'مستند' : 'خانة اختيار'}</span>
                                            ${field.required ? '<span class="badge badge-warning text-xs">إلزامي</span>' : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        ${isDeletionRequest && request.reason ? `
                            <div class="bg-yellow-50 border border-yellow-200 rounded p-3">
                                <label class="text-sm font-semibold text-yellow-800 block mb-2">سبب طلب الحذف</label>
                                <p class="text-yellow-700 whitespace-pre-line">${Utils.escapeHTML(request.reason)}</p>
                            </div>
                        ` : ''}
                        ${request.approvedAt ? `
                            <div class="bg-green-50 border border-green-200 rounded p-3">
                                <label class="text-sm font-semibold text-green-800 block mb-2">${isDeletionRequest ? 'تم الاعتماد بواسطة' : 'تاريخ الاعتماد'}</label>
                                <p class="text-green-700">${isDeletionRequest ? Utils.escapeHTML(request.approvedByName || '') + ' - ' : ''}${Utils.formatDate(request.approvedAt)}</p>
                            </div>
                        ` : ''}
                        ${request.rejectedAt ? `
                            <div class="bg-red-50 border border-red-200 rounded p-3">
                                <label class="text-sm font-semibold text-red-800 block mb-2">تاريخ الرفض</label>
                                <p class="text-red-700">${Utils.formatDate(request.rejectedAt)}</p>
                                ${request.rejectionReason ? `
                                    <label class="text-sm font-semibold text-red-800 block mb-2 mt-2">سبب الرفض</label>
                                    <p class="text-red-700">${Utils.escapeHTML(request.rejectionReason)}</p>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                <div class="modal-footer" style="margin-top: auto; flex-shrink: 0; width: 100%;">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إغلاق</button>
                    ${isEvaluationRequest && evaluationData?.id ? `
                        <button class="btn-info" onclick="Contractors.viewEvaluation('${evaluationData.id}'); this.closest('.modal-overlay').remove();">
                            <i class="fas fa-clipboard-check ml-2"></i>عرض التقييم كاملاً
                        </button>
                    ` : ''}
                    ${isAdmin && (request.status === 'pending' || request.status === 'under_review') ? `
                        <button class="btn-success" onclick="Contractors.approveRequest('${request.id}', '${requestCategory}'); this.closest('.modal-overlay').remove();">
                            <i class="fas fa-check ml-2"></i>اعتماد
                        </button>
                        <button class="btn-danger" onclick="Contractors.rejectRequest('${request.id}', '${requestCategory}'); this.closest('.modal-overlay').remove();">
                            <i class="fas fa-times ml-2"></i>رفض
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // ✅ إضافة event listener لزر حفظ التعديلات
        const saveChangesBtn = modal.querySelector('#save-changes-btn');
        if (saveChangesBtn) {
            saveChangesBtn.addEventListener('click', async () => {
                await this.saveRequestChanges(requestId, requestCategory);
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    /**
     * ✅ تبديل وضع التعديل
     */
    toggleEditMode() {
        const editFields = document.querySelectorAll('.edit-field');
        const viewFields = document.querySelectorAll('.view-field');
        const saveSection = document.getElementById('save-changes-section');
        const toggleBtn = document.getElementById('toggle-edit-mode-btn');
        
        if (!editFields.length) return;
        
        const isEditMode = !editFields[0].disabled;
        
        editFields.forEach(field => {
            field.disabled = isEditMode;
            field.style.display = isEditMode ? 'none' : 'block';
        });
        
        viewFields.forEach(field => {
            field.style.display = isEditMode ? 'block' : 'none';
        });
        
        if (saveSection) {
            saveSection.style.display = isEditMode ? 'none' : 'block';
        }
        
        if (toggleBtn) {
            if (isEditMode) {
                toggleBtn.innerHTML = '<i class="fas fa-edit ml-1"></i> تفعيل التعديل';
            } else {
                toggleBtn.innerHTML = '<i class="fas fa-eye ml-1"></i> إلغاء التعديل';
            }
        }
    },

    /**
     * ✅ حفظ التعديلات على الطلب
     */
    async saveRequestChanges(requestId, requestCategory = 'approval') {
        if (!Permissions.isAdmin()) {
            Notification.error('ليس لديك صلاحية لتعديل الطلبات');
            return;
        }
        
        Loading.show();
        
        try {
            let request;
            if (requestCategory === 'deletion') {
                request = (AppState.appData.contractorDeletionRequests || []).find(r => r.id === requestId);
            } else {
                request = (AppState.appData.contractorApprovalRequests || []).find(r => r.id === requestId);
            }
            
            if (!request) {
                throw new Error('الطلب غير موجود');
            }
            
            const isEvaluationRequest = request.requestType === 'evaluation';
            let updateData;
            
            if (isEvaluationRequest) {
                const contractorName = document.getElementById('edit-companyName')?.value?.trim() ?? '';
                const evaluationDate = document.getElementById('edit-evaluationDate')?.value?.trim() || null;
                const evaluatorName = document.getElementById('edit-evaluatorName')?.value?.trim() ?? '';
                const projectName = document.getElementById('edit-projectName')?.value?.trim() ?? '';
                const generalNotes = document.getElementById('edit-generalNotes')?.value?.trim() ?? '';
                
                let evaluationData = request.evaluationData;
                if (typeof evaluationData === 'string') {
                    try { evaluationData = JSON.parse(evaluationData); } catch (e) { evaluationData = {}; }
                }
                evaluationData = evaluationData || {};
                
                evaluationData.evaluationDate = evaluationDate ? new Date(evaluationDate).toISOString() : (evaluationData.evaluationDate || null);
                evaluationData.evaluatorName = evaluatorName;
                evaluationData.projectName = projectName;
                evaluationData.location = projectName;
                evaluationData.generalNotes = generalNotes;
                
                request.contractorName = contractorName;
                request.evaluationData = evaluationData;
                request.updatedAt = new Date().toISOString();
                request.updatedBy = AppState.currentUser?.id || '';
                request.updatedByName = AppState.currentUser?.name || '';
                
                updateData = {
                    contractorName,
                    evaluationData,
                    updatedAt: request.updatedAt,
                    updatedBy: request.updatedBy,
                    updatedByName: request.updatedByName
                };
            } else {
                const companyName = document.getElementById('edit-companyName')?.value?.trim();
                const serviceType = document.getElementById('edit-serviceType')?.value?.trim();
                const licenseNumber = document.getElementById('edit-licenseNumber')?.value?.trim();
                const contactPerson = document.getElementById('edit-contactPerson')?.value?.trim();
                const phone = document.getElementById('edit-phone')?.value?.trim();
                const email = document.getElementById('edit-email')?.value?.trim();
                const notes = document.getElementById('edit-notes')?.value?.trim();
                
                if (!companyName) {
                    Notification.error('يجب إدخال اسم الشركة/المقاول');
                    Loading.hide();
                    return;
                }
                
                request.companyName = companyName;
                if (serviceType !== undefined) request.serviceType = serviceType;
                if (licenseNumber !== undefined) request.licenseNumber = licenseNumber;
                if (contactPerson !== undefined) request.contactPerson = contactPerson;
                if (phone !== undefined) request.phone = phone;
                if (email !== undefined) request.email = email;
                if (notes !== undefined) request.notes = notes;
                request.updatedAt = new Date().toISOString();
                request.updatedBy = AppState.currentUser?.id || '';
                request.updatedByName = AppState.currentUser?.name || '';
                
                updateData = {
                    companyName,
                    serviceType,
                    licenseNumber,
                    contactPerson,
                    phone,
                    email,
                    notes,
                    updatedAt: request.updatedAt,
                    updatedBy: request.updatedBy,
                    updatedByName: request.updatedByName
                };
            }
            
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            }
            
            const action = requestCategory === 'deletion' 
                ? 'updateContractorDeletionRequest' 
                : 'updateContractorApprovalRequest';
                
            const result = await GoogleIntegration.sendRequest({
                action: action,
                data: {
                    requestId: requestId,
                    updateData: updateData
                }
            });
            
            if (result && result.success) {
                Notification.success('تم حفظ التعديلات بنجاح');
                const modal = document.querySelector('.modal-overlay');
                if (modal) modal.remove();
                this.refreshApprovalRequestsSection();
            } else {
                throw new Error(result?.message || 'فشل حفظ التعديلات');
            }
        } catch (error) {
            Utils.safeError('خطأ في حفظ التعديلات:', error);
            Notification.error('حدث خطأ أثناء حفظ التعديلات: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    /**
     * اعتماد طلب الاعتماد
     */
    async approveRequest(requestId, requestCategory = 'approval') {
        if (!Permissions.isAdmin()) {
            Notification.error('ليس لديك صلاحية لاعتماد الطلبات');
            return;
        }

        this.ensureApprovalRequestsSetup();
        this.ensureDeletionRequestsSetup();

        let request;
        if (requestCategory === 'deletion') {
            request = (AppState.appData.contractorDeletionRequests || []).find(r => r.id === requestId);
            if (!request) {
                Notification.error('طلب الحذف غير موجود');
                return;
            }
            if (!confirm('هل أنت متأكد من اعتماد طلب الحذف؟ سيتم حذف العنصر نهائياً.')) {
                return;
            }

            // استدعاء Backend لاعتماد طلب الحذف
            try {
                Loading.show();
                const result = await GoogleIntegration.callBackend('approveContractorDeletionRequest', {
                    requestId: requestId,
                    userData: AppState.currentUser
                });

                if (result && result.success) {
                    request.status = 'approved';
                    request.approvedAt = new Date().toISOString();
                    request.approvedBy = AppState.currentUser?.id || '';
                    request.approvedByName = AppState.currentUser?.name || '';

                    // حذف محلي
                    if (request.requestType === 'contractor') {
                        const contractors = AppState.appData.contractors || [];
                        const index = contractors.findIndex(c => c.id === request.entityId);
                        if (index !== -1) {
                            contractors.splice(index, 1);
                            AppState.appData.contractors = contractors;
                        }
                        // حذف من المعتمدين أيضاً
                        const approved = AppState.appData.approvedContractors || [];
                        const approvedIndex = approved.findIndex(ac => ac.contractorId === request.entityId || ac.id === request.entityId);
                        if (approvedIndex !== -1) {
                            approved.splice(approvedIndex, 1);
                            AppState.appData.approvedContractors = approved;
                        }
                    } else if (request.requestType === 'approved_entity') {
                        const approved = AppState.appData.approvedContractors || [];
                        const index = approved.findIndex(ac => ac.id === request.entityId);
                        if (index !== -1) {
                            const approvedRecord = approved[index];
                            approved.splice(index, 1);
                            AppState.appData.approvedContractors = approved;
                            // حذف من المقاولين أيضاً إذا كان مربوط
                            if (approvedRecord.contractorId) {
                                const contractors = AppState.appData.contractors || [];
                                const contractorIndex = contractors.findIndex(c => c.id === approvedRecord.contractorId);
                                if (contractorIndex !== -1) {
                                    contractors.splice(contractorIndex, 1);
                                    AppState.appData.contractors = contractors;
                                }
                            }
                        }
                    } else if (request.requestType === 'evaluation') {
                        const evaluations = AppState.appData.contractorEvaluations || [];
                        const index = evaluations.findIndex(e => e.id === request.entityId);
                        if (index !== -1) {
                            evaluations.splice(index, 1);
                            AppState.appData.contractorEvaluations = evaluations;
                        }
                    }

                    if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                        window.DataManager.save();
                    }

                    Loading.hide();
                    Notification.success('تم اعتماد طلب الحذف بنجاح');
                    this.refreshApprovalRequestsSection();
                    this.load(true); // ✅ إعادة تحميل القائمة - preserve current tab
                    if (typeof AppUI !== 'undefined' && AppUI.updateNotificationsBadge) {
                        AppUI.updateNotificationsBadge();
                    }
                } else {
                    Loading.hide();
                    Notification.error('فشل اعتماد طلب الحذف: ' + (result?.message || 'خطأ غير معروف'));
                }
            } catch (error) {
                Loading.hide();
                Utils.safeError('خطأ في اعتماد طلب الحذف:', error);
                Notification.error('تعذر اعتماد طلب الحذف: ' + error.message);
            }
            return;
        }

        if (!confirm('هل أنت متأكد من اعتماد هذا الطلب؟ سيتم إضافة المقاول/المورد إلى قائمة المعتمدين.')) {
            return;
        }

        try {
            Loading.show();
            let request = (AppState.appData.contractorApprovalRequests || []).find(r => r.id === requestId);
            
            // ✅ إصلاح مهم: إذا كان requestId يبدأ بـ "TEMP_"، الطلب لم يتم مزامنته بعد
            if (!request && requestId.startsWith('TEMP_')) {
                Loading.hide();
                Notification.warning('الطلب لا يزال قيد المزامنة. يرجى الانتظار قليلاً ثم إعادة المحاولة.');
                Utils.safeWarn('⚠️ محاولة اعتماد طلب بمُعرف مؤقت (tempId=' + requestId + ') - يجب الانتظار حتى اكتمال المزامنة');
                return;
            }
            
            // ✅ إذا كان request موجود لكن ID يبدأ بـ "TEMP_"، الطلب لم يتم مزامنته بعد
            if (request && request.id && request.id.startsWith('TEMP_')) {
                Loading.hide();
                if (request._isPendingSync) {
                    Notification.warning('الطلب لا يزال قيد المزامنة مع الخادم. يرجى الانتظار قليلاً ثم إعادة المحاولة.');
                } else if (request._syncError) {
                    Notification.error('فشلت مزامنة الطلب مع الخادم. يرجى إعادة إرسال الطلب أولاً.');
                } else {
                    Notification.warning('الطلب لم يتم مزامنته مع الخادم بعد. يرجى إعادة إرسال الطلب أولاً.');
                }
                Utils.safeWarn('⚠️ محاولة اعتماد طلب بمُعرف مؤقت (tempId=' + request.id + ') - يجب الانتظار حتى اكتمال المزامنة أو إعادة الإرسال');
                return;
            }
            
            // ✅ التحقق من وجود الطلب (نقبل أي معرف محفوظ: CAR_ أو UUID من Supabase)
            if (!request) {
                Loading.hide();
                Notification.error('طلب الاعتماد غير موجود');
                Utils.safeError('❌ خطأ: لم يتم العثور على الطلب. requestId=' + requestId);
                return;
            }
            // نرفض فقط المُعرف المؤقت TEMP_ (طلب لم يُزامَن بعد)
            if (request.id && String(request.id).startsWith('TEMP_')) {
                Loading.hide();
                Notification.error('الطلب لا يزال قيد المزامنة. يرجى المحاولة لاحقاً.');
                return;
            }
            const actualRequestId = request.id || requestId;
            Utils.safeLog('✅ محاولة اعتماد الطلب. requestId=' + actualRequestId + ', companyName=' + (request.companyName || 'N/A'));

            // استدعاء Backend لاعتماد الطلب أولاً
            // هذا يضمن تطابق البيانات بين Frontend و Backend
            const backendResult = await GoogleIntegration.callBackend('approveContractorApprovalRequest', {
                requestId: actualRequestId, // ✅ استخدام ID الصحيح (CAR_...)
                userData: AppState.currentUser
            });

            if (!backendResult || !backendResult.success) {
                Loading.hide();
                Notification.error('فشل اعتماد الطلب في Backend: ' + (backendResult?.message || 'خطأ غير معروف'));
                return;
            }

            // تحديث حالة الطلب محلياً
            request.status = 'approved';
            request.approvedAt = new Date().toISOString();
            request.approvedBy = AppState.currentUser?.id || '';
            request.approvedByName = AppState.currentUser?.name || '';
            request.updatedAt = new Date().toISOString();

            // تحديث البيانات المحلية بناءً على رد الخادم
            if (backendResult.approvedEntity) {
                this.ensureApprovedSetup();
                let approvedContractors = AppState.appData.approvedContractors || [];
                if (!Array.isArray(approvedContractors)) approvedContractors = [];

                // ✅ التحقق من أن approvedEntity يحتوي على البيانات المطلوبة
                const approvedEntity = backendResult.approvedEntity;
                Utils.safeLog('✅ Received approvedEntity from Backend: id=' + (approvedEntity.id || 'N/A') + ', companyName=' + (approvedEntity.companyName || 'N/A') + ', code=' + (approvedEntity.code || approvedEntity.isoCode || 'N/A'));

                // ✅ التحقق من وجود ID قبل الإضافة
                if (!approvedEntity.id) {
                    Utils.safeWarn('⚠️ Warning: approvedEntity does not have an ID - this may cause issues');
                }

                const existingIndex = approvedContractors.findIndex(item => item.id === approvedEntity.id);
                if (existingIndex !== -1) {
                    approvedContractors[existingIndex] = approvedEntity;
                    Utils.safeLog('✅ Updated existing approved contractor in AppState: id=' + approvedEntity.id);
                } else {
                    approvedContractors.push(approvedEntity);
                    Utils.safeLog('✅ Added new approved contractor to AppState: id=' + approvedEntity.id + ', companyName=' + approvedEntity.companyName);
                }
                AppState.appData.approvedContractors = approvedContractors;
                
                // ✅ التحقق النهائي: التأكد من أن البيانات تمت إضافتها بشكل صحيح
                const verifyAdded = AppState.appData.approvedContractors.find(ac => ac.id === approvedEntity.id);
                if (verifyAdded) {
                    Utils.safeLog('✅ Verified: Approved contractor added successfully to AppState.approvedContractors');
                } else {
                    Utils.safeError('❌ Error: Failed to add approved contractor to AppState.approvedContractors');
                }
            } else {
                Utils.safeWarn('⚠️ Warning: backendResult.approvedEntity is null or undefined - approved entity was not returned from Backend');
                // عند طلب مقاول/مورد: الـ API يجب أن يعيد approvedEntity (تم إصلاحه في hse-api). إن لم يُرجع، المزامنة التالية ستعيد تحميل القائمة.
                if (request.requestType === 'contractor' || request.requestType === 'supplier') {
                    Utils.safeWarn('⚠️ approvedEntity was not returned; sync below will refresh ApprovedContractors list.');
                }
            }

            if (backendResult.contractor) {
                let contractors = AppState.appData.contractors || [];
                if (!Array.isArray(contractors)) contractors = [];

                const existingIndex = contractors.findIndex(c => c.id === backendResult.contractor.id);
                if (existingIndex !== -1) {
                    contractors[existingIndex] = backendResult.contractor;
                } else {
                    contractors.push(backendResult.contractor);
                }
                AppState.appData.contractors = contractors;

                Utils.safeLog(`✅ تم تحديث بيانات المقاول: ${backendResult.contractor.name}`);
            }

            // إذا كان الطلب لتقييم، إضافة التقييم إلى القائمة
            if (request.requestType === 'evaluation' && request.evaluationData) {
                if (!Array.isArray(AppState.appData.contractorEvaluations)) {
                    AppState.appData.contractorEvaluations = [];
                }
                // تحديث حالة التقييم ليكون معتمداً
                request.evaluationData.status = 'approved';
                request.evaluationData.approvedAt = new Date().toISOString();
                request.evaluationData.approvedBy = AppState.currentUser?.id || '';
                AppState.appData.contractorEvaluations.push(request.evaluationData);

                // حفظ تلقائي بدون await
                GoogleIntegration.autoSave?.('ContractorEvaluations', AppState.appData.contractorEvaluations).catch(error => {
                    Utils.safeWarn('فشل الحفظ التلقائي للتقييمات:', error);
                });
            }

            // حفظ البيانات محلياً
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            }

            // ✅ إصلاح: Backend قام بالفعل بالحفظ باستخدام updateSingleRowInSheet (آمنة)
            // ✅ لا حاجة لـ autoSave هنا لأنها قد تحذف الطلبات الأخرى
            // ✅ نستخدم المزامنة فقط للتأكد من التطابق

            // مزامنة البيانات من Backend للتأكد من التطابق
            // ✅ تحسين: مزامنة فقط الأوراق المتعلقة بالمقاولين لتجنب إظهار شاشة Database loaded الكاملة
            try {
                Utils.safeLog('🔄 بدء مزامنة بيانات المقاولين من Backend...');
                await GoogleIntegration.syncData({
                    silent: true,         // ✅ تغيير: صامتة لتجنب إظهار شاشة Database loaded
                    showLoader: false,    // ✅ تغيير: عدم إظهار loader الكامل
                    notifyOnSuccess: false,
                    notifyOnError: true,  // ✅ إظهار الأخطاء فقط
                    sheets: ['ContractorApprovalRequests', 'ApprovedContractors', 'Contractors'] // ✅ مزامنة فقط أوراق المقاولين
                });
                Utils.safeLog('✅ تمت مزامنة بيانات المقاولين من Backend بنجاح');

                // التحقق من وجود المقاول المعتمد بعد المزامنة
                const verifyApproved = AppState.appData.approvedContractors?.find(ac =>
                    ac.companyName === request.companyName &&
                    ac.entityType === (request.requestType === 'contractor' ? 'contractor' : 'supplier')
                );

                if (verifyApproved) {
                    Utils.safeLog(`✅ تم التحقق: المقاول "${verifyApproved.companyName}" موجود في قائمة المعتمدين (ID: ${verifyApproved.id}, Code: ${verifyApproved.code || verifyApproved.isoCode})`);
                } else {
                    Utils.safeWarn(`⚠️ تحذير: لم يتم العثور على المقاول "${request.companyName}" في قائمة المعتمدين بعد المزامنة`);
                }
            } catch (syncError) {
                Utils.safeError('❌ خطأ: فشلت مزامنة البيانات من Backend:', syncError);
                // إظهار تنبيه للمستخدم
                Notification.warning('تم اعتماد الطلب بنجاح في Backend، لكن حدث خطأ في المزامنة. يرجى تحديث الصفحة للتأكد من ظهور البيانات.');
            }

            Loading.hide();

            // التأكد من أن المقاول تم إضافته بنجاح والربط موجود
            if (request.requestType === 'contractor' || request.requestType === 'supplier') {
                // البحث عن المعتمد أولاً
                const linkedApproved = AppState.appData.approvedContractors?.find(ac =>
                    ac.companyName === request.companyName &&
                    ac.entityType === (request.requestType === 'contractor' ? 'contractor' : 'supplier')
                ) || backendResult.approvedEntity;
                
                const addedContractor = AppState.appData.contractors?.find(c =>
                    c.name === request.companyName ||
                    (linkedApproved && c.id === linkedApproved.contractorId) ||
                    (linkedApproved && c.approvedEntityId === linkedApproved.id)
                );

                if (addedContractor && linkedApproved) {
                    // التحقق من الربط
                    if (linkedApproved.contractorId === addedContractor.id || addedContractor.approvedEntityId === linkedApproved.id) {
                        Utils.safeLog(`✅ تم إضافة ${request.requestType === 'supplier' ? 'المورد' : 'المقاول'} "${addedContractor.name}" بنجاح والربط موجود (Contractor ID: ${addedContractor.id}, Approved ID: ${linkedApproved.id})`);
                    } else {
                        Utils.safeWarn('⚠️ تحذير: المقاول والمعتمد موجودان لكن الربط غير مكتمل');
                    }
                } else {
                    Utils.safeWarn('⚠️ تحذير: المقاول أو المعتمد لم يظهر في القوائم بعد الاعتماد');
                }
            }

            Notification.success('تم اعتماد الطلب بنجاح. تم إضافة المقاول/المورد إلى قائمة المعتمدين والمقاولين.');

            // تحديث جميع الأقسام ذات الصلة
            this.refreshApprovalRequestsSection();

            // تحديث قائمة المعتمدين إذا كان التبويب مفتوحاً
            if (this.currentTab === 'approved') {
                this.refreshApprovedEntitiesList();
            }

            // تحديث الإشعارات
            if (typeof AppUI !== 'undefined' && AppUI.updateNotificationsBadge) {
                AppUI.updateNotificationsBadge();
            }
        } catch (error) {
            Loading.hide();
            Utils.safeError('خطأ في اعتماد الطلب:', error);
            Notification.error('تعذر اعتماد الطلب: ' + error.message);
        }
    },

    /**
     * رفض طلب الاعتماد
     */
    async rejectRequest(requestId, requestCategory = 'approval') {
        if (!Permissions.isAdmin()) {
            Notification.error('ليس لديك صلاحية لرفض الطلبات');
            return;
        }

        this.ensureApprovalRequestsSetup();
        this.ensureDeletionRequestsSetup();

        let request;
        if (requestCategory === 'deletion') {
            request = (AppState.appData.contractorDeletionRequests || []).find(r => r.id === requestId);
            if (!request) {
                Notification.error('طلب الحذف غير موجود');
                return;
            }

            const reason = prompt('يرجى إدخال سبب الرفض:') || 'تم الرفض من قبل المدير';
            if (reason === null) return; // المستخدم ألغى

            try {
                Loading.show();
                const result = await GoogleIntegration.callBackend('rejectContractorDeletionRequest', {
                    requestId: requestId,
                    rejectionReason: reason,
                    userData: AppState.currentUser
                });

                if (result && result.success) {
                    request.status = 'rejected';
                    request.rejectedAt = new Date().toISOString();
                    request.rejectedBy = AppState.currentUser?.id || '';
                    request.rejectedByName = AppState.currentUser?.name || '';
                    request.rejectionReason = reason;

                    if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                        window.DataManager.save();
                    }

                    Loading.hide();
                    Notification.success('تم رفض طلب الحذف بنجاح');
                    this.refreshApprovalRequestsSection();
                    if (typeof AppUI !== 'undefined' && AppUI.updateNotificationsBadge) {
                        AppUI.updateNotificationsBadge();
                    }
                } else {
                    Loading.hide();
                    Notification.error('فشل رفض طلب الحذف: ' + (result?.message || 'خطأ غير معروف'));
                }
            } catch (error) {
                Loading.hide();
                Utils.safeError('خطأ في رفض طلب الحذف:', error);
                Notification.error('تعذر رفض طلب الحذف: ' + error.message);
            }
            return;
        }

        const reason = prompt('يرجى إدخال سبب الرفض (اختياري):');
        if (reason === null) return; // المستخدم ألغى

        try {
            Loading.show();
            const request = (AppState.appData.contractorApprovalRequests || []).find(r => r.id === requestId);
            if (!request) {
                Loading.hide();
                Notification.error('طلب الاعتماد غير موجود');
                return;
            }

            // ✅ إصلاح: استخدام rejectContractorApprovalRequest في Backend مباشرة
            // ✅ هذا يضمن عدم حذف الطلبات الموجودة في Google Sheets
            const backendResult = await GoogleIntegration.sendRequest({
                action: 'rejectContractorApprovalRequest',
                data: {
                    requestId: requestId,
                    rejectionReason: reason || '',
                    userData: AppState.currentUser
                }
            });

            if (backendResult && backendResult.success) {
                // ✅ بعد نجاح الحفظ في Backend، تحديث الطلب محلياً
                request.status = 'rejected';
                request.rejectedAt = new Date().toISOString();
                request.rejectedBy = AppState.currentUser?.id || '';
                request.rejectedByName = AppState.currentUser?.name || '';
                request.rejectionReason = reason || '';
                request.updatedAt = new Date().toISOString();

                // حفظ البيانات محلياً
                if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                    window.DataManager.save();
                }

                Loading.hide();
                Utils.safeLog('✅ تم رفض طلب الاعتماد في Google Sheets بنجاح');
            } else {
                // إذا فشل الحفظ في Backend، نحدث محلياً فقط
                request.status = 'rejected';
                request.rejectedAt = new Date().toISOString();
                request.rejectedBy = AppState.currentUser?.id || '';
                request.rejectedByName = AppState.currentUser?.name || '';
                request.rejectionReason = reason || '';
                request.updatedAt = new Date().toISOString();

                // حفظ البيانات محلياً
                if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                    window.DataManager.save();
                }

                Loading.hide();
                Utils.safeWarn('⚠️ فشل رفض طلب الاعتماد في Google Sheets، تم التحديث محلياً فقط');
                Notification.warning('تم تحديث الطلب محلياً. سيتم المزامنة لاحقاً.');
            }

            Notification.success('تم رفض الطلب بنجاح.');
            this.refreshApprovalRequestsSection();

            // تحديث الإشعارات
            if (typeof AppUI !== 'undefined' && AppUI.updateNotificationsBadge) {
                AppUI.updateNotificationsBadge();
            }
        } catch (error) {
            Utils.safeError('خطأ في رفض الطلب:', error);
            Notification.error('تعذر رفض الطلب: ' + error.message);
        }
    },

    // ===== تحليل بيانات المقاولين =====
    async renderAnalyticsSection() {
        const isAdmin = Permissions.isAdmin();
        if (!isAdmin) {
            return `
                <div class="content-card">
                    <div class="card-body">
                        <div class="empty-state">
                            <i class="fas fa-lock text-4xl text-gray-300 mb-3"></i>
                            <p class="text-gray-500">هذه الصفحة متاحة للمدير فقط</p>
                        </div>
                    </div>
                </div>
            `;
        }

        const contractors = AppState.appData.contractors || [];
        const approvedContractors = AppState.appData.approvedContractors || [];
        const evaluations = AppState.appData.contractorEvaluations || [];
        const violations = AppState.appData.violations || [];

        // قائمة موحدة لعرض "تحليل مفصل لكل مقاول": استخدام المقاولين إن وُجدوا، وإلا قائمة المعتمدين بشكل معياري
        const contractorsForDetailed = (Array.isArray(contractors) && contractors.length > 0)
            ? contractors
            : (Array.isArray(approvedContractors) && approvedContractors.length > 0)
                ? approvedContractors.map(ac => ({
                    ...ac,
                    id: ac.id || ac.contractorId,
                    name: ac.companyName || ac.name || '',
                    endDate: ac.expiryDate || ac.endDate,
                    status: ac.status || 'نشط'
                }))
                : [];

        // تحليل البيانات
        const analytics = this.calculateContractorAnalytics(contractors, approvedContractors, evaluations, violations);

        // التحقق من العقود المنتهية
        const expiringContracts = this.getExpiringContracts(contractors, approvedContractors);

        return `
            <div class="content-card border-2 border-indigo-200 rounded-xl shadow-xl overflow-hidden">
                <div class="card-header bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white">
                    <div class="flex items-center justify-between p-6">
                        <div class="flex items-center">
                            <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center ml-4">
                                <i class="fas fa-chart-line text-3xl"></i>
                            </div>
                            <div>
                                <h2 class="card-title text-2xl font-bold mb-1">
                                    تحليل بيانات المقاولين
                                </h2>
                                <p class="text-indigo-100 text-sm">نظرة شاملة على أداء المقاولين والإحصائيات</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                                <p class="text-xs text-indigo-100">آخر تحديث</p>
                                <p class="text-sm font-bold">${new Date().toLocaleDateString('ar-SA', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body p-6 bg-gray-50">
                    ${this.renderAnalyticsOverview(analytics)}
                    ${this.renderContractorViolationsAnalysis(contractors, violations)}
                    ${this.renderExpiringContractsAlert(expiringContracts)}
                    ${this.renderDetailedContractorAnalysis(contractorsForDetailed, approvedContractors, evaluations, violations)}
                </div>
            </div>
        `;
    },

    calculateContractorAnalytics(contractors, approvedContractors, evaluations, violations) {
        // إجمالي المقاولين
        const totalContractors = contractors.length;
        
        // المقاولين المعتمدين (من قائمة المعتمدين)
        const totalApproved = approvedContractors.filter(ac => {
            const status = (ac.status || '').toLowerCase();
            return status === 'approved' || status === 'معتمد' || status === 'نشط';
        }).length;

        // إجمالي التقييمات
        const totalEvaluations = evaluations.length;

        // إجمالي المخالفات (جميع المخالفات المتعلقة بالمقاولين)
        const totalViolations = violations.filter(v => {
            return v.contractorName || 
                   v.contractorId || 
                   (v.personType && (v.personType === 'contractor' || v.personType === 'مقاول'));
        }).length;

        // حساب متوسط التقييمات بدقة
        let avgScore = 0;
        if (evaluations.length > 0) {
            const validScores = evaluations
                .map(e => parseFloat(e.finalScore) || parseFloat(e.score) || 0)
                .filter(score => !isNaN(score) && score >= 0 && score <= 100);
            
            if (validScores.length > 0) {
                const sum = validScores.reduce((acc, score) => acc + score, 0);
                avgScore = sum / validScores.length;
            }
        }

        // المقاولين النشطين (من قائمة المقاولين)
        const activeContractors = contractors.filter(c => {
            const status = (c.status || '').toString().trim();
            return status === 'نشط' || status === 'active' || status === 'معتمد';
        }).length;

        // المقاولين المنتهية عقودهم
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const expiredContractors = contractors.filter(c => {
            if (!c.endDate) return false;
            try {
                const endDate = new Date(c.endDate);
                endDate.setHours(0, 0, 0, 0);
                return endDate < now;
            } catch (e) {
                return false;
            }
        }).length;

        // المقاولين قريبين من الانتهاء (خلال 30 يوم)
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const expiringSoon = contractors.filter(c => {
            if (!c.endDate) return false;
            try {
                const endDate = new Date(c.endDate);
                endDate.setHours(0, 0, 0, 0);
                return endDate >= now && endDate <= thirtyDaysFromNow;
            } catch (e) {
                return false;
            }
        }).length;

        // نسبة الاعتماد (من إجمالي المقاولين)
        const approvalRate = totalContractors > 0 
            ? Math.round((totalApproved / totalContractors) * 100 * 100) / 100 
            : 0;

        // نسبة المخالفات (مخالفات لكل مقاول)
        const violationsPerContractor = totalContractors > 0
            ? Math.round((totalViolations / totalContractors) * 100) / 100
            : 0;

        // نسبة المقاولين النشطين
        const activeRate = totalContractors > 0
            ? Math.round((activeContractors / totalContractors) * 100 * 100) / 100
            : 0;

        // معدل حل المخالفات
        const contractorViolations = violations.filter(v => 
            v.contractorName || v.contractorId || (v.personType && (v.personType === 'contractor' || v.personType === 'مقاول'))
        );
        const resolvedViolations = contractorViolations.filter(v => {
            const status = (v.status || '').toString().trim();
            return status === 'محلول' || status === 'resolved' || status === 'تم الحل';
        }).length;
        const violationResolutionRate = totalViolations > 0
            ? Math.round((resolvedViolations / totalViolations) * 100 * 100) / 100
            : 0;

        // توزيع المخالفات حسب الشدة
        const highSeverityViolations = contractorViolations.filter(v => {
            const severity = (v.severity || '').toString().trim();
            return severity === 'عالية' || severity === 'high' || severity === 'حرجة';
        }).length;
        const mediumSeverityViolations = contractorViolations.filter(v => {
            const severity = (v.severity || '').toString().trim();
            return severity === 'متوسطة' || severity === 'medium';
        }).length;
        const lowSeverityViolations = contractorViolations.filter(v => {
            const severity = (v.severity || '').toString().trim();
            return severity === 'منخفضة' || severity === 'low' || severity === 'قليلة';
        }).length;

        return {
            totalContractors,
            totalApproved,
            totalEvaluations,
            totalViolations,
            avgScore: Math.round(avgScore * 100) / 100,
            activeContractors,
            expiredContractors,
            expiringSoon,
            approvalRate,
            violationsPerContractor,
            activeRate,
            violationResolutionRate,
            resolvedViolations,
            highSeverityViolations,
            mediumSeverityViolations,
            lowSeverityViolations
        };
    },

    renderAnalyticsOverview(analytics) {
        // حساب النسب المئوية للمؤشرات البصرية
        const approvalProgress = Math.min(analytics.approvalRate, 100);
        const activeProgress = Math.min(analytics.activeRate, 100);
        const resolutionProgress = Math.min(analytics.violationResolutionRate, 100);
        const avgScoreProgress = Math.min(analytics.avgScore, 100);

        // تحديد لون متوسط التقييم
        const getScoreColor = (score) => {
            if (score >= 80) return 'text-green-600';
            if (score >= 60) return 'text-yellow-600';
            return 'text-red-600';
        };

        const getScoreBg = (score) => {
            if (score >= 80) return 'bg-gradient-to-br from-green-50 to-green-100 border-green-300';
            if (score >= 60) return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300';
            return 'bg-gradient-to-br from-red-50 to-red-100 border-red-300';
        };

        return `
            <style>
                .analytics-card {
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                .analytics-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                }
                .analytics-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
                }
                .progress-bar-container {
                    height: 8px;
                    background: rgba(0,0,0,0.1);
                    border-radius: 10px;
                    overflow: hidden;
                    margin-top: 8px;
                }
                .progress-bar {
                    height: 100%;
                    border-radius: 10px;
                    transition: width 0.6s ease;
                    background: linear-gradient(90deg, var(--bar-start), var(--bar-end));
                }
                .stat-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                }
                .trend-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    padding: 2px 8px;
                    border-radius: 12px;
                    margin-top: 4px;
                }
            </style>
            
            <!-- البطاقات الرئيسية -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <!-- إجمالي المقاولين -->
                <div class="analytics-card bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg" 
                     style="--gradient-start: #3b82f6; --gradient-end: #60a5fa;">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-700 mb-1">إجمالي المقاولين</p>
                            <p class="text-3xl font-bold text-blue-700">${analytics.totalContractors}</p>
                        </div>
                        <div class="stat-icon bg-blue-200 text-blue-700">
                            <i class="fas fa-users"></i>
                        </div>
                    </div>
                    <div class="text-xs text-gray-600 mt-2">
                        <i class="fas fa-info-circle ml-1"></i>
                        جميع المقاولين المسجلين
                    </div>
                </div>

                <!-- المعتمدين -->
                <div class="analytics-card bg-gradient-to-br from-green-50 via-green-100 to-green-50 border-2 border-green-300 rounded-xl p-6 shadow-lg"
                     style="--gradient-start: #10b981; --gradient-end: #34d399;">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-700 mb-1">المعتمدين</p>
                            <p class="text-3xl font-bold text-green-700">${analytics.totalApproved}</p>
                        </div>
                        <div class="stat-icon bg-green-200 text-green-700">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${approvalProgress}%; --bar-start: #10b981; --bar-end: #34d399;"></div>
                    </div>
                    <div class="text-xs text-gray-600 mt-2">
                        <span class="font-semibold text-green-700">${analytics.approvalRate}%</span> من إجمالي المقاولين
                    </div>
                </div>

                <!-- إجمالي التقييمات -->
                <div class="analytics-card bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-50 border-2 border-yellow-300 rounded-xl p-6 shadow-lg"
                     style="--gradient-start: #f59e0b; --gradient-end: #fbbf24;">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-700 mb-1">إجمالي التقييمات</p>
                            <p class="text-3xl font-bold text-yellow-700">${analytics.totalEvaluations}</p>
                        </div>
                        <div class="stat-icon bg-yellow-200 text-yellow-700">
                            <i class="fas fa-clipboard-check"></i>
                        </div>
                    </div>
                    <div class="text-xs text-gray-600 mt-2">
                        <i class="fas fa-chart-line ml-1"></i>
                        تقييمات تم إجراؤها
                    </div>
                </div>

                <!-- إجمالي المخالفات -->
                <div class="analytics-card bg-gradient-to-br from-red-50 via-red-100 to-red-50 border-2 border-red-300 rounded-xl p-6 shadow-lg"
                     style="--gradient-start: #ef4444; --gradient-end: #f87171;">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-700 mb-1">إجمالي المخالفات</p>
                            <p class="text-3xl font-bold text-red-700">${analytics.totalViolations}</p>
                        </div>
                        <div class="stat-icon bg-red-200 text-red-700">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                    </div>
                    <div class="text-xs text-gray-600 mt-2">
                        <span class="font-semibold text-red-700">${analytics.violationsPerContractor}</span> مخالفة لكل مقاول
                    </div>
                </div>
            </div>

            <!-- المؤشرات الثانوية -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <!-- متوسط التقييم -->
                <div class="analytics-card ${getScoreBg(analytics.avgScore)} border-2 rounded-xl p-6 shadow-lg">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-700 mb-1">متوسط التقييم</p>
                            <p class="text-3xl font-bold ${getScoreColor(analytics.avgScore)}">${analytics.avgScore}%</p>
                        </div>
                        <div class="stat-icon ${analytics.avgScore >= 80 ? 'bg-green-200 text-green-700' : analytics.avgScore >= 60 ? 'bg-yellow-200 text-yellow-700' : 'bg-red-200 text-red-700'}">
                            <i class="fas fa-star"></i>
                        </div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${avgScoreProgress}%; --bar-start: ${analytics.avgScore >= 80 ? '#10b981' : analytics.avgScore >= 60 ? '#f59e0b' : '#ef4444'}; --bar-end: ${analytics.avgScore >= 80 ? '#34d399' : analytics.avgScore >= 60 ? '#fbbf24' : '#f87171'};"></div>
                    </div>
                    <div class="text-xs text-gray-600 mt-2">
                        ${analytics.totalEvaluations > 0 ? `من ${analytics.totalEvaluations} تقييم` : 'لا توجد تقييمات'}
                    </div>
                </div>

                <!-- نسبة الاعتماد -->
                <div class="analytics-card bg-gradient-to-br from-indigo-50 via-indigo-100 to-indigo-50 border-2 border-indigo-300 rounded-xl p-6 shadow-lg"
                     style="--gradient-start: #6366f1; --gradient-end: #818cf8;">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-700 mb-1">نسبة الاعتماد</p>
                            <p class="text-3xl font-bold text-indigo-700">${analytics.approvalRate}%</p>
                        </div>
                        <div class="stat-icon bg-indigo-200 text-indigo-700">
                            <i class="fas fa-certificate"></i>
                        </div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${approvalProgress}%; --bar-start: #6366f1; --bar-end: #818cf8;"></div>
                    </div>
                    <div class="text-xs text-gray-600 mt-2">
                        ${analytics.totalApproved} من ${analytics.totalContractors} مقاول
                    </div>
                </div>

                <!-- المقاولين النشطين -->
                <div class="analytics-card bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 border-2 border-orange-300 rounded-xl p-6 shadow-lg"
                     style="--gradient-start: #f97316; --gradient-end: #fb923c;">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-700 mb-1">المقاولين النشطين</p>
                            <p class="text-3xl font-bold text-orange-700">${analytics.activeContractors}</p>
                        </div>
                        <div class="stat-icon bg-orange-200 text-orange-700">
                            <i class="fas fa-bolt"></i>
                        </div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${activeProgress}%; --bar-start: #f97316; --bar-end: #fb923c;"></div>
                    </div>
                    <div class="text-xs text-gray-600 mt-2">
                        <span class="font-semibold text-orange-700">${analytics.activeRate}%</span> من إجمالي المقاولين
                    </div>
                </div>

                <!-- معدل حل المخالفات -->
                <div class="analytics-card bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50 border-2 border-purple-300 rounded-xl p-6 shadow-lg"
                     style="--gradient-start: #a855f7; --gradient-end: #c084fc;">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-700 mb-1">معدل حل المخالفات</p>
                            <p class="text-3xl font-bold text-purple-700">${analytics.violationResolutionRate}%</p>
                        </div>
                        <div class="stat-icon bg-purple-200 text-purple-700">
                            <i class="fas fa-check-double"></i>
                        </div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${resolutionProgress}%; --bar-start: #a855f7; --bar-end: #c084fc;"></div>
                    </div>
                    <div class="text-xs text-gray-600 mt-2">
                        ${analytics.resolvedViolations} من ${analytics.totalViolations} مخالفة محلولة
                    </div>
                </div>
            </div>

            <!-- إحصائيات إضافية -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <!-- العقود المنتهية -->
                <div class="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-5 shadow-md">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 mb-1">العقود المنتهية</p>
                            <p class="text-2xl font-bold text-gray-700">${analytics.expiredContractors}</p>
                        </div>
                        <i class="fas fa-calendar-times text-3xl text-gray-400"></i>
                    </div>
                </div>

                <!-- العقود قريبة الانتهاء -->
                <div class="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-5 shadow-md">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 mb-1">قريبة من الانتهاء</p>
                            <p class="text-2xl font-bold text-amber-700">${analytics.expiringSoon || 0}</p>
                        </div>
                        <i class="fas fa-hourglass-half text-3xl text-amber-400"></i>
                    </div>
                </div>

                <!-- توزيع المخالفات -->
                <div class="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 rounded-xl p-5 shadow-md">
                    <p class="text-sm font-medium text-gray-600 mb-3">توزيع المخالفات حسب الشدة</p>
                    <div class="space-y-2">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-red-600 font-medium">عالية:</span>
                            <span class="font-bold">${analytics.highSeverityViolations}</span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-yellow-600 font-medium">متوسطة:</span>
                            <span class="font-bold">${analytics.mediumSeverityViolations}</span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-green-600 font-medium">منخفضة:</span>
                            <span class="font-bold">${analytics.lowSeverityViolations}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderContractorViolationsAnalysis(contractors, violations) {
        // فلترة المخالفات المتعلقة بالمقاولين بدقة
        const contractorViolations = violations.filter(v => {
            return v.contractorName || 
                   v.contractorId || 
                   (v.personType && (v.personType === 'contractor' || v.personType === 'مقاول'));
        });

        // تجميع المخالفات حسب المقاول
        const violationsByContractor = {};
        contractorViolations.forEach(v => {
            const contractorName = (v.contractorName || v.contractorId || 'غير محدد').toString().trim();
            if (!violationsByContractor[contractorName]) {
                violationsByContractor[contractorName] = {
                    total: 0,
                    high: 0,
                    medium: 0,
                    low: 0,
                    resolved: 0,
                    pending: 0
                };
            }
            violationsByContractor[contractorName].total++;
            
            const severity = (v.severity || '').toString().trim();
            if (severity === 'عالية' || severity === 'high' || severity === 'حرجة') {
                violationsByContractor[contractorName].high++;
            } else if (severity === 'متوسطة' || severity === 'medium') {
                violationsByContractor[contractorName].medium++;
            } else {
                violationsByContractor[contractorName].low++;
            }
            
            const status = (v.status || '').toString().trim();
            if (status === 'محلول' || status === 'resolved' || status === 'تم الحل') {
                violationsByContractor[contractorName].resolved++;
            } else {
                violationsByContractor[contractorName].pending++;
            }
        });

        const contractorsList = Object.entries(violationsByContractor)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 10); // أعلى 10 مقاولين بمخالفات

        if (contractorsList.length === 0) {
            return `
                <div class="content-card mb-6 border-2 border-gray-200 rounded-xl shadow-lg">
                    <div class="card-header bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                        <h3 class="card-title text-lg font-bold text-gray-800">
                            <i class="fas fa-exclamation-triangle ml-2 text-yellow-500"></i>
                            تحليل مخالفات المقاولين
                        </h3>
                    </div>
                    <div class="card-body p-8">
                        <div class="text-center">
                            <i class="fas fa-check-circle text-5xl text-green-400 mb-4"></i>
                            <p class="text-gray-600 text-lg font-medium">لا توجد مخالفات مسجلة للمقاولين</p>
                            <p class="text-gray-500 text-sm mt-2">جميع المقاولين يلتزمون بالمعايير</p>
                        </div>
                    </div>
                </div>
            `;
        }

        // حساب النسب المئوية
        const getResolutionRate = (stats) => {
            return stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
        };

        const getSeverityRate = (stats, type) => {
            return stats.total > 0 ? Math.round((stats[type] / stats.total) * 100) : 0;
        };

        return `
            <div class="content-card mb-6 border-2 border-red-200 rounded-xl shadow-lg overflow-hidden">
                <div class="card-header bg-gradient-to-r from-red-50 via-red-100 to-red-50 border-b-2 border-red-200">
                    <div class="flex items-center justify-between p-4">
                        <h3 class="card-title text-lg font-bold text-red-800">
                            <i class="fas fa-exclamation-triangle ml-2"></i>
                            تحليل مخالفات المقاولين
                        </h3>
                        <span class="badge badge-danger text-sm px-3 py-1">
                            ${contractorsList.length} مقاول
                        </span>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="overflow-x-auto">
                        <table class="data-table w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-4 text-right font-bold text-gray-700 border-b border-gray-200">اسم المقاول</th>
                                    <th class="px-6 py-4 text-center font-bold text-gray-700 border-b border-gray-200">إجمالي المخالفات</th>
                                    <th class="px-6 py-4 text-center font-bold text-gray-700 border-b border-gray-200">
                                        <span class="text-red-600">عالية</span>
                                    </th>
                                    <th class="px-6 py-4 text-center font-bold text-gray-700 border-b border-gray-200">
                                        <span class="text-yellow-600">متوسطة</span>
                                    </th>
                                    <th class="px-6 py-4 text-center font-bold text-gray-700 border-b border-gray-200">
                                        <span class="text-green-600">منخفضة</span>
                                    </th>
                                    <th class="px-6 py-4 text-center font-bold text-gray-700 border-b border-gray-200">
                                        <span class="text-green-600">محلولة</span>
                                    </th>
                                    <th class="px-6 py-4 text-center font-bold text-gray-700 border-b border-gray-200">
                                        <span class="text-orange-600">قيد المعالجة</span>
                                    </th>
                                    <th class="px-6 py-4 text-center font-bold text-gray-700 border-b border-gray-200">معدل الحل</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                ${contractorsList.map(([name, stats], index) => {
                                    const resolutionRate = getResolutionRate(stats);
                                    const highRate = getSeverityRate(stats, 'high');
                                    return `
                                    <tr class="hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                                        <td class="px-6 py-4">
                                            <div class="flex items-center">
                                                <div class="flex-shrink-0 w-8 h-8 bg-red-100 rounded-md flex items-center justify-center ml-3">
                                                    <span class="text-red-600 font-bold text-sm">${index + 1}</span>
                                                </div>
                                                <strong class="text-gray-800 font-semibold">${Utils.escapeHTML(name)}</strong>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 text-center">
                                            <span class="font-bold text-blue-700" style="font-size: 16px;">
                                                ${stats.total}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 text-center">
                                            <div class="flex flex-col items-center">
                                                <span class="badge badge-danger text-sm font-bold px-3 py-1 mb-1">${stats.high}</span>
                                                ${highRate > 0 ? `<span class="text-xs text-gray-500">${highRate}%</span>` : ''}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 text-center">
                                            <span class="badge badge-warning text-sm font-bold px-3 py-1">${stats.medium}</span>
                                        </td>
                                        <td class="px-6 py-4 text-center">
                                            <span class="badge badge-success text-sm font-bold px-3 py-1">${stats.low}</span>
                                        </td>
                                        <td class="px-6 py-4 text-center">
                                            <span class="badge badge-success text-sm font-bold px-3 py-1 bg-green-500">
                                                ${stats.resolved}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 text-center">
                                            <span class="badge badge-warning text-sm font-bold px-3 py-1 bg-orange-400">
                                                ${stats.pending}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 text-center">
                                            <div class="flex flex-col items-center">
                                                <div class="w-20 bg-gray-200 rounded-full h-2 mb-1">
                                                    <div class="bg-green-500 h-2 rounded-full transition-all" style="width: ${resolutionRate}%"></div>
                                                </div>
                                                <span class="text-xs font-semibold ${resolutionRate >= 80 ? 'text-green-600' : resolutionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}">
                                                    ${resolutionRate}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    getExpiringContracts(contractors, approvedContractors) {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const expiring = [];

        // من قائمة المقاولين
        contractors.forEach(c => {
            if (c.endDate) {
                const endDate = new Date(c.endDate);
                if (endDate >= now && endDate <= thirtyDaysFromNow) {
                    expiring.push({
                        id: c.id,
                        name: c.name,
                        type: 'contractor',
                        endDate: c.endDate,
                        daysRemaining: Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
                    });
                }
            }
        });

        // من قائمة المعتمدين
        approvedContractors.forEach(ac => {
            if (ac.expiryDate) {
                const expiryDate = new Date(ac.expiryDate);
                if (expiryDate >= now && expiryDate <= thirtyDaysFromNow) {
                    expiring.push({
                        id: ac.id,
                        name: ac.companyName || ac.name,
                        type: 'approved',
                        endDate: ac.expiryDate,
                        daysRemaining: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
                    });
                }
            }
        });

        return expiring.sort((a, b) => a.daysRemaining - b.daysRemaining);
    },

    renderExpiringContractsAlert(expiringContracts) {
        if (expiringContracts.length === 0) {
            return '';
        }

        // تصنيف العقود حسب قرب الانتهاء
        const critical = expiringContracts.filter(c => c.daysRemaining <= 7);
        const warning = expiringContracts.filter(c => c.daysRemaining > 7 && c.daysRemaining <= 15);
        const normal = expiringContracts.filter(c => c.daysRemaining > 15);

        const getPriorityBadge = (days) => {
            if (days <= 7) {
                return '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border-2 border-red-300"><i class="fas fa-exclamation-circle ml-1"></i>حرج</span>';
            } else if (days <= 15) {
                return '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border-2 border-yellow-300"><i class="fas fa-exclamation-triangle ml-1"></i>تحذير</span>';
            } else {
                return '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border-2 border-blue-300"><i class="fas fa-info-circle ml-1"></i>عادي</span>';
            }
        };

        const getDaysBadge = (days) => {
            if (days <= 7) {
                return `badge-danger`;
            } else if (days <= 15) {
                return `badge-warning`;
            } else {
                return `badge-info`;
            }
        };

        return `
            <div class="content-card mb-6 border-2 border-yellow-400 rounded-xl shadow-lg overflow-hidden">
                <div class="card-header bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50 border-b-2 border-yellow-300">
                    <div class="flex items-center justify-between p-4">
                        <div class="flex items-center">
                            <div class="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center ml-3">
                                <i class="fas fa-exclamation-circle text-white text-xl"></i>
                            </div>
                            <div>
                                <h3 class="card-title text-lg font-bold text-yellow-900">
                                    تنبيه: عقود قريبة من الانتهاء
                                </h3>
                                <p class="text-sm text-yellow-700 mt-1">يوجد ${expiringContracts.length} عقد يحتاج إلى متابعة</p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            ${critical.length > 0 ? `<span class="badge badge-danger text-sm px-3 py-1">${critical.length} حرج</span>` : ''}
                            ${warning.length > 0 ? `<span class="badge badge-warning text-sm px-3 py-1">${warning.length} تحذير</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="overflow-x-auto">
                        <table class="data-table w-full">
                            <thead class="bg-yellow-100">
                                <tr>
                                    <th class="px-6 py-4 text-right font-bold text-yellow-900 border-b border-yellow-200">اسم المقاول / الجهة</th>
                                    <th class="px-6 py-4 text-center font-bold text-yellow-900 border-b border-yellow-200">نوع العقد</th>
                                    <th class="px-6 py-4 text-center font-bold text-yellow-900 border-b border-yellow-200">تاريخ الانتهاء</th>
                                    <th class="px-6 py-4 text-center font-bold text-yellow-900 border-b border-yellow-200">الأيام المتبقية</th>
                                    <th class="px-6 py-4 text-center font-bold text-yellow-900 border-b border-yellow-200">الأولوية</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-yellow-100">
                                ${expiringContracts.map((contract, index) => {
                                    const isCritical = contract.daysRemaining <= 7;
                                    const isWarning = contract.daysRemaining > 7 && contract.daysRemaining <= 15;
                                    return `
                                    <tr class="hover:bg-yellow-50 transition-colors ${isCritical ? 'bg-red-50' : isWarning ? 'bg-yellow-50' : 'bg-white'} ${index % 2 === 0 ? '' : 'bg-opacity-50'}">
                                        <td class="px-6 py-4">
                                            <div class="flex items-center">
                                                <div class="flex-shrink-0 w-10 h-10 ${isCritical ? 'bg-red-200' : isWarning ? 'bg-yellow-200' : 'bg-blue-200'} rounded-full flex items-center justify-center ml-3">
                                                    <i class="fas ${contract.type === 'contractor' ? 'fa-hammer' : 'fa-building'} ${isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-blue-600'}"></i>
                                                </div>
                                                <strong class="text-gray-800 font-semibold">${Utils.escapeHTML(contract.name)}</strong>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 text-center">
                                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${contract.type === 'contractor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}">
                                                <i class="fas ${contract.type === 'contractor' ? 'fa-hammer' : 'fa-check-circle'} ml-1"></i>
                                                ${contract.type === 'contractor' ? 'مقاول' : 'معتمد'}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 text-center">
                                            <div class="flex flex-col items-center">
                                                <span class="text-gray-700 font-medium">${Utils.formatDate(contract.endDate)}</span>
                                                <span class="text-xs text-gray-500 mt-1">
                                                    <i class="far fa-calendar ml-1"></i>
                                                    ${new Date(contract.endDate).toLocaleDateString('ar-SA', { weekday: 'long' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 text-center">
                                            <div class="flex flex-col items-center">
                                                <span class="badge ${getDaysBadge(contract.daysRemaining)} text-lg font-bold px-4 py-2 mb-1">
                                                    ${contract.daysRemaining}
                                                </span>
                                                <span class="text-xs text-gray-600">يوم متبقي</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 text-center">
                                            ${getPriorityBadge(contract.daysRemaining)}
                                        </td>
                                    </tr>
                                `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderDetailedContractorAnalysis(contractors, approvedContractors, evaluations, violations) {
        // التحقق من وجود مقاولين
        if (!contractors || !Array.isArray(contractors) || contractors.length === 0) {
            return `
                <div class="content-card border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div class="card-header bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border-b-2 border-indigo-200">
                        <div class="flex items-center justify-between p-4">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center ml-3">
                                    <i class="fas fa-list-alt text-white text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="card-title text-lg font-bold text-indigo-900">
                                        تحليل مفصل لكل مقاول
                                    </h3>
                                    <p class="text-sm text-indigo-700 mt-1">0 مقاول في النظام</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-body p-8">
                        <div class="text-center py-8">
                            <i class="fas fa-inbox text-gray-400 text-5xl mb-4"></i>
                            <p class="text-gray-500 text-lg">لا توجد مقاولين في النظام</p>
                            <p class="text-gray-400 text-sm mt-2">يرجى إضافة مقاولين لعرض التحليل المفصل</p>
                        </div>
                    </div>
                </div>
            `;
        }

        // حساب الإحصائيات لكل مقاول (دعم شكل المقاولين والمعتمدين: name/companyName، id/contractorId)
        const contractorsWithStats = contractors.map(contractor => {
            const cId = contractor.id || contractor.contractorId;
            const cName = (contractor.name || contractor.companyName || '').trim();
            const contractorEvaluations = evaluations.filter(e =>
                (e.contractorId && (e.contractorId === cId || e.contractorId === contractor.contractorId)) ||
                (e.contractorName && (e.contractorName === cName || e.contractorName === (contractor.companyName || contractor.name)))
            );
            
            const contractorViolations = violations.filter(v =>
                (v.contractorId && (v.contractorId === cId || v.contractorId === contractor.contractorId)) ||
                (v.contractorName && (v.contractorName === cName || v.contractorName === (contractor.companyName || contractor.name))) ||
                (v.personType === 'contractor' && v.contractorName === cName)
            );

            // حساب متوسط التقييم بدقة
            let avgScore = 0;
            if (contractorEvaluations.length > 0) {
                const validScores = contractorEvaluations
                    .map(e => parseFloat(e.finalScore) || parseFloat(e.score) || 0)
                    .filter(score => !isNaN(score) && score >= 0 && score <= 100);
                
                if (validScores.length > 0) {
                    const sum = validScores.reduce((acc, score) => acc + score, 0);
                    avgScore = Math.round((sum / validScores.length) * 100) / 100;
                }
            }

            const highViolations = contractorViolations.filter(v => {
                const severity = (v.severity || '').toString().trim();
                return severity === 'عالية' || severity === 'high' || severity === 'حرجة';
            }).length;

            const resolvedViolations = contractorViolations.filter(v => {
                const status = (v.status || '').toString().trim();
                return status === 'محلول' || status === 'resolved' || status === 'تم الحل';
            }).length;

            const resolutionRate = contractorViolations.length > 0
                ? Math.round((resolvedViolations / contractorViolations.length) * 100)
                : 100;

            // التحقق من حالة العقد (دعم endDate أو expiryDate)
            let contractStatus = 'active';
            let daysRemaining = null;
            const contractEndDate = contractor.endDate || contractor.expiryDate;
            if (contractEndDate) {
                try {
                    const endDate = new Date(contractEndDate);
                    const now = new Date();
                    const diff = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                    daysRemaining = diff;
                    if (diff < 0) {
                        contractStatus = 'expired';
                    } else if (diff <= 30) {
                        contractStatus = 'expiring';
                    }
                } catch (e) {
                    contractStatus = 'unknown';
                }
            }

            return {
                ...contractor,
                evaluationsCount: contractorEvaluations.length,
                violationsCount: contractorViolations.length,
                avgScore,
                highViolations,
                resolvedViolations,
                resolutionRate,
                contractStatus,
                daysRemaining
            };
        });

        // ترتيب المقاولين حسب الأداء (متوسط التقييم - المخالفات)
        contractorsWithStats.sort((a, b) => {
            const scoreA = a.avgScore - (a.violationsCount * 5) - (a.highViolations * 10);
            const scoreB = b.avgScore - (b.violationsCount * 5) - (b.highViolations * 10);
            return scoreB - scoreA;
        });

        const getScoreColor = (score) => {
            if (score >= 80) return 'text-green-600';
            if (score >= 60) return 'text-yellow-600';
            return 'text-red-600';
        };

        const getScoreBg = (score) => {
            if (score >= 80) return 'bg-green-100 text-green-700';
            if (score >= 60) return 'bg-yellow-100 text-yellow-700';
            return 'bg-red-100 text-red-700';
        };

        const getContractStatusBadge = (status, days) => {
            if (status === 'expired') {
                return '<span class="badge badge-danger"><i class="fas fa-times-circle ml-1"></i>منتهي</span>';
            } else if (status === 'expiring') {
                return `<span class="badge badge-warning"><i class="fas fa-hourglass-half ml-1"></i>${days} يوم</span>`;
            } else if (status === 'active') {
                return '<span class="badge badge-success"><i class="fas fa-check-circle ml-1"></i>نشط</span>';
            }
            return '<span class="badge badge-secondary">غير محدد</span>';
        };

        return `
            <div class="content-card border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
                <div class="card-header bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border-b-2 border-indigo-200">
                    <div class="flex items-center justify-between p-4">
                        <div class="flex items-center">
                            <div class="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center ml-3">
                                <i class="fas fa-list-alt text-white text-xl"></i>
                            </div>
                            <div>
                                <h3 class="card-title text-lg font-bold text-indigo-900">
                                    تحليل مفصل لكل مقاول
                                </h3>
                                <p class="text-sm text-indigo-700 mt-1">${contractorsWithStats.length} مقاول في النظام</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="overflow-x-auto" style="max-height: 70vh; overflow-y: auto; min-width: 100%;">
                        <table class="data-table w-full" style="border-collapse: collapse; table-layout: fixed; min-width: 900px;">
                            <colgroup>
                                <col style="width: 18%;">
                                <col style="width: 14%;">
                                <col style="width: 10%;">
                                <col style="width: 8%;">
                                <col style="width: 10%;">
                                <col style="width: 8%;">
                                <col style="width: 6%;">
                                <col style="width: 10%;">
                                <col style="width: 16%;">
                            </colgroup>
                            <thead style="position: sticky; top: 0; z-index: 10; background: #e0e7ff; box-shadow: 0 2px 0 0 #c7d2fe;">
                                <tr>
                                    <th class="px-4 py-3 text-right font-bold text-indigo-900 border-b-2 border-indigo-200" style="background: #e0e7ff; white-space: nowrap;">اسم المقاول</th>
                                    <th class="px-4 py-3 text-center font-bold text-indigo-900 border-b-2 border-indigo-200" style="background: #e0e7ff; white-space: nowrap;">نوع الخدمة</th>
                                    <th class="px-4 py-3 text-center font-bold text-indigo-900 border-b-2 border-indigo-200" style="background: #e0e7ff; white-space: nowrap;">حالة العقد</th>
                                    <th class="px-4 py-3 text-center font-bold text-indigo-900 border-b-2 border-indigo-200" style="background: #e0e7ff; white-space: nowrap;">التقييمات</th>
                                    <th class="px-4 py-3 text-center font-bold text-indigo-900 border-b-2 border-indigo-200" style="background: #e0e7ff; white-space: nowrap;">متوسط التقييم</th>
                                    <th class="px-4 py-3 text-center font-bold text-indigo-900 border-b-2 border-indigo-200" style="background: #e0e7ff; white-space: nowrap;">المخالفات</th>
                                    <th class="px-4 py-3 text-center font-bold text-indigo-900 border-b-2 border-indigo-200" style="background: #e0e7ff; white-space: nowrap;">عالية</th>
                                    <th class="px-4 py-3 text-center font-bold text-indigo-900 border-b-2 border-indigo-200" style="background: #e0e7ff; white-space: nowrap;">معدل الحل</th>
                                    <th class="px-4 py-3 text-center font-bold text-indigo-900 border-b-2 border-indigo-200" style="background: #e0e7ff; white-space: nowrap;">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                ${contractorsWithStats.map((contractor, index) => {
                                    return `
                                    <tr class="hover:bg-indigo-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                                        <td class="px-4 py-3 text-right align-middle" style="overflow: hidden; text-overflow: ellipsis;">
                                            <div class="flex items-center justify-end">
                                                <div class="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center ml-3">
                                                    <span class="text-indigo-600 font-bold text-sm">${index + 1}</span>
                                                </div>
                                                <div style="min-width: 0;">
                                                    <strong class="text-gray-800 font-semibold block truncate">${Utils.escapeHTML(contractor.name || contractor.companyName || '')}</strong>
                                                    <span class="text-xs text-gray-500">
                                                        <span class="badge badge-${(contractor.status || '').toString().trim() === 'نشط' ? 'success' : 'danger'} text-xs">
                                                            ${contractor.status || '-'}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-4 py-3 text-center align-middle" style="overflow: hidden; text-overflow: ellipsis;">
                                            <span class="text-gray-800 text-sm">${Utils.escapeHTML((contractor.serviceType || contractor.entityType || '-').toString())}</span>
                                        </td>
                                        <td class="px-4 py-3 text-center align-middle">
                                            ${getContractStatusBadge(contractor.contractStatus, contractor.daysRemaining)}
                                        </td>
                                        <td class="px-4 py-3 text-center align-middle">
                                            <span class="font-semibold ${contractor.evaluationsCount > 0 ? 'text-yellow-700' : 'text-gray-500'}" style="font-size: 15px;">
                                                ${contractor.evaluationsCount}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3 text-center align-middle">
                                            <div class="flex flex-col items-center">
                                                <span class="font-bold ${getScoreColor(contractor.avgScore)} mb-1" style="font-size: 16px;">
                                                    ${contractor.avgScore}%
                                                </span>
                                                <div class="w-16 bg-gray-200 rounded-full h-1.5">
                                                    <div class="bg-${contractor.avgScore >= 80 ? 'green' : contractor.avgScore >= 60 ? 'yellow' : 'red'}-500 h-1.5 rounded-full" style="width: ${Math.min(contractor.avgScore, 100)}%"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-4 py-3 text-center align-middle">
                                            <span class="font-semibold ${contractor.violationsCount > 0 ? 'text-red-700' : 'text-green-700'}" style="font-size: 15px;">
                                                ${contractor.violationsCount}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3 text-center align-middle">
                                            ${contractor.highViolations > 0 
                                                ? `<span class="badge badge-danger text-sm font-bold px-3 py-1">${contractor.highViolations}</span>` 
                                                : '<span class="text-gray-400">-</span>'}
                                        </td>
                                        <td class="px-4 py-3 text-center align-middle">
                                            <div class="flex flex-col items-center">
                                                <div class="w-20 bg-gray-200 rounded-full h-2 mb-1">
                                                    <div class="bg-${contractor.resolutionRate >= 80 ? 'green' : contractor.resolutionRate >= 50 ? 'yellow' : 'red'}-500 h-2 rounded-full transition-all" style="width: ${contractor.resolutionRate}%"></div>
                                                </div>
                                                <span class="text-xs font-semibold ${contractor.resolutionRate >= 80 ? 'text-green-600' : contractor.resolutionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}">
                                                    ${contractor.resolutionRate}%
                                                </span>
                                            </div>
                                        </td>
                                        <td class="px-4 py-3 text-center align-middle">
                                            <button onclick="Contractors.viewContractorAnalytics('${contractor.id}')" 
                                                    class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm" 
                                                    title="عرض التفاصيل">
                                                <i class="fas fa-eye ml-2"></i>
                                                عرض
                                            </button>
                                        </td>
                                    </tr>
                                `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    viewContractorAnalytics(contractorId) {
        let contractor = (AppState.appData.contractors || []).find(c => c.id === contractorId || c.contractorId === contractorId);
        if (!contractor) {
            contractor = (AppState.appData.approvedContractors || []).find(c => c.id === contractorId || c.contractorId === contractorId);
        }
        if (!contractor) {
            Notification.error('المقاول غير موجود');
            return;
        }
        if (typeof GoogleIntegration !== 'undefined' && GoogleIntegration.sendRequest && AppState.googleConfig?.appsScript?.enabled) {
            const needCT = !AppState.appData.contractorTrainings?.length;
            const needT = !AppState.appData.training?.length;
            const needPTW = (!AppState.appData.ptw || !AppState.appData.ptw.length) && (!AppState.appData.ptwRegistry || !AppState.appData.ptwRegistry.length);
            if (needCT || needT || needPTW) {
                const syncSheets = [];
                if (needCT) syncSheets.push('ContractorTrainings');
                if (needT) syncSheets.push('Training');
                if (needPTW) syncSheets.push('PTW', 'PTWRegistry');
                if (syncSheets.length && typeof GoogleIntegration.syncData === 'function') {
                    GoogleIntegration.syncData({ sheets: syncSheets, silent: true, showLoader: false, notifyOnSuccess: false, notifyOnError: false }).then(() => {
                        if (needCT && !AppState.appData.contractorTrainings?.length) {
                            GoogleIntegration.sendRequest({ action: 'getAllContractorTrainings', data: {} }).then(ctRes => {
                                if (ctRes && ctRes.success && Array.isArray(ctRes.data)) AppState.appData.contractorTrainings = ctRes.data;
                            }).catch(() => null);
                        }
                        if (needT && !AppState.appData.training?.length) {
                            GoogleIntegration.sendRequest({ action: 'getAllTrainings', data: {} }).then(tRes => {
                                if (tRes && tRes.success && Array.isArray(tRes.data)) AppState.appData.training = tRes.data;
                            }).catch(() => null);
                        }
                        if (needPTW) {
                            if (!AppState.appData.ptw || !AppState.appData.ptw.length) {
                                GoogleIntegration.sendRequest({ action: 'getAllPTWs', data: {} }).then(ptwRes => {
                                    if (ptwRes && ptwRes.success && Array.isArray(ptwRes.data)) AppState.appData.ptw = ptwRes.data;
                                }).catch(() => null);
                            }
                            if (!AppState.appData.ptwRegistry || !AppState.appData.ptwRegistry.length) {
                                GoogleIntegration.sendRequest({ action: 'readFromSheet', data: { sheetName: 'PTWRegistry' } }).then(regRes => {
                                    if (regRes && regRes.success && Array.isArray(regRes.data)) AppState.appData.ptwRegistry = regRes.data;
                                }).catch(() => null);
                            }
                        }
                    }).catch(() => null);
                }
            }
        }
        const contractorName = (contractor.name || contractor.companyName || '').trim();
        const normalize = (v) => (v == null || v === '') ? '' : String(v).trim().toLowerCase();
        const idsSet = new Set();
        [contractorId, contractor.id, contractor.contractorId, contractor.code, contractor.isoCode].forEach(x => { if (x != null && x !== '') idsSet.add(normalize(x)); });
        const namesSet = new Set();
        if (contractorName) { namesSet.add(contractorName); namesSet.add(contractorName.toLowerCase()); }
        if (contractor.companyName) { namesSet.add(String(contractor.companyName).trim()); namesSet.add(String(contractor.companyName).trim().toLowerCase()); }
        const matchesContractor = (record) => {
            if (!record) return false;
            const rId = normalize(record.contractorId) || normalize(record.contractorCode) || normalize(record.code);
            if (rId && idsSet.has(rId)) return true;
            if (record.contractorId != null && record.contractorId !== '' && idsSet.has(normalize(record.contractorId))) return true;
            if (record.contractorCode != null && record.contractorCode !== '' && idsSet.has(normalize(record.contractorCode))) return true;
            const rName = String(record.contractorName || record.companyName || record.company || record.contractorCompany || record.name || record.externalName || record.contractorWorkerName || '').replace(/\s+/g, ' ').trim();
            if (!rName) return false;
            if (namesSet.has(rName) || namesSet.has(rName.toLowerCase())) return true;
            if (contractorName && contractorName.toLowerCase() === rName.toLowerCase()) return true;
            if (contractorName && rName.toLowerCase().includes(contractorName.toLowerCase())) return true;
            if (contractorName && contractorName.toLowerCase().includes(rName.toLowerCase())) return true;
            return false;
        };
        const matchesPtwContractor = (p) => {
            if (!p) return false;
            const req = String(p.requestingParty || '').replace(/\s+/g, ' ').trim();
            const auth = String(p.authorizedParty || '').replace(/\s+/g, ' ').trim();
            const resp = String(p.responsible || '').replace(/\s+/g, ' ').trim();
            const cn = contractorName ? contractorName.toLowerCase() : '';
            const matchStr = (s) => {
                if (!s || !cn) return false;
                const sl = s.toLowerCase();
                return sl === cn || sl.includes(cn) || cn.includes(sl);
            };
            if (matchStr(req) || matchStr(auth)) return true;
            if (resp && matchStr(resp)) return true;
            return false;
        };

        const evaluations = (AppState.appData.contractorEvaluations || []).filter(e => {
            if (!e) return false;
            if (e.contractorId != null && e.contractorId !== '' && idsSet.has(normalize(e.contractorId))) return true;
            if (e.contractorId === contractorId || e.contractorId === contractor.contractorId) return true;
            return matchesContractor(e);
        });
        const violations = (AppState.appData.violations || []).filter(v => {
            if (!v) return false;
            if (v.contractorId != null && v.contractorId !== '' && idsSet.has(normalize(v.contractorId))) return true;
            if (v.contractorId === contractorId || v.contractorId === contractor.contractorId) return true;
            if (v.personType === 'contractor' || v.contractorName) {
                if (matchesContractor(v)) return true;
                const vName = String(v.contractorName || '').replace(/\s+/g, ' ').trim();
                return contractorName && vName && (vName.toLowerCase() === contractorName.toLowerCase() || vName.toLowerCase().includes(contractorName.toLowerCase()) || contractorName.toLowerCase().includes(vName.toLowerCase()));
            }
            return false;
        });

        const uniqueEvalIds = new Set(evaluations.map(e => e.id || e.evaluationId).filter(Boolean));
        const evaluationsCountDisplay = uniqueEvalIds.size > 0 ? uniqueEvalIds.size : evaluations.length;

        // حساب الإحصائيات
        let avgScore = 0;
        if (evaluations.length > 0) {
            const validScores = evaluations
                .map(e => parseFloat(e.finalScore) || parseFloat(e.score) || 0)
                .filter(score => !isNaN(score) && score >= 0 && score <= 100);
            
            if (validScores.length > 0) {
                const sum = validScores.reduce((acc, score) => acc + score, 0);
                avgScore = Math.round((sum / validScores.length) * 100) / 100;
            }
        }

        const highViolations = violations.filter(v => {
            const severity = (v.severity || '').toString().trim();
            return severity === 'عالية' || severity === 'high' || severity === 'حرجة';
        }).length;

        const resolvedViolations = violations.filter(v => {
            const status = (v.status || '').toString().trim();
            return status === 'محلول' || status === 'resolved' || status === 'تم الحل';
        }).length;

        const resolutionRate = violations.length > 0
            ? Math.round((resolvedViolations / violations.length) * 100)
            : 100;

        const trainingList = AppState.appData.training || [];
        const trainingFromMain = trainingList.filter(t => {
            if (!t) return false;
            if (t.contractorName || t.contractorId || t.contractorCode) { if (matchesContractor(t)) return true; }
            let participants = t.participants;
            if (typeof participants === 'string' && participants.trim()) {
                try { participants = JSON.parse(participants); } catch (e) { participants = null; }
            }
            if (participants && Array.isArray(participants)) {
                return participants.some(p => (p && (p.personType === 'contractor' || p.type === 'contractor' || p.contractorName || p.companyName || p.company) && matchesContractor(p)));
            }
            return false;
        });
        const contractorTrainingsList = AppState.appData.contractorTrainings || [];
        const trainingFromContractor = contractorTrainingsList.filter(ct => {
            if (!ct) return false;
            if (matchesContractor(ct)) return true;
            const name = String(ct.contractorName || ct.companyName || '').replace(/\s+/g, ' ').trim();
            return contractorName && name && (name.toLowerCase() === contractorName.toLowerCase() || name.toLowerCase().includes(contractorName.toLowerCase()) || contractorName.toLowerCase().includes(name.toLowerCase()));
        });
        const seenTrainingIds = new Set();
        trainingFromMain.forEach(t => {
            const tid = t.id || (String(t.startDate || '') + String(t.name || t.trainingType || ''));
            if (tid) seenTrainingIds.add(tid);
        });
        let trainingsCount = trainingFromMain.length;
        trainingFromContractor.forEach(ct => {
            const tid = ct.id || (String(ct.date || '') + String(ct.topic || ct.trainingName || ct.name || ''));
            if (tid && !seenTrainingIds.has(tid)) {
                seenTrainingIds.add(tid);
                trainingsCount += 1;
            } else if (!tid) {
                trainingsCount += 1;
            }
        });

        const ptwAll = (AppState.appData.ptw || []).concat(Array.isArray(AppState.appData.ptwRegistry) ? AppState.appData.ptwRegistry : []);
        const permitsCount = ptwAll.filter(matchesPtwContractor).length;

        const clinicSources = (AppState.appData.clinicVisits || []).concat(Array.isArray(AppState.appData.clinicContractorVisits) ? AppState.appData.clinicContractorVisits : []);
        const clinicVisitsCount = clinicSources.filter(c => (c.personType === 'contractor' || c.personType === 'external' || c.contractorName) && matchesContractor(c)).length;

        const injuriesAll = AppState.appData.injuries || [];
        const injuriesCount = injuriesAll.filter(inj => {
            if (!inj) return false;
            if ((inj.personType || '').toString().toLowerCase() !== 'contractor') return false;
            if (matchesContractor(inj)) return true;
            const name = String(inj.personName || inj.employeeName || inj.contractorName || '').trim();
            return contractorName && name && (name.toLowerCase() === contractorName.toLowerCase() || name.toLowerCase().includes(contractorName.toLowerCase()) || contractorName.toLowerCase().includes(name.toLowerCase()));
        }).length;

        const getScoreColor = (score) => {
            if (score >= 80) return 'text-green-600 bg-green-100';
            if (score >= 60) return 'text-yellow-600 bg-yellow-100';
            return 'text-red-600 bg-red-100';
        };

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center ml-3">
                            <i class="fas fa-chart-bar text-xl"></i>
                        </div>
                        <div>
                            <h2 class="modal-title text-xl font-bold">تحليل مفصل: ${Utils.escapeHTML(contractorName || contractor.name || contractor.companyName || '')}</h2>
                            <p class="text-sm text-indigo-100 mt-1">${Utils.escapeHTML(contractor.serviceType || contractor.entityType || '')}</p>
                        </div>
                    </div>
                    <button class="modal-close bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-colors" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body p-6">
                    <!-- بطاقات الإحصائيات الرئيسية -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div class="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-5 shadow-md">
                            <div class="flex items-center justify-between mb-2">
                                <i class="fas fa-clipboard-check text-3xl text-blue-500"></i>
                            </div>
                            <p class="text-sm text-gray-600 mb-1">عدد التقييمات</p>
                            <p class="text-3xl font-bold text-blue-700">${evaluationsCountDisplay}</p>
                        </div>
                        <div class="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-5 shadow-md">
                            <div class="flex items-center justify-between mb-2">
                                <i class="fas fa-exclamation-triangle text-3xl text-red-500"></i>
                            </div>
                            <p class="text-sm text-gray-600 mb-1">عدد المخالفات</p>
                            <p class="text-3xl font-bold text-red-700">${violations.length}</p>
                        </div>
                        <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-5 shadow-md">
                            <div class="flex items-center justify-between mb-2">
                                <i class="fas fa-star text-3xl text-yellow-500"></i>
                            </div>
                            <p class="text-sm text-gray-600 mb-1">متوسط التقييم</p>
                            <p class="text-3xl font-bold ${getScoreColor(avgScore).split(' ')[0]}">${avgScore}%</p>
                        </div>
                        <div class="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-5 shadow-md">
                            <div class="flex items-center justify-between mb-2">
                                <i class="fas fa-check-double text-3xl text-green-500"></i>
                            </div>
                            <p class="text-sm text-gray-600 mb-1">معدل حل المخالفات</p>
                            <p class="text-3xl font-bold text-green-700">${resolutionRate}%</p>
                        </div>
                    </div>

                    <!-- إحصائيات إضافية -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div class="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                            <p class="text-sm text-gray-600 mb-2">مخالفات عالية الخطورة</p>
                            <p class="text-2xl font-bold text-red-600">${highViolations}</p>
                        </div>
                        <div class="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                            <p class="text-sm text-gray-600 mb-2">مخالفات محلولة</p>
                            <p class="text-2xl font-bold text-green-600">${resolvedViolations}</p>
                        </div>
                        <div class="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                            <p class="text-sm text-gray-600 mb-2">مخالفات قيد المعالجة</p>
                            <p class="text-2xl font-bold text-orange-600">${violations.length - resolvedViolations}</p>
                        </div>
                    </div>

                    <!-- التدريبات - التصاريح - التردد على العيادة - الإصابات -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div class="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 rounded-xl p-4 shadow-sm">
                            <div class="flex items-center justify-between mb-2">
                                <i class="fas fa-graduation-cap text-2xl text-teal-600"></i>
                            </div>
                            <p class="text-sm text-gray-600 mb-1">عدد التدريبات</p>
                            <p class="text-2xl font-bold text-teal-700">${trainingsCount}</p>
                        </div>
                        <div class="bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-200 rounded-xl p-4 shadow-sm">
                            <div class="flex items-center justify-between mb-2">
                                <i class="fas fa-file-signature text-2xl text-cyan-600"></i>
                            </div>
                            <p class="text-sm text-gray-600 mb-1">عدد التصاريح</p>
                            <p class="text-2xl font-bold text-cyan-700">${permitsCount}</p>
                        </div>
                        <div class="bg-gradient-to-br from-violet-50 to-violet-100 border-2 border-violet-200 rounded-xl p-4 shadow-sm">
                            <div class="flex items-center justify-between mb-2">
                                <i class="fas fa-stethoscope text-2xl text-violet-600"></i>
                            </div>
                            <p class="text-sm text-gray-600 mb-1">التردد على العيادة</p>
                            <p class="text-2xl font-bold text-violet-700">${clinicVisitsCount}</p>
                        </div>
                        <div class="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-4 shadow-sm">
                            <div class="flex items-center justify-between mb-2">
                                <i class="fas fa-band-aid text-2xl text-amber-600"></i>
                            </div>
                            <p class="text-sm text-gray-600 mb-1">الإصابات</p>
                            <p class="text-2xl font-bold text-amber-700">${injuriesCount}</p>
                        </div>
                    </div>

                    <!-- جدول المخالفات -->
                    ${violations.length > 0 ? `
                        <div class="border-2 border-gray-200 rounded-xl overflow-hidden shadow-md">
                            <div class="bg-gradient-to-r from-red-50 to-red-100 border-b-2 border-red-200 p-4">
                                <h3 class="text-lg font-bold text-red-800 flex items-center">
                                    <i class="fas fa-exclamation-triangle ml-2"></i>
                                    المخالفات (${violations.length})
                                </h3>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="data-table w-full">
                                    <thead class="bg-gray-100">
                                        <tr>
                                            <th class="px-6 py-3 text-right font-bold text-gray-700">التاريخ</th>
                                            <th class="px-6 py-3 text-right font-bold text-gray-700">نوع المخالفة</th>
                                            <th class="px-6 py-3 text-center font-bold text-gray-700">الشدة</th>
                                            <th class="px-6 py-3 text-center font-bold text-gray-700">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-100">
                                        ${violations.map((v, index) => {
                                            const severity = (v.severity || '').toString().trim();
                                            const status = (v.status || '').toString().trim();
                                            const severityClass = severity === 'عالية' || severity === 'high' || severity === 'حرجة' 
                                                ? 'badge-danger' 
                                                : severity === 'متوسطة' || severity === 'medium' 
                                                ? 'badge-warning' 
                                                : 'badge-info';
                                            const statusClass = status === 'محلول' || status === 'resolved' || status === 'تم الحل'
                                                ? 'badge-success'
                                                : 'badge-warning';
                                            
                                            return `
                                            <tr class="hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                                                <td class="px-6 py-4 text-gray-700">${v.violationDate ? Utils.formatDate(v.violationDate) : '-'}</td>
                                                <td class="px-6 py-4 text-gray-800 font-medium">${Utils.escapeHTML(v.violationType || '-')}</td>
                                                <td class="px-6 py-4 text-center">
                                                    <span class="badge ${severityClass} text-sm font-bold px-3 py-1">${v.severity || '-'}</span>
                                                </td>
                                                <td class="px-6 py-4 text-center">
                                                    <span class="badge ${statusClass} text-sm font-bold px-3 py-1">${v.status || '-'}</span>
                                                </td>
                                            </tr>
                                        `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : `
                        <div class="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
                            <i class="fas fa-check-circle text-5xl text-green-500 mb-4"></i>
                            <p class="text-lg font-semibold text-green-700">لا توجد مخالفات مسجلة</p>
                            <p class="text-sm text-green-600 mt-2">هذا المقاول يلتزم بجميع المعايير</p>
                        </div>
                    `}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    /**
     * حقن CSS للتبويبات
     */
    injectAntiShakeStyles() {
        const styleId = 'contractors-anti-shake-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .contractors-tab-content {
                display: none;
            }
            .contractors-tab-content.active {
                display: block;
            }
        `;
        document.head.appendChild(style);
    }
};

// ===== Export module to global scope =====
// تصدير الموديول إلى window فوراً لضمان توافره
(function () {
    'use strict';
    try {
        if (typeof window !== 'undefined' && typeof Contractors !== 'undefined') {
            window.Contractors = Contractors;
            // تصدير الثوابت للاستخدام في موديولات أخرى
            window.Contractors.APPROVED_ENTITY_STATUS_OPTIONS = APPROVED_ENTITY_STATUS_OPTIONS;
            window.Contractors.APPROVED_ENTITY_TYPE_OPTIONS = APPROVED_ENTITY_TYPE_OPTIONS;
            
            // إشعار عند تحميل الموديول بنجاح
            if (typeof AppState !== 'undefined' && AppState.debugMode && typeof Utils !== 'undefined' && Utils.safeLog) {
                Utils.safeLog('✅ Contractors module loaded and available on window.Contractors');
            }
        }
    } catch (error) {
        console.error('❌ خطأ في تصدير Contractors:', error);
        // محاولة التصدير مرة أخرى حتى في حالة الخطأ
        if (typeof window !== 'undefined' && typeof Contractors !== 'undefined') {
            try {
                window.Contractors = Contractors;
                window.Contractors.APPROVED_ENTITY_STATUS_OPTIONS = APPROVED_ENTITY_STATUS_OPTIONS;
                window.Contractors.APPROVED_ENTITY_TYPE_OPTIONS = APPROVED_ENTITY_TYPE_OPTIONS;
            } catch (e) {
                console.error('❌ فشل تصدير Contractors:', e);
            }
        }
    }
})();