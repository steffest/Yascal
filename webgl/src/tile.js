var Tile = function(img,x,y,spriteIndex){
	var me = {};
	var tileSize = 32;

	me.width = tileSize;
	me.height = tileSize;
	me.texture = img;

	me.x = x*tileSize;
	me.y = y*tileSize;

	var spriteX = spriteIndex % 8;
	var spriteY = Math.floor(spriteIndex / 8);

	var animStep = 0;
	var animCounter = Math.floor(Math.random() * 20);

	me.region = YGL.textureRegion(img,spriteX*tileSize,spriteY*tileSize,tileSize,tileSize);

	me.update = function(){
		if (spriteIndex == 160 || spriteIndex == 200){
			animCounter++;
			animStep = Math.floor(animCounter / 5);
			if (animStep>3) {
				animStep=0;
				animCounter = 0;
			}
			var spriteX = (spriteIndex+animStep) % 8;
			var spriteY = Math.floor((spriteIndex+animStep) / 8);
			me.region.setRegion(spriteX*tileSize,spriteY*tileSize,tileSize,tileSize);
		}
	};

	return me;
};

