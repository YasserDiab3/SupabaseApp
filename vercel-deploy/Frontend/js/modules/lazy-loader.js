/**
 * Lazy Loader System
 * نظام تحميل ديناميكي للموديولات لتحسين أداء التطبيق
 * 
 * المزايا:
 * - تحميل الموديولات فقط عند الحاجة إليها
 * - تقليل وقت التحميل الأولي بشكل كبير
 * - تخزين الموديولات المحملة في الذاكرة المؤقتة
 * - شاشة تحميل تفاعلية مع شريط تقدم
 */

const LazyLoader = {
    // تخزين الموديولات المحملة
    loadedModules: new Map(),
    
    // تخزين الوعود (promises) للموديولات قيد التحميل
    loadingPromises: new Map(),
    
    // خريطة الموديولات وأسمائها في الملف
    moduleMap: {
        // الموديولات الأساسية (يتم تحميلها مباشرة)
        'auth': { name: 'Auth', required: true, priority: 1 },
        'dashboard': { name: 'Dashboard', required: true, priority: 2 },
        
        // الموديولات الثانوية (يتم تحميلها عند الحاجة)
        'users': { name: 'Users', required: false, priority: 3 },
        'incidents': { name: 'Incidents', required: false, priority: 3 },
        'nearmiss': { name: 'NearMiss', required: false, priority: 3 },
        'ptw': { name: 'PTW', required: false, priority: 3 },
        'training': { name: 'Training', required: false, priority: 3 },
        'clinic': { name: 'Clinic', required: false, priority: 3 },
        'fire-equipment': { name: 'FireEquipment', required: false, priority: 3 },
        'periodic-inspections': { name: 'PeriodicInspections', required: false, priority: 3 },
        'ppe': { name: 'PPE', required: false, priority: 3 },
        'violations': { name: 'Violations', required: false, priority: 3 },
        'contractors': { name: 'Contractors', required: false, priority: 3 },
        'employees': { name: 'Employees', required: false, priority: 3 },
        'behavior-monitoring': { name: 'BehaviorMonitoring', required: false, priority: 3 },
        'chemical-safety': { name: 'ChemicalSafety', required: false, priority: 3 },
        'daily-observations': { name: 'DailyObservations', required: false, priority: 3 },
        'iso': { name: 'ISO', required: false, priority: 3 },
        'emergency': { name: 'Emergency', required: false, priority: 3 },
        'risk-assessment': { name: 'RiskAssessment', required: false, priority: 3 },
        'sop-jha': { name: 'SOPJHA', required: false, priority: 3 },
        'legal-documents': { name: 'LegalDocuments', required: false, priority: 3 },
        'sustainability': { name: 'Sustainability', required: false, priority: 3 },
        'safety-budget': { name: 'SafetyBudget', required: false, priority: 3 },
        'safety-performance-kpis': { name: 'SafetyPerformanceKPIs', required: false, priority: 3 },
        'safety-health-management': { name: 'SafetyHealthManagement', required: false, priority: 3 },
        'action-tracking': { name: 'ActionTrackingRegister', required: false, priority: 3 },
        'ai-assistant': { name: 'AIAssistant', required: false, priority: 3 },
        'settings': { name: 'Settings', required: false, priority: 3 },
        'user-tasks': { name: 'UserTasksModule', required: false, priority: 3 }
    },

    /**
     * تهيئة النظام
     */
    async init() {
        if (AppState?.debugMode) Utils?.safeLog('🚀 بدء تهيئة نظام التحميل الديناميكي...');
        
        // التحقق من الدعم للموديولات
        if (!('import' in window)) {
            // هذا تحذير معلوماتي فقط - التطبيق سيعمل بشكل طبيعي مع التحميل التقليدي
            if (window.location.protocol !== 'file:' && window.location.protocol !== 'null') {
                if (AppState?.debugMode) Utils?.safeLog('ℹ️ المتصفح لا يدعم Dynamic Import، سيتم استخدام التحميل التقليدي (هذا طبيعي في بعض المتصفحات القديمة)');
            }
            return false;
        }
        
        // تحميل الموديولات الأساسية
        await this.loadCoreModules();
        
        // إضافة مستمعات الأحداث لتحميل الموديولات عند الحاجة
        this.setupNavigationListeners();
        
        if (AppState?.debugMode) Utils?.safeLog('✅ تم تهيئة نظام التحميل الديناميكي');
        return true;
    },

    /**
     * تحميل الموديولات الأساسية
     */
    async loadCoreModules() {
        if (AppState?.debugMode) Utils?.safeLog('📦 تحميل الموديولات الأساسية...');
        
        const coreModules = Object.entries(this.moduleMap)
            .filter(([_, config]) => config.required)
            .sort((a, b) => a[1].priority - b[1].priority);
        
        for (const [key, config] of coreModules) {
            await this.loadModule(key);
        }
        
        if (AppState?.debugMode) Utils?.safeLog('✅ تم تحميل الموديولات الأساسية');
    },

    /**
     * تحميل موديول معين
     */
    async loadModule(moduleKey) {
        // التحقق من أن الموديول محمل بالفعل
        if (this.loadedModules.has(moduleKey)) {
            if (AppState?.debugMode) Utils?.safeLog(`✓ الموديول ${moduleKey} محمل بالفعل`);
            return this.loadedModules.get(moduleKey);
        }

        // التحقق من أن الموديول قيد التحميل
        if (this.loadingPromises.has(moduleKey)) {
            if (AppState?.debugMode) Utils?.safeLog(`⏳ انتظار تحميل الموديول ${moduleKey}...`);
            return await this.loadingPromises.get(moduleKey);
        }

        const config = this.moduleMap[moduleKey];
        if (!config) {
            Utils?.safeError(`❌ الموديول ${moduleKey} غير موجود في الخريطة`);
            return null;
        }

        if (AppState?.debugMode) Utils?.safeLog(`📥 جاري تحميل الموديول ${config.name}...`);

        // إنشاء promise للتحميل
        const loadingPromise = this.loadModuleFromWindow(config.name);
        this.loadingPromises.set(moduleKey, loadingPromise);

        try {
            const module = await loadingPromise;
            this.loadedModules.set(moduleKey, module);
            this.loadingPromises.delete(moduleKey);
            if (AppState?.debugMode) Utils?.safeLog(`✅ تم تحميل الموديول ${config.name}`);
            return module;
        } catch (error) {
            Utils?.safeError(`❌ فشل تحميل الموديول ${config.name}:`, error);
            this.loadingPromises.delete(moduleKey);
            return null;
        }
    },

    /**
     * تحميل الموديول من window (للاستخدام المؤقت حتى يتم تقسيم الملفات)
     */
    async loadModuleFromWindow(moduleName) {
        return new Promise((resolve, reject) => {
            // في الوقت الحالي، الموديولات محملة في window
            // هذه دالة مؤقتة، سيتم استبدالها بـ dynamic import لاحقاً
            
            const checkModule = () => {
                if (window[moduleName]) {
                    resolve(window[moduleName]);
                } else {
                    // انتظر قليلاً وحاول مرة أخرى
                    setTimeout(() => {
                        if (window[moduleName]) {
                            resolve(window[moduleName]);
                        } else {
                            reject(new Error(`Module ${moduleName} not found`));
                        }
                    }, 500);
                }
            };

            checkModule();
        });
    },

    /**
     * إعداد مستمعات التنقل لتحميل الموديولات عند الحاجة
     */
    setupNavigationListeners() {
        // الاستماع لأحداث النقر على القائمة
        // ⚠️ مهم: التحقق من الصلاحيات قبل تحميل الموديول لمنع الوصول غير المصرح به
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const section = navItem.dataset.section;
                if (section && this.moduleMap[section]) {
                    // التحقق من الصلاحيات قبل تحميل الموديول
                    // التحقق من الصلاحيات (fail-closed إذا Permissions غير متاح)
                    const canAccess = (typeof Permissions !== 'undefined' && typeof Permissions.hasAccess === 'function')
                        ? Permissions.hasAccess(section)
                        : ((AppState?.currentUser?.role || '').toLowerCase() === 'admin');
                    if (!canAccess) {
                        // إذا لم يكن لديه صلاحية، نمنع تحميل الموديول
                        // (showSection في app-ui.js سيتعامل مع عرض رسالة الخطأ)
                        return;
                    }
                    // إذا كان لديه صلاحية، نحمّل الموديول بشكل غير متزامن
                    this.loadModule(section).catch(err => {
                        Utils?.safeError(`فشل تحميل موديول ${section}:`, err);
                    });
                }
            }
        });

        // الاستماع لتغييرات الـ hash للتنقل المباشر
        // ⚠️ مهم: التحقق من الصلاحيات قبل تحميل الموديول لمنع الوصول غير المصرح به
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1);
            if (hash && this.moduleMap[hash]) {
                // التحقق من الصلاحيات قبل تحميل الموديول
                // التحقق من الصلاحيات (fail-closed إذا Permissions غير متاح)
                const canAccess = (typeof Permissions !== 'undefined' && typeof Permissions.hasAccess === 'function')
                    ? Permissions.hasAccess(hash)
                    : ((AppState?.currentUser?.role || '').toLowerCase() === 'admin');
                if (!canAccess) {
                        // إذا لم يكن لديه صلاحية، نعرض رسالة خطأ ونعيده للـ dashboard
                        if (typeof Notification !== 'undefined' && typeof Notification.error === 'function') {
                            Notification.error('ليس لديك صلاحية للوصول إلى هذا القسم');
                        } else {
                            console.error('⚠️ ليس لديك صلاحية للوصول إلى:', hash);
                            alert('ليس لديك صلاحية للوصول إلى هذا القسم');
                        }
                        // إعادة التوجيه للـ dashboard إذا كان لديه صلاحية، وإلا إزالة الـ hash
                        if (typeof Permissions !== 'undefined' && typeof Permissions.hasAccess === 'function' && Permissions.hasAccess('dashboard')) {
                            window.location.hash = 'dashboard';
                            if (typeof UI !== 'undefined' && typeof UI.showSection === 'function') {
                                UI.showSection('dashboard');
                            }
                        } else {
                            window.location.hash = '';
                        }
                        return;
                }
                // إذا كان لديه صلاحية، نحمّل الموديول
                this.loadModule(hash).catch(err => {
                    Utils?.safeError(`فشل تحميل موديول ${hash}:`, err);
                });
            }
        });
    },

    /**
     * تحميل مسبق للموديولات (في الخلفية)
     */
    async preloadModules(moduleKeys) {
        if (AppState?.debugMode) Utils?.safeLog('📦 تحميل مسبق للموديولات:', moduleKeys);
        
        const promises = moduleKeys.map(key => 
            this.loadModule(key).catch(err => {
                Utils?.safeWarn(`تحذير: فشل التحميل المسبق لـ ${key}:`, err);
                return null;
            })
        );
        
        await Promise.all(promises);
        if (AppState?.debugMode) Utils?.safeLog('✅ تم التحميل المسبق للموديولات');
    },

    /**
     * الحصول على موديول محمل
     */
    getModule(moduleKey) {
        return this.loadedModules.get(moduleKey);
    },

    /**
     * التحقق من تحميل موديول
     */
    isLoaded(moduleKey) {
        return this.loadedModules.has(moduleKey);
    },

    /**
     * إحصائيات التحميل
     */
    getStats() {
        const totalModules = Object.keys(this.moduleMap).length;
        const loadedCount = this.loadedModules.size;
        const loadingCount = this.loadingPromises.size;
        
        return {
            total: totalModules,
            loaded: loadedCount,
            loading: loadingCount,
            percentage: Math.round((loadedCount / totalModules) * 100)
        };
    }
};

// تصدير للاستخدام العام
if (typeof window !== 'undefined') {
    window.LazyLoader = LazyLoader;
}
