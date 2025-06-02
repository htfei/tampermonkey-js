// ==UserScript==
// @name         New Userscript  百度文库VIP特权。可以阅读不收费的文库
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.52pojie.cn/thread-1698565-1-1.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=52pojie.cn
// @grant        none
// ==/UserScript==

(function () {
    // 定义中间变量
    var data;
    // 给pageData监控起来
    Object.defineProperty(window, 'pageData', {
        // 一旦给pageData赋值就会触发
        set: function (newObj) {
            // newObj就是新赋的值，把它存储给中间变量data
            data = newObj;
        },
        // 一旦获取pageData就会触发
        get: function () {
            // 判断以下，是不是赋值成功了，成功了，我们才能调用data.vipInfo.isVip
            // 然后设置值为1，表示是一个vip用户
            if ('vipInfo' in data) {
                data.vipInfo.global_svip_status = 1;
                data.vipInfo.global_vip_status = 1;
                data.vipInfo.expireTicketTotal = 1;
                data.vipInfo.experimentGoods = 1;
                data.vipInfo.is_expire_user = 1;
                data.vipInfo.isJiaoyuVip = true;
                data.vipInfo.ticketTotoal = 66666;
                data.vipInfo.isClassicVip = 1;
                data.vipInfo.isSuperVip = 1;
                data.vipInfo.isVipInRenewStatus = true;
                data.vipInfo.isVip = 1;
                data.vipInfo.isWenkuVip = true;
            }
            // 将原始页面上的pageData对象经过包装后的data对象返回，
            // 此时只要你获取pageData就会触发get方法，然后包装，设置vip为存在
            return data;
        }
    })
})();