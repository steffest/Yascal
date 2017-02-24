/*
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

var Y = Yascal;