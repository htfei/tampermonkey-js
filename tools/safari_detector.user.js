// ==UserScript==
// @name        Safari 环境探测器
// @namespace   safari-detector
// @version     1.1
// @description 专为Safari设计的API环境探测器，避免使用不兼容的GM_* API
// @match       *://*/*
// @grant       none // 关键：不请求任何可能不存在的GM权限
// @run-at      document-end
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/564911/Safari%20%E7%8E%AF%E5%A2%83%E6%8E%A2%E6%B5%8B%E5%99%A8.user.js
// @updateURL https://update.greasyfork.org/scripts/564911/Safari%20%E7%8E%AF%E5%A2%83%E6%8E%A2%E6%B5%8B%E5%99%A8.meta.js
// ==/UserScript==

(function () {
    'use strict';

    // 1. 创建与页面样式兼容的输出面板
    const style = document.createElement('style');
    style.textContent = `
        #safari-detector-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 700px;
            max-height: 85vh;
            background: #f0f0f0;
            color: #333;
            border: 2px solid #0366d6;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.28);
            z-index: 1000000;
            font-family: -apple-system, system-ui, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            overflow: hidden;
        }
        .dark #safari-detector-panel {
            background: #2d2d2d;
            color: #e0e0e0;
            border-color: #58a6ff;
        }
        #safari-detector-header {
            background: #0366d6;
            color: white;
            padding: 16px 20px;
            font-weight: 700;
            font-size: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .dark #safari-detector-header {
            background: #1f6feb;
        }
        #safari-detector-close {
            cursor: pointer;
            font-size: 24px;
            line-height: 1;
            padding: 0 8px;
            opacity: 0.9;
        }
        #safari-detector-close:hover {
            opacity: 1;
        }
        #safari-detector-content {
            padding: 20px;
            overflow-y: auto;
            max-height: 60vh;
        }
        .api-item {
            margin: 10px 0;
            padding: 10px;
            background: rgba(255,255,255,0.7);
            border-radius: 6px;
            border-left: 4px solid #ccc;
        }
        .dark .api-item {
            background: rgba(255,255,255,0.1);
        }
        .api-ok { border-left-color: #2ea043; }
        .api-fail { border-left-color: #cf222e; }
        .api-warn { border-left-color: #d29922; }
        .api-label {
            font-weight: 600;
            display: block;
            margin-bottom: 4px;
        }
        .api-value {
            font-family: 'Menlo', 'Monaco', monospace;
            font-size: 13px;
            word-break: break-all;
        }
    `;
    document.head.appendChild(style);

    // 2. 检测逻辑 - 避免使用任何GM_* API
    const checks = [];

    // 基础环境
    checks.push({
        label: '🌐 用户代理 (UA)',
        value: navigator.userAgent,
        status: 'info'
    });

    checks.push({
        label: '🔗 当前URL',
        value: window.location.href,
        status: 'info'
    });

    checks.push({
        label: '📦 用户脚本管理器',
        value: (() => {
            if (typeof GM !== 'undefined' && GM.info) return '检测到GM.info对象';
            if (typeof GM_info !== 'undefined') return '检测到GM_info对象';
            if (typeof safari !== 'undefined' && safari.extension) return '检测到safari.extension API';
            if (typeof browser !== 'undefined') return '检测到browser API';
            return '未检测到标准脚本管理器';
        })(),
        status: typeof GM_info !== 'undefined' ? 'ok' : 'warn'
    });

    // 关键Web API检测
    const webApis = [
        { name: 'document.querySelector', test: () => typeof document.querySelector === 'function' },
        { name: 'window', test: () => { try { return typeof window !== 'undefined'; } catch (e) { return false; } } },
        { name: 'window.localStorage', test: () => { try { return typeof localStorage !== 'undefined'; } catch (e) { return false; } } },
        { name: 'window.sessionStorage', test: () => { try { return typeof sessionStorage !== 'undefined'; } catch (e) { return false; } } },
        { name: 'window.fetch', test: () => typeof fetch === 'function' },
        { name: 'XMLHttpRequest', test: () => typeof XMLHttpRequest !== 'undefined' },
        { name: 'MutationObserver', test: () => typeof MutationObserver !== 'undefined' },
        { name: 'Promise', test: () => typeof Promise !== 'function' },
        { name: 'console.log', test: () => typeof console !== 'undefined' && typeof console.log === 'function' }
    ];

    webApis.forEach(api => {
        const isSupported = api.test();
        checks.push({
            label: (isSupported ? '✅' : '❌') + ' ' + api.name,
            value: isSupported ? '可用' : '不可用',
            status: isSupported ? 'ok' : 'fail'
        });
    });

    // 尝试检测Safari特定API
    if (typeof safari !== 'undefined') {
        checks.push({
            label: '🦁 Safari扩展API',
            value: '检测到safari对象',
            status: 'ok'
        });

        if (safari.extension) {
            checks.push({
                label: '  └─ safari.extension',
                value: '可用',
                status: 'ok'
            });
        }
    }

    // 3. 创建并显示结果面板
    const panel = document.createElement('div');
    panel.id = 'safari-detector-panel';

    // 根据页面背景色决定是否使用暗色主题
    const bgColor = getComputedStyle(document.body).backgroundColor;
    const rgb = bgColor.match(/\d+/g);
    if (rgb) {
        const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
        if (brightness < 128) panel.classList.add('dark');
    }

    let contentHtml = '<div id="safari-detector-header">';
    contentHtml += '<span>Safari 环境检测报告</span>';
    contentHtml += '<span id="safari-detector-close">×</span>';
    contentHtml += '</div>';
    contentHtml += '<div id="safari-detector-content">';

    checks.forEach(check => {
        const statusClass = `api-${check.status}`;
        contentHtml += `
            <div class="api-item ${statusClass}">
                <span class="api-label">${check.label}</span>
                <span class="api-value">${check.value}</span>
            </div>
        `;
    });

    // 添加说明
    contentHtml += `
        <div class="api-item api-warn" style="margin-top:20px;">
            <span class="api-label">💡 Safari 使用说明</span>
            <span class="api-value">
                1. Safari 用户脚本使用 <code>safari.extension</code> API，而非 <code>GM_*</code><br>
                2. 如需存储数据，请优先尝试 <code>localStorage</code> 或 <code>sessionStorage</code><br>
                3. 网络请求请使用原生的 <code>fetch()</code> 或 <code>XMLHttpRequest</code><br>
                4. 大部分 DOM 操作 API 应可直接使用
            </span>
        </div>
    `;

    contentHtml += '</div>';
    panel.innerHTML = contentHtml;
    document.body.appendChild(panel);

    // 4. 关闭功能
    panel.querySelector('#safari-detector-close').addEventListener('click', () => {
        document.body.removeChild(panel);
        document.head.removeChild(style);
    });

    // 5. 同时在控制台输出（用于调试）
    console.group('🔍 Safari 环境检测报告');
    checks.forEach(check => {
        console.log(`${check.label}: ${check.value}`);
    });
    console.groupEnd();
})();