import { customElement } from 'lit/decorators.js'
import { $LitElement } from '@mhmo91/lit-mixins/src'
import { html } from 'lit'
import { fullHeight } from '@mhmo91/schmancy'
import './product'
import { repeat } from 'lit/directives/repeat.js'
import { $items } from 'src/admin/items/context'
@customElement('app-landing')
export default class AppLanding extends $LitElement() {
	connectedCallback(): void {
		super.connectedCallback()
		$items.subscribe({
			next: () => {
				this.requestUpdate()
			},
		})
	}
	render() {
		return html`
			<schmancy-surface ${fullHeight()} type="container">
				<schmancy-grid class="px-2 pt-4 pb-8" gap="md" justify="center">
					<img class="rounded-full h-24" src="/logo.jpeg" />
					<schmancy-typography type="title">
						<schmancy-animated-text .resetOnScroll=${false}> New and second hand clothing.</schmancy-animated-text>
					</schmancy-typography>
					<schmancy-typography type="title">
						<schmancy-animated-text .resetOnScroll=${false} delay="2000">
							Original from Europe!
						</schmancy-animated-text>
					</schmancy-typography>
				</schmancy-grid>
				<schmancy-grid gap="lg">
					${repeat(
						$items.value,
						i => i[1].id,
						i => html` <reuse-product .item=${i[1]}></reuse-product> `,
					)}
					<reuse-product></reuse-product>
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
