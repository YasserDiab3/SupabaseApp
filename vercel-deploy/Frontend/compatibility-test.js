/**
 * Compatibility Test Script
 * سكريبت اختبار التوافق الشامل
 */

// معلومات المتصفح - محسّن لجميع المتصفحات
function detectBrowser() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let version = 'Unknown';
    let os = 'Unknown';
    let engine = 'Unknown';
    let isMobile = false;
    let isWebView = false;

    // كشف WebView أولاً (يجب أن يكون قبل Chrome)
    if (ua.includes('wv') || ua.includes('WebView')) {
        isWebView = true;
        browser = 'Mobile WebView';
        if (ua.includes('Android')) {
            const match = ua.match(/Android\s+(\d+)/);
            version = match ? match[1] : 'Unknown';
        } else if (ua.includes('iPhone') || ua.includes('iPad')) {
            const match = ua.match(/OS\s+(\d+)[_\d]*/);
            version = match ? match[1] : 'Unknown';
        }
    }
    // كشف Brave (يجب أن يكون قبل Chrome)
    else if (ua.includes('Brave') || navigator.brave) {
        browser = 'Brave';
        const match = ua.match(/Chrome\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        engine = 'Blink';
    }
    // كشف Edge (يجب أن يكون قبل Chrome)
    else if (ua.includes('Edg') || ua.includes('Edge')) {
        browser = 'Edge';
        if (ua.includes('Edg/')) {
            const match = ua.match(/Edg\/(\d+)/);
            version = match ? match[1] : 'Unknown';
        } else if (ua.includes('Edge/')) {
            const match = ua.match(/Edge\/(\d+)/);
            version = match ? match[1] : 'Unknown';
        }
        engine = 'EdgeHTML'; // Edge القديم
        if (ua.includes('Edg/')) {
            engine = 'Blink'; // Edge الجديد
        }
    }
    // كشف Opera (يجب أن يكون قبل Chrome)
    else if (ua.includes('OPR') || ua.includes('Opera')) {
        browser = 'Opera';
        if (ua.includes('OPR/')) {
            const match = ua.match(/OPR\/(\d+)/);
            version = match ? match[1] : 'Unknown';
        } else if (ua.includes('Version/')) {
            const match = ua.match(/Version\/(\d+)/);
            version = match ? match[1] : 'Unknown';
        }
        engine = 'Blink';
    }
    // كشف Firefox
    else if (ua.includes('Firefox')) {
        browser = 'Firefox';
        const match = ua.match(/Firefox\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        engine = 'Gecko';
    }
    // كشف Safari (يجب أن يكون بعد Chrome)
    else if (ua.includes('Safari') && !ua.includes('Chrome')) {
        browser = 'Safari';
        const match = ua.match(/Version\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        engine = 'WebKit';
    }
    // كشف Chrome
    else if (ua.includes('Chrome')) {
        browser = 'Chrome';
        const match = ua.match(/Chrome\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        engine = 'Blink';
    }
    // كشف متصفحات أخرى
    else if (ua.includes('SamsungBrowser')) {
        browser = 'Samsung Internet';
        const match = ua.match(/SamsungBrowser\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        engine = 'Blink';
    }
    else if (ua.includes('Vivaldi')) {
        browser = 'Vivaldi';
        const match = ua.match(/Vivaldi\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        engine = 'Blink';
    }
    else if (ua.includes('YaBrowser')) {
        browser = 'Yandex Browser';
        const match = ua.match(/YaBrowser\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        engine = 'Blink';
    }
    else if (ua.includes('UCBrowser')) {
        browser = 'UC Browser';
        const match = ua.match(/UCBrowser\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        engine = 'Blink';
    }
    else if (ua.includes('QQBrowser')) {
        browser = 'QQ Browser';
        const match = ua.match(/QQBrowser\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        engine = 'Blink';
    }
    else if (ua.includes('Baidu')) {
        browser = 'Baidu Browser';
        engine = 'Blink';
    }
    else if (ua.includes('MSIE') || ua.includes('Trident')) {
        browser = 'Internet Explorer';
        if (ua.includes('MSIE')) {
            const match = ua.match(/MSIE\s+(\d+)/);
            version = match ? match[1] : 'Unknown';
        } else if (ua.includes('rv:')) {
            const match = ua.match(/rv:(\d+)/);
            version = match ? match[1] : '11';
        }
        engine = 'Trident';
    }
    // متصفح غير معروف
    else {
        browser = 'Unknown Browser';
        // محاولة كشف Engine
        if (ua.includes('Gecko')) engine = 'Gecko';
        else if (ua.includes('WebKit')) engine = 'WebKit';
        else if (ua.includes('Presto')) engine = 'Presto';
        else if (ua.includes('Trident')) engine = 'Trident';
    }

    // كشف نظام التشغيل
    if (ua.includes('Windows NT')) {
        const winMatch = ua.match(/Windows NT (\d+\.\d+)/);
        if (winMatch) {
            const winVer = parseFloat(winMatch[1]);
            if (winVer >= 10) os = 'Windows 10/11';
            else if (winVer >= 6.3) os = 'Windows 8.1';
            else if (winVer >= 6.2) os = 'Windows 8';
            else if (winVer >= 6.1) os = 'Windows 7';
            else os = 'Windows';
        } else {
            os = 'Windows';
        }
    } else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) {
        const macMatch = ua.match(/Mac OS X (\d+)[_.](\d+)/);
        if (macMatch) {
            os = `macOS ${macMatch[1]}.${macMatch[2]}`;
        } else {
            os = 'macOS';
        }
    } else if (ua.includes('Linux')) {
        os = 'Linux';
        if (ua.includes('Ubuntu')) os = 'Ubuntu';
        else if (ua.includes('Fedora')) os = 'Fedora';
        else if (ua.includes('Debian')) os = 'Debian';
    } else if (ua.includes('Android')) {
        os = 'Android';
        isMobile = true;
        const androidMatch = ua.match(/Android\s+(\d+)/);
        if (androidMatch) {
            os = `Android ${androidMatch[1]}`;
        }
    } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
        isMobile = true;
        const iosMatch = ua.match(/OS\s+(\d+)[_\d]*/);
        if (iosMatch) {
            os = `iOS ${iosMatch[1]}`;
        } else {
            os = 'iOS';
        }
    } else if (ua.includes('CrOS')) {
        os = 'Chrome OS';
    }

    // كشف Mobile
    if (!isMobile) {
        isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    }

    return { browser, version, os, engine, isMobile, isWebView };
}

// تحديث معلومات المتصفح
function updateBrowserInfo() {
    const info = detectBrowser();
    document.getElementById('browser-name').textContent = info.browser;
    document.getElementById('browser-version').textContent = info.version;
    document.getElementById('os-name').textContent = info.os;
    document.getElementById('screen-width').textContent = screen.width + 'px';
    document.getElementById('screen-height').textContent = screen.height + 'px';
    
    // إضافة معلومات إضافية إذا كانت متاحة
    const browserInfoEl = document.getElementById('browser-info');
    if (browserInfoEl) {
        // إضافة Engine info
        let engineInfo = browserInfoEl.querySelector('.engine-info');
        if (!engineInfo) {
            engineInfo = document.createElement('div');
            engineInfo.className = 'browser-item engine-info';
            browserInfoEl.appendChild(engineInfo);
        }
        engineInfo.innerHTML = `
            <strong>Engine:</strong><br>
            <span>${info.engine || 'غير معروف'}</span>
        `;
        
        // إضافة Mobile/WebView info
        if (info.isMobile || info.isWebView) {
            let mobileInfo = browserInfoEl.querySelector('.mobile-info');
            if (!mobileInfo) {
                mobileInfo = document.createElement('div');
                mobileInfo.className = 'browser-item mobile-info';
                browserInfoEl.appendChild(mobileInfo);
            }
            mobileInfo.innerHTML = `
                <strong>نوع الجهاز:</strong><br>
                <span>${info.isWebView ? 'WebView' : info.isMobile ? 'Mobile' : 'Desktop'}</span>
            `;
        }
    }
    
    updateViewportInfo();
}

// تحديث معلومات Viewport
function updateViewportInfo() {
    const vpWidth = window.innerWidth;
    const vpHeight = window.innerHeight;
    document.getElementById('viewport-width').textContent = vpWidth + 'px';
    document.getElementById('vp-width').textContent = vpWidth + 'px';
    document.getElementById('vp-height').textContent = vpHeight + 'px';
}

// تعيين مستوى التكبير
function setZoom(level) {
    document.body.style.zoom = level;
    document.getElementById('current-zoom').textContent = Math.round(level * 100) + '%';
    
    // تحديث الأزرار النشطة
    document.querySelectorAll('.zoom-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(Math.round(level * 100) + '%')) {
            btn.classList.add('active');
        }
    });

    // إعادة تشغيل الاختبارات
    setTimeout(() => {
        runDesignTests();
        runResponsiveTests();
    }, 100);
}

// محاكاة Viewport
function simulateViewport(width, height) {
    // ملاحظة: لا يمكن تغيير viewport فعلياً في المتصفح، لكن يمكن عرض المعلومات
    alert(`لاختبار هذا الحجم:\n1. افتح Developer Tools (F12)\n2. اضغط Ctrl+Shift+M (أو Cmd+Shift+M على Mac)\n3. اضبط الحجم على ${width}x${height}\n\nأو استخدم أداة Device Mode في المتصفح.`);
}

// اختبارات التصميم
function runDesignTests() {
    const tests = [
        {
            name: 'عدم وجود Scroll أفقي',
            test: () => {
                const body = document.body;
                const html = document.documentElement;
                return body.scrollWidth <= body.clientWidth && html.scrollWidth <= html.clientWidth;
            }
        },
        {
            name: 'ثبات الخطوط والأحجام',
            test: () => {
                const computedStyle = window.getComputedStyle(document.body);
                return computedStyle.fontSize !== '0px' && computedStyle.fontFamily !== '';
            }
        },
        {
            name: 'توفر CSS Variables',
            test: () => {
                const root = getComputedStyle(document.documentElement);
                return root.getPropertyValue('--primary-color') !== '';
            }
        },
        {
            name: 'عدم انزلاق العناصر',
            test: () => {
                const elements = document.querySelectorAll('.test-section');
                let allInPlace = true;
                elements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.left < 0 || rect.right > window.innerWidth) {
                        allInPlace = false;
                    }
                });
                return allInPlace;
            }
        },
        {
            name: 'ثبات الأيقونات',
            test: () => {
                const icons = document.querySelectorAll('i[class*="fa-"]');
                return icons.length > 0 && Array.from(icons).every(icon => {
                    const style = window.getComputedStyle(icon);
                    return style.display !== 'none' && style.visibility !== 'hidden';
                });
            }
        },
        {
            name: 'دعم RTL',
            test: () => {
                return document.documentElement.dir === 'rtl' || 
                       document.body.dir === 'rtl' ||
                       window.getComputedStyle(document.body).direction === 'rtl';
            }
        }
    ];

    const container = document.getElementById('design-tests');
    container.innerHTML = '';

    tests.forEach(test => {
        const result = test.test();
        const card = document.createElement('div');
        card.className = `test-card ${result ? 'pass' : 'fail'}`;
        card.innerHTML = `
            <h3>${test.name}</h3>
            <div class="test-status ${result ? 'status-pass' : 'status-fail'}">
                ${result ? '✓ نجح' : '✗ فشل'}
            </div>
        `;
        container.appendChild(card);
    });
}

// اختبارات Responsive
function runResponsiveTests() {
    const viewportWidth = window.innerWidth;
    const tests = [
        {
            name: 'Desktop (1920px+)',
            range: [1920, Infinity],
            current: viewportWidth >= 1920
        },
        {
            name: 'Laptop (1366-1600px)',
            range: [1366, 1600],
            current: viewportWidth >= 1366 && viewportWidth <= 1600
        },
        {
            name: 'Tablet (768-1024px)',
            range: [768, 1024],
            current: viewportWidth >= 768 && viewportWidth <= 1024
        },
        {
            name: 'Mobile (360-480px)',
            range: [360, 480],
            current: viewportWidth >= 360 && viewportWidth <= 480
        },
        {
            name: 'Small Mobile (<360px)',
            range: [0, 360],
            current: viewportWidth < 360
        }
    ];

    const container = document.getElementById('responsive-tests');
    container.innerHTML = '';

    tests.forEach(test => {
        const inRange = test.current;
        const card = document.createElement('div');
        card.className = `test-card ${inRange ? 'pass' : 'warning'}`;
        card.innerHTML = `
            <h3>${test.name}</h3>
            <p>النطاق: ${test.range[0]}px - ${test.range[1] === Infinity ? '∞' : test.range[1] + 'px'}</p>
            <p>الحالي: ${viewportWidth}px</p>
            <div class="test-status ${inRange ? 'status-pass' : 'status-warning'}">
                ${inRange ? '✓ في النطاق' : '⚠ خارج النطاق'}
            </div>
        `;
        container.appendChild(card);
    });
}

// اختبارات المتصفحات
function runBrowserTests() {
    const info = detectBrowser();
    const browsers = [
        { name: 'Chrome', supported: true, engine: 'Blink' },
        { name: 'Firefox', supported: true, engine: 'Gecko' },
        { name: 'Edge', supported: true, engine: info.engine || 'Blink' },
        { name: 'Safari', supported: true, engine: 'WebKit' },
        { name: 'Mobile WebView', supported: true, engine: 'WebKit/Blink' },
        { name: 'Brave', supported: true, engine: 'Blink' },
        { name: 'Opera', supported: true, engine: 'Blink' },
        { name: 'Samsung Internet', supported: true, engine: 'Blink' },
        { name: 'Vivaldi', supported: true, engine: 'Blink' },
        { name: 'Yandex Browser', supported: true, engine: 'Blink' },
        { name: 'UC Browser', supported: true, engine: 'Blink' },
        { name: 'Internet Explorer', supported: false, engine: 'Trident' }
    ];

    const container = document.getElementById('browser-tests');
    container.innerHTML = '';

    browsers.forEach(browser => {
        const isCurrent = browser.name === info.browser || 
                         (browser.name === 'Mobile WebView' && info.isWebView) ||
                         (info.browser === 'Unknown Browser' && browser.name.includes('Unknown'));
        
        let status = 'warning';
        let statusText = '⚠ يجب الاختبار';
        let statusClass = 'status-warning';
        
        if (isCurrent) {
            status = 'pass';
            statusText = '✓ المتصفح الحالي';
            statusClass = 'status-pass';
        } else if (!browser.supported) {
            status = 'fail';
            statusText = '✗ غير مدعوم';
            statusClass = 'status-fail';
        }
        
        const card = document.createElement('div');
        card.className = `test-card ${status}`;
        card.innerHTML = `
            <h3>${browser.name}</h3>
            <p><strong>Engine:</strong> ${browser.engine}</p>
            <p>${browser.supported ? 'مدعوم' : 'غير مدعوم'}</p>
            ${isCurrent ? `<p><strong>الإصدار:</strong> ${info.version}</p>` : ''}
            ${isCurrent ? `<p><strong>نظام التشغيل:</strong> ${info.os}</p>` : ''}
            <div class="test-status ${statusClass}">
                ${statusText}
            </div>
        `;
        container.appendChild(card);
    });
    
    // إضافة معلومات المتصفح الحالي إذا كان غير معروف
    if (info.browser === 'Unknown Browser' || info.browser.includes('Unknown')) {
        const unknownCard = document.createElement('div');
        unknownCard.className = 'test-card warning';
        unknownCard.innerHTML = `
            <h3>متصفح غير معروف</h3>
            <p><strong>User Agent:</strong></p>
            <p style="font-size: 0.75rem; word-break: break-all;">${navigator.userAgent}</p>
            <p><strong>Engine:</strong> ${info.engine || 'غير معروف'}</p>
            <p><strong>نظام التشغيل:</strong> ${info.os}</p>
            <div class="test-status status-warning">
                ⚠ متصفح غير معروف - يرجى الاختبار يدوياً
            </div>
        `;
        container.appendChild(unknownCard);
    }
}

// الاختبار الآلي الشامل
async function runAutoTests() {
    const resultsContainer = document.getElementById('auto-test-results');
    const contentContainer = document.getElementById('test-results-content');
    resultsContainer.style.display = 'block';
    contentContainer.innerHTML = '<p>جاري تشغيل الاختبارات...</p>';

    const results = [];
    
    // اختبار 1: Scroll أفقي
    const hasHorizontalScroll = document.body.scrollWidth > document.body.clientWidth;
    results.push({
        name: 'فحص Scroll أفقي',
        pass: !hasHorizontalScroll,
        message: hasHorizontalScroll ? 'يوجد Scroll أفقي غير مرغوب' : 'لا يوجد Scroll أفقي'
    });

    // اختبار 2: Viewport Meta Tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    results.push({
        name: 'Viewport Meta Tag',
        pass: !!viewportMeta,
        message: viewportMeta ? 'موجود' : 'غير موجود'
    });

    // اختبار 3: CSS Variables
    const rootStyle = getComputedStyle(document.documentElement);
    const hasCSSVars = rootStyle.getPropertyValue('--primary-color') !== '';
    results.push({
        name: 'CSS Variables',
        pass: hasCSSVars,
        message: hasCSSVars ? 'مدعوم' : 'غير مدعوم'
    });

    // اختبار 4: Font Loading
    const fontLoaded = document.fonts.check('1em Cairo') || 
                      document.fonts.check('1em "Cairo"');
    results.push({
        name: 'تحميل الخطوط',
        pass: fontLoaded,
        message: fontLoaded ? 'الخطوط محملة' : 'مشكلة في تحميل الخطوط'
    });

    // اختبار 5: Touch Support
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    results.push({
        name: 'دعم اللمس',
        pass: hasTouch || window.innerWidth > 768,
        message: hasTouch ? 'مدعوم' : 'غير مدعوم (قد يكون طبيعي على Desktop)'
    });

    // اختبار 6: RTL Support
    const isRTL = document.documentElement.dir === 'rtl' || 
                 window.getComputedStyle(document.body).direction === 'rtl';
    results.push({
        name: 'دعم RTL',
        pass: isRTL,
        message: isRTL ? 'مدعوم' : 'غير مدعوم'
    });

    // اختبار 7: Safe Area Insets
    const hasSafeArea = CSS.supports('padding', 'max(0px)') || 
                       CSS.supports('padding', 'env(safe-area-inset-top)');
    results.push({
        name: 'Safe Area Insets',
        pass: hasSafeArea,
        message: hasSafeArea ? 'مدعوم' : 'غير مدعوم'
    });

    // اختبار 8: Flexbox Support
    const hasFlexbox = CSS.supports('display', 'flex');
    results.push({
        name: 'Flexbox',
        pass: hasFlexbox,
        message: hasFlexbox ? 'مدعوم' : 'غير مدعوم'
    });

    // اختبار 9: Grid Support
    const hasGrid = CSS.supports('display', 'grid');
    results.push({
        name: 'CSS Grid',
        pass: hasGrid,
        message: hasGrid ? 'مدعوم' : 'غير مدعوم'
    });

    // اختبار 10: Zoom Support
    const zoomLevel = window.devicePixelRatio || 1;
    results.push({
        name: 'دعم Zoom',
        pass: true,
        message: `مستوى Zoom: ${Math.round(zoomLevel * 100)}%`
    });

    // عرض النتائج
    contentContainer.innerHTML = '';
    results.forEach(result => {
        const item = document.createElement('div');
        item.className = `test-result-item ${result.pass ? 'pass' : 'fail'}`;
        item.innerHTML = `
            <strong>${result.name}:</strong> ${result.message}
        `;
        contentContainer.appendChild(item);
    });

    // إحصائيات
    const passed = results.filter(r => r.pass).length;
    const total = results.length;
    const summary = document.createElement('div');
    summary.style.marginTop = '1rem';
    summary.style.padding = '1rem';
    summary.style.background = passed === total ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)';
    summary.style.borderRadius = '8px';
    summary.innerHTML = `
        <h3>ملخص النتائج:</h3>
        <p><strong>نجح:</strong> ${passed} / ${total}</p>
        <p><strong>فشل:</strong> ${total - passed} / ${total}</p>
        <p><strong>نسبة النجاح:</strong> ${Math.round((passed / total) * 100)}%</p>
    `;
    contentContainer.appendChild(summary);
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    updateBrowserInfo();
    runDesignTests();
    runResponsiveTests();
    runBrowserTests();

    // تحديث Viewport عند تغيير الحجم
    window.addEventListener('resize', () => {
        updateViewportInfo();
        runDesignTests();
        runResponsiveTests();
    });

    // تحديث دوري
    setInterval(updateViewportInfo, 1000);
});
