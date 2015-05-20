/**
 * Bootstrap
 */
( function ( root, factory ) {

	if ( typeof define === 'function' && define.amd ) {

		define( [
			'./Config',
			'./Util'
		], factory );

	} else if ( typeof exports == 'object' ) {

		module.exports = factory(
			require( './Config' ),
			require( './Util' )
		);

	} else {

		var _AdManager = root.AdManager;

		root.AdManager = factory(
			_AdManager.Config,
			_AdManager.Util
		);

	}

} ) ( this, function ( Config, Util ) {

	function init( newConfig ) {

		newConfig = newConfig || false;

		if ( ! newConfig ) {
			throw new Error( 'Please provide a config.' );
		}

		debug = Util.debug;

		Config.init( newConfig );

		Util.init();

	}

	return init;

} );