// ==UserScript==
// @name         小天鹅破解VIP视频免费看
// @namespace    xte_vip_video_free_see
// @version      0.2
// @description  来不及解释了，快上车！！！
// @author       w2f
// @match        https://xtesde.xyz/*
// @match        https://xteisa1.xyz/*
// @include      /^https:\/\/xte\w+\.xyz.*$/
// @icon         https://xtesde.xyz/static/logo.png
// @license      MIT
// @grant        none
// @run-at       document-body
// @downloadURL https://update.sleazyfork.org/scripts/483778/%E5%B0%8F%E5%A4%A9%E9%B9%85%E7%A0%B4%E8%A7%A3VIP%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.user.js
// @updateURL https://update.sleazyfork.org/scripts/483778/%E5%B0%8F%E5%A4%A9%E9%B9%85%E7%A0%B4%E8%A7%A3VIP%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.meta.js
// ==/UserScript==

(function () {
    'use strict';
    function import_js(src) {
        let script = document.createElement('script');
        script.src = src;
        document.head.appendChild(script);
    }
    //import_js("https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js");
    import_js("https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.1.5/hls.min.js");
    import_js("https://cdnjs.cloudflare.com/ajax/libs/dplayer/1.26.0/DPlayer.min.js");


    /* 函数功能：显示视频地址，及提示信息. 参数说明：videoUrl：视频地址  dizhi: 地址显示位置  flag:是否强制刷新 */
    function show_videoUrl(videoUrl,dizhi, flag = 0) {
        var xxx = document.querySelector("#my_add_dizhi");
        if(flag==0 && xxx){
            return 0;
        }
        if (xxx) xxx.parentNode.removeChild(xxx);
        var mydiv = document.createElement('div');
        mydiv.innerHTML = `<div id="my_add_dizhi" style="color:red;font-size:14px;word-wrap: break-word;word-break: break-all;">
            <p style="">视频地址：<a href="${videoUrl}" target="_blank">${videoUrl}</a></p>
            </div>`;
        dizhi?.after(mydiv);
        return 1;
    }

    /* 函数功能：加载Dplayer播放视频。 参数说明：videoUrl：视频地址 el：播放器加载位置 dizhi: 地址显示位置  flag:是否强制刷新 */
    function play_video(videoUrl, el, dizhi, flag = 0) {

        if (!videoUrl || !el || !dizhi) throw new Error(`部分参数无效，视频地址：${videoUrl}、播放器位置：${el}、提示位置：${dizhi}`);

        let ret = show_videoUrl(videoUrl,dizhi,flag);
        if(ret == 0){
            return 0;
        }

        if (window.dp) {
            window.dp.pause()
            window.dp.destroy()
            window.dp = null;
        }

        /* 2. 新增播放器 */
        window.dp = new DPlayer({
            element: el,
            autoplay: true,
            theme: '#FADFA3',
            loop: true,
            lang: 'zh',
            screenshot: true,
            hotkey: true,
            preload: 'auto',
            video: {
                url: videoUrl,
                type: 'hls'
            }
        });

        /* 3. 设置播放器浮动显示,并添加一个具有上边距的兄弟div避免覆盖下面的内容 */
        //el.classList.add("my_add_header");
        //el.style += "z-index: 999;top: 0;";
        el.style.position = 'sticky';
        el.style.zIndex = '999';
        el.style.top = '0';
        var xxx = document.querySelector("#my_add_sibling");
        if(!xxx){
            var sibling = document.createElement('div');
            sibling.id = "my_add_sibling";
            //sibling.style.marginTop = el.offsetHeight + 'px'; // 设置兄弟元素的顶部边距
            el.after(sibling);
        }
    }


    let flag = 0;
    let last_videoUrl = null;
    function get_videourl() {
        let videoUrl = null;
        let dizhi = null;
        let player = null;
        let ads = null;
        try {
            let obj = JSON.parse(localStorage.getItem('MyTokenData'));
            if(obj.vip_level != 1){
                obj.vip_level = 1; //vip权限
                obj.coin = 100; //金币
                obj.daily.video = 99; //试看次数
                console.log("MyTokenData fixed:",obj);
                localStorage.setItem("MyTokenData",JSON.stringify(obj));
            }
            //console.log("[小天鹅]视频页面，正在解析...");
            document.body.classList.remove('van-overflow-hidden');
            ads = document.querySelector(".VipzceBox"); if (ads) ads.parentNode.removeChild(ads);//试看次数解除
            //ads = document.querySelector("div.el-dialog__body"); if (ads) ads.parentNode.removeChild(ads);/*pc*/
            //ads = document.querySelector(".v-modal"); if (ads) ads.parentNode.removeChild(ads);/*pc*/
            player = document.querySelector("div.Mpplay") || document.querySelector("div.playerBox");
            videoUrl = (document.querySelector("div.detailsBox")|| document.querySelector("div.user"))?.__vue__?.detailsdata?.vod_direct_play_url;
            if(player && videoUrl){
                if(videoUrl == last_videoUrl) return;
                last_videoUrl = videoUrl;
                console.log("真实地址:", videoUrl);
                play_video(videoUrl, player, document.querySelector("div.DetailsofTheTitle") || document.querySelector("div.playVideoInfo"),1);
            }else{
                console.log("[小天鹅]视频页面，未获取到地址，继续尝试...");
            }
        }
        catch (err) {
            console.log(`${err}`);
        }
    }

    let my_timer = setInterval(get_videourl, 2000);

    var oldhref = location.href;
    setInterval(function () {
        if (location.href != oldhref) {
            console.log("监听到地址变化,再次启动【获取视频定时器】!");
            oldhref = location.href;
            clearInterval(my_timer);
            my_timer = setInterval(get_videourl, 2000);
        }
    }, 1000);

})();