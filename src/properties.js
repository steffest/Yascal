Yascal.properties = function(initialProperties){

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
};