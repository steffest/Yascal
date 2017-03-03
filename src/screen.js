Yascal.screen = (function(){
	var me = {};
	me.name = "mainScreen";
	me.visible = true;
	me.children = [];

	var activeElements = [];
	var activeElementMap = {};

	var canvas,ctx;
	var needsRendering = true;
	var modalElement;
	var scaleFactorWidth = 1;
	var scaleFactorHeight = 1;

	me.backGroundColor = "black";
	me.backGroundImage;
	var lastUpdateTime = 0;

	var renderer;

	me.init = function(initialProperties){
		initialProperties = Y.properties(initialProperties);
		canvas = initialProperties.canvas || document.createElement("canvas");
		Y.canvas = me.canvas = canvas;

		console.error(initialProperties);
		if (initialProperties.useWebGL){
			if (typeof YascalGl == "object"){
				Y.useWebGL = true;
			}else{
				console.error("can't use WebGL, the Yascal GL library is not loaded");
			}
		}

		if (Y.useWebGL){
			console.log("switching to Web GL");
			ctx = YGL.context(20,20,canvas);
			renderer = Yascal.renderer.webgl(ctx,me);
		}else{
			ctx = canvas.getContext("2d");
			renderer = Yascal.renderer.canvas2d(canvas,me);
		}
		Y.ctx = me.ctx = ctx;

		me.render();
	};

	me.setSize = function(width,height){
		renderer.setSize(width,height);

		// update canvas style width

		var scale = Math.min(window.innerHeight/height, window.innerWidth/width);


		canvas.style.position = "absolute";
		canvas.style.width = (width * scale) + "px";
		canvas.style.height = (height * scale) + "px";


	};

	me.setScaleFactor = function(refreshOnResize){
		console.log("updating canvas scale factor");
		scaleFactorWidth = canvas.offsetWidth/canvas.width;
		scaleFactorHeight = canvas.offsetHeight/canvas.height;

		if (refreshOnResize){
			window.addEventListener('resize', function(){
				me.setScaleFactor();
			}, true);
		}

	};

	me.getScaleFactor = function(){
		return {width: scaleFactorWidth, height: scaleFactorHeight}
	};

	me.windowToCanvas = function(x,y){
		return {x: x/scaleFactorWidth, y: y/scaleFactorHeight};
	};
	me.canvasToWindow = function(x,y){
		return {x: x * scaleFactorWidth, y: y * scaleFactorHeight};
	};
	me.scaledX = function(x){
		return Math.round(x/scaleFactorWidth);
	};
	me.scaledY = function(y){
		return Math.round(y/scaleFactorHeight);
	};

	me.setProperties = function(p){
		p = Y.properties(p);
		me.backGroundColor = p.get("backGroundColor",me.backGroundColor);
		me.backGroundImage = p.get("backGroundImage",me.backGroundImage);
	};

	me.clear = function(){
		renderer.clear();
	};

	me.clearBackGroundImage = function(){
		me.backGroundImage = undefined;
	};

	me.refresh = function(){
		needsRendering = true;
	};

	me.addChild = function(elm){
		elm.setParent(me);
		elm.zIndex = elm.zIndex || me.children.length;
		me.children.push(elm);
		needsRendering = true;
	};

	me.render = function(time){

		window.requestAnimationFrame(me.render);

		if (Main.stats) Main.stats.begin();

		var deltaTime = time - lastUpdateTime;
		lastUpdateTime = time;
		if (deltaTime<10) return;
		if (deltaTime >1000) deltaTime=16;  // consider only 1 frame elapsed if unfocused.
		if (!deltaTime) deltaTime=16;

		EventBus.trigger(EVENT.screenUpdate,deltaTime);

		activeElements.forEach(function(action,index){
			if (action.canceled){
				delete activeElementMap[action.id];
				activeElements.splice(index,1);
			}else{
				var delta = time - action.start;
				var progress = Math.min(delta/action.duration,1);

				var easing = action.easing ||Yascal.easing.easeOutQuad;
				var easedProgress = easing(progress);
				action.updatefunction(action.initialState,easedProgress);
				needsRendering = true;

				if (progress == 1){
					activeElements.splice(index,1);
				}
			}
		});

		if (needsRendering){
			me.clear();

			me.children.forEach(function(element){
				//if (element.needsRendering) {
					element.render();
				//}
			});


			if (modalElement){
				modalElement.render();
				needsRendering = false;
			}

			needsRendering = false;
		}

		if (Main.stats) Main.stats.end();

	};

	me.registerAnimation = function(initialState,duration,updatefunction,easing){
		if (duration){
			var action = {
				id: generateUUID(),
				start: performance.now(),
				duration: duration * 1000,
				easing: easing,
				initialState: initialState,
				updatefunction: updatefunction
			};
			activeElements.push(action);
			activeElementMap[action.id] = action;

			return action.id;
		}
		return false;
	};

	me.cancelAnimation = function(id){
		var action = activeElementMap[id];
		if (action) action.canceled = true;
	};



	return me;
})();