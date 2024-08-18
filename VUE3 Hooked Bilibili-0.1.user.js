// ==UserScript==
// @name         VUE3 Hooked Bilibili
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @run-at       document-start
// @match        https://www.bilibili.com/*
// @require      https://greasyfork.org/scripts/449444-hook-vue3-app/code/Hook%20Vue3%20app.js
// @icon         http://iciba.com/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    //暴露变量到全局
    window._vueUnhooked_ = vueUnhooked;
    window._vueHooked_ = vueHooked;

    //等待元素加载
    let timer = setInterval(() => {
        let app = document.querySelector(".bili-video-card")
        if (app?.__vue__) {
            clearInterval(timer)
            console.log("已加载元素", app)
        }
    })

})();