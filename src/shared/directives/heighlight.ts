import { ReactiveController, ReactiveControllerHost } from 'lit'
import { filter, fromEvent, merge, of, repeat, Subject, switchMap, take, takeUntil, tap } from 'rxjs'

export default class HighlightController implements ReactiveController {
	data: any = {}
	component: string = ''
	host: (ReactiveControllerHost & HTMLElement) | HTMLElement
	disconnecting = new Subject<void>()
	color = '#FFB74D'
	constructor(host: (ReactiveControllerHost & HTMLElement) | HTMLElement, component: string) {
		this.host = host
		this.component = component
	}
	hostConnected() {
		this.enableHighlighting()
	}
	hostDisconnected() {
		this.disconnecting.next()
		this.disconnecting.complete()
	}

	enableHighlighting() {
		this.host.style.outline = '1px solid transparent'
		merge(
			fromEvent<MouseEvent>(this.host, 'dragover'),
			fromEvent<MouseEvent>(this.host, 'dragenter'),
			fromEvent<MouseEvent>(this.host, 'mouseover'),
			fromEvent<MouseEvent>(this.host, 'mouseenter'),
		)
			.pipe(
				takeUntil(this.disconnecting),
				take(1),
				filter(() => this.host.querySelector('#heightlight-label') === null),
				switchMap(e =>
					of(e).pipe(
						tap({
							next: e => {
								e.stopPropagation()
								const labelContainer = document.createElement('label')
								labelContainer.id = 'heightlight-label'
								labelContainer.style.position = 'absolute'
								labelContainer.style.top = 0 + 'px'
								labelContainer.style.left = 0 + 'px'
								labelContainer.style.zIndex = '9999'
								labelContainer.style.backgroundColor = 'rgba(0,0,0,0.5)'
								labelContainer.style.color = 'white'
								labelContainer.style.padding = '0.25rem'
								labelContainer.style.fontSize = '0.75rem'
								labelContainer.style.fontFamily = 'monospace'
								labelContainer.style.borderRadius = '0.25rem'
								labelContainer.style.pointerEvents = 'none'
								labelContainer.innerText = this.component
								this.host.appendChild(labelContainer)
								this.host.style.outline = `1px solid ${this.color}`
								this.host.style.outlineOffset = '-1px'
								this.host.style.filter = `drop-shadow(0 0 0.25rem ${this.color}})`
							},
						}),
						switchMap(() =>
							merge(
								fromEvent(this.host, 'dragend'),
								fromEvent(this.host, 'dragleave'),
								fromEvent(window, 'dragenter'),
								fromEvent(this.host, 'mouseout'),
								fromEvent(this.host, 'mouseleave'),
							).pipe(take(1), takeUntil(this.disconnecting)),
						),
						tap({
							complete: () => {
								this.host.style.outline = '1px solid transparent'
								this.host.style.filter = 'none'
								this.host.querySelector('#heightlight-label')?.remove()
							},
						}),
					),
				),
				repeat(),
				takeUntil(this.disconnecting),
			)
			.subscribe({})
	}
}
