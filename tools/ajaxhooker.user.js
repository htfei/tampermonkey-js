// ==UserScript==
// @name         ajaxhooker demo
// @namespace    ajaxhooker
// @version      1.0
// @description  来不及解释了，快上车！！！
// @author       w2f
// @match        https://*/*
// @license      MIT
// @run-at       document-start
// @require https://scriptcat.org/lib/637/1.4.8/ajaxHooker.js#sha384=totgFWqK9CTgaDR/gOSIizXzxC0ohuBlDHHpIMToFSeegnFyV2MsM9GlfFMLropx
// ==/UserScript==

(async function () {
    'use strict';
    /** toast */
    const umsg = (function () {
        const position = { 1: "bottom:-0.7em;left:7.2em;", 2: "bottom:-0.7em;left:50%;", 3: "bottom:-0.7em;right:-6.2em;", 4: "top:50%;left:7.2em;", 5: "top:50%;left:50%;", 6: "top:50%;right:-6.2em;", 7: "top:2em;left:7.2em;", 8: "top:2em;left:50%;", 9: "top:2em;right:-6.2em;" };
        // prettier-ignore
        const show = (msg, duration, pos, bgc) => {
            let m = document.createElement("div");
            const conf = umsg.conf;
            m.style.cssText = `background-color: ${bgc};${position[pos ?? conf.pos ?? 5]}` + "position: fixed;padding:10px 20px;z-index:99999;width: 200px;max-height: 70%;overflow: auto; color: white;word-break: break-all;text-align: center;border-radius: 5px;transform: translate(-50%, -50%);pointer-events: all;font-size: 15px;line-height: 1.5;box-sizing: border-box;";
            m.style.cssText += conf.style ?? "";
            m.innerHTML = msg;
            (conf.selector || document.body)?.appendChild(m);
            setTimeout(() => {
                let d = 0.5;
                m.style.transition = "transform " + d + "s ease-in, opacity " + d + "s ease-in";
                m.style.webkitTransition = "-webkit-transform " + d + "s ease-in, opacity " + d + "s ease-in";
                m.style.opacity = "0";
                setTimeout(() => m.remove(), d * 1000);
            }, duration ?? conf.duration ?? 2000);
        };
        return {
            conf: { duration: 2000, pos: 1, selector: document.body, style: "" },
            info: (msg, duration, pos) => show(msg, duration, pos, "rgba(0, 0, 0, 0.77)"),
            success: (msg, duration, pos) => show(msg, duration, pos, "rgba(50, 198, 130, 0.77)"),
            warning: (msg, duration, pos) => show(msg, duration, pos, "rgba(238, 191, 49, 0.77)"),
            error: (msg, duration, pos) => show(msg, duration, pos, "rgba(255, 85, 73, 0.77)"),
        };
    })();

    let index = 1;//1~9
    umsg.success("umsg demo =>>>4", 3000, 5);

    ajaxHooker.protect();
    ajaxHooker.filter([
        { type: 'xhr', url: '/api/', async: true },
        { type: 'fetch', url: '/api/', async: true },
        { url: /^\.m3u8/ },
    ]);
    ajaxHooker.hook(async request => {
        console.log(request.type, request.method, request.url);
        index++; if (index > 9) index = 1;
        if (request.url.includes('.m3u8')) {
            umsg.success(`${request.type}-${request.method}-.m3u8: ${request.url?.slice(0, 30)}`, 10000, index);
        } else {
            umsg.success(`${request.type}-${request.method}: ${request.url?.slice(0, 30)}`, 10000, index);
        }
    });

})();