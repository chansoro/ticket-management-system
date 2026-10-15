import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AppShell } from "@/layouts/Sidebar"
import { PageHeader } from "@/layouts/PageHeader"
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
      if (scope === "this_month") {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      }
      if (scope === "year") {
        return d.getFullYear() === selectedYear
      }
      return true
    })
  }, [tickets, scope, selectedYear, now])

  const scopeLabel = useMemo(() => {
    if (scope === "this_month") {
      return now.toLocaleDateString("en-US", { month: "long", year: "numeric" }) + " Summary"
    }
    if (scope === "year") {
      return `Year \${selectedYear} Summary`
    }
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
    return {
      ...dev,
      deptName: dev.department_id ? deptMap[dev.department_id] ?? "Unassigned" : "Unassigned",
      resolved,
      pending,
      total,
      rate,
    }
  })

  const filteredRequestors =
    selectedRequestor === "all" ? requestors : requestors.filter((r) => r.id === selectedRequestor)

  const handleDownloadCSV = () => {
    const escapeCsv = (val: string | number) => `"\${String(val).replace(/"/g, '""')}"`
    const lines: string[] = []

    lines.push([escapeCsv("RESOLVR TICKET MANAGEMENT SYSTEM - OFFICIAL REPORT"), escapeCsv(scopeLabel)].join(","))
    lines.push([escapeCsv("Generated On"), escapeCsv(new Date().toLocaleString())].join(","))
    lines.push("")
    lines.push("SECTION 1: DEVELOPER RESOLUTION SUMMARY")
    lines.push([
      escapeCsv("Developer Name"),
      escapeCsv("Email Address"),
      escapeCsv("Department"),
      escapeCsv("Report Period"),
      escapeCsv("Resolved Tickets"),
      escapeCsv("Pending Tickets"),
      escapeCsv("Total Assigned"),
      escapeCsv("Resolution Rate (%)"),
    ].join(","))

    devRows.forEach((d) => {
      lines.push([
        escapeCsv(d.full_name),
        escapeCsv(d.email),
        escapeCsv(d.deptName),
        escapeCsv(scopeLabel),
        escapeCsv(d.resolved),
        escapeCsv(d.pending),
        escapeCsv(d.total),
        escapeCsv(`\${d.rate}%`),
      ].join(","))
    })

    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Resolvr_Report_\${scopeLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        {/* Modern Right-Aligned Filter & Export Header */}
        <div className="no-print flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">General Reports</h1>
            <p className="mt-1 text-sm text-slate-500">
              Developer resolution metrics and per-requestor ticket breakdown ({scopeLabel}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold">
              <span className="text-indigo-600">Period:</span>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as ReportScope)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none"
              >
                <option value="overall">Overall Summary</option>
                <option value="this_month">This Month Only</option>
                <option value="year">Specific Year</option>
              </select>
              {scope === "year" && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-bold text-indigo-600 focus:outline-none"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              )}
            </div>

            <Button variant="secondary" onClick={handleDownloadCSV}>
              ⬇ Export .CSV
            </Button>
            <Button onClick={() => window.print()}>
              ⎙ Export .PDF Statement
            </Button>
          </div>
        </div>

        {/* SECTION 1: GCash/Bank-Statement-Style Printable Document (Clean Margins & Header) */}
        <div className="print-statement rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xs">
          <div className="border-b-2 border-slate-900 pb-5 mb-6 flex items-start justify-between">
            <div>
              <p className="text-xs font-black tracking-widest uppercase text-indigo-600">RESOLVR ITSM PLATFORM</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">OPERATIONS RESOLUTION STATEMENT</h2>
              <p className="text-xs text-slate-500 mt-0.5">Audited developer resolution capacity & service performance</p>
            </div>
            <div className="text-right text-xs text-slate-600 font-mono space-y-1">
              <p><span className="text-slate-400">Statement Scope:</span> <strong className="text-slate-900">{scopeLabel}</strong></p>
              <p><span className="text-slate-400">Generated:</span> {now.toLocaleDateString()} {now.toLocaleTimeString()}</p>
              <p><span className="text-slate-400">Document ID:</span> RES-{now.getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Specialist Developer</th>
                  <th className="py-3 px-4">Department Queue</th>
                  <th className="py-3 px-4 text-center">Resolved</th>
                  <th className="py-3 px-4 text-center">Pending</th>
                  <th className="py-3 px-4 text-center">Total Assigned</th>
                  <th className="py-3 px-4 text-right">Resolution Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {devRows.map((dev) => (
                  <tr key={dev.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{dev.full_name}</p>
                      <p className="text-xs text-slate-500 font-mono">{dev.email}</p>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-700">{dev.deptName}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">{dev.resolved}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-700">{dev.pending}</td>
                    <td className="py-3 px-4 text-center font-black text-slate-900">{dev.total}</td>
                    <td className="py-3 px-4 text-right font-black text-indigo-700">{dev.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-4 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Resolvr Ticket Management System — Official Academic Audit Ledger</span>
            <span>Page 1 of 1</span>
          </div>
        </div>

        {/* SECTION 2: Requestor Ticket Breakdown with Exact Column Alignments (Hidden in PDF print) */}
        <div className="no-print rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Per Requestor Ticket Breakdown</h2>
              <p className="text-xs text-slate-500">History and developer resolution comments grouped by requestor.</p>
            </div>
            <select
              value={selectedRequestor}
              onChange={(e) => setSelectedRequestor(e.target.value)}
              className="w-full sm:w-72 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:border-indigo-600 focus:outline-none"
            >
              <option value="all">All Requestors ({requestors.length})</option>
              {requestors.map((r) => (
                <option key={r.id} value={r.id}>{r.full_name} ({r.email})</option>
              ))}
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
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs table-fixed">
                        <thead>
                          <tr className="border-b border-slate-100 uppercase text-slate-400 font-bold">
                            <th className="py-2 w-24">Ticket #</th>
                            <th className="py-2 w-64">Subject</th>
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
                              <td className="py-2.5 font-mono font-bold text-indigo-600 truncate">
                                <Link to={`/admin/tickets/\${t.id}`} className="hover:underline">
                                  #{t.ticket_number}
                                </Link>
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
                    </div>
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
