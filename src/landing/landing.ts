import { FoldersTree, IFolder, TreeNode } from '@db/folders.collection'
import { Item } from '@db/items.collection'
import { $LitElement } from '@mhmo91/lit-mixins/src'
import { fullHeight, SchmancySheetPosition, sheet } from '@mhmo91/schmancy'
import { html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { map as litMap } from 'lit/directives/map.js'
import { repeat } from 'lit/directives/repeat.js'
import { debounceTime, distinctUntilChanged, merge, takeUntil } from 'rxjs'
import { $folders } from 'src/admin/folders/context'
import { $filteredItems, $items, $itemsFilter } from 'src/admin/items/context'
import './product'
import ReuseAbout from './about'

@customElement('app-landing')
export default class AppLanding extends $LitElement() {
	@state() foldersTree: TreeNode<IFolder>[] = FoldersTree.createFolderTree($folders.value)
	@state()
	items: Map<string, Item> = new Map()

	connectedCallback(): void {
		super.connectedCallback()
		$filteredItems.subscribe({
			next: items => {
				this.items = items
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

		$folders.subscribe({
			next: folders => {
				this.foldersTree = FoldersTree.createFolderTree(folders)
				this.requestUpdate()
			},
		})
		$itemsFilter.subscribe({
			next: x => {
				console.log('filter', x.filter.get('folder'))
				this.requestUpdate()
			},
		})
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
	render() {
		return html`
			<schmancy-surface ${fullHeight()} type="container">
				<schmancy-grid class="px-2 pt-4 pb-8" gap="sm" justify="center">
					<img class="rounded-full h-24" src="/logo.jpeg" />
					<schmancy-typography type="title">
						<schmancy-animated-text .resetOnScroll=${false}> New and second hand clothing.</schmancy-animated-text>
					</schmancy-typography>
					<schmancy-typography type="title">
						<schmancy-animated-text .resetOnScroll=${false} delay="2000">
							Original from Europe!
						</schmancy-animated-text>
					</schmancy-typography>
					<schmancy-button
						@click=${() =>
							sheet.open({
								component: new ReuseAbout(),
								position: SchmancySheetPosition.Bottom,
								header: 'hidden',
							})}
						variant="filled tonal"
					>
						<schmancy-icon> location_on </schmancy-icon>
						Find us
					</schmancy-button>
				</schmancy-grid>
				<schmancy-grid flow="row" justify="center" gap="sm" class="overflow-x-scroll overflow-y-scroll pb-4">
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
										<schmancy-chip
											label=${folder.data.name}
											value=${folder.data.id}
											.selected=${$itemsFilter.value.filter.get('folder') === folder.data.id}
										>
										</schmancy-chip>
									`,
								)}
							</schmancy-chips>
						`,
					)}
				</schmancy-grid>
				<schmancy-grid class="max-w-md mx-auto" gap="lg">
					${repeat(
						this.items.entries(),
						([i]) => i,
						([_, item]) => html` <reuse-product .item=${item}></reuse-product> `,
					)}
				</schmancy-grid>
			</schmancy-surface>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'app-landing': AppLanding
	}
}
