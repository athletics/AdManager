/**
 * Handles the request and display of ads.
 *
 * @todo  Allow for multiple inits, only bind events
 *        and load library once.
 */
( function ( window, factory ) {

    'use strict';

    if ( typeof define === 'function' && define.amd ) {

        define( [
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
        libraryLoaded = false,
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

        if ( ! isEnabled() ) {
            return;
        }

        inventory = Inventory.getInventory();
        account = Config.get( 'account' );

        bindHandlers();
        loadLibrary();

    }

    /**
     * Add event listeners for library events.
     */
    function bindHandlers() {

        $( document )
            .on( 'AdManager:unitsInserted', function ( event ) {} )
            .on( 'AdManager:libraryLoaded', function ( event ) {
                libraryLoaded = true;
                initSequence();
            } )
            .on( 'AdManager:slotsDefined', function ( event ) {
                displayPageAds();
            } );

    }

    /**
     * Start the sequence to loads ads.
     *
     * @todo  Separate initial load functions from request /
     *        load functions.
     * @todo  Consider using separate events.
     *
     * @fires AdManager:initSequence
     */
    function initSequence() {

        $.event.trigger( 'AdManager:initSequence' );

        listenForDfpEvents();
        setupPubAdsService();

        setTargeting();
        setPagePositions();
        defineSlotsForPagePositions();

    }

    /**
     * Asynchronously load the DFP library.
     * Calls ready event when fully loaded.
     */
    function loadLibrary() {

        if ( libraryLoaded ) {
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
     * Check if the Ad Manager is currently enabled.
     *
     * @return {Boolean}
     */
    function isEnabled() {

        return Config.get( 'enabled' );

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

    //////////////////////////////////////////////////////////////////////////////////////

    return {
        init:         init,
        isEnabled:    isEnabled,
        displaySlot:  displaySlot,
        initSequence: initSequence,
        emptyAds:     emptyAds
    };

} ) );