/**
 * ad-manager - Generic code for GPT ad management
 *
 * @author Athletics - http://athleticsnyc.com
 * @see https://github.com/athletics/ad-manager
 * @version 0.1.0 (2014-10-28)
 */
var admanager = function(app) {
    if (typeof app.initialized == "undefined") {
        app.initialized = false;
    }
    app.bootstrap = function() {
        var _name = "Bootstrap", $ = null, debug = null, _init_callbacks = [];
        function init(config) {
            if (app.initialized) return false;
            admanager.config = config || false;
            if (!admanager.config) {
                throw new Error("Please provide config");
            }
            $ = jQuery;
            app.util.init().events.init().manager.init().insertion.init();
            debug = admanager.util.debug ? admanager.util.debug : function() {};
            for (var i = 0; i < _init_callbacks.length; i++) {
                _init_callbacks[i]();
            }
            debug(_name + ": initialized");
            app.initialized = true;
            return app;
        }
        function register(callback) {
            _init_callbacks.push(callback);
        }
        return {
            init: init,
            register: register
        };
    }();
    return app;
}(admanager || {});

var admanager = function(app, $) {
    app.events = function($) {
        var _name = "Events", debug = null;
        function init() {
            debug = admanager.util.debug ? admanager.util.debug : function() {};
            debug(_name + ": initialized");
            _broadcast_events();
            return app;
        }
        function _broadcast_events() {
            $(document).on("scroll", function() {
                window.requestAnimationFrame(function() {
                    $.event.trigger("GPT:scroll");
                    $.event.trigger("GPT:updateUI");
                });
            }).on("resize", function() {
                window.requestAnimationFrame(function() {
                    $.event.trigger("GPT:resize");
                    $.event.trigger("GPT:updateUI");
                });
            });
        }
        return {
            init: init
        };
    }($);
    return app;
}(admanager || {}, jQuery);

var admanager = function(app, $) {
    app.insertion = function($) {
        var _name = "Insertion", debug = null, $target = null, _inventory = [], last_position = 0, odd = true;
        function init() {
            debug = admanager.util.debug ? admanager.util.debug : function() {};
            debug(_name + ": initialized");
            $target = $(app.config.insertion_selector).first();
            if ($target.length < 1) {
                _broadcast();
                return app;
            }
            _inventory = app.manager.get_dynamic_inventory();
            _insert_ad_units();
            return app;
        }
        function _broadcast() {
            $.event.trigger("GPT:unitsInserted");
        }
        function _insert_ad_units() {
            _denote_valid_insertions();
            _insert_primary_unit();
            _insert_secondary_units();
            _broadcast();
        }
        function _denote_valid_insertions() {
            var $nodes = $target.children(), excluded = [ "img", "iframe", "video", "audio", ".video", ".audio", ".app_ad_unit" ];
            $nodes.each(function(i) {
                var $element = $(this), $prev = i > 0 ? $nodes.eq(i - 1) : false, valid = true;
                $.each(excluded, function(index, item) {
                    if ($element.is(item) || $element.find(item).length > 0) {
                        valid = false;
                        return false;
                    }
                });
                if ($prev && $prev.is("p") && $prev.find("img").length === 1) valid = false;
                $element.data("valid-location", valid);
            });
        }
        function _is_valid_insertion_location($element) {
            return $element.data("valid-location");
        }
        function _ad_unit_markup(unit, disable_float) {
            disable_float = disable_float || false;
            var type = admanager.util.is_mobile() ? "mobile" : "desktop", alignment = odd ? "odd" : "even", html = '<div class="app_ad_unit in_content ' + alignment + " " + type + '" data-type="' + unit + '"></div>', html_disable_float = '<div class="app_ad_unit disable_float ' + type + '" data-type="' + unit + '"></div>';
            if (!disable_float) odd = !odd;
            return disable_float ? html_disable_float : html;
        }
        function _insert_primary_unit() {
            var unit = _get_primary_unit(), location = _location_to_insert_ad_unit(unit, {
                limit: 1e3
            }), markup = _ad_unit_markup(unit.type, location.disable_float);
            location.$insert_before.before(markup);
        }
        function _insert_secondary_units() {
            $.each(_inventory, function(index, unit) {
                var location = _location_to_insert_ad_unit(unit), markup = null;
                if (!location) {
                    return false;
                }
                markup = _ad_unit_markup(unit.type, location.disable_float);
                location.$insert_before.before(markup);
            });
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
        function _location_to_insert_ad_unit(unit, options) {
            options = options || {};
            var $nodes = _get_nodes(), $insert_before = null, inserted = [], total_height = 0, valid_height = 0, limit = options.limit ? options.limit : false, margin_difference = 40, needed_height = _tallest_available(unit) - margin_difference, between_units = 800, location_found = false, disable_float = false, maybe_more = true;
            if ($nodes.length < 1) return false;
            $nodes.each(function(i) {
                var $this = $(this), $prev = i > 0 ? $nodes.eq(i - 1) : false, offset = $this.offset().top, since = offset - last_position, height = $this.outerHeight(), is_last = $nodes.length - 1 === i;
                total_height += height;
                if (limit && (total_height >= limit || is_last)) {
                    $insert_before = $this;
                    disable_float = true;
                    location_found = true;
                    return false;
                }
                if (_is_valid_insertion_location($this)) {
                    valid_height += height;
                    inserted.push($this);
                    if ($insert_before === null) {
                        $insert_before = $this;
                    }
                    if (valid_height >= needed_height) {
                        if (limit === false && since < between_units) {
                            valid_height = 0;
                            $insert_before = null;
                            return true;
                        }
                        location_found = true;
                        return false;
                    }
                } else {
                    valid_height = 0;
                    $insert_before = null;
                }
            });
            if (!location_found) {
                return false;
            }
            if (inserted.length > 0) {
                $.each(inserted, function(index, item) {
                    $(item).data("valid-location", false);
                });
            }
            last_position = $insert_before.offset().top + needed_height;
            return {
                $insert_before: $insert_before,
                disable_float: disable_float
            };
        }
        function _is_this_an_ad($el) {
            if (!$el) return false;
            return $el.is(".app_ad_unit");
        }
        function _get_nodes() {
            var $prev_unit = $target.find(".app_ad_unit").last(), $nodes = null;
            $nodes = $prev_unit.length > 0 ? $prev_unit.nextAll($target) : $target.children();
            return $nodes;
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
        return {
            init: init
        };
    }($);
    return app;
}(admanager || {}, jQuery);

var admanager = function(app, $) {
    app.manager = function($) {
        var _name = "Manager", debug = null, defined_slots = [], page_positions = [], _inventory = [], account = null, has_mobile_ads = true;
        function init() {
            debug = admanager.util.debug ? admanager.util.debug : function() {};
            debug(_name + ": initialized");
            _inventory = _get_available_sizes(app.config.inventory);
            account = app.config.account;
            has_mobile_ads = typeof app.config.has_mobile_ads !== "undefined" ? app.config.has_mobile_ads : has_mobile_ads;
            _listen_for_custom_events();
            return app;
        }
        function _listen_for_custom_events() {
            $(document).on("GPT:unitsInserted", function() {
                debug(_name + ": GPT:unitsInserted");
                _load_library();
            }).on("GPT:libraryLoaded", function() {
                debug(_name + ": GPT:libraryLoaded");
                _listen_for_dfp_events();
                _enable_single_request();
                _set_targeting();
                _set_page_positions();
                _define_slots_for_page_positions();
            }).on("GPT:slotsDefined", function() {
                debug(_name + ": GPT:slotsDefined");
                _display_page_ads();
            });
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
            window.googletag = window.googletag || {};
            window.googletag.cmd = window.googletag.cmd || [];
            var useSSL = "https:" === document.location.protocol, path = (useSSL ? "https:" : "http:") + "//www.googletagservices.com/tag/js/gpt.js";
            $LAB.script(path).wait(function() {
                _on_library_loaded();
            });
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
                var page_config = app.util.page_config(), targeting = page_config.targeting;
                if (typeof targeting !== "undefined") {
                    $.each(targeting, function(key, value) {
                        googletag.pubads().setTargeting(key, value);
                    });
                }
            });
        }
        function _set_page_positions() {
            if (!app.util.is_mobile() || !has_mobile_ads) {
                _set_desktop_page_positions();
            }
        }
        function _set_desktop_page_positions() {
            var $units = $(".app_ad_unit");
            $units.each(function() {
                var $unit = $(this), type = $unit.data("type");
                page_positions.push(type);
            });
        }
        function _define_slots_for_page_positions() {
            var current_position = null;
            googletag.cmd.push(function() {
                for (var i = 0; i < page_positions.length; i++) {
                    _increment_ad_slot(page_positions[i]);
                    current_position = get_ad_info(page_positions[i]);
                    if (typeof current_position.type == "undefined") continue;
                    var $unit = $('.app_ad_unit[data-type="' + current_position.type + '"]');
                    if ($unit.length < 1) continue;
                    $unit.html('<div class="app_unit_target" id="' + current_position.id_name + '"></div>');
                    $unit.addClass("active");
                    defined_slots[i] = googletag.defineSlot("/" + account + "/" + current_position.slot, current_position.sizes, current_position.id_name).addService(googletag.pubads());
                }
                googletag.enableServices();
                $.event.trigger("GPT:slotsDefined");
            });
        }
        function _display_page_ads() {
            googletag.cmd.push(function() {
                googletag.pubads().refresh(defined_slots);
                for (var n = 0; n < page_positions.length; n++) {
                    current_position = get_ad_info(page_positions[n]);
                    if ($("#" + current_position.id_name).length > 0) {
                        googletag.display(current_position.id_name);
                    }
                }
            });
        }
        function _slot_render_ended(unit) {
            var unit_name = unit.slot.getAdUnitPath().replace("/" + account + "/", "");
            $.event.trigger("GPT:adUnitRendered", {
                name: unit_name,
                size: unit.size
            });
        }
        function _increment_ad_slot(unit) {
            for (var i = 0; i < _inventory.length; i++) {
                if (_inventory[i].type !== unit && _inventory[i].slot !== unit) continue;
                if (typeof _inventory[i].iteration == "undefined") _inventory[i].iteration = 0;
                _inventory[i].iteration = _inventory[i].iteration + 1;
                return;
            }
        }
        function get_ad_info(unit) {
            var return_object = {};
            for (var i = 0; i < _inventory.length; i++) {
                if (_inventory[i].type !== unit && _inventory[i].slot !== unit) continue;
                return_object = _inventory[i];
                if (typeof return_object.use_iterator != "undefined" && !return_object.use_iterator) {
                    return_object.id_name = return_object.type;
                } else {
                    return_object.id_name = return_object.type + "_" + return_object.iteration;
                }
                return return_object;
            }
            return return_object;
        }
        function _get_defined_slot(name) {
            var defined_slot = null;
            $.each(defined_slots, function(i, slot) {
                var unit_name = slot.getAdUnitPath().replace("/" + account + "/", "");
                if (unit_name === name) {
                    defined_slot = slot;
                    return false;
                }
            });
            return defined_slot;
        }
        function display_slot(unit) {
            googletag.cmd.push(function() {
                var position = get_ad_info(unit), slot = _get_defined_slot(position.slot);
                googletag.pubads().refresh([ slot ]);
                googletag.display(position.id_name);
                remove_defined_slot(position.slot);
            });
        }
        function remove_defined_slot(name) {
            $.each(defined_slots, function(index, slot) {
                var unit_name = slot.getAdUnitPath().replace("/" + account + "/", "");
                if (unit_name === name) defined_slots.remove(index);
            });
        }
        function get_dynamic_inventory() {
            var dynamic_inventory = [];
            $.each(_inventory, function(index, position) {
                if (position.dynamic === true) dynamic_inventory.push(position);
            });
            return dynamic_inventory;
        }
        return {
            init: init,
            get_ad_info: get_ad_info,
            display_slot: display_slot,
            remove_defined_slot: remove_defined_slot,
            get_dynamic_inventory: get_dynamic_inventory
        };
    }($);
    return app;
}(admanager || {}, jQuery);

var admanager = function(app, $) {
    app.util = function($) {
        var _name = "Util", _debug_enable = false;
        function init() {
            debug(_name + ": initialized");
            _init_array_remove();
            _set_window_request_animation_frame();
            return app;
        }
        function debug(obj) {
            if (!_debug_enable) return;
            if (typeof console == "object" && console.log) {
                console.log(obj);
            }
        }
        function difference(array, values) {
            var diff = [];
            $.grep(array, function(element) {
                if ($.inArray(element, values) === -1) diff.push(element);
            });
            return diff;
        }
        function is_mobile() {
            return $(window).width() < 768 ? true : false;
        }
        function _set_window_request_animation_frame() {
            window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame;
        }
        function _init_array_remove() {
            Array.prototype.remove = function(from, to) {
                var rest = this.slice((to || from) + 1 || this.length);
                this.length = from < 0 ? this.length + from : from;
                return this.push.apply(this, rest);
            };
        }
        function page_config() {
            if (typeof app.config.page_config_selector === "undefined") return {};
            var config = $(app.config.page_config_selector).data("page-config");
            if (typeof config !== "object") return {};
            return config;
        }
        return {
            init: init,
            debug: debug,
            difference: difference,
            is_mobile: is_mobile,
            page_config: page_config
        };
    }($);
    return app;
}(admanager || {}, jQuery);
window.AdManager = admanager.bootstrap.init;