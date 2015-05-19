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

		var name = 'Bootstrap',
			debug = null,
			initCallbacks = []
		;

		//////////////////////////////////////////////////////////////////////////////////////

		function init( config ) {

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

			for ( var i = 0; i < initCallbacks.length; i++ ) {
				initCallbacks[ i ]();
			}

			debug( name + ': initialized' );
			app.initialized = true;

			return app;

		}

		//////////////////////////////////////////////////////////////////////////////////////

		function register( callback ) {

			initCallbacks.push( callback );

		}

		//////////////////////////////////////////////////////////////////////////////////////

		return {
			init:     init,
			register: register
		};

	}() );

	return app;

}( admanager || {}, jQuery ) );