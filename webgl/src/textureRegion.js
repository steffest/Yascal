YascalGl.textureRegion = function(texture, x, y, width, height){

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

 */