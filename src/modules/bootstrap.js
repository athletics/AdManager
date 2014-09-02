/**
 *		Name: Bootstrap
 *
 *		Requires: jQuery
 */

var app = ( function( app ) {

	if ( typeof app.initialized == 'undefined' ) {

		app.initialized = false;

	}

	app.bootstrap = ( function() {

		var _name = 'Bootstrap',
			$ = null,
			debug = null,
			_init_callbacks = []
		;

		/* * * * * * * * * * * * * * * * * * * * */

		function init() {

			if ( app.initialized ) return false; // the app has already been initialized

			if ( app.util.debug ) debug = app.util.debug;

			// store ref to jQuery
			$ = jQuery;

			for ( var i = 0; i < _init_callbacks.length; i++ ) {

				_init_callbacks[ i ]();

			}

			debug( _name + ': initialized' );

			app.initialized = true;

			return app;

		}

		/* * * * * * * * * * * * * * * * * * * * */

		function register( callback ) {

			_init_callbacks.push( callback );

		}

		/* * * * * * * * * * * * * * * * * * * * */

		return {
			init : init,
			register : register
		};

	}());

	return app;

}( app || {} ) );