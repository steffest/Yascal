//based on https://github.com/mattdesl/kami
YascalGl.context = function(width, height, view, contextAttributes){
    var me = {};

    me.managedObjects = [];
    me.gl = null;
    me.valid = false;

    if (view && typeof window.WebGLRenderingContext !== "undefined" && view instanceof window.WebGLRenderingContext) {
        view = view.canvas;
        me.gl = view;
        me.valid = true;
        contextAttributes = undefined;
    }

    me.view = view || document.createElement("canvas");
    me.width = me.view.width = width || 300;
    me.height = me.view.height = height || 150;
    me.contextAttributes = contextAttributes;

    me.resize = function(width, height) {
        me.width = me.view.width = width;
        me.height = me.view.height = height;
        me.gl.viewport(0, 0, width, height);
    };

    me.view.addEventListener("webglcontextlost", function (ev) {
        ev.preventDefault();
        contextLost(ev);
    }.bind(me));

    me.view.addEventListener("webglcontextrestored", function (ev) {
        ev.preventDefault();
        contextRestored(ev);
    }.bind(me));

    if (!me.valid) initContext();

    me.resize(me.width, me.height);


    function initContext(){
        var err = "";
        me.valid = false;

        try {
            me.gl = (me.view.getContext('webgl', me.contextAttributes) || me.view.getContext('experimental-webgl', me.contextAttributes));
        } catch (e) {
            me.gl = null;
        }

        if (me.gl) {
            me.valid = true;
        } else {
            console.warn("Sorry, WebGL Not Supported, falling back to Canvas");
        }
    }

    me.addManagedObject = function(obj) {
        me.managedObjects.push(obj);
    };

    me.removeManagedObject = function(obj) {
        var idx = me.managedObjects.indexOf(obj);
        if (idx > -1) {
            me.managedObjects.splice(idx, 1);
            return obj;
        }
        return undefined;
    };

    me.destroy = function() {
        for (var i=0; i<me.managedObjects.length; i++) {
            var obj = me.managedObjects[i];
            if (obj && typeof obj.destroy === "function") obj.destroy();
        }
        me.managedObjects.length = 0;
        me.valid = false;
        me.gl = null;
        me.view = null;
        me.width = me.height = 0;
    };

    function contextLost(ev) {
        me.valid = false;

        // Todo: send Event
    }

    function contextRestored(ev) {
        initContext();
        for (var i=0; i<me.managedObjects.length; i++) {
            var obj = me.managedObjects[i];
            if (obj && typeof obj.create === "function") obj.create();
        }
        me.resize(me.width, me.height);

        // Todo: send Event
    }

    return me;
};
