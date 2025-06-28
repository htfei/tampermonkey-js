// ==UserScript==
// @name         在线网页聊天室
// @namespace    http://tampermonkey.net/
// @version      3.3
// @description  Supabase realtime chat 基于Supabase的跨网页聊天室（优化版）
// @match        https://www.guozaoke.com/*
// @match        https://juejin.cn/*
// @match        https://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @connect      supabase.co
// @require      https://unpkg.com/@supabase/supabase-js@2.49.3/dist/umd/supabase.js
// ==/UserScript==

(function() {
    'use strict';

    // 配置参数
    const CONFIG = {
        SUPABASE_URL: 'https://icaugjyuwenraxxgwvzf.supabase.co',
        SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYXVnanl1d2VucmF4eGd3dnpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4ODcwNjcsImV4cCI6MjA1ODQ2MzA2N30.-IsrU3_NyoqDxFeNH1l2d6SgVv9pPA0uIVEA44FmuSQ',
        CHAT_UI: {
            width: 320,
            height: 420,
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
                scrollbar-width: thin;
                scrollbar-color: #5c5c5c #2d2d2d;
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

    // 用户管理模块
    const UserManager = {
        getOrCreateId: () => {
            const USER_NAME = document.querySelector("div.username")?.innerText;
            if(USER_NAME){
                GM_setValue('chat_user_id', USER_NAME);
                return USER_NAME;
            }
            let userId = GM_getValue('chat_user_id');
            if (!userId) {
                userId = USER_NAME || `user_${crypto.randomUUID().slice(0, 8)}`;
                GM_setValue('chat_user_id', userId);
            }
            return userId;
        }
    };

    // 聊天室核心功能
    class ChatRoom {
        constructor(supabase) {
            this.supabase = supabase;
            this.userId = UserManager.getOrCreateId();
            this.lastSendTime = 0;
            this.initUI();
            this.setupRealtime();
            this.loadHistory();
            this.loadUserInfo();
        }

        initUI() {
            this.container = document.createElement('div');
            this.container.id = 'chat-container';
            Object.assign(this.container.style, {
                position: 'fixed',
                right: CONFIG.CHAT_UI.position.right,
                bottom: CONFIG.CHAT_UI.position.bottom,
                width: `${CONFIG.CHAT_UI.width}px`,
                height: `${CONFIG.CHAT_UI.height}px`,
                backgroundColor: 'var(--chat-bg)',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                zIndex: 9999
            });

            this.messageArea = this.createMessageArea();
            this.input = this.createInput();
            this.sendButton = this.createButton();

            this.container.append(this.messageArea, this.input, this.sendButton);
            document.body.appendChild(this.container);
        }

        createMessageArea() {
            const div = document.createElement('div');
            Object.assign(div.style, {
                height: '320px',
                padding: '16px',
                overflowY: 'auto',
                color: 'var(--chat-text)'
            });
            div.id = 'chat-messages';
            return div;
        }

        createInput() {
            const input = document.createElement('textarea');
            Object.assign(input.style, {
                width: 'calc(100% - 32px)',
                height: '40px',
                margin: '8px 16px',
                padding: '8px 12px',
                backgroundColor: 'var(--input-bg)',
                border: '1px solid #3A3A3A',
                borderRadius: '8px',
                color: 'var(--chat-text)',
                resize: 'none'
            });
            input.placeholder = '输入消息（Ctrl + Enter 发送）';
            return input;
        }

        createButton() {
            const button = document.createElement('button');
            Object.assign(button.style, {
                position: 'absolute',
                right: '16px',
                bottom: '16px',
                padding: '8px 20px',
                backgroundColor: 'var(--primary-color)',
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
            });
            button.textContent = '发送';
            return button;
        }

        async setupRealtime() {
            this.channel = this.supabase.channel(location.host) //'realtime-chat
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                }, payload => this.addMessage(payload.new))
                .subscribe();
        }

        addMessage(message) {
            //if (message.domain !== location.host) return; // 过滤非法消息
            const isOwn = message.user_id === this.userId;
            const msgElement = document.createElement('div');
            msgElement.innerHTML = `
                <div style="margin: 8px 0; padding: 12px;
                    background: ${isOwn ? 'var(--primary-color)' : '#2D2D2D'};
                    border-radius: 8px;
                    color: ${isOwn ? '#FFF' : 'var(--chat-text)'};
                    animation: fadeIn 0.3s ease;">
                    <div style="font-weight: 500;">${message.user_id}</div>
                    <div>${message.content}</div>
                </div>
            `;
            this.messageArea.appendChild(msgElement);
            this.scrollToBottom();
        }

        scrollToBottom() {
            this.messageArea.scrollTo({
                top: this.messageArea.scrollHeight,
                behavior: 'smooth'
            });
        }

        async loadHistory() {
            const { data } = await this.supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            const fragment = document.createDocumentFragment();
            data.reverse().forEach(msg => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <div style="margin: 8px 0; padding: 12px;
                        background: #2D2D2D;
                        border-radius: 8px;
                        color: var(--chat-text);">
                        <div style="font-weight: 500;">${msg.user_id}</div>
                        <div>${msg.content}</div>
                    </div>
                `;
                fragment.appendChild(div);
            });
            this.messageArea.appendChild(fragment);
            this.scrollToBottom();
        }

        bindEvents() {
            this.sendButton.addEventListener('click', () => this.sendMessage());
            this.input.addEventListener('keydown', e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    this.sendMessage();
                    e.preventDefault();
                }
            });
        }

        async sendMessage() {
            const content = this.input.value.trim();
            if (!content) return;

            // 防刷机制（3秒间隔）
            if (Date.now() - this.lastSendTime < 3000) {
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
                }
            } catch (error) {
                console.error('消息发送失败:', error);
            }
        }

        async loadUserInfo() {
            /*
            //rls已启用，不可读
            const { data, error } = await this.supabase
                .from('user_config')
                .select('data')
                .eq('user_id', this.userId)
                .single();
            console.log('加载用户信息:',this.userId, error ? null : data);
            */
            let userInfo = GM_getValue('chat_user_info');
            if (!userInfo) {
                // 基础环境信息（同步获取）
                userInfo = {
                    browser: {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                        vendor: navigator.vendor,
                        cookiesEnabled: navigator.cookieEnabled,
                        language: navigator.language,
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    },
                    hardware: {
                        screen: {
                            width: screen.width,
                            height: screen.height,
                            colorDepth: screen.colorDepth,
                            orientation: screen.orientation?.type
                        },
                        deviceMemory: navigator.deviceMemory || 'unknown',
                        concurrency: navigator.hardwareConcurrency
                    }
                };
                GM_setValue('chat_user_info', userInfo);
                const { error } = await this.supabase
                .from('user_config')
                .upsert({ user_id: this.userId, data: userInfo });
                if (error) {
                    console.error('保存用户信息失败:', error);
                } else {
                    console.log('保存用户信息成功');
                }
            }
            return userInfo;
        }
    }

    // 主初始化流程
    (async () => {
        StyleManager.inject();

        const checkInitialization = setInterval(async () => {
            if (window.supabase) {
                clearInterval(checkInitialization);
                const client = await SupabaseClient.initialize();
                new ChatRoom(client).bindEvents();
            }
        }, 500);
    })();
})();