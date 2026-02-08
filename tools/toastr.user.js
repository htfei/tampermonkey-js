// ==UserScript==
// @name         toastr Demo
// @namespace    https://bbs.tampermonkey.net.cn/
// @version      0.1.0
// @description  try to take over the world!
// @author       You
// @match        https://*/*
// @match        https://bbs.tampermonkey.net.cn/thread-5903-1-1.html
// @grant        unsafeWindow
// ==/UserScript==


(function () {
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


    // 三个参数，msg：要显示的信息,duration(可选)：显示的时间，pos(可选，默认左下角)：要显示的位置，为了方便使用，个人习惯于小键盘的九宫格代替，相信这九个位置应该能满足大部分使用场景
    umsg.info("info =>>>1");
    // 也可以直接配置，配置后，后面的样式都会采用配置后的参数为默认样式
    umsg.conf = { duration: 10000, pos: 2 };
    umsg.error("error =>>>2");
    umsg.conf = { duration: 10000, pos: 3 };
    umsg.warning("warning =>>>3");
    umsg.success("success =>>>4", 10000, 4);
    umsg.success("success =>>>5", 10000, 5);
    umsg.success("success =>>>6", 10000, 6);
    umsg.success("success =>>>7", 10000, 7);
    // 也可以配置selector（在哪个元素下显示）当然也可以自定义样式
    umsg.conf = { duration: 10000, pos: 8, selector: document.body, style: "width:300px...." };
    umsg.success("success =>>>8");
    umsg.success("success =>>>9", 10000, 9);
})();