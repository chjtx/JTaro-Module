var utils = require('rollup-pluginutils')
var path = require('path')

module.exports = function (options) {
  options = options || {}
  var filter = utils.createFilter(options.include || ['**/*.html', '**/*.css'], options.exclude)

  function path2id (p) {
    var root = path.resolve(process.cwd(), options.root || '')
    return p.replace(root, '').replace(/\/|\\/g, '_').replace(/\.[a-zA-Z]+$/, '')
  }

  function parseHtml (data, p) {
    var reg = /<style>([\s\S]+)<\/style>/
    var styleText = reg.exec(data)
    var css = ''
    var id = path2id(p)

    // 提取模板的<style>
    if (styleText) {
      css = '\n[jtaro' + id + '] ' + styleText[1].trim()
        .replace(/}\s+(?!$)/g, '}\n[jtaro' + id + '] ')
        .split(/,\s+/).join(',\n[jtaro' + id + '] ') + '\n'

      // 过滤已截取的style
      data = data.replace(styleText[0], '')

      // 去除行首空格
      data = data.replace(/^\s+/, '')

      // 标识第一个dom
      data = data.replace(/^<\w+(?= |>)/, function (match) {
        return match + ' jtaro' + id + ' '
      })
    }

    return {
      id: id,
      style: css,
      html: data
    }
  }

  return {
    name: 'jtaro-module',
    intro: function () {
      return 'function _$styleInject (id, css) {\n' +
        '  var s=document.getElementById(id)\n' +
        '  if(!s){\n' +
        '    s=document.createElement("style")\n' +
        '    s.id=id\n' +
        '    s.innerHTML=css\n' +
        '    document.head.appendChild(s)\n' +
        '  }\n' +
        '}'
    },
    transform: function (code, id) {
      if (!filter(id)) return

      var ext = /\.[a-zA-Z]+$/.exec(id)[0]
      var result
      var style = ''

      // html
      if (ext === '.html') {
        result = parseHtml(code, id)
        if (result.style) {
          style = '_$styleInject("jtaro_style' + result.id + '", ' + JSON.stringify(result.style) + ')\n'
        }
        code = style + 'export default ' + JSON.stringify(result.html)

      // css
      } else if (ext === '.css') {
        code = '_$styleInject("jtaro_css' + path2id(id) + '", ' + JSON.stringify('\n' + code.trim() + '\n') + ')'

      // other
      } else {
        return
      }

      return {
        code: code,
        map: { mappings: '' }
      }
    }
  }
}
