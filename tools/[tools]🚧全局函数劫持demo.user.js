// ==UserScript==
// @name         [tools]🚧全局函数劫持demo
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://*/*
// @icon         http://iciba.com/favicon.ico
// @grant        none
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    var fff = console.clear ;
    console.clear = console.log;//劫持console.clear 避免清屏， 便于获取信息

    //劫持console.log
    var originLog = console.log;
    console.log = function(){
        // 自定义代码
        originLog("劫持console.log：",arguments);
        if(typeof str == 'object'/* && str.preVideoUrl2 */){
            //str.preVideoUrl2 += "&error";//修改某个属性
            //window.xxx= str;//劫持内容存到全局变量中
            console.log = faa;//取消劫持
        }
        // 执行原始 console.log 方法
        originLog.apply(console, arguments);
    };

    setInterval(function() {
        if (window.check) {
            window.check = null;
        }
    }, 2000); // 每隔1秒检查一次

})();