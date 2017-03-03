// enums
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




