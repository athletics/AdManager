(function ($LAB) {
	$LAB
		.script( 'admanager.js' )
		.wait(function() {
			admanager.bootstrap.init({
				'account' : 123456789,
				'inventory' : [
					{
						'slot' : 'Unit_Name_in_DFP',
						'type' : 'unit_data_id',
						'iteration' : 0,
						'sizes' : [
							[728, 90]
						]
					}
				]
			});
		})
	;
}($LAB));