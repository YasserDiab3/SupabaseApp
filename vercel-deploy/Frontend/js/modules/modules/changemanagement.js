/**
 * Change Management Module
 * موديول إدارة التغيرات (مشابه SAP Management of Change - MoC)
 * تسجيل وموافقة ومتابعة طلبات التغيير: تقني، إداري، تنظيمي
 */
const ChangeManagement = {
    state: {
        currentView: 'list',
        activeTab: 'requests',
        lastRequests: [],
        filters: {
            status: 'all',
            changeType: 'all',
            priority: 'all',
            impact: 'all',
            relatedModule: 'all',
            search: '',
            startDate: '',
            endDate: ''
        },
        currentRequest: null,
        _loadInProgress: false,
        _searchDebounce: null
    },

    /**
     * تحميل الموديول — عرض الواجهة فوراً ثم جلب البيانات بدون تعليق
     */
    load() {
        const section = document.getElementById('change-management-section');
        if (!section) {
            if (typeof Utils !== 'undefined' && Utils.safeError) {
                Utils.safeError('قسم change-management-section غير موجود!');
            }
            return;
        }

        try {
            section.innerHTML = `
                <div class="section-header">
                    <div class="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h1 class="section-title">
                                <i class="fas fa-exchange-alt ml-3"></i>
                                إدارة التغيرات
                            </h1>
                            <p class="section-subtitle">تسجيل وموافقة ومتابعة طلبات التغيير (تقني، إداري، تنظيمي)</p>
                        </div>
                        <div class="flex gap-2">
                            <button type="button" id="change-btn-statistics" class="btn-secondary" onclick="ChangeManagement.showStatistics()">
                                <i class="fas fa-chart-bar ml-2"></i>
                                الإحصائيات
                            </button>
                            <button type="button" id="change-btn-add" class="btn-primary" onclick="ChangeManagement.showCreateForm()">
                                <i class="fas fa-plus ml-2"></i>
                                إضافة طلب تغيير
                            </button>
                        </div>
                    </div>
                </div>
                <div class="mt-4">
                    <div class="change-tabs flex gap-1 border-b border-gray-200 pb-0">
                        <button type="button" class="change-tab-btn tab-btn active" data-tab="requests" onclick="ChangeManagement.switchTab('requests')">
                            <i class="fas fa-list ml-2"></i> الطلبات
                        </button>
                        <button type="button" class="change-tab-btn tab-btn" data-tab="register" onclick="ChangeManagement.switchTab('register')">
                            <i class="fas fa-history ml-2"></i> سجل التغييرات
                        </button>
                    </div>
                </div>
                <div class="mt-6" id="change-tab-requests">
                    ${this.renderRequestsListHTML()}
                </div>
                <div class="mt-6" id="change-tab-register" style="display:none;">
                    <div class="content-card">
                        <div class="card-header border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-wrap gap-2" style="background: var(--bg-secondary);">
                            <h3 class="card-title text-lg font-semibold" style="margin: 0;">جميع الطلبات المسجلة والمستلمة مع حالتها</h3>
                            <div class="flex gap-2">
                                <button type="button" class="btn-secondary btn-sm" onclick="ChangeManagement.exportToExcel()" title="تصدير إلى Excel">
                                    <i class="fas fa-file-excel ml-2"></i> تصدير Excel
                                </button>
                                <button type="button" class="btn-secondary btn-sm" onclick="ChangeManagement.exportToPDF()" title="تصدير إلى PDF">
                                    <i class="fas fa-file-pdf ml-2"></i> تصدير PDF
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="change-register-list-container"><p class="text-gray-500">لا توجد طلبات في السجل</p></div>
                        </div>
                    </div>
                </div>
            `;

            this.setupEventListeners();
            this.state._loadInProgress = false;
            this.loadChangeRequests();
        } catch (error) {
            if (typeof Utils !== 'undefined' && Utils.safeError) Utils.safeError('خطأ في تحميل موديول إدارة التغيرات:', error);
            section.innerHTML = `
                <div class="section-header">
                    <h1 class="section-title"><i class="fas fa-exchange-alt ml-3"></i> إدارة التغيرات</h1>
                </div>
                <div class="mt-6">
                    <div class="content-card">
                        <div class="card-body">
                            <div class="empty-state">
                                <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                                <p class="text-gray-500 mb-4">حدث خطأ أثناء تحميل البيانات</p>
                                <button type="button" onclick="ChangeManagement.load()" class="btn-primary">
                                    <i class="fas fa-redo ml-2"></i> إعادة المحاولة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    },

    renderRequestsListHTML() {
        return `
            <div class="content-card">
                <div class="card-header border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-wrap gap-2" style="background: var(--bg-secondary);">
                    <h3 class="card-title text-lg font-semibold" style="margin: 0;">الطلبات</h3>
                    <div class="flex gap-2">
                        <button type="button" class="btn-secondary btn-sm" onclick="ChangeManagement.exportToExcel()" title="تصدير إلى Excel">
                            <i class="fas fa-file-excel ml-2"></i> تصدير Excel
                        </button>
                        <button type="button" class="btn-secondary btn-sm" onclick="ChangeManagement.exportToPDF()" title="تصدير إلى PDF">
                            <i class="fas fa-file-pdf ml-2"></i> تصدير PDF
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="change-requests-list-container">
                        <div class="empty-state py-8" id="change-requests-initial"><p class="text-gray-500">لا توجد طلبات تغيير</p></div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadChangeRequests() {
        const container = document.getElementById('change-requests-list-container');
        if (!container) return;
        if (this.state._loadInProgress) return;

        if (!AppState.googleConfig?.appsScript?.enabled || !AppState.googleConfig?.appsScript?.scriptUrl) {
            container.innerHTML = this.showEmptyState('يجب تفعيل Google Integration أولاً');
            return;
        }

        this.state._loadInProgress = true;

        try {
            const response = await GoogleIntegration.sendRequest({
                action: 'getAllChangeRequests',
                data: { filters: this.buildFilters() }
            });

            if (response.success) {
                const data = response.data || [];
                this.state.lastRequests = data;
                this.renderRequestsList(data);
                if (this.state.activeTab === 'register') {
                    this.renderRegisterTable(data);
                }
            } else {
                if (typeof Utils !== 'undefined' && Utils.safeError) Utils.safeError('خطأ في تحميل الطلبات:', response.message);
                container.innerHTML = this.showEmptyState('حدث خطأ أثناء تحميل الطلبات');
            }
        } catch (error) {
            if (typeof Utils !== 'undefined' && Utils.safeError) Utils.safeError('خطأ في تحميل الطلبات:', error);
            container.innerHTML = this.showEmptyState('حدث خطأ أثناء تحميل الطلبات');
        } finally {
            this.state._loadInProgress = false;
        }
    },

    buildFilters() {
        const f = {};
        const status = document.getElementById('change-status-filter')?.value;
        if (status && status !== 'all') f.status = status;
        const changeType = document.getElementById('change-type-filter')?.value;
        if (changeType && changeType !== 'all') f.changeType = changeType;
        const priority = document.getElementById('change-priority-filter')?.value;
        if (priority && priority !== 'all') f.priority = priority;
        const impact = document.getElementById('change-impact-filter')?.value;
        if (impact && impact !== 'all') f.impact = impact;
        const relatedModule = document.getElementById('change-module-filter')?.value;
        if (relatedModule && relatedModule !== 'all') f.relatedModule = relatedModule;
        const search = document.getElementById('change-search')?.value;
        if (search) f.search = search;
        const startDate = document.getElementById('change-start-date')?.value;
        if (startDate) f.startDate = startDate;
        const endDate = document.getElementById('change-end-date')?.value;
        if (endDate) f.endDate = endDate;
        return f;
    },

    renderRequestsList(requests) {
        const container = document.getElementById('change-requests-list-container');
        if (!container) return;

        if (!requests || requests.length === 0) {
            container.innerHTML = this.showEmptyState('لا توجد طلبات تغيير');
            return;
        }

        const safe = (v) => (typeof Utils !== 'undefined' && Utils.escapeHTML) ? Utils.escapeHTML(String(v || '')) : String(v || '');
        container.innerHTML = `
            <div class="space-y-4">
                ${requests.map(r => this.renderRequestCard(r, safe)).join('')}
            </div>
        `;
    },

    renderRequestCard(req, safe) {
        if (!safe) safe = (v) => String(v || '');
        const id = safe(req.id);
        const title = safe(req.title || 'بدون عنوان');
        const desc = (req.description || '').substring(0, 120);
        const descSafe = safe(desc + (req.description && req.description.length > 120 ? '...' : ''));
        const requestedBy = safe(req.requestedBy || 'غير محدد');
        const statusColors = {
            'Draft': 'bg-gray-100 text-gray-800',
            'In Review': 'bg-blue-100 text-blue-800',
            'Approved': 'bg-green-100 text-green-800',
            'Rejected': 'bg-red-100 text-red-800',
            'In Implementation': 'bg-purple-100 text-purple-800',
            'Completed': 'bg-teal-100 text-teal-800',
            'Closed': 'bg-gray-100 text-gray-600'
        };
        const priorityColors = {
            '1-VeryHigh': 'bg-red-100 text-red-800',
            '2-High': 'bg-orange-100 text-orange-800',
            '3-Medium': 'bg-yellow-100 text-yellow-800',
            '4-Low': 'bg-green-100 text-green-800'
        };
        return `
            <div class="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onclick="ChangeManagement.showRequestDetail('${id}')">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2 flex-wrap">
                            <span class="text-sm text-gray-500">${safe(req.requestNumber || req.id)}</span>
                            <h3 class="font-semibold text-lg">${title}</h3>
                            <span class="px-2 py-1 rounded text-xs font-medium ${statusColors[req.status] || 'bg-gray-100'}">${this.getStatusLabel(req.status)}</span>
                            <span class="px-2 py-1 rounded text-xs font-medium ${priorityColors[req.priority] || 'bg-gray-100'}">${this.getPriorityLabel(req.priority)}</span>
                        </div>
                        <p class="text-gray-600 mb-2">${descSafe}</p>
                        <div class="flex items-center gap-4 text-sm text-gray-500">
                            <span><i class="fas fa-user ml-1"></i> ${requestedBy}</span>
                            <span><i class="fas fa-calendar ml-1"></i> ${this.formatDate(req.requestedAt || req.createdAt)}</span>
                            <span><i class="fas fa-tag ml-1"></i> ${this.getChangeTypeLabel(req.changeType)}</span>
                        </div>
                    </div>
                    <button type="button" onclick="event.stopPropagation(); ChangeManagement.showRequestDetail('${id}')" class="btn-secondary btn-sm">
                        <i class="fas fa-eye ml-1"></i> عرض
                    </button>
                </div>
            </div>
        `;
    },

    showCreateForm() {
        const btn = document.getElementById('change-btn-add');
        if (btn) { btn.disabled = true; setTimeout(() => { btn.disabled = false; }, 600); }
        const docTypes = [
            'إجراءات عمل / تعليمات العمل',
            'دراسات تقييم المخاطر / القياسات البيئية',
            'الرسومات الهندسية الخاصة بالموقع',
            'خطط الصيانة الوقائية',
            'خطة الطوارئ'
        ];
        const docRows = docTypes.map((t, i) => `
            <tr>
                <td class="p-2 border"><select name="docType_${i}" class="form-select form-select-sm"><option value="${t}">${t}</option><option value="أخرى">أخرى</option></select></td>
                <td class="p-2 border"><input type="text" name="docName_${i}" class="form-input form-input-sm" placeholder="اسم الوثيقة"></td>
                <td class="p-2 border"><input type="text" name="docCode_${i}" class="form-input form-input-sm" placeholder="كود الوثيقة"></td>
                <td class="p-2 border"><input type="text" name="docResponsible_${i}" class="form-input form-input-sm" placeholder="المسئول عن التعديل"></td>
                <td class="p-2 border"><input type="date" name="docPlanDate_${i}" class="form-input form-input-sm"></td>
            </tr>
        `).join('');
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content change-form-modal" style="max-width: 920px; max-height: 95vh; overflow-y: auto;">
                <div class="modal-header change-form-modal-header" style="background: var(--primary-color, #2563eb); color: #fff; border-radius: 8px 8px 0 0; display: flex; justify-content: center; align-items: center; position: relative; padding: 1rem 3rem;">
                    <h2 class="modal-title change-form-modal-title" style="color: #fff; margin: 0; text-align: center; flex: 1; font-size: 1.4rem; font-weight: 700;">نموذج مقترح تغيير (فني / إداري)</h2>
                    <div style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); display: flex; gap: 0.5rem; align-items: center;">
                        <button type="button" class="change-form-fullscreen-btn" title="ملء الشاشة" onclick="ChangeManagement.toggleChangeFormFullscreen(this)" style="color: #fff; opacity: 0.9; background: rgba(255,255,255,0.2); border: none; border-radius: 8px; cursor: pointer; padding: 0.5rem 0.75rem; font-size: 0.9rem;"><i class="fas fa-expand"></i> <span class="change-form-fullscreen-label">ملء الشاشة</span></button>
                    </div>
                    <button type="button" onclick="this.closest('.modal-overlay').remove()" class="modal-close" style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); color: #fff; opacity: 0.9; background: transparent; border: none; cursor: pointer; padding: 0.5rem;"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body change-form-modal-body" style="background: var(--bg-primary, #fff); overflow-y: auto; flex: 1;">
                    <div class="change-form-request-number-bar" style="display:flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.75rem 1rem; margin-bottom:1rem; background: var(--bg-secondary); border-radius:10px; border: 1px solid var(--border-color);">
                        <span style="font-weight:600; color: var(--text-primary);">رقم الطلب:</span>
                        <span id="change-form-request-number" style="font-weight:700; color: var(--primary-color); font-size:1.1rem;">جاري التحميل...</span>
                    </div>
                    <form id="change-request-form" onsubmit="ChangeManagement.handleCreateSubmit(event)">
                        <input type="hidden" name="docRowsCount" value="${docTypes.length}">
                        <div class="change-form-section change-form-section-card" data-section="1">
                            <h3 class="change-form-section-title"><span class="change-form-section-num">1</span> <i class="fas fa-file-alt ml-2"></i> بيانات الطلب</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="form-label">التاريخ *</label>
                                    <input type="date" name="requestedAt" class="form-input" required>
                                </div>
                                <div>
                                    <label class="form-label">من / إدارة *</label>
                                    <input type="text" name="fromDepartment" class="form-input" required placeholder="الإدارة الطالبة">
                                </div>
                                <div>
                                    <label class="form-label">المصنع</label>
                                    <select name="factoryId" id="change-form-factory" class="form-select">
                                        <option value="">اختر المصنع</option>
                                    </select>
                                    <input type="hidden" name="factoryName" id="change-form-factory-name" value="">
                                </div>
                                <div>
                                    <label class="form-label">الموقع الفرعي</label>
                                    <select name="subLocationId" id="change-form-sub" class="form-select">
                                        <option value="">اختر الموقع الفرعي</option>
                                    </select>
                                    <input type="hidden" name="subLocationName" id="change-form-sub-name" value="">
                                </div>
                                <div class="md:col-span-2">
                                    <label class="form-label">الموضوع *</label>
                                    <input type="text" name="title" class="form-input" required placeholder="موضوع مقترح التغيير">
                                </div>
                                <div>
                                    <label class="form-label">نوع التغيير *</label>
                                    <select name="changeType" id="change-form-type" class="form-select" required onchange="ChangeManagement.toggleFormSections()">
                                        <option value="Technical">طلب تغيير فني</option>
                                        <option value="Administrative">طلب تغيير إداري (نقل/تكليف للفنيين)</option>
                                    </select>
                                </div>
                                <div id="technical-subtype-wrap">
                                    <label class="form-label">نوع التغيير الفني المقترح</label>
                                    <div class="flex gap-4 mt-2">
                                        <label class="inline-flex items-center"><input type="radio" name="technicalChangeSubType" value="ProductionProcess" class="ml-2"> تغيير في عملية إنتاجية</label>
                                        <label class="inline-flex items-center"><input type="radio" name="technicalChangeSubType" value="NonProductionProcess" class="ml-2"> تغيير في عملية غير إنتاجية</label>
                                    </div>
                                </div>
                                <div id="administrative-fields-wrap" style="display:none;" class="md:col-span-2">
                                    <label class="form-label">نوع التغيير المقترح (إداري)</label>
                                    <div class="flex flex-wrap gap-4 mt-2">
                                        <label class="inline-flex items-center"><input type="radio" name="administrativeChangeSubType" value="AssignmentRequest" class="ml-2"> طلب تكليف</label>
                                        <label class="inline-flex items-center"><input type="radio" name="administrativeChangeSubType" value="TransferTechnicians" class="ml-2"> نقل للفنيين</label>
                                        <label class="inline-flex items-center"><input type="radio" name="administrativeChangeSubType" value="Other" class="ml-2"> أخرى</label>
                                    </div>
                                </div>
                                <div id="admin-employee-row" style="display:none;" class="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2 border-t pt-4 mt-2">
                                    <div>
                                        <label class="form-label">الكود الوظيفي (رقم الموظف) *</label>
                                        <input type="text" name="employeeCode" id="change-form-employee-code" class="form-input" placeholder="أدخل الكود ثم انقر خارج الحقل لتحميل البيانات" autocomplete="off">
                                    </div>
                                    <div>
                                        <label class="form-label">اسم الموظف</label>
                                        <input type="text" name="employeeName" id="change-form-employee-name" class="form-input" placeholder="يُملأ تلقائياً من الكود" readonly>
                                    </div>
                                    <div id="change-form-employee-card" class="md:col-span-2" style="display:none; padding:0.75rem 1rem; background: rgba(37,99,235,0.08); border-radius:10px; border: 1px solid rgba(37,99,235,0.25);">
                                        <div class="text-sm font-semibold mb-2" style="color: var(--primary-color);"><i class="fas fa-user-check ml-2"></i> بيانات الموظف</div>
                                        <div id="change-form-employee-card-body" class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm"></div>
                                    </div>
                                    <div class="md:col-span-2">
                                        <label class="form-label">موقع التغيير</label>
                                        <input type="text" name="adminChangeLocation" class="form-input" placeholder="موقع التغيير">
                                    </div>
                                    <div class="md:col-span-2">
                                        <label class="form-label">وصف المهام الحالية</label>
                                        <textarea name="currentTasksDescription" class="form-textarea" rows="3" placeholder="وصف المهام الحالية للموظف"></textarea>
                                    </div>
                                    <div class="md:col-span-2">
                                        <label class="form-label">وصف المهام الجديدة</label>
                                        <textarea name="newTasksDescription" class="form-textarea" rows="3" placeholder="وصف المهام الجديدة بعد النقل/التكليف"></textarea>
                                    </div>
                                    <div>
                                        <label class="form-label">مسئول الإدارة / القسم الطالب للتغيير</label>
                                        <input type="text" name="responsibleRequestingDepartment" class="form-input">
                                    </div>
                                    <div>
                                        <label class="form-label">مسئول الإدارة / القسم الذي سيتم تنفيذ التغيير به</label>
                                        <input type="text" name="responsibleImplementingDepartment" class="form-input">
                                    </div>
                                </div>
                                <div class="md:col-span-2">
                                    <label class="form-label">استمرارية التغيير المقترح</label>
                                    <div class="flex flex-wrap gap-4 mt-2">
                                        <label class="inline-flex items-center"><input type="radio" name="changeContinuity" value="Permanent" class="ml-2" checked> دائم</label>
                                        <label class="inline-flex items-center"><input type="radio" name="changeContinuity" value="Temporary" class="ml-2"> مؤقت حتى تاريخ</label>
                                        <input type="date" name="temporaryUntilDate" id="temporaryUntilDate" class="form-input" style="display:none;">
                                    </div>
                                </div>
                                <div class="md:col-span-2">
                                    <label class="form-label">أولوية التغيير المقترح</label>
                                    <div class="flex flex-wrap gap-4 mt-2">
                                        <label class="inline-flex items-center"><input type="radio" name="priorityType" value="Normal" class="ml-2" checked> عادي</label>
                                        <label class="inline-flex items-center"><input type="radio" name="priorityType" value="Urgent" class="ml-2"> عاجل : توضيح السبب</label>
                                    </div>
                                    <textarea name="priorityUrgentReason" id="priorityUrgentReason" class="form-textarea mt-2" rows="2" placeholder="توضيح سبب العجلة" style="display:none;"></textarea>
                                </div>
                                <div class="md:col-span-2">
                                    <label class="form-label">وصف التغيير المقترح *</label>
                                    <textarea name="description" class="form-textarea" rows="4" required placeholder="وصف تفصيلي للتغيير الفني/الإداري المقترح"></textarea>
                                </div>
                                <div class="md:col-span-2">
                                    <label class="form-label">المستندات المرفقة</label>
                                    <textarea name="attachedDocumentsText" class="form-textarea" rows="2" placeholder="قائمة المستندات المرفقة"></textarea>
                                </div>
                                <div>
                                    <label class="form-label">إلى / إدارة (موقع التغيير)</label>
                                    <input type="text" name="toDepartment" class="form-input" placeholder="الإدارة المستهدفة">
                                </div>
                                <div>
                                    <label class="form-label">أخرى (موقع)</label>
                                    <input type="text" name="locationOther" class="form-input" placeholder="تفاصيل أخرى للموقع">
                                </div>
                            </div>
                        </div>
                        <div class="change-form-section change-form-section-card" data-section="2">
                            <h3 class="change-form-section-title"><span class="change-form-section-num">2</span> <i class="fas fa-users-cog ml-2"></i> لجنة إدارة التغيرات</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="form-label">الإدارة / القسم الطالب للتغيير</label>
                                    <input type="text" name="requestingDepartment" class="form-input">
                                </div>
                                <div>
                                    <label class="form-label">إدارات / أقسام أخرى</label>
                                    <input type="text" name="otherDepartments" class="form-input">
                                </div>
                                <div class="md:col-span-2">
                                    <label class="form-label">الإدارات أو الأقسام المتأثرة بالتغيير المقترح</label>
                                    <textarea name="affectedDepartments" class="form-textarea" rows="2"></textarea>
                                </div>
                            </div>
                        </div>
                        <div id="admin-health-section" style="display:none;" class="change-form-section change-form-section-card" data-section="3">
                            <h3 class="change-form-section-title"><span class="change-form-section-num">3</span> <i class="fas fa-heartbeat ml-2"></i> الحالة الصحية للموظف</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="md:col-span-2">
                                    <label class="form-label">إصابة سابقة</label>
                                    <input type="text" name="previousInjury" class="form-input" placeholder="إن وجدت">
                                </div>
                                <div class="md:col-span-2">
                                    <label class="form-label">أمراض مزمنة</label>
                                    <input type="text" name="chronicDiseases" class="form-input" placeholder="إن وجدت">
                                </div>
                                <div class="md:col-span-2">
                                    <label class="form-label">ملاحظات صحية</label>
                                    <textarea name="healthNotes" class="form-textarea" rows="2" placeholder="أي ملاحظات إضافية عن الحالة الصحية"></textarea>
                                </div>
                            </div>
                        </div>
                        <div id="admin-training-section" style="display:none;" class="change-form-section change-form-section-card" data-section="4">
                            <h3 class="change-form-section-title"><span class="change-form-section-num">4</span> <i class="fas fa-graduation-cap ml-2"></i> تحديد برامج التدريب والتوعية والمتطلبات الأخرى نتيجة التغيير</h3>
                            <div class="overflow-x-auto">
                                <table class="w-full border-collapse text-sm change-form-training-table">
                                    <thead>
                                        <tr>
                                            <th class="p-2 border text-right font-semibold">المتطلبات / المرفقات</th>
                                            <th class="p-2 border text-right font-semibold">تاريخ مخطط</th>
                                            <th class="p-2 border text-right font-semibold">مسئول التنفيذ</th>
                                            <th class="p-2 border text-right font-semibold">تاريخ التنفيذ</th>
                                            <th class="p-2 border text-right font-semibold">ملاحظات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td class="p-2 border">توعية بالموقع الجديد والمخاطر المحتملة</td><td class="p-2 border"><input type="date" name="trainingReq_0_plannedDate" class="form-input form-input-sm w-full"></td><td class="p-2 border"><input type="text" name="trainingReq_0_responsible" class="form-input form-input-sm" placeholder="مسئول التنفيذ"></td><td class="p-2 border"><input type="date" name="trainingReq_0_executionDate" class="form-input form-input-sm w-full"></td><td class="p-2 border"><input type="text" name="trainingReq_0_notes" class="form-input form-input-sm" placeholder="ملاحظات"></td></tr>
                                        <tr><td class="p-2 border">تدريب على رأس العمل للمهام الجديدة</td><td class="p-2 border"><input type="date" name="trainingReq_1_plannedDate" class="form-input form-input-sm w-full"></td><td class="p-2 border"><input type="text" name="trainingReq_1_responsible" class="form-input form-input-sm"></td><td class="p-2 border"><input type="date" name="trainingReq_1_executionDate" class="form-input form-input-sm w-full"></td><td class="p-2 border"><input type="text" name="trainingReq_1_notes" class="form-input form-input-sm"></td></tr>
                                        <tr><td class="p-2 border">توعية بتحليل المخاطر ووسائل التحكم تتضمن PPE</td><td class="p-2 border"><input type="date" name="trainingReq_2_plannedDate" class="form-input form-input-sm w-full"></td><td class="p-2 border"><input type="text" name="trainingReq_2_responsible" class="form-input form-input-sm"></td><td class="p-2 border"><input type="date" name="trainingReq_2_executionDate" class="form-input form-input-sm w-full"></td><td class="p-2 border"><input type="text" name="trainingReq_2_notes" class="form-input form-input-sm"></td></tr>
                                        <tr><td class="p-2 border">توعية على خطة الطوارئ</td><td class="p-2 border"><input type="date" name="trainingReq_3_plannedDate" class="form-input form-input-sm w-full"></td><td class="p-2 border"><input type="text" name="trainingReq_3_responsible" class="form-input form-input-sm"></td><td class="p-2 border"><input type="date" name="trainingReq_3_executionDate" class="form-input form-input-sm w-full"></td><td class="p-2 border"><input type="text" name="trainingReq_3_notes" class="form-input form-input-sm"></td></tr>
                                        <tr><td class="p-2 border">فحوص طبية قبل تنفيذ النقل / التكليف</td><td class="p-2 border"><input type="date" name="trainingReq_4_plannedDate" class="form-input form-input-sm w-full"></td><td class="p-2 border"><input type="text" name="trainingReq_4_responsible" class="form-input form-input-sm"></td><td class="p-2 border"><input type="date" name="trainingReq_4_executionDate" class="form-input form-input-sm w-full"></td><td class="p-2 border"><input type="text" name="trainingReq_4_notes" class="form-input form-input-sm"></td></tr>
                                        <tr><td class="p-2 border">فحوص طبية دورية</td><td class="p-2 border"><input type="date" name="trainingReq_5_plannedDate" class="form-input form-input-sm w-full"></td><td class="p-2 border"><input type="text" name="trainingReq_5_responsible" class="form-input form-input-sm"></td><td class="p-2 border"><input type="date" name="trainingReq_5_executionDate" class="form-input form-input-sm w-full"></td><td class="p-2 border"><input type="text" name="trainingReq_5_notes" class="form-input form-input-sm"></td></tr>
                                        <tr><td class="p-2 border">خطة التدريب / مصفوفة التدريب</td><td class="p-2 border"><input type="date" name="trainingReq_6_plannedDate" class="form-input form-input-sm w-full"></td><td class="p-2 border"><input type="text" name="trainingReq_6_responsible" class="form-input form-input-sm"></td><td class="p-2 border"><input type="date" name="trainingReq_6_executionDate" class="form-input form-input-sm w-full"></td><td class="p-2 border"><input type="text" name="trainingReq_6_notes" class="form-input form-input-sm"></td></tr>
                                        <tr><td class="p-2 border"><input type="text" name="trainingReq_7_other" class="form-input form-input-sm" placeholder="أخرى — حدد المتطلب"></td><td class="p-2 border"><input type="date" name="trainingReq_7_plannedDate" class="form-input form-input-sm w-full"></td><td class="p-2 border"><input type="text" name="trainingReq_7_responsible" class="form-input form-input-sm"></td><td class="p-2 border"><input type="date" name="trainingReq_7_executionDate" class="form-input form-input-sm w-full"></td><td class="p-2 border"><input type="text" name="trainingReq_7_notes" class="form-input form-input-sm"></td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div id="documents-table-section" class="change-form-section change-form-section-card" data-section="5">
                            <h3 class="change-form-section-title"><span class="change-form-section-num">5</span> <i class="fas fa-file-contract ml-2"></i> الوثائق والمستندات المتعلقة بالسلامة والصحة المهنية والبيئة المطلوب تعديلها</h3>
                            <div class="overflow-x-auto">
                                <table class="w-full border-collapse text-sm">
                                    <thead>
                                        <tr class="bg-gray-100">
                                            <th class="p-2 border text-right">نوع الوثيقة / المستند</th>
                                            <th class="p-2 border text-right">اسم الوثيقة / المستند</th>
                                            <th class="p-2 border text-right">كود الوثيقة / المستند</th>
                                            <th class="p-2 border text-right">المسئول عن التعديل</th>
                                            <th class="p-2 border text-right">التاريخ المخطط للتعديل</th>
                                        </tr>
                                    </thead>
                                    <tbody>${docRows}</tbody>
                                </table>
                            </div>
                        </div>
                        <div class="change-form-section change-form-section-card" data-section="6">
                            <h3 class="change-form-section-title"><span class="change-form-section-num">6</span> <i class="fas fa-user-friends ml-2"></i> أعضاء لجنة دراسة التغييرات</h3>
                            <textarea name="committeeMembersJson" class="form-textarea" rows="3" placeholder="أسماء الأعضاء (سطر لكل عضو أو قائمة مفصولة بفاصلة)"></textarea>
                        </div>
                        <div class="change-form-section change-form-section-card" data-section="7">
                            <h3 class="change-form-section-title"><span class="change-form-section-num">7</span> <i class="fas fa-clipboard-check ml-2"></i> توصيات لجنة دراسة التغييرات</h3>
                            <textarea name="committeeRecommendations" class="form-textarea" rows="3" placeholder="توصيات اللجنة (إن وجدت)"></textarea>
                        </div>
                        <div class="change-form-section change-form-section-card grid grid-cols-1 md:grid-cols-2 gap-4" data-section="8">
                            <h3 class="change-form-section-title w-full" style="grid-column: 1 / -1;"><span class="change-form-section-num">8</span> <i class="fas fa-exclamation-triangle ml-2"></i> تقييم المخاطر والتنفيذ</h3>
                            <div>
                                <label class="form-label">تقييم المخاطر</label>
                                <textarea name="riskAssessment" class="form-textarea" rows="2"></textarea>
                            </div>
                            <div>
                                <label class="form-label">إجراءات التخفيف</label>
                                <textarea name="mitigationActions" class="form-textarea" rows="2"></textarea>
                            </div>
                            <div>
                                <label class="form-label">تاريخ مستهدف للتنفيذ</label>
                                <input type="date" name="dueDate" class="form-input">
                            </div>
                        </div>
                        <div class="modal-footer mt-4 flex gap-2 justify-center" style="border-top: 1px solid var(--border-color, #e5e7eb); padding-top: 1rem;">
                            <button type="button" onclick="this.closest('.modal-overlay').remove()" class="btn-secondary">إلغاء</button>
                            <button type="submit" class="btn-primary" style="background: var(--primary-color, #2563eb);"><i class="fas fa-save ml-2"></i> حفظ الطلب</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const today = new Date().toISOString().slice(0, 10);
        const dateInput = modal.querySelector('input[name="requestedAt"]');
        if (dateInput) dateInput.value = today;
        this.toggleFormSections();
        this.fetchAndShowNextRequestNumber(modal);
        this.fillFactoryAndSubLocationOptions(modal);
        this.setupChangeFormModalDragAndFullscreen(modal);
        const employeeCodeInput = modal.querySelector('#change-form-employee-code');
        if (employeeCodeInput) {
            employeeCodeInput.addEventListener('blur', () => this.lookupEmployeeByCode());
            employeeCodeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.lookupEmployeeByCode(); } });
        }
        modal.querySelectorAll('input[name="changeContinuity"]').forEach(r => {
            r.addEventListener('change', function() {
                const t = modal.querySelector('#temporaryUntilDate');
                if (t) t.style.display = this.value === 'Temporary' ? 'block' : 'none';
            });
        });
        modal.querySelectorAll('input[name="priorityType"]').forEach(r => {
            r.addEventListener('change', function() {
                const t = modal.querySelector('#priorityUrgentReason');
                if (t) t.style.display = this.value === 'Urgent' ? 'block' : 'none';
            });
        });
    },

    /** تبديل ملء الشاشة / استعادة لنموذج مقترح التغيير فقط */
    toggleChangeFormFullscreen(btn) {
        const modalContent = btn && btn.closest ? btn.closest('.change-form-modal') : null;
        const overlay = modalContent && modalContent.closest ? modalContent.closest('.modal-overlay') : null;
        if (!modalContent) return;
        const isFull = modalContent.classList.toggle('change-form-modal-fullscreen');
        if (overlay) overlay.classList.toggle('change-form-overlay-fullscreen', isFull);
        const icon = btn.querySelector('i');
        const label = btn.querySelector('.change-form-fullscreen-label');
        if (icon) icon.className = isFull ? 'fas fa-compress' : 'fas fa-expand';
        if (label) label.textContent = isFull ? 'استعادة' : 'ملء الشاشة';
        btn.setAttribute('title', isFull ? 'استعادة' : 'ملء الشاشة');
    },

    /** تحريك النموذج بالسحب وزر ملء الشاشة */
    setupChangeFormModalDragAndFullscreen(modal) {
        const content = modal.querySelector('.change-form-modal.change-form-modal-draggable');
        const dragHandle = modal.querySelector('.change-form-drag-handle');
        const fullscreenBtn = modal.querySelector('.change-form-btn-fullscreen');
        if (!content || !dragHandle) return;

        let isDragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
        dragHandle.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            isDragging = true;
            const rect = content.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            startX = e.clientX;
            startY = e.clientY;
            content.style.position = 'fixed';
            content.style.left = startLeft + 'px';
            content.style.top = startTop + 'px';
            content.style.margin = '0';
        });
        const onMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX, dy = e.clientY - startY;
            content.style.left = (startLeft + dx) + 'px';
            content.style.top = (startTop + dy) + 'px';
        };
        const onUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                content.classList.toggle('change-form-modal-fullscreen');
                const icon = fullscreenBtn.querySelector('i');
                if (icon) {
                    icon.className = content.classList.contains('change-form-modal-fullscreen') ? 'fas fa-compress' : 'fas fa-expand';
                }
                fullscreenBtn.title = content.classList.contains('change-form-modal-fullscreen') ? 'استعادة الحجم' : 'ملء الشاشة';
            });
        }
    },

    /** ملء قوائم المصنع والموقع الفرعي من قاعدة البيانات (observationSites / Form_Sites & Form_Places) */
    fillFactoryAndSubLocationOptions(modal) {
        const container = modal && modal.querySelector ? modal : document;
        const factorySelect = container.querySelector('#change-form-factory');
        const subSelect = container.querySelector('#change-form-sub');
        const factoryNameInput = container.querySelector('#change-form-factory-name');
        const subNameInput = container.querySelector('#change-form-sub-name');
        if (!factorySelect || !subSelect) return;

        const sites = (typeof AppState !== 'undefined' && AppState.appData && Array.isArray(AppState.appData.observationSites))
            ? AppState.appData.observationSites
            : [];
        factorySelect.innerHTML = '<option value="">اختر المصنع</option>';
        sites.forEach(site => {
            const id = String(site.id || '').trim();
            const name = (typeof Utils !== 'undefined' && Utils.escapeHTML) ? Utils.escapeHTML(String(site.name || '')) : String(site.name || '');
            if (id && name) factorySelect.appendChild(new Option(name, id));
        });

        subSelect.innerHTML = '<option value="">اختر الموقع الفرعي</option>';
        if (factoryNameInput) factoryNameInput.value = '';
        if (subNameInput) subNameInput.value = '';

        const updateSubLocations = () => {
            const siteId = String(factorySelect.value || '').trim();
            subSelect.innerHTML = '<option value="">اختر الموقع الفرعي</option>';
            if (subNameInput) subNameInput.value = '';
            const selectedOpt = factorySelect.options[factorySelect.selectedIndex];
            if (factoryNameInput) factoryNameInput.value = selectedOpt ? selectedOpt.text : '';
            if (!siteId) return;
            const site = sites.find(s => String(s.id || '').trim() === siteId);
            const places = (site && Array.isArray(site.places)) ? site.places : [];
            places.forEach(place => {
                const pid = String(place.id || '').trim();
                const pname = (typeof Utils !== 'undefined' && Utils.escapeHTML) ? Utils.escapeHTML(String(place.name || '')) : String(place.name || '');
                if (pid && pname) subSelect.appendChild(new Option(pname, pid));
            });
        };

        factorySelect.addEventListener('change', () => {
            updateSubLocations();
        });

        subSelect.addEventListener('change', () => {
            const opt = subSelect.options[subSelect.selectedIndex];
            if (subNameInput) subNameInput.value = opt ? opt.text : '';
        });
    },

    async fetchAndShowNextRequestNumber(modal) {
        const el = modal ? modal.querySelector('#change-form-request-number') : document.getElementById('change-form-request-number');
        if (!el) return;
        try {
            const response = await GoogleIntegration.sendRequest({ action: 'getNextChangeRequestNumber', data: {} });
            if (response && response.success && response.data && response.data.requestNumber) {
                el.textContent = response.data.requestNumber;
                el.style.color = 'var(--primary-color)';
            } else {
                el.textContent = 'سيُعيّن عند الحفظ';
            }
        } catch (e) {
            el.textContent = 'سيُعيّن عند الحفظ';
        }
    },

    lookupEmployeeByCode() {
        const codeInput = document.getElementById('change-form-employee-code');
        const nameInput = document.getElementById('change-form-employee-name');
        const card = document.getElementById('change-form-employee-card');
        const cardBody = document.getElementById('change-form-employee-card-body');
        if (!codeInput || !nameInput || !card) return;
        const code = String(codeInput.value || '').trim();
        if (!code) {
            nameInput.value = '';
            if (cardBody) cardBody.innerHTML = '';
            card.style.display = 'none';
            return;
        }
        const employees = (typeof AppState !== 'undefined' && AppState.appData && Array.isArray(AppState.appData.employees)) ? AppState.appData.employees : [];
        const emp = employees.find(e => {
            const n = e.employeeNumber != null ? String(e.employeeNumber).trim() : '';
            const id = e.id != null ? String(e.id).trim() : '';
            return n === code || id === code;
        });
        if (emp) {
            nameInput.value = emp.name || '';
            if (cardBody) {
                const esc = (v) => (typeof Utils !== 'undefined' && Utils.escapeHTML) ? Utils.escapeHTML(String(v || '—')) : String(v || '—');
                cardBody.innerHTML = `
                    <div><span style="color: var(--text-secondary);">الاسم:</span> <strong>${esc(emp.name)}</strong></div>
                    <div><span style="color: var(--text-secondary);">القسم:</span> ${esc(emp.department)}</div>
                    <div><span style="color: var(--text-secondary);">الوظيفة:</span> ${esc(emp.job)}</div>
                    <div><span style="color: var(--text-secondary);">الموقع:</span> ${esc(emp.location || emp.branch)}</div>
                `;
            }
            card.style.display = 'block';
            if (typeof Notification !== 'undefined' && Notification.success) Notification.success('تم تحميل بيانات الموظف');
        } else {
            nameInput.value = '';
            if (cardBody) cardBody.innerHTML = '';
            card.style.display = 'none';
            if (code && typeof Notification !== 'undefined' && Notification.warning) Notification.warning('لم يتم العثور على موظف بهذا الكود');
        }
    },

    /** تفاعل القائمة المنسدلة: إظهار/إخفاء أقسام الفني أو الإداري حسب نوع الطلب */
    toggleFormSections() {
        const sel = document.getElementById('change-form-type');
        const isTechnical = sel && sel.value === 'Technical';
        const isAdmin = sel && sel.value === 'Administrative';

        const technicalSubtypeWrap = document.getElementById('technical-subtype-wrap');
        const documentsTableSection = document.getElementById('documents-table-section');
        const administrativeFieldsWrap = document.getElementById('administrative-fields-wrap');
        const adminEmployeeRow = document.getElementById('admin-employee-row');
        const adminHealthSection = document.getElementById('admin-health-section');
        const adminTrainingSection = document.getElementById('admin-training-section');

        if (technicalSubtypeWrap) technicalSubtypeWrap.style.display = isTechnical ? 'block' : 'none';
        if (documentsTableSection) documentsTableSection.style.display = isTechnical ? 'block' : 'none';
        if (administrativeFieldsWrap) administrativeFieldsWrap.style.display = isAdmin ? 'block' : 'none';
        if (adminEmployeeRow) adminEmployeeRow.style.display = isAdmin ? 'block' : 'none';
        if (adminHealthSection) adminHealthSection.style.display = isAdmin ? 'block' : 'none';
        if (adminTrainingSection) adminTrainingSection.style.display = isAdmin ? 'block' : 'none';
    },

    toggleTechnicalSubType() {
        this.toggleFormSections();
    },

    async handleCreateSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const fd = new FormData(form);
        const user = (typeof AppState !== 'undefined' && AppState.currentUser) ? AppState.currentUser : {};
        const priorityType = fd.get('priorityType') || 'Normal';
        const priority = priorityType === 'Urgent' ? '2-High' : '3-Medium';
        const requestedAt = fd.get('requestedAt') || new Date().toISOString().slice(0, 10);

        const docRowsCount = parseInt(form.querySelector('input[name="docRowsCount"]')?.value || '5', 10);
        const documentsToAmend = [];
        for (let i = 0; i < docRowsCount; i++) {
            const docType = fd.get('docType_' + i);
            const docName = fd.get('docName_' + i);
            const docCode = fd.get('docCode_' + i);
            const docResponsible = fd.get('docResponsible_' + i);
            const docPlanDate = fd.get('docPlanDate_' + i);
            if (docType || docName || docCode || docResponsible || docPlanDate) {
                documentsToAmend.push({
                    documentType: docType || '',
                    documentName: docName || '',
                    documentCode: docCode || '',
                    responsibleForAmendment: docResponsible || '',
                    plannedAmendmentDate: docPlanDate || ''
                });
            }
        }
        let committeeMembersJson = fd.get('committeeMembersJson') || '';
        if (committeeMembersJson && typeof committeeMembersJson === 'string') {
            committeeMembersJson = committeeMembersJson.trim();
        }

        const trainingReqLabels = [
            'توعية بالموقع الجديد والمخاطر المحتملة',
            'تدريب على رأس العمل للمهام الجديدة',
            'توعية بتحليل المخاطر ووسائل التحكم تتضمن PPE',
            'توعية على خطة الطوارئ',
            'فحوص طبية قبل تنفيذ النقل / التكليف',
            'فحوص طبية دورية',
            'خطة التدريب / مصفوفة التدريب',
            null
        ];
        const trainingRequirements = [];
        for (let i = 0; i < 8; i++) {
            const requirement = i === 7 ? (fd.get('trainingReq_7_other') || '').trim() : (trainingReqLabels[i] || '');
            const plannedDate = fd.get('trainingReq_' + i + '_plannedDate') || '';
            const responsible = fd.get('trainingReq_' + i + '_responsible') || '';
            const executionDate = fd.get('trainingReq_' + i + '_executionDate') || '';
            const notes = fd.get('trainingReq_' + i + '_notes') || '';
            if (requirement || plannedDate || responsible || executionDate || notes) {
                trainingRequirements.push({
                    requirement: requirement || (trainingReqLabels[i] || 'أخرى'),
                    plannedDate: plannedDate,
                    responsible: responsible,
                    executionDate: executionDate,
                    notes: notes
                });
            }
        }

        const requestNumberEl = document.getElementById('change-form-request-number');
        const requestNumber = (requestNumberEl && requestNumberEl.textContent && requestNumberEl.textContent.trim() && requestNumberEl.textContent.trim() !== 'جاري التحميل...' && requestNumberEl.textContent.trim() !== 'سيُعيّن عند الحفظ') ? requestNumberEl.textContent.trim() : '';
        const data = {
            id: requestNumber || undefined,
            requestNumber: requestNumber || undefined,
            title: fd.get('title'),
            description: fd.get('description'),
            changeType: fd.get('changeType') || 'Administrative',
            priority: priority,
            impact: '1-Minor',
            fromDepartment: fd.get('fromDepartment') || '',
            toDepartment: fd.get('toDepartment') || '',
            locationOther: fd.get('adminChangeLocation') || fd.get('locationOther') || '',
            technicalChangeSubType: fd.get('technicalChangeSubType') || '',
            changeContinuity: fd.get('changeContinuity') || 'Permanent',
            temporaryUntilDate: fd.get('temporaryUntilDate') || '',
            priorityUrgentReason: fd.get('priorityUrgentReason') || '',
            attachedDocumentsText: fd.get('attachedDocumentsText') || '',
            requestingDepartment: fd.get('requestingDepartment') || '',
            otherDepartments: fd.get('otherDepartments') || '',
            affectedDepartments: fd.get('affectedDepartments') || '',
            documentsToAmendJson: documentsToAmend.length ? JSON.stringify(documentsToAmend) : '',
            committeeMembersJson: committeeMembersJson,
            committeeRecommendations: fd.get('committeeRecommendations') || '',
            riskAssessment: fd.get('riskAssessment') || '',
            mitigationActions: fd.get('mitigationActions') || '',
            dueDate: fd.get('dueDate') || '',
            employeeName: fd.get('employeeName') || '',
            employeeCode: fd.get('employeeCode') || '',
            currentTasksDescription: fd.get('currentTasksDescription') || '',
            newTasksDescription: fd.get('newTasksDescription') || '',
            administrativeChangeSubType: fd.get('administrativeChangeSubType') || '',
            responsibleRequestingDepartment: fd.get('responsibleRequestingDepartment') || '',
            responsibleImplementingDepartment: fd.get('responsibleImplementingDepartment') || '',
            previousInjury: fd.get('previousInjury') || '',
            chronicDiseases: fd.get('chronicDiseases') || '',
            healthNotes: fd.get('healthNotes') || '',
            trainingRequirementsJson: trainingRequirements.length ? JSON.stringify(trainingRequirements) : '',
            requestedBy: user.name || user.email || 'غير محدد',
            requestedByEmail: user.email || '',
            requestedAt: requestedAt,
            factoryId: fd.get('factoryId') || '',
            factoryName: fd.get('factoryName') || '',
            subLocationId: fd.get('subLocationId') || '',
            subLocationName: fd.get('subLocationName') || '',
            createdBy: user.email || user.name || 'غير محدد'
        };

        const overlay = form.closest('.modal-overlay');
        if (overlay) overlay.remove();
        if (typeof Notification !== 'undefined' && Notification.info) Notification.info('جاري الحفظ...');

        (async () => {
            try {
                const response = await GoogleIntegration.sendRequest({
                    action: 'addChangeRequest',
                    data: data
                });
                if (response && response.success) {
                    if (typeof Notification !== 'undefined' && Notification.success) Notification.success('تم إضافة طلب التغيير بنجاح');
                    this.loadChangeRequests();
                } else {
                    if (typeof Notification !== 'undefined' && Notification.error) Notification.error(response?.message || 'فشل الحفظ');
                }
            } catch (err) {
                if (typeof Notification !== 'undefined' && Notification.error) Notification.error('حدث خطأ أثناء الحفظ');
            }
        })();
    },

    async showRequestDetail(requestId) {
        try {
            const response = await GoogleIntegration.sendRequest({
                action: 'getChangeRequest',
                data: { requestId: requestId }
            });
            if (!response || !response.success || !response.data) {
                if (typeof Notification !== 'undefined' && Notification.error) Notification.error('طلب التغيير غير موجود');
                return;
            }
            const req = response.data;
            this.state.currentRequest = req;

            const safe = (v) => (typeof Utils !== 'undefined' && Utils.escapeHTML) ? Utils.escapeHTML(String(v || '')) : String(v || '');
            const canApprove = typeof Permissions !== 'undefined' && Permissions.hasAccess && Permissions.hasAccess('change-management');
            const isDraft = req.status === 'Draft';
            const isInReview = req.status === 'In Review';
            const isApproved = req.status === 'Approved';
            const isRejected = req.status === 'Rejected';
            const isInImpl = req.status === 'In Implementation';
            const isCompleted = req.status === 'Completed';
            const isClosed = req.status === 'Closed';

            let timeLogHTML = '';
            try {
                const log = req.timeLog;
                const arr = Array.isArray(log) ? log : (typeof log === 'string' && log ? JSON.parse(log) : []);
                if (arr.length) {
                    timeLogHTML = arr.slice().reverse().map(entry => `
                        <div class="border-b border-gray-100 pb-2 mb-2 last:border-0">
                            <span class="text-sm font-medium">${safe(entry.action || '')}</span>
                            <span class="text-gray-500 text-sm"> — ${safe(entry.user || '')} — ${this.formatDate(entry.timestamp)}</span>
                            ${entry.note ? `<p class="text-sm text-gray-600 mt-1">${safe(entry.note)}</p>` : ''}
                        </div>
                    `).join('');
                } else {
                    timeLogHTML = '<p class="text-gray-500 text-sm">لا يوجد سجل</p>';
                }
            } catch (e) {
                timeLogHTML = '<p class="text-gray-500 text-sm">لا يوجد سجل</p>';
            }

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 900px;">
                    <div class="modal-header">
                        <h2 class="modal-title">${safe(req.requestNumber || req.id)} — ${safe(req.title)}</h2>
                        <button type="button" onclick="this.closest('.modal-overlay').remove()" class="modal-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div><span class="text-gray-500">الحالة:</span> <strong>${this.getStatusLabel(req.status)}</strong></div>
                            <div><span class="text-gray-500">نوع التغيير:</span> ${this.getChangeTypeLabel(req.changeType)}</div>
                            <div><span class="text-gray-500">الأولوية:</span> ${this.getPriorityLabel(req.priority)}</div>
                            <div><span class="text-gray-500">الأثر:</span> ${this.getImpactLabel(req.impact)}</div>
                            <div><span class="text-gray-500">مقدم الطلب:</span> ${safe(req.requestedBy)}</div>
                            <div><span class="text-gray-500">التاريخ:</span> ${this.formatDate(req.requestedAt || req.createdAt)}</div>
                            ${req.relatedModule ? `<div><span class="text-gray-500">الموديول المرتبط:</span> ${safe(req.relatedModule)}</div>` : ''}
                        </div>
                        <div class="mb-4">
                            <span class="text-gray-500 block mb-1">الوصف:</span>
                            <p class="text-gray-800">${safe(req.description || '—')}</p>
                        </div>
                        ${req.riskAssessment ? `<div class="mb-4"><span class="text-gray-500 block mb-1">تقييم المخاطر:</span><p class="text-gray-800">${safe(req.riskAssessment)}</p></div>` : ''}
                        ${req.mitigationActions ? `<div class="mb-4"><span class="text-gray-500 block mb-1">إجراءات التخفيف:</span><p class="text-gray-800">${safe(req.mitigationActions)}</p></div>` : ''}
                        <div class="mb-4">
                            <h3 class="font-semibold mb-2">سجل الأنشطة</h3>
                            <div class="bg-gray-50 p-3 rounded max-h-48 overflow-y-auto">${timeLogHTML}</div>
                        </div>
                        <div class="flex flex-wrap gap-2 mt-4">
                            ${isDraft && canApprove ? `<button type="button" onclick="ChangeManagement.updateRequestStatus('${safe(req.id)}','In Review'); this.closest('.modal-overlay').remove();" class="btn-primary"><i class="fas fa-paper-plane ml-2"></i> إرسال للمراجعة</button>` : ''}
                            ${isInReview && canApprove ? `
                                <button type="button" onclick="ChangeManagement.updateRequestStatus('${safe(req.id)}','Approved'); this.closest('.modal-overlay').remove();" class="btn-primary"><i class="fas fa-check ml-2"></i> موافقة</button>
                                <button type="button" onclick="ChangeManagement.rejectRequest('${safe(req.id)}');" class="btn-secondary btn-danger"><i class="fas fa-times ml-2"></i> رفض</button>
                            ` : ''}
                            ${isApproved && canApprove ? `<button type="button" onclick="ChangeManagement.updateRequestStatus('${safe(req.id)}','In Implementation'); this.closest('.modal-overlay').remove();" class="btn-primary"><i class="fas fa-play ml-2"></i> بدء التنفيذ</button>` : ''}
                            ${isInImpl && canApprove ? `<button type="button" onclick="ChangeManagement.updateRequestStatus('${safe(req.id)}','Completed'); this.closest('.modal-overlay').remove();" class="btn-primary"><i class="fas fa-check-double ml-2"></i> تم التنفيذ</button>` : ''}
                            ${(isCompleted || isInImpl) && canApprove && !isClosed ? `<button type="button" onclick="ChangeManagement.updateRequestStatus('${safe(req.id)}','Closed'); this.closest('.modal-overlay').remove();" class="btn-secondary"><i class="fas fa-lock ml-2"></i> إغلاق</button>` : ''}
                            <button type="button" onclick="this.closest('.modal-overlay').remove()" class="btn-secondary">إغلاق</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } catch (err) {
            if (typeof Utils !== 'undefined' && Utils.safeError) Utils.safeError('showRequestDetail:', err);
            if (typeof Notification !== 'undefined' && Notification.error) Notification.error('حدث خطأ في تحميل التفاصيل');
        }
    },

    async updateRequestStatus(requestId, status) {
        const user = (typeof AppState !== 'undefined' && AppState.currentUser) ? AppState.currentUser : {};
        const updatedBy = user.name || user.email || 'System';
        const updateData = {
            status: status,
            updatedBy: user.email || user.name || updatedBy,
            updateNote: 'تحديث الحالة إلى ' + this.getStatusLabel(status)
        };
        if (status === 'Approved') updateData.approvedBy = updatedBy;
        if (status === 'Rejected') updateData.rejectedBy = updatedBy;
        if (status === 'Completed') updateData.implementedBy = updatedBy;
        if (status === 'Closed') updateData.closedBy = updatedBy;

        try {
            const response = await GoogleIntegration.sendRequest({
                action: 'updateChangeRequest',
                data: {
                    requestId: requestId,
                    updateData: updateData
                }
            });
            if (response && response.success) {
                if (typeof Notification !== 'undefined' && Notification.success) Notification.success('تم تحديث الحالة');
                await this.loadChangeRequests();
            } else {
                if (typeof Notification !== 'undefined' && Notification.error) Notification.error(response?.message || 'فشل التحديث');
            }
        } catch (err) {
            if (typeof Notification !== 'undefined' && Notification.error) Notification.error('حدث خطأ أثناء التحديث');
        }
    },

    rejectRequest(requestId) {
        const reason = prompt('سبب الرفض (اختياري):');
        const user = (typeof AppState !== 'undefined' && AppState.currentUser) ? AppState.currentUser : {};
        const updatedBy = user.name || user.email || 'System';
        const updateData = {
            status: 'Rejected',
            rejectedBy: updatedBy,
            rejectionReason: reason || 'بدون سبب',
            updatedBy: user.email || user.name || updatedBy,
            updateNote: 'تم رفض الطلب'
        };
        GoogleIntegration.sendRequest({
            action: 'updateChangeRequest',
            data: { requestId: requestId, updateData: updateData }
        }).then(response => {
            if (response && response.success) {
                if (typeof Notification !== 'undefined' && Notification.success) Notification.success('تم رفض الطلب');
                this.loadChangeRequests();
            }
            document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
        });
    },

    async showStatistics() {
        const btn = document.getElementById('change-btn-statistics');
        if (btn) { btn.disabled = true; setTimeout(() => { btn.disabled = false; }, 800); }
        try {
            const response = await GoogleIntegration.sendRequest({
                action: 'getChangeRequestStatistics',
                data: { filters: this.buildFilters() }
            });
            if (!response || !response.success) {
                if (typeof Notification !== 'undefined' && Notification.error) Notification.error('فشل تحميل الإحصائيات');
                return;
            }
            const d = response.data || {};
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2 class="modal-title">إحصائيات إدارة التغيرات</h2>
                        <button type="button" onclick="this.closest('.modal-overlay').remove()" class="modal-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div class="bg-blue-50 p-4 rounded text-center">
                                <div class="text-2xl font-bold text-blue-600">${d.total || 0}</div>
                                <div class="text-sm text-gray-600">إجمالي الطلبات</div>
                            </div>
                            <div class="bg-green-50 p-4 rounded text-center">
                                <div class="text-2xl font-bold text-green-600">${d.byStatus && d.byStatus.Approved ? d.byStatus.Approved : 0}</div>
                                <div class="text-sm text-gray-600">معتمد</div>
                            </div>
                            <div class="bg-red-50 p-4 rounded text-center">
                                <div class="text-2xl font-bold text-red-600">${d.byStatus && d.byStatus.Rejected ? d.byStatus.Rejected : 0}</div>
                                <div class="text-sm text-gray-600">مرفوض</div>
                            </div>
                            <div class="bg-teal-50 p-4 rounded text-center">
                                <div class="text-2xl font-bold text-teal-600">${d.byStatus && d.byStatus.Completed ? d.byStatus.Completed : 0}</div>
                                <div class="text-sm text-gray-600">منفذ</div>
                            </div>
                        </div>
                        <div class="mb-4">
                            <h3 class="font-semibold mb-2">حسب الحالة</h3>
                            ${this.renderStatsBars(d.byStatus)}
                        </div>
                        <div class="mb-4">
                            <h3 class="font-semibold mb-2">حسب نوع التغيير</h3>
                            ${this.renderStatsBars(d.byChangeType)}
                        </div>
                        <div>
                            <h3 class="font-semibold mb-2">حسب الأولوية</h3>
                            ${this.renderStatsBars(d.byPriority)}
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } catch (err) {
            if (typeof Notification !== 'undefined' && Notification.error) Notification.error('حدث خطأ في تحميل الإحصائيات');
        }
    },

    renderStatsBars(obj) {
        if (!obj || typeof obj !== 'object') return '<p class="text-gray-500">لا توجد بيانات</p>';
        const total = Object.values(obj).reduce((a, b) => a + b, 0);
        if (total === 0) return '<p class="text-gray-500">لا توجد بيانات</p>';
        return Object.entries(obj).map(([key, count]) => {
            const pct = total > 0 ? (count / total * 100).toFixed(1) : 0;
            const label = this.getStatusLabel(key) || this.getChangeTypeLabel(key) || this.getPriorityLabel(key) || key;
            return `
                <div class="mb-2">
                    <div class="flex justify-between text-sm mb-1">
                        <span>${label}</span>
                        <span>${count} (${pct}%)</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    getModuleOptions() {
        const list = ['incidents', 'nearmiss', 'ptw', 'training', 'clinic', 'fire-equipment', 'ppe', 'violations', 'contractors', 'daily-observations', 'risk-assessment', 'sop-jha', 'action-tracking', 'settings', 'Other'];
        return list.map(m => `<option value="${m}">${m}</option>`).join('');
    },

    getStatusLabel(s) {
        const labels = { 'Draft': 'مسودة', 'In Review': 'قيد المراجعة', 'Approved': 'معتمد', 'Rejected': 'مرفوض', 'In Implementation': 'قيد التنفيذ', 'Completed': 'منفذ', 'Closed': 'مغلق' };
        return labels[s] || s;
    },

    getChangeTypeLabel(s) {
        const labels = { 'Technical': 'تقني', 'Administrative': 'إداري', 'Organizational': 'تنظيمي' };
        return labels[s] || s;
    },

    getPriorityLabel(s) {
        const labels = { '1-VeryHigh': 'عالي جداً', '2-High': 'عالي', '3-Medium': 'متوسط', '4-Low': 'منخفض' };
        return labels[s] || s;
    },

    getImpactLabel(s) {
        const labels = { '1-Minor': 'بسيط', '2-Major': 'كبير', '3-Critical': 'حرج' };
        return labels[s] || s;
    },

    formatDate(dateString) {
        if (!dateString) return '—';
        try {
            return new Date(dateString).toLocaleDateString('ar-SA');
        } catch (e) {
            return dateString;
        }
    },

    /** تفاصيل الطلب كاملة للتصدير */
    getExportData() {
        const list = this.state.lastRequests || [];
        return list.map(r => {
            const desc = r.description || '';
            const adminSub = r.administrativeChangeSubType ? (r.administrativeChangeSubType === 'AssignmentRequest' ? 'طلب تكليف' : r.administrativeChangeSubType === 'TransferTechnicians' ? 'نقل للفنيين' : 'أخرى') : '';
            const techSub = r.technicalChangeSubType ? (r.technicalChangeSubType === 'ProductionProcess' ? 'عملية إنتاجية' : 'عملية غير إنتاجية') : '';
            return {
                'رقم الطلب': r.requestNumber || r.id,
                'التاريخ': this.formatDate(r.requestedAt || r.createdAt),
                'الموضوع': r.title || '—',
                'نوع التغيير': this.getChangeTypeLabel(r.changeType),
                'نوع فرعي (فني/إداري)': techSub || adminSub || '—',
                'الحالة': this.getStatusLabel(r.status),
                'الأولوية': this.getPriorityLabel(r.priority),
                'الأثر': this.getImpactLabel(r.impact),
                'مقدم الطلب': r.requestedBy || '—',
                'من إدارة': r.fromDepartment || '—',
                'إلى إدارة': r.toDepartment || '—',
                'المصنع': r.factoryName || '—',
                'الموقع الفرعي': r.subLocationName || '—',
                'موقع آخر': r.locationOther || '—',
                'استمرارية التغيير': r.changeContinuity === 'Permanent' ? 'دائم' : (r.changeContinuity === 'Temporary' ? 'مؤقت' : '—'),
                'تاريخ انتهاء المؤقت': this.formatDate(r.temporaryUntilDate),
                'سبب العجلة': r.priorityUrgentReason || '—',
                'الوصف الكامل': desc,
                'المستندات المرفقة': r.attachedDocumentsText || '—',
                'الإدارة الطالبة': r.requestingDepartment || '—',
                'إدارات أخرى': r.otherDepartments || '—',
                'الإدارات المتأثرة': r.affectedDepartments || '—',
                'توصيات اللجنة': r.committeeRecommendations || '—',
                'تقييم المخاطر': r.riskAssessment || '—',
                'إجراءات التخفيف': r.mitigationActions || '—',
                'تاريخ مستهدف للتنفيذ': this.formatDate(r.dueDate),
                'اسم الموظف': r.employeeName || '—',
                'كود الموظف': r.employeeCode || '—',
                'المهام الحالية': r.currentTasksDescription || '—',
                'المهام الجديدة': r.newTasksDescription || '—',
                'مسئول الطالب': r.responsibleRequestingDepartment || '—',
                'مسئول المنفذ': r.responsibleImplementingDepartment || '—',
                'إصابة سابقة': r.previousInjury || '—',
                'أمراض مزمنة': r.chronicDiseases || '—',
                'ملاحظات صحية': r.healthNotes || '—',
                'سبب الرفض': r.rejectionReason || '—'
            };
        });
    },

    /** هيدر وفوتر التصدير كما في نماذج النظام (اسم الشركة، الشعار، تاريخ التصدير) */
    getExportHeaderFooter() {
        const companyName = (typeof AppState !== 'undefined' && AppState.companySettings && AppState.companySettings.name)
            ? String(AppState.companySettings.name).trim()
            : (typeof AppState !== 'undefined' && AppState.companyName) ? String(AppState.companyName).trim() : '';
        const logoUrl = (typeof AppState !== 'undefined' && (AppState.companyLogo || (AppState.companySettings && AppState.companySettings.logo)))
            ? (AppState.companyLogo || AppState.companySettings.logo || '')
            : '';
        const reportTitle = 'طلبات التغيير - إدارة التغيرات';
        const exportDate = this.formatDate(new Date().toISOString());
        const formatDateTime = (typeof Utils !== 'undefined' && Utils.formatDateTime) ? Utils.formatDateTime : (d) => this.formatDate(d);
        const exportDateTime = formatDateTime(new Date().toISOString());
        return { companyName, logoUrl, reportTitle, exportDate, exportDateTime };
    },

    exportToExcel() {
        try {
            const data = this.getExportData();
            if (!data || data.length === 0) {
                if (typeof Notification !== 'undefined') Notification.warning('لا توجد بيانات للتصدير');
                return;
            }
            if (typeof XLSX === 'undefined') {
                if (typeof Notification !== 'undefined') Notification.error('مكتبة Excel غير متاحة. يرجى تحديث الصفحة والمحاولة مرة أخرى');
                return;
            }
            if (typeof Loading !== 'undefined') Loading.show('جاري إنشاء ملف Excel...');
            const hf = this.getExportHeaderFooter();
            const headerRows = [
                [hf.companyName || 'إدارة التغيرات'],
                [hf.reportTitle],
                ['تاريخ التصدير: ' + hf.exportDateTime],
                []
            ];
            const colHeaders = Object.keys(data[0] || {});
            const dataRows = data.map(r => colHeaders.map(k => (r[k] != null && r[k] !== undefined ? String(r[k]) : '')));
            const footerRow = colHeaders.map((_, i) => (i === 0 ? '— تم التصدير في ' + hf.exportDateTime + ' —' : ''));
            const aoa = headerRows.concat([colHeaders], dataRows, [footerRow]);
            const ws = XLSX.utils.aoa_to_sheet(aoa);
            const wideKeys = ['الوصف الكامل', 'المستندات المرفقة', 'المهام الحالية', 'المهام الجديدة', 'توصيات اللجنة', 'تقييم المخاطر', 'إجراءات التخفيف', 'سبب العجلة', 'سبب الرفض'];
            ws['!cols'] = colHeaders.map(k => ({ wch: wideKeys.indexOf(k) >= 0 ? 45 : (k.length > 12 ? 22 : 14) }));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'طلبات التغيير');
            const name = `طلبات_التغيير_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, name);
            if (typeof Loading !== 'undefined') Loading.hide();
            if (typeof Notification !== 'undefined') Notification.success('تم تصدير البيانات إلى Excel بنجاح');
        } catch (err) {
            if (typeof Loading !== 'undefined') Loading.hide();
            if (typeof Utils !== 'undefined' && Utils.safeError) Utils.safeError('تصدير Excel:', err);
            if (typeof Notification !== 'undefined') Notification.error('فشل التصدير: ' + (err.message || err));
        }
    },

    exportToPDF() {
        try {
            const data = this.getExportData();
            if (!data || data.length === 0) {
                if (typeof Notification !== 'undefined') Notification.warning('لا توجد بيانات للتصدير');
                return;
            }
            if (typeof Loading !== 'undefined') Loading.show('جاري إنشاء PDF...');
            const hf = this.getExportHeaderFooter();
            const safe = (v) => (typeof Utils !== 'undefined' && Utils.escapeHTML) ? Utils.escapeHTML(String(v || '')) : String(v || '');

            if (typeof window.jsPDF !== 'undefined') {
                const { jsPDF } = window.jsPDF;
                const doc = new jsPDF('l', 'mm', 'a4');
                const pageW = doc.internal.pageSize.getWidth();
                const pageH = doc.internal.pageSize.getHeight();

                doc.setFontSize(10);
                if (hf.companyName) doc.text(hf.companyName, pageW / 2, 10, { align: 'center' });
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text(hf.reportTitle, pageW / 2, hf.companyName ? 18 : 12, { align: 'center' });
                doc.setFont(undefined, 'normal');
                doc.setFontSize(9);
                doc.text('تاريخ التصدير: ' + hf.exportDateTime + '  |  عدد الطلبات: ' + data.length, 14, hf.companyName ? 25 : 20);
                const startY = hf.companyName ? 30 : 25;

                const colHeaders = Object.keys(data[0] || {});
                const headers = colHeaders;
                const rows = data.map(r => colHeaders.map(k => String(r[k] != null && r[k] !== undefined ? r[k] : '—')));
                const footerText = hf.companyName ? hf.companyName + ' — ' + hf.reportTitle + ' — تم التصدير في ' + hf.exportDateTime : 'تم التصدير في ' + hf.exportDateTime;

                if (typeof doc.autoTable !== 'undefined') {
                    doc.autoTable({
                        head: [headers],
                        body: rows,
                        startY: startY,
                        styles: { fontSize: 5, cellPadding: 1 },
                        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 5 },
                        alternateRowStyles: { fillColor: [245, 247, 250] },
                        margin: { left: 8, right: 8 },
                        overflow: 'linebreak',
                        didDrawPage: (data) => {
                            doc.setFontSize(8);
                            doc.setTextColor(128, 128, 128);
                            doc.text(footerText, pageW / 2, pageH - 10, { align: 'center' });
                            doc.setTextColor(0, 0, 0);
                        }
                    });
                } else {
                    let y = startY;
                    rows.forEach((row) => {
                        if (y > pageH - 25) { doc.addPage('l', 'a4'); y = 20; }
                        doc.setFontSize(5);
                        doc.text(row.join(' | '), 8, y, { maxWidth: pageW - 16 });
                        y += 5;
                    });
                    doc.setFontSize(8);
                    doc.setTextColor(128, 128, 128);
                    doc.text(footerText, pageW / 2, pageH - 10, { align: 'center' });
                }
                doc.save(`طلبات_التغيير_${new Date().toISOString().slice(0, 10)}.pdf`);
            } else {
                const logoHtml = hf.logoUrl ? `<img src="${safe(hf.logoUrl)}" alt="" style="max-height:48px; max-width:120px; object-fit:contain;">` : '';
                const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${safe(hf.reportTitle)}</title>
<style>
@page { margin: 1.5cm; }
body { font-family: 'Cairo', Tahoma, sans-serif; margin: 0; padding: 15px; }
.export-header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 15px; }
.export-header .company-name { font-size: 18px; font-weight: bold; color: #1e40af; margin-bottom: 4px; }
.export-header .report-title { font-size: 16px; color: #2563eb; }
.export-header .export-meta { font-size: 11px; color: #666; margin-top: 6px; }
.export-footer { text-align: center; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 15px; font-size: 10px; color: #666; }
table { border-collapse: collapse; width: 100%; font-size: 9px; table-layout: fixed; }
th, td { border: 1px solid #ddd; padding: 6px; text-align: right; }
th { background: #2563eb; color: #fff; }
tr:nth-child(even) { background: #f5f7fa; }
</style></head><body>
<div class="export-header">
  ${logoHtml}
  ${hf.companyName ? '<div class="company-name">' + safe(hf.companyName) + '</div>' : ''}
  <div class="report-title">${safe(hf.reportTitle)}</div>
  <div class="export-meta">تاريخ التصدير: ${safe(hf.exportDateTime)}  |  عدد الطلبات: ${data.length}</div>
</div>
<table><thead><tr>${(Object.keys(data[0] || {})).map(k => '<th>' + safe(k) + '</th>').join('')}</tr></thead><tbody>
${data.map(r => '<tr>' + (Object.keys(data[0] || {})).map(k => '<td>' + safe(r[k]) + '</td>').join('') + '</tr>').join('')}
</tbody></table>
<div class="export-footer">${safe(hf.companyName || '')} ${hf.companyName ? '— ' : ''}${safe(hf.reportTitle)} — تم التصدير في ${safe(hf.exportDateTime)}</div>
</body></html>`;
                const win = window.open('', '_blank');
                win.document.write(html);
                win.document.close();
                win.print();
                win.onafterprint = () => win.close();
            }
            if (typeof Loading !== 'undefined') Loading.hide();
            if (typeof Notification !== 'undefined') Notification.success('تم تصدير البيانات إلى PDF بنجاح');
        } catch (err) {
            if (typeof Loading !== 'undefined') Loading.hide();
            if (typeof Utils !== 'undefined' && Utils.safeError) Utils.safeError('تصدير PDF:', err);
            if (typeof Notification !== 'undefined') Notification.error('فشل التصدير: ' + (err.message || err));
        }
    },

    handleSearch(value) {
        this.state.filters.search = value;
        if (this.state._searchDebounce) clearTimeout(this.state._searchDebounce);
        this.state._searchDebounce = setTimeout(() => {
            this.state._searchDebounce = null;
            this.loadChangeRequests();
        }, 350);
    },

    switchTab(tab) {
        this.state.activeTab = tab;
        const reqPanel = document.getElementById('change-tab-requests');
        const regPanel = document.getElementById('change-tab-register');
        const btns = document.querySelectorAll('.change-tab-btn');
        if (btns.length) {
            btns.forEach(function(b) {
                b.classList.toggle('active', b.getAttribute('data-tab') === tab);
            });
        }
        if (reqPanel) reqPanel.style.display = tab === 'requests' ? 'block' : 'none';
        if (regPanel) regPanel.style.display = tab === 'register' ? 'block' : 'none';
        if (tab === 'register') {
            if (this.state.lastRequests && this.state.lastRequests.length > 0) {
                this.renderRegisterTable(this.state.lastRequests);
            } else {
                this.loadChangeRequests();
            }
        }
    },

    renderRegisterTable(requests) {
        const container = document.getElementById('change-register-list-container');
        if (!container) return;
        const safe = (v) => (typeof Utils !== 'undefined' && Utils.escapeHTML) ? Utils.escapeHTML(String(v || '')) : String(v || '');
        if (!requests || requests.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox text-4xl text-gray-300 mb-4"></i><p class="text-gray-500">لا توجد طلبات في السجل</p></div>';
            return;
        }
        const statusColors = { 'Draft': 'bg-gray-100 text-gray-800', 'In Review': 'bg-blue-100 text-blue-800', 'Approved': 'bg-green-100 text-green-800', 'Rejected': 'bg-red-100 text-red-800', 'In Implementation': 'bg-purple-100 text-purple-800', 'Completed': 'bg-teal-100 text-teal-800', 'Closed': 'bg-gray-100 text-gray-600' };
        container.innerHTML = `
            <div class="overflow-x-auto change-register-table-wrap">
                <table class="w-full border-collapse text-sm" style="border-color: var(--border-color);">
                    <thead>
                        <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-color);">
                            <th class="p-3 text-right font-semibold" style="color: var(--text-primary);">رقم الطلب</th>
                            <th class="p-3 text-right font-semibold" style="color: var(--text-primary);">الموضوع</th>
                            <th class="p-3 text-right font-semibold" style="color: var(--text-primary);">نوع التغيير</th>
                            <th class="p-3 text-right font-semibold" style="color: var(--text-primary);">الحالة</th>
                            <th class="p-3 text-right font-semibold" style="color: var(--text-primary);">مقدم الطلب</th>
                            <th class="p-3 text-right font-semibold" style="color: var(--text-primary);">التاريخ</th>
                            <th class="p-3 text-right font-semibold" style="color: var(--text-primary);">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${requests.map(r => `
                            <tr class="border-b hover:opacity-90" style="border-color: var(--border-color); background: var(--card-bg);">
                                <td class="p-3">${safe(r.requestNumber || r.id)}</td>
                                <td class="p-3">${safe(r.title || '—')}</td>
                                <td class="p-3">${this.getChangeTypeLabel(r.changeType)}</td>
                                <td class="p-3"><span class="px-2 py-1 rounded text-xs font-medium ${statusColors[r.status] || 'bg-gray-100'}">${this.getStatusLabel(r.status)}</span></td>
                                <td class="p-3">${safe(r.requestedBy || '—')}</td>
                                <td class="p-3">${this.formatDate(r.requestedAt || r.createdAt)}</td>
                                <td class="p-3"><button type="button" onclick="ChangeManagement.showRequestDetail('${safe(r.id)}')" class="btn-secondary btn-sm"><i class="fas fa-eye ml-1"></i> عرض</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    applyFilters() {
        this.loadChangeRequests();
    },

    showEmptyState(message) {
        return `
            <div class="empty-state">
                <i class="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">${message}</p>
            </div>
        `;
    },

    setupEventListeners() {
        // يمكن ربط أحداث إضافية هنا
    }
};

(function () {
    'use strict';
    try {
        if (typeof window !== 'undefined' && typeof ChangeManagement !== 'undefined') {
            window.ChangeManagement = ChangeManagement;
            if (typeof AppState !== 'undefined' && AppState.debugMode && typeof Utils !== 'undefined' && Utils.safeLog) {
                Utils.safeLog('✅ ChangeManagement module loaded and available on window.ChangeManagement');
            }
        }
    } catch (error) {
        if (typeof console !== 'undefined') console.error('خطأ في تصدير ChangeManagement:', error);
        if (typeof window !== 'undefined' && typeof ChangeManagement !== 'undefined') {
            try { window.ChangeManagement = ChangeManagement; } catch (e) {}
        }
    }
})();
