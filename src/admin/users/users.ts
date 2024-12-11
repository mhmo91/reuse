import { $LitElement } from '@mhmo91/lit-mixins/src'
import { SchmancySheetPosition, sheet } from '@mhmo91/schmancy'
import { html, TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { switchMap } from 'rxjs'
import { $usersFilter } from './context'
import UserForm from './user-form'
import { $user } from 'src/context'
import { TUser, UsersDB } from '@db/users.collection'

@customElement('momo-users')
export default class Users extends $LitElement() {
	@state() busy: boolean = false

	@state() users: Map<string, TUser> = new Map()
	connectedCallback(): void {
		super.connectedCallback()
		console.log('connected', $user.value)
		$usersFilter.pipe(switchMap(() => UsersDB.query([]))).subscribe(users => {
			console.log(users)
			this.users = users
			this.requestUpdate()
		})
	}
	render() {
		const cols = '1fr 1fr 1fr 1fr'
		return html`
			<schmancy-grid class="mb-4" cols="auto 1fr auto" gap="md" align="center">
				${when(this.busy, () => html`<schmancy-busy class="fixed inset-0"></schmancy-busy> `)}
				<schmancy-typography type="headline"> Users </schmancy-typography>
				<span></span>
				<schmancy-button
					variant="filled"
					@click=${() => {
						sheet.open({
							component: new UserForm(),
							position: SchmancySheetPosition.Side,
						})
					}}
				>
					Create User
				</schmancy-button>
			</schmancy-grid>
			<schmancy-surface type="containerLow" rounded="all" elevation="2">
				<schmancy-grid cols="1fr" gap="md">
					<schmancy-surface rounded="top" elevation="1" type="containerHighest" class="sticky top-0 z-10 ">
						<schmancy-grid class="px-3 py-3" .cols=${cols} gap="md">
							<schmancy-typography weight="bold">Name</schmancy-typography>
							<schmancy-typography weight="bold">Email</schmancy-typography>
							<schmancy-typography weight="bold">Role</schmancy-typography>
						</schmancy-grid>
					</schmancy-surface>
					<schmancy-list class="px-0 py-0" type="surface">
						<lit-virtualizer
							class="flex-grow"
							style="display:flex!important;"
							.items=${Array.from(this.users.values()) as Array<TUser>}
							.renderItem=${(user: TUser, i: number): TemplateResult => {
								return html`
									<schmancy-list-item class="w-full">
										<schmancy-grid .cols=${cols} gap="md">
											<schmancy-typography weight="bold">${user.displayName}</schmancy-typography>
											<schmancy-typography>${user.email}</schmancy-typography>
											<schmancy-typography>${user.role}</schmancy-typography>
											<schmancy-grid flow="col" gap="sm">
												<schmancy-icon-button
													@click=${() => {
														const yes = confirm('Are you sure you want to delete this user?')
														if (yes) {
															alert(Array.from(this.users.keys())[i])
															UsersDB.delete(user.uid)
														}
													}}
												>
													delete
												</schmancy-icon-button>
												<!-- edit -->
												<schmancy-icon-button
													@click=${() => {
														sheet.open({
															component: new UserForm(user),
															position: SchmancySheetPosition.Side,
														})
													}}
												>
													edit
												</schmancy-icon-button>
											</schmancy-grid>
										</schmancy-grid>
									</schmancy-list-item>
								` as TemplateResult
							}}
						>
						</lit-virtualizer>
					</schmancy-list>
				</schmancy-grid>
			</schmancy-surface>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'admin-users': Users
	}
}
