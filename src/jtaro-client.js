/* global */
(function () {
  var basePath = (function (uri) {
    uri = uri.split('#')[0].split('?')[0]
    return uri.substr(0, uri.lastIndexOf('/'))
  })(document.baseURI)

  window.JTaroModules = {}

  window.JTaroLoader = {
    path: {
      dirname: function (p) {
        return p.substr(0, p.lastIndexOf('/'))
      },
      self: function () {
        var scripts = document.getElementsByTagName('script')
        var src = scripts[scripts.length - 1].src
        return src
      },
      resolve: function (p) {
        var d = this.dirname(this.self()).replace(basePath, '')
        p = p.replace(/(\.\.\/)|(\.\/)/g, function (match, up) {
          if (up) {
            d = d.substr(0, d.lastIndexOf('/'))
          }
          return ''
        })
        return '.' + d + '/' + p
      }
    },
    // 引入模块
    import: function (path, callback) {
      var s = document.createElement('script')
      s.src = this.path.resolve(path)
      s.onload = function () {
        if (typeof callback === 'function') callback()
      }
      document.head.appendChild(s)
    }
  }
})()
