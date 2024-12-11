import { Item } from '@db/items.collection'
import { $LitElement } from '@mhmo91/lit-mixins/src'
import { css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js'

@customElement('reuse-product')
export class ReuseProduct extends $LitElement(css`
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
`) {
	@property({ type: Object }) item!: Item
	protected render(): unknown {
		return html`
			<schmancy-surface type="containerLow">
				<div class="mx-auto max-w-2xl">
					<div class="grid grid-cols-1 gap-x-6 gap-y-2">
						<div
							class="relative w-full flex gap-0 snap-x snap-mandatory overflow-x-auto  scroll-smooth scrollbar-hide"
							id="carousel"
						>
							${repeat(
								this.item.images,
								i => i,
								i => html` <div class="snap-always snap-center shrink-0 first:pl-0 last:pr-0">
									<img
										src="${i}"
										alt="Olive drab green insulated bottle with flared screw lid and flat top."
										class="h-[60vh] max-w-[100vw] aspect-square w-full rounded-lg bg-gray-200 object-cover group-hover:opacity-75 xl:aspect-[7/8]"
									/>
								</div>`,
							)}

							<!-- Spacer at end -->
							<div class="snap-center shrink-0">
								<div class="shrink-0 w-4 sm:w-48"></div>
							</div>
						</div>
						<schmancy-grid class="py-2 px-2" align="center" justify="center" cols="auto auto 1fr auto" gap="md">
							<schmancy-typography type="title"> Nike </schmancy-typography>
							<schmancy-grid flow="col" gap="sm">
								<schmancy-icon>straighten</schmancy-icon>
								<schmancy-typography type="title"> 48 </schmancy-typography>
							</schmancy-grid>
							<span></span>
							<p class="mt-1 text-lg font-medium text-gray-900">$48</p>
						</schmancy-grid>
					</div>
				</div>
			</schmancy-surface>
		`
	}
}
