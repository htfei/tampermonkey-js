// ==UserScript==
// @name         m3u8hook-core
// @namespace    m3u8hook
// @version      1.22
// @description  m3u8请求劫持核心库，支持拦截XHR、Fetch和Media类型的m3u8请求
// @author       Your Name
// @match        *://*/*
// @connect      *
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 调试开关
    const DEBUG = true;

    // 存储拦截的请求
    let interceptedRequests = [];

    // 存储日志
    let logMessages = [];

    // 浏览器信息
    const browserInfo = {
        name: 'unknown',
        version: 'unknown',
        platform: 'unknown'
    };

    // 日志记录函数
    function log(level, message, data) {
        try {
            // 创建日志对象
            const logEntry = {
                level: level,
                message: message,
                data: data,
                timestamp: Date.now(),
                timeString: new Date().toLocaleTimeString()
            };

            // 存储日志
            logMessages.push(logEntry);

            // 限制日志数量，防止内存占用过多
            if (logMessages.length > 500) {
                logMessages = logMessages.slice(-500);
            }

            // 输出到控制台
            if (typeof console !== 'undefined') {
                switch (level) {
                    case 'log':
                        if (data) {
                            if (typeof console.log === 'function') {
                                try {
                                    console.log(message, data);
                                } catch (e) {
                                    // 忽略控制台错误
                                }
                            }
                        } else {
                            if (typeof console.log === 'function') {
                                try {
                                    console.log(message);
                                } catch (e) {
                                    // 忽略控制台错误
                                }
                            }
                        }
                        break;
                    case 'error':
                        if (data) {
                            if (typeof console.error === 'function') {
                                try {
                                    console.error(message, data);
                                } catch (e) {
                                    // 忽略控制台错误
                                }
                            }
                        } else {
                            if (typeof console.error === 'function') {
                                try {
                                    console.error(message);
                                } catch (e) {
                                    // 忽略控制台错误
                                }
                            }
                        }
                        break;
                    case 'warn':
                        if (data) {
                            if (typeof console.warn === 'function') {
                                try {
                                    console.warn(message, data);
                                } catch (e) {
                                    // 忽略控制台错误
                                }
                            }
                        } else {
                            if (typeof console.warn === 'function') {
                                try {
                                    console.warn(message);
                                } catch (e) {
                                    // 忽略控制台错误
                                }
                            }
                        }
                        break;
                    default:
                        if (data) {
                            if (typeof console.log === 'function') {
                                try {
                                    console.log(message, data);
                                } catch (e) {
                                    // 忽略控制台错误
                                }
                            }
                        } else {
                            if (typeof console.log === 'function') {
                                try {
                                    console.log(message);
                                } catch (e) {
                                    // 忽略控制台错误
                                }
                            }
                        }
                }
            }

            // 触发事件更新界面
            try {
                if (typeof window !== 'undefined' && window.dispatchEvent) {
                    // 尝试创建事件，兼容不同浏览器
                    let event;
                    try {
                        event = new Event('m3u8LogUpdated');
                    } catch (e) {
                        // 旧浏览器兼容
                        if (typeof document !== 'undefined' && document.createEvent) {
                            event = document.createEvent('Event');
                            event.initEvent('m3u8LogUpdated', true, true);
                        }
                    }
                    if (event) {
                        window.dispatchEvent(event);
                    }
                }
            } catch (eventError) {
                // 忽略事件触发错误
            }
        } catch (e) {
            // 确保日志函数本身不会抛出错误
            if (typeof console !== 'undefined' && typeof console.error === 'function') {
                try {
                    console.error('[m3u8拦截器] 日志记录失败:', e);
                } catch (e2) {
                    // 忽略控制台错误
                }
            }
        }
    }

    // 初始化浏览器信息
    function initBrowserInfo() {
        try {
            if (typeof navigator === 'undefined' || typeof navigator.userAgent !== 'string') {
                log('error', '[m3u8拦截器] navigator.userAgent 未定义');
                return;
            }

            const userAgent = navigator.userAgent;

            if (userAgent.indexOf('Edge') !== -1) {
                browserInfo.name = 'Edge';
                const edgeMatch = userAgent.match(/Edge\/(\d+\.\d+)/);
                browserInfo.version = edgeMatch && edgeMatch[1] ? edgeMatch[1] : 'unknown';
            } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
                browserInfo.name = 'Safari';
                const safariMatch = userAgent.match(/Version\/(\d+\.\d+)/);
                browserInfo.version = safariMatch && safariMatch[1] ? safariMatch[1] : 'unknown';
            } else if (userAgent.indexOf('Chrome') !== -1) {
                browserInfo.name = 'Chrome';
                const chromeMatch = userAgent.match(/Chrome\/(\d+\.\d+)/);
                browserInfo.version = chromeMatch && chromeMatch[1] ? chromeMatch[1] : 'unknown';
            } else if (userAgent.indexOf('Firefox') !== -1) {
                browserInfo.name = 'Firefox';
                const firefoxMatch = userAgent.match(/Firefox\/(\d+\.\d+)/);
                browserInfo.version = firefoxMatch && firefoxMatch[1] ? firefoxMatch[1] : 'unknown';
            }

            if (userAgent.indexOf('Windows') !== -1) {
                browserInfo.platform = 'Windows';
            } else if (userAgent.indexOf('Macintosh') !== -1) {
                browserInfo.platform = 'Mac';
            } else if (userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1) {
                browserInfo.platform = 'iOS';
            } else if (userAgent.indexOf('Android') !== -1) {
                browserInfo.platform = 'Android';
            }

            log('log', '[m3u8拦截器] 浏览器信息:', browserInfo);
        } catch (e) {
            log('error', '[m3u8拦截器] 初始化浏览器信息失败:', e);
        }
    }

    // 获取对象类型
    function getType(obj) {
        return Object.prototype.toString.call(obj);
    }

    // 解析Headers
    function parseHeaders(obj) {
        const headers = {};
        if (typeof obj === 'string') {
            const lines = obj.trim().split(/[\r\n]+/);
            for (var i = 0; i < lines.length; i++) {
                const line = lines[i];
                const colonIndex = line.indexOf(':');
                if (colonIndex === -1) continue;
                const header = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                if (!value) continue;
                const lheader = header.toLowerCase();
                headers[lheader] = lheader in headers ? headers[lheader] + ', ' + value : value;
            }
        } else if (obj && typeof obj === 'object') {
            if (getType(obj) === '[object Headers]') {
                try {
                    // 尝试使用for...of循环
                    for (const [key, val] of obj) {
                        headers[key] = val;
                    }
                } catch (e) {
                    // 降级方案
                    if (obj.forEach) {
                        obj.forEach(function(val, key) {
                            headers[key] = val;
                        });
                    }
                }
            } else {
                // 使用更兼容的方式复制属性
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        headers[key] = obj[key];
                    }
                }
            }
        }
        return headers;
    }

    // 拦截XMLHttpRequest
    function interceptXHR() {
        try {
            if (typeof XMLHttpRequest === 'undefined') {
                log('error', '[m3u8拦截器] XMLHttpRequest 未定义');
                return false;
            }

            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;

            if (!originalOpen || !originalSend) {
                log('error', '[m3u8拦截器] XMLHttpRequest 方法获取失败');
                return false;
            }

            // 保存原始方法
            if (typeof window !== 'undefined') {
                window._originalXHROpen = originalOpen;
                window._originalXHRSend = originalSend;
            }

            // 重写open方法
            XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
                try {
                    this._url = url;
                    this._method = method;
                } catch (e) {
                    log('error', '[m3u8拦截器] XHR open方法拦截失败:', e);
                }
                try {
                    return originalOpen.apply(this, arguments);
                } catch (e) {
                    log('error', '[m3u8拦截器] 调用原始XHR open方法失败:', e);
                    throw e;
                }
            };

            // 重写send方法
            XMLHttpRequest.prototype.send = function(body) {
                try {
                    const self = this;

                    // 检查URL是否包含.m3u8后缀
                    if (self._url && (self._url.indexOf('.m3u8') !== -1)) {
                        const requestInfo = {
                            url: self._url,
                            method: self._method || 'GET',
                            body: body,
                            timestamp: Date.now(),
                            type: 'XHR'
                        };

                        interceptedRequests.push(requestInfo);

                        if (DEBUG) {
                            log('log', '[m3u8拦截器] 拦截到XHR请求:', requestInfo);
                        }

                        // 触发事件更新界面
                        try {
                            if (typeof window !== 'undefined' && window.dispatchEvent) {
                                // 尝试创建事件，兼容不同浏览器
                                let event;
                                try {
                                    event = new Event('m3u8RequestIntercepted');
                                } catch (e) {
                                    // 旧浏览器兼容
                                    if (typeof document !== 'undefined' && document.createEvent) {
                                        event = document.createEvent('Event');
                                        event.initEvent('m3u8RequestIntercepted', true, true);
                                    }
                                }
                                if (event) {
                                    window.dispatchEvent(event);
                                }
                            }
                        } catch (eventError) {
                            log('error', '[m3u8拦截器] 触发事件失败:', eventError);
                        }
                    }
                } catch (e) {
                    log('error', '[m3u8拦截器] XHR send方法拦截失败:', e);
                }

                try {
                    return originalSend.apply(this, arguments);
                } catch (e) {
                    log('error', '[m3u8拦截器] 调用原始XHR send方法失败:', e);
                    throw e;
                }
            };

            if (DEBUG) {
                log('log', '[m3u8拦截器] XHR拦截器已安装');
            }
            return true;
        } catch (e) {
            log('error', '[m3u8拦截器] 安装XHR拦截器失败:', e);
            return false;
        }
    }

    // 拦截fetch请求
    function interceptFetch() {
        try {
            // 获取全局对象，使用更兼容的方式
            const win = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {};

            if (typeof win.fetch !== 'function') {
                log('warn', '[m3u8拦截器] Fetch API 未支持');
                return false;
            }

            // 保存原始方法
            const originalFetch = win.fetch;
            if (!originalFetch) {
                log('error', '[m3u8拦截器] Fetch 方法获取失败');
                return false;
            }
            win._originalFetch = originalFetch;

            // Fetch额外属性，参考ajaxHooker
            const fetchExtraProps = ['cache', 'credentials', 'integrity', 'keepalive', 'mode', 'priority', 'redirect', 'referrer', 'referrerPolicy', 'signal'];

            // 重写fetch方法，使用更兼容的实现
            function fakeFetch(url, options) {
                // 处理默认参数
                options = options || {};

                if (!url) {
                    try {
                        return originalFetch.call(win, url, options);
                    } catch (e) {
                        log('error', '[m3u8拦截器] 调用原始fetch失败:', e);
                        throw e;
                    }
                }

                // 使用Promise而不是async/await，提高兼容性
                return new Promise(function(resolve, reject) {
                    try {
                        const init = {};
                        let requestUrl = '';

                        // 处理Request对象
                        if (url && typeof url === 'object' && getType(url) === '[object Request]') {
                            init.method = url.method;
                            init.headers = url.headers;
                            // 不尝试获取body，避免兼容性问题
                            // 复制其他属性
                            for (let i = 0; i < fetchExtraProps.length; i++) {
                                const prop = fetchExtraProps[i];
                                if (prop in url) {
                                    init[prop] = url[prop];
                                }
                            }
                            requestUrl = url.url;
                        } else {
                            // 处理字符串URL
                            requestUrl = typeof url === 'string' ? url : '';
                            // 使用更兼容的方式复制属性
                            for (const key in options) {
                                if (options.hasOwnProperty(key)) {
                                    init[key] = options[key];
                                }
                            }
                        }

                        // 确保url是字符串
                        requestUrl = String(requestUrl);

                        init.method = init.method || 'GET';
                        init.headers = init.headers || {};

                        // 检查URL是否包含.m3u8后缀
                        if (requestUrl && (requestUrl.indexOf('.m3u8') !== -1)) {
                            const requestInfo = {
                                url: requestUrl,
                                method: String(init.method).toUpperCase(),
                                headers: parseHeaders(init.headers),
                                body: init.body,
                                timestamp: Date.now(),
                                type: 'Fetch'
                            };

                            interceptedRequests.push(requestInfo);

                            if (DEBUG) {
                                log('log', '[m3u8拦截器] 拦截到Fetch请求:', requestInfo);
                            }

                            // 触发事件更新界面
                            try {
                                if (typeof win !== 'undefined' && win.dispatchEvent) {
                                    // 尝试创建事件，兼容不同浏览器
                                    let event;
                                    try {
                                        event = new Event('m3u8RequestIntercepted');
                                    } catch (e) {
                                        // 旧浏览器兼容
                                        if (typeof document !== 'undefined' && document.createEvent) {
                                            event = document.createEvent('Event');
                                            event.initEvent('m3u8RequestIntercepted', true, true);
                                        }
                                    }
                                    if (event) {
                                        win.dispatchEvent(event);
                                    }
                                }
                            } catch (eventError) {
                                log('error', '[m3u8拦截器] 触发事件失败:', eventError);
                            }
                        }

                        // 执行原始fetch请求
                        try {
                            originalFetch.call(win, url, options).then(function(res) {
                                // 不修改Response对象，避免兼容性问题
                                resolve(res);
                            }, function(err) {
                                reject(err);
                            });
                        } catch (e) {
                            log('error', '[m3u8拦截器] 执行原始fetch请求失败:', e);
                            reject(e);
                        }
                    } catch (e) {
                        log('error', '[m3u8拦截器] Fetch请求处理失败:', e);
                        // 确保即使出错也能执行原始请求
                        try {
                            originalFetch.call(win, url, options).then(resolve, reject);
                        } catch (e2) {
                            log('error', '[m3u8拦截器] 执行原始fetch请求失败:', e2);
                            reject(e2);
                        }
                    }
                });
            }

            // 确保fakeFetch的原型和静态属性与原始fetch一致
            if (originalFetch.prototype) {
                try {
                    fakeFetch.prototype = originalFetch.prototype;
                } catch (e) {
                    log('error', '[m3u8拦截器] 设置fetch原型失败:', e);
                }
            }

            // 复制静态属性
            try {
                if (typeof Object.keys === 'function') {
                    const keys = Object.keys(originalFetch);
                    for (let i = 0; i < keys.length; i++) {
                        const key = keys[i];
                        if (!(key in fakeFetch)) {
                            fakeFetch[key] = originalFetch[key];
                        }
                    }
                }
            } catch (e) {
                log('error', '[m3u8拦截器] 复制fetch静态属性失败:', e);
            }

            // 赋值给全局fetch
            try {
                win.fetch = fakeFetch;
            } catch (e) {
                log('error', '[m3u8拦截器] 重写fetch失败:', e);
                return false;
            }

            // 不重写Response.prototype.clone，避免兼容性问题

            if (DEBUG) {
                log('log', '[m3u8拦截器] Fetch拦截器已安装');
            }
            return true;
        } catch (e) {
            log('error', '[m3u8拦截器] 安装Fetch拦截器失败:', e);
            return false;
        }
    }

    // 处理媒体元素
    function processMediaElement(element) {
        try {
            // 检查src属性
            if (element.src && element.src.indexOf('.m3u8') !== -1) {
                logMediaRequest(element.src, element.tagName.toLowerCase());
            }

            // 监听loadstart事件，捕获动态设置的媒体源
            element.addEventListener('loadstart', function(e) {
                try {
                    const target = e.target;
                    if (target.currentSrc && target.currentSrc.indexOf('.m3u8') !== -1) {
                        logMediaRequest(target.currentSrc, target.tagName.toLowerCase());
                    }
                } catch (e) {
                    log('error', '[m3u8拦截器] loadstart事件处理失败:', e);
                }
            });

            // 监听loadedmetadata事件，作为备用方案
            element.addEventListener('loadedmetadata', function(e) {
                try {
                    const target = e.target;
                    if (target.currentSrc && target.currentSrc.indexOf('.m3u8') !== -1) {
                        logMediaRequest(target.currentSrc, target.tagName.toLowerCase());
                    }
                } catch (e) {
                    log('error', '[m3u8拦截器] loadedmetadata事件处理失败:', e);
                }
            });

            // 监听playing事件，作为备用方案
            element.addEventListener('playing', function(e) {
                try {
                    const target = e.target;
                    if (target.currentSrc && target.currentSrc.indexOf('.m3u8') !== -1) {
                        logMediaRequest(target.currentSrc, target.tagName.toLowerCase());
                    }
                } catch (e) {
                    log('error', '[m3u8拦截器] playing事件处理失败:', e);
                }
            });
        } catch (e) {
            log('error', '[m3u8拦截器] 处理媒体元素失败:', e);
        }
    }

    // 记录媒体请求
    function logMediaRequest(url, mediaType = 'media') {
        try {
            // 获取全局对象，使用更兼容的方式
            const win = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {};

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
                    log('log', '[m3u8拦截器] 拦截到媒体请求:', requestInfo);
                }

                // 触发事件更新界面
                try {
                    if (typeof win !== 'undefined' && win.dispatchEvent) {
                        // 尝试创建事件，兼容不同浏览器
                        let event;
                        try {
                            event = new Event('m3u8RequestIntercepted');
                        } catch (e) {
                            // 旧浏览器兼容
                            if (typeof document !== 'undefined' && document.createEvent) {
                                event = document.createEvent('Event');
                                event.initEvent('m3u8RequestIntercepted', true, true);
                            }
                        }
                        if (event) {
                            win.dispatchEvent(event);
                        }
                    }
                } catch (eventError) {
                    log('error', '[m3u8拦截器] 触发事件失败:', eventError);
                }
            }
        } catch (e) {
            log('error', '[m3u8拦截器] 记录媒体请求失败:', e);
        }
    }

    // 拦截媒体资源请求（media类型）
    function interceptMediaRequests() {
        try {
            // 尝试使用MutationObserver监控DOM变化
            try {
                if (typeof MutationObserver === 'function') {
                    const observer = new MutationObserver((mutations) => {
                        try {
                            mutations.forEach((mutation) => {
                                try {
                                    // 处理新添加的节点
                                    mutation.addedNodes.forEach((node) => {
                                        try {
                                            if (node.nodeType === 1) { // 元素节点
                                                // 检查是否是媒体元素
                                                if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
                                                    processMediaElement(node);
                                                }
                                                // 检查子元素中的媒体元素
                                                try {
                                                    node.querySelectorAll('video, audio').forEach(processMediaElement);
                                                } catch (e) {
                                                    log('error', '[m3u8拦截器] 查询子媒体元素失败:', e);
                                                }
                                            }
                                        } catch (e) {
                                            log('error', '[m3u8拦截器] 处理添加节点失败:', e);
                                        }
                                    });

                                    // 处理属性变化
                                    if (mutation.type === 'attributes' && mutation.target.tagName) {
                                        try {
                                            const tagName = mutation.target.tagName.toLowerCase();
                                            if ((tagName === 'video' || tagName === 'audio') && mutation.attributeName === 'src') {
                                                processMediaElement(mutation.target);
                                            }
                                        } catch (e) {
                                            log('error', '[m3u8拦截器] 处理属性变化失败:', e);
                                        }
                                    }
                                } catch (e) {
                                    log('error', '[m3u8拦截器] 处理mutation失败:', e);
                                }
                            });
                        } catch (e) {
                            log('error', '[m3u8拦截器] MutationObserver回调失败:', e);
                        }
                    });

                    // 配置观察者
                    observer.observe(document.documentElement, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: ['src']
                    });

                    log('log', '[m3u8拦截器] MutationObserver已安装');
                } else {
                    log('warn', '[m3u8拦截器] MutationObserver 未支持');
                }
            } catch (e) {
                log('error', '[m3u8拦截器] 安装MutationObserver失败:', e);
            }

            // 处理现有媒体元素
            try {
                document.querySelectorAll('video, audio').forEach(processMediaElement);
            } catch (e) {
                log('error', '[m3u8拦截器] 处理现有媒体元素失败:', e);
            }

            // 尝试拦截HTMLMediaElement的src属性
            try {
                if (typeof HTMLMediaElement !== 'undefined' && HTMLMediaElement.prototype) {
                    const srcDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
                    if (srcDescriptor && srcDescriptor.set) {
                        const originalSetSrc = srcDescriptor.set;
                        // 保存原始方法
                        window._originalSetSrc = originalSetSrc;

                        Object.defineProperty(HTMLMediaElement.prototype, 'src', {
                            set: function(value) {
                                try {
                                    if (value && value.includes('.m3u8')) {
                                        logMediaRequest(value, 'media');
                                    }
                                } catch (e) {
                                    log('error', '[m3u8拦截器] 拦截src属性设置失败:', e);
                                }
                                return originalSetSrc.call(this, value);
                            }
                        });
                        log('log', '[m3u8拦截器] HTMLMediaElement.src属性拦截已安装');
                    } else {
                        log('warn', '[m3u8拦截器] 无法获取HTMLMediaElement.src属性描述符');
                    }
                } else {
                    log('warn', '[m3u8拦截器] HTMLMediaElement 未支持');
                }
            } catch (e) {
                log('error', '[m3u8拦截器] 安装HTMLMediaElement拦截器失败:', e);
            }

            // 添加全局媒体元素事件监听（作为备用方案）
            try {
                document.addEventListener('DOMNodeInserted', (e) => {
                    try {
                        const node = e.target;
                        if (node.nodeType === 1) {
                            if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
                                processMediaElement(node);
                            }
                        }
                    } catch (e) {
                        log('error', '[m3u8拦截器] DOMNodeInserted事件处理失败:', e);
                    }
                });
            } catch (e) {
                log('error', '[m3u8拦截器] 安装DOMNodeInserted事件监听失败:', e);
            }

            if (DEBUG) {
                log('log', '[m3u8拦截器] 媒体请求拦截器已安装');
            }
            return true;
        } catch (e) {
            log('error', '[m3u8拦截器] 安装媒体请求拦截器失败:', e);
            return false;
        }
    }

    // 初始化
    function init() {
        try {
            // 初始化浏览器信息
            initBrowserInfo();

            // 安装各个拦截器
            var xhrResult = false;
            var fetchResult = false;
            var mediaResult = false;

            // 逐个安装拦截器，确保一个失败不会影响其他
            try {
                xhrResult = interceptXHR();
            } catch (e) {
                log('error', '[m3u8拦截器] 安装XHR拦截器失败:', e);
            }

            try {
                fetchResult = interceptFetch();
            } catch (e) {
                log('error', '[m3u8拦截器] 安装Fetch拦截器失败:', e);
            }

            try {
                mediaResult = interceptMediaRequests();
            } catch (e) {
                log('error', '[m3u8拦截器] 安装媒体请求拦截器失败:', e);
            }

            // 显示初始化结果
            if (DEBUG) {
                log('log', '[m3u8拦截器] 脚本初始化完成:');
                log('log', '  - XHR拦截器:', xhrResult ? '✅ 已安装' : '❌ 安装失败');
                log('log', '  - Fetch拦截器:', fetchResult ? '✅ 已安装' : '❌ 安装失败');
                log('log', '  - 媒体请求拦截器:', mediaResult ? '✅ 已安装' : '❌ 安装失败');
                log('log', '  - 浏览器:', browserInfo.name + ' ' + browserInfo.version + ' (' + browserInfo.platform + ')');
                log('log', '  - 脚本版本:', '1.22');
                log('log', '  - 支持拦截XHR、Fetch和Media类型的m3u8请求');
            }

            // 添加全局诊断信息
            if (typeof window !== 'undefined') {
                window.m3u8HookerInfo = {
                    version: '1.22',
                    initialized: true,
                    browserInfo: browserInfo,
                    interceptors: {
                        xhr: xhrResult,
                        fetch: fetchResult,
                        media: mediaResult
                    },
                    requests: function() {
                        return interceptedRequests;
                    },
                    logs: function() {
                        return logMessages;
                    }
                };
            }

            return {
                version: '1.22',
                initialized: true,
                browserInfo: browserInfo,
                interceptors: {
                    xhr: xhrResult,
                    fetch: fetchResult,
                    media: mediaResult
                },
                requests: function() {
                    return interceptedRequests;
                },
                logs: function() {
                    return logMessages;
                }
            };
        } catch (e) {
            log('error', '[m3u8拦截器] 初始化失败:', e);
            return {
                version: '1.22',
                initialized: false,
                error: e.message,
                requests: function() {
                    return interceptedRequests;
                },
                logs: function() {
                    return logMessages;
                }
            };
        }
    }

    // 暴露API
    if (typeof window !== 'undefined') {
        window.m3u8Hooker = {
            init: init,
            requests: function() {
                return interceptedRequests;
            },
            logs: function() {
                return logMessages;
            },
            debug: DEBUG
        };
    }

})();
