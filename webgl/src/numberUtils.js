// loosely based on https://github.com/mattdesl/kami

var int8 = new Int8Array(4);
var int32 = new Int32Array(int8.buffer, 0, 1);
var float32 = new Float32Array(int8.buffer, 0, 1);

YascalGl.numberUtil = function() {
    var me = {};

    me.intBitsToFloat = function(i) {
        int32[0] = i;
        return float32[0];
    };

    me.floatToIntBits = function(f) {
        float32[0] = f;
        return int32[0];
    };

    me.intToFloatColor = function(value) {
        return me.intBitsToFloat( value & 0xfeffffff );
    };

    me.colorToFloat = function(r, g, b, a) {
        var bits = (a << 24 | b << 16 | g << 8 | r);
        return me.intToFloatColor(bits);
    };

    me.isPowerOfTwo = function(n) {
        return (n & (n - 1)) == 0;
    };

    me.nextPowerOfTwo = function(n) {
        n--;
        n |= n >> 1;
        n |= n >> 2;
        n |= n >> 4;
        n |= n >> 8;
        n |= n >> 16;
        return n+1;
    };

    return me;
}();