/*! JTaro-Module client.js v0.1.0 ~ (c) 2017 Author:BarZu Git:https://github.com/chjtx/JTaro-Module/ */
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
  var assets = [{
    path: window.location.origin + '/',
    src: '/'
  }]
  var loader
  var loadCompleted = {}
  window.JTaroModules = {}
  window.JTaroAssets = {}

  // 如果该脚本没引入其它模块，立即执行回调
  function execScript (child) {
    if (!window.JTaroAssets[child.src]) {
      loadCompleted[child.src] = 1
      removeFromFather(child, assets)
    }
  }

  // 推进父级
  function pushIntoFather (child, fathers) {
    var hasThisChild
    var i
    var l
    var k
    for (i = 0, l = fathers.length; i < l; i++) {
      if (!fathers[i].children) fathers[i].children = []
      if (fathers[i].path === child.from) {
        hasThisChild = false
        for (k = 0; k < fathers[i].children.length; k++) {
          if (fathers[i].children[k].path === child.path) {
            hasThisChild = true
            break
          }
        }
        if (!hasThisChild) {
          fathers[i].children.push(child)
        }
      }
      if (fathers[i].children && fathers[i].children.length > 0) {
        pushIntoFather(child, fathers[i].children)
      }
    }
  }

  // 从父级移除
  function removeFromFather (child, fathers) {
    fathers.forEach(function (f) {
      if (f.children.length === 0) return
      var cb
      for (var i = 0, l = f.children.length; i < l; i++) {
        if (f.children[i].path === child.path) {
          cb = f.children.splice(i, 1)[0]
          break
        }
      }

      if (f.children.length === 0) {
        if (cb) {
          cb.callback()
          loadCompleted[f.src] = 1
          setTimeout(function () {
            removeFromFather(f, assets)
          }, 0)
        }
      } else {
        removeFromFather(child, f.children)
      }
    })
  }

  loader = {
    // 同步加载
    ajax: function (path, callback) {
      var xhr = new XMLHttpRequest()
      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          callback(xhr.responseText)
        }
      }
      xhr.open('GET', path, true)
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
          execScript(result)
        })
        script.onerror = function (e) {
          console.error('`JTaroLoader.import(\'' + result.src + '\', g)` load fail from ' + result.from)
        }
        setTimeout(function () {
          // 防止多次引入同一模块
          var s = me.isExist(result.path)
          if (!s) {
            document.head.appendChild(script)
          }
        }, 0)
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
              .replace(/:[^;}]+(;|\})/g, function (match) {
                return match.replace(/,/g, '<mark>')
              })
              .split(/,\s+/).join(',\n[jtaro' + id + '] ')
              .replace(/<mark>/g, ',') + '\n'
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
        execScript(result)
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
        execScript(result)
      })
    },
    // 引入模块
    import: function (path, param) {
      var result = this.path.resolve(path)
      // var i
      var child = {
        src: result.src,
        from: result.from,
        path: result.path,
        callback: param.callback
      }
      pushIntoFather(child, assets)

      // 该资源是否已加载完成
      if (loadCompleted[result.src]) {
        setTimeout(function () {
          removeFromFather(child, assets)
        }, 0)
        return
      }

      // js
      if (/\.js$/.test(child.src)) {
        this.importJs(child)

      // html
      } else if (/\.html$/.test(child.src)) {
        this.importHtml(child)

      // css
      } else if (/\.css$/.test(child.src)) {
        this.importCss(child)

      // other
      } else {
        console.error('Can only import html/css/js!!! `JTaroLoader.import(\'' + child.src + '\', g)` load fail from ' + child.from)
      }
    }
  }

  window.JTaroLoader = loader
})()
