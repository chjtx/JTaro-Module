var rollup = require('rollup')
var path = require('path')
var jtaroModule = require('rollup-plugin-jtaro-module')

rollup.rollup({
  entry: path.resolve('demos/main.js'),
  context: 'window',
  plugins: [jtaroModule({ root: 'demos' })]
}).then(function (bundle) {
  bundle.write({
    format: 'iife',
    dest: 'build/main.js'
  })
})
console.log('complete')
