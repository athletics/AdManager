/**
 *		Name: Ad Insertion
 *
 *		Requires: app, app.util, jQuery
 */

var admanager = ( function( app, $ ) {

	app.insertion = ( function( $ ) {

		var _name = 'Insertion',
			debug = null,

			$target = null,
			_inventory = [],
			last_position = 0
		;

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function init() {

			debug = admanager.util.debug ? admanager.util.debug : function(){};
			debug( _name + ': initialized' );

			$target = $( app.config.insertion_selector ).first();

			if ( $target.length < 1 ) {
				_broadcast();

				return app;
			}

			_inventory = app.manager.get_dynamic_inventory();

			_insert_ad_units();

			return app;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Ad units have been inserted / proceed
		 */
		function _broadcast() {

			$.event.trigger( 'GPT:unitsInserted' );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _insert_ad_units() {

			_denote_valid_insertions();

			_insert_primary_unit();
			_insert_secondary_units();

			_broadcast();

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _denote_valid_insertions() {

			var $nodes = $target.children(),
				excluded = [
					'img',
					'iframe',
					'video',
					'audio',
					'.video',
					'.audio',
					'.app_ad_unit'
				]
			;

			$nodes.each( function( i ) {

				var $element = $(this),
					$prev = i > 0 ? $nodes.eq( i - 1 ) : false,
					valid = true
				;

				$.each( excluded, function( index, item ) {

					if ( $element.is( item ) || $element.find( item ).length > 0 ) {

						// not valid
						valid = false;

						// break loop
						return false;
					}

				} );

				if ( $prev && $prev.is('p') && $prev.find('img').length === 1 ) valid = false;

				$element.data('valid-location', valid);

			} );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Check against of list of elements to skip
		 *
		 * @param  object $element
		 * @return bool
		 */
		function _is_valid_insertion_location( $element ) {

			return $element.data('valid-location');

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * _ad_unit_markup
		 *
		 * @param object unit
		 * @param bool disable_float
		 * @return string
		 */
		function _ad_unit_markup( unit, disable_float ) {

			var ad_type = admanager.util.is_mobile() ? 'mobile' : 'desktop',
				ad_html = '<div class="app_ad_unit in_content '+ ad_type +'" data-type="'+ unit +'"></div>',
				ad_html_disable_float =	'<div class="app_ad_unit disable_float '+ ad_type +'" data-type="'+ unit +'"></div>'
			;

			return disable_float ? ad_html_disable_float : ad_html;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _insert_primary_unit() {

			var location = _location_to_insert_ad_unit({
					'limit' : 1000
				}),
				unit = _get_primary_unit(),
				markup = _ad_unit_markup( unit.type, location.disable_float )
			;

			location.$insert_before.before( markup );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _insert_secondary_units() {

			$.each( _inventory, function( index, unit ) {

				var location = _location_to_insert_ad_unit(),
					markup = null
				;

				if ( ! location ) {
					return false;
				}

				markup = _ad_unit_markup( unit.type, location.disable_float );
				location.$insert_before.before( markup );

			} );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _get_primary_unit() {

			var primary_unit = false
			;

			$.each( _inventory, function( index, unit ) {

				if ( unit.primary == true ) {
					primary_unit = unit;
					_inventory.remove(index);

					return false;
				}

			} );

			if ( ! primary_unit ) {
				primary_unit = _inventory[0];
				_inventory.remove(0);
			}

			return primary_unit;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * _location_to_insert_ad_unit
		 *
		 * @param object options
		 * @return object
		 */
		function _location_to_insert_ad_unit( options ) {

			options = options || {};

			var $nodes = _get_nodes(),
				$insert_before = null,
				inserted = [],

				total_height = 0,
				valid_height = 0,
				limit = options.limit ? options.limit : false,
				unit_height = 600,
				between_units = 900,

				location_found = false,
				disable_float = false,
				maybe_more = true
			;

			if ( $nodes.length < 1 ) return false;

			$nodes.each(function(i) {

				var $this = $(this),
					$prev = i > 0 ? $nodes.eq( i - 1 ) : false,
					offset = $this.offset().top,
					since = offset - last_position,
					height = $this.outerHeight(),
					is_last = ($nodes.length - 1) === i
				;

				total_height += height;

				if ( limit && (total_height >= limit || is_last) ) {
					$insert_before = $this;
					disable_float = true;
					location_found = true;

					return false;
				}


				if ( _is_valid_insertion_location($this) ) {
					valid_height += height;

					inserted.push($this);

					if ( $insert_before === null ) {
						$insert_before = $this;
					}

					if ( valid_height >= unit_height ) {
						if ( limit === false && (since < between_units) ) {
							valid_height = 0;
							$insert_before = null;
							return true;
						}

						location_found = true;
						return false;
					}
				}
				else {
					valid_height = 0;
					$insert_before = null;
				}

			});

			if ( ! location_found ) {
				return false;
			}

			if ( inserted.length > 0 ) {
				$.each( inserted, function( index, item ) {
					$(item).data('valid-location', false);
				} );
			}

			last_position = $insert_before.offset().top + unit_height;

			return {
				'$insert_before' : $insert_before,
				'disable_float' : disable_float
			};

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Is Element an Ad Unit
		 *
		 * @param mixed $el
		 * @return bool
		 */
		function _is_this_an_ad( $el ) {

			if ( ! $el ) return false;

			return $el.is('.app_ad_unit');

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Get Nodes to Loop Through
		 *
		 * @return array $nodes
		 */
		function _get_nodes() {

			var $prev_unit = $target.find('.app_ad_unit').last(),
				$nodes = null
			;

			// nodes after previous unit or all nodes
			$nodes = ( $prev_unit.length > 0 ) ? $prev_unit.nextAll( $target ) : $target.children();
			// $nodes = $target.children();

			return $nodes;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		return {
			init : init
		};

	}( $ ) );

	return app;

}( admanager || {}, jQuery ) );