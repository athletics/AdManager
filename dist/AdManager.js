/*!
 * AdManager - Generic code for GPT ad management
 *
 * @author Athletics - http://athleticsnyc.com
 * @see https://github.com/athletics/ad-manager
 * @version 0.3.1
 *//**
 * Util
 */
( function ( root, factory ) {

    if ( typeof define === 'function' && define.amd ) {

        define( 'src/Util',[
            'jquery'
        ], factory );

    } else if ( typeof exports === 'object' ) {

        module.exports = factory(
            require( 'jquery' )
        );

    } else {

        root.AdManager = root.AdManager || {};

        root.AdManager.Util = factory(
            root.jQuery
        );

    }

} ( this, function ( $ ) {

    /**
     * Debug: a console.log wrapper.
     *
     * @return {String}
     */
    var debug = function () {

        if ( typeof console !== 'object' || ! console.log ) {
            return;
        }

        return Function.prototype.bind.call( console.log, console );

    } ();

    /**
     * Return difference between arrays.
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
     * Remove by key.
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
 * Config
 */
( function ( root, factory ) {

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

        root.AdManager = root.AdManager || {};

        root.AdManager.Config = factory(
            root.jQuery,
            root.AdManager.Util
        );

    }

} ( this, function ( $, Util ) {

    var name = 'Config',
        debugEnabled = true,
        debug = debugEnabled ? Util.debug : function () {},
        config = {
            account:             null,               // DFP account ID
            adClass:             'app_ad_unit',      // Outer ad wrap
            adUnitTargetClass:   'app_unit_target',  // Inner ad wrap
            clientType:          false,              // Used to filter inventory
            context:             'body',             // Selector for ad filling container
            enabled:             true,               // Turn off ads
            insertExclusion:     [],                 // Inventory to exclude from dynamic insertion
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
                    '.app_ad_unit'
                ]
            },
            inventory:           [],                 // Inventory of ad units
            pageConfigAttr:      false,              // Selector for dynamic config import
            targeting:           []                  // Key value pairs to send with DFP request
        };

    //////////////////////////////////////////////////////////////////////////////////////

    /**
     * Initialize the config module.
     *
     * @param  {Object} newConfig The AdManager config object.
     */
    function init( newConfig ) {

        config = $.extend( config, newConfig );

    }

    /**
     * Set
     *
     * @param  {String} key
     * @param  {Mixed}  value
     * @return {Object} config
     */
    function set( key, value ) {

        return setConfigValue( config, key, value );

    }

    /**
     * Get
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
     * Set config value. Uses recursion to set nested values.
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
     * Get config value. Uses recursion to get nested values.
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
     * Import JSON page config data from DOM
     *
     * This imports inline JSON via data attribute
     * and extends an existing config with it.
     *
     * @param object options.$context
     * @param string options.attrName
     * @return object
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
        init: init,
        set:  set,
        get:  get
    };

} ) );
/**
 * Inventory
 */
( function ( root, factory ) {

    if ( typeof define === 'function' && define.amd ) {

        define( 'src/Inventory',[
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

        root.AdManager.Inventory = factory(
            root.jQuery,
            root.AdManager.Util,
            root.AdManager.Config
        );

    }

} ( this, function ( $, Util, Config ) {

    var name = 'Inventory',
        debugEnabled = true,
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
     * @todo   Simplify and remove limits.
     *
     * @param  {Array} inventory
     * @return {Array} inventory
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
     * Remove slot by name.
     *
     * @param  {Object} definedSlots
     * @param  {String} name
     * @return {Object} definedSlots
     */
    function removeDefinedSlot( definedSlots, name ) {

        for ( var i = 0; i < definedSlots.length; i++ ) {

            var unitName = definedSlots[ i ].getAdUnitPath()
                .replace( '/' + Config.get( 'account' ) + '/', '' );

            if ( unitName !== name ) {
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
     * Get Ad Unit Info
     *
     * @param  {String} unit
     * @return {Object} adInfo
     */
    function getAdInfo( unit ) {

        var adInfo = {},
            inventory = getInventory();

        for ( var i = 0; i < inventory.length; i++ ) {
            if ( inventory[ i ].id !== unit && inventory[ i ].slot !== unit ) {
                continue;
            }

            // build return object
            adInfo = inventory[ i ];

            // determine the object's idName
            if ( typeof adInfo.useIterator !== 'undefined' && ! adInfo.useIterator ) {
                // don't use the iterator
                adInfo.idName = adInfo.id;
            } else {
                // use the iterator
                adInfo.idName = adInfo.id + '_' + adInfo.iteration;
            }

            return adInfo;
        }

        return adInfo;

    }

    /**
     * Get Shortest Possible Size for Unit
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
     * Get Tallest Possible Size for Unit
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
     * Limit Ad Unit Height: Removes Larger Sizes from Inventory
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
     * Get Unit Type
     *
     * @param  {String} id
     * @return {String} type
     */
    function getUnitType( id ) {

        var type = 'default';

        $.each( getInventory(), function ( index, unit ) {

            if ( unit.id !== id ) {
                return true;
            }

            type = unit.type;

            return false;

        } );

        return type;

    }

    /**
     * Increment ad slot.
     *
     * @param {String} unit
     */
    function incrementAdSlot( unit ) {

        var inventory = Config.get( 'inventory' );

        for ( var i = 0; i < inventory.length; i++ ) {

            if ( inventory[ i ].id !== unit && inventory[ i ].slot !== unit ) {
                continue;
            }

            inventory[ i ].iteration = typeof inventory[ i ].iteration === 'undefined' ? 0 : inventory[ i ].iteration + 1;

            Config.set( 'inventory', inventory );

            break;

        }

    }

    //////////////////////////////////////////////////////////////////////////////////////

    return {
        getInventory:        getInventory,
        getAdInfo:           getAdInfo,
        getDynamicInventory: getDynamicInventory,
        shortestAvailable:   shortestAvailable,
        tallestAvailable:    tallestAvailable,
        limitUnitHeight:     limitUnitHeight,
        getUnitType:         getUnitType,
        incrementAdSlot:     incrementAdSlot
    };

} ) );
/**
 * Manager
 */
( function ( root, factory ) {

    if ( typeof define === 'function' && define.amd ) {

        define( 'src/Manager',[
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
                debug( name + ': ' + event.type );
            } )
            .on( 'GPT:libraryLoaded', function ( event ) {
                debug( name + ': ' + event.type );
                initSequence();
            } )
            .on( 'GPT:slotsDefined', function ( event ) {
                debug( name + ': ' + event.type );
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

                Inventory.incrementAdSlot( pagePositions[ i ] );
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
/**
 * Insertion
 */
( function ( root, factory ) {

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

        root.AdManager = root.AdManager || {};

        root.AdManager.Insertion = factory(
            root.jQuery,
            root.AdManager.Util,
            root.AdManager.Config,
            root.AdManager.Inventory
        );

    }

} ( this, function ( $, Util, Config, Inventory ) {

    var name = 'Insertion',
        debugEnabled = true,
        debug = debugEnabled ? Util.debug : function () {},
        $context = null,
        $localContext = null,
        inContent = false,
        inventory = [],
        odd = true,
        localContext = null;

    //////////////////////////////////////////////////////////////////////////////////////

    function init() {

        bindHandlers();

    }

    function bindHandlers() {

        $( document )
            .on( 'GPT:initSequence', function ( event ) {

                debug( name + ': ' + event.type );
                /**
                 * Begin qualification procedure when the DOM is ready
                 */
                qualifyContext();

            } );

    }

    function setContext() {

        $context = $( Config.get( 'context' ) );

    }

    /*
     * First qualify the DOM context where ads are to be inserted
     * to determine if insertion should proceed.
     *
     * @return object
     */
    function qualifyContext() {

        var inventoryData = Inventory.getDynamicInventory();

        setContext();
        inventory = inventory.length ? inventory : inventoryData.dynamicItems;
        localContext = localContext ? localContext : inventoryData.localContext;

        // Return if empty
        if ( ! inventory.length ) {
            broadcast();
            return;
        }

        $localContext = $context.find( localContext ).first();

        // Detect a local context
        if ( $localContext.length ) {
            inContent = true;
        }

        // Return if there is no insertion selector
        if ( ! inContent ) {
            broadcast();
            return;
        }

        insertAdUnits();

    }

    /**
     * Ad units have been inserted / proceed
     */
    function broadcast() {

        $.event.trigger( 'GPT:unitsInserted' );

    }

    /**
     * Is Insertion Enabled?
     *
     * @return bool
     */
    function isEnabled() {

        return Config.get( 'insertionEnabled' );

    }

    function insertAdUnits() {

        if ( inContent ) {
            denoteValidInsertions();
            insertPrimaryUnit();
            insertSecondaryUnits();
        }

        broadcast();

    }

    function denoteValidInsertions() {

        var $nodes = $localContext.children(),
            excluded = Config.get( 'insertExclusion' )
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
     * Check against of list of elements to skip
     *
     * @param  object $element
     * @return bool
     */
    function isValidInsertionLocation( $element ) {

        return $element.data( 'valid-location' );

    }

    /**
     * adUnitMarkup
     *
     * @param string unitId
     * @param bool disableFloat
     * @return string
     */
    function adUnitMarkup( unitId, disableFloat ) {

        var floatDisable = disableFloat || false,
            type = Inventory.getUnitType( unitId ),
            alignment = odd ? 'odd' : 'even',
            $html = $( '<div />' );

        $html
            .addClass( Config.get( 'adClass' ) )
            .attr( 'data-id', unitId )
            .attr( 'data-client-type', type );

        if ( floatDisable ) {
            $html
                .addClass( 'disableFloat' );
        } else {
            $html
                .addClass( 'inContent' )
                .addClass( alignment );
        }

        if ( ! floatDisable ) {
            odd = ! odd;
        }

        return $html;

    }

    /**
     * Insert Primary Unit: Unit most display above the fold
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

        markup = adUnitMarkup( unit.id, location.disableFloat );

        location.$insertBefore.before( markup );

    }

    /**
     * Insert Secondary Unit: Ad units that commonly appear below the fold
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

            markup = adUnitMarkup( unit.id, location.disableFloat );
            location.$insertBefore.before( markup );

        } );

    }

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
     * findInsertionLocation
     *
     * @param object options
     * @return object or boolean:false
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

        // Loop through each node as necessary
        $.each( $nodes, function ( i, node ) {

            var exitLoop = nodeSearch.verifyNode( i, $( node ) );

            if ( exitLoop ) {
                return false;
            } else if ( ! exitLoop ) {
                return true;
            }

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
     * Search object used for determining insertion points
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
     * Store the position of the last ad
     */
    NodeSearch.prototype.setLastPosition = function () {

        this.lastPosition = this.$insertBefore.offset().top + this.neededheight;

    };

    /**
     * Mark nodes where insertion is valid
     */
    NodeSearch.prototype.markValidNodes = function () {

        if ( this.inserted.length ) {
            $.each( this.inserted, function ( index, item ) {
                $( item ).data( 'valid-location', false );
            } );
        }

    };

    /**
     * Verify each node to find a suitable insertion point
     *
     * @return boolean
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
     * Is Element an Ad Unit
     *
     * @param mixed $el
     * @return bool
     */
    function isThisAnAd( $el ) {

        if ( ! $el ) {
            return false;
        }

        return $el.is( Config.get( 'adSelector' ) );

    }

    /**
     * Get Nodes to Loop Through
     *
     * @return array $nodes
     */
    function getNodes() {

        var $prevUnit = $localContext.find( Config.get( 'adSelector' ) ).last(),
            $nodes = null;

        // nodes after previous unit or all nodes
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
 * Bootstrap
 */
( function ( root, factory ) {

    if ( typeof define === 'function' && define.amd ) {

        define( 'src/Index',[
            './Util',
            './Config',
            './Inventory',
            './Manager',
            './Insertion'
        ], factory );

    } else if ( typeof exports == 'object' ) {

        module.exports = factory(
            require( './Util' ),
            require( './Config' ),
            require( './Inventory' ),
            require( './Manager' ),
            require( './Insertion' )
        );

    } else {

        var _AdManager = root.AdManager;

        root.AdManager = factory(
            _AdManager.Util,
            _AdManager.Config,
            _AdManager.Inventory,
            _AdManager.Manager,
            _AdManager.Insertion
        );

    }

} ( this, function ( Util, Config, Inventory, Manager, Insertion ) {

    function AdManager( newConfig ) {

        newConfig = newConfig || false;

        if ( ! newConfig ) {
            throw new Error( 'Please provide a config.' );
        }

        debug = Util.debug;

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
