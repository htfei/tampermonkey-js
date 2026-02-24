// ==UserScript==
// @name         海角社区试看收费视频免费看
// @namespace    haijiao_vip_video_free_see
// @version      1.5
// @description  来不及解释了，快上车！！！
// @author       w2f
// @match        https://haijiao.com/*
// @match        https://www.haijiao.com/*
// @include      /^http(s)?:\/\/hj\w+\.top/
// @include      /^http(s)?:\/\/www\.hj\w+\.top/
// @icon         https://haijiao.com/images/common/project/favicon.ico
// @license      MIT
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// @connect      supabase.co
// @require      https://unpkg.com/@supabase/supabase-js@2.49.3/dist/umd/supabase.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.1.5/hls.min.js
// @require      https://scriptcat.org/lib/5008/1.0.9/chatRoomLibrary.js#sha384=q97t2pA7/+cd/pNF0yV+5YtYPJqqaQ3Z1UALOdmAsmre12tn+QkWKrIvemIPFJKV
// @require      https://scriptcat.org/lib/5007/1.0.5/supabaseClientLibrary.js#sha384=Lmn3Xw4T1M9EafLVLt1ffUVaBi0b5jVrj+bUN9CJaDQsoH+cZysJBi49WimPRFtT
// @require      https://scriptcat.org/lib/5398/1.4.10/ajaxHookerPlus.js#sha384=ty7aE6hlwCMmx4h3hx6Z1u50oEE6eYzHTMD77QEXBx8tSaKL0z2lhN72wPa6JCyM
// @downloadURL  https://update.sleazyfork.org/scripts/560388/%E6%B5%B7%E8%A7%92%E7%A4%BE%E5%8C%BA%E6%94%B6%E8%B4%B9%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.user.js
// @updateURL    https://update.sleazyfork.org/scripts/560388/%E6%B5%B7%E8%A7%92%E7%A4%BE%E5%8C%BA%E6%94%B6%E8%B4%B9%E8%A7%86%E9%A2%91%E5%85%8D%E8%B4%B9%E7%9C%8B.meta.js
// ==/UserScript==

(async function () {
    'use strict';
    let video_info = {};
    var my_parse = JSON.parse;//解析 JSON 字符串
    JSON.parse = function (params) {
        //这里可以添加其他逻辑比如 debugger
        let json_obj = my_parse(params);

        //console.log("json_parse params:",params); //打印劫持到的json字符串
        if (json_obj?.attachments instanceof Array) {
            console.log("json_parse :", json_obj);
            let arr = json_obj.attachments;
            let len = arr.length;
            for (let j = 0; j < len; j++) {
                let item = arr[j];
                if (item?.category == "video") {
                    //console.log("json_parse video :", item);
                    //video_info = item;
                    /*
                    {
                        "id": 1801581,
                        "remoteUrl": "https://ts.hj25ja21a8.top/hjstore/video/20220508/0148c44d2c09980a233ad362211b0e54/49253_i_preview.m3u8",
                        "category": "video",
                        "status": 1,
                        "coverUrl": "https://test.hjbd80.top/hjstore/video/20220508/0148c44d2c09980a233ad362211b0e54/49253.jpeg.txt",
                        "video_time_length": 805
                    },
                    //注意看：remoteUrl = fn(coverUrl,id)
                    {
                        "id": 3743357,
                        "remoteUrl": "https://ts.hj25ja21a8.top/hjstore/video/20221207/59d98b2bb45a657d602e3bd3fd8646aa/1158983743357.m3u8",
                        "category": "video",
                        "status": 1,
                        "coverUrl": "https://test.hjbd80.top/hjstore/video/20221207/59d98b2bb45a657d602e3bd3fd8646aa/115898.jpeg.txt"
                    },
                    //普通1 普通2 VIP线路，类似这种没有时长、没有视频地址(但可以猜出来)；页面直接就是完整视频;
                    //✅：https://ts.hj25ja21a8.top/hjstore/video/20250813/083dfee2dbfde94cdc24a636fc1c8168/416428_i_preview.m3u8
                    //❌：remoteUrl != fn(coverUrl,id)
                   {
                        "id": 11438849,
                        "remoteUrl": "",
                        "category": "video",
                        "status": 1,
                        "coverUrl": "https://test.hjbd80.top/hjstore/video/20250813/083dfee2dbfde94cdc24a636fc1c8168/416428.jpeg.txt"
                    }
                    */
                    //video_info.video_time_length = item.video_time_length;//⚠️不能读这个属性,否则跳转error
                    //video_info.id = item.id;
                    //console.log("video_info :", video_info);
                    video_info = {
                        //...item,
                        video_time_length: item.video_time_length,
                        // 以下属性是为了和chatRoom.addMsgCard(msg)方法的参数一致
                        id: json_obj.topicId || item.id,
                        //url: window.location.href,
                        content: json_obj.title,
                        video_url: item.remoteUrl,
                        //image_url: item.coverUrl,
                        ok: 0
                    }
                    break;
                }
            }
        }
        /*else if (json_obj instanceof Array) {
            //海角h5短视频:remoteUrl 假地址 //真实url= fn(remoteUrl);
             //https://ts.hj25ja21a8.top/hjstore/video/20260207/681d56bc9c58622288d153431e1b95de/12619941kkkw8QuU_i.m3u8
             {
             "id": 12619941,
             "remoteUrl": "/api/address/video/20260207/681d56bc9c58622288d153431e1b95de/12619941kkkw8QuU_i4e7bad2f4f3a591beb2c6b9a4933f889.m3u8",
             "category": "video",
             "status": 1,
             "coverUrl": "https://test.hjbd80.top/hjstore/video/20260207/681d56bc9c58622288d153431e1b95de/475081.jpeg.txt"
             }
            if (json_obj[0]?.attachment) { //海角h5短视频
                console.log("[tools]🚧劫持json-list:", json_obj);
                let arr = json_obj;
                let len = arr.length;
                for (let j = 0; j < len; j++) {
                    let item = arr[j];
                    let video_info2 = {
                        id: item.id,
                        url: window.location.href,
                        content: item.title || document.title,
                        video_url: "https://ts.hj25ja21a8.top/hjstore" + item.attachment?.remoteUrl.split('_i')[0]?.split('address')[1] + "_i.m3u8",
                        image_url: item.attachment?.coverUrl,
                    };
                    // 加载卡片，发送消息
                    chatRoom.addMsgCard(video_info2);
                    SbCLi.sendMessage(video_info2);
                }
            }
        }*/
        return json_obj;
    };

    // 如果库劫持失败，可能是其他代码对xhr/fetch进行了二次劫持，protect方法会尝试阻止xhr和fetch被改写。
    ajaxHooker.protect();
    // 为hook方法设置过滤规则，只有符合规则的请求才会触发hook
    ajaxHooker.filter([
        //{ type: 'xhr', url: '.m3u8', method: 'GET', async: true },
        { url: ".m3u8" },//劫持所有url包含指定字符串的请求
    ]);
    // 通过一个回调函数进行劫持，每次请求发生时自动调用回调函数。
    ajaxHooker.hook(request => {
        //console.log(`[tools]🚧劫持${request.type}-${request.method}:`, request,video_info);
        request.response = res => {
            //console.log(`[tools]🚧2劫持${request.type}-${request.method}:`, request.url,video_info);
            if (video_info.video_time_length) {
                // 加载卡片，发送消息
                video_info.content += `(⚠️:请在原始网页中观看完整视频(${video_info.video_time_length}秒)!)`;
                video_info.ok++;
                //chatRoom?.addMsgCard(video_info);
                //console.log("[tools]🔍ajaxHooker请求拦截器 修改前:", res.responseText.length);
                res.responseText = modifyResponse_m3u8(res.responseText);
                //console.log("[tools]🔍ajaxHooker请求拦截器 修改后:", res.responseText.length);
            } else if (video_info.id) {
                //部分post无法捕获video_time_length
                //video_info.content += `(⚠️:请在原始网页中观看完整视频(无时长信息))！`;
                video_info.video_url = request.url;
                video_info.ok++;
            }
            //h5短视频，由于页面缓存了xhr，这里可能捕获不到
            return res.responseText;//直接返回，在circle中加载UI
        };
    });

    // 将xhr和fetch恢复至劫持前的状态，调用此方法后，hook方法不再生效。
    // ajaxHooker.unhook();

    //自定义rsp修改函数
    //为m3u8文件追加ts分片, 不支持追加带hash加密参数的ts分片
    function modifyResponse_m3u8(originalText) {

        // Base64解码处理
        let flag = 0;
        try {
            const decodedText = decodeURIComponent(escape(atob(originalText)));
            //console.log('[tools]🔍 Base64解码成功，解码后长度:', decodedText.length, decodedText);
            originalText = decodedText;
            flag = 1;
        } catch (e) {
            //console.log('[tools]🔍 非Base64编码内容，直接处理');
        }

        // 修改 m3u8 内容：插入 160.ts
        let modifiedText = originalText;
        let timelen = video_info.video_time_length || 900; //若未获取到时长在，则默认900s

        // 你可以使用正则定位插入点，比如在 ENDLIST 前加入新片段
        // TS片段配置（可扩展）
        // 配置参数
        const TS_DURATION = 1.25; // 每个片段时长(秒) ⚠️:部分网站每个ts片段时长不一致, 但目前看不影响播放,具体取决于浏览器行为
        const MAX_TS_COUNT = parseInt(timelen / TS_DURATION + 0.8);//30*30; // 最大生成数量 ⚠️:目前给了个很大的值,30*30*2s=30min时长, 如果能获取到真实时长这里最好修改
        //const TS_FILENAME = video_info.id + '_i{0}.ts'; //每个片段文件名 🔴:这里要拼接完整的ts地址,如果后面有参数也要加上,如果参数部分有加密hash则无法破解❌ //bug:不完全是videoid 也不完全是这个格式 [id]uHdsRav8_i{0}.ts
        const TS_PREFIX = 0; // 每个片段文件名前缀补0个数 🔴:这里一定要填对，否则拼接的ts地址不对，下载会失败

        // 预处理后的内容分析
        let TS_FILENAME = null;//也可通过jpeg提取
        let lastTsMatch = originalText.match(/\n(.*?)\_i0.ts/); //⚠️: 不同站点这个匹配模式也需要改
        if (lastTsMatch) {
            TS_FILENAME = lastTsMatch[1] + '_i{0}.ts';
        } else {
            lastTsMatch = originalText.match(/\n(.*?)0.ts/); //⚠️: 不同站点这个匹配模式也需要改
            if (lastTsMatch) {
                TS_FILENAME = lastTsMatch[1] + '{0}.ts';
            }
        }
        if (!lastTsMatch) {
            //解析失败，返回原始text
            console.log("智能解析m3u8的TS文件名失败", originalText);
            return originalText;
        }
        //console.log("[tools]🔍ajaxHooker请求拦截器 智能解析最后一个TS文件名:", lastTsMatch);

        let startNumber = 0;//⚠️: 不同站点这个匹配模式也需要改
        let header = originalText.slice(0, originalText.indexOf("#EXTINF"));

        // 生成连续TS片段
        const fragments = Array.from({ length: MAX_TS_COUNT }, (_, i) =>
            `#EXTINF:${TS_DURATION},\n${TS_FILENAME.replace('{0}', `${(startNumber + i).toString().padStart(TS_PREFIX, '0')}`)}`
        ).join('\n');

        modifiedText = header + fragments + '\n#EXT-X-ENDLIST';
        //console.log('[tools]🔍 拼接成功，修改后m3u8内容:', modifiedText);

        // 编码为Base64
        if (flag) {
            const encodedText = btoa(unescape(encodeURIComponent(modifiedText)));
            //console.log('[tools]🔍 Base64编码成功，编码后长度:', encodedText.length);
            return encodedText;
        }

        return modifiedText;
    }

    let last_shortvid = null;
    function remove_ad() {
        if (video_info.ok == 1) {
            video_info = {
                ...video_info,
                url: window.location.href,
                //id: json_obj.mediaInfo.id,
                //content: video_info.content || document.title,
                //video_url: request.url,
                //image_url: video_info.image_url,
            };
            // 加载卡片，发送消息
            chatRoom?.addMsgCard(video_info);
            SbCLi?.sendMessage(video_info);
            video_info.ok++;//清空，避免影响下次解析
        }
        //document.querySelector("div.el-message-box__wrapper button")?.click();//去除 试看完毕 弹窗
        //h5短视频方案2：从localStorage中获取视频列表
        let shortvid = parseInt(document.querySelector("div#video_box > div.top_row > div:nth-child(2)")?.innerText?.split(' ')?.at(1));
        if (shortvid && shortvid != last_shortvid) {
            let videoList = JSON.parse(localStorage.getItem("videoList")) || [];
            let len = videoList.length;
            for (let j = 0; j < len; j++) {
                let item = videoList[j];
                if (item.id == shortvid) {
                    last_shortvid = shortvid;
                    let short_video = {
                        id: item.id,
                        url: window.location.href,
                        content: item.title || document.title,
                        video_url: "https://ts.hj25ja21a8.top/hjstore" + item.attachment?.remoteUrl.split('_i')[0]?.split('address')[1] + "_i.m3u8",
                        image_url: item.attachment?.coverUrl,
                    };
                    // 加载卡片，发送消息
                    chatRoom?.addMsgCard(short_video);
                    SbCLi?.sendMessage(short_video);
                    break;
                }
            }
        }
    }
    setInterval(remove_ad, 2000);
    await SbCLi?.init('haijiao');
    const chatRoom = await ChatRoomLibrary?.initUI();
})();