/**
 * Insertion
 */
( function ( root, factory ) {

	if ( typeof define === 'function' && define.amd ) {

		define( [
			'jquery',
			'./Util'
		], factory );

	} else if ( typeof exports === 'object' ) {

		module.exports = factory(
			require( 'jquery' ),
			require( './Util' )
		);

	} else {

		root.AdManager = root.AdManager || {};

		root.AdManager.Insertion = factory(
			root.jQuery,
			root.AdManager.Util
		);

	}

} ( this, function ( $, Util ) {

	var name = 'Insertion',
		debugEnabled = true,
		debug = debugEnabled ? Util.debug : function () {},
		$context = null,
		$localContext = null,
		inContent = false,
		inventory = [],
		odd = true,
		localContext = null,
		defaults = {
			pxBetweenUnits: 800,
			adHeightLimit: 1000,
			insertExclusion: [
				'img',
				'iframe',
				'video',
				'audio',
				'.video',
				'.audio',
				'.app_ad_unit'
			]
		};

	//////////////////////////////////////////////////////////////////////////////////////

	function init() {

		debug( name + ': initialized' );

		defaults = $.extend( defaults, app.manager.getDefaults() );

		bindHandlers();

	}

	function bindHandlers() {

		$( document )
			.on( 'GPT:initSequence', function () {

				debug( name + ': GPT:initSequence' );
				/**
				 * Begin qualification procedure when the DOM is ready
				 */
				qualifyContext();

			} );

	}

	function setContext() {

		$context = $( Config.get( 'context' ) );

	}

	/*
	 * First qualify the DOM context where ads are to be inserted
	 * to determine if insertion should proceed.
	 *
	 * @return object
	 */
	function qualifyContext() {

		var inventoryData = app.manager.getDynamicInventory();

		setContext();
		inventory = inventory.length ? inventory : inventoryData.dynamicItems;
		localContext = localContext ? localContext : inventoryData.localContext;

		// Return if empty
		if ( ! inventory.length ) {
			broadcast();
			return app;
		}

		$localContext = $context.find( localContext ).first();

		// Detect a local context
		if ( $localContext.length ) {
			inContent = true;
		}

		// Return if there is no insertion selector
		if ( ! inContent ) {
			broadcast();
			return app;
		}

		insertAdUnits();
		return app;

	}

	/**
	 * Ad units have been inserted / proceed
	 */
	function broadcast() {

		$.event.trigger( 'GPT:unitsInserted' );

	}

	/**
	 * Is Insertion Enabled?
	 *
	 * @return bool
	 */
	function isEnabled() {

		return Config.get( 'insertionEnabled' );

	}

	function insertAdUnits() {

		if ( inContent ) {
			denoteValidInsertions();
			insertPrimaryUnit();
			insertSecondaryUnits();
		}

		broadcast();

	}

	function denoteValidInsertions() {

		var $nodes = $localContext.children(),
			excluded = app.config.insertExclusion || defaults.insertExclusion
		;

		$nodes.each( function ( i ) {

			var $element = $( this ),
				$prev = i > 0 ? $nodes.eq( i - 1 ) : false,
				valid = true
			;

			$.each( excluded, function ( index, item ) {
				if ( $element.is( item ) || $element.find( item ).length ) {
					valid = false; // not valid
					return false; // break loop
				}
			} );

			if ( $prev && $prev.is( 'p' ) && $prev.find( 'img' ).length === 1 ) {
				valid = false;
			}

			$element.attr( 'data-valid-location', valid );

		} );

	}

	/**
	 * Check against of list of elements to skip
	 *
	 * @param  object $element
	 * @return bool
	 */
	function isValidInsertionLocation( $element ) {

		return $element.data( 'valid-location' );

	}

	/**
	 * adUnitMarkup
	 *
	 * @param string unitId
	 * @param bool disableFloat
	 * @return string
	 */
	function adUnitMarkup( unitId, disableFloat ) {

		var floatDisable = disableFloat || false,
			type = Util.getUnitType( unitId ),
			alignment = odd ? 'odd' : 'even',
			$html = $( '<div />' );

		$html
			.addClass( defaults.adClass )
			.attr( 'data-id', unitId )
			.attr( 'data-client-type', type );

		if ( floatDisable ) {
			$html
				.addClass( 'disableFloat' );
		} else {
			$html
				.addClass( 'inContent' )
				.addClass( alignment );
		}

		if ( ! floatDisable ) {
			odd = ! odd;
		}

		return $html;

	}

	/**
	 * Insert Primary Unit: Unit most display above the fold
	 */
	function insertPrimaryUnit() {

		var unit = getPrimaryUnit(),
			tallest = Util.tallestAvailable( unit ),
			shortest = Util.shortestAvailable( unit ),
			location = findInsertionLocation( {
				height: tallest,
				limit: defaults.adHeightLimit
			} ),
			markup = null
		;

		if ( ! location ) {
			location = findInsertionLocation( {
				height: shortest,
				limit: defaults.adHeightLimit,
				force: true
			} );

			if ( ! location.disableFloat ) {
				// unset large sizes
				unit = Util.limitUnitHeight( unit, shortest );
			}
		}

		markup = adUnitMarkup( unit.id, location.disableFloat );

		location.$insertBefore.before( markup );

	}

	/**
	 * Insert Secondary Unit: Ad units that commonly appear below the fold
	 */
	function insertSecondaryUnits() {

		$.each( inventory, function ( index, unit ) {

			var tallest = Util.tallestAvailable( unit ),
				location = findInsertionLocation( {
					height: tallest
				} ),
				markup = null
			;

			if ( ! location ) {
				return false;
			}

			markup = adUnitMarkup( unit.id, location.disableFloat );
			location.$insertBefore.before( markup );

		} );

	}

	function getPrimaryUnit() {

		var primaryUnit = false;

		$.each( inventory, function ( index, unit ) {

			if ( unit.primary ) {
				primaryUnit = unit;
				inventory.remove( index );
				return false;
			}

		} );

		if ( ! primaryUnit ) {
			primaryUnit = inventory[0];
			inventory.remove( 0 );
		}

		return primaryUnit;

	}

	/**
	 * findInsertionLocation
	 *
	 * @param object options
	 * @return object or boolean:false
	 */
	function findInsertionLocation( options ) {

		options = options || {};

		var $nodes = getNodes(),
			nodeSearch = new NodeSearch( {
				$nodes: $nodes,
				force: options.force ? options.force : false,
				limit: options.limit ? options.limit : false,
				height: options.height
			} )
		;

		if ( ! $nodes.length ) {
			return false;
		}

		// Loop through each node as necessary
		$.each( $nodes, function ( i, node ) {

			var exitLoop = nodeSearch.verifyNode( i, $( node ) );

			if ( exitLoop ) {
				return false;
			} else if ( ! exitLoop ) {
				return true;
			}

		} );

		if ( ! nodeSearch.locationFound ) {
			return false;
		}

		nodeSearch.markValidNodes();
		nodeSearch.setLastPosition();

		return {
			'$insertBefore': nodeSearch.$insertBefore,
			'disableFloat': nodeSearch.disableFloat
		};

	}

	/**
	 * Search object used for determining insertion points
	 */
	function NodeSearch( options ) {

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

	/**
	 * Store the position of the last ad
	 */
	NodeSearch.prototype.setLastPosition = function () {

		this.lastPosition = this.$insertBefore.offset().top + this.neededheight;

	};

	/**
	 * Mark nodes where insertion is valid
	 */
	NodeSearch.prototype.markValidNodes = function () {

		if ( this.inserted.length ) {
			$.each( this.inserted, function ( index, item ) {
				$( item ).data( 'valid-location', false );
			} );
		}

	};

	/**
	 * Verify each node to find a suitable insertion point
	 *
	 * @return boolean
	 */
	NodeSearch.prototype.verifyNode = function ( index, $node ) {

		var since = $node.offset().top - this.lastPosition,
			height = $node.outerHeight(),
			isLast = ( this.$nodes.length - 1 ) === index;

		this.totalHeight += height;

		if ( this.force && ( this.totalHeight >= this.limit || isLast ) ) {

			this.$insertBefore = $node;
			this.disableFloat = true;
			this.locationFound = true;
			this.exitLoop = true;

		} else if ( this.limit && ( this.totalHeight >= this.limit || isLast ) ) {

			this.locationFound = false;
			this.exitLoop = true;

		} else if ( isValidInsertionLocation( $node ) ) {

			this.validHeight += height;
			this.inserted.push( $node );

			if ( this.$insertBefore === null ) {
				this.$insertBefore = $node;
			}

			if ( this.validHeight >= this.neededheight ) {

				if ( ! this.limit && ( since < defaults.pxBetweenUnits ) ) {

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

	/**
	 * Is Element an Ad Unit
	 *
	 * @param mixed $el
	 * @return bool
	 */
	function isThisAnAd( $el ) {

		if ( ! $el ) {
			return false;
		}

		return $el.is( defaults.adSelector );

	}

	/**
	 * Get Nodes to Loop Through
	 *
	 * @return array $nodes
	 */
	function getNodes() {

		var $prevUnit = $localContext.find( defaults.adSelector ).last(),
			$nodes = null;

		// nodes after previous unit or all nodes
		if ( $prevUnit.length ) {
			$nodes = $prevUnit.nextAll( $localContext );
		} else {
			$nodes = $localContext.children();
		}

		return $nodes;

	}

	//////////////////////////////////////////////////////////////////////////////////////

	return {
		init: init
	};

} ) );