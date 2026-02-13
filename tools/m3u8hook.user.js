// ==UserScript==
// @name        m3u8hooker
// @namespace    m3u8hooker
// @version      1.22
// @description  拦截并记录所有URL包含.m3u8格式后缀的请求，实测兼容windows edge、ios via浏览器
// @author       Your Name
// @match        *://*/*
// @connect      *
// @run-at       document-start
// @require      file:///c:/GitProject/tampermonkey-js/lib/m3u8hook-core.js
// @require      file:///c:/GitProject/tampermonkey-js/lib/m3u8hook-ui.js
// ==/UserScript==

(function() {
    'use strict';

    // 等待核心库加载完成
    function waitForCoreLibrary() {
        if (typeof window.m3u8Hooker === 'undefined') {
            setTimeout(waitForCoreLibrary, 100);
        } else {
            initHooker();
        }
    }

    // 初始化拦截器
    function initHooker() {
        try {
            // 初始化核心库
            const coreResult = window.m3u8Hooker.init();
            console.log('[m3u8拦截器] 核心库初始化结果:', coreResult);

            // 等待UI库加载完成
            setTimeout(function() {
                if (typeof window.m3u8HookerUI !== 'undefined') {
                    const uiResult = window.m3u8HookerUI.init();
                    console.log('[m3u8拦截器] UI库初始化结果:', uiResult);
                } else {
                    console.warn('[m3u8拦截器] UI库未加载，仅启用核心拦截功能');
                }
            }, 1000);

        } catch (e) {
            console.error('[m3u8拦截器] 初始化失败:', e);
        }
    }

    // 启动初始化
    waitForCoreLibrary();

})();
