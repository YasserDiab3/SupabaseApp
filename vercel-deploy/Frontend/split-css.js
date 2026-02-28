/**
 * CSS Splitter Script
 * يقسم ملف CSS الكبير إلى ملفات أصغر حسب الأقسام
 */

const fs = require('fs');
const path = require('path');

const CSS_FILE = path.join(__dirname, 'styles.css');
const CSS_DIR = path.join(__dirname, 'css');

// إنشاء مجلد CSS إذا لم يكن موجوداً
if (!fs.existsSync(CSS_DIR)) {
    fs.mkdirSync(CSS_DIR, { recursive: true });
}

console.log('Reading CSS file...\n');
const css = fs.readFileSync(CSS_FILE, 'utf8');
const lines = css.split('\n');

// تعريف الأقسام
const sections = {
    'variables.css': {
        start: /=====\s*CSS Variables|=====\s*Font Awesome/i,
        end: /=====\s*Dark Mode Variables|=====\s*Base Styles/i,
        include: [/^:root/, /^\[data-theme="dark"\]/, /^\.fa/, /^i\[class/]
    },
    'base.css': {
        start: /=====\s*Base Styles|=====\s*Dark Mode Variables/i,
        end: /=====\s*Login Screen|=====\s*Form Styles/i,
        include: [/^\*/, /^html/, /^body/, /^\.font-cairo/]
    },
    'components.css': {
        start: /=====\s*Form Styles|=====\s*Buttons|=====\s*Login Screen/i,
        end: /=====\s*Main App Layout|=====\s*Sidebar/i,
        include: [/^\.form-/, /^\.btn-/, /^\.login-/, /^\.password-toggle/]
    },
    'layout.css': {
        start: /=====\s*Main App Layout|=====\s*Sidebar/i,
        end: /=====\s*Main Content|=====\s*Activity List/i,
        include: [/^\.main-app/, /^\.app-shell/, /^\.sidebar/, /^\.navigation/, /^\.nav-item/]
    },
    'utilities.css': {
        start: /=====\s*Utility|=====\s*Additional/i,
        end: /=====\s*Responsive|=====\s*Media/i,
        include: [/^\.hide-/, /^\.show-/, /^\.full-width/]
    },
    'responsive.css': {
        start: /@media/,
        end: null, // حتى نهاية الملف
        include: [/^@media/]
    },
    'themes.css': {
        start: /=====\s*Dark Mode|\[data-theme="dark"\]/i,
        end: /=====\s*Base|=====\s*Login/i,
        include: [/^\[data-theme="dark"\]/]
    },
    'modules.css': {
        start: /=====\s*Module|=====\s*KPI|=====\s*Stats/i,
        end: null,
        include: [/^\.kpi-/, /^\.stat-/, /^\.module-/, /^\.shm-/]
    }
};

// دالة لاستخراج قسم معين
function extractSection(sectionName, config) {
    const content = [];
    let inSection = false;
    let braceCount = 0;
    let sectionStarted = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // بداية القسم
        if (!sectionStarted && config.start && config.start.test(line)) {
            inSection = true;
            sectionStarted = true;
            content.push(line);
            continue;
        }

        // إذا كنا داخل القسم
        if (inSection || sectionStarted) {
            // التحقق من نهاية القسم
            if (config.end && config.end.test(line) && sectionStarted && braceCount === 0) {
                break;
            }

            // تتبع الأقواس
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;

            // إضافة السطر إذا كان يطابق المعايير
            if (config.include && config.include.some(regex => regex.test(trimmed))) {
                content.push(line);
            } else if (!config.include) {
                // إذا لم يكن هناك معايير محددة، أضف كل شيء
                content.push(line);
            } else if (sectionStarted && braceCount > 0) {
                // إذا كنا داخل قوس، أضف السطر
                content.push(line);
            }
        }
    }

    return content.join('\n');
}

// طريقة أبسط: تقسيم حسب التعليقات
function splitByComments() {
    const files = {
        'variables.css': [],
        'base.css': [],
        'components.css': [],
        'layout.css': [],
        'utilities.css': [],
        'responsive.css': [],
        'themes.css': [],
        'modules.css': []
    };

    let currentFile = null;
    let currentContent = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // اكتشاف بداية قسم جديد
        if (trimmed.startsWith('/* =====')) {
            // حفظ المحتوى السابق
            if (currentFile && currentContent.length > 0) {
                files[currentFile].push(...currentContent);
                currentContent = [];
            }

            // تحديد الملف المناسب
            if (trimmed.includes('Variables') || trimmed.includes('Font Awesome')) {
                currentFile = 'variables.css';
            } else if (trimmed.includes('Base Styles')) {
                currentFile = 'base.css';
            } else if (trimmed.includes('Form') || trimmed.includes('Button') || trimmed.includes('Login')) {
                currentFile = 'components.css';
            } else if (trimmed.includes('Main App') || trimmed.includes('Sidebar') || trimmed.includes('Navigation')) {
                currentFile = 'layout.css';
            } else if (trimmed.includes('Utility') || trimmed.includes('Additional')) {
                currentFile = 'utilities.css';
            } else if (trimmed.includes('Dark Mode') || trimmed.includes('Theme')) {
                currentFile = 'themes.css';
            } else if (trimmed.includes('KPI') || trimmed.includes('Stats') || trimmed.includes('Module')) {
                currentFile = 'modules.css';
            } else if (trimmed.includes('@media') || trimmed.includes('Responsive')) {
                currentFile = 'responsive.css';
            }
        }

        // إضافة السطر للمحتوى الحالي
        if (currentFile) {
            currentContent.push(line);
        } else {
            // إذا لم يكن هناك ملف محدد، أضف للـ base
            if (!files['base.css'].length || currentContent.length > 0) {
                files['base.css'].push(line);
            }
        }

        // حفظ @media queries في responsive.css
        if (trimmed.startsWith('@media')) {
            currentFile = 'responsive.css';
        }
    }

    // حفظ آخر محتوى
    if (currentFile && currentContent.length > 0) {
        files[currentFile].push(...currentContent);
    }

    return files;
}

console.log('Splitting CSS file...\n');

const splitFiles = splitByComments();

// كتابة الملفات
Object.keys(splitFiles).forEach(fileName => {
    const content = splitFiles[fileName].join('\n');
    if (content.trim().length > 0) {
        const filePath = path.join(CSS_DIR, fileName);
        fs.writeFileSync(filePath, content, 'utf8');
        const size = (content.length / 1024).toFixed(2);
        console.log(`✓ Created: ${fileName} (${size} KB)`);
    } else {
        console.log(`⚠ Skipped: ${fileName} (empty)`);
    }
});

// إنشاء ملف index يجمع كل شيء (للتوافق)
const indexContent = Object.keys(splitFiles)
    .map(fileName => `/* Import ${fileName} */\n@import url('${fileName}');`)
    .join('\n\n');

fs.writeFileSync(
    path.join(CSS_DIR, 'index.css'),
    indexContent,
    'utf8'
);

console.log('\n✅ CSS splitting completed!');
console.log(`   Created ${Object.keys(splitFiles).length} files in css/ directory`);

