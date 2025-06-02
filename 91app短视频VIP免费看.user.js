// ==UserScript==
// @name         91app短视频VIP免费看
// @namespace    91app_vip_video_free_see
// @version      0.7
// @description  来不及解释了，快上车！！！
// @author       w2f
// @match        https://webo3.dsp01a.net/*
// @match        https://webo4.dsp01a.net/*
// @match        https://webo5.dsp01a.net/*
// @match        https://webo3.azxyictb.com/*
// @match        https://webo4.azxyictb.com/*
// @match        https://webo5.azxyictb.com/*
// @include      /^http(s)?:\/\/webo\w+\.\w+\.(com|net)/
// @match        https://yypwa3.f82udwl.com/*
// @match        https://p4.zacdqpi.com/*
// @icon         https://icons.duckduckgo.com/ip2/dsp01a.net.ico
// @license      MIT
// @grant none
// @require https://scriptcat.org/lib/637/1.4.4/ajaxHooker.js#sha256=Z7PdIQgpK714/oDPnY2r8pcK60MLuSZYewpVtBFEJAc=
// @run-at       document-start
// @downloadURL https://update.sleazyfork.org/scripts/520756/91app%E7%9F%AD%E8%A7%86%E9%A2%91VIP%E5%85%8D%E8%B4%B9%E7%9C%8B.user.js
// @updateURL https://update.sleazyfork.org/scripts/520756/91app%E7%9F%AD%E8%A7%86%E9%A2%91VIP%E5%85%8D%E8%B4%B9%E7%9C%8B.meta.js
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
            // --- 91app 视频播放地址 ---
            //https://10play.nndez.cn/AAA/BBB/BBB.m3u8?auth_key=CCC&via_m=nineone
            //https://10play.nndez.cn/watch9/080c4e7723ddb43c0118c7b9d6c4b606/080c4e7723ddb43c0118c7b9d6c4b606.m3u8?auth_key=1748778765-0-0-9f8301fee48d59c433ccc45a64c96180&via_m=nineone
            //https://10play.nndez.cn/videos2/608d7be194d7ad372d113f896d212f5e/608d7be194d7ad372d113f896d212f5e.m3u8?auth_key=1748778765-0-0-0bf9f302b020bb225d0ace2bdbdaed50&via_m=nineone
            //https://10play.nndez.cn/upload/7ed065e038afcfeb9dff7b239d75af78/7ed065e038afcfeb9dff7b239d75af78.m3u8?auth_key=1748779729-0-0-27e525af73c66187b8b84e227c56bb9b&via_m=nineone
            //https://10play.nndez.cn/videos4/25ad1eaf8d9978c100ad778b450c5b38/25ad1eaf8d9978c100ad778b450c5b38.m3u8?auth_key=1748779729-0-0-8224f9bad32a1d362732574763b9bcd0&via_m=nineone
            //https://10play.nndez.cn/watch8/41736d7083667aebe9cc89b554f2d3b3/41736d7083667aebe9cc89b554f2d3b3.m3u8?auth_key=1748779826-0-0-df45275266fa94c88bf33b5ffb2caf19&via_m=nineone
            // long.nndez.cn   
            //https://w6.vtknladz.xyz/
            //https://10play.nndez.cn/videos4/193502cb35d65a66f6a678f6a681c34d/193502cb35d65a66f6a678f6a681c34d.m3u8?auth_key=1748783361-0-0-46397db31a4fb87da10a71979f06ed13&via_m=91pornwebapp
            //https://10play.nndez.cn/useruploadfiles/76f090763146d68e86e090eab9672371/76f090763146d68e86e090eab9672371.m3u8?auth_key=1748783456-0-0-606cbe4edc5f5f36e2ec1ed4d0e97eb1&via_m=91pornwebapp
            /*
                //汤头条    https://5797.zqzxctc.org/ 
                var dataMap = {
                    affCode: "",
                    iosLink: "https://5797.zqzxctc.org/index.php/index/index/pwa?aff_code=",
                    androidLink: "https://d1cppxnz2bmkwv.cloudfront.net/down/tbr/ttt_9.3.0_250601_2.apk",
                    special_and: "/apk/down/tbr/ttt_9.3.0_250601_2.apk",
                    link1: "https://t.me/shangwulr", // 商务合作
                    link2:"https://t.me/chuangzuottt", // 官方TG
                    link3: "",
                    web: "https://p2.xpyortno.cc/?aff_code=",
                    copyText: "|",
                };
                https://120play.nndez.cn/watch3/d930cbb0435ac6fac69664a8288b3505/d930cbb0435ac6fac69664a8288b3505.m3u8?auth_key=1748783911-0-0-fbb1b19aa5952d33e9c8c683fa5683fa&via_m=tbr&seconds=10
                https://120play.nndez.cn/watch8/10e07486b621f582d11e1ee53d312f45/10e07486b621f582d11e1ee53d312f45.m3u8?auth_key=1748783946-0-0-2b1111bd0e890162b70bf194472ecd00&via_m=tbr&seconds=10

                https://long.nndez.cn/cloud_01/upload/video/able/video/19834/ab03788b2a77389654e657a8d28e51dc.m3u8?auth_key=1748785693-0-0-a244693bb801cd9575deed5d5e9d6cbf&via_m=kissavtv
                
                https://hls.qzkj.tech/videos3/57e9117ad2436f9d9cb099a59d7aae2d/57e9117ad2436f9d9cb099a59d7aae2d.m3u8?auth_key=1748777476-683c3a040f7f8-0-12cc806c2788e20dbfe2abb49da0eb04&v=3&time=0&via=tiktok&via_bm=dx
            */
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
            cur.querySelector("div.collect-topics-container")?.remove();//去除热点推荐
            cur.querySelector("div.username span").innerHTML = `<a href="${m3u8url}" target="_blank">❤️视频地址</a>`;//m3u8地址
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
        document.querySelector("body > div.van-overlay")?.remove();//去首次加载时的遮层
        document.querySelector("body > div.van-dialog.notice")?.remove();//去首次加载时的广告弹窗
        document.querySelector("div.preview-tip-container")?.remove();//去试看弹窗
    }
    let my_timer = setInterval(remove_ad, 2000);
})();