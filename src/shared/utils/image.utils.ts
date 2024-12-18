/**
 * Resize an image file to fit within optional maximum dimensions and control compression quality.
 * @param imageFile - The input image file (e.g., from an <input type="file">).
 * @param maxWidth - (Optional) The maximum allowed width.
 * @param maxHeight - (Optional) The maximum allowed height.
 * @param outputType - The desired output format ('blob', 'dataurl', or 'file').
 * @param quality - A number between 0 and 1 indicating the image compression quality for 'image/jpeg'.
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
			if (!readerEvent.target?.result) {
				return reject(new Error('FileReader failed to load image'))
			}

			const img = new Image()
			// Some older iOS Safari versions need this for cross-origin images:
			// img.crossOrigin = 'anonymous';
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
					return reject(new Error('Unable to get 2D context'))
				}

				ctx.drawImage(img, 0, 0, width, height)

				canvas.toBlob(
					blob => {
						if (!blob) {
							return reject(new Error('Canvas conversion to Blob failed.'))
						}

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
									// Attempt to create a File object
									const file = new File([blob], imageFile.name, {
										type: blob.type,
										lastModified: imageFile.lastModified,
									})
									resolve(file)
								} catch (error) {
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

			img.onerror = () => reject(new Error('Image failed to load'))
			img.src = readerEvent.target.result as string
		}

		reader.onerror = () => {
			reject(reader.error || new Error('FileReader error'))
		}

		reader.readAsDataURL(imageFile)
	})
}
