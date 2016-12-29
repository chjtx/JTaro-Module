/**
 * JTaro Module
 * 将含以下规则的import/export解释成ES5可执行代码
 * import
 * 1) import { a, b, c } from './util.js'
 * 2) import { abc as a } from './util.js'
 * 3) import { a } from './util.js'
 * 4) import './util.js'
 * 5) import * as a from './util.js'
 * export
 * 1) export var a = 'xxx'
 * 2) export { a, b, c }
 * 3) export function a () {}
 * 4) export default a
 * 5) export { abc as a }
 */
function getImports (text) {
  return text.match(/^[\t ]*import\s+.*/mg)
}

function getExports (text) {
  return text.match(/^[\t ]*export\s+.*/mg)
}

function removeComment (text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '')
}

function parseImport (arr) {
  var newArr = []
  var result
  var path
  for (var i = 0, l = arr.length; i < l; i++) {
    result = /import\s+['"](.+)['"]/.exec(arr[i])
    if (result) {
      path = 'JTaroLoader.import(\'' + result[1] + '\', g)'
    }
    newArr.push(path)
  }
  return newArr
}

function mixHeader (loaders, name) {
  return '(function (f) {\n' +
    '  var count = ' + loaders.length + '\n' +
    '  function g () { if (!--count) f() }\n  ' +
    loaders.join('\n  ') +
    '\n})(function () {\nJTaroModules[\'' + name + '\'] = {}\n\n'
}

function removeImport (a, f) {
  for (var i = 0, l = a.length; i < l; i++) {
    f = f.replace(new RegExp(a[i] + '[\r\n]+'), '')
  }
  return f
}

function parseBracket (v, name) {
  var a = v.split(/ *, */)
  var str = ''
  a.forEach((item, index) => {
    var b = item.split(/ *as */)
    if (b[1]) {
      str += 'JTaroModules[\'' + name + '\'].' + b[1] + ' = ' + b[0]
    } else {
      str += 'JTaroModules[\'' + name + '\'].' + b[0] + ' = ' + b[0]
    }
    if (index !== a.length - 1) {
      str += '\n'
    }
  })
  return str
}

function parseExport (e, name) {
  var regDefault = /^[\t ]*export +default/
  var regFunction = /^[\t ]*export +function +([^ ]+)/
  var regVar = /^[\t ]*export +var +([^ ]+)/
  var regBracket = /^[\t ]*export +\{([^}]+)\}/
  var variable

  // export default ...
  if (regDefault.test(e)) {
    return e.replace(regDefault, 'JTaroModules[\'' + name + '\'].default =')
  }
  // export function ...
  if (regFunction.test(e)) {
    return e.replace(regFunction, 'JTaroModules[\'' + name + '\'].' + regFunction.exec(e)[1] + ' = function')
  }
  // export var ...
  if (regVar.test(e)) {
    return e.replace(regVar, 'JTaroModules[\'' + name + '\'].' + regVar.exec(e)[1])
  }
  // export { ... }
  if (regBracket.test(e)) {
    variable = regBracket.exec(e)[1].trim()
    return e.replace(regBracket, parseBracket(variable, name))
  }

  return e
}

function getExportMaps (exps, name) {
  var maps = []
  exps.forEach(i => {
    maps.push({
      source: i,
      replace: parseExport(i, name)
    })
  })
  return maps
}

module.exports = function (file, name) {
  // 去掉多行注释的副本
  var copy = removeComment(file)
  // 提取import
  var imports = getImports(copy)

  var loaders = []
  var header = ''
  var exportMaps

  if (imports) {
    // 转换成JTaroLoader.import
    loaders = parseImport(imports)
    // 头部
    header = mixHeader(loaders, name)
    // 去掉已转换的import
    file = header + removeImport(imports, file) + '})'
  }

  // 提取export
  var exports = getExports(copy)

  if (exports) {
    exportMaps = getExportMaps(exports, name)
    exportMaps.forEach(i => {
      file = file.replace(i.source, i.replace)
    })
  }

  return file
}
