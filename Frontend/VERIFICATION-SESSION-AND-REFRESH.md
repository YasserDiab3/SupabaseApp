# فحص تطبيق التحديثات: الجلسة وثبات الصفحة عند إعادة التحميل

## الهدف
- التأكد من أن التحديثات مطبقة وأن الكود القديم لا يعيق التشغيل.
- عند إعادة التحميل (F5) تبقى الجلسة نشطة ولا يعود المستخدم لشاشة تسجيل الدخول.
- تبقى الصفحة/الموديول الحالي كما هو ولا يتم العودة للشاشة الرئيسية (لوحة التحكم).

---

## 1. استعادة الجلسة (عدم الخروج لشاشة الدخول)

| الموقع | الوظيفة | الحالة |
|--------|---------|--------|
| `index.html` (بداية `<body>`) | سكربت inline يستعيد الجلسة من `hse_session_backup` أو `hse_remember_user` إلى `sessionStorage` قبل أي سكربت آخر | ✅ مطبق |
| `app-bootstrap.js` → بداية `start()` | استعادة من backup أو تذكرني إلى sessionStorage إذا كانت فارغة | ✅ مطبق |
| `app-bootstrap.js` → `checkAndRestoreSession()` | استعادة من backup أو تذكرني إلى sessionStorage عند غياب sessionData؛ ثم استدعاء `checkRememberedUser` | ✅ مطبق |
| `app-bootstrap.js` | عدم انتظار `syncUsers` قبل استعادة الجلسة (تشغيله في الخلفية) | ✅ مطبق |
| `app-bootstrap.js` | إعادة محاولة استعادة الجلسة حتى 5 مرات قبل عرض شاشة الدخول | ✅ مطبق |
| `auth.js` | حفظ `hse_session_backup` عند تسجيل الدخول وتحديث الجلسة؛ مسحها عند تسجيل الخروج فقط | ✅ مطبق |

**مسح الجلسة:** يتم فقط في `auth.js` عند (تسجيل الخروج، مستخدم معطّل، جلسة من جهاز آخر، خطأ في التحقق). لا يوجد كود آخر يمسح `hse_current_session` أو `hse_session_backup` عند التحميل.

---

## 2. ثبات الصفحة عند إعادة التحميل (نفس القسم/الموديول)

| الموقع | الوظيفة | الحالة |
|--------|---------|--------|
| `app-ui.js` → `showSection(sectionName)` | حفظ القسم الحالي في `sessionStorage` تحت `hse_current_section` عند كل تنقل | ✅ مطبق |
| `app-ui.js` → `_continueMainAppSetup()` | قراءة `savedSection` من sessionStorage ثم `hashSection` من الرابط ثم الافتراضي `dashboard`؛ استدعاء `showSection(sectionToShow)` وتحديث `location.hash` | ✅ مطبق |
| `app-ui.js` | تعيين `AppState.isNavigatingBack = true` قبل `showSection` عند الاستعادة لتجنب رسالة صلاحيات وتثبيت القسم | ✅ مطبق |
| `auth.js` → `logout()` | مسح `hse_current_section` عند تسجيل الخروج فقط | ✅ مطبق |

**نتيجة:** عند إعادة التحميل يُقرأ آخر قسم من `hse_current_section` (أو من hash الرابط) ويُعرض نفس القسم دون العودة للشاشة الرئيسية إلا عند عدم وجود صلاحية للقسم.

---

## 3. عدم تعارض الكود القديم

- **login-init-fixed.js:** يستمع لـ `storage` لتحديث عدد تسجيلات الدخول فقط؛ لا يمسح الجلسة ولا يوجّه لشاشة الدخول.
- **lazy-loader.js:** `hashchange` يتدخل فقط عند تغيير الـ hash (مثلاً بعد التحميل)؛ عند استعادة الجلسة يتم تعيين `location.hash = sectionToShow` من `_continueMainAppSetup` فيبقى القسم صحيحاً.
- **DataManager.load():** يُستدعى بـ `await` في الـ bootstrap؛ لا يمسح الجلسة.

---

## 4. ترتيب التنفيذ عند إعادة التحميل

1. تحميل الصفحة → تنفيذ السكربت المضاف في بداية `<body>` → استعادة الجلسة من localStorage إلى sessionStorage إن لزم.
2. تشغيل سكربتات `defer` → `AppBootstrap.start()` → استعادة الجلسة مرة أخرى في بداية `start()` إن كانت sessionStorage لا تزال فارغة.
3. `phaseServices` → `await DataManager.load()` (تحميل المستخدمين من localStorage).
4. `phaseReady` → `checkAndRestoreSession()` → استعادة من backup/تذكرني إن لم توجد sessionData → `checkRememberedUser()` → عند النجاح `showMainApp()`.
5. `showMainApp()` → `_continueMainAppSetup()` → قراءة `hse_current_section` و hash → `showSection(sectionToShow)` وتحديث `location.hash` → الصفحة تبقى على نفس القسم.

---

## 5. التحقق اليدوي الموصى به

1. تسجيل الدخول ثم الانتقال إلى أي موديول (مثل الحوادث، المستخدمين، ...).
2. تنفيذ إعادة تحميل الصفحة (F5 أو زر التحديث).
3. **المتوقع:** البقاء داخل التطبيق (بدون شاشة تسجيل الدخول) وفي نفس الموديول/الصفحة (بدون العودة إلى لوحة التحكم).
4. إن ظهرت شاشة الدخول أو العودة للوحة التحكم، مراجعة الـ console لأي أخطاء ومراجعة أن القيم `hse_current_session` و `hse_current_section` و `hse_session_backup` (أو `hse_remember_user`) موجودة في التخزين قبل إعادة التحميل.

تم التحديث: فحص التطبيق وثبات الصفحة عند إعادة التحميل.
