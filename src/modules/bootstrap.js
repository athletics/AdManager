/**
 *		Name: Bootstrap
 *
 *		Requires: jQuery
 */

var admanager = ( function ( app, $ ) {

	if ( typeof app.initialized === 'undefined' ) {
		app.initialized = false;
	}

	app.bootstrap = ( function ( $ ) {

		var _name = 'Bootstrap',
			debug = null,
			_init_callbacks = []
		;

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _init( config ) {

			if ( app.initialized ) {
				// the app has already been initialized
				return false;
			}

			admanager.config = config || false;

			if ( ! admanager.config ) {
				throw new Error( 'Please provide config' );
			}

			debug = admanager.util.debug ? admanager.util.debug : function () {};

			app
				.util.init()
				.manager.init()
				.insertion.init()
			;

			for ( var i = 0; i < _init_callbacks.length; i++ ) {
				_init_callbacks[ i ]();
			}

			debug( _name + ': initialized' );
			app.initialized = true;

			return app;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _register( callback ) {

			_init_callbacks.push( callback );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		return {
			init: _init,
			register: _register
		};

	}() );

	return app;

}( admanager || {}, jQuery ) );