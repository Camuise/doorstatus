import type { APIRoute } from 'astro'
import { env } from '../../env'
import { getRedis, parseCurrentStatus, parseHistoryEntry } from '../../lib/redis'

const CURRENT_KEY = 'status:current'
const HISTORY_KEY = 'status:history'
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	})

export const GET: APIRoute = async ({ url }) => {
	const redis = getRedis()
	if (!redis) return json({ error: 'Redis is not configured' }, 503)

	try {
		const current = parseCurrentStatus(await redis.get<unknown>(CURRENT_KEY))
		const response: Record<string, unknown> = {
			status: current?.text ?? null,
			updatedAt: current?.updatedAt ?? null,
		}

		if (url.searchParams.get('history') === 'true') {
			const entries = await redis.zrange<unknown[]>(HISTORY_KEY, 0, -1, { rev: true })
			response.history = entries.map(parseHistoryEntry).filter((entry) => entry !== null)
		}

		return json(response)
	} catch {
		return json({ error: 'Unable to read status' }, 503)
	}
}

export const POST: APIRoute = async ({ request }) => {
	const authorization = request.headers.get('Authorization')
	if (!env.STATUS_API_SECRET || authorization !== `Bearer ${env.STATUS_API_SECRET}`) {
		return json({ error: 'Unauthorized' }, 401)
	}

	let body: unknown
	try {
		body = await request.json()
	} catch {
		return json({ error: 'Request body must be valid JSON' }, 400)
	}

	const text = typeof body === 'object' && body !== null && 'status' in body && typeof body.status === 'string'
		? body.status.trim()
		: ''
	if (!text) return json({ error: 'status must be a non-empty string' }, 400)

	const redis = getRedis()
	if (!redis) return json({ error: 'Redis is not configured' }, 503)

	const now = Date.now()
	try {
		await redis.set(CURRENT_KEY, JSON.stringify({ text, updatedAt: now }))
		await redis.zadd(HISTORY_KEY, {
			score: now,
			member: JSON.stringify({ text, timestamp: now }),
		})
		await redis.zremrangebyscore(HISTORY_KEY, 0, now - RETENTION_MS)
		return json({ ok: true, status: text, updatedAt: now })
	} catch {
		return json({ error: 'Unable to update status' }, 503)
	}
}