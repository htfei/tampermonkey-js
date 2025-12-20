// ==UserScript==
// @name         汤头条破解VIP视频免费看🥣
// @namespace    tangtoutiao_vip_video_free_see
// @version      1.0.0
// @description  来不及解释了，快上车！！！
// @author       w2f
// @match        https://p1.xpyortno.cc/*
// @match        https://p2.xpyortno.cc/*
// @match        https://p3.xpyortno.cc/*
// @match        https://p2.xpyortno.cc/*
// @match        https://p5.xpyortno.cc/*
// @include      /^http(s)?:\/\/p\w+\.xpyortno\.(com|net|cc)/
// @icon         https://p2.xpyortno.cc/favicon.ico
// @license      MIT
// @grant        GM_log
// @connect      *
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // 调试开关
    const DEBUG = true;

    // 存储拦截的请求
    let interceptedRequests = [];

    // 拦截XMLHttpRequest
    function interceptXHR() {
        try {
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
                try {
                    this._url = url;
                    this._method = method;
                } catch (e) {
                    GM_log('[m3u8拦截器] XHR open方法拦截失败: ' + e.message);
                }
                return originalOpen.apply(this, arguments);
            };

            XMLHttpRequest.prototype.send = function (body) {
                try {
                    const self = this;

                    // 检查URL是否包含.m3u8后缀
                    if (self._url && self._url.includes('.m3u8')) {
                        const requestInfo = {
                            url: self._url,
                            method: self._method || 'GET',
                            body: body,
                            timestamp: Date.now(),
                            type: 'XHR'
                        };

                        interceptedRequests.push(requestInfo);

                        if (DEBUG) {
                            GM_log(`[m3u8拦截器] 拦截到XHR请求: ${self._url}`);
                        }
                    }
                } catch (e) {
                    GM_log('[m3u8拦截器] XHR send方法拦截失败: ' + e.message);
                }

                return originalSend.apply(this, arguments);
            };

            if (DEBUG) {
                GM_log('[m3u8拦截器] XHR拦截器已安装');
            }
        } catch (e) {
            GM_log('[m3u8拦截器] 安装XHR拦截器失败: ' + e.message);
        }
    }

    // 拦截fetch请求
    function interceptFetch() {
        try {
            if (typeof window.fetch === 'function') {
                const originalFetch = window.fetch;

                window.fetch = function (url, options) {
                try {
                    // 检查URL是否包含.m3u8后缀
                    const requestUrl = typeof url === 'string' ? url : (url?.url || '');
                    if (requestUrl && requestUrl.includes('.m3u8')) {
                        const requestInfo = {
                            url: requestUrl,
                            method: options?.method || 'GET',
                            body: options?.body,
                            timestamp: Date.now(),
                            type: 'Fetch'
                        };

                        interceptedRequests.push(requestInfo);

                        if (DEBUG) {
                            GM_log(`[m3u8拦截器] 拦截到Fetch请求: ${requestUrl}`);
                        }
                    }
                } catch (e) {
                    GM_log('[m3u8拦截器] Fetch请求处理失败: ' + e.message);
                }

                return originalFetch.apply(this, arguments);
            };

                if (DEBUG) {
                    GM_log('[m3u8拦截器] Fetch拦截器已安装');
                }
            }
        } catch (e) {
            GM_log('[m3u8拦截器] 安装Fetch拦截器失败: ' + e.message);
        }
    }

    // 拦截媒体资源请求（media类型）
    function interceptMediaRequests() {
        try {
            // 监控DOM中媒体元素的创建和变化
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    // 处理新添加的节点
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // 元素节点
                            // 检查是否是媒体元素
                            if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
                                processMediaElement(node);
                            }
                            // 检查子元素中的媒体元素
                            node.querySelectorAll('video, audio').forEach(processMediaElement);
                        }
                    });

                    // 处理属性变化
                    if (mutation.type === 'attributes' && mutation.target.tagName) {
                        const tagName = mutation.target.tagName.toLowerCase();
                        if ((tagName === 'video' || tagName === 'audio') && mutation.attributeName === 'src') {
                            processMediaElement(mutation.target);
                        }
                    }
                });
            });

            // 配置观察者
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['src']
            });

            // 处理现有媒体元素
            document.querySelectorAll('video, audio').forEach(processMediaElement);

            // 拦截HTMLMediaElement的src和srcObject属性
            const originalSetSrc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src').set;
            Object.defineProperty(HTMLMediaElement.prototype, 'src', {
                set: function (value) {
                    if (value && value.includes('.m3u8')) {
                        logMediaRequest(value);
                    }
                    return originalSetSrc.call(this, value);
                }
            });

            if (DEBUG) {
                GM_log('[m3u8拦截器] 媒体请求拦截器已安装');
            }
        } catch (e) {
            GM_log('[m3u8拦截器] 安装媒体请求拦截器失败: ' + e.message);
        }
    }

    function fix_m3u8url(m3u8url) {
        let url = new URL(m3u8url);
        let seg = url.host.split('.');
        seg[0] = 'long';
        url.host = seg.join('.');
        GM_log('url fixed ====> ' + url.href);
        return url.href;
    }

    // 处理媒体元素
    function processMediaElement(element) {
        try {
            // 检查src属性
            if (element.src && element.src.includes('.m3u8')) {
                if (!element.src.startsWith('https://long')) element.src = fix_m3u8url(element.src);
                logMediaRequest(element.src, element.tagName.toLowerCase());
            }

            // 监听loadstart事件，捕获动态设置的媒体源
            element.addEventListener('loadstart', (e) => {
                const target = e.target;
                if (target.currentSrc && target.currentSrc.includes('.m3u8')) {
                    //if (!target.currentSrc.startsWith('https://long')) target.currentSrc = fix_m3u8url(target.currentSrc);
                    //logMediaRequest(target.currentSrc, target.tagName.toLowerCase()+'loadstart');
                }
            });
        } catch (e) {
            GM_log('[m3u8拦截器] 处理媒体元素失败: ' + e.message);
        }
    }

    // 记录媒体请求
    function logMediaRequest(url, mediaType = 'no-media-type') {
        try {
            const requestInfo = {
                url: url,
                method: 'GET',
                timestamp: Date.now(),
                type: mediaType.toUpperCase()
            };

            // 避免重复记录相同URL的请求
            const isDuplicate = interceptedRequests.some(req => req.url === url && req.type === mediaType.toUpperCase());
            if (!isDuplicate) {
                interceptedRequests.push(requestInfo);

                if (DEBUG) {
                    GM_log(`[m3u8拦截器] 拦截到${mediaType}媒体请求: ${url}`);
                }
            }
        } catch (e) {
            GM_log('[m3u8拦截器] 记录媒体请求失败: ' + e.message);
        }
    }

    // 初始化
    function init() {
        //interceptXHR();
        //interceptFetch();
        interceptMediaRequests();

        if (DEBUG) {
            GM_log('[m3u8拦截器] 脚本已初始化，支持拦截XHR、Fetch和Media类型的m3u8请求');
        }
    }

    // 启动脚本
    init();

    function remove_ad() {
        //微密圈去广告
        document.querySelector("welcome-ad")?.remove();//去除 开屏广告 5s倒计时
        document.querySelector("div.active-dialog")?.remove();//去除 4次 广告弹窗
        document.querySelector("div.van-overlay")?.remove();//去除 遮罩
        document.querySelector("div.shadow-lg")?.remove();//去除 汤头条app内打开
        document.querySelector("div.preview-tip")?.remove();
        //document.querySelector("div.notice-header-02")?.click();
        //let ad = document.querySelector("div.notice_scaleLayer");
        //if (ad) ad.style.display = 'none';//去除 应用中心 弹窗
        //短视频去广告
        document.querySelector("div.dx-mask")?.remove();//热点
        let previewTip = document.querySelector("div.preview-tip");
        if (previewTip) previewTip.innerText = previewTip.innerText.replace('开通VIP','已');
    }
    setInterval(remove_ad, 1000);

})();