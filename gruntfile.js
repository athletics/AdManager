module.exports = function(grunt) {

	'use strict';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		paths: {
			bower: 'bower_components',
			modules: 'src/modules',
			output: 'dist'
		},

		uglify: {
			options: {
				preserveComments: false,
				banner: '/**\n' +
					' * <%= pkg.name %> - <%= pkg.description %>\n' +
					' *\n' +
					' * @author <%= pkg.author.name %> - <%= pkg.author.url %>\n' +
					' * @see <%= pkg.homepage %>\n' +
					' * @version <%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd") %>)\n' +
					' */\n',
				footer: '\nwindow.AdManager = admanager.bootstrap.init;'
			},
			build: {
				files: {
					'<%= paths.output %>/admanager.js': [ '<%= paths.modules %>/*.js' ]
				}
			}
		},
		watch: {
			scripts: {
				files: [
					'<%= paths.modules %>/*',
					'<%= paths.bower %>/*'
				],
				tasks: ['uglify'],
			},
		},
	});

	// grunt plugins
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Tasks
	grunt.registerTask('default', ['uglify', 'watch']);

};