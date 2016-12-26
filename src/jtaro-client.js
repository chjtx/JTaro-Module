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
        var d = this.dirname(document.currentScript.src).replace(basePath, '')
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
      var src = this.path.resolve(path)
      var script
      if (!document.head.querySelector('script[src="' + src + '"]')) {
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

  // 引入入口文件
  var bodyScripts = document.body.getElementsByTagName('script')
  var mainScript
  var datasetMain
  for (var i = 0, l = bodyScripts.length; i < l; i++) {
    datasetMain = bodyScripts[i].dataset.main
    if (datasetMain && ~bodyScripts[i].src.indexOf('jtaro-client')) {
      mainScript = document.createElement('script')
      mainScript.src = datasetMain
      document.head.appendChild(mainScript)
    }
  }

  window.JTaroLoader = loader
})()
