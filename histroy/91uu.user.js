// ==UserScript==
// @name         91国产uu破解VIP视频免费看
// @namespace    91gcyy_vip_video_free_see
// @version      1.0
// @description  来不及解释了，快上车！！！功能：破解vip视频 地址：91uu.lol
// @author       w2f
// @match        https://k0ad.rollsran.xyz/vid/*.html
// @match        https://davr.ryepluto.com/vid/*.html
// @match        https://o61e.judoegg.com/vid/*.html
// @match        https://5s4s.ryepluto.com/vid/*.html
// @match        https://81id.owlaccordion.top/vid/*.html
// @match        https://8ibr.floralfly.lol/vid/*.html
// @match        https://iw1p.dorothycow.com/vid/*.html
// @match        https://3b35.dorothycow.com/vid/*.html
// @match        https://www.antoyster.fun/vid/*.html
// @match        https://www.sdjif789541g.xyz/vid/*.html
// @match        https://www.xkdw871.cc/vid/*.html
// @include      /^http(s)?:\/\/\S+\.(cc|fun|com|xyz)/
// @icon         https://www.xkdw871.cc/favicon.ico
// @license      MIT
// @grant        none
// @run-at       document-end
// @downloadURL https://update.sleazyfork.org/scripts/496150/91%E5%9B%BD%E4%BA%A7uu%E7%A0%B4%E8%A7%A3VIP%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.user.js
// @updateURL https://update.sleazyfork.org/scripts/496150/91%E5%9B%BD%E4%BA%A7uu%E7%A0%B4%E8%A7%A3VIP%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.meta.js
// ==/UserScript==

(function () {
    'use strict';

    /* 函数功能：显示视频地址，及提示信息. 参数说明：videoUrl：视频地址  dizhi: 地址显示位置  flag:是否强制刷新，1是 */
    function show_videoUrl(videoUrl,dizhi, flag = 0) {
        var xxx = document.querySelector("#my_add_dizhi");
        if (xxx) xxx.parentNode.removeChild(xxx);
        var mydiv = document.createElement('div');
        if(flag==1){
            mydiv.innerHTML = `<div id="my_add_dizhi" style="color:red;font-size:14px;word-wrap: break-word;word-break: break-all;">
            <p style="">视频已成功破解：<a href="${videoUrl}" target="_blank">✅点此访问</a></p>
            </div>`;
        }
        else{
            mydiv.innerHTML = `<div id="my_add_dizhi" style="color:red;font-size:14px;word-wrap: break-word;word-break: break-all;">
            <p style="">视频可能破解失败❎，正在继续尝试，已破解地址：<a href="${videoUrl}" target="_blank">${videoUrl}</a></p>
            </div>`;
        }
        dizhi.after(mydiv);
        return 1;
    }

    function get_videourl() {
        var videoUrl = null;
        var ori = m3u8_url;
        if(ori.slice(-4) == "c004" || ori.slice(-4) == "49e0" || ori.slice(-4) == "5c8d" || ori.slice(-4) == "6e11" || ori.slice(-4) == "6a23"){
            videoUrl = location.origin + ori;
            console.log("已开通vip，无需破解！");
        }
        else if(ori.slice(-4) == "c204"){
            videoUrl = location.origin + ori.slice(0, -4) + "c004";
        }else if(ori.slice(-4) == "4be0"){
            videoUrl = location.origin + ori.slice(0, -4) + "49e0";
        }else if(ori.slice(-4) == "5e8d"){
            videoUrl = location.origin + ori.slice(0, -4) + "5c8d";
        }else if(ori.slice(-4) == "6c11"){
            videoUrl = location.origin + ori.slice(0, -4) + "6e11";
        }else if(ori.slice(-4) == "6823"){
            videoUrl = location.origin + ori.slice(0, -4) + "6a23";
        }

        if (videoUrl != null) {
            console.log("✅视频地址:",videoUrl);
            clearInterval(my_timer);
            show_videoUrl(videoUrl, document.querySelector("h1.f-20.mb10") || document.querySelector("div.metadata-wrap"), 1);
        }else{
            videoUrl = location.origin + ori;
            console.log("[91gcyy]视频页面，视频可能破解失败❎，正在继续尝试..已破解地址：",videoUrl);
            show_videoUrl(videoUrl, document.querySelector("h1.f-20.mb10"), 0);
        }
    }

    let my_timer = setInterval(get_videourl, 2000);

})();