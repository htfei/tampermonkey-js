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

    // 用户ID
    let userId = null;

    // 默认UI配置
    const DEFAULT_UI_CONFIG = {
        width: window.innerWidth <= 768 ? '100dvw' : '25dvw',
        height: '100dvh',
        position: { right: '0px', top: '0px' },
        bubblePosition: { right: '0px', bottom: '0px' },
        theme: {
            primary: '#8b5cf6',
            primaryLight: '#a78bfa',
            background: '#0a0a0a',
            surface: '#1a1a1a',
            surfaceLight: '#2a2a2a',
            text: '#e0e0e0',
            textSecondary: '#999999',
            border: '#4e4e4e',
            shadow: 'rgba(0, 0, 0, 0.8)'
        }
    };

    // 聊天室状态管理
    let chatRoomConfig = null;
    let containerInstance = null;
    let bubble = null;
    let messageArea = null;
    let inputContainer = null;
    let header = null;
    let isMinimized = false;
    let currentVideo = null;

    // 气泡拖拽状态
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

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
            //videoElement?.play();
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

        if (message.video_url) {
            const videoId = `${message.id}-video`;
            const downurl = `https://tools.thatwind.com/tool/m3u8downloader#m3u8=${message.video_url}&referer=${message.url}&filename=${message.content}`;
            elements.push(`<div style=" overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);">
                <video controls style="max-width: 100%; height: auto; display: block;" id="${videoId}" poster="${message.image_url}" src="${message.video_url}" data-hls-src="${message.video_url}"></video>
                <div style="display: flex; gap: 8px; padding: 8px; background: rgba(0, 0, 0, 0.1);">
                    <a href="${message.video_url}" target="_blank" rel="noopener noreferrer" style="flex: 1; padding: 6px 12px; background: rgba(18, 145, 249, 0.8); color: white; text-decoration: none; border-radius: 4px; text-align: center; font-size: 12px; transition: background 0.2s ease;">📺打开</a>
                    <a href="${downurl}" target="_blank" style="flex: 1; padding: 6px 12px; background: rgba(20, 223, 44, 0.8); color: white; text-decoration: none; border-radius: 4px; text-align: center; font-size: 12px; transition: background 0.2s ease;">⏬下载</a>
                    <a href="${message.url}" target="_blank" rel="noopener noreferrer" style="flex: 1; padding: 6px 12px; background: rgba(221, 232, 9, 0.79); color: white; text-decoration: none; border-radius: 4px; text-align: center; font-size: 12px; transition: background 0.2s ease;">🌍网址</a>
                    <a class="favorite-btn" data-message-id="${message.id}" style="flex: 1; padding: 6px 12px; background: rgba(243, 108, 30, 0.8); color: white; border: none; border-radius: 4px; text-align: center; font-size: 12px; cursor: pointer; transition: background 0.2s ease; user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;">${message.likes > 0 ? `🐳+${message.likes}` : '🐳给力'}</a>
                </div>
            </div>`);
        }

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
     * 初始化聊天室UI
     * @returns {Object} 聊天室实例
     */
    async function initUI() {
        userId = SbCLi.getUserId();
        GM_log('===用户ID===', userId);

        // 获取脚本配置
        const scriptConfig = await SbCLi.getScriptConfig();
        chatRoomConfig = {
            ...scriptConfig,
            CHAT_UI: {
                ...DEFAULT_UI_CONFIG
            }
        };

        // 注入样式
        injectStyles(chatRoomConfig.CHAT_UI);

        // 聊天窗口容器
        containerInstance = document.createElement('div');
        containerInstance.id = 'chat-container';
        Object.assign(containerInstance.style, {
            position: 'fixed',
            right: chatRoomConfig.CHAT_UI.position.right,
            top: chatRoomConfig.CHAT_UI.position.top,
            width: `${chatRoomConfig.CHAT_UI.width}`,
            height: `${chatRoomConfig.CHAT_UI.height}`,
            maxHeight: '100vh',
            minHeight: '30vh',
            maxWidth: '100vw',
            backgroundColor: 'var(--chat-bg)',
            borderRadius: '20px',
            boxShadow: '0 20px 60px var(--shadow-color), 0 0 1px rgba(255,255,255,0.1) inset',
            zIndex: 999998,
            display: 'none',
            flexDirection: 'column',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            boxSizing: 'border-box',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            // 移除默认的resize属性，只使用自定义的调整大小手柄
        });

        // 聊天窗口头部
        header = document.createElement('div');
        header.id = 'chat-header';
        header.innerHTML = `
            <div class="online-count">
                <span id="chat-title">${chatRoomConfig.name}</span>
                <span class="online-dot"></span>
                <span id="online-users"></span> 
            </div>
        `;
        header.style.padding = '10px 24px';
        header.style.cursor = 'grab'; // 设置初始光标样式为 grab，提示用户可以拖拽
        containerInstance.appendChild(header);

        // 初始化容器拖拽功能
        initContainerDrag();

        // 添加容器大小调整功能
        makeContainerResizable();

        // 最小化气泡
        bubble = document.createElement('div');
        bubble.id = 'chat-bubble';

        // 创建点击区域
        const bubbleContent = document.createElement('div');
        bubbleContent.id = 'chat-bubble-icon';
        bubbleContent.textContent = '📺';
        bubbleContent.style.width = '100%';
        bubbleContent.style.height = '100%';
        bubbleContent.style.display = 'flex';
        bubbleContent.style.alignItems = 'center';
        bubbleContent.style.justifyContent = 'center';
        bubbleContent.style.cursor = 'pointer';

        // 添加点击事件到内容区域
        bubbleContent.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMinimize();
        });

        bubble.appendChild(bubbleContent);

        Object.assign(bubble.style, {
            right: chatRoomConfig.CHAT_UI.bubblePosition.right,
            bottom: chatRoomConfig.CHAT_UI.bubblePosition.bottom,
            zIndex: '999999' // 提高z-index确保显示在最外层
        });
        // 添加show类确保气泡显示
        bubble.classList.add('show');

        // 添加拖拽功能
        makeBubbleDraggable();

        document.body.appendChild(bubble);

        // 创建消息区域
        messageArea = document.createElement('div');
        Object.assign(messageArea.style, {
            flex: 1,
            padding: '16px 6px', // 减小左右内边距，为视频留出更多宽度
            overflowY: 'auto',
            color: 'var(--chat-text)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        });
        messageArea.id = 'chat-messages';

        // 创建菜单按钮
        inputContainer = document.createElement('div');
        inputContainer.id = 'input-container';
        inputContainer.style.padding = '12px';
        inputContainer.style.borderTop = '1px solid var(--border-color)';
        inputContainer.style.boxSizing = 'border-box';
        inputContainer.style.background = 'var(--chat-surface)';
        inputContainer.style.position = 'relative';
        inputContainer.style.borderBottomLeftRadius = '20px';
        inputContainer.style.borderBottomRightRadius = '20px';

        // 根据feature_flags.menu决定是否创建菜单
        if (chatRoomConfig.feature_flags?.menu) {
            // 创建菜单按钮元素
            const menuButton = document.createElement('button');
            menuButton.textContent = '📋菜单';
            menuButton.style.width = '100%';
            menuButton.style.padding = '10px';
            menuButton.style.background = 'var(--chat-surface-light)';
            menuButton.style.color = 'var(--chat-text)';
            menuButton.style.border = '1px solid var(--border-color)';
            menuButton.style.borderRadius = '12px';
            menuButton.style.fontSize = '14px';
            menuButton.style.cursor = 'pointer';
            menuButton.style.transition = 'all 0.2s ease';
            menuButton.style.userSelect = 'none';

            // 添加悬停效果
            menuButton.addEventListener('mouseenter', () => {
                menuButton.style.background = 'var(--border-color)';
                menuButton.style.transform = 'scale(1.02)';
            });

            menuButton.addEventListener('mouseleave', () => {
                menuButton.style.background = 'var(--chat-surface-light)';
                menuButton.style.transform = 'scale(1)';
            });

            // 创建菜单卡片
            const menuCard = document.createElement('div');
            menuCard.id = 'menu-card';
            menuCard.style.position = 'absolute';
            menuCard.style.bottom = '100%';
            menuCard.style.left = '0';
            menuCard.style.width = '100%';
            menuCard.style.background = 'var(--chat-surface)';
            menuCard.style.border = '1px solid var(--border-color)';
            menuCard.style.borderRadius = '12px 12px 0 0';
            menuCard.style.boxShadow = '0 -4px 16px rgba(0, 0, 0, 0.3)';
            menuCard.style.zIndex = '1000000';
            menuCard.style.display = 'none';
            menuCard.style.animation = 'slideIn 0.3s ease-out';
            menuCard.style.padding = '12px';
            menuCard.style.boxSizing = 'border-box';

            // 添加菜单按钮组
            const menuButtonsContainer = document.createElement('div');
            menuButtonsContainer.style.display = 'flex';
            menuButtonsContainer.style.flexDirection = 'column';
            menuButtonsContainer.style.gap = '8px';

            function createMenuButton(text, onClick) {
                const button = document.createElement('button');
                button.textContent = text;
                button.style.padding = '10px';
                button.style.background = 'var(--chat-surface)';
                button.style.color = 'var(--chat-text)';
                button.style.border = '1px solid var(--border-color)';
                button.style.borderRadius = '8px';
                button.style.fontSize = '14px';
                button.style.cursor = 'pointer';
                button.style.transition = 'all 0.2s ease';
                button.style.userSelect = 'none';
                button.addEventListener('click', onClick);
                return button;
            }

            // 世界频道状态变量
            let isWorldChannelActive = false;

            // 消息和状态回调函数
            const messageCallback = (payload) => {
                console.log('收到消息:', payload);
                // 添加消息卡片
                if (payload.user_id != userId) addMsgCard(payload);
            };

            const presenceCallback = (onlineCount) => {
                console.log('当前在线用户数:', onlineCount);
                // 更新在线人数
                updateOnlineCount(onlineCount);
            };

            // 创建世界频道按钮 (根据world_channel标志)
            if (chatRoomConfig.feature_flags?.world_channel) {
                const worldButton = createMenuButton('📢世界频道', async () => {
                    if (!isWorldChannelActive) {
                        // 加入世界频道
                        await menuButtonOnClick(3, "all");
                        await SbCLi.setupRealtime(messageCallback, presenceCallback);
                        worldButton.textContent = '📢世界频道(已加入)';
                        updateTitle(chatRoomConfig.name + '📢世界频道');
                        isWorldChannelActive = true;
                    } else {
                        // 退出世界频道
                        await SbCLi.cleanup();
                        worldButton.textContent = '📢世界频道';
                        updateTitle(chatRoomConfig.name);
                        updateOnlineCount(0);
                        isWorldChannelActive = false;
                    }

                    // 关闭菜单
                    menuCard.style.display = 'none';
                });
                menuButtonsContainer.appendChild(worldButton);
            }

            async function menuButtonOnClick(count = 10, flag = userId) {
                console.log('浏览历史按钮被点击');
                let hisdata = await SbCLi.loadHistory(10, flag);
                if (hisdata?.length > 0) {
                    // console.log('有历史记录',hisdata);
                    // 清空消息区域
                    messageArea.innerHTML = '';
                    hisdata.reverse().forEach(msg => { addMsgCard(msg) });
                }
                else {
                    console.log('没有历史记录');
                    addMsgCard({ content: '没有历史记录' });
                }
                // 关闭菜单
                menuCard.style.display = 'none';
            }

            // 创建世界Top按钮 (根据world_top标志)
            if (chatRoomConfig.feature_flags?.world_top) {
                const worldTopButton = createMenuButton('🐳世界Top', async () => { menuButtonOnClick(10, "all_likes") });
                menuButtonsContainer.appendChild(worldTopButton);
            }

            // 创建我的最爱按钮 (根据my_likes标志)
            if (chatRoomConfig.feature_flags?.my_likes) {
                const top10Button = createMenuButton('💗我的最爱', async () => { menuButtonOnClick(10, "my_likes") });
                menuButtonsContainer.appendChild(top10Button);
            }

            // 创建浏览历史按钮 (根据my_history标志)
            if (chatRoomConfig.feature_flags?.my_history) {
                const historyButton = createMenuButton('📜我的历史', async () => { menuButtonOnClick(10) });
                menuButtonsContainer.appendChild(historyButton);
            }

            // 创建激活信息按钮 (根据activation_info标志)
            if (chatRoomConfig.feature_flags?.activation_info) {
                const myInfoButton = createMenuButton('👤激活信息', async () => {
                    console.log('我的信息按钮被点击');
                    // 关闭菜单
                    menuCard.style.display = 'none';
                    // 创建并显示我的信息卡片
                    showMyInfoCard();
                });
                menuButtonsContainer.appendChild(myInfoButton);
            }

            // 创建系统公告按钮 (根据system_announcement标志)
            if (chatRoomConfig.feature_flags?.system_announcement && chatRoomConfig.script_id) {
                const systemNoticeButton = createMenuButton('📢系统公告', async () => {
                    console.log('系统通知按钮被点击');
                    // 关闭菜单
                    menuCard.style.display = 'none';

                    // 清空消息区域并显示系统通知卡片
                    messageArea.innerHTML = '';
                    showSystemNoticeCard();
                });
                menuButtonsContainer.appendChild(systemNoticeButton);
            }

            // 将按钮容器添加到菜单卡片
            menuCard.appendChild(menuButtonsContainer);

            // 将菜单卡片添加到输入容器
            inputContainer.appendChild(menuCard);

            // 菜单按钮点击事件
            menuButton.addEventListener('click', () => {
                //console.log('菜单按钮被点击');
                // 切换菜单显示状态
                if (menuCard.style.display === 'none' || menuCard.style.display === '') {
                    menuCard.style.display = 'block';
                    //console.log('菜单已打开');
                } else {
                    menuCard.style.display = 'none';
                    //console.log('菜单已关闭');
                }
            });

            // 点击外部关闭菜单
            document.addEventListener('click', (e) => {
                if (!inputContainer.contains(e.target)) {
                    menuCard.style.display = 'none';
                }
            });

            // 将菜单按钮添加到输入容器
            inputContainer.appendChild(menuButton);
        }
        // 如果menu为false，不加载菜单栏

        containerInstance.append(messageArea, inputContainer);
        document.body.appendChild(containerInstance);

        // UI初始化后自动打开容器并加载我的信息
        toggleMinimize();
        //showMyInfoCard();

        // 显示系统通知卡片
        showSystemNoticeCard();

        return {
            containerInstance,
            bubble,
            messageArea,
            toggleMinimize,
            addMsgCard,
            updateOnlineCount
        };
    }

    /**
     * 显示系统通知卡片
     */
    function showSystemNoticeCard() {
        if (!messageArea || !chatRoomConfig.script_id) return;

        // 格式化更新时间
        const formattedDate = new Date(chatRoomConfig.updated_at).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        // 创建通知卡片
        const noticeCard = document.createElement('div');
        noticeCard.style.cssText = `
            background: linear-gradient(135deg, var(--chat-surface), var(--chat-surface-light));
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 16px;
            margin: 16px auto;
            max-width: 95%;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            animation: slideIn 0.4s ease-out forwards;
            opacity: 0;
            transform: translateY(-10px);
        `;

        // 最新公告HTML
        const latestNoticeHtml = chatRoomConfig.latest_notice ? `
            <div style="margin-bottom: 12px;">
                <h4 style="color: var(--chat-text); margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
                    <p style="color: var(--chat-text-secondary); font-size: 11px; margin: 4px 0 0 0;"> ${formattedDate}</p>
                </h4>
                <p style="color: var(--chat-text); margin: 0; font-size: 13px; line-height: 1.5;">${chatRoomConfig.latest_notice}</p>
            </div>
        ` : '';

        // 处理脚本描述显示（普通文本）
        const descriptionHtml = chatRoomConfig.description ? `
            <div style="margin-bottom: 12px;">
                <h4 style="color: var(--chat-text); margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">脚本描述</h4>
                <p style="color: var(--chat-text-secondary); margin: 0; font-size: 13px; line-height: 1.5;">${chatRoomConfig.description}</p>
            </div>
        ` : '';

        // 处理适用网站显示（转为超链接）
        const applicableSitesHtml = chatRoomConfig.applicable_sites && chatRoomConfig.applicable_sites.length > 0 ? `
            <div style="margin-bottom: 12px;">
                <h4 style="color: var(--chat-text); margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">最新网址</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${chatRoomConfig.applicable_sites.map(site => {
            // 检查是否为URL格式
            const isUrl = /^https?:\/\//i.test(site);
            if (isUrl) {
                return `<a href="${site}" target="_blank" rel="noopener noreferrer" style="background: var(--chat-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 4px 10px; font-size: 12px; color: var(--chat-text-secondary); text-decoration: none;">${site}</a>`;
            } else {
                return `<span style="background: var(--chat-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 4px 10px; font-size: 12px; color: var(--chat-text-secondary);">${site}</span>`;
            }
        }).join('')}
                </div>
            </div>
        ` : '';

        // 处理购买信息显示
        const purchaseHtml = chatRoomConfig.purchase_url ? `
                <a href="${chatRoomConfig.purchase_url}" target="_blank" rel="noopener noreferrer"
                   style="display: inline-block; padding: 6px 14px; background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
                          color: white; text-decoration: none; border-radius: 4px; font-size: 13px;">⚡️发电支持</a>
        ` : '';

        // 处理版本和脚本地址显示
        // 获取当前脚本版本
        const currentVersion = GM_info?.script?.version || '未知';
        // 比较当前版本和最新版本
        const isLatest = currentVersion === chatRoomConfig.version;
        const versionAndUrlHtml = !isLatest ? `
                <a href="${chatRoomConfig.url}" target="_blank" rel="noopener noreferrer"
                   style="display: inline-block; padding: 6px 14px; background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
                          color: white; text-decoration: none; border-radius: 4px; font-size: 13px;">🔥更新脚本</a>
        ` : '';

        // 卡片内容
        noticeCard.innerHTML = `
            <div style="margin-bottom: 12px;">
                <h3 style="color: var(--chat-text); margin: 0 0 8px 0; font-size: 16px;">📢 ${chatRoomConfig.name}系统公告</h3>
            </div>

            ${latestNoticeHtml}
            
            ${descriptionHtml}
            
            ${applicableSitesHtml}

            ${versionAndUrlHtml}
            ${purchaseHtml}
        `;

        // 添加到消息区域
        messageArea.appendChild(noticeCard);

        // 滚动到底部
        scrollToBottom();
    }

    /**
     * 切换最小化状态
     */
    function toggleMinimize() {
        // 计算当前状态
        const wasHidden = containerInstance.style.display === 'none' || containerInstance.style.display === '';

        // 直接切换容器的显示状态
        if (wasHidden) {
            containerInstance.style.display = 'flex';
            isMinimized = false;
        } else {
            containerInstance.style.display = 'none';
            isMinimized = true;
        }
        // 气泡始终显示
        bubble.style.display = 'flex';

        // 视频状态处理
        if (isMinimized) {
            // 最小化时，暂停当前播放的视频
            if (currentVideo) {
                currentVideo.pause();
            }
        }
        /*else {
            // 最大化时，恢复之前的视频播放状态
            if (currentVideo) {
                currentVideo.play().catch(err => console.error('恢复视频播放失败:', err));
            }
        }*/
    }

    /**
     * 添加消息卡片到聊天界面
     * @param {Object} message - 消息对象
     * @param {boolean} isOwn - 是否为自己发送的消息，可选，默认为false
     */
    function addMsgCard(message, isOwn = false) {
        if (!messageArea) {
            console.error('聊天室UI未初始化，请先调用 initUI()');
            return;
        }

        if (!message) {
            console.error('消息对象不能为空');
            return;
        }

        // 确保消息有必要的属性
        message = {
            id: message.id || Date.now(),
            user_id: message.user_id || userId,
            content: message.content || document.title,
            created_at: message.created_at || new Date().toISOString(),
            likes: message.likes || 0,
            like_list: message.like_list || [],
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

        messageArea.appendChild(msgElement);

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
                currentVideo = video;
            });

            // 监听视频结束事件
            video.addEventListener('ended', () => {
                if (currentVideo === video) {
                    currentVideo = null;
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

        // 为力赞按钮添加事件监听器
        msgElement.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                message.likes += 1;
                btn.textContent = `🐳+${message.likes}`;
                if (!message.like_list.includes(userId)) {
                    message.like_list.push(userId);
                }
                // 发送消息
                SbCLi.sendMessage(message);
            });
        });

        scrollToBottom();
    }

    /**
     * 滚动到底部
     */
    function scrollToBottom() {
        if (messageArea) {
            messageArea.scrollTo({
                top: messageArea.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    //更新容器标题
    function updateTitle(title) {
        const counter = document.getElementById('chat-title');
        if (counter) {
            counter.textContent = `${title}`;
        }
    }

    /**
     * 更新在线人数
     * @param {number} count - 在线人数
     */
    function updateOnlineCount(count) {
        const counter = document.getElementById('online-users');
        if (counter) {
            counter.textContent = count > 1 ? `${count} 人在线` : '';
            counter.style.fontWeight = count > 0 ? '600' : '400';
        }
    }

    /**
     * 显示我的信息卡片
     */
    async function showMyInfoCard() {
        if (!messageArea) {
            console.error('聊天室UI未初始化，请先调用 initUI()');
            return;
        }

        // 清空消息区域
        messageArea.innerHTML = '';

        // 解构赋值读取激活信息
        const { success, message, data } = GM_getValue('activation_info') || {};
        GM_log('用户激活信息:', { success, message, data });
        const isActive = success;
        const activationCode = data?.activation_code || null;

        // 创建信息卡片
        const infoCard = document.createElement('div');
        infoCard.style.padding = '16px';
        infoCard.style.background = 'var(--chat-surface)';
        infoCard.style.borderRadius = '12px';
        infoCard.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
        infoCard.style.margin = '20px auto';
        infoCard.style.maxWidth = '90%';
        infoCard.style.textAlign = 'center';
        infoCard.style.animation = 'fadeInUp 0.4s ease-out forwards';
        infoCard.style.opacity = '0';
        infoCard.style.transform = 'translateY(10px)';

        // 激活码HTML（仅当已激活时显示）
        const activationInfoHtml = activationCode ? `
            <div style="margin-bottom: 12px; padding: 10px; background: var(--chat-surface-light); border-radius: 8px;">
                <p style="color: var(--chat-text-secondary); font-size: 14px; margin: 0;">当前激活码</p>
                <p style="color: var(--chat-text); font-size: 16px; margin: 4px 0 0 0; word-break: break-all;">${activationCode}</p>
                <p style="color: var(--chat-text-secondary); font-size: 14px; margin: 0;">有效期</p>
                <p style="color: var(--chat-text); font-size: 16px; margin: 4px 0 0 0; word-break: break-all;">${data?.valid_for_days < 999 ? data?.valid_for_days + '天' : '永久'}</p>
                <p style="color: var(--chat-text-secondary); font-size: 14px; margin: 0;">首次激活时间</p>
                <p style="color: var(--chat-text); font-size: 16px; margin: 4px 0 0 0; word-break: break-all;">${new Date(data?.activated_at).toLocaleString()}</p>
            </div>
        ` : '';

        // 激活输入框HTML（仅当未激活时显示）
        const activationInputHtml = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <input type="text" id="activation-input" placeholder="请输入激活码" 
                           style="width: 100%; padding: 8px; box-sizing: border-box; background: var(--chat-bg); color: var(--chat-text); 
                                  border: 1px solid var(--border-color); border-radius: 4px; font-size: 14px;">
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <button id="activation-submit" 
                                style="padding: 8px 14px; background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%); 
                                       color: white; border: none; border-radius: 4px; font-size: 14px; 
                                       cursor: pointer; transition: all 0.2s ease;">激活</button>
                        <a href="${chatRoomConfig.purchase_url || '#'}" target="_blank" rel="noopener noreferrer" 
                           style="text-align: center; color: var(--primary-color); font-size: 13px; text-decoration: none;">获取激活码</a>
                    </div>
                </div>
                <div id="activation-message" style="color: #ff4d4f; font-size: 12px; margin-top: 8px;"></div>
        `;

        // 激活状态HTML
        const activationStatusHtml = `
            <div style="margin-bottom: 12px; padding: 10px; background: var(--chat-surface-light); border-radius: 8px;">
                <p style="color: var(--chat-text-secondary); font-size: 14px; margin: 0;">激活状态</p>
                <p style="color: ${isActive ? '#52c41a' : '#ff4d4f'}; font-size: 16px; margin: 4px 0 0 0;">
                    ${message ? message : '❌ 未激活'}
                </p>
                ${!isActive ? activationInputHtml : ''}
            </div>
        `;

        // 匿名信息
        const anonymousInfoHtml = `<div style="margin-bottom: 12px; padding: 10px; background: var(--chat-surface-light); border-radius: 8px;">
                <p style="color: var(--chat-text-secondary); font-size: 14px; margin: 0;">匿名ID</p>
                <p style="color: var(--chat-text); font-size: 12px; margin: 4px 0 0 0; word-break: break-all;">${userId}</p>
            </div>`;

        // 创建卡片内容
        infoCard.innerHTML = `
            <h3 style="color: var(--chat-text); margin-bottom: 16px; font-size: 18px;">👤 激活信息</h3>
            ${anonymousInfoHtml}
            ${activationStatusHtml}
            ${activationInfoHtml}
            <div style="margin-top: 20px; color: var(--chat-text-secondary); font-size: 12px;">
                <p>💡 提示：请勿泄露激活码，否则可能导致封禁</p>
            </div>
        `;

        // 添加到消息区域
        messageArea.appendChild(infoCard);

        // 绑定激活按钮事件（仅当未激活时）
        if (!isActive) {
            const input = infoCard.querySelector('#activation-input');
            const button = infoCard.querySelector('#activation-submit');
            const message = infoCard.querySelector('#activation-message');

            if (input && button && message) {
                // 处理激活
                const handleActivation = async () => {
                    const code = input.value.trim();
                    if (!code) {
                        message.textContent = '请输入激活码';
                        return;
                    }

                    // 禁用按钮，显示加载状态
                    button.disabled = true;
                    button.textContent = '激活中...';
                    button.style.opacity = '0.7';
                    message.textContent = '';

                    try {
                        // 调用激活验证
                        const result = await SbCLi.verifyActivation(code);

                        if (result.success) {
                            // 激活成功
                            message.textContent = result.message;
                            message.style.color = '#52c41a';

                            // 刷新页面
                            setTimeout(() => { showMyInfoCard(); }, 1000);
                        } else {
                            // 激活失败
                            message.textContent = result.message;
                            message.style.color = '#ff4d4f';
                            button.disabled = false;
                            button.textContent = '激活';
                            button.style.opacity = '1';
                        }
                    } catch (error) {
                        // 异常处理
                        message.textContent = error.message || '激活失败，请稍后重试';
                        message.style.color = '#ff4d4f';
                        button.disabled = false;
                        button.textContent = '激活';
                        button.style.opacity = '1';
                    }
                };

                // 绑定按钮点击事件
                button.addEventListener('click', handleActivation);

                // 绑定回车事件
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        handleActivation();
                    }
                });
            }
        }
    }

    /**
     * 使气泡可拖拽
     */
    function makeBubbleDraggable() {
        // 绑定事件
        bubble.addEventListener('mousedown', (e) => startDrag(e));
        bubble.addEventListener('touchstart', (e) => {
            // 不要在这里调用preventDefault()，以免阻止点击事件
            startDrag(e.touches[0]);
        });

        document.addEventListener('mousemove', (e) => drag(e));
        document.addEventListener('touchmove', (e) => {
            // 只在拖拽过程中调用preventDefault()，防止页面滚动
            if (isDragging) {
                e.preventDefault();
            }
            drag(e.touches[0]);
        }, { passive: false });

        document.addEventListener('mouseup', (e) => stopDrag(e));
        document.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            if (touch) {
                stopDrag(touch);
            } else {
                stopDrag(e);
            }
        });
    }

    /**
     * 开始拖动
     * @param {MouseEvent|Touch} e - 鼠标或触摸事件
     */
    function startDrag(e) {
        // 只有在气泡可见时才能拖拽
        if (bubble.style.display === 'none') return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        // 获取初始位置
        const rect = bubble.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        // 改变光标样式
        bubble.style.cursor = 'grabbing';
        // 添加拖拽时的视觉效果
        bubble.style.transform = 'scale(1.05)';
        bubble.style.transition = 'transform 0.1s ease';
    }

    /**
     * 拖动过程
     * @param {MouseEvent|Touch} e - 鼠标或触摸事件
     */
    function drag(e) {
        if (!isDragging) return;

        // 计算位移
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // 计算新位置
        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        // 限制在可视区域内
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const bubbleWidth = bubble.offsetWidth;
        const bubbleHeight = bubble.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, windowWidth - bubbleWidth));
        newTop = Math.max(0, Math.min(newTop, windowHeight - bubbleHeight));

        // 更新位置
        bubble.style.left = `${newLeft}px`;
        bubble.style.top = `${newTop}px`;
        // 清除原来的right和bottom样式
        bubble.style.right = 'auto';
        bubble.style.bottom = 'auto';
    }

    /**
     * 结束拖动
     * @param {MouseEvent|Touch} e - 鼠标或触摸事件
     */
    function stopDrag(e) {
        if (isDragging) {
            // 恢复样式
            isDragging = false;
            bubble.style.cursor = 'pointer';
            bubble.style.zIndex = '999999'; // 保持最高层级
            bubble.style.transform = 'scale(1)';
            bubble.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }
    }

    /**
     * 初始化容器拖拽功能
     */
    function initContainerDrag() {
        containerInstance.isDragging = false;
        containerInstance.isDragAction = false;
        containerInstance.startX = 0;
        containerInstance.startY = 0;
        containerInstance.initialLeft = 0;
        containerInstance.initialTop = 0;
        containerInstance.dragHandle = header;

        // 绑定事件 - 参考悬浮UI库的实现
        containerInstance.dragHandle.addEventListener('mousedown', (e) => startContainerDrag(e));
        containerInstance.dragHandle.addEventListener('touchstart', (e) => startContainerDrag(e), { passive: false });

        document.addEventListener('mousemove', (e) => dragContainer(e));
        document.addEventListener('touchmove', (e) => dragContainer(e), { passive: false });

        document.addEventListener('mouseup', (e) => stopContainerDrag(e));
        document.addEventListener('touchend', (e) => stopContainerDrag(e));

        // 防止拖拽时触发点击事件
        containerInstance.dragHandle.addEventListener('click', (e) => {
            if (containerInstance.isDragAction) {
                containerInstance.isDragAction = false;
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
        });
    }

    /**
     * 添加容器大小调整功能
     */
    function makeContainerResizable() {
        // 创建调整大小的手柄
        const resizeHandle = document.createElement('div');
        resizeHandle.id = 'chat-resize-handle';
        Object.assign(resizeHandle.style, {
            position: 'absolute',
            left: '5px',
            bottom: '5px',
            width: '12px',
            height: '12px',
            background: '#3b82f6',
            borderRadius: '50%',
            cursor: 'nesw-resize',
            zIndex: '1000000',
            opacity: '0.9',
            transition: 'all 0.2s ease'
        });
        containerInstance.appendChild(resizeHandle);

        // 调整大小的状态变量
        let isResizing = false;
        let startX = 0;
        let startY = 0;
        let startWidth = 0;
        let startHeight = 0;

        // 获取事件坐标
        const getEventCoords = (e) => {
            return {
                x: e.touches ? e.touches[0].clientX : e.clientX,
                y: e.touches ? e.touches[0].clientY : e.clientY
            };
        };

        // 手柄悬停效果
        resizeHandle.addEventListener('mouseenter', () => {
            resizeHandle.style.opacity = '1';
            resizeHandle.style.transform = 'scale(1.2)';
            resizeHandle.style.background = '#1d4ed8';
        });

        resizeHandle.addEventListener('mouseleave', () => {
            if (!isResizing) {
                resizeHandle.style.opacity = '0.9';
                resizeHandle.style.transform = 'scale(1)';
                resizeHandle.style.background = '#3b82f6';
            }
        });

        // 开始调整大小
        const startResize = (e) => {
            isResizing = true;
            const coords = getEventCoords(e);
            startX = coords.x;
            startY = coords.y;
            startWidth = containerInstance.offsetWidth;
            startHeight = containerInstance.offsetHeight;

            // 阻止默认行为和冒泡
            e.preventDefault();
            e.stopPropagation();

            // 添加视觉反馈
            containerInstance.style.zIndex = '999999';
            resizeHandle.style.opacity = '1';
            resizeHandle.style.transform = 'scale(1.3)';
            resizeHandle.style.background = '#1d4ed8';
        };

        // 调整大小
        const resize = (e) => {
            if (!isResizing) return;

            // 阻止默认行为，避免页面滚动
            e.preventDefault();

            // 计算新的尺寸
            const coords = getEventCoords(e);
            const deltaX = coords.x - startX;
            const deltaY = coords.y - startY;

            // 限制最小和最大尺寸，适配手机端
            const isMobile = window.innerWidth <= 768;
            const minWidth = isMobile ? Math.floor(window.innerWidth * 0.6) : 360;
            const minHeight = isMobile ? 300 : 400;
            const maxWidth = window.innerWidth;
            const maxHeight = window.innerHeight;

            // 因为手柄在左下角，所以需要反转deltaX的符号
            // 向右拖动应该使宽度减少，向左拖动应该使宽度增加
            let newWidth = Math.max(minWidth, Math.min(startWidth - deltaX, maxWidth));
            let newHeight = Math.max(minHeight, Math.min(startHeight + deltaY, maxHeight));

            // 更新容器尺寸
            containerInstance.style.width = `${newWidth}px`;
            containerInstance.style.height = `${newHeight}px`;
        };

        // 结束调整大小
        const stopResize = () => {
            if (isResizing) {
                isResizing = false;
                resizeHandle.style.opacity = '0.9';
                resizeHandle.style.transform = 'scale(1)';
                resizeHandle.style.background = '#3b82f6';
                containerInstance.style.zIndex = '999998';
            }
        };

        // 鼠标事件
        resizeHandle.addEventListener('mousedown', startResize);
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('mouseleave', stopResize);

        // 触摸事件（手机端支持）
        resizeHandle.addEventListener('touchstart', startResize, { passive: false });
        document.addEventListener('touchmove', resize, { passive: false });
        document.addEventListener('touchend', stopResize);
        document.addEventListener('touchcancel', stopResize);
    }

    /**
     * 开始容器拖动
     * @param {MouseEvent|Touch} e - 鼠标或触摸事件
     */
    function startContainerDrag(e) {
        // 只有在容器可见时才能拖拽
        if (containerInstance.style.display === 'none') return;

        // 处理触摸事件对象
        const event = e.touches ? e.touches[0] : e;

        // 阻止默认行为和冒泡
        e.preventDefault();
        e.stopPropagation();

        containerInstance.isDragging = true;
        containerInstance.startX = event.clientX;
        containerInstance.startY = event.clientY;

        // 获取初始位置
        const rect = containerInstance.getBoundingClientRect();
        containerInstance.initialLeft = rect.left;
        containerInstance.initialTop = rect.top;

        // 改变光标样式
        containerInstance.dragHandle.style.cursor = 'grabbing';
        // 提高z-index，确保拖拽时在最上层
        containerInstance.style.zIndex = '999999';

        // 添加拖拽时的视觉效果
        containerInstance.style.transform = 'scale(1.01)';
        containerInstance.style.transition = 'transform 0.1s ease';
    }

    /**
     * 拖动容器
     * @param {MouseEvent|Touch} e - 鼠标或触摸事件
     */
    function dragContainer(e) {
        if (!containerInstance.isDragging) return;

        // 处理触摸事件对象
        const event = e.touches ? e.touches[0] : e;

        // 计算位移
        const dx = event.clientX - containerInstance.startX;
        const dy = event.clientY - containerInstance.startY;

        // 计算新位置
        let newLeft = containerInstance.initialLeft + dx;
        let newTop = containerInstance.initialTop + dy;

        // 限制在可视区域内
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const containerWidth = containerInstance.offsetWidth;
        const containerHeight = containerInstance.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, windowWidth - containerWidth));
        newTop = Math.max(0, Math.min(newTop, windowHeight - containerHeight));

        // 更新位置
        containerInstance.style.left = `${newLeft}px`;
        containerInstance.style.top = `${newTop}px`;
        // 清除原来的right和bottom样式
        containerInstance.style.right = 'auto';
        containerInstance.style.bottom = 'auto';
    }

    /**
     * 结束容器拖动
     * @param {MouseEvent|Touch} e - 鼠标或触摸事件
     */
    function stopContainerDrag(e) {
        if (containerInstance.isDragging) {
            // 计算拖拽距离
            const event = e.touches ? e.changedTouches[0] : e;
            const dx = Math.abs(event.clientX - containerInstance.startX);
            const dy = Math.abs(event.clientY - containerInstance.startY);
            // 判断是否为拖拽操作
            containerInstance.isDragAction = dx > 5 || dy > 5;

            // 恢复样式
            containerInstance.isDragging = false;
            containerInstance.dragHandle.style.cursor = 'grab';
            containerInstance.style.zIndex = '999998'; // 恢复原来的z-index
            containerInstance.style.transform = 'scale(1)';
            containerInstance.style.transition = 'transform 0.1s ease';
        }
    }



    /**
     * 库的公共 API
     */
    return {
        VERSION,
        initUI,
        addMsgCard,
        updateOnlineCount
    };
})();