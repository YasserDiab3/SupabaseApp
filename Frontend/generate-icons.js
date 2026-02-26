/**
 * Script to generate PWA icons from SVG template
 * Run: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// SVG template for the icon
const svgTemplate = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" 
        font-size="${Math.floor(size * 0.625)}" fill="white" 
        font-family="Arial, sans-serif" font-weight="bold">HSE</text>
</svg>`;

// Icon sizes required for PWA
const iconSizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG files
console.log('Generating icon files...');
iconSizes.forEach(size => {
    const svgContent = svgTemplate(size);
    const filename = `icon-${size}x${size}.svg`;
    const filepath = path.join(iconsDir, filename);
    fs.writeFileSync(filepath, svgContent, 'utf8');
    console.log(`✓ Created ${filename}`);
});

console.log('\n✅ All icon files generated successfully!');
console.log('\nNote: SVG files have been created. For better Chrome compatibility,');
console.log('you may want to convert them to PNG format using an online tool or image converter.');
console.log('\nTo convert SVG to PNG, you can:');
console.log('1. Use an online converter like https://cloudconvert.com/svg-to-png');
console.log('2. Use ImageMagick: magick convert icon-192x192.svg icon-192x192.png');
console.log('3. Use Inkscape: inkscape icon-192x192.svg --export-filename=icon-192x192.png');
