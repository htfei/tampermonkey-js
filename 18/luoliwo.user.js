// ==UserScript==
// @name         萝莉窝破解VIP视频免费看
// @namespace    luoliwo_vip_video_free_see
// @version      1.3
// @description  来不及解释了，快上车！！！
// @author       w2f
// @match        https://daga88n.com/*
// @include      /^http(s)?:\/\/daga88n\d+\.(com|xyz)/
// @icon         https://daga88n.com/favicon.ico
// @license      MIT
// @grant        GM_log
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @run-at       document-body
// @connect      supabase.co
// @require      https://unpkg.com/@supabase/supabase-js@2.49.3/dist/umd/supabase.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.1.5/hls.min.js
// @require      https://scriptcat.org/lib/5007/1.0.4/supabaseClientLibrary.js#sha384=UVgc6octvKJ1F7mziyZvq8As2JOFlBP67kH/AOywBSXFrlKuyXMJCViIiNfbAjgu
// @require      https://scriptcat.org/lib/5008/1.0.6/chatRoomLibrary.js#sha384=K75aUnIAOk8+4AgNJhFH/4Z5ouseZgL0DZxQjyMkXf8+ZLZdI2dsPWsQBEbwSptw
// @downloadURL https://update.sleazyfork.org/scripts/547842/%E8%90%9D%E8%8E%89%E7%AA%9D%E7%A0%B4%E8%A7%A3VIP%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.user.js
// @updateURL https://update.sleazyfork.org/scripts/547842/%E8%90%9D%E8%8E%89%E7%AA%9D%E7%A0%B4%E8%A7%A3VIP%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.meta.js
// ==/UserScript==

(async function () {
    'use strict';

    // 初始化
    await SbCLi.init('luoliwo');
    const chatRoom = await ChatRoomLibrary.initUI();

    function check_circle() {

        const el = document.querySelector('.video-before-ad.noVip') || document.querySelector('.img-bg.openVip');
        const bgUrl = el?.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];
        //console.log('🎯 背景图链接:', bgUrl);
        window.m3u8_url = bgUrl?.replace('1.jpg', 'index.m3u8');

        if (window.m3u8_url) {
            const videoInfo = {
                url: window.location.href,
                content: document.title,
                video_url: window.m3u8_url,
                image_url: bgUrl,
            };
            // 加载卡片，发送消息
            if (SbCLi.decreaseTrialCount() > 0){
                chatRoom.addMsgCard(videoInfo);
            }
            else{
                chatRoom.addMsgCard({ content: '设备未激活，今日试看次数已用完！' });
            }
            const res = SbCLi.sendMessage(videoInfo);
            GM_log('发送消息的响应:', res);

            clearInterval(my_timer);
        }
    }

    let my_timer = setInterval(check_circle, 2000);
})();