/**
 *		Name: Util
 *
 *		Requires: app, jQuery
 */

var admanager = ( function( app, $ ) {

	app.util = ( function( $ ) {

		var _name = 'Util',
			_debug_enable = false
		;

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function init() {

			debug( _name + ': initialized' );

			_init_array_remove();
			_set_window_request_animation_frame();

			return app;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function debug( obj ) {

			if ( ! _debug_enable ) return;

			if ( ( typeof console == "object" ) && ( console.log ) ) {

				console.log( obj );

			}

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Return difference between arrays
		 *
		 * @param  array array
		 * @param  array values
		 * @return array diff
		 */
		function difference( array, values ) {

			var diff = []
			;

			$.grep( array, function( element ) {
				if ( $.inArray( element, values ) === -1 ) diff.push( element );
			});

			return diff;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Is Mobile
		 *
		 * @return bool
		 */
		function is_mobile() {

			return $(window).width() < 768 ? true : false;

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

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _init_array_remove() {

			// Array Remove - By John Resig (MIT Licensed)
			Array.prototype.remove = function(from, to) {
				var rest = this.slice((to || from) + 1 || this.length);
				this.length = from < 0 ? this.length + from : from;
				return this.push.apply(this, rest);
			};

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Get page config
		 *
		 * @return object
		 */
		function page_config() {
			if ( typeof app.config.page_config_selector === 'undefined' ) return {};

			var config = $( app.config.page_config_selector ).data('page-config');

			if ( typeof config !== 'object' ) return {};

			return config;
		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		return {
			init        : init,
			debug       : debug,
			difference  : difference,
			is_mobile   : is_mobile,
			page_config : page_config
		};

	}( $ ) );

	return app;

}( admanager || {}, jQuery ) );