/**
 * Public runtime config (tracked in repo).
 * This file is safe to deploy and prevents hard dependency on ignored js/config.js.
 */
(function (global) {
    'use strict';

    var current = global.__CONFIG__ || {};

    global.__CONFIG__ = Object.assign({
        // Keep empty by default. If needed, inject at deploy/runtime.
        HSE_API_SECRET: ''
    }, current);
})(typeof window !== 'undefined' ? window : this);
