Yascal.sprite = function(initialProperties){
	var me = {};

	if (Y.useWebGL){
		// webgl texture region

		me.width = initialProperties.width;
		me.height = initialProperties.height;
		me.texture = initialProperties.img;

		me.x = initialProperties.x;
		me.y = initialProperties.y;

		me.region = YGL.textureRegion(initialProperties.img,me.x,me.y,me.width,me.height);

	}else{
		// canvas Sprite
		me.canvas = document.createElement("canvas");
		me.ctx = me.canvas.getContext("2d");

		if (initialProperties){
			if (initialProperties.width){
				me.canvas.width = initialProperties.width;
				me.canvas.height = initialProperties.height || initialProperties.width;
			}

			if (initialProperties.img){
				var x=initialProperties.x||0;
				var y=initialProperties.y||0;
				var w=me.canvas.width;
				var h=me.canvas.height;
				me.ctx.drawImage(initialProperties.img,x,y,w,h,0,0,w,h);
			}
		}
	}


	return me;
};