# 油猴脚本项目十大核心规则

1. **精确作用域**  
   `@match`/`@include`限定域名路径，避免全局污染  

2. **沙箱权限声明**  
   必须启用`@grant`调用API，禁用`@grant none`  

3. **模块化封装**  
   使用IIFE包裹代码：`(function(){ 'use strict';... })();`  

4. **动态元素监听**  
   `MutationObserver`替代`setInterval`轮询  

5. **操作防抖机制**  
   高频动作添加`debounce(300, callback)`  

6. **安全存储**  
   敏感数据用`GM_setValue`代替localStorage  

7. **用户授权确认**  
   自动提交等操作前置`confirm()`验证  

8. **异常防御**  
   网络请求/DOM操作必须`try-catch`封装  

9. **调试开关**  
   开发时启用`const DEBUG=true`控制日志输出  

10. **跨域白名单**  
    外域请求需配置`@connect domain.com`  