// ==UserScript==
// @name         [tools]🚧SM2/SM3/SM4 国密算法演示
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  演示 SM2 加密解密、SM3 哈希、SM4 对称加密解密（CBC 模式）
// @author       Copilot
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 动态加载 sm-crypto 库
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/sm-crypto@0.3.13/dist/sm2.min.js';
    script.onload = () => {
        const { sm2, sm3, sm4 } = window.smCrypto;

        console.log('%c✅ SM2/SM3/SM4 演示开始', 'color: green; font-weight: bold;');

        // === SM2 加密解密 ===
        const sm2Message = '这是一条需要SM2加密的机密信息。';
        const sm2KeyPair = sm2.generateKeyPairHex();
        const sm2Encrypted = sm2.encrypt(sm2Message, sm2KeyPair.publicKey, { cipherMode: 1 });
        const sm2Decrypted = sm2.decrypt(sm2Encrypted, sm2KeyPair.privateKey, { cipherMode: 1 });

        console.group('%c[SM2 加密解密]', 'color: blue; font-weight: bold;');
        console.log('原始消息:', sm2Message);
        console.log('加密结果:', sm2Encrypted);
        console.log('解密结果:', sm2Decrypted);
        console.log('验证成功:', sm2Message === sm2Decrypted);
        console.groupEnd();

        // === SM3 哈希计算 ===
        const sm3Message = '这是一条需要计算SM3哈希的消息。';
        const sm3Hash = sm3(sm3Message);

        console.group('%c[SM3 摘要算法]', 'color: purple; font-weight: bold;');
        console.log('原始消息:', sm3Message);
        console.log('SM3 哈希值:', sm3Hash);
        console.groupEnd();

        // === SM4 对称加密解密（CBC 模式） ===
        const sm4Message = '这是一条需要使用SM4进行对称加密的机密信息。';
        const sm4Key = '0123456789abcdeffedcba9876543210'; // 16字节十六进制
        const sm4Iv = '0123456789abcdeffedcba9876543210';  // 16字节十六进制

        const sm4Encrypted = sm4.encrypt(sm4Message, sm4Key, {
            mode: 'cbc',
            iv: sm4Iv,
            padding: 'pkcs7'
        });

        const sm4Decrypted = sm4.decrypt(sm4Encrypted, sm4Key, {
            mode: 'cbc',
            iv: sm4Iv,
            padding: 'pkcs7'
        });

        console.group('%c[SM4 对称加密]', 'color: orange; font-weight: bold;');
        console.log('原始消息:', sm4Message);
        console.log('加密结果:', sm4Encrypted);
        console.log('解密结果:', sm4Decrypted);
        console.log('验证成功:', sm4Message === sm4Decrypted);
        console.groupEnd();
    };

    document.head.appendChild(script);
})();
