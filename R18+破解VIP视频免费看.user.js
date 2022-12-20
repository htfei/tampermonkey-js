// ==UserScript==
// @name         快猫/红杏/含羞草/麻豆/AvPron/破解VIP视频免费看
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  来不及解释了，快上车！！！快猫：http://re06.cc/ 红杏：https://www.hxaa40.com/ 含羞草：http://www.fi11.tv/ 麻豆TV：https://madou.tv/ AvPron：https://theav101.com/
// @author       w2f
// @include      /^https://h5.km.\w+/
// @include      /^https://www.km.\w+/
// @match        https://*/playvideo/*
// @match        https://*/videoContent/*
// @match        https://*/live/*
// @match        https://*/live
// @match        https://*/*
// @match        https://madou.tv/*
// @match        https://madou.bet/*
// @match        https://theav101.com/videos/*
// @match        https://theav108.com/videos/*
// @match        https://theav109.com/videos/*
// @icon         https://index.madou19.tv/json/icon.png
// @require      https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.1.5/hls.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/dplayer/1.26.0/DPlayer.min.js
// @grant unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    let my_timer = setInterval(get_videourl,2000);

    var oldhref = location.href;
    setInterval(function(){
        if(location.href != oldhref){
            console.log("监听到地址变化,再次启动【获取视频定时器】!");
            /* var xxx = document.querySelector("#my_add_dizhi");xxx && xxx.parentNode.removeChild(xxx); */
            oldhref = location.href;
            my_timer = setInterval(get_videourl,1000);
        }
    },1000);

    function get_videourl(){
        let videoUrl = null;
        let el = null;
        let dizhi = null;
        let player = null;
        let shikan = null;
        let ads = null;
        /* 麻豆TV*/
        if(location.href.match("https://madou.*?/") != null){
            localStorage.setItem("vip_level",'1');
        }
        /* The AV Pron，兼容手机 + PC */
        else if(location.href.match("https://theav10.*?.com/videos/") != null){
            player = document.querySelector(".player");/*todo:.newplayer*/
            shikan = $("script");
            /* 1.点击试看（不需要） */
            if( player && shikan ){
                /* 2.解析真实地址 */
                videoUrl = shikan.text().match("https:(.*?).m3u8")[0];console.log("真实地址:",videoUrl);
                /* 3.移除广告 */
                ads = document.querySelector(".table"); if(ads) ads.style.display = "none";
                /* 4.播放正片 */
                play_video(videoUrl,player,document.querySelector("h2.title"));
                /* 5.停止定时器 */
                clearInterval(my_timer);
            }
            else{
                console.log("[The AV Pron]视频页面，未获取到地址，继续尝试...");
            }
        }
        /* 快猫，兼容手机 + PC */
        else if(location.href.match("km.*?/videoContent/") != null){
            player = document.querySelector("#videoContent");
            /* 1.点击试看（不需要） */
            if( player && player.__vue__ && player.__vue__.formatUrl ){
                /* 2.解析真实地址 */
                videoUrl = player.__vue__.formatUrl;console.log("真实地址:",videoUrl);
                /* 3.移除广告 */
                ads = document.querySelector(".exchangeBg"); if(ads != null ) ads.style.display = "none";
                /* 4.播放正片 */
                play_video(videoUrl,document.querySelector("div.backImg"),document.querySelector("div.videoTitle") || document.querySelector("div p.name"));
                /* 5.停止定时器 */
                clearInterval(my_timer);
            }
            else{
                console.log("[快猫]视频页面，未获取到地址，继续尝试...");
            }
        }
        /* 红杏，兼容手机 + PC */
        else if(location.href.match("https://www.hx.*?/playvideo/") != null){
            shikan = document.querySelector("div.shikan");
            player = document.querySelector(" div#mse") || document.querySelector("div.play_video_1 div");
            if( shikan ){
                /* 1.点击试看 */
                shikan.click();console.log("点击试看！");
            }
            else if( player && player.__vue__ && player.__vue__.playUrl){
                /* 2.解析真实地址 */
                let videoUrl = player.__vue__.playUrl.split('&time')[0];console.log("真实地址:",videoUrl);
                /* 3.移除试看 */
                player.__vue__.player && player.__vue__.player.hls && player.__vue__.player.hls.destroy();
                /* 4.播放正片 */
                play_video(videoUrl,document.querySelector(" div#mse") || document.querySelector("div.play_video_1 div.dplayer"),document.querySelector("div.move_name") || document.querySelector("div.play_main_1"));
                /* 5.停止定时器 */
                clearInterval(my_timer);console.log("停止定时器！");
            }
            else{
                console.log("[红杏]视频页面，未获取到地址，继续尝试...");
            }
        }
        /* 含羞草视频 ，兼容手机 + PC */
        else if(location.href.match("/videoContent/") != null){
            shikan = document.querySelector(".van-icon-play-circle-o") || document.querySelector("a.linkOutButton.try"); /* 前面为手机。后面为PC */
            player = document.querySelector("div#videoContentPlayer") || document.querySelector("#tryVideo");
            ads =document.querySelector(".fixedTryWatchShowButtonLine");
            if( shikan ){
                /* 1.点击试看 */
                shikan.click();console.log("点击试看！");
            }
            else if( player && player.__vue__.videoUrl ){
                /* 2.解析真实地址 */
                videoUrl = player.__vue__.videoUrl.split(/start.*?sign/).join('sign');console.log("真实地址:",videoUrl);
                /* 3.移除试看、广告 */
                player.__vue__.videoObj && player.__vue__.videoObj.hls && player.__vue__.videoObj.hls.destroy();
                ads && (ads.style.display = "none");
                /* 4.播放正片 */
                play_video(videoUrl, player, document.querySelector("div.publicVideoInfoBox p.name")|| document.querySelector("div.infoAreaBox") );
                /* 5.停止定时器 */
                clearInterval(my_timer);console.log("停止定时器！");
            }
            else{
                console.log("[含羞草]视频页面，未获取到地址，继续尝试...");
            }
        }
        /* 含羞草，PC端，直播 */
        else if(location.href.match("/live/") != null){
            player = document.querySelector("div.VideoAuthAdminBg") || document.querySelector("div#livePlayer");
            videoUrl = player.__vue__.videoUrl || player.__vue__.videoContent.pull;console.log("直播地址:",videoUrl);
            play_video(videoUrl, player, document.querySelector("div.userInfo p.name"));
            clearInterval(my_timer);
        }
        /* 含羞草，手机端，直播 */
        else if(location.href.match("//h5.*?/live") != null){
            player = document.querySelector("div#publicLiveListModule");
            let videoUrl_list = player.__vue__.list;console.log("直播地址:",videoUrl_list);
            let divlist = document.querySelectorAll("ul.liveListBg li .bottom");
            let len = (videoUrl_list.length > divlist.length) ? divlist.length : videoUrl_list.length;
            for(var i = 0; i < len; i++) {
                    divlist[i].innerHTML += '<p><a href="' + videoUrl_list[i].pull + '" target="_blank">'+ videoUrl_list[i].pull +'</a></p>';
            }
            clearInterval(my_timer);
            /* 1. 显示地址 */
            var mydiv = document.createElement('div');
            mydiv.innerHTML = '<p id="my_add_dizhi" style="color:red;font-size:14px">提示：彦祖们，请点击图片下方的链接看破解后的直播视频！</p>';
            document.querySelector("div.topBannerBg").after(mydiv);
        }
        else{
            console.log("地址未匹配，停止定时器!");
            clearInterval(my_timer);
        }
    }

    /* 函数功能：加载Dplayer播放视频，并显示视频地址。 参数说明：videoUrl：视频地址 el：播放器加载位置 dizhi: 地址显示位置  */
    function play_video(videoUrl,el,dizhi){
        /* 1. 显示地址 */
        var mydiv = document.createElement('div');
        mydiv.innerHTML = '<div id="my_add_dizhi" style="color:red;font-size:14px"><p>视频地址：<a href="'+videoUrl+'" target="_blank">'+videoUrl
            +'</a></p><p>提示：各位彦祖，出现卡顿、不断刷新等情况，刷新页面即可解决！有任何问题反馈、需求实现，或者想领个红包支持作者，请<a href="https://sleazyfork.org/zh-CN/scripts/456496" target="_blank">【点击此处】</a>，祝君使用愉快！</p></div>';
        dizhi && dizhi.after(mydiv);

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
    }

})();