YascalGl.batcher = function(context, size){
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

