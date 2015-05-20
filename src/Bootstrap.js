/**
 * Bootstrap
 */
( function ( root, factory ) {

	if ( typeof define === 'function' && define.amd ) {

		define( [
			'./Config',
			'./Util',
			'./Manager',
			'./Insertion'
		], factory );

	} else if ( typeof exports == 'object' ) {

		module.exports = factory(
			require( './Config' ),
			require( './Util' ),
			require( './Manager' ),
			require( './Insertion' )
		);

	} else {

		var _AdManager = root.AdManager;

		root.AdManager = factory(
			_AdManager.Config,
			_AdManager.Util,
			_AdManager.Manager,
			_AdManager.Insertion
		);

	}

} ) ( this, function ( Config, Util, Manager, Insertion ) {

	function AdManager( newConfig ) {

		newConfig = newConfig || false;

		if ( ! newConfig ) {
			throw new Error( 'Please provide a config.' );
		}

		debug = Util.debug;

		Config.init( newConfig );

		Util.init();

		Manager.init();
		Insertion.init();

	}

	AdManager.prototype.Util = Util;
	AdManager.prototype.Config = Config;
	AdManager.prototype.Manager = Manager;
	AdManager.prototype.Insertion = Insertion;

	return AdManager;

} );