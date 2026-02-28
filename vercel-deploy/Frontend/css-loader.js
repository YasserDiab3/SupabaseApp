/**
 * CSS Loader - Dynamic CSS Module Loader
 * يحمل ملفات CSS بشكل ديناميكي مع دعم Minification
 */

(function() {
    'use strict';

    const CSS_MODULES = [
        'css/variables.css',
        'css/base.css',
        'css/components.css',
        'css/layout.css',
        'css/responsive.css',
        'css/modules.css'
    ];

    const isProduction = window.location.hostname !== 'localhost' && 
                         window.location.hostname !== '127.0.0.1' &&
                         !window.location.hostname.includes('dev');
    const safeLog = (...args) => {
        try {
            if (typeof window !== 'undefined' && window.Utils && typeof window.Utils.safeLog === 'function') {
                window.Utils.safeLog(...args);
                return;
            }
        } catch (e) { /* ignore */ }
        if (!isProduction) {
            try { console.log(...args); } catch (e) { /* ignore */ }
        }
    };

    /**
     * تحميل ملف CSS
     */
    function loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            const isCssFile = href.endsWith('.css');
            const minHref = (href.startsWith('css/') && isCssFile)
                ? href.replace(/^css\//, 'css/min/').replace(/\.css$/, '.min.css')
                : (isCssFile ? href.replace(/\.css$/, '.min.css') : href);
            link.href = isProduction && isCssFile ? minHref : href;
            
            link.onload = () => resolve(link);
            link.onerror = () => {
                // Fallback: جرب الملف الأصلي إذا فشل تحميل .min.css
                if (link.href.includes('.min.css')) {
                    link.href = href;
                    link.onload = () => resolve(link);
                    link.onerror = () => reject(new Error(`Failed to load ${href}`));
                } else {
                    reject(new Error(`Failed to load ${href}`));
                }
            };
            
            document.head.appendChild(link);
        });
    }

    /**
     * تحميل جميع ملفات CSS
     */
    async function loadAllCSS() {
        try {
            // تحقق من وجود ملف styles.css كـ fallback
            const hasMainCSS = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                .some(link => link.href.includes('styles.css'));

            if (hasMainCSS && !isProduction) {
                safeLog('Using main styles.css file (development mode)');
                return;
            }

            // تحميل الملفات المقسمة
            const loadPromises = CSS_MODULES.map(module => loadCSS(module));
            await Promise.all(loadPromises);
            safeLog('All CSS modules loaded successfully');
        } catch (error) {
            console.error('Error loading CSS modules:', error);
            // Fallback: تحميل الملف الرئيسي
            if (!hasMainCSS) {
                loadCSS('styles.css').catch(err => {
                    console.error('Failed to load fallback CSS:', err);
                });
            }
        }
    }

    // تحميل CSS عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllCSS);
    } else {
        loadAllCSS();
    }
})();

