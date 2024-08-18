// ==UserScript==
// @name         ASMR破解VIP视频免费看
// @namespace    asmr_vip_video_free_see
// @version      0.2
// @description  来不及解释了，快上车！！！
// @author       w2f
// @include      /^https://www.866gw.com/fuliziyuan/.*?$/
// @icon         https://www.866gw.com/skin/ecms156/images/favicon.ico
// @license      MIT
// @grant        none
// @run-at       document-start
// @downloadURL https://update.sleazyfork.org/scripts/482497/ASMR%E7%A0%B4%E8%A7%A3VIP%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.user.js
// @updateURL https://update.sleazyfork.org/scripts/482497/ASMR%E7%A0%B4%E8%A7%A3VIP%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.meta.js
// ==/UserScript==

(function () {
    'use strict';

    /* none 如果不使用 unsafeWindow ，快猫手机端，含羞草pc端会播放失败，原因未知。
    原因：通过 @require 加载的hls提示找不到，通过import_js导入ok */
    let err_cnt = 0;

    let flag = 0;
    let last_videoUrl = null;
    function get_videourl() {
        // 猫咪app pc （vip精选err,其他ok）
        if (location.href.match("https://www.866gw.com/fuliziyuan/") != null) {
            var nodelist = document.querySelectorAll("div.mainall div.list2 ul li");
            nodelist?.forEach(
                (item,idx,arr) => {
                    var xxx = document.querySelector(`#my_add_dizhi${idx}`);
                    if (xxx) { xxx.parentNode.removeChild(xxx); }
                    var video_id = item.querySelector("div a").href?.split('/')[4]?.split('.')[0];
                    if (video_id) {
                        var mydiv = document.createElement('div');
                        mydiv.innerHTML = `<div id="my_add_dizhi${idx}" style="color:red;font-size:14px;word-wrap: break-word;word-break: break-all;">
                            <p><a href="https://88888888.sydwzpks.com:4433/88/${video_id}/index.m3u8" target="_blank">✔点此访问</a></p></div>`;
                        item.append(mydiv);
                    }
                }
            );
            //切换下一页网址不变，无法刷新，故不能停止定时器
            //clearInterval(my_timer);
        }
    }

    let my_timer = setInterval(get_videourl, 2000);

    var oldhref = location.href;
    setInterval(function () {
        if (location.href != oldhref) {
            console.log("监听到地址变化,再次启动【获取视频定时器】!");
            oldhref = location.href;
            err_cnt = 0;
            my_timer = setInterval(get_videourl, 2000);
        }
    }, 1000);

})();