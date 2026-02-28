/* ========================================
   نظام تحميل الموديولات الديناميكية
   Dynamic Module Loader System
   ======================================== */

/**
 * نظام تحميل الموديولات الديناميكية
 * يسمح بتحميل وإعادة تحميل الموديولات بدون إعادة تحميل الصفحة
 */
const dmlLog = (...args) => {
    try {
        if (typeof Utils !== 'undefined' && typeof Utils.safeLog === 'function') {
            Utils.safeLog(...args);
        }
    } catch (e) { /* ignore */ }
};

const DynamicModuleLoader = {
    // الموديولات المحملة
    loadedModules: new Map(),
    
    // سجل التحميل
    loadHistory: [],

    /**
     * تحميل موديول جديد
     */
    async loadModule(modulePath, moduleName, options = {}) {
        try {
            dmlLog(`📦 تحميل الموديول: ${moduleName} من ${modulePath}`);
            
            // التحقق من وجود الموديول
            if (this.loadedModules.has(moduleName)) {
                console.warn(`⚠️ الموديول ${moduleName} محمل بالفعل`);
                if (!options.forceReload) {
                    return { success: true, message: 'الموديول محمل بالفعل', cached: true };
                }
                // إعادة التحميل إذا طُلب
                await this.unloadModule(moduleName);
            }
            
            // تحميل الموديول
            const moduleCode = await this.fetchModule(modulePath);
            
            // تنفيذ الموديول
            await this.executeModule(moduleCode, moduleName, modulePath);
            
            // حفظ في السجل
            this.loadedModules.set(moduleName, {
                path: modulePath,
                loadedAt: new Date().toISOString(),
                version: options.version || '1.0.0'
            });
            
            this.addToHistory('load', moduleName, modulePath, true);
            
            dmlLog(`✅ تم تحميل الموديول: ${moduleName}`);
            
            return { success: true, message: `تم تحميل ${moduleName} بنجاح` };
        } catch (error) {
            console.error(`❌ خطأ في تحميل الموديول ${moduleName}:`, error);
            this.addToHistory('load', moduleName, modulePath, false, error.message);
            throw error;
        }
    },

    /**
     * إعادة تحميل موديول
     */
    async reloadModule(modulePath, moduleName) {
        try {
            dmlLog(`🔄 إعادة تحميل الموديول: ${moduleName}`);
            
            // إلغاء تحميل الموديول القديم
            await this.unloadModule(moduleName);
            
            // تحميل الموديول الجديد
            await this.loadModule(modulePath, moduleName, { forceReload: true });
            
            return { success: true, message: `تم إعادة تحميل ${moduleName} بنجاح` };
        } catch (error) {
            console.error(`❌ خطأ في إعادة تحميل الموديول ${moduleName}:`, error);
            throw error;
        }
    },

    /**
     * إلغاء تحميل موديول
     */
    async unloadModule(moduleName) {
        try {
            dmlLog(`🗑️ إلغاء تحميل الموديول: ${moduleName}`);
            
            if (!this.loadedModules.has(moduleName)) {
                console.warn(`⚠️ الموديول ${moduleName} غير محمل`);
                return { success: true, message: 'الموديول غير محمل' };
            }
            
            // استدعاء دالة التنظيف إذا كانت موجودة
            if (typeof window[moduleName] !== 'undefined') {
                if (typeof window[moduleName].cleanup === 'function') {
                    try {
                        await window[moduleName].cleanup();
                    } catch (cleanupError) {
                        console.warn(`⚠️ خطأ في تنظيف الموديول ${moduleName}:`, cleanupError);
                    }
                }
                
                // حذف الكائن من window
                delete window[moduleName];
            }
            
            // إزالة عنصر script إذا كان موجوداً
            const scriptElement = document.querySelector(`script[data-module="${moduleName}"]`);
            if (scriptElement) {
                scriptElement.remove();
            }
            
            // إزالة من السجل
            const moduleInfo = this.loadedModules.get(moduleName);
            this.loadedModules.delete(moduleName);
            
            this.addToHistory('unload', moduleName, moduleInfo?.path, true);
            
            dmlLog(`✅ تم إلغاء تحميل الموديول: ${moduleName}`);
            
            return { success: true, message: `تم إلغاء تحميل ${moduleName} بنجاح` };
        } catch (error) {
            console.error(`❌ خطأ في إلغاء تحميل الموديول ${moduleName}:`, error);
            this.addToHistory('unload', moduleName, null, false, error.message);
            throw error;
        }
    },

    /**
     * جلب كود الموديول
     */
    async fetchModule(modulePath) {
        try {
            // إذا كان modulePath هو كود مباشر
            if (modulePath.startsWith('data:') || modulePath.startsWith('javascript:')) {
                return modulePath;
            }
            
            // جلب من URL
            const response = await fetch(modulePath, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`فشل جلب الموديول: ${response.statusText}`);
            }
            
            const code = await response.text();
            return code;
        } catch (error) {
            throw new Error(`فشل جلب الموديول من ${modulePath}: ${error.message}`);
        }
    },

    /**
     * تنفيذ كود الموديول
     */
    async executeModule(moduleCode, moduleName, modulePath) {
        return new Promise((resolve, reject) => {
            try {
                // إنشاء عنصر script
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.setAttribute('data-module', moduleName);
                script.setAttribute('data-module-path', modulePath);
                
                // إذا كان الكود مباشر
                if (moduleCode.startsWith('data:') || moduleCode.startsWith('javascript:')) {
                    script.textContent = moduleCode;
                } else {
                    script.textContent = moduleCode;
                }
                
                // معالجة الأخطاء
                script.onerror = (error) => {
                    reject(new Error(`فشل تنفيذ الموديول ${moduleName}: ${error.message || 'خطأ غير معروف'}`));
                };
                
                // عند التحميل الناجح
                script.onload = () => {
                    // تهيئة الموديول إذا كان لديه دالة init
                    if (typeof window[moduleName] !== 'undefined') {
                        if (typeof window[moduleName].init === 'function') {
                            try {
                                const initResult = window[moduleName].init();
                                if (initResult instanceof Promise) {
                                    initResult.then(() => resolve()).catch(reject);
                                } else {
                                    resolve();
                                }
                            } catch (initError) {
                                console.warn(`⚠️ خطأ في تهيئة الموديول ${moduleName}:`, initError);
                                resolve(); // نستمر حتى لو فشلت التهيئة
                            }
                        } else {
                            resolve();
                        }
                    } else {
                        resolve();
                    }
                };
                
                // إضافة للصفحة
                document.head.appendChild(script);
                
                // إذا كان الكود نصي مباشر، يتم تنفيذه فوراً
                if (script.textContent) {
                    // محاولة تنفيذ مباشر
                    try {
                        // استخدام Function constructor لتجنب مشاكل النطاق
                        const func = new Function(moduleCode);
                        func();
                        
                        // تهيئة الموديول
                        if (typeof window[moduleName] !== 'undefined') {
                            if (typeof window[moduleName].init === 'function') {
                                const initResult = window[moduleName].init();
                                if (initResult instanceof Promise) {
                                    initResult.then(() => resolve()).catch(reject);
                                } else {
                                    resolve();
                                }
                            } else {
                                resolve();
                            }
                        } else {
                            resolve();
                        }
                    } catch (execError) {
                        reject(new Error(`فشل تنفيذ كود الموديول: ${execError.message}`));
                    }
                }
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * إضافة للسجل
     */
    addToHistory(action, moduleName, modulePath, success, error = null) {
        const entry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            action, // 'load', 'unload', 'reload'
            moduleName,
            modulePath,
            success,
            error: error || null,
            user: AppState?.currentUser?.email || 'System'
        };
        
        this.loadHistory.unshift(entry);
        
        // الاحتفاظ بآخر 100 سجل
        if (this.loadHistory.length > 100) {
            this.loadHistory = this.loadHistory.slice(0, 100);
        }
    },

    /**
     * الحصول على قائمة الموديولات المحملة
     */
    getLoadedModules() {
        const modules = [];
        this.loadedModules.forEach((info, name) => {
            modules.push({
                name,
                path: info.path,
                loadedAt: info.loadedAt,
                version: info.version
            });
        });
        return modules;
    },

    /**
     * التحقق من وجود موديول
     */
    isModuleLoaded(moduleName) {
        return this.loadedModules.has(moduleName);
    },

    /**
     * الحصول على معلومات موديول
     */
    getModuleInfo(moduleName) {
        if (!this.loadedModules.has(moduleName)) {
            return null;
        }
        
        const info = this.loadedModules.get(moduleName);
        return {
            name: moduleName,
            ...info,
            exists: typeof window[moduleName] !== 'undefined'
        };
    },

    /**
     * تحميل عدة موديولات
     */
    async loadModules(modules) {
        const results = [];
        
        for (const module of modules) {
            try {
                const result = await this.loadModule(
                    module.path,
                    module.name,
                    module.options || {}
                );
                results.push({ module: module.name, success: true, result });
            } catch (error) {
                results.push({ module: module.name, success: false, error: error.message });
            }
        }
        
        return results;
    },

    /**
     * إعادة تحميل جميع الموديولات
     */
    async reloadAllModules() {
        const modules = Array.from(this.loadedModules.entries());
        const results = [];
        
        for (const [name, info] of modules) {
            try {
                await this.reloadModule(info.path, name);
                results.push({ module: name, success: true });
            } catch (error) {
                results.push({ module: name, success: false, error: error.message });
            }
        }
        
        return results;
    }
};

// تصدير للاستخدام العام
if (typeof window !== 'undefined') {
    window.DynamicModuleLoader = DynamicModuleLoader;
}


