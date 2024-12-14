import { storage } from '@db/firebase'
import { Item, ItemsDB } from '@db/items.collection'
import { $LitElement } from '@mhmo91/lit-mixins/src'
import { $notify, schmancyCheckBoxChangeEvent, SchmancyInputChangeEvent, sheet } from '@mhmo91/schmancy'
import { deleteObject, getDownloadURL, listAll, ref, uploadBytesResumable } from 'firebase/storage'
import { html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { firstValueFrom } from 'rxjs'
import { $items } from 'src/admin/items/context'
import { resizeImage } from 'src/shared/utils/image.utils'

@customElement('item-form')
export default class ItemForm extends $LitElement() {
	@state() item: Item = new Item()
	@state() busy: boolean = false
	@state() uploading: boolean = false
	@state() uploadProgress: number = 0

	constructor(item: Item = new Item()) {
		super()
		this.item = item
	}

	connectedCallback(): void {
		super.connectedCallback()
		console.log('Item info', this.item)
	}

	/**
	 * Handles form submission to save the item.
	 */
	private async handleFormSubmit(e: Event) {
		e.preventDefault()
		await this.saveItem(this.item)
	}

	/**
	 * Saves the item data to the database.
	 */
	private async saveItem(item: Item): Promise<void> {
		this.busy = true
		try {
			const itemData = { ...item }
			await firstValueFrom(ItemsDB.upsert(itemData, item.id))
			$items.next(new Map([...$items.value.entries(), [itemData.id, itemData]]))
			sheet.dismiss(this.tagName)
			$notify.success('Item saved successfully.')
		} catch (error) {
			console.error('Error saving item:', error)
			$notify.error('Error saving item, please try again.')
		} finally {
			this.busy = false
		}
	}

	/**
	 * Opens a file dialog for image selection and starts the upload process.
	 */
	private async handleFileSelection() {
		const fileInput = document.createElement('input')
		fileInput.type = 'file'
		fileInput.accept = 'image/*'
		fileInput.multiple = true

		fileInput.onchange = async (event: Event) => {
			const target = event.target as HTMLInputElement
			const files = target.files
			if (files && files.length > 0) {
				await this.uploadPhotos(files)
			}
		}
		fileInput.click()
	}

	/**
	 * Uploads the selected photos (after resizing) to Firebase Storage.
	 */
	private async uploadPhotos(files: FileList) {
		this.uploading = true
		this.uploadProgress = 0

		try {
			// Resize images before uploading
			const resizedFiles = await this.resizeAllFiles(files)
			await this.uploadResizedFiles(resizedFiles)
			$notify.success('Photos uploaded successfully.')
		} catch (error) {
			console.error('Error uploading photos:', error)
			$notify.error('Error uploading photos.')
		} finally {
			this.uploading = false
			this.uploadProgress = 0
			this.requestUpdate()
		}
	}

	/**
	 * Resizes all selected files.
	 */
	private async resizeAllFiles(files: FileList): Promise<File[]> {
		const resizePromises = Array.from(files).map(
			file => resizeImage(file, 750, undefined, 'file', 0.8) as Promise<File>,
		)
		return Promise.all(resizePromises)
	}

	/**
	 * Uploads the resized files to Firebase Storage and updates this.uploadProgress.
	 */
	private async uploadResizedFiles(resizedFiles: File[]): Promise<void> {
		const totalBytes = resizedFiles.reduce((sum, file) => sum + file.size, 0)
		let bytesTransferredSoFar = 0
		const downloadURLs: string[] = []

		const uploadPromises = resizedFiles.map(file => {
			let previousBytesTransferred = 0
			return new Promise<void>((resolve, reject) => {
				const storagePath = `items/${this.item.id}/${file.name}`
				const storageRef = ref(storage, storagePath)
				const uploadTask = uploadBytesResumable(storageRef, file)

				uploadTask.on(
					'state_changed',
					snapshot => {
						const delta = snapshot.bytesTransferred - previousBytesTransferred
						previousBytesTransferred = snapshot.bytesTransferred
						bytesTransferredSoFar += delta
						this.uploadProgress = (bytesTransferredSoFar / totalBytes) * 100
						this.requestUpdate()
					},
					error => {
						console.error('Upload failed:', error)
						$notify.error('Error uploading photo.')
						reject(error)
					},
					async () => {
						const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
						downloadURLs.push(downloadURL)
						resolve()
					},
				)
			})
		})

		await Promise.all(uploadPromises)
		this.updateImagesInItem(downloadURLs)
	}

	/**
	 * Updates the item's image array with newly uploaded images.
	 */
	private updateImagesInItem(downloadURLs: string[]) {
		if (!Array.isArray(this.item.images)) {
			this.item.images = []
		}
		this.item.images.push(...downloadURLs)
		this.requestUpdate()
	}

	/**
	 * Moves the given image to the front of the image list and updates the database.
	 */
	private async moveImageToFront(imgUrl: string) {
		const index = this.item.images?.indexOf(imgUrl)
		if (index === undefined || index === -1) return

		this.item.images?.splice(index, 1)
		this.item.images?.unshift(imgUrl)
		this.requestUpdate()

		try {
			await firstValueFrom(ItemsDB.upsert(this.item, this.item.id))
			$items.next(new Map($items.value.set(this.item.id, this.item)))
			$notify.success('Image moved to the front successfully.')
		} catch (error) {
			console.error('Error updating image order:', error)
		}
	}

	/**
	 * Deletes the specified image from the item and from Firebase Storage.
	 */
	private async deleteImage(imgUrl: string) {
		const index = this.item.images?.indexOf(imgUrl)
		if (index === undefined || index === -1) return

		this.item.images?.splice(index, 1)
		this.requestUpdate()

		try {
			await firstValueFrom(ItemsDB.upsert(this.item, this.item.id))
			console.log('Image deleted from item:', imgUrl)
			const imgRef = ref(storage, `items/${this.item.id}/${this.extractFileName(imgUrl)}`)
			await deleteObject(imgRef)
			$items.next(new Map($items.value.set(this.item.id, this.item)))
			$notify.success('Image deleted successfully.')
		} catch (error) {
			console.error('Error deleting image:', error)
			$notify.error('Error deleting image.')
		}
	}

	/**
	 * Deletes the entire item and its images.
	 */
	private async deleteItem(): Promise<void> {
		const confirmDelete = window.confirm(
			`Are you sure you want to delete "${this.item.brand ?? ''} - ${
				this.item.size ?? ''
			}"? This action cannot be undone.`,
		)

		if (!confirmDelete) return
		this.busy = true

		try {
			await this.deleteItemImagesAndFolder()
			await this.deleteItemRecord()
			$notify.success('Item deleted successfully.')
			sheet.dismiss(this.tagName)
		} catch (error) {
			console.error('Error deleting item:', error)
			$notify.error('Error deleting item, please try again.')
		} finally {
			this.busy = false
		}
	}

	/**
	 * Deletes all images in the item's folder in Firebase Storage.
	 */
	private async deleteItemImagesAndFolder() {
		if (!this.item.images || this.item.images.length === 0) return

		const folderRef = ref(storage, `items/${this.item.id}`)
		const { items: fileRefs } = await listAll(folderRef)
		const deletePromises = fileRefs.map(fileRef => deleteObject(fileRef))
		await Promise.all(deletePromises)
	}

	/**
	 * Deletes the item record from the database and updates the global state.
	 */
	private async deleteItemRecord() {
		await firstValueFrom(ItemsDB.delete(this.item.id))
		const updatedMap = new Map($items.value)
		updatedMap.delete(this.item.id)
		$items.next(updatedMap)
	}

	private extractFileName(url: string): string {
		// Split the URL at '?' to remove query parameters
		const [pathWithoutQuery] = url.split('?')

		// Decode the path to handle any encoded characters
		const decodedPath = decodeURIComponent(pathWithoutQuery)

		// Find the position of the last '/'
		const lastSlashIndex = decodedPath.lastIndexOf('/')

		if (lastSlashIndex === -1) {
			// If no slash is found, return the entire decoded path
			return decodedPath
		}

		// Extract everything after the last '/'
		return decodedPath.slice(lastSlashIndex + 1)
	}

	protected render(): unknown {
		return html`
			${when(this.busy, () => html`<schmancy-busy class="fixed inset-0"></schmancy-busy>`)}
			<schmancy-form @submit=${this.handleFormSubmit}>
				<schmancy-grid class="min-h-[50vh] px-6 py-8 min-w-[50vw]" gap="md">
					<!-- Brand -->
					<schmancy-input
						label="Item Brand"
						.value=${this.item.brand ?? ''}
						type="text"
						placeholder="Item Brand"
						@change=${(e: SchmancyInputChangeEvent) => (this.item.brand = e.detail.value)}
					></schmancy-input>

					<!-- Size -->
					<schmancy-input
						label="Item Size"
						.value=${this.item.size ?? ''}
						required
						type="text"
						placeholder="Item size"
						@change=${(e: SchmancyInputChangeEvent) => (this.item.size = e.detail.value)}
					></schmancy-input>

					<!-- Price -->
					<schmancy-input
						label="Price (EGP)"
						.value=${this.item.price ? this.item.price.toFixed(3) : ''}
						type="number"
						step="0.01"
						min="0"
						required
						@change=${(e: SchmancyInputChangeEvent) => {
							const value = parseFloat(e.detail.value)
							this.item.price = isNaN(value) ? 0 : value
						}}
					></schmancy-input>

					<!-- Description -->
					<schmancy-input
						label="Description"
						.value=${this.item.description ?? ''}
						type="text"
						placeholder="Description"
						@change=${(e: SchmancyInputChangeEvent) => (this.item.description = e.detail.value)}
					></schmancy-input>

					<!-- Folder -->
					<folder-select
						.value=${this.item.folder ?? ''}
						label="Select Folder"
						@change=${(e: CustomEvent<{ value: string }>) => (this.item.folder = e.detail.value)}
					></folder-select>

					<schmancy-divider></schmancy-divider>

					<!-- Photo Upload -->
					<schmancy-button
						type="button"
						@click=${this.handleFileSelection}
						variant="outlined"
						.disabled=${this.uploading}
					>
						${this.item.images?.length ? 'Add More Photos' : 'Upload Photo(s)'}
					</schmancy-button>

					<!-- Upload Progress -->
					${when(
						this.uploading,
						() => html`
							<div class="flex items-center space-x-2">
								<schmancy-spinner class="size-4"></schmancy-spinner>
								<span>${this.uploadProgress.toFixed(0)}%</span>
							</div>
						`,
					)}

					<!-- Display Images -->
					${when(
						this.item.images?.length,
						() => html`
							<div class="flex flex-wrap gap-2">
								${this.item.images.map(
									imgUrl => html`
										<schmancy-surface type="surface" elevation="2">
											<schmancy-grid class="relative w-fit">
												<img src="${imgUrl}" alt="Item Photo" class="max-w-52 h-auto" />
												<schmancy-grid class="p-2" gap="md" flow="col">
													<schmancy-icon-button variant="filled" @click=${() => this.moveImageToFront(imgUrl)}>
														star
													</schmancy-icon-button>
													<schmancy-icon-button variant="filled" @click=${() => this.deleteImage(imgUrl)}>
														delete
													</schmancy-icon-button>
												</schmancy-grid>
											</schmancy-grid>
										</schmancy-surface>
									`,
								)}
							</div>
						`,
					)}

					<schmancy-divider></schmancy-divider>

					<!-- Archive Checkbox -->
					<schmancy-checkbox
						.value=${this.item.archived ?? false}
						@change=${(e: schmancyCheckBoxChangeEvent) => (this.item.archived = e.detail.value)}
					>
						Archive Item
					</schmancy-checkbox>

					<!-- Actions -->
					<schmancy-grid flow="col" gap="md">
						<schmancy-icon-button
							@click=${(e: Event) => {
								e.preventDefault()
								e.stopPropagation()
								this.deleteItem()
							}}
							>delete</schmancy-icon-button
						>

						<schmancy-button variant="filled" type="submit" .disabled=${this.busy || this.uploading}>
							Save Item
						</schmancy-button>
					</schmancy-grid>
				</schmancy-grid>
			</schmancy-form>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'item-form': ItemForm
	}
}
