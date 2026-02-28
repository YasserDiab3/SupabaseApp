/**
 * Frontend Smoke Check (Node.js)
 * - يتحقق من أن كل الموارد المحلية المشار إليها في index.html موجودة على القرص
 * - يكتشف التكرارات في تحميل CSS/JS
 *
 * الاستخدام:
 *   node smoke-check.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname; // Frontend/
const INDEX = path.join(ROOT, 'index.html');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function exists(p) {
  return fs.existsSync(p);
}

function normalizeLocalUrl(u) {
  if (!u) return null;
  const trimmed = u.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) return null;
  if (trimmed.startsWith('data:')) return null;
  if (trimmed.startsWith('#')) return null;
  // remove leading /
  return trimmed.replace(/^\/+/, '');
}

function extractAll(html, regex) {
  const out = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    out.push(m[1]);
  }
  return out;
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function countDuplicates(arr) {
  const m = new Map();
  for (const v of arr) m.set(v, (m.get(v) || 0) + 1);
  return Array.from(m.entries()).filter(([, c]) => c > 1);
}

function main() {
  if (!exists(INDEX)) {
    console.error('❌ index.html غير موجود:', INDEX);
    process.exit(1);
  }

  const html = read(INDEX);

  const linkHrefs = extractAll(html, /<link\b[^>]*?\bhref=["']([^"']+)["'][^>]*?>/gi)
    .map(normalizeLocalUrl)
    .filter(Boolean);
  const scriptSrcs = extractAll(html, /<script\b[^>]*?\bsrc=["']([^"']+)["'][^>]*?>/gi)
    .map(normalizeLocalUrl)
    .filter(Boolean);

  const all = [...linkHrefs, ...scriptSrcs];
  const uniqueAll = uniq(all);

  const missing = [];
  for (const rel of uniqueAll) {
    const abs = path.join(ROOT, rel);
    if (!exists(abs)) missing.push(rel);
  }

  const dupLinks = countDuplicates(linkHrefs);
  const dupScripts = countDuplicates(scriptSrcs);

  console.log('🔎 Smoke Check Results');
  console.log('='.repeat(60));
  console.log(`- index.html: ${path.relative(ROOT, INDEX)}`);
  console.log(`- local CSS links: ${linkHrefs.length} (unique: ${uniq(linkHrefs).length})`);
  console.log(`- local JS scripts: ${scriptSrcs.length} (unique: ${uniq(scriptSrcs).length})`);
  console.log(`- total local assets: ${all.length} (unique: ${uniqueAll.length})`);

  if (dupLinks.length) {
    console.log('\n⚠️ Duplicate CSS href(s):');
    for (const [v, c] of dupLinks) console.log(`  - ${v} (x${c})`);
  }

  if (dupScripts.length) {
    console.log('\n⚠️ Duplicate script src(s):');
    for (const [v, c] of dupScripts) console.log(`  - ${v} (x${c})`);
  }

  if (missing.length) {
    console.log('\n❌ Missing local assets referenced by index.html:');
    for (const m of missing) console.log(`  - ${m}`);
    console.log('\nResult: FAILED');
    process.exit(2);
  }

  console.log('\n✅ Result: PASSED (no missing local assets)');
}

main();



