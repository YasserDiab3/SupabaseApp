/**
 * Application Bootstrap
 * نظام بدء التطبيق المحسن
 * 
 * يدير عملية تحميل التطبيق بشكل ذكي ومتدرج
 */

(function() {
    'use strict';

    // Logger صامت في الإنتاج (يعتمد على Utils.safeLog)
    const log = (...args) => {
        try {
            if (typeof Utils !== 'undefined' && typeof Utils.safeLog === 'function') {
                Utils.safeLog(...args);
            }
        } catch (e) { /* ignore */ }
    };
    const time = (label) => {
        try {
            if (typeof Utils !== 'undefined' && typeof Utils.isProduction === 'function' && !Utils.isProduction()) {
                console.time(label);
            }
        } catch (e) { /* ignore */ }
    };
    const timeEnd = (label) => {
        try {
            if (typeof Utils !== 'undefined' && typeof Utils.isProduction === 'function' && !Utils.isProduction()) {
                console.timeEnd(label);
            }
        } catch (e) { /* ignore */ }
    };

    const AppBootstrap = {
        // المراحل
        phases: {
            INIT: 'init',
            CORE: 'core',
            SERVICES: 'services',
            UI: 'ui',
            MODULES: 'modules',
            READY: 'ready'
        },

        // الحالة الحالية
        currentPhase: null,

        // أوقات التحميل
        timings: {},

        /**
         * بدء التطبيق
         */
        async start() {
            // استعادة فورية للجلسة من النسخة الاحتياطية إذا كانت sessionStorage فارغة (لمعالجة فقدانها عند إعادة التحميل)
            try {
                if (!sessionStorage.getItem('hse_current_session')) {
                    const backup = localStorage.getItem('hse_session_backup');
                    const remember = localStorage.getItem('hse_remember_user');
                    const source = backup || remember;
                    if (source) {
                        const data = JSON.parse(source);
                        if (data && data.email) {
                            sessionStorage.setItem('hse_current_session', source);
                            if (data.sessionId) sessionStorage.setItem('hse_session_id', data.sessionId);
                        }
                    }
                }
            } catch (e) { /* ignore */ }

            log('🚀 بدء تحميل التطبيق...');
            time('⏱️ Total Load Time');
            
            try {
                // المرحلة 1: التهيئة
                await this.phaseInit();
                
                // المرحلة 2: الموديولات الأساسية
                await this.phaseCore();
                
                // المرحلة 3: الخدمات
                await this.phaseServices();
                
                // المرحلة 4: واجهة المستخدم
                await this.phaseUI();
                
                // حد أقصى 1.5 ثانية لرسالة التحقق من الجلسة ثم إزالتها (احتياطاً إذا لم تُزَل في phaseUI)
                this._startSessionCheckOverlayMaxTimer(1500);
                // انتظار Auth بحد أقصى 2 ثانية ثم التحقق من الجلسة فوراً لتسريع التحميل
                await this._waitForAuthMax(2000);
                this.checkAndRestoreSession();
                
                // المرحلة 5: الموديولات (تحميل في الخلفية بينما المستخدم يرى التطبيق أو شاشة الدخول)
                await this.phaseModules();
                
                // المرحلة 6: جاهز
                await this.phaseReady();
                
                timeEnd('⏱️ Total Load Time');
                this.printStats();
                
            } catch (error) {
                console.error('❌ فشل تحميل التطبيق:', error);
                if (window.EnhancedLoader) {
                    window.EnhancedLoader.fail('فشل تحميل التطبيق!');
                    window.EnhancedLoader.addError(error.message || 'خطأ غير معروف');
                }
            }
        },

        /**
         * التحقق من تحميل CSS
         */
        async waitForCSSLoad() {
            return new Promise((resolve) => {
                // التحقق من أن جميع ملفات CSS تم تحميلها
                const stylesheets = Array.from(document.styleSheets);
                let loadedCount = 0;
                const totalSheets = stylesheets.length;
                
                if (totalSheets === 0) {
                    // إذا لم تكن هناك ملفات CSS، انتظر قليلاً ثم أكمل
                    setTimeout(resolve, 100);
                    return;
                }
                
                const checkStylesheets = () => {
                    let allLoaded = true;
                    for (let i = 0; i < stylesheets.length; i++) {
                        try {
                            // محاولة الوصول إلى CSS rules - إذا فشل، الملف لم يتم تحميله بعد
                            const rules = stylesheets[i].cssRules || stylesheets[i].rules;
                            if (rules) {
                                loadedCount++;
                            }
                        } catch (e) {
                            // إذا كان هناك خطأ CORS أو الملف لم يتم تحميله بعد
                            allLoaded = false;
                        }
                    }
                    
                    if (allLoaded || loadedCount === totalSheets) {
                        resolve();
                    } else {
                        // إعادة المحاولة بعد تأخير قصير
                        requestAnimationFrame(checkStylesheets);
                    }
                };
                
                // استخدام requestAnimationFrame لتأخير التحقق حتى يتم تحميل CSS
                requestAnimationFrame(() => {
                    // انتظار إضافي قصير لضمان تحميل CSS
                    setTimeout(checkStylesheets, 50);
                });
            });
        },

        /**
         * المرحلة 1: التهيئة
         */
        async phaseInit() {
            this.startPhase(this.phases.INIT);
            this.updateLoader(5, 'تهيئة النظام...');
            
            // الانتظار حتى يتم تحميل CSS لتجنب FOUC warning
            await this.waitForCSSLoad();
            
            // تهيئة شاشة التحميل المحسنة (بدون عرض - التحميل في الخلفية)
            if (window.EnhancedLoader) {
                // استخدام requestAnimationFrame لتأخير التنفيذ حتى يتم render CSS
                requestAnimationFrame(() => {
                    window.EnhancedLoader.init();
                    // لا نعرض شاشة التحميل - التحميل في الخلفية
                    // window.EnhancedLoader.show(100);
                });
            }
            
            // التحقق من دعم المتصفح
            this.checkBrowserSupport();
            
            this.updateLoader(10, 'تم التهيئة');
            this.endPhase(this.phases.INIT);
        },

        /**
         * المرحلة 2: الموديولات الأساسية
         */
        async phaseCore() {
            this.startPhase(this.phases.CORE);
            this.updateLoader(15, 'تحميل الموديولات الأساسية...');
            
            // تحميل متوازي للموديولات الأساسية (تحسين الأداء)
            const [utilsLoaded, appStateLoaded] = await Promise.all([
                this.waitForModule('Utils', 3000),
                this.waitForModule('AppState', 3000)
            ]);
            
            if (utilsLoaded) {
                this.updateLoader(25, 'تم تحميل Utils');
            }
            if (appStateLoaded) {
                this.updateLoader(30, 'تم تحميل AppState');
            }
            
            this.endPhase(this.phases.CORE);
        },

        /**
         * المرحلة 3: الخدمات
         */
        async phaseServices() {
            this.startPhase(this.phases.SERVICES);
            this.updateLoader(35, 'تحميل الخدمات...');
            
            // انتظار تحميل DataManager (تقليل الوقت إلى 10 ثوانٍ - تحسين الأداء)
            const dataManager = await this.waitForModule('DataManager', 10000);
            
            // التحقق من أن DataManager محمل بالكامل وبه الدوال المطلوبة
            if (!dataManager || !dataManager.load || !dataManager.save) {
                const errorMsg = '⚠️ DataManager لم يتم تحميله بالكامل - بعض الدوال مفقودة';
                console.error(errorMsg);
                if (window.EnhancedLoader) {
                    window.EnhancedLoader.addError('فشل تحميل DataManager - يرجى تحديث الصفحة');
                }
                // محاولة إعادة تحميل الصفحة بعد 3 ثوانٍ
                setTimeout(() => {
                    if (!window.DataManager || !window.DataManager.load) {
                        console.error('❌ DataManager لا يزال غير محمل - إعادة تحميل الصفحة...');
                        window.location.reload();
                    }
                }, 3000);
            } else {
                this.updateLoader(45, 'تم تحميل DataManager');
            }
            
            // تهيئة LazyLoader إذا كان متاحاً
            if (window.LazyLoader) {
                await window.LazyLoader.init();
                this.updateLoader(50, 'تم تهيئة LazyLoader');
            }
            
            // تهيئة Issue Tracking Service (Cross-Module System)
            if (typeof IssueTrackingService !== 'undefined' && IssueTrackingService.init) {
                try {
                    IssueTrackingService.init();
                    if (AppState?.debugMode) {
                        log('✅ تم تهيئة Issue Tracking Service');
                    }
                } catch (error) {
                    Utils?.safeWarn('⚠️ خطأ في تهيئة Issue Tracking Service:', error);
                }
            }
            
            // تحميل البيانات من localStorage (مع انتظار الاكتمال لضمان جاهزية المستخدمين قبل التحقق من الجلسة)
            if (window.DataManager && window.DataManager.load) {
                try {
                    await window.DataManager.load();
                    this.updateLoader(55, 'تم تحميل البيانات المحلية');

                    // 🧹 تنظيف أمني: إزالة أي حسابات افتراضية legacy من البيانات المحلية (إن وُجدت)
                    try {
                        if (typeof window.removeDefaultUsersIfNeeded === 'function') {
                            const cleanup = window.removeDefaultUsersIfNeeded({ persistRemote: false });
                            if (cleanup && cleanup.removed > 0) {
                                log(`🧹 تم إزالة ${cleanup.removed} حساب/حسابات افتراضية legacy من البيانات المحلية`);
                            }
                        }
                    } catch (cleanupError) {
                        // لا نكسر التحميل بسبب فشل cleanup
                        log('⚠️ تعذر تنفيذ تنظيف الحسابات الافتراضية legacy:', cleanupError);
                    }
                    
                    // تحميل إعدادات Google بشكل دائم (يجب أن تكون متاحة لجميع المستخدمين)
                    if (window.DataManager && window.DataManager.loadGoogleConfig) {
                        try {
                            window.DataManager.loadGoogleConfig();
                            log('✅ تم تحميل إعدادات Google بنجاح');
                        } catch (configError) {
                            console.warn('⚠️ خطأ في تحميل إعدادات Google:', configError);
                        }
                    }

                    // ✅ تحسين: تحميل مسبق للبيانات المشتركة (المقاولين والموظفين)
                    // هذا يضمن توفرها فوراً عند فتح الموديولات التي تحتاجها (العيادة، التدريب، إلخ)
                    if (typeof GoogleIntegration !== 'undefined' && GoogleIntegration.sendRequest && 
                        AppState.googleConfig?.appsScript?.enabled && AppState.googleConfig?.appsScript?.scriptUrl) {
                        // تحميل البيانات المشتركة في الخلفية بشكل متوازي (بدون انتظار)
                        Promise.all([
                            // تحميل بيانات المقاولين
                            GoogleIntegration.sendRequest({ action: 'getAllApprovedContractors', data: {} }).catch(() => null),
                            // تحميل بيانات الموظفين
                            GoogleIntegration.sendRequest({ action: 'getAllEmployees', data: {} }).catch(() => null)
                        ]).then(([contractorsResult, employeesResult]) => {
                            // حفظ البيانات في AppState فوراً
                            if (contractorsResult?.success && Array.isArray(contractorsResult.data)) {
                                AppState.appData.approvedContractors = contractorsResult.data;
                                AppState.appData.contractors = contractorsResult.data;
                                if (AppState.debugMode) {
                                    log(`✅ تم تحميل ${contractorsResult.data.length} مقاول مسبقاً`);
                                }
                            }
                            if (employeesResult?.success && Array.isArray(employeesResult.data)) {
                                AppState.appData.employees = employeesResult.data;
                                if (AppState.debugMode) {
                                    log(`✅ تم تحميل ${employeesResult.data.length} موظف مسبقاً`);
                                }
                            }
                            // حفظ البيانات محلياً
                            if (window.DataManager && window.DataManager.save) {
                                window.DataManager.save();
                            }
                        }).catch(() => {
                            // تجاهل الأخطاء - البيانات المحلية ستكون متاحة
                        });
                    }

                    // ✅ إضافة: تحميل فوري لإعدادات النماذج (المواقع) بعد تحميل البيانات المحلية
                    // هذا يضمن توفر المواقع فوراً عند فتح أي موديول يحتاجها
                    if (typeof Permissions !== 'undefined' && typeof Permissions.initFormSettingsState === 'function') {
                        try {
                            // تحميل إعدادات النماذج بشكل غير متزامن (لا ننتظرها)
                            Permissions.initFormSettingsState().then(() => {
                                if (AppState.debugMode) {
                                    log('✅ تم تحميل إعدادات النماذج (المواقع) مسبقاً');
                                }
                            }).catch((error) => {
                                if (AppState.debugMode) {
                                    console.warn('⚠️ فشل تحميل إعدادات النماذج مسبقاً:', error);
                                }
                            });
                        } catch (error) {
                            if (AppState.debugMode) {
                                console.warn('⚠️ خطأ في تحميل إعدادات النماذج:', error);
                            }
                        }
                    }
                } catch (error) {
                    console.error('❌ خطأ في تحميل البيانات المحلية:', error);
                    if (window.EnhancedLoader) {
                        window.EnhancedLoader.addError('خطأ في تحميل البيانات المحلية');
                    }
                }
            }
            
            this.endPhase(this.phases.SERVICES);
        },

        /**
         * المرحلة 4: واجهة المستخدم
         */
        async phaseUI() {
            this.startPhase(this.phases.UI);
            this.updateLoader(60, 'تحميل واجهة المستخدم...');
            
            // تحميل متوازي لواجهة المستخدم (تحسين الأداء)
            const [uiLoaded, notificationLoaded] = await Promise.all([
                this.waitForModule('UI', 3000),
                this.waitForModule('Notification', 2000)
            ]);
            
            if (uiLoaded) {
                this.updateLoader(65, 'تم تحميل UI');
            }
            if (notificationLoaded) {
                this.updateLoader(70, 'تم تحميل Notification');
            }

            // إزالة شاشة "جاري التحقق من الجلسة" فور انتهاء تحميل الواجهة حتى لا تبقى ظاهرة عند إعادة التحميل
            this._removeSessionCheckOverlay();
            
            this.endPhase(this.phases.UI);
        },

        /**
         * المرحلة 5: الموديولات
         */
        async phaseModules() {
            this.startPhase(this.phases.MODULES);
            this.updateLoader(75, 'تحميل الموديولات...');
            
            // التحقق من أن ملفات auth.js و dashboard.js قد بدأت التحميل
            // ننتظر قليلاً للتأكد من أن الملفات قد بدأت التحميل
            const authScript = Array.from(document.scripts).find(
                script => script.src && script.src.includes('auth.js')
            );
            const dashboardScript = Array.from(document.scripts).find(
                script => script.src && script.src.includes('dashboard.js')
            );
            
            if (authScript || dashboardScript) {
                // الملفات موجودة في DOM - ننتظر قليلاً للتأكد من بدء التحميل
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // تحميل متوازي لـ Auth و Dashboard (تحسين الأداء - تقليل وقت الانتظار)
            const [authModule, dashboardModule] = await Promise.all([
                this.waitForModule('Auth', 10000, {
                    required: true,
                    checkComplete: (module) => {
                        // التحقق من أن Auth مكتمل وبه الدوال الأساسية
                        return module && 
                               typeof module.login === 'function' &&
                               typeof module.logout === 'function';
                    }
                }),
                this.waitForModule('Dashboard', 10000, {
                    required: false,
                    checkComplete: (module) => {
                        // التحقق من أن Dashboard مكتمل وبه الدوال الأساسية
                        return module && typeof module.load === 'function';
                    }
                })
            ]);
            
            if (authModule) {
                this.updateLoader(85, 'تم تحميل Auth');
            } else {
                console.error('❌ فشل تحميل Auth - الموديول ضروري للتطبيق');
                if (window.EnhancedLoader) {
                    window.EnhancedLoader.addError('فشل تحميل Auth - يرجى تحديث الصفحة');
                }
            }
            
            if (dashboardModule) {
                this.updateLoader(90, 'تم تحميل Dashboard');
            } else {
                console.warn('⚠️ تأخر تحميل Dashboard - سيتم تحميله لاحقاً');
            }
            
            // انتظار تحميل modules-loader.js (يحتوي على جميع الموديولات الأخرى)
            // نتحقق من وجود أحد الموديولات الرئيسية كدليل على تحميل modules-loader.js
            const modulesLoaderScript = Array.from(document.scripts).find(
                script => script.src && script.src.includes('modules-loader.js')
            );
            
            if (modulesLoaderScript) {
                // ننتظر قليلاً للتأكد من بدء تحميل modules-loader.js
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // تحميل متوازي للموديولات الرئيسية (تحسين الأداء - تقليل وقت الانتظار)
            // الموديولات غير مطلوبة لتسجيل الدخول، لذا ننتظرها بوقت أقل
            // ✅ إصلاح: زيادة timeout لأن الموديولات تُحمّل بالتسلسل (async=false, defer=true)
            // Employees هو الموديول #23 من 33، لذا يحتاج وقت أطول
            const [usersModule, incidentsModule, employeesModule] = await Promise.all([
                this.waitForModule('Users', 3000, {
                    required: false,
                    checkComplete: (module) => {
                        return module && typeof module.load === 'function';
                    }
                }),
                this.waitForModule('Incidents', 3000, {
                    required: false,
                    checkComplete: (module) => {
                        return module && typeof module.load === 'function';
                    }
                }),
                this.waitForModule('Employees', 4000, {
                    required: false,
                    checkComplete: (module) => {
                        return module && typeof module.load === 'function';
                    }
                })
            ]);
            
            const loadedModules = [usersModule, incidentsModule, employeesModule].filter(Boolean).length;
            if (loadedModules > 0) {
                this.updateLoader(95, `تم تحميل ${loadedModules} موديول`);
            } else {
                this.updateLoader(95, 'جاهز للاستخدام');
            }
            
            this.endPhase(this.phases.MODULES);
        },

        /**
         * المرحلة 6: جاهز
         */
        async phaseReady() {
            this.startPhase(this.phases.READY);
            this.updateLoader(95, 'إنهاء التحميل...');
            
            // تهيئة نظام الأحداث
            if (window.EventManager && window.EventManager.init) {
                window.EventManager.init();
            }
            
            // التحقق من الجلسة يُنفَّذ بعد phaseUI (قبل phaseModules) لتفادي تأخير 10–60 ثانية
            this.updateLoader(100, 'تم التحميل بنجاح!');
            
            // لا نعرض شاشة التحميل - التحميل في الخلفية
            // if (window.EnhancedLoader) {
            //     window.EnhancedLoader.complete('تم تحميل النظام بنجاح!');
            // }
            
            // إطلاق حدث جاهزية التطبيق
            this.dispatchEvent('app:ready');
            
            // ✅ إضافة: حفظ تلقائي للبيانات عند إغلاق الصفحة
            this.setupAutoSaveOnUnload();
            
            this.endPhase(this.phases.READY);
            log('✅ التطبيق جاهز للاستخدام!');
        },

        /**
         * إعداد حفظ تلقائي للبيانات عند إغلاق الصفحة
         */
        setupAutoSaveOnUnload() {
            // ✅ حماية: حفظ البيانات تلقائياً عند إغلاق الصفحة
            window.addEventListener('beforeunload', (e) => {
                try {
                    if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                        // محاولة حفظ البيانات بشكل متزامن (قبل إغلاق الصفحة)
                        window.DataManager.save();
                    }
                } catch (error) {
                    // لا نعرض أخطاء عند إغلاق الصفحة
                    console.error('خطأ في حفظ البيانات عند الإغلاق:', error);
                }
            });
        },

        /**
         * انتظار تحميل موديول
         * @param {string} moduleName - اسم الموديول
         * @param {number} timeout - مهلة الانتظار بالميلي ثانية
         * @param {object} options - خيارات إضافية
         * @param {boolean} options.required - هل الموديول ضروري؟
         * @param {function} options.checkComplete - دالة للتحقق من اكتمال الموديول
         */
        async waitForModule(moduleName, timeout = 5000, options = {}) {
            const { required = false, checkComplete = null } = options;
            const startTime = Date.now();
            
            // التحقق الفوري أولاً
            const initialModule = window[moduleName];
            if (initialModule && typeof initialModule === 'object') {
                // إذا كان هناك دالة للتحقق من الاكتمال، نستخدمها
                if (checkComplete) {
                    if (checkComplete(initialModule)) {
                        log(`✓ ${moduleName} محمل ومكتمل (فوري)`);
                        return initialModule;
                    } else {
                        log(`⏳ ${moduleName} موجود لكن غير مكتمل بعد - ننتظر...`);
                    }
                } else {
                    log(`✓ ${moduleName} محمل (فوري)`);
                    return initialModule;
                }
            }
            
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = 50; // فحص كل 50ms للاستجابة الأسرع
                const maxAttempts = Math.ceil(timeout / checkInterval);
                
                const checkModule = () => {
                    attempts++;
                    
                    // التحقق من تحميل الموديول بشكل كامل
                    const module = window[moduleName];
                    if (module && typeof module === 'object') {
                        // للـ DataManager، نتحقق من وجود الدوال الأساسية
                        if (moduleName === 'DataManager') {
                            if (module.load && module.save && typeof module.load === 'function' && typeof module.save === 'function') {
                                log(`✓ ${moduleName} محمل بالكامل (بعد ${attempts * checkInterval}ms)`);
                                resolve(module);
                                return;
                            } else {
                                // DataManager موجود لكن غير مكتمل - نستمر في الانتظار
                                if (attempts % 20 === 0) { // طباعة كل ثانية تقريباً
                                    log(`⏳ ${moduleName} موجود لكن غير مكتمل... (محاولة ${attempts})`);
                                }
                            }
                        } else if (checkComplete) {
                            // استخدام دالة التحقق المخصصة
                            if (checkComplete(module)) {
                                log(`✓ ${moduleName} محمل ومكتمل (بعد ${attempts * checkInterval}ms)`);
                                resolve(module);
                                return;
                            } else {
                                // الموديول موجود لكن غير مكتمل - نستمر في الانتظار
                                if (attempts % 20 === 0) { // طباعة كل ثانية تقريباً
                                    log(`⏳ ${moduleName} موجود لكن غير مكتمل... (محاولة ${attempts})`);
                                }
                            }
                        } else {
                            // للموديولات الأخرى، نكتفي بوجودها
                            log(`✓ ${moduleName} محمل (بعد ${attempts * checkInterval}ms)`);
                            resolve(module);
                            return;
                        }
                    }
                    
                    // التحقق من انتهاء الوقت
                    const elapsed = Date.now() - startTime;
                    if (elapsed > timeout || attempts >= maxAttempts) {
                        // ✅ إصلاح: تقليل مستوى التحذير للموديولات غير الضرورية
                        // الموديولات ستُحمّل لاحقاً عند الحاجة، لذا هذا ليس خطأ حرج
                        if (required) {
                            const errorMsg = `⚠️ timeout: ${moduleName} لم يتم تحميله بعد ${timeout}ms`;
                            console.warn(errorMsg);
                            console.warn(`محاولات: ${attempts}, الوقت المستغرق: ${elapsed}ms`);
                            
                            // إظهار معلومات إضافية للتصحيح
                            console.warn(`تفاصيل ${moduleName}:`, {
                                exists: typeof window[moduleName] !== 'undefined',
                                isObject: typeof window[moduleName] === 'object',
                                value: window[moduleName] ? Object.keys(window[moduleName]).slice(0, 10) : 'غير موجود',
                                scripts: Array.from(document.scripts).map(s => s.src).filter(s => s.includes('modules-loader'))
                            });
                            
                            if (window.EnhancedLoader) {
                                window.EnhancedLoader.addError(`تأخر تحميل ${moduleName}`);
                            }
                            
                            // إذا كان الموديول ضرورياً، نحاول إعادة تحميل الصفحة
                            console.error(`❌ ${moduleName} ضروري للتطبيق - سيتم إعادة تحميل الصفحة...`);
                            setTimeout(() => {
                                if (!window[moduleName] || (checkComplete && !checkComplete(window[moduleName]))) {
                                    console.error(`❌ ${moduleName} لا يزال غير محمل - إعادة تحميل الصفحة...`);
                                    window.location.reload();
                                }
                            }, 2000);
                        } else {
                            // ✅ للموديولات غير الضرورية: رسالة debug فقط (لا تظهر في console العادي)
                            if (typeof log === 'function') {
                                log(`ℹ️ ${moduleName} لم يُحمّل في الوقت المحدد (${timeout}ms) - سيُحمّل عند الحاجة`);
                            }
                        }
                        
                        // لا نرفض الـ Promise لتجنب إيقاف التطبيق
                        resolve(null);
                        return;
                    }
                    
                    // محاولة أخرى بعد فترة قصيرة
                    setTimeout(checkModule, checkInterval);
                };
                
                // البدء فوراً
                checkModule();
            });
        },

        /**
         * التحقق من دعم المتصفح
         */
        checkBrowserSupport() {
            const required = [
                'localStorage',
                'Promise',
                'fetch',
                'addEventListener'
            ];
            
            const unsupported = required.filter(feature => !(feature in window));
            
            if (unsupported.length > 0) {
                console.error('❌ المتصفح لا يدعم:', unsupported);
                alert('متصفحك لا يدعم بعض الميزات المطلوبة. يُرجى استخدام متصفح حديث.');
            }
        },

        /**
         * بدء مرحلة
         */
        startPhase(phase) {
            this.currentPhase = phase;
            this.timings[phase] = { start: Date.now() };
            log(`📦 بدء المرحلة: ${phase}`);
        },

        /**
         * إنهاء مرحلة
         */
        endPhase(phase) {
            if (this.timings[phase]) {
                this.timings[phase].end = Date.now();
                this.timings[phase].duration = this.timings[phase].end - this.timings[phase].start;
                log(`✓ إنهاء المرحلة: ${phase} (${this.timings[phase].duration}ms)`);
            }
        },

        /**
         * تحديث شاشة التحميل
         */
        updateLoader(progress, message) {
            if (window.EnhancedLoader) {
                window.EnhancedLoader.updateProgress(progress, message);
            }
        },

        /**
         * إطلاق حدث
         */
        dispatchEvent(eventName, detail = null) {
            const event = new CustomEvent(eventName, { detail });
            window.dispatchEvent(event);
        },

        /** إزالة شاشة "جاري التحقق من الجلسة" مرة واحدة فقط — لا تُعرض مرة أخرى */
        _removeSessionCheckOverlay() {
            if (window.__hseSessionCheckOverlayRemoved) return;
            try {
                document.body.removeAttribute('data-hse-pending-session');
                var s = document.getElementById('hse-hide-login-until-ready');
                if (s && s.parentNode) s.remove();
                var loadingEl = document.querySelector('.hse-loading-text');
                if (loadingEl && loadingEl.parentNode) loadingEl.remove();
                window.__hseSessionCheckOverlayRemoved = true;
            } catch (e) { /* ignore */ }
        },

        /** حد أقصى 2 ثانية لرسالة التحقق من الجلسة ثم إزالتها */
        _startSessionCheckOverlayMaxTimer(maxMs) {
            var self = this;
            if (window.__hseSessionCheckOverlayTimer) return;
            window.__hseSessionCheckOverlayTimer = setTimeout(function() {
                window.__hseSessionCheckOverlayTimer = null;
                self._removeSessionCheckOverlay();
            }, maxMs);
        },

        /** انتظار تحميل Auth بحد أقصى (مثلاً 2 ثانية) لتسريع التحقق من الجلسة */
        async _waitForAuthMax(maxMs) {
            try {
                await Promise.race([
                    this.waitForModule('Auth', maxMs, {
                        required: false,
                        checkComplete: function(m) { return m && typeof m.login === 'function' && typeof m.checkRememberedUser === 'function'; }
                    }),
                    new Promise(function(_, reject) { setTimeout(function() { reject(new Error('Auth timeout')); }, maxMs); })
                ]);
            } catch (e) { /* Auth قد لا يكون جاهزاً بعد، التحقق من الجلسة سيعيد المحاولة */ }
        },

        /**
         * التحقق من الجلسة واستعادتها (دالة مساعدة)
         */
        checkAndRestoreSession() {
            // ✅ إصلاح: التحقق من وجود بيانات الجلسة أولاً قبل أي شيء آخر
            let sessionData = sessionStorage.getItem('hse_current_session');
            let rememberData = localStorage.getItem('hse_remember_user');

            // استعادة الجلسة من localStorage (نسخة احتياطية أو تذكرني) إلى sessionStorage إذا فُقدت
            if (!sessionData) {
                try {
                    const backup = localStorage.getItem('hse_session_backup');
                    const source = backup || rememberData;
                    if (source) {
                        const data = typeof source === 'string' ? JSON.parse(source) : source;
                        if (data && data.email) {
                            const str = typeof source === 'string' ? source : JSON.stringify(data);
                            sessionStorage.setItem('hse_current_session', str);
                            if (data.sessionId) sessionStorage.setItem('hse_session_id', data.sessionId);
                            sessionData = sessionStorage.getItem('hse_current_session');
                            log('✅ تم استعادة الجلسة من localStorage إلى sessionStorage');
                        }
                    }
                } catch (e) {
                    log('⚠️ فشل استعادة الجلسة من localStorage:', e);
                }
            }

            // إذا لم تكن هناك بيانات جلسة على الإطلاق بعد المحاولة، نعرض شاشة الدخول
            if (!sessionData && !rememberData) {
                this._removeSessionCheckOverlay();
                log('ℹ️ لا توجد جلسة محفوظة - عرض شاشة تسجيل الدخول');
                if (typeof window.UI !== 'undefined' && typeof window.UI.showLoginScreen === 'function') {
                    window.UI.showLoginScreen();
                }
                return;
            }
            
            // إذا كانت هناك بيانات جلسة، ننتظر حتى تكون AppState و AppState.appData جاهزة
            if (typeof window.Auth !== 'undefined' && typeof window.Auth.checkRememberedUser === 'function') {
                const self = this;
                (async function runRestoreWithSync() {
                    try {
                        // التأكد من تحميل AppState و AppState.appData قبل التحقق
                        if (typeof AppState === 'undefined' || !AppState.appData) {
                            log('⚠️ AppState أو AppState.appData غير محمل - إعادة المحاولة...');
                            setTimeout(() => self.checkAndRestoreSession(), 150);
                            return;
                        }
                        // مزامنة المستخدمين في الخلفية (بدون انتظار) حتى لا نفقد الجلسة إذا فشلت المزامنة أو أعادت مصفوفة فارغة
                        if (AppState.useSupabaseBackend === true && typeof GoogleIntegration !== 'undefined' && typeof GoogleIntegration.syncUsers === 'function') {
                            GoogleIntegration.syncUsers(true).then(function() { log('✅ تم مزامنة المستخدمين في الخلفية'); }).catch(function(syncErr) { log('⚠️ فشل مزامنة المستخدمين:', syncErr); });
                        }
                        // تعيين علامة إعادة التحميل قبل التحقق
                        AppState.isPageRefresh = true;
                        const isLoggedIn = window.Auth.checkRememberedUser();
                        if (isLoggedIn) {
                            self._sessionRestoreRetries = 0;
                            self._removeSessionCheckOverlay();
                            log('✅ تم استعادة الجلسة - المستخدم مسجل دخول');
                            if (typeof window.UI !== 'undefined' && typeof window.UI.showMainApp === 'function') {
                                window.UI.showMainApp();
                            }
                        } else {
                            const usersLoaded = Array.isArray(AppState.appData.users) && AppState.appData.users.length > 0;
                            const retryCount = (self._sessionRestoreRetries || 0);
                            // عند وجود بيانات جلسة نزيد المحاولات لانتظار تحميل appData وتجنب الخروج ثم العودة
                            const maxRetries = (sessionData || rememberData) ? 15 : 3;
                            const retryDelay = usersLoaded ? 100 : (sessionData || rememberData ? 200 : 150);
                            if (retryCount < maxRetries) {
                                self._sessionRestoreRetries = retryCount + 1;
                                log('⚠️ إعادة محاولة استعادة الجلسة (' + self._sessionRestoreRetries + '/' + maxRetries + ')...');
                                setTimeout(() => self.checkAndRestoreSession(), retryDelay);
                                return;
                            }
                            self._sessionRestoreRetries = 0;
                            self._removeSessionCheckOverlay();
                            log('ℹ️ فشل استعادة الجلسة بعد ' + maxRetries + ' محاولات - عرض شاشة تسجيل الدخول');
                            if (typeof window.UI !== 'undefined' && typeof window.UI.showLoginScreen === 'function') {
                                window.UI.showLoginScreen();
                            }
                        }
                    } catch (error) {
                        console.error('❌ خطأ في التحقق من المستخدم المحفوظ:', error);
                        if (sessionData || rememberData) {
                            log('⚠️ حدث خطأ لكن هناك بيانات جلسة - إعادة المحاولة...');
                            setTimeout(() => self.checkAndRestoreSession(), 150);
                        } else {
                            self._removeSessionCheckOverlay();
                            if (typeof window.UI !== 'undefined' && typeof window.UI.showLoginScreen === 'function') {
                                window.UI.showLoginScreen();
                            }
                        }
                    }
                })();
            } else {
                // إذا لم يكن Auth متاحاً، نتحقق من وجود جلسة
                if (sessionData || rememberData) {
                    log('⚠️ Auth غير متاح لكن هناك بيانات جلسة - انتظار تحميل Auth...');
                    setTimeout(() => {
                        this.checkAndRestoreSession();
                    }, 150);
                } else {
                    this._removeSessionCheckOverlay();
                    console.warn('⚠️ Auth.checkRememberedUser غير متاح - عرض شاشة تسجيل الدخول');
                    if (typeof window.UI !== 'undefined' && typeof window.UI.showLoginScreen === 'function') {
                        window.UI.showLoginScreen();
                    }
                }
            }
        },

        /**
         * طباعة الإحصائيات
         */
        printStats() {
            log('\n📊 إحصائيات التحميل:');
            log('═'.repeat(50));
            
            let totalTime = 0;
            Object.entries(this.timings).forEach(([phase, timing]) => {
                const duration = timing.duration || 0;
                totalTime += duration;
                log(`  ${phase.padEnd(15)} : ${duration}ms`);
            });
            
            log('─'.repeat(50));
            log(`  ${'الإجمالي'.padEnd(15)} : ${totalTime}ms`);
            log('═'.repeat(50));
            
            // إحصائيات الذاكرة (إذا كانت متاحة)
            if (performance.memory) {
                const usedMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
                const totalMB = (performance.memory.totalJSHeapSize / 1048576).toFixed(2);
                log(`  استخدام الذاكرة: ${usedMB}MB / ${totalMB}MB`);
            }
            
            log('\n');
        }
    };

    // تصدير للاستخدام العام
    window.AppBootstrap = AppBootstrap;

    // بدء التطبيق عند تحميل DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            AppBootstrap.start();
        });
    } else {
        // DOM محمل بالفعل
        AppBootstrap.start();
    }

})();

