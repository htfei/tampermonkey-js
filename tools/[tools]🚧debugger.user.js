// ==UserScript==
// @name         [tools]🚧去除网页F12的无限debugger暂停
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       w2f
// @match        https://*/*
// @icon         http://iciba.com/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    //注意check函数，是将debugger 传递给了构造方法constructor，所以这里hook掉constructor
    Function.prototype.constructor_ = Function.prototype.constructor;
    Function.prototype.constructor = function (a) {
        if(a == "debugger") {
            console.log("已成功去除网页F12的无限debugger暂停！");
            return function (){};
        }
        return Function.prototype.constructor_(a);
    };
})();