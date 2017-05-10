/*! JTaro-Module server.js v0.2.4 ~ (c) 2017 Author:BarZu Git:https://github.com/chjtx/JTaro-Module/ */
var fs = require('fs')
var path = require('path')
var http = require('http')
var url = require('url')
var jtaroModule = require('./parse')
var port = 3000 // 默认端口
var configPath = './jtaro.module.config' // 默认配置文件
var showConfigError = false

// 截取命令
for (var i = 2; i < process.argv.length; i++) {
  // 端口
  if (/\d/g.test(process.argv[i])) {
    port = process.argv[i]
  }
  // 配置文件 --config="jtaro.module.config.js"
  if (/^--config=/.test(process.argv[i])) {
    showConfigError = true
    configPath = process.argv[i].replace('--config=', '').replace(/^("|')|("|')$/g, '').trim()

    // 如果不是以../或./开头的文件，自动加上./
    if (!/^(\.\/|\.\.\/)/.test(configPath)) {
      configPath = './' + configPath
    }
  }
}

// 使用rollupjs的插件过滤文件内容
var config
try {
  config = require(configPath)
} catch (e) {
  if (showConfigError) {
    throw e
  }
  config = {}
}

var mime = {
  'css': 'text/css',
  'gif': 'image/gif',
  'html': 'text/html',
  'ico': 'image/x-icon',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'js': 'text/javascript',
  'json': 'application/json',
  'pdf': 'application/pdf',
  'png': 'image/png',
  'svg': 'image/svg+xml',
  'swf': 'application/x-shockwave-flash',
  'tiff': 'image/tiff',
  'txt': 'text/plain',
  'wav': 'audio/x-wav',
  'wma': 'audio/x-ms-wma',
  'wmv': 'video/x-ms-wmv',
  'xml': 'text/xml'
}

http.createServer((req, res) => {
  var parseURL = url.parse(req.url)
  var pathname = parseURL.pathname
  if (/\/$/.test(pathname)) {
    pathname = pathname + 'index.html'
  }
  var ext = path.extname(pathname)
  var realPath = '.' + pathname
  ext = ext ? ext.slice(1) : 'unknown'
  var contentType = mime[ext] || 'text/plain'

  fs.stat(realPath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.write('This request URL ' + pathname + ' was not found on this server.')
      res.end()
    } else {
      fs.readFile(realPath, 'binary', function (err, file) {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' })
          res.end(err.message)
        } else {
          if (ext === 'js') {
            config.id = path.resolve(__dirname, config.website || '', realPath)
            config.entry = path.resolve(__dirname, config.entry || '')
            config.is_jtaro_module = true // 标记给rollup-plugin-paths插件使用
            file = jtaroModule(file, req.url, config)
          }

          res.writeHead(200, { 'Content-Type': contentType })
          res.write(file, 'binary')
          res.end()
        }
      })
    }
  })
}).listen(port)

console.log('JTaro Module Server run on port: ' + port)
