/**
 * Util
 */
( function ( root, factory ) {

    if ( typeof define === 'function' && define.amd ) {

        define( [
            'jquery'
        ], factory );

    } else if ( typeof exports === 'object' ) {

        module.exports = factory(
            require( 'jquery' )
        );

    } else {

        root.AdManager = root.AdManager || {};

        root.AdManager.Util = factory(
            root.jQuery
        );

    }

} ( this, function ( $ ) {

    /**
     * Debug - console.log wrapper
     */
    var debug = function () {

        if ( typeof console !== 'object' || ! console.log ) {
            return;
        }

        return Function.prototype.bind.call( console.log, console );

    } ();

    /**
     * Return difference between arrays
     *
     * @param  array array
     * @param  array values
     * @return array diff
     */
    function difference( array, values ) {

        var diff = [];

        $.grep( array, function ( element ) {
            if ( $.inArray( element, values ) === -1 ) {
                diff.push( element );
            }
        } );

        return diff;

    }

    /**
     * Remove by key.
     *
     * @param  {Array}   array
     * @param  {Integer} key
     * @return {Array}   array
     */
    function removeByKey( array, key ) {

        array = $.grep( array, function ( element, index ) {
            return index !== key;
        } );

        return array;

    }

    //////////////////////////////////////////////////////////////////////////////////////

    return {
        debug:       debug,
        difference:  difference,
        removeByKey: removeByKey
    };

} ) );