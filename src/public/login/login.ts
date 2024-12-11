import { auth } from '@db/firebase'
import { $LitElement } from '@mhmo91/lit-mixins/src'
import { $notify, HISTORY_STRATEGY, SchmancyInputChangeEvent, area, fullHeight } from '@mhmo91/schmancy'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import Admin from 'src/admin/admin'

@customElement(`momo-login`)
export default class Login extends $LitElement(
	css`
		:host {
			display: block;
			position: relative;
		}
	`,
) {
	@state() busy = false
	@state() loginCredentials = { email: '', password: '' }

	// http://localhost:5173/?admin&a=scan@funkhaus-berlin.net&b=Scan1!
	connectedCallback(): void {
		super.connectedCallback()
		// extract email and password from query param if found
		const urlParams = new URLSearchParams(window.location.search)
		const email = urlParams.get('a')
		const password = urlParams.get('b')
		if (email && password) {
			this.busy = true
			this.loginCredentials = { email, password }
			this.login()
		}
		auth.onAuthStateChanged(user => {
			if (user === null) return
		})
	}

	login() {
		// login with email and password
		this.busy = true
		signInWithEmailAndPassword(auth, this.loginCredentials.email, this.loginCredentials.password)
			.then(() => {
				this.busy = false
				console.log('logged in')
				area.push({
					component: Admin,
					area: 'root',
					historyStrategy: HISTORY_STRATEGY.replace,
				})
			})
			.catch(error => {
				this.busy = false
				$notify.error('Invalid credentials, please try again')
				console.error(error)
			})
	}

	render() {
		return html` <section ${fullHeight()}>
			<schmancy-grid gap="md" rows="0.5fr auto auto 1fr" justify="stretch" align="stretch" class="w-full px-6 h-full">
				<span></span>
				<schmancy-typography align="center" type="display" class="text-center">
					<schmancy-animated-text> Login </schmancy-animated-text>
				</schmancy-typography>
				<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm h-full">
					<schmancy-form class="space-y-6 w-full" @submit=${this.login}>
						<schmancy-grid gap="md" justify="stretch" align="stretch">
							<schmancy-input
								class="w-full"
								placeholder="Email address"
								id="email"
								name="email"
								type="email"
								autocomplete="email"
								required
								@change=${(e: SchmancyInputChangeEvent) => {
									this.loginCredentials!.email = e.detail.value
								}}
								.readonly=${this.busy}
							></schmancy-input>
							<schmancy-input
								class="w-full"
								placeholder="Password"
								name="password"
								type="password"
								autocomplete="password"
								required
								@change=${(e: SchmancyInputChangeEvent) => {
									this.loginCredentials!.password = e.detail.value
								}}
							>
							</schmancy-input>

							<schmancy-button .disabled=${this.busy} variant="filled" type="submit" width="full">
								${when(
									this.busy,
									() => html`on it...`,
									() => html`Next`,
								)}
							</schmancy-button>
						</schmancy-grid>
					</schmancy-form>
				</div>
				<span></span>
			</schmancy-grid>
		</section>`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'swift-hr-login': Login
	}
}
