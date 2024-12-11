import { FirestoreService } from './firestore.service'
import { v4 as uuidv4 } from 'uuid'

export class Item {
	price: number
	description?: string
	brand: string
	images: Array<string>
	folder: string | null = null
	archived: boolean = false
	size: string

	id: string
	constructor(product?: Item) {
		this.id = uuidv4()
		this.price = product?.price ?? 0
		this.description = product?.description ?? ''
		this.brand = product?.brand ?? ''
		this.images = []
		this.folder = product?.folder ?? null
		this.archived = product?.archived ?? false
		this.size = product?.size ?? ''
	}
}

export const ItemsDB = new FirestoreService<Item>('products')
