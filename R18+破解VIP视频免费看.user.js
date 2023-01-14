// ==UserScript==
// @name         快猫/红杏/含羞草/麻豆/AvPron/皇家会所/9sex/91TV/破解VIP视频免费看
// @namespace    http://tampermonkey.net/
// @version      0.25
// @description  来不及解释了，快上车！！！
// @author       w2f
// @match        https://*/videoContent/*
// @match        https://www.peoplelove.cn/*
// @match        https://*/playvideo/*
// @match        https://*/live/*
// @match        https://*/live
// @match        https://madou.bet/*
// @match        https://*/videos/*
// @match        https://zgntc9hbqx.com/index/movie/play/id/*
// @match        https://kdt29.com/*
// @icon         https://index.madou19.tv/json/icon.png
// @license      MIT
// @grant none
// ==/UserScript==

(function () {
    'use strict';

    /* none 如果不使用 unsafeWindow ，快猫手机端，含羞草pc端会播放失败，原因未知。
    原因：通过 @require 加载的hls提示找不到，通过import_js导入ok */
    let err_cnt = 0;

    function import_js(src) {
        let script = document.createElement('script');
        script.src = src;
        document.head.appendChild(script);
    }
    import_js("https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js");
    import_js("https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.1.5/hls.min.js");
    import_js("https://cdnjs.cloudflare.com/ajax/libs/dplayer/1.26.0/DPlayer.min.js");

    /* 函数功能：加载Dplayer播放视频，并显示视频地址。 参数说明：videoUrl：视频地址 el：播放器加载位置 dizhi: 地址显示位置  */
    function play_video(videoUrl, el, dizhi) {

        if (!videoUrl || !el || !dizhi) throw new Error(`部分参数无效，视频地址：${videoUrl}、播放器位置：${el}、提示位置：${dizhi}`);

        /* 1. 显示地址 */
        var mydiv = document.createElement('div');
        mydiv.innerHTML = `<div id="my_add_dizhi" style="color:red;font-size:14px">
            <p style="color:red;font-size:14px">视频地址：<a href="${videoUrl}" target="_blank">${videoUrl}</a></p>
            <p style="color:red;font-size:14px">问题反馈 or 支持作者请
            <a href="https://sleazyfork.org/zh-CN/scripts/456496" target="_blank">【点击此处】</a>，使用愉快！</p></div>`;
        dizhi.after(mydiv);

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
    }

    /* 函数功能：同上，可切换清晰度  */
    function play_video2(videoUrl, videoUrl2, videoUrl3, videoUrl4, el, dizhi) {
        /* 1. 显示地址 */
        var mydiv = document.createElement('div');
        mydiv.innerHTML = `<div id="my_add_dizhi" style="color:red;font-size:14px">注意：部分视频只360P，切换后无法播放说明不存在高清晰度版本！！！视频地址：
        <p style="color:red;font-size:14px">360P：<a href="${videoUrl}" target="_blank">${videoUrl}</a></p>
        <p style="color:red;font-size:14px">480P：<a href="${videoUrl2}" target="_blank">${videoUrl2}</a></p>
        <p style="color:red;font-size:14px">720P：<a href="${videoUrl3}" target="_blank">${videoUrl3}</a></p>
        <p style="color:red;font-size:14px">1080P：<a href="${videoUrl4}" target="_blank">${videoUrl4}</a></p>
        <p style="color:red;font-size:14px">问题反馈 or 支持作者请
        <a href="https://sleazyfork.org/zh-CN/scripts/456496" target="_blank">【点击此处】</a>，使用愉快！</p></div>`;
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
                quality: [
                    {
                        name: '360P',
                        url: videoUrl,
                        type: 'hls',
                    },
                    {
                        name: '480P',
                        url: videoUrl2,
                        type: 'hls',
                    },
                    {
                        name: '720P',
                        url: videoUrl3,
                        type: 'hls',
                    },
                    {
                        name: '1080P',
                        url: videoUrl4,
                        type: 'hls',
                    },
                ],
                defaultQuality: 0,//默认播放360P为0
            }
        });
    }

    /* 函数功能：在界面上显示程序错误，便于分析  */
    function show_err_log(err) {
        err && console.log(err);
        err_cnt++;
        if (err_cnt >= 10) {
            err_cnt = 0;
            var mydiv = document.createElement('div');
            mydiv.innerHTML = `<div id="my_add_err_log" style="color:red;font-size:14px">
            解析出错，请仔细阅读<a href="https://sleazyfork.org/zh-CN/scripts/456496" target="_blank">【脚本说明】</a>查看是否支持你的平台组合，
            如需帮助请复制以下内容到脚本评论区，等候作者处理! 请加上使用的平台组合，如：chrome + tampermonkey 。
            <p style="color:red;font-size:14px">错误信息：${err || "尝试多次仍然未获取到地址,可能是网站已更新..."}</p>
            <p style="color:red;font-size:14px">操作系统：${navigator.platform}</p>
            <p style="color:red;font-size:14px">浏览器：${navigator.userAgent}</p>
            <p style="color:red;font-size:14px">当前地址：${location.href}</p>
            </div>`;
            document.querySelector("head").after(mydiv);
        }
    }

    let flag = 0;
    function get_videourl() {
        let videoUrl = null, videoUrl2 = null, videoUrl3 = null, videoUrl4 = null;
        let el = null;
        let dizhi = null;
        let player = null;
        let shikan = null;
        let ads = null;
        try {
            /* 9sex */
            if (location.href.match("https://zgntc9hbqx.com/") != null) {
                player = document.querySelector("#dplayer");
                dizhi = document.body.innerHTML.match("movies/(.*?)_preview.jpg.txt")[1].split('/');/* $("script").text() */
                /* 1.点击试看（不需要） */
                if (player && dizhi && flag == 0) {
                    /* 2.解析真实地址 */
                    videoUrl = `https://9s.m3.bca834d60257.com/${dizhi[0]}/${dizhi[1]}/360P/${dizhi[2]}_360P.m3u8`; console.log("真实地址:", videoUrl);
                    videoUrl2 = `https://9s.m3.bca834d60257.com/${dizhi[0]}/${dizhi[1]}/480P/${dizhi[2]}_480P.m3u8`; console.log("真实地址2:", videoUrl2);
                    videoUrl3 = `https://9s.m3.bca834d60257.com/${dizhi[0]}/${dizhi[1]}/720P/${dizhi[2]}_720P.m3u8`; console.log("真实地址3:", videoUrl3);
                    videoUrl4 = `https://9s.m3.bca834d60257.com/${dizhi[0]}/${dizhi[1]}/1080P/${dizhi[2]}_1080P.m3u8`; console.log("真实地址4:", videoUrl4);
                    /* 3.vip视频需要移除登录框 */
                    ads = document.querySelector("#login-tip-modal"); if (ads) ads.parentNode.removeChild(ads);
                    ads = document.querySelector(".vip-tip-modal"); if (ads) ads.parentNode.removeChild(ads);
                    /* 4.播放正片 */
                    play_video2(videoUrl, videoUrl2, videoUrl3, videoUrl4, player, document.querySelector("div.notice"));
                    flag = 1;
                }
                else if (flag == 1) {
                    /* 3.1 免费视频需要加载播放后移除广告 */
                    ads = document.querySelector(".pause-ad-imgbox"); if (ads) ads.parentNode.removeChild(ads);//.style.display = "none";
                    /* 5.停止定时器 */
                    clearInterval(my_timer);
                }
                else {
                    console.log("[9sex]视频页面，未获取到地址，继续尝试...");
                }
            }
            /* 皇家会所 */
            else if (location.href.match("https://www.hjhs.*?/videos/") != null) {
                player = document.querySelector("#dplayer");
                /* 1.点击试看（不需要） */
                if (player && api && api.quality && api.quality.url) {
                    /* 2.解析真实地址 */
                    videoUrl = api.quality.url.replace("suo.", "").replace("_suo", ""); console.log("真实地址:", videoUrl);
                    /* 3.移除广告 */
                    /* 4.播放正片 */
                    play_video(videoUrl, player, document.querySelector("div.headline"));
                    /* 5.停止定时器 */
                    clearInterval(my_timer);
                }
                else {
                    console.log("[皇家会所]视频页面，未获取到地址，继续尝试...");
                }
            }
            /* The AV Pron，兼容手机 + PC
            已知缺陷: 若使用Dplayer, 则 chrome/safari 播放正常（无法新标签播放，可能有限制），kiwi m3u8地址获取成功，但播放失败！
            已知缺陷: 可能网站存在限制，控制台中player.api("hls")有值，但脚本获取为null 。只有使用 unsafeWindow.player.api("hls")能获取到 ，
            但由于userscript不支持unsafeWindow，故safari浏览器+userscript无效。改为从<script/>内容查找m3u8地址 */
            else if (location.href.match("https://theav.*?.com/videos/") != null) {
                if (1) {
                    /* 1.点击试看（不需要） */
                    /* 2.解析真实地址 */
                    /* videoUrl = player.api("hls").url.split('?')[0]; .match("https:(.*?).m3u8")[0]; 该方案在safari浏览器+userscript下无效 */
                    videoUrl = document.body.innerHTML.match("https:(.*?).m3u8")[0]; /* $("script").text() */
                    console.log("真实地址:", videoUrl);
                    /* 3.移除广告 */
                    ads = document.querySelector(".table"); if (ads) ads.style.display = "none";
                    ads = document.querySelector(".sponsor"); if (ads) ads.style.display = "none";
                    ads = document.querySelector(".rate_box"); if (ads) ads.style.display = "none";
                    ads = document.querySelector(".green"); if (ads) ads.style.display = "none";
                    /* 4.播放正片 */
                    /* play_video(videoUrl, document.querySelector(".player"), document.querySelector("h2.title"));该方案在kiwi+tempermonkey下无效 */
                    Playerjs({ id: "newplayer", file: videoUrl, autoplay: 1 });
                    /* 5.停止定时器 */
                    clearInterval(my_timer);
                }
                else {
                    console.log("[The AV Pron]视频页面，未获取到地址，继续尝试...");
                }
            }
            /* 快猫，兼容手机 + PC */
            else if (location.href.match("https://.*?km.*?.com/videoContent/") != null) {
                player = document.querySelector("#videoContent");
                /* 1.点击试看（不需要） */
                if (player && player.__vue__ && player.__vue__.formatUrl) {
                    /* 2.解析真实地址 */
                    videoUrl = player.__vue__.formatUrl; console.log("真实地址:", videoUrl);
                    /* 3.移除广告 */
                    ads = document.querySelector(".exchangeBg"); if (ads != null) ads.style.display = "none";
                    /* 4.播放正片 */
                    play_video(videoUrl, document.querySelector("div.backImg"), document.querySelector("div.videoTitle") || document.querySelector("div p.name"));
                    /* 5.停止定时器 */
                    clearInterval(my_timer);
                }
                else {
                    console.log("[快猫]视频页面，未获取到地址，继续尝试...");
                }
            }
            /* 红杏，兼容手机 + PC */
            else if (location.href.match("https://.*?/#/moves/playvideo/") != null) {
                shikan = document.querySelector("div.shikan") || document.querySelector("div.on_play");
                player = document.querySelector(" div#mse") || document.querySelector("div.play_video_1 div");
                if (shikan) {
                    /* 1.点击试看 */
                    shikan.click(); console.log("点击试看！");
                }
                else if (player && player.__vue__ && player.__vue__.playUrl) {
                    /* 2.解析真实地址 */
                    let videoUrl = player.__vue__.playUrl.split('&time')[0]; console.log("真实地址:", videoUrl);
                    /* 3.移除试看 */
                    player.__vue__.player && player.__vue__.player.hls && player.__vue__.player.hls.destroy();
                    /* 4.播放正片 */
                    play_video(videoUrl, document.querySelector(" div#mse") || document.querySelector("div.play_video_1 div.dplayer"), document.querySelector("div.move_name") || document.querySelector("div.play_main_1"));
                    /* 5.停止定时器 */
                    clearInterval(my_timer); console.log("停止定时器！");
                }
                else {
                    console.log("[红杏]视频页面，未获取到地址，继续尝试...");
                }
            }
            /* 含羞草视频 ，兼容手机 + PC */
            else if (location.href.match("/videoContent/") != null) {
                shikan = document.querySelector(".van-icon-play-circle-o") || document.querySelector("a.linkOutButton.try"); /* 前面为手机。后面为PC */
                player = document.querySelector("div#videoContentPlayer") || document.querySelector("#tryVideo");
                ads = document.querySelector(".fixedTryWatchShowButtonLine");
                if (shikan) {
                    /* 1.点击试看 */
                    shikan.click(); console.log("点击试看！");
                }
                else if (player && player.__vue__.videoUrl) {
                    /* 2.解析真实地址 */
                    videoUrl = player.__vue__.videoUrl.split(/start.*?sign/).join('sign'); console.log("真实地址:", videoUrl);
                    /* 3.移除试看、广告 */
                    player.__vue__.videoObj && player.__vue__.videoObj.hls && player.__vue__.videoObj.hls.destroy();
                    ads && (ads.style.display = "none");
                    /* 4.播放正片 */
                    play_video(videoUrl, player, document.querySelector("div.publicVideoInfoBox p.name") || document.querySelector("div.infoAreaBox"));
                    /* 5.停止定时器 */
                    clearInterval(my_timer); console.log("停止定时器！");
                }
                else {
                    console.log("[含羞草]视频页面，未获取到地址，继续尝试...");
                }
            }
            /* 含羞草，PC端，直播 */
            else if (location.href.match("/live/") != null) {
                player = document.querySelector("div.VideoAuthAdminBg") || document.querySelector("div#livePlayer");
                videoUrl = player.__vue__.videoUrl || player.__vue__.videoContent.pull; console.log("直播地址:", videoUrl);
                play_video(videoUrl, player, document.querySelector("div.userInfo p.name"));
                clearInterval(my_timer);
            }
            /* 含羞草，手机端，直播 */
            else if (location.href.match("//h5.*?/live") != null) {
                player = document.querySelector("div#publicLiveListModule");
                let videoUrl_list = player.__vue__.list; console.log("直播地址:", videoUrl_list);
                let divlist = document.querySelectorAll("ul.liveListBg li .bottom");
                let len = (videoUrl_list.length > divlist.length) ? divlist.length : videoUrl_list.length;
                for (var i = 0; i < len; i++) {
                    divlist[i].innerHTML += '<p><a href="' + videoUrl_list[i].pull + '" target="_blank">' + videoUrl_list[i].pull + '</a></p>';
                }
                clearInterval(my_timer);
                /* 1. 显示地址 */
                var mydiv = document.createElement('div');
                mydiv.innerHTML = '<p id="my_add_dizhi" style="color:red;font-size:14px">提示：彦祖们，请点击图片下方的链接看破解后的直播视频！</p>';
                document.querySelector("div.topBannerBg").after(mydiv);
            }
            else {
                /* 麻豆TV */ /* 91TV */
                localStorage.setItem("vip_level", '1');
                console.log("地址未匹配，停止定时器!");
                clearInterval(my_timer);
            }
            show_err_log(null);
        }
        catch (err) {
            console.log(`${err}`);
            show_err_log(err);
        }
    }

    let my_timer = setInterval(get_videourl, 2000);

    var oldhref = location.href;
    setInterval(function () {
        if (location.href != oldhref) {
            console.log("监听到地址变化,再次启动【获取视频定时器】!");
            var xxx = document.querySelector("#my_add_dizhi"); xxx && xxx.parentNode.removeChild(xxx); /* 含羞草手机需要删除之前的提示 */
            oldhref = location.href;
            err_cnt = 0;
            my_timer = setInterval(get_videourl, 1000);
        }
    }, 1000);

})();