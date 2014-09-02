/**
 *		Name: Ad Manager
 *
 *		Requires: app, app.util, app.config, app.events, jQuery
 */

var admanager = ( function( app, $ ) {

	app.manager = ( function( $ ) {

		var _name = 'Manager',
			debug = admanager.util.debug,

			defined_slots = [],
			page_positions = [],
			inventory = [],
			account = null
		;

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function init() {

			debug( _name + ': initialized' );

			if ( typeof app.config == 'undefined' ) {
				debug( 'No config.' );
				return app;
			}

			inventory = _get_available_sizes( app.config.inventory );
			account = app.config.account;

			_listen_for_jquery_events();
			_load_library();

			return app;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Bind to custom jQuery events
		 */
		function _listen_for_jquery_events() {

			$(document)
				.on('GPT:initPageAds', function(event) {

					debug(_name + ': GPT:initPageAds');
					_display_page_ads();

				})
			;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Remove sizes from inventory that will not display properly
		 *
		 * @param array _inventory
		 * @return array _inventory
		 */
		function _get_available_sizes( _inventory ) {

			var width = ( window.innerWidth > 0 ) ? window.innerWidth : screen.width
			;

			if ( width > 1024 ) return _inventory;

			if ( width >= 768 && width <= 1024 ) {
				var max = 980;

				for (var i = 0; i < _inventory.length; i++) {

					var sizes_to_remove = [];

					for (var j = 0; j < _inventory[i].sizes.length; j++) {

						if ( _inventory[i].sizes[j][0] > max ) {
							sizes_to_remove.push( _inventory[i].sizes[j] );
						}

					}

					_inventory[i].sizes = util.difference( _inventory[i].sizes, sizes_to_remove );

				}
			}

			return _inventory;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Request GPT library
		 */
		function _load_library() {

			window.googletag = window.googletag || {};
			window.googletag.cmd = window.googletag.cmd || [];

			var useSSL = 'https:' === document.location.protocol,
				path = (useSSL ? 'https:' : 'http:') + '//www.googletagservices.com/tag/js/gpt.js'
			;

			$LAB
				.script( path )
				.wait(function() {
					_on_library_loaded();
				})
			;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Callback when GPT library is loaded
		 */
		function _on_library_loaded() {

			googletag.cmd.push( function(){
				$.event.trigger( 'GPT:libraryLoaded' );
			} );

			_listen_for_dfp_events();
			_enable_single_request();
			_set_targeting();
			_set_page_positions();
			_define_slots_for_page_positions();
			_display_page_ads();

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Bind to GPT events
		 */
		function _listen_for_dfp_events() {

			googletag.cmd.push(function() {

				googletag.pubads()
					.addEventListener('slotRenderEnded', function(event) {
						_slot_render_ended(event);
					})
				;

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
		 * Send targeting info defined in page config
		 *
		 * @todo
		 */
		function _set_targeting() {

			return;

			googletag.cmd.push(function() {

				var config = util.get_page_config(),
					targeting = config.targeting
				;

				// Set targeting
				if (typeof targeting !== 'undefined') {
					$.each( targeting, function( key, value ) {
						googletag.pubads().setTargeting(key, value);
					});
				}

			});

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _set_page_positions() {

			if ( admanager.util.is_mobile() ) {
				_set_mobile_page_positions();
			}
			else {
				_set_desktop_page_positions();
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
										'/' + account + '/' + cur_position.slot,
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
										'/' + account + '/' + cur_position.slot,
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

				$.event.trigger( 'GPT:slotsDefined' );

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
		 * _slot_render_ended - callback after unit is rendered
		 *
		 * @see https://developers.google.com/doubleclick-gpt/reference
		 * @param object unit
		 */
		function _slot_render_ended( unit ) {

			var unit_name = unit.slot.getAdUnitPath().replace('/' + account + '/', '')
			;

			debug( unit_name );

			$.event.trigger( 'GPT:adUnitRendered', {
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
		 * _get_defined_slot
		 *
		 * @param string name
		 * @return object defined_slot
		 */
		function _get_defined_slot( name ) {

			var defined_slot = null
			;

			$.each( defined_slots, function( i, slot ) {
				var unit_name = slot.getAdUnitPath().replace('/' + account + '/', '')
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

			$.each( defined_slots, function( index, slot ) {

				var unit_name = slot.getAdUnitPath().replace('/' + account + '/', '')
				;

				if ( unit_name === name ) delete defined_slots[index];

			} );

		}

		return {
			init                : init,
			get_ad_info         : get_ad_info,
			display_slot        : display_slot,
			remove_defined_slot : remove_defined_slot
		};

	}( $ ) );

	return app;

}( admanager || {}, jQuery ) );

admanager.bootstrap.register( admanager.manager.init );