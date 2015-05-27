/**
 * Import, get, and set configuration values.
 */
( function ( root, factory ) {

    if ( typeof define === 'function' && define.amd ) {

        define( [
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
        config = {},
        defaults = {
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
            inventory: [],                           // Inventory of ad units
            pageConfigAttr: false,                   // Selector for dynamic config import
            targeting: []                            // Key value pairs to send with DFP request
        };

    //////////////////////////////////////////////////////////////////////////////////////

    /**
     * Merge passed config with defaults.
     *
     * @param  {Object} config
     */
    function init( config ) {

        config = $.extend( defaults, config );

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
     * Import JSON page config data from DOM.
     *
     * This imports inline JSON via data attribute
     * and extends an existing config with it.
     *
     * @todo   Reenable usage in the project.
     *         Ascertain the correct place to use.
     *         Previous usage was in `Manager.isEnabled()`.
     *
     * @param  {Object} options.$context
     * @param  {String} options.attrName
     * @return {Object}
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
        init:         init,
        set:          set,
        get:          get,
        importConfig: importConfig
    };

} ) );