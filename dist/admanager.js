/**
 * ad-manager - Generic code for GPT ad management
 *
 * @author Athletics - http://athleticsnyc.com
 * @see https://github.com/athletics/ad-manager
 * @version 0.2.0 (2014-12-17)
 */
var admanager = function(app) {
    if (typeof app.initialized === "undefined") {
        app.initialized = false;
    }
    app.bootstrap = function() {
        var _name = "Bootstrap", $ = null, debug = null, _init_callbacks = [];
        function _init(config) {
            if (app.initialized) return false;
            admanager.config = config || false;
            if (!admanager.config) {
                throw new Error("Please provide config");
            }
            $ = jQuery;
            debug = admanager.util.debug ? admanager.util.debug : function() {};
            app.util.init().manager.init().insertion.init();
            for (var i = 0; i < _init_callbacks.length; i++) {
                _init_callbacks[i]();
            }
            debug(_name + ": initialized");
            app.initialized = true;
            return app;
        }
        function _register(callback) {
            _init_callbacks.push(callback);
        }
        return {
            init: _init,
            register: _register
        };
    }();
    return app;
}(admanager || {});

var admanager = function(app, $) {
    app.insertion = function($) {
        var _name = "Insertion", debug = null, $context = null, $local_context = null, _in_content = false, _inventory = [], _last_position = 0, _odd = true, _local_context = null, _defaults = {
            px_between_units: 800,
            ad_height_limit: 1e3,
            insert_exclusion: [ "img", "iframe", "video", "audio", ".video", ".audio", ".app_ad_unit" ]
        };
        function _init() {
            debug = admanager.util.debug ? admanager.util.debug : function() {};
            debug(_name + ": initialized");
            _defaults = $.extend(_defaults, app.manager.get_defaults());
            _bind_handlers();
        }
        function _bind_handlers() {
            $(document).on("GPT:initSequence", function() {
                debug(_name + ": GPT:initSequence");
                _qualify_context();
            });
        }
        function _set_context() {
            $context = app.util.get_context();
        }
        function _qualify_context() {
            var inventory_data = app.manager.get_dynamic_inventory();
            _set_context();
            _inventory = _inventory.length > 0 ? _inventory : inventory_data.dynamic_items;
            _local_context = _local_context ? _local_context : inventory_data.local_context;
            if (_inventory.length < 1) {
                _broadcast();
                return app;
            }
            $local_context = $context.find(_local_context).first();
            if ($local_context.length > 0) {
                _in_content = true;
            }
            if (!_in_content) {
                _broadcast();
                return app;
            }
            _insert_ad_units();
            return app;
        }
        function _broadcast() {
            $.event.trigger("GPT:unitsInserted");
        }
        function _is_enabled() {
            var page_config = app.manager.get_config();
            if (typeof page_config.insertion_enabled === "undefined") return false;
            return page_config.insertion_enabled;
        }
        function _insert_ad_units() {
            if (_in_content) {
                _denote_valid_insertions();
                _insert_primary_unit();
                _insert_secondary_units();
            }
            _broadcast();
        }
        function _denote_valid_insertions() {
            var $nodes = $local_context.children(), excluded = app.config.insert_exclusion || _defaults.insert_exclusion;
            $nodes.each(function(i) {
                var $element = $(this), $prev = i > 0 ? $nodes.eq(i - 1) : false, valid = true;
                $.each(excluded, function(index, item) {
                    if ($element.is(item) || $element.find(item).length > 0) {
                        valid = false;
                        return false;
                    }
                });
                if ($prev && $prev.is("p") && $prev.find("img").length === 1) valid = false;
                $element.attr("data-valid-location", valid);
            });
        }
        function _is_valid_insertion_location($element) {
            return $element.data("valid-location");
        }
        function _ad_unit_markup(unit_id, disable_float) {
            var float_disable = disable_float || false, type = app.util.get_unit_type(unit_id), alignment = _odd ? "odd" : "even", $html = $("<div/>");
            $html.addClass(_defaults.ad_class).attr("data-id", unit_id).attr("data-client-type", type);
            if (float_disable) {
                $html.addClass("disable_float");
            } else {
                $html.addClass("in_content").addClass(alignment);
            }
            if (!float_disable) _odd = !_odd;
            return $html;
        }
        function _insert_primary_unit() {
            var unit = _get_primary_unit(), tallest = admanager.util.tallest_available(unit), shortest = admanager.util.shortest_available(unit), location = _find_insertion_location({
                height: tallest,
                limit: _defaults.ad_height_limit
            }), markup = null;
            if (!location) {
                location = _find_insertion_location({
                    height: shortest,
                    limit: _defaults.ad_height_limit,
                    force: true
                });
                if (!location.disable_float) {
                    unit = admanager.util.limit_unit_height(unit, shortest);
                }
            }
            markup = _ad_unit_markup(unit.id, location.disable_float);
            location.$insert_before.before(markup);
        }
        function _insert_secondary_units() {
            $.each(_inventory, function(index, unit) {
                var tallest = admanager.util.tallest_available(unit), location = _find_insertion_location({
                    height: tallest
                }), markup = null;
                if (!location) {
                    return false;
                }
                markup = _ad_unit_markup(unit.id, location.disable_float);
                location.$insert_before.before(markup);
            });
        }
        function _get_next_unit() {
            var next_unit = false;
            $.each(_inventory, function(index, unit) {
                if ($('[data-id="' + unit.id + '"]').length !== 0) return true;
                next_unit = unit;
                return false;
            });
            return next_unit;
        }
        function _get_primary_unit() {
            var primary_unit = false;
            $.each(_inventory, function(index, unit) {
                if (unit.primary === true) {
                    primary_unit = unit;
                    _inventory.remove(index);
                    return false;
                }
            });
            if (!primary_unit) {
                primary_unit = _inventory[0];
                _inventory.remove(0);
            }
            return primary_unit;
        }
        function _find_insertion_location(options) {
            options = options || {};
            var $nodes = _get_nodes(), node_search = new NodeSearch({
                $nodes: $nodes,
                force: options.force ? options.force : false,
                limit: options.limit ? options.limit : false,
                last_position: _last_position,
                height: options.height
            });
            if ($nodes.length < 1) return false;
            $.each($nodes, function(i, node) {
                var exit = node_search.verify_node(i, $(node));
                if (exit === true) {
                    return false;
                } else {
                    return true;
                }
            });
            if (!node_search.location_found) {
                return false;
            }
            node_search.mark_valid_nodes();
            node_search.set_last_position();
            return {
                $insert_before: node_search.$insert_before,
                disable_float: node_search.disable_float
            };
        }
        function NodeSearch(options) {
            this.total_height = 0;
            this.margin_difference = 40;
            this.inserted = [];
            this.$insert_before = null;
            this.disable_float = false;
            this.location_found = false;
            this.valid_height = 0;
            this.exit = false;
            this.height = options.height;
            this.force = options.force;
            this.limit = options.limit;
            this.$nodes = options.$nodes;
            this.last_position = options.last_position;
            this.needed_height = options.height - this.margin_difference;
        }
        NodeSearch.prototype.set_last_position = function() {
            this.last_position = this.$insert_before.offset().top + this.needed_height;
        };
        NodeSearch.prototype.mark_valid_nodes = function() {
            if (this.inserted.length > 0) {
                $.each(this.inserted, function(index, item) {
                    $(item).data("valid-location", false);
                });
            }
        };
        NodeSearch.prototype.verify_node = function(index, $node) {
            var $prev = index > 0 ? this.$nodes.eq(index - 1) : false, offset = $node.offset().top, since = offset - this.last_position, height = $node.outerHeight(), is_last = this.$nodes.length - 1 === index;
            this.exit = false;
            this.total_height += height;
            if (this.force && (this.total_height >= this.limit || is_last)) {
                this.$insert_before = $node;
                this.disable_float = true;
                this.location_found = true;
                this.exit = true;
                return this.exit;
            } else if (this.limit && (this.total_height >= this.limit || is_last)) {
                this.location_found = false;
                this.exit = true;
                return this.exit;
            }
            if (_is_valid_insertion_location($node)) {
                this.valid_height += height;
                this.inserted.push($node);
                if (this.$insert_before === null) {
                    this.$insert_before = $node;
                }
                if (this.valid_height >= this.needed_height) {
                    if (this.limit === false && since < _defaults.px_between_units) {
                        this.valid_height = 0;
                        this.$insert_before = null;
                        return this.exit;
                    }
                    this.location_found = true;
                    this.exit = true;
                    return this.exit;
                }
            } else {
                this.valid_height = 0;
                this.$insert_before = null;
            }
        };
        function _is_this_an_ad($el) {
            if (!$el) return false;
            return $el.is(_defaults.ad_selector);
        }
        function _get_nodes() {
            var $prev_unit = $local_context.find(_defaults.ad_selector).last(), $nodes = null;
            if ($prev_unit.length > 0) {
                $nodes = $prev_unit.nextAll($local_context);
            } else {
                $nodes = $local_context.children();
            }
            return $nodes;
        }
        return {
            init: _init
        };
    }($);
    return app;
}(admanager || {}, jQuery);

var admanager = function(app, $) {
    app.manager = function($) {
        var _name = "Manager", debug = null, _defined_slots = [], _page_positions = [], _inventory = [], _account = null, _defaults = {
            ad_class: "app_ad_unit",
            ad_unit_target_class: "app_unit_target",
            ad_selector: ""
        };
        function _init() {
            debug = admanager.util.debug ? admanager.util.debug : function() {};
            debug(_name + ": initialized");
            if (!_is_enabled()) return app;
            _defaults.ad_selector = "." + _defaults.ad_class;
            _inventory = _get_inventory();
            _account = app.config.account;
            _bind_handlers();
            _load_library();
            return app;
        }
        function _bind_handlers() {
            $(document).on("GPT:unitsInserted", function() {
                debug(_name + ": GPT:unitsInserted");
            }).on("GPT:libraryLoaded", function() {
                debug(_name + ": GPT:libraryLoaded");
                _init_sequence();
            }).on("GPT:slotsDefined", function() {
                debug(_name + ": GPT:slotsDefined");
                _display_page_ads();
            });
        }
        function _init_sequence() {
            $.event.trigger("GPT:initSequence");
            _listen_for_dfp_events();
            _enable_single_request();
            _set_targeting();
            _set_page_positions();
            _define_slots_for_page_positions();
        }
        function _get_inventory() {
            return _get_available_sizes(_inventory_clean_types(app.config.inventory));
        }
        function _inventory_clean_types(_inventory) {
            for (var i = 0; i < _inventory.length; i++) {
                if (typeof _inventory[i].type !== "undefined") continue;
                _inventory[i].type = "default";
            }
            return _inventory;
        }
        function _get_available_sizes(_inventory) {
            var width = window.innerWidth > 0 ? window.innerWidth : screen.width;
            if (width > 1024) return _inventory;
            if (width >= 768 && width <= 1024) {
                var max = 980;
                for (var i = 0; i < _inventory.length; i++) {
                    var sizes_to_remove = [];
                    for (var j = 0; j < _inventory[i].sizes.length; j++) {
                        if (_inventory[i].sizes[j][0] > max) {
                            sizes_to_remove.push(_inventory[i].sizes[j]);
                        }
                    }
                    _inventory[i].sizes = app.util.difference(_inventory[i].sizes, sizes_to_remove);
                }
            }
            return _inventory;
        }
        function _load_library() {
            var googletag, gads, useSSL, node, readyStateLoaded = false;
            window.googletag = window.googletag || {};
            googletag = window.googletag;
            googletag.cmd = googletag.cmd || [];
            gads = document.createElement("script");
            gads.async = true;
            gads.type = "text/javascript";
            useSSL = "https:" == document.location.protocol;
            gads.src = (useSSL ? "https:" : "http:") + "//www.googletagservices.com/tag/js/gpt.js";
            if (gads.addEventListener) {
                gads.addEventListener("load", _on_library_loaded, false);
            } else if (gads.readyState) {
                gads.onreadystatechange = function() {
                    if (!readyStateLoaded) {
                        readyStateLoaded = true;
                        _on_library_loaded();
                    }
                };
            }
            node = document.getElementsByTagName("script")[0];
            node.parentNode.insertBefore(gads, node);
        }
        function _on_library_loaded() {
            googletag.cmd.push(function() {
                $.event.trigger("GPT:libraryLoaded");
            });
        }
        function _listen_for_dfp_events() {
            googletag.cmd.push(function() {
                googletag.pubads().addEventListener("slotRenderEnded", function(event) {
                    _slot_render_ended(event);
                });
            });
        }
        function _enable_single_request() {
            googletag.cmd.push(function() {
                googletag.pubads().collapseEmptyDivs();
                googletag.pubads().enableSingleRequest();
                googletag.pubads().disableInitialLoad();
            });
        }
        function _set_targeting() {
            googletag.cmd.push(function() {
                var page_config = _get_config(), targeting = page_config.targeting;
                if (typeof targeting !== "undefined") {
                    $.each(targeting, function(key, value) {
                        googletag.pubads().setTargeting(key, value);
                    });
                }
            });
        }
        function _set_page_positions() {
            var client_type = typeof app.config.client_type !== "undefined" ? app.config.client_type : false, $context = app.util.get_context(), $units = null, selector = _defaults.ad_selector;
            if (client_type !== false) {
                selector += '[data-client-type="' + client_type + '"]';
            }
            $units = $context.find(selector);
            $units.each(function() {
                var id = $(this).data("id");
                _page_positions.push(id);
            });
        }
        function _define_slots_for_page_positions() {
            googletag.cmd.push(function() {
                var current_position = null, $context = app.util.get_context(), $unit, $unit_target;
                for (var i = 0; i < _page_positions.length; i++) {
                    _increment_ad_slot(_page_positions[i]);
                    current_position = _get_ad_info(_page_positions[i]);
                    if (typeof current_position.id == "undefined") continue;
                    $unit = $context.find(_defaults.ad_selector + '[data-id="' + current_position.id + '"]');
                    $unit_target = $("<div/>");
                    if ($unit.length < 1) continue;
                    $unit_target.addClass(_defaults.ad_unit_target_class);
                    $unit_target.attr("id", current_position.id_name);
                    $unit.append($unit_target);
                    $unit.addClass("active");
                    _defined_slots[i] = googletag.defineSlot("/" + _account + "/" + current_position.slot, current_position.sizes, current_position.id_name).addService(googletag.pubads());
                }
                googletag.enableServices();
                $.event.trigger("GPT:slotsDefined");
            });
        }
        function _display_page_ads() {
            googletag.cmd.push(function() {
                googletag.pubads().refresh(_defined_slots);
                for (var n = 0; n < _page_positions.length; n++) {
                    current_position = _get_ad_info(_page_positions[n]);
                    if ($("#" + current_position.id_name).length > 0) {
                        googletag.display(current_position.id_name);
                    }
                }
            });
        }
        function _slot_render_ended(unit) {
            var unit_name = unit.slot.getAdUnitPath().replace("/" + _account + "/", "");
            $.event.trigger("GPT:adUnitRendered", {
                name: unit_name,
                size: unit.size
            });
        }
        function _increment_ad_slot(unit) {
            for (var i = 0; i < _inventory.length; i++) {
                if (_inventory[i].id !== unit && _inventory[i].slot !== unit) continue;
                if (typeof _inventory[i].iteration == "undefined") _inventory[i].iteration = 0;
                _inventory[i].iteration = _inventory[i].iteration + 1;
                return;
            }
        }
        function _get_ad_info(unit) {
            var return_object = {};
            for (var i = 0; i < _inventory.length; i++) {
                if (_inventory[i].id !== unit && _inventory[i].slot !== unit) continue;
                return_object = _inventory[i];
                if (typeof return_object.use_iterator != "undefined" && !return_object.use_iterator) {
                    return_object.id_name = return_object.id;
                } else {
                    return_object.id_name = return_object.id + "_" + return_object.iteration;
                }
                return return_object;
            }
            return return_object;
        }
        function _get_defined_slot(name) {
            var defined_slot = null;
            $.each(_defined_slots, function(i, slot) {
                var unit_name = slot.getAdUnitPath().replace("/" + _account + "/", "");
                if (unit_name === name) {
                    defined_slot = slot;
                    return false;
                }
            });
            return defined_slot;
        }
        function _display_slot(unit) {
            googletag.cmd.push(function() {
                var position = _get_ad_info(unit), slot = _get_defined_slot(position.slot);
                googletag.pubads().refresh([ slot ]);
                googletag.display(position.id_name);
                _remove_defined_slot(position.slot);
            });
        }
        function _remove_defined_slot(name) {
            $.each(_defined_slots, function(index, slot) {
                var unit_name = slot.getAdUnitPath().replace("/" + _account + "/", "");
                if (unit_name === name) _defined_slots.remove(index);
            });
        }
        function _get_dynamic_inventory() {
            var dynamic_items = [], type = typeof app.config.client_type !== "undefined" ? app.config.client_type : false, local_context;
            $.each(_inventory, function(index, position) {
                if (typeof position.dynamic !== "undefined" && position.dynamic === true) {
                    if (!type || type === position.type) {
                        dynamic_items.push(position);
                        local_context = position.local_context;
                    }
                }
            });
            return {
                dynamic_items: dynamic_items,
                local_context: local_context
            };
        }
        function _get_config() {
            return app.config;
        }
        function _is_enabled() {
            var $context = app.util.get_context(), attr_name = "page-ad-config";
            if (typeof app.config.page_config_attr !== "undefined") {
                attr_name = app.config.page_config_attr;
            }
            app.config = app.util.import_config({
                $context: $context,
                attr_name: attr_name,
                exist_config: app.config
            });
            if (typeof app.config.enabled === "undefined") return true;
            return app.config.enabled;
        }
        function _empty_ads(options) {
            var $context = options.$context, remove_container = options.remove_container || false;
            $context.find(_defaults.ad_selector).empty();
            if (remove_container) {
                $context.find(_defaults.ad_selector).remove();
            }
        }
        function _get_defaults() {
            return _defaults;
        }
        return {
            init: _init,
            is_enabled: _is_enabled,
            get_config: _get_config,
            get_defaults: _get_defaults,
            get_ad_info: _get_ad_info,
            display_slot: _display_slot,
            remove_defined_slot: _remove_defined_slot,
            get_dynamic_inventory: _get_dynamic_inventory,
            init_sequence: _init_sequence,
            empty_ads: _empty_ads
        };
    }($);
    return app;
}(admanager || {}, jQuery);

var admanager = function(app, $) {
    app.util = function($) {
        var _name = "Util", _debug_enable = false;
        function _init() {
            debug(_name + ": initialized");
            _init_array_remove();
            return app;
        }
        function debug(obj) {
            if (!_debug_enable) return;
            if (typeof console == "object" && console.log) {
                console.log(obj);
            }
        }
        function _difference(array, values) {
            var diff = [];
            $.grep(array, function(element) {
                if ($.inArray(element, values) === -1) diff.push(element);
            });
            return diff;
        }
        function _init_array_remove() {
            Array.prototype.remove = function(from, to) {
                var rest = this.slice((to || from) + 1 || this.length);
                this.length = from < 0 ? this.length + from : from;
                return this.push.apply(this, rest);
            };
        }
        function _import_config(options) {
            var $context = options.$context, attr_name = options.attr_name, exist_config = options.exist_config, selector, new_config, data = {};
            selector = "*[data-" + attr_name + "]";
            new_config = $.extend({}, exist_config);
            data = $context.find(selector).data(attr_name);
            if (typeof new_config === "object") {
                new_config = $.extend(new_config, data);
            }
            return new_config;
        }
        function _get_context() {
            var selector = app.config.context || "body";
            return $(selector);
        }
        function _shortest_available(unit) {
            var shortest = 0;
            $.each(unit.sizes, function(index, sizes) {
                if (shortest === 0) shortest = sizes[1]; else if (sizes[1] < shortest) shortest = sizes[1];
            });
            return shortest;
        }
        function _tallest_available(unit) {
            var tallest = 0;
            $.each(unit.sizes, function(index, sizes) {
                if (sizes[1] > tallest) tallest = sizes[1];
            });
            return tallest;
        }
        function _limit_unit_height(unit, limit) {
            $.each(unit.sizes, function(index, sizes) {
                if (sizes[1] <= limit) return true;
                unit.sizes.remove(index);
            });
            return unit;
        }
        function _get_unit_type(id) {
            var type = "default";
            $.each(app.config.inventory, function(index, unit) {
                if (unit.id !== id) return true;
                type = unit.type;
                return false;
            });
            return type;
        }
        return {
            init: _init,
            debug: debug,
            difference: _difference,
            import_config: _import_config,
            shortest_available: _shortest_available,
            tallest_available: _tallest_available,
            limit_unit_height: _limit_unit_height,
            get_unit_type: _get_unit_type,
            get_context: _get_context
        };
    }($);
    return app;
}(admanager || {}, jQuery);
window.AdManager = admanager.bootstrap.init;