/**
 * Supabase 聊天客户端库
 * 功能：
 * 1. Supabase 客户端初始化与管理
 * 2. 匿名用户认证
 * 3. 实时通信与消息管理
 * 
 * 使用方法：
 * 1. 在油猴脚本中引入该库
 * 2. 使用 SbCLi.init() 初始化
 * 3. 使用提供的方法进行聊天操作
 */

const SbCLi = (function() {
    'use strict';

    // 库版本
    const VERSION = '1.0';
    
    // 默认配置
    const CONFIG = {
        SUPABASE_URL: 'https://icaugjyuwenraxxgwvzf.supabase.co',
        SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYXVnanl1d2VucmF4eGd3dnpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4ODcwNjcsImV4cCI6MjA1ODQ2MzA2N30.-IsrU3_NyoqDxFeNH1l2d6SgVv9pPA0uIVEA44FmuSQ',
        SUPABASE_AUTH_TOKEN: 'sb-icaugjyuwenraxxgwvzf-auth-token',
        // 激活码相关配置
        ACTIVATION: {
            SCRIPT_ID: 'script_id',
            VERIFY_ENDPOINT: `https://icaugjyuwenraxxgwvzf.supabase.co/functions/v1/activate_script`
        }
    };
    
    // 内部状态管理
    let supabaseClient = null;
    let userId = null;
    let messageChannel = null;
    let activation_info = null;
    let scriptConfig = null;
    
    // GM函数兼容性处理
    const GM = {
        // 检查是否支持GM函数
        isSupported: typeof GM_getValue !== 'undefined' && typeof GM_setValue !== 'undefined',
        
        // GM_getValue兼容实现
        getValue: function(key, defaultValue) {
            if (GM.isSupported) {
                return GM_getValue(key, defaultValue);
            } else {
                // Safari兼容：使用localStorage
                try {
                    const value = localStorage.getItem(key);
                    return value ? JSON.parse(value) : defaultValue;
                } catch (e) {
                    console.error('localStorage getValue error:', e);
                    return defaultValue;
                }
            }
        },
        
        // GM_setValue兼容实现
        setValue: function(key, value) {
            if (GM.isSupported) {
                return GM_setValue(key, value);
            } else {
                // Safari兼容：使用localStorage
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                } catch (e) {
                    console.error('localStorage setValue error:', e);
                }
            }
        },
        
        // GM_xmlhttpRequest兼容实现
        xmlhttpRequest: function(options) {
            if (GM.isSupported && typeof GM_xmlhttpRequest !== 'undefined') {
                return GM_xmlhttpRequest(options);
            } else {
                // Safari兼容：使用fetch API
                return new Promise((resolve, reject) => {
                    fetch(options.url, {
                        method: options.method || 'GET',
                        headers: options.headers || {},
                        body: options.data
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (options.onload) {
                            options.onload({ responseText: JSON.stringify(data) });
                        }
                        resolve(data);
                    })
                    .catch(error => {
                        if (options.onerror) {
                            options.onerror(error);
                        }
                        reject(error);
                    });
                });
            }
        },
        
        // GM_deleteValue兼容实现
        deleteValue: function(key) {
            if (GM.isSupported && typeof GM_deleteValue !== 'undefined') {
                return GM_deleteValue(key);
            } else {
                // Safari兼容：使用localStorage
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.error('localStorage deleteValue error:', e);
                }
            }
        }
    };

    //获取脚本配置
    async function getScriptConfig(script_id = CONFIG.ACTIVATION.SCRIPT_ID) {
        if(scriptConfig) return scriptConfig;
        const res = await supabaseClient
            .from('script_catalog')
            .select('*')
            .eq('script_id', script_id)
            .single();
        console.log('===获取脚本配置===', script_id, res);
        if (res.error) {
            //console.log('===获取脚本配置失败===', res.error);
            scriptConfig = {
                script_id: null,
                name: SbCLi.getScriptId(),
                version: null,
                url: null,
                applicable_sites: [],
                description: '',
                is_free: false,
                purchase_url: '',
                latest_notice: null, //默认不显示
                updated_at: new Date().toISOString(),
                feature_flags: {
                    activation_info: true,
                    menu: true,
                    my_history: false,
                    my_likes: true,
                    system_announcement: true,
                    world_channel: true,
                    world_top: true
                }
            }
        }else{
            scriptConfig = res.data;
        }
        return scriptConfig;
    }
        
    /**
     * 初始化 Supabase 客户端
     * @returns {Object} Supabase 客户端实例
     */
    async function initSupabaseClient() {
        if (!window.supabase) {
            throw new Error('Supabase SDK 未加载，请先引入 Supabase.js');
        }
        
        supabaseClient = window.supabase.createClient(
            CONFIG.SUPABASE_URL,
            CONFIG.SUPABASE_KEY,
            { realtime: { params: { eventsPerSecond: 10 } } }
        );
        
        return supabaseClient;
    }
    
    /**
     * 初始化用户：检查登录状态，若无则匿名登录
     * @param {Object} client - Supabase 客户端实例
     */
    async function initUser(client) {
        try {
            // 获取匿名会话 ✅
            const res = await client.auth.getSession(); //必须先调用这个，因为要定期刷新token
            console.log('===获取本地会话===', res);
            userId = res?.data?.session?.user?.id; //生效的ID
            if(userId){
                // 本地会话存在,写入GM存储
                GM.setValue(CONFIG.SUPABASE_AUTH_TOKEN, res.data.session);
                return;
            }
            
            let gm_auth_token = GM.getValue(CONFIG.SUPABASE_AUTH_TOKEN);// 使用 GM.getValue 实现跨域一致性 
            console.log('===获取脚本会话===', gm_auth_token);
            userId = gm_auth_token?.user?.id; //gm的ID
            if(userId){
                // 脚本会话存在,写入localStorage //实测有效，可以将userid同步到另一个域名下，如果仅靠client.auth.getSession()肯定不行
                localStorage.setItem(CONFIG.SUPABASE_AUTH_TOKEN, JSON.stringify(gm_auth_token));
                //const { data: anonData, error: anonError } = await client.auth.getSession();
                //console.log('===获取本地会话1===', anonData?.session || anonError);
                return;
            }
            
            // 注册登录匿名用户,成功后会自动写入localstrage中，下次getSession()会成功获取到会话
            const { data, error } = await client.auth.signInAnonymously({
                options: {
                    data: {
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
            
            userId = data.session.user.id;
            // 注册成功后, 会自动将会话写入localStorage
            // localStorage.setItem(CONFIG.SUPABASE_AUTH_TOKEN, data.session);
            // 手动写入GM存储
            GM.setValue(CONFIG.SUPABASE_AUTH_TOKEN, data.session);
        } catch (error) {
            console.error('用户初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 设置实时通信频道
     * @param {Function} messageCallback - 消息回调函数
     * @param {Function} presenceCallback - 在线状态回调函数
     */
    async function setupRealtime(messageCallback, presenceCallback) {
        if (!supabaseClient) {
            throw new Error('Supabase 客户端未初始化');
        }
        
        if (!userId) {
            throw new Error('用户未初始化');
        }
        
        // 统一通信频道
        messageChannel = supabaseClient.channel('chat-room2', {
            config: {
                presence: {
                    key: userId,
                    heartbeatInterval: 15,
                    statusTTL: 60
                }
            }
        })
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'video_bookmarks'
        }, payload => messageCallback(payload.new))
        .on('presence', { event: 'sync' }, () => {
            try {
                const states = messageChannel.presenceState();
                const onlineCount = Object.values(states).length;
                presenceCallback(onlineCount);
            } catch (e) {
                console.error('[Presence 状态同步异常]', e);
            }
        })
        .subscribe();
        
        // 跟踪用户在线状态
        await messageChannel.track({
            user_id: userId,
            online_at: new Date().toISOString()
        });

        // 页面关闭时清理资源
        window.addEventListener('beforeunload', () => cleanup());
    }
    
    /**
     * 加载消息历史
     * @param {number} limit - 加载消息数量
     * @param {string} flag - 加载标志，默认加载当前用户的消息, 'my_likes'加载我喜欢的消息, 'all_likes'加载所有喜欢的消息, 'all'加载所有消息
     * @returns {Array} 消息历史数组
     */
    async function loadHistory(limit = 20, flag = userId) {
        if (!supabaseClient) {
            throw new Error('Supabase 客户端未初始化');
        }
        
        try {
            let baseQuery = supabaseClient.from('video_bookmarks').select('*');
            
            if (flag === userId) {
                // 我的历史
                baseQuery = baseQuery.eq('user_id', userId);
            }
            else if (flag === 'my_likes') {
                // 我喜欢的
                baseQuery = baseQuery.filter('like_list', 'cs', `{"${userId}"}`).order('likes', { ascending: false });
            }
            else if (flag === 'all_likes') { 
                // 所有喜欢
                baseQuery = baseQuery.filter('likes', 'gt', 0).order('likes', { ascending: false });
            }
            else if (flag === 'all') {
                // 所有消息, 无需处理
            }
      
            // 执行查询
            const { data, error } = await baseQuery
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('加载消息历史失败:', error);
            return [];
        }
    }
    
    /**
     * 发送消息
     * @param {Object} msginfo - 消息信息对象
     * @param {string} msginfo.content - 消息内容
     * @returns {boolean} 发送结果
     */
    async function sendMessage(msginfo) {
        if (!supabaseClient) {
            throw new Error('Supabase 客户端未初始化');
        }
        
        if (!userId) {
            throw new Error('用户未初始化');
        }
        
        try {
            const { data, error } = await supabaseClient
                .from('video_bookmarks')
                .upsert({
                    "user_id": msginfo.user_id || userId,
                    "url": msginfo.url || location.href,
                    "content": msginfo.content || document.title,
                    "video_url": msginfo.video_url,
                    "image_url": msginfo.image_url,
                    "likes": msginfo.likes,
                    "like_list": msginfo.like_list,
                },
                {
                    onConflict: 'user_id,url'
                });
            
            return data || error;
        } catch (error) {
            console.error('消息发送失败:', error);
            return false;
        }
    }
    
    /**
     * 激活码验证和状态管理功能
     */

    /**
     * 验证激活码
     * @param {string} code - 激活码
     * @returns {Promise<{success: boolean, message: string, data?: any}>} 验证结果
     */
    async function verifyActivation(code) {
        try {
            // 使用GM.xmlhttpRequest直接调用云函数，避免CORS问题
            return new Promise((resolve, reject) => {
                GM.xmlhttpRequest({
                    method: 'POST',
                    url: CONFIG.ACTIVATION.VERIFY_ENDPOINT,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
                    },
                    data: JSON.stringify({
                        code,
                        script_id: CONFIG.ACTIVATION.SCRIPT_ID,
                        user_id: userId
                    }),
                    onload: function(response) {
                        try {
                            const result = JSON.parse(response.responseText);
                            activation_info = result;
                            console.log('===激活码验证结果===', activation_info);
                            GM.setValue('activation_info', result);
                            resolve(result);
                        } catch (error) {
                            resolve({ success: false, message: '激活失败，服务器返回格式错误' });
                        }
                    },
                    onerror: function(error) {
                        console.error('验证激活码网络错误:', error);
                        resolve({ success: false, message: '激活失败，网络错误' });
                    },
                    ontimeout: function() {
                        resolve({ success: false, message: '激活失败，请求超时' });
                    }
                });
            });
        } catch (error) {
            console.error('验证激活码失败:', error);
        }
    }
    
    /**
     * 清理资源
     */
    async function cleanup() {
        if (!supabaseClient || !messageChannel) {
            return;
        }
        
        supabaseClient.removeChannel(messageChannel);
        messageChannel = null;
    }
    
    /**
     * 初始化聊天服务
     * @param {string} [scriptId] - 脚本ID，默认值为 'script_id'
     * @returns {Promise<Object>} 初始化结果，包含用户 ID
     */
    async function init(scriptId = 'script_id') {
        try {
            // 更新默认配置中的SCRIPT_ID
            CONFIG.ACTIVATION.SCRIPT_ID = scriptId;

            // 初始化 Supabase 客户端
            const client = await initSupabaseClient();
            
            // 初始化用户
            await initUser(client);
            
            // 验证激活码信息
            // GM_deleteValue('activation_info'); //test
            const { success, message, data } = GM.getValue('activation_info') || {};
            console.log('本地缓存的激活码信息:', { success, message, data });
            const activationCode = data?.activation_code || null;
            if (activationCode) {
                const activationResult = await SbCLi.verifyActivation(activationCode);
                //console.log('激活码验证结果:', activationResult);
            }

            // 获取脚本配置
            await getScriptConfig();
            
            return userId;
        } catch (error) {
            console.error('聊天服务初始化失败:', error);
            throw error;
        }
    }
    
    // 减少试看次数
    function decreaseTrialCount() {
        // 如果用户已激活，试看次数不减少
        console.log('==isfree or 已激活 ==', scriptConfig?.is_free, activation_info?.success);
        if (scriptConfig?.is_free || activation_info?.success) {
            return 1;
        }
        const today = new Date().toDateString();
        const savedData = GM.getValue('trial_data', {
            date: today,
            count: 4
        });
        
        if (savedData.date !== today) {
            savedData.date = today;
            savedData.count = 4;
        }
        
        if (savedData.count > 0) {
            savedData.count--;
            GM.setValue('trial_data', savedData);
        }
        
        return savedData.count;
    }
    

    /**
     * 库的公共 API
     */
    return {
        VERSION,
        init,
        cleanup,
        sendMessage,
        setupRealtime,
        loadHistory,
        // 激活码相关API
        verifyActivation,
        // 获取激活码信息
        getActivationInfo: () => activation_info,
        // 试看次数相关API
        decreaseTrialCount,
        // 脚本配置相关API
        getScriptConfig,
        // 获取用户ID
        getUserId: () => userId,
        // 获取脚本ID
        getScriptId: () => CONFIG.ACTIVATION.SCRIPT_ID
    };
})();
