// ==UserScript==
// @name       萝莉窝破解VIP视频免费看
// @namespace    w2f
// @version      1.1
// @description  来不及解释了，快上车！！！
// @author       w2f
// @match       https://91uu95.xyz/*
// @match       https://*.xyz/index.php/vod/play/id/*/sid/1/nid/1.html
// @include      /^http(s)?:\/\/91uu\d+\.(cyou|xyz)/
// @icon       https://91uu95.xyz/favicon.ico
// @license      MIT
// @run-at       document-start
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.1.5/hls.min.js
// ==/UserScript==

(function() {
    'use strict';

    // 1.创建播放器容器
    const player = document.createElement('div');
    player.id = 'hlsPlayer';
    player.innerHTML = `<video id="videoElement" controls></video>
        <div class="player-footer">
            <text id="showTips">⌛️loliwo破解中...</text>
            <a id="changeSrc1" href="" target="_blank" style="color:red;"></a>
            <a id="changeSrc" href="" target="_blank" style="color:red;"></a>
        </div>`;

    // HLS播放器初始化
    const video = player.querySelector('#videoElement');
    const videosrcEl = player.querySelector('#changeSrc');
    const videosrcElx = player.querySelector('#changeSrc1');
    const showTipsEl = player.querySelector('#showTips');
    let hls = null;

    // 1.1样式设置
    GM_addStyle(`
        #hlsPlayer {
            position: fixed;
            top: 0px;
            right: 0px;
            max-width: 100vw;
            mex-height:50vh;
            background: #1a1a1a;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 2147483647;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color:red;font-size:14px;word-wrap: break-word;word-break: break-all;
        }
        #videoElement {
            max-width: 100vw;
            max-height: 50vh;
            border-radius: 0 0 8px 8px;
        }
    `);

    // 函数:加载HLS视频
    function loadHlsStream(url) {
        showTipsEl.innerText = `✅破解成功:`;
        videosrcEl.href=`https://tools.thatwind.com/tool/m3u8downloader#m3u8=${url}&referer=${window.location.href}&filename=${document.title}`; //url;
        videosrcEl.innerText = "⏬一键下载";
        videosrcElx.href=`${url}`;
        videosrcElx.innerText = "🎬在线播放";

        if (Hls.isSupported()) {
            if(hls) hls.destroy();
            hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play();
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS Error:', data);
                //showTipsEl.innerText = `❌破解成功但加载失败:(${data.type},${data.details})`;
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            video.addEventListener('loadedmetadata', () => video.play());
        }
    }



    function check_circle(){

        const el = document.querySelector('.video-before-ad.noVip') || document.querySelector('.img-bg.openVip');
        const bgUrl = el.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];
        //console.log('🎯 背景图链接:', bgUrl);
        window.m3u8_url = bgUrl.replace('1.jpg','index.m3u8');

        if(window.m3u8_url){
            const url = window.m3u8_url;
            // 1.2加载播放器容器
            document.body.appendChild(player);
            loadHlsStream(url);
            clearInterval(my_timer);
        }else{
            console.log("⌛️luoliwo 视频破解中...");
        }
    }

    let my_timer = setInterval(check_circle, 2000);
})();