// folders.collection.ts
import moment from 'moment'
import { v4 as uuidv4 } from 'uuid'
import { FirestoreService } from './firestore.service'

export interface IFolder {
	id: string
	name: string
	description?: string
	parentId: string | null
	createdAt?: number | Date
	updatedAt?: number | Date
	sharedWith?: string[]
}

export class Folder implements IFolder {
	id: string
	name: string = ''
	description?: string
	parentId: string | null
	createdAt?: number | Date
	updatedAt?: number | Date
	sharedWith?: string[]
	constructor() {
		this.id = uuidv4()
		this.createdAt = moment().toDate()
		this.updatedAt = moment().toDate()
		this.description = ''
		this.name = ''
		this.parentId = null
		this.sharedWith = []
	}
}

export const FoldersDB = new FirestoreService<IFolder>('folders')

// folder-tree.ts
export interface TreeNode<T> {
	data: T
	children: TreeNode<T>[]
}

export class FoldersTree {
	// Create the folder tree from the map
	static createFolderTree(folderMap: Map<string, IFolder>): TreeNode<IFolder>[] {
		folderMap = new Map([...folderMap].sort((a, b) => a[1].name.localeCompare(b[1].name)))
		const rootNodes: TreeNode<IFolder>[] = []

		// Helper function to recursively build tree nodes
		const buildTree = (folder: IFolder): TreeNode<IFolder> => {
			const node: TreeNode<IFolder> = { data: folder, children: [] }
			for (const [, childFolder] of folderMap) {
				if (childFolder.parentId === folder.id) {
					node.children.push(buildTree(childFolder))
				}
			}
			return node
		}

		// Find root nodes (those without a parent) and build their trees
		for (const [, folder] of folderMap) {
			if (!folder.parentId) {
				rootNodes.push(buildTree(folder))
			}
		}

		return rootNodes
	}

	// An iterable generator to traverse the tree depth-first
	static *iterateTree(tree: TreeNode<IFolder>[]): Iterable<IFolder> {
		for (const node of tree) {
			yield node.data
			yield* FoldersTree.iterateTree(node.children)
		}
	}

	static getSubTreeByFolderId(tree: TreeNode<IFolder>[], folderId: string | null): TreeNode<IFolder> | null {
		// If folderId is null, return the entire root tree
		if (folderId === null) {
			return tree.length > 0 ? tree[0] : null // Return the first root node as the subtree
		}

		// Helper function to recursively find the subtree
		const findSubTree = (node: TreeNode<IFolder>, targetId: string): TreeNode<IFolder> | null => {
			// If the current node matches the target folder ID, return the node (subtree)
			if (node.data.id === targetId) {
				return node
			}

			// Recursively search in the children for the target folder ID
			for (const child of node.children) {
				const result = findSubTree(child, targetId)
				if (result) {
					return result // If we find the target in one of the children, return the subtree
				}
			}

			// If not found, return null
			return null
		}

		// Iterate through all root nodes to find the subtree
		for (const node of tree) {
			const result = findSubTree(node, folderId)
			if (result) {
				return result // Return the subtree once found
			}
		}

		// If the folder ID is not found, return null
		return null
	}

	// Function to get the depth of a specific folder by ID
	static getFolderPath(tree: TreeNode<IFolder>[], folderId: string | null): Array<string | null> {
		// If folderId is null, return [0] representing the root
		if (folderId === null) {
			return [null]
		}

		// Helper function to recursively find the folder path
		const findPath = (node: TreeNode<IFolder>, targetId: string, path: string[]): string[] | null => {
			// Add the current folder's ID to the path
			path.push(node.data.id)

			// If the current node matches the target folder ID, return the path
			if (node.data.id === targetId) {
				return path
			}

			// Recursively search in the children for the target folder ID
			for (const child of node.children) {
				const result = findPath(child, targetId, [...path]) // Pass a copy of the path
				if (result) {
					return result // If we find the target in one of the children, return the path
				}
			}

			// If not found, return null
			return null
		}

		// Iterate through all root nodes to find the path
		for (const node of tree) {
			const result = findPath(node, folderId, [])
			if (result) {
				return [null, ...result] // Return the path once found
			}
		}

		// If the folder ID is not found, return an empty array
		return [null]
	}
}
