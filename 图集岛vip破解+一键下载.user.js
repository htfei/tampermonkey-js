// ==UserScript==
// @name 图集岛VIP破解+下载+收藏
// @namespace http://tampermonkey.net/
// @version 1.0.3
// @description 图集岛最好用的插件！兼容手机 + PC ！支持VIP破解 + 单张下载 + 批量下载 + 打包下载 + 本地收藏
// @author tengfei + ss548
// @include /https?:\/\/(\w+\.)?tujidao.\w+/
// @icon  https://yskhd.com/wp-content/themes/modown/static/img/smilies/rolleyes.png
// @require https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/jszip/3.7.1/jszip.min.js
// @require https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/FileSaver.js/2.0.5/FileSaver.min.js
// @grant GM_xmlhttpRequest
// @grant unsafeWindow
// @grant GM_addStyle
// @license MIT
// ==/UserScript==

(function () {
    "use strict";
    GM_addStyle(".sc{position: absolute;top: 0;left: 0;background: #ebae12;border-radius: 50%;width: 35px;text-align: center;color: #FFF;z-index: 100;font-size: 13px;cursor: pointer;}");
    var locurl = window.location.href;
    var html1 =
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><script type="text/javascript" src="https://www.tujidao02.com/Static/css/jquery.js"></script><script type="text/javascript" src="http://demo.jb51.net/js/viewerjs/js/js/viewer.js"></script><link rel="stylesheet" href="http://demo.jb51.net/js/viewerjs/js/css/viewer.css" type="text/css">' +
        "<style>img {vertical-align: top;text-align: center;}" +
        ".imgbox{margin-bottom:5px;position: relative;overflow: hidden;float:left}" +
        ".imgbox img{max-width: 100%;cursor:pointer;}" +
        ".imgnum{cursor:pointer;position: absolute;right: 5px;bottom: 5px;background: rgb(12 192 229 / 50%);z-index: 100;padding: 10px 10px;color: #f9f9f9;border-radius: 50px;}" +
        ".btn-box{display:flex;justify-content: space-around;position:fixed;z-index:1000;bottom:5px}" +
        ".btn{width:100%;cursor:pointer;background: rgb(12 192 229 / 50%);z-index: 100;text-align: center;padding: 10px 10px;color: #f9f9f9;border-radius: 50px;text-decoration:none;}" +
        "a:link{color:pink;}a:visited{color:purple;}" +
        "@media screen and (min-width: 0px) {.imgbox {max-width: 50%} .contianer{column-count: 1;column-gap: 5px;margin:0;padding:0;}}" +
        "@media screen and (min-width: 900px) {.imgbox {max-width: 25%} .contianer{column-count: 1;column-gap: 5px;margin:0;padding:0;}}" +
        ".loading-box{width: 100%;height: 50px;display: none;align-items: center;position: absolute;top: 50px;left: 0;z-index: 999;}.loading{margin: 0 auto;width: 120px;height: 40px;line-height: 40px;color: #FFF;font-size: 17px;text-align: center;background: #1111119e;border-radius: 2px;}"+
        "</style></head>" +
        '<body bgcolor="#27282d"><div class="loading-box"><p class="loading">下载中...</p></div><ul id="images" align="center" class="contianer">';
    var pic_base =
        "<li class='imgbox'><div class='imgnum'  onclick='download1({pic_id},{num})'>{imgnum} 下载"+
        "</div><img alt='{pic_id}_{num}.jpg' filename='{title}_{num}.jpg' data-original='https://tjg.gzhuibei.com/a/1/{pic_id}/{num}.jpg' src='https://tjg.gzhuibei.com/a/1/{pic_id}/{num}.jpg'></li>";
    var title = "";
    var flag = false;
    var layer = null;
    var toastMsg;
    layui.use('layer', function(){
        layer = layui.layer;
    });
    // 下载函数
    function download(pic_id,imageId) {
        //console.log('download')
        GM_xmlhttpRequest({
            method: "GET",
            url: `https://tjg.gzhuibei.com/a/1/${pic_id}/${imageId}.jpg`,
            headers: {
                referer: "https://www.tujidao02.com/"
            },
            responseType:"blob",
            onload: function(xhr) {
                var r = xhr.responseText,
                    data = new Uint8Array(r.length),
                    i = 0;
                while (i < r.length) {
                    data[i] = r.charCodeAt(i);
                    i++;
                }
                let blob = new Blob([data], {
                    type: "image/jpeg"
                });
                var blobURL = window.URL.createObjectURL(blob);
                //console.log(blobURL)
                var downA = document.createElement("a");
                downA.href = blobURL;
                downA.setAttribute("download", document.title+`_${imageId}.jpg`);
                downA.click();
                window.URL.revokeObjectURL(blobURL);
            }
        })
    }
    // 一键下载函数
    function onekeydownload(pic_id,num) {
        for(let i=1;i<=num;i++){
            (function(j) {
                window.setTimeout(function(){
                    download(pic_id,j);
                },100*i);
            })(i);
        }
    }


    //******新增打包下载点击
    function zipDown(){
        //批量下载
        if (!flag) {
            downloadPack();
            flag = true;
        } else {
            alert('下载中, 请耐心等待...\n点击确认继续下载');
        }
    }
    //******新增zip下载
    async function downloadPack() {
        console.log("start download...");
        $(".loading-box").css("display","flex");
        var start = performance.now();

        var list = document.querySelectorAll('.imgbox>img');
        var title = document.title;
        var zip = new JSZip();
        for (const item of list) {
            var url = item.getAttribute('src');
            var filename = item.getAttribute('filename');
            //console.log(url,filename);
            const response = getFile(url);
            zip.file(filename, response);

        }

        zip.generateAsync({
            type: 'blob'
        }).then(function (content) {
            saveAs(content, title + '.zip');
            var end = performance.now();
            console.log('completed: ', `${(end - start) / 1000} ms`)
            $(".loading-box").css("display","none");
        });
    }

    //******新增下载文件
    async function getFile(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                headers: {
                    referer: "https://" + window.location.host
                },
                responseType: "blob",
                onload: function (response) {
                    resolve(response.response);
                },
                onerror: function (error) {
                    reject(error);
                }
            });
        });
    }

    // 打开新窗口展示图片
    var createnew = function (num, pic_id, tags) {
        var tagHtml = [];
        var last = tags.pop();
        var pic_new = pic_base.replaceAll("{pic_id}", pic_id).replaceAll('{title}', last.innerText);
        for (let t of tags) {
            tagHtml.push(t.outerHTML);
        }
        tagHtml.push(last.innerText);
        tagHtml =
            `<div style='color:white;'>`+
            tagHtml.join(" / ") +
            `<div class="btn-box"><div class='btn' onclick='download2(${pic_id},${num})'>一键下载</div>
            <div class="btn" onclick='zipDown()' >打包下载</div>
            <a class="btn" href="/u/?action=shoucang" >我的收藏</a>
            </div></div>`;
        var imgs = [];
        for (var i = 1; i <= num; i++) {
            imgs.push(
                pic_new.replaceAll("{num}", i).replace("{imgnum}", ` [${i}/${num}]`)
            );
        }
        let html = html1.replace("img_title", `${last.innerText} - ${num}P @ ${pic_id}`);
        html += imgs.join("\n");
        html += "</ul><script>const viewer = new Viewer(document.getElementById('images'),{inline: false,url: 'data-original',rotatable:false,scalable:false});</script>";
        //var w = window.open("https://www.tujidao02.com");
        var w = window.open(window.location.href);
        w.onload = () => {
            w.document.write('');
            w.document.write(tagHtml + html);
            w.document.title = last.innerText;
            w.document.close();
        };
    };

    /**
     * 给已有的图片容器添加点击事件，移除原有跳转链接
     */
    function addEvent(list) {
        for (const li of list) {
            //console.log(li);
            addCollectAndRemoveDom(li);

            //第一个a
            li.querySelector('img').onclick = function () {
                // 获取数量
                var num = li
                .querySelector("span.shuliang")
                .innerText.split("P")[0];

                num = parseInt(num);

                // id
                var aTag = li.querySelector("a");
                aTag.removeAttribute("href"); // 删除链接，防止跳转
                var id = li.querySelector(".biaoti a").getAttribute("href");
                id = id.split("id=")[1];
                //丢掉最后一个
                var tags = li.querySelectorAll("p>a");
                //console.log(tags);
                createnew(num, id, [...tags]);
            };
        }
    }

    /**
     *  添加收藏与移除
     */
    function addCollectAndRemoveDom(li){
        let id = li.querySelector(".biaoti a").getAttribute("href");
        id = id.split("id=")[1];
        if(locurl.indexOf("shoucang")==-1){
            $(li).append('<p class="sc" style="height: 35px;line-height: 35px;">收藏</p>');
            li.querySelector('.sc').onclick = function (){
                let lii = li.cloneNode(true);
                let p_sl = lii.querySelector('p');
                if(p_sl.innerText.indexOf("收录")>-1){
                    p_sl.remove();
                }
                let li_str = lii.outerHTML;
                collect(id, li_str);
            };
        }else{
            $(li).append('<p class="sc" style="height: 35px;line-height: 35px;">移除</p>');
            li.querySelector('.sc').onclick = function (){
                collectRemove(id);
            };
        }
    }

    /**
     *  收藏
     */
    function collect(id, li_str){
        //console.log("id: ", id);
        //console.log("li: ",li_str);
        let list = localStorage.getItem("sclist");
        let obj = {
            "id": id,
            "li": li_str.replace('<p class="sc" style="height: 35px;line-height: 35px;">收藏</p>','')
        };
        let arr = [];
        if(list == null){
            //console.log("list不存在");
            arr.push(obj);
            localStorage.setItem("sclist",JSON.stringify(arr));
        }else{
            //console.log("list存在", JSON.parse(list));
            list = JSON.parse(list);
            for(let i=0; i<list.length; i++){
                if(id===list[i].id){
                    layer.msg(id+"已收藏");
                    if(i<list.length){
                        return;
                    }
                }
                if(i==list.length-1 && id != list[i].id){
                    list.push(obj);
                    localStorage.setItem("sclist",JSON.stringify(list));
                }
            }
        }
    }
    /**
     *  取消收藏
     */
    function collectRemove(id){
        let list = localStorage.getItem("sclist");
        list = JSON.parse(list);
        list.forEach((item,index,list) => {
            if(item.id === id){
                list.splice(index,1);
            }
        });
        localStorage.setItem("sclist",JSON.stringify(list));
        main();
        layer.msg(id+"已移除");
    }

    /**
     *  获取收藏写入收藏页面
     */
    function getCollect(){
        if(locurl.indexOf("shoucang")>-1){
            $(".hezi ul").html("");
            let list = localStorage.getItem("sclist");
            if(list != null){
                list = JSON.parse(list);
                for(let item of list){
                    $(".hezi ul").append(item.li);
                }
            }
        }
    }

    /**
     *  获取当前页面的图片列表
     */
    function getLiList() {
        return document.querySelectorAll("div.hezi>ul>li");
    }

    function main(){
        //console.log(locurl);
        if($(".unav")){
            let alist = $(".unav a");
            for(let i=0; i<alist.length; i++){
                //console.log(alist[i]);
                if(alist[i].innerText=='开通会员' || alist[i].innerText=='APP下载'){
                    //console.log("success");
                    alist[i].remove();
                }
                if(alist[i].innerText=='我的收藏'){
                    alist[i].style.color = "#ffca00";
                }
            }
        }
        getCollect();
        addEvent(getLiList());
    }
    main();

    if(!unsafeWindow.download1)
    {
        unsafeWindow.download1 = download;
    }
    if(!unsafeWindow.download2)
    {
        unsafeWindow.download2 = onekeydownload;
    }
    if(!unsafeWindow.zipDown)
    {
        unsafeWindow.zipDown = zipDown;
    }

    var contentContainer = document.getElementById("search");
    var config = { childList: true, subtree: true };
    // 当观察到突变时执行的回调函数
    var callback = function (mutationsList) {
        mutationsList.forEach(function (item, index) {
            const { addedNodes } = item;
            addEvent(addedNodes);
        });
    };

    // 创建一个链接到回调函数的观察者实例
    var observer = new MutationObserver(callback);

    // 开始观察已配置突变的目标节点
    contentContainer && observer.observe(contentContainer, config);

})();