Yascal.touchInput = (function() {

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

			if (SETTINGS.useHover){
				var hoverEventTarget = UI.getEventElement(_x,_y);
				if (hoverEventTarget && hoverEventTarget.onHover) hoverEventTarget.onHover(touchData);

				if (prevHoverTarget && prevHoverTarget != hoverEventTarget){
					if (prevHoverTarget.onHoverExit) prevHoverTarget.onHoverExit(touchData,hoverEventTarget);
				}
				prevHoverTarget = hoverEventTarget;
			}
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
