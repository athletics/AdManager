/*
*	Utilities
*/
define([ 'jquery' ], function( $ ) {

	var _name = 'Util'
	;

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	function debug( obj ) {

		if ( ( typeof console == "object" ) && ( console.log ) ) {

			console.log( obj );

		}

	}

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	/**
	 * Set window.requestAnimationFrame
	 *
	 * requestAnimationFrame Firefox 23 / IE 10 / Chrome / Safari 7 (incl. iOS)
	 * mozRequestAnimationFrame Firefox < 23
	 * webkitRequestAnimationFrame Older versions of Safari / Chrome
	 */
	function _set_window_request_animation_frame() {

		window.requestAnimationFrame = window.requestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.oRequestAnimationFrame
		;

	}

	_set_window_request_animation_frame();

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	return {
		debug : debug
	};

});