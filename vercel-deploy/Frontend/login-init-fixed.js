// ===== تهيئة مباشرة لشاشة تسجيل الدخول - نسخة محسنة ومحلولة =====

// عزل هذا الملف بالكامل لتجنب تلويث الـ global scope (خصوصاً اسم log)
(function () {
    'use strict';

    // Logger صامت في الإنتاج (لتقليل الضوضاء في Console)
    const log = (...args) => {
        try {
            if (typeof window !== 'undefined' && window.Utils && typeof window.Utils.safeLog === 'function') {
                window.Utils.safeLog(...args);
                return;
            }
        } catch (e) { /* ignore */ }
        // fallback: log فقط في localhost
        try {
            if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                console.log(...args);
            }
        } catch (e) { /* ignore */ }
    };

    log('🚀 تحميل login-init-fixed.js...');

    // ===== استرجاع كلمة المرور عبر الرابط (?resetToken=) =====
    function initResetTokenPage() {
        var params = typeof window !== 'undefined' && window.location && window.location.search ? new URLSearchParams(window.location.search) : null;
        var token = params && params.get('resetToken');
        if (!token) return;

        function hideResetCard() {
            var el = document.getElementById('reset-password-page-card');
            if (el) el.remove();
        }
        function showLoginAgain() {
            hideResetCard();
            if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname || '/');
            }
        }

        var card = document.createElement('div');
        card.id = 'reset-password-page-card';
        card.setAttribute('role', 'dialog');
        card.setAttribute('aria-labelledby', 'reset-password-title');
        card.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:1rem;';
        card.innerHTML = '<div class="modal-content" style="max-width:420px;width:100%;">' +
            '<div class="modal-header"><h2 id="reset-password-title" class="modal-title"><i class="fas fa-key ml-2"></i> تعيين كلمة مرور جديدة</h2><button type="button" class="modal-close" id="reset-password-close" aria-label="إغلاق">×</button></div>' +
            '<div class="modal-body">' +
            '<p class="text-gray-600 text-sm mb-4">أدخل كلمة المرور الجديدة (6 أحرف على الأقل).</p>' +
            '<label class="block text-sm font-semibold text-gray-700 mb-1">كلمة المرور الجديدة</label>' +
            '<input type="password" id="reset-new-password" class="form-input w-full mb-3" placeholder="••••••••" minlength="6" autocomplete="new-password">' +
            '<label class="block text-sm font-semibold text-gray-700 mb-1">تأكيد كلمة المرور</label>' +
            '<input type="password" id="reset-confirm-password" class="form-input w-full mb-4" placeholder="••••••••" minlength="6" autocomplete="new-password">' +
            '<div id="reset-password-error" class="text-red-600 text-sm mb-2" style="display:none;"></div>' +
            '<button type="button" id="reset-password-submit" class="btn-primary w-full"><i class="fas fa-check ml-2"></i> تعيين كلمة المرور</button>' +
            '</div></div>';
        document.body.appendChild(card);

        card.querySelector('#reset-password-close').addEventListener('click', showLoginAgain);
        card.addEventListener('click', function (e) {
            if (e.target === card) showLoginAgain();
        });

        function submitReset() {
            var newP = (document.getElementById('reset-new-password') || {}).value || '';
            var confirmP = (document.getElementById('reset-confirm-password') || {}).value || '';
            var errEl = document.getElementById('reset-password-error');
            var btn = document.getElementById('reset-password-submit');
            if (newP.length < 6) {
                if (errEl) { errEl.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'; errEl.style.display = 'block'; }
                return;
            }
            if (newP !== confirmP) {
                if (errEl) { errEl.textContent = 'كلمة المرور وتأكيدها غير متطابقين'; errEl.style.display = 'block'; }
                return;
            }
            if (errEl) errEl.style.display = 'none';
            if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i> جاري الحفظ...'; }

            function done(success, message) {
                if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check ml-2"></i> تعيين كلمة المرور'; }
                if (errEl) { errEl.textContent = message || ''; errEl.style.display = message ? 'block' : 'none'; }
                if (success) {
                    var body = card.querySelector('.modal-body');
                    if (body) {
                        body.innerHTML = '<div class="text-center py-4"><i class="fas fa-check-circle text-5xl text-green-500 mb-4"></i><p class="text-gray-700 mb-4">' + (message || 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.') + '</p><button type="button" class="btn-primary" id="reset-password-done-btn">تسجيل الدخول</button></div>';
                        document.getElementById('reset-password-done-btn').addEventListener('click', showLoginAgain);
                    }
                }
            }

            if (typeof window.GoogleIntegration !== 'undefined' && typeof window.GoogleIntegration.sendRequest === 'function') {
                window.GoogleIntegration.sendRequest({ action: 'resetPasswordWithToken', data: { token: token, newPassword: newP } })
                    .then(function (r) {
                        done(r && r.success, r && r.message);
                    })
                    .catch(function (err) {
                        done(false, (err && err.message) || 'حدث خطأ. تأكد من أن الرابط لم ينتهِ صلاحيته.');
                    });
            } else {
                var url = (window.AppState && window.AppState.supabaseUrl) ? (window.AppState.supabaseUrl.replace(/\/$/, '') + '/functions/v1/hse-api') : '';
                var key = (window.AppState && window.AppState.supabaseAnonKey) || '';
                var apiSecret = (window.AppState && window.AppState.hseApiSecret) ? String(window.AppState.hseApiSecret).trim() : '';
                if (!url || !key) {
                    done(false, 'التطبيق غير جاهز. حدّث الصفحة وحاول مرة أخرى.');
                    return;
                }
                var headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key };
                if (apiSecret) headers['X-API-Key'] = apiSecret;
                fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ action: 'resetPasswordWithToken', data: { token: token, newPassword: newP } })
                }).then(function (res) { return res.json(); }).then(function (r) {
                    done(r && r.success, r && r.message);
                }).catch(function () {
                    done(false, 'حدث خطأ في الاتصال. حدّث الصفحة وحاول مرة أخرى.');
                });
            }
        }
        document.getElementById('reset-password-submit').addEventListener('click', submitReset);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initResetTokenPage);
    } else {
        initResetTokenPage();
    }

    // ===== مزامنة المستخدمين قبل تسجيل الدخول (إعداد المزامنة) =====
    const LoginSyncSetup = (function () {
        const STORAGE_KEY = 'hse_google_config';
        const MODAL_ID = 'login-sync-settings-modal';

        function getDefaultGoogleConfig() {
            return {
                appsScript: { enabled: true, scriptUrl: 'https://script.google.com/macros/s/AKfycbyXvHP2gsfzPSVvurI_MH1kIYf7vVGBYK3m9fv26QPzv-eoD1d7tiLJPYjecyf2YJNSBw/exec' },
                sheets: { enabled: true, spreadsheetId: '1EanavJ2OodOmq8b1GagSj8baa-KF-o4mVme_Jlwmgxc', apiKey: '' },
                maps: { enabled: true, apiKey: '' }
            };
        }

        function mergeGoogleConfig(base, override) {
            const b = base || getDefaultGoogleConfig();
            const o = override || {};
            return {
                appsScript: Object.assign({}, b.appsScript || {}, o.appsScript || {}),
                sheets: Object.assign({}, b.sheets || {}, o.sheets || {}),
                maps: Object.assign({}, b.maps || {}, o.maps || {})
            };
        }

        function readStoredGoogleConfig() {
            let cfg = getDefaultGoogleConfig();
            try {
                if (typeof window !== 'undefined' && window.AppState && window.AppState.googleConfig) {
                    cfg = mergeGoogleConfig(cfg, window.AppState.googleConfig);
                }
            } catch (e) { /* ignore */ }

            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    cfg = mergeGoogleConfig(cfg, parsed);
                }
            } catch (e) { /* ignore */ }

            return cfg;
        }

        function persistGoogleConfig(cfg) {
            try {
                if (typeof window !== 'undefined' && window.AppState) {
                    window.AppState.googleConfig = cfg;
                }
            } catch (e) { /* ignore */ }

            try {
                if (typeof window !== 'undefined' && window.DataManager && typeof window.DataManager.saveGoogleConfig === 'function') {
                    // DataManager.saveGoogleConfig يقرأ من AppState.googleConfig
                    window.DataManager.saveGoogleConfig();
                    return true;
                }
            } catch (e) { /* ignore */ }

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
                return true;
            } catch (e) {
                return false;
            }
        }

        function isValidAppsScriptUrl(url) {
            const u = String(url || '').trim();
            if (!u) return false;
            try {
                if (typeof window !== 'undefined' &&
                    window.GoogleIntegration &&
                    typeof window.GoogleIntegration.isValidGoogleAppsScriptUrl === 'function') {
                    return !!window.GoogleIntegration.isValidGoogleAppsScriptUrl(u);
                }
            } catch (e) { /* ignore */ }

            // fallback بسيط
            if (!/^https:\/\/script\.google\.com\//i.test(u)) return false;
            if (!/\/exec(\?|#|$)/i.test(u)) return false;
            return true;
        }

        function isValidSpreadsheetId(id) {
            const v = String(id || '').trim();
            if (!v) return false;
            if (v === 'YOUR_SPREADSHEET_ID_HERE') return false;
            // غالباً أحرف/أرقام/شرطة/underscore
            return /^[a-zA-Z0-9-_]{15,}$/.test(v);
        }

        function notify(type, msg) {
            try {
                if (typeof window !== 'undefined' && window.Notification && typeof window.Notification[type] === 'function') {
                    window.Notification[type](msg);
                    return;
                }
            } catch (e) { /* ignore */ }
            try { alert(msg); } catch (e) { /* ignore */ }
        }

        function setModalStatus(text, kind = 'info') {
            const el = document.getElementById('login-sync-settings-status');
            if (!el) return;
            el.style.display = 'block';
            el.classList.remove('text-green-700', 'text-red-700', 'text-yellow-700', 'text-gray-700');
            if (kind === 'success') el.classList.add('text-green-700');
            else if (kind === 'error') el.classList.add('text-red-700');
            else if (kind === 'warning') el.classList.add('text-yellow-700');
            else el.classList.add('text-gray-700');
            el.textContent = text;
        }

        function closeModal() {
            const overlay = document.getElementById(MODAL_ID);
            if (overlay) {
                overlay.style.display = 'none';
            }
        }

        function ensureModal() {
            let overlay = document.getElementById(MODAL_ID);
            if (overlay) return overlay;

            overlay = document.createElement('div');
            overlay.id = MODAL_ID;
            overlay.className = 'modal-overlay';
            overlay.style.display = 'none';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-label', 'إعداد المزامنة');

            overlay.innerHTML = `
                <div class="modal-content" style="max-width: 560px;">
                    <div class="modal-header">
                        <div class="modal-title">إعداد المزامنة</div>
                        <button type="button" class="modal-close" id="login-sync-settings-close" aria-label="إغلاق">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">
                                    رابط واجهة API / الخادم (scriptUrl)
                                </label>
                                <input id="login-sync-script-url" type="url" class="form-input" dir="ltr"
                                    placeholder="https://script.google.com/macros/s/.../exec" autocomplete="off">
                                <p class="text-xs text-gray-500 mt-2">مهم: يجب أن ينتهي الرابط بـ <b>/exec</b> وأن يكون الـ Deploy مضبوط على Anyone.</p>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">
                                    معرف المصدر (spreadsheetId) — اختياري مع Supabase
                                </label>
                                <input id="login-sync-spreadsheet-id" type="text" class="form-input" dir="ltr"
                                    placeholder="مثال: 1AbC...XyZ" autocomplete="off">
                                <p class="text-xs text-gray-500 mt-2">مع Supabase لا حاجة له؛ يُستخدم للإصدار القديم فقط.</p>
                            </div>
                            <div id="login-sync-settings-status" class="text-sm text-gray-700" style="display:none;"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-primary" id="login-sync-settings-save">
                            حفظ + مزامنة المستخدمين
                        </button>
                        <button type="button" class="btn-secondary" id="login-sync-settings-cancel">
                            إلغاء
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Close handlers
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) closeModal();
            }, true);

            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                    const o = document.getElementById(MODAL_ID);
                    if (o && o.style.display !== 'none') closeModal();
                }
            }, true);

            return overlay;
        }

        function openModal() {
            const overlay = ensureModal();
            const cfg = readStoredGoogleConfig();

            const scriptInput = overlay.querySelector('#login-sync-script-url');
            const sheetInput = overlay.querySelector('#login-sync-spreadsheet-id');
            if (scriptInput) scriptInput.value = String(cfg.appsScript?.scriptUrl || '');
            if (sheetInput) sheetInput.value = String(cfg.sheets?.spreadsheetId || '');

            // reset status
            const status = overlay.querySelector('#login-sync-settings-status');
            if (status) status.style.display = 'none';

            overlay.style.display = 'flex';
            setTimeout(() => {
                try { scriptInput && scriptInput.focus(); } catch (e) { /* ignore */ }
            }, 50);
        }

        async function saveAndSyncUsers() {
            const overlay = ensureModal();
            const saveBtn = overlay.querySelector('#login-sync-settings-save');
            const scriptInput = overlay.querySelector('#login-sync-script-url');
            const sheetInput = overlay.querySelector('#login-sync-spreadsheet-id');

            const scriptUrl = String(scriptInput?.value || '').trim();
            const spreadsheetId = String(sheetInput?.value || '').trim();

            if (!isValidAppsScriptUrl(scriptUrl)) {
                setModalStatus('يرجى إدخال رابط واجهة API صحيح (ينتهي بـ /exec أو عنوان Supabase).', 'error');
                try { scriptInput && scriptInput.focus(); } catch (e) { /* ignore */ }
                return;
            }
            if (!isValidSpreadsheetId(spreadsheetId)) {
                setModalStatus('يرجى إدخال spreadsheetId صحيح.', 'error');
                try { sheetInput && sheetInput.focus(); } catch (e) { /* ignore */ }
                return;
            }

            const cfg = readStoredGoogleConfig();
            cfg.appsScript.enabled = true;
            cfg.appsScript.scriptUrl = scriptUrl;
            cfg.sheets.enabled = true;
            cfg.sheets.spreadsheetId = spreadsheetId;

            const persisted = persistGoogleConfig(cfg);
            if (!persisted) {
                setModalStatus('تعذر حفظ الإعدادات على هذا الجهاز (localStorage غير متاح).', 'error');
                return;
            }

            // Sync users (without logging in)
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.dataset.originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i> جاري المزامنة...';
            }

            setModalStatus('جاري مزامنة المستخدمين من قاعدة البيانات...', 'info');
            notify('info', 'جاري مزامنة المستخدمين...');

            try {
                if (typeof window === 'undefined' || !window.GoogleIntegration || typeof window.GoogleIntegration.syncUsers !== 'function') {
                    throw new Error('الاتصال بالخادم غير جاهز بعد. انتظر ثواني ثم حاول مرة أخرى.');
                }

                const ok = await window.GoogleIntegration.syncUsers(true);
                if (ok) {
                    // تعطيل bootstrap بعد نجاح المزامنة إن لزم
                    try {
                        if (window.Auth && typeof window.Auth.handleUsersSyncSuccess === 'function') {
                            window.Auth.handleUsersSyncSuccess();
                        }
                    } catch (e) { /* ignore */ }

                    const count = Array.isArray(window.AppState?.appData?.users) ? window.AppState.appData.users.length : 0;
                    setModalStatus(`✅ تمت مزامنة المستخدمين بنجاح. عدد المستخدمين: ${count}`, 'success');
                    notify('success', `✅ تمت مزامنة المستخدمين بنجاح (${count})`);
                } else {
                    setModalStatus('⚠️ لم تكتمل المزامنة (تحقق من الإعدادات/الاتصال).', 'warning');
                    notify('warning', '⚠️ لم تكتمل مزامنة المستخدمين.');
                }
            } catch (err) {
                const msg = err?.message || String(err || 'خطأ غير معروف');
                setModalStatus(`❌ فشلت المزامنة: ${msg}`, 'error');
                notify('error', `❌ فشلت المزامنة: ${msg}`);
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = saveBtn.dataset.originalText || 'حفظ + مزامنة المستخدمين';
                }
            }
        }

        function bindModalButtonsOnce() {
            const overlay = ensureModal();
            if (overlay.dataset.bound === 'true') return;

            const closeBtn = overlay.querySelector('#login-sync-settings-close');
            const cancelBtn = overlay.querySelector('#login-sync-settings-cancel');
            const saveBtn = overlay.querySelector('#login-sync-settings-save');

            if (closeBtn) closeBtn.addEventListener('click', function (e) { e.preventDefault(); closeModal(); }, true);
            if (cancelBtn) cancelBtn.addEventListener('click', function (e) { e.preventDefault(); closeModal(); }, true);
            if (saveBtn) saveBtn.addEventListener('click', function (e) { e.preventDefault(); saveAndSyncUsers(); }, true);

            overlay.dataset.bound = 'true';
        }

        function open() {
            bindModalButtonsOnce();
            openModal();
        }

        return { open };
    })();

    // جعل LoginSyncSetup متاحاً بشكل global لضمان عمله
    if (typeof window !== 'undefined') {
        window.LoginSyncSetup = LoginSyncSetup;
        log('✅ تم تسجيل LoginSyncSetup في window');
    }

    // منع ظهور بيانات الدخول في رابط الموقع (إن وُجدت بالـ query params)
    (function sanitizeLoginQueryParams() {
        function applyAndCleanup() {
            try {
                const params = new URLSearchParams(window.location.search || '');
                const urlUsername = params.get('username') || params.get('email') || '';
                // ⚠️ أمان: لا نقبل تمرير كلمة المرور عبر URL في الإنتاج
                const isDev = (window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname === '' ||
                    window.location.search.includes('dev=true'));
                const urlPassword = isDev ? (params.get('password') || '') : '';

                // تعبئة الحقول (إن كانت موجودة) ثم حذفها من الرابط
                const usernameInput = document.getElementById('username');
                const passwordInput = document.getElementById('password');

                if (usernameInput && urlUsername) usernameInput.value = urlUsername;
                if (passwordInput && urlPassword) passwordInput.value = urlPassword;

                if (params.has('username')) params.delete('username');
                if (params.has('email')) params.delete('email');
                if (params.has('password')) params.delete('password');

                const remaining = params.toString();
                const newUrl = window.location.pathname + (remaining ? `?${remaining}` : '') + (window.location.hash || '');
                // لا نعمل replaceState إذا لم يتغير شيء
                const currentCleanUrl = window.location.pathname + window.location.search + (window.location.hash || '');
                if (newUrl !== currentCleanUrl) {
                    window.history.replaceState(null, document.title, newUrl);
                }
            } catch (e) {
                // تجاهل أي خطأ (مهم: لا نكسر شاشة الدخول)
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyAndCleanup);
        } else {
            applyAndCleanup();
        }
    })();

// تهيئة فورية للأزرار - تعمل حتى لو لم تكن الوحدات محملة
(function initLoginButtonsImmediately() {
    'use strict';
    
    function setupPasswordToggle() {
        const passwordToggleBtn = document.getElementById('password-toggle-btn');
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('password-toggle-icon');
        
        if (!passwordToggleBtn || !passwordInput || !toggleIcon) {
            return false;
        }
        
        // إزالة جميع المعالجات القديمة
        const newBtn = passwordToggleBtn.cloneNode(true);
        passwordToggleBtn.parentNode.replaceChild(newBtn, passwordToggleBtn);
        
        // إزالة جميع المعالجات السابقة من الزر الجديد
        const cleanBtn = newBtn.cloneNode(true);
        newBtn.parentNode.replaceChild(cleanBtn, newBtn);
        
        cleanBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const currentPasswordInput = document.getElementById('password');
            const currentToggleIcon = document.getElementById('password-toggle-icon');
            
            if (currentPasswordInput && currentToggleIcon) {
                if (currentPasswordInput.type === 'password') {
                    currentPasswordInput.type = 'text';
                    currentToggleIcon.classList.remove('fa-eye');
                    currentToggleIcon.classList.add('fa-eye-slash');
                } else {
                    currentPasswordInput.type = 'password';
                    currentToggleIcon.classList.remove('fa-eye-slash');
                    currentToggleIcon.classList.add('fa-eye');
                }
            }
        }, true);
        
        log('✅ تم تفعيل زر إظهار/إخفاء كلمة المرور');
        return true;
    }
    
    function setupForgotPassword() {
        const forgotPasswordLink = document.getElementById('forgot-password-link');
        
        if (!forgotPasswordLink) {
            return false;
        }
        
        // إزالة جميع المعالجات القديمة
        const newLink = forgotPasswordLink.cloneNode(true);
        forgotPasswordLink.parentNode.replaceChild(newLink, forgotPasswordLink);
        
        // إزالة جميع المعالجات السابقة من الرابط الجديد
        const cleanLink = newLink.cloneNode(true);
        newLink.parentNode.replaceChild(cleanLink, newLink);
        
        cleanLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // محاولة استخدام UI.showForgotPasswordModal
            if (typeof window.UI !== 'undefined' && typeof window.UI.showForgotPasswordModal === 'function') {
                try {
                    window.UI.showForgotPasswordModal();
                } catch (error) {
                    console.error('❌ خطأ في عرض نافذة استعادة كلمة المرور:', error);
                    alert('ميزة استعادة كلمة المرور قيد التطوير.\n\nيرجى التواصل مع:\nYasser.diab@icapp.com.eg');
                }
            } else {
                alert('ميزة استعادة كلمة المرور قيد التطوير.\n\nيرجى التواصل مع:\nYasser.diab@icapp.com.eg');
            }
        }, true);
        
        log('✅ تم تفعيل رابط استعادة كلمة المرور');
        return true;
    }
    
    function setupHelpButton() {
        const helpBtn = document.getElementById('help-btn');
        
        if (!helpBtn) {
            return false;
        }
        
        // إزالة جميع المعالجات القديمة
        const newHelpBtn = helpBtn.cloneNode(true);
        helpBtn.parentNode.replaceChild(newHelpBtn, helpBtn);
        
        // إزالة جميع المعالجات السابقة من الزر الجديد
        const cleanHelpBtn = newHelpBtn.cloneNode(true);
        newHelpBtn.parentNode.replaceChild(cleanHelpBtn, newHelpBtn);
        
        cleanHelpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // محاولة استخدام UI.showHelpModal
            if (typeof window.UI !== 'undefined' && typeof window.UI.showHelpModal === 'function') {
                try {
                    window.UI.showHelpModal();
                } catch (error) {
                    console.error('❌ خطأ في عرض نافذة المساعدة:', error);
                    const helpMessage = `📋 مساعدة تسجيل الدخول

📞 للدعم:
Yasser.diab@icapp.com.eg`;
                    alert(helpMessage);
                }
            } else {
                const helpMessage = `📋 مساعدة تسجيل الدخول

📞 للدعم:
Yasser.diab@icapp.com.eg`;
                alert(helpMessage);
            }
        }, true);
        
        log('✅ تم تفعيل زر المساعدة');
        return true;
    }

    function setupSyncSettingsButton() {
        const btn = document.getElementById('sync-settings-btn');
        if (!btn) {
            log('⚠️ زر إعداد المزامنة غير موجود');
            return false;
        }
        if (btn.dataset.handlerBound === 'true') {
            log('ℹ️ زر إعداد المزامنة مفعّل بالفعل');
            return true;
        }

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            log('🖱️ تم النقر على زر إعداد المزامنة');
            
            try {
                // استخدام window.LoginSyncSetup مباشرة
                if (typeof window !== 'undefined' && window.LoginSyncSetup && typeof window.LoginSyncSetup.open === 'function') {
                    log('✅ فتح نافذة إعداد المزامنة...');
                    window.LoginSyncSetup.open();
                } else {
                    log('❌ LoginSyncSetup غير متاح');
                    throw new Error('LoginSyncSetup غير متاح بعد. انتظر قليلاً ثم حاول مرة أخرى.');
                }
            } catch (err) {
                console.error('❌ خطأ في فتح نافذة إعداد المزامنة:', err);
                alert('تعذر فتح نافذة إعداد المزامنة. يرجى تحديث الصفحة.\n\n' + (err?.message || ''));
            }
        }, true);

        btn.dataset.handlerBound = 'true';
        log('✅ تم تفعيل زر إعداد المزامنة');
        return true;
    }
    
    // محاولة التهيئة الفورية
    function tryInit() {
        const passwordOk = setupPasswordToggle();
        const forgotOk = setupForgotPassword();
        const helpOk = setupHelpButton();
        const syncOk = setupSyncSettingsButton();
        
        // زر إعداد المزامنة جديد وقد لا يكون موجوداً في نسخ قديمة
        const syncBtnExists = !!document.getElementById('sync-settings-btn');
        const syncReady = syncOk || !syncBtnExists;

        if (passwordOk && forgotOk && helpOk && syncReady) {
            log('✅ تم تهيئة جميع أزرار تسجيل الدخول بنجاح');
            return true;
        }
        return false;
    }
    
    // محاولة فورية
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (!tryInit()) {
                // إعادة المحاولة بعد قليل
                setTimeout(tryInit, 100);
            }
        });
    } else {
        if (!tryInit()) {
            // إعادة المحاولة بعد قليل
            setTimeout(tryInit, 100);
        }
    }
    
    // إعادة المحاولة عند تحميل الصفحة بالكامل
    window.addEventListener('load', function() {
        setTimeout(tryInit, 200);
    });
    
    // إعادة المحاولة كل ثانية حتى تنجح (لمدة 10 ثوان)
    let retryCount = 0;
    const retryInterval = setInterval(function() {
        if (tryInit() || retryCount >= 10) {
            clearInterval(retryInterval);
        }
        retryCount++;
    }, 1000);

    // التأكد من أن زر إعداد المزامنة يعمل حتى بعد تحميل الصفحة بالكامل
    window.addEventListener('load', function() {
        log('📄 تم تحميل الصفحة بالكامل - محاولة تفعيل زر إعداد المزامنة...');
        setTimeout(function() {
            const result = setupSyncSettingsButton();
            if (result) {
                log('✅ تم تفعيل زر إعداد المزامنة بعد تحميل الصفحة');
            } else {
                log('⚠️ فشل تفعيل زر إعداد المزامنة بعد تحميل الصفحة - الزر غير موجود؟');
            }
        }, 500);
    });
})();

// ===== تهيئة نموذج تسجيل الدخول =====
(function initLoginForm() {
    'use strict';
    
    function checkDependencies() {
        return typeof window.Auth !== 'undefined' && 
               typeof window.DataManager !== 'undefined' && 
               typeof window.UI !== 'undefined' && 
               typeof window.Notification !== 'undefined';
    }
    
    function setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        
        if (!loginForm) {
            return false;
        }
        
        // إزالة جميع المعالجات القديمة
        const newForm = loginForm.cloneNode(true);
        loginForm.parentNode.replaceChild(newForm, loginForm);

        // ⚠️ مهم: استبدال الـ form بالـ clone يمسح معالجات الأزرار الموجودة داخله
        // لذلك نعيد تفعيل (عرض كلمة المرور / نسيت كلمة المرور / مساعدة) بعد الاستبدال مباشرة
        (function rebindLoginAuxButtons() {
            // Password toggle
            const passwordToggleBtn = newForm.querySelector('#password-toggle-btn');
            const passwordInput = newForm.querySelector('#password');
            const toggleIcon = newForm.querySelector('#password-toggle-icon');

            if (passwordToggleBtn && passwordInput && toggleIcon) {
                // منع تكرار الربط لو تم استدعاء setupLoginForm أكثر من مرة
                if (passwordToggleBtn.dataset.handlerBound !== 'true') {
                    passwordToggleBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();

                        if (passwordInput.type === 'password') {
                            passwordInput.type = 'text';
                            toggleIcon.classList.remove('fa-eye');
                            toggleIcon.classList.add('fa-eye-slash');
                            passwordToggleBtn.setAttribute('aria-label', 'إخفاء كلمة المرور');
                            passwordToggleBtn.setAttribute('title', 'إخفاء كلمة المرور');
                        } else {
                            passwordInput.type = 'password';
                            toggleIcon.classList.remove('fa-eye-slash');
                            toggleIcon.classList.add('fa-eye');
                            passwordToggleBtn.setAttribute('aria-label', 'إظهار كلمة المرور');
                            passwordToggleBtn.setAttribute('title', 'إظهار كلمة المرور');
                        }

                        passwordInput.focus();
                    }, true);
                    passwordToggleBtn.dataset.handlerBound = 'true';
                }
            }

            // Forgot password link
            const forgotPasswordLink = newForm.querySelector('#forgot-password-link');
            if (forgotPasswordLink) {
                if (forgotPasswordLink.dataset.handlerBound !== 'true') {
                    forgotPasswordLink.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();

                        if (typeof window.UI !== 'undefined' && typeof window.UI.showForgotPasswordModal === 'function') {
                            try {
                                window.UI.showForgotPasswordModal();
                            } catch (error) {
                                console.error('❌ خطأ في عرض نافذة استعادة كلمة المرور:', error);
                                alert('ميزة استعادة كلمة المرور قيد التطوير.\n\nيرجى التواصل مع:\nYasser.diab@icapp.com.eg');
                            }
                        } else {
                            alert('ميزة استعادة كلمة المرور قيد التطوير.\n\nيرجى التواصل مع:\nYasser.diab@icapp.com.eg');
                        }
                    }, true);
                    forgotPasswordLink.dataset.handlerBound = 'true';
                }
            }

            // Help button
            const helpBtn = newForm.querySelector('#help-btn');
            if (helpBtn) {
                if (helpBtn.dataset.handlerBound !== 'true') {
                    helpBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();

                        if (typeof window.UI !== 'undefined' && typeof window.UI.showHelpModal === 'function') {
                            try {
                                window.UI.showHelpModal();
                            } catch (error) {
                                console.error('❌ خطأ في عرض نافذة المساعدة:', error);
                                const helpMessage = `📋 مساعدة تسجيل الدخول

📞 للدعم:
Yasser.diab@icapp.com.eg`;
                                alert(helpMessage);
                            }
                        } else {
                            const helpMessage = `📋 مساعدة تسجيل الدخول

📞 للدعم:
Yasser.diab@icapp.com.eg`;
                            alert(helpMessage);
                        }
                    }, true);
                    helpBtn.dataset.handlerBound = 'true';
                }
            }

            // Sync settings button
            const syncSettingsBtn = newForm.querySelector('#sync-settings-btn');
            if (syncSettingsBtn) {
                if (syncSettingsBtn.dataset.handlerBound !== 'true') {
                    syncSettingsBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        
                        log('🖱️ تم النقر على زر إعداد المزامنة (من form clone)');
                        
                        try {
                            // استخدام window.LoginSyncSetup مباشرة
                            if (typeof window !== 'undefined' && window.LoginSyncSetup && typeof window.LoginSyncSetup.open === 'function') {
                                log('✅ فتح نافذة إعداد المزامنة...');
                                window.LoginSyncSetup.open();
                            } else {
                                log('❌ LoginSyncSetup غير متاح');
                                throw new Error('LoginSyncSetup غير متاح بعد. انتظر قليلاً ثم حاول مرة أخرى.');
                            }
                        } catch (err) {
                            console.error('❌ خطأ في فتح نافذة إعداد المزامنة:', err);
                            alert('تعذر فتح نافذة إعداد المزامنة. يرجى تحديث الصفحة.\n\n' + (err?.message || ''));
                        }
                    }, true);
                    syncSettingsBtn.dataset.handlerBound = 'true';
                    log('✅ تم ربط زر إعداد المزامنة في form clone');
                }
            }
        })();
        
        var loginSubmitInProgress = false;
        newForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            if (loginSubmitInProgress) {
                log('⚠️ تم تجاهل ضغطة مكررة على تسجيل الدخول');
                return;
            }
            
            log('📝 محاولة تسجيل الدخول...');
            
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const rememberCheckbox = document.getElementById('remember-me');
            const submitBtn = newForm.querySelector('button[type="submit"]');
            
            if (!usernameInput || !passwordInput) {
                const errorMsg = 'خطأ في تحميل نموذج تسجيل الدخول';
                console.error('❌', errorMsg);
                if (typeof window.Notification !== 'undefined') {
                    window.Notification.error(errorMsg);
                } else {
                    alert(errorMsg);
                }
                return;
            }
            
            const email = usernameInput.value.trim();
            const password = passwordInput.value;
            const remember = rememberCheckbox ? rememberCheckbox.checked : false;
            
            if (!email || !password) {
                const errorMsg = 'يرجى إدخال البريد الإلكتروني وكلمة المرور';
                console.warn('⚠️', errorMsg);
                if (typeof window.Notification !== 'undefined') {
                    window.Notification.warning(errorMsg);
                } else {
                    alert(errorMsg);
                }
                return;
            }
            
            // التحقق من الوحدات
            if (!checkDependencies()) {
                const errorMsg = 'نظام المصادقة غير جاهز. يرجى تحديث الصفحة.';
                console.error('❌', errorMsg);
                alert(errorMsg);
                return;
            }
            
            // تعطيل الزر ومنع الضغط المزدوج
            loginSubmitInProgress = true;
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i> جاري تسجيل الدخول...';
            
            try {
                log('🔐 استدعاء Auth.login...');
                
                const result = await window.Auth.login(email, password, remember);
                log('📥 نتيجة تسجيل الدخول:', result);
                
                // فحص النتيجة
                let success = false;
                let requiresPasswordChange = false;
                let isFirstLogin = false;
                
                if (result === true) {
                    success = true;
                } else if (result && typeof result === 'object') {
                    success = result.success === true;
                    requiresPasswordChange = result.requiresPasswordChange === true;
                    isFirstLogin = result.isFirstLogin === true;
                }
                
                if (success) {
                    log('✅ تسجيل دخول ناجح!');
                    
                    // عدم إخفاء شاشة الدخول هنا — showMainApp يخفيها بعد تحميل الإعدادات ثم يعرض السياسة مباشرة (بدون شاشة تحضيرية)
                    // معالجة تغيير كلمة المرور إذا لزم الأمر
                    if (requiresPasswordChange || isFirstLogin) {
                        log('🔐 يتطلب تغيير كلمة المرور');
                    }
                    
                    // showMainApp يحمّل الإعدادات (الشاشة تبقى كما هي) ثم يخفي الدخول ويعرض السياسة مباشرة أو لوحة التحكم
                    if (typeof window.UI !== 'undefined' && window.UI.showMainApp) {
                        try {
                            await window.UI.showMainApp();
                        } catch (err) {
                            log('⚠️ خطأ في showMainApp:', err);
                            const loginScreen = document.getElementById('login-screen');
                            if (loginScreen) { loginScreen.style.display = 'none'; loginScreen.classList.remove('active', 'show'); }
                            document.body.classList.add('app-active');
                            const mainApp = document.getElementById('main-app');
                            if (mainApp) mainApp.style.display = 'flex';
                        }
                    } else if (typeof window.App !== 'undefined' && window.App.load) {
                        window.App.load();
                        const mainApp = document.getElementById('main-app');
                        if (mainApp) mainApp.style.display = 'flex';
                    }
                } else {
                    // تحسين رسالة الخطأ
                    let errorMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                    
                    if (result && typeof result === 'object') {
                        if (result.message) {
                            errorMsg = result.message;
                        } else if (result.error) {
                            errorMsg = result.error;
                        }
                    } else if (typeof result === 'string') {
                        errorMsg = result;
                    }
                    
                    // التحقق من أخطاء الاتصال بـ Google Services
                    const errorStr = JSON.stringify(result || '').toLowerCase();
                    if (errorStr.includes('cert_authority_invalid') || 
                        errorStr.includes('certificate') ||
                        errorStr.includes('err_cert') ||
                        errorStr.includes('ssl') ||
                        errorStr.includes('tls')) {
                        errorMsg = 'خطأ في الاتصال بالخادم. قد تكون هناك مشكلة في شهادة الأمان. يرجى التحقق من إعدادات الإنترنت والمتصفح.';
                    } else if (errorStr.includes('networkerror') || 
                               errorStr.includes('failed to fetch') ||
                               errorStr.includes('timeout') ||
                               errorStr.includes('network')) {
                        errorMsg = 'فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت وإعادة المحاولة.';
                    } else if (errorStr.includes('google') && 
                               (errorStr.includes('غير متاح') || 
                                errorStr.includes('not available') ||
                                errorStr.includes('خطأ') ||
                                errorStr.includes('error'))) {
                        errorMsg = 'خدمات الخادم غير متاحة حالياً. يرجى المحاولة لاحقاً أو التحقق من إعدادات الاتصال.';
                    }
                    
                    // فشل متوقع (بيانات خاطئة): تسجيل كتحذير فقط وليس كخطأ لتجنب تشويش الكونسول
                    var _shortMsg = (result && result.message && typeof result.message === 'string') ? result.message.split('\n')[0] : errorMsg;
                    var isCredentialsError = /اسم المستخدم|كلمة المرور|البريد الإلكتروني|غير صحيح|غير صحيحة/i.test(_shortMsg || '');
                    if (isCredentialsError) {
                        if (typeof log === 'function') log('⚠️ فشل تسجيل الدخول (بيانات خاطئة):', _shortMsg);
                        else console.warn('⚠️ فشل تسجيل الدخول:', _shortMsg);
                    } else {
                        console.error('❌ فشل تسجيل الدخول:', _shortMsg);
                    }
                    
                    if (typeof window.Notification !== 'undefined') {
                        window.Notification.error(errorMsg);
                    } else {
                        alert(errorMsg);
                    }
                    
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            } catch (error) {
                console.error('❌ خطأ في تسجيل الدخول:', error);
                let errorMsg = 'حدث خطأ: ' + (error.message || error);
                
                // التحقق من أخطاء الاتصال
                const errorStr = String(error.message || error || '').toLowerCase();
                if (errorStr.includes('cert_authority_invalid') || 
                    errorStr.includes('certificate') ||
                    errorStr.includes('err_cert') ||
                    errorStr.includes('ssl') ||
                    errorStr.includes('tls')) {
                    errorMsg = 'خطأ في الاتصال بالخادم. قد تكون هناك مشكلة في شهادة الأمان. يرجى التحقق من إعدادات الإنترنت والمتصفح.';
                } else if (errorStr.includes('networkerror') || 
                           errorStr.includes('failed to fetch') ||
                           errorStr.includes('timeout') ||
                           errorStr.includes('network')) {
                    errorMsg = 'فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت وإعادة المحاولة.';
                } else if (errorStr.includes('google') && 
                           (errorStr.includes('غير متاح') || 
                            errorStr.includes('not available') ||
                            errorStr.includes('خطأ') ||
                            errorStr.includes('error'))) {
                    errorMsg = 'خدمات الخادم غير متاحة حالياً. يرجى المحاولة لاحقاً أو التحقق من إعدادات الاتصال.';
                }
                
                if (typeof window.Notification !== 'undefined') {
                    window.Notification.error(errorMsg);
                } else {
                    alert(errorMsg);
                }
                
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
            finally {
                loginSubmitInProgress = false;
            }
        }, true);
        
        log('✅ تم تفعيل نموذج تسجيل الدخول');
        return true;
    }
    
    // انتظار تحميل الوحدات
    function waitForDependenciesAndInit() {
        if (checkDependencies()) {
            log('✅ جميع الوحدات محملة - تهيئة نموذج تسجيل الدخول...');
            setupLoginForm();
            return;
        }
        
        log('⏳ انتظار تحميل الوحدات المطلوبة...');
        let attempts = 0;
        const maxAttempts = 200; // 20 ثانية كحد أقصى
        
        const checkInterval = setInterval(function() {
            attempts++;
            
            if (checkDependencies()) {
                clearInterval(checkInterval);
                log('✅ جميع الوحدات محملة بعد ' + attempts + ' محاولة - تهيئة نموذج تسجيل الدخول...');
                setupLoginForm();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('❌ انتهت محاولات انتظار الوحدات');
                console.error('الوحدات المفقودة:', {
                    Auth: typeof window.Auth === 'undefined' ? '❌' : '✅',
                    DataManager: typeof window.DataManager === 'undefined' ? '❌' : '✅',
                    UI: typeof window.UI === 'undefined' ? '❌' : '✅',
                    Notification: typeof window.Notification === 'undefined' ? '❌' : '✅'
                });
            }
        }, 100);
    }
    
    // بدء العملية
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            waitForDependenciesAndInit();
        });
    } else {
        waitForDependenciesAndInit();
    }
    
    // إعادة المحاولة عند تحميل الصفحة بالكامل
    window.addEventListener('load', function() {
        setTimeout(function() {
            if (checkDependencies()) {
                setupLoginForm();
            }
        }, 500);
    });
})();

// تحميل بيانات "تذكرني"
(function loadRememberMe() {
    'use strict';
    
    function loadRememberedUser() {
        try {
            const rememberedUser = localStorage.getItem('hse_remember_user');
            if (rememberedUser) {
                const userData = JSON.parse(rememberedUser);
                const usernameInput = document.getElementById('username');
                const rememberCheckbox = document.getElementById('remember-me');
                
                if (usernameInput && userData.email) {
                    usernameInput.value = userData.email;
                }
                if (rememberCheckbox) {
                    rememberCheckbox.checked = true;
                }
                log('✅ تم تحميل بيانات "تذكرني"');
            }
        } catch (error) {
            console.warn('⚠️ خطأ في تحميل "تذكرني":', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadRememberedUser);
    } else {
        loadRememberedUser();
    }
})();

// تهيئة الشعار في شاشة تسجيل الدخول عند تحميل الصفحة
(function initLoginLogo() {
    'use strict';
    
    function updateLoginLogo() {
        // التحقق من وجود UI و AppState
        if (typeof window.UI === 'undefined' || typeof window.UI.updateLoginLogo !== 'function') {
            return false;
        }
        
        // محاولة تحديث الشعار
        try {
            window.UI.updateLoginLogo();
            log('✅ تم تحديث شعار الشركة في شاشة تسجيل الدخول');
            return true;
        } catch (error) {
            console.warn('⚠️ خطأ في تحديث شعار الشركة:', error);
            return false;
        }
    }
    
    // تحديث الشعار عند تحميل DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // انتظار تحميل UI و AppState
            let attempts = 0;
            const maxAttempts = 50; // 5 ثوانٍ
            const checkInterval = setInterval(function() {
                attempts++;
                if (updateLoginLogo() || attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                }
            }, 100);
        });
    } else {
        // DOM محمل بالفعل - محاولة مباشرة
        setTimeout(function() {
            let attempts = 0;
            const maxAttempts = 50;
            const checkInterval = setInterval(function() {
                attempts++;
                if (updateLoginLogo() || attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                }
            }, 100);
        }, 500);
    }
    
    // تحديث الشعار عند تحميل الصفحة بالكامل
    window.addEventListener('load', function() {
        setTimeout(updateLoginLogo, 1000);
    });
    
    // الاستماع لتحديثات الشعار
    window.addEventListener('storage', function(e) {
        if (e.key === 'hse_company_logo' || e.key === 'company_logo') {
            setTimeout(updateLoginLogo, 100);
        }
    });
    
    // الاستماع للأحداث المخصصة لتحديث الشعار
    window.addEventListener('companyLogoUpdated', function(e) {
        if (e.detail && e.detail.logoUrl) {
            setTimeout(updateLoginLogo, 100);
        }
    });
})();

// تحديث عدد تسجيلات الدخول في الفوتر
(function updateLoginCount() {
    'use strict';
    
    function calculateLoginCount() {
        try {
            // محاولة الحصول على عدد تسجيلات الدخول الإجمالي من systemStatistics
            if (typeof window.AppState !== 'undefined' && window.AppState.appData) {
                // أولوية: استخدام systemStatistics.totalLogins إذا كان موجوداً
                if (window.AppState.appData.systemStatistics && 
                    typeof window.AppState.appData.systemStatistics.totalLogins === 'number') {
                    return window.AppState.appData.systemStatistics.totalLogins;
                }
                
                // إذا لم يكن موجوداً، حساب من loginHistory (للتوافق مع البيانات القديمة)
                if (window.AppState.appData.users && Array.isArray(window.AppState.appData.users)) {
                    let totalLogins = 0;
                    window.AppState.appData.users.forEach(user => {
                        if (user.loginHistory && Array.isArray(user.loginHistory)) {
                            totalLogins += user.loginHistory.length;
                        }
                    });
                    
                    // حفظ القيمة المحسوبة في systemStatistics للمرة القادمة
                    if (!window.AppState.appData.systemStatistics) {
                        window.AppState.appData.systemStatistics = {};
                    }
                    window.AppState.appData.systemStatistics.totalLogins = totalLogins;
                    
                    // حفظ التحديث
                    if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                        window.DataManager.save();
                    }
                    
                    return totalLogins;
                }
            }
            
            // محاولة الحصول على البيانات من localStorage
            try {
                const appDataStr = localStorage.getItem('hse_app_data');
                if (appDataStr) {
                    const appData = JSON.parse(appDataStr);
                    
                    // أولوية: استخدام systemStatistics.totalLogins إذا كان موجوداً
                    if (appData.systemStatistics && 
                        typeof appData.systemStatistics.totalLogins === 'number') {
                        return appData.systemStatistics.totalLogins;
                    }
                    
                    // إذا لم يكن موجوداً، حساب من loginHistory
                    if (appData.users && Array.isArray(appData.users)) {
                        let totalLogins = 0;
                        appData.users.forEach(user => {
                            if (user.loginHistory && Array.isArray(user.loginHistory)) {
                                totalLogins += user.loginHistory.length;
                            }
                        });
                        return totalLogins;
                    }
                }
            } catch (e) {
                // تجاهل الأخطاء
            }
            
            return 0;
        } catch (error) {
            console.warn('⚠️ خطأ في حساب عدد تسجيلات الدخول:', error);
            return 0;
        }
    }
    
    function updateLoginCountDisplay() {
        const loginCountElement = document.getElementById('login-count');
        if (loginCountElement) {
            const count = calculateLoginCount();
            loginCountElement.textContent = count.toLocaleString('ar-EG');
        }
    }
    
    function setupPrivacyPolicyLink() {
        const privacyLink = document.getElementById('privacy-policy-link');
        if (privacyLink) {
            privacyLink.addEventListener('click', function(e) {
                e.preventDefault();
                // يمكن إضافة نافذة سياسة الخصوصية هنا لاحقاً
                alert('سياسة الخصوصية\n\nنحن ملتزمون بحماية خصوصية المستخدمين. يتم تخزين البيانات بشكل آمن ولا يتم مشاركتها مع أطراف ثالثة.\n\nللمزيد من المعلومات، يرجى التواصل مع:\nYasser.diab@icapp.com.eg');
            });
        }
    }
    
    // تحديث العدد عند تحميل DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                updateLoginCountDisplay();
                setupPrivacyPolicyLink();
                
                // تحديث العدد بشكل دوري
                let attempts = 0;
                const maxAttempts = 50;
                const checkInterval = setInterval(function() {
                    attempts++;
                    updateLoginCountDisplay();
                    if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                    }
                }, 200);
            }, 500);
        });
    } else {
        setTimeout(function() {
            updateLoginCountDisplay();
            setupPrivacyPolicyLink();
        }, 500);
    }
    
    // تحديث العدد عند تحميل الصفحة بالكامل
    window.addEventListener('load', function() {
        setTimeout(updateLoginCountDisplay, 1000);
    });
    
    // تحديث العدد عند تغيير البيانات
    window.addEventListener('storage', function(e) {
        if (e.key === 'hse_app_data' || e.key === 'hse_current_session') {
            setTimeout(updateLoginCountDisplay, 100);
        }
    });
    
    // تحديث العدد عند تسجيل الدخول
    document.addEventListener('loginSuccess', function() {
        setTimeout(updateLoginCountDisplay, 500);
    });
})();

    log('✅ login-init-fixed.js تم تحميله بنجاح');
})();
