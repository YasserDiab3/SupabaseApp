/**
 * Auth Module - موديول المصادقة
 * تم استخراجه من app-modules.js لتحسين الأداء
 */

// تعريف Auth كمتغير عام (global) ليكون متاحاً لجميع الملفات
window.Auth = {
    // ملاحظة: المستخدمون يجب أن يكونوا من قاعدة البيانات فقط
    // لا يتم تخزين كلمات المرور في الكود لأسباب أمنية
    validUsers: {
        // تم إزالة كلمات المرور من الكود لأسباب أمنية
        // المستخدمون الآن يحملون من قاعدة البيانات فقط
    },

    // ===== Bootstrap Admin (First-time setup only) =====
    // يسمح بالدخول لأول مرة فقط لتجهيز المزامنة/إضافة المستخدمين، ثم يتم تعطيله تلقائياً بعد نجاح مزامنة Users.
    // ⚠️ لا يتم تخزين كلمة المرور نصياً هنا. يتم استخدام SHA-256 hash فقط.
    bootstrap: {
        email: 'admin@hse.local',
        // SHA-256("admin123") - لا يوجد تخزين لكلمة المرور النصية داخل الكود
        passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
        disabledKey: 'hse_bootstrap_disabled',
        disabledAtKey: 'hse_bootstrap_disabled_at'
    },

    /** مدة الجلسة بالساعات — يمكن تقليلها (مثلاً 4 أو 8) لإنهاء الجلسات أسرع */
    SESSION_DURATION_HOURS: 8,

    isBootstrapEmail(email) {
        try {
            return String(email || '').toLowerCase().trim() === this.bootstrap.email;
        } catch (e) {
            return false;
        }
    },

    isBootstrapDisabled() {
        try {
            return localStorage.getItem(this.bootstrap.disabledKey) === 'true';
        } catch (e) {
            return false;
        }
    },

    disableBootstrap(reason = '') {
        try {
            localStorage.setItem(this.bootstrap.disabledKey, 'true');
            localStorage.setItem(this.bootstrap.disabledAtKey, new Date().toISOString());
            if (reason) {
                localStorage.setItem('hse_bootstrap_disabled_reason', String(reason).slice(0, 200));
            }
        } catch (e) { /* ignore */ }
    },

    /**
     * رسالة خطأ تسجيل الدخول: إن كان الخادم غير متاح (503 / بدون اتصال) نعرض رسالة اتصال، وإلا رسالة بيانات خاطئة.
     */
    _getLoginErrorMessage() {
        try {
            if (typeof AppState !== 'undefined' && AppState.runningWithoutBackend === true) {
                return 'تعذر الاتصال بالخادم (الخادم غير متاح أو خطأ 503). يرجى التحقق من الاتصال بالإنترنت ونشر التطبيق، ثم المحاولة لاحقاً.';
            }
        } catch (e) { /* ignore */ }
        return 'اسم المستخدم أو كلمة المرور غير صحيح';
    },

    /**
     * يتم استدعاؤها بعد نجاح مزامنة Users.
     * إذا تم جلب مستخدمين حقيقيين (غير @hse.local)، نعطّل حساب الـ bootstrap نهائياً.
     */
    handleUsersSyncSuccess() {
        try {
            if (this.isBootstrapDisabled()) return false;
            const users = AppState?.appData?.users;
            if (!Array.isArray(users) || users.length === 0) return false;

            const nonLegacyUsers = users.filter(u => {
                const em = String(u?.email || '').toLowerCase().trim();
                return em && !em.endsWith('@hse.local');
            });
            if (nonLegacyUsers.length === 0) return false;

            // تعطيل نهائي
            this.disableBootstrap('Users sync completed with real users');

            // إذا كان المستخدم الحالي هو bootstrap → تسجيل خروج إجباري
            if (AppState?.currentUser?.isBootstrap === true) {
                try {
                    if (typeof Notification !== 'undefined' && Notification.success) {
                        Notification.success('✅ تم تعطيل حساب مدير النظام الافتراضي بعد نجاح المزامنة. يرجى تسجيل الدخول بحسابك من قاعدة البيانات.');
                    }
                } catch (e) { /* ignore */ }

                try {
                    this.logout();
                } catch (e) { /* ignore */ }

                try {
                    if (typeof UI !== 'undefined' && typeof UI.showLoginScreen === 'function') {
                        UI.showLoginScreen();
                    }
                } catch (e) { /* ignore */ }
            }

            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * تسجيل الدخول
     */
    async login(email, password, remember = false) {
        // التحقق من وجود DataManager قبل البدء
        if (typeof window.DataManager === 'undefined') {
            Utils.safeError('❌ خطأ فادح: DataManager غير محمل');
            const errorMessage = 'نظام إدارة البيانات غير جاهز. يرجى تحديث الصفحة والمحاولة مرة أخرى.';
            if (typeof window.Notification !== 'undefined') {
                window.Notification.error(errorMessage);
            }
            return { success: false, message: errorMessage };
        }
        
        // إزالة تسجيل المعلومات الحساسة في الإنتاج
        const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
        if (!isProduction) {
            Utils.safeLog(' بدء تسجيل الدخول:', { email, passwordLength: password?.length, remember });
        }

        if (!email || !password) {
            if (!isProduction) {
                Utils.safeWarn('⚠️ بيانات ناقصة:', { email: !!email, password: !!password });
            }
            const errorMessage = 'يرجى إدخال البريد الإلكتروني وكلمة المرور';
            Notification.error(errorMessage);
            return { success: false, message: errorMessage };
        }

        email = email.trim().toLowerCase();

        // التحقق من Rate Limiting
        try {
            await Utils.RateLimiter.checkLockout(email);
        } catch (error) {
            Notification.error(error.message);
            return { success: false, message: error.message };
        }

        if (!isProduction) {
            Utils.safeLog('✅ البريد بعد التنظيف:', email);
        }

        if (!Utils.isValidEmail(email)) {
            Utils.safeWarn('⚠️ بريد إلكتروني غير صحيح:', email);
            const errorMessage = 'يرجى إدخال بريد إلكتروني صحيح';
            Notification.error(errorMessage);
            return { success: false, message: errorMessage };
        }

        // استخدام البيانات المحلية أولاً لتسريع تسجيل الدخول
        // ⚠️ مهم: في أول تشغيل (users=0) يجب أن ننتظر مزامنة Users قبل محاولة التحقق من الحساب
        let localUsersCount = Array.isArray(AppState.appData.users) ? AppState.appData.users.length : 0;
        // مع Supabase: المزامنة متاحة إذا وُجدت syncUsers (بدون اشتراط appsScript)
        const canSyncUsers = !!(
            (AppState.useSupabaseBackend === true && typeof GoogleIntegration !== 'undefined' && typeof GoogleIntegration.syncUsers === 'function') ||
            (AppState.googleConfig && AppState.googleConfig.appsScript && AppState.googleConfig.appsScript.enabled && AppState.googleConfig.appsScript.scriptUrl && typeof GoogleIntegration !== 'undefined' && typeof GoogleIntegration.syncUsers === 'function')
        );

        if (localUsersCount > 0) {
            Utils.safeLog(`📊 استخدام ${localUsersCount} مستخدم محلي - تسجيل دخول سريع`);
        } else if (canSyncUsers) {
            Utils.safeLog('🔄 لا توجد بيانات محلية - مزامنة المستخدمين من قاعدة البيانات قبل تسجيل الدخول...');
            try {
                const timeoutMs = 15000; // ✅ زيادة المهلة إلى 15 ثانية
                const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(false), timeoutMs));
                const syncOk = await Promise.race([GoogleIntegration.syncUsers(true), timeoutPromise]);
                if (syncOk) {
                    Utils.safeLog('✅ تم تحديث قائمة المستخدمين من قاعدة البيانات');
                } else {
                    Utils.safeWarn('⚠️ تعذر مزامنة Users في الوقت المحدد - سيتم المتابعة بالبيانات المحلية');
                    // ✅ إصلاح: محاولة تحميل البيانات المحلية إذا فشلت المزامنة
                    if (typeof window.DataManager !== 'undefined' && window.DataManager.load) {
                        try {
                            await window.DataManager.load();
                            localUsersCount = Array.isArray(AppState.appData.users) ? AppState.appData.users.length : 0;
                            if (localUsersCount > 0) {
                                Utils.safeLog(`✅ تم تحميل ${localUsersCount} مستخدم من البيانات المحلية`);
                            }
                        } catch (loadError) {
                            Utils.safeWarn('⚠️ فشل تحميل البيانات المحلية:', loadError);
                        }
                    }
                }
            } catch (error) {
                const errorMsg = error?.message || '';
                const errorStr = errorMsg.toLowerCase();
                const isNormalError = errorMsg.includes('معرف قاعدة البيانات غير محدد') ||
                    errorMsg.includes('غير متاح') ||
                    errorMsg.includes('not available') ||
                    errorStr.includes('الخادم غير مفعّل');
                
                if (!isNormalError) {
                    Utils.safeWarn('⚠️ فشل مزامنة المستخدمين من قاعدة البيانات:', error);
                    // ✅ إصلاح: محاولة تحميل البيانات المحلية عند الفشل
                    if (typeof window.DataManager !== 'undefined' && window.DataManager.load) {
                        try {
                            await window.DataManager.load();
                            localUsersCount = Array.isArray(AppState.appData.users) ? AppState.appData.users.length : 0;
                            if (localUsersCount > 0) {
                                Utils.safeLog(`✅ تم تحميل ${localUsersCount} مستخدم من البيانات المحلية بعد فشل المزامنة`);
                            }
                        } catch (loadError) {
                            Utils.safeWarn('⚠️ فشل تحميل البيانات المحلية:', loadError);
                        }
                    }
                }
            }
            // تحديث العداد بعد محاولة المزامنة
            localUsersCount = Array.isArray(AppState.appData.users) ? AppState.appData.users.length : 0;
        } else {
            Utils.safeLog(`📊 قاعدة البيانات غير متصلة/غير جاهزة - استخدام ${localUsersCount} مستخدم محلي`);
            // ✅ إصلاح: محاولة تحميل البيانات المحلية إذا كانت متاحة
            if (localUsersCount === 0 && typeof window.DataManager !== 'undefined' && window.DataManager.load) {
                try {
                    await window.DataManager.load();
                    localUsersCount = Array.isArray(AppState.appData.users) ? AppState.appData.users.length : 0;
                    if (localUsersCount > 0) {
                        Utils.safeLog(`✅ تم تحميل ${localUsersCount} مستخدم من البيانات المحلية`);
                    }
                } catch (loadError) {
                    Utils.safeWarn('⚠️ فشل تحميل البيانات المحلية:', loadError);
                }
            }
        }

        // ملاحظة: تم إزالة المستخدمين الثابتين لأسباب أمنية
        // جميع المستخدمين يجب أن يكونوا من قاعدة البيانات قط
        let user = null; // تم إزالة validUsers لأسباب أمنية

        // البحث في قاعدة بيانات المستخدمين
        let foundUser = null;
        let users = AppState.appData.users || [];

        // عند استخدام Supabase: مزامنة المستخدمين قبل التحقق لتجنب استخدام هاش قديم من الكاش
        if (AppState.useSupabaseBackend === true && typeof GoogleIntegration !== 'undefined' && typeof GoogleIntegration.syncUsers === 'function') {
            try {
                await GoogleIntegration.syncUsers(true);
                users = AppState.appData.users || [];
            } catch (syncErr) {
                Utils.safeWarn('⚠️ فشل مزامنة المستخدمين عند الدخول:', syncErr);
                const msg = 'تعذر الاتصال بقاعدة البيانات. تحقق من الاتصال بالإنترنت وحاول مرة أخرى.';
                if (typeof Notification !== 'undefined') Notification.error(msg);
                return { success: false, message: msg };
            }
        }

        // ✅ Bootstrap: إذا لم يوجد أي مستخدمين بعد، نسمح بحساب bootstrap (مرة واحدة فقط حتى نجاح المزامنة)
        if (Array.isArray(users) && users.length === 0 && !this.isBootstrapDisabled() && this.isBootstrapEmail(email)) {
            const bootstrapUser = {
                id: 'BOOTSTRAP_ADMIN',
                name: 'مدير النظام (تهيئة أول مرة)',
                email: this.bootstrap.email,
                role: 'admin',
                department: 'إدارة النظام',
                active: true,
                password: '***',
                passwordHash: this.bootstrap.passwordHash,
                permissions: {},
                createdAt: new Date().toISOString()
            };
            users = [bootstrapUser]; // لا نحفظه في AppState.appData.users (جلسة مؤقتة فقط)
            foundUser = bootstrapUser;
        }

        // معالجة البيانات إذا كانت تحتوي على JSON strings (من الخلفية)
        if (users.length > 0) {
            users = users.map(u => {
                // إذا كانت permissions عبارة عن string JSON، نحولها إلى كائن
                if (typeof u.permissions === 'string' && u.permissions.trim() !== '') {
                    try {
                        u.permissions = JSON.parse(u.permissions);
                    } catch (e) {
                        Utils.safeWarn('⚠ شل تحليل permissions:', e);
                        u.permissions = {};
                    }
                }
                // إذا كانت loginHistory عبارة عن string JSON، نحولها إلى مصفوفة
                if (typeof u.loginHistory === 'string' && u.loginHistory.trim() !== '') {
                    try {
                        u.loginHistory = JSON.parse(u.loginHistory);
                    } catch (e) {
                        Utils.safeWarn('⚠ شل تحليل loginHistory:', e);
                        u.loginHistory = [];
                    }
                }
                return u;
            });
        }

        Utils.safeLog('🔍 البحث في قاعدة البيانات، عدد المستخدمين:', users.length);

        // التنشيط من قاعدة البيانات: المستخدم يُعتبر مفعّلاً عندما يكون موجوداً في جدول users
        // مع data يحتوي على الحقول المطلوبة ووجود password_hash (وكلمة مرور صحيحة) وعدم تعطيل الحساب (active !== false).
        if (users.length > 0) {
            // البحث باستخدام البريد أولاً، ثم id إذا كان يشبه البريد (مطابقة تسجيل الدخول)
            foundUser = users.find(u => {
                if (!u) return false;
                const userEmail = (u.email != null && String(u.email).trim()) ? String(u.email).toLowerCase().trim() : '';
                const userId = (u.id != null && /@/.test(String(u.id))) ? String(u.id).toLowerCase().trim() : '';
                return userEmail === email || userId === email;
            });
            
            if (foundUser) {
                Utils.safeLog('✅ نتيجة البحث: المستخدم موجود في قاعدة البيانات');
            } else {
                Utils.safeWarn('❌ نتيجة البحث: المستخدم غير موجود في قاعدة البيانات', {
                    searchedEmail: email,
                    availableEmails: users.map(u => u?.email).filter(Boolean).slice(0, 5)
                });
            }

            if (foundUser) {
                Utils.safeLog('📋 بيانات المستخدم الموجود:', {
                    email: foundUser.email,
                    name: foundUser.name,
                    role: foundUser.role,
                    active: foundUser.active,
                    hasPassword: !!foundUser.password
                });
            }
        }

        // إذا لم يتم العثور عليه في المستخدمين الثابتين، نستخدم المستخدم من قاعدة البيانات
        if (!user && foundUser) {
            Utils.safeLog('✅ تم العثور على المستخدم في قاعدة البيانات');
            // التحقق من حالة الحساب (إذا كانت active غير محددة أو true، نعتبرها معّلة)
            if (foundUser.active === false || foundUser.active === 'false') {
                Utils.safeWarn('⚠️ الحساب غير معّل');
                const errorMessage = 'هذا الحساب غير مفعّل. يرجى الاتصال بالمدير';
                Notification.error(errorMessage);
                return { success: false, message: errorMessage };
            }

            // التحقق من وجود passwordHash (أو password_hash من Supabase)
            const userHash = (foundUser.passwordHash || foundUser.password_hash || '').trim();
            if (!userHash || userHash === '***') {
                Utils.safeWarn('⚠️ المستخدم موجود لكن لا يملك passwordHash صحيح');
                const errorMessage = 'يجب تحديث كلمة المرور. يرجى الاتصال بالمدير لإعادة تعيين كلمة المرور.';
                Notification.error(errorMessage);
                return { success: false, message: errorMessage };
            }

            // ===== التحقق من تسجيل الدخول المتزامن =====
            // منع تسجيل الدخول من جهاز آخر إذا كان المستخدم متصل بالفعل
            // توليد معرف جلسة فريد لهذا المتصفح/الجهاز
            const generateSessionId = () => {
                // إنشاء معرف فريد يجمع بين timestamp و random string و user agent hash
                const timestamp = Date.now();
                const random = Math.random().toString(36).substring(2, 15);
                const userAgent = navigator.userAgent.substring(0, 50);
                const userAgentHash = userAgent.split('').reduce((acc, char) => {
                    return ((acc << 5) - acc) + char.charCodeAt(0);
                }, 0).toString(36);
                return `SESS_${timestamp}_${random}_${userAgentHash}`;
            };

            // الحصول على معرف الجلسة الحالي من sessionStorage أو إنشاء واحد جديد
            let currentSessionId = sessionStorage.getItem('hse_session_id');
            if (!currentSessionId) {
                currentSessionId = generateSessionId();
                sessionStorage.setItem('hse_session_id', currentSessionId);
            }

            // محاولة مزامنة حالة المستخدم من قاعدة البيانات للحصول على أحدث حالة
            if (canSyncUsers && typeof GoogleIntegration !== 'undefined' && GoogleIntegration.syncUsers) {
                try {
                    Utils.safeLog('🔄 مزامنة حالة المستخدم من قاعدة البيانات للتحقق من حالة الاتصال...');
                    await GoogleIntegration.syncUsers(true);
                    // إعادة البحث عن المستخدم بعد المزامنة
                    const refreshedUsers = AppState.appData.users || [];
                    const refreshedUser = refreshedUsers.find(u => {
                        if (!u) return false;
                        const userEmail = (u.email != null && String(u.email).trim()) ? String(u.email).toLowerCase().trim() : '';
                        const userId = (u.id != null && /@/.test(String(u.id))) ? String(u.id).toLowerCase().trim() : '';
                        return userEmail === email || userId === email;
                    });
                    if (refreshedUser) {
                        foundUser.isOnline = refreshedUser.isOnline;
                        foundUser.activeSessionId = refreshedUser.activeSessionId;
                        Utils.safeLog('✅ تم تحديث حالة الاتصال من قاعدة البيانات:', {
                            isOnline: foundUser.isOnline,
                            activeSessionId: foundUser.activeSessionId
                        });
                    }
                } catch (syncError) {
                    Utils.safeWarn('⚠️ فشل مزامنة حالة المستخدم:', syncError);
                    // نستمر في التحقق بالحالة المحلية
                }
            }

            // التحقق من وجود جلسة نشطة في المتصفح الحالي
            let hasActiveSession = false;
            let currentSessionData = null;
            try {
                const currentSession = sessionStorage.getItem('hse_current_session');
                if (currentSession) {
                    currentSessionData = JSON.parse(currentSession);
                    // إذا كانت الجلسة الحالية لنفس المستخدم، نتحقق من صحة الجلسة
                    if (currentSessionData && currentSessionData.email && currentSessionData.email.toLowerCase() === email) {
                        // التحقق من أن الجلسة غير منتهية (إذا كان هناك loginTime)
                        if (currentSessionData.loginTime) {
                            const loginTime = new Date(currentSessionData.loginTime);
                            const now = new Date();
                            const sessionAge = now - loginTime;
                            const hours = (typeof this.SESSION_DURATION_HOURS === 'number' && this.SESSION_DURATION_HOURS > 0)
                                ? this.SESSION_DURATION_HOURS : 8;
                            const maxSessionAge = hours * 60 * 60 * 1000;
                            
                            if (sessionAge < maxSessionAge) {
                                // التحقق من أن معرف الجلسة يطابق
                                if (currentSessionData.sessionId === currentSessionId) {
                                    hasActiveSession = true;
                                    Utils.safeLog('✅ المستخدم متصل بالفعل من نفس المتصفح - السماح بتسجيل الدخول');
                                } else {
                                    Utils.safeLog('⚠️ معرف الجلسة غير متطابق - سيتم إنشاء جلسة جديدة');
                                }
                            } else {
                                Utils.safeLog('⚠️ الجلسة منتهية الصلاحية - سيتم السماح بتسجيل الدخول');
                                // الجلسة منتهية، نسمح بتسجيل الدخول ولكن نحدث isOnline
                            }
                        } else {
                            // لا يوجد loginTime، نعتبرها جلسة نشطة إذا كان sessionId يطابق
                            if (currentSessionData.sessionId === currentSessionId) {
                                hasActiveSession = true;
                                Utils.safeLog('✅ المستخدم متصل بالفعل من نفس المتصفح - السماح بتسجيل الدخول');
                            }
                        }
                    }
                }
            } catch (e) {
                Utils.safeWarn('⚠️ خطأ في التحقق من الجلسة الحالية:', e);
            }

            // التحقق من وجود جلسة نشطة من جهاز آخر — مدير النظام يُسمح له بالدخول من أي جهاز، المستخدمون العاديون يُمنعون
            const isAdminUser = foundUser.role === 'admin' || (foundUser.role && String(foundUser.role).includes('مدير'));
            if (foundUser.isOnline === true && foundUser.activeSessionId && !isAdminUser) {
                // إذا كان هناك معرف جلسة نشط ولا يطابق الجلسة الحالية — للمستخدمين العاديين فقط
                if (foundUser.activeSessionId !== currentSessionId && !hasActiveSession) {
                    Utils.safeWarn('⚠️ المستخدم متصل بالفعل من جهاز آخر', {
                        activeSessionId: foundUser.activeSessionId,
                        currentSessionId: currentSessionId
                    });
                    const sessionHours = (typeof this.SESSION_DURATION_HOURS === 'number' && this.SESSION_DURATION_HOURS > 0)
                        ? this.SESSION_DURATION_HOURS : 8;
                    const errorMessage = '⚠️ هذا الحساب متصل بالفعل من جهاز آخر.\n\n' +
                        'يرجى تسجيل الخروج من الجهاز الآخر أولاً، أو انتظار انتهاء الجلسة (' + sessionHours + ' ساعات).\n\n' +
                        'أو اطلب من مدير النظام سحب الجلسة من إدارة المستخدمين للسماح لك بالدخول.\n\n' +
                        'لا يمكن تسجيل الدخول من أكثر من جهاز في نفس الوقت.';
                    Notification.error(errorMessage);

                    // إشعار مدير النظام ليقوم بالسماح أو سحب الجلسة
                    try {
                        const usersList = AppState.appData?.users || [];
                        const admins = usersList.filter(u => u && (u.role === 'admin' || (u.role && String(u.role).includes('مدير'))));
                        const notifyPayload = {
                            userId: admins.length ? (admins[0].id || admins[0].email) : 'admin',
                            title: 'محاولة تسجيل دخول من جهاز آخر',
                            message: 'المستخدم ' + (foundUser.name || email) + ' حاول تسجيل الدخول من جهاز آخر. يمكنك سحب الجلسة من إدارة المستخدمين للسماح له بالدخول.',
                            type: 'login_blocked',
                            priority: 'high',
                            link: '#users-section',
                            data: { module: 'users', action: 'revoke_session', userEmail: email, userId: foundUser.id }
                        };
                        if (typeof GoogleIntegration !== 'undefined' && typeof GoogleIntegration.sendToAppsScript === 'function') {
                            GoogleIntegration.sendToAppsScript('addNotification', notifyPayload).catch(function () {});
                        }
                        admins.slice(1).forEach(function (admin) {
                            if (typeof GoogleIntegration !== 'undefined' && typeof GoogleIntegration.sendToAppsScript === 'function') {
                                GoogleIntegration.sendToAppsScript('addNotification', { ...notifyPayload, userId: admin.id || admin.email }).catch(function () {});
                            }
                        });
                    } catch (e) {
                        Utils.safeWarn('⚠️ فشل إرسال إشعار المدير:', e);
                    }

                    return { success: false, message: errorMessage };
                }
            }
            if (foundUser.isOnline === true && foundUser.activeSessionId && isAdminUser && foundUser.activeSessionId !== currentSessionId && !hasActiveSession) {
                Utils.safeLog('✅ مدير النظام — السماح بتسجيل الدخول من جهاز جديد (الجلسة السابقة ستُستبدل)');
            }

            // ✅ تشخيص: عرض قيمة name الأصلية من foundUser
            console.log('🔍 [AUTH] foundUser.name الأصلي:', {
                value: foundUser.name,
                type: typeof foundUser.name,
                isObject: typeof foundUser.name === 'object',
                stringified: JSON.stringify(foundUser.name)
            });

            // ✅ تطبيع name إذا كان object
            let extractedName = foundUser.name;
            if (typeof foundUser.name === 'object' && foundUser.name !== null) {
                if (foundUser.name.value) {
                    extractedName = String(foundUser.name.value).trim();
                } else {
                    const values = Object.values(foundUser.name);
                    if (values.length === 1 && typeof values[0] === 'string') {
                        extractedName = String(values[0]).trim();
                    } else {
                        extractedName = String(foundUser.name).trim();
                    }
                }
                console.log('✅ [AUTH] تم استخراج name من object:', extractedName);
            } else if (typeof foundUser.name === 'string') {
                extractedName = foundUser.name.trim();
            }

            const normalizedPerms = (typeof Permissions !== 'undefined' && typeof Permissions.normalizePermissions === 'function')
                ? (Permissions.normalizePermissions(foundUser.permissions) || {})
                : (foundUser.permissions || {});
            user = {
                name: extractedName || 'مستخدم',
                password: foundUser.password || '***',
                passwordHash: foundUser.passwordHash || '',
                role: foundUser.role || 'user',
                department: foundUser.department || '',
                permissions: normalizedPerms,
                id: foundUser.id,
                email: foundUser.email
            };

            console.log('✅ [AUTH] user.name النهائي:', user.name);

            Utils.safeLog('📋 بيانات المستخدم المحضرة:', {
                email: user.email,
                name: user.name,
                role: user.role,
                hasPasswordHash: !!user.passwordHash && user.passwordHash !== '***',
                passwordHashLength: user.passwordHash?.length || 0
            });
        } else if (!user && !foundUser) {
            // ⚠️ إنتاج: لا ننشئ حسابات افتراضية أو كلمات مرور داخل الكود.
            // إذا كانت قاعدة البيانات فارغة، نطلب إعداد المستخدمين عبر قاعدة البيانات/المدير.
            if (users.length === 0) {
                // ✅ إصلاح: محاولة مزامنة مرة أخرى قبل إرجاع الخطأ
                if (canSyncUsers) {
                    Utils.safeLog('🔄 محاولة مزامنة Users مرة أخرى...');
                    try {
                        const syncResult = await GoogleIntegration.syncUsers(true);
                        if (syncResult) {
                            users = AppState.appData.users || [];
                            localUsersCount = users.length;
                            if (localUsersCount > 0) {
                                // إعادة البحث عن المستخدم بعد المزامنة
                                foundUser = users.find(u => {
                                    if (!u || !u.email) return false;
                                    const userEmail = typeof u.email === 'string' ? u.email.toLowerCase().trim() : '';
                                    return userEmail === email;
                                });
                                if (foundUser) {
                                    Utils.safeLog('✅ تم العثور على المستخدم بعد إعادة المزامنة');
                                    const p = (typeof Permissions !== 'undefined' && typeof Permissions.normalizePermissions === 'function')
                                        ? (Permissions.normalizePermissions(foundUser.permissions) || {})
                                        : (foundUser.permissions || {});
                                    user = {
                                        name: (foundUser.name && String(foundUser.name).trim()) || 'مستخدم',
                                        password: foundUser.password || '***',
                                        passwordHash: foundUser.passwordHash || '',
                                        role: foundUser.role || 'user',
                                        department: foundUser.department || '',
                                        permissions: p,
                                        id: foundUser.id,
                                        email: foundUser.email
                                    };
                                }
                            }
                        }
                    } catch (syncError) {
                        Utils.safeWarn('⚠️ فشلت إعادة مزامنة Users:', syncError);
                    }
                }
                // احتياطي: جلب المستخدمين مباشرة من API إذا لم تنجح المزامنة (Supabase)
                if (!foundUser && !user && users.length === 0 && canSyncUsers && typeof GoogleIntegration !== 'undefined' && typeof GoogleIntegration.readFromSheets === 'function') {
                    try {
                        const directUsers = await GoogleIntegration.readFromSheets('Users');
                        const arr = Array.isArray(directUsers) ? directUsers : [];
                        if (arr.length > 0) {
                            if (global.AppState && global.AppState.appData) global.AppState.appData.users = arr;
                            users = arr;
                            foundUser = users.find(u => u && u.email && (String(u.email).toLowerCase().trim() === email));
                            if (foundUser) {
                                Utils.safeLog('✅ تم العثور على المستخدم بعد الجلب المباشر');
                                const p2 = (typeof Permissions !== 'undefined' && typeof Permissions.normalizePermissions === 'function')
                                    ? (Permissions.normalizePermissions(foundUser.permissions) || {})
                                    : (foundUser.permissions || {});
                                user = {
                                    name: (foundUser.name && String(foundUser.name).trim()) || 'مستخدم',
                                    password: foundUser.password || '***',
                                    passwordHash: foundUser.passwordHash || '',
                                    role: foundUser.role || 'user',
                                    department: foundUser.department || '',
                                    permissions: p2,
                                    id: foundUser.id,
                                    email: foundUser.email
                                };
                            }
                        }
                    } catch (e) {
                        Utils.safeWarn('⚠️ فشل الجلب المباشر للمستخدمين:', e);
                    }
                }
                
                // إذا لم يتم العثور على المستخدم بعد إعادة المحاولة
                if (!foundUser && !user && users.length === 0) {
                    const msg = 'اسم المستخدم أو كلمة المرور غير صحيح';
                    Notification.error(msg);
                    return { success: false, message: msg };
                }
            }
            
            // إذا لم يتم العثور على المستخدم بعد كل المحاولات
            if (!foundUser && !user && users.length > 0) {
                // قاعدة البيانات ليست فارغة لكن المستخدم غير موجود
                Utils.safeWarn('❌ المستخدم غير موجود في قاعدة البيانات', {
                    email: email,
                    totalUsers: users.length,
                    userEmails: users.map(u => u.email).filter(Boolean).slice(0, 5)
                });
                const errorMessage = this._getLoginErrorMessage();
                Notification.error(errorMessage);
                return { success: false, message: errorMessage };
            }
        }

        // التحقق من وجود المستخدم
        if (!user) {
            Utils.safeError('❌ المستخدم غير موجود بعد البحث في قاعدة البيانات');
            const errorMessage = this._getLoginErrorMessage();
            Notification.error(errorMessage);
            return { success: false, message: errorMessage };
        }

        // تطبيع من API قد يُرجع password_hash (snake_case)
        if (user.password_hash && !user.passwordHash) user.passwordHash = user.password_hash;

        const inputPasswordRaw = (password || '').trim();
        // دعم كلا الشكلين من الـ API: passwordHash (camelCase) أو password_hash (snake_case) من Supabase
        let hashedStored = (user.passwordHash || user.password_hash || '').trim();

        // إضافة سجلات تفصيلية لمعرفة ما تم استرجاعه
        Utils.safeLog('🔍 فحص كلمة المرور المستخدم:', {
            email: email,
            hasPasswordHash: !!hashedStored,
            passwordHashLength: hashedStored?.length || 0,
            passwordHashValue: hashedStored ? (hashedStored.substring(0, 10) + '...') : 'غير موجود',
            isPasswordHashValid: hashedStored ? Utils.isSha256Hex(hashedStored) : false,
            userDataKeys: Object.keys(user)
        });

        // ===== نظام تسجيل الدخول الأول التلقائي =====
        // دعم تسجيل الدخول بكلمة مرور نصية (أول مرة) ثم تحويلها تلقائياً إلى Hash
        
        let isFirstTimeLogin = false;
        let needsHashUpdate = false;
        let passwordMatch = false;
        
        // معالجة passwordHash كـ Object (من قاعدة البيانات)
        if (typeof hashedStored === 'object' && hashedStored !== null) {
            if (hashedStored.value) {
                hashedStored = String(hashedStored.value).trim();
                Utils.safeLog('✅ تم استخراج passwordHash من object');
            } else {
                const values = Object.values(hashedStored);
                if (values.length === 1 && typeof values[0] === 'string') {
                    hashedStored = String(values[0]).trim();
                    Utils.safeLog('✅ تم استخراج passwordHash من object (أول قيمة)');
                } else {
                    hashedStored = String(hashedStored).trim();
                }
            }
        }
        
        // التحقق من نوع passwordHash
        if (!hashedStored || hashedStored === '***' || hashedStored === '') {
            Utils.safeWarn('⚠️ المستخدم ليس لديه passwordHash');
            const errorMessage = 'حسابك غير مكتمل. يرجى التواصل مع مدير النظام لإعداد كلمة المرور.';
            Notification.error(errorMessage);
            return { success: false, message: errorMessage };
        }
        
        if (Utils.isSha256Hex(hashedStored)) {
            // ✅ Hash صحيح - استخدام التحقق المشفر العادي
            Utils.safeLog('✅ passwordHash صحيح (SHA-256) - استخدام التحقق المشفر');
            
            const normalizedInputPassword = await Utils.normalizePasswordForComparison(inputPasswordRaw, hashedStored);
            const storedPassword = hashedStored.toLowerCase().trim();
            const comparableInput = normalizedInputPassword.toLowerCase().trim();
            
            passwordMatch = (storedPassword === comparableInput);
            
            Utils.safeLog('🔑 التحقق من كلمة المرور المشفرة:', {
                storedPasswordLength: storedPassword?.length || 0,
                comparableInputLength: comparableInput?.length || 0,
                passwordsMatch: passwordMatch
            });
            
        } else {
            // ⚠️ ليس Hash - قد يكون كلمة مرور نصية (تسجيل دخول أول مرة)
            Utils.safeLog('⚠️ passwordHash ليس SHA-256 - قد يكون كلمة مرور نصية');
            Utils.safeLog('الطول:', hashedStored?.length);
            Utils.safeLog('القيمة (أول 10 أحرف):', hashedStored?.substring(0, 10));
            
            // التحقق المباشر من كلمة المرور النصية
            if (hashedStored === inputPasswordRaw) {
                Utils.safeLog('✅ تطابق مباشر مع كلمة المرور النصية!');
                Utils.safeLog('🔄 سيتم تحويل كلمة المرور إلى Hash وتحديث قاعدة البيانات');
                
                passwordMatch = true;
                isFirstTimeLogin = true;
                needsHashUpdate = true;
                
                // تشفير كلمة المرور
                const newHash = await Utils.hashPassword(inputPasswordRaw);
                Utils.safeLog('🔐 Hash الجديد:', newHash);
                
                // تحديث foundUser مؤقتاً
                foundUser.passwordHash = newHash;
                foundUser.requiresPasswordChange = false;
                foundUser.isFirstLogin = false;
                
                // تحديث hashedStored للاستخدام في باقي الكود
                hashedStored = newHash;
                
            } else {
                Utils.safeWarn('⚠️ passwordHash غير صالح وليس كلمة مرور صحيحة');
                const errorMessage = 'بيانات الحساب غير صحيحة. يرجى التواصل مع مدير النظام.';
                Notification.error(errorMessage);
                return { success: false, message: errorMessage };
            }
        }
        
        // التحقق من نتيجة المطابقة
        if (!passwordMatch) {
            // محاولة أخيرة: مزامنة قسرية للتحقق من التحديثات (Supabase أو Google Script)
            const canSyncUsers = AppState.useSupabaseBackend === true || AppState.googleConfig?.appsScript?.enabled;
            if (canSyncUsers && typeof GoogleIntegration !== 'undefined' && typeof GoogleIntegration.syncUsers === 'function') {
                Utils.safeLog('🔄 كلمة المرور غير صحيحة - محاولة مزامنة قسرية...');
                try {
                    await GoogleIntegration.syncUsers(true);

                    // إعادة تحميل المستخدم
                    const refreshedUsers = AppState.appData.users || [];
                    const refreshedUser = refreshedUsers.find(u => {
                        if (!u) return false;
                        const userEmail = (u.email != null && String(u.email).trim()) ? String(u.email).toLowerCase().trim() : '';
                        const userId = (u.id != null && /@/.test(String(u.id))) ? String(u.id).toLowerCase().trim() : '';
                        return userEmail === email || userId === email;
                    });

                    if (refreshedUser && refreshedUser.passwordHash) {
                        const newStoredHash = refreshedUser.passwordHash.trim().toLowerCase();
                        const newComparableInput = (await Utils.normalizePasswordForComparison(inputPasswordRaw, newStoredHash)).toLowerCase().trim();

                        if (newStoredHash === newComparableInput) {
                            Utils.safeLog('✅ نجح تسجيل الدخول بعد المزامنة القسرية');
                            passwordMatch = true;
                            foundUser = refreshedUser;
                            hashedStored = newStoredHash;
                        }
                    }
                } catch (syncError) {
                    Utils.safeWarn('⚠ فشل المزامنة القسرية:', syncError);
                }
            }

            // إعادة التحقق
            if (!passwordMatch) {
                // تسجيل محاولة فاشلة
                try {
                    await Utils.RateLimiter.recordFailedAttempt(email);
                } catch (rateLimitError) {
                    Notification.error(rateLimitError.message);
                    return { success: false, message: rateLimitError.message };
                }

                Utils.safeError('❌ كلمة المرور غير صحيحة');
                const errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                // عدم استدعاء Notification هنا؛ النموذج يعرض الرسالة مرة واحدة لتجنب التكرار
                return { success: false, message: errorMessage };
            }
        }

        // إذا نجح تسجيل الدخول، مسح محاولات Rate Limiting
        await Utils.RateLimiter.clearAttempts(email);

        const loginTime = new Date().toISOString();

        // استخدام بيانات المستخدم الكاملة من قاعدة البيانات إن وجدت
        const fullUserData = foundUser || (users.find(u => {
            if (!u || !u.email) return false;
            const userEmail = typeof u.email === 'string' ? u.email.toLowerCase().trim() : '';
            return userEmail === email;
        }));
        // مصدر موحّد لبيانات المستخدم عند تعيين الجلسة (من قاعدة البيانات أولاً حتى يُعيّن role بشكل صحيح للمدير)
        const effectiveUser = fullUserData || user;

        let userPermissions = (effectiveUser && effectiveUser.permissions) || {};
        if (fullUserData && fullUserData.permissions) {
            if (typeof fullUserData.permissions === 'string') {
                try {
                    userPermissions = JSON.parse(fullUserData.permissions);
                } catch (e) {
                    Utils.safeWarn('⚠ فشل تحليل permissions:', e);
                    userPermissions = {};
                }
            } else {
                userPermissions = fullUserData.permissions;
            }
        }
        if (typeof Permissions !== 'undefined' && typeof Permissions.normalizePermissions === 'function') {
            userPermissions = Permissions.normalizePermissions(userPermissions) || {};
        }

        const isBootstrap = this.isBootstrapEmail(email) && !this.isBootstrapDisabled();

        // ✅ الحل الجذري: التأكد من وجود name صحيح (استخدام effectiveUser من قاعدة البيانات لضمان ظهور دور المدير)
        // إذا كان user.name فارغًا، نستخدم email كبديل
        // ✅ إصلاح جذري: التأكد من أن userName ليس "النظام" أو فارغ
        let userName = (effectiveUser && (effectiveUser.name || effectiveUser.displayName || '')) ? String(effectiveUser.name || effectiveUser.displayName || '').trim() : '';
        
        // ✅ إذا كان userName فارغ أو "النظام"، نستخدم email
        if (!userName || userName === 'النظام' || userName === '') {
            userName = email;
            console.log('⚠️ [AUTH] user.name كان فارغ أو "النظام"، استخدام email:', userName);
        }
        
        // ✅ التحقق النهائي: إذا كان userName لا يزال فارغ، نستخدم id كبديل
        if (!userName || userName === 'النظام' || userName === '') {
            userName = (fullUserData?.id || (effectiveUser && effectiveUser.id) || '').toString().trim();
            if (userName) {
                console.log('⚠️ [AUTH] user.name و email كانا فارغين، استخدام id:', userName);
            }
        }
        
        // ✅ التحقق النهائي: إذا كان userName لا يزال فارغ، نستخدم "مستخدم" كبديل
        if (!userName || userName === 'النظام' || userName === '') {
            userName = 'مستخدم';
            console.log('⚠️ [AUTH] لا يمكن الحصول على اسم المستخدم، استخدام "مستخدم" كبديل');
        }
        
        console.log('🔍 [AUTH] تعيين AppState.currentUser:', {
            originalName: effectiveUser && effectiveUser.name,
            displayName: effectiveUser && effectiveUser.displayName,
            email: email,
            finalName: userName,
            role: effectiveUser && effectiveUser.role
        });
        
        AppState.currentUser = {
            email,
            name: userName, // ✅ استخدام userName
            role: (effectiveUser && effectiveUser.role) ? String(effectiveUser.role).trim() : 'user',
            department: (effectiveUser && effectiveUser.department) ? String(effectiveUser.department) : '',
            permissions: userPermissions,
            id: fullUserData?.id || (effectiveUser && effectiveUser.id),
            passwordHash: hashedStored,
            passwordChanged: fullUserData?.passwordChanged ?? false,
            forcePasswordChange: fullUserData?.forcePasswordChange === true,
            isBootstrap: isBootstrap,
            loginTime: loginTime
        };

        console.log('✅ [AUTH] AppState.currentUser.name النهائي:', AppState.currentUser.name);
        Utils.safeLog('✅ تسجيل الدخول ناجح:', AppState.currentUser);
        Utils.safeLog('📋 الصلاحيات:', AppState.currentUser.permissions);

        // إذا كان تسجيل دخول أول مرة، حدّث قاعدة البيانات بالـ Hash الجديد
        if (needsHashUpdate) {
            Utils.safeLog('🔄 ===== تحديث Hash في قاعدة البيانات =====');
            try {
                // إعداد البيانات المحدثة
                const updatedUserData = {
                    ...foundUser,
                    password: '***', // إخفاء كلمة المرور النصية
                    passwordHash: hashedStored, // Hash الجديد
                    requiresPasswordChange: false,
                    isFirstLogin: false,
                    updatedAt: new Date().toISOString()
                };
                
                Utils.safeLog('📤 إرسال Hash الجديد إلى قاعدة البيانات...');
                
                // تحديث في قاعدة البيانات
                if (typeof GoogleIntegration !== 'undefined' && GoogleIntegration.updateUser) {
                    GoogleIntegration.updateUser(updatedUserData).then(updateResult => {
                        if (updateResult && updateResult.success) {
                            Utils.safeLog('✅ تم تحديث passwordHash في قاعدة البيانات بنجاح!');
                        } else {
                            Utils.safeWarn('⚠️ فشل تحديث قاعدة البيانات:', updateResult);
                        }
                    }).catch(updateError => {
                        Utils.safeError('❌ خطأ في تحديث Hash:', updateError);
                    });
                }
                
                // تحديث في البيانات المحلية
                const userIndex = AppState.appData.users.findIndex(u => u.email === email);
                if (userIndex !== -1) {
                    AppState.appData.users[userIndex].passwordHash = hashedStored;
                    AppState.appData.users[userIndex].password = '***';
                    AppState.appData.users[userIndex].updatedAt = new Date().toISOString();
                    if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                        window.DataManager.save();
                    }
                    Utils.safeLog('✅ تم تحديث البيانات المحلية');
                }
                
                Utils.safeLog('================================================');
            } catch (updateError) {
                Utils.safeError('❌ خطأ في تحديث Hash:', updateError);
                // نستمر في تسجيل الدخول حتى لو فشل التحديث
            }
        }

        // تسجيل حركة تسجيل الدخول
        if (typeof UserActivityLog !== 'undefined') {
            UserActivityLog.log('login', 'Authentication', null, {
                description: `تسجيل دخول المستخدم ${AppState.currentUser.name || AppState.currentUser.email}`
            }).catch(() => { }); // لا ننتظر حتى لا نبطئ عملية تسجيل الدخول
        }

        // الحصول على معرف الجلسة الحالي (تم إنشاؤه مسبقاً في بداية الدالة)
        let currentSessionId = sessionStorage.getItem('hse_session_id');
        if (!currentSessionId) {
            // إنشاء معرف جلسة جديد إذا لم يكن موجوداً
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 15);
            const userAgent = navigator.userAgent.substring(0, 50);
            const userAgentHash = userAgent.split('').reduce((acc, char) => {
                return ((acc << 5) - acc) + char.charCodeAt(0);
            }, 0).toString(36);
            currentSessionId = `SESS_${timestamp}_${random}_${userAgentHash}`;
            sessionStorage.setItem('hse_session_id', currentSessionId);
        }

        // تحديث بيانات تسجيل الدخول للمستخدم في قاعدة البيانات
        const usersList = AppState.appData.users || [];
        const userIndex = usersList.findIndex(u => u.email && u.email.toLowerCase() === email);
        if (userIndex !== -1) {
            usersList[userIndex].lastLogin = loginTime;
            usersList[userIndex].isOnline = true;
            usersList[userIndex].activeSessionId = currentSessionId; // حفظ معرف الجلسة
            usersList[userIndex].loginHistory = usersList[userIndex].loginHistory || [];
            usersList[userIndex].loginHistory.push({
                time: loginTime,
                ip: 'N/A',
                userAgent: navigator.userAgent.substring(0, 100),
                sessionId: currentSessionId
            });
            // الاحتفاظ بآخر 10 عمليات تسجيل دخول فقط
            if (usersList[userIndex].loginHistory.length > 10) {
                usersList[userIndex].loginHistory = usersList[userIndex].loginHistory.slice(-10);
            }
            AppState.appData.users = usersList;
            
            // تحديث عدد تسجيلات الدخول الإجمالي للنظام
            if (!AppState.appData.systemStatistics) {
                AppState.appData.systemStatistics = {};
            }
            if (typeof AppState.appData.systemStatistics.totalLogins !== 'number') {
                AppState.appData.systemStatistics.totalLogins = 0;
            }
            AppState.appData.systemStatistics.totalLogins += 1;
            
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            }
            
            // مزامنة lastLogin مع قاعدة البيانات في الخلفية
            if (typeof GoogleIntegration !== 'undefined' && GoogleIntegration.sendToAppsScript && 
                AppState.googleConfig?.appsScript?.enabled) {
                const userId = usersList[userIndex].id;
                const updateData = {
                    lastLogin: loginTime,
                    isOnline: true,
                    activeSessionId: currentSessionId, // إرسال معرف الجلسة إلى قاعدة البيانات
                    loginHistory: usersList[userIndex].loginHistory
                };
                
                // تحديث في الخلفية بشكل غير متزامن (لا ننتظر حتى لا نبطئ تسجيل الدخول)
                GoogleIntegration.sendToAppsScript('updateUser', {
                    userId: userId,
                    updateData: updateData
                }).then(updateResult => {
                    if (updateResult && updateResult.success) {
                        Utils.safeLog('✅ تم مزامنة lastLogin و activeSessionId مع قاعدة البيانات بنجاح');
                    } else {
                        Utils.safeWarn('⚠️ فشل مزامنة lastLogin مع قاعدة البيانات:', updateResult?.message);
                    }
                }).catch(updateError => {
                    Utils.safeWarn('⚠️ خطأ في مزامنة lastLogin مع قاعدة البيانات:', updateError);
                    // لا نوقف تسجيل الدخول حتى لو فشلت المزامنة
                });
            }
            
            // تحديث جدول المستخدمين فوراً إذا كان مفتوحاً
            if (typeof Users !== 'undefined' && typeof Users.updateUserStatus === 'function') {
                setTimeout(() => {
                    Users.updateUserStatus(usersList[userIndex].id);
                }, 100);
            }
            
            // تحديث زر حالة الاتصال في الشريط الجانبي
            if (typeof UI !== 'undefined' && typeof UI.updateUserConnectionStatus === 'function') {
                setTimeout(() => {
                    UI.updateUserConnectionStatus();
                    // بدء التحديث التلقائي لحالة الاتصال
                    if (typeof UI.startAutoRefreshConnectionStatus === 'function') {
                        UI.startAutoRefreshConnectionStatus();
                    }
                }, 200);
            }
        } else if (!foundUser && user) {
            // إضافة المستخدم إلى قاعدة البيانات (إذا كان جديداً) — id = البريد الإلكتروني
            const newUser = {
                id: (email || '').trim().toLowerCase(),
                email: email,
                name: user.name,
                password: user.password,
                role: user.role || 'user',
                department: user.department || '',
                active: true,
                permissions: user.permissions || {},
                lastLogin: loginTime,
                isOnline: true,
                loginHistory: [{
                    time: loginTime,
                    ip: 'N/A',
                    userAgent: navigator.userAgent.substring(0, 100)
                }],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            AppState.appData.users.push(newUser);
            
            // تحديث عدد تسجيلات الدخول الإجمالي للنظام
            if (!AppState.appData.systemStatistics) {
                AppState.appData.systemStatistics = {};
            }
            if (typeof AppState.appData.systemStatistics.totalLogins !== 'number') {
                AppState.appData.systemStatistics.totalLogins = 0;
            }
            AppState.appData.systemStatistics.totalLogins += 1;
            
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            }
            // لا يتم تحديث قاعدة البيانات تلقائياً بعد تسجيل الدخول للحفاظ على السجلات الأصلية
        }

        // حفظ الجلسة بشكل آمن (بدون passwordHash)
        const safeUserData = {
            email: AppState.currentUser.email,
            name: AppState.currentUser.name,
            role: AppState.currentUser.role,
            department: AppState.currentUser.department,
            permissions: AppState.currentUser.permissions,
            id: AppState.currentUser.id,
            loginTime: AppState.currentUser.loginTime,
            sessionId: currentSessionId // حفظ معرف الجلسة في الجلسة
            // تم إزالة passwordHash لأسباب أمنية
        };

        sessionStorage.setItem('hse_current_session', JSON.stringify(safeUserData));
        Utils.safeLog('💾 تم حفظ الجلسة في sessionStorage');

        // نسخة احتياطية في localStorage لاستعادة الجلسة بعد إعادة التحميل (إذا فُقدت sessionStorage)
        try {
            const backupData = {
                email: safeUserData.email,
                name: safeUserData.name,
                role: safeUserData.role,
                department: safeUserData.department,
                permissions: safeUserData.permissions,
                id: safeUserData.id,
                loginTime: safeUserData.loginTime,
                sessionId: currentSessionId
            };
            localStorage.setItem('hse_session_backup', JSON.stringify(backupData));
        } catch (e) { Utils.safeWarn('⚠️ فشل حفظ نسخة احتياطية للجلسة:', e); }

        // إذا اختار "تذكرني"، نحفظ في localStorage أيضاً
        if (remember) {
            localStorage.setItem('hse_remember_user', JSON.stringify(safeUserData));
            Utils.safeLog('💾 تم حفظ الجلسة في localStorage (تذكرني)');
        } else {
            // إذا لم يختر "تذكرني"، نحذف من localStorage
            localStorage.removeItem('hse_remember_user');
            Utils.safeLog('🗑 تم حذف localStorage (لم يختر تذكرني)');
        }

        // ✅ تحديث القائمة الجانبية فوراً بعد تسجيل الدخول لضمان ظهور المديولات حسب الصلاحيات (بدون انتظار التحميل اللاحق أو إعادة تنشيط من Supabase)
        if (typeof Permissions !== 'undefined' && typeof Permissions.updateNavigation === 'function') {
            Permissions.updateNavigation();
            setTimeout(function () {
                if (typeof Permissions !== 'undefined' && typeof Permissions.updateNavigation === 'function') {
                    Permissions.updateNavigation();
                }
            }, 150);
        }

        // التحقق من التسجيل الأول أو عدم تغيير كلمة المرور
        const requiresPasswordChange = fullUserData?.forcePasswordChange === true;
        const isFirstLogin = !fullUserData?.passwordChanged;

        if (!requiresPasswordChange) {
            Notification.success(`مرحباً ${user.name}`);
        }

        // تحميل إعدادات الاتصال بشكل دائم بعد تسجيل الدخول (يجب أن تكون متاحة لجميع المستخدمين)
        if (typeof window.DataManager !== 'undefined' && window.DataManager.loadGoogleConfig) {
            try {
                window.DataManager.loadGoogleConfig();
                Utils.safeLog('✅ تم تحميل إعدادات الاتصال بعد تسجيل الدخول');
            } catch (configError) {
                Utils.safeWarn('⚠️ خطأ في تحميل إعدادات الاتصال بعد تسجيل الدخول:', configError);
            }
        }

        // بدء نظام مراقبة الاتصال بعد تسجيل الدخول
        if (typeof ConnectionMonitor !== 'undefined' && ConnectionMonitor.start) {
            setTimeout(() => {
                try {
                    ConnectionMonitor.start();
                    Utils.safeLog('✅ تم بدء نظام مراقبة الاتصال بعد تسجيل الدخول');
                } catch (monitorError) {
                    Utils.safeWarn('⚠️ فشل بدء نظام مراقبة الاتصال:', monitorError);
                }
            }, 1000);
        }

        // ✅ إصلاح: تحميل البيانات الأساسية أولاً بشكل مباشر ومتسلسل بدون تأخير
        // بدء تحميل البيانات مباشرة بعد تسجيل الدخول (بدون requestAnimationFrame)
        // ⚠️ مهم: لا نستخدم await هنا حتى لا نبطئ عملية تسجيل الدخول
        // لكن نبدأ التحميل فوراً في الخلفية
        (async () => {
            try {
                Utils.safeLog('🚀 بدء تحميل البيانات بعد تسجيل الدخول...');
                
                // ✅ الخطوة 1: تحميل البيانات المحلية أولاً كـ fallback فوري
                if (typeof DataManager !== 'undefined' && DataManager.load) {
                    try {
                        await DataManager.load();
                        Utils.safeLog('✅ تم تحميل البيانات المحلية');
                    } catch (loadError) {
                        Utils.safeWarn('⚠️ فشل تحميل البيانات المحلية:', loadError);
                    }
                }

                // ✅ الخطوة 2: تحميل البيانات الأساسية بشكل متسلسل من قاعدة البيانات (مهم جداً)
                // يعمل مع Supabase و Google Script — بدون تأخير، تحميل مباشر
                const hasBackend = typeof GoogleIntegration !== 'undefined' &&
                    (AppState.useSupabaseBackend === true || (AppState.googleConfig && AppState.googleConfig.appsScript && AppState.googleConfig.appsScript.enabled));
                if (hasBackend) {
                    const prioritySheets = ['Users', 'Employees', 'Contractors', 'ApprovedContractors'];
                    const sheetMapping = {
                        'Users': 'users',
                        'Employees': 'employees',
                        'Contractors': 'contractors',
                        'ApprovedContractors': 'approvedContractors'
                    };

                    // تحميل متسلسل للبيانات الأساسية (مهم لضمان الترتيب وعدم فقدان البيانات)
                    for (const sheetName of prioritySheets) {
                        try {
                            // محاولة التحميل مع timeout لتجنب الانتظار الطويل
                            const timeoutPromise = new Promise((_, reject) => 
                                setTimeout(() => reject(new Error('انتهت مهلة التحميل')), 10000)
                            );
                            
                            const dataPromise = GoogleIntegration.readFromSheets(sheetName);
                            const data = await Promise.race([dataPromise, timeoutPromise]);
                            const key = sheetMapping[sheetName];
                            
                            if (key && Array.isArray(data) && data.length > 0) {
                                AppState.appData[key] = data;
                                Utils.safeLog(`✅ تم تحميل ${sheetName}: ${data.length} سجل`);
                            } else if (key && Array.isArray(AppState.appData[key]) && AppState.appData[key].length > 0) {
                                Utils.safeLog(`⚠️ ${sheetName}: فشل التحميل من قاعدة البيانات - استخدام ${AppState.appData[key].length} سجل محلي`);
                            }
                        } catch (error) {
                            const key = sheetMapping[sheetName];
                            const errorMsg = error?.message || String(error);
                            
                            // ✅ معالجة الأخطاء: استخدام البيانات المحلية عند الفشل
                            if (key && Array.isArray(AppState.appData[key]) && AppState.appData[key].length > 0) {
                                Utils.safeLog(`⚠️ ${sheetName}: فشل التحميل (${errorMsg}) - استخدام ${AppState.appData[key].length} سجل محلي`);
                            } else {
                                Utils.safeWarn(`⚠️ ${sheetName}: فشل التحميل ولا توجد بيانات محلية احتياطية`);
                                
                                // إظهار رسالة للمستخدم فقط للأخطاء الحرجة
                                if (sheetName === 'Users' && typeof Notification !== 'undefined') {
                                    Notification.warning('تعذر تحميل بيانات المستخدمين. قد تحتاج إلى تحديث الصفحة.', 5000);
                                }
                            }
                        }
                    }

                    // حفظ البيانات الأساسية فوراً بعد التحميل
                    if (typeof DataManager !== 'undefined' && DataManager.save) {
                        try {
                            DataManager.save();
                        } catch (saveError) {
                            Utils.safeWarn('⚠️ فشل حفظ البيانات المحلية:', saveError);
                        }
                    }

                    // ✅ تحميل إعدادات الشركة (بما فيها سياسة ما بعد الدخول) مع نفس تدفق بيانات المستخدمين لظهورها مباشرة بعد التسجيل
                    if (typeof DataManager !== 'undefined' && DataManager.loadCompanySettings) {
                        try {
                            await DataManager.loadCompanySettings(true);
                            if (AppState.debugMode) Utils.safeLog('✅ تم تحميل إعدادات الشركة مع بيانات المستخدم');
                        } catch (settingsErr) {
                            Utils.safeWarn('⚠️ فشل تحميل إعدادات الشركة مع بيانات المستخدم:', settingsErr);
                        }
                    }

                    // ✅ الخطوة 3: تحديث الجلسة والقائمة بعد تحميل بيانات المستخدمين
                    // هذا مهم جداً لضمان تحديث الصلاحيات والقائمة الجانبية وظهور المديولات
                    try {
                        if (typeof window.Auth !== 'undefined' && typeof window.Auth.updateUserSession === 'function') {
                            window.Auth.updateUserSession();
                        }

                        if (typeof Permissions !== 'undefined' && typeof Permissions.updateNavigation === 'function') {
                            Permissions.updateNavigation();
                            // إعادة تحديث القائمة بعد تأخير قصير لضمان جاهزية DOM وتم تطبيق role من قاعدة البيانات
                            setTimeout(function () {
                                if (typeof Permissions !== 'undefined' && typeof Permissions.updateNavigation === 'function') {
                                    Permissions.updateNavigation();
                                }
                            }, 400);
                        }
                    } catch (updateError) {
                        Utils.safeWarn('⚠️ فشل تحديث الجلسة أو القائمة:', updateError);
                    }

                    Utils.safeLog('✅ اكتمل تحميل البيانات الأساسية');

                    // ✅ إضافة: تحميل فوري لإعدادات النماذج (المواقع) بعد تحميل البيانات الأساسية
                    // هذا يضمن توفر المواقع فوراً عند فتح أي موديول يحتاجها
                    if (typeof Permissions !== 'undefined' && typeof Permissions.initFormSettingsState === 'function') {
                        try {
                            Permissions.initFormSettingsState().then(async () => {
                                if (AppState.debugMode) {
                                    Utils.safeLog('✅ تم تحميل إعدادات النماذج (المواقع) بعد تسجيل الدخول');
                                }
                                
                                // ✅ إصلاح: تحميل إعدادات الشركة (بما في ذلك الشعار) مباشرة بعد initFormSettingsState
                                // هذا يضمن تحميل الشعار بشكل تلقائي بعد تسجيل الدخول
                                // forceReload = true في أول مرة بعد تسجيل الدخول لضمان التحديث
                                if (typeof DataManager !== 'undefined' && DataManager.loadCompanySettings) {
                                    try {
                                        // في أول مرة بعد تسجيل الدخول، نحمل من قاعدة البيانات
                                        // في المرات القادمة، سيتم استخدام localStorage
                                        await DataManager.loadCompanySettings(true); // forceReload = true
                                        if (AppState.debugMode) {
                                            Utils.safeLog('✅ تم تحميل إعدادات الشركة والشعار بعد تسجيل الدخول');
                                        }
                                    } catch (settingsError) {
                                        Utils.safeWarn('⚠️ فشل تحميل إعدادات الشركة بعد تسجيل الدخول:', settingsError);
                                    }
                                }
                            }).catch((error) => {
                                Utils.safeWarn('⚠️ فشل تحميل إعدادات النماذج بعد تسجيل الدخول:', error);
                            });
                        } catch (error) {
                            Utils.safeWarn('⚠️ خطأ في تحميل إعدادات النماذج:', error);
                        }
                    } else {
                        // ✅ إصلاح: إذا لم يكن initFormSettingsState متاحاً، نحمّل إعدادات الشركة مباشرة
                        // forceReload = true في أول مرة بعد تسجيل الدخول
                        if (typeof DataManager !== 'undefined' && DataManager.loadCompanySettings) {
                            try {
                                await DataManager.loadCompanySettings(true); // forceReload = true
                                if (AppState.debugMode) {
                                    Utils.safeLog('✅ تم تحميل إعدادات الشركة والشعار بعد تسجيل الدخول');
                                }
                            } catch (settingsError) {
                                Utils.safeWarn('⚠️ فشل تحميل إعدادات الشركة بعد تسجيل الدخول:', settingsError);
                            }
                        }
                    }

                    // ✅ الخطوة 4: تحميل بيانات الموديولات الأخرى بشكل متسلسل حسب الصلاحيات
                    // هذا يتم في الخلفية بدون تأخير لعملية تسجيل الدخول
                    this.loadModulesDataSequentially().catch(err => {
                        Utils.safeWarn('⚠️ فشل تحميل بيانات الموديولات:', err);
                    });
                } else {
                    // إذا لم يكن قاعدة البيانات مفعّل، نستخدم البيانات المحلية فقط
                    Utils.safeLog('ℹ️ قاعدة البيانات غير مفعّل - استخدام البيانات المحلية فقط');
                }
            } catch (err) {
                Utils.safeError('❌ خطأ عام في تحميل البيانات:', err);
                
                // ✅ معالجة الأخطاء الشاملة: التأكد من استخدام البيانات المحلية عند الفشل الكامل
                if (typeof DataManager !== 'undefined' && DataManager.load) {
                    try {
                        await DataManager.load();
                        Utils.safeLog('✅ تم تحميل البيانات المحلية كـ fallback بعد الخطأ');
                    } catch (loadError) {
                        Utils.safeError('❌ فشل تحميل البيانات المحلية أيضاً:', loadError);
                        
                        // إظهار رسالة للمستخدم في حالة الفشل الكامل
                        if (typeof Notification !== 'undefined') {
                            Notification.error('تعذر تحميل البيانات. يرجى تحديث الصفحة والمحاولة مرة أخرى.', 8000);
                        }
                    }
                }
            }
        })();

        // إرسال حدث نجاح تسجيل الدخول لتحديث عدد تسجيلات الدخول في الفوتر
        try {
            const loginSuccessEvent = new CustomEvent('loginSuccess', {
                detail: {
                    user: AppState.currentUser,
                    loginTime: loginTime
                }
            });
            document.dispatchEvent(loginSuccessEvent);
        } catch (e) {
            // تجاهل الأخطاء في حالة عدم دعم CustomEvent
        }

        // إرجاع معلومات عن حالة تغيير كلمة المرور
        return {
            success: true,
            requiresPasswordChange: requiresPasswordChange,
            isFirstLogin: isFirstLogin
        };
    },
    logout() {
        // ✅ إيقاف المزامنة التلقائية الدورية عند تسجيل الخروج
        if (typeof window.UI !== 'undefined' && typeof window.UI.stopBackgroundSync === 'function') {
            window.UI.stopBackgroundSync();
        }

        // إيقاف نظام عدم النشاط
        if (typeof InactivityManager !== 'undefined') {
            InactivityManager.stop();
        }

        // إيقاف نظام مراقبة الاتصال
        if (typeof ConnectionMonitor !== 'undefined' && ConnectionMonitor.stop) {
            try {
                ConnectionMonitor.stop();
                Utils.safeLog('✅ تم إيقاف نظام مراقبة الاتصال');
            } catch (monitorError) {
                Utils.safeWarn('⚠️ فشل إيقاف نظام مراقبة الاتصال:', monitorError);
            }
        }

        // تسجيل حركة تسجيل الخروج قبل حذف بيانات المستخدم
        if (AppState.currentUser && typeof UserActivityLog !== 'undefined') {
            const userName = AppState.currentUser.name || AppState.currentUser.email || 'مستخدم غير معروف';
            UserActivityLog.log('logout', 'Authentication', null, {
                description: `تسجيل خروج المستخدم ${userName}`
            }).catch(() => { }); // لا ننتظر حتى لا نبطئ عملية تسجيل الخروج
        }

        // تحديث حالة المستخدم إلى غير متصل
        if (AppState.currentUser && AppState.currentUser.email) {
            const users = AppState.appData.users || [];
            const userIndex = users.findIndex(u => u.email && u.email.toLowerCase() === AppState.currentUser.email.toLowerCase());
            if (userIndex !== -1) {
                users[userIndex].isOnline = false;
                users[userIndex].lastLogout = new Date().toISOString();
                users[userIndex].activeSessionId = null; // مسح معرف الجلسة عند تسجيل الخروج
                AppState.appData.users = users;
                
                if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                    window.DataManager.save();
                }
                
                // مزامنة lastLogout مع قاعدة البيانات في الخلفية
                if (typeof GoogleIntegration !== 'undefined' && GoogleIntegration.sendToAppsScript && 
                    AppState.googleConfig?.appsScript?.enabled) {
                    const userId = users[userIndex].id;
                    const updateData = {
                        lastLogout: users[userIndex].lastLogout,
                        isOnline: false,
                        activeSessionId: null // مسح معرف الجلسة في قاعدة البيانات
                    };
                    
                    // تحديث في قاعدة البيانات بشكل غير متزامن (لا ننتظر حتى لا نبطئ تسجيل الخروج)
                    GoogleIntegration.sendToAppsScript('updateUser', {
                        userId: userId,
                        updateData: updateData
                    }).then(updateResult => {
                        if (updateResult && updateResult.success) {
                            Utils.safeLog('✅ تم مزامنة lastLogout و activeSessionId مع قاعدة البيانات بنجاح');
                        } else {
                            Utils.safeWarn('⚠️ فشل مزامنة lastLogout مع قاعدة البيانات:', updateResult?.message);
                        }
                    }).catch(updateError => {
                        Utils.safeWarn('⚠️ خطأ في مزامنة lastLogout مع قاعدة البيانات:', updateError);
                        // لا نوقف تسجيل الخروج حتى لو فشلت المزامنة
                    });
                }
            
            // تحديث جدول المستخدمين فوراً إذا كان مفتوحاً
                if (typeof Users !== 'undefined' && typeof Users.updateUserStatus === 'function') {
                    setTimeout(() => {
                        Users.updateUserStatus(users[userIndex].id);
                    }, 100);
                }
                
                // تحديث زر حالة الاتصال في الشريط الجانبي
                if (typeof UI !== 'undefined' && typeof UI.updateUserConnectionStatus === 'function') {
                    UI.updateUserConnectionStatus();
                }
                
                // إيقاف التحديث التلقائي لحالة الاتصال
                if (typeof UI !== 'undefined' && typeof UI.stopAutoRefreshConnectionStatus === 'function') {
                    UI.stopAutoRefreshConnectionStatus();
                }
            }
        }

        AppState.currentUser = null;
        
        // مسح جميع بيانات الجلسة
        try {
            localStorage.removeItem('hse_remember_user');
            localStorage.removeItem('hse_session_backup');
            sessionStorage.removeItem('hse_current_session');
            sessionStorage.removeItem('hse_current_section');
            sessionStorage.removeItem('hse_session_id'); // مسح معرف الجلسة
            Utils.safeLog('✅ تم مسح جميع بيانات الجلسة بما في ذلك معرف الجلسة');
        } catch (e) {
            Utils.safeWarn('⚠️ فشل مسح بعض بيانات الجلسة:', e);
        }
        
        if (typeof Notification !== 'undefined') {
            Notification.info('تم تسجيل الخروج بنجاح');
        }
        
        if (typeof UI !== 'undefined') {
            UI.toggleSidebar(false);
            UI.updateUserProfile();
            UI.showLoginScreen();
        }
    },

    /**
     * التحقق من المستخدم المحوظ
     */
    checkRememberedUser() {
        try {
            // استعادة الجلسة من localStorage إلى sessionStorage إذا كانت فارغة (ضمان العمل بعد إعادة التحميل)
            let sessionData = sessionStorage.getItem('hse_current_session');
            if (!sessionData) {
                const fromStorage = localStorage.getItem('hse_session_backup') || localStorage.getItem('hse_remember_user');
                if (fromStorage) {
                    try {
                        const data = JSON.parse(fromStorage);
                        if (data && data.email) {
                            sessionStorage.setItem('hse_current_session', fromStorage);
                            if (data.sessionId) sessionStorage.setItem('hse_session_id', data.sessionId);
                            sessionData = fromStorage;
                        }
                    } catch (e) { Utils.safeWarn('⚠️ فشل استعادة الجلسة من localStorage في checkRememberedUser:', e); }
                }
            }
            if (typeof AppState === 'undefined' || !AppState.appData) {
                return false;
            }
            // التحقق من sessionStorage (أو ما تم استعادته من localStorage)
            if (sessionData) {
                try {
                    const user = JSON.parse(sessionData);
                    // التحقق من أن البيانات صحيحة وأن المستخدم ما زال موجوداً
                    if (user && user.email) {
                        // التحقق من وجود المستخدم ي قاعدة البيانات
                        const email = user.email.toLowerCase();
                        // تم إزالة validUsers لأسباب أمنية - البحث في قاعدة البيانات فقط
                        const users = AppState.appData.users || [];
                        let foundUser = users.find(u => u.email && u.email.toLowerCase() === email);

                        // فقط إذا وُجد المستخدم وكان غير مفعّل، نمسح الجلسة
                        if (foundUser && foundUser.active === false) {
                            // المستخدم غير معّل
                            sessionStorage.removeItem('hse_current_session');
                            localStorage.removeItem('hse_remember_user');
                            sessionStorage.removeItem('hse_session_id');
                            AppState.isPageRefresh = false;
                            return false;
                        }

                        // التحقق من معرف الجلسة - إذا فُقد بعد إعادة التحميل نعيد إنشاءه ونقبل الاستعادة (نفس التبويب)
                        let currentSessionId = sessionStorage.getItem('hse_session_id');
                        const sessionIdWasMissing = !currentSessionId;
                        if (!currentSessionId) {
                            const timestamp = Date.now();
                            const random = Math.random().toString(36).substring(2, 15);
                            const userAgent = navigator.userAgent.substring(0, 50);
                            const userAgentHash = userAgent.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0).toString(36);
                            currentSessionId = `SESS_${timestamp}_${random}_${userAgentHash}`;
                            sessionStorage.setItem('hse_session_id', currentSessionId);
                        }
                        const isAdminRestore = foundUser && (foundUser.role === 'admin' || (foundUser.role && String(foundUser.role).includes('مدير')));
                        // التحقق من "جهاز آخر" فقط عندما كان معرف الجلسة موجوداً (لا بعد إعادة تحميل نفس الصفحة)
                        if (foundUser && foundUser.isOnline === true && foundUser.activeSessionId && !isAdminRestore && !sessionIdWasMissing) {
                            if (foundUser.activeSessionId !== currentSessionId) {
                                Utils.safeWarn('⚠️ المستخدم متصل من جهاز آخر - لا يمكن استعادة الجلسة');
                            sessionStorage.removeItem('hse_current_session');
                            localStorage.removeItem('hse_remember_user');
                            localStorage.removeItem('hse_session_backup');
                            sessionStorage.removeItem('hse_session_id');
                            AppState.isPageRefresh = false;
                            return false;
                        }
                        }

                        // التحقق من معرف الجلسة فقط عندما لم نكن قد أعدنا إنشاءه (بعد إعادة التحميل لا نلغي الجلسة بسبب اختلاف المؤقت)
                        if (!sessionIdWasMissing && user.sessionId && currentSessionId && user.sessionId !== currentSessionId) {
                            Utils.safeWarn('⚠️ معرف الجلسة غير متطابق - مسح الجلسة القديمة');
                            sessionStorage.removeItem('hse_current_session');
                            localStorage.removeItem('hse_remember_user');
                            localStorage.removeItem('hse_session_backup');
                            AppState.isPageRefresh = false;
                            return false;
                        }

                        // نقبل المستخدم حتى لو لم نجده في قاعدة البيانات
                        // لأنه قد يكون هناك تأخير في تحميل البيانات من قاعدة البيانات
                        if (foundUser) {
                            // استخدام بيانات المستخدم الكاملة من قاعدة البيانات
                            // ✅ ضمان name صحيح حتى في الاستعادة
                            const mergedName = (foundUser.name || foundUser.displayName || '').trim() || user.email || user.name || '';
                            
                            AppState.currentUser = {
                                ...user,
                                ...foundUser,
                                name: mergedName,
                                passwordHash: foundUser.passwordHash || user.passwordHash,
                                password: '***', // إخفاء كلمة المرور
                                loginTime: user.loginTime || AppState.currentUser?.loginTime, // الحفاظ على وقت تسجيل الدخول
                                postLoginPolicySeenAt: foundUser.postLoginPolicySeenAt || user.postLoginPolicySeenAt // عدم إظهار السياسة مرة أخرى عند التحديث
                            };
                            
                            console.log('✅ [AUTH] AppState.currentUser.name بعد الاستعادة (sessionStorage):', AppState.currentUser.name);
                            
                            // ✅ إصلاح: تحديث الجلسة بالبيانات الجديدة من قاعدة البيانات
                            this.updateUserSession();
                        } else {
                            // استخدام بيانات المستخدم من الجلسة المحفوظة
                            AppState.currentUser = {
                                ...user,
                                name: (user.name || user.displayName || '').trim() || user.email || user.id || '',
                                postLoginPolicySeenAt: user.postLoginPolicySeenAt // الحفاظ على حالة اطّلاع السياسة من الجلسة
                            };
                            Utils.safeLog('⚠️ استخدام بيانات المستخدم من الجلسة (لم يُعثر عليه في قاعدة البيانات بعد)');
                            
                            // ✅ إصلاح: محاولة تحديث الجلسة بعد تحميل البيانات (إذا لم تكن محملة بعد)
                            // نضيف مستمع لتحديث الجلسة عندما يتم تحميل بيانات المستخدمين
                            if (!AppState._sessionUpdateScheduled) {
                                AppState._sessionUpdateScheduled = true;
                                let retryCount = 0;
                                const maxRetries = 5; // الحد الأقصى للمحاولات
                                
                                const checkAndUpdateSession = () => {
                                    retryCount++;
                                    
                                    // ✅ إصلاح: التحقق من عدم تجاوز الحد الأقصى للمحاولات
                                    if (retryCount > maxRetries) {
                                        AppState._sessionUpdateScheduled = false;
                                        Utils.safeWarn('⚠️ تم تجاوز الحد الأقصى لمحاولات تحديث الجلسة');
                                        return;
                                    }
                                    
                                    const users = AppState.appData.users || [];
                                    const dbUser = users.find(u => u.email && u.email.toLowerCase() === user.email.toLowerCase());
                                    
                                    if (dbUser) {
                                        // تم العثور على المستخدم - تحديث الجلسة
                                        // ✅ إصلاح: الحفاظ على جميع البيانات المهمة من الجلسة الحالية
                                        const mergedName = (dbUser.name || dbUser.displayName || '').trim() || user.email || user.name || '';
                                        
                                        AppState.currentUser = {
                                            ...user, // الحفاظ على بيانات الجلسة الأصلية
                                            ...dbUser, // دمج بيانات قاعدة البيانات
                                            name: mergedName,
                                            passwordHash: dbUser.passwordHash || user.passwordHash,
                                            password: '***',
                                            loginTime: user.loginTime || AppState.currentUser?.loginTime, // الحفاظ على وقت تسجيل الدخول
                                            id: dbUser.id || user.id || AppState.currentUser?.id // الحفاظ على ID
                                        };
                                        
                                        console.log('✅ [AUTH] AppState.currentUser.name بعد التحديث التلقائي (sessionStorage):', AppState.currentUser.name);
                                        
                                        // تحديث الجلسة فقط إذا كانت هناك تغييرات فعلية
                                        this.updateUserSession();
                                        AppState._sessionUpdateScheduled = false;
                                        Utils.safeLog(`✅ تم تحديث الجلسة بعد تحميل بيانات المستخدمين (محاولة ${retryCount})`);
                                    } else {
                                        // لم يتم العثور بعد - إعادة المحاولة بعد قليل
                                        if (retryCount < maxRetries) {
                                            const delay = Math.min(1000 * retryCount, 3000); // زيادة التأخير تدريجياً (1s, 2s, 3s)
                                            setTimeout(checkAndUpdateSession, delay);
                                        } else {
                                            AppState._sessionUpdateScheduled = false;
                                            Utils.safeWarn('⚠️ لم يتم العثور على المستخدم في قاعدة البيانات بعد عدة محاولات');
                                        }
                                    }
                                };
                                
                                // محاولة فورية أولاً
                                setTimeout(checkAndUpdateSession, 500);
                            }
                        }
                        
                        // حفظ الجلسة مرة أخرى للتأكد من استمراريتها (مع postLoginPolicySeenAt لعدم إظهار السياسة عند التحديث)
                        const safeUserData = {
                            email: AppState.currentUser.email,
                            name: AppState.currentUser.name,
                            role: AppState.currentUser.role,
                            department: AppState.currentUser.department,
                            permissions: AppState.currentUser.permissions,
                            id: AppState.currentUser.id,
                            loginTime: AppState.currentUser.loginTime,
                            postLoginPolicySeenAt: AppState.currentUser.postLoginPolicySeenAt
                        };
                        sessionStorage.setItem('hse_current_session', JSON.stringify(safeUserData));
                        Utils.safeLog('✅ تم استعادة الجلسة من sessionStorage - المستخدم مسجل دخول');
                        return true;
                    }
                } catch (e) {
                    Utils.safeWarn('⚠️ خطأ في تحليل بيانات sessionStorage:', e);
                    // في حالة الخطأ، نحاول مسح الجلسة التالفة
                    try {
                        sessionStorage.removeItem('hse_current_session');
                        sessionStorage.removeItem('hse_session_id');
                        localStorage.removeItem('hse_session_backup');
                    } catch (clearError) {
                        Utils.safeWarn('⚠️ فشل مسح الجلسة التالفة:', clearError);
                    }
                }
            }

            // ثانياً: التحقق من localStorage (إذا كان اختار "تذكرني")
            const remembered = localStorage.getItem('hse_remember_user');
            if (remembered) {
                try {
                    const user = JSON.parse(remembered);
                    // التحقق من صحة البيانات وأن المستخدم ما زال موجوداً
                    if (user && user.email) {
                        const email = user.email.toLowerCase();
                        // تم إزالة validUsers لأسباب أمنية - البحث في قاعدة البيانات فقط
                        const users = AppState.appData.users || [];
                        let foundUser = users.find(u => u.email && u.email.toLowerCase() === email);

                        // فقط إذا وُجد المستخدم وكان غير مفعّل، نمسح الجلسة
                        if (foundUser && foundUser.active === false) {
                            localStorage.removeItem('hse_remember_user');
                            localStorage.removeItem('hse_session_backup');
                            sessionStorage.removeItem('hse_session_id');
                            AppState.isPageRefresh = false;
                            return false;
                        }

                        // التحقق من معرف الجلسة — إذا فُقد نعيد إنشاءه (إعادة تحميل نفس الصفحة)
                        let currentSessionIdLocal = sessionStorage.getItem('hse_session_id');
                        const sessionIdWasMissingLocal = !currentSessionIdLocal;
                        if (!currentSessionIdLocal) {
                            const timestamp = Date.now();
                            const random = Math.random().toString(36).substring(2, 15);
                            const userAgent = navigator.userAgent.substring(0, 50);
                            const userAgentHash = userAgent.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0).toString(36);
                            currentSessionIdLocal = `SESS_${timestamp}_${random}_${userAgentHash}`;
                            sessionStorage.setItem('hse_session_id', currentSessionIdLocal);
                        }
                        const isAdminRestoreLocal = foundUser && (foundUser.role === 'admin' || (foundUser.role && String(foundUser.role).includes('مدير')));
                        if (foundUser && foundUser.isOnline === true && foundUser.activeSessionId && !isAdminRestoreLocal && !sessionIdWasMissingLocal) {
                            if (foundUser.activeSessionId !== currentSessionIdLocal) {
                                Utils.safeWarn('⚠️ المستخدم متصل من جهاز آخر - لا يمكن استعادة الجلسة من localStorage');
                                localStorage.removeItem('hse_remember_user');
                                localStorage.removeItem('hse_session_backup');
                                sessionStorage.removeItem('hse_session_id');
                                AppState.isPageRefresh = false;
                                return false;
                            }
                        }

                        // عدم إلغاء الجلسة بسبب اختلاف sessionId عند الاستعادة بعد إعادة التحميل (sessionIdWasMissingLocal)
                        if (!sessionIdWasMissingLocal && user.sessionId && currentSessionIdLocal && user.sessionId !== currentSessionIdLocal) {
                            Utils.safeWarn('⚠️ معرف الجلسة في localStorage غير متطابق - مسح الجلسة القديمة');
                            localStorage.removeItem('hse_remember_user');
                            localStorage.removeItem('hse_session_backup');
                            AppState.isPageRefresh = false;
                            return false;
                        }

                        // نقبل المستخدم حتى لو لم نجده في قاعدة البيانات
                        if (foundUser) {
                            // استخدام بيانات المستخدم الكاملة من قاعدة البيانات
                            // ✅ الحل الجذري: التأكد من وجود name صحيح
                            // ✅ إصلاح: استخدام الاسم فقط (وليس email)
                            let mergedName = (foundUser.name || foundUser.displayName || '').trim();
                            
                            // ✅ إذا كان mergedName فارغ أو "النظام"، نستخدم "مستخدم" كبديل
                            if (!mergedName || mergedName === 'النظام' || mergedName === '') {
                                mergedName = 'مستخدم';
                            }
                            
                            AppState.currentUser = {
                                ...user,
                                ...foundUser,
                                name: mergedName, // ✅ استخدام mergedName
                                passwordHash: foundUser.passwordHash || user.passwordHash,
                                password: '***', // إخفاء كلمة المرور
                                loginTime: user.loginTime || AppState.currentUser?.loginTime, // الحفاظ على وقت تسجيل الدخول
                                postLoginPolicySeenAt: foundUser.postLoginPolicySeenAt || user.postLoginPolicySeenAt // عدم إظهار السياسة مرة أخرى عند التحديث
                            };
                            
                            console.log('✅ [AUTH] AppState.currentUser.name بعد الاستعادة (localStorage):', AppState.currentUser.name);
                            
                            // ✅ إصلاح: تحديث الجلسة بالبيانات الجديدة من قاعدة البيانات
                            this.updateUserSession();
                        } else {
                            // استخدام بيانات المستخدم من localStorage
                            AppState.currentUser = {
                                ...user,
                                name: (user.name || user.displayName || '').trim() || user.email || user.id || '',
                                postLoginPolicySeenAt: user.postLoginPolicySeenAt // الحفاظ على حالة اطّلاع السياسة
                            };
                            Utils.safeLog('⚠️ استخدام بيانات المستخدم من localStorage (لم يُعثر عليه في قاعدة البيانات بعد)');
                            
                            // ✅ إصلاح: محاولة تحديث الجلسة بعد تحميل البيانات (إذا لم تكن محملة بعد)
                            // استخدام نفس آلية retry المحسّنة
                            if (!AppState._sessionUpdateScheduled) {
                                AppState._sessionUpdateScheduled = true;
                                let retryCount = 0;
                                const maxRetries = 5; // الحد الأقصى للمحاولات
                                
                                const checkAndUpdateSession = () => {
                                    retryCount++;
                                    
                                    // ✅ إصلاح: التحقق من عدم تجاوز الحد الأقصى للمحاولات
                                    if (retryCount > maxRetries) {
                                        AppState._sessionUpdateScheduled = false;
                                        Utils.safeWarn('⚠️ تم تجاوز الحد الأقصى لمحاولات تحديث الجلسة');
                                        return;
                                    }
                                    
                                    const users = AppState.appData.users || [];
                                    const dbUser = users.find(u => u.email && u.email.toLowerCase() === user.email.toLowerCase());
                                    
                                    if (dbUser) {
                                        // تم العثور على المستخدم - تحديث الجلسة
                                        // ✅ إصلاح: الحفاظ على جميع البيانات المهمة من الجلسة الحالية
                                        const mergedName = (dbUser.name || dbUser.displayName || '').trim() || user.email || user.name || '';
                                        
                                        AppState.currentUser = {
                                            ...user, // الحفاظ على بيانات الجلسة الأصلية
                                            ...dbUser, // دمج بيانات قاعدة البيانات
                                            name: mergedName,
                                            passwordHash: dbUser.passwordHash || user.passwordHash,
                                            password: '***',
                                            loginTime: user.loginTime || AppState.currentUser?.loginTime, // الحفاظ على وقت تسجيل الدخول
                                            id: dbUser.id || user.id || AppState.currentUser?.id, // الحفاظ على ID
                                            postLoginPolicySeenAt: user.postLoginPolicySeenAt || dbUser.postLoginPolicySeenAt // عدم إظهار السياسة مرة أخرى بعد إعادة التحميل
                                        };
                                        
                                        console.log('✅ [AUTH] AppState.currentUser.name بعد التحديث التلقائي (localStorage):', AppState.currentUser.name);
                                        
                                        // تحديث الجلسة فقط إذا كانت هناك تغييرات فعلية
                                        this.updateUserSession();
                                        AppState._sessionUpdateScheduled = false;
                                        Utils.safeLog(`✅ تم تحديث الجلسة بعد تحميل بيانات المستخدمين (محاولة ${retryCount})`);
                                    } else {
                                        // لم يتم العثور بعد - إعادة المحاولة بعد قليل
                                        if (retryCount < maxRetries) {
                                            const delay = Math.min(1000 * retryCount, 3000); // زيادة التأخير تدريجياً (1s, 2s, 3s)
                                            setTimeout(checkAndUpdateSession, delay);
                                        } else {
                                            AppState._sessionUpdateScheduled = false;
                                            Utils.safeWarn('⚠️ لم يتم العثور على المستخدم في قاعدة البيانات بعد عدة محاولات');
                                        }
                                    }
                                };
                                
                                // محاولة فورية أولاً
                                setTimeout(checkAndUpdateSession, 500);
                            }
                        }
                        
                        // حفظ في sessionStorage أيضاً (مع postLoginPolicySeenAt لعدم إظهار السياسة مرة أخرى عند إعادة التحميل)
                        const safeUserData = {
                            email: AppState.currentUser.email,
                            name: AppState.currentUser.name,
                            role: AppState.currentUser.role,
                            department: AppState.currentUser.department,
                            permissions: AppState.currentUser.permissions,
                            id: AppState.currentUser.id,
                            loginTime: AppState.currentUser.loginTime,
                            postLoginPolicySeenAt: AppState.currentUser.postLoginPolicySeenAt
                        };
                        sessionStorage.setItem('hse_current_session', JSON.stringify(safeUserData));
                        Utils.safeLog('✅ تم استعادة الجلسة من localStorage - المستخدم مسجل دخول');
                        return true;
                    }
                } catch (e) {
                    Utils.safeWarn('⚠️ خطأ في تحليل بيانات localStorage:', e);
                    // لا نمسح الجلسة هنا - قد تكون مشكلة مؤقتة
                }
            }
        } catch (error) {
            Utils.safeError('خطأ في التحقق من المستخدم:', error);
        }
        AppState.isPageRefresh = false;
        return false;
    },

    /**
     * تحديث جلسة المستخدم الحالي (مفيد عند تحديث الصلاحيات)
     * يقوم بتحديث sessionStorage و localStorage بالبيانات الجديدة من قاعدة البيانات
     * ✅ إصلاح: منع الاستدعاءات المتكررة غير الضرورية
     */
    updateUserSession() {
        if (!AppState.currentUser || !AppState.currentUser.email) {
            Utils.safeWarn('⚠️ لا يوجد مستخدم حالي لتحديث الجلسة');
            return false;
        }

        // ✅ إصلاح: منع الاستدعاءات المتكررة غير الضرورية
        const now = Date.now();
        const lastUpdate = AppState._lastSessionUpdate || 0;
        const UPDATE_THROTTLE = 500; // 500ms - الحد الأدنى بين التحديثات
        
        if (now - lastUpdate < UPDATE_THROTTLE) {
            if (AppState.debugMode) {
                Utils.safeLog('ℹ️ تم تخطي تحديث الجلسة (throttle)');
            }
            return false;
        }
        
        // إذا كان هناك تحديث قيد التنفيذ، ننتظر
        if (AppState._sessionUpdateInProgress) {
            if (AppState.debugMode) {
                Utils.safeLog('ℹ️ تحديث الجلسة قيد التنفيذ - انتظار...');
            }
            return false;
        }
        
        AppState._sessionUpdateInProgress = true;
        AppState._lastSessionUpdate = now;

        try {
            // البحث عن المستخدم في قاعدة البيانات (بالبريد أو id إذا كان يشبه البريد)
            const email = (AppState.currentUser.email || AppState.currentUser.id || '').toString().toLowerCase().trim();
            const users = AppState.appData.users || [];
            let dbUser = users.find(u => (u.email && u.email.toString().toLowerCase().trim() === email) || (u.id && /@/.test(String(u.id)) && u.id.toString().toLowerCase().trim() === email));

            if (!dbUser) {
                Utils.safeWarn('⚠️ المستخدم غير موجود في قاعدة البيانات');
                AppState._sessionUpdateInProgress = false;
                return false;
            }

            // ✅ إصلاح: تطبيع الصلاحيات قبل التحديث
            const normalizedPermissions = typeof Permissions !== 'undefined' && typeof Permissions.normalizePermissions === 'function'
                ? Permissions.normalizePermissions(dbUser.permissions)
                : (dbUser.permissions || {});
            
            // ✅ إصلاح: التأكد من أن الصلاحيات المطبعة هي كائن صالح
            const finalPermissions = (normalizedPermissions && typeof normalizedPermissions === 'object' && !Array.isArray(normalizedPermissions))
                ? normalizedPermissions
                : (dbUser.permissions && typeof dbUser.permissions === 'object' && !Array.isArray(dbUser.permissions))
                    ? dbUser.permissions
                    : {};
            
            // تحديث AppState.currentUser بالبيانات الجديدة من قاعدة البيانات
            // ✅ الحل الجذري: التأكد من وجود name صحيح عند التحديث
            // ✅ إصلاح: استخدام الاسم فقط من قاعدة البيانات (وليس email)
            let updatedName = (dbUser.name || dbUser.displayName || '').trim();
            
            // ✅ إذا كان updatedName فارغ أو "النظام"، نستخدم AppState.currentUser.name
            if (!updatedName || updatedName === 'النظام' || updatedName === '') {
                updatedName = (AppState.currentUser.name || '').toString().trim();
            }
            
            // ✅ إذا كان updatedName لا يزال فارغ، نستخدم "مستخدم" كبديل
            if (!updatedName || updatedName === 'النظام' || updatedName === '') {
                updatedName = 'مستخدم';
            }
            
            AppState.currentUser = {
                ...AppState.currentUser,
                name: updatedName, // ✅ استخدام updatedName بدلاً من dbUser.name مباشرة
                role: dbUser.role || AppState.currentUser.role,
                department: dbUser.department || AppState.currentUser.department,
                permissions: finalPermissions, // استخدام الصلاحيات المطبعة والمدققة
                active: dbUser.active !== undefined ? dbUser.active : AppState.currentUser.active,
                photo: dbUser.photo || AppState.currentUser.photo,
                id: dbUser.id || AppState.currentUser.id, // الحفاظ على ID
                loginTime: AppState.currentUser.loginTime // الحفاظ على وقت تسجيل الدخول
            };
            
            console.log('✅ [AUTH] AppState.currentUser.name بعد التحديث:', AppState.currentUser.name);

            // ✅ إصلاح: حفظ الجلسة بشكل آمن (بدون passwordHash)
            // التأكد من أن الصلاحيات هي كائن صالح قبل الحفظ
            const permissionsToSave = (AppState.currentUser.permissions && 
                                       typeof AppState.currentUser.permissions === 'object' && 
                                       !Array.isArray(AppState.currentUser.permissions))
                ? AppState.currentUser.permissions
                : {};
            
            const safeUserData = {
                email: AppState.currentUser.email,
                name: AppState.currentUser.name,
                role: AppState.currentUser.role,
                department: AppState.currentUser.department,
                permissions: permissionsToSave, // استخدام الصلاحيات المدققة
                id: AppState.currentUser.id,
                loginTime: AppState.currentUser.loginTime,
                postLoginPolicySeenAt: AppState.currentUser.postLoginPolicySeenAt // لعدم إظهار السياسة عند إعادة التحميل
            };

            // تحديث sessionStorage
            sessionStorage.setItem('hse_current_session', JSON.stringify(safeUserData));
            Utils.safeLog('✅ تم تحديث الجلسة في sessionStorage');

            // تحديث النسخة الاحتياطية للجلسة (لاستعادة بعد إعادة التحميل)
            try {
                const sessionId = sessionStorage.getItem('hse_session_id');
                if (sessionId) {
                    localStorage.setItem('hse_session_backup', JSON.stringify({
                        ...safeUserData,
                        sessionId: sessionId
                    }));
                }
            } catch (e) { /* ignore */ }

            // تحديث localStorage إذا كان موجوداً (تذكرني)
            const remembered = localStorage.getItem('hse_remember_user');
            if (remembered) {
                localStorage.setItem('hse_remember_user', JSON.stringify(safeUserData));
                Utils.safeLog('✅ تم تحديث الجلسة في localStorage');
            }

            // تحديث صورة المستخدم في الواجهة
            if (typeof UI !== 'undefined' && typeof UI.updateUserProfilePhoto === 'function') {
                UI.updateUserProfilePhoto();
            }

            // تحديث القائمة الجانبية حسب الصلاحيات الجديدة
            if (typeof Permissions !== 'undefined' && typeof Permissions.updateNavigation === 'function') {
                Permissions.updateNavigation();
                Utils.safeLog('✅ تم تحديث القائمة الجانبية حسب الصلاحيات الجديدة');
            }

            AppState._sessionUpdateInProgress = false;
            return true;
        } catch (error) {
            Utils.safeError('❌ خطأ في تحديث الجلسة:', error);
            AppState._sessionUpdateInProgress = false;
            return false;
        }
    },

    /**
     * تغيير كلمة المرور
     */
    async changePassword(email, currentPassword, newPassword) {
        Utils.safeLog('🔑 بدء تغيير كلمة المرور:', { email, currentPasswordLength: currentPassword?.length, newPasswordLength: newPassword?.length });

        if (!email || !currentPassword || !newPassword) {
            Utils.safeWarn(' بيانات ناقصة');
            return false;
        }

        email = email.trim().toLowerCase();

        // البحث عن المستخدم في قاعدة البيانات
        const user = AppState.appData.users.find(u => {
            if (!u || !u.email) return false;
            return u.email.toLowerCase().trim() === email;
        });

        if (!user) {
            Utils.safeWarn(' المستخدم غير موجود:', email);
            return false;
        }

        // إزالة دعم كلمات المرور النصية - الأمان يتطلب التشفير فقط
        const storedHash = (user.passwordHash || '').trim();

        if (!storedHash || storedHash === '***' || !Utils.isSha256Hex(storedHash)) {
            Utils.safeWarn('⚠️ المستخدم لديه كلمة مرور غير مشفرة - يجب إعادة تعيينها');
            Notification.error('يجب إعادة تعيين كلمة المرور. يرجى الاتصال بالمدير.');
            return false;
        }

        // التحقق من كلمة المرور المشفرة فقط
        const currentHash = await Utils.hashPassword(currentPassword);
        const isValidPassword = currentHash.toLowerCase() === storedHash.toLowerCase();

        if (!isValidPassword) {
            Utils.safeWarn(' كلمة المرور الحالية غير صحيحة');
            return false;
        }

        // تحديث كلمة المرور
        const newHash = await Utils.hashPassword(newPassword);
        user.password = '***';
        user.passwordHash = newHash;
        user.passwordChanged = true;
        user.forcePasswordChange = false;
        user.updatedAt = new Date().toISOString();

        if (AppState.currentUser && AppState.currentUser.email === email) {
            AppState.currentUser.passwordHash = newHash;
            AppState.currentUser.passwordChanged = true;
            AppState.currentUser.forcePasswordChange = false;
        }

        // حظ ي قاعدة البيانات
        // حفظ البيانات باستخدام window.DataManager
        if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
            await window.DataManager.save();
        } else {
            Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
        }

        // حفظ في قاعدة البيانات إذا كان معّلاً
        if (AppState.googleConfig && AppState.googleConfig.appsScript && AppState.googleConfig.appsScript.enabled && AppState.googleConfig.sheets && AppState.googleConfig.sheets.spreadsheetId) {
            try {
                await GoogleIntegration.autoSave('Users', AppState.appData.users);
                Utils.safeLog('✅ تم حفظ كلمة المرور الجديدة في قاعدة البيانات');
            } catch (error) {
                Utils.safeWarn('⚠ فشل حظ كلمة المرور ي قاعدة البيانات:', error);
            }
        }

        Utils.safeLog('✅ تم تغيير كلمة المرور بنجاح');
        return true;
    },

    /**
     * تحميل بيانات الموديولات بشكل متسلسل حسب الصلاحيات
     * يتم تحميل البيانات بشكل متتالي لضمان عدم فقدان أي بيانات
     */
    async loadModulesDataSequentially() {
        const hasBackend = typeof GoogleIntegration !== 'undefined' &&
            (AppState.useSupabaseBackend === true || AppState.googleConfig?.appsScript?.enabled);
        if (!hasBackend) {
            return;
        }

        try {
            Utils.safeLog('🔄 بدء تحميل بيانات الموديولات حسب الصلاحيات...');

            // الحصول على الموديولات المسموح بها للمستخدم
            const accessibleModules = typeof Permissions !== 'undefined' && typeof Permissions.getAccessibleModules === 'function'
                ? Permissions.getAccessibleModules(true)
                : [];

            // إذا كان المستخدم admin، نحمّل جميع الموديولات
            const isAdmin = AppState.currentUser?.role === 'admin';
            const modulesToLoad = isAdmin ? [
                'incidents', 'nearmiss', 'ptw', 'training', 'clinic', 'fire-equipment',
                'ppe', 'violations', 'behavior-monitoring', 'chemical-safety',
                'daily-observations', 'iso', 'emergency', 'safety-budget',
                'action-tracking', 'change-management', 'hse', 'safety-performance-kpis', 'sustainability',
                'risk-assessment', 'legal-documents', 'safety-health-management',
                'sop-jha', 'periodic-inspections'
            ] : accessibleModules;

            if (modulesToLoad.length === 0) {
                Utils.safeLog('ℹ️ لا توجد موديولات مسموح بها للمستخدم');
                return;
            }

            // خريطة الموديولات وأوراق قاعدة البيانات الخاصة بها
            const moduleSheetsMap = {
                'incidents': ['Incidents'],
                'nearmiss': ['NearMiss'],
                'ptw': ['PTW', 'PTWRegistry'],
                'training': ['Training'],
                'clinic': ['ClinicVisits', 'Medications', 'SickLeave', 'Injuries', 'ClinicInventory'],
                'fire-equipment': ['FireEquipment', 'FireEquipmentAssets', 'FireEquipmentInspections'],
                'ppe': ['PPE'],
                'violations': ['Violations', 'ViolationTypes', 'Blacklist_Register'],
                'behavior-monitoring': ['BehaviorMonitoring'],
                'chemical-safety': ['ChemicalSafety', 'Chemical_Register'],
                'daily-observations': ['DailyObservations'],
                'iso': ['ISODocuments', 'ISOProcedures', 'ISOForms', 'HSEAudits'],
                'emergency': ['EmergencyAlerts', 'EmergencyPlans'],
                'safety-budget': ['SafetyBudgets', 'SafetyBudgetTransactions'],
                'action-tracking': ['ActionTrackingRegister', 'HSECorrectiveActions', 'HSENonConformities', 'HSEObjectives'],
                'change-management': ['ChangeRequests'],
                'hse': ['HSENonConformities', 'HSECorrectiveActions'],
                'safety-performance-kpis': ['SafetyPerformanceKPIs', 'SafetyTeamKPIs'],
                'sustainability': ['Sustainability', 'EnvironmentalAspects', 'EnvironmentalMonitoring', 'CarbonFootprint', 'WasteManagement', 'EnergyEfficiency', 'WaterManagement', 'RecyclingPrograms'],
                'risk-assessment': ['RiskAssessments', 'HSERiskAssessments'],
                'legal-documents': ['LegalDocuments'],
                'safety-health-management': ['SafetyTeamMembers', 'SafetyOrganizationalStructure', 'SafetyJobDescriptions', 'SafetyTeamKPIs', 'SafetyTeamAttendance', 'SafetyTeamLeaves', 'SafetyTeamTasks'],
                'sop-jha': ['SOPJHA'],
                'periodic-inspections': ['PeriodicInspectionCategories', 'PeriodicInspectionRecords', 'PeriodicInspectionSchedules', 'PeriodicInspectionChecklists']
            };

            // خريطة أوراق قاعدة البيانات إلى مفاتيح AppState
            const sheetToKeyMap = {
                'Incidents': 'incidents',
                'NearMiss': 'nearMiss',
                'PTW': 'ptw',
                'PTWRegistry': 'ptwRegistry',
                'Training': 'training',
                'ClinicVisits': 'clinicVisits',
                'Medications': 'medications',
                'SickLeave': 'sickLeave',
                'Injuries': 'injuries',
                'ClinicInventory': 'clinicInventory',
                'FireEquipment': 'fireEquipment',
                'FireEquipmentAssets': 'fireEquipmentAssets',
                'FireEquipmentInspections': 'fireEquipmentInspections',
                'PPE': 'ppe',
                'Violations': 'violations',
                'ViolationTypes': 'violationTypes',
                'Blacklist_Register': 'blacklistRegister',
                'BehaviorMonitoring': 'behaviorMonitoring',
                'ChemicalSafety': 'chemicalSafety',
                'Chemical_Register': 'chemicalRegister',
                'DailyObservations': 'dailyObservations',
                'ISODocuments': 'isoDocuments',
                'ISOProcedures': 'isoProcedures',
                'ISOForms': 'isoForms',
                'HSEAudits': 'hseAudits',
                'EmergencyAlerts': 'emergencyAlerts',
                'EmergencyPlans': 'emergencyPlans',
                'SafetyBudgets': 'safetyBudgets',
                'SafetyBudgetTransactions': 'safetyBudgetTransactions',
                'ActionTrackingRegister': 'actionTrackingRegister',
                'ChangeRequests': 'changeRequests',
                'HSECorrectiveActions': 'hseCorrectiveActions',
                'HSENonConformities': 'hseNonConformities',
                'HSEObjectives': 'hseObjectives',
                'SafetyPerformanceKPIs': 'safetyPerformanceKPIs',
                'SafetyTeamKPIs': 'safetyTeamKPIs',
                'Sustainability': 'sustainability',
                'EnvironmentalAspects': 'environmentalAspects',
                'EnvironmentalMonitoring': 'environmentalMonitoring',
                'CarbonFootprint': 'carbonFootprint',
                'WasteManagement': 'wasteManagement',
                'EnergyEfficiency': 'energyEfficiency',
                'WaterManagement': 'waterManagement',
                'RecyclingPrograms': 'recyclingPrograms',
                'RiskAssessments': 'riskAssessments',
                'HSERiskAssessments': 'hseRiskAssessments',
                'LegalDocuments': 'legalDocuments',
                'SafetyTeamMembers': 'safetyTeamMembers',
                'SafetyOrganizationalStructure': 'safetyOrganizationalStructure',
                'SafetyJobDescriptions': 'safetyJobDescriptions',
                'SafetyTeamAttendance': 'safetyTeamAttendance',
                'SafetyTeamLeaves': 'safetyTeamLeaves',
                'SafetyTeamTasks': 'safetyTeamTasks',
                'SOPJHA': 'sopjha',
                'PeriodicInspectionCategories': 'periodicInspectionCategories',
                'PeriodicInspectionRecords': 'periodicInspectionRecords',
                'PeriodicInspectionSchedules': 'periodicInspectionSchedules',
                'PeriodicInspectionChecklists': 'periodicInspectionChecklists'
            };

            // تحميل بيانات كل موديول بشكل متسلسل
            for (const moduleName of modulesToLoad) {
                try {
                    const sheets = moduleSheetsMap[moduleName] || [];
                    
                    if (sheets.length === 0) {
                        Utils.safeLog(`⚠️ لا توجد أوراق قاعدة البيانات للموديول: ${moduleName}`);
                        continue;
                    }

                    // ✅ تحسين: تحميل جميع أوراق الموديول بشكل متوازي لتسريع العملية
                    const sheetPromises = sheets.map(async (sheetName) => {
                        try {
                            const data = await GoogleIntegration.readFromSheets(sheetName);
                            const key = sheetToKeyMap[sheetName];
                            
                            if (key && Array.isArray(data)) {
                                // ✅ تحسين: التحقق من أن البيانات الجديدة صالحة قبل الاستبدال
                                const oldData = AppState.appData[key] || [];
                                
                                // إذا كانت البيانات الجديدة فارغة والبيانات القديمة تحتوي على بيانات، نستخدم القديمة
                                if (data.length === 0 && oldData.length > 0) {
                                    Utils.safeLog(`⚠️ ${sheetName} (${moduleName}): البيانات الجديدة فارغة - الاحتفاظ بالبيانات الحالية (${oldData.length} سجل)`);
                                    return { sheetName, key, success: true, data: oldData, kept: true };
                                }
                                
                                AppState.appData[key] = data;
                                Utils.safeLog(`✅ تم تحميل ${sheetName} (${moduleName}): ${data.length} سجل`);
                                return { sheetName, key, success: true, data, kept: false };
                            } else if (key) {
                                // ✅ تحسين: إذا لم تكن البيانات مصفوفة، نستخدم البيانات القديمة
                                const oldData = AppState.appData[key] || [];
                                if (oldData.length > 0) {
                                    Utils.safeWarn(`⚠️ ${sheetName} (${moduleName}): البيانات المستلمة ليست مصفوفة - الاحتفاظ بالبيانات الحالية (${oldData.length} سجل)`);
                                    return { sheetName, key, success: false, error: 'البيانات ليست مصفوفة', kept: true };
                                } else {
                                    AppState.appData[key] = [];
                                    Utils.safeWarn(`⚠️ ${sheetName} (${moduleName}): البيانات ليست مصفوفة ولا توجد بيانات قديمة`);
                                    return { sheetName, key, success: false, error: 'البيانات ليست مصفوفة', kept: false };
                                }
                            }
                            return { sheetName, key, success: false, error: 'لا يوجد key للجدول' };
                        } catch (error) {
                            const key = sheetToKeyMap[sheetName];
                            const errorMsg = error?.message || String(error);
                            
                            // استخدام البيانات المحلية إذا فشل التحميل
                            if (key && Array.isArray(AppState.appData[key]) && AppState.appData[key].length > 0) {
                                Utils.safeLog(`⚠️ ${sheetName} (${moduleName}): فشل التحميل (${errorMsg}) - استخدام ${AppState.appData[key].length} سجل محلي`);
                                return { sheetName, key, success: false, error: errorMsg, kept: true };
                            } else {
                                Utils.safeWarn(`⚠️ ${sheetName} (${moduleName}): فشل التحميل ولا توجد بيانات محلية`);
                                return { sheetName, key, success: false, error: errorMsg, kept: false };
                            }
                        }
                    });
                    
                    // انتظار اكتمال تحميل جميع الأوراق
                    const sheetResults = await Promise.allSettled(sheetPromises);
                    
                    // ✅ تحسين: تسجيل النتائج والتحقق من الموديولات الفارغة
                    let emptySheets = [];
                    sheetResults.forEach((result, index) => {
                        if (result.status === 'fulfilled') {
                            const res = result.value;
                            if (res && res.key) {
                                const data = AppState.appData[res.key] || [];
                                if (data.length === 0 && !res.kept) {
                                    emptySheets.push(res.sheetName);
                                }
                            }
                        }
                    });
                    
                    // ✅ إصلاح: إزالة المرجع للمتغير غير المعرّف silent - تسجيل التحذير دائماً إذا كانت هناك أوراق فارغة
                    if (emptySheets.length > 0) {
                        Utils.safeWarn(`⚠️ الموديول ${moduleName} يحتوي على ${emptySheets.length} جدول فارغ: ${emptySheets.join(', ')}`);
                    }
                } catch (error) {
                    Utils.safeWarn(`⚠️ فشل تحميل بيانات الموديول ${moduleName}:`, error);
                }
            }

            // حفظ جميع البيانات بعد اكتمال التحميل
            if (typeof DataManager !== 'undefined' && DataManager.save) {
                DataManager.save();
            }

            Utils.safeLog('✅ اكتمل تحميل بيانات جميع الموديولات المسموح بها');
        } catch (error) {
            Utils.safeError('❌ خطأ في تحميل بيانات الموديولات:', error);
        }
    },

    async resetPassword(email, newPassword = null) {
        if (!email || !Utils.isValidEmail(email)) {
            Notification.error('يرجى إدخال بريد إلكتروني صحيح');
            return { success: false, message: 'يرجى إدخال بريد إلكتروني صحيح' };
        }

        email = email.trim().toLowerCase();

        // استرجاع كلمة المرور عبر البريد (Supabase): التحقق من البريد وإرسال رابط إلى البريد
        if (typeof AppState !== 'undefined' && AppState.useSupabaseBackend === true) {
            try {
                const resetBaseUrl = typeof window !== 'undefined' && window.location && window.location.origin ? window.location.origin : '';
                const result = await GoogleIntegration.sendRequest({
                    action: 'requestPasswordReset',
                    data: { email: email, resetBaseUrl: resetBaseUrl }
                });
                if (result && result.success) {
                    return { success: true, message: result.message || 'إذا كان البريد مسجلاً ستتلقى رسالة خلال دقائق.' };
                }
                return { success: false, message: (result && result.message) || 'تعذر إرسال رابط الاسترجاع.' };
            } catch (err) {
                const msg = (err && err.message) || String(err);
                return { success: false, message: msg };
            }
        }

        // المسار القديم (غير Supabase): البحث في المستخدمين المحليين وكلمة مرور مؤقتة
        const user = AppState.appData.users.find(u => {
            if (!u || !u.email) return false;
            return u.email.toLowerCase().trim() === email;
        });

        if (!user) {
            Notification.error('البريد الإلكتروني غير مسجل في النظام');
            return { success: false, message: 'البريد الإلكتروني غير مسجل في النظام' };
        }

        let tempPassword = newPassword;
        if (!tempPassword) {
            const randomPart = Math.random().toString(36).substring(2, 10);
            const timestamp = Date.now().toString(36).substring(5, 9);
            tempPassword = 'Temp' + randomPart + timestamp + '!';
        }

        const hashedTemp = await Utils.hashPassword(tempPassword);
        user.password = '***';
        user.passwordHash = hashedTemp;
        user.passwordChanged = false;
        user.forcePasswordChange = true;
        user.updatedAt = new Date().toISOString();

        if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
            await window.DataManager.save();
        } else {
            Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
        }

        if (AppState.currentUser && AppState.currentUser.email && AppState.currentUser.email.toLowerCase().trim() === email) {
            AppState.currentUser.passwordHash = hashedTemp;
            AppState.currentUser.passwordChanged = false;
            AppState.currentUser.forcePasswordChange = true;
        }

        try {
            if (AppState.googleConfig && AppState.googleConfig.appsScript && AppState.googleConfig.appsScript.enabled && AppState.googleConfig.appsScript.scriptUrl) {
                let result = await GoogleIntegration.sendToAppsScript('resetUserPassword', {
                    userId: user.id,
                    email: user.email,
                    newPassword: tempPassword
                });
                if (result && result.success) {
                    Utils.safeLog('✅ تم تحديث كلمة المرور في قاعدة البيانات بنجاح');
                    if (result.tempPassword) tempPassword = result.tempPassword;
                } else {
                    result = await GoogleIntegration.sendToAppsScript('updateUser', {
                        userId: user.id,
                        updateData: {
                            passwordHash: hashedTemp,
                            passwordChanged: false,
                            forcePasswordChange: true,
                            updatedAt: user.updatedAt
                        }
                    });
                    if (result && result.success) {
                        Utils.safeLog('✅ تم تحديث كلمة المرور في قاعدة البيانات بنجاح (عبر updateUser)');
                    } else {
                        await GoogleIntegration.autoSave('Users', AppState.appData.users);
                    }
                }
            }
        } catch (error) {
            Utils.safeWarn('⚠ فشل تحديث كلمة المرور في قاعدة البيانات:', error);
            try {
                await GoogleIntegration.autoSave('Users', AppState.appData.users);
            } catch (autoSaveError) {
                Utils.safeWarn('⚠ فشل autoSave أيضاً:', autoSaveError);
            }
        }

        Utils.safeLog(`✅ تم إعادة تعيين كلمة المرور للمستخدم: ${email}`);
        return {
            success: true,
            message: 'تم إعادة تعيين كلمة المرور بنجاح',
            tempPassword: tempPassword
        };
    },

    showCreateFirstUserBox() {
        try {
            const box = document.getElementById('create-first-user-box');
            if (box) box.style.display = '';
            const btn = document.getElementById('create-first-user-btn');
            if (btn && !btn._bound) {
                btn._bound = true;
                btn.addEventListener('click', function () {
                    const modal = document.getElementById('create-first-user-modal');
                    if (modal) modal.style.display = 'flex';
                });
            }
            const closeBtn = document.getElementById('create-first-user-modal-close');
            const cancelBtn = document.getElementById('create-first-user-cancel');
            function closeModal() {
                const modal = document.getElementById('create-first-user-modal');
                if (modal) modal.style.display = 'none';
            }
            if (closeBtn && !closeBtn._bound) {
                closeBtn._bound = true;
                closeBtn.addEventListener('click', closeModal);
            }
            if (cancelBtn && !cancelBtn._bound) {
                cancelBtn._bound = true;
                cancelBtn.addEventListener('click', closeModal);
            }
            const form = document.getElementById('create-first-user-form');
            if (form && !form._bound) {
                form._bound = true;
                form.addEventListener('submit', function (e) {
                    e.preventDefault();
                    if (typeof Auth._handleCreateFirstUserSubmit === 'function') Auth._handleCreateFirstUserSubmit(form);
                });
            }
        } catch (err) {
            if (typeof Utils !== 'undefined' && Utils.safeWarn) Utils.safeWarn('showCreateFirstUserBox:', err);
        }
    },

    hideCreateFirstUserBox() {
        try {
            const box = document.getElementById('create-first-user-box');
            if (box) box.style.display = 'none';
            const modal = document.getElementById('create-first-user-modal');
            if (modal) modal.style.display = 'none';
        } catch (e) {}
    },

    async _handleCreateFirstUserSubmit(form) {
        const nameEl = form.querySelector('[name="first_user_name"]');
        const emailEl = form.querySelector('[name="first_user_email"]');
        const passEl = form.querySelector('[name="first_user_password"]');
        const name = (nameEl && nameEl.value || '').trim();
        const email = (emailEl && emailEl.value || '').trim().toLowerCase();
        const password = (passEl && passEl.value || '');
        if (!name || !email || !password) {
            if (typeof Notification !== 'undefined') Notification.error('يرجى تعبئة الاسم والبريد وكلمة المرور.');
            return;
        }
        if (typeof Utils === 'undefined' || !Utils.hashPassword) {
            if (typeof Notification !== 'undefined') Notification.error('الأداة غير جاهزة. حدّث الصفحة وحاول مرة أخرى.');
            return;
        }
        if (typeof GoogleIntegration === 'undefined' || !GoogleIntegration.sendToAppsScript) {
            if (typeof Notification !== 'undefined') Notification.error('الاتصال بـ Supabase غير متاح.');
            return;
        }
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'جاري الإنشاء...'; }
        try {
            const passwordHash = await Utils.hashPassword(password);
            const result = await GoogleIntegration.sendToAppsScript('addUser', {
                id: email,
                email: email,
                name: name,
                role: 'admin',
                passwordHash: passwordHash
            });
            if (result && result.success) {
                if (typeof Notification !== 'undefined') Notification.success('تم إنشاء المستخدم. يمكنك تسجيل الدخول الآن.');
                Auth.hideCreateFirstUserBox();
                if (typeof SupabaseIntegration !== 'undefined' && SupabaseIntegration.clearCache) SupabaseIntegration.clearCache('Users');
                if (typeof SupabaseIntegration !== 'undefined' && SupabaseIntegration.clearCache) SupabaseIntegration.clearCache('users');
                if (emailEl) emailEl.value = email;
                if (passEl) passEl.value = password;
                var un = document.getElementById('username');
                if (un) un.value = email;
                var pw = document.getElementById('password');
                if (pw) pw.value = password;
            } else {
                if (typeof Notification !== 'undefined') Notification.error((result && result.message) || 'فشل إنشاء المستخدم.');
            }
        } catch (err) {
            if (typeof Notification !== 'undefined') Notification.error(err && err.message ? err.message : 'فشل إنشاء المستخدم.');
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'إنشاء المستخدم'; }
        }
    }
};

// تصدير Auth للتوافق مع الكود القديم
if (typeof window !== 'undefined') {
    window.Auth = window.Auth || Auth;
}
