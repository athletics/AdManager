# AdManager

## Usage

### Configuration

A configuration object is required to initialize the Ad Manager.

| key                                     | type    |
| --------------------------------------- | ------- |
| [`account`](#account)                   | Integer |
| [`clientType`](#clientType)             | String  |
| [`pageConfigAttr`](#pageConfigAttr)     | String  |
| [`inventory`](#inventory)               | Array   |
| [`context`](#context)                   | String  |
| [`enabled`](#enabled)                   | Boolean |
| [`targeting`](#targeting)               | Array   |
| [`insertionEnabled`](#insertionEnabled) | Array   |
| `insertion.insertExclusion`             | Array   |
| `insertion.pxBetweenUnits`              | Integer |
| `insertion.adHeightLimit`               | Integer |

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

#### `account`

**Type:** Integer

**Default:** `null`, must be specified

**Description:** Your network code. You can find your network code in the “Admin” tab of DFP.

[:leftwards_arrow_with_hook:](#configuration)

#### `clientType`

**Type:** String

**Default:** `false`, must be specified

**Description:** This declares the client type (such as desktop, tablet, or mobile). The value can be set by an external client-detection script and will be used to compare against each inventory item to see whether the item should be displayed or not for that client.

For example, if a desktop device is detected, this value should be set to `clientType: 'desktop'` and items in the inventory array that match (`type: 'desktop'`) will be displayed. This allows you to include both desktop and mobile inventory items, but only shown the appropriate ones according to what `clientType` is set to at load time.

[:leftwards_arrow_with_hook:](#configuration)

#### `pageConfigAttr`

**Type:** String

**Default:** `false`, optional

**Description:** Optional DOM element data attribute name that Ad Manager uses to import additional config parameters (JSON) from. By default, Ad Manager will look for JSON in an attribute named `data-ad-page-config`.

_Not currently used._

[:leftwards_arrow_with_hook:](#configuration)

#### `inventory`

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

[:leftwards_arrow_with_hook:](#configuration)

#### `context`

**Type:** String

**Default:** `'body'`, optional

**Description:** The is used as a jQuery selector that specifies the DOM context where ads are to be inserted. In standard cases this will be static since there will only be one page. In infinite scroll applications, there may exist multiple pages in a single window and this provides a way to distinguish one page/context from another.

[:leftwards_arrow_with_hook:](#configuration)

#### `enabled`

**Type:** Boolean

**Default:** `true`, optional

**Description:** This provides a way to disable the Ad Manager.

[:leftwards_arrow_with_hook:](#configuration)

#### `insertion.insertionEnabled`

**Type:** Boolean

**Default:** `false`, optional

**Description:** Whether to enable dynamic insertion.

#### `insertExclusion`

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

[:leftwards_arrow_with_hook:](#configuration)

#### `insertion.pxBetweenUnits`

**Type:** Integer

**Default:** `800`, optional

**Description:** The minimum distance between dynamically inserted units.

[:leftwards_arrow_with_hook:](#configuration)

#### `insertion.adHeightLimit`

**Type:** Integer

**Default:** `1000`, optional

**Description:** The max height for dynamically inserted units.

[:leftwards_arrow_with_hook:](#configuration)