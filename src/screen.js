Yascal.screen = (function(initialProperties){
	var me = {};
	initialProperties = Y.properties(initialProperties);
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

	var backGroundColor = "black";
	var backGroundImage;

	me.init = function(){
		canvas = initialProperties.canvas || document.createElement("canvas");
		ctx = canvas.getContext("2d");
		Y.canvas = me.canvas = canvas;
		Y.ctx = me.ctx = ctx;

		me.render();
	};

	me.setSize = function(width,height){
		canvas.width = me.width = width;
		canvas.height = me.height = height;
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
		backGroundColor = p.get("backGroundColor",backGroundColor);
		backGroundImage = p.get("backGroundImage",backGroundImage);
	};

	me.clear = function(){
		ctx.fillStyle = backGroundColor;
		ctx.clearRect(0,0,me.width,me.height);
		ctx.fillRect(0,0,me.width,me.height);

		if (backGroundImage){
			ctx.drawImage(backGroundImage,0,0,me.width,me.height);
		}
	};

	me.clearBackGroundImage = function(){
		backGroundImage = undefined;
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

	me.render = function(){
		var doRender = true;

		if(doRender){

			var now = performance.now();

			activeElements.forEach(function(action,index){
				if (action.canceled){
					delete activeElementMap[action.id];
					activeElements.splice(index,1);
				}else{
					var delta = now - action.start;
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

		}
		window.requestAnimationFrame(me.render);
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