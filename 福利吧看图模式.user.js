// ==UserScript==
// @name         福利吧看图模式
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       why2fly
// @match        https://fuliba2022.net/*
// @icon         http://fuliba2022.net/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    $('section.container').css("max-width","100%");
    $('section.container .content').css("width","100%");
    $('section.container .sidebar').css("display","none");
    $('section.container img').css("float","left");
    $('section.container img').css("max-width","25%");

})();