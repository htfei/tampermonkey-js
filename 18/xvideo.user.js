// ==UserScript==
// @name         Xvideo破解VIP视频免费看
// @namespace    xvideo_vip_video_free_see
// @version      1.0.0
// @description  来不及解释了，快上车！！！
// @author       w2f
// @match        https://d34vyrelvmcjzt.cloudfront.net/*
// @include      /^http(s)?:\/\/p\w+\.cloudfront\.(com|net|cc)/
// @icon         https://d34vyrelvmcjzt.cloudfront.net/logo.png
// @license      MIT
// @grant        GM_log
// @connect      *
// @require      https://scriptcat.org/lib/637/1.4.5/ajaxHooker.js#sha256=EGhGTDeet8zLCPnx8+72H15QYRfpTX4MbhyJ4lJZmyg=
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    ajaxHooker.protect();
    ajaxHooker.filter([
        { type: 'xhr', url: '.m3u8?token=', method: 'GET', async: true },
    ]);
    ajaxHooker.hook(request => {
        if (1) {
            console.log("hooked!!! request ====>", request);
            request.url = request.url.replace('_0001.m3u8','.m3u8');
            window.real_m3u8_url = request.url;
            console.log("url fixed ====>", request.url);
        }
    });


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
            let previewTip = document.querySelector("div.openvip.vip1");
            if (previewTip) {
                previewTip.innerText = previewTip.innerText= '已破解,🌍打开';
                previewTip.onclick = () =>window.open(window.real_m3u8_url,'_blank');
            }
            // 重写currentTime的setter
            Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
                get: function() { return this._currentTime || 0 },
                set: function(val) {
                    this._currentTime = val
                    // 不执行真正的设置
                }
            })
        }
        //document.querySelector("div.notice-header-02")?.click();
        //let ad = document.querySelector("div.notice_scaleLayer");
        //if (ad) ad.style.display = 'none';//去除 应用中心 弹窗

    }
    setInterval(remove_ad, 1000);

})();