# AdManager

- [Basic Usage](#basicusage)
- [Configuration](#configuration)
- [Inventory](#inventory)
- [Events](#events)
- [Contributing](#contributing)
- [References](#references)

## Basic Usage

## Configuration

A configuration object is required to initialize the Ad Manager.

| key                                                      | type    |
| -------------------------------------------------------- | ------- |
| [`account`](#account)                                    | Integer |
| [`clientType`](#clienttype)                              | String  |
| [`pageConfigAttr`](#pageconfigattr)                      | String  |
| [`inventory`](#inventory)                                | Array   |
| [`context`](#context)                                    | String  |
| [`enabled`](#enabled)                                    | Boolean |
| [`targeting`](#targeting)                                | Array   |
| [`insertionEnabled`](#insertionenabled)                  | Array   |
| [`insertion.insertExclusion`](#insertioninsertexclusion) | Array   |
| [`insertion.pxBetweenUnits`](#insertionpxbetweenunits)   | Integer |
| [`insertion.adHeightLimit`](#insertionadheightlimit)     | Integer |

**Example Configuration:**

```javascript
AdManager( {
    account:        1234567,
    clientType:     'desktop',
    pageConfigAttr: 'ad-page-config',
    inventory:      [
        {
            slot:  'Unit_Name_in_DFP',
            id:    'data_attribute_id',
            sizes: [
                [ 728, 90 ],
                [ 970, 250 ],
                [ 1000, 220 ]
            ],
            type:  'desktop'
        }
    ]
} );
```

### `account`

**Type:** Integer

**Default:** `null`, must be specified

**Description:** Your network code. You can find your network code in the “Admin” tab of DFP.

[:arrow_up:](#configuration)

### `clientType`

**Type:** String

**Default:** `false`, must be specified

**Description:** This declares the client type (such as desktop, tablet, or mobile). The value can be set by an external client-detection script and will be used to compare against each inventory item to see whether the item should be displayed or not for that client.

For example, if a desktop device is detected, this value should be set to `clientType: 'desktop'` and items in the inventory array that match (`type: 'desktop'`) will be displayed. This allows you to include both desktop and mobile inventory items, but only shown the appropriate ones according to what `clientType` is set to at load time.

[:arrow_up:](#configuration)

### `pageConfigAttr`

**Type:** String

**Default:** `false`, optional

**Description:** Optional DOM element data attribute name that Ad Manager uses to import additional config parameters (JSON) from. By default, Ad Manager will look for JSON in an attribute named `data-ad-page-config`.

_Not currently used._

[:arrow_up:](#configuration)

### `inventory`

**Type:** Array

**Default:** `[]`, must be specified

**Description:** An array of one or more objects that define different ad types. See the Inventory section below.

Example:
```javascript
var config = {
  ...
  inventory: [
      {
          slot:    'Unit_Name_1',
          id:      'ad_id_1',
          sizes:   [
              [ 728, 90 ],
              [ 970, 250 ],
              [ 1000, 220 ]
          ],
          type:    'desktop',
          dynamic: false
      },
      {
          slot:    'Unit_Name_2',
          id:      'ad_id_2',
          sizes:   [
              [ 728, 90 ],
              [ 970, 250 ],
              [ 1000, 220 ]
          ],
          type:    'desktop',
          dynamic: false
      },
      ...
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

### `insertion.insertExclusion`

**Type:** Array

**Default:**
```
[
  'img',
  'iframe',
  'video',
  'audio',
  '.video',
  '.audio',
  '.app_ad_unit'
]
```

**Description:** When using the dynamic insertion feature, this allows customization of what body elements to exclude when looking for valid insertion points.

[:arrow_up:](#configuration)

### `insertion.pxBetweenUnits`

**Type:** Integer

**Default:** `800`, optional

**Description:** The minimum distance between dynamically inserted units.

[:arrow_up:](#configuration)

### `insertion.adHeightLimit`

**Type:** Integer

**Default:** `1000`, optional

**Description:** The max height for dynamically inserted units.

[:arrow_up:](#configuration)

## Inventory

The inventory array is a collection of objects that represent different ad positions.

| property name                   | type    |                                        |
| ------------------------------- | ------- | -------------------------------------- |
| [`slot`](#slot)                 | String  |                                        |
| [`id`](#id)                     | String  |                                        |
| [`sizes`](#sizes)               | Array   |                                        |
| [`type`](#type)                 | String  |                                        |
| [`dynamic`](#dynamic)           | Boolean |                                        |
| [`iteration`](#iteration)       | Integer | optional                               |
| [`localContext`](#localcontext) | String  | optional (required if `dynamic: true`) |

**Example Usage:**

```javascript
var config = {
    // ...
    inventory: [
        {
            slot: 'Article_Leaderboard',
            id: 'article-leaderboard',
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
            id: 'article-dynamic',
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

[:arrow_up:](#inventory)

### `id`

**Type:** String

**Description:** String to identify the ad unit container. Used as a data attribute `data-id=""`.

[:arrow_up:](#inventory)

### `sizes`

**Type:** Array

**Description:** An array of accepted sizes for this unit. Must match up to the sizes defined in DFP.

[:arrow_up:](#inventory)

### `type`

**Type:** String

**Description:** This can be used to categorize inventory. For example, it can be used to denote whether an unit is for desktop or mobile devices. This value is checked against [`clientType`](#clienttype).

[:arrow_up:](#inventory)

### `dynamic`

**Type:** Boolean

**Default:** `false`

**Description:** This enables/disables dynamic insertion. If set to `false`, AdManager will expect a `<div>` container on the page with an `data` attribute that corresponds to the id declared in the Inventory object.

[:arrow_up:](#inventory)

### `iteration`

**Type:** Integer

**Default:** `0`

**Description:** Used internally to keep the insertion container `id` attribute unique.

[:arrow_up:](#inventory)

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
            id: 'article-dynamic',
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

[:arrow_up:](#inventory)

## Events

Custom jQuery events prefixed with `GPT`.

| event                                      | trigger source  |
| ------------------------------------------ | --------------- |
| [`GPT:initPageAds`](#gptinitpageads)       | internal        |
| [`GPT:libraryLoaded`](#gptlibraryloaded)   | internal        |
| [`GPT:adUnitRendered`](#gptadunitrendered) | internal        |
| [`GPT:slotsDefined`](#gptslotsdefined)     | internal        |

### `GPT:initPageAds`

**Description:** This is triggered once when ads are initialized.

[:arrow_up:](#events)

### `GPT:libraryLoaded`

**Description:** This is triggered once when the GPT library is loaded.

[:arrow_up:](#events)

### `GPT:adUnitRendered`

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

### `GPT:slotsDefined`

**Description:** This is triggered when slots are successfully defined, but before ads are rendered.

[:arrow_up:](#events)

## Contributing

### Coding Style

Ad Manager follows the [WordPress JavaScript Coding Standards](https://make.wordpress.org/core/handbook/coding-standards/javascript/). There is a [`.jscsrc`](https://github.com/athletics/ad-manager/blob/master/.jscsrc) included in the project for automatic linting using [JSCS](http://jscs.info/).

The modules are written in the [UMD](https://github.com/umdjs/umd) pattern to support AMD, CommonJS, and global usage.

### Development

The project contains a gulpfile.js for concatenation and minification. To use first [install gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) and the dependencies (`npm install`). The default gulp task (`gulp`) will start the watch task.

## References

* [IAB Ad Standards and Creative Guidelines](http://www.iab.net/guidelines/508676/508767)
* [Google Publisher Tag samples](https://support.google.com/dfp_premium/answer/1638622?hl=en)