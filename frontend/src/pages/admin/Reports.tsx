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

  const handleDownloadCSV = () => {
    const q = (v: any) => "\"" + String(v ?? "").split("\"").join("\"\"") + "\""
    const rows: string[] = []
    rows.push([q("RESOLVR TICKET MANAGEMENT SYSTEM - OFFICIAL REPORT"), q(scopeLabel)].join(","))
    rows.push([q("Generated On"), q(new Date().toLocaleString())].join(","))
    rows.push("")
    rows.push([q("Developer Name"), q("Email Address"), q("Department"), q("Period"), q("Resolved"), q("Pending"), q("Total Assigned"), q("Resolution Rate")].join(","))
    devRows.forEach((d) => {
      rows.push([q(d.full_name), q(d.email), q(d.deptName), q(scopeLabel), q(d.resolved), q(d.pending), q(d.total), q(String(d.rate) + "%")].join(","))
    })
    const blob = new Blob(["\uFEFF" + rows.join("\r\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const suffix = scope === "year" ? "Year_" + String(selectedYear) : scope === "this_month" ? "This_Month" : "Overall"
    a.download = "Resolvr_Operations_Report_" + suffix + ".csv"
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
          <div className="border-b-2 border-slate-900 pb-4 mb-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-black tracking-widest uppercase text-indigo-600">RESOLVR ITSM PLATFORM</p>
              <h2 className="text-xl font-black text-slate-900 mt-1">OPERATIONS RESOLUTION STATEMENT</h2>
              <p className="text-xs text-slate-500">Audited developer resolution capacity & service performance</p>
            </div>
            <div className="text-right text-xs text-slate-600 font-mono space-y-0.5">
              <p>Statement Scope: <strong className="text-slate-900">{scopeLabel}</strong></p>
              <p>Generated: {now.toLocaleDateString()} {now.toLocaleTimeString()}</p>
            </div>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50 font-bold uppercase text-slate-600">
                <th className="py-2 px-3">Specialist Developer</th>
                <th className="py-2 px-3">Department Queue</th>
                <th className="py-2 px-3 text-center">Resolved</th>
                <th className="py-2 px-3 text-center">Pending</th>
                <th className="py-2 px-3 text-center">Total Assigned</th>
                <th className="py-2 px-3 text-right">Resolution Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {devRows.map((dev) => (
                <tr key={dev.id}>
                  <td className="py-1.5 px-3"><span className="font-bold text-slate-900">{dev.full_name}</span> <span className="text-slate-400 font-mono">({dev.email})</span></td>
                  <td className="py-1.5 px-3 font-medium text-slate-700">{dev.deptName}</td>
                  <td className="py-1.5 px-3 text-center font-bold text-emerald-700">{dev.resolved}</td>
                  <td className="py-1.5 px-3 text-center font-bold text-amber-700">{dev.pending}</td>
                  <td className="py-1.5 px-3 text-center font-black text-slate-900">{dev.total}</td>
                  <td className="py-1.5 px-3 text-right font-black text-indigo-700">{dev.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Resolvr Ticket Management System — Official Audit Ledger</span>
            <span>Verified Operations Statement</span>
          </div>
        </div>
      </div>
    </AppShell>
  )
}