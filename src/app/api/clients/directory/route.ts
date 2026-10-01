import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { supabaseRest, supabaseRestAll } from '@/lib/supabase'

/**
 * GET /api/clients/directory
 *
 * Returns all clients with lead counts for the Clients page.
 */
export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  // Fetch all clients
  const clientsRes = await supabaseRest(
    '/rest/v1/clients?select=client_slug,name,is_active,domain,crm_type,survey_version&order=name.asc'
  )
  if (!clientsRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 502 })
  }
  const clients = await clientsRes.json()

  // Fetch lead counts grouped by client_slug.
  // PostgREST doesn't support GROUP BY, so fetch every client_slug and count in JS.
  // MUST paginate: a plain select stops at PostgREST's 1000-row default, which
  // silently counted ~4% of the table (the oldest rows) and reported 0 for
  // everyone else.
  const leads = await supabaseRestAll<{ client_slug: string }>(
    '/rest/v1/leads?select=client_slug'
  )

  const countMap: Record<string, number> = {}
  for (const lead of leads) {
    if (!lead.client_slug) continue
    countMap[lead.client_slug] = (countMap[lead.client_slug] ?? 0) + 1
  }

  // Merge over the UNION of both key sets. Mapping over `clients` alone drops
  // every funnel that is sending leads but has no row in `clients` — 59 of the
  // 75 funnels that received leads in the week of 2026-09-24, carrying 55% of
  // all leads. Those now surface as rows with a null name, which doubles as the
  // backlog of funnels still to be registered.
  const registered = new Set<string>(
    clients.map((c: Record<string, unknown>) => c.client_slug as string).filter(Boolean)
  )

  const result = [
    ...clients.map((c: Record<string, unknown>) => ({
      client_slug: c.client_slug,
      name: c.name,
      is_active: c.is_active ?? true,
      domain: c.domain ?? null,
      crm_type: c.crm_type ?? null,
      survey_version: c.survey_version ?? null,
      lead_count: countMap[c.client_slug as string] ?? 0,
      unregistered: false,
    })),
    ...Object.keys(countMap)
      .filter((slug) => !registered.has(slug))
      .sort()
      .map((slug) => ({
        client_slug: slug,
        name: null,
        is_active: true,
        domain: null,
        crm_type: null,
        survey_version: null,
        lead_count: countMap[slug],
        unregistered: true,
      })),
  ]

  return NextResponse.json(result)
}
