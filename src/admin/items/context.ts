// context.ts
import { BehaviorSubject, debounceTime, map, merge, startWith, tap } from 'rxjs'
import { smartMomoFilter } from 'src/shared/smartFilter'
import { Item } from '../../../db/items.collection'

export const $items = new BehaviorSubject<Map<string, Item>>(new Map())
export const $itemsFilter = new BehaviorSubject<{
	filterBy: Array<string>
	filter: Map<string, string>
}>({
	filterBy: ['name', 'description', 'folder', 'supplier'],
	filter: localStorage.getItem('paris_items_filter')
		? new Map(Object.entries(JSON.parse(localStorage.getItem('paris_items_filter') as string)))
		: new Map(),
})
export const $filteredItems = merge($items, $itemsFilter).pipe(
	startWith($items.value),
	debounceTime(10),
	tap(() => {
		const a = $itemsFilter.value
		if (a.filter) {
			localStorage.setItem('paris_items_filter', JSON.stringify(Object.fromEntries(a.filter.entries())))
		}
	}),
	map(() => {
		const a = $itemsFilter.value
		return smartMomoFilter<Item>(deepClonedMap($items.value), a.filter, $itemsFilter.value.filterBy)
	}),
	// sort by name alphabetically
	map(items => new Map([...items.entries()].sort((a, b) => a[1].brand.localeCompare(b[1].brand)))),
)

export const deepClonedMap = (originalMap: Map<any, any>) =>
	new Map(Array.from(originalMap, ([key, value]) => [key, JSON.parse(JSON.stringify(value))]))
