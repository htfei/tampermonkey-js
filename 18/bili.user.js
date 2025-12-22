// ==UserScript==
// @name         哔哩视频破解VIP视频免费看
// @namespace    bili_vip_video_free_see
// @version      1.0.2
// @description  破解哔哩哔哩VIP视频，支持HLS视频播放
// @author       w2f
// @match       https://d1kek4wgeaw03m.cloudfront.net/*
// @icon        https://d1kek4wgeaw03m.cloudfront.net/logo.png
// @license      MIT
// @grant        GM_log
// @grant        GM_addStyle
// @connect      *
// @require      https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.1.5/hls.min.js
// @require      https://scriptcat.org/lib/4937/^1.0.0/FloatingUI.js#sha256=d776ab56bb50565a43df1932d2c28ce22574a00f33c9663bd5fd687fc64d9607
// @require      https://scriptcat.org/lib/637/1.4.5/ajaxHooker.js#sha256=EGhGTDeet8zLCPnx8+72H15QYRfpTX4MbhyJ4lJZmyg=
// @downloadURL https://update.sleazyfork.org/scripts/559817/%E5%93%94%E5%93%A9%E8%A7%86%E9%A2%91%E7%A0%B4%E8%A7%A3VIP%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.user.js
// @updateURL https://update.sleazyfork.org/scripts/559817/%E5%93%94%E5%93%A9%E8%A7%86%E9%A2%91%E7%A0%B4%E8%A7%A3VIP%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.meta.js
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // 自定义配置（覆盖默认图标和点击回调）
    const customConfig = {
        icons: ['✅', '🎬','🌍', '⏬'], // 默认图标
        onItemClick: (index, icon) => {
            console.log(`自定义回调触发：点击了图标[${icon}]（索引${index}）`);
            if(index == 1){
                showVideoUI();
            }
            if(icon == '🌍'){
                window.open(window.location.origin + window.real_m3u8_url, '_blank');
            }
            if(icon == '⏬'){
                downloadM3u8();
            }
        }
    };
    let fui = null;

    // 1.创建播放器容器
    const player = document.createElement('div');
    player.id = 'hlsPlayer';
    player.innerHTML = `<video id="videoElement" controls></video>`;

    // HLS播放器初始化
    const video = player.querySelector('#videoElement');
    let hls = null;

    // 1.1样式设置
    GM_addStyle(`
        #hlsPlayer {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            max-width: 100vw;
            background: #1a1a1a;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 999;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color:red;
            font-size:14px;
            word-wrap: break-word;
            word-break: break-all;
        }
        #videoElement {
            max-width: 100vw;
            max-height: 100vh;
            border-radius: 0 0 8px 8px;
        }
        #hlsToggleBtn {
            position: fixed;
            top: 10px;
            right: 10px;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4a69bd 0%, #2c3e50 100%);
            color: #fff;
            border: 2px solid rgba(255, 255, 255, 0.8);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.1);
            font-size: 22px;
            text-align: center;
            line-height: 38px;
            cursor: pointer;
            z-index: 2147483647;
            user-select: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(5px);
        }
        #hlsToggleBtn:hover {
            background: linear-gradient(135deg, #5f86da 0%, #34495e 100%);
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(255, 255, 255, 0.2);
        }
        #hlsToggleBtn:active {
            transform: scale(0.95);
            background: linear-gradient(135deg, #3a56a0 0%, #232f3e 100%);
        }
    `);

    // 下载m3u8文件
    function downloadM3u8(url = window.real_m3u8_url) {
        const titleEl = document.querySelector("div.collect-title") || document.querySelector("div.video-title");
        const title= titleEl?.innerText || document.title;
        const downurl = `https://tools.thatwind.com/tool/m3u8downloader#m3u8=${window.location.origin}${url}&referer=${window.location.origin}&filename=${title}`;//cururl;
        window.open(downurl,"_blank");
    }
    // 显示/隐藏videoUI
    function showVideoUI() {
        const player = document.getElementById('hlsPlayer');
        const videoElement = document.getElementById('videoElement');
        
        if (player) {
            if (player.style.display === 'none') {
                // 显示播放器
                player.style.display = 'block';
                
                // 显示播放器后自动播放视频
                if (videoElement && videoElement.src) {
                    videoElement.play().catch(error => {
                        console.log('自动播放失败，可能需要用户交互:', error);
                        // 可以在这里添加提示，告诉用户需要手动点击播放
                    });
                }
            } else {
                // 隐藏播放器前暂停视频
                if (videoElement && !videoElement.paused) {
                    videoElement.pause();
                }
                // 隐藏播放器
                player.style.display = 'none';
            }
        }
    }
    
    // 函数:加载HLS视频
    function loadHlsStream(url) {
        if (Hls.isSupported()) {
            if(hls) hls.destroy();
            hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play();
                // 显示播放器
                player.style.display = 'block';
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

    ajaxHooker.protect();
    ajaxHooker.filter([
        { type: 'xhr', url: '.m3u8?token=', method: 'GET', async: true },
    ]);
    ajaxHooker.hook(request => {
        if (1) {
            console.log("hooked!!! request ====>", request);
            request.url = request.url.replace('_0001.m3u8','.m3u8');
            console.log("url fixed ====>", request.url);
            window.real_m3u8_url = request.url;
            loadHlsStream(request.url);
        }
    });


    function check_circle() {
        if(!document.body){
            console.log("⌛️加载DOM中...");
            return ;
        }
        // 1.2加载播放器容器
        if (!document.getElementById('hlsPlayer')) {
            document.body.appendChild(player);
        }

        // 1.3初始化悬浮UI实例（传入自定义配置）
        if (!fui) {
            fui = new FloatingUI(customConfig);
        }

        //去广告
        document.querySelector("body > div.vue-nice-modal-root > div > div > div > div.absolute.right-16.top-32 > div")?.click();//去除 开屏广告 5s倒计时
        document.querySelector("div.homeAdPop")?.remove();//去除 4次 广告弹窗
        document.querySelector("div.vue-nice-modal-root")?.remove();
        document.querySelector("div.van-swipe.swiper_main_ad")?.remove();//5s倒计时AD 点击

        document.querySelector("div.van-overlay")?.remove();
        document.querySelector("div.vip-pop-main")?.remove();
    }
    setInterval(check_circle, 1000);

})();