// ==UserScript==
// @name         过早客(原光谷社区)楼层排版优化
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  将过早客(原光谷社区)楼层排版优化 ，使回帖看起来更直观
// @author       jackson<why2fly@aliyun.com>
// @match        *://www.guozaoke.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    var a = $('.reply-item span:nth-child(3)').get().map(i=>i.innerHTML);/*楼层序号a[20]*/
    var b = $('.reply-item .content').get().map(i=>i.innerHTML);/*每层内容b[20]*/
    var c = $('.reply-item .username').get().map(i=>i.innerHTML);/*层主名称c[20]*/
    var d = $('.reply-item .content');/*每层内容obj*/
    var m = $('.reply-item');/*楼层obj*/
    var e = $('.reply-item .username');/*层主名称obj*/
    var x = $('.ui-header .username a')[0].innerHTML;/*楼主名称*/
	var y = $('.ui-header .username')[1].innerHTML;/*当前用户名称*/
    var z = "jackson";
    var i = 1;/*从第二层开始*/
    while(i< m.length){
        /*当前层主为楼主，标记为蓝色*/
        if( c[i] == x )
        {
            e[i].setAttribute('style','color:blue');
        }
        /*当前层主为当前用户，标记为红色*/
        else if( c[i] == y )
        {
            e[i].setAttribute('style','color:red');
        }
        /*当前层主为作者，标记为黄色*/
        else if( c[i] == z )
        {
            e[i].setAttribute('style','color:yellow');
        }
        /*当前层内容匹配“楼上”，将本层obj做为子obj添加到上层obj*/
        if(b[i].match("楼上"))
        {
            //console.log(a[i]+" have @楼上 #"+i);
            d[i-1].append(m[i]);
        }
        /*从上层开始逆序匹配名称，成功则移动 */
        for(var j=i-1;j>=0;j--){
            if(b[i].match(c[j])){
                //console.log(a[i]+" have @"+c[j] + " #"+(j+1));
                d[j].append(m[i]);
                break;
            }
        }
        i++;
    }
})();