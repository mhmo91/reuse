import { $LitElement } from '@mhmo91/lit-mixins/src'
import { $newSchmancyTheme, $notify, area, fullHeight } from '@mhmo91/schmancy'
import { html } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { fromEvent, map, of, switchMap, take, tap, zip } from 'rxjs'
// import ZolaApp from './app/app'
import { FoldersDB } from '@db/folders.collection'
import { ItemsDB } from '@db/items.collection'
import '@lit-labs/virtualizer'
import Admin from './admin/admin'
import { $folders } from './admin/folders/context'
import { $items, $itemsFilter } from './admin/items/context'
import AppLanding from './landing/landing'
import './shared'
@customElement('app-index')
export class AppIndex extends $LitElement() {
	@state() rehydrated = false
	@query('schmancy-surface') surface!: HTMLElement

	async connectedCallback() {
		super.connectedCallback()

		// @ts-ignore
		$newSchmancyTheme.next()

		const query = new URLSearchParams(location.search)
		if (query.has('admin')) {
			area.push({
				component: Admin,
				area: 'root',
			})
		}

		this.rehydrated = true

		if (!navigator.onLine) {
			$notify.error('No internet connection')
			fromEvent(window, 'online')
				.pipe(take(1))
				.subscribe(() => {
					$notify.success('Internet connection restored')
					// this.init()
				})
		} else {
			// this.init()
		}

		// reset itemsFilter
		$itemsFilter.next({
			filter: new Map(),
			filterBy: ['folder'],
		})
		zip(
			$folders.pipe(
				take(1),
				switchMap(a => {
					if (a.size === 0) {
						return FoldersDB.query([])
					}
					return of(a)
				}),
				map(
					a =>
						new Map(
							[...a].sort((a, b) => {
								if (a[1].name > b[1].name) {
									return 1
								}
								if (a[1].name < b[1].name) {
									return -1
								}
								return 0
							}),
						), // sort folders by name
				),
				tap(a => $folders.next(a)),
			),
			$items.pipe(
				take(1),
				switchMap(a => {
					if (a.size === 0) {
						return ItemsDB.query([])
					}
					return of(a)
				}),
				tap(a => $items.next(a)),
				// map(
				// 	a =>
				// 		new Map(
				// 			[...a].sort((a, b) => {
				// 				if (a[1].name > b[1].name) {
				// 					return 1
				// 				}
				// 				if (a[1].name < b[1].name) {
				// 					return -1
				// 				}
				// 				return 0
				// 			}),
				// 		), // sort folders by name
				// ),
				// tap(a => $folders.next(a)),
			),
		).subscribe()
	}

	render() {
		return html`
			<!-- <schmancy-theme-button> </schmancy-theme-button> -->
			<schmancy-surface ${fullHeight()} type="container">
				${when(
					this.rehydrated,
					() => html` <schmancy-area class="h-full w-full" name="root" .default=${AppLanding}></schmancy-area> `,
					() => html` <schmancy-busy></schmancy-busy> `,
				)}
				<schmancy-notification-outlet></schmancy-notification-outlet>
			</schmancy-surface>
			<!-- Add the floating WhatsApp button here -->
			<whatsapp-float-button></whatsapp-float-button>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'app-index': AppIndex
	}
}
