Yascal.listbox = function(initialProperties){

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
};