/**
 * Util
 */
( function ( root, factory ) {

	if ( typeof define === 'function' && define.amd ) {

		define( [ 'jquery' ], factory );

	} else if ( typeof exports === 'object' ) {

		module.exports = factory( 'jquery' );

	} else {

		root.AdManager = root.AdManager || {};
		root.AdManager.Util = factory( root.jQuery );

	}

}( this, function ( $ ) {

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

	}();

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

	/**
	 * Import JSON page config data from DOM
	 *
	 * This imports inline JSON via data attribute
	 * and extends an existing config with it.
	 *
	 * @param object options.$context
	 * @param string options.attrName
	 * @return object
	 */
	function importConfig( options ) {

		var $context = options.$context,
			attrName = options.attrName,
			existConfig = options.existConfig,
			selector,
			newConfig,
			data = {};

		selector = '*[data-' + attrName + ']';
		newConfig = $.extend( {}, existConfig );
		data = $context.find( selector ).data( attrName );

		if ( typeof newConfig === 'object' ) {
			newConfig = $.extend( newConfig, data );
		}

		return newConfig;

	}

	/**
	 * Returns the DOM wrapper context for the ads
	 *
	 * In standard applications this remains constant,
	 * but in infinite scroll applications, this needs to be dynamic.
	 * If the config does not provide one, the default value is 'body'.
	 *
	 * @return array $( selector )
	 *
	 * TODO:
	 * Add optional dynamically-determined context,
	 * for use in multi-segment infinite scroll
	 */
	function getContext() {

		// @todo update app.config usage
		var selector = app.config.context || 'body';
		return $( selector );

	}

	/**
	 * Get Shortest Possible Size for Unit
	 *
	 * @param object unit
	 * @return integer
	 */
	function shortestAvailable( unit ) {

		var shortest = 0;

		$.each( unit.sizes, function ( index, sizes ) {
			if ( shortest === 0 ) {
				shortest = sizes[1];
			} else if ( sizes[1] < shortest ) {
				shortest = sizes[1];
			}
		} );

		return shortest;

	}

	/**
	 * Get Tallest Possible Size for Unit
	 *
	 * @param object unit
	 * @return integer
	 */
	function tallestAvailable( unit ) {

		var tallest = 0;

		$.each( unit.sizes, function ( index, sizes ) {
			if ( sizes[1] > tallest ) {
				tallest = sizes[1];
			}
		} );

		return tallest;

	}

	/**
	 * Limit Ad Unit Height: Removes Larger Sizes from Inventory
	 *
	 * @param  object unit
	 * @param  int limit
	 * @return object unit
	 */
	function limitUnitHeight( unit, limit ) {

		$.each( unit.sizes, function ( index, sizes ) {
			if ( sizes[1] <= limit ) {
				return true;
			}
			unit.sizes.remove( index );
		} );

		return unit;

	}

	/**
	 * Get Unit Type
	 *
	 * @param string id
	 * @return string type
	 */
	function getUnitType( id ) {

		var type = 'default';

		// @todo update app.config usage
		$.each( app.config.inventory, function ( index, unit ) {
			if ( unit.id !== id ) {
				return true;
			}
			type = unit.type;
			return false;
		} );

		return type;

	}

	//////////////////////////////////////////////////////////////////////////////////////

	return {
		init:              init,
		debug:             debug,
		difference:        difference,
		importConfig:      importConfig,
		shortestAvailable: shortestAvailable,
		tallestAvailable:  tallestAvailable,
		limitUnitHeight:   limitUnitHeight,
		getUnitType:       getUnitType,
		getContext:        getContext
	};

} ) );