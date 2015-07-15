# AdManager

A JavaScipt library for interacting with Google DFP.

## Introduction

AdManager is a JavaScript library for interacting with [Google Publisher Tags (GPT)](https://support.google.com/dfp_sb/answer/1649768?hl=en) and [Google DFP](https://www.google.com/dfp). It handles the loading of the GPT library as well as the definition and request of ad inventory. Below you’ll find documentation on its configuration and usage.

- [Installation](#installation)
- [Basic Usage](#basicusage)
- [Configuration](#configuration)
- [Inventory](#inventory-1)
- [Events](#events)
- [Dynamic Insertion](#dynamicinsertion)
- [Contributing](#contributing)
- [Dependencies](#dependencies)
- [References](#references)

## Installation

### Bower

Use the [Bower](http://bower.io/) package manager to install AdManager into your project. To do so you can either use the cli:

```bash
$ bower install admanager --save
```

Or define it in your bower.json manifest:

```javascript
    "dependencies": {
        "admanager": "latest"
    }
```

### npm

Similarly, AdManager can be installed using [npm](https://www.npmjs.com/). To do so you can either use the cli:

```bash
$ npm install admanager --save
```

Or define it in your package.json manifest:

```javascript
    "dependencies": {
        "admanager": "latest"
    }
```

### Direct download

If package managers are not your thing, the library can be downloaded directly from GitHub using the **Download ZIP** button.

## Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>AdManager Usage</title>
    <script src="jquery.js"></script>
    <script src="AdManager.min.js"></script>
</head>
<body>
    <!--
    This is the ad unit container. AdManager looks for all of the
    [data-ad-unit] in the DOM and grabs the slot name to make a
    request from DFP to fill those units.
    -->
    <div data-ad-unit="Unit_Name_in_DFP"></div>

    <script type="text/javascript">
        ( function () {

            var config = {
                account: 1234567,
                inventory: [
                    {
                        slot: 'Unit_Name_in_DFP',
                        sizes: [
                            [ 728, 90 ],
                            [ 970, 250 ],
                            [ 1000, 220 ]
                        ]
                    }
                ]
            };

            AdManager( config );

        } () );
    </script>
</body>
</html>
```

## Configuration

A configuration object is required to initialize the Ad Manager.

| key                                      | type    |
| ---------------------------------------- | ------- |
| [`account`](#account)                    | Integer |
| [`autoload`](#autoload)                  | Boolean |
| [`clientType`](#clienttype)              | String  |
| [`inventory`](#inventory)                | Array   |
| [`context`](#context)                    | String  |
| [`enabled`](#enabled)                    | Boolean |
| [`targeting`](#targeting)                | Array   |
| [`insertionEnabled`](#insertionenabled)  | Array   |
| [`insertion`](#insertion)                | Object  |

**Example Configuration:**

```javascript
{
    account: 1234567,
    clientType: 'desktop',
    inventory: [
        {
            slot: 'Unit_Name_in_DFP',
            sizes: [
                [ 728, 90 ],
                [ 970, 250 ],
                [ 1000, 220 ]
            ]
        }
    ]
}
```

### `account`

**Type:** Integer

**Default:** `null`, must be specified

**Description:** Your network code. You can find your network code in the “Admin” tab of DFP.

[:arrow_up:](#configuration)

### `autoload`

**Type:** Boolean

**Default:** `true`

**Description:** Whether to start the qualification process automatically.

[:arrow_up:](#configuration)

### `clientType`

**Type:** String

**Default:** `'default'`, optional

**Description:** This declares the client type (such as desktop, tablet, or mobile). The value can be set by an external client-detection script and will be used to compare against each inventory item to see whether the item should be displayed or not for that client.

For example, if a desktop device is detected, this value should be set to `clientType: 'desktop'` and items in the inventory array that match (`type: 'desktop'`) will be displayed. This allows you to include both desktop and mobile inventory items, but only shown the appropriate ones according to what `clientType` is set to at load time.

[:arrow_up:](#configuration)

### `inventory`

**Type:** Array

**Default:** `[]`, must be specified

**Description:** An array of one or more objects that define different ad types. See the Inventory section below. More information can be found in the [inventory section below](#inventory-1).

Example:
```javascript
var config = {
    // ...
    inventory: [
        {
            slot: 'Unit_Name_1',
            sizes: [
                [ 728, 90 ],
                [ 970, 250 ],
                [ 1000, 220 ]
            ]
        },
        {
            slot: 'Unit_Name_2',
            sizes: [
                [ 728, 90 ],
                [ 970, 250 ],
                [ 1000, 220 ]
            ]
        },
        // ...
    ]
};
```

[:arrow_up:](#configuration)

### `context`

**Type:** String

**Default:** `'body'`, optional

**Description:** The is used as a jQuery selector that specifies the DOM context where ads are to be inserted. In standard cases this will be static since there will only be one page. In infinite scroll applications, there may exist multiple pages in a single window and this provides a way to distinguish one page/context from another.

[:arrow_up:](#configuration)

### `enabled`

**Type:** Boolean

**Default:** `true`, optional

**Description:** This provides a way to disable the Ad Manager.

[:arrow_up:](#configuration)

### `insertionEnabled`

**Type:** Boolean

**Default:** `false`, optional

**Description:** Whether to enable dynamic insertion.

[:arrow_up:](#configuration)

### `insertion`

**Type:** Object

**Example Insertion:**
```javascript
{
    pxBetweenUnits: 800,
    adHeightLimit: 1000,
    insertExclusion: [
        'img',
        'iframe',
        'video',
        'audio',
        '.video',
        '.audio',
        '[data-ad-unit]'
    ]
}
```

#### `insertion.insertExclusion`

**Type:** Array

**Default:**
```javascript
[
    'img',
    'iframe',
    'video',
    'audio',
    '.video',
    '.audio',
    '[data-ad-unit]'
]
```

**Description:** When using the dynamic insertion feature, this allows customization of what body elements to exclude when looking for valid insertion points.

[:arrow_up:](#configuration)

#### `insertion.pxBetweenUnits`

**Type:** Integer

**Default:** `800`, optional

**Description:** The minimum distance between dynamically inserted units.

[:arrow_up:](#configuration)

#### `insertion.adHeightLimit`

**Type:** Integer

**Default:** `1000`, optional

**Description:** The max height for dynamically inserted units.

[:arrow_up:](#configuration)

## Inventory

The inventory array is a collection of objects that represent different ad positions.

| property name                   | type    |                                        |
| ------------------------------- | ------- | -------------------------------------- |
| [`slot`](#slot)                 | String  |                                        |
| [`sizes`](#sizes)               | Array   |                                        |
| [`type`](#type)                 | String  |                                        |
| [`dynamic`](#dynamic)           | Boolean |                                        |
| [`localContext`](#localcontext) | String  | optional (required if `dynamic: true`) |

**Example Usage:**

```javascript
var config = {
    // ...
    inventory: [
        {
            slot: 'Article_Leaderboard',
            sizes: [
                [ 728, 90 ],
                [ 970, 250 ],
                [ 1000, 220 ]
            ],
            type: 'desktop',
            dynamic: false
        },
        {
            slot: 'Article_Dynamic',
            sizes: [
                [ 300, 250 ],
                [ 300, 600 ]
            ],
            type: 'desktop',
            dynamic: true,
            localContext: '.entry-content'
        }
        // ...
    ]
};
```
### `slot`

**Type:** String

**Description:** The slot name defined in DFP.

[:arrow_up:](#inventory-1)

### `sizes`

**Type:** Array

**Description:** An array of accepted sizes for this unit. Must match up to the sizes defined in DFP.

[:arrow_up:](#inventory-1)

### `type`

**Type:** String

**Description:** This can be used to categorize inventory. For example, it can be used to denote whether an unit is for desktop or mobile devices. This value is checked against [`clientType`](#clienttype).

[:arrow_up:](#inventory-1)

### `dynamic`

**Type:** Boolean

**Default:** `false`

**Description:** This enables/disables dynamic insertion. If set to `false`, AdManager will expect a `<div>` container on the page with an `data` attribute that corresponds to the id declared in the Inventory object.

[:arrow_up:](#inventory-1)

### `localContext`

**Type:** String

**Description:** This is needed only for dynamic insertion. The string is a jQuery selector that specifies an nth-child insertion point for the new ad.

Example:
```javascript
var config = {
    // ...
    inventory: [
        // ...
        {
            slot: 'Article_Dynamic',
            sizes: [
                [ 300, 250 ],
                [ 300, 600 ]
            ],
            type: 'desktop',
            dynamic: true,
            localContext: '.entry-content'
        }
        // ...
    ]
};
```

[:arrow_up:](#inventory-1)

## Events

Custom jQuery events prefixed with `AdManager`.

| event                                                            | trigger source  |
| ---------------------------------------------------------------- | --------------- |
| [`AdManager:libraryLoaded`](#admanagerlibraryloaded)             | internal        |
| [`AdManager:adUnitRendered`](#admanageradunitrendered)           | internal        |
| [`AdManager:slotsDefined`](#admanagerslotsdefined)               | internal        |
| [`AdManager:refresh`](#admanagerrefresh)                         | external        |
| [`AdManager:runSequence`](#admanagerrunsequence)                 | both            |
| [`AdManager:emptySlots`](#admanageremptyslots)                   | external        |
| [`AdManager:emptySlotsInContext`](#admanageremptyslotsincontext) | external        |
| [`AdManager:importConfig`](#admanagerimportconfig)               | both            |

### `AdManager:libraryLoaded`

**Description:** This is triggered once when the GPT library is loaded.

[:arrow_up:](#events)

### `AdManager:adUnitRendered`

**Description:** This is triggered each time an ad is rendered. Bind to this event to receive notification of a particular ad that has rendered.

**Parameter:** `unit` {Object}

| name          | type    | description                                               |
| ------------- | ------- | --------------------------------------------------------- |
| `name`        | String  | The slot name defined in DFP.                             |
| `id`          | String  | HTML id for the current ad wrapper.                       |
| `size`        | Array   | Indicates the pixel size of the rendered creative.        |
| `isEmpty`     | Boolean | true if no ad was returned for the slot, false otherwise. |
| `creativeId`  | String  | Creative ID of the rendered ad.                           |
| `lineItemId`  | String  | Line item ID of the rendered ad.                          |
| `serviceName` | String  | Name of the service that rendered the slot.               |

[:arrow_up:](#events)

### `AdManager:slotsDefined`

**Description:** This is triggered when slots are successfully defined, but before ads are rendered.

[:arrow_up:](#events)

### `AdManager:refresh`

**Description:** Pass an array of slot names to be refreshed. Slots should already be in the DOM.

**Example Usage:**

```javascript
$.event.trigger( 'AdManager:refresh', [ 'Unit_Name_1', 'Unit_Name_2' ] );
```

[:arrow_up:](#events)

### `AdManager:runSequence`

**Description:** Trigger to run the full qualification sequence: the identification of positions in the DOM, define of DFP slots, targeting, request for creative, and display.

**Example Usage:**

```javascript
$.event.trigger( 'AdManager:runSequence' );
```

[:arrow_up:](#events)

### `AdManager:emptySlots`

**Description:** Pass an array of slot names to be emptied.

**Example Usage:**

```javascript
$.event.trigger( 'AdManager:emptySlots', [ 'Unit_Name_1', 'Unit_Name_2' ] );
```

[:arrow_up:](#events)

### `AdManager:emptySlotsInContext`

**Description:** Pass an array of slot names to be emptied.

**Example Usage:**

```javascript
$.event.trigger( 'AdManager:emptySlotsInContext', {
    $context: $( '.entry-content' ), // Defaults to the context set in the config.
    removeContainer: true // Defaults to true
} );
```

[:arrow_up:](#events)

### `AdManager:importConfig`

**Description:** Pass an object to import new configuration values. The new config will override values in the current config.

**Example Usage:**

```javascript
$.event.trigger( 'AdManager:importConfig', {
    targeting: {
        category: [
            'athletics',
            'technology',
            'graphic design'
        ]
    }
} );
```

[:arrow_up:](#events)

## Dynamic Insertion

### Overview

**Note:** This feature is optional.

This feature allows AdManager to dynamically insert a variable number of new ad positions on the fly, without predetermined ad containers. The Insertion.js module contains logic that analyzes the DOM nodes in a specified text area to determine the optimal places where to insert ads.

### Instructions

- Add new inventory items that reflect the maximum possible number of dynamically inserted ads. Note that each inventory item should have unique and `slot` and `id` values.
- Set the additional options `dynamic` and `localContext` in the inventory config.
```javascript
var config = {
    // ...
    inventory: [
        // ...
        {
            slot: 'Dynamic_Unit_1',
            sizes: [
                [ 300, 250 ],
                [ 300, 425 ],
                [ 300, 600 ]
            ],
            type: 'desktop',
            dynamic: true,
            localContext: '.entry-content'
        },
        {
            slot: 'Dynamic_Unit_2',
            sizes: [
                [ 300, 250 ],
                [ 300, 425 ],
                [ 300, 600 ]
            ],
            type: 'desktop',
            dynamic: true,
            localContext: '.entry-content'
        },
        {
            slot: 'Dynamic_Unit_3',
            sizes: [
                [ 300, 250 ],
                [ 300, 425 ],
                [ 300, 600 ]
            ],
            type: 'desktop',
            dynamic: true,
            localContext: '.entry-content'
        }
    ]
};

AdManager( config );
```
- If a more specific outer/main context is needed (the default context is `body`), the property `context` can be added to the config. This is needed when keeping multiple contexts or articles separate, such as in infinite scroll applications. In the example below, it is `.hentry`.
```html
<body>
    <div class="hentry">
        <div class="entry-content">
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
            <p>Paragraph 3</p>
        </div>
    </div>

    <script type="text/javascript">
        ( function () {

            var config = {
                // ...
                context: '.hentry',
                inventory: [
                    {
                        // ...
                        dynamic: true,
                        localContext: '.entry-content'
                        }
                    ]
                }
            };

            AdManager( config );

        } () );
    </script>
</body>
```

## Contributing

### Coding Style

Ad Manager follows the [WordPress JavaScript Coding Standards](https://make.wordpress.org/core/handbook/coding-standards/javascript/). There is a [`.jscsrc`](https://github.com/athletics/ad-manager/blob/master/.jscsrc) included in the project for automatic linting using [JSCS](http://jscs.info/).

The modules are written in the [UMD](https://github.com/umdjs/umd) pattern to support AMD, CommonJS, and global usage.

### Development

The project contains a gulpfile.js for concatenation and minification. To use first [install gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) and the dependencies (`npm install`). The default gulp task (`gulp`) will start the watch task.

## Dependencies

AdManager requires jQuery.

## References

* [IAB Ad Standards and Creative Guidelines](http://www.iab.net/guidelines/508676/508767)
* [Google Publisher Tag samples](https://support.google.com/dfp_premium/answer/1638622?hl=en)