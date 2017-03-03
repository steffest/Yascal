var YascalGl = function(){
    var me = {};

    return me;
}();
var YGL = YascalGl;;// loosely based on https://github.com/mattdesl/kami
YascalGl.context = function(width, height, view, contextAttributes){
    var me = {};

    me.managedObjects = [];
    me.gl = null;
    me.valid = false;

    if (view && typeof window.WebGLRenderingContext !== "undefined" && view instanceof window.WebGLRenderingContext) {
        view = view.canvas;
        me.gl = view;
        me.valid = true;
        contextAttributes = undefined;
    }

    me.view = view || document.createElement("canvas");
    me.width = me.view.width = width || 300;
    me.height = me.view.height = height || 150;
    me.contextAttributes = contextAttributes;

    me.resize = function(width, height) {
        me.width = me.view.width = width;
        me.height = me.view.height = height;
        me.gl.viewport(0, 0, width, height);
    };

    me.view.addEventListener("webglcontextlost", function (ev) {
        ev.preventDefault();
        contextLost(ev);
    }.bind(me));

    me.view.addEventListener("webglcontextrestored", function (ev) {
        ev.preventDefault();
        contextRestored(ev);
    }.bind(me));

    if (!me.valid) initContext();

    me.resize(me.width, me.height);


    function initContext(){
        var err = "";
        me.valid = false;

        try {
            me.gl = (me.view.getContext('webgl', me.contextAttributes) || me.view.getContext('experimental-webgl', me.contextAttributes));
        } catch (e) {
            me.gl = null;
        }

        if (me.gl) {
            me.valid = true;
        } else {
            console.warn("Sorry, WebGL Not Supported, falling back to Canvas");
        }
    }

    me.addManagedObject = function(obj) {
        me.managedObjects.push(obj);
    };

    me.removeManagedObject = function(obj) {
        var idx = me.managedObjects.indexOf(obj);
        if (idx > -1) {
            me.managedObjects.splice(idx, 1);
            return obj;
        }
        return undefined;
    };

    me.destroy = function() {
        for (var i=0; i<me.managedObjects.length; i++) {
            var obj = me.managedObjects[i];
            if (obj && typeof obj.destroy === "function") obj.destroy();
        }
        me.managedObjects.length = 0;
        me.valid = false;
        me.gl = null;
        me.view = null;
        me.width = me.height = 0;
    };

    function contextLost(ev) {
        me.valid = false;

        // Todo: send Event
    }

    function contextRestored(ev) {
        initContext();
        for (var i=0; i<me.managedObjects.length; i++) {
            var obj = me.managedObjects[i];
            if (obj && typeof obj.create === "function") obj.create();
        }
        me.resize(me.width, me.height);

        // Todo: send Event
    }

    return me;
};
;// enums
var TEXTURE = {
	wrap:{
		CLAMP_TO_EDGE: 33071,
		MIRRORED_REPEAT: 33648,
		REPEAT: 10497
	},
	filter:{
		NEAREST: 9728,
		NEAREST_MIPMAP_LINEAR: 9986,
		NEAREST_MIPMAP_NEAREST: 9984,
		LINEAR: 9729,
		LINEAR_MIPMAP_LINEAR: 9987,
		LINEAR_MIPMAP_NEAREST: 9985
	},
	format:{
		DEPTH_COMPONENT: 6402,
		ALPHA: 6406,
		RGBA: 6408,
		RGB: 6407,
		LUMINANCE: 6409,
		LUMINANCE_ALPHA: 6410
	},
	dataType:{
		BYTE: 5120,
		SHORT: 5122,
		INT: 5124,
		FLOAT: 5126,
		UNSIGNED_BYTE: 5121,
		UNSIGNED_INT: 5125,
		UNSIGNED_SHORT: 5123,
		UNSIGNED_SHORT_4_4_4_4: 32819,
		UNSIGNED_SHORT_5_5_5_1: 32820,
		UNSIGNED_SHORT_5_6_5: 33635
	},
	FORCE_POT: false,
	//defaults for create
	UNPACK_FLIP_Y:false,
	UNPACK_ALIGNMENT:1,
	UNPACK_PREMULTIPLY_ALPHA:true,
	UNPACK_COLORSPACE_CONVERSION: undefined,
	USE_DUMMY_1x1_DATA: true
};

TEXTURE.DEFAULT_WRAP =  TEXTURE.wrap.CLAMP_TO_EDGE;
TEXTURE.DEFAULT_FILTER = TEXTURE.filter.NEAREST;


TEXTURE.getNumComponents = function(format) {
	switch (format) {
		case TEXTURE.format.DEPTH_COMPONENT:
		case TEXTURE.format.ALPHA:
		case TEXTURE.format.LUMINANCE:
			return 1;
		case TEXTURE.format.LUMINANCE_ALPHA:
			return 2;
		case TEXTURE.format.RGB:
			return 3;
		case TEXTURE.format.RGBA:
			return 4;
	}
	return null;
};


YascalGl.texture = function(context, width, height, format, dataType, data, genMipmaps){
	var me = {};

	if (typeof context !== "object") throw "please prove a GL context";
	me.context = context;
	me.id = null;
	me.target = context.gl.TEXTURE_2D;
	me.width = 0;
	me.height = 0;

	me.wrapS = TEXTURE.DEFAULT_WRAP;
	me.wrapT = TEXTURE.DEFAULT_WRAP;
	me.minFilter = TEXTURE.DEFAULT_FILTER;
	me.magFilter = TEXTURE.DEFAULT_FILTER;

	me.managedArgs = Array.prototype.slice.call(arguments, 1);

	// recreate texture on context loss/restore
	me.context.addManagedObject(me);

	me.bind = function(unit) {
		if (unit || unit === 0) me.gl.activeTexture(me.gl.TEXTURE0 + unit);
		me.gl.bindTexture(me.target, me.id);
	};

	me.toString = function() {
		return me.id + ":" + me.width + "x" + me.height + "";
	};

	me.setWrap = function(s, t, ignoreBind) {
		if (s && t) {
			me.wrapS = s;
			me.wrapT = t;
		} else
			me.wrapS = me.wrapT = s;

		checkPOT();

		if (!ignoreBind)
			me.bind();

		var gl = me.gl;
		gl.texParameteri(me.target, gl.TEXTURE_WRAP_S, me.wrapS);
		gl.texParameteri(me.target, gl.TEXTURE_WRAP_T, me.wrapT);
	};

	me.setFilter = function(min, mag, ignoreBind) {
		if (min && mag) {
			me.minFilter = min;
			me.magFilter = mag;
		} else
			me.minFilter = me.magFilter = min;

		checkPOT();

		if (!ignoreBind)
			me.bind();

		var gl = this.gl;
		gl.texParameteri(me.target, gl.TEXTURE_MIN_FILTER, me.minFilter);
		gl.texParameteri(me.target, gl.TEXTURE_MAG_FILTER, me.magFilter);
	};


	me.create = function() {
		me.gl = me.context.gl;
		var gl = me.gl;

		me.id = gl.createTexture();
		me.width = me.height = 0;
		me.target = gl.TEXTURE_2D;

		me.bind();

		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, TEXTURE.UNPACK_PREMULTIPLY_ALPHA);
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, TEXTURE.UNPACK_ALIGNMENT);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, TEXTURE.UNPACK_FLIP_Y);

		var colorspace = TEXTURE.UNPACK_COLORSPACE_CONVERSION || gl.BROWSER_DEFAULT_WEBGL;
		gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, colorspace);


		me.setWrap(me.wrapS, me.wrapT, false);
		me.setFilter(me.minFilter, me.magFilter, false);

		if (me.managedArgs.length !== 0) {
			me.setup.apply(this, me.managedArgs);
		}
	};

	me.destroy = function() {
		if (me.id && me.gl)
			me.gl.deleteTexture(me.id);
		if (me.context)
			me.context.removeManagedObject(me);
		me.width = me.height = 0;
		me.id = null;
		me.managedArgs = null;
		me.context = null;
		me.gl = null;
	};

	me.uploadData = function(width, height, format, type, data, genMipmaps) {
		var gl = me.gl;

		format = format || gl.RGBA;
		type = type || gl.UNSIGNED_BYTE;
		data = data || null; //make sure falsey value is null for texImage2D

		me.width = (width || width==0) ? width : me.width;
		me.height = (height || height==0) ? height : me.height;

		checkPOT();

		me.bind();

		gl.texImage2D(me.target, 0, format, me.width, me.height, 0, format, type, data);

		if (genMipmaps) gl.generateMipmap(me.target);
	};


	me.uploadImage = function(domObject, format, type, genMipmaps) {
		var gl = me.gl;

		format = format || gl.RGBA;
		type = type || gl.UNSIGNED_BYTE;

		me.width = domObject.width;
		me.height = domObject.height;

		checkPOT();

		me.bind();

		gl.texImage2D(me.target, 0, format, format, type, domObject);

		if (genMipmaps) gl.generateMipmap(me.target);
	};


	me.setup = function(width, height, format, dataType, data, genMipmaps) {
		var gl = me.gl;

		//If the first argument is a string, assume it's an Image loader
		//second argument will then be genMipmaps, third and fourth the success/fail callbacks
		// YUCK .... TODO FIXME
		if (typeof width === "string") {
			var img = new Image();
			var path      = arguments[0];   //first argument, the path
			var successCB = typeof arguments[1] === "function" ? arguments[1] : null;
			var failCB    = typeof arguments[2] === "function" ? arguments[2] : null;
			genMipmaps    = !!arguments[3];

			var self = this;

			if (TEXTURE.USE_DUMMY_1x1_DATA) {
				me.uploadData(1, 1);
				me.width = me.height = 0;
			}

			img.onload = function() {
				me.uploadImage(img, undefined, undefined, genMipmaps);
				if (successCB) successCB();
			};
			img.onerror = function() {
				console.warn("Error loading image: "+path);
				if (genMipmaps) gl.generateMipmap(gl.TEXTURE_2D);
				if (failCB) failCB();
			};
			img.onabort = function() {
				console.warn("Image load aborted: "+path);
				if (genMipmaps) gl.generateMipmap(gl.TEXTURE_2D);
				if (failCB) failCB();
			};

			img.src = path;
		}

		//otherwise assume our regular list of width/height arguments are passed
		else {
			this.uploadData(width, height, format, dataType, data, genMipmaps);
		}
	};


	function checkPOT() {
		if (!TEXTURE.FORCE_POT) {
			var wrongFilter = (me.minFilter !== TEXTURE.filter.LINEAR && me.minFilter !== TEXTURE.filter.NEAREST);
			var wrongWrap = (me.wrapS !== TEXTURE.wrap.CLAMP_TO_EDGE || me.wrapT !== TEXTURE.wrap.CLAMP_TO_EDGE);

			if ( wrongFilter || wrongWrap ) {
				if (!isPowerOfTwo(me.width) || !isPowerOfTwo(me.height))
					throw new Error(wrongFilter
						? "Non-power-of-two textures cannot use mipmapping as filter"
						: "Non-power-of-two textures must use CLAMP_TO_EDGE as wrap");
			}
		}
	}

	me.create();

	return me;

};




;YascalGl.textureRegion = function(texture, x, y, width, height){

	var me = {};

	me.width = 0;
	me.height = 0;
	me.u = 0;
	me.v = 0;
	me.u2 = 0;
	me.v2 = 0;

	me.texture = texture;

	me.setUVs = function(u, v, u2, v2) {
		me.width = Math.round(Math.abs(u2 - u) * me.texture.width);
		me.height = Math.round(Math.abs(v2 - v) * me.texture.height);

		me.u = u;
		me.v = v;
		me.u2 = u2;
		me.v2 = v2;
	};

	me.setRegion = function(x, y, width, height) {
		x = x || 0;
		y = y || 0;
		width = (typeof width === "number") ? width : me.texture.width;
		height = (typeof height === "number") ? height : me.texture.height;

		var invTexWidth = 1 / me.texture.width;
		var invTexHeight = 1 / me.texture.height;
		me.setUVs(x * invTexWidth, y * invTexHeight, (x + width) * invTexWidth, (y + height) * invTexHeight);
		me.width = Math.abs(width);
		me.height = Math.abs(height);
	};

	me.setRegion(x, y, width, height);



	Object.defineProperty(me, "x", {
		get: function() {
			return Math.round(me.u * me.texture.width);
		}
	});

	Object.defineProperty(me, "y", {
		get: function() {
			return Math.round(me.v * me.texture.height);
		}
	});

	return me;
};

/*
TextureRegion.prototype.copy = function(region) {
	this.texture = region.texture;
	this.u = region.u;
	this.v = region.v;
	this.u2 = region.u2;
	this.v2 = region.v2;
	this.width = region.width;
	this.height = region.height;
	return this;
};

TextureRegion.prototype.clone = function() {
	return new TextureRegion(this.texture, this.x, this.y, this.width, this.height);
};







TextureRegion.prototype.flip = function(x, y) {
	var temp;
	if (x) {
		temp = this.u;
		this.u = this.u2;
		this.u2 = temp;
	}
	if (y) {
		temp = this.v;
		this.v = this.v2;
		this.v2 = temp;
	}
};

 */;// loosely based on https://github.com/mattdesl/kami

var int8 = new Int8Array(4);
var int32 = new Int32Array(int8.buffer, 0, 1);
var float32 = new Float32Array(int8.buffer, 0, 1);

YascalGl.numberUtil = function() {
    var me = {};

    me.intBitsToFloat = function(i) {
        int32[0] = i;
        return float32[0];
    };

    me.floatToIntBits = function(f) {
        float32[0] = f;
        return int32[0];
    };

    me.intToFloatColor = function(value) {
        return me.intBitsToFloat( value & 0xfeffffff );
    };

    me.colorToFloat = function(r, g, b, a) {
        var bits = (a << 24 | b << 16 | g << 8 | r);
        return me.intToFloatColor(bits);
    };

    me.isPowerOfTwo = function(n) {
        return (n & (n - 1)) == 0;
    };

    me.nextPowerOfTwo = function(n) {
        n--;
        n |= n >> 1;
        n |= n >> 2;
        n |= n >> 4;
        n |= n >> 8;
        n |= n >> 16;
        return n+1;
    };

    return me;
}();;YascalGl.shaderProgram = function(context, vertSource, fragSource, attributeLocations){
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
;YascalGl.mesh = function(context, isStatic, numVerts, numIndices, vertexAttribs){
	var me = {};

	me.dirty = {
		set: function(val) {
			me.verticesDirty = val;
			me.indicesDirty = val;
		}
	};


	if (typeof context !== "object") throw "GL context not specified to Mesh";
	if (!numVerts) throw "numVerts not specified, must be > 0";

	me.context = context;
	me.gl = context.gl;

	me.numVerts = null;
	me.numIndices = null;

	me.vertices = null;
	me.indices = null;
	me.vertexBuffer = null;
	me.indexBuffer = null;

	me.verticesDirty = true;
	me.indicesDirty = true;
	me.indexUsage = null;
	me.vertexUsage = null;


	me._vertexAttribs = null;
	me.vertexStride = null;

	me.numVerts = numVerts;
	me.numIndices = numIndices || 0;
	me.vertexUsage = isStatic ? me.gl.STATIC_DRAW : me.gl.DYNAMIC_DRAW;
	me.indexUsage  = isStatic ? me.gl.STATIC_DRAW : me.gl.DYNAMIC_DRAW;
	me._vertexAttribs = vertexAttribs || [];

	me.indicesDirty = true;
	me.verticesDirty = true;

	//determine the vertex stride based on given attributes
	var totalNumComponents = 0;
	for (var i=0; i<me._vertexAttribs.length; i++)
		totalNumComponents += me._vertexAttribs[i].offsetCount;
	me.vertexStride = totalNumComponents * 4; // in bytes

	me.vertices = new Float32Array(me.numVerts);
	me.indices = new Uint16Array(me.numIndices);

	//add this VBO to the managed cache
	me.context.addManagedObject(me);


	me.create = function() {
		me.gl = me.context.gl;
		var gl = me.gl;
		me.vertexBuffer = gl.createBuffer();

		//ignore index buffer if we haven't specified any
		me.indexBuffer = me.numIndices > 0
			? gl.createBuffer()
			: null;

		me.dirty = true;
	};

	me.destroy = function() {
		me.vertices = null;
		me.indices = null;
		if (me.vertexBuffer && me.gl)
			me.gl.deleteBuffer(me.vertexBuffer);
		if (me.indexBuffer && me.gl)
			me.gl.deleteBuffer(me.indexBuffer);
		me.vertexBuffer = null;
		me.indexBuffer = null;
		if (me.context)
			me.context.removeManagedObject(me);
		me.gl = null;
		me.context = null;
	};

	me._updateBuffers = function(ignoreBind, subDataLength) {
		var gl = me.gl;

		//bind our index data, if we have any
		if (me.numIndices > 0) {
			if (!ignoreBind)
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, me.indexBuffer);

			//update the index data
			if (me.indicesDirty) {
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, me.indices, me.indexUsage);
				me.indicesDirty = false;
			}
		}

		//bind our vertex data
		if (!ignoreBind)
			gl.bindBuffer(gl.ARRAY_BUFFER, me.vertexBuffer);

		//update our vertex data
		if (me.verticesDirty) {
			if (subDataLength) {
				// TODO: When decoupling VBO/IBO be sure to give better subData support..
				var view = me.vertices.subarray(0, subDataLength);
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
			} else {
				gl.bufferData(gl.ARRAY_BUFFER, me.vertices, me.vertexUsage);
			}


			me.verticesDirty = false;
		}
	};

	me.draw = function(primitiveType, count, offset, subDataLength) {
		if (count === 0)
			return;

		var gl = me.gl;

		offset = offset || 0;

		//binds and updates our buffers. pass ignoreBind as true
		//to avoid binding unnecessarily
		me._updateBuffers(true, subDataLength);

		if (me.numIndices > 0) {
			gl.drawElements(primitiveType, count,
				gl.UNSIGNED_SHORT, offset * 2); //* Uint16Array.BYTES_PER_ELEMENT
		} else
			gl.drawArrays(primitiveType, offset, count);
	};


	me.bind = function(shader) {
		var gl = me.gl;

		var offset = 0;
		var stride = me.vertexStride;

		//bind and update our vertex data before binding attributes
		me._updateBuffers();

		//for each attribtue
		for (var i=0; i<me._vertexAttribs.length; i++) {
			var a = me._vertexAttribs[i];

			//location of the attribute
			var loc = a.location === null
				? shader.getAttributeLocation(a.name)
				: a.location;

			//TODO: We may want to skip unfound attribs
			// if (loc!==0 && !loc)
			// 	console.warn("WARN:", a.name, "is not enabled");

			//first, enable the vertex array
			gl.enableVertexAttribArray(loc);

			//then specify our vertex format
			gl.vertexAttribPointer(loc, a.numComponents, a.type || gl.FLOAT,
				a.normalize, stride, offset);

			//and increase the offset...
			offset += a.offsetCount * 4; //in bytes
		}
	};

	me.unbind = function(shader) {
		var gl = me.gl;

		//for each attribtue
		for (var i=0; i<me._vertexAttribs.length; i++) {
			var a = me._vertexAttribs[i];

			//location of the attribute
			var loc = a.location === null
				? shader.getAttributeLocation(a.name)
				: a.location;

			//first, enable the vertex array
			gl.disableVertexAttribArray(loc);
		}
	};

	me.create();

	return me;
};


YascalGl.mesh.attrib = function(name, numComponents, location, type, normalize, offsetCount){

	var meAttrib = {};

	meAttrib.name = name;
	meAttrib.numComponents = numComponents;
	meAttrib.location = typeof location === "number" ? location : null;
	meAttrib.type = type;
	meAttrib.normalize = Boolean(normalize);
	meAttrib.offsetCount = typeof offsetCount === "number" ? offsetCount : meAttrib.numComponents;

	return meAttrib;
};

;YascalGl.batcher = function(context, size){
	var me = {};

	if (typeof context !== "object") throw "GL context not specified.";
	me.context = context;

	me.size = size || 500;
	me.size = Math.min(me.size,10000);
	// theoretical max is:  65535 is max index, so 65535 / 6 = 10922.


	me._createMesh = function(size) {
		//the total number of floats in our batch
		var numVerts = size * 4 * me.getVertexSize();
		//the total number of indices in our batch
		var numIndices = size * 6;
		var gl = me.context.gl;

		//vertex data
		me.vertices = new Float32Array(numVerts);
		//index data
		me.indices = new Uint16Array(numIndices);

		for (var i=0, j=0; i < numIndices; i += 6, j += 4)
		{
			me.indices[i + 0] = j + 0;
			me.indices[i + 1] = j + 1;
			me.indices[i + 2] = j + 2;
			me.indices[i + 3] = j + 0;
			me.indices[i + 4] = j + 2;
			me.indices[i + 5] = j + 3;
		}

		var mesh = YascalGl.mesh(me.context, false, numVerts, numIndices, me._createVertexAttributes());
		mesh.vertices = me.vertices;
		mesh.indices = me.indices;
		mesh.vertexUsage = gl.DYNAMIC_DRAW;
		mesh.indexUsage = gl.STATIC_DRAW;
		mesh.dirty = true;
		return mesh;
	};

	me._createShader = function() {
		throw "_createShader not implemented"
	};

	me._createVertexAttributes = function() {
		throw "_createVertexAttributes not implemented";
	};

	me.getVertexSize = function() {
		throw "getVertexSize not implemented";
	};



	me.blendingEnabled = {
		set: function(val) {
			var old = me._blendingEnabled;
			if (me.drawing)
				me.flush();

			me._blendingEnabled = val;

			if (me.drawing && old != val) {
				var gl = me.context.gl;
				if (val)
					gl.enable(gl.BLEND);
				else
					gl.disable(gl.BLEND);
			}
		},

		get: function() {
			return me._blendingEnabled;
		}
	};

	me.blendSrc = {
		set: function(val) {
			if (me.drawing) me.flush();
			me._blendSrc = val;
		},

		get: function() {
			return me._blendSrc;
		}
	};

	me.blendDst = {
		set: function(val) {
			if (me.drawing) me.flush();
			me._blendDst = val;
		},

		get: function() {
			return me._blendDst;
		}
	};

	me.setBlendFunction = function(blendSrc, blendDst) {
		me.blendSrc = blendSrc;
		me.blendDst = blendDst;
	};

	// todo - fixme
	me.shader = {
		set: function(val) {
			var wasDrawing = me.drawing;
			if (wasDrawing) me.end();
			me._shader = val ? val : me.defaultShader;
			if (wasDrawing) me.begin();
		},

		get: function() {
			return me._shader;
		}
	};

	me.setColor = function(r, g, b, a) {
		var rnum = typeof r === "number";
		if (rnum
			&& typeof g === "number"
			&& typeof b === "number") {
			//default alpha to one
			a = (a || a === 0) ? a : 1.0;
		} else {
			r = g = b = a = rnum ? r : 1.0;
		}

		if (me.premultiplied) {
			r *= a;
			g *= a;
			b *= a;
		}

		me.color = colorToFloat(
			~~(r * 255),
			~~(g * 255),
			~~(b * 255),
			~~(a * 255)
		);
	};




	me.begin = function()  {
		if (me.drawing) throw "batch.end() must be called before begin";
		me.drawing = true;
		me._shader.bind();

		//bind the attributes now to avoid redundant calls
		me.mesh.bind(me._shader);

		if (me._blendingEnabled) {
			var gl = me.context.gl;
			gl.enable(gl.BLEND);
		}
	};
	me._begin = me.begin;

	me.end = function()  {
		if (!me.drawing)
			throw "batch.begin() must be called before end";
		if (me.idx > 0)
			me.flush();
		me.drawing = false;

		me.mesh.unbind(me._shader);

		if (me._blendingEnabled) {
			var gl = me.context.gl;
			gl.disable(gl.BLEND);
		}
	};
	me._end = me.end;

	me._preRender = function()  {
	};

	me.flush = function()  {
		if (me.idx===0) return;

		var gl = me.context.gl;

		if (me._blendingEnabled) {
			if (me._blendSrc && me._blendDst) gl.blendFunc(me._blendSrc, me._blendDst);
		}

		me._preRender();

		//number of sprites in batch
		var numComponents = me.getVertexSize();
		var spriteCount = (me.idx / (numComponents * 4));

		//draw the sprites
		me.mesh.verticesDirty = true;
		me.mesh.draw(gl.TRIANGLES, spriteCount * 6, 0, me.idx);

		me.idx = 0;
	};
	me._flush = me.flush;

	me.draw = function(texture, x, y, width, height, u1, v1, u2, v2) {
	};

	me.drawVertices = function(texture, verts, off)  {
	};

	me.drawRegion = function(region, x, y, width, height) {
		me.draw(region.texture, x, y, width, height, region.u, region.v, region.u2, region.v2);
	};

	me.destroy = function() {
		me.vertices = null;
		me.indices = null;
		me.size = me.maxVertices = 0;

		if (me.ownsShader && me.defaultShader)
			me.defaultShader.destroy();
		me.defaultShader = null;
		me._shader = null; // remove reference to whatever shader is currently being used

		if (me.mesh)
			me.mesh.destroy();
		me.mesh = null;
	};

	return me;
};

;// This is based on the pretty awesome batcher on https://github.com/mattdesl/kami/blob/master/lib/SpriteBatch.js

/**
* A basic implementation of a batcher which draws 2D sprites.
* This uses two triangles (quads) with indexed and interleaved
* vertex data. Each vertex holds 5 floats (Position.xy, Color, TexCoord0.xy).
*
* The color is packed into a single float to reduce vertex bandwidth, and
* the data is interleaved for best performance. We use a static index buffer,
* and a dynamicy vertex buffer that is updated with bufferSubData.
 */



// enum


var SHADERPROGRAM = {
	POSITION_ATTRIBUTE: "Position",
	NORMAL_ATTRIBUTE: "Normal",
	COLOR_ATTRIBUTE: "Color",
	TEXCOORD_ATTRIBUTE: "TexCoord"
};


var SPRITEBATCH = {
	VERTEX_SIZE: 5,
	totalRenderCalls: 0,
	DEFAULT_FRAG_SHADER :[
	"precision mediump float;",
	"varying vec2 vTexCoord0;",
	"varying vec4 vColor;",
	"uniform sampler2D u_texture0;",

	"void main(void) {",
	"   gl_FragColor = texture2D(u_texture0, vTexCoord0) * vColor;",
	"}"
	].join('\n'),
	DEFAULT_VERT_SHADER:[
	"attribute vec2 "+SHADERPROGRAM.POSITION_ATTRIBUTE+";",
	"attribute vec4 "+SHADERPROGRAM.COLOR_ATTRIBUTE+";",
	"attribute vec2 "+SHADERPROGRAM.TEXCOORD_ATTRIBUTE+"0;",

	"uniform vec2 u_projection;",
	"varying vec2 vTexCoord0;",
	"varying vec4 vColor;",

	"void main(void) {", ///TODO: use a projection and transform matrix
	"   gl_Position = vec4( "
	+SHADERPROGRAM.POSITION_ATTRIBUTE
	+".x / u_projection.x - 1.0, "
	+SHADERPROGRAM.POSITION_ATTRIBUTE
	+".y / -u_projection.y + 1.0 , 0.0, 1.0);",
	"   vTexCoord0 = "+SHADERPROGRAM.TEXCOORD_ATTRIBUTE+"0;",
	"   vColor = "+SHADERPROGRAM.COLOR_ATTRIBUTE+";",
	"}"
	].join('\n')
};


YascalGl.spriteBatch = function(context, size){
	var me = YascalGl.batcher(context, size);

	me.projection = new Float32Array(2);

	//Sets up a default projection vector so that the batch works without setProjection
	me.projection[0] = me.context.width/2;
	me.projection[1] = me.context.height/2;
	me.texture = null;

	me.resize = function(width, height) {
		me.setProjection(width/2, height/2);
	};

	me.getVertexSize = function() {
		return SPRITEBATCH.VERTEX_SIZE;
	};

	me._createVertexAttributes = function() {
		var gl = me.context.gl;

		return [
			YascalGl.mesh.attrib(SHADERPROGRAM.POSITION_ATTRIBUTE, 2),
			//pack the color using some crazy wizardry
			YascalGl.mesh.attrib(SHADERPROGRAM.COLOR_ATTRIBUTE, 4, null, gl.UNSIGNED_BYTE, true, 1),
			YascalGl.mesh.attrib(SHADERPROGRAM.TEXCOORD_ATTRIBUTE+"0", 2)
		];
	};

	me.setProjection = function(x, y) {
		var oldX = me.projection[0];
		var oldY = me.projection[1];
		me.projection[0] = x;
		me.projection[1] = y;

		//we need to flush the batch..
		if (me.drawing && (x != oldX || y != oldY)) {
			me.flush();
			me._updateMatrices();
		}
	};

	me._createShader = function() {
		var shader = YascalGl.shaderProgram(me.context,
			SPRITEBATCH.DEFAULT_VERT_SHADER,
			SPRITEBATCH.DEFAULT_FRAG_SHADER);
		if (shader.log)
			console.warn("Shader Log:\n" + shader.log);
		return shader;
	};

	me.updateMatrices = function() {
		me._shader.setUniformfv("u_projection", me.projection);
	};

	me._preRender = function() {
		if (me.texture) me.texture.bind();
	};

	me.begin = function() {
		//sprite batch doesn't hold a reference to GL since it is volatile
		var gl = me.context.gl;

		//This binds the shader and mesh!
		//BaseBatch.prototype.begin.call(this);
		me._begin();

		me.updateMatrices(); //send projection/transform to shader

		//upload the sampler uniform. not necessary every flush so we just
		//do it here.
		me._shader.setUniformi("u_texture0", 0);

		//disable depth mask
		gl.depthMask(false);
	};

	me.end = function() {
		//sprite batch doesn't hold a reference to GL since it is volatile
		var gl = me.context.gl;

		//just do direct parent call for speed here
		//This binds the shader and mesh!
		//BaseBatch.prototype.end.call(this);
		me._end();

		gl.depthMask(true);
	};



	/**
	 * Flushes the batch to the GPU. This should be called when
	 * state changes, such as blend functions, depth or stencil states,
	 * shaders, and so forth.
	 *
	 * @method flush
	 */
	me.flush = function() {
		//ignore flush if texture is null or our batch is empty
		if (!me.texture) return;
		if (me.idx === 0) return;
		//BaseBatch.prototype.flush.call(this);
		me._flush();
		SPRITEBATCH.totalRenderCalls++;
	};

	/**
	 * Adds a sprite to this batch.
	 * *
	 * @method draw
	 * @param  {Texture} texture the texture for this sprite
	 * @param  {Number} x       the x position, defaults to zero
	 * @param  {Number} y       the y position, defaults to zero
	 * @param  {Number} width   the width, defaults to the texture width
	 * @param  {Number} height  the height, defaults to the texture height
	 * @param  {Number} u1      the first U coordinate, default zero
	 * @param  {Number} v1      the first V coordinate, default zero
	 * @param  {Number} u2      the second U coordinate, default one
	 * @param  {Number} v2      the second V coordinate, default one
	 */
	me.draw = function(texture, x, y, width, height, u1, v1, u2, v2) {
		if (!me.drawing) throw "Illegal State: trying to draw a batch before begin()";

		//don't draw anything if GL tex doesn't exist..
		if (!texture) return;

		if (me.texture === null || me.texture.id !== texture.id) {
			//new texture.. flush previous data
			me.flush();
			me.texture = texture;
		} else if (me.idx == me.vertices.length) {
			me.flush(); //we've reached our max, flush before pushing more data
		}

		width = (width===0) ? width : (width || texture.width);
		height = (height===0) ? height : (height || texture.height);
		x = x || 0;
		y = y || 0;

		var x1 = x;
		var x2 = x + width;
		var y1 = y;
		var y2 = y + height;

		u1 = u1 || 0;
		u2 = (u2===0) ? u2 : (u2 || 1);
		v1 = v1 || 0;
		v2 = (v2===0) ? v2 : (v2 || 1);

		var c = me.color;

		//xy
		me.vertices[me.idx++] = x1;
		me.vertices[me.idx++] = y1;
		//color
		me.vertices[me.idx++] = c;
		//uv
		me.vertices[me.idx++] = u1;
		me.vertices[me.idx++] = v1;

		//xy
		me.vertices[me.idx++] = x2;
		me.vertices[me.idx++] = y1;
		//color
		me.vertices[me.idx++] = c;
		//uv
		me.vertices[me.idx++] = u2;
		me.vertices[me.idx++] = v1;

		//xy
		me.vertices[me.idx++] = x2;
		me.vertices[me.idx++] = y2;
		//color
		me.vertices[me.idx++] = c;
		//uv
		me.vertices[me.idx++] = u2;
		me.vertices[me.idx++] = v2;

		//xy
		me.vertices[me.idx++] = x1;
		me.vertices[me.idx++] = y2;
		//color
		me.vertices[me.idx++] = c;
		//uv
		me.vertices[me.idx++] = u1;
		me.vertices[me.idx++] = v2;
	};

	me.drawVertices = function(texture, verts, off) {
		if (!me.drawing) throw "Illegal State: trying to draw a batch before begin()";

		//don't draw anything if GL tex doesn't exist..
		if (!texture) return;

		if (me.texture != texture) {
			//new texture.. flush previous data
			me.flush();
			me.texture = texture;
		} else if (me.idx == me.vertices.length) {
			me.flush(); //we've reached our max, flush before pushing more data
		}

		off = off || 0;
		//TODO: use a loop here?
		//xy
		me.vertices[me.idx++] = verts[off++];
		me.vertices[me.idx++] = verts[off++];
		//color
		me.vertices[me.idx++] = verts[off++];
		//uv
		me.vertices[me.idx++] = verts[off++];
		me.vertices[me.idx++] = verts[off++];

		//xy
		me.vertices[me.idx++] = verts[off++];
		me.vertices[me.idx++] = verts[off++];
		//color
		me.vertices[me.idx++] = verts[off++];
		//uv
		me.vertices[me.idx++] = verts[off++];
		me.vertices[me.idx++] = verts[off++];

		//xy
		me.vertices[me.idx++] = verts[off++];
		me.vertices[me.idx++] = verts[off++];
		//color
		me.vertices[me.idx++] = verts[off++];
		//uv
		me.vertices[me.idx++] = verts[off++];
		me.vertices[me.idx++] = verts[off++];

		//xy
		me.vertices[me.idx++] = verts[off++];
		me.vertices[me.idx++] = verts[off++];
		//color
		me.vertices[me.idx++] = verts[off++];
		//uv
		me.vertices[me.idx++] = verts[off++];
		me.vertices[me.idx++] = verts[off++];
	};

	me._shader = me._createShader();
	me._blendSrc = me.context.gl.ONE;
	me._blendDst = me.context.gl.ONE_MINUS_SRC_ALPHA;
	me._blendingEnabled = true;

	me.defaultShader = me._shader;
	me.ownsShader = true;
	me.idx = 0;
	me.drawing = false;
	me.mesh = me._createMesh(me.size);

	me.color = YascalGl.numberUtil.colorToFloat(255, 255, 255, 255);
	me.premultiplied = true;

	return me;
};

;