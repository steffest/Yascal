Y.spriteSheet = function(){
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
};