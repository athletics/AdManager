/**
 * Config
 */
( function ( root, factory ) {

	if ( typeof define === 'function' && define.amd ) {

		define( [
			'./Util'
		], factory );

	} else if ( typeof exports === 'object' ) {

		module.exports = factory(
			require( './Util' )
		);

	} else {

		root.AdManager = root.AdManager || {};

		root.AdManager.Config = factory(
			root.AdManager.Util
		);

	}

}( this, function ( Util ) {

	var name = 'Config',
		debugEnabled = true,
		debug = debugEnabled ? Util.debug : function () {},
		config = {};

	//////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Initialize the config module.
	 *
	 * @param  {Object} newConfig The AdManager config object.
	 */
	function init( newConfig ) {

		debug( name + ': initialized' );
		debug( newConfig );

		config = $.extend( {
			account: 0,
			clientType: false,
			context: 'body',
			enabled: true,
			insertExclusion: [],
			inventory: [],
			pageConfigAttr: false,
			targeting: []
		}, newConfig );

	}

	/**
	 * Set
	 *
	 * @param {String} key
	 * @param {Mixed}  value
	 */
	function set( key, value ) {

		config[ key ] = value;

	}

	/**
	 * Get
	 *
	 * @param  {String|Null} key Optional.
	 * @return {Mixed}
	 */
	function get( key ) {

		key = key || false;

		if ( ! key ) {
			return config;
		}

		return key in config ? config[ key ] : null;

	}

	//////////////////////////////////////////////////////////////////////////////////////

	return {
		init: init,
		set:  set,
		get:  get
	};

} ) );