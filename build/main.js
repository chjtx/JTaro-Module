(function (main_js) {
	'use strict';

	window.b = 'b'

	window.x = 'x'

	// import 'abc.js'
	/* import 'bbb.js'
	//*/

	window.a = 'a' // import 'abc.js'

	/*
	export var x = x
	*/

	console.log(window.a)
	console.log(window.b)
	console.log(window.x)

}(main_js));