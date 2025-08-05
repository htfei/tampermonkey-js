// ==UserScript==
// @name         [tools]🔍关键词扫描器
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  支持配置关键词的源码扫描工具
// @match        *://*/*
// @author       w2f
// @icon         http://iciba.com/favicon.ico
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {

    'use strict';

    /**
     * 关键词扫描函数
     * @param {string} keyword - 要扫描的关键词
     * @param {boolean} [autoRun=true] - 是否自动执行
     */
    function scanForKeywords(keywords, autoRun = true) {
        if (!Array.isArray(keywords)) keywords = [keywords];
        if (keywords.length === 0) throw new Error('[🔍关键词扫描器] 至少需要提供一个关键词');

        const htmlContent = document.documentElement.outerHTML;
        const lines = htmlContent.split(/"/);
        const targetLines = lines.filter(line => keywords.some(k => line.includes(k.trim())));

        if (targetLines.length > 0) {
            console.log(`[🔍关键词扫描器] 发现 ${targetLines.length} 条含 ${keywords} 的内容：`);
            targetLines.forEach((line, i) => {
                console.log(`(${i + 1})`, "https://sdg.qyhtia.com" + line.trim());
            });
        } else {
            console.log(`[🔍关键词扫描器] 未发现包含 ${keywords.join(' 或 ')} 的内容`);
        }
    }

    // 全局导出函数供手动调用
    window.scanForKeywords = scanForKeywords;

    // 默认执行示例（可注释掉）
    scanForKeywords('.m3u8');

    // 提示用法
    console.log(`[🔍关键词扫描器] 用法: scanForKeywords(['.m3u8','.mp4'])`);

})();