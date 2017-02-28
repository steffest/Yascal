/*
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
};