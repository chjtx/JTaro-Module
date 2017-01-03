(function () {
'use strict';

function _$styleInject (id, css) {
  var s=document.getElementById(id)
  if(!s){
    s=document.createElement("style")
    s.id=id
    s.innerHTML=css
    document.head.appendChild(s)
  }
}

window.b = 'b';

var bbb = { bbb: 'hahaha' };

_$styleInject("jtaro_style_demos_a", "\n[jtaro_demos_a] h1 {color:red;}\n[jtaro_demos_a] div,\n[jtaro_demos_a] li {font-size: 16px;}\n");
var tpl = "<div jtaro_demos_a >\r\n  <h1>HEllo JTaro Module !!!</h1>\r\n</div>";

// import { x as bb } from './x/x.js' // x.js
// import 'main.js'

// import 'abc.js'
/* import 'bbb.js'
//*/

// console.log(bb)
console.log(bbb);

var a = 'a'; // import 'abc.js'
var aaa = 'aaa';
var aa = bbb;
function aaaa () {
  return 'aaaa'
}
// export default a5
function a6 () {
  return 'a6'
}


/*
export var x = x
*/


var a$1 = Object.freeze({
	a: a,
	aa: aa,
	a3: aaa,
	aaaa: aaaa,
	default: a6
});

_$styleInject("jtaro_css_demos_a", "\nbody {\r\n  background: #ddd;\r\n}\n");

// import txt from './123.txt'

// export var x = 'xxx'

console.log(a$1);
// console.log(txt)
document.getElementById('jtaro_app').innerHTML = tpl;

}());
