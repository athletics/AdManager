/**
 * Config
 */
define([ 'jquery', 'app/util' ], function( $, util ) {

	var _name = 'Config',
		_debug_enable = true,
		debug = ( _debug_enable ) ? util.debug : function(){}
	;

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	debug( _name + ': initialized' );

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	return {
		id : '123456789',
		inventory : [
			{
				'slot' : 'Leaderboard_AboveTheFold',
				'type' : 'header_leaderboard',
				'iteration' : 0,
				'sizes' : [
					[728, 90]
				]
			}
		]
	};

});