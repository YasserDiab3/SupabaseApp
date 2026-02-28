/**
 * Script to reduce !important usage in CSS
 * يحلل ويقلل استخدام !important في ملف CSS
 */

const fs = require('fs');
const path = require('path');

const CSS_FILE = path.join(__dirname, 'styles.css');
const OUTPUT_FILE = path.join(__dirname, 'styles-optimized.css');

console.log('Analyzing !important usage...\n');

const css = fs.readFileSync(CSS_FILE, 'utf8');
const lines = css.split('\n');

// إحصائيات
let importantCount = 0;
let removedCount = 0;
const importantLines = [];

// تحليل الاستخدام
lines.forEach((line, index) => {
    if (line.includes('!important')) {
        importantCount++;
        importantLines.push({
            line: index + 1,
            content: line.trim()
        });
    }
});

console.log(`Total !important found: ${importantCount}\n`);

// تصنيف الاستخدامات
const categories = {
    necessary: [], // ضروري (مثل overrides للأنماط المدمجة)
    canRemove: [], // يمكن إزالته
    needsRefactor: [] // يحتاج إعادة هيكلة
};

importantLines.forEach(item => {
    const line = item.content;
    
    // حالات ضرورية
    if (line.includes('display: none') || 
        line.includes('display: flex') ||
        line.includes('position: fixed') ||
        line.includes('z-index') ||
        line.includes('overflow: hidden') ||
        line.match(/margin-right:\s*0/) ||
        line.match(/transform:\s*translateX/)) {
        categories.necessary.push(item);
    }
    // حالات يمكن إزالتها
    else if (line.includes('width:') || 
             line.includes('height:') ||
             line.includes('padding:') ||
             line.includes('font-size:') ||
             line.includes('color:') ||
             line.includes('background:')) {
        categories.canRemove.push(item);
    }
    // حالات تحتاج إعادة هيكلة
    else {
        categories.needsRefactor.push(item);
    }
});

console.log('Categorization:');
console.log(`  Necessary: ${categories.necessary.length}`);
console.log(`  Can Remove: ${categories.canRemove.length}`);
console.log(`  Needs Refactor: ${categories.needsRefactor.length}\n`);

// إنشاء نسخة محسنة (بدون إزالة تلقائية - فقط تقرير)
const optimizedCSS = css.split('\n').map((line, index) => {
    if (line.includes('!important')) {
        const item = importantLines.find(i => i.line === index + 1);
        if (item && categories.canRemove.some(c => c.line === item.line)) {
            // إزالة !important من السطور التي يمكن إزالتها
            const newLine = line.replace(/\s*!important\s*/g, ' ');
            removedCount++;
            return newLine;
        }
    }
    return line;
}).join('\n');

// حفظ النسخة المحسنة
fs.writeFileSync(OUTPUT_FILE, optimizedCSS, 'utf8');

console.log(`\n✅ Optimized CSS saved to: ${OUTPUT_FILE}`);
console.log(`   Removed !important from ${removedCount} lines`);
console.log(`   Remaining !important: ${importantCount - removedCount}`);

// إنشاء تقرير مفصل
const report = {
    total: importantCount,
    removed: removedCount,
    remaining: importantCount - removedCount,
    reduction: ((removedCount / importantCount) * 100).toFixed(2) + '%',
    categories: {
        necessary: categories.necessary.length,
        canRemove: categories.canRemove.length,
        needsRefactor: categories.needsRefactor.length
    },
    details: {
        necessary: categories.necessary.slice(0, 10),
        canRemove: categories.canRemove.slice(0, 10)
    }
};

fs.writeFileSync(
    path.join(__dirname, 'important-usage-report.json'),
    JSON.stringify(report, null, 2),
    'utf8'
);

console.log('\n📊 Detailed report saved to: important-usage-report.json');

