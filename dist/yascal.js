var DIRECTION = {
	left: 37,
	up: 38,
	right: 39,
	down: 40,
	leftup:3738,
	rightup:3938,
	leftdown: 3740,
	rightdown: 3940,
	none: 0,
	horizontal: 1,
	vertical: 2
};

var KEY={
	left: 37,
	up: 38,
	right: 39,
	down: 40,
	space:32,
	ctrl:17,
	enter: 13,
	action:1000
};

var EVENT={
	keyDown : 1,
	keyUp : 2,
	select : 3,
	screenUpdate:4,
	tick:5,
	step:6
};

;var EventBus = (function() {

	var allEventHandlers = {};

	var me = {};

	me.onEvent = function (event,listener) {
		var eventHandlers = allEventHandlers[event];
		if (!eventHandlers) {
			eventHandlers = [];
			allEventHandlers[event] = eventHandlers;
		}
		eventHandlers.push(listener);
	};

	me.sendEvent = function(event,context) {
		var eventHandlers = allEventHandlers[event];
		if (eventHandlers) {
			var i, len = eventHandlers.length;
			for (i = 0; i < len; i++) {
				eventHandlers[i](context,event);
			}
		}
	};

	// alias
	me.trigger = function(event,context){
		me.sendEvent(event,context)
	};
	me.on = function(event,listener){
		me.onEvent(event,listener);
	};

	return me;
}());
;/*
main Yascal entry point
 */
var Yascal = (function(){
	var me = {};

	me.init = function(properties){
		me.screen.init(properties);
		me.touchInput.init(me.canvas);
	};

	me.sprites = {};
	me.getImage = function(name){
		return me.sprites[name] ? me.sprites[name].canvas : undefined;
	};

	me.loadImage = function(url,next){
		var img = new Image();
		img.onload = function(){
			if (next) next(img);
		};
		img.onerror = function(){
			console.error('XHR error while loading ' + url);
		};
		img.src = url;
	};

	me.getModalElement = function(){

	};

	me.getEventElement = function(x,y){
		var target = undefined;
		for (var i = 0, len = me.screen.children.length; i<len; i++){
			var elm = me.screen.children[i];
			if (elm.isVisible() && elm.containsPoint(x,y)){
				target = elm;
				break;
			}
		}

		if (target && target.children && target.children.length){
			target = target.getElementAtPoint(x,y);
		}
		return target;
	};

	return me;
})();

var Y = Yascal;;Yascal.properties = function(initialProperties){

	if (initialProperties && initialProperties.isYascal) return initialProperties;

	var me = initialProperties || {};
	me.isYascal = true;

	me.get = function(propertyName,defaultValue){
		return typeof me[propertyName] == "undefined" ? defaultValue : me[propertyName];
	};

	me.set = function(propertyName,value){
		me[propertyName] = value;
	};

	me.has = function(propertyName){
		return typeof me[propertyName] != "undefined";
	};

	return me;
};;Yascal.util = (function(i){
	var me = {};



	return me;
})();


function getUrlParameter(param){
	if (window.location.getParameter){
		return window.location.getParameter(param);
	} else if (location.search) {
		var parts = location.search.substring(1).split('&');
		for (var i = 0; i < parts.length; i++) {
			var nv = parts[i].split('=');
			if (!nv[0]) continue;
			if (nv[0] == param) {
				return nv[1] || true;
			}
		}
	}
}

function generateUUID(){
	var d = new Date().getTime();
	if(window.performance && typeof window.performance.now === "function"){
		d += performance.now();
	}
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (d + Math.random()*16)%16 | 0;
		d = Math.floor(d/16);
		return (c=='x' ? r : (r&0x3|0x8)).toString(16);
	});
	return uuid;
}

function clamp(num, min, max) {
	return num <= min ? min : num >= max ? max : num;
};Yascal.screen = (function(){
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
})();;Yascal.screen = (function(){
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
})();;Yascal.sprite = function(initialProperties){
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
};;Y.spriteSheet = function(){
    var me = {};
    me.sprites = [];

    me.loadFromImage = function(img,map,next){

        var baseImg;

        var done = function(){
            if (next) next();
        };

        if (!map){done();return}

        var generate = function(img){
            if (map.tileWidth && map.tileHeight){
                var w = map.tileWidth;
                var h = map.tileHeight;
                var colCount =  Math.floor(img.width/w);
                var rowCount =  Math.floor(img.height/h);
                var maxSprites = colCount * rowCount;
                for (var i=0;i<maxSprites;i++){
                    var properties = {
                        width: w,
                        height: h,
                        img: img,
                        x: (i % colCount)*w,
                        y: Math.floor(i / colCount)*h
                    };
                    me.sprites.push(Y.sprite(properties));
                }
                done();
            }
        };

        if (Y.useWebGL){
            var texture = YGL.texture(Y.ctx, img, function(){
                console.log("texture loaded");
                generate(texture);
            });
            window.texture = texture;
        }else{
            if (typeof img == "string"){
                console.log("loading spritesheet from " + img);
                Y.loadImage(img,function(data){
                    baseImg = data;
                    generate(baseImg);
                })
            }else{
                generate(img);
            }
        }
    };

    return me;
};;// adapted from https://github.com/AndrewRayCode/easing-utils
Yascal.easing = function() {
	var me = {};
	me.linear = function(n) {
		return n;
	};
	me.easeInSine = function(n) {
		return -1 * Math.cos(n * (Math.PI / 2)) + 1
	};

	me.easeOutSine = function(n) {
		return Math.sin(n * (Math.PI / 2))
	};

	me.easeInOutSine = function(n) {
		return -.5 * (Math.cos(Math.PI * n) - 1)
	};

	me.easeInQuad = function(n) {
		return n * n
	};

	me.easeOutQuad = function(n) {
		return n * (2 - n)
	};

	me.easeInOutQuad = function(n) {
		return .5 > n ? 2 * n * n : -1 + (4 - 2 * n) * n
	};

	me.easeInCubic = function(n) {
		return n * n * n
	};

	me.easeOutCubic = function(n) {
		var t = n - 1;
		return t * t * t + 1
	};

	function easeInOutCubic(n) {
		return .5 > n ? 4 * n * n * n : (n - 1) * (2 * n - 2) * (2 * n - 2) + 1
	}

	function easeInQuart(n) {
		return n * n * n * n
	}

	function easeOutQuart(n) {
		var t = n - 1;
		return 1 - t * t * t * t
	}

	function easeInOutQuart(n) {
		var t = n - 1;
		return .5 > n ? 8 * n * n * n * n : 1 - 8 * t * t * t * t
	}

	function easeInQuint(n) {
		return n * n * n * n * n
	}

	me.easeOutQuint = function(n) {
		var t = n - 1;
		return 1 + t * t * t * t * t
	};

	function easeInOutQuint(n) {
		var t = n - 1;
		return .5 > n ? 16 * n * n * n * n * n : 1 + 16 * t * t * t * t * t
	}

	function easeInExpo(n) {
		return 0 === n ? 0 : Math.pow(2, 10 * (n - 1))
	}

	function easeOutExpo(n) {
		return 1 === n ? 1 : -Math.pow(2, -10 * n) + 1
	}

	function easeInOutExpo(n) {
		if (0 === n || 1 === n) return n;
		var t = 2 * n,
			e = t - 1;
		return 1 > t ? .5 * Math.pow(2, 10 * e) : .5 * (-Math.pow(2, -10 * e) + 2)
	}

	function easeInCirc(n) {
		var t = n / 1;
		return -1 * (Math.sqrt(1 - t * n) - 1)
	}

	me.easeOutCirc = function(n) {
		var t = n - 1;
		return Math.sqrt(1 - t * t)
	};

	function easeInOutCirc(n) {
		var t = 2 * n,
			e = t - 2;
		return 1 > t ? -.5 * (Math.sqrt(1 - t * t) - 1) : .5 * (Math.sqrt(1 - e * e) + 1)
	}

	function easeInBack(n) {
		var t = arguments.length <= 1 || void 0 === arguments[1] ? 1.70158 : arguments[1],
			e = n / 1;
		return e * e * ((t + 1) * e - t)
	}

	function easeOutBack(n) {
		var t = arguments.length <= 1 || void 0 === arguments[1] ? 1.70158 : arguments[1],
			e = n / 1 - 1;
		return e * e * ((t + 1) * e + t) + 1
	}

	function easeInOutBack(n) {
		var t = arguments.length <= 1 || void 0 === arguments[1] ? 1.70158 : arguments[1],
			e = 2 * n,
			r = e - 2,
			u = 1.525 * t;
		return 1 > e ? .5 * e * e * ((u + 1) * e - u) : .5 * (r * r * ((u + 1) * r + u) + 2)
	}

	function easeInElastic(n) {
		var t = arguments.length <= 1 || void 0 === arguments[1] ? .7 : arguments[1];
		if (0 === n || 1 === n) return n;
		var e = n / 1,
			r = e - 1,
			u = 1 - t,
			a = u / (2 * Math.PI) * Math.asin(1);
		return -(Math.pow(2, 10 * r) * Math.sin((r - a) * (2 * Math.PI) / u))
	}

	me.easeOutElastic = function(n) {
		var t = arguments.length <= 1 || void 0 === arguments[1] ? .7 : arguments[1],
			e = 1 - t,
			r = 2 * n;
		if (0 === n || 1 === n) return n;
		var u = e / (2 * Math.PI) * Math.asin(1);
		return Math.pow(2, -10 * r) * Math.sin((r - u) * (2 * Math.PI) / e) + 1
	};

	function easeInOutElastic(n) {
		var t = arguments.length <= 1 || void 0 === arguments[1] ? .65 : arguments[1],
			e = 1 - t;
		if (0 === n || 1 === n) return n;
		var r = 2 * n,
			u = r - 1,
			a = e / (2 * Math.PI) * Math.asin(1);
		return 1 > r ? -.5 * (Math.pow(2, 10 * u) * Math.sin((u - a) * (2 * Math.PI) / e)) : Math.pow(2, -10 * u) * Math.sin((u - a) * (2 * Math.PI) / e) * .5 + 1
	}

	me.easeOutBounce = function(n) {
		var t = n / 1;
		if (1 / 2.75 > t) return 7.5625 * t * t;
		if (2 / 2.75 > t) {
			var e = t - 1.5 / 2.75;
			return 7.5625 * e * e + .75
		}
		if (2.5 / 2.75 > t) {
			var r = t - 2.25 / 2.75;
			return 7.5625 * r * r + .9375
		}
		var u = t - 2.625 / 2.75;
		return 7.5625 * u * u + .984375
	};

	function easeInBounce(n) {
		return 1 - easeOutBounce(1 - n)
	}

	me.easeInOutBounce = function(n) {
		return .5 > n ? .5 * _(2 * n) : .5 * easeOutBounce(2 * n - 1) + .5
	};

	return me;
}();


;Yascal.keyInput = (function() {

	var me = {};
	var keyState = {};

	document.addEventListener("keydown",handleKeyDown, false);
	document.addEventListener("keyup",handleKeyUp, false);

	function handleKeyDown(event){

		var keyCode = event.keyCode;
		keyState[keyCode] = state(keyCode);
		keyState[keyCode].isDown = true;

		if (keyCode == KEY.space || keyCode == KEY.ctrl || keyCode == KEY.enter){
			keyState[KEY.action] = state(KEY.action);
			keyState[KEY.action].isDown = true;
		}

		if (typeof EventBus != "undefined") EventBus.trigger(EVENT.keyDown,keyCode);
	}

	function handleKeyUp(event){
		var keyCode = event.keyCode;
		keyState[keyCode] = state(keyCode);
		keyState[keyCode].isDown = false;

		if (keyCode == KEY.space || keyCode == KEY.ctrl || keyCode == KEY.enter){
			keyState[KEY.action] = state(KEY.action);
			keyState[KEY.action].isDown = false;
		}

		if (typeof EventBus != "undefined") EventBus.trigger(EVENT.keyUp,keyCode);
	}

	function virtualKeyPress(key){
		keyState[KEY.action] = state(key);
		keyState[KEY.action].isDown = true;
		setTimeout(function(){
			keyState[KEY.action].isDown = false;
		},100);
	}

	me.isDown = function(value){
		return me.isKeyDown(KEY.down,value);
	};

	me.isUp = function(value){
		return me.isKeyDown(KEY.up,value);
	};

	me.isLeft = function(value){
		return me.isKeyDown(KEY.left,value);
	};

	me.isRight = function(value){
		return me.isKeyDown(KEY.right,value);
	};

	me.isAction = function(value){
		return me.isKeyDown(KEY.action,value);
	};

	me.isEnter = function(value){
		return me.isKeyDown(KEY.enter,value);
	};

	me.isKeyDown = function(keyCode,value){
		keyState[keyCode] = state(keyCode);
		if (typeof value !== "undefined") keyState[keyCode].isDown = value;
		return keyState[keyCode].isDown;
	};

	function state(keyCode){
		return keyState[keyCode] || {};
	}

	return me;

}());
;Yascal.touchInput = (function() {

	var me = {};
	var touchData = {};
	touchData.touches = [];
	touchData.mouseWheels = [];
	var isTouched = false;

	var canvas;

	me.init = function(_canvas){

		canvas = _canvas;
		canvas.addEventListener("mousedown",handleTouchDown,false);
		canvas.addEventListener("mousemove",handleTouchMove,false);
		canvas.addEventListener("mouseup",handleTouchUp,false);

		canvas.addEventListener("touchstart", handleTouchDown,false);
		canvas.addEventListener("touchmove", handleTouchMove,false);
		canvas.addEventListener("touchend", handleTouchUp,false);

		if (window.navigator.msPointerEnabled){
			canvas.addEventListener("MSPointerDown", handleTouchDown,false);
			canvas.addEventListener("MSPointerMove", handleTouchMove,false);
			canvas.addEventListener("MSPointerEnd", handleTouchUp,false);
		}

		canvas.addEventListener("mousewheel", handleMouseWheel,false);
		canvas.addEventListener("DOMMouseScroll", handleMouseWheel,false);

		canvas.addEventListener("dragenter", handleDragenter, false);
		canvas.addEventListener("dragover", handleDragover, false);
		canvas.addEventListener("drop", handleDrop, false);
	};


	function handleTouchDown(event){
		event.preventDefault();

		if (!isTouched){
			// first touch - init media on IOS
			//Audio.playSilence();
			isTouched = true;
		}

		if (event.touches && event.touches.length>0){
			var touches = event.changedTouches;
			for (var i=0; i < touches.length; i++) {
				var touch = touches[i];
				initTouch(touch.identifier,touch.pageX,touch.pageY);
			}
		}else{
			var touchIndex = getTouchIndex("notouch");
			if (touchIndex>=0) touchData.touches.splice(touchIndex, 1);
			initTouch("notouch",event.pageX,event.pageY);
		}

		function initTouch(id,x,y){
			touchData.isTouchDown = true;

			var rect = canvas.getBoundingClientRect();
			x = Y.screen.scaledX(x - rect.left);
			y = Y.screen.scaledY(y - rect.top);

			console.error(x);

			currentEventTarget = Y.getModalElement() ||  Y.getEventElement(x,y);
			console.error("final target:",currentEventTarget);

			var thisTouch = {
				id: id,
				x: x,
				y: y,
				startX: x,
				startY: y,
				UIobject: currentEventTarget
			};

			touchData.touches.push(thisTouch);

			if (thisTouch.UIobject){
				if (thisTouch.UIobject.onDragStart) thisTouch.UIobject.onDragStart(thisTouch);
				if (thisTouch.UIobject.onTouchDown) thisTouch.UIobject.onTouchDown(thisTouch);
			}
		}
	}

	function handleTouchMove(event){
		event.preventDefault();
		var rect = canvas.getBoundingClientRect();
		var point,_x,_y;

		if (event.touches && event.touches.length>0){
			var touches = event.changedTouches;

			for (var i=0; i < touches.length; i++) {
				var touch = touches[i];
				_x = Y.screen.scaledX(touch.pageX-rect.left);
				_y = Y.screen.scaledY(touch.pageY-rect.top);

				updateTouch(getTouchIndex(touch.identifier),_x,_y);
			}
		}else{
			_x = Y.screen.scaledX(event.pageX-rect.left);
			_y = Y.screen.scaledY(event.pageY-rect.top);

			updateTouch(getTouchIndex("notouch"),_x,_y);
			touchData.currentMouseX = _x;
			touchData.currentMouseY = _y;
			touchData.mouseMoved = new Date().getTime();

			/*
			if (SETTINGS.useHover){
				var hoverEventTarget = UI.getEventElement(_x,_y);
				if (hoverEventTarget && hoverEventTarget.onHover) hoverEventTarget.onHover(touchData);

				if (prevHoverTarget && prevHoverTarget != hoverEventTarget){
					if (prevHoverTarget.onHoverExit) prevHoverTarget.onHoverExit(touchData,hoverEventTarget);
				}
				prevHoverTarget = hoverEventTarget;
			}
			*/
		}

		function updateTouch(touchIndex,x,y){
			if (touchIndex>=0){
				var thisTouch =touchData.touches[touchIndex];

				thisTouch.x = x;
				thisTouch.y = y;

				touchData.touches.splice(touchIndex, 1, thisTouch);

				if (touchData.isTouchDown && thisTouch.UIobject){
					if (thisTouch.UIobject.onDrag){
						thisTouch.dragX = x;
						thisTouch.dragY = y;
						thisTouch.isDragging = true;
						thisTouch.UIobject.onDrag(thisTouch);
					}
				}
			}
		}
	}

	function handleTouchUp(event){

		touchData.isTouchDown = false;

		if (event && event.touches){
			var touches = event.changedTouches;

			for (var i=0; i < touches.length; i++) {
				var touch = touches[i];
				endTouch(getTouchIndex(touch.identifier));
			}

			if (event.touches.length == 0){
				resetInput();
			}
		}else{
			endTouch(getTouchIndex("notouch"));
			resetInput();
		}

		function endTouch(touchIndex){
			if (touchIndex>=0){
				var thisTouch =touchData.touches[touchIndex];
				if (thisTouch.UIobject){
					var elm = thisTouch.UIobject;

					if (elm.onClick) {
						var deltaX = thisTouch.startX-thisTouch.x;
						var deltaY = thisTouch.startY-thisTouch.y;

						var distance = Math.sqrt( deltaX*deltaX + deltaY*deltaY );

						if (distance<8) elm.onClick(thisTouch);
					}
					if (elm.onDragEnd) elm.onDragEnd(thisTouch);
					if (elm.onTouchUp) elm.onTouchUp(thisTouch);
				}
				touchData.touches.splice(touchIndex, 1);
			}
		}

		function resetInput(){
			//Input.isDown(false);
			//Input.isUp(false);
			//Input.isLeft(false);
			//Input.isRight(false);
		}

	}

	function handleMouseWheel(event){
		if (touchData.currentMouseX){

			var x = touchData.currentMouseX;
			var y = touchData.currentMouseY;

			var target = Y.getEventElement(x,y);

			if (target && target.onMouseWheel){

				var deltaY = event.wheelDeltaY || event.wheelDelta || -event.detail;
				var deltaX = event.wheelDeltaX || 0;

				touchData.mouseWheels.unshift(deltaY);
				if (touchData.mouseWheels.length > 10) touchData.mouseWheels.pop();

				target.onMouseWheel(touchData);

			}
		}
	}


	function handleDragenter(e) {
		e.stopPropagation();
		e.preventDefault();
	}

	function handleDragover(e) {
		e.stopPropagation();
		e.preventDefault();
	}

	function handleDrop(e) {
		e.stopPropagation();
		e.preventDefault();

		var dt = e.dataTransfer;
		var files = dt.files;

		Tracker.handleUpload(files);
	}

	var getTouchIndex = function (id) {
		for (var i=0; i < touchData.touches.length; i++) {
			if (touchData.touches[i].id === id) {
				return i;
			}
		}
		return -1;
	};

	return me;

}());
;Yascal.ticker = function(){
	var me = {};
	var stepsPerSecond = 8;
	var stats;
	var fpsList = [];

	var stepTime = 1000/stepsPerSecond;
	var tickTime = 0;
	var applicationTime = 0;
	var steps = 0;

	me.start = function(){
		tickTime = 0;
		EventBus.on(EVENT.screenUpdate,function(deltaTime){
			if (stats){
				var fps = 1000/deltaTime;
				var len = fpsList.unshift(fps);
				if (len>10){
					fpsList.pop();
				}
			}
			tickTime += deltaTime;
			applicationTime += deltaTime;

			EventBus.trigger(EVENT.tick,deltaTime);

			if (tickTime>stepTime){
				steps++;
				tickTime = 0;
				EventBus.trigger(EVENT.step);
			}
		})
	};

	me.stats = function(enable){
		if (enable){
			stats = true;
		}
		var average = 0;
		var len = fpsList.length;
		for (var i = 0; i<len; i++){average += fpsList[i]}
		average = Math.round(average/len);
		return average;
	};

	return me;
};;/*
 base Yascal element - all other component inherit from this
 */
Yascal.element = function(initialProperties){
    var me = {};
    initialProperties = initialProperties || {};

    me.left = initialProperties.left || 0;
    me.top = initialProperties.top || 0;
    me.width = initialProperties.width || 20;
    me.height = initialProperties.height || 20;
    me.scale = 1;

    me.visible = true;
    me.needsRendering = true;
    me.parentCtx = Y.ctx;

    me.canvas = document.createElement("canvas");
    me.canvas.width = me.width;
    me.canvas.height = me.height;
    me.ctx = me.canvas.getContext("2d");

    me.children = [];

    me.id = generateUUID();

    var currentMoveAction;
    var currentClipAction;
    var currentScaleAction;

    me.hide = function(andRefresh){
        me.visible = false;
        if (andRefresh) me.refresh();
    };
    me.show = function(andRefresh,andRefreshAllChildren){
        me.visible = true;
        if (andRefresh) me.refresh(andRefreshAllChildren);
    };
    me.toggle = function(){
        if (me.visible){
            me.hide();
        }else{
            me.show();
        }
    };

    me.isVisible = function(){
        var result = me.visible;
        var parent = me.parent;
        while (result && parent) {
            result = parent.visible;
            parent = parent.parent;
        }
        return result;
    };

    me.containsPoint = function(x,y){
        var left = this.left;
        var right = this.left+this.width;
        var top = this.top;
        var bottom = this.top+this.height;

        return ((x >= left) && (x <= right) && (y >= top) && (y <= bottom));
    };

    me.getElementAtPoint = function(x,y){
        x -= me.left;
        y -= me.top;
        var currentEventTarget;
        for (var i = me.children.length-1; i>=0; i--){
            var elm = me.children[i];
            if (elm.isVisible() && !elm.ignoreEvents && elm.containsPoint(x,y)){
                currentEventTarget = elm;
                break;
            }
        }

        if (currentEventTarget){
            var child = currentEventTarget.getElementAtPoint(x,y);
            if (child){
                currentEventTarget = child;
            }else{
                currentEventTarget.eventX = x;
                currentEventTarget.eventY = y;
            }
        }else{
            currentEventTarget = me;
            currentEventTarget.eventX = x;
            currentEventTarget.eventY = y;
        }



        return currentEventTarget;
    };

    me.setParent = function(parentElement){
        me.parent = parentElement;
        if (parentElement){
            me.parentCtx = parentElement.ctx;
        }
    };

    me.addChild = function(elm){
        elm.setParent(me);
        elm.zIndex = elm.zIndex || me.children.length;
        me.children.push(elm);
    };

    me.getChild = function(name){
        var i = me.children.length;
        var child;
        while (i){
            child = me.children[i];
            if (child && child.name && child.name == name) return child;
            i--;
        }
    };

    me.refresh = function(refreshChildren){
        me.needsRendering = true;
        if (refreshChildren){
            console.error("refresh children " + me.name);
            var i = me.children.length;
            var child;
            while (i){
                child = me.children[i];
                if (child) child.refresh();
                i--;
            }
        }
        if (this.visible && me.parent && me.parent.refresh) me.parent.refresh();
    };

    me.setSize = function(_w,_h){
        me.width = _w;
        me.height = _h;
        me.canvas.width = me.width;
        me.canvas.height = me.height;
        me.refresh();
    };
    me.setPosition = function(x,y){
        me.left = x;
        me.top = y;
        me.refresh();
    };
    me.setScale = function(scale){
        me.scale = scale;
        me.refresh();
    };

    me.moveTo = function(x,y,duration,easing){
        if (currentMoveAction){
            Y.screen.cancelAnimation(currentMoveAction);
            currentMoveAction = false;
        }
        if (duration){
            currentMoveAction = Y.screen.registerAnimation({left:me.left,top:me.top},duration,function(initialState,progress){
                var deltaX = (x - initialState.left) * progress;
                var deltaY = (y - initialState.top) * progress;
                me.setPosition(initialState.left + deltaX,initialState.top + deltaY);
                //console.error(progress);
            },easing);
        }else{
            me.setPosition(x,y);
        }
    };

    me.scaleTo = function(scale,duration,easing){
        if (currentScaleAction){
            Y.screen.cancelAnimation(currentScaleAction);
            currentScaleAction = false;
        }
        if (duration){
            currentScaleAction = Y.screen.registerAnimation({scale:me.scale},duration,function(initialState,progress){
                var deltaScale = (scale - initialState.scale) * progress;
                me.setScale(initialState.scale + deltaScale);
            },easing);
        }else{
            me.setScale(scale);
        }
    };

    me.clipTo = function(width,height,duration,easing,next){
        // lets assume for simplicity the clip always starts at the top left corner

        if (currentClipAction){
            Y.screen.cancelAnimation(currentClipAction);
            currentClipAction = false;
        }
        if (duration){
            currentClipAction = Y.screen.registerAnimation({width:me.width,height:me.height},duration,function(initialState,progress){
                var deltaWidth = (width - initialState.width) * progress;
                var deltaHeight = (height - initialState.height) * progress;
                me.setSize(initialState.width + deltaWidth,initialState.height + deltaHeight);
                if (progress == 1 && next) {
                    next()
                }
            },easing);
        }else{
            me.setSize(width,height);
        }
    };

    me.clearCanvas = function(){
        me.ctx.clearRect(0,0,me.width,me.height);
    };


    return me;
};;Yascal.panel = function(initialProperties){
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
};;Yascal.listbox = function(initialProperties){

    initialProperties = Y.properties(initialProperties);

    var me = Y.element(initialProperties);

    me.selectedIndex = 0;
    var previousSelectedIndex = 0;

    var items = [];
    var visibleIndex = 0;
    var visibleIitems = 0;
    var scrollBar;
    var scrollBarItemOffset = 0;
    var scrollSpeed;
    var scrollOffset = 0;
    var scrollActionId;
    var moveIndexActionId;
    var background;
    var maxScrollSpeed = 10;
    var maxScrollOffset;
    var minScrollOffset;
    var acceleration = 0.2;
    var initialSpeed = 2;
    var itemHeight;
    var itemWidth;
    var itemSize;
    var orientation = DIRECTION.vertical;
    var selectionAlpha = 0;
    var selectionWidth;
    var selectionHeight;
    var smoothDrag = false;
    var isUserNavigating = false;

    me.innerLeft = 0;
    me.innerTop = 0;

    var properties = [
        "left",
        "top",
        "width",
        "height",
        "name",
        "type",
        "onChange",
        "selectedIndex",
        "centerSelection",
        "backgroundColor",
        "renderFunction"
    ];

    var useScrollBar = initialProperties.get("useScrollBar",true);

    me.setProperties = function(p){
        p = Y.properties(p);

        properties.forEach(function(key){
            if (p.has(key)) me[key] = p[key];
        });

        itemHeight = p.get("itemHeight",itemHeight);
        itemWidth = p.get("itemWidth",itemWidth);
        orientation = p.get("orientation",orientation);
        initialSpeed = p.get("initialSpeed",initialSpeed);
        acceleration = p.get("acceleration",acceleration);
        maxScrollSpeed = p.get("maxScrollSpeed",maxScrollSpeed);
        selectionWidth = p.get("selectionWidth",selectionWidth);
        selectionHeight = p.get("selectionHeight",selectionHeight);
        smoothDrag = p.get("smoothDrag",smoothDrag);

        me.setSize(me.width,me.height);
        me.setPosition(me.left,me.top);


        if (!itemWidth) itemWidth=me.width;
        if (!itemHeight) itemHeight=me.height;
        if (!selectionWidth) selectionWidth= itemWidth;
        if (!selectionHeight) selectionHeight = itemHeight;

        /*
        background.setSize(me.width,me.height);

        setScrollBarPosition();

        buttonUp.setProperties({
            left: me.width - 18,
            top: 2,
            width: 16,
            height: 16,
            label:"↑"
        });

        buttonDown.setProperties({
            left: me.width - 18,
            top: me.height - 19,
            width: 16,
            height: 16,
            label:"↓"
        });

        */

        if (me.centerSelection){
            if (orientation == DIRECTION.horizontal){
                me.innerLeft = Math.ceil((me.width - itemWidth)/2);
            }else{
                me.innerTop = Math.ceil((me.height - itemHeight)/2);
            }

        }

        itemSize = orientation == DIRECTION.horizontal ? itemWidth : itemHeight;
    };

    me.setSelectedIndex = function(index,internal){
        me.selectedIndex = index;
        if (me.centerSelection) visibleIndex = me.selectedIndex;
        me.refresh();
        if (!internal && me.onChange && previousSelectedIndex!=me.selectedIndex) me.onChange();
        previousSelectedIndex = me.selectedIndex;
    };
    me.getSelectedIndex = function(){
        return me.selectedIndex;
    };
    me.getSelectedItem = function(){
        return items[me.selectedIndex];
    };

    /*
    var background = UI.scale9Panel(0,0,me.width,me.height,{
        img: Y.getImage("panel_dark"),
        left:3,
        top:3,
        right:2,
        bottom: 2
    });
    background.ignoreEvents = true;
    me.addChild(background);


    var buttonUp = UI.Assets.generate("button20_20");
    me.addChild(buttonUp);
    buttonUp.onClick = function(){
        me.navigateUp();
    };

    var buttonDown = UI.Assets.generate("button20_20");
    me.addChild(buttonDown);
    buttonDown.onClick = function(){
        me.navigateDown();
    };

    var scrollBar = UI.scale9Panel(w-28,18,16,h-3,{
        img: Y.getImage("bar"),
        left:2,
        top:2,
        right:3,
        bottom: 3
    });

    scrollBar.onDragStart=function(){
       scrollBar.startDragIndex = visibleIndex;

    };

    scrollBar.onDrag=function(touchData){
        if (items.length>visibleIitems && scrollBarItemOffset){
            var delta =  touchData.dragY - touchData.startY;
            visibleIndex = Math.floor(scrollBar.startDragIndex + delta/scrollBarItemOffset);
            visibleIndex = Math.min(visibleIndex,getMaxIndex());
            visibleIndex = Math.max(visibleIndex,0);
            setScrollBarPosition();

            if (me.centerSelection) {
                me.setSelectedIndex(visibleIndex);
            }
        }
    };

    me.addChild(scrollBar);

    */

    function startSmoothScroll(speed){
        isUserNavigating = true;
        scrollSpeed = speed;

        if (moveIndexActionId) Y.screen.cancelAnimation(moveIndexActionId);
        if (scrollActionId) return;

        maxScrollOffset = visibleIndex * itemSize;
        minScrollOffset = maxScrollOffset - ((items.length-1)*itemSize);

        scrollActionId = Y.screen.registerAnimation(0,Infinity,function(){
            scrollOffset += scrollSpeed;
            scrollOffset = clamp(scrollOffset,minScrollOffset,maxScrollOffset);
            var direction = scrollSpeed>0?1:-1;
            var aSpeed = Math.abs(scrollSpeed);
            if (aSpeed<maxScrollSpeed) aSpeed += acceleration;
            scrollSpeed = direction * aSpeed;
            me.refresh();
        })
    }


    me.navigateUp = function(smooth){
        if (smooth){
            if (scrollSpeed<0){

            }else{
                startSmoothScroll(-initialSpeed);
            }
        }else{
            if (visibleIndex>0){
                visibleIndex--;
                setScrollBarPosition();
            }
            if (me.centerSelection) {
                me.setSelectedIndex(visibleIndex);
            }else{
                me.refresh();
            }
        }

    };

    me.navigateDown = function(smooth){
        if (smooth){
            if (scrollSpeed>0){

            }else{
                startSmoothScroll(initialSpeed);
            }
        }else{
            if (visibleIndex<getMaxIndex()){
                visibleIndex++;
                setScrollBarPosition();
            }

            if (me.centerSelection) {
                me.setSelectedIndex(visibleIndex);
            }else{
                me.refresh();
            }
        }

    };

    me.navigateLeft = me.navigateUp;
    me.navigateRight = me.navigateDown;

    me.stopNavigation = function(smooth){
        if (!isUserNavigating) return;
        isUserNavigating = false;
        if (scrollActionId) Y.screen.cancelAnimation(scrollActionId);
        scrollActionId = false;
        if (scrollOffset){
            // get item closest to start;

            var index = Math.floor((-scrollOffset/itemSize)+visibleIndex);

            if (scrollOffset%itemSize != 0){
                if (scrollSpeed<0){
                    index++;
                }
            }

            index = clamp(index,0,items.length-1);
            me.moveToIndex(index);
        }
        scrollSpeed = 0;
    };


    me.moveToIndex = function(index,next){
        index = clamp(index,0,items.length-1);
        if (scrollActionId) Y.screen.cancelAnimation(scrollActionId);
        if (moveIndexActionId) Y.screen.cancelAnimation(moveIndexActionId);
        scrollSpeed = 0;

        var delta =  0-((index-me.selectedIndex) * itemSize) - scrollOffset;
        moveIndexActionId = Y.screen.registerAnimation(scrollOffset,0.5,function(initialState,progress){
            scrollOffset = initialState + delta*progress;
            if (progress == 1){
                scrollOffset = 0;
                me.setSelectedIndex(index);
                if (next) next();

            }
            me.refresh();
        })
    };

    me.selectItem = function(){
        Y.screen.registerAnimation(1,0.5,function(initialState,progress){
            selectionAlpha = (1-progress) * 0.4;
            me.refresh();
        })
    };

    me.render = function(internal){
        internal = !!internal;

        if (this.needsRendering){

            if (me.backgroundColor){
                me.ctx.fillStyle = me.backgroundColor;
                me.ctx.fillRect(0,0,me.width,me.height);
            }

            if (background) background.render();

            if (me.renderSelectionHighLight){
                me.renderSelectionHighLight(selectionAlpha);
            }else{
                var selectX = me.innerLeft - (selectionWidth-itemWidth)/2;
                var selectY = me.innerTop - (selectionHeight-itemHeight)/2;
                me.ctx.fillStyle = "rgba(255,255,255," + (0.2 + selectionAlpha) + ")";
                me.ctx.fillRect(selectX,selectY,selectionWidth,selectionHeight);
            }

            for (var i = 0, len = items.length;i<len;i++){
                var item = items[i];
                var itemX = 0;
                var itemY = 0;

                if (orientation == DIRECTION.horizontal){
                    itemX = me.innerLeft + ((i-visibleIndex)*itemWidth) + scrollOffset;
                }else{
                    itemY = me.innerTop + ((i-visibleIndex)*itemHeight) + scrollOffset;
                }

                if ((itemY>-itemHeight) && (itemY<me.height) && (itemX>-itemWidth) && (itemX<me.width)){

                    if (me.renderFunction){
                        me.renderFunction(item,itemX,itemY);
                    }else{
                        // default renderer
                        var textX = 10;
                        var indent = 10;

                        if (item.level) textX += item.level*indent;

                        if (item.icon){
                            me.ctx.drawImage(item.icon,textX,itemY-2);
                            textX += item.icon.width + 4;
                        }

                        //if (fontMed) fontMed.write(me.ctx,item.label,textX,textY,0);

                        me.ctx.fillStyle = "white";
                        me.ctx.fillText(item.label,textX,itemY);

                        itemY += 11;


                    }
                }

            }



            if (scrollBar) scrollBar.render();
            //buttonUp.render();
            //buttonDown.render();
        }
        this.needsRendering = false;

        if (internal){
            return me.canvas;
        }else{
            me.parentCtx.drawImage(me.canvas,me.left,me.top,me.width,me.height);
        }

    };

    me.setItems = function(newItems){
        items = newItems;
        visibleIndex = Math.min(visibleIndex,getMaxIndex()+1);
        me.selectedIndex = 0;
        setScrollBarPosition();
        me.refresh();
    };

    me.getItems = function(){
        return items;
    };

    me.getItemAtPosition = function(x,y,returnIndex){
        var index=0;
        if (orientation == DIRECTION.horizontal){
            x = x-me.innerLeft;
            index = Math.floor(x/itemSize) + visibleIndex;
        }else{
            y = y-me.innerTop;
            index = Math.floor(y/itemSize) + visibleIndex;
        }

        if (index>=0 && index<items.length){
            if (returnIndex){
                return index;
            }else{
                return(items[index]);
            }
        }else{
            return undefined;
        }
    };

    me.getItemIndexAtPosition = function(x,y){
        return me.getItemAtPosition(x,y,true);
    };

    function setScrollBarPosition(){
        /*
        var max = items.length;
        visibleIitems = Math.floor(me.height/lineHeight);
        if (me.centerSelection){visibleIitems = 1;}

        var startTop = 18;
        var top = startTop;
        var startHeight = me.height - 4 - 32;
        var height = startHeight;
        scrollBarItemOffset = 0;

        if (max>visibleIitems){
            height = Math.floor((visibleIitems / max) * startHeight);
            if (height<12) height = 12;

            scrollBarItemOffset = (startHeight - height) / (max-visibleIitems);

        }

        if (visibleIndex && scrollBarItemOffset){
            top = Math.floor(startTop + scrollBarItemOffset*visibleIndex);
        }

        scrollBar.setProperties({
            left: me.width - 18,
            top: top,
            width: 16,
            height: height
        });

        */
    }


    me.onMouseWheel = function(touchData){
        if (touchData.mouseWheels[0] > 0){
            me.navigateUp();
        }else{
            me.navigateDown();
        }
    };

    me.onDragStart = function(touchData){
        me.startDragIndex = visibleIndex;
    };

    me.onDrag = function(touchData){
        var delta;
        if (smoothDrag){
            if (orientation == DIRECTION.horizontal){
                delta =  touchData.dragX - touchData.startX;
            }else{
                delta =  touchData.dragY - touchData.startY;
            }
            scrollOffset = delta;
            me.refresh();
        }else{
            if (items.length>visibleIitems){
                delta =  Math.round((touchData.dragY - touchData.startY)/itemHeight);
                visibleIndex = me.startDragIndex - delta;
                visibleIndex = Math.max(visibleIndex,0);
                visibleIndex = Math.min(visibleIndex,getMaxIndex());

                if (me.centerSelection) {
                    me.setSelectedIndex(visibleIndex);
                }

                setScrollBarPosition();
            }
        }

    };

    me.onDragEnd = function(touchData){
        if (Math.abs(scrollOffset)>8){
            // get item closest to start;

            var index = Math.floor((-scrollOffset/itemSize)+visibleIndex);

            if (scrollOffset%itemSize != 0){
                if (scrollOffset<0){
                    index++;
                }
            }

            index = clamp(index,0,items.length-1);
            me.moveToIndex(index);
        }else{
            if (me.onClick) me.onClick(touchData);
        }
    };

    function getMaxIndex(){
        var max = items.length-1;
        if (!me.centerSelection) {
            max = items.length-visibleIitems;
        }
        return max;
    }

    me.setSelectionAlpha = function(alpha){
        selectionAlpha = alpha;
    };

    return me;
};;Yascal.stats = function(source){


    var width = 100;
    var height = 20;

    var me = Yascal.element({width: width, height: height});
    me.type = "stats";
    me.backGroundColor = "blue";

    me.render = function(internal){

        if (!me.isVisible()) return;
        if (Y.useWebGL) return;

            internal = !!internal;

        if (this.needsRendering){
            me.clearCanvas();

            if (me.backgroundColor){
                me.ctx.fillStyle = me.backgroundColor;
                me.ctx.fillRect(0,0,me.width,me.height);
            }

            if (source){
                me.ctx.fillStyle = "white";
                me.ctx.font = "16px Arial";
                me.ctx.fillText(source.stats(),10,16);
            }
        }



        //this.needsRendering = false;
        if (internal){
            return me.canvas;
        }else{
            me.parentCtx.drawImage(me.canvas,me.left,me.top,me.width,me.height);
        }
    };


    return me;
};;Yascal.renderer = Yascal.renderer || {};
Yascal.renderer.canvas2d = function(canvas,screen){
        var me = {};
        var ctx = canvas.getContext("2d");

        me.setSize = function(width,height){
            console.log("canvas2d setSize");
            canvas.width = screen.width = width;
            canvas.height = screen.height = height;
        };

        me.clear = function(){
            ctx.fillStyle = screen.backGroundColor;
            ctx.clearRect(0,0,screen.width,screen.height);
            ctx.fillRect(0,0,screen.width,screen.height);

            if (screen.backGroundImage){
                ctx.drawImage(screen.backGroundImage,0,0,screen.width,screen.height);
            }
        };


        return me;
};;Yascal.renderer = Yascal.renderer || {};
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
};;