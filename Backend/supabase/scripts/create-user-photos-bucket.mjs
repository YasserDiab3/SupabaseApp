#!/usr/bin/env node
/**
 * إنشاء bucket "user-photo" في Supabase Storage (لصور الملف الشخصي).
 * التشغيل: من مجلد Backend/supabase أو من جذر المشروع.
 *
 * المتغيرات المطلوبة:
 *   SUPABASE_URL (مثال: https://xxxx.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY (مفتاح الخدمة من Project Settings → API)
 *
 * أمثلة:
 *   Windows (PowerShell):
 *     $env:SUPABASE_URL="https://xxxx.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."; node scripts/create-user-photos-bucket.mjs
 *   Linux/macOS:
 *     SUPABASE_URL="https://xxxx.supabase.co" SUPABASE_SERVICE_ROLE_KEY="eyJ..." node scripts/create-user-photos-bucket.mjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const BUCKET_NAME = 'user-photo';
const BUCKET_OPTIONS = {
  name: BUCKET_NAME,
  public: true,
  file_size_limit: 2097152, // 2MB
  allowed_mime_types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('خطأ: المطلوب تعيين SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const base = SUPABASE_URL.replace(/\/$/, '');
  const url = `${base}/storage/v1/bucket`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(BUCKET_OPTIONS),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }
  if (res.ok) {
    console.log('تم إنشاء الـ bucket "user-photo" بنجاح.');
    return;
  }
  if (res.status === 409 || (data.message && String(data.message).includes('already exists'))) {
    console.log('الـ bucket "user-photos" موجود مسبقاً.');
    return;
  }
  console.error('فشل إنشاء الـ bucket:', data.message || text);
  console.error('إن استمر الفشل، أنشئ الـ bucket يدوياً من Dashboard → Storage → New bucket باسم user-photo (Public).');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
