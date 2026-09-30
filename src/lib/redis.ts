import { Redis } from '@upstash/redis'
import { env } from '../env'

export type CurrentStatus = {
	text: string
	availability: Availability
	updatedAt: number
	color?: string
}

export type HistoryEntry = {
	text: string
	availability: Availability
	timestamp: number
	color?: string
}

export const availabilityValues = ['free', 'away', 'busy', 'dnd', 'custom'] as const
export type Availability = (typeof availabilityValues)[number]

export function isAvailability(value: unknown): value is Availability {
	return typeof value === 'string' && availabilityValues.includes(value as Availability)
}

export function isHexColor(value: unknown): value is string {
	return typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value)
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
		if (typeof status.text !== 'string' || typeof status.updatedAt !== 'number') return null
		return {
			text: status.text,
			availability: isAvailability(status.availability) ? status.availability : 'custom',
			updatedAt: status.updatedAt,
			...(isHexColor(status.color) ? { color: status.color } : {}),
		}
	} catch {
		return null
	}
}

export function parseHistoryEntry(value: unknown) {
	try {
		const parsed = typeof value === 'string' ? JSON.parse(value) : value
		if (typeof parsed !== 'object' || parsed === null) return null
		const entry = parsed as Partial<HistoryEntry>
		if (typeof entry.text !== 'string' || typeof entry.timestamp !== 'number') return null
		return {
			text: entry.text,
			availability: isAvailability(entry.availability) ? entry.availability : 'custom',
			timestamp: entry.timestamp,
			...(isHexColor(entry.color) ? { color: entry.color } : {}),
		}
	} catch {
		return null
	}
}