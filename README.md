ad-manager
==========

Generic code for ad management

## Usage

### Configuration

| Key                  | Type    |
| -------------------- | ------- |
| `account`            | integer |
| `inventory`          | array   |
| `insertion_selector` | string  |
| `has_mobile_ads`     | boolean |

#### Inventory

The inventory is an array of objects

| Key          | Type    |
| ------------ | ------- |
| `slot`       | string  |
| `type`       | string  |
| `iteration`* | integer |
| `sizes`      | array   |
| `dynamic`    | boolean |

__* Optional__

#### Example Usage

```javascript
{
	account: 123456789,
	inventory: [
		{
			slot: 'Unit_Name_in_DFP',
			type: 'unit_data_id',
			iteration : 0,
			sizes: [
				[300, 250],
				[728, 90]
			]
		}
	]
}
```

### Init

```javascript
admanager.bootstrap.init( config );
```

## Events

| Event                | Arguments            |
| -------------------- | -------------------- |
| `GPT:initPageAds`    |                      |
| `GPT:libraryLoaded`  |                      |
| `GPT:adUnitRendered` | `name, size`         |
| `GPT:slotsDefined`   |                      |
| `GPT:scroll`         |                      |
| `GPT:resize`         |                      |
| `GPT:updateUI`       |                      |