/*! JTaro-Module client.js v0.2.3 ~ (c) 2017 Author:BarZu Git:https://github.com/chjtx/JTaro-Module/ */
/* global XMLHttpRequest */
/**
 * 保证先执行依赖文件的实现思路
 * 1、引入资源时，创建依赖树，节点主要包含的内容有{from, path, callback}
 * 2、根据子节点的from和父节点的path，将子节点push进所有依赖该子节点的父节点
 * 3、资源onload时根据JTaroAssets判断该资源是否有依赖，没有则将该节点从所有有引入该节点的父节点移除，并执行回调，有则略过
 * 4、从父节点移除后判断父节点的children是否为0，是则表示依赖已全部加载，将该父节点从它的所有父节点移除，即重复第3步直到children不为0
 */
(function () {
  var assets = []
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

  // 如果遍历assets都不存在该path的元素，则该脚本为最上层脚本
  function isTheTopLevel (p) {
    var a = []
    var b = []
    var i = 0
    a = a.concat(assets)
    while (a.length) {
      b = []
      for (i = 0; i < a.length; i++) {
        if (a[i].path === p) return false
        if (a[i].children) b = b.concat(a[i].children)
      }
      a = b
    }
    return true
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
            // 去掉前后空格
            css = styleText[1].trim()
              // 以.#[*和字母开头的选择器前面加上jtaro标识
              .replace(/(^|{|})\s*([.#a-zA-Z\[*][^{}]+)?{/g, function (match, m1, m2) {
                var selector = (m2 || '').trim()
                // from和to是@keyframes的关键词，不能替换
                if (selector === 'from' || selector === 'to') {
                  return match
                }
                return (m1 || '') + '\n[jtaro' + id + '] ' + selector + ' {'
              })
              // 将属性的逗号用<mark>保存，避免下一步误操作，例：background: rgba(0, 0, 0, .3);
              .replace(/:[^;}]+(;|\})/g, function (match) {
                return match.replace(/,/g, '<mark>')
              })
              // 拆分用逗号分隔的选择符并加上jtaro标识，例：h1, h2, h3 {}
              .split(/,\s+(?=[.#a-zA-Z\[*])/).join(',\n[jtaro' + id + '] ')
              // 还原<mark>
              .replace(/<mark>/g, ',')
              // 去掉this
              .replace(/\s+this(?=\s+)?/g, '') + '\n'

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
    import: function (path, callback) {
      var result = this.path.resolve(path)
      var child = {
        src: result.src,
        from: result.from,
        path: result.path,
        callback: callback
      }

      if (isTheTopLevel(result.from)) {
        assets.push({
          path: result.from,
          src: result.from.replace(window.location.origin, '')
        })
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
