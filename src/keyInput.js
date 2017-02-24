Yascal.keyInput = (function() {

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
