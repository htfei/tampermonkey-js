// ==UserScript==
// @name         查看全局属性
// @description  一键查看挂载到window上的非原生属性，并注入一个$searchKey函数搜索属性名。
// @namespace    cxxjackie
// @author       cxxjackie
// @version      2.0.4
// @match        *://*/*
// @grant        unsafeWindow
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @homepage     https://bbs.tampermonkey.net.cn/thread-916-1-1.html
// @supportURL   https://bbs.tampermonkey.net.cn/thread-916-1-1.html
// ==/UserScript==

(function() {
    'use strict';

    // 最大搜索深度，0不设限。此参数影响注入时间和内存占用，谨慎修改
    const MAX_DEPTH = 20;
    // iframe的id
    const IFRAME_ID = 'iframe_for_test';
    // 搜索函数名
    const SEARCH_FUNCTION_NAME = '$searchKey';
    // 忽略的属性
    const IGNORE_PROPS = ['length', 'arguments', 'caller', 'prototype', 'constructor'];
    // vue额外忽略的属性
    const VUE_IGNORE_PROPS = [];
    // react额外忽略的属性
    const REACT_IGNORE_PROPS = ['memoizedState', 'updateQueue'];

    const document = unsafeWindow.document;
    const tag = unsafeWindow === unsafeWindow.top ? 'top' : location.origin + location.pathname;
    GM_registerMenuCommand(tag, async () => {
        let iframe = document.getElementById(IFRAME_ID);
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = IFRAME_ID;
            iframe.style.display = 'none';
            document.body.appendChild(iframe); // iframe不能移除
        }
        const iWindow = iframe.contentWindow;
        // 反劫持
        const {Object, String, Array, Set, Map, WeakMap, RegExp, Promise, console} = iWindow;

        // 获取类型
        const objToString = Object.prototype.toString;
        function getType(item) {
            const str = new String(objToString.call(item));
            return str.slice(8, -1).toLowerCase();
        }
        // 获取全属性，包括原型链上的
        const objProto = unsafeWindow.Object.prototype;
        const funcProto = unsafeWindow.Function.prototype;
        function getAllProps(obj) {
            const props = new Set();
            let proto = obj;
            while (proto !== null && proto !== objProto && proto !== funcProto) {
                Object.getOwnPropertyNames(proto).forEach(prop => props.add(prop));
                proto = Object.getPrototypeOf(proto);
            }
            return props;
        }
        // 是否为纯数字
        const numRE = new RegExp(/^\d+$/);
        function isNum(str) {
            return numRE.test(str);
        }
        // 空函数
        function emptyFn() {}
        // 获取所有元素和注释节点
        function getAllNodes() {
            const result = new Array(document.documentElement);
            function getChildren(node) {
                for (const child of node.childNodes) {
                    if (child.nodeType === 1 || child.nodeType === 8) {
                        result.push(child);
                        getChildren(child);
                    }
                }
            }
            getChildren(document.documentElement);
            return result;
        }
        // 属性收集类
        class KeyCollector {
            constructor(ignoreProps) {
                this.ignoreProps = ignoreProps;
                this.allKeys = new Map();
                this.taskList = new Array();
                this._init();
            }
            _init() {
                this.refs = new WeakMap([[unsafeWindow, {path: 'window', root: 'window'}]]);
                this.tempKeys = new Map();
                this.discardKeys = new Map();
            }
            _calcDepth(obj) {
                let _obj = obj;
                let item = this.refs.get(obj);
                let depth = 0;
                while (item.parent) {
                    _obj = item.parent;
                    item = this.refs.get(_obj);
                    depth++;
                }
                return depth;
            }
            async _collectKeys(obj, item, recordDiscard = true, depth = 0) {
                if (obj === null || (typeof obj !== 'function' && typeof obj !== 'object')) return;
                if (obj instanceof Node) return;
                if (MAX_DEPTH > 0 && depth >= MAX_DEPTH) {
                    if (recordDiscard) this.discardKeys.set(obj, item);
                    return;
                }
                if (this.refs.has(obj)) {
                    if (depth < this._calcDepth(obj)) this.refs.set(obj, item);
                    return;
                }
                this.refs.set(obj, item);
                const keys = getAllProps(obj);
                for (const key of keys) {
                    if (!this.ignoreProps.has(key)) {
                        let value;
                        try {
                            value = obj[key];
                        } catch (e) {
                            continue;
                        }
                        if (value instanceof Promise) {
                            value.catch(emptyFn);
                            continue;
                        }
                        const val = this.tempKeys.get(key) || new Set();
                        val.add({
                            value: value,
                            parent: obj
                        });
                        this.tempKeys.set(key, val);
                        const _item = {
                            root: item.root,
                            parent: obj,
                            key: key,
                            extra: item.extra
                        };
                        await this._collectKeys(value, _item, recordDiscard, depth + 1);
                    }
                }
            }
            _generatePath(obj) {
                if (obj.path) return;
                if (!obj.parent) {
                    obj.path = obj.root;
                    return;
                }
                const parent = this.refs.get(obj.parent);
                obj.extra = parent.extra;
                this._generatePath(parent);
                obj.path = parent.path + (isNum(obj.key) ? `[${obj.key}]` : `['${obj.key}']`);
            }
            _generateAllPaths() {
                for (const [key, val] of this.tempKeys) {
                    for (const obj of val) {
                        const item = this.refs.get(obj.value);
                        if (item && item.key === key) {
                            if (!item.added) {
                                this._generatePath(item);
                                this.addKey(key, item.path, item.extra);
                                item.added = true;
                            }
                        } else {
                            const parent = this.refs.get(obj.parent);
                            this._generatePath(parent);
                            const path = isNum(key) ? `${parent.path}[${key}]` : `${parent.path}['${key}']`;
                            this.addKey(key, path, parent.extra);
                        }
                    }
                }
            }
            addKey(key, path, extra = null) {
                const arr = this.allKeys.get(key) || new Set();
                arr.add(extra ? {path, ...extra} : path);
                this.allKeys.set(key, arr);
            }
            collect(obj, root, extra = null) {
                let key;
                if (extra) {
                    key = extra.prop;
                } else {
                    const keys = String.prototype.match.call(root, /(?<=[.\[]['"]?)[^'".\[\]]+/g);
                    if (keys) key = keys.pop();
                }
                this.taskList.push(this._collectKeys(obj, {root, key, extra}));
            }
            async getAllKeys() {
                await Promise.all(this.taskList);
                for (const [obj, item] of this.discardKeys) {
                    const depth = this._calcDepth(item.parent) + 1;
                    if (depth < MAX_DEPTH) {
                        await this._collectKeys(obj, item, false, depth);
                    }
                }
                this._generateAllPaths();
                this._init();
                return this.allKeys;
            }
        }

        // 获取全局属性
        const globalProps = new Object();
        const wKeys = Object.getOwnPropertyNames(unsafeWindow);
        const iKeys = Object.getOwnPropertyNames(iWindow);
        for (const key of wKeys) {
            if (!isNum(key) && !iKeys.includes(key)) {
                const type = getType(unsafeWindow[key]);
                globalProps[type] = globalProps[type] || new Array();
                globalProps[type].push(key);
            }
        }
        console.log(`${tag} 全局属性：\n%o`, globalProps);

        // 注入函数
        const kc = new KeyCollector(new Set(IGNORE_PROPS));
        for (const type in globalProps) {
            for (const key of globalProps[type]) {
                const path = `window['${key}']`;
                kc.addKey(key, path);
                kc.collect(unsafeWindow[key], path);
            }
        }
        const globalKeys = await kc.getAllKeys();
        const vkc = new KeyCollector(new Set([...IGNORE_PROPS, ...VUE_IGNORE_PROPS]));
        const rkc = new KeyCollector(new Set([...IGNORE_PROPS, ...REACT_IGNORE_PROPS]));
        for (const node of getAllNodes()) {
            for (const prop of Object.getOwnPropertyNames(node)) {
                if (prop.startsWith('__vue')) {
                    vkc.collect(node[prop], `node['${prop}']`, {node});
                }
                if (prop.startsWith('__react')) {
                    rkc.collect(node[prop], `node['${prop}']`, {node});
                }
            }
        }
        const vueKeys = await vkc.getAllKeys();
        const reactKeys = await rkc.getAllKeys();
        unsafeWindow[SEARCH_FUNCTION_NAME] = (key, fuzzy) => {
            if (fuzzy) {
                const result = new Array();
                const lowerKey = key.toLowerCase();
                for (const _key of globalKeys.keys()) {
                    if (_key.toLowerCase().includes(lowerKey)) {
                        result.push(...globalKeys.get(_key));
                    }
                }
                for (const _key of vueKeys.keys()) {
                    if (_key.toLowerCase().includes(lowerKey)) {
                        result.push(...vueKeys.get(_key));
                    }
                }
                for (const _key of reactKeys.keys()) {
                    if (_key.toLowerCase().includes(lowerKey)) {
                        result.push(...reactKeys.get(_key));
                    }
                }
                console.log(result);
            } else {
                const globalResult = globalKeys.get(key) || [];
                const vueResult = vueKeys.get(key) || [];
                const reactResult = reactKeys.get(key) || [];
                console.log([...globalResult, ...vueResult, ...reactResult]);
            }
        };
        console.log(`${SEARCH_FUNCTION_NAME}函数已注入！$searchKey('_isVue')
$searchKey('m3u8',1)
$searchKey('video',1)
$searchKey('player',1)
$searchKey('playurl',1)
$searchKey('hls',1)
$searchKey('formatUrl',1)
$searchKey('playPath',1)
document.querySelector("#videoContent").__vue__.tryVideoUrl`);
    });
})();