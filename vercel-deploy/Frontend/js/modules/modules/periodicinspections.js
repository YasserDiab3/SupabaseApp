/**
 * PeriodicInspections Module
 * تم استخراجه من app-modules.js
 */
// ===== PeriodicInspections Module =====
const PeriodicInspections = {
    // قوالب الفحوصات الجاهزة
    INSPECTION_TEMPLATES: {
        'emergency-lights': {
            id: 'emergency-lights',
            name: 'فحص كشافات الطوارئ',
            icon: 'fa-lightbulb',
            checklist: [
                { id: 'el1', label: 'فحص عمل الكشافات بشكل تلقائي عند انقطاع الكهرباء', required: true },
                { id: 'el2', label: 'فحص شدة الإضاءة (يجب أن تكون كافية للرؤية)', required: true },
                { id: 'el3', label: 'فحص حالة البطارية (شحن كامل)', required: true },
                { id: 'el4', label: 'فحص حالة الكشاف الخارجي (عدم وجود كسور أو تشققات)', required: true },
                { id: 'el5', label: 'فحص التوصيلات الكهربائية (عدم وجود أسلاك مكشوفة)', required: true },
                { id: 'el6', label: 'فحص مؤشر الشحن (يعمل بشكل صحيح)', required: false },
                { id: 'el7', label: 'فحص تاريخ آخر صيانة', required: false },
                { id: 'el8', label: 'فحص موقع التثبيت (في المكان الصحيح)', required: true }
            ]
        },
        'fire-extinguisher': {
            id: 'fire-extinguisher',
            name: 'فحص معدات الإطفاء (الاستكر)',
            icon: 'fa-fire-extinguisher',
            checklist: [
                { id: 'fe1', label: 'فحص تاريخ الصلاحية (لم تنتهِ)', required: true },
                { id: 'fe2', label: 'فحص عداد الضغط (في المنطقة الخضراء)', required: true },
                { id: 'fe3', label: 'فحص سلامة الختم (غير مكسور)', required: true },
                { id: 'fe4', label: 'فحص حالة الخرطوم (لا يوجد تلف أو تشققات)', required: true },
                { id: 'fe5', label: 'فحص حالة الفوهة (نظيفة وغير مسدودة)', required: true },
                { id: 'fe6', label: 'فحص موقع التثبيت (في المكان المحدد)', required: true },
                { id: 'fe7', label: 'فحص لافتة التعريف (واضحة ومقروءة)', required: true },
                { id: 'fe8', label: 'فحص سهولة الوصول (غير معوق)', required: true },
                { id: 'fe9', label: 'فحص نوع المادة (مناسبة لنوع الحريق)', required: true },
                { id: 'fe10', label: 'فحص حالة الحامل (مثبت بشكل آمن)', required: false }
            ]
        },
        'forklift': {
            id: 'forklift',
            name: 'فحص معدات الكلارك (الرافعات الشوكية)',
            icon: 'fa-truck-loading',
            checklist: [
                { id: 'fl1', label: 'فحص نظام الفرامل (يعمل بشكل صحيح)', required: true },
                { id: 'fl2', label: 'فحص شوكتي الرفع (عدم وجود تشققات أو تلف)', required: true },
                { id: 'fl3', label: 'فحص البطارية أو خزان الوقود (ممتلئ، لا يوجد تسريب)', required: true },
                { id: 'fl4', label: 'فحص الإطارات (حالة جيدة، ضغط مناسب)', required: true },
                { id: 'fl5', label: 'فحص نظام الإضاءة (المصابيح الأمامية والخلفية)', required: true },
                { id: 'fl6', label: 'فحص نظام الإنذار (الصافرة تعمل)', required: true },
                { id: 'fl7', label: 'فحص حزام الأمان (سليم ويعمل)', required: true },
                { id: 'fl8', label: 'فحص نظام الرفع والهبوط (يعمل بسلاسة)', required: true },
                { id: 'fl9', label: 'فحص المرايا (نظيفة ومثبتة)', required: false },
                { id: 'fl10', label: 'فحص مستويات الزيوت والمواد الهيدروليكية', required: true },
                { id: 'fl11', label: 'فحص شهادة الصيانة الدورية', required: true },
                { id: 'fl12', label: 'فحص رخصة السائق (سارية)', required: true }
            ]
        },
        'emergency-doors': {
            id: 'emergency-doors',
            name: 'فحص أبواب الطوارئ',
            icon: 'fa-door-open',
            checklist: [
                { id: 'ed1', label: 'فحص سهولة الفتح (يفتح بسهولة دون قوة زائدة)', required: true },
                { id: 'ed2', label: 'فحص اتجاه الفتح (يفتح للخارج)', required: true },
                { id: 'ed3', label: 'فحص حالة القفل (يعمل بشكل صحيح)', required: true },
                { id: 'ed4', label: 'فحص لافتة "مخرج طوارئ" (واضحة ومضيئة)', required: true },
                { id: 'ed5', label: 'فحص الإضاءة الطارئة فوق الباب (تعمل)', required: true },
                { id: 'ed6', label: 'فحص عدم وجود عوائق أمام الباب', required: true },
                { id: 'ed7', label: 'فحص حالة الباب (لا يوجد تلف أو تشققات)', required: true },
                { id: 'ed8', label: 'فحص نظام الإنذار (يعمل عند الفتح)', required: false },
                { id: 'ed9', label: 'فحص عرض الباب (كافٍ لمرور الأشخاص)', required: true }
            ]
        },
        'boiler': {
            id: 'boiler',
            name: 'فحص الغلاية / المرجل البخارية',
            icon: 'fa-fire',
            checklist: [
                { id: 'bl1', label: 'فحص عداد الضغط (في النطاق الآمن)', required: true },
                { id: 'bl2', label: 'فحص صمام الأمان (يعمل بشكل صحيح)', required: true },
                { id: 'bl3', label: 'فحص مستوى الماء (في المستوى المطلوب)', required: true },
                { id: 'bl4', label: 'فحص نظام الاحتراق (يعمل بكفاءة)', required: true },
                { id: 'bl5', label: 'فحص عدم وجود تسريبات (ماء، بخار، وقود)', required: true },
                { id: 'bl6', label: 'فحص نظام التهوية (يعمل بشكل صحيح)', required: true },
                { id: 'bl7', label: 'فحص حالة العزل الحراري (سليم)', required: true },
                { id: 'bl8', label: 'فحص شهادة الفحص الدوري (سارية)', required: true },
                { id: 'bl9', label: 'فحص نظام الإنذار (يعمل)', required: true },
                { id: 'bl10', label: 'فحص حالة الأنابيب والوصلات (لا يوجد تآكل)', required: true },
                { id: 'bl11', label: 'فحص سجل الصيانة (محدث)', required: false },
                { id: 'bl12', label: 'فحص درجة حرارة التشغيل (في النطاق الآمن)', required: true }
            ]
        },
        'rocket': {
            id: 'rocket',
            name: 'فحص الصاروخ',
            icon: 'fa-rocket',
            checklist: [
                { id: 'rk1', label: 'فحص حالة الهيكل الخارجي (لا يوجد تلف أو تشققات)', required: true },
                { id: 'rk2', label: 'فحص نظام التوجيه (يعمل بشكل صحيح)', required: true },
                { id: 'rk3', label: 'فحص نظام الدفع (سليم)', required: true },
                { id: 'rk4', label: 'فحص نظام الأمان (يعمل)', required: true },
                { id: 'rk5', label: 'فحص التوصيلات الكهربائية (سليمة)', required: true },
                { id: 'rk6', label: 'فحص حالة التخزين (في مكان آمن ومناسب)', required: true },
                { id: 'rk7', label: 'فحص شهادة الصيانة (سارية)', required: true },
                { id: 'rk8', label: 'فحص نظام الإنذار (يعمل)', required: false }
            ]
        },
        'welding-machine': {
            id: 'welding-machine',
            name: 'فحص مكينة اللحام',
            icon: 'fa-wrench',
            checklist: [
                { id: 'wm1', label: 'فحص التوصيلات الكهربائية (سليمة، لا يوجد أسلاك مكشوفة)', required: true },
                { id: 'wm2', label: 'فحص قاطع التيار (يعمل بشكل صحيح)', required: true },
                { id: 'wm3', label: 'فحص حالة الكابل (لا يوجد تلف أو تشققات)', required: true },
                { id: 'wm4', label: 'فحص قطب اللحام (في حالة جيدة)', required: true },
                { id: 'wm5', label: 'فحص نظام التبريد (يعمل إذا كان موجوداً)', required: false },
                { id: 'wm6', label: 'فحص عداد التيار (يعمل)', required: true },
                { id: 'wm7', label: 'فحص نظام التأريض (متصل بشكل صحيح)', required: true },
                { id: 'wm8', label: 'فحص حالة الهيكل (لا يوجد تلف)', required: true },
                { id: 'wm9', label: 'فحص لافتة التحذير (واضحة)', required: false },
                { id: 'wm10', label: 'فحص شهادة الصيانة (سارية)', required: true }
            ]
        },
        'electrical-rooms': {
            id: 'electrical-rooms',
            name: 'فحص غرف الكهرباء',
            icon: 'fa-bolt',
            checklist: [
                { id: 'er1', label: 'فحص نظام التهوية (يعمل بشكل صحيح)', required: true },
                { id: 'er2', label: 'فحص درجة الحرارة (في النطاق الآمن)', required: true },
                { id: 'er3', label: 'فحص نظام الإضاءة (كافٍ)', required: true },
                { id: 'er4', label: 'فحص لافتة "خطر - كهرباء" (واضحة)', required: true },
                { id: 'er5', label: 'فحص عدم وجود رطوبة أو تسريبات', required: true },
                { id: 'er6', label: 'فحص حالة الألواح الكهربائية (مغلقة بشكل آمن)', required: true },
                { id: 'er7', label: 'فحص نظام التأريض (متصل)', required: true },
                { id: 'er8', label: 'فحص عدم وجود مواد قابلة للاشتعال', required: true },
                { id: 'er9', label: 'فحص نظام الإنذار (يعمل)', required: false },
                { id: 'er10', label: 'فحص سهولة الوصول (غير معوق)', required: true },
                { id: 'er11', label: 'فحص حالة الكابلات (لا يوجد تلف)', required: true },
                { id: 'er12', label: 'فحص طفاية الحريق (موجودة وسارية)', required: true }
            ]
        },
        'hand-tools': {
            id: 'hand-tools',
            name: 'فحص العدد اليدوية',
            icon: 'fa-tools',
            checklist: [
                { id: 'ht1', label: 'فحص حالة العدد (لا يوجد تلف أو كسر)', required: true },
                { id: 'ht2', label: 'فحص المقابض (سليمة وآمنة)', required: true },
                { id: 'ht3', label: 'فحص عدم وجود صدأ أو تآكل', required: true },
                { id: 'ht4', label: 'فحص حدة الأدوات القاطعة (حادة وآمنة)', required: true },
                { id: 'ht5', label: 'فحص التخزين (في مكان مناسب ومنظم)', required: true },
                { id: 'ht6', label: 'فحص وجود لافتات التعريف (واضحة)', required: false },
                { id: 'ht7', label: 'فحص عدم وجود عيوب في التصنيع', required: true },
                { id: 'ht8', label: 'فحص تاريخ الشراء (إن أمكن)', required: false }
            ]
        },
        'safety-belt': {
            id: 'safety-belt',
            name: 'فحص حزام الأمان',
            icon: 'fa-user-shield',
            checklist: [
                { id: 'sb1', label: 'فحص حالة الحزام (لا يوجد تلف أو تمزق)', required: true },
                { id: 'sb2', label: 'فحص نظام القفل (يعمل بشكل صحيح)', required: true },
                { id: 'sb3', label: 'فحص طول الحزام (مناسب للاستخدام)', required: true },
                { id: 'sb4', label: 'فحص نقاط التثبيت (سليمة وآمنة)', required: true },
                { id: 'sb5', label: 'فحص تاريخ الصلاحية (لم تنتهِ)', required: true },
                { id: 'sb6', label: 'فحص لافتة التعريف (واضحة)', required: false },
                { id: 'sb7', label: 'فحص عدم وجود تآكل في المعادن', required: true },
                { id: 'sb8', label: 'فحص شهادة الفحص (سارية)', required: true }
            ]
        },
        'vehicles': {
            id: 'vehicles',
            name: 'فحص السيارات (الملاكي / الميكروباص)',
            icon: 'fa-car',
            checklist: [
                { id: 'vh1', label: 'فحص صلاحية التأمين (ساري)', required: true },
                { id: 'vh2', label: 'فحص صلاحية الرخصة (سارية)', required: true },
                { id: 'vh3', label: 'فحص الإطارات (حالة جيدة، ضغط مناسب)', required: true },
                { id: 'vh4', label: 'فحص نظام الفرامل (يعمل بشكل صحيح)', required: true },
                { id: 'vh5', label: 'فحص نظام الإضاءة (المصابيح تعمل)', required: true },
                { id: 'vh6', label: 'فحص المرايا (نظيفة ومثبتة)', required: true },
                { id: 'vh7', label: 'فحص حزام الأمان (يعمل)', required: true },
                { id: 'vh8', label: 'فحص وجود طفاية حريق (سارية)', required: true },
                { id: 'vh9', label: 'فحص وجود حقيبة إسعافات أولية', required: false },
                { id: 'vh10', label: 'فحص نظام الإنذار (الصافرة تعمل)', required: true },
                { id: 'vh11', label: 'فحص مستويات الزيوت والمواد', required: true },
                { id: 'vh12', label: 'فحص شهادة الفحص الدوري (سارية)', required: true }
            ]
        },
        'scaffolding': {
            id: 'scaffolding',
            name: 'فحص السقالة',
            icon: 'fa-layer-group',
            checklist: [
                { id: 'sc1', label: 'فحص استقرار السقالة (مثبتة بشكل آمن)', required: true },
                { id: 'sc2', label: 'فحص حالة الأعمدة (لا يوجد تلف أو تشققات)', required: true },
                { id: 'sc3', label: 'فحص حالة الألواح (سليمة وآمنة)', required: true },
                { id: 'sc4', label: 'فحص نظام التثبيت (مثبت بشكل صحيح)', required: true },
                { id: 'sc5', label: 'فحص وجود درابزين الحماية', required: true },
                { id: 'sc6', label: 'فحص وجود لوح الحماية السفلي', required: true },
                { id: 'sc7', label: 'فحص عدم وجود عيوب في اللحامات', required: true },
                { id: 'sc8', label: 'فحص سهولة الصعود والنزول', required: true },
                { id: 'sc9', label: 'فحص لافتة "تم الفحص" (واضحة)', required: false },
                { id: 'sc10', label: 'فحص شهادة الفحص (سارية)', required: true }
            ]
        },
        'emergency-light-bulb': {
            id: 'emergency-light-bulb',
            name: 'فحص لمبة القطعية',
            icon: 'fa-lightbulb',
            checklist: [
                { id: 'elb1', label: 'فحص عمل اللمبة عند انقطاع الكهرباء', required: true },
                { id: 'elb2', label: 'فحص شدة الإضاءة (كافية)', required: true },
                { id: 'elb3', label: 'فحص حالة اللمبة (لا يوجد كسر)', required: true },
                { id: 'elb4', label: 'فحص حالة البطارية (مشحونة)', required: true },
                { id: 'elb5', label: 'فحص التوصيلات الكهربائية (سليمة)', required: true },
                { id: 'elb6', label: 'فحص موقع التثبيت (في المكان الصحيح)', required: true },
                { id: 'elb7', label: 'فحص مؤشر الشحن (يعمل)', required: false },
                { id: 'elb8', label: 'فحص تاريخ آخر صيانة', required: false }
            ]
        }
    },

    state: {
        currentTab: 'inspections-list', // inspections-list, inspection-records
        filters: {
            category: '',
            result: '',
            dateRange: {
                start: '',
                end: ''
            },
            inspector: ''
        },
        currentView: 'list', // list, form, edit
        currentEditId: null,
        selectedTemplate: null
    },

    async load() {
        const section = document.getElementById('periodic-inspections-section');
        if (!section) {
            if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                Utils.safeWarn('⚠️ قسم periodic-inspections-section غير موجود');
            } else {
                console.warn('⚠️ قسم periodic-inspections-section غير موجود');
            }
            return;
        }

        // Skeleton فوري قبل أي render قد يكون بطيئاً (مهم للاختبار وتجربة المستخدم)
        section.innerHTML = `
            <div class="section-header">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="section-title">
                            <i class="fas fa-clipboard-check ml-3"></i>
                            الفحوصات الدورية
                        </h1>
                        <p class="section-subtitle">جاري التحميل...</p>
                    </div>
                </div>
            </div>
            <div class="mt-6">
                <div class="content-card">
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
            </div>
        `;

        // التأكد من وجود البيانات الأساسية
        try {
            if (!AppState || !AppState.appData) {
                if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                    Utils.safeWarn('⚠️ AppState غير جاهز - جاري الانتظار...');
                } else {
                    console.warn('⚠️ AppState غير جاهز - جاري الانتظار...');
                }
                await new Promise(resolve => {
                    let attempts = 0;
                    const maxAttempts = 50; // 5 ثوان
                    const checkInterval = setInterval(() => {
                        attempts++;
                        if (AppState && AppState.appData) {
                            clearInterval(checkInterval);
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkInterval);
                            if (!AppState) AppState = {};
                            if (!AppState.appData) AppState.appData = {};
                            resolve();
                        }
                    }, 100);
                });
            }
        } catch (error) {
            if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                Utils.safeWarn('⚠️ خطأ في التحقق من AppState:', error);
            } else {
                console.warn('⚠️ خطأ في التحقق من AppState:', error);
            }
            if (!AppState) AppState = {};
            if (!AppState.appData) AppState.appData = {};
        }

        // التأكد من وجود البيانات
        if (!AppState.appData.periodicInspections) {
            AppState.appData.periodicInspections = [];
        }

        // عرض الواجهة أولاً لتحسين تجربة المستخدم
        try {
            // تحميل محتوى الواجهة بشكل آمن مع timeout
            let content = '';
            try {
                const contentPromise = this.renderContent();
                content = await Utils.promiseWithTimeout(
                    contentPromise,
                    10000,
                    () => new Error('Timeout: renderContent took too long')
                );
            } catch (error) {
                if (typeof Utils !== 'undefined' && Utils.safeWarn) {
                    Utils.safeWarn('⚠️ خطأ في تحميل محتوى الواجهة:', error);
                } else {
                    console.warn('⚠️ خطأ في تحميل محتوى الواجهة:', error);
                }
                // عرض محتوى افتراضي مع إمكانية إعادة المحاولة
                content = `
                    <div class="content-card">
                        <div class="card-body">
                            <div class="empty-state">
                                <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                                <p class="text-gray-500 mb-4">حدث خطأ في تحميل البيانات</p>
                                <button onclick="PeriodicInspections.load()" class="btn-primary">
                                    <i class="fas fa-redo ml-2"></i>
                                    إعادة المحاولة
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }

            section.innerHTML = `
            <div class="section-header">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="section-title">
                            <i class="fas fa-clipboard-check ml-3"></i>
                            الفحوصات الدورية
                        </h1>
                        <p class="section-subtitle">تسجيل ومتابعة الفحوصات الدورية للمعدات والمنشآت</p>
                    </div>
                    <div class="flex gap-2">
                        ${this.state.currentView !== 'form' && this.state.currentView !== 'edit' ? `
                            <button id="add-periodic-inspection-btn" class="btn-primary">
                                <i class="fas fa-plus ml-2"></i>
                                إضافة فحص دوري جديد
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>

            ${this.state.currentView !== 'form' && this.state.currentView !== 'edit' ? `
            <!-- Tabs Navigation -->
            <div class="tabs-container mt-6">
                <div class="tabs-nav">
                    <button class="tab-btn ${this.state.currentTab === 'inspections-list' ? 'active' : ''}" data-tab="inspections-list">
                        <i class="fas fa-list ml-2"></i>
                        قائمة الفحوصات
                    </button>
                    <button class="tab-btn ${this.state.currentTab === 'inspection-records' ? 'active' : ''}" data-tab="inspection-records">
                        <i class="fas fa-history ml-2"></i>
                        سجل الفحوصات الدورية
                    </button>
                </div>
            </div>
            ` : ''}

            <div class="mt-6" id="periodic-inspections-content-area">
                ${content}
            </div>
        `;
            // تهيئة الأحداث بعد عرض الواجهة
            try {
                this.setupEventListeners();
            } catch (error) {
                Utils.safeWarn('⚠️ خطأ في setupEventListeners:', error);
            }
            
            // عرض المحتوى فوراً بعد عرض الواجهة (حتى لو كانت البيانات فارغة)
            // هذا يضمن عدم بقاء الواجهة فارغة بعد التحميل
            try {
                const currentTab = this.state?.currentTab || 'inspections-list';
                if (this.state.currentView !== 'form' && this.state.currentView !== 'edit') {
                    // استخدام setTimeout بسيط لضمان أن DOM جاهز
                    setTimeout(async () => {
                        try {
                            let renderContent;
                            if (currentTab === 'inspection-records') {
                                renderContent = await this.renderInspectionRecords();
                            } else {
                                renderContent = await this.renderList();
                            }
                            
                            if (renderContent) {
                                const contentContainer = document.querySelector('#periodic-inspections-section .mt-6');
                                if (contentContainer) {
                                    contentContainer.innerHTML = renderContent;
                                    this.setupEventListeners();
                                }
                            }
                        } catch (error) {
                            Utils.safeWarn('⚠️ خطأ في العرض الأولي:', error);
                        }
                    }, 0);
                }
            } catch (error) {
                Utils.safeWarn('⚠️ خطأ في العرض الأولي:', error);
            }
            
            // تحميل البيانات بشكل غير متزامن بعد عرض الواجهة
            this.loadInspectionDataAsync().then(() => {
                // تحديث الواجهة بعد تحميل البيانات لضمان عرض البيانات المحدثة
                // إعادة تحميل المحتوى بناءً على التبويب الحالي
                if (this.state.currentView !== 'form' && this.state.currentView !== 'edit') {
                    const currentTab = this.state?.currentTab || 'inspections-list';
                    if (currentTab === 'inspection-records') {
                        // تحديث سجل الفحوصات
                        this.renderInspectionRecords().then(content => {
                            if (content) {
                                const contentContainer = document.querySelector('#periodic-inspections-section .mt-6');
                                if (contentContainer) {
                                    contentContainer.innerHTML = content;
                                    this.setupEventListeners();
                                }
                            }
                        }).catch(() => {});
                    } else {
                        // تحديث قائمة الفحوصات
                        this.renderList().then(content => {
                            if (content) {
                                const contentContainer = document.querySelector('#periodic-inspections-section .mt-6');
                                if (contentContainer) {
                                    contentContainer.innerHTML = content;
                                    this.setupEventListeners();
                                }
                            }
                        }).catch(() => {});
                    }
                }
            }).catch(error => {
                Utils.safeWarn('⚠️ تعذر تحميل بيانات الفحوصات الدورية:', error);
                // حتى في حالة الخطأ، تأكد من أن الواجهة معروضة
                if (this.state.currentView !== 'form' && this.state.currentView !== 'edit') {
                    const currentTab = this.state?.currentTab || 'inspections-list';
                    if (currentTab === 'inspection-records') {
                        this.renderInspectionRecords().then(content => {
                            if (content) {
                                const contentContainer = document.querySelector('#periodic-inspections-section .mt-6');
                                if (contentContainer) {
                                    contentContainer.innerHTML = content;
                                    this.setupEventListeners();
                                }
                            }
                        }).catch(() => {});
                    } else {
                        this.renderList().then(content => {
                            if (content) {
                                const contentContainer = document.querySelector('#periodic-inspections-section .mt-6');
                                if (contentContainer) {
                                    contentContainer.innerHTML = content;
                                    this.setupEventListeners();
                                }
                            }
                        }).catch(() => {});
                    }
                }
            });
        } catch (error) {
            if (typeof Utils !== 'undefined' && Utils.safeError) {
                Utils.safeError('❌ خطأ في تحميل مديول الفحوصات الدورية:', error);
            } else {
                console.error('❌ خطأ في تحميل مديول الفحوصات الدورية:', error);
            }
            section.innerHTML = `
                <div class="section-header">
                    <div>
                        <h1 class="section-title">
                            <i class="fas fa-clipboard-check ml-3"></i>
                            الفحوصات الدورية
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
                                <button onclick="PeriodicInspections.load()" class="btn-primary">
                                    <i class="fas fa-redo ml-2"></i>
                                    إعادة المحاولة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            if (typeof Notification !== 'undefined' && Notification.error) {
                Notification.error('حدث خطأ أثناء تحميل الفحوصات الدورية. يُرجى المحاولة مرة أخرى.', { duration: 5000 });
            }
        }
    },

    async loadInspectionDataAsync() {
        try {
            const inspectionResult = await GoogleIntegration.sendRequest({
                action: 'getAllPeriodicInspections',
                data: {}
            }).catch(error => {
                const errorMsg = error.message || error.toString() || '';
                if (errorMsg.includes('انتهت مهلة الاتصال') || errorMsg.includes('timeout')) {
                    Utils.safeWarn('⚠️ انتهت مهلة الاتصال بالخادم');
                    return { success: false, data: [] };
                }
                Utils.safeWarn('⚠️ تعذر تحميل بيانات الفحوصات الدورية:', error);
                return { success: false, data: [] };
            });

            // معالجة نتائج البيانات
            let dataUpdated = false;
            if (inspectionResult && inspectionResult.success && Array.isArray(inspectionResult.data)) {
                // معالجة البيانات المعقدة (تحويل JSON strings إلى كائنات)
                AppState.appData.periodicInspections = inspectionResult.data.map(inspection => {
                    // معالجة checklistResults إذا كانت JSON string
                    if (inspection.checklistResults && typeof inspection.checklistResults === 'string') {
                        try {
                            inspection.checklistResults = JSON.parse(inspection.checklistResults);
                        } catch (e) {
                            Utils.safeWarn('⚠️ خطأ في تحليل checklistResults:', e);
                            inspection.checklistResults = [];
                        }
                    }
                    // التأكد من أن checklistResults هي مصفوفة
                    if (!Array.isArray(inspection.checklistResults)) {
                        inspection.checklistResults = [];
                    }
                    return inspection;
                });
                dataUpdated = true;
                Utils.safeLog(`✅ تم تحميل ${inspectionResult.data.length} فحص دوري من قاعدة البيانات`);
            } else {
                // التأكد من وجود مصفوفة فارغة إذا لم يتم تحميل البيانات
                if (!AppState.appData.periodicInspections) {
                    AppState.appData.periodicInspections = [];
                }
            }
            
            // تحديث الواجهة دائماً بعد التحميل (حتى لو لم يتم تحديث البيانات)
            // هذا يضمن عدم بقاء الواجهة فارغة
            if (this.state.currentView !== 'form' && this.state.currentView !== 'edit') {
                const contentDiv = document.querySelector('#periodic-inspections-section .mt-6');
                if (contentDiv) {
                    try {
                        // ✅ تحميل المحتوى بشكل آمن مع معالجة الأخطاء
                        const updatedContent = await this.renderContent().catch(error => {
                            Utils.safeWarn('⚠️ خطأ في تحديث الواجهة بعد تحميل البيانات:', error);
                            // في حالة الخطأ، عرض رسالة خطأ بدلاً من ترك الواجهة فارغة
                            return `
                                <div class="content-card">
                                    <div class="card-body">
                                        <div class="empty-state">
                                            <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                                            <p class="text-gray-500 mb-4">حدث خطأ في تحديث الواجهة</p>
                                            <button onclick="PeriodicInspections.load()" class="btn-primary">
                                                <i class="fas fa-redo ml-2"></i>
                                                إعادة المحاولة
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        
                        if (updatedContent) {
                            contentDiv.innerHTML = updatedContent;
                            // إعادة تهيئة الأحداث بعد تحديث المحتوى
                            this.setupEventListeners();
                        }
                    } catch (error) {
                        Utils.safeWarn('⚠️ خطأ في تحديث الواجهة بعد تحميل البيانات:', error);
                    }
                }
            }

            // حفظ البيانات محلياً
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            }
        } catch (error) {
            const errorMsg = error.message || error.toString() || '';
            Utils.safeError('❌ خطأ في تحميل بيانات الفحوصات الدورية من قاعدة البيانات:', error);
            
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

    async renderContent() {
        switch (this.state.currentView) {
            case 'form':
            case 'edit':
                return await this.renderForm();
            case 'list':
            default:
                if (this.state.currentTab === 'inspection-records') {
                    return await this.renderInspectionRecords();
                }
                return await this.renderList();
        }
    },

    async renderList() {
        try {
            if (!AppState.appData || !AppState.appData.periodicInspections) {
                return `
                    <div class="content-card">
                        <div class="card-body">
                            <div class="empty-state">
                                <p class="text-gray-500">لا توجد فحوصات دورية مسجلة</p>
                            </div>
                        </div>
                    </div>
                `;
            }
            const inspections = AppState.appData.periodicInspections || [];
            const filteredInspections = this.applyFilters(inspections);
            
            // حساب الإحصائيات
            const stats = this.calculateStatistics(inspections);
            const filteredStats = this.calculateStatistics(filteredInspections);

        return `
            <!-- إحصائيات الفحوصات -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="content-card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                    <div class="card-body">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-green-700 mb-1">مطابق</p>
                                <p class="text-3xl font-bold text-green-800">${stats.compliant}</p>
                                <p class="text-xs text-green-600 mt-1">${stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0}%</p>
                            </div>
                            <div class="bg-green-500 rounded-full p-3">
                                <i class="fas fa-check-circle text-white text-2xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="content-card bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
                    <div class="card-body">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-red-700 mb-1">غير مطابق</p>
                                <p class="text-3xl font-bold text-red-800">${stats.nonCompliant}</p>
                                <p class="text-xs text-red-600 mt-1">${stats.total > 0 ? Math.round((stats.nonCompliant / stats.total) * 100) : 0}%</p>
                            </div>
                            <div class="bg-red-500 rounded-full p-3">
                                <i class="fas fa-times-circle text-white text-2xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="content-card bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                    <div class="card-body">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-orange-700 mb-1">مطابق جزئياً</p>
                                <p class="text-3xl font-bold text-orange-800">${stats.partialCompliant}</p>
                                <p class="text-xs text-orange-600 mt-1">${stats.total > 0 ? Math.round((stats.partialCompliant / stats.total) * 100) : 0}%</p>
                            </div>
                            <div class="bg-orange-500 rounded-full p-3">
                                <i class="fas fa-exclamation-circle text-white text-2xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="content-card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                    <div class="card-body">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-blue-700 mb-1">إجمالي الفحوصات</p>
                                <p class="text-3xl font-bold text-blue-800">${stats.total}</p>
                                <p class="text-xs text-blue-600 mt-1">${filteredStats.total !== stats.total ? `تم التصفية: ${filteredStats.total}` : 'الكل'}</p>
                            </div>
                            <div class="bg-blue-500 rounded-full p-3">
                                <i class="fas fa-clipboard-list text-white text-2xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="content-card">
                <div class="card-header">
                    <div class="flex items-center justify-between">
                        <h3 class="card-title">
                            <i class="fas fa-list ml-2"></i>
                            قائمة الفحوصات الدورية
                            ${filteredStats.total !== stats.total ? `<span class="text-sm font-normal text-gray-500 mr-2">(${filteredStats.total} من ${stats.total})</span>` : ''}
                        </h3>
                        <div class="flex gap-2">
                            ${this.isCurrentUserAdmin() ? `
                                <button id="manage-templates-btn" class="btn-secondary" title="إدارة قوالب الفحص (مدير النظام فقط)">
                                    <i class="fas fa-cog ml-2"></i>
                                    إدارة القوالب
                                </button>
                            ` : ''}
                            <button id="filter-periodic-inspections-btn" class="btn-secondary">
                                <i class="fas fa-filter ml-2"></i>
                                تصفية
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    ${filteredInspections.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-clipboard-check text-4xl text-gray-300 mb-4"></i>
                            <p class="text-gray-500">لا توجد فحوصات دورية مسجلة</p>
                        </div>
                    ` : `
                        <div class="table-wrapper" style="overflow-x: auto;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>رقم الفحص</th>
                                        <th>نوع الفحص</th>
                                        <th>الموقع/المعدة</th>
                                        <th>تاريخ الفحص</th>
                                        <th>المفتش</th>
                                        <th>النتيجة</th>
                                        <th>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filteredInspections.map(inspection => {
                                        const template = inspection.templateId ? this.INSPECTION_TEMPLATES[inspection.templateId] : null;
                                        const categoryDisplay = template ? template.name : (inspection.category || '');
                                        const resultBadgeClass = this.getResultBadgeClass(inspection.result);
                                        const resultIcon = this.getResultIcon(inspection.result);
                                        return `
                                        <tr class="hover:bg-gray-50 transition-colors">
                                            <td class="font-mono font-semibold text-blue-600">${Utils.escapeHTML(inspection.inspectionNumber || inspection.id || '')}</td>
                                            <td>
                                                ${template ? `<i class="fas ${template.icon} ml-1 text-blue-500"></i>` : '<i class="fas fa-clipboard-list ml-1 text-gray-400"></i>'}
                                                <span class="font-medium">${Utils.escapeHTML(categoryDisplay)}</span>
                                            </td>
                                            <td>
                                                <div class="flex items-center gap-2">
                                                    <i class="fas fa-map-marker-alt text-gray-400 text-xs"></i>
                                                    <span>${Utils.escapeHTML(inspection.location || inspection.equipment || '-')}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="flex items-center gap-2">
                                                    <i class="fas fa-calendar text-gray-400 text-xs"></i>
                                                    <span>${inspection.inspectionDate ? Utils.formatDate(inspection.inspectionDate) : '-'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="flex items-center gap-2">
                                                    <i class="fas fa-user text-gray-400 text-xs"></i>
                                                    <span>${Utils.escapeHTML(inspection.inspector || '-')}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span class="badge ${resultBadgeClass} inline-flex items-center gap-1">
                                                    <i class="${resultIcon}"></i>
                                                    ${Utils.escapeHTML(inspection.result || '-')}
                                                </span>
                                            </td>
                                            <td>
                                                <div class="flex items-center gap-2">
                                                    <button onclick="PeriodicInspections.viewInspection('${inspection.id}')" class="btn-icon btn-icon-info hover:scale-110 transition-transform" title="عرض التفاصيل">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                    <button onclick="PeriodicInspections.editInspection('${inspection.id}')" class="btn-icon btn-icon-primary hover:scale-110 transition-transform" title="تعديل">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button onclick="PeriodicInspections.deleteInspection('${inspection.id}')" class="btn-icon btn-icon-danger hover:scale-110 transition-transform" title="حذف">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>
        `;
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في عرض قائمة الفحوصات الدورية:', error);
            return `
                <div class="content-card">
                    <div class="card-body">
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                            <p class="text-gray-500">حدث خطأ في تحميل البيانات</p>
                        </div>
                    </div>
                </div>
            `;
        }
    },

    calculateStatistics(inspections) {
        const stats = {
            total: inspections.length,
            compliant: 0,
            nonCompliant: 0,
            partialCompliant: 0,
            pending: 0
        };

        inspections.forEach(inspection => {
            const result = inspection.result || '';
            if (result === 'مطابق') {
                stats.compliant++;
            } else if (result === 'غير مطابق') {
                stats.nonCompliant++;
            } else if (result === 'مطابق جزئياً') {
                stats.partialCompliant++;
            } else if (result === 'قيد المراجعة') {
                stats.pending++;
            }
        });

        return stats;
    },

    getResultBadgeClass(result) {
        const resultMap = {
            'مطابق': 'badge-success',
            'غير مطابق': 'badge-danger',
            'مطابق جزئياً': 'badge-warning',
            'قيد المراجعة': 'badge-info'
        };
        return resultMap[result] || 'badge-secondary';
    },

    getResultIcon(result) {
        const iconMap = {
            'مطابق': 'fas fa-check-circle',
            'غير مطابق': 'fas fa-times-circle',
            'مطابق جزئياً': 'fas fa-exclamation-circle',
            'قيد المراجعة': 'fas fa-clock'
        };
        return iconMap[result] || 'fas fa-question-circle';
    },

    isCurrentUserAdmin() {
        if (typeof Permissions !== 'undefined' && typeof Permissions.isCurrentUserAdmin === 'function') {
            return Permissions.isCurrentUserAdmin();
        }
        const userRole = (AppState.currentUser?.role || '').toLowerCase();
        return userRole === 'admin' || userRole === 'مدير' || userRole === 'مدير النظام';
    },

    applyFilters(inspections) {
        let filtered = [...inspections];

        if (this.state.filters.category) {
            filtered = filtered.filter(i => i.category === this.state.filters.category);
        }

        if (this.state.filters.result) {
            filtered = filtered.filter(i => i.result === this.state.filters.result);
        }

        if (this.state.filters.inspector) {
            filtered = filtered.filter(i => i.inspector === this.state.filters.inspector);
        }

        if (this.state.filters.dateRange.start) {
            filtered = filtered.filter(i => {
                const date = new Date(i.inspectionDate);
                return date >= new Date(this.state.filters.dateRange.start);
            });
        }

        if (this.state.filters.dateRange.end) {
            filtered = filtered.filter(i => {
                const date = new Date(i.inspectionDate);
                return date <= new Date(this.state.filters.dateRange.end);
            });
        }

        return filtered;
    },

    updateChecklistProgress() {
        const progressBar = document.getElementById('checklist-progress');
        const progressText = document.getElementById('checklist-progress-text');
        if (!progressBar) return;

        const checkboxes = document.querySelectorAll('[id^="checklist-"]:not([id*="note"])');
        const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
        const total = checkboxes.length;
        const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
        
        progressBar.style.width = percentage + '%';
        
        // تحديث النص المئوي
        if (progressText) {
            progressText.textContent = percentage + '%';
        }
        
        // تحديث اللون حسب النسبة
        if (percentage === 100) {
            progressBar.style.background = 'linear-gradient(90deg, #10b981, #059669)';
        } else if (percentage >= 50) {
            progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, #3b82f6, #8b5cf6)';
        }
    },

    // الحصول على قائمة المواقع (المصانع) من قاعدة البيانات
    getSiteOptions() {
        try {
            // محاولة الحصول من Permissions.formSettingsState
            if (typeof Permissions !== 'undefined' && Permissions.formSettingsState && Permissions.formSettingsState.sites) {
                return Permissions.formSettingsState.sites.map(site => ({
                    id: site.id,
                    name: site.name
                }));
            }

            // محاولة الحصول من AppState.appData.observationSites
            if (Array.isArray(AppState.appData?.observationSites) && AppState.appData.observationSites.length > 0) {
                return AppState.appData.observationSites.map(site => ({
                    id: site.id || site.siteId || Utils.generateId('SITE'),
                    name: site.name || site.title || site.label || 'موقع غير محدد'
                }));
            }

            // محاولة الحصول من DailyObservations
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

            const sites = this.getSiteOptions();
            const selectedSite = sites.find(s => s.id === siteId);
            if (!selectedSite) return [];

            // محاولة الحصول من Permissions.formSettingsState
            if (typeof Permissions !== 'undefined' && Permissions.formSettingsState && Permissions.formSettingsState.sites) {
                const site = Permissions.formSettingsState.sites.find(s => s.id === siteId);
                if (site && Array.isArray(site.places)) {
                    return site.places.map(place => ({
                        id: place.id,
                        name: place.name
                    }));
                }
            }

            // محاولة الحصول من AppState.appData.observationSites
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

            // محاولة الحصول من DailyObservations
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

    toggleNoteField(itemId) {
        const statusSelect = document.getElementById(`checklist-status-${itemId}`);
        const noteWrapper = document.getElementById(`checklist-note-wrapper-${itemId}`);
        if (statusSelect && noteWrapper) {
            if (statusSelect.value === 'غير مطابق') {
                noteWrapper.style.display = 'block';
            } else {
                noteWrapper.style.display = 'none';
                // مسح الملاحظة إذا لم يكن "غير مطابق"
                const noteTextarea = document.getElementById(`checklist-note-${itemId}`);
                if (noteTextarea) {
                    noteTextarea.value = '';
                }
            }
        }
    },

    updateResultBadge(result) {
        const badgePreview = document.getElementById('result-badge-preview');
        if (!badgePreview || !result) {
            if (badgePreview) badgePreview.innerHTML = '';
            return;
        }

        const badgeClass = this.getResultBadgeClass(result);
        const icon = this.getResultIcon(result);
        badgePreview.innerHTML = `
            <span class="badge ${badgeClass} inline-flex items-center gap-2 px-3 py-1.5">
                <i class="${icon}"></i>
                <span class="font-medium">${result}</span>
            </span>
        `;
    },

    setupEventListeners() {
        setTimeout(() => {
            // إعداد التبويبات
            this.setupTabsNavigation();

            const addBtn = document.getElementById('add-periodic-inspection-btn');
            if (addBtn) {
                addBtn.addEventListener('click', () => {
                    this.showFormModal();
                });
            }

            const filterBtn = document.getElementById('filter-periodic-inspections-btn');
            if (filterBtn) {
                filterBtn.addEventListener('click', () => this.showFilterModal());
            }

            const manageTemplatesBtn = document.getElementById('manage-templates-btn');
            if (manageTemplatesBtn && this.isCurrentUserAdmin()) {
                manageTemplatesBtn.addEventListener('click', () => this.showTemplateManagement());
            }

            // إعداد معالج إرسال النموذج
            const form = document.getElementById('periodic-inspection-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleFormSubmit();
                });
            }

            // تحديث معاينة النتيجة عند التحميل
            const resultSelect = document.getElementById('inspection-result');
            if (resultSelect) {
                this.updateResultBadge(resultSelect.value);
                resultSelect.addEventListener('change', (e) => {
                    this.updateResultBadge(e.target.value);
                });
            }

            // تحديث شريط التقدم عند تحميل النموذج
            setTimeout(() => {
                this.updateChecklistProgress();
            }, 200);
        }, 100);
    },

    async handleFormSubmit() {
        const form = document.getElementById('periodic-inspection-form');
        if (!form) return;

        // منع النقر المتكرر
        const submitBtn = form?.querySelector('button[type="submit"]');
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

        try {
            const templateId = document.getElementById('inspection-template')?.value || '';
            const template = templateId ? this.INSPECTION_TEMPLATES[templateId] : null;
            
            // جمع بيانات القائمة
            const checklistResults = [];
            if (template && template.checklist) {
                template.checklist.forEach(item => {
                    const checkbox = document.getElementById(`checklist-${item.id}`);
                    const statusSelect = document.getElementById(`checklist-status-${item.id}`);
                    const noteTextarea = document.getElementById(`checklist-note-${item.id}`);
                    checklistResults.push({
                        id: item.id,
                        label: item.label,
                        checked: checkbox ? checkbox.checked : false,
                        status: statusSelect ? statusSelect.value : '',
                        note: noteTextarea ? noteTextarea.value.trim() : '',
                        required: item.required
                    });
                });
            }

            // جمع بيانات المصنع والموقع الفرعي
            const factoryId = document.getElementById('inspection-factory')?.value || '';
            const subLocationId = document.getElementById('inspection-sub-location')?.value || '';
            const sites = this.getSiteOptions();
            const selectedSite = sites.find(s => s.id === factoryId);
            const places = this.getPlaceOptions(factoryId);
            const selectedPlace = places.find(p => p.id === subLocationId);

            // جمع بيانات النموذج
            const inspectionData = {
                id: this.state.currentEditId || Utils.generateId('PINSP'),
                templateId: templateId,
                category: document.getElementById('inspection-category')?.value || '',
                inspectionDate: document.getElementById('inspection-date')?.value || '',
                location: document.getElementById('inspection-location')?.value || '',
                inspector: document.getElementById('inspection-inspector')?.value || '',
                result: document.getElementById('inspection-result')?.value || '',
                assetCode: document.getElementById('inspection-asset-code')?.value || '',
                factory: factoryId,
                factoryId: factoryId,
                factoryName: selectedSite ? selectedSite.name : '',
                subLocation: subLocationId,
                subLocationId: subLocationId,
                subLocationName: selectedPlace ? selectedPlace.name : '',
                notes: document.getElementById('inspection-notes')?.value || '',
                correctiveActions: document.getElementById('inspection-corrective-actions')?.value || '',
                checklistResults: checklistResults,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // التحقق من الحقول المطلوبة
            if (!inspectionData.category || !inspectionData.inspectionDate || !inspectionData.location || !inspectionData.inspector || !inspectionData.result) {
                Notification.error('يرجى ملء جميع الحقول المطلوبة');
                // استعادة الزر عند فشل التحقق
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
                return;
            }

            // التحقق من القائمة المطلوبة
            if (template && template.checklist) {
                const requiredItems = template.checklist.filter(item => item.required);
                const uncheckedRequired = requiredItems.filter(item => {
                    const result = checklistResults.find(r => r.id === item.id);
                    return !result || !result.checked;
                });
                
                if (uncheckedRequired.length > 0) {
                    Notification.warning(`يرجى التأكد من إكمال جميع العناصر المطلوبة في قائمة الفحص (${uncheckedRequired.length} عنصر)`);
                    // استعادة الزر عند فشل التحقق
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                    }
                    return;
                }
            }

            // حفظ البيانات
            if (!AppState.appData.periodicInspections) {
                AppState.appData.periodicInspections = [];
            }

            if (this.state.currentEditId) {
                const index = AppState.appData.periodicInspections.findIndex(i => i.id === this.state.currentEditId);
                if (index !== -1) {
                    AppState.appData.periodicInspections[index] = { ...AppState.appData.periodicInspections[index], ...inspectionData };
                }
            } else {
                inspectionData.inspectionNumber = `PIN-${Date.now()}`;
                AppState.appData.periodicInspections.push(inspectionData);
            }

            // حفظ في قاعدة البيانات
            try {
                let result;
                if (this.state.currentEditId) {
                    // تحديث فحص موجود
                    result = await GoogleIntegration.sendRequest({
                        action: 'updatePeriodicInspection',
                        data: {
                            inspectionId: this.state.currentEditId,
                            updateData: inspectionData
                        }
                    });
                } else {
                    // إضافة فحص جديد
                    result = await GoogleIntegration.sendRequest({
                        action: 'addPeriodicInspection',
                        data: inspectionData
                    });
                }
                
                if (result && result.success) {
                    Notification.success(this.state.currentEditId ? 'تم تحديث الفحص بنجاح' : 'تم إضافة الفحص بنجاح');
                } else {
                    Notification.warning('تم حفظ البيانات محلياً، لكن حدث خطأ في الاتصال بالخادم');
                }
            } catch (error) {
                Utils.safeWarn('⚠️ خطأ في حفظ البيانات في قاعدة البيانات:', error);
                Notification.warning('تم حفظ البيانات محلياً فقط');
            }

            // حفظ محلياً
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            }

            // استعادة الزر بعد النجاح
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }

            // إغلاق modal والعودة إلى القائمة
            const modal = document.querySelector('.modal-overlay');
            if (modal) {
                modal.remove();
            }
            this.state.currentView = 'list';
            this.state.currentEditId = null;
            this.state.selectedTemplate = null;
            this.load();

        } catch (error) {
            Utils.safeError('❌ خطأ في حفظ الفحص:', error);
            Notification.error('حدث خطأ أثناء حفظ الفحص');
            
            // استعادة الزر في حالة الخطأ
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    },

    async showFilterModal() {
        // جمع جميع أنواع الفحوصات من القوالب والفحوصات الموجودة
        const allCategories = new Set();
        Object.values(this.INSPECTION_TEMPLATES).forEach(template => {
            allCategories.add(template.name);
        });
        if (AppState.appData && AppState.appData.periodicInspections) {
            AppState.appData.periodicInspections.forEach(inspection => {
                if (inspection.category) allCategories.add(inspection.category);
            });
        }

        const categoryOptions = Array.from(allCategories).sort().map(cat => 
            `<option value="${Utils.escapeHTML(cat)}" ${this.state.filters.category === cat ? 'selected' : ''}>${Utils.escapeHTML(cat)}</option>`
        ).join('');

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <h2 class="modal-title text-white">
                        <i class="fas fa-filter ml-2"></i>
                        تصفية الفحوصات الدورية
                    </h2>
                    <button class="modal-close text-white hover:bg-white/20" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="filter-form" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <i class="fas fa-tag text-blue-500"></i>
                                    نوع الفحص
                                </label>
                                <select id="filter-category" class="form-input border-2">
                                    <option value="">الكل</option>
                                    ${categoryOptions}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <i class="fas fa-flag-checkered text-blue-500"></i>
                                    النتيجة
                                </label>
                                <select id="filter-result" class="form-input border-2">
                                    <option value="">الكل</option>
                                    <option value="مطابق" ${this.state.filters.result === 'مطابق' ? 'selected' : ''}>مطابق</option>
                                    <option value="غير مطابق" ${this.state.filters.result === 'غير مطابق' ? 'selected' : ''}>غير مطابق</option>
                                    <option value="مطابق جزئياً" ${this.state.filters.result === 'مطابق جزئياً' ? 'selected' : ''}>مطابق جزئياً</option>
                                    <option value="قيد المراجعة" ${this.state.filters.result === 'قيد المراجعة' ? 'selected' : ''}>قيد المراجعة</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <i class="fas fa-calendar text-blue-500"></i>
                                    من تاريخ
                                </label>
                                <input type="date" id="filter-date-start" class="form-input border-2" value="${this.state.filters.dateRange.start || ''}">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <i class="fas fa-calendar-check text-blue-500"></i>
                                    إلى تاريخ
                                </label>
                                <input type="date" id="filter-date-end" class="form-input border-2" value="${this.state.filters.dateRange.end || ''}">
                            </div>
                        </div>
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p class="text-xs text-blue-800 flex items-center gap-2">
                                <i class="fas fa-info-circle"></i>
                                استخدم التصفية للعثور على الفحوصات المحددة بسرعة
                            </p>
                        </div>
                        <div class="flex items-center justify-end gap-4 pt-4 border-t">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                                <i class="fas fa-times ml-2"></i>
                                إلغاء
                            </button>
                            <button type="button" class="btn-secondary" onclick="PeriodicInspections.clearFilters(); this.closest('.modal-overlay').remove();">
                                <i class="fas fa-eraser ml-2"></i>
                                مسح التصفية
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-filter ml-2"></i>
                                تطبيق التصفية
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const form = modal.querySelector('#filter-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.state.filters.category = document.getElementById('filter-category').value;
            this.state.filters.result = document.getElementById('filter-result').value;
            this.state.filters.dateRange.start = document.getElementById('filter-date-start').value;
            this.state.filters.dateRange.end = document.getElementById('filter-date-end').value;
            modal.remove();
            this.load();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    clearFilters() {
        this.state.filters = {
            category: '',
            result: '',
            dateRange: {
                start: '',
                end: ''
            },
            inspector: ''
        };
        this.load();
    },

    async renderForm() {
        const inspection = this.state.currentEditId
            ? (AppState.appData.periodicInspections || []).find(i => i.id === this.state.currentEditId)
            : null;

        // معالجة checklistResults إذا كانت JSON string
        if (inspection && inspection.checklistResults && typeof inspection.checklistResults === 'string') {
            try {
                inspection.checklistResults = JSON.parse(inspection.checklistResults);
            } catch (e) {
                Utils.safeWarn('⚠️ خطأ في تحليل checklistResults:', e);
                inspection.checklistResults = [];
            }
        }
        if (inspection && !Array.isArray(inspection.checklistResults)) {
            inspection.checklistResults = [];
        }

        // تحديد القالب المختار
        const selectedTemplateId = this.state.selectedTemplate || inspection?.templateId || '';
        const selectedTemplate = selectedTemplateId ? this.INSPECTION_TEMPLATES[selectedTemplateId] : null;

        // إنشاء خيارات القوالب
        const templateOptions = Object.values(this.INSPECTION_TEMPLATES).map(template => 
            `<option value="${template.id}" ${selectedTemplateId === template.id ? 'selected' : ''}>
                ${template.name}
            </option>`
        ).join('');

        // إنشاء قائمة الفحص إذا كان هناك قالب مختار
        let checklistHtml = '';
        if (selectedTemplate && selectedTemplate.checklist) {
            const totalItems = selectedTemplate.checklist.length;
            const requiredItems = selectedTemplate.checklist.filter(item => item.required).length;
            checklistHtml = `
                <div class="mt-6 border-t pt-6">
                    <div class="bg-white border-2 border-blue-100 rounded-xl p-5 mb-4 shadow-sm hover:shadow-md transition-shadow">
                        <div class="flex items-center justify-between flex-wrap gap-4">
                            <div class="flex items-center gap-4 flex-1 min-w-0">
                                <div class="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                                    <i class="fas ${selectedTemplate.icon} text-white text-lg"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4 class="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                                        <span>قائمة فحص ${selectedTemplate.name}</span>
                                    </h4>
                                    <div class="flex items-center gap-3 flex-wrap text-sm text-gray-600">
                                        <span class="flex items-center gap-1">
                                            <i class="fas fa-list-ul text-blue-500 text-xs"></i>
                                            <span class="font-medium text-gray-700">${totalItems}</span>
                                            <span class="text-gray-500">عنصر</span>
                                        </span>
                                        <span class="text-gray-300">|</span>
                                        <span class="flex items-center gap-1">
                                            <i class="fas fa-exclamation-circle text-red-500 text-xs"></i>
                                            <span class="font-medium text-red-600">${requiredItems}</span>
                                            <span class="text-gray-500">مطلوب</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="text-right">
                                    <p class="text-xs font-medium text-gray-600 mb-2">حالة الإكمال</p>
                                    <div class="flex items-center gap-2">
                                        <div class="progress-bar-container" style="width: 120px; height: 10px; background: #e5e7eb; border-radius: 5px; overflow: hidden;">
                                            <div class="progress-bar-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 5px; transition: width 0.3s ease;" id="checklist-progress"></div>
                                        </div>
                                        <span class="text-xs font-bold text-gray-700" id="checklist-progress-text">0%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-3">
                        ${selectedTemplate.checklist.map((item, index) => {
                            const isChecked = inspection?.checklistResults?.find(r => r.id === item.id && r.checked);
                            return `
                            <div class="group relative flex items-start gap-3 p-4 bg-white rounded-xl border ${isChecked ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-gray-200 bg-white'} hover:border-blue-300 hover:shadow-lg transition-all duration-300 ${isChecked ? 'shadow-sm' : ''}">
                                <div class="flex items-center pt-1 flex-shrink-0">
                                    <input type="checkbox" 
                                           id="checklist-${item.id}" 
                                           name="checklist-${item.id}"
                                           class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
                                           ${isChecked ? 'checked' : ''}
                                           onchange="PeriodicInspections.updateChecklistProgress()">
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-start justify-between gap-3 mb-2">
                                        <label for="checklist-${item.id}" class="text-sm font-medium text-gray-800 cursor-pointer flex-1 min-w-0 flex items-start gap-2">
                                            <span class="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-md ${isChecked ? 'bg-green-500 text-white' : 'bg-blue-50 text-blue-700'} text-xs font-bold leading-none flex-shrink-0 transition-colors">${index + 1}</span>
                                            <span class="break-words flex-1 ${isChecked ? 'text-gray-700' : 'text-gray-800'}">${Utils.escapeHTML(item.label)}</span>
                                            ${item.required ? '<span class="text-red-500 mr-1 font-bold flex-shrink-0 text-base" title="عنصر مطلوب">*</span>' : ''}
                                        </label>
                                        ${isChecked ? '<div class="flex-shrink-0"><i class="fas fa-check-circle text-green-500 text-lg"></i></div>' : ''}
                                    </div>
                                    <div class="mt-3 space-y-2">
                                        <div>
                                            <select 
                                                id="checklist-status-${item.id}"
                                                name="checklist-status-${item.id}"
                                                class="form-input text-sm w-full border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                                                onchange="PeriodicInspections.toggleNoteField('${item.id}')">
                                                <option value="">-- اختر الحالة --</option>
                                                <option value="مطابق" ${inspection?.checklistResults?.find(r => r.id === item.id)?.status === 'مطابق' ? 'selected' : ''}>مطابق</option>
                                                <option value="غير مطابق" ${inspection?.checklistResults?.find(r => r.id === item.id)?.status === 'غير مطابق' ? 'selected' : ''}>غير مطابق</option>
                                                <option value="أخرى" ${inspection?.checklistResults?.find(r => r.id === item.id)?.status === 'أخرى' ? 'selected' : ''}>أخرى</option>
                                            </select>
                                        </div>
                                        <div id="checklist-note-wrapper-${item.id}" style="display: ${inspection?.checklistResults?.find(r => r.id === item.id)?.status === 'غير مطابق' ? 'block' : 'none'};">
                                            <textarea 
                                                id="checklist-note-${item.id}"
                                                name="checklist-note-${item.id}"
                                                class="form-input text-xs w-full border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all" 
                                                rows="1"
                                                placeholder="أضف ملاحظة (اختياري)">${inspection?.checklistResults?.find(r => r.id === item.id)?.note || ''}</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        return `
            <div class="content-card" style="border: none; box-shadow: none; margin: 0;">
                <div class="card-body" style="padding: 1.5rem;">
                    <form id="periodic-inspection-form" class="space-y-6">
                        <div class="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
                            <div class="flex items-start gap-3 mb-3">
                                <div class="bg-blue-500 rounded-lg p-2">
                                    <i class="fas fa-clipboard-list text-white text-xl"></i>
                                </div>
                                <div class="flex-1">
                                    <label class="block text-base font-bold text-gray-800 mb-2">
                                        اختر نموذج الفحص الجاهز <span class="text-red-500">*</span>
                                    </label>
                                    <select id="inspection-template" required class="form-input text-base font-medium border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                                            onchange="PeriodicInspections.onTemplateChange(this.value)">
                                        <option value="">-- اختر نموذج الفحص من القائمة --</option>
                                        ${templateOptions}
                                    </select>
                                    <p class="text-sm text-gray-600 mt-3 flex items-center gap-2">
                                        <i class="fas fa-info-circle text-blue-500"></i>
                                        اختر نوع المعدة أو الفحص من القائمة أعلاه لعرض قائمة الفحص المخصصة
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div class="space-y-1">
                                <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <i class="fas fa-tag text-blue-500"></i>
                                    نوع الفحص <span class="text-red-500">*</span>
                                </label>
                                <input type="text" id="inspection-category" required class="form-input border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    value="${selectedTemplate ? Utils.escapeHTML(selectedTemplate.name) : Utils.escapeHTML(inspection?.category || '')}"
                                    placeholder="سيتم ملؤه تلقائياً عند اختيار النموذج" readonly>
                            </div>
                            <div class="space-y-1">
                                <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <i class="fas fa-calendar-alt text-blue-500"></i>
                                    تاريخ الفحص <span class="text-red-500">*</span>
                                </label>
                                <input type="date" id="inspection-date" required class="form-input border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    value="${inspection?.inspectionDate ? new Date(inspection.inspectionDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}">
                            </div>
                            <div class="space-y-1">
                                <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <i class="fas fa-map-marker-alt text-blue-500"></i>
                                    الموقع/المعدة <span class="text-red-500">*</span>
                                </label>
                                <input type="text" id="inspection-location" required class="form-input border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    value="${Utils.escapeHTML(inspection?.location || inspection?.equipment || '')}"
                                    placeholder="أدخل الموقع أو المعدة">
                            </div>
                            <div class="space-y-1">
                                <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <i class="fas fa-user-check text-blue-500"></i>
                                    المفتش <span class="text-red-500">*</span>
                                </label>
                                <input type="text" id="inspection-inspector" required class="form-input border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    value="${Utils.escapeHTML(inspection?.inspector || '')}"
                                    placeholder="اسم المفتش">
                            </div>
                            <div class="space-y-1">
                                <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <i class="fas fa-flag-checkered text-blue-500"></i>
                                    النتيجة <span class="text-red-500">*</span>
                                </label>
                                <select id="inspection-result" required class="form-input border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                                        onchange="PeriodicInspections.updateResultBadge(this.value)">
                                    <option value="">-- اختر النتيجة --</option>
                                    <option value="مطابق" ${inspection?.result === 'مطابق' ? 'selected' : ''}>مطابق</option>
                                    <option value="غير مطابق" ${inspection?.result === 'غير مطابق' ? 'selected' : ''}>غير مطابق</option>
                                    <option value="مطابق جزئياً" ${inspection?.result === 'مطابق جزئياً' ? 'selected' : ''}>مطابق جزئياً</option>
                                    <option value="قيد المراجعة" ${inspection?.result === 'قيد المراجعة' ? 'selected' : ''}>قيد المراجعة</option>
                                </select>
                                <div id="result-badge-preview" class="mt-2"></div>
                            </div>
                            <div class="space-y-1">
                                <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <i class="fas fa-industry text-blue-500"></i>
                                    المصنع
                                </label>
                                <select id="inspection-factory" class="form-input border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                                    <option value="">-- اختر المصنع --</option>
                                    ${this.getSiteOptions().map(site => {
                                        const isSelected = inspection && (inspection.factoryId === site.id || inspection.factoryId === String(site.id) || (inspection.factory === site.id && !inspection.factoryId) || inspection.factory === site.name);
                                        return `<option value="${site.id}" ${isSelected ? 'selected' : ''}>${Utils.escapeHTML(site.name)}</option>`;
                                    }).join('')}
                                </select>
                            </div>
                            <div class="space-y-1">
                                <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <i class="fas fa-map-marker-alt text-blue-500"></i>
                                    الموقع الفرعي
                                </label>
                                <select id="inspection-sub-location" class="form-input border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                                    <option value="">-- اختر الموقع الفرعي --</option>
                                    ${(() => {
                                        const factoryId = inspection?.factoryId || inspection?.factory || '';
                                        const places = this.getPlaceOptions(factoryId);
                                        return places.map(place => {
                                            const isSelected = inspection && (inspection.subLocationId === place.id || inspection.subLocationId === String(place.id) || (inspection.subLocation === place.id && !inspection.subLocationId) || inspection.subLocation === place.name);
                                            return `<option value="${place.id}" ${isSelected ? 'selected' : ''}>${Utils.escapeHTML(place.name)}</option>`;
                                        }).join('');
                                    })()}
                                </select>
                            </div>
                            <div class="space-y-1">
                                <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <i class="fas fa-barcode text-blue-500"></i>
                                    رقم المعدة / الكود
                                </label>
                                <input type="text" id="inspection-asset-code" class="form-input border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    value="${Utils.escapeHTML(inspection?.assetCode || '')}"
                                    placeholder="رقم أو كود المعدة (اختياري)">
                            </div>
                        </div>
                        
                        ${checklistHtml}
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">ملاحظات عامة</label>
                            <textarea id="inspection-notes" class="form-input" rows="2"
                                placeholder="ملاحظات إضافية أو توصيات">${Utils.escapeHTML(inspection?.notes || '')}</textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">الإجراءات التصحيحية المطلوبة</label>
                            <textarea id="inspection-corrective-actions" class="form-input" rows="3"
                                placeholder="في حالة وجود عدم مطابقة، اذكر الإجراءات التصحيحية المطلوبة">${Utils.escapeHTML(inspection?.correctiveActions || '')}</textarea>
                        </div>

                        <div class="flex items-center justify-between gap-4 pt-4 border-t">
                            <div class="flex items-center gap-2">
                                <button type="button" class="btn-secondary" onclick="PeriodicInspections.printInspection()" title="طباعة الفحص">
                                    <i class="fas fa-print ml-2"></i>
                                    طباعة
                                </button>
                                <button type="button" class="btn-secondary" onclick="PeriodicInspections.exportInspection()" title="تصدير الفحص">
                                    <i class="fas fa-file-export ml-2"></i>
                                    تصدير
                                </button>
                            </div>
                            <div class="flex items-center gap-2">
                                <button type="button" class="btn-secondary" onclick="PeriodicInspections.cancelForm()">إلغاء</button>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-save ml-2"></i>
                                    ${inspection ? 'حفظ التعديلات' : 'حفظ الفحص'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    async showFormModal(inspectionId = null) {
        try {
            if (typeof Permissions !== 'undefined' && typeof Permissions.ensureFormSettingsState === 'function') {
                await Permissions.ensureFormSettingsState();
            }
        } catch (e) {
            // متابعة عرض النموذج حتى مع فشل التحميل
        }
        // إزالة أي modal موجود مسبقاً
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        // تعيين حالة التعديل أو الإضافة
        this.state.currentEditId = inspectionId;
        this.state.selectedTemplate = inspectionId 
            ? (AppState.appData.periodicInspections || []).find(i => i.id === inspectionId)?.templateId || null
            : null;

        // إنشاء modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        // الحصول على محتوى النموذج
        const formHtml = await this.renderForm();
        
        const inspection = inspectionId 
            ? (AppState.appData.periodicInspections || []).find(i => i.id === inspectionId)
            : null;

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1200px; max-height: 95vh; overflow-y: auto;">
                <div class="modal-header bg-white border-b-2 border-gray-200" style="position: relative; z-index: 10;">
                    <h2 class="modal-title" style="color: #1e293b !important; font-weight: 700;">
                        <i class="fas fa-${inspection ? 'edit' : 'plus-circle'} ml-2 text-blue-600"></i>
                        ${inspection ? 'تعديل فحص دوري' : 'إضافة فحص دوري جديد'}
                    </h2>
                    <button class="modal-close text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors" onclick="PeriodicInspections.cancelForm()" style="color: #4b5563 !important;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding: 0;">
                    ${formHtml}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // إعداد الأحداث
        this.setupFormEventListeners(modal);

        // إغلاق modal عند النقر خارج المحتوى
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.cancelForm();
            }
        });

        // إغلاق modal عند الضغط على ESC
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.cancelForm();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    },

    setupFormEventListeners(modal) {
        // إعداد معالج إرسال النموذج
        const form = modal.querySelector('#periodic-inspection-form');
        if (form) {
            // إزالة المستمعين السابقين
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }

        // ربط المصنع بالموقع الفرعي
        const factorySelect = modal.querySelector('#inspection-factory');
        const subLocationSelect = modal.querySelector('#inspection-sub-location');
        if (factorySelect && subLocationSelect) {
            factorySelect.addEventListener('change', () => {
                const factoryId = factorySelect.value;
                const places = this.getPlaceOptions(factoryId);

                // مسح الخيارات الحالية
                subLocationSelect.innerHTML = '<option value="">-- اختر الموقع الفرعي --</option>';

                // إضافة الأماكن الجديدة
                places.forEach(place => {
                    const option = document.createElement('option');
                    option.value = place.id;
                    option.textContent = place.name;
                    subLocationSelect.appendChild(option);
                });
            });
        }

        // تحديث معاينة النتيجة
        const resultSelect = modal.querySelector('#inspection-result');
        if (resultSelect) {
            this.updateResultBadge(resultSelect.value);
            resultSelect.addEventListener('change', (e) => {
                this.updateResultBadge(e.target.value);
            });
        }

        // ربط أحداث قوائم المطابقة
        const statusSelects = modal.querySelectorAll('[id^="checklist-status-"]');
        statusSelects.forEach(select => {
            const itemId = select.id.replace('checklist-status-', '');
            // إزالة event listener القديم إذا كان موجوداً
            const newSelect = select.cloneNode(true);
            select.parentNode.replaceChild(newSelect, select);
            newSelect.addEventListener('change', () => {
                this.toggleNoteField(itemId);
            });
            // التأكد من إظهار/إخفاء حقل الملاحظات عند التحميل
            if (newSelect.value === 'غير مطابق') {
                const noteWrapper = modal.querySelector(`#checklist-note-wrapper-${itemId}`);
                if (noteWrapper) {
                    noteWrapper.style.display = 'block';
                }
            }
        });

        // تحديث شريط التقدم
        setTimeout(() => {
            this.updateChecklistProgress();
        }, 200);

        // تحديث زر الإلغاء
        const cancelBtn = modal.querySelector('button[onclick*="cancelForm"]');
        if (cancelBtn) {
            cancelBtn.onclick = () => this.cancelForm();
        }
    },

    async onTemplateChange(templateId) {
        this.state.selectedTemplate = templateId;
        const template = this.INSPECTION_TEMPLATES[templateId];
        if (template) {
            // تحديث نوع الفحص تلقائياً
            const categoryInput = document.getElementById('inspection-category');
            if (categoryInput) {
                categoryInput.value = template.name;
            }
        }
        // إعادة عرض النموذج في modal
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                const formHtml = await this.renderForm();
                modalBody.innerHTML = formHtml;
                // إعادة ربط الأحداث
                this.setupFormEventListeners(modal);
            }
        }
    },

    cancelForm() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
        this.state.currentView = 'list';
        this.state.currentEditId = null;
        this.state.selectedTemplate = null;
    },

    async showTemplateManagement() {
        if (!this.isCurrentUserAdmin()) {
            Notification.error('ليس لديك صلاحية للوصول إلى هذه الصفحة. يجب أن تكون مدير النظام.');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                    <h2 class="modal-title text-white">
                        <i class="fas fa-cog ml-2"></i>
                        إدارة قوالب الفحوصات الدورية
                    </h2>
                    <button class="modal-close text-white hover:bg-white/20" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p class="text-sm text-blue-800 flex items-center gap-2">
                            <i class="fas fa-info-circle"></i>
                            يمكنك هنا إضافة، تعديل، أو حذف قوالب الفحوصات الجاهزة. القوالب تساعد في تسريع عملية الفحص من خلال توفير قوائم فحص مخصصة لكل نوع من المعدات.
                        </p>
                    </div>
                    <div class="flex justify-end mb-4">
                        <button id="add-template-btn" class="btn-primary">
                            <i class="fas fa-plus ml-2"></i>
                            إضافة قالب جديد
                        </button>
                    </div>
                    <div class="space-y-4">
                        ${Object.values(this.INSPECTION_TEMPLATES).map(template => `
                            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div class="flex items-start justify-between mb-3">
                                    <div class="flex items-center gap-3">
                                        <div class="bg-blue-100 rounded-lg p-2">
                                            <i class="fas ${template.icon} text-blue-600 text-xl"></i>
                                        </div>
                                        <div>
                                            <h3 class="text-lg font-bold text-gray-800">${Utils.escapeHTML(template.name)}</h3>
                                            <p class="text-sm text-gray-600 mt-1">
                                                <span class="font-medium">${template.checklist?.length || 0}</span> عنصر في قائمة الفحص
                                                <span class="mx-2">•</span>
                                                <span class="font-medium text-red-600">${template.checklist?.filter(item => item.required).length || 0}</span> عنصر مطلوب
                                            </p>
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <button onclick="PeriodicInspections.editTemplate('${template.id}')" class="btn-icon btn-icon-primary" title="تعديل">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="PeriodicInspections.deleteTemplate('${template.id}')" class="btn-icon btn-icon-danger" title="حذف">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="mt-3 pt-3 border-t border-gray-200">
                                    <p class="text-xs text-gray-500 mb-2 font-medium">عناصر قائمة الفحص:</p>
                                    <div class="flex flex-wrap gap-2">
                                        ${(template.checklist || []).slice(0, 5).map(item => `
                                            <span class="text-xs px-2 py-1 bg-gray-100 rounded border ${item.required ? 'border-red-200 text-red-700' : 'border-gray-200'}">
                                                ${Utils.escapeHTML(item.label.substring(0, 30))}${item.label.length > 30 ? '...' : ''}
                                                ${item.required ? ' <span class="text-red-500">*</span>' : ''}
                                            </span>
                                        `).join('')}
                                        ${(template.checklist || []).length > 5 ? `
                                            <span class="text-xs px-2 py-1 bg-gray-100 rounded border border-gray-200 text-gray-600">
                                                +${(template.checklist || []).length - 5} عنصر آخر
                                            </span>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إغلاق</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const addBtn = modal.querySelector('#add-template-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                modal.remove();
                this.showAddEditTemplateModal();
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async showAddEditTemplateModal(templateId = null) {
        const template = templateId ? this.INSPECTION_TEMPLATES[templateId] : null;
        const isEdit = !!template;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <h2 class="modal-title text-white">
                        <i class="fas fa-${isEdit ? 'edit' : 'plus'} ml-2"></i>
                        ${isEdit ? 'تعديل قالب' : 'إضافة قالب جديد'}
                    </h2>
                    <button class="modal-close text-white hover:bg-white/20" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="template-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">اسم القالب *</label>
                            <input type="text" id="template-name" required class="form-input" 
                                   value="${template ? Utils.escapeHTML(template.name) : ''}"
                                   placeholder="مثال: فحص كشافات الطوارئ">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">أيقونة القالب</label>
                            <select id="template-icon" class="form-input">
                                <option value="fa-lightbulb" ${template?.icon === 'fa-lightbulb' ? 'selected' : ''}>💡 لمبة</option>
                                <option value="fa-fire-extinguisher" ${template?.icon === 'fa-fire-extinguisher' ? 'selected' : ''}>🧯 طفاية حريق</option>
                                <option value="fa-truck-loading" ${template?.icon === 'fa-truck-loading' ? 'selected' : ''}>🚚 رافعة</option>
                                <option value="fa-door-open" ${template?.icon === 'fa-door-open' ? 'selected' : ''}>🚪 باب</option>
                                <option value="fa-fire" ${template?.icon === 'fa-fire' ? 'selected' : ''}>🔥 نار</option>
                                <option value="fa-wrench" ${template?.icon === 'fa-wrench' ? 'selected' : ''}>🔧 مفتاح</option>
                                <option value="fa-bolt" ${template?.icon === 'fa-bolt' ? 'selected' : ''}>⚡ كهرباء</option>
                                <option value="fa-tools" ${template?.icon === 'fa-tools' ? 'selected' : ''}>🔨 أدوات</option>
                                <option value="fa-car" ${template?.icon === 'fa-car' ? 'selected' : ''}>🚗 سيارة</option>
                                <option value="fa-clipboard-list" ${template?.icon === 'fa-clipboard-list' ? 'selected' : ''}>📋 قائمة</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">
                                عناصر قائمة الفحص *
                                <span class="text-xs font-normal text-gray-500">(يمكنك إضافة/تعديل/حذف العناصر)</span>
                            </label>
                            <div id="checklist-items-container" class="space-y-2 border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                                ${template && template.checklist ? template.checklist.map((item, index) => `
                                    <div class="checklist-item bg-white p-3 rounded border border-gray-200">
                                        <div class="flex items-start gap-2">
                                            <input type="checkbox" class="item-required mt-1" ${item.required ? 'checked' : ''}>
                                            <input type="text" class="form-input flex-1 item-label" value="${Utils.escapeHTML(item.label)}" placeholder="نص العنصر">
                                            <button type="button" class="btn-icon btn-icon-danger remove-item" title="حذف">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('') : ''}
                            </div>
                            <button type="button" id="add-checklist-item-btn" class="btn-secondary mt-2">
                                <i class="fas fa-plus ml-2"></i>
                                إضافة عنصر جديد
                            </button>
                        </div>
                        <div class="flex items-center justify-end gap-4 pt-4 border-t">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save ml-2"></i>
                                ${isEdit ? 'حفظ التعديلات' : 'حفظ القالب'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // إضافة عنصر جديد
        const addItemBtn = modal.querySelector('#add-checklist-item-btn');
        const itemsContainer = modal.querySelector('#checklist-items-container');
        
        addItemBtn.addEventListener('click', () => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'checklist-item bg-white p-3 rounded border border-gray-200';
            itemDiv.innerHTML = `
                <div class="flex items-start gap-2">
                    <input type="checkbox" class="item-required mt-1">
                    <input type="text" class="form-input flex-1 item-label" placeholder="نص العنصر">
                    <button type="button" class="btn-icon btn-icon-danger remove-item" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            itemsContainer.appendChild(itemDiv);
            
            itemDiv.querySelector('.remove-item').addEventListener('click', () => {
                itemDiv.remove();
            });
        });

        // حذف عناصر موجودة
        modal.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.checklist-item').remove();
            });
        });

        // معالجة النموذج
        const form = modal.querySelector('#template-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = modal.querySelector('#template-name').value.trim();
            const icon = modal.querySelector('#template-icon').value;
            const items = Array.from(modal.querySelectorAll('.checklist-item')).map((itemDiv, index) => {
                const label = itemDiv.querySelector('.item-label').value.trim();
                const required = itemDiv.querySelector('.item-required').checked;
                return label ? { id: `item_${Date.now()}_${index}`, label, required } : null;
            }).filter(item => item !== null);

            if (!name) {
                Notification.error('يرجى إدخال اسم القالب');
                return;
            }

            if (items.length === 0) {
                Notification.error('يرجى إضافة عنصر واحد على الأقل لقائمة الفحص');
                return;
            }

            const templateData = {
                id: isEdit ? templateId : `template_${Date.now()}`,
                name,
                icon,
                checklist: items
            };

            if (isEdit) {
                // تحديث القالب الموجود مع الحفاظ على نفس الـ ID
                this.INSPECTION_TEMPLATES[templateId] = templateData;
                Notification.success('تم تحديث القالب بنجاح');
            } else {
                // إضافة قالب جديد
                this.INSPECTION_TEMPLATES[templateData.id] = templateData;
                Notification.success('تم إضافة القالب بنجاح');
            }

            modal.remove();
            this.showTemplateManagement();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    editTemplate(templateId) {
        this.showAddEditTemplateModal(templateId);
    },

    deleteTemplate(templateId) {
        const template = this.INSPECTION_TEMPLATES[templateId];
        if (!template) return;

        if (!confirm(`هل أنت متأكد من حذف قالب "${template.name}"؟\n\nملاحظة: لن يتم حذف الفحوصات الموجودة التي استخدمت هذا القالب، ولكن لن يتمكن المستخدمون من استخدام هذا القالب في الفحوصات الجديدة.`)) {
            return;
        }

        delete this.INSPECTION_TEMPLATES[templateId];
        Notification.success('تم حذف القالب بنجاح');
        
        // إعادة عرض نافذة الإدارة
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) existingModal.remove();
        this.showTemplateManagement();
    },

    async viewInspection(id) {
        const inspection = (AppState.appData.periodicInspections || []).find(i => i.id === id);
        if (!inspection) return;

        // معالجة checklistResults إذا كانت JSON string
        if (inspection.checklistResults && typeof inspection.checklistResults === 'string') {
            try {
                inspection.checklistResults = JSON.parse(inspection.checklistResults);
            } catch (e) {
                Utils.safeWarn('⚠️ خطأ في تحليل checklistResults:', e);
                inspection.checklistResults = [];
            }
        }
        if (!Array.isArray(inspection.checklistResults)) {
            inspection.checklistResults = [];
        }

        const template = inspection.templateId ? this.INSPECTION_TEMPLATES[inspection.templateId] : null;
        
        // حساب إحصائيات القائمة
        const checklistStats = template && inspection.checklistResults && inspection.checklistResults.length > 0 ? {
            total: inspection.checklistResults.length,
            checked: inspection.checklistResults.filter(r => r.checked).length,
            unchecked: inspection.checklistResults.filter(r => !r.checked).length
        } : null;

        // عرض نتائج القائمة
        let checklistHtml = '';
        if (template && inspection.checklistResults && inspection.checklistResults.length > 0) {
            checklistHtml = `
                <div class="mt-6 border-t pt-6">
                    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="bg-blue-500 rounded-lg p-2">
                                    <i class="fas ${template.icon} text-white text-xl"></i>
                                </div>
                                <div>
                                    <h4 class="text-lg font-bold text-gray-800">نتائج قائمة الفحص</h4>
                                    <p class="text-sm text-gray-600 mt-1">
                                        ${template.name}
                                    </p>
                                </div>
                            </div>
                            ${checklistStats ? `
                                <div class="text-left">
                                    <div class="flex items-center gap-4">
                                        <div class="text-center">
                                            <p class="text-2xl font-bold text-green-600">${checklistStats.checked}</p>
                                            <p class="text-xs text-gray-600">مطابق</p>
                                        </div>
                                        <div class="text-center">
                                            <p class="text-2xl font-bold text-red-600">${checklistStats.unchecked}</p>
                                            <p class="text-xs text-gray-600">غير مطابق</p>
                                        </div>
                                        <div class="text-center">
                                            <p class="text-2xl font-bold text-blue-600">${checklistStats.total}</p>
                                            <p class="text-xs text-gray-600">الإجمالي</p>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="space-y-3">
                        ${inspection.checklistResults.map((result, index) => {
                            const item = template.checklist.find(i => i.id === result.id);
                            if (!item) return '';
                            const resultBadgeClass = result.checked ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300';
                            const resultIcon = result.checked ? 'fa-check-circle text-green-600' : 'fa-times-circle text-red-600';
                            return `
                                <div class="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-lg border-2 ${resultBadgeClass} hover:shadow-md transition-shadow">
                                    <div class="flex items-center pt-1 flex-shrink-0">
                                        <i class="fas ${resultIcon} text-base sm:text-xl"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-start justify-between gap-2">
                                            <label class="text-sm font-bold text-gray-800 cursor-pointer flex-1 min-w-0">
                                                <span class="inline-flex items-center justify-center w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full ${result.checked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} text-[10px] sm:text-[11px] font-bold ml-2 leading-none flex-shrink-0">${index + 1}</span>
                                                <span class="break-words">${Utils.escapeHTML(result.label || item.label)}</span>
                                                ${item.required ? '<span class="text-red-500 mr-1 font-bold flex-shrink-0">*</span>' : ''}
                                            </label>
                                        </div>
                                        ${result.note ? `
                                            <div class="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                                                <div class="flex items-start gap-2">
                                                    <i class="fas fa-sticky-note text-gray-400 text-sm mt-0.5"></i>
                                                    <div class="flex-1">
                                                        <p class="text-xs font-semibold text-gray-600 mb-1">ملاحظة:</p>
                                                        <p class="text-sm text-gray-800">${Utils.escapeHTML(result.note)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        const resultBadgeClass = this.getResultBadgeClass(inspection.result);
        const resultIcon = this.getResultIcon(inspection.result);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="modal-title text-white mb-1">
                                <i class="fas fa-clipboard-check ml-2"></i>
                                تفاصيل الفحص الدوري
                            </h2>
                            <p class="text-blue-100 text-sm">رقم الفحص: ${Utils.escapeHTML(inspection.inspectionNumber || inspection.id || '')}</p>
                        </div>
                        <button class="modal-close text-white hover:bg-white/20 rounded-lg p-2 transition-colors" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                <div class="modal-body">
                    <!-- معلومات أساسية -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div class="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="bg-blue-500 rounded-lg p-2">
                                    <i class="fas fa-tag text-white"></i>
                                </div>
                                <div>
                                    <label class="text-xs font-semibold text-blue-700 uppercase">نوع الفحص</label>
                                    <p class="text-base font-bold text-gray-800 mt-1">${Utils.escapeHTML(inspection.category || '-')}</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="bg-green-500 rounded-lg p-2">
                                    <i class="fas fa-flag-checkered text-white"></i>
                                </div>
                                <div>
                                    <label class="text-xs font-semibold text-green-700 uppercase">النتيجة</label>
                                    <div class="mt-1">
                                        <span class="badge ${resultBadgeClass} inline-flex items-center gap-2 px-3 py-1.5 text-base">
                                            <i class="${resultIcon}"></i>
                                            ${Utils.escapeHTML(inspection.result || '-')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="bg-purple-500 rounded-lg p-2">
                                    <i class="fas fa-map-marker-alt text-white"></i>
                                </div>
                                <div>
                                    <label class="text-xs font-semibold text-purple-700 uppercase">الموقع/المعدة</label>
                                    <p class="text-base font-bold text-gray-800 mt-1">${Utils.escapeHTML(inspection.location || inspection.equipment || '-')}</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="bg-orange-500 rounded-lg p-2">
                                    <i class="fas fa-user-check text-white"></i>
                                </div>
                                <div>
                                    <label class="text-xs font-semibold text-orange-700 uppercase">المفتش</label>
                                    <p class="text-base font-bold text-gray-800 mt-1">${Utils.escapeHTML(inspection.inspector || '-')}</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-4">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="bg-indigo-500 rounded-lg p-2">
                                    <i class="fas fa-calendar-alt text-white"></i>
                                </div>
                                <div>
                                    <label class="text-xs font-semibold text-indigo-700 uppercase">تاريخ الفحص</label>
                                    <p class="text-base font-bold text-gray-800 mt-1">${inspection.inspectionDate ? Utils.formatDate(inspection.inspectionDate) : '-'}</p>
                                </div>
                            </div>
                        </div>
                        ${inspection.assetCode ? `
                            <div class="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
                                <div class="flex items-center gap-3 mb-2">
                                    <div class="bg-gray-500 rounded-lg p-2">
                                        <i class="fas fa-barcode text-white"></i>
                                    </div>
                                    <div>
                                        <label class="text-xs font-semibold text-gray-700 uppercase">رقم/كود المعدة</label>
                                        <p class="text-base font-bold text-gray-800 mt-1">${Utils.escapeHTML(inspection.assetCode)}</p>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    ${checklistHtml}
                    ${inspection.notes ? `
                        <div class="border-t pt-6">
                            <div class="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
                                <div class="flex items-start gap-3">
                                    <div class="bg-gray-500 rounded-lg p-2">
                                        <i class="fas fa-sticky-note text-white"></i>
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="text-base font-bold text-gray-800 mb-2">ملاحظات عامة</h4>
                                        <p class="text-sm text-gray-700 leading-relaxed">${Utils.escapeHTML(inspection.notes)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    ${inspection.correctiveActions ? `
                        <div class="border-t pt-6">
                            <div class="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                                <div class="flex items-start gap-3">
                                    <div class="bg-red-500 rounded-lg p-2">
                                        <i class="fas fa-tools text-white"></i>
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="text-base font-bold text-gray-800 mb-2">الإجراءات التصحيحية المطلوبة</h4>
                                        <p class="text-sm text-gray-700 leading-relaxed">${Utils.escapeHTML(inspection.correctiveActions)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer bg-gray-50">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times ml-2"></i>
                        إغلاق
                    </button>
                    <button class="btn-primary" onclick="PeriodicInspections.editInspection('${id}'); this.closest('.modal-overlay').remove();">
                        <i class="fas fa-edit ml-2"></i>
                        تعديل الفحص
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    async editInspection(id) {
        const inspection = (AppState.appData.periodicInspections || []).find(i => i.id === id);
        if (inspection) {
            await this.showFormModal(id);
        } else {
            Notification.error('الفحص المطلوب غير موجود');
        }
    },

    async deleteInspection(id) {
        if (!confirm('هل أنت متأكد من حذف هذا الفحص الدوري؟')) return;

        const inspections = AppState.appData.periodicInspections || [];
        const index = inspections.findIndex(i => i.id === id);
        if (index !== -1) {
            inspections.splice(index, 1);
            if (typeof window.DataManager !== 'undefined' && window.DataManager.save) {
                window.DataManager.save();
            }
            Notification.success('تم حذف الفحص الدوري بنجاح');
            this.load();
        }
    },

    printInspection() {
        const form = document.getElementById('periodic-inspection-form');
        if (!form) {
            Notification.warning('لا يمكن طباعة النموذج قبل ملء البيانات');
            return;
        }

        // جمع بيانات النموذج
        const templateId = document.getElementById('inspection-template')?.value || '';
        const template = templateId ? this.INSPECTION_TEMPLATES[templateId] : null;
        const category = document.getElementById('inspection-category')?.value || '';
        const inspectionDate = document.getElementById('inspection-date')?.value || '';
        const location = document.getElementById('inspection-location')?.value || '';
        const inspector = document.getElementById('inspection-inspector')?.value || '';
        const result = document.getElementById('inspection-result')?.value || '';
        const assetCode = document.getElementById('inspection-asset-code')?.value || '';
        const factoryId = document.getElementById('inspection-factory')?.value || '';
        const subLocationId = document.getElementById('inspection-sub-location')?.value || '';
        const sites = this.getSiteOptions();
        const selectedSite = sites.find(s => s.id === factoryId);
        const places = this.getPlaceOptions(factoryId);
        const selectedPlace = places.find(p => p.id === subLocationId);
        const factoryName = selectedSite ? selectedSite.name : '';
        const subLocationName = selectedPlace ? selectedPlace.name : '';
        const notes = document.getElementById('inspection-notes')?.value || '';
        const correctiveActions = document.getElementById('inspection-corrective-actions')?.value || '';

        // جمع بيانات القائمة
        const checklistItems = [];
        if (template && template.checklist) {
            template.checklist.forEach((item, index) => {
                const checkbox = document.getElementById(`checklist-${item.id}`);
                const statusSelect = document.getElementById(`checklist-status-${item.id}`);
                const noteTextarea = document.getElementById(`checklist-note-${item.id}`);
                checklistItems.push({
                    number: index + 1,
                    label: item.label,
                    checked: checkbox ? checkbox.checked : false,
                    status: statusSelect ? statusSelect.value : '',
                    note: noteTextarea ? noteTextarea.value.trim() : '',
                    required: item.required
                });
            });
        }

        // إنشاء محتوى HTML للطباعة
        const checklistRows = checklistItems.map(item => `
            <tr>
                <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${item.number}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${Utils.escapeHTML(item.label)} ${item.required ? '<span style="color: red;">*</span>' : ''}</td>
                <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${item.checked ? '✓' : '✗'}</td>
                <td style="text-align: center; padding: 8px; border: 1px solid #ddd; ${item.status === 'مطابق' ? 'color: green; font-weight: bold;' : item.status === 'غير مطابق' ? 'color: red; font-weight: bold;' : item.status === 'أخرى' ? 'color: orange; font-weight: bold;' : ''}">${Utils.escapeHTML(item.status) || '-'}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${Utils.escapeHTML(item.note) || '-'}</td>
            </tr>
        `).join('');

        // إنشاء محتوى النموذج (بدون header)
        const content = `
            <style>
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .info-item {
                    padding: 10px;
                    background: #f8fafc;
                    border-right: 3px solid #3b82f6;
                    border-radius: 5px;
                }
                .info-label {
                    font-weight: bold;
                    color: #64748b;
                    font-size: 12px;
                    margin-bottom: 5px;
                }
                .info-value {
                    color: #1e293b;
                    font-size: 14px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th {
                    background: #3b82f6;
                    color: white;
                    padding: 12px;
                    text-align: right;
                    font-weight: bold;
                }
                td {
                    padding: 10px;
                    border: 1px solid #ddd;
                }
                .notes-section {
                    margin-top: 20px;
                    padding: 15px;
                    background: #f8fafc;
                    border-radius: 5px;
                }
                .notes-title {
                    font-weight: bold;
                    color: #1e40af;
                    margin-bottom: 10px;
                }
            </style>
            
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">نوع الفحص</div>
                    <div class="info-value">${Utils.escapeHTML(category)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">تاريخ الفحص</div>
                    <div class="info-value">${inspectionDate || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">الموقع/المعدة</div>
                    <div class="info-value">${Utils.escapeHTML(location)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">المفتش</div>
                    <div class="info-value">${Utils.escapeHTML(inspector)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">النتيجة</div>
                    <div class="info-value">${Utils.escapeHTML(result)}</div>
                </div>
                ${factoryName ? `
                <div class="info-item">
                    <div class="info-label">المصنع</div>
                    <div class="info-value">${Utils.escapeHTML(factoryName)}</div>
                </div>
                ` : ''}
                ${subLocationName ? `
                <div class="info-item">
                    <div class="info-label">الموقع الفرعي</div>
                    <div class="info-value">${Utils.escapeHTML(subLocationName)}</div>
                </div>
                ` : ''}
                ${assetCode ? `
                <div class="info-item">
                    <div class="info-label">رقم المعدة/الكود</div>
                    <div class="info-value">${Utils.escapeHTML(assetCode)}</div>
                </div>
                ` : ''}
            </div>

            ${checklistRows ? `
            <table>
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th>عنصر الفحص</th>
                        <th style="width: 80px;">تم الفحص</th>
                        <th style="width: 120px;">حالة المطابقة</th>
                        <th>ملاحظات</th>
                    </tr>
                </thead>
                <tbody>
                    ${checklistRows}
                </tbody>
            </table>
            ` : ''}

            ${notes || correctiveActions ? `
            <div class="notes-section">
                ${notes ? `
                <div class="notes-title">ملاحظات عامة:</div>
                <p style="margin: 0 0 15px 0; line-height: 1.6;">${Utils.escapeHTML(notes)}</p>
                ` : ''}
                ${correctiveActions ? `
                <div class="notes-title">الإجراءات التصحيحية المطلوبة:</div>
                <p style="margin: 0; line-height: 1.6;">${Utils.escapeHTML(correctiveActions)}</p>
                ` : ''}
            </div>
            ` : ''}
        `;

        // إنشاء formCode و formTitle
        const formCode = `PINSP-${inspectionDate || new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;
        const formTitle = `تقرير فحص دوري - ${Utils.escapeHTML(category)}`;

        // استخدام FormHeader.generatePDFHTML إذا كان متاحاً
        const htmlContent = typeof FormHeader !== 'undefined' && FormHeader.generatePDFHTML
            ? FormHeader.generatePDFHTML(
                formCode,
                formTitle,
                content,
                false,
                true,
                { version: '1.0' },
                new Date().toISOString(),
                new Date().toISOString()
            )
            : `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>${formTitle}</title>
                <style>
                    @media print {
                        @page { margin: 1cm; }
                        body { margin: 0; padding: 0; }
                    }
                    body {
                        font-family: 'Arial', 'Tahoma', sans-serif;
                        direction: rtl;
                        padding: 20px;
                        color: #333;
                    }
                </style>
            </head>
            <body>
                <h1 style="text-align: center; color: #1e40af; margin-bottom: 20px;">${formTitle}</h1>
                ${content}
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');

        if (printWindow) {
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                    setTimeout(() => {
                        URL.revokeObjectURL(url);
                    }, 500);
                }, 300);
            };
        } else {
            Notification.error('يرجى السماح للنوافذ المنبثقة لعرض التقرير');
        }
    },

    exportInspection() {
        const form = document.getElementById('periodic-inspection-form');
        if (!form) {
            Notification.warning('لا يمكن تصدير النموذج قبل ملء البيانات');
            return;
        }

        // جمع بيانات النموذج
        const templateId = document.getElementById('inspection-template')?.value || '';
        const template = templateId ? this.INSPECTION_TEMPLATES[templateId] : null;
        const category = document.getElementById('inspection-category')?.value || '';
        const inspectionDate = document.getElementById('inspection-date')?.value || '';
        const location = document.getElementById('inspection-location')?.value || '';
        const inspector = document.getElementById('inspection-inspector')?.value || '';
        const result = document.getElementById('inspection-result')?.value || '';
        const assetCode = document.getElementById('inspection-asset-code')?.value || '';
        const factoryId = document.getElementById('inspection-factory')?.value || '';
        const subLocationId = document.getElementById('inspection-sub-location')?.value || '';
        const sites = this.getSiteOptions();
        const selectedSite = sites.find(s => s.id === factoryId);
        const places = this.getPlaceOptions(factoryId);
        const selectedPlace = places.find(p => p.id === subLocationId);
        const factoryName = selectedSite ? selectedSite.name : '';
        const subLocationName = selectedPlace ? selectedPlace.name : '';
        const notes = document.getElementById('inspection-notes')?.value || '';
        const correctiveActions = document.getElementById('inspection-corrective-actions')?.value || '';

        // جمع بيانات القائمة
        const checklistItems = [];
        if (template && template.checklist) {
            template.checklist.forEach((item, index) => {
                const checkbox = document.getElementById(`checklist-${item.id}`);
                const statusSelect = document.getElementById(`checklist-status-${item.id}`);
                const noteTextarea = document.getElementById(`checklist-note-${item.id}`);
                checklistItems.push({
                    number: index + 1,
                    label: item.label,
                    checked: checkbox ? checkbox.checked : false,
                    status: statusSelect ? statusSelect.value : '',
                    note: noteTextarea ? noteTextarea.value.trim() : '',
                    required: item.required
                });
            });
        }

        // إنشاء محتوى Excel
        const excelContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office"
                  xmlns:x="urn:schemas-microsoft-com:office:excel"
                  xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8">
                <!--[if gte mso 9]><xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>فحص دوري</x:Name>
                            <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
                </xml><![endif]-->
                <style>
                    body { direction: rtl; font-family: Arial, Tahoma; }
                    table { border-collapse: collapse; width: 100%; }
                    th { background: #3b82f6; color: white; padding: 10px; font-weight: bold; }
                    td { border: 1px solid #ddd; padding: 8px; }
                </style>
            </head>
            <body>
                <h2>تقرير فحص دوري</h2>
                <table>
                    <tr><th>نوع الفحص</th><td>${Utils.escapeHTML(category)}</td></tr>
                    <tr><th>تاريخ الفحص</th><td>${inspectionDate || '-'}</td></tr>
                    <tr><th>الموقع/المعدة</th><td>${Utils.escapeHTML(location)}</td></tr>
                    <tr><th>المفتش</th><td>${Utils.escapeHTML(inspector)}</td></tr>
                    <tr><th>النتيجة</th><td>${Utils.escapeHTML(result)}</td></tr>
                    ${factoryName ? `<tr><th>المصنع</th><td>${Utils.escapeHTML(factoryName)}</td></tr>` : ''}
                    ${subLocationName ? `<tr><th>الموقع الفرعي</th><td>${Utils.escapeHTML(subLocationName)}</td></tr>` : ''}
                    ${assetCode ? `<tr><th>رقم المعدة/الكود</th><td>${Utils.escapeHTML(assetCode)}</td></tr>` : ''}
                </table>
                ${checklistItems.length > 0 ? `
                <h3 style="margin-top: 20px;">قائمة الفحص</h3>
                <table border="1">
                    <tr>
                        <th>#</th>
                        <th>عنصر الفحص</th>
                        <th>تم الفحص</th>
                        <th>حالة المطابقة</th>
                        <th>ملاحظات</th>
                    </tr>
                    ${checklistItems.map(item => `
                        <tr>
                            <td>${item.number}</td>
                            <td>${Utils.escapeHTML(item.label)} ${item.required ? '*' : ''}</td>
                            <td>${item.checked ? '✓' : '✗'}</td>
                            <td>${Utils.escapeHTML(item.status) || '-'}</td>
                            <td>${Utils.escapeHTML(item.note) || '-'}</td>
                        </tr>
                    `).join('')}
                </table>
                ` : ''}
                ${notes ? `<h3 style="margin-top: 20px;">ملاحظات عامة</h3><p>${Utils.escapeHTML(notes)}</p>` : ''}
                ${correctiveActions ? `<h3 style="margin-top: 20px;">الإجراءات التصحيحية</h3><p>${Utils.escapeHTML(correctiveActions)}</p>` : ''}
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = `فحص_دوري_${category}_${inspectionDate || new Date().toISOString().slice(0, 10)}.xls`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Notification.success('تم تصدير الفحص بنجاح');
    },

    setupTabsNavigation() {
        setTimeout(() => {
            const tabButtons = document.querySelectorAll('#periodic-inspections-section .tab-btn[data-tab]');
            const tabContents = document.querySelectorAll('#periodic-inspections-section .tab-content');

            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const targetTab = button.getAttribute('data-tab');

                    // إزالة active من جميع الأزرار
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));

                    // إضافة active للزر المحدد
                    button.classList.add('active');
                    
                    // تحديث الحالة وإعادة التحميل
                    this.state.currentTab = targetTab;
                    this.load();
                });
            });
        }, 100);
    },

    async renderInspectionRecords() {
        try {
            if (!AppState.appData || !AppState.appData.periodicInspections) {
                return `
                    <div class="content-card">
                        <div class="card-body">
                            <div class="empty-state">
                                <i class="fas fa-history text-4xl text-gray-300 mb-4"></i>
                                <p class="text-gray-500">لا توجد سجلات فحوصات دورية</p>
                            </div>
                        </div>
                    </div>
                `;
            }

            const inspections = AppState.appData.periodicInspections || [];
            
            // ترتيب حسب التاريخ (الأحدث أولاً)
            const sortedInspections = [...inspections].sort((a, b) => {
                const dateA = new Date(a.inspectionDate || a.createdAt || 0);
                const dateB = new Date(b.inspectionDate || b.createdAt || 0);
                return dateB - dateA;
            });

            // تجميع حسب الشهر
            const groupedByMonth = {};
            sortedInspections.forEach(inspection => {
                const date = new Date(inspection.inspectionDate || inspection.createdAt);
                const monthKey = date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
                if (!groupedByMonth[monthKey]) {
                    groupedByMonth[monthKey] = [];
                }
                groupedByMonth[monthKey].push(inspection);
            });

            // حساب الإحصائيات
            const stats = this.calculateStatistics(inspections);

            return `
                <!-- إحصائيات السجل -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="content-card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                        <div class="card-body">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-blue-700 mb-1">إجمالي السجلات</p>
                                    <p class="text-3xl font-bold text-blue-800">${stats.total}</p>
                                </div>
                                <div class="bg-blue-500 rounded-full p-3">
                                    <i class="fas fa-file-alt text-white text-2xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="content-card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                        <div class="card-body">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-green-700 mb-1">مطابق</p>
                                    <p class="text-3xl font-bold text-green-800">${stats.compliant}</p>
                                    <p class="text-xs text-green-600 mt-1">${stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0}%</p>
                                </div>
                                <div class="bg-green-500 rounded-full p-3">
                                    <i class="fas fa-check-circle text-white text-2xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="content-card bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
                        <div class="card-body">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-red-700 mb-1">غير مطابق</p>
                                    <p class="text-3xl font-bold text-red-800">${stats.nonCompliant}</p>
                                    <p class="text-xs text-red-600 mt-1">${stats.total > 0 ? Math.round((stats.nonCompliant / stats.total) * 100) : 0}%</p>
                                </div>
                                <div class="bg-red-500 rounded-full p-3">
                                    <i class="fas fa-times-circle text-white text-2xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="content-card bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                        <div class="card-body">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-orange-700 mb-1">مطابق جزئياً</p>
                                    <p class="text-3xl font-bold text-orange-800">${stats.partialCompliant}</p>
                                    <p class="text-xs text-orange-600 mt-1">${stats.total > 0 ? Math.round((stats.partialCompliant / stats.total) * 100) : 0}%</p>
                                </div>
                                <div class="bg-orange-500 rounded-full p-3">
                                    <i class="fas fa-exclamation-circle text-white text-2xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- سجل الفحوصات -->
                <div class="content-card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-history ml-2"></i>
                            سجل الفحوصات الدورية
                        </h3>
                    </div>
                    <div class="card-body">
                        ${Object.keys(groupedByMonth).length === 0 ? `
                            <div class="empty-state">
                                <i class="fas fa-clipboard-check text-4xl text-gray-300 mb-4"></i>
                                <p class="text-gray-500">لا توجد سجلات فحوصات دورية</p>
                            </div>
                        ` : Object.keys(groupedByMonth).map(month => `
                            <div class="mb-8">
                                <div class="flex items-center gap-3 mb-4 pb-2 border-b-2 border-blue-200">
                                    <div class="bg-blue-500 rounded-lg p-2">
                                        <i class="fas fa-calendar-alt text-white"></i>
                                    </div>
                                    <h4 class="text-lg font-bold text-gray-800">${month}</h4>
                                    <span class="badge badge-info">${groupedByMonth[month].length} فحص</span>
                                </div>
                                <div class="space-y-3">
                                    ${groupedByMonth[month].map(inspection => {
                                        const template = inspection.templateId ? this.INSPECTION_TEMPLATES[inspection.templateId] : null;
                                        const categoryDisplay = template ? template.name : (inspection.category || '');
                                        const resultBadgeClass = this.getResultBadgeClass(inspection.result);
                                        const resultIcon = this.getResultIcon(inspection.result);
                                        const date = new Date(inspection.inspectionDate || inspection.createdAt);
                                        return `
                                        <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div class="flex items-start justify-between gap-4">
                                                <div class="flex-1">
                                                    <div class="flex items-center gap-3 mb-2">
                                                        ${template ? `<i class="fas ${template.icon} text-blue-500"></i>` : ''}
                                                        <h5 class="text-base font-bold text-gray-800">${Utils.escapeHTML(categoryDisplay)}</h5>
                                                        <span class="badge ${resultBadgeClass} inline-flex items-center gap-1">
                                                            <i class="${resultIcon}"></i>
                                                            ${Utils.escapeHTML(inspection.result || '-')}
                                                        </span>
                                                    </div>
                                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                                                        <div class="flex items-center gap-2">
                                                            <i class="fas fa-map-marker-alt text-gray-400"></i>
                                                            <span>${Utils.escapeHTML(inspection.location || inspection.equipment || '-')}</span>
                                                        </div>
                                                        <div class="flex items-center gap-2">
                                                            <i class="fas fa-user text-gray-400"></i>
                                                            <span>${Utils.escapeHTML(inspection.inspector || '-')}</span>
                                                        </div>
                                                        <div class="flex items-center gap-2">
                                                            <i class="fas fa-calendar text-gray-400"></i>
                                                            <span>${Utils.formatDate(date)}</span>
                                                        </div>
                                                    </div>
                                                    ${inspection.notes ? `
                                                        <div class="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                                                            <strong>ملاحظات:</strong> ${Utils.escapeHTML(inspection.notes.substring(0, 100))}${inspection.notes.length > 100 ? '...' : ''}
                                                        </div>
                                                    ` : ''}
                                                </div>
                                                <div class="flex items-center gap-2">
                                                    <button onclick="PeriodicInspections.viewInspection('${inspection.id}')" class="btn-icon btn-icon-info" title="عرض التفاصيل">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                    <button onclick="PeriodicInspections.editInspection('${inspection.id}')" class="btn-icon btn-icon-primary" title="تعديل">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            Utils.safeWarn('⚠️ خطأ في عرض سجل الفحوصات الدورية:', error);
            return `
                <div class="content-card">
                    <div class="card-body">
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                            <p class="text-gray-500">حدث خطأ في تحميل البيانات</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }
};

// Bind methods to maintain 'this' context
Object.keys(PeriodicInspections).forEach(key => {
    if (typeof PeriodicInspections[key] === 'function') {
        PeriodicInspections[key] = PeriodicInspections[key].bind(PeriodicInspections);
    }
});

// ===== Export module to global scope =====
// تصدير الموديول إلى window فوراً لضمان توافره
(function () {
    'use strict';
    try {
        if (typeof window !== 'undefined' && typeof PeriodicInspections !== 'undefined') {
            window.PeriodicInspections = PeriodicInspections;
            
            // إشعار عند تحميل الموديول بنجاح
            if (typeof AppState !== 'undefined' && AppState.debugMode && typeof Utils !== 'undefined' && Utils.safeLog) {
                Utils.safeLog('✅ PeriodicInspections module loaded and available on window.PeriodicInspections');
            }
        }
    } catch (error) {
        console.error('❌ خطأ في تصدير PeriodicInspections:', error);
        // محاولة التصدير مرة أخرى حتى في حالة الخطأ
        if (typeof window !== 'undefined' && typeof PeriodicInspections !== 'undefined') {
            try {
                window.PeriodicInspections = PeriodicInspections;
            } catch (e) {
                console.error('❌ فشل تصدير PeriodicInspections:', e);
            }
        }
    }
})();


