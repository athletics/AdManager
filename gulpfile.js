var gulp = require( 'gulp' ),
    watch = require( 'gulp-watch' ),
    requirejs = require( 'requirejs' );

var pkg = require( './package.json' );

var rjs = function ( name, out, optimize ) {

    var ext = optimize ? '.min.js' : '.js',
        banner = '/*!\n' +
            ' * ' + pkg.name + ' - ' + pkg.description + '\n' +
            ' *\n' +
            ' * @author ' + pkg.author.name + ' - ' + pkg.author.url + '\n' +
            ' * @see ' + pkg.homepage + '\n' +
            ' * @version ' + pkg.version + '\n' +
            ' */';

    requirejs.optimize( {
        name: name,
        out: out + ext,
        optimize: ( optimize ? 'uglify2' : 'none' ),
        paths: {
            jquery: 'empty:'
        },
        wrap: {
            start: banner
        }
    } );
};

gulp.task( 'js', function () {
    rjs( './src/Index', './dist/AdManager', false );
    rjs( './src/Index', './dist/AdManager', true );
} );

gulp.task( 'watch', function () {
    gulp.watch( 'src/*.js', [ 'js' ] );
} );

gulp.task( 'default', [ 'js', 'watch' ] );