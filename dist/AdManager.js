/*!
 * admanager - A JavaScipt library for interacting with Google DFP.
 *
 * @author Athletics - http://athleticsnyc.com
 * @see https://github.com/athletics/AdManager
 * @version 0.4.5
 *//**
 * Shared utilities for debugging and array manipulation.
 */
( function ( window, factory ) {

    'use strict';

    if ( typeof define === 'function' && define.amd ) {

        define( 'src/Util',[
            'jquery'
        ], factory );

    } else if ( typeof exports === 'object' ) {

        module.exports = factory(
            require( 'jquery' )
        );

    } else {

        window.AdManager = window.AdManager || {};

        window.AdManager.Util = factory(
            window.jQuery
        );

    }

} ( window, function ( $ ) {

    'use strict';

    /**
     * A console.log wrapper with the correct line numbers.
     *
     * @see    https://gist.github.com/bgrins/5108712
     * @see    https://developer.mozilla.org/en-US/docs/Web/API/Console/log
     * @param  {Mixed}
     * @return {String}
     */
    var debug = function () {

        if ( typeof console !== 'object' || ! console.log ) {
            return;
        }

        return console.log.bind( console );

    } ();

    /**
     * Get the difference of two arrays.
     *
     * @param  {Array} array
     * @param  {Array} values
     * @return {Array} diff
     */
    function difference( array, values ) {

        var diff = [];

        $.grep( array, function ( element ) {
            if ( $.inArray( element, values ) === -1 ) {
                diff.push( element );
            }
        } );

        return diff;

    }

    /**
     * Remove array value by key.
     *
     * @param  {Array}   array
     * @param  {Integer} key
     * @return {Array}   array
     */
    function removeByKey( array, key ) {

        array = $.grep( array, function ( element, index ) {
            return index !== key;
        } );

        return array;

    }

    //////////////////////////////////////////////////////////////////////////////////////

    return {
        debug:       debug,
        difference:  difference,
        removeByKey: removeByKey
    };

} ) );
/**
 * Import, get, and set configuration values.
 *
 * @todo  Initialization should die when no valid account or inventory.
 * @todo  Add optional dynamically-determined context for use in infinite scroll.
 */
( function ( window, factory ) {

    'use strict';

    if ( typeof define === 'function' && define.amd ) {

        define( 'src/Config',[
            'jquery',
            './Util'
        ], factory );

    } else if ( typeof exports === 'object' ) {

        module.exports = factory(
            require( 'jquery' ),
            require( './Util' )
        );

    } else {

        window.AdManager = window.AdManager || {};

        window.AdManager.Config = factory(
            window.jQuery,
            window.AdManager.Util
        );

    }

} ( window, function ( $, Util ) {

    'use strict';

    var debugEnabled = true,
        debug = debugEnabled ? Util.debug : function () {},
        config = {},
        defaults = {
            account:             null,               // DFP account ID
            adClass:             'app_ad_unit',      // Outer ad wrap
            adUnitTargetClass:   'app_unit_target',  // Inner ad wrap
            autoload:            true,               // Start the qualification process automatically
            clientType:          false,              // Used to filter inventory
            context:             'body',             // Selector for ad filling container
            enabled:             true,               // Turn off ads
            insertionEnabled:    false,              // Enable dynamic insertion
            insertion:           {
                pxBetweenUnits:  800,                // Minimum space b/w dynamically inserted units
                adHeightLimit:   1000,               // Max-height for dynamic units
                insertExclusion: [                   // Skip these elements when inserting units
                    'img',
                    'iframe',
                    'video',
                    'audio',
                    '.video',
                    '.audio',
                    '[data-ad-unit]'
                ]
            },
            inventory: [],                           // Inventory of ad units
            pageConfigAttr: false,                   // Selector for dynamic config import
            targeting: []                            // Key value pairs to send with DFP request
        };

    //////////////////////////////////////////////////////////////////////////////////////

    /**
     * Merge passed config with defaults.
     *
     * @param  {Object} newConfig
     */
    function init( newConfig ) {

        config = $.extend( defaults, newConfig );

    }

    /**
     * Set config value by key.
     *
     * @param  {String} key
     * @param  {Mixed}  value
     * @return {Object} config
     */
    function set( key, value ) {

        return setConfigValue( config, key, value );

    }

    /**
     * Get config value by key.
     * Pass no key to get entire config object.
     *
     * @param  {String|Null} key Optional.
     * @return {Mixed}
     */
    function get( key ) {

        key = key || false;

        if ( ! key ) {
            return config;
        }

        // get selector from className
        // use with `adClass`, `adUnitTargetClass`, etc.
        var index = key.indexOf( 'Selector', this.length - 'Selector'.length );

        if ( index !== -1 ) {
            key = key.slice( 0, index ) + 'Class';
            return '.' + getConfigValue( config, key ).replace( /^\./, '' );
        }

        return getConfigValue( config, key );

    }

    /**
     * Set config value.
     * Uses recursion to set nested values.
     *
     * @param  {Object} config
     * @param  {String} key
     * @param  {Mixed}  value
     * @return {Object} config
     */
    function setConfigValue( config, key, value ) {

        if ( typeof key === 'string' ) {
            key = key.split( '.' );
        }

        if ( key.length > 1 ) {
            setConfigValue( config[ key.shift() ], key, value );
        } else {
            config[ key[0] ] = value;
        }

        return config;

    }

    /**
     * Get config value.
     * Uses recursion to get nested values.
     *
     * @param  {Object} config
     * @param  {String} key
     * @return {Mixed}
     */
    function getConfigValue( config, key ) {

        if ( typeof key === 'string' ) {
            key = key.split( '.' );
        }

        if ( key.length > 1 ) {
            return getConfigValue( config[ key.shift() ], key );
        } else {
            return key[0] in config ? config[ key[0] ] : null;
        }

    }

    /**
     * Import JSON page config data from DOM.
     *
     * This imports inline JSON via data attribute
     * and extends an existing config with it.
     *
     * @todo   Reenable usage in the project.
     *         Ascertain the correct place to use.
     *
     * @param  {Object} options.$context
     * @param  {String} options.attrName
     * @return {Object}
     */
    function importConfig( options ) {

        var $context = options.$context,
            attrName = options.attrName,
            existConfig = options.existConfig,
            selector,
            newConfig,
            data = {};

        selector = '*[data-' + attrName + ']';
        newConfig = $.extend( {}, existConfig );
        data = $context.find( selector ).data( attrName );

        if ( typeof newConfig === 'object' ) {
            newConfig = $.extend( newConfig, data );
        }

        return newConfig;

    }

    //////////////////////////////////////////////////////////////////////////////////////

    return {
        init:         init,
        set:          set,
        get:          get,
        importConfig: importConfig
    };

} ) );
/**
 * Get, filter, and augment the ad unit inventory.
 */
( function ( window, factory ) {

    'use strict';

    if ( typeof define === 'function' && define.amd ) {

        define( 'src/Inventory',[
            'jquery',
            './Util',
            './Config'
        ], function ( $, Util, Config ) {
            return factory( window, $, Util, Config );
        } );

    } else if ( typeof exports === 'object' ) {

        module.exports = factory(
            window,
            require( 'jquery' ),
            require( './Util' ),
            require( './Config' )
        );

    } else {

        window.AdManager = window.AdManager || {};

        window.AdManager.Inventory = factory(
            window,
            window.jQuery,
            window.AdManager.Util,
            window.AdManager.Config
        );

    }

} ( window, function ( window, $, Util, Config ) {

    'use strict';

    var debugEnabled = true,
        debug = debugEnabled ? Util.debug : function () {};

    //////////////////////////////////////////////////////////////////////////////////////

    /**
     * Get sanitized inventory.
     *
     * @return {Object}
     */
    function getInventory() {

        return getAvailableSizes( inventoryCleanTypes( Config.get( 'inventory' ) ) );

    }

    /**
     * Add default unit type if not set.
     *
     * @todo   Should this edit the inventory in the Config?
     *
     * @param  {Array} inventory
     * @return {Array} inventory
     */
    function inventoryCleanTypes( inventory ) {

        for ( var i = 0; i < inventory.length; i++ ) {

            if ( typeof inventory[ i ].type !== 'undefined' ) {
                continue;
            }

            inventory[ i ].type = 'default';

        }

        return inventory;

    }

    /**
     * Remove sizes from inventory that will not display properly.
     *
     * @todo   Clarify what this function is limiting, and remove the
     *         hard limits set to use desktop width for tablets.
     *
     * @param  {Array} inventory
     * @return {Array} inventory
     */
    function getAvailableSizes( inventory ) {

        var width = window.innerWidth > 0 ? window.innerWidth : screen.width;

        if ( width > 1024 ) {
            return inventory;
        }

        if ( width >= 768 && width <= 1024 ) {

            var max = 980;

            for ( var i = 0; i < inventory.length; i++ ) {
                var sizesToRemove = [];
                for ( var j = 0; j < inventory[ i ].sizes.length; j++ ) {
                    if ( inventory[ i ].sizes[ j ][0] > max ) {
                        sizesToRemove.push( inventory[ i ].sizes[ j ] );
                    }
                }
                inventory[ i ].sizes = Util.difference( inventory[ i ].sizes, sizesToRemove );
            }
        }

        return inventory;

    }

    /**
     * Remove slot by slot name.
     * Relies on the `googletag` slot object.
     *
     * @param  {Object} definedSlots
     * @param  {String} slotName
     * @return {Object} definedSlots
     */
    function removeDefinedSlot( definedSlots, slotName ) {

        for ( var i = 0; i < definedSlots.length; i++ ) {

            var unitName = definedSlots[ i ].getAdUnitPath()
                .replace( '/' + Config.get( 'account' ) + '/', '' );

            if ( unitName !== slotName ) {
                continue;
            }

            definedSlots = Util.removeByKey( definedSlots, i );

            break;

        }

        return definedSlots;

    }

    /**
     * Get ad units for dynamic insertion.
     *
     * @todo   Replace `$.each` with `$.grep`.
     *
     * @return {Object}
     */
    function getDynamicInventory() {

        var dynamicItems = [],
            type = Config.get( 'clientType' ),
            inventory = getInventory(),
            localContext;

        $.each( inventory, function ( index, position ) {
            if ( ( typeof position.dynamic !== 'undefined' ) && ( position.dynamic === true ) ) {
                if ( ! type || type === position.type ) {
                    dynamicItems.push( position );
                    localContext = position.localContext;
                }
            }
        } );

        return {
            dynamicItems: dynamicItems,
            localContext: localContext
        };

    }

    /**
     * Get info about an ad unit by slot name.
     *
     * @param  {String} slotName
     * @return {Object} adInfo
     */
    function getAdInfo( slotName ) {

        var adInfo = {},
            inventory = getInventory();

        for ( var i = 0; i < inventory.length; i++ ) {
            if ( inventory[ i ].slot !== slotName ) {
                continue;
            }

            adInfo = inventory[ i ];

            break;
        }

        return adInfo;

    }

    /**
     * Get shortest possible height for unit.
     *
     * @todo   Consider abstracting shortest and tallest
     *         functions into one.
     *
     * @param  {Object}  unit
     * @return {Integer} shortest
     */
    function shortestAvailable( unit ) {

        var shortest = 0;

        $.each( unit.sizes, function ( index, sizes ) {
            if ( shortest === 0 ) {
                shortest = sizes[1];
            } else if ( sizes[1] < shortest ) {
                shortest = sizes[1];
            }
        } );

        return shortest;

    }

    /**
     * Get tallest possible height for unit.
     *
     * @todo   Consider abstracting shortest and tallest
     *         functions into one.
     *
     * @param  {Object}  unit
     * @return {Integer} tallest
     */
    function tallestAvailable( unit ) {

        var tallest = 0;

        $.each( unit.sizes, function ( index, sizes ) {
            if ( sizes[1] > tallest ) {
                tallest = sizes[1];
            }
        } );

        return tallest;

    }

    /**
     * Limit ad unit sizes.
     * Removes heights too large for context.
     *
     * @param  {Object}  unit
     * @param  {Integer} limit
     * @return {Object}  unit
     */
    function limitUnitHeight( unit, limit ) {

        $.each( unit.sizes, function ( index, sizes ) {
            if ( sizes[1] <= limit ) {
                return true;
            }
            unit.sizes = Util.removeByKey( unit.sizes, index );
        } );

        return unit;

    }

    /**
     * Finds the unit by slot name and returns its type.
     * Type is used to filter the inventory (like desktop and mobile).
     *
     * @param  {String} slotName
     * @return {String} type
     */
    function getUnitType( slotName ) {

        var type = 'default';

        $.each( getInventory(), function ( index, unit ) {

            if ( unit.slot !== slotName ) {
                return true;
            }

            type = unit.type;

            return false;

        } );

        return type;

    }

    //////////////////////////////////////////////////////////////////////////////////////

    return {
        getInventory:        getInventory,
        getAdInfo:           getAdInfo,
        getDynamicInventory: getDynamicInventory,
        shortestAvailable:   shortestAvailable,
        tallestAvailable:    tallestAvailable,
        limitUnitHeight:     limitUnitHeight,
        getUnitType:         getUnitType
    };

} ) );
/**
 * Handles the request and display of ads.
 *
 * @todo  Allow for multiple inits, only bind events
 *        and load library once.
 */
( function ( window, factory ) {

    'use strict';

    if ( typeof define === 'function' && define.amd ) {

        define( 'src/Manager',[
            'jquery',
            './Util',
            './Config',
            './Inventory'
        ], function ( $, Util, Config, Inventory ) {
            return factory( window, $, Util, Config, Inventory );
        } );

    } else if ( typeof exports === 'object' ) {

        module.exports = factory(
            window,
            require( 'jquery' ),
            require( './Util' ),
            require( './Config' ),
            require( './Inventory' )
        );

    } else {

        window.AdManager = window.AdManager || {};

        window.AdManager.Manager = factory(
            window,
            window.jQuery,
            window.AdManager.Util,
            window.AdManager.Config,
            window.AdManager.Inventory
        );

    }

} ( window, function ( window, $, Util, Config, Inventory ) {

    'use strict';

    var debugEnabled = true,
        debug = debugEnabled ? Util.debug : function () {},
        loaded = false,
        definedSlots = [],
        pagePositions = [],
        inventory = [],
        account = null,
        adSelector = '[data-ad-unit]';

    //////////////////////////////////////////////////////////////////////////////////////

    /**
     * Add event listeners and get the DFP library.
     */
    function init() {

        if ( ! Config.get( 'enabled' ) ) {
            return;
        }

        inventory = Inventory.getInventory();
        account = Config.get( 'account' );

        addEventListeners();
        loadLibrary();

    }

    function addEventListeners() {

        $( document )
            .on( 'AdManager:libraryLoaded', libraryLoaded )
            .on( 'AdManager:initSequence', initSequence )
            .on( 'AdManager:slotsDefined', displayPageAds )
            .on( 'AdManager:softRefresh', softRefresh );

    }

    /**
     * Library loaded callback.
     *
     * @fires AdManager:initSequence
     */
    function libraryLoaded() {

        loaded = true;

        listenForDfpEvents();
        setupPubAdsService();

        if ( Config.get( 'autoload' ) ) {
            $.event.trigger( 'AdManager:initSequence' );
        }

    }

    /**
     * Start qualification sequence.
     */
    function initSequence() {

        setTargeting();
        setPagePositions();
        defineSlotsForPagePositions();

    }

    /**
     * Asynchronously load the DFP library.
     * Calls ready event when fully loaded.
     */
    function loadLibrary() {

        if ( loaded ) {
            return onLibraryLoaded();
        }

        var googletag,
            gads,
            useSSL,
            node,
            readyStateLoaded = false
        ;

        window.googletag = window.googletag || {};
        window.googletag.cmd = window.googletag.cmd || [];

        gads = document.createElement( 'script' );
        gads.async = true;
        gads.type = 'text/javascript';
        useSSL = 'https:' == document.location.protocol;
        gads.src = ( useSSL ? 'https:' : 'http:' ) + '//www.googletagservices.com/tag/js/gpt.js';
        if ( gads.addEventListener ) {
            gads.addEventListener( 'load', onLibraryLoaded, false );
        } else if ( gads.readyState ) {
            gads.onreadystatechange = function () {
                // Legacy IE
                if ( ! readyStateLoaded ) {
                    readyStateLoaded = true;
                    onLibraryLoaded();
                }
            };
        }
        node = document.getElementsByTagName( 'script' )[0];
        node.parentNode.insertBefore( gads, node );

    }

    /**
     * Callback when GPT library is loaded.
     *
     * @fires AdManager:libraryLoaded
     */
    function onLibraryLoaded() {

        googletag.cmd.push( function () {
            $.event.trigger( 'AdManager:libraryLoaded' );
        } );

    }

    /**
     * Add a listener for the GPT `slotRenderEnded` event.
     */
    function listenForDfpEvents() {

        googletag.cmd.push( function () {
            googletag.pubads().addEventListener( 'slotRenderEnded', onSlotRenderEnded );
        } );

    }

    /**
     * Enable batched SRA calls for requesting multiple ads at once.
     * Disable initial load of units, wait for display call.
     */
    function setupPubAdsService() {

        googletag.cmd.push( function () {

            // https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_collapseEmptyDivs
            googletag.pubads().collapseEmptyDivs();

            // https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_enableSingleRequest
            googletag.pubads().enableSingleRequest();

            // https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_disableInitialLoad
            googletag.pubads().disableInitialLoad();

        } );

    }

    /**
     * Send key-value targeting in ad request.
     */
    function setTargeting() {

        googletag.cmd.push( function () {

            var targeting = Config.get( 'targeting' );

            if ( ! targeting.length ) {
                return;
            }

            $.each( targeting, function ( key, value ) {
                googletag.pubads().setTargeting( key, value );
            } );

        } );

    }

    /**
     * Looks for ad unit markup in the context to build a list
     * of units to request.
     */
    function setPagePositions() {

        var clientType = Config.get( 'clientType' ),
            $context = $( Config.get( 'context' ) ),
            $units = null,
            selector = adSelector
        ;

        if ( clientType !== false ) {
            selector += '[data-client-type="' + clientType + '"]';
        }

        $units = $context.find( selector );

        $units.each( function () {
            pagePositions.push( $( this ).data( 'ad-unit' ) );
        } );

    }

    /**
     * Define slots for page positions.
     *
     * @fires AdManager:slotsDefined
     */
    function defineSlotsForPagePositions() {

        googletag.cmd.push( function () {

            var undefinedPagePositions = [];

            if ( $.isEmptyObject( definedSlots ) ) {
                undefinedPagePositions = pagePositions;
            } else {
                var definedSlotNames = $.map( definedSlots, function ( slot, index ) {
                    return convertSlotName( slot.getAdUnitPath(), 'local' );
                } );

                undefinedPagePositions = $.grep( pagePositions, function ( slotName, index ) {

                    if ( ! $.inArray( slotName, definedSlotNames ) ) {
                        return false;
                    }

                    return true;

                } );
            }

            definedSlots = $.map( undefinedPagePositions, function ( slotName, index ) {

                var position = Inventory.getAdInfo( slotName );

                return googletag
                    .defineSlot(
                        convertSlotName( slotName, 'dfp' ),
                        position.sizes,
                        position.slot
                     )
                    .addService( googletag.pubads() );

            } );

            // Enables GPT services for defined slots.
            googletag.enableServices();

            insertUnitTargets();

            $.event.trigger( 'AdManager:slotsDefined' );

        } );

    }

    /**
     * Creates the containers for the DFP to fill.
     * DFP wants ids.
     */
    function insertUnitTargets() {

        var $context = $( Config.get( 'context' ) ),
            notInserted = [];

        notInserted = $.grep( pagePositions, function ( slotName, index ) {
            return document.getElementById( slotName ) === null;
        } );

        $.each( notInserted, function ( index, slotName ) {

            $context.find( '[data-ad-unit="' + slotName + '"]' )
                .addClass( 'initialized' )
                .append( $( '<div />', {
                    id: slotName,
                    addClass: 'ad-unit-target'
                } ) );

        } );

    }

    /**
     * Fetch and display the current page ads.
     */
    function displayPageAds() {

        googletag.cmd.push( function () {

            var pageSlots = $.grep( definedSlots, function ( slot, index ) {

                var slotName = convertSlotName( slot.getAdUnitPath(), 'local' );

                if ( ! $.inArray( slotName, pagePositions ) ) {
                    return false;
                }

                return true;

            } );

            googletag.pubads().refresh( pageSlots );

            $.each( pagePositions, function ( index, slotName ) {

                googletag.display( slotName );

            } );

        } );

    }

    /**
     * Callback from DFP rendered event.
     *
     * @fires AdManager:adUnitRendered
     * @see   https://developers.google.com/doubleclick-gpt/reference
     *
     * @param {Object} unit
     */
    function onSlotRenderEnded( unit ) {

        var slotName = convertSlotName( unit.slot.getAdUnitPath(), 'local' );

        $.event.trigger( 'AdManager:adUnitRendered', {
            name:        slotName,
            size:        unit.size,
            isEmpty:     unit.isEmpty,
            creativeId:  unit.creativeId,
            lineItemId:  unit.lineItemId,
            serviceName: unit.serviceName
        } );

    }

    /**
     * Get defined slot by name.
     *
     * @todo   Use `$.grep` instead of `$.each`.
     *
     * @param  {String} slotName
     * @return {Object} definedSlot
     */
    function getDefinedSlot( slotName ) {

        var definedSlot = null;

        $.each( definedSlots, function ( i, slot ) {
            var unitName = convertSlotName( slot.getAdUnitPath(), 'local' );
            if ( unitName === slotName ) {
                definedSlot = slot;
                return false;
            }
        } );

        return definedSlot;

    }

    /**
     * Display slot by ID or slot.
     * Separate display call from `displayPageAds()`.
     *
     * @param {String} slotName
     */
    function displaySlot( slotName ) {

        googletag.cmd.push( function () {

            var slot = getDefinedSlot( slotName );

            googletag.pubads().refresh( [ slot ] );
            googletag.display( slotName );

            // @todo This seems wrong. We want to keep the definition right?
            // Let's just remove the page position?
            // definedSlots = Inventory.removeDefinedSlot( definedSlots, slotName );

        } );

    }

    /**
     * Empties all ads in a given context.
     * Can be used to refresh ads on pushState.
     *
     * @param {Object}  options.$context
     * @param {Boolean} options.removeContainer
     */
    function emptyAds( options ) {

        var $context = options.$context,
            removeContainer = options.removeContainer || false;

        $context.find( adSelector ).empty();

        if ( removeContainer ) {
            $context.find( adSelector ).remove();
        }

    }

    /**
     * Converts a slot name local to DFP or vice versa.
     *
     * @param  {String} slotName
     * @param  {String} format   'dfp' or 'local'.
     * @return {String}
     */
    function convertSlotName( slotName, format ) {

        if ( 'dfp' === format ) {
            return '/' + account + '/' + slotName;
        }

        return slotName.replace( '/' + account + '/', '' );

    }

    /**
     * Refresh slots.
     *
     * @param  {Object} event
     * @param  {Array}  units Optional. List of units to refresh.
     *                        Default is all.
     */
    function softRefresh( event, units ) {

        units = units || definedSlots;

        googletag.cmd.push( function () {
            googletag.pubads().refresh( units );
        } );

    }

    //////////////////////////////////////////////////////////////////////////////////////

    return {
        init:         init,
        displaySlot:  displaySlot,
        initSequence: initSequence,
        emptyAds:     emptyAds,
        softRefresh:  softRefresh
    };

} ) );
/**
 * Dynamically insert ad units into container.
 * Avoids ads and other problematic elements.
 *
 * @todo  Insert the previously inserted units in an infinite scroll context.
 * @todo  Update language to `node` and `nodes` everywhere for consistency.
 */
( function ( window, factory ) {

    'use strict';

    if ( typeof define === 'function' && define.amd ) {

        define( 'src/Insertion',[
            'jquery',
            './Util',
            './Config',
            './Inventory'
        ], factory );

    } else if ( typeof exports === 'object' ) {

        module.exports = factory(
            require( 'jquery' ),
            require( './Util' ),
            require( './Config' ),
            require( './Inventory' )
        );

    } else {

        window.AdManager = window.AdManager || {};

        window.AdManager.Insertion = factory(
            window.jQuery,
            window.AdManager.Util,
            window.AdManager.Config,
            window.AdManager.Inventory
        );

    }

} ( window, function ( $, Util, Config, Inventory ) {

    'use strict';

    var debugEnabled = true,
        debug = debugEnabled ? Util.debug : function () {},
        $context = null,
        $localContext = null,
        inContent = false,
        inventory = [],
        odd = true,
        localContext = null;

    //////////////////////////////////////////////////////////////////////////////////////

    /**
     * Bind init event listener.
     * Begins qualification procedure when the DOM is ready.
     *
     * @todo  Check if is already attached.
     */
    function init() {

        $( document ).on( 'AdManager:initSequence', qualifyContext );

    }

    /**
     * Sets the context jQuery object variable.
     *
     * @todo  Consider resetting variable to `null` when
     *        no longer needed in a pushState context.
     */
    function setContext() {

        $context = $( Config.get( 'context' ) );

    }

    /**
     * First qualify the DOM context where ads are to be inserted
     * to determine if insertion should proceed.
     */
    function qualifyContext() {

        var inventoryData = Inventory.getDynamicInventory();

        inventory = inventory.length ? inventory : inventoryData.dynamicItems;
        localContext = localContext ? localContext : inventoryData.localContext;

        // No dynamic inventory.
        if ( ! inventory.length ) {
            return broadcast();
        }

        setContext();
        $localContext = $context.find( localContext ).first();

        // Detect a local context.
        if ( $localContext.length ) {
            inContent = true;
        }

        // There is no insertion selector.
        if ( ! inContent ) {
            return broadcast();
        }

        insertAdUnits();

    }

    /**
     * Triggers ad units inserted event.
     *
     * @fires AdManager:unitsInserted
     */
    function broadcast() {

        $.event.trigger( 'AdManager:unitsInserted' );

    }

    /**
     * Is Insertion Enabled?
     *
     * @return {Boolean} Probably!
     */
    function isEnabled() {

        return Config.get( 'insertionEnabled' );

    }

    /**
     * Run in-content insertion.
     *
     * @todo  Does this need the extra check?
     */
    function insertAdUnits() {

        if ( inContent ) {
            denoteValidInsertions();
            insertPrimaryUnit();
            insertSecondaryUnits();
        }

        broadcast();

    }

    /**
     * Walks DOM elements in the local context.
     * Sets a data attribute if element is a valid insertion location.
     *
     * @todo  Potentially use `$.grep` to filter nodes for faster parsing.
     * @todo  Use `for` loop or `$.grep` to check for excluded elements.
     * @todo  Clarify `$prev` check.
     */
    function denoteValidInsertions() {

        var $nodes = $localContext.children(),
            excluded = Config.get( 'insertion.insertExclusion' )
        ;

        $nodes.each( function ( i ) {

            var $element = $( this ),
                $prev = i > 0 ? $nodes.eq( i - 1 ) : false,
                valid = true
            ;

            $.each( excluded, function ( index, item ) {
                if ( $element.is( item ) || $element.find( item ).length ) {
                    valid = false; // not valid
                    return false; // break loop
                }
            } );

            if ( $prev && $prev.is( 'p' ) && $prev.find( 'img' ).length === 1 ) {
                valid = false;
            }

            $element.attr( 'data-valid-location', valid );

        } );

    }

    /**
     * Check if node should be skipped.
     *
     * @param  {Object}  $element
     * @return {Boolean}
     */
    function isValidInsertionLocation( $element ) {

        return $.parseJSON( $element.data( 'valid-location' ) );

    }

    /**
     * Generate ad unit markup.
     * Creates DOM node to attach to the DOM.
     *
     * @see    https://vip.wordpress.com/2015/03/25/preventing-xss-in-javascript/
     * @param  {String}  slotName
     * @param  {Boolean} disableFloat
     * @return {Array}   $html
     */
    function adUnitMarkup( slotName, disableFloat ) {

        disableFloat = disableFloat || false;

        var type = Inventory.getUnitType( slotName ),
            alignment = odd ? 'odd' : 'even',
            $html = $( '<div />' );

        $html
            .addClass( Config.get( 'adClass' ) )
            .attr( 'data-ad-unit', slotName )
            .attr( 'data-client-type', type );

        if ( disableFloat ) {
            $html
                .addClass( 'disable-float' );
        } else {
            $html
                .addClass( 'in-content' )
                .addClass( alignment );
        }

        if ( ! disableFloat ) {
            odd = ! odd;
        }

        return $html;

    }

    /**
     * Inserts the primary unit, which must display above the fold.
     *
     * @todo  Clarify usage, make optional.
     */
    function insertPrimaryUnit() {

        var unit = getPrimaryUnit(),
            tallest = Inventory.tallestAvailable( unit ),
            shortest = Inventory.shortestAvailable( unit ),
            location = findInsertionLocation( {
                height: tallest,
                limit: Config.get( 'insertion.adHeightLimit' )
            } ),
            markup = null
        ;

        if ( ! location ) {
            location = findInsertionLocation( {
                height: shortest,
                limit: Config.get( 'insertion.adHeightLimit' ),
                force: true
            } );

            if ( ! location.disableFloat ) {
                // unset large sizes
                unit = Inventory.limitUnitHeight( unit, shortest );
            }
        }

        markup = adUnitMarkup( unit.slot, location.disableFloat );

        location.$insertBefore.before( markup );

    }

    /**
     * Inserts the secondary units, which can appear below the fold.
     */
    function insertSecondaryUnits() {

        $.each( inventory, function ( index, unit ) {

            var tallest = Inventory.tallestAvailable( unit ),
                location = findInsertionLocation( {
                    height: tallest
                } ),
                markup = null
            ;

            if ( ! location ) {
                return false;
            }

            markup = adUnitMarkup( unit.slot, location.disableFloat );
            location.$insertBefore.before( markup );

        } );

    }

    /**
     * Determines the primary unit, which is either denoted or the first listed.
     *
     * @todo   Use `$.grep` instead of `$.each` for optimization.
     * @return {Object|Boolean} primaryUnit False on failure.
     */
    function getPrimaryUnit() {

        var primaryUnit = false;

        $.each( inventory, function ( index, unit ) {

            if ( unit.primary ) {
                primaryUnit = unit;
                inventory = Util.removeByKey( inventory, index );
                return false;
            }

        } );

        if ( ! primaryUnit ) {
            primaryUnit = inventory[0];
            inventory = Util.removeByKey( inventory, 0 );
        }

        return primaryUnit;

    }

    /**
     * Find insertion location.
     * Considers distance between units and valid locations.
     *
     * @todo   Convert `$.each` to `for` loop.
     *         Use `continue` and `break` for clarity.
     *
     * @param  {Object}         options
     * @return {Object|Boolean}         False on failure.
     */
    function findInsertionLocation( options ) {

        options = options || {};

        var $nodes = getNodes(),
            nodeSearch = new NodeSearch( {
                $nodes: $nodes,
                force: options.force ? options.force : false,
                limit: options.limit ? options.limit : false,
                height: options.height
            } )
        ;

        if ( ! $nodes.length ) {
            return false;
        }

        // Loop through each node as necessary.
        // `verifyNode()` returns true when found.
        // Break the loop when true.
        $.each( $nodes, function ( i, node ) {

            return true !== nodeSearch.verifyNode( i, $( node ) ) ? true : false;

        } );

        if ( ! nodeSearch.locationFound ) {
            return false;
        }

        nodeSearch.markValidNodes();
        nodeSearch.setLastPosition();

        return {
            '$insertBefore': nodeSearch.$insertBefore,
            'disableFloat': nodeSearch.disableFloat
        };

    }

    /**
     * Search prototype used for determining insertion points.
     *
     * @param  {Object} options
     */
    function NodeSearch( options ) {

        this.totalHeight = 0;
        this.marginDifference = 40;
        this.inserted = [];
        this.$insertBefore = null;
        this.disableFloat = false;
        this.locationFound = false;
        this.validHeight = 0;
        this.exitLoop = false;
        this.height = options.height;
        this.force = options.force;
        this.limit = options.limit;
        this.$nodes = options.$nodes;
        this.lastPosition = 0;
        this.neededheight = options.height - this.marginDifference;

    }

    /**
     * Store the position of the last ad.
     */
    NodeSearch.prototype.setLastPosition = function () {

        this.lastPosition = this.$insertBefore.offset().top + this.neededheight;

    };

    /**
     * Mark nodes where insertion is valid.
     *
     * @todo  Consistently use `.attr()` or `.data()` when setting.
     *        jQuery does not need the DOM to change for data attributes.
     */
    NodeSearch.prototype.markValidNodes = function () {

        if ( ! this.inserted.length ) {
            return;
        }

        $.each( this.inserted, function ( index, item ) {
            $( item ).data( 'valid-location', false );
        } );

    };

    /**
     * Verify each node to find a suitable insertion point.
     *
     * @todo   Why is `this.exitLoop` set to `null`?
     * @todo   Document each step. Simplify if possible.
     *
     * @return {Boolean}
     */
    NodeSearch.prototype.verifyNode = function ( index, $node ) {

        var since = $node.offset().top - this.lastPosition,
            height = $node.outerHeight(),
            isLast = ( this.$nodes.length - 1 ) === index;

        this.totalHeight += height;

        if ( this.force && ( this.totalHeight >= this.limit || isLast ) ) {

            this.$insertBefore = $node;
            this.disableFloat = true;
            this.locationFound = true;
            this.exitLoop = true;

        } else if ( this.limit && ( this.totalHeight >= this.limit || isLast ) ) {

            this.locationFound = false;
            this.exitLoop = true;

        } else if ( isValidInsertionLocation( $node ) ) {

            this.validHeight += height;
            this.inserted.push( $node );

            if ( this.$insertBefore === null ) {
                this.$insertBefore = $node;
            }

            if ( this.validHeight >= this.neededheight ) {

                if ( ! this.limit && ( since < Config.get( 'insertion.pxBetweenUnits' ) ) ) {

                    this.validHeight = 0;
                    this.$insertBefore = null;

                }

                this.locationFound = true;
                this.exitLoop = true;

            }

        } else {

            this.validHeight = 0;
            this.$insertBefore = null;
            this.exitLoop = null;

        }

        return this.exitLoop;

    };

    /**
     * Is Element an Ad Unit?
     *
     * @param  {Mixed}   $el
     * @return {Boolean}
     */
    function isThisAnAd( $el ) {

        if ( ! $el ) {
            return false;
        }

        return $el.is( Config.get( 'adSelector' ) );

    }

    /**
     * Get next group of nodes to loop through.
     * Grabs the nodes after previous unit or all nodes if no previous.
     *
     * @return {Array} $nodes
     */
    function getNodes() {

        var $prevUnit = $localContext.find( Config.get( 'adSelector' ) ).last(),
            $nodes = null;

        if ( $prevUnit.length ) {
            $nodes = $prevUnit.nextAll( $localContext );
        } else {
            $nodes = $localContext.children();
        }

        return $nodes;

    }

    //////////////////////////////////////////////////////////////////////////////////////

    return {
        init: init
    };

} ) );
/**
 * Builds the AdManager prototype.
 * This file should be required directly for CommonJS usage.
 *
 * @see  http://requirejs.org/docs/commonjs.html#intro On CommonJS Transport.
 */
( function ( window, factory ) {

    'use strict';

    if ( typeof define === 'function' && define.amd ) {

        define( 'src/Index',[
            './Util',
            './Config',
            './Inventory',
            './Manager',
            './Insertion'
        ], factory );

    } else if ( typeof exports === 'object' ) {

        module.exports = factory(
            require( './Util' ),
            require( './Config' ),
            require( './Inventory' ),
            require( './Manager' ),
            require( './Insertion' )
        );

    } else {

        var _AdManager = window.AdManager;

        window.AdManager = factory(
            _AdManager.Util,
            _AdManager.Config,
            _AdManager.Inventory,
            _AdManager.Manager,
            _AdManager.Insertion
        );

    }

} ( window, function ( Util, Config, Inventory, Manager, Insertion ) {

    'use strict';

    /**
     * AdManager prototype.
     *
     * @param  {Object} newConfig Required configuration for initialization.
     * @throws {Error}            When no configuration is specified.
     */
    function AdManager( newConfig ) {

        newConfig = newConfig || false;

        if ( ! newConfig ) {
            throw new Error( 'Please provide a config.' );
        }

        Config.init( newConfig );
        Insertion.init();
        Manager.init();

    }

    var module = AdManager.prototype;

    module.Util = Util;
    module.Config = Config;
    module.Inventory = Inventory;
    module.Manager = Manager;
    module.Insertion = Insertion;

    return AdManager;

} ) );
