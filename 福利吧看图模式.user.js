// ==UserScript==
// @name         福利吧看图模式
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  福利吧福利汇总看图模式,一行多图，瀑布流
// @author       why2fly
// @match        https://fuliba2023.net/*.html*
// @icon         http://fuliba2023.net/favicon.ico
// @grant        none
// @license      GPL-3.0
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    $('section.container').css("max-width","100%");
    $('section.container .content').css("width","100%");
    $('section.container .sidebar').css("display","none");
    $('section.container img').css("float","left");
    $('section.container img').css("max-width","25%");//一行4张图

})();