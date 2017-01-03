var rollup = require('rollup')
var path = require('path')
var jtaroModule = require('./src/rollup-plugin-jtaro-module.js')

rollup.rollup({
  entry: path.resolve('demos/x/x.js'),
  plugins: [jtaroModule({ root: 'demos' })]
}).then(function (bundle) {
  bundle.write({
    format: 'iife',
    dest: 'build/x/x.js'
  })
})
console.log('complete')
