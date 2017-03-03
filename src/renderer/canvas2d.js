Yascal.renderer = Yascal.renderer || {};
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
};