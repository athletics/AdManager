module.exports = function(grunt) {

	'use strict';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		paths: {
			bower: 'bower_components',
			modules: 'src/modules',
			output: 'dist'
		},

		connect: {
			server: {
				options: {
					port: 8000
				}
			}
		},
		concat: {
			options: {
				stripBanners: true,
				footer: 'admanager.bootstrap.init();'
			},
			dist: {
				src: [
					'<%= paths.modules %>/bower_components/labjs/LAB.min.js',
					'<%= paths.modules %>/bootstrap.js',
					'<%= paths.modules %>/util.js',
					'<%= paths.modules %>/*.js',
					'!<%= paths.modules %>/config.example.js'
				],
				dest: '<%= paths.output %>/admanager.js'
			}
		},
		watch: {
			scripts: {
				files: [
					'<%= concat.dist.src %>',
					'bower_components/*'
				],
				tasks: ['concat'],
			},
		},
	});

	// grunt plugins
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Tasks
	grunt.registerTask('default', ['concat', 'connect', 'watch']);

};