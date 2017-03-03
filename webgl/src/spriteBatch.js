// This is based on the pretty awesome batcher on https://github.com/mattdesl/kami/blob/master/lib/SpriteBatch.js
// and https://github.com/mattdesl/gl-sprite-batch
// MIT license

// I stripped out the "node style" stuff and moved towards functional inheritance

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

