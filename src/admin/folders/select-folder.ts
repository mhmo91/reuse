// folder-select.ts

import { $LitElement } from '@mhmo91/lit-mixins/src'
import { SchmancyInputChangeEvent, SchmancySheetPosition, sheet } from '@mhmo91/schmancy'
import { html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js'
import { merge, takeUntil } from 'rxjs'
import { $folders } from './context'
import FolderForm from './folder-form'

@customElement('folder-select')
export class FolderSelect extends $LitElement() {
	@property({ type: String }) value: string = ''
	@property({ type: String }) label: string = 'Select Category'
	@property({ type: String }) excludeId: string = ''
	@state() private loading: boolean = false

	async connectedCallback(): Promise<void> {
		super.connectedCallback()
		merge($folders)
			.pipe(takeUntil(this.disconnecting))
			.subscribe({
				next: () => {
					this.requestUpdate()
				},
			})
	}

	private onChange(e: SchmancyInputChangeEvent) {
		this.value = e.detail.value
		// Dispatch a custom event to notify parent components of the change
		this.dispatchEvent(new CustomEvent('change', { detail: this.value }))
	}

	createNewFolder() {
		sheet.open({
			component: new FolderForm(),
			position: SchmancySheetPosition.Side,
		})
	}
	render() {
		return html`
			<schmancy-flex class="w-full" justify="start" align="center" gap="sm">
				${this.loading
					? html`<schmancy-spinner></schmancy-spinner>`
					: html`
							<schmancy-autocomplete
								class="w-full"
								.value=${this.value}
								label=${this.label}
								@change=${this.onChange}
								required
							>
								<schmancy-option label="Root" value="">Root</schmancy-option>
								${repeat(
									$folders.value.values(),
									folder => folder.id ?? '',
									folder => html`
										<schmancy-option .label=${folder.name} value=${folder.id ?? ''}>
											<schmancy-flex align="center" justify="between"> ${folder.name} </schmancy-flex>
											<schmancy-icon-button
												slot="support"
												@click=${() =>
													sheet.open({ component: new FolderForm(folder), position: SchmancySheetPosition.Side })}
												>edit</schmancy-icon-button
											>
										</schmancy-option>
									`,
								)}
								<schmancy-option label="" value="addNew" @click=${this.createNewFolder}>
									<schmancy-button class="mx-auto" variant="outlined">Create New</schmancy-button>
								</schmancy-option>
							</schmancy-autocomplete>
					  `}
			</schmancy-flex>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'folder-select': FolderSelect
	}
}
