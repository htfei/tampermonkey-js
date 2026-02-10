// ==UserScript==
// @name        m3u8hooker
// @namespace    m3u8hooker
// @version      1.22
// @description  拦截并记录所有URL包含.m3u8格式后缀的请求，实测兼容windows edge、ios via浏览器
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

    // 初始化界面
    function initUI() {
        try {
            // 确保DOM已准备就绪
            if (typeof document !== 'undefined') {
                if (document.readyState === 'loading') {
                    if (document.addEventListener) {
                        document.addEventListener('DOMContentLoaded', function() {
                            createUIElements();
                        });
                    } else if (document.attachEvent) {
                        // 旧IE兼容
                        document.attachEvent('onreadystatechange', function() {
                            if (document.readyState === 'complete') {
                                createUIElements();
                            }
                        });
                    }
                } else {
                    createUIElements();
                }
            }
        } catch (e) {
            log('error', '[m3u8拦截器] 初始化界面失败:', e);
        }
    }

    // 创建UI元素
    function createUIElements() {
        try {
            // 创建悬浮按钮
            const toggleBtn = document.createElement('button');
            toggleBtn.innerHTML = '📺';
            toggleBtn.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                border: none;
                cursor: pointer;
                z-index: 99999;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
            `;

            // 添加悬停效果
            toggleBtn.addEventListener('mouseenter', () => {
                toggleBtn.style.transform = 'scale(1.1)';
                toggleBtn.style.background = 'rgba(0, 0, 0, 0.9)';
            });

            toggleBtn.addEventListener('mouseleave', () => {
                toggleBtn.style.transform = 'scale(1)';
                toggleBtn.style.background = 'rgba(0, 0, 0, 0.8)';
            });

            // 创建日志面板
            const logPanel = document.createElement('div');
            logPanel.id = 'm3u8-interceptor-panel';
            logPanel.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                width: 400px;
                max-height: 600px;
                background: rgba(0, 0, 0, 0.95);
                color: white;
                border-radius: 8px;
                padding: 0;
                z-index: 99999;
                display: none;
                overflow: hidden;
                box-shadow: 0 4px 30px rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(10px);
            `;

            // 切换面板显示/隐藏
            toggleBtn.onclick = () => {
                logPanel.style.display = logPanel.style.display === 'none' ? 'block' : 'none';
            };

            // 面板标题
            const panelTitle = document.createElement('div');
            panelTitle.innerHTML = `<strong>📺 m3u8请求拦截器</strong> <span style="font-size: 10px; color: #888;">v1.0.2</span>`;
            panelTitle.style.cssText = `
                font-size: 16px;
                padding: 15px 15px 10px 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            `;
            logPanel.appendChild(panelTitle);

            // 浏览器信息
            const browserInfoDiv = document.createElement('div');
            browserInfoDiv.innerHTML = `
                <div style="font-size: 11px; color: #888; padding: 0 15px 10px 15px;">
                    浏览器: ${browserInfo.name} ${browserInfo.version} | 平台: ${browserInfo.platform}
                </div>
            `;
            logPanel.appendChild(browserInfoDiv);

            // 标签页
            const tabs = document.createElement('div');
            tabs.style.cssText = `
                display: flex;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding: 0 15px;
            `;

            const requestTab = document.createElement('button');
            requestTab.innerHTML = '请求';
            requestTab.style.cssText = `
                flex: 1;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: none;
                padding: 8px 12px;
                border-top-left-radius: 4px;
                border-top-right-radius: 0;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.3s ease;
            `;

            const logTab = document.createElement('button');
            logTab.innerHTML = '日志';
            logTab.style.cssText = `
                flex: 1;
                background: transparent;
                color: #888;
                border: none;
                padding: 8px 12px;
                border-top-left-radius: 0;
                border-top-right-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.3s ease;
            `;

            tabs.appendChild(requestTab);
            tabs.appendChild(logTab);
            logPanel.appendChild(tabs);

            // 内容区域
            const contentArea = document.createElement('div');
            contentArea.style.cssText = `
                height: 400px;
                overflow: hidden;
                position: relative;
            `;

            // 请求内容面板
            const requestContent = document.createElement('div');
            requestContent.style.cssText = `
                height: 100%;
                overflow-y: auto;
                padding: 15px;
            `;

            // 日志内容面板
            const logContent = document.createElement('div');
            logContent.style.cssText = `
                height: 100%;
                overflow-y: auto;
                padding: 15px;
                display: none;
            `;

            contentArea.appendChild(requestContent);
            contentArea.appendChild(logContent);
            logPanel.appendChild(contentArea);

            // 清空按钮
            const clearBtn = document.createElement('button');
            clearBtn.innerHTML = '清空';
            clearBtn.style.cssText = `
                background: rgba(255, 87, 34, 0.7);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.3s ease;
                margin: 10px 15px;
            `;

            clearBtn.addEventListener('mouseenter', () => {
                clearBtn.style.background = 'rgba(255, 87, 34, 0.9)';
            });

            clearBtn.addEventListener('mouseleave', () => {
                clearBtn.style.background = 'rgba(255, 87, 34, 0.7)';
            });

            logPanel.appendChild(clearBtn);

            // 更新请求面板
            function updateRequestPanel() {
                try {
                    requestContent.innerHTML = `
                        <div style="margin-bottom: 15px; color: #ccc;">
                            共拦截到 <strong style="color: #4CAF50;">${interceptedRequests.length}</strong> 个.m3u8请求
                        </div>
                        ${interceptedRequests.map((req, index) => `
                            <div style="padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 10px; border-radius: 4px; background: rgba(255, 255, 255, 0.05);">
                                <div style="font-size: 11px; color: #888; margin-bottom: 5px;">
                                    ${index + 1}. ${new Date(req.timestamp).toLocaleTimeString()}
                                    <span style="margin-left: 10px; color: #4CAF50;">${req.type} ${req.method}</span>
                                    ${req.error ? `<span style="margin-left: 10px; color: #f44336;">错误: ${req.error}</span>` : ''}
                                </div>
                                <div style="word-break: break-all; margin: 8px 0; line-height: 1.4; color: #e0e0e0;">
                                    ${req.url}
                                </div>
                                <button class="copy-btn" data-url="${req.url}" style="background: rgba(33, 150, 243, 0.7); color: white; border: none; padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 11px; transition: background 0.3s ease;">
                                    复制链接
                                </button>
                            </div>
                        `).join('')}
                    `;

                    // 添加复制功能
                    requestContent.querySelectorAll('.copy-btn').forEach(btn => {
                        btn.onclick = () => {
                            try {
                                const url = btn.getAttribute('data-url');
                                navigator.clipboard.writeText(url).then(() => {
                                    btn.innerHTML = '已复制！';
                                    btn.style.background = 'rgba(76, 175, 80, 0.7)';
                                    setTimeout(() => {
                                        btn.innerHTML = '复制链接';
                                        btn.style.background = 'rgba(33, 150, 243, 0.7)';
                                    }, 1500);
                                }).catch(err => {
                                    log('error', '[m3u8拦截器] 复制失败:', err);
                                    alert('复制失败，请手动复制');
                                });
                            } catch (e) {
                                log('error', '[m3u8拦截器] 复制按钮点击事件失败:', e);
                            }
                        };
                    });
                } catch (e) {
                    log('error', '[m3u8拦截器] 更新请求面板失败:', e);
                }
            }

            // 更新日志面板
            function updateLogPanel() {
                try {
                    logContent.innerHTML = `
                        <div style="margin-bottom: 15px; color: #ccc;">
                            共记录 <strong style="color: #4CAF50;">${logMessages.length}</strong> 条日志
                        </div>
                        ${logMessages.slice(-50).map((entry, index) => {
                            let color = '#888';
                            switch (entry.level) {
                                case 'error':
                                    color = '#f44336';
                                    break;
                                case 'warn':
                                    color = '#ff9800';
                                    break;
                                case 'log':
                                    color = '#4CAF50';
                                    break;
                            }
                            return `
                                <div style="padding: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 5px; border-radius: 3px; background: rgba(255, 255, 255, 0.03);">
                                    <div style="font-size: 11px; color: #888; margin-bottom: 3px;">
                                        ${entry.timeString}
                                        <span style="margin-left: 10px; color: ${color};">${entry.level.toUpperCase()}</span>
                                    </div>
                                    <div style="word-break: break-all; line-height: 1.4; color: #e0e0e0; font-size: 12px;">
                                        ${entry.message}
                                    </div>
                                    ${entry.data ? `
                                        <div style="word-break: break-all; line-height: 1.4; color: #aaa; font-size: 11px; margin-top: 3px;">
                                            ${typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data)}
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    `;

                    // 自动滚动到底部
                    logContent.scrollTop = logContent.scrollHeight;
                } catch (e) {
                    // 确保日志更新函数本身不会抛出错误
                    console.error('[m3u8拦截器] 更新日志面板失败:', e);
                }
            }

            // 切换标签页
            requestTab.addEventListener('click', () => {
                requestContent.style.display = 'block';
                logContent.style.display = 'none';
                requestTab.style.background = 'rgba(255, 255, 255, 0.1)';
                requestTab.style.color = 'white';
                logTab.style.background = 'transparent';
                logTab.style.color = '#888';
            });

            logTab.addEventListener('click', () => {
                requestContent.style.display = 'none';
                logContent.style.display = 'block';
                requestTab.style.background = 'transparent';
                requestTab.style.color = '#888';
                logTab.style.background = 'rgba(255, 255, 255, 0.1)';
                logTab.style.color = 'white';
                // 自动滚动到底部
                logContent.scrollTop = logContent.scrollHeight;
            });

            // 清空按钮点击事件
            clearBtn.addEventListener('click', () => {
                try {
                    if (requestContent.style.display === 'block') {
                        interceptedRequests = [];
                        updateRequestPanel();
                    } else {
                        logMessages = [];
                        updateLogPanel();
                    }
                } catch (e) {
                    log('error', '[m3u8拦截器] 清空失败:', e);
                }
            });

            // 监听请求更新
            window.addEventListener('m3u8RequestIntercepted', updateRequestPanel);
            // 监听日志更新
            window.addEventListener('m3u8LogUpdated', updateLogPanel);

            // 添加到页面
            if (document.body) {
                document.body.appendChild(toggleBtn);
                document.body.appendChild(logPanel);
            } else {
                log('error', '[m3u8拦截器] document.body 不存在，无法添加UI元素');
            }
        } catch (e) {
            log('error', '[m3u8拦截器] 创建UI元素失败:', e);
        }
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
                    if (self._url && (self._url.indexOf('.m3u8') !== -1 || self._url.indexOf('/api') !== -1)) {
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
                        if (requestUrl && (requestUrl.indexOf('.m3u8') !== -1 || requestUrl.indexOf('/api') !== -1)) {
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

            // 页面加载完成后初始化界面
            try {
                if (typeof document !== 'undefined') {
                    if (document.readyState === 'loading') {
                        if (document.addEventListener) {
                            document.addEventListener('DOMContentLoaded', initUI);
                        } else if (document.attachEvent) {
                            // 旧IE兼容
                            document.attachEvent('onreadystatechange', function() {
                                if (document.readyState === 'complete') {
                                    initUI();
                                }
                            });
                        }
                    } else {
                        initUI();
                    }
                }
            } catch (e) {
                log('error', '[m3u8拦截器] 初始化界面失败:', e);
            }

            // 显示初始化结果
            if (DEBUG) {
                log('log', '[m3u8拦截器] 脚本初始化完成:');
                log('log', '  - XHR拦截器:', xhrResult ? '✅ 已安装' : '❌ 安装失败');
                log('log', '  - Fetch拦截器:', fetchResult ? '✅ 已安装' : '❌ 安装失败');
                log('log', '  - 媒体请求拦截器:', mediaResult ? '✅ 已安装' : '❌ 安装失败');
                log('log', '  - 浏览器:', browserInfo.name + ' ' + browserInfo.version + ' (' + browserInfo.platform + ')');
                log('log', '  - 脚本版本:', '1.21');
                log('log', '  - 支持拦截XHR、Fetch和Media类型的m3u8请求');
            }

            // 添加全局诊断信息
            if (typeof window !== 'undefined') {
                window.m3u8HookerInfo = {
                    version: '1.21',
                    initialized: true,
                    browserInfo: browserInfo,
                    interceptors: {
                        xhr: xhrResult,
                        fetch: fetchResult,
                        media: mediaResult
                    },
                    requests: function() {
                        return interceptedRequests;
                    }
                };

                log('log', '[m3u8拦截器] 全局诊断对象已创建: window.m3u8HookerInfo');
            }
        } catch (e) {
            // 确保初始化函数本身不会抛出错误
            if (typeof console !== 'undefined' && typeof console.error === 'function') {
                try {
                    console.error('[m3u8拦截器] 初始化失败:', e);
                } catch (e2) {
                    // 忽略控制台错误
                }
            }
        }
    }

    // 启动脚本
    init();

})();