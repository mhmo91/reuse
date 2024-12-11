// folder-form.ts

import { Folder, FoldersDB, IFolder } from '@db/folders.collection'
import { $LitElement } from '@mhmo91/lit-mixins/src'
import { $notify, SchmancyInputChangeEvent, sheet } from '@mhmo91/schmancy'
import { html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { firstValueFrom } from 'rxjs'
import './select-folder'
import { $folders } from './context'

@customElement('folder-form')
export default class FolderForm extends $LitElement() {
	@state() folder!: IFolder
	@state() busy: boolean = false
	@state() availableFolders: IFolder[] = []

	constructor(folder: IFolder = new Folder()) {
		super()
		this.folder = folder
	}

	connectedCallback(): void {
		super.connectedCallback()
		// Fetch existing folders excluding the current one to prevent circular references
		$folders.subscribe({
			next: folders => {
				this.availableFolders = Array.from(folders.values()).filter(f => f.id !== this.folder.id)
			},
		})
	}

	async saveFolder(folder: IFolder): Promise<void> {
		this.busy = true
		try {
			console.log('folder', folder)
			const folderData = { ...folder } // Convert to plain object
			await firstValueFrom(FoldersDB.upsert(folderData, folder.id))
			$folders.next(new Map<string, IFolder>([...$folders.value.entries(), [folderData.id, folderData]]))
			sheet.dismiss(this.tagName)
			$notify.success('Folder saved successfully.')
			this.busy = false
		} catch (error) {
			console.error('Error saving folder:', error)
			$notify.error('Error saving folder, please try again.')
			this.busy = false
		}
	}

	protected render(): unknown {
		return html`
			${when(this.busy, () => html`<schmancy-busy class="fixed inset-0"></schmancy-busy>`)}
			<schmancy-form
				@submit=${(e: Event) => {
					e.preventDefault()
					this.saveFolder(this.folder)
				}}
			>
				<schmancy-grid class="min-h-[30vh]  px-6 py-8" gap="md">
					<!-- Folder Name -->
					<schmancy-input
						.value=${this.folder.name}
						required
						type="text"
						placeholder="Folder Name"
						@change=${(e: SchmancyInputChangeEvent) => {
							this.folder.name = e.detail.value
						}}
					></schmancy-input>
					<!-- Description -->
					<schmancy-input
						.value=${this.folder.description ?? ''}
						type="text"
						placeholder="Description"
						@change=${(e: SchmancyInputChangeEvent) => {
							this.folder.description = e.detail.value
						}}
					></schmancy-input>
					<folder-select
						class="w-full"
						.value=${this.folder.parentId ?? ''}
						placeholder="Select Folder"
						@change=${(
							e: CustomEvent<{
								value: string
							}>,
						) => {
							this.folder.parentId = e.detail.value
						}}
					></folder-select>
					<schmancy-button variant="filled" type="submit">
						${this.folder.id ? 'Update Folder' : 'Create Folder'}
					</schmancy-button>
				</schmancy-grid>
			</schmancy-form>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'folder-form': FolderForm
	}
}
