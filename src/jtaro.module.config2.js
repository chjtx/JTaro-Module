var alias = require('rollup-plugin-alias')

module.exports = {
  website: '../', // 站点目录，以server.js所在路径为基准
  entry: '../demos/main.js', // 入口文件，以server.js所在路径为基准
  plugins: [alias({
    jquery: './vendors/jquery-2.2.3.min.js', // 以入口文件所在路径为基准
    fruits: './fruits.js',
    a: './letter/a.js'
  })]
}
