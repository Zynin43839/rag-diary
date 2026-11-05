import { treaty } from '@elysiajs/eden'
import type { App } from '..'

export const api = treaty<App>('http://localhost:3001')