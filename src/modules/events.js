/**
 *		Name: Events
 *
 *		Requires: app, app.util, jQuery
 */

var app = ( function( app, $ ) {

	app.events = ( function( $ ) {

		var _name = 'Events',
			debug = app.util.debug
		;

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function init() {

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

}( app || {}, jQuery ) );

app.bootstrap.register( app.events.init );