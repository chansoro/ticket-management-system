import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { useTickets } from '../../context/TicketContext'
import { SearchInput } from '../../components/ui/Input'
import { PriorityBadge } from '../../components/ui/PriorityBadge'
import { StatusBadge } from '../../components/ui/StatusBadge'

export function AdminTickets() {
  const { tickets, categories, departments } = useTickets()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filtered = tickets.filter((t) => {
    const cat = categories.find((c) => c.id === t.categoryId)
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.requestorName.toLowerCase().includes(search.toLowerCase()) ||
      (t.assignedToName || '').toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    const matchesDept = deptFilter === 'all' || cat?.departmentId === deptFilter
    const matchesCategory = categoryFilter === 'all' || t.categoryId === categoryFilter

    return matchesSearch && matchesStatus && matchesDept && matchesCategory
  })

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Support Tickets</h1>
            <p className="text-sm text-slate-500">
              Tickets are automatically routed to their matching department based on the requestor&apos;s category.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-2xs">
              Showing {filtered.length} of {tickets.length} tickets
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticket #TKT, subject, requestor, or assignee..."
            className="flex-1 min-w-[240px]"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex lg:items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full lg:w-40 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-xs focus:border-indigo-600 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open (Unassigned)</option>
              <option value="in_progress">Assigned / Active</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value)
                setCategoryFilter('all')
              }}
              className="w-full lg:w-52 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-xs focus:border-indigo-600 focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full lg:w-56 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-xs focus:border-indigo-600 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories
                .filter((c) => deptFilter === 'all' || c.departmentId === deptFilter)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Ticket ID</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Requestor</th>
                  <th className="py-3.5 px-4">Routed Department & Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Developer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => {
                  const cat = categories.find((c) => c.id === t.categoryId)
                  const dept = departments.find((d) => d.id === cat?.departmentId)
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/90 transition">
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-600 whitespace-nowrap">
                        <Link className="hover:underline" to={`/admin/tickets/${t.id}`}>
                          #{t.ticketNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <Link
                          className="font-semibold text-slate-900 hover:text-indigo-600 line-clamp-1"
                          to={`/admin/tickets/${t.id}`}
                        >
                          {t.subject}
                        </Link>
                        {t.resolutionComment && (
                          <p className="mt-0.5 truncate text-xs text-emerald-700">
                            ✓ {t.resolutionComment}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {t.requestorName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                          {dept?.name || 'Unmapped'}
                        </span>
                        <p className="mt-0.5 text-xs text-slate-500">{t.categoryName}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {t.assignedToName ? (
                          <span className="text-xs font-semibold text-slate-800">{t.assignedToName}</span>
                        ) : (
                          <Link
                            className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-500/20 hover:bg-amber-100"
                            to={`/admin/tickets/${t.id}`}
                          >
                            Assign Developer →
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No tickets match your current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
