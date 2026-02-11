// ==UserScript==
// @name         ajaxHookerPlus
// @author       cxxjackie, w2f
// @version      1.4.9
// @supportURL   https://bbs.tampermonkey.net.cn/thread-3284-1-1.html
// @license      GNU LGPL-3.0
// ==/UserScript==

var ajaxHooker = function() {
    'use strict';
    const version = '1.4.9';
    const hookInst = {
        hookFns: [],
        filters: []
    };
    const win = window.unsafeWindow || document.defaultView || window;
    let winAh = win.__ajaxHooker;
    const resProto = win.Response.prototype;
    const xhrResponses = ['response', 'responseText', 'responseXML'];
    const fetchResponses = ['arrayBuffer', 'blob', 'formData', 'json', 'text'];
    const xhrExtraProps = ['responseType', 'timeout', 'withCredentials'];
    const fetchExtraProps = ['cache', 'credentials', 'integrity', 'keepalive', 'mode', 'priority', 'redirect', 'referrer', 'referrerPolicy', 'signal'];
    const xhrAsyncEvents = ['readystatechange', 'load', 'loadend'];
    const getType = ({}).toString.call.bind(({}).toString);
    const getDescriptor = Object.getOwnPropertyDescriptor.bind(Object);
    const emptyFn = function() {};
    const errorFn = function(e) { console.error(e); };
    function isThenable(obj) {
        return obj && ['object', 'function'].indexOf(typeof obj) !== -1 && typeof obj.then === 'function';
    }
    function catchError(fn, ...args) {
        try {
            const result = fn.apply(null, args);
            if (isThenable(result)) return result.then(null, errorFn);
            return result;
        } catch (err) {
            console.error(err);
        }
    }
    function defineProp(obj, prop, getter, setter) {
        Object.defineProperty(obj, prop, {
            configurable: true,
            enumerable: true,
            get: getter,
            set: setter
        });
    }
    function readonly(obj, prop, value) {
        if (value === undefined) value = obj[prop];
        defineProp(obj, prop, function() { return value; }, emptyFn);
    }
    function writable(obj, prop, value) {
        if (value === undefined) value = obj[prop];
        Object.defineProperty(obj, prop, {
            configurable: true,
            enumerable: true,
            writable: true,
            value: value
        });
    }
    function parseHeaders(obj) {
        const headers = {};
        switch (getType(obj)) {
            case '[object String]':
                const lines = obj.trim().split(/[\r\n]+/);
                for (var i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const match = line.match(/^([^:]+)\s*:\s*(.*)$/);
                    if (!match) continue;
                    const header = match[1];
                    const value = match[2];
                    if (!value) continue;
                    const lheader = header.toLowerCase();
                    headers[lheader] = lheader in headers ? headers[lheader] + ', ' + value : value;
                }
                break;
            case '[object Headers]':
                try {
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            headers[key] = obj[key];
                        }
                    }
                } catch (e) {
                    try {
                        if (obj.forEach) {
                            obj.forEach(function(val, key) {
                                headers[key] = val;
                            });
                        }
                    } catch (e2) {
                        console.error('parseHeaders error:', e2);
                    }
                }
                break;
            case '[object Object]':
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        headers[key] = obj[key];
                    }
                }
                break;
        }
        return headers;
    }
    function stopImmediatePropagation() {
        this.ajaxHooker_isStopped = true;
    }
    class SyncThenable {
        then(fn) {
            if (fn) fn();
            return new SyncThenable();
        }
    }
    class AHRequest {
        constructor(request) {
            this.request = request;
            this.requestClone = {};
            for (var key in request) {
                if (request.hasOwnProperty(key)) {
                    this.requestClone[key] = request[key];
                }
            }
        }
        _recoverRequestKey(key) {
            if (key in this.requestClone) {
                this.request[key] = this.requestClone[key];
            } else {
                delete this.request[key];
            }
        }
        shouldFilter(filters) {
            const type = this.request.type;
            const url = this.request.url;
            const method = this.request.method;
            const async = this.request.async;
            if (!filters.length) return false;
            for (var i = 0; i < filters.length; i++) {
                const obj = filters[i];
                if (obj.type && obj.type !== type) continue;
                if (getType(obj.url) === '[object String]' && url.indexOf(obj.url) === -1) continue;
                if (getType(obj.url) === '[object RegExp]' && !obj.url.test(url)) continue;
                if (obj.method && obj.method.toUpperCase() !== method.toUpperCase()) continue;
                if ('async' in obj && obj.async !== async) continue;
                return false;
            }
            return true;
        }
        waitForRequestKeys() {
            if (!this.request.async) {
                const hookInsts = win.__ajaxHooker.hookInsts;
                try {
                    for (var inst of hookInsts) {
                        if (this.shouldFilter(inst.filters)) continue;
                        for (var i = 0; i < inst.hookFns.length; i++) {
                            const fn = inst.hookFns[i];
                            if (getType(fn) === '[object Function]') catchError(fn, this.request);
                        }
                        for (var key in this.request) {
                            if (isThenable(this.request[key])) this._recoverRequestKey(key);
                        }
                    }
                } catch (e) {
                    console.error('waitForRequestKeys sync error:', e);
                }
                return new SyncThenable();
            }
            const promises = [];
            const ignoreKeys = {'type': 1, 'async': 1, 'response': 1};
            const hookInsts = win.__ajaxHooker.hookInsts;
            try {
                for (var inst of hookInsts) {
                    if (this.shouldFilter(inst.filters)) continue;
                    const hookPromises = [];
                    for (var i = 0; i < inst.hookFns.length; i++) {
                        hookPromises.push(catchError(inst.hookFns[i], this.request));
                    }
                    promises.push(Promise.all(hookPromises).then(function(inst) {
                        return function() {
                            const requestKeys = [];
                            for (var key in this.request) {
                                if (!ignoreKeys[key]) requestKeys.push(key);
                            }
                            const keyPromises = [];
                            for (var i = 0; i < requestKeys.length; i++) {
                                const key = requestKeys[i];
                                keyPromises.push(Promise.resolve(this.request[key]).then(
                                    function(key) {
                                        return function(val) {
                                            this.request[key] = val;
                                        }.bind(this);
                                    }.call(this, key),
                                    function(key) {
                                        return function() {
                                            this._recoverRequestKey(key);
                                        }.bind(this);
                                    }.call(this, key)
                                ));
                            }
                            return Promise.all(keyPromises);
                        }.bind(this);
                    }.call(this, inst)));
                }
            } catch (e) {
                console.error('waitForRequestKeys async error:', e);
            }
            return Promise.all(promises);
        }
        waitForResponseKeys(response) {
            const responseKeys = this.request.type === 'xhr' ? xhrResponses : fetchResponses;
            if (!this.request.async) {
                if (getType(this.request.response) === '[object Function]') {
                    catchError(this.request.response, response);
                    for (var i = 0; i < responseKeys.length; i++) {
                        const key = responseKeys[i];
                        if ('get' in getDescriptor(response, key) || isThenable(response[key])) {
                            delete response[key];
                        }
                    }
                }
                return new SyncThenable();
            }
            return Promise.resolve(catchError(this.request.response, response)).then(function(responseKeys, response) {
                return function() {
                    const keyPromises = [];
                    for (var i = 0; i < responseKeys.length; i++) {
                        const key = responseKeys[i];
                        keyPromises.push(function(key, response) {
                            return function() {
                                const descriptor = getDescriptor(response, key);
                                if (descriptor && 'value' in descriptor) {
                                    return Promise.resolve(descriptor.value).then(
                                        function(key, response) {
                                            return function(val) {
                                                response[key] = val;
                                            };
                                        }(key, response),
                                        function(key, response) {
                                            return function() {
                                                delete response[key];
                                            };
                                        }(key, response)
                                    );
                                } else {
                                    delete response[key];
                                }
                            };
                        }(key, response)());
                    }
                    return Promise.all(keyPromises);
                };
            }.call(this, responseKeys, response));
        }
    }
    const proxyHandler = {
        get: function(target, prop) {
            const descriptor = getDescriptor(target, prop);
            if (descriptor && !descriptor.configurable && !descriptor.writable && !descriptor.get) return target[prop];
            const ah = target.__ajaxHooker;
            if (ah && ah.proxyProps) {
                if (prop in ah.proxyProps) {
                    const pDescriptor = ah.proxyProps[prop];
                    if ('get' in pDescriptor) return pDescriptor.get();
                    if (typeof pDescriptor.value === 'function') return pDescriptor.value.bind(ah);
                    return pDescriptor.value;
                }
                if (typeof target[prop] === 'function') return target[prop].bind(target);
            }
            return target[prop];
        },
        set: function(target, prop, value) {
            const descriptor = getDescriptor(target, prop);
            if (descriptor && !descriptor.configurable && !descriptor.writable && !descriptor.set) return true;
            const ah = target.__ajaxHooker;
            if (ah && ah.proxyProps && prop in ah.proxyProps) {
                const pDescriptor = ah.proxyProps[prop];
                if (pDescriptor.set) {
                    pDescriptor.set(value);
                } else {
                    pDescriptor.value = value;
                }
            } else {
                target[prop] = value;
            }
            return true;
        }
    };
    class XhrHooker {
        constructor(xhr) {
            const ah = this;
            Object.assign(ah, {
                originalXhr: xhr,
                proxyXhr: new Proxy(xhr, proxyHandler),
                resThenable: new SyncThenable(),
                proxyProps: {},
                proxyEvents: {}
            });
            xhr.addEventListener('readystatechange', function(e) {
                if (ah.proxyXhr.readyState === 4 && ah.request && typeof ah.request.response === 'function') {
                    const response = {
                        finalUrl: ah.proxyXhr.responseURL,
                        status: ah.proxyXhr.status,
                        responseHeaders: parseHeaders(ah.proxyXhr.getAllResponseHeaders())
                    };
                    const tempValues = {};
                    for (var i = 0; i < xhrResponses.length; i++) {
                        const key = xhrResponses[i];
                        try {
                            tempValues[key] = ah.originalXhr[key];
                        } catch (err) {}
                        defineProp(response, key, function(key) {
                            return function() {
                                return response[key] = tempValues[key];
                            };
                        }(key), function(key) {
                            return function(val) {
                                delete response[key];
                                response[key] = val;
                            };
                        }(key));
                    }
                    ah.resThenable = new AHRequest(ah.request).waitForResponseKeys(response).then(function(ah, response, tempValues) {
                        return function() {
                            for (var i = 0; i < xhrResponses.length; i++) {
                                const key = xhrResponses[i];
                                ah.proxyProps[key] = {get: function(key, response, tempValues) {
                                    return function() {
                                        if (!(key in response)) response[key] = tempValues[key];
                                        return response[key];
                                    };
                                }(key, response, tempValues)};
                            }
                        };
                    }(ah, response, tempValues));
                }
                ah.dispatchEvent(e);
            });
            xhr.addEventListener('load', function(e) { ah.dispatchEvent(e); });
            xhr.addEventListener('loadend', function(e) { ah.dispatchEvent(e); });
            for (var i = 0; i < xhrAsyncEvents.length; i++) {
                const evt = xhrAsyncEvents[i];
                const onEvt = 'on' + evt;
                ah.proxyProps[onEvt] = {
                    get: function(onEvt, ah) {
                        return function() {
                            return ah.proxyEvents[onEvt] || null;
                        };
                    }(onEvt, ah),
                    set: function(onEvt, ah) {
                        return function(val) {
                            ah.addEvent(onEvt, val);
                        };
                    }(onEvt, ah)
                };
            }
            const methods = ['setRequestHeader', 'addEventListener', 'removeEventListener', 'open', 'send'];
            for (var i = 0; i < methods.length; i++) {
                const method = methods[i];
                ah.proxyProps[method] = {value: ah[method]};
            }
        }
        toJSON() {} // Converting circular structure to JSON
        addEvent(type, event) {
            if (type.indexOf('on') === 0) {
                this.proxyEvents[type] = typeof event === 'function' ? event : null;
            } else {
                if (typeof event === 'object' && event !== null) event = event.handleEvent;
                if (typeof event !== 'function') return;
                if (!this.proxyEvents[type]) this.proxyEvents[type] = new Set();
                this.proxyEvents[type].add(event);
            }
        }
        removeEvent(type, event) {
            if (type.indexOf('on') === 0) {
                this.proxyEvents[type] = null;
            } else {
                if (typeof event === 'object' && event !== null) event = event.handleEvent;
                if (this.proxyEvents[type]) this.proxyEvents[type].delete(event);
            }
        }
        dispatchEvent(e) {
            e.stopImmediatePropagation = stopImmediatePropagation;
            defineProp(e, 'target', function() { return this.proxyXhr; }.bind(this));
            defineProp(e, 'currentTarget', function() { return this.proxyXhr; }.bind(this));
            defineProp(e, 'srcElement', function() { return this.proxyXhr; }.bind(this));
            if (this.proxyEvents[e.type]) {
                try {
                    for (var fn of this.proxyEvents[e.type]) {
                        this.resThenable.then(function(fn, e, self) {
                            return function() {
                                if (!e.ajaxHooker_isStopped) fn.call(self.proxyXhr, e);
                            };
                        }(fn, e, this));
                    }
                } catch (e2) {
                    console.error('dispatchEvent error:', e2);
                }
            }
            if (e.ajaxHooker_isStopped) return;
            const onEvent = this.proxyEvents['on' + e.type];
            if (onEvent) {
                this.resThenable.then(function(onEvent, e, self) {
                    return function() {
                        onEvent.call(self.proxyXhr, e);
                    };
                }(onEvent, e, this));
            }
        }
        setRequestHeader(header, value) {
            this.originalXhr.setRequestHeader(header, value);
            if (!this.request) return;
            const headers = this.request.headers;
            headers[header] = header in headers ? headers[header] + ', ' + value : value;
        }
        addEventListener() {
            const args = Array.prototype.slice.call(arguments);
            if (xhrAsyncEvents.indexOf(args[0]) !== -1) {
                this.addEvent(args[0], args[1]);
            } else {
                this.originalXhr.addEventListener.apply(this.originalXhr, args);
            }
        }
        removeEventListener() {
            const args = Array.prototype.slice.call(arguments);
            if (xhrAsyncEvents.indexOf(args[0]) !== -1) {
                this.removeEvent(args[0], args[1]);
            } else {
                this.originalXhr.removeEventListener.apply(this.originalXhr, args);
            }
        }
        open(method, url, async, ...args) {
            if (async === undefined) async = true;
            this.request = {
                type: 'xhr',
                url: url.toString(),
                method: method.toUpperCase(),
                abort: false,
                headers: {},
                data: null,
                response: null,
                async: !!async
            };
            this.openArgs = args;
            this.resThenable = new SyncThenable();
            const keys = ['responseURL', 'readyState', 'status', 'statusText'];
            for (var i = 0; i < xhrResponses.length; i++) {
                keys.push(xhrResponses[i]);
            }
            for (var i = 0; i < keys.length; i++) {
                delete this.proxyProps[keys[i]];
            }
            return this.originalXhr.open(method, url, async, ...args);
        }
        send(data) {
            const ah = this;
            const xhr = ah.originalXhr;
            const request = ah.request;
            if (!request) return xhr.send(data);
            request.data = data;
            new AHRequest(request).waitForRequestKeys().then(function(ah, xhr, request) {
                return function() {
                    if (request.abort) {
                        if (typeof request.response === 'function') {
                            Object.assign(ah.proxyProps, {
                                responseURL: {value: request.url},
                                readyState: {value: 4},
                                status: {value: 200},
                                statusText: {value: 'OK'}
                            });
                            for (var i = 0; i < xhrAsyncEvents.length; i++) {
                                const evt = xhrAsyncEvents[i];
                                try {
                                    xhr.dispatchEvent(new Event(evt));
                                } catch (e) {
                                    try {
                                        const event = document.createEvent('Event');
                                        event.initEvent(evt, true, true);
                                        xhr.dispatchEvent(event);
                                    } catch (e2) {
                                        console.error('dispatchEvent error:', e2);
                                    }
                                }
                            }
                        }
                    } else {
                        xhr.open(request.method, request.url, request.async, ...ah.openArgs);
                        for (var header in request.headers) {
                            xhr.setRequestHeader(header, request.headers[header]);
                        }
                        for (var i = 0; i < xhrExtraProps.length; i++) {
                            const prop = xhrExtraProps[i];
                            if (prop in request) xhr[prop] = request[prop];
                        }
                        xhr.send(request.data);
                    }
                };
            }(ah, xhr, request));
        }
    }
    function fakeXHR() {
        const xhr = new winAh.realXHR();
        if ('__ajaxHooker' in xhr) console.warn('检测到不同版本的ajaxHooker，可能发生冲突！');
        xhr.__ajaxHooker = new XhrHooker(xhr);
        return xhr.__ajaxHooker.proxyXhr;
    }
    fakeXHR.prototype = win.XMLHttpRequest.prototype;
    Object.keys(win.XMLHttpRequest).forEach(function(key) {
        fakeXHR[key] = win.XMLHttpRequest[key];
    });
    function fakeFetch(url, options) {
        if (options === undefined) options = {};
        if (!url) return winAh.realFetch.call(win, url, options);
        return new Promise(function(resolve, reject) {
            const init = {};
            if (getType(url) === '[object Request]') {
                init.method = url.method;
                init.headers = url.headers;
                if (url.body) {
                    url.arrayBuffer().then(function(body) {
                        init.body = body;
                        processFetchRequest();
                    }).catch(function() {
                        processFetchRequest();
                    });
                } else {
                    processFetchRequest();
                }
            } else {
                processFetchRequest();
            }
            function processFetchRequest() {
                let requestUrl = url;
                if (getType(url) === '[object Request]') {
                    for (var i = 0; i < fetchExtraProps.length; i++) {
                        const prop = fetchExtraProps[i];
                        init[prop] = url[prop];
                    }
                    requestUrl = url.url;
                }
                requestUrl = requestUrl.toString();
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        init[key] = options[key];
                    }
                }
                init.method = init.method || 'GET';
                init.headers = init.headers || {};
                const request = {
                    type: 'fetch',
                    url: requestUrl,
                    method: init.method.toUpperCase(),
                    abort: false,
                    headers: parseHeaders(init.headers),
                    data: init.body,
                    response: null,
                    async: true
                };
                const req = new AHRequest(request);
                req.waitForRequestKeys().then(function(req, request, init, resolve, reject) {
                    return function() {
                        if (request.abort) {
                            if (typeof request.response === 'function') {
                                const response = {
                                    finalUrl: request.url,
                                    status: 200,
                                    responseHeaders: {}
                                };
                                req.waitForResponseKeys(response).then(function(response, request, resolve) {
                                    return function() {
                                        let key, val;
                                        for (var i = 0; i < fetchResponses.length; i++) {
                                            if (fetchResponses[i] in response) {
                                                key = fetchResponses[i];
                                                val = response[key];
                                                break;
                                            }
                                        }
                                        if (key === 'json' && typeof val === 'object') {
                                            val = catchError(JSON.stringify.bind(JSON), val);
                                        }
                                        const res = new Response(val, {
                                            status: 200,
                                            statusText: 'OK'
                                        });
                                        defineProp(res, 'type', function() { return 'basic'; });
                                        defineProp(res, 'url', function() { return request.url; });
                                        resolve(res);
                                    };
                                }(response, request, resolve));
                            } else {
                                reject(new DOMException('aborted', 'AbortError'));
                            }
                            return;
                        }
                        init.method = request.method;
                        init.headers = request.headers;
                        init.body = request.data;
                        for (var i = 0; i < fetchExtraProps.length; i++) {
                            const prop = fetchExtraProps[i];
                            if (prop in request) init[prop] = request[prop];
                        }
                        winAh.realFetch.call(win, request.url, init).then(function(res) {
                            if (typeof request.response === 'function') {
                                const response = {
                                    finalUrl: res.url,
                                    status: res.status,
                                    responseHeaders: parseHeaders(res.headers)
                                };
                                if (res.ok) {
                                    for (var i = 0; i < fetchResponses.length; i++) {
                                        const key = fetchResponses[i];
                                        res[key] = function(key, response, req) {
                                            return function() {
                                                if (key in response) return Promise.resolve(response[key]);
                                                return resProto[key].call(this).then(function(val, key, response, req) {
                                                    return function() {
                                                        response[key] = val;
                                                        return req.waitForResponseKeys(response).then(function(key, response, val) {
                                                            return function() {
                                                                return key in response ? response[key] : val;
                                                            };
                                                        }(key, response, val));
                                                    };
                                                }.call(this, key, response, req));
                                            };
                                        }(key, response, req);
                                    }
                                } else {
                                    catchError(request.response, response);
                                }
                            }
                            resolve(res);
                        }, reject);
                    };
                }(req, request, init, resolve, reject));
            }
        });
    }
    function fakeFetchClone() {
        const descriptors = Object.getOwnPropertyDescriptors(this);
        const res = winAh.realFetchClone.call(this);
        Object.defineProperties(res, descriptors);
        return res;
    }
    // 拦截媒体资源请求（media类型）
    function interceptMediaRequests() {
        try {
            // 尝试使用MutationObserver监控DOM变化
            if (typeof MutationObserver === 'function') {
                const observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                        const mutation = mutations[i];
                        // 处理新添加的节点
                        for (var j = 0; j < mutation.addedNodes.length; j++) {
                            const node = mutation.addedNodes[j];
                            if (node.nodeType === 1) { // 元素节点
                                // 检查是否是媒体元素
                                if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
                                    processMediaElement(node);
                                }
                                // 检查子元素中的媒体元素
                                try {
                                    const mediaElements = node.querySelectorAll('video, audio');
                                    for (var k = 0; k < mediaElements.length; k++) {
                                        processMediaElement(mediaElements[k]);
                                    }
                                } catch (e) {
                                    console.error('querySelectorAll error:', e);
                                }
                            }
                        }
                        // 处理属性变化
                        if (mutation.type === 'attributes' && mutation.target.tagName) {
                            const tagName = mutation.target.tagName.toLowerCase();
                            if ((tagName === 'video' || tagName === 'audio') && mutation.attributeName === 'src') {
                                processMediaElement(mutation.target);
                            }
                        }
                    }
                });
                // 配置观察者
                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['src']
                });
            }
            // 处理现有媒体元素
            try {
                const mediaElements = document.querySelectorAll('video, audio');
                for (var i = 0; i < mediaElements.length; i++) {
                    processMediaElement(mediaElements[i]);
                }
            } catch (e) {
                console.error('querySelectorAll error:', e);
            }
            // 尝试拦截HTMLMediaElement的src属性
            if (typeof HTMLMediaElement !== 'undefined' && HTMLMediaElement.prototype) {
                const srcDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
                if (srcDescriptor && srcDescriptor.set) {
                    const originalSetSrc = srcDescriptor.set;
                    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
                        set: function(value) {
                            if (value) {
                                createMediaRequest(value, this.tagName.toLowerCase());
                            }
                            return originalSetSrc.call(this, value);
                        }
                    });
                }
            }
        } catch (e) {
            console.error('interceptMediaRequests error:', e);
        }
    }
    // 处理媒体元素
    function processMediaElement(element) {
        try {
            // 检查src属性
            if (element.src) {
                createMediaRequest(element.src, element.tagName.toLowerCase());
            }
            // 监听loadstart事件，捕获动态设置的媒体源
            element.addEventListener('loadstart', function(e) {
                try {
                    const target = e.target;
                    if (target.currentSrc) {
                        createMediaRequest(target.currentSrc, target.tagName.toLowerCase());
                    }
                } catch (e) {
                    console.error('loadstart event error:', e);
                }
            });
        } catch (e) {
            console.error('processMediaElement error:', e);
        }
    }
    // 创建媒体请求
    function createMediaRequest(url, mediaType) {
        try {
            const request = {
                type: 'media',
                url: url,
                method: 'GET',
                abort: false,
                headers: {},
                data: null,
                response: null,
                async: true,
                mediaType: mediaType
            };
            const req = new AHRequest(request);
            req.waitForRequestKeys().then(function() {
                if (request.abort) {
                    // 媒体请求无法中止，只能忽略
                }
            });
        } catch (e) {
            console.error('createMediaRequest error:', e);
        }
    }
    winAh = win.__ajaxHooker = winAh || {
        version, fakeXHR, fakeFetch, fakeFetchClone,
        realXHR: win.XMLHttpRequest,
        realFetch: win.fetch,
        realFetchClone: resProto.clone,
        hookInsts: new Set()
    };
    if (winAh.version !== version) console.warn('检测到不同版本的ajaxHooker，可能发生冲突！');
    win.XMLHttpRequest = winAh.fakeXHR;
    if (typeof win.fetch === 'function') {
        win.fetch = winAh.fakeFetch;
        resProto.clone = winAh.fakeFetchClone;
    }
    winAh.hookInsts.add(hookInst);
    // 针对头条、抖音 secsdk.umd.js 的兼容性处理
    class AHFunction extends Function {
        call(thisArg, ...args) {
            if (thisArg && thisArg.__ajaxHooker && thisArg.__ajaxHooker.proxyXhr === thisArg) {
                thisArg = thisArg.__ajaxHooker.originalXhr;
            }
            return Reflect.apply(this, thisArg, args);
        }
        apply(thisArg, args) {
            if (thisArg && thisArg.__ajaxHooker && thisArg.__ajaxHooker.proxyXhr === thisArg) {
                thisArg = thisArg.__ajaxHooker.originalXhr;
            }
            return Reflect.apply(this, thisArg, args || []);
        }
    }
    function hookSecsdk(csrf) {
        Object.setPrototypeOf(csrf.nativeXMLHttpRequestSetRequestHeader, AHFunction.prototype);
        Object.setPrototypeOf(csrf.nativeXMLHttpRequestOpen, AHFunction.prototype);
        Object.setPrototypeOf(csrf.nativeXMLHttpRequestSend, AHFunction.prototype);
    }
    if (win.secsdk) {
        if (win.secsdk.csrf && win.secsdk.csrf.nativeXMLHttpRequestOpen) hookSecsdk(win.secsdk.csrf);
    } else {
        defineProp(win, 'secsdk', emptyFn, function(secsdk) {
            delete win.secsdk;
            win.secsdk = secsdk;
            defineProp(secsdk, 'csrf', emptyFn, function(csrf) {
                delete secsdk.csrf;
                secsdk.csrf = csrf;
                if (csrf.nativeXMLHttpRequestOpen) hookSecsdk(csrf);
            });
        });
    }
    // 初始化媒体请求拦截
    try {
        if (typeof document !== 'undefined') {
            if (document.readyState === 'loading') {
                if (document.addEventListener) {
                    document.addEventListener('DOMContentLoaded', interceptMediaRequests);
                } else if (document.attachEvent) {
                    document.attachEvent('onreadystatechange', function() {
                        if (document.readyState === 'complete') {
                            interceptMediaRequests();
                        }
                    });
                }
            } else {
                interceptMediaRequests();
            }
        }
    } catch (e) {
        console.error('init media interceptor error:', e);
    }
    return {
        hook: function(fn) {
            hookInst.hookFns.push(fn);
        },
        filter: function(arr) {
            if (Array.isArray(arr)) hookInst.filters = arr;
        },
        protect: function() {
            readonly(win, 'XMLHttpRequest', winAh.fakeXHR);
            if (typeof win.fetch === 'function') {
                readonly(win, 'fetch', winAh.fakeFetch);
                readonly(resProto, 'clone', winAh.fakeFetchClone);
            }
        },
        unhook: function() {
            winAh.hookInsts.delete(hookInst);
            if (!winAh.hookInsts.size) {
                writable(win, 'XMLHttpRequest', winAh.realXHR);
                if (typeof win.fetch === 'function') {
                    writable(win, 'fetch', winAh.realFetch);
                    writable(resProto, 'clone', winAh.realFetchClone);
                }
                delete win.__ajaxHooker;
            }
        }
    };
}();