var yascalSourceFiles = [

	// yascal

	// boilerplate
	[
		"src/boilerplate/enum.js",
		"src/boilerplate/eventbus.js"
	],
	// main
	"src/yascal.js",
	"src/properties.js",
	"src/util.js",
	[
		"src/screen.js",
		"src/screen.js",
		"src/sprite.js",
		"src/spriteSheet.js",
		"src/easing.js",
		"src/keyInput.js",
		"src/touchInput.js",
		"src/ticker.js"
	],

	// yascal components
	[
		"src/components/element.js",
		"src/components/panel.js",
		"src/components/listbox.js",
		"src/components/stats.js"
	]
];

if ( typeof module === 'object' ) {
	module.exports = yascalSourceFiles;
}