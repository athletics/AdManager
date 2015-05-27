/**
 * Get, filter, and augment the ad unit inventory.
 */
( function ( window, factory ) {

    if ( typeof define === 'function' && define.amd ) {

        define( [
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
     * Remove slot by name.
     * Relies on the `googletag` slot object.
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
     * Get info about an ad unit by id or slot name.
     *
     * @param  {String} unit   ID or slot.
     * @return {Object} adInfo
     */
    function getAdInfo( unit ) {

        var adInfo = {},
            inventory = getInventory();

        for ( var i = 0; i < inventory.length; i++ ) {
            if ( inventory[ i ].id !== unit && inventory[ i ].slot !== unit ) {
                continue;
            }

            adInfo = inventory[ i ];

            // Determine the object's idName (using the iterator if allowed).
            if ( typeof adInfo.useIterator !== 'undefined' && ! adInfo.useIterator ) {
                adInfo.idName = adInfo.id;
            } else {
                adInfo.idName = adInfo.id + '_' + adInfo.iteration;
            }

            return adInfo;
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
     * @todo   Limit to the current iteration.
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
     * Finds the unit by id and returns its type.
     * Type is used to filter the inventory (like desktop and mobile).
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
     * DFP requires an HTML id to display a unit. This function
     * ensures all ids are unique by incrementing the unit every
     * time an ad is loaded.
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