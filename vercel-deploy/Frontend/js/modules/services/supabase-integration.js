/**
 * Supabase Backend Integration
 * واجهة مطابقة لـ GoogleIntegration لاستخدام نفس التطبيق مع Supabase Edge Functions
 * يستخدم: AppState.useSupabaseBackend, AppState.supabaseUrl, AppState.supabaseAnonKey
 */
(function (global) {
    'use strict';

    var DEFAULT_SUPABASE_URL = 'https://rtxleteymcqmtzrozckh.supabase.co';
    var DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0eGxldGV5bWNxbXR6cm96Y2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2ODk1MTMsImV4cCI6MjA4NzI2NTUxM30.f5WdaRZXCTpRF65HWA2bZk7sXYxNKVhUtunuuGRX4rs';

    function getConfig() {
        var state = global.AppState || {};
        var url = (state.supabaseUrl || DEFAULT_SUPABASE_URL).trim();
        var key = (state.supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY).trim();
        var apiSecret = (state.hseApiSecret || (global.__CONFIG__ && global.__CONFIG__.HSE_API_SECRET) || '').toString().trim();
        var base = url.replace(/\/$/, '');
        var edgeUrl = base ? base + '/functions/v1/hse-api' : '';
        var useSupabase = state.useSupabaseBackend === true || (base && key && edgeUrl);
        return { useSupabase: !!useSupabase, url: base, anonKey: key, edgeUrl: edgeUrl, apiSecret: apiSecret };
    }

    function safeLog(/* ...args */) {
        if (typeof global.Utils !== 'undefined' && global.Utils.safeLog) {
            global.Utils.safeLog.apply(global.Utils, arguments);
        }
    }
    function safeWarn(/* ...args */) {
        if (typeof global.Utils !== 'undefined' && global.Utils.safeWarn) {
            global.Utils.safeWarn.apply(global.Utils, arguments);
        }
    }
    function safeError(/* ...args */) {
        if (typeof global.Utils !== 'undefined' && global.Utils.safeError) {
            global.Utils.safeError.apply(global.Utils, arguments);
        }
    }

    const SupabaseIntegration = {
        _syncInProgress: { users: false, global: false, lastSyncStart: null, lastSyncEnd: null },
        _cache: { data: new Map(), timestamps: new Map(), defaultTTL: 5 * 60 * 1000, maxSize: 100 },

        isSyncing(sheetName) {
            const key = (sheetName || 'users').toLowerCase();
            return this._syncInProgress[key] === true;
        },
        _setSyncState(sheetName, inProgress) {
            const key = (sheetName || 'users').toLowerCase();
            this._syncInProgress[key] = inProgress;
            if (inProgress) this._syncInProgress.lastSyncStart = Date.now();
            else this._syncInProgress.lastSyncEnd = Date.now();
        },

        prepareSheetPayload(sheetName, data) {
            if (sheetName !== 'Users') return data;
            if (!data || typeof data !== 'object') return data;
            const sanitize = function (user) {
                if (!user || typeof user !== 'object') return user;
                const s = { ...user };
                s.password = '***';
                return s;
            };
            return Array.isArray(data) ? data.map(sanitize) : sanitize(data);
        },

        _getCachedData(key) {
            const cached = this._cache.data.get(key);
            const ts = this._cache.timestamps.get(key);
            if (!cached || !ts || (Date.now() - ts) > this._cache.defaultTTL) return null;
            return cached;
        },
        _setCachedData(key, data) {
            this._cache.data.set(key, data);
            this._cache.timestamps.set(key, Date.now());
        },
        clearCache(pattern) {
            if (!pattern) {
                this._cache.data.clear();
                this._cache.timestamps.clear();
                return;
            }
            for (const k of this._cache.data.keys()) {
                if (k.includes(pattern)) {
                    this._cache.data.delete(k);
                    this._cache.timestamps.delete(k);
                }
            }
        },

        getOrCreateCSRFToken() {
            try {
                var token = sessionStorage.getItem('csrf_token');
                if (!token) {
                    var arr = new Uint8Array(32);
                    if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(arr);
                    token = Array.from(arr).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
                    sessionStorage.setItem('csrf_token', token);
                }
                return token;
            } catch (e) {
                return '';
            }
        },

        isValidGoogleAppsScriptUrl(url) {
            try {
                var u = new URL(url);
                return u.protocol === 'https:' && (u.hostname.includes('supabase') || u.hostname.includes('localhost'));
            } catch (e) {
                return false;
            }
        },

        getLocalData(action, data) {
            try {
                var key = 'supabase_local_' + action + '_' + JSON.stringify(data || {});
                var raw = localStorage.getItem(key);
                if (!raw) return null;
                return JSON.parse(raw);
            } catch (e) {
                return null;
            }
        },
        saveLocalData(action, result) {
            try {
                var key = 'supabase_local_' + action + '_' + JSON.stringify((result && result.data) || {});
                localStorage.setItem(key, JSON.stringify(result));
            } catch (e) {}
        },

        async sendToAppsScript(action, data) {
            var config = getConfig();
            if (!config.useSupabase || !config.edgeUrl || !config.anonKey) {
                return Promise.reject(new Error('Supabase غير مفعّل. يرجى تعيين supabaseUrl و supabaseAnonKey في الإعدادات.'));
            }
            var payload = {
                action: action,
                data: data || {},
                csrfToken: this.getOrCreateCSRFToken(),
                timestamp: new Date().toISOString()
            };
            var controller = new AbortController();
            var timeoutId = setTimeout(function () { controller.abort(); }, 120000);
            var headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + config.anonKey
            };
            if (config.apiSecret) {
                headers['X-API-Key'] = config.apiSecret;
            }
            try {
                var res = await fetch(config.edgeUrl, {
                    method: 'POST',
                    mode: 'cors',
                    credentials: 'omit',
                    headers: headers,
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                var text = await res.text();
                var out = null;
                try {
                    out = JSON.parse(text);
                } catch (e) {
                    return { success: false, message: text || res.statusText };
                }
                if (!res.ok) {
                    var msg = out.message || out.error || res.statusText || String(res.status);
                    safeError('[hse-api] ' + res.status + ' — action: ' + action + ' — ' + msg);
                    if (res.status === 401 && !config.apiSecret) {
                        safeWarn('[hse-api] تلميح 401: أضف في Supabase (Edge Functions → Secrets) السر HSE_ANON_KEY وقيمته = المفتاح العام (anon) من Project Settings → API، أو عيّن HSE_API_SECRET في js/config.js.');
                    }
                    return { success: false, message: msg };
                }
                return out;
            } catch (err) {
                clearTimeout(timeoutId);
                safeError('Supabase request failed:', err);
                throw new Error(err.message || 'فشل الاتصال بـ Supabase');
            }
        },

        async sendRequest(requestData) {
            var action = requestData && requestData.action;
            var data = (requestData && requestData.data) !== undefined ? requestData.data : {};
            if (!action) throw new Error('يجب إدخال action في الطلب');

            var config = getConfig();
            if (!config.useSupabase || !config.edgeUrl) {
                var local = this.getLocalData(action, data);
                if (local !== null) {
                    safeLog('استخدام البيانات المحلية (Supabase غير مفعّل):', action);
                    return local;
                }
                throw new Error('Supabase غير مفعّل. يرجى تعيين supabaseUrl و supabaseAnonKey في الإعدادات.');
            }

            try {
                var result = await this.sendToAppsScript(action, data);
                if (result && result.success === false) {
                    throw new Error(result.message || 'فشل في الطلب');
                }
                this.saveLocalData(action, result);
                return result;
            } catch (error) {
                var local = this.getLocalData(action, data);
                if (local !== null) {
                    safeLog('استخدام البيانات المحلية بعد فشل الطلب:', action);
                    return local;
                }
                var errMsg = (error && error.message) ? String(error.message) : '';
                if (errMsg.indexOf('Action not implemented') !== -1) {
                    safeLog('sendRequest (' + action + '): الخادم لم ينشر بعد هذا الإجراء.');
                } else {
                    safeError('sendRequest (' + action + '):', error);
                }
                throw error;
            }
        },

        async callBackend(action, data) {
            return this.sendRequest({ action: action, data: data || {} });
        },

        async fetchData(action, data) {
            return this.sendToAppsScript(action, data || {});
        },

        async autoSave(sheetName, data) {
            var config = getConfig();
            if (!config.useSupabase || !config.edgeUrl) {
                if (typeof global.DataManager !== 'undefined' && global.DataManager.addToPendingSync) {
                    global.DataManager.addToPendingSync(sheetName, data);
                }
                return;
            }
            try {
                var prepared = this.prepareSheetPayload(sheetName, data);
                await this.sendToAppsScript('saveToSheet', {
                    sheetName: sheetName,
                    data: prepared
                });
                if (typeof global.DataManager !== 'undefined' && global.DataManager.removeFromPendingSync) {
                    global.DataManager.removeFromPendingSync(sheetName);
                }
                this.clearCache(sheetName);
                safeLog('تم الحفظ إلى Supabase:', sheetName);
            } catch (err) {
                safeWarn('فشل الحفظ إلى Supabase ' + sheetName + ':', err.message);
                if (typeof global.DataManager !== 'undefined' && global.DataManager.addToPendingSync) {
                    global.DataManager.addToPendingSync(sheetName, data);
                }
            }
        },

        async immediateSyncWithRetry(action, data, maxRetries) {
            maxRetries = maxRetries || 3;
            var lastErr = null;
            for (var attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    var result = await this.sendToAppsScript(action, data);
                    if (result && result.success) return result;
                    lastErr = new Error(result && result.message || 'فشل المزامنة');
                } catch (e) {
                    lastErr = e;
                }
                if (attempt < maxRetries) {
                    await new Promise(function (r) { setTimeout(r, 500 * attempt); });
                }
            }
            return { success: false, message: (lastErr && lastErr.message) || 'فشل المزامنة', shouldDefer: true };
        },

        async readFromSheets(sheetName) {
            var res = await this.sendRequest({ action: 'readFromSheet', data: { sheetName: sheetName } });
            return (res && res.success && res.data) ? res.data : [];
        },

        async syncData(opts) {
            opts = opts || {};
            try {
                var users = await this.readFromSheets('Users');
                if (global.AppState && global.AppState.appData) global.AppState.appData.users = users || [];
                if (typeof global.DataManager !== 'undefined' && global.DataManager.save) global.DataManager.save();
                if (typeof window !== 'undefined' && window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('syncDataCompleted', { detail: { syncedCount: 1, sheets: ['users'], failedSheets: [] } }));
                }
                return true;
            } catch (e) {
                if (!opts.silent && global.Notification) global.Notification.error(e && e.message ? e.message : 'فشل المزامنة');
                return false;
            }
        },

        /** مزامنة المستخدمين من Supabase (مطلوب لتسجيل الدخول عند عدم وجود مستخدمين محليين) */
        async syncUsers(force) {
            try {
                this._setSyncState('users', true);
                var users = await this.readFromSheets('Users');
                if (global.AppState && global.AppState.appData) global.AppState.appData.users = Array.isArray(users) ? users : [];
                if (typeof global.DataManager !== 'undefined' && global.DataManager.save) global.DataManager.save();
                this._setSyncState('users', false);
                if (typeof window !== 'undefined' && window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('syncDataCompleted', { detail: { syncedCount: 1, sheets: ['users'], failedSheets: [] } }));
                }
                return true;
            } catch (e) {
                this._setSyncState('users', false);
                safeError('syncUsers failed:', e);
                return false;
            }
        },

        /** تهيئة الاتصال بقاعدة البيانات (مطابق لـ initializeSheets في الواجهة) */
        async initializeSheets() {
            return this.sendToAppsScript('initializeSheets', {});
        },

        /**
         * رفع ملف (صورة) إلى Supabase Storage عبر Edge Function.
         * مدعوم حالياً لصور المستخدمين (moduleName === 'Users').
         * يتطلب إنشاء bucket باسم "user-photo" في Supabase Storage مع صلاحية Public للقراءة.
         */
        async uploadFileToDrive(base64Data, fileName, mimeType, moduleName) {
            var config = getConfig();
            if (!config.useSupabase || !config.edgeUrl) {
                return { success: false, message: 'Supabase غير مفعّل. يرجى تعيين supabaseUrl و supabaseAnonKey.' };
            }
            // إزالة بادئة data URL إن وُجدت قبل الإرسال
            var rawBase64 = (base64Data || '').toString();
            if (rawBase64.indexOf('base64,') !== -1) {
                rawBase64 = rawBase64.substring(rawBase64.indexOf('base64,') + 7);
            }
            try {
                var result = await this.sendToAppsScript('uploadUserPhoto', {
                    base64Data: rawBase64,
                    fileName: fileName || ('user_photo_' + Date.now() + '.jpg'),
                    mimeType: mimeType || 'image/jpeg'
                });
                if (result && result.success && (result.directLink || result.publicUrl)) {
                    return {
                        success: true,
                        directLink: result.directLink || result.publicUrl,
                        publicUrl: result.publicUrl || result.directLink
                    };
                }
                return {
                    success: false,
                    message: (result && result.message) ? result.message : 'فشل رفع الملف'
                };
            } catch (err) {
                safeError('uploadFileToDrive (Supabase):', err);
                return {
                    success: false,
                    message: (err && err.message) ? err.message : 'فشل الاتصال بالخادم لرفع الملف'
                };
            }
        },
        async uploadMultipleFilesToDrive(files, moduleName) {
            if (!files || !files.length) return { success: false, message: 'لا توجد ملفات' };
            var first = files[0];
            var base64 = (first.base64Data || first.data || first.content || '').toString();
            var fileName = first.fileName || first.name || 'file_' + Date.now();
            var mimeType = first.mimeType || first.type || 'application/octet-stream';
            return this.uploadFileToDrive(base64, fileName, mimeType, moduleName);
        }
    };

    global.SupabaseIntegration = SupabaseIntegration;
    global.GoogleIntegration = SupabaseIntegration;
})(typeof window !== 'undefined' ? window : this);
