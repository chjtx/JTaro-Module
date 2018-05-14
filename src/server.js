/*! JTaro-Module server.js v0.3.0 ~ (c) 2017-2018 Author:BarZu Git:https://github.com/chjtx/JTaro-Module/ */
const fs = require('fs')
const path = require('path')
const http = require('http')
const url = require('url')
const socketio = require('socket.io')
const jtaroModule = require('./parse')
const cwd = process.cwd()

let port = 3000 // 默认端口
let configPath = './jtaro.module.config' // 默认配置文件
let watchPath = '' // 默认不监听
let hasConfigFile = false
let fileChangeTime = 0 // 防抖
let socket = null

// 截取命令
for (var i = 2; i < process.argv.length; i++) {
  // 端口
  if (/\d/g.test(process.argv[i])) {
    port = process.argv[i]
  }
  // 配置文件 --config="jtaro.module.config.js"
  if (/^--config=/.test(process.argv[i])) {
    hasConfigFile = true
    configPath = process.argv[i].replace('--config=', '')
      .replace(/^("|')|("|')$/g, '').trim().replace(/\.js$/, '')

    // 如果不是以../或./开头的文件，自动加上./
    if (!/^(\.\/|\.\.\/)/.test(configPath)) {
      configPath = './' + configPath
    }
  }
  // 监听文件 --watch="./src"
  if (/^--watch=/.test(process.argv[i])) {
    watchPath = process.argv[i].replace('--watch=', '')
      .replace(/^("|')|("|')$/g, '').trim()
  }
}

// 如果存在配置文件，使用rollupjs的插件过滤文件内容
let config = {}
fs.access(path.join(__dirname, configPath + '.js'), function (err) {
  if (!err) {
    config = require(configPath)
  } else if (hasConfigFile) {
    throw err
  }
  runServer()
})

function runServer () {
  const mime = {
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

  const server = http.createServer((req, res) => {
    const parseURL = url.parse(req.url)
    let pathname = parseURL.pathname
    if (/\/$/.test(pathname)) {
      pathname = pathname + 'index.html'
    }
    let ext = path.extname(pathname)
    const realPath = '.' + pathname
    ext = ext ? ext.slice(1) : 'unknown'
    const contentType = mime[ext] || 'text/plain'

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
  })

  const io = socketio(server)
  server.listen(port)

  io.on('connection', function (s) {
    socket = s
  })

  // 监听文件变化
  function watchFiles (dir) {
    const w = fs.watch(dir, (event, filename) => {
      const p = path.resolve(dir, filename)
      if (event === 'rename') {
        fs.stat(p, (err, state) => {
          if (!err) {
            if (state.isDirectory()) {
              w.close()
              watchFiles(p)
            }
          } else {
            w.close()
          }
        })
      } else {
        // event === change
        fs.stat(p, (err, state) => {
          const now = Date.now()
          if (!err && state.isFile() && (now - fileChangeTime > 100)) {
            fileChangeTime = now
            if (socket) {
              socket.emit('fileChange')
            }
          }
        })
      }
    })
    w.on('error', (e) => {
      console.error(e)
    })
    // 递归监听
    fs.readdirSync(dir).forEach(f => {
      const p = path.resolve(dir, f)
      fs.stat(p, (err, state) => {
        if (err) throw err
        if (state.isDirectory()) {
          watchFiles(p)
        }
      })
    })
  }
  if (watchPath) {
    watchFiles(path.resolve(cwd, watchPath))
  }
}

console.log('JTaro Module Server run on port: ' + port)
