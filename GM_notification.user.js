// ==UserScript==
// @name         GM_notification
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *://*/*
// @require      https://pushjs.org/scripts/push.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=greasespot.net
// @grant        GM_notification
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    console.log("GM_notification aaaaaaaaa");
    Push.create('Hello World!');
    GM_notification("text", "title", "http://open.weixin.qq.com/qr/code?username=develong",console.log("GM_notification. bbbbbbbb"));

})();