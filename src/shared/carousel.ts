import { $LitElement } from '@mhmo91/lit-mixins/src'
import { SchmancyTheme } from '@mhmo91/schmancy'
import { css, html } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js'

@customElement('schmancy-carousel')
export default class SchmancyCarouselComponent extends $LitElement(
	css`
		.scrollbar-hide {
			-ms-overflow-style: none;
			scrollbar-width: none;
		}
		.scrollbar-hide::-webkit-scrollbar {
			display: none;
		}
	`,
) {
	@property({ type: Array }) images: string[] = []

	@state() private selectedIndex: number = 0

	// Querying the carousel container and items
	@query('#carousel') private carousel!: HTMLDivElement

	private observer!: IntersectionObserver

	private createObserver() {
		const options = {
			root: null,
			threshold: 0.8, // Trigger when 50% of the element is visible
		}

		this.observer = new IntersectionObserver(entries => {
			console.log(entries)
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					// Get the index of the visible carousel item
					const index = Array.from(this.carousel.querySelectorAll('.carousel-item')).indexOf(entry.target as Element)
					this.selectedIndex = index
					console.log('Index:', index)
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
		this.carousel.scrollLeft = 0
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		if (this.observer) {
			this.observer.disconnect()
		}
	}
	render() {
		return html`
			<div class="relative inset-0">
				<div class="flex overflow-x-auto scrollbar-hide" id="carousel">
					${repeat(
						this.images ?? [],
						i => i,
						i =>
							html`
								<img
									loading="lazy"
									src="${i}"
									alt="Product image"
									class="h-[70vh] carousel-item aspect-[2/3] w-auto object-cover"
								/>
							`,
					)}
				</div>
				<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
					${repeat(
						this.images ?? [],
						(_, index) => index,
						(_, index) => html`
							<div
								class="w-3 h-3 rounded-full"
								style="background:${index === this.selectedIndex
									? SchmancyTheme.sys.color.primary.default
									: SchmancyTheme.sys.color.surface.default}"
							></div>
						`,
					)}
				</div>
			</div>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'schmancy-carousel': SchmancyCarouselComponent
	}
}
