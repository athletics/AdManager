/**
 * Bootstrap
 */
( function ( root, factory ) {

	if ( typeof define === 'function' && define.amd ) {

		define( [
			'./Util',
			'./Config',
			'./Inventory',
			'./Manager',
			'./Insertion'
		], factory );

	} else if ( typeof exports == 'object' ) {

		module.exports = factory(
			require( './Util' ),
			require( './Config' ),
			require( './Inventory' ),
			require( './Manager' ),
			require( './Insertion' )
		);

	} else {

		var _AdManager = root.AdManager;

		root.AdManager = factory(
			_AdManager.Util,
			_AdManager.Config,
			_AdManager.Inventory,
			_AdManager.Manager,
			_AdManager.Insertion
		);

	}

} ( this, function ( Util, Config, Inventory, Manager, Insertion ) {

	function AdManager( newConfig ) {

		newConfig = newConfig || false;

		if ( ! newConfig ) {
			throw new Error( 'Please provide a config.' );
		}

		debug = Util.debug;

		Config.init( newConfig );

		Util.init();
		Insertion.init();
		Manager.init();

	}

	AdManager.prototype.Util = Util;
	AdManager.prototype.Config = Config;
	AdManager.prototype.Inventory = Inventory;
	AdManager.prototype.Manager = Manager;
	AdManager.prototype.Insertion = Insertion;

	return AdManager;

} ) );