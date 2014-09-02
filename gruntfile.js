
module.exports = function(grunt) {

	'use strict';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		connect: {
			server: {
				options: {
					port: 8000
				}
			}
		},
		requirejs: {
			min: {
				options: {
					baseUrl: '.',
					mainConfigFile: 'src/main.js',
					name: 'bower_components/almond/almond',
					include: 'src/main',
					out: 'dist/ad_manager.js',
					optimize: 'uglify2',
					uglify2: {
						mangle: false,
						output: {
							beautify: true
						}
					},
					generateSourceMaps: false,
					preserveLicenseComments: false
				}
			}
		},
		watch: {
			scripts: {
				files: [
					'src/main.js',
					'src/modules/*.js',
					'bower_components/*'
				],
				tasks: ['requirejs'],
			},
		},
	});

	// grunt plugins
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-requirejs');

	// Tasks
	grunt.registerTask('default', ['requirejs', 'connect', 'watch']);

};