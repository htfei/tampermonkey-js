// ==UserScript==
// @name         汤头条破解VIP视频免费看🥣
// @namespace    tangtoutiao_vip_video_free_see
// @version      2.2
// @description  来不及解释了，快上车！！！
// @author       w2f
// @match        https://p1.xpyortno.cc/*
// @match        https://p2.xpyortno.cc/*
// @match        https://p3.xpyortno.cc/*
// @match        https://p2.xpyortno.cc/*
// @match        https://p5.xpyortno.cc/*
// @include      /^http(s)?:\/\/p\w+\.xpyortno\.(com|net|cc)/
// @icon         https://p2.xpyortno.cc/favicon.ico
// @license      MIT
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// @connect      supabase.co
// @require      https://unpkg.com/@supabase/supabase-js@2.49.3/dist/umd/supabase.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.1.5/hls.min.js
// @require      https://scriptcat.org/lib/5008/1.0.9/chatRoomLibrary.js#sha384=q97t2pA7/+cd/pNF0yV+5YtYPJqqaQ3Z1UALOdmAsmre12tn+QkWKrIvemIPFJKV
// @require      https://scriptcat.org/lib/5007/1.0.5/supabaseClientLibrary.js#sha384=Lmn3Xw4T1M9EafLVLt1ffUVaBi0b5jVrj+bUN9CJaDQsoH+cZysJBi49WimPRFtT
// @require      https://scriptcat.org/lib/5398/1.4.9/ajaxHookerPlus.js#sha384=p/dGSuD4jK5vvIk78Rx/+hHVI93+2C4MYXSV06Kqv3/QZHRr+C14WoA17DPNrBWt
// ==/UserScript==

(async function () {
    'use strict';
    let last_m3u8url = null;
    function fix_m3u8url(m3u8url) {
        let url = new URL(m3u8url);
        let seg = url.host.split('.');
        seg[0] = 'long';
        url.host = seg.join('.');
        return url.href;
    }

    // 初始化
    await SbCLi.init('ttt');
    const chatRoom = await ChatRoomLibrary.initUI();

    ajaxHooker.protect();
    ajaxHooker.filter([
        { url: ".m3u8" },//劫持所有url包含指定字符串的请求
    ]);
    ajaxHooker.hook(async request => {
        //console.log(`[tools]🚧1劫持${request.type}-${request.method}:`, request.url);
        request.url = fix_m3u8url(request.url);
        if (request.url != last_m3u8url) {
            last_m3u8url = request.url;
            let videoInfo = {
                url: window.location.href,
                content: document.querySelector("div.swiper-slide-active h2")?.innerText || document.querySelector("div.info-top p.info-title")?.innerText,
                video_url: request.url,
                image_url: null,
            };
            //console.log(`[tools]🚧2劫持${request.type}-${request.method}:`, videoInfo);
            // 加载卡片，发送消息
            chatRoom.addMsgCard(videoInfo);
            SbCLi.sendMessage(videoInfo);
        }
    });

    function remove_ad() {
        document.querySelector("welcome-ad")?.remove();//去除 开屏广告 5s倒计时
        document.querySelector("div.active-dialog")?.remove();//去除 4次 广告弹窗
        document.querySelector("div.van-overlay")?.remove();//去除 遮罩
        document.querySelector("div.shadow-lg")?.remove();//去除 汤头条app内打开
        document.querySelector("div.preview-tip")?.remove();
        //let ad = document.querySelector("div.notice_scaleLayer");
        //if (ad) ad.style.display = 'none';//去除 应用中心 弹窗
        //短视频去广告
        document.querySelector("div.dx-mask")?.remove();//热点
        let previewTip = document.querySelector("div.preview-tip");
        if (previewTip) previewTip.innerText = previewTip.innerText.replace('开通VIP', '已');
    }
    setInterval(remove_ad, 1000);

})();