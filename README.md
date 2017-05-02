# JTaro Module

JTaro Module是一款使用ES6模块语法的前端模块管理工具，其本身是为更好地服务JTaro而设计，但并不依赖JTaro，完全可以独立运行。

## 前言

- 如果你想使用ES6模块语法管理代码，又不想使用webpack这个重型工具
- 如果你只是想简简单单的写个js、html、css，不需要typescript、postcss等高级工具
- 如果你想开发时所见到的错误就像使用script标签引入的脚本一样清晰
- 如果你想上线代码只打包成一个或几个文件以减少文件体积和连接数

那么，你可以继续往下读了！

## 特点

- 轻盈易用，几个文件，数百行代码，只需要开启其nodejs服务即可使用ES6模块语法编写代码，无需Babel转译
- 方便排错，浏览器展示代码与本地js文件一一对应，错误行号一目了然
- 低耗高能，只需要安装nodejs 6以上版本即可运行，在3000元windows机上跑也是扛扛的
- 代码精简，上线代码使用Rollup.js打包，除寥寥几行用于处理样式的代码外，不带任何模块管理的代码

## 示例

[运行示例](https://github.com/chjtx/JTaro-Module/tree/master/demos)

## 开始使用

### 开发模式

1. 安装`npm install -D jtaro-module`
2. 在自己的项目目录里使用命令行（终端）运行`node node_modules/jtaro-module/src/server.js`，开启本地静态文件服务，默认为3000端口，可自定义端口`node node_modules/jtaro-module/src/server.js 3030`
3. 在index.html的head引入`node_modules/jtaro-module/src/client.js`，在body最后引入入口文件（只要是js文件都可当作入口文件），JTaro Module将会从入口文件开始加载所有依赖文件
4. 在浏览器上运行`localhost:3000/index.html`，所有js文件都会被拦截，所有符合条件的import/export将会被转换

建议使用[Visual Studio Code](https://code.visualstudio.com/)进行开发，可直接在编辑器开启nodejs服务

### 上线模式

1. 安装rollup、引入`rollup-plugin-jtaro-module`添加到rollup的插件里，打包入口文件
2. 拷贝index.html到build/并删除拷贝的index.html里的`node_modules/jtaro-module/src/client.js`
3. `node build.js`

与Rollup.js更多相关内容不在本页范围内，请自行谷歌/百度。

build.js大概代码长这样

```js
var rollup = require('rollup')
var path = require('path')
var jtaroModule = require('rollup-plugin-jtaro-module')

rollup.rollup({
  entry: path.resolve('demos/main.js'),
  plugins: [jtaroModule({ root: 'demos' })]
}).then(function (bundle) {
  bundle.write({
    format: 'iife',
    dest: 'build/main.js'
  })
})
```

## JTaro Module 运行原理

### 处理js

本地开启nodejs静态服务，拦截所有js文件，检测文件内容，将import/export解释成ES5可执行的方法，再返回给浏览器

例：

```js
// main.js
import { a } from './a.js'

console.log(a)

export default {
  a: a
}
```

浏览器接收到的内容为：

```js
(function (f) {
  JTaroAssets['/main.js'] = 1
  var g = {count:1}
  g.callback = function () { f.apply(null, [
    JTaroModules['/a.js'].default
  ]) }
  JTaroLoader.import('./a.js', g)
})(function (a) {
// main.js

console.log(a)

JTaroModules['/main.js'].default = {
  a: a
}
})
```

### 处理html

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

```html
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

JTaro Module会将style和div(dom元素)分离，并在第一个div加上与style对应的标识，以达到作用域限定的目的。如果你要给第一个div加样式，只需要在`{}`里写样式，前面不需要任何选择器。如果某些编辑器对`{}`发出警告，看着不爽，可以这样写`this {}`，this表示第一个div

像这样子

a.html

```html
<style>
h1 {font-size:32px;}
{background: #ddd;} /* 给顶层div加样式 */
this {background: #ddd;} /* 给顶层div加样式，防止编辑器发出警告 */
this.abc {color: #333;}
this#efg {float: left;}
</style>
<div class="abc" id="efg">
  <h1>Hello JTaro Module</h1>
</div>
```

a.js

```js
import a from './a.html'
document.body.innerHTML = a
```

运行结果

```html
<html>
  <head>
    <style id="jtaro_style_a">
    [jtaro_a] h1 {font-size:32px;}
    [jtaro_a] {background: #ddd;}
    [jtaro_a].abc {color: #333;}
    [jtaro_a]#efg {float: left;}
    </style>
  </head>
  <body>
    <div jtaro_a class="abc" id="efg">
      <h1>Hello JTaro Module</h1>
    </div>
  </body>
</html>
```

### 处理css

直接将css文件的内容以style标签的形式在head创建，不会额外加任何标记

## 注意事项

- 目前只在chrome浏览器通过测试，而且将来也不太可能会去兼容其它浏览器。是的，没看错，对非chrome浏览器不做兼容。上线部署的时候将会移除几乎所有JTaro Module的代码，因此，只需要保证在chrome浏览器上开发不出问题就够了
- 所有import的路径都是相对当前文件的，除非使用`rollup-plugin-paths`插件，JTaro Module会自动根据当前文件查找目标文件
- a.js引入b.js，b.js引入a.js这类循环引入不会重复加载，但代码可能不会按预期的那样执行
- import/export必须独立成行，即同一行不能出现两个import/export
- import的文件必须加后缀，目前只支持js/html/css三种后缀文件
- 入口文件不应该有export
- 除以下5种import、5种export语法外的ES6模块语法都不会被解释到，例：不支持`export * from '../abc.js'`

## 支持import的5种语法

```js
// 1、花括号变量
import { a } from './**.js'
import { a, b, c } from './**.js'

// 2、花括号别名
import { a as apple } from './**.js'
import { a as apple, b as banana } from './**.js'

// 3、默认值赋给变量，相当于`import { default as a } from './**.js'`
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

[rollup-plugin-jtaro-module](https://github.com/chjtx/rollup-plugin-jtaro-module) Rollup的JTaro Module插件，使Rollup支持引入html和css，上线打包时使用

| 选项 | 默认值 | 说明 |
|:----:|:----:|:----|
| root | 当前工作目录 | 批定站点根目录，填入相对于工程目录的路径，让JTaro Module能正确处理文件路径 |

## 使用rollup的插件

- 与 JTaro Module 源码`server.js`同一目录创建`jtaro.module.config.js`文件
- 或者在开启服务时指定配置文件`node server.js --config=./jtaro.other.config.js`
- `--config`选项后面跟的路径是相对`server.js`的，请用`./`或`../`开头
- 配置该文件后，即可使用rollup的插件对文件进行处理，如使用`rollup-plugin-paths`进行别名修改，`rollup-plugin-babel`进行ES6语法转换等

目前已测试通过的rollup插件：

- [rollup-plugin-paths](https://github.com/chjtx/rollup-plugin-paths) 可在不同目录层级下使用相同变量的路径
- [rollup-plugin-babel](https://github.com/rollup/rollup-plugin-babel) 将ES6语法转换成ES5

```
npm i -D rollup-plugin-paths rollup-plugin-babel babel-preset-es2015
```

```js
// jtaro.module.config.js
var alias = require('rollup-plugin-paths')
var babel = require('rollup-plugin-babel')

module.exports = {
  website: '../', // 站点目录，以server.js所在路径为基准
  entry: '../demos/main.js', // 入口文件，以server.js所在路径为基准
  plugins: [alias({
    jquery: './vendors/jquery-2.2.3.min.js' // 以入口文件所在路径为基准
  }, babel({
    include: '**/a.js', //该路径相对于entry（入口文件）
    'presets': [
      [
        'es2015',
        {
          'modules': false
        }
      ]
    ]
  })]
}
```

**注意**

- 若要使用`rollup-plugin-babel`必须安装`babel-preset-es2015`
- 强烈建议配置babel的`include`选项，否则每个js都会被编译，非常慢

## 参考

- [ECMAScript 6 入门 - 阮一峰](http://es6.ruanyifeng.com/#docs/module)
- [用NodeJS打造你的静态文件服务器](https://cnodejs.org/topic/4f16442ccae1f4aa27001071)
- [Rollup.js官网](http://rollupjs.org/)

## 后语

JTaro Module只能用于解决js/html/css的模块化，与webpack相比，简直是弱到爆。JTaro Module之所以存在，是因为webpack太过于强大，以至新手根本无法接近，随便抛一个错误足可让我等渣渣通宵达旦。JTaro Module每个文件都与真实文件对应，所有浏览器可捕捉的错误都显而易见，也许错误行号与原文件对不上，`ctrl/cmd + f`搜索一下就很轻易搜到错误源头。webpack是把牛刀，JTaro Module只是用来削水果的，合不合用就要使用者们自己度量了。

那么为什么要造轮子？

- 新人入项，总要安装一大堆脚本工具，npm安装则网络受限，cnpm安装则依赖缺失
- 公司预算约束，不可能给每位开发者提供mac设备，在3000元windows机上运行webpack等开发环境备受挑战
- webpack学习成本较高，出现问题处理成本更高，并非新手所能驾驭
- 经webpack处理过的脚本，并不能很直观的反映出是哪段业务代码报的错误，增加开发成本
- .vue文件将html、js、css合在一起适合编写单个组件，对于业务逻辑较多的文件应将html、css和js分离
- 工具应该用于解放劳动力，而不应该因维护工具而适得其反

## License

MIT

