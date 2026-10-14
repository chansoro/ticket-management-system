import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { supabase } from '../../lib/supabase'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { PriorityBadge } from '../../components/ui/PriorityBadge'
import { Button } from '../../components/ui/Button'
import type { TicketPriority, TicketStatus } from '../../types'

interface RawProfile {
  id: string
  full_name: string
  email: string
  role: 'user' | 'developer' | 'admin'
  department_id: string | null
}

interface RawDepartment {
  id: string
  name: string
}

interface RawTicket {
  id: string
  ticket_number: string
  subject: string
  priority: TicketPriority
  status: TicketStatus
  requestor_id: string
  assigned_to: string | null
  resolution_comment: string | null
  created_at: string
  resolved_at: string | null
}

type ReportScope = 'overall' | 'this_month' | 'year'

export function AdminReports() {
  const [profiles, setProfiles] = useState<RawProfile[]>([])
  const [departments, setDepartments] = useState<RawDepartment[]>([])
  const [tickets, setTickets] = useState<RawTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequestor, setSelectedRequestor] = useState<string>('all')

  const now = new Date()
  const [scope, setScope] = useState<ReportScope>('overall')
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true)
      const [profRes, deptRes, tickRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, role, department_id').order('full_name'),
        supabase.from('departments').select('id, name').order('name'),
        supabase
          .from('tickets')
          .select('id, ticket_number, subject, priority, status, requestor_id, assigned_to, resolution_comment, created_at, resolved_at')
          .order('created_at', { ascending: false }),
      ])
      if (profRes.data) setProfiles(profRes.data as RawProfile[])
      if (deptRes.data) setDepartments(deptRes.data as RawDepartment[])
      if (tickRes.data) setTickets(tickRes.data as RawTicket[])
      setLoading(false)
    }
    void fetchReportData()
  }, [])

  const availableYears = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear(), 2026, 2025])
    tickets.forEach((t) => {
      years.add(new Date(t.created_at).getFullYear())
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [tickets])

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const d = new Date(t.created_at)
      if (scope === 'this_month') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      }
      if (scope === 'year') {
        return d.getFullYear() === selectedYear
      }
      return true
    })
  }, [tickets, scope, selectedYear])

  const scopeLabel = useMemo(() => {
    if (scope === 'this_month') {
      return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) + ' Summary'
    }
    if (scope === 'year') {
      return `Year ${selectedYear} Summary`
    }
    return 'Overall All-Time Summary'
  }, [scope, selectedYear])

  const developers = profiles.filter((p) => p.role === 'developer')
  const requestors = profiles.filter((p) => p.role === 'user')
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]))
  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name]))

  const devRows = developers.map((dev) => {
    const assignedTickets = filteredTickets.filter((t) => t.assigned_to === dev.id)
    const resolved = assignedTickets.filter((t) => t.status === 'resolved').length
    const pending = assignedTickets.filter((t) => t.status !== 'resolved').length
    const total = assignedTickets.length
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0
    return {
      ...dev,
      deptName: dev.department_id ? deptMap[dev.department_id] || 'Unassigned' : 'Unassigned',
      resolved,
      pending,
      total,
      rate,
    }
  })

  const filteredRequestors =
    selectedRequestor === 'all' ? requestors : requestors.filter((r) => r.id === selectedRequestor)

  const handleDownloadCSV = () => {
    const csvEscape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`

    const lines: string[] = []
    lines.push(['RESOLVR TICKET MANAGEMENT SYSTEM - OFFICIAL REPORT', scopeLabel].map(csvEscape).join(','))
    lines.push(['Generated On', new Date().toLocaleString()].map(csvEscape).join(','))
    lines.push('')
    lines.push('SECTION 1: DEVELOPER RESOLUTION SUMMARY')
    lines.push(
      [
        'Developer Name',
        'Email Address',
        'Department',
        'Report Period',
        'Resolved Tickets',
        'Pending Tickets',
        'Total Assigned',
        'Resolution Rate (%)',
      ]
        .map(csvEscape)
        .join(',')
    )

    devRows.forEach((d) => {
      lines.push(
        [
          d.full_name,
          d.email,
          d.deptName,
          scopeLabel,
          d.resolved,
          d.pending,
          d.total,
          `${d.rate}%`,
        ]
          .map(csvEscape)
          .join(',')
      )
    })

    lines.push('')
    lines.push('SECTION 2: TICKET BREAKDOWN BY REQUESTOR')
    lines.push(
      [
        'Ticket ID',
        'Subject',
        'Requestor Name',
        'Requestor Email',
        'Priority',
        'Status',
        'Assigned Developer',
        'Resolution Comment',
        'Created Date',
        'Resolved Date',
      ]
        .map(csvEscape)
        .join(',')
    )

    filteredTickets.forEach((t) => {
      const req = profiles.find((p) => p.id === t.requestor_id)
      lines.push(
        [
          `#${t.ticket_number}`,
          t.subject,
          req?.full_name || 'Unknown',
          req?.email || '',
          t.priority.toUpperCase(),
          t.status.replace('_', ' ').toUpperCase(),
          t.assigned_to ? profileMap[t.assigned_to] || 'Assigned' : 'Unassigned',
          t.resolution_comment || 'Pending Resolution',
          new Date(t.created_at).toLocaleDateString(),
          t.resolved_at ? new Date(t.resolved_at).toLocaleDateString() : '-',
        ]
          .map(csvEscape)
          .join(',')
      )
    })

    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const slug = scopeLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    link.download = `Resolvr_Report_${slug}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    window.print()
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="no-print flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">General Reports</h1>
            <p className="text-sm text-slate-500">
              Developer resolution metrics and requestor ticket history ({scopeLabel}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
              <span className="text-xs font-bold text-indigo-600">Period:</span>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as ReportScope)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="overall">Overall Summary</option>
                <option value="this_month">This Month Only</option>
                <option value="year">Specific Year</option>
              </select>
              {scope === 'year' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-indigo-600 focus:outline-none"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <Button className="inline-flex items-center gap-2" onClick={handleDownloadCSV} variant="secondary">
              <span>⬇ Export .CSV</span>
            </Button>

            <Button className="inline-flex items-center gap-2" onClick={handleExportPDF}>
              <span>⎙ Export .PDF (Developer Summary)</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading report metrics...</p>
        ) : (
          <>
            <div className="print-only-summary rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">
                    Resolvr — Ticket Management System
                  </p>
                  <h2 className="text-lg font-bold text-slate-900">
                    Developer Resolution Summary ({scopeLabel})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Official developer workload, resolved count, and pending assignments.
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="font-semibold text-slate-800">Generated: {new Date().toLocaleDateString()}</p>
                  <p>{filteredTickets.length} total tickets in period</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Developer Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4 text-center">No. Resolved</th>
                      <th className="py-3 px-4 text-center">No. Pending</th>
                      <th className="py-3 px-4 text-center">Total Assigned</th>
                      <th className="py-3 px-4 text-right">Resolution Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {devRows.map((dev) => (
                      <tr key={dev.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{dev.full_name}</p>
                          <p className="text-xs text-slate-500">{dev.email}</p>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-700">{dev.deptName}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex min-w-8 justify-center rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700">
                            {dev.resolved}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex min-w-8 justify-center rounded-full bg-amber-50 px-2.5 py-0.5 font-bold text-amber-700">
                            {dev.pending}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">{dev.total}</td>
                        <td className="py-3 px-4 text-right font-semibold text-indigo-600">{dev.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="no-print rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Per Requestor Ticket History</h2>
                  <p className="text-xs text-slate-500">
                    Detailed ticket submissions and developer resolution notes filtered by {scopeLabel.toLowerCase()}.
                  </p>
                </div>
                <select
                  value={selectedRequestor}
                  onChange={(e) => setSelectedRequestor(e.target.value)}
                  className="w-full sm:w-72 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none"
                >
                  <option value="all">All Requestors ({requestors.length})</option>
                  {requestors.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.full_name} ({r.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                {filteredRequestors.map((req) => {
                  const userTickets = filteredTickets.filter((t) => t.requestor_id === req.id)
                  if (selectedRequestor === 'all' && userTickets.length === 0) return null
                  const resolvedCount = userTickets.filter((t) => t.status === 'resolved').length
                  const pendingCount = userTickets.filter((t) => t.status !== 'resolved').length

                  return (
                    <div key={req.id} className="rounded-xl border border-slate-200/80 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                        <div>
                          <h3 className="font-bold text-slate-900">{req.full_name}</h3>
                          <p className="text-xs text-slate-500">{req.email}</p>
                        </div>
                        <div className="flex gap-2 text-xs font-semibold">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                            Total: {userTickets.length}
                          </span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                            Resolved: {resolvedCount}
                          </span>
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                            Pending: {pendingCount}
                          </span>
                        </div>
                      </div>

                      {userTickets.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No tickets submitted in this timeframe.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 uppercase text-slate-400">
                                <th className="py-2 pr-3">Ticket #</th>
                                <th className="py-2 px-3">Subject</th>
                                <th className="py-2 px-3">Priority</th>
                                <th className="py-2 px-3">Status</th>
                                <th className="py-2 px-3">Assigned Developer</th>
                                <th className="py-2 px-3">Resolution / Comment</th>
                                <th className="py-2 pl-3">Created</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {userTickets.map((t) => (
                                <tr key={t.id}>
                                  <td className="py-2.5 pr-3 font-mono font-bold text-indigo-600 whitespace-nowrap">
                                    <Link className="hover:underline" to={`/admin/tickets/${t.id}`}>
                                      #{t.ticket_number}
                                    </Link>
                                  </td>
                                  <td className="py-2.5 px-3 font-medium text-slate-900">{t.subject}</td>
                                  <td className="py-2.5 px-3">
                                    <PriorityBadge priority={t.priority} />
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <StatusBadge status={t.status} />
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600">
                                    {t.assigned_to ? profileMap[t.assigned_to] || 'Assigned' : 'Unassigned'}
                                  </td>
                                  <td className="py-2.5 px-3 max-w-xs text-slate-600">
                                    {t.resolution_comment || <span className="text-slate-300">—</span>}
                                  </td>
                                  <td className="py-2.5 pl-3 text-slate-500 whitespace-nowrap">
                                    {new Date(t.created_at).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
