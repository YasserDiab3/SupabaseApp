# تحذيرات وأخطاء CSS في الـ Console

هذه الرسائل تظهر في أدوات المطوّر (Console) عند تحميل الصفحة. **معظمها آمن ويمكن تجاهله** ولا يؤثر على عمل التطبيق.

---

## 1. ملفات خارجية (لا تُعدّل)

| الملف | المصدر | السبب |
|-------|--------|--------|
| **leaflet.css** | CDN (خرائط Leaflet) | خصائص قديمة مثل `image-rendering`, `behavior`, `filter: progid:` — خاصة بمتصفحات قديمة. |
| **all.min.css** | Font Awesome (CDN) | `-moz-osx-font-smoothing` — خاص بـ Firefox على macOS. |

**التوصية:** لا تعدّل ملفات CDN. المتصفح يتجاهل ما لا يفهمه والتطبيق يعمل بشكل طبيعي.

---

## 2. ملفات المشروع (styles.css, browser-compatibility.css)

الرسائل الشائعة:

- **Unknown property ‘-moz-osx-font-smoothing’**  
  خاص بـ Firefox (macOS). المتصفحات الأخرى تتجاهله — لا خطأ في التصميم.

- **Error in parsing value for ‘-webkit-text-size-adjust’ / ‘text-size-adjust’**  
  خصائص قديمة لضبط حجم النص على الموبايل. يُتجاهل في بعض المحللات — السلوك الفعلي صحيح في المتصفحات المدعومة.

- **Unknown property ‘-moz-box-shadow’, ‘-moz-border-radius’, …**  
  بادئات قديمة لـ Firefox. المتصفحات الحديثة تستخدم `box-shadow` و `border-radius` بدون بادئة.

- **Expected media feature name but found ‘-ms-high-contrast’**  
  استعلام وسائط خاص بـ Microsoft (وضع التباين العالي). المحلل لا يتعرّفه لكن Edge القديم يفهمه.

- **Error in parsing value for ‘display’. Declaration dropped**  
  يظهر عند وجود `display: -ms-grid` أو `-ms-flexbox` داخل كتل مخصّصة لمتصفحات قديمة (مثل Edge Legacy). المتصفحات الحديثة تتجاهل السطر ولا يتأثر التصميم.

- **Ruleset ignored due to bad selector**  
  أحياناً يظهر مع محددات غير قياسية مثل `::-webkit-scrollbar-thumb:hover`. متصفحات WebKit/Blink تفهمها وتطبقها؛ بعض المحللات تعتبرها «سيئة» — يمكن تجاهل التحذير.

- **Unknown property ‘line-clamp’**  
  يُفضّل استخدام `-webkit-line-clamp` مع `display: -webkit-box` حيث مطلوب. إن وُجد `line-clamp` بدون البادئة فقد يُتجاهل في بعض المتصفحات.

---

## 3. ملفات التبويبات (contractors-tabs.css, module-tabs.css)

- **Ruleset ignored due to bad selector**  
  غالباً لمحددات شريط التمرير مثل `::-webkit-scrollbar-thumb:hover`. هذه المحددات صالحة في Chrome/Edge/Safari وتُستخدم عمداً — التحذير من المحلل وليس من المتصفح.

---

## ماذا تفعل؟

1. **لا داعي للقلق** — التطبيق يعمل والمظهر لا يتأثر بهذه التحذيرات.
2. إذا أردت **تقليل الضجيج في الـ Console**: يمكن تصفية رسائل CSS في أدوات المطوّر (Filter) أو تجاهل تحذيرات «Declaration dropped» و«Unknown property» من ملفات الـ CSS.
3. **لا تحذف** قواعد مثل `-ms-grid` أو `-moz-*` أو `::-webkit-scrollbar-*` من ملفات المشروع ما لم تكن متأكداً أنها غير مستخدمة؛ قد تكون لتحسين التوافق مع متصفحات أو أجهزة معيّنة.

---

## مراجع

- [MDN: -ms-high-contrast](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/-ms-high-contrast)  
- [MDN: -webkit-line-clamp](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-line-clamp)  
- [Styling scrollbars (WebKit)](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Scrollbars)
