Yascal.panel = function(initialProperties){
	initialProperties = Y.properties(initialProperties);
	var me = Yascal.element(initialProperties);
	me.type = "panel";
	var properties = ["left","top","width","height","name","type","zIndex","backgroundColor","backgroundImage"];

	me.setProperties = function(p){

		properties.forEach(function(key){
			if (typeof p[key] != "undefined") me[key] = p[key];
		});

		me.setSize(me.width,me.height);
		me.setPosition(me.left,me.top);

		if (me.setLayout) me.setLayout(me.left,me.top,me.width, me.height);
	};

	me.render = function(internal){
		if (!me.isVisible()) return;

		internal = !!internal;

		if (this.needsRendering){
			me.clearCanvas();

			if (me.backgroundColor){
				me.ctx.fillStyle = me.backgroundColor;
				me.ctx.fillRect(0,0,me.width,me.height);
			}
			if (me.backgroundImage){
				me.ctx.drawImage(me.backgroundImage,0,0,me.width,me.height);
			}


			this.children.forEach(function(elm){
				elm.render();
			});


			if (me.renderInternal) me.renderInternal();
		}



		this.needsRendering = false;
		if (internal){
			return me.canvas;
		}else{
			me.parentCtx.drawImage(me.canvas,me.left,me.top,me.width,me.height);
		}
	};

	me.onClick=function(){

	};

	me.sortZIndex = function(){
		// sort reverse order as children are rendered bottom to top;
		this.children.sort(function(a, b){
			return a.zIndex == b.zIndex ? 0 : (a.zIndex > b.zIndex) || -1;
		});
	};

	if (initialProperties) me.setProperties(initialProperties);

	return me;
};