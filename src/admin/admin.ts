import { auth } from '@db/firebase'
import { FoldersDB } from '@db/folders.collection'
import { $LitElement } from '@mhmo91/lit-mixins/src'
import { area, fullHeight } from '@mhmo91/schmancy'
import { html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { map, of, switchMap, take, takeUntil, tap, zip } from 'rxjs'
import Login from 'src/public/login/login'
import { $folders } from './folders/context'
import Items from './items/items'
import Users from './users/users'

@customElement(`momo-admin`)
export default class Admin extends $LitElement() {
	@state() activeTab: string = 'events'

	connectedCallback(): void {
		super.connectedCallback()

		area.$current
			.pipe(
				map(r => r.get('admin')),
				takeUntil(this.disconnecting),
			)
			.subscribe(r => {
				if (!r) return
				this.activeTab = r.component.replace(/-/g, '').toLowerCase()
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
		).subscribe()
		auth.onAuthStateChanged(user => {
			if (!user) {
				area.push({
					component: Login,
					area: 'root',
				})
			} else {
				area.push({
					component: Admin,
					area: 'root',
				})
			}
		})
	}
	render() {
		return html`
			<schmancy-surface ${fullHeight()} type="container">
				<schmancy-nav-drawer minWidth="1080">
					<schmancy-nav-drawer-navbar width="180px">
						<schmancy-list .hidden=${false}>
							<schmancy-list-item
								.selected=${this.activeTab === 'reuseitems'}
								@click=${() => {
									area.push({
										component: Items,
										area: 'admin',
									})
								}}
								rounded
								variant="container"
							>
								Items
							</schmancy-list-item>
							<!-- <schmancy-list-item
								.selected=${this.activeTab === 'momousers'}
								@click=${() => {
									area.push({
										component: Users,
										area: 'admin',
									})
								}}
								rounded
								variant="container"
							>
								Users
							</schmancy-list-item> -->

							<schmancy-button
								class="fixed bottom-4 w-full"
								variant="filled"
								@click=${() => {
									auth.signOut()
									area.push({
										component: Login,
										area: 'root',
									})
								}}
							>
								Logout
							</schmancy-button>
						</schmancy-list>
					</schmancy-nav-drawer-navbar>
					<schmancy-nav-drawer-content class="rounded-lg px-4 sm:px-6 md:px-8">
						</schmancy-nav-drawer-appbar>
						<schmancy-area name="admin" .default=${Items}></schmancy-area>
					</schmancy-nav-drawer-content>
				</schmancy-nav-drawer>
			</schmancy-surface>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'momo-admin': Admin
	}
}
