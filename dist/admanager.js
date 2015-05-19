/**
 * ad-manager - Generic code for GPT ad management
 *
 * @author Athletics - http://athleticsnyc.com
 * @see https://github.com/athletics/ad-manager
 * @version 0.2.1 ( 2015-05-19 )
 */
var admanager = function(app, $) {
    if (typeof app.initialized === "undefined") {
        app.initialized = false;
    }
    app.bootstrap = function($) {
        var name = "Bootstrap", debug = null, initCallbacks = [];
        function init(config) {
            if (app.initialized) {
                return false;
            }
            admanager.config = config || false;
            if (!admanager.config) {
                throw new Error("Please provide config");
            }
            debug = admanager.util.debug ? admanager.util.debug : function() {};
            app.util.init().manager.init().insertion.init();
            for (var i = 0; i < initCallbacks.length; i++) {
                initCallbacks[i]();
            }
            debug(name + ": initialized");
            app.initialized = true;
            return app;
        }
        function register(callback) {
            initCallbacks.push(callback);
        }
        return {
            init: init,
            register: register
        };
    }();
    return app;
}(admanager || {}, jQuery);

var admanager = function(app, $) {
    app.insertion = function($) {
        var name = "Insertion", debug = null, $context = null, $localContext = null, inContent = false, inventory = [], odd = true, localContext = null, defaults = {
            pxBetweenUnits: 800,
            adHeightLimit: 1e3,
            insertExclusion: [ "img", "iframe", "video", "audio", ".video", ".audio", ".app_ad_unit" ]
        };
        function init() {
            debug = admanager.util.debug ? admanager.util.debug : function() {};
            debug(name + ": initialized");
            defaults = $.extend(defaults, app.manager.getDefaults());
            bindHandlers();
        }
        function bindHandlers() {
            $(document).on("GPT:initSequence", function() {
                debug(name + ": GPT:initSequence");
                qualifyContext();
            });
        }
        function setContext() {
            $context = app.util.getContext();
        }
        function qualifyContext() {
            var inventoryData = app.manager.getDynamicInventory();
            setContext();
            inventory = inventory.length ? inventory : inventoryData.dynamicItems;
            localContext = localContext ? localContext : inventoryData.localContext;
            if (!inventory.length) {
                broadcast();
                return app;
            }
            $localContext = $context.find(localContext).first();
            if ($localContext.length) {
                inContent = true;
            }
            if (!inContent) {
                broadcast();
                return app;
            }
            insertAdUnits();
            return app;
        }
        function broadcast() {
            $.event.trigger("GPT:unitsInserted");
        }
        function isEnabled() {
            var pageConfig = app.manager.getConfig();
            if (typeof pageConfig.insertionEnabled === "undefined") {
                return false;
            }
            return pageConfig.insertionEnabled;
        }
        function insertAdUnits() {
            if (inContent) {
                denoteValidInsertions();
                insertPrimaryUnit();
                insertSecondaryUnits();
            }
            broadcast();
        }
        function denoteValidInsertions() {
            var $nodes = $localContext.children(), excluded = app.config.insertExclusion || defaults.insertExclusion;
            $nodes.each(function(i) {
                var $element = $(this), $prev = i > 0 ? $nodes.eq(i - 1) : false, valid = true;
                $.each(excluded, function(index, item) {
                    if ($element.is(item) || $element.find(item).length) {
                        valid = false;
                        return false;
                    }
                });
                if ($prev && $prev.is("p") && $prev.find("img").length === 1) {
                    valid = false;
                }
                $element.attr("data-valid-location", valid);
            });
        }
        function isValidInsertionLocation($element) {
            return $element.data("valid-location");
        }
        function adUnitMarkup(unitId, disableFloat) {
            var floatDisable = disableFloat || false, type = app.util.getUnitType(unitId), alignment = odd ? "odd" : "even", $html = $("<div />");
            $html.addClass(defaults.adClass).attr("data-id", unitId).attr("data-client-type", type);
            if (floatDisable) {
                $html.addClass("disableFloat");
            } else {
                $html.addClass("inContent").addClass(alignment);
            }
            if (!floatDisable) {
                odd = !odd;
            }
            return $html;
        }
        function insertPrimaryUnit() {
            var unit = getPrimaryUnit(), tallest = admanager.util.tallestAvailable(unit), shortest = admanager.util.shortestAvailable(unit), location = findInsertionLocation({
                height: tallest,
                limit: defaults.adHeightLimit
            }), markup = null;
            if (!location) {
                location = findInsertionLocation({
                    height: shortest,
                    limit: defaults.adHeightLimit,
                    force: true
                });
                if (!location.disableFloat) {
                    unit = admanager.util.limitUnitHeight(unit, shortest);
                }
            }
            markup = adUnitMarkup(unit.id, location.disableFloat);
            location.$insertBefore.before(markup);
        }
        function insertSecondaryUnits() {
            $.each(inventory, function(index, unit) {
                var tallest = admanager.util.tallestAvailable(unit), location = findInsertionLocation({
                    height: tallest
                }), markup = null;
                if (!location) {
                    return false;
                }
                markup = adUnitMarkup(unit.id, location.disableFloat);
                location.$insertBefore.before(markup);
            });
        }
        function getPrimaryUnit() {
            var primaryUnit = false;
            $.each(inventory, function(index, unit) {
                if (unit.primary) {
                    primaryUnit = unit;
                    inventory.remove(index);
                    return false;
                }
            });
            if (!primaryUnit) {
                primaryUnit = inventory[0];
                inventory.remove(0);
            }
            return primaryUnit;
        }
        function findInsertionLocation(options) {
            options = options || {};
            var $nodes = getNodes(), nodeSearch = new NodeSearch({
                $nodes: $nodes,
                force: options.force ? options.force : false,
                limit: options.limit ? options.limit : false,
                height: options.height
            });
            if (!$nodes.length) {
                return false;
            }
            $.each($nodes, function(i, node) {
                var exitLoop = nodeSearch.verifyNode(i, $(node));
                if (exitLoop) {
                    return false;
                } else if (!exitLoop) {
                    return true;
                }
            });
            if (!nodeSearch.locationFound) {
                return false;
            }
            nodeSearch.markValidNodes();
            nodeSearch.setLastPosition();
            return {
                $insertBefore: nodeSearch.$insertBefore,
                disableFloat: nodeSearch.disableFloat
            };
        }
        function NodeSearch(options) {
            this.totalHeight = 0;
            this.marginDifference = 40;
            this.inserted = [];
            this.$insertBefore = null;
            this.disableFloat = false;
            this.locationFound = false;
            this.validHeight = 0;
            this.exitLoop = false;
            this.height = options.height;
            this.force = options.force;
            this.limit = options.limit;
            this.$nodes = options.$nodes;
            this.lastPosition = 0;
            this.neededheight = options.height - this.marginDifference;
        }
        NodeSearch.prototype.setLastPosition = function() {
            this.lastPosition = this.$insertBefore.offset().top + this.neededheight;
        };
        NodeSearch.prototype.markValidNodes = function() {
            if (this.inserted.length) {
                $.each(this.inserted, function(index, item) {
                    $(item).data("valid-location", false);
                });
            }
        };
        NodeSearch.prototype.verifyNode = function(index, $node) {
            var since = $node.offset().top - this.lastPosition, height = $node.outerHeight(), isLast = this.$nodes.length - 1 === index;
            this.totalHeight += height;
            if (this.force && (this.totalHeight >= this.limit || isLast)) {
                this.$insertBefore = $node;
                this.disableFloat = true;
                this.locationFound = true;
                this.exitLoop = true;
            } else if (this.limit && (this.totalHeight >= this.limit || isLast)) {
                this.locationFound = false;
                this.exitLoop = true;
            } else if (isValidInsertionLocation($node)) {
                this.validHeight += height;
                this.inserted.push($node);
                if (this.$insertBefore === null) {
                    this.$insertBefore = $node;
                }
                if (this.validHeight >= this.neededheight) {
                    if (!this.limit && since < defaults.pxBetweenUnits) {
                        this.validHeight = 0;
                        this.$insertBefore = null;
                    }
                    this.locationFound = true;
                    this.exitLoop = true;
                }
            } else {
                this.validHeight = 0;
                this.$insertBefore = null;
                this.exitLoop = null;
            }
            return this.exitLoop;
        };
        function isThisAnAd($el) {
            if (!$el) {
                return false;
            }
            return $el.is(defaults.adSelector);
        }
        function getNodes() {
            var $prevUnit = $localContext.find(defaults.adSelector).last(), $nodes = null;
            if ($prevUnit.length) {
                $nodes = $prevUnit.nextAll($localContext);
            } else {
                $nodes = $localContext.children();
            }
            return $nodes;
        }
        return {
            init: init
        };
    }($);
    return app;
}(admanager || {}, jQuery);

var admanager = function(app, $) {
    app.manager = function($) {
        var name = "Manager", debug = null, definedSlots = [], pagePositions = [], inventory = [], account = null, defaults = {
            adClass: "app_ad_unit",
            adUnitTargetClass: "app_unit_target",
            adSelector: ""
        };
        function init() {
            debug = admanager.util.debug ? admanager.util.debug : function() {};
            debug(name + ": initialized");
            if (!isEnabled()) {
                return app;
            }
            defaults.adSelector = "." + defaults.adClass;
            inventory = getInventory();
            account = app.config.account;
            bindHandlers();
            loadLibrary();
            return app;
        }
        function bindHandlers() {
            $(document).on("GPT:unitsInserted", function() {
                debug(name + ": GPT:unitsInserted");
            }).on("GPT:libraryLoaded", function() {
                debug(name + ": GPT:libraryLoaded");
                initSequence();
            }).on("GPT:slotsDefined", function() {
                debug(name + ": GPT:slotsDefined");
                displayPageAds();
            });
        }
        function initSequence() {
            $.event.trigger("GPT:initSequence");
            listenForDfpEvents();
            enableSingleRequest();
            setTargeting();
            setPagePositions();
            defineSlotsForPagePositions();
        }
        function getInventory() {
            return getAvailableSizes(inventoryCleanTypes(app.config.inventory));
        }
        function inventoryCleanTypes(inventory) {
            for (var i = 0; i < inventory.length; i++) {
                if (typeof inventory[i].type !== "undefined") {
                    continue;
                }
                inventory[i].type = "default";
            }
            return inventory;
        }
        function getAvailableSizes(inventory) {
            var width = window.innerWidth > 0 ? window.innerWidth : screen.width;
            if (width > 1024) {
                return inventory;
            }
            if (width >= 768 && width <= 1024) {
                var max = 980;
                for (var i = 0; i < inventory.length; i++) {
                    var sizesToRemove = [];
                    for (var j = 0; j < inventory[i].sizes.length; j++) {
                        if (inventory[i].sizes[j][0] > max) {
                            sizesToRemove.push(inventory[i].sizes[j]);
                        }
                    }
                    inventory[i].sizes = app.util.difference(inventory[i].sizes, sizesToRemove);
                }
            }
            return inventory;
        }
        function loadLibrary() {
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
                gads.addEventListener("load", onLibraryLoaded, false);
            } else if (gads.readyState) {
                gads.onreadystatechange = function() {
                    if (!readyStateLoaded) {
                        readyStateLoaded = true;
                        onLibraryLoaded();
                    }
                };
            }
            node = document.getElementsByTagName("script")[0];
            node.parentNode.insertBefore(gads, node);
        }
        function onLibraryLoaded() {
            googletag.cmd.push(function() {
                $.event.trigger("GPT:libraryLoaded");
            });
        }
        function listenForDfpEvents() {
            googletag.cmd.push(function() {
                googletag.pubads().addEventListener("slotRenderEnded", function(event) {
                    slotRenderEnded(event);
                });
            });
        }
        function enableSingleRequest() {
            googletag.cmd.push(function() {
                googletag.pubads().collapseEmptyDivs();
                googletag.pubads().enableSingleRequest();
                googletag.pubads().disableInitialLoad();
            });
        }
        function setTargeting() {
            googletag.cmd.push(function() {
                var pageConfig = getConfig(), targeting = pageConfig.targeting;
                if (typeof targeting !== "undefined") {
                    $.each(targeting, function(key, value) {
                        googletag.pubads().setTargeting(key, value);
                    });
                }
            });
        }
        function setPagePositions() {
            var clientType = typeof app.config.clientType !== "undefined" ? app.config.clientType : false, $context = app.util.getContext(), $units = null, selector = defaults.adSelector;
            if (clientType !== false) {
                selector += '[data-client-type="' + clientType + '"]';
            }
            $units = $context.find(selector);
            $units.each(function() {
                var id = $(this).data("id");
                pagePositions.push(id);
            });
        }
        function defineSlotsForPagePositions() {
            googletag.cmd.push(function() {
                var currentPosition = null, $context = app.util.getContext(), $unit, $unitTarget;
                for (var i = 0; i < pagePositions.length; i++) {
                    incrementAdSlot(pagePositions[i]);
                    currentPosition = getAdInfo(pagePositions[i]);
                    if (typeof currentPosition.id == "undefined") {
                        continue;
                    }
                    $unit = $context.find(defaults.adSelector + '[data-id="' + currentPosition.id + '"]');
                    $unitTarget = $("<div />");
                    if ($unit.length < 1) {
                        continue;
                    }
                    $unitTarget.addClass(defaults.adUnitTargetClass);
                    $unitTarget.attr("id", currentPosition.idName);
                    $unit.append($unitTarget);
                    $unit.addClass("active");
                    definedSlots[i] = googletag.defineSlot("/" + account + "/" + currentPosition.slot, currentPosition.sizes, currentPosition.idName).addService(googletag.pubads());
                }
                googletag.enableServices();
                $.event.trigger("GPT:slotsDefined");
            });
        }
        function displayPageAds() {
            googletag.cmd.push(function() {
                googletag.pubads().refresh(definedSlots);
                for (var n = 0; n < pagePositions.length; n++) {
                    currentPosition = getAdInfo(pagePositions[n]);
                    if ($("#" + currentPosition.idName).length) {
                        googletag.display(currentPosition.idName);
                    }
                }
            });
        }
        function slotRenderEnded(unit) {
            var unitName = unit.slot.getAdUnitPath().replace("/" + account + "/", ""), adInfo = getAdInfo(unitName);
            $.event.trigger("GPT:adUnitRendered", {
                name: unitName,
                id: adInfo.id,
                size: unit.size,
                isEmpty: unit.isEmpty,
                creativeId: unit.creativeId,
                lineItemId: unit.lineItemId,
                serviceName: unit.serviceName
            });
        }
        function incrementAdSlot(unit) {
            for (var i = 0; i < inventory.length; i++) {
                if (inventory[i].id !== unit && inventory[i].slot !== unit) {
                    continue;
                }
                if (typeof inventory[i].iteration == "undefined") {
                    inventory[i].iteration = 0;
                }
                inventory[i].iteration = inventory[i].iteration + 1;
                return;
            }
        }
        function getAdInfo(unit) {
            var returnObject = {};
            for (var i = 0; i < inventory.length; i++) {
                if (inventory[i].id !== unit && inventory[i].slot !== unit) {
                    continue;
                }
                returnObject = inventory[i];
                if (typeof returnObject.useIterator !== "undefined" && !returnObject.useIterator) {
                    returnObject.idName = returnObject.id;
                } else {
                    returnObject.idName = returnObject.id + "_" + returnObject.iteration;
                }
                return returnObject;
            }
            return returnObject;
        }
        function getDefinedSlot(name) {
            var definedSlot = null;
            $.each(definedSlots, function(i, slot) {
                var unitName = slot.getAdUnitPath().replace("/" + account + "/", "");
                if (unitName === name) {
                    definedSlot = slot;
                    return false;
                }
            });
            return definedSlot;
        }
        function displaySlot(unit) {
            googletag.cmd.push(function() {
                var position = getAdInfo(unit), slot = getDefinedSlot(position.slot);
                googletag.pubads().refresh([ slot ]);
                googletag.display(position.idName);
                removeDefinedSlot(position.slot);
            });
        }
        function removeDefinedSlot(name) {
            $.each(definedSlots, function(index, slot) {
                var unitName = slot.getAdUnitPath().replace("/" + account + "/", "");
                if (unitName === name) {
                    definedSlots.remove(index);
                }
            });
        }
        function getDynamicInventory() {
            var dynamicItems = [], type = typeof app.config.clientType !== "undefined" ? app.config.clientType : false, localContext;
            $.each(inventory, function(index, position) {
                if (typeof position.dynamic !== "undefined" && position.dynamic === true) {
                    if (!type || type === position.type) {
                        dynamicItems.push(position);
                        localContext = position.localContext;
                    }
                }
            });
            return {
                dynamicItems: dynamicItems,
                localContext: localContext
            };
        }
        function getConfig() {
            return app.config;
        }
        function isEnabled() {
            var $context = app.util.getContext(), attrName = "page-ad-config";
            if (typeof app.config.pageConfigAttr !== "undefined") {
                attrName = app.config.pageConfigAttr;
            }
            app.config = app.util.importConfig({
                $context: $context,
                attrName: attrName,
                existConfig: app.config
            });
            if (typeof app.config.enabled === "undefined") {
                return true;
            }
            return app.config.enabled;
        }
        function emptyAds(options) {
            var $context = options.$context, removeContainer = options.removeContainer || false;
            $context.find(defaults.adSelector).empty();
            if (removeContainer) {
                $context.find(defaults.adSelector).remove();
            }
        }
        function getDefaults() {
            return defaults;
        }
        return {
            init: init,
            isEnabled: isEnabled,
            getConfig: getConfig,
            getDefaults: getDefaults,
            getAdInfo: getAdInfo,
            displaySlot: displaySlot,
            removeDefinedSlot: removeDefinedSlot,
            getDynamicInventory: getDynamicInventory,
            initSequence: initSequence,
            emptyAds: emptyAds
        };
    }($);
    return app;
}(admanager || {}, jQuery);

var admanager = function(app, $) {
    app.util = function($) {
        var name = "Util", debugEnabled = false;
        function init() {
            debug(name + ": initialized");
            initArrayRemove();
            return app;
        }
        function debug(obj) {
            if (!debugEnabled) {
                return;
            }
            if (typeof console === "object" && console.log) {
                console.log(obj);
            }
        }
        function difference(array, values) {
            var diff = [];
            $.grep(array, function(element) {
                if ($.inArray(element, values) === -1) {
                    diff.push(element);
                }
            });
            return diff;
        }
        function initArrayRemove() {
            Array.prototype.remove = function(from, to) {
                var rest = this.slice((to || from) + 1 || this.length);
                this.length = from < 0 ? this.length + from : from;
                return this.push.apply(this, rest);
            };
        }
        function importConfig(options) {
            var $context = options.$context, attrName = options.attrName, existConfig = options.existConfig, selector, newConfig, data = {};
            selector = "*[data-" + attrName + "]";
            newConfig = $.extend({}, existConfig);
            data = $context.find(selector).data(attrName);
            if (typeof newConfig === "object") {
                newConfig = $.extend(newConfig, data);
            }
            return newConfig;
        }
        function getContext() {
            var selector = app.config.context || "body";
            return $(selector);
        }
        function shortestAvailable(unit) {
            var shortest = 0;
            $.each(unit.sizes, function(index, sizes) {
                if (shortest === 0) {
                    shortest = sizes[1];
                } else if (sizes[1] < shortest) {
                    shortest = sizes[1];
                }
            });
            return shortest;
        }
        function tallestAvailable(unit) {
            var tallest = 0;
            $.each(unit.sizes, function(index, sizes) {
                if (sizes[1] > tallest) {
                    tallest = sizes[1];
                }
            });
            return tallest;
        }
        function limitUnitHeight(unit, limit) {
            $.each(unit.sizes, function(index, sizes) {
                if (sizes[1] <= limit) {
                    return true;
                }
                unit.sizes.remove(index);
            });
            return unit;
        }
        function getUnitType(id) {
            var type = "default";
            $.each(app.config.inventory, function(index, unit) {
                if (unit.id !== id) {
                    return true;
                }
                type = unit.type;
                return false;
            });
            return type;
        }
        return {
            init: init,
            debug: debug,
            difference: difference,
            importConfig: importConfig,
            shortestAvailable: shortestAvailable,
            tallestAvailable: tallestAvailable,
            limitUnitHeight: limitUnitHeight,
            getUnitType: getUnitType,
            getContext: getContext
        };
    }($);
    return app;
}(admanager || {}, jQuery);
window.AdManager = admanager.bootstrap.init;