// adapted from https://github.com/AndrewRayCode/easing-utils
Yascal.easing = function() {
	var me = {};
	me.linear = function(n) {
		return n;
	};
	me.easeInSine = function(n) {
		return -1 * Math.cos(n * (Math.PI / 2)) + 1
	};

	me.easeOutSine = function(n) {
		return Math.sin(n * (Math.PI / 2))
	};

	me.easeInOutSine = function(n) {
		return -.5 * (Math.cos(Math.PI * n) - 1)
	};

	me.easeInQuad = function(n) {
		return n * n
	};

	me.easeOutQuad = function(n) {
		return n * (2 - n)
	};

	me.easeInOutQuad = function(n) {
		return .5 > n ? 2 * n * n : -1 + (4 - 2 * n) * n
	};

	me.easeInCubic = function(n) {
		return n * n * n
	};

	me.easeOutCubic = function(n) {
		var t = n - 1;
		return t * t * t + 1
	};

	function easeInOutCubic(n) {
		return .5 > n ? 4 * n * n * n : (n - 1) * (2 * n - 2) * (2 * n - 2) + 1
	}

	function easeInQuart(n) {
		return n * n * n * n
	}

	function easeOutQuart(n) {
		var t = n - 1;
		return 1 - t * t * t * t
	}

	function easeInOutQuart(n) {
		var t = n - 1;
		return .5 > n ? 8 * n * n * n * n : 1 - 8 * t * t * t * t
	}

	function easeInQuint(n) {
		return n * n * n * n * n
	}

	me.easeOutQuint = function(n) {
		var t = n - 1;
		return 1 + t * t * t * t * t
	};

	function easeInOutQuint(n) {
		var t = n - 1;
		return .5 > n ? 16 * n * n * n * n * n : 1 + 16 * t * t * t * t * t
	}

	function easeInExpo(n) {
		return 0 === n ? 0 : Math.pow(2, 10 * (n - 1))
	}

	function easeOutExpo(n) {
		return 1 === n ? 1 : -Math.pow(2, -10 * n) + 1
	}

	function easeInOutExpo(n) {
		if (0 === n || 1 === n) return n;
		var t = 2 * n,
			e = t - 1;
		return 1 > t ? .5 * Math.pow(2, 10 * e) : .5 * (-Math.pow(2, -10 * e) + 2)
	}

	function easeInCirc(n) {
		var t = n / 1;
		return -1 * (Math.sqrt(1 - t * n) - 1)
	}

	me.easeOutCirc = function(n) {
		var t = n - 1;
		return Math.sqrt(1 - t * t)
	};

	function easeInOutCirc(n) {
		var t = 2 * n,
			e = t - 2;
		return 1 > t ? -.5 * (Math.sqrt(1 - t * t) - 1) : .5 * (Math.sqrt(1 - e * e) + 1)
	}

	function easeInBack(n) {
		var t = arguments.length <= 1 || void 0 === arguments[1] ? 1.70158 : arguments[1],
			e = n / 1;
		return e * e * ((t + 1) * e - t)
	}

	function easeOutBack(n) {
		var t = arguments.length <= 1 || void 0 === arguments[1] ? 1.70158 : arguments[1],
			e = n / 1 - 1;
		return e * e * ((t + 1) * e + t) + 1
	}

	function easeInOutBack(n) {
		var t = arguments.length <= 1 || void 0 === arguments[1] ? 1.70158 : arguments[1],
			e = 2 * n,
			r = e - 2,
			u = 1.525 * t;
		return 1 > e ? .5 * e * e * ((u + 1) * e - u) : .5 * (r * r * ((u + 1) * r + u) + 2)
	}

	function easeInElastic(n) {
		var t = arguments.length <= 1 || void 0 === arguments[1] ? .7 : arguments[1];
		if (0 === n || 1 === n) return n;
		var e = n / 1,
			r = e - 1,
			u = 1 - t,
			a = u / (2 * Math.PI) * Math.asin(1);
		return -(Math.pow(2, 10 * r) * Math.sin((r - a) * (2 * Math.PI) / u))
	}

	me.easeOutElastic = function(n) {
		var t = arguments.length <= 1 || void 0 === arguments[1] ? .7 : arguments[1],
			e = 1 - t,
			r = 2 * n;
		if (0 === n || 1 === n) return n;
		var u = e / (2 * Math.PI) * Math.asin(1);
		return Math.pow(2, -10 * r) * Math.sin((r - u) * (2 * Math.PI) / e) + 1
	};

	function easeInOutElastic(n) {
		var t = arguments.length <= 1 || void 0 === arguments[1] ? .65 : arguments[1],
			e = 1 - t;
		if (0 === n || 1 === n) return n;
		var r = 2 * n,
			u = r - 1,
			a = e / (2 * Math.PI) * Math.asin(1);
		return 1 > r ? -.5 * (Math.pow(2, 10 * u) * Math.sin((u - a) * (2 * Math.PI) / e)) : Math.pow(2, -10 * u) * Math.sin((u - a) * (2 * Math.PI) / e) * .5 + 1
	}

	me.easeOutBounce = function(n) {
		var t = n / 1;
		if (1 / 2.75 > t) return 7.5625 * t * t;
		if (2 / 2.75 > t) {
			var e = t - 1.5 / 2.75;
			return 7.5625 * e * e + .75
		}
		if (2.5 / 2.75 > t) {
			var r = t - 2.25 / 2.75;
			return 7.5625 * r * r + .9375
		}
		var u = t - 2.625 / 2.75;
		return 7.5625 * u * u + .984375
	};

	function easeInBounce(n) {
		return 1 - easeOutBounce(1 - n)
	}

	me.easeInOutBounce = function(n) {
		return .5 > n ? .5 * _(2 * n) : .5 * easeOutBounce(2 * n - 1) + .5
	};

	return me;
}();


