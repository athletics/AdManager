/**
 * Inventory
 */
( function ( root, factory ) {

	if ( typeof define === 'function' && define.amd ) {

		define( [
			'jquery',
			'./Config'
		], factory );

	} else if ( typeof exports === 'object' ) {

		module.exports = factory(
			require( 'jquery' ),
			require( './Config' )
		);

	} else {

		root.AdManager = root.AdManager || {};

		root.AdManager.Inventory = factory(
			root.jQuery,
			root.AdManager.Conifg
		);

	}

} ( this, function ( $, Config ) {

	var name = 'Inventory',
		debugEnabled = true,
		debug;

	//////////////////////////////////////////////////////////////////////////////////////

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
			unit.sizes = Util.removeByKey( unit.sizes, index );
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

		$.each( Config.get( 'inventory' ), function ( index, unit ) {

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
		shortestAvailable: shortestAvailable,
		tallestAvailable:  tallestAvailable,
		limitUnitHeight:   limitUnitHeight,
		getUnitType:       getUnitType
	};

} ) );