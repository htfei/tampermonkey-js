// ==UserScript==
// @name         Xvideo破解VIP视频免费看
// @namespace    xvideo_vip_video_free_see
// @version      2.36
// @description  长视频+短视频+社区+去广告
// @author       w2f
// @match        https://xvaw.tv
// @match        https://d34vyrelvmcjzt.cloudfront.net/*
// @match        https://d1ibyof3mbdf0n.cloudfront.net/*
// @include      /^http(s)?:\/\/p\w+\.cloudfront\.(com|net|cc)/
// @icon         https://d34vyrelvmcjzt.cloudfront.net/logo.png
// @license      MIT
// @grant        GM_log
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @run-at       document-body
// @connect      supabase.co
// @require      https://unpkg.com/@supabase/supabase-js@2.49.3/dist/umd/supabase.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.1.5/hls.min.js
// @require      https://icaugjyuwenraxxgwvzf.supabase.co/storage/v1/object/public/js/chatRoomLibrary.js
// @require      https://icaugjyuwenraxxgwvzf.supabase.co/storage/v1/object/public/js/supabaseClientLibrary.js
// ==/UserScript==

(async function () {
    'use strict';

    // 初始化
    await SbCLi.init('xvaw');
    const chatRoom = await ChatRoomLibrary.initUI();
    function addcard(item) {
        // 暂停试看
        document.querySelector("div.video-box video")?.pause();

        let mediaInfo = {
            url: window.location.href,
            //id: json_obj.mediaInfo.id,
            content: item.title || item.desc,
            //videoUrl: "av/a8/7b/an/0u/5db939f54476446e9fe75bf3f772bd67.m3u8"
            //https://d34vyrelvmcjzt.cloudfront.net/api/app/media/h5/m3u8/av/a8/7b/an/0u/5db939f54476446e9fe75bf3f772bd67_0001.m3u8?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJwdWJsaWMiLCJleHAiOjE3NzIzNjM1NDIsImlzc3VlciI6ImNvbS5idXR0ZXJmbHkiLCJzdWIiOiJhc2lnbiIsInVzZXJJZCI6NTg4MzY5Mn0.feVzJv3ONvHWEM-5_9ElLSGfStCQtZr03NwRKSHhdqE&timestamp=1770213473&sign=ba76ffa472e185d5f208f040f544dd619fc85c96&nonce=a374749f-319c-46de-9edc-5bd6ef199af0
            video_url: location.origin + '/api/app/media/h5/m3u8/' + (item.videoUrl || item.video?.url) + '?token=' + localStorage.getItem('token'),
            image_url: "https://aimp4yuan.syyaann.com/" + (item.coverImg || item.video?.cover || item.videoCover), //AI-视频换脸-videoUrl
            //likes: item.likes || item.sell || 0,
        };
        // 加载卡片，发送消息
        chatRoom.addMsgCard(mediaInfo);
        SbCLi.sendMessage(mediaInfo);
    }

    let last_long_id = null;
    let last_short_id = null;
    let last_post_id = null;
    function check_m3u8() {
        let longlist = JSON.parse(localStorage.getItem('longVideoHistoryStore') || '[]');
        if (longlist.length != 0 && longlist.items[0].id != last_long_id) {
            let item = longlist.items[0];
            last_long_id = item.id;
            addcard(item);
        }

        let shortlist = JSON.parse(localStorage.getItem('shortVideoHistoryStore') || '[]');
        if (shortlist.length != 0 && shortlist.items[0].id != last_short_id) {
            let item = shortlist.items[0];
            last_short_id = item.id;
            addcard(item);
        }

        let postlist = JSON.parse(localStorage.getItem('PostHistoryStore') || '[]');
        if (postlist.length != 0 && postlist.items[0].id != last_post_id) {
            let item = postlist.items[0];
            if(item.video?.url == "") return; //图集,没有视频
            last_post_id = item.id;
            addcard(item);
        }
    }

    function remove_ad() {

        check_m3u8();

        document.querySelector("body > div.vue-nice-modal-root > div > div > div > div.absolute.right-16.top-32 > div")?.click();//去除 开屏广告 5s倒计时
        document.querySelector("div.homeAdPop")?.remove();//去除 4次 广告弹窗
        document.querySelector("div.vue-nice-modal-root")?.remove();

        document.querySelector("div.skip-preview-btn")?.remove();//去除 跳过预览
        document.querySelector("div.promotion-expire")?.remove();//去除 开通会员 享专属特权
        document.querySelector("div.preview-ui")?.remove();
        document.querySelector("div.layout-notice-swiper")?.remove();

        //短视频去广告
        if (location.href.match("/subPage/shortVideoPlay") != null || location.href.match("/tiktok") != null) {
            document.querySelector("div.van-overlay")?.remove();
            document.querySelector("#app > div.van-popup.van-popup--center.vip-pop-main")?.remove();
            document.querySelector("xg-controls.xgplayer-controls")?.remove();
        }

    }

    setInterval(remove_ad, 1000);
})();