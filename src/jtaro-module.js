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
  return text.match(/\bimport\s+.*(?=[\r\n]+)/g)
}

function removeComment (text) {
  var multiLine = /\/\*[\s\S]*?\*\//g
  var singleLine = /\/\/.*[\r\n]+/g
  return text.replace(multiLine, '').replace(singleLine, '')
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

function mixHeader (loaders) {
  return '(function (f) {\n' +
    '  var count = ' + loaders.length + '\n' +
    '  function g () { if (!--count) f() }\n  ' +
    loaders.join('\n  ') +
    '\n})(function () {\n'
}

function removeImport (a, f) {
  for (var i = 0, l = a.length; i < l; i++) {
    f = f.replace(new RegExp(a[i] + '[\r\n]+'), '')
  }
  return f
}

module.exports = function (file, name) {
  // 副本，去除注释
  // TODO 符合注释特征的字符串不能删掉
  var copy = removeComment(file)
  // 提取import
  var imports = getImports(copy)

  if (imports) {
    // 转换成JTaroLoader.import
    var loaders = parseImport(imports)
    // 头部
    var header = mixHeader(loaders)
    // 去掉已转换的import
    file = header + removeImport(imports, file) + '})'
  }

  return file
}
