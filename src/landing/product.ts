import { Item } from '@db/items.collection'
import { $LitElement } from '@mhmo91/lit-mixins/src'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('reuse-product')
export class ReuseProduct extends $LitElement() {
	@property({ type: Object }) item!: Item

	protected render(): unknown {
		return html`
			<schmancy-surface type="containerLow">
				<schmancy-carousel .images=${this.item?.images}></schmancy-carousel>

				<schmancy-grid class="py-3 px-2" align="center" cols="auto auto 1fr auto" gap="sm">
					<schmancy-typography type="title"> ${this.item?.brand} </schmancy-typography>
					<schmancy-grid flow="col" gap="sm">
						<schmancy-icon>straighten</schmancy-icon>
						<schmancy-typography type="title">${this.item?.size} </schmancy-typography>
					</schmancy-grid>
					<span></span>

					<schmancy-typography type="title">${this.item?.price} EGP</schmancy-typography>
					<schmancy-typography class="col col-span-4 " align="left" type="body">
						${this.item?.description}
					</schmancy-typography>
				</schmancy-grid>
			</schmancy-surface>
		`
	}
}
