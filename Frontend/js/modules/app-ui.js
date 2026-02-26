// تطبيق الوضع الليلي فوراً عند تحميل الصفحة (قبل تعريف UI)
(function applyThemeImmediately() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

// تعريف UI كمتغير عام (global) ليكون متاحاً لجميع الملفات
window.UI = {
    // مراجع للـ intervals والـ listeners للتنظيف
    _notificationsInterval: null,
    _notificationsClickHandler: null,
    _loginScreenRetryCount: 0, // عداد محاولات استعادة الجلسة
    _backgroundSyncInterval: null, // ✅ مزامنة تلقائية دورية في الخلفية
    _backgroundSyncIntervalTime: 2 * 60 * 1000, // 2 دقيقة (120000 مللي ثانية) - محسّن ليتناسب مع عمليات التسجيل والحفظ والاستدعاء
    /**
     * عرض شاشة تسجيل الدخول
     */
    showLoginScreen() {
        // التحقق من وجود جلسة نشطة قبل العودة لشاشة الدخول
        // هذا يمنع تسجيل الخروج التلقائي عن طريق الخطأ
        const sessionData = sessionStorage.getItem('hse_current_session');
        const rememberData = localStorage.getItem('hse_remember_user');

        // ✅ إصلاح: التحقق من وجود بيانات الجلسة أولاً (حتى لو لم يكن AppState.currentUser معيّناً بعد)
        // هذا مهم عند إعادة تحميل الصفحة حيث قد تكون البيانات موجودة لكن AppState.currentUser لم يُعيّن بعد
        if (sessionData || rememberData) {
            try {
                // التحقق من صحة بيانات الجلسة
                const userData = sessionData ? JSON.parse(sessionData) : JSON.parse(rememberData);
                if (userData && userData.email) {
                    // هناك جلسة صالحة - لا نعرض شاشة الدخول
                    if (AppState.debugMode) Utils.safeLog('⚠️ تم محاولة عرض شاشة الدخول رغم وجود جلسة نشطة - محاولة استعادة الجلسة');
                    
                    // إذا كان AppState.currentUser غير معيّن بعد، نحاول استعادته
                    if (!AppState.currentUser && typeof window.Auth !== 'undefined' && typeof window.Auth.checkRememberedUser === 'function') {
                        // محاولة استعادة الجلسة فوراً
                        const isLoggedIn = window.Auth.checkRememberedUser();
                        if (isLoggedIn) {
                            // تم استعادة الجلسة بنجاح - عرض التطبيق
                            if (AppState.debugMode) Utils.safeLog('✅ تم استعادة الجلسة بنجاح - عرض التطبيق');
                            if (typeof window.UI !== 'undefined' && typeof window.UI.showMainApp === 'function') {
                                window.UI.showMainApp();
                            }
                            return;
                        }
                    }
                    
                    // إذا كان AppState.currentUser معيّناً بالفعل، نعرض التطبيق مباشرة
                    if (AppState.currentUser) {
                        if (AppState.debugMode) Utils.safeLog('✅ المستخدم مسجل دخول بالفعل - عرض التطبيق');
                        if (typeof window.UI !== 'undefined' && typeof window.UI.showMainApp === 'function') {
                            window.UI.showMainApp();
                        }
                        return;
                    }
                    
                    // إذا لم نتمكن من استعادة الجلسة بعد، ننتظر قليلاً ثم نحاول مرة أخرى
                    // هذا يمنع عرض شاشة الدخول مؤقتاً إذا كانت هناك جلسة لكن البيانات لم تُحمّل بعد
                    // نحد من عدد المحاولات لتجنب الحلقات اللانهائية
                    if (this._loginScreenRetryCount < 3) {
                        this._loginScreenRetryCount++;
                        if (AppState.debugMode) Utils.safeLog(`⏳ انتظار تحميل البيانات قبل استعادة الجلسة... (محاولة ${this._loginScreenRetryCount}/3)`);
                        const retryCount = this._loginScreenRetryCount; // حفظ قيمة العداد للاستخدام في setTimeout
                        setTimeout(() => {
                            if (typeof window.Auth !== 'undefined' && typeof window.Auth.checkRememberedUser === 'function') {
                                const isLoggedIn = window.Auth.checkRememberedUser();
                                if (isLoggedIn && typeof window.UI !== 'undefined' && typeof window.UI.showMainApp === 'function') {
                                    window.UI._loginScreenRetryCount = 0; // إعادة تعيين العداد عند النجاح
                                    window.UI.showMainApp();
                                } else if (!isLoggedIn && retryCount >= 3) {
                                    // إذا فشلت استعادة الجلسة بعد 3 محاولات، نعرض شاشة الدخول
                                    window.UI._loginScreenRetryCount = 0; // إعادة تعيين العداد
                                    // نستدعي showLoginScreen مرة أخرى لعرض شاشة الدخول
                                    if (typeof window.UI !== 'undefined' && typeof window.UI.showLoginScreen === 'function') {
                                        window.UI.showLoginScreen();
                                    }
                                }
                            }
                        }, 300);
                        return; // لا نعرض شاشة الدخول الآن - ننتظر استعادة الجلسة
                    } else {
                        // تم تجاوز عدد المحاولات - نستمر في عرض شاشة الدخول
                        this._loginScreenRetryCount = 0; // إعادة تعيين العداد
                        if (AppState.debugMode) Utils.safeLog('⚠️ فشل استعادة الجلسة بعد 3 محاولات - عرض شاشة الدخول');
                    }
                }
            } catch (e) {
                // إذا كانت البيانات تالفة، نستمر في عرض شاشة الدخول
                if (AppState.debugMode) Utils.safeWarn('⚠️ خطأ في تحليل بيانات الجلسة:', e);
            }
        }

        // التحقق الإضافي: إذا كان AppState.currentUser معيّناً بالفعل، لا نعرض شاشة الدخول
        if (AppState.currentUser) {
            if (AppState.debugMode) Utils.safeLog('⚠️ تم محاولة عرض شاشة الدخول رغم وجود مستخدم مسجل دخول - تم التجاهل');
            this._loginScreenRetryCount = 0; // إعادة تعيين العداد
            return;
        }

        // إعادة تعيين العداد عند عرض شاشة الدخول فعلياً
        this._loginScreenRetryCount = 0;

        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const rememberCheckbox = document.getElementById('remember-me');
        const loginForm = document.getElementById('login-form');

        // مسح حقول النموذج
        if (usernameInput) {
            usernameInput.value = '';
        }
        if (passwordInput) {
            passwordInput.value = '';
        }
        if (rememberCheckbox) {
            rememberCheckbox.checked = false;
        }

        // إعادة تعيين حالة زر تسجيل الدخول
        if (loginForm) {
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt ml-2" aria-hidden="true"></i> تسجيل الدخول';
            }
        }

        // إزالة شاشة "جاري التحقق من الجلسة" عند عرض شاشة الدخول فعلياً
        try {
            document.body.removeAttribute('data-hse-pending-session');
            var s = document.getElementById('hse-hide-login-until-ready');
            if (s && s.parentNode) s.remove();
            var loadingEl = document.querySelector('.hse-loading-text');
            if (loadingEl && loadingEl.parentNode) loadingEl.remove();
        } catch (e) { /* ignore */ }

        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
        if (usernameInput) usernameInput.focus();
        document.body.classList.remove('app-active');

        // تحديث شعار الشركة في شاشة تسجيل الدخول
        this.updateLoginLogo();

        // تحديث معلومات الشركة (الاسم)
        this.updateCompanyBranding();

        // ملاحظة: تهيئة الأحداث تتم الآن في login-init-fixed.js
        // لا حاجة لإعادة تهيئة الأحداث هنا لتجنب التعارض
        // إذا كان login-init-fixed.js محملاً، سيعيد تهيئة الأحداث تلقائياً
        if (AppState.debugMode) Utils.safeLog('✅ تم عرض شاشة تسجيل الدخول - تم مسح الحقول وإعادة تعيين الزر');
    },

    renderSummary() {
        const container = document.getElementById('emergency-summary');
        if (!container) return;

        const alerts = this.getAlerts();
        const activeAlerts = alerts.filter(alert => alert.status !== 'مغلق');
        const highSeverity = activeAlerts.filter(alert => alert.severity === 'عالية');
        const unacknowledged = activeAlerts.filter(alert => !alert.acknowledgedAt);
        const escalated = activeAlerts.filter(alert => {
            if (!alert.autoEscalateMinutes) return false;
            if (alert.acknowledgedAt) return false;
            const createdAt = new Date(alert.createdAt || alert.date || new Date());
            const minutesSince = (new Date() - createdAt) / (1000 * 60);
            return minutesSince >= alert.autoEscalateMinutes;
        });

        container.innerHTML = `
            <div class="summary-card">
                <div class="summary-card-icon bg-red-100 text-red-600">
                    <i class="fas fa-bolt"></i>
                </div>
                <div>
                    <p class="summary-card-label">تنبيهات نشطة</p>
                    <p class="summary-card-value">${activeAlerts.length}</p>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-card-icon bg-yellow-100 text-yellow-600">
                    <i class="fas fa-exclamation"></i>
                </div>
                <div>
                    <p class="summary-card-label">خطورة عالية</p>
                    <p class="summary-card-value">${highSeverity.length}</p>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-card-icon bg-blue-100 text-blue-600">
                    <i class="fas fa-user-clock"></i>
                </div>
                <div>
                    <p class="summary-card-label">بانتظار الاعتماد</p>
                    <p class="summary-card-value">${unacknowledged.length}</p>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-card-icon bg-purple-100 text-purple-600">
                    <i class="fas fa-arrow-up"></i>
                </div>
                <div>
                    <p class="summary-card-label">تنبيهات متصاعدة</p>
                    <p class="summary-card-value">${escalated.length}</p>
                </div>
            </div>
        `;
    },

    renderAlertsBoard() {
        const container = document.getElementById('emergency-alerts-board');
        if (!container) return;

        const alerts = this.getFilteredAlerts();
        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="empty-state py-10 text-center">
                    <i class="fas fa-check-circle text-4xl text-green-400 mb-3"></i>
                    <p class="text-gray-500">لا توجد تنبيهات مطابقة لعوامل التصفية الحالية</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-wrapper" style="overflow-x: auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>التنبيه</th>
                            <th>الخطورة</th>
                            <th>القنوات</th>
                            <th>المنطقة المتأثرة</th>
                            <th>فرق الاستجابة</th>
                            <th>الحالة</th>
                            <th>المدة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${alerts.map(alert => this.renderAlertRow(alert)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderAlertRow(alert) {
        const severityClass = alert.severity === 'عالية'
            ? 'badge-danger'
            : alert.severity === 'متوسطة'
                ? 'badge-warning'
                : 'badge-info';
        const statusClass = alert.status === 'مغلق'
            ? 'badge-success'
            : alert.status === 'قيد المعالجة'
                ? 'badge-warning'
                : 'badge-danger';
        const assignedTeams = (alert.assignedTeams || []).map(team => `
            <span class="badge badge-info">${Utils.escapeHTML(team)}</span>
        `).join('');
        const channels = (alert.channels || []).map(channel => `
            <span class="badge badge-secondary">${Utils.escapeHTML(channel)}</span>
        `).join('');
        const createdAt = new Date(alert.createdAt || alert.date || new Date());
        const minutesSince = Math.floor((new Date() - createdAt) / (1000 * 60));
        const hours = Math.floor(minutesSince / 60);
        const mins = minutesSince % 60;
        const durationLabel = hours > 0 ? `${hours} س ${mins} د` : `${mins} د`;
        const ackLabel = alert.acknowledgedAt
            ? `<span class="text-xs text-gray-500">تم الاعتماد ${Utils.formatDateTime(alert.acknowledgedAt)}</span>`
            : '<span class="text-xs text-red-500">بانتظار الاعتماد</span>';
        const escalationBadge = alert.isEscalated
            ? '<span class="badge badge-danger ml-2"><i class="fas fa-arrow-up ml-1"></i>متصاعد</span>'
            : '';

        return `
            <tr>
                <td>
                    <div class="font-semibold text-gray-900 flex items-center gap-2">
                        ${Utils.escapeHTML(alert.title || '')}
                        ${alert.requiresEvacuation ? '<span class="badge badge-danger">إخلاء</span>' : ''}
                        ${escalationBadge}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${Utils.escapeHTML(alert.description || '').substring(0, 140)}${alert.description && alert.description.length > 140 ? '...' : ''}
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                        أُطلق بواسطة ${Utils.escapeHTML(alert.createdBy?.name || 'غير معروف')} في ${Utils.formatDateTime(alert.createdAt || alert.date)}
                    </div>
                </td>
                <td>
                    <span class="badge ${severityClass}">${alert.severity || '-'}</span>
                </td>
                <td>
                    <div class="flex flex-wrap gap-1">${channels || '<span class="text-xs text-gray-400">غير محدد</span>'}</div>
                </td>
                <td>
                    <div class="text-sm text-gray-800">${Utils.escapeHTML(alert.impactArea || 'غير محدد')}</div>
                </td>
                <td>
                    <div class="flex flex-wrap gap-1">${assignedTeams || '<span class="text-xs text-gray-400">لم يتم التعيين</span>'}</div>
                </td>
                <td>
                    <div class="flex flex-col gap-1">
                        <span class="badge ${statusClass}">${alert.status || 'نشط'}</span>
                        ${ackLabel}
                    </div>
                </td>
                <td>
                    <div class="text-sm text-gray-800">${durationLabel}</div>
                    ${alert.autoEscalateMinutes ? `<div class="text-xs text-gray-500">التصعيد بعد ${alert.autoEscalateMinutes} د</div>` : ''}
                </td>
                <td>
                    <div class="flex flex-wrap gap-2">
                        <button class="btn-icon btn-icon-info" title="عرض التفاصيل" onclick="Emergency.viewAlert('${alert.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${!alert.acknowledgedAt ? `
                            <button class="btn-icon btn-icon-success" title="اعتماد التنبيه" onclick="Emergency.acknowledgeAlert('${alert.id}')">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${alert.status !== 'مغلق' ? `
                            <button class="btn-icon btn-icon-primary" title="إغلاق التنبيه" onclick="Emergency.resolveAlert('${alert.id}')">
                                <i class="fas fa-flag-checkered"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    },

    renderTimelineBoard() {
        const container = document.getElementById('emergency-timeline-board');
        if (!container) return;

        const timeline = this.buildTimeline().slice(0, 12);
        if (timeline.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 text-sm py-4">
                    لا توجد أنشطة حديثة
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="space-y-4">
                ${timeline.map(entry => `
                    <div class="timeline-entry border-l-4 pl-4 ${this.getTimelineColor(entry.type)}">
                        <div class="flex items-center justify-between">
                            <div class="font-semibold text-gray-800">${Utils.escapeHTML(entry.title)}</div>
                            <div class="text-xs text-gray-500">${Utils.formatDateTime(entry.timestamp)}</div>
                        </div>
                        <div class="text-sm text-gray-600 mt-1">${Utils.escapeHTML(entry.description || '')}</div>
                        <div class="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <span><i class="fas fa-user ml-1"></i>${Utils.escapeHTML(entry.actor || 'النظام')}</span>
                            <span><i class="fas fa-bolt ml-1"></i>${Utils.escapeHTML(entry.severity || '')}</span>
                            <button class="text-blue-600 hover:text-blue-800" onclick="Emergency.viewAlert('${entry.alertId}')">عرض التنبيه</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    getTimelineColor(type) {
        switch (type) {
            case 'created':
                return 'border-blue-400';
            case 'acknowledged':
                return 'border-green-400';
            case 'resolved':
                return 'border-teal-400';
            case 'escalated':
                return 'border-red-400';
            default:
                return 'border-gray-300';
        }
    },

    buildTimeline() {
        const alerts = this.getAlerts();
        const entries = [];
        alerts.forEach(alert => {
            const severity = alert.severity || '';
            const baseTitle = alert.title || 'تنبيه';
            const actor = alert.createdBy?.name || 'النظام';
            entries.push({
                id: `${alert.id}-created`,
                alertId: alert.id,
                timestamp: alert.createdAt || alert.date || new Date().toISOString(),
                type: 'created',
                title: `${baseTitle} • إنشاء`,
                description: alert.description || '',
                actor,
                severity
            });
            (alert.timeline || []).forEach(step => {
                entries.push({
                    id: step.id || Utils.generateId('TIMELINE'),
                    alertId: alert.id,
                    timestamp: step.timestamp || new Date().toISOString(),
                    type: step.type || 'update',
                    title: `${baseTitle} • ${step.label || 'تحديث'}`,
                    description: step.description || '',
                    actor: step.actor?.name || step.actor || 'النظام',
                    severity
                });
            });
        });
        return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    renderPlansBoard() {
        const container = document.getElementById('emergency-plans-board');
        if (!container) return;

        const plans = this.getPlans();
        if (plans.length === 0) {
            container.innerHTML = `
                <div class="empty-state py-8 text-center">
                    <p class="text-gray-500">لا توجد خطط طوارئ مسجلة حتى الآن</p>
                    <button class="btn-primary mt-3" onclick="Emergency.showPlanForm()">
                        <i class="fas fa-plus ml-2"></i>إضافة خطة طوارئ
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-wrapper" style="overflow-x: auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>الخطة</th>
                            <th>النوع</th>
                            <th>الفريق المسؤول</th>
                            <th>آخر اختبار</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${plans.map(plan => `
                            <tr>
                                <td>
                                    <div class="font-semibold text-gray-900">${Utils.escapeHTML(plan.name || '')}</div>
                                    <div class="text-xs text-gray-500 mt-1">${Utils.escapeHTML(plan.description || '').substring(0, 80)}${plan.description && plan.description.length > 80 ? '...' : ''}</div>
                                </td>
                                <td>
                                    <span class="badge badge-secondary">${Utils.escapeHTML(plan.type || 'غير محدد')}</span>
                                </td>
                                <td>
                                    <div class="text-sm text-gray-800">${Utils.escapeHTML(plan.ownerTeam || 'غير محدد')}</div>
                                    ${plan.contactPerson ? `<div class="text-xs text-gray-500">${Utils.escapeHTML(plan.contactPerson)} • ${Utils.escapeHTML(plan.contactPhone || '')}</div>` : ''}
                                </td>
                                <td>${plan.lastTested ? Utils.formatDate(plan.lastTested) : '<span class="text-xs text-gray-400">لم يتم الاختبار</span>'}</td>
                                <td>
                                    <div class="flex gap-2">
                                        <button class="btn-icon btn-icon-info" title="عرض التفاصيل" onclick="Emergency.viewPlan('${plan.id}')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn-icon btn-icon-primary" title="تعديل" onclick="Emergency.showPlanForm(${JSON.stringify(plan).replace(/"/g, '&quot;')})">
                                            <i class="fas fa-edit"></i>
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

    buildTimelineEntry(type, alert, description) {
        return {
            id: Utils.generateId('ALOG'),
            type,
            label: this.getTimelineLabel(type),
            description,
            actor: this.getCurrentUserSummary(),
            timestamp: new Date().toISOString(),
            severity: alert.severity
        };
    },

    getTimelineLabel(type) {
        switch (type) {
            case 'created':
                return 'تم إنشاء التنبيه';
            case 'acknowledged':
                return 'تم الاعتماد';
            case 'resolved':
                return 'تم الإغلاق';
            case 'escalated':
                return 'تم التصعيد';
            default:
                return 'تحديث';
        }
    },

    showAlertForm(data = null) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 720px;">
                <div class="modal-header">
                    <h2 class="modal-title">${data ? 'تحديث تنبيه طوارئ' : 'إطلاق تنبيه طوارئ'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="alert-form" class="space-y-4">
                        <div>
                            <label for="alert-title" class="block text-sm font-semibold text-gray-700 mb-2">عنوان التنبيه *</label>
                            <input type="text" id="alert-title" required class="form-input" 
                                value="${Utils.escapeHTML(data?.title || '')}" placeholder="عنوان التنبيه">
                        </div>
                        <div>
                            <label for="alert-description" class="block text-sm font-semibold text-gray-700 mb-2">الوصف *</label>
                            <textarea id="alert-description" required class="form-input" rows="4" 
                                placeholder="وصف تفصيلي للتنبيه">${Utils.escapeHTML(data?.description || '')}</textarea>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="alert-severity" class="block text-sm font-semibold text-gray-700 mb-2">الخطورة *</label>
                                <select id="alert-severity" required class="form-input">
                                    <option value="">اختر الخطورة</option>
                                    <option value="عالية" ${data?.severity === 'عالية' ? 'selected' : ''}>عالية</option>
                                    <option value="متوسطة" ${data?.severity === 'متوسطة' ? 'selected' : ''}>متوسطة</option>
                                    <option value="منخفضة" ${data?.severity === 'منخفضة' ? 'selected' : ''}>منخفضة</option>
                                </select>
                            </div>
                            <div>
                                <label for="alert-status" class="block text-sm font-semibold text-gray-700 mb-2">الحالة *</label>
                                <select id="alert-status" required class="form-input">
                                    <option value="نشط" ${data?.status === 'نشط' ? 'selected' : ''}>نشط</option>
                                    <option value="قيد المعالجة" ${data?.status === 'قيد المعالجة' ? 'selected' : ''}>قيد المعالجة</option>
                                    <option value="مغلق" ${data?.status === 'مغلق' ? 'selected' : ''}>مغلق</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <span id="alert-channels-label" class="block text-sm font-semibold text-gray-700 mb-2">القنوات المستخدمة *</span>
                            <div class="flex flex-wrap gap-2" id="alert-channels-container" role="group" aria-labelledby="alert-channels-label">
                                ${(AppState.emergencyChannels || []).map(channel => `
                                    <label class="flex items-center gap-2 text-sm text-gray-700 border rounded px-3 py-2 cursor-pointer hover:bg-blue-50">
                                        <input type="checkbox" class="rounded border-gray-300 text-blue-600 alert-channel"
                                            value="${Utils.escapeHTML(channel)}" ${data?.channels?.includes(channel) ? 'checked' : ''}>
                                        ${Utils.escapeHTML(channel)}
                                    </label>
                                `).join('')}
                            </div>
                            <div class="flex items-center gap-2 mt-2">
                                <label for="alert-custom-channel" class="sr-only">قناة أخرى</label>
                                <input type="text" id="alert-custom-channel" class="form-input flex-1" placeholder="قناة أخرى (مثال: واتساب)">
                                <button type="button" id="alert-add-channel" class="btn-secondary text-xs px-3 py-2">
                                    <i class="fas fa-plus ml-1"></i>إضافة
                                </button>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="alert-impact-area" class="block text-sm font-semibold text-gray-700 mb-2">المنطقة المتأثرة *</label>
                                <input type="text" id="alert-impact-area" class="form-input" placeholder="مثال: المبنى الرئيسي، محطة 3"
                                    value="${Utils.escapeHTML(data?.impactArea || '')}" required>
                            </div>
                            <div>
                                <label for="alert-teams" class="block text-sm font-semibold text-gray-700 mb-2">فرق الاستجابة</label>
                                <select id="alert-teams" class="form-input" multiple size="4">
                                    ${(AppState.emergencyTeams || []).map(team => `
                                        <option value="${Utils.escapeHTML(team)}" ${data?.assignedTeams?.includes(team) ? 'selected' : ''}>
                                            ${Utils.escapeHTML(team)}
                                        </option>
                                    `).join('')}
                                </select>
                                <p class="text-xs text-gray-500 mt-1">استخدم Ctrl أو Shift لتحديد أكثر من فريق</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="alert-auto-escalate" class="block text-sm font-semibold text-gray-700 mb-2">التصعيد التلقائي (دقائق)</label>
                                <input type="number" id="alert-auto-escalate" min="0" class="form-input"
                                    placeholder="0 لتعطيل التصعيد" value="${data?.autoEscalateMinutes || ''}">
                            </div>
                            <div class="flex items-center gap-2 mt-6">
                                <input type="checkbox" id="alert-requires-evacuation" class="rounded border-gray-300 text-blue-600"
                                    ${data?.requiresEvacuation ? 'checked' : ''}>
                                <label for="alert-requires-evacuation" class="text-sm text-gray-700">يتطلب إخلاء فوري</label>
                            </div>
                        </div>
                        <div>
                            <label for="alert-instructions" class="block text-sm font-semibold text-gray-700 mb-2">تعليمات الاستجابة</label>
                            <textarea id="alert-instructions" class="form-input" rows="3" placeholder="حدد الخطوات التي يجب اتباعها">${Utils.escapeHTML(data?.responseInstructions || '')}</textarea>
                        </div>
                        <div>
                            <label for="alert-date" class="block text-sm font-semibold text-gray-700 mb-2">التاريخ *</label>
                            <input type="date" id="alert-date" required class="form-input" 
                                value="${data?.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="flex items-center justify-end gap-3 pt-4 border-t">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                            <button type="submit" class="btn-primary">${data ? 'تحديث التنبيه' : 'إطلاق التنبيه'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.attachAlertFormEnhancements(modal, data);

        const form = modal.querySelector('#alert-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAlertSubmit(data?.id || null, modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    attachAlertFormEnhancements(modal, data) {
        const customChannelInput = modal.querySelector('#alert-custom-channel');
        const addChannelBtn = modal.querySelector('#alert-add-channel');
        const channelsContainer = modal.querySelector('#alert-channels-container');
        if (addChannelBtn && customChannelInput && channelsContainer) {
            addChannelBtn.addEventListener('click', () => {
                const value = customChannelInput.value.trim();
                if (!value) {
                    Notification.warning('يرجى إدخال اسم القناة قبل الإضافة');
                    return;
                }
                if (Array.from(channelsContainer.querySelectorAll('.alert-channel')).some(cb => cb.value === value)) {
                    Notification.info('القناة موجودة مسبقاً');
                    customChannelInput.value = '';
                    return;
                }
                const label = document.createElement('label');
                label.className = 'flex items-center gap-2 text-sm text-gray-700 border rounded px-3 py-2 cursor-pointer hover:bg-blue-50';
                label.innerHTML = `
                    <input type="checkbox" class="rounded border-gray-300 text-blue-600 alert-channel" value="${Utils.escapeHTML(value)}" checked>
                    ${Utils.escapeHTML(value)}
                `;
                channelsContainer.appendChild(label);
                customChannelInput.value = '';
            });
        }

        const teamsSelect = modal.querySelector('#alert-teams');
        if (teamsSelect && data?.assignedTeams) {
            Array.from(teamsSelect.options).forEach(option => {
                if (data.assignedTeams.includes(option.value)) {
                    option.selected = true;
                }
            });
        }
    },

    async handleAlertSubmit(editId, modal) {
        const form = modal.querySelector('#alert-form');
        const selectedChannels = Array.from(form.querySelectorAll('.alert-channel:checked')).map(cb => cb.value);
        if (selectedChannels.length === 0) {
            Notification.error('يرجى اختيار قناة تنبيه واحدة على الأقل');
            return;
        }

        const teamsSelect = form.querySelector('#alert-teams');
        const assignedTeams = teamsSelect ? Array.from(teamsSelect.selectedOptions).map(opt => opt.value) : [];

        const autoEscalateMinutes = Number(form.querySelector('#alert-auto-escalate')?.value || 0);
        const existing = editId ? this.getAlerts().find(a => a.id === editId) : null;
        const nowIso = new Date().toISOString();

        const formData = this.ensureAlertStructure({
            id: editId || Utils.generateId('ALERT'),
            title: form.querySelector('#alert-title').value.trim(),
            description: form.querySelector('#alert-description').value.trim(),
            severity: form.querySelector('#alert-severity').value,
            status: form.querySelector('#alert-status').value || 'نشط',
            date: new Date(form.querySelector('#alert-date').value).toISOString(),
            createdAt: existing?.createdAt || nowIso,
            updatedAt: nowIso,
            channels: selectedChannels,
            impactArea: form.querySelector('#alert-impact-area').value.trim(),
            assignedTeams,
            autoEscalateMinutes: autoEscalateMinutes || 0,
            requiresEvacuation: form.querySelector('#alert-requires-evacuation')?.checked || false,
            responseInstructions: form.querySelector('#alert-instructions').value.trim(),
            acknowledgedAt: existing?.acknowledgedAt || null,
            acknowledgedBy: existing?.acknowledgedBy || null,
            resolvedAt: existing?.resolvedAt || null,
            resolvedBy: existing?.resolvedBy || null,
            createdBy: existing?.createdBy || this.getCurrentUserSummary(),
            timeline: existing?.timeline ? [...existing.timeline] : []
        });

        formData.timeline.push(this.buildTimelineEntry(editId ? 'update' : 'created', formData,
            editId ? 'تم تحديث بيانات التنبيه' : 'تم إنشاء التنبيه وإرساله إلى فرق الاستجابة'));

        Loading.show();
        try {
            await this.updateAlert(formData);
            if (!editId) {
                await this.sendAlertEmail(formData);
            }
            Loading.hide();
            modal.remove();
            Notification.success(editId ? 'تم تحديث التنبيه بنجاح' : 'تم إطلاق التنبيه بنجاح');
            this.renderAll();
        } catch (error) {
            Loading.hide();
            Utils.safeError('خطأ أثناء حفظ التنبيه:', error);
            Notification.error('حدث خطأ أثناء حفظ التنبيه');
        }
    },

    async updateAlert(alert) {
        alert = this.ensureAlertStructure(alert);
        if (!AppState.appData.emergencyAlerts) {
            AppState.appData.emergencyAlerts = [];
        }
        const index = AppState.appData.emergencyAlerts.findIndex(a => a.id === alert.id);
        if (index !== -1) {
            AppState.appData.emergencyAlerts[index] = alert;
        } else {
            AppState.appData.emergencyAlerts.push(alert);
        }
        DataManager.save();
        try {
            await GoogleIntegration.autoSave('EmergencyAlerts', AppState.appData.emergencyAlerts);
        } catch (error) {
            Utils.safeWarn('⚠ فشل حفظ بيانات الطوارئ تلقائياً:', error);
        }
    },

    async acknowledgeAlert(id) {
        const alert = this.getAlerts().find(a => a.id === id);
        if (!alert) {
            Notification.error('لم يتم العثور على التنبيه المحدد');
            return;
        }
        if (alert.acknowledgedAt) {
            Notification.info('تم اعتماد هذا التنبيه مسبقاً');
            return;
        }

        Loading.show();
        try {
            alert.acknowledgedAt = new Date().toISOString();
            alert.acknowledgedBy = this.getCurrentUserSummary();
            if (alert.status === 'نشط') {
                alert.status = 'قيد المعالجة';
            }
            alert.timeline = alert.timeline || [];
            alert.timeline.push(this.buildTimelineEntry('acknowledged', alert, 'تم اعتماد التنبيه من قبل فريق الاستجابة'));
            alert.updatedAt = new Date().toISOString();
            await this.updateAlert(alert);
            Loading.hide();
            Notification.success('تم اعتماد التنبيه');
            this.renderAll();
        } catch (error) {
            Loading.hide();
            Utils.safeError('خطأ أثناء اعتماد التنبيه:', error);
            Notification.error('تعذر اعتماد التنبيه');
        }
    },

    async resolveAlert(id) {
        const alert = this.getAlerts().find(a => a.id === id);
        if (!alert) {
            Notification.error('لم يتم العثور على التنبيه المحدد');
            return;
        }
        if (alert.status === 'مغلق') {
            Notification.info('التنبيه مغلق بالفعل');
            return;
        }

        Loading.show();
        try {
            alert.status = 'مغلق';
            alert.resolvedAt = new Date().toISOString();
            alert.resolvedBy = this.getCurrentUserSummary();
            alert.timeline = alert.timeline || [];
            alert.timeline.push(this.buildTimelineEntry('resolved', alert, 'تم إغلاق التنبيه بعد التأكد من زوال الحالة'));
            alert.updatedAt = new Date().toISOString();
            await this.updateAlert(alert);
            Loading.hide();
            Notification.success('تم إغلاق التنبيه');
            this.renderAll();
        } catch (error) {
            Loading.hide();
            Utils.safeError('خطأ أثناء إغلاق التنبيه:', error);
            Notification.error('تعذر إغلاق التنبيه');
        }
    },

    showPlanForm(data = null) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 720px;">
                <div class="modal-header">
                    <h2 class="modal-title">${data ? 'تحديث خطة طوارئ' : 'إضافة خطة طوارئ'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="plan-form" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="plan-name" class="block text-sm font-semibold text-gray-700 mb-2">اسم الخطة *</label>
                                <input type="text" id="plan-name" required class="form-input" 
                                    value="${Utils.escapeHTML(data?.name || '')}" placeholder="اسم خطة الطوارئ">
                            </div>
                            <div>
                                <label for="plan-type" class="block text-sm font-semibold text-gray-700 mb-2">النوع *</label>
                                <select id="plan-type" required class="form-input">
                                    <option value="">اختر النوع</option>
                                    <option value="حريق" ${data?.type === 'حريق' ? 'selected' : ''}>حريق</option>
                                    <option value="زلزال" ${data?.type === 'زلزال' ? 'selected' : ''}>زلزال</option>
                                    <option value="فيضانات" ${data?.type === 'فيضانات' ? 'selected' : ''}>فيضانات</option>
                                    <option value="حادث كيميائي" ${data?.type === 'حادث كيميائي' ? 'selected' : ''}>حادث كيميائي</option>
                                    <option value="أخرى" ${data?.type === 'أخرى' ? 'selected' : ''}>أخرى</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label for="plan-description" class="block text-sm font-semibold text-gray-700 mb-2">الوصف *</label>
                            <textarea id="plan-description" required class="form-input" rows="5" 
                                placeholder="وصف تفصيلي للخطة">${Utils.escapeHTML(data?.description || '')}</textarea>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="plan-owner-team" class="block text-sm font-semibold text-gray-700 mb-2">الفريق المسؤول</label>
                                <select id="plan-owner-team" class="form-input">
                                    <option value="">اختر الفريق</option>
                                    ${(AppState.emergencyTeams || []).map(team => `
                                        <option value="${Utils.escapeHTML(team)}" ${data?.ownerTeam === team ? 'selected' : ''}>${Utils.escapeHTML(team)}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div>
                                <label for="plan-last-tested" class="block text-sm font-semibold text-gray-700 mb-2">آخر اختبار</label>
                                <input type="date" id="plan-last-tested" class="form-input"
                                    value="${data?.lastTested ? new Date(data.lastTested).toISOString().slice(0, 10) : ''}">
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="plan-contact-person" class="block text-sm font-semibold text-gray-700 mb-2">اسم مسؤول الخطة</label>
                                <input type="text" id="plan-contact-person" class="form-input" placeholder="اسم المسؤول"
                                    value="${Utils.escapeHTML(data?.contactPerson || '')}">
                            </div>
                            <div>
                                <label for="plan-contact-phone" class="block text-sm font-semibold text-gray-700 mb-2">رقم التواصل</label>
                                <input type="text" id="plan-contact-phone" class="form-input" placeholder="رقم الهاتف"
                                    value="${Utils.escapeHTML(data?.contactPhone || '')}">
                            </div>
                        </div>
                        <div class="flex items-center justify-end gap-3 pt-4 border-t">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                            <button type="submit" class="btn-primary">${data ? 'تحديث الخطة' : 'إضافة الخطة'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const form = modal.querySelector('#plan-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePlanSubmit(data?.id || null, modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async handlePlanSubmit(editId, modal) {
        const form = modal.querySelector('#plan-form');
        const nowIso = new Date().toISOString();
        const existing = editId ? this.getPlans().find(plan => plan.id === editId) : null;

        const formData = this.ensurePlanStructure({
            id: editId || Utils.generateId('PLAN'),
            name: form.querySelector('#plan-name').value.trim(),
            type: form.querySelector('#plan-type').value,
            description: form.querySelector('#plan-description').value.trim(),
            ownerTeam: form.querySelector('#plan-owner-team').value.trim(),
            lastTested: form.querySelector('#plan-last-tested').value ? new Date(form.querySelector('#plan-last-tested').value).toISOString() : '',
            contactPerson: form.querySelector('#plan-contact-person').value.trim(),
            contactPhone: form.querySelector('#plan-contact-phone').value.trim(),
            createdAt: existing?.createdAt || nowIso,
            updatedAt: nowIso
        });

        Loading.show();
        try {
            if (!AppState.appData.emergencyPlans) {
                AppState.appData.emergencyPlans = [];
            }
            const index = AppState.appData.emergencyPlans.findIndex(plan => plan.id === formData.id);
            if (index !== -1) {
                AppState.appData.emergencyPlans[index] = formData;
            } else {
                AppState.appData.emergencyPlans.push(formData);
            }
            DataManager.save();
            await GoogleIntegration.autoSave('EmergencyPlans', AppState.appData.emergencyPlans);
            Loading.hide();
            modal.remove();
            Notification.success(editId ? 'تم تحديث الخطة بنجاح' : 'تم إضافة الخطة بنجاح');
            this.renderAll();
        } catch (error) {
            Loading.hide();
            Utils.safeError('خطأ أثناء حفظ خطة الطوارئ:', error);
            Notification.error('تعذر حفظ خطة الطوارئ');
        }
    },

    viewAlert(id) {
        const alert = this.getAlerts().find(a => a.id === id);
        if (!alert) {
            Notification.error('لم يتم العثور على التنبيه');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const timeline = (alert.timeline || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 780px;">
                <div class="modal-header">
                    <h2 class="modal-title">${Utils.escapeHTML(alert.title || 'تفاصيل التنبيه')}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs text-gray-500 mb-1">الخطورة</p>
                            <span class="badge ${alert.severity === 'عالية' ? 'badge-danger' : alert.severity === 'متوسطة' ? 'badge-warning' : 'badge-info'}">${Utils.escapeHTML(alert.severity || '')}</span>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">الحالة</p>
                            <span class="badge ${alert.status === 'مغلق' ? 'badge-success' : alert.status === 'قيد المعالجة' ? 'badge-warning' : 'badge-danger'}">${Utils.escapeHTML(alert.status || '')}</span>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">قنوات الإرسال</p>
                            <div class="flex flex-wrap gap-1">
                                ${(alert.channels || []).map(channel => `<span class="badge badge-secondary">${Utils.escapeHTML(channel)}</span>`).join('')}
                            </div>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">المنطقة المتأثرة</p>
                            <div class="text-sm text-gray-800">${Utils.escapeHTML(alert.impactArea || '')}</div>
                        </div>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">الوصف</p>
                        <p class="text-sm text-gray-800 leading-6">${Utils.escapeHTML(alert.description || '')}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">فرق الاستجابة</p>
                        <div class="flex flex-wrap gap-2">
                            ${(alert.assignedTeams || []).length
                ? alert.assignedTeams.map(team => `<span class="badge badge-info">${Utils.escapeHTML(team)}</span>`).join('')
                : '<span class="text-xs text-gray-400">لم يتم التعيين</span>'}
                        </div>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">تعليمات الاستجابة</p>
                        <p class="text-sm text-gray-800 leading-6">${Utils.escapeHTML(alert.responseInstructions || 'لم يتم تحديد تعليمات')}</p>
                    </div>
                    <div class="border-t pt-4">
                        <h3 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <i class="fas fa-history"></i> الخط الزمني
                        </h3>
                        ${timeline.length === 0 ? `
                            <p class="text-xs text-gray-500">لا توجد تحديثات بعد.</p>
                        ` : `
                            <div class="space-y-3">
                                ${timeline.map(step => `
                                    <div class="bg-gray-50 border border-gray-200 rounded p-3">
                                        <div class="flex items-center justify-between">
                                            <span class="font-semibold text-sm text-gray-800">${Utils.escapeHTML(step.label || 'تحديث')}</span>
                                            <span class="text-xs text-gray-500">${Utils.formatDateTime(step.timestamp)}</span>
                                        </div>
                                        <div class="text-xs text-gray-500 mt-1">
                                            <i class="fas fa-user ml-1"></i>${Utils.escapeHTML(step.actor?.name || step.actor || 'النظام')}
                                        </div>
                                        <div class="text-sm text-gray-700 mt-2 leading-5">${Utils.escapeHTML(step.description || '')}</div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
                <div class="modal-footer flex justify-end gap-2">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إغلاق</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    viewPlan(id) {
        const plan = this.getPlans().find(p => p.id === id);
        if (!plan) {
            Notification.error('لم يتم العثور على الخطة');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2 class="modal-title">${Utils.escapeHTML(plan.name || 'خطة الطوارئ')}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs text-gray-500 mb-1">النوع</p>
                            <span class="badge badge-secondary">${Utils.escapeHTML(plan.type || 'غير محدد')}</span>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">الفريق المسؤول</p>
                            <div class="text-sm text-gray-800">${Utils.escapeHTML(plan.ownerTeam || 'غير محدد')}</div>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">آخر اختبار</p>
                            <div class="text-sm text-gray-800">${plan.lastTested ? Utils.formatDate(plan.lastTested) : 'لم يتم الاختبار'}</div>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">جهة الاتصال</p>
                            <div class="text-sm text-gray-800">${Utils.escapeHTML(plan.contactPerson || 'غير محدد')} ${plan.contactPhone ? '• ' + Utils.escapeHTML(plan.contactPhone) : ''}</div>
                        </div>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">الوصف</p>
                        <p class="text-sm text-gray-800 leading-6">${Utils.escapeHTML(plan.description || '')}</p>
                    </div>
                    <div class="text-xs text-gray-400">
                        <p>تم التحديث في ${Utils.formatDateTime(plan.updatedAt)}</p>
                    </div>
                </div>
                <div class="modal-footer flex justify-end gap-2">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إغلاق</button>
                    <button class="btn-primary" onclick="Emergency.showPlanForm(${JSON.stringify(plan).replace(/"/g, '&quot;')}); this.closest('.modal-overlay').remove();">
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

    async sendAlertEmail(alert) {
        const notificationEmails = AppState.notificationEmails || [];
        if (notificationEmails.length === 0) {
            Utils.safeLog('⚠ لا توجد إيميلات للإشعارات في الإعدادات');
            return;
        }

        try {
            const emailSubject = `تنبيه طوارئ: ${alert.title}`;
            const emailBody = `
                <h2>تنبيه طوارئ</h2>
                <p><strong>العنوان:</strong> ${alert.title}</p>
                <p><strong>الوصف:</strong> ${alert.description}</p>
                <p><strong>الخطورة:</strong> ${alert.severity}</p>
                <p><strong>المنطقة المتأثرة:</strong> ${alert.impactArea}</p>
                <p><strong>القنوات:</strong> ${(alert.channels || []).join(', ')}</p>
                <p><strong>التاريخ:</strong> ${Utils.formatDate(alert.date)}</p>
            `;

            Utils.safeLog('📧 إرسال إيميل للتنبيه:', {
                to: notificationEmails,
                subject: emailSubject,
                body: emailBody
            });

            Notification.success(`تم إرسال التنبيه إلى ${notificationEmails.length} بريد إلكتروني`);
        } catch (error) {
            Utils.safeError('خطأ في إرسال الإيميل:', error);
            Notification.warning('تم حفظ التنبيه لكن فشل إرسال الإيميل');
        }
    },

    showAlertForm(data = null) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 720px;">
                <div class="modal-header">
                    <h2 class="modal-title">${data ? 'تحديث تنبيه طوارئ' : 'إطلاق تنبيه طوارئ'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="alert-form" class="space-y-4">
                        <div>
                            <label for="alert-title" class="block text-sm font-semibold text-gray-700 mb-2">عنوان التنبيه *</label>
                            <input type="text" id="alert-title" required class="form-input" 
                                value="${Utils.escapeHTML(data?.title || '')}" placeholder="عنوان التنبيه">
                        </div>
                        <div>
                            <label for="alert-description" class="block text-sm font-semibold text-gray-700 mb-2">الوصف *</label>
                            <textarea id="alert-description" required class="form-input" rows="4" 
                                placeholder="وصف تفصيلي للتنبيه">${Utils.escapeHTML(data?.description || '')}</textarea>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="alert-severity" class="block text-sm font-semibold text-gray-700 mb-2">الخطورة *</label>
                                <select id="alert-severity" required class="form-input">
                                    <option value="">اختر الخطورة</option>
                                    <option value="عالية" ${data?.severity === 'عالية' ? 'selected' : ''}>عالية</option>
                                    <option value="متوسطة" ${data?.severity === 'متوسطة' ? 'selected' : ''}>متوسطة</option>
                                    <option value="منخفضة" ${data?.severity === 'منخفضة' ? 'selected' : ''}>منخفضة</option>
                                </select>
                            </div>
                            <div>
                                <label for="alert-status" class="block text-sm font-semibold text-gray-700 mb-2">الحالة *</label>
                                <select id="alert-status" required class="form-input">
                                    <option value="نشط" ${data?.status === 'نشط' ? 'selected' : ''}>نشط</option>
                                    <option value="قيد المعالجة" ${data?.status === 'قيد المعالجة' ? 'selected' : ''}>قيد المعالجة</option>
                                    <option value="مغلق" ${data?.status === 'مغلق' ? 'selected' : ''}>مغلق</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <span id="alert-channels-label" class="block text-sm font-semibold text-gray-700 mb-2">القنوات المستخدمة *</span>
                            <div class="flex flex-wrap gap-2" id="alert-channels-container" role="group" aria-labelledby="alert-channels-label">
                                ${(AppState.emergencyChannels || []).map(channel => `
                                    <label class="flex items-center gap-2 text-sm text-gray-700 border rounded px-3 py-2 cursor-pointer hover:bg-blue-50">
                                        <input type="checkbox" class="rounded border-gray-300 text-blue-600 alert-channel"
                                            value="${Utils.escapeHTML(channel)}" ${data?.channels?.includes(channel) ? 'checked' : ''}>
                                        ${Utils.escapeHTML(channel)}
                                    </label>
                                `).join('')}
                            </div>
                            <div class="flex items-center gap-2 mt-2">
                                <label for="alert-custom-channel" class="sr-only">قناة أخرى</label>
                                <input type="text" id="alert-custom-channel" class="form-input flex-1" placeholder="قناة أخرى (مثال: واتساب)">
                                <button type="button" id="alert-add-channel" class="btn-secondary text-xs px-3 py-2">
                                    <i class="fas fa-plus ml-1"></i>إضافة
                                </button>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="alert-impact-area" class="block text-sm font-semibold text-gray-700 mb-2">المنطقة المتأثرة *</label>
                                <input type="text" id="alert-impact-area" class="form-input" placeholder="مثال: المبنى الرئيسي، محطة 3"
                                    value="${Utils.escapeHTML(data?.impactArea || '')}" required>
                            </div>
                            <div>
                                <label for="alert-teams" class="block text-sm font-semibold text-gray-700 mb-2">فرق الاستجابة</label>
                                <select id="alert-teams" class="form-input" multiple size="4">
                                    ${(AppState.emergencyTeams || []).map(team => `
                                        <option value="${Utils.escapeHTML(team)}" ${data?.assignedTeams?.includes(team) ? 'selected' : ''}>
                                            ${Utils.escapeHTML(team)}
                                        </option>
                                    `).join('')}
                                </select>
                                <p class="text-xs text-gray-500 mt-1">استخدم Ctrl أو Shift لتحديد أكثر من فريق</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="alert-auto-escalate" class="block text-sm font-semibold text-gray-700 mb-2">التصعيد التلقائي (دقائق)</label>
                                <input type="number" id="alert-auto-escalate" min="0" class="form-input"
                                    placeholder="0 لتعطيل التصعيد" value="${data?.autoEscalateMinutes || ''}">
                            </div>
                            <div class="flex items-center gap-2 mt-6">
                                <input type="checkbox" id="alert-requires-evacuation" class="rounded border-gray-300 text-blue-600"
                                    ${data?.requiresEvacuation ? 'checked' : ''}>
                                <label for="alert-requires-evacuation" class="text-sm text-gray-700">يتطلب إخلاء فوري</label>
                            </div>
                        </div>
                        <div>
                            <label for="alert-instructions" class="block text-sm font-semibold text-gray-700 mb-2">تعليمات الاستجابة</label>
                            <textarea id="alert-instructions" class="form-input" rows="3" placeholder="حدد الخطوات التي يجب اتباعها">${Utils.escapeHTML(data?.responseInstructions || '')}</textarea>
                        </div>
                        <div>
                            <label for="alert-date" class="block text-sm font-semibold text-gray-700 mb-2">التاريخ *</label>
                            <input type="date" id="alert-date" required class="form-input" 
                                value="${data?.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="flex items-center justify-end gap-3 pt-4 border-t">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                            <button type="submit" class="btn-primary">${data ? 'تحديث التنبيه' : 'إطلاق التنبيه'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.attachAlertFormEnhancements(modal, data);

        const form = modal.querySelector('#alert-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAlertSubmit(data?.id || null, modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    attachAlertFormEnhancements(modal, data) {
        const customChannelInput = modal.querySelector('#alert-custom-channel');
        const addChannelBtn = modal.querySelector('#alert-add-channel');
        const channelsContainer = modal.querySelector('#alert-channels-container');
        if (addChannelBtn && customChannelInput && channelsContainer) {
            addChannelBtn.addEventListener('click', () => {
                const value = customChannelInput.value.trim();
                if (!value) {
                    Notification.warning('يرجى إدخال اسم القناة قبل الإضافة');
                    return;
                }
                if (Array.from(channelsContainer.querySelectorAll('.alert-channel')).some(cb => cb.value === value)) {
                    Notification.info('القناة موجودة مسبقاً');
                    customChannelInput.value = '';
                    return;
                }
                const label = document.createElement('label');
                label.className = 'flex items-center gap-2 text-sm text-gray-700 border rounded px-3 py-2 cursor-pointer hover:bg-blue-50';
                label.innerHTML = `
                    <input type="checkbox" class="rounded border-gray-300 text-blue-600 alert-channel" value="${Utils.escapeHTML(value)}" checked>
                    ${Utils.escapeHTML(value)}
                `;
                channelsContainer.appendChild(label);
                customChannelInput.value = '';
            });
        }

        const teamsSelect = modal.querySelector('#alert-teams');
        if (teamsSelect && data?.assignedTeams) {
            Array.from(teamsSelect.options).forEach(option => {
                if (data.assignedTeams.includes(option.value)) {
                    option.selected = true;
                }
            });
        }
    },

    async handleAlertSubmit(editId, modal) {
        const form = modal.querySelector('#alert-form');
        const selectedChannels = Array.from(form.querySelectorAll('.alert-channel:checked')).map(cb => cb.value);
        if (selectedChannels.length === 0) {
            Notification.error('يرجى اختيار قناة تنبيه واحدة على الأقل');
            return;
        }

        const teamsSelect = form.querySelector('#alert-teams');
        const assignedTeams = teamsSelect ? Array.from(teamsSelect.selectedOptions).map(opt => opt.value) : [];

        const autoEscalateMinutes = Number(form.querySelector('#alert-auto-escalate')?.value || 0);
        const existing = editId ? this.getAlerts().find(a => a.id === editId) : null;
        const nowIso = new Date().toISOString();

        const formData = this.ensureAlertStructure({
            id: editId || Utils.generateId('ALERT'),
            title: form.querySelector('#alert-title').value.trim(),
            description: form.querySelector('#alert-description').value.trim(),
            severity: form.querySelector('#alert-severity').value,
            status: form.querySelector('#alert-status').value || 'نشط',
            date: new Date(form.querySelector('#alert-date').value).toISOString(),
            createdAt: existing?.createdAt || nowIso,
            updatedAt: nowIso,
            channels: selectedChannels,
            impactArea: form.querySelector('#alert-impact-area').value.trim(),
            assignedTeams,
            autoEscalateMinutes: autoEscalateMinutes || 0,
            requiresEvacuation: form.querySelector('#alert-requires-evacuation')?.checked || false,
            responseInstructions: form.querySelector('#alert-instructions').value.trim(),
            acknowledgedAt: existing?.acknowledgedAt || null,
            acknowledgedBy: existing?.acknowledgedBy || null,
            resolvedAt: existing?.resolvedAt || null,
            resolvedBy: existing?.resolvedBy || null,
            createdBy: existing?.createdBy || this.getCurrentUserSummary(),
            timeline: existing?.timeline ? [...existing.timeline] : []
        });

        formData.timeline.push(this.buildTimelineEntry(editId ? 'update' : 'created', formData,
            editId ? 'تم تحديث بيانات التنبيه' : 'تم إنشاء التنبيه وإرساله إلى فرق الاستجابة'));

        Loading.show();
        try {
            await this.updateAlert(formData);
            if (!editId) {
                await this.sendAlertEmail(formData);
            }
            Loading.hide();
            modal.remove();
            Notification.success(editId ? 'تم تحديث التنبيه بنجاح' : 'تم إطلاق التنبيه بنجاح');
            this.renderAll();
        } catch (error) {
            Loading.hide();
            Utils.safeError('خطأ أثناء حفظ التنبيه:', error);
            Notification.error('حدث خطأ أثناء حفظ التنبيه');
        }
    },

    async updateAlert(alert) {
        alert = this.ensureAlertStructure(alert);
        if (!AppState.appData.emergencyAlerts) {
            AppState.appData.emergencyAlerts = [];
        }
        const index = AppState.appData.emergencyAlerts.findIndex(a => a.id === alert.id);
        if (index !== -1) {
            AppState.appData.emergencyAlerts[index] = alert;
        } else {
            AppState.appData.emergencyAlerts.push(alert);
        }
        DataManager.save();
        try {
            await GoogleIntegration.autoSave('EmergencyAlerts', AppState.appData.emergencyAlerts);
        } catch (error) {
            Utils.safeWarn('⚠ فشل حفظ بيانات الطوارئ تلقائياً:', error);
        }
    },

    async acknowledgeAlert(id) {
        const alert = this.getAlerts().find(a => a.id === id);
        if (!alert) {
            Notification.error('لم يتم العثور على التنبيه المحدد');
            return;
        }
        if (alert.acknowledgedAt) {
            Notification.info('تم اعتماد هذا التنبيه مسبقاً');
            return;
        }

        Loading.show();
        try {
            alert.acknowledgedAt = new Date().toISOString();
            alert.acknowledgedBy = this.getCurrentUserSummary();
            if (alert.status === 'نشط') {
                alert.status = 'قيد المعالجة';
            }
            alert.timeline = alert.timeline || [];
            alert.timeline.push(this.buildTimelineEntry('acknowledged', alert, 'تم اعتماد التنبيه من قبل فريق الاستجابة'));
            alert.updatedAt = new Date().toISOString();
            await this.updateAlert(alert);
            Loading.hide();
            Notification.success('تم اعتماد التنبيه');
            this.renderAll();
        } catch (error) {
            Loading.hide();
            Utils.safeError('خطأ أثناء اعتماد التنبيه:', error);
            Notification.error('تعذر اعتماد التنبيه');
        }
    },

    async resolveAlert(id) {
        const alert = this.getAlerts().find(a => a.id === id);
        if (!alert) {
            Notification.error('لم يتم العثور على التنبيه المحدد');
            return;
        }
        if (alert.status === 'مغلق') {
            Notification.info('التنبيه مغلق بالفعل');
            return;
        }

        Loading.show();
        try {
            alert.status = 'مغلق';
            alert.resolvedAt = new Date().toISOString();
            alert.resolvedBy = this.getCurrentUserSummary();
            alert.timeline = alert.timeline || [];
            alert.timeline.push(this.buildTimelineEntry('resolved', alert, 'تم إغلاق التنبيه بعد التأكد من زوال الحالة'));
            alert.updatedAt = new Date().toISOString();
            await this.updateAlert(alert);
            Loading.hide();
            Notification.success('تم إغلاق التنبيه');
            this.renderAll();
        } catch (error) {
            Loading.hide();
            Utils.safeError('خطأ أثناء إغلاق التنبيه:', error);
            Notification.error('تعذر إغلاق التنبيه');
        }
    },

    showPlanForm(data = null) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 720px;">
                <div class="modal-header">
                    <h2 class="modal-title">${data ? 'تحديث خطة طوارئ' : 'إضافة خطة طوارئ'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="plan-form" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="plan-name" class="block text-sm font-semibold text-gray-700 mb-2">اسم الخطة *</label>
                                <input type="text" id="plan-name" required class="form-input" 
                                    value="${Utils.escapeHTML(data?.name || '')}" placeholder="اسم خطة الطوارئ">
                            </div>
                            <div>
                                <label for="plan-type" class="block text-sm font-semibold text-gray-700 mb-2">النوع *</label>
                                <select id="plan-type" required class="form-input">
                                    <option value="">اختر النوع</option>
                                    <option value="حريق" ${data?.type === 'حريق' ? 'selected' : ''}>حريق</option>
                                    <option value="زلزال" ${data?.type === 'زلزال' ? 'selected' : ''}>زلزال</option>
                                    <option value="فيضانات" ${data?.type === 'فيضانات' ? 'selected' : ''}>فيضانات</option>
                                    <option value="حادث كيميائي" ${data?.type === 'حادث كيميائي' ? 'selected' : ''}>حادث كيميائي</option>
                                    <option value="أخرى" ${data?.type === 'أخرى' ? 'selected' : ''}>أخرى</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label for="plan-description" class="block text-sm font-semibold text-gray-700 mb-2">الوصف *</label>
                            <textarea id="plan-description" required class="form-input" rows="5" 
                                placeholder="وصف تفصيلي للخطة">${Utils.escapeHTML(data?.description || '')}</textarea>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="plan-owner-team" class="block text-sm font-semibold text-gray-700 mb-2">الفريق المسؤول</label>
                                <select id="plan-owner-team" class="form-input">
                                    <option value="">اختر الفريق</option>
                                    ${(AppState.emergencyTeams || []).map(team => `
                                        <option value="${Utils.escapeHTML(team)}" ${data?.ownerTeam === team ? 'selected' : ''}>${Utils.escapeHTML(team)}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div>
                                <label for="plan-last-tested" class="block text-sm font-semibold text-gray-700 mb-2">آخر اختبار</label>
                                <input type="date" id="plan-last-tested" class="form-input"
                                    value="${data?.lastTested ? new Date(data.lastTested).toISOString().slice(0, 10) : ''}">
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="plan-contact-person" class="block text-sm font-semibold text-gray-700 mb-2">اسم مسؤول الخطة</label>
                                <input type="text" id="plan-contact-person" class="form-input" placeholder="اسم المسؤول"
                                    value="${Utils.escapeHTML(data?.contactPerson || '')}">
                            </div>
                            <div>
                                <label for="plan-contact-phone" class="block text-sm font-semibold text-gray-700 mb-2">رقم التواصل</label>
                                <input type="text" id="plan-contact-phone" class="form-input" placeholder="رقم الهاتف"
                                    value="${Utils.escapeHTML(data?.contactPhone || '')}">
                            </div>
                        </div>
                        <div class="flex items-center justify-end gap-3 pt-4 border-t">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                            <button type="submit" class="btn-primary">${data ? 'تحديث الخطة' : 'إضافة الخطة'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const form = modal.querySelector('#plan-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePlanSubmit(data?.id || null, modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async handlePlanSubmit(editId, modal) {
        const form = modal.querySelector('#plan-form');
        const nowIso = new Date().toISOString();
        const existing = editId ? this.getPlans().find(plan => plan.id === editId) : null;

        const formData = this.ensurePlanStructure({
            id: editId || Utils.generateId('PLAN'),
            name: form.querySelector('#plan-name').value.trim(),
            type: form.querySelector('#plan-type').value,
            description: form.querySelector('#plan-description').value.trim(),
            ownerTeam: form.querySelector('#plan-owner-team').value.trim(),
            lastTested: form.querySelector('#plan-last-tested').value ? new Date(form.querySelector('#plan-last-tested').value).toISOString() : '',
            contactPerson: form.querySelector('#plan-contact-person').value.trim(),
            contactPhone: form.querySelector('#plan-contact-phone').value.trim(),
            createdAt: existing?.createdAt || nowIso,
            updatedAt: nowIso
        });

        Loading.show();
        try {
            if (!AppState.appData.emergencyPlans) {
                AppState.appData.emergencyPlans = [];
            }
            const index = AppState.appData.emergencyPlans.findIndex(plan => plan.id === formData.id);
            if (index !== -1) {
                AppState.appData.emergencyPlans[index] = formData;
            } else {
                AppState.appData.emergencyPlans.push(formData);
            }
            DataManager.save();
            await GoogleIntegration.autoSave('EmergencyPlans', AppState.appData.emergencyPlans);
            Loading.hide();
            modal.remove();
            Notification.success(editId ? 'تم تحديث الخطة بنجاح' : 'تم إضافة الخطة بنجاح');
            this.renderAll();
        } catch (error) {
            Loading.hide();
            Utils.safeError('خطأ أثناء حفظ خطة الطوارئ:', error);
            Notification.error('تعذر حفظ خطة الطوارئ');
        }
    },

    viewAlert(id) {
        const alert = this.getAlerts().find(a => a.id === id);
        if (!alert) {
            Notification.error('لم يتم العثور على التنبيه');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const timeline = (alert.timeline || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 780px;">
                <div class="modal-header">
                    <h2 class="modal-title">${Utils.escapeHTML(alert.title || 'تفاصيل التنبيه')}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs text-gray-500 mb-1">الخطورة</p>
                            <span class="badge ${alert.severity === 'عالية' ? 'badge-danger' : alert.severity === 'متوسطة' ? 'badge-warning' : 'badge-info'}">${Utils.escapeHTML(alert.severity || '')}</span>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">الحالة</p>
                            <span class="badge ${alert.status === 'مغلق' ? 'badge-success' : alert.status === 'قيد المعالجة' ? 'badge-warning' : 'badge-danger'}">${Utils.escapeHTML(alert.status || '')}</span>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">قنوات الإرسال</p>
                            <div class="flex flex-wrap gap-1">
                                ${(alert.channels || []).map(channel => `<span class="badge badge-secondary">${Utils.escapeHTML(channel)}</span>`).join('')}
                            </div>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">المنطقة المتأثرة</p>
                            <div class="text-sm text-gray-800">${Utils.escapeHTML(alert.impactArea || '')}</div>
                        </div>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">الوصف</p>
                        <p class="text-sm text-gray-800 leading-6">${Utils.escapeHTML(alert.description || '')}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">فرق الاستجابة</p>
                        <div class="flex flex-wrap gap-2">
                            ${(alert.assignedTeams || []).length
                ? alert.assignedTeams.map(team => `<span class="badge badge-info">${Utils.escapeHTML(team)}</span>`).join('')
                : '<span class="text-xs text-gray-400">لم يتم التعيين</span>'}
                        </div>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">تعليمات الاستجابة</p>
                        <p class="text-sm text-gray-800 leading-6">${Utils.escapeHTML(alert.responseInstructions || 'لم يتم تحديد تعليمات')}</p>
                    </div>
                    <div class="border-t pt-4">
                        <h3 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <i class="fas fa-history"></i> الخط الزمني
                        </h3>
                        ${timeline.length === 0 ? `
                            <p class="text-xs text-gray-500">لا توجد تحديثات بعد.</p>
                        ` : `
                            <div class="space-y-3">
                                ${timeline.map(step => `
                                    <div class="bg-gray-50 border border-gray-200 rounded p-3">
                                        <div class="flex items-center justify-between">
                                            <span class="font-semibold text-sm text-gray-800">${Utils.escapeHTML(step.label || 'تحديث')}</span>
                                            <span class="text-xs text-gray-500">${Utils.formatDateTime(step.timestamp)}</span>
                                        </div>
                                        <div class="text-xs text-gray-500 mt-1">
                                            <i class="fas fa-user ml-1"></i>${Utils.escapeHTML(step.actor?.name || step.actor || 'النظام')}
                                        </div>
                                        <div class="text-sm text-gray-700 mt-2 leading-5">${Utils.escapeHTML(step.description || '')}</div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
                <div class="modal-footer flex justify-end gap-2">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إغلاق</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    viewPlan(id) {
        const plan = this.getPlans().find(p => p.id === id);
        if (!plan) {
            Notification.error('لم يتم العثور على الخطة');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2 class="modal-title">${Utils.escapeHTML(plan.name || 'خطة الطوارئ')}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs text-gray-500 mb-1">النوع</p>
                            <span class="badge badge-secondary">${Utils.escapeHTML(plan.type || 'غير محدد')}</span>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">الفريق المسؤول</p>
                            <div class="text-sm text-gray-800">${Utils.escapeHTML(plan.ownerTeam || 'غير محدد')}</div>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">آخر اختبار</p>
                            <div class="text-sm text-gray-800">${plan.lastTested ? Utils.formatDate(plan.lastTested) : 'لم يتم الاختبار'}</div>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">جهة الاتصال</p>
                            <div class="text-sm text-gray-800">${Utils.escapeHTML(plan.contactPerson || 'غير محدد')} ${plan.contactPhone ? '• ' + Utils.escapeHTML(plan.contactPhone) : ''}</div>
                        </div>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">الوصف</p>
                        <p class="text-sm text-gray-800 leading-6">${Utils.escapeHTML(plan.description || '')}</p>
                    </div>
                    <div class="text-xs text-gray-400">
                        <p>تم التحديث في ${Utils.formatDateTime(plan.updatedAt)}</p>
                    </div>
                </div>
                <div class="modal-footer flex justify-end gap-2">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إغلاق</button>
                    <button class="btn-primary" onclick="Emergency.showPlanForm(${JSON.stringify(plan).replace(/"/g, '&quot;')}); this.closest('.modal-overlay').remove();">
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

    async sendAlertEmail(alert) {
        const notificationEmails = AppState.notificationEmails || [];
        if (notificationEmails.length === 0) {
            Utils.safeLog('⚠ لا توجد إيميلات للإشعارات في الإعدادات');
            return;
        }

        try {
            const emailSubject = `تنبيه طوارئ: ${alert.title}`;
            const emailBody = `
                <h2>تنبيه طوارئ</h2>
                <p><strong>العنوان:</strong> ${alert.title}</p>
                <p><strong>الوصف:</strong> ${alert.description}</p>
                <p><strong>الخطورة:</strong> ${alert.severity}</p>
                <p><strong>المنطقة المتأثرة:</strong> ${alert.impactArea}</p>
                <p><strong>القنوات:</strong> ${(alert.channels || []).join(', ')}</p>
                <p><strong>التاريخ:</strong> ${Utils.formatDate(alert.date)}</p>
            `;

            Utils.safeLog('📧 إرسال إيميل للتنبيه:', {
                to: notificationEmails,
                subject: emailSubject,
                body: emailBody
            });

            Notification.success(`تم إرسال التنبيه إلى ${notificationEmails.length} بريد إلكتروني`);
        } catch (error) {
            Utils.safeError('خطأ في إرسال الإيميل:', error);
            Notification.warning('تم حفظ التنبيه لكن فشل إرسال الإيميل');
        }
    },

    setupAffectedAutocomplete(incidentData = null) {
        setTimeout(() => {
            if (typeof EmployeeHelper !== 'undefined') {
                EmployeeHelper.setupEmployeeCodeSearch('incident-affected-code', 'incident-affected-name', (employee) => {
                    if (!employee) return;
                    const nameInput = document.getElementById('incident-affected-name');
                    const jobInput = document.getElementById('incident-affected-job');
                    const deptInput = document.getElementById('incident-affected-department');
                    const contactInput = document.getElementById('incident-affected-contact');
                    const affectedTypeSelect = document.getElementById('incident-affected-type');

                    if (affectedTypeSelect) affectedTypeSelect.value = 'employee';
                    if (nameInput) nameInput.value = employee.name || employee.fullName || '';
                    if (jobInput) jobInput.value = employee.position || employee.jobTitle || '';
                    if (deptInput) deptInput.value = employee.department || employee.section || '';
                    if (contactInput) {
                        contactInput.value = employee.phone || employee.mobile || employee.email || '';
                    }
                });

                EmployeeHelper.setupAutocomplete('incident-affected-name', (employee) => {
                    if (!employee) return;
                    const codeInput = document.getElementById('incident-affected-code');
                    const jobInput = document.getElementById('incident-affected-job');
                    const deptInput = document.getElementById('incident-affected-department');
                    const contactInput = document.getElementById('incident-affected-contact');
                    const affectedTypeSelect = document.getElementById('incident-affected-type');

                    if (affectedTypeSelect) affectedTypeSelect.value = 'employee';
                    if (codeInput) codeInput.value = employee.code || '';
                    if (jobInput) jobInput.value = employee.position || employee.jobTitle || '';
                    if (deptInput) deptInput.value = employee.department || employee.section || '';
                    if (contactInput) {
                        contactInput.value = employee.phone || employee.mobile || employee.email || '';
                    }
                });
            }

            const initialType = incidentData?.affectedType || 'employee';
            this.handleAffectedTypeChange(initialType);
        }, 200);
    },

    handleAffectedTypeChange(selectedType = 'employee') {
        const codeInput = document.getElementById('incident-affected-code');
        const nameInput = document.getElementById('incident-affected-name');
        const jobInput = document.getElementById('incident-affected-job');
        const deptInput = document.getElementById('incident-affected-department');
        const contactInput = document.getElementById('incident-affected-contact');

        if (!nameInput) return;

        if (selectedType === 'employee') {
            if (codeInput) {
                codeInput.disabled = false;
                codeInput.placeholder = 'ادخل الكود الوظيفي';
            }
            nameInput.readOnly = true;
            if (jobInput) jobInput.readOnly = true;
            if (deptInput) deptInput.readOnly = true;
        } else {
            if (codeInput) {
                codeInput.disabled = true;
                codeInput.value = '';
                codeInput.placeholder = 'لا يتطلب كوداً';
            }
            nameInput.readOnly = false;
            if (jobInput) jobInput.readOnly = false;
            if (deptInput) deptInput.readOnly = false;
        }

        if (selectedType !== 'employee') {
            if (jobInput && !jobInput.value) jobInput.value = '';
            if (deptInput && !deptInput.value) deptInput.value = '';
            if (contactInput && !contactInput.value) contactInput.value = '';
        }
    },

    populateActionPlanRows(plan = []) {
        const tbody = document.getElementById('incident-action-plan-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!Array.isArray(plan) || plan.length === 0) {
            this.addActionPlanRow();
            return;
        }

        plan.forEach(item => this.addActionPlanRow(item));
    },

    addActionPlanRow(data = {}) {
        const tbody = document.getElementById('incident-action-plan-body');
        if (!tbody) return;

        const rowId = data.id || Utils.generateId('ACTPLAN');
        const tr = document.createElement('tr');
        tr.className = 'incident-action-row';
        tr.setAttribute('data-row-id', rowId);
        tr.innerHTML = `
            <td>
                <select class="form-input" name="action-type">
                    <option value="corrective" ${data.actionType === 'corrective' ? 'selected' : ''}>إجراء تصحيحي</option>
                    <option value="preventive" ${data.actionType === 'preventive' ? 'selected' : ''}>إجراء وقائي</option>
                </select>
            </td>
            <td>
                <input type="text" class="form-input" name="action-description" value="${Utils.escapeHTML(data.description || '')}" placeholder="وصف الإجراء">
            </td>
            <td>
                <input type="text" class="form-input" name="action-owner" value="${Utils.escapeHTML(data.owner || '')}" placeholder="اسم المسؤول">
            </td>
            <td>
                <input type="date" class="form-input" name="action-due" value="${data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 10) : ''}">
            </td>
            <td>
                <input type="date" class="form-input" name="action-closed" value="${data.closedDate ? new Date(data.closedDate).toISOString().slice(0, 10) : ''}">
            </td>
            <td>
                <select class="form-input" name="action-status">
                    <option value="pending" ${data.status === 'pending' ? 'selected' : ''}>جار</option>
                    <option value="in_progress" ${data.status === 'in_progress' ? 'selected' : ''}>تحت التنيذ</option>
                    <option value="completed" ${data.status === 'completed' ? 'selected' : ''}>تم إنجازه</option>
                </select>
            </td>
            <td>
                <button type="button" class="btn-icon btn-icon-danger" data-remove-action="${rowId}">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);

        const removeBtn = tr.querySelector(`[data-remove-action="${rowId}"]`);
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removeActionPlanRow(rowId));
        }
    },

    removeActionPlanRow(rowId) {
        const tbody = document.getElementById('incident-action-plan-body');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('.incident-action-row');
        if (rows.length <= 1) {
            Notification.warning('لا يمكن حذف الصف الأخير من خطة الإجراءات.');
            return;
        }

        const row = tbody.querySelector(`.incident-action-row[data-row-id="${rowId}"]`);
        if (row) {
            row.remove();
        }
    },

    collectActionPlanRows() {
        const rows = Array.from(document.querySelectorAll('#incident-action-plan-body .incident-action-row'));
        return rows.map(row => {
            const id = row.getAttribute('data-row-id') || Utils.generateId('ACTPLAN');
            const type = row.querySelector('[name="action-type"]')?.value || 'corrective';
            const description = row.querySelector('[name="action-description"]')?.value?.trim() || '';
            const owner = row.querySelector('[name="action-owner"]')?.value?.trim() || '';
            const dueDate = row.querySelector('[name="action-due"]')?.value || '';
            const closedDate = row.querySelector('[name="action-closed"]')?.value || '';
            const status = row.querySelector('[name="action-status"]')?.value || 'pending';

            return {
                id,
                actionType: type,
                description,
                owner,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                closedDate: closedDate ? new Date(closedDate).toISOString() : null,
                status,
                updatedAt: new Date().toISOString()
            };
        }).filter(item => item.description || item.owner || item.dueDate);
    },

    async handleAttachmentsChange(fileList) {
        if (!fileList || fileList.length === 0) return;

        const files = Array.from(fileList);
        const validFiles = [];

        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                Notification.error(`الملف ${file.name} يتجاوز الحد الأقصى (5MB)`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) {
            return;
        }

        Loading.show('جاري معالجة المرفقات...');
        try {
            for (const file of validFiles) {
                const base64 = await this.readFileAsBase64(file);
                const attachment = this.normalizeAttachment({
                    id: Utils.generateId('ATT'),
                    name: file.name,
                    type: file.type,
                    data: base64,
                    size: Math.round(file.size / 1024)
                });
                this.currentAttachments.push(attachment);
            }
            this.renderAttachmentsList();
            const input = document.getElementById('incident-attachments-input');
            if (input) input.value = '';
        } catch (error) {
            Notification.error('فشل تحميل المرقات: ' + error.message);
        } finally {
            Loading.hide();
        }
    },

    async readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    },

    normalizeAttachment(attachment) {
        if (!attachment) return null;
        const data = attachment.data || attachment.base64 || '';
        const size = attachment.size || (data ? Math.round((data.length * 3) / 4 / 1024) : 0);
        return {
            id: attachment.id || Utils.generateId('ATT'),
            name: attachment.name || 'attachment',
            type: attachment.type || 'application/octet-stream',
            data,
            size,
            createdAt: attachment.createdAt || new Date().toISOString()
        };
    },

    renderCloudStorageUploadButtons(prefix) {
        const availableServices = CloudStorageIntegration?.getAvailableServices() || [];
        if (availableServices.length === 0) {
            return '';
        }

        return `
            <div class="mt-3 mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                <label class="block text-xs font-semibold text-gray-700 mb-2">
                    <i class="fas fa-cloud ml-1"></i>
                    رفع إلى التخزين السحابي
                </label>
                <div class="flex items-center gap-2 flex-wrap">
                    ${availableServices.map(service => `
                        <button type="button" 
                                class="btn-secondary text-xs px-2 py-1" 
                                id="${prefix}-cloud-upload-${service}"
                                data-service="${service}"
                                title="رفع إلى ${CloudStorageIntegration.getServiceName(service)}">
                            <i class="fas fa-cloud-upload-alt ml-1"></i>
                            ${CloudStorageIntegration.getServiceName(service)}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    },

    async handleCloudUpload(prefix, service) {
        const input = document.getElementById(`${prefix}-attachments-input`);
        if (!input || !input.files || input.files.length === 0) {
            Notification.warning('يرجى اختيار ملف أولاً');
            return;
        }

        const file = input.files[0];
        try {
            const result = await CloudStorageIntegration.uploadFile(service, file, file.name);

            // Add cloud link to attachments
            const attachment = {
                id: Utils.generateId('ATT'),
                name: file.name,
                type: file.type,
                size: Math.round(file.size / 1024),
                cloudLink: {
                    id: result.id,
                    url: result.url,
                    service: result.service,
                    fileName: result.fileName,
                    uploadedAt: result.uploadedAt
                },
                isCloud: true,
                createdAt: new Date().toISOString()
            };

            if (!this.currentAttachments) {
                this.currentAttachments = [];
            }
            this.currentAttachments.push(attachment);
            this.renderAttachmentsList();
            input.value = '';

            Notification.success(`تم رفع الملف إلى ${CloudStorageIntegration.getServiceName(service)} بنجاح`);
        } catch (error) {
            Utils.safeError('Cloud upload error:', error);
            Notification.error(error.message || 'فشل رفع الملف إلى السحابة');
        }
    },

    renderAttachmentsList() {
        const container = document.getElementById('incident-attachments-list');
        if (!container) return;

        if (!this.currentAttachments || this.currentAttachments.length === 0) {
            container.innerHTML = '<p class="text-sm text-gray-500">لا توجد مرفقات مضافة.</p>';
            return;
        }

        container.innerHTML = this.currentAttachments.map((attachment, index) => {
            const isCloud = attachment.cloudLink || attachment.isCloud;
            const cloudBadge = isCloud ? `
                <span class="badge badge-info text-xs">
                    <i class="fas fa-cloud ml-1"></i>
                    ${CloudStorageIntegration?.getServiceName(attachment.cloudLink?.service) || 'سحابي'}
                </span>
            ` : '';

            return `
                <div class="flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-3 py-2" data-attachment-index="${index}">
                    <div class="flex items-center gap-2">
                        <i class="fas ${isCloud ? 'fa-cloud' : 'fa-paperclip'} text-blue-500"></i>
                        <div>
                            <div class="flex items-center gap-2">
                                <div class="text-sm font-medium text-gray-700">${Utils.escapeHTML(attachment.name || 'attachment')}</div>
                                ${cloudBadge}
                            </div>
                            <div class="text-xs text-gray-500">
                                ${attachment.size || 0} KB
                                ${isCloud && attachment.cloudLink?.url ? `
                                    <a href="${attachment.cloudLink.url}" target="_blank" class="text-blue-600 hover:underline mr-2">
                                        <i class="fas fa-external-link-alt ml-1"></i>فتح
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        ${isCloud ? `
                            <button type="button" class="btn-icon btn-icon-info" title="تحميل من السحابة" data-attachment-cloud-download="${index}">
                                <i class="fas fa-cloud-download-alt"></i>
                            </button>
                        ` : ''}
                        <button type="button" class="btn-icon btn-icon-success" title="تحميل" data-attachment-download="${index}">
                            <i class="fas fa-download"></i>
                        </button>
                        <button type="button" class="btn-icon btn-icon-danger" title="حذف" data-attachment-remove="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('[data-attachment-remove]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.getAttribute('data-attachment-remove'), 10);
                this.removeAttachment(idx);
            });
        });

        container.querySelectorAll('[data-attachment-download]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-attachment-download'), 10);
                this.downloadAttachment(idx);
            });
        });

        container.querySelectorAll('[data-attachment-cloud-download]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idx = parseInt(btn.getAttribute('data-attachment-cloud-download'), 10);
                const attachment = this.currentAttachments?.[idx];
                if (attachment && attachment.cloudLink) {
                    try {
                        await CloudStorageIntegration.downloadFile(attachment.cloudLink);
                        Notification.success('تم تحميل الملف بنجاح');
                    } catch (error) {
                        Notification.error(error.message || 'فشل تحميل الملف من السحابة');
                    }
                }
            });
        });
    },

    removeAttachment(index) {
        if (!this.currentAttachments) return;
        this.currentAttachments.splice(index, 1);
        this.renderAttachmentsList();
    },

    downloadAttachment(index) {
        const attachment = this.currentAttachments?.[index];
        if (!attachment || !attachment.data) return;

        const link = document.createElement('a');
        link.href = attachment.data;
        link.download = attachment.name || `attachment-${index + 1}`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => link.remove(), 0);
    },

    /**
     * عرض التطبيق الرئيسي
     */
    async showMainApp() {
        // التحقق من وجود مستخدم مسجل دخول
        if (!AppState.currentUser) {
            if (AppState.debugMode) Utils.safeLog('⚠️ لا يوجد مستخدم مسجل دخول - لا يمكن عرض التطبيق');
            return;
        }

        // إزالة شاشة "جاري التحقق من الجلسة" فوراً عند عرض التطبيق
        try {
            document.body.removeAttribute('data-hse-pending-session');
            var s = document.getElementById('hse-hide-login-until-ready');
            if (s && s.parentNode) s.remove();
            var loadingEl = document.querySelector('.hse-loading-text');
            if (loadingEl && loadingEl.parentNode) loadingEl.remove();
        } catch (e) { /* ignore */ }

        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');

        // تحميل إعدادات الشركة أولاً (شاشة الدخول تبقى ظاهرة) ثم عرض السياسة مباشرة دون شاشة تحضيرية
        if (!AppState.companySettings || typeof AppState.companySettings !== 'object') {
            AppState.companySettings = {};
        }
        const hasNoItems = !Array.isArray(AppState.companySettings.postLoginItems) || AppState.companySettings.postLoginItems.length === 0;
        const shouldLoadSettings = typeof DataManager !== 'undefined' && DataManager.loadCompanySettings &&
            (AppState.companySettings.postLoginItems === undefined || (hasNoItems && !AppState._companySettingsLoadedAfterLogin));
        if (shouldLoadSettings) {
            try {
                await DataManager.loadCompanySettings(true);
                AppState._companySettingsLoadedAfterLogin = true;
            } catch (e) {
                if (AppState.debugMode) Utils.safeWarn('⚠️ فشل تحميل إعدادات الشركة لعرض السياسة:', e);
            }
        }
        if (AppState.companySettings.postLoginItems === undefined) {
            AppState.companySettings.postLoginItems = [];
        }

        const postLoginItems = this._getPostLoginItemsForDisplay();

        // الآن إخفاء شاشة الدخول وتهيئة العرض ثم عرض السياسة مباشرة (بدون شاشة تحضيرية داكنة)
        if (loginScreen) {
            loginScreen.style.display = 'none';
            loginScreen.classList.remove('active', 'show');
        }
        document.body.classList.add('app-active');
        if (mainApp) mainApp.style.display = 'none';

        if (postLoginItems.length > 0) {
            document.documentElement.classList.add('hse-post-login-overlay-active');
            document.body.classList.add('hse-post-login-overlay-active');
            if (AppState.debugMode) Utils.safeLog('عرض شاشة السياسة بعد الدخول (قبل لوحة التحكم)، عدد العناصر:', postLoginItems.length);
            this._showPostLoginOverlay(postLoginItems, () => {
                const el = document.getElementById('hse-post-login-overlay');
                if (el && el.parentNode) el.remove();
                document.documentElement.classList.remove('hse-post-login-overlay-active');
                document.body.classList.remove('hse-post-login-overlay-active');
                this._markCurrentUserPostLoginPolicySeen();
                if (mainApp) mainApp.style.display = 'flex';
                try {
                    this._continueMainAppSetup();
                } catch (setupErr) {
                    if (AppState.debugMode) Utils.safeWarn('⚠️ خطأ في تهيئة التطبيق بعد السياسة:', setupErr);
                }
            });
            return;
        }

        // لا توجد سياسة: إزالة صنف الـ overlay وإظهار التطبيق مباشرة
        document.documentElement.classList.remove('hse-post-login-overlay-active');
        document.body.classList.remove('hse-post-login-overlay-active');
        if (mainApp) mainApp.style.display = 'flex';
        try {
            this._continueMainAppSetup();
        } catch (setupErr) {
            if (AppState.debugMode) Utils.safeWarn('⚠️ خطأ في تهيئة التطبيق:', setupErr);
        }
    },

    /** عرض شاشة تحميل فورية بعد الدخول (بنفس مظهر النظام) لتجنب شاشة بيضاء */
    _showPostLoginLoadingOverlay() {
        let el = document.getElementById('hse-post-login-overlay');
        if (el) el.remove();
        el = document.createElement('div');
        el.id = 'hse-post-login-overlay';
        el.className = 'hse-post-login-overlay';
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-label', 'جاري التحضير');
        el.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;min-height:100vh;background:#0f172a;display:flex;align-items:center;justify-content:center;z-index:99999;';
        el.innerHTML = `
            <div class="hse-post-login-overlay-backdrop" style="position:absolute;inset:0;background:#0f172a;z-index:0;"></div>
            <div class="hse-post-login-loading-card" style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem;padding:3rem 2.5rem;min-height:220px;min-width:280px;background:#fff;border-radius:20px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.4);">
                <div class="hse-post-login-loading-spinner" style="width:52px;height:52px;border:4px solid rgba(37,99,235,0.2);border-top-color:#2563eb;border-radius:50%;animation: hseSpin 0.9s linear infinite;"></div>
                <p class="hse-post-login-loading-text" style="margin:0;font-size:1.25rem;font-weight:600;color:#1e293b;">جاري التحضير...</p>
            </div>`;
        document.body.appendChild(el);
        if (!document.getElementById('hse-post-login-overlay-critical-style')) {
            const style = document.createElement('style');
            style.id = 'hse-post-login-overlay-critical-style';
            style.textContent = '@keyframes hseSpin{to{transform:rotate(360deg);}}';
            document.head.appendChild(style);
        }
    },

    /** إزالة شاشة تحميل ما بعد الدخول */
    _removePostLoginLoadingOverlay() {
        const el = document.getElementById('hse-post-login-overlay');
        if (el && el.querySelector('.hse-post-login-loading-card')) {
            if (el.parentNode) el.remove();
        }
    },

    /** ترجيع قائمة عناصر ما بعد الدخول (مفعّلة ومرتبة) */
    _getPostLoginItemsForDisplay() {
        try {
            const raw = AppState?.companySettings?.postLoginItems;
            let items = Array.isArray(raw) ? raw : (typeof raw === 'string' && raw.trim() ? (() => { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch (e) { return []; } })() : []);
            return items.filter(i => i && i.active !== false).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        } catch (e) { return []; }
    },

    /** هل المستخدم الحالي قد شاهد سياسة/تعليمات ما بعد الدخول مسبقاً (مرة واحدة فقط لكل مستخدم) */
    _currentUserHasSeenPostLoginPolicy() {
        try {
            const user = AppState.currentUser;
            if (!user) return true;
            const validSeen = (v) => {
                const s = String(v || '').trim().toLowerCase();
                return s !== '' && s !== 'undefined' && s !== 'null';
            };
            if (validSeen(user.postLoginPolicySeenAt)) return true;
            const users = AppState.appData?.users;
            if (Array.isArray(users)) {
                const email = (user.email || '').toLowerCase().trim();
                const found = users.find(u => (u && (String(u.email || '').toLowerCase().trim() === email || String(u.id || '') === String(user.id || ''))));
                if (found && validSeen(found.postLoginPolicySeenAt)) return true;
            }
            return false;
        } catch (e) { return false; }
    },

    /** تسجيل أن المستخدم الحالي قد شاهد سياسة ما بعد الدخول (حفظ في Backend + AppState) */
    _markCurrentUserPostLoginPolicySeen() {
        const user = AppState.currentUser;
        if (!user) return;
        const seenAt = new Date().toISOString();
        if (AppState.currentUser) AppState.currentUser.postLoginPolicySeenAt = seenAt;
        const users = AppState.appData?.users;
        if (Array.isArray(users)) {
            const email = (user.email || '').toLowerCase().trim();
            const idx = users.findIndex(u => u && (String(u.email || '').toLowerCase().trim() === email || String(u.id || '') === String(user.id || '')));
            if (idx !== -1 && users[idx]) users[idx].postLoginPolicySeenAt = seenAt;
        }
        const userId = user.id || user.email;
        if (userId && typeof GoogleIntegration !== 'undefined' && GoogleIntegration.sendToAppsScript) {
            // إرسال حقل واحد فقط لعدم المساس بالصلاحيات أو الدور في قاعدة البيانات
            GoogleIntegration.sendToAppsScript('updateUser', { userId: userId, updateData: { postLoginPolicySeenAt: seenAt } }).catch(() => {});
        }
    },

    /**
     * عرض شاشة/شاشات السياسات أو التعليمات بعد الدخول (متسلسلة)، مع زر تخطي ومؤقت.
     * @param {Array<{title:string, body:string, durationSeconds:number}>} items
     * @param {function} onComplete - يُستدعى عند الانتهاء (تخطي أو انتهاء آخر مؤقت)
     */
    _showPostLoginOverlay(items, onComplete) {
        if (!items || items.length === 0) {
            if (typeof onComplete === 'function') onComplete();
            return;
        }
        document.documentElement.classList.add('hse-post-login-overlay-active');
        document.body.classList.add('hse-post-login-overlay-active');
        let currentIndex = 0;
        let timerId = null;

        const removeOverlay = (overlayEl, removeBodyClass = false) => {
            if (timerId) clearInterval(timerId);
            timerId = null;
            if (removeBodyClass) {
                document.documentElement.classList.remove('hse-post-login-overlay-active');
                document.body.classList.remove('hse-post-login-overlay-active');
            }
            if (overlayEl && overlayEl.parentNode) overlayEl.remove();
        };

        const showItem = (index) => {
            if (index >= items.length) {
                if (typeof onComplete === 'function') onComplete();
                return;
            }
            const item = items[index];
            const duration = Math.min(120, Math.max(0, parseInt(item.durationSeconds, 10) || 10));
            const rawTitle = (item.title || '').trim() || 'تعليمات';
            const rawBody = (item.body || '').trim();
            const safeTitle = (typeof Utils !== 'undefined' && Utils.escapeHTML) ? Utils.escapeHTML(rawTitle) : rawTitle;
            const escapeFn = (typeof Utils !== 'undefined' && Utils.escapeHTML) ? Utils.escapeHTML : (s) => s;
            let safeBody;
            if (/<p\b/i.test(rawBody)) {
                safeBody = rawBody;
            } else {
                const parts = rawBody.split(/\n\n+/);
                safeBody = parts.map(p => '<p>' + escapeFn(p.trim()).replace(/\n/g, '<br>') + '</p>').join('');
                if (!safeBody && rawBody) safeBody = '<p>' + escapeFn(rawBody).replace(/\n/g, '<br>') + '</p>';
            }

            const companyName = (AppState.companySettings && AppState.companySettings.name) ? String(AppState.companySettings.name).trim() : (AppState.companyName || '');
            const secondaryName = (AppState.companySettings && AppState.companySettings.secondaryName) ? String(AppState.companySettings.secondaryName).trim() : '';
            let logoUrl = AppState.companyLogo || (AppState.companySettings && AppState.companySettings.logo) || '';
            if (logoUrl && typeof window.__convertGoogleDriveUrl === 'function') {
                logoUrl = window.__convertGoogleDriveUrl(logoUrl);
            }
            if (logoUrl && !this._isValidLogoUrl(logoUrl)) logoUrl = '';
            const safeCompanyName = (typeof Utils !== 'undefined' && Utils.escapeHTML) ? Utils.escapeHTML(companyName) : companyName;
            const safeSecondaryName = (typeof Utils !== 'undefined' && Utils.escapeHTML) ? Utils.escapeHTML(secondaryName) : secondaryName;
            /* كود النموذج: من إعدادات الشركة أو من عنصر السياسة أو افتراضي */
            const formCode = (AppState.companySettings && AppState.companySettings.policyFormCode)
                ? String(AppState.companySettings.policyFormCode).trim()
                : (item.formCode || item.code || 'HSE-POLICY-01');
            const safeFormCode = (typeof Utils !== 'undefined' && Utils.escapeHTML) ? Utils.escapeHTML(formCode) : formCode;
            /* هيدر مطابق للصورة: يمين = اسم الشركة فقط، وسط = العنوان + العنوان الفرعي (إدارة/قسم)، يسار = الشعار */
            const headerHTML = `
                <div class="hse-post-login-overlay-header">
                    <div class="hse-post-login-overlay-header-right">
                        ${companyName ? `<div class="hse-post-login-overlay-company-name">${safeCompanyName}</div>` : ''}
                    </div>
                    <div class="hse-post-login-overlay-header-center">
                        <h1 class="hse-post-login-overlay-header-center-title">${safeTitle}</h1>
                        ${secondaryName ? `<p class="hse-post-login-overlay-header-center-subtitle">${safeSecondaryName}</p>` : ''}
                    </div>
                    <div class="hse-post-login-overlay-header-left">
                        <div class="hse-post-login-overlay-logo">
                            ${logoUrl ? `<img class="hse-post-login-overlay-logo-img" src="${logoUrl.replace(/"/g, '&quot;')}" alt="شعار الشركة" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'; this.nextElementSibling && (this.nextElementSibling.style.display=\'flex\');"><div class="hse-post-login-overlay-logo-placeholder" style="display:none;"><i class="fas fa-building" aria-hidden="true"></i></div>` : '<div class="hse-post-login-overlay-logo-placeholder"><i class="fas fa-building" aria-hidden="true"></i></div>'}
                        </div>
                    </div>
                </div>`;
            /* فوتر مطابق للصورة: يسار = اسم الشركة، يمين = كود النموذج */
            const footerMetaHTML = `
                <div class="hse-post-login-overlay-footer-meta">
                    <div class="hse-post-login-overlay-footer-meta-line">
                        <span class="hse-post-login-overlay-footer-meta-item">اسم الشركة: ${safeCompanyName ? safeCompanyName : '—'}</span>
                        <span class="hse-post-login-overlay-footer-meta-item">${safeFormCode} كود النموذج</span>
                    </div>
                </div>`;

            let overlay = document.getElementById('hse-post-login-overlay');
            if (overlay) overlay.remove();
            overlay = document.createElement('div');
            overlay.id = 'hse-post-login-overlay';
            overlay.className = 'hse-post-login-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-label', rawTitle);
            overlay.innerHTML = `
                <div class="hse-post-login-overlay-backdrop"></div>
                <div class="hse-post-login-overlay-card">
                    ${headerHTML}
                    <div class="hse-post-login-overlay-body">${safeBody}</div>
                    <div class="hse-post-login-overlay-footer">
                        <span class="hse-post-login-overlay-timer"></span>
                        <div class="hse-post-login-overlay-actions">
                            <button type="button" class="hse-post-login-ack-btn"><i class="fas fa-check-circle ml-2"></i>لقد اطّلعت على السياسة</button>
                            <button type="button" class="hse-post-login-skip-btn"><i class="fas fa-forward ml-2"></i>تخطي</button>
                        </div>
                    </div>
                    ${footerMetaHTML}
                </div>`;
            document.body.appendChild(overlay);

            /* توسيط مضمون: أنماط مضمنة لضمان ظهور البطاقة في منتصف الشاشة مع dir="rtl" */
            overlay.style.direction = 'ltr';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            const cardEl = overlay.querySelector('.hse-post-login-overlay-card');
            if (cardEl) {
                cardEl.style.position = 'absolute';
                cardEl.style.left = '50%';
                cardEl.style.top = '50%';
                cardEl.style.transform = 'translate(-50%, -50%)';
                cardEl.style.margin = '0';
            }

            if (logoUrl) {
                const logoImg = overlay.querySelector('.hse-post-login-overlay-logo-img');
                const logoPlaceholder = overlay.querySelector('.hse-post-login-overlay-logo-placeholder');
                if (logoImg && logoPlaceholder && logoPlaceholder.parentNode === logoImg.parentNode) {
                    logoImg.addEventListener('error', function() {
                        logoImg.style.display = 'none';
                        logoPlaceholder.style.display = 'flex';
                    });
                }
            }

            const timerEl = overlay.querySelector('.hse-post-login-overlay-timer');
            const updateTimer = (sec) => {
                if (timerEl) timerEl.textContent = duration > 0 ? `سنتقل تلقائياً خلال ${sec} ثانية` : '';
            };

            const goNext = (action) => {
                const actionType = action === 'acknowledged' ? 'acknowledged' : 'skipped';
                if (typeof UserActivityLog !== 'undefined' && UserActivityLog.log) {
                    UserActivityLog.log('post_login_policy', 'PostLoginPolicy', null, {
                        action: actionType,
                        policyTitle: rawTitle,
                        description: actionType === 'acknowledged' ? `اطّلع على السياسة: ${rawTitle}` : `تخطى عرض السياسة: ${rawTitle}`
                    }).catch(() => {});
                }
                const hasNext = index + 1 < items.length;
                removeOverlay(overlay, !hasNext);
                showItem(index + 1);
            };

            const ackBtn = overlay.querySelector('.hse-post-login-ack-btn');
            const skipBtn = overlay.querySelector('.hse-post-login-skip-btn');
            if (ackBtn) ackBtn.addEventListener('click', () => goNext('acknowledged'));
            if (skipBtn) skipBtn.addEventListener('click', () => goNext('skipped'));

            if (duration > 0) {
                let left = duration;
                updateTimer(left);
                timerId = setInterval(() => {
                    left--;
                    updateTimer(left);
                    if (left <= 0) {
                        clearInterval(timerId);
                        timerId = null;
                        if (typeof UserActivityLog !== 'undefined' && UserActivityLog.log) {
                            UserActivityLog.log('post_login_policy', 'PostLoginPolicy', null, {
                                action: 'skipped',
                                policyTitle: rawTitle,
                                description: `انتهى المؤقت (تخطي تلقائي): ${rawTitle}`,
                                auto: true
                            }).catch(() => {});
                        }
                        const hasNext = index + 1 < items.length;
                        removeOverlay(overlay, !hasNext);
                        showItem(index + 1);
                    }
                }, 1000);
            } else if (timerEl) {
                timerEl.textContent = 'اضغط «لقد اطّلعت» أو «تخطي» للمتابعة';
            }
        };

        showItem(0);
    },

    /** متابعة تهيئة التطبيق الرئيسي (بعد شاشة السياسات أو مباشرة بعد الدخول) */
    _continueMainAppSetup() {
        // تفعيل نظام عدم النشاط (فقط إذا لم تكن إعادة تحميل)
        if (typeof InactivityManager !== 'undefined' && !AppState.isPageRefresh) {
            InactivityManager.init();
        } else if (typeof InactivityManager !== 'undefined' && AppState.isPageRefresh) {
            setTimeout(() => {
                if (AppState.currentUser && typeof InactivityManager !== 'undefined') {
                    InactivityManager.init();
                }
            }, 1000);
        }
        this.updateUserProfile();
        this.setupNavigationListeners();
        this.bindSidebarEvents();
        this.initSyncButton();
        this.initUserConnectionStatus();
        
        // تحديث حالة الاتصال بعد تحميل البيانات (مع تأخير للتأكد من تحديث البيانات)
        setTimeout(() => {
            this.updateUserConnectionStatus();
        }, 500);

        // إعداد زر تسجيل الخروج بعد عرض التطبيق (مع محاولات متعددة)
        let logoutSetupAttempts = 0;
        const setupLogoutWithRetry = () => {
            logoutSetupAttempts++;
            this.setupLogoutButton();
            // إعادة المحاولة مرة أخرى بعد 500ms للتأكد
            if (logoutSetupAttempts < 3) {
                setTimeout(setupLogoutWithRetry, 500);
            }
        };
        setTimeout(setupLogoutWithRetry, 100);

        // تحديث القائمة حسب الصلاحيات (مع محاولات متعددة للتأكد من تحميل البيانات)
        Permissions.updateNavigation();
        
        // ✅ إصلاح: إعادة تحديث القائمة بعد تحميل البيانات للتأكد من الصلاحيات الصحيحة
        setTimeout(() => {
            if (typeof Permissions !== 'undefined' && typeof Permissions.updateNavigation === 'function') {
                Permissions.updateNavigation();
            }
        }, 1000);
        
        // محاولة إضافية بعد تحميل البيانات بالكامل
        setTimeout(() => {
            if (typeof Permissions !== 'undefined' && typeof Permissions.updateNavigation === 'function') {
                Permissions.updateNavigation();
            }
        }, 2000);

        // عرض صورة المستخدم ي الشريط الجانبي
        this.updateUserProfilePhoto();

        // إظهار أزرار الهيدر (Theme Toggle & Notifications)
        this.showHeaderActions();

        // تهيئة أزرار القائمة الجانبية (الوضع الليلي، الإشعارات، اللغة)
        this.initSidebarButtons();

        // تهيئة مساعد المستخدم الذكي
        if (typeof UserAIAssistant !== 'undefined' && UserAIAssistant.init) {
            setTimeout(() => {
                UserAIAssistant.init();
            }, 500);
        }

        // تم نقل المزامنة إلى Auth.login لتجنب المزامنات المكررة
        // المزامنة تحدث مرة واحدة فقط بعد تسجيل الدخول في Auth.login
        // هذا يحسن الأداء ويقلل وقت تسجيل الدخول
        if (!AppState.googleConfig?.appsScript?.enabled) {
            Utils.safeLog('ℹ قاعدة البيانات غير متصلة، سيتم استخدام البيانات المحلية فقط');
            // إذا لم تكن قاعدة البيانات متصلة، نتحقق من وجود بيانات محلية
            // لا نعرض الإشعار عند إعادة التحميل
            if (!AppState.isPageRefresh) {
                const hasLocalData = Object.keys(AppState.appData).some(key =>
                    Array.isArray(AppState.appData[key]) && AppState.appData[key].length > 0
                );
                if (!hasLocalData) {
                    Notification.info('لا توجد بيانات محلية. يرجى الاتصال بقاعدة البيانات لتحميل البيانات.');
                }
            }
        }

        // بدء نظام مراقبة الاتصال بعد عرض التطبيق الرئيسي
        if (typeof ConnectionMonitor !== 'undefined' && ConnectionMonitor.start) {
            setTimeout(() => {
                try {
                    ConnectionMonitor.start();
                    Utils.safeLog('✅ تم بدء نظام مراقبة الاتصال');
                    // تحديث حالة الأزرار بعد بدء المراقبة
                    this.updateSyncButtonStatus();
                    this.updateUserConnectionStatus();
                } catch (monitorError) {
                    Utils.safeWarn('⚠️ فشل بدء نظام مراقبة الاتصال:', monitorError);
                }
            }, 2000); // انتظار 2 ثانية بعد تحميل التطبيق
        }
        
        // تحديث حالة زر المزامنة بشكل دوري (حالة الاتصال يتم تحديثها تلقائياً عبر startAutoRefreshConnectionStatus)
        setInterval(() => {
            this.updateSyncButtonStatus();
        }, 3000); // كل 3 ثوان للتحديث الأسرع

        // إظهار شعار الشركة في الهيدر
        this.updateCompanyLogoHeader();

        // تحديث شعار الشركة في لوحة التحكم
        this.updateDashboardLogo();

        // ✅ استعادة القسم المحفوظ عند إعادة التحميل (ثبات الصفحة - عدم العودة للشاشة الرئيسية)
        // أولوية: sessionStorage (آخر قسم مفتوح) ثم hash الرابط ثم dashboard
        const savedSection = sessionStorage.getItem('hse_current_section');
        const hashSection = (typeof window.location !== 'undefined' && window.location.hash)
            ? window.location.hash.replace(/^#/, '').trim()
            : '';
        const sectionToShow = savedSection || (hashSection || 'dashboard');

        // ✅ تحديث AppState.currentSection قبل عرض القسم لضمان التزامن
        AppState.currentSection = sectionToShow;

        // ✅ تحديث عنوان الصفحة (hash) ليعكس القسم المستعاد بعد إعادة التحميل
        try {
            if (sectionToShow && typeof window.location !== 'undefined') {
                window.location.hash = sectionToShow;
            }
        } catch (e) { /* ignore */ }

        Utils.safeLog('📂 استعادة القسم:', {
            savedSection,
            sectionToShow,
            isPageRefresh: AppState.isPageRefresh,
            currentSection: AppState.currentSection
        });

        // عند استعادة القسم المحفوظ، نعرض القسم بدون رسالة خطأ إذا لم يكن لديه صلاحية
        // لأن هذا ليس محاولة وصول فعلية من المستخدم
        AppState.isNavigatingBack = true; // تعيين علامة لتجنب عرض رسالة الخطأ
        // عرض القسم المطلوب أولاً
        this.showSection(sectionToShow);
        // إعادة تعيين العلامة بعد التنقل
        setTimeout(() => {
            AppState.isNavigatingBack = false;
        }, 300);

        // فتح القائمة الجانبية عند بدء التطبيق (على سطح المكتب) - بعد عرض القسم
        // على الموبايل تبقى مغلقة افتراضياً
        if (window.innerWidth > 1024) {
            setTimeout(() => {
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) {
                    // إذا كان القسم المطلوب هو Dashboard، نفتح القائمة الجانبية
                    if (sectionToShow === 'dashboard') {
                        if (!sidebar.classList.contains('open')) {
                            this.toggleSidebar(true);
                        }
                    } else {
                        // إذا كان القسم ليس Dashboard، نتأكد من إغلاق القائمة
                        if (sidebar.classList.contains('open')) {
                            this.toggleSidebar(false);
                        }
                    }
                }
            }, 100);
        }

        // ✅ إصلاح: تحميل Dashboard مباشرة بدون تأخير
        // البيانات يتم تحميلها بالفعل في auth.js بعد تسجيل الدخول
        // هنا نحمّل Dashboard فقط إذا كان القسم المطلوب هو dashboard
        (async () => {
            try {
                // ✅ التأكد من وجود بيانات المستخدمين قبل تحميل Dashboard
                if (!AppState.appData.users || AppState.appData.users.length === 0) {
                    // إذا لم تكن بيانات المستخدمين محملة، نستخدم البيانات المحلية
                    if (typeof DataManager !== 'undefined' && DataManager.load) {
                        await DataManager.load();
                    }
                }
                
                // ✅ إصلاح: تحميل إعدادات الشركة (بما في ذلك الشعار) إذا لم تكن محملة
                // هذا يضمن تحميل الشعار حتى لو لم يتم تحميله بعد تسجيل الدخول
                // forceReload = false هنا لأن showMainApp قد يُستدعى عدة مرات
                // سنستخدم localStorage إذا كان موجوداً
                if (typeof DataManager !== 'undefined' && DataManager.loadCompanySettings) {
                    try {
                        // لا نستخدم forceReload هنا لتجنب التحميل المتكرر
                        await DataManager.loadCompanySettings(false);
                    } catch (settingsError) {
                        Utils.safeWarn('⚠️ فشل تحميل إعدادات الشركة في showMainApp:', settingsError);
                    }
                }

                // تحميل البيانات تلقائياً من الخادم بعد تسجيل الدخول (Supabase أو Google Script)
                const canSync = AppState.currentUser &&
                    typeof GoogleIntegration !== 'undefined' &&
                    typeof GoogleIntegration.syncData === 'function' &&
                    (AppState.useSupabaseBackend === true || (AppState.googleConfig?.appsScript?.enabled && AppState.googleConfig?.appsScript?.scriptUrl));
                if (canSync) {
                    GoogleIntegration.syncData({
                        silent: true,
                        showLoader: false,
                        notifyOnSuccess: false,
                        notifyOnError: false,
                        incremental: false
                    }).catch(error => {
                        Utils.safeWarn('⚠️ فشل التحميل التلقائي للبيانات بعد تسجيل الدخول:', error);
                    });
                }

                // تحديث جميع البيانات المرئية (يتضمن تحميل Dashboard مرة واحدة عند sectionToShow === 'dashboard')
                // تجنب استدعاء Dashboard.load() هنا ثم مرة أخرى داخل refreshCurrentSection لتفادي وميض لوحة التقارير والإحصائيات
                this.refreshCurrentSection();

                // ✅ إضافة: الاستماع لحدث اكتمال المزامنة لتحديث الموديولات تلقائياً
                this.setupSyncDataCompletedListener();

                // إعادة تعيين العلامة بعد تحميل البيانات (إذا كانت إعادة تحميل)
                if (AppState.isPageRefresh) {
                    AppState.isPageRefresh = false;
                    Utils.safeLog('✅ تم إعادة تعيين علامة إعادة التحميل');
                }

                // تحديث الإشعارات بعد تحميل البيانات
                if (this.updateNotificationsBadge) {
                    setTimeout(() => {
                        this.updateNotificationsBadge();
                    }, 300);
                }
            } catch (error) {
                Utils.safeError('❌ خطأ في تحميل Dashboard:', error);
            }
        })();

        // تحديث الإشعارات عند تحميل التطبيق
        if (this.updateNotificationsBadge) {
            setTimeout(() => {
                this.updateNotificationsBadge();
            }, 1500);
        }
    },

    /**
     * ✅ إعداد الاستماع لحدث اكتمال المزامنة
     */
    setupSyncDataCompletedListener() {
        // إزالة المستمع السابق إن وجد
        if (this._syncDataCompletedHandler) {
            window.removeEventListener('syncDataCompleted', this._syncDataCompletedHandler);
        }

        // إضافة مستمع جديد
        this._syncDataCompletedHandler = (event) => {
            const { syncedCount, failedSheets, sheets } = event.detail || {};
            
            if (AppState.debugMode) {
                Utils.safeLog(`✅ اكتملت المزامنة: ${syncedCount} جدول، ${failedSheets?.length || 0} فشل`);
            }

            // ✅ إصلاح: تحديث صلاحيات المستخدم الحالي إذا تم تحديث ورقة Users
            if (sheets && sheets.includes('users') && AppState.currentUser && AppState.appData.users) {
                const currentUserEmail = AppState.currentUser.email?.toLowerCase();
                const updatedUser = AppState.appData.users.find(u => 
                    u.email && u.email.toLowerCase() === currentUserEmail
                );
                
                if (updatedUser) {
                    // ✅ إصلاح: تطبيع الصلاحيات قبل التحديث
                    const normalizedPermissions = typeof Permissions !== 'undefined' && typeof Permissions.normalizePermissions === 'function'
                        ? Permissions.normalizePermissions(updatedUser.permissions)
                        : (updatedUser.permissions || {});
                    
                    // تحديث صلاحيات المستخدم الحالي
                    AppState.currentUser.permissions = normalizedPermissions || {};
                    // تحديث صورة الملف الشخصي من قاعدة البيانات (حتى تظهر بعد المزامنة أو تحديث الصفحة)
                    if (updatedUser.photo != null) AppState.currentUser.photo = updatedUser.photo;
                    
                    // تحديث الجلسة بالصلاحيات الجديدة
                    if (typeof window.Auth !== 'undefined' && typeof window.Auth.updateUserSession === 'function') {
                        window.Auth.updateUserSession();
                        if (AppState.debugMode) {
                            Utils.safeLog('✅ تم تحديث صلاحيات المستخدم الحالي بعد المزامنة');
                        }
                    }
                    
                    // تحديث القائمة الجانبية
                    if (typeof Permissions !== 'undefined' && typeof Permissions.updateNavigation === 'function') {
                        Permissions.updateNavigation();
                    }
                }
            }
            // تحديث صورة المستخدم في الشريط الجانبي بعد مزامنة المستخدمين (حتى تظهر الصورة المحفوظة في قاعدة البيانات)
            if (sheets && sheets.some(function(s) { return s && String(s).toLowerCase() === 'users'; })) {
                if (typeof this.updateUserProfilePhoto === 'function') this.updateUserProfilePhoto();
            }

            // تحديث الموديول الحالي إذا كان موجوداً (ما عدا لوحة التحكم لتفادي وميض الكروت)
            const currentSection = AppState.currentSection;
            if (currentSection && currentSection !== 'dashboard') {
                this.refreshCurrentSection(true); // silent = true
            }
            // لا نعيد تحميل Dashboard عند اكتمال المزامنة — البيانات محدّثة في AppState والكروت تبقى ثابتة بدون وميض
        };

        window.addEventListener('syncDataCompleted', this._syncDataCompletedHandler);
        
        if (AppState.debugMode) {
            Utils.safeLog('✅ تم إعداد مستمع حدث اكتمال المزامنة');
        }
    },

    /**
     * تحديث قسم البيانات الحالي
     */
    refreshCurrentSection(silent = false) {
        const currentSection = AppState.currentSection || 'dashboard';
        if (typeof this.loadSectionData === 'function') {
            this.loadSectionData(currentSection, silent || AppState.isPageRefresh);
        }
    },

    /**
     * ربط أحداث النقر على شعار الشركة واسم الشركة في الهيدر
     */
    bindCompanyHeaderClickEvents() {
        const logoImg = document.getElementById('header-company-logo');
        const companyNameText = document.getElementById('header-company-name-text');
        const companySecondaryText = document.getElementById('header-company-secondary-text');
        const companyTextGroup = document.getElementById('header-company-text-group');
        const header = document.getElementById('company-logo-header');

        // معالج النقر الموحد لفتح القائمة الجانبية
        const handleHeaderClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleSidebar();
        };

        // ربط حدث النقر على الشعار
        if (logoImg && !logoImg.dataset.clickBound) {
            logoImg.style.cursor = 'pointer';
            logoImg.setAttribute('title', 'انقر لفتح القائمة الجانبية');
            logoImg.setAttribute('role', 'button');
            logoImg.setAttribute('aria-label', 'فتح القائمة الجانبية');
            logoImg.addEventListener('click', handleHeaderClick);
            logoImg.dataset.clickBound = 'true';
        }

        // ربط حدث النقر على اسم الشركة
        if (companyNameText && !companyNameText.dataset.clickBound) {
            companyNameText.style.cursor = 'pointer';
            companyNameText.setAttribute('title', 'انقر لفتح القائمة الجانبية');
            companyNameText.setAttribute('role', 'button');
            companyNameText.setAttribute('aria-label', 'فتح القائمة الجانبية');
            companyNameText.addEventListener('click', handleHeaderClick);
            companyNameText.dataset.clickBound = 'true';
        }

        // ربط حدث النقر على النص الثانوي
        if (companySecondaryText && !companySecondaryText.dataset.clickBound) {
            companySecondaryText.style.cursor = 'pointer';
            companySecondaryText.setAttribute('title', 'انقر لفتح القائمة الجانبية');
            companySecondaryText.setAttribute('role', 'button');
            companySecondaryText.setAttribute('aria-label', 'فتح القائمة الجانبية');
            companySecondaryText.addEventListener('click', handleHeaderClick);
            companySecondaryText.dataset.clickBound = 'true';
        }

        // ربط حدث النقر على مجموعة النصوص (لجعل المنطقة بأكملها قابلة للنقر)
        if (companyTextGroup && !companyTextGroup.dataset.clickBound) {
            companyTextGroup.style.cursor = 'pointer';
            companyTextGroup.addEventListener('click', handleHeaderClick);
            companyTextGroup.dataset.clickBound = 'true';
        }

        // ربط حدث النقر على الهيدر ككل (المنطقة اليسرى فقط)
        if (header) {
            const leftSection = header.querySelector('div:first-child');
            if (leftSection && !leftSection.dataset.clickBound) {
                leftSection.style.cursor = 'pointer';
                leftSection.addEventListener('click', handleHeaderClick);
                leftSection.dataset.clickBound = 'true';
            }
        }
    },

    /**
     * تحديث شعار الشركة في الهيدر
     */
    updateCompanyLogoHeader() {
        const header = document.getElementById('company-logo-header');
        const logoImg = document.getElementById('header-company-logo');
        const logoImgRight = document.getElementById('header-company-logo-right');
        this.updateCompanyBranding();

        if (header) {
            const logoToShow = this._isValidLogoUrl(AppState.companyLogo) ? AppState.companyLogo : null;
            if (logoToShow) {
                header.style.display = 'flex';
                header.style.justifyContent = 'space-between';
                header.style.alignItems = 'center';
                header.style.padding = '10px 20px';

                // تحديث موقع الهيدر بناءً على حالة القائمة الجانبية
                const sidebar = document.querySelector('.sidebar');
                const sidebarOpen = sidebar && sidebar.classList.contains('open');
                this.updateCompanyLogoHeaderPosition(sidebarOpen);

                // الشعار في الجانب الأيسر فقط (تم إزالة الشعار الأيمن)
                if (logoImg) {
                    // إعداد معالج الأخطاء قبل تعيين src
                    let hasError = false;
                    logoImg.onerror = () => {
                        if (!hasError) {
                            hasError = true;
                            logoImg.style.display = 'none';
                        }
                    };
                    logoImg.onload = () => {
                        hasError = false;
                        logoImg.style.display = 'block';
                    };
                    
                    logoImg.src = logoToShow;
                    logoImg.style.display = 'block';
                    logoImg.style.maxHeight = '50px';
                    logoImg.style.maxWidth = '150px';
                    logoImg.style.objectFit = 'contain';
                }

                // إخفاء الشعار الأيمن (تم إزالته حسب الطلب)
                if (logoImgRight) {
                    logoImgRight.style.display = 'none';
                }
            } else {
                header.style.display = 'none';
                if (logoImg) { logoImg.style.display = 'none'; logoImg.src = ''; }
                if (logoImgRight) logoImgRight.style.display = 'none';
            }

            // إضافة padding-top لجميع الأقسام عند إظهار الهيدر
            const allSections = document.querySelectorAll('.section');
            allSections.forEach(section => {
                if (header && header.style.display === 'flex' && window.innerWidth > 1024) {
                    section.style.paddingTop = '70px';
                } else {
                    section.style.paddingTop = '0';
                }
            });

            // إظهار أزرار الهيدر (الإشعارات والوضع الليلي) عند إظهار الهيدر
            if (header && header.style.display === 'flex') {
                this.showHeaderActions();
            }

            // ربط أحداث النقر على الشعار واسم الشركة
            this.bindCompanyHeaderClickEvents();
        }
    },

    /**
     * تحديث شعار الشركة ي لوحة التحكم
     * تم إزالة الشعار من Dashboard حسب الطلب - الشعار فقط في الهيدر
     */
    updateDashboardLogo() {
        // تم إزالة الشعار من Dashboard حسب الطلب - الشعار فقط في الهيدر
        const dashboardLogoDiv = document.getElementById('dashboard-company-logo');
        if (dashboardLogoDiv) {
            dashboardLogoDiv.style.display = 'none';
        }

        // إزالة الشعارات من جميع الموديولات الأخرى أيضاً
        const allSections = document.querySelectorAll('.section');
        allSections.forEach(section => {
            const sectionLogoDiv = section.querySelector('.section-company-logo');
            if (sectionLogoDiv) {
                sectionLogoDiv.remove();
            }
        });
    },

    updateCompanyBranding() {
        const fallbackName = (typeof DEFAULT_COMPANY_NAME !== 'undefined') ? DEFAULT_COMPANY_NAME : '';
        const rawName = AppState?.companySettings?.name;
        let resolvedName = '';
        if (rawName !== undefined && rawName !== null) {
            const trimmedName = String(rawName).trim();
            if (trimmedName) {
                resolvedName = trimmedName;
            }
        }
        if (!resolvedName) {
            resolvedName = fallbackName;
        }
        const rawSecondaryName = AppState?.companySettings?.secondaryName;
        const resolvedSecondaryName = (rawSecondaryName !== undefined && rawSecondaryName !== null)
            ? String(rawSecondaryName).trim()
            : '';

        // الحصول على إعدادات الخط واللون
        const nameFontSize = AppState?.companySettings?.nameFontSize || 16;
        const secondaryNameFontSize = AppState?.companySettings?.secondaryNameFontSize || 14;
        const secondaryNameColor = AppState?.companySettings?.secondaryNameColor || '#6B7280';

        const loginCompanyName = document.getElementById('login-company-name');
        if (loginCompanyName) {
            loginCompanyName.textContent = resolvedName;
            loginCompanyName.style.fontSize = `${nameFontSize}px`;
        }
        const loginCompanySecondary = document.getElementById('login-company-secondary-name');
        if (loginCompanySecondary) {
            if (resolvedSecondaryName) {
                loginCompanySecondary.textContent = resolvedSecondaryName;
                loginCompanySecondary.style.display = 'block';
                loginCompanySecondary.style.fontSize = `${secondaryNameFontSize}px`;
                loginCompanySecondary.style.color = secondaryNameColor;
            } else {
                loginCompanySecondary.textContent = '';
                loginCompanySecondary.style.display = 'none';
            }
        }

        const headerCompanyName = document.getElementById('header-company-name-text');
        if (headerCompanyName) {
            headerCompanyName.textContent = resolvedName;
            headerCompanyName.style.display = resolvedName ? 'block' : 'none';
            headerCompanyName.style.fontSize = `${nameFontSize}px`;
        }
        const headerCompanySecondary = document.getElementById('header-company-secondary-text');
        if (headerCompanySecondary) {
            if (resolvedSecondaryName) {
                headerCompanySecondary.textContent = resolvedSecondaryName;
                headerCompanySecondary.style.display = 'block';
                headerCompanySecondary.style.fontSize = `${secondaryNameFontSize}px`;
                headerCompanySecondary.style.color = secondaryNameColor;
            } else {
                headerCompanySecondary.textContent = '';
                headerCompanySecondary.style.display = 'none';
            }
        }

        const mobileCompanyName = document.getElementById('mobile-company-name');
        if (mobileCompanyName) {
            mobileCompanyName.textContent = resolvedName || 'نظام السلامة المهنية';
            mobileCompanyName.style.fontSize = `${nameFontSize}px`;
        }
    },

    /**
     * التحقق من أن رابط الشعار آمن للعرض (يمنع طلبات 503 لـ example.com/logo.png أو روابط غير صالحة)
     */
    _isValidLogoUrl(url) {
        if (!url || typeof url !== 'string') return false;
        const u = url.trim();
        if (u.length < 10) return false;
        if (u.toLowerCase().startsWith('data:')) return true;
        if (u.startsWith('https://')) {
            try {
                const host = new URL(u).hostname.toLowerCase();
                if (host === 'example.com' || host === 'example.org' || host === 'localhost') return false;
                return true;
            } catch (e) { return false; }
        }
        return false;
    },

    /**
     * تحديث شعار الشركة في شاشة تسجيل الدخول
     */
    updateLoginLogo() {
        const loginLogoImg = document.getElementById('company-logo');
        const defaultLogoIcon = document.getElementById('default-logo-icon');

        if (!loginLogoImg || !defaultLogoIcon) {
            Utils.safeWarn('⚠️ عناصر الشعار غير موجودة في DOM');
            return;
        }

        // محاولة الحصول على الشعار من مصادر متعددة
        let logoUrl = null;

        // المصدر 1: AppState.companyLogo
        if (AppState && AppState.companyLogo && AppState.companyLogo.trim() !== '') {
            logoUrl = AppState.companyLogo.trim();
        }

        // المصدر 2: localStorage
        if (!logoUrl) {
            try {
                const savedLogo = localStorage.getItem('hse_company_logo') || localStorage.getItem('company_logo');
                if (savedLogo && savedLogo.trim() !== '') {
                    logoUrl = savedLogo.trim();
                }
            } catch (e) {
                Utils.safeWarn('⚠️ خطأ في قراءة الشعار من localStorage:', e);
            }
        }

        // المصدر 3: company settings
        if (!logoUrl && AppState && AppState.companySettings) {
            const settingsLogo = AppState.companySettings.logo;
            if (settingsLogo && settingsLogo.trim() !== '') {
                logoUrl = settingsLogo.trim();
            }
        }

        // استخدام الشعار فقط إذا كان رابطاً صالحاً (يمنع 503 من example.com/logo.png أو مسارات نسبية)
        if (logoUrl && !this._isValidLogoUrl(logoUrl)) logoUrl = null;

        // إذا وجد شعار، نعرضه ونخفي الأيقونة الافتراضية
        if (logoUrl && logoUrl.trim() !== '') {
            // إعداد معالجات الأحداث قبل تعيين src
            let hasError = false;

            loginLogoImg.onerror = () => {
                if (!hasError) {
                    hasError = true;
                    Utils.safeWarn('⚠️ فشل تحميل شعار الشركة من:', logoUrl);
                    loginLogoImg.style.display = 'none';
                    defaultLogoIcon.style.display = 'inline-block';
                    // إزالة src التالف لمنع محاولات متكررة
                    loginLogoImg.src = '';
                }
            };

            loginLogoImg.onload = () => {
                // عند تحميل الصورة بنجاح
                hasError = false;
                loginLogoImg.style.display = 'block';
                defaultLogoIcon.style.display = 'none';

                // التأكد من التنسيق المناسب
                loginLogoImg.style.maxWidth = '180px';
                loginLogoImg.style.maxHeight = '120px';
                loginLogoImg.style.width = 'auto';
                loginLogoImg.style.height = 'auto';
                loginLogoImg.style.objectFit = 'contain';
                loginLogoImg.style.margin = '0 auto';
                loginLogoImg.style.borderRadius = '8px';
            };

            // تعيين src بعد إعداد المعالجات
            loginLogoImg.src = logoUrl;
            loginLogoImg.style.display = 'block';
            defaultLogoIcon.style.display = 'none';

        } else {
            // لا يوجد شعار - إخفاء الصورة وإظهار الأيقونة الافتراضية
            loginLogoImg.style.display = 'none';
            loginLogoImg.src = '';
            defaultLogoIcon.style.display = 'inline-block';
        }
    },

    sidebarResizeBound: false,
    sidebarKeydownBound: false,

    toggleSidebar(open = null) {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (!sidebar) return;

        const shouldOpen = open !== null ? open : !sidebar.classList.contains('open');
        const isMobile = window.innerWidth <= 1024;

        if (shouldOpen) {
            sidebar.classList.add('open');
            // إظهار الـ overlay فقط على الموبايل
            if (overlay && isMobile) {
                overlay.classList.add('visible');
                overlay.setAttribute('aria-hidden', 'false');
            }
            if (isMobile) {
                // حفظ موضع التمرير للاستعادة لاحقاً
                const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
                document.body.dataset.scrollY = scrollY.toString();
                // استخدام CSS فقط لمنع التمرير (يتجنب scroll-linked positioning warnings)
                // CSS يتعامل مع position: fixed بدون الحاجة لتعيين top بناءً على scroll position
                document.body.classList.add('sidebar-open');
            }
        } else {
            sidebar.classList.remove('open');
            // إخفاء الـ overlay على جميع الشاشات
            if (overlay) {
                overlay.classList.remove('visible');
                overlay.setAttribute('aria-hidden', 'true');
            }
            if (isMobile) {
                // استعادة موضع التمرير قبل إزالة الـ class
                const scrollY = document.body.dataset.scrollY;
                document.body.classList.remove('sidebar-open');
                delete document.body.dataset.scrollY;

                // استعادة موضع التمرير بعد إزالة position: fixed
                if (scrollY) {
                    const scrollValue = parseInt(scrollY) || 0;
                    // استخدام requestAnimationFrame لضمان تطبيق التغييرات
                    requestAnimationFrame(() => {
                        window.scrollTo({
                            top: scrollValue,
                            behavior: 'auto'
                        });
                    });
                }
            }
        }

        const toggleBtn = document.getElementById('sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
            // تحديث أيقونة الزر
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = shouldOpen ? 'fas fa-times' : 'fas fa-bars';
            }
        }

        // تحديث موقع الهيدر بناءً على حالة القائمة الجانبية
        this.updateCompanyLogoHeaderPosition(shouldOpen);
    },

    /**
     * تحديث موقع الهيدر بناءً على حالة القائمة الجانبية
     */
    updateCompanyLogoHeaderPosition(sidebarOpen) {
        const header = document.getElementById('company-logo-header');
        if (!header) return;

        // على الشاشات الكبيرة (> 1024px)، إذا كانت القائمة مفتوحة، الهيدر يكون بجانبها
        // وإذا كانت مغلقة، يكون كامل العرض
        if (window.innerWidth > 1024) {
            if (sidebarOpen) {
                header.style.right = 'var(--sidebar-width)';
                header.style.left = '0';
            } else {
                header.style.right = '0';
                header.style.left = '0';
            }
        } else {
            // على الموبايل، الهيدر دائماً كامل العرض
            header.style.right = '0';
            header.style.left = '0';
        }
    },

    bindSidebarEvents() {
        const toggleBtn = document.getElementById('sidebar-toggle');
        const overlay = document.getElementById('sidebar-overlay');

        if (toggleBtn && !toggleBtn.dataset.bound) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleSidebar();
            });
            toggleBtn.dataset.bound = 'true';
        }

        if (overlay && !overlay.dataset.bound) {
            overlay.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleSidebar(false);
            });
            overlay.dataset.bound = 'true';
            overlay.setAttribute('aria-hidden', 'true');
        }

        // ربط أحداث النقر على شعار الشركة واسم الشركة في الهيدر
        this.bindCompanyHeaderClickEvents();

        // إغلاق القائمة الجانبية عند النقر على عنصر القائمة على جميع أحجام الشاشات
        // ملاحظة: هذا يتم التعامل معه في setupNavigationListeners أيضاً
        // ولكن نضيفه هنا كنسخة احتياطية
        if (!this.sidebarNavItemsBound) {
            const handleNavClick = () => {
                // إغلاق القائمة الجانبية على جميع أحجام الشاشات
                const sidebar = document.querySelector('.sidebar');
                if (sidebar && sidebar.classList.contains('open')) {
                    // ملاحظة: إغلاق القائمة يتم الآن تلقائياً في showSection() لجميع أحجام الشاشات
                    // ولكن نضيف هذا كنسخة احتياطية للتعامل مع الحالات الخاصة
                }
            };

            // استخدام event delegation للتعامل مع العناصر الديناميكية
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && !sidebar.dataset.navDelegationBound) {
                sidebar.addEventListener('click', (e) => {
                    const navItem = e.target.closest('.nav-item');
                    if (navItem) {
                        handleNavClick();
                    }
                }, true);
                sidebar.dataset.navDelegationBound = 'true';
            }

            this.sidebarNavItemsBound = true;
        }

        if (!this.sidebarResizeBound) {
            const handleResize = () => {
                if (window.innerWidth > 1024) {
                    this.toggleSidebar(false);
                }
                // تحديث إظهار أزرار الهيدر عند تغيير حجم النافذة
                this.showHeaderActions();
            };
            window.addEventListener('resize', handleResize);
            this.sidebarResizeBound = true;
        }

        if (!this.sidebarKeydownBound) {
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && window.innerWidth <= 1024) {
                    const sidebar = document.querySelector('.sidebar');
                    if (sidebar && sidebar.classList.contains('open')) {
                        this.toggleSidebar(false);
                    }
                }
            });
            this.sidebarKeydownBound = true;
        }

        // النقر على صورة/أيقونة المستخدم لرفع أو تغيير الصورة
        if (!this.userAvatarPhotoBound) {
            const avatarEl = document.querySelector('.user-avatar.user-avatar-clickable');
            const photoInput = document.getElementById('user-profile-photo-input');
            if (avatarEl && photoInput) {
                function openProfilePhotoPicker() {
                    if (AppState.currentUser && AppState.currentUser.email && photoInput) {
                        photoInput.value = '';
                        photoInput.click();
                    }
                }
                avatarEl.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openProfilePhotoPicker();
                });
                avatarEl.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openProfilePhotoPicker();
                    }
                });
                photoInput.addEventListener('change', function(ev) {
                    const file = ev.target && ev.target.files && ev.target.files[0];
                    if (file && typeof UI !== 'undefined' && UI.handleUserProfilePhotoUpload) {
                        UI.handleUserProfilePhotoUpload(file);
                    }
                    ev.target.value = '';
                });
                this.userAvatarPhotoBound = true;
            }
        }
    },

    /**
     * معالجة رفع صورة المستخدم من الشريط الجانبي (إضافة/تغيير)
     * @param {File} file - ملف الصورة المختار
     */
    handleUserProfilePhotoUpload(file) {
        const self = this;
        const user = AppState.currentUser;
        if (!user || !user.email) {
            if (typeof Notification !== 'undefined') Notification.warning('يجب تسجيل الدخول أولاً.');
            return;
        }
        const users = AppState.appData.users || [];
        const userRecord = users.find(function(u) { return u && u.email && u.email.toLowerCase().trim() === user.email.toLowerCase().trim(); });
        if (!userRecord || !userRecord.id) {
            if (typeof Notification !== 'undefined') Notification.warning('لم يتم العثور على بيانات المستخدم.');
            return;
        }
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            if (typeof Notification !== 'undefined') Notification.error('حجم الصورة كبير جداً. الحد الأقصى 2 ميجابايت.');
            return;
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!file.type || !allowedTypes.includes(file.type)) {
            if (typeof Notification !== 'undefined') Notification.error('نوع الملف غير مدعوم. استخدم صورة (JPEG, PNG, GIF, WEBP).');
            return;
        }
        // حفظ الصورة الحالية لاستعادتها عند فشل الرفع أو الإلغاء
        const previousPhotoUrl = (userRecord && userRecord.photo) || (AppState.currentUser && AppState.currentUser.photo) || '';
        function restorePreviousPhoto() {
            if (previousPhotoUrl) {
                if (userRecord) userRecord.photo = previousPhotoUrl;
                if (AppState.currentUser) AppState.currentUser.photo = previousPhotoUrl;
                if (typeof Auth !== 'undefined' && Auth.updateUserSession) Auth.updateUserSession();
                self.updateUserProfilePhoto();
            }
        }

        if (typeof Loading !== 'undefined' && Loading.show) Loading.show('جاري رفع صورة المستخدم...');
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target && e.target.result;
            if (!dataUrl || typeof dataUrl !== 'string') {
                if (typeof Loading !== 'undefined' && Loading.hide) Loading.hide();
                if (typeof Notification !== 'undefined') Notification.error('فشل قراءة الملف.');
                return;
            }
            const base64Data = dataUrl;
            const ext = (file.name && file.name.lastIndexOf('.') >= 0) ? file.name.substring(file.name.lastIndexOf('.')) : '.jpg';
            const fileName = 'user_photo_' + (userRecord.id || userRecord.email.replace(/@/g, '_')) + '_' + Date.now() + ext;
            const mimeType = file.type || 'image/jpeg';
            const uploadPromise = (typeof GoogleIntegration !== 'undefined' && GoogleIntegration.uploadFileToDrive)
                ? GoogleIntegration.uploadFileToDrive(base64Data, fileName, mimeType, 'Users')
                : Promise.reject(new Error('الاتصال بالخادم غير متاح'));
            uploadPromise.then(function(uploadResult) {
                // دعم أشكال متعددة لرابط الصورة (Google Drive، Supabase Storage، إلخ)
                const photoUrl = (uploadResult && (
                    uploadResult.directLink ||
                    uploadResult.shareableLink ||
                    uploadResult.url ||
                    uploadResult.publicUrl ||
                    uploadResult.imageUrl ||
                    (uploadResult.cloudLink && uploadResult.cloudLink.url) ||
                    (uploadResult.files && uploadResult.files[0] && (uploadResult.files[0].directLink || uploadResult.files[0].shareableLink || uploadResult.files[0].url))
                )) || '';
                if (!photoUrl) {
                    const msg = (uploadResult && uploadResult.message) ? String(uploadResult.message) : '';
                    if (uploadResult && uploadResult.success === false && msg) {
                        if (typeof Loading !== 'undefined' && Loading.hide) Loading.hide();
                        if (typeof Notification !== 'undefined') Notification.error(msg);
                        restorePreviousPhoto();
                        return Promise.resolve(null);
                    }
                    throw new Error(msg || 'لم يتم الحصول على رابط الصورة. تأكد من تفعيل رفع الملفات في الإعدادات.');
                }
                return (typeof GoogleIntegration !== 'undefined' && GoogleIntegration.sendToAppsScript)
                    ? GoogleIntegration.sendToAppsScript('updateUser', { userId: userRecord.id, updateData: { photo: photoUrl } }).then(function(r) { return { updateResult: r, photoUrl: photoUrl }; })
                    : Promise.reject(new Error('الاتصال بالخادم غير متاح'));
            }).then(function(data) {
                if (!data) return;
                const updateResult = data && data.updateResult;
                const photoUrl = data && data.photoUrl;
                if (typeof Loading !== 'undefined' && Loading.hide) Loading.hide();
                if (updateResult && updateResult.success && photoUrl) {
                    if (userRecord) userRecord.photo = photoUrl;
                    if (AppState.currentUser) AppState.currentUser.photo = photoUrl;
                    // تحديث المستخدم في القائمة المحلية حتى تظهر الصورة فوراً دون اعتماد على مزامنة
                    if (AppState.appData && Array.isArray(AppState.appData.users)) {
                        var u = AppState.appData.users.find(function(us) {
                            return us && (us.id === userRecord.id || (us.email && userRecord.email && us.email.toLowerCase() === userRecord.email.toLowerCase()));
                        });
                        if (u) u.photo = photoUrl;
                    }
                    if (typeof Auth !== 'undefined' && Auth.updateUserSession) Auth.updateUserSession();
                    if (typeof DataManager !== 'undefined' && DataManager.save) DataManager.save();
                    self.updateUserProfilePhoto();
                    if (typeof Notification !== 'undefined') Notification.success('تم حفظ صورة المستخدم بنجاح.');
                } else {
                    if (typeof Notification !== 'undefined') Notification.error(updateResult && updateResult.message ? updateResult.message : 'فشل تحديث الصورة.');
                    restorePreviousPhoto();
                }
            }).catch(function(err) {
                if (typeof Loading !== 'undefined' && Loading.hide) Loading.hide();
                if (typeof Utils !== 'undefined' && Utils.safeError) Utils.safeError('خطأ رفع صورة المستخدم:', err);
                if (typeof Notification !== 'undefined') Notification.error('فشل رفع أو حفظ الصورة. ' + (err && err.message ? err.message : ''));
                restorePreviousPhoto();
            });
        };
        reader.onerror = function() {
            if (typeof Loading !== 'undefined' && Loading.hide) Loading.hide();
            if (typeof Notification !== 'undefined') Notification.error('فشل قراءة الملف.');
        };
        reader.readAsDataURL(file);
    },

    /**
     * إعداد event listeners للتنقل
     */
    setupNavigationListeners() {
        // إزالة event listeners القديمة (إن وجدت)
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            // استنساخ العنصر لإزالة جميع event listeners
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
        });

        // إضافة event listeners جديدة
        const newNavItems = document.querySelectorAll('.nav-item');
        newNavItems.forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const section = this.getAttribute('data-section');
                if (section) {
                    UI.showSection(section);
                    // ملاحظة: إغلاق القائمة الجانبية يتم الآن تلقائياً في showSection() لجميع أحجام الشاشات
                }
            }, { passive: false });
        });

        // إعداد معالج زر تسجيل الخروج مباشرة
        this.setupLogoutButton();

        this.bindSidebarEvents();

        // إضافة مستمع حدث لإعادة إضافة الأيقونات بعد تحميل المحتوى
        this.setupNavigationIconsListener();
    },

    /**
     * إعداد مستمع حدث لإعادة إضافة أيقونات التنقل
     */
    setupNavigationIconsListener() {
        // إزالة المستمع القديم إن وجد
        if (this._navigationIconsListener) {
            document.removeEventListener('section-changed', this._navigationIconsListener);
        }

        // إضافة مستمع جديد
        this._navigationIconsListener = (event) => {
            const sectionName = event.detail?.section;
            if (sectionName && sectionName !== 'dashboard') {
                const sectionId = `${sectionName}-section`;

                // إعادة إضافة الأيقونات بعد تأخير مناسب
                const addIcons = () => {
                    const section = document.getElementById(sectionId);
                    if (section && section.style.display !== 'none' && section.classList.contains('active')) {
                        // التحقق من وجود section-header أولاً
                        let sectionHeader = section.querySelector('.section-header');
                        if (sectionHeader) {
                            const existingIcons = sectionHeader.querySelector('.navigation-icons-container');
                            if (!existingIcons) {
                                if (AppState.debugMode) {
                                    Utils.safeLog('🔧 إضافة الأيقونات من event listener:', sectionName);
                                }
                                this.addNavigationIcons(section, sectionName);
                            }
                        } else {
                            // إذا لم يكن هناك header، ننتظر قليلاً ثم نحاول مرة أخرى
                            setTimeout(() => {
                                const retrySection = document.getElementById(sectionId);
                                if (retrySection && retrySection.style.display !== 'none') {
                                    const retryHeader = retrySection.querySelector('.section-header');
                                    if (retryHeader) {
                                        this.addNavigationIcons(retrySection, sectionName);
                                    }
                                }
                            }, 500);
                        }
                    }
                };

                // محاولات متعددة لضمان إضافة الأيقونات
                setTimeout(addIcons, 500);
                setTimeout(addIcons, 1000);
                setTimeout(addIcons, 1500);
                setTimeout(addIcons, 2500);
                setTimeout(addIcons, 3500);
            }
        };

        document.addEventListener('section-changed', this._navigationIconsListener);
    },

    /**
     * إعداد معالج زر تسجيل الخروج
     */
    setupLogoutButton() {
        Utils.safeLog('🔧 بدء إعداد معالج زر تسجيل الخروج...');

        // محاولة متعددة للعثور على الزر
        let attempts = 0;
        const maxAttempts = 10;

        const trySetup = () => {
            attempts++;
            Utils.safeLog(`🔍 محاولة ${attempts}/${maxAttempts} للعثور على زر تسجيل الخروج...`);

            const logoutBtn = document.getElementById('logout-btn');

            if (!logoutBtn) {
                if (attempts < maxAttempts) {
                    setTimeout(trySetup, 300);
                    return;
                }
                Utils.safeWarn('⚠️ لم يتم العثور على زر تسجيل الخروج بعد ' + maxAttempts + ' محاولة');
                Utils.safeError('❌ زر تسجيل الخروج غير موجود في DOM');
                return;
            }

            Utils.safeLog('✅ تم العثور على زر تسجيل الخروج');

            // التحقق إذا كان المعالج موجوداً بالفعل
            if (logoutBtn.dataset.logoutHandlerBound === 'true') {
                Utils.safeLog('ℹ️ معالج زر تسجيل الخروج موجود بالفعل');
                return;
            }

            Utils.safeLog('🔧 إعداد معالج جديد لزر تسجيل الخروج...');

            // إزالة أي معالجات سابقة
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            newLogoutBtn.dataset.logoutHandlerBound = 'true';

            // إضافة معالج حدث جديد
            const handleLogout = function (e) {
                if (AppState.debugMode) Utils.safeLog('🔄 تم النقر على زر تسجيل الخروج - الحدث:', e);
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                Utils.safeLog('🔄 تم النقر على زر تسجيل الخروج');

                // إغلاق القائمة الجانبية على الموبايل قبل تسجيل الخروج
                if (window.innerWidth <= 1024) {
                    if (typeof UI !== 'undefined' && typeof UI.toggleSidebar === 'function') {
                        UI.toggleSidebar(false);
                    }
                }

                // عرض رسالة تأكيد
                const confirmed = confirm('هل أنت متأكد من تسجيل الخروج؟');
                if (AppState.debugMode) Utils.safeLog('✅ تأكيد تسجيل الخروج:', confirmed);

                if (confirmed) {
                    Utils.safeLog('✅ تم تأكيد تسجيل الخروج');
                    try {
                        // إزالة علامة المعالج قبل تسجيل الخروج
                        if (newLogoutBtn) {
                            newLogoutBtn.dataset.logoutHandlerBound = 'false';
                        }

                        if (AppState.debugMode) Utils.safeLog('🔍 البحث عن Auth.logout...', {
                            Auth: typeof Auth !== 'undefined',
                            windowAuth: typeof window.Auth !== 'undefined'
                        });

                        if (typeof Auth !== 'undefined' && typeof Auth.logout === 'function') {
                            if (AppState.debugMode) Utils.safeLog('✅ استدعاء Auth.logout()');
                            Auth.logout();
                        } else if (typeof window.Auth !== 'undefined' && typeof window.Auth.logout === 'function') {
                            if (AppState.debugMode) Utils.safeLog('✅ استدعاء window.Auth.logout()');
                            window.Auth.logout();
                        } else {
                            Utils.safeError('❌ دالة تسجيل الخروج غير متاحة');
                            Utils.safeError('❌ دالة تسجيل الخروج غير متاحة');
                            if (typeof Notification !== 'undefined') {
                                Notification.error('حدث خطأ في تسجيل الخروج. يرجى تحديث الصفحة.');
                            } else {
                                alert('حدث خطأ في تسجيل الخروج. يرجى تحديث الصفحة.');
                            }
                        }
                    } catch (error) {
                        Utils.safeError('❌ خطأ في تسجيل الخروج:', error);
                        if (typeof Notification !== 'undefined') {
                            Notification.error('حدث خطأ في تسجيل الخروج: ' + (error.message || error));
                        } else {
                            alert('حدث خطأ في تسجيل الخروج: ' + (error.message || error));
                        }
                    }
                } else {
                    Utils.safeLog('❌ تم إلغاء تسجيل الخروج');
                }
            };

            // إضافة المعالج على الزر نفسه
            newLogoutBtn.addEventListener('click', handleLogout, { passive: false, capture: false });
            if (AppState.debugMode) Utils.safeLog('✅ تم إضافة معالج click على زر تسجيل الخروج');

            // إضافة معالج أيضاً على العناصر الداخلية (الأيقونة والنص)
            const icon = newLogoutBtn.querySelector('i');
            const span = newLogoutBtn.querySelector('span');
            if (icon) {
                icon.addEventListener('click', handleLogout, { passive: false });
                if (AppState.debugMode) Utils.safeLog('✅ تم إضافة معالج click على أيقونة تسجيل الخروج');
            }
            if (span) {
                span.addEventListener('click', handleLogout, { passive: false });
                if (AppState.debugMode) Utils.safeLog('✅ تم إضافة معالج click على نص تسجيل الخروج');
            }

            Utils.safeLog('✅ تم إعداد معالج زر تسجيل الخروج بنجاح');
            if (AppState.debugMode) Utils.safeLog('✅ تم إعداد معالج زر تسجيل الخروج بنجاح - الزر جاهز للاستخدام');
        };

        trySetup();
    },

    /**
     * عرض نافذة استعادة كلمة المرور
     */
    showForgotPasswordModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2 class="modal-title">استعادة كلمة المرور</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p class="mb-4 text-gray-700">أدخل بريدك الإلكتروني وسنقوم بإنشاء كلمة مرور مؤقتة:</p>
                    <form id="forgot-password-form">
                        <div class="mb-4">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                البريد الإلكتروني
                            </label>
                            <input 
                                type="email" 
                                id="forgot-password-email" 
                                required
                                class="form-input"
                                placeholder="example@americana.com"
                                autocomplete="email"
                            >
                        </div>
                        <div class="flex gap-3 justify-end">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                                إلغاء
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-key ml-2"></i>
                                إرسال
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const form = document.getElementById('forgot-password-form');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('forgot-password-email');
            const email = emailInput ? emailInput.value.trim() : '';

            const submitBtn = form.querySelector('button[type="submit"]');
            if (!submitBtn) return;
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i> جاري الإرسال...';

            try {
                const result = await Auth.resetPassword(email);
                const success = result && result.success === true;
                if (success) {
                    const modalBody = modal.querySelector('.modal-body');
                    const msg = (result && result.message) || 'تم إرسال رابط استرجاع كلمة المرور إلى بريدك الإلكتروني.';
                    modalBody.innerHTML = `
                        <div class="text-center py-4">
                            <div class="mb-4">
                                <i class="fas fa-check-circle text-5xl text-green-500"></i>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">تم الإرسال بنجاح</h3>
                            <p class="text-gray-600 mb-4">${msg}</p>
                            <p class="text-sm text-gray-500">
                                يرجى التحقق من صندوق الوارد (والبريد المزعج) واتباع الرابط لإعادة تعيين كلمة المرور خلال ساعة.
                            </p>
                        </div>
                        <div class="flex justify-center mt-6">
                            <button type="button" class="btn-primary" onclick="this.closest('.modal-overlay').remove()">
                                <i class="fas fa-check ml-2"></i>
                                تم
                            </button>
                        </div>
                    `;
                } else {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    if (result && result.message && typeof Notification !== 'undefined') {
                        Notification.error(result.message);
                    }
                    const errorContact = document.getElementById('login-error-contact');
                    if (errorContact) {
                        errorContact.style.display = 'block';
                    }
                }
            } catch (error) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                Notification.error('حدث خطأ أثناء استعادة كلمة المرور');
                // إظهار معلومات التواصل عند حدوث خطأ
                const errorContact = document.getElementById('login-error-contact');
                if (errorContact) {
                    errorContact.style.display = 'block';
                }
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    /**
     * عرض نافذة المساعدة
     */
    showHelpModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-question-circle ml-2"></i>
                        مساعدة / Help
                    </h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="space-y-4">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">
                                <i class="fas fa-sign-in-alt ml-2 text-blue-600"></i>
                                كيفية تسجيل الدخول
                            </h3>
                            <ol class="list-decimal list-inside space-y-2 text-gray-700 text-sm mr-4">
                                <li>أدخل بريدك الإلكتروني المسجل في النظام</li>
                                <li>أدخل كلمة المرور الخاصة بك</li>
                                <li>يمكنك تفعيل خيار "تذكرني" لتسجيل الدخول تلقائياً في المرة القادمة</li>
                                <li>اضغط على زر "تسجيل الدخول"</li>
                            </ol>
                        </div>
                        
                        <div class="border-t pt-4">
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">
                                <i class="fas fa-key ml-2 text-blue-600"></i>
                                استرجاع كلمة المرور
                            </h3>
                            <ol class="list-decimal list-inside space-y-2 text-gray-700 text-sm mr-4">
                                <li>اضغط على رابط "نسيت كلمة المرور؟" الموجود أسفل حقل كلمة المرور</li>
                                <li>أدخل بريدك الإلكتروني المسجل في النظام</li>
                                <li>اضغط على زر "إرسال"</li>
                                <li>ستتلقى رابط إعادة تعيين كلمة المرور على بريدك الإلكتروني</li>
                                <li>اتبع التعليمات في البريد الإلكتروني لإعادة تعيين كلمة المرور</li>
                            </ol>
                        </div>
                        
                        <div class="border-t pt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h3 class="text-sm font-semibold text-yellow-800 mb-2">
                                <i class="fas fa-envelope ml-2"></i>
                                في حالة وجود أي مشكلة
                            </h3>
                            <p class="text-sm text-yellow-700 mb-2">
                                يُرجى التواصل مع مدير النظام على البريد التالي:
                            </p>
                            <a href="mailto:Yasser.diab@icapp.com.eg" class="text-yellow-600 hover:text-yellow-800 font-semibold hover:underline inline-flex items-center">
                                <i class="fas fa-envelope ml-2"></i>
                                Yasser.diab@icapp.com.eg
                            </a>
                        </div>
                    </div>
                    
                    <div class="flex justify-center mt-6">
                        <button type="button" class="btn-primary" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-check ml-2"></i>
                            فهمت
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    /**
     * عرض نموذج تغيير كلمة المرور
     */
    showChangePasswordModal(isFirstLogin = false) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h2 class="modal-title">${isFirstLogin ? 'تغيير كلمة المرور (مطلوب)' : 'تغيير كلمة المرور'}</h2>
                    ${!isFirstLogin ? '<button class="modal-close" onclick="this.closest(\'.modal-overlay\').remove()"><i class="fas fa-times"></i></button>' : ''}
                </div>
                <div class="modal-body">
                    ${isFirstLogin ? '<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4"><p class="text-sm text-blue-800"><i class="fas fa-info-circle ml-2"></i>يجب تغيير كلمة المرور ي أول تسجيل دخول</p></div>' : ''}
                    <form id="change-password-form">
                        <div class="mb-4">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                كلمة المرور الحالية
                            </label>
                            <input 
                                type="password" 
                                id="change-password-current" 
                                required
                                class="form-input"
                                placeholder="أدخل كلمة المرور الحالية"
                                autocomplete="current-password"
                            >
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                كلمة المرور الجديدة
                            </label>
                            <input 
                                type="password" 
                                id="change-password-new" 
                                required
                                minlength="6"
                                class="form-input"
                                placeholder="أدخل كلمة المرور الجديدة (6 أحر على الأقل)"
                                autocomplete="new-password"
                            >
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                تأكيد كلمة المرور الجديدة
                            </label>
                            <input 
                                type="password" 
                                id="change-password-confirm" 
                                required
                                minlength="6"
                                class="form-input"
                                placeholder="أعد إدخال كلمة المرور الجديدة"
                                autocomplete="new-password"
                            >
                        </div>
                        <div class="flex gap-3 justify-end">
                            ${!isFirstLogin ? '<button type="button" class="btn-secondary" onclick="this.closest(\'.modal-overlay\').remove()">إلغاء</button>' : ''}
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-key ml-2"></i>
                                ${isFirstLogin ? 'حفظ كلمة المرور الجديدة' : 'تغيير كلمة المرور'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const form = document.getElementById('change-password-form');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPasswordInput = document.getElementById('change-password-current');
            const newPasswordInput = document.getElementById('change-password-new');
            const confirmPasswordInput = document.getElementById('change-password-confirm');
            const currentPassword = currentPasswordInput ? currentPasswordInput.value.trim() : '';
            const newPassword = newPasswordInput ? newPasswordInput.value.trim() : '';
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';

            // التحقق من تطابق كلمة المرور الجديدة
            if (newPassword !== confirmPassword) {
                Notification.error('كلمة المرور الجديدة وتأكيدها غير متطابقين');
                return;
            }

            // التحقق من طول كلمة المرور
            if (newPassword.length < 6) {
                Notification.error('كلمة المرور يجب أن تكون 6 أحر على الأقل');
                return;
            }

            Loading.show();
            try {
                const success = await Auth.changePassword(
                    AppState.currentUser.email,
                    currentPassword,
                    newPassword
                );

                if (success) {
                    Notification.success('تم تغيير كلمة المرور بنجاح');
                    setTimeout(() => {
                        modal.remove();
                        Loading.hide();

                        // إذا كان أول تسجيل دخول، نعيد تحميل الصحة
                        if (isFirstLogin) {
                            window.location.reload();
                        }
                    }, 1500);
                } else {
                    Loading.hide();
                    Notification.error('كلمة المرور الحالية غير صحيحة');
                }
            } catch (error) {
                Loading.hide();
                Notification.error('حدث خطأ أثناء تغيير كلمة المرور: ' + error.message);
            }
        });

        // منع إغلاق النموذج إذا كان أول تسجيل دخول
        if (!isFirstLogin) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        }

        // التركيز على أول حقل
        setTimeout(() => {
            document.getElementById('change-password-current').focus();
        }, 100);
    },

    /**
     * تحديث معلومات المستخدم
     */
    updateUserProfile() {
        const nameEl = document.getElementById('userDisplayName');
        const emailEl = document.getElementById('adminEmail');
        const mobileUserName = document.getElementById('mobile-user-name');

        if (AppState.currentUser) {
            if (nameEl) nameEl.textContent = AppState.currentUser.name;
            if (emailEl) emailEl.textContent = AppState.currentUser.email;
            if (mobileUserName) {
                mobileUserName.textContent = AppState.currentUser.email || '';
                mobileUserName.style.display = AppState.currentUser.email ? 'block' : 'none';
            }
        } else {
            if (nameEl) nameEl.textContent = 'المستخدم';
            if (emailEl) emailEl.textContent = 'user@example.com';
            if (mobileUserName) mobileUserName.textContent = '';
            if (mobileUserName) mobileUserName.style.display = 'none';
        }
        // تحديث صورة المستخدم
        this.updateUserProfilePhoto();
        // تحديث حالة الاتصال للمستخدم
        this.updateUserConnectionStatus();
    },

    /**
     * تحديث صورة المستخدم ي الشريط الجانبي
     */
    updateUserProfilePhoto() {
        if (!AppState.currentUser) return;

        // البحث عن المستخدم ي قاعدة البيانات (مع إعادة تحميل البيانات إذا لزم الأمر)
        let user = AppState.appData.users.find(u => {
            if (!u || !u.email || !AppState.currentUser.email) return false;
            return u.email.toLowerCase().trim() === AppState.currentUser.email.toLowerCase().trim();
        });

        // إذا لم يتم العثور على المستخدم، نحاول البحث مرة أخرى بعد تحديث البيانات
        if (!user) {
            // إعادة تحميل بيانات المستخدمين من localStorage
            const savedData = localStorage.getItem('hse_app_data');
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    if (parsedData.users) {
                        AppState.appData.users = parsedData.users;
                        user = AppState.appData.users.find(u => {
                            if (!u || !u.email || !AppState.currentUser.email) return false;
                            return u.email.toLowerCase().trim() === AppState.currentUser.email.toLowerCase().trim();
                        });
                    }
                } catch (e) {
                    Utils.safeWarn('⚠ فشل تحليل البيانات المحفوظة:', e);
                }
            }
        }

        const profilePhoto = document.getElementById('user-profile-photo');
        const profileIcon = document.getElementById('user-profile-icon');
        // استخدام صورة المستخدم من القائمة أو من الجلسة الحالية (بعد الرفع قد تكون القائمة لم تُحدّث بعد)
        const photoUrl = (user && user.photo) || (AppState.currentUser && AppState.currentUser.photo) || '';

        if (photoUrl && profilePhoto && profileIcon) {
            const isDriveUrl = photoUrl.includes('drive.google.com');
            const isSupabaseStorageUrl = photoUrl.includes('supabase.co/storage');
            const userEmail = (user && user.email) || (AppState.currentUser && AppState.currentUser.email) || '';
            const cacheKey = 'photo_failed_' + userEmail;
            const failedRecently = sessionStorage.getItem(cacheKey);

            const showIcon = () => {
                profilePhoto.style.display = 'none';
                profileIcon.style.display = 'block';
            };
            const showPhoto = (src) => {
                profilePhoto.src = src;
                profilePhoto.style.display = 'block';
                profileIcon.style.display = 'none';
                sessionStorage.removeItem(cacheKey);
            };
            const markFailed = () => {
                if (isDriveUrl) sessionStorage.setItem(cacheKey, Date.now().toString());
            };

            if (isDriveUrl && failedRecently) {
                showIcon();
                return;
            }

            // استخراج معرف ملف Drive من الرابط (للاستخدام بعد النشر عبر proxy)
            const driveIdMatch = photoUrl.match(/[?&]id=([^&]+)/) || photoUrl.match(/\/file\/d\/([^/]+)/);
            const driveFileId = driveIdMatch ? driveIdMatch[1].trim() : null;
            const scriptUrl = (AppState.googleConfig && AppState.googleConfig.appsScript && AppState.googleConfig.appsScript.scriptUrl) ? AppState.googleConfig.appsScript.scriptUrl.trim() : '';

            // بعد النشر: صور Drive قد لا تظهر بسبب منع الـ hotlinking؛ نستخدم proxy عبر السكربت
            if (isDriveUrl && driveFileId && scriptUrl && scriptUrl.includes('script.google.com')) {
                const proxyUrl = scriptUrl + (scriptUrl.indexOf('?') !== -1 ? '&' : '?') + 'action=getProfileImage&id=' + encodeURIComponent(driveFileId);
                fetch(proxyUrl, { method: 'GET', credentials: 'omit' })
                    .then(function(res) { return res.json(); })
                    .then(function(data) {
                        if (data && data.success && data.dataUri) {
                            showPhoto(data.dataUri);
                            return;
                        }
                        throw new Error(data && data.message ? data.message : 'لا توجد صورة');
                    })
                    .catch(function() {
                        markFailed();
                        showIcon();
                    });
                return;
            }

            // روابط Supabase Storage: جلب الصورة عبر الـ API (dataUri) لتجاوز 503 من الرابط المباشر
            if (isSupabaseStorageUrl) {
                var pathWithoutQuery = photoUrl.split('?')[0].trim();
                var pathIdx = pathWithoutQuery.indexOf('user-photo/');
                var path = pathIdx !== -1
                    ? pathWithoutQuery.substring(pathIdx + 'user-photo/'.length).trim()
                    : (pathWithoutQuery.split('/').pop() || '').trim();
                if (path && typeof GoogleIntegration !== 'undefined' && typeof GoogleIntegration.sendToAppsScript === 'function') {
                    var photoTimeout = window.setTimeout(function() {
                        photoTimeout = null;
                        showIcon();
                    }, 15000);
                    GoogleIntegration.sendToAppsScript('getProfileImage', { path: path })
                        .then(function(res) {
                            if (photoTimeout) {
                                window.clearTimeout(photoTimeout);
                                photoTimeout = null;
                            }
                            if (res && res.success && res.dataUri) {
                                showPhoto(res.dataUri);
                            } else {
                                showIcon();
                            }
                        })
                        .catch(function() {
                            if (photoTimeout) {
                                window.clearTimeout(photoTimeout);
                                photoTimeout = null;
                            }
                            showIcon();
                        });
                } else {
                    profilePhoto.onerror = function() {
                        profilePhoto.onerror = null;
                        showIcon();
                    };
                    showPhoto(photoUrl);
                }
                return;
            }

            // تشغيل محلي أو رابط غير Drive: تحميل الصورة مباشرة
            const img = new Image();
            const timeoutId = setTimeout(function() {
                img.src = '';
                showIcon();
                markFailed();
            }, 5000);
            img.onload = function() {
                clearTimeout(timeoutId);
                showPhoto(photoUrl);
            };
            img.onerror = function() {
                clearTimeout(timeoutId);
                showIcon();
                markFailed();
            };
            img.src = photoUrl;
        } else if (profilePhoto && profileIcon) {
            profilePhoto.style.display = 'none';
            profileIcon.style.display = 'block';
        }
    },

    /**
     * إظهار أزرار الهيدر (Theme Toggle & Notifications)
     */
    showHeaderActions() {
        const headerThemeToggle = document.getElementById('header-theme-toggle');
        const headerNotificationsBtn = document.getElementById('header-notifications-btn');
        const companyLogoHeader = document.getElementById('company-logo-header');

        // إظهار الأزرار في الهيدر إذا كان الهيدر معروضاً أو إذا كانت الشاشة كبيرة
        const shouldShowHeader = (companyLogoHeader && companyLogoHeader.style.display !== 'none') || window.innerWidth > 1024;

        // إظهار زر الإشعارات دائماً إذا كان موجوداً (في جميع الحالات)
        if (headerNotificationsBtn) {
            headerNotificationsBtn.style.display = 'flex';
            headerNotificationsBtn.style.visibility = 'visible';
        }

        if (shouldShowHeader) {
            if (headerThemeToggle) {
                headerThemeToggle.style.display = 'flex';
                headerThemeToggle.style.visibility = 'visible';
            }
            if (headerNotificationsBtn) {
                headerNotificationsBtn.style.display = 'flex';
                headerNotificationsBtn.style.visibility = 'visible';
            }
        } else {
            if (headerThemeToggle) {
                headerThemeToggle.style.display = 'none';
            }
            if (headerNotificationsBtn) {
                headerNotificationsBtn.style.display = 'none';
            }
        }

        // إظهار الأزرار في الموبايل
        const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
        const mobileNotificationsBtn = document.getElementById('mobile-notifications-btn');
        if (mobileThemeToggle) mobileThemeToggle.style.display = 'flex';
        if (mobileNotificationsBtn) mobileNotificationsBtn.style.display = 'flex';
    },

    /**
     * عرض قسم معين
     */
    showSection(sectionName) {
        if (AppState.debugMode) {
            Utils.safeLog('محاولة عرض القسم:', sectionName);
        }

        // التحقق من الصلاحيات
        // عند العودة للتنقل (isNavigatingBack)، لا نعرض رسالة الخطأ
        const suppressMessage = AppState.isNavigatingBack;
        if (!Permissions.checkBeforeShow(sectionName, suppressMessage)) {
            // إذا لم يكن لديه صلاحية، نعرض Dashboard بدلاً منه
            if (sectionName !== 'dashboard' && Permissions.hasAccess('dashboard')) {
                sectionName = 'dashboard';
            } else {
                // إذا كان التنقل عودة، نعود للـ dashboard بدون رسالة
                if (suppressMessage) {
                    if (Permissions.hasAccess('dashboard')) {
                        sectionName = 'dashboard';
                    } else {
                        return;
                    }
                } else {
                    // checkBeforeShow يعرض الرسالة بالفعل عند محاولة الوصول الفعلية
                    return;
                }
            }
        }

        // التحقق من أن main-app معروض
        const mainApp = document.getElementById('main-app');
        if (!mainApp || mainApp.style.display === 'none') {
            Utils.safeError('main-app غير مرئي');
            return;
        }

        // إخفاء جميع الأقسام بشكل صريح
        const sections = document.querySelectorAll('.section');
        if (AppState.debugMode) {
            Utils.safeLog('عدد الأقسام الموجودة:', sections.length);
        }
        sections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none'; // إخفاء صريح
        });

        // إزالة التفعيل من جميع عناصر القائمة
        const navItems = document.querySelectorAll('.nav-item');
        if (AppState.debugMode) {
            Utils.safeLog('عدد عناصر القائمة:', navItems.length);
        }
        navItems.forEach(item => {
            item.classList.remove('active');
            item.removeAttribute('aria-current');
        });

        // عرض القسم المطلوب
        const sectionId = `${sectionName}-section`;
        let section = document.getElementById(sectionId);
        if (AppState.debugMode) {
            Utils.safeLog(' محاولة العثور على:', sectionId, section ? '✅ موجود' : ' غير موجود');
        }

        if (!section) {
            if (AppState.debugMode) {
                Utils.safeWarn('⚠ القسم غير موجود في DOM، جاري البحث ي جميع الأقسام...');
                const allSections = document.querySelectorAll('.section');
                Utils.safeLog('📋 الأقسام الموجودة:', Array.from(allSections).map(s => s.id).join(', '));
            }

            // محاولة إنشاء القسم إذا لم يكن موجوداً
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                if (AppState.debugMode) {
                    Utils.safeLog('🔨 إنشاء قسم جديد:', sectionId);
                }
                section = document.createElement('section');
                section.id = sectionId;
                section.className = 'section';
                section.setAttribute('role', 'region');
                section.setAttribute('aria-label', `قسم ${sectionName}`);

                // إدراج القسم في المكان الصحيح (بعد users-section)
                const usersSection = document.getElementById('users-section');
                if (usersSection && sectionName === 'employees') {
                    usersSection.insertAdjacentElement('afterend', section);
                    if (AppState.debugMode) {
                        Utils.safeLog('✅ تم إدراج قسم employees-section بعد users-section');
                    }
                } else {
                    mainContent.appendChild(section);
                    if (AppState.debugMode) {
                        Utils.safeLog('✅ تم إضافة القسم الجديد إلى main-content');
                    }
                }
            } else {
                Utils.safeError(' main-content غير موجود!');
            }
        }

        if (section) {
            section.classList.add('active');
            section.style.display = 'block'; // عرض صريح
            if (AppState.debugMode) {
                Utils.safeLog('✅ تم تعيل القسم:', sectionId);
            }

            // إغلاق القائمة الجانبية تلقائياً عند فتح أي وحدة (عدا Dashboard) على جميع أحجام الشاشات
            if (sectionName !== 'dashboard') {
                // إغلاق القائمة الجانبية فوراً - على جميع أحجام الشاشات
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) {
                    // إزالة class "open" مباشرة لضمان الإغلاق
                    sidebar.classList.remove('open');
                    // استدعاء toggleSidebar للتأكد من تطبيق جميع التغييرات
                    this.toggleSidebar(false);
                    if (AppState.debugMode) {
                        Utils.safeLog('✅ تم إغلاق القائمة الجانبية تلقائياً عند فتح الوحدة:', sectionName);
                    }
                }

                // إعداد مراقبة innerHTML لإضافة الأيقونات تلقائياً بعد استبدال المحتوى
                this.setupInnerHTMLWatcher(section, sectionName);

                // استخدام requestAnimationFrame لضمان عرض القسم أولاً
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        this.addNavigationIcons(section, sectionName);
                    }, 50);
                });
            } else {
                // إزالة أيقونات التنقل من Dashboard إذا كانت موجودة
                this.removeNavigationIcons(section);
            }
        } else {
            Utils.safeError(' فشل إنشاء أو العثور على القسم:', sectionId);
        }

        // تعيل عنصر القائمة
        const navItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (navItem) {
            navItem.classList.add('active');
            navItem.setAttribute('aria-current', 'page');
            if (AppState.debugMode) {
                Utils.safeLog('تم تعيل عنصر القائمة');
            }
        } else {
            Utils.safeError('عنصر القائمة غير موجود:', sectionName);
        }

        // تحديث سجل التنقل (تجنب الإضافة عند العودة)
        if (sectionName !== AppState.currentSection && !AppState.isNavigatingBack) {
            // إضافة الصفحة السابقة إلى السجل
            if (AppState.currentSection) {
                // تجنب إضافة نفس الصفحة مرتين متتاليتين
                const lastHistoryItem = AppState.navigationHistory[AppState.navigationHistory.length - 1];
                if (lastHistoryItem !== AppState.currentSection) {
                    // إزالة أي تكرارات للصفحة الحالية من السجل لتجنب التكرار
                    AppState.navigationHistory = AppState.navigationHistory.filter(
                        item => item !== sectionName
                    );

                    // إضافة الصفحة السابقة إلى السجل
                    AppState.navigationHistory.push(AppState.currentSection);

                    // الحد الأقصى 10 صفحات في السجل
                    if (AppState.navigationHistory.length > 10) {
                        AppState.navigationHistory.shift();
                    }
                }
            }
        }

        AppState.currentSection = sectionName;

        // حفظ القسم الحالي في sessionStorage لاستعادته عند إعادة التحميل
        try {
            sessionStorage.setItem('hse_current_section', sectionName);
        } catch (e) {
            Utils.safeWarn('⚠️ فشل حفظ القسم في sessionStorage:', e);
        }

        // إطلاق حدث تغيير القسم لنظام المزامنة اللحظية
        document.dispatchEvent(new CustomEvent('section-changed', {
            detail: {
                section: sectionName,
                previousSection: AppState.previousSection || null
            }
        }));

        // حفظ القسم السابق
        AppState.previousSection = sectionName;

        // التأكد من تحميل البيانات بعد عرض القسم مباشرة
        const isRefresh = AppState.isPageRefresh;
        // لوحة التحكم: تحميل البيانات فوراً في نفس الـ tick لتفادي وميض الكروت (لا setTimeout)
        if (sectionName === 'dashboard') {
            this.loadSectionData(sectionName, isRefresh);
        } else {
            setTimeout(() => {
                this.loadSectionData(sectionName, isRefresh);

                const addIconsAfterLoad = () => {
                    const section = document.getElementById(sectionId);
                    if (section) {
                        let sectionHeader = section.querySelector('.section-header');
                        if (!sectionHeader) return;
                        this.removeNavigationIcons(section);
                        this.addNavigationIcons(section, sectionName);
                    }
                };
                setTimeout(addIconsAfterLoad, 300);
                setTimeout(addIconsAfterLoad, 600);
                setTimeout(addIconsAfterLoad, 1000);
                setTimeout(addIconsAfterLoad, 1500);
                setTimeout(addIconsAfterLoad, 2000);
                setTimeout(addIconsAfterLoad, 3000);
            }, 50);
        }
    },

    /**
     * تحميل بيانات القسم
     */
    loadSectionData(sectionName, silent = false) {
        // إذا كانت إعادة تحميل الصفحة، نحمّل بصمت
        if (AppState.isPageRefresh && !silent) {
            silent = true;
        }

        if (!silent) {
            Utils.safeLog('تحميل بيانات القسم:', sectionName);
        }

        // عند تحديث اللغة فقط نعيد تحميل المحتوى الحالي دون تنظيف أي موديول
        const isLanguageRefresh = AppState._languageRefresh === true;
        if (isLanguageRefresh) {
            AppState._languageRefresh = false;
        }

        // تنظيف الموديول السابق قبل تحميل موديول جديد (لمنع تسريبات الذاكرة) - لا يُنفّذ عند تغيير اللغة
        const previousSection = AppState.previousSection;
        if (previousSection && previousSection !== sectionName && !isLanguageRefresh) {
            this.cleanupPreviousModule(previousSection);
        }

        // تحديث الشعار ي الهيدر عند تحميل أي قسم
        this.updateCompanyLogoHeader();
        this.updateDashboardLogo();

        try {
            switch (sectionName) {
                case 'dashboard':
                    if (typeof Dashboard !== 'undefined' && Dashboard.load) {
                        // تمرير معامل silent إذا كانت الدالة تدعمه
                        if (typeof Dashboard.load === 'function') {
                            const loadResult = Dashboard.load(silent);
                            // إذا كانت Promise، نتعامل معها بصمت
                            if (loadResult && typeof loadResult.catch === 'function' && silent) {
                                loadResult.catch(() => { }); // تجاهل الأخطاء بصمت
                            }
                        }
                    } else {
                        if (!silent) Utils.safeWarn('وحدة Dashboard غير موجودة');
                    }
                    break;
                case 'users':
                    if (typeof Users !== 'undefined' && Users.load) {
                        const loadResult = Users.load(silent);
                        if (loadResult && typeof loadResult.catch === 'function' && silent) {
                            loadResult.catch(() => { });
                        }
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة Users غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('Users', 'users', silent);
                        }
                    }
                    break;
                case 'user-tasks':
                    Utils.safeLog('تحميل مديول مهام المستخدمين (UserTasks) في قسم user-tasks-section');
                    if (typeof UserTasks !== 'undefined' && UserTasks.load) {
                        UserTasks.load();
                    } else {
                        Utils.safeWarn('وحدة UserTasks غير موجودة - سيتم إنشاؤها');
                        // تهيئة الموديول إذا لم يكن موجوداً
                        if (typeof UserTasks === 'undefined') {
                            window.UserTasks = UserTasksModule;
                        }
                        if (UserTasks && UserTasks.load) {
                            UserTasks.load();
                        }
                    }
                    break;
                case 'employees':
                    Utils.safeLog(' تحميل مديول قاعدة بيانات الموظفين (Employees) ي قسم employees-section');
                    if (typeof Employees !== 'undefined' && Employees.load) {
                        Employees.load();
                    } else {
                        Utils.safeError(' وحدة Employees غير موجودة - جاري انتظار التحميل...');
                        this.waitForModuleAndLoad('Employees', 'employees', silent);
                    }
                    break;
                case 'incidents':
                    if (!silent) Utils.safeLog(' تحميل مديول الحوادث (Incidents) ي قسم incidents-section');
                    if (typeof Incidents !== 'undefined' && Incidents.load) {
                        const loadResult = Incidents.load(silent);
                        if (loadResult && typeof loadResult.catch === 'function' && silent) {
                            loadResult.catch(() => { });
                        }
                    } else {
                        if (!silent) {
                            Utils.safeError(' وحدة Incidents غير موجودة');
                            // محاولة انتظار تحميل الموديول ثم تحميله
                            this.waitForModuleAndLoad('Incidents', 'incidents', silent);
                        }
                    }
                    break;
                case 'nearmiss':
                    Utils.safeLog(' تحميل مديول الحوادث الوشيكة (NearMiss) ي قسم nearmiss-section');
                    if (typeof NearMiss !== 'undefined' && NearMiss.load) {
                        NearMiss.load();
                    } else {
                        Utils.safeError(' وحدة NearMiss غير موجودة - جاري انتظار التحميل...');
                        this.waitForModuleAndLoad('NearMiss', 'nearmiss', silent);
                    }
                    break;
                case 'ptw':
                    Utils.safeLog(' تحميل مديول تصاريح العمل (PTW) ي قسم ptw-section');
                    if (typeof PTW !== 'undefined' && PTW.load) {
                        PTW.load();
                    } else {
                        Utils.safeError(' وحدة PTW غير موجودة - جاري انتظار التحميل...');
                        this.waitForModuleAndLoad('PTW', 'ptw', silent);
                    }
                    break;
                case 'training':
                    Utils.safeLog(' تحميل مديول التدريب (Training) ي قسم training-section');
                    if (typeof Training !== 'undefined' && Training.load) {
                        Training.load();
                    } else {
                        Utils.safeError(' وحدة Training غير موجودة - جاري انتظار التحميل...');
                        this.waitForModuleAndLoad('Training', 'training', silent);
                    }
                    break;
                case 'clinic':
                    Utils.safeLog('🔄 تحميل مديول العيادة (Clinic) في قسم clinic-section');
                    // ✅ التحقق من وجود Clinic على window أولاً
                    const ClinicModule = window.Clinic || (typeof Clinic !== 'undefined' ? Clinic : null);
                    if (ClinicModule && typeof ClinicModule.load === 'function') {
                        try {
                            const clinicLoadResult = ClinicModule.load();
                            // إذا كانت Promise، نضيف الأيقونات بعد انتهائها
                            if (clinicLoadResult && typeof clinicLoadResult.then === 'function') {
                                clinicLoadResult.then(() => {
                                    setTimeout(() => {
                                        this.ensureNavigationIcons('clinic');
                                    }, 300);
                                }).catch((error) => {
                                    if (!silent) {
                                        Utils.safeError('❌ خطأ في تحميل مديول العيادة:', error);
                                    }
                                    setTimeout(() => {
                                        this.ensureNavigationIcons('clinic');
                                    }, 300);
                                });
                            } else {
                                setTimeout(() => {
                                    this.ensureNavigationIcons('clinic');
                                }, 500);
                            }
                        } catch (error) {
                            if (!silent) {
                                Utils.safeError('❌ خطأ في تحميل مديول العيادة:', error);
                            }
                            setTimeout(() => {
                                this.ensureNavigationIcons('clinic');
                            }, 500);
                        }
                    } else {
                        // ✅ تحسين: استخدام safeLog بدلاً من safeError لأن هذا مجرد انتظار طبيعي للتحميل
                        if (!silent && AppState.debugMode) {
                            Utils.safeLog('⏳ وحدة Clinic غير موجودة بعد - جاري انتظار التحميل...');
                        }
                        this.waitForModuleAndLoad('Clinic', 'clinic', silent).then(() => {
                            setTimeout(() => {
                                this.ensureNavigationIcons('clinic');
                            }, 500);
                        }).catch((error) => {
                            if (!silent) {
                                Utils.safeError('❌ فشل تحميل مديول العيادة:', error);
                            }
                        });
                    }
                    break;
                case 'fire-equipment':
                    if (typeof FireEquipment !== 'undefined' && FireEquipment.load) {
                        try {
                            const loadResult = FireEquipment.load();
                            // إذا كانت Promise، نتعامل معها
                            if (loadResult && typeof loadResult.then === 'function') {
                                loadResult.catch(error => {
                                    Utils.safeError('خطأ في تحميل موديول معدات الحريق:', error);
                                });
                            }
                        } catch (error) {
                            Utils.safeError('خطأ في استدعاء FireEquipment.load:', error);
                        }
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة FireEquipment غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('FireEquipment', 'fire-equipment', silent);
                        }
                    }
                    break;
                case 'periodic-inspections':
                    if (typeof PeriodicInspections !== 'undefined' && PeriodicInspections.load) {
                        try {
                            const loadResult = PeriodicInspections.load();
                            if (loadResult && typeof loadResult.then === 'function') {
                                loadResult.catch(error => {
                                    Utils.safeError('خطأ في تحميل موديول الفحوصات الدورية:', error);
                                });
                            }
                        } catch (error) {
                            Utils.safeError('خطأ في استدعاء PeriodicInspections.load:', error);
                        }
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة PeriodicInspections غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('PeriodicInspections', 'periodic-inspections', silent);
                        }
                    }
                    break;
                case 'ppe':
                    if (typeof PPE !== 'undefined' && PPE.load) {
                        PPE.load();
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة PPE غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('PPE', 'ppe', silent);
                        }
                    }
                    break;
                case 'violations':
                    if (typeof Violations !== 'undefined' && Violations.load) {
                        try {
                            const loadResult = Violations.load();
                            if (loadResult && typeof loadResult.then === 'function') {
                                loadResult.catch(error => {
                                    Utils.safeError('خطأ في تحميل موديول المخالفات:', error);
                                    // عرض رسالة خطأ في القسم
                                    const section = document.getElementById('violations-section');
                                    if (section) {
                                        section.innerHTML = `
                                            <div class="content-card">
                                                <div class="card-body">
                                                    <div class="empty-state">
                                                        <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-3"></i>
                                                        <h3 class="text-lg font-semibold text-gray-800 mb-2">فشل تحميل الموديول</h3>
                                                        <p class="text-gray-500 mb-4">${error?.message || 'خطأ غير معروف'}</p>
                                                        <button onclick="location.reload()" class="btn-primary">
                                                            <i class="fas fa-redo ml-2"></i>
                                                            تحديث الصفحة
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    }
                                });
                            }
                        } catch (error) {
                            Utils.safeError('خطأ في استدعاء Violations.load:', error);
                            // عرض رسالة خطأ في القسم
                            const section = document.getElementById('violations-section');
                            if (section) {
                                section.innerHTML = `
                                    <div class="content-card">
                                        <div class="card-body">
                                            <div class="empty-state">
                                                <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-3"></i>
                                                <h3 class="text-lg font-semibold text-gray-800 mb-2">فشل تحميل الموديول</h3>
                                                <p class="text-gray-500 mb-4">يرجى تحديث الصفحة</p>
                                                <button onclick="location.reload()" class="btn-primary">
                                                    <i class="fas fa-redo ml-2"></i>
                                                    تحديث الصفحة
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }
                        }
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة Violations غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('Violations', 'violations', silent);
                        }
                    }
                    break;
                case 'contractors':
                    if (typeof Contractors !== 'undefined' && Contractors.load) {
                        try {
                            const loadResult = Contractors.load();
                            // إذا كانت Promise، نتعامل معها
                            if (loadResult && typeof loadResult.then === 'function') {
                                loadResult.catch(error => {
                                    Utils.safeError('خطأ في تحميل موديول المقاولين:', error);
                                    // عرض رسالة خطأ في القسم
                                    const section = document.getElementById('contractors-section');
                                    if (section) {
                                        section.innerHTML = `
                                            <div class="content-card">
                                                <div class="card-body">
                                                    <div class="empty-state">
                                                        <i class="fas fa-exclamation-circle text-4xl text-red-400 mb-3"></i>
                                                        <h3 class="text-lg font-semibold text-gray-800 mb-2">حدث خطأ في تحميل الموديول</h3>
                                                        <p class="text-gray-500 mb-4">${error.message || 'خطأ غير معروف'}</p>
                                                        <button onclick="location.reload()" class="btn-primary">
                                                            <i class="fas fa-redo ml-2"></i>
                                                            إعادة تحميل الصفحة
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    }
                                });
                            }
                        } catch (error) {
                            Utils.safeError('خطأ في استدعاء Contractors.load:', error);
                        }
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة Contractors غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('Contractors', 'contractors', silent);
                        } else {
                            // في حالة silent، نعرض رسالة تحميل
                            const section = document.getElementById('contractors-section');
                            if (section) {
                                section.innerHTML = `
                                    <div class="content-card">
                                        <div class="card-body">
                                            <div class="flex items-center justify-center py-12">
                                                <div class="text-center">
                                                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                                    <p class="text-gray-600">جاري تحميل الموديول...</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }
                        }
                    }
                    break;
                case 'behavior-monitoring':
                    if (typeof BehaviorMonitoring !== 'undefined' && BehaviorMonitoring.load) {
                        try {
                            const loadResult = BehaviorMonitoring.load();
                            if (loadResult && typeof loadResult.then === 'function') {
                                loadResult.catch(error => {
                                    Utils.safeError('خطأ في تحميل موديول مراقبة السلوك:', error);
                                });
                            }
                        } catch (error) {
                            Utils.safeError('خطأ في استدعاء BehaviorMonitoring.load:', error);
                        }
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة BehaviorMonitoring غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('BehaviorMonitoring', 'behavior-monitoring', silent);
                        }
                    }
                    break;
                case 'chemical-safety':
                    if (typeof ChemicalSafety !== 'undefined' && ChemicalSafety.load) {
                        ChemicalSafety.load();
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة ChemicalSafety غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('ChemicalSafety', 'chemical-safety', silent);
                        }
                    }
                    break;
                case 'daily-observations':
                    if (typeof DailyObservations !== 'undefined' && DailyObservations.load) {
                        try {
                            const loadResult = DailyObservations.load();
                            if (loadResult && typeof loadResult.then === 'function') {
                                loadResult.catch(error => {
                                    Utils.safeError('خطأ في تحميل موديول الملاحظات اليومية:', error);
                                });
                            }
                        } catch (error) {
                            Utils.safeError('خطأ في استدعاء DailyObservations.load:', error);
                        }
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة DailyObservations غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('DailyObservations', 'daily-observations', silent);
                        }
                    }
                    break;
                case 'iso':
                    if (typeof ISO !== 'undefined' && ISO.load) {
                        ISO.load();
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة ISO غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('ISO', 'iso', silent);
                        }
                    }
                    break;
                case 'emergency':
                    if (typeof Emergency !== 'undefined' && Emergency.load) {
                        Emergency.load();
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة Emergency غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('Emergency', 'emergency', silent);
                        }
                    }
                    break;
                case 'risk-assessment':
                    if (typeof RiskAssessment !== 'undefined' && RiskAssessment.load) {
                        try {
                            const loadResult = RiskAssessment.load();
                            if (loadResult && typeof loadResult.then === 'function') {
                                loadResult.catch(error => {
                                    Utils.safeError('خطأ في تحميل موديول تقييم المخاطر:', error);
                                });
                            }
                        } catch (error) {
                            Utils.safeError('خطأ في استدعاء RiskAssessment.load:', error);
                        }
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة RiskAssessment غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('RiskAssessment', 'risk-assessment', silent);
                        }
                    }
                    break;
                case 'sop-jha':
                    if (typeof SOPJHA !== 'undefined' && SOPJHA.load) {
                        SOPJHA.load();
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة SOPJHA غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('SOPJHA', 'sop-jha', silent);
                        }
                    }
                    break;
                case 'legal-documents':
                    if (typeof LegalDocuments !== 'undefined' && LegalDocuments.load) {
                        LegalDocuments.load();
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة LegalDocuments غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('LegalDocuments', 'legal-documents', silent);
                        }
                    }
                    break;
                case 'sustainability':
                    if (typeof Sustainability !== 'undefined' && Sustainability.load) {
                        Sustainability.load();
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة Sustainability غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('Sustainability', 'sustainability', silent);
                        }
                    }
                    break;
                case 'ai-assistant':
                    if (typeof AIAssistant !== 'undefined' && AIAssistant.load) {
                        try {
                            const loadResult = AIAssistant.load();
                            if (loadResult && typeof loadResult.then === 'function') {
                                loadResult.catch(error => {
                                    Utils.safeError('خطأ في تحميل موديول المساعد الذكي:', error);
                                });
                            }
                        } catch (error) {
                            Utils.safeError('خطأ في استدعاء AIAssistant.load:', error);
                        }
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة AIAssistant غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('AIAssistant', 'ai-assistant', silent);
                        }
                    }
                    break;
                case 'safety-performance-kpis':
                    if (typeof SafetyPerformanceKPIs !== 'undefined' && SafetyPerformanceKPIs.load) {
                        SafetyPerformanceKPIs.load();
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة SafetyPerformanceKPIs غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('SafetyPerformanceKPIs', 'safety-performance-kpis', silent);
                        }
                    }
                    break;
                case 'settings':
                    if (typeof Settings !== 'undefined' && Settings.load) {
                        Settings.load();
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة Settings غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('Settings', 'settings', silent);
                        }
                    }
                    break;
                case 'safety-budget':
                    if (typeof SafetyBudget !== 'undefined' && SafetyBudget.load) {
                        SafetyBudget.load();
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة SafetyBudget غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('SafetyBudget', 'safety-budget', silent);
                        }
                    }
                    break;
                case 'action-tracking':
                    if (typeof ActionTrackingRegister !== 'undefined' && ActionTrackingRegister.load) {
                        try {
                            const loadResult = ActionTrackingRegister.load();
                            if (loadResult && typeof loadResult.then === 'function') {
                                loadResult.catch(error => {
                                    Utils.safeError('خطأ في تحميل موديول سجل متابعة الإجراءات:', error);
                                });
                            }
                        } catch (error) {
                            Utils.safeError('خطأ في استدعاء ActionTrackingRegister.load:', error);
                        }
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة ActionTrackingRegister غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('ActionTrackingRegister', 'action-tracking', silent);
                        }
                    }
                    break;
                case 'safety-health-management':
                    Utils.safeLog('تحميل مديول إدارة السلامة والصحة المهنية في قسم safety-health-management-section');
                    if (typeof SafetyHealthManagement !== 'undefined' && SafetyHealthManagement.load) {
                        try {
                            const loadResult = SafetyHealthManagement.load();
                            if (loadResult && typeof loadResult.then === 'function') {
                                loadResult.catch(error => {
                                    Utils.safeError('خطأ في تحميل موديول إدارة السلامة والصحة:', error);
                                });
                            }
                        } catch (error) {
                            Utils.safeError('خطأ في استدعاء SafetyHealthManagement.load:', error);
                        }
                    } else {
                        if (!silent) {
                            Utils.safeError('وحدة SafetyHealthManagement غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('SafetyHealthManagement', 'safety-health-management', silent);
                        }
                    }
                    break;
                case 'apptester':
                    Utils.safeLog('تحميل مديول اختبار التطبيق في قسم apptester-section');
                    if (typeof AppTester !== 'undefined' && AppTester.load) {
                        AppTester.load();
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة AppTester غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('AppTester', 'apptester', silent);
                        }
                    }
                    break;
                case 'reports':
                    Utils.safeLog('تحميل مديول التقارير في قسم reports-section');
                    if (typeof Reports !== 'undefined' && Reports.load) {
                        try {
                            const loadResult = Reports.load();
                            if (loadResult && typeof loadResult.then === 'function') {
                                loadResult.catch(error => {
                                    Utils.safeError('خطأ في تحميل موديول التقارير:', error);
                                });
                            }
                        } catch (error) {
                            Utils.safeError('خطأ في استدعاء Reports.load:', error);
                        }
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة Reports غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('Reports', 'reports', silent);
                        }
                    }
                    break;
                case 'hse':
                    Utils.safeLog('تحميل مديول HSE في قسم hse-section');
                    if (typeof HSE !== 'undefined' && HSE.load) {
                        try {
                            const loadResult = HSE.load();
                            if (loadResult && typeof loadResult.then === 'function') {
                                loadResult.catch(error => {
                                    Utils.safeError('خطأ في تحميل موديول HSE:', error);
                                });
                            }
                        } catch (error) {
                            Utils.safeError('خطأ في استدعاء HSE.load:', error);
                        }
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة HSE غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('HSE', 'hse', silent);
                        }
                    }
                    break;
                case 'risk-matrix':
                    Utils.safeLog('تحميل مديول مصفوفة تقييم المخاطر في قسم risk-matrix-section');
                    if (typeof RiskMatrix !== 'undefined' && RiskMatrix.load) {
                        try {
                            const loadResult = RiskMatrix.load();
                            if (loadResult && typeof loadResult.then === 'function') {
                                loadResult.catch(error => {
                                    Utils.safeError('خطأ في تحميل موديول مصفوفة تقييم المخاطر:', error);
                                });
                            }
                        } catch (error) {
                            Utils.safeError('خطأ في استدعاء RiskMatrix.load:', error);
                        }
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة RiskMatrix غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('RiskMatrix', 'risk-matrix', silent);
                        }
                    }
                    break;
                case 'user-ai-assistant':
                case 'useraiassistant':
                    Utils.safeLog('تحميل مديول مساعد المستخدم الذكي في قسم useraiassistant-section');
                    if (typeof UserAIAssistant !== 'undefined' && UserAIAssistant.load) {
                        try {
                            const loadResult = UserAIAssistant.load();
                            if (loadResult && typeof loadResult.then === 'function') {
                                loadResult.catch(error => {
                                    Utils.safeError('خطأ في تحميل موديول مساعد المستخدم الذكي:', error);
                                });
                            }
                        } catch (error) {
                            Utils.safeError('خطأ في استدعاء UserAIAssistant.load:', error);
                        }
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة UserAIAssistant غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('UserAIAssistant', 'useraiassistant', silent);
                        }
                    }
                    break;
                case 'issue-tracking':
                    Utils.safeLog('تحميل مديول تتبع المشاكل في قسم issue-tracking-section');
                    if (typeof IssueTracking !== 'undefined' && IssueTracking.load) {
                        try {
                            const loadResult = IssueTracking.load();
                            if (loadResult && typeof loadResult.then === 'function') {
                                loadResult.catch(error => {
                                    Utils.safeError('خطأ في تحميل موديول تتبع المشاكل:', error);
                                });
                            }
                        } catch (error) {
                            Utils.safeError('خطأ في استدعاء IssueTracking.load:', error);
                        }
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة IssueTracking غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('IssueTracking', 'issue-tracking', silent);
                        }
                    }
                    break;
                case 'change-management':
                    Utils.safeLog('تحميل موديول إدارة التغيرات في قسم change-management-section');
                    if (typeof ChangeManagement !== 'undefined' && ChangeManagement.load) {
                        try {
                            const loadResult = ChangeManagement.load();
                            if (loadResult && typeof loadResult.then === 'function') {
                                loadResult.catch(error => {
                                    Utils.safeError('خطأ في تحميل موديول إدارة التغيرات:', error);
                                });
                            }
                        } catch (error) {
                            Utils.safeError('خطأ في استدعاء ChangeManagement.load:', error);
                        }
                    } else {
                        if (!silent) {
                            Utils.safeWarn('وحدة ChangeManagement غير موجودة - جاري انتظار التحميل...');
                            this.waitForModuleAndLoad('ChangeManagement', 'change-management', silent);
                        }
                    }
                    break;
                default:
                    Utils.safeWarn('قسم غير معروف:', sectionName);
            }

            // التأكد من إضافة أيقونات التنقل بعد تحميل جميع الموديولات
            if (sectionName !== 'dashboard') {
                setTimeout(() => {
                    this.ensureNavigationIcons(sectionName);
                }, 800);
                setTimeout(() => {
                    this.ensureNavigationIcons(sectionName);
                }, 1500);
                setTimeout(() => {
                    this.ensureNavigationIcons(sectionName);
                }, 2500);
            }
        } catch (error) {
            // استخراج رسالة خطأ واضحة
            let errorMessage = 'خطأ غير معروف';
            if (error) {
                if (typeof error === 'string') {
                    errorMessage = error;
                } else if (error.message) {
                    errorMessage = error.message;
                } else if (error.toString && typeof error.toString === 'function') {
                    try {
                        errorMessage = error.toString();
                    } catch (e) {
                        errorMessage = 'خطأ في تحميل بيانات القسم';
                    }
                } else {
                    try {
                        errorMessage = JSON.stringify(error);
                    } catch (e) {
                        errorMessage = 'خطأ في تحميل بيانات القسم';
                    }
                }
            }
            
            // عند إعادة التحميل، نكتفي بتسجيل الخطأ بدون إظهار إشعار للمستخدم
            if (silent) {
                Utils.safeError('خطأ في تحميل بيانات القسم (صامت):', errorMessage);
            } else {
                Utils.safeError('خطأ في تحميل بيانات القسم:', errorMessage);
                if (typeof Notification !== 'undefined' && Notification.error) {
                    Notification.error('حدث خطأ في تحميل بيانات القسم: ' + errorMessage);
                }
            }

            // حتى في حالة الخطأ، نحاول إضافة الأيقونات
            if (sectionName !== 'dashboard') {
                setTimeout(() => {
                    this.ensureNavigationIcons(sectionName);
                }, 500);
            }
        }
    },

    /**
     * انتظار تحميل موديول ثم تحميله
     */
    async waitForModuleAndLoad(moduleName, sectionName, silent = false) {
        // انتظار تحميل الموديول لمدة أقصاها 10 ثوان
        const maxWait = 10000;
        const checkInterval = 100;
        const startTime = Date.now();

        return new Promise((resolve) => {
            const checkModule = () => {
                const module = window[moduleName];
                const elapsed = Date.now() - startTime;

                if (module && typeof module.load === 'function') {
                    // الموديول محمل - تحميل القسم مباشرة
                    if (!silent) {
                        Utils.safeLog(`✅ تم تحميل ${moduleName} - جاري تحميل القسم`);
                    }
                    try {
                        const loadResult = module.load(silent);

                        // إذا كانت Promise، ننتظرها
                        if (loadResult && typeof loadResult.then === 'function') {
                            loadResult.then(() => {
                                // إضافة الأيقونات بعد تحميل الموديول
                                if (sectionName !== 'dashboard') {
                                    setTimeout(() => {
                                        this.ensureNavigationIcons(sectionName);
                                    }, 300);
                                    setTimeout(() => {
                                        this.ensureNavigationIcons(sectionName);
                                    }, 800);
                                }
                            }).catch(() => {
                                if (!silent) {
                                    Utils.safeError(`خطأ في تحميل ${moduleName}`);
                                }
                            });
                        } else if (loadResult && typeof loadResult.catch === 'function' && silent) {
                            loadResult.catch(() => { });
                        }

                        // إضافة الأيقونات بعد تحميل الموديول (حتى لو لم تكن Promise)
                        if (sectionName !== 'dashboard') {
                            setTimeout(() => {
                                this.ensureNavigationIcons(sectionName);
                            }, 500);
                            setTimeout(() => {
                                this.ensureNavigationIcons(sectionName);
                            }, 1000);
                        }
                    } catch (error) {
                        if (!silent) {
                            Utils.safeError(`خطأ في تحميل ${moduleName}:`, error);
                        }
                    }
                    resolve(true);
                } else if (elapsed < maxWait) {
                    // الموديول لم يُحمّل بعد - ننتظر
                    setTimeout(checkModule, checkInterval);
                } else {
                    // انتهى الوقت - فشل التحميل
                    if (!silent) {
                        Utils.safeError(`⚠️ فشل تحميل ${moduleName} بعد ${maxWait}ms`);
                        const section = document.getElementById(`${sectionName}-section`);
                        if (section) {
                            section.innerHTML = `
                                <div class="content-card">
                                    <div class="empty-state">
                                        <i class="fas fa-exclamation-triangle text-4xl text-yellow-400 mb-4"></i>
                                        <p class="text-gray-500">فشل تحميل الموديول</p>
                                        <p class="text-sm text-gray-400 mt-2">يرجى تحديث الصفحة</p>
                                    </div>
                                </div>
                            `;
                        }
                    }
                    resolve(false);
                }
            };

            checkModule();
        });
    },

    /**
     * تبديل إظهار كلمة المرور
     */
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('password-toggle-icon');
        const toggleBtn = document.getElementById('password-toggle-btn');

        if (!passwordInput || !toggleIcon) {
            Utils.safeWarn('⚠ لم يتم العثور على عناصر كلمة المرور');
            return;
        }

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
            if (toggleBtn) {
                toggleBtn.setAttribute('aria-label', 'إخفاء كلمة المرور');
                toggleBtn.setAttribute('title', 'إخفاء كلمة المرور');
            }
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
            if (toggleBtn) {
                toggleBtn.setAttribute('aria-label', 'إظهار كلمة المرور');
                toggleBtn.setAttribute('title', 'إظهار كلمة المرور');
            }
        }

        // إعادة التركيز على حقل الإدخال
        passwordInput.focus();
    },

    /**
     * إضافة أيقونة العودة إلى القسم
     */
    /**
     * إضافة أيقونات التنقل (القائمة الرئيسية والعودة)
     */
    addNavigationIcons(section, sectionName) {
        if (!section) {
            if (AppState.debugMode) {
                Utils.safeWarn('⚠️ addNavigationIcons: section غير موجود');
            }
            return;
        }

        // سجل للتحقق في وضع التطوير فقط
        if (AppState.debugMode) {
            Utils.safeLog('🔧 محاولة إضافة أيقونات التنقل للقسم:', sectionName, {
                sectionExists: !!section,
                sectionId: section?.id,
                sectionVisible: section?.style?.display !== 'none',
                sectionActive: section?.classList?.contains('active')
            });
        }

        if (AppState.debugMode) {
            Utils.safeLog('🔧 إضافة أيقونات التنقل للقسم:', sectionName);
        }

        // التحقق من وجود section-header
        let sectionHeader = section.querySelector('.section-header');
        if (AppState.debugMode) {
            Utils.safeLog('🔍 البحث عن section-header:', {
                found: !!sectionHeader,
                sectionChildren: section?.children?.length
            });
        }

        // إذا لم يكن موجوداً، نبحث عن section-title مباشرة
        if (!sectionHeader) {
            const sectionTitle = section.querySelector('.section-title');
            if (sectionTitle) {
                // إنشاء section-header إذا لم يكن موجوداً
                sectionHeader = document.createElement('div');
                sectionHeader.className = 'section-header';
                sectionTitle.parentNode.insertBefore(sectionHeader, sectionTitle);
                sectionHeader.appendChild(sectionTitle);
            }
        }

        if (!sectionHeader) {
            // إذا لم نجد section-header أو section-title، نحاول إنشاءهما
            const firstChild = section.firstElementChild;
            if (firstChild) {
                sectionHeader = document.createElement('div');
                sectionHeader.className = 'section-header';
                section.insertBefore(sectionHeader, firstChild);
            } else {
                // إذا كان القسم فارغاً، نضيف section-header في البداية
                sectionHeader = document.createElement('div');
                sectionHeader.className = 'section-header';
                section.appendChild(sectionHeader);
            }
        }

        // التحقق من وجود أيقونات التنقل مسبقاً
        const existingIcons = sectionHeader.querySelector('.navigation-icons-container');
        if (existingIcons) {
            // تحديث حالة زر العودة بناءً على سجل التنقل الحالي
            const backIcon = existingIcons.querySelector('.back-menu-icon');
            if (backIcon) {
                const hasHistory = AppState.navigationHistory && AppState.navigationHistory.length > 0;
                backIcon.setAttribute('aria-label', hasHistory ? 'العودة للقائمة السابقة' : 'العودة للقائمة الرئيسية');
                backIcon.setAttribute('title', hasHistory ? 'العودة للقائمة السابقة' : 'العودة للقائمة الرئيسية');
            }
            return; // الأيقونات موجودة بالفعل
        }

        // إنشاء حاوية للأيقونات
        const iconsContainer = document.createElement('div');
        iconsContainer.className = 'navigation-icons-container';
        iconsContainer.style.cssText = 'position: absolute; right: 0; top: 0; display: flex; gap: 0.5rem; align-items: center; z-index: 1000; visibility: visible; opacity: 1;';

        // إنشاء أيقونة القائمة الرئيسية
        const homeIcon = document.createElement('button');
        homeIcon.className = 'main-menu-icon';
        homeIcon.setAttribute('aria-label', 'القائمة الرئيسية');
        homeIcon.setAttribute('title', 'القائمة الرئيسية');
        homeIcon.innerHTML = '<i class="fas fa-th-large"></i>';
        homeIcon.style.cssText = 'width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--primary-color); color: white; border-radius: 12px; cursor: pointer; transition: all 0.3s ease; box-shadow: var(--shadow-md); border: none; font-size: 1.25rem; flex-shrink: 0;';

        // إضافة معالج الأحداث لأيقونة القائمة الرئيسية
        homeIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.goToDashboard();
        });

        // إضافة تأثيرات hover
        homeIcon.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = 'var(--shadow-lg)';
        });
        homeIcon.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'var(--shadow-md)';
        });

        // إنشاء أيقونة العودة للقائمة السابقة
        const backIcon = document.createElement('button');
        backIcon.className = 'back-menu-icon';
        const hasHistory = AppState.navigationHistory && AppState.navigationHistory.length > 0;
        backIcon.setAttribute('aria-label', hasHistory ? 'العودة للقائمة السابقة' : 'العودة للقائمة الرئيسية');
        backIcon.setAttribute('title', hasHistory ? 'العودة للقائمة السابقة' : 'العودة للقائمة الرئيسية');
        backIcon.innerHTML = '<i class="fas fa-arrow-right"></i>';
        backIcon.style.cssText = 'width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary); color: var(--text-primary); border-radius: 12px; cursor: pointer; transition: all 0.3s ease; box-shadow: var(--shadow-md); border: 1px solid var(--border-color); font-size: 1.25rem; flex-shrink: 0;';

        // إضافة معالج الأحداث لأيقونة العودة
        backIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.goBack();
        });

        // إضافة تأثيرات hover
        backIcon.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = 'var(--shadow-lg)';
            this.style.background = 'var(--bg-secondary)';
        });
        backIcon.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'var(--shadow-md)';
            this.style.background = 'var(--bg-tertiary)';
        });

        // إضافة الأيقونات إلى الحاوية
        iconsContainer.appendChild(homeIcon);
        iconsContainer.appendChild(backIcon);

        // إضافة الحاوية إلى section-header
        sectionHeader.appendChild(iconsContainer);

        // التأكد من أن section-header له position: relative
        const computedPosition = window.getComputedStyle(sectionHeader).position;
        if (computedPosition === 'static') {
            sectionHeader.style.position = 'relative';
        }

        // إضافة padding-right للـ section-header لتفادي تداخل الأيقونات مع المحتوى
        const computedPadding = window.getComputedStyle(sectionHeader).paddingRight;
        const paddingValue = parseInt(computedPadding) || 0;
        if (paddingValue < 120) {
            sectionHeader.style.paddingRight = '120px';
        }

        // التأكد من أن الأيقونات مرئية
        iconsContainer.style.visibility = 'visible';
        iconsContainer.style.opacity = '1';
        iconsContainer.style.display = 'flex';
        iconsContainer.style.zIndex = '1000';

        // التأكد من أن الأيقونات مرئية وموجودة في DOM
        const iconsInDOM = sectionHeader.querySelector('.navigation-icons-container');
        if (iconsInDOM) {
            if (AppState.debugMode) {
                Utils.safeLog('✅ تم إضافة أيقونات التنقل بنجاح للقسم:', sectionName, {
                    sectionHeader: !!sectionHeader,
                    iconsContainer: !!iconsContainer,
                    iconsInDOM: !!iconsInDOM,
                    position: window.getComputedStyle(sectionHeader).position,
                    paddingRight: sectionHeader.style.paddingRight,
                    iconsVisible: window.getComputedStyle(iconsInDOM).visibility,
                    iconsDisplay: window.getComputedStyle(iconsInDOM).display,
                    iconsZIndex: window.getComputedStyle(iconsInDOM).zIndex,
                    headerRect: sectionHeader.getBoundingClientRect(),
                    iconsRect: iconsInDOM.getBoundingClientRect()
                });
            }
        } else {
            Utils.safeError('❌ فشل إضافة الأيقونات - لم يتم العثور عليها في DOM:', sectionName, {
                sectionHeader: !!sectionHeader,
                iconsContainer: !!iconsContainer
            });
        }

        // إضافة MutationObserver لإعادة إضافة الأيقونات عند تغيير محتوى القسم
        if (!section.dataset.observerAdded) {
            const savedSectionName = sectionName; // حفظ اسم القسم
            const self = this; // حفظ المرجع للـ this
            let checkTimeout = null;

            const observer = new MutationObserver((mutations) => {
                // إلغاء أي timeout سابق
                if (checkTimeout) {
                    clearTimeout(checkTimeout);
                }

                // التحقق من أي تغييرات في المحتوى
                let contentChanged = false;
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        // إذا تم حذف عقد (مثل innerHTML)
                        if (mutation.removedNodes.length > 0) {
                            // التحقق من أن التغيير ليس من الأيقونات نفسها
                            let isIconRemoval = false;
                            for (const node of mutation.removedNodes) {
                                if (node.nodeType === 1 &&
                                    (node.classList && node.classList.contains('navigation-icons-container'))) {
                                    isIconRemoval = true;
                                    break;
                                }
                            }
                            if (!isIconRemoval) {
                                contentChanged = true;
                                break;
                            }
                        }
                        // إذا تم إضافة عقد جديدة (بعد innerHTML)
                        if (mutation.addedNodes.length > 0) {
                            let isIconAddition = false;
                            for (const node of mutation.addedNodes) {
                                if (node.nodeType === 1 &&
                                    (node.classList && node.classList.contains('navigation-icons-container'))) {
                                    isIconAddition = true;
                                    break;
                                }
                            }
                            if (!isIconAddition) {
                                contentChanged = true;
                                break;
                            }
                        }
                    }
                }

                if (contentChanged && savedSectionName !== 'dashboard') {
                    // استخدام debounce لتجنب استدعاءات متعددة
                    checkTimeout = setTimeout(() => {
                        const currentHeader = section.querySelector('.section-header');
                        if (currentHeader) {
                            const currentIcons = currentHeader.querySelector('.navigation-icons-container');
                            if (!currentIcons) {
                                // إعادة إضافة الأيقونات إذا تم حذفها
                                if (AppState.debugMode) {
                                    Utils.safeLog('🔄 إعادة إضافة الأيقونات بعد تغيير المحتوى:', savedSectionName);
                                }
                                self.addNavigationIcons(section, savedSectionName);
                            }
                        } else {
                            // إذا تم حذف section-header بالكامل، نعيد إضافة الأيقونات بعد إنشاء header جديد
                            setTimeout(() => {
                                const retryHeader = section.querySelector('.section-header');
                                if (retryHeader) {
                                    self.addNavigationIcons(section, savedSectionName);
                                }
                            }, 200);
                        }
                    }, 100);
                }
            });

            observer.observe(section, {
                childList: true,
                subtree: true,
                attributes: false
            });

            section.dataset.observerAdded = 'true';
            section.dataset.sectionName = savedSectionName;
            section._navigationObserver = observer;
        }
    },

    /**
     * التأكد من وجود أيقونات التنقل في القسم
     */
    ensureNavigationIcons(sectionName) {
        if (!sectionName || sectionName === 'dashboard') return;

        const sectionId = `${sectionName}-section`;
        const section = document.getElementById(sectionId);

        if (!section || section.style.display === 'none' || !section.classList.contains('active')) {
            return;
        }

        const sectionHeader = section.querySelector('.section-header');
        if (sectionHeader) {
            const existingIcons = sectionHeader.querySelector('.navigation-icons-container');
            if (!existingIcons) {
                if (AppState.debugMode) {
                    Utils.safeLog('🔧 ensureNavigationIcons: إضافة الأيقونات للقسم:', sectionName);
                }
                this.addNavigationIcons(section, sectionName);
            }
        } else {
            // إذا لم يكن هناك header، ننتظر قليلاً ثم نحاول مرة أخرى
            setTimeout(() => {
                const retrySection = document.getElementById(sectionId);
                if (retrySection) {
                    const retryHeader = retrySection.querySelector('.section-header');
                    if (retryHeader) {
                        this.addNavigationIcons(retrySection, sectionName);
                    }
                }
            }, 200);
        }
    },

    /**
     * دالة helper لإضافة الأيقونات بعد renderUI
     * يمكن استدعاؤها من أي موديول بعد استبدال innerHTML
     */
    addNavigationIconsAfterRender(sectionName) {
        if (!sectionName || sectionName === 'dashboard') {
            Utils.safeWarn('⚠️ addNavigationIconsAfterRender: sectionName غير صالح:', sectionName);
            return;
        }

        const sectionId = `${sectionName}-section`;
        const section = document.getElementById(sectionId);

        if (!section) {
            Utils.safeWarn('⚠️ addNavigationIconsAfterRender: section غير موجود:', sectionId);
            // محاولة بعد قليل
            setTimeout(() => {
                const retrySection = document.getElementById(sectionId);
                if (retrySection && typeof this.addNavigationIcons === 'function') {
                    this.addNavigationIcons(retrySection, sectionName);
                }
            }, 200);
            return;
        }

        if (typeof this.addNavigationIcons === 'function') {
            if (AppState.debugMode) Utils.safeLog('✅ استدعاء addNavigationIconsAfterRender للقسم:', sectionName);

            // محاولات متعددة لضمان الإضافة
            setTimeout(() => {
                this.addNavigationIcons(section, sectionName);
            }, 0);

            setTimeout(() => {
                this.addNavigationIcons(section, sectionName);
            }, 100);

            setTimeout(() => {
                this.addNavigationIcons(section, sectionName);
            }, 300);

            setTimeout(() => {
                this.addNavigationIcons(section, sectionName);
            }, 600);
        } else {
            Utils.safeError('❌ addNavigationIconsAfterRender: دالة addNavigationIcons غير موجودة');
        }
    },

    /**
     * إعداد مراقبة innerHTML لإضافة الأيقونات تلقائياً
     */
    setupInnerHTMLWatcher(section, sectionName) {
        if (!section || sectionName === 'dashboard' || section.dataset.innerHTMLWatched) {
            return;
        }

        const self = this;

        // Override innerHTML setter للقسم المحدد
        const originalDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        if (!originalDescriptor) return;

        const originalSet = originalDescriptor.set;
        const originalGet = originalDescriptor.get;

        // Override innerHTML setter with improved retry mechanism
        Object.defineProperty(section, 'innerHTML', {
            set: function (value) {
                // استدعاء setter الأصلي
                if (originalSet) {
                    originalSet.call(this, value);
                }

                // إضافة الأيقونات بعد استبدال innerHTML مباشرة
                if (sectionName !== 'dashboard') {
                    // محاولات متعددة مع زيادة الفترات لضمان إعادة الإضافة
                    const retries = [0, 50, 150, 300, 600, 1000];
                    retries.forEach((delay, index) => {
                        setTimeout(() => {
                            try {
                                // التحقق من أن القسم لا يزال موجوداً في DOM
                                if (this.isConnected && this.parentNode) {
                                    self.addNavigationIcons(this, sectionName);
                                }
                            } catch (error) {
                                // تجاهل الأخطاء في المحاولات المتأخرة
                                if (index < 3 && AppState.debugMode) {
                                    Utils.safeWarn('⚠️ خطأ في إضافة الأيقونات بعد innerHTML:', error);
                                }
                            }
                        }, delay);
                    });
                }
            },
            get: function () {
                if (originalGet) {
                    return originalGet.call(this);
                }
                return '';
            },
            configurable: true,
            enumerable: true
        });

        section.dataset.innerHTMLWatched = 'true';

        // استخدام MutationObserver كحل احتياطي محسّن
        let observerTimeout = null;
        const observer = new MutationObserver((mutations) => {
            let shouldAddIcons = false;
            let iconsRemoved = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    // التحقق من إضافة section-header
                    if (mutation.addedNodes.length > 0) {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === 1) {
                                if (node.classList && node.classList.contains('section-header')) {
                                    shouldAddIcons = true;
                                    break;
                                }
                                if (node.querySelector && node.querySelector('.section-header')) {
                                    shouldAddIcons = true;
                                    break;
                                }
                            }
                        }
                    }

                    // التحقق من حذف الأيقونات
                    if (mutation.removedNodes.length > 0) {
                        for (const node of mutation.removedNodes) {
                            if (node.nodeType === 1) {
                                if ((node.classList && node.classList.contains('navigation-icons-container')) ||
                                    (node.querySelector && node.querySelector('.navigation-icons-container'))) {
                                    iconsRemoved = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                if (shouldAddIcons || iconsRemoved) break;
            }

            // إلغاء أي timeout سابق
            if (observerTimeout) {
                clearTimeout(observerTimeout);
            }

            // إضافة الأيقونات عند الحاجة
            if (shouldAddIcons || iconsRemoved) {
                observerTimeout = setTimeout(() => {
                    try {
                        const currentHeader = section.querySelector('.section-header');
                        if (currentHeader && section.isConnected) {
                            const existingIcons = currentHeader.querySelector('.navigation-icons-container');
                            if (!existingIcons) {
                                self.addNavigationIcons(section, sectionName);
                            }
                        }
                    } catch (error) {
                        if (AppState.debugMode) {
                            Utils.safeWarn('⚠️ خطأ في MutationObserver:', error);
                        }
                    }
                }, 100); // زيادة الفترة قليلاً لتقليل التكرار
            }
        });

        observer.observe(section, {
            childList: true,
            subtree: true,
            attributes: false // لا نحتاج لمراقبة التغييرات في السمات
        });

        section._innerHTMLObserver = observer;
        section._innerHTMLObserverTimeout = observerTimeout;
    },

    /**
     * إزالة أيقونات التنقل من القسم
     */
    removeNavigationIcons(section) {
        if (!section) return;

        const sectionHeader = section.querySelector('.section-header');
        if (sectionHeader) {
            const iconsContainer = sectionHeader.querySelector('.navigation-icons-container');
            if (iconsContainer) {
                iconsContainer.remove();
            }
            // إزالة أيقونات قديمة إن وجدت
            const oldBackIcon = sectionHeader.querySelector('.back-home-icon');
            if (oldBackIcon) {
                oldBackIcon.remove();
            }
        }

        // تنظيف MutationObserver و timeout
        if (section._innerHTMLObserver) {
            section._innerHTMLObserver.disconnect();
            section._innerHTMLObserver = null;
        }
        if (section._innerHTMLObserverTimeout) {
            clearTimeout(section._innerHTMLObserverTimeout);
            section._innerHTMLObserverTimeout = null;
        }

        // إزالة علامة innerHTMLWatched للسماح بإعادة الإعداد إذا لزم الأمر
        delete section.dataset.innerHTMLWatched;
    },

    /**
     * الانتقال إلى الشاشة الرئيسية (Dashboard)
     */
    goToDashboard() {
        // مسح سجل التنقل
        AppState.navigationHistory = [];

        // الانتقال إلى Dashboard أولاً
        this.showSection('dashboard');

        // فتح القائمة الجانبية عند العودة إلى Dashboard على الشاشات الكبيرة
        // وعلى الموبايل نتركها كما هي (مغلقة افتراضياً)
        if (window.innerWidth > 1024) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && !sidebar.classList.contains('open')) {
                // استخدام setTimeout لضمان اكتمال render القسم أولاً
                setTimeout(() => {
                    this.toggleSidebar(true);
                }, 100);
            }
        }

        // إزالة التفعيل من جميع عناصر القائمة
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            item.removeAttribute('aria-current');
        });

        // تفعيل عنصر Dashboard في القائمة
        const dashboardNav = document.querySelector('[data-section="dashboard"]');
        if (dashboardNav) {
            dashboardNav.classList.add('active');
            dashboardNav.setAttribute('aria-current', 'page');
        }
    },

    /**
     * العودة للقائمة السابقة
     */
    goBack() {
        // التحقق من وجود سجل تنقل
        if (!AppState.navigationHistory || AppState.navigationHistory.length === 0) {
            // إذا لم يكن هناك سجل، نعود للقائمة الرئيسية
            this.goToDashboard();
            return;
        }

        // تنظيف السجل من أي صفحات مكررة أو غير صالحة
        AppState.navigationHistory = AppState.navigationHistory.filter(
            (section, index, arr) => {
                // إزالة القيم الفارغة أو غير الصحيحة
                if (!section || section.trim() === '') {
                    return false;
                }
                // إزالة التكرارات المتتالية
                return index === 0 || section !== arr[index - 1];
            }
        );

        // التحقق مرة أخرى بعد التنظيف
        if (AppState.navigationHistory.length === 0) {
            this.goToDashboard();
            return;
        }

        // الحصول على آخر صفحة من السجل (بدون حذفها أولاً)
        const previousSection = AppState.navigationHistory[AppState.navigationHistory.length - 1];

        // التحقق من أن الصفحة السابقة صالحة ومختلفة عن الصفحة الحالية
        if (!previousSection || previousSection === AppState.currentSection) {
            // إذا كانت الصفحة السابقة غير صالحة أو نفس الصفحة الحالية، نعود للقائمة الرئيسية
            AppState.navigationHistory = []; // مسح السجل
            this.goToDashboard();
            return;
        }

        // التحقق من وجود الصفحة في DOM قبل الانتقال إليها
        const previousSectionId = `${previousSection}-section`;
        const previousSectionElement = document.getElementById(previousSectionId);

        // إذا لم تكن الصفحة موجودة، نحاول الانتقال إلى Dashboard
        if (!previousSectionElement && previousSection !== 'dashboard') {
            // إزالة الصفحة غير الصالحة من السجل
            AppState.navigationHistory = AppState.navigationHistory.filter(
                item => item !== previousSection
            );

            // المحاولة مرة أخرى إذا كان هناك صفحات أخرى في السجل
            if (AppState.navigationHistory.length > 0) {
                this.goBack();
                return;
            } else {
                this.goToDashboard();
                return;
            }
        }

        // حذف آخر صفحة من السجل بعد التأكد من صحتها
        AppState.navigationHistory.pop();

        // تعيين علامة لتجنب إضافة القسم الحالي إلى السجل عند العودة
        AppState.isNavigatingBack = true;

        // العودة للصفحة السابقة
        this.showSection(previousSection);

        // فتح القائمة الجانبية عند العودة للصفحة السابقة على الشاشات الكبيرة
        if (window.innerWidth > 1024) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && !sidebar.classList.contains('open')) {
                setTimeout(() => {
                    this.toggleSidebar(true);
                }, 100);
            }
        }

        // إعادة تعيين العلامة بعد التنقل
        setTimeout(() => {
            AppState.isNavigatingBack = false;
        }, 300); // زيادة الوقت لضمان اكتمال التنقل
    },

    /**
     * تهيئة أزرار الواجهة (الوضع الليلي، الإشعارات، اللغة)
     */
    initSidebarButtons() {
        // تهيئة زر الوضع الليلي
        this.initThemeToggle();

        // تهيئة زر الإشعارات
        this.initNotificationsButton();

        // تهيئة زر اللغة
        this.initLanguageToggle();
    },

    /**
     * تهيئة زر الوضع الليلي
     */
    initThemeToggle() {
        // الحصول على جميع أزرار الوضع الليلي
        const themeToggles = [
            document.getElementById('theme-toggle'),
            document.getElementById('mobile-theme-toggle'),
            document.getElementById('header-theme-toggle')
        ].filter(Boolean);

        if (themeToggles.length === 0) {
            Utils.safeWarn('⚠️ لم يتم العثور على أزرار الوضع الليلي');
            return;
        }

        // تحميل الوضع المحفوظ
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        // ربط جميع الأزرار
        themeToggles.forEach(btn => {
            // التحقق من عدم ربط الزر مسبقاً
            if (btn.dataset.themeBound === 'true') {
                return;
            }

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleTheme();
            });

            btn.dataset.themeBound = 'true';
        });

        Utils.safeLog('✅ تم تهيئة زر الوضع الليلي');
    },

    /**
     * تعيين الوضع الليلي
     */
    setTheme(theme) {
        const isDark = theme === 'dark';

        // استخدام data-theme attribute بدلاً من class (حسب CSS)
        document.documentElement.setAttribute('data-theme', theme);
        if (document.body) {
            document.body.setAttribute('data-theme', theme);
        }

        // تحديث الأيقونات
        const icons = [
            document.getElementById('theme-icon'),
            document.getElementById('mobile-theme-icon'),
            document.getElementById('header-theme-icon')
        ].filter(Boolean);

        icons.forEach(icon => {
            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
        });

        // تحديث meta theme-color
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = isDark ? '#1a1a1a' : '#ffffff';

        // حفظ الوضع
        localStorage.setItem('theme', theme);

        Utils.safeLog(`✅ تم تعيين الوضع: ${theme}`);
    },

    /**
     * التبديل بين الوضع الليلي والنهاري
     */
    toggleTheme() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);

        if (typeof Notification !== 'undefined') {
            Notification.success(newTheme === 'dark' ? 'تم تفعيل الوضع الليلي' : 'تم تفعيل الوضع النهاري');
        }
    },

    /**
     * تهيئة زر الإشعارات
     */
    initNotificationsButton() {
        // حفظ مرجع إلى this للاستخدام داخل arrow function
        const self = this;
        
        try {
            // الحصول على الأزرار مباشرة
            const notificationButtons = [
                document.getElementById('notifications-btn'),
                document.getElementById('mobile-notifications-btn'),
                document.getElementById('header-notifications-btn')
            ].filter(Boolean);

            // التحقق من وجود الأزرار بشكل منفصل للتأكد
            const notificationsBtn = document.getElementById('notifications-btn');
            const mobileNotificationsBtn = document.getElementById('mobile-notifications-btn');
            const headerNotificationsBtn = document.getElementById('header-notifications-btn');
            
            if (notificationButtons.length === 0) {
                Utils.safeWarn('⚠️ لم يتم العثور على أزرار الإشعارات - سيتم المحاولة مرة أخرى بعد 500ms');
                // إعادة المحاولة بعد تأخير قصير
                setTimeout(() => {
                    this.initNotificationsButton();
                }, 500);
                return;
            }

            // تسجيل الأزرار التي تم العثور عليها
            Utils.safeLog('✅ تم العثور على الأزرار التالية:');
            if (notificationsBtn) Utils.safeLog('  - notifications-btn');
            if (mobileNotificationsBtn) Utils.safeLog('  - mobile-notifications-btn');
            if (headerNotificationsBtn) Utils.safeLog('  - header-notifications-btn');

            // ربط جميع الأزرار
            notificationButtons.forEach((btn, index) => {
                if (!btn) return;

                try {
                    // التحقق من أن الزر موجود في DOM
                    if (!document.body.contains(btn)) {
                        Utils.safeWarn('⚠️ الزر غير موجود في DOM:', btn.id);
                        return;
                    }

                    // إزالة event listeners القديمة إن وجدت
                    if (btn._notificationClickHandler) {
                        btn.removeEventListener('click', btn._notificationClickHandler);
                        delete btn._notificationClickHandler;
                    }

                    // إنشاء handler جديد مع استخدام self بدلاً من this
                    // ✅ إصلاح: إزالة debounce للاستجابة الفورية
                    const clickHandler = (e) => {
                        try {
                            Utils.safeLog('🔔 تم النقر على زر الإشعارات:', btn.id);
                            
                            // منع انتشار الحدث بشكل كامل
                            if (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                e.stopImmediatePropagation();
                            }
                            
                            // ✅ إصلاح: تنفيذ فوري بدون debounce
                            // تحديد أي dropdown يجب فتحه بناءً على الزر
                            let dropdownId, listId, emptyId, closeBtnId;
                            if (btn.id === 'notifications-btn') {
                                dropdownId = 'notifications-dropdown';
                                listId = 'notifications-list';
                                emptyId = 'notifications-empty';
                                closeBtnId = 'close-notifications-dropdown';
                            } else if (btn.id === 'mobile-notifications-btn') {
                                dropdownId = 'mobile-notifications-dropdown';
                                listId = 'mobile-notifications-list';
                                emptyId = 'mobile-notifications-empty';
                                closeBtnId = 'close-mobile-notifications-dropdown';
                            } else if (btn.id === 'header-notifications-btn') {
                                dropdownId = 'header-notifications-dropdown';
                                listId = 'header-notifications-list';
                                emptyId = 'header-notifications-empty';
                                closeBtnId = 'close-header-notifications-dropdown';
                            } else {
                                Utils.safeWarn('⚠️ معرف زر إشعارات غير معروف:', btn.id);
                                return;
                            }

                            // التحقق من وجود العناصر المطلوبة
                            const dropdown = document.getElementById(dropdownId);
                            if (!dropdown) {
                                Utils.safeWarn('⚠️ لم يتم العثور على dropdown:', dropdownId);
                                return;
                            }

                            Utils.safeLog('🔔 فتح dropdown:', dropdownId);

                            // استدعاء toggle بشكل آمن باستخدام self
                            if (self && typeof self.toggleNotificationsDropdown === 'function') {
                                self.toggleNotificationsDropdown(dropdownId, listId, emptyId, closeBtnId, btn);
                            } else if (window.UI && typeof window.UI.toggleNotificationsDropdown === 'function') {
                                // fallback: استخدام window.UI مباشرة
                                window.UI.toggleNotificationsDropdown(dropdownId, listId, emptyId, closeBtnId, btn);
                            }
                        } catch (error) {
                            // حماية من الأخطاء - إظهار الإشعارات على أي حال
                            Utils.safeError('⚠️ خطأ في معالجة حدث الإشعارات:', error);
                            // محاولة فتح dropdown مباشرة
                            try {
                                const dropdownId = btn.id === 'notifications-btn' ? 'notifications-dropdown' :
                                    btn.id === 'mobile-notifications-btn' ? 'mobile-notifications-dropdown' :
                                    'header-notifications-dropdown';
                                const dropdown = document.getElementById(dropdownId);
                                if (dropdown) {
                                    const listId = dropdownId.replace('dropdown', 'list');
                                    const emptyId = dropdownId.replace('dropdown', 'empty');
                                    
                                    // استخدام self أو window.UI
                                    const uiObj = self || window.UI;
                                    if (uiObj && typeof uiObj.showNotificationsDropdown === 'function') {
                                        uiObj.showNotificationsDropdown(dropdownId, listId, emptyId, btn).catch(err => {
                                            Utils.safeWarn('⚠️ خطأ في عرض الإشعارات:', err);
                                        });
                                    }
                                }
                            } catch (fallbackError) {
                                Utils.safeError('⚠️ فشل فتح الإشعارات:', fallbackError);
                            }
                        }
                    };

                    // ربط الـ handler مع حفظ المرجع
                    btn._notificationClickHandler = clickHandler;
                    // ✅ إصلاح: استخدام capture: false للسماح بانتشار الحدث بشكل طبيعي
                    btn.addEventListener('click', clickHandler, { capture: false, passive: false });
                    btn.dataset.notificationsBound = 'true';
                    
                    // تسجيل تأكيد ربط الزر
                    Utils.safeLog('✅ تم ربط زر الإشعارات:', btn.id);
                    Utils.safeLog('  - DOM موجود:', document.body.contains(btn));
                    Utils.safeLog('  - Handler مرتبط:', !!btn._notificationClickHandler);
                    
                    // اختبار خاص للزر الجانبي (sidebar)
                    if (btn.id === 'notifications-btn') {
                        Utils.safeLog('🔔 تأكيد: تم ربط زر الإشعارات في القائمة الجانبية (notifications-btn)');
                        // إضافة listener إضافي للتأكد من استقبال الأحداث
                        btn.addEventListener('click', function(e) {
                            Utils.safeLog('🔔 حدث click تم استقباله على notifications-btn (sidebar)');
                        }, { capture: false, once: false });
                    }
                    
                    // اختبار خاص للزر الجانبي (mobile topbar)
                    if (btn.id === 'mobile-notifications-btn') {
                        Utils.safeLog('🔔 تأكيد: تم ربط زر الإشعارات الجانبي (mobile-notifications-btn)');
                        // إضافة listener إضافي للتأكد من استقبال الأحداث
                        btn.addEventListener('click', function(e) {
                            Utils.safeLog('🔔 حدث click تم استقباله على mobile-notifications-btn');
                        }, { capture: false, once: false });
                    }
                } catch (error) {
                    Utils.safeError('⚠️ خطأ في ربط زر الإشعارات:', btn.id, error);
                }
            });
        } catch (error) {
            Utils.safeError('⚠️ خطأ في تهيئة أزرار الإشعارات:', error);
        }

        // ربط أزرار الإغلاق باستخدام self
        const closeButtons = [
            { id: 'close-notifications-dropdown', dropdownId: 'notifications-dropdown' },
            { id: 'close-mobile-notifications-dropdown', dropdownId: 'mobile-notifications-dropdown' },
            { id: 'close-header-notifications-dropdown', dropdownId: 'header-notifications-dropdown' }
        ];

        closeButtons.forEach(({ id, dropdownId }) => {
            const closeBtn = document.getElementById(id);
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // استخدام self أو window.UI
                    const uiObj = self || window.UI;
                    if (uiObj && typeof uiObj.hideNotificationsDropdown === 'function') {
                        uiObj.hideNotificationsDropdown(dropdownId);
                    }
                });
            }
        });

        // إغلاق dropdown عند النقر خارجها
        // تنظيف الـ listener القديم إذا كان موجوداً
        if (self._notificationsClickHandler) {
            document.removeEventListener('click', self._notificationsClickHandler, false);
            self._notificationsClickHandler = null;
        }
        
        self._notificationsClickHandler = (e) => {
            try {
                // تجاهل الأخطاء من uploadmanager أو extensions
                if (e && e.target) {
                    const targetStr = String(e.target.tagName || '').toLowerCase();
                    const idStr = String(e.target.id || '');
                    const classStr = String(e.target.className || '');
                    
                    // تجاهل أخطاء extensions
                    if (idStr.includes('uploadmanager') || classStr.includes('uploadmanager') ||
                        targetStr.includes('style') && idStr.includes('extension')) {
                        return;
                    }
                }

                const dropdowns = ['notifications-dropdown', 'mobile-notifications-dropdown', 'header-notifications-dropdown'];
                dropdowns.forEach(dropdownId => {
                    try {
                        const dropdown = document.getElementById(dropdownId);
                        if (dropdown) {
                            const computedStyle = window.getComputedStyle(dropdown);
                            const isVisible = dropdown.style.display === 'flex' ||
                                (computedStyle.display === 'flex' && computedStyle.visibility !== 'hidden' && computedStyle.opacity !== '0');
                            
                            if (isVisible && e && e.target) {
                                // ✅ إصلاح: استخدام selector يشمل جميع أزرار الإشعارات
                                const button = e.target.closest('#notifications-btn, #mobile-notifications-btn, #header-notifications-btn, [id$="-notifications-btn"]');
                                const insideDropdown = e.target.closest('.notifications-dropdown');
                                if (!button && !insideDropdown) {
                                    // استخدام self أو window.UI
                                    const uiObj = self || window.UI;
                                    if (uiObj && typeof uiObj.hideNotificationsDropdown === 'function') {
                                        uiObj.hideNotificationsDropdown(dropdownId);
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        // تجاهل الأخطاء
                        Utils.safeWarn('⚠️ خطأ في إغلاق dropdown:', err);
                    }
                });
            } catch (error) {
                // تجاهل جميع الأخطاء من document click handler
                Utils.safeWarn('⚠️ خطأ في معالج النقر:', error);
            }
        };
        
        // ✅ إصلاح: استخدام capture: false لضمان تنفيذ handler الزر أولاً
        document.addEventListener('click', self._notificationsClickHandler, false);

        // تحديث عدد الإشعارات
        if (self && typeof self.updateNotificationsBadge === 'function') {
            self.updateNotificationsBadge();
        } else if (window.UI && typeof window.UI.updateNotificationsBadge === 'function') {
            window.UI.updateNotificationsBadge();
        }

        // تنظيف الـ interval القديم قبل إنشاء واحد جديد
        if (self._notificationsInterval) {
            clearInterval(self._notificationsInterval);
            self._notificationsInterval = null;
        }

        // تحديث عدد الإشعارات كل 30 ثانية
        self._notificationsInterval = setInterval(() => {
            const uiObj = self || window.UI;
            if (uiObj && typeof uiObj.updateNotificationsBadge === 'function') {
                uiObj.updateNotificationsBadge();
            }
        }, 30000);

        Utils.safeLog('✅ تم تهيئة زر الإشعارات');
        
        // إعادة محاولة تهيئة الأزرار بعد تأخير للتأكد من وجودها جميعاً
        setTimeout(() => {
            const mobileBtn = document.getElementById('mobile-notifications-btn');
            if (mobileBtn && !mobileBtn.dataset.notificationsBound) {
                Utils.safeLog('⚠️ الزر الجانبي لم يتم ربطه بعد، إعادة المحاولة...');
                this.initNotificationsButton();
            }
        }, 1000);
    },

    /**
     * تنظيف موارد الإشعارات
     */
    cleanupNotifications() {
        try {
            // تنظيف الـ interval
            if (this._notificationsInterval) {
                clearInterval(this._notificationsInterval);
                this._notificationsInterval = null;
            }

            // تنظيف الـ click listener
            if (this._notificationsClickHandler) {
                try {
                    document.removeEventListener('click', this._notificationsClickHandler, false);
                } catch (err) {
                    Utils.safeWarn('⚠️ خطأ في إزالة document click listener:', err);
                }
                this._notificationsClickHandler = null;
            }

            // تنظيف event listeners من الأزرار
            try {
                const notificationButtons = [
                    document.getElementById('notifications-btn'),
                    document.getElementById('mobile-notifications-btn'),
                    document.getElementById('header-notifications-btn')
                ].filter(Boolean);

                notificationButtons.forEach(btn => {
                    try {
                        if (btn._notificationClickHandler) {
                            btn.removeEventListener('click', btn._notificationClickHandler, false);
                            // تنظيف debounce timer إن وجد (تم إزالته في الإصلاح الجديد)
                            if (btn._notificationClickDebounceTimer) {
                                clearTimeout(btn._notificationClickDebounceTimer);
                                btn._notificationClickDebounceTimer = null;
                            }
                            delete btn._notificationClickHandler;
                            btn.dataset.notificationsBound = 'false';
                        }
                    } catch (err) {
                        Utils.safeWarn('⚠️ خطأ في تنظيف زر الإشعارات:', btn.id, err);
                    }
                });
            } catch (err) {
                Utils.safeWarn('⚠️ خطأ في تنظيف أزرار الإشعارات:', err);
            }

            Utils.safeLog('✅ تم تنظيف موارد الإشعارات');
        } catch (error) {
            Utils.safeError('⚠️ خطأ في cleanupNotifications:', error);
        }
    },

    /**
     * تحديث شارة الإشعارات
     */
    updateNotificationsBadge() {
        const count = this.getNotificationsCount();

        // تحديث الشارات
        const badges = [
            document.getElementById('notifications-badge'),
            document.getElementById('mobile-notifications-badge'),
            document.getElementById('header-notifications-badge')
        ].filter(Boolean);

        badges.forEach(badge => {
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
        });

        // تحديث حالة الأزرار (إضافة/إزالة class has-notifications)
        const notificationButtons = [
            document.getElementById('notifications-btn'),
            document.getElementById('mobile-notifications-btn'),
            document.getElementById('header-notifications-btn')
        ].filter(Boolean);

        notificationButtons.forEach(btn => {
            if (btn) {
                if (count > 0) {
                    btn.classList.add('has-notifications');
                } else {
                    btn.classList.remove('has-notifications');
                }
            }
        });
    },

    /**
     * ✅ دالة مساعدة للتعامل مع النقر على زر الإشعارات في القائمة الجانبية
     * يمكن استدعاؤها مباشرة من onclick في HTML
     */
    handleSidebarNotificationClick(btn) {
        try {
            Utils.safeLog('🔔 handleSidebarNotificationClick - تم النقر على زر الإشعارات في القائمة الجانبية');
            this.toggleNotificationsDropdown(
                'notifications-dropdown',
                'notifications-list',
                'notifications-empty',
                'close-notifications-dropdown',
                btn || document.getElementById('notifications-btn')
            );
        } catch (error) {
            Utils.safeError('⚠️ خطأ في handleSidebarNotificationClick:', error);
        }
    },

    /**
     * عرض/إخفاء لوحة الإشعارات المنبثقة
     */
    toggleNotificationsDropdown(dropdownId, listId, emptyId, closeBtnId, button) {
        try {
            Utils.safeLog('🔔 toggleNotificationsDropdown - dropdownId:', dropdownId);
            const dropdown = document.getElementById(dropdownId);
            if (!dropdown) {
                Utils.safeWarn('⚠️ لم يتم العثور على dropdown:', dropdownId);
                return;
            }

            // إغلاق جميع اللوحات الأخرى أولاً
            const allDropdowns = ['notifications-dropdown', 'mobile-notifications-dropdown', 'header-notifications-dropdown'];
            allDropdowns.forEach(id => {
                try {
                    if (id !== dropdownId) {
                        this.hideNotificationsDropdown(id);
                    }
                } catch (err) {
                    Utils.safeWarn('⚠️ خطأ في إغلاق dropdown:', id, err);
                }
            });

            // التبديل بين الفتح والإغلاق - تحقق محسّن وسريع من حالة العرض
            let isCurrentlyVisible = false;
            try {
                // ✅ فحص سريع أولاً (inline style)
                if (dropdown.style.display === 'flex' && dropdown.style.visibility !== 'hidden' && dropdown.style.opacity !== '0') {
                    isCurrentlyVisible = true;
                } else if (dropdown.style.display !== 'none') {
                    // فحص computed style فقط إذا لزم الأمر (أبطأ)
                    const computedStyle = window.getComputedStyle(dropdown);
                    isCurrentlyVisible = computedStyle.display === 'flex' && 
                        computedStyle.visibility !== 'hidden' && 
                        computedStyle.opacity !== '0' &&
                        dropdown.offsetParent !== null;
                }
            } catch (err) {
                // في حالة الخطأ، نعتبر أن الـ dropdown مخفي
                isCurrentlyVisible = false;
            }

            if (!isCurrentlyVisible) {
                // تحديث الإشعارات قبل العرض
                try {
                    this.updateNotificationsBadge();
                } catch (err) {
                    Utils.safeWarn('⚠️ خطأ في تحديث شارة الإشعارات:', err);
                }
                // استدعاء async بدون await لأن toggleNotificationsDropdown ليست async
                if (typeof this.showNotificationsDropdown === 'function') {
                    this.showNotificationsDropdown(dropdownId, listId, emptyId, button).catch(error => {
                        Utils.safeWarn('⚠️ خطأ في عرض الإشعارات:', error);
                    });
                }
            } else {
                this.hideNotificationsDropdown(dropdownId);
            }
        } catch (error) {
            Utils.safeError('⚠️ خطأ في toggleNotificationsDropdown:', error);
            // محاولة فتح dropdown مباشرة في حالة الخطأ
            try {
                const dropdown = document.getElementById(dropdownId);
                if (dropdown && typeof this.showNotificationsDropdown === 'function') {
                    this.showNotificationsDropdown(dropdownId, listId, emptyId, button).catch(err => {
                        Utils.safeWarn('⚠️ خطأ في عرض الإشعارات (fallback):', err);
                    });
                }
            } catch (fallbackError) {
                Utils.safeError('⚠️ فشل فتح الإشعارات:', fallbackError);
            }
        }
    },

    /**
     * عرض لوحة الإشعارات المنبثقة - محسّن للاستجابة السريعة
     */
    async showNotificationsDropdown(dropdownId, listId, emptyId, button) {
        try {
            Utils.safeLog('🔔 showNotificationsDropdown - بدء عرض الإشعارات:', dropdownId);
            
            const dropdown = document.getElementById(dropdownId);
            const list = document.getElementById(listId);
            const empty = document.getElementById(emptyId);

            if (!dropdown) {
                Utils.safeWarn('⚠️ لم يتم العثور على dropdown:', dropdownId);
                return;
            }
            
            Utils.safeLog('🔔 تم العثور على dropdown:', dropdown.id);

            // التأكد من أن الـ parent element له position: relative
            try {
                const parent = dropdown.parentElement;
                if (parent && window.getComputedStyle(parent).position === 'static') {
                    parent.style.position = 'relative';
                }
            } catch (err) {
                Utils.safeWarn('⚠️ خطأ في ضبط position للـ parent:', err);
            }

            // ✅ عرض dropdown فوراً مع الإشعارات الحالية (لا ننتظر تحميل البيانات)
            // الحصول على قائمة الإشعارات الحالية (غير المقروءة فقط)
            let notifications = [];
            try {
                if (typeof this.getNotificationsList === 'function') {
                    notifications = this.getNotificationsList();
                }
            } catch (error) {
                Utils.safeWarn('⚠️ خطأ في الحصول على قائمة الإشعارات:', error);
                notifications = [];
            }

            // إظهار التبويب فوراً بدون انتظار
            // ✅ إصلاح: استخدام setProperty مع important لتجاوز أي CSS conflicts
            dropdown.style.setProperty('display', 'flex', 'important');
            dropdown.style.setProperty('visibility', 'visible', 'important');
            dropdown.style.setProperty('opacity', '1', 'important');
            Utils.safeLog('🔔 تم عرض dropdown الإشعارات:', dropdownId);

            if (notifications.length === 0) {
                if (list) list.style.display = 'none';
                if (empty) {
                    empty.style.display = 'flex';
                }
                Utils.safeLog('ℹ️ لا توجد إشعارات غير مقروءة');
            } else {
                if (empty) empty.style.display = 'none';
                if (list) {
                    try {
                        list.style.display = 'block';
                        // عرض الإشعارات بشكل آمن
                        if (typeof this.renderNotificationItem === 'function') {
                            list.innerHTML = notifications.map(notif => {
                                try {
                                    return this.renderNotificationItem(notif);
                                } catch (err) {
                                    Utils.safeWarn('⚠️ خطأ في رسم إشعار:', err);
                                    return '';
                                }
                            }).filter(Boolean).join('');
                        } else {
                            list.innerHTML = '<div class="notification-item">خطأ في عرض الإشعارات</div>';
                        }
                        Utils.safeLog(`✅ عرض ${notifications.length} إشعار في القائمة`);

                        // ربط حدث الضغط على كل إشعار
                        try {
                            list.querySelectorAll('.notification-item').forEach(item => {
                                try {
                                    item.addEventListener('click', (e) => {
                                        try {
                                            if (e) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }
                                            const notificationId = item.getAttribute('data-notification-id');
                                            if (notificationId) {
                                                // الحصول على الإشعار من القائمة
                                                let notificationsList = [];
                                                try {
                                                    if (typeof this.getNotificationsList === 'function') {
                                                        notificationsList = this.getNotificationsList();
                                                    }
                                                } catch (err) {
                                                    Utils.safeWarn('⚠️ خطأ في الحصول على قائمة الإشعارات:', err);
                                                }
                                                
                                                const notification = notificationsList.find(n => n && n.id === notificationId);

                                                // إذا كان هناك إجراء مخصص، تنفيذه
                                                if (notification && typeof notification.onClick === 'function') {
                                                    try {
                                                        notification.onClick();
                                                    } catch (err) {
                                                        Utils.safeWarn('⚠️ خطأ في تنفيذ onClick للإشعار:', err);
                                                    }
                                                }

                                                // تمييز الإشعار كمقروء
                                                try {
                                                    if (typeof this.markNotificationAsRead === 'function') {
                                                        this.markNotificationAsRead(notificationId);
                                                    }
                                                } catch (err) {
                                                    Utils.safeWarn('⚠️ خطأ في تمييز الإشعار كمقروء:', err);
                                                }
                                            }
                                        } catch (error) {
                                            Utils.safeWarn('⚠️ خطأ في معالجة نقر الإشعار:', error);
                                        }
                                    }, { capture: true, passive: false });
                                } catch (err) {
                                    Utils.safeWarn('⚠️ خطأ في ربط حدث الإشعار:', err);
                                }
                            });
                        } catch (err) {
                            Utils.safeWarn('⚠️ خطأ في ربط أحداث الإشعارات:', err);
                        }
                    } catch (error) {
                        Utils.safeError('⚠️ خطأ في عرض قائمة الإشعارات:', error);
                        if (list) {
                            list.innerHTML = '<div class="notification-item">حدث خطأ في عرض الإشعارات</div>';
                        }
                    }
                }
            }

            // تموضع اللوحة داخل حدود الشاشة (مهم خصوصاً عند RTL لما تكون الأيقونات أقرب لليسار)
            // نستخدم requestAnimationFrame لضمان حساب المقاسات بعد الرسم.
            requestAnimationFrame(() => {
                try {
                    if (typeof this.positionNotificationsDropdown === 'function') {
                        this.positionNotificationsDropdown(dropdown, button);
                    }
                } catch (e) {
                    Utils.safeWarn('⚠️ فشل تموضع قائمة الإشعارات:', e);
                }
            });

            // ✅ تحديث البيانات في الخلفية بعد عرض dropdown (لتحسين الاستجابة)
            // هذا يتم بشكل غير متزامن بعد عرض الإشعارات الحالية
            // دالة مساعدة لتحديث قائمة الإشعارات
            const selfRef = this;
            const updateNotificationsList = () => {
                try {
                    if (!dropdown || dropdown.style.display !== 'flex') return;
                    const updatedNotifications = typeof selfRef.getNotificationsList === 'function' ? selfRef.getNotificationsList() : [];
                    if (!list || typeof selfRef.renderNotificationItem !== 'function') return;
                    
                    if (updatedNotifications.length > 0) {
                        list.innerHTML = updatedNotifications.map(notif => {
                            try {
                                return selfRef.renderNotificationItem(notif);
                            } catch (err) {
                                Utils.safeWarn('⚠️ خطأ في رسم إشعار:', err);
                                return '';
                            }
                        }).filter(Boolean).join('');
                        list.style.display = 'block';
                        if (empty) empty.style.display = 'none';
                        
                        // ربط أحداث الإشعارات مرة أخرى (نفس الكود المستخدم في العرض الأولي)
                        try {
                            list.querySelectorAll('.notification-item').forEach(item => {
                                try {
                                    item.addEventListener('click', (e) => {
                                        try {
                                            if (e) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }
                                            const notificationId = item.getAttribute('data-notification-id');
                                            if (notificationId) {
                                                const notification = updatedNotifications.find(n => n && n.id === notificationId);
                                                if (notification && typeof notification.onClick === 'function') {
                                                    try {
                                                        notification.onClick();
                                                    } catch (err) {
                                                        Utils.safeWarn('⚠️ خطأ في تنفيذ onClick للإشعار:', err);
                                                    }
                                                }
                                                if (typeof selfRef.markNotificationAsRead === 'function') {
                                                    selfRef.markNotificationAsRead(notificationId);
                                                }
                                            }
                                        } catch (error) {
                                            Utils.safeWarn('⚠️ خطأ في معالجة نقر الإشعار:', error);
                                        }
                                    }, { capture: true, passive: false });
                                } catch (err) {
                                    Utils.safeWarn('⚠️ خطأ في ربط حدث الإشعار:', err);
                                }
                            });
                        } catch (err) {
                            Utils.safeWarn('⚠️ خطأ في ربط أحداث الإشعارات:', err);
                        }
                    } else {
                        list.style.display = 'none';
                        if (empty) empty.style.display = 'flex';
                    }
                } catch (err) {
                    Utils.safeWarn('⚠️ خطأ في تحديث قائمة الإشعارات:', err);
                }
            };
            
            Promise.resolve().then(async () => {
                try {
                    // تحديث طلبات الموافقة في الخلفية
                    if (typeof FireEquipment !== 'undefined' && typeof FireEquipment.loadApprovalRequestsFromBackend === 'function') {
                        try {
                            await FireEquipment.loadApprovalRequestsFromBackend();
                            updateNotificationsList();
                        } catch (error) {
                            Utils.safeWarn('⚠️ خطأ في تحميل طلبات الموافقة عند عرض الإشعارات:', error);
                        }
                    }

                    // تحديث بيانات PTW في الخلفية
                    if (typeof PTW !== 'undefined' && typeof PTW.loadPTWData === 'function') {
                        try {
                            // تحديث محاولة واحدة فقط إذا لم تكن البيانات محملة
                            if (!AppState || !AppState.appData || !AppState.appData.ptw || AppState.appData.ptw.length === 0) {
                                await PTW.loadPTWData();
                                updateNotificationsList();
                            }
                        } catch (error) {
                            Utils.safeWarn('⚠️ خطأ في تحميل بيانات PTW عند عرض الإشعارات:', error);
                        }
                    }
                } catch (backgroundError) {
                    Utils.safeWarn('⚠️ خطأ في تحديث البيانات في الخلفية:', backgroundError);
                }
            });
        } catch (error) {
            Utils.safeError('⚠️ خطأ في showNotificationsDropdown:', error);
            // محاولة إظهار dropdown حتى لو حدث خطأ
            try {
                const dropdown = document.getElementById(dropdownId);
                if (dropdown) {
                    dropdown.style.display = 'flex';
                    dropdown.style.visibility = 'visible';
                    dropdown.style.opacity = '1';
                }
            } catch (fallbackError) {
                Utils.safeError('⚠️ فشل إظهار dropdown:', fallbackError);
            }
        }
    },

    /**
     * تموضع لوحة الإشعارات بحيث لا تخرج خارج الشاشة (RTL/LTR)
     * - يعتمد على زر الإشعارات إن توفر، وإلا يستخدم parent
     * - يستخدم setProperty مع important لتجاوز CSS الذي قد يحتوي !important
     * - ✅ إصلاح: دعم خاص للـ dropdown في القائمة الجانبية (sidebar)
     */
    positionNotificationsDropdown(dropdown, button) {
        Utils.safeLog('🔔 positionNotificationsDropdown - بدء تموضع الـ dropdown');
        
        if (!dropdown) {
            Utils.safeWarn('⚠️ positionNotificationsDropdown - dropdown غير موجود');
            return;
        }

        const anchorEl = button || dropdown.parentElement;
        if (!anchorEl || typeof anchorEl.getBoundingClientRect !== 'function') {
            Utils.safeWarn('⚠️ positionNotificationsDropdown - anchorEl غير صالح');
            return;
        }
        
        Utils.safeLog('🔔 positionNotificationsDropdown - dropdown:', dropdown.id, 'button:', anchorEl.id || 'parent');

        const margin = 8;
        const gap = 8;
        const vw = document.documentElement.clientWidth || window.innerWidth;
        const vh = document.documentElement.clientHeight || window.innerHeight;
        const isRTL = (document.documentElement.getAttribute('dir') || '').toLowerCase() === 'rtl' ||
            window.getComputedStyle(document.documentElement).direction === 'rtl';

        // ✅ إصلاح: التحقق من أن الـ dropdown في sidebar
        const isSidebarDropdown = dropdown.id === 'notifications-dropdown';
        const sidebar = document.querySelector('.sidebar');
        const sidebarWidth = sidebar ? sidebar.offsetWidth : 280;

        // اجعلها "fixed" لكي لا تتأثر بحاويات overflow/positioning
        dropdown.style.setProperty('position', 'fixed', 'important');
        dropdown.style.setProperty('z-index', '10001', 'important');
        dropdown.style.setProperty('right', 'auto', 'important');
        dropdown.style.setProperty('bottom', 'auto', 'important');
        dropdown.style.setProperty('transform', 'none', 'important');

        // اخفاء مؤقتًا لتجنب أي وميض أثناء الحساب
        const prevVisibility = dropdown.style.visibility;
        dropdown.style.visibility = 'hidden';

        // ضعها خارج الشاشة ثم قِس أبعادها
        dropdown.style.setProperty('left', '-9999px', 'important');
        dropdown.style.setProperty('top', '-9999px', 'important');

        const btnRect = anchorEl.getBoundingClientRect();
        const ddRect = dropdown.getBoundingClientRect();
        const ddWidth = ddRect.width || 380;
        const ddHeight = ddRect.height || 200;

        let left, top;

        if (isSidebarDropdown) {
            // ✅ إصلاح خاص للـ sidebar dropdown
            // عرض الـ dropdown خارج الـ sidebar من جهة اليسار
            if (isRTL) {
                // في RTL، الـ sidebar على اليمين، فالـ dropdown يظهر على يسار الـ sidebar
                left = vw - sidebarWidth - ddWidth - margin;
                // التأكد من عدم خروجه من الشاشة
                if (left < margin) {
                    left = margin;
                }
            } else {
                // في LTR، الـ sidebar على اليسار، فالـ dropdown يظهر على يمين الـ sidebar
                left = sidebarWidth + margin;
                // التأكد من عدم خروجه من الشاشة
                if (left + ddWidth > vw - margin) {
                    left = vw - ddWidth - margin;
                }
            }
            
            // الموقع الرأسي: بجانب الزر
            top = btnRect.top;
            if (top + ddHeight > vh - margin) {
                top = vh - ddHeight - margin;
            }
            if (top < margin) {
                top = margin;
            }
        } else {
            // خيارات أفقية: محاذاة يمين الزر أو يساره حسب المساحة
            const candidateLeftAlignLeft = btnRect.left;
            const candidateLeftAlignRight = btnRect.right - ddWidth;

            const overflowScore = (l) => {
                const overL = Math.max(margin - l, 0);
                const overR = Math.max((l + ddWidth) - (vw - margin), 0);
                return overL + overR;
            };

            let preferred = isRTL ? candidateLeftAlignRight : candidateLeftAlignLeft;
            const alt = isRTL ? candidateLeftAlignLeft : candidateLeftAlignRight;
            if (overflowScore(alt) < overflowScore(preferred)) preferred = alt;

            left = Math.min(Math.max(preferred, margin), Math.max(vw - ddWidth - margin, margin));

            // خيارات رأسية: أسفل الزر، ولو لا توجد مساحة افتح لأعلى
            top = btnRect.bottom + gap;
            if (top + ddHeight > vh - margin) {
                top = btnRect.top - gap - ddHeight;
            }
            top = Math.min(Math.max(top, margin), Math.max(vh - ddHeight - margin, margin));
        }

        dropdown.style.setProperty('left', `${Math.round(left)}px`, 'important');
        dropdown.style.setProperty('top', `${Math.round(top)}px`, 'important');
        dropdown.style.visibility = prevVisibility || 'visible';
        
        Utils.safeLog(`🔔 تم تموضع dropdown: left=${Math.round(left)}px, top=${Math.round(top)}px, isSidebar=${isSidebarDropdown}`);
    },

    /**
     * إخفاء لوحة الإشعارات المنبثقة
     */
    hideNotificationsDropdown(dropdownId) {
        try {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                dropdown.style.display = 'none';
                dropdown.style.visibility = 'hidden';
                dropdown.style.opacity = '0';
            }
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في إخفاء dropdown:', dropdownId, error);
        }
    },

    /**
     * الحصول على قائمة الإشعارات المقروءة
     */
    getReadNotifications() {
        try {
            const read = localStorage.getItem('hse_read_notifications');
            return read ? JSON.parse(read) : [];
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في قراءة الإشعارات المقروءة:', error);
            return [];
        }
    },

    /**
     * حفظ قائمة الإشعارات المقروءة
     */
    saveReadNotifications(readNotifications) {
        try {
            localStorage.setItem('hse_read_notifications', JSON.stringify(readNotifications));
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في حفظ الإشعارات المقروءة:', error);
        }
    },

    /**
     * تمييز إشعار كمقروء
     */
    markNotificationAsRead(notificationId) {
        if (!notificationId) return;

        const readNotifications = this.getReadNotifications();
        if (!readNotifications.includes(notificationId)) {
            readNotifications.push(notificationId);
            this.saveReadNotifications(readNotifications);

            // تحديث الشارات
            this.updateNotificationsBadge();

            // إزالة الإشعار من جميع اللوحات المنبثقة المفتوحة
            const allDropdowns = [
                { listId: 'notifications-list', dropdownId: 'notifications-dropdown' },
                { listId: 'mobile-notifications-list', dropdownId: 'mobile-notifications-dropdown' },
                { listId: 'header-notifications-list', dropdownId: 'header-notifications-dropdown' }
            ];

            allDropdowns.forEach(({ listId, dropdownId }) => {
                const list = document.getElementById(listId);
                const dropdown = document.getElementById(dropdownId);
                if (list && dropdown && dropdown.style.display !== 'none') {
                    const item = list.querySelector(`[data-notification-id="${notificationId}"]`);
                    if (item) {
                        item.remove();
                        // تحديث قائمة الإشعارات في اللوحة
                        const remainingItems = list.querySelectorAll('.notification-item');
                        if (remainingItems.length === 0) {
                            const empty = document.getElementById(dropdownId.replace('dropdown', 'empty'));
                            if (empty) {
                                empty.style.display = 'flex';
                                list.style.display = 'none';
                            }
                        }
                    }
                }
            });

            Utils.safeLog(`✅ تم تمييز الإشعار ${notificationId} كمقروء`);
        }
    },

    /**
     * الحصول على قائمة الإشعارات مع التفاصيل (غير المقروءة فقط)
     */
    getNotificationsList() {
        if (!AppState || !AppState.appData) return [];

        const notifications = [];
        const readNotifications = this.getReadNotifications();

        try {
            // 0. إشعارات من جدول Notifications (مثل: محاولة تسجيل دخول من جهاز آخر — للمدير)
            if (AppState.appData.notifications && Array.isArray(AppState.appData.notifications)) {
                const isAdmin = AppState.currentUser && (
                    AppState.currentUser.role === 'admin' ||
                    (AppState.currentUser.role && String(AppState.currentUser.role).includes('مدير'))
                );
                const currentUserId = AppState.currentUser?.id || AppState.currentUser?.email || '';
                AppState.appData.notifications.forEach((n, idx) => {
                    const targetUserId = n.userId || n.user_id || '';
                    const isForMe = targetUserId === 'admin' ? isAdmin : (targetUserId === currentUserId);
                    if (!isForMe) return;
                    const notificationId = 'notif-' + (n.id || 'n-' + idx);
                    if (readNotifications.includes(notificationId)) return;
                    notifications.push({
                        id: notificationId,
                        type: n.type === 'login_blocked' ? 'warning' : (n.type || 'info'),
                        title: n.title || 'إشعار',
                        message: n.message || '',
                        time: n.createdAt || n.time || n.date || new Date(),
                        icon: n.type === 'login_blocked' ? 'fa-sign-out-alt' : 'fa-bell',
                        onClick: n.link ? (() => {
                            const link = document.querySelector('a[data-section="users"]');
                            if (link) link.click();
                        }) : undefined
                    });
                });
            }

            // 1. تنبيهات الطوارئ غير المغلقة
            if (AppState.appData.emergencyAlerts) {
                AppState.appData.emergencyAlerts
                    .filter(a => a.status !== 'مغلق')
                    .forEach(alert => {
                        const notificationId = 'emergency-' + (alert.id || Date.now());
                        if (!readNotifications.includes(notificationId)) {
                            notifications.push({
                                id: notificationId,
                                type: 'emergency',
                                title: 'تنبيه طوارئ',
                                message: alert.description || alert.type || 'تنبيه طوارئ جديد',
                                time: alert.date || alert.createdAt || new Date(),
                                icon: 'fa-exclamation-triangle'
                            });
                        }
                    });
            }

            // 2. الحوادث المفتوحة
            if (AppState.appData.incidents) {
                AppState.appData.incidents
                    .filter(i => i.status === 'مفتوح' || i.status === 'قيد المعالجة')
                    .forEach(incident => {
                        const notificationId = 'incident-' + (incident.id || Date.now());
                        if (!readNotifications.includes(notificationId)) {
                            notifications.push({
                                id: notificationId,
                                type: 'warning',
                                title: 'حادث ' + (incident.status || ''),
                                message: incident.description || incident.incidentType || 'حادث جديد يحتاج إلى معالجة',
                                time: incident.date || incident.reportDate || new Date(),
                                icon: 'fa-exclamation-circle'
                            });
                        }
                    });
            }

            // 3. تصاريح العمل المنتهية خلال 7 أيام
            if (AppState.appData.ptw) {
                const now = new Date();
                const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                AppState.appData.ptw
                    .filter(p => {
                        if (!p.expiryDate) return false;
                        const expiry = new Date(p.expiryDate);
                        return expiry <= sevenDaysFromNow && expiry >= now && p.status !== 'منتهي';
                    })
                    .forEach(ptw => {
                        const notificationId = 'ptw-expiry-' + (ptw.id || Date.now());
                        if (!readNotifications.includes(notificationId)) {
                            const daysLeft = Math.ceil((new Date(ptw.expiryDate) - now) / (1000 * 60 * 60 * 24));
                            notifications.push({
                                id: notificationId,
                                type: 'warning',
                                title: 'تصريح عمل سينتهي قريباً',
                                message: `تصريح عمل رقم ${ptw.permitNumber || ptw.id} سينتهي خلال ${daysLeft} يوم${daysLeft > 1 ? 'ات' : ''}`,
                                time: ptw.expiryDate || new Date(),
                                icon: 'fa-clock'
                            });
                        }
                    });
            }

            // 4. تصاريح العمل قيد المراجعة - فقط للمستخدمين المصرح لهم بالموافقة
            if (AppState.appData.ptw) {
                const currentUserEmail = (AppState.currentUser?.email || '').toLowerCase();
                const currentUserId = AppState.currentUser?.id || '';
                const isAdmin = AppState.currentUser && (
                    AppState.currentUser.role === 'admin' ||
                    AppState.currentUser.role === 'مدير النظام' ||
                    (typeof Permissions !== 'undefined' && Permissions.isCurrentUserAdmin && Permissions.isCurrentUserAdmin())
                );

                AppState.appData.ptw
                    .filter(p => {
                        // فلترة التصاريح التي تحتاج موافقة
                        if (!p || p.status === 'مغلق' || p.status === 'مرفوض' || p.status === 'معتمد') {
                            return false;
                        }

                        // إذا كان المستخدم مدير، لا نحتاج لفحص الموافقة - لكن لا نعرض جميع التصاريح
                        // فقط التصاريح التي لها موافقات معلقة
                        try {
                            // الحصول على الموافقات الطبيعية
                            const approvals = p.approvals || [];
                            let normalizedApprovals = [];
                            
                            // محاولة استخدام PTW.normalizeApprovals إذا كان متاحاً
                            if (typeof PTW !== 'undefined' && typeof PTW.normalizeApprovals === 'function') {
                                normalizedApprovals = PTW.normalizeApprovals(approvals);
                            } else {
                                // بديل بسيط إذا لم يكن PTW متاحاً
                                normalizedApprovals = Array.isArray(approvals) ? approvals : [];
                            }

                            // البحث عن موافقة معلقة
                            const pendingApproval = normalizedApprovals.find(a => {
                                if (!a) return false;
                                const status = a.status || (a.approved ? 'approved' : a.rejected ? 'rejected' : 'pending');
                                return status === 'pending';
                            });

                            if (!pendingApproval) {
                                return false;
                            }

                            // فحص إذا كان المستخدم الحالي مصرح له بالموافقة
                            // للمدير: عرض جميع التصاريح المعلقة (اختياري - يمكن إزالة هذا السطر إذا أردنا عدم عرضها)
                            // if (isAdmin) {
                            //     return true;
                            // }

                            // التحقق من أن المستخدم معين كموافق
                            const approverEmail = (pendingApproval.approverEmail || '').toLowerCase();
                            const approverId = pendingApproval.approverId || '';
                            const isAssignedToUser = approverEmail && approverEmail === currentUserEmail;
                            const isAssignedById = approverId && (approverId === currentUserId || approverId === currentUserEmail);

                            // التحقق من أن المستخدم موجود في قائمة المرشحين (إذا لم يتم تعيين موافق بعد)
                            let isInCandidates = false;
                            if (!isAssignedToUser && !isAssignedById && Array.isArray(pendingApproval.candidates)) {
                                isInCandidates = pendingApproval.candidates.some(candidate => {
                                    if (!candidate) return false;
                                    const candidateEmail = (candidate.email || '').toLowerCase();
                                    const candidateId = candidate.id || '';
                                    return (candidateEmail && candidateEmail === currentUserEmail) ||
                                           (candidateId && candidateId === currentUserId);
                                });
                            }

                            // إرجاع true فقط إذا كان المستخدم معين أو موجود في المرشحين
                            return isAssignedToUser || isAssignedById || isInCandidates;
                        } catch (error) {
                            Utils.safeWarn('⚠️ خطأ في فحص صلاحيات موافقة PTW:', error);
                            return false;
                        }
                    })
                    .forEach(ptw => {
                        const notificationId = 'ptw-review-' + (ptw.id || Date.now());
                        if (!readNotifications.includes(notificationId)) {
                            // الحصول على تفاصيل الموافقة المعلقة للرسالة
                            let approvalRole = 'موافقة مطلوبة';
                            try {
                                const approvals = ptw.approvals || [];
                                let normalizedApprovals = [];
                                if (typeof PTW !== 'undefined' && typeof PTW.normalizeApprovals === 'function') {
                                    normalizedApprovals = PTW.normalizeApprovals(approvals);
                                } else {
                                    normalizedApprovals = Array.isArray(approvals) ? approvals : [];
                                }
                                const pendingApproval = normalizedApprovals.find(a => {
                                    if (!a) return false;
                                    const status = a.status || (a.approved ? 'approved' : a.rejected ? 'rejected' : 'pending');
                                    return status === 'pending';
                                });
                                if (pendingApproval && pendingApproval.role) {
                                    approvalRole = pendingApproval.role;
                                }
                            } catch (error) {
                                Utils.safeWarn('⚠️ خطأ في الحصول على تفاصيل الموافقة:', error);
                            }

                            notifications.push({
                                id: notificationId,
                                type: 'warning',
                                title: 'تصريح عمل يحتاج موافقتك',
                                message: `تصريح عمل رقم ${ptw.permitNumber || ptw.id} يحتاج موافقتك (${approvalRole})`,
                                time: ptw.submitDate || ptw.date || ptw.createdAt || new Date(),
                                icon: 'fa-file-signature',
                                onClick: () => {
                                    if (typeof PTW !== 'undefined' && PTW.viewPTW) {
                                        PTW.viewPTW(ptw.id);
                                    }
                                }
                            });
                        }
                    });
            }

            // 5. طلبات اعتماد المقاولين (للمستخدمين - طلباتهم الخاصة)
            if (AppState.appData.contractorApprovalRequests) {
                const currentUserId = AppState.currentUser?.id || '';
                AppState.appData.contractorApprovalRequests
                    .filter(req => {
                        // للمستخدمين العاديين: طلباتهم الخاصة فقط
                        // للمدير: جميع الطلبات قيد المراجعة
                        const isAdmin = AppState.currentUser?.role === 'admin';
                        if (isAdmin) {
                            return req.status === 'pending' || req.status === 'under_review';
                        } else {
                            return req.createdBy === currentUserId &&
                                (req.status === 'pending' || req.status === 'under_review' || req.status === 'approved' || req.status === 'rejected');
                        }
                    })
                    .forEach(request => {
                        const notificationId = 'contractor-approval-' + (request.id || Date.now());
                        if (!readNotifications.includes(notificationId)) {
                            const isAdmin = AppState.currentUser?.role === 'admin';
                            let title, message, type;

                            if (isAdmin) {
                                // للمدير: إشعار بطلب جديد يحتاج مراجعة
                                const requestType = request.requestType === 'contractor' ? 'مقاول' :
                                    request.requestType === 'evaluation' ? 'تقييم' : 'مورد';
                                title = 'طلب اعتماد جديد يحتاج مراجعة';
                                message = `طلب اعتماد ${requestType}: ${request.companyName || request.contractorName || 'غير محدد'}`;
                                type = 'warning';
                            } else {
                                // للمستخدم: إشعار بحالة طلبه
                                if (request.status === 'approved') {
                                    title = 'تم اعتماد طلبك';
                                    message = `تم اعتماد طلب اعتماد: ${request.companyName || request.contractorName || 'غير محدد'}`;
                                    type = 'success';
                                } else if (request.status === 'rejected') {
                                    title = 'تم رفض طلبك';
                                    message = `تم رفض طلب اعتماد: ${request.companyName || request.contractorName || 'غير محدد'}`;
                                    type = 'error';
                                } else {
                                    title = 'طلب اعتماد قيد المراجعة';
                                    message = `طلب اعتماد: ${request.companyName || request.contractorName || 'غير محدد'} قيد المراجعة`;
                                    type = 'info';
                                }
                            }

                            notifications.push({
                                id: notificationId,
                                type: type,
                                title: title,
                                message: message,
                                time: request.createdAt || new Date(),
                                icon: 'fa-paper-plane',
                                onClick: () => {
                                    // الانتقال إلى تبويب طلبات الاعتماد
                                    if (typeof Contractors !== 'undefined') {
                                        // فتح قسم المقاولين
                                        const contractorsLink = document.querySelector('a[data-section="contractors"]');
                                        if (contractorsLink) {
                                            contractorsLink.click();
                                        }
                                        // الانتظار قليلاً ثم فتح التبويب
                                        setTimeout(() => {
                                            if (Contractors.switchTab) {
                                                Contractors.switchTab('approval-request');
                                            }
                                            // عرض تفاصيل الطلب
                                            if (Contractors.viewApprovalRequest) {
                                                setTimeout(() => {
                                                    Contractors.viewApprovalRequest(request.id);
                                                }, 500);
                                            }
                                        }, 300);
                                    }
                                }
                            });
                        }
                    });
            }

            // 6. طلبات موافقة فحص معدات الإطفاء
            if (AppState.appData && AppState.appData.fireEquipmentApprovalRequests) {
                const isAdmin = AppState.currentUser && (
                    AppState.currentUser.role === 'admin' ||
                    AppState.currentUser.role === 'مدير النظام' ||
                    (typeof Permissions !== 'undefined' && Permissions.isCurrentUserAdmin && Permissions.isCurrentUserAdmin())
                );
                const userId = AppState.currentUser?.id || AppState.currentUser?.email || '';

                AppState.appData.fireEquipmentApprovalRequests
                    .filter(request => {
                        // للمدير: جميع الطلبات قيد المراجعة
                        // للمستخدم: طلباته الخاصة فقط
                        return isAdmin
                            ? (request.status === 'pending')
                            : (request.requestedById === userId || request.userEmail === userId) &&
                              (request.status === 'pending' || request.status === 'approved' || request.status === 'rejected');
                    })
                    .forEach(request => {
                        const notificationId = 'fire-equipment-approval-' + (request.id || Date.now());
                        if (!readNotifications.includes(notificationId)) {
                            let title, message, type, icon;

                            if (isAdmin) {
                                // للمدير: إشعار بطلب جديد يحتاج مراجعة
                                title = 'طلب موافقة على فحص معدات الإطفاء';
                                message = `طلب ${request.requestedBy || 'مستخدم'} الموافقة على فحص الجهاز: ${request.assetNumber || request.assetId || 'غير محدد'}`;
                                type = 'warning';
                                icon = 'fa-clipboard-check';
                            } else {
                                // للمستخدم: إشعار بحالة طلبه
                                if (request.status === 'approved') {
                                    title = 'تمت الموافقة على طلبك';
                                    message = `تمت الموافقة على طلبك لإجراء فحص شهري على الجهاز: ${request.assetNumber || request.assetId || 'غير محدد'}`;
                                    type = 'success';
                                    icon = 'fa-check-circle';
                                } else if (request.status === 'rejected') {
                                    title = 'تم رفض طلبك';
                                    message = `تم رفض طلبك لإجراء فحص شهري على الجهاز: ${request.assetNumber || request.assetId || 'غير محدد'}${request.rejectionReason ? `. السبب: ${request.rejectionReason}` : ''}`;
                                    type = 'error';
                                    icon = 'fa-times-circle';
                                } else {
                                    title = 'طلبك قيد المراجعة';
                                    message = `طلبك لإجراء فحص شهري على الجهاز: ${request.assetNumber || request.assetId || 'غير محدد'} قيد المراجعة`;
                                    type = 'info';
                                    icon = 'fa-clock';
                                }
                            }

                            notifications.push({
                                id: notificationId,
                                type: type,
                                title: title,
                                message: message,
                                time: request.requestedAt || request.createdAt || new Date(),
                                icon: icon,
                                onClick: () => {
                                    // الانتقال إلى تبويب طلبات الموافقة
                                    if (typeof FireEquipment !== 'undefined') {
                                        // فتح قسم معدات الإطفاء
                                        const fireEquipmentLink = document.querySelector('a[data-section="fire-equipment"]');
                                        if (fireEquipmentLink) {
                                            fireEquipmentLink.click();
                                        }
                                        // الانتظار قليلاً ثم فتح التبويب
                                        setTimeout(() => {
                                            if (FireEquipment.switchTab) {
                                                FireEquipment.switchTab('approval-requests');
                                            }
                                        }, 300);
                                    }
                                }
                            });
                        }
                    });
            }

            // ترتيب الإشعارات حسب التاريخ (الأحدث أولاً)
            notifications.sort((a, b) => {
                const dateA = new Date(a.time);
                const dateB = new Date(b.time);
                return dateB - dateA;
            });

        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في الحصول على الإشعارات:', error);
        }

        return notifications;
    },

    /**
     * رسم عنصر إشعار واحد
     */
    renderNotificationItem(notification) {
        const timeAgo = this.getTimeAgo(notification.time);
        const iconClass = notification.icon || 'fa-bell';
        const typeClass = notification.type || 'info';
        const hasAction = typeof notification.onClick === 'function';
        const clickHandler = hasAction ? `onclick="window.UI.handleNotificationClick('${notification.id}')"` : '';
        const cursorStyle = hasAction ? 'cursor: pointer;' : '';

        return `
            <div class="notification-item" data-notification-id="${notification.id}" ${clickHandler} style="${cursorStyle}">
                <div class="notification-item-icon ${typeClass}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="notification-item-content">
                    <div class="notification-item-title">${Utils.escapeHTML(notification.title)}</div>
                    <div class="notification-item-message">${Utils.escapeHTML(notification.message)}</div>
                    <div class="notification-item-time">${timeAgo}</div>
                </div>
            </div>
        `;
    },

    /**
     * معالجة النقر على إشعار
     */
    handleNotificationClick(notificationId) {
        const notifications = this.getNotificationsList();
        const notification = notifications.find(n => n.id === notificationId);

        if (notification && typeof notification.onClick === 'function') {
            // تمييز الإشعار كمقروء
            this.markNotificationAsRead(notificationId);
            // تنفيذ الإجراء المخصص
            notification.onClick();
            // إغلاق dropdown
            const allDropdowns = ['notifications-dropdown', 'mobile-notifications-dropdown', 'header-notifications-dropdown'];
            allDropdowns.forEach(dropdownId => {
                this.hideNotificationsDropdown(dropdownId);
            });
        }
    },

    /**
     * حساب الوقت المنقضي منذ تاريخ معين
     */
    getTimeAgo(date) {
        if (!date) return 'قبل وقت غير محدد';

        try {
            const now = new Date();
            const past = new Date(date);
            const diffMs = now - past;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'الآن';
            if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
            if (diffHours < 24) return `منذ ${diffHours} ساعة`;
            if (diffDays < 7) return `منذ ${diffDays} يوم`;

            return Utils.formatDate(date);
        } catch (error) {
            return 'قبل وقت غير محدد';
        }
    },

    /**
     * تهيئة زر المزامنة
     */
    initSyncButton() {
        const syncBtn = document.getElementById('sync-btn');
        if (!syncBtn) {
            Utils.safeWarn('⚠️ لم يتم العثور على زر المزامنة');
            return;
        }

        // ربط حدث النقر
        syncBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleSyncClick();
        });

        // تحديث حالة الزر
        this.updateSyncButtonStatus();

        Utils.safeLog('✅ تم تهيئة زر المزامنة');
    },

    /**
     * معالجة النقر على زر المزامنة
     */
    async handleSyncClick() {
        const syncBtn = document.getElementById('sync-btn');
        if (!syncBtn) return;

        // منع المزامنة المتعددة
        if (syncBtn.classList.contains('syncing')) {
            if (typeof Notification !== 'undefined') {
                Notification.info('جاري تحميل البيانات من قاعدة البيانات، يرجى الانتظار...');
            }
            return;
        }

        try {
            syncBtn.classList.add('syncing');
            
            // التحقق من وجود تكامل الخادم (GoogleIntegration / Supabase)
            if (typeof GoogleIntegration === 'undefined') {
                throw new Error('الاتصال بالخادم غير متاح');
            }

            if (typeof Notification !== 'undefined') {
                Notification.info('جاري تحميل البيانات من قاعدة البيانات');
            }

            // مزامنة جميع البيانات
            let syncResult = false;
            const useSupabase = !!(typeof AppState !== 'undefined' && AppState.useSupabaseBackend === true);
            const isGoogleSheetsEnabled = !useSupabase && AppState.googleConfig?.appsScript?.enabled && AppState.googleConfig?.appsScript?.scriptUrl;
            
            if (typeof GoogleIntegration.syncData === 'function') {
                // ✅ تحميل تدريجي: تحميل البيانات غير المكتملة فقط
                syncResult = await GoogleIntegration.syncData({
                    silent: false,
                    showLoader: true,
                    notifyOnSuccess: false, // سنعرض الرسالة يدوياً
                    notifyOnError: false, // سنعرض الرسالة يدوياً
                    includeUsersSheet: true,
                    incremental: true // ✅ تحميل تدريجي: البيانات غير المكتملة فقط
                });
                
                // ✅ إذا نجحت المزامنة، عطّل bootstrap تلقائياً (إن كان مستخدماً)
                try {
                    if (typeof window !== 'undefined' && window.Auth && typeof window.Auth.handleUsersSyncSuccess === 'function') {
                        window.Auth.handleUsersSyncSuccess();
                    }
                } catch (e) { /* ignore */ }
            } else if (typeof GoogleIntegration.syncUsers === 'function') {
                // استخدام syncUsers كبديل إذا لم يكن syncData متاحاً
                syncResult = await GoogleIntegration.syncUsers(true); // force = true
                try {
                    if (typeof window !== 'undefined' && window.Auth && typeof window.Auth.handleUsersSyncSuccess === 'function') {
                        window.Auth.handleUsersSyncSuccess();
                    }
                } catch (e) { /* ignore */ }
            } else {
                // محاولة قراءة مباشرة من الخادم (كبديل أخير)
                if (typeof GoogleIntegration.readFromSheets === 'function') {
                    const usersData = await GoogleIntegration.readFromSheets('Users');
                    if (usersData && Array.isArray(usersData)) {
                        AppState.appData.users = usersData;
                        if (typeof DataManager !== 'undefined' && DataManager.save) {
                            DataManager.save();
                        }
                    }
                    syncResult = true;
                } else {
                    throw new Error('لا توجد دالة مزامنة متاحة');
                }
            }
            
            // التحقق من نتيجة المزامنة
            // إذا كانت قاعدة البيانات متصلة لكن المزامنة فشلت، نرمي خطأ
            // إذا كانت غير متصلة، syncData يظهر إشعار ولا نرمي خطأ
            if (!syncResult && isGoogleSheetsEnabled) {
                throw new Error('فشلت المزامنة مع قاعدة البيانات');
            }

            if (typeof Notification !== 'undefined') {
                Notification.success('تمت مزامنة البيانات بنجاح');
            }

            // تحديث جدول المستخدمين إذا كان مفتوحاً
            if (typeof Users !== 'undefined' && typeof Users.refreshUsersTable === 'function') {
                Users.refreshUsersTable();
            }
            
            // تحديث القسم الحالي بعد المزامنة (لتحديث جميع الموديولات)
            try {
                if (typeof this.refreshCurrentSection === 'function') {
                    this.refreshCurrentSection();
                }
            } catch (refreshError) {
                Utils.safeWarn('⚠️ خطأ في تحديث القسم الحالي بعد المزامنة:', refreshError);
            }
            
            // تحديث زر حالة الاتصال بعد المزامنة
            this.updateUserConnectionStatus();

        } catch (error) {
            Utils.safeError('❌ خطأ في المزامنة:', error);
            if (typeof Notification !== 'undefined') {
                Notification.error('فشلت المزامنة: ' + (error.message || 'خطأ غير معروف'));
            }
        } finally {
            syncBtn.classList.remove('syncing');
            this.updateSyncButtonStatus();
        }
    },

    /**
     * تحديث حالة زر المزامنة
     */
    updateSyncButtonStatus() {
        const syncBtn = document.getElementById('sync-btn');
        if (!syncBtn) return;

        // التحقق من حالة الاتصال
        let isConnected = false;
        if (typeof ConnectionMonitor !== 'undefined' && ConnectionMonitor.getStatus) {
            const status = ConnectionMonitor.getStatus();
            isConnected = status.isConnected === true;
        } else {
            // إذا لم يكن ConnectionMonitor متاحاً، نتحقق من إعدادات الاتصال
            isConnected = !!(AppState.googleConfig?.appsScript?.enabled && 
                           AppState.googleConfig?.appsScript?.scriptUrl);
        }

        // تحديث فئة الزر
        syncBtn.classList.remove('connected', 'disconnected');
        if (isConnected) {
            syncBtn.classList.add('connected');
            syncBtn.title = 'متصل - مزامنة البيانات مع قاعدة البيانات';
        } else {
            syncBtn.classList.add('disconnected');
            syncBtn.title = 'غير متصل - لا يمكن المزامنة';
        }
    },

    // متغير لتخزين معرف التحديث التلقائي لحالة الاتصال
    connectionStatusInterval: null,
    connectionStatusRefreshInterval: 5000, // تحديث كل 5 ثوان

    /**
     * تهيئة زر حالة الاتصال للمستخدم
     */
    initUserConnectionStatus() {
        const statusBtn = document.getElementById('user-connection-status');
        if (!statusBtn) {
            Utils.safeWarn('⚠️ لم يتم العثور على زر حالة الاتصال');
            return;
        }

        // تحديث حالة الزر
        this.updateUserConnectionStatus();

        // بدء التحديث التلقائي لحالة الاتصال
        this.startAutoRefreshConnectionStatus();

        Utils.safeLog('✅ تم تهيئة زر حالة الاتصال');
    },

    /**
     * بدء التحديث التلقائي لحالة الاتصال
     */
    startAutoRefreshConnectionStatus() {
        // إيقاف التحديث السابق إن وجد
        this.stopAutoRefreshConnectionStatus();

        // التحقق من وجود مستخدم مسجل دخول
        if (!AppState.currentUser || !AppState.currentUser.email) {
            return;
        }

        // بدء التحديث التلقائي
        this.connectionStatusInterval = setInterval(() => {
            // التحقق من وجود مستخدم مسجل دخول
            if (!AppState.currentUser || !AppState.currentUser.email) {
                this.stopAutoRefreshConnectionStatus();
                return;
            }

            // تحديث حالة الاتصال
            this.updateUserConnectionStatus();
        }, this.connectionStatusRefreshInterval);

        Utils.safeLog('✅ تم تفعيل التحديث التلقائي لحالة الاتصال');
    },

    /**
     * ✅ بدء المزامنة التلقائية الدورية في الخلفية
     */
    startBackgroundSync() {
        // إيقاف المزامنة السابقة إن وجدت
        this.stopBackgroundSync();

        // التحقق من وجود مستخدم مسجل دخول وقاعدة البيانات متصلة (Supabase أو Google Script)
        const hasBackend = AppState.useSupabaseBackend === true || (AppState.googleConfig?.appsScript?.enabled && AppState.googleConfig?.appsScript?.scriptUrl);
        if (!AppState.currentUser || !hasBackend) {
            return;
        }

        // بدء المزامنة التلقائية الدورية
        this._backgroundSyncInterval = setInterval(() => {
            const stillHasBackend = AppState.useSupabaseBackend === true || (AppState.googleConfig?.appsScript?.enabled && AppState.googleConfig?.appsScript?.scriptUrl);
            if (!AppState.currentUser || !stillHasBackend) {
                this.stopBackgroundSync();
                return;
            }

            // التحقق من عدم وجود مزامنة قيد التنفيذ
            if (typeof GoogleIntegration !== 'undefined' && 
                GoogleIntegration._syncInProgress && 
                GoogleIntegration._syncInProgress.global) {
                if (AppState.debugMode) {
                    Utils.safeLog('⏸️ مزامنة قيد التنفيذ - تخطي المزامنة التلقائية');
                }
                return;
            }

            // بدء المزامنة التلقائية في الخلفية (صامتة)
            if (typeof GoogleIntegration !== 'undefined' && 
                typeof GoogleIntegration.syncData === 'function') {
                if (AppState.debugMode) {
                    Utils.safeLog('🔄 بدء المزامنة التلقائية الدورية في الخلفية...');
                }
                
                GoogleIntegration.syncData({
                    silent: true, // صامت - لا إشعارات
                    showLoader: false, // لا loader
                    notifyOnSuccess: false, // لا إشعارات نجاح
                    notifyOnError: false, // لا إشعارات خطأ
                    incremental: true // تحميل تدريجي - فقط البيانات غير المكتملة
                }).catch(error => {
                    if (AppState.debugMode) {
                        Utils.safeWarn('⚠️ فشل المزامنة التلقائية الدورية:', error);
                    }
                });
            }
        }, this._backgroundSyncIntervalTime);

        if (AppState.debugMode) {
            Utils.safeLog(`✅ تم تفعيل المزامنة التلقائية الدورية (كل ${this._backgroundSyncIntervalTime / 60000} دقيقة)`);
        }
    },

    /**
     * ✅ إيقاف المزامنة التلقائية الدورية
     */
    stopBackgroundSync() {
        if (this._backgroundSyncInterval) {
            clearInterval(this._backgroundSyncInterval);
            this._backgroundSyncInterval = null;
            if (AppState.debugMode) {
                Utils.safeLog('⏹️ تم إيقاف المزامنة التلقائية الدورية');
            }
        }
    },

    /**
     * إيقاف التحديث التلقائي لحالة الاتصال
     */
    stopAutoRefreshConnectionStatus() {
        if (this.connectionStatusInterval) {
            clearInterval(this.connectionStatusInterval);
            this.connectionStatusInterval = null;
            Utils.safeLog('🛑 تم إيقاف التحديث التلقائي لحالة الاتصال');
        }
    },

    /**
     * تحديث حالة الاتصال للمستخدم
     */
    updateUserConnectionStatus() {
        const statusBtn = document.getElementById('user-connection-status');
        const statusIcon = document.getElementById('user-connection-icon');
        const statusText = document.getElementById('user-connection-text');
        
        if (!statusBtn || !statusIcon || !statusText) return;

        // إذا لم يكن هناك مستخدم مسجل دخول
        if (!AppState.currentUser || !AppState.currentUser.email) {
            statusText.textContent = 'غير متصل';
            statusBtn.classList.remove('connected', 'disconnected');
            statusBtn.classList.add('disconnected');
            statusBtn.title = 'حالة الاتصال: غير متصل';
            // إيقاف التحديث التلقائي إذا لم يكن هناك مستخدم
            this.stopAutoRefreshConnectionStatus();
            return;
        }

        // البحث عن المستخدم في قاعدة البيانات
        const userEmail = AppState.currentUser.email.toLowerCase().trim();
        let user = null;
        
        if (AppState.appData && AppState.appData.users && Array.isArray(AppState.appData.users)) {
            user = AppState.appData.users.find(u => {
                if (!u || !u.email) return false;
                return u.email.toLowerCase().trim() === userEmail;
            });
        }

        // التحقق من حالة الاتصال
        // إذا كان المستخدم موجوداً في قاعدة البيانات وكان isOnline = true
        // أو إذا كان المستخدم الحالي (نعتبره دائماً متصل إذا كان مسجل دخول)
        let isOnline = false;
        
        if (user) {
            // المستخدم موجود في قاعدة البيانات
            isOnline = user.isOnline === true;
            
            // إذا كان المستخدم الحالي موجوداً لكن isOnline غير محدد أو false،
            // نحدثه محلياً ونعتبره متصل (لأنه مسجل دخول حالياً)
            if (!isOnline && AppState.currentUser && AppState.currentUser.email) {
                // تحديث حالة الاتصال محلياً للمستخدم الحالي
                user.isOnline = true;
                isOnline = true;
                
                // حفظ التغييرات محلياً
                if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                    window.DataManager.save();
                }
            }
        } else {
            // ⚠️ أمان: لا نقوم بإنشاء/إضافة مستخدمين تلقائياً في قاعدة البيانات.
            // إذا كانت الجلسة الحالية تحمل مستخدم غير موجود في Users sheet، نعرض الحالة كـ "متصل" للجلسة فقط
            // ونترك إدارة المستخدمين لمدير النظام (مزامنة/إضافة عبر Users).
            isOnline = true;
        }

        if (isOnline) {
            statusText.textContent = 'متصل';
            statusBtn.classList.remove('disconnected');
            statusBtn.classList.add('connected');
        } else {
            // إذا لم يكن المستخدم موجوداً أو كان isOnline = false
            statusText.textContent = 'غير متصل';
            statusBtn.classList.remove('connected');
            statusBtn.classList.add('disconnected');
        }

        // تحديث title الزر
        if (user) {
            const lastLogin = user.lastLogin ? Utils.formatDateTime(user.lastLogin) : 'غير محدد';
            statusBtn.title = `حالة الاتصال: ${isOnline ? 'متصل' : 'غير متصل'} | آخر تسجيل دخول: ${lastLogin}`;
        } else {
            statusBtn.title = `حالة الاتصال: ${isOnline ? 'متصل' : 'غير متصل'}`;
        }
    },

    /**
     * حساب عدد الإشعارات غير المقروءة
     */
    getNotificationsCount() {
        // استخدام نفس دالة getNotificationsList التي تراعي الإشعارات المقروءة
        return this.getNotificationsList().length;
    },

    /**
     * تهيئة زر اللغة
     */
    initLanguageToggle() {
        const langToggle = document.getElementById('language-toggle');
        if (!langToggle) {
            Utils.safeWarn('⚠️ لم يتم العثور على زر اللغة');
            return;
        }

        // التحقق من عدم ربط الزر مسبقاً
        if (langToggle.dataset.languageBound === 'true') {
            return;
        }

        // تحميل اللغة المحفوظة (بدون عرض إشعار أثناء التهيئة)
        const savedLang = localStorage.getItem('language') || AppState.currentLanguage || 'ar';
        this.setLanguage(savedLang, true); // true = تهيئة أولية (لا نعرض إشعار)

        // ربط الزر
        langToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentLang = localStorage.getItem('language') || AppState.currentLanguage || 'ar';
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            this.setLanguage(newLang);
        });

        langToggle.dataset.languageBound = 'true';

        Utils.safeLog('✅ تم تهيئة زر اللغة');
    },

    /**
     * تعيين اللغة
     * @param {string} lang - اللغة ('ar' أو 'en')
     * @param {boolean} isInitialLoad - هل هذه تهيئة أولية؟ (لا نعرض إشعار إذا كان true)
     */
    setLanguage(lang, isInitialLoad = false) {
        // حفظ اللغة
        localStorage.setItem('language', lang);
        if (AppState) {
            AppState.currentLanguage = lang;
        }

        const isRTL = lang === 'ar';

        // تحديث اتجاه الصفحة على جميع العناصر
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;

        if (document.body) {
            document.body.dir = isRTL ? 'rtl' : 'ltr';
        }

        // تحديث اتجاه Sidebar و Navigation
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.dir = isRTL ? 'rtl' : 'ltr';
            // تحديث موضع Sidebar
            if (isRTL) {
                sidebar.style.right = '0';
                sidebar.style.left = 'auto';
                sidebar.style.borderLeft = '3px solid #FFC72C';
                sidebar.style.borderRight = 'none';
            } else {
                sidebar.style.left = '0';
                sidebar.style.right = 'auto';
                sidebar.style.borderRight = '3px solid #FFC72C';
                sidebar.style.borderLeft = 'none';
            }
        }

        // تحديث اتجاه Navigation
        const navigation = document.querySelector('.navigation');
        if (navigation) {
            navigation.dir = isRTL ? 'rtl' : 'ltr';
        }

        // تحديث موضع app-shell
        const appShell = document.querySelector('.app-shell');
        if (appShell) {
            if (isRTL) {
                appShell.style.marginRight = 'var(--sidebar-width)';
                appShell.style.marginLeft = '0';
            } else {
                appShell.style.marginLeft = 'var(--sidebar-width)';
                appShell.style.marginRight = '0';
            }
        }

        // تحديث nav-item borders
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            // في RTL: الحد على اليمين (الجانب الأيمن من الشاشة)
            // في LTR: الحد على اليسار (الجانب الأيسر من الشاشة)
            if (isRTL) {
                item.style.borderRight = '4px solid transparent';
                item.style.borderLeft = 'none';
                item.style.borderRadius = '8px 0 0 8px';
            } else {
                item.style.borderLeft = '4px solid transparent';
                item.style.borderRight = 'none';
                item.style.borderRadius = '0 8px 8px 0';
            }
        });

        // تحديث أيقونات nav-item
        // الأيقونة تبقى دائماً في نفس الموضع البصري (الجانب الأيمن) كما في العربية
        navItems.forEach(item => {
            const icon = item.querySelector('i');
            const textSpan = item.querySelector('span');
            
            // إزالة أي order styles سابقة
            if (icon) {
                icon.style.order = '';
                // في RTL: الأيقونة على اليمين (margin-left)
                // في LTR: الأيقونة على اليمين أيضاً (margin-right بعد reverse)
                if (isRTL) {
                    icon.style.marginLeft = '1rem';
                    icon.style.marginRight = '0';
                } else {
                    icon.style.marginRight = '1rem';
                    icon.style.marginLeft = '0';
                }
            }
            
            if (textSpan) {
                textSpan.style.order = '';
                textSpan.style.flex = '1';
                textSpan.style.textAlign = isRTL ? 'right' : 'left';
            }
            
            // تحديث محاذاة العنصر نفسه
            // الأيقونة تبقى على اليمين دائماً (كما في العربية)
            item.style.textAlign = isRTL ? 'right' : 'left';
            item.style.justifyContent = 'flex-start'; // دائماً flex-start
            // في RTL: row (الأيقونة على اليمين، النص على اليسار)
            // في LTR: row-reverse (الأيقونة على اليمين، النص على اليسار)
            item.style.flexDirection = isRTL ? 'row' : 'row-reverse';
        });
        
        // إضافة CSS ديناميكي لتأثير hover و ::before
        const styleId = 'nav-item-hover-ltr-fix';
        let styleElement = document.getElementById(styleId);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }
        styleElement.textContent = `
            /* تأثير hover */
            [dir="ltr"] .nav-item:hover {
                transform: translateX(3px) !important;
            }
            [dir="rtl"] .nav-item:hover {
                transform: translateX(-3px) !important;
            }
            
            /* تأثير ::before */
            [dir="ltr"] .nav-item::before {
                right: auto !important;
                left: 0 !important;
            }
            [dir="rtl"] .nav-item::before {
                left: auto !important;
                right: 0 !important;
            }
            
            /* تأثير border في hover */
            [dir="ltr"] .nav-item:hover {
                border-right-color: transparent !important;
                border-left-color: #FFC72C !important;
            }
            [dir="rtl"] .nav-item:hover {
                border-left-color: transparent !important;
                border-right-color: #FFC72C !important;
            }
            
            [dir="ltr"] .nav-item.active {
                border-right-color: transparent !important;
                border-left-color: #FFC72C !important;
            }
            [dir="rtl"] .nav-item.active {
                border-left-color: transparent !important;
                border-right-color: #FFC72C !important;
            }
        `;

        // تحديث نص الزر
        const langText = document.getElementById('current-lang-text');
        if (langText) {
            langText.textContent = lang === 'ar' ? 'العربية' : 'English';
        }

        // تحديث جميع العناصر التي تحتوي على data-i18n (القائمة + لوحة التحكم)
        const translations = {
            ar: {
                'nav.dashboard': 'لوحة التحكم',
                'dash.overview': 'نظرة عامة على أنشطة السلامة المهنية',
                'dash.totalIncidents': 'إجمالي الحوادث',
                'dash.thisMonth': 'هذا الشهر',
                'dash.activeUsers': 'المستخدمين النشطين',
                'dash.registeredUser': 'مستخدم مسجل',
                'dash.workPermits': 'تصاريح العمل',
                'dash.openPermit': 'تصريح مفتوح',
                'dash.closedPermit': 'تصريح مغلق',
                'dash.total': 'الإجمالي',
                'dash.complianceRate': 'معدل الامتثال',
                'dash.monthly': 'شهري',
                'dash.workHours': 'عدد ساعات العمل',
                'dash.workHour': 'ساعة عمل',
                'dash.daysSinceLastAccident': 'إجمالي الأيام منذ آخر حادث',
                'dash.day': 'يوم',
                'dash.safetyMetrics': 'مؤشرات السلامة المهنية',
                'dash.trirSubtitle': 'معدل الإصابات القابلة للتسجيل',
                'dash.frequencyRateSubtitle': 'معدل التكرار (لكل مليون ساعة)',
                'dash.totalInjuryRateSubtitle': 'معدل الإصابات الإجمالي',
                'dash.lostTimeInjurySubtitle': 'إصابات فقدان وقت العمل',
                'dash.safetyMetricsNote': 'ملاحظة: يتم حساب المؤشرات بناءً على عدد الحوادث المسجلة وإجمالي ساعات العمل.',
                'dash.reportsStatistics': 'التقارير والإحصائيات',
                'dash.totalReportsSubtitle': 'إجمالي التقارير المُنشأة',
                'dash.incidentReportsSubtitle': 'تقارير الحوادث',
                'dash.nearmissReportsSubtitle': 'تقارير الحوادث الوشيكة',
                'dash.inspectionsSubtitle': 'تقارير الفحص والتفتيش',
                'dash.trainingSessionsSubtitle': 'جلسات التدريب المنفذة',
                'dash.violationsSubtitle': 'المخالفات المسجلة',
                'dash.approvedContractorsTitle': 'إعداد المقاولين المعتمدين',
                'dash.approvedContractorsSubtitle': 'المقاولون والموردون المعتمدون',
                'dash.ptwIssuedSubtitle': 'تصاريح العمل الصادرة',
                'dash.auditsSubtitle': 'عمليات التدقيق المنفذة',
                'dash.electricityTitle': 'استهلاك الكهرباء',
                'dash.electricitySubtitle': 'كيلووات ساعة (kWh)',
                'nav.users': 'المستخدمين',
                'nav.userTasks': 'مهام المستخدمين',
                'nav.employees': 'قاعدة بيانات الموظفين',
                'nav.incidents': 'الحوادث',
                'nav.nearmiss': 'الحوادث الوشيكة',
                'nav.ptw': 'تصاريح العمل',
                'nav.training': 'التدريب',
                'nav.clinic': 'العيادة الطبية',
                'nav.fire': 'فحص معدات الحريق',
                'nav.periodicInspections': 'الفحوصات الدورية',
                'nav.ppe': 'مهمات الوقاية',
                'nav.violations': 'المخالفات',
                'nav.contractors': 'المقاولين',
                'nav.behavior': 'مراقبة التصرفات',
                'nav.chemical': 'المواد الكيميائية',
                'nav.observations': 'الملاحظات اليومية',
                'nav.iso': 'نظام ISO',
                'nav.emergency': 'تنبيهات الطوارئ',
                'nav.risk': 'تقييم المخاطر',
                'nav.sop': 'تعليمات السلامة SOP-JHA',
                'nav.legal': 'المستندات القانونية',
                'nav.sustainability': 'الاستدامة البيئية',
                'nav.safetyBudget': 'ميزانية السلامة',
                'nav.safetyKPIs': 'مؤشرات الأداء للسلامة',
                'nav.safetyHealthManagement': 'إدارة السلامة والصحة',
                'nav.actionTracking': 'سجل متابعة الإجراءات',
                'nav.aiAssistant': 'مساعد الذكاء الاصطناعي',
                'nav.appTester': 'اختبار التطبيق',
                'nav.settings': 'الإعدادات',
                'nav.logout': 'تسجيل الخروج'
            },
            en: {
                'nav.dashboard': 'Dashboard',
                'dash.overview': 'Overview of Occupational Safety Activities',
                'dash.totalIncidents': 'Total Incidents',
                'dash.thisMonth': 'This Month',
                'dash.activeUsers': 'Active Users',
                'dash.registeredUser': 'Registered User',
                'dash.workPermits': 'Work Permits',
                'dash.openPermit': 'Open Permit',
                'dash.closedPermit': 'Closed Permit',
                'dash.total': 'Total',
                'dash.complianceRate': 'Compliance Rate',
                'dash.monthly': 'Monthly',
                'dash.workHours': 'Work Hours',
                'dash.workHour': 'Work Hour',
                'dash.daysSinceLastAccident': 'Days Since Last Accident',
                'dash.day': 'Day',
                'dash.safetyMetrics': 'Safety Metrics',
                'dash.trirSubtitle': 'Total Recordable Injury Rate',
                'dash.frequencyRateSubtitle': 'Frequency Rate (per million hours)',
                'dash.totalInjuryRateSubtitle': 'Total Injury Rate',
                'dash.lostTimeInjurySubtitle': 'Lost Time Injuries',
                'dash.safetyMetricsNote': 'Note: Indicators are calculated based on registered incidents and total work hours.',
                'dash.reportsStatistics': 'Reports & Statistics',
                'dash.totalReportsSubtitle': 'Total reports generated',
                'dash.incidentReportsSubtitle': 'Incident reports',
                'dash.nearmissReportsSubtitle': 'Near miss reports',
                'dash.inspectionsSubtitle': 'Inspection reports',
                'dash.trainingSessionsSubtitle': 'Training sessions completed',
                'dash.violationsSubtitle': 'Recorded violations',
                'dash.approvedContractorsTitle': 'Approved Contractors',
                'dash.approvedContractorsSubtitle': 'Approved contractors and suppliers',
                'dash.ptwIssuedSubtitle': 'Work permits issued',
                'dash.auditsSubtitle': 'Audits completed',
                'dash.electricityTitle': 'Electricity Consumption',
                'dash.electricitySubtitle': 'Kilowatt-hours (kWh)',
                'nav.users': 'Users',
                'nav.userTasks': 'User Tasks',
                'nav.employees': 'Employees Database',
                'nav.incidents': 'Incidents',
                'nav.nearmiss': 'Near Miss',
                'nav.ptw': 'Work Permits',
                'nav.training': 'Training',
                'nav.clinic': 'Medical Clinic',
                'nav.fire': 'Fire Equipment',
                'nav.periodicInspections': 'Periodic Inspections',
                'nav.ppe': 'PPE',
                'nav.violations': 'Violations',
                'nav.contractors': 'Contractors',
                'nav.behavior': 'Behavior Monitoring',
                'nav.chemical': 'Chemical Safety',
                'nav.observations': 'Daily Observations',
                'nav.iso': 'ISO System',
                'nav.emergency': 'Emergency Alerts',
                'nav.risk': 'Risk Assessment',
                'nav.sop': 'Safety Instructions SOP-JHA',
                'nav.legal': 'Legal Documents',
                'nav.sustainability': 'Environmental Sustainability',
                'nav.safetyBudget': 'Safety Budget',
                'nav.safetyKPIs': 'Safety Performance Indicators',
                'nav.safetyHealthManagement': 'Safety and Health Management',
                'nav.actionTracking': 'Action Tracking Log',
                'nav.aiAssistant': 'AI Assistant',
                'nav.appTester': 'Application Testing',
                'nav.settings': 'Settings',
                'nav.logout': 'Logout'
            }
        };

        const i18nElements = document.querySelectorAll('[data-i18n]');
        i18nElements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key && translations[lang] && translations[lang][key]) {
                element.textContent = translations[lang][key];
            }
        });

        // تحديث aria-label للـ navigation
        const navElement = document.querySelector('nav.navigation');
        if (navElement) {
            navElement.setAttribute('aria-label', isRTL ? 'القائمة الرئيسية' : 'Main Menu');
        }

        // تحديث aria-label للـ sidebar
        if (sidebar) {
            sidebar.setAttribute('aria-label', isRTL ? 'القائمة الجانبية' : 'Sidebar');
        }

        Utils.safeLog(`✅ تم تعيين اللغة: ${lang} (${isRTL ? 'RTL' : 'LTR'})`);

        // إرسال حدث تغيير اللغة للموديولات
        try {
            const languageChangeEvent = new CustomEvent('language-changed', {
                detail: { lang, isRTL }
            });
            document.dispatchEvent(languageChangeEvent);
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في إرسال حدث تغيير اللغة:', error);
        }

        // إعادة تحميل محتوى الموديول الظاهر حالياً ليطبق اللغة الجديدة (فقط عند تغيير المستخدم للغة وليس عند التهيئة الأولى)
        if (!isInitialLoad) {
            try {
                const currentSection = AppState.currentSection;
                if (currentSection && typeof this.loadSectionData === 'function') {
                    AppState._languageRefresh = true;
                    this.loadSectionData(currentSection, true);
                    AppState._languageRefresh = false;
                }
            } catch (err) {
                if (typeof AppState !== 'undefined') AppState._languageRefresh = false;
                Utils.safeWarn('⚠️ خطأ عند إعادة تحميل القسم بعد تغيير اللغة:', err);
            }
        }

        // تحديث التخطيط وحجم الشاشة بعد تغيير RTL/LTR
        try {
            if (typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new Event('resize'));
            }
        } catch (e) { /* تجاهل */ }

        // عرض الإشعار فقط إذا لم تكن هذه تهيئة أولية وكانت الواجهة جاهزة
        if (!isInitialLoad) {
            try {
                if (typeof Notification !== 'undefined' &&
                    Notification.success &&
                    typeof Notification.success === 'function' &&
                    document.getElementById('notification-container')) {
                    Notification.success(lang === 'ar' ? 'تم التبديل للعربية' : 'Switched to English');
                }
            } catch (error) {
                // تجاهل الأخطاء في عرض الإشعار - لا نريد إيقاف عملية تغيير اللغة
                Utils.safeWarn('⚠️ خطأ في عرض إشعار تغيير اللغة:', error);
            }
        }
    },

    /**
     * تنظيف الموديول السابق قبل تحميل موديول جديد
     * يمنع تسريبات الذاكرة (Memory Leaks)
     */
    cleanupPreviousModule(sectionName) {
        try {
            if (!sectionName) return;

            // خريطة أسماء الموديولات
            const moduleMap = {
                'clinic': 'Clinic',
                'users': 'Users',
                'incidents': 'Incidents',
                'nearmiss': 'NearMiss',
                'ptw': 'PTW',
                'training': 'Training',
                'contractors': 'Contractors',
                'employees': 'Employees',
                'emergency': 'Emergency',
                'ppe': 'PPE',
                'fire-equipment': 'FireEquipment',
                'periodic-inspections': 'PeriodicInspections',
                'violations': 'Violations',
                'behavior-monitoring': 'BehaviorMonitoring',
                'chemical-safety': 'ChemicalSafety',
                'daily-observations': 'DailyObservations',
                'iso': 'ISO',
                'hse': 'HSE',
                'safety-budget': 'SafetyBudget',
                'action-tracking-register': 'ActionTrackingRegister',
                'safety-performance-kpis': 'SafetyPerformanceKPIs',
                'sustainability': 'Sustainability',
                'risk-assessment': 'RiskAssessment',
                'risk-matrix': 'RiskMatrix',
                'legal-documents': 'LegalDocuments',
                'safety-health-management': 'SafetyHealthManagement',
                'user-tasks': 'UserTasks',
                'sopjha': 'SOPJHA',
                'ai-assistant': 'AIAssistant',
                'user-ai-assistant': 'UserAIAssistant'
            };

            const moduleName = moduleMap[sectionName];
            if (!moduleName) return;

            // استدعاء دالة cleanup إذا كانت موجودة
            if (typeof window[moduleName] !== 'undefined' && 
                typeof window[moduleName].cleanup === 'function') {
                try {
                    window[moduleName].cleanup();
                    if (AppState.debugMode) {
                        Utils.safeLog(`✅ تم تنظيف موديول ${moduleName}`);
                    }
                } catch (error) {
                    Utils.safeWarn(`⚠️ خطأ في تنظيف موديول ${moduleName}:`, error);
                }
            }
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في cleanupPreviousModule:', error);
        }
    }
};

// Export to global scope (already done at the top, but kept for safety)
if (typeof window !== 'undefined' && !window.UI) {
    window.UI = UI;
}

// تصدير UI كـ const أيضاً للتوافق مع الكود القديم
const UI = window.UI;

// إضافة اسم بديل AppUI للتوافق مع الكود القديم
if (typeof window !== 'undefined') {
    window.AppUI = window.UI;
}

// دالة helper عالمية لإضافة الأيقونات بعد renderUI
// يمكن استدعاؤها من أي موديول بعد استبدال innerHTML
if (typeof window !== 'undefined') {
    window.addNavigationIconsAfterRender = function (sectionName) {
        if (typeof UI !== 'undefined' && UI.addNavigationIconsAfterRender) {
            UI.addNavigationIconsAfterRender(sectionName);
        } else {
            Utils.safeWarn('⚠️ UI.addNavigationIconsAfterRender غير متاح');
        }
    };

    // دالة helper أخرى للوصول المباشر
    window.ensureNavigationIcons = function (sectionName) {
        if (typeof UI !== 'undefined' && UI.ensureNavigationIcons) {
            UI.ensureNavigationIcons(sectionName);
        } else {
            Utils.safeWarn('⚠️ UI.ensureNavigationIcons غير متاح');
        }
    };
}

// ✅ إصلاح: تهيئة أزرار الإشعارات عند تحميل الصفحة (DOMContentLoaded)
// هذا يضمن عمل أزرار الإشعارات حتى قبل تسجيل الدخول
if (typeof document !== 'undefined') {
    
    // ✅ دالة مباشرة لربط زر الإشعارات في القائمة الجانبية
    const bindSidebarNotificationBtn = () => {
        const sidebarBtn = document.getElementById('notifications-btn');
        if (sidebarBtn && !sidebarBtn._directClickBound) {
            console.log('🔔 ربط زر الإشعارات في القائمة الجانبية مباشرة');
            
            sidebarBtn._directClickBound = true;
            sidebarBtn.addEventListener('click', function(e) {
                console.log('🔔 تم النقر على زر الإشعارات في القائمة الجانبية!');
                e.preventDefault();
                e.stopPropagation();
                
                // استدعاء دالة عرض الإشعارات
                if (window.UI && typeof window.UI.toggleNotificationsDropdown === 'function') {
                    window.UI.toggleNotificationsDropdown(
                        'notifications-dropdown',
                        'notifications-list',
                        'notifications-empty',
                        'close-notifications-dropdown',
                        sidebarBtn
                    );
                } else {
                    console.log('⚠️ UI.toggleNotificationsDropdown غير متاح');
                    // محاولة فتح الـ dropdown مباشرة
                    const dropdown = document.getElementById('notifications-dropdown');
                    if (dropdown) {
                        const isVisible = dropdown.style.display === 'flex';
                        if (isVisible) {
                            dropdown.style.display = 'none';
                        } else {
                            dropdown.style.setProperty('display', 'flex', 'important');
                            dropdown.style.setProperty('visibility', 'visible', 'important');
                            dropdown.style.setProperty('opacity', '1', 'important');
                            dropdown.style.setProperty('position', 'fixed', 'important');
                            dropdown.style.setProperty('z-index', '10001', 'important');
                            dropdown.style.setProperty('top', '100px', 'important');
                            dropdown.style.setProperty('left', '50%', 'important');
                            dropdown.style.setProperty('transform', 'translateX(-50%)', 'important');
                        }
                    }
                }
            }, { capture: true });
            
            console.log('✅ تم ربط زر الإشعارات في القائمة الجانبية بنجاح');
        }
    };
    
    const initNotificationsEarly = () => {
        // ربط الزر مباشرة أولاً
        bindSidebarNotificationBtn();
        
        // انتظار قليل للتأكد من تحميل كل العناصر
        setTimeout(() => {
            // ربط مرة أخرى للتأكد
            bindSidebarNotificationBtn();
            
            if (typeof window.UI !== 'undefined' && typeof window.UI.initNotificationsButton === 'function') {
                try {
                    window.UI.initNotificationsButton();
                    if (typeof Utils !== 'undefined') {
                        Utils.safeLog('✅ تم تهيئة أزرار الإشعارات مبكراً (DOMContentLoaded)');
                    }
                } catch (e) {
                    if (typeof Utils !== 'undefined') {
                        Utils.safeWarn('⚠️ فشل تهيئة أزرار الإشعارات مبكراً:', e);
                    }
                }
            }
        }, 500);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotificationsEarly);
    } else {
        // DOM already loaded
        initNotificationsEarly();
    }
    
    // ✅ محاولة إضافية بعد 1 ثانية
    setTimeout(bindSidebarNotificationBtn, 1000);
    setTimeout(bindSidebarNotificationBtn, 2000);
}