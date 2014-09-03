/**
 *		Name: Events
 *
 *		Requires: app, app.util, jQuery
 */

var admanager = ( function( app, $ ) {

	app.events = ( function( $ ) {

		var _name = 'Events',
			debug = null
		;

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function init() {

			debug = admanager.util.debug ? admanager.util.debug : function(){};
			debug( _name + ': initialized' );

			_broadcast_events();

			return app;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _broadcast_events() {

			$(document)
				.on( 'scroll', function() {

					window.requestAnimationFrame( function() {
						$.event.trigger('GPT:scroll');
						$.event.trigger('GPT:updateUI');
					} );

				} )
				.on( 'resize', function() {

					window.requestAnimationFrame( function() {
						$.event.trigger('GPT:resize');
						$.event.trigger('GPT:updateUI');
					} );

				} )
			;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		return {
			init : init
		};

	}( $ ) );

	return app;

}( admanager || {}, jQuery ) );