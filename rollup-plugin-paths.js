var path = require('path')

// nodejs的require('path').relative有bug，因此自己写
function getRelativePath (from, to) {
  // 去除相同部分
  var i = 0
  while (from[i] === to[i]) {
    i++
  }
  from = from.substr(i)
  to = to.substr(i)
  // 加上..或.
  var l = from.split(/\/|\\/).length - 1
  var s = ''
  if (l) {
    while (l--) {
      s += '../'
    }
  } else {
    s = './'
  }
  return s + to
}

module.exports = function (options) {
  var rollupOptions
  return {
    name: 'rollup-plugin-paths',
    options: function (o) {
      rollupOptions = o
    },
    resolveId: function (importee, importer) {
      var p
      for (var i in options) {
        if (options.hasOwnProperty(i) && importee === i) {
          p = path.resolve(path.dirname(rollupOptions.entry), options[i])
          return rollupOptions.is_jtaro_module ? getRelativePath(importer, p) : p
        }
      }
    }
  }
}
