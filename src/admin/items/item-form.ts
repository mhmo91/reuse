import { Item, ItemsDB } from '@db/items.collection'
import { $LitElement } from '@mhmo91/lit-mixins/src'
import { $notify, schmancyCheckBoxChangeEvent, SchmancyInputChangeEvent, sheet } from '@mhmo91/schmancy'
import { html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { firstValueFrom, switchMap } from 'rxjs'

// Import Firebase Storage functions
import { storage } from '@db/firebase'
import { deleteObject, getDownloadURL, listAll, ref, uploadBytesResumable } from 'firebase/storage'
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

	async saveItem(item: Item): Promise<void> {
		this.busy = true
		try {
			const itemData = { ...item }
			await firstValueFrom(ItemsDB.upsert(itemData, item.id))
			$items.next(new Map<string, Item>([...$items.value.entries(), [itemData.id, itemData]]))
			sheet.dismiss(this.tagName)
			$notify.success('Item saved successfully.')
		} catch (error) {
			console.error('Error saving item:', error)
			$notify.error('Error saving item, please try again.')
		} finally {
			this.busy = false
		}
	}

	async uploadPhoto() {
		const fileInput = document.createElement('input')
		fileInput.type = 'file'
		fileInput.accept = 'image/*' // Accept image files
		fileInput.multiple = true // Allow multiple files

		fileInput.onchange = async (event: Event) => {
			const target = event.target as HTMLInputElement
			const files = target.files
			// resize files before uploading

			if (files && files.length > 0) {
				this.uploading = true
				this.uploadProgress = 0
				// Resize all files and collect the resized files
				const resizedFilesPromises: Promise<File>[] = Array.from(files).map(
					file => resizeImage(file, 750, undefined, 'file', 0.8) as Promise<File>, // Type assertion if necessary
				)

				const resizedFiles: File[] = await Promise.all(resizedFilesPromises)

				const totalBytes = Array.from(resizedFiles).reduce((sum, file) => sum + file.size, 0)
				let bytesTransferredSoFar = 0
				const downloadURLs: string[] = []

				const uploadPromises = Array.from(resizedFiles).map(file => {
					let previousBytesTransferredForFile = 0 // Track progress per file
					return new Promise<void>((resolve, reject) => {
						const storagePath = `items/${this.item.id}/${file.name}`
						const storageRef = ref(storage, storagePath)
						const uploadTask = uploadBytesResumable(storageRef, file)

						uploadTask.on(
							'state_changed',
							snapshot => {
								// Calculate how many new bytes were transferred since last state change
								const delta = snapshot.bytesTransferred - previousBytesTransferredForFile
								previousBytesTransferredForFile = snapshot.bytesTransferred
								bytesTransferredSoFar += delta

								this.uploadProgress = (bytesTransferredSoFar / totalBytes) * 100
								this.requestUpdate()
							},
							error => {
								console.error('Upload failed:', error)
								$notify.error('Error uploading photo.')
								this.uploading = false
								this.uploadProgress = 0
								reject(error)
							},
							async () => {
								// Once this file is fully uploaded, get the download URL
								const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
								downloadURLs.push(downloadURL)
								resolve()
							},
						)
					})
				})

				try {
					await Promise.all(uploadPromises)
					// Append the new URLs to the item.images array
					if (!Array.isArray(this.item.images)) {
						this.item.images = []
					}
					this.item.images.push(...downloadURLs)

					this.uploading = false
					this.uploadProgress = 0
					$notify.success('Photos uploaded successfully.')
					this.requestUpdate()
				} catch (error) {
					console.error('Error uploading photos:', error)
					$notify.error('Error uploading photos.')
					this.uploading = false
					this.uploadProgress = 0
				}
			}
		}

		fileInput.click() // Trigger file input dialog
	}

	protected render(): unknown {
		return html`
			${when(this.busy, () => html`<schmancy-busy class="fixed inset-0"></schmancy-busy>`)}
			<schmancy-form
				@submit=${(e: Event) => {
					e.preventDefault()
					this.saveItem(this.item)
				}}
			>
				<schmancy-grid class="min-h-[50vh] px-6 py-8 min-w-[50vw]" gap="md">
					<!-- Item brand -->
					<schmancy-input
						label="Item Brand"
						.value=${this.item.brand ?? ''}
						type="text"
						placeholder="Item Brand"
						@change=${(e: SchmancyInputChangeEvent) => {
							this.item.brand = e.detail.value
						}}
					></schmancy-input>
					<!-- Item Size -->
					<schmancy-input
						label="Item Size"
						.value=${this.item.size ?? ''}
						required
						type="text"
						placeholder="Item size"
						@change=${(e: SchmancyInputChangeEvent) => {
							this.item.size = e.detail.value
						}}
					></schmancy-input>

					<schmancy-input
						label="Price (EGP)"
						.value=${!!this.item.price ? this.item.price.toFixed(3) : ''}
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
						@change=${(e: SchmancyInputChangeEvent) => {
							this.item.description = e.detail.value
						}}
					></schmancy-input>

					<!-- Folder Selection -->
					<folder-select
						.value=${this.item.folder ?? ''}
						label="Select Folder"
						@change=${(e: CustomEvent<{ value: string }>) => {
							this.item.folder = e.detail.value
						}}
					></folder-select>

					<schmancy-divider></schmancy-divider>

					<!-- Photo Upload -->
					<schmancy-button type="button" @click=${this.uploadPhoto} variant="outlined" .disabled=${this.uploading}>
						${this.item.images?.length ? 'Add More Photos' : 'Upload Photo(s)'}
					</schmancy-button>

					<!-- Show Upload Progress -->
					${this.uploading
						? html`<div class="flex items-center space-x-2">
								<schmancy-spinner class="size-4"></schmancy-spinner>
								<span>${this.uploadProgress.toFixed(0)}%</span>
						  </div>`
						: null}

					<!-- Display the Photos if Available -->
					${this.item.images?.length
						? html`
								<div class="flex flex-wrap gap-2">
									${this.item.images.map(
										imgUrl => html`
											<schmancy-surface type="surface" elevation="2">
												<schmancy-grid class="relative w-fit">
													<img src="${imgUrl}" alt="Item Photo" class="max-w-52 h-auto" />
													<schmancy-grid class="p-2" gap="md" flow="col">
														<schmancy-icon-button
															variant="filled"
															@click=${() => {
																// reorder the images array and update the item
																const index = this.item.images?.indexOf(imgUrl)
																if (index !== undefined && index !== -1) {
																	this.item.images?.splice(index, 1)
																	this.item.images?.unshift(imgUrl)
																	this.requestUpdate()
																}
																// update db
																ItemsDB.upsert(this.item, this.item.id)
																	.pipe(
																		switchMap(() => {
																			// update the item
																			return ItemsDB.upsert(this.item, this.item.id)
																		}),
																	)
																	.subscribe({
																		next: () => {
																			$notify.success('Image moved to the front successfully.')
																			$items.next(new Map($items.value.set(this.item.id, this.item)))
																		},
																	})
															}}
														>
															star
														</schmancy-icon-button>
														<schmancy-icon-button
															@click=${() => {
																// delete the image from the DB and firebase storage and update the item
																const index = this.item.images?.indexOf(imgUrl)
																if (index !== undefined && index !== -1) {
																	this.item.images?.splice(index, 1)
																	this.requestUpdate()
																}
																// update db
																ItemsDB.upsert(this.item, this.item.id)
																	.pipe(
																		switchMap(() => {
																			// delete the image from the storage
																			const storageRef = ref(storage, `items/${this.item.id}/${imgUrl}`)
																			return deleteObject(storageRef)
																		}),
																	)
																	.subscribe({
																		next: () => {
																			$notify.success('Image deleted successfully.')
																			$items.next(new Map($items.value.set(this.item.id, this.item)))
																		},
																	})
															}}
															variant="filled"
														>
															delete
														</schmancy-icon-button>
													</schmancy-grid>
												</schmancy-grid>
											</schmancy-surface>
										`,
									)}
								</div>
						  `
						: null}

					<schmancy-divider></schmancy-divider>

					<!-- Checkbox archive -->
					<schmancy-checkbox
						.value=${this.item.archived ?? false}
						@change=${(e: schmancyCheckBoxChangeEvent) => {
							this.item.archived = e.detail.value
						}}
					>
						Archive Item
					</schmancy-checkbox>

					<!-- Submit Button -->
					<schmancy-grid flow="col" gap="md">
						<schmancy-icon-button
							@click=${(e: Event) => {
								e.preventDefault()
								e.stopPropagation()
								this.deleteItem()
							}}
							>delete
						</schmancy-icon-button>

						<schmancy-button variant="filled" type="submit" .disabled=${this.busy || this.uploading}>
							Save Item
						</schmancy-button>
					</schmancy-grid>
				</schmancy-grid>
			</schmancy-form>
		`
	}

	// Delete item method
	async deleteItem(): Promise<void> {
		const confirmDelete = window.confirm(
			`Are you sure you want to delete "${this.item.brand ?? ''} - ${
				this.item.size ?? ''
			}"? This action cannot be undone.`,
		)
		if (!confirmDelete) return

		this.busy = true
		try {
			// Delete images from storage using the stored paths
			if (this.item.images && this.item.images.length > 0) {
				// Delete the entire folder of the item
				const folderRef = ref(storage, `items/${this.item.id}`)
				try {
					const { items: fileRefs } = await listAll(folderRef)
					const deletePromises = fileRefs.map(fileRef => deleteObject(fileRef))
					await Promise.all(deletePromises)

					// After deleting all files, proceed to delete the item from the database
					await firstValueFrom(ItemsDB.delete(this.item.id))

					// Update $items
					const updatedMap = new Map($items.value)
					updatedMap.delete(this.item.id)
					$items.next(updatedMap)

					$notify.success('Item and its folder deleted successfully.')
					sheet.dismiss(this.tagName)
				} catch (error) {
					console.error('Error deleting item folder:', error)
					$notify.error('Error deleting item folder, please try again.')
				}
			}

			// Delete item from database
			await firstValueFrom(ItemsDB.delete(this.item.id))

			// Update $items
			const updatedMap = new Map($items.value)
			updatedMap.delete(this.item.id)
			$items.next(updatedMap)

			$notify.success('Item deleted successfully.')
			sheet.dismiss(this.tagName)
		} catch (error) {
			console.error('Error deleting item:', error)
			$notify.error('Error deleting item, please try again.')
		} finally {
			this.busy = false
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'item-form': ItemForm
	}
}
