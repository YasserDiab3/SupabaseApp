/**
 * نسخة مثال من config.js — انسخها إلى config.js واملأ HSE_API_SECRET.
 * أو عند النشر: أنشئ config.js من متغير البيئة (مثلاً HSE_API_SECRET).
 */
(function (global) {
    'use strict';
    global.__CONFIG__ = global.__CONFIG__ || {};
    global.__CONFIG__.HSE_API_SECRET = ''; // ضع هنا نفس المفتاح المُعرّف في Supabase
})(typeof window !== 'undefined' ? window : this);

