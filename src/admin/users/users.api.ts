import { TUser } from '@db/users/user.interface'
import { $user } from 'src/context'
export default async function upsertUser(body: TUser): Promise<any> {
	const token = await $user.value?.accessToken
	console.log('token', token)
	const response = await fetch(
		`${import.meta.env.VITE_NETLIFY_API_BASE_URL}/api/create-user`, // Replace with your actual Netlify function endpoint
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${$user.value?.accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		},
	)

	if (!response.ok) {
		throw new Error('Failed to create user')
	}

	return response.json()
}
