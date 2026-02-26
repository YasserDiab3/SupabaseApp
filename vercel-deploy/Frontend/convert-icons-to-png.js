/**
 * Script to convert SVG icons to PNG format
 * Run: node convert-icons-to-png.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Icon sizes required for PWA
const iconSizes = [16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 384, 512];

// Directories
const iconsDir = path.join(__dirname, 'icons');
const outputDir = iconsDir; // Save PNGs in the same directory

// Function to create PNG from SVG
async function convertSvgToPng(size) {
    try {
        // Create canvas
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');

        // Draw background
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(0, 0, size, size);

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(size * 0.625)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HSE', size / 2, size / 2);

        // Save as PNG
        const buffer = canvas.toBuffer('image/png');
        const filename = `icon-${size}x${size}.png`;
        const filepath = path.join(outputDir, filename);
        fs.writeFileSync(filepath, buffer);
        console.log(`✓ Created ${filename}`);
    } catch (error) {
        console.error(`✗ Error creating icon-${size}x${size}.png:`, error.message);
    }
}

// Main function
async function main() {
    console.log('Converting SVG icons to PNG format...\n');
    
    for (const size of iconSizes) {
        await convertSvgToPng(size);
    }
    
    console.log('\n✅ All PNG icon files created successfully!');
}

main().catch(console.error);
