var Utility = {};

(function() {


    /**
     * Utility.lineToMemoryAddress - Converts line number into memory address.
     *
     * @param {Number} line - The line number.
     * @return {String} The corresponding memory address.
     */
    Utility.lineToMemoryAddress = function(line) {
        line --;
        var n = 3;

        var str = line.toString(16).toUpperCase();
        // http://stackoverflow.com/a/10073788/824294
        // pads leading zeros if str is shorter than 3 characters.
        return str.length >= n ? str : new Array(n - str.length + 1).join("0") + str;
    };


    /**
     * Utility.uintToBinArray - Converts an unsigned integer into an array of
     * binary numbers.
     *
     * @param {Number} num - the unsigned integer to be converted.
     * @param {Number} padding - how many zeros to pad integer.
     * @returns {Array} the binary array representation of unsigned integer.
     */
    Utility.uintToBinArray = function(num, padding) {
        var bin_array = [];
        while(num > 0) {
            bin_array.push(num & 1);
            num >>= 1;
        }

        if(typeof padding !== "undefined") {
            padding -= bin_array.length;

            while(padding > 0) {
                bin_array.push(0);
                padding -= 1;
            }
        }

        bin_array.reverse();

        return bin_array;
    };


    /**
     * Utility.intToUint - Converts signed integer into unsigned integer.
     *
     * @param  {Number} int  - The signed integer to be converted.
     * @param  {Number} nbit - (optional) the number of bits the integer takes.
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
     * Utility.uintToInt - Converts unsigned integer into signed integer.
     *
     * @param  {Number} uint - The unsigned integer to be converted.
     * @param  {Number} nbit - (optional) the number of bits the integer takes.
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
     * Utility.hex - Converts decimal value into hexadecimal string.
     *
     * @param  {Number} num    - The value to be converted.
     * @param  {Number} digits - (optional) how many hexadecimal digits
     * @return {String} The hexadecimal representation.
     */
    Utility.hex = function(num, digits) {
        digits = digits || 4;
        var s = "0000" + (num >>> 0).toString(16).toUpperCase();
        return s.substr(s.length - digits);
    };
}());
