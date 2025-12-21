// ==UserScript==
// @name         onlineChat-在线网页聊天室
// @namespace    sage_home
// @version      1.2
// @description  和所有人在线交流，安全匿名，无需账号，无需客户端，保护隐私，在线网页聊天室
// @match        https://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-start
// @license      MIT
// @connect      supabase.co
// @require      https://unpkg.com/@supabase/supabase-js@2.49.3/dist/umd/supabase.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.1.5/hls.min.js
// ==/UserScript==

// HLS播放器模块
const HlsPlayer = {
    config: {
        BUFFER_LENGTH: 10,
        MAX_RETRY: 3,
        ERROR_DELAY: 5000
    },

    init: function (videoElement, streamUrl) {
        console.log('[HLS Init] 开始初始化HLS播放器', streamUrl);
        if (typeof Hls === 'undefined') {
            console.error('[HLS Init] Hls库未加载');
            return null;
        }

        const hls = new Hls({
            maxBufferLength: this.config.BUFFER_LENGTH,
            maxMaxBufferLength: this.config.BUFFER_LENGTH * 3
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('[HLS] 视频流已解析');
            /* videoElement.play().catch(err => {
                console.error('[HLS]播放失败:', err);
            }); */
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                console.error('[HLS]致命错误:', data);
            }
        });

        return hls;
    },
};

(function () {
    'use strict';

    // 配置参数
    const CONFIG = {
        SUPABASE_URL: 'https://icaugjyuwenraxxgwvzf.supabase.co',
        SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYXVnanl1d2VucmF4eGd3dnpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4ODcwNjcsImV4cCI6MjA1ODQ2MzA2N30.-IsrU3_NyoqDxFeNH1l2d6SgVv9pPA0uIVEA44FmuSQ',
        CHAT_UI: {
            width: 380,
            height: 550,
            position: { right: '30px', bottom: '0px' }, // 容器初始化位置：右边30px，底部0px（尾部在最底部）
            bubblePosition: { right: '30px', top: '0px' }, // 气泡位置
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
        }
    };

    // 样式管理模块
    const StyleManager = (() => {
        const cssVariables = `
            :root {
                --chat-bg: ${CONFIG.CHAT_UI.theme.background};
                --chat-surface: ${CONFIG.CHAT_UI.theme.surface};
                --chat-surface-light: ${CONFIG.CHAT_UI.theme.surfaceLight};
                --chat-text: ${CONFIG.CHAT_UI.theme.text};
                --chat-text-secondary: ${CONFIG.CHAT_UI.theme.textSecondary};
                --primary-color: ${CONFIG.CHAT_UI.theme.primary};
                --primary-light: ${CONFIG.CHAT_UI.theme.primaryLight};
                --border-color: ${CONFIG.CHAT_UI.theme.border};
                --shadow-color: ${CONFIG.CHAT_UI.theme.shadow};
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
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(8px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(15px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                }
                50% {
                    opacity: 0.7;
                }
            }
        `;

        const globalStylesCSS = `
            #chat-container {
                animation: slideIn 0.4s ease-out;
                background: var(--chat-bg);
                border: 1px solid var(--border-color);
                border-radius: 16px;
            }
            #chat-messages {
                background: var(--chat-surface);
            }
            #input-container {
                padding: 12px;
                border-top: 1px solid var(--border-color);
                box-sizing: border-box;
                background: var(--chat-surface);
                position: relative;
            }
            #chat-input {
                width: 100%;
                min-height: 48px;
                max-height: 120px;
                padding: 12px 16px;
                background: var(--chat-surface-light);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                color: var(--chat-text);
                resize: vertical;
                font-size: 14px;
                line-height: 1.5;
                transition: all 0.3s ease;
                overflow-y: auto;
                box-sizing: border-box;
            }
            #chat-input::-webkit-scrollbar {
                display: none;
            }
            #chat-input:focus {
                outline: none;
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.3);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }


            #chat-send-button:active {
                transform: translateY(0);
            }
            .online-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: #10b981;
                margin-right: 6px;
                display: inline-block;
                animation: pulse 2s infinite;
            }
            #chat-header {
                padding: 20px 24px;
                border-bottom: 1px solid var(--border-color);
                background: linear-gradient(135deg, var(--chat-bg), var(--chat-surface));
                border-top-left-radius: 20px;
                border-top-right-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                height: auto;
            }
            .online-count {
                font-size: 16px;
                font-weight: 600;
                color: white;
            }
            #online-users {
                color: white;
                font-weight: 600;
            }
            #chat-minimize-button {
                position: absolute;
                top: 12px;
                right: 12px;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background-color: rgba(255, 255, 255, 0.1);
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 20px;
                font-weight: bold;
                transition: all 0.2s ease;
            }
            #chat-minimize-button:hover {
                background-color: rgba(255, 255, 255, 0.2);
                transform: scale(1.1);
            }
            #chat-minimize-button:active {
                transform: scale(0.95);
            }
            #chat-bubble {
                position: fixed;
                right: ${CONFIG.CHAT_UI.position.right};
                bottom: ${CONFIG.CHAT_UI.position.bottom};
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--chat-surface), var(--border-color));
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255,255,255,0.05) inset;
                z-index: 9999;
                cursor: pointer;
                display: none;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);;
            }
            #chat-bubble.show {
                display: flex;
                animation: slideIn 0.4s ease-out;
            }
            #chat-bubble:hover {
                transform: scale(1.1) rotate(5deg);
                box-shadow: 0 15px 40px rgba(0, 0, 0, 0.7);
            }
            #chat-bubble:active {
                transform: scale(0.95);
            }
            #chat-bubble-icon {
                color: var(--chat-text);
                font-size: 28px;
                font-weight: bold;
            }
        `;

        return {
            inject: () => {
                const style = document.createElement('style');
                style.textContent = `${cssVariables} ${scrollbarCSS} ${animationsCSS} ${globalStylesCSS}`;
                document.head.appendChild(style);
            }
        };
    })();

    // Supabase 客户端管理
    const SupabaseClient = (() => {
        let client;

        return {
            initialize: async () => {
                client = window.supabase.createClient(
                    CONFIG.SUPABASE_URL,
                    CONFIG.SUPABASE_KEY,
                    {
                        realtime: { params: { eventsPerSecond: 10 } }
                    }
                );
                return client;
            },
            getClient: () => client
        };
    })();

    // 聊天室核心功能
    class ChatRoom {
        constructor(supabase) {
            this.supabase = supabase; // 使用全局已实例化的Supabase客户端
            // this.container = this.createContainer(); // 移除对不存在方法的调用
            this.initUI();
            // 初始化用户和实时连接
            this.initializeUser();
            this.setupRealtime();
            this.loadHistory();
            // 页面关闭时清理资源
            window.addEventListener('beforeunload', () => this.cleanup());
        }


        initUI() {
            // 聊天窗口容器 - 初始化时头部在40vh，尾部在最底部
            this.container = document.createElement('div');
            this.container.id = 'chat-container';
            const containerTop = window.innerHeight * 0.4 - CONFIG.CHAT_UI.height; // 40vh高度减去容器高度，使头部在40vh，尾部在底部
            Object.assign(this.container.style, {
                position: 'fixed',
                right: CONFIG.CHAT_UI.position.right,
                bottom: CONFIG.CHAT_UI.position.bottom,
                width: `${CONFIG.CHAT_UI.width}px`,
                height: `${CONFIG.CHAT_UI.height}px`,
                backgroundColor: 'var(--chat-bg)',
                borderRadius: '20px',
                boxShadow: '0 20px 60px var(--shadow-color), 0 0 1px rgba(255,255,255,0.1) inset',
                zIndex: 9999,
                display: 'flex',
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
                    <span class="online-dot"></span>
                    <span id="online-users">0</span> 人在线
                </div>
            `;
            this.container.appendChild(this.header);

            // 添加最小化按钮
            this.minimizeButton = document.createElement('button');
            this.minimizeButton.id = 'chat-minimize-button';
            this.minimizeButton.innerHTML = '-';
            this.minimizeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMinimize();
            });
            this.header.appendChild(this.minimizeButton);

            // 最小化气泡
            this.bubble = document.createElement('div');
            this.bubble.id = 'chat-bubble';
            this.bubble.innerHTML = '<div id="chat-bubble-icon">💬</div>';
            // 设置气泡初始位置
            Object.assign(this.bubble.style, {
                right: CONFIG.CHAT_UI.position.right,
                top: (window.innerHeight * 0.4 - 30) + 'px' // 气泡中心在容器最小化按钮位置（头部40vh）
            });
            this.bubble.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMinimize();
            });
            document.body.appendChild(this.bubble);

            this.messageArea = this.createMessageArea();
            this.input = this.createInput();

            // 创建输入区域容器
            this.inputContainer = document.createElement('div');
            this.inputContainer.id = 'input-container';
            this.inputContainer.append(this.input);

            this.container.append(this.messageArea, this.inputContainer);
            document.body.appendChild(this.container);

            // 初始化拖动和调整功能
            this.initDraggable();
        }

        createMessageArea() {
            const div = document.createElement('div');
            Object.assign(div.style, {
                flex: 1,
                padding: '20px 24px',
                overflowY: 'auto',
                color: 'var(--chat-text)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            });
            div.id = 'chat-messages';
            return div;
        }

        createInput() {
            const input = document.createElement('textarea');
            input.id = 'chat-input';
            input.placeholder = '输入消息（Enter 发送）';

            // 自动调整输入框高度和检查输入内容
            input.addEventListener('input', () => {
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 120) + 'px';

                // 检查输入内容，启用或禁用发送按钮
                if (this.sendButton) {
                    if (input.value.trim()) {
                        this.sendButton.disabled = false;
                    } else {
                        this.sendButton.disabled = true;
                    }
                }
            });

            // 输入框键盘事件 - 支持按Enter直接发送
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            return input;
        }



        // 新增IP获取方法
        async getClientIP() {
            try {
                // 备选方案：使用第三方IP查询
                const { ip } = await fetch('https://api.ipify.org?format=json').then(r => r.json());
                return ip;
            } catch (error) {
                // 备选方案
                console.log('获取IP失败', error);
                return '0.0.0.0';
            }
        }

        /**
         * 初始化用户：检查登录状态，若无则匿名登录
         */
        async initializeUser() {
            try {
                // GM_getValue 实现跨域一致性
                this.userId = await GM_getValue('user_id');
                if (this.userId) {
                    console.log('===已存在用户ID===', this.userId);
                    //GM_deleteValue('user_id');//仅测试
                    return;
                }
                else {
                    // 匿名登录
                    const { data, error } = await this.supabase.auth.signInAnonymously({
                        options: {
                            data: {
                                ip: await this.getClientIP(),
                                device_info: {
                                    screen_resolution: `${screen.width}x${screen.height}`,
                                    color_depth: screen.colorDepth + 'bit',
                                    preferred_language: navigator.language,
                                    timezone_offset: new Date().getTimezoneOffset() / 60,
                                    hardware_concurrency: navigator.hardwareConcurrency || 'unknown',
                                    os_platform: navigator.platform,
                                    user_agent: navigator.userAgent.substring(0, 100)
                                }
                            }
                        }
                    });
                    console.log('===注册匿名用户===', data, error);
                    if (error) throw error;
                    this.userId = data.session.user.id;
                    GM_setValue('user_id', this.userId);
                }
            } catch (error) {
                console.error('用户初始化失败:', error);
                //alert('无法连接到聊天服务器，请刷新页面重试');
            }
        }

        /**
         * 设置实时通信：消息和在线状态
         */
        async setupRealtime() {
            // 统一通信频道（集成消息+在线状态）
            this.messageChannel = this.supabase.channel('chat-room', {
                config: {
                    presence: {
                        key: this.userId,
                        heartbeatInterval: 15,
                        statusTTL: 60
                    }
                }
            })
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                }, payload => this.addMessage(payload.new))
                .on('presence', { event: 'sync' }, () => {
                    try {
                        const states = this.messageChannel.presenceState();
                        const onlineCount = Object.values(states).length;
                        this.updateOnlineCount(onlineCount);
                    } catch (e) {
                        console.error('[Presence状态同步异常]', e);
                    }
                })
                .subscribe();

            // 跟踪用户在线状态
            await this.messageChannel.track({
                user_id: this.userId,
                online_at: new Date().toISOString()
            });
        }


        addMessage(message) {
            //if (message.domain !== location.host) return; // 过滤非法消息
            const isOwn = message.user_id === this.userId;
            const msgElement = document.createElement('div');

            // 设置消息容器样式，确保左右对齐
            Object.assign(msgElement.style, {
                display: 'flex',
                width: '100%',
                margin: '12px 0',
                justifyContent: isOwn ? 'flex-end' : 'flex-start'
            });

            // 智能内容解析与样式优化
            // 消息气泡渲染组件 - 优化版（支持左右分开显示）
            const renderMessageBubble = (message, isOwn) => {
                const userName = message.user_id.split('-')[0] || '匿名用户';
                const timeStr = new Date(message.created_at).toLocaleString('zh-CN', {
                    hour12: false,
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }).replace(/(\d+)\/(\d+), (\d+:\d+)/, '$2-$3 $4');

                // 用户头像颜色 - 根据用户名生成唯一颜色
                const userColor = `hsl(${(userName.length * 37 + userName.charCodeAt(0)) % 360}, 70%, 60%)`;

                return `
                    <div style="
                        padding: 16px 20px;
                        background: ${isOwn ?
                            'linear-gradient(135deg, var(--chat-surface), var(--chat-surface-light))' :
                            'linear-gradient(135deg, var(--chat-surface), var(--chat-surface-light))'};
                        border-radius: ${isOwn ? '20px 20px 8px 20px' : '20px 20px 20px 8px'};
                        color: ${isOwn ? 'var(--chat-text)' : 'var(--chat-text)'};
                        box-shadow: ${isOwn ?
                            '0 6px 20px rgba(0, 0, 0, 0.5)' :
                            '0 6px 20px rgba(0, 0, 0, 0.5)'};
                        max-width: 70%;
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
                            background: ${isOwn ?
                                'radial-gradient(circle, rgba(255,255,255,0.15), transparent)' :
                                'radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent)'};
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
            };

            // 多媒体内容解析器 - 优化版
            const createMessageContent = (message) => {
                const content = message.content;
                const mediaPattern = /(https?:\/\/.*\.(?:png|jpg|gif|mp4|m3u8|webm|mp3))\b/gi;
                const elements = [];

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
                                <img src="${url}?ts=${Date.now()}"
                                     referrerpolicy="no-referrer-when-downgrade"
                                     style="max-width: 100%; height: auto; display: block;"
                                     loading="lazy">
                            </div>`;
                        }
                        else if (url.match(/\.(mp3)$/i)) {
                            mediaTag = `<div style="margin: 10px 0;">
                                <audio controls style="width: 100%; background: rgba(0, 0, 0, 0.05); border-radius: 12px; padding: 8px; border: none;" src="${url}"></audio>
                            </div>`;
                        }
                        else if (url.match(/\.(mp4|webm)$/i)) {
                            mediaTag = `<div style="margin: 10px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);">
                                <video controls style="max-width: 100%; height: auto; display: block;" id="${media_id}" src="${url}"></video>
                            </div>`;
                        }
                        else if (url.match(/\.(m3u8)$/i)) {
                            mediaTag = `<div style="margin: 10px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);">
                                <video controls style="max-width: 100%; height: auto; display: block;"
                                    id="${media_id}"
                                    data-hls-src="${url}"
                                    data-hls-observer="pending"></video>
                            </div>`;
                        }
                        elements.push(mediaTag);
                        remaining = remaining.slice(match.index + url.length);
                    }
                    if (remaining) elements.push(`<div style="margin-bottom: 8px;">${remaining}</div>`);
                });

                return elements.join('');
            };

            // 消息渲染异常防御机制
            try {
                //const messageContainer = document.querySelector('#message-container');
                //console.assert(messageContainer, '消息容器未找到');

                const bubbleHTML = renderMessageBubble(message, isOwn);
                if (typeof bubbleHTML === 'string' && bubbleHTML.length > 0) {
                    msgElement.innerHTML = bubbleHTML;
                } else {
                    console.error('消息渲染异常:', { message, isOwn });
                    msgElement.innerHTML = `<div class="error-message">消息渲染失败</div>`;
                }
            } catch (e) {
                console.error('消息加载失败:', e);
                GM_notification({
                    title: '系统错误',
                    text: `消息加载失败: ${e.message}`,
                    timeout: 5000
                });
            }
            this.messageArea.appendChild(msgElement);
            // Initialize HLS for video elements
            msgElement.querySelectorAll('video[data-hls-src]').forEach(video => {
                const hlsSrc = video.dataset.hlsSrc;
                HlsPlayer.init(video, hlsSrc);
            });
            this.scrollToBottom();
        }

        scrollToBottom() {
            this.messageArea.scrollTo({
                top: this.messageArea.scrollHeight,
                behavior: 'smooth'
            });
        }

        async loadHistory() {
            try {
                const { data, error } = await this.supabase
                    .from('messages')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) throw error;
                if (!data || data.length === 0) return;

                const fragment = document.createDocumentFragment();
                data.reverse().forEach(msg => { this.addMessage(msg) });
                this.messageArea.appendChild(fragment);
                this.scrollToBottom();
            } catch (error) {
                console.error('加载消息历史失败:', error);
            }
        }

        /**
         * 更新在线人数显示
         * @param {number} count - 当前在线用户数量
         */
        updateOnlineCount(count) {
            const counter = document.getElementById('online-users');
            counter.textContent = count;
            counter.style.fontWeight = count > 0 ? '600' : '400';
        }

        /**
         * 切换聊天界面的最小化/最大化状态
         */
        toggleMinimize() {
            this.isMinimized = this.container.style.display === 'none';
            this.isMinimized = !this.isMinimized;
            const display = this.isMinimized ? 'none' : 'flex';
            this.container.style.display = display;
            this.bubble.style.display = this.isMinimized ? 'flex' : 'none';

            // 获取容器的高度
            const containerHeight = this.container.offsetHeight;

            // 精确同步位置，确保最小化按钮与气泡完全重合
            if (!this.isMinimized) {
                // 从气泡同步到容器：计算容器位置，使最小化按钮与气泡位置重合
                const bubbleRight = parseFloat(this.bubble.style.right || CONFIG.CHAT_UI.position.right.replace('px', ''));
                const bubbleTop = parseFloat(this.bubble.style.top || (window.innerHeight * 0.4 - 30) + 'px');

                // 计算容器位置：使容器的最小化按钮(right:12px, top:12px)与气泡中心完全重合
                const containerRight = bubbleRight + 30 - 12; // 气泡右边距 + 气泡半径 - 按钮right偏移量
                const containerTopPosition = bubbleTop + 30 - 12; // 气泡top + 气泡半径 - 按钮top偏移量
                const containerBottom = window.innerHeight - (containerTopPosition + containerHeight);

                this.container.style.right = containerRight + 'px';
                this.container.style.bottom = containerBottom + 'px';

                console.log('容器展开：气泡与最小化按钮对齐', { bubbleRight, bubbleTop, containerRight, containerBottom, containerHeight });
            } else {
                // 从容器同步到气泡：计算气泡位置，使其与容器最小化按钮精确重合
                const containerRight = parseFloat(this.container.style.right || CONFIG.CHAT_UI.position.right.replace('px', ''));
                const containerBottom = parseFloat(this.container.style.bottom || CONFIG.CHAT_UI.position.bottom.replace('px', ''));

                // 计算按钮在页面中的绝对位置
                const buttonX = containerRight + 12; // 容器right + 按钮right偏移
                const buttonY = window.innerHeight - containerBottom - containerHeight + 12; // 按钮top位置

                // 气泡位置 = 按钮位置 - 气泡半径
                const bubbleRight = buttonX - 30; // 按钮X - 气泡半径
                const bubbleTop = buttonY - 30; // 按钮Y - 气泡半径

                this.bubble.style.right = bubbleRight + 'px';
                this.bubble.style.top = bubbleTop + 'px';

                console.log('气泡最小化：与按钮位置精确重合', { containerRight, containerBottom, buttonX, buttonY, bubbleRight, bubbleTop, containerHeight });
            }
        }

        /**
         * 初始化拖动功能
         */
        initDraggable() {
            // 最小化图标拖动（只允许上下拖动，不允许左右拖动，范围0-100vh）
            let isDraggingBubble = false;
            let startY = 0;
            let startTop = 0;

            this.bubble.addEventListener('mousedown', (e) => {
                // 只有左键点击且不是点击打开时才允许拖动
                if (e.button !== 0 || e.target.id === 'chat-bubble-icon') return;
                e.preventDefault();
                e.stopPropagation();
                isDraggingBubble = true;
                startY = e.clientY;
                startTop = parseFloat(this.bubble.style.top || CONFIG.CHAT_UI.position.top.replace('px', ''));
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDraggingBubble) return;
                e.preventDefault();
                // 只计算垂直移动距离
                const deltaY = e.clientY - startY;

                // 调整上下位置，限制在0到100vh范围内
                let newTop = startTop + deltaY;
                newTop = Math.max(0, Math.min(newTop, window.innerHeight - this.bubble.offsetHeight));
                this.bubble.style.top = newTop + 'px';
            });

            document.addEventListener('mouseup', () => {
                isDraggingBubble = false;
            });

            // 为整个聊天容器添加拖动功能（只允许上下拖动）
            this.initContainerDraggable();

            // 整个UI的高度调整
            this.initHeightResize();
        }

        /**
         * 初始化整个聊天容器的拖动功能（只允许上下拖动，使用bottom定位）
         */
        initContainerDraggable() {
            let isDraggingContainer = false;
            let startY = 0;
            let startBottom = 0;

            this.header.addEventListener('mousedown', (e) => {
                // 避免与最小化按钮冲突
                if (e.target.id === 'chat-minimize-button') return;
                e.preventDefault();
                e.stopPropagation();
                isDraggingContainer = true;
                startY = e.clientY;
                startBottom = parseFloat(this.container.style.bottom || CONFIG.CHAT_UI.position.bottom.replace('px', ''));
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDraggingContainer) return;
                e.preventDefault();
                const deltaY = startY - e.clientY;

                // 只调整上下位置，限制在0到100vh范围内
                let newBottom = startBottom + deltaY;
                newBottom = Math.max(0, Math.min(newBottom, window.innerHeight - this.container.offsetHeight));
                this.container.style.bottom = newBottom + 'px';
            });

            document.addEventListener('mouseup', () => {
                isDraggingContainer = false;
            });
        }

        /**
         * 初始化高度调整功能（修复：调整时尾部不变，头部变化，符合直觉；调整后同步气泡位置）
         */
        initHeightResize() {
            const resizer = document.createElement('div');
            Object.assign(resizer.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '8px',
                cursor: 'ns-resize',
                zIndex: '10',
                backgroundColor: 'transparent'
            });
            this.container.appendChild(resizer);

            let isResizing = false;
            let startY = 0;
            let startHeight = 0;
            let startBottom = 0;

            resizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                isResizing = true;
                startY = e.clientY;
                startHeight = this.container.offsetHeight;
                startBottom = parseFloat(this.container.style.bottom || CONFIG.CHAT_UI.position.bottom.replace('px', ''));
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                e.preventDefault();
                const deltaY = startY - e.clientY; // 计算垂直移动距离
                const newHeight = Math.max(300, startHeight + deltaY); // 最小高度300px
                this.container.style.height = newHeight + 'px';
                // 保持尾部（底部）位置不变，头部位置随高度变化而变化（符合直觉）
                this.container.style.bottom = startBottom + 'px';
            });

            document.addEventListener('mouseup', () => {
                isResizing = false;
                // 调整高度后同步气泡位置
                if (!this.isMinimized) {
                    this.syncBubblePosition();
                }
            });
        }

        /**
         * 同步气泡与容器最小化按钮的位置
         */
        syncBubblePosition() {
            const containerRight = parseFloat(this.container.style.right || CONFIG.CHAT_UI.position.right.replace('px', ''));
            const containerBottom = parseFloat(this.container.style.bottom || CONFIG.CHAT_UI.position.bottom.replace('px', ''));
            const containerHeight = this.container.offsetHeight;

            // 气泡位置 = 容器的最小化按钮位置
            const bubbleRight = containerRight + 12 - 30; // 容器右边距 + 按钮X偏移(12) - 气泡中心X(30)
            const bubbleTop = window.innerHeight - containerBottom - containerHeight + 12 - 30; // 计算气泡顶部位置

            this.bubble.style.right = bubbleRight + 'px';
            this.bubble.style.top = bubbleTop + 'px';

            console.log('气泡位置已同步:', { right: bubbleRight, top: bubbleTop, containerHeight });
        }

        async cleanup() {
            // 取消所有频道订阅
            if (this.messageChannel) this.supabase.removeChannel(this.messageChannel);
        }
        /**
         * 清理资源和状态
         */
        async sendMessage() {
            const content = this.input.value.trim();
            if (!content) return;

            // 防刷机制（3秒间隔）
            if (this.lastSendTime && Date.now() - this.lastSendTime < 3000) {
                alert('发送过于频繁，请稍后再试');
                return;
            }

            try {
                const { error } = await this.supabase
                    .from('messages')
                    .insert({
                        content,
                        user_id: this.userId,
                        domain: location.host // 自动注入当前域名
                    });

                if (!error) {
                    this.input.value = '';
                    this.lastSendTime = Date.now();
                } else {
                    console.error('消息发送失败:', error);
                    //alert('消息发送失败: ' + error.message);
                }
            } catch (error) {
                console.error('消息发送失败:', error);
                //alert('消息发送失败: ' + error.message);
            }
        }


    }

    // 主初始化流程
    (async () => {
        StyleManager.inject();

        const checkInitialization = setInterval(async () => {
            if (window.supabase) {
                clearInterval(checkInitialization);
                const client = await SupabaseClient.initialize();
                new ChatRoom(client);
            }
        }, 500);
    })();
})();