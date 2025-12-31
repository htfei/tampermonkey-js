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
        width: 365,
        height: 700,
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
        if(message.image_url) elements.push(`<div style="margin: 10px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);">
            <img src="${message.image_url}?ts=${Date.now()}" referrerpolicy="no-referrer-when-downgrade" style="max-width: 100%; height: auto; display: block;" loading="lazy">
        </div>`);
        if(message.video_url) elements.push(`<div style="margin: 10px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);">
            <video controls style="max-width: 100%; height: auto; display: block;" id="${message.id}-video" src="${message.video_url}"></video>
        </div>`);

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
                    mediaTag = `<div style="margin: 10px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2); transition: transform 0.2s ease;">
                        <img src="${url}?ts=${Date.now()}" referrerpolicy="no-referrer-when-downgrade" style="max-width: 100%; height: auto; display: block;" loading="lazy">
                    </div>`;
                } else if (url.match(/\.(mp3)$/i)) {
                    mediaTag = `<div style="margin: 10px 0;">
                        <audio controls style="width: 100%; background: rgba(0, 0, 0, 0.05); border-radius: 12px; padding: 8px; border: none;" src="${url}"></audio>
                    </div>`;
                } else if (url.match(/\.(mp4|webm)$/i)) {
                    mediaTag = `<div style="margin: 10px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);">
                        <video controls style="max-width: 100%; height: auto; display: block;" id="${media_id}" src="${url}"></video>
                    </div>`;
                } else if (url.match(/\.(m3u8)$/i)) {
                    mediaTag = `<div style="margin: 10px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);">
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
                padding: 12px 16px;
                background: ${isOwn ? 'linear-gradient(135deg, var(--chat-surface), var(--chat-surface-light))' : 'linear-gradient(135deg, var(--chat-surface), var(--chat-surface-light))'};
                border-radius: ${isOwn ? '20px 20px 8px 20px' : '20px 20px 20px 8px'};
                color: ${isOwn ? 'var(--chat-text)' : 'var(--chat-text)'};
                box-shadow: ${isOwn ? '0 6px 20px rgba(0, 0, 0, 0.5)' : '0 6px 20px rgba(0, 0, 0, 0.5)'};
                max-width: 98%;
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
                width: `${this.config.CHAT_UI.width}px`,
                height: `${this.config.CHAT_UI.height}px`,
                backgroundColor: 'var(--chat-bg)',
                borderRadius: '20px',
                boxShadow: '0 20px 60px var(--shadow-color), 0 0 1px rgba(255,255,255,0.1) inset',
                zIndex: 9999,
                display: 'none',
                flexDirection: 'column',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                boxSizing: 'border-box',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
            this.container.appendChild(this.header);

            // 最小化气泡
            this.bubble = document.createElement('div');
            this.bubble.id = 'chat-bubble';
            this.bubble.innerHTML = '<div id="chat-bubble-icon">💬</div>';
            Object.assign(this.bubble.style, {
                right: this.config.CHAT_UI.bubblePosition.right,
                bottom: this.config.CHAT_UI.bubblePosition.bottom,
                display: 'flex'
            });
            this.bubble.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMinimize();
            });
            document.body.appendChild(this.bubble);

            // 创建消息区域
            this.messageArea = document.createElement('div');
            Object.assign(this.messageArea.style, {
                flex: 1,
                padding: '16px 12px',
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
            const wasHidden = this.container.style.display === 'none';
            this.isMinimized = !wasHidden;
            const display = this.isMinimized ? 'none' : 'flex';
            this.container.style.display = display;
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