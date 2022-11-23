// ==UserScript==
// @name         显示rsshub网站可用的热门rss链接
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *
// @icon         https://www.google.com/s2/favicons?sz=64&domain=shab.fun

// @require      https://cdn.staticfile.org/jquery/3.6.0/jquery.min.js

// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    if(document.title != 'Welcome to RSSHub!') {return true;}

    var h1 = $('h1')[0];
    var href = document.location.href;
    var dst = $('span.debug-key').get().filter(i=>i.innerHTML=='Hot Paths: '|| i.innerHTML=='热门路由: ')[0];
    var list = $(dst).next()[0].innerHTML.split('<br>');
    var x = list.map((c,i)=>{
        var h = href + c.substr(c.indexOf('/')+1);
        h1.innerHTML += `<br><a href='${h}' target='_blank'>${h}</ a>`;
    })
})();