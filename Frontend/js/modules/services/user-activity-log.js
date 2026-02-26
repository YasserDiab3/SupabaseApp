/**
 * User Activity Log Service
 * Handles user activity logging with UI rendering and export functionality
 */

const UserActivityLog = {
    /**
     * الحصول على عنوان IP للمستخدم الحالي
     */
    async getUserIP() {
        // إضافة timeout للطلب (مع تنظيف الـ timer لتجنب unhandled rejections)
        const timeoutMs = 5000;

        // 1) Prefer server-side (Apps Script) to avoid Firefox ETP/CORS blocks
        try {
            if (typeof GoogleIntegration !== 'undefined' && GoogleIntegration?.sendToAppsScript) {
                const result = await Utils.promiseWithTimeout(
                    GoogleIntegration.sendToAppsScript('getPublicIP', {}),
                    timeoutMs,
                    'Timeout'
                );

                const ip = result?.data?.ip || result?.ip;
                if (result?.success && ip) {
                    return ip;
                }
            }
        } catch (error) {
            // تجاهل أخطاء getPublicIP بصمت - هذه عملية غير حرجة
            // لا نريد إظهار أخطاء للمستخدم لأن جلب IP هو فقط لتسجيل النشاط
            // الخطأ قد يكون بسبب: CORS, timeout, أو مشاكل في خدمة ipify
        }

        // No direct client-side IP lookup fallback here.
        // Rationale: browsers (especially Firefox with Enhanced Tracking Protection)
        // may block third-party IP services and still log noisy console CORS errors.
        return 'Unknown';
    },

    /**
     * تسجيل نشاط المستخدم
     * @param {string} actionType - نوع العملية (login, logout, add, update, delete, settings, upload, delete_file)
     * @param {string} module - اسم الموديول الذي تمت فيه العملية
     * @param {string} recordId - معرف السجل (اختياري)
     * @param {object} details - تفاصيل إضافية
     */
    async log(actionType, module, recordId = null, details = {}) {
        // التحقق من وجود سجل الأنشطة في حالة التطبيق
        if (!AppState.appData.user_activity_log) {
            AppState.appData.user_activity_log = [];
        }

        const user = AppState.currentUser;
        if (!user) {
            Utils.safeWarn('⚠️ لا يوجد مستخدم مسجل - لم يتم حفظ سجل النشاط');
            return null;
        }

        // الحصول على عنوان IP
        const ipAddress = await this.getUserIP();

        const entry = {
            id: Utils.generateId('UAL'),
            username: user.name || user.displayName || user.email || 'مستخدم غير معروف',
            userEmail: user.email || '',
            userId: user.id || null,
            timestamp: new Date().toISOString(),
            actionType: actionType, // login, logout, add, update, delete, settings, upload, delete_file
            module: module || 'Unknown',
            recordId: recordId,
            details: typeof details === 'string' ? details : (details.description || JSON.stringify(details)),
            ipAddress: ipAddress
        };

        AppState.appData.user_activity_log.push(entry);

        // حفظ البيانات
        try {
            DataManager.save();
            // حفظ السجلات في الخادم
            if (typeof GoogleIntegration !== 'undefined' && GoogleIntegration.autoSave) {
                GoogleIntegration.autoSave('UserActivityLog', AppState.appData.user_activity_log).catch(() => {});
            }
            
            // إرسال السجل مباشرة إلى قاعدة البيانات (Backend)
            if (typeof GoogleIntegration !== 'undefined' && GoogleIntegration.sendToAppsScript) {
                GoogleIntegration.sendToAppsScript('addUserActivityLog', entry).catch(err => {
                    // لا نسجل الخطأ إذا كان الخادم غير مفعّل (متوقع)
                    const errorMsg = err?.message || String(err || '');
                    if (!errorMsg.includes('الاتصال بالخادم غير مفعل')) {
                        Utils.safeWarn('فشل إرسال سجل النشاط إلى قاعدة البيانات:', err);
                    }
                });
            }
        } catch (error) {
            Utils.safeWarn('فشل حفظ سجل النشاط:', error);
        }

        return entry;
    },

    /**
     * الحصول على جميع السجلات مع إمكانية التصفية
     */
    getAll(filters = {}) {
        let logs = AppState.appData.user_activity_log || [];
        
        // ترتيب السجلات حسب التاريخ (الأحدث أولاً)
        logs = logs.sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        // تطبيق الفلاتر
        if (filters.username) {
            logs = logs.filter(log => 
                log.username?.toLowerCase().includes(filters.username.toLowerCase()) ||
                log.userEmail?.toLowerCase().includes(filters.username.toLowerCase())
            );
        }

        if (filters.actionType && filters.actionType !== 'all') {
            logs = logs.filter(log => log.actionType === filters.actionType);
        }

        if (filters.module && filters.module !== 'all') {
            logs = logs.filter(log => log.module === filters.module);
        }

        if (filters.dateFrom) {
            logs = logs.filter(log => {
                const logDate = new Date(log.timestamp);
                const filterDate = new Date(filters.dateFrom);
                return logDate >= filterDate;
            });
        }

        if (filters.dateTo) {
            logs = logs.filter(log => {
                const logDate = new Date(log.timestamp);
                const filterDate = new Date(filters.dateTo);
                filterDate.setHours(23, 59, 59, 999); // نهاية اليوم
                return logDate <= filterDate;
            });
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            logs = logs.filter(log => 
                log.username?.toLowerCase().includes(searchTerm) ||
                log.userEmail?.toLowerCase().includes(searchTerm) ||
                log.module?.toLowerCase().includes(searchTerm) ||
                log.details?.toLowerCase().includes(searchTerm) ||
                log.actionType?.toLowerCase().includes(searchTerm)
            );
        }

        return logs;
    },

    /**
     * الحصول على قائمة أنواع الأنشطة المتاحة
     */
    getActionTypes() {
        return [
            { value: 'all', label: 'جميع الأنشطة' },
            { value: 'login', label: 'تسجيل الدخول' },
            { value: 'logout', label: 'تسجيل الخروج' },
            { value: 'add', label: 'إضافة' },
            { value: 'update', label: 'تحديث' },
            { value: 'delete', label: 'حذف' },
            { value: 'settings', label: 'الإعدادات' },
            { value: 'upload', label: 'رفع ملف' },
            { value: 'delete_file', label: 'حذف ملف' },
            { value: 'export', label: 'تصدير' },
            { value: 'import', label: 'استيراد' }
        ];
    },

    /**
     * الحصول على قائمة الموديولات المستخدمة في السجلات
     */
    getModules() {
        const logs = AppState.appData.user_activity_log || [];
        const modules = [...new Set(logs.map(log => log.module).filter(Boolean))];
        return modules.sort();
    },

    /**
     * تصدير السجلات إلى ملف Excel
     */
    exportToExcel(filters = {}) {
        const logs = this.getAll(filters);
        
        if (logs.length === 0) {
            Notification.warning('لا توجد سجلات للتصدير');
            return;
        }

        try {
            // تحضير البيانات
            const data = logs.map(log => ({
                'اسم المستخدم': log.username || '',
                'البريد الإلكتروني': log.userEmail || '',
                'التاريخ والوقت': Utils.formatDateTime(log.timestamp) || '',
                'نوع العملية': this.getActionTypeLabel(log.actionType),
                'الموديول': log.module || '',
                'معرف السجل': log.recordId || '',
                'التفاصيل': typeof log.details === 'string' ? log.details : JSON.stringify(log.details),
                'عنوان IP': log.ipAddress || ''
            }));

            // إنشاء ورقة العمل
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'سجل الأنشطة');

            // حفظ الملف
            const fileName = `سجل_الأنشطة_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            Notification.success('✅ تم تصدير السجلات بنجاح');
        } catch (error) {
            Utils.safeError('❌ خطأ في تصدير Excel:', error);
            Notification.error('❌ فشل تصدير السجلات');
        }
    },

    /**
     * تصدير السجلات إلى ملف PDF
     */
    exportToPDF(filters = {}) {
        const logs = this.getAll(filters);
        
        if (logs.length === 0) {
            Notification.warning('لا توجد سجلات للتصدير');
            return;
        }

        try {
            if (typeof jsPDF === 'undefined') {
                Notification.error('مكتبة jsPDF غير متاحة');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
            
            // العنوان
            doc.setFontSize(18);
            doc.text('سجل أنشطة المستخدمين - User Activity Log', 14, 15);
            
            // المعلومات
            doc.setFontSize(10);
            doc.text(`تاريخ التصدير: ${Utils.formatDateTime(new Date().toISOString())}`, 14, 22);
            doc.text(`عدد السجلات: ${logs.length}`, 14, 27);

            // البيانات
            const tableData = logs.map(log => [
                log.username || '',
                Utils.formatDateTime(log.timestamp) || '',
                this.getActionTypeLabel(log.actionType),
                log.module || '',
                typeof log.details === 'string' ? log.details.substring(0, 30) : '',
                log.ipAddress || ''
            ]);

            doc.autoTable({
                head: [['اسم المستخدم', 'التاريخ والوقت', 'نوع العملية', 'الموديول', 'التفاصيل', 'IP']],
                body: tableData,
                startY: 35,
                styles: { fontSize: 8, font: 'Arial' },
                headStyles: { fillColor: [59, 130, 246], textColor: 255 },
                alternateRowStyles: { fillColor: [245, 247, 250] }
            });

            // حفظ الملف
            const fileName = `سجل_الأنشطة_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            Notification.success('✅ تم تصدير السجلات بنجاح');
        } catch (error) {
            Utils.safeError('❌ خطأ في تصدير PDF:', error);
            Notification.error('❌ فشل تصدير السجلات');
        }
    },

    /**
     * الحصول على تسمية نوع العملية
     */
    getActionTypeLabel(actionType) {
        const types = {
            'login': 'تسجيل الدخول',
            'logout': 'تسجيل الخروج',
            'add': 'إضافة',
            'update': 'تحديث',
            'delete': 'حذف',
            'settings': 'الإعدادات',
            'upload': 'رفع ملف',
            'delete_file': 'حذف ملف',
            'export': 'تصدير',
            'import': 'استيراد'
        };
        return types[actionType] || actionType;
    },

    /**
     * عرض واجهة سجل الأنشطة
     */
    render() {
        // التحقق من صلاحيات المستخدم
        const isAdmin = (typeof Permissions !== 'undefined' && typeof Permissions.isCurrentUserAdmin === 'function') 
            ? Permissions.isCurrentUserAdmin() 
            : (AppState.currentUser?.role || '').toLowerCase() === 'admin';
        
        if (!isAdmin) {
            return `
                <div class="content-card">
                    <div class="card-body">
                        <div class="empty-state">
                            <i class="fas fa-lock text-4xl text-gray-300 mb-4"></i>
                            <p class="text-gray-500">لا توجد صلاحيات لعرض سجل الأنشطة. يرجى التواصل مع المدير.</p>
                        </div>
                    </div>
                </div>
            `;
        }

        const actionTypes = this.getActionTypes();
        const modules = this.getModules();
        
        return `
            <div class="content-card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-history ml-2"></i>
                        سجل أنشطة المستخدمين
                    </h2>
                    <div class="flex items-center gap-2">
                        <button class="btn-primary" onclick="UserActivityLog.exportToExcel(UserActivityLog.currentFilters || {})" title="تصدير إلى Excel">
                            <i class="fas fa-file-excel ml-2"></i>Excel
                        </button>
                        <button class="btn-primary" onclick="UserActivityLog.exportToPDF(UserActivityLog.currentFilters || {})" title="تصدير إلى PDF">
                            <i class="fas fa-file-pdf ml-2"></i>PDF
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- الفلاتر -->
                    <div class="bg-gray-50 p-4 rounded-lg mb-4 space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <!-- البحث -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">
                                    <i class="fas fa-search ml-2"></i>البحث
                                </label>
                                <input 
                                    type="text" 
                                    id="activity-log-search" 
                                    class="form-input" 
                                    placeholder="ادخل البحث هنا..."
                                >
                            </div>
                            
                            <!-- نوع العملية -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">
                                    <i class="fas fa-filter ml-2"></i>نوع العملية
                                </label>
                                <select id="activity-log-action-type" class="form-input">
                                    ${actionTypes.map(type => `
                                        <option value="${type.value}">${type.label}</option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <!-- الموديول -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">
                                    <i class="fas fa-folder ml-2"></i>الموديول
                                </label>
                                <select id="activity-log-module" class="form-input">
                                    <option value="all">جميع الموديولات</option>
                                    ${modules.map(module => `
                                        <option value="${module}">${Utils.escapeHTML(module)}</option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <!-- اسم المستخدم -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">
                                    <i class="fas fa-user ml-2"></i>اسم المستخدم
                                </label>
                                <input 
                                    type="text" 
                                    id="activity-log-username" 
                                    class="form-input" 
                                    placeholder="ادخل اسم المستخدم هنا..."
                                >
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- التاريخ من -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">
                                    <i class="fas fa-calendar-alt ml-2"></i>التاريخ من
                                </label>
                                <input 
                                    type="date" 
                                    id="activity-log-date-from" 
                                    class="form-input"
                                >
                            </div>
                            
                                <!-- التاريخ إلى -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">
                                    <i class="fas fa-calendar-alt ml-2"></i>التاريخ إلى
                                </label>
                                <input 
                                    type="date" 
                                    id="activity-log-date-to" 
                                    class="form-input"
                                >
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-2">
                            <button class="btn-primary" onclick="UserActivityLog.applyFilters()">
                                <i class="fas fa-filter ml-2"></i>تطبيق الفلاتر
                            </button>
                            <button class="btn-secondary" onclick="UserActivityLog.resetFilters()">
                                <i class="fas fa-redo ml-2"></i>إعادة تعيين الفلاتر
                            </button>
                        </div>
                    </div>
                    
                    <!-- جدول السجلات -->
                    <div id="activity-log-table-container">
                        ${this.renderTable()}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * عرض جدول السجلات
     */
    renderTable(filters = {}) {
        const logs = this.getAll(filters);
        this.currentFilters = filters;
        
        if (logs.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">لا توجد سجلات لعرض</p>
                </div>
            `;
        }

        return `
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                                <th>اسم المستخدم</th>
                            <th>التاريخ والوقت</th>
                            <th>نوع العملية</th>
                            <th>الموديول</th>
                            <th>التفاصيل</th>
                            <th>عنوان IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(log => `
                            <tr>
                                <td>
                                    <div class="font-semibold">${Utils.escapeHTML(log.username || '')}</div>
                                    <div class="text-xs text-gray-500">${Utils.escapeHTML(log.userEmail || '')}</div>
                                </td>
                                <td>${Utils.formatDateTime(log.timestamp)}</td>
                                <td>
                                    <span class="badge badge-${this.getActionTypeBadgeColor(log.actionType)}">
                                        ${Utils.escapeHTML(this.getActionTypeLabel(log.actionType))}
                                    </span>
                                </td>
                                <td>${Utils.escapeHTML(log.module || '')}</td>
                                <td class="max-w-xs truncate" title="${Utils.escapeHTML(typeof log.details === 'string' ? log.details : JSON.stringify(log.details))}">
                                    ${Utils.escapeHTML(typeof log.details === 'string' ? log.details.substring(0, 50) : JSON.stringify(log.details).substring(0, 50))}
                                    ${(typeof log.details === 'string' ? log.details.length : JSON.stringify(log.details).length) > 50 ? '...' : ''}
                                </td>
                                <td class="font-mono text-xs">${Utils.escapeHTML(log.ipAddress || '')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="mt-4 text-sm text-gray-600">
                <i class="fas fa-info-circle ml-2"></i>
                عدد السجلات: <strong>${logs.length}</strong>
            </div>
        `;
    },

    /**
     * الحصول على لون العلامة المرجعية لنوع العملية
     */
    getActionTypeBadgeColor(actionType) {
        const colors = {
            'login': 'success',
            'logout': 'secondary',
            'add': 'primary',
            'update': 'warning',
            'delete': 'danger',
            'settings': 'info',
            'upload': 'primary',
            'delete_file': 'danger',
            'export': 'success',
            'import': 'info'
        };
        return colors[actionType] || 'secondary';
    },

    /**
     * تطبيق الفلاتر
     */
    applyFilters() {
        const filters = {
            search: document.getElementById('activity-log-search')?.value.trim() || '',
            actionType: document.getElementById('activity-log-action-type')?.value || 'all',
            module: document.getElementById('activity-log-module')?.value || 'all',
            username: document.getElementById('activity-log-username')?.value.trim() || '',
            dateFrom: document.getElementById('activity-log-date-from')?.value || '',
            dateTo: document.getElementById('activity-log-date-to')?.value || ''
        };

        const container = document.getElementById('activity-log-table-container');
        if (container) {
            container.innerHTML = this.renderTable(filters);
        }
    },

    /**
     * إعادة تعيين الفلاتر
     */
    resetFilters() {
        document.getElementById('activity-log-search').value = '';
        document.getElementById('activity-log-action-type').value = 'all';
        document.getElementById('activity-log-module').value = 'all';
        document.getElementById('activity-log-username').value = '';
        document.getElementById('activity-log-date-from').value = '';
        document.getElementById('activity-log-date-to').value = '';
        this.applyFilters();
    },

    /**
     * عرض النموذج
     */
    showModal() {
        // التحقق من صلاحيات المستخدم
        const isAdmin = (typeof Permissions !== 'undefined' && typeof Permissions.isCurrentUserAdmin === 'function') 
            ? Permissions.isCurrentUserAdmin() 
            : (AppState.currentUser?.role || '').toLowerCase() === 'admin';
        
        if (!isAdmin) {
            Notification.error('لا توجد صلاحيات لعرض سجل الأنشطة. يرجى التواصل مع المدير.');
            return;
        }

        const modalHTML = `
            <div class="modal-overlay" id="activity-log-modal">
                <div class="modal-content" style="max-width: 95%; width: 1400px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2 class="modal-title">
                            <i class="fas fa-history ml-2"></i>
                            سجل أنشطة المستخدمين
                        </h2>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove(); UserActivityLog.stopAutoRefresh();">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${this.render()}
                    </div>
                </div>
            </div>
        `;

        // إزالة النموذج الموجود مسبقاً
        const existingModal = document.getElementById('activity-log-modal');
        if (existingModal) {
            existingModal.remove();
        }

            // إضافة النموذج
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // ربط أحداث الفلاتر
        setTimeout(() => {
            const searchInput = document.getElementById('activity-log-search');
            if (searchInput) {
                searchInput.addEventListener('input', () => this.applyFilters());
            }
            
            const actionTypeSelect = document.getElementById('activity-log-action-type');
            if (actionTypeSelect) {
                actionTypeSelect.addEventListener('change', () => this.applyFilters());
            }
            
            const moduleSelect = document.getElementById('activity-log-module');
            if (moduleSelect) {
                moduleSelect.addEventListener('change', () => this.applyFilters());
            }
            
            const usernameInput = document.getElementById('activity-log-username');
            if (usernameInput) {
                usernameInput.addEventListener('input', () => this.applyFilters());
            }
            
            const dateFromInput = document.getElementById('activity-log-date-from');
            if (dateFromInput) {
                dateFromInput.addEventListener('change', () => this.applyFilters());
            }
            
            const dateToInput = document.getElementById('activity-log-date-to');
            if (dateToInput) {
                dateToInput.addEventListener('change', () => this.applyFilters());
            }
            
            // بدء التحديث الدوري التلقائي
            this.startAutoRefresh();
            
            // تحميل السجلات من قاعدة البيانات
            this.loadLogsFromBackend();
        }, 100);
    },
    
    /**
     * متغيرات التحديث الدوري
     */
    autoRefreshInterval: null,
    autoRefreshEnabled: true,
    
    /**
     * بدء التحديث الدوري التلقائي (كل 30 ثانية)
     */
    startAutoRefresh() {
        this.stopAutoRefresh(); // إيقاف أي تحديث سابق
        
        if (!this.autoRefreshEnabled) return;
        
        this.autoRefreshInterval = setInterval(() => {
            // تحديث السجلات من قاعدة البيانات
            this.loadLogsFromBackend();
            // إعادة تطبيق الفلاتر الحالية
            this.applyFilters();
        }, 30000); // كل 30 ثانية
    },
    
    /**
     * إيقاف التحديث الدوري
     */
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    },
    
    /**
     * تحميل السجلات من قاعدة البيانات
     */
    async loadLogsFromBackend() {
        if (typeof GoogleIntegration === 'undefined' || !GoogleIntegration.sendToAppsScript) {
            return;
        }
        
        try {
            const result = await GoogleIntegration.sendToAppsScript('getAllUserActivityLogs', {});
            
            if (result && result.success && Array.isArray(result.data)) {
                // دمج السجلات من قاعدة البيانات مع السجلات المحلية
                const backendLogs = result.data || [];
                const localLogs = AppState.appData.user_activity_log || [];
                
                // إنشاء خريطة للسجلات المحلية لتجنب التكرار
                const localLogsMap = new Map();
                localLogs.forEach(log => {
                    if (log.id) {
                        localLogsMap.set(log.id, log);
                    }
                });
                
                // إضافة السجلات من قاعدة البيانات
                backendLogs.forEach(log => {
                    if (log.id && !localLogsMap.has(log.id)) {
                        localLogsMap.set(log.id, log);
                    }
                });
                
                // تحديث AppState
                AppState.appData.user_activity_log = Array.from(localLogsMap.values());
                
                // ترتيب حسب التاريخ (الأحدث أولاً)
                AppState.appData.user_activity_log.sort((a, b) => {
                    const dateA = new Date(a.timestamp || a.createdAt || 0);
                    const dateB = new Date(b.timestamp || b.createdAt || 0);
                    return dateB - dateA;
                });
                
                // حفظ محلي
                DataManager.save();
            }
        } catch (error) {
            Utils.safeWarn('فشل تحميل السجلات من قاعدة البيانات:', error);
        }
    },
    
    /**
     * دالة مساعدة لتسجيل عمليات CRUD بشكل موحد
     * @param {string} action - 'add', 'update', 'delete'
     * @param {string} module - اسم الموديول
     * @param {string} recordId - معرف السجل
     * @param {object} recordData - بيانات السجل (اختياري)
     */
    logOperation(action, module, recordId, recordData = {}) {
        if (!['add', 'update', 'delete'].includes(action)) {
            Utils.safeWarn('عملية غير صحيحة:', action);
            return;
        }
        
        const details = {
            description: this.getActionDescription(action, module, recordId),
            recordData: recordData
        };
        
        return this.log(action, module, recordId, details);
    },
    
    /**
     * الحصول على وصف العملية
     */
    getActionDescription(action, module, recordId) {
        const actionLabels = {
            'add': 'إضافة',
            'update': 'تحديث',
            'delete': 'حذف'
        };
        
        return `${actionLabels[action] || action} سجل في ${module}${recordId ? ` (ID: ${recordId})` : ''}`;
    }
};

// Export to global window (for script tag loading)
if (typeof window !== 'undefined') {
    window.UserActivityLog = UserActivityLog;
}

