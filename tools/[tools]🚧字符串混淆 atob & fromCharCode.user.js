// ==UserScript==
// @name         [tools]🚧网页函数调用检测---字符串混淆技术相关函数 atob & fromCharCode
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  监控网页中是否调用了 atob 和 String.fromCharCode，用于分析混淆行为
// @author       Copilot
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Hook atob
    const originalAtob = window.atob;
    window.atob = function(str) {
        console.group('%c[Hook] atob 调用检测', 'color: orange; font-weight: bold;');
        console.log('参数:', str);
        try {
            const decoded = originalAtob(str);
            console.log('解码结果:', decoded);
        } catch (e) {
            console.warn('atob 解码失败:', e);
        }
        console.groupEnd();
        return originalAtob(str);
    };

    // Hook String.fromCharCode
    const originalFromCharCode = String.fromCharCode;
    String.fromCharCode = function(...args) {
        console.group('%c[Hook] String.fromCharCode 调用检测', 'color: orange; font-weight: bold;');
        console.log('参数:', args);
        const result = originalFromCharCode(...args);
        console.log('拼接结果:', result);
        console.groupEnd();
        String.fromCharCode = originalFromCharCode;//太多了，只代理一次，还原
        return result;
    };

    const originalEval = window.eval;
    window.eval = function(code) {
        console.group('%c[eval 捕获]', 'color: orange; font-weight: bold;');
        console.log('即将执行的代码:', code);
        console.groupEnd();
        return originalEval(code);
    };


    const handler = {
        set(target, prop, value) {
            console.log(`[Proxy] 赋值检测：${prop} =`, value);
            target[prop] = value;
            return true;
        }
    };
    window = new Proxy(window, handler);


    console.log('%c[Tampermonkey] atob 和 String.fromCharCode hook 已注入', 'color: green; font-weight: bold;');
})();
