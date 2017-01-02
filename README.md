# JTaro Module

利用nodejs和Rollup.js使前端可使用ES6模块规范进行开发

## 开始使用

1. 将src文件夹拷贝到自己的项目上，重命名为`jtaro-module`
2. 开启本地静态文件服务，在自己的项目目录里使用命名行（终端）运行`node jtaro-module/server.js`，默认为3000端口，可自定义端口`node jtaro-module/server.js 3030`
3. 在index.html的head引入`jtaro-module/client.js`，在body最后引入入口文件，JTaro Module将会从入口文件开始加载所有依赖文件
4. 在浏览器上运行`localhost:3000/index.html`，所有js文件都会被拦截，所有符合条件的import/export将会被转换

建议使用[Visual Studio Code](https://code.visualstudio.com/)进行开发，可直接在编辑器开启nodejs服务

## 实现原理

本地开启nodejs静态服务，拦截所有js文件，检测文件内容，将import/export解释成ES5可执行的方法，再返回给浏览器

例：

```js
import { a } from './a.js'

console.log(a)

export default {
  a: a
}
```

浏览器接收到的内容为：

```js
(function (f) {
  var count = 1
  function g () { if (!--count) f.apply(null, [
    JTaroModules['/a.js'].default
  ]) }
  JTaroLoader.import('./a.js', g)
})(function (a) {

console.log(a)

JTaroModules['/main.js'].default = {
  a: a
}
```

## 注意事项

- 目前只在chrome浏览器通过测试，而且将来也不太可能会去兼容其它浏览器。是的，没看错，对非chrome浏览器不做兼容。上线部署的时候将会移除所有JTaro Module的代码，因此，只需要保证在chrome浏览器上开发不出问题就够了
- 所有import的路径都是相对当前文件的，JTaro Module会自动根据当前文件查找目标文件
- a.js引入b.js，b.js引入a.js这类循环引入不会重复加载，但代码可能不会按预期的那样执行
- import/export必须独立成行，即同一行不能出现两个import/export

## 支持import的5种语法

```js
// 1、花括号变量
import { a } from './**.js'
import { a, b, c } from './**.js'

// 2、花括号别名
import { a as apple } from './**.js'
import { a as apple, b as banana } from './**.js'

// 3、默认值赋给变量
import a from './**.js'

// 4、只引入并运行（适用于非ES6模块且有在window域暴露变量的库）
import './**.js'

// 5、获取所有值并赋给变量
import * as a from './**.js'
```

## 支持export的5种语法

```js
// 1、var声明（请不要使用let/const声明，ES5不认）
export var a = 'xxx'

// 2、花括号变量
var a = 1, b = 2, c = 3
export { a, b, c }

// 3、花括号别名
export { a as apple, b as banana }

// 4、导出函数
export function a () {
  ...
}

// 5、导出默认值
export default { a: 1 }
 ```

## 上线部署

JTaro Module只适用于开发环境，上线需要使用[Rollup.js](http://rollupjs.org/)进行打包。使用Rollup.js打包后，可移除jtaro-module/client.js。与Rollup.js更多相关内容不在本页范围内，请自行百度。

## 参考

- [ECMAScript 6 入门 - 阮一峰](http://es6.ruanyifeng.com/#docs/module)
- [用NodeJS打造你的静态文件服务器](https://cnodejs.org/topic/4f16442ccae1f4aa27001071)
- [Rollup.js官网](http://rollupjs.org/)

## 后语

JTaro Module只能用于解释js模块，对于html/css的引入可谓爱莫能及，与webpack相比，简直是弱到爆。JTaro Module之所以存在，是因为webpack太过于强大，以至新手根本无法接近，随便抛一个错误足可让我等渣渣通宵达旦。JTaro Module每个文件都与真实文件对应，所有浏览器可捕捉的错误都一目了然，也许错误行号与原文件对不上，`ctrl/cmd + f`一下就很轻易搜到错误源头。webpack是把牛刀，JTaro Module只是用来削水果的，合不合用就要使用者们自己度量了。

JTaro Module虽然只能处理js文件，而且只能处理import/export，但作为JTaro的其中一员（模块管理）已然足矣。