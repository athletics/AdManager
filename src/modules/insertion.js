/**
 *		Name: Ad Insertion
 *
 *		Requires: app, app.util, jQuery
 */

var admanager = ( function( app, $ ) {

	app.insertion = ( function( $ ) {

		var _name = 'Insertion',
			debug = null,

			$layout = null
		;

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function init() {

			debug = admanager.util.debug ? admanager.util.debug : function(){};
			debug( _name + ': initialized' );

			var $layout = $('body')
			;

			if ( ! $layout.hasClass('node-type-article') ) return app;

			_events_listener();

			return app;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _events_listener() {

			$(document)
				.on('GPT:updateUI', function() {
					_adjust_blocks_for_ads();
				})
			;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Add adjust class to neighbor elements
		 *
		 * @param object $target
		 * @param int ad_height
		 */
		function _denote_blocks_for_adjustment( $target, ad_height ) {

			var adjustment = 0,
				$nodes = $target.nextAll()
			;

			ad_height = ad_height || 600;

			if ( ! _is_full_bleed_image( $target ) ) {
				$target.addClass('adjust_blocks_for_ads');
				adjustment += $target.height();
			}

			if ( adjustment > ad_height ) {
				return; // bail if already enough room
			}

			$nodes.each(function(i) {

				var $this = $(this);

				if ( adjustment > ad_height || _is_full_bleed_image( $this ) ) {
					return false; // break the loop
				}

				adjustment += $this.height();
				$this.addClass('adjust_blocks_for_ads');

			});

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _adjust_blocks_for_ads() {

			var $rec = $('.app_ad_unit[data-type="global_rec"]').first()
			;

			if (admanager.util.is_mobile()) return false;

			if ($rec.length < 1) return false;

			var rec_pos_left = $rec.position().left,
				normal_width = $('.adjust_blocks_for_ads').first().width(),
				width_reduction = Math.ceil( normal_width - rec_pos_left + parseInt( $rec.css('margin-left'), 10) ),
				new_width = normal_width - width_reduction
			;

			$('.adjust_blocks_for_ads').each(function(){

				var $this = $(this)
				;

				$this.find('img,iframe,object').each(function(){

					var $item = $(this);

					if ($item.width() > new_width) {
						$item.css({
							'width' : new_width
						});
					}
				});

			});
		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * _insert_ad_unit_into_body
		 *
		 * @param object unit
		 * @param object location
		 */
		function _insert_ad_unit_into_body(unit, location) {

			$(location).after(unit);

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * _is_full_bleed_image
		 *
		 * @param  object $element
		 * @return bool
		 */
		function _is_full_bleed_image( $element ) {
			var is_full_bleed_image = false;

			if (
				$element.is('.size-full_bleed') ||
				$element.find('img').hasClass('size-full_bleed')
			) {
				is_full_bleed_image = true;
			}

			return is_full_bleed_image;
		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * _is_valid_location
		 *
		 * @param  object $element
		 * @param  int index
		 * @return bool
		 */
		function _is_valid_insertion_location( $element, index ) {

			var valid = true;

			// is a div and not a pull quote
			if ( $element.is('div') && ! $element.is('div.site_pull_quote') ) {
				valid = false;
			}

			// first or second node
			else if ( index === 0 || index === 1 ) {

				// this is an image
				if ( $element.is('p, figure') && $element.find('img').length > 0 ) {
					valid = false;
				}

			}

			// don't double up on ads
			// catches [ad-wildcard] / app_ad_unit
			else if ( $element.prev().is('.app_ad_unit') ) {
				valid = false;
			}

			return valid;
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
				ad_html = '<div class="app_ad_unit '+ ad_type +'" data-type="'+ unit +'"></div>',
				ad_html_disable_float =	'<div class="app_ad_unit disable_float '+ ad_type +'" data-type="'+ unit +'"></div>'
			;

			if ( disable_float ) {
				return ad_html_disable_float;
			}
			else {
				return ad_html;
			}

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * _location_to_insert_ad_unit
		 *
		 * @param object options
		 * @return object
		 */
		function _location_to_insert_ad_unit( options ) {

			var $insert_after = false,
				$nodes = null,
				offset_top = options.$target.offset().top,
				fold_height = $(window).height() - 130, // 130 represents approximation of leaderboard
				location_found = false,
				disable_float = false,
				maybe_more = true,
				$prev_unit = false
			;

			// nodes after
			if ( typeof(options.$after) !== 'undefined' ) {
				$nodes = options.$after.nextAll();
				$prev_unit = options.$after;
			}
			// or all nodes
			else {
				$nodes = options.$target.children();
			}

			// no nodes?
			if ( $nodes.length < 1 ) {
				return false;
			}

			if ( fold_height < 750 ) fold_height = 750;

			var	preferred_max_height = fold_height - (250 / 2),
				node_iterator = 0
			;

			// insert ad into article
			$nodes.each(function(i) {

				var $this = $(this),
					$prev = $nodes.eq( i - 1 ),
					$next = $nodes.eq( i + 1 ),
					$last = $nodes.last(),
					height_from_top = $this.position().top + offset_top,
					end_point = $last.position().top + $last.height() + offset_top
				;

				// continue if not valid
				if ( ! _is_valid_insertion_location( $this, i ) ) {
					$this.css('display', 'block');
					node_iterator++;
					return true;
				}

				// mobile logic
				if (admanager.util.is_mobile()) {

					// skip the first node
					if (node_iterator === 0) {
						node_iterator++;
						return true;
					}

					// give distance bw first image
					if ( $prev.find('img').length > 0 && i === 1) {
						node_iterator++;
						return true;
					}

					// check distance from previous unit
					if ( $prev_unit !== false ) {

						var previous_position = $prev_unit.position().top,
							previous_height = $prev_unit.height(),
							this_position = $this.position().top,
							ad_height = 250,
							total = previous_position + previous_height + ad_height,
							difference = this_position - total,
							min_difference = 500
						;

						if ( difference < min_difference ) {
							node_iterator++;
							return true;
						}

					}

					$insert_after = $prev;
					location_found = true;
					return false;

				}

				// desktop logic
				else {

					if (node_iterator > 0 || $nodes.length < 2 ) {
						// Is this element a related post item?
						if (($prev.length > 0 && $prev.hasClass('related-post') || $this.hasClass('related-post')) && $next.length > 0) {
							node_iterator++;
							return true; // continue
						}

						$insert_after = $prev;

						if ( _is_full_bleed_image( $this ) && _is_full_bleed_image( $next ) ) {
							disable_float = true;
						}

						location_found = true;
						return false;
					}
				}

				node_iterator++;

			});

			if ( ! location_found && ! $prev_unit ) {
				$insert_after = options.$target.children().last();
				disable_float = true;
				maybe_more = false;
			}
			else if ( $prev_unit !== false ) {
				maybe_more = false;
			}

			return {
				'$insert_after' : $insert_after,
				'disable_float' : disable_float,
				'maybe_more' : maybe_more
			};

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		return {
			init : init
		};

	}( $ ) );

	return app;

}( admanager || {}, jQuery ) );