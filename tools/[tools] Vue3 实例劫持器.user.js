// ==UserScript==
// @name        [tools]  Vue3 实例劫持器
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动劫持 Vue3 响应式实例并挂载到 DOM 元素上
// @author       dad
// @match        *://*/*
// @require      https://scriptcat.org/lib/567/1.0.3/Hook%20Vue3%20app.js
// @grant        none
// @run-at       document-start
// @icon         http://iciba.com/favicon.ico
// ==/UserScript==

(function () {
  'use strict';

  // 暴露全局调试变量
  window._vueHooked_ = vueHooked;   // WeakMap: DOM元素 => app数组
  window._vueUnhooked_ = vueUnhooked; // WeakSet: 未挂载但已发现的app对象

  // 等待目标元素加载
  const selector = '.your-vue-root-class'; // 替换为你要观察的根元素类名
  const timer = setInterval(() => {
    const el = document.querySelector(selector);
    if (el && el.__vue__) {
      clearInterval(timer);
      console.log('✅ Vue3 实例已挂载:', el.__vue__);
      console.log('📦 Vue3 实例数据:', el.__vue__.data || el.__vue__._data);
    }
  }, 500);
})();
