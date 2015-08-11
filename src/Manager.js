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
            './Config',
            './Inventory'
        ], function ( $, Config, Inventory ) {
            return factory( window, $, Config, Inventory );
        } );

    } else if ( typeof exports === 'object' ) {

        module.exports = factory(
            window,
            require( 'jquery' ),
            require( './Config' ),
            require( './Inventory' )
        );

    } else {

        window.AdManager = window.AdManager || {};

        window.AdManager.Manager = factory(
            window,
            window.jQuery,
            window.AdManager.Config,
            window.AdManager.Inventory
        );

    }

} ( window, function ( window, $, Config, Inventory ) {

    'use strict';

    var loaded = false,
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
            .on( 'AdManager:runSequence', runSequence )
            .on( 'AdManager:slotsDefined', displayPageAds )
            .on( 'AdManager:refresh', refresh )
            .on( 'AdManager:emptySlots', emptySlots )
            .on( 'AdManager:emptySlotsInContext', emptySlotsInContext );

    }

    /**
     * Library loaded callback.
     *
     * @fires AdManager:runSequence
     * @fires AdManager:ready
     */
    function libraryLoaded() {

        loaded = true;

        listenForDfpEvents();
        setupPubAdsService();

        if ( Config.get( 'autoload' ) ) {
            $.event.trigger( 'AdManager:runSequence' );
        }

        $.event.trigger( 'AdManager:ready' );

    }

    /**
     * Run qualification sequence.
     *
     * - Find page positions in the DOM
     * - Define new slots
     */
    function runSequence() {

        pagePositions = [];
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
     *
     * @todo  https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_clearTargeting
     */
    function setTargeting() {

        googletag.cmd.push( function () {

            var targeting = Config.get( 'targeting' );

            if ( $.isEmptyObject( targeting ) ) {
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
            selector = adSelector + ':not(.is-disabled)'
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

                    if ( $.inArray( slotName, definedSlotNames ) !== -1 ) {
                        return false;
                    }

                    return true;

                } );
            }

            $.each( undefinedPagePositions, function ( index, slotName ) {

                var position = Inventory.getAdInfo( slotName ),
                    slot = googletag
                        .defineSlot(
                            convertSlotName( slotName, 'dfp' ),
                            position.sizes,
                            position.slot
                         )
                        .addService( googletag.pubads() );

                definedSlots.push( slot );

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
                .addClass( 'is-initialized' )
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

                return -1 !== $.inArray( slotName, pagePositions );

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

            pagePositions = $.grep( pagePositions, function ( pagePosition, index ) {
                return slotName !== pagePosition;
            } );

        } );

    }

    /**
     * Empty slots by name. Removes their target container,
     *
     * @param  {Object} event
     * @param  {Array}  units List of slot names.
     */
    function emptySlots( event, units ) {

        googletag.pubads().clear( units );

        $.each( units, function ( index, unit ) {
            $( document.getElementById( unit ) ).remove();
        } );

    }

    /**
     * Empties all ads in a given context.
     *
     * @param  {Object} event
     * @param  {Object}  options
     *         {Array}   $context        jQuery element.
     *         {Boolean} removeContainer Default is true.
     */
    function emptySlotsInContext( event, options ) {

        options = options || {};
        options = $.extend( {
            $context:        $( Config.get( 'context' ) ),
            removeContainer: true
        }, options );

        var units = $.map( options.$context.find( adSelector ), function ( unit, index ) {
            return $( unit ).data( 'ad-unit' );
        } );

        googletag.pubads().clear( units );

        var $elements = $.map( units, function ( unit, index ) {

            return options.$context.find( '#' + unit );

        } );

        if ( removeContainer ) {

            $elements.remove();

        } else {

            $elements.empty();

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
    function refresh( event, units ) {

        units = units || definedSlots;

        googletag.cmd.push( function () {
            googletag.pubads().refresh( units );
        } );

    }

    //////////////////////////////////////////////////////////////////////////////////////

    return {
        init:                init,
        displaySlot:         displaySlot,
        runSequence:         runSequence,
        emptySlots:          emptySlots,
        emptySlotsInContext: emptySlotsInContext,
        refresh:             refresh
    };

} ) );