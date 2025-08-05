// ==UserScript==
// @name         [tools]📺视频播放器
// @namespace    videoplayer
// @version      1.0
// @description  try to take over the world!
// @author       w2f
// @match        https://*/*
// @icon         http://iciba.com/favicon.ico
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
            <text id="showTips">⌛️破解中...</text>
            <span id="changeSrc"></span>
            <div><text id="showTips2"></text>
            <span id="changeSrc2"></span></div>
        </div>`;

    // HLS播放器初始化
    const video = player.querySelector('#videoElement');
    const videosrcEl = player.querySelector('#changeSrc');
    const videosrcEl2 = player.querySelector('#changeSrc2');
    const showTipsEl = player.querySelector('#showTips');
    const showTipsEl2 = player.querySelector('#showTips2');
    let hls = null;

    // 1.1样式设置
    GM_addStyle(`
        #hlsPlayer {
            position: fixed;
            top: 0px;
            right: 0px;
            max-width: 100vw;
            mex-height:100vh;
            background: #1a1a1a;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 2147483647;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color:red;font-size:14px;word-wrap: break-word;word-break: break-all;
        }
        #videoElement {
            max-width: 50vw;
            max-height: 50vh;
            border-radius: 0 0 8px 8px;
        }
    `);

    // 函数:加载HLS视频
    function loadHlsStream(url) {
        if (Hls.isSupported()) {
            if(hls) hls.destroy();
            hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play();
                showTipsEl.innerText = `✅破解成功:`;
                showTipsEl2.innerText = `⏬一键下载:`;
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
        if(window.m3u8_url){
            const url = window.m3u8_url;
            // 1.2加载播放器容器
            document.body.appendChild(player);
            loadHlsStream(url);
            clearInterval(my_timer);
        }else{
            console.log("⌛️视频破解中...");
        }
    }

    let my_timer = setInterval(check_circle, 2000);
})();