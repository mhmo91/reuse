import { TUser, User } from '@db/users.collection'
import { $LitElement } from '@mhmo91/lit-mixins/src'
import { $notify, schmancyCheckBoxChangeEvent, SchmancyInputChangeEvent, sheet } from '@mhmo91/schmancy'
import { html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { $usersFilter } from './context'
import { default as upsertUser } from './users.api'

@customElement('user-form')
export default class UserForm extends $LitElement() {
	@state() user!: TUser
	@state() busy: boolean = false
	constructor(user: TUser = new User()) {
		super()
		this.user = user
	}

	connectedCallback(): void {
		super.connectedCallback()
	}

	async createUser(user: TUser): Promise<any> {
		this.busy = true
		try {
			await upsertUser(user)
			sheet.dismiss(this.tagName)
			$usersFilter.next({ search: '' })
			this.busy = false
		} catch (error) {
			$notify.error('Error creating user, try again, maybe?')
			this.busy = false
		}
	}

	protected render(): unknown {
		return html`
			${when(this.busy, () => html`<schmancy-busy class="fixed inset-0"></schmancy-busy>`)}
			<schmancy-form
				@submit=${() => {
					this.createUser(this.user)
				}}
			>
				<schmancy-grid class="min-h-[50vh] min-w-[400px] px-6 py-8" gap="md">
					<!-- Email -->
					<schmancy-input
						.autocomplete=${'email'}
						.value=${this.user.email}
						required
						type="email"
						placeholder="Email"
						@change=${(e: SchmancyInputChangeEvent) => {
							this.user.email = e.detail.value
						}}
					></schmancy-input>
					<!-- Password -->
					<schmancy-input
						.autocomplete=${'new-password'}
						.value=${this.user.password}
						required
						type="password"
						placeholder="Password"
						@change=${(e: SchmancyInputChangeEvent) => {
							this.user.password = e.detail.value
						}}
					></schmancy-input>
					<!-- Display Name -->
					<schmancy-input
						.value=${this.user.displayName}
						required
						type="text"
						placeholder="Name"
						@change=${(e: SchmancyInputChangeEvent) => {
							this.user.displayName = e.detail.value
						}}
					></schmancy-input>

					<!-- Role input -->
					<schmancy-input
						.value=${this.user.role ?? ''}
						required
						type="text"
						placeholder="Role"
						@change=${(e: SchmancyInputChangeEvent) => {
							this.user.role = e.detail.value
						}}
					></schmancy-input>

					<!-- Admin Toggle -->
					<schmancy-checkbox
						.value=${this.user.admin}
						@change=${(e: schmancyCheckBoxChangeEvent) => {
							this.user.admin = e.detail.value
						}}
						>Firebase Admin</schmancy-checkbox
					>

					<schmancy-button variant="filled" type="submit">
						${this.user.uid ? 'Update User' : 'Create User'}
					</schmancy-button>
				</schmancy-grid>
			</schmancy-form>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'user-form': UserForm
	}
}
