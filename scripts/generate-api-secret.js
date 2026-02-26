#!/usr/bin/env node
/**
 * توليد مفتاح API سري للاستخدام مع HSE_API_SECRET.
 * الاستخدام: node scripts/generate-api-secret.js
 * ثم أضف المفتاح في Supabase (Edge Functions → hse-api → Secrets) وفي Frontend/js/config.js
 */
const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('hex');
console.log('\n=== مفتاح API السري (احفظه في مكان آمن) ===\n');
console.log(secret);
console.log('\n=== الخطوات ===');
console.log('1. Supabase: Edge Functions → Secrets → أضف Name = HSE_API_SECRET , Value = (المفتاح أعلاه)');
console.log('2. في Frontend/js/config.js استبدل السطر الحالي بهذا السطر:\n');
console.log('   global.__CONFIG__.HSE_API_SECRET = \'' + secret + '\';');
console.log('\n   (انسخ السطر أعلاه بالكامل ولصقه في config.js)\n');
