/**
 * Shared utilities for debugging and array manipulation.
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
     * A console.log wrapper with the correct line numbers.
     *
     * @see    https://gist.github.com/bgrins/5108712
     * @see    https://developer.mozilla.org/en-US/docs/Web/API/Console/log
     * @param  {Mixed}
     * @return {String}
     */
    var debug = function () {

        if ( typeof console !== 'object' || ! console.log ) {
            return;
        }

        return console.log.bind( console );

    } ();

    /**
     * Get the difference of two arrays.
     *
     * @param  {Array} array
     * @param  {Array} values
     * @return {Array} diff
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
     * Remove array value by key.
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