/**
 * Events
 */
define([ 'jquery', 'app/util' ], function( $, util ) {

	var _name = 'Events',
		_debug_enable = true,
		debug = ( _debug_enable ) ? util.debug : function(){}
	;

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	debug( _name + ': initialized' );

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

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

});