// items.ts
import { FoldersTree, IFolder, TreeNode } from '@db/folders.collection'
import { Item } from '@db/items.collection'
import { $LitElement } from '@mhmo91/lit-mixins/src'
import { fullHeight, sheet } from '@mhmo91/schmancy'
import { html, TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { map as litMap } from 'lit/directives/map.js'
import { repeat } from 'lit/directives/repeat.js'
import { when } from 'lit/directives/when.js'
import { debounceTime, distinctUntilChanged, merge, takeUntil } from 'rxjs'
import '../folders'
import { $folders } from '../folders/context'
import { $filteredItems, $items, $itemsFilter } from './context'
import ItemForm from './item-form'

@customElement('reuse-items')
export default class Items extends $LitElement() {
	@state() busy = false
	@state()
	items: Map<string, Item> = new Map()
	@state() foldersTree: TreeNode<IFolder>[] = FoldersTree.createFolderTree($folders.value)

	connectedCallback(): void {
		super.connectedCallback()
		$folders.subscribe({
			next: folders => {
				this.foldersTree = FoldersTree.createFolderTree(folders)
				this.requestUpdate()
			},
		})
		merge($folders, $items)
			.pipe(distinctUntilChanged())
			.pipe(debounceTime(0), takeUntil(this.disconnecting))
			.subscribe({
				next: () => {
					this.requestUpdate()
				},
			})
		this.fetchItems()

		$items.subscribe({
			next: () => {
				this.requestUpdate()
			},
		})
	}

	fetchItems() {
		this.busy = true
		try {
			$itemsFilter.next({
				...$itemsFilter.value,
				filterBy: ['name', 'description', 'folder', 'supplier'],
			})
			$filteredItems.pipe(distinctUntilChanged(), takeUntil(this.disconnecting)).subscribe(itemsMap => {
				this.items = itemsMap
				this.requestUpdate()
			})
		} catch (error) {
			console.error('Error fetching items:', error)
		} finally {
			this.busy = false
		}
	}

	folder(id: string | null): string {
		if (!id) return 'Root'
		const folder = $folders.value.get(id)
		return folder?.name ?? 'Root'
	}

	render() {
		console.count()
		const cols = '4rem 2fr auto'

		return html`
			<schmancy-grid ${fullHeight()} class="pt-5 pb-2" rows="auto auto 1fr" flow="row" gap="sm">
				<schmancy-nav-drawer-appbar>
					<!-- header -->
					<schmancy-grid flow="col" align="center" gap="sm">
						<schmancy-typography type="headline"> Items </schmancy-typography>
						<!-- search -->
						<schmancy-input
							placeholder="Search"
							.value=${$itemsFilter.value.filter.get('search') ?? ''}
							@input=${(event: Event) => {
								const input = event.target as HTMLInputElement
								$itemsFilter.value.filter.clear()
								$itemsFilter.value.filter.set('search', input.value)
								$itemsFilter.next({
									...$itemsFilter.value,
									filterBy: ['name', 'description', 'folder', 'supplier', 'unit'],
								})
							}}
						></schmancy-input>
						<!-- add item -->
						<schmancy-icon-button @click=${() => sheet.open({ component: new ItemForm() })}>add</schmancy-icon-button>
					</schmancy-grid>
				</schmancy-nav-drawer-appbar>

				<schmancy-flex class="max-h-[15vh] overflow-scroll py-2" gap="sm">
					<schmancy-grid gap="sm" class="max-h-[20vh] overflow-y-scroll">
						<!-- repeat all chips if any category is selected -->
						${litMap(
							FoldersTree.getFolderPath(this.foldersTree, $itemsFilter.value.filter.get('folder') ?? null),
							i => html`
								<schmancy-chips @change=${this.handleFolderChange} .value=${i ?? ''}>
									${repeat(
										(i === null
											? this.foldersTree
											: FoldersTree.getSubTreeByFolderId(this.foldersTree, i)?.children ?? []
										).filter(
											folder =>
												folder.children.length > 0 ||
												// filter out folders that have no items
												Array.from($items.value.values()).some(item => item.folder === folder.data.id),
										),
										folder => folder.data.id,
										folder => html`
											<schmancy-chip label=${folder.data.name} value=${folder.data.id} selected> </schmancy-chip>
										`,
									)}
								</schmancy-chips>
							`,
						)}
					</schmancy-grid>
				</schmancy-flex>

				<!-- list of items -->
				${when(
					this.items.size > 0,
					() => html`
						<schmancy-surface class="h-full" fill type="surfaceBright" rounded="all" elevation="2">
							<schmancy-grid class="h-full" rows="auto 1fr">
								<schmancy-surface rounded="top" elevation="1" type="containerHighest" class="sticky top-0 z-10">
									<schmancy-grid class="px-[16px] py-2" align="center" justify="start" gap="sm" cols="${cols}">
										<span></span>
										<schmancy-typography align="left" type="label" token="lg"> Name </schmancy-typography>

										<span></span>
									</schmancy-grid>
								</schmancy-surface>
								<lit-virtualizer
									scroller
									.items=${Array.from(this.items.values())}
									.renderItem=${(item: Item) => {
										return html`
											<reuse-product
												@click=${() => sheet.open({ component: new ItemForm(item) })}
												.item=${item}
											></reuse-product>
										` as TemplateResult
									}}
								></lit-virtualizer>
							</schmancy-grid>
						</schmancy-surface>
					`,
					() => html`<schmancy-typography>No items found.</schmancy-typography>`,
				)}
			</schmancy-grid>
		`
	}

	handleFolderChange(event: Event) {
		const select = event.target as HTMLSelectElement
		let selectedFolder = select.value || null
		if (!selectedFolder) {
			selectedFolder = ''
			$itemsFilter.value.filter.delete('folder')
		} else {
			$itemsFilter.value.filter.clear()
			$itemsFilter.value.filter.set('folder', selectedFolder)
		}
		$itemsFilter.next({
			...$itemsFilter.value,
			filterBy: ['folder'],
		})
	}
	handleSupplierChange(event: Event) {
		const select = event.target as HTMLSelectElement
		let selectedSupplier = select.value || null
		if (!selectedSupplier) {
			selectedSupplier = ''
			$itemsFilter.value.filter.delete('supplier')
		} else {
			$itemsFilter.value.filter.clear()
			$itemsFilter.value.filter.set('supplier', selectedSupplier)
		}
		$itemsFilter.next({
			...$itemsFilter.value,
			filterBy: ['supplier'],
		})
		this.requestUpdate()
	}
}
