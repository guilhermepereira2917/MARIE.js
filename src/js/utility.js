/** @namespace */
var Utility = {};

(function() {


    /**
     * Converts an unsigned integer into an array of
     * binary numbers.
     * @memberof Utility
     *
     * @param {Number} num - the unsigned integer to be converted.
     * @param {Number} padding - how many zeros to pad integer.
     * @returns {Array} the binary array representation of unsigned integer.
     */
    Utility.uintToBinArray = function(num, padding) {
        var binArray = [];
        while(num > 0) {
            binArray.push(num & 1);
            num >>= 1;
        }

        if(typeof padding !== "undefined") {
            padding -= binArray.length;

            while(padding > 0) {
                binArray.push(0);
                padding -= 1;
            }
        }

        binArray.reverse();

        return binArray;
    };

    /**
     * Converts a signed integer in *size*-bit two's-complement format
     * into an array of binary numbers.
     * @memberof Utility
     *
     * @param {Number} num - the signed integer to be converted.
     * @param {Number} size - size of the signed integer.
     * @returns {Array} the binary array representation of signed integer.
     */
    Utility.intToBinArray = function(num, size) {
        var binArray = [];
        for(var i=0; i<size; i++){
            binArray.push(num & 1);
            num >>= 1;
        }

        binArray.reverse();

        return binArray;
    };

    /**
     * Converts an unsigned integer into an array of
     * binary numbers, and then converts into a bit string with even spacing
     * between each group of binary digits.
     * @memberof Utility
     *
     * @param {Number} num - The unsigned integer to be converted.
     * @param {Number} padding - How many zeros to pad integer.
     * @param {Number} bitSize - The length of each bit group.
     * @returns {String} The binary array representation of unsigned integer.
     */
    Utility.uintToBinGroup = function(num, padding, bitSize) {
        var binArray = Utility.uintToBinArray(num, padding);
        var binString = "";

        for (var i = 0; i < padding; i++) {
            binString += binArray[i];

            if(i % bitSize == bitSize - 1){
                binString += " ";
            }
        }

        return binString;
    };

    /**
     * Converts a signed integer in *size*-bit two's complement format
     * into an array of binary numbers, and then converts into a bit string
     * with even spacing between each group of binary digits.
     * @memberof Utility
     *
     * @param {Number} num - The unsigned integer to be converted.
     * @param {Number} size - Size of the signed integer.
     * @param {Number} bitSize - The length of each bit group.
     * @returns {String} The binary array representation of signed integer.
     */
    Utility.intToBinGroup = function(num, size, bitSize) {
        var binArray = Utility.intToBinArray(num, size);
        var binString = "";

        for (var i = 0; i < size; i++) {
            binString += binArray[i];

            if(i % bitSize == bitSize - 1){
                binString += " ";
            }
        }

        return binString;
    };

    /**
     * Converts signed integer into unsigned integer.
     * @memberof Utility
     *
     * @param  {Number} int  - The signed integer to be converted.
     * @param  {Number} [nbit=16] - The number of bits the integer takes.
     * @return {Number}      The unsigned integer representation of signed
     * integer.
     */
    Utility.intToUint = function(int, nbit) {
        var u = new Uint32Array(1);
        nbit = +nbit || 16;
        if (nbit > 32) throw new RangeError('intToUint only supports ints up to 32 bits');
        u[0] = int;
        if (nbit < 32) { // don't accidentally sign again
            int = Math.pow(2, nbit) - 1;
            return u[0] & int;
        } else {
            return u[0];
        }
    };


    /**
     * Converts unsigned integer into signed integer.
     * @memberof Utility
     *
     * @param  {Number} uint - The unsigned integer to be converted.
     * @param  {Number} [nbit=16] - The number of bits the integer takes.
     * @return {Number}      The signed integer representation of unsigned
     * integer.
     */
    Utility.uintToInt = function(uint, nbit) {
        nbit = +nbit || 16;
        if (nbit > 32) throw new RangeError('uintToInt only supports ints up to 32 bits');
        uint <<= 32 - nbit;
        uint >>= 32 - nbit;
        return uint;
    };


    /**
     * Converts decimal value into hexadecimal string.
     * @memberof Utility
     *
     * @param  {Number} num         - The value to be converted.
     * @param  {Number} [digits=4]  - How many hexadecimal digits are there?
     * (used for padding and truncating)
     * @return {String} The hexadecimal representation.
     */
    Utility.hex = function(num, digits) {
        digits = digits || 4;
        var s = (num >>> 0).toString(16).toUpperCase();
        var padleft = digits - s.length;
        if(padleft < 0) {
            padleft = 0;
            s = s.substr(s.length - digits, digits);
        }

        s = new Array(padleft + 1).join("0") + s;

        return s;
    };


    /**
     * Converts mask to bracket notation seen in MARIE.
     * @memberof Utility
     *
     * @param {Number} mask     - The value to be converted.
     * @param {Number} [digits=4]   - How many hexadecimal digits are
     * there?
     * @return {String} The bracket notation of mask.
     */
    Utility.maskToBracketNotation = function(mask, digits) {
        digits = digits || 4;
        var start, end, counter = 0, list = [], range=false;

        while(4 * digits !== counter) {
            if(mask & 1) {
                if(!range) {
                    range = true;
                    start = counter;
                }
            } else {
                if(range) {
                    range = false;
                    end = counter - 1;

                    if(start !== end) {
                        list.push([end, "-", start].join(''));
                    } else {
                        list.push(start);
                    }
                }
            }

            mask >>= 1;
            counter ++;
        }

        if(range) {
            range = false;
            end = counter - 1;

            if(start !== end) {
                list.push([end, "-", start].join(''));
            } else {
                list.push(start);
            }
        }

        list.reverse();

        return "[" + list.join(", ") + "]";
    };
}());
