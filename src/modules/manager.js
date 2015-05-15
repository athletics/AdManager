/**
 *		Name: Ad Manager
 *
 *		Requires: app, app.util, app.insertion, jQuery
 */

var admanager = ( function ( app, $ ) {

	app.manager = ( function ( $ ) {

		var _name = 'Manager',
			debug = null,
			_defined_slots = [],
			_page_positions = [],
			_inventory = [],
			_account = null,
			_defaults = {
				ad_class:             'app_ad_unit',      // Outer ad wrap
				ad_unit_target_class: 'app_unit_target',  // Inner ad wrap
				ad_selector:          ''                  // Leave blank
			}
		;

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _init() {

			debug = admanager.util.debug ? admanager.util.debug : function () {};
			debug( _name + ': initialized' );

			if ( ! _is_enabled() ) return app;

			_defaults.ad_selector = '.' + _defaults.ad_class;
			_inventory = _get_inventory();
			_account = app.config.account;
			_bind_handlers();
			_load_library();

			return app;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Bind to custom jQuery events
		 */
		function _bind_handlers() {

			$( document )
				.on( 'GPT:unitsInserted', function () {
					debug( _name + ': GPT:unitsInserted' );
				} )
				.on( 'GPT:libraryLoaded', function () {
					debug( _name + ': GPT:libraryLoaded' );
					_init_sequence();
				} )
				.on( 'GPT:slotsDefined', function () {
					debug( _name + ': GPT:slotsDefined' );
					_display_page_ads();
				} )
			;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _init_sequence() {

			$.event.trigger( 'GPT:initSequence' );

			_listen_for_dfp_events();
			_enable_single_request();
			_set_targeting();
			_set_page_positions();
			_define_slots_for_page_positions();

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Get Inventory
		 *
		 * @return object
		 */
		function _get_inventory() {

			return _get_available_sizes( _inventory_clean_types( app.config.inventory ) );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Add default unit type if not set
		 *
		 * @param array _inventory
		 * @return array _inventory
		 */
		function _inventory_clean_types( _inventory ) {

			for ( var i = 0; i < _inventory.length; i++ ) {
				if ( typeof _inventory[ i ].type !== 'undefined' ) continue;
				_inventory[ i ].type = 'default';
			}
			return _inventory;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Remove sizes from inventory that will not display properly
		 *
		 * @param array _inventory
		 * @return array _inventory
		 */
		function _get_available_sizes( _inventory ) {

			var width = ( window.innerWidth > 0 ) ? window.innerWidth : screen.width;

			if ( width > 1024 ) return _inventory;

			if ( width >= 768 && width <= 1024 ) {

				var max = 980;

				for ( var i = 0; i < _inventory.length; i++ ) {
					var sizes_to_remove = [];
					for ( var j = 0; j < _inventory[ i ].sizes.length; j++ ) {
						if ( _inventory[ i ].sizes[ j ][0] > max ) {
							sizes_to_remove.push( _inventory[ i ].sizes[ j ] );
						}
					}
					_inventory[ i ].sizes = app.util.difference( _inventory[ i ].sizes, sizes_to_remove );
				}
			}

			return _inventory;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Request GPT library
		 */
		function _load_library() {

			// debug( _name + ': _load_library()' );

			var googletag,
					gads,
					useSSL,
					node,
					readyStateLoaded = false
			;

			window.googletag = window.googletag || {};
			googletag = window.googletag;
			googletag.cmd = googletag.cmd || [];
			gads = document.createElement( "script" );
			gads.async = true;
			gads.type = "text/javascript";
			useSSL = "https:" == document.location.protocol;
			gads.src = ( useSSL ? "https:" : "http:" ) + "//www.googletagservices.com/tag/js/gpt.js";
			if ( gads.addEventListener ) {
				gads.addEventListener( "load", _on_library_loaded, false );
			} else if ( gads.readyState ) {
				gads.onreadystatechange = function () { // Legacy IE
					if ( ! readyStateLoaded ) {
						readyStateLoaded = true;
						_on_library_loaded();
					}
				};
			}
			node = document.getElementsByTagName( "script" )[0];
			node.parentNode.insertBefore( gads, node );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Callback when GPT library is loaded
		 */
		function _on_library_loaded() {

			googletag.cmd.push( function () {
				$.event.trigger( 'GPT:libraryLoaded' );
			} );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Bind to GPT events
		 */
		function _listen_for_dfp_events() {

			googletag.cmd.push( function () {
				googletag.pubads()
					.addEventListener( 'slotRenderEnded', function ( event ) {
						_slot_render_ended( event );
					} )
				;
			} );

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

			googletag.cmd.push( function () {
				// https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_collapseEmptyDivs
				googletag.pubads().collapseEmptyDivs();

				// https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_enableSingleRequest
				googletag.pubads().enableSingleRequest();

				// https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_disableInitialLoad
				googletag.pubads().disableInitialLoad();
			} );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Send Targeting
		 * Defined in Page Config
		 */
		function _set_targeting() {

			googletag.cmd.push( function () {

				var page_config = _get_config(),
					targeting = page_config.targeting
				;

				// Set targeting
				if ( typeof targeting !== 'undefined' ) {
					$.each( targeting, function ( key, value ) {
						googletag.pubads().setTargeting( key, value );
					} );
				}

			} );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Set Page Positions
		 */
		function _set_page_positions() {

			var client_type = typeof app.config.client_type !== 'undefined' ? app.config.client_type : false,
				$context = app.util.get_context(),
				$units = null,
				selector = _defaults.ad_selector
			;

			if ( client_type !== false ) {
				selector += '[data-client-type="' + client_type + '"]';
			}

			$units = $context.find( selector );

			$units.each( function () {
				var id = $( this ).data( 'id' );
				_page_positions.push( id );
			} );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Define Slots for Page Positions
		 */
		function _define_slots_for_page_positions() {

			googletag.cmd.push( function () {

				var current_position = null,
					$context = app.util.get_context(),
					$unit,
					$unit_target;

				for ( var i = 0; i < _page_positions.length; i++ ) {

					_increment_ad_slot( _page_positions[ i ] );
					current_position = _get_ad_info( _page_positions[ i ] );

					if ( typeof current_position.id == 'undefined' ) continue;

					// find the empty container div on the page. we
					// will dynamically instantiate the unique ad unit.
					$unit = $context.find( _defaults.ad_selector + '[data-id="' + current_position.id + '"]' );
					$unit_target = $( '<div/>' );

					if ( $unit.length < 1 ) continue;

					// generate new div
					$unit_target.addClass( _defaults.ad_unit_target_class );
					$unit_target.attr( 'id', current_position.id_name );
					$unit.append( $unit_target );

					// activate
					$unit.addClass( 'active' );

					_defined_slots[ i ] = googletag
						.defineSlot( 
							'/' + _account + '/' + current_position.slot,
							current_position.sizes,
							current_position.id_name
						 )
						.addService( googletag.pubads() )
					;

				}

				// Enables GPT services for defined slots
				googletag.enableServices();

				$.event.trigger( 'GPT:slotsDefined' );

			} );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _display_page_ads() {

			googletag.cmd.push( function () {

				// Fetch and display ads for defined_slots
				googletag.pubads().refresh( _defined_slots );

				// lastly, run display code
				for ( var n = 0; n < _page_positions.length; n++ ) {

					current_position = _get_ad_info( _page_positions[n] );

					if ( $( '#' + current_position.id_name ).length > 0 ) {
						googletag.display( current_position.id_name );
					}

				}

			} );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * _slot_render_ended - callback after unit is rendered
		 *
		 * @see https://developers.google.com/doubleclick-gpt/reference
		 * @param object unit
		 */
		function _slot_render_ended( unit ) {

			var unit_name = unit.slot.getAdUnitPath().replace( '/' + _account + '/', '' ),
				ad_info = _get_ad_info( unit_name )
			;

			$.event.trigger( 'GPT:adUnitRendered', {
				name: unit_name,
				id: ad_info.id,
				size: unit.size,
				isEmpty: unit.isEmpty,
				creativeId: unit.creativeId,
				lineItemId: unit.lineItemId,
				serviceName: unit.serviceName
			} );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Increment Ad Slot
		 *
		 * @param string unit
		 */
		function _increment_ad_slot( unit ) {

			for ( var i = 0; i < _inventory.length; i++ ) {
				if ( _inventory[ i ].id !== unit && _inventory[ i ].slot !== unit ) continue;

				if ( typeof _inventory[ i ].iteration == 'undefined' ) _inventory[ i ].iteration = 0;

				// increment
				_inventory[ i ].iteration = _inventory[ i ].iteration + 1;

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
		function _get_ad_info( unit ) {

			var return_object = {};

			for ( var i = 0; i < _inventory.length; i++ ) {
				if ( _inventory[ i ].id !== unit && _inventory[ i ].slot !== unit ) continue;

				// build return object
				return_object = _inventory[ i ];

				// determine the object's id_name
				if ( typeof return_object.use_iterator !== 'undefined' && ! return_object.use_iterator ) {
					// don't use the iterator
					return_object.id_name = return_object.id;
				} else {
					// use the iterator
					return_object.id_name = return_object.id + '_' + return_object.iteration;
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

			var defined_slot = null;

			$.each( _defined_slots, function ( i, slot ) {
				var unit_name = slot.getAdUnitPath().replace( '/' + _account + '/', '' );
				if ( unit_name === name ) {
					defined_slot = slot;
					return false;
				}
			} );

			return defined_slot;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * _display_slot
		 *
		 * @param string unit [type or slot]
		 */
		function _display_slot( unit ) {

			googletag.cmd.push( function () {
				var position = _get_ad_info( unit ),
					slot = _get_defined_slot( position.slot )
				;
				googletag.pubads().refresh( [slot] );
				googletag.display( position.id_name );
				_remove_defined_slot( position.slot );
			} );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * _remove_defined_slot
		 *
		 * @param string name
		 * @return object defined_slot
		 */
		function _remove_defined_slot( name ) {

			$.each( _defined_slots, function ( index, slot ) {
				var unit_name = slot.getAdUnitPath().replace( '/' + _account + '/', '' );
				if ( unit_name === name ) _defined_slots.remove( index );
			} );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _get_dynamic_inventory() {

			var dynamic_items = [],
				type = typeof app.config.client_type !== 'undefined' ? app.config.client_type : false,
				local_context;

			$.each( _inventory, function ( index, position ) {
				if ( ( typeof position.dynamic !== 'undefined' ) && ( position.dynamic === true ) ) {
					if ( ! type || type === position.type ) {
						dynamic_items.push( position );
						local_context = position.local_context;
					}
				}
			} );

			return {
				dynamic_items: dynamic_items,
				local_context: local_context
			};

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _get_config() {
			return app.config;
		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Check if the Ad Manager is enabled for page
		 *
		 * @return bool
		 */
		function _is_enabled() {

			var $context = app.util.get_context(),
				attr_name = 'page-ad-config'
			;

			if ( typeof app.config.page_config_attr !== 'undefined' ) {
				attr_name = app.config.page_config_attr;
			}

			app.config = app.util.import_config( {
				$context: $context,
				attr_name: attr_name,
				exist_config: app.config
			} );

			if ( typeof app.config.enabled === 'undefined' ) return true;

			return app.config.enabled;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Empties all ads in a given context
		 *
		 * @param object options.$context
		 * @param bool   options.remove_container
		 */
		function _empty_ads( options ) {

			var $context = options.$context,
				remove_container = options.remove_container || false;

			$context.find( _defaults.ad_selector ).empty();

			if ( remove_container ) {
				$context.find( _defaults.ad_selector ).remove();
			}

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _get_defaults() {
			return _defaults;
		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		return {
			init                  : _init,
			is_enabled            : _is_enabled,
			get_config            : _get_config,
			get_defaults          : _get_defaults,
			get_ad_info           : _get_ad_info,
			display_slot          : _display_slot,
			remove_defined_slot   : _remove_defined_slot,
			get_dynamic_inventory : _get_dynamic_inventory,
			init_sequence         : _init_sequence,
			empty_ads             : _empty_ads
		};

	}( $ ) );

	return app;

}( admanager || {}, jQuery ) );