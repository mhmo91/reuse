import { FirestoreService } from './firestore.service'

// import User form firebase
export type TUser = {
	email: string
	password: string
	displayName: string
	admin: boolean
	uid: string
	role?: string
}

// create class User
export class User {
	email: string
	password: string
	displayName: string
	admin: boolean
	uid: string
	role?: string

	constructor(user?: TUser) {
		this.email = user?.email ?? ''
		this.password = user?.password ?? ''
		this.displayName = user?.displayName ?? ''
		this.admin = user?.admin ?? false
		this.uid = user?.uid ?? ''
		this.role = user?.role ?? ''
	}
}
export const UsersDB = new FirestoreService<TUser>('errors')
