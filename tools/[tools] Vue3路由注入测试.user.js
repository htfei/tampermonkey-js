// ==UserScript==
// @name        [tools] Vue3路由注入测试
// @namespace    https://bbs.tampermonkey.net.cn/
// @version      0.1.0
// @description  try to take over the world!
// @author       You
// @match       http://localhost:5173/
// @grant       unsafeWindow
// @run-at      document-start
// @icon         http://iciba.com/favicon.ico

// ==/UserScript==
const originWeakSet = WeakSet;
unsafeWindow.WeakSet = function () {
  const instance = new originWeakSet();
  const has = instance.has;
  instance.has = function (...args) {
    if (args[0].addRoute !== undefined) {
      console.log("找到了路由", args[0]);
      const router = args[0];
      router.afterEach((to, from, fail) => {
        console.log(to, from, fail);
      });
    }
    return has.call(this, ...args);
  };
  return instance;
};