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
      resolve: function (p) {
        var d = this.dirname(document.currentScript.src)
        var extra = []

        // currentScript在index.html同级或子级
        if (d.lastIndexOf(basePath) > -1) {
          d = d.replace(basePath, '')
          p = p.replace(/(\.\.\/)|(\.\/)/g, function (match, up) {
            if (up) {
              if (!d) extra.push('..')
              d = d.substr(0, d.lastIndexOf('/'))
            }
            return ''
          })
          return (extra.length ? extra.join('/') : '.') + d + '/' + p

        // currentScript在index.html父级
        } else {
          d = basePath.replace(d, '')
          return d.replace(/\/[^/]+/g, '../') + p
        }
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
