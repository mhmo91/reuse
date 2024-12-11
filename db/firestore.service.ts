import {
	collection,
	deleteDoc,
	doc,
	DocumentData,
	getDoc,
	getDocs,
	limit,
	onSnapshot,
	query,
	QueryConstraint,
	setDoc,
	where,
	WhereFilterOp,
} from 'firebase/firestore'
import { from, map, Observable, take } from 'rxjs'
import { v4 as uuidv4 } from 'uuid'
import { firestore } from './firebase'
import moment from 'moment'

export class FirestoreService<T extends DocumentData> {
	private collectionName: string

	constructor(collectionName: string) {
		this.collectionName = collectionName
	}

	public query(
		queryFilters: {
			key: string
			value: any
			operator: WhereFilterOp
		}[],
	): Observable<Map<string, T>> {
		const collectionRef = collection(firestore, this.collectionName)
		const queryConstraints: QueryConstraint[] = queryFilters.map(qf => where(qf.key, qf.operator, qf.value))
		const queryRef = query(collectionRef, ...queryConstraints)

		return from(getDocs(queryRef)).pipe(
			map(querySnapshot => {
				const resultMap = new Map<string, T>()
				querySnapshot.forEach(docSnap => {
					resultMap.set(docSnap.id, docSnap.data() as T)
				})
				return resultMap
			}),
		)
	}

	public upsert(data: T, uid = uuidv4()): Observable<T> {
		if (!data['createdAt'])
			// @ts-ignore
			data['createdAt'] = moment().toISOString()
		if (!data['updatedAt'])
			// @ts-ignore
			data['updatedAt'] = moment().toISOString()
		const docRef = doc(firestore, this.collectionName, uid)
		// return from(updateDoc(docRef, data))
		return from(setDoc(docRef, data, { merge: true })).pipe(map(() => data))
	}

	public set(uid: string, data: T): Observable<void> {
		const docRef = doc(firestore, this.collectionName, uid)
		return from(setDoc(docRef, data))
	}

	public get(uid: string): Observable<T | undefined> {
		const docRef = doc(firestore, this.collectionName, uid)
		return from(getDoc(docRef)).pipe(
			map(docSnap => (docSnap.exists() ? (docSnap.data() as T) : undefined)),
			take(1),
		)
	}

	public delete(uid: string): Observable<void> {
		const docRef = doc(firestore, this.collectionName, uid)
		return from(deleteDoc(docRef))
	}

	public subscribe(uid: string): Observable<T | undefined> {
		const docRef = doc(firestore, this.collectionName, uid)
		return new Observable<T | undefined>(subscriber => {
			const unsubscribe = onSnapshot(
				docRef,
				docSnap => {
					if (docSnap.exists()) {
						subscriber.next(docSnap.data() as T)
					} else {
						subscriber.next(undefined)
					}
				},
				subscriber.error.bind(subscriber),
			)

			return { unsubscribe }
		})
	}

	/**
	 * Check if there exists at least one document that matches the query filters.
	 * @param queryFilters An array of filter conditions for the query.
	 * @returns Observable<boolean> - True if at least one document matches, false otherwise.
	 */
	public exists(
		queryFilters: {
			key: string
			value: any
			operator: WhereFilterOp
		}[],
	): Observable<boolean> {
		const collectionRef = collection(firestore, this.collectionName)
		const queryConstraints: QueryConstraint[] = queryFilters.map(qf => where(qf.key, qf.operator, qf.value))
		const queryRef = query(collectionRef, ...queryConstraints, limit(1)) // Limit to 1 to check existence only

		return from(getDocs(queryRef)).pipe(
			map(querySnapshot => !querySnapshot.empty), // Returns true if at least one document exists
		)
	}

	public ref(uid: string): any {
		return doc(firestore, this.collectionName, uid)
	}
}
