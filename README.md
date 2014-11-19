# Ad Manager

## Usage

### Configuration

| Key                  | Type    |
| -------------------- | ------- |
| `account`            | integer |
| `inventory`          | array   |
| `insertion_selector` | string  |
| `type`*              | string |

#### Inventory

The inventory is an array of objects

| Key          | Type    |
| ------------ | ------- |
| `slot`       | string  |
| `id`         | string  |
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
			id: 'unit_data_id',
			iteration : 0,
			sizes: [
				[300, 250],
				[728, 90]
			]
		}
	]
}
```

### Initialize with Configuration

```javascript
AdManager( config );
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