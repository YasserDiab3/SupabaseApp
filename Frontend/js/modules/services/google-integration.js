/**
 * Google Integration Service
 * Handles backend integration (Script/Sheets) and data synchronization
 */

const GoogleIntegration = {
    // المزامنة في التقدم - المستخدمين والآخرين
    _syncInProgress: {
        users: false,
        global: false,
        lastSyncStart: null,
        lastSyncEnd: null
    },

    /**
     * التحقق من المزامنة في التقدم
     */
    isSyncing(sheetName = 'users') {
        const key = sheetName.toLowerCase();
        return this._syncInProgress[key] === true;
    },

    /**
     * تعيين حالة المزامنة في التقدم
     */
    _setSyncState(sheetName, inProgress) {
        const key = sheetName.toLowerCase();
        this._syncInProgress[key] = inProgress;
        if (inProgress) {
            this._syncInProgress.lastSyncStart = Date.now();
        } else {
            this._syncInProgress.lastSyncEnd = Date.now();
        }
    },

    prepareSheetPayload(sheetName, data) {
        if (sheetName !== 'Users') {
            return data;
        }

        const sanitizeUser = (user) => {
            if (!user || typeof user !== 'object') return user;
            const sanitized = { ...user };
            const canCheckHash = typeof Utils !== 'undefined' && Utils && typeof Utils.isSha256Hex === 'function';
            const hasHash = sanitized.passwordHash && sanitized.passwordHash.trim() !== '';
            const passwordValue = sanitized.password || '';

            // التحقق من هل هو passwordHash
            if (hasHash && canCheckHash && Utils.isSha256Hex(sanitized.passwordHash.trim())) {
                // passwordHash موجود - يتم تخزينه
            } else if (!hasHash && passwordValue && passwordValue !== '***' && canCheckHash && Utils.isSha256Hex(passwordValue)) {
                // لا يوجد passwordHash - يتم تخزينه في passwordHash
                sanitized.passwordHash = passwordValue.trim();
            } else if (passwordValue && passwordValue !== '***' && !canCheckHash) {
                // لا يوجد passwordHash - يتم تخزينه في password
                // لا يوجد passwordHash - يتم تخزينه في passwordHash
            }

            // يتم تخزين password
            sanitized.password = '***';

            // يتم التحقق من هل هو passwordHash
            if (sanitized.passwordHash && sanitized.passwordHash.trim() === '') {
                delete sanitized.passwordHash;
            } else if (sanitized.passwordHash && canCheckHash && !Utils.isSha256Hex(sanitized.passwordHash.trim())) {
                // لا يوجد passwordHash - يتم حذفه
                delete sanitized.passwordHash;
            }

            return sanitized;
        };

        if (Array.isArray(data)) {
            return data.map(item => sanitizeUser(item));
        }

        if (data && typeof data === 'object') {
            return sanitizeUser(data);
        }

        return data;
    },

    /**
     * التحقق من المزامنة في التقدم باستخدام الخادم
     * التحقق من المزامنة في التقدم باستخدام الخادم
     */
    async autoSave(sheetName, data) {
        if (!AppState.googleConfig.appsScript.enabled || !AppState.googleConfig.appsScript.scriptUrl) {
            // لا يوجد اتصال بالخادم - يتم تخزينه في التقدم
            if (typeof DataManager !== 'undefined' && DataManager.addToPendingSync) {
                DataManager.addToPendingSync(sheetName, data);
            }
            return;
        }

        try {
            const spreadsheetId = AppState.googleConfig.sheets?.spreadsheetId;
            if (!spreadsheetId || spreadsheetId.trim() === '' || spreadsheetId === 'YOUR_SPREADSHEET_ID_HERE') {
                // لا يوجد spreadsheetId - يتم تخزينه في التقدم
                Utils.safeWarn(`فشل تحميل الملف إلى الخادم - يتم تخزينه في التقدم ${sheetName}`);
                if (typeof DataManager !== 'undefined' && DataManager.addToPendingSync) {
                    DataManager.addToPendingSync(sheetName, data);
                }
                return;
            }

            const preparedData = this.prepareSheetPayload(sheetName, data);

            // يتم التحقق من هل هو spreadsheetId
            await this.sendToAppsScript('saveToSheet', {
                sheetName,
                data: preparedData,
                spreadsheetId: spreadsheetId.trim()
            });

            // يتم حذف الملف من التقدم
            if (typeof DataManager !== 'undefined' && DataManager.removeFromPendingSync) {
                DataManager.removeFromPendingSync(sheetName);
            }

            // مسح الـ cache للـ sheet المحدث
            this.clearCache(sheetName);

            Utils.safeLog(`تم تحميل الملف إلى الخادم ${sheetName}`);
        } catch (error) {
            // فشل تحميل الملف إلى الخادم
            Utils.safeWarn(`فشل تحميل الملف إلى الخادم ${sheetName}:`, error.message);

            if (typeof DataManager !== 'undefined' && DataManager.addToPendingSync) {
                DataManager.addToPendingSync(sheetName, data);
                Utils.safeLog(`فشل تحميل الملف إلى الخادم ${sheetName}`);
            }
        }
    },

    /**
     * التحقق من المزامنة في التقدم باستخدام الخادم
     * @param {string} action - نوع العملية (addUser, updateUser)
     * @param {any} data - البيانات
     * @param {number} maxRetries - عدد المحاولات (3)
     * @returns {Promise<object>} - النتيجة
     */
    async immediateSyncWithRetry(action, data, maxRetries = 3) {
        // عند استخدام Supabase: تنفيذ addUser/updateUser عبر Supabase حتى لو لم يكن Apps Script مفعّلاً
        const isUserAction = action === 'addUser' || action === 'updateUser';
        if (AppState.useSupabaseBackend === true && isUserAction && typeof SupabaseIntegration !== 'undefined' && typeof SupabaseIntegration.immediateSyncWithRetry === 'function') {
            try {
                const result = await SupabaseIntegration.immediateSyncWithRetry(action, data, maxRetries);
                return result || { success: false, message: 'لا توجد نتيجة', shouldDefer: true };
            } catch (err) {
                Utils.safeWarn('فشل المزامنة مع Supabase (immediateSyncWithRetry):', err?.message || err);
                return { success: false, message: err?.message || 'فشل المزامنة مع قاعدة البيانات', shouldDefer: true };
            }
        }

        if (!AppState.googleConfig.appsScript.enabled || !AppState.googleConfig.appsScript.scriptUrl) {
            return {
                success: false,
                message: 'الاتصال بالخادم غير مفعّل',
                shouldDefer: true
            };
        }

        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                Utils.safeLog(`تحقق من المزامنة في التقدم باستخدام الخادم ${attempt}/${maxRetries} ${action}...`);

                const result = await this.sendToAppsScript(action, data);

                if (result && result.success) {
                    Utils.safeLog(`تم تحقق من المزامنة في التقدم باستخدام الخادم ${action} ${attempt}`);
                    return result;
                }

                // فشل تحقق من المزامنة في التقدم باستخدام الخادم
                lastError = new Error(result?.message || 'فشل تحقق من المزامنة في التقدم باستخدام الخادم');
                Utils.safeWarn(`فشل تحقق من المزامنة في التقدم باستخدام الخادم ${action} ${attempt}: ${result?.message}`);

                // التحقق من هل هو invalid
                if (result?.message && (
                    result.message.includes('invalid') ||
                    result.message.includes('invalid') ||
                    result.message.includes('invalid')
                )) {
                    return result; // التحقق من هل هو invalid
                }

            } catch (error) {
                lastError = error;
                Utils.safeWarn(`فشل تحقق من المزامنة في التقدم باستخدام الخادم ${attempt}/${maxRetries} ${action}:`, error.message);

                // التحقق من هل هو invalid
                if (attempt < maxRetries) {
                    const waitTime = 500 * attempt; // التحقق من هل هو invalid
                    Utils.safeLog(`فشل تحقق من المزامنة في التقدم باستخدام الخادم ${waitTime}ms ${action}...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }

        // فشل تحقق من المزامنة في التقدم باستخدام الخادم
        return {
            success: false,
            message: lastError?.message || 'فشل تحقق من المزامنة في التقدم باستخدام الخادم',
            shouldDefer: true,
            lastError: lastError
        };
    },

    /**
     * التحقق من صلاحية رابط الخادم
     */
    isValidGoogleAppsScriptUrl(url) {
        try {
            const urlObj = new URL(url);

            // التحقق من هل هو valid Hostname
            const validHostnames = [
                'script.google.com',
                'script.googleusercontent.com'
            ];

            const isValidHostname = validHostnames.some(hostname =>
                urlObj.hostname === hostname ||
                urlObj.hostname.endsWith('.' + hostname)
            );

            if (!isValidHostname) {
                return false;
            }

            // التحقق من هل هو valid Pathname
            if (!urlObj.pathname.endsWith('/exec')) {
                return false;
            }

            // التحقق من هل هو valid Protocol
            if (urlObj.protocol !== 'https:') {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    },

    /**
     * التحقق من هل هو CSRF Token
     */
    getOrCreateCSRFToken() {
        let token = sessionStorage.getItem('csrf_token');
        if (!token) {
            // لا يوجد token - يتم توليده
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            token = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
            sessionStorage.setItem('csrf_token', token);
        }
        return token;
    },

    /**
     * ============================================
     * التحقق من المزامنة في التقدم باستخدام الخادم
     * ============================================
     */

    // Request Queue System
    _requestQueue: [],
    _isProcessingQueue: false,
    _lastRequestTime: null,

    // Circuit Breaker
    _circuitBreaker: {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: null,
        openUntil: null,
        successCount: 0
    },

    // Request deduplication
    _activeRequests: new Map(), // التحقق من هل هو activeRequests

    // API Rate Limiting
    _rateLimiter: {
        requests: [],
        maxRequests: 100, // 100 طلب
        windowMs: 60000, // في 60 ثانية
        blockDuration: 300000 // حظر 5 دقائق عند تجاوز الحد
    },

    // Data Caching System
    _cache: {
        data: new Map(),
        timestamps: new Map(),
        defaultTTL: 5 * 60 * 1000, // 5 دقائق افتراضياً
        maxSize: 100 // أقصى 100 عنصر في الـ cache
    },

    /**
     * الحصول على بيانات من الـ cache
     */
    _getCachedData(key) {
        const cached = this._cache.data.get(key);
        const timestamp = this._cache.timestamps.get(key);

        if (!cached || !timestamp) {
            return null;
        }

        // التحقق من انتهاء صلاحية الـ cache
        const now = Date.now();
        const age = now - timestamp;
        const ttl = this._cache.defaultTTL;

        if (age > ttl) {
            // انتهت صلاحية الـ cache
            this._cache.data.delete(key);
            this._cache.timestamps.delete(key);
            return null;
        }

        return cached;
    },

    /**
     * حفظ بيانات في الـ cache
     */
    _setCachedData(key, data, ttl = null) {
        // التحقق من حجم الـ cache
        if (this._cache.data.size >= this._cache.maxSize) {
            // حذف أقدم عنصر
            const oldestKey = this._cache.timestamps.entries()
                .sort((a, b) => a[1] - b[1])[0]?.[0];
            if (oldestKey) {
                this._cache.data.delete(oldestKey);
                this._cache.timestamps.delete(oldestKey);
            }
        }

        this._cache.data.set(key, data);
        this._cache.timestamps.set(key, Date.now());
    },

    /**
     * مسح الـ cache
     */
    clearCache(pattern = null) {
        if (!pattern) {
            this._cache.data.clear();
            this._cache.timestamps.clear();
            return;
        }

        // مسح العناصر المطابقة للنمط
        for (const key of this._cache.data.keys()) {
            if (key.includes(pattern)) {
                this._cache.data.delete(key);
                this._cache.timestamps.delete(key);
            }
        }
    },

    /**
     * التحقق من Rate Limiting للـ API
     */
    _checkRateLimit() {
        const now = Date.now();
        const windowStart = now - this._rateLimiter.windowMs;

        // إزالة الطلبات القديمة خارج النافذة
        this._rateLimiter.requests = this._rateLimiter.requests.filter(
            timestamp => timestamp > windowStart
        );

        // التحقق من تجاوز الحد
        if (this._rateLimiter.requests.length >= this._rateLimiter.maxRequests) {
            const oldestRequest = this._rateLimiter.requests[0];
            const timeUntilReset = this._rateLimiter.windowMs - (now - oldestRequest);
            throw new Error(`تم تجاوز حد الطلبات المسموح بها. يرجى المحاولة بعد ${Math.ceil(timeUntilReset / 1000)} ثانية.`);
        }

        // إضافة الطلب الحالي
        this._rateLimiter.requests.push(now);
    },

    /**
     * Circuit Breaker: التحقق من هل هو Circuit Breaker
     */
    _openCircuitBreaker() {
        this._circuitBreaker.isOpen = true;
        this._circuitBreaker.openUntil = Date.now() + 30000; // 30 ثانية
        Utils.safeWarn('⚠️ Circuit Breaker مفتوح - تم تعطيل الاتصال مؤقتاً بسبب فشل متكرر');
    },

    /**
     * Circuit Breaker: التحقق من هل هو Circuit Breaker
     */
    _closeCircuitBreaker() {
        if (this._circuitBreaker.isOpen) {
            this._circuitBreaker.isOpen = false;
            this._circuitBreaker.failureCount = 0;
            this._circuitBreaker.openUntil = null;
            Utils.safeLog('✅ تم إغلاق Circuit Breaker - الاتصال متاح مرة أخرى');
        }
    },

    /**
     * Circuit Breaker: التحقق من هل هو Circuit Breaker
     */
    _checkCircuitBreaker() {
        if (this._circuitBreaker.isOpen) {
            if (this._circuitBreaker.openUntil && Date.now() < this._circuitBreaker.openUntil) {
                const remainingTime = Math.ceil((this._circuitBreaker.openUntil - Date.now()) / 1000);
                throw new Error(`Circuit Breaker مفتوح - سيتم إعادة المحاولة بعد ${remainingTime} ثانية`);
            } else {
                // انتهت فترة Circuit Breaker - إغلاقه
                this._closeCircuitBreaker();
            }
        }
    },

    /**
     * Circuit Breaker: التحقق من هل هو Circuit Breaker
     */
    _recordSuccess() {
        this._circuitBreaker.successCount++;
        if (this._circuitBreaker.successCount >= 3) {
            this._closeCircuitBreaker();
            this._circuitBreaker.successCount = 0;
        }
        this._circuitBreaker.failureCount = 0;
    },

    /**
     * Circuit Breaker: التحقق من هل هو Circuit Breaker
     */
    _recordFailure() {
        this._circuitBreaker.failureCount++;
        this._circuitBreaker.lastFailureTime = Date.now();
        this._circuitBreaker.successCount = 0;

        // فتح Circuit Breaker بعد 5 محاولات فاشلة
        if (this._circuitBreaker.failureCount >= 5) {
            this._openCircuitBreaker();
        }
    },

    /**
     * التحقق من هل هو getRequestKey
     */
    _getRequestKey(action, data) {
        const dataStr = JSON.stringify(data || {});
        return `${action}_${dataStr}`;
    },

    /**
     * التحقق من المزامنة في التقدم باستخدام الخادم
     */
    async _processRequestQueue() {
        if (this._isProcessingQueue || this._requestQueue.length === 0) {
            return;
        }

        this._isProcessingQueue = true;

        while (this._requestQueue.length > 0) {
            const request = this._requestQueue.shift();

            const requestKey = this._getRequestKey(request.action, request.data);

            try {
                // التحقق من هل هو Circuit Breaker
                this._checkCircuitBreaker();

                // Throttling: التحقق من هل هو Throttling
                if (this._lastRequestTime) {
                    const timeSinceLastRequest = Date.now() - this._lastRequestTime;
                    const minDelay = 300; // 300ms التحقق من هل هو Throttling (429)
                    if (timeSinceLastRequest < minDelay) {
                        await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastRequest));
                    }
                }
                this._lastRequestTime = Date.now();

                // التحقق من المزامنة في التقدم باستخدام الخادم
                const result = await this._executeRequest(request.action, request.data, request.retryCount || 0);

                // التحقق من هل هو recordSuccess
                this._recordSuccess();

                // التحقق من هل هو pendingPromises
                if (request.pendingPromises) {
                    request.pendingPromises.forEach(({ resolve }) => resolve(result));
                }

            } catch (error) {
                const errorMsg = (error?.message || error?.toString() || String(error) || '').toLowerCase();

                // ✅ لا نزيد عداد الفشل في الحالات المتوقعة حتى لا يفتح Circuit Breaker بشكل خاطئ
                // - عندما يكون Circuit Breaker نفسه هو سبب الرفض
                // - أخطاء الإعداد/التكوين (Apps Script غير مفعل/URL غير صالح/SpreadsheetId غير مضبوط)
                const isCircuitBreakerError = errorMsg.includes('circuit breaker');
                const isConfigError =
                    errorMsg.includes('الاتصال بالخادم غير') ||
                    errorMsg.includes('غير مفعل') ||
                    errorMsg.includes('url غير') ||
                    errorMsg.includes('scripturl') ||
                    errorMsg.includes('spreadsheet') ||
                    errorMsg.includes('معرف google sheets');

                if (!isCircuitBreakerError && !isConfigError) {
                    // التحقق من هل هو recordFailure
                    this._recordFailure();
                }

                // التحقق من هل هو pendingPromises
                if (request.pendingPromises) {
                    request.pendingPromises.forEach(({ reject }) => reject(error));
                }
            } finally {
                // التحقق من هل هو activeRequests
                this._activeRequests.delete(requestKey);
            }
        }

        this._isProcessingQueue = false;
    },

    /**
     * التحقق من هل هو addToQueue
     */
    async _addToQueue(action, data, retryCount = 0) {
        return new Promise((resolve, reject) => {
            const requestKey = this._getRequestKey(action, data);

            // التحقق من هل هو existingRequest
            const existingRequest = this._requestQueue.find(r => this._getRequestKey(r.action, r.data) === requestKey);
            if (existingRequest) {
                // التحقق من هل هو pendingPromises
                existingRequest.pendingPromises.push({ resolve, reject });
                return;
            }

            // التحقق من هل هو activeRequests
            if (this._activeRequests.has(requestKey)) {
                // التحقق من هل هو activeRequest
                const activeRequest = this._activeRequests.get(requestKey);
                if (activeRequest && activeRequest.pendingPromises) {
                    activeRequest.pendingPromises.push({ resolve, reject });
                    return;
                }
            }

            // التحقق من هل هو request
            const request = {
                action,
                data,
                retryCount,
                pendingPromises: [{ resolve, reject }],
                timestamp: Date.now()
            };

            // التحقق من هل هو requestQueue
            this._requestQueue.push(request);
            this._activeRequests.set(requestKey, request);

            // التحقق من هل هو processRequestQueue
            this._processRequestQueue().catch(err => {
                Utils.safeError('فشل المزامنة في التقدم باستخدام الخادم:', err);
            });
        });
    },

    /**
     * التحقق من هل هو executeRequest
     */
    async _executeRequest(action, data, retryCount = 0) {
        if (!AppState.googleConfig.appsScript.enabled || !AppState.googleConfig.appsScript.scriptUrl) {
            return Promise.reject(new Error('الاتصال بالخادم غير مفعّل'));
        }

        const scriptUrl = AppState.googleConfig.appsScript.scriptUrl.trim();

        // التحقق من صلاحية الرابط
        if (!this.isValidGoogleAppsScriptUrl(scriptUrl)) {
            throw new Error('رابط الخادم غير معرّف أو غير صالح');
        }

        try {
            // التحقق من Rate Limiting قبل تنفيذ الطلب
            this._checkRateLimit();

            // التحقق من هل هو CSRF Token
            const csrfToken = this.getOrCreateCSRFToken();

            // التحقق من هل هو payload
            // الخادم غير مفعّل - التحقق من صلاحية الرابط
            const payload = {
                action,
                data,
                csrfToken,
                timestamp: new Date().toISOString()
            };

            // التحقق من هل هو spreadsheetId
            // التحقق من هل هو AppState
            let spreadsheetId = AppState.googleConfig.sheets?.spreadsheetId;

            // التحقق من هل هو data
            if (data && typeof data === 'object' && data.spreadsheetId) {
                spreadsheetId = data.spreadsheetId;
            }

            // التحقق من هل هو spreadsheetId
            if (spreadsheetId && spreadsheetId.trim() !== '' && spreadsheetId !== 'YOUR_SPREADSHEET_ID_HERE') {
                payload.spreadsheetId = spreadsheetId.trim();
                // التحقق من هل هو _spreadsheetId
                payload._spreadsheetId = spreadsheetId.trim();
            } else if (action !== 'initializeSheets') {
                // التحقق من هل هو initializeSheets
                // التحقق من هل هو spreadsheetId
                // التحقق من هل هو actions
                const actionsRequiringSpreadsheetId = [
                    'saveToSheet', 'appendToSheet', 'readFromSheet'
                ];

                // التحقق من هل هو action
                const requiresSpreadsheetId = actionsRequiringSpreadsheetId.includes(action) ||
                    action.startsWith('add') ||
                    action.startsWith('save') ||
                    action.startsWith('update');

                if (requiresSpreadsheetId) {
                    // التحقق من هل هو getSpreadsheetId
                    Utils.safeWarn('فشل المزامنة في التقدم باستخدام الخادم - التحقق من هل هو getSpreadsheetId');
                } else {
                    Utils.safeWarn('فشل المزامنة في التقدم باستخدام الخادم - التحقق من هل هو spreadsheetId');
                }
            }

            // التحقق من هل هو timeout
            // تحديد timeout ديناميكي حسب نوع العملية
            // العمليات الثقيلة (قراءة/كتابة البيانات): 300 ثانية (5 دقائق)
            // العمليات المتوسطة: 180 ثانية (3 دقائق)
            // العمليات العادية: 120 ثانية (2 دقيقة)
            const heavyOperations = [
                'readFromSheet', 'saveToSheet', 'appendToSheet',
                'getAllData', 'syncData', 'initializeSheets',
                'getClinicData', 'getFireEquipmentData', 'getPPEData',
                'getPeriodicInspectionsData', 'getViolationsData',
                'getActionTrackingData', 'getBehaviorMonitoringData',
                'saveOrUpdate', 'getAll', 'import' // إضافة عمليات جديدة
            ];
            const mediumOperations = [
                'getData', 'readData', 'loadData', 'fetchData', 'add', 'update'
            ];
            const isHeavyOperation = heavyOperations.some(op => action.includes(op) || action === op);
            const isMediumOperation = mediumOperations.some(op => action.includes(op) || action === op);

            // زيادة المهل الزمنية بشكل كبير لتجنب مشاكل الاتصال
            const timeoutDuration = isHeavyOperation ? 300000 : (isMediumOperation ? 180000 : 120000); // 300/180/120 ثانية (5/3/2 دقائق)

            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                if (!controller.signal.aborted) {
                    controller.abort();
                }
            }, timeoutDuration);

            let response;
            try {
                // التحقق من هل هو fetch
                // التحقق من هل هو CSRF Token
                // التحقق من هل هو payload
                // التحقق من هل هو headers
                // التحقق من هل هو preflight requests
                response = await fetch(scriptUrl, {
                    method: 'POST',
                    mode: 'cors',
                    credentials: 'omit',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8'
                        // التحقق من هل هو 'X-CSRF-Token'
                        // التحقق من هل هو CSRF Token
                        // التحقق من هل هو payload.csrfToken
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                }).catch(error => {
                    // التحقق من هل هو AbortController
                    if (error.name === 'AbortError') {
                        throw new Error('فشل المزامنة في التقدم باستخدام الخادم - التحقق من هل هو AbortError');
                    }
                    // التحقق من هل هو Chrome Extensions
                    if (error.message && (
                        error.message.includes('runtime.lastError') ||
                        error.message.includes('message port closed') ||
                        error.message.includes('Receiving end does not exist') ||
                        error.message.includes('Could not establish connection') ||
                        error.message.includes('Extension context invalidated')
                    )) {
                        // التحقق من هل هو Chrome Extensions
                        throw new Error('فشل المزامنة في التقدم باستخدام الخادم - التحقق من هل هو Chrome Extensions');
                    }
                    throw error;
                });

                // التحقق من هل هو timeout
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            } catch (fetchError) {
                // التحقق من هل هو timeout
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                // التحقق من هل هو connection timeout
                const errorMsg = fetchError.message || fetchError.toString() || '';
                const errorStr = errorMsg.toLowerCase();
                
                // ✅ إصلاح: معالجة أخطاء الشهادة (Certificate errors)
                const isCertificateError = 
                    errorStr.includes('err_cert_authority_invalid') ||
                    errorStr.includes('cert_authority_invalid') ||
                    errorStr.includes('certificate') ||
                    errorStr.includes('cert authority') ||
                    errorStr.includes('ssl') ||
                    errorStr.includes('tls') ||
                    errorStr.includes('net::err_cert') ||
                    (fetchError.name && fetchError.name.toLowerCase().includes('certificate')) ||
                    (fetchError.code && (fetchError.code === 'CERT_AUTHORITY_INVALID' || fetchError.code === 'ERR_CERT_AUTHORITY_INVALID'));
                
                if (isCertificateError) {
                    const timeStr = new Date().toLocaleTimeString('ar-EG');
                    throw new Error(`⚠️ خطأ في شهادة الأمان (SSL/TLS)!\n` +
                        `الوقت: ${timeStr}\n` +
                        `يرجى التحقق من:\n` +
                        `1. إعدادات التاريخ والوقت في النظام\n` +
                        `2. إعدادات جدار الحماية ومضاد الفيروسات\n` +
                        `3. إعدادات المتصفح (قد تحتاج لتحديث المتصفح)\n` +
                        `4. الاتصال بالإنترنت (قد تكون هناك مشكلة في الشبكة)`);
                }
                
                // معالجة أخطاء CORS بشكل خاص
                // فحص شامل لجميع أنواع أخطاء CORS
                const isCorsError = 
                    errorStr.includes('cors') ||
                    errorStr.includes('cross-origin request blocked') ||
                    errorStr.includes('access-control-allow-origin') ||
                    errorStr.includes('has been blocked by cors policy') ||
                    errorStr.includes('no \'access-control-allow-origin\' header') ||
                    errorStr.includes('same origin policy') ||
                    errorStr.includes('same-origin policy') ||
                    (errorStr.includes('networkerror') && (errorStr.includes('fetch') || errorStr.includes('resource'))) ||
                    (fetchError.name === 'TypeError' && errorStr.includes('failed to fetch')) ||
                    (fetchError.name === 'NetworkError') ||
                    (errorStr.includes('err_failed') && (errorStr.includes('script.google.com') || errorStr.includes('google.com/macros'))) ||
                    (fetchError.message && fetchError.message.toLowerCase().includes('cors')) ||
                    (fetchError.message && fetchError.message.toLowerCase().includes('cross-origin')) ||
                    (fetchError.message && fetchError.message.includes('Access-Control-Allow-Origin'));
                
                if (isCorsError) {
                    // CORS error - قد يكون بسبب إعدادات الخادم
                    const timeStr = new Date().toLocaleTimeString('ar-EG');
                    throw new Error(`⚠️ فشل الاتصال بالخادم بسبب CORS!\n` +
                        `الوقت: ${timeStr}\n` +
                        `يرجى التحقق من إعدادات الخادم والرابط والصلاحيات (مثل Who has access: Anyone).`);
                }
                
                if (errorMsg.includes('ERR_CONNECTION_TIMED_OUT') ||
                    errorMsg.includes('CONNECTION_TIMED_OUT') ||
                    errorMsg.includes('timeout') ||
                    errorMsg.includes('timed out') ||
                    fetchError.name === 'AbortError' ||
                    fetchError.message?.includes('aborted')) {

                    // إعادة المحاولة في حالة timeout
                    // زيادة عدد المحاولات للعمليات الثقيلة
                    let maxRetries = 3;
                    if (isHeavyOperation) {
                        maxRetries = 5; // 5 محاولات للعمليات الطويلة
                    }

                    if (retryCount < maxRetries) {
                        // تأخير تصاعدي: 2s, 4s, 8s, 16s, 32s
                        const delay = Math.pow(2, retryCount + 1) * 1000;
                        Utils.safeLog(`⏱️ انتهت مهلة الاتصال للخادم (${Math.round(timeoutDuration / 1000)}s). إعادة المحاولة بعد ${delay / 1000} ثانية (المحاولة ${retryCount + 1}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, delay));

                        // إعادة المحاولة مع أمر بزيادة المهلة داخلياً إذا أمكن
                        return this._executeRequest(action, data, retryCount + 1);
                    }

                    const timeStr = new Date().toLocaleString('ar-SA');
                    const timeoutSeconds = Math.round(timeoutDuration / 1000);
                    const timeoutMinutes = Math.round(timeoutSeconds / 60);
                    const operationType = isHeavyOperation ? 'عملية ثقيلة' : (isMediumOperation ? 'عملية متوسطة' : 'عملية عادية');
                    
                    // رسالة خطأ مبسطة وأكثر وضوحاً
                    // التحقق من إذا كانت هذه عملية مراقبة (قراءة بسيطة من Users بدون محاولات إعادة)
                    const isMonitoringCheck = action === 'readFromSheet' && 
                                             data?.sheetName === 'Users' && 
                                             retryCount === 0;
                    
                    if (isMonitoringCheck) {
                        // رسالة مبسطة لفحوصات المراقبة
                        throw new Error(`⚠️ فقدان الاتصال بالخادم!\n\n` +
                            `الخطأ: انتهت مهلة الاتصال\n` +
                            `الوقت: ${timeStr}\n\n` +
                            `يرجى التحقق من إعدادات الخادم والاتصال بالإنترنت.`);
                    } else {
                        // رسالة مفصلة للعمليات الأخرى
                        throw new Error(`⚠️ فقدان الاتصال بالخادم!\n\n` +
                            `الخطأ: انتهت مهلة الاتصال (${timeoutSeconds} ثانية / ${timeoutMinutes} دقيقة)\n` +
                            `نوع العملية: ${operationType}\n` +
                            `الوقت: ${timeStr}\n\n` +
                            `يرجى التحقق من إعدادات الخادم والاتصال بالإنترنت، وتحديث الصفحة وإعادة المحاولة.`);
                    }
                }

                // التحقق من هل هو Chrome Extensions
                if (fetchError.message && (
                    fetchError.message.includes('runtime.lastError') ||
                    fetchError.message.includes('message port closed') ||
                    fetchError.message.includes('Receiving end does not exist') ||
                    fetchError.message.includes('Could not establish connection') ||
                    fetchError.message.includes('Extension context invalidated')
                )) {
                    // التحقق من هل هو Chrome Extensions
                    throw new Error('فشل المزامنة في التقدم باستخدام الخادم - التحقق من هل هو Chrome Extensions');
                }

                throw fetchError;
            }

            // التحقق من هل هو response
            if (!response || !response.ok) {
                // التحقق من هل هو 429 Too Many Requests
                if (response?.status === 429) {
                    const maxRetries = 3;
                    if (retryCount < maxRetries) {
                        // التحقق من هل هو Exponential backoff: 2s, 4s, 8s
                        const delay = Math.pow(2, retryCount + 1) * 1000;
                        Utils.safeWarn(`فشل المزامنة في التقدم باستخدام الخادم - التحقق من هل هو 429 Too Many Requests - التحقق من هل هو Exponential backoff: 2s, 4s, 8s ${delay}ms (المحاولة ${retryCount + 1}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return this._executeRequest(action, data, retryCount + 1);
                    } else {
                        throw new Error('فشل المزامنة في التقدم باستخدام الخادم - التحقق من هل هو Exponential backoff: 2s, 4s, 8s - التحقق من هل هو maxRetries');
                    }
                }

                // التحقق من هل هو errorMessage
                let errorMessage = `HTTP error! status: ${response?.status || 0}`;
                try {
                    const errorData = await response.text();
                    if (errorData && errorData.trim() !== '') {
                        try {
                            const parsed = JSON.parse(errorData);
                            errorMessage = parsed.message || errorMessage;
                        } catch (parseError) {
                            // التحقق من هل هو parseError
                            errorMessage = errorData.substring(0, 200);
                        }
                    }
                } catch (e) {
                    // التحقق من هل هو e
                }

                throw new Error(errorMessage);
            }

            const resultText = await response.text();

            if (!resultText || resultText.trim() === '') {
                throw new Error('فشل المزامنة في التقدم باستخدام الخادم - التحقق من هل هو resultText');
            }

            let result;
            try {
                result = JSON.parse(resultText);
            } catch (e) {
                // التحقق من هل هو e
                throw new Error(`فشل المزامنة في التقدم باستخدام الخادم - التحقق من هل هو resultText: ${resultText.substring(0, 200)}`);
            }

            if (!result || typeof result !== 'object') {
                throw new Error('فشل المزامنة في التقدم باستخدام الخادم - التحقق من هل هو result');
            }

            if (result.success === false) {
                // التحقق من هل هو errorMessage
                const errorMessage = result.message || 'فشل المزامنة في التقدم باستخدام الخادم - التحقق من هل هو errorMessage';
                if (errorMessage.includes('فشل المزامنة في التقدم باستخدام الخادم - التحقق من هل هو errorMessage')) {
                    // التحقق من هل هو spreadsheetId
                    // التحقق من هل هو getSpreadsheetId
                    // التحقق من هل هو fallback
                    Utils.safeWarn('فشل المزامنة في التقدم باستخدام الخادم - التحقق من هل هو spreadsheetId');
                    // التحقق من هل هو console
                    throw new Error(errorMessage);
                }
                throw new Error(errorMessage);
            }

            return result;
        } catch (error) {
            // التحقق من هل هو Chrome extensions
            const chromeExtensionErrors = [
                'runtime.lastError',
                'message port closed',  // التحقق من هل هو message port closed
                'Extension context invalidated',  // التحقق من هل هو Extension context invalidated
                'Receiving end does not exist',  // التحقق من هل هو Receiving end does not exist
                'Could not establish connection',  // التحقق من هل هو Could not establish connection
                'The message port closed before a response was received',  // التحقق من هل هو The message port closed before a response was received
                'Unchecked runtime.lastError'
            ];

            const errorMessage = error?.message || error?.toString() || '';
            const isChromeExtensionError = chromeExtensionErrors.some(err =>
                errorMessage.includes(err)
            );

            if (isChromeExtensionError) {
                // التحقق من هل هو Chrome extensions
                // فقط نعيد الخطأ بدون تسجيل
                return Promise.reject(new Error('فشل المزامنة في التقدم باستخدام الخادم - التحقق من هل هو Chrome extensions'));
            }

            // تسجيل الخطأ فقط إذا لم يكن خطأ متوقع أو عندما يكون الخادم مفعّلاً
            const errorMsg = error.message || 'خطأ غير معروف';
            const isGoogleAppsScriptEnabled = AppState.googleConfig?.appsScript?.enabled && AppState.googleConfig?.appsScript?.scriptUrl;
            
            // تجاهل أخطاء getPublicIP بصمت (هذه عملية غير حرجة)
            const isGetPublicIPError = action === 'getPublicIP' || 
                errorMsg.includes('getting public IP') || 
                errorMsg.includes('getPublicIP') ||
                errorMsg.includes('Server error while getting public IP');
            
            const isExpectedError = isGetPublicIPError ||
                errorMsg.includes('معرف المصدر غير محدد') ||
                errorMsg.includes('الاتصال بالخادم غير مفعّل') ||
                errorMsg.includes('الاتصال بالخادم') ||
                (!isGoogleAppsScriptEnabled && (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')));

            // لا نسجل الأخطاء إذا كان الخادم غير مفعّل أو إذا كان الخطأ متوقعاً
            // تجاهل أخطاء getPublicIP تماماً
            if (!isExpectedError && isGoogleAppsScriptEnabled && !isGetPublicIPError) {
                // Extract meaningful error message instead of logging raw object
                const displayError = error?.message || error?.toString() || JSON.stringify(error) || 'خطأ غير معروف';
                
                // Suppress detailed CORS error logging (handled with user-friendly message)
                if (!displayError.includes('CORS') && 
                    !displayError.includes('Cross-Origin Request Blocked') &&
                    !displayError.includes('Access-Control-Allow-Origin') &&
                    !displayError.includes('Same Origin Policy')) {
                    // استخدام safeError مع التحقق الإضافي (تخطي CORS errors التي يتم التعامل معها)
                    Utils.safeError('❌ خطأ في طلب الخادم:', displayError);
                }
            }
            // إذا كان الخطأ متوقعاً أو الخادم غير مفعّل، لا نسجل أي شيء

            // استخدام رسالة الخطأ من الكائن
            const finalErrorMsg = errorMsg || 'خطأ غير معروف';

            // منطق إعادة المحاولة
            const maxRetries = 2;
            if (retryCount < maxRetries) {
                // إعادة المحاولة فقط للأخطاء الشبكية
                if (errorMsg && (
                    errorMsg.includes('Failed to fetch') ||
                    errorMsg.includes('NetworkError') ||
                    errorMsg.includes('Network request failed') ||
                    errorMsg.includes('ERR_CONNECTION_TIMED_OUT') ||
                    errorMsg.includes('CONNECTION_TIMED_OUT') ||
                    errorMsg.includes('timeout') ||
                    errorMsg.includes('timed out') ||
                    errorMsg.includes('429') ||
                    errorMsg.includes('Too Many Requests')
                )) {
                    const delay = Math.pow(2, retryCount + 1) * 1000; // 2s, 4s
                    Utils.safeLog(`🔄 إعادة المحاولة بعد ${delay}ms (المحاولة ${retryCount + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return this._executeRequest(action, data, retryCount + 1);
                }
            }

            // التحقق من هل هو errorMsg
            let finalErrorMessage = errorMsg;

            // التحقق من هل هو connection timeout
            if (errorMsg && (
                errorMsg.includes('ERR_CONNECTION_TIMED_OUT') ||
                errorMsg.includes('CONNECTION_TIMED_OUT') ||
                (errorMsg.includes('timeout') && errorMsg.includes('connection'))
            )) {
                finalErrorMessage = 'انتهت مهلة الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت وإعدادات الخادم.';
            } else if (errorMsg && (
                errorMsg.includes('Failed to fetch') ||
                errorMsg.includes('NetworkError') ||
                errorMsg.includes('CORS') ||
                errorMsg.includes('blocked by CORS policy') ||
                errorMsg.includes('Access-Control-Allow-Origin') ||
                errorMsg.includes('Cross-Origin Request Blocked') ||
                errorMsg.includes('Same Origin Policy') ||
                error.name === 'TypeError' ||
                errorMsg.includes('Network request failed') ||
                errorMsg.includes('فشل الاتصال بالخادم بسبب CORS')
            )) {
                if (errorMsg.includes('فشل الاتصال بالخادم بسبب CORS')) {
                    finalErrorMessage = errorMsg;
                } else {
                    finalErrorMessage = '⚠️ فشل الاتصال بالخادم بسبب CORS. يرجى التحقق من إعدادات الخادم والصلاحيات.';
                }
            } else if (errorMsg && (
                errorMsg.includes('429') ||
                errorMsg.includes('Too Many Requests')
            )) {
                // التحقق من هل هو 429
                finalErrorMessage = 'فشل المزامنة (429 - طلبات كثيرة). يرجى الانتظار وإعادة المحاولة.';
            } else if (errorMsg && errorMsg.includes('HTTP error')) {
                finalErrorMessage = 'فشل المزامنة (خطأ HTTP). يرجى التحقق من الخادم وإعادة المحاولة.';
            } else if (errorMsg && (errorMsg.includes('AbortError') || errorMsg.includes('aborted'))) {
                finalErrorMessage = 'انتهت مهلة الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت وإعدادات الخادم.';
            }

            return Promise.reject(new Error(finalErrorMessage));
        }
    },

    /**
     * التحقق من هل هو sendToAppsScript
     */
    async sendToAppsScript(action, data, retryCount = 0) {
        // التحقق من هل هو Circuit Breaker
        try {
            this._checkCircuitBreaker();
        } catch (error) {
            // التحقق من هل هو Circuit Breaker
            const localData = this.getLocalData(action, data);
            if (localData !== null) {
                Utils.safeLog(`⚠️ Circuit Breaker مفتوح - تم تخطي العملية: ${action}`);
                return localData;
            }
            return Promise.reject(error);
        }

        // التحقق من هل هو addToQueue
        return this._addToQueue(action, data, retryCount);
    },

    /**
     * دوال ربط ومعالجة الخادم (wrapper حول sendToAppsScript)
     * التعامل مع البيانات والعمليات المرتبطة بالنماذج وقواعد البيانات بشكل آمن ومستقر.
     *
     * الوظائف تشمل:
     * - إرسال واستقبال البيانات بين الويب والخادم
     * - معالجة النتائج مع التحقق من الأخطاء
     * - إعادة المحاولة عند الفشل (Retry + Circuit Breaker)
     * - دعم حفظ البيانات والمزامنة التلقائية
     */
    async sendRequest(requestData) {
        const { action, data } = requestData;
        if (!action) {
            throw new Error('يجب إدخال action في الطلب');
        }

        // Actions التي يمكن cache-ها (عمليات قراءة فقط)
        const cacheableActions = ['readFromSheet', 'getData', 'getSafetyTeamMembers',
            'getSafetyTeamMember', 'getOrganizationalStructure', 'getJobDescription',
            'getSafetyTeamKPIs', 'getSafetyHealthManagementSettings', 'getActionTrackingSettings',
            'getAllActionTracking', 'getActionTracking'];

        const isCacheable = cacheableActions.includes(action);

        // محاولة الحصول من الـ cache أولاً
        if (isCacheable) {
            const cacheKey = `${action}_${JSON.stringify(data || {})}`;
            const cached = this._getCachedData(cacheKey);
            if (cached !== null) {
                if (AppState?.debugMode) Utils?.safeLog(`✅ تم استخدام البيانات من الـ cache للعملية: ${action}`);
                return cached;
            }
        }

        // إذا لم يكن الخادم مفعّلاً: محاولة Supabase أولاً ثم البيانات المحلية
        if (!AppState.googleConfig?.appsScript?.enabled || !AppState.googleConfig?.appsScript?.scriptUrl) {
            if (AppState.useSupabaseBackend === true && typeof SupabaseIntegration !== 'undefined' && typeof SupabaseIntegration.sendRequest === 'function') {
                return await SupabaseIntegration.sendRequest(requestData);
            }
            const localData = this.getLocalData(action, data);
            if (localData !== null) {
                Utils.safeLog(`✅ تم استخدام البيانات المحلية من التخزين المؤقت للعملية: ${action}`);
                return localData;
            }
            throw new Error('الاتصال بقاعدة البيانات غير مفعّل. يرجى تفعيل الخادم (Supabase أو الرابط) من الإعدادات.');
        }

        try {
            // تنفيذ الطلب عبر sendToAppsScript
            const result = await this.sendToAppsScript(action, data || {});

            // حفظ في الـ cache إذا كانت العملية قابلة للـ cache
            if (isCacheable && result && result.success !== false) {
                const cacheKey = `${action}_${JSON.stringify(data || {})}`;
                this._setCachedData(cacheKey, result);
            }

            // في حال رجع الرد ولم يكن ناجحاً
            if (result && typeof result === 'object') {
                if (result.success === false) {
                    const localData = this.getLocalData(action, data);
                    if (localData !== null) {
                        Utils.safeLog(`تم استخدام البيانات المحلية كبديل عند فشل المزامنة: ${action}`);
                        return localData;
                    }
                    throw new Error(result.message || 'فشل في المزامنة مع الخادم');
                }
            }

            // Save successful data to local storage as cache
            this.saveLocalData(action, result);

            return result;
        } catch (error) {
            // معالجة الأخطاء وإرجاع رسالة واضحة
            const errorMessage = error.message || 'حدث خطأ غير معروف أثناء تنفيذ الطلب';

            // Check if it's an "Action not recognized" error from the backend
            if (errorMessage.includes('الإجراء غير معروف') || errorMessage.includes('Action not recognized') || errorMessage.includes('ACTION_NOT_RECOGNIZED')) {
                // Backend is enabled but the action is not recognized
                let detailedMessage = errorMessage;

                // Add helpful context for Safety Health Management actions
                if (action.includes('SafetyTeam') || action.includes('SafetyHealthManagement') || action.includes('Organizational')) {
                    detailedMessage = `Error while processing request for action "${action}". Check Web App deployment and script permissions.`;
                }

                // فشل الطلب من Apps Script وتم إرجاع رسالة خطأ
                Utils.safeError(`Request Failed (${action}): ${detailedMessage}`);
                throw new Error(detailedMessage);
            }

            // Try local data as fallback if backend fails due to network/connection issues
            if (errorMessage.includes('الخادم غير متاح') ||
                errorMessage.includes('Failed to fetch') ||
                errorMessage.includes('NetworkError') ||
                errorMessage.includes('CORS') ||
                errorMessage.includes('blocked by CORS policy') ||
                errorMessage.includes('Access-Control-Allow-Origin') ||
                errorMessage.includes('429') ||
                errorMessage.includes('Too Many Requests') ||
                errorMessage.includes('فشل الاتصال بالشبكة') ||
                errorMessage.includes('Network request failed')) {
                const localData = this.getLocalData(action, data);
                if (localData !== null) {
                    Utils.safeLog(`تم استخدام البيانات المحلية كبديل عند فشل الاتصال: ${action} (الخطأ: ${errorMessage.substring(0, 50)})`);
                    return localData;
                }
            }

            // استدعاء دوال الطوارئ والنسخ الاحتياطي
            // في حال حدوث خطأ أثناء تنفيذ الطلب سيتم تسجيله عبر safeError
            // ثم يتم إعادة رمي الخطأ ليتم التعامل معه في المستوى الأعلى

            // تقليل الضوضاء في الكونسول - Circuit Breaker أخطاء متوقعة
            if (errorMessage && errorMessage.includes('Circuit Breaker مفتوح')) {
                // تسجيل كتحذير بدلاً من خطأ، وتقليل التكرار
                const lastCircuitBreakerLog = this._lastCircuitBreakerLog || {};
                const now = Date.now();
                if (!lastCircuitBreakerLog[action] || (now - lastCircuitBreakerLog[action] > 10000)) {
                    Utils.safeWarn(`⚠️ Circuit Breaker مفتوح - سيتم إعادة المحاولة بعد فترة (${action})`);
                    if (!this._lastCircuitBreakerLog) this._lastCircuitBreakerLog = {};
                    this._lastCircuitBreakerLog[action] = now;
                }
            } else {
                Utils.safeError(`sendRequest (${action}):`, errorMessage);
            }
            throw new Error(errorMessage);
        }
    },

    /**
     * جلب البيانات المحلية من localStorage
     */
    getLocalData(action, data) {
        try {
            const storageKey = `hse_local_${action}`;
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Check if data is still valid (not older than 24 hours)
                if (parsed.timestamp && (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000)) {
                    return parsed.data;
                }
            }
        } catch (error) {
            Utils.safeWarn('خطأ في قراءة البيانات المحلية من localStorage:', error);
        }
        return null;
    },

    /**
     * حفظ البيانات المحلية في localStorage
     */
    saveLocalData(action, result) {
        try {
            const storageKey = `hse_local_${action}`;
            const dataToStore = {
                data: result,
                timestamp: Date.now()
            };
            localStorage.setItem(storageKey, JSON.stringify(dataToStore));
        } catch (error) {
            Utils.safeWarn('خطأ في حفظ البيانات المحلية في localStorage:', error);
        }
    },

    /**
     * قراءة البيانات من الخادم
     */
    async readFromSheets(sheetName, timeout = 30000) {
        // التحقق من تفعيل الخادم قبل إجراء الطلب
        if (!AppState.googleConfig?.appsScript?.enabled || !AppState.googleConfig?.appsScript?.scriptUrl) {
            // إذا لم يكن الخادم مفعّلاً، نعيد مصفوفة فارغة بدون إظهار أخطاء
            return [];
        }

        // استخدام timeout للطلب
        try {
            const payload = {
                action: 'readFromSheet',
                data: {
                    sheetName: sheetName
                }
            };

            if (AppState.googleConfig.sheets?.spreadsheetId) {
                payload.data.spreadsheetId = AppState.googleConfig.sheets.spreadsheetId;
            }

            // إعداد timeout للطلب
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`انتهت مهلة قراءة البيانات من ${sheetName}`)), timeout);
            });

            const requestPromise = this.sendRequest(payload);

            const result = await Promise.race([requestPromise, timeoutPromise]);

            if (result && result.success && result.data) {
                return result.data;
            } else if (result && result.success && Array.isArray(result)) {
                return result;
            }

            return [];
        } catch (error) {
            // قمع الأخطاء المتوقعة (عندما يكون الخادم غير مفعّل أو الورقة غير موجودة)
            const errorMsg = error.message || 'خطأ غير معروف';
            const isGoogleAppsScriptEnabled = AppState.googleConfig?.appsScript?.enabled && AppState.googleConfig?.appsScript?.scriptUrl;

            // قائمة الأخطاء المتوقعة التي لا يجب عرضها للمستخدم
            const isExpectedError = !isGoogleAppsScriptEnabled ||
                errorMsg.includes('معرف المصدر غير محدد') ||
                errorMsg.includes('الاتصال بالخادم غير مفعّل') ||
                errorMsg.includes('انتهت مهلة قراءة البيانات') ||
                errorMsg.includes('timeout') ||
                errorMsg.includes('Timeout') ||
                errorMsg.includes('not found') ||
                errorMsg.includes('غير موجود') ||
                errorMsg.includes('Failed to fetch') ||
                errorMsg.includes('NetworkError') ||
                errorMsg.includes('Network request failed');

            // عرض التحذير فقط للأخطاء غير المتوقعة وفي وضع التطوير
            if (!isExpectedError && AppState.debugMode) {
                Utils.safeWarn(`⚠️ فشل قراءة البيانات من ${sheetName}:`, error.message || error);
            }
            return [];
        }
    },


    /**
     * جلب البيانات من الخادم
     * sendToAppsScript تم استبدالها بـ sendRequest
     */
    async fetchData(action, data = {}) {
        try {
            const result = await this.sendToAppsScript(action, data);
            return result;
        } catch (error) {
            // تجاهل أخطاء Circuit Breaker والخادم غير المفعل
            const errorMsg = String(error?.message || '').toLowerCase();
            if (errorMsg.includes('circuit breaker') ||
                errorMsg.includes('الاتصال بالخادم غير مفعل') ||
                errorMsg.includes('غير مفعل')) {
                // هذه أخطاء متوقعة - إعادة رميها بدون تسجيل
                throw error;
            }
            // تسجيل الأخطاء الأخرى فقط
            Utils.safeError('Error in fetchData:', error);
            throw error;
        }
    },

    /**
     * استدعاء الدالة في الخادم
     * wrapper لـ sendRequest
     * @param {string} action - اسم الإجراء
     * @param {object} data - البيانات المرسلة
     * @returns {Promise<object>} - النتيجة المستلمة
     */
    async callBackend(action, data = {}) {
        try {
            return await this.sendRequest({ action, data });
        } catch (error) {
            Utils.safeError(`خطأ في callBackend (${action}):`, error);
            throw error;
        }
    },

    /**
     * رفع ملف إلى Google Drive من Base64 أو نص
     * @param {string} base64Data - البيانات بصيغة Base64
     * @param {string} fileName - اسم الملف
     * @param {string} mimeType - نوع الملف
     * @param {string} moduleName - اسم الوحدة (اختياري)
     * @returns {Promise<object>} {success, fileId, directLink, shareableLink}
     */
    async uploadFileToDrive(base64Data, fileName, mimeType, moduleName = null) {
        try {
            if (!base64Data || !fileName || !mimeType) {
                throw new Error('معاملات غير كافية. يجب توفير base64Data, fileName, و mimeType');
            }

            if (typeof Loading !== 'undefined' && Loading.show) {
                Loading.show('جاري رفع الملف إلى Google Drive...');
            }

            const result = await this.sendToAppsScript('uploadFileToDrive', {
                base64Data: base64Data,
                fileName: fileName,
                mimeType: mimeType,
                moduleName: moduleName
            });

            if (typeof Loading !== 'undefined' && Loading.hide) {
                Loading.hide();
            }

            if (result && result.success) {
                return {
                    success: true,
                    fileId: result.fileId,
                    directLink: result.directLink,
                    shareableLink: result.shareableLink,
                    fileName: result.fileName
                };
            } else {
                throw new Error(result?.message || 'فشل رفع الملف إلى Google Drive');
            }
        } catch (error) {
            if (typeof Loading !== 'undefined' && Loading.hide) {
                Loading.hide();
            }
            if (typeof Utils !== 'undefined' && Utils.safeError) {
                Utils.safeError('خطأ في رفع الملف إلى Google Drive:', error);
            }
            throw error;
        }
    },

    /**
     * رفع عدة ملفات إلى Google Drive
     * @param {Array} files - مصفوفة الملفات [{base64Data, fileName, mimeType}, ...]
     * @param {string} moduleName - اسم الوحدة (اختياري)
     * @returns {Promise<object>} {success, uploadedFiles, failedFiles}
     */
    async uploadMultipleFilesToDrive(files, moduleName = null) {
        try {
            if (!Array.isArray(files) || files.length === 0) {
                throw new Error('يجب توفير مصفوفة من الملفات');
            }

            if (typeof Loading !== 'undefined' && Loading.show) {
                Loading.show(`جاري رفع ${files.length} ملف إلى Google Drive...`);
            }

            const result = await this.sendToAppsScript('uploadFileToDrive', {
                files: files,
                moduleName: moduleName
            });

            if (typeof Loading !== 'undefined' && Loading.hide) {
                Loading.hide();
            }

            return result;
        } catch (error) {
            if (typeof Loading !== 'undefined' && Loading.hide) {
                Loading.hide();
            }
            if (typeof Utils !== 'undefined' && Utils.safeError) {
                Utils.safeError('خطأ في رفع الملفات إلى Google Drive:', error);
            }
            throw error;
        }
    },

    /**
     * معالجة attachments - تحويل Base64 إلى روابط Google Drive
     * @param {Array} attachments - مصفوفة المرفقات
     * @param {string} moduleName - اسم الوحدة
     * @returns {Promise<Array>} مصفوفة المرفقات مع روابط Google Drive بدلاً من Base64
     */
    async processAttachments(attachments, moduleName) {
        try {
            if (!Array.isArray(attachments) || attachments.length === 0) {
                return [];
            }

            const processedAttachments = [];

            for (const attachment of attachments) {
                // إذا كان المرفق يحتوي على رابط موجود (لا يحتاج رفع)
                if (attachment.directLink || attachment.shareableLink || attachment.cloudLink) {
                    processedAttachments.push({
                        id: attachment.id || (typeof Utils !== 'undefined' && Utils.generateId ? Utils.generateId('ATT') : 'ATT_' + Date.now()),
                        name: attachment.name || 'attachment',
                        type: attachment.type || 'application/octet-stream',
                        directLink: attachment.directLink || attachment.shareableLink || attachment.cloudLink?.url,
                        shareableLink: attachment.shareableLink || attachment.cloudLink?.url || attachment.directLink,
                        fileId: attachment.fileId || attachment.cloudLink?.id,
                        size: attachment.size || 0,
                        uploadedAt: attachment.uploadedAt || new Date().toISOString()
                    });
                    continue;
                }

                // إذا كان المرفق يحتوي على Base64، ارفعه إلى Google Drive
                if (attachment.data || attachment.base64Data) {
                    try {
                        const uploadResult = await this.uploadFileToDrive(
                            attachment.data || attachment.base64Data,
                            attachment.name || 'attachment',
                            attachment.type || 'application/octet-stream',
                            moduleName
                        );

                        if (uploadResult.success) {
                            processedAttachments.push({
                                id: attachment.id || (typeof Utils !== 'undefined' && Utils.generateId ? Utils.generateId('ATT') : 'ATT_' + Date.now()),
                                name: uploadResult.fileName || attachment.name,
                                type: attachment.type || 'application/octet-stream',
                                directLink: uploadResult.directLink,
                                shareableLink: uploadResult.shareableLink,
                                fileId: uploadResult.fileId,
                                size: attachment.size || 0,
                                uploadedAt: new Date().toISOString()
                            });
                        } else {
                            // في حالة الفشل، نحتفظ بالمرفق بصيغة Base64
                            if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                                Utils.safeWarn('فشل رفع المرفق إلى Google Drive:', attachment.name);
                            }
                            processedAttachments.push(attachment);
                        }
                    } catch (uploadError) {
                        if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                            Utils.safeWarn('خطأ في رفع المرفق إلى Google Drive:', uploadError);
                        }
                        // في حالة الخطأ، نحتفظ بالمرفق بصيغة Base64
                        processedAttachments.push(attachment);
                    }
                } else {
                    // إذا لم يكن هناك Base64 أو رابط، نحتفظ بالمرفق كما هو
                    processedAttachments.push(attachment);
                }
            }

            return processedAttachments;
        } catch (error) {
            if (typeof Utils !== 'undefined' && Utils.safeError) {
                Utils.safeError('خطأ في معالجة المرفقات:', error);
            }
            // في حالة الخطأ، نعيد المرفقات الأصلية
            return attachments;
        }
    },

    /**
     * حفظ البيانات في الخادم
     */
    async saveToSheets(sheetName, data) {
        if (!AppState.googleConfig.appsScript.enabled) {
            Utils.safeWarn('الاتصال بالخادم غير مفعّل');
            return { success: false, message: 'الاتصال بالخادم غير مفعّل' };
        }

        try {
            const preparedData = this.prepareSheetPayload(sheetName, data);
            const result = await this.sendToAppsScript('saveToSheet', {
                sheetName,
                data: preparedData
            });
            return result;
        } catch (error) {
            Utils.safeWarn('فشل حفظ البيانات في الخادم:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * إضافة البيانات الجديدة إلى الخادم (بدون استبدال)
     */
    async appendToSheets(sheetName, data) {
        if (!AppState.googleConfig.appsScript.enabled || !AppState.googleConfig.appsScript.scriptUrl) {
            Utils.safeWarn('الاتصال بالخادم غير مفعّل');
            return { success: false, message: 'الاتصال بالخادم غير مفعّل' };
        }

        try {
            // إضافة spreadsheetId إذا كان موجوداً في الإعدادات
            const preparedData = this.prepareSheetPayload(sheetName, data);
            const payload = {
                sheetName,
                data: preparedData
            };

            if (AppState.googleConfig.sheets.spreadsheetId) {
                payload.spreadsheetId = AppState.googleConfig.sheets.spreadsheetId;
            }

            const result = await this.sendToAppsScript('appendToSheet', payload);

            if (result && result.success) {
                Utils.safeLog(`✅ تم إضافة البيانات إلى الخادم: ${sheetName}`);
            } else {
                Utils.safeWarn(`⚠️ فشل إضافة البيانات إلى الخادم: ${sheetName}:`, result?.message || 'خطأ غير معروف');
            }

            return result;
        } catch (error) {
            Utils.safeWarn('⚠️ فشل إضافة البيانات إلى الخادم:', error);
            return { success: false, message: error.message };
        }
    },

    async syncUsers(force = false) {
        if (!AppState.googleConfig.appsScript.enabled || !AppState.googleConfig.appsScript.scriptUrl) {
            return false;
        }

        // إيقاف نظام عدم النشاط أثناء مزامنة المستخدمين
        let inactivityWasPaused = false;
        if (typeof InactivityManager !== 'undefined' && AppState.currentUser) {
            inactivityWasPaused = InactivityManager.isPaused;
            if (!inactivityWasPaused) {
                InactivityManager.pause('مزامنة المستخدمين مع الخادم');
            }
        }

        // التحقق من المزامنة الجارية
        if (this.isSyncing('users')) {
            Utils.safeLog('⏳ مزامنة المستخدمين جارية بالفعل، في انتظار اكتمالها...');
            // انتظار المزامنة الجارية (بحد أقصى 30 ثانية)
            const maxWait = 30000;
            const startWait = Date.now();
            while (this.isSyncing('users') && (Date.now() - startWait) < maxWait) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            if (this.isSyncing('users')) {
                Utils.safeWarn('⚠️ انتهت مهلة انتظار المزامنة الجارية');
                // إعادة تشغيل نظام عدم النشاط
                if (typeof InactivityManager !== 'undefined' && AppState.currentUser && !inactivityWasPaused) {
                    InactivityManager.resume();
                }
                return false;
            }
        }

        const now = Date.now();
        const lastSync = AppState.syncMeta?.users || 0;
        const hasUsers = Array.isArray(AppState.appData.users) && AppState.appData.users.length > 0;
        const CACHE_TTL = 2 * 60 * 1000; // 2 دقيقة - محسّن ليتناسب مع فترة المزامنة

        if (!force && hasUsers && (now - lastSync) < CACHE_TTL) {
            Utils.safeLog('✅ البيانات موجودة في الكاش، لا حاجة للمزامنة');
            return true;
        }

        // تعيين حالة المزامنة
        this._setSyncState('users', true);

        // مسح Cache القديم من localStorage
        Utils.safeLog('🔄 مسح Cache القديم من localStorage...');
        AppState.syncMeta = AppState.syncMeta || {};
        AppState.syncMeta.users = 0; // مسح timestamp القديم قبل بدء المزامنة

        // مسح أي بيانات محفوظة في localStorage/sessionStorage
        try {
            const cachedUsers = localStorage.getItem('hse_cached_users');
            if (cachedUsers) {
                localStorage.removeItem('hse_cached_users');
                Utils.safeLog('✅ تم مسح Cache القديم من localStorage');
            }
        } catch (e) {
            Utils.safeWarn('⚠️ خطأ في مسح Cache من localStorage:', e);
        }

        const previousUsersMap = {};
        // ⚠️ إنتاج: لا نحتفظ/نُدمج أي حسابات افتراضية. 
        // نزيل فقط "الحسابات المحلية" الوهمية (legacy) التي كانت تُزرع قديماً (مثل نطاق @hse.local).
        const isLegacyDefaultEmail = (email) => {
            try {
                const e = String(email || '').toLowerCase().trim();
                return e.endsWith('@hse.local');
            } catch (err) {
                return false;
            }
        };

        // حفظ نسخة احتياطية من جميع البيانات المحلية قبل المزامنة
        const localUsersBackup = Array.isArray(AppState.appData.users)
            ? AppState.appData.users.map(u => ({ ...u }))
            : [];

        if (Array.isArray(AppState.appData.users)) {
            AppState.appData.users.forEach(user => {
                const emailKey = user?.email ? user.email.toLowerCase().trim() : '';
                if (emailKey) {
                    previousUsersMap[emailKey] = user;
                }
            });
        }

        try {
            Utils.safeLog('🔄 جاري قراءة المستخدمين من الخادم...');
            const data = await this.readFromSheets('Users');

            // التحقق من وجود البيانات المستلمة
            if (!data) {
                Utils.safeWarn('⚠️ البيانات المستلمة من الخادم كانت null');
                // استخدام البيانات المحلية الاحتياطية إذا كانت متوفرة
                if (localUsersBackup.length > 0) {
                    Utils.safeLog('⚠️ استخدام البيانات المحلية الاحتياطية...');
                    AppState.appData.users = localUsersBackup.map(u => ({ ...u }));
                    AppState.syncMeta = AppState.syncMeta || {};
                    AppState.syncMeta.users = Date.now() - (10 * 60 * 1000); // 10 دقائق مضت
                    try {
                        DataManager.save();
                        Utils.safeLog('✅ تم حفظ البيانات المحلية الاحتياطية');
                    } catch (saveError) {
                        Utils.safeWarn('⚠️ خطأ في حفظ البيانات المحلية الاحتياطية:', saveError);
                    }
                    this._setSyncState('users', false);
                    if (typeof InactivityManager !== 'undefined' && AppState.currentUser && !inactivityWasPaused) {
                        InactivityManager.resume();
                    }
                    return true;
                }
                return false;
            }

            if (!Array.isArray(data)) {
                Utils.safeWarn('⚠️ البيانات المستلمة ليست مصفوفة:', typeof data);
                // استخدام البيانات المحلية الاحتياطية إذا كانت متوفرة
                if (localUsersBackup.length > 0) {
                    Utils.safeLog('⚠️ استخدام البيانات المحلية الاحتياطية...');
                    AppState.appData.users = localUsersBackup.map(u => ({ ...u }));
                    AppState.syncMeta = AppState.syncMeta || {};
                    AppState.syncMeta.users = Date.now() - (10 * 60 * 1000); // 10 دقائق مضت
                    try {
                        DataManager.save();
                        Utils.safeLog('✅ تم حفظ البيانات المحلية الاحتياطية');
                    } catch (saveError) {
                        Utils.safeWarn('⚠️ خطأ في حفظ البيانات المحلية الاحتياطية:', saveError);
                    }
                    this._setSyncState('users', false);
                    if (typeof InactivityManager !== 'undefined' && AppState.currentUser && !inactivityWasPaused) {
                        InactivityManager.resume();
                    }
                    return true;
                }
                return false;
            }

            Utils.safeLog('📊 البيانات المستلمة من الخادم:', {
                dataType: 'array',
                dataLength: data.length,
                firstUserSample: data.length > 0 ? {
                    email: data[0].email || 'غير محدد',
                    hasId: !!data[0].id,
                    hasName: !!data[0].name,
                    hasEmail: !!data[0].email,
                    hasPasswordHash: !!data[0].passwordHash,
                    passwordHashLength: data[0].passwordHash?.length || 0,
                    passwordHashPrefix: data[0].passwordHash && typeof data[0].passwordHash === 'string' ? (data[0].passwordHash.substring(0, 20) + '...') : 'غير محدد',
                    hasPassword: !!data[0].password,
                    passwordValue: data[0].password && typeof data[0].password === 'string' ? (data[0].password.substring(0, 10) + '...') : (typeof data[0].password),
                    keys: Object.keys(data[0] || {}),
                    allKeys: Object.keys(data[0] || {})
                } : null,
                sampleUsers: data.slice(0, 3).map(u => ({
                    email: u.email || 'غير محدد',
                    hasPasswordHash: !!u.passwordHash,
                    passwordHashLength: u.passwordHash?.length || 0
                }))
            });

            if (Array.isArray(data) && data.length > 0) {
                let restoredPasswords = false;

                // تصفية المستخدمين الصالحين (الذين لديهم email صحيح)
                const validUsers = data.filter(user => {
                    if (!user || typeof user !== 'object') {
                        Utils.safeWarn('⚠️ مستخدم غير صالح (ليس كائن):', user);
                        return false;
                    }
                    const email = user.email ? String(user.email).trim() : '';
                    if (!email || email === '') {
                        Utils.safeWarn('⚠️ مستخدم بدون email:', user);
                        return false;
                    }
                    return true;
                });

                if (validUsers.length === 0) {
                    Utils.safeWarn('⚠️ لا يوجد مستخدمين صالحين في البيانات المستلمة');
                    return false;
                }

                Utils.safeLog(`✅ تم تصفية ${validUsers.length} مستخدم صالح من ${data.length} مستخدم`);

                let normalizedUsers = await Promise.all(validUsers.map(async user => {
                    // تحويل المستخدم إلى كائن معين
                    const normalized = {};
                    Object.keys(user).forEach(key => {
                        normalized[key] = user[key];
                    });

                    // تطبيع email
                    if (normalized.email) {
                        normalized.email = String(normalized.email).trim().toLowerCase();
                    }

                    // ✅ تطبيع name - التحقق من أنه string وليس object
                    if (normalized.name) {
                        let nameValue = normalized.name;
                        // إذا كان name object (مثل {value: "Yasser"})، استخرج القيمة
                        if (typeof nameValue === 'object' && nameValue !== null) {
                            if (nameValue.value) {
                                nameValue = String(nameValue.value).trim();
                            } else {
                                const values = Object.values(nameValue);
                                if (values.length === 1 && typeof values[0] === 'string') {
                                    nameValue = String(values[0]).trim();
                                } else {
                                    nameValue = String(nameValue).trim();
                                }
                            }
                            Utils.safeLog(`✅ تم تحويل name من object إلى string: ${nameValue}`);
                        } else if (typeof nameValue === 'string') {
                            nameValue = nameValue.trim();
                        }
                        normalized.name = nameValue;
                    }

                    // ✅ تطبيع displayName أيضاً
                    if (normalized.displayName) {
                        let displayNameValue = normalized.displayName;
                        if (typeof displayNameValue === 'object' && displayNameValue !== null) {
                            if (displayNameValue.value) {
                                displayNameValue = String(displayNameValue.value).trim();
                            } else {
                                const values = Object.values(displayNameValue);
                                if (values.length === 1 && typeof values[0] === 'string') {
                                    displayNameValue = String(values[0]).trim();
                                }
                            }
                        } else if (typeof displayNameValue === 'string') {
                            displayNameValue = displayNameValue.trim();
                        }
                        normalized.displayName = displayNameValue;
                    }

                    const emailKey = normalized.email || '';
                    const previous = previousUsersMap[emailKey];

                    // التحقق من وجود Utils ودالة isSha256Hex
                    const canCheckHash = typeof Utils !== 'undefined' && Utils && typeof Utils.isSha256Hex === 'function';
                    // التحقق من وجود passwordHash
                    let incomingHash = '';

                    // 1. التحقق من وجود passwordHash
                    if (normalized.passwordHash) {
                        let hashValue = normalized.passwordHash;

                        // ??? ??? passwordHash object? ?????? ?????? ???
                        if (typeof hashValue === 'object' && hashValue !== null) {
                            if (hashValue.value) {
                                hashValue = String(hashValue.value).trim();
                                Utils.safeLog(`تم تحويل passwordHash إلى String: ${normalized.email}`); // التحقق من وجود Utils ودالة isSha256Hex والتحقق من وجود passwordHash      
                            } else {
                                // التحقق من وجود القيم في الكائن
                                const values = Object.values(hashValue);
                                if (values.length === 1 && typeof values[0] === 'string') {
                                    hashValue = String(values[0]).trim();
                                    Utils.safeLog(`تم تحويل passwordHash إلى String: ${normalized.email}`);
                                } else {
                                    hashValue = String(hashValue).trim();
                                }
                            }
                        } else if (typeof hashValue === 'string') {
                            hashValue = hashValue.trim();
                        }

                        if (hashValue && hashValue !== '' && hashValue !== '***') {
                            if (canCheckHash && Utils.isSha256Hex(hashValue)) {
                                incomingHash = hashValue;
                            } else {
                                Utils.safeWarn(`?? passwordHash ??? ???? ????????: ${normalized.email} - ????? ??? ????`);
                            }
                        }
                    }

                    // 2. التحقق من وجود passwordHash
                    if (!incomingHash && normalized.password && normalized.password !== '***') {
                        let passwordValue = normalized.password;

                        // التحقق من وجود password object
                        if (typeof passwordValue === 'object' && passwordValue !== null) {
                            if (passwordValue.value) {
                                passwordValue = String(passwordValue.value).trim();
                                Utils.safeLog(`تم تحويل password إلى String: ${normalized.email}`);
                            } else {
                                const values = Object.values(passwordValue);
                                if (values.length === 1 && typeof values[0] === 'string') {
                                    passwordValue = String(values[0]).trim();
                                    Utils.safeLog(`تم تحويل password إلى String: ${normalized.email}`);
                                } else {
                                    passwordValue = String(passwordValue).trim();
                                }
                            }
                        } else if (typeof passwordValue === 'string') {
                            passwordValue = passwordValue.trim();
                        }

                        if (canCheckHash && Utils.isSha256Hex(passwordValue)) {
                            incomingHash = passwordValue;
                            Utils.safeLog(`تم تحويل passwordHash إلى String: ${normalized.email}`);
                        }
                    }

                    // 3. التحقق من وجود previousHash
                    let previousHash = '';
                    if (previous) {
                        if (previous.passwordHash && previous.passwordHash.trim() !== '' && previous.passwordHash.trim() !== '***') {
                            const prevHashValue = previous.passwordHash.trim();
                            if (canCheckHash && Utils.isSha256Hex(prevHashValue)) {
                                previousHash = prevHashValue;
                            }
                        } else if (previous.password && previous.password !== '***') {
                            const prevPasswordValue = previous.password.trim();
                            if (canCheckHash && Utils.isSha256Hex(prevPasswordValue)) {
                                previousHash = prevPasswordValue;
                            }
                        }
                    }

                    // التحقق من وجود incomingHash
                    if (!incomingHash && normalized.password && normalized.password !== '***' && !Utils.isSha256Hex(normalized.password)) {
                        Utils.safeWarn(`خطأ في التحقق من وجود incomingHash: ${normalized.email}`);
                        incomingHash = await Utils.hashPassword(normalized.password);
                        restoredPasswords = true;
                    }

                    if (!previousHash && previous?.password && previous.password !== '***' && !Utils.isSha256Hex(previous.password)) {
                        Utils.safeWarn(`خطأ في التحقق من وجود previousHash: ${previous.email}`);
                        previousHash = await Utils.hashPassword(previous.password);
                        restoredPasswords = true;
                    }

                    // التحقق من وجود incomingHash
                    if (incomingHash && !Utils.isSha256Hex(incomingHash)) {
                        Utils.safeWarn(`خطأ في التحقق من وجود incomingHash: ${normalized.email} - خطأ في التحقق من وجود hash`);
                        incomingHash = '';
                    }

                    let resolvedHash = incomingHash || previousHash || '';

                    Utils.safeLog(`?? ??? passwordHash ???????? ${normalized.email}:`, {
                        hasIncomingHash: !!incomingHash,
                        incomingHashLength: incomingHash?.length || 0,
                        incomingHashPrefix: incomingHash ? (incomingHash.substring(0, 20) + '...') : '????',
                        incomingHashSuffix: incomingHash ? ('...' + incomingHash.substring(incomingHash.length - 10)) : '????',
                        isIncomingHashValid: incomingHash ? Utils.isSha256Hex(incomingHash) : false,
                        hasPreviousHash: !!previousHash,
                        previousHashLength: previousHash?.length || 0,
                        previousHashPrefix: previousHash ? (previousHash.substring(0, 20) + '...') : '????',
                        previousHashSuffix: previousHash ? ('...' + previousHash.substring(previousHash.length - 10)) : '????',
                        isPreviousHashValid: previousHash ? Utils.isSha256Hex(previousHash) : false,
                        resolvedHash: resolvedHash ? (resolvedHash.substring(0, 20) + '...') : '????',
                        resolvedHashLength: resolvedHash?.length || 0,
                        resolvedHashSuffix: resolvedHash ? ('...' + resolvedHash.substring(resolvedHash.length - 10)) : '????',
                        isResolvedHashValid: resolvedHash ? Utils.isSha256Hex(resolvedHash) : false,
                        normalizedKeys: Object.keys(normalized),
                        hasPasswordHashInNormalized: 'passwordHash' in normalized,
                        hasPasswordInNormalized: 'password' in normalized
                    });

                    // ?????? ???? ?????? ???????? hash ?????????? ?????? ?????????? ?????? ???? ???????? ???????????? ?????????? ?????? ?????????? ??????????
                    if (!resolvedHash || !Utils.isSha256Hex(resolvedHash)) {
                        normalized.forcePasswordChange = true;
                        Utils.safeWarn(`?????? ???????????????? ${normalized.email} ?????????? ?????? ?????????? ?????????? ???????? ????????????`);
                    }

                    if ((!normalized.createdAt || normalized.createdAt === '') && previous?.createdAt) {
                        normalized.createdAt = previous.createdAt;
                    }

                    if ((!normalized.updatedAt || normalized.updatedAt === '') && previous?.updatedAt) {
                        normalized.updatedAt = previous.updatedAt;
                    }

                    if (!normalized.loginHistory && previous?.loginHistory) {
                        normalized.loginHistory = previous.loginHistory;
                    }

                    // ?????? ?? ?? passwordHash ???? ??? ?????
                    if (resolvedHash && Utils.isSha256Hex(resolvedHash)) {
                        normalized.passwordHash = resolvedHash;
                        normalized.password = '***';
                        normalized.forcePasswordChange = normalized.forcePasswordChange ?? previous?.forcePasswordChange ?? false;
                        normalized.passwordChanged = normalized.passwordChanged ?? previous?.passwordChanged ?? false;

                        Utils.safeLog(`? ?? ????? passwordHash ???????? ${normalized.email}:`, {
                            passwordHashLength: normalized.passwordHash?.length || 0,
                            passwordHashPrefix: normalized.passwordHash ? (normalized.passwordHash.substring(0, 20) + '...') : '????',
                            isPasswordHashValid: true,
                            forcePasswordChange: normalized.forcePasswordChange
                        });
                    } else {
                        // ??? ?? ??? ???? passwordHash ????? ??? ????? ??? ?????? ?????? ???? ??????
                        normalized.passwordHash = '';
                        normalized.password = '***';
                        normalized.forcePasswordChange = true;
                        normalized.passwordChanged = false;

                        Utils.safeWarn(`?? ???????? ${normalized.email} ?? ???? passwordHash ???? - ?????? ??? ????? ????? ???? ??????`);
                    }

                    if (typeof normalized.permissions === 'string' && normalized.permissions.trim() !== '') {
                        try {
                            normalized.permissions = JSON.parse(normalized.permissions);
                        } catch (error) {
                            Utils.safeWarn('⚠️ فشل تحليل صلاحيات المستخدم (permissions):', error);
                        }
                    }
                    if (typeof Permissions !== 'undefined' && typeof Permissions.normalizePermissions === 'function' && normalized.permissions != null) {
                        normalized.permissions = Permissions.normalizePermissions(normalized.permissions) || {};
                    } else if (!normalized.permissions || typeof normalized.permissions !== 'object') {
                        normalized.permissions = {};
                    }

                    if (typeof normalized.loginHistory === 'string' && normalized.loginHistory.trim() !== '') {
                        try {
                            normalized.loginHistory = JSON.parse(normalized.loginHistory);
                        } catch (error) {
                            Utils.safeWarn('??? ?????? ?????????? ?????? ???????????? ???????????????? ?????????? ????????????????:', error);
                            normalized.loginHistory = [];
                        }
                    }

                    return normalized;
                }));

                // ✅ إنتاج: إزالة أي حسابات افتراضية legacy من نتيجة المزامنة
                const beforeFilterCount = normalizedUsers.length;
                normalizedUsers = normalizedUsers.filter(u => !isLegacyDefaultEmail(u?.email));
                const removedLegacyDefaults = beforeFilterCount - normalizedUsers.length;

                // النتيجة النهائية: المستخدمون من الخادم فقط (بدون أي دمج افتراضي)
                const finalUsers = normalizedUsers;

                // تحديث AppState.appData.users - نسخ عميقة لتجنب التعديلات المباشرة
                AppState.appData.users = finalUsers.map(u => ({ ...u }));

                // تحديث timestamp المزامنة
                AppState.syncMeta = AppState.syncMeta || {};
                AppState.syncMeta.users = now;

                // حفظ البيانات محلياً
                try {
                    DataManager.save();
                    Utils.safeLog('✅ تم حفظ البيانات المستخدمين محلياً');
                } catch (saveError) {
                    Utils.safeWarn('⚠️ خطأ في حفظ البيانات المستخدمين محلياً:', saveError);
                }

                // مسح Cache القديم من التخزين المحلي
                try {
                    // مسح من localStorage
                    localStorage.removeItem('hse_cached_users');
                    // مسح من sessionStorage (إن وجد)
                    sessionStorage.removeItem('hse_cached_users');
                    Utils.safeLog('✅ تم مسح Cache القديم من التخزين المحلي');
                } catch (cacheError) {
                    Utils.safeWarn('⚠️ خطأ في مسح Cache:', cacheError);
                }

                // سجل المزامنة
                Utils.safeLog(`✅ ===== اكتملت مزامنة المستخدمين =====`, {
                    totalUsers: finalUsers.length,
                    fromGoogleSheets: normalizedUsers.length,
                    removedLegacyDefaults,
                    syncTimestamp: new Date(now).toISOString(),
                    usersList: finalUsers.map(u => ({
                        email: u.email,
                        hasPasswordHash: !!u.passwordHash && u.passwordHash !== '***',
                        passwordHashValid: u.passwordHash ? Utils.isSha256Hex(u.passwordHash) : false
                    })).slice(0, 5) // أول 5 مستخدمين فقط
                });

                // إلغاء حالة المزامنة
                this._setSyncState('users', false);

                Utils.safeLog(`✅ اكتملت مزامنة المستخدمين (${normalizedUsers.length} من الخادم)`);

                // تحديث passwordHash في الخادم إذا لزم الأمر (لا نستخدم autoSave لـ Users عند Supabase لتفادي أي استبدال للصلاحيات/الدور)
                const needsPasswordUpdate = restoredPasswords || normalizedUsers.some(u => {
                    const hash = (u.passwordHash || '').trim();
                    return !hash || !Utils.isSha256Hex(hash);
                });

                if (needsPasswordUpdate && AppState.useSupabaseBackend !== true) {
                    setTimeout(() => {
                        const cleanedUsers = AppState.appData.users.map(user => {
                            const cleaned = { ...user };
                            if (cleaned.password && cleaned.password !== '***') {
                                delete cleaned.password;
                            }
                            return cleaned;
                        });
                        this.autoSave('Users', cleanedUsers).catch(err => {
                            Utils.safeWarn('⚠️ فشل تحديث passwordHash في الخادم بعد المزامنة:', err);
                        });
                    }, 500);
                }

                // إعادة تشغيل نظام عدم النشاط بعد اكتمال المزامنة
                if (typeof InactivityManager !== 'undefined' && AppState.currentUser && !inactivityWasPaused) {
                    InactivityManager.resume();
                }

                // تحديث زر حالة الاتصال للمستخدم بعد المزامنة
                if (typeof UI !== 'undefined' && typeof UI.updateUserConnectionStatus === 'function') {
                    setTimeout(() => {
                        UI.updateUserConnectionStatus();
                        // التأكد من أن التحديث التلقائي يعمل بعد المزامنة
                        if (typeof UI.startAutoRefreshConnectionStatus === 'function' && AppState.currentUser) {
                            UI.startAutoRefreshConnectionStatus();
                        }
                    }, 300);
                }

                // إلغاء حالة المزامنة
                this._setSyncState('users', false);

                // ✅ Bootstrap hard-disable after first successful Users sync (real users exist)
                try {
                    if (typeof window !== 'undefined' && window.Auth && typeof window.Auth.handleUsersSyncSuccess === 'function') {
                        window.Auth.handleUsersSyncSuccess();
                    }
                } catch (e) { /* ignore */ }

                return true;
            }

            // إعادة تشغيل نظام عدم النشاط
            if (typeof InactivityManager !== 'undefined' && AppState.currentUser && !inactivityWasPaused) {
                InactivityManager.resume();
            }

            // إلغاء حالة المزامنة - لا توجد بيانات
            this._setSyncState('users', false);
            return false;
        } catch (error) {
            // إعادة تشغيل نظام عدم النشاط حتى في حالة الخطأ
            if (typeof InactivityManager !== 'undefined' && AppState.currentUser && !inactivityWasPaused) {
                InactivityManager.resume();
            }

            // إلغاء حالة المزامنة - خطأ
            this._setSyncState('users', false);

            // التحقق من نوع الخطأ
            const errorMsg = error?.message || error?.toString() || '';
            const isTimeoutError = errorMsg.includes('ERR_CONNECTION_TIMED_OUT') ||
                errorMsg.includes('CONNECTION_TIMED_OUT') ||
                errorMsg.includes('timeout') ||
                errorMsg.includes('timed out') ||
                errorMsg.includes('AbortError');

            // إذا كان هناك بيانات محلية احتياطية، نستخدمها
            if (localUsersBackup.length > 0) {
                Utils.safeLog('⚠️ فشلت المزامنة، استخدام البيانات المحلية الاحتياطية...');

                // استعادة البيانات المحلية
                AppState.appData.users = localUsersBackup.map(u => ({ ...u }));

                // تحديث timestamp المزامنة (لكن بعلامة فشل)
                AppState.syncMeta = AppState.syncMeta || {};
                AppState.syncMeta.users = Date.now() - (10 * 60 * 1000); // 10 دقائق مضت (لإجبار المزامنة التالية)

                // حفظ البيانات المحلية للتأكد من استمراريتها
                try {
                    DataManager.save();
                    Utils.safeLog('✅ تم حفظ البيانات المحلية الاحتياطية');
                } catch (saveError) {
                    Utils.safeWarn('⚠️ خطأ في حفظ البيانات المحلية الاحتياطية:', saveError);
                }

                if (isTimeoutError) {
                    Utils.safeWarn('⚠️ انتهت مهلة الاتصال أثناء مزامنة المستخدمين. تم استخدام البيانات المحلية المحفوظة.');
                } else {
                    Utils.safeWarn('⚠️ فشل مزامنة المستخدمين من الخادم. تم استخدام البيانات المحلية المحفوظة:', error);
                }

                // إرجاع true لأن البيانات المحلية متوفرة
                return true;
            }

            // إذا لم تكن هناك بيانات محلية، نعيد false
            Utils.safeWarn('⚠️ فشل مزامنة المستخدمين من الخادم:', error);
            Utils.safeError('❌ خطأ في مزامنة المستخدمين:', {
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString(),
                isTimeoutError: isTimeoutError
            });

            return false;
        }
    },

    /**
     * ?????? ???????? ???????????????? ???? الخادم (?????????????? ????????)
     */
    async saveAllToSheets() {
        if (!AppState.googleConfig.appsScript.enabled || !AppState.googleConfig.appsScript.scriptUrl) {
            return { success: false, message: 'الاتصال بالخادم غير مفعّل' };
        }

        try {
            Loading.show();
            const sheets = {
                'Users': AppState.appData.users || [],
                'Incidents': AppState.appData.incidents || [],
                'NearMiss': AppState.appData.nearmiss || [],
                'PTW': AppState.appData.ptw || [],
                'Training': AppState.appData.training || [],
                'EmployeeTrainingMatrix': AppState.appData.employeeTrainingMatrix || [],
                'TrainingAttendance': AppState.appData.trainingAttendance || [],
                'ClinicVisits': AppState.appData.clinicVisits || [],
                'Medications': AppState.appData.medications || [],
                'SickLeave': AppState.appData.sickLeave || [],
                'Injuries': AppState.appData.injuries || [],
                'ClinicInventory': AppState.appData.clinicInventory || [],
                'FireEquipment': AppState.appData.fireEquipment || [],
                'FireEquipmentAssets': AppState.appData.fireEquipmentAssets || [],
                'FireEquipmentInspections': AppState.appData.fireEquipmentInspections || [],
                'PeriodicInspectionCategories': AppState.appData.periodicInspectionCategories || [],
                'PeriodicInspectionRecords': AppState.appData.periodicInspectionRecords || [],
                'PeriodicInspectionSchedules': AppState.appData.periodicInspectionSchedules || [],
                'PeriodicInspectionChecklists': AppState.appData.periodicInspectionChecklists || [],
                'PPE': AppState.appData.ppe || [],
                'ViolationTypes': AppState.appData.violationTypes || [],
                'Violations': AppState.appData.violations || [],
                'Blacklist_Register': AppState.appData.blacklistRegister || [],
                'Contractors': AppState.appData.contractors || [],
                'ApprovedContractors': AppState.appData.approvedContractors || [],
                'ContractorEvaluations': AppState.appData.contractorEvaluations || [],
                'Employees': AppState.appData.employees || [],
                'BehaviorMonitoring': AppState.appData.behaviorMonitoring || [],
                'ChemicalSafety': AppState.appData.chemicalSafety || [],
                'DailyObservations': AppState.appData.dailyObservations || [],
                'ISODocuments': AppState.appData.isoDocuments || [],
                'ISOProcedures': AppState.appData.isoProcedures || [],
                'ISOForms': AppState.appData.isoForms || [],
                'SOPJHA': AppState.appData.sopJHA || [],
                'RiskAssessments': AppState.appData.riskAssessments || [],
                'LegalDocuments': AppState.appData.legalDocuments || [],
                'HSEAudits': AppState.appData.hseAudits || [],
                'HSENonConformities': AppState.appData.hseNonConformities || [],
                'HSECorrectiveActions': AppState.appData.hseCorrectiveActions || [],
                'HSEObjectives': AppState.appData.hseObjectives || [],
                'HSERiskAssessments': AppState.appData.hseRiskAssessments || [],
                'EnvironmentalAspects': AppState.appData.environmentalAspects || [],
                'EnvironmentalMonitoring': AppState.appData.environmentalMonitoring || [],
                'Sustainability': AppState.appData.sustainability || [],
                'CarbonFootprint': AppState.appData.carbonFootprint || [],
                'WasteManagement': AppState.appData.wasteManagement || [],
                'EnergyEfficiency': AppState.appData.energyEfficiency || [],
                'WaterManagement': AppState.appData.waterManagement || [],
                'RecyclingPrograms': AppState.appData.recyclingPrograms || [],
                'EmergencyAlerts': AppState.appData.emergencyAlerts || [],
                'EmergencyPlans': AppState.appData.emergencyPlans || [],
                'SafetyTeamMembers': AppState.appData.safetyTeamMembers || [],
                'SafetyOrganizationalStructure': AppState.appData.safetyOrganizationalStructure || [],
                'SafetyJobDescriptions': AppState.appData.safetyJobDescriptions || [],
                'SafetyTeamKPIs': AppState.appData.safetyTeamKPIs || [],
                'SafetyTeamAttendance': AppState.appData.safetyTeamAttendance || [],
                'SafetyTeamLeaves': AppState.appData.safetyTeamLeaves || [],
                'SafetyTeamTasks': AppState.appData.safetyTeamTasks || [],
                'SafetyBudgets': AppState.appData.safetyBudgets || [],
                'SafetyBudgetTransactions': AppState.appData.safetyBudgetTransactions || [],
                'SafetyPerformanceKPIs': AppState.appData.safetyPerformanceKPIs || [],
                'ActionTrackingRegister': AppState.appData.actionTrackingRegister || [],
                'UserActivityLog': AppState.appData.user_activity_log || []
            };

            let successCount = 0;
            let failCount = 0;

            const spreadsheetId = AppState.googleConfig.sheets.spreadsheetId;

            if (!spreadsheetId || spreadsheetId.trim() === '') {
                Loading.hide();
                Notification.error('???????? ?????????? ???????? الخادم ???? ?????????????????? ??????????');
                return { success: false, message: '?????? الخادم ?????? ????????' };
            }

            for (const [sheetName, data] of Object.entries(sheets)) {
                try {
                    await this.sendToAppsScript('saveToSheet', {
                        sheetName,
                        data,
                        spreadsheetId: spreadsheetId.trim()
                    });
                    successCount++;
                } catch (error) {
                    Utils.safeWarn(`?????? ?????? ${sheetName}:`, error);
                    failCount++;
                }
            }

            Loading.hide();

            if (failCount === 0) {
                Notification.success(`???? ?????? ???????? ???????????????? ???? الخادم ??????????`);
                return { success: true };
            } else {
                Notification.warning(`???? ?????? ${successCount} ?????????? ???? ${failCount} ????????`);
                return { success: false, message: `?????? ???? ${failCount} ????????` };
            }
        } catch (error) {
            Loading.hide();
            Notification.error('?????? ???? ????????????????: ' + error.message);
            return { success: false, message: error.message };
        }
    },

    /**
     * ?????????? ???????? ?????????????? ???????????????? ???????????????? ?? الخادم
     */
    async initializeSheets() {
        if (!AppState.googleConfig.appsScript.enabled || !AppState.googleConfig.appsScript.scriptUrl) {
            return Promise.reject(new Error('الاتصال بالخادم غير مفعّل'));
        }

        try {
            Loading.show();
            const spreadsheetId = AppState.googleConfig.sheets.spreadsheetId || '';

            const result = await this.sendToAppsScript('initializeSheets', {
                spreadsheetId: spreadsheetId || undefined
            });

            Loading.hide();
            if (result.success) {
                Notification.success('???? ?????????? ???????? ?????????????? ??????????');
                return true;
            } else {
                Notification.error('?????? ?????????? ??????????????: ' + result.message);
                return false;
            }
        } catch (error) {
            Loading.hide();
            Notification.error('?????? ?????????? ??????????????: ' + error.message);
            return Promise.reject(error);
        }
    },

    /**
     * تحديد الأوراق غير المكتملة (التي لم يتم تحميلها أو فشل تحميلها)
     * @returns {Array|null} قائمة بالأوراق غير المكتملة أو null لتحميل الكل
     */
    getIncompleteSheets(sheetMapping, allSheets) {
        try {
            // التأكد من تهيئة syncMeta
            if (!AppState.syncMeta) {
                AppState.syncMeta = { sheets: {}, lastSyncTime: 0, userEmail: null };
            }
            if (!AppState.syncMeta.sheets) {
                AppState.syncMeta.sheets = {};
            }
            
            // التحقق من تغيير المستخدم
            const currentUserEmail = AppState.currentUser?.email || null;
            if (AppState.syncMeta.userEmail !== currentUserEmail) {
                // تغيير المستخدم - نعيد جميع الأوراق
                return null;
            }
            
            const incompleteSheets = [];
            const currentTime = Date.now();
            const syncTimeout = 2 * 60 * 1000; // 2 دقيقة - انتهاء صلاحية البيانات (محسّن ليتناسب مع فترة المزامنة)
            
            // التحقق من كل ورقة
            allSheets.forEach(sheetName => {
                const lastSync = AppState.syncMeta.sheets[sheetName] || 0;
                const isExpired = lastSync > 0 && (currentTime - lastSync) > syncTimeout;
                const key = sheetMapping[sheetName];
                const hasData = key && AppState.appData && AppState.appData[key];
                const isLoaded = Array.isArray(hasData) && hasData.length > 0;
                
                // إذا لم يتم تحميلها أو انتهت صلاحيتها أو لا توجد بيانات
                if (!lastSync || isExpired || !isLoaded) {
                    incompleteSheets.push(sheetName);
                }
            });
            
            return incompleteSheets.length > 0 ? incompleteSheets : null;
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في تحديد الأوراق غير المكتملة:', error);
            return null; // في حالة الخطأ، نعيد جميع الأوراق
        }
    },

    /**
     * ???????????? ???????????????? ???? الخادم
     */
    async syncData(options = {}) {
        const {
            silent = false,
            showLoader = false,
            notifyOnSuccess = !silent,
            notifyOnError = !silent,
            includeUsersSheet = true,
            sheets: requestedSheets = null, // ✅ إضافة دعم sheets في options
            incremental = false // ✅ جديد: تحميل تدريجي
        } = options;

        if (!AppState.googleConfig.appsScript.enabled || !AppState.googleConfig.appsScript.scriptUrl) {
            if (!silent) {
                Utils.safeLog('الاتصال بالخادم غير مفعّل - سيتم استخدام البيانات المحلية فقط');
                Notification.warning('الاتصال بالخادم غير مفعّل. سيتم استخدام البيانات المحلية فقط.');
            }
            return false;
        }

        // منع المزامنة المتزامنة
        if (this._syncInProgress.global) {
            if (!silent) {
                Notification.info('جاري المزامنة بالفعل، يرجى الانتظار...');
            }
            return false;
        }

        this._syncInProgress.global = true;

        // إيقاف نظام عدم النشاط أثناء المزامنة
        let inactivityWasPaused = false;
        if (typeof InactivityManager !== 'undefined' && AppState.currentUser) {
            inactivityWasPaused = InactivityManager.isPaused;
            if (!inactivityWasPaused) {
                InactivityManager.pause('مزامنة البيانات مع الخادم');
            }
        }

        try {
            const shouldLog = AppState.debugMode && !silent;
            if (shouldLog) {
                Utils.safeLog('🔄 بدء مزامنة البيانات مع الخادم...');
            }

            if (showLoader && typeof Loading !== 'undefined') {
                Loading.show('جاري مزامنة البيانات مع الخادم...', 0);
            }

            // ✅ إصلاح: تقسيم الأوراق إلى أولوية عالية ومنخفضة لتسريع التحميل
            const prioritySheets = [
                'Users', // الأهم - يجب تحميله أولاً
                'Employees', // مهم جداً - يستخدم في معظم الموديولات
                'Contractors', // مهم - يستخدم في عدة موديولات
                'ApprovedContractors' // مهم - يستخدم في عدة موديولات
            ];
            
            const baseSheets = [
                'Contractors',              // ✅ إضافة المقاولين
                'ApprovedContractors',      // ✅ إضافة المقاولين المعتمدين
                'Incidents',
                'NearMiss',
                'PTW',
                'PTWRegistry',
                'Training',
                'EmployeeTrainingMatrix',
                'TrainingAttendance',
                'TrainingAnalysisData',
                'ClinicVisits',
                'Medications',
                'SickLeave',
                'Injuries',
                'ClinicInventory',
                'FireEquipment',
                'FireEquipmentAssets',
                'FireEquipmentInspections',
                'PeriodicInspectionCategories',
                'PeriodicInspectionRecords',
                'PeriodicInspectionSchedules',
                'PeriodicInspectionChecklists',
                'PPE',
                'ViolationTypes',
                'Violations',
                'Blacklist_Register',
                'ContractorEvaluations',
                'ContractorApprovalRequests', // ✅ إضافة طلبات اعتماد المقاولين
                'ContractorDeletionRequests', // ✅ إضافة طلبات حذف المقاولين
                'BehaviorMonitoring',
                'ChemicalSafety',
                'DailyObservations',
                'ISODocuments',
                'ISOProcedures',
                'ISOForms',
                'SOPJHA',
                'RiskAssessments',
                'LegalDocuments',
                'HSEAudits',
                'HSENonConformities',
                'HSECorrectiveActions',
                'HSEObjectives',
                'HSERiskAssessments',
                'EnvironmentalAspects',
                'EnvironmentalMonitoring',
                'Sustainability',
                'CarbonFootprint',
                'WasteManagement',
                'EnergyEfficiency',
                'WaterManagement',
                'RecyclingPrograms',
                'EmergencyAlerts',
                'EmergencyPlans',
                'SafetyTeamMembers',
                'SafetyOrganizationalStructure',
                'SafetyJobDescriptions',
                'SafetyTeamKPIs',
                'SafetyTeamAttendance',
                'SafetyTeamLeaves',
                'SafetyTeamTasks',
                'SafetyBudgets',
                'SafetyBudgetTransactions',
                'SafetyPerformanceKPIs',
                'ActionTrackingRegister',
                'UserActivityLog'
            ];

            let sheets = baseSheets.slice();
            
            // ✅ إذا تم تحديد sheets في options، استخدامها بدلاً من baseSheets
            if (requestedSheets && Array.isArray(requestedSheets) && requestedSheets.length > 0) {
                sheets = requestedSheets;
                if (shouldLog) {
                    Utils.safeLog(`✅ استخدام الأوراق المحددة في options: ${requestedSheets.join(', ')}`);
                }
            }
            
            const sheetMapping = {
                'Users': 'users',
                'Incidents': 'incidents',
                'NearMiss': 'nearmiss',
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
                'PeriodicInspectionCategories': 'periodicInspectionCategories',
                'PeriodicInspectionRecords': 'periodicInspectionRecords',
                'PeriodicInspectionSchedules': 'periodicInspectionSchedules',
                'PeriodicInspectionChecklists': 'periodicInspectionChecklists',
                'PPE': 'ppe',
                'ViolationTypes': 'violationTypes',
                'Violations': 'violations',
                'Blacklist_Register': 'blacklistRegister',
                'Contractors': 'contractors',
                'ApprovedContractors': 'approvedContractors',
                'ContractorEvaluations': 'contractorEvaluations',
                'ContractorApprovalRequests': 'contractorApprovalRequests', // ✅ إضافة طلبات اعتماد المقاولين
                'ContractorDeletionRequests': 'contractorDeletionRequests', // ✅ إضافة طلبات حذف المقاولين
                'Employees': 'employees',
                'BehaviorMonitoring': 'behaviorMonitoring',
                'ChemicalSafety': 'chemicalSafety',
                'Chemical_Register': 'chemicalRegister',
                'DailyObservations': 'dailyObservations',
                'ISODocuments': 'isoDocuments',
                'ISOProcedures': 'isoProcedures',
                'ISOForms': 'isoForms',
                'SOPJHA': 'sopJHA',
                'RiskAssessments': 'riskAssessments',
                'LegalDocuments': 'legalDocuments',
                'HSEAudits': 'hseAudits',
                'HSENonConformities': 'hseNonConformities',
                'HSECorrectiveActions': 'hseCorrectiveActions',
                'HSEObjectives': 'hseObjectives',
                'HSERiskAssessments': 'hseRiskAssessments',
                'EnvironmentalAspects': 'environmentalAspects',
                'EnvironmentalMonitoring': 'environmentalMonitoring',
                'Sustainability': 'sustainability',
                'CarbonFootprint': 'carbonFootprint',
                'WasteManagement': 'wasteManagement',
                'EnergyEfficiency': 'energyEfficiency',
                'WaterManagement': 'waterManagement',
                'RecyclingPrograms': 'recyclingPrograms',
                'EmergencyAlerts': 'emergencyAlerts',
                'EmergencyPlans': 'emergencyPlans',
                'SafetyTeamMembers': 'safetyTeamMembers',
                'SafetyOrganizationalStructure': 'safetyOrganizationalStructure',
                'SafetyJobDescriptions': 'safetyJobDescriptions',
                'SafetyTeamKPIs': 'safetyTeamKPIs',
                'SafetyTeamAttendance': 'safetyTeamAttendance',
                'SafetyTeamLeaves': 'safetyTeamLeaves',
                'SafetyTeamTasks': 'safetyTeamTasks',
                'SafetyBudgets': 'safetyBudgets',
                'SafetyBudgetTransactions': 'safetyBudgetTransactions',
                'SafetyPerformanceKPIs': 'safetyPerformanceKPIs',
                'ActionTrackingRegister': 'actionTrackingRegister',
                'UserActivityLog': 'user_activity_log'
            };

            const moduleSheetsMap = {
                'dashboard': [],
                'users': ['Users'],
                'incidents': ['Incidents'],
                'nearmiss': ['NearMiss'],
                'ptw': ['PTW', 'PTWRegistry'],
                'training': ['Training'],
                'clinic': ['ClinicVisits', 'Medications', 'SickLeave', 'Injuries', 'ClinicInventory'],
                'fire-equipment': ['FireEquipment', 'FireEquipmentAssets', 'FireEquipmentInspections'],
                'periodic-inspections': ['PeriodicInspectionCategories', 'PeriodicInspectionRecords', 'PeriodicInspectionSchedules', 'PeriodicInspectionChecklists'],
                'ppe': ['PPE'],
                'violations': ['Violations', 'ViolationTypes', 'Blacklist_Register'],
                'contractors': ['Contractors', 'ApprovedContractors', 'ContractorEvaluations', 'ContractorApprovalRequests', 'ContractorDeletionRequests'], // ✅ إضافة طلبات المقاولين
                'employees': ['Employees'],
                'behavior-monitoring': ['BehaviorMonitoring'],
                'chemical-safety': ['ChemicalSafety', 'Chemical_Register'],
                'daily-observations': ['DailyObservations'],
                'iso': ['ISODocuments', 'ISOProcedures', 'ISOForms', 'HSEAudits'],
                'sop-jha': ['SOPJHA'],
                'risk-assessment': ['RiskAssessments', 'HSERiskAssessments'],
                'legal-documents': ['LegalDocuments'],
                'sustainability': ['Sustainability', 'EnvironmentalAspects', 'EnvironmentalMonitoring', 'CarbonFootprint', 'WasteManagement', 'EnergyEfficiency', 'WaterManagement', 'RecyclingPrograms'],
                'emergency': ['EmergencyAlerts', 'EmergencyPlans'],
                'safety-budget': ['SafetyBudgets', 'SafetyBudgetTransactions'],
                'safety-performance-kpis': ['SafetyPerformanceKPIs', 'SafetyTeamKPIs'],
                'safety-health-management': ['SafetyTeamMembers', 'SafetyOrganizationalStructure', 'SafetyJobDescriptions', 'SafetyTeamKPIs', 'SafetyTeamAttendance', 'SafetyTeamLeaves', 'SafetyTeamTasks'],
                'action-tracking': ['ActionTrackingRegister', 'HSECorrectiveActions', 'HSENonConformities', 'HSEObjectives']
            };

            if (AppState.currentUser && AppState.currentUser.role !== 'admin') {
                const accessibleModules = Permissions.getAccessibleModules(true);
                // ⚠️ أمان: لا يتم السماح بقراءة ورقة Users إلا لمن لديه صلاحية users صراحةً
                const allowedSheets = new Set();
                if (includeUsersSheet && Permissions.hasAccess('users')) {
                    allowedSheets.add('Users');
                }

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
                    if (shouldLog) {
                        Utils.safeLog('✅ إضافة أوراق المقاولين تلقائياً للمديولات التي تحتاجها');
                    }
                }

                sheets = sheets.filter(sheet => allowedSheets.has(sheet));

                if (shouldLog) {
                    Utils.safeLog('Checking sheets:', sheets);
                }
            } else if (includeUsersSheet && !sheets.includes('Users')) {
                sheets.unshift('Users');
            }

            // ✅ إضافة: تهيئة syncMeta إذا لم يكن موجوداً
            if (!AppState.syncMeta) {
                AppState.syncMeta = { sheets: {}, lastSyncTime: 0, userEmail: null };
            }
            if (!AppState.syncMeta.sheets) {
                AppState.syncMeta.sheets = {};
            }
            
            // ✅ إضافة: التحقق من التحميل التدريجي (بعد تعريف sheetMapping)
            if (incremental && !requestedSheets) {
                const allSheetsList = [...prioritySheets, ...sheets];
                const incompleteSheets = this.getIncompleteSheets(sheetMapping, allSheetsList);
                if (incompleteSheets && incompleteSheets.length > 0) {
                    sheets = incompleteSheets;
                    if (shouldLog) {
                        Utils.safeLog(`✅ تحميل تدريجي: ${incompleteSheets.length} ورقة غير مكتملة`);
                    }
                } else if (incompleteSheets !== null) {
                    // جميع الأوراق مكتملة
                    if (showLoader && typeof Loading !== 'undefined') {
                        Loading.hide();
                    }
                    if (notifyOnSuccess) {
                        Notification.success('جميع البيانات محدثة');
                    }
                    this._syncInProgress.global = false;
                    return true;
                }
            }
            
            // ✅ إضافة: تحديث userEmail في syncMeta
            AppState.syncMeta.userEmail = AppState.currentUser?.email || null;

            if (sheets.length === 0) {
                if (showLoader && typeof Loading !== 'undefined') {
                    Loading.hide();
                }
                if (shouldLog) {
                    Utils.safeLog('لا يوجد وراق لقراءة البيانات من الخادم');
                }
                return true;
            }

            // ✅ إصلاح: تحميل البيانات الأساسية أولاً بشكل منفصل ومتوازي
            const prioritySheetsInList = prioritySheets.filter(sheet => sheets.includes(sheet));
            const remainingSheets = sheets.filter(sheet => !prioritySheets.includes(sheet));
            
            let syncedCount = 0;
            const failedSheets = [];
            const results = [];

            // تحميل البيانات الأساسية أولاً بشكل متوازي (بدون batches)
            if (prioritySheetsInList.length > 0) {
                if (shouldLog) {
                    Utils.safeLog(`🚀 تحميل البيانات الأساسية أولاً: ${prioritySheetsInList.join(', ')}`);
                }
                
                if (showLoader && typeof Loading !== 'undefined') {
                    Loading.setProgress(10, `جاري تحميل البيانات الأساسية... (${prioritySheetsInList.length} ورقة)`);
                }

                // تحميل البيانات الأساسية بشكل متوازي تماماً
                const priorityResults = await Promise.allSettled(
                    prioritySheetsInList.map(sheetName =>
                        this.readFromSheets(sheetName)
                            .then(data => ({ sheetName, data, success: true }))
                            .catch(error => ({ sheetName, error, success: false }))
                    )
                );

                // ✅ تحسين: معالجة نتائج البيانات الأساسية فوراً مع معالجة أفضل للأخطاء
                priorityResults.forEach((result, idx) => {
                    const sheetName = prioritySheetsInList[idx];
                    if (result.status === 'fulfilled') {
                        const { data, error, success } = result.value;
                        if (success && !error && data) {
                            const key = sheetMapping[sheetName];
                            if (key) {
                                // ✅ التأكد من أن البيانات هي array
                                if (Array.isArray(data)) {
                                    AppState.appData[key] = data;
                                    if (data.length > 0) {
                                        syncedCount++;
                                        if (shouldLog) {
                                            Utils.safeLog(`✅ تم تحميل ${sheetName}: ${data.length} سجل`);
                                        }
                                    } else if (shouldLog) {
                                        Utils.safeLog(`✅ ${sheetName} فارغة (تم التحميل بنجاح)`);
                                    }
                                } else {
                                    // ✅ تحسين: إذا لم تكن array، نستخدم البيانات القديمة بدلاً من استبدالها بمصفوفة فارغة
                                    const oldData = AppState.appData[key] || [];
                                    if (oldData.length > 0) {
                                        // الاحتفاظ بالبيانات القديمة
                                        if (shouldLog) {
                                            Utils.safeWarn(`⚠️ ${sheetName} لم تُرجع array - الاحتفاظ بالبيانات الحالية (${oldData.length} سجل)`);
                                        }
                                    } else {
                                        // فقط إذا لم تكن هناك بيانات قديمة، نستخدم مصفوفة فارغة
                                        AppState.appData[key] = [];
                                        if (shouldLog) {
                                            Utils.safeWarn(`⚠️ ${sheetName} لم تُرجع array ولا توجد بيانات قديمة - تم تعيينها إلى array فارغة`);
                                        }
                                    }
                                }
                            } else if (shouldLog) {
                                Utils.safeWarn(`⚠️ لم يتم العثور على mapping لـ ${sheetName}`);
                            }
                            results.push({ sheetName, data: Array.isArray(data) ? data : [], success: true });
                        } else {
                            failedSheets.push(sheetName);
                            const errorMsg = error?.message || error || 'خطأ غير معروف';
                            if (shouldLog) {
                                Utils.safeWarn(`⚠️ فشل تحميل ${sheetName}:`, errorMsg);
                            }
                            results.push({ sheetName, error: errorMsg, success: false });
                        }
                    } else {
                        failedSheets.push(sheetName);
                        const errorMsg = result.reason?.message || result.reason || 'خطأ غير معروف';
                        if (shouldLog) {
                            Utils.safeWarn(`⚠️ فشل تحميل ${sheetName}:`, errorMsg);
                        }
                        results.push({ 
                            sheetName, 
                            error: errorMsg, 
                            success: false 
                        });
                    }
                });

                // حفظ البيانات الأساسية فوراً
                if (syncedCount > 0) {
                    DataManager.save();
                    if (shouldLog) {
                        Utils.safeLog(`✅ تم حفظ البيانات الأساسية: ${syncedCount} ورقة`);
                    }
                }

                // ✅ إصلاح: تحديث الجلسة بعد تحميل بيانات المستخدمين
                if (prioritySheetsInList.includes('Users') && AppState.currentUser) {
                    setTimeout(() => {
                        if (typeof window.Auth !== 'undefined' && typeof window.Auth.updateUserSession === 'function') {
                            window.Auth.updateUserSession();
                            if (shouldLog) {
                                Utils.safeLog('✅ تم تحديث الجلسة بعد تحميل بيانات المستخدمين');
                            }
                        }
                    }, 100);
                }
            }

            // ✅ تحسين: تحميل جميع الأوراق المتبقية بشكل متوازي تماماً (بدون batches) لتسريع التحميل
            const totalSheets = remainingSheets.length;
            
            // ✅ إصلاح: تعريف baseProgress مرة واحدة قبل الحلقة لتجنب إعادة التعريف
            const baseProgress = prioritySheetsInList.length > 0 ? 30 : 10;
            
            if (showLoader && typeof Loading !== 'undefined') {
                Loading.setProgress(baseProgress, `جاري تحميل باقي البيانات... (${totalSheets} ورقة)`);
            }

            // ✅ تحسين: تحميل جميع الأوراق المتبقية بشكل متوازي تماماً (بدون batches) لتسريع التحميل
            if (remainingSheets.length > 0) {
                if (shouldLog) {
                    Utils.safeLog(`🚀 تحميل ${remainingSheets.length} ورقة بشكل متوازي تماماً...`);
                }

                // تحميل جميع الأوراق المتبقية بشكل متوازي تماماً
                const remainingResults = await Promise.allSettled(
                    remainingSheets.map(sheetName =>
                        this.readFromSheets(sheetName)
                            .then(data => ({ sheetName, data, success: true }))
                            .catch(error => ({ sheetName, error, success: false }))
                    )
                );

                // تحويل Promise.allSettled results إلى format موحد
                const normalizedRemainingResults = remainingResults.map((result, idx) => {
                    if (result.status === 'fulfilled') {
                        return result.value; // { sheetName, data, success: true } أو { sheetName, error, success: false }
                    } else {
                        // في حالة rejection، نعيد sheetName من remainingSheets
                        return {
                            sheetName: remainingSheets[idx],
                            error: result.reason?.message || result.reason || 'خطأ غير معروف',
                            success: false
                        };
                    }
                });

                results.push(...normalizedRemainingResults);

                // تحديث شريط التقدم بعد اكتمال التحميل
                if (showLoader && typeof Loading !== 'undefined') {
                    Loading.setProgress(90, `تم تحميل جميع البيانات... (${totalSheets}/${totalSheets})`);
                }
            }

            // ✅ تحسين: معالجة النتائج وتحديث الحالة مع معالجة أفضل للأخطاء
            results.forEach((result, index) => {
                // النتائج الآن في format موحد: { sheetName, data, error, success }
                const { sheetName, data, error, success } = result;
                const key = sheetMapping[sheetName];

                if (!key) {
                    if (shouldLog) {
                        Utils.safeWarn(`⚠️ لم يتم العثور على ربط (mapping) للورقة: ${sheetName}`);
                    }
                    return;
                }

                // ✅ تحسين: معالجة الأخطاء بشكل أفضل
                if (error || !success) {
                    if (!failedSheets.includes(sheetName)) {
                        failedSheets.push(sheetName);
                    }
                    const errorMsg = error?.message || error || 'خطأ غير معروف';
                    if (shouldLog) {
                        Utils.safeWarn(`⚠️ فشل استرجاع بيانات الورقة ${sheetName}:`, errorMsg);
                    }
                    // ✅ تحسين: الاحتفاظ بالبيانات المحلية إذا فشل التحميل
                    if (!AppState.appData[key] || !Array.isArray(AppState.appData[key])) {
                        // فقط إذا لم تكن هناك بيانات محلية، نستخدم مصفوفة فارغة
                        const oldData = AppState.appData[key];
                        if (!oldData || (Array.isArray(oldData) && oldData.length === 0)) {
                            AppState.appData[key] = [];
                        } else {
                            // الاحتفاظ بالبيانات القديمة
                            if (shouldLog) {
                                Utils.safeLog(`ℹ️ ${sheetName}: الاحتفاظ بالبيانات المحلية (${oldData.length} سجل) بعد فشل التحميل`);
                            }
                        }
                    } else {
                        // البيانات المحلية موجودة - الاحتفاظ بها
                        if (shouldLog) {
                            Utils.safeLog(`ℹ️ ${sheetName}: الاحتفاظ بالبيانات المحلية (${AppState.appData[key].length} سجل) بعد فشل التحميل`);
                        }
                    }
                    return;
                }

                // ✅ تحسين: التأكد من أن البيانات هي array قبل التحديث
                if (Array.isArray(data)) {
                    AppState.appData[key] = data;
                    if (data.length > 0) {
                        syncedCount++;
                        if (shouldLog) {
                            Utils.safeLog(`✅ تم تحديث بيانات الورقة ${sheetName} بنجاح: ${data.length} سجل`);
                        }
                    } else if (shouldLog) {
                        Utils.safeLog(`✅ الورقة ${sheetName} فارغة في الخادم (تم الاحتفاظ بالبيانات المحلية)`);
                    }
                    
                    // ✅ إضافة: تحديث syncMeta بعد تحميل ناجح
                    if (!AppState.syncMeta.sheets) {
                        AppState.syncMeta.sheets = {};
                    }
                    AppState.syncMeta.sheets[sheetName] = Date.now();
                    AppState.syncMeta.lastSyncTime = Date.now();
                } else {
                    // ✅ تحسين: إذا لم تكن array، نستخدم البيانات القديمة بدلاً من استبدالها بمصفوفة فارغة
                    const oldData = AppState.appData[key] || [];
                    if (oldData.length > 0) {
                        // الاحتفاظ بالبيانات القديمة
                        if (shouldLog) {
                            Utils.safeWarn(`⚠️ ${sheetName} لم تُرجع array - الاحتفاظ بالبيانات الحالية (${oldData.length} سجل)`);
                        }
                    } else {
                        // فقط إذا لم تكن هناك بيانات قديمة، نستخدم مصفوفة فارغة
                        AppState.appData[key] = [];
                        if (shouldLog) {
                            Utils.safeWarn(`⚠️ ${sheetName} لم تُرجع array ولا توجد بيانات قديمة - تم تعيينها إلى array فارغة`);
                        }
                    }
                }
            });

            // حفظ البيانات في localStorage
            if (showLoader && typeof Loading !== 'undefined') {
                Loading.setProgress(95, 'جاري حفظ البيانات في التخزين المحلي...');
            }

            ViolationTypesManager.ensureInitialized();
            PeriodicInspectionStore.ensureInitialized();

            DataManager.save();

            // ✅ إضافة: إرسال حدث لإعلام الموديولات باكتمال المزامنة
            // نرسل الحدث بعد حفظ البيانات للتأكد من تحديث الموديولات بالبيانات الجديدة
            if (typeof window !== 'undefined') {
                // استخدام setTimeout للتأكد من اكتمال حفظ البيانات
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('syncDataCompleted', {
                        detail: { 
                            syncedCount,
                            failedSheets,
                            sheets: Object.keys(sheetMapping).filter(sheet => 
                                sheets.includes(sheet) && AppState.appData[sheetMapping[sheet]]
                            )
                        }
                    }));
                }, 100);
            }

            // ✅ إصلاح: تحميل إعدادات الشركة (بما في ذلك الشعار) من قاعدة البيانات
            if (typeof DataManager !== 'undefined' && DataManager.loadCompanySettings) {
                try {
                    await DataManager.loadCompanySettings();

                    // تحديث الشعار في جميع الأماكن المخصصة بعد تحميله
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
                    if (AppState.companyLogo) {
                        window.dispatchEvent(new CustomEvent('companyLogoUpdated', {
                            detail: { logoUrl: AppState.companyLogo }
                        }));
                    }

                    if (shouldLog) {
                        Utils.safeLog('✅ تم تحميل إعدادات الشركة والشعار من قاعدة البيانات');
                    }
                } catch (error) {
                    Utils.safeWarn('⚠️ فشل تحميل إعدادات الشركة أثناء المزامنة:', error);
                }
            }

            // ✅ إصلاح: تحميل إعدادات النماذج (المواقع والمواقع الفرعية) بعد اكتمال المزامنة
            // هذا يضمن تحميل المواقع لجميع المستخدمين بعد المزامنة
            if (typeof Permissions !== 'undefined' && typeof Permissions.initFormSettingsState === 'function') {
                try {
                    await Permissions.initFormSettingsState();
                    if (shouldLog) {
                        const sitesCount = AppState.appData?.observationSites?.length || 0;
                        Utils.safeLog(`✅ تم تحميل إعدادات النماذج (${sitesCount} موقع) بعد المزامنة`);
                    }
                } catch (error) {
                    Utils.safeWarn('⚠️ فشل تحميل إعدادات النماذج بعد المزامنة:', error);
                }
            }

            // اكتمال المزامنة
            if (showLoader && typeof Loading !== 'undefined') {
                Loading.setProgress(100, 'اكتملت المزامنة بنجاح!');
                // إخفاء شريط التقدم بعد ثانية واحدة
                setTimeout(() => {
                    Loading.hide();
                }, 1000);
            } else if (showLoader && typeof Loading !== 'undefined') {
                Loading.hide();
            }

            const success = failedSheets.length === 0;

            if (success) {
                if (notifyOnSuccess && syncedCount > 0) {
                    Notification.success(`تمت مزامنة ${syncedCount} جداول من الخادم بنجاح`);
                } else if (shouldLog) {
                    Utils.safeLog(`اكتملت المزامنة بنجاح: ${syncedCount} جداول تم تحديثها`);
                }
            } else {
                if (notifyOnError) {
                    Notification.warning(`فشل مزامنة بعض الجداول: ${failedSheets.join(', ')}`);
                }
                if (shouldLog) {
                    Utils.safeWarn('فشل مزامنة بعض الجداول:', failedSheets);
                }
            }

            // إعادة تشغيل نظام عدم النشاط بعد اكتمال المزامنة
            if (typeof InactivityManager !== 'undefined' && AppState.currentUser && !inactivityWasPaused) {
                InactivityManager.resume();
            }

            this._syncInProgress.global = false;
            return success || syncedCount > 0;
        } catch (error) {
            this._syncInProgress.global = false;
            if (showLoader && typeof Loading !== 'undefined') {
                Loading.hide();
            }

            // إعادة تشغيل نظام عدم النشاط حتى في حالة الخطأ
            if (typeof InactivityManager !== 'undefined' && AppState.currentUser && !inactivityWasPaused) {
                InactivityManager.resume();
            }

            // قمع الأخطاء المتوقعة (عندما يكون الخادم غير مفعّل)
            const errorMsg = error.message || 'خطأ غير معروف';
            const isGoogleAppsScriptEnabled = AppState.googleConfig?.appsScript?.enabled && AppState.googleConfig?.appsScript?.scriptUrl;
            const isExpectedError = !isGoogleAppsScriptEnabled ||
                errorMsg.includes('معرف المصدر غير محدد') ||
                errorMsg.includes('الاتصال بالخادم غير مفعّل') ||
                (!isGoogleAppsScriptEnabled && (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')));

            if (!isExpectedError) {
                Utils.safeError('❌ خطأ في مزامنة البيانات:', error);
            }

            if (notifyOnError && !isExpectedError) {
                Notification.error('خطأ في المزامنة مع الخادم: ' + error.message);
            }
            return false;
        }
    },

    /**
     * يتم حفظ البيانات إلى الخادم عند توفر الاتصال
     * @param {string} sheetName - اسم الورقة في الخادم
     * @param {Array|Object} data - البيانات المراد حفظها
     * @param {Object} options - خيارات الحفظ
     * @returns {Promise<Object>} نتيجة الحفظ
     */
    async autoSave(sheetName, data, options = {}) {
        const {
            retryCount = 3,
            silent = true,
            useQueue = false
        } = options;

        const useSupabase = AppState.useSupabaseBackend === true;

        // عند استخدام Supabase لا يشترط تفعيل Google Apps Script أو spreadsheetId
        if (!useSupabase) {
            // التحقق من تفعيل الخادم (Google)
            if (!AppState.googleConfig?.appsScript?.enabled || !AppState.googleConfig?.appsScript?.scriptUrl) {
                if (!silent) {
                    Utils.safeWarn('الاتصال بالخادم غير مفعّل - سيتم حفظ البيانات محلياً');
                }
                if (typeof DataManager !== 'undefined' && DataManager.addToPendingSync) {
                    DataManager.addToPendingSync(sheetName, data);
                }
                return { success: false, shouldDefer: true, message: 'الاتصال بالخادم غير مفعّل' };
            }

            // التحقق من spreadsheetId
            const spreadsheetId = AppState.googleConfig.sheets?.spreadsheetId?.trim();
            if (!spreadsheetId || spreadsheetId === '' || spreadsheetId === 'YOUR_SPREADSHEET_ID_HERE') {
                if (!silent) {
                    Utils.safeWarn('معرف المصدر غير محدد - سيتم حفظ البيانات محلياً');
                }
                if (typeof DataManager !== 'undefined' && DataManager.addToPendingSync) {
                    DataManager.addToPendingSync(sheetName, data);
                }
                return { success: false, shouldDefer: true, message: 'معرف المصدر غير محدد' };
            }
        }

        const spreadsheetId = AppState.googleConfig?.sheets?.spreadsheetId?.trim() || null;

        try {
            // محاولة الحفظ مع إعادة المحاولة
            let lastError = null;

            for (let attempt = 1; attempt <= retryCount; attempt++) {
                try {
                    const result = await this.sendRequest({
                        action: 'saveToSheet',
                        data: {
                            sheetName: sheetName,
                            data: data,
                            spreadsheetId: spreadsheetId
                        }
                    });

                    if (result && result.success) {
                        // نجحت العملية - إزالة من قائمة الانتظار إن وجدت
                        if (typeof DataManager !== 'undefined' && DataManager.removeFromPendingSync) {
                            DataManager.removeFromPendingSync(sheetName);
                        }

                        if (!silent) {
                            Utils.safeLog(`✅ تم حفظ ${sheetName} في الخادم بنجاح`);
                        }

                        return { success: true, message: 'تم الحفظ بنجاح' };
                    } else {
                        lastError = result?.message || 'خطأ غير معروف';

                        if (attempt < retryCount) {
                            // انتظار قبل إعادة المحاولة (exponential backoff)
                            const delay = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    }
                } catch (attemptError) {
                    lastError = attemptError;

                    if (attempt < retryCount) {
                        const delay = Math.pow(2, attempt) * 500;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            // فشلت جميع المحاولات - إضافة إلى قائمة الانتظار
            if (typeof DataManager !== 'undefined' && DataManager.addToPendingSync) {
                DataManager.addToPendingSync(sheetName, data);
            }

            if (!silent) {
                Utils.safeWarn(`⚠️ فشل حفظ ${sheetName} بعد ${retryCount} محاولات - سيتم المحاولة لاحقاً`);
            }

            return {
                success: false,
                shouldDefer: true,
                message: lastError?.message || lastError?.toString() || 'فشل الحفظ بعد المحاولات'
            };

        } catch (error) {
            // في حالة الخطأ، إضافة إلى قائمة الانتظار
            if (typeof DataManager !== 'undefined' && DataManager.addToPendingSync) {
                DataManager.addToPendingSync(sheetName, data);
            }

            if (!silent) {
                Utils.safeError('❌ خطأ في autoSave:', error);
            }

            return {
                success: false,
                shouldDefer: true,
                message: error.message || error.toString()
            };
        }
    }
};

// Export to global window (for script tag loading)
if (typeof window !== 'undefined') {
    window.GoogleIntegration = GoogleIntegration;
}
