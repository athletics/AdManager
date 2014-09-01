/**
 *		js module:
 *			util.js
 *
 *		desc:
 *			Includes a variety of utility functions used across the site.
 *
 */

var app = (function( app, $ ) {

	/* define new module */
	app.util = (function($){

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function init() {
			_init_left_click_handling();
			return app;
		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function debug( obj, showCaller ) {
			if ( ( typeof console == "object" ) && ( console.log ) ) {
				if (showCaller) {
					console.log( arguments.callee.caller.name + ':' );
				}
				console.log( obj );
			}
		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/*
		*	load_ajax(options)
		*		Makes an ajax request, handles response.
		*/

		function load_ajax(options) {

			if (typeof options == 'undefined') return false;

			var ajax_options = {
				url : options.url
			};

			// request type
			ajax_options.type = (typeof options.type != 'undefined') ? options.type : 'get';

			// data sent to the server
			ajax_options.data = (typeof options.data != 'undefined') ? options.data : {};

			// are we expecting a particular data type from the server?
			if (typeof options.dataType != 'undefined') ajax_options.dataType = options.dataType;

			// timeout params; default to 10 seconds
			ajax_options.timeout = (typeof options.timeout != 'undefined') ? options.timeout : (20 * 1000) ;

			// error callback
			ajax_options.error = (typeof options.error != 'undefined') ? options.error : function( e, textStatus, errorThrown ){

				debug( 'error loading: ' + ajax_options.url );
				debug( 'error textStatus: ' + textStatus );
				debug( 'error errorThrown: ' + errorThrown );

			};

			// success callback
			ajax_options.success = (typeof options.success != 'undefined') ? options.success : function( data ){

				debug( 'data received from '+ ajax_options.url +':' );
				debug( data );

			};

			// finally, make request
			$.ajax( ajax_options );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function number_format (number, decimals, dec_point, thousands_sep) {
			// http://kevin.vanzonneveld.net
			// +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
			// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
			// +     bugfix by: Michael White (http://getsprink.com)
			// +     bugfix by: Benjamin Lupton
			// +     bugfix by: Allan Jensen (http://www.winternet.no)
			// +    revised by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
			// +     bugfix by: Howard Yeend
			// +    revised by: Luke Smith (http://lucassmith.name)
			// +     bugfix by: Diogo Resende
			// +     bugfix by: Rival
			// +      input by: Kheang Hok Chin (http://www.distantia.ca/)
			// +   improved by: davook
			// +   improved by: Brett Zamir (http://brett-zamir.me)
			// +      input by: Jay Klehr
			// +   improved by: Brett Zamir (http://brett-zamir.me)
			// +      input by: Amir Habibi (http://www.residence-mixte.com/)
			// +     bugfix by: Brett Zamir (http://brett-zamir.me)
			// +   improved by: Theriault
			// +      input by: Amirouche
			// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
			// *     example 1: number_format(1234.56);
			// *     returns 1: '1,235'
			// *     example 2: number_format(1234.56, 2, ',', ' ');
			// *     returns 2: '1 234,56'
			// *     example 3: number_format(1234.5678, 2, '.', '');
			// *     returns 3: '1234.57'
			// *     example 4: number_format(67, 2, ',', '.');
			// *     returns 4: '67,00'
			// *     example 5: number_format(1000);
			// *     returns 5: '1,000'
			// *     example 6: number_format(67.311, 2);
			// *     returns 6: '67.31'
			// *     example 7: number_format(1000.55, 1);
			// *     returns 7: '1,000.6'
			// *     example 8: number_format(67000, 5, ',', '.');
			// *     returns 8: '67.000,00000'
			// *     example 9: number_format(0.9, 0);
			// *     returns 9: '1'
			// *    example 10: number_format('1.20', 2);
			// *    returns 10: '1.20'
			// *    example 11: number_format('1.20', 4);
			// *    returns 11: '1.2000'
			// *    example 12: number_format('1.2000', 3);
			// *    returns 12: '1.200'
			// *    example 13: number_format('1 000,50', 2, '.', ' ');
			// *    returns 13: '100 050.00'
			number = (number + '').replace(',', '').replace(' ', '');
			var n = !isFinite(+number) ? 0 : +number,
				prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
				sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
				dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
				s = '',
				toFixedFix = function (n, prec) {
					var k = Math.pow(10, prec);
					return '' + Math.round(n * k) / k;
				};
			// Fix for IE parseFloat(0.55).toFixed(0) = 0;
			s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
			if (s[0].length > 3) {
				s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
			}
			if ((s[1] || '').length < prec) {
				s[1] = s[1] || '';
				s[1] += new Array(prec - s[1].length + 1).join('0');
			}
			return s.join(dec);
		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/*
		*	parse_ajax_content()
		*		Returns content between html comments matching a particular marker. We use this
		*		to get a specific chunk of html within a larger document.
		*/

		function parse_ajax_content( data, marker ) {

			//_debug('_parse_ajax_content()');

			var start_marker = '<!--start:' + marker + '-->',
				end_marker = '<!--end:' + marker + '-->',

				start_marker_open = '<!--start:' + marker,
				end_marker_open = 'end:' + marker + '-->',

				start_index = data.indexOf(start_marker),
				end_index = data.indexOf(end_marker),

				content = ''
			;

			if (start_index == -1 || end_index == -1) {

				// test against the open markers

				start_marker = start_marker_open;
				end_marker = end_marker_open;

				start_index = data.indexOf(start_marker);
				end_index = data.indexOf(end_marker);

			}

			if (start_index == -1 || end_index == -1)
				return ''
			;

			content = data.substring( (start_index + start_marker.length), end_index );

			return content;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/*
		*	highlighter( termToHighlight, fullString, highlightClass )
		*		Looks at @fullString and highlights @termToHighlight. Returns a string of
		*			html with @termToHighlight wrapped in <span class="@highlightClass"></span>
		*/

		function highlighter( termToHighlight, fullString, highlightClass ) {

			var query = termToHighlight.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');

			return fullString.replace(
				new RegExp(
					'(' + query + ')',
					'ig'
				),
				function ($1, match) {
					return '<span class="'+ highlightClass +'">' + match + '</span>';
				}
			);

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/*
		*	_init_left_click_handling()
		*		Provides a simple jQuery plugin for only handling regular left clicks. If the
		*		user is using Command or Shift as a modifier, they will experience the normal
		*		behavior of opening a link in a new tab or browser window.
		*
		*		Here's how you bind to the event:
		*			$('my-selector').on('click:left', function(e) {
		*				// ...
		*			});
		*
		*/

		function _init_left_click_handling() {

			(function($){
				$.event.special['click:left'] = {
					setup: function() {
						$.event.add(this, 'click', $.event.special['click:left'].handler);
					},
					teardown: function() {
						$.event.remove(this, 'click');
					},
					handler: function(e) {
						if (e.which <= 1 && !e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey) {
							e.type = "click:left";
							$.event.handle.apply(this, arguments);
						}
					}
				};
			})(jQuery);

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function is_mobile() {

			var mobile = false;

			if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				mobile = true;
			}

			return mobile;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function string_to_boolean( maybe_string ) {

			if ( typeof maybe_string === 'boolean' ) return maybe_string;

			switch( maybe_string.toLowerCase() ) {
				case "true":
				case "yes":
				case "1":
					return true
				;

				case "false":
				case "no":
				case "0":
				case null:
					return false
				;

				default:
					return Boolean(maybe_string)
				;
			}

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/* return public-facing methods and/or vars */
		return {
			init : init,
			number_format : number_format,
			debug : debug,
			parse_ajax_content : parse_ajax_content,
			load_ajax : load_ajax,
			highlighter : highlighter,
			is_mobile : is_mobile
		};

	}($));

	return app; /* return augmented app object */

}( app || {}, jQuery )); /* import app if exists, or create new; import jQuery */
