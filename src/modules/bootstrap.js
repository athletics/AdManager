/**
 *		Name: Bootstrap
 *
 *		Requires: jQuery
 */

var admanager = ( function( app ) {

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

		function init( config ) {

			if ( app.initialized ) return false; // the app has already been initialized

			admanager.config = config || false;

			if ( ! admanager.config ) {
				throw new Error('Please provide config');
			}

			// store ref to jQuery
			$ = jQuery;

			app
				.util.init()
				.events.init()
				.manager.init()
				.insertion.init()
			;

			debug = admanager.util.debug ? admanager.util.debug : function(){};

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

}( admanager || {} ) );