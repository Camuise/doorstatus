import { Redis } from '@upstash/redis'
import { env } from '../env'

export type CurrentStatus = {
	text: string
	updatedAt: number
}

export type HistoryEntry = {
	text: string
	timestamp: number
}

let client: Redis | undefined

export function getRedis() {
	if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null
	return (client ??= new Redis({
		url: env.UPSTASH_REDIS_REST_URL,
		token: env.UPSTASH_REDIS_REST_TOKEN,
	}))
}

export function parseCurrentStatus(value: unknown) {
	if (!value) return null
	try {
		const parsed = typeof value === 'string' ? JSON.parse(value) : value
		if (typeof parsed !== 'object' || parsed === null) return null
		const status = parsed as Partial<CurrentStatus>
		return typeof status.text === 'string' && typeof status.updatedAt === 'number' ? status as CurrentStatus : null
	} catch {
		return null
	}
}

export function parseHistoryEntry(value: unknown) {
	try {
		const parsed = typeof value === 'string' ? JSON.parse(value) : value
		if (typeof parsed !== 'object' || parsed === null) return null
		const entry = parsed as Partial<HistoryEntry>
		return typeof entry.text === 'string' && typeof entry.timestamp === 'number' ? entry as HistoryEntry : null
	} catch {
		return null
	}
}