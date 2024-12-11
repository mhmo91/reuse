import { takeUntil } from 'rxjs'

import { ReactiveController, ReactiveControllerHost } from 'lit'
import { Directive, PartInfo, directive } from 'lit/directive.js'
import { Subject, fromEvent, tap } from 'rxjs'
import { CUSTOM_EVENTS } from './interfaces'

export type COMPONENT_BEING_DRAGGED = {
	clone: boolean
	uuid: string
	name: string
}

export default class DraggableController implements ReactiveController {
	settings!: COMPONENT_BEING_DRAGGED
	host: (ReactiveControllerHost & HTMLElement) | HTMLElement
	disconnecting = new Subject<void>()
	constructor(
		host: (ReactiveControllerHost & HTMLElement) | HTMLElement,
		settings: {
			uuid: string
			name: string
			clone: boolean
		},
	) {
		this.settings = settings
		this.host = host
	}
	hostConnected() {
		enableDragging(this.host, this.settings, this.disconnecting)
	}
	hostDisconnected() {
		this.disconnecting.next()
		this.disconnecting.complete()
	}
}

function enableDragging(
	host: (ReactiveControllerHost & HTMLElement) | HTMLElement,
	settings: COMPONENT_BEING_DRAGGED,
	disconnecting: Subject<void>,
) {
	host.setAttribute('draggable', 'true')
	host.style.cursor = 'grab'
	fromEvent(host, 'dragstart')
		.pipe(
			tap({
				next: e => {
					e.stopImmediatePropagation()
					e.stopPropagation()
					host.style.cursor = 'grabbing'
					window.dispatchEvent(
						new CustomEvent<COMPONENT_BEING_DRAGGED>(CUSTOM_EVENTS.COMPONENT_BEING_DRAGGED, {
							detail: { ...settings },
							bubbles: true,
							composed: true,
						}),
					)
				},
			}),
		)
		.subscribe(e => {
			e.stopImmediatePropagation()
			e.stopPropagation()
		})

	fromEvent(host, 'mousedown')
		.pipe(takeUntil(disconnecting))
		.subscribe(e => {
			e.stopPropagation()
		})
}

class DraggableDirective extends Directive {
	settings: COMPONENT_BEING_DRAGGED = { clone: false, name: '', uuid: '' }
	target!: HTMLElement
	disconnecting = new Subject<void>()
	constructor(_partInfo: PartInfo) {
		super(_partInfo)
		// @ts-ignore
		this.target = _partInfo.element as HTMLElement
	}

	render(settings: COMPONENT_BEING_DRAGGED) {
		this.settings = settings
		this.disconnecting.next()
		enableDragging(this.target, this.settings, this.disconnecting)
		return this
	}
}

export const draggable = directive(DraggableDirective)
