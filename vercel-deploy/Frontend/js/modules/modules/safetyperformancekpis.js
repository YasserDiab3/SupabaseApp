/**
 * SafetyPerformanceKPIs Module
 * ØªÙ… Ø§Ø³ØªØ®Ø±Ø§Ø¬Ù‡ Ù…Ù† app-modules.js
 */
// ===== Safety Performance KPIs Module (مؤشرات الأداء لإدارة السلامة) =====
const SafetyPerformanceKPIs = {
    filters: {
        period: 'monthly', // monthly, quarterly, yearly
        department: '',
        location: '',
        startDate: '',
        endDate: ''
    },
    kpiTargets: {},

    async load() {
        const section = document.getElementById('safety-performance-kpis-section');

        // التحقق من الصلاحيات - فقط للمدير
        const isAdmin = (() => {
            if (typeof Permissions?.isCurrentUserAdmin === 'function') {
                try {
                    return Permissions.isCurrentUserAdmin();
                } catch (error) {
                    if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                        Utils.safeWarn('⚠️ تعذر تحديد صلاحيات المستخدم عبر Permissions.isCurrentUserAdmin:', error);
                    } else {
                        console.warn('⚠️ تعذر تحديد صلاحيات المستخدم عبر Permissions.isCurrentUserAdmin:', error);
                    }
                }
            }
            return (AppState.currentUser?.role || '').toLowerCase() === 'admin';
        })();

        if (!isAdmin) {
            // لا تترك الواجهة فارغة (مهم لاختبار AppTester)
            if (section) {
                section.innerHTML = `
                    <div class="content-card">
                        <div class="card-body">
                            <div class="empty-state">
                                <i class="fas fa-lock text-4xl text-gray-300 mb-4"></i>
                                <p class="text-gray-500">ليس لديك صلاحية للوصول إلى هذا القسم</p>
                                <p class="text-sm text-gray-400 mt-2">سيتم تحويلك إلى لوحة التحكم</p>
                            </div>
                        </div>
                    </div>
                `;
            }
            Notification.error('ليس لديك صلاحية للوصول إلى هذا القسم');
            UI.showSection('dashboard');
            return;
        }

        if (!section) {
            if (typeof Utils !== 'undefined' && Utils.safeError) {
                Utils.safeError('قسم safety-performance-kpis-section غير موجود!');
            } else {
                console.error('قسم safety-performance-kpis-section غير موجود!');
            }
            return;
        }

        try {
            // Skeleton فوري قبل أي render قد يكون بطيئاً
            section.innerHTML = `
                <div class="section-header">
                    <div>
                        <h1 class="section-title">
                            <i class="fas fa-gauge-high ml-3"></i>
                            مؤشرات الأداء لإدارة السلامة
                        </h1>
                        <p class="section-subtitle">جاري التحميل...</p>
                    </div>
                </div>
                <div class="content-card mt-6">
                    <div class="card-body">
                        <div class="empty-state">
                            <div style="width: 300px; margin: 0 auto 16px;">
                                <div style="width: 100%; height: 6px; background: rgba(59, 130, 246, 0.2); border-radius: 3px; overflow: hidden;">
                                    <div style="height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb, #3b82f6); background-size: 200% 100%; border-radius: 3px; animation: loadingProgress 1.5s ease-in-out infinite;"></div>
                                </div>
                            </div>
                            <p class="text-gray-500">جاري تجهيز الواجهة...</p>
                        </div>
                    </div>
                </div>
            `;

            // تحميل الأهداف المحفوظة
            this.loadKPITargets();

            // تحميل المحتوى بشكل آمن مع timeout محسّن
            let content = '';
            try {
                const contentPromise = this.render();
                content = await Utils.promiseWithTimeout(
                    contentPromise,
                    10000,
                    () => new Error('Timeout: render took too long')
                );
            } catch (error) {
                if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                    Utils.safeWarn('⚠️ خطأ في تحميل محتوى الواجهة:', error);
                } else {
                    console.warn('⚠️ خطأ في تحميل محتوى الواجهة:', error);
                }
                // عرض محتوى افتراضي مع إمكانية إعادة المحاولة
                content = `
                    <div class="section-header">
                        <div>
                            <h1 class="section-title">
                                <i class="fas fa-gauge-high ml-3"></i>
                                مؤشرات الأداء لإدارة السلامة
                            </h1>
                        </div>
                    </div>
                    <div class="content-card mt-6">
                        <div class="card-body">
                            <div class="empty-state">
                                <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                                <p class="text-gray-500 mb-4">حدث خطأ في تحميل البيانات</p>
                                <button onclick="SafetyPerformanceKPIs.load()" class="btn-primary">
                                    <i class="fas fa-redo ml-2"></i>
                                    إعادة المحاولة
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }

            section.innerHTML = content;
            
            // تهيئة الأحداث بعد عرض الواجهة
            try {
                this.setupEventListeners();
                
                // تحديث KPIs فوراً بعد عرض الواجهة (حتى لو كانت البيانات فارغة)
                // هذا يضمن عدم بقاء الواجهة فارغة بعد التحميل
                try {
                    // استخدام setTimeout بسيط لضمان أن DOM جاهز
                    setTimeout(() => {
                        this.updateAllKPIs();
                    }, 0);
                } catch (error) {
                    Utils.safeWarn('⚠️ خطأ في updateAllKPIs الأولي:', error);
                }
                
                // تحديث KPIs بعد تحميل البيانات من Backend (للتحديث)
                setTimeout(() => {
                    try {
                        this.updateAllKPIs();
                    } catch (error) {
                        Utils.safeWarn('⚠️ خطأ في updateAllKPIs:', error);
                    }
                }, 100);
            } catch (error) {
                Utils.safeWarn('⚠️ خطأ في setupEventListeners:', error);
            }
        } catch (error) {
            Utils.safeError('❌ خطأ في تحميل مديول مؤشرات الأداء:', error);
            section.innerHTML = `
                <div class="section-header">
                    <div>
                        <h1 class="section-title">
                            <i class="fas fa-gauge-high ml-3"></i>
                            مؤشرات الأداء لإدارة السلامة
                        </h1>
                    </div>
                </div>
                <div class="mt-6">
                    <div class="content-card">
                        <div class="card-body">
                            <div class="empty-state">
                                <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                                <p class="text-gray-500 mb-2">حدث خطأ أثناء تحميل البيانات</p>
                                <p class="text-sm text-gray-400 mb-4">${error && error.message ? Utils.escapeHTML(error.message) : 'خطأ غير معروف'}</p>
                                <button onclick="SafetyPerformanceKPIs.load()" class="btn-primary">
                                    <i class="fas fa-redo ml-2"></i>
                                    إعادة المحاولة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    },

    async render() {
        return `
            <div class="section-header">
                <div class="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 class="section-title">
                            <i class="fas fa-gauge-high ml-3"></i>
                            ${(typeof i18n !== 'undefined' && i18n.translate) ? i18n.translate('kpis.title') : 'مؤشرات الأداء لإدارة السلامة (Safety Performance KPIs)'}
                        </h1>
                        <p class="section-subtitle">${(typeof i18n !== 'undefined' && i18n.translate) ? i18n.translate('kpis.subtitle') : 'تتبع وتحليل مؤشرات الأداء الرئيسية للسلامة عبر كل الإدارات والمواقع'}</p>
                    </div>
                    <div class="flex gap-2">
                        <button id="kpis-export-excel-btn" class="btn-success">
                            <i class="fas fa-file-excel ml-2"></i>
                            تصدير Excel
                        </button>
                        <button id="kpis-export-pdf-btn" class="btn-secondary">
                            <i class="fas fa-file-pdf ml-2"></i>
                            تصدير PDF
                        </button>
                        <button id="kpis-settings-btn" class="btn-primary">
                            <i class="fas fa-cog ml-2"></i>
                            إعدادات الأهداف
                        </button>
                    </div>
                </div>
            </div>

            <!-- Filters -->
            <div class="content-card mt-6">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-filter ml-2"></i>
                        التصفية والبحث
                    </h2>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">الفترة الزمنية</label>
                            <select id="kpi-filter-period" class="form-input">
                                <option value="monthly">شهري</option>
                                <option value="quarterly">ربع سنوي</option>
                                <option value="yearly">سنوي</option>
                                <option value="custom">مخصص</option>
                            </select>
                        </div>
                        <div id="kpi-custom-dates" class="hidden">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">من تاريخ</label>
                            <input type="date" id="kpi-filter-start-date" class="form-input">
                        </div>
                        <div id="kpi-custom-dates-end" class="hidden">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">إلى تاريخ</label>
                            <input type="date" id="kpi-filter-end-date" class="form-input">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">الإدارة</label>
                            <select id="kpi-filter-department" class="form-input">
                                <option value="">جميع الإدارات</option>
                                ${this.getDepartmentOptions()}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">الموقع</label>
                            <select id="kpi-filter-location" class="form-input">
                                <option value="">جميع المواقع</option>
                                ${this.getLocationOptions()}
                            </select>
                        </div>
                    </div>
                    <div class="mt-4 flex gap-2">
                        <button id="kpi-apply-filters" class="btn-primary">
                            <i class="fas fa-search ml-2"></i>
                            تطبيق التصفية
                        </button>
                        <button id="kpi-reset-filters" class="btn-secondary">
                            <i class="fas fa-redo ml-2"></i>
                            إعادة تعيين
                        </button>
                    </div>
                </div>
            </div>

            <!-- Leading Indicators Section -->
            <div class="mt-6">
                <div class="content-card">
                    <div class="card-header bg-gradient-to-r from-green-50 to-emerald-50 border-b-4 border-green-500">
                        <h2 class="card-title text-green-800">
                            <i class="fas fa-arrow-trend-up ml-2"></i>
                            المؤشرات الاستباقية (Leading Indicators)
                        </h2>
                        <p class="text-sm text-green-700 mt-2">مؤشرات تقيس أداء الوقاية والتحكم قبل وقوع الحوادث</p>
                    </div>
                    <div class="card-body">
                        <div id="leading-indicators-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            ${this.renderLeadingIndicators()}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lagging Indicators Section -->
            <div class="mt-6">
                <div class="content-card">
                    <div class="card-header bg-gradient-to-r from-red-50 to-rose-50 border-b-4 border-red-500">
                        <h2 class="card-title text-red-800">
                            <i class="fas fa-arrow-trend-down ml-2"></i>
                            المؤشرات التراجعية (Lagging Indicators)
                        </h2>
                        <p class="text-sm text-red-700 mt-2">مؤشرات تقيس النتائج الفعلية لما حدث</p>
                    </div>
                    <div class="card-body">
                        <div id="lagging-indicators-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            ${this.renderLaggingIndicators()}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="mt-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-chart-bar ml-2"></i>
                    الرسوم البيانية والتحليلات
                </h2>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="content-card">
                        <div class="card-header bg-gradient-to-r from-red-50 to-rose-50">
                            <h2 class="card-title text-red-800">
                                <i class="fas fa-chart-bar ml-2"></i>
                                الحوادث والإصابات الشهرية
                            </h2>
                        </div>
                        <div class="card-body">
                            <div id="incidents-chart-container" style="height: 300px;"></div>
                        </div>
                    </div>
                    <div class="content-card">
                        <div class="card-header bg-gradient-to-r from-blue-50 to-indigo-50">
                            <h2 class="card-title text-blue-800">
                                <i class="fas fa-chart-pie ml-2"></i>
                                توزيع الحوادث حسب الإدارة
                            </h2>
                        </div>
                        <div class="card-body">
                            <div id="department-chart-container" style="height: 300px;"></div>
                        </div>
                    </div>
                    <div class="content-card">
                        <div class="card-header bg-gradient-to-r from-purple-50 to-pink-50">
                            <h2 class="card-title text-purple-800">
                                <i class="fas fa-chart-line ml-2"></i>
                                معدل LTIFR عبر الزمن
                            </h2>
                        </div>
                        <div class="card-body">
                            <div id="trir-chart-container" style="height: 300px;"></div>
                        </div>
                    </div>
                    <div class="content-card">
                        <div class="card-header bg-gradient-to-r from-green-50 to-emerald-50">
                            <h2 class="card-title text-green-800">
                                <i class="fas fa-chart-area ml-2"></i>
                                معدل الالتزام بالتدريب
                            </h2>
                        </div>
                        <div class="card-body">
                            <div id="training-chart-container" style="height: 300px;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Department Comparison -->
            <div class="content-card mt-6">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-balance-scale ml-2"></i>
                        مقارنة بين الإدارات / المواقع
                    </h2>
                </div>
                <div class="card-body">
                    <div id="department-comparison-container" style="height: 400px;"></div>
                </div>
            </div>

            <!-- Heatmap -->
            <div class="content-card mt-6">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-th ml-2"></i>
                        خريطة الحرارة - أداء السلامة حسب الإدارة والموقع
                    </h2>
                </div>
                <div class="card-body">
                    <div id="heatmap-container"></div>
                </div>
            </div>
        `;
    },

    renderLeadingIndicators() {
        return `
            ${this.renderKPICard('inspection-tours', 'الجولات التفتيشية المنفذة', 'inspection-tours', 'fa-walking', 'blue', 'جولة')}
            ${this.renderKPICard('observations-recorded', 'الملاحظات المسجلة والمعالجة', 'observations', 'fa-clipboard-list', 'indigo', 'ملاحظة')}
            ${this.renderKPICard('corrective-actions-closure', 'نسبة إغلاق الإجراءات التصحيحية', 'actions-closure', 'fa-check-double', 'green', '%')}
            ${this.renderKPICard('training-courses', 'الدورات التدريبية المنفذة', 'training-courses', 'fa-graduation-cap', 'teal', 'دورة')}
            ${this.renderKPICard('training-attendance', 'نسبة حضور الموظفين للتدريب', 'training-attendance', 'fa-users', 'cyan', '%')}
            ${this.renderKPICard('ptw-approved', 'تصاريح العمل المعتمدة والمنفذة', 'ptw-approved', 'fa-id-card', 'purple', 'تصريح')}
            ${this.renderKPICard('ppe-compliance', 'نسبة الالتزام باستخدام معدات الوقاية', 'ppe-compliance', 'fa-hard-hat', 'orange', '%')}
            ${this.renderKPICard('periodic-inspections-on-time', 'الفحوصات الدورية المنجزة في الموعد', 'inspections-on-time', 'fa-calendar-check', 'emerald', 'فحص')}
            ${this.renderKPICard('safety-meetings', 'عدد الاجتماعات والتوعيات الخاصة بالسلامة', 'safety-meetings', 'fa-handshake', 'sky', 'اجتماع')}
        `;
    },

    renderLaggingIndicators() {
        return `
            ${this.renderKPICard('total-injuries', 'عدد الإصابات المسجلة', 'injuries', 'fa-user-injured', 'red', 'إصابة')}
            ${this.renderKPICard('lti-count', 'عدد الإصابات المؤدية لتوقف عن العمل (LTI)', 'lti', 'fa-bed', 'red', 'إصابة')}
            ${this.renderKPICard('ltifr', 'معدل تكرار الإصابات (LTIFR)', 'ltifr', 'fa-sync-alt', 'orange', '')}
            ${this.renderKPICard('severity-rate', 'معدل شدة الإصابات', 'severity', 'fa-exclamation-circle', 'red', '%')}
            ${this.renderKPICard('near-miss-count', 'عدد الحوادث الوشيكة المسجلة', 'nearmiss-count', 'fa-eye', 'yellow', 'حادث')}
            ${this.renderKPICard('fire-incidents', 'عدد الحرائق أو الحوادث في معدات الإطفاء', 'fire-incidents', 'fa-fire', 'red', 'حادث')}
            ${this.renderKPICard('lost-days', 'عدد الأيام المهدورة بسبب الإصابات', 'lost-days', 'fa-calendar-times', 'rose', 'يوم')}
            ${this.renderKPICard('accident-cost', 'تكلفة الحوادث (مباشرة / غير مباشرة)', 'accident-cost', 'fa-dollar-sign', 'red', 'ريال')}
        `;
    },

    renderKPICard(id, label, type, icon, color, defaultUnit = '') {
        // Determine status color based on indicator type
        const statusClass = color.includes('red') || color.includes('rose') ? 'status-danger' :
            color.includes('orange') || color.includes('yellow') ? 'status-warning' : 'status-success';

        return `
            <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-${color}-500 hover:shadow-xl transition-all transform hover:scale-105" style="position: relative; overflow: hidden;">
                <div class="absolute top-0 right-0 w-20 h-20 bg-${color}-100 opacity-20 rounded-bl-full"></div>
                <div class="relative z-10">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="bg-${color}-100 p-3 rounded-lg shadow-sm">
                                <i class="fas ${icon} text-${color}-600 text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-sm font-bold text-gray-800">${label}</h3>
                                <p class="text-xs text-gray-500 mt-1" id="${id}-period">هذا الشهر</p>
                            </div>
                        </div>
                        <div class="status-badge ${statusClass}" id="${id}-status" style="display: none;">
                            <i class="fas fa-circle text-xs"></i>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="flex items-baseline gap-2">
                            <span class="text-4xl font-bold text-gray-900" id="${id}-value">-</span>
                            <span class="text-lg text-gray-600" id="${id}-unit">${defaultUnit}</span>
                        </div>
                        <div class="mt-3 flex items-center gap-2">
                            <span class="text-xs text-gray-600">الهدف:</span>
                            <span class="text-xs font-bold text-gray-800" id="${id}-target">-</span>
                        </div>
                        <div class="mt-3">
                            <div class="flex items-center justify-between text-xs mb-1">
                                <span class="text-gray-600 font-semibold">نسبة الإنجاز</span>
                                <span class="font-bold text-gray-800" id="${id}-progress">-</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5 shadow-inner">
                                <div class="bg-${color}-500 h-2.5 rounded-full transition-all duration-500 shadow-sm" id="${id}-progress-bar" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="mt-3 flex items-center gap-2 text-xs" id="${id}-trend">
                            <i class="fas fa-minus text-gray-400"></i>
                            <span class="text-gray-500">لا يوجد تغيير</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getDepartmentOptions() {
        const departments = new Set();
        const data = AppState.appData;

        // من الحوادث
        (data.incidents || []).forEach(inc => {
            if (inc.affectedDepartment) departments.add(inc.affectedDepartment);
        });

        // من الملاحظات
        (data.dailyObservations || []).forEach(obs => {
            if (obs.department) departments.add(obs.department);
        });

        // من إعدادات الشركة
        const settingsDepts = AppState.companySettings?.formDepartments || [];
        settingsDepts.forEach(dept => departments.add(dept));

        return Array.from(departments).sort().map(dept =>
            `<option value="${Utils.escapeHTML(dept)}">${Utils.escapeHTML(dept)}</option>`
        ).join('');
    },

    getLocationOptions() {
        const locations = new Set();
        const data = AppState.appData;

        (data.incidents || []).forEach(inc => {
            if (inc.location) locations.add(inc.location);
        });

        (data.nearmiss || []).forEach(nm => {
            if (nm.location) locations.add(nm.location);
        });

        return Array.from(locations).sort().map(loc =>
            `<option value="${Utils.escapeHTML(loc)}">${Utils.escapeHTML(loc)}</option>`
        ).join('');
    },

    setupEventListeners() {
        // Filters
        const periodSelect = document.getElementById('kpi-filter-period');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                const customDates = document.getElementById('kpi-custom-dates');
                const customDatesEnd = document.getElementById('kpi-custom-dates-end');
                if (e.target.value === 'custom') {
                    customDates?.classList.remove('hidden');
                    customDatesEnd?.classList.remove('hidden');
                } else {
                    customDates?.classList.add('hidden');
                    customDatesEnd?.classList.add('hidden');
                }
            });
        }

        document.getElementById('kpi-apply-filters')?.addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('kpi-reset-filters')?.addEventListener('click', () => {
            this.resetFilters();
        });

        // Export buttons
        document.getElementById('kpis-export-excel-btn')?.addEventListener('click', () => {
            this.exportToExcel();
        });

        document.getElementById('kpis-export-pdf-btn')?.addEventListener('click', () => {
            this.exportToPDF();
        });

        // Settings button
        document.getElementById('kpis-settings-btn')?.addEventListener('click', () => {
            this.showSettingsModal();
        });
    },

    applyFilters() {
        const period = document.getElementById('kpi-filter-period')?.value || 'monthly';
        const department = document.getElementById('kpi-filter-department')?.value || '';
        const location = document.getElementById('kpi-filter-location')?.value || '';
        const startDate = document.getElementById('kpi-filter-start-date')?.value || '';
        const endDate = document.getElementById('kpi-filter-end-date')?.value || '';

        this.filters = { period, department, location, startDate, endDate };
        this.updateAllKPIs();
    },

    resetFilters() {
        this.filters = {
            period: 'monthly',
            department: '',
            location: '',
            startDate: '',
            endDate: ''
        };

        document.getElementById('kpi-filter-period').value = 'monthly';
        document.getElementById('kpi-filter-department').value = '';
        document.getElementById('kpi-filter-location').value = '';
        document.getElementById('kpi-filter-start-date').value = '';
        document.getElementById('kpi-filter-end-date').value = '';
        document.getElementById('kpi-custom-dates')?.classList.add('hidden');
        document.getElementById('kpi-custom-dates-end')?.classList.add('hidden');

        this.updateAllKPIs();
    },

    getDateRange() {
        const now = new Date();
        let start, end;

        if (this.filters.period === 'custom' && this.filters.startDate && this.filters.endDate) {
            start = new Date(this.filters.startDate);
            end = new Date(this.filters.endDate);
            end.setHours(23, 59, 59, 999);
        } else if (this.filters.period === 'yearly') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        } else if (this.filters.period === 'quarterly') {
            const quarter = Math.floor(now.getMonth() / 3);
            start = new Date(now.getFullYear(), quarter * 3, 1);
            end = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
        } else { // monthly
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }

        return { start, end };
    },

    updateAllKPIs() {
        const { start, end } = this.getDateRange();
        const data = this.getFilteredData(start, end);

        // Update Leading Indicators
        const inspectionTours = this.calculateInspectionTours(data);
        this.updateKPI('inspection-tours', inspectionTours.completed, 'جولة', 'inspection-tours', inspectionTours.planned);

        const observations = this.calculateObservationsRecorded(data);
        this.updateKPI('observations-recorded', observations.total, 'ملاحظة', 'observations', null, observations.processed);

        const actionsClosure = this.calculateCorrectiveActionsClosure(data);
        this.updateKPI('corrective-actions-closure', actionsClosure.percentage, '%', 'actions-closure', 100);

        const trainingCourses = this.calculateTrainingCourses(data);
        this.updateKPI('training-courses', trainingCourses.completed, 'دورة', 'training-courses', trainingCourses.total);

        const trainingAttendance = this.calculateTrainingAttendance(data);
        this.updateKPI('training-attendance', trainingAttendance.percentage, '%', 'training-attendance', 100);

        const ptwApproved = this.calculatePTWApproved(data);
        this.updateKPI('ptw-approved', ptwApproved.approved, 'تصريح', 'ptw-approved', ptwApproved.total);

        const ppeCompliance = this.calculatePPECompliance(data);
        this.updateKPI('ppe-compliance', ppeCompliance.percentage, '%', 'ppe-compliance', 100);

        const inspectionsOnTime = this.calculatePeriodicInspectionsOnTime(data);
        this.updateKPI('periodic-inspections-on-time', inspectionsOnTime.onTime, 'فحص', 'inspections-on-time', inspectionsOnTime.total);

        const safetyMeetings = this.calculateSafetyMeetings(data);
        this.updateKPI('safety-meetings', safetyMeetings, 'اجتماع', 'safety-meetings');

        // Update Lagging Indicators
        const totalInjuries = this.calculateTotalInjuries(data);
        this.updateKPI('total-injuries', totalInjuries, 'إصابة', 'injuries');

        const ltiCount = this.calculateLTICount(data);
        this.updateKPI('lti-count', ltiCount, 'إصابة', 'lti');

        const ltifr = this.calculateLTIFR(data);
        this.updateKPI('ltifr', ltifr, '', 'ltifr');

        const severityRate = this.calculateSeverityRate(data);
        this.updateKPI('severity-rate', severityRate, '%', 'severity');

        const nearMissCount = this.calculateNearMissCount(data);
        this.updateKPI('near-miss-count', nearMissCount, 'حادث', 'nearmiss-count');

        const fireIncidents = this.calculateFireIncidents(data);
        this.updateKPI('fire-incidents', fireIncidents, 'حادث', 'fire-incidents');

        const lostDays = this.calculateLostDays(data);
        this.updateKPI('lost-days', lostDays, 'يوم', 'lost-days');

        const accidentCost = this.calculateAccidentCost(data);
        this.updateKPI('accident-cost', parseFloat(accidentCost).toLocaleString('ar-SA'), 'ريال', 'accident-cost');

        // Update charts
        this.updateCharts(data, start, end);
    },

    getFilteredData(start, end) {
        const data = AppState.appData;
        const deptFilter = this.filters.department;
        const locFilter = this.filters.location;

        const filterByDateDeptLoc = (item, dateField, deptField = 'department', locField = 'location') => {
            const itemDate = new Date(item[dateField] || item.date || item.createdAt);
            const matchDate = itemDate >= start && itemDate <= end;
            const matchDept = !deptFilter || (item[deptField] || item.affectedDepartment || '').includes(deptFilter);
            const matchLoc = !locFilter || (item[locField] || item.location || '').includes(locFilter);
            return matchDate && matchDept && matchLoc;
        };

        return {
            incidents: (data.incidents || []).filter(inc => filterByDateDeptLoc(inc, 'date', 'affectedDepartment', 'location')),
            nearmiss: (data.nearmiss || []).filter(nm => filterByDateDeptLoc(nm, 'date', 'department', 'location')),
            dailyObservations: (data.dailyObservations || []).filter(obs => filterByDateDeptLoc(obs, 'date', 'department')),
            training: (data.training || []).filter(tr => {
                const trDate = new Date(tr.date || tr.startDate || tr.createdAt);
                return trDate >= start && trDate <= end;
            }),
            ptw: (data.ptw || []).filter(p => {
                const pDate = new Date(p.startDate || p.createdAt);
                return pDate >= start && pDate <= end;
            }),
            periodicInspectionRecords: (data.periodicInspectionRecords || []).filter(rec => {
                const recDate = new Date(rec.inspectionDate || rec.createdAt);
                return recDate >= start && recDate <= end;
            }),
            periodicInspectionSchedules: (data.periodicInspectionSchedules || []).filter(sch => {
                const schDate = new Date(sch.scheduledDate || sch.createdAt);
                return schDate >= start && schDate <= end;
            }),
            fireEquipmentInspections: (data.fireEquipmentInspections || []).filter(ins => {
                const insDate = new Date(ins.inspectionDate || ins.createdAt);
                return insDate >= start && insDate <= end;
            }),
            actionTrackingRegister: (data.actionTrackingRegister || []).filter(act => {
                const actDate = new Date(act.dueDate || act.createdAt);
                return actDate >= start && actDate <= end;
            }),
            hseCorrectiveActions: (data.hseCorrectiveActions || []).filter(act => {
                const actDate = new Date(act.date || act.createdAt);
                return actDate >= start && actDate <= end;
            }),
            clinicRecords: (data.clinicRecords || []).filter(rec => {
                const recDate = new Date(rec.date || rec.visitDate || rec.createdAt);
                return recDate >= start && recDate <= end;
            }),
            medicalInjuries: (data.medicalInjuries || []).filter(inj => {
                const injDate = new Date(inj.date || inj.injuryDate || inj.createdAt);
                return injDate >= start && injDate <= end;
            }),
            ppeRecords: (data.ppe || []).filter(ppe => {
                const ppeDate = new Date(ppe.date || ppe.issueDate || ppe.createdAt);
                return ppeDate >= start && ppeDate <= end;
            }),
            safetyMeetings: (data.safetyMeetings || []).filter(meeting => {
                const meetingDate = new Date(meeting.date || meeting.meetingDate || meeting.createdAt);
                return meetingDate >= start && meetingDate <= end;
            }),
            inspectionTours: (data.inspectionTours || []).filter(tour => {
                const tourDate = new Date(tour.date || tour.tourDate || tour.createdAt);
                return tourDate >= start && tourDate <= end;
            }),
            safetyBudgetTransactions: (data.safetyBudgetTransactions || []).filter(tr => {
                const trDate = new Date(tr.date || tr.createdAt);
                return trDate >= start && trDate <= end;
            })
        };
    },

    calculateIncidents(data) {
        return data.incidents.length;
    },

    calculateNearMiss(data) {
        return data.nearmiss.length + data.dailyObservations.length;
    },

    calculateTRIR(data) {
        const employees = AppState.appData.employees || [];
        const totalEmployees = employees.filter(e => e && e.active !== false).length || 200;
        const hoursPerDay = 8;
        const workDaysPerMonth = 22;
        const monthsPerYear = 12;
        const totalWorkHours = totalEmployees * hoursPerDay * workDaysPerMonth * (this.filters.period === 'yearly' ? 12 : this.filters.period === 'quarterly' ? 3 : 1);

        const recordableInjuries = data.incidents.length;
        const trir = totalWorkHours > 0 ? ((recordableInjuries * 200000) / totalWorkHours) : 0;
        return trir.toFixed(2);
    },

    calculateSeverityRate(data) {
        const highSeverity = data.incidents.filter(inc =>
            (inc.severity || '').toLowerCase().includes('عالية') ||
            (inc.severity || '').toLowerCase().includes('high')
        ).length;
        const total = data.incidents.length;
        return total > 0 ? ((highSeverity / total) * 100).toFixed(1) : '0.0';
    },

    calculateTrainingCompletion(data) {
        const completed = data.training.filter(tr =>
            (tr.status || '').includes('مكتمل') || (tr.status || '').includes('completed')
        ).length;
        const total = data.training.length;
        return total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';
    },

    calculateCorrectiveActions(data) {
        const closed = data.actionTrackingRegister.filter(act =>
            (act.status || '').includes('مغلق') || (act.status || '').includes('مكتمل') ||
            (act.status || '').includes('closed') || (act.status || '').includes('completed')
        ).length;
        const total = data.actionTrackingRegister.length;
        return total > 0 ? ((closed / total) * 100).toFixed(1) : '0.0';
    },

    calculatePTWCompliance(data) {
        const compliant = data.ptw.filter(p =>
            (p.status || '').includes('موافق') || (p.status || '').includes('approved')
        ).length;
        const total = data.ptw.length;
        return total > 0 ? ((compliant / total) * 100).toFixed(1) : '0.0';
    },

    calculatePeriodicInspections(data) {
        const completed = data.periodicInspectionRecords.filter(rec =>
            (rec.status || '').includes('مكتمل') || (rec.status || '').includes('completed')
        ).length;
        const total = data.periodicInspectionRecords.length;
        return total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';
    },

    calculateFireEquipment(data) {
        const completed = data.fireEquipmentInspections.filter(ins =>
            (ins.status || '').includes('مكتمل') || (ins.status || '').includes('completed')
        ).length;
        const total = data.fireEquipmentInspections.length;
        return total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';
    },

    calculateSafetyBudget(data) {
        const totalSpent = data.safetyBudgetTransactions.reduce((sum, tr) =>
            sum + (parseFloat(tr.amount) || 0), 0
        );
        const budgets = AppState.appData.safetyBudgets || [];
        const totalBudget = budgets.reduce((sum, bud) =>
            sum + (parseFloat(bud.amount) || 0), 0
        );
        return totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0.0';
    },

    calculateImprovementRate(data) {
        // مقارنة مع الفترة السابقة
        const { start, end } = this.getDateRange();
        const periodDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - periodDays);
        const prevEnd = new Date(start);
        prevEnd.setDate(prevEnd.getDate() - 1);

        const prevData = this.getFilteredData(prevStart, prevEnd);
        const currentIncidents = data.incidents.length;
        const prevIncidents = prevData.incidents.length;

        if (prevIncidents === 0) return currentIncidents === 0 ? '0.0' : '-100.0';
        const improvement = ((prevIncidents - currentIncidents) / prevIncidents) * 100;
        return improvement.toFixed(1);
    },

    calculateComplianceRate(data) {
        const totalItems = data.incidents.length + data.nearmiss.length;
        const resolved = data.incidents.filter(i =>
            (i.status || '').includes('مغلق') || (i.status || '').includes('closed')
        ).length + data.nearmiss.filter(n =>
            (n.status || '').includes('مغلق') || (n.status || '').includes('closed')
        ).length;
        return totalItems > 0 ? ((resolved / totalItems) * 100).toFixed(1) : '100.0';
    },

    // ===== Leading Indicators Calculations =====

    calculateInspectionTours(data) {
        // الجولات التفتيشية المنفذة مقابل المخطط
        const completed = (data.inspectionTours || []).filter(tour =>
            (tour.status || '').includes('مكتمل') || (tour.status || '').includes('completed')
        ).length;
        const planned = (data.inspectionTours || []).length;
        return { completed, planned, percentage: planned > 0 ? ((completed / planned) * 100).toFixed(1) : '0.0' };
    },

    calculateObservationsRecorded(data) {
        // الملاحظات المسجلة والمعالجة
        const total = (data.dailyObservations || []).length;
        const processed = (data.dailyObservations || []).filter(obs =>
            (obs.status || '').includes('معالج') || (obs.status || '').includes('مغلق') ||
            (obs.status || '').includes('processed') || (obs.status || '').includes('closed')
        ).length;
        return { total, processed, percentage: total > 0 ? ((processed / total) * 100).toFixed(1) : '0.0' };
    },

    calculateCorrectiveActionsClosure(data) {
        // نسبة إغلاق الإجراءات التصحيحية خلال الوقت المحدد
        const allActions = [...(data.actionTrackingRegister || []), ...(data.hseCorrectiveActions || [])];
        const closed = allActions.filter(act => {
            const isClosed = (act.status || '').includes('مغلق') || (act.status || '').includes('مكتمل') ||
                (act.status || '').includes('closed') || (act.status || '').includes('completed');
            if (!isClosed) return false;
            // Check if closed within due date
            const dueDate = new Date(act.dueDate || act.targetDate || act.createdAt);
            const closedDate = new Date(act.closedDate || act.completedDate || act.updatedAt || new Date());
            return closedDate <= dueDate;
        }).length;
        const total = allActions.length;
        return { closed, total, percentage: total > 0 ? ((closed / total) * 100).toFixed(1) : '0.0' };
    },

    calculateTrainingCourses(data) {
        // عدد الدورات التدريبية المنفذة مقابل الخطة
        const completed = (data.training || []).filter(tr =>
            (tr.status || '').includes('مكتمل') || (tr.status || '').includes('completed')
        ).length;
        const total = (data.training || []).length;
        return { completed, total, percentage: total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0' };
    },

    calculateTrainingAttendance(data) {
        // نسبة حضور الموظفين للتدريب
        const trainings = data.training || [];
        let totalAttendees = 0;
        let totalExpected = 0;

        trainings.forEach(tr => {
            const expected = parseInt(tr.expectedAttendees || tr.attendeesCount || 0);
            const actual = parseInt(tr.actualAttendees || (tr.attendees ? tr.attendees.length : 0));
            totalExpected += expected;
            totalAttendees += actual;
        });

        return {
            attendees: totalAttendees,
            expected: totalExpected,
            percentage: totalExpected > 0 ? ((totalAttendees / totalExpected) * 100).toFixed(1) : '0.0'
        };
    },

    calculatePTWApproved(data) {
        // عدد تصاريح العمل المعتمدة والمنفذة بأمان
        const approved = (data.ptw || []).filter(p =>
            (p.status || '').includes('موافق') || (p.status || '').includes('approved') ||
            (p.status || '').includes('مكتمل') || (p.status || '').includes('completed')
        ).length;
        const total = (data.ptw || []).length;
        return { approved, total, percentage: total > 0 ? ((approved / total) * 100).toFixed(1) : '0.0' };
    },

    calculatePPECompliance(data) {
        // نسبة الالتزام باستخدام معدات الوقاية الشخصية (PPE Compliance)
        const ppeRecords = data.ppeRecords || [];
        const compliant = ppeRecords.filter(ppe =>
            (ppe.complianceStatus || '').includes('متوافق') ||
            (ppe.complianceStatus || '').includes('compliant') ||
            (ppe.status || '').includes('مستخدم') || (ppe.status || '').includes('used')
        ).length;
        const total = ppeRecords.length;
        return { compliant, total, percentage: total > 0 ? ((compliant / total) * 100).toFixed(1) : '0.0' };
    },

    calculatePeriodicInspectionsOnTime(data) {
        // عدد الفحوصات الدورية المنجزة في موعدها
        const records = data.periodicInspectionRecords || [];
        const schedules = data.periodicInspectionSchedules || [];

        const onTime = records.filter(rec => {
            const inspectionDate = new Date(rec.inspectionDate || rec.date);
            const schedule = schedules.find(sch => sch.id === rec.scheduleId || sch.categoryId === rec.categoryId);
            if (!schedule) return false;
            const dueDate = new Date(schedule.scheduledDate || schedule.dueDate);
            return inspectionDate <= dueDate;
        }).length;

        const total = records.length;
        return { onTime, total, percentage: total > 0 ? ((onTime / total) * 100).toFixed(1) : '0.0' };
    },

    calculateSafetyMeetings(data) {
        // عدد الاجتماعات والتوعيات الخاصة بالسلامة
        const meetings = data.safetyMeetings || [];
        return meetings.length;
    },

    // ===== Lagging Indicators Calculations =====

    calculateTotalInjuries(data) {
        // عدد الإصابات المسجلة
        const injuries = [...(data.incidents || []).filter(inc =>
            (inc.type || '').includes('إصابة') || (inc.type || '').includes('injury')
        ), ...(data.medicalInjuries || []), ...(data.clinicRecords || []).filter(rec =>
            (rec.type || '').includes('إصابة') || (rec.type || '').includes('injury')
        )];
        return injuries.length;
    },

    calculateLTICount(data) {
        // عدد الإصابات المؤدية لتوقف عن العمل (LTI - Lost Time Injury)
        const lti = [...(data.incidents || []), ...(data.medicalInjuries || [])].filter(item => {
            const lostDays = parseInt(item.lostDays || item.daysLost || item.timeOffWork || 0);
            const isLTI = (item.severity || '').includes('LTI') ||
                (item.type || '').includes('LTI') ||
                lostDays > 0 ||
                (item.result || '').includes('توقف') ||
                (item.result || '').includes('lost time');
            return isLTI;
        });
        return lti.length;
    },

    calculateLTIFR(data) {
        // معدل تكرار الإصابات (LTIFR - Lost Time Injury Frequency Rate)
        const employees = AppState.appData.employees || [];
        const totalEmployees = employees.filter(e => e && e.active !== false).length || 200;
        const hoursPerDay = 8;
        const workDaysPerMonth = 22;
        const periodMonths = this.filters.period === 'yearly' ? 12 : this.filters.period === 'quarterly' ? 3 : 1;
        const totalWorkHours = totalEmployees * hoursPerDay * workDaysPerMonth * periodMonths;

        const ltiCount = this.calculateLTICount(data);
        const ltifr = totalWorkHours > 0 ? ((ltiCount * 1000000) / totalWorkHours) : 0;
        return ltifr.toFixed(2);
    },

    calculateSeverityRate(data) {
        // معدل شدة الإصابات (Severity Rate)
        const incidents = [...(data.incidents || []), ...(data.medicalInjuries || [])];
        const totalLostDays = incidents.reduce((sum, inc) => {
            return sum + (parseInt(inc.lostDays || inc.daysLost || inc.timeOffWork || 0));
        }, 0);
        const totalInjuries = incidents.length;
        return totalInjuries > 0 ? (totalLostDays / totalInjuries).toFixed(1) : '0.0';
    },

    calculateNearMissCount(data) {
        // عدد الحوادث الوشيكة المسجلة
        return (data.nearmiss || []).length;
    },

    calculateFireIncidents(data) {
        // عدد الحرائق أو الحوادث في معدات الإطفاء
        const fireIncidents = [...(data.incidents || []).filter(inc =>
            (inc.type || '').includes('حريق') || (inc.type || '').includes('fire') ||
            (inc.description || '').includes('حريق') || (inc.description || '').includes('fire')
        ), ...(data.fireEquipmentInspections || []).filter(ins =>
            (ins.status || '').includes('عطل') || (ins.status || '').includes('fault') ||
            (ins.findings || '').includes('عطل') || (ins.findings || '').includes('fault')
        )];
        return fireIncidents.length;
    },

    calculateLostDays(data) {
        // عدد الأيام المهدورة بسبب الإصابات
        const incidents = [...(data.incidents || []), ...(data.medicalInjuries || [])];
        const totalLostDays = incidents.reduce((sum, inc) => {
            return sum + (parseInt(inc.lostDays || inc.daysLost || inc.timeOffWork || 0));
        }, 0);
        return totalLostDays;
    },

    calculateAccidentCost(data) {
        // تكلفة الحوادث (مباشرة / غير مباشرة)
        const incidents = data.incidents || [];
        const totalCost = incidents.reduce((sum, inc) => {
            const directCost = parseFloat(inc.directCost || inc.cost || 0);
            const indirectCost = parseFloat(inc.indirectCost || 0);
            return sum + directCost + indirectCost;
        }, 0);
        return totalCost.toFixed(2);
    },

    updateKPI(id, value, unit, type, targetValue = null, additionalInfo = null) {
        const valueEl = document.getElementById(`${id}-value`);
        const unitEl = document.getElementById(`${id}-unit`);
        const targetEl = document.getElementById(`${id}-target`);
        const progressEl = document.getElementById(`${id}-progress`);
        const progressBarEl = document.getElementById(`${id}-progress-bar`);
        const trendEl = document.getElementById(`${id}-trend`);
        const statusEl = document.getElementById(`${id}-status`);

        if (valueEl) {
            const numValue = parseFloat(value) || 0;
            valueEl.textContent = numValue.toLocaleString('ar-SA');
        }
        if (unitEl && unit) unitEl.textContent = unit;

        // Use provided target or get from saved targets
        const target = targetValue !== null ? targetValue : (this.getKPITarget(type) || 0);
        if (targetEl) {
            if (target > 0) {
                targetEl.textContent = target.toLocaleString('ar-SA') + (unit || '');
            } else {
                targetEl.textContent = additionalInfo ? `${additionalInfo} / ${value}` : '-';
            }
        }

        const numValue = parseFloat(value) || 0;
        let progress = 0;
        let statusColor = 'gray';

        // For percentage-based KPIs, progress is the value itself
        if (unit === '%' && target === 100) {
            progress = numValue;
            statusColor = numValue >= 90 ? 'green' : numValue >= 70 ? 'yellow' : 'red';
        } else if (target > 0) {
            // For count-based KPIs, calculate progress against target
            progress = Math.min((numValue / target) * 100, 100);
            statusColor = progress >= 100 ? 'green' : progress >= 75 ? 'yellow' : 'red';
        } else {
            // For lagging indicators (lower is better), use inverse logic
            if (type.includes('injuries') || type.includes('lti') || type.includes('fire') || type.includes('cost') || type.includes('lost-days')) {
                statusColor = numValue === 0 ? 'green' : numValue <= 2 ? 'yellow' : 'red';
            }
        }

        if (progressEl) progressEl.textContent = progress.toFixed(1) + '%';
        if (progressBarEl) {
            progressBarEl.style.width = progress + '%';
            const colorClass = statusColor === 'green' ? 'bg-green-500' :
                statusColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500';
            progressBarEl.className = `h-2.5 rounded-full transition-all duration-500 shadow-sm ${colorClass}`;
        }

        // Update status badge
        if (statusEl) {
            statusEl.style.display = 'block';
            statusEl.className = `status-badge ${statusColor === 'green' ? 'status-success' : statusColor === 'yellow' ? 'status-warning' : 'status-danger'}`;
        }

        // Trend calculation (simplified - compare with previous period)
        const trend = this.calculateTrend(type, numValue);
        if (trendEl) {
            if (trend > 0) {
                const trendText = type.includes('injuries') || type.includes('lti') || type.includes('fire') || type.includes('cost') || type.includes('lost-days')
                    ? 'تراجع' : 'تحسن';
                const trendColor = type.includes('injuries') || type.includes('lti') || type.includes('fire') || type.includes('cost') || type.includes('lost-days')
                    ? 'text-red-500' : 'text-green-500';
                trendEl.innerHTML = `<i class="fas fa-arrow-${type.includes('injuries') || type.includes('lti') || type.includes('fire') || type.includes('cost') || type.includes('lost-days') ? 'down' : 'up'} ${trendColor}"></i><span class="${trendColor}">${trendText} ${Math.abs(trend).toFixed(1)}%</span>`;
            } else if (trend < 0) {
                const trendText = type.includes('injuries') || type.includes('lti') || type.includes('fire') || type.includes('cost') || type.includes('lost-days')
                    ? 'تحسن' : 'تراجع';
                const trendColor = type.includes('injuries') || type.includes('lti') || type.includes('fire') || type.includes('cost') || type.includes('lost-days')
                    ? 'text-green-500' : 'text-red-500';
                trendEl.innerHTML = `<i class="fas fa-arrow-${type.includes('injuries') || type.includes('lti') || type.includes('fire') || type.includes('cost') || type.includes('lost-days') ? 'up' : 'down'} ${trendColor}"></i><span class="${trendColor}">${trendText} ${Math.abs(trend).toFixed(1)}%</span>`;
            } else {
                trendEl.innerHTML = `<i class="fas fa-minus text-gray-400"></i><span class="text-gray-500">لا يوجد تغيير</span>`;
            }
        }
    },

    calculateTrend(type, currentValue) {
        // Simplified trend - in real implementation, compare with previous period
        return 0; // Placeholder
    },

    updateCharts(data, start, end) {
        this.renderIncidentsChart(data, start, end);
        this.renderDepartmentChart(data);
        this.renderTRIRChart(data, start, end);
        this.renderTrainingChart(data, start, end);
        this.renderDepartmentComparison(data);
        this.renderHeatmap(data);
    },

    renderIncidentsChart(data, start, end) {
        const container = document.getElementById('incidents-chart-container');
        if (!container) return;

        // Group by date
        const incidentsByDate = {};
        data.incidents.forEach(inc => {
            const date = new Date(inc.date || inc.incidentDate || inc.createdAt);
            const dateKey = date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
            incidentsByDate[dateKey] = (incidentsByDate[dateKey] || 0) + 1;
        });

        const labels = Object.keys(incidentsByDate).sort();
        const values = labels.map(label => incidentsByDate[label]);

        container.innerHTML = `
            <div class="text-center p-8">
                <canvas id="incidents-chart-canvas" style="max-height: 250px;"></canvas>
            </div>
        `;

        // Simple bar chart using CSS
        setTimeout(() => {
            const canvas = document.getElementById('incidents-chart-canvas');
            if (canvas && canvas.getContext) {
                const ctx = canvas.getContext('2d');
                const maxValue = Math.max(...values, 1);
                const barWidth = canvas.width / labels.length;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                values.forEach((val, idx) => {
                    const barHeight = (val / maxValue) * canvas.height * 0.8;
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(idx * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);
                });
            } else {
                // Fallback to HTML/CSS chart
                container.innerHTML = `
                    <div class="space-y-2">
                        ${labels.map((label, idx) => `
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-gray-600 w-20">${label}</span>
                                <div class="flex-1 bg-gray-200 rounded h-4 relative">
                                    <div class="bg-red-500 h-4 rounded" style="width: ${(values[idx] / Math.max(...values, 1)) * 100}%"></div>
                                </div>
                                <span class="text-xs font-semibold w-8">${values[idx]}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }, 100);
    },

    renderDepartmentChart(data) {
        const container = document.getElementById('department-chart-container');
        if (!container) return;

        const deptCounts = {};
        data.incidents.forEach(inc => {
            const dept = inc.affectedDepartment || 'غير محدد';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });

        const total = Object.values(deptCounts).reduce((a, b) => a + b, 0);

        container.innerHTML = `
            <div class="space-y-3">
                ${Object.entries(deptCounts).map(([dept, count]) => {
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            return `
                        <div class="flex items-center gap-3">
                            <div class="flex-1">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="text-sm font-semibold">${Utils.escapeHTML(dept)}</span>
                                    <span class="text-xs text-gray-600">${percentage}%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-blue-500 h-2 rounded-full" style="width: ${percentage}%"></div>
                                </div>
                            </div>
                            <span class="text-sm font-bold w-12 text-right">${count}</span>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    renderTRIRChart(data, start, end) {
        const container = document.getElementById('trir-chart-container');
        if (!container) return;

        // Calculate LTIFR for each month in the period
        const ltifrValues = [];
        const labels = [];
        let current = new Date(start);

        while (current <= end) {
            const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
            const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
            const monthData = this.getFilteredData(monthStart, monthEnd);
            const ltifr = parseFloat(this.calculateLTIFR(monthData));
            ltifrValues.push(ltifr);
            labels.push(current.toLocaleDateString('ar-SA', { month: 'short' }));
            current.setMonth(current.getMonth() + 1);
        }

        const maxValue = Math.max(...ltifrValues, 1);
        container.innerHTML = `
            <div class="space-y-2">
                ${labels.map((label, idx) => `
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-600 w-20">${label}</span>
                        <div class="flex-1 bg-gray-200 rounded h-4 relative">
                            <div class="bg-purple-500 h-4 rounded transition-all" style="width: ${Math.min((ltifrValues[idx] / maxValue) * 100, 100)}%"></div>
                        </div>
                        <span class="text-xs font-semibold w-12">${ltifrValues[idx]}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderTrainingChart(data, start, end) {
        const container = document.getElementById('training-chart-container');
        if (!container) return;

        const completed = data.training.filter(tr =>
            (tr.status || '').includes('مكتمل') || (tr.status || '').includes('completed')
        ).length;
        const total = data.training.length;
        const percentage = total > 0 ? ((completed / total) * 100) : 0;

        container.innerHTML = `
            <div class="text-center">
                <div class="relative inline-block">
                    <svg class="transform -rotate-90 w-48 h-48">
                        <circle cx="96" cy="96" r="80" stroke="#e5e7eb" stroke-width="16" fill="none"></circle>
                        <circle cx="96" cy="96" r="80" stroke="#3b82f6" stroke-width="16" fill="none"
                            stroke-dasharray="${2 * Math.PI * 80}"
                            stroke-dashoffset="${2 * Math.PI * 80 * (1 - percentage / 100)}"
                            stroke-linecap="round"></circle>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="text-center">
                            <div class="text-3xl font-bold text-blue-600">${percentage.toFixed(1)}%</div>
                            <div class="text-sm text-gray-600">${completed} / ${total}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderDepartmentComparison(data) {
        const container = document.getElementById('department-comparison-container');
        if (!container) return;

        const deptStats = {};
        const departments = new Set();

        data.incidents.forEach(inc => {
            const dept = inc.affectedDepartment || 'غير محدد';
            departments.add(dept);
            if (!deptStats[dept]) {
                deptStats[dept] = { incidents: 0, nearmiss: 0, training: 0 };
            }
            deptStats[dept].incidents++;
        });

        data.nearmiss.forEach(nm => {
            const dept = nm.department || 'غير محدد';
            departments.add(dept);
            if (!deptStats[dept]) {
                deptStats[dept] = { incidents: 0, nearmiss: 0, training: 0 };
            }
            deptStats[dept].nearmiss++;
        });

        const maxValue = Math.max(...Object.values(deptStats).map(s => s.incidents + s.nearmiss), 1);

        container.innerHTML = `
            <div class="space-y-4">
                ${Array.from(departments).map(dept => {
            const stats = deptStats[dept] || { incidents: 0, nearmiss: 0, training: 0 };
            const total = stats.incidents + stats.nearmiss;
            const width = (total / maxValue) * 100;
            return `
                        <div>
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-sm font-semibold">${Utils.escapeHTML(dept)}</span>
                                <span class="text-xs text-gray-600">${total} حادث</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                                <div class="absolute left-0 top-0 h-full bg-red-500" style="width: ${(stats.incidents / maxValue) * 100}%"></div>
                                <div class="absolute left-0 top-0 h-full bg-orange-500" style="width: ${(stats.nearmiss / maxValue) * 100}%; margin-left: ${(stats.incidents / maxValue) * 100}%"></div>
                            </div>
                            <div class="flex gap-4 mt-1 text-xs text-gray-600">
                                <span>حوادث: ${stats.incidents}</span>
                                <span>وشيكة: ${stats.nearmiss}</span>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    renderHeatmap(data) {
        const container = document.getElementById('heatmap-container');
        if (!container) return;

        const deptLocMatrix = {};
        const departments = new Set();
        const locations = new Set();

        data.incidents.forEach(inc => {
            const dept = inc.affectedDepartment || 'غير محدد';
            const loc = inc.location || 'غير محدد';
            departments.add(dept);
            locations.add(loc);
            const key = `${dept}|${loc}`;
            deptLocMatrix[key] = (deptLocMatrix[key] || 0) + 1;
        });

        const maxValue = Math.max(...Object.values(deptLocMatrix), 1);

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                    <thead>
                        <tr>
                            <th class="border p-2 text-sm font-semibold bg-gray-100">الإدارة / الموقع</th>
                            ${Array.from(locations).map(loc => `
                                <th class="border p-2 text-sm font-semibold bg-gray-100">${Utils.escapeHTML(loc)}</th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${Array.from(departments).map(dept => `
                            <tr>
                                <td class="border p-2 text-sm font-semibold bg-gray-50">${Utils.escapeHTML(dept)}</td>
                                ${Array.from(locations).map(loc => {
            const key = `${dept}|${loc}`;
            const value = deptLocMatrix[key] || 0;
            const intensity = (value / maxValue) * 100;
            const bgColor = intensity > 75 ? 'bg-red-600' :
                intensity > 50 ? 'bg-orange-500' :
                    intensity > 25 ? 'bg-yellow-400' :
                        'bg-green-400';
            return `
                                        <td class="border p-2 text-center ${bgColor} text-white font-semibold">
                                            ${value}
                                        </td>
                                    `;
        }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    loadKPITargets() {
        const saved = localStorage.getItem('hse_kpi_targets');
        if (saved) {
            try {
                this.kpiTargets = JSON.parse(saved);
            } catch (e) {
                Utils.safeWarn('فشل تحميل أهداف KPIs:', e);
                this.kpiTargets = {};
            }
        }
    },

    saveKPITargets() {
        localStorage.setItem('hse_kpi_targets', JSON.stringify(this.kpiTargets));
    },

    getKPITarget(type) {
        return this.kpiTargets[type] || 0;
    },

    showSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;" dir="rtl">
                <div class="modal-header">
                    <h2 class="modal-title" style="text-align: right;">
                        <i class="fas fa-cog ml-2"></i>
                        إعدادات أهداف مؤشرات الأداء
                    </h2>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body space-y-4" style="padding: 1.5rem;">
                    ${this.renderTargetInputs()}
                </div>
                <div class="modal-footer" style="justify-content: flex-start; gap: 0.75rem;">
                    <button id="save-kpi-targets" class="btn-primary">
                        <i class="fas fa-save ml-2"></i>
                        حفظ
                    </button>
                    <button class="btn-secondary modal-close">
                        <i class="fas fa-times ml-2"></i>
                        إلغاء
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.getElementById('save-kpi-targets')?.addEventListener('click', () => {
            this.saveTargetsFromModal(modal);
            modal.remove();
        });
    },

    renderTargetInputs() {
        const leadingTargets = [
            { key: 'inspection-tours', label: 'الجولات التفتيشية المنفذة', unit: 'جولة', section: 'استباقي' },
            { key: 'observations', label: 'الملاحظات المسجلة والمعالجة', unit: 'ملاحظة', section: 'استباقي' },
            { key: 'actions-closure', label: 'نسبة إغلاق الإجراءات التصحيحية', unit: '%', section: 'استباقي' },
            { key: 'training-courses', label: 'الدورات التدريبية المنفذة', unit: 'دورة', section: 'استباقي' },
            { key: 'training-attendance', label: 'نسبة حضور الموظفين للتدريب', unit: '%', section: 'استباقي' },
            { key: 'ptw-approved', label: 'تصاريح العمل المعتمدة والمنفذة', unit: 'تصريح', section: 'استباقي' },
            { key: 'ppe-compliance', label: 'نسبة الالتزام باستخدام معدات الوقاية', unit: '%', section: 'استباقي' },
            { key: 'inspections-on-time', label: 'الفحوصات الدورية المنجزة في الموعد', unit: 'فحص', section: 'استباقي' },
            { key: 'safety-meetings', label: 'عدد الاجتماعات والتوعيات الخاصة بالسلامة', unit: 'اجتماع', section: 'استباقي' }
        ];

        const laggingTargets = [
            { key: 'injuries', label: 'عدد الإصابات المسجلة', unit: 'إصابة', section: 'تراجعي' },
            { key: 'lti', label: 'عدد الإصابات المؤدية لتوقف عن العمل (LTI)', unit: 'إصابة', section: 'تراجعي' },
            { key: 'ltifr', label: 'معدل تكرار الإصابات (LTIFR)', unit: '', section: 'تراجعي' },
            { key: 'severity', label: 'معدل شدة الإصابات', unit: '%', section: 'تراجعي' },
            { key: 'nearmiss-count', label: 'عدد الحوادث الوشيكة المسجلة', unit: 'حادث', section: 'تراجعي' },
            { key: 'fire-incidents', label: 'عدد الحرائق أو الحوادث في معدات الإطفاء', unit: 'حادث', section: 'تراجعي' },
            { key: 'lost-days', label: 'عدد الأيام المهدورة بسبب الإصابات', unit: 'يوم', section: 'تراجعي' },
            { key: 'accident-cost', label: 'تكلفة الحوادث (مباشرة / غير مباشرة)', unit: 'ريال', section: 'تراجعي' }
        ];

        const targets = [...leadingTargets, ...laggingTargets];

        return `
            <div class="space-y-6" dir="rtl">
                <!-- Leading Indicators Section -->
                <div>
                    <h3 class="text-lg font-bold text-green-700 mb-4 pb-2 border-b-2 border-green-300 text-right">
                        <i class="fas fa-arrow-trend-up ml-2"></i>
                        المؤشرات الاستباقية (Leading Indicators)
                    </h3>
                    <div class="space-y-4">
                        ${leadingTargets.map(t => `
                            <div class="flex items-center gap-3 flex-row-reverse">
                                <label class="flex-1 text-sm font-semibold text-gray-700 text-right min-w-0">${t.label}</label>
                                <div class="flex items-center gap-2 flex-shrink-0">
                                    ${t.unit ? `<span class="text-sm text-gray-600 whitespace-nowrap">${t.unit}</span>` : ''}
                                    <input type="number" 
                                        id="target-${t.key}" 
                                        class="form-input w-32 text-right" 
                                        value="${this.kpiTargets[t.key] || ''}" 
                                        placeholder="الهدف"
                                        step="0.1"
                                        dir="ltr"
                                        style="text-align: right;">
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Lagging Indicators Section -->
                <div>
                    <h3 class="text-lg font-bold text-red-700 mb-4 pb-2 border-b-2 border-red-300 text-right">
                        <i class="fas fa-arrow-trend-down ml-2"></i>
                        المؤشرات التراجعية (Lagging Indicators)
                    </h3>
                    <div class="space-y-4">
                        ${laggingTargets.map(t => `
                            <div class="flex items-center gap-3 flex-row-reverse">
                                <label class="flex-1 text-sm font-semibold text-gray-700 text-right min-w-0">${t.label}</label>
                                <div class="flex items-center gap-2 flex-shrink-0">
                                    ${t.unit ? `<span class="text-sm text-gray-600 whitespace-nowrap">${t.unit}</span>` : ''}
                                    <input type="number" 
                                        id="target-${t.key}" 
                                        class="form-input w-32 text-right" 
                                        value="${this.kpiTargets[t.key] || ''}" 
                                        placeholder="الهدف"
                                        step="0.1"
                                        dir="ltr"
                                        style="text-align: right;">
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    saveTargetsFromModal(modal) {
        const leadingTargets = ['inspection-tours', 'observations', 'actions-closure', 'training-courses', 'training-attendance', 'ptw-approved', 'ppe-compliance', 'inspections-on-time', 'safety-meetings'];
        const laggingTargets = ['injuries', 'lti', 'ltifr', 'severity', 'nearmiss-count', 'fire-incidents', 'lost-days', 'accident-cost'];
        const allTargets = [...leadingTargets, ...laggingTargets];

        allTargets.forEach(key => {
            const input = modal.querySelector(`#target-${key}`);
            if (input) {
                const value = parseFloat(input.value);
                if (!isNaN(value) && value >= 0) {
                    this.kpiTargets[key] = value;
                }
            }
        });
        this.saveKPITargets();
        Notification.success('تم حفظ الأهداف بنجاح');
        this.updateAllKPIs();
    },

    async exportToExcel() {
        try {
            const { start, end } = this.getDateRange();
            const data = this.getFilteredData(start, end);

            // Leading Indicators
            const inspectionTours = this.calculateInspectionTours(data);
            const observations = this.calculateObservationsRecorded(data);
            const actionsClosure = this.calculateCorrectiveActionsClosure(data);
            const trainingCourses = this.calculateTrainingCourses(data);
            const trainingAttendance = this.calculateTrainingAttendance(data);
            const ptwApproved = this.calculatePTWApproved(data);
            const ppeCompliance = this.calculatePPECompliance(data);
            const inspectionsOnTime = this.calculatePeriodicInspectionsOnTime(data);
            const safetyMeetings = this.calculateSafetyMeetings(data);

            // Lagging Indicators
            const totalInjuries = this.calculateTotalInjuries(data);
            const ltiCount = this.calculateLTICount(data);
            const ltifr = this.calculateLTIFR(data);
            const severityRate = this.calculateSeverityRate(data);
            const nearMissCount = this.calculateNearMissCount(data);
            const fireIncidents = this.calculateFireIncidents(data);
            const lostDays = this.calculateLostDays(data);
            const accidentCost = this.calculateAccidentCost(data);

            const kpiData = [
                ['مؤشر الأداء', 'القيمة', 'الهدف', 'نسبة الإنجاز', 'النوع'],
                // Leading Indicators
                ['=== المؤشرات الاستباقية (Leading Indicators) ===', '', '', '', ''],
                ['الجولات التفتيشية المنفذة', inspectionTours.completed, inspectionTours.planned, inspectionTours.percentage + '%', 'استباقي'],
                ['الملاحظات المسجلة والمعالجة', observations.total, observations.processed, observations.percentage + '%', 'استباقي'],
                ['نسبة إغلاق الإجراءات التصحيحية', actionsClosure.percentage + '%', '100%', actionsClosure.percentage + '%', 'استباقي'],
                ['الدورات التدريبية المنفذة', trainingCourses.completed, trainingCourses.total, trainingCourses.percentage + '%', 'استباقي'],
                ['نسبة حضور الموظفين للتدريب', trainingAttendance.percentage + '%', '100%', trainingAttendance.percentage + '%', 'استباقي'],
                ['تصاريح العمل المعتمدة والمنفذة', ptwApproved.approved, ptwApproved.total, ptwApproved.percentage + '%', 'استباقي'],
                ['نسبة الالتزام باستخدام معدات الوقاية', ppeCompliance.percentage + '%', '100%', ppeCompliance.percentage + '%', 'استباقي'],
                ['الفحوصات الدورية المنجزة في الموعد', inspectionsOnTime.onTime, inspectionsOnTime.total, inspectionsOnTime.percentage + '%', 'استباقي'],
                ['عدد الاجتماعات والتوعيات الخاصة بالسلامة', safetyMeetings, this.getKPITarget('safety-meetings'), '', 'استباقي'],
                // Lagging Indicators
                ['=== المؤشرات التراجعية (Lagging Indicators) ===', '', '', '', ''],
                ['عدد الإصابات المسجلة', totalInjuries, this.getKPITarget('injuries'), '', 'تراجعي'],
                ['عدد الإصابات المؤدية لتوقف عن العمل (LTI)', ltiCount, this.getKPITarget('lti'), '', 'تراجعي'],
                ['معدل تكرار الإصابات (LTIFR)', ltifr, this.getKPITarget('ltifr'), '', 'تراجعي'],
                ['معدل شدة الإصابات', severityRate, this.getKPITarget('severity'), '', 'تراجعي'],
                ['عدد الحوادث الوشيكة المسجلة', nearMissCount, this.getKPITarget('nearmiss-count'), '', 'تراجعي'],
                ['عدد الحرائق أو الحوادث في معدات الإطفاء', fireIncidents, this.getKPITarget('fire-incidents'), '', 'تراجعي'],
                ['عدد الأيام المهدورة بسبب الإصابات', lostDays, this.getKPITarget('lost-days'), '', 'تراجعي'],
                ['تكلفة الحوادث (مباشرة / غير مباشرة)', accidentCost, this.getKPITarget('accident-cost'), '', 'تراجعي']
            ];

            if (typeof XLSX !== 'undefined') {
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.aoa_to_sheet(kpiData);
                XLSX.utils.book_append_sheet(wb, ws, 'مؤشرات الأداء');
                XLSX.writeFile(wb, `مؤشرات_الأداء_${new Date().toISOString().slice(0, 10)}.xlsx`);
                Notification.success('تم تصدير البيانات بنجاح');
            } else {
                Notification.error('مكتبة Excel غير متاحة');
            }
        } catch (error) {
            Utils.safeError('خطأ في التصدير:', error);
            Notification.error('حدث خطأ أثناء التصدير: ' + error.message);
        }
    },

    async exportToPDF() {
        try {
            const { start, end } = this.getDateRange();
            const data = this.getFilteredData(start, end);

            // محاولة استخدام jsPDF أولاً
            if (typeof window.jsPDF !== 'undefined') {
                try {
                    const { jsPDF } = window.jsPDF;
                    const doc = new jsPDF('l', 'mm', 'a4');

                    // Title
                    doc.setFontSize(18);
                    doc.text('مؤشرات الأداء لإدارة السلامة', 150, 15, { align: 'center' });

                    doc.setFontSize(12);
                    doc.text(`الفترة: ${start.toLocaleDateString('ar-SA')} - ${end.toLocaleDateString('ar-SA')}`, 150, 25, { align: 'center' });

                    // Leading Indicators
                    const inspectionTours = this.calculateInspectionTours(data);
                    const observations = this.calculateObservationsRecorded(data);
                    const actionsClosure = this.calculateCorrectiveActionsClosure(data);
                    const trainingCourses = this.calculateTrainingCourses(data);
                    const trainingAttendance = this.calculateTrainingAttendance(data);
                    const ptwApproved = this.calculatePTWApproved(data);
                    const ppeCompliance = this.calculatePPECompliance(data);
                    const inspectionsOnTime = this.calculatePeriodicInspectionsOnTime(data);
                    const safetyMeetings = this.calculateSafetyMeetings(data);

                    // Lagging Indicators
                    const totalInjuries = this.calculateTotalInjuries(data);
                    const ltiCount = this.calculateLTICount(data);
                    const ltifr = this.calculateLTIFR(data);
                    const severityRate = this.calculateSeverityRate(data);
                    const nearMissCount = this.calculateNearMissCount(data);
                    const fireIncidents = this.calculateFireIncidents(data);
                    const lostDays = this.calculateLostDays(data);
                    const accidentCost = this.calculateAccidentCost(data);

                    // KPI Table
                    const tableData = [
                        ['المؤشر', 'القيمة', 'الهدف'],
                        // Leading Indicators
                        ['=== المؤشرات الاستباقية ===', '', ''],
                        ['الجولات التفتيشية المنفذة', inspectionTours.completed, inspectionTours.planned],
                        ['الملاحظات المسجلة والمعالجة', observations.total, observations.processed],
                        ['نسبة إغلاق الإجراءات التصحيحية', actionsClosure.percentage + '%', '100%'],
                        ['الدورات التدريبية المنفذة', trainingCourses.completed, trainingCourses.total],
                        ['نسبة حضور الموظفين للتدريب', trainingAttendance.percentage + '%', '100%'],
                        ['تصاريح العمل المعتمدة والمنفذة', ptwApproved.approved, ptwApproved.total],
                        ['نسبة الالتزام باستخدام معدات الوقاية', ppeCompliance.percentage + '%', '100%'],
                        ['الفحوصات الدورية المنجزة في الموعد', inspectionsOnTime.onTime, inspectionsOnTime.total],
                        ['عدد الاجتماعات والتوعيات الخاصة بالسلامة', safetyMeetings, this.getKPITarget('safety-meetings')],
                        // Lagging Indicators
                        ['=== المؤشرات التراجعية ===', '', ''],
                        ['عدد الإصابات المسجلة', totalInjuries, this.getKPITarget('injuries')],
                        ['عدد الإصابات المؤدية لتوقف عن العمل (LTI)', ltiCount, this.getKPITarget('lti')],
                        ['معدل تكرار الإصابات (LTIFR)', ltifr, this.getKPITarget('ltifr')],
                        ['معدل شدة الإصابات', severityRate, this.getKPITarget('severity')],
                        ['عدد الحوادث الوشيكة المسجلة', nearMissCount, this.getKPITarget('nearmiss-count')],
                        ['عدد الحرائق أو الحوادث في معدات الإطفاء', fireIncidents, this.getKPITarget('fire-incidents')],
                        ['عدد الأيام المهدورة بسبب الإصابات', lostDays, this.getKPITarget('lost-days')],
                        ['تكلفة الحوادث (مباشرة / غير مباشرة)', accidentCost, this.getKPITarget('accident-cost')]
                    ];

                    if (typeof doc.autoTable !== 'undefined') {
                        doc.autoTable({
                            head: [tableData[0]],
                            body: tableData.slice(1),
                            startY: 35,
                            styles: { font: 'Arial', fontSize: 10, halign: 'right' },
                            headStyles: { fillColor: [59, 130, 246], textColor: 255 }
                        });
                    } else {
                        // Fallback: إضافة البيانات كـ text
                        let yPos = 35;
                        tableData.slice(1).forEach(row => {
                            doc.text(row.join(' | '), 20, yPos);
                            yPos += 10;
                        });
                    }

                    doc.save(`مؤشرات_الأداء_${new Date().toISOString().slice(0, 10)}.pdf`);
                    Notification.success('تم تصدير PDF بنجاح');
                    return;
                } catch (error) {
                    Utils.safeWarn('فشل استخدام jsPDF، سيتم استخدام طريقة HTML:', error);
                }
            }

            // Fallback: استخدام window.open مع HTML
            const inspectionTours = this.calculateInspectionTours(data);
            const observations = this.calculateObservationsRecorded(data);
            const actionsClosure = this.calculateCorrectiveActionsClosure(data);
            const trainingCourses = this.calculateTrainingCourses(data);
            const trainingAttendance = this.calculateTrainingAttendance(data);
            const ptwApproved = this.calculatePTWApproved(data);
            const ppeCompliance = this.calculatePPECompliance(data);
            const inspectionsOnTime = this.calculatePeriodicInspectionsOnTime(data);
            const safetyMeetings = this.calculateSafetyMeetings(data);
            const totalInjuries = this.calculateTotalInjuries(data);
            const ltiCount = this.calculateLTICount(data);
            const ltifr = this.calculateLTIFR(data);
            const severityRate = this.calculateSeverityRate(data);
            const nearMissCount = this.calculateNearMissCount(data);
            const fireIncidents = this.calculateFireIncidents(data);
            const lostDays = this.calculateLostDays(data);
            const accidentCost = this.calculateAccidentCost(data);

            const kpiRows = [
                // Leading Indicators
                ['=== المؤشرات الاستباقية ===', '', ''],
                ['الجولات التفتيشية المنفذة', inspectionTours.completed, inspectionTours.planned],
                ['الملاحظات المسجلة والمعالجة', observations.total, observations.processed],
                ['نسبة إغلاق الإجراءات التصحيحية', actionsClosure.percentage + '%', '100%'],
                ['الدورات التدريبية المنفذة', trainingCourses.completed, trainingCourses.total],
                ['نسبة حضور الموظفين للتدريب', trainingAttendance.percentage + '%', '100%'],
                ['تصاريح العمل المعتمدة والمنفذة', ptwApproved.approved, ptwApproved.total],
                ['نسبة الالتزام باستخدام معدات الوقاية', ppeCompliance.percentage + '%', '100%'],
                ['الفحوصات الدورية المنجزة في الموعد', inspectionsOnTime.onTime, inspectionsOnTime.total],
                ['عدد الاجتماعات والتوعيات الخاصة بالسلامة', safetyMeetings, this.getKPITarget('safety-meetings')],
                // Lagging Indicators
                ['=== المؤشرات التراجعية ===', '', ''],
                ['عدد الإصابات المسجلة', totalInjuries, this.getKPITarget('injuries')],
                ['عدد الإصابات المؤدية لتوقف عن العمل (LTI)', ltiCount, this.getKPITarget('lti')],
                ['معدل تكرار الإصابات (LTIFR)', ltifr, this.getKPITarget('ltifr')],
                ['معدل شدة الإصابات', severityRate, this.getKPITarget('severity')],
                ['عدد الحوادث الوشيكة المسجلة', nearMissCount, this.getKPITarget('nearmiss-count')],
                ['عدد الحرائق أو الحوادث في معدات الإطفاء', fireIncidents, this.getKPITarget('fire-incidents')],
                ['عدد الأيام المهدورة بسبب الإصابات', lostDays, this.getKPITarget('lost-days')],
                ['تكلفة الحوادث (مباشرة / غير مباشرة)', accidentCost, this.getKPITarget('accident-cost')]
            ].map(row => {
                if (row[0].includes('===')) {
                    return `<tr style="background-color: #e5e7eb;"><td colspan="3" style="text-align: center; font-weight: bold; padding: 10px;">${Utils.escapeHTML(row[0])}</td></tr>`;
                }
                return `
                    <tr>
                        <td>${Utils.escapeHTML(row[0])}</td>
                        <td class="text-center">${Utils.escapeHTML(String(row[1]))}</td>
                        <td class="text-center">${Utils.escapeHTML(String(row[2]))}</td>
                    </tr>
                `;
            }).join('');

            const content = `
                <div style="margin-bottom: 20px;">
                    <h3 style="text-align: center; margin-bottom: 10px;">مؤشرات الأداء لإدارة السلامة</h3>
                    <p style="text-align: center; color: #666;">
                        الفترة: ${start.toLocaleDateString('ar-SA')} - ${end.toLocaleDateString('ar-SA')}
                    </p>
                </div>
                <table class="report-table" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background-color: #3b82f6; color: white;">
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">المؤشر</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">القيمة</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">الهدف</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${kpiRows}
                    </tbody>
                </table>
            `;

            const html = PDFTemplates.buildDocument({
                title: 'مؤشرات الأداء لإدارة السلامة',
                formCode: 'KPI-REPORT',
                content,
                createdAt: new Date(),
                meta: {
                    'الفترة': `${start.toLocaleDateString('ar-SA')} - ${end.toLocaleDateString('ar-SA')}`,
                    'عدد المؤشرات': '17',
                    'المؤشرات الاستباقية': '9',
                    'المؤشرات التراجعية': '8'
                }
            });

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                Notification.error('يرجى السماح للنوافذ المنبثقة للطباعة');
                return;
            }

            printWindow.document.write(html);
            printWindow.document.close();

            // انتظار تحميل الصفحة ثم طباعتها
            setTimeout(() => {
                printWindow.print();
            }, 500);

            Notification.success('تم فتح نافذة الطباعة. يمكنك حفظها كـ PDF من قائمة الطباعة.');
        } catch (error) {
            Utils.safeError('خطأ في تصدير PDF:', error);
            Notification.error('حدث خطأ أثناء تصدير PDF: ' + error.message);
        }
    }
};

// ===== Export module to global scope =====
// تصدير الموديول إلى window فوراً لضمان توافره
(function () {
    'use strict';
    try {
        if (typeof window !== 'undefined' && typeof SafetyPerformanceKPIs !== 'undefined') {
            window.SafetyPerformanceKPIs = SafetyPerformanceKPIs;
            
            // إشعار عند تحميل الموديول بنجاح
            if (typeof AppState !== 'undefined' && AppState.debugMode && typeof Utils !== 'undefined' && Utils.safeLog) {
                Utils.safeLog('✅ SafetyPerformanceKPIs module loaded and available on window.SafetyPerformanceKPIs');
            }
        }
    } catch (error) {
        console.error('❌ خطأ في تصدير SafetyPerformanceKPIs:', error);
        // محاولة التصدير مرة أخرى حتى في حالة الخطأ
        if (typeof window !== 'undefined' && typeof SafetyPerformanceKPIs !== 'undefined') {
            try {
                window.SafetyPerformanceKPIs = SafetyPerformanceKPIs;
            } catch (e) {
                console.error('❌ فشل تصدير SafetyPerformanceKPIs:', e);
            }
        }
    }
})();
