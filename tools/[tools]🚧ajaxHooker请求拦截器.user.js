// ==UserScript==
// @name         [tools]🚧ajaxHooker请求拦截器
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  拦截请求极其响应,对其进行修改
// @author       w2f
// @match        *://*/*
// @icon         http://iciba.com/favicon.ico
// @grant        none
// @license      MIT
// @run-at       document-start
// @require      https://scriptcat.org/lib/637/1.4.5/ajaxHooker.js#sha256=EGhGTDeet8zLCPnx8+72H15QYRfpTX4MbhyJ4lJZmyg=
// ==/UserScript==

(function () {
  'use strict';

  // 如果库劫持失败，可能是其他代码对xhr/fetch进行了二次劫持，protect方法会尝试阻止xhr和fetch被改写。
  ajaxHooker.protect();
  // 为hook方法设置过滤规则，只有符合规则的请求才会触发hook
  ajaxHooker.filter([
    { type: 'xhr', url: '.m3u8', method: 'GET', async: true },//小狐狸
  ]);
  // 通过一个回调函数进行劫持，每次请求发生时自动调用回调函数。
  ajaxHooker.hook(async request => {
    request.response = async res => {
      console.log("[tools]🔍ajaxHooker请求拦截器 修改前:", res.responseText.length);
      res.responseText = await modifyResponse_m3u8(res.responseText);
      //打印rsp
      console.log("[tools]🔍ajaxHooker请求拦截器 修改后:", res.responseText.length);
    };
  });

  // 将xhr和fetch恢复至劫持前的状态，调用此方法后，hook方法不再生效。
  // ajaxHooker.unhook();

  //自定义rsp修改函数
  //为m3u8文件追加ts分片, 不支持追加带hash加密参数的ts分片
  async function modifyResponse_m3u8(originalText) {

    // Base64解码处理
    let flag = 0;
    try {
      const decodedText = decodeURIComponent(escape(atob(originalText)));
      console.log('[tools]🔍 Base64解码成功，解码后长度:', decodedText.length, decodedText);
      originalText = decodedText;
      flag = 1;
    } catch (e) {
      console.log('[tools]🔍 非Base64编码内容，直接处理');
    }

    // 修改 m3u8 内容：插入 160.ts
    let modifiedText = originalText;

    // 你可以使用正则定位插入点，比如在 ENDLIST 前加入新片段
    // TS片段配置（可扩展）
    // 配置参数
    const MAX_TS_COUNT = 30*30; // 最大生成数量 ⚠️:目前给了个很大的值,30*30*2s=30min时长, 如果能获取到真实时长这里最好修改
    const TS_DURATION = 2;   // 每个片段时长(秒) ⚠️:部分网站每个ts片段时长不一致, 但目前看不影响播放,具体取决于浏览器行为
    const TS_FILENAME = '2025-02-{0}.ts'; // 每个片段文件名 🔴:这里要拼接完整的ts地址,如果后面有参数也要加上,如果参数部分有加密hash则无法破解❌
    const TS_PREFIX = 3;  // 每个片段文件名前缀补0个数 🔴:这里一定要填对，否则拼接的ts地址不对，下载会失败

    // 预处理后的内容分析
    const lastTsMatch = originalText.match(/(\d+)\.ts/);
    console.log("[tools]🔍ajaxHooker请求拦截器 智能解析最后一个TS文件名:", lastTsMatch);
    let startNumber = lastTsMatch ? parseInt(lastTsMatch[1]) : 1;

    // 生成连续TS片段
    const fragments = Array.from({ length: MAX_TS_COUNT }, (_, i) =>
      `#EXTINF:${TS_DURATION},\n${TS_FILENAME.replace('{0}', `${(startNumber + i + 1).toString().padStart(TS_PREFIX, '0')}`)}`
    ).join('\n');

    if (originalText.includes('#EXT-X-ENDLIST')) {
      // 使用动态生成的fragments
      modifiedText = originalText.replace(
        '#EXT-X-ENDLIST',
        `${fragments}\n#EXT-X-ENDLIST`
      );
    }

    // 编码为Base64
    if (flag) {
      const encodedText = btoa(unescape(encodeURIComponent(modifiedText)));
      console.log('[tools]🔍 Base64编码成功，编码后长度:', encodedText.length);
      return encodedText;
    }

    return modifiedText;
  }

})();