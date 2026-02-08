// ==UserScript==
// @name        m3u8hooker
// @namespace    m3u8hooker
// @version      1.0.1
// @description  拦截并记录所有URL包含.m3u8格式后缀的请求
// @author       Your Name
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_log
// @connect      *
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 调试开关
    const DEBUG = true;

    // 存储拦截的请求
    let interceptedRequests = [];

    // 初始化界面
    function initUI() {
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
                padding: 15px;
                z-index: 99999;
                display: none;
                overflow-y: auto;
                box-shadow: 0 4px 30px rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(10px);
            `;

            // 切换面板显示/隐藏
            toggleBtn.onclick = () => {
                logPanel.style.display = logPanel.style.display === 'none' ? 'block' : 'none';
            };

            // 面板标题
            const panelTitle = document.createElement('div');
            panelTitle.innerHTML = '<strong>📺 m3u8请求拦截器</strong>';
            panelTitle.style.cssText = `
                font-size: 16px;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            `;
            logPanel.appendChild(panelTitle);

            // 清空日志按钮
            const clearBtn = document.createElement('button');
            clearBtn.innerHTML = '清空日志';
            clearBtn.style.cssText = `
                background: rgba(255, 87, 34, 0.7);
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                margin-bottom: 15px;
                font-size: 12px;
                transition: background 0.3s ease;
            `;

            clearBtn.addEventListener('mouseenter', () => {
                clearBtn.style.background = 'rgba(255, 87, 34, 0.9)';
            });

            clearBtn.addEventListener('mouseleave', () => {
                clearBtn.style.background = 'rgba(255, 87, 34, 0.7)';
            });

            clearBtn.onclick = () => {
                try {
                    interceptedRequests = [];
                    updateLogPanel();
                } catch (e) {
                    console.error('[m3u8拦截器] 清空日志失败:', e);
                }
            };

            logPanel.appendChild(clearBtn);

            // 更新日志面板
            function updateLogPanel() {
                try {
                    const logContent = document.createElement('div');
                    logContent.style.cssText = 'font-size: 13px;';
                    logContent.innerHTML = `
                        <div style="margin-bottom: 15px; color: #ccc;">
                            共拦截到 <strong style="color: #4CAF50;">${interceptedRequests.length}</strong> 个.m3u8请求
                        </div>
                        ${interceptedRequests.map((req, index) => `
                            <div style="padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 10px; border-radius: 4px; background: rgba(255, 255, 255, 0.05);">
                                <div style="font-size: 11px; color: #888; margin-bottom: 5px;">
                                    ${index + 1}. ${new Date(req.timestamp).toLocaleTimeString()}
                                    <span style="margin-left: 10px; color: #4CAF50;">${req.type} ${req.method}</span>
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

                    // 移除旧内容
                    const oldContent = logPanel.querySelector('div:not(button):not(.panel-title)');
                    if (oldContent) {
                        oldContent.remove();
                    }

                    logPanel.appendChild(logContent);

                    // 添加复制功能
                    document.querySelectorAll('.copy-btn').forEach(btn => {
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
                                    console.error('[m3u8拦截器] 复制失败:', err);
                                    alert('复制失败，请手动复制');
                                });
                            } catch (e) {
                                console.error('[m3u8拦截器] 复制按钮点击事件失败:', e);
                            }
                        };
                    });
                } catch (e) {
                    console.error('[m3u8拦截器] 更新日志面板失败:', e);
                }
            }

            // 监听请求更新
            window.addEventListener('m3u8RequestIntercepted', updateLogPanel);

            // 添加到页面
            document.body.appendChild(toggleBtn);
            document.body.appendChild(logPanel);
        } catch (e) {
            console.error('[m3u8拦截器] 初始化界面失败:', e);
        }
    }

    // 拦截XMLHttpRequest
    function interceptXHR() {
        try {
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
                try {
                    this._url = url;
                    this._method = method;
                } catch (e) {
                    console.error('[m3u8拦截器] XHR open方法拦截失败:', e);
                }
                return originalOpen.apply(this, arguments);
            };

            XMLHttpRequest.prototype.send = function(body) {
                try {
                    const self = this;

                    // 检查URL是否包含.m3u8后缀
                    if (self._url && (self._url.includes('.m3u8') || self._url.includes('/api'))) {
                        const requestInfo = {
                            url: self._url,
                            method: self._method || 'GET',
                            body: body,
                            timestamp: Date.now(),
                            type: 'XHR'
                        };

                        interceptedRequests.push(requestInfo);

                        if (DEBUG) {
                            console.log('[m3u8拦截器] 拦截到XHR请求:', requestInfo);
                        }

                        // 触发事件更新界面
                        window.dispatchEvent(new Event('m3u8RequestIntercepted'));
                    }
                } catch (e) {
                    console.error('[m3u8拦截器] XHR send方法拦截失败:', e);
                }

                return originalSend.apply(this, arguments);
            };

            if (DEBUG) {
                console.log('[m3u8拦截器] XHR拦截器已安装');
            }
        } catch (e) {
            console.error('[m3u8拦截器] 安装XHR拦截器失败:', e);
        }
    }

    // 拦截fetch请求
    function interceptFetch() {
        try {
            if (typeof window.fetch === 'function') {
                const originalFetch = window.fetch;

                window.fetch = function(url, options) {
                    try {
                        // 检查URL是否包含.m3u8后缀
                        const requestUrl = typeof url === 'string' ? url : (url?.url || '');
                        if (requestUrl && (requestUrl.includes('.m3u8')|| requestUrl.includes('/api'))) {
                            const requestInfo = {
                                url: requestUrl,
                                method: options?.method || 'GET',
                                body: options?.body,
                                timestamp: Date.now(),
                                type: 'Fetch'
                            };

                            interceptedRequests.push(requestInfo);

                            if (DEBUG) {
                                console.log('[m3u8拦截器] 拦截到Fetch请求:', requestInfo);
                            }

                            // 触发事件更新界面
                            window.dispatchEvent(new Event('m3u8RequestIntercepted'));
                        }
                    } catch (e) {
                        console.error('[m3u8拦截器] Fetch请求处理失败:', e);
                    }

                    return originalFetch.apply(this, arguments);
                };

                if (DEBUG) {
                    console.log('[m3u8拦截器] Fetch拦截器已安装');
                }
            }
        } catch (e) {
            console.error('[m3u8拦截器] 安装Fetch拦截器失败:', e);
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
                set: function(value) {
                    if (value && value.includes('.m3u8')) {
                        logMediaRequest(value);
                    }
                    return originalSetSrc.call(this, value);
                }
            });

            if (DEBUG) {
                console.log('[m3u8拦截器] 媒体请求拦截器已安装');
            }
        } catch (e) {
            console.error('[m3u8拦截器] 安装媒体请求拦截器失败:', e);
        }
    }

    // 处理媒体元素
    function processMediaElement(element) {
        try {
            // 检查src属性
            if (element.src && element.src.includes('.m3u8')) {
                logMediaRequest(element.src, element.tagName.toLowerCase());
            }

            // 监听loadstart事件，捕获动态设置的媒体源
            element.addEventListener('loadstart', (e) => {
                const target = e.target;
                if (target.currentSrc && target.currentSrc.includes('.m3u8')) {
                    logMediaRequest(target.currentSrc, target.tagName.toLowerCase());
                }
            });
        } catch (e) {
            console.error('[m3u8拦截器] 处理媒体元素失败:', e);
        }
    }

    // 记录媒体请求
    function logMediaRequest(url, mediaType = 'media') {
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
                    console.log('[m3u8拦截器] 拦截到媒体请求:', requestInfo);
                }

                // 触发事件更新界面
                window.dispatchEvent(new Event('m3u8RequestIntercepted'));
            }
        } catch (e) {
            console.error('[m3u8拦截器] 记录媒体请求失败:', e);
        }
    }

    // 初始化
    function init() {
        interceptXHR();
        interceptFetch();
        interceptMediaRequests();

        // 页面加载完成后初始化界面
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initUI);
        } else {
            initUI();
        }

        if (DEBUG) {
            console.log('[m3u8拦截器] 脚本已初始化，支持拦截XHR、Fetch和Media类型的m3u8请求');
        }
    }

    // 启动脚本
    init();

})();