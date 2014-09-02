var head = document.getElementsByTagName('head')[0],
    script = document.createElement('script');

script.src = 'js/vendor/requirejs/require.js';
head.appendChild(script);


define('jquery', function() {
	console.log('defining jquery');
	if ( window.jQuery ) return window.jQuery;

	require('js/vendor/jquery/dist/jquery.min');
	return window.jQuery;
});

require.config({
	baseUrl: 'js',
	paths: {
		'app': 'app',
		'vendor': 'vendor'
	}
});

requirejs([
	'jquery',
	'app/util',
	'app/ad_manager/ad_manager'
]);