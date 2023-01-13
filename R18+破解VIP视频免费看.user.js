// ==UserScript==
// @name         快猫/红杏/含羞草/麻豆/AvPron/皇家会所/9sex/91TV/破解VIP视频免费看
// @namespace    http://tampermonkey.net/
// @version      0.24
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
// @inject-into  content
// @icon         https://index.madou19.tv/json/icon.png
// @require      https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.1.5/hls.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/dplayer/1.26.0/DPlayer.min.js
// @grant unsafeWindow
// ==/UserScript==

(function () {
    'use strict';

    /* none 如果不使用 unsafeWindow ，快猫手机端，含羞草pc端会播放失败，原因未知。 */
    let my_timer = setInterval(get_videourl, 2000);
    let err_cnt = 0;
    let show_err_flag = 1;

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

    function get_videourl() {
        let wd = unsafeWindow || window; /* safari 不支持 unsafeWindow */
        let videoUrl = null;
        let player = null;
        let dizhi = null;
        let shikan = null;
        let ads = null;
        try {
            /* 9sex */
            if (location.href.match("https://.*?/index/movie/play/id/")) {
                /* 1.点击试看（不需要） */
                /* 2.解析真实地址 */
                let text = $("script").text() || document.body.innerHTML;/* safari 可能不支持$("script").text() */
                dizhi = text.match("movies/(.*?)_preview.jpg.txt")[1].split('/');
                let videoUrl = `https://9s.m3.bca834d60257.com/${dizhi[0]}/${dizhi[1]}/360P/${dizhi[2]}_360P.m3u8`; console.log("真实地址:", videoUrl);
                let videoUrl2 = `https://9s.m3.bca834d60257.com/${dizhi[0]}/${dizhi[1]}/480P/${dizhi[2]}_480P.m3u8`; console.log("真实地址2:", videoUrl2);
                let videoUrl3 = `https://9s.m3.bca834d60257.com/${dizhi[0]}/${dizhi[1]}/720P/${dizhi[2]}_720P.m3u8`; console.log("真实地址3:", videoUrl3);
                let videoUrl4 = `https://9s.m3.bca834d60257.com/${dizhi[0]}/${dizhi[1]}/1080P/${dizhi[2]}_1080P.m3u8`; console.log("真实地址4:", videoUrl4);
                /* 3.vip视频需要移除登录框 */
                remove_ads(document.querySelector("#login-tip-modal"));
                remove_ads(document.querySelector(".vip-tip-modal"));
                remove_ads(document.querySelector(".pause-ad-imgbox"));
                /* 4.播放正片 */
                play_video2(videoUrl, videoUrl2, videoUrl3, videoUrl4, document.querySelector("#dplayer"), document.querySelector("div.notice"));
                /* 5.停止定时器 */
                clearInterval(my_timer); console.log("停止定时器！");
            }
            /* 皇家会所 */
            else if (location.href.match("https://www.hjhs.*?/videos/")) {
                /* 1.点击试看（不需要） */
                /* 2.解析真实地址 */
                videoUrl = wd.api.quality.url.replace("suo.", "").replace("_suo", ""); console.log("真实地址:", videoUrl);
                /* 3.移除广告 */
                /* 4.播放正片 */
                play_video(videoUrl, document.querySelector("#dplayer"), document.querySelector("div.headline"));
                /* 5.停止定时器 */
                clearInterval(my_timer); console.log("停止定时器！");
            }
            /* The AV Pron，兼容手机 + PC */
            else if (location.href.match("https://theav10.*?.com/videos/")) {
                /* 1.点击试看（不需要） */
                /* 2.解析真实地址 */
                videoUrl = wd.player.api("hls").url.split('?')[0]; /* $("script").text().match("https:(.*?).m3u8")[0]; */
                console.log("真实地址:", videoUrl);
                /* 3.移除广告 */
                document.querySelector(".table").style.display = "none";
                document.querySelector(".sponsor").style.display = "none";
                document.querySelector(".rate_box").style.display = "none";
                document.querySelector(".green").style.display = "none";
                /* 4.播放正片 */
                play_video(videoUrl, document.querySelector(".player"), document.querySelector("h2.title"));
                /* 5.停止定时器 */
                clearInterval(my_timer); console.log("停止定时器！");
            }
            /* 快猫，兼容手机 + PC */
            else if (location.href.match("https://.*?km.*?.com/videoContent/")) {
                /* 1.点击试看（不需要） */
                /* 2.解析真实地址 */
                videoUrl = document.querySelector("#videoContent").__vue__.formatUrl; console.log("真实地址:", videoUrl);
                /* 3.移除广告 */
                remove_ads(document.querySelector(".exchangeBg"));
                /* 4.播放正片 */
                play_video(videoUrl, document.querySelector("div.backImg"), document.querySelector("div.videoTitle") || document.querySelector("div p.name"));
                /* 5.停止定时器 */
                clearInterval(my_timer); console.log("停止定时器！");
            }
            /* 红杏，兼容手机 + PC */
            else if (location.href.match("https://.*?/#/moves/playvideo/")) {
                shikan = document.querySelector("div.shikan") || document.querySelector("div.on_play");
                player = document.querySelector(" div#mse") || document.querySelector("div.play_video_1 div");
                if (shikan) {
                    /* 1.点击试看 (有就点，没有说明点过了消失了) */
                    shikan.click(); console.log("点击试看！");
                }
                else if( player && player.__vue__ && player.__vue__.playUrl){
                    /* 2.解析真实地址 */
                    videoUrl = player.__vue__.playUrl.split('&time')[0]; console.log("真实地址:", videoUrl);
                    /* 3.移除试看 */
                    player.__vue__.player && player.__vue__.player.hls && player.__vue__.player.hls.destroy();
                    /* 4.播放正片 */
                    play_video(videoUrl,
                               document.querySelector(" div#mse") || document.querySelector("div.play_video_1 div.dplayer"),
                               document.querySelector("div.move_name") || document.querySelector("div.play_main_1"));
                    /* 5.停止定时器 */
                    clearInterval(my_timer); console.log("停止定时器！");
                }
            }
            /* 含羞草视频 ，兼容手机 + PC */
            else if (location.href.match("/videoContent/")) {
                shikan = document.querySelector(".van-icon-play-circle-o") || document.querySelector("a.linkOutButton.try"); /* 前面为手机。后面为PC */
                player = document.querySelector("div#videoContentPlayer") || document.querySelector("#tryVideo");
                if (shikan) {
                    /* 1.点击试看 */
                    shikan.click(); console.log("点击试看！");
                }
                else {
                    /* 2.解析真实地址 */
                    videoUrl = player.__vue__.videoUrl.split(/start.*?sign/).join('sign'); console.log("真实地址:", videoUrl);
                    /* 3.移除试看、广告 */
                    player.__vue__.videoObj && player.__vue__.videoObj.hls && player.__vue__.videoObj.hls.destroy();
                    remove_ads(document.querySelector(".fixedTryWatchShowButtonLine"));
                    /* 4.播放正片 */
                    play_video(videoUrl, player, document.querySelector("div.publicVideoInfoBox p.name") || document.querySelector("div.infoAreaBox"));
                    /* 5.停止定时器 */
                    clearInterval(my_timer); console.log("停止定时器！");
                }
            }
            /* 含羞草，PC端，直播 */
            else if (location.href.match("/live/")) {
                player = document.querySelector("div.VideoAuthAdminBg") || document.querySelector("div#livePlayer");
                videoUrl = player.__vue__.videoUrl || player.__vue__.videoContent.pull; console.log("直播地址:", videoUrl);
                play_video(videoUrl, player, document.querySelector("div.userInfo p.name"));
                /* 5.停止定时器 */
                clearInterval(my_timer); console.log("停止定时器！");
            }
            /* 含羞草，手机端，直播 */
            else if (location.href.match("//h5.*?/live")) {
                /* 1.点击试看 */
                /* 2.解析真实地址 */
                let videoUrl_list = document.querySelector("div#publicLiveListModule").__vue__.list; console.log("直播地址:", videoUrl_list);
                /* 3.移除试看、广告 */
                /* 4.显示地址 */
                var mydiv = document.createElement('div');
                mydiv.innerHTML = '<p id="my_add_dizhi" style="color:red;font-size:14px">提示：彦祖们，请点击图片下方的链接看破解后的直播视频！</p>';
                document.querySelector("div.topBannerBg").after(mydiv);
                let divlist = document.querySelectorAll("ul.liveListBg li .bottom");
                let len = (videoUrl_list.length > divlist.length) ? divlist.length : videoUrl_list.length;
                for (var i = 0; i < len; i++) {
                    divlist[i].innerHTML += '<p><a href="' + videoUrl_list[i].pull + '" target="_blank">' + videoUrl_list[i].pull + '</a></p>';
                }
                /* 5.停止定时器 */
                clearInterval(my_timer); console.log("停止定时器！");
            }
            else {
                /* 麻豆TV */ /* 91TV */
                wd.localStorage.setItem("vip_level", '1');
                console.log("地址未匹配，停止定时器!");
                /* 5.停止定时器 */
                clearInterval(my_timer); console.log("停止定时器！");
            }
        }
        catch (err) {
            console.log(`${err}`);
            err_cnt++; if (err_cnt >= 10 && show_err_flag) { show_err_log(err); show_err_flag = 0 };
        }
    }

    /* 移除广告*/
    function remove_ads(el){
        el && (el.style.display = "none");
    }

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

        /* 避免多次刷新，再次停止定时器 */
        clearInterval(my_timer);

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
        var mydiv = document.createElement('div');
        mydiv.innerHTML = `<div id="my_add_err_log" style="color:red;font-size:14px">
            解析地址出错，请复制以下内容到
            <a href="https://sleazyfork.org/zh-CN/scripts/456496/feedback" target="_blank">【脚本评论区】</a>联系作者解决!请加上使用的组合，如：chrome + tempermonkey
            <p style="color:red;font-size:14px">错误打印：${err}</p>
            <p style="color:red;font-size:14px">当前地址：${location.href}</p>
            <p style="color:red;font-size:14px">操作系统：${navigator.platform}</p>
            <p style="color:red;font-size:14px">浏览器：${navigator.userAgent}</p>
            </div>`;
        document.querySelector("head").after(mydiv);
    }
})();