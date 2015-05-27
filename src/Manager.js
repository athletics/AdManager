/**
 * Handles the request and display of ads.
 *
 * @todo  Allow for multiple inits, only bind events
 *        and load library once.
 */
( function ( window, factory ) {

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

    var name = 'Manager',
        debugEnabled = true,
        debug = debugEnabled ? Util.debug : function () {},
        libraryLoaded = false,
        definedSlots = [],
        pagePositions = [],
        inventory = [],
        account = null,
        adSelector = '';

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
        adSelector = Config.get( 'adSelector' );

        bindHandlers();
        loadLibrary();

    }

    /**
     * Add event listeners for library events.
     */
    function bindHandlers() {

        $( document )
            .on( 'GPT:unitsInserted', function ( event ) {} )
            .on( 'GPT:libraryLoaded', function ( event ) {
                libraryLoaded = true;
                initSequence();
            } )
            .on( 'GPT:slotsDefined', function ( event ) {
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
     * @fires GPT:initSequence
     */
    function initSequence() {

        $.event.trigger( 'GPT:initSequence' );

        listenForDfpEvents();
        enableSingleRequest();

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
     * @fires GPT:libraryLoaded
     */
    function onLibraryLoaded() {

        googletag.cmd.push( function () {
            $.event.trigger( 'GPT:libraryLoaded' );
        } );

    }

    /**
     * Add a listener for the GPT `slotRenderEnded` event.
     */
    function listenForDfpEvents() {

        googletag.cmd.push( function () {
            googletag.pubads()
                .addEventListener( 'slotRenderEnded', function ( event ) {
                    slotRenderEnded( event );
                } )
            ;
        } );

    }

    /**
     * Enable batched SRA calls for requesting multiple ads at once.
     * Disable initial load of units, wait for display call.
     */
    function enableSingleRequest() {

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
            var id = $( this ).data( 'id' );
            pagePositions.push( id );
        } );

    }

    /**
     * Define slots for page positions.
     *
     * @fires GPT:slotsDefined
     */
    function defineSlotsForPagePositions() {

        googletag.cmd.push( function () {

            var currentPosition = null,
                $context = $( Config.get( 'context' ) ),
                $unit,
                $unitTarget;

            for ( var i = 0; i < pagePositions.length; i++ ) {

                Inventory.incrementAdSlot( pagePositions[ i ] );
                currentPosition = Inventory.getAdInfo( pagePositions[ i ] );

                if ( typeof currentPosition.id === 'undefined' ) {
                    continue;
                }

                // Find the empty container on the page.
                // Dynamically instantiate the unique ad unit.
                $unit = $context.find( adSelector + '[data-id="' + currentPosition.id + '"]' );
                $unitTarget = $( '<div />' );

                if ( $unit.length < 1 ) {
                    continue;
                }

                // Generate new unique div.
                $unitTarget.addClass( Config.get( 'adUnitTargetClass' ) );
                $unitTarget.attr( 'id', currentPosition.idName );
                $unit.append( $unitTarget );

                // Activate
                $unit.addClass( 'active' );

                definedSlots[ i ] = googletag
                    .defineSlot(
                        '/' + account + '/' + currentPosition.slot,
                        currentPosition.sizes,
                        currentPosition.idName
                     )
                    .addService( googletag.pubads() )
                ;

            }

            // Enables GPT services for defined slots.
            googletag.enableServices();

            $.event.trigger( 'GPT:slotsDefined' );

        } );

    }

    /**
     * Fetch and display defined slots.
     */
    function displayPageAds() {

        googletag.cmd.push( function () {

            googletag.pubads().refresh( definedSlots );

            for ( var i = 0; i < pagePositions.length; i++ ) {

                currentPosition = Inventory.getAdInfo( pagePositions[ i ] );

                if ( $( '#' + currentPosition.idName ).length ) {
                    googletag.display( currentPosition.idName );
                }

            }

        } );

    }

    /**
     * Callback from DFP rendered event.
     *
     * @fires GPT:adUnitRendered
     * @see   https://developers.google.com/doubleclick-gpt/reference
     *
     * @param {Object} unit
     */
    function slotRenderEnded( unit ) {

        var unitName = unit.slot.getAdUnitPath().replace( '/' + account + '/', '' ),
            adInfo = Inventory.getAdInfo( unitName )
        ;

        $.event.trigger( 'GPT:adUnitRendered', {
            name:        unitName,
            id:          adInfo.id,
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
     * @param  {String} name
     * @return {Object} definedSlot
     */
    function getDefinedSlot( name ) {

        var definedSlot = null;

        $.each( definedSlots, function ( i, slot ) {
            var unitName = slot.getAdUnitPath().replace( '/' + account + '/', '' );
            if ( unitName === name ) {
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
     * @param {String} unit
     */
    function displaySlot( unit ) {

        googletag.cmd.push( function () {
            var position = Inventory.getAdInfo( unit ),
                slot = getDefinedSlot( position.slot )
            ;
            googletag.pubads().refresh( [ slot ] );
            googletag.display( position.idName );
            definedSlots = Inventory.removeDefinedSlot( definedSlots, position.slot );
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

    //////////////////////////////////////////////////////////////////////////////////////

    return {
        init:         init,
        isEnabled:    isEnabled,
        displaySlot:  displaySlot,
        initSequence: initSequence,
        emptyAds:     emptyAds
    };

} ) );