// ==UserScript==
// @name        [tools]  Vue3 Mixin Inject
// @namespace    https://bbs.tampermonkey.net.cn/
// @version      0.1.0
// @description  try to take over the world!
// @author       You
// @match        https://www.bilibili.com/*
// @run-at       document-start
// @grant unsafeWindow
// @icon         http://iciba.com/favicon.ico
// ==/UserScript==

const assign = Object.assign;
let isRun = false;
Object.assign = function (...args) {
  if (args.length == 2 && args[1]?.render !== undefined && !isRun) {
    let b = args[1];
    const originRender = b.render;
    let isInject = false;
    b.render = function (...args) {
      if (!isInject) {
        args[5]["_"].appContext.mixins.push({
          mounted() {
            console.log("被创建了，实例数据", this.$props);
          },
        });
        isInject = true;
      }
      console.log("被执行了", args);
      return originRender.call(this, ...args);
    };
    isRun = true;
  }
  return assign.call(this, ...args);
};