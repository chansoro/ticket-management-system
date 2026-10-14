import { useState } from "react"
import { Link } from "react-router-dom"
import { AppShell } from "@/layouts/Sidebar"
import { PageHeader } from "@/layouts/PageHeader"
import { Button } from "@/components/ui/Button"
import { Select } from "@/components/ui/Input"
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { useDepartments, useProfiles, useTickets } from "@/hooks/useData"

export function AdminReports() {
  const { tickets, loading: tLoad, error: tErr } = useTickets()
  const { profiles, loading: pLoad, error: pErr } = useProfiles()
  const { departments } = useDepartments()
  const [selectedRequestor, setSelectedRequestor] = useState("all")

  if (tLoad || pLoad) return <AppShell role="admin"><PageLoading /></AppShell>
  if (tErr || pErr) return <AppShell role="admin"><PageError message={tErr || pErr} /></AppShell>

  const developers = profiles.filter((p) => p.role === "developer")
  const requestors = profiles.filter((p) => p.role === "user")

  const devRows = developers.map((dev) => {
    const assigned = tickets.filter((t) => t.assigned_to === dev.id)
    const resolved = assigned.filter((t) => t.statusDb === "resolved").length
    const pending = assigned.filter((t) => t.statusDb !== "resolved").length
    const deptName = departments.find((d) => d.id === dev.department_id)?.name ?? "Unassigned"
    return {
      ...dev,
      deptName,
      resolved,
      pending,
      total: assigned.length,
    }
  })

  const reqRows = requestors
    .map((req) => {
      const userTickets = tickets.filter((t) => t.requestor_id === req.id)
      const resolved = userTickets.filter((t) => t.statusDb === "resolved").length
      const pending = userTickets.filter((t) => t.statusDb !== "resolved").length
      return {
        ...req,
        tickets: userTickets,
        resolved,
        pending,
        total: userTickets.length,
      }
    })
    .filter((r) => selectedRequestor === "all" || r.id === selectedRequestor)

  return (
    <AppShell role="admin">
      <div className="max-w-7xl px-8 py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader
            title="General Reports"
            subtitle="Developer resolution performance and per-requestor ticket breakdown."
          />
          <Button variant="secondary" onClick={() => window.print()}>
            Print / Export PDF
          </Button>
        </div>

        {/* SECTION 1: Developer Report (No. Resolved & No. Pending) */}
        <div className="rounded-2xl border border-[#e5e5ea] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1d1d1f] mb-1">Developer Resolution Summary</h2>
          <p className="text-xs text-[#6e6e73] mb-4">
            Tracks the number of resolved tickets and pending (open/assigned) tickets per developer.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm">
              <thead>
                <tr className="border-b border-[#e5e5ea] text-left text-xs uppercase text-[#aeaeb2]">
                  <th className="py-3 px-4">Developer Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">No. Resolved</th>
                  <th className="py-3 px-4 text-center">No. Pending</th>
                  <th className="py-3 px-4 text-center">Total Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f2]">
                {devRows.map((dev) => (
                  <tr key={dev.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-[#1d1d1f]">{dev.full_name}</p>
                      <p className="text-xs text-[#6e6e73]">{dev.email}</p>
                    </td>
                    <td className="py-3 px-4 text-[#6e6e73]">{dev.deptName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex min-w-8 justify-center rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                        {dev.resolved}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex min-w-8 justify-center rounded-full bg-amber-50 px-2.5 py-0.5 font-semibold text-amber-700">
                        {dev.pending}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-[#1d1d1f]">{dev.total}</td>
                  </tr>
                ))}
                {!devRows.length && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#6e6e73]">No developers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: Per Requestor Tickets Report */}
        <div className="rounded-2xl border border-[#e5e5ea] bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1f]">Per Requestor Tickets</h2>
              <p className="text-xs text-[#6e6e73]">
                Complete ticket history, status, and resolution comments grouped by requestor.
              </p>
            </div>
            <Select
              className="w-64"
              value={selectedRequestor}
              onChange={(e) => setSelectedRequestor(e.target.value)}
            >
              <option value="all">All Requestors ({requestors.length})</option>
              {requestors.map((req) => (
                <option key={req.id} value={req.id}>
                  {req.full_name} ({tickets.filter((t) => t.requestor_id === req.id).length} tickets)
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-4">
            {reqRows.map((req) => (
              <div key={req.id} className="rounded-2xl border border-[#e5e5ea] bg-[#F5F5F7]/60 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e5ea] pb-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-[#1d1d1f]">{req.full_name}</h3>
                    <p className="text-xs text-[#6e6e73]">{req.email}</p>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="rounded-full bg-white border px-3 py-1 font-medium text-[#1d1d1f]">
                      Total: {req.total}
                    </span>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 font-medium text-emerald-700">
                      Resolved: {req.resolved}
                    </span>
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 font-medium text-amber-700">
                      Pending: {req.pending}
                    </span>
                  </div>
                </div>

                {req.tickets.length === 0 ? (
                  <p className="text-xs text-[#6e6e73] italic">No tickets submitted by this requestor.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#e5e5ea] text-[#6e6e73] uppercase">
                          <th className="py-2 pr-3">Ticket #</th>
                          <th className="py-2 pr-3">Subject</th>
                          <th className="py-2 pr-3">Priority</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2 pr-3">Assigned Developer</th>
                          <th className="py-2 pr-3">Resolution / Comment</th>
                          <th className="py-2">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e5ea]/60">
                        {req.tickets.map((t) => (
                          <tr key={t.id}>
                            <td className="py-2.5 pr-3 font-mono font-medium">
                              <Link to={`/admin/tickets/\${t.id}`} className="text-[#0071e3] hover:underline">
                                #{t.ticket_number}
                              </Link>
                            </td>
                            <td className="py-2.5 pr-3 font-medium text-[#1d1d1f]">{t.subject}</td>
                            <td className="py-2.5 pr-3"><PriorityBadge priority={t.priority} /></td>
                            <td className="py-2.5 pr-3"><StatusBadge status={t.status} /></td>
                            <td className="py-2.5 pr-3 text-[#6e6e73]">{t.assignedTo ?? "Unassigned"}</td>
                            <td className="py-2.5 pr-3 max-w-xs truncate text-[#1d1d1f]" title={t.resolution_comment ?? ""}>
                              {t.resolution_comment || "—"}
                            </td>
                            <td className="py-2.5 text-[#6e6e73]">{t.created}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}