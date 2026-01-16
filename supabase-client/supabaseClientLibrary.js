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
    const DEFAULT_CONFIG = {
        SUPABASE_URL: 'https://icaugjyuwenraxxgwvzf.supabase.co',
        SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYXVnanl1d2VucmF4eGd3dnpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4ODcwNjcsImV4cCI6MjA1ODQ2MzA2N30.-IsrU3_NyoqDxFeNH1l2d6SgVv9pPA0uIVEA44FmuSQ'
    };
    
    // 内部状态管理
    let supabaseClient = null;
    let userId = null;
    let messageChannel = null;
    
    /**
     * 初始化 Supabase 客户端
     * @returns {Object} Supabase 客户端实例
     */
    async function initSupabaseClient() {
        if (!window.supabase) {
            throw new Error('Supabase SDK 未加载，请先引入 Supabase.js');
        }
        
        supabaseClient = window.supabase.createClient(
            DEFAULT_CONFIG.SUPABASE_URL,
            DEFAULT_CONFIG.SUPABASE_KEY,
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
            let gm_userId = await GM_getValue('user_id');// 使用 GM_getValue 实现跨域一致性 
            const { data: anonData, error: anonError } = await client.auth.getSession();
            GM_log('===获取匿名用户成功===', anonData, gm_userId, anonError);
            userId = anonData.session?.user?.id; //生效的ID
            if(userId){
                if (gm_userId != userId) {
                    GM_log('===Session与GM存储的用户ID不一致===', userId, gm_userId);
                    GM_setValue('user_id', userId);
                }
                return;
            }else if(gm_userId){ //session不存在,但gm_user_id存在,即同一个脚本在不同网页生效时
                userId = gm_userId; // 从GM存储中获取用户ID
                // todo: 将gm_userId写入session,是否能生效未知,先不处理
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
            
            GM_log('===注册匿名用户===', data, error);
            if (error) throw error;
            
            userId = data.session.user.id;
            GM_setValue('user_id', userId);
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
                baseQuery = baseQuery.filter('like_list', 'cs', `{"${userId}"}`);
            }
            else if (flag === 'all_likes') { 
                // 所有喜欢
                baseQuery = baseQuery.filter('likes', 'gt', 0);
            }
            else if (flag === 'all') {
                // 所有消息, 无需处理
            }
      
            // 执行查询
            const { data, error } = await baseQuery
                .order('likes', { ascending: false })
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
     * @returns {Promise<Object>} 初始化结果，包含用户 ID
     */
    async function init() {
        try {
            // 初始化 Supabase 客户端
            const client = await initSupabaseClient();
            
            // 初始化用户
            await initUser(client);
            
            return userId;
        } catch (error) {
            console.error('聊天服务初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 库的公共 API
     */
    return {
        VERSION,
        userId,
        init,
        sendMessage,
        setupRealtime,
        loadHistory
    };
})();
