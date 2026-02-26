/**
 * Auto Compatibility Check Script
 * فحص تلقائي للتوافق عند تحميل التطبيق
 * يتم تشغيله تلقائياً عند فتح index.html
 */

(function() {
    'use strict';

    // تأخير بسيط لضمان تحميل DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // تشغيل الفحوصات فقط في وضع التطوير (يمكن تعطيله في الإنتاج)
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             window.location.search.includes('dev=true');

        if (isDevelopment || localStorage.getItem('enable-compat-check') === 'true') {
            runCompatibilityChecks();
        }
    }

    function runCompatibilityChecks() {
        const issues = [];
        const warnings = [];
        const browser = detectBrowser();
        const isMobile = window.innerWidth <= 768;

        // 1. فحص Viewport Meta Tag
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            issues.push('Viewport meta tag غير موجود');
        }

        // 2. فحص Scroll أفقي
        const hasHorizontalScroll = document.body.scrollWidth > document.body.clientWidth ||
                                   document.documentElement.scrollWidth > document.documentElement.clientWidth;
        if (hasHorizontalScroll) {
            issues.push('يوجد Scroll أفقي غير مرغوب فيه');
        }

        // 3. فحص CSS Variables
        const rootStyle = getComputedStyle(document.documentElement);
        const primaryColor = rootStyle.getPropertyValue('--primary-color');
        if (!primaryColor) {
            warnings.push('CSS Variables قد لا تكون مدعومة');
        }

        // 4. فحص RTL
        const isRTL = document.documentElement.dir === 'rtl' || 
                     window.getComputedStyle(document.body).direction === 'rtl';
        if (!isRTL) {
            warnings.push('RTL قد لا يكون مفعلاً');
        }

        // 5. فحص Font Loading
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                const cairoLoaded = document.fonts.check('1em Cairo') || 
                                  document.fonts.check('1em "Cairo"');
                if (!cairoLoaded) {
                    warnings.push('خط Cairo قد لا يكون محملاً بشكل صحيح');
                }
            });
        }

        // 6. فحص Touch Support على Mobile
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isMobile && !hasTouch) {
            warnings.push('دعم اللمس قد لا يكون متاحاً');
        }

        // 7. فحص Safe Area Insets
        const hasSafeArea = CSS.supports('padding', 'max(0px)') || 
                           CSS.supports('padding', 'env(safe-area-inset-top)');
        if (isMobile && !hasSafeArea) {
            warnings.push('Safe Area Insets قد لا تكون مدعومة');
        }

        // 8. فحص Flexbox و Grid
        const hasFlexbox = CSS.supports('display', 'flex');
        const hasGrid = CSS.supports('display', 'grid');
        if (!hasFlexbox) {
            issues.push('Flexbox غير مدعوم');
        }
        if (!hasGrid) {
            warnings.push('CSS Grid غير مدعوم');
        }

        // 9. فحص Overflow في العناصر الرئيسية
        const mainElements = ['app-shell', 'main-content', 'sidebar'];
        mainElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const style = window.getComputedStyle(el);
                if (style.overflowX !== 'hidden' && style.overflowX !== 'auto') {
                    warnings.push(`العنصر ${id} قد يحتاج overflow-x: hidden`);
                }
            }
        });

        // 10. فحص Zoom Level
        const zoomLevel = window.devicePixelRatio || 1;
        if (zoomLevel < 0.8 || zoomLevel > 1.5) {
            warnings.push(`مستوى Zoom غير عادي: ${Math.round(zoomLevel * 100)}%`);
        }

        // 11. فحوصات خاصة بكل متصفح
        switch(browser) {
            case 'Firefox':
                // فحص Gecko engine
                if (!CSS.supports('display', 'grid')) {
                    warnings.push('Firefox: CSS Grid قد لا يكون مدعوماً في الإصدارات القديمة');
                }
                // فحص scrollbar-width
                if (!CSS.supports('scrollbar-width', 'thin')) {
                    warnings.push('Firefox: scrollbar-width قد لا يكون مدعوماً');
                }
                break;
                
            case 'Safari':
                // فحص WebKit features
                if (!CSS.supports('-webkit-backdrop-filter', 'blur(4px)')) {
                    warnings.push('Safari: backdrop-filter قد لا يكون مدعوماً');
                }
                // فحص -webkit-fill-available
                if (isMobile) {
                    const testEl = document.createElement('div');
                    testEl.style.minHeight = '-webkit-fill-available';
                    if (!testEl.style.minHeight) {
                        warnings.push('Safari: -webkit-fill-available قد لا يكون مدعوماً');
                    }
                }
                break;
                
            case 'Edge':
                // Edge Chromium يدعم نفس Chrome
                if (navigator.userAgent.includes('Edg/')) {
                    // Edge الجديد - لا مشاكل متوقعة
                } else if (navigator.userAgent.includes('Edge/')) {
                    // Edge القديم
                    if (!CSS.supports('display', 'grid')) {
                        issues.push('Edge القديم: CSS Grid غير مدعوم');
                    }
                }
                break;
                
            case 'Mobile WebView':
                // فحص WebView capabilities
                if (!hasTouch) {
                    issues.push('WebView: دعم اللمس غير متاح');
                }
                if (!hasSafeArea) {
                    warnings.push('WebView: Safe Area Insets قد لا تكون مدعومة');
                }
                break;
                
            case 'Brave':
                // Brave يستخدم Blink مثل Chrome
                // لا مشاكل متوقعة
                break;
                
            case 'Internet Explorer':
                // IE غير مدعوم
                issues.push('Internet Explorer غير مدعوم - يرجى استخدام متصفح حديث');
                break;
                
            case 'Unknown Browser':
                // متصفح غير معروف
                warnings.push(`متصفح غير معروف: ${navigator.userAgent.substring(0, 100)}`);
                // فحص الميزات الأساسية
                if (!hasFlexbox) {
                    issues.push('المتصفح غير المعروف: Flexbox غير مدعوم');
                }
                break;
        }

        // 12. فحص Backdrop Filter
        const hasBackdropFilter = CSS.supports('backdrop-filter', 'blur(4px)') ||
                                  CSS.supports('-webkit-backdrop-filter', 'blur(4px)');
        if (!hasBackdropFilter && browser !== 'Firefox') {
            warnings.push('backdrop-filter قد لا يكون مدعوماً');
        }

        // 13. فحص CSS Custom Properties (Variables)
        const hasCSSVars = CSS.supports('color', 'var(--test)');
        if (!hasCSSVars) {
            issues.push('CSS Variables غير مدعومة - التطبيق قد لا يعمل بشكل صحيح');
        }

        // 14. فحص Intersection Observer (لـ lazy loading)
        if (!('IntersectionObserver' in window)) {
            warnings.push('IntersectionObserver غير مدعوم - lazy loading قد لا يعمل');
        }

        // 15. فحص Service Worker
        if ('serviceWorker' in navigator) {
            // Service Worker مدعوم
        } else {
            warnings.push('Service Worker غير مدعوم - PWA features قد لا تعمل');
        }

        // عرض النتائج (فقط في وضع التطوير)
        if (issues.length > 0 || warnings.length > 0) {
            console.group('🔍 نتائج فحص التوافق التلقائي');
            
            if (issues.length > 0) {
                console.group('❌ مشاكل يجب إصلاحها:');
                issues.forEach(issue => console.error(issue));
                console.groupEnd();
            }
            
            if (warnings.length > 0) {
                console.group('⚠️ تحذيرات:');
                warnings.forEach(warning => console.warn(warning));
                console.groupEnd();
            }
            
            console.groupEnd();

            // إظهار إشعار بصري (اختياري)
            if (localStorage.getItem('show-compat-notifications') === 'true') {
                showCompatibilityNotification(issues, warnings);
            }
        } else {
            console.log('✅ جميع فحوصات التوافق نجحت');
        }

        // حفظ النتائج في localStorage للرجوع إليها
        const results = {
            timestamp: new Date().toISOString(),
            issues: issues.length,
            warnings: warnings.length,
            browser: detectBrowser(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            zoom: Math.round((window.devicePixelRatio || 1) * 100)
        };
        
        localStorage.setItem('compatibility-check-results', JSON.stringify(results));
    }

    function detectBrowser() {
        const ua = navigator.userAgent;
        
        // كشف WebView أولاً
        if (ua.includes('wv') || ua.includes('WebView')) {
            return 'Mobile WebView';
        }
        // كشف Brave
        if (ua.includes('Brave') || navigator.brave) {
            return 'Brave';
        }
        // كشف Edge
        if (ua.includes('Edg') || ua.includes('Edge')) {
            return 'Edge';
        }
        // كشف Opera
        if (ua.includes('OPR') || ua.includes('Opera')) {
            return 'Opera';
        }
        // كشف Firefox
        if (ua.includes('Firefox')) {
            return 'Firefox';
        }
        // كشف Safari
        if (ua.includes('Safari') && !ua.includes('Chrome')) {
            return 'Safari';
        }
        // كشف Chrome
        if (ua.includes('Chrome')) {
            return 'Chrome';
        }
        // كشف متصفحات أخرى
        if (ua.includes('SamsungBrowser')) return 'Samsung Internet';
        if (ua.includes('Vivaldi')) return 'Vivaldi';
        if (ua.includes('YaBrowser')) return 'Yandex Browser';
        if (ua.includes('UCBrowser')) return 'UC Browser';
        if (ua.includes('MSIE') || ua.includes('Trident')) return 'Internet Explorer';
        
        return 'Unknown Browser';
    }

    function showCompatibilityNotification(issues, warnings) {
        // إنشاء إشعار بصري بسيط
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: ${issues.length > 0 ? '#dc2626' : '#f59e0b'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 300px;
            font-family: 'Cairo', sans-serif;
            font-size: 0.875rem;
        `;
        
        notification.innerHTML = `
            <strong>فحص التوافق:</strong><br>
            ${issues.length > 0 ? `❌ ${issues.length} مشكلة` : ''}
            ${warnings.length > 0 ? `⚠️ ${warnings.length} تحذير` : ''}
            <br>
            <small>افتح Console للتفاصيل</small>
        `;
        
        document.body.appendChild(notification);
        
        // إزالة الإشعار بعد 5 ثوان
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // فحص دوري للـ Viewport (كل 2 ثانية)
    let lastViewportWidth = window.innerWidth;
    setInterval(() => {
        const currentWidth = window.innerWidth;
        if (Math.abs(currentWidth - lastViewportWidth) > 50) {
            // Viewport تغير بشكل كبير، إعادة الفحص
            runCompatibilityChecks();
            lastViewportWidth = currentWidth;
        }
    }, 2000);

    // فحص عند تغيير حجم النافذة
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            runCompatibilityChecks();
        }, 500);
    });

    // تصدير الوظائف للاستخدام الخارجي (اختياري)
    window.CompatibilityChecker = {
        run: runCompatibilityChecks,
        enableNotifications: () => localStorage.setItem('show-compat-notifications', 'true'),
        disableNotifications: () => localStorage.setItem('show-compat-notifications', 'false'),
        enableAlways: () => localStorage.setItem('enable-compat-check', 'true'),
        disableAlways: () => localStorage.setItem('enable-compat-check', 'false')
    };
})();
