/**
 *		Name: Ad Insertion
 *
 *		Requires: app, app.util, jQuery
 */

var admanager = (function (app, $) {

	app.insertion = (function ($) {

		var _name = 'Insertion',
			debug = null,
			$context = null,
			$local_context = null,
			_in_content = false,
			_inventory = [],
			_odd = true,
			_local_context = null,
			_defaults = {
				px_between_units: 800,
				ad_height_limit: 1000,
				insert_exclusion: [
					'img',
					'iframe',
					'video',
					'audio',
					'.video',
					'.audio',
					'.app_ad_unit'
				]
			}
		;

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _init() {

			debug = admanager.util.debug ? admanager.util.debug : function () {};
			debug(_name + ': initialized');

			_defaults = $.extend(_defaults, app.manager.get_defaults());

			_bind_handlers();

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _bind_handlers() {

			$(document)
				.on('GPT:initSequence', function () {

					debug(_name + ': GPT:initSequence');
					/** 
					 * Begin qualification procedure when the DOM is ready
					 */
					_qualify_context();

				});

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _set_context() {

			$context = app.util.get_context();

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/* 
		 * First qualify the DOM context where ads are to be inserted
		 * to determine if insertion should proceed.
		 */

		function _qualify_context() {

			var inventory_data = app.manager.get_dynamic_inventory();

			_set_context();
			_inventory = (_inventory.length > 0) ? _inventory : inventory_data.dynamic_items;
			_local_context = (_local_context) ? _local_context : inventory_data.local_context;

			// Return if empty
			if (_inventory.length < 1) {
				_broadcast();
				return app;
			}

			$local_context = $context.find(_local_context).first();

			// Detect a local context
			if ($local_context.length > 0) {
				_in_content = true;
			}

			// Return if there is no insertion selector
			if (!_in_content) {
				_broadcast();
				return app;
			}

			_insert_ad_units();
			return app;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Ad units have been inserted / proceed
		 */
		function _broadcast() {

			$.event.trigger('GPT:unitsInserted');

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Is Insertion Enabled?
		 *
		 * @return bool
		 */
		function _is_enabled() {

			var page_config = app.manager.get_config();

			if (typeof page_config.insertion_enabled === 'undefined') return false;

			return page_config.insertion_enabled;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _insert_ad_units() {

			if (_in_content) {
				_denote_valid_insertions();
				_insert_primary_unit();
				_insert_secondary_units();
			}

			_broadcast();

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _denote_valid_insertions() {

			var $nodes = $local_context.children(),
				excluded = app.config.insert_exclusion || _defaults.insert_exclusion
			;

			$nodes.each(function (i) {

				var $element = $(this),
					$prev = i > 0 ? $nodes.eq(i - 1) : false,
					valid = true
				;

				$.each(excluded, function (index, item) {
					if ($element.is(item) || $element.find(item).length > 0) {
						valid = false; // not valid
						return false; // break loop
					}
				} );

				if ($prev && $prev.is('p') && $prev.find('img').length === 1) valid = false;

				$element.attr('data-valid-location', valid);

			} );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Check against of list of elements to skip
		 *
		 * @param  object $element
		 * @return bool
		 */
		function _is_valid_insertion_location($element) {

			return $element.data('valid-location');

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * _ad_unit_markup
		 *
		 * @param string unit_id
		 * @param bool disable_float
		 * @return string
		 */
		function _ad_unit_markup(unit_id, disable_float) {

			var float_disable = disable_float || false,
				type = app.util.get_unit_type(unit_id),
				alignment = _odd ? 'odd' : 'even',
				$html= $('<div/>');

			$html
				.addClass(_defaults.ad_class)
				.attr('data-id', unit_id)
				.attr('data-client-type', type);

			if (float_disable) {
				$html
					.addClass('disable_float');
			} else {
				$html
					.addClass('in_content')
					.addClass(alignment);
			}

			if (!float_disable) _odd = !_odd;

			return $html;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Insert Primary Unit: Unit most display above the fold
		 */
		function _insert_primary_unit() {

			var unit = _get_primary_unit(),
				tallest = admanager.util.tallest_available(unit),
				shortest = admanager.util.shortest_available(unit),
				location = _find_insertion_location({
					height: tallest,
					limit: _defaults.ad_height_limit
				}),
				markup = null
			;

			if (!location) {
				location = _find_insertion_location({
					height: shortest,
					limit: _defaults.ad_height_limit,
					force: true
				});

				if (!location.disable_float) {
					// unset large sizes
					unit = admanager.util.limit_unit_height(unit, shortest);
				}
			}

			markup = _ad_unit_markup(unit.id, location.disable_float);

			location.$insert_before.before(markup);

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _insert_secondary_units() {

			$.each(_inventory, function (index, unit) {

				var tallest = admanager.util.tallest_available(unit),
					location = _find_insertion_location({
						height: tallest
					}),
					markup = null
				;

				if (!location) {
					return false;
				}

				markup = _ad_unit_markup(unit.id, location.disable_float);
				location.$insert_before.before(markup);

			} );

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _get_next_unit() {

			var next_unit = false;

			$.each(_inventory, function (index, unit) {

				if ($('[data-id="' + unit.id + '"]').length !== 0) return true;

				next_unit = unit;
				return false;

			} );

			return next_unit;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		function _get_primary_unit() {

			var primary_unit = false;

			$.each(_inventory, function (index, unit) {

				if (unit.primary === true) {
					primary_unit = unit;
					_inventory.remove(index);
					return false;
				}

			} );

			if (!primary_unit) {
				primary_unit = _inventory[0];
				_inventory.remove(0);
			}

			return primary_unit;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * _find_insertion_location
		 *
		 * @param object options
		 * @return object or boolean:false
		 */
		function _find_insertion_location(options) {

			options = options || {};

			var $nodes = _get_nodes(),
				node_search = new NodeSearch({
					$nodes: $nodes,
					force: options.force ? options.force : false,
					limit: options.limit ? options.limit : false,
					height: options.height
				})
			;

			if ($nodes.length < 1) return false;

			// Loop through each node as necessary
			$.each($nodes, function (i, node) {

				var exit_loop = node_search.verify_node(i, $(node));

				if (exit_loop === true) {
					return false;
				} else if (exit_loop === false) {
					return true;
				}

			});

			if (!node_search.location_found) {
				return false;
			}

			node_search.mark_valid_nodes();
			node_search.set_last_position();

			return {
				'$insert_before' : node_search.$insert_before,
				'disable_float' : node_search.disable_float
			};

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Search object used for determining insertion points
		 *
		 */
		function NodeSearch(options) {

			this.total_height = 0;
			this.margin_difference = 40;
			this.inserted = [];
			this.$insert_before = null;
			this.disable_float = false;
			this.location_found = false;
			this.valid_height = 0;
			this.exit_loop = false;
			this.height = options.height;
			this.force = options.force;
			this.limit = options.limit;
			this.$nodes = options.$nodes;
			this.last_position = 0;
			this.needed_height = options.height - this.margin_difference;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Store the position of the last ad
		 *
		 */
		NodeSearch.prototype.set_last_position = function () {

			this.last_position = this.$insert_before.offset().top + this.needed_height;

		};

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Mark nodes where insertion is valid
		 *
		 */
		NodeSearch.prototype.mark_valid_nodes = function () {

			if (this.inserted.length > 0) {
				$.each(this.inserted, function (index, item) {
					$(item).data('valid-location', false);
				});
			}

		};

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Verify each node to find a suitable insertion point
		 *
		 * @return boolean
		 */
		NodeSearch.prototype.verify_node = function (index, $node) {

			var since = $node.offset().top - this.last_position,
				height = $node.outerHeight(),
				is_last = (this.$nodes.length - 1) === index;

			this.total_height += height;

			if (this.force && (this.total_height >= this.limit || is_last)) {

				this.$insert_before = $node;
				this.disable_float = true;
				this.location_found = true;
				this.exit_loop = true;

			} else if (this.limit && (this.total_height >= this.limit || is_last)) {

				this.location_found = false;
				this.exit_loop = true;

			} else if (_is_valid_insertion_location($node)) {

				this.valid_height += height;
				this.inserted.push($node);

				if (this.$insert_before === null) {
					this.$insert_before = $node;
				}

				if (this.valid_height >= this.needed_height) {

					if (this.limit === false && (since < _defaults.px_between_units)) {

						this.valid_height = 0;
						this.$insert_before = null;

					}

					this.location_found = true;
					this.exit_loop = true;

				}

			} else {

				this.valid_height = 0;
				this.$insert_before = null;
				this.exit_loop = null;

			}

			return this.exit_loop;

		};

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Is Element an Ad Unit
		 *
		 * @param mixed $el
		 * @return bool
		 */
		function _is_this_an_ad($el) {

			if (!$el) return false;

			return $el.is(_defaults.ad_selector);

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		/**
		 * Get Nodes to Loop Through
		 *
		 * @return array $nodes
		 */
		function _get_nodes() {

			var $prev_unit = $local_context.find(_defaults.ad_selector).last(),
				$nodes = null;

			// nodes after previous unit or all nodes
			if ($prev_unit.length > 0) {
				$nodes = $prev_unit.nextAll($local_context);
			} else {
				$nodes = $local_context.children();
			}

			return $nodes;

		}

		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

		return {
			init : _init
		};

	} ($));

	return app;

} (admanager || {}, jQuery));