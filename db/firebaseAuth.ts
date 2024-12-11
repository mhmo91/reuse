import {
	deleteUser,
	GoogleAuthProvider,
	linkWithPopup,
	signInAnonymously,
	signInWithCredential,
	signInWithPopup,
	User,
} from 'firebase/auth'
import { catchError, from, map, of, throwError, type Observable } from 'rxjs'
import { auth } from './firebase'

const provider = new GoogleAuthProvider()
provider.addScope('email')
provider.addScope('profile')

export const firebaseDeleteUser = (): Observable<void> => {
	if (!auth.currentUser) {
		return of(undefined)
	} else {
		return from(deleteUser(auth.currentUser))
	}
}

// create a function that will be called when the user logs in anonymously
export const firebaseSignAnonymously = (): Observable<User> => {
	return from(signInAnonymously(auth)).pipe(
		map(userCredential => {
			const user = userCredential.user
			return user
		}),
	)
}

export const firebaseContinueWithGoogle = (language = 'en-us') => {
	if (!auth.currentUser) {
		return throwError(() => new Error('No user is logged in'))
	} else {
		auth.languageCode = language // set language
		return from(linkWithPopup(auth.currentUser, provider)).pipe(
			catchError((error, _) => {
				const credential = GoogleAuthProvider.credentialFromError(error)
				if (error.code === 'auth/credential-already-in-use' && credential) {
					return from(signInWithCredential(auth, credential))
				}
				throw error
			}),
			map(userCredential => {
				if (!userCredential) {
					throwError(() => new Error('No user is logged in'))
				}
				const user = userCredential.user
				const createdAt = new Date(user.metadata.creationTime!).getTime()
				const lastlogin = new Date(user.metadata.lastSignInTime!).getTime()
				const isNewUser = lastlogin - createdAt < 30 * 1000

				const imageUrl = user.photoURL || user.providerData.map(provider => provider.photoURL).filter(url => !!url)[0]
				const displayName =
					user.displayName || user.providerData.map(provider => provider.displayName).filter(name => !!name)[0]

				return {
					uid: user.uid,
					displayName: displayName,
					email: user.email,
					emailVerified: user.emailVerified,
					isAnonymous: user.isAnonymous,
					phoneNumber: user.phoneNumber,
					photoURL: imageUrl,
					providerData: user.providerData,
					isNewUser: isNewUser,
				}
			}),
		)
	}
}

export const firebaseLinkWithGoogle = (language = 'en-us'): Observable<User | undefined> => {
	if (!auth.currentUser) {
		return throwError(() => new Error('No user is logged in'))
	} else {
		auth.languageCode = language // set language
		return from(linkWithPopup(auth.currentUser, provider)).pipe(
			map(userCredential => {
				if (!userCredential) {
					throwError(() => new Error('No user is logged in'))
				}
				const user = userCredential.user
				return user
			}),
		)
	}
}

export const firebaseSignWithGoogle = (language = 'en-us'): Observable<Partial<User> | undefined> => {
	if (!auth.currentUser) {
		return of(undefined)
	} else {
		auth.languageCode = language // set language
		return from(signInWithPopup(auth, provider)).pipe(
			map(userCredential => {
				const user = userCredential.user
				return {
					uid: user.uid,
					displayName: user.displayName,
					email: user.email,
					emailVerified: user.emailVerified,
					isAnonymous: user.isAnonymous,
					phoneNumber: user.phoneNumber,
					photoURL: user.photoURL,
					providerData: user.providerData,
				}
			}),
		)
	}
}

// export const firebaseSignEmail = (email: string, otp: string): Observable<UserCredential | undefined> =>
// 	verifyOTP(email, otp).pipe(
// 		mergeMap(response =>
// 			from(signInWithCustomToken(auth, response.custom_token)).pipe(
// 				map(userCredential => {
// 					const user = userCredential.user
// 					return {
// 						uid: user.uid,
// 						displayName: user.displayName,
// 						email: user.email,
// 						emailVerified: user.emailVerified,
// 						isAnonymous: user.isAnonymous,
// 						phoneNumber: user.phoneNumber,
// 						photoURL: user.photoURL,
// 						providerData: user.providerData,
// 					}
// 				}),
// 			),
// 		),
// 	)

// export const firebaseSignOut = (): Observable<void> => {
// 	return from(auth.signOut())
// }

// export const firebaseGetCurrentAuthUser = (): UserCredential | null => {
// 	if (!auth.currentUser) return null
// 	const base = {
// 		displayName: auth.currentUser.displayName,
// 		email: auth.currentUser.email,
// 		emailVerified: auth.currentUser.emailVerified,
// 		isAnonymous: auth.currentUser.isAnonymous,
// 		phoneNumber: auth.currentUser.phoneNumber,
// 		photoURL: auth.currentUser.photoURL,
// 		providerData: auth.currentUser.providerData,
// 	}

// 	return { ...base, uid: auth.currentUser.uid }
// }
// export const firebaseAuthState = (): Observable<UserCredential | null> => {
// 	const loggedInSubject = new ReplaySubject<User | null>(1)
// 	// loggedInSubject.next(auth.currentUser)
// 	auth.onAuthStateChanged(loggedInSubject)
// 	return loggedInSubject.pipe(
// 		//@ts-ignore
// 		map(user => user ?? { uid: null }),
// 		distinctUntilKeyChanged('uid'),
// 		map(user => {
// 			if (!user.uid) return null
// 			const imageUrl = user.photoURL || user.providerData.map(provider => provider.photoURL).filter(url => !!url)[0]
// 			const displayName =
// 				user.displayName || user.providerData.map(provider => provider.displayName).filter(name => !!name)[0]

// 			const base = {
// 				displayName: displayName,
// 				email: user.email,
// 				emailVerified: user.emailVerified,
// 				isAnonymous: user.isAnonymous,
// 				phoneNumber: user.phoneNumber,
// 				photoURL: imageUrl,
// 				providerData: user.providerData,
// 			}
// 			return { ...base, uid: user.uid }
// 		}),
// 	)
// }
