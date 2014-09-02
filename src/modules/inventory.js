/*
*	Inventory
*/
define([ 'jquery', 'app/util' ], function( $, util ) {

	var _name = 'Inventory',
		_debug_enable = true,
		debug = ( _debug_enable ) ? util.debug : function(){}
	;

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	debug( _name + ': initialized' );

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	return [
		{
			'slot' : 'Leaderboard_AboveTheFold_728x90_AllPages',
			'type' : 'header_leaderboard',
			'iteration' : 0,
			'sizes' : [
				[728, 90]
			]
		},
		{
			'slot' : 'Footer_BelowTheFold_300x250_InternalPage',
			'type' : 'footer_btf',
			'iteration' : 0,
			'sizes' : [
				[300, 250]
			]
		},
		{
			'slot' : 'InContent_BelowTheFold_300x250_InternalPages',
			'type' : 'incontent_btf',
			'iteration' : 0,
			'sizes' : [
				[300, 250]
			]
		}
	];

});