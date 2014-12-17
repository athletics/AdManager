/**
 *		Name: Util
 *
 *		Requires: app, jQuery
 */

var admanager = (function (app, $) {

	app.util = (function ($) {

		var _name = 'Util',
			_debug_enable = false
		;

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _init() {

			debug(_name + ': initialized');
			_init_array_remove();
			return app;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function debug(obj) {

			if (!_debug_enable) return;

			if ((typeof console == "object") && (console.log)) {
				console.log(obj);
			}

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Return difference between arrays
		 *
		 * @param  array array
		 * @param  array values
		 * @return array diff
		 */
		function _difference(array, values) {

			var diff = [];

			$.grep(array, function (element) {
				if ($.inArray(element, values) === -1) diff.push(element);
			});

			return diff;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _init_array_remove() {

			// Array Remove - By John Resig (MIT Licensed)
			Array.prototype.remove = function (from, to) {
				var rest = this.slice((to || from) + 1 || this.length);
				this.length = from < 0 ? this.length + from : from;
				return this.push.apply(this, rest);
			};

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Import JSON page config data from DOM
		 *
		 * This imports inline JSON via data attribute 
		 * and extends an existing config with it.
		 *
		 * @param object options.$context
		 * @param string options.attr_name
		 * @return object
		 */
		function _import_config(options) {

			var $context = options.$context,
				attr_name = options.attr_name,
				exist_config = options.exist_config,
				selector,
				new_config,
				data = {};

			selector = '*[data-' + attr_name + ']';
			new_config = $.extend({}, exist_config);
			data = $context.find(selector).data(attr_name);

			if (typeof new_config === 'object') {
				new_config = $.extend(new_config, data);
			}

			return new_config;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Returns the DOM wrapper context for the ads
		 *
		 * In standard applications this remains constant,
		 * but in infinite scroll applications, this needs to be dynamic.
		 * If the config does not provide one, the default value is 'body'.
		 *
		 * @return array $(selector)
		 *
		 * TODO: 
		 * Add optional dynamically-determined context,
		 * for use in multi-segment infinite scroll
		 *
		 */

		function _get_context() {

			var selector = app.config.context || 'body';
			return $(selector);

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Get Shortest Possible Size for Unit
		 *
		 * @param object unit
		 * @return integer
		 */
		function _shortest_available(unit) {

			var shortest = 0;

			$.each(unit.sizes, function (index, sizes) {
				if (shortest === 0) shortest = sizes[1];
				else if (sizes[1] < shortest) shortest = sizes[1];
			});

			return shortest;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Get Tallest Possible Size for Unit
		 *
		 * @param object unit
		 * @return integer
		 */
		function _tallest_available(unit) {

			var tallest = 0;

			$.each(unit.sizes, function (index, sizes) {
				if (sizes[1] > tallest) tallest = sizes[1];
			});

			return tallest;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Limit Ad Unit Height: Removes Larger Sizes from Inventory
		 *
		 * @param  object unit
		 * @param  int limit
		 * @return object unit
		 */
		function _limit_unit_height(unit, limit) {

			$.each(unit.sizes, function (index, sizes) {
				if (sizes[1] <= limit) return true;
				unit.sizes.remove(index);
			});

			return unit;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Get Unit Type
		 *
		 * @param string id
		 * @return string type
		 */
		function _get_unit_type(id) {

			var type = 'default';

			$.each(app.config.inventory, function (index, unit) {
				if (unit.id !== id) return true;
				type = unit.type;
				return false;
			});

			return type;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		return {
			init               : _init,
			debug              : debug,
			difference         : _difference,
			import_config      : _import_config,
			shortest_available : _shortest_available,
			tallest_available  : _tallest_available,
			limit_unit_height  : _limit_unit_height,
			get_unit_type      : _get_unit_type,
			get_context        : _get_context
		};

	} ($));

	return app;

} (admanager || {}, jQuery));