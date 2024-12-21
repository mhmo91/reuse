import { customElement } from 'lit/decorators.js'
import { $LitElement } from '@mhmo91/lit-mixins/src'
import { html } from 'lit'

@customElement('reuse-about')
export default class ReuseAbout extends $LitElement() {
	protected render() {
		return html`
			<schmancy-grid class="min-h-[50vh] py-8 px-4" gap="sm">
				<schmancy-typography type="headline"> How to find us </schmancy-typography>

				<schmancy-typography>
					Contact us on Whatsapp (+46 76 710 41 24) if you are interested to come and try any of our items
				</schmancy-typography>
			</schmancy-grid>
		`
	}
}
declare global {
	interface HTMLElementTagNameMap {
		'reuse-about': ReuseAbout
	}
}
