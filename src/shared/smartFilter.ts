import { distance } from 'fastest-levenshtein'

export function smartMomoFilter<T>(
	items: Map<string, T>,
	filter: Map<string, string | string[]>,
	searchKeys: string[] = ['name', 'description'],
): Map<string, T> {
	const filteredItems = new Map(items)
	if (filter.size > 0) {
		const matches = Array.from(items.entries())
			.map(([key, item]) => {
				let closeEnough = false
				let leastLevDistance = Infinity

				// Iterate over each key in the filter map
				for (const [_, filterValue] of filter.entries()) {
					if (Array.isArray(filterValue)) {
						// Check if the item has the property specified in the filter key
						// map through each enumberable property of the item
						Object.entries(item as Object)
							.filter(([key]) => searchKeys.includes(key))
							.map(([_, itemValue]) => {
								// Check if the property value is a string
								if (typeof itemValue === 'string') {
									const itemValueLower = itemValue.toLowerCase()
									// Check if the property value is included in the filter value array
									if (filterValue.includes(itemValueLower)) {
										closeEnough = true
									}
								}
							})
					} else {
						const filterValueLower = filterValue.toLowerCase()

						// Check if the item has the property specified in the filter key
						// map through each enumberable property of the item
						Object.entries(item as Object)
							.filter(([key]) => searchKeys.includes(key))

							.map(([_, itemValue]) => {
								// Check if the property value is a string
								if (typeof itemValue === 'string') {
									const itemValueLower = itemValue.toLowerCase()
									const levDistance = distance(filterValueLower, itemValueLower)
									// Accumulate the Levenshtein distance
									leastLevDistance = Math.min(levDistance, leastLevDistance)
									if (filterValueLower.length < 3 || levDistance <= itemValue.length - filterValueLower.length) {
										closeEnough = true
									}
								}
							})
					}
				}
				return { item, closeEnough, leastLevDistance, key }
			})
			// Remove null results
			.filter(result => result !== null)
			// Exclude items with infinite average Levenshtein distance
			.filter(({ closeEnough }) => {
				return closeEnough
			})
			.sort((a, b) => a.leastLevDistance - b.leastLevDistance)

		filteredItems.clear()
		// Add the filtered and sorted items to the result map
		matches.forEach(({ key, item }) => {
			filteredItems.set(key, item)
		})
	} else {
		// If no filters are provided, include all items
		items.forEach((item, key) => {
			filteredItems.set(key, item)
		})
	}

	return filteredItems
}
