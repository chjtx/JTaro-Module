/* global JTaroLoader */
(function (f) {
  var count = 2
  function g () { if (!--count) f() }
  // JTaroLoader.import('./a.js', g)
  JTaroLoader.import('./b.js', g)
  JTaroLoader.import('./x/x.js', g)
})(function () {
  console.log(window.a)
  console.log(window.b)
  console.log(window.x)
})
