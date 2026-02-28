/**
 * Script to check for 404 errors and missing resources
 * Paste this in the browser console (F12) to diagnose 404 issues
 */

(function() {
    console.log('🔍 بدء فحص الموارد المفقودة...\n');
    
    const errors = [];
    const warnings = [];
    
    // 1. Check all script tags
    console.log('📜 فحص ملفات JavaScript...');
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
        const src = script.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('//')) {
            // Relative path - check if it would load
            fetch(src, { method: 'HEAD' })
                .then(response => {
                    if (!response.ok) {
                        errors.push(`❌ Script not found: ${src} (Status: ${response.status})`);
                        console.error(`❌ Script not found: ${src}`);
                    } else {
                        console.log(`✅ Script found: ${src}`);
                    }
                })
                .catch(err => {
                    errors.push(`❌ Error checking script: ${src} - ${err.message}`);
                    console.error(`❌ Error checking script: ${src}`, err);
                });
        }
    });
    
    // 2. Check all link tags (CSS, etc.)
    console.log('\n📄 فحص ملفات CSS والموارد الأخرى...');
    const links = document.querySelectorAll('link[href]');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('data:')) {
            fetch(href, { method: 'HEAD' })
                .then(response => {
                    if (!response.ok) {
                        errors.push(`❌ Resource not found: ${href} (Status: ${response.status})`);
                        console.error(`❌ Resource not found: ${href}`);
                    } else {
                        console.log(`✅ Resource found: ${href}`);
                    }
                })
                .catch(err => {
                    errors.push(`❌ Error checking resource: ${href} - ${err.message}`);
                    console.error(`❌ Error checking resource: ${href}`, err);
                });
        }
    });
    
    // 3. Check for backend script URL
    console.log('\n🔗 فحص إعدادات رابط الخادم...');
    if (typeof AppState !== 'undefined' && AppState.googleConfig) {
        const scriptUrl = AppState.googleConfig?.appsScript?.scriptUrl;
        if (scriptUrl) {
            if (scriptUrl.includes('/dev')) {
                warnings.push('⚠️ رابط الخادم ينتهي بـ /dev - يُفضّل أن ينتهي بـ /exec');
                console.warn('⚠️ رابط الخادم ينتهي بـ /dev - يُفضّل أن ينتهي بـ /exec');
            } else if (scriptUrl.includes('/exec')) {
                console.log('✅ رابط الخادم صحيح (ينتهي بـ /exec)');
            } else {
            warnings.push('⚠️ رابط الخادم غير معروف');
            console.warn('⚠️ رابط الخادم غير معروف:', scriptUrl);
            }
        } else {
            warnings.push('⚠️ رابط الخادم غير محدد');
            console.warn('⚠️ رابط الخادم غير محدد');
        }
    } else {
        warnings.push('⚠️ AppState غير محمل بعد - انتظر قليلاً ثم أعد تشغيل هذا السكريبت');
        console.warn('⚠️ AppState غير محمل بعد');
    }
    
    // 4. Check modules that should be loaded
    console.log('\n📦 فحص الموديولات المطلوبة...');
    const modulesToCheck = [
        'js/modules/app-utils.js',
        'js/modules/services/data-manager.js',
        'js/modules/services/google-integration.js',
        'js/modules/modules-loader.js',
        'js/app-bootstrap.js',
        'login-init-fixed.js',
        'styles.css'
    ];
    
    modulesToCheck.forEach(module => {
        fetch(module, { method: 'HEAD' })
            .then(response => {
                if (!response.ok) {
                    errors.push(`❌ Required file not found: ${module} (Status: ${response.status})`);
                    console.error(`❌ Required file not found: ${module}`);
                } else {
                    console.log(`✅ Required file found: ${module}`);
                }
            })
            .catch(err => {
                errors.push(`❌ Error checking file: ${module} - ${err.message}`);
                console.error(`❌ Error checking file: ${module}`, err);
            });
    });
    
    // 5. Wait a bit then show summary
    setTimeout(() => {
        console.log('\n\n📊 ملخص الفحص:');
        console.log('='.repeat(50));
        
        if (errors.length === 0 && warnings.length === 0) {
            console.log('✅ لم يتم العثور على مشاكل واضحة');
        }
        
        if (errors.length > 0) {
            console.log(`\n❌ الأخطاء (${errors.length}):`);
            errors.forEach(err => console.log('  ' + err));
        }
        
        if (warnings.length > 0) {
            console.log(`\n⚠️ التحذيرات (${warnings.length}):`);
            warnings.forEach(warn => console.log('  ' + warn));
        }
        
        console.log('\n💡 نصيحة: تحقق من Network tab في Developer Tools لرؤية جميع الطلبات الفاشلة');
        console.log('='.repeat(50));
    }, 2000);
    
    // 6. Monitor network requests
    console.log('\n📡 مراقبة طلبات الشبكة...');
    console.log('💡 افتح Network tab في Developer Tools لرؤية الطلبات الفاشلة في الوقت الفعلي');
    
    return {
        errors,
        warnings,
        checkComplete: false
    };
})();

