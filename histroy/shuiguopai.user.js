// ==UserScript==
// @name         水果派/91视频破解VIP视频免费看
// @namespace    shuiguopai_vip_video_free_see
// @version      1.1
// @description  来不及解释了，快上车！！！
// @author       w2f
// @match        https://w1.emrqyj.com/*
// @match        https://w2.emrqyj.com/*
// @match        https://w3.emrqyj.com/*
// @match        https://yypwa1.f82udwl.com/*
// @match        https://yypwa2.f82udwl.com/*
// @match        https://yypwa3.f82udwl.com/*
// @match        https://yypwa4.f82udwl.com/*
// @match        https://yypwa5.f82udwl.com/*
// @icon         https://w1.emrqyj.com/favicon.png
// @license      MIT
// @grant        GM_addStyle
// @require      https://scriptcat.org/lib/637/1.4.5/ajaxHooker.js#sha256=EGhGTDeet8zLCPnx8+72H15QYRfpTX4MbhyJ4lJZmyg=
// @run-at       document-start
// @downloadURL https://update.sleazyfork.org/scripts/529281/%E6%B0%B4%E6%9E%9C%E6%B4%BE91%E8%A7%86%E9%A2%91%E7%A0%B4%E8%A7%A3VIP%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.user.js
// @updateURL https://update.sleazyfork.org/scripts/529281/%E6%B0%B4%E6%9E%9C%E6%B4%BE91%E8%A7%86%E9%A2%91%E7%A0%B4%E8%A7%A3VIP%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    // 1.创建播放器容器
    const player = document.createElement('div');
    player.id = 'hlsPlayer';
    player.innerHTML = `<div class="player-footer">
            <text id="showTips">⌛️破解中...</text>
            <a id="changeSrc1" href="" target="_blank" style="color:red;"></a>
            <a id="changeSrc" href="" target="_blank" style="color:red;"></a>
        </div>`;
    // HLS播放器初始化
    const videosrcEl = player.querySelector('#changeSrc');
    const videosrcElx = player.querySelector('#changeSrc1');
    const showTipsEl = player.querySelector('#showTips');
    let hls = null;
    let num = 1;

    // 样式设置
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
        }`);

    ajaxHooker.protect();
    ajaxHooker.filter([
        {type: 'xhr', url: '.m3u8?auth_key=', method: 'GET', async: true},
        //{type: 'xhr', url: /^https:\/\/\w+play\.\w+\.(com|cn)/, method: 'GET', async: true},
    ]);
    ajaxHooker.hook(request => {
        if (1) {
            console.log("hooked!!! request ====>",request);
            let url = new URL(request.url);
            let seg = url.host.split('.');
            seg[0] = 'long';
            url.host = seg.join('.');
            request.url = url.href;
            show_tips(url.href);//显示优化
        }
    });

    function show_tips(m3u8url){
        showTipsEl.innerText = `✅视频${num++}破解成功:`;
        videosrcEl.href=`https://tools.thatwind.com/tool/m3u8downloader#m3u8=${m3u8url}&referer=${window.location.href}&filename=${document.title}`; //url;
        videosrcEl.innerText = "⏬一键下载";
        videosrcElx.href=`${m3u8url}`; //url;
        videosrcElx.innerText = "🎬在线播放";
    }
    // 2.获取视频地址 // 3.加载HLS视频
    function check_circle(){
        if(!document.body){
            console.log("⌛️加载DOM中...");
            return ;
        }
        // 1.2加载播放器容器
        document.body.appendChild(player);
        clearInterval(my_timer);
    }

    let my_timer = setInterval(check_circle, 2000);
})();