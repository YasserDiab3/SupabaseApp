/**
 * CSS Build Script
 * يبني ملفات CSS الخاصة بالإنتاج بشكل متسق:
 * 1) (اختياري) إنشاء نسخة محسّنة من styles.css عبر reduce-important.js
 * 2) ضغط ملفات CSS إلى css/min/*.min.css و styles.min.css عبر minify-css.js
 *
 * ملاحظة: لا يغيّر طريقة تحميل الـ CSS داخل التطبيق تلقائياً.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: __dirname });
}

function exists(p) {
  return fs.existsSync(path.join(__dirname, p));
}

console.log('🏗️  Building CSS...\n');

if (!exists('styles.css')) {
  console.warn('⚠️ styles.css غير موجود - سيتم تخطي بعض الخطوات');
}

// 1) Generate optimized CSS (non-blocking)
if (exists('reduce-important.js') && exists('styles.css')) {
  try {
    console.log('1) Generating styles-optimized.css (reduce !important)...');
    run('node reduce-important.js');
  } catch (e) {
    console.warn('⚠️ فشل reduce-important.js - سيتم المتابعة');
  }
}

// 2) Minify (css/min + styles.min.css)
if (exists('minify-css.js')) {
  console.log('\n2) Minifying CSS...');
  run('node minify-css.js');
} else {
  console.error('❌ minify-css.js غير موجود - لا يمكن إتمام build');
  process.exitCode = 1;
}

console.log('\n✅ CSS build completed');


