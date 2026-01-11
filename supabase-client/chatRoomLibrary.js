/**
 * 聊天室UI库
 * 功能：
 * 1. 样式管理
 * 2. HLS视频播放支持
 * 3. 聊天室UI渲染
 * 4. 消息卡片渲染
 * 
 * 依赖：
 * - HLS.js（可选，用于支持HLS视频播放）
 * 
 * 使用方法：
 * 1. 在油猴脚本中引入该库
 * 2. 使用 ChatRoomLibrary.initUI() 初始化聊天室UI
 * 3. 使用 ChatRoomLibrary.addMsgCard() 添加消息卡片
 */

const ChatRoomLibrary = (function () {
    'use strict';

    // 库版本
    const VERSION = '1.0';

    // 默认UI配置
    const DEFAULT_UI_CONFIG = {
        width: '360px',
        height: '80vh',
        position: { right: '5px', bottom: '90px' },
        bubblePosition: { right: '5px', bottom: '20px' },
        theme: {
            primary: '#8b5cf6',
            primaryLight: '#a78bfa',
            background: '#0a0a0a',
            surface: '#1a1a1a',
            surfaceLight: '#2a2a2a',
            text: '#e0e0e0',
            textSecondary: '#999999',
            border: '#333333',
            shadow: 'rgba(0, 0, 0, 0.8)'
        }
    };

    // 内部状态管理
    let chatRoomInstance = null;

    /**
     * 注入样式
     * @param {Object} uiConfig - UI 配置
     */
    function injectStyles(uiConfig) {
        const cssVariables = `
            :root {
                --chat-bg: ${uiConfig.theme.background};
                --chat-surface: ${uiConfig.theme.surface};
                --chat-surface-light: ${uiConfig.theme.surfaceLight};
                --chat-text: ${uiConfig.theme.text};
                --chat-text-secondary: ${uiConfig.theme.textSecondary};
                --primary-color: ${uiConfig.theme.primary};
                --primary-light: ${uiConfig.theme.primaryLight};
                --border-color: ${uiConfig.theme.border};
                --shadow-color: ${uiConfig.theme.shadow};
            }
        `;

        const scrollbarCSS = `
            #chat-messages::-webkit-scrollbar {
                width: 6px;
                background: transparent;
            }
            #chat-messages::-webkit-scrollbar-track {
                background: var(--chat-surface);
                border-radius: 3px;
            }
            #chat-messages::-webkit-scrollbar-thumb {
                background: var(--chat-surface-light);
                border-radius: 3px;
                transition: background 0.2s ease;
            }
            #chat-messages::-webkit-scrollbar-thumb:hover {
                background: #475569;
            }
            #chat-messages {
                scrollbar-width: thin;
                scrollbar-color: var(--chat-surface-light) var(--chat-surface);
            }
        `;

        const animationsCSS = `
            @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        `;

        const globalStylesCSS = `
            #chat-container { animation: slideIn 0.4s ease-out; background: var(--chat-bg); border: 1px solid var(--border-color); border-radius: 20px; overflow: hidden; }
            #chat-messages { background: var(--chat-surface); }
            #input-container { padding: 12px; border-top: 1px solid var(--border-color); box-sizing: border-box; background: var(--chat-surface); position: relative; border-bottom-left-radius: 20px; border-bottom-right-radius: 20px; }
            .online-dot { width: 8px; height: 8px; border-radius: 50%; background-color: #10b981; margin-right: 6px; display: inline-block; animation: pulse 2s infinite; }
            #chat-header { padding: 20px 24px; border-bottom: 1px solid var(--border-color); background: linear-gradient(135deg, var(--chat-bg), var(--chat-surface)); border-top-left-radius: 20px; border-top-right-radius: 20px; display: flex; align-items: center; justify-content: center; position: relative; height: auto; }
            .online-count { font-size: 16px; font-weight: 600; color: white; }
            #online-users { color: white; font-weight: 600; }
            #chat-bubble { position: fixed; width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, var(--chat-surface), var(--border-color)); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255,255,255,0.05) inset; z-index: 9999; cursor: pointer; display: none; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);; user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; -webkit-user-drag: none; user-drag: none; }
            #chat-bubble.show { display: flex; animation: slideIn 0.4s ease-out; }
            #chat-bubble:hover { transform: scale(1.1) rotate(5deg); box-shadow: 0 15px 40px rgba(0, 0, 0, 0.7); }
            #chat-bubble:active { transform: scale(0.95); }
            #chat-bubble-icon { color: var(--chat-text); font-size: 28px; font-weight: bold; user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; -webkit-user-drag: none; user-drag: none; }
        `;

        const style = document.createElement('style');
        style.textContent = `${cssVariables} ${scrollbarCSS} ${animationsCSS} ${globalStylesCSS}`;
        document.head.appendChild(style);
    }


    /**
     * 初始化HLS播放器
     * @param {HTMLVideoElement} videoElement - 视频元素
     * @param {string} streamUrl - 视频流URL
     * @returns {Object|null} HLS播放器实例
     */
    function initHlsPlayer(videoElement, streamUrl) {
        console.log('[HLS Init] 开始初始化HLS播放器', streamUrl);
        if (typeof Hls === 'undefined') {
            console.error('[HLS Init] Hls库未加载');
            return null;
        }

        const hls = new Hls({
            maxBufferLength: 10,
            maxMaxBufferLength: 30
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('[HLS] 视频流已解析');
            //播放
            videoElement?.play();
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                console.error('[HLS]致命错误:', data);
            }
        });

        return hls;
    }

    /**
     * 创建消息内容
     * @param {Object} message - 消息对象
     * @returns {string} 消息HTML
     */
    function createMessageContent(message) {
        const content = message.content || '';
        const mediaPattern = /(https?:\/\/.*?\.(?:png|jpg|gif|mp4|m3u8|webm|mp3)(?:\?[^\s\n]*)?)/gi;
        const elements = [];
        if(message.video_url) {
            const videoId = `${message.id}-video`;
            elements.push(`<div style=" overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);">
                <video controls style="max-width: 100%; height: auto; display: block;" id="${videoId}" poster="${message.image_url}" src="${message.video_url}" data-hls-src="${message.video_url}"></video>
            </div>`);
        }

        content.split('\n').forEach(text => {
            let remaining = text;
            let match;
            while ((match = mediaPattern.exec(text)) !== null) {
                const media_id = `msg_${message.id}-media_${match.index}`;
                const [url] = match;
                const prefix = remaining.slice(0, match.index);
                if (prefix) elements.push(`<div style="margin-bottom: 8px;">${prefix}</div>`);

                let mediaTag = null;
                if (url.match(/\.(png|jpg|gif)$/i)) {
                    mediaTag = `<div style=" overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2); transition: transform 0.2s ease;">
                        <img src="${url}?ts=${Date.now()}" referrerpolicy="no-referrer-when-downgrade" style="max-width: 100%; height: auto; display: block;" loading="lazy">
                    </div>`;
                } else if (url.match(/\.(mp3)$/i)) {
                    mediaTag = `<div style="">
                        <audio controls style="width: 100%; background: rgba(0, 0, 0, 0.05); padding: 8px; border: none;" src="${url}"></audio>
                    </div>`;
                } else if (url.match(/\.(mp4|webm)$/i)) {
                    mediaTag = `<div style=" overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);">
                        <video controls style="max-width: 100%; height: auto; display: block;" id="${media_id}" src="${url}"></video>
                    </div>`;
                } else if (url.match(/\.(m3u8)$/i)) {
                    mediaTag = `<div style=" overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);">
                        <video controls style="max-width: 100%; height: auto; display: block;" id="${media_id}" data-hls-src="${url}" data-hls-observer="pending"></video>
                    </div>`;
                }
                elements.push(mediaTag);
                remaining = remaining.slice(match.index + url.length);
            }
            if (remaining) elements.push(`<div style="margin-bottom: 8px;">${remaining}</div>`);
        });

        return elements.join('');
    }

    /**
     * 渲染消息气泡
     * @param {Object} message - 消息对象
     * @param {boolean} isOwn - 是否为自己发送的消息
     * @returns {string} 消息气泡HTML
     */
    function renderMessageBubble(message, isOwn) {
        const user_id = message.user_id || 'anonymous';
        const userName = user_id.split('-')[0] || 'anonymous';
        const createdAt = message.created_at || new Date().toISOString();
        const timeStr = new Date(createdAt).toLocaleString('zh-CN', {
            hour12: false,
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(/(\d+)\/(\d+), (\d+:\d+)/, '$2-$3 $4');

        // 用户头像颜色 - 确保至少有两个字符
        const safeUserName = userName.length < 2 ? userName + 'a' : userName;
        const userColor = `hsl(${(safeUserName.charCodeAt(0) * 37 + safeUserName.charCodeAt(1)) % 360}, 70%, 60%)`;

        return `
            <div style="
                padding: 9px 0 0 0;
                background: ${isOwn ? 'linear-gradient(135deg, var(--chat-surface), var(--chat-surface-light))' : 'linear-gradient(135deg, var(--chat-surface), var(--chat-surface-light))'};
                border-radius: ${isOwn ? '20px 20px 8px 20px' : '20px 20px 20px 8px'};
                color: ${isOwn ? 'var(--chat-text)' : 'var(--chat-text)'};
                box-shadow: ${isOwn ? '0 6px 20px rgba(0, 0, 0, 0.5)' : '0 6px 20px rgba(0, 0, 0, 0.5)'};
                max-width: 100%;
                animation: fadeInUp 0.4s ease-out forwards;
                opacity: 0;
                transform: translateY(10px);
                position: relative;
                overflow: hidden;">

                <!-- 气泡装饰元素 -->
                <div style="
                    position: absolute;
                    top: 0;
                    ${isOwn ? 'right: 0;' : 'left: 0;'}
                    width: 60px;
                    height: 60px;
                    background: ${isOwn ? 'radial-gradient(circle, rgba(255,255,255,0.15), transparent)' : 'radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent)'};
                    border-radius: 50%;
                    transform: translate(${isOwn ? '20px' : '-20px'}, -20px);
                "></div>

                <!-- 用户信息栏 -->
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                    font-weight: 600;
                    color: ${isOwn ? 'var(--chat-text-secondary)' : 'var(--chat-text-secondary)'};
                    margin-bottom: 8px;">

                    <!-- 用户头像 -->
                    <div style="
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: ${userColor};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 10px;
                        font-weight: 700;
                        color: white;
                        flex-shrink: 0;
                        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                    ">${userName.charAt(0).toUpperCase()}</div>

                    <span>${userName}</span>
                    <span style="color: ${isOwn ? 'rgba(255, 255, 255, 0.6)' : 'var(--chat-text-tertiary)'};">•</span>
                    <span style="font-weight: 400;">${timeStr}</span>

                    <!-- 消息状态标识 -->
                    ${isOwn ? `
                        <div style="
                            margin-left: auto;
                            display: flex;
                            align-items: center;
                            gap: 4px;">                                    <svg style="width: 14px; height: 14px; color: var(--chat-text-tertiary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>` : ''}
                </div>

                <!-- 消息内容 -->
                <div style="
                    word-wrap: break-word;
                    line-height: 1.5;
                    font-size: 14px;">
                    ${createMessageContent(message)}
                </div>
            </div>
        `;
    }

    /**
     * 聊天室核心类
     */
    class ChatRoom {
        /**
         * 构造函数
         * @param {Object} config - 配置参数
         */
        constructor(config) {
            this.config = config;
            this.isFirstExpand = true;
            // 视频状态管理
            this.currentVideo = null; // 当前播放的视频元素
            // 调整大小状态管理
            this.resizeFrameId = null; // requestAnimationFrame ID
        }

        /**
         * 初始化UI
         */
        initUI() {
            // 聊天窗口容器
            this.container = document.createElement('div');
            this.container.id = 'chat-container';
            Object.assign(this.container.style, {
                position: 'fixed',
                right: this.config.CHAT_UI.position.right,
                bottom: this.config.CHAT_UI.position.bottom,
                width: `${this.config.CHAT_UI.width}`,
                height: `${this.config.CHAT_UI.height}`,
                maxHeight: '95vh',
                backgroundColor: 'var(--chat-bg)',
                borderRadius: '20px',
                boxShadow: '0 20px 60px var(--shadow-color), 0 0 1px rgba(255,255,255,0.1) inset',
                zIndex: 999998,
                display: 'none',
                flexDirection: 'column',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                boxSizing: 'border-box',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                resize: 'none'
            });

            // 聊天窗口头部
            this.header = document.createElement('div');
            this.header.id = 'chat-header';
            this.header.innerHTML = `
                <div class="online-count">
                    <span id="chat-title"></span>
                    <span class="online-dot"></span>
                    <span id="online-users"></span> 
                </div>
            `;
            this.header.style.padding = '10px 24px';
            this.header.style.cursor = 'grab'; // 设置初始光标样式为 grab，提示用户可以拖拽
            this.container.appendChild(this.header);
            
            // 初始化容器拖拽和调整大小功能
            this.initContainerDrag();
            this.initContainerResize();

            // 最小化气泡
            this.bubble = document.createElement('div');
            this.bubble.id = 'chat-bubble';
            
            // 创建点击区域
            const bubbleContent = document.createElement('div');
            bubbleContent.id = 'chat-bubble-icon';
            bubbleContent.textContent = '💬';
            bubbleContent.style.width = '100%';
            bubbleContent.style.height = '100%';
            bubbleContent.style.display = 'flex';
            bubbleContent.style.alignItems = 'center';
            bubbleContent.style.justifyContent = 'center';
            bubbleContent.style.cursor = 'pointer';
            
            // 添加点击事件到内容区域
            bubbleContent.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMinimize();
            });
            
            this.bubble.appendChild(bubbleContent);
            
            Object.assign(this.bubble.style, {
                right: this.config.CHAT_UI.bubblePosition.right,
                bottom: this.config.CHAT_UI.bubblePosition.bottom,
                zIndex: '999999' // 提高z-index确保显示在最外层
            });
            // 添加show类确保气泡显示
            this.bubble.classList.add('show');
            
            // 添加拖拽功能
            this.makeBubbleDraggable();
            
            document.body.appendChild(this.bubble);

            // 创建消息区域
            this.messageArea = document.createElement('div');
            Object.assign(this.messageArea.style, {
                flex: 1,
                padding: '16px 6px', // 减小左右内边距，为视频留出更多宽度
                overflowY: 'auto',
                color: 'var(--chat-text)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            });
            this.messageArea.id = 'chat-messages';

            // 创建输入区域容器（为空，用户可以自行添加输入功能）
            this.inputContainer = document.createElement('div');
            this.inputContainer.id = 'input-container';

            this.container.append(this.messageArea, this.inputContainer);
            document.body.appendChild(this.container);

            return this;
        }

        /**
         * 切换最小化状态
         */
        toggleMinimize() {
            // 计算当前状态
            const wasHidden = this.container.style.display === 'none' || this.container.style.display === '';
            
            // 直接切换容器的显示状态
            if (wasHidden) {
                this.container.style.display = 'flex';
                this.isMinimized = false;
            } else {
                this.container.style.display = 'none';
                this.isMinimized = true;
            }
            // 气泡始终显示
            this.bubble.style.display = 'flex';

            // 只有首次从隐藏状态切换到显示状态时，才自动滚动到最新消息
            if (wasHidden && this.isFirstExpand) {
                this.scrollToBottom();
                this.isFirstExpand = false;
            }

            // 视频状态处理
            if (this.isMinimized) {
                // 最小化时，暂停当前播放的视频
                if (this.currentVideo) {
                    this.currentVideo.pause();
                }
            }
            else {
                // 最大化时，恢复之前的视频播放状态
                if (this.currentVideo) {
                    this.currentVideo.play().catch(err => console.error('恢复视频播放失败:', err));
                }
            }
        }

        /**
         * 添加消息卡片到聊天界面
         * @param {Object} message - 消息对象
         * @param {boolean} isOwn - 是否为自己发送的消息
         */
        addMsgCard(message, isOwn = false) {
            if (!message) {
                console.error('消息对象不能为空');
                return;
            }

            // 确保消息有必要的属性
            message = {
                id: message.id || Date.now(),
                user_id: message.user_id || 'anonymous',
                content: message.content || '',
                created_at: message.created_at || new Date().toISOString(),
                ...message
            };

            const msgElement = document.createElement('div');
            Object.assign(msgElement.style, {
                display: 'flex',
                width: '100%',
                margin: '12px 0',
                justifyContent: isOwn ? 'flex-end' : 'flex-start'
            });

            // 消息渲染
            try {
                const bubbleHTML = renderMessageBubble(message, isOwn);
                if (typeof bubbleHTML === 'string' && bubbleHTML.length > 0) {
                    msgElement.innerHTML = bubbleHTML;
                } else {
                    console.error('消息渲染异常:', { message, isOwn });
                    msgElement.innerHTML = `<div style="color: var(--chat-text); padding: 10px; background: var(--chat-surface); border-radius: 8px;">消息渲染失败</div>`;
                }
            } catch (e) {
                console.error('消息加载失败:', e);
                msgElement.innerHTML = `<div style="color: var(--chat-text); padding: 10px; background: var(--chat-surface); border-radius: 8px;">消息加载失败</div>`;
            }

            this.messageArea.appendChild(msgElement);

            // 初始化视频事件监听
            const setupVideoEventListeners = (video) => {
                // 监听视频播放事件
                video.addEventListener('play', () => {
                    // 暂停其他所有视频
                    document.querySelectorAll('video').forEach(otherVideo => {
                        if (otherVideo !== video && !otherVideo.paused) {
                            otherVideo.pause();
                        }
                    });
                    // 更新当前视频状态
                    this.currentVideo = video;
                });

                // 监听视频结束事件
                video.addEventListener('ended', () => {
                    if (this.currentVideo === video) {
                        this.currentVideo = null;
                    }
                });
            };

            // 初始化HLS视频
            msgElement.querySelectorAll('video[data-hls-src]').forEach(video => {
                const hlsSrc = video.dataset.hlsSrc;
                initHlsPlayer(video, hlsSrc);
                setupVideoEventListeners(video);
            });

            // 初始化普通视频
            msgElement.querySelectorAll('video:not([data-hls-src])').forEach(video => {
                setupVideoEventListeners(video);
            });

            this.scrollToBottom();
        }

        /**
         * 滚动到底部
         */
        scrollToBottom() {
            this.messageArea.scrollTo({
                top: this.messageArea.scrollHeight,
                behavior: 'smooth'
            });
        }

        /**
         * 更新在线人数
         * @param {number} count - 在线人数
         */
        updateOnlineCount(count) {
            const counter = document.getElementById('online-users');
            if (counter) {
                counter.textContent = count > 1 ? `${count} 人在线` : '';
                counter.style.fontWeight = count > 0 ? '600' : '400';
            }
        }

        /*
         * 设置聊天室标题
         */
        setTitle(title) {
            const titleElement = document.getElementById('chat-title');
            if (titleElement) {
                titleElement.textContent = title;
            }
        }
        
        /**
         * 使气泡可拖拽
         */
        makeBubbleDraggable() {
            this.isDragging = false;
            this.isDragAction = false;
            this.startX = 0;
            this.startY = 0;
            this.initialLeft = 0;
            this.initialTop = 0;
            
            // 绑定事件
            this.bubble.addEventListener('mousedown', (e) => this.startDrag(e));
            this.bubble.addEventListener('touchstart', (e) => {
                // 不要在这里调用preventDefault()，以免阻止点击事件
                this.startDrag(e.touches[0]);
            });
            
            document.addEventListener('mousemove', (e) => this.drag(e));
            document.addEventListener('touchmove', (e) => {
                // 只在拖拽过程中调用preventDefault()，防止页面滚动
                if (this.isDragging) {
                    e.preventDefault();
                }
                this.drag(e.touches[0]);
            }, { passive: false });
            
            document.addEventListener('mouseup', (e) => this.stopDrag(e));
            document.addEventListener('touchend', (e) => {
                const touch = e.changedTouches[0];
                if (touch) {
                    this.stopDrag(touch);
                } else {
                    this.stopDrag(e);
                }
            });
            
            // 移除点击事件监听器，因为点击事件处理已移到气泡内容区域
            // 只保留拖拽相关的事件处理
        }
        
        /**
         * 开始拖动
         * @param {MouseEvent|Touch} e - 鼠标或触摸事件
         */
        startDrag(e) {
            // 只有在气泡可见时才能拖拽
            if (this.bubble.style.display === 'none') return;
            
            this.isDragging = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
            
            // 获取初始位置
            const rect = this.bubble.getBoundingClientRect();
            this.initialLeft = rect.left;
            this.initialTop = rect.top;
            
            // 改变光标样式
            this.bubble.style.cursor = 'grabbing';
            // 添加拖拽时的视觉效果
            this.bubble.style.transform = 'scale(1.05)';
            this.bubble.style.transition = 'transform 0.1s ease';
        }
        
        /**
         * 拖动过程
         * @param {MouseEvent|Touch} e - 鼠标或触摸事件
         */
        drag(e) {
            if (!this.isDragging) return;
            
            // 计算位移
            const dx = e.clientX - this.startX;
            const dy = e.clientY - this.startY;
            
            // 计算新位置
            let newLeft = this.initialLeft + dx;
            let newTop = this.initialTop + dy;
            
            // 限制在可视区域内
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const bubbleWidth = this.bubble.offsetWidth;
            const bubbleHeight = this.bubble.offsetHeight;
            
            newLeft = Math.max(0, Math.min(newLeft, windowWidth - bubbleWidth));
            newTop = Math.max(0, Math.min(newTop, windowHeight - bubbleHeight));
            
            // 更新位置
            this.bubble.style.left = `${newLeft}px`;
            this.bubble.style.top = `${newTop}px`;
            // 清除原来的right和bottom样式
            this.bubble.style.right = 'auto';
            this.bubble.style.bottom = 'auto';
        }
        
        /**
         * 结束拖动
         * @param {MouseEvent|Touch} e - 鼠标或触摸事件
         */
        stopDrag(e) {
            if (this.isDragging) {
                // 计算拖拽距离
                const dx = Math.abs(e.clientX - this.startX);
                const dy = Math.abs(e.clientY - this.startY);
                // 判断是否为拖拽操作
                this.isDragAction = dx > 5 || dy > 5;
                
                // 恢复样式
                this.isDragging = false;
                this.bubble.style.cursor = 'pointer';
                this.bubble.style.zIndex = '999999'; // 保持最高层级
                this.bubble.style.transform = 'scale(1)';
                this.bubble.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            }
        }
        
        /**
         * 初始化容器拖拽功能
         */
        initContainerDrag() {
            this.container.isDragging = false;
            this.container.isDragAction = false;
            this.container.startX = 0;
            this.container.startY = 0;
            this.container.initialLeft = 0;
            this.container.initialTop = 0;
            this.container.dragHandle = this.header;
            
            // 绑定事件 - 参考悬浮UI库的实现
            this.container.dragHandle.addEventListener('mousedown', (e) => this.startContainerDrag(e));
            this.container.dragHandle.addEventListener('touchstart', (e) => this.startContainerDrag(e), { passive: false });
            
            document.addEventListener('mousemove', (e) => this.dragContainer(e));
            document.addEventListener('touchmove', (e) => this.dragContainer(e), { passive: false });
            
            document.addEventListener('mouseup', (e) => this.stopContainerDrag(e));
            document.addEventListener('touchend', (e) => this.stopContainerDrag(e));
            
            // 防止拖拽时触发点击事件
            this.container.dragHandle.addEventListener('click', (e) => {
                if (this.container.isDragAction) {
                    this.container.isDragAction = false;
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                }
            });
        }
        
        /**
         * 开始容器拖动
         * @param {MouseEvent|Touch} e - 鼠标或触摸事件
         */
        startContainerDrag(e) {
            // 只有在容器可见时才能拖拽
            if (this.container.style.display === 'none') return;
            
            // 处理触摸事件对象
            const event = e.touches ? e.touches[0] : e;
            
            // 阻止默认行为和冒泡
            e.preventDefault();
            e.stopPropagation();
            
            this.container.isDragging = true;
            this.container.startX = event.clientX;
            this.container.startY = event.clientY;
            
            // 获取初始位置
            const rect = this.container.getBoundingClientRect();
            this.container.initialLeft = rect.left;
            this.container.initialTop = rect.top;
            
            // 改变光标样式
            this.container.dragHandle.style.cursor = 'grabbing';
            // 提高z-index，确保拖拽时在最上层
            this.container.style.zIndex = '999999';
            
            // 添加拖拽时的视觉效果
            this.container.style.transform = 'scale(1.01)';
            this.container.style.transition = 'transform 0.1s ease';
        }
        
        /**
         * 拖动容器
         * @param {MouseEvent|Touch} e - 鼠标或触摸事件
         */
        dragContainer(e) {
            if (!this.container.isDragging) return;
            
            // 处理触摸事件对象
            const event = e.touches ? e.touches[0] : e;
            
            // 计算位移
            const dx = event.clientX - this.container.startX;
            const dy = event.clientY - this.container.startY;
            
            // 计算新位置
            let newLeft = this.container.initialLeft + dx;
            let newTop = this.container.initialTop + dy;
            
            // 限制在可视区域内
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const containerWidth = this.container.offsetWidth;
            const containerHeight = this.container.offsetHeight;
            
            newLeft = Math.max(0, Math.min(newLeft, windowWidth - containerWidth));
            newTop = Math.max(0, Math.min(newTop, windowHeight - containerHeight));
            
            // 更新位置
            this.container.style.left = `${newLeft}px`;
            this.container.style.top = `${newTop}px`;
            // 清除原来的right和bottom样式
            this.container.style.right = 'auto';
            this.container.style.bottom = 'auto';
        }
        
        /**
         * 结束容器拖动
         * @param {MouseEvent|Touch} e - 鼠标或触摸事件
         */
        stopContainerDrag(e) {
            if (this.container.isDragging) {
                // 处理触摸事件对象
                const event = e.changedTouches ? e.changedTouches[0] : e;
                
                // 计算拖拽距离
                const dx = Math.abs(event.clientX - this.container.startX);
                const dy = Math.abs(event.clientY - this.container.startY);
                // 判断是否为拖拽操作
                this.container.isDragAction = dx > 5 || dy > 5;
                
                // 恢复样式
                this.container.isDragging = false;
                this.container.dragHandle.style.cursor = 'grab';
                this.container.style.zIndex = '999998';
                // 恢复视觉效果
                this.container.style.transform = 'scale(1)';
                this.container.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            }
        }
        
        /**
         * 初始化容器调整大小功能
         */
        initContainerResize() {
            this.container.isResizing = false;
            this.container.resizeStartX = 0;
            this.container.resizeStartY = 0;
            this.container.initialWidth = 0;
            this.container.initialHeight = 0;
            
            // 创建调整大小的手柄
            this.resizeHandle = document.createElement('div');
            this.resizeHandle.style.position = 'absolute';
            this.resizeHandle.style.bottom = '5px';
            this.resizeHandle.style.right = '5px';
            this.resizeHandle.style.width = '25px'; // 增大尺寸，方便触摸
            this.resizeHandle.style.height = '25px'; // 增大尺寸，方便触摸
            this.resizeHandle.style.backgroundColor = 'var(--primary-color)';
            this.resizeHandle.style.borderRadius = '50%';
            this.resizeHandle.style.cursor = 'nwse-resize';
            this.resizeHandle.style.zIndex = '1';
            this.resizeHandle.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
            this.resizeHandle.style.transition = 'background-color 0.2s ease, transform 0.2s ease';
            
            // 添加悬停效果
            this.resizeHandle.addEventListener('mouseenter', () => {
                this.resizeHandle.style.backgroundColor = 'var(--primary-light)';
            });
            
            this.resizeHandle.addEventListener('mouseleave', () => {
                this.resizeHandle.style.backgroundColor = 'var(--primary-color)';
            });
            
            this.container.appendChild(this.resizeHandle);
            
            // 绑定事件 - 参考悬浮UI库的实现
            this.resizeHandle.addEventListener('mousedown', (e) => this.startContainerResize(e));
            this.resizeHandle.addEventListener('touchstart', (e) => this.startContainerResize(e), { passive: false });
            
            document.addEventListener('mousemove', (e) => this.resizeContainer(e));
            document.addEventListener('touchmove', (e) => this.resizeContainer(e), { passive: false });
            
            document.addEventListener('mouseup', () => this.stopContainerResize());
            document.addEventListener('touchend', () => this.stopContainerResize());
        }
        
        /**
         * 开始容器调整大小
         * @param {MouseEvent|Touch} e - 鼠标或触摸事件
         */
        startContainerResize(e) {
            // 只有在容器可见时才能调整大小
            if (this.container.style.display === 'none') return;
            
            // 处理触摸事件对象
            const event = e.touches ? e.touches[0] : e;
            
            // 阻止默认行为和冒泡
            e.preventDefault();
            e.stopPropagation();
            
            this.container.isResizing = true;
            this.container.resizeStartX = event.clientX;
            this.container.resizeStartY = event.clientY;
            
            // 获取初始尺寸
            this.container.initialWidth = this.container.offsetWidth;
            this.container.initialHeight = this.container.offsetHeight;
            
            // 提高z-index，确保调整大小时在最上层
            this.container.style.zIndex = '999999';
            
            // 添加调整大小时的视觉效果
            this.resizeHandle.style.transform = 'scale(1.2)';
            this.resizeHandle.style.transition = 'transform 0.1s ease';
        }
        
        /**
         * 调整容器大小
         * @param {MouseEvent|Touch} e - 鼠标或触摸事件
         */
        resizeContainer(e) {
            if (!this.container.isResizing) return;
            
            // 处理触摸事件对象
            const event = e.touches ? e.touches[0] : e;
            
            // 计算位移
            const dx = event.clientX - this.container.resizeStartX;
            const dy = event.clientY - this.container.resizeStartY;
            
            // 计算新尺寸
            let newWidth = this.container.initialWidth + dx;
            let newHeight = this.container.initialHeight + dy;
            
            // 限制最小和最大尺寸
            const minWidth = 300;
            const minHeight = 400;
            const maxWidth = window.innerWidth * 0.8;
            const maxHeight = window.innerHeight * 0.95;
            
            newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
            newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
            
            // 直接更新尺寸
            this.container.style.width = `${newWidth}px`;
            this.container.style.height = `${newHeight}px`;
        }
        
        /**
         * 结束容器调整大小
         */
        stopContainerResize() {
            if (this.container.isResizing) {
                this.container.isResizing = false;
                this.container.style.zIndex = '999998';
                
                // 恢复调整大小手柄的视觉效果
                this.resizeHandle.style.transform = 'scale(1)';
                this.resizeHandle.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            }
        }
    }

    /**
     * 库的公共API
     */
    return {
        VERSION,
        /**
         * 初始化聊天室UI
         * @returns {ChatRoom} 聊天室实例
         */
        initUI() {
            // 使用默认配置
            const config = {
                CHAT_UI: DEFAULT_UI_CONFIG
            };

            // 注入样式
            injectStyles(config.CHAT_UI);

            // 创建并初始化聊天室实例
            chatRoomInstance = new ChatRoom(config);
            return chatRoomInstance.initUI();
        },

        /**
         * 添加消息卡片到聊天界面
         * @param {Object} message - 消息对象
         * @param {boolean} isOwn - 是否为自己发送的消息，可选，默认为false
         */
        addMsgCard(message, isOwn = false) {
            if (!chatRoomInstance) {
                console.error('聊天室UI未初始化，请先调用 initUI()');
                return;
            }
            chatRoomInstance.addMsgCard(message, isOwn);
        },

        /**
         * 更新在线人数
         * @param {number} count - 在线人数
         */
        updateOnlineCount(count) {
            if (!chatRoomInstance) {
                console.error('聊天室UI未初始化，请先调用 initUI()');
                return;
            }
            chatRoomInstance.updateOnlineCount(count);
        },

        /**
         * 设置聊天室标题
         * @param {string} title - 聊天室标题
         */
        setTitle(title) {
            if (!chatRoomInstance) {
                console.error('聊天室UI未初始化，请先调用 initUI()');
                return;
            }
            chatRoomInstance.setTitle(title);   
        }
    };

})();