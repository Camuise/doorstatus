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

export function parseCurrentStatus(value: string | null) {
	if (!value) return null
	try {
		const parsed = JSON.parse(value) as CurrentStatus
		return typeof parsed.text === 'string' && typeof parsed.updatedAt === 'number' ? parsed : null
	} catch {
		return null
	}
}

export function parseHistoryEntry(value: string) {
	try {
		const parsed = JSON.parse(value) as HistoryEntry
		return typeof parsed.text === 'string' && typeof parsed.timestamp === 'number' ? parsed : null
	} catch {
		return null
	}
}