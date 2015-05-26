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
     * removeDefinedSlot
     *
     * @param string name
     * @return object definedSlot
     */
    function removeDefinedSlot( name ) {

        $.each( definedSlots, function ( index, slot ) {
            var unitName = slot.getAdUnitPath().replace( '/' + account + '/', '' );
            if ( unitName === name ) {
                definedSlots = Util.removeByKey( definedSlots, index );
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
     * Get Shortest Possible Size for Unit
     *
     * @param object unit
     * @return integer
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
     * @param object unit
     * @return integer
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
     * @param  object unit
     * @param  int limit
     * @return object unit
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
     * @param string id
     * @return string type
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