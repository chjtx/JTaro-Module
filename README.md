# JTaro Module

JTaro Module是一款使用ES6模块语法的前端模块管理工具，其本身是为更好地服务JTaro而设计，但并不依赖JTaro，完全可以独立运行。

现正处于内测阶段！！！

## 特点

- 轻盈易用，几个文件，数百行代码，只需要开启其nodejs服务即可使用ES6模块语法编写代码，无需Babel转译
- 方便排错，浏览器展示代码与本地js文件一一对应，错误行号一目了然
- 低耗高能，只需要安装nodejs 6以上版本即可运行，在3000元windows机上跑也是扛扛的
- 代码精简，上线代码使用Rollup.js打包，除寥寥几行用于处理样式的代码外，不带任何模块管理的代码

## 开始使用

### 开发模式

1. 将src文件夹拷贝到自己的项目上，重命名为`jtaro-module`
2. 开启本地静态文件服务，在自己的项目目录里使用命名行（终端）运行`node jtaro-module/server.js`，默认为3000端口，可自定义端口`node jtaro-module/server.js 3030`
3. 在index.html的head引入`jtaro-module/client.js`，在body最后引入入口文件，JTaro Module将会从入口文件开始加载所有依赖文件
4. 在浏览器上运行`localhost:3000/index.html`，所有js文件都会被拦截，所有符合条件的import/export将会被转换

建议使用[Visual Studio Code](https://code.visualstudio.com/)进行开发，可直接在编辑器开启nodejs服务

### 上线模式

1. 安装rollup、引入`rollup-plugin-jtaro-module.js`添加到rollup的插件里，打包入口文件
2. 删除index.html的`jtaro-module/client.js`

与Rollup.js更多相关内容不在本页范围内，请自行谷歌/百度。

大概代码长这样

```js
var rollup = require('rollup')
var path = require('path')
var jtaroModule = require('./src/rollup-plugin-jtaro-module.js')

rollup.rollup({
  entry: path.resolve('demos/x/x.js'),
  plugins: [jtaroModule({ root: 'demos' })]
}).then(function (bundle) {
  bundle.write({
    format: 'iife',
    dest: 'build/x/x.js'
  })
})
```

## 处理js

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

## 处理html

当引入的文件为html时，JTaro Module会将html里的style在head里生成样式表，其余内容以字符串形式返回。JTaro是基于Vue开发的，因此JTaro Module的html内容也应该遵循Vue的模板规则，最外层只有一个dom元素。另外，html文件里只允许一个style标签

推荐

```html
<style>
body {}
</style>
<div>
  <p>最外层只有一个div</p>
</div>
```

不推荐

```
<style>
body {}
</style>
<div>
  <p>最外层只有一个div</p>
</div>
<div>
  我是最外层的第二个div
</div>
```

JTaro Module会将style和div(dom元素)分离，并在第一个div加上与style对应的标识，以达到作用域限定的目的。如果你要给第一个div加样式，只需要在`{}`里写样式，前面不需要任何选择器

像这样子

a.html

```html
<style>
h1 {font-size:32px;}
{background: #ddd;} /* 给顶层div加样式 */
</style>
<div>
  <h1>Hello JTaro Module</h1>
</div>
```

a.js

```js
import a from './a.html'
document.body.innerHTML = a
```

将解释成

```html
<html>
  <head>
    <style id="jtaro_style_a">
    [jtaro_a] h1 {font-size:32px;}
    [jtaro_a] {background: #ddd;}
    </style>
  </head>
  <body>
    <div jtaro_a>
      <h1>Hello JTaro Module</h1>
    </div>
  </body>
</html>
```

## 处理css

直接将css文件的内容以style标签的形式在head创建，不会额外加任何标签

## 注意事项

- 目前只在chrome浏览器通过测试，而且将来也不太可能会去兼容其它浏览器。是的，没看错，对非chrome浏览器不做兼容。上线部署的时候将会移除所有JTaro Module的代码，因此，只需要保证在chrome浏览器上开发不出问题就够了
- 所有import的路径都是相对当前文件的，JTaro Module会自动根据当前文件查找目标文件
- a.js引入b.js，b.js引入a.js这类循环引入不会重复加载，但代码可能不会按预期的那样执行
- import/export必须独立成行，即同一行不能出现两个import/export
- import的文件必须加后缀，目前只支持js/html/css三种后缀文件

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

## rollup-plugin-jtaro-module

Rollup的JTaro Module插件，使Rollup支持引入html和css

| 选项 | 默认值 | 说明 |
|:----:|:----:|:----|\
| root | undefined | 站点根目录 |

## 参考

- [ECMAScript 6 入门 - 阮一峰](http://es6.ruanyifeng.com/#docs/module)
- [用NodeJS打造你的静态文件服务器](https://cnodejs.org/topic/4f16442ccae1f4aa27001071)
- [Rollup.js官网](http://rollupjs.org/)

## 后语

JTaro Module只能用于解决js/html/css的模块化，对于引入es6/typescript/less/sass/postCss等可谓是爱莫能及，与webpack相比，简直是弱到爆。JTaro Module之所以存在，是因为webpack太过于强大，以至新手根本无法接近，随便抛一个错误足可让我等渣渣通宵达旦。JTaro Module每个文件都与真实文件对应，所有浏览器可捕捉的错误都显而易见，也许错误行号与原文件对不上，`ctrl/cmd + f`一下就很轻易搜到错误源头。webpack是把牛刀，JTaro Module只是用来削水果的，合不合用就要使用者们自己度量了。

## TODO

- 在一个文件多次引入同一文件时偶然会报错，待收复
