/**
 * Data Manager Service
 * Handles local data storage, sync queue management, and configuration persistence
 */

const DataManager = {
    _pendingSyncQueue: null,
    _quotaWarningLastShown: 0,
    _QUOTA_WARNING_COOLDOWN_MS: 5 * 60 * 1000,
    
    /**
     * تحميل قائمة المزامنة المعلقة من localStorage
     */
    loadPendingSyncQueue() {
        try {
            const saved = localStorage.getItem('hse_pending_sync_queue');
            if (saved) {
                this._pendingSyncQueue = JSON.parse(saved);
            } else {
                this._pendingSyncQueue = [];
            }
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في تحميل قائمة المزامنة المعلقة:', error);
            this._pendingSyncQueue = [];
        }
    },

    /**
     * حفظ قائمة المزامنة المعلقة في localStorage
     */
    savePendingSyncQueue() {
        try {
            if (this._pendingSyncQueue && this._pendingSyncQueue.length > 0) {
                localStorage.setItem('hse_pending_sync_queue', Utils.safeStringify(this._pendingSyncQueue));
            } else {
                localStorage.removeItem('hse_pending_sync_queue');
            }
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في حفظ قائمة المزامنة المعلقة:', error);
        }
    },

    /**
     * إضافة عنصر جديد إلى قائمة المزامنة المعلقة
     */
    addToPendingSync(sheetName, data, timestamp = null) {
        if (!this._pendingSyncQueue) {
            this.loadPendingSyncQueue();
        }
        
        // البحث عن العنصر - إذا كان موجوداً يتم تحديثه بدلاً من إضافة نسخة جديدة
        const existingIndex = this._pendingSyncQueue.findIndex(
            item => item.sheetName === sheetName
        );

        const pendingItem = {
            sheetName,
            data: JSON.parse(Utils.safeStringify(data)), // نسخ عميق
            timestamp: timestamp || new Date().toISOString(),
            retryCount: existingIndex >= 0 ? this._pendingSyncQueue[existingIndex].retryCount || 0 : 0
        };
        
        if (existingIndex >= 0) {
            this._pendingSyncQueue[existingIndex] = pendingItem;
        } else {
            this._pendingSyncQueue.push(pendingItem);
        }
        
        this.savePendingSyncQueue();
        Utils.safeLog(`✅ تمت إضافة ${sheetName} إلى قائمة المزامنة المعلقة بنجاح`);
    },
    
    /**
     * إزالة عنصر من قائمة المزامنة المعلقة بعد نجاح المزامنة
     */
    removeFromPendingSync(sheetName) {
        if (!this._pendingSyncQueue) {
            this.loadPendingSyncQueue();
        }
        
        const index = this._pendingSyncQueue.findIndex(item => item.sheetName === sheetName);
        if (index >= 0) {
            this._pendingSyncQueue.splice(index, 1);
            this.savePendingSyncQueue();
        }
    },
    
    /**
     * إعادة محاولة مزامنة جميع العناصر المعلقة في قائمة الانتظار
     */
    async retryPendingSync() {
        if (!this._pendingSyncQueue) {
            this.loadPendingSyncQueue();
        }
        
        if (!this._pendingSyncQueue || this._pendingSyncQueue.length === 0) {
            return { success: true, synced: 0, failed: 0 };
        }
        
        // التحقق من وجود backend (Supabase أو الخادم)
        const useSupabase = AppState.useSupabaseBackend === true;
        const hasGoogleScript = AppState.googleConfig?.appsScript?.enabled && AppState.googleConfig?.appsScript?.scriptUrl;
        if (!useSupabase && !hasGoogleScript) {
            Utils.safeLog('ℹ️ قاعدة البيانات غير مفعّلة، تخطي المزامنة');
            return { success: false, synced: 0, failed: 0, message: 'قاعدة البيانات غير مفعّلة' };
        }
        // مع Supabase لا يُستخدم معرف مصدر خارجي
        const spreadsheetId = useSupabase ? null : (AppState.googleConfig?.sheets?.spreadsheetId?.trim() || null);
        if (!useSupabase && (!spreadsheetId || spreadsheetId === '')) {
            Utils.safeLog('ℹ️ معرف المصدر غير محدد، تخطي المزامنة');
            return { success: false, synced: 0, failed: 0, message: 'معرف المصدر غير محدد' };
        }
        
        const results = { success: true, synced: 0, failed: 0, errors: [] };
        const maxRetries = 3;
        
        // نسخ قائمة الانتظار لتجنب التعديل أثناء التكرار
        const queueCopy = [...this._pendingSyncQueue];
        
        for (const item of queueCopy) {
            if (item.retryCount >= maxRetries) {
                // تجاوز الحد الأقصى للمحاولات - إزالة من قائمة الانتظار
                this.removeFromPendingSync(item.sheetName);
                results.failed++;
                results.errors.push(`${item.sheetName}: تجاوز الحد الأقصى للمحاولات`);
                continue;
            }
            
            try {
                // زيادة عداد المحاولات
                item.retryCount = (item.retryCount || 0) + 1;
                
                // محاولة المزامنة
                await GoogleIntegration.sendToAppsScript('saveToSheet', {
                    sheetName: item.sheetName,
                    data: item.data,
                    spreadsheetId: spreadsheetId
                });
                
                // نجحت المزامنة - إزالة من قائمة الانتظار
                this.removeFromPendingSync(item.sheetName);
                results.synced++;
                Utils.safeLog(`✅ تمت مزامنة ${item.sheetName} بنجاح`);
            } catch (error) {
                // فشلت المزامنة - الاحتفاظ في قائمة الانتظار
                const index = this._pendingSyncQueue.findIndex(i => i.sheetName === item.sheetName);
                if (index >= 0) {
                    this._pendingSyncQueue[index] = item;
                }
                this.savePendingSyncQueue();
                results.failed++;
                
                // تسجيل الخطأ فقط إذا لم يكن خطأ "معرف المصدر غير محدد"
                const errorMsg = error.message || 'خطأ غير معروف';
                if (!errorMsg.includes('معرف المصدر غير محدد') && !errorMsg.includes('قاعدة البيانات غير مفعّلة')) {
                    results.errors.push(`${item.sheetName}: ${errorMsg}`);
                    Utils.safeWarn(`⚠️ فشلت مزامنة ${item.sheetName}:`, errorMsg);
                }
            }
        }
        
        return results;
    },
    
    /**
     * تحميل البيانات المحلية من localStorage
     */
    async load() {
        try {
            // ✅ حماية: التأكد من وجود AppState.appData قبل التحميل
            if (!AppState) {
                Utils.safeError('❌ AppState غير موجود - لا يمكن تحميل البيانات');
                return false;
            }
            if (!AppState.appData) {
                AppState.appData = {};
            }
            
            const saved = localStorage.getItem('hse_app_data');
            if (saved) {
                const parsedData = JSON.parse(saved);
                
                // ✅ إصلاح: تحميل البيانات الأساسية أولاً بشكل فوري
                // 1. بيانات المستخدمين
                if (parsedData.users && Array.isArray(parsedData.users) && parsedData.users.length > 0) {
                    AppState.appData.users = parsedData.users;
                    if (AppState.debugMode) {
                        Utils.safeLog(`✅ تم تحميل ${parsedData.users.length} مستخدم من البيانات المحلية`);
                    }
                }
                
                // 2. قاعدة بيانات الموظفين
                if (parsedData.employees && Array.isArray(parsedData.employees) && parsedData.employees.length > 0) {
                    AppState.appData.employees = parsedData.employees;
                    if (AppState.debugMode) {
                        Utils.safeLog(`✅ تم تحميل ${parsedData.employees.length} موظف من البيانات المحلية`);
                    }
                }
                
                // 3. بيانات المقاولين (المعتمدين والعاديين)
                if (parsedData.approvedContractors && Array.isArray(parsedData.approvedContractors) && parsedData.approvedContractors.length > 0) {
                    AppState.appData.approvedContractors = parsedData.approvedContractors;
                    if (AppState.debugMode) {
                        Utils.safeLog(`✅ تم تحميل ${parsedData.approvedContractors.length} مقاول معتمد من البيانات المحلية`);
                    }
                }
                if (parsedData.contractors && Array.isArray(parsedData.contractors) && parsedData.contractors.length > 0) {
                    AppState.appData.contractors = parsedData.contractors;
                    if (AppState.debugMode) {
                        Utils.safeLog(`✅ تم تحميل ${parsedData.contractors.length} مقاول من البيانات المحلية`);
                    }
                }
                
                // 4. قاعدة بيانات المواقع (إعدادات النماذج)
                if (parsedData.observationSites && Array.isArray(parsedData.observationSites) && parsedData.observationSites.length > 0) {
                    // ✅ إصلاح: تطبيع المواقع والأماكن الفرعية عند التحميل من localStorage
                    const normalizedSites = parsedData.observationSites.map(site => {
                        const normalizedSite = {
                            id: site.id || site.siteId || Utils.generateId('SITE'),
                            name: site.name || site.title || site.label || '',
                            description: site.description || '',
                            places: []
                        };
                        
                        // تطبيع الأماكن الفرعية
                        const placesSource = Array.isArray(site.places) ? site.places : [];
                        normalizedSite.places = placesSource.map((place, idx) => {
                            if (typeof place === 'object' && place !== null) {
                                return {
                                    id: place.id || place.placeId || place.value || Utils.generateId('PLACE'),
                                    name: place.name || place.placeName || place.title || place.label || place.locationName || `مكان ${idx + 1}`,
                                    siteId: normalizedSite.id
                                };
                            }
                            if (typeof place === 'string') {
                                return {
                                    id: Utils.generateId('PLACE'),
                                    name: place,
                                    siteId: normalizedSite.id
                                };
                            }
                            return null;
                        }).filter(Boolean); // إزالة القيم null
                        
                        return normalizedSite;
                    }).filter(site => site.id && site.name); // إزالة المواقع غير الصالحة
                    
                    AppState.appData.observationSites = normalizedSites;
                    if (AppState.debugMode) {
                        Utils.safeLog(`✅ تم تحميل ${normalizedSites.length} موقع من البيانات المحلية`);
                    }
                } else {
                    // ✅ إصلاح: تهيئة observationSites كمصفوفة فارغة إذا لم تكن موجودة
                    if (!AppState.appData.observationSites) {
                        AppState.appData.observationSites = [];
                    }
                }
                
                // تحميل باقي البيانات
                Object.keys(parsedData).forEach(key => {
                    // تخطي البيانات الأساسية التي تم تحميلها بالفعل
                    if (['users', 'employees', 'approvedContractors', 'contractors', 'observationSites'].includes(key)) {
                        return;
                    }
                    if (parsedData[key] && Array.isArray(parsedData[key])) {
                        AppState.appData[key] = parsedData[key];
                    } else if (key === 'systemStatistics' && parsedData[key] && typeof parsedData[key] === 'object') {
                        // تحميل إحصائيات النظام
                        AppState.appData.systemStatistics = parsedData[key];
                    }
                });
                
                if (AppState.debugMode) {
                    const totalRecords = Object.keys(parsedData).reduce((sum, key) => {
                        if (Array.isArray(parsedData[key])) {
                            return sum + parsedData[key].length;
                        }
                        return sum;
                    }, 0);
                    Utils.safeLog(`✅ تم تحميل ${totalRecords} سجل من البيانات المحلية`);
                }
            }
            
            // تهيئة systemStatistics إذا لم يكن موجوداً
            if (!AppState.appData.systemStatistics) {
                AppState.appData.systemStatistics = {
                    totalLogins: 0
                };
            } else if (typeof AppState.appData.systemStatistics.totalLogins !== 'number') {
                // التأكد من أن totalLogins هو رقم
                AppState.appData.systemStatistics.totalLogins = 0;
            }

            await this.loadCompanySettings();
            this.loadCloudStorageConfig();
            this.loadPendingSyncQueue();
            
            // ✅ إضافة: تحميل syncMeta
            try {
                const syncMetaStr = localStorage.getItem('hse_sync_meta');
                if (syncMetaStr) {
                    const savedSyncMeta = JSON.parse(syncMetaStr);
                    // التحقق من أن syncMeta ينتمي للمستخدم الحالي
                    const currentUserEmail = AppState.currentUser?.email || null;
                    if (!currentUserEmail || savedSyncMeta.userEmail === currentUserEmail) {
                        AppState.syncMeta = {
                            ...AppState.syncMeta,
                            ...savedSyncMeta,
                            sheets: savedSyncMeta.sheets || {}
                        };
                    } else {
                        // تغيير المستخدم - نمسح syncMeta القديم
                        if (AppState.syncMeta) {
                            AppState.syncMeta.sheets = {};
                            AppState.syncMeta.userEmail = currentUserEmail;
                            AppState.syncMeta.lastSyncTime = 0;
                        }
                    }
                }
            } catch (e) {
                Utils.safeWarn('⚠️ فشل تحميل syncMeta:', e);
            }
            
            // ✅ إصلاح: تحديث جلسة المستخدم الحالي بعد تحميل البيانات
            // هذا يضمن أن الصلاحيات محدثة من قاعدة البيانات
            // فقط إذا كانت هناك بيانات مستخدمين محملة ولم يتم تحديث الجلسة مؤخراً
            if (AppState.currentUser && 
                AppState.appData.users && 
                Array.isArray(AppState.appData.users) && 
                AppState.appData.users.length > 0 &&
                typeof window.Auth !== 'undefined' && 
                typeof window.Auth.updateUserSession === 'function') {
                
                // التحقق من وجود المستخدم الحالي في البيانات المحملة
                const currentUserEmail = AppState.currentUser.email?.toLowerCase();
                const userExists = AppState.appData.users.some(u => 
                    u.email && u.email.toLowerCase() === currentUserEmail
                );
                
                if (userExists) {
                    // تأخير بسيط للتأكد من اكتمال تحميل جميع البيانات
                    setTimeout(() => {
                        window.Auth.updateUserSession();
                        if (AppState.debugMode) {
                            Utils.safeLog('✅ تم تحديث الجلسة بعد تحميل البيانات المحلية');
                        }
                    }, 200);
                } else if (AppState.debugMode) {
                    Utils.safeLog('ℹ️ المستخدم الحالي غير موجود في البيانات المحملة - تخطي تحديث الجلسة');
                }
            }
            
            return true;
        } catch (error) {
            Utils.safeError('❌ خطأ في تحميل البيانات المحلية:', error);
            Notification.error('❌ فشل تحميل البيانات المحلية');
            return false;
        }
    },

    /**
     * حفظ البيانات المحلية في localStorage
     * ملاحظة: حفظ البيانات المحلية فقط - المزامنة مع قاعدة البيانات تتم تلقائياً عبر autoSave
     */
    save() {
        try {
            // ✅ حماية: التأكد من وجود AppState.appData قبل الحفظ
            if (!AppState || !AppState.appData) {
                Utils.safeWarn('⚠️ AppState.appData غير موجود - لا يمكن حفظ البيانات');
                return false;
            }
            
            // استخدام safeStringify لتجنب الأخطاء في التسلسل
            const serialized = Utils.safeStringify(AppState.appData);
            if (!serialized || serialized.length > 10 * 1024 * 1024) { // 10MB limit
                Utils.safeWarn('⚠️ حجم البيانات كبير جداً - قد يفشل الحفظ في localStorage');
                return false;
            }
            localStorage.setItem('hse_app_data', serialized);
            this.saveCompanySettings();
            
            // ✅ إضافة: حفظ syncMeta
            if (AppState.syncMeta) {
                try {
                    localStorage.setItem('hse_sync_meta', Utils.safeStringify(AppState.syncMeta));
                } catch (e) {
                    Utils.safeWarn('⚠️ فشل حفظ syncMeta:', e);
                }
            }
            
            // ملاحظة: حفظ البيانات المحلية فقط - المزامنة مع قاعدة البيانات تتم تلقائياً عبر autoSave
            return true;
        } catch (error) {
            // ✅ تحديد سبب الفشل ومعالجته دون إظهار رسالة مخيفة عند الدخول للموديولات
            const isQuotaExceeded = (error.name === 'QuotaExceededError' || (error.code === 22)) || (error.message && (error.message.includes('QuotaExceeded') || error.message.includes('quota')));
            const isSecurityError = (error.name === 'SecurityError' || (error.code === 18)) || (error.message && error.message.toLowerCase().includes('security'));
            const isStackOverflow = error.message && (error.message.includes('Maximum call stack') || error.message.includes('stack overflow'));
            
            Utils.safeError('❌ خطأ في حفظ البيانات المحلية:', error.name || error.code, error.message);
            
            if (isStackOverflow) {
                // عدم إظهار أي إشعار للمستخدم — المزامنة تتم تلقائياً عند الاتصال
                return false;
            }
            if (isQuotaExceeded) {
                // عدم إظهار أي إشعار للمستخدم — المزامنة تتم تلقائياً عند الاتصال
                return false;
            }
            if (isSecurityError) {
                // وضع التصفح الخاص أو localStorage معطّل - لا نزعج المستخدم
                Utils.safeWarn('⚠️ التخزين المحلي غير متاح (وضع خاص أو إعدادات المتصفح)');
                return false;
            }
            // أخطاء أخرى: عدم إظهار إشعار للمستخدم
            return false;
        }
    },

    async loadCompanySettings(forceReload = false) {
        try {
            // ✅ إصلاح: التحقق من وجود الشعار في localStorage أولاً (cache)
            // إذا كان موجوداً ولم نطلب إعادة تحميل قسرية، نستخدم localStorage فقط
            if (!forceReload) {
                const cachedLogo = localStorage.getItem('hse_company_logo') || localStorage.getItem('company_logo');
                const cachedSettings = localStorage.getItem('hse_company_settings');
                
                if (cachedLogo && cachedSettings) {
                    try {
                        const parsedSettings = JSON.parse(cachedSettings);
                        if (parsedSettings && parsedSettings.logo) {
                            // استخدام البيانات المخزنة محلياً
                            AppState.companyLogo = cachedLogo;
                            AppState.companySettings = Object.assign({}, AppState.companySettings, parsedSettings || {});
                            AppState.companySettings.logo = cachedLogo;
                            
                            // تحديث الشعار في جميع الأماكن
                            setTimeout(() => {
                                if (typeof UI !== 'undefined') {
                                    if (UI.updateCompanyLogoHeader) UI.updateCompanyLogoHeader();
                                    if (UI.updateLoginLogo) UI.updateLoginLogo();
                                    if (UI.updateDashboardLogo) UI.updateDashboardLogo();
                                    if (UI.updateCompanyBranding) UI.updateCompanyBranding();
                                }
                                window.dispatchEvent(new CustomEvent('companyLogoUpdated', { 
                                    detail: { logoUrl: cachedLogo } 
                                }));
                            }, 50);
                            
                            Utils.safeLog('✅ تم تحميل الشعار من localStorage (cache) - لا حاجة للتحميل من قاعدة البيانات');
                            // ✅ إصلاح: إرجاع هنا لتجنب التحميل من قاعدة البيانات في كل مرة
                            // فقط عند forceReload أو عدم وجود cache نتحميل من قاعدة البيانات
                            return;
                        }
                    } catch (e) {
                        Utils.safeWarn('⚠️ خطأ في قراءة البيانات المخزنة محلياً:', e);
                    }
                }
            }
            
            // ✅ تحميل الإعدادات من الخادم عند forceReload أو عدم وجود cache
            const useSupabase = AppState.useSupabaseBackend === true;
            const hasGoogleScript = AppState.googleConfig?.appsScript?.enabled && AppState.googleConfig?.appsScript?.scriptUrl;
            const canLoadFromBackend = (useSupabase || hasGoogleScript) && typeof GoogleIntegration !== 'undefined' && typeof GoogleIntegration.sendToAppsScript === 'function';

            if (canLoadFromBackend) {
                try {
                    const result = await GoogleIntegration.sendToAppsScript('getCompanySettings', {});
                    if (result && result.success && result.data) {
                        // تحليل postLoginItems (سياسات/تعليمات ما بعد الدخول)
                        let postLoginItems = AppState.companySettings?.postLoginItems;
                        if (result.data.postLoginItems !== undefined) {
                            const raw = result.data.postLoginItems;
                            if (typeof raw === 'string') {
                                if (raw.trim() !== '') {
                                    try {
                                        postLoginItems = JSON.parse(raw);
                                    } catch (e) {
                                        postLoginItems = [];
                                    }
                                } else {
                                    postLoginItems = [];
                                }
                            } else if (Array.isArray(raw)) {
                                postLoginItems = raw;
                            } else {
                                postLoginItems = [];
                            }
                        }
                        if (!Array.isArray(postLoginItems)) postLoginItems = [];

                        // تحديث AppState بالبيانات من الخادم
                        AppState.companySettings = Object.assign({}, AppState.companySettings, {
                            name: result.data.name || AppState.companySettings?.name,
                            secondaryName: result.data.secondaryName || AppState.companySettings?.secondaryName,
                            nameFontSize: result.data.nameFontSize || AppState.companySettings?.nameFontSize || 16,
                            secondaryNameFontSize: result.data.secondaryNameFontSize || AppState.companySettings?.secondaryNameFontSize || 14,
                            secondaryNameColor: result.data.secondaryNameColor || AppState.companySettings?.secondaryNameColor || '#6B7280',
                            formVersion: result.data.formVersion || AppState.companySettings?.formVersion || '1.0',
                            address: result.data.address || AppState.companySettings?.address,
                            phone: result.data.phone || AppState.companySettings?.phone,
                            email: result.data.email || AppState.companySettings?.email,
                            postLoginItems: postLoginItems,
                            clinicMonthlyVisitsAlertThreshold: result.data.clinicMonthlyVisitsAlertThreshold ?? AppState.companySettings?.clinicMonthlyVisitsAlertThreshold ?? 10
                        });
                        
                        // تحديث شعار الشركة (حتى لو كان فارغاً لمسحه)
                        if (result.data.hasOwnProperty('logo')) {
                            const logoValue = result.data.logo || '';
                            AppState.companyLogo = logoValue;
                            // تحديث الشعار في AppState.companySettings أيضاً
                            if (!AppState.companySettings) {
                                AppState.companySettings = {};
                            }
                            AppState.companySettings.logo = logoValue;
                            // ✅ إصلاح: حفظ في localStorage فقط إذا تغير الشعار
                            const currentLogo = localStorage.getItem('hse_company_logo') || '';
                            if (logoValue && logoValue.trim() !== '') {
                                // إذا تغير الشعار، نحدّث localStorage
                                if (currentLogo !== logoValue) {
                                    localStorage.setItem('hse_company_logo', logoValue);
                                    localStorage.setItem('company_logo', logoValue);
                                    Utils.safeLog('✅ تم تحديث الشعار من الخادم (الطول: ' + logoValue.length + ' حرف)');
                                } else {
                                    Utils.safeLog('ℹ️ الشعار لم يتغير - استخدام النسخة المخزنة محلياً');
                                }
                            } else {
                                // إذا تم حذف الشعار من قاعدة البيانات، نمسح localStorage
                                if (currentLogo) {
                                    localStorage.removeItem('hse_company_logo');
                                    localStorage.removeItem('company_logo');
                                    Utils.safeLog('ℹ️ تم حذف الشعار من قاعدة البيانات');
                                }
                            }
                        } else {
                            // ✅ إصلاح: إذا لم يكن logo في البيانات، نتحقق من وجوده في companySettings
                            if (result.data.logo !== undefined) {
                                // logo موجود لكنه فارغ
                                AppState.companyLogo = '';
                                if (!AppState.companySettings) {
                                    AppState.companySettings = {};
                                }
                                AppState.companySettings.logo = '';
                                localStorage.removeItem('hse_company_logo');
                                localStorage.removeItem('company_logo');
                            }
                        }
                        
                        // حفظ في localStorage لاستخدامها لاحقاً
                        localStorage.setItem('hse_company_settings', JSON.stringify(AppState.companySettings || {}));
                        
                            // ✅ إصلاح: تحديث الشعار في جميع الأماكن المخصصة (حتى لو كان فارغاً)
                        // استخدام setTimeout لضمان تحديث الواجهة بعد تحديث AppState
                        const shouldUpdateUI = forceReload || !localStorage.getItem('hse_company_logo');
                        if (shouldUpdateUI) {
                            setTimeout(() => {
                                if (typeof UI !== 'undefined') {
                                    if (UI.updateCompanyLogoHeader) {
                                        UI.updateCompanyLogoHeader();
                                    }
                                    if (UI.updateLoginLogo) {
                                        UI.updateLoginLogo();
                                    }
                                    if (UI.updateDashboardLogo) {
                                        UI.updateDashboardLogo();
                                    }
                                    if (UI.updateCompanyBranding) {
                                        UI.updateCompanyBranding();
                                    }
                                }
                                
                                // إرسال حدث لتحديث الشعار (حتى لو كان فارغاً لمسحه)
                                window.dispatchEvent(new CustomEvent('companyLogoUpdated', { 
                                    detail: { logoUrl: AppState.companyLogo || '' } 
                                }));
                            }, 100);
                        }
                        
                        if (forceReload) {
                            Utils.safeLog('✅ تم تحميل إعدادات الشركة والشعار من الخادم بنجاح (force reload)');
                        } else {
                            Utils.safeLog('✅ تم تحديث إعدادات الشركة والشعار من الخادم بنجاح');
                        }
                        return;
                    }
                } catch (error) {
                    Utils.safeWarn('⚠️ فشل تحميل إعدادات الشركة من الخادم:', error);
                }
            }

            // إذا فشل التحميل من الخادم، تحميل من localStorage
            const savedSettings = localStorage.getItem('hse_company_settings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                AppState.companySettings = Object.assign({}, AppState.companySettings, parsedSettings || {});
                
                // ✅ إصلاح: تحميل الشعار من companySettings إذا كان موجوداً
                if (parsedSettings && parsedSettings.logo) {
                    AppState.companyLogo = parsedSettings.logo;
                }
            }
            
            // تحميل الشعار من localStorage إذا كان موجوداً (fallback)
            const savedLogo = localStorage.getItem('hse_company_logo') || localStorage.getItem('company_logo');
            if (savedLogo) {
                AppState.companyLogo = savedLogo;
                // تحديث الشعار في AppState.companySettings أيضاً
                if (!AppState.companySettings) {
                    AppState.companySettings = {};
                }
                AppState.companySettings.logo = savedLogo;
            }
            
            // ✅ إصلاح: تحديث الشعار في جميع الأماكن المخصصة بعد التحميل (سواء من companySettings أو localStorage)
            const logoToUse = AppState.companyLogo || (AppState.companySettings && AppState.companySettings.logo) || '';
            
            // استخدام setTimeout لضمان تحديث الواجهة بعد تحديث AppState
            setTimeout(() => {
                if (logoToUse || !AppState.companyLogo) {
                    if (typeof UI !== 'undefined') {
                        if (UI.updateCompanyLogoHeader) {
                            UI.updateCompanyLogoHeader();
                        }
                        if (UI.updateLoginLogo) {
                            UI.updateLoginLogo();
                        }
                        if (UI.updateDashboardLogo) {
                            UI.updateDashboardLogo();
                        }
                        if (UI.updateCompanyBranding) {
                            UI.updateCompanyBranding();
                        }
                    }
                    
                    // إرسال حدث لتحديث الشعار
                    window.dispatchEvent(new CustomEvent('companyLogoUpdated', { 
                        detail: { logoUrl: logoToUse } 
                    }));
                }
            }, 100);
        } catch (error) {
            Utils.safeWarn('⚠️ فشل تحميل إعدادات الشركة من localStorage:', error);
        }
    },

    saveCompanySettings() {
        try {
            localStorage.setItem('hse_company_settings', JSON.stringify(AppState.companySettings || {}));
            return true;
        } catch (error) {
            Utils.safeError('❌ خطأ في حفظ إعدادات الشركة:', error);
            return false;
        }
    },

    /**
     * تحميل إعدادات التكامل مع Google
     */
    loadGoogleConfig() {
        try {
            const config = localStorage.getItem('hse_google_config');
            if (config) {
                AppState.googleConfig = JSON.parse(config);
            }
        } catch (error) {
            Utils.safeError('❌ خطأ في تحميل إعدادات Google:', error);
        }
    },

    /**
     * حفظ إعدادات التكامل مع Google
     */
    saveGoogleConfig() {
        try {
            localStorage.setItem('hse_google_config', JSON.stringify(AppState.googleConfig));
            return true;
        } catch (error) {
            Utils.safeError('❌ خطأ في حفظ إعدادات Google:', error);
            return false;
        }
    },

    /**
     * تحميل إعدادات التخزين السحابي
     */
    loadCloudStorageConfig() {
        try {
            const config = localStorage.getItem('hse_cloud_storage_config');
            if (config) {
                AppState.cloudStorageConfig = JSON.parse(config);
            }
        } catch (error) {
            Utils.safeError('❌ خطأ في تحميل إعدادات التخزين السحابي:', error);
        }
    },

    /**
     * حفظ إعدادات التخزين السحابي
     */
    saveCloudStorageConfig() {
        try {
            localStorage.setItem('hse_cloud_storage_config', JSON.stringify(AppState.cloudStorageConfig));
            return true;
        } catch (error) {
            Utils.safeError('❌ خطأ في حفظ إعدادات التخزين السحابي:', error);
            return false;
        }
    }
};

// Export to global window (for script tag loading)
if (typeof window !== 'undefined') {
    window.DataManager = DataManager;
}

