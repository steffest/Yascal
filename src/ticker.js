Yascal.ticker = function(){
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
};