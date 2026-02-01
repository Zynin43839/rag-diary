/* eslint-disable */
// @ts-nocheck

import { treaty } from '@elysiajs/eden'
import type { App } from '../../../server/src/index'

export const api = treaty<App>('http://localhost:3001') as any