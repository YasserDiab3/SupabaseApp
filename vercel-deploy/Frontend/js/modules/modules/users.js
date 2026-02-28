/**
 * Users Module
 * تم استخراجه من app-modules.js
 */

// ===== Users Module =====
const Users = {
    currentView: 'list', // list, form, edit
    currentEditId: null,
    autoRefreshInterval: null, // لتخزين معرف التحديث التلقائي
    refreshInterval: 5000, // تحديث كل 5 ثوان
    sectionChangeHandler: null, // لتخزين معالج حدث تغيير القسم

    async load() {
        const section = document.getElementById('users-section');
        if (!section) return;

        // التحقق من الصلاحيات - فقط المدير يمكنه الوصول
        const isAdmin = (typeof Permissions !== 'undefined' && typeof Permissions.isCurrentUserAdmin === 'function')
            ? Permissions.isCurrentUserAdmin()
            : (AppState.currentUser?.role || '').toLowerCase() === 'admin';

        if (!isAdmin) {
            section.innerHTML = `
                <div class="content-card">
                    <div class="empty-state">
                        <i class="fas fa-lock text-4xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">ليس لديك صلاحية للوصول إلى إدارة المستخدمين</p>
                        <p class="text-sm text-gray-400 mt-2">يجب أن تكون مدير النظام للوصول إلى هذه الصفحة</p>
                    </div>
                </div>
            `;
            return;
        }

        try {
            section.innerHTML = `
            <div class="section-header">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="section-title">
                            <i class="fas fa-users ml-3" aria-hidden="true"></i>
                            إدارة المستخدمين
                        </h1>
                        <p class="section-subtitle">إدارة المستخدمين وصلاحياتهم</p>
                    </div>
                    <button id="add-user-btn" class="btn-primary">
                        <i class="fas fa-plus ml-2" aria-hidden="true"></i>
                        إضافة مستخدم جديد
                    </button>
                </div>
            </div>

            <div id="users-content" class="mt-6">
                <div class="content-card">
                    <div class="card-body">
                        <div class="empty-state">
                            <div style="width: 300px; margin: 0 auto 16px;">
                                <div style="width: 100%; height: 6px; background: rgba(59, 130, 246, 0.2); border-radius: 3px; overflow: hidden;">
                                    <div style="height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb, #3b82f6); background-size: 200% 100%; border-radius: 3px; animation: loadingProgress 1.5s ease-in-out infinite;"></div>
                                </div>
                            </div>
                            <p class="text-gray-500">جاري تحميل قائمة المستخدمين...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

            this.setupEventListeners();
            
            // ✅ تحميل القائمة فوراً بعد عرض الواجهة
            setTimeout(async () => {
                try {
                    const contentArea = document.getElementById('users-content');
                    if (!contentArea) return;
                    
                    const listContent = await this.renderList().catch(error => {
                        Utils.safeWarn('⚠️ خطأ في تحميل القائمة:', error);
                        return `
                            <div class="content-card">
                                <div class="card-body">
                                    <div class="empty-state">
                                        <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                                        <p class="text-gray-500 mb-4">حدث خطأ في تحميل البيانات</p>
                                        <button onclick="Users.load()" class="btn-primary">
                                            <i class="fas fa-redo ml-2"></i>
                                            إعادة المحاولة
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    
                    contentArea.innerHTML = listContent;
                    this.loadUsersList();
                } catch (error) {
                    Utils.safeWarn('⚠️ خطأ في تحميل القائمة:', error);
                }
            }, 0);
            
            // بدء التحديث التلقائي لحالة الاتصال وآخر تسجيل دخول
            this.startAutoRefresh();
            
            // الاستماع لتغيير الأقسام لإيقاف التحديث التلقائي عند إغلاق الموديول
            this.setupSectionChangeListener();
        } catch (error) {
            if (typeof Utils !== 'undefined' && Utils.safeError) {
                Utils.safeError('❌ خطأ في تحميل مديول المستخدمين:', error);
            } else {
                console.error('❌ خطأ في تحميل مديول المستخدمين:', error);
            }
            if (section) {
                section.innerHTML = `
                    <div class="content-card">
                        <div class="card-body">
                            <div class="empty-state">
                                <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                                <p class="text-gray-500 mb-4">حدث خطأ أثناء تحميل البيانات</p>
                                <button onclick="Users.load()" class="btn-primary">
                                    <i class="fas fa-redo ml-2"></i>
                                    إعادة المحاولة
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    },

    async renderList() {
        return `
            <div class="content-card">
                <div class="card-header">
                    <div class="flex items-center justify-between">
                        <h2 class="card-title">
                            <i class="fas fa-list ml-2" aria-hidden="true"></i>
                            قائمة المستخدمين
                        </h2>
                        <div class="flex items-center gap-4">
                            <input 
                                type="text" 
                                id="users-search" 
                                class="form-input" 
                                style="max-width: 300px;"
                                placeholder="البحث عن مستخدم..."
                            >
                            <select id="users-filter-role" class="form-input" style="max-width: 200px;">
                                <option value="">جميع الأدوار</option>
                                <option value="admin">مدير</option>
                                <option value="safety_officer">مسؤول السلامة</option>
                                <option value="user">مستخدم</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div id="users-table-container">
                        <div class="empty-state">
                            <div style="width: 300px; margin: 0 auto 16px;">
                                <div style="width: 100%; height: 6px; background: rgba(59, 130, 246, 0.2); border-radius: 3px; overflow: hidden;">
                                    <div style="height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb, #3b82f6); background-size: 200% 100%; border-radius: 3px; animation: loadingProgress 1.5s ease-in-out infinite;"></div>
                                </div>
                            </div>
                            <p class="text-gray-500">جاري التحميل...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async renderForm(userData = null) {
        const isEdit = !!userData;
        return `
            <div class="content-card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-${isEdit ? 'edit' : 'user-plus'} ml-2" aria-hidden="true"></i>
                        ${isEdit ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
                    </h2>
                </div>
                <div class="card-body">
                    <form id="user-form" class="space-y-6">
                        <div class="grid grid-cols-2 gap-6">
                            <div class="col-span-2">
                                <label for="user-photo-input" class="block text-sm font-semibold text-gray-700 mb-2">
                                    <i class="fas fa-image ml-2"></i>
                                    صورة المستخدم
                                </label>
                                <div class="flex items-center gap-4">
                                    <div class="w-24 h-24 rounded-full border-2 border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center">
                                        <img id="user-photo-preview" src="${userData?.photo || ''}" alt="صورة المستخدم" style="width: 100%; height: 100%; object-fit: cover; display: ${userData?.photo ? 'block' : 'none'};">
                                        <i id="user-photo-icon" class="fas fa-user text-3xl text-gray-400" style="display: ${userData?.photo ? 'none' : 'block'}"></i>
                                    </div>
                                    <div class="flex-1">
                                        <input 
                                            type="file" 
                                            id="user-photo-input" 
                                            accept="image/*"
                                            class="form-input"
                                            style="padding: 0.5rem;"
                                        >
                                        <p class="text-xs text-gray-500 mt-1">اضف صورة مربعة بحجم لا يتجاوز 2MB</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label for="user-name" class="block text-sm font-semibold text-gray-700 mb-2">
                                    <i class="fas fa-user ml-2"></i>
                                    الاسم الكامل *
                                </label>
                                <input 
                                    type="text" 
                                    id="user-name" 
                                    name="name" 
                                    required
                                    class="form-input"
                                    value="${userData?.name || ''}"
                                    placeholder="أدخل الاسم الكامل"
                                >
                            </div>

                            <div>
                                <label for="user-email" class="block text-sm font-semibold text-gray-700 mb-2">
                                    <i class="fas fa-envelope ml-2"></i>
                                    البريد الإلكتروني *
                                </label>
                                <input 
                                    type="email" 
                                    id="user-email" 
                                    name="email" 
                                    required
                                    class="form-input"
                                    value="${userData?.email || ''}"
                                    placeholder="example@americana.com"
                                    ${isEdit ? 'readonly' : ''}
                                >
                            </div>

                            <div>
                                <label for="user-password" class="block text-sm font-semibold text-gray-700 mb-2">
                                    <i class="fas fa-key ml-2"></i>
                                    كلمة المرور ${isEdit ? '(اتركه فارغاً للإبقاء على القديم)' : '*'}
                                </label>
                                <input 
                                    type="password" 
                                    id="user-password" 
                                    name="password" 
                                    autocomplete="current-password"
                                    ${isEdit ? '' : 'required'}
                                    class="form-input"
                                    placeholder="••••••••"
                                >
                            </div>

                            <div>
                                <label for="user-role" class="block text-sm font-semibold text-gray-700 mb-2">
                                    <i class="fas fa-user-tag ml-2"></i>
                                    الدور *
                                </label>
                                <select id="user-role" name="role" required class="form-input">
                                    <option value="">اختر الدور</option>
                                    <option value="admin" ${userData?.role === 'admin' ? 'selected' : ''}>مدير النظام</option>
                                    <option value="safety_officer" ${userData?.role === 'safety_officer' ? 'selected' : ''}>مسؤول السلامة</option>
                                    <option value="user" ${userData?.role === 'user' ? 'selected' : ''}>مستخدم</option>
                                </select>
                            </div>

                            <div>
                                <label for="user-department" class="block text-sm font-semibold text-gray-700 mb-2">
                                    <i class="fas fa-building ml-2"></i>
                                    القسم *
                                </label>
                                <input 
                                    type="text" 
                                    id="user-department" 
                                    name="department" 
                                    required
                                    class="form-input"
                                    value="${userData?.department || ''}"
                                    placeholder="أدخل القسم"
                                >
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">
                                    <i class="fas fa-toggle-on ml-2"></i>
                                    الحالة
                                </label>
                                <label class="flex items-center mt-2">
                                    <input 
                                        type="checkbox" 
                                        id="user-active" 
                                        name="active"
                                        class="rounded border-gray-300 text-blue-600"
                                        ${userData?.active !== false ? 'checked' : ''}
                                    >
                                    <span class="mr-2 text-sm text-gray-700">نشط</span>
                                </label>
                            </div>
                        </div>

                        <div class="border-t pt-4 mt-4">
                            <div class="flex items-center justify-between mb-3">
                                <label class="block text-sm font-semibold text-gray-700">
                                    <i class="fas fa-shield-alt ml-2"></i>
                                    صلاحيات الوصول للوحدات
                                </label>
                                <div class="flex gap-2">
                                    <button type="button" id="select-all-permissions-btn" class="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                                        <i class="fas fa-check-double ml-1"></i>
                                        تحديد الكل
                                    </button>
                                    <button type="button" id="deselect-all-permissions-btn" class="text-xs px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition">
                                        <i class="fas fa-times ml-1"></i>
                                        إلغاء الكل
                                    </button>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-3" id="modules-permissions-container">
                                ${MODULE_PERMISSIONS_CONFIG.map(module => {
            const hasPermission = userData?.permissions && userData.permissions[module.key] === true;
            const selectedRole = document.getElementById('user-role')?.value || userData?.role;
            const isAdmin = selectedRole === 'admin' || userData?.role === 'admin';
            const hasDetailedPerms = module.hasDetailedPermissions && MODULE_DETAILED_PERMISSIONS[module.key];
            
            return `
                                        <div class="module-permission-item ${hasDetailedPerms ? 'has-detailed' : ''}">
                                            <label class="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer ${isAdmin ? 'opacity-50 cursor-not-allowed' : ''}">
                                                <input 
                                                    type="checkbox" 
                                                    class="user-permission-checkbox rounded border-gray-300 text-blue-600 mr-2" 
                                                    data-module="${module.key}"
                                                    ${hasPermission ? 'checked' : ''}
                                                    ${isAdmin ? 'disabled' : ''}
                                                    ${isAdmin ? 'title="المدير لديه صلاحيات كاملة"' : ''}
                                                >
                                                <i class="fas ${module.icon} ml-1 text-gray-600"></i>
                                                <span class="text-sm text-gray-700">${module.label}</span>
                                                ${hasDetailedPerms && !isAdmin ? `
                                                    <button type="button" class="mr-auto text-blue-500 hover:text-blue-700" 
                                                            data-action="show-detailed-permissions" 
                                                            data-module="${module.key}"
                                                            title="إدارة الصلاحيات التفصيلية">
                                                        <i class="fas fa-cog text-xs"></i>
                                                    </button>
                                                ` : ''}
                                            </label>
                                        </div>
                                    `;
        }).join('')}
                            </div>
                            <p class="text-xs text-gray-500 mt-2">
                                <i class="fas fa-info-circle ml-1"></i>
                                يمكنك تحديد الوحدات التي يمكن للمستخدم الوصول إليها. المدير لديه صلاحيات كاملة تلقائياً.
                                <br>
                                <i class="fas fa-cog ml-1 text-blue-500"></i>
                                المديولات التي بها أيقونة الترس يمكن تخصيص صلاحيات تفصيلية لها.
                            </p>
                        </div>

                        <div class="flex items-center justify-end gap-4 pt-4 border-t">
                            <button type="button" id="cancel-user-btn" class="btn-secondary">
                                إلغاء
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save ml-2" aria-hidden="true"></i>
                                ${isEdit ? 'حفظ التعديلات' : 'إضافة مستخدم'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    renderUserRow(user) {
        const isOnline = user.isOnline === true;
        const lastLoginTime = user.lastLogin ? Utils.formatDateTime(user.lastLogin) : '-';
        const displayName = (user.name != null && String(user.name).trim()) ? String(user.name).trim() : (user.email ? String(user.email) : '—');
        const displayEmail = (user.email != null && String(user.email).trim()) ? String(user.email) : (user.id && /@/.test(String(user.id)) ? String(user.id) : '—');
        const displayDept = (user.department != null && String(user.department).trim()) ? String(user.department) : '—';
        const safeId = Utils.escapeHTML(String(user.id || ''));
        const safeEmail = Utils.escapeHTML(displayEmail);
        return `
            <tr>
                <td><div class="flex items-center gap-3">${user.photo ? `<img src="${user.photo}" alt="${Utils.escapeHTML(displayName)}" class="w-10 h-10 rounded-full object-cover">` : `<div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"><i class="fas fa-user text-gray-400"></i></div>`}<span>${Utils.escapeHTML(displayName)}</span></div></td>
                <td>${Utils.escapeHTML(displayEmail)}</td>
                <td><div class="flex items-center gap-2"><i class="fas fa-lock text-gray-400 text-sm"></i><span class="text-sm text-gray-600">${user.password && user.password !== '***' ? '••••••••' : '<span class="text-gray-400">***</span>'}</span></div></td>
                <td><div class="flex items-center gap-2"><i class="fas fa-key text-gray-400 text-sm"></i><span class="text-sm text-gray-600 font-mono">${user.passwordHash ? (String(user.passwordHash).substring(0, 8) + '...') : '<span class="text-gray-400">غير محدد</span>'}</span></div></td>
                <td><span class="badge badge-${this.getRoleBadgeClass(user.role)}">${this.getRoleName(user.role)}</span></td>
                <td>${Utils.escapeHTML(displayDept)}</td>
                <td><span class="badge badge-${user.active !== false ? 'success' : 'danger'}">${user.active !== false ? 'نشط' : 'غير نشط'}</span></td>
                <td><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}" style="animation: ${isOnline ? 'pulse 2s infinite' : 'none'};"></div><span class="text-sm ${isOnline ? 'text-green-600' : 'text-gray-500'}">${isOnline ? 'متصل' : 'غير متصل'}</span></div></td>
                <td><span class="text-sm text-gray-600" title="${user.lastLogin || '-'}">${lastLoginTime}</span></td>
                <td>${(user.createdAt || user.created_at) ? Utils.formatDate(user.createdAt || user.created_at) : '-'}</td>
                <td><div class="flex items-center gap-2">${isOnline ? `<button onclick="Users.revokeUserSession('${safeId}')" class="btn-icon btn-icon-secondary" title="سحب الجلسة"><i class="fas fa-sign-out-alt"></i></button>` : ''}<button onclick="Users.resetUserPassword('${safeId}', '${safeEmail}')" class="btn-icon btn-icon-warning" title="إعادة تعيين كلمة المرور"><i class="fas fa-key"></i></button><button onclick="Users.editUser('${safeId}')" class="btn-icon btn-icon-primary" title="تعديل"><i class="fas fa-edit"></i></button><button onclick="Users.deleteUser('${safeId}')" class="btn-icon btn-icon-danger" title="حذف"><i class="fas fa-trash"></i></button></div></td>
            </tr>
        `;
    },

    async loadUsersList(usersToDisplay, isFilterResult = false) {
        const container = document.getElementById('users-table-container');
        if (!container) return;
        const users = usersToDisplay !== undefined ? (usersToDisplay || []) : (AppState.appData.users || []);

        if (users.length === 0) {
            if (isFilterResult) {
                container.innerHTML = `<div class="table-wrapper" style="overflow-x: auto;"><table class="data-table" dir="rtl"><thead><tr><th>الاسم</th><th>البريد الإلكتروني</th><th>كلمة المرور</th><th>كلمة المرور المشفرة</th><th>الدور</th><th>القسم</th><th>الحالة</th><th>الحالة الاتصال</th><th>آخر تسجيل دخول</th><th>تاريخ الإنشاء</th><th>الإجراءات</th></tr></thead><tbody><tr><td colspan="11" class="text-center text-gray-500 py-8">لا توجد نتائج</td></tr></tbody></table></div>`;
            } else {
                container.innerHTML = `<div class="empty-state"><i class="fas fa-users text-4xl text-gray-300 mb-4"></i><p class="text-gray-500">لا يوجد مستخدمين</p><button id="add-user-empty-btn" class="btn-primary mt-4"><i class="fas fa-plus ml-2"></i>إضافة مستخدم جديد</button></div>`;
            }
            return;
        }

        const tableHTML = `
            <div class="table-wrapper" style="overflow-x: auto;">
                <table class="data-table" dir="rtl">
                    <thead>
                        <tr>
                            <th>الاسم</th>
                            <th>البريد الإلكتروني</th>
                            <th>كلمة المرور</th>
                            <th>كلمة المرور المشفرة</th>
                            <th>الدور</th>
                            <th>القسم</th>
                            <th>الحالة</th>
                            <th>الحالة الاتصال</th>
                            <th>آخر تسجيل دخول</th>
                            <th>تاريخ الإنشاء</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => this.renderUserRow(user)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    },

    getRoleName(role) {
        if (role == null || String(role).trim() === '') return '—';
        const roles = {
            'admin': 'مدير النظام',
            'safety_officer': 'مسؤول السلامة',
            'user': 'مستخدم'
        };
        const r = String(role).trim().toLowerCase();
        return roles[r] || (r ? role : '—');
    },

    getRoleBadgeClass(role) {
        const classes = {
            'admin': 'danger',
            'safety_officer': 'warning',
            'user': 'info'
        };
        return classes[role] || 'secondary';
    },

    setupEventListeners() {
        // إضافة مستخدم جديد
        setTimeout(() => {
            const addBtn = document.getElementById('add-user-btn');
            const addEmptyBtn = document.getElementById('add-user-empty-btn');

            if (addBtn) {
                addBtn.addEventListener('click', () => this.showForm());
            }
            if (addEmptyBtn) {
                addEmptyBtn.addEventListener('click', () => this.showForm());
            }

            // استيراد Excel
            const importExcelBtn = document.getElementById('import-excel-btn');
            if (importExcelBtn) {
                importExcelBtn.addEventListener('click', () => this.showImportExcel());
            }

            // البحث والتصفية
            const searchInput = document.getElementById('users-search');
            const filterRole = document.getElementById('users-filter-role');

            if (searchInput) {
                searchInput.addEventListener('input', (e) => this.filterUsers(e.target.value, filterRole?.value));
            }
            if (filterRole) {
                filterRole.addEventListener('change', (e) => this.filterUsers(searchInput?.value, e.target.value));
            }

            // نموذج المستخدم
            const userForm = document.getElementById('user-form');
            if (userForm) {
                userForm.addEventListener('submit', (e) => this.handleSubmit(e));
            }

            const cancelBtn = document.getElementById('cancel-user-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.showList());
            }

            this.setupPhotoPreview();
        }, 100);
    },

    async showForm(userData = null) {
        Utils.safeLog('🔧 عرض نموذج إضافة/تعديل مستخدم:', userData ? 'تعديل' : 'إضافة جديد');
        this.currentEditId = userData?.id || null;
        
        // تحميل الصلاحيات التفصيلية الحالية
        // ✅ إصلاح: تهيئة الصلاحيات التفصيلية بشكل صحيح
        this.currentDetailedPermissions = {};
        if (userData && userData.permissions) {
            let perms;
            try {
                // ✅ إصلاح: استخدام Permissions.normalizePermissions إذا كان متاحاً
                if (typeof Permissions !== 'undefined' && typeof Permissions.normalizePermissions === 'function') {
                    perms = Permissions.normalizePermissions(userData.permissions);
                } else if (typeof userData.permissions === 'string') {
                    // محاولة تحليل JSON
                    const trimmed = userData.permissions.trim();
                    // التحقق من أن النص يبدأ بـ { أو [ (JSON صالح)
                    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                        perms = JSON.parse(trimmed);
                    } else {
                        // إذا لم يكن JSON، قد يكون نص عادي - نحاول تحويله
                        // مثال: "employees: true\nincidents: true" -> {employees: true, incidents: true}
                        try {
                            // محاولة تحويل النص إلى كائن
                            const lines = trimmed.split('\n').filter(line => line.trim());
                            perms = {};
                            lines.forEach(line => {
                                const match = line.match(/^([^:]+):\s*(.+)$/);
                                if (match) {
                                    const key = match[1].trim();
                                    const value = match[2].trim();
                                    // تحويل القيم النصية إلى boolean/string
                                    if (value === 'true') {
                                        perms[key] = true;
                                    } else if (value === 'false') {
                                        perms[key] = false;
                                    } else if (!isNaN(value)) {
                                        perms[key] = Number(value);
                                    } else {
                                        perms[key] = value;
                                    }
                                }
                            });
                        } catch (parseError) {
                            // إذا فشل التحويل، نستخدم كائن فارغ
                            perms = {};
                        }
                    }
                } else {
                    perms = userData.permissions;
                }
            } catch (error) {
                // استخدام safeError بدلاً من console.error لتجنب إظهار الأخطاء غير الحرجة
                if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                    Utils.safeWarn('⚠️ خطأ في تحليل صلاحيات المستخدم - سيتم استخدام الصلاحيات الافتراضية');
                }
                perms = {};
            }
            
            // ✅ إصلاح: التأكد من أن perms هو كائن صالح
            if (!perms || typeof perms !== 'object' || Array.isArray(perms)) {
                perms = {};
            }
            
            // استخراج الصلاحيات التفصيلية
            Object.keys(perms).forEach(key => {
                if (key.endsWith('Permissions') && typeof perms[key] === 'object' && !Array.isArray(perms[key])) {
                    this.currentDetailedPermissions[key] = perms[key];
                }
            });
        }

        const content = document.getElementById('users-content');
        if (content) {
            content.innerHTML = await this.renderForm(userData);
            this.setupEventListeners();

            // تحديث حالة الصلاحيات عند تغيير الدور
            setTimeout(() => {
                const roleSelect = document.getElementById('user-role');
                if (roleSelect) {
                    roleSelect.addEventListener('change', () => {
                        this.updatePermissionsUI();
                    });
                }

                // تهيئة أزرار تحديد/إلغاء الكل
                this.setupSelectAllButtons();

                // تهيئة أزرار الصلاحيات التفصيلية
                this.setupDetailedPermissionsButtons();

                // تحديث حالة الصلاحيات عند التحميل
                this.updatePermissionsUI();
            }, 100);
        } else {
            Utils.safeError(' لم يتم العثور على users-content');
        }
    },

    updatePermissionsUI() {
        const roleSelect = document.getElementById('user-role');
        const selectedRole = roleSelect?.value;
        const checkboxes = document.querySelectorAll('.user-permission-checkbox');

        checkboxes.forEach(checkbox => {
            const isAdmin = selectedRole === 'admin';
            if (isAdmin) {
                checkbox.disabled = true;
                checkbox.checked = true;
                checkbox.parentElement.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                checkbox.disabled = false;
                checkbox.parentElement.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });

        // إخفاء/إظهار أزرار التحديد حسب الدور
        const selectAllBtn = document.getElementById('select-all-permissions-btn');
        const deselectAllBtn = document.getElementById('deselect-all-permissions-btn');
        if (selectAllBtn && deselectAllBtn) {
            if (selectedRole === 'admin') {
                selectAllBtn.style.display = 'none';
                deselectAllBtn.style.display = 'none';
            } else {
                selectAllBtn.style.display = 'inline-flex';
                deselectAllBtn.style.display = 'inline-flex';
            }
        }
    },

    setupSelectAllButtons() {
        const selectAllBtn = document.getElementById('select-all-permissions-btn');
        const deselectAllBtn = document.getElementById('deselect-all-permissions-btn');

        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                const checkboxes = document.querySelectorAll('.user-permission-checkbox:not([disabled])');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = true;
                });
                Notification.success('تم تحديد جميع الصلاحيات');
            });
        }

        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => {
                const checkboxes = document.querySelectorAll('.user-permission-checkbox:not([disabled])');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
                Notification.success('تم إلغاء جميع الصلاحيات');
            });
        }
    },

    setupDetailedPermissionsButtons() {
        const buttons = document.querySelectorAll('[data-action="show-detailed-permissions"]');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const moduleName = button.getAttribute('data-module');
                this.showDetailedPermissionsModal(moduleName);
            });
        });
    },

    showDetailedPermissionsModal(moduleName) {
        const moduleDetails = MODULE_DETAILED_PERMISSIONS[moduleName];
        if (!moduleDetails) {
            Notification.error('لا توجد صلاحيات تفصيلية لهذا المديول');
            return;
        }

        // الحصول على الصلاحيات الحالية
        const currentPermissions = this.currentDetailedPermissions || {};
        const modulePerms = currentPermissions[`${moduleName}Permissions`] || {};

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i class="fas fa-cog ml-2"></i>
                        ${moduleDetails.label}
                    </h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p class="text-sm text-gray-600 mb-4">
                        <i class="fas fa-info-circle ml-1"></i>
                        حدد الصلاحيات التفصيلية التي تريد منحها للمستخدم داخل هذا المديول
                    </p>
                    <div class="space-y-2">
                        ${moduleDetails.permissions.map(perm => `
                            <label class="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    class="detailed-permission-checkbox rounded border-gray-300 text-blue-600 mr-2" 
                                    data-module="${moduleName}"
                                    data-permission="${perm.key}"
                                    ${modulePerms[perm.key] === true ? 'checked' : ''}
                                >
                                <i class="fas ${perm.icon} ml-2 text-gray-600"></i>
                                <span class="text-sm text-gray-700">${perm.label}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="flex gap-2 mt-4">
                        <button type="button" id="select-all-detailed-btn" class="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                            <i class="fas fa-check-double ml-1"></i>
                            تحديد الكل
                        </button>
                        <button type="button" id="deselect-all-detailed-btn" class="text-xs px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition">
                            <i class="fas fa-times ml-1"></i>
                            إلغاء الكل
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        إلغاء
                    </button>
                    <button type="button" class="btn-primary" id="save-detailed-permissions-btn">
                        <i class="fas fa-save ml-2"></i>
                        حفظ الصلاحيات
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // إغلاق عند النقر خارج النافذة
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // أزرار تحديد/إلغاء الكل
        const selectAllDetailedBtn = modal.querySelector('#select-all-detailed-btn');
        const deselectAllDetailedBtn = modal.querySelector('#deselect-all-detailed-btn');

        if (selectAllDetailedBtn) {
            selectAllDetailedBtn.addEventListener('click', () => {
                const checkboxes = modal.querySelectorAll('.detailed-permission-checkbox');
                checkboxes.forEach(cb => cb.checked = true);
            });
        }

        if (deselectAllDetailedBtn) {
            deselectAllDetailedBtn.addEventListener('click', () => {
                const checkboxes = modal.querySelectorAll('.detailed-permission-checkbox');
                checkboxes.forEach(cb => cb.checked = false);
            });
        }

        // حفظ الصلاحيات
        const saveBtn = modal.querySelector('#save-detailed-permissions-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const checkboxes = modal.querySelectorAll('.detailed-permission-checkbox');
                const permissions = {};
                
                checkboxes.forEach(checkbox => {
                    const permKey = checkbox.getAttribute('data-permission');
                    permissions[permKey] = checkbox.checked;
                });

                // حفظ الصلاحيات التفصيلية
                if (!this.currentDetailedPermissions) {
                    this.currentDetailedPermissions = {};
                }
                this.currentDetailedPermissions[`${moduleName}Permissions`] = permissions;

                Notification.success('تم حفظ الصلاحيات التفصيلية');
                modal.remove();
            });
        }
    },

    async showList() {
        this.currentEditId = null;
        const content = document.getElementById('users-content');
        if (content) {
            content.innerHTML = await this.renderList();
            this.setupEventListeners();
            this.loadUsersList();
        }
    },

    async handleSubmit(e) {
        e.preventDefault();

        // منع النقر المتكرر
        const submitBtn = e.target?.querySelector('button[type="submit"]') || 
                         document.querySelector('#user-form button[type="submit"]');
        
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

        // عرض مؤشر التحميل فوراً
        Loading.show();

        // التحقق من الصلاحيات
        const isAdmin = (typeof Permissions !== 'undefined' && typeof Permissions.isCurrentUserAdmin === 'function')
            ? Permissions.isCurrentUserAdmin()
            : (AppState.currentUser?.role || '').toLowerCase() === 'admin';

        if (!isAdmin) {
            Loading.hide();
            Notification.error('ليس لديك صلاحية لإضافة أو تعديل المستخدمين');
            // استعادة الزر عند الخطأ
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            return;
        }

        const userData = this.currentEditId ? AppState.appData.users.find(u => u.id === this.currentEditId) : null;

        // معالجة الصورة
        let photoBase64 = userData?.photo || '';
        const photoInput = document.getElementById('user-photo-input');
        if (photoInput && photoInput.files.length > 0) {
            const file = photoInput.files[0];
            if (file.size > 2 * 1024 * 1024) {
                Loading.hide();
                Notification.error('حجم الصورة كبير جداً. الحد الأقصى 2MB');
                // استعادة الزر عند الخطأ
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
                return;
            }
            photoBase64 = await this.convertImageToBase64(file);
        }

        const passwordInputElement = document.getElementById('user-password');
        const rawPasswordInput = passwordInputElement ? passwordInputElement.value : '';
        const trimmedPasswordInput = rawPasswordInput ? rawPasswordInput.trim() : '';

        const existingPasswordHash = userData?.passwordHash || (Utils.isSha256Hex(userData?.password) ? userData?.password : '');
        const existingDisplayPassword = userData?.password && userData.password !== '' ? userData.password : '***';

        // فحص العناصر قبل الاستخدام
        const nameEl = document.getElementById('user-name');
        const emailEl = document.getElementById('user-email');
        const roleEl = document.getElementById('user-role');
        const departmentEl = document.getElementById('user-department');
        const activeEl = document.getElementById('user-active');
        
        if (!nameEl || !emailEl || !roleEl || !departmentEl || !activeEl) {
            Loading.hide();
            Notification.error('بعض الحقول المطلوبة غير موجودة. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            return;
        }

        // ✅ إصلاح: جمع الصلاحيات بشكل صحيح
        const collectedPermissions = this.collectPermissions();
        
        const emailValue = emailEl.value.trim().toLowerCase();
        const formData = {
            id: this.currentEditId || emailValue,
            name: nameEl.value.trim(),
            email: emailValue,
            role: roleEl.value,
            department: departmentEl.value.trim(),
            active: activeEl.checked,
            photo: photoBase64,
            // ✅ إصلاح: التأكد من حفظ الصلاحيات حتى لو كانت فارغة (لكن ليس undefined)
            // حفظ الصلاحيات ككائن فارغ {} بدلاً من undefined لضمان عدم فقدانها
            permissions: collectedPermissions && typeof collectedPermissions === 'object' ? collectedPermissions : {},
            createdAt: this.currentEditId
                ? AppState.appData.users.find(u => u.id === this.currentEditId)?.createdAt
                : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // إضافة حقول جديدة لتسجيل الدخول
            lastLogin: userData?.lastLogin || null,
            lastLogout: userData?.lastLogout || null,
            isOnline: userData?.isOnline || false,
            loginHistory: userData?.loginHistory || []
        };

        // التحقق من البيانات
        if (!formData.name || !formData.email || !formData.role || !formData.department) {
            Loading.hide();
            Notification.error('يرجى ملء جميع الحقول المطلوبة');
            // استعادة الزر عند الخطأ
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            return;
        }

        if (!Utils.isValidEmail(formData.email)) {
            Loading.hide();
            Notification.error('يرجى إدخال بريد إلكتروني صحيح');
            // استعادة الزر عند الخطأ
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            return;
        }

        const isNewUser = !this.currentEditId;
        const passwordUpdated = trimmedPasswordInput.length > 0;
        const previousUser = this.currentEditId
            ? AppState.appData.users.find(u => u.id === this.currentEditId)
            : null;

        let passwordHashToStore = previousUser?.passwordHash || '';
        let forcePasswordChange = previousUser?.forcePasswordChange ?? false;
        let passwordChangedFlag = previousUser?.passwordChanged ?? false;

        if (isNewUser) {
            if (!passwordUpdated) {
                Loading.hide();
                Notification.error('يرجى إدخال كلمة المرور');
                // استعادة الزر عند الخطأ
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
                return;
            }
            if (trimmedPasswordInput.length < 6) {
                Loading.hide();
                Notification.error('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل');
                // استعادة الزر عند الخطأ
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
                return;
            }
            passwordHashToStore = await Utils.hashPassword(trimmedPasswordInput);
            forcePasswordChange = true;
            passwordChangedFlag = false;
        } else if (passwordUpdated) {
            if (trimmedPasswordInput.length < 6) {
                Loading.hide();
                Notification.error('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل');
                // استعادة الزر عند الخطأ
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
                return;
            }
            passwordHashToStore = await Utils.hashPassword(trimmedPasswordInput);
            forcePasswordChange = true;
            passwordChangedFlag = false;
        } else if (!passwordHashToStore) {
            Loading.hide();
            Notification.error('لا توجد كلمة مرور محفوظة لهذا المستخدم. يرجى إدخال كلمة مرور جديدة.');
            // استعادة الزر عند الخطأ
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            return;
        }

        formData.password = '***';
        formData.passwordHash = passwordHashToStore;
        formData.forcePasswordChange = forcePasswordChange;
        formData.passwordChanged = passwordChangedFlag;

        // التحقق من عدم تكرار البريد الإلكتروني
        const existingUser = AppState.appData.users.find(u =>
            u.email === formData.email && u.id !== formData.id
        );
        if (existingUser) {
            Loading.hide();
            Notification.error('البريد الإلكتروني مستخدم بالفعل');
            // استعادة الزر عند الخطأ
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            return;
        }

        try {
            const isNewUser = !this.currentEditId;
            const canSyncBackend = AppState.useSupabaseBackend === true || AppState.googleConfig?.appsScript?.enabled;

            if (isNewUser) {
                // إضافة مستخدم جديد
                AppState.appData.users.push(formData);

                // حفظ البيانات محلياً أولاً
                // حفظ البيانات باستخدام window.DataManager
                if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                    window.DataManager.save();
                } else {
                    Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
                }

                // إزالة الحسابات الافتراضية إذا تم إضافة مستخدم جديد
                if (typeof removeDefaultUsersIfNeeded === 'function') {
                    try {
                        await removeDefaultUsersIfNeeded();
                    } catch (removeError) {
                        Utils.safeWarn('⚠ خطأ في إزالة الحسابات الافتراضية:', removeError);
                    }
                }

                // إظهار رسالة نجاح فورية للمستخدم
                Notification.success('تم إضافة المستخدم بنجاح');
                
                // إخفاء مؤشر التحميل بعد الحفظ المحلي
                Loading.hide();
                
                // المزامنة مع الخادم (Supabase أو قاعدة البيانات) في الخلفية — التأكد من إرسال صلاحيات ككائن ودور للعمود permissions
                if (canSyncBackend) {
                    const addUserPayload = {
                        ...formData,
                        permissions: (formData.permissions != null && typeof formData.permissions === 'object' && !Array.isArray(formData.permissions)) ? formData.permissions : {},
                        role: formData.role || 'user'
                    };
                    GoogleIntegration.immediateSyncWithRetry('addUser', addUserPayload, 3)
                        .then(addUserResult => {
                            if (addUserResult && addUserResult.success) {
                                Utils.safeLog('✅ تم إضافة المستخدم الجديد إلى قاعدة البيانات بنجاح');
                                Notification.success('تم حفظ البيانات بنجاح');
                            } else if (addUserResult && addUserResult.shouldDefer) {
                                // فشلت جميع المحاولات - أضف إلى قائمة الانتظار
                                Utils.safeWarn('⚠️ فشلت المزامنة بعد 3 محاولات:', addUserResult?.message);
                                if (typeof DataManager !== 'undefined' && DataManager.addToPendingSync) {
                                    DataManager.addToPendingSync('Users', AppState.appData.users);
                                }
                                Notification.warning('سيتم المزامنة مع قاعدة البيانات تلقائياً لاحقاً.');
                            } else {
                                // خطأ في البيانات أو مشكلة أخرى
                                Utils.safeWarn('⚠️ فشل إضافة المستخدم:', addUserResult?.message);
                                Notification.warning('فشلت المزامنة مع قاعدة البيانات. سيتم المحاولة لاحقاً.');
                            }
                        })
                        .catch(addUserError => {
                            Utils.safeError('❌ خطأ غير متوقع في إضافة المستخدم:', addUserError);
                            Notification.warning('حدث خطأ في المزامنة مع قاعدة البيانات. سيتم المحاولة لاحقاً.');
                        });
                }
            } else {
                // تحديث مستخدم موجود
                const index = AppState.appData.users.findIndex(u => u.id === this.currentEditId);
                if (index !== -1) {
                    const previous = AppState.appData.users[index];
                    // الحفاظ على حالة isOnline إذا كان المستخدم متصل حالياً
                    const isCurrentlyLoggedIn = AppState.currentUser && 
                        AppState.currentUser.email && 
                        formData.email.toLowerCase() === AppState.currentUser.email.toLowerCase();
                    const finalFormData = {
                        ...formData,
                        // إذا كان المستخدم متصل حالياً، نحافظ على isOnline = true
                        isOnline: isCurrentlyLoggedIn ? true : formData.isOnline
                    };
                    AppState.appData.users[index] = { ...previous, ...finalFormData };
                }

                // حفظ البيانات محلياً
                // حفظ البيانات باستخدام window.DataManager
                if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                    window.DataManager.save();
                } else {
                    Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
                }

                // إظهار رسالة نجاح فورية للمستخدم
                Notification.success('تم تحديث المستخدم بنجاح');
                
                // إخفاء مؤشر التحميل بعد الحفظ المحلي
                Loading.hide();
                
                // المزامنة مع الخادم (Supabase أو قاعدة البيانات) في الخلفية
                if (canSyncBackend) {
                    GoogleIntegration.immediateSyncWithRetry('updateUser', {
                        userId: formData.id,
                        updateData: formData
                    }, 3)
                        .then(updateResult => {
                            if (updateResult && updateResult.success) {
                                Utils.safeLog('✅ تم تحديث المستخدم في قاعدة البيانات بنجاح');
                                Notification.success('تم حفظ البيانات بنجاح');
                            } else if (updateResult && updateResult.shouldDefer) {
                                // فشلت جميع المحاولات - أضف إلى قائمة الانتظار
                                Utils.safeWarn('⚠️ فشلت المزامنة بعد 3 محاولات:', updateResult?.message);
                                GoogleIntegration.autoSave('Users', AppState.appData.users)
                                    .catch(err => Utils.safeWarn('⚠️ خطأ في autoSave:', err));
                                Notification.warning('سيتم المزامنة مع قاعدة البيانات تلقائياً لاحقاً.');
                            } else {
                                // خطأ في البيانات
                                Utils.safeWarn('⚠️ فشل تحديث المستخدم:', updateResult?.message);
                                Notification.warning('فشلت المزامنة مع قاعدة البيانات. سيتم المحاولة لاحقاً.');
                            }
                        })
                        .catch(updateError => {
                            Utils.safeError('❌ خطأ غير متوقع في تحديث المستخدم:', updateError);
                            GoogleIntegration.autoSave('Users', AppState.appData.users)
                                .catch(err => Utils.safeWarn('⚠️ خطأ في autoSave:', err));
                            Notification.warning('حدث خطأ في المزامنة مع قاعدة البيانات. سيتم المحاولة لاحقاً.');
                        });
                }
            }

            // ✅ إصلاح: تحديث صورة المستخدم والصلاحيات في الشريط الجانبي إذا كان المستخدم الحالي
            if (AppState.currentUser && formData.email === AppState.currentUser.email) {
                // ✅ إصلاح: تحديث بيانات المستخدم الحالي مع الحفاظ على loginTime
                AppState.currentUser = { 
                    ...AppState.currentUser, 
                    ...formData,
                    loginTime: AppState.currentUser.loginTime // الحفاظ على وقت تسجيل الدخول
                };
                
                // ✅ إصلاح: تطبيع الصلاحيات قبل التحديث
                if (formData.permissions && typeof formData.permissions === 'object') {
                    const normalizedPermissions = typeof Permissions !== 'undefined' && typeof Permissions.normalizePermissions === 'function'
                        ? Permissions.normalizePermissions(formData.permissions)
                        : formData.permissions;
                    AppState.currentUser.permissions = normalizedPermissions || {};
                } else {
                    AppState.currentUser.permissions = {};
                }
                
                // ✅ إصلاح: تحديث الجلسة بالصلاحيات الجديدة (مزامنة فورية)
                if (typeof window.Auth !== 'undefined' && typeof window.Auth.updateUserSession === 'function') {
                    const sessionUpdated = window.Auth.updateUserSession();
                    if (sessionUpdated) {
                        Utils.safeLog('✅ تم تحديث جلسة المستخدم الحالي بالصلاحيات الجديدة');
                        Notification.success('تم تحديث صلاحياتك بنجاح. الصلاحيات الجديدة متاحة الآن بدون الحاجة لتسجيل الخروج.');
                    }
                } else {
                    // إذا لم تكن الدالة متاحة، نحدث يدوياً
                    if (typeof UI !== 'undefined' && typeof UI.updateUserProfilePhoto === 'function') {
                        UI.updateUserProfilePhoto();
                    }
                    if (typeof Permissions !== 'undefined' && typeof Permissions.updateNavigation === 'function') {
                        Permissions.updateNavigation();
                    }
                    Notification.info('تم تحديث بياناتك. قد تحتاج لتحديث الصفحة لرؤية التغييرات.');
                }
            } else {
                // ✅ إصلاح: تحديث جلسة المستخدم المعدل إذا كان متصل حالياً
                // البحث عن المستخدم المعدل في الجلسات النشطة
                const updatedUser = AppState.appData.users.find(u => u.id === formData.id);
                if (updatedUser && updatedUser.isOnline === true) {
                    // المستخدم متصل - يجب تحديث جلسته
                    // سيتم تحديث الجلسة تلقائياً عند المزامنة التالية
                    Utils.safeLog(`✅ تم تحديث بيانات المستخدم ${updatedUser.email} - سيتم تحديث جلسته عند المزامنة التالية`);
                }
            }
            
            // ✅ إصلاح: تحديث القائمة الجانبية تلقائياً بعد تحديث الصلاحيات
            if (typeof Permissions !== 'undefined' && typeof Permissions.updateNavigation === 'function') {
                Permissions.updateNavigation();
                Utils.safeLog('✅ تم تحديث القائمة الجانبية بعد تحديث الصلاحيات');
            }
            
            // استعادة الزر بعد النجاح
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            
            this.showList();
        } catch (error) {
            Loading.hide();
            Utils.safeError('خطأ في حفظ المستخدم:', error);
            Notification.error('حدث خطأ: ' + error.message);
            
            // استعادة الزر في حالة الخطأ
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            
            // في حالة الخطأ، نعيد المستخدم إلى النموذج بدلاً من القائمة
            // this.showList(); // تم تعطيله ليبقى المستخدم في النموذج لتصحيح الخطأ
        }
    },

    async editUser(userId) {
        // التحقق من الصلاحيات
        const isAdmin = (typeof Permissions !== 'undefined' && typeof Permissions.isCurrentUserAdmin === 'function')
            ? Permissions.isCurrentUserAdmin()
            : (AppState.currentUser?.role || '').toLowerCase() === 'admin';

        if (!isAdmin) {
            Notification.error('ليس لديك صلاحية لتعديل المستخدمين');
            return;
        }

        const user = AppState.appData.users.find(u => u.id === userId);
        if (user) {
            await this.showForm(user);
        } else {
            Notification.error('المستخدم غير موجود');
        }
    },

    async resetUserPassword(userId, userEmail) {
        // التحقق من الصلاحيات
        const isAdmin = (typeof Permissions !== 'undefined' && typeof Permissions.isCurrentUserAdmin === 'function')
            ? Permissions.isCurrentUserAdmin()
            : (AppState.currentUser?.role || '').toLowerCase() === 'admin';

        if (!isAdmin) {
            Notification.error('ليس لديك صلاحية لإعادة تعيين كلمة المرور');
            return;
        }

        const user = AppState.appData.users.find(u => u.id === userId || u.email === userEmail);
        if (!user) {
            Notification.error('المستخدم غير موجود');
            return;
        }

        const confirmed = await Utils.confirmDialog(
            'إعادة تعيين كلمة المرور',
            `هل أنت متأكد من إعادة تعيين كلمة المرور للمستخدم "${user.name}" (${user.email})؟\n\nسيتم إنشاء كلمة مرور مؤقتة جديدة.`,
            'إعادة التعيين',
            'إلغاء'
        );

        if (!confirmed) return;

        try {
            Loading.show();

            // استدعاء دالة إعادة تعيين كلمة المرور
            const result = await Auth.resetPassword(user.email);

            Loading.hide();

            if (result && result.success) {
                // عرض كلمة المرور المؤقتة للمدير
                const tempPassword = result.tempPassword || 'غير متاح';
                const passwordMessage = `
                    <div style="text-align: right; direction: rtl;">
                        <p style="margin-bottom: 10px; font-weight: bold;">تم إعادة تعيين كلمة المرور بنجاح!</p>
                        <p style="margin-bottom: 10px;">كلمة المرور المؤقتة للمستخدم <strong>${Utils.escapeHTML(user.email)}</strong>:</p>
                        <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 10px 0; font-family: monospace; font-size: 16px; text-align: center; direction: ltr;">
                            <strong>${Utils.escapeHTML(tempPassword)}</strong>
                        </div>
                        <p style="margin-top: 10px; color: #666; font-size: 14px;">
                            ⚠️ يرجى إبلاغ المستخدم بكلمة المرور المؤقتة. سيُطلب منه تغييرها عند تسجيل الدخول.
                        </p>
                    </div>
                `;

                // إنشاء modal لعرض كلمة المرور
                const modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width: 500px;">
                        <div class="modal-header">
                            <h3>كلمة المرور المؤقتة</h3>
                            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            ${passwordMessage}
                        </div>
                        <div class="modal-footer">
                            <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">
                                <i class="fas fa-check ml-2"></i>
                                تم
                            </button>
                            <button class="btn-secondary" onclick="navigator.clipboard.writeText('${tempPassword}').then(() => Notification.success('تم نسخ كلمة المرور')).catch(() => {})">
                                <i class="fas fa-copy ml-2"></i>
                                نسخ
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);

                // إغلاق عند النقر خارج الـ modal
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });

                // تحديث قائمة المستخدمين
                this.loadUsersList();
            } else {
                Notification.error(result?.message || 'فشل إعادة تعيين كلمة المرور');
            }
        } catch (error) {
            Loading.hide();
            Notification.error('حدث خطأ: ' + error.message);
            Utils.safeError('خطأ في إعادة تعيين كلمة المرور:', error);
        }
    },

    async deleteUser(userId) {
        // التحقق من الصلاحيات
        const isAdmin = (typeof Permissions !== 'undefined' && typeof Permissions.isCurrentUserAdmin === 'function')
            ? Permissions.isCurrentUserAdmin()
            : (AppState.currentUser?.role || '').toLowerCase() === 'admin';

        if (!isAdmin) {
            Notification.error('ليس لديك صلاحية لحذف المستخدمين');
            return;
        }

        const user = AppState.appData.users.find(u => u.id === userId);
        if (!user) {
            Notification.error('المستخدم غير موجود');
            return;
        }

        // منع حذف المستخدم الحالي
        if (AppState.currentUser && user.id === AppState.currentUser.id) {
            Notification.error('لا يمكنك حذف حسابك الخاص');
            return;
        }

        // منع حذف آخر مدير في النظام
        const adminUsers = AppState.appData.users.filter(u => u.role === 'admin' && u.active !== false);
        if (user.role === 'admin' && adminUsers.length === 1) {
            Notification.error('لا يمكن حذف آخر مدير في النظام');
            return;
        }

        const confirmed = await Utils.confirmDialog(
            'حذف المستخدم',
            `هل أنت متأكد من حذف المستخدم "${user.name}" (${user.email})؟\n\nهذا الإجراء لا يمكن التراجع عنه.`,
            'حذف',
            'إلغاء'
        );

        if (!confirmed) return;

        Loading.show();

        try {
            AppState.appData.users = AppState.appData.users.filter(u => u.id !== userId);
            // حفظ البيانات باستخدام window.DataManager
        if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
            window.DataManager.save();
        } else {
            Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
        }

            // حفظ تلقائي في الخادم (Supabase أو قاعدة البيانات) — استخدام sendRequest لتوجيه الحذف إلى Supabase عند التفعيل
            const canSyncBackendDelete = AppState.useSupabaseBackend === true || AppState.googleConfig?.appsScript?.enabled;
            if (canSyncBackendDelete) {
                try {
                    await GoogleIntegration.sendRequest({ action: 'deleteUser', data: { userId } });
                } catch (error) {
                    Utils.safeWarn('⚠️ فشل حذف المستخدم من الخادم، سيتم المحاولة لاحقاً:', error);
                    await GoogleIntegration.autoSave('Users', AppState.appData.users);
                }
            } else {
                await GoogleIntegration.autoSave('Users', AppState.appData.users);
            }

            Loading.hide();
            Notification.success('تم حذف المستخدم بنجاح');
            this.loadUsersList();
        } catch (error) {
            Loading.hide();
            Notification.error('حدث خطأ: ' + error.message);
            Utils.safeError('خطأ في حذف المستخدم:', error);
        }
    },

    /**
     * سحب جلسة مستخدم (للسماح له بتسجيل الدخول من جهاز آخر)
     * للمدير فقط — يظهر زر "سحب الجلسة" بجانب المستخدمين المتصلين
     */
    async revokeUserSession(userId) {
        const isAdmin = (typeof Permissions !== 'undefined' && typeof Permissions.isCurrentUserAdmin === 'function')
            ? Permissions.isCurrentUserAdmin()
            : (AppState.currentUser?.role || '').toLowerCase() === 'admin';

        if (!isAdmin) {
            Notification.error('ليس لديك صلاحية سحب جلسات المستخدمين');
            return;
        }

        const users = AppState.appData.users || [];
        const index = users.findIndex(u => u.id === userId);
        if (index === -1) {
            Notification.error('المستخدم غير موجود');
            return;
        }

        const user = users[index];
        if (user.isOnline !== true) {
            Notification.info('المستخدم غير متصل حالياً — لا حاجة لسحب الجلسة');
            return;
        }

        const userLabel = user.name || user.email || userId;
        const confirmed = await Utils.confirmDialog(
            'سحب الجلسة',
            'هل تريد سحب جلسة المستخدم "' + userLabel + '"؟\n\nسيتمكن بعدها من تسجيل الدخول من جهاز آخر.',
            'سحب الجلسة',
            'إلغاء'
        );
        if (!confirmed) return;

        Loading.show();
        try {
            users[index] = { ...user, isOnline: false, activeSessionId: null };
            AppState.appData.users = users;

            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            }

            const updateData = { ...users[index], isOnline: false, activeSessionId: null };
            if (typeof GoogleIntegration !== 'undefined' && typeof GoogleIntegration.sendToAppsScript === 'function') {
                await GoogleIntegration.sendToAppsScript('updateUser', { userId: userId, updateData: updateData });
            } else if (typeof GoogleIntegration !== 'undefined' && typeof GoogleIntegration.autoSave === 'function') {
                await GoogleIntegration.autoSave('Users', AppState.appData.users);
            }

            Loading.hide();
            Notification.success('تم سحب الجلسة. يمكن للمستخدم تسجيل الدخول من جهاز آخر الآن.');
            this.loadUsersList();

            if (typeof UI !== 'undefined' && typeof UI.updateUserConnectionStatus === 'function') {
                UI.updateUserConnectionStatus();
            }
        } catch (error) {
            Loading.hide();
            Notification.error('حدث خطأ: ' + (error.message || error));
            Utils.safeError('خطأ في سحب الجلسة:', error);
        }
    },

    filterUsers(searchTerm = '', roleFilter = '') {
        const users = AppState.appData.users || [];
        let filtered = users;

        if (searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(user =>
                (user.name && String(user.name).toLowerCase().includes(term)) ||
                (user.email && String(user.email).toLowerCase().includes(term)) ||
                (user.department && String(user.department).toLowerCase().includes(term))
            );
        }

        if (roleFilter) {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        this.loadUsersList(filtered, true);
    },

    async showImportExcel() {
        // التحقق من الصلاحيات
        const isAdmin = (typeof Permissions !== 'undefined' && typeof Permissions.isCurrentUserAdmin === 'function')
            ? Permissions.isCurrentUserAdmin()
            : (AppState.currentUser?.role || '').toLowerCase() === 'admin';

        if (!isAdmin) {
            Notification.error('ليس لديك صلاحية لاستيراد المستخدمين');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2 class="modal-title"><i class="fas fa-file-excel ml-2"></i>استيراد الموظين من ملف Excel</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="space-y-4">
                        <div class="bg-blue-50 border border-blue-200 rounded p-4">
                            <p class="text-sm text-blue-800 mb-2"><strong>ملاحظة مهمة:</strong></p>
                            <p class="text-sm text-blue-700">يجب أن يحتوي ملف Excel على الأعمدة التالية:</p>
                            <ul class="text-sm text-blue-700 list-disc mr-6 mt-2">
                                <li><strong>الاسم</strong> أو <strong>Name</strong> - إلزامي</li>
                                <li><strong>البريد الإلكتروني</strong> أو <strong>Email</strong> - إلزامي</li>
                                <li><strong>الدور</strong> أو <strong>Role</strong> (مدير، مسؤول السلامة، مستخدم)</li>
                                <li><strong>القسم</strong> أو <strong>Department</strong></li>
                            </ul>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-file-excel ml-2"></i>
                                اختر ملف Excel (.xlsx, .xls)
                            </label>
                            <input type="file" id="excel-file-input" accept=".xlsx,.xls" class="form-input">
                        </div>
                        <div id="import-preview" class="hidden">
                            <h3 class="text-sm font-semibold mb-2">معاينة البيانات (أول 5 صو):</h3>
                            <div class="max-h-60 overflow-auto border rounded">
                                <table class="data-table text-xs">
                                    <thead id="preview-head"></thead>
                                    <tbody id="preview-body"></tbody>
                                </table>
                            </div>
                            <p id="preview-count" class="text-sm text-gray-600 mt-2"></p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    <button id="confirm-import-btn" class="btn-primary" disabled>
                        <i class="fas fa-upload ml-2"></i>استيراد البيانات
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const fileInput = document.getElementById('excel-file-input');
        const confirmBtn = document.getElementById('confirm-import-btn');
        let importedData = [];

        // تحميل SheetJS إذا لم يكن محملاً
        const loadSheetJS = () => {
            if (typeof XLSX === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
                script.onerror = function() {
                    this.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
                };
                script.onload = () => {
                    fileInput.addEventListener('change', (e) => {
                        importedData = [];
                        this.handleExcelFile(e.target.files[0], modal, confirmBtn, (data) => {
                            importedData = data;
                        });
                    });
                };
                document.head.appendChild(script);
            } else {
                fileInput.addEventListener('change', (e) => {
                    importedData = [];
                    this.handleExcelFile(e.target.files[0], modal, confirmBtn, (data) => {
                        importedData = data;
                    });
                });
            }
        };

        loadSheetJS();

        confirmBtn.addEventListener('click', async () => {
            if (importedData.length === 0) {
                Notification.error('يرجى تحميل مل Excel أولاً');
                return;
            }
            await this.processImport(importedData, modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    handleExcelFile(file, modal, confirmBtn, callback) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                Loading.show();
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    Loading.hide();
                    Notification.error('الملف فارغ أو غير صحيح');
                    return;
                }

                if (callback) callback(jsonData);

                // عرض المعاينة
                const preview = document.getElementById('import-preview');
                const previewHead = document.getElementById('preview-head');
                const previewBody = document.getElementById('preview-body');
                const previewCount = document.getElementById('preview-count');

                if (preview && jsonData.length > 0) {
                    const headers = Object.keys(jsonData[0]);
                    previewHead.innerHTML = `<tr>${headers.map(h => `<th class="px-2 py-1">${Utils.escapeHTML(h)}</th>`).join('')}</tr>`;
                    previewBody.innerHTML = jsonData.slice(0, 5).map(row =>
                        `<tr>${headers.map(h => `<td class="px-2 py-1">${Utils.escapeHTML(String(row[h] || ''))}</td>`).join('')}</tr>`
                    ).join('');
                    previewCount.textContent = `إجمالي الصفوف: ${jsonData.length}`;
                    preview.classList.remove('hidden');
                    confirmBtn.disabled = false;
                }

                Loading.hide();
            } catch (error) {
                Loading.hide();
                Notification.error('فشل قراءة الملف: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
    },

    async processImport(data, modal) {
        try {
            Loading.show();
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const row of data) {
                try {
                    const nameField = row['الاسم'] || row['Name'] || row['name'] || row['NAME'] || '';
                    const emailField = row['البريد الإلكتروني'] || row['Email'] || row['email'] || row['EMAIL'] || '';
                    const roleField = row['الدور'] || row['Role'] || row['role'] || row['ROLE'] || 'user';
                    const deptField = row['القسم'] || row['Department'] || row['department'] || row['DEPARTMENT'] || '';

                    if (!nameField || !emailField) {
                        errorCount++;
                        errors.push(`صف بدون اسم أو بريد: ${JSON.stringify(row)}`);
                        continue;
                    }

                    if (!Utils.isValidEmail(emailField)) {
                        errorCount++;
                        errors.push(`بريد غير صحيح: ${emailField}`);
                        continue;
                    }

                    // التحقق من عدم التكرار
                    const existing = AppState.appData.users.find(u => u.email === emailField.toLowerCase());
                    if (existing) {
                        errorCount++;
                        continue;
                    }

                    // إنشاء كلمة مرور مؤقتة قوية
                    const randomPart = Math.random().toString(36).substring(2, 10);
                    const timestamp = Date.now().toString(36).substring(5, 9);
                    const tempPassword = 'Temp' + randomPart + timestamp + '!';

                    // تشفير كلمة المرور
                    const passwordHash = await Utils.hashPassword(tempPassword);

                    const user = {
                        id: emailField.toLowerCase().trim(),
                        name: nameField.trim(),
                        email: emailField.toLowerCase().trim(),
                        password: '***',
                        passwordHash: passwordHash,
                        role: this.mapRole(roleField),
                        department: deptField.trim(),
                        active: true,
                        permissions: this.mapRole(roleField) === 'admin' ? {} : undefined,
                        forcePasswordChange: true,
                        passwordChanged: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    AppState.appData.users.push(user);
                    successCount++;
                } catch (err) {
                    errorCount++;
                }
            }

            // إزالة الحسابات الافتراضية بعد استيراد المستخدمين
            if (successCount > 0 && typeof removeDefaultUsersIfNeeded === 'function') {
                try {
                    await removeDefaultUsersIfNeeded();
                } catch (removeError) {
                    Utils.safeWarn('⚠ خطأ في إزالة الحسابات الافتراضية بعد الاستيراد:', removeError);
                }
            }

            // حفظ البيانات باستخدام window.DataManager
        if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
            window.DataManager.save();
        } else {
            Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
        }

            // حفظ تلقائي في قاعدة البيانات
            if (successCount > 0) {
                await GoogleIntegration.autoSave('Users', AppState.appData.users);
            }

            Loading.hide();
            Notification.success(`تم استيراد ${successCount} موظ${errorCount > 0 ? ` (فشل ${errorCount})` : ''}`);
            modal.remove();
            this.loadUsersList();
        } catch (error) {
            Loading.hide();
            Notification.error('فشل الاستيراد: ' + error.message);
        }
    },

    mapRole(roleText) {
        const text = String(roleText || '').toLowerCase().trim();
        if (text.includes('مدير') || text.includes('admin')) return 'admin';
        if (text.includes('سلامة') || text.includes('safety')) return 'safety_officer';
        return 'user';
    },

    async convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    collectPermissions() {
        const permissions = {};
        
        // استخدام querySelectorAll مرة واحدة فقط وتحسين الأداء
        const checkboxes = document.querySelectorAll('.user-permission-checkbox:checked:not([disabled])');
        
        // استخدام for...of بدلاً من forEach للأداء الأفضل
        for (const checkbox of checkboxes) {
            const module = checkbox.getAttribute('data-module');
            if (module) {
                permissions[module] = true;
            }
        }

        // ✅ إصلاح: إضافة الصلاحيات التفصيلية بشكل صحيح
        // التأكد من دمج الصلاحيات التفصيلية مع الصلاحيات الأساسية
        if (this.currentDetailedPermissions && typeof this.currentDetailedPermissions === 'object') {
            // استخدام Object.assign للأداء الأفضل
            // هذا يضمن عدم فقدان الصلاحيات التفصيلية
            Object.assign(permissions, this.currentDetailedPermissions);
        }

        // ✅ إصلاح: التأكد من إرجاع كائن حتى لو كان فارغاً (وليس undefined)
        // هذا يضمن عدم فقدان الصلاحيات عند الحفظ
        return Object.keys(permissions).length > 0 ? permissions : {};
    },

    setupPhotoPreview() {
        const photoInput = document.getElementById('user-photo-input');
        const preview = document.getElementById('user-photo-preview');
        const icon = document.getElementById('user-photo-icon');

        if (photoInput && preview && icon) {
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                        icon.style.display = 'none';
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    },

    /**
     * بدء التحديث التلقائي لحالة الاتصال وآخر تسجيل دخول
     */
    startAutoRefresh() {
        // إيقاف التحديث السابق إن وجد
        this.stopAutoRefresh();

        // بدء التحديث التلقائي كل 5 ثوان
        this.autoRefreshInterval = setInterval(() => {
            // التحقق من أن الموديول مفتوح حالياً
            const section = document.getElementById('users-section');
            if (section && section.style.display !== 'none' && !section.hidden) {
                // تحديث الجدول فقط (بدون إعادة تحميل كامل)
                this.refreshUsersTable();
            }
        }, this.refreshInterval);

        Utils.safeLog('✅ تم تفعيل التحديث التلقائي لحالة الاتصال وآخر تسجيل دخول');
    },

    /**
     * إيقاف التحديث التلقائي
     */
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
            Utils.safeLog('🛑 تم إيقاف التحديث التلقائي');
        }
    },

    /**
     * تحديث جدول المستخدمين فقط (بدون إعادة تحميل كامل)
     * يركز على تحديث حالة الاتصال وآخر تسجيل دخول
     */
    refreshUsersTable() {
        const container = document.getElementById('users-table-container');
        if (!container) return;

        const tbody = container.querySelector('tbody');
        if (!tbody) {
            // إذا لم يكن الجدول موجوداً، نقوم بتحميله كاملاً
            this.loadUsersList();
            return;
        }

        const users = AppState.appData.users || [];
        
        // تحديث كل صف في الجدول باستخدام email للبحث
        tbody.querySelectorAll('tr').forEach((row) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 9) return;

            // الحصول على email من العمود الثاني (index 1)
            const rowEmail = cells[1]?.textContent?.trim();
            if (!rowEmail) return;

            // البحث عن المستخدم المناسب في المصفوفة
            const user = users.find(u => u.email && u.email.toLowerCase().trim() === rowEmail.toLowerCase().trim());
            if (!user) return;

            const isOnline = user.isOnline === true;
            const lastLoginTime = user.lastLogin ? Utils.formatDateTime(user.lastLogin) : '-';

            // خلية حالة الاتصال (العمود 8 - index 7)
            const connectionCell = cells[7];
            if (connectionCell) {
                connectionCell.innerHTML = `
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}" style="animation: ${isOnline ? 'pulse 2s infinite' : 'none'};"></div>
                        <span class="text-sm ${isOnline ? 'text-green-600' : 'text-gray-500'}">
                            ${isOnline ? 'متصل' : 'غير متصل'}
                        </span>
                    </div>
                `;
            }

            // خلية آخر تسجيل دخول (العمود 9 - index 8)
            const lastLoginCell = cells[8];
            if (lastLoginCell) {
                lastLoginCell.innerHTML = `
                    <span class="text-sm text-gray-600" title="${user.lastLogin || '-'}">
                        ${lastLoginTime}
                    </span>
                `;
            }
        });
    },

    /**
     * تحديث حالة مستخدم محدد في الجدول
     */
    updateUserStatus(userId) {
        const container = document.getElementById('users-table-container');
        if (!container) return;

        const tbody = container.querySelector('tbody');
        if (!tbody) return;

        const user = AppState.appData.users.find(u => u.id === userId);
        if (!user) return;

        // البحث عن الصف المناسب
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
                // التحقق من أن هذا الصف للمستخدم المطلوب
                // يمكن التحقق من خلال email أو id في البيانات
                const userEmail = user.email;
                const rowEmail = cells[1]?.textContent?.trim();
                
                if (rowEmail === userEmail) {
                    const isOnline = user.isOnline === true;
                    const lastLoginTime = user.lastLogin ? Utils.formatDateTime(user.lastLogin) : '-';

                    // تحديث حالة الاتصال
                    if (cells[7]) {
                        cells[7].innerHTML = `
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}" style="animation: ${isOnline ? 'pulse 2s infinite' : 'none'};"></div>
                                <span class="text-sm ${isOnline ? 'text-green-600' : 'text-gray-500'}">
                                    ${isOnline ? 'متصل' : 'غير متصل'}
                                </span>
                            </div>
                        `;
                    }

                    // تحديث آخر تسجيل دخول
                    if (cells[8]) {
                        cells[8].innerHTML = `
                            <span class="text-sm text-gray-600" title="${user.lastLogin || '-'}">
                                ${lastLoginTime}
                            </span>
                        `;
                    }
                    
                    // إذا كان المستخدم المحدث هو المستخدم الحالي، نحدث زر حالة الاتصال
                    if (AppState.currentUser && AppState.currentUser.email && 
                        userEmail.toLowerCase() === AppState.currentUser.email.toLowerCase() &&
                        typeof UI !== 'undefined' && typeof UI.updateUserConnectionStatus === 'function') {
                        setTimeout(() => {
                            UI.updateUserConnectionStatus();
                        }, 100);
                    }
                }
            }
        });
    },

    /**
     * إعداد الاستماع لتغيير الأقسام
     */
    setupSectionChangeListener() {
        // إزالة المستمع السابق إن وجد
        if (this.sectionChangeHandler) {
            document.removeEventListener('section-changed', this.sectionChangeHandler);
        }

        // إضافة مستمع جديد
        this.sectionChangeHandler = (event) => {
            const currentSection = event.detail?.section;
            const previousSection = event.detail?.previousSection;

            // إذا كان القسم الحالي هو users، نبدأ التحديث التلقائي
            if (currentSection === 'users') {
                this.startAutoRefresh();
            } 
            // إذا كان القسم السابق هو users والقسم الحالي ليس users، نوقف التحديث التلقائي
            else if (previousSection === 'users' && currentSection !== 'users') {
                this.stopAutoRefresh();
            }
        };

        document.addEventListener('section-changed', this.sectionChangeHandler);
    },

    /**
     * تنظيف جميع الموارد عند إلغاء تحميل الموديول
     * يمنع تسريبات الذاكرة (Memory Leaks)
     */
    cleanup() {
        try {
            if (typeof Utils !== 'undefined' && Utils.safeLog) {
                Utils.safeLog('🧹 تنظيف موارد Users module...');
            }

            // إيقاف التحديث التلقائي
            this.stopAutoRefresh();

            // إزالة section change listener
            if (this.sectionChangeHandler) {
                document.removeEventListener('section-changed', this.sectionChangeHandler);
                this.sectionChangeHandler = null;
            }

            if (typeof Utils !== 'undefined' && Utils.safeLog) {
                Utils.safeLog('✅ تم تنظيف موارد Users module');
            }
        } catch (error) {
            if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                Utils.safeWarn('⚠️ خطأ في تنظيف Users module:', error);
            }
        }
    }
};

// ===== Export module to global scope =====
// تصدير الموديول إلى window فوراً لضمان توافره
(function () {
    'use strict';
    try {
        if (typeof window !== 'undefined' && typeof Users !== 'undefined') {
            window.Users = Users;
            
            // إشعار عند تحميل الموديول بنجاح
            if (typeof AppState !== 'undefined' && AppState.debugMode && typeof Utils !== 'undefined' && Utils.safeLog) {
                Utils.safeLog('✅ Users module loaded and available on window.Users');
            }
        }
    } catch (error) {
        console.error('❌ خطأ في تصدير Users:', error);
        // محاولة التصدير مرة أخرى حتى في حالة الخطأ
        if (typeof window !== 'undefined' && typeof Users !== 'undefined') {
            try {
                window.Users = Users;
            } catch (e) {
                console.error('❌ فشل تصدير Users:', e);
            }
        }
    }
})();

