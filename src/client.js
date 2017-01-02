/*! JTaro-Module client.js v0.0.2 ~ (c) 2017 Author:BarZu Git:https://github.com/chjtx/JTaro-Module/ */
/* global XMLHttpRequest */
(function () {
  window.JTaroModules = {}

  var loader = {
    // 同步加载
    ajax: function (path, callback) {
      var xhr = new XMLHttpRequest()
      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          callback(xhr.responseText)
        }
      }
      xhr.open('GET', path, false)
      xhr.send()
    },
    // 路径处理
    path: {
      dirname: function (p) {
        return p.substr(0, p.lastIndexOf('/'))
      },
      resolve: function (p) {
        var currentScript = document.currentScript.src || document.baseURI
        var d = this.dirname(currentScript)
        var path

        // 支持http/https请求
        if (/^http/.test(p)) {
          path = p

        // 相对路径请求
        } else {
          p = p.replace(/(\.\.\/)|(\.\/)/g, function (match, up) {
            if (up) {
              d = d.substr(0, d.lastIndexOf('/'))
            }
            return ''
          })
          path = (d + '/' + p)
        }
        return {
          from: currentScript,
          src: path.replace(window.location.origin, ''),
          path: path
        }
      }
    },
    // 判断脚本是否存在
    isExist: function (path) {
      var exist = false
      var scripts = document.getElementsByTagName('script')
      for (var i = 0, l = scripts.length; i < l; i++) {
        if (scripts[i].src === path) {
          exist = true
          break
        }
      }
      return exist
    },
    importJs: function (result, callback) {
      var me = this
      var script
      if (!me.isExist(result.path)) {
        script = document.createElement('script')
        script.src = result.src
        script.onload = function () {
          if (typeof callback === 'function') callback(result)
        }
        script.onerror = function (e) {
          console.error('`JTaroLoader.import(\'' + result.src + '\', g)` load fail from ' + result.from)
        }
        setTimeout(function () {
          // 防止多次引入同一模块
          if (!me.isExist(result.path)) {
            document.head.appendChild(script)
          } else {
            callback(result)
          }
        }, 0)
      } else if (typeof callback === 'function') {
        callback(result)
      }
    },
    // 将路径转换成id
    path2id: function (path) {
      return path.substr(0, path.lastIndexOf('.')).replace(/\//g, '_')
    },
    importHtml: function (result, callback) {
      var me = this
      this.ajax(result.src, function (data) {
        var reg = /<style>([\s\S]+)<\/style>/
        var styleText = reg.exec(data)
        var style
        var css
        var id = me.path2id(result.src)

        // 将模板的<style>提取到head
        if (styleText) {
          style = document.getElementById('jtaro_style' + id)
          if (!style) {
            css = '\n[jtaro' + id + '] ' + styleText[1].trim()
              .replace(/}\s+(?!$)/g, '}\n[jtaro' + id + '] ')
              .split(/,\s+/).join(',\n[jtaro' + id + '] ') + '\n'
            style = document.createElement('style')
            style.id = 'jtaro_style' + id
            style.innerHTML = css
            document.head.appendChild(style)
          }

          // 过滤已截取的style
          data = data.replace(styleText[0], '')

          // 去除行首空格
          data = data.replace(/^\s+/, '')

          // 标识第一个dom
          data = data.replace(/^<\w+(?= |>)/, function (match) {
            return match + ' jtaro' + id + ' '
          })
        }

        window.JTaroModules[result.src] = { default: data }
        callback(result)
      })
    },
    importCss: function (result, callback) {
      var id = 'jtaro_link' + this.path2id(result.src)
      var link = document.getElementById(id)
      if (!link) {
        link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.href = result.src
        document.head.appendChild(link)
      }
      callback(result)
    },
    importOther: function (result, callback) {
      this.ajax(result.src, function (data) {
        window.JTaroModules[result.src] = { default: data }
        callback(result)
      })
    },
    // 引入模块
    import: function (path, callback) {
      var result = this.path.resolve(path)

      // js
      if (/\.js$/.test(result.src)) {
        this.importJs(result, callback)

      // html
      } else if (/\.html$/.test(result.src)) {
        this.importHtml(result, callback)

      // css
      } else if (/\.css$/.test(result.src)) {
        this.importCss(result, callback)

      // other
      } else {
        this.importOther(result, callback)
      }
    }
  }

  window.JTaroLoader = loader
})()
