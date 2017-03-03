YascalGl.shaderProgram = function(context, vertSource, fragSource, attributeLocations){
	var me = {};

	if (!vertSource || !fragSource)
		throw "vertex and fragment shaders must be defined";
	if (typeof context !== "object")
		throw "GL context not specified to ShaderProgram";
	me.context = context;

	me.vertShader = null;
	me.fragShader = null;
	me.program = null;
	me.log = "";

	me.uniformCache = null;
	me.attributeCache = null;

	me.attributeLocations = attributeLocations;

	//We trim (ECMAScript5) so that the GLSL line numbers are
	//accurate on shader log
	me.vertSource = vertSource.trim();
	me.fragSource = fragSource.trim();

	//Adds the shader to the context, to be managed
	me.context.addManagedObject(me);

	me.create = function() {
		me.gl = me.context.gl;
		me._compileShaders();
	};


	me._compileShaders = function() {
		var gl = me.gl;

		me.log = "";

		me.vertShader = me._loadShader(gl.VERTEX_SHADER, me.vertSource);
		me.fragShader = me._loadShader(gl.FRAGMENT_SHADER, me.fragSource);

		if (!me.vertShader || !me.fragShader)
			throw "Error returned when calling createShader";

		me.program = gl.createProgram();

		gl.attachShader(me.program, me.vertShader);
		gl.attachShader(me.program, me.fragShader);

		//TODO: This seems not to be working on my OSX -- maybe a driver bug?
		if (me.attributeLocations) {
			for (var key in me.attributeLocations) {
				if (me.attributeLocations.hasOwnProperty(key)) {
					gl.bindAttribLocation(me.program, Math.floor(me.attributeLocations[key]), key);
				}
			}
		}

		gl.linkProgram(me.program);

		me.log += gl.getProgramInfoLog(me.program) || "";

		if (!gl.getProgramParameter(me.program, gl.LINK_STATUS)) {
			throw "Error linking the shader program:\n"
			+ me.log;
		}

		me._fetchUniforms();
		me._fetchAttributes();
	};


	me._fetchUniforms = function() {
		var gl = me.gl;

		me.uniformCache = {};

		var len = gl.getProgramParameter(me.program, gl.ACTIVE_UNIFORMS);
		if (!len) //null or zero
			return;

		for (var i=0; i<len; i++) {
			var info = gl.getActiveUniform(me.program, i);
			if (info === null)
				continue;
			var name = info.name;
			var location = gl.getUniformLocation(me.program, name);

			me.uniformCache[name] = {
				size: info.size,
				type: info.type,
				location: location
			};
		}
	};

	me._fetchAttributes = function() {
		var gl = me.gl;

		me.attributeCache = {};

		var len = gl.getProgramParameter(me.program, gl.ACTIVE_ATTRIBUTES);
		if (!len) //null or zero
			return;

		for (var i=0; i<len; i++) {
			var info = gl.getActiveAttrib(me.program, i);
			if (info === null)
				continue;
			var name = info.name;

			//the attrib location is a simple index
			var location = gl.getAttribLocation(me.program, name);

			me.attributeCache[name] = {
				size: info.size,
				type: info.type,
				location: location
			};
		}
	};

	me._loadShader = function(type, source) {
		var gl = me.gl;

		var shader = gl.createShader(type);
		if (!shader) //should not occur...
			return -1;

		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		var logResult = gl.getShaderInfoLog(shader) || "";
		if (logResult) {
			//so we know which shader has the error
			var typeStr = (type === gl.VERTEX_SHADER) ? "vertex" : "fragment";
			logResult = "Error compiling "+ typeStr+ " shader:\n"+logResult;
		}

		me.log += logResult;

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) ) {
			throw me.log;
		}
		return shader;
	};

	me.bind =  function() {
		me.gl.useProgram(me.program);
	};

	me.destroy =  function() {
		if (me.context)
			me.context.removeManagedObject(me);

		if (me.gl && me.program) {
			var gl = me.gl;
			gl.detachShader(me.program, me.vertShader);
			gl.detachShader(me.program, me.fragShader);

			gl.deleteShader(me.vertShader);
			gl.deleteShader(me.fragShader);
			gl.deleteProgram(me.program);
		}
		me.attributeCache = null;
		me.uniformCache = null;
		me.vertShader = null;
		me.fragShader = null;
		me.program = null;
		me.gl = null;
		me.context = null;
	};

	me.getUniformInfo = function(name) {
		return me.uniformCache[name] || null;
	};


	me.getAttributeInfo = function(name) {
		return me.attributeCache[name] || null;
	};

	me.getAttributeLocation = function(name) { //TODO: make faster, don't cache
		var info = me.getAttributeInfo(name);
		return info ? info.location : null;
	};

	me.getUniformLocation = function(name) {
		var info = me.getUniformInfo(name);
		return info ? info.location : null;
	};


	me.hasUniform = function(name) {
		return me.getUniformInfo(name) !== null;
	};

	me.hasAttribute = function(name) {
		return me.getAttributeInfo(name) !== null;
	};

	me.getUniform = function(name) {
		return me.gl.getUniform(me.program, me.getUniformLocation(name));
	};

	me.getUniformAt = function(location) {
		return me.gl.getUniform(me.program, location);
	};

	me.setUniformi = function(name, x, y, z, w) {
		'use strict';
		var gl = me.gl;
		var loc = me.getUniformLocation(name);
		if (loc === null)
			return false;
		switch (arguments.length) {
			case 2: gl.uniform1i(loc, x); return true;
			case 3: gl.uniform2i(loc, x, y); return true;
			case 4: gl.uniform3i(loc, x, y, z); return true;
			case 5: gl.uniform4i(loc, x, y, z, w); return true;
			default:
				throw "invalid arguments to setUniformi";
		}
	};

	me.setUniformf = function(name, x, y, z, w) {
		'use strict';
		var gl = me.gl;
		var loc = me.getUniformLocation(name);
		if (loc === null)
			return false;
		switch (arguments.length) {
			case 2: gl.uniform1f(loc, x); return true;
			case 3: gl.uniform2f(loc, x, y); return true;
			case 4: gl.uniform3f(loc, x, y, z); return true;
			case 5: gl.uniform4f(loc, x, y, z, w); return true;
			default:
				throw "invalid arguments to setUniformf";
		}
	};

	me.setUniformfv = function(name, arrayBuffer, count) {
		'use strict';
		count = count || arrayBuffer.length;
		var gl = me.gl;
		var loc = me.getUniformLocation(name);
		if (loc === null)
			return false;
		switch (count) {
			case 1: gl.uniform1fv(loc, arrayBuffer); return true;
			case 2: gl.uniform2fv(loc, arrayBuffer); return true;
			case 3: gl.uniform3fv(loc, arrayBuffer); return true;
			case 4: gl.uniform4fv(loc, arrayBuffer); return true;
			default:
				throw "invalid arguments to setUniformf";
		}
	};


	me.setUniformiv =  function(name, arrayBuffer, count) {
		'use strict';
		count = count || arrayBuffer.length;
		var gl = me.gl;
		var loc = me.getUniformLocation(name);
		if (loc === null)
			return false;
		switch (count) {
			case 1: gl.uniform1iv(loc, arrayBuffer); return true;
			case 2: gl.uniform2iv(loc, arrayBuffer); return true;
			case 3: gl.uniform3iv(loc, arrayBuffer); return true;
			case 4: gl.uniform4iv(loc, arrayBuffer); return true;
			default:
				throw "invalid arguments to setUniformf";
		}
	};


	me.setUniformMatrix3 = function(name, mat, transpose) {
		'use strict';
		var arr = typeof mat === "object" && mat.val ? mat.val : mat;
		transpose = !!transpose; //to boolean

		var gl = me.gl;
		var loc = me.getUniformLocation(name);
		if (loc === null)
			return false;
		gl.uniformMatrix3fv(loc, transpose, arr)
	};


	me.setUniformMatrix4 =  function(name, mat, transpose) {
		'use strict';
		var arr = typeof mat === "object" && mat.val ? mat.val : mat;
		transpose = !!transpose; //to boolean

		var gl = me.gl;
		var loc = me.getUniformLocation(name);
		if (loc === null)
			return false;
		gl.uniformMatrix4fv(loc, transpose, arr)
	};


	me.create();

	return me;
};
