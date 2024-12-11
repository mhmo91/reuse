import { FirestoreService } from './firestore.service'
export interface IError {
	type: string
	payload: any
}

export const ErrorsDB = new FirestoreService<IError>('errors')
