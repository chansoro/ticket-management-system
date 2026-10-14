import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Mail, Users, FolderKanban, Ticket } from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { useTickets } from '../../context/TicketContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import type { DepartmentStatus } from '../../types'

export function AdminDevelopers() {
  const { departments, categories, developers, tickets, addDepartment, updateDepartmentStatus } = useTickets()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<DepartmentStatus>('active')
  const [error, setError] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await addDepartment({ name, email, status })
      setName('')
      setEmail('')
      setStatus('active')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add department.')
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Departments, Routing & Developers
          </h1>
          <p className="text-sm text-slate-500">
            Each department owns specific ticket categories. When a requestor submits a ticket in a category, it automatically enters that department&apos;s active queue.
          </p>
        </div>

        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs md:grid-cols-4"
        >
          <Input
            placeholder="New department name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            placeholder="dept@resolvr.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as DepartmentStatus)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700"
          >
            <option value="active">Active</option>
            <option value="at_capacity">At Capacity</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button type="submit">Add Department</Button>
          {error && <p className="text-xs text-rose-600 md:col-span-4">{error}</p>}
        </form>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {departments.map((dept) => {
            const deptCategories = categories.filter((c) => c.departmentId === dept.id)
            const deptCatIds = deptCategories.map((c) => c.id)
            const deptDevs = developers.filter((d) => d.departmentId === dept.id)
            const deptOpenTickets = tickets.filter(
              (t) => deptCatIds.includes(t.categoryId) && t.status !== 'resolved'
            )
            const unassignedCount = deptOpenTickets.filter((t) => !t.assignedTo).length

            return (
              <div
                key={dept.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900">{dept.name}</h2>
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{dept.email}</span>
                        </p>
                      </div>
                    </div>

                    <select
                      value={dept.status}
                      onChange={(e) => void updateDepartmentStatus(dept.id, e.target.value as DepartmentStatus)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      <option value="active">Active</option>
                      <option value="at_capacity">At Capacity</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <FolderKanban className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Linked Ticket Categories ({deptCategories.length})</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {deptCategories.map((c) => (
                        <span
                          key={c.id}
                          className="rounded-lg border border-indigo-100 bg-indigo-50/70 px-2.5 py-1 text-xs font-semibold text-indigo-700"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <Users className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Assigned Specialists ({deptDevs.length})</span>
                    </p>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/60">
                      {deptDevs.map((dev) => {
                        const activeLoad = tickets.filter(
                          (t) => t.assignedTo === dev.id && t.status !== 'resolved'
                        ).length
                        const solvedLoad = tickets.filter(
                          (t) => t.assignedTo === dev.id && t.status === 'resolved'
                        ).length
                        return (
                          <div key={dev.id} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                            <div>
                              <p className="font-semibold text-slate-800">{dev.fullName}</p>
                              <p className="text-slate-500">{dev.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-2.5 py-0.5 font-semibold ${
                                  activeLoad === 0
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {activeLoad === 0 ? 'Available (0 active)' : `${activeLoad} active`}
                              </span>
                              <span className="text-slate-400">{solvedLoad} resolved</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <Ticket className="h-4 w-4 text-indigo-600" />
                    <span>{deptOpenTickets.length} active department tickets</span>
                    {unassignedCount > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                        {unassignedCount} unassigned
                      </span>
                    )}
                  </div>
                  <Link className="font-semibold text-indigo-600 hover:text-indigo-500" to="/admin/tickets">
                    View Queue →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
