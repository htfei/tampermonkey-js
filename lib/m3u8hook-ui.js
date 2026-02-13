// ==UserScript==
// @name         m3u8hook-ui
// @namespace    m3u8hook
// @version      1.22
// @description  m3u8请求拦截UI库，提供可视化界面显示拦截的请求和日志
// @author       Your Name
// @match        *://*/*
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 调试开关
    const DEBUG = true;

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
            panelTitle.innerHTML = `<strong>📺 m3u8请求拦截器</strong> <span style="font-size: 10px; color: #888;">v1.22</span>`;
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
                    // 获取拦截的请求
                    let interceptedRequests = [];
                    if (typeof window !== 'undefined' && window.m3u8Hooker && window.m3u8Hooker.requests) {
                        interceptedRequests = window.m3u8Hooker.requests();
                    }

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
                    // 获取日志
                    let logs = logMessages;
                    if (typeof window !== 'undefined' && window.m3u8Hooker && window.m3u8Hooker.logs) {
                        logs = window.m3u8Hooker.logs();
                    }

                    logContent.innerHTML = `
                        <div style="margin-bottom: 15px; color: #ccc;">
                            共记录 <strong style="color: #4CAF50;">${logs.length}</strong> 条日志
                        </div>
                        ${logs.slice(-50).map((entry, index) => {
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
                updateRequestPanel();
            });

            logTab.addEventListener('click', () => {
                requestContent.style.display = 'none';
                logContent.style.display = 'block';
                requestTab.style.background = 'transparent';
                requestTab.style.color = '#888';
                logTab.style.background = 'rgba(255, 255, 255, 0.1)';
                logTab.style.color = 'white';
                updateLogPanel();
                // 自动滚动到底部
                logContent.scrollTop = logContent.scrollHeight;
            });

            // 清空按钮点击事件
            clearBtn.addEventListener('click', () => {
                try {
                    if (requestContent.style.display === 'block') {
                        // 清空请求
                        if (typeof window !== 'undefined' && window.m3u8Hooker && window.m3u8Hooker.clearRequests) {
                            window.m3u8Hooker.clearRequests();
                        }
                        updateRequestPanel();
                    } else {
                        // 清空日志
                        logMessages = [];
                        if (typeof window !== 'undefined' && window.m3u8Hooker && window.m3u8Hooker.clearLogs) {
                            window.m3u8Hooker.clearLogs();
                        }
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

    // 初始化
    function init() {
        try {
            // 初始化浏览器信息
            initBrowserInfo();

            // 初始化界面
            initUI();

            if (DEBUG) {
                log('log', '[m3u8拦截器] UI初始化完成');
                log('log', '[m3u8拦截器] 浏览器信息:', browserInfo);
            }

            return {
                version: '1.22',
                initialized: true,
                browserInfo: browserInfo
            };
        } catch (e) {
            log('error', '[m3u8拦截器] UI初始化失败:', e);
            return {
                version: '1.22',
                initialized: false,
                error: e.message
            };
        }
    }

    // 暴露API
    if (typeof window !== 'undefined') {
        window.m3u8HookerUI = {
            init: init,
            logs: function() {
                return logMessages;
            },
            debug: DEBUG
        };
    }

})();
