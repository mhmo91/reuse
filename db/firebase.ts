// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'
// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: 'AIzaSyApxw0hUni6gJ1Opt47LiyoR3RUHl23rNk',
	authDomain: 'reuse-27375.firebaseapp.com',
	projectId: 'reuse-27375',
	storageBucket: 'reuse-27375.firebasestorage.app',
	messagingSenderId: '463426319131',
	appId: '1:463426319131:web:9d4362dd1d2d11de2e19be',
	measurementId: 'G-T4GZ2HP4DL',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const analytics = getAnalytics(app)
export const firestore = getFirestore(app)
// storage
export const storage = getStorage(app)
export const auth = getAuth(app)

export { app }
