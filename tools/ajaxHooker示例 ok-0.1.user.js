// ==UserScript==
// @name         ajaxHooker示例 ok
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.fi11av85.com/play/video/*
// @icon         http://iciba.com/favicon.ico
// @grant        none
// @require      https://scriptcat.org/lib/637/1.3.3/ajaxHooker.js
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    console.log("ajaxHooker示例 ...");

    //其他代码对xhr/fetch进行了二次劫持，protect方法会尝试阻止xhr和fetch被改写
    ajaxHooker.protect();

    //只有符合规则的请求才会触发hook
    ajaxHooker.filter([
        {type: 'xhr', url: '/videos/getPreUrl', method: 'POST', async: true},
        //{url: /^http/},
    ]);

    ajaxHooker.hook(request => {
        //console.log("hooking....",request);
        if (request.url.indexOf('/videos/getPreUrl') > -1 ) {

            //request.data = await defineData(request.data);
            request.response = async res => {
                console.log("hooked!!! response ====>",JSON.parse(res.responseText));
                res.responseText = await modifyResponse(res.responseText);
                //将xhr和fetch恢复至劫持前的状态
                //ajaxHooker.unhook();
            };
        }
    });

    async function modifyResponse(responseText){
        let rspjson = await JSON.parse(responseText);
        rspjson.data.url = rspjson.data.url.split(/start.*?sign/).join('sign');
        console.log("fixed url====>",rspjson);
        return await JSON.stringify(rspjson);
    }

})();