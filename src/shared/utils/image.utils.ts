/**
 * Resize an image file to fit within optional maximum dimensions and control compression quality.
 * In case of any error, returns the original file unmodified.
 *
 * @param imageFile - The input image file (e.g., from an <input type="file">).
 * @param maxWidth - (Optional) The maximum allowed width.
 * @param maxHeight - (Optional) The maximum allowed height.
 * @param outputType - The desired output format ('blob', 'dataurl', or 'file').
 * @param quality - A number between 0 and 1 indicating the image compression quality for 'image/jpeg'.
 * @returns A Promise that resolves to either a Blob, DataURL, or File representing the resized (or non-resized) image.
 *          On any error, returns the original file as-is.
 */
export function resizeImage(
	imageFile: File,
	maxWidth?: number,
	maxHeight?: number,
	outputType: 'blob' | 'dataurl' | 'file' = 'file',
	quality: number = 0.9,
): Promise<Blob | string | File> {
	return new Promise(resolve => {
		const failSafe = (errorMessage: string) => {
			// Log the error if needed
			console.error(errorMessage)
			// Return the original file as a fallback
			resolve(imageFile)
		}

		const reader = new FileReader()

		reader.onload = readerEvent => {
			if (!readerEvent.target?.result) {
				return failSafe('FileReader failed to load image')
			}

			const img = new Image()
			img.onload = () => {
				let { width, height } = img

				// Apply resizing if max dimensions are provided
				if (maxWidth && maxHeight) {
					if (width > maxWidth) {
						height = Math.floor((height * maxWidth) / width)
						width = maxWidth
					}
					if (height > maxHeight) {
						width = Math.floor((width * maxHeight) / height)
						height = maxHeight
					}
				} else if (maxWidth && !maxHeight) {
					if (width > maxWidth) {
						height = Math.floor((height * maxWidth) / width)
						width = maxWidth
					}
				} else if (!maxWidth && maxHeight) {
					if (height > maxHeight) {
						width = Math.floor((width * maxHeight) / height)
						height = maxHeight
					}
				}
				// If neither maxWidth nor maxHeight are provided, no resizing occurs.

				const canvas = document.createElement('canvas')
				canvas.width = width
				canvas.height = height
				const ctx = canvas.getContext('2d')
				if (!ctx) {
					return failSafe('Unable to get 2D context')
				}

				ctx.drawImage(img, 0, 0, width, height)

				canvas.toBlob(
					blob => {
						if (!blob) {
							return failSafe('Canvas conversion to Blob failed.')
						}

						const handleBlob = (blob: Blob) => {
							if (outputType === 'blob') {
								resolve(blob)
							} else if (outputType === 'dataurl') {
								const blobReader = new FileReader()
								blobReader.onloadend = () => {
									if (blobReader.result) {
										resolve(blobReader.result as string)
									} else {
										failSafe('Failed to convert Blob to DataURL')
									}
								}
								blobReader.onerror = () => {
									failSafe('FileReader error during Blob to DataURL conversion')
								}
								blobReader.readAsDataURL(blob)
							} else if (outputType === 'file') {
								try {
									// Attempt to create a File object
									const file = new File([blob], imageFile.name, {
										type: blob.type,
										lastModified: imageFile.lastModified,
									})
									resolve(file)
								} catch {
									// Fallback if File constructor is not supported
									resolve(blob)
								}
							}
						}

						handleBlob(blob)
					},
					'image/jpeg',
					quality,
				)
			}

			img.onerror = () => failSafe('Image failed to load')
			img.src = readerEvent.target.result as string
		}

		reader.onerror = () => {
			failSafe('FileReader error')
		}

		reader.readAsDataURL(imageFile)
	})
}
