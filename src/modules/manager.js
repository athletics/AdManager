/**
 *		Name: Ad Manager
 *
 *		Requires: app, app.util, app.config, app.insertion, app.events, jQuery
 */

var admanager = ( function( app, $ ) {

	app.manager = ( function( $ ) {

		var _name = 'Manager',
			debug = null,

			defined_slots = [],
			page_positions = [],
			_inventory = [],
			account = null
		;

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function init() {

			debug = admanager.util.debug ? admanager.util.debug : function(){};
			debug( _name + ': initialized' );

			_inventory = _get_available_sizes( app.config.inventory );
			account = app.config.account;

			_listen_for_custom_events();

			return app;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Bind to custom jQuery events
		 */
		function _listen_for_custom_events() {

			$(document)
				.on('GPT:unitsInserted', function() {

					debug(_name + ': GPT:unitsInserted');

					_load_library();

				})
				.on('GPT:libraryLoaded', function() {

					debug(_name + ': GPT:libraryLoaded');

					_listen_for_dfp_events();
					_enable_single_request();
					_set_targeting();
					_set_page_positions();
					_define_slots_for_page_positions();

				})
				.on('GPT:slotsDefined', function() {

					debug(_name + ': GPT:slotsDefined');

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
		 * Send Targeting
		 * Defined in Page Config
		 */
		function _set_targeting() {

			googletag.cmd.push(function() {

				var page_config = app.util.page_config(),
					targeting = page_config.targeting
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

		/**
		 * Set Page Positions
		 */
		function _set_page_positions() {

			if ( ! app.util.is_mobile() ) {

				_set_desktop_page_positions();

			}

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Set Desktop Page Positions
		 */
		function _set_desktop_page_positions() {

			var $units = $('.app_ad_unit')
			;

			$units.each(function() {

				var $unit = $(this),
					type = $unit.data('type')
				;

				page_positions.push( type );

			});

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Define Slots for Page Positions
		 */
		function _define_slots_for_page_positions() {

			var current_position = null
			;

			googletag.cmd.push(function() {
				for (var i = 0; i < page_positions.length; i++) {

					_increment_ad_slot( page_positions[i] );

					current_position = get_ad_info( page_positions[i] );

					if ( typeof current_position.type == 'undefined' ) return;

					// find the empty container div on the page. we
					// will dynamically instantiate the unique ad unit.
					var $unit = $('.app_ad_unit[data-type="'+ current_position.type +'"]')
					;

					if ( $unit.length < 1 ) return;

					// generate new div
					$unit.html(
						'<div class="unit_target" id="'+ current_position.id_name +'"></div>'
					);

					// activate
					$unit.addClass('active');

					defined_slots[i] = googletag
						.defineSlot(
							'/' + account + '/' + current_position.slot,
							current_position.sizes,
							current_position.id_name
						)
						.addService(googletag.pubads())
					;

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

					current_position = get_ad_info( page_positions[n] );

					if ( $('#' + current_position.id_name).length > 0 ) {
						googletag.display(
							current_position.id_name
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

			$.event.trigger( 'GPT:adUnitRendered', {
				'name': unit_name,
				'size': unit.size
			} );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Increment Ad Slot
		 *
		 * @param string unit
		 */
		function _increment_ad_slot( unit ) {

			for (var i = 0; i < _inventory.length; i++) {
				if ( _inventory[i].type !== unit && _inventory[i].slot !== unit ) continue;

				if ( typeof _inventory[i].iteration == 'undefined' ) _inventory[i].iteration = 0;

				// increment
				_inventory[i].iteration = _inventory[i].iteration + 1;

				return;
			}

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Get Ad Unit Info
		 *
		 * @param string unit
		 * @return object
		 */
		function get_ad_info( unit ) {

			var return_object = {};

			for ( var i = 0; i < _inventory.length; i++ ) {
				if ( _inventory[i].type !== unit && _inventory[i].slot !== unit ) continue;

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

			return return_object;
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
		 * @param string unit [type or slot]
		 */
		function display_slot( unit ) {

			googletag.cmd.push(function() {

				var position = get_ad_info( unit ),
					slot = _get_defined_slot( position.slot )
				;

				googletag.pubads().refresh( [slot] );
				googletag.display( position.id_name );
				remove_defined_slot( position.slot );

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

				if ( unit_name === name ) defined_slots.remove(index);

			} );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function get_dynamic_inventory() {

			var dynamic_inventory = []
			;

			$.each( _inventory, function( index, position ) {

				if ( position.dynamic == true ) dynamic_inventory.push( position );

			} );

			return dynamic_inventory;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		return {
			init                  : init,
			get_ad_info           : get_ad_info,
			display_slot          : display_slot,
			remove_defined_slot   : remove_defined_slot,
			get_dynamic_inventory : get_dynamic_inventory
		};

	}( $ ) );

	return app;

}( admanager || {}, jQuery ) );