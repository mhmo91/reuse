import { BehaviorSubject } from 'rxjs'

import { User as FirebaseUser } from 'firebase/auth'
import { TUser } from '../db/users.collection'
const $user = new BehaviorSubject<
	| (TUser &
			FirebaseUser & {
				accessToken?: string
			})
	| null
>(null)

export { $user }
