// ==UserScript==
// @name         The AV Pron 免费看
// @namespace    http://tampermonkey.net/
// @version      2.1.3
// @license      MIT
// @description  脚本功能： 1.破解时长限制  2.显示视频真实地址，便于收藏下载     (tips: 1.该网站需注册登录 2.地址: https://theav101.com/)
// @author       w2f
// @match        https://theav101.com/*
// @match        https://theav108.com/*
// @match        https://theav109.com/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.1.5/hls.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/dplayer/1.26.0/DPlayer.min.js
// @icon         https://theav101.com/favicon.ico
// @grant        none
// ==/UserScript==

async function find(){

    let url = $("script").text().match("https:(.*?).m3u8")[0]
    console.log(url)
    window.dp = new DPlayer({
            element: document.querySelector(".player"),
            autoplay: true,
            theme: '#FADFA3',
            loop: true,
            lang: 'zh',
            screenshot: true,
            hotkey: true,
            preload: 'auto',
            video: {
                url: url,
                type: 'hls'
            }
        });

    //显示视频地址
    var div = document.createElement('div');
    div.innerHTML = '<div id="my_add_div"><div><p style="color:#fafafa;font-size:14px">视频地址：</p></div><a href="'+url+'" target="_blank">'+url+'</a></div>';
    document.querySelector(".player").after(div);
}



(function() {
    'use strict';

    window.onload = function (){
        setTimeout(async () =>{
            let url = await find()
            }, 3000)
    }

})();