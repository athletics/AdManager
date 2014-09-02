/**
 *		Name: Config
 *
 *		Requires: app, app.util, jQuery
 */

var admanager = ( function( app, $ ) {

	app.config = ( function( $ ) {

		var _name = 'Config',
			debug = admanager.util.debug,

			id = '123456789',
			inventory = [
				{
					'slot' : 'Leaderboard_AboveTheFold',
					'type' : 'header_leaderboard',
					'iteration' : 0,
					'sizes' : [
						[728, 90]
					]
				}
			]
		;

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function init() {

			debug( _name + ': initialized' );

			return app;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		return {
			init      : init,
			id        : id,
			inventory : inventory
		};

	}( $ ) );

	return app;

}( admanager || {}, jQuery ) );

admanager.bootstrap.register( admanager.config.init );