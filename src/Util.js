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

	var name = 'Util',
		debugEnabled = true,
		debug;

	//////////////////////////////////////////////////////////////////////////////////////

	function init() {

		debug( name + ': initialized' );

		initArrayRemove();

	}

	/**
	 * Debug - console.log wrapper
	 */
	debug = function () {

		if ( ! debugEnabled ) {
			return;
		} else if ( typeof console !== 'object' || ! console.log ) {
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

	function initArrayRemove() {

		// Array Remove - By John Resig (MIT Licensed)
		Array.prototype.remove = function ( from, to ) {
			var rest = this.slice( ( to || from ) + 1 || this.length );
			this.length = from < 0 ? this.length + from : from;
			return this.push.apply( this, rest );
		};

	}

	//////////////////////////////////////////////////////////////////////////////////////

	return {
		init:       init,
		debug:      debug,
		difference: difference
	};

} ) );