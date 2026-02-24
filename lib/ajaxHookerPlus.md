# ajaxHookerPlus

基于 [cxxjackie](https://bbs.tampermonkey.net.cn/thread-3284-1-1.html) 的 ajaxHooker 增强版，支持缓存请求拦截和响应内容修改。

## 版本信息

- **版本**: 1.5.5
- **作者**: cxxjackie, w2f
- **许可证**: GNU LGPL-3.0

## 特性

- 支持 XHR 和 Fetch 、Media 类型请求拦截
- 支持同步和异步 hook 函数
- **支持缓存请求拦截**（v1.5.0+ 新增）
- **支持修改响应内容**（responseText 等）
- 支持媒体资源请求拦截（video/audio）

## 快速开始

### 基本用法

```javascript
// 拦截所有请求
ajaxHooker.hook(request => {
    console.log('请求类型:', request.type);
    console.log('请求URL:', request.url);
    console.log('请求方法:', request.method);
});
```

### 过滤请求

```javascript
// 只拦截特定URL的请求
ajaxHooker.filter([
    { url: 'api.example.com' },
    { url: /\.m3u8$/ }
]);

ajaxHooker.hook(request => {
    // 只有匹配过滤规则的请求才会被处理
    console.log('拦截到请求:', request.url);
});
```

### 修改请求

```javascript
ajaxHooker.hook(request => {
    // 修改请求URL
    request.url = request.url.replace('http://', 'https://');
    
    // 修改请求头
    request.headers['X-Custom-Header'] = 'value';
    
    // 修改请求体
    request.data = JSON.stringify({ key: 'value' });
});
```

### 修改响应

```javascript
ajaxHooker.hook(request => {
    request.response = res => {
        console.log('原始响应:', res.responseText);
        
        // 修改响应内容
        res.responseText = res.responseText.replace(/old/g, 'new');
        
        // 返回修改后的内容（用于缓存请求）
        return res.responseText;
    };
});
```

### 中止请求

```javascript
ajaxHooker.hook(request => {
    if (request.url.indexOf('tracking') !== -1) {
        request.abort = true; // 中止请求
    }
});
```

## API 文档

### ajaxHooker.hook(fn)

注册一个 hook 函数，每次请求发生时自动调用。

**参数:**
- `fn` - 回调函数，接收 `request` 对象

**request 对象属性:**

| 属性 | 类型 | 说明 |
|------|------|------|
| type | string | 请求类型: 'xhr', 'fetch', 'media' |
| url | string | 请求URL |
| method | string | 请求方法 (GET, POST 等) |
| headers | object | 请求头 |
| data | any | 请求体数据 |
| async | boolean | 是否异步请求 |
| abort | boolean | 是否中止请求 |
| response | function | 响应处理回调函数 |

### ajaxHooker.filter(arr)

设置过滤规则，只有匹配规则的请求才会触发 hook。

**参数:**
- `arr` - 过滤规则数组

**过滤规则属性:**

| 属性 | 类型 | 说明 |
|------|------|------|
| type | string | 请求类型 |
| url | string/RegExp | URL 匹配规则 |
| method | string | 请求方法 |
| async | boolean | 是否异步 |

### ajaxHooker.protect()

保护 hook 不被其他脚本覆盖。

```javascript
ajaxHooker.protect();
```

### ajaxHooker.unhook()

移除当前注册的 hook。

```javascript
ajaxHooker.unhook();
```

### ajaxHooker.checkHook()

检测 hook 是否仍然有效。

**返回值:**
```javascript
{
    xhr: boolean,    // XHR hook 是否有效
    fetch: boolean   // Fetch hook 是否有效
}
```

## 响应对象

在 `request.response` 回调中，`res` 对象包含以下属性：

| 属性 | 类型 | 说明 |
|------|------|------|
| finalUrl | string | 最终请求URL（可能经过重定向） |
| status | number | HTTP 状态码 |
| responseHeaders | object | 响应头 |
| response | any | 响应体（XHR） |
| responseText | string | 响应文本（XHR） |
| responseXML | Document | 响应XML（XHR，仅当 responseType 为空或 document 时可用） |

## 缓存请求处理

从 v1.5.0 开始，支持拦截浏览器缓存的请求。关键技术：

1. **双重 hook 机制**: 同时使用 `fakeXHR` 和原型链 hook
2. **同步修改机制**: 在 `responseText` getter 中同步触发 response 回调
3. **防重复处理**: 通过标志位确保回调只执行一次

### 注意事项

对于缓存请求，`request.response` 回调必须**同步返回**修改后的内容：

```javascript
// ✅ 正确 - 同步函数
ajaxHooker.hook(request => {
    request.response = res => {
        return modifyContent(res.responseText);
    };
});

// ❌ 错误 - async 函数会导致缓存请求无法正确修改
ajaxHooker.hook(async request => {
    request.response = async res => {
        return await modifyContent(res.responseText);
    };
});
```

## 完整示例

### 拦截 m3u8 文件并修改内容

```javascript
// 设置过滤规则
ajaxHooker.filter([
    { url: /\.m3u8$/ }
]);

// 注册 hook
ajaxHooker.hook(request => {
    console.log('拦截到 m3u8 请求:', request.url);
    
    request.response = res => {
        let content = res.responseText;
        
        // 修改 m3u8 内容
        // 例如：添加额外的 ts 分片
        
        console.log('原始长度:', content.length);
        console.log('修改后长度:', content.length);
        
        return content; // 返回修改后的内容
    };
});
```

### 拦截 API 请求并修改响应

```javascript
ajaxHooker.filter([
    { url: '/api/' }
]);

ajaxHooker.hook(request => {
    request.response = res => {
        try {
            const data = JSON.parse(res.responseText);
            
            // 修改响应数据
            data.modified = true;
            data.timestamp = Date.now();
            
            return JSON.stringify(data);
        } catch (e) {
            return res.responseText;
        }
    };
});
```

## 更新日志

### v1.5.5
- 修复 fakeXHR 和原型链 hook 重复处理的问题
- 添加 `__ajaxHooker_fromFakeXHR` 标记

### v1.5.4
- 添加 `protoHookInstalled` 标志，确保原型链方法只安装一次

### v1.5.3
- 添加 `__ajaxHooker_responseProcessed` 标志，避免 response 回调重复调用

### v1.5.2
- 重写 `XMLHttpRequest.prototype.responseText` getter
- 解决缓存请求无法修改响应内容的问题

### v1.5.1
- 修复 `responseXML` 访问错误
- 支持 async 函数类型的 hook

### v1.5.0
- 新增原型链 hook 机制，支持缓存请求拦截
- 新增媒体资源请求拦截功能

## 兼容性

- Chrome/Edge (Chromium)
- Firefox(未测试)
- Safari❌(浏览器限制劫持)
- via✅
- 支持 Tampermonkey、Violentmonkey、Greasemonkey 等用户脚本管理器

## 相关链接

- [原版 ajaxHooker](https://bbs.tampermonkey.net.cn/thread-3284-1-1.html)
- [GitHub 仓库](https://github.com/)
