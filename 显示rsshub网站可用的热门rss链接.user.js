// ==UserScript==
// @name         RSSHub Hot Path Linker
// @namespace    rsshub_hot_path_linker
// @version      1.0
// @description  将热门路径转换为可点击链接
// @author       dad
// @match        *://*/*
// @grant        w2f
// ==/UserScript==

(function() {
    'use strict';

    if (document.title !== 'Welcome to RSSHub!') return;

    const h1 = document.querySelector('.text-zinc-500');
    const href = document.location.origin + '/';
    const dst = [...document.querySelectorAll('span.debug-key')]
        .find(i => i.textContent === 'Hot Paths: ' || i.textContent === '热门路由: ');

    if (!dst || !dst.nextElementSibling) return;

    const rawHtml = dst.nextElementSibling.innerHTML;
    const list = rawHtml.split('<br>').filter(line => line.includes('/'));

    list.forEach((item) => {
        const count = item.match(/^\d+/)?.[0] || '';
        const path = item.slice(item.indexOf('/'));
        const fullUrl = href + path.slice(1);

        const a = document.createElement('a');
        a.href = fullUrl;
        a.textContent = `${count} - ${path}`;
        a.target = '_blank';

        h1.appendChild(document.createElement('br'));
        h1.appendChild(a);
    });
})();
