// context.ts

import { IFolder } from '@db/folders.collection'
import { BehaviorSubject } from 'rxjs'

export const $folders = new BehaviorSubject<Map<string, IFolder>>(new Map())
