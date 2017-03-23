var rollup = require('rollup')
var path = require('path')
var jtaroModule = require('rollup-plugin-jtaro-module')
var alias = require('./rollup-plugin-paths.js')
var babel = require('rollup-plugin-babel')

rollup.rollup({
  entry: path.resolve('demos/main.js'),
  context: 'window',
  plugins: [
    jtaroModule({ root: 'demos' }),
    alias({
      jquery: './vendors/jquery-2.2.3.min.js', // 以入口文件所在路径为基准
      fruits: './fruits.js',
      a: './letter/a.js'
    }), babel({
      include: '**/a.js',
      'presets': [
        [
          'es2015',
          {
            'modules': false
          }
        ]
      ]
    })]
}).then(function (bundle) {
  bundle.write({
    format: 'iife',
    dest: 'build/main.js'
  })
})
console.log('complete')
