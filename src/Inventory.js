/**
 * Inventory
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

        root.AdManager.Inventory = factory(
            root.jQuery,
            root.AdManager.Util,
            root.AdManager.Config
        );

    }

} ( this, function ( $, Util, Config ) {

    var name = 'Inventory',
        debugEnabled = true,
        debug;

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

        $.each( Config.get( 'inventory' ), function ( index, unit ) {

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