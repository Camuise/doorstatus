import type { APIRoute } from 'astro'
import { env } from '../../../env'
import { getRedis, parseHistoryEntry, type HistoryEntry } from '../../../lib/redis'

const HISTORY_KEY = 'status:history'

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	})

const isSameStatus = (left: HistoryEntry, right: HistoryEntry) =>
	left.text === right.text &&
	left.availability === right.availability &&
	(left.color ?? null) === (right.color ?? null)

export const POST: APIRoute = async ({ request }) => {
	const authorization = request.headers.get('Authorization')
	if (!env.STATUS_API_SECRET || authorization !== `Bearer ${env.STATUS_API_SECRET}`) {
		return json({ error: 'Unauthorized' }, 401)
	}

	const redis = getRedis()
	if (!redis) return json({ error: 'Redis is not configured' }, 503)

	try {
		const members = await redis.zrange<unknown[]>(HISTORY_KEY, 0, -1)
		const membersToRemove: string[] = []
		let previous: HistoryEntry | null = null

		for (const member of members) {
			const entry = parseHistoryEntry(member)
			if (!entry) {
				previous = null
				continue
			}

			if (previous && isSameStatus(previous, entry)) {
				membersToRemove.push(typeof member === 'string' ? member : JSON.stringify(member))
			} else {
				previous = entry
			}
		}

		if (membersToRemove.length) {
			await redis.zrem(HISTORY_KEY, ...membersToRemove)
		}

		return json({
			ok: true,
			removed: membersToRemove.length,
			remaining: members.length - membersToRemove.length,
		})
	} catch {
		return json({ error: 'Unable to clean status history' }, 503)
	}
}
