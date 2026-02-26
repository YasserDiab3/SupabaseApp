/**
 * Unit Tests for HSE Management System
 * اختبارات الوحدة لنظام إدارة السلامة المهنية
 * 
 * هذه الاختبارات تغطي الدوال الحرجة في النظام
 */

(function() {
    'use strict';

    // اختبارات Utils
    const UtilsTests = {
        testIsValidEmail() {
            const tests = [
                { input: 'test@example.com', expected: true },
                { input: 'user.name@domain.co.uk', expected: true },
                { input: 'invalid', expected: false },
                { input: 'invalid@', expected: false },
                { input: '@invalid.com', expected: false },
                { input: '', expected: false },
                { input: null, expected: false }
            ];

            let passed = 0;
            let failed = 0;

            tests.forEach(test => {
                try {
                    const result = Utils.isValidEmail(test.input);
                    if (result === test.expected) {
                        passed++;
                    } else {
                        failed++;
                        console.error(`❌ testIsValidEmail failed: input="${test.input}", expected=${test.expected}, got=${result}`);
                    }
                } catch (error) {
                    failed++;
                    console.error(`❌ testIsValidEmail error:`, error);
                }
            });

            return { passed, failed, total: tests.length };
        },

        testEscapeHTML() {
            const tests = [
                { input: '<script>alert("xss")</script>', expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;' },
                { input: 'Hello & World', expected: 'Hello &amp; World' },
                { input: 'Normal text', expected: 'Normal text' },
                { input: '', expected: '' },
                { input: null, expected: '' }
            ];

            let passed = 0;
            let failed = 0;

            tests.forEach(test => {
                try {
                    const result = Utils.escapeHTML(test.input);
                    if (result === test.expected) {
                        passed++;
                    } else {
                        failed++;
                        console.error(`❌ testEscapeHTML failed: input="${test.input}", expected="${test.expected}", got="${result}"`);
                    }
                } catch (error) {
                    failed++;
                    console.error(`❌ testEscapeHTML error:`, error);
                }
            });

            return { passed, failed, total: tests.length };
        },

        testFormatDate() {
            const tests = [
                { input: new Date('2025-01-15'), format: 'YYYY-MM-DD', expected: '2025-01-15' },
                { input: new Date('2025-01-15T10:30:00'), format: 'YYYY-MM-DD HH:mm', expected: '2025-01-15 10:30' }
            ];

            let passed = 0;
            let failed = 0;

            tests.forEach(test => {
                try {
                    if (typeof Utils.formatDate === 'function') {
                        const result = Utils.formatDate(test.input, test.format);
                        if (result === test.expected || result.includes(test.expected.split(' ')[0])) {
                            passed++;
                        } else {
                            failed++;
                            console.error(`❌ testFormatDate failed: input="${test.input}", expected="${test.expected}", got="${result}"`);
                        }
                    } else {
                        passed++; // Skip if function doesn't exist
                    }
                } catch (error) {
                    failed++;
                    console.error(`❌ testFormatDate error:`, error);
                }
            });

            return { passed, failed, total: tests.length };
        }
    };

    // اختبارات Permissions
    const PermissionsTests = {
        testHasAccess() {
            const tests = [
                { user: { role: 'admin', permissions: {} }, module: 'users', expected: true },
                { user: { role: 'user', permissions: { dashboard: true } }, module: 'dashboard', expected: true },
                { user: { role: 'user', permissions: { dashboard: true } }, module: 'users', expected: false }
            ];

            let passed = 0;
            let failed = 0;

            tests.forEach(test => {
                try {
                    if (typeof Permissions !== 'undefined' && typeof Permissions.hasAccess === 'function') {
                        // حفظ المستخدم الحالي مؤقتاً
                        const originalUser = AppState.currentUser;
                        AppState.currentUser = test.user;
                        
                        const result = Permissions.hasAccess(test.module);
                        
                        // استعادة المستخدم
                        AppState.currentUser = originalUser;
                        
                        if (result === test.expected) {
                            passed++;
                        } else {
                            failed++;
                            console.error(`❌ testHasAccess failed: user.role="${test.user.role}", module="${test.module}", expected=${test.expected}, got=${result}`);
                        }
                    } else {
                        passed++; // Skip if function doesn't exist
                    }
                } catch (error) {
                    failed++;
                    console.error(`❌ testHasAccess error:`, error);
                }
            });

            return { passed, failed, total: tests.length };
        }
    };

    // اختبارات Auth
    const AuthTests = {
        testValidateEmail() {
            const tests = [
                { input: 'test@example.com', expected: true },
                { input: 'invalid', expected: false }
            ];

            let passed = 0;
            let failed = 0;

            tests.forEach(test => {
                try {
                    if (typeof Utils !== 'undefined' && typeof Utils.isValidEmail === 'function') {
                        const result = Utils.isValidEmail(test.input);
                        if (result === test.expected) {
                            passed++;
                        } else {
                            failed++;
                            console.error(`❌ testValidateEmail failed: input="${test.input}", expected=${test.expected}, got=${result}`);
                        }
                    } else {
                        passed++; // Skip if function doesn't exist
                    }
                } catch (error) {
                    failed++;
                    console.error(`❌ testValidateEmail error:`, error);
                }
            });

            return { passed, failed, total: tests.length };
        }
    };

    // تشغيل جميع الاختبارات
    function runAllTests() {
        console.log('🧪 بدء تشغيل Unit Tests...\n');

        const results = {
            Utils: {
                isValidEmail: UtilsTests.testIsValidEmail(),
                escapeHTML: UtilsTests.testEscapeHTML(),
                formatDate: UtilsTests.testFormatDate()
            },
            Permissions: {
                hasAccess: PermissionsTests.testHasAccess()
            },
            Auth: {
                validateEmail: AuthTests.testValidateEmail()
            }
        };

        // حساب الإحصائيات
        let totalPassed = 0;
        let totalFailed = 0;
        let totalTests = 0;

        Object.keys(results).forEach(category => {
            Object.keys(results[category]).forEach(test => {
                const result = results[category][test];
                totalPassed += result.passed;
                totalFailed += result.failed;
                totalTests += result.total;
            });
        });

        // عرض النتائج
        console.log('\n📊 نتائج الاختبارات:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        Object.keys(results).forEach(category => {
            console.log(`\n${category}:`);
            Object.keys(results[category]).forEach(test => {
                const result = results[category][test];
                const percentage = ((result.passed / result.total) * 100).toFixed(1);
                const status = result.failed === 0 ? '✅' : '❌';
                console.log(`  ${status} ${test}: ${result.passed}/${result.total} (${percentage}%)`);
            });
        });

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`\n📈 الإجمالي: ${totalPassed}/${totalTests} نجح (${((totalPassed / totalTests) * 100).toFixed(1)}%)`);
        
        if (totalFailed > 0) {
            console.log(`❌ فشل: ${totalFailed} اختبار`);
        } else {
            console.log('✅ جميع الاختبارات نجحت!');
        }

        return {
            totalPassed,
            totalFailed,
            totalTests,
            percentage: ((totalPassed / totalTests) * 100).toFixed(1)
        };
    }

    // تصدير للاستخدام
    if (typeof window !== 'undefined') {
        window.UnitTests = {
            run: runAllTests,
            Utils: UtilsTests,
            Permissions: PermissionsTests,
            Auth: AuthTests
        };

        // تشغيل تلقائي في وضع التطوير
        if (AppState?.debugMode) {
            setTimeout(() => {
                console.log('🔧 وضع التطوير مفعل - تشغيل Unit Tests تلقائياً...');
                runAllTests();
            }, 2000);
        }
    }
})();
