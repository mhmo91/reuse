import { ReactiveController, ReactiveControllerHost } from 'lit'
import { combineLatestWith, fromEvent, map, merge, Subject, switchMap, takeUntil, tap, throttleTime } from 'rxjs'
import { v4 as uuidv4 } from 'uuid'
import { COMPONENT_BEING_DRAGGED } from './draggable'
import { CUSTOM_EVENTS } from './interfaces'
export type AddComponentCustomEvent = {
	target: any
	parentID: string
}
export type MoveComponentCustomEvent = {
	uuid: string
	parentID: string
}

export class DropController implements ReactiveController {
	host: ReactiveControllerHost & HTMLElement
	disconnecting = new Subject<void>()
	recieverID: string
	constructor(host: ReactiveControllerHost & HTMLElement, recieverID: string) {
		;(this.host = host).addController(this)
		this.recieverID = recieverID
	}
	hostConnected() {
		this.handleDragDrop()
	}
	hostDisconnected() {
		this.disconnecting.next()
		this.disconnecting.complete()
	}

	styleWehnDragOver() {
		this.host.style.outline = '1px solid rgb(6 182 212)'
	}

	removeDragOverStyle() {
		this.host.style.outline = '1px solid transparent'
	}

	handleDragDrop() {
		merge(
			fromEvent<DragEvent>(this.host, 'dragover')
				.pipe(
					tap({
						next: e => {
							e.stopPropagation()
							e.preventDefault()
							this.styleWehnDragOver()
						},
					}),
					throttleTime(100, undefined, { leading: false, trailing: true }),
					takeUntil(this.disconnecting),
				)
				.pipe(
					combineLatestWith(
						fromEvent<CustomEvent<COMPONENT_BEING_DRAGGED>>(window, CUSTOM_EVENTS.COMPONENT_BEING_DRAGGED).pipe(
							map(e => e.detail),
						),
					),
				),
		)
			.pipe(
				switchMap(([_, a]) => {
					const { clone, uuid, name } = a
					return fromEvent<DragEvent>(this.host, 'drop')
						.pipe(
							tap({
								next: e => {
									e.stopPropagation()
									e.preventDefault()
									this.removeDragOverStyle()
									if (clone) {
										this.host.dispatchEvent(
											new CustomEvent<AddComponentCustomEvent>('componentAdded', {
												detail: {
													target: {
														name,
														uuid: uuidv4(),
														props: {},
														children: [],
													},
													parentID: this.recieverID,
												},
												bubbles: true,
												composed: true,
											}),
										)
									} else {
										this.host.dispatchEvent(
											new CustomEvent<MoveComponentCustomEvent>('componentMoved', {
												detail: {
													uuid: uuid,
													parentID: this.recieverID,
												},
												bubbles: true,
												composed: true,
											}),
										)
									}
								},
							}),
						)
						.pipe(
							takeUntil(
								fromEvent<DragEvent>(this.host, 'dragleave').pipe(
									tap({
										next: () => {
											this.removeDragOverStyle()
										},
									}),
								),
							),
						)
				}),
				takeUntil(this.disconnecting),
			)
			.subscribe()
	}
}
