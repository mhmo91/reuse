import { $LitElement } from '@mhmo91/lit-mixins/src'
import { SchmancyTheme } from '@mhmo91/schmancy'
import { css, html } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js'
// RxJS imports
import { fromEvent } from 'rxjs'
import { throttleTime } from 'rxjs/operators'

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

	@query('#carousel') private carousel!: HTMLDivElement

	protected firstUpdated() {
		// Ensure the carousel is at the start
		this.carousel.scrollLeft = 0

		// Set up RxJS observable for the scroll event
		fromEvent(this.carousel, 'scroll')
			.pipe(throttleTime(100)) // Throttle to improve performance
			.subscribe(() => {
				this.updateSelectedIndexOnScroll()
			})

		// After initial render, also run once to set the correct initial index
		requestAnimationFrame(() => this.updateSelectedIndexOnScroll())
	}

	private updateSelectedIndexOnScroll() {
		const items = Array.from(this.carousel.querySelectorAll('.carousel-item')) as HTMLElement[]

		if (!items.length) return

		// The horizontal center of the carousel's visible area
		const carouselCenter = this.carousel.scrollLeft + this.carousel.clientWidth / 2

		// Determine which item is closest to the carousel center
		let closestIndex = 0
		let closestDistance = Infinity

		items.forEach((item, index) => {
			// The center of the item relative to the carousel
			const itemStart = item.offsetLeft
			const itemCenter = itemStart + item.offsetWidth / 2
			const distance = Math.abs(carouselCenter - itemCenter)

			if (distance < closestDistance) {
				closestDistance = distance
				closestIndex = index
			}
		})

		this.selectedIndex = closestIndex
	}

	// No IntersectionObserver logic needed, so remove disconnectedCallback logic for that.

	render() {
		return html`
			<div class="relative inset-0">
				<div class="flex overflow-x-auto scrollbar-hide" id="carousel">
					${repeat(
						this.images ?? [],
						i => i,
						i => html`
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
