// ==UserScript==
// @name         微密圈破解VIP短视频免费看
// @namespace    wmq_vip_video_free_see
// @version      0.1
// @description  来不及解释了，快上车！！！
// @author       w2f

// @微密圈
// @match        https://p4.zacdqpi.com/*
// @match        https://p4.ykzmxuq.cc/*
// @include      /^http(s)?:\/\/p4\.\w+\.(com|cc)/

// @icon         https://p4.ykzmxuq.cc/favicon.ico
// @license      MIT
// @grant none
// @require      https://scriptcat.org/lib/637/1.4.5/ajaxHooker.js#sha256=EGhGTDeet8zLCPnx8+72H15QYRfpTX4MbhyJ4lJZmyg=
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...

    ajaxHooker.protect();
    ajaxHooker.filter([
        {type: 'xhr', url: '.m3u8?auth_key=', method: 'GET', async: true},
        //{type: 'xhr', url: /^https:\/\/\w+play\.\w+\.(com|cn)/, method: 'GET', async: true},
    ]);
    ajaxHooker.hook(request => {
        if (1) {
            //https://10play.nndez.cn/AAA/BBB/BBB.m3u8?auth_key=CCC&via_m=nineone/wmq
            //https://long.nndez.cn/watch4/7f396f270663012c66b02d848632f3f6/7f396f270663012c66b02d848632f3f6.m3u8?auth_key=1748844858-0-0-5f6fb62aa519049abce398ec08c3380b&via_m=wmq

            console.log("hooked!!! request ====>",request);
            let url = new URL(request.url);
            let seg = url.host.split('.');
            seg[0] = 'long';
            url.host = seg.join('.');
            request.url = url.href;
            console.log("url fixed ====>",request.url);
            show_tips(url.href);//显示优化
        }
    });

    function show_tips(m3u8url){
        let nodes = document.querySelectorAll("div.swiper-slide");
        for(var i = 0 ; i < nodes.length ; i++){
            let cur = nodes[i];
            cur.querySelector("div.index_item_bottom")?.remove();//去除热点推荐
            cur.querySelector("div.item_info_name").innerHTML = `<a href="${m3u8url}" target="_blank">❤️视频地址</a>`;//m3u8地址
            let tmp = cur.querySelectorAll("div.club");
            if(tmp.length == 0){
                ;//do nothing
            }else if(tmp.length== 1){
                tmp[0].querySelector("span").innerText = `✅已破解`;//破解提示
            }else{
                tmp[0].remove();//去除位置
                tmp[1].querySelector("span").innerText = `✅已破解`;//破解提示
            }
        }
        let ac = document.querySelector("div.action-container"); if(ac) ac.innerHTML = `<a href="${m3u8url}" target="_blank">✅已破解❤️视频地址</a>`;
    }

    function remove_ad(){
        document.querySelector("welcome-ad")?.remove();//去除 开屏广告 5s倒计时
        document.querySelector("div.notice-header-02")?.click();//去除 4次 广告 弹窗
        document.querySelector("div.notice-header-02")?.click();
        document.querySelector("div.notice-header-02")?.click();
        document.querySelector("div.notice-header-02")?.click();
        document.querySelector("div.notice_scaleLayer")?.style.display = 'none';//去除 应用中心 弹窗
        document.querySelector("div.home-screen-pwa-container")?.style.display = 'none';//去除 添加到主屏幕 弹窗
        document.querySelector("div.alertvip-in")?.remove(); //去除 开通VIP 弹窗
    }
    let my_timer = setInterval(remove_ad, 2000);
})();