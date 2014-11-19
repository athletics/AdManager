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
		 * Check if is enabled for page
		 *
		 * @return bool
		 */
		function enabled() {

			var config = page_config();

			if ( typeof config.admanager_enabled === 'undefined' ) return true;

			return config.admanager_enabled;

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

		/**
		 * Get Shortest Possible Size for Unit
		 *
		 * @param object unit
		 * @return integer
		 */
		function shortest_available( unit ) {
			var shortest = 0;

			$.each( unit.sizes, function( index, sizes ) {
				if ( shortest === 0 ) shortest = sizes[1];
				else if ( sizes[1] < shortest ) shortest = sizes[1];
			});

			return shortest;
		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Get Tallest Possible Size for Unit
		 *
		 * @param object unit
		 * @return integer
		 */
		function tallest_available( unit ) {
			var tallest = 0;

			$.each( unit.sizes, function( index, sizes ) {
				if ( sizes[1] > tallest ) tallest = sizes[1];
			});

			return tallest;
		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Limit Ad Unit Height: Removes Larger Sizes from Inventory
		 *
		 * @param  object unit
		 * @param  int limit
		 * @return object unit
		 */
		function limit_unit_height( unit, limit ) {

			$.each( unit.sizes, function( index, sizes ) {
				if ( sizes[1] <= limit ) return true;

				unit.sizes.remove( index );
			} );

			return unit;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Get Unit Type
		 *
		 * @param string id
		 * @return string type
		 */
		function get_unit_type( id ) {

			var type = '';

			$.each( app.config.inventory, function( index, unit ) {
				if ( unit.id !== id ) return true;

				type = unit.type;
				return false;
			} );

			return type;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		return {
			init               : init,
			debug              : debug,
			enabled            : enabled,
			difference         : difference,
			is_mobile          : is_mobile,
			page_config        : page_config,
			shortest_available : shortest_available,
			tallest_available  : tallest_available,
			limit_unit_height  : limit_unit_height,
			get_unit_type      : get_unit_type
		};

	}( $ ) );

	return app;

}( admanager || {}, jQuery ) );