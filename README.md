# JTaro-Module

利用nodejs和Rollup.js使前端可使用ES6模块规范进行开发

- 开发环境在head引入jtaro-client.js和入口模块
- 入口js文件必须在head引入，且位于最后
- 生产环境将由入口文件开始利用Rollup.js打包成一个文件，并删除jtaro-client.js
- 所有模块路径都是相对当前引用文件，入口文件main.js相对于index.html，main.js引入a.js，a相对main，a.js引入b.js，b相对a
- 一个模块多次引入相同模块可能会出错
- a.js引入b.js，b.js引入a.js这类循环引入不会重复加载，但代码可能不会按预期的那样执行
- import必须独立成行