import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AppShell } from "@/layouts/Sidebar"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { useTickets, useProfiles, useDepartments } from "@/hooks/useData"

type ReportScope = "overall" | "this_month" | "year"

export function AdminReports() {
  const { tickets, loading: tLoading, error: tError } = useTickets()
  const { profiles, loading: pLoading, error: pError } = useProfiles()
  const { departments } = useDepartments()
  const now = new Date()
  const [scope, setScope] = useState<ReportScope>("overall")
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const [selectedRequestor, setSelectedRequestor] = useState<string>("all")

  const availableYears = useMemo(() => {
    const years = new Set<number>([now.getFullYear(), 2026, 2025])
    tickets.forEach((t) => years.add(new Date(t.created_at).getFullYear()))
    return Array.from(years).sort((a, b) => b - a)
  }, [tickets, now])

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const d = new Date(t.created_at)
      if (scope === "this_month") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      if (scope === "year") return d.getFullYear() === selectedYear
      return true
    })
  }, [tickets, scope, selectedYear, now])

  const scopeLabel = useMemo(() => {
    if (scope === "this_month") return now.toLocaleDateString("en-US", { month: "long", year: "numeric" }) + " Summary"
    if (scope === "year") return "Year " + String(selectedYear) + " Summary"
    return "Overall All-Time Summary"
  }, [scope, selectedYear, now])

  if (tLoading || pLoading) return <AppShell role="admin"><PageLoading /></AppShell>
  if (tError || pError) return <AppShell role="admin"><PageError message={tError || pError} /></AppShell>

  const developers = profiles.filter((p) => p.role === "developer")
  const requestors = profiles.filter((p) => p.role === "user")
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]))

  const devRows = developers.map((dev) => {
    const assigned = filteredTickets.filter((t) => t.assigned_to === dev.id)
    const resolved = assigned.filter((t) => t.statusDb === "resolved").length
    const pending = assigned.filter((t) => t.statusDb !== "resolved").length
    const total = assigned.length
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0
    return { ...dev, deptName: dev.department_id ? deptMap[dev.department_id] ?? "Unassigned" : "Unassigned", resolved, pending, total, rate }
  })

  const filteredRequestors = selectedRequestor === "all" ? requestors : requestors.filter((r) => r.id === selectedRequestor)

  // CSV ONLY CONTAINS OPERATIONS RESOLUTION STATEMENT
  const handleDownloadCSV = () => {
    const q = (v: any) => "\"" + String(v ?? "").split("\"").join("\"\"") + "\""
    const rows: string[] = []
    rows.push([q("RESOLVR ITSM PLATFORM - OPERATIONS RESOLUTION STATEMENT"), q(scopeLabel)].join(","))
    rows.push([q("Generated On"), q(new Date().toLocaleString())].join(","))
    rows.push("")
    rows.push([q("Specialist Developer"), q("Email Address"), q("Department Queue"), q("Report Scope"), q("Resolved"), q("Pending"), q("Total Assigned"), q("Resolution Rate")].join(","))
    devRows.forEach((d) => {
      rows.push([q(d.full_name), q(d.email), q(d.deptName), q(scopeLabel), q(d.resolved), q(d.pending), q(d.total), q(String(d.rate) + "%")].join(","))
    })
    const blob = new Blob(["\uFEFF" + rows.join("\r\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const suffix = scope === "year" ? "Year_" + String(selectedYear) : scope === "this_month" ? "This_Month" : "Overall"
    a.download = "Resolvr_Operations_Resolution_Statement_" + suffix + ".csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <div className="no-print flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">General Reports</h1>
            <p className="mt-1 text-sm text-slate-500">Developer resolution metrics and per-requestor ticket breakdown ({scopeLabel}).</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold">
              <span className="text-indigo-600">Period:</span>
              <select value={scope} onChange={(e) => setScope(e.target.value as ReportScope)} className="bg-transparent font-semibold text-slate-800 focus:outline-none">
                <option value="overall">Overall Summary</option>
                <option value="this_month">This Month</option>
                <option value="year">Specific Year</option>
              </select>
              {scope === "year" && (
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-bold text-indigo-600">
                  {availableYears.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
                </select>
              )}
            </div>
            <Button size="sm" variant="secondary" onClick={handleDownloadCSV}>⬇ Export .CSV</Button>
            <Button size="sm" onClick={() => window.print()}>⎙ Export .PDF</Button>
          </div>
        </div>

        <div className="print-statement rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xs">
          <div>
            <div className="border-b-2 border-slate-900 pb-5 mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-black tracking-widest uppercase text-indigo-600">RESOLVR ITSM PLATFORM</p>
                <h2 className="text-2xl font-black text-slate-900 mt-1">OPERATIONS RESOLUTION STATEMENT</h2>
                <p className="text-xs text-slate-500 mt-0.5">Audited developer resolution capacity & service performance</p>
              </div>
              <div className="text-right text-xs text-slate-600 font-mono space-y-1">
                <p>Statement Scope: <strong className="text-slate-900">{scopeLabel}</strong></p>
                <p>Generated: {now.toLocaleDateString()} {now.toLocaleTimeString()}</p>
              </div>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50 font-bold uppercase text-slate-700">
                  <th className="py-3 px-2.5 whitespace-nowrap">Specialist Developer</th>
                  <th className="py-3 px-2.5 whitespace-nowrap">Department Queue</th>
                  <th className="py-3 px-2.5 text-center whitespace-nowrap">Resolved</th>
                  <th className="py-3 px-2.5 text-center whitespace-nowrap">Pending</th>
                  <th className="py-3 px-2.5 text-center whitespace-nowrap">Total Assigned</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Resolution Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {devRows.map((dev) => (
                  <tr key={dev.id}>
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-900">{dev.full_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{dev.email}</p>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{dev.deptName}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{dev.resolved}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-amber-700">{dev.pending}</td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-900">{dev.total}</td>
                    <td className="py-2.5 px-3 text-right font-black text-indigo-700">{dev.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 border-t-2 border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Resolvr Ticket Management System — Official Audit Ledger</span>
            <span>Verified Operations Statement</span>
          </div>
        </div>

        {/* SECTION 2: PER REQUESTOR TICKET BREAKDOWN */}
        <div className="no-print rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Per Requestor Ticket Breakdown</h2>
              <p className="text-xs text-slate-500">Complete ticket history and resolution notes grouped by requestor.</p>
            </div>
            <select
              value={selectedRequestor}
              onChange={(e) => setSelectedRequestor(e.target.value)}
              className="w-full sm:w-72 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Requestors ({requestors.length})</option>
              {requestors.map((r) => <option key={r.id} value={r.id}>{r.full_name} ({r.email})</option>)}
            </select>
          </div>
          <div className="space-y-4">
            {filteredRequestors.map((req) => {
              const reqTickets = filteredTickets.filter((t) => t.requestor_id === req.id)
              if (selectedRequestor === "all" && reqTickets.length === 0) return null
              const resCount = reqTickets.filter((t) => t.statusDb === "resolved").length
              const pendCount = reqTickets.filter((t) => t.statusDb !== "resolved").length
              return (
                <div key={req.id} className="rounded-xl border border-slate-200/80 p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-900">{req.full_name}</h3>
                      <p className="text-xs text-slate-500">{req.email}</p>
                    </div>
                    <div className="flex gap-2 text-xs font-bold">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Total: {reqTickets.length}</span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Resolved: {resCount}</span>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">Pending: {pendCount}</span>
                    </div>
                  </div>
                  {reqTickets.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No tickets in this period.</p>
                  ) : (
                    <table className="w-full text-left text-xs table-fixed">
                      <thead>
                        <tr className="border-b border-slate-100 uppercase text-slate-400 font-bold">
                          <th className="py-2 w-28">Ticket #</th>
                          <th className="py-2 w-60">Subject</th>
                          <th className="py-2 w-24">Priority</th>
                          <th className="py-2 w-24">Status</th>
                          <th className="py-2 w-44">Developer</th>
                          <th className="py-2">Resolution Comment</th>
                          <th className="py-2 w-28 text-right">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reqTickets.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/60">
                            <td className="py-2.5 font-mono font-bold text-indigo-600 whitespace-nowrap truncate">
                              <Link to={"/admin/tickets/" + t.id} className="hover:underline">#{t.ticket_number}</Link>
                            </td>
                            <td className="py-2.5 font-semibold text-slate-900 truncate pr-3">{t.subject}</td>
                            <td className="py-2.5"><PriorityBadge priority={t.priority} /></td>
                            <td className="py-2.5"><StatusBadge status={t.status} /></td>
                            <td className="py-2.5 text-slate-700 font-medium truncate">{t.assignedTo ?? "Unassigned"}</td>
                            <td className="py-2.5 text-slate-600 truncate pr-3">{t.resolution_comment ?? "—"}</td>
                            <td className="py-2.5 text-slate-500 text-right whitespace-nowrap">{t.created}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AppShell>
  )
}