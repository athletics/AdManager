/**
 * Import, get, and set configuration values.
 *
 * @todo  Initialization should die when no valid account or inventory.
 * @todo  Add optional dynamically-determined context for use in infinite scroll.
 */
( function ( window, factory ) {

    'use strict';

    if ( typeof define === 'function' && define.amd ) {

        define( [
            'jquery'
        ], factory );

    } else if ( typeof exports === 'object' ) {

        module.exports = factory(
            require( 'jquery' )
        );

    } else {

        window.AdManager = window.AdManager || {};

        window.AdManager.Config = factory(
            window.jQuery
        );

    }

} ( window, function ( $ ) {

    'use strict';

    var config = {},
        defaults = {
            account:             null,               // DFP account ID
            autoload:            true,               // Start the qualification process automatically
            clientType:          false,              // Used to filter inventory
            context:             'body',             // Selector for ad filling container
            enabled:             true,               // Turn off ads
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
                    '[data-ad-unit]'
                ]
            },
            inventory: [],                           // Inventory of ad units
            targeting: []                            // Key value pairs to send with DFP request
        };

    //////////////////////////////////////////////////////////////////////////////////////

    /**
     * Merge passed config with defaults.
     *
     * @fires AdManager:unitsInserted
     *
     * @param  {Object} newConfig
     */
    function init( newConfig ) {

        $( document ).on( 'AdManager:importConfig', onImportConfig );

        $.event.trigger( 'AdManager:importConfig', newConfig );

    }

    /**
     * Set config value by key.
     *
     * @param  {String} key
     * @param  {Mixed}  value
     * @return {Object} config
     */
    function set( key, value ) {

        return setConfigValue( config, key, value );

    }

    /**
     * Get config value by key.
     * Pass no key to get entire config object.
     *
     * @param  {String|Null} key Optional.
     * @return {Mixed}
     */
    function get( key ) {

        key = key || false;

        if ( ! key ) {
            return config;
        }

        return getConfigValue( config, key );

    }

    /**
     * Set config value.
     * Uses recursion to set nested values.
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
     * Get config value.
     * Uses recursion to get nested values.
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
     * Import new config.
     * Merges with the current config.
     *
     * @param  {Object} event
     * @param  {Object} newConfig
     * @return {Object} config
     */
    function onImportConfig( event, newConfig ) {

        config = $.extend( defaults, config, newConfig );

        return config;

    }

    //////////////////////////////////////////////////////////////////////////////////////

    return {
        init: init,
        set:  set,
        get:  get
    };

} ) );