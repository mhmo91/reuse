import { ReactiveController, ReactiveControllerHost } from 'lit'
import { fromEvent, Subject } from 'rxjs'

export default class VisibilityController implements ReactiveController {
	host: ReactiveControllerHost & HTMLElement
	magicKey: string
	toggler!: ' ' | 'ctrl+space' | string
	disconnecting = new Subject<void>()
	constructor(
		host: ReactiveControllerHost | HTMLElement,
		magicKey: string,
		toggler: string,
		defaultVisibility: 'visible' | 'hidden' = 'visible',
	) {
		// @ts-ignore
		;(this.host = host)?.addController(this)
		this.magicKey = magicKey
		this.toggler = toggler
		this.host.style.visibility = defaultVisibility
	}
	hostConnected() {
		// db.collection<boolean>('settings')
		// 	.get(`visibility.${this.magicKey}`)
		// 	.subscribe({
		// 		next: show => {
		// 			this.host.style.visibility = show ? 'visible' : 'hidden'
		// 		},
		// 	})
		fromEvent<KeyboardEvent>(document, 'keydown').subscribe({
			next: (e: KeyboardEvent) => {
				if (e.key === this.toggler && e.ctrlKey) {
					// db.collection('settings')
					// 	.add(!(this.host.style.visibility === 'visible' ? true : false), `visibility.${this.magicKey}`)
					// 	.subscribe()
					this.host.style.visibility = this.host.style.visibility === 'hidden' ? 'visible' : 'hidden'
				}
			},
		})
	}
	hostDisconnected() {
		this.disconnecting.next()
		this.disconnecting.complete()
	}
}
