/*jshint unused:false */
// Temp bootstrap to get Athletics' Ad Manager up and running
(function ($LAB) {
	var path = 'js/app/';
	$LAB
		.script([
			path + 'util.js',
			path + 'ad_manager/ad_manager.js'
		])
		.wait(function() {
			app.ad_manager.init();
		})
	;
}($LAB));
