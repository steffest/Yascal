Yascal.renderer = Yascal.renderer || {};
Yascal.renderer.webgl = function(context,screen){
	var me = {};


	me.setSize = function(width,height){
		console.log("webgl setSize");
		context.resize(width,height);
	};

	me.clear = function(){
		var gl = context.gl;
		// TODO: set to background color
		//gl.clearColor(0, 0.5, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		if (screen.backGroundImage){
			//ctx.drawImage(screen.backGroundImage,0,0,screen.width,screen.height);
		}
	};


	return me;
};