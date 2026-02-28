#!/usr/bin/env node
/**
 * حقن HSE_API_SECRET من متغير البيئة في js/config.js عند البناء (Netlify).
 * الاستخدام: من مجلد Frontend نفّذ node scripts/inject-secret.js
 * في Netlify: عيّن متغير البيئة HSE_API_SECRET (محمي) ثم Build command: node scripts/inject-secret.js
 */
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'js', 'config.js');
const secret = (process.env.HSE_API_SECRET || '').trim();

let content = fs.readFileSync(configPath, 'utf8');
// استبدال القيمة الحالية في السطر global.__CONFIG__.HSE_API_SECRET = '...';
content = content.replace(
    /(global\.__CONFIG__\.HSE_API_SECRET\s*=\s*)'[^']*'/,
    '$1' + JSON.stringify(secret)
);

fs.writeFileSync(configPath, content, 'utf8');
console.log(secret ? '[inject-secret] تم حقن HSE_API_SECRET من متغير البيئة.' : '[inject-secret] HSE_API_SECRET غير معيّن — تم ترك القيمة فارغة.');

