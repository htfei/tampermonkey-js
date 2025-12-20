// ==UserScript==
// @name         [tools]📺m3u8视频播放器(HLS)
// @namespace    https://github.com/yourusername/tampermonkey-scripts
// @version      1.1.0
// @description  拦截m3u8请求并以单个视频形式展示，使用HLS播放
// @author       Your Name
// @match        *://*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_log
// @connect      *
// @connect      cdnjs.cloudflare.com
// @connect      cdn.jsdelivr.net
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // 调试开关
    const DEBUG = true;

    // 存储拦截的请求
    let interceptedRequests = [];

    // 本地存储的收藏视频
    let favoriteVideos = [];
    const MAX_FAVORITES_DISPLAY = 10; // 每次显示的最大收藏视频数
    let currentFavoritesPage = 1; // 当前收藏视频页数

    // 初始化收藏视频
    function initFavorites() {
        try {
            const savedFavorites = GM_getValue('m3u8_favorite_videos', '[]');
            favoriteVideos = JSON.parse(savedFavorites);

            // 将收藏的视频添加到interceptedRequests数组中，确保刷新后仍然显示
            if (favoriteVideos.length > 0) {
                console.log('[m3u8视频播放器] 加载收藏视频:', favoriteVideos);
                interceptedRequests = favoriteVideos.concat(interceptedRequests);
                // 更新视频面板
                updateVideoPanel(true);
            }
        } catch (e) {
            console.error('[m3u8视频播放器] 加载收藏视频失败:', e);
            favoriteVideos = [];
        }
    }

    // 全局变量
    let videoPanel; // 视频面板元素
    let toggleBtn; // 悬浮切换按钮

    // 保存收藏视频到本地存储
    function saveFavorites() {
        try {
            GM_setValue('m3u8_favorite_videos', JSON.stringify(favoriteVideos));
        } catch (e) {
            console.error('[m3u8视频播放器] 保存收藏视频失败:', e);
        }
    }

    // 添加视频到收藏
    function addToFavorites(requestInfo) {
        // 检查是否已存在
        const exists = favoriteVideos.some(video => video.url === requestInfo.url);
        if (!exists) {
            // 添加到开头
            favoriteVideos.unshift(requestInfo);
            // 限制最大数量为100个
            if (favoriteVideos.length > 100) {
                favoriteVideos = favoriteVideos.slice(0, 100);
            }
            saveFavorites();
            return true;
        }
        return false;
    }

    // 从收藏中移除视频
    function removeFromFavorites(url) {
        const initialLength = favoriteVideos.length;
        favoriteVideos = favoriteVideos.filter(video => video.url !== url);
        if (favoriteVideos.length !== initialLength) {
            saveFavorites();
            return true;
        }
        return false;
    }

    // 检查视频是否已收藏
    function isFavorite(url) {
        return favoriteVideos.some(video => video.url === url);
    }

    // 简单的URL修复函数（如果需要）
    function fixUrl(url) {
        // 这里可以添加URL修复逻辑，如果不需要可以直接返回原URL
        return url;
    }

    // 动态加载HLS.js库
    function loadHLSJS() {
        return new Promise((resolve, reject) => {
            // 检查是否已经加载
            if (typeof window.Hls !== 'undefined') {
                resolve(window.Hls);
                return;
            }

            // 创建script标签
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.1.5/hls.min.js'; //'https://cdn.jsdelivr.net/npm/hls.js@latest';
            script.type = 'text/javascript';
            script.async = true;

            script.onload = () => {
                if (DEBUG) {
                    console.log('[m3u8视频播放器] HLS.js 加载成功');
                }
                resolve(window.Hls);
            };

            script.onerror = (error) => {
                console.error('[m3u8视频播放器] HLS.js 加载失败:', error);
                reject(error);
            };

            // 添加到页面
            document.head.appendChild(script);
        });
    }

    // 初始化界面
    function initUI() {
        try {
            // 创建悬浮按钮
            toggleBtn = document.createElement('button');
            toggleBtn.innerHTML = '📺'; // 默认图标
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

            // 保存按钮引用以便在其他函数中访问
            window.m3u8ToggleBtn = toggleBtn;

            // 添加悬停效果
            toggleBtn.addEventListener('mouseenter', () => {
                toggleBtn.style.transform = 'scale(1.1)';
                toggleBtn.style.background = 'rgba(0, 0, 0, 0.9)';
            });

            toggleBtn.addEventListener('mouseleave', () => {
                toggleBtn.style.transform = 'scale(1)';
                toggleBtn.style.background = 'rgba(0, 0, 0, 0.8)';
            });

            // 创建视频列表面板
            videoPanel = document.createElement('div');
            videoPanel.id = 'm3u8-video-player-panel';
            videoPanel.style.cssText = `
                position: fixed;
                top: 70px;
                right: 0;
                width: 100vw;
                max-height: calc(100vh - 100px);
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

            // 添加响应式样式
            const style = document.createElement('style');
            style.textContent = `
                @media (orientation: portrait) {
                    #m3u8-video-player-panel {
                        width: 100vw !important;
                        border-radius: 0 !important;
                    }
                }

                @media (orientation: landscape) {
                    #m3u8-video-player-panel {
                        width: 30vw !important;
                    }
                }
            `;
            document.head.appendChild(style);

            // 切换面板显示/隐藏
            toggleBtn.onclick = () => {
                videoPanel.style.display = videoPanel.style.display === 'none' ? 'block' : 'none';
            };

            // 面板标题
            const panelTitle = document.createElement('div');
            panelTitle.innerHTML = '<strong>📺 m3u8视频列表</strong>';
            panelTitle.style.cssText = `
                font-size: 16px;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            `;
            videoPanel.appendChild(panelTitle);

            // 清空列表按钮
            const clearBtn = document.createElement('button');
            clearBtn.innerHTML = '清空列表';
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
                    updateVideoPanel(true); // 重置页码

                    // 重置图标状态为未识别状态
                    if (window.m3u8ToggleBtn) {
                        window.m3u8ToggleBtn.innerHTML = '📺';
                    }
                } catch (e) {
                    console.error('[m3u8视频播放器] 清空列表失败:', e);
                    GM_log('[m3u8视频播放器] 清空列表失败: ' + e.message);
                }
            };

            videoPanel.appendChild(clearBtn);

            // 监听请求更新
            window.addEventListener('m3u8RequestIntercepted', updateVideoPanel);

            // 添加到页面
            document.body.appendChild(toggleBtn);
            document.body.appendChild(videoPanel);
        } catch (e) {
            console.error('[m3u8视频播放器] 初始化界面失败:', e);
            GM_log('[m3u8视频播放器] 初始化界面失败: ' + e.message);
        }
    }

    // 更新视频面板
    // 当前显示页码和每页显示数量
    let currentPage = 1;
    const itemsPerPage = 10;

    function updateVideoPanel(resetPage = false) {
        try {
            // 检查videoPanel是否已创建
            if (!videoPanel) {
                console.warn('[m3u8视频播放器] videoPanel尚未创建，跳过更新');
                return;
            }
            // 重置页码（如果需要）
            if (resetPage) {
                currentPage = 1;
            }

            const videoContent = document.createElement('div');
            videoContent.style.cssText = 'font-size: 13px;';

            // 按时间倒序排序，最新的在前面
            const sortedRequests = [...interceptedRequests].sort((a, b) => b.timestamp - a.timestamp);

            // 显示视频统计
            videoContent.innerHTML = `
                        <div style="margin-bottom: 15px; color: #ccc;">
                            共 <strong style="color: #4CAF50;">${interceptedRequests.length}</strong> 个视频
                        </div>
                    `;

            if (sortedRequests.length > 0) {
                // 自动弹出列表
                videoPanel.style.display = 'block';

                // 计算当前页显示的视频范围
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const currentPageRequests = sortedRequests.slice(startIndex, endIndex);

                // 创建视频列表
                currentPageRequests.forEach((request, index) => {
                    // 创建视频容器
                    const videoContainer = document.createElement('div');
                    videoContainer.style.cssText = 'padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 10px; border-radius: 4px; background: rgba(255, 255, 255, 0.05);';

                    // 视频信息
                    const videoInfo = document.createElement('div');
                    videoInfo.className = 'video-item-info';
                    videoInfo.style.cssText = 'font-size: 11px; color: #888; margin-bottom: 5px;';

                    let videoName = '';
                    let author = '';

                    // 实际视频序号
                    const actualIndex = startIndex + index;
                    videoInfo.innerHTML = `
                                视频 #${actualIndex + 1} - ${request.timestamp}-${request.type}-<span class="video-duration">未知时长</span>
                            `;

                    // 视频元素
                    const videoEl = document.createElement('video');
                    videoEl.className = 'm3u8-video-item';
                    videoEl.setAttribute('data-url', request.url);
                    videoEl.style.cssText = 'width: 100%; height: auto; border-radius: 4px; cursor: pointer;';
                    videoEl.controls = true;
                    videoEl.preload = 'metadata';

                    // 视频加载完成后获取时长
                    videoEl.addEventListener('loadedmetadata', function () {
                        const duration = this.duration;
                        if (!isNaN(duration)) {
                            const hours = Math.floor(duration / 3600);
                            const minutes = Math.floor((duration % 3600) / 60);
                            const seconds = Math.floor(duration % 60);
                            const timeString = hours > 0 ?
                                `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` :
                                `${minutes}:${seconds.toString().padStart(2, '0')}`;

                            // 更新时长显示
                            const durationEl = videoInfo.querySelector('.video-duration');
                            if (durationEl) {
                                durationEl.textContent = timeString;
                            }
                        }
                    });

                    // 复制按钮
                    const copyBtn = document.createElement('button');
                    copyBtn.className = 'copy-btn';
                    copyBtn.setAttribute('data-url', request.url);
                    copyBtn.style.cssText = 'background: rgba(33, 150, 243, 0.7); color: white; border: none; padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 11px; transition: background 0.3s ease; margin-right: 5px;';
                    copyBtn.innerHTML = '复制链接';

                    // 复制按钮事件
                    copyBtn.onclick = () => {
                        try {
                            const url = copyBtn.getAttribute('data-url');
                            navigator.clipboard.writeText(url).then(() => {
                                copyBtn.innerHTML = '已复制！';
                                copyBtn.style.background = 'rgba(76, 175, 80, 0.7)';
                                setTimeout(() => {
                                    copyBtn.innerHTML = '复制链接';
                                    copyBtn.style.background = 'rgba(33, 150, 243, 0.7)';
                                }, 1500);
                            }).catch(err => {
                                console.error('[m3u8视频播放器] 复制失败:', err);
                                alert('复制失败，请手动复制');
                            });
                        } catch (e) {
                            console.error('[m3u8视频播放器] 复制按钮点击事件失败:', e);
                        }
                    };

                    // 🌍按钮 - 在新标签页打开URL
                    const openBtn = document.createElement('button');
                    openBtn.className = 'open-btn';
                    openBtn.setAttribute('data-url', request.url);
                    openBtn.style.cssText = 'background: rgba(76, 175, 80, 0.7); color: white; border: none; padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 11px; transition: background 0.3s ease; margin-right: 5px;';
                    openBtn.innerHTML = '🌍 打开';

                    // 打开按钮事件
                    openBtn.onclick = () => {
                        try {
                            const url = openBtn.getAttribute('data-url');
                            window.open(url, '_blank');
                        } catch (e) {
                            console.error('[m3u8视频播放器] 打开按钮点击事件失败:', e);
                        }
                    };

                    // ⏬按钮 - 在新标签页打开fixurl
                    const downloadBtn = document.createElement('button');
                    downloadBtn.className = 'download-btn';
                    downloadBtn.setAttribute('data-url', request.url);
                    downloadBtn.style.cssText = 'background: rgba(255, 193, 7, 0.7); color: white; border: none; padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 11px; transition: background 0.3s ease; margin-right: 5px;';
                    downloadBtn.innerHTML = '⏬ 修复';

                    // 下载按钮事件
                    downloadBtn.onclick = () => {
                        try {
                            const url = downloadBtn.getAttribute('data-url');
                            const fixedUrl = fixUrl(url);
                            window.open(fixedUrl, '_blank');
                        } catch (e) {
                            console.error('[m3u8视频播放器] 修复按钮点击事件失败:', e);
                        }
                    };

                    // ♥️按钮 - 收藏视频
                    const favoriteBtn = document.createElement('button');
                    favoriteBtn.className = 'favorite-btn';
                    favoriteBtn.setAttribute('data-url', request.url);
                    favoriteBtn.style.cssText = 'background: rgba(244, 67, 54, 0.7); color: white; border: none; padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 11px; transition: background 0.3s ease;';
                    favoriteBtn.innerHTML = isFavorite(request.url) ? '♥️ 已收藏' : '♡ 收藏';

                    // 收藏按钮事件
                    favoriteBtn.onclick = () => {
                        try {
                            const url = favoriteBtn.getAttribute('data-url');
                            if (isFavorite(url)) {
                                // 移除收藏
                                removeFromFavorites(url);
                                favoriteBtn.innerHTML = '♡ 收藏';
                                favoriteBtn.style.background = 'rgba(244, 67, 54, 0.7)';
                            } else {
                                // 添加收藏
                                addToFavorites(request);
                                favoriteBtn.innerHTML = '♥️ 已收藏';
                                favoriteBtn.style.background = 'rgba(156, 39, 176, 0.7)';
                            }
                        } catch (e) {
                            console.error('[m3u8视频播放器] 收藏按钮点击事件失败:', e);
                        }
                    };

                    // 按钮容器
                    const buttonContainer = document.createElement('div');
                    buttonContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;';
                    buttonContainer.appendChild(copyBtn);
                    buttonContainer.appendChild(openBtn);
                    buttonContainer.appendChild(downloadBtn);
                    buttonContainer.appendChild(favoriteBtn);

                    // 组装视频容器
                    videoContainer.appendChild(videoInfo);
                    videoContainer.appendChild(videoEl);
                    videoContainer.appendChild(buttonContainer);

                    // 添加到内容区
                    videoContent.appendChild(videoContainer);

                    // 使用HLS播放m3u8
                    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                        const hls = new Hls();
                        hls.loadSource(request.url);
                        hls.attachMedia(videoEl);

                        hls.on(Hls.Events.MANIFEST_PARSED, () => {
                            console.log('[m3u8视频播放器] HLS 清单加载完成，准备播放');
                            // 只自动播放第一个视频
                            if (index === 0) {
                                videoEl.play().catch(err => {
                                    console.error('[m3u8视频播放器] 自动播放失败:', err);
                                });
                            }
                        });

                        /*hls.on(Hls.Events.ERROR, (event, data) => {
                            console.error('[m3u8视频播放器] HLS 播放错误:', data);
                        });*/

                        // 保存hls实例以便后续操作
                        videoEl._hls = hls;
                    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
                        // Safari 原生支持 HLS
                        videoEl.src = request.url;
                        console.log('[m3u8视频播放器] 使用原生 HLS 播放');
                        // 只自动播放第一个视频
                        if (index === 0) {
                            videoEl.play().catch(err => {
                                console.error('[m3u8视频播放器] 自动播放失败:', err);
                            });
                        }
                    } else {
                        // 不支持 HLS
                        const errorDiv = document.createElement('div');
                        errorDiv.style.cssText = 'color: #ff6b6b; margin-top: 8px; font-size: 12px;';
                        errorDiv.innerHTML = '您的浏览器不支持 HLS 播放，请安装 HLS.js 插件';
                        videoContainer.appendChild(errorDiv);
                    }
                });

                // 自动弹出列表
                videoPanel.style.display = 'block';

                // 更新图标状态
                if (toggleBtn) {
                    toggleBtn.innerHTML = '🎬';
                } else if (window.m3u8ToggleBtn) {
                    window.m3u8ToggleBtn.innerHTML = '🎬';
                }

                // 添加加载更多按钮（如果有更多视频）
                const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
                if (currentPage < totalPages) {
                    const loadMoreBtn = document.createElement('button');
                    loadMoreBtn.innerHTML = '加载更多';
                    loadMoreBtn.style.cssText = `
                            background: rgba(96, 125, 139, 0.7);
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 4px;
                            cursor: pointer;
                            margin-top: 15px;
                            width: 100%;
                            font-size: 13px;
                            transition: background 0.3s ease;
                        `;

                    loadMoreBtn.addEventListener('mouseenter', () => {
                        loadMoreBtn.style.background = 'rgba(96, 125, 139, 0.9)';
                    });

                    loadMoreBtn.addEventListener('mouseleave', () => {
                        loadMoreBtn.style.background = 'rgba(96, 125, 139, 0.7)';
                    });

                    loadMoreBtn.onclick = () => {
                        currentPage++;
                        updateVideoPanel(false);
                    };

                    videoContent.appendChild(loadMoreBtn);
                } else if (totalPages > 1) {
                    // 显示已加载全部
                    const allLoadedDiv = document.createElement('div');
                    allLoadedDiv.style.cssText = 'color: #888; font-size: 12px; text-align: center; margin-top: 15px; padding: 10px;';
                    allLoadedDiv.innerHTML = '已加载全部视频';
                    videoContent.appendChild(allLoadedDiv);
                }
            } else {
                // 无视频提示
                const emptyDiv = document.createElement('div');
                emptyDiv.style.cssText = 'color: #aaa; font-size: 12px; text-align: center; padding: 20px 0;';
                emptyDiv.innerHTML = '暂无拦截到的视频';
                videoContent.appendChild(emptyDiv);
            }

            // 移除旧内容
            const oldContent = videoPanel.querySelector('div:not(button):not(.panel-title)');
            if (oldContent) {
                oldContent.remove();
            }

            // 添加新内容
            videoPanel.appendChild(videoContent);

        } catch (e) {
            console.error('[m3u8视频播放器] 更新视频面板失败:', e);
            GM_log('[m3u8视频播放器] 更新视频面板失败: ' + e.message);
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
                console.log('[m3u8视频播放器] 媒体请求拦截器已安装');
            }
        } catch (e) {
            console.error('[m3u8视频播放器] 安装媒体请求拦截器失败:', e);
            GM_log('[m3u8视频播放器] 安装媒体请求拦截器失败: ' + e.message);
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
            console.error('[m3u8视频播放器] 处理媒体元素失败:', e);
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
            const isDuplicate = interceptedRequests.some(req => req.url === url);
            if (!isDuplicate) {
                interceptedRequests.push(requestInfo);

                if (DEBUG) {
                    console.log('[m3u8视频播放器] 拦截到媒体请求:', requestInfo);
                    GM_log(`[m3u8视频播放器] 拦截到媒体请求: ${url}`);
                }

                // 触发事件更新界面
                window.dispatchEvent(new Event('m3u8RequestIntercepted'));

                // 更新图标状态为识别状态
                if (window.m3u8ToggleBtn) {
                    window.m3u8ToggleBtn.innerHTML = '🎬';
                }
            }
        } catch (e) {
            console.error('[m3u8视频播放器] 记录媒体请求失败:', e);
            GM_log('[m3u8视频播放器] 记录媒体请求失败: ' + e.message);
        }
    }

    // 初始化
    function init() {
        // 加载HLS.js库
        loadHLSJS().catch(err => {
            console.error('[m3u8视频播放器] 无法加载HLS.js库:', err);
        });

        // 只保留媒体请求拦截器
        interceptMediaRequests();

        // 页面加载完成后初始化界面
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initUI();
                // 初始化收藏视频
                initFavorites();
            });
        } else {
            initUI();
            // 初始化收藏视频
            initFavorites();
        }

        if (DEBUG) {
            console.log('[m3u8视频播放器] 脚本已初始化，仅支持拦截Media类型的m3u8请求');
        }
    }

    // 启动脚本
    init();

})();