// concat files
var output = "";
var fs = require('fs');
var files = require("./files.js");

var dist = "./dist/yascal.js";
var distMin = "./dist/yascal-min.js";

files.forEach(function(file){
	typeof file == "string" ? append(file) : file.forEach(function(arrayFile){append(arrayFile);})
});

function append(fileName){
	output +=  fs.readFileSync(fileName, 'utf8') + ";"
}

fs.writeFileSync(dist, output , 'utf8');

// uglify
var uglyfyJS = require('uglify-js');
var ast = uglyfyJS.parse(output);
ast.figure_out_scope();
var compressor = uglyfyJS.Compressor({drop_console: true});
ast = ast.transform(compressor);
ast.compute_char_frequency();
ast.mangle_names();

fs.writeFileSync(distMin, ast.print_to_string());
console.log(distMin + ' built.');


