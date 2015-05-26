/**
 * Manager
 */
( function ( root, factory ) {

    if ( typeof define === 'function' && define.amd ) {

        define( [
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

        root.AdManager = root.AdManager || {};

        root.AdManager.Manager = factory(
            root.jQuery,
            root.AdManager.Util,
            root.AdManager.Config,
            root.AdManager.Inventory
        );

    }

} ( this, function ( $, Util, Config, Inventory ) {

    var name = 'Manager',
        debugEnabled = true,
        debug = debugEnabled ? Util.debug : function () {},
        definedSlots = [],
        pagePositions = [],
        inventory = [],
        account = null,
        adSelector = '';

    //////////////////////////////////////////////////////////////////////////////////////

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
     * Bind to custom jQuery events
     */
    function bindHandlers() {

        $( document )
            .on( 'GPT:unitsInserted', function ( event ) {
                debug( name + ': GPT:unitsInserted' );
            } )
            .on( 'GPT:libraryLoaded', function ( event ) {
                debug( name + ': GPT:libraryLoaded' );
                initSequence();
            } )
            .on( 'GPT:slotsDefined', function ( event ) {
                debug( name + ': GPT:slotsDefined' );
                displayPageAds();
            } );

    }

    function initSequence() {

        $.event.trigger( 'GPT:initSequence' );

        listenForDfpEvents();
        enableSingleRequest();
        setTargeting();
        setPagePositions();
        defineSlotsForPagePositions();

    }

    /**
     * Request GPT library
     */
    function loadLibrary() {

        var googletag,
            gads,
            useSSL,
            node,
            readyStateLoaded = false
        ;

        window.googletag = window.googletag || {};
        googletag = window.googletag;
        googletag.cmd = googletag.cmd || [];
        gads = document.createElement( 'script' );
        gads.async = true;
        gads.type = 'text/javascript';
        useSSL = 'https:' == document.location.protocol;
        gads.src = ( useSSL ? 'https:' : 'http:' ) + '//www.googletagservices.com/tag/js/gpt.js';
        if ( gads.addEventListener ) {
            gads.addEventListener( 'load', onLibraryLoaded, false );
        } else if ( gads.readyState ) {
            gads.onreadystatechange = function () { // Legacy IE
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
     * Callback when GPT library is loaded
     */
    function onLibraryLoaded() {

        googletag.cmd.push( function () {
            $.event.trigger( 'GPT:libraryLoaded' );
        } );

    }

    /**
     * Bind to GPT events
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
     * Enable Batched SRA
     *
     * @uses collapseEmptyDivs()
     * @uses enableSingleRequest()
     * @uses disableInitialLoad()
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
     * Send Targeting
     * Defined in Page Config
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
     * Set Page Positions
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
     * Define Slots for Page Positions
     */
    function defineSlotsForPagePositions() {

        googletag.cmd.push( function () {

            var currentPosition = null,
                $context = $( Config.get( 'context' ) ),
                $unit,
                $unitTarget;

            for ( var i = 0; i < pagePositions.length; i++ ) {

                incrementAdSlot( pagePositions[ i ] );
                currentPosition = Inventory.getAdInfo( pagePositions[ i ] );

                if ( typeof currentPosition.id == 'undefined' ) {
                    continue;
                }

                // find the empty container div on the page. we
                // will dynamically instantiate the unique ad unit.
                $unit = $context.find( adSelector + '[data-id="' + currentPosition.id + '"]' );
                $unitTarget = $( '<div />' );

                if ( $unit.length < 1 ) {
                    continue;
                }

                // generate new div
                $unitTarget.addClass( Config.get( 'adUnitTargetClass' ) );
                $unitTarget.attr( 'id', currentPosition.idName );
                $unit.append( $unitTarget );

                // activate
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

            // Enables GPT services for defined slots
            googletag.enableServices();

            $.event.trigger( 'GPT:slotsDefined' );

        } );

    }

    function displayPageAds() {

        googletag.cmd.push( function () {

            // Fetch and display ads for definedSlots
            googletag.pubads().refresh( definedSlots );

            // lastly, run display code
            for ( var n = 0; n < pagePositions.length; n++ ) {

                currentPosition = Inventory.getAdInfo( pagePositions[n] );

                if ( $( '#' + currentPosition.idName ).length ) {
                    googletag.display( currentPosition.idName );
                }

            }

        } );

    }

    /**
     * slotRenderEnded - callback after unit is rendered
     *
     * @see https://developers.google.com/doubleclick-gpt/reference
     * @param object unit
     */
    function slotRenderEnded( unit ) {

        var unitName = unit.slot.getAdUnitPath().replace( '/' + account + '/', '' ),
            adInfo = Inventory.getAdInfo( unitName )
        ;

        $.event.trigger( 'GPT:adUnitRendered', {
            name: unitName,
            id: adInfo.id,
            size: unit.size,
            isEmpty: unit.isEmpty,
            creativeId: unit.creativeId,
            lineItemId: unit.lineItemId,
            serviceName: unit.serviceName
        } );

    }

    /**
     * Increment Ad Slot
     *
     * @param string unit
     */
    function incrementAdSlot( unit ) {

        for ( var i = 0; i < inventory.length; i++ ) {
            if ( inventory[ i ].id !== unit && inventory[ i ].slot !== unit ) {
                continue;
            }

            if ( typeof inventory[ i ].iteration == 'undefined' ) {
                inventory[ i ].iteration = 0;
            }

            // increment
            inventory[ i ].iteration = inventory[ i ].iteration + 1;

            return;
        }

    }

    /**
     * getDefinedSlot
     *
     * @param string name
     * @return object definedSlot
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
     * displaySlot
     *
     * @param string unit [type or slot]
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
     * Check if the Ad Manager is enabled for page
     *
     * @return bool
     */
    function isEnabled() {

        return Config.get( 'enabled' );

    }

    /**
     * Empties all ads in a given context
     *
     * @param object options.$context
     * @param bool   options.removeContainer
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