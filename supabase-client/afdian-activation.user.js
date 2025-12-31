// ==UserScript==
// @name         爱发电激活码验证脚本
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  使用爱发电激活码验证，支持设备绑定（最多3台）
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @connect      supabase.co
// @require      https://unpkg.com/@supabase/supabase-js@2.49.3/dist/umd/supabase.js
// ==/UserScript==

/**
 * 爱发电激活码验证脚本
 * 功能：
 * 1. 自动生成设备标识
 * 2. Supabase匿名登录
 * 3. 激活码验证（通过Supabase云函数）
 * 4. 设备绑定管理（最多3台设备）
 * 5. 美观的激活界面
 * 6. 完整的错误处理
 */

(function() {
    'use strict';

    /**
     * 配置模块
     * 包含脚本所需的所有配置信息
     */
    const Config = {
        // Supabase配置
        SUPABASE_URL: 'https://icaugjyuwenraxxgwvzf.supabase.co', // 替换为你的Supabase URL
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYXVnanl1d2VucmF4eGd3dnpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4ODcwNjcsImV4cCI6MjA1ODQ2MzA2N30.-IsrU3_NyoqDxFeNH1l2d6SgVv9pPA0uIVEA44FmuSQ', // 替换为你的Supabase匿名密钥
        
        // 脚本标识（唯一识别你的脚本）
        SCRIPT_ID: 'afdian-activation-demo',
        
        // Supabase云函数端点
        VERIFY_ENDPOINT: 'https://icaugjyuwenraxxgwvzf.supabase.co/functions/v1/verify-activation', // 替换为你的云函数URL
        
        // 调试模式
        DEBUG: true
    };

    /**
     * 设备标识模块
     * 生成和管理设备唯一标识
     */
    class DeviceManager {
        /**
         * 获取设备唯一标识
         * @returns {string} 设备ID
         */
        static getDeviceId() {
            let deviceId = GM_getValue('device_id');
            if (!deviceId) {
                // 生成新的设备ID
                deviceId = this.generateDeviceId();
                GM_setValue('device_id', deviceId);
                if (Config.DEBUG) console.log('生成新设备ID:', deviceId);
            }
            return deviceId;
        }

        /**
         * 生成设备唯一标识
         * @returns {string} 设备ID
         */
        static generateDeviceId() {
            // 使用crypto.randomUUID生成唯一ID
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                return crypto.randomUUID();
            }
            // 兼容旧浏览器,
            return 'uuid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
        }
    }

    /**
     * Supabase客户端模块
     * 管理Supabase连接和认证
     */
    class SupabaseManager {
        constructor() {
            this.client = null;
            this.userId = null;
        }

        /**
         * 初始化Supabase客户端
         * @returns {Promise<void>}
         */
        async init() {
            try {
                // 创建Supabase客户端，使用GM_xmlhttpRequest处理跨域
                this.client = supabase.createClient(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY,                     {
                        realtime: { params: { eventsPerSecond: 10 } }
                    });

                // 匿名登录
                // await this.signInAnonymously();
                if (Config.DEBUG) console.log('Supabase初始化成功');
            } catch (error) {
                console.error('Supabase初始化失败:', error);
                throw error;
            }
        }

        /**
         * 初始化用户：检查登录状态，若无则匿名登录
         * @returns {Promise<void>}
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
                    const { data, error } = await this.client.auth.signInAnonymously({                       
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
                
                    if (error) throw error;
                    this.userId = data.session.user.id;
                    GM_setValue('user_id', this.userId);
                    if (Config.DEBUG) console.log('===注册匿名用户===', data, error);
                }
            } catch (error) {
                console.error('匿名登录失败:', error);
                throw error;
            }
        }

        /**
         * 获取当前用户ID
         * @returns {Promise<string|null>}
         */
        async getUserId() {
            try {
                const { data: { user } } = await this.client.auth.getUser();
                return user?.id || null;
            } catch (error) {
                console.error('获取用户ID失败:', error);
                return null;
            }
        }

        /**
         * 获取Supabase客户端实例
         * @returns {object|null} Supabase客户端实例
         */
        getClient() {
            return this.client;
        }
    }

    /**
     * 激活管理模块
     * 处理激活码验证和状态管理
     */
    class ActivationManager {
        constructor(supabaseManager) {
            this.supabaseManager = supabaseManager;
        }

        /**
         * 验证激活码
         * @param {string} code - 激活码
         * @returns {Promise<{success: boolean, message: string}>} 验证结果
         */
        async verifyActivation(code) {
            try {
                const deviceId = DeviceManager.getDeviceId();
                const userId = await this.supabaseManager.getUserId();
                const { data, error } = await this.supabaseManager.getClient().functions.invoke('verify-activation', {
                body: { 
                    code,
                    device_id: deviceId,
                    script_id: Config.SCRIPT_ID,
                    user_id: userId
                 },
                });
                if (error) throw error;
                return { success: true, message: '激活成功', data };

            } catch (error) {
                console.error('验证激活码失败:', error);
                return { success: false, message: error.message || '激活失败，请稍后重试' };
            }
        }

        /**
         * 检查激活状态
         * @returns {boolean} 激活状态
         */
        checkActivationStatus() {
            const status = GM_getValue('activation_status');
            return status === 'active';
        }

        /**
         * 设置激活状态
         * @param {boolean} isActive - 是否激活
         * @param {string} [code] - 激活码（可选）
         */
        setActivationStatus(isActive, code = '') {
            GM_setValue('activation_status', isActive ? 'active' : 'inactive');
            if (code) {
                GM_setValue('activation_code', code);
            }
        }

        /**
         * 获取已存储的激活码
         * @returns {string} 激活码
         */
        getStoredActivationCode() {
            return GM_getValue('activation_code', '');
        }
    }

    /**
     * UI模块
     * 管理激活界面的渲染和交互
     */
    class UIManager {
        constructor(activationManager) {
            this.activationManager = activationManager;
        }

        /**
         * 渲染激活界面
         */
        renderActivationUI() {
            // 检查是否已存在激活界面
            if (document.getElementById('afdian-activation-ui')) {
                return;
            }

            // 创建容器
            const container = document.createElement('div');
            container.id = 'afdian-activation-ui';
            container.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 24px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                width: 90%;
                max-width: 400px;
                box-sizing: border-box;
            `;

            // 添加样式
            this.addGlobalStyles();

            // 标题
            const title = document.createElement('h2');
            title.textContent = '激活脚本';
            title.style.cssText = 'margin: 0 0 20px 0; font-size: 20px; color: #333; font-weight: 600; text-align: center;';
            container.appendChild(title);

            // 输入框包装器
            const inputWrapper = document.createElement('div');
            inputWrapper.style.cssText = 'margin-bottom: 20px;';
            container.appendChild(inputWrapper);

            // 输入框
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = '请输入激活码';
            input.id = 'afdian-activation-code-input';
            input.style.cssText = `
                width: 100%;
                padding: 12px;
                border: 1px solid #d9d9d9;
                border-radius: 8px;
                font-size: 16px;
                box-sizing: border-box;
                transition: all 0.3s ease;
                outline: none;
            `;
            
            // 输入框事件监听
            input.addEventListener('focus', () => {
                input.style.borderColor = '#1890ff';
                input.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
            });
            input.addEventListener('blur', () => {
                input.style.borderColor = '#d9d9d9';
                input.style.boxShadow = 'none';
            });
            inputWrapper.appendChild(input);

            // 按钮
            const button = document.createElement('button');
            button.textContent = '激活';
            button.id = 'afdian-activation-submit';
            button.style.cssText = `
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                outline: none;
            `;
            
            // 按钮事件监听
            button.addEventListener('mouseenter', () => {
                button.style.background = 'linear-gradient(135deg, #40a9ff 0%, #1890ff 100%)';
                button.style.transform = 'translateY(-1px)';
                button.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.3)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.background = 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)';
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = 'none';
            });
            button.addEventListener('mousedown', () => {
                button.style.transform = 'translateY(1px)';
            });
            button.addEventListener('mouseup', () => {
                button.style.transform = 'translateY(0)';
            });
            container.appendChild(button);

            // 消息提示
            const message = document.createElement('div');
            message.id = 'afdian-activation-message';
            message.style.cssText = 'margin-top: 16px; font-size: 14px; color: #ff4d4f; text-align: center; min-height: 20px;';
            container.appendChild(message);

            // 关闭按钮
            const closeButton = document.createElement('button');
            closeButton.textContent = '×';
            closeButton.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                width: 24px;
                height: 24px;
                border: none;
                background: #f5f5f5;
                color: #666;
                border-radius: 50%;
                font-size: 18px;
                line-height: 1;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            closeButton.addEventListener('mouseenter', () => {
                closeButton.style.background = '#ff4d4f';
                closeButton.style.color = 'white';
            });
            closeButton.addEventListener('mouseleave', () => {
                closeButton.style.background = '#f5f5f5';
                closeButton.style.color = '#666';
            });
            closeButton.addEventListener('click', () => {
                container.remove();
            });
            container.appendChild(closeButton);

            // 激活按钮点击事件
            button.addEventListener('click', async () => {
                await this.handleActivation(input, button, message);
            });

            // 回车事件
            input.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    await this.handleActivation(input, button, message);
                }
            });

            // 添加到页面
            document.body.appendChild(container);
        }

        /**
         * 处理激活请求
         * @param {HTMLInputElement} input - 输入框元素
         * @param {HTMLButtonElement} button - 按钮元素
         * @param {HTMLDivElement} message - 消息元素
         */
        async handleActivation(input, button, message) {
            const code = input.value.trim();
            if (!code) {
                message.textContent = '请输入激活码';
                message.style.color = '#ff4d4f';
                return;
            }

            // 禁用按钮，显示加载状态
            button.disabled = true;
            button.textContent = '激活中...';
            button.style.opacity = '0.7';
            message.textContent = '';

            try {
                // 调用激活验证
                const result = await this.activationManager.verifyActivation(code);
                
                if (result.success) {
                    // 激活成功
                    message.textContent = result.message;
                    message.style.color = '#52c41a';
                    this.activationManager.setActivationStatus(true, code);
                    
                    // 3秒后关闭界面
                    setTimeout(() => {
                        const container = document.getElementById('afdian-activation-ui');
                        if (container) {
                            container.remove();
                        }
                    }, 1500);
                } else {
                    // 激活失败
                    message.textContent = result.message;
                    message.style.color = '#ff4d4f';
                }
            } catch (error) {
                // 异常处理
                message.textContent = error.message || '激活失败，请稍后重试';
                message.style.color = '#ff4d4f';
            } finally {
                // 恢复按钮状态
                button.disabled = false;
                button.textContent = '激活';
                button.style.opacity = '1';
            }
        }

        /**
         * 添加全局样式
         */
        addGlobalStyles() {
            // 检查是否已添加样式
            if (document.getElementById('afdian-activation-styles')) {
                return;
            }

            const style = document.createElement('style');
            style.id = 'afdian-activation-styles';
            style.textContent = `
                #afdian-activation-ui {
                    animation: afdian-fade-in 0.3s ease;
                }
                
                @keyframes afdian-fade-in {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
                
                #afdian-activation-ui input {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                #afdian-activation-ui button {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
            `;
            
            document.head.appendChild(style);
        }
    }

    /**
     * 主应用类
     * 协调各个模块的工作
     */
    class App {
        constructor() {
            this.supabaseManager = null;
            this.activationManager = null;
            this.uiManager = null;
        }

        /**
         * 初始化应用
         */
        async init() {
            try {
                // 初始化Supabase客户端
                this.supabaseManager = new SupabaseManager();
                await this.supabaseManager.init();

                // 读取or注册匿名用户
                await this.supabaseManager.initializeUser();

                // 初始化激活管理
                this.activationManager = new ActivationManager(this.supabaseManager);

                // 初始化UI管理
                this.uiManager = new UIManager(this.activationManager);

                // 检查激活状态
                this.checkActivation();

                if (Config.DEBUG) console.log('应用初始化成功');
            } catch (error) {
                console.error('应用初始化失败:', error);
                // 即使初始化失败，也显示激活界面
                this.uiManager = new UIManager(new ActivationManager(null));
                this.uiManager.renderActivationUI();
            }
        }

        /**
         * 检查激活状态
         */
        checkActivation() {
            const isActive = this.activationManager.checkActivationStatus();
            if (!isActive) {
                // 未激活，显示激活界面
                this.uiManager.renderActivationUI();
            }
        }
    }

    // 初始化应用
    const app = new App();
    app.init();

})();
