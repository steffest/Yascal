var yascalSourceFiles = [

	// yascal
	"src/yascal.js",
	"src/properties.js",
	[
		"src/screen.js",
		"src/sprite.js",
		"src/easing.js",
		"src/keyInput.js",
		"src/touchInput.js"
	],

	// yascal components
	[
		"src/components/element.js",
		"src/components/panel.js",
		"src/components/listbox.js"
	]
];

if (typeof exports != "undefined"){
	exports.src = yascalSourceFiles;
}