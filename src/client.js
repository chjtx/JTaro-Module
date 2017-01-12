/*! JTaro-Module client.js v0.0.6 ~ (c) 2017 Author:BarZu Git:https://github.com/chjtx/JTaro-Module/ */
/* global XMLHttpRequest */
/**
 * 保证先执行依赖文件的实现思路
 * 1、服务器解释js文件，符合import条件的文件解释成闭包并在JTaroAssets标记该文件
 * 2、执行JTaroLoader.import时将回调压入assets
 * 3、文件加载完成时判断该文件在JTaroAssets是否有标记
 * 4、如果有标记，表明该文件引入其它文件，跳过
 * 5、如果没标记，表明该文件没引入其它文件，应该执行父文件的回调
 * 6、弹出assets的最后一个成员（回调方法），并将其计算器减1，如果该回调的count为0，表明所有依赖均已加载完成，执行该回调，并再次弹出assets的最后一个成员，重复步骤6，一直到assets的length为0
 */
(function () {
  var assets = []
  window.JTaroModules = {}
  window.JTaroAssets = {}

  // 如果该脚本没引入其它模块，立即执行回调
  function execScript (src) {
    var pop
    if (assets.length && (!src || !window.JTaroAssets.hasOwnProperty(src))) {
      pop = assets.pop()
      pop.count--
      if (!pop.count) {
        pop.callback(pop.data)
        execScript()
      }
    }
  }

  function runScriptCallback (script, result) {
    if (script.hasAttribute('complete')) {
      execScript(result.src)
    } else {
      script.addEventListener('load', function () {
        this.setAttribute('complete', '')
        execScript(result.src)
      })
    }
  }

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
        var currentScript = document.currentScript && document.currentScript.src || document.baseURI.split('?')[0].split('#')[0]
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
      var exist
      var scripts = document.getElementsByTagName('script')
      for (var i = 0, l = scripts.length; i < l; i++) {
        if (scripts[i].src === path) {
          exist = scripts[i]
          break
        }
      }
      return exist
    },
    importJs: function (result) {
      var me = this
      var script = me.isExist(result.path)
      if (!script) {
        script = document.createElement('script')
        script.src = result.src
        script.addEventListener('load', function () {
          this.setAttribute('complete', '')
          execScript(result.src)
        })
        script.onerror = function (e) {
          console.error('`JTaroLoader.import(\'' + result.src + '\', g)` load fail from ' + result.from)
        }
        setTimeout(function () {
          // 防止多次引入同一模块
          var s = me.isExist(result.path)
          if (!s) {
            document.head.appendChild(script)
          } else {
            runScriptCallback(s, result)
          }
        }, 0)
      } else {
        runScriptCallback(script, result)
      }
    },
    // 将路径转换成id
    path2id: function (path) {
      return path.substr(0, path.lastIndexOf('.')).replace(/\//g, '_')
    },
    importHtml: function (result) {
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
            css = '\n[jtaro' + id + '] ' + styleText[1].replace(/\bthis\b/, '').trim()
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
        execScript(result.src)
      })
    },
    importCss: function (result) {
      var id = 'jtaro_css' + this.path2id(result.src)
      this.ajax(result.src, function (data) {
        var link = document.getElementById(id)
        if (!link) {
          link = document.createElement('style')
          link.id = id
          link.innerHTML = '\n' + data.trim() + '\n'
          document.head.appendChild(link)
        }
        execScript(result.src)
      })
    },
    // 引入模块
    import: function (path, param) {
      var result = this.path.resolve(path)

      param.data = result
      assets.push(param)
      // js
      if (/\.js$/.test(result.src)) {
        this.importJs(result)

      // html
      } else if (/\.html$/.test(result.src)) {
        this.importHtml(result)

      // css
      } else if (/\.css$/.test(result.src)) {
        this.importCss(result)

      // other
      } else {
        console.error('Can only import html/css/js!!! `JTaroLoader.import(\'' + result.src + '\', g)` load fail from ' + result.from)
      }
    }
  }

  window.JTaroLoader = loader
})()
