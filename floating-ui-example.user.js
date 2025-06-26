// ==UserScript==
// @name         悬浮UI示例
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  悬浮UI库示例用法
// @author       开发者
// @match        *://*/*
// @grant        none
// @require      file:///d:/dev/油猴/floating-ui-library.js
// ==/UserScript==

/**
 * 示例用法：通过自定义配置初始化悬浮UI
 */
// 自定义配置（覆盖默认图标和点击回调）
const customConfig = {
    icons: ['🎮', '📚', '🎬', '🎨', '🎵'], // 自定义图标数组
    onItemClick: (index, icon) => {
        alert(`自定义回调触发：点击了图标[${icon}]（索引${index}）`);
    }
};

// 初始化悬浮UI实例（传入自定义配置）
new FloatingUI(customConfig);