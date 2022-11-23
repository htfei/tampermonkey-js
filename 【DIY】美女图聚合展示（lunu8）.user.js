// ==UserScript==
// @name         【DIY】美女图聚合展示（lunu8）
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       why2fly
// @match        *://www.lunu.cc/*
// @require      http://code.jquery.com/jquery-3.1.0.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /*0. 隐藏当前图片div */
    $('.entry p a').hide();
    $('#dm-fy').hide();

    /*1.获取所有的页面url*//*不同网站需修改*/
    var pageUrls = [];
    var pageNums = $('#dm-fy > li').eq(-2).text().match(/(\d+)/m)[1];
    var pageHead = window.location.href.split("?")[0];
    for (var i = 1; i <= parseInt(pageNums); i++) {
        var pageUrl = pageHead + "?page=" + i;
        pageUrls.push(pageUrl);
    }

    /*2.获取所有的页面imgs*/
    var imgs = [];
    pageUrls.forEach(url=>
        fetch(url)
            .then(response => response.text())
            .then(function(html) {
                var doc = new DOMParser().parseFromString(html, "text/html");
                var imglist = $(doc).find('div.entry p a img');
                imglist.get().map(i=>imgs.push(i.src));/*不同网站需修改*/
                return imglist;
            }).then(x=>showonpage(x))/*3.*/
            .catch(e => console.log("Oops, error", e)
        )
    );

    /*3.将所有imgs展示到页面上*/
    function showonpage(imglist){
        for (var i = 0; i < imglist.length; i++) {
            imglist[i].style = "width: 100%;height: 100%";
            $('div.entry').before(imglist[i]);/*不同网站需修改*/
        }
    };

    /*4.添加操作div【一键下载】 */
    function onekeydownload(){
        console.log(imgs);
        imgs.map(function(i){
            var a = document.createElement('a');
            a.setAttribute('download','');
            a.href=i;
            document.body.appendChild(a);
            a.click();
        })
    }
    var injectComponent =
    '<div>'+
    '<input onclick="onekeydownload()" type="button" class="sl-btn" style="position:fixed;top:20%;right:20%" value="一键下载"/>';
    var xx = $(injectComponent).get(0);
    $('div.postmeta').after(xx);

})();