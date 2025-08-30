// ==UserScript==
// @name        [tools]  Vue3 Pinia注入测试
// @namespace    https://bbs.tampermonkey.net.cn/
// @version      0.1.0
// @description  try to take over the world!
// @author       You
// @match       http://localhost:5173/*
// @grant       unsafeWindow
// @run-at      document-start
// @icon         http://iciba.com/favicon.ico

// ==/UserScript==
const originWeakSet = WeakSet;
unsafeWindow.WeakSet = function () {
  const instance = new originWeakSet();
  const has = instance.has;
  instance.has = function (...args) {
    //debugger;
    if (args[0].state !== undefined) {
      console.log("找到了pinia注册实例", args[0]);
    }
    return has.call(this, ...args);
  };
  return instance;
};