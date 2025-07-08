// ==UserScript==
// @name         贤者之家
// @namespace    sage_home
// @version      1.0
// @description  和所有人在线交流分享，安全匿名，无需账号，无需客户端，保护隐私，在线网页聊天室，基于Supabase
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
            position: { right: '20px', bottom: '20px' },
            theme: {
                primary: '#007FFF',
                background: '#1A1A1A',
                text: '#FFFFFF',
                inputBg: '#2D2D2D'
            }
        }
    };

    // 样式管理模块
    const StyleManager = (() => {
        const cssVariables = `
            :root {
                --chat-bg: ${CONFIG.CHAT_UI.theme.background};
                --chat-text: ${CONFIG.CHAT_UI.theme.text};
                --primary-color: ${CONFIG.CHAT_UI.theme.primary};
                --input-bg: ${CONFIG.CHAT_UI.theme.inputBg};
            }
        `;

        const scrollbarCSS = `
            #chat-messages::-webkit-scrollbar {
                width: 8px;
                background: transparent;
            }
            #chat-messages::-webkit-scrollbar-thumb {
                background: #5c5c5c;
                border-radius: 4px;
            }
            #chat-messages {
                height: calc(100% - 140px);
                scrollbar-width: thin;
                scrollbar-color: #5c5c5c #2d2d2d;
                box-sizing: border-box;
            }
             #input-container {
                display: flex;
                flex-direction: column;
                align-items: stretch;
                padding: 10px;
                gap: 8px;
                box-sizing: border-box;
                height: 100px;
            }
            #chat-input {
                width: 100%;
                height: 50px;
                background-color: var(--input-bg);
                border: 1px solid #3A3A3A;
                border-radius: 8px;
                color: var(--chat-text);
                resize: none;
                box-sizing: border-box;
                overflow-y: auto;
            }
            #chat-input::-webkit-scrollbar {
                display: none;
            }
            #chat-send-button {
                width: auto;
                padding: 5px 10px;
                background-color: var(--primary-color);
                color: #FFF;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                margin-left: auto;
            }
            .online-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: #4CAF50;
                margin-right: 6px;
                display: inline-block;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            #chat-header {
                height: 36px;
                padding: 0 12px;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 14px;
            }
        `;

        return {
            inject: () => {
                const style = document.createElement('style');
                style.textContent = `${cssVariables} ${scrollbarCSS}`;
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
            this.container = document.createElement('div');
            this.container.id = 'chat-container';
            Object.assign(this.container.style, {
                position: 'fixed',
                right: CONFIG.CHAT_UI.position.right,
                bottom: CONFIG.CHAT_UI.position.bottom,
                width: '400px',
                height: '80dvh',
                backgroundColor: 'var(--chat-bg)',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                zIndex: 9999,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
            });

            this.header = document.createElement('div');
            this.header.id = 'chat-header';
            this.header.innerHTML = `
                <div class="online-count">
                    <span class="online-dot"></span>
                    <span id="online-users">0</span> 人在线
                </div>
            `;
            this.container.appendChild(this.header);

            this.messageArea = this.createMessageArea();
            this.input = this.createInput();
            this.sendButton = this.createButton();
            this.sendButton.addEventListener('click', () => this.sendMessage());

            // 创建输入区域容器，用于水平排列输入框和发送按钮
            this.inputContainer = document.createElement('div');
            this.inputContainer.id = 'input-container';
            this.inputContainer.append(this.input, this.sendButton);

            this.container.append(this.messageArea, this.inputContainer);
            document.body.appendChild(this.container);
        }

        createMessageArea() {
            const div = document.createElement('div');
            Object.assign(div.style, {
                height: 'calc(100% - 120px)',
                padding: '16px',
                overflowY: 'auto',
                color: 'var(--chat-text)'
            });
            div.id = 'chat-messages';
            return div;
        }

        createInput() {
            const input = document.createElement('textarea');
            input.id = 'chat-input';
            input.placeholder = '输入消息（Ctrl + Enter 发送）';
            return input;
        }

        createButton() {
            const button = document.createElement('button');
            button.id = 'chat-send-button';
            button.textContent = '发送';
            return button;
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
            // 智能内容解析与样式优化
            // 消息气泡渲染组件
            const renderMessageBubble = (message, isOwn) => {
                const userName = message.user_id.split('-')[0] || '匿名用户';
                const timeStr = new Date(message.created_at).toLocaleString('zh-CN', {
                    hour12: false,
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }).replace(/(\d+)\/(\d+), (\d+:\d+)/, '$2-$3 $4');
                return `
                    <div style="
                        margin: 8px 0;
                        padding: 2px 5px;
                        background: ${isOwn ? '#1A73E8' : '#2D2D2D'};
                        border-radius: 6px;
                        color: ${isOwn ? '#FFF' : '#E0E0E0'};
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        max-width: 100%;
                        align-self: ${isOwn ? 'flex-end' : 'flex-start'};">
                        <div style="
                            font-size: 0.85em;
                            color: ${isOwn ? 'rgba(255,255,255,0.7)' : 'rgba(224,224,224,0.7)'};
                            margin-bottom: 4px;">
                            ${userName} • ${timeStr}
                        </div>
                        ${createMessageContent(message)}
                    </div>
                `;
            };

            // 多媒体内容解析器
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
                        if (prefix) elements.push(`<div>${prefix}</div>`);

                        let mediaTag = null;
                        if (url.match(/\.(png|jpg|gif)$/i)) {
                            mediaTag = `<img src="${url}?ts=${Date.now()}"
                                 referrerpolicy="no-referrer-when-downgrade"
                                 style="max-width: min(400px, 100%); border-radius: 4px; margin: 8px 0;">`;
                        }
                        else if (url.match(/\.(mp3)$/i)) {
                            mediaTag = `<audio controls style="width: 100%; margin: 8px 0;" src="${url}"></audio>`;
                        }
                        else if (url.match(/\.(mp4|webm)$/i)) {
                            mediaTag = `<video controls style="max-width: 100%; border-radius: 8px; margin: 8px 0;" id="${media_id}" src="${url}"></video>`;
                        }
                        else if (url.match(/\.(m3u8)$/i)) {
                            mediaTag = `<video controls style="max-width: 100%; border-radius: 8px; margin: 8px 0;" 
                                id="${media_id}" 
                                data-hls-src="${url}"
                                data-hls-observer="pending"></video>`;
                        }
                        elements.push(mediaTag);
                        remaining = remaining.slice(match.index + url.length);
                    }
                    if (remaining) elements.push(`<div>${remaining}</div>`);
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
