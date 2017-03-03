Yascal.stats = function(source){


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
};