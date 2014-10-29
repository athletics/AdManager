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
			insert_after = false,
			_inventory = [],
			last_position = 0,
			odd = true
		;

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function init() {

			debug = admanager.util.debug ? admanager.util.debug : function(){};
			debug( _name + ': initialized' );

			$target = $( app.config.insertion_selector ).first();

			if ( ! _is_enabled() ) {
				_broadcast();
				return app;
			}

			if ( $target.length < 1 ) {
				$target = $('.app_ad_insert_after');
				insert_after = true;
			}

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

		/**
		 * Is Insertion Enabled?
		 *
		 * @return bool
		 */
		function _is_enabled() {
			var page_config = app.util.page_config();

			if ( typeof page_config.insertion_enabled === 'undefined' ) return false;

			return page_config.insertion_enabled;
		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _insert_ad_units() {

			if ( ! insert_after ) {

				_denote_valid_insertions();

				_insert_primary_unit();
				_insert_secondary_units();

			}
			else {
				_insert_after_units();
			}

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
		 * @param string unit
		 * @param bool disable_float
		 * @return string
		 */
		function _ad_unit_markup( unit, disable_float ) {

			disable_float = disable_float || false;

			var type = admanager.util.is_mobile() ? 'mobile' : 'desktop',
				alignment = odd ? 'odd' : 'even',
				html = '<div class="app_ad_unit in_content '+ alignment + ' ' + type +'" data-type="'+ unit +'"></div>',
				html_disable_float =	'<div class="app_ad_unit disable_float '+ type +'" data-type="'+ unit +'"></div>'
			;

			if ( ! disable_float ) odd = ! odd;

			return disable_float ? html_disable_float : html;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Insert Primary Unit: Unit most display above the fold
		 */
		function _insert_primary_unit() {

			var unit = _get_primary_unit(),
				tallest = admanager.util.tallest_available( unit ),
				shortest = admanager.util.shortest_available( unit ),

				location = _location_to_insert_ad_unit( {
					height: tallest,
					limit: 1000
				} ),
				markup = null
			;

			if ( ! location ) {
				location = _location_to_insert_ad_unit( {
					height: shortest,
					limit: 1000,
					force: true
				} );

				if ( ! location.disable_float ) {
					// unset large sizes
					unit = admanager.util.limit_unit_height( unit, shortest );
				}
			}

			markup = _ad_unit_markup( unit.type, location.disable_float );

			location.$insert_before.before( markup );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _insert_secondary_units() {

			$.each( _inventory, function( index, unit ) {

				var tallest = admanager.util.tallest_available( unit ),
					location = _location_to_insert_ad_unit( {
						height: tallest
					} ),
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

		function _insert_after_units() {

			$target.each( function() {
				var unit = _get_next_unit(),
					markup = null
				;

				if ( ! unit ) return false;

				markup = _ad_unit_markup( unit.type, true );

				$(this).after( markup );
			} );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _get_next_unit() {
			var next_unit = false;

			$.each( _inventory, function( index, unit ) {
				if ( $('[data-type="' + unit.type + '"]').length !== 0 ) return true;

				next_unit = unit;
				return false;
			} );

			return next_unit;
		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _get_primary_unit() {

			var primary_unit = false
			;

			$.each( _inventory, function( index, unit ) {

				if ( unit.primary === true ) {
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
				force = options.force ? options.force : false,
				margin_difference = 40,
				needed_height = options.height - margin_difference,
				between_units = 800,

				location_found = false,
				disable_float = false,
				maybe_more = true
			;

			if ( $nodes.length < 1 ) return false;

			$nodes.each( function( i ) {

				var $this = $(this),
					$prev = i > 0 ? $nodes.eq( i - 1 ) : false,
					offset = $this.offset().top,
					since = offset - last_position,
					height = $this.outerHeight(),
					is_last = ( $nodes.length - 1 ) === i
				;

				total_height += height;

				if ( force && ( total_height >= limit || is_last ) ) {
					$insert_before = $this;
					disable_float = true;
					location_found = true;

					return false;
				}

				else if ( limit && ( total_height >= limit || is_last ) ) {
					location_found = false;

					return false;
				}

				if ( _is_valid_insertion_location($this) ) {
					valid_height += height;

					inserted.push($this);

					if ( $insert_before === null ) {
						$insert_before = $this;
					}

					if ( valid_height >= needed_height ) {
						if ( limit === false && ( since < between_units ) ) {
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

			} );

			if ( ! location_found ) {
				return false;
			}

			if ( inserted.length > 0 ) {
				$.each( inserted, function( index, item ) {
					$(item).data('valid-location', false);
				} );
			}

			last_position = $insert_before.offset().top + needed_height;

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

			return $nodes;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		return {
			init : init
		};

	}( $ ) );

	return app;

}( admanager || {}, jQuery ) );