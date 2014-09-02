/*
*		js module:
*			ad_manager.js
*
*		desc:
*			After initialization of GPT in the header, defining ad slots,
*			targeting, single-request mode, and displaying ads.
*
*/
var app = (function(app, $) {

	/* define new module */
	app.ad_manager = (function($){

		var _name = 'AdManager',
			_debug_enable = false,
			debug = ( _debug_enable ) ? app.util.debug : function(){},
			defined_slots = [],
			interstitial_slot = [],
			page_positions = []
		;

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function init() {

			// use this to disable ads
			// return app;

			debug( _name + ': initialized' );

			alert('hit init');
			return;

			_listen_for_custom_events();

			if ( ! app.ad_utilities.delay_ads_init() ) {
				_library_request();
			}

			return app;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _library_request() {

			debug('_library_request');

			_inventory = _get_available_sizes( _inventory );

			window.googletag = window.googletag || {};
			window.googletag.cmd = window.googletag.cmd || [];

			var useSSL = 'https:' === document.location.protocol,
				path = (useSSL ? 'https:' : 'http:') + '//www.googletagservices.com/tag/js/gpt.js'
			;

			$LAB
				.script( path )
				.wait(function() {
					_library_loaded();
				})
			;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Callback from $LAB when GPT library is loaded
		 */
		function _library_loaded() {

			googletag.cmd.push(function(){
				$.event.trigger( 'LibraryLoaded.GPT' );
			});

			_listen_for_dfp_events();
			_enable_single_request();
			_set_targeting();
			_set_page_positions();
			_define_slots_for_page_positions();
			_display_page_ads();

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Bind to custom jQuery events
		 */
		function _listen_for_custom_events() {

			$(document)
				.on('InitPageAds.GPT', function(event) {

					debug(_name + ': InitPageAds.GPT');
					_display_page_ads();

				})
			;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Bind to GPT events
		 */
		function _listen_for_dfp_events() {

			googletag.cmd.push(function() {

				googletag.pubads().addEventListener('slotRenderEnded', function(event) {
					_slot_render_ended(event);
				});

			});

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Enable Batched SRA
		 *
		 * @uses collapseEmptyDivs()
		 * @uses enableSingleRequest()
		 * @uses disableInitialLoad()
		 */
		function _enable_single_request() {

			googletag.cmd.push(function() {
				// https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_collapseEmptyDivs
				googletag.pubads().collapseEmptyDivs();

				// https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_enableSingleRequest
				googletag.pubads().enableSingleRequest();

				// https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_disableInitialLoad
				googletag.pubads().disableInitialLoad();
			});

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Remove sizes from inventory that will not display properly
		 *
		 * @param object _inventory
		 * @return object _inventory
		 */
		function _get_available_sizes( _inventory ) {

			var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;

			if ( width > 1024 ) return _inventory;

			if ( width >= 768 && width <= 1024 ) {
				var max = 980;

				for (var i = 0; i < _inventory.length; i++) {

					var sizes_to_remove = [];

					for (var j = 0; j < _inventory[i].sizes.length; j++) {

						if ( _inventory[i].sizes[j][0] > max ) {
							sizes_to_remove.push(_inventory[i].sizes[j]);
						}

					}

					_inventory[i].sizes = _.difference( _inventory[i].sizes, sizes_to_remove );

				}
			}

			return _inventory;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Increment Ad Slot
		 *
		 * @param string slot
		 */
		function _increment_ad_slot( slot ) {

			for (var i = 0; i < _inventory.length; i++) {
				if ( _inventory[i].slot == slot ) {

					// increment
					_inventory[i].iteration = _inventory[i].iteration + 1;

					return;
				}
			}
		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Get Ad Unit Info
		 *
		 * @param string slot
		 * @return object
		 */
		function get_ad_info( slot ) {

			var return_object = {};

			for (var i = 0; i < _inventory.length; i++) {
				if ( _inventory[i].slot == slot ) {

					// build return object
					return_object = _inventory[i];

					// determine the object's id_name
					if (typeof return_object.use_iterator != 'undefined' && !return_object.use_iterator) {
						// don't use the iterator
						return_object.id_name = return_object.type;
					} else {
						// use the iterator
						return_object.id_name = return_object.type + '_' + return_object.iteration;
					}

					return return_object;
				}
			}
		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Define Slots for Page Positions
		 */
		function _define_slots_for_page_positions() {

			var cur_position = null,
				excluded = [ 'Classic_Interstitial', 'Welcome_Ad' ]
			;

			googletag.cmd.push(function(){
				for (var i = 0; i < page_positions.length; i++) {

					_increment_ad_slot( page_positions[i] );

					cur_position = get_ad_info( page_positions[i] );

					if ( typeof cur_position.type != 'undefined' ) {

						// find the empty container div on the page. we
						// will dynamically instantiate the unique ad unit.

						var $unit = $('.app_ad_unit[data-type="'+ cur_position.type +'"]')
						;

						if ($unit.length > 0) {

							if ( $.inArray( page_positions[i], excluded ) === -1 ) {
								// generate new div
								$unit.html(
									'<div class="unit_target" id="'+ cur_position.id_name +'"></div>'
								);

								// activate
								$unit.addClass('active');
							}

							if ( typeof(cur_position.sharethrough) !== 'undefined' ) {
								defined_slots[i] = googletag
									.defineSlot(
										'/2322946/' + cur_position.slot,
										cur_position.sizes,
										cur_position.id_name
									)
									.addService(googletag.pubads())
									.setTargeting('strnativekey', cur_position.sharethrough)
								;
							}
							else {
								defined_slots[i] = googletag
									.defineSlot(
										'/2322946/' + cur_position.slot,
										cur_position.sizes,
										cur_position.id_name
									)
									.addService(googletag.pubads())
								;
							}
						}
					}
				}

				// Enables GPT services for defined slots
				googletag.enableServices();

				$.event.trigger( 'SlotsDefined.GPT' );

			});

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _display_page_ads() {

			googletag.cmd.push(function() {

				// Fetch and display ads for defined_slots
				googletag.pubads().refresh( defined_slots );

				// lastly, run display code
				for (var n = 0; n < page_positions.length; n++) {

					cur_position = get_ad_info( page_positions[n] );

					if ( $('#' + cur_position.id_name).length > 0 ) {
						googletag.display(
							cur_position.id_name
						);
					}
				}

			});

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * _get_defined_slot
		 *
		 * @param string name
		 * @return object defined_slot
		 */
		function _get_defined_slot( name ) {

			var defined_slot = null
			;

			$.each( defined_slots, function( i, slot ) {
				var unit_name = slot.getAdUnitPath().replace('/2322946/', '')
				;

				if ( unit_name === name ) {
					defined_slot = slot;
					return false;
				}
			} );

			return defined_slot;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * display_slot
		 *
		 * @param string name
		 */
		function display_slot( name ) {

			googletag.cmd.push(function() {

				var position = get_ad_info( name ),
					slot = _get_defined_slot( name )
				;

				googletag.pubads().refresh( [slot] );
				googletag.display( position.id_name );
				remove_defined_slot( name );

			});

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * remove_defined_slot
		 *
		 * @param string name
		 * @return object defined_slot
		 */
		function remove_defined_slot( name ) {

			defined_slots = _.reject(defined_slots, function( slot ) {
				var unit_name = slot.getAdUnitPath().replace('/2322946/', '')
				;

				return ( unit_name === name );
			});

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Send targeting info defined in page config
		 */
		function _set_targeting() {

			googletag.cmd.push(function() {

				var config = app.controller.get_page_config(),
					targeting = config.targeting,
					tags = config.suggested_tags
				;

				// Set targeting
				if (typeof targeting !== 'undefined') {
					$.each( targeting, function( key, value ) {
						googletag.pubads().setTargeting(key, value);
					});
				}

				// Suggested Tags
				if (typeof tags !== 'undefined') {
					googletag.pubads().setTargeting('tag', tags);
				}

			});

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _set_page_positions() {

			if ( is_mobile_ads() ) {
				_set_mobile_page_positions();
			}
			else {
				_set_desktop_page_positions();
				//_set_special_page_positions();
			}

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Set Mobile Page Positions
		 *
		 * @todo Separate markup insertion
		 */
		function _set_mobile_page_positions() {

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Set Desktop Page Positions
		 *
		 * @todo Separate markup insertion
		 */
		function _set_desktop_page_positions() {

			page_positions = [];

			// Is homepage
			if ( $('.page').hasClass('homepage') ) {

				page_positions = [
					'Site_728x90_Homepage_Top',
					'Site_300x250_Homepage_Middle',
					'Homepage_Leaderboard_BTF',
					'Sponsored_Post',
					'Clickable_Skin',
					'Sitewide_Interstitial'
				];

			}

			// Is post detail page
			else if ( $('.page').hasClass('article_detail') ) {

				var ad_unit = _location_to_insert_ad_unit({
						'$target' : $('article.post.entry')
					}),
					_location = ad_unit.$insert_after,
					disable_float = ad_unit.disable_float,
					_markup = _ad_unit_markup('global_rec', disable_float)
				;

				_insert_ad_unit_into_body( _markup, _location );

				page_positions = [
					'Global_Leaderboard_AboveFold',
					'MRec_Article_Above_Fold',
					'ArticlePage_MPU_BTF',
					'Article_EndMessage',
					'ExperimentalLeaderboard',
					'Article_Detail_Wide_Skyscraper',
					'v2_Site_Skin',
					'Sitewide_Interstitial'
				];

				// shortcode puts ad position in article body
				if ( $('.app_ad_unit[data-type="ad_mpu"]').length > 0 ) {
					page_positions.push('Article_Detail_Wildcard_MPU');
				}

			}


			// Is this a page with the standard Leaderboard + Right Rail?
			else if (
				$('.page').hasClass('archive') ||
				$('.page').hasClass('generic') ||
				$('.page').hasClass('privacy_policy') ||
				$('.page').hasClass('contact') ||
				$('.page').hasClass('404')
			) {

				page_positions = [
					'Global_Leaderboard_AboveFold',
					'MRec_Article_Above_Fold'
				];

			}


			// Is a page with a Leaderboard only (i.e. About, Submissions, etc.)
			else if ( $('.page').hasClass('leaderboard_only') ) {

				page_positions = [
					'Global_Leaderboard_AboveFold'
				];

			}

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		// function _set_special_page_positions() {

		// 	// push on Classical Interstitial if enabled
		// 	if ( ! _intersitial_disabled ) {
		// 		page_positions.push('Classic_Interstitial');
		// 	}

		// 	// push on Welcome Ad if enabled
		// 	if ( ! _welcome_ad_disabled ) {
		// 		page_positions.push('Welcome_Ad');
		// 	}

		// }

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * _slot_render_ended - callback after unit is rendered
		 *
		 * @see https://developers.google.com/doubleclick-gpt/reference
		 * @param object unit
		 */
		function _slot_render_ended( unit ) {

			var unit_name = unit.slot.getAdUnitPath().replace('/2322946/', '')
			;

			$.event.trigger( 'AdUnitRendered.DFP', {
				'name': unit_name,
				'size': unit.size
			} );

			if ( unit_name === 'MRec_Article_Above_Fold' && $('.page').hasClass('article_detail') ) {
				var this_unit = get_ad_info('MRec_Article_Above_Fold'),
					$target = $('.app_ad_unit[data-type="' + this_unit.type + '"]').next(),
					height = unit.size[1]
				;

				_denote_blocks_for_adjustment( $target, height );
				_adjust_blocks_for_ads();
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
				if (is_mobile_ads()) {

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
		 * _ad_unit_markup
		 *
		 * @param object unit
		 * @param bool disable_float
		 * @return string
		 */
		function _ad_unit_markup( unit, disable_float ) {

			var ad_type = is_mobile_ads() ? 'mobile' : 'desktop',
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

			if (is_mobile_ads()) return false;

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
		 * Helper: Is Mobile Ads
		 *
		 * @return bool
		 */
		function is_mobile_ads() {

			return false;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function update_ui() {

			_adjust_blocks_for_ads();

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/* return public-facing methods and/or vars */
		return {
			init : init,
			get_ad_info : get_ad_info,
			is_mobile_ads : is_mobile_ads,
			display_slot : display_slot,
			remove_defined_slot : remove_defined_slot,
			update_ui : update_ui
		};

	}($));

	return app; /* return augmented app object */

}( app || {}, jQuery )); /* import app if exists, or create new */