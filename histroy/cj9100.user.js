// ==UserScript==
// @name         CJ9100破解VIP视频免费看
// @namespace    cj9100_vip_video_free_see
// @version      0.1
// @description  来不及解释了，快上车！！！功能：破解vip视频 + vip点播视频 地址：CJ9100.com ---CJ9109.com(数字00-09联想记忆) chiji9100.com ---chiji9109.com(数字00-09联想记忆)
// @author       w2f
// @match        https://gkdog4.91qjfvdcxs.com/videos/play/*.html
// @include      /^http(s)?:\/\/.*?\/videos\/play.*?/
// @icon         https://5849383.91nhayge.com/public/xvideos/logo/xv.white.svg
// @license      MIT
// @grant        none
// @run-at       document-start
// @downloadURL https://update.sleazyfork.org/scripts/488773/CJ9100%E7%A0%B4%E8%A7%A3VIP%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.user.js
// @updateURL https://update.sleazyfork.org/scripts/488773/CJ9100%E7%A0%B4%E8%A7%A3VIP%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.meta.js
// ==/UserScript==

(function () {
    'use strict';

    /* 函数功能：显示视频地址，及提示信息. 参数说明：videoUrl：视频地址  dizhi: 地址显示位置  flag:是否强制刷新，1是 */
    function show_videoUrl(videoUrl,dizhi, flag = 0) {
        var xxx = document.querySelector("#my_add_dizhi");
        if(flag==0 && xxx){
            return 0;
        }
        if (xxx) xxx.parentNode.removeChild(xxx);
        var mydiv = document.createElement('div');
        mydiv.innerHTML = `<div id="my_add_dizhi" style="color:red;font-size:14px;word-wrap: break-word;word-break: break-all;">
            <p style="">视频地址：<a href="${videoUrl}" target="_blank">${videoUrl}</a></p>
            <p style="">问题反馈 or 支持作者请<a href="https://sleazyfork.org/zh-CN/scripts/456496" target="_blank">【点击此处】</a>，使用愉快！</p>
            </div>`;
        dizhi.after(mydiv);
        return 1;
    }

    function get_videourl() {
        if (window.playPath != null) {
            console.log("视频地址:", window.playPath);
            show_videoUrl(window.playPath, document.querySelector("div#video-player-bg"), 1);
            //切换下一页网址不变，无法刷新，故不能停止定时器
            clearInterval(my_timer);
        }else{
            console.log("[吃鸡9100]视频页面，未获取到地址，继续尝试...");
        }
    }

    let my_timer = setInterval(get_videourl, 2000);

    var oldhref = location.href;
    setInterval(function () {
        if (location.href != oldhref) {
            console.log("监听到地址变化,再次启动【获取视频定时器】!");
            oldhref = location.href;
            err_cnt = 0;
            clearInterval(my_timer);
            my_timer = setInterval(get_videourl, 2000);
        }
    }, 1000);

})();