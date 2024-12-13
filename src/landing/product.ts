import { Item } from '@db/items.collection'
import { $LitElement } from '@mhmo91/lit-mixins/src'
import { SchmancyTheme } from '@mhmo91/schmancy'
import { css, html } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js'

@customElement('reuse-product')
export class ReuseProduct extends $LitElement(css`
	:host {
		max-width: max(100vw, 380px);
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
`) {
	@property({ type: Object }) item!: Item
	@state() private selectedIndex: number = 0

	// Querying the carousel container and items
	@query('#carousel') private carousel!: HTMLDivElement

	private observer!: IntersectionObserver

	private createObserver() {
		const options = {
			root: this.carousel,
			threshold: 0.5, // Trigger when 50% of the element is visible
		}

		this.observer = new IntersectionObserver(entries => {
			console.log(entries)
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					// Get the index of the visible carousel item
					const index = Array.from(this.carousel.querySelectorAll('.carousel-item')).indexOf(entry.target as Element)
					this.selectedIndex = index
				}
			})
		}, options)

		// Observe each carousel item
		this.carousel.querySelectorAll('.carousel-item').forEach(item => {
			this.observer.observe(item)
		})
	}

	protected firstUpdated() {
		this.createObserver()
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		if (this.observer) {
			this.observer.disconnect()
		}
	}

	protected render(): unknown {
		return html`
			<schmancy-surface type="containerLow">
				<div class="relative inset-0">
					<div
						class="rounded-t-md h-[60vh] relative w-full flex gap-0 snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-hide"
						id="carousel"
					>
						${repeat(
							this.item?.images ?? [],
							i => i,
							i => html`
								<div class="carousel-item snap-always snap-center shrink-0 first:pl-0 last:pr-0">
									<img src="${i}" alt="Product image" class="aspect-[2/3] h-full w-auto object-cover" />
								</div>
							`,
						)}
					</div>
					<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
						${repeat(
							this.item?.images ?? [],
							(_, index) => index,
							(_, index) => html`
								<div
									class="w-3 h-3 rounded-full "
									style="background:${index === this.selectedIndex
										? SchmancyTheme.sys.color.primary.default
										: SchmancyTheme.sys.color.surface.default}"
								></div>
							`,
						)}
					</div>
				</div>

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
