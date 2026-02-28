/**
 * BehaviorMonitoring Module
 * ØªÙ… Ø§Ø³ØªØ®Ø±Ø§Ø¬Ù‡ Ù…Ù† app-modules.js
 */
// ===== Behavior Monitoring Module (مراقبة السلوكيات) =====
const BehaviorMonitoring = {
    // مراجع لتنظيف الموارد
    _setupTimeoutId: null,
    _eventListenersAbortController: null,
    _modalAbortController: null,

    state: {
        activeTab: 'log', // overview | log | form
        filters: {
            search: '',
            behaviorType: '',
            rating: '',
            dateFrom: '',
            dateTo: ''
        },
        sort: 'date_desc' // date_desc | date_asc
    },

    NEGATIVE_ACTIONS: [
        'توعية / توجيه',
        'إعادة تدريب',
        'تحذير شفهي',
        'إنذار كتابي',
        'إيقاف مؤقت عن العمل',
        'تطبيق / تعديل إجراء عمل',
        'تحسينات هندسية (Engineering)',
        'توفير / إلزام PPE',
        'أخرى'
    ],

    // الحصول على قائمة المواقع (المصانع) من الإعدادات (نفس نمط Training/Clinic)
    getSiteOptions() {
        try {
            if (typeof Permissions !== 'undefined' && Permissions.formSettingsState && Permissions.formSettingsState.sites) {
                return Permissions.formSettingsState.sites.map(site => ({ id: site.id, name: site.name }));
            }

            if (Array.isArray(AppState.appData?.observationSites) && AppState.appData.observationSites.length > 0) {
                return AppState.appData.observationSites.map(site => ({
                    id: site.id || site.siteId || Utils.generateId('SITE'),
                    name: site.name || site.title || site.label || 'موقع غير محدد'
                }));
            }

            if (typeof DailyObservations !== 'undefined' && Array.isArray(DailyObservations.DEFAULT_SITES)) {
                return DailyObservations.DEFAULT_SITES.map((site, index) => ({
                    id: site.id || site.siteId || Utils.generateId('SITE'),
                    name: site.name || site.title || site.label || `موقع ${index + 1}`
                }));
            }

            return [];
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في الحصول على قائمة المواقع:', error);
            return [];
        }
    },

    // الحصول على قائمة الأماكن الفرعية لموقع محدد
    getPlaceOptions(siteId) {
        try {
            if (!siteId) return [];

            if (typeof Permissions !== 'undefined' && Permissions.formSettingsState && Permissions.formSettingsState.sites) {
                const site = Permissions.formSettingsState.sites.find(s => s.id === siteId);
                if (site && Array.isArray(site.places)) {
                    return site.places.map(place => ({ id: place.id, name: place.name }));
                }
            }

            if (Array.isArray(AppState.appData?.observationSites)) {
                const site = AppState.appData.observationSites.find(s => (s.id || s.siteId) === siteId);
                if (site) {
                    const placesSource = Array.isArray(site.places)
                        ? site.places
                        : Array.isArray(site.locations)
                            ? site.locations
                            : Array.isArray(site.children)
                                ? site.children
                                : Array.isArray(site.areas)
                                    ? site.areas
                                    : [];
                    return placesSource.map((place, idx) => ({
                        id: place.id || place.placeId || place.value || Utils.generateId('PLACE'),
                        name: place.name || place.placeName || place.title || place.label || place.locationName || `مكان ${idx + 1}`
                    }));
                }
            }

            if (typeof DailyObservations !== 'undefined' && Array.isArray(DailyObservations.DEFAULT_SITES)) {
                const site = DailyObservations.DEFAULT_SITES.find(s => (s.id || s.siteId) === siteId);
                if (site) {
                    const placesSource = Array.isArray(site.places)
                        ? site.places
                        : Array.isArray(site.locations)
                            ? site.locations
                            : Array.isArray(site.children)
                                ? site.children
                                : Array.isArray(site.areas)
                                    ? site.areas
                                    : [];
                    return placesSource.map((place, idx) => ({
                        id: place.id || place.placeId || place.value || Utils.generateId('PLACE'),
                        name: place.name || place.placeName || place.title || place.label || place.locationName || `مكان ${idx + 1}`
                    }));
                }
            }

            return [];
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في الحصول على قائمة الأماكن:', error);
            return [];
        }
    },

    resolveSiteName(siteIdOrName) {
        const v = (siteIdOrName || '').toString();
        if (!v) return '';
        const sites = this.getSiteOptions();
        const site = sites.find(s => s.id === v) || sites.find(s => (s.name || '') === v);
        return site?.name || v;
    },

    resolvePlaceName(placeIdOrName, siteIdOrName) {
        const v = (placeIdOrName || '').toString();
        if (!v) return '';
        const parent = (siteIdOrName || '').toString();
        const places = this.getPlaceOptions(parent);
        const place = places.find(p => p.id === v) || places.find(p => (p.name || '') === v);
        return place?.name || v;
    },

    async load() {
        // التحقق من وجود التبعيات المطلوبة
        if (typeof Utils === 'undefined') {
            console.error('Utils غير متوفر!');
            return;
        }
        if (typeof AppState === 'undefined') {
            // لا تترك الواجهة فارغة
            const section = document.getElementById('behavior-monitoring-section');
            if (section) {
                section.innerHTML = `
                    <div class="content-card">
                        <div class="card-body">
                            <div class="empty-state">
                                <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                                <p class="text-gray-500 mb-2">تعذر تحميل مراقبة السلوكيات</p>
                                <p class="text-sm text-gray-400">AppState غير متوفر حالياً. جرّب تحديث الصفحة.</p>
                                <button onclick="location.reload()" class="btn-primary mt-4">
                                    <i class="fas fa-redo ml-2"></i>
                                    تحديث الصفحة
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
            Utils.safeError('AppState غير متوفر!');
            return;
        }

        const section = document.getElementById('behavior-monitoring-section');
        if (!section) {
            if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                Utils.safeWarn('⚠️ قسم behavior-monitoring-section غير موجود');
            } else {
                console.warn('⚠️ قسم behavior-monitoring-section غير موجود');
            }
            return;
        }

        // التأكد من وجود البيانات
        if (!AppState.appData) {
            AppState.appData = {};
        }
        if (!AppState.appData.behaviorMonitoring) {
            AppState.appData.behaviorMonitoring = [];
        }

        // عرض الواجهة أولاً لتحسين تجربة المستخدم
        try {
            const activeTab = this.state?.activeTab || 'log';

            section.innerHTML = `
                <div class="section-header">
                    <div class="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h1 class="section-title">
                                <i class="fas fa-eye ml-3"></i>
                                مراقبة السلوكيات
                            </h1>
                            <p class="section-subtitle">تسجيل ومتابعة سلوكيات الموظفين</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button id="behavior-refresh-btn" class="btn-secondary">
                                <i class="fas fa-sync-alt ml-2"></i>
                                تحديث
                            </button>
                            <button id="behavior-add-btn" class="btn-primary">
                                <i class="fas fa-plus ml-2"></i>
                                تسجيل تصرف جديد
                            </button>
                        </div>
                    </div>
                </div>

                <div class="mt-6">
                    <div class="module-tabs-wrapper">
                        <div class="module-tabs-container">
                            <button class="module-tab-btn ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview" onclick="BehaviorMonitoring.switchTab('overview')">
                                <i class="fas fa-chart-pie ml-2"></i>نظرة عامة
                            </button>
                            <button class="module-tab-btn ${activeTab === 'log' ? 'active' : ''}" data-tab="log" onclick="BehaviorMonitoring.switchTab('log')">
                                <i class="fas fa-list ml-2"></i>سجل التصرفات
                            </button>
                            <button class="module-tab-btn ${activeTab === 'form' ? 'active' : ''}" data-tab="form" onclick="BehaviorMonitoring.switchTab('form')">
                                <i class="fas fa-pen-to-square ml-2"></i>تسجيل تصرف
                            </button>
                        </div>
                    </div>
                </div>

                <div id="behavior-content" class="mt-6">
                    ${this.renderTabSkeleton(activeTab)}
                </div>
            `;

            this.setupEventListeners();
            // render active tab (sync) then bind events
            await this.switchTab(activeTab, { initial: true });
            
            // تحميل البيانات بشكل غير متزامن بعد عرض الواجهة
            setTimeout(() => {
                this.loadBehaviorDataAsync().then(() => {
                    // تحديث الواجهة بعد تحميل البيانات لضمان عدم بقاء الواجهة فارغة
                    const activeTab = this.state?.activeTab || 'log';
                    this.switchTab(activeTab, { silent: true }).catch(() => {
                        // في حالة الفشل، على الأقل تأكد من أن الواجهة ليست فارغة
                        this.refreshCurrentTab();
                    });
                }).catch(error => {
                    if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                        Utils.safeWarn('⚠️ تعذر تحميل بيانات مراقبة السلوك:', error);
                    } else {
                        console.warn('⚠️ تعذر تحميل بيانات مراقبة السلوك:', error);
                    }
                    // حتى في حالة الخطأ، تأكد من تحديث التبويب الحالي
                    this.refreshCurrentTab();
                });
            }, 100);
        } catch (error) {
            Utils.safeError('❌ خطأ في تحميل مديول مراقبة السلوكيات:', error);
            section.innerHTML = `
                <div class="section-header">
                    <div>
                        <h1 class="section-title">
                            <i class="fas fa-eye ml-3"></i>
                            مراقبة السلوكيات
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
                                <button onclick="BehaviorMonitoring.load()" class="btn-primary">
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

    async loadBehaviorDataAsync() {
        try {
            const behaviorResult = await GoogleIntegration.sendRequest({
                action: 'getAllBehaviors',
                data: {}
            }).catch(error => {
                const errorMsg = error.message || error.toString() || '';
                if (errorMsg.includes('انتهت مهلة الاتصال') || errorMsg.includes('timeout')) {
                    Utils.safeWarn('⚠️ انتهت مهلة الاتصال بالخادم');
                    return { success: false, data: [] };
                }
                Utils.safeWarn('⚠️ تعذر تحميل بيانات مراقبة السلوك:', error);
                return { success: false, data: [] };
            });

            // معالجة نتائج البيانات
            if (behaviorResult && behaviorResult.success && Array.isArray(behaviorResult.data)) {
                AppState.appData.behaviorMonitoring = behaviorResult.data;
                Utils.safeLog(`✅ تم تحميل ${behaviorResult.data.length} سجل من قاعدة البيانات`);
                
                // تحديث التبويب الحالي بعد تحميل البيانات
                this.refreshCurrentTab();
            }

            // حفظ البيانات محلياً
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            }
        } catch (error) {
            const errorMsg = error.message || error.toString() || '';
            Utils.safeError('❌ خطأ في تحميل بيانات مراقبة السلوك من قاعدة البيانات:', error);
            
            // عرض رسالة خطأ واضحة للمستخدم
            if (errorMsg.includes('انتهت مهلة الاتصال') || errorMsg.includes('timeout')) {
                Notification.error({
                    title: 'الربط مع الخلفية',
                    message: 'انتهت مهلة الاتصال بالخادم. سيتم استخدام البيانات المحلية.',
                    duration: 5000,
                    persistent: false
                });
            } else {
                Notification.warning('حدث خطأ في تحميل بعض البيانات. سيتم استخدام البيانات المحلية.');
            }
        }
    },

    renderTabSkeleton(tab) {
        if (tab === 'overview') return this.renderOverviewTab(true);
        if (tab === 'form') return this.renderFormTab(true);
        return this.renderLogTab(true);
    },

    getBehaviors() {
        if (!AppState?.appData?.behaviorMonitoring || !Array.isArray(AppState.appData.behaviorMonitoring)) return [];
        return AppState.appData.behaviorMonitoring;
    },

    parseDateSafe(value) {
        try {
            const d = value instanceof Date ? value : new Date(value);
            if (!d || Number.isNaN(d.getTime())) return null;
            return d;
        } catch (e) {
            return null;
        }
    },

    getBehaviorDate(behavior) {
        return behavior?.date || behavior?.createdAt || behavior?.updatedAt || null;
    },

    getBehaviorTypeBadgeClass(behaviorType) {
        if (behaviorType === 'إيجابي') return 'badge-success';
        if (behaviorType === 'سلبي') return 'badge-danger';
        return 'badge-secondary';
    },

    getRatingBadgeClass(rating) {
        if (rating === 'ممتاز') return 'badge-success';
        if (rating === 'جيد') return 'badge-primary';
        if (rating === 'مقبول') return 'badge-warning';
        if (rating === 'ضعيف') return 'badge-danger';
        return 'badge-secondary';
    },

    matchesSearch(behavior, q) {
        const query = (q || '').toString().trim().toLowerCase();
        if (!query) return true;
        const hay = [
            behavior?.isoCode,
            behavior?.employeeName,
            behavior?.employeeCode,
            behavior?.employeeNumber,
            behavior?.behaviorType,
            behavior?.rating,
            behavior?.description
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(query);
    },

    getFilteredBehaviors() {
        const all = this.getBehaviors();
        const filters = this.state?.filters || {};
        const behaviorType = (filters.behaviorType || '').toString().trim();
        const rating = (filters.rating || '').toString().trim();
        const q = (filters.search || '').toString();

        const from = filters.dateFrom ? this.parseDateSafe(filters.dateFrom) : null;
        const to = filters.dateTo ? this.parseDateSafe(filters.dateTo) : null;

        const filtered = all.filter((b) => {
            if (!this.matchesSearch(b, q)) return false;
            if (behaviorType && (b?.behaviorType || '') !== behaviorType) return false;
            if (rating && (b?.rating || '') !== rating) return false;

            const d = this.parseDateSafe(this.getBehaviorDate(b));
            if (from && (!d || d < from)) return false;
            if (to) {
                // include whole day for to
                const toEnd = new Date(to);
                toEnd.setHours(23, 59, 59, 999);
                if (!d || d > toEnd) return false;
            }

            return true;
        });

        const sort = this.state?.sort || 'date_desc';
        filtered.sort((a, b) => {
            const da = this.parseDateSafe(this.getBehaviorDate(a))?.getTime() || 0;
            const db = this.parseDateSafe(this.getBehaviorDate(b))?.getTime() || 0;
            return sort === 'date_asc' ? (da - db) : (db - da);
        });

        return filtered;
    },

    refreshCurrentTab() {
        const tab = this.state?.activeTab || 'log';
        if (tab === 'overview') {
            const container = document.getElementById('behavior-overview-container');
            if (container) container.innerHTML = this.renderOverviewTab(false);
            this.bindCurrentTabEvents();
            return;
        }
        if (tab === 'form') {
            const container = document.getElementById('behavior-form-container');
            if (container) container.innerHTML = this.renderFormTab(false);
            this.bindCurrentTabEvents();
            return;
        }
        // log
        const container = document.getElementById('behavior-log-container');
        if (container) container.innerHTML = this.renderLogTab(false);
        this.bindCurrentTabEvents();
    },

    async switchTab(tab, options = {}) {
        try {
            const nextTab = tab || 'log';
            this.state = this.state || {};
            this.state.activeTab = nextTab;

            // update active button style
            document.querySelectorAll('#behavior-monitoring-section .module-tab-btn').forEach((btn) => {
                const t = btn.getAttribute('data-tab');
                if (t === nextTab) btn.classList.add('active');
                else btn.classList.remove('active');
            });

            const content = document.getElementById('behavior-content');
            if (!content) return;

            if (nextTab === 'overview') content.innerHTML = this.renderOverviewTab(false);
            else if (nextTab === 'form') content.innerHTML = this.renderFormTab(false);
            else content.innerHTML = this.renderLogTab(false);

            this.bindCurrentTabEvents();

            // initial render: try show data quickly
            if (options?.initial && nextTab === 'log') {
                this.renderLogTable();
            }
        } catch (e) {
            Utils.safeError('❌ خطأ في تبديل تبويب مراقبة السلوكيات:', e);
        }
    },

    renderOverviewTab(isSkeleton = false) {
        const behaviors = this.getBehaviors();
        const total = behaviors.length;
        const positives = behaviors.filter(b => b?.behaviorType === 'إيجابي').length;
        const negatives = behaviors.filter(b => b?.behaviorType === 'سلبي').length;
        const last5 = [...behaviors].sort((a, b) => {
            const da = this.parseDateSafe(this.getBehaviorDate(a))?.getTime() || 0;
            const db = this.parseDateSafe(this.getBehaviorDate(b))?.getTime() || 0;
            return db - da;
        }).slice(0, 5);

        return `
            <div id="behavior-overview-container">
                <div class="content-card behavior-overview-card">
                    <div class="card-header">
                        <h2 class="card-title"><i class="fas fa-chart-line ml-2"></i>نظرة عامة</h2>
                    </div>
                    <div class="card-body">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div class="behavior-stat">
                                <div class="behavior-stat-label">إجمالي السجلات</div>
                                <div class="behavior-stat-value">${isSkeleton ? '—' : total}</div>
                            </div>
                            <div class="behavior-stat">
                                <div class="behavior-stat-label">تصرفات إيجابية</div>
                                <div class="behavior-stat-value text-green-700">${isSkeleton ? '—' : positives}</div>
                            </div>
                            <div class="behavior-stat">
                                <div class="behavior-stat-label">تصرفات سلبية</div>
                                <div class="behavior-stat-value text-red-700">${isSkeleton ? '—' : negatives}</div>
                            </div>
                        </div>

                        <div class="content-card behavior-mini-card">
                            <div class="card-header">
                                <h3 class="card-title"><i class="fas fa-clock ml-2"></i>آخر 5 تصرفات</h3>
                            </div>
                            <div class="card-body">
                                ${isSkeleton ? `
                                    <div class="empty-state"><p class="text-gray-500">جاري التحميل...</p></div>
                                ` : (last5.length ? `
                                    <div class="table-wrapper" style="overflow-x:auto;">
                                        <table class="data-table table-header-purple">
                                            <thead>
                                                <tr>
                                                    <th>ISO</th>
                                                    <th>الموظف</th>
                                                    <th>المصنع</th>
                                                    <th>الموقع الفرعي</th>
                                                    <th>نوع التصرف</th>
                                                    <th>التاريخ</th>
                                                    <th>التقييم</th>
                                                    <th class="text-center">إجراء</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${last5.map(b => `
                                                    <tr>
                                                        <td>${Utils.escapeHTML(b.isoCode || '')}</td>
                                                        <td>${Utils.escapeHTML(b.employeeName || '')}</td>
                                                        <td>${Utils.escapeHTML(b.factoryName || b.factory || '—')}</td>
                                                        <td>${Utils.escapeHTML(b.subLocationName || b.subLocation || '—')}</td>
                                                        <td><span class="badge ${this.getBehaviorTypeBadgeClass(b.behaviorType)}">${Utils.escapeHTML(b.behaviorType || '—')}</span></td>
                                                        <td>${this.getBehaviorDate(b) ? Utils.formatDate(this.getBehaviorDate(b)) : '—'}</td>
                                                        <td><span class="badge ${this.getRatingBadgeClass(b.rating)}">${Utils.escapeHTML(b.rating || '—')}</span></td>
                                                        <td class="text-center">
                                                            <button onclick="BehaviorMonitoring.viewBehavior('${b.id}')" class="btn-icon btn-icon-primary" title="عرض">
                                                                <i class="fas fa-eye"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                ` : `<div class="empty-state"><p class="text-gray-500">لا توجد تصرفات مسجلة</p></div>`)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderLogTab(isSkeleton = false) {
        const filters = this.state?.filters || {};
        const safe = (v) => Utils.escapeHTML((v ?? '').toString());

        return `
            <div id="behavior-log-container">
                <div class="content-card behavior-filters-card">
                    <div class="card-header">
                        <h2 class="card-title"><i class="fas fa-filter ml-2"></i>سجل التصرفات (بحث/فلترة)</h2>
                    </div>
                    <div class="card-body">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                            <div class="lg:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">بحث سريع</label>
                                <div class="relative">
                                    <input id="behavior-filter-search" type="text" class="form-input pr-10" placeholder="ISO / اسم / كود / وصف" value="${safe(filters.search)}">
                                    <i class="fas fa-search absolute top-3 right-3 text-gray-400"></i>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">نوع التصرف</label>
                                <select id="behavior-filter-type" class="form-input">
                                    <option value="">الكل</option>
                                    <option value="إيجابي" ${filters.behaviorType === 'إيجابي' ? 'selected' : ''}>إيجابي</option>
                                    <option value="سلبي" ${filters.behaviorType === 'سلبي' ? 'selected' : ''}>سلبي</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">التقييم</label>
                                <select id="behavior-filter-rating" class="form-input">
                                    <option value="">الكل</option>
                                    <option value="ممتاز" ${filters.rating === 'ممتاز' ? 'selected' : ''}>ممتاز</option>
                                    <option value="جيد" ${filters.rating === 'جيد' ? 'selected' : ''}>جيد</option>
                                    <option value="مقبول" ${filters.rating === 'مقبول' ? 'selected' : ''}>مقبول</option>
                                    <option value="ضعيف" ${filters.rating === 'ضعيف' ? 'selected' : ''}>ضعيف</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">من</label>
                                <input id="behavior-filter-from" type="date" class="form-input" value="${safe(filters.dateFrom)}">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">إلى</label>
                                <input id="behavior-filter-to" type="date" class="form-input" value="${safe(filters.dateTo)}">
                            </div>
                        </div>

                        <div class="flex flex-wrap items-center justify-between gap-2 mt-4">
                            <div class="text-sm text-gray-600">
                                <span class="badge badge-secondary" id="behavior-filter-count">${isSkeleton ? '—' : this.getFilteredBehaviors().length}</span>
                                <span>سجل (بعد الفلترة)</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <select id="behavior-sort" class="form-input" style="max-width: 220px;">
                                    <option value="date_desc" ${this.state?.sort === 'date_desc' ? 'selected' : ''}>الأحدث أولاً</option>
                                    <option value="date_asc" ${this.state?.sort === 'date_asc' ? 'selected' : ''}>الأقدم أولاً</option>
                                </select>
                                <button id="behavior-export-csv-btn" class="btn-success">
                                    <i class="fas fa-file-csv ml-2"></i>
                                    تصدير CSV
                                </button>
                                <button id="behavior-clear-filters-btn" class="btn-secondary">
                                    <i class="fas fa-eraser ml-2"></i>
                                    مسح الفلاتر
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="content-card mt-4">
                    <div class="card-header">
                        <h2 class="card-title"><i class="fas fa-table ml-2"></i>البيانات</h2>
                    </div>
                    <div class="card-body">
                        <div id="behavior-log-table-container">
                            ${isSkeleton ? `<div class="empty-state"><p class="text-gray-500">جاري التحميل...</p></div>` : this.renderLogTableHTML()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderLogTableHTML() {
        const behaviors = this.getFilteredBehaviors();
        if (!behaviors.length) {
            return `<div class="empty-state"><p class="text-gray-500">لا توجد نتائج مطابقة للفلاتر الحالية</p></div>`;
        }

        return `
            <div class="table-wrapper" style="overflow-x:auto;">
                <table class="data-table table-header-purple">
                    <thead>
                        <tr>
                            <th>كود ISO</th>
                            <th>اسم الموظف</th>
                            <th>المصنع</th>
                            <th>الموقع الفرعي</th>
                            <th>نوع التصرف</th>
                            <th>التاريخ</th>
                            <th>التقييم</th>
                            <th class="text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${behaviors.map(b => `
                            <tr>
                                <td>${Utils.escapeHTML(b.isoCode || '')}</td>
                                <td>
                                    <div class="flex flex-col">
                                        <span class="font-semibold">${Utils.escapeHTML(b.employeeName || '')}</span>
                                        <span class="text-xs text-gray-500">${Utils.escapeHTML(b.employeeCode || b.employeeNumber || '')}</span>
                                    </div>
                                </td>
                                <td>${Utils.escapeHTML(b.factoryName || b.factory || '—')}</td>
                                <td>${Utils.escapeHTML(b.subLocationName || b.subLocation || '—')}</td>
                                <td><span class="badge ${this.getBehaviorTypeBadgeClass(b.behaviorType)}">${Utils.escapeHTML(b.behaviorType || '—')}</span></td>
                                <td>${this.getBehaviorDate(b) ? Utils.formatDate(this.getBehaviorDate(b)) : '—'}</td>
                                <td><span class="badge ${this.getRatingBadgeClass(b.rating)}">${Utils.escapeHTML(b.rating || '—')}</span></td>
                                <td class="text-center">
                                    <div class="flex items-center justify-center gap-2">
                                        <button onclick="BehaviorMonitoring.viewBehavior('${b.id}')" class="btn-icon btn-icon-primary" title="عرض">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button onclick="BehaviorMonitoring.exportPDF('${b.id}')" class="btn-icon btn-icon-success" title="تصدير PDF">
                                            <i class="fas fa-file-pdf"></i>
                                        </button>
                                        <button onclick="BehaviorMonitoring.printReport('${b.id}')" class="btn-icon btn-icon-info" title="طباعة">
                                            <i class="fas fa-print"></i>
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

    renderLogTable() {
        const tableContainer = document.getElementById('behavior-log-table-container');
        if (tableContainer) tableContainer.innerHTML = this.renderLogTableHTML();
        const countEl = document.getElementById('behavior-filter-count');
        if (countEl) countEl.textContent = String(this.getFilteredBehaviors().length);
    },

    clearFilters() {
        this.state.filters = { search: '', behaviorType: '', rating: '', dateFrom: '', dateTo: '' };
        this.state.sort = 'date_desc';
        this.refreshCurrentTab();
    },

    exportLogCSV() {
        const rows = this.getFilteredBehaviors();
        if (!rows.length) {
            Notification.info('لا توجد بيانات لتصديرها');
            return;
        }

        const escapeCsv = (v) => {
            const s = (v ?? '').toString().replace(/\r?\n/g, ' ').trim();
            if (s.includes('"') || s.includes(',') || s.includes(';')) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };

        const header = ['ISO', 'EmployeeName', 'EmployeeCode', 'Department', 'Job', 'Factory', 'SubLocation', 'BehaviorType', 'Date', 'Rating', 'CorrectiveAction', 'CorrectiveActionDetails', 'Description'];
        const csv = [
            header.join(','),
            ...rows.map(b => [
                escapeCsv(b.isoCode || ''),
                escapeCsv(b.employeeName || ''),
                escapeCsv(b.employeeCode || b.employeeNumber || ''),
                escapeCsv(b.department || ''),
                escapeCsv(b.job || b.position || ''),
                escapeCsv(b.factoryName || b.factory || ''),
                escapeCsv(b.subLocationName || b.subLocation || ''),
                escapeCsv(b.behaviorType || ''),
                escapeCsv(this.getBehaviorDate(b) ? Utils.formatDate(this.getBehaviorDate(b)) : ''),
                escapeCsv(b.rating || ''),
                escapeCsv(b.correctiveAction || ''),
                escapeCsv(b.correctiveActionDetails || ''),
                escapeCsv(b.description || '')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BehaviorMonitoring_Log_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    },

    renderFormTab(isSkeleton = false) {
        const uid = `bhm-tab-${Date.now()}`;
        return `
            <div id="behavior-form-container">
                <div class="content-card behavior-form-card">
                    <div class="card-header">
                        <h2 class="card-title"><i class="fas fa-pen-to-square ml-2"></i>تسجيل تصرف</h2>
                    </div>
                    <div class="card-body">
                        ${isSkeleton ? `<div class="empty-state"><p class="text-gray-500">جاري التحميل...</p></div>` : this.getBehaviorFormHTML(null, uid, { inline: true })}
                    </div>
                </div>
            </div>
        `;
    },

    bindCurrentTabEvents() {
        // reset listeners for current tab
        if (this._eventListenersAbortController) {
            this._eventListenersAbortController.abort();
        }
        this._eventListenersAbortController = new AbortController();
        const signal = this._eventListenersAbortController.signal;

        const tab = this.state?.activeTab || 'log';
        if (tab === 'log') {
            const search = document.getElementById('behavior-filter-search');
            const type = document.getElementById('behavior-filter-type');
            const rating = document.getElementById('behavior-filter-rating');
            const from = document.getElementById('behavior-filter-from');
            const to = document.getElementById('behavior-filter-to');
            const sort = document.getElementById('behavior-sort');
            const clearBtn = document.getElementById('behavior-clear-filters-btn');
            const exportBtn = document.getElementById('behavior-export-csv-btn');

            const onAnyChange = () => {
                this.state.filters = this.state.filters || {};
                this.state.filters.search = (search?.value || '').toString();
                this.state.filters.behaviorType = (type?.value || '').toString();
                this.state.filters.rating = (rating?.value || '').toString();
                this.state.filters.dateFrom = (from?.value || '').toString();
                this.state.filters.dateTo = (to?.value || '').toString();
                this.state.sort = (sort?.value || 'date_desc').toString();
                this.renderLogTable();
            };

            search?.addEventListener('input', onAnyChange, { signal });
            type?.addEventListener('change', onAnyChange, { signal });
            rating?.addEventListener('change', onAnyChange, { signal });
            from?.addEventListener('change', onAnyChange, { signal });
            to?.addEventListener('change', onAnyChange, { signal });
            sort?.addEventListener('change', onAnyChange, { signal });
            clearBtn?.addEventListener('click', () => this.clearFilters(), { signal });
            exportBtn?.addEventListener('click', () => this.exportLogCSV(), { signal });

            // first render
            this.renderLogTable();
            return;
        }

        if (tab === 'form') {
            // bind inline form (we rendered with unique ids)
            const form = document.querySelector('#behavior-form-container form[data-behavior-form="true"]');
            const uid = form?.getAttribute('data-form-uid');
            if (form && uid) {
                this.bindBehaviorForm({ form, uid, data: null, modal: null, signal });
            }
        }
    },

    setupEventListeners() {
        // تنظيف timeout القديم إن وجد
        if (this._setupTimeoutId) {
            clearTimeout(this._setupTimeoutId);
        }

        this._setupTimeoutId = setTimeout(() => {
            const addBtn = document.getElementById('behavior-add-btn');
            if (addBtn) addBtn.addEventListener('click', () => this.showForm(), { passive: true });

            const refreshBtn = document.getElementById('behavior-refresh-btn');
            if (refreshBtn) refreshBtn.addEventListener('click', () => {
                this.loadBehaviorDataAsync();
                Notification.success('تم تحديث البيانات');
            }, { passive: true });
        }, 50);
    },

    getBehaviorFormHTML(data = null, uid, options = {}) {
        const ids = {
            employeeCode: `${uid}-employee-code`,
            employeeName: `${uid}-employee-name`,
            dropdown: `${uid}-employee-dropdown`,
            department: `${uid}-department`,
            job: `${uid}-job`,
            factory: `${uid}-factory`,
            subLocation: `${uid}-sublocation`,
            photoInput: `${uid}-photo-input`,
            photoPreview: `${uid}-photo-preview`,
            photoImg: `${uid}-photo-img`,
            behaviorType: `${uid}-type`,
            behaviorDate: `${uid}-date`,
            behaviorRating: `${uid}-rating`,
            correctiveAction: `${uid}-corrective-action`,
            correctiveActionDetails: `${uid}-corrective-action-details`,
            description: `${uid}-description`,
            saveBtn: `${uid}-save-btn`
        };

        const dateValue = data?.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const inline = !!options.inline;

        const sites = this.getSiteOptions();
        const selectedFactory = data?.factory || data?.factoryId || data?.siteId || '';
        const selectedSub = data?.subLocation || data?.subLocationId || data?.location || '';
        const resolvedFactoryId =
            sites.find(s => s.id === selectedFactory)?.id ||
            sites.find(s => s.name === selectedFactory)?.id ||
            selectedFactory;
        const places = this.getPlaceOptions(resolvedFactoryId);
        const resolvedSubId =
            places.find(p => p.id === selectedSub)?.id ||
            places.find(p => p.name === selectedSub)?.id ||
            selectedSub;
        const isNegative = (data?.behaviorType || '') === 'سلبي';

        return `
            <div class="behavior-form-wrapper ${inline ? 'behavior-form-inline' : 'behavior-form-modal'}" data-behavior-type="${Utils.escapeHTML(data?.behaviorType || '')}">
                <form data-behavior-form="true" data-form-uid="${uid}" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="${ids.employeeCode}" class="block text-sm font-semibold text-gray-700 mb-2">الكود الوظيفي *</label>
                            <input type="text" id="${ids.employeeCode}" required class="form-input"
                                value="${Utils.escapeHTML(data?.employeeCode || data?.employeeNumber || '')}" placeholder="أدخل الكود الوظيفي">
                        </div>
                        <div>
                            <label for="${ids.employeeName}" class="block text-sm font-semibold text-gray-700 mb-2">اسم الموظف *</label>
                            <div class="relative">
                                <input type="text" id="${ids.employeeName}" required class="form-input"
                                    value="${Utils.escapeHTML(data?.employeeName || '')}" placeholder="ابحث بالاسم أو الكود الوظيفي" autocomplete="off">
                                <div id="${ids.dropdown}" class="hse-lookup-dropdown absolute z-50 hidden w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"></div>
                            </div>
                        </div>
                        <div>
                            <label for="${ids.department}" class="block text-sm font-semibold text-gray-700 mb-2">القسم *</label>
                            <input type="text" id="${ids.department}" required class="form-input"
                                value="${Utils.escapeHTML(data?.department || data?.employeeDepartment || '')}" placeholder="يتم تعبئته تلقائياً من الموظف (يمكن التعديل)">
                        </div>
                        <div>
                            <label for="${ids.job}" class="block text-sm font-semibold text-gray-700 mb-2">الوظيفة *</label>
                            <input type="text" id="${ids.job}" required class="form-input"
                                value="${Utils.escapeHTML(data?.job || data?.position || data?.employeeJob || '')}" placeholder="يتم تعبئته تلقائياً من الموظف (يمكن التعديل)">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label for="${ids.behaviorType}" class="block text-sm font-semibold text-gray-700 mb-2">نوع التصرف *</label>
                            <select id="${ids.behaviorType}" required class="form-input">
                                <option value="">اختر النوع</option>
                                <option value="إيجابي" ${data?.behaviorType === 'إيجابي' ? 'selected' : ''}>إيجابي</option>
                                <option value="سلبي" ${data?.behaviorType === 'سلبي' ? 'selected' : ''}>سلبي</option>
                            </select>
                            <div class="mt-2">
                                <span class="badge ${this.getBehaviorTypeBadgeClass(data?.behaviorType)}" id="${uid}-type-badge">${Utils.escapeHTML(data?.behaviorType || '—')}</span>
                            </div>
                        </div>
                        <div>
                            <label for="${ids.behaviorDate}" class="block text-sm font-semibold text-gray-700 mb-2">التاريخ *</label>
                            <input type="date" id="${ids.behaviorDate}" required class="form-input" value="${dateValue}">
                        </div>
                        <div>
                            <label for="${ids.behaviorRating}" class="block text-sm font-semibold text-gray-700 mb-2">التقييم *</label>
                            <select id="${ids.behaviorRating}" required class="form-input">
                                <option value="">اختر التقييم</option>
                                <option value="ممتاز" ${data?.rating === 'ممتاز' ? 'selected' : ''}>ممتاز</option>
                                <option value="جيد" ${data?.rating === 'جيد' ? 'selected' : ''}>جيد</option>
                                <option value="مقبول" ${data?.rating === 'مقبول' ? 'selected' : ''}>مقبول</option>
                                <option value="ضعيف" ${data?.rating === 'ضعيف' ? 'selected' : ''}>ضعيف</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="${ids.factory}" class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-industry ml-2"></i>
                                المصنع *
                            </label>
                            <select id="${ids.factory}" required class="form-input">
                                <option value="">اختر المصنع</option>
                                ${sites.map(site => `
                                    <option value="${site.id}" ${(resolvedFactoryId === site.id || selectedFactory === site.name) ? 'selected' : ''}>${Utils.escapeHTML(site.name)}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div>
                            <label for="${ids.subLocation}" class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-map-marker-alt ml-2"></i>
                                الموقع الفرعي *
                            </label>
                            <select id="${ids.subLocation}" required class="form-input">
                                <option value="">اختر الموقع الفرعي</option>
                                ${places.map(place => `
                                    <option value="${place.id}" ${(resolvedSubId === place.id || selectedSub === place.name) ? 'selected' : ''}>${Utils.escapeHTML(place.name)}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>

                    <div id="${uid}-negative-section" class="content-card" style="border: 1px dashed rgba(239, 68, 68, 0.35); ${isNegative ? '' : 'display:none;'}">
                        <div class="card-header">
                            <h3 class="card-title"><i class="fas fa-triangle-exclamation ml-2"></i>إجراء تصحيحي (للتصرف السلبي)</h3>
                        </div>
                        <div class="card-body space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">الإجراء التصحيحي *</label>
                                    <select id="${ids.correctiveAction}" class="form-input" ${isNegative ? 'required' : ''}>
                                        <option value="">اختر الإجراء</option>
                                        ${this.NEGATIVE_ACTIONS.map(a => `
                                            <option value="${Utils.escapeHTML(a)}" ${data?.correctiveAction === a ? 'selected' : ''}>${Utils.escapeHTML(a)}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">تفاصيل إضافية (اختياري)</label>
                                    <input type="text" id="${ids.correctiveActionDetails}" class="form-input"
                                        value="${Utils.escapeHTML(data?.correctiveActionDetails || '')}" placeholder="مثال: تدريب على SOP-01 / إنذار رقم...">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label for="${ids.photoInput}" class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-image ml-2"></i>
                            صورة (غير إلزامي)
                        </label>
                        <input type="file" id="${ids.photoInput}" accept="image/*" class="form-input">
                        <div id="${ids.photoPreview}" class="mt-2 ${data?.photo ? '' : 'hidden'}">
                            <img src="${data?.photo || ''}" alt="صورة" class="w-32 h-32 object-cover rounded border" id="${ids.photoImg}">
                            <button type="button" class="mt-1 text-xs text-red-600" data-action="clear-photo">حذف الصورة</button>
                        </div>
                    </div>

                    <div>
                        <label for="${ids.description}" class="block text-sm font-semibold text-gray-700 mb-2">الوصف *</label>
                        <textarea id="${ids.description}" required class="form-input" rows="4" placeholder="وصف التصرف">${Utils.escapeHTML(data?.description || '')}</textarea>
                    </div>

                    <div class="flex items-center justify-end gap-2 pt-2">
                        ${inline ? '' : '<button type="button" class="btn-secondary" data-action="cancel-form">إلغاء</button>'}
                        <button type="button" id="${ids.saveBtn}" class="btn-primary">
                            <i class="fas fa-save ml-2"></i>
                            حفظ
                        </button>
                    </div>
                </form>
            </div>
        `;
    },

    bindBehaviorForm({ form, uid, data, modal, signal }) {
        // Employee autocomplete
        if (typeof EmployeeHelper !== 'undefined') {
            try {
                EmployeeHelper.setupAutocomplete(`${uid}-employee-name`, (employee) => {
                    if (employee) {
                        const codeEl = document.getElementById(`${uid}-employee-code`);
                        const nameEl = document.getElementById(`${uid}-employee-name`);
                        const depEl = document.getElementById(`${uid}-department`);
                        const jobEl = document.getElementById(`${uid}-job`);
                        if (codeEl) codeEl.value = employee.code || '';
                        if (nameEl) nameEl.value = employee.name || '';
                        if (depEl && (employee.department || employee.employeeDepartment)) depEl.value = employee.department || employee.employeeDepartment || '';
                        if (jobEl && (employee.job || employee.position || employee.title)) jobEl.value = employee.job || employee.position || employee.title || '';
                    }
                });
                EmployeeHelper.setupEmployeeCodeSearch(`${uid}-employee-code`, `${uid}-employee-name`);
            } catch (e) {
                Utils.safeWarn('⚠️ تعذر تفعيل البحث عن الموظف:', e);
            }
        }

        // مزامنة القسم/الوظيفة عند تغيير الكود/الاسم (في حال لم يعيد EmployeeHelper تفاصيل كافية)
        const syncEmployeeMeta = () => {
            try {
                const code = (document.getElementById(`${uid}-employee-code`)?.value || '').trim();
                const name = (document.getElementById(`${uid}-employee-name`)?.value || '').trim();
                const employees = Array.isArray(AppState?.appData?.employees) ? AppState.appData.employees : [];
                const emp = employees.find(e =>
                    (code && ((e.employeeNumber && e.employeeNumber === code) || (e.sapId && e.sapId === code))) ||
                    (name && (e.name === name))
                );
                if (!emp) return;
                const depEl = document.getElementById(`${uid}-department`);
                const jobEl = document.getElementById(`${uid}-job`);
                if (depEl && !depEl.value) depEl.value = emp.department || emp.employeeDepartment || '';
                if (jobEl && !jobEl.value) jobEl.value = emp.job || emp.position || emp.title || '';
            } catch (e) {
                // ignore
            }
        };
        document.getElementById(`${uid}-employee-code`)?.addEventListener('blur', syncEmployeeMeta, { signal });
        document.getElementById(`${uid}-employee-name`)?.addEventListener('blur', syncEmployeeMeta, { signal });

        // Photo preview
        const photoInput = document.getElementById(`${uid}-photo-input`);
        const photoPreview = document.getElementById(`${uid}-photo-preview`);
        const photoImg = document.getElementById(`${uid}-photo-img`);

        if (photoInput && photoPreview && photoImg) {
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                    Notification.error('حجم الصورة كبير جداً. الحد الأقصى 2MB');
                    photoInput.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = (ev) => {
                    photoImg.src = ev.target.result;
                    photoPreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }, { signal });
        }

        // Clear photo
        form.querySelector('[data-action="clear-photo"]')?.addEventListener('click', () => {
            const inp = document.getElementById(`${uid}-photo-input`);
            const preview = document.getElementById(`${uid}-photo-preview`);
            if (inp) inp.value = '';
            if (preview) preview.classList.add('hidden');
        }, { signal });

        // Theme badge + header tint
        const typeSelect = document.getElementById(`${uid}-type`);
        const typeBadge = document.getElementById(`${uid}-type-badge`);
        const wrapper = form.closest('.behavior-form-wrapper') || form.parentElement;
        const negativeSection = document.getElementById(`${uid}-negative-section`);
        const correctiveActionEl = document.getElementById(`${uid}-corrective-action`);
        const applyType = (t) => {
            if (wrapper) wrapper.setAttribute('data-behavior-type', t || '');
            if (typeBadge) {
                typeBadge.className = `badge ${this.getBehaviorTypeBadgeClass(t)}`;
                typeBadge.textContent = t || '—';
            }
            const modalContent = modal?.querySelector?.('.behavior-modal');
            if (modalContent) modalContent.setAttribute('data-behavior-type', t || '');

            // إظهار/إخفاء قسم الإجراء التصحيحي للتصرف السلبي
            const isNegative = (t || '') === 'سلبي';
            if (negativeSection) negativeSection.style.display = isNegative ? '' : 'none';
            if (correctiveActionEl) {
                if (isNegative) correctiveActionEl.setAttribute('required', 'required');
                else correctiveActionEl.removeAttribute('required');
            }
        };
        applyType(typeSelect?.value || data?.behaviorType || '');
        typeSelect?.addEventListener('change', () => applyType(typeSelect.value), { signal });

        // ربط المصنع -> تحديث المواقع الفرعية
        const factoryEl = document.getElementById(`${uid}-factory`);
        const subEl = document.getElementById(`${uid}-sublocation`);
        const refreshPlaces = () => {
            if (!factoryEl || !subEl) return;
            const factoryId = factoryEl.value;
            const places = this.getPlaceOptions(factoryId);
            const prev = subEl.value;
            subEl.innerHTML = `
                <option value="">اختر الموقع الفرعي</option>
                ${places.map(p => `<option value="${p.id}">${Utils.escapeHTML(p.name)}</option>`).join('')}
            `;
            if (prev && places.some(p => p.id === prev)) subEl.value = prev;
        };
        factoryEl?.addEventListener('change', refreshPlaces, { signal });

        // Cancel (modal)
        form.querySelector('[data-action="cancel-form"]')?.addEventListener('click', () => modal?.remove(), { signal });

        // Save
        const saveBtn = document.getElementById(`${uid}-save-btn`);
        saveBtn?.addEventListener('click', () => this.handleSubmit({ uid, form, editId: data?.id || null, modal }), { signal });
    },

    async showForm(data = null) {
        try {
            if (typeof Permissions !== 'undefined' && typeof Permissions.ensureFormSettingsState === 'function') {
                await Permissions.ensureFormSettingsState();
            }
        } catch (e) {
            // متابعة عرض النموذج حتى مع فشل التحميل
        }
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const uid = `bhm-modal-${Date.now()}`;
        modal.innerHTML = `
            <div class="modal-content behavior-modal" data-behavior-type="${Utils.escapeHTML(data?.behaviorType || '')}" style="max-width: 760px;">
                <div class="modal-header">
                    <h2 class="modal-title">${data ? 'تعديل التصرف' : 'تسجيل تصرف جديد'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${this.getBehaviorFormHTML(data, uid, { inline: false })}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // bind form in modal with isolated listeners
        if (this._modalAbortController) this._modalAbortController.abort();
        this._modalAbortController = new AbortController();
        const signal = this._modalAbortController.signal;

        const form = modal.querySelector('form[data-behavior-form="true"]');
        if (form) this.bindBehaviorForm({ form, uid, data, modal, signal });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        }, { signal });
    },

    async convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    async handleSubmit({ uid, form, editId = null, modal }) {
        // معالجة الصورة
        let photoBase64 = editId ? (this.getBehaviors().find(b => b.id === editId)?.photo || '') : '';
        const photoInput = document.getElementById(`${uid}-photo-input`);
        if (photoInput && photoInput.files.length > 0) {
            const file = photoInput.files[0];
            if (file.size > 2 * 1024 * 1024) {
                Notification.error('حجم الصورة كبير جداً. الحد الأقصى 2MB');
                return;
            }
            photoBase64 = await this.convertImageToBase64(file);
        }

        const employeeCode = (document.getElementById(`${uid}-employee-code`)?.value || '').trim();
        const employeeName = (document.getElementById(`${uid}-employee-name`)?.value || '').trim();
        const employees = Array.isArray(AppState?.appData?.employees) ? AppState.appData.employees : [];
        const employee = employees.find(e =>
            (e.employeeNumber && e.employeeNumber === employeeCode) ||
            (e.sapId && e.sapId === employeeCode) ||
            e.name === employeeName
        );

        // فحص العناصر قبل الاستخدام
        const behaviorTypeEl = document.getElementById(`${uid}-type`);
        const behaviorDateEl = document.getElementById(`${uid}-date`);
        const behaviorRatingEl = document.getElementById(`${uid}-rating`);
        const behaviorDescriptionEl = document.getElementById(`${uid}-description`);
        const departmentEl = document.getElementById(`${uid}-department`);
        const jobEl = document.getElementById(`${uid}-job`);
        const factoryEl = document.getElementById(`${uid}-factory`);
        const subEl = document.getElementById(`${uid}-sublocation`);
        const correctiveActionEl = document.getElementById(`${uid}-corrective-action`);
        const correctiveActionDetailsEl = document.getElementById(`${uid}-corrective-action-details`);
        
        if (!behaviorTypeEl || !behaviorDateEl || !behaviorRatingEl || !behaviorDescriptionEl || !departmentEl || !jobEl || !factoryEl || !subEl) {
            Notification.error('بعض الحقول المطلوبة غير موجودة. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
            return;
        }

        // تحقق إضافي: عند التصرف السلبي يجب إدخال إجراء تصحيحي
        const isNegative = (behaviorTypeEl.value || '') === 'سلبي';
        if (isNegative && (!correctiveActionEl || !correctiveActionEl.value)) {
            Notification.error('يرجى اختيار الإجراء التصحيحي للتصرف السلبي');
            return;
        }

        const formData = {
            id: editId || Utils.generateId('BEHAV'),
            isoCode: generateISOCode('BEH', AppState.appData.behaviorMonitoring),
            employeeId: employee?.id || '',
            employeeCode: employeeCode,
            employeeNumber: employeeCode,
            employeeName: employeeName,
            department: (departmentEl.value || '').trim(),
            job: (jobEl.value || '').trim(),
            factory: (factoryEl.value || '').trim(),
            factoryId: factoryEl.value ? String(factoryEl.value).trim() : null,
            factoryName: this.resolveSiteName(factoryEl.value),
            subLocation: (subEl.value || '').trim(),
            subLocationId: subEl.value ? String(subEl.value).trim() : null,
            subLocationName: this.resolvePlaceName(subEl.value, factoryEl.value),
            photo: photoBase64,
            behaviorType: behaviorTypeEl.value,
            date: new Date(behaviorDateEl.value).toISOString(),
            rating: behaviorRatingEl.value,
            correctiveAction: isNegative ? (correctiveActionEl?.value || '') : '',
            correctiveActionDetails: isNegative ? ((correctiveActionDetailsEl?.value || '').trim()) : '',
            description: behaviorDescriptionEl.value.trim(),
            createdAt: editId ? this.getBehaviors().find(b => b.id === editId)?.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        Loading.show();
        try {
            if (editId) {
                const index = AppState.appData.behaviorMonitoring.findIndex(b => b.id === editId);
                if (index !== -1) AppState.appData.behaviorMonitoring[index] = formData;
                Notification.success('تم تحديث التصرف بنجاح');
            } else {
                AppState.appData.behaviorMonitoring.push(formData);
                Notification.success('تم تسجيل التصرف بنجاح');
            }

            // حفظ البيانات باستخدام window.DataManager
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            } else {
                Utils.safeWarn('⚠️ DataManager غير متاح - لم يتم حفظ البيانات');
            }

            // حفظ تلقائي في قاعدة البيانات
            await GoogleIntegration.autoSave('BehaviorMonitoring', AppState.appData.behaviorMonitoring);

            Loading.hide();
            if (modal) modal.remove();
            this.refreshCurrentTab();
        } catch (error) {
            Loading.hide();
            Notification.error('حدث خطأ: ' + error.message);
        }
    },

    async viewBehavior(id) {
        const behavior = AppState.appData.behaviorMonitoring.find(b => b.id === id);
        if (!behavior) {
            Notification.error('التصرف غير موجود');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content behavior-modal" style="max-width: 760px;">
                <div class="modal-header">
                    <h2 class="modal-title">تفاصيل التصرف</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="text-sm font-semibold text-gray-600">كود ISO</label>
                            <div class="text-gray-800">${Utils.escapeHTML(behavior.isoCode || '')}</div>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">الكود الوظيفي</label>
                            <div class="text-gray-800">${Utils.escapeHTML(behavior.employeeCode || behavior.employeeNumber || '')}</div>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">اسم الموظف</label>
                            <div class="text-gray-800">${Utils.escapeHTML(behavior.employeeName || '')}</div>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">القسم</label>
                            <div class="text-gray-800">${Utils.escapeHTML(behavior.department || behavior.employeeDepartment || '—')}</div>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">الوظيفة</label>
                            <div class="text-gray-800">${Utils.escapeHTML(behavior.job || behavior.position || '—')}</div>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">المصنع</label>
                            <div class="text-gray-800">${Utils.escapeHTML(behavior.factoryName || behavior.factory || '—')}</div>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">الموقع الفرعي</label>
                            <div class="text-gray-800">${Utils.escapeHTML(behavior.subLocationName || behavior.subLocation || '—')}</div>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">نوع التصرف</label>
                            <div class="text-gray-800"><span class="badge ${this.getBehaviorTypeBadgeClass(behavior.behaviorType)}">${Utils.escapeHTML(behavior.behaviorType || '—')}</span></div>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">التاريخ</label>
                            <div class="text-gray-800">${this.getBehaviorDate(behavior) ? Utils.formatDate(this.getBehaviorDate(behavior)) : '—'}</div>
                        </div>
                        <div>
                            <label class="text-sm font-semibold text-gray-600">التقييم</label>
                            <div class="text-gray-800"><span class="badge ${this.getRatingBadgeClass(behavior.rating)}">${Utils.escapeHTML(behavior.rating || '—')}</span></div>
                        </div>
                        <div class="md:col-span-2">
                            <label class="text-sm font-semibold text-gray-600">الوصف</label>
                            <div class="text-gray-800 whitespace-pre-line">${Utils.escapeHTML(behavior.description || '')}</div>
                        </div>
                        ${(behavior.behaviorType === 'سلبي' && (behavior.correctiveAction || behavior.correctiveActionDetails)) ? `
                            <div class="md:col-span-2">
                                <label class="text-sm font-semibold text-gray-600">الإجراء التصحيحي</label>
                                <div class="text-gray-800">
                                    <span class="badge badge-danger">${Utils.escapeHTML(behavior.correctiveAction || '—')}</span>
                                    ${behavior.correctiveActionDetails ? `<div class="text-sm text-gray-600 mt-2">${Utils.escapeHTML(behavior.correctiveActionDetails)}</div>` : ''}
                                </div>
                            </div>
                        ` : ''}
                        ${behavior.photo ? `
                            <div class="md:col-span-2">
                                <label class="text-sm font-semibold text-gray-600">الصورة</label>
                                <div class="mt-2">
                                    <img src="${behavior.photo}" alt="صورة" class="w-64 h-64 object-cover rounded border">
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إغلاق</button>
                    <button type="button" onclick="BehaviorMonitoring.exportPDF('${behavior.id}');" class="btn-secondary">
                        <i class="fas fa-file-pdf ml-2"></i>تصدير PDF
                    </button>
                    <button type="button" onclick="BehaviorMonitoring.printReport('${behavior.id}');" class="btn-secondary">
                        <i class="fas fa-print ml-2"></i>طباعة
                    </button>
                    <button type="button" onclick="BehaviorMonitoring.showForm(${JSON.stringify(behavior).replace(/"/g, '&quot;')}); this.closest('.modal-overlay').remove();" class="btn-primary">تعديل</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async exportPDF(id) {
        const behavior = AppState.appData.behaviorMonitoring.find(b => b.id === id);
        if (!behavior) {
            Notification.error('التصرف غير موجود');
            return;
        }

        try {
            Loading.show();
            const formCode = behavior.isoCode || `BEH-${behavior.id?.substring(0, 8) || 'UNKNOWN'}`;
            const formTitle = 'تقرير مراقبة التصرفات';

            const content = `
                <table>
                    <tr><th>كود ISO</th><td>${Utils.escapeHTML(behavior.isoCode || '')}</td></tr>
                    <tr><th>الكود الوظيفي</th><td>${Utils.escapeHTML(behavior.employeeCode || behavior.employeeNumber || '')}</td></tr>
                    <tr><th>اسم الموظف</th><td>${Utils.escapeHTML(behavior.employeeName || '')}</td></tr>
                    <tr><th>القسم</th><td>${Utils.escapeHTML(behavior.department || behavior.employeeDepartment || '')}</td></tr>
                    <tr><th>الوظيفة</th><td>${Utils.escapeHTML(behavior.job || behavior.position || '')}</td></tr>
                    <tr><th>المصنع</th><td>${Utils.escapeHTML(behavior.factoryName || behavior.factory || '')}</td></tr>
                    <tr><th>الموقع الفرعي</th><td>${Utils.escapeHTML(behavior.subLocationName || behavior.subLocation || '')}</td></tr>
                    <tr><th>نوع التصرف</th><td>${Utils.escapeHTML(behavior.behaviorType || '')}</td></tr>
                    <tr><th>التاريخ</th><td>${Utils.formatDate(behavior.date)}</td></tr>
                    <tr><th>التقييم</th><td>${Utils.escapeHTML(behavior.rating || '')}</td></tr>
                    ${(behavior.behaviorType === 'سلبي' && (behavior.correctiveAction || behavior.correctiveActionDetails)) ? `
                        <tr><th>الإجراء التصحيحي</th><td>${Utils.escapeHTML(behavior.correctiveAction || '')}</td></tr>
                        <tr><th>تفاصيل الإجراء</th><td>${Utils.escapeHTML(behavior.correctiveActionDetails || '')}</td></tr>
                    ` : ''}
                    <tr><th colspan="2">الوصف</th></tr>
                    <tr><td colspan="2">${Utils.escapeHTML(behavior.description || '')}</td></tr>
                </table>
                ${behavior.photo ? `
                <div class="section-title">صورة التصرف:</div>
                <div style="text-align: center; margin: 20px 0;">
                    <img src="${behavior.photo}" alt="صورة التصرف" style="max-width: 100%; max-height: 400px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                ` : ''}
            `;

            const htmlContent = typeof FormHeader !== 'undefined' && FormHeader.generatePDFHTML
                ? FormHeader.generatePDFHTML(formCode, formTitle, content, false, true, { version: '1.0' }, behavior.createdAt, behavior.updatedAt)
                : `<html><body>${content}</body></html>`;

            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.print();
                        Loading.hide();
                    }, 500);
                };
            } else {
                Loading.hide();
                Notification.error('يرجى السماح بالنوافذ المنبثقة');
            }
        } catch (error) {
            Loading.hide();
            Notification.error('حدث خطأ في تصدير PDF: ' + error.message);
        }
    },

    async printReport(id) {
        await this.exportPDF(id);
    },

    /**
     * تنظيف جميع الموارد عند إلغاء تحميل الموديول
     * يمنع تسريبات الذاكرة (Memory Leaks)
     */
    cleanup() {
        try {
            if (typeof Utils !== 'undefined' && Utils.safeLog) {
                Utils.safeLog('🧹 تنظيف موارد BehaviorMonitoring module...');
            }

            // تنظيف event listeners
            if (this._eventListenersAbortController) {
                this._eventListenersAbortController.abort();
                this._eventListenersAbortController = null;
            }

            // تنظيف listeners الخاصة بالمودالات
            if (this._modalAbortController) {
                this._modalAbortController.abort();
                this._modalAbortController = null;
            }

            // تنظيف timeout
            if (this._setupTimeoutId) {
                clearTimeout(this._setupTimeoutId);
                this._setupTimeoutId = null;
            }

            if (typeof Utils !== 'undefined' && Utils.safeLog) {
                Utils.safeLog('✅ تم تنظيف موارد BehaviorMonitoring module');
            }
        } catch (error) {
            if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                Utils.safeWarn('⚠️ خطأ في تنظيف BehaviorMonitoring module:', error);
            }
        }
    }
};

// ===== Export module to global scope =====
// تصدير الموديول إلى window فوراً لضمان توافره
(function () {
    'use strict';
    try {
        if (typeof window !== 'undefined' && typeof BehaviorMonitoring !== 'undefined') {
            window.BehaviorMonitoring = BehaviorMonitoring;
            
            // إشعار عند تحميل الموديول بنجاح
            if (typeof AppState !== 'undefined' && AppState.debugMode && typeof Utils !== 'undefined' && Utils.safeLog) {
                Utils.safeLog('✅ BehaviorMonitoring module loaded and available on window.BehaviorMonitoring');
            }
        }
    } catch (error) {
        console.error('❌ خطأ في تصدير BehaviorMonitoring:', error);
        // محاولة التصدير مرة أخرى حتى في حالة الخطأ
        if (typeof window !== 'undefined' && typeof BehaviorMonitoring !== 'undefined') {
            try {
                window.BehaviorMonitoring = BehaviorMonitoring;
            } catch (e) {
                console.error('❌ فشل تصدير BehaviorMonitoring:', e);
            }
        }
    }
})();