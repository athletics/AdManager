/**
 * Bootstrap
 */
( function ( root, factory ) {

    if ( typeof define === 'function' && define.amd ) {

        define( [
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