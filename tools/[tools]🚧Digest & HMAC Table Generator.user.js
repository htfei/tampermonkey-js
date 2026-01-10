// ==UserScript==
// @name         [tools]🚧Digest & HMAC Table Generator
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  控制台生成摘要与 HMAC 表格
// @author       Copilot
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const loadCryptoJS = () => {
    if (!window.CryptoJS) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/crypto-js@4.1.1/crypto-js.min.js';
      document.head.appendChild(script);
    }
  };
  loadCryptoJS();

  window.generateDigestTable = async function (input, key = 'default-key') {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const results = [];

    const nativeAlgos = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
    for (const algo of nativeAlgos) {
      try {
        const digest = await crypto.subtle.digest(algo, data);
        const hex = Array.from(new Uint8Array(digest))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        results.push({
          Type: 'Digest',
          Algorithm: algo,
          Value: hex,
          Length: `${hex.length} chars`,
          Source: 'Web Crypto API'
        });
      } catch {
        results.push({
          Type: 'Digest',
          Algorithm: algo,
          Value: '❌ 不支持',
          Length: '-',
          Source: 'Web Crypto API'
        });
      }
    }

    const waitForCryptoJS = () => new Promise(resolve => {
      const check = () => window.CryptoJS ? resolve() : setTimeout(check, 100);
      check();
    });

    await waitForCryptoJS();

    const cryptoJSAlgos = {
      'MD5': CryptoJS.MD5,
      'SHA-224': CryptoJS.SHA224,
      'SHA3-256': msg => CryptoJS.SHA3(msg, { outputLength: 256 }),
      'SHA3-384': msg => CryptoJS.SHA3(msg, { outputLength: 384 }),
      'SHA3-512': msg => CryptoJS.SHA3(msg, { outputLength: 512 }),
      'RIPEMD160': CryptoJS.RIPEMD160
    };

    for (const [name, fn] of Object.entries(cryptoJSAlgos)) {
      try {
        const hash = typeof fn === 'function' ? fn(input) : fn(input);
        const hex = hash.toString(CryptoJS.enc.Hex);
        results.push({
          Type: 'Digest',
          Algorithm: name,
          Value: hex,
          Length: `${hex.length} chars`,
          Source: 'CryptoJS'
        });
      } catch {
        results.push({
          Type: 'Digest',
          Algorithm: name,
          Value: '❌ 加载失败',
          Length: '-',
          Source: 'CryptoJS'
        });
      }
    }

    // HMAC 部分
    const hmacAlgos = {
      'HMAC-MD5': CryptoJS.HmacMD5,
      'HMAC-SHA1': CryptoJS.HmacSHA1,
      'HMAC-SHA256': CryptoJS.HmacSHA256,
      'HMAC-SHA384': CryptoJS.HmacSHA384,
      'HMAC-SHA512': CryptoJS.HmacSHA512,
      'HMAC-SHA3-256': (msg, key) => CryptoJS.HmacSHA3(msg, key, { outputLength: 256 }),
      'HMAC-RIPEMD160': CryptoJS.HmacRIPEMD160
    };

    for (const [name, fn] of Object.entries(hmacAlgos)) {
      try {
        const hash = fn(input, key);
        const hex = hash.toString(CryptoJS.enc.Hex);
        results.push({
          Type: 'HMAC',
          Algorithm: name,
          Value: hex,
          Length: `${hex.length} chars`,
          Source: 'CryptoJS'
        });
      } catch {
        results.push({
          Type: 'HMAC',
          Algorithm: name,
          Value: '❌ 加载失败',
          Length: '-',
          Source: 'CryptoJS'
        });
      }
    }

    console.table(results);
    console.log(`✅ 表格已生成。你可以调用 generateDigestTable("你的字符串", "你的密钥") 来测试其他输入。`);
  };

  console.log('🧪 函数 generateDigestTable(input, key) 已注入。控制台调用它可生成摘要与 HMAC 表格。');
})();
