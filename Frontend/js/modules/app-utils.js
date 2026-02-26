/* ========================================
   نظام السلامة المهنية - أمريكانا HSE
   app-utils.js - الدوال المساعدة والثوابت
   ======================================== */

// معالجة أخطاء Chrome Extensions
(function () {
    'use strict';

    // قمع أخطاء runtime.lastError من Chrome Extensions بشكل شامل
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        try {
            // إعادة تعريف chrome.runtime.lastError
            let lastErrorValue = null;
            Object.defineProperty(chrome.runtime, 'lastError', {
                get: function () {
                    const error = chrome.runtime.lastError;
                    if (error) {
                        const msg = String(error.message || '');
                        if (msg.includes('message port closed') ||
                            msg.includes('message channel closed') ||
                            msg.includes('asynchronous response') ||
                            msg.includes('Receiving end does not exist') ||
                            msg.includes('Could not establish connection') ||
                            msg.includes('Extension context invalidated')) {
                            return null; // تجاهل هذه الأخطاء
                        }
                    }
                    return error;
                },
                set: function (value) {
                    lastErrorValue = value;
                },
                configurable: true,
                enumerable: true
            });
        } catch (e) {
            // إذا فشل إعادة التعريف، نتجاهل
        }

        // قمع أخطاء runtime.lastError في console
        const originalError = console.error;
        console.error = function (...args) {
            if (args.length > 0) {
                const firstArg = String(args[0] || '');
                const allArgs = args.map(arg => String(arg || '')).join(' ');
                if (firstArg.includes('runtime.lastError') ||
                    firstArg.includes('message port closed') ||
                    firstArg.includes('message channel closed') ||
                    firstArg.includes('asynchronous response') ||
                    firstArg.includes('Receiving end does not exist') ||
                    firstArg.includes('Could not establish connection') ||
                    allArgs.includes('message port closed') ||
                    allArgs.includes('message channel closed') ||
                    allArgs.includes('asynchronous response')) {
                    return; // تجاهل هذه الأخطاء
                }
            }
            originalError.apply(console, args);
        };
    }

    // قمع أخطاء CSP المتعلقة بـ source maps و frame-ancestors
    const originalError = window.onerror;
    window.onerror = function (msg, url, line, col, error) {
        if (msg && (
            typeof msg === 'string' && (
                msg.includes('.map') ||
                msg.includes('sourcemap') ||
                msg.includes('Content Security Policy') ||
                msg.includes('frame-ancestors') ||
                msg.includes('runtime.lastError') ||
                msg.includes('message port closed') ||
                msg.includes('message channel closed') ||
                msg.includes('asynchronous response') ||
                msg.includes('Receiving end does not exist') ||
                msg.includes('Could not establish connection')
            )
        )) {
            return true; // منع عرض الخطأ
        }
        if (originalError) {
            return originalError.apply(this, arguments);
        }
        return false;
    };

    // قمع أخطاء unhandled promise rejections المتعلقة بـ Chrome Extensions
    window.addEventListener('unhandledrejection', function (event) {
        const reason = event.reason;
        if (reason && (
            (typeof reason === 'string' && (
                reason.includes('runtime.lastError') ||
                reason.includes('message port closed') ||
                reason.includes('message channel closed') ||
                reason.includes('asynchronous response') ||
                reason.includes('Receiving end does not exist')
            )) ||
            (reason && reason.message && (
                reason.message.includes('runtime.lastError') ||
                reason.message.includes('message port closed') ||
                reason.message.includes('message channel closed') ||
                reason.message.includes('asynchronous response') ||
                reason.message.includes('Receiving end does not exist')
            ))
        )) {
            event.preventDefault();
            return false;
        }
    });
})();


// ===== Permissions System =====

// تعريف الصلاحيات التفصيلية لكل مديول
const MODULE_DETAILED_PERMISSIONS = {
    'incidents': {
        label: 'صلاحيات مديول الحوادث',
        permissions: [
            { key: 'registry', label: 'سجل الحوادث', icon: 'fa-book' },
            { key: 'detailed-log', label: 'السجل التفصيلي', icon: 'fa-list-alt' },
            { key: 'incidents-list', label: 'قائمة الحوادث', icon: 'fa-list' },
            { key: 'annual-log', label: 'السجل السنوي', icon: 'fa-calendar-alt' },
            { key: 'analysis', label: 'التحليل', icon: 'fa-chart-line' },
            { key: 'approvals', label: 'الموافقات', icon: 'fa-check-circle' },
            { key: 'safety-alerts', label: 'تنبيهات السلامة', icon: 'fa-bell' }
        ]
    },
    'clinic': {
        label: 'صلاحيات مديول العيادة',
        permissions: [
            { key: 'visits', label: 'الزيارات', icon: 'fa-user-md' },
            { key: 'medications', label: 'الأدوية', icon: 'fa-pills' },
            { key: 'sickLeave', label: 'الإجازات المرضية', icon: 'fa-calendar-times' },
            { key: 'dispensed-medications', label: 'سجل الأدوية المنصرفة', icon: 'fa-prescription-bottle-alt' },
            { key: 'injuries', label: 'الإصابات', icon: 'fa-user-injured' },
            { key: 'supply-request', label: 'طلب احتياجات', icon: 'fa-shopping-cart' },
            { key: 'approvals', label: 'طلبات الموافقة', icon: 'fa-check-circle' },
            { key: 'data-analysis', label: 'تحليل البيانات', icon: 'fa-chart-bar' }
        ]
    },
    'training': {
        label: 'صلاحيات مديول التدريب',
        permissions: [
            { key: 'training-list', label: 'قائمة التدريبات', icon: 'fa-list' },
            { key: 'training-matrix', label: 'مصفوفة التدريب', icon: 'fa-table' },
            { key: 'annual-plan', label: 'الخطة السنوية', icon: 'fa-calendar-check' },
            { key: 'analysis', label: 'التحليل', icon: 'fa-chart-line' },
            { key: 'contractor-training', label: 'تدريب المقاولين', icon: 'fa-users' }
        ]
    },
    'fire-equipment': {
        label: 'صلاحيات مديول معدات الإطفاء',
        permissions: [
            { key: 'database', label: 'قاعدة البيانات', icon: 'fa-database' },
            { key: 'register', label: 'السجل', icon: 'fa-clipboard-list' },
            { key: 'inspections', label: 'الفحوصات', icon: 'fa-clipboard-check' },
            { key: 'analytics', label: 'التحليل', icon: 'fa-chart-line' },
            { key: 'approval-requests', label: 'طلبات الموافقة', icon: 'fa-check-circle' }
        ]
    },
    'daily-observations': {
        label: 'صلاحيات مديول الملاحظات اليومية',
        permissions: [
            { key: 'observations-registry', label: 'سجل الملاحظات', icon: 'fa-book' },
            { key: 'data-analysis', label: 'تحليل البيانات', icon: 'fa-chart-bar' }
        ]
    },
    'ptw': {
        label: 'صلاحيات مديول تصاريح العمل',
        permissions: [
            { key: 'ptw-list', label: 'قائمة التصاريح', icon: 'fa-list' },
            { key: 'analytics', label: 'التحليل', icon: 'fa-chart-line' },
            { key: 'approvals', label: 'الموافقات', icon: 'fa-check-circle' }
        ]
    },
    'contractors': {
        label: 'صلاحيات مديول المقاولين',
        permissions: [
            { key: 'contractors-list', label: 'قائمة المقاولين', icon: 'fa-list' },
            { key: 'evaluations', label: 'التقييمات', icon: 'fa-star' },
            { key: 'analytics', label: 'التحليل', icon: 'fa-chart-line' },
            { key: 'approval-requests', label: 'طلبات الموافقة', icon: 'fa-check-circle' }
        ]
    }
};

const MODULE_PERMISSIONS_CONFIG = [
    { key: 'dashboard', label: 'لوحة التحكم', icon: 'fa-dashboard' },
    { key: 'users', label: 'إدارة المستخدمين', icon: 'fa-users-cog', adminOnly: true },
    { key: 'user-tasks', label: 'مهام المستخدمين', icon: 'fa-tasks' },
    { key: 'employees', label: 'قاعدة بيانات الموظفين', icon: 'fa-database' },
    { key: 'incidents', label: 'الحوادث', icon: 'fa-exclamation-triangle', hasDetailedPermissions: true },
    { key: 'nearmiss', label: 'الحوادث الوشيكة', icon: 'fa-exclamation-circle' },
    { key: 'ptw', label: 'تصاريح العمل', icon: 'fa-id-card', hasDetailedPermissions: true },
    { key: 'training', label: 'التدريب', icon: 'fa-graduation-cap', hasDetailedPermissions: true },
    { key: 'clinic', label: 'العيادة الطبية', icon: 'fa-hospital', hasDetailedPermissions: true },
    { key: 'fire-equipment', label: 'معدات الإطفاء', icon: 'fa-fire-extinguisher', hasDetailedPermissions: true },
    { key: 'periodic-inspections', label: 'الفحوصات الدورية', icon: 'fa-clipboard-check' },
    { key: 'ppe', label: 'مهمات الوقاية', icon: 'fa-hard-hat' },
    { key: 'violations', label: 'المخالفات', icon: 'fa-ban' },
    { key: 'contractors', label: 'المقاولين', icon: 'fa-users', hasDetailedPermissions: true },
    { key: 'behavior-monitoring', label: 'مراقبة السلوكيات', icon: 'fa-user-check' },
    { key: 'chemical-safety', label: 'السلامة الكيميائية', icon: 'fa-flask' },
    { key: 'daily-observations', label: 'الملاحظات اليومية', icon: 'fa-eye', hasDetailedPermissions: true },
    { key: 'iso', label: 'نظام ISO', icon: 'fa-certificate' },
    { key: 'emergency', label: 'تنبيهات الطوارئ', icon: 'fa-bell' },
    { key: 'risk-assessment', label: 'تقييم المخاطر', icon: 'fa-balance-scale' },
    { key: 'sop-jha', label: 'إجراءات العمل والتقييمات', icon: 'fa-tasks' },
    { key: 'legal-documents', label: 'الوثائق القانونية', icon: 'fa-file-contract' },
    { key: 'sustainability', label: 'الاستدامة', icon: 'fa-leaf' },
    { key: 'safety-budget', label: 'ميزانية السلامة وتتبع الإنفاق', icon: 'fa-wallet' },
    { key: 'ai-assistant', label: 'المساعد الذكي', icon: 'fa-robot' },
    { key: 'safety-performance-kpis', label: 'مؤشرات الأداء لإدارة السلامة', icon: 'fa-gauge-high' },
    { key: 'safety-health-management', label: 'إدارة السلامة والصحة', icon: 'fa-user-shield' },
    { key: 'settings', label: 'الإعدادات', icon: 'fa-cog', adminOnly: true },
    { key: 'action-tracking', label: 'سجل متابعة الإجراءات', icon: 'fa-clipboard-list' },
    { key: 'change-management', label: 'إدارة التغيرات', icon: 'fa-exchange-alt', hasDetailedPermissions: true },
    { key: 'issue-tracking', label: 'تتبع المشاكل', icon: 'fa-bug', hasDetailedPermissions: true }
];

const buildRoleDefaults = (enabledKeys = []) => {
    const permissions = {};
    MODULE_PERMISSIONS_CONFIG.forEach(({ key }) => {
        permissions[key] = enabledKeys.includes(key);
    });
    return permissions;
};

// ⚠️ ملاحظة أمنية مهمة: لا يتم إضافة أي صلاحيات افتراضية تلقائياً
// الصلاحيات تُمنح فقط من قبل مدير النظام من خلال إدارة المستخدمين
// هذا يضمن السيطرة الكاملة على الصلاحيات من قبل المدير
// 
// ⚠️ تحذير: DEFAULT_ROLE_PERMISSIONS لا يتم استخدامه في hasAccess أو getEffectivePermissions
// هذا الكائن موجود فقط للتوافق مع الكود القديم أو للاستخدام المستقبلي
// لا يتم استخدامه تلقائياً لمنح أي صلاحيات - جميع الصلاحيات يجب منحها صراحةً من قبل المدير
const DEFAULT_ROLE_PERMISSIONS = {
    // مدير النظام - صلاحيات كاملة على كل الموديولات (يتم التحقق منها في hasAccess مباشرة)
    admin: buildRoleDefaults(MODULE_PERMISSIONS_CONFIG.map(m => m.key)),

    // مسئول السلامة - لا توجد صلاحيات افتراضية، يجب منحها من قبل مدير النظام
    safety_officer: buildRoleDefaults([]),

    // المستخدم العادي - لا توجد صلاحيات افتراضية، يجب منحها من قبل مدير النظام
    user: buildRoleDefaults([])
};

const Permissions = {
    /**
     * تطبيع كائن الصلاحيات (يُحوّل JSON string إلى كائن)
     */
    normalizePermissions(permissions) {
        if (!permissions) return {};
        if (typeof permissions === 'string') {
            try {
                // محاولة تحليل JSON أولاً
                return JSON.parse(permissions);
            } catch (error) {
                // إذا فشل تحليل JSON، قد تكون الصلاحيات بصيغة key: value من Google Sheets
                const trimmed = permissions.trim();
                if (trimmed && (trimmed.includes(':') || trimmed.includes('\n'))) {
                    try {
                        // محاولة تحويل النص إلى كائن (key: value format)
                        const lines = trimmed.split('\n').filter(line => line.trim());
                        const perms = {};
                        lines.forEach(line => {
                            const match = line.match(/^([^:]+):\s*(.+)$/);
                            if (match) {
                                const key = match[1].trim();
                                let value = match[2].trim();
                                // تحويل القيم النصية إلى boolean/number/string
                                if (value === 'true') {
                                    perms[key] = true;
                                } else if (value === 'false') {
                                    perms[key] = false;
                                } else if (!isNaN(value) && value !== '') {
                                    perms[key] = Number(value);
                                } else {
                                    // محاولة تحليل القيم المعقدة (مثل الصلاحيات التفصيلية)
                                    // مثال: "incidentsPermissions: add: true, edit: false"
                                    if (value.includes(',')) {
                                        const nestedObj = {};
                                        const pairs = value.split(',').map(p => p.trim());
                                        pairs.forEach(pair => {
                                            const nestedMatch = pair.match(/^([^:]+):\s*(.+)$/);
                                            if (nestedMatch) {
                                                const nestedKey = nestedMatch[1].trim();
                                                const nestedValue = nestedMatch[2].trim();
                                                nestedObj[nestedKey] = nestedValue === 'true' ? true : 
                                                                      nestedValue === 'false' ? false : 
                                                                      !isNaN(nestedValue) ? Number(nestedValue) : nestedValue;
                                            }
                                        });
                                        if (Object.keys(nestedObj).length > 0) {
                                            perms[key] = nestedObj;
                                        } else {
                                            perms[key] = value;
                                        }
                                    } else {
                                        perms[key] = value;
                                    }
                                }
                            }
                        });
                        if (Object.keys(perms).length > 0) {
                            return perms;
                        }
                    } catch (parseError) {
                        Utils.safeWarn('⚠ تعذر تحليل بيانات الصلاحيات بصيغة key:value، سيتم تجاهلها:', parseError);
                    }
                }
                return {};
            }
        }
        return permissions && typeof permissions === 'object' && !Array.isArray(permissions) ? permissions : {};
    },

    async ensureFormSettingsState(forceReload = false) {
        // ✅ إصلاح: إعادة تحميل البيانات من Google Sheets عند forceReload لضمان الحصول على أحدث البيانات
        if (forceReload || !this.formSettingsState) {
            await this.initFormSettingsState();
        }
        return this.formSettingsState;
    },

    getFormSettingsState() {
        // دالة متزامنة للحصول على الحالة (تُستخدم في دوال العرض)
        if (!this.formSettingsState) {
            // إذا لم تكن الحالة مهيأة، إرجاع حالة افتراضية
            return {
                sites: [],
                selectedSiteId: '',
                departments: [],
                safetyTeam: []
            };
        }
        return this.formSettingsState;
    },

    async initFormSettingsState() {
        // محاولة تحميل إعدادات الشركة من Google Sheets أولاً
        if (AppState.googleConfig?.appsScript?.enabled && typeof GoogleIntegration !== 'undefined') {
            try {
                const companyResult = await GoogleIntegration.sendToAppsScript('getCompanySettings', {});
                if (companyResult && companyResult.success && companyResult.data) {
                    // تحديث AppState ببيانات الشركة من Google Sheets
                    AppState.companySettings = Object.assign({}, AppState.companySettings, {
                        name: companyResult.data.name || AppState.companySettings?.name,
                        secondaryName: companyResult.data.secondaryName || AppState.companySettings?.secondaryName,
                        nameFontSize: companyResult.data.nameFontSize || AppState.companySettings?.nameFontSize || 16,
                        secondaryNameFontSize: companyResult.data.secondaryNameFontSize || AppState.companySettings?.secondaryNameFontSize || 14,
                        secondaryNameColor: companyResult.data.secondaryNameColor || AppState.companySettings?.secondaryNameColor || '#6B7280',
                        formVersion: companyResult.data.formVersion || AppState.companySettings?.formVersion || '1.0',
                        address: companyResult.data.address || AppState.companySettings?.address,
                        phone: companyResult.data.phone || AppState.companySettings?.phone,
                        email: companyResult.data.email || AppState.companySettings?.email
                    });

                    // تحديث شعار الشركة إذا كان موجوداً
                    if (companyResult.data.logo) {
                        AppState.companyLogo = companyResult.data.logo;
                        // تحديث الشعار في AppState.companySettings أيضاً
                        if (!AppState.companySettings) {
                            AppState.companySettings = {};
                        }
                        AppState.companySettings.logo = companyResult.data.logo;
                        // حفظ الشعار في localStorage
                        localStorage.setItem('company_logo', companyResult.data.logo);
                        localStorage.setItem('hse_company_logo', companyResult.data.logo);

                        // تحديث الشعار في جميع الأماكن المخصصة
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
                            detail: { logoUrl: companyResult.data.logo }
                        }));
                    }

                    Utils.safeLog('✅ تم تحميل إعدادات الشركة من Google Sheets بنجاح');
                }
            } catch (error) {
                Utils.safeWarn('⚠️ فشل تحميل إعدادات الشركة من Google Sheets:', error);
            }
        }

        // ✅ إصلاح: محاولة تحميل الإعدادات من Google Sheets أولاً
        // ✅ إصلاح: هذا يعمل لجميع المستخدمين بعد المزامنة وتسجيل الدخول
        if (AppState.googleConfig?.appsScript?.enabled && typeof GoogleIntegration !== 'undefined') {
            try {
                // ✅ إصلاح: تحميل مباشر من قاعدة البيانات بدون تأخير
                const result = await GoogleIntegration.sendToAppsScript('getFormSettings', {});
                if (result && result.success && result.data) {
                    // ✅ إصلاح: تحديث AppState بالبيانات من Google Sheets مع التأكد من وجود الأماكن الفرعية
                    if (Array.isArray(result.data.sites) && result.data.sites.length > 0) {
                        // ✅ إصلاح: التأكد من أن كل موقع يحتوي على places (حتى لو كانت مصفوفة فارغة)
                        // ✅ إصلاح: ربط صحيح للأماكن بالمواقع باستخدام String() لضمان المطابقة
                        const normalizedSites = result.data.sites.map(site => {
                            const siteId = String(site.id || '').trim();
                            // ✅ إصلاح: التأكد من ربط جميع الأماكن الفرعية بالموقع بشكل صحيح
                            // ✅ إصلاح: استخدام siteId من الموقع لضمان الربط الصحيح
                            const sitePlaces = Array.isArray(site.places) && site.places.length > 0 
                                ? site.places.map(place => {
                                    // ✅ إصلاح: استخدام siteId من الموقع الحالي لضمان الربط الصحيح
                                    const placeSiteId = String(place.siteId || site.id || siteId || '').trim();
                                    return {
                                        id: place.id || Utils.generateId('PLACE'),
                                        name: place.name || '',
                                        siteId: placeSiteId || siteId // ✅ إصلاح: ربط صحيح بالموقع
                                    };
                                })
                                : []; // ✅ إصلاح: مصفوفة فارغة إذا لم تكن هناك أماكن
                            
                            return {
                                id: site.id || Utils.generateId('SITE'),
                                name: site.name || '',
                                description: site.description || '',
                                places: sitePlaces // ✅ إصلاح: جميع الأماكن الفرعية مرتبطة بشكل صحيح
                            };
                        });
                        AppState.appData.observationSites = normalizedSites;
                        // ✅ إصلاح: عرض رسالة للمستخدم حتى في وضع الإنتاج
                        Utils.safeLog(`✅ تم تحميل ${normalizedSites.length} موقع من قاعدة البيانات`);
                    } else {
                        // ✅ إصلاح: إذا لم تكن هناك مواقع، نستخدم مصفوفة فارغة بدلاً من undefined
                        if (!AppState.appData.observationSites) {
                            AppState.appData.observationSites = [];
                        }
                    }
                    if (Array.isArray(result.data.departments) && result.data.departments.length > 0) {
                        if (!AppState.companySettings) {
                            AppState.companySettings = {};
                        }
                        AppState.companySettings.formDepartments = result.data.departments;
                    }
                    if (Array.isArray(result.data.safetyTeam) && result.data.safetyTeam.length > 0) {
                        if (!AppState.companySettings) {
                            AppState.companySettings = {};
                        }
                        AppState.companySettings.safetyTeam = result.data.safetyTeam;
                    }

                    // حفظ في localStorage لاستخدامها لاحقاً
                    const dm = (typeof window !== 'undefined' && window.DataManager) ||
                        (typeof DataManager !== 'undefined' && DataManager);
                    if (dm && typeof dm.save === 'function') {
                        dm.save();
                    }
                    if (dm && typeof dm.saveCompanySettings === 'function') {
                        dm.saveCompanySettings();
                    }

                    Utils.safeLog('✅ تم تحميل إعدادات النماذج من Google Sheets بنجاح');
                } else {
                    // ✅ إصلاح: إذا فشل التحميل، نستخدم البيانات المحلية
                    Utils.safeWarn('⚠️ لم يتم تحميل إعدادات النماذج من Google Sheets - استخدام البيانات المحلية');
                    // ✅ إصلاح: التأكد من وجود مصفوفة فارغة على الأقل
                    if (!AppState.appData.observationSites) {
                        AppState.appData.observationSites = [];
                    }
                }
            } catch (error) {
                Utils.safeWarn('⚠️ فشل تحميل إعدادات النماذج من Google Sheets، سيتم استخدام البيانات المحلية:', error);
                // ✅ إصلاح: التأكد من وجود مصفوفة فارغة على الأقل
                if (!AppState.appData.observationSites) {
                    AppState.appData.observationSites = [];
                }
            }
        } else {
            // ✅ إصلاح: إذا لم يكن Google Sheets مفعّل، نستخدم البيانات المحلية
            if (!AppState.appData.observationSites) {
                AppState.appData.observationSites = [];
            }
        }

        const sitesSource = (() => {
            if (Array.isArray(AppState.appData?.observationSites) && AppState.appData.observationSites.length > 0) {
                return AppState.appData.observationSites;
            }
            if (typeof DailyObservations !== 'undefined' && Array.isArray(DailyObservations.DEFAULT_SITES)) {
                return DailyObservations.DEFAULT_SITES;
            }
            return [];
        })();

        // ✅ إصلاح: معالجة أفضل للمواقع والأماكن الفرعية - التأكد من تحميل جميع المواقع
        // لا نستخدم slice() أو limit - نحمّل جميع المواقع
        const clonedSites = sitesSource.map((site, index) => {
            const siteId = site.id || site.siteId || Utils.generateId('SITE');
            const siteName = site.name || site.title || site.label || `موقع ${index + 1}`;
            
            // ✅ إصلاح: معالجة أفضل للأماكن الفرعية مع دعم صيغ متعددة
            let placesSource = [];
            if (Array.isArray(site.places) && site.places.length > 0) {
                placesSource = site.places;
            } else if (Array.isArray(site.locations) && site.locations.length > 0) {
                placesSource = site.locations;
            } else if (Array.isArray(site.children) && site.children.length > 0) {
                placesSource = site.children;
            } else if (Array.isArray(site.areas) && site.areas.length > 0) {
                placesSource = site.areas;
            }
            
            // ✅ إصلاح: تطبيع الأماكن الفرعية مع التأكد من وجود id و name وربط صحيح بالموقع
            // ✅ إصلاح: استخدام String() لضمان المطابقة الصحيحة بين siteId
            const siteIdStr = String(siteId || '').trim();
            const places = placesSource.map((place, idx) => {
                // إذا كان place كائن، نستخدم خصائصه
                if (typeof place === 'object' && place !== null) {
                    // ✅ إصلاح: استخدام String() لضمان المطابقة الصحيحة
                    const placeSiteId = String(place.siteId || siteId || '').trim();
                    return {
                        id: place.id || place.placeId || place.value || Utils.generateId('PLACE'),
                        name: place.name || place.placeName || place.title || place.label || place.locationName || `مكان ${idx + 1}`,
                        siteId: placeSiteId || siteIdStr // ✅ إصلاح: ربط صحيح بالموقع باستخدام String()
                    };
                }
                // إذا كان place نص، نستخدمه كاسم
                if (typeof place === 'string') {
                    return {
                        id: Utils.generateId('PLACE'),
                        name: place,
                        siteId: siteIdStr // ✅ إصلاح: ربط صحيح بالموقع باستخدام String()
                    };
                }
                // في حالة أخرى، نستخدم قيمة افتراضية
                return {
                    id: Utils.generateId('PLACE'),
                    name: `مكان ${idx + 1}`,
                    siteId: siteIdStr // ✅ إصلاح: ربط صحيح بالموقع باستخدام String()
                };
            });
            
            return {
                id: siteId,
                name: siteName,
                description: site.description || '',
                places: places // ✅ إصلاح: التأكد من أن places دائماً مصفوفة (حتى لو كانت فارغة)
            };
        });

        const selectedSiteId = clonedSites[0]?.id || '';

        this.formSettingsState = {
            sites: clonedSites,
            selectedSiteId,
            departments: this.getInitialFormDepartments(),
            safetyTeam: this.getInitialSafetyTeam()
        };

        return this.formSettingsState;
    },

    getInitialFormDepartments() {
        const settings = AppState.companySettings || {};
        const stored = settings.formDepartments;
        if (Array.isArray(stored)) {
            return stored.map((item) => String(item || '').trim()).filter(Boolean);
        }
        if (typeof stored === 'string') {
            return stored.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
        }
        if (Array.isArray(settings.departments)) {
            return settings.departments.map((item) => String(item || '').trim()).filter(Boolean);
        }
        if (typeof settings.departments === 'string') {
            return settings.departments.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
        }
        if (typeof DailyObservations !== 'undefined' && typeof DailyObservations.getDepartmentOptions === 'function') {
            try {
                const options = DailyObservations.getDepartmentOptions();
                if (Array.isArray(options)) {
                    return options.map((item) => String(item || '').trim()).filter(Boolean);
                }
            } catch (error) {
                Utils.safeWarn('⚠️ تعذر تحميل الإدارات من DailyObservations:', error);
            }
        }
        return [];
    },

    getInitialSafetyTeam() {
        const settings = AppState.companySettings || {};
        const stored = settings.safetyTeam || settings.safetyTeamMembers;
        if (Array.isArray(stored)) {
            return stored.map((item) => String(item || '').trim()).filter(Boolean);
        }
        if (typeof stored === 'string') {
            return stored.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
        }
        return [];
    },

    renderFormSettingsCard() {
        return `
            <div class="content-card mt-6" id="form-settings-card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-sliders-h ml-2"></i>
                        إعدادات النماذج
                    </h2>
                </div>
                <div class="card-body space-y-6">
                    <p class="text-sm text-gray-600 leading-6">
                        من هنا يمكنك إدارة المواقع وأماكنها، وتحديد قوائم الإدارات المسؤولة وفريق السلامة المستخدمين داخل النماذج (مثل الملاحظات اليومية).
                        أي تعديل يتم حفظه مباشرة في قاعدة البيانات ويظهر في النماذج عند تعبئتها. جميع العمليات تُسجل في سجل النشاطات مع اسم المستخدم والتاريخ.
                    </p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 class="text-sm font-semibold text-gray-700 mb-3">
                                <i class="fas fa-map-marker-alt ml-2"></i>المواقع
                            </h3>
                            <div id="form-settings-sites-list" class="space-y-2"></div>
                            <button type="button" class="btn-primary btn-sm mt-2" data-action="add-site">
                                <i class="fas fa-plus ml-2"></i>إضافة موقع
                            </button>
                        </div>
                        <div>
                            <h3 class="text-sm font-semibold text-gray-700 mb-3">
                                <i class="fas fa-location-dot ml-2"></i>الأماكن داخل الموقع المحدد
                            </h3>
                            <div id="form-settings-places-list" class="space-y-2"></div>
                            <button type="button" class="btn-secondary btn-sm mt-2" data-action="add-place" id="form-settings-add-place-btn">
                                <i class="fas fa-plus ml-2"></i>إضافة مكان
                            </button>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-gray-700 mb-3">
                            <i class="fas fa-briefcase ml-2"></i>المسؤولون عن التنفيذ
                        </h3>
                        <div id="form-settings-departments-list" class="space-y-2"></div>
                        <button type="button" class="btn-secondary btn-sm mt-2" data-action="add-department">
                            <i class="fas fa-plus ml-2"></i>إضافة إدارة
                        </button>
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-gray-700 mb-3">
                            <i class="fas fa-user-shield ml-2"></i>فريق السلامة
                        </h3>
                        <div id="form-settings-safety-list" class="space-y-2"></div>
                        <button type="button" class="btn-secondary btn-sm mt-2" data-action="add-safety-member">
                            <i class="fas fa-plus ml-2"></i>إضافة عضو
                        </button>
                    </div>
                    
                    <!-- استيراد وتصدير البيانات -->
                    <div class="border-t border-gray-200 pt-4 mt-4">
                        <h3 class="text-sm font-semibold text-gray-700 mb-3">
                            <i class="fas fa-exchange-alt ml-2"></i>استيراد وتصدير البيانات
                        </h3>
                        <div class="flex flex-wrap gap-2 mb-4">
                            <button type="button" class="btn-secondary btn-sm" data-action="import-form-settings-file">
                                <i class="fas fa-file-import ml-2"></i>استيراد من ملف
                            </button>
                            <button type="button" class="btn-secondary btn-sm" data-action="export-form-settings">
                                <i class="fas fa-file-export ml-2"></i>تصدير إلى ملف
                            </button>
                            <input type="file" id="form-settings-file-input" accept=".json" style="display: none;">
                        </div>
                        
                        <!-- منطقة النسخ واللصق -->
                        <div class="mt-4">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-paste ml-2"></i>النسخ واللصق (JSON)
                            </label>
                            <textarea 
                                id="form-settings-paste-area" 
                                class="form-input w-full min-h-[150px] font-mono text-sm"
                                placeholder='الصق البيانات بصيغة JSON هنا، مثال:&#10;{&#10;  "sites": [{"id": "SITE1", "name": "موقع 1", "places": [{"id": "PLACE1", "name": "مكان 1"}]}],&#10;  "departments": ["إدارة 1", "إدارة 2"],&#10;  "safetyTeam": ["عضو 1", "عضو 2"]&#10;}'
                            ></textarea>
                            <div class="flex gap-2 mt-2">
                                <button type="button" class="btn-secondary btn-sm" data-action="paste-form-settings">
                                    <i class="fas fa-clipboard ml-2"></i>استيراد من النص
                                </button>
                                <button type="button" class="btn-secondary btn-sm" data-action="copy-form-settings">
                                    <i class="fas fa-copy ml-2"></i>نسخ إلى الحافظة
                                </button>
                                <button type="button" class="btn-secondary btn-sm" data-action="clear-paste-area">
                                    <i class="fas fa-eraser ml-2"></i>مسح
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mt-2">
                                <i class="fas fa-info-circle ml-1"></i>
                                يمكنك نسخ البيانات من ملف JSON ولصقها هنا، أو نسخ البيانات الحالية للصقها في مكان آخر.
                            </p>
                        </div>
                    </div>
                </div>
                <div class="card-footer flex flex-wrap items-center justify-between gap-3">
                    <button type="button" class="btn-secondary" data-action="reset-form-settings">
                        <i class="fas fa-undo ml-2"></i>إلغاء التعديلات
                    </button>
                    <button type="button" class="btn-primary" data-action="save-form-settings">
                        <i class="fas fa-save ml-2"></i>حفظ إعدادات النماذج
                    </button>
                </div>
            </div>
        `;
    },

    renderFormSitesList() {
        const state = this.getFormSettingsState();
        if (!Array.isArray(state.sites) || state.sites.length === 0) {
            return `
                <div class="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-600">
                    لا توجد مواقع مسجلة. اضغط على زر <strong>إضافة موقع</strong> للبدء.
                </div>
            `;
        }

        // ✅ إصلاح: عرض جميع المواقع بدون أي قيود (50 موقع أو أكثر)
        // لا نستخدم slice() أو limit - نعرض جميع المواقع
        return state.sites.map((site, index) => `
            <div class="flex items-center gap-2 p-2 border border-gray-200 rounded-lg bg-white" data-site-id="${Utils.escapeHTML(site.id)}">
                <span class="text-xs text-gray-400">#${index + 1}</span>
                <input type="text" class="form-input flex-1" data-field="site-name" data-site-id="${Utils.escapeHTML(site.id)}"
                    value="${Utils.escapeHTML(site.name || '')}" placeholder="اسم الموقع">
                <button type="button" class="btn-secondary btn-xs ${site.id === state.selectedSiteId ? 'btn-primary' : ''}" data-action="select-site" data-site-id="${Utils.escapeHTML(site.id)}">
                    ${site.id === state.selectedSiteId ? '<i class="fas fa-check ml-1"></i>محدد' : 'اختيار'}
                </button>
                <button type="button" class="btn-danger btn-xs" data-action="remove-site" data-site-id="${Utils.escapeHTML(site.id)}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    },

    renderFormPlacesList() {
        const state = this.getFormSettingsState();
        if (!state || !Array.isArray(state.sites)) {
            return `<p class="text-sm text-gray-500">لا توجد مواقع متاحة.</p>`;
        }
        if (!state.selectedSiteId) {
            return `<p class="text-sm text-gray-500">اختر موقعاً من القائمة لعرض الأماكن التابعة له.</p>`;
        }
        const site = state.sites.find((item) => item.id === state.selectedSiteId);
        if (!site) {
            return `<p class="text-sm text-gray-500">الموقع المحدد غير موجود.</p>`;
        }
        if (!Array.isArray(site.places) || site.places.length === 0) {
            return `<p class="text-sm text-gray-500">لا توجد أماكن مسجلة لهذا الموقع. يمكنك إضافة أماكن جديدة باستخدام الزر أدناه.</p>`;
        }
        return site.places.map((place, index) => `
            <div class="flex items-center gap-2 p-2 border border-gray-200 rounded-lg bg-white" data-place-id="${Utils.escapeHTML(place.id)}">
                <span class="text-xs text-gray-400">#${index + 1}</span>
                <input type="text" class="form-input flex-1" data-field="place-name" data-place-id="${Utils.escapeHTML(place.id)}"
                    value="${Utils.escapeHTML(place.name || '')}" placeholder="اسم المكان داخل الموقع">
                <button type="button" class="btn-danger btn-xs" data-action="remove-place" data-place-id="${Utils.escapeHTML(place.id)}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    },

    renderDepartmentsList() {
        const state = this.getFormSettingsState();
        if (!Array.isArray(state.departments) || state.departments.length === 0) {
            return `<p class="text-sm text-gray-500">لم يتم تحديد إدارات مسؤولة بعد. يمكنك إضافتها عبر الزر أدناه.</p>`;
        }
        return state.departments.map((department, index) => `
            <div class="flex items-center gap-2 p-2 border border-gray-200 rounded-lg bg-white" data-department-index="${index}">
                <span class="text-xs text-gray-400">#${index + 1}</span>
                <input type="text" class="form-input flex-1" data-field="department-name" data-department-index="${index}"
                    value="${Utils.escapeHTML(department || '')}" placeholder="اسم الإدارة أو الجهة المسؤولة">
                <button type="button" class="btn-danger btn-xs" data-action="remove-department" data-department-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    },

    renderSafetyTeamList() {
        const state = this.getFormSettingsState();
        if (!Array.isArray(state.safetyTeam) || state.safetyTeam.length === 0) {
            return `<p class="text-sm text-gray-500">لم يتم تسجيل أعضاء فريق السلامة. يمكنك إضافة الأسماء عبر الزر أدناه.</p>`;
        }
        return state.safetyTeam.map((member, index) => `
            <div class="flex items-center gap-2 p-2 border border-gray-200 rounded-lg bg-white" data-safety-index="${index}">
                <span class="text-xs text-gray-400">#${index + 1}</span>
                <input type="text" class="form-input flex-1" data-field="safety-name" data-safety-index="${index}"
                    value="${Utils.escapeHTML(member || '')}" placeholder="اسم عضو فريق السلامة">
                <button type="button" class="btn-danger btn-xs" data-action="remove-safety-member" data-safety-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    },

    refreshFormSettingsUI() {
        const state = this.getFormSettingsState();
        const sitesList = document.getElementById('form-settings-sites-list');
        if (sitesList) {
            sitesList.innerHTML = this.renderFormSitesList();
        }
        const placesList = document.getElementById('form-settings-places-list');
        if (placesList) {
            placesList.innerHTML = this.renderFormPlacesList();
        }
        const departmentsList = document.getElementById('form-settings-departments-list');
        if (departmentsList) {
            departmentsList.innerHTML = this.renderDepartmentsList();
        }
        const safetyList = document.getElementById('form-settings-safety-list');
        if (safetyList) {
            safetyList.innerHTML = this.renderSafetyTeamList();
        }
        const addPlaceBtn = document.getElementById('form-settings-add-place-btn');
        if (addPlaceBtn) {
            addPlaceBtn.disabled = !state.selectedSiteId;
        }
    },

    async bindFormSettingsEvents() {
        const card = document.getElementById('form-settings-card');
        if (!card) return;

        // ✅ إصلاح: إعادة تحميل البيانات من Google Sheets عند فتح التبويب لضمان الحصول على أحدث البيانات
        // forceReload = true لضمان تحميل جميع المواقع (50 موقع) من قاعدة البيانات
        await this.ensureFormSettingsState(true); // forceReload = true
        
        // ✅ إصلاح: التأكد من تحديث الواجهة بعد التحميل
        this.refreshFormSettingsUI();
        
        // ✅ إصلاح: إضافة رسالة تحميل للمستخدم (حتى في وضع الإنتاج)
        const sitesCount = this.formSettingsState?.sites?.length || 0;
        if (sitesCount > 0) {
            Utils.safeLog(`✅ تم تحميل ${sitesCount} موقع في تبويب إعدادات النماذج`);
        } else {
            Utils.safeWarn('⚠️ لم يتم تحميل أي مواقع - تحقق من قاعدة البيانات');
        }

        if (this.formSettingsEventsBound) return;
        this.formSettingsEventsBound = true;

        card.addEventListener('click', (event) => {
            const actionElement = event.target.closest('[data-action]');
            if (!actionElement) return;
            const action = actionElement.getAttribute('data-action');
            switch (action) {
                case 'add-site':
                    this.handleAddSite();
                    break;
                case 'select-site':
                    this.handleSelectSite(actionElement.getAttribute('data-site-id'));
                    break;
                case 'remove-site':
                    this.handleRemoveSite(actionElement.getAttribute('data-site-id'));
                    break;
                case 'add-place':
                    this.handleAddPlace();
                    break;
                case 'remove-place':
                    this.handleRemovePlace(actionElement.getAttribute('data-place-id'));
                    break;
                case 'add-department':
                    this.handleAddDepartment();
                    break;
                case 'remove-department':
                    this.handleRemoveDepartment(Number(actionElement.getAttribute('data-department-index')));
                    break;
                case 'add-safety-member':
                    this.handleAddSafetyMember();
                    break;
                case 'remove-safety-member':
                    this.handleRemoveSafetyMember(Number(actionElement.getAttribute('data-safety-index')));
                    break;
                case 'reset-form-settings':
                    this.handleResetFormSettings();
                    break;
                case 'save-form-settings':
                    this.handleSaveFormSettings();
                    break;
                case 'import-form-settings-file':
                    this.handleImportFormSettingsFile();
                    break;
                case 'export-form-settings':
                    this.handleExportFormSettings();
                    break;
                case 'paste-form-settings':
                    this.handlePasteFormSettings();
                    break;
                case 'copy-form-settings':
                    this.handleCopyFormSettings();
                    break;
                case 'clear-paste-area':
                    this.handleClearPasteArea();
                    break;
                default:
                    break;
            }
        });

        card.addEventListener('input', (event) => {
            const target = event.target;
            if (!target) return;
            const field = target.getAttribute('data-field');
            switch (field) {
                case 'site-name':
                    this.handleSiteNameChange(target.getAttribute('data-site-id'), target.value);
                    break;
                case 'place-name':
                    this.handlePlaceNameChange(target.getAttribute('data-place-id'), target.value);
                    break;
                case 'department-name':
                    this.handleDepartmentChange(Number(target.getAttribute('data-department-index')), target.value);
                    break;
                case 'safety-name':
                    this.handleSafetyMemberChange(Number(target.getAttribute('data-safety-index')), target.value);
                    break;
                default:
                    break;
            }
        });

        // ربط حدث اختيار الملف
        const fileInput = document.getElementById('form-settings-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files?.[0];
                if (file) {
                    this.handleImportFormSettingsFileContent(file);
                }
                // إعادة تعيين قيمة input ليمكن اختيار نفس الملف مرة أخرى
                event.target.value = '';
            });
        }
    },

    async handleAddSite() {
        const state = await this.ensureFormSettingsState();
        if (!state) {
            Utils.safeError('❌ فشل تهيئة حالة إعدادات النماذج');
            return;
        }
        if (!Array.isArray(state.sites)) {
            state.sites = [];
        }
        const newSite = {
            id: Utils.generateId('SITE'),
            name: '',
            places: []
        };
        state.sites.push(newSite);
        state.selectedSiteId = newSite.id;
        this.refreshFormSettingsUI();
        setTimeout(() => {
            const input = document.querySelector(`[data-field="site-name"][data-site-id="${newSite.id}"]`);
            if (input) input.focus();
        }, 0);
    },

    handleSelectSite(siteId) {
        const state = this.getFormSettingsState();
        if (!siteId || !state || !Array.isArray(state.sites)) return;
        if (!state.sites.some((site) => site.id === siteId)) return;
        state.selectedSiteId = siteId;
        this.refreshFormSettingsUI();
    },

    handleRemoveSite(siteId) {
        const state = this.getFormSettingsState();
        if (!siteId || !state || !Array.isArray(state.sites)) return;
        const index = state.sites.findIndex((site) => site.id === siteId);
        if (index === -1) return;
        const siteName = state.sites[index].name || 'موقع بدون اسم';
        if (!confirm(`سيتم حذف الموقع "${siteName}" وجميع الأماكن المرتبطة به. هل ترغب بالمتابعة؟`)) {
            return;
        }
        state.sites.splice(index, 1);
        if (state.selectedSiteId === siteId) {
            state.selectedSiteId = state.sites[0]?.id || '';
        }
        this.refreshFormSettingsUI();
    },

    handleSiteNameChange(siteId, value) {
        const state = this.getFormSettingsState();
        if (!state || !Array.isArray(state.sites)) return;
        const site = state.sites.find((item) => item.id === siteId);
        if (site) {
            site.name = value;
        }
    },

    handleAddPlace() {
        const state = this.getFormSettingsState();
        if (!state || !Array.isArray(state.sites)) return;
        const siteId = state.selectedSiteId;
        if (!siteId) {
            Notification.warning('يرجى اختيار موقع أولاً.');
            return;
        }
        const site = state.sites.find((item) => item.id === siteId);
        if (!site) return;
        if (!Array.isArray(site.places)) {
            site.places = [];
        }
        const newPlace = {
            id: Utils.generateId('PLACE'),
            name: ''
        };
        site.places.push(newPlace);
        this.refreshFormSettingsUI();
        setTimeout(() => {
            const input = document.querySelector(`[data-field="place-name"][data-place-id="${newPlace.id}"]`);
            if (input) input.focus();
        }, 0);
    },

    handlePlaceNameChange(placeId, value) {
        const state = this.getFormSettingsState();
        if (!state || !Array.isArray(state.sites)) return;
        const site = state.sites.find((item) => item.id === state.selectedSiteId);
        if (!site || !Array.isArray(site.places)) return;
        const place = site.places.find((item) => item.id === placeId);
        if (place) {
            place.name = value;
        }
    },

    handleRemovePlace(placeId) {
        const state = this.getFormSettingsState();
        if (!state || !Array.isArray(state.sites)) return;
        const site = state.sites.find((item) => item.id === state.selectedSiteId);
        if (!site || !Array.isArray(site.places)) return;
        const index = site.places.findIndex((item) => item.id === placeId);
        if (index === -1) return;
        const placeName = site.places[index].name || 'مكان بدون اسم';
        if (!confirm(`هل ترغب في حذف المكان "${placeName}"؟`)) {
            return;
        }
        site.places.splice(index, 1);
        this.refreshFormSettingsUI();
    },

    handleAddDepartment() {
        const state = this.getFormSettingsState();
        if (!state) return;
        if (!Array.isArray(state.departments)) {
            state.departments = [];
        }
        state.departments.push('');
        this.refreshFormSettingsUI();
        setTimeout(() => {
            const index = state.departments.length - 1;
            const input = document.querySelector(`[data-field="department-name"][data-department-index="${index}"]`);
            if (input) input.focus();
        }, 0);
    },

    handleDepartmentChange(index, value) {
        const state = this.getFormSettingsState();
        if (!state) return;
        if (!Array.isArray(state.departments)) {
            state.departments = [];
        }
        if (Number.isInteger(index) && index >= 0 && index < state.departments.length) {
            state.departments[index] = value;
        }
    },

    handleRemoveDepartment(index) {
        const state = this.getFormSettingsState();
        if (!state || !Array.isArray(state.departments)) return;
        if (!Number.isInteger(index) || index < 0 || index >= state.departments.length) return;
        state.departments.splice(index, 1);
        this.refreshFormSettingsUI();
    },

    handleAddSafetyMember() {
        const state = this.getFormSettingsState();
        if (!state) return;
        if (!Array.isArray(state.safetyTeam)) {
            state.safetyTeam = [];
        }
        state.safetyTeam.push('');
        this.refreshFormSettingsUI();
        setTimeout(() => {
            const index = state.safetyTeam.length - 1;
            const input = document.querySelector(`[data-field="safety-name"][data-safety-index="${index}"]`);
            if (input) input.focus();
        }, 0);
    },

    handleSafetyMemberChange(index, value) {
        const state = this.getFormSettingsState();
        if (!state) return;
        if (!Array.isArray(state.safetyTeam)) {
            state.safetyTeam = [];
        }
        if (Number.isInteger(index) && index >= 0 && index < state.safetyTeam.length) {
            state.safetyTeam[index] = value;
        }
    },

    handleRemoveSafetyMember(index) {
        const state = this.getFormSettingsState();
        if (!state || !Array.isArray(state.safetyTeam)) return;
        if (!Number.isInteger(index) || index < 0 || index >= state.safetyTeam.length) return;
        state.safetyTeam.splice(index, 1);
        this.refreshFormSettingsUI();
    },

    handleResetFormSettings() {
        if (!confirm('سيتم تجاهل جميع التغييرات غير المحفوظة. هل تريد المتابعة؟')) {
            return;
        }
        this.initFormSettingsState();
        this.refreshFormSettingsUI();
        Notification.success('تمت استعادة الإعدادات كما كانت قبل التعديل.');
    },

    sanitizeSites(rawSites = []) {
        const sites = [];
        for (const site of rawSites) {
            const id = site.id || Utils.generateId('SITE');
            const name = (site.name || '').trim();
            if (!name) {
                return {
                    error: 'يرجى إدخال اسم لكل موقع.',
                    focusSelector: `[data-field="site-name"][data-site-id="${id}"]`
                };
            }
            const placesRaw = Array.isArray(site.places) ? site.places : [];
            const places = [];
            for (const place of placesRaw) {
                const placeId = place.id || Utils.generateId('PLACE');
                const placeName = (place.name || '').trim();
                if (!placeName) {
                    return {
                        error: `يرجى إدخال اسم لجميع الأماكن داخل الموقع "${name}".`,
                        focusSelector: `[data-field="place-name"][data-place-id="${placeId}"]`
                    };
                }
                places.push({ id: placeId, name: placeName });
            }
            sites.push({ id, name, places });
        }
        if (!sites.length) {
            return {
                error: 'يجب إضافة موقع واحد على الأقل.',
                focusSelector: '[data-action="add-site"]'
            };
        }
        return { sites };
    },

    async handleSaveFormSettings() {
        const state = await this.ensureFormSettingsState();
        if (!state) {
            Utils.safeError('❌ فشل تهيئة حالة إعدادات النماذج');
            return;
        }
        const sanitizedResult = this.sanitizeSites(state.sites || []);
        if (sanitizedResult.error) {
            Notification.error(sanitizedResult.error);
            if (sanitizedResult.focusSelector) {
                const element = document.querySelector(sanitizedResult.focusSelector);
                if (element) {
                    element.focus();
                    element.classList.add('ring', 'ring-ring-500');
                    setTimeout(() => element.classList.remove('ring', 'ring-red-500'), 1500);
                }
            }
            return;
        }

        const sites = sanitizedResult.sites;
        const departments = (state.departments || [])
            .map((value) => String(value || '').trim())
            .filter((value, index, array) => value && array.indexOf(value) === index);
        const safetyTeam = (state.safetyTeam || [])
            .map((value) => String(value || '').trim())
            .filter((value, index, array) => value && array.indexOf(value) === index);

        // حفظ في localStorage أولاً
        AppState.appData.observationSites = sites;
        if (!AppState.companySettings) {
            AppState.companySettings = {};
        }
        AppState.companySettings.formDepartments = departments;
        AppState.companySettings.safetyTeam = safetyTeam;

        const dm = (typeof window !== 'undefined' && window.DataManager) ||
            (typeof DataManager !== 'undefined' && DataManager);
        if (dm && typeof dm.save === 'function') {
            dm.save();
        }
        if (dm && typeof dm.saveCompanySettings === 'function') {
            dm.saveCompanySettings();
        }

        // مزامنة مع Google Sheets إذا كان متاحاً
        if (AppState.googleConfig?.appsScript?.enabled && typeof GoogleIntegration !== 'undefined') {
            try {
                const userData = AppState.currentUser || {};
                const result = await GoogleIntegration.sendToAppsScript('saveFormSettings', {
                    id: 'FORM-SETTINGS-1',
                    sites: sites,
                    departments: departments,
                    safetyTeam: safetyTeam,
                    userData: {
                        email: userData.email,
                        name: userData.name,
                        role: userData.role,
                        permissions: userData.permissions
                    }
                });

                if (result && result.success) {
                    Utils.safeLog('✅ تم حفظ إعدادات النماذج في Google Sheets بنجاح');
                } else {
                    Utils.safeWarn('⚠️ فشل حفظ إعدادات النماذج في Google Sheets:', result?.message);
                }
            } catch (error) {
                Utils.safeWarn('⚠️ خطأ أثناء مزامنة إعدادات النماذج مع Google Sheets:', error);
            }
        }

        // تسجيل حركة المستخدم
        if (typeof UserActivityLog !== 'undefined') {
            UserActivityLog.log('settings', 'Settings', 'form-settings', {
                description: 'تعديل إعدادات النماذج (المواقع، الإدارات، فريق السلامة)'
            }).catch(() => { });
        }

        AuditLog.log('update_form_settings', 'Settings', 'form-settings', {
            sites: sites.length,
            departments: departments.length,
            safetyTeam: safetyTeam.length
        });

        Notification.success('تم حفظ إعدادات النماذج بنجاح.');
        this.initFormSettingsState();
        this.refreshFormSettingsUI();
    },

    handleImportFormSettingsFile() {
        const fileInput = document.getElementById('form-settings-file-input');
        if (fileInput) {
            fileInput.click();
        }
    },

    handleImportFormSettingsFileContent(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const data = JSON.parse(content);
                this.importFormSettingsData(data);
            } catch (error) {
                Notification.error('فشل قراءة الملف. تأكد من أن الملف بصيغة JSON صحيحة: ' + error.message);
            }
        };
        reader.onerror = () => {
            Notification.error('حدث خطأ أثناء قراءة الملف.');
        };
        reader.readAsText(file);
    },

    importFormSettingsData(data) {
        if (!data || typeof data !== 'object') {
            Notification.error('صيغة البيانات غير صحيحة.');
            return;
        }

        const state = this.getFormSettingsState();
        if (!state) {
            Utils.safeError('❌ فشل تهيئة حالة إعدادات النماذج');
            return;
        }
        let imported = false;

        // استيراد المواقع
        if (Array.isArray(data.sites) && data.sites.length > 0) {
            const importedSites = data.sites.map((site, index) => {
                const siteId = site.id || Utils.generateId('SITE');
                const siteName = site.name || site.title || site.label || `موقع ${index + 1}`;
                const placesSource = Array.isArray(site.places)
                    ? site.places
                    : Array.isArray(site.locations)
                        ? site.locations
                        : Array.isArray(site.children)
                            ? site.children
                            : Array.isArray(site.areas)
                                ? site.areas
                                : [];
                const places = placesSource.map((place, idx) => ({
                    id: place.id || place.placeId || place.value || Utils.generateId('PLACE'),
                    name: place.name || place.placeName || place.title || place.label || place.locationName || `مكان ${idx + 1}`
                }));
                return {
                    id: siteId,
                    name: siteName,
                    places
                };
            });
            state.sites = importedSites;
            state.selectedSiteId = importedSites[0]?.id || '';
            imported = true;
        }

        // استيراد الإدارات
        if (Array.isArray(data.departments) && data.departments.length > 0) {
            state.departments = data.departments
                .map((item) => String(item || '').trim())
                .filter(Boolean);
            imported = true;
        } else if (typeof data.departments === 'string') {
            state.departments = data.departments
                .split(/\n|,/)
                .map((item) => item.trim())
                .filter(Boolean);
            imported = true;
        }

        // استيراد فريق السلامة
        if (Array.isArray(data.safetyTeam) && data.safetyTeam.length > 0) {
            state.safetyTeam = data.safetyTeam
                .map((item) => String(item || '').trim())
                .filter(Boolean);
            imported = true;
        } else if (Array.isArray(data.safetyTeamMembers) && data.safetyTeamMembers.length > 0) {
            state.safetyTeam = data.safetyTeamMembers
                .map((item) => String(item || '').trim())
                .filter(Boolean);
            imported = true;
        } else if (typeof data.safetyTeam === 'string') {
            state.safetyTeam = data.safetyTeam
                .split(/\n|,/)
                .map((item) => item.trim())
                .filter(Boolean);
            imported = true;
        }

        if (imported) {
            this.refreshFormSettingsUI();
            Notification.success('تم استيراد البيانات بنجاح. يمكنك مراجعة التعديلات وحفظها.');
        } else {
            Notification.warning('لم يتم العثور على بيانات صحيحة للاستيراد.');
        }
    },

    handleExportFormSettings() {
        const state = this.getFormSettingsState();
        if (!state) {
            Utils.safeError('❌ فشل تهيئة حالة إعدادات النماذج');
            return;
        }
        const exportData = {
            sites: state.sites || [],
            departments: state.departments || [],
            safetyTeam: state.safetyTeam || []
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `form-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Notification.success('تم تصدير البيانات بنجاح.');
    },

    handlePasteFormSettings() {
        const pasteArea = document.getElementById('form-settings-paste-area');
        if (!pasteArea) return;

        const text = pasteArea.value.trim();
        if (!text) {
            Notification.warning('الرجاء لصق البيانات في المنطقة النصية أولاً.');
            return;
        }

        try {
            const data = JSON.parse(text);
            this.importFormSettingsData(data);
            pasteArea.value = '';
        } catch (error) {
            Notification.error('صيغة JSON غير صحيحة. تحقق من البيانات: ' + error.message);
        }
    },

    handleCopyFormSettings() {
        const state = this.getFormSettingsState();
        if (!state) {
            Utils.safeError('❌ فشل تهيئة حالة إعدادات النماذج');
            return;
        }
        const exportData = {
            sites: state.sites || [],
            departments: state.departments || [],
            safetyTeam: state.safetyTeam || []
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const pasteArea = document.getElementById('form-settings-paste-area');
        if (pasteArea) {
            pasteArea.value = jsonString;
            pasteArea.select();
            pasteArea.setSelectionRange(0, 99999); // للأجهزة المحمولة
        }

        // نسخ إلى الحافظة
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(jsonString).then(() => {
                Notification.success('تم نسخ البيانات إلى الحافظة.');
            }).catch(() => {
                // Fallback: استخدام execCommand
                try {
                    const textArea = document.createElement('textarea');
                    textArea.value = jsonString;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    Notification.success('تم نسخ البيانات إلى الحافظة.');
                } catch (err) {
                    Notification.error('فشل نسخ البيانات. حاول يدوياً من المنطقة النصية.');
                }
            });
        } else {
            // Fallback للمتصفحات القديمة
            try {
                const textArea = document.createElement('textarea');
                textArea.value = jsonString;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                Notification.success('تم نسخ البيانات إلى الحافظة.');
            } catch (err) {
                Notification.error('فشل نسخ البيانات. استخدم Ctrl+C على النص في المنطقة النصية.');
            }
        }
    },

    handleClearPasteArea() {
        const pasteArea = document.getElementById('form-settings-paste-area');
        if (pasteArea) {
            pasteArea.value = '';
            pasteArea.focus();
        }
    },

    /**
     * الحصول على صلاحيات المستخدم من قاعدة البيانات
     */
    getDatabasePermissions(user) {
        if (!user || !user.email) {
            if (AppState.debugMode) {
                Utils.safeWarn('⚠️ getDatabasePermissions: لا يوجد مستخدم أو بريد إلكتروني');
            }
            return null;
        }
        
        // ✅ إصلاح: التأكد من وجود AppState.appData.users
        if (!AppState.appData || !AppState.appData.users) {
            if (AppState.debugMode) {
                Utils.safeLog('ℹ️ getDatabasePermissions: AppState.appData.users غير محملة بعد');
            }
            return null;
        }
        
        const users = AppState.appData.users || [];
        const emailKey = (user.email || user.id || '').toString().toLowerCase().trim();
        const dbUser = users.find(u => (u.email && u.email.toString().toLowerCase().trim() === emailKey) || (u.id && /@/.test(String(u.id)) && u.id.toString().toLowerCase().trim() === emailKey));
        
        if (!dbUser) {
            if (AppState.debugMode) {
                Utils.safeLog(`ℹ️ getDatabasePermissions: المستخدم ${user.email} غير موجود في قاعدة البيانات`);
            }
            return null;
        }
        
        // ✅ إصلاح: تطبيع الصلاحيات والتأكد من أنها كائن صالح
        const normalized = this.normalizePermissions(dbUser.permissions);
        if (normalized && typeof normalized === 'object' && !Array.isArray(normalized)) {
            if (AppState.debugMode) {
                Utils.safeLog(`✅ getDatabasePermissions: تم العثور على صلاحيات للمستخدم ${user.email}`, Object.keys(normalized).length, 'صلاحية');
            }
            return normalized;
        } else {
            // إذا كانت الصلاحيات غير صالحة، نعيد كائن فارغ بدلاً من null
            if (AppState.debugMode) {
                Utils.safeWarn(`⚠️ getDatabasePermissions: صلاحيات المستخدم ${user.email} غير صالحة - إرجاع كائن فارغ`);
            }
            return {};
        }
    },

    /**
     * الحصول على الصلاحيات النهائية للمستخدم (جلسة + قاعدة بيانات)
     * يعطي الأولوية للصلاحيات من قاعدة البيانات لضمان المزامنة الفورية
     * 
     * ⚠️ مهم: لا يتم استخدام DEFAULT_ROLE_PERMISSIONS هنا - فقط الصلاحيات الممنوحة صراحةً من قبل المدير
     * 
     * @param {Object} user - بيانات المستخدم (افتراضي: المستخدم الحالي)
     * @returns {Object} - كائن الصلاحيات الفعالة
     */
    getEffectivePermissions(user = AppState.currentUser) {
        if (!user) return {};
        if (user.role === 'admin') {
            return { __isAdmin: true };
        }

        const effective = {};

        // ✅ إصلاح: الحصول على الصلاحيات من الجلسة أولاً (لضمان العمل حتى لو لم تكن البيانات محملة)
        const sessionPermissions = this.normalizePermissions(user.permissions);
        if (sessionPermissions && typeof sessionPermissions === 'object' && Object.keys(sessionPermissions).length > 0) {
            // دمج الصلاحيات من الجلسة
            // ✅ إصلاح: استخدام deep merge للصلاحيات التفصيلية
            Object.keys(sessionPermissions).forEach(key => {
                if (key.endsWith('Permissions') && typeof sessionPermissions[key] === 'object') {
                    // الصلاحيات التفصيلية - دمج عميق
                    effective[key] = { ...(effective[key] || {}), ...sessionPermissions[key] };
                } else {
                    // الصلاحيات الأساسية
                    effective[key] = sessionPermissions[key];
                }
            });
        }

        // الحصول على الصلاحيات من قاعدة البيانات (الأحدث - لها الأولوية)
        const dbPermissions = this.getDatabasePermissions(user);
        if (dbPermissions && typeof dbPermissions === 'object' && Object.keys(dbPermissions).length > 0) {
            // ✅ إصلاح: دمج عميق للصلاحيات من قاعدة البيانات (الأولوية - تستبدل الصلاحيات من الجلسة)
            Object.keys(dbPermissions).forEach(key => {
                if (key.endsWith('Permissions') && typeof dbPermissions[key] === 'object') {
                    // الصلاحيات التفصيلية - دمج عميق
                    effective[key] = { ...(effective[key] || {}), ...dbPermissions[key] };
                } else {
                    // الصلاحيات الأساسية
                    effective[key] = dbPermissions[key];
                }
            });

            // تحديث صلاحيات المستخدم الحالي في AppState إذا كان هو المستخدم الحالي
            if (user === AppState.currentUser || (user.email && AppState.currentUser && user.email === AppState.currentUser.email)) {
                AppState.currentUser.permissions = dbPermissions;
            }
        }

        // عند عدم وجود أي صلاحيات ممنوحة (مستخدم جديد أو data بدون role/permissions في Supabase): منح الوحدات غير المحصورة بالمدير افتراضياً لدور "user" حتى لا تختفي الوحدات من الواجهة
        const role = (user.role || '').toString().trim().toLowerCase();
        const moduleKeysSet = new Set(MODULE_PERMISSIONS_CONFIG.map(m => m.key));
        const hasAnyModulePermission = Object.keys(effective).some(k => moduleKeysSet.has(k));
        if (role === 'user' && !hasAnyModulePermission) {
            MODULE_PERMISSIONS_CONFIG.forEach(({ key, adminOnly }) => {
                if (!adminOnly) effective[key] = true;
            });
        }

        return effective;
    },

    /**
     * التحقق من صلاحية المستخدم للوصول إلى مديول معين
     * 
     * ⚠️ مهم: لا توجد صلاحيات افتراضية - جميع الصلاحيات يجب منحها صراحةً من قبل مدير النظام
     * 
     * @param {string} moduleName - اسم الموديول
     * @returns {boolean} - true إذا كان لديه صلاحية، false إذا لم يكن لديه صلاحية
     */
    hasAccess(moduleName) {
        const user = AppState.currentUser;
        if (!user) {
            if (AppState.debugMode) {
                Utils.safeWarn(`⚠️ hasAccess(${moduleName}): لا يوجد مستخدم مسجل دخول`);
            }
            return false;
        }

        // التحقق من الموديولات المحمية (adminOnly)
        const moduleConfig = MODULE_PERMISSIONS_CONFIG.find(m => m.key === moduleName);
        if (moduleConfig && moduleConfig.adminOnly) {
            // الموديولات المحمية متاحة لمدير النظام فقط
            const isAdmin = user.role === 'admin';
            if (AppState.debugMode && !isAdmin) {
                Utils.safeLog(`🔒 hasAccess(${moduleName}): موديول محمي - يتطلب صلاحيات مدير`);
            }
            return isAdmin;
        }

        // المدير لديه صلاحيات كاملة — التحقق من role في الجلسة أو من قاعدة البيانات (AppState.appData.users)
        let role = (user.role || '').toString().trim().toLowerCase();
        if (role !== 'admin' && AppState.appData && Array.isArray(AppState.appData.users)) {
            const emailOrId = (user.email || user.id || '').toString().toLowerCase().trim();
            const dbUser = AppState.appData.users.find(u =>
                (u.email && u.email.toString().toLowerCase().trim() === emailOrId) ||
                (u.id && /@/.test(String(u.id)) && u.id.toString().toLowerCase().trim() === emailOrId)
            );
            if (dbUser && dbUser.role) {
                role = String(dbUser.role).trim().toLowerCase();
            }
        }
        if (role === 'admin') {
            if (AppState.debugMode) {
                Utils.safeLog(`✅ hasAccess(${moduleName}): مدير النظام - صلاحية كاملة`);
            }
            return true;
        }
        // لوحة التحكم متاحة دائماً لأي مستخدم مسجل دخول (حتى لو لم يُمنح صلاحيات بعد)
        if (moduleName === 'dashboard') {
            if (AppState.debugMode) {
                Utils.safeLog(`✅ hasAccess(dashboard): متاح لجميع المستخدمين المسجلين`);
            }
            return true;
        }

        // التحقق من الصلاحيات المخصصة للمستخدم (الممنوحة من قبل مدير النظام فقط)
        // ⚠️ لا يتم استخدام DEFAULT_ROLE_PERMISSIONS هنا - فقط الصلاحيات الممنوحة صراحةً
        const effectivePermissions = this.getEffectivePermissions(user);
        if (Object.prototype.hasOwnProperty.call(effectivePermissions, moduleName)) {
            const hasAccess = effectivePermissions[moduleName] === true;
            if (AppState.debugMode) {
                Utils.safeLog(`🔍 hasAccess(${moduleName}): ${hasAccess ? '✅ مسموح' : '❌ غير مسموح'} (من الصلاحيات الفعالة)`);
            }
            return hasAccess;
        }

        // ⚠️ لا توجد صلاحيات افتراضية - يجب منحها من قبل مدير النظام فقط
        if (AppState.debugMode) {
            Utils.safeLog(`❌ hasAccess(${moduleName}): لا توجد صلاحية - يجب منحها من قبل المدير`);
        }
        return false;
    },

    /**
     * التحقق من صلاحية تفصيلية داخل مديول
     * @param {string} moduleName - اسم المديول (مثل 'incidents', 'clinic')
     * @param {string} permissionKey - مفتاح الصلاحية التفصيلية (مثل 'analysis', 'registry')
     * @returns {boolean} - true إذا كان لديه صلاحية
     */
    hasDetailedPermission(moduleName, permissionKey) {
        const user = AppState.currentUser;
        if (!user) return false;

        // المدير لديه صلاحيات كاملة
        if (user.role === 'admin') return true;

        // التحقق من وجود صلاحية الوصول للمديول أولاً
        if (!this.hasAccess(moduleName)) return false;

        // الحصول على الصلاحيات الفعالة
        const effectivePermissions = this.getEffectivePermissions(user);
        
        // التحقق من الصلاحيات التفصيلية
        const detailedPerms = effectivePermissions[`${moduleName}Permissions`];
        if (detailedPerms && typeof detailedPerms === 'object') {
            return detailedPerms[permissionKey] === true;
        }

        // إذا لم توجد صلاحيات تفصيلية، نعطي الوصول الكامل للمديول
        // (للتوافق مع المستخدمين القدامى)
        return true;
    },

    /**
     * الحصول على قائمة الصلاحيات التفصيلية المسموح بها لمديول معين
     * @param {string} moduleName - اسم المديول
     * @returns {Array} - مصفوفة بمفاتيح الصلاحيات المسموح بها
     */
    getAllowedDetailedPermissions(moduleName) {
        const user = AppState.currentUser;
        if (!user) return [];

        // المدير لديه صلاحيات كاملة
        if (user.role === 'admin') {
            const moduleDetails = MODULE_DETAILED_PERMISSIONS[moduleName];
            if (moduleDetails && moduleDetails.permissions) {
                return moduleDetails.permissions.map(p => p.key);
            }
            return [];
        }

        // التحقق من وجود صلاحية الوصول للمديول أولاً
        if (!this.hasAccess(moduleName)) return [];

        const effectivePermissions = this.getEffectivePermissions(user);
        const detailedPerms = effectivePermissions[`${moduleName}Permissions`];
        
        if (detailedPerms && typeof detailedPerms === 'object') {
            return Object.keys(detailedPerms).filter(key => detailedPerms[key] === true);
        }

        // إذا لم توجد صلاحيات تفصيلية، نعطي الوصول الكامل
        const moduleDetails = MODULE_DETAILED_PERMISSIONS[moduleName];
        if (moduleDetails && moduleDetails.permissions) {
            return moduleDetails.permissions.map(p => p.key);
        }

        return [];
    },





    /* Deprecated training helpers within Permissions
    openAnnualPlanItemForm(year, itemId = null, onSave = null) {
        const plan = this.getAnnualPlan(year, { createIfMissing: true });
        const item = plan.items.find(i => i.id === itemId) || null;
        const positions = this.getUniquePositions();
        // ✅ تم التحديث: استخدام ApprovedContractors فقط
        const contractors = (typeof Contractors !== 'undefined' && typeof Contractors.getAllContractorsForModules === 'function')
            ? Contractors.getAllContractorsForModules().map(contractor => contractor.name || contractor.companyName).filter(Boolean)
            : (AppState.appData.approvedContractors || []).map(contractor => contractor.companyName || contractor.name).filter(Boolean);
        const topics = this.getAllTrainingTopics();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-calendar-plus ml-2"></i>
                        ${item ? 'تعديل عنصر الخطة' : 'إضافة عنصر جديد للخطة'}
                    </h2>
                    <button class="modal-close" title="إغلاق">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="annual-plan-item-form">
                    <div class="modal-body space-y-5">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الموضوع التدريبي *</label>
                                <input type="text" id="plan-item-topic" class="form-input" required value="${Utils.escapeHTML(item?.topic || '')}" placeholder="عنوان البرنامج التدريبي">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">التاريخ المخطط *</label>
                                <input type="date" id="plan-item-date" class="form-input" required value="${item?.plannedDate ? new Date(item.plannedDate).toISOString().slice(0, 10) : ''}">
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الفئة المستهدفة *</label>
                                <select id="plan-item-target-type" class="form-input" required>
                                    <option value="employees" ${item?.targetType === 'employees' ? 'selected' : ''}>الموظفون</option>
                                    <option value="contractors" ${item?.targetType === 'contractors' ? 'selected' : ''}>المقاولون</option>
                                    <option value="mixed" ${item?.targetType === 'mixed' ? 'selected' : ''}>الكل</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الحالة</label>
                                <select id="plan-item-status" class="form-input">
                                    <option value="مخطط" ${item?.status === 'مخطط' ? 'selected' : ''}>مخطط</option>
                                    <option value="قيد التنفيذ" ${item?.status === 'قيد التنفيذ' ? 'selected' : ''}>قيد التنفيذ</option>
                                    <option value="مكتمل" ${item?.status === 'مكتمل' ? 'selected' : ''}>مكتمل</option>
                                    <option value="مؤجل" ${item?.status === 'مؤجل' ? 'selected' : ''}>مؤجل</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">السنة</label>
                                <input type="text" class="form-input" value="${year}" disabled>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الوظائف المستهدفة</label>
                                <select id="plan-item-roles" class="form-input" multiple size="5">
                                    ${positions.map(position => `
                                        <option value="${Utils.escapeHTML(position)}" ${item?.targetRoles?.includes(position) ? 'selected' : ''}>${Utils.escapeHTML(position)}</option>
    
        
        modal.querySelector('#quick-training-form')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                const subject = modal.querySelector('#quick-training-subject')?.value.trim();
                const trainer = modal.querySelector('#quick-training-trainer')?.value.trim();
                const trainingType = modal.querySelector('#quick-training-type')?.value || 'داخلي';
                const dateValue = modal.querySelector('#quick-training-date')?.value;
                const location = modal.querySelector('#quick-training-location')?.value.trim();
                const status = modal.querySelector('#quick-training-status')?.value || 'مكتمل';
                const startTime = modal.querySelector('#quick-training-start-time')?.value;
                const endTime = modal.querySelector('#quick-training-end-time')?.value;
                const hoursValue = parseFloat(modal.querySelector('#quick-training-hours')?.value || '0');
                const topicsSelected = this.getSelectedOptionsFromElement(modal.querySelector('#quick-training-topics'));
                
                if (!subject || !trainer || !dateValue) {
                    Notification.warning('يرجى إدخال البيانات الأساسية للتدريب');
                    return;
                }
                
                let computedHours = hoursValue;
                if ((!computedHours || computedHours <= 0) && startTime && endTime) {
                    const start = new Date(`2000-01-01T${startTime}:00`);
                    const end = new Date(`2000-01-01T${endTime}:00`);
                    const diffMs = end - start;
                    if (diffMs > 0) {
                        computedHours = diffMs / (1000 * 60 * 60);
                    }
                }
                
                const trainingId = Utils.generateId('TRAINING');
                const isoDate = new Date(dateValue).toISOString();
                
                const participantEntry = {
                    name: employee.name || '',
                    code: employee.employeeNumber || employee.sapId || '',
                    employeeNumber: employee.employeeNumber || employee.sapId || '',
                    employeeCode: employee.employeeNumber || employee.employeeCode || '',
                    department: employee.department || '',
                    position: employee.position || '',
                    workLocation: employee.location || employee.workLocation || '',
                    type: 'employee',
                    personType: 'employee',
                    topics: topicsSelected
                };
                
                const trainingRecord = {
                    id: trainingId,
                    name: subject,
                    trainer: trainer,
                    trainingType: trainingType,
                    location: location || '',
                    date: isoDate,
                    startDate: isoDate,
                    startTime: startTime || '',
                    endTime: endTime || '',
                    status: status,
                    hours: computedHours > 0 ? computedHours.toFixed(2) : '',
                    participants: [participantEntry],
                    participantsCount: 1,
                    topics: topicsSelected,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                AppState.appData.training.push(trainingRecord);
                this.syncEmployeeTrainingMatrix(trainingRecord);
                
                if (topicsSelected.length) {
                    const year = new Date(dateValue).getFullYear();
                    const plan = this.getAnnualPlan(year, { createIfMissing: false });
                    if (plan) {
                        const nowIso = new Date().toISOString();
                        topicsSelected.forEach(topicName => {
                            const planItem = plan.items.find(item => {
                                if (item.linkedTrainingId) return false;
                                const matchesTopic = item.topic === topicName || (Array.isArray(item.requiredTopics) && item.requiredTopics.includes(topicName));
                                if (!matchesTopic) return false;
                                if (Array.isArray(item.targetRoles) && item.targetRoles.length) {
                                    return item.targetRoles.includes(employee.position);
                                }
                                return item.targetType !== 'contractors';
                            });
                            if (planItem) {
                                planItem.linkedTrainingId = trainingId;
                                planItem.status = 'مكتمل';
                                planItem.updatedAt = nowIso;
                            }
                        });
                    }
                }
                
                const dm = (typeof window !== 'undefined' && window.DataManager) || 
                           (typeof DataManager !== 'undefined' && DataManager);
                if (dm && typeof dm.save === 'function') {
                    dm.save();
                }
                await Promise.allSettled([
                    GoogleIntegration.autoSave?.('Training', AppState.appData.training),
                    GoogleIntegration.autoSave?.('EmployeeTrainingMatrix', AppState.appData.employeeTrainingMatrix)
                ]);
                
                await this.refreshTrainingMatrix();
                this.loadTrainingList();
                Notification.success('تم تسجيل التدريب بنجاح');
                close();
            } catch (error) {
                Utils.safeError('خطأ في تسجيل التدريب السريع:', error);
                Notification.error('تعذر تسجيل التدريب: ' + error.message);
            }
        });
    },
    
    
    
    
    showAnnualPlanModal(initialYear = new Date().getFullYear()) {
        this.ensureData();
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1100px; max-height: 92vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-calendar-check ml-2"></i>
                        الخطة التدريبية السنوية
                    </h2>
                    <div class="flex items-center gap-2 mr-auto">
                        <button class="btn-icon btn-icon-secondary" id="annual-plan-prev-year" title="السنة السابقة">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <input type="number" id="annual-plan-year" class="form-input" style="width: 120px;" value="${initialYear}">
                        <button class="btn-icon btn-icon-secondary" id="annual-plan-next-year" title="السنة التالية">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                    </div>
                    <button class="modal-close" title="إغلاق">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body space-y-6" id="annual-plan-body"></div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" data-action="close">إغلاق</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const close = () => modal.remove();
        modal.querySelector('.modal-close')?.addEventListener('click', close);
        modal.querySelector('[data-action="close"]')?.addEventListener('click', close);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) close();
        });
        
        const traineesInput = modal.querySelector('#contractor-training-trainees');
        const durationInput = modal.querySelector('#contractor-training-duration');
        const totalHoursInput = modal.querySelector('#contractor-training-hours');
        const recalculateTotalHours = () => {
            if (!traineesInput || !durationInput || !totalHoursInput) return;
            const trainees = parseInt(traineesInput.value || '0', 10);
            const duration = parseInt(durationInput.value || '0', 10);
            if (Number.isFinite(trainees) && trainees > 0 && Number.isFinite(duration) && duration > 0) {
                const computed = Number(((trainees * duration) / 60).toFixed(2));
                totalHoursInput.value = computed > 0 ? computed.toFixed(2) : '';
            } else {
                totalHoursInput.value = '';
            }
        };
        traineesInput?.addEventListener('input', () => {
            if (traineesInput.value && parseInt(traineesInput.value, 10) < 0) traineesInput.value = '';
            recalculateTotalHours();
        });
        durationInput?.addEventListener('input', () => {
            if (durationInput.value && parseInt(durationInput.value, 10) < 0) durationInput.value = '';
            recalculateTotalHours();
        });
        recalculateTotalHours();
        
        const yearInput = modal.querySelector('#annual-plan-year');
        const bodyContainer = modal.querySelector('#annual-plan-body');
        const render = async () => {
            const year = parseInt(yearInput.value, 10) || new Date().getFullYear();
            bodyContainer.innerHTML = this.renderAnnualPlanContent(year);
            this.bindAnnualPlanEvents(modal, year);
        };
        
        modal.querySelector('#annual-plan-prev-year')?.addEventListener('click', () => {
            yearInput.value = (parseInt(yearInput.value, 10) || initialYear) - 1;
            render();
        });
        modal.querySelector('#annual-plan-next-year')?.addEventListener('click', () => {
            yearInput.value = (parseInt(yearInput.value, 10) || initialYear) + 1;
            render();
        });
        yearInput?.addEventListener('change', render);
        
        render();
    },
    
    renderAnnualPlanContent(year) {
        const plan = this.getAnnualPlan(year, { createIfMissing: this.isCurrentUserAdmin() });
        if (!plan) {
            return `
                <div class="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                    لم يتم إنشاء خطة تدريبية للسنة ${year} بعد.
                    ${this.isCurrentUserAdmin() ? '<div class="mt-3"><button class="btn-primary" id="create-annual-plan-btn"><i class="fas fa-plus ml-2"></i>إنشاء الخطة التدريبية للسنة</button></div>' : ''}
                </div>
            `;
        }
        
        const stats = this.getAnnualPlanStats(plan);
        
        return `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex flex-wrap gap-4 items-center justify-between">
                    <div>
                        <h3 class="text-lg font-semibold text-blue-900">سنة الخطة: ${year}</h3>
                        <p class="text-sm text-blue-700">تم إنشاء الخطة بواسطة: ${Utils.escapeHTML(plan.createdBy?.name || 'غير معروف')} في ${Utils.formatDate(plan.createdAt)}</p>
                    </div>
                    ${this.isCurrentUserAdmin() ? `
                        <div>
                            <button class="btn-primary" id="add-annual-plan-item-btn">
                                <i class="fas fa-plus ml-2"></i>
                                إضافة عنصر للخطة
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="content-card h-full">
                    <p class="text-sm text-gray-500">إجمالي العناصر</p>
                    <p class="text-2xl font-bold text-gray-900">${stats.total}</p>
                </div>
                <div class="content-card h-full">
                    <p class="text-sm text-gray-500">برامج مكتملة</p>
                    <p class="text-2xl font-bold text-green-600">${stats.completed}</p>
                </div>
                <div class="content-card h-full">
                    <p class="text-sm text-gray-500">قيد التنفيذ</p>
                    <p class="text-2xl font-bold text-blue-600">${stats.inProgress}</p>
                </div>
                <div class="content-card h-full">
                    <p class="text-sm text-gray-500">مؤجلة</p>
                    <p class="text-2xl font-bold text-yellow-600">${stats.delayed}</p>
                </div>
            </div>
            
            <div class="content-card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-clipboard-list ml-2"></i>
                        خطة التدريب التفصيلية (${plan.items.length} بند)
                    </h3>
                </div>
                <div class="card-body">
                    ${plan.items.length ? this.renderAnnualPlanTable(plan, year) : `
                        <div class="text-center text-gray-500 py-8">
                            لا توجد عناصر مسجلة ضمن الخطة الحالية.
                        </div>
                    `}
                </div>
            </div>
        `;
    },
    
    bindAnnualPlanEvents(modal, year) {
        const plan = this.getAnnualPlan(year, { createIfMissing: false });
        if (!plan) {
            modal.querySelector('#create-annual-plan-btn')?.addEventListener('click', () => {
                this.createAnnualPlan(year);
                modal.querySelector('#annual-plan-body').innerHTML = this.renderAnnualPlanContent(year);
                this.bindAnnualPlanEvents(modal, year);
            });
            return;
        }
        
        if (this.isCurrentUserAdmin()) {
            const rerender = () => {
                modal.querySelector('#annual-plan-body').innerHTML = this.renderAnnualPlanContent(year);
                this.bindAnnualPlanEvents(modal, year);
            };
            modal.querySelector('#add-annual-plan-item-btn')?.addEventListener('click', () => this.openAnnualPlanItemForm(year, null, rerender));
            modal.querySelectorAll('[data-action="delete-plan-item"]').forEach(button => {
                button.addEventListener('click', () => {
                    const itemId = button.getAttribute('data-item-id');
                    this.removeAnnualPlanItem(year, itemId);
                    rerender();
                });
            });
            modal.querySelectorAll('[data-action="edit-plan-item"]').forEach(button => {
                button.addEventListener('click', () => {
                    const itemId = button.getAttribute('data-item-id');
                    this.openAnnualPlanItemForm(year, itemId, rerender);
                });
            });
            modal.querySelectorAll('.plan-status-select').forEach(select => {
                select.addEventListener('change', (event) => {
                    const itemId = select.getAttribute('data-item-id');
                    this.updateAnnualPlanItemStatus(year, itemId, event.target.value);
                });
            });
            modal.querySelectorAll('.plan-training-link').forEach(select => {
                select.addEventListener('change', (event) => {
                    const itemId = select.getAttribute('data-item-id');
                    const trainingId = event.target.value;
                    this.linkTrainingToPlanItem(year, itemId, trainingId);
                    rerender();
                });
            });
        }
    },
    
    renderAnnualPlanTable(plan, year) {
        const trainings = AppState.appData.training || [];
        const trainingOptions = trainings
            .map(training => ({
                id: training.id,
                name: training.name || 'بدون عنوان',
                date: training.startDate || training.date || ''
            }))
            .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        
        const renderTargets = (item) => {
            const parts = [];
            if (item.targetType === 'employees') {
                parts.push('الموظفون');
            } else if (item.targetType === 'contractors') {
                parts.push('المقاولون');
            } else {
                parts.push('الموظفون والمقاولون');
            }
            if (Array.isArray(item.targetRoles) && item.targetRoles.length) {
                parts.push(`الوظائف: ${item.targetRoles.map(r => Utils.escapeHTML(r)).join(', ')}`);
            }
            if (Array.isArray(item.targetContractors) && item.targetContractors.length) {
                parts.push(`المقاولون: ${item.targetContractors.map(c => Utils.escapeHTML(c)).join(', ')}`);
            }
            return parts.join(' — ');
        };
        
        const statusOptions = ['مخطط', 'قيد التنفيذ', 'مكتمل', 'مؤجل'];
        
        return `
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>الموضوع</th>
                            <th>التاريخ المخطط</th>
                            <th>الفئة المستهدفة</th>
                            <th>الحالة</th>
                            <th>ربط التدريب</th>
                            <th>ملاحظات</th>
                            ${this.isCurrentUserAdmin() ? '<th>الإجراءات</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${plan.items.sort((a, b) => (a.plannedDate || '').localeCompare(b.plannedDate || '')).map(item => `
                            <tr>
                                <td>
                                    <div class="font-semibold text-gray-900">${Utils.escapeHTML(item.topic || '')}</div>
                                    ${item.requiredTopics && item.requiredTopics.length ? `
                                        <div class="text-xs text-blue-600 mt-1">موضوعات: ${item.requiredTopics.map(topic => Utils.escapeHTML(topic)).join(', ')}</div>
                                    ` : ''}
                                </td>
                                <td>${item.plannedDate ? Utils.formatDate(item.plannedDate) : '—'}</td>
                                <td>${renderTargets(item)}</td>
                                <td>
                                    ${this.isCurrentUserAdmin() ? `
                                        <select class="form-input plan-status-select" data-item-id="${item.id}">
                                            ${statusOptions.map(status => `<option value="${status}" ${item.status === status ? 'selected' : ''}>${status}</option>`).join('')}
                                        </select>
                                    ` : `
                                        <span class="badge ${
                                            item.status === 'مكتمل' ? 'badge-success' :
                                            item.status === 'قيد التنفيذ' ? 'badge-info' :
                                            item.status === 'مؤجل' ? 'badge-warning' : 'badge-secondary'
                                        }">${Utils.escapeHTML(item.status || 'مخطط')}</span>
                                    `}
                                </td>
                                <td>
                                    ${this.isCurrentUserAdmin() ? `
                                        <select class="form-input plan-training-link" data-item-id="${item.id}">
                                            <option value="">—</option>
                                            ${trainingOptions.map(option => `
                                                <option value="${option.id}" ${option.id === item.linkedTrainingId ? 'selected' : ''}>
                                                    ${Utils.escapeHTML(option.name)} (${option.date ? Utils.formatDate(option.date) : 'بدون تاريخ'})
                                                </option>
                                            `).join('')}
                                        </select>
                                    ` : `
                                        ${item.linkedTrainingId ? `<span class="text-sm text-blue-600">مرتبط بسجل تدريب</span>` : '<span class="text-xs text-gray-400">غير مرتبط</span>'}
                                    `}
                                </td>
                                <td>${Utils.escapeHTML(item.notes || '')}</td>
                                ${this.isCurrentUserAdmin() ? `
                                    <td>
                                        <div class="flex items-center gap-2">
                                            <button class="btn-icon btn-icon-primary" data-action="edit-plan-item" data-item-id="${item.id}" title="تعديل العنصر">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn-icon btn-icon-danger" data-action="delete-plan-item" data-item-id="${item.id}" title="حذف العنصر">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                ` : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    openAnnualPlanItemForm(year, itemId = null, onSave = null) {
        const plan = this.getAnnualPlan(year, { createIfMissing: true });
        const item = plan.items.find(i => i.id === itemId) || null;
        const positions = this.getUniquePositions();
        // ✅ تم التحديث: استخدام ApprovedContractors فقط
        const contractors = (typeof Contractors !== 'undefined' && typeof Contractors.getAllContractorsForModules === 'function')
            ? Contractors.getAllContractorsForModules().map(contractor => contractor.name || contractor.companyName).filter(Boolean)
            : (AppState.appData.approvedContractors || []).map(contractor => contractor.companyName || contractor.name).filter(Boolean);
        const topics = this.getAllTrainingTopics();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-calendar-plus ml-2"></i>
                        ${item ? 'تعديل عنصر الخطة' : 'إضافة عنصر جديد للخطة'}
                    </h2>
                    <button class="modal-close" title="إغلاق">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="annual-plan-item-form">
                    <div class="modal-body space-y-5">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الموضوع التدريبي *</label>
                                <input type="text" id="plan-item-topic" class="form-input" required value="${Utils.escapeHTML(item?.topic || '')}" placeholder="عنوان البرنامج التدريبي">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">التاريخ المخطط *</label>
                                <input type="date" id="plan-item-date" class="form-input" required value="${item?.plannedDate ? new Date(item.plannedDate).toISOString().slice(0, 10) : ''}">
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الفئة المستهدفة *</label>
                                <select id="plan-item-target-type" class="form-input" required>
                                    <option value="employees" ${item?.targetType === 'employees' ? 'selected' : ''}>الموظفون</option>
                                    <option value="contractors" ${item?.targetType === 'contractors' ? 'selected' : ''}>المقاولون</option>
                                    <option value="mixed" ${item?.targetType === 'mixed' ? 'selected' : ''}>الكل</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الحالة</label>
                                <select id="plan-item-status" class="form-input">
                                    <option value="مخطط" ${item?.status === 'مخطط' ? 'selected' : ''}>مخطط</option>
                                    <option value="قيد التنفيذ" ${item?.status === 'قيد التنفيذ' ? 'selected' : ''}>قيد التنفيذ</option>
                                    <option value="مكتمل" ${item?.status === 'مكتمل' ? 'selected' : ''}>مكتمل</option>
                                    <option value="مؤجل" ${item?.status === 'مؤجل' ? 'selected' : ''}>مؤجل</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">السنة</label>
                                <input type="text" class="form-input" value="${year}" disabled>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">الوظائف المستهدفة</label>
                                <select id="plan-item-roles" class="form-input" multiple size="5">
                                    ${positions.map(position => `
                                        <option value="${Utils.escapeHTML(position)}" ${item?.targetRoles?.includes(position) ? 'selected' : ''}>${Utils.escapeHTML(position)}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">المقاولون المستهدفون</label>
                                <select id="plan-item-contractors" class="form-input" multiple size="5">
                                    ${contractors.map(name => `
                                        <option value="${Utils.escapeHTML(name)}" ${item?.targetContractors?.includes(name) ? 'selected' : ''}>${Utils.escapeHTML(name)}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">الموضوعات المرتبطة (اختياري)</label>
                            <select id="plan-item-topics" class="form-input" multiple size="5">
                                ${topics.map(topic => `
                                    <option value="${Utils.escapeHTML(topic)}" ${item?.requiredTopics?.includes(topic) ? 'selected' : ''}>${Utils.escapeHTML(topic)}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">ملاحظات</label>
                            <textarea id="plan-item-notes" class="form-input" rows="3" placeholder="تفاصيل إضافية أو أهداف البرنامج">${Utils.escapeHTML(item?.notes || '')}</textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" data-action="close">إلغاء</button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save ml-2"></i>
                            ${item ? 'حفظ التعديلات' : 'إضافة للخطة'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        const close = () => modal.remove();
        modal.querySelector('.modal-close')?.addEventListener('click', close);
        modal.querySelector('[data-action="close"]')?.addEventListener('click', close);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) close();
        });
        
        modal.querySelector('#annual-plan-item-form')?.addEventListener('submit', (event) => {
            event.preventDefault();
            const topic = modal.querySelector('#plan-item-topic')?.value.trim();
            const plannedDate = modal.querySelector('#plan-item-date')?.value;
            const targetType = modal.querySelector('#plan-item-target-type')?.value || 'employees';
            const status = modal.querySelector('#plan-item-status')?.value || 'مخطط';
            const targetRoles = this.getSelectedOptionsFromElement(modal.querySelector('#plan-item-roles'));
            const targetContractors = this.getSelectedOptionsFromElement(modal.querySelector('#plan-item-contractors'));
            const requiredTopics = this.getSelectedOptionsFromElement(modal.querySelector('#plan-item-topics'));
            const notes = modal.querySelector('#plan-item-notes')?.value.trim();
            
            if (!topic || !plannedDate) {
                Notification.warning('يرجى إدخال الموضوع والتاريخ المخطط');
                return;
            }
            
            const entry = {
                id: item?.id || Utils.generateId('PLANITEM'),
                topic,
                plannedDate: new Date(plannedDate).toISOString(),
                targetType,
                status,
                targetRoles,
                targetContractors,
                requiredTopics,
                notes,
                linkedTrainingId: item?.linkedTrainingId || '',
                createdAt: item?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            this.upsertAnnualPlanItem(year, entry);
            Notification.success(item ? 'تم تحديث العنصر بنجاح' : 'تم إضافة العنصر إلى الخطة');
            close();
            if (typeof onSave === 'function') {
                onSave();
            }
        });
    },
    
    isCurrentUserAdmin() {
        return (AppState.currentUser?.role || '').toLowerCase() === 'admin';
    },
    
    getAnnualPlan(year, { createIfMissing = false } = {}) {
        this.ensureData();
        if (!Array.isArray(AppState.appData.annualTrainingPlans)) {
            AppState.appData.annualTrainingPlans = [];
        }
        let plan = AppState.appData.annualTrainingPlans.find(p => p.year === year);
        if (!plan && createIfMissing && this.isCurrentUserAdmin()) {
            plan = this.createAnnualPlan(year);
        }
        return plan || null;
    },
    
    createAnnualPlan(year) {
        const plan = {
            id: `PLAN-${year}`,
            year,
            createdBy: {
                id: AppState.currentUser?.id || '',
                name: AppState.currentUser?.name || AppState.currentUser?.displayName || AppState.currentUser?.email || 'مسؤول النظام',
                email: AppState.currentUser?.email || ''
            },
            createdAt: new Date().toISOString(),
            items: []
        };
        AppState.appData.annualTrainingPlans.push(plan);
        const dm = (typeof window !== 'undefined' && window.DataManager) || 
                   (typeof DataManager !== 'undefined' && DataManager);
        if (dm && typeof dm.save === 'function') {
            dm.save();
        }
        Notification.success(`تم إنشاء الخطة التدريبية للسنة ${year}`);
        return plan;
    },
    
    upsertAnnualPlanItem(year, entry) {
        const plan = this.getAnnualPlan(year, { createIfMissing: true });
        const index = plan.items.findIndex(i => i.id === entry.id);
        if (index >= 0) {
            plan.items[index] = entry;
        } else {
            plan.items.push(entry);
        }
        plan.updatedAt = new Date().toISOString();
        const dm = (typeof window !== 'undefined' && window.DataManager) || 
                   (typeof DataManager !== 'undefined' && DataManager);
        if (dm && typeof dm.save === 'function') {
            dm.save();
        }
    },
    
    getAnnualPlanStats(plan) {
        const stats = {
            total: plan.items.length,
            completed: plan.items.filter(item => item.status === 'مكتمل').length,
            inProgress: plan.items.filter(item => item.status === 'قيد التنفيذ').length,
            delayed: plan.items.filter(item => item.status === 'مؤجل').length
        };
        return stats;
    },
    
    updateAnnualPlanItemStatus(year, itemId, status) {
        const plan = this.getAnnualPlan(year, { createIfMissing: false });
        if (!plan) return;
        const item = plan.items.find(i => i.id === itemId);
        if (!item) return;
        item.status = status;
        item.updatedAt = new Date().toISOString();
        const dm = (typeof window !== 'undefined' && window.DataManager) || 
                   (typeof DataManager !== 'undefined' && DataManager);
        if (dm && typeof dm.save === 'function') {
            dm.save();
        }
        Notification.success('تم تحديث حالة العنصر');
    },
    
    linkTrainingToPlanItem(year, itemId, trainingId) {
        const plan = this.getAnnualPlan(year, { createIfMissing: false });
        if (!plan) return;
        const item = plan.items.find(i => i.id === itemId);
        if (!item) return;
        item.linkedTrainingId = trainingId || '';
        if (trainingId) {
            item.status = 'مكتمل';
        }
        item.updatedAt = new Date().toISOString();
        const dm = (typeof window !== 'undefined' && window.DataManager) || 
                   (typeof DataManager !== 'undefined' && DataManager);
        if (dm && typeof dm.save === 'function') {
            dm.save();
        }
        Notification.success('تم تحديث ربط العنصر بسجل التدريب');
    },
    
    removeAnnualPlanItem(year, itemId) {
        const plan = this.getAnnualPlan(year, { createIfMissing: false });
        if (!plan) return;
        plan.items = plan.items.filter(item => item.id !== itemId);
        plan.updatedAt = new Date().toISOString();
        const dm = (typeof window !== 'undefined' && window.DataManager) || 
                   (typeof DataManager !== 'undefined' && DataManager);
        if (dm && typeof dm.save === 'function') {
            dm.save();
        }
        Notification.success('تم حذف عنصر الخطة التدريبية');
    },
    */

    /**
     * الحصول على قائمة الوحدات المتاحة للمستخدم الحالي
     */
    getAccessibleModules(includeDefault = false) {
        const user = AppState.currentUser;
        if (!user) return [];
        if (user.role === 'admin') return ['*'];

        // لا يتم إضافة dashboard تلقائياً - يجب منح الصلاحية صراحةً من قبل المدير
        const modules = new Set();
        const effectivePermissions = this.getEffectivePermissions(user);

        // إضافة فقط الصلاحيات الممنوحة صراحةً من قبل مدير النظام
        Object.entries(effectivePermissions).forEach(([module, allowed]) => {
            if (allowed === true) {
                modules.add(module);
            }
        });

        // لا يتم استخدام الصلاحيات الافتراضية - يجب منحها من قبل المدير فقط
        // (تم الاحتفاظ بالمعامل includeDefault للتوافق مع الكود الحالي، لكنه لا يؤثر)

        return Array.from(modules);
    },

    /**
     * إخفاء/إظهار عناصر القائمة حسب الصلاحيات
     */
    updateNavigation() {
        // ✅ إصلاح: التأكد من وجود المستخدم الحالي
        if (!AppState.currentUser) {
            Utils.safeWarn('⚠️ لا يوجد مستخدم مسجل دخول - لا يمكن تحديث القائمة');
            return;
        }

        const navItems = document.querySelectorAll('.nav-item');
        if (navItems.length === 0) {
            // إذا لم تكن عناصر القائمة موجودة بعد، نعيد المحاولة بعد قليل
            setTimeout(() => {
                if (document.querySelectorAll('.nav-item').length > 0) {
                    this.updateNavigation();
                }
            }, 500);
            return;
        }

        navItems.forEach(item => {
            const module = item.getAttribute('data-section');
            if (module) {
                const hasAccess = this.hasAccess(module);
                if (!hasAccess) {
                    item.style.display = 'none';
                } else {
                    item.style.display = '';
                }
            }
        });

        // ✅ إصلاح: تسجيل للمساعدة في التشخيص
        if (AppState.debugMode) {
            const visibleCount = Array.from(navItems).filter(item => item.style.display !== 'none').length;
            Utils.safeLog(`✅ تم تحديث القائمة: ${visibleCount} عنصر مرئي من ${navItems.length} عنصر`);
        }
    },

    /**
     * التحقق من الصلاحيات قبل عرض القسم
     * @param {string} moduleName - اسم الموديول
     * @param {boolean} suppressMessage - إذا كان true، لن يتم عرض رسالة الخطأ (مفيد عند العودة للتنقل)
     * @returns {boolean} - true إذا كان لديه صلاحية، false إذا لم يكن لديه صلاحية
     */
    checkBeforeShow(moduleName, suppressMessage = false) {
        if (!this.hasAccess(moduleName)) {
            // التحقق من إذا كان القسم محمي (adminOnly)
            const moduleConfig = MODULE_PERMISSIONS_CONFIG.find(m => m.key === moduleName);
            const isAdminOnly = moduleConfig && moduleConfig.adminOnly;

            const errorMessage = isAdminOnly
                ? 'هذا القسم متاح لمدير النظام فقط'
                : 'ليس لديك صلاحية للوصول إلى هذا القسم';

            // عرض الرسالة فقط إذا لم يكن suppressMessage = true (أي عند محاولة الوصول الفعلية)
            if (!suppressMessage) {
                // محاولة عرض الرسالة عبر Notification.error
                try {
                    if (typeof Notification !== 'undefined' && typeof Notification.error === 'function') {
                        Notification.error(errorMessage);
                    } else {
                        // في حالة عدم توفر Notification، نستخدم console.error و alert كبديل
                        console.error('⚠️ ' + errorMessage);
                        alert(errorMessage);
                    }
                } catch (error) {
                    // في حالة فشل Notification.error، نستخدم console.error و alert كبديل
                    console.error('⚠️ ' + errorMessage);
                    alert(errorMessage);
                }
            }

            return false;
        }
        return true;
    },

    /**
     * الحصول على تسمية دور المستخدم بالعربية
     */
    getRoleLabel(role) {
        const labels = {
            'admin': 'مدير النظام',
            'safety_officer': 'مسئول السلامة',
            'user': 'مستخدم'
        };
        return labels[role] || role;
    },

    /**
     * التحقق من أن المستخدم الحالي هو مدير النظام
     */
    isAdmin() {
        return AppState.currentUser?.role === 'admin';
    }
};

// ===== Global State =====
const DEFAULT_COMPANY_NAME = '';

const AppState = {
    debugMode: false,
    currentUser: null,
    currentSection: 'dashboard',
    currentLanguage: 'ar',
    navigationHistory: [], // سجل التنقل بين الصفحات
    isPageRefresh: false, // علامة للكشف عن إعادة تحميل الصفحة
    isNavigatingBack: false, // علامة للكشف عن التنقل للخلف
    appData: {
        users: [],
        incidents: [],
        nearmiss: [],
        ptw: [],
        ptwRegistry: [],
        training: [],
        clinicVisits: [],
        medications: [],
        sickLeave: [],
        injuries: [],
        clinicInventory: [],
        fireEquipment: [],
        fireEquipmentAssets: [],
        fireEquipmentInspections: [],
        periodicInspectionCategories: [],
        periodicInspectionRecords: [],
        periodicInspectionSchedules: [],
        periodicInspectionChecklists: [],
        ppe: [],
        violations: [],
        violationTypes: [],
        contractors: [],
        approvedContractors: [],
        contractorEvaluations: [],
        contractorEvaluationCriteria: [],
        contractorApprovalRequests: [],
        employees: [],
        behaviorMonitoring: [],
        chemicalSafety: [],
        dailyObservations: [],
        observationSites: [],
        isoDocuments: [],
        isoProcedures: [],
        isoForms: [],
        emergencyAlerts: [],
        emergencyPlans: [],
        riskAssessments: [],
        sopJHA: [],
        legalDocuments: [], // المستندات القانونية والتشريعية
        legalInventory: [], // سجل حصر التشريعات والقوانين
        hseAudits: [], // عمليات التدقيق والمراجعة
        hseNonConformities: [], // عدم المطابقة
        hseCorrectiveActions: [], // الإجراءات التصحيحية
        hseObjectives: [], // أهدا HSE
        hseRiskAssessments: [], // تقييمات المخاطر HSE
        environmentalAspects: [], // الجوانب البيئية
        environmentalMonitoring: [], // المراقبة البيئية
        sustainability: [], // الاستدامة البيئية
        carbonFootprint: [], // البصمة الكربونية
        wasteManagement: [], // إدارة النايات
        energyEfficiency: [], // كاءة الطاقة
        waterManagement: [], // إدارة المياه
        recyclingPrograms: [], // برامج إعادة التدوير
        safetyTeamMembers: [], // أعضاء فريق السلامة
        safetyOrganizationalStructure: [], // الهيكل الوظيفي لفريق السلامة
        safetyJobDescriptions: [], // الوصف الوظيفي لفريق السلامة
        safetyTeamKPIs: [], // مؤشرات أداء فريق السلامة
        safetyTeamAttendance: [], // حضور فريق السلامة
        safetyTeamLeaves: [], // إجازات فريق السلامة
        safetyTeamTasks: [], // مهام فريق السلامة
        safetyPerformanceKPIs: [], // مؤشرات الأداء للسلامة
        employeeTrainingMatrix: {}, // مصفوفة التدريب لكل موظف
        trainingTopicsByRole: {}, // موضوعات التدريب المطلوبة حسب الوظيفة
        annualTrainingPlans: [], // الخطط التدريبية السنوية
        employeePPEMatrix: {}, // مصوة مهمات الوقاية لكل موظف حسب الوظيفة
        employeePPEMatrixByCode: {}, // مصفوفة مهمات الوقاية لكل موظف مرتبطة بالكود الوظيي
        actionTrackingRegister: [], // سجل متابعة الإجراءات
        safetyBudgets: [], // تعريفات الميزانية المعتمدة
        safetyBudgetTransactions: [], // عمليات الصرف ومتابعة الإنفاق
        workflows: [], // سير العمل والموافقات
        incidentWorkflows: [], // تدفقات عمل الحوادث
        auditLog: [], // سجل عمليات النظام (Audit Log)
        user_activity_log: [], // سجل حركات المستخدمين (User Activity Log)
        systemStatistics: {
            totalLogins: 0 // إجمالي عدد تسجيلات الدخول للنظام
        }
    },
    syncMeta: {
        users: 0,
        // ✅ إضافة: تتبع حالة تحميل كل ورقة
        sheets: {}, // { sheetName: timestamp }
        lastSyncTime: 0, // آخر مرة تم فيها التحميل الكامل
        userEmail: null // البريد الإلكتروني للمستخدم الحالي
    },
    useSupabaseBackend: true,
    supabaseUrl: 'https://rtxleteymcqmtzrozckh.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0eGxldGV5bWNxbXR6cm96Y2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2ODk1MTMsImV4cCI6MjA4NzI2NTUxM30.f5WdaRZXCTpRF65HWA2bZk7sXYxNKVhUtunuuGRX4rs',
    /** مفتاح سري للـ API: يُملأ من js/config.js (__CONFIG__.HSE_API_SECRET) أو يُعيّن هنا */
    hseApiSecret: (typeof window !== 'undefined' && window.__CONFIG__ && window.__CONFIG__.HSE_API_SECRET) ? String(window.__CONFIG__.HSE_API_SECRET).trim() : '',
    googleConfig: {
        appsScript: {
            enabled: false,
            scriptUrl: ''
        },
        sheets: {
            enabled: true,
            spreadsheetId: '',
            apiKey: ''
        },
        maps: {
            enabled: true,
            apiKey: ''
        }
    },
    cloudStorageConfig: {
        onedrive: {
            enabled: false,
            clientId: '',
            clientSecret: '',
            accessToken: '',
            refreshToken: '',
            tokenExpiry: null,
            tenantId: '' // للمؤسسات
        },
        googleDrive: {
            enabled: false,
            clientId: '',
            clientSecret: '',
            accessToken: '',
            refreshToken: '',
            tokenExpiry: null,
            apiKey: ''
        },
        sharepoint: {
            enabled: false,
            clientId: '',
            clientSecret: '',
            accessToken: '',
            refreshToken: '',
            tokenExpiry: null,
            siteUrl: '',
            tenantId: ''
        }
    },
    companyLogo: '',
    companySettings: {
        name: DEFAULT_COMPANY_NAME,
        secondaryName: '',
        address: '',
        phone: '',
        email: '',
        approvalCircuits: {},
        formDepartments: [],
        safetyTeam: []
    },
    dateFormat: 'gregorian', // 'gregorian' or 'hijri'
    notificationEmails: [], // قائمة الإيميلات للإشعارات
    emergencyChannels: ['SMS', 'Email', 'الاتصال الداخلي', 'الإذاعة الداخلية'],
    emergencyTeams: ['فريق الإخلاء', 'فريق مكافحة الحريق', 'فريق الإسعافات الأولية', 'فريق الأمن'],
    legalPortalUrl: '', // رابط بوابة التشريعات
    legalKeywords: [], // كلمات مفتاحية للمتابعة القانونية
    legalAutoNotify: false // تفعيل التنبيهات التلقائية للتحديثات القانونية
};

// ===== Utility Functions =====
const Utils = {
    /**
     * التحقق من بيئة الإنتاج
     */
    isProduction() {
        if (typeof window === 'undefined') return true;
        const hostname = window.location.hostname;
        return hostname !== 'localhost' &&
            !hostname.includes('127.0.0.1') &&
            !hostname.includes('192.168.') &&
            !hostname.includes('10.') &&
            hostname !== '';
    },

    /**
     * تسجيل آمن - لا يسجل في الإنتاج
     */
    safeLog(...args) {
        if (!Utils.isProduction()) {
            console.log(...args);
        }
    },

    /**
     * تسجيل أخطاء آمن - لا يسجل معلومات حساسة في الإنتاج
     */
    safeError(...args) {
        // تجاهل أخطاء Chrome extensions و source maps
        if (args.length > 0) {
            // جمع جميع النصوص من جميع المعاملات للتحقق الشامل
            let allArgsText = '';
            for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                if (typeof arg === 'string') {
                    allArgsText += arg + ' ';
                } else if (arg && typeof arg === 'object') {
                    // التحقق من message و stack و toString
                    if (arg.message) allArgsText += String(arg.message) + ' ';
                    if (arg.stack) allArgsText += String(arg.stack) + ' ';
                    if (arg.toString) allArgsText += String(arg.toString()) + ' ';
                }
            }
            allArgsText = allArgsText.toLowerCase();

            const firstArg = args[0];
            const firstArgStr = String(firstArg || '').toLowerCase();

            // قائمة الأخطاء التي يجب تجاهلها
            const shouldIgnore =
                firstArgStr.includes('runtime.lasterror') ||
                firstArgStr.includes('message port closed') ||
                firstArgStr.includes('receiving end does not exist') ||
                firstArgStr.includes('could not establish connection') ||
                firstArgStr.includes('.map') ||
                firstArgStr.includes('sourcemap') ||
                firstArgStr.includes('content security policy') ||
                firstArgStr.includes('frame-ancestors') ||
                firstArgStr.includes('translator') ||
                firstArgStr.includes('uploadmanager') ||
                firstArgStr.includes('upload-manager') ||
                (firstArgStr.includes('cannot read properties of undefined') && firstArgStr.includes('document')) ||
                allArgsText.includes('uploadmanager') ||
                allArgsText.includes('upload-manager') ||
                (allArgsText.includes('cannot read properties of undefined') && allArgsText.includes('document')) ||
                allArgsText.includes('uploadmanager.js') ||
                firstArgStr.includes('معرف google sheets غير محدد') ||
                firstArgStr.includes('google sheets id') ||
                firstArgStr.includes('spreadsheet id') ||
                firstArgStr.includes('sendrequest (savetosheet)') ||
                firstArgStr.includes('sendrequest (appendtosheet)') ||
                firstArgStr.includes('sendrequest (readfromsheet)') ||
                (firstArgStr.includes('خطأ في الوصول إلى الكاميرا') && (allArgsText.includes('notallowederror') || allArgsText.includes('permission denied'))) ||
                (firstArgStr.includes('خطأ في الوصول إلى الكاميرا') && allArgsText.includes('permissions policy violation'));

            if (typeof firstArg === 'string' && shouldIgnore) {
                return; // تجاهل هذه الأخطاء
            }

            if (firstArg && typeof firstArg === 'object') {
                const msg = String(firstArg.message || firstArg.toString() || '').toLowerCase();
                const stack = String(firstArg.stack || '').toLowerCase();
                const combined = msg + ' ' + stack;

                if (combined.includes('runtime.lasterror') ||
                    combined.includes('message port closed') ||
                    combined.includes('receiving end does not exist') ||
                    combined.includes('could not establish connection') ||
                    combined.includes('.map') ||
                    combined.includes('sourcemap') ||
                    combined.includes('frame-ancestors') ||
                    combined.includes('translator') ||
                    combined.includes('uploadmanager') ||
                    combined.includes('upload-manager') ||
                    (combined.includes('cannot read properties of undefined') && combined.includes('document')) ||
                    combined.includes('uploadmanager.js') ||
                    combined.includes('معرف google sheets غير محدد') ||
                    combined.includes('google sheets id') ||
                    combined.includes('spreadsheet id')) {
                    return; // تجاهل هذه الأخطاء
                }
            }
        }

        // فحص إضافي شامل قبل السجل - للتحقق من جميع المعاملات
        let allText = '';
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (typeof arg === 'string') {
                allText += arg + ' ';
            } else if (arg && typeof arg === 'object') {
                if (arg.message) allText += String(arg.message) + ' ';
                if (arg.stack) allText += String(arg.stack) + ' ';
                if (arg.toString) allText += String(arg.toString()) + ' ';
            }
        }
        allText = allText.toLowerCase();

        // تجاهل أخطاء uploadmanager و document errors
        if (allText.includes('uploadmanager') ||
            allText.includes('upload-manager') ||
            allText.includes('uploadmanager.js') ||
            (allText.includes('cannot read properties of undefined') && allText.includes('document'))) {
            return; // تجاهل هذه الأخطاء تماماً
        }

        // تجاهل أخطاء "Failed to fetch" المتعلقة بـ Google Sheets عندما تكون غير مفعّلة
        if (allText.includes('خطأ في طلب google sheets') &&
            (allText.includes('failed to fetch') || allText.includes('networkerror'))) {
            // التحقق من حالة Google Sheets
            const isGoogleAppsScriptEnabled = window.AppState?.googleConfig?.appsScript?.enabled &&
                window.AppState?.googleConfig?.appsScript?.scriptUrl;
            if (!isGoogleAppsScriptEnabled) {
                return; // تجاهل الخطأ إذا كانت Google Sheets غير مفعّلة
            }
        }

        // تجاهل أخطاء الكاميرا المتعلقة بالصلاحيات
        if (allText.includes('خطأ في الوصول إلى الكاميرا') &&
            (allText.includes('notallowederror') ||
                allText.includes('permission denied') ||
                allText.includes('permissions policy violation'))) {
            return; // تجاهل أخطاء صلاحيات الكاميرا
        }

        if (!Utils.isProduction()) {
            console.error(...args);
        } else {
            // في الإنتاج، نسجل فقط رسائل عامة بدون تفاصيل
            const safeArgs = args.map(arg => {
                if (typeof arg === 'string') {
                    // إزالة أي معلومات حساسة محتملة
                    return arg.replace(/password|token|key|secret|hash/gi, '[REDACTED]');
                }
                if (arg && typeof arg === 'object') {
                    // محاولة استخراج معلومات مفيدة من الكائن
                    if (arg instanceof Error) {
                        return {
                            name: arg.name,
                            message: String(arg.message || '').replace(/password|token|key|secret|hash/gi, '[REDACTED]'),
                            stack: arg.stack ? String(arg.stack).split('\n').slice(0, 3).join('\n') : undefined
                        };
                    }
                    if (arg.message) {
                        return {
                            message: String(arg.message).replace(/password|token|key|secret|hash/gi, '[REDACTED]'),
                            ...(arg.code ? { code: arg.code } : {}),
                            ...(arg.status ? { status: arg.status } : {}),
                            ...(arg.statusText ? { statusText: arg.statusText } : {})
                        };
                    }
                    // محاولة تحويل الكائن إلى JSON مع معالجة الأخطاء
                    try {
                        const jsonStr = JSON.stringify(arg, null, 2);
                        if (jsonStr.length > 500) {
                            return JSON.parse(jsonStr.substring(0, 500) + '...');
                        }
                        return JSON.parse(jsonStr);
                    } catch (e) {
                        return String(arg).replace(/password|token|key|secret|hash/gi, '[REDACTED]');
                    }
                }
                return String(arg || '[Object]');
            });
            // تجاهل أخطاء Chrome Extensions - تحقق شامل من جميع المعاملات
            for (let i = 0; i < safeArgs.length; i++) {
                const argStr = String(safeArgs[i] || '').toLowerCase();
                if (argStr.includes('runtime.lasterror') ||
                    argStr.includes('message port closed') ||
                    argStr.includes('receiving end does not exist') ||
                    argStr.includes('could not establish connection') ||
                    argStr.includes('extension context invalidated') ||
                    argStr.includes('the message port closed') ||
                    argStr.includes('uploadmanager') ||
                    argStr.includes('upload-manager') ||
                    argStr.includes('uploadmanager.js') ||
                    (argStr.includes('cannot read properties of undefined') && argStr.includes('document'))) {
                    return; // تجاهل هذه الأخطاء تماماً
                }
                // تحقق من الكائنات أيضاً
                if (safeArgs[i] && typeof safeArgs[i] === 'object') {
                    try {
                        const objStr = JSON.stringify(safeArgs[i]).toLowerCase();
                        if (objStr.includes('runtime.lasterror') ||
                            objStr.includes('message port closed') ||
                            objStr.includes('receiving end does not exist') ||
                            objStr.includes('could not establish connection') ||
                            objStr.includes('uploadmanager') ||
                            objStr.includes('upload-manager') ||
                            objStr.includes('uploadmanager.js') ||
                            (objStr.includes('cannot read properties of undefined') && objStr.includes('document'))) {
                            return; // تجاهل هذه الأخطاء تماماً
                        }
                    } catch (e) {
                        // إذا فشل JSON.stringify، نتحقق من message و stack مباشرة
                        if (safeArgs[i].message) {
                            const msg = String(safeArgs[i].message).toLowerCase();
                            if (msg.includes('uploadmanager') ||
                                msg.includes('upload-manager') ||
                                (msg.includes('cannot read properties of undefined') && msg.includes('document')) ||
                                (msg.includes('htmlstyleelement') && msg.includes('document'))) {
                                return;
                            }
                        }
                        if (safeArgs[i].stack) {
                            const stack = String(safeArgs[i].stack).toLowerCase();
                            if (stack.includes('uploadmanager') ||
                                stack.includes('upload-manager') ||
                                stack.includes('uploadmanager.js') ||
                                (stack.includes('htmlstyleelement') && stack.includes('document'))) {
                                return;
                            }
                        }
                    }
                }
            }
            console.error(...safeArgs);
        }
    },

    /**
     * إنشاء Promise مع timeout مع تنظيف الـ timer لمنع unhandled rejections
     * @param {Promise} promise - الـ Promise الأصلي
     * @param {number} timeoutMs - المهلة بالميلي ثانية
     * @param {string|Error|Function} timeoutError - رسالة/خطأ أو دالة تُرجع Error/Message
     * @returns {Promise}
     */
    promiseWithTimeout(promise, timeoutMs = 10000, timeoutError = 'انتهت مهلة العملية') {
        let timeoutId = null;
        let settled = false;

        const normalizedPromise = Promise.resolve(promise)
            .finally(() => {
                settled = true;
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
            });

        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                // إذا كان الـ promise الأساسي انتهى، لا نرمي خطأ
                if (settled) return;

                try {
                    const value = (typeof timeoutError === 'function') ? timeoutError() : timeoutError;
                    if (value instanceof Error) {
                        reject(value);
                    } else {
                        reject(new Error(String(value || 'انتهت مهلة العملية')));
                    }
                } catch (e) {
                    reject(e instanceof Error ? e : new Error(String(e || 'انتهت مهلة العملية')));
                }
            }, timeoutMs);
        });

        return Promise.race([normalizedPromise, timeoutPromise]);
    },

    /**
     * تسجيل تحذيرات آمن
     */
    safeWarn(...args) {
        // تجاهل التحذيرات المتعلقة بـ Google Sheets و Chrome Extensions
        if (args.length > 0) {
            const argsStr = args.map(arg => String(arg || '')).join(' ');
            if (argsStr.includes('runtime.lastError') ||
                argsStr.includes('message port closed') ||
                argsStr.includes('translator') ||
                argsStr.includes('معرف Google Sheets غير محدد') ||
                argsStr.includes('Google Sheets ID') ||
                argsStr.includes('Spreadsheet ID') ||
                argsStr.includes('sendRequest (saveToSheet)') ||
                argsStr.includes('sendRequest (appendToSheet)') ||
                argsStr.includes('sendRequest (readFromSheet)') ||
                argsStr.includes('معرف Google Sheets غير معرف')) {
                return; // تجاهل هذه التحذيرات
            }

            // تقليل تكرار رسائل Circuit Breaker - تسجيل مرة واحدة كل 30 ثانية
            if (argsStr.includes('Circuit Breaker مفتوح')) {
                const lastLogTime = this._circuitBreakerWarnTime || 0;
                const now = Date.now();
                if (now - lastLogTime < 30000) {
                    return; // تجاهل إذا تم تسجيلها مؤخراً
                }
                this._circuitBreakerWarnTime = now;
            }
        }

        if (!Utils.isProduction()) {
            console.warn(...args);
        }
    },

    /**
     * JSON.stringify آمن يتعامل مع المراجع الدائرية
     */
    safeStringify(obj, space) {
        const seen = new WeakSet();
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return '[Circular Reference]';
                }
                seen.add(value);
            }
            return value;
        }, space);
    },

    /**
     * تنظيف النص لمنع XSS
     */
    escapeHTML(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },

    /**
     * التحقق من صحة البريد الإلكتروني
     */
    isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email.trim());
    },

    async sha256(value) {
        if (value === undefined || value === null) value = '';
        const input = String(value);

        if (window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(input);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        if (window.CryptoJS && window.CryptoJS.SHA256) {
            return window.CryptoJS.SHA256(input).toString();
        }

        throw new Error('SHA-256 not supported in this environment');
    },

    isSha256Hex(value) {
        if (!value || typeof value !== 'string') return false;
        return /^[a-f0-9]{64}$/i.test(value.trim());
    },

    async normalizePasswordForComparison(inputPassword, storedPassword) {
        Utils.safeLog('🔧 normalizePasswordForComparison:', {
            inputPasswordLength: inputPassword?.length || 0,
            storedPasswordLength: storedPassword?.length || 0,
            storedPasswordPrefix: storedPassword ? (storedPassword.substring(0, 20) + '...') : 'غير موجود',
            isStoredPasswordHash: storedPassword ? this.isSha256Hex(storedPassword) : false
        });

        if (storedPassword && this.isSha256Hex(storedPassword)) {
            try {
                const hashedInput = await this.sha256(inputPassword);
                Utils.safeLog('✅ تم تشفير كلمة المرور المدخلة:', {
                    inputPasswordLength: inputPassword.length,
                    hashedInputLength: hashedInput.length,
                    hashedInputPrefix: hashedInput.substring(0, 20) + '...',
                    storedPasswordPrefix: storedPassword.substring(0, 20) + '...'
                });
                return hashedInput;
            } catch (error) {
                Utils.safeWarn('⚠ تعذر توليد SHA-256 للمقارنة:', error);
                return inputPassword;
            }
        }

        Utils.safeWarn('⚠ storedPassword ليس hash صحيح - إرجاع inputPassword كما هو');
        return inputPassword;
    },

    /**
     * تنسيق التاريخ
     */
    formatDateForInput(date) {
        if (!date) return '';
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return '';
        }
    },

    formatDate(date, locale = null) {
        if (!date) return '-';

        const dateFormat = (typeof AppState !== 'undefined' && AppState.dateFormat) ? AppState.dateFormat : 'gregorian';
        const useLocale = locale || (dateFormat === 'hijri' ? 'ar-SA-u-ca-islamic' : 'en-GB');

        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return '-';

            return d.toLocaleDateString(useLocale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                calendar: dateFormat === 'hijri' ? 'islamic' : 'gregory'
            });
        } catch (error) {
            Utils.safeError('خطأ في تنسيق التاريخ:', error);
            return '-';
        }
    },

    /**
     * تنسيق التاريخ والوقت
     */
    formatDateTime(date, locale = null) {
        if (!date) return '-';

        const dateFormat = (typeof AppState !== 'undefined' && AppState.dateFormat) ? AppState.dateFormat : 'gregorian';
        const useLocale = locale || (dateFormat === 'hijri' ? 'ar-SA-u-ca-islamic' : 'ar-EG');
        const isArabicLocale = useLocale.startsWith('ar');

        try {
            let d;
            
            // ✅ معالجة شاملة لجميع أنواع التاريخ
            // إذا كان Date object مباشرة
            if (date instanceof Date) {
                if (isNaN(date.getTime())) return '-';
                d = date;
            } else {
                // معالجة strings
                let dateStr = String(date).trim();
                
                // إذا كانت بصيغة ISO كاملة (تحتوي على T و Z أو +)
                if (dateStr.includes('T') && (dateStr.includes('Z') || dateStr.includes('+') || dateStr.match(/-\d{2}:\d{2}$/))) {
                    d = new Date(dateStr);
                }
                // إذا كانت بصيغة yyyy-MM-dd فقط (10 أحرف)، نضيف وقت افتراضي
                else if (dateStr.length === 10 && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // نستخدم 00:00:00 كوقت افتراضي للبيانات القديمة
                    d = new Date(dateStr + 'T00:00:00');
                }
                // محاولة تحويل أي صيغة أخرى
                else {
                    d = new Date(dateStr);
                }
                
                if (isNaN(d.getTime())) return '-';
            }

            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                calendar: dateFormat === 'hijri' ? 'islamic' : 'gregory'
            };
            
            // Ensure AM/PM is displayed for Arabic locales
            if (isArabicLocale) {
                options.hour12 = true;
            }

            return d.toLocaleString(useLocale, options);
        } catch (error) {
            Utils.safeError('خطأ في تنسيق التاريخ والوقت:', error);
            return '-';
        }
    },

    /**
     * تحويل ISO string أو Date إلى تنسيق datetime-local للعرض في حقول الإدخال
     * يقوم بتحويل التوقيت من UTC إلى التوقيت المحلي بشكل صحيح
     * @param {string|Date} isoOrDate - تاريخ بتنسيق ISO string أو كائن Date
     * @returns {string} تاريخ بتنسيق yyyy-MM-ddTHH:mm للاستخدام في حقول datetime-local
     */
    toDateTimeLocalString(isoOrDate) {
        if (!isoOrDate) return '';
        try {
            const date = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
            if (isNaN(date.getTime())) return '';
            // تحويل من UTC إلى التوقيت المحلي
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - offset * 60000);
            return localDate.toISOString().slice(0, 16);
        } catch (error) {
            Utils.safeError('خطأ في تحويل التاريخ إلى datetime-local:', error);
            return '';
        }
    },

    /**
     * تحويل datetime-local string إلى ISO string بشكل صحيح
     * يحافظ على الوقت المحلي المدخل من قبل المستخدم
     * @param {string} dateTimeLocalString - قيمة datetime-local بصيغة YYYY-MM-DDTHH:mm
     * @returns {string|null} ISO string أو null إذا كانت القيمة غير صحيحة
     */
    dateTimeLocalToISO(dateTimeLocalString) {
        if (!dateTimeLocalString || !dateTimeLocalString.trim()) return null;
        try {
            // datetime-local يعيد قيمة local time بصيغة YYYY-MM-DDTHH:mm
            // نحتاج لإنشاء Date object يمثل هذا الوقت المحلي بشكل صحيح
            const [datePart, timePart] = dateTimeLocalString.trim().split('T');
            if (datePart && timePart) {
                const [year, month, day] = datePart.split('-').map(Number);
                const [hours, minutes] = timePart.split(':').map(Number);
                
                // إنشاء Date object باستخدام الوقت المحلي
                const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
                if (!isNaN(localDate.getTime())) {
                    // تحويل إلى ISO string (سيتم تحويله إلى UTC تلقائياً)
                    return localDate.toISOString();
                }
            }
            // Fallback: استخدام الطريقة القديمة إذا فشل التحليل
            const date = new Date(dateTimeLocalString);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
            return null;
        } catch (error) {
            Utils.safeError('خطأ في تحويل datetime-local إلى ISO:', error);
            return null;
        }
    },

    /**
     * إنشاء معرف فريد (الطريقة القديمة - للتوافق مع الكود القديم)
     */
    generateId(prefix = 'ID') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * توليد معرف متسلسل بتنسيق [PREFIX]_[NUMBER]
     * مثل PTW_01, INC_01, إلخ
     * 
     * @param {string} prefix - البادئة (3 أحرف) مثل PTW, INC, NRM
     * @param {Array} existingData - البيانات الموجودة من قاعدة البيانات
     * @returns {string} معرف جديد بالتنسيق PREFIX_NUMBER
     */
    generateSequentialId(prefix, existingData = []) {
        try {
            if (!prefix || prefix.length !== 3) {
                console.warn('Invalid prefix:', prefix, '- must be exactly 3 characters');
                // Fallback to old method if prefix is invalid
                return this.generateId(prefix);
            }

            // تحويل البادئة إلى أحرف كبيرة
            prefix = prefix.toUpperCase();

            // استخراج جميع الأرقام الموجودة بتنسيق PREFIX_NUMBER
            const existingNumbers = [];
            if (existingData && Array.isArray(existingData)) {
                existingData.forEach(record => {
                    if (record && record.id) {
                        const id = record.id.toString();
                        // التحقق من التنسيق: PREFIX_NUMBER (مثل PTW_01, PTW_100, إلخ)
                        const pattern = new RegExp('^' + prefix + '_\\d+$');
                        if (pattern.test(id)) {
                            // استخراج الرقم
                            const numberPart = id.split('_')[1];
                            const number = parseInt(numberPart, 10);
                            if (!isNaN(number) && number > 0) {
                                existingNumbers.push(number);
                            }
                        }
                    }
                });
            }

            // حساب الرقم التالي
            let nextNumber = 1;
            if (existingNumbers.length > 0) {
                nextNumber = Math.max(...existingNumbers) + 1;
            }

            // التأكد من عدم تجاوز الحد الأقصى (1000000)
            if (nextNumber > 1000000) {
                console.warn('Warning: Sequential number exceeded maximum (1000000), using fallback');
                return this.generateId(prefix);
            }

            // إرجاع المعرف الجديد
            return prefix + '_' + nextNumber.toString();

        } catch (error) {
            console.error('Error in generateSequentialId:', error);
            // في حالة الخطأ، نستخدم الطريقة القديمة كبديل
            return this.generateId(prefix);
        }
    },

    /**
     * الحصول على البادئة المناسبة للموديول
     * @param {string} moduleName - اسم الموديول
     * @returns {string} البادئة (3 أحرف)
     */
    getModulePrefix(moduleName) {
        const prefixMap = {
            // الحوادث والسلامة
            'incidents': 'INC',
            'Incidents': 'INC',
            'nearmiss': 'NRM',
            'NearMiss': 'NRM',
            'ptw': 'PTW',
            'PTW': 'PTW',
            'violations': 'VIO',
            'Violations': 'VIO',

            // التدريب والموظفين
            'training': 'TRN',
            'Training': 'TRN',
            'employees': 'EMP',
            'Employees': 'EMP',

            // المعدات والسلامة
            'fireequipment': 'FEA',
            'FireEquipment': 'FEA',
            'fireequipmentassets': 'EFA',
            'FireEquipmentAssets': 'EFA',
            'fireequipmentinspections': 'FEI',
            'FireEquipmentInspections': 'FEI',
            'ppe': 'PPE',
            'PPE': 'PPE',
            'periodicinspections': 'PIN',
            'PeriodicInspections': 'PIN',
            'periodicinspectioncategories': 'PIC',
            'PeriodicInspectionCategories': 'PIC',
            'periodicinspectionchecklists': 'PIC',
            'PeriodicInspectionChecklists': 'PIC',
            'periodicinspectionschedules': 'PIS',
            'PeriodicInspectionSchedules': 'PIS',
            'periodicinspectionrecords': 'PIR',
            'PeriodicInspectionRecords': 'PIR',

            // المقاولين والعيادة
            // ✅ تم إزالة 'contractors' و 'Contractors' - نعتمد فقط على ApprovedContractors
            'approvedcontractors': 'ACN',
            'ApprovedContractors': 'ACN',
            'contractorevaluations': 'CEV',
            'ContractorEvaluations': 'CEV',
            'clinic': 'CLN',
            'ClinicVisits': 'CLV',
            'clinicvisits': 'CLV',
            'medications': 'MED',
            'Medications': 'MED',
            'sickleave': 'SKL',
            'SickLeave': 'SKL',
            'injuries': 'INJ',
            'Injuries': 'INJ',
            'clinicinventory': 'CLI',
            'ClinicInventory': 'CLI',

            // ISO و HSE
            'iso': 'ISO',
            'isodocuments': 'ISD',
            'ISODocuments': 'ISD',
            'isoprocedures': 'ISP',
            'ISOProcedures': 'ISP',
            'isoforms': 'ISF',
            'ISOForms': 'ISF',
            'hse': 'HSE',
            'hseaudits': 'HSA',
            'HSEAudits': 'HSA',
            'hsenonconformities': 'HSN',
            'HSENonConformities': 'HSN',
            'hsecorrectiveactions': 'HSC',
            'HSECorrectiveActions': 'HSC',
            'hseobjectives': 'HSO',
            'HSEObjectives': 'HSO',
            'hseriskassessments': 'HSR',
            'HSERiskAssessments': 'HSR',

            // تقييم المخاطر والمستندات
            'riskassessments': 'RSA',
            'RiskAssessments': 'RSA',
            'legaldocuments': 'LGD',
            'LegalDocuments': 'LGD',
            'sopjha': 'SOP',
            'SOPJHA': 'SOP',

            // المراقبة والملاحظات
            'behaviormonitoring': 'BHM',
            'BehaviorMonitoring': 'BHM',
            'chemicalsafety': 'CHS',
            'ChemicalSafety': 'CHS',
            'dailyobservations': 'DOB',
            'DailyObservations': 'DOB',
            'observationsites': 'OBS',
            'ObservationSites': 'OBS',

            // الاستدامة والبيئة
            'sustainability': 'SUS',
            'Sustainability': 'SUS',
            'environmentalaspects': 'ENA',
            'EnvironmentalAspects': 'ENA',
            'environmentalmonitoring': 'ENM',
            'EnvironmentalMonitoring': 'ENM',
            'carbonfootprint': 'CFP',
            'CarbonFootprint': 'CFP',
            'wastemanagement': 'WAM',
            'WasteManagement': 'WAM',
            'energyefficiency': 'ENE',
            'EnergyEfficiency': 'ENE',
            'watermanagement': 'WAM',
            'WaterManagement': 'WAM',
            'recyclingprograms': 'RCP',
            'RecyclingPrograms': 'RCP',

            // الطوارئ والميزانية
            'emergency': 'EMG',
            'emergencyalerts': 'EMA',
            'EmergencyAlerts': 'EMA',
            'emergencyplans': 'EMP',
            'EmergencyPlans': 'EMP',
            'safetybudget': 'SAB',
            'SafetyBudgets': 'SAB',
            'safetybudgettransactions': 'SBT',
            'SafetyBudgetTransactions': 'SBT',

            // مؤشرات الأداء والمهام
            'safetyperformancekpis': 'SPK',
            'SafetyPerformanceKPIs': 'SPK',
            'safetyteamkpis': 'STK',
            'SafetyTeamKPIs': 'STK',
            'actiontrackingregister': 'ATR',
            'ActionTrackingRegister': 'ATR',
            'usertasks': 'UTK',
            'UserTasks': 'UTK',
            'userinstructions': 'UIN',
            'UserInstructions': 'UIN',

            // إدارة السلامة والصحة المهنية
            'safetyhealthmanagement': 'SHM',
            'SafetyHealthManagement': 'SHM',
            'safetyteammembers': 'STM',
            'SafetyTeamMembers': 'STM',
            'safetyorganizationalstructure': 'SOS',
            'SafetyOrganizationalStructure': 'SOS',
            'safetyjobdescriptions': 'SJD',
            'SafetyJobDescriptions': 'SJD',
            'safetyteamattendance': 'STA',
            'SafetyTeamAttendance': 'STA',
            'safetyteamleaves': 'STL',
            'SafetyTeamLeaves': 'STL',
            'safetyteamtasks': 'STT',
            'SafetyTeamTasks': 'STT',

            // أنواع المخالفات
            'violationtypes': 'VTY',
            'ViolationTypes': 'VTY',
            'violation_types_db': 'VTY',
            'Violation_Types_DB': 'VTY',
            'blacklist_register': 'BLR',
            'Blacklist_Register': 'BLR',

            // مصفوفات ومخزون
            'ppematrix': 'PPM',
            'PPEMatrix': 'PPM',
            'ppe_stock': 'PPS',
            'PPE_Stock': 'PPS',
            'ppe_transactions': 'PPT',
            'PPE_Transactions': 'PPT',

            // التدريب المتقدم
            'employeetrainingmatrix': 'ETM',
            'EmployeeTrainingMatrix': 'ETM',
            'contractortrainings': 'CTR',
            'ContractorTrainings': 'CTR',
            'annualtrainingplans': 'ATP',
            'AnnualTrainingPlans': 'ATP',

            // السجلات والإشعارات
            'auditlog': 'AUD',
            'AuditLog': 'AUD',
            'useractivitylog': 'UAL',
            'UserActivityLog': 'UAL',
            'notifications': 'NOT',
            'Notifications': 'NOT',
            'incidentnotifications': 'INO',
            'IncidentNotifications': 'INO',

            // إعدادات
            'form_settings_db': 'FSD',
            'Form_Settings_DB': 'FSD',
            'aiassistantsettings': 'AIA',
            'AIAssistantSettings': 'AIA',
            'userailog': 'UAI',
            'UserAILog': 'UAI',
            'safetyhealthmanagementsettings': 'SHS',
            'SafetyHealthManagementSettings': 'SHS',
            'actiontrackingsettings': 'ATS',
            'ActionTrackingSettings': 'ATS'
        };

        return prefixMap[moduleName] || 'ID';
    },

    /**
     * تشفير كلمة المرور باستخدام SHA-256
     */
    async hashPassword(password) {
        if (!password) return '';
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * التحقق من كلمة المرور (التشفير فقط - إزالة دعم النص العادي)
     */
    async verifyPassword(password, storedPassword) {
        if (!password || !storedPassword) return false;
        // الأمان يتطلب التشفير فقط - لا دعم للنص العادي
        if (!this.isSha256Hex(storedPassword)) {
            Utils.safeWarn('⚠️ محاولة التحقق من كلمة مرور غير مشفرة - مرفوضة');
            return false;
        }
        // التحقق من كلمة المرور المشفرة
        const hashedPassword = await this.hashPassword(password);
        return hashedPassword.toLowerCase() === storedPassword.toLowerCase();
    },

    /**
     * التحقق من أن كلمة المرور مشفرة
     */
    isHashedPassword(password) {
        return password && password.length === 64 && /^[a-f0-9]+$/i.test(password);
    },

    /**
     * Rate Limiting لتسجيل الدخول
     */
    RateLimiter: {
        MAX_ATTEMPTS: 5,
        LOCKOUT_DURATION: 15 * 60 * 1000, // 15 دقيقة
        ATTEMPT_WINDOW: 60 * 1000, // نافذة 1 دقيقة

        getAttemptsKey(email) {
            return `login_attempts_${email.toLowerCase()}`;
        },

        getLockoutKey(email) {
            return `login_lockout_${email.toLowerCase()}`;
        },

        async checkLockout(email) {
            const lockoutKey = this.getLockoutKey(email);
            try {
                const lockout = JSON.parse(localStorage.getItem(lockoutKey) || '{}');

                if (lockout.locked && Date.now() < lockout.until) {
                    const minutesLeft = Math.ceil((lockout.until - Date.now()) / 60000);
                    throw new Error(`الحساب مقفل مؤقتاً بسبب محاولات تسجيل دخول فاشلة متعددة. يرجى المحاولة بعد ${minutesLeft} دقيقة.`);
                }

                // إزالة القفل إذا انتهت المدة
                if (lockout.locked && Date.now() >= lockout.until) {
                    localStorage.removeItem(lockoutKey);
                    localStorage.removeItem(this.getAttemptsKey(email));
                }
            } catch (error) {
                // في حالة خطأ في parsing، نزيل البيانات القديمة
                localStorage.removeItem(lockoutKey);
                localStorage.removeItem(this.getAttemptsKey(email));
            }
        },

        async recordFailedAttempt(email) {
            const key = this.getAttemptsKey(email);
            try {
                const attempts = JSON.parse(localStorage.getItem(key) || '[]');
                const now = Date.now();

                // إزالة المحاولات القديمة (أكثر من نافذة الوقت)
                const recentAttempts = attempts.filter(time => now - time < this.ATTEMPT_WINDOW);
                recentAttempts.push(now);

                localStorage.setItem(key, JSON.stringify(recentAttempts));

                // إذا تجاوز الحد، قفل الحساب
                if (recentAttempts.length >= this.MAX_ATTEMPTS) {
                    const lockoutKey = this.getLockoutKey(email);
                    localStorage.setItem(lockoutKey, JSON.stringify({
                        locked: true,
                        until: now + this.LOCKOUT_DURATION
                    }));
                    const minutes = Math.ceil(this.LOCKOUT_DURATION / 60000);
                    throw new Error(`تم قفل الحساب مؤقتاً بسبب محاولات تسجيل دخول فاشلة متعددة. يرجى المحاولة بعد ${minutes} دقيقة.`);
                }

                const remaining = this.MAX_ATTEMPTS - recentAttempts.length;
                if (remaining > 0) {
                    throw new Error(`كلمة المرور غير صحيحة. محاولات متبقية: ${remaining}`);
                }
            } catch (error) {
                // إذا كان الخطأ من recordFailedAttempt نفسه، نرميه
                if (error.message.includes('قفل') || error.message.includes('متبقية')) {
                    throw error;
                }
                // وإلا نعيد إنشاء البيانات
                localStorage.setItem(key, JSON.stringify([Date.now()]));
                throw new Error(`كلمة المرور غير صحيحة. محاولات متبقية: ${this.MAX_ATTEMPTS - 1}`);
            }
        },

        async clearAttempts(email) {
            localStorage.removeItem(this.getAttemptsKey(email));
            localStorage.removeItem(this.getLockoutKey(email));
        }
    },

    /**
     * فحص الملفات المرفوعة
     */
    FileValidator: {
        ALLOWED_MIME_TYPES: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/vnd.ms-excel'
        ],

        ALLOWED_EXTENSIONS: [
            '.jpg', '.jpeg', '.png', '.gif', '.webp',
            '.pdf',
            '.xlsx', '.xls',
            '.docx', '.doc'
        ],

        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB

        // Magic Bytes للتحقق من نوع الملف الفعلي
        FILE_SIGNATURES: {
            'image/jpeg': [0xFF, 0xD8, 0xFF],
            'image/png': [0x89, 0x50, 0x4E, 0x47],
            'image/gif': [0x47, 0x49, 0x46, 0x38],
            'application/pdf': [0x25, 0x50, 0x44, 0x46]
        },

        async validateFile(file) {
            // 1. فحص حجم الملف
            if (file.size > this.MAX_FILE_SIZE) {
                throw new Error(`حجم الملف كبير جداً. الحد الأقصى: ${Math.round(this.MAX_FILE_SIZE / 1024 / 1024)}MB`);
            }

            // 2. فحص الامتداد
            const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
                throw new Error(`امتداد الملف غير مسموح: ${extension}. الملفات المسموحة: ${this.ALLOWED_EXTENSIONS.join(', ')}`);
            }

            // 3. فحص نوع MIME
            if (file.type && !this.ALLOWED_MIME_TYPES.includes(file.type)) {
                throw new Error(`نوع الملف غير مسموح: ${file.type}`);
            }

            // 4. فحص اسم الملف (منع أسماء خطيرة)
            if (this.isDangerousFileName(file.name)) {
                throw new Error('اسم الملف غير آمن. يرجى استخدام اسم ملف صحيح');
            }

            // 5. فحص Magic Bytes (اختياري - للصور والـ PDF فقط)
            if (file.type && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
                try {
                    const arrayBuffer = await file.slice(0, 4).arrayBuffer();
                    const bytes = new Uint8Array(arrayBuffer);
                    const mimeType = this.detectMimeTypeFromBytes(bytes);

                    if (mimeType && mimeType !== file.type) {
                        throw new Error('نوع الملف المعلن لا يطابق محتوى الملف الفعلي');
                    }
                } catch (error) {
                    // إذا فشل الفحص، نسمح بالملف (لأنه قد يكون ملف صالح)
                    Utils.safeWarn('تحذير: فشل فحص محتوى الملف:', error);
                }
            }

            return true;
        },

        detectMimeTypeFromBytes(bytes) {
            for (const [mimeType, signature] of Object.entries(this.FILE_SIGNATURES)) {
                if (signature.every((byte, index) => bytes[index] === byte)) {
                    return mimeType;
                }
            }
            return null;
        },

        isDangerousFileName(fileName) {
            const dangerousPatterns = [
                /\.\./,           // Path traversal
                /[<>:"|?*]/,      // Invalid characters
                /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Reserved names (Windows)
                /\.(exe|bat|cmd|sh|ps1|js|vbs)$/i // Executable extensions
            ];

            return dangerousPatterns.some(pattern => pattern.test(fileName));
        }
    },

    /**
     * تنسيق رسالة خطأ الاتصال بالخلفية
     * @param {string|Error} error - رسالة الخطأ أو كائن الخطأ
     * @param {string} defaultMessage - الرسالة الافتراضية إذا لم يتم التعرف على نوع الخطأ
     * @returns {object} - كائن يحتوي على message و recommendation
     */
    formatBackendError(error, defaultMessage = 'حدث خطأ في الاتصال بالخلفية') {
        const errorMessage = error?.message || error?.toString() || String(error || '');
        let message = defaultMessage;
        let recommendation = 'تحقق من إعدادات الاتصال بالخادم واتصال الإنترنت';

        // التحقق من نوع الخطأ وتنسيق الرسالة
        if (errorMessage.includes('غير مفعل') || errorMessage.includes('غير مفعّل') || errorMessage.includes('الاتصال بالخادم')) {
            message = 'الاتصال بالخادم غير مفعّل';
            recommendation = 'يرجى تفعيل الاتصال بالخادم من الإعدادات وإدخال الرابط';
        } else if (errorMessage.includes('رابط') && (errorMessage.includes('غير صحيح') || errorMessage.includes('غير محدد'))) {
            message = 'رابط الخادم غير صحيح أو غير محدد';
            recommendation = 'يجب أن ينتهي رابط الخادم بـ /exec (مثال: https://script.google.com/macros/s/.../exec)';
        } else if (errorMessage.includes('Timeout') ||
            errorMessage.includes('انتهت مهلة') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('timed out')) {
            message = 'انتهت مهلة الاتصال بالخادم';
            recommendation = 'تحقق من اتصال الإنترنت وأن الخادم منشور ومفعّل وعدم وجود قيود على الشبكة';
        } else if (errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('CORS') ||
            errorMessage.includes('Network request failed')) {
            message = 'فشل الاتصال بالخادم';
            recommendation = 'تحقق من اتصال الإنترنت ورابط الخادم وأن الخادم منشور ومفعّل';
        } else if (errorMessage.includes('غير معترف به') ||
            errorMessage.includes('Action not recognized') ||
            errorMessage.includes('ACTION_NOT_RECOGNIZED')) {
            message = errorMessage; // استخدام الرسالة التفصيلية من الخادم
            recommendation = 'تحقق من أن إصدار الخادم محدث ويتوافق مع إصدار الواجهة';
        } else if (errorMessage.includes('فشل الاتصال') ||
            errorMessage.includes('Connection failed')) {
            message = errorMessage.includes('فشل الاتصال') ? errorMessage : 'فشل الاتصال بالخلفية';
            recommendation = 'تحقق من إعدادات الاتصال بالخادم واتصال الإنترنت.';
        } else if (errorMessage.trim() !== '') {
            // إذا كانت الرسالة واضحة، نستخدمها كما هي
            message = errorMessage;
        }

        return { message, recommendation };
    },

    /**
     * عرض نافذة تأكيد
     * @param {string} title - عنوان النافذة
     * @param {string} message - رسالة التأكيد
     * @param {string} confirmText - نص زر التأكيد
     * @param {string} cancelText - نص زر الإلغاء
     * @returns {Promise<boolean>} - true إذا تم التأكيد، false إذا تم الإلغاء
     */
    confirmDialog(title, message, confirmText = 'تأكيد', cancelText = 'إلغاء') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.style.zIndex = '10001';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3 class="modal-title">${Utils.escapeHTML(title)}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div style="text-align: right; direction: rtl; padding: 1rem 0;">
                            <p style="white-space: pre-line; line-height: 1.6;">${Utils.escapeHTML(message)}</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" id="confirm-dialog-cancel">
                            <i class="fas fa-times ml-2"></i>
                            ${Utils.escapeHTML(cancelText)}
                        </button>
                        <button class="btn-primary" id="confirm-dialog-confirm">
                            <i class="fas fa-check ml-2"></i>
                            ${Utils.escapeHTML(confirmText)}
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const confirmBtn = modal.querySelector('#confirm-dialog-confirm');
            const cancelBtn = modal.querySelector('#confirm-dialog-cancel');
            const closeBtn = modal.querySelector('.modal-close');

            const closeModal = (result) => {
                modal.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => {
                    modal.remove();
                    resolve(result);
                }, 200);
            };

            confirmBtn.addEventListener('click', () => closeModal(true));
            cancelBtn.addEventListener('click', () => closeModal(false));
            closeBtn.addEventListener('click', () => closeModal(false));

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(false);
                }
            });

            // إغلاق عند الضغط على ESC
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    closeModal(false);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    }
};

// ===== Constants =====
const DEFAULT_PERIODIC_INSPECTION_CATEGORIES = [
    {
        id: 'default_periodic_vehicle',
        name: 'فحص سيارات الموظفين',
        description: 'متابعة جاهزية مركبات الموظفين ومطابقتها لمتطلبات السلامة.',
        defaultFrequency: 'monthly',
        defaultReminderDays: 5,
        isDefault: true,
        checklist: [
            { id: 'default_periodic_vehicle_1', label: 'صلاحية التأمين والرخصة', required: true },
            { id: 'default_periodic_vehicle_2', label: 'فحص الإطارات ومستوى التآكل', required: true },
            { id: 'default_periodic_vehicle_3', label: 'وجود حقيبة الإسعافات وطفاية حريق', required: false }
        ]
    },
    {
        id: 'default_periodic_forklift',
        name: 'فحص الرافعات الشوكية (الكلاركات)',
        description: 'تأكد من سلامة وتشغيل الرافعات الشوكية في مواقع العمل.',
        defaultFrequency: 'weekly',
        defaultReminderDays: 3,
        isDefault: true,
        checklist: [
            { id: 'default_periodic_forklift_1', label: 'سلامة نظام الفرامل والإيقاف', required: true },
            { id: 'default_periodic_forklift_2', label: 'سلامة شوكتي الرفع وعدم وجود تشققات', required: true },
            { id: 'default_periodic_forklift_3', label: 'فحص البطارية أو الوقود والتسريبات', required: true }
        ]
    },
    {
        id: 'default_periodic_pallet',
        name: 'فحص الهاند باليت الكهربائية',
        description: 'مراجعة جاهزية وسلامة عربات التحميل الكهربائية.',
        defaultFrequency: 'weekly',
        defaultReminderDays: 3,
        isDefault: true,
        checklist: [
            { id: 'default_periodic_pallet_1', label: 'سلامة البطارية والشحن', required: true },
            { id: 'default_periodic_pallet_2', label: 'تأكد من كفاءة الفرامل والطوارئ', required: true },
            { id: 'default_periodic_pallet_3', label: 'سلامة العجلات وعدم وجود تآكل شديد', required: false }
        ]
    },
    {
        id: 'default_periodic_emergency_light',
        name: 'فحص كشافات الطوارئ',
        description: 'التأكد من عمل كشافات الطوارئ وفعالية البطاريات المرتبطة.',
        defaultFrequency: 'monthly',
        defaultReminderDays: 5,
        isDefault: true,
        checklist: [
            { id: 'default_periodic_emergency_light_1', label: 'تشغيل يدوي للكشاف والتأكد من الإضاءة', required: true },
            { id: 'default_periodic_emergency_light_2', label: 'حالة البطارية ومؤشرات الشحن', required: true },
            { id: 'default_periodic_emergency_light_3', label: 'سلامة جسم الكشاف وخلوه من التلف', required: false }
        ]
    },
    {
        id: 'default_periodic_ladders',
        name: 'فحص السلالم الثابتة والمتحركة',
        description: 'تفقد السلالم للتأكد من سلامتها الإنشائية والتشغيلية.',
        defaultFrequency: 'quarterly',
        defaultReminderDays: 10,
        isDefault: true,
        checklist: [
            { id: 'default_periodic_ladders_1', label: 'ثبات السلم وعدم وجود اهتزاز', required: true },
            { id: 'default_periodic_ladders_2', label: 'سلامة الدرجات وعدم وجود كسر أو تشققات', required: true },
            { id: 'default_periodic_ladders_3', label: 'نظافة السلم وخلوه من الزيوت أو الشحوم', required: false }
        ]
    }
];

const DEFAULT_VIOLATION_TYPES = [
    {
        id: 'default_violation_1',
        name: 'عدم استخدام معدات الوقاية',
        description: '',
        isDefault: true,
        order: 1
    },
    {
        id: 'default_violation_2',
        name: 'عدم اتباع إجراءات السلامة',
        description: '',
        isDefault: true,
        order: 2
    },
    {
        id: 'default_violation_3',
        name: 'التدخين ي المناطق الممنوعة',
        description: '',
        isDefault: true,
        order: 3
    },
    {
        id: 'default_violation_4',
        name: 'عدم الحصول على تصريح عمل',
        description: '',
        isDefault: true,
        order: 4
    },
    {
        id: 'default_violation_5',
        name: 'أخرى',
        description: '',
        isDefault: true,
        order: 5
    }
];

// ===== Violation Types Manager =====
const ViolationTypesManager = {
    ensureInitialized() {
        if (!AppState || !AppState.appData) return [];

        const now = new Date().toISOString();
        const existing = Array.isArray(AppState.appData.violationTypes)
            ? AppState.appData.violationTypes.slice()
            : [];
        const normalized = [];
        const seenNames = new Map();
        const seenIds = new Set();
        let shouldSave = false;

        const normalizeItem = (item, index) => {
            if (!item) return null;

            if (typeof item === 'string') {
                shouldSave = true;
                return {
                    id: Utils.generateId('VTYPE'),
                    name: item.trim(),
                    description: '',
                    isDefault: false,
                    createdAt: now,
                    updatedAt: now
                };
            }

            const name = (item.name || item.label || '').trim();
            if (!name) return null;

            let id = item.id && typeof item.id === 'string' && item.id.trim() !== ''
                ? item.id.trim()
                : '';
            if (!id) {
                id = Utils.generateId('VTYPE');
                shouldSave = true;
            }

            const description = (item.description || item.notes || '').trim();
            const createdAt = item.createdAt || now;
            const updatedAt = item.updatedAt || now;
            const isDefault = item.isDefault === true || DEFAULT_VIOLATION_TYPES.some(def => def.name === name || def.id === id);
            const order = typeof item.order === 'number' ? item.order : undefined;

            return {
                id,
                name,
                description,
                isDefault,
                createdAt,
                updatedAt,
                order
            };
        };

        existing.forEach((item, index) => {
            const normalizedItem = normalizeItem(item, index);
            if (!normalizedItem) {
                shouldSave = true;
                return;
            }

            const lowerName = normalizedItem.name.toLowerCase();
            if (seenNames.has(lowerName)) {
                shouldSave = true;
                return;
            }

            if (seenIds.has(normalizedItem.id)) {
                normalizedItem.id = Utils.generateId('VTYPE');
                shouldSave = true;
            }

            seenNames.set(lowerName, normalizedItem);
            seenIds.add(normalizedItem.id);
            normalized.push(normalizedItem);
        });

        DEFAULT_VIOLATION_TYPES.forEach(defaultType => {
            const lowerName = defaultType.name.toLowerCase();
            if (seenNames.has(lowerName)) {
                const existingType = seenNames.get(lowerName);
                if (!existingType.isDefault) {
                    existingType.isDefault = true;
                    shouldSave = true;
                }
                if (!existingType.order && typeof defaultType.order === 'number') {
                    existingType.order = defaultType.order;
                    shouldSave = true;
                }
                if (!existingType.id || existingType.id.startsWith('VTYPE_')) {
                    existingType.id = defaultType.id;
                    shouldSave = true;
                }
            } else {
                normalized.push({
                    id: defaultType.id,
                    name: defaultType.name,
                    description: defaultType.description || '',
                    isDefault: true,
                    createdAt: now,
                    updatedAt: now,
                    order: defaultType.order
                });
                seenNames.set(lowerName, normalized[normalized.length - 1]);
                seenIds.add(defaultType.id);
                shouldSave = true;
            }
        });

        normalized.sort((a, b) => {
            const orderA = typeof a.order === 'number' ? a.order : 9999;
            const orderB = typeof b.order === 'number' ? b.order : 9999;
            if (orderA !== orderB) return orderA - orderB;
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            return a.name.localeCompare(b.name, 'ar');
        });

        AppState.appData.violationTypes = normalized;

        if (shouldSave) {
            // استخدام window.DataManager كبديل إذا لم يكن DataManager متاحاً محلياً
            const dm = (typeof window !== 'undefined' && window.DataManager) ||
                (typeof DataManager !== 'undefined' && DataManager);
            if (dm && typeof dm.save === 'function') {
                dm.save();
            }
        }

        this.ensureViolationsTypeIds(normalized);
        return normalized;
    },

    ensureViolationsTypeIds(types = null) {
        const violations = AppState?.appData?.violations;
        if (!Array.isArray(violations) || violations.length === 0) return;

        const list = Array.isArray(types) ? types : (AppState.appData.violationTypes || []);
        const typeByName = new Map(list.map(type => [type.name.toLowerCase(), type]));
        let changed = false;

        violations.forEach(violation => {
            if (!violation) return;
            const currentId = violation.violationTypeId;
            const currentName = (violation.violationType || '').trim();
            if (currentId) return;
            if (!currentName) return;
            const match = typeByName.get(currentName.toLowerCase());
            if (match) {
                violation.violationTypeId = match.id;
                changed = true;
            }
        });

        if (changed) {
            // استخدام window.DataManager كبديل إذا لم يكن DataManager متاحاً محلياً
            const dm = (typeof window !== 'undefined' && window.DataManager) ||
                (typeof DataManager !== 'undefined' && DataManager);
            if (dm && typeof dm.save === 'function') {
                dm.save();
            }
        }
    },

    getAll() {
        return this.ensureInitialized().slice();
    },

    getTypeById(id) {
        if (!id) return null;
        return (AppState.appData.violationTypes || []).find(type => type.id === id) || null;
    },

    getTypeByName(name) {
        if (!name) return null;
        const lower = name.trim().toLowerCase();
        return (AppState.appData.violationTypes || []).find(type => type.name.toLowerCase() === lower) || null;
    },

    countUsage(typeOrId) {
        const violations = AppState?.appData?.violations;
        if (!Array.isArray(violations)) return 0;

        let target = null;
        if (typeof typeOrId === 'string') {
            target = this.getTypeById(typeOrId) || this.getTypeByName(typeOrId);
        } else {
            target = typeOrId;
        }
        if (!target) return 0;

        const lowerName = target.name.toLowerCase();
        return violations.reduce((count, violation) => {
            if (!violation) return count;
            if (violation.violationTypeId === target.id) return count + 1;
            const name = (violation.violationType || '').trim().toLowerCase();
            if (!violation.violationTypeId && name === lowerName) return count + 1;
            return count;
        }, 0);
    },

    addType({ name, description = '' } = {}) {
        const trimmedName = (name || '').trim();
        if (!trimmedName) {
            throw new Error('يرجى إدخال اسم نوع المخالفة');
        }

        this.ensureInitialized();

        if (this.getTypeByName(trimmedName)) {
            throw new Error('نوع المخالفة موجود مسبقاً');
        }

        const now = new Date().toISOString();
        const newType = {
            id: Utils.generateId('VTYPE'),
            name: trimmedName,
            description: (description || '').trim(),
            isDefault: false,
            createdAt: now,
            updatedAt: now
        };

        AppState.appData.violationTypes.push(newType);
        this.sortTypes();
        this.persist(true);
        return newType;
    },

    updateType(id, { name, description, isDefault } = {}) {
        if (!id) {
            throw new Error('معرف نوع المخالفة غير محدد');
        }

        this.ensureInitialized();
        const type = this.getTypeById(id);

        if (!type) {
            throw new Error('نوع المخالفة غير موجود');
        }

        const newName = (name ?? type.name).trim();
        if (!newName) {
            throw new Error('لا يمكن أن يكون اسم النوع فارغاً');
        }

        const lowerOld = type.name.toLowerCase();
        const lowerNew = newName.toLowerCase();
        if (lowerNew !== lowerOld) {
            const existing = this.getTypeByName(newName);
            if (existing && existing.id !== id) {
                throw new Error('يوجد نوع آخر بنفس الاسم');
            }
        }

        const previousName = type.name;
        type.name = newName;
        type.description = (description ?? type.description).trim();
        if (typeof isDefault === 'boolean') {
            type.isDefault = isDefault;
        }
        type.updatedAt = new Date().toISOString();

        const renamed = this.propagateTypeRename(type.id, previousName, type.name);
        this.sortTypes();
        this.persist(true);
        if (renamed) {
            this.syncViolations();
        }
        return type;
    },

    deleteType(id) {
        if (!id) {
            throw new Error('معرف نوع المخالفة غير محدد');
        }

        this.ensureInitialized();
        const index = (AppState.appData.violationTypes || []).findIndex(type => type.id === id);
        if (index === -1) {
            throw new Error('نوع المخالفة غير موجود');
        }

        const removed = AppState.appData.violationTypes.splice(index, 1)[0];
        const violations = AppState?.appData?.violations || [];
        let changedViolations = false;

        violations.forEach(violation => {
            if (!violation) return;
            if (violation.violationTypeId === id) {
                violation.violationTypeId = '';
                if (!violation.violationType) {
                    violation.violationType = removed.name;
                }
                changedViolations = true;
            }
        });

        this.persist(true);
        if (changedViolations) {
            this.syncViolations();
        }
        return removed;
    },

    propagateTypeRename(typeId, oldName, newName) {
        const violations = AppState?.appData?.violations || [];
        if (!Array.isArray(violations) || violations.length === 0) return false;

        const lowerOld = (oldName || '').toLowerCase();
        let changed = false;

        violations.forEach(violation => {
            if (!violation) return;
            const currentName = (violation.violationType || '').trim();
            if (violation.violationTypeId === typeId) {
                if (currentName !== newName) {
                    violation.violationType = newName;
                    changed = true;
                }
            } else if (!violation.violationTypeId && currentName && currentName.toLowerCase() === lowerOld) {
                violation.violationType = newName;
                violation.violationTypeId = typeId;
                changed = true;
            }
        });

        return changed;
    },

    sortTypes() {
        const list = AppState?.appData?.violationTypes;
        if (!Array.isArray(list)) return;
        list.sort((a, b) => {
            const orderA = typeof a.order === 'number' ? a.order : 9999;
            const orderB = typeof b.order === 'number' ? b.order : 9999;
            if (orderA !== orderB) return orderA - orderB;
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            return a.name.localeCompare(b.name, 'ar');
        });
    },

    persist(syncSheets = true) {
        // استخدام window.DataManager كبديل إذا لم يكن DataManager متاحاً محلياً
        const dm = (typeof window !== 'undefined' && window.DataManager) ||
            (typeof DataManager !== 'undefined' && DataManager);
        if (dm && typeof dm.save === 'function') {
            dm.save();
        }

        if (syncSheets && typeof GoogleIntegration !== 'undefined' && typeof GoogleIntegration.autoSave === 'function') {
            GoogleIntegration.autoSave('ViolationTypes', AppState.appData.violationTypes).catch(() => { });
        }
    },

    syncViolations() {
        if (typeof GoogleIntegration !== 'undefined' && typeof GoogleIntegration.autoSave === 'function') {
            GoogleIntegration.autoSave('Violations', AppState.appData.violations).catch(() => { });
        }
    }
};

// ===== QR Code Helper =====
const QRCode = (() => {
    const existing = (typeof window !== 'undefined' && window.QRCode && typeof window.QRCode.generate === 'function')
        ? window.QRCode
        : (typeof globalThis !== 'undefined' && globalThis.QRCode && typeof globalThis.QRCode.generate === 'function')
            ? globalThis.QRCode
            : null;
    const FALLBACK_ENDPOINT = 'https://api.qrserver.com/v1/create-qr-code/';
    const MIN_SIZE = 80;
    const MAX_SIZE = 600;

    function clampSize(size) {
        const parsed = Number(size) || 0;
        return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(parsed)));
    }

    function tryExisting(data, size) {
        if (!existing) return null;
        try {
            const result = existing.generate(data, size);
            if (result) {
                return result;
            }
        } catch (error) {
            Utils.safeWarn('⚠️ فشل استخدام مولد QR الحالي:', error);
        }
        return null;
    }

    function tryQrcodeLibrary(data, size) {
        if (typeof qrcode !== 'function') return null;
        try {
            const qr = qrcode(0, 'M');
            qr.addData(String(data));
            qr.make();
            const moduleCount = typeof qr.getModuleCount === 'function' ? qr.getModuleCount() : 0;
            const cellSize = moduleCount ? Math.max(1, Math.floor(size / moduleCount)) : Math.max(2, Math.floor(size / 25));
            return qr.createDataURL(cellSize, 2);
        } catch (error) {
            Utils.safeWarn('⚠️ فشل استخدام مكتبة qrcode:', error);
        }
        return null;
    }

    function buildFallbackUrl(data, size) {
        const encoded = encodeURIComponent(String(data));
        return `${FALLBACK_ENDPOINT}?size=${size}x${size}&data=${encoded}`;
    }

    function generate(data, size = 200) {
        if (!data) return null;
        const clampedSize = clampSize(size);

        const trimmed = String(data).trim();
        if (!trimmed) return null;

        const existingResult = tryExisting(trimmed, clampedSize);
        if (existingResult) return existingResult;

        const libraryResult = tryQrcodeLibrary(trimmed, clampedSize);
        if (libraryResult) return libraryResult;

        return buildFallbackUrl(trimmed, clampedSize);
    }

    return { generate };
})();

if (typeof window !== 'undefined') {
    window.QRCode = QRCode;
}

// ===== Notification System =====
// تعريف Notification كمتغير عام (global) ليكون متاحاً لجميع الملفات
window.Notification = {
    // تخزين الإشعارات النشطة
    activeNotifications: new Map(),

    /**
     * عرض إشعار محسن مع دعم للعناوين والأوصاف والأزرار
     * @param {string|object} messageOrOptions - الرسالة أو كائن الخيارات
     * @param {string} type - نوع الإشعار (info, success, warning, error, emergency)
     * @param {number} duration - مدة العرض بالميلي ثانية (0 = دائم حتى الإغلاق اليدوي)
     * @param {object} options - خيارات إضافية (title, description, actions, priority, persistent, sound)
     */
    show(messageOrOptions, type = 'info', duration = 3000, options = {}) {
        // دعم الصيغتين: show(message, type, duration) و show({message, type, ...})
        let config = {};
        if (typeof messageOrOptions === 'string') {
            config = {
                message: messageOrOptions,
                type: type,
                duration: duration,
                ...options
            };
        } else {
            config = {
                message: messageOrOptions.message || '',
                type: messageOrOptions.type || type,
                duration: messageOrOptions.duration !== undefined ? messageOrOptions.duration : duration,
                title: messageOrOptions.title,
                description: messageOrOptions.description,
                actions: messageOrOptions.actions || [],
                priority: messageOrOptions.priority || 'normal', // normal, high, critical
                persistent: messageOrOptions.persistent || false,
                sound: messageOrOptions.sound !== false, // true by default for critical
                onClick: messageOrOptions.onClick,
                ...options
            };
        }

        const container = document.getElementById('notification-container');
        if (!container) {
            console.warn('⚠️ notification-container غير موجود');
            return null;
        }

        // تحديد مدة العرض بناءً على الأولوية
        if (config.priority === 'critical' && !config.persistent) {
            config.duration = config.duration || 10000; // 10 ثواني للتنبيهات الحرجة
        } else if (config.priority === 'high' && !config.persistent) {
            config.duration = config.duration || 6000; // 6 ثواني للتنبيهات العالية
        } else if (!config.persistent && config.duration === undefined) {
            config.duration = 3000; // 3 ثواني افتراضياً
        }

        // تشغيل الصوت للتنبيهات المهمة
        if (config.sound && (config.priority === 'critical' || config.priority === 'high' || config.type === 'emergency')) {
            this.playNotificationSound(config.priority);
        }

        // إنشاء عنصر الإشعار
        const notificationId = 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const notification = document.createElement('div');
        notification.id = notificationId;
        notification.className = `notification notification-${config.type} notification-priority-${config.priority}`;
        notification.setAttribute('data-priority', config.priority);

        // إضافة تأثير النبض للتنبيهات الحرجة
        if (config.priority === 'critical') {
            notification.classList.add('notification-critical-pulse');
        }

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle',
            emergency: 'fa-bell'
        };

        const icon = icons[config.type] || icons.info;

        // بناء محتوى الإشعار
        let contentHTML = '';

        if (config.title) {
            contentHTML += `<div class="notification-title">${Utils.escapeHTML(config.title)}</div>`;
        }

        contentHTML += `<div class="notification-message">${Utils.escapeHTML(config.message)}</div>`;

        if (config.description) {
            contentHTML += `<div class="notification-description">${Utils.escapeHTML(config.description)}</div>`;
        }

        // إضافة الأزرار إذا كانت موجودة
        let actionsHTML = '';
        if (config.actions && config.actions.length > 0) {
            actionsHTML = '<div class="notification-actions">';
            config.actions.forEach((action, index) => {
                const actionClass = action.primary ? 'notification-action-primary' : 'notification-action-secondary';
                actionsHTML += `<button class="notification-action ${actionClass}" data-action-index="${index}">${Utils.escapeHTML(action.label)}</button>`;
            });
            actionsHTML += '</div>';
        }

        notification.innerHTML = `
            <div class="notification-icon-wrapper">
                <i class="fas ${icon} notification-icon"></i>
            </div>
            <div class="notification-content">
                ${contentHTML}
                ${actionsHTML}
            </div>
            ${config.persistent ? '<button class="notification-close" aria-label="إغلاق">&times;</button>' : ''}
        `;

        // إضافة مستمعي الأحداث
        if (config.onClick) {
            notification.style.cursor = 'pointer';
            notification.addEventListener('click', (e) => {
                if (!e.target.closest('.notification-action') && !e.target.closest('.notification-close')) {
                    config.onClick(notificationId);
                }
            });
        }

        // إضافة مستمعي الأحداث للأزرار
        if (config.actions && config.actions.length > 0) {
            notification.querySelectorAll('.notification-action').forEach((btn, index) => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = config.actions[index];
                    if (action.onClick) {
                        action.onClick(notificationId);
                    }
                    if (action.dismiss !== false) {
                        this.dismiss(notificationId);
                    }
                });
            });
        }

        // إضافة زر الإغلاق للإشعارات الدائمة
        if (config.persistent) {
            const closeBtn = notification.querySelector('.notification-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.dismiss(notificationId);
                });
            }
        }

        // إضافة الإشعار إلى الحاوية
        container.appendChild(notification);

        // إضافة إلى القائمة النشطة
        this.activeNotifications.set(notificationId, {
            element: notification,
            config: config,
            timeoutId: null
        });

        // إضافة تأثير الظهور
        setTimeout(() => {
            notification.classList.add('notification-visible');
        }, 10);

        // إزالة تلقائية إذا لم يكن دائماً
        if (!config.persistent && config.duration > 0) {
            const timeoutId = setTimeout(() => {
                this.dismiss(notificationId);
            }, config.duration);

            const notificationData = this.activeNotifications.get(notificationId);
            if (notificationData) {
                notificationData.timeoutId = timeoutId;
            }
        }

        return notificationId;
    },

    /**
     * إغلاق إشعار محدد
     */
    dismiss(notificationId) {
        const notificationData = this.activeNotifications.get(notificationId);
        if (!notificationData) return;

        const { element, timeoutId } = notificationData;

        // إلغاء الـ timeout إذا كان موجوداً
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // إضافة تأثير الإغلاق
        element.classList.add('notification-dismissing');

        setTimeout(() => {
            if (element.parentNode) {
                element.remove();
            }
            this.activeNotifications.delete(notificationId);
        }, 300);
    },

    /**
     * إغلاق جميع الإشعارات
     */
    dismissAll() {
        this.activeNotifications.forEach((data, id) => {
            this.dismiss(id);
        });
    },

    /**
     * تشغيل صوت الإشعار
     */
    playNotificationSound(priority = 'normal') {
        try {
            // استخدام Web Audio API لإنشاء صوت بسيط
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // ترددات مختلفة حسب الأولوية
            const frequencies = {
                critical: [800, 600, 800, 600], // نغمة متعددة للحرج
                high: [600, 500],
                normal: [400]
            };

            const freq = frequencies[priority] || frequencies.normal;
            let currentTime = audioContext.currentTime;

            freq.forEach((f, index) => {
                oscillator.frequency.setValueAtTime(f, currentTime);
                gainNode.gain.setValueAtTime(0.3, currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
                currentTime += 0.2;
            });

            oscillator.start(currentTime);
            oscillator.stop(currentTime + 0.1);
        } catch (error) {
            // في حالة فشل Web Audio API، يمكن استخدام صوت HTML5
            console.debug('Web Audio API غير متاح:', error);
        }
    },

    /**
     * إشعار طارئ محسن للتنبيهات الحرجة
     */
    emergency(options) {
        return this.show({
            ...options,
            type: 'emergency',
            priority: 'critical',
            persistent: options.persistent !== false, // دائم افتراضياً للطوارئ
            sound: true,
            duration: 0 // لا يختفي تلقائياً
        });
    },

    // دوال الاختصار المحسنة
    success(message, options = {}) {
        try {
            if (this && typeof this.show === 'function') {
                return this.show({ message, type: 'success', ...options });
            }
        } catch (error) {
            console.warn('⚠️ خطأ في Notification.success:', error);
        }
    },

    error(message, options = {}) {
        try {
            if (this && typeof this.show === 'function') {
                return this.show({ message, type: 'error', priority: 'high', ...options });
            }
        } catch (error) {
            console.warn('⚠️ خطأ في Notification.error:', error);
        }
    },

    warning(message, options = {}) {
        try {
            if (this && typeof this.show === 'function') {
                return this.show({ message, type: 'warning', priority: 'high', ...options });
            }
        } catch (error) {
            console.warn('⚠️ خطأ في Notification.warning:', error);
        }
    },

    info(message, options = {}) {
        try {
            if (this && typeof this.show === 'function') {
                return this.show({ message, type: 'info', ...options });
            }
        } catch (error) {
            console.warn('⚠️ خطأ في Notification.info:', error);
        }
    }
};

// ===== Loading System =====
const Loading = {
    currentProgress: 0,
    currentMessage: '',

    show(message = 'جاري التحميل...', progress = null) {
        const overlay = document.getElementById('loading-overlay');
        if (!overlay) return;

        overlay.style.display = 'flex';
        this.currentMessage = message;

        // تحديث الرسالة
        const messageEl = overlay.querySelector('.loading-message') || overlay.querySelector('p');
        if (messageEl) {
            messageEl.textContent = message;
        }

        // تحديث التقدم إذا كان موجوداً
        if (progress !== null) {
            this.setProgress(progress);
        }
    },

    setProgress(percentage, message = null) {
        const overlay = document.getElementById('loading-overlay');
        if (!overlay) return;

        this.currentProgress = Math.max(0, Math.min(100, percentage));

        // تحديث الرسالة إذا تم توفيرها
        if (message) {
            this.currentMessage = message;
            const messageEl = overlay.querySelector('.loading-message') || overlay.querySelector('p');
            if (messageEl) {
                messageEl.textContent = message;
            }
        }

        // إنشاء أو تحديث شريط التقدم
        let progressBar = overlay.querySelector('.loading-progress-bar');
        let progressFill = overlay.querySelector('.loading-progress-fill');
        let progressText = overlay.querySelector('.loading-progress-text');

        if (!progressBar) {
            // إنشاء شريط التقدم
            const spinner = overlay.querySelector('.loading-spinner');
            if (spinner) {
                progressBar = document.createElement('div');
                progressBar.className = 'loading-progress-bar';
                progressBar.style.cssText = 'width: 300px; height: 8px; background: rgba(255,255,255,0.3); border-radius: 4px; margin: 20px auto 10px; overflow: hidden;';

                progressFill = document.createElement('div');
                progressFill.className = 'loading-progress-fill';
                progressFill.style.cssText = 'height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb); border-radius: 4px; transition: width 0.3s ease; width: 0%;';

                progressText = document.createElement('div');
                progressText.className = 'loading-progress-text';
                progressText.style.cssText = 'text-align: center; color: white; font-weight: bold; font-size: 18px; margin-top: 10px;';

                progressBar.appendChild(progressFill);
                spinner.appendChild(progressBar);
                spinner.appendChild(progressText);
            }
        }

        if (progressFill) {
            progressFill.style.width = `${this.currentProgress}%`;
        }

        if (progressText) {
            progressText.textContent = `${Math.round(this.currentProgress)}%`;
        }
    },

    updateMessage(message) {
        this.currentMessage = message;
        const overlay = document.getElementById('loading-overlay');
        if (!overlay) return;

        const messageEl = overlay.querySelector('.loading-message') || overlay.querySelector('p');
        if (messageEl) {
            messageEl.textContent = message;
        }
    },

    hide() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            this.currentProgress = 0;
            this.currentMessage = '';
        }
    }
};

// ===== PDF Templates =====
const PDFTemplates = {
    buildDocument({
        title = '',
        content = '',
        formCode = '',
        createdAt = new Date(),
        updatedAt = null,
        meta = {},
        includeQRCode = true,
        qrData = null
    } = {}) {
        const escape = (value) => {
            if (value === undefined || value === null) return '';
            if (typeof Utils !== 'undefined' && Utils && typeof Utils.escapeHTML === 'function') {
                return Utils.escapeHTML(String(value));
            }
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        const fallbackCompanyName = typeof DEFAULT_COMPANY_NAME !== 'undefined' ? DEFAULT_COMPANY_NAME : 'Americana HSE Management System';
        const companyNameRaw = AppState?.companySettings?.name || fallbackCompanyName;
        const companySecondaryNameRaw = AppState?.companySettings?.secondaryName || '';
        const companySecondaryNameTrimmed = companySecondaryNameRaw ? String(companySecondaryNameRaw).trim() : '';
        const companyName = escape(companyNameRaw);
        const companySecondaryName = escape(companySecondaryNameTrimmed);
        const companyAddress = escape(AppState?.companySettings?.address || '');
        const contactPhone = escape(AppState?.companySettings?.phone || '');
        const contactEmail = escape(AppState?.companySettings?.email || '');
        const logo = AppState?.companyLogo || '';
        const companyInitials = escape(companyNameRaw.trim().slice(0, 2) || 'HS');

        // الحصول على إعدادات الخط واللون
        const nameFontSize = AppState?.companySettings?.nameFontSize || 16;
        const secondaryNameFontSize = AppState?.companySettings?.secondaryNameFontSize || 14;
        const secondaryNameColor = AppState?.companySettings?.secondaryNameColor || '#6B7280';

        const generateDate = createdAt ? new Date(createdAt) : new Date();
        const updateDate = updatedAt ? new Date(updatedAt) : generateDate;

        const formatDateTime = (date) => {
            if (!date) return '';
            if (typeof Utils !== 'undefined' && Utils && typeof Utils.formatDateTime === 'function') {
                return Utils.formatDateTime(date, 'ar-EG');
            }
            try {
                const d = new Date(date);
                if (isNaN(d.getTime())) return '';
                const formatted = d.toLocaleString('ar-EG', {
                    hour12: true,
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                // Ensure AM/PM is displayed correctly in Arabic
                return formatted.replace(/ص/g, 'ص').replace(/م/g, 'م');
            } catch (error) {
                return escape(date);
            }
        };

        const enhancedContent = (content || '')
            .replace(/<table(?![^>]*class=)/g, '<table class="report-table"')
            .replace(/<ul(?![^>]*class=)/g, '<ul class="report-list"');

        const excludedMetaKeys = ['version', 'releaseDate', 'revisionDate', 'issueDate', 'includeQRCode', 'qrData', 'modifiedAt'];
        const metaRows = Object.entries(meta || {})
            .filter(([key, value]) => value !== undefined && value !== null && value !== '' && !excludedMetaKeys.includes(key))
            .map(([key, value]) => `
                <div class="meta-item">
                    <span class="meta-label">${escape(key)}</span>
                    <span class="meta-value">${escape(value)}</span>
                </div>
            `).join('');

        const contactLine = [companyAddress, contactPhone, contactEmail]
            .filter(Boolean)
            .join(' | ');

        // Get version from settings or meta, with fallback
        const defaultVersion = AppState?.companySettings?.formVersion || '1.0';
        const versionDisplay = escape(meta?.version || meta?.revisionNumber || defaultVersion);
        const issueDateSource = meta?.releaseDate || meta?.issueDate || createdAt;
        const revisionDateSource = meta?.revisionDate || meta?.modifiedAt || updatedAt || issueDateSource;
        const issueDateDisplay = issueDateSource ? escape(formatDateTime(issueDateSource)) : '-';
        const revisionDateDisplay = revisionDateSource ? escape(formatDateTime(revisionDateSource)) : '-';

        const metaIncludeQRCode = (meta && Object.prototype.hasOwnProperty.call(meta, 'includeQRCode')) ? Boolean(meta.includeQRCode) : true;
        const shouldRenderQRCode = includeQRCode !== false && metaIncludeQRCode;
        const qrPayloadRaw = qrData != null ? qrData
            : (meta && meta.qrData != null ? meta.qrData
                : `Form: ${formCode || '-'} | Title: ${title || ''} | Company: ${companyNameRaw}`);
        const qrText = typeof qrPayloadRaw === 'string' ? qrPayloadRaw : JSON.stringify(qrPayloadRaw);
        const qrTextForScript = JSON.stringify(qrText);
        const formCodeDisplay = escape(formCode || '-');
        // تسمية كود التقرير - يمكن تخصيصها من إعدادات الشركة
        const formCodeLabel = formCode ? 'كود التقرير' : '';

        return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>${escape(title || '')}</title>
    <style>
        :root { color-scheme: light; }
        @page { size: A4; margin: 25mm 20mm; }
        body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            background: #f3f4f6;
            margin: 0;
            color: #1f2937;
            line-height: 1.8;
        }
        .report-wrapper {
            max-width: 960px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px;
            box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
            border-radius: 24px;
        }
        .report-header {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            border-bottom: 3px solid #003865;
            padding-bottom: 16px;
            margin-bottom: 20px;
        }
        .report-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 120px;
        }
        .report-logo img {
            max-height: 70px;
            max-width: 130px;
            object-fit: contain;
            border-radius: 0;
            box-shadow: none;
        }
        .brand-placeholder {
            width: 80px;
            height: 80px;
            border-radius: 18px;
            background: linear-gradient(135deg, #003865, #1e40af);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 20px;
            box-shadow: 0 15px 30px rgba(15, 23, 42, 0.2);
        }
        .company-brand {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: center;
            gap: 6px;
            min-width: 180px;
            text-align: right;
            direction: rtl;
        }
        .company-brand .company-name {
            font-size: ${nameFontSize}px;
            font-weight: 700;
            color: #0f172a;
        }
        .company-brand .company-name-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .company-brand .company-name-secondary {
            font-size: ${secondaryNameFontSize}px;
            font-weight: 700;
            color: ${secondaryNameColor};
        }
        .header-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            gap: 10px;
        }
        .header-info h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 800;
            color: #003865;
            line-height: 1.3;
            letter-spacing: 0.6px;
        }
        .header-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 12px 24px;
            font-size: 13px;
            color: #475569;
            justify-content: center;
        }
        .header-meta span {
            display: flex;
            gap: 6px;
            align-items: center;
        }
        .report-body {
            font-size: 15px;
        }
        .report-body p {
            margin-bottom: 16px;
        }
        .section-title {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin: 32px 0 16px;
            padding-right: 18px;
            border-right: 4px solid #003865;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 18px;
            margin-bottom: 28px;
        }
        .summary-card {
            background: linear-gradient(135deg, #eff6ff, #dbeafe);
            border: 1px solid #bfdbfe;
            border-radius: 16px;
            padding: 18px 20px;
            box-shadow: 0 20px 45px rgba(59, 130, 246, 0.16);
        }
        .summary-card .summary-label {
            display: block;
            font-size: 13px;
            color: #1d4ed8;
            margin-bottom: 6px;
            font-weight: 600;
        }
        .summary-card .summary-value {
            font-size: 24px;
            font-weight: 700;
            color: #1e40af;
        }
        .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
        }
        .report-table thead th {
            background: linear-gradient(135deg, #003865, #1e40af);
            color: #ffffff;
            padding: 16px 20px;
            font-size: 14px;
            font-weight: 600;
            text-align: right;
            letter-spacing: 0.3px;
        }
        .report-table tbody td {
            background: #ffffff;
            padding: 14px 20px;
            font-size: 14px;
            border-bottom: 1px solid #e2e8f0;
        }
        .report-table tbody tr:nth-child(even) td {
            background: #f8fafc;
        }
        .report-table tbody tr:hover td {
            background: #eff6ff;
        }
        .empty-state {
            padding: 22px;
            border: 2px dashed #bfdbfe;
            border-radius: 16px;
            background: #f8fafc;
            color: #1e3a8a;
            margin-bottom: 28px;
            font-size: 14px;
        }
        .meta-block {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 10px;
            max-width: 420px;
            width: 100%;
        }
        .meta-item {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            font-size: 13px;
            color: #475569;
            padding: 6px 0;
            border-bottom: 1px dashed rgba(148, 163, 184, 0.4);
        }
        .meta-label {
            font-weight: 600;
        }
        .report-footer {
            border-top: 2px solid #e0e7ff;
            margin-top: 28px;
            padding: 0;
            font-size: 12px;
            color: #475569;
            position: relative;
        }
        .footer-watermark-frame {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.03), rgba(37, 99, 235, 0.05));
            border: 2px solid rgba(59, 130, 246, 0.15);
            border-radius: 12px;
            padding: 16px 20px;
            margin-top: 12px;
            box-shadow: 0 3px 8px rgba(59, 130, 246, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5);
            position: relative;
            overflow: hidden;
        }
        .footer-watermark-frame::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(59, 130, 246, 0.02) 10px,
                rgba(59, 130, 246, 0.02) 20px
            );
            pointer-events: none;
            z-index: 0;
        }
        .footer-watermark-frame > * {
            position: relative;
            z-index: 1;
        }
        .footer-bottom {
            margin-top: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            font-size: 12px;
            font-weight: 600;
            color: #0f172a;
            letter-spacing: 0.2px;
        }
        .footer-bottom-qr {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100px;
            height: 100px;
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(30,64,175,0.12), rgba(59,130,246,0.1));
            box-shadow: 0 12px 24px rgba(30, 64, 175, 0.15);
        }
        .footer-meta-line {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            gap: 30px;
            font-size: 12px;
            font-weight: 600;
            color: #0f172a;
            direction: ltr;
            flex-wrap: nowrap;
            padding: 8px 0;
            border-top: 1px solid rgba(59, 130, 246, 0.1);
            margin-top: 6px;
        }
        .footer-meta-item {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 16px;
            white-space: nowrap;
            min-width: 0;
            font-size: 13px;
            line-height: 1.6;
        }
        .footer-meta-left {
            justify-content: flex-start;
            text-align: left;
            flex: 1 1 0;
        }
        .footer-meta-center {
            justify-content: center;
            text-align: center;
            flex: 1 1 0;
        }
        .footer-meta-right {
            justify-content: flex-end;
            text-align: right;
            flex: 1 1 0;
        }
        .footer-bottom-text {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            text-align: center;
        }
        .report-list {
            padding-right: 20px;
            margin-bottom: 24px;
        }
        .report-list li {
            margin-bottom: 8px;
        }
        .permit-intro {
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(30, 64, 175, 0.08));
            border: 1px solid rgba(37, 99, 235, 0.25);
            border-radius: 18px;
            padding: 18px 22px;
            margin-bottom: 20px;
            font-size: 14px;
            color: #0f172a;
            line-height: 1.9;
        }
        .permit-note {
            background: rgba(15, 23, 42, 0.04);
            border-radius: 16px;
            padding: 16px 20px;
            margin-bottom: 24px;
            font-size: 13px;
            color: #1f2937;
            border-right: 4px solid #2563eb;
        }
        .permit-section {
            margin-top: 36px;
        }
        .permit-section + .permit-section {
            margin-top: 32px;
        }
        .permit-section .section-description {
            font-size: 13px;
            color: #475569;
            margin-bottom: 16px;
            background: rgba(148, 163, 184, 0.15);
            padding: 14px 16px;
            border-radius: 14px;
        }
        .permit-table th {
            width: 22%;
            background: rgba(15, 23, 42, 0.82);
            color: #ffffff;
        }
        .permit-table td {
            width: 28%;
        }
        .checklist-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 18px;
            margin-top: 18px;
        }
        .checklist-group {
            background: rgba(15, 23, 42, 0.03);
            border: 1px solid rgba(148, 163, 184, 0.3);
            border-radius: 16px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .checklist-group h4 {
            margin: 0;
            font-size: 14px;
            color: #1e40af;
            border-right: 3px solid #1e40af;
            padding-right: 10px;
        }
        .check-item {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            color: #1f2937;
        }
        .check-item .check-symbol {
            width: 22px;
            height: 22px;
            border: 2px solid rgba(37, 99, 235, 0.5);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            color: rgba(37, 99, 235, 0.8);
            background: #ffffff;
        }
        .check-item.is-checked {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.14), rgba(37, 99, 235, 0.08));
            border-radius: 12px;
            padding: 6px 10px;
            box-shadow: inset 0 1px 2px rgba(37, 99, 235, 0.12);
        }
        .check-item.is-checked .check-symbol {
            background: #1e3a8a;
            border-color: #1e3a8a;
            color: #ffffff;
        }
        .check-extra {
            margin-right: auto;
            font-size: 12px;
            color: #475569;
        }
        .signature-table td {
            height: 48px;
        }
        .signature-table .empty-cell {
            min-height: 42px;
            border-bottom: 2px dotted rgba(148, 163, 184, 0.6);
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
            gap: 12px;
            margin: 18px 0;
        }
        .status-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 14px;
            border-radius: 14px;
            background: rgba(148, 163, 184, 0.12);
            font-size: 13px;
            color: #0f172a;
        }
        .status-item .check-symbol {
            width: 22px;
            height: 22px;
            border: 2px solid rgba(15, 23, 42, 0.35);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            background: #ffffff;
            color: rgba(15, 23, 42, 0.7);
        }
        .status-item.is-checked {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(5, 150, 105, 0.1));
        }
        .status-item.is-checked .check-symbol {
            border-color: #0f766e;
            background: #0f766e;
            color: #ffffff;
        }
        .placeholder-line {
            display: inline-block;
            min-width: 120px;
            border-bottom: 1px dashed rgba(148, 163, 184, 0.8);
            height: 16px;
            vertical-align: middle;
        }
        .notes-block {
            background: rgba(148, 163, 184, 0.12);
            border-radius: 14px;
            padding: 12px 16px;
            font-size: 12px;
            color: #475569;
            margin-top: 12px;
        }
        .footer-bottom {
            margin-top: 24px;
            text-align: center;
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
            letter-spacing: 0.3px;
        }
        @media print {
            body {
                background: #ffffff;
            }
            .report-wrapper {
                box-shadow: none;
                border-radius: 0;
            }
            .summary-card {
                box-shadow: none;
            }
            .footer-bottom-qr {
                box-shadow: none;
            }
            .footer-watermark-frame {
                box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1);
                border: 2px solid rgba(59, 130, 246, 0.2);
            }
        }
    </style>
</head>
<body>
    <div class="report-wrapper">
        <div class="report-header">
            <div class="company-brand">
                <div class="company-name-group">
                    <div class="company-name">${companyName}</div>
                    ${companySecondaryNameTrimmed ? `<div class="company-name company-name-secondary">${companySecondaryName}</div>` : ''}
                </div>
            </div>
            <div class="header-info">
                <h1>${escape(title || '')}</h1>
                ${metaRows ? `<div class="meta-block">${metaRows}</div>` : ''}
            </div>
            <div class="report-logo">
                ${logo ? `<img src="${logo}" alt="شعار الشركة">` : `<div class="brand-placeholder">${companyInitials}</div>`}
            </div>
        </div>
        <div class="report-body">
            ${enhancedContent}
        </div>
        <div class="report-footer">
            <div class="footer-watermark-frame">
                <div class="footer-bottom">
                    ${shouldRenderQRCode ? `<div id="report-qr-code" class="footer-bottom-qr"></div>` : ''}
                    <div class="footer-meta-line">
                        ${formCode ? `<span class="footer-meta-item footer-meta-left" dir="rtl">كود النموذج: ${formCodeDisplay}</span>` : ''}
                        <span class="footer-meta-item ${formCode ? 'footer-meta-center' : 'footer-meta-left'}" dir="rtl">تاريخ الإصدار: ${issueDateDisplay}</span>
                        <span class="footer-meta-item ${formCode ? 'footer-meta-right' : 'footer-meta-center'}" dir="rtl">تاريخ التعديل: ${revisionDateDisplay}</span>
                        ${!formCode ? `<span class="footer-meta-item footer-meta-right" dir="rtl">رقم الإصدار: ${versionDisplay}</span>` : ''}
                    </div>
                    <div class="footer-bottom-text">
                        <span>${companyName}</span>
                        ${companySecondaryNameTrimmed ? `<span>${companySecondaryName}</span>` : '<span>إدارة السلامة والصحة المهنية والبيئة</span>'}
                    </div>
                </div>
            </div>
        </div>
    </div>
    ${shouldRenderQRCode ? `
    <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
    <script>
        (function() {
            try {
                if (typeof qrcode === 'undefined') { return; }
                var container = document.getElementById('report-qr-code');
                if (!container) { return; }
                var qr = qrcode(0, 'M');
                qr.addData(${qrTextForScript});
                qr.make();
                container.innerHTML = qr.createImgTag(6, 0);
                var img = container.querySelector('img');
                if (img) {
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'contain';
                    img.style.borderRadius = '12px';
                    img.alt = 'QR Code';
                }
            } catch (error) {
                Utils.safeError('Failed to generate QR code:', error);
            }
        })();
    </script>` : ''}
</body>
</html>`;
    }
};

const FormHeader = (typeof window !== 'undefined' && window.FormHeader) ? window.FormHeader : {};
FormHeader.generatePDFHTML = function (
    formCode,
    title,
    content,
    includeQrInHeader = false,
    includeQrInFooter = true,
    meta = {},
    createdAt = new Date(),
    updatedAt = null
) {
    const extendedMeta = Object.assign({}, meta);
    if (!Object.prototype.hasOwnProperty.call(extendedMeta, 'includeQRCode')) {
        extendedMeta.includeQRCode = includeQrInFooter;
    }

    return PDFTemplates.buildDocument({
        title,
        content,
        formCode,
        createdAt,
        updatedAt,
        meta: extendedMeta,
        includeQRCode: includeQrInFooter,
        qrData: extendedMeta.qrData || null
    });
};

if (typeof window !== 'undefined') {
    window.FormHeader = FormHeader;
}

// ===== Employee Helper =====
const EmployeeHelper = {
    getEmployees() {
        const employees = AppState?.appData?.employees;
        return Array.isArray(employees) ? employees : [];
    },

    normalize(value) {
        if (value === undefined || value === null) return '';
        return String(value).trim();
    },

    normalizeLower(value) {
        return this.normalize(value).toLowerCase();
    },

    getPrimaryCode(employee) {
        return this.normalize(
            employee?.employeeNumber ||
            employee?.employeeCode ||
            employee?.sapId ||
            employee?.id ||
            employee?.code ||
            employee?.cardId
        );
    },

    findByCode(term) {
        const normalized = this.normalizeLower(term);
        if (!normalized) return null;

        return this.getEmployees().find(emp => {
            return [
                emp?.employeeNumber,
                emp?.employeeCode,
                emp?.sapId,
                emp?.id,
                emp?.code,
                emp?.cardId
            ].some(value => this.normalizeLower(value) === normalized);
        }) || null;
    },

    findByName(term) {
        const normalized = this.normalizeLower(term);
        if (!normalized) return null;
        return this.getEmployees().find(emp => this.normalizeLower(emp?.name) === normalized) || null;
    },

    findByPartial(term) {
        const normalized = this.normalizeLower(term);
        if (!normalized) return null;

        return this.getEmployees().find(emp => {
            return (
                this.normalizeLower(emp?.employeeNumber).includes(normalized) ||
                this.normalizeLower(emp?.employeeCode).includes(normalized) ||
                this.normalizeLower(emp?.sapId).includes(normalized) ||
                this.normalizeLower(emp?.id).includes(normalized) ||
                this.normalizeLower(emp?.code).includes(normalized) ||
                this.normalizeLower(emp?.cardId).includes(normalized) ||
                this.normalizeLower(emp?.name).includes(normalized)
            );
        }) || null;
    },

    findByTerm(term) {
        return this.findByCode(term) || this.findByName(term) || this.findByPartial(term);
    },

    findMatches(term, limit = 10) {
        const normalized = this.normalizeLower(term);
        if (!normalized) return [];

        return this.getEmployees()
            .filter(emp => {
                return (
                    this.normalizeLower(emp?.employeeNumber).includes(normalized) ||
                    this.normalizeLower(emp?.employeeCode).includes(normalized) ||
                    this.normalizeLower(emp?.sapId).includes(normalized) ||
                    this.normalizeLower(emp?.id).includes(normalized) ||
                    this.normalizeLower(emp?.code).includes(normalized) ||
                    this.normalizeLower(emp?.cardId).includes(normalized) ||
                    this.normalizeLower(emp?.name).includes(normalized)
                );
            })
            .slice(0, limit);
    },

    formatEmployeeDisplay(employee) {
        if (!employee) return '';
        const code = this.getPrimaryCode(employee);
        const name = this.normalize(employee?.name);
        const position = this.normalize(employee?.position || employee?.jobTitle);
        const department = this.normalize(employee?.department || employee?.unit || employee?.section);
        const parts = [];
        if (code) parts.push(code);
        if (name) parts.push(name);
        if (position) parts.push(position);
        if (department) parts.push(department);
        return parts.join(' - ');
    },

    setupEmployeeCodeSearch(codeInputId, nameInputId = null, onSelect = null) {
        const codeInput = typeof codeInputId === 'string' ? document.getElementById(codeInputId) : codeInputId;
        if (!codeInput) return;

        const nameInput = nameInputId ? document.getElementById(nameInputId) : null;
        const performLookup = () => {
            const term = this.normalize(codeInput.value);
            if (!term) {
                if (nameInput) nameInput.value = '';
                onSelect?.(null);
                return;
            }

            const employee = this.findByTerm(term);
            if (employee) {
                const primaryCode = this.getPrimaryCode(employee);
                if (primaryCode) {
                    codeInput.value = primaryCode;
                }
                if (nameInput) {
                    nameInput.value = employee.name || '';
                }
                onSelect?.(employee);
            } else {
                onSelect?.(null);
                if (typeof Notification !== 'undefined' && term.length >= 4) {
                    Notification.warning('لم يتم العثور على موظف بهذا الكود أو الاسم');
                }
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                performLookup();
            }
        };

        if (codeInput._employeeHelperLookup) {
            codeInput.removeEventListener('change', codeInput._employeeHelperLookup);
            codeInput.removeEventListener('blur', codeInput._employeeHelperLookup);
        }
        if (codeInput._employeeHelperKeyDown) {
            codeInput.removeEventListener('keydown', codeInput._employeeHelperKeyDown);
        }

        codeInput._employeeHelperLookup = performLookup;
        codeInput._employeeHelperKeyDown = handleKeyDown;

        codeInput.addEventListener('change', performLookup);
        codeInput.addEventListener('blur', performLookup);
        codeInput.addEventListener('keydown', handleKeyDown);
    },

    setupAutocomplete(nameInputId, onSelect = null) {
        const input = typeof nameInputId === 'string' ? document.getElementById(nameInputId) : nameInputId;
        if (!input) return;

        const listId = `${input.id || nameInputId}-employee-helper-list`;
        let dataList = document.getElementById(listId);
        if (!dataList) {
            dataList = document.createElement('datalist');
            dataList.id = listId;
            document.body.appendChild(dataList);
        }

        const optionsHTML = this.getEmployees().map(emp => {
            const display = Utils.escapeHTML(this.formatEmployeeDisplay(emp));
            const value = Utils.escapeHTML(emp?.name || '');
            return `<option value="${value}" data-code="${Utils.escapeHTML(this.getPrimaryCode(emp))}">${display}</option>`;
        }).join('');
        dataList.innerHTML = optionsHTML;
        input.setAttribute('list', listId);

        const handleSelection = () => {
            const term = this.normalize(input.value);
            if (!term) {
                onSelect?.(null);
                return;
            }
            const employee = this.findByTerm(term);
            if (employee) {
                onSelect?.(employee);
            } else {
                onSelect?.(null);
            }
        };

        if (input._employeeHelperAutocomplete) {
            input.removeEventListener('change', input._employeeHelperAutocomplete);
            input.removeEventListener('blur', input._employeeHelperAutocomplete);
        }

        input._employeeHelperAutocomplete = handleSelection;
        input.addEventListener('change', handleSelection);
        input.addEventListener('blur', handleSelection);
    }
};

if (typeof window !== 'undefined') {
    window.EmployeeHelper = EmployeeHelper;
}

// ===== PPE Matrix Helper =====
const PPEMatrix = {
    instances: {},
    activeContainerId: null,
    predefinedItems: [
        'خوذة أمان',
        'نظارات وقاية',
        'قفازات',
        'أحذية أمان',
        'سترة عاكسة',
        'سدادات أذن',
        'كمامة',
        'بدلة واقية',
        'حزام أمان',
        'معدات حماية تنفسية'
    ],

    collectPositions() {
        const matrix = AppState?.appData?.employeePPEMatrix || {};
        const employees = AppState?.appData?.employees || [];

        const fromMatrix = Object.keys(matrix);
        const fromEmployees = employees
            .map(emp => (emp?.position || '').trim())
            .filter(Boolean);

        return Array.from(new Set([...fromMatrix, ...fromEmployees]))
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, 'ar', { sensitivity: 'base' }));
    },

    collectItems() {
        const matrix = AppState?.appData?.employeePPEMatrix || {};
        const ppeList = AppState?.appData?.ppe || [];

        const fromMatrix = Object.values(matrix)
            .flatMap(entry => entry?.requiredPPE || []);
        const fromReceipts = ppeList
            .map(item => item?.equipmentType || '')
            .filter(Boolean);

        return Array.from(new Set([
            ...this.predefinedItems,
            ...fromMatrix,
            ...fromReceipts
        ])).filter(Boolean)
            .sort((a, b) => a.localeCompare(b, 'ar', { sensitivity: 'base' }));
    },

    getPositionItems(position) {
        if (!position) return [];
        const matrix = AppState?.appData?.employeePPEMatrix || {};
        const entry = matrix[position];
        if (!entry) return [];
        return Array.isArray(entry.requiredPPE) ? entry.requiredPPE.filter(Boolean) : [];
    },

    renderCheckboxMarkup(items = [], selectedItems = []) {
        const selectedSet = new Set(selectedItems.filter(Boolean));
        if (!items.length) {
            return `
                <div class="text-sm text-gray-500 bg-gray-100 border border-dashed border-gray-300 rounded p-3">
                    لا توجد أنواع مهمات وقاية مسجلة مسبقاً. يمكنك إضافة أنواع جديدة يدوياً.
                </div>
            `;
        }

        return items.map(item => `
            <label class="ppe-matrix-option flex items-center p-2 border border-gray-200 rounded hover:bg-blue-50 transition-colors cursor-pointer">
                <input type="checkbox" class="ppe-matrix-item ml-2 rounded border-gray-300 text-blue-600"
                    value="${Utils.escapeHTML(item)}" ${selectedSet.has(item) ? 'checked' : ''}>
                <span class="text-sm font-medium text-gray-700">${Utils.escapeHTML(item)}</span>
            </label>
        `).join('');
    },

    generate(containerId = 'ppe-matrix', options = {}) {
        const positions = this.collectPositions();
        const availableItems = this.collectItems();

        const selectedPosition = options.selectedPosition && positions.includes(options.selectedPosition)
            ? options.selectedPosition
            : (positions[0] || '');
        const selectedItems = options.selectedItems && Array.isArray(options.selectedItems)
            ? options.selectedItems
            : this.getPositionItems(selectedPosition);

        const hasPositions = positions.length > 0;
        const positionSelectHTML = hasPositions ? `
            <div class="mb-4">
                <label class="block text-sm font-semibold text-gray-700 mb-2">اختر الوظيفة</label>
                <select class="form-input ppe-matrix-position">
                    <option value="">-- اختر الوظيفة --</option>
                    ${positions.map(position => `
                        <option value="${Utils.escapeHTML(position)}" ${position === selectedPosition ? 'selected' : ''}>
                            ${Utils.escapeHTML(position)}
                        </option>
                    `).join('')}
                    <option value="__custom__">أخرى (إدخال يدوي)</option>
                </select>
                <input type="text" class="form-input ppe-matrix-position-custom mt-2 hidden" placeholder="أدخل اسم الوظيفة">
                <p class="text-xs text-gray-500 mt-1">يتم تحميل مهمات الوقاية تلقائياً عند اختيار الوظيفة إذا كانت مسجلة مسبقاً.</p>
            </div>
        ` : `
            <div class="mb-4 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                لا توجد وظائف مسجلة في مصفوفة مهمات الوقاية. يمكنك إضافة مهمات الوقاية المطلوبة يدوياً أدناه ثم حفظ النموذج.
            </div>
        `;

        const html = `
            <div class="ppe-matrix-root space-y-4" data-matrix-id="${containerId}">
                ${positionSelectHTML}
                <div class="ppe-matrix-items grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    ${this.renderCheckboxMarkup(availableItems, selectedItems)}
                </div>
                <div class="flex items-center gap-2">
                    <input type="text" class="form-input flex-1 ppe-matrix-custom-input" placeholder="أضف مهمة وقاية مخصصة">
                    <button type="button" class="btn-secondary ppe-matrix-add-btn">
                        <i class="fas fa-plus ml-2"></i>إضافة
                    </button>
                </div>
                <p class="text-xs text-gray-500">
                    يتم حفظ الاختيارات مع النموذج الحالي فقط. لتحديث مصفوفة مهمات الوقاية بشكل دائم، استخدم شاشة "إدارة مهمات الوقاية".
                </p>
            </div>
            <script>
                setTimeout(() => {
                    if (window.PPEMatrix && typeof PPEMatrix.init === 'function') {
                        PPEMatrix.init('${containerId}', ${JSON.stringify({
            positions,
            items: availableItems,
            selectedPosition,
            selectedItems
        })});
                    }
                }, 0);
            </script>
        `;

        return html;
    },

    init(containerId, config = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const root = container.querySelector(`[data-matrix-id="${containerId}"]`);
        if (!root) return;

        const instance = {
            container,
            root,
            positions: Array.isArray(config.positions) ? [...config.positions] : [],
            items: Array.isArray(config.items) ? [...new Set(config.items.filter(Boolean))] : [],
            selectedItems: new Set((config.selectedItems || []).filter(Boolean)),
            selectedPosition: config.selectedPosition || '',
            customPosition: ''
        };

        this.instances[containerId] = instance;
        this.activeContainerId = containerId;

        this.bindEvents(instance);
    },

    bindEvents(instance) {
        const { root } = instance;
        if (!root) return;

        const positionSelect = root.querySelector('.ppe-matrix-position');
        const customPositionInput = root.querySelector('.ppe-matrix-position-custom');
        const addBtn = root.querySelector('.ppe-matrix-add-btn');
        const customInput = root.querySelector('.ppe-matrix-custom-input');

        if (positionSelect) {
            positionSelect.addEventListener('change', (event) => {
                const value = event.target.value;
                if (value === '__custom__') {
                    instance.selectedPosition = '';
                    instance.customPosition = '';
                    if (customPositionInput) {
                        customPositionInput.classList.remove('hidden');
                        customPositionInput.required = true;
                        customPositionInput.focus();
                    }
                    instance.selectedItems = new Set();
                    this.renderItems(instance);
                } else {
                    if (customPositionInput) {
                        customPositionInput.classList.add('hidden');
                        customPositionInput.required = false;
                        customPositionInput.value = '';
                    }
                    instance.selectedPosition = value;
                    instance.customPosition = '';
                    instance.selectedItems = new Set(this.getPositionItems(value));
                    instance.items = Array.from(new Set([...instance.items, ...instance.selectedItems]));
                    this.renderItems(instance);
                }
            });
        }

        if (customPositionInput) {
            customPositionInput.addEventListener('input', (event) => {
                instance.customPosition = event.target.value.trim();
            });
        }

        root.addEventListener('change', (event) => {
            if (event.target.matches('.ppe-matrix-item')) {
                const value = event.target.value;
                if (event.target.checked) {
                    instance.selectedItems.add(value);
                } else {
                    instance.selectedItems.delete(value);
                }
            }
        });

        if (addBtn && customInput) {
            addBtn.addEventListener('click', () => {
                const value = customInput.value.trim();
                if (!value) {
                    if (typeof Notification !== 'undefined') {
                        Notification.warning('يرجى إدخال اسم مهمة الوقاية قبل الإضافة');
                    }
                    return;
                }
                if (!instance.items.includes(value)) {
                    instance.items.push(value);
                    instance.items.sort((a, b) => a.localeCompare(b, 'ar', { sensitivity: 'base' }));
                }
                instance.selectedItems.add(value);
                customInput.value = '';
                this.renderItems(instance);
            });
        }

        this.renderItems(instance);
    },

    renderItems(instance) {
        const itemsContainer = instance?.root?.querySelector('.ppe-matrix-items');
        if (!itemsContainer) return;

        const markup = this.renderCheckboxMarkup(instance.items, Array.from(instance.selectedItems));
        itemsContainer.innerHTML = markup;
    },

    getActiveInstance(containerId = null) {
        const id = containerId || this.activeContainerId;
        if (!id) return null;
        return this.instances[id] || null;
    },

    getSelected(containerId = null) {
        const instance = this.getActiveInstance(containerId);
        if (!instance) return [];
        return Array.from(instance.selectedItems);
    },

    setSelected(selectedItems = [], containerId = null) {
        const instance = this.getActiveInstance(containerId);
        if (!instance) return;
        instance.selectedItems = new Set((selectedItems || []).filter(Boolean));
        instance.items = Array.from(new Set([...instance.items, ...instance.selectedItems]));
        this.renderItems(instance);
    },

    getSelectedPosition(containerId = null) {
        const instance = this.getActiveInstance(containerId);
        if (!instance) return '';
        return instance.selectedPosition || instance.customPosition || '';
    },

    setPosition(position, containerId = null) {
        const instance = this.getActiveInstance(containerId);
        if (!instance) return;
        const select = instance.root.querySelector('.ppe-matrix-position');
        const customInput = instance.root.querySelector('.ppe-matrix-position-custom');
        if (select) {
            if (instance.positions.includes(position)) {
                select.value = position;
                instance.selectedPosition = position;
                instance.customPosition = '';
                if (customInput) {
                    customInput.classList.add('hidden');
                    customInput.required = false;
                    customInput.value = '';
                }
                instance.selectedItems = new Set(this.getPositionItems(position));
                instance.items = Array.from(new Set([...instance.items, ...instance.selectedItems]));
                this.renderItems(instance);
            } else if (position) {
                select.value = '__custom__';
                if (customInput) {
                    customInput.classList.remove('hidden');
                    customInput.required = true;
                    customInput.value = position;
                }
                instance.selectedPosition = '';
                instance.customPosition = position;
                instance.selectedItems = new Set();
                this.renderItems(instance);
            }
        }
    }
};

// Export to global scope
if (typeof window !== 'undefined') {
    window.Utils = Utils;
    window.Notification = Notification;
    window.Loading = Loading;
    window.QRCode = QRCode;
    window.ViolationTypesManager = ViolationTypesManager;
    window.DEFAULT_PERIODIC_INSPECTION_CATEGORIES = DEFAULT_PERIODIC_INSPECTION_CATEGORIES;
    window.DEFAULT_VIOLATION_TYPES = DEFAULT_VIOLATION_TYPES;
    window.PDFTemplates = PDFTemplates;
    window.EmployeeHelper = EmployeeHelper;
    window.PPEMatrix = PPEMatrix;
    window.Permissions = Permissions;
    window.AppState = AppState;
    window.MODULE_PERMISSIONS_CONFIG = MODULE_PERMISSIONS_CONFIG;
    window.DEFAULT_ROLE_PERMISSIONS = DEFAULT_ROLE_PERMISSIONS;
}

/**
 * إزالة أي حسابات افتراضية legacy من البيانات المحلية.
 * 
 * ⚠️ ملاحظة أمنية:
 * - لا نقوم بإنشاء حسابات افتراضية في الإنتاج.
 * - هذا فقط Cleanup لأي بيانات قديمة تم زرعها في نسخ سابقة (مثل نطاق @hse.local).
 * 
 * @param {{persistRemote?: boolean}} options
 * @returns {{removed: number, removedEmails: string[]}}
 */
function removeDefaultUsersIfNeeded(options = {}) {
    try {
        const users = AppState?.appData?.users;
        if (!Array.isArray(users) || users.length === 0) {
            return { removed: 0, removedEmails: [] };
        }

        const isLegacyDefaultUser = (u) => {
            try {
                const email = String(u?.email || '').toLowerCase().trim();
                return (u?.isDefaultUser === true) || email.endsWith('@hse.local');
            } catch (e) {
                return false;
            }
        };

        const removedUsers = users.filter(isLegacyDefaultUser);
        if (removedUsers.length === 0) {
            return { removed: 0, removedEmails: [] };
        }

        AppState.appData.users = users.filter(u => !isLegacyDefaultUser(u));

        // حفظ محلي
        try {
            if (typeof window !== 'undefined' && window.DataManager && typeof window.DataManager.save === 'function') {
                window.DataManager.save();
            }
        } catch (e) {
            // ignore
        }

        // حفظ عن بعد (اختياري) - فقط إذا طُلِب صراحةً
        const persistRemote = options && options.persistRemote === true;
        if (persistRemote) {
            try {
                const isAdmin = (typeof Permissions !== 'undefined' && typeof Permissions.isCurrentUserAdmin === 'function')
                    ? Permissions.isCurrentUserAdmin()
                    : (AppState.currentUser?.role || '').toLowerCase() === 'admin';

                if (isAdmin && typeof GoogleIntegration !== 'undefined' && typeof GoogleIntegration.autoSave === 'function' &&
                    AppState.googleConfig?.appsScript?.enabled) {
                    GoogleIntegration.autoSave('Users', AppState.appData.users).catch(() => { });
                }
            } catch (e) {
                // ignore
            }
        }

        return {
            removed: removedUsers.length,
            removedEmails: removedUsers.map(u => String(u?.email || '')).filter(Boolean)
        };
    } catch (error) {
        return { removed: 0, removedEmails: [] };
    }
}

// Export cleanup helper globally (used by Users module)
if (typeof window !== 'undefined') {
    window.removeDefaultUsersIfNeeded = removeDefaultUsersIfNeeded;
}

/**
 * Module Lifecycle Manager
 * إدارة دورة حياة الموديولات - ضمان تنفيذ الكود في الوقت الصحيح
 */
const ModuleLifecycle = {
    /**
     * تنفيذ كود فقط عندما يكون الموديول مفتوحاً
     * @param {string} moduleId - معرف القسم (مثل: 'contractors-section')
     * @param {Function} callback - الدالة المراد تنفيذها
     * @returns {boolean} - هل تم التنفيذ أم لا
     */
    executeIfModuleActive(moduleId, callback) {
        try {
            const section = document.getElementById(moduleId);
            if (section && document.contains(section)) {
                const style = getComputedStyle(section);
                // التحقق من أن القسم مرئي
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                    if (typeof callback === 'function') {
                        callback(section);
                        return true;
                    }
                }
            }
            return false;
        } catch (error) {
            Utils.safeWarn('⚠️ ModuleLifecycle.executeIfModuleActive error:', error);
            return false;
        }
    },

    /**
     * انتظار فتح موديول معين ثم تنفيذ الكود
     * @param {string} moduleId - معرف القسم
     * @param {Function} callback - الدالة المراد تنفيذها
     * @param {number} timeout - الحد الأقصى للانتظار (بالميلي ثانية)
     * @returns {Promise<boolean>}
     */
    async waitForModuleActive(moduleId, callback, timeout = 10000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            const check = () => {
                if (this.executeIfModuleActive(moduleId, callback)) {
                    resolve(true);
                    return;
                }
                
                if (Date.now() - startTime >= timeout) {
                    Utils.safeWarn(`⚠️ ModuleLifecycle: timeout انتظار الموديول "${moduleId}"`);
                    resolve(false);
                    return;
                }
                
                requestAnimationFrame(check);
            };
            
            check();
        });
    },

    /**
     * تسجيل معالج لحدث فتح موديول
     * @param {string} moduleId - معرف القسم
     * @param {Function} onOpen - الدالة المراد تنفيذها عند الفتح
     * @param {Function} onClose - الدالة المراد تنفيذها عند الإغلاق (اختياري)
     */
    onModuleToggle(moduleId, onOpen, onClose = null) {
        try {
            // استخدام MutationObserver لمراقبة تغييرات العرض
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes' && 
                        (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                        const section = document.getElementById(moduleId);
                        if (section) {
                            const style = getComputedStyle(section);
                            const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
                            
                            if (isVisible && typeof onOpen === 'function') {
                                onOpen(section);
                            } else if (!isVisible && typeof onClose === 'function') {
                                onClose(section);
                            }
                        }
                    }
                }
            });

            // مراقبة التغييرات على القسم الرئيسي
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                observer.observe(mainContent, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['style', 'class']
                });
            }

            return observer;
        } catch (error) {
            Utils.safeWarn('⚠️ ModuleLifecycle.onModuleToggle error:', error);
            return null;
        }
    },

    /**
     * إعادة ربط Event Listeners بعد تحديث DOM
     * @param {HTMLElement} container - العنصر الحاوي
     * @param {Object} handlers - معالجات الأحداث {selector: {event: handler}}
     * @param {AbortController} abortController - للإلغاء
     */
    rebindEventListeners(container, handlers, abortController = null) {
        if (!container || !document.contains(container) || !handlers) return;

        Object.entries(handlers).forEach(([selector, events]) => {
            const elements = container.querySelectorAll(selector);
            elements.forEach(element => {
                Object.entries(events).forEach(([eventType, handler]) => {
                    if (typeof handler === 'function') {
                        const options = abortController ? { signal: abortController.signal } : {};
                        element.addEventListener(eventType, handler, options);
                    }
                });
            });
        });
    },

    /**
     * تنظيف موديول وإزالة جميع listeners
     * @param {AbortController} abortController - AbortController للموديول
     */
    cleanupModule(abortController) {
        if (abortController && typeof abortController.abort === 'function') {
            abortController.abort();
        }
    }
};

// Export ModuleLifecycle globally
if (typeof window !== 'undefined') {
    window.ModuleLifecycle = ModuleLifecycle;
}

// تصدير const aliases للتوافق مع الكود القديم
// ملاحظة: تم التعليق على إعادة التعريف لتجنب التعارض
// const Notification = window.Notification;
// const Utils = window.Utils;
// const Loading = window.Loading;

