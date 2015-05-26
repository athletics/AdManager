/**
 * Manager
 */
( function ( root, factory ) {

    if ( typeof define === 'function' && define.amd ) {

        define( [
            'jquery',
            './Util',
            './Config'
        ], factory );

    } else if ( typeof exports === 'object' ) {

        module.exports = factory(
            require( 'jquery' ),
            require( './Util' ),
            require( './Config' )
        );

    } else {

        root.AdManager = root.AdManager || {};

        root.AdManager.Manager = factory(
            root.jQuery,
            root.AdManager.Util,
            root.AdManager.Config
        );

    }

} ( this, function ( $, Util, Config ) {

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

        inventory = Config.get( 'inventory' );
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
     * Get Inventory
     *
     * @return object
     */
    function getInventory() {

        return getAvailableSizes( inventoryCleanTypes( Config.get( 'inventory' ) ) );

    }

    /**
     * Add default unit type if not set
     *
     * @param array inventory
     * @return array inventory
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
     * Remove sizes from inventory that will not display properly
     *
     * @param array inventory
     * @return array inventory
     */
    function getAvailableSizes( inventory ) {

        var width = ( window.innerWidth > 0 ) ? window.innerWidth : screen.width;

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
                currentPosition = getAdInfo( pagePositions[ i ] );

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

                currentPosition = getAdInfo( pagePositions[n] );

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
            adInfo = getAdInfo( unitName )
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
     * Get Ad Unit Info
     *
     * @param string unit
     * @return object
     */
    function getAdInfo( unit ) {

        var returnObject = {};

        for ( var i = 0; i < inventory.length; i++ ) {
            if ( inventory[ i ].id !== unit && inventory[ i ].slot !== unit ) {
                continue;
            }

            // build return object
            returnObject = inventory[ i ];

            // determine the object's idName
            if ( typeof returnObject.useIterator !== 'undefined' && ! returnObject.useIterator ) {
                // don't use the iterator
                returnObject.idName = returnObject.id;
            } else {
                // use the iterator
                returnObject.idName = returnObject.id + '_' + returnObject.iteration;
            }

            return returnObject;
        }

        return returnObject;

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
            var position = getAdInfo( unit ),
                slot = getDefinedSlot( position.slot )
            ;
            googletag.pubads().refresh( [ slot ] );
            googletag.display( position.idName );
            removeDefinedSlot( position.slot );
        } );

    }

    /**
     * removeDefinedSlot
     *
     * @param string name
     * @return object definedSlot
     */
    function removeDefinedSlot( name ) {

        $.each( definedSlots, function ( index, slot ) {
            var unitName = slot.getAdUnitPath().replace( '/' + account + '/', '' );
            if ( unitName === name ) {
                definedSlots.remove( index );
            }
        } );

    }

    function getDynamicInventory() {

        var dynamicItems = [],
            type = Config.get( 'clientType' ),
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
        init:                init,
        isEnabled:           isEnabled,
        getAdInfo:           getAdInfo,
        displaySlot:         displaySlot,
        removeDefinedSlot:   removeDefinedSlot,
        getDynamicInventory: getDynamicInventory,
        initSequence:        initSequence,
        emptyAds:            emptyAds
    };

} ) );