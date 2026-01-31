// ==UserScript==
// @name         Xvideo破解VIP视频免费看
// @namespace    xvideo_vip_video_free_see
// @version      2.1
// @description  来不及解释了，快上车！！！
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
// @require      https://scriptcat.org/lib/5007/1.0.4/supabaseClientLibrary.js#sha384=UVgc6octvKJ1F7mziyZvq8As2JOFlBP67kH/AOywBSXFrlKuyXMJCViIiNfbAjgu
// @require      https://scriptcat.org/lib/5008/1.0.6/chatRoomLibrary.js#sha384=K75aUnIAOk8+4AgNJhFH/4Z5ouseZgL0DZxQjyMkXf8+ZLZdI2dsPWsQBEbwSptw
// @require      https://scriptcat.org/lib/637/1.4.5/ajaxHooker.js#sha256=EGhGTDeet8zLCPnx8+72H15QYRfpTX4MbhyJ4lJZmyg=
// @downloadURL https://update.sleazyfork.org/scripts/559717/Xvideo%E7%A0%B4%E8%A7%A3VIP%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.user.js
// @updateURL https://update.sleazyfork.org/scripts/559717/Xvideo%E7%A0%B4%E8%A7%A3VIP%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.meta.js
// ==/UserScript==

(async function () {
    'use strict';

    ajaxHooker.protect();
    ajaxHooker.filter([
        { type: 'xhr', url: '.m3u8?token=', method: 'GET', async: true },
    ]);
    ajaxHooker.hook(async request => {
        if (1) {
            console.log("hooked!!! request ====>", request);
            request.url = request.url.replace('_0001.m3u8', '.m3u8');
            window.real_m3u8_url = request.url;
            console.log("url fixed ====>", request.url);
        }
    });

    // 初始化
    await SbCLi.init('xvaw');
    const chatRoom = await ChatRoomLibrary.initUI();
    function remove_ad() {
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
            /*let previewTip = document.querySelector("div.openvip.vip1");
            if (previewTip) {
                previewTip.innerText = previewTip.innerText = '已破解,🌍打开';
                previewTip.onclick = () => window.open(window.real_m3u8_url, '_blank');
            }
            // 重写currentTime的setter
            Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
                get: function () { return this._currentTime || 0 },
                set: function (val) {
                    this._currentTime = val
                    // 不执行真正的设置
                }
            })*/
        }
        //document.querySelector("div.notice-header-02")?.click();
        //let ad = document.querySelector("div.notice_scaleLayer");
        //if (ad) ad.style.display = 'none';//去除 应用中心 弹窗

        if (window.real_m3u8_url && window.real_m3u8_url !== window.his_m3u8_url) {
            window.his_m3u8_url = window.real_m3u8_url;
            const videoInfo = {
                url: window.location.href,
                content: document.querySelector("div.video-title")?.innerText || document.querySelector("div.collect-title h5")?.innerText,
                video_url: location.origin + window.real_m3u8_url,
                image_url: null,
            };
            // 加载卡片，发送消息
            if (SbCLi.decreaseTrialCount() > 0) {
                chatRoom.addMsgCard(videoInfo);
            }
            else {
                chatRoom.addMsgCard({ content: '设备未激活，今日试看次数已用完！' });
            }
            const res = SbCLi.sendMessage(videoInfo);
            GM_log('发送消息的响应:', res);
        }
    }
    setInterval(remove_ad, 1000);

})();