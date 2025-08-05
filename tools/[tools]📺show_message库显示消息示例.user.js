// ==UserScript==
// @name         [tools]📺show_message库显示消息示例
// @namespace    https://bbs.tampermonkey.net.cn/
// @version      0.1.0
// @description  try to take over the world!
// @author       You
// @icon         http://iciba.com/favicon.ico
// @match        https://scriptcat.org/zh-CN/script-show-page/2253
// @require      https://scriptcat.org/lib/2253/1.0.1/show_message.js
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    // 使用所有参数的调用方式
    show_message({
        message: '这是一个完全配置的提示框',  // 提示框的内容
        type: 'success',                    // 成功类型提示框
        position: 'center',                 // 屏幕正中显示
        opacity: 0.9,                       // 透明度为 0.9
        autoClose: false,                   // 不自动关闭
    });

    // 自定义显示颜色
    show_message({
        message: "这是一个自定义样式的提示框",
        type: {
            backgroundColor: '#f0e68c', // 浅黄色背景
            textColor: '#8b4513'        // 深棕色文字
        },
        position: 'bottom-left',       // 在屏幕左下角显示
        opacity: 0.8,                  // 透明度为0.9
        autoClose: 7                   // 7秒后自动关闭
    });

    // 使用简单的字符串调用方式（默认配置）
    show_message("这是一个信息提示框");

    show_message({
        message: "这是一条成功消息",
        type: 'success',
        position: 'bottom-right',
        opacity: 0.8,
        autoClose: 5 // 5秒后自动关闭
    });

    show_message({
        message: "这是一个警告提示框",
        type: 'warning',
        position: 'top-left',
        opacity: 0.8,
        autoClose: 6
    });

    show_message({
        message: "这是一条错误消息",
        type: 'error',
        position: 'top-right',
        opacity: 0.8,
        autoClose: 4 // 5秒后自动关闭
    });
})();