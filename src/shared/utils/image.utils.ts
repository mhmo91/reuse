/**
 * Resize an image file to fit within optional maximum dimensions and control compression quality.
 * @param imageFile - The input image file (e.g., from an <input type="file">).
 * @param maxWidth - (Optional) The maximum allowed width.
 * @param maxHeight - (Optional) The maximum allowed height.
 * @param outputType - The desired output format ('blob', 'dataurl', or 'file').
 * @param quality - A number between 0 and 1 indicating the image quality if the requested type is image/jpeg or image/webp.
 *                  A lower number means higher compression (smaller file size) but lower image quality.
 * @returns A Promise that resolves to either a Blob, DataURL, or File representing the resized (or non-resized) image.
 */
export function resizeImage(
	imageFile: File,
	maxWidth?: number,
	maxHeight?: number,
	outputType: 'blob' | 'dataurl' | 'file' = 'file',
	quality: number = 0.9,
): Promise<Blob | string | File> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = readerEvent => {
			const img = new Image()
			img.onload = () => {
				let { width, height } = img

				// Resize logic depending on provided constraints
				if (maxWidth && maxHeight) {
					// Both dimensions provided: Ensure we fit within both, maintaining aspect ratio
					if (width > maxWidth) {
						height = Math.floor((height * maxWidth) / width)
						width = maxWidth
					}
					if (height > maxHeight) {
						width = Math.floor((width * maxHeight) / height)
						height = maxHeight
					}
				} else if (maxWidth && !maxHeight) {
					// Only maxWidth provided: scale down width if necessary
					if (width > maxWidth) {
						height = Math.floor((height * maxWidth) / width)
						width = maxWidth
					}
				} else if (!maxWidth && maxHeight) {
					// Only maxHeight provided: scale down height if necessary
					if (height > maxHeight) {
						width = Math.floor((width * maxHeight) / height)
						height = maxHeight
					}
				}
				// If neither maxWidth nor maxHeight is provided, no resizing occurs.

				// Create a canvas to draw the resized (or original) image
				const canvas = document.createElement('canvas')
				canvas.width = width
				canvas.height = height
				const ctx = canvas.getContext('2d')
				if (!ctx) {
					return reject(new Error('Unable to get 2D context'))
				}

				// Draw the image onto the canvas at the new dimensions
				ctx.drawImage(img, 0, 0, width, height)

				// Function to handle Blob conversion
				const handleBlob = (blob: Blob) => {
					if (outputType === 'blob') {
						resolve(blob)
					} else if (outputType === 'dataurl') {
						const reader = new FileReader()
						reader.onloadend = () => {
							if (reader.result) {
								resolve(reader.result as string)
							} else {
								reject(new Error('Failed to convert Blob to DataURL'))
							}
						}
						reader.onerror = () => {
							reject(new Error('FileReader error during Blob to DataURL conversion'))
						}
						reader.readAsDataURL(blob)
					} else if (outputType === 'file') {
						try {
							const file = new File([blob], imageFile.name, {
								type: blob.type,
								lastModified: imageFile.lastModified,
							})
							resolve(file)
						} catch (error) {
							// Fallback for browsers that do not support the File constructor
							const fileObj: Partial<File> = {
								name: imageFile.name,
								lastModified: imageFile.lastModified,
								size: blob.size,
								type: blob.type,
								// Add other properties or methods if needed
							}
							resolve(fileObj as File)
						}
					}
				}

				// Convert canvas to desired format with specified quality
				canvas.toBlob(
					blob => {
						if (!blob) {
							return reject(new Error('Canvas conversion to Blob failed.'))
						}
						handleBlob(blob)
					},
					'image/jpeg',
					quality,
				)
			}

			// Set the image source to the FileReader result
			if (readerEvent.target?.result) {
				img.src = readerEvent.target.result as string
			} else {
				reject(new Error('FileReader failed to load image'))
			}
		}

		reader.onerror = () => {
			reject(reader.error || new Error('FileReader error'))
		}

		// Start reading the image file
		reader.readAsDataURL(imageFile)
	})
}
