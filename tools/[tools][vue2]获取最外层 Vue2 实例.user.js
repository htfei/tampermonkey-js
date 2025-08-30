// ==UserScript==
// @name         [tools][vue2]获取最外层 Vue2 实例
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动提取页面中最外层的 Vue 实例
// @author       dad
// @match        *://*/*
// @grant        none
// @icon         http://iciba.com/favicon.ico
// ==/UserScript==

(function () {
  'use strict';

  // 工具函数：递归查找具有 __vue__ 属性的 DOM 元素
  function findVueInstance(el) {
    if (!el) return null;
    if (el.__vue__) return el.__vue__;
    for (const child of el.children) {
      const found = findVueInstance(child);
      if (found) return found;
    }
    return null;
  }

  // 等待页面加载完成
  window.addEventListener('load', () => {
    const root = document.body;
    const vueInstance = findVueInstance(root);

    if (vueInstance) {
      console.log('✅ 找到最外层 Vue 实例:', vueInstance);
      console.log('📦 根组件名:', vueInstance.$options?.name || '未命名');
      console.log('🌲 Vue 实例树结构:', {
        $root: vueInstance.$root,
        $children: vueInstance.$children,
        $parent: vueInstance.$parent,
      });
    } else {
      console.warn('❌ 未找到 Vue 实例，请检查页面是否使用 Vue 或尝试更深层 DOM。');
    }
  });
})();
