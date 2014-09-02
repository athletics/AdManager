define('jquery', function() {
	if ( window.jQuery ) return window.jQuery;

	require('bower_components/jquery/dist/jquery.min');
	return window.jQuery;
});

require.config({
	paths: {
		'app': 'src/modules',
		'vendor': 'bower_components'
	}
});

requirejs([
	'jquery',
	'app/manager'
]);