'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-wrapper'
import { AnimatedCounter } from '@/components/ui/animated-counter'

interface ClientRow {
  client_slug: string
  /** null for a funnel that is sending leads but has no row in `clients` yet */
  name: string | null
  is_active: boolean
  domain: string | null
  crm_type: string | null
  survey_version: string | null
  lead_count: number
  unregistered?: boolean
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/clients/directory')
        if (!res.ok) throw new Error('Failed to fetch')
        const data: ClientRow[] = await res.json()
        data.sort((a, b) => b.lead_count - a.lead_count)
        setClients(data)
      } catch (err) {
        console.error('[ClientsPage] load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const maxLeadCount = useMemo(
    () => Math.max(1, ...clients.map((c) => c.lead_count)),
    [clients]
  )

  return (
    <StaggerContainer className="space-y-6">
      <StaggerItem>
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0d0d0d] via-[#111] to-[#0d0d0d] px-6 py-5">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#9b51e0]/[0.05] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />
          <div className="relative flex items-baseline gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            {!loading && (
              <span className="text-2xl font-bold text-primary tabular-nums">
                <AnimatedCounter value={clients.length} className="" />
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1 relative">
            {loading ? 'Loading...' : `${clients.length} active clients`}
          </p>
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="glass-card section-glow rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-muted-foreground bg-gradient-to-r from-white/[0.03] to-transparent">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Leads</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">CRM</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Survey</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Status</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Site</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse w-32" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse w-8" /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-white/5 rounded animate-pulse w-20" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 bg-white/5 rounded animate-pulse w-12" /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-white/5 rounded animate-pulse w-14" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 bg-white/5 rounded animate-pulse w-28" /></td>
                    </tr>
                  ))
                : clients.map((c) => (
                    <tr
                      key={c.client_slug}
                      className="border-b border-white/5 row-glow transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        {c.name ?? c.client_slug}
                        {c.unregistered && (
                          <span
                            className="ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide bg-amber-500/15 text-amber-400 align-middle"
                            title="Receiving leads but not registered in the clients table"
                          >
                            unregistered
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums shrink-0 w-8">{c.lead_count}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-[100px]">
                            <div
                              className="h-full rounded-full progress-bar-animated"
                              style={{ width: `${(c.lead_count / maxLeadCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {c.crm_type ?? '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                        {c.survey_version ?? '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.is_active
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {c.domain ? (
                          <a
                            href={c.domain}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="truncate max-w-[180px]">
                              {c.domain.replace('https://', '')}
                            </span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </StaggerItem>
    </StaggerContainer>
  )
}
