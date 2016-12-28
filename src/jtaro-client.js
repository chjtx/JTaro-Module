/* global */
(function () {
  var basePath = (function (uri) {
    uri = uri.split('#')[0].split('?')[0]
    return uri.substr(0, uri.lastIndexOf('/'))
  })(document.baseURI)

  window.JTaroModules = {}

  var loader = {
    // 路径处理
    path: {
      dirname: function (p) {
        return p.substr(0, p.lastIndexOf('/'))
      },
      relative: function (fromWhere, toWhere) {
        var f = fromWhere.replace(window.location.origin, '')
        var t = toWhere.replace(window.location.origin, '')
        var reg = /^\/[^/]+/
        var fmatch = reg.exec(f)
        var tmatch = reg.exec(t)
        while (fmatch && tmatch && fmatch[0] === tmatch[0]) {
          f = f.replace(reg, '')
          t = t.replace(reg, '')
          fmatch = reg.exec(f)
          tmatch = reg.exec(t)
        }
        var length = f.split('/').length
        var extra = []
        while (--length) {
          extra.push('..')
        }
        return extra.join('/') + t
      },
      resolve: function (p) {
        var d = this.dirname(document.currentScript.src)
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
          path = (d + '/' + p).replace(basePath, '.')
          if (path.indexOf(window.location.origin) > -1) {
            path = this.relative(basePath, path)
          }
        }
        return path
      }
    },
    // 引入模块
    import: function (path, callback) {
      var src = this.path.resolve(path)
      var script
      if (!document.querySelector('script[src="' + src + '"]')) {
        script = document.createElement('script')
        script.src = src
        script.onload = function () {
          if (typeof callback === 'function') callback()
        }
        setTimeout(function () {
          document.head.appendChild(script)
        }, 0)
      } else if (typeof callback === 'function') {
        callback()
      }
    }
  }

  window.JTaroLoader = loader
})()
