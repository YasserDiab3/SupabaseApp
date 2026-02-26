/**
 * فحص توافق التطبيق للنشر على Cloudflare Pages و Netlify
 * Deployment Compatibility Checker
 */

(function() {
    'use strict';
    
    const DeploymentChecker = {
        results: {
            netlify: { compatible: true, issues: [] },
            cloudflare: { compatible: true, issues: [] }
        },
        
        /**
         * فحص الملفات المطلوبة
         */
        checkRequiredFiles() {
            const requiredFiles = {
                netlify: ['netlify.toml', '_redirects'],
                cloudflare: ['_headers', '_redirects']
            };
            
            // ملاحظة: هذا الفحص يعمل فقط في بيئة Node.js
            // في المتصفح، سيتم فحص الملفات عبر fetch
            console.log('📋 الملفات المطلوبة:');
            console.log('Netlify:', requiredFiles.netlify);
            console.log('Cloudflare:', requiredFiles.cloudflare);
        },
        
        /**
         * فحص Service Worker
         */
        checkServiceWorker() {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    if (registrations.length > 0) {
                        console.log('✅ Service Worker مسجل:', registrations.length);
                        registrations.forEach((reg, index) => {
                            console.log(`  ${index + 1}. Scope: ${reg.scope}`);
                            console.log(`     State: ${reg.active?.state || 'N/A'}`);
                        });
                    } else {
                        console.warn('⚠️ Service Worker غير مسجل');
                        this.results.netlify.issues.push('Service Worker غير مسجل');
                        this.results.cloudflare.issues.push('Service Worker غير مسجل');
                    }
                });
            } else {
                console.warn('⚠️ Service Worker غير مدعوم في هذا المتصفح');
            }
        },
        
        /**
         * فحص المسارات
         */
        checkPaths() {
            const basePath = window.location.pathname.includes('/Frontend/') ? '/Frontend' : '';
            console.log('📁 المسار الأساسي:', basePath || '/');
            
            // فحص المسارات النسبية
            const testPaths = [
                '/index.html',
                '/styles.css',
                '/js/app-bootstrap.js',
                '/service-worker.js'
            ];
            
            console.log('🔍 فحص المسارات:');
            testPaths.forEach(path => {
                const fullPath = basePath + path;
                fetch(fullPath, { method: 'HEAD' })
                    .then(response => {
                        if (response.ok) {
                            console.log(`  ✅ ${fullPath}`);
                        } else {
                            console.warn(`  ⚠️ ${fullPath} - ${response.status}`);
                        }
                    })
                    .catch(error => {
                        console.warn(`  ❌ ${fullPath} - ${error.message}`);
                    });
            });
        },
        
        /**
         * فحص CORS
         */
        checkCORS() {
            console.log('🌐 فحص CORS:');
            console.log('  Origin:', window.location.origin);
            console.log('  Protocol:', window.location.protocol);
            
            // فحص إذا كان CORS مفتوح (تحذير أمني)
            console.warn('  ⚠️ تحذير: تأكد من تحديث CORS headers للإنتاج');
            console.warn('     استبدل "*" بنطاقك الفعلي في netlify.toml و _headers');
        },
        
        /**
         * فحص SPA Routing
         */
        checkSPARouting() {
            console.log('🔄 فحص SPA Routing:');
            const currentPath = window.location.pathname;
            console.log('  المسار الحالي:', currentPath);
            
            if (currentPath === '/' || currentPath === '/index.html') {
                console.log('  ✅ المسار الأساسي يعمل');
            } else {
                console.log('  ℹ️ إذا كان SPA routing يعمل، يجب أن تعمل جميع المسارات');
            }
        },
        
        /**
         * فحص تكامل الخادم (Script)
         */
        checkGoogleAppsScript() {
            console.log('🔗 فحص إعدادات الخادم:');
            
            // محاولة الوصول إلى AppState إذا كان متاحاً
            if (typeof AppState !== 'undefined' && AppState.googleConfig) {
                const config = AppState.googleConfig.appsScript;
                if (config && config.enabled && config.scriptUrl) {
                    const url = config.scriptUrl;
                    console.log('  ✅ الخادم مفعّل');
                    console.log('  URL:', url);
                    
                    if (url.endsWith('/exec')) {
                        console.log('  ✅ URL صحيح (ينتهي بـ /exec)');
                    } else if (url.endsWith('/dev')) {
                        console.warn('  ⚠️ URL ينتهي بـ /dev - يجب أن يكون /exec');
                        this.results.netlify.issues.push('رابط الخادم ينتهي بـ /dev');
                        this.results.cloudflare.issues.push('رابط الخادم ينتهي بـ /dev');
                    } else {
                        console.warn('  ⚠️ URL قد يكون غير صحيح');
                    }
                } else {
                    console.warn('  ⚠️ الخادم غير مفعّل أو الرابط غير محدد');
                }
            } else {
                console.log('  ℹ️ AppState غير متاح بعد - سيتم فحصه بعد تحميل التطبيق');
            }
        },
        
        /**
         * تشغيل جميع الفحوصات
         */
        runAllChecks() {
            console.log('🚀 بدء فحص التوافق للنشر...\n');
            
            this.checkRequiredFiles();
            console.log('');
            
            this.checkServiceWorker();
            console.log('');
            
            this.checkPaths();
            console.log('');
            
            this.checkCORS();
            console.log('');
            
            this.checkSPARouting();
            console.log('');
            
            // انتظار تحميل التطبيق قبل فحص الخادم
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => this.checkGoogleAppsScript(), 2000);
                });
            } else {
                setTimeout(() => this.checkGoogleAppsScript(), 2000);
            }
            
            console.log('\n✅ اكتمل الفحص');
            console.log('\n📊 النتائج:');
            console.log('Netlify:', this.results.netlify.compatible ? '✅ متوافق' : '❌ غير متوافق');
            if (this.results.netlify.issues.length > 0) {
                console.log('  المشاكل:', this.results.netlify.issues);
            }
            console.log('Cloudflare:', this.results.cloudflare.compatible ? '✅ متوافق' : '❌ غير متوافق');
            if (this.results.cloudflare.issues.length > 0) {
                console.log('  المشاكل:', this.results.cloudflare.issues);
            }
        }
    };
    
    // تشغيل الفحص تلقائياً عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => DeploymentChecker.runAllChecks(), 1000);
        });
    } else {
        setTimeout(() => DeploymentChecker.runAllChecks(), 1000);
    }
    
    // جعل DeploymentChecker متاحاً عالمياً للاستخدام اليدوي
    window.DeploymentChecker = DeploymentChecker;
    
})();
