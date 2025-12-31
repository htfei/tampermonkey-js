// ==UserScript==
// @name         SupabaseClientTest
// @namespace    SupabaseClientTest
// @version      1.2
// @description  和所有人在线交流，安全匿名，无需账号，无需客户端，保护隐私，在线网页聊天室
// @match        https://*/*
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// @license      MIT
// @connect      supabase.co
// @require      https://unpkg.com/@supabase/supabase-js@2.49.3/dist/umd/supabase.js
// ==/UserScript==

/**
 * 在线网页聊天室 - 使用库引入方式
 * 本脚本是一个简单的入口文件，通过引入外部库来实现聊天室功能
 */

(async () => {
    'use strict';

    // 配置参数
    const CONFIG = {
        SUPABASE_URL: 'https://icaugjyuwenraxxgwvzf.supabase.co',
        SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYXVnanl1d2VucmF4eGd3dnpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4ODcwNjcsImV4cCI6MjA1ODQ2MzA2N30.-IsrU3_NyoqDxFeNH1l2d6SgVv9pPA0uIVEA44FmuSQ',
    };

    console.log(`正在初始化...`);
    const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

    // 获取匿名会话 ✅
    const { data: anonData, error: anonError } = await supabaseClient.auth.getSession()
    if(anonError){
        console.error('获取匿名会话失败:', anonError);
        return;
    }
    else{
        console.log('匿名会话:', anonData);
    }

    // 插入视频书签 ✅
    if(0) {
        const { data, error } = await supabaseClient
            .from('video_bookmarks')
            .insert({
                "user_id": "9066542c-2776-449e-a994-9059706f42c9",
                "url": location.href,
                "content": document.title,
                "video_url": "sdada",
                "image_url": "dasad",
            });
        if (error) {
            console.error('插入失败:', error);
            return;
        }
        console.log('插入成功:', data);
    }
    
    // cli 调用云函数 bookmark-video 插入视频书签//err: cors限制🚫
    if(0) {
        const { data, error } = await supabaseClient.functions.invoke('bookmark-video', {
            body: {
                user_id: "9066542c-2776-449e-a994-9059706f42c9",
                url: "asdadasd",
                content: "invoke test",
                video_url: "video_url",
                image_url: "image_url"
            },
        });
        if (error) {
            console.error('调用函数失败:', error);
            return;
        }
        console.log('调用函数成功:', data);
    }

    // xhr 调用云函数 bookmark-video 插入视频书签 //✅
    if(0) {
        GM_xmlhttpRequest({
        method: "POST",
        url: `${CONFIG.SUPABASE_URL}/functions/v1/bookmark-video`,
        data: `user_id=9066542c-2776-449e-a994-9059706f42c9&url=${location.href}&content=${document.title}&video_url=11&image_url=11`,
        headers: {
            "Content-Type": "application/json"
        },
        onload: function(response) {
            console.log('调用函数成功:', response);
        }
    });
    }

    // 查询视频书签 ✅
    if(0) {
        const { data, error } = await supabaseClient
            .from('video_bookmarks')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('查询失败:', error);
            return;
        }
        console.log('查询成功:', data);
    }

})();
