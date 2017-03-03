// based on https://github.com/mattdesl/kami

YascalGl.mesh = function(context, isStatic, numVerts, numIndices, vertexAttribs){
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

