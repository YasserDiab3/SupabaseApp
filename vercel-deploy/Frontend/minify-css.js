/**
 * CSS Minification Script
 * يضغط ملفات CSS للإنتاج
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CSS_DIR = path.join(__dirname, 'css');
const OUTPUT_DIR = path.join(__dirname, 'css', 'min');

// إنشاء مجلد الإخراج
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// قائمة ملفات CSS
const cssFiles = [
    'variables.css',
    'base.css',
    'components.css',
    'layout.css',
    'responsive.css',
    'modules.css'
];

console.log('Starting CSS minification...\n');

cssFiles.forEach(file => {
    const inputPath = path.join(CSS_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file.replace('.css', '.min.css'));
    
    if (!fs.existsSync(inputPath)) {
        console.log(`⚠️  Skipping ${file} (not found)`);
        return;
    }

    try {
        // استخدام cssnano عبر postcss-cli
        const command = `npx postcss "${inputPath}" --use cssnano --no-map -o "${outputPath}"`;
        execSync(command, { stdio: 'inherit' });
        console.log(`✓ Minified: ${file} → ${path.basename(outputPath)}`);
    } catch (error) {
        console.error(`✗ Error minifying ${file}:`, error.message);
    }
});

// Minify main styles.css if exists
const mainCSS = path.join(__dirname, 'styles.css');
if (fs.existsSync(mainCSS)) {
    const outputPath = path.join(__dirname, 'styles.min.css');
    try {
        const command = `npx postcss "${mainCSS}" --use cssnano --no-map -o "${outputPath}"`;
        execSync(command, { stdio: 'inherit' });
        console.log(`✓ Minified: styles.css → styles.min.css`);
    } catch (error) {
        console.error(`✗ Error minifying styles.css:`, error.message);
    }
}

console.log('\n✅ CSS minification completed!');
