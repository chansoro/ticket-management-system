import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { AppShell } from "@/layouts/Sidebar"
import { BackLink } from "@/layouts/PageHeader"
import { Button } from "@/components/ui/Button"
import { CategoryBadge, PriorityBadge, StatusBadge } from "@/components/ui/Badge"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { Select } from "@/components/ui/Input"
import { supabase } from "@/lib/supabase"
import { formatDateTime, mapTicket, ticketSelect, type Profile, type Ticket, type TicketActivity } from "@/lib/tickets"
import { Check, ArrowRight, Star, Lock } from "lucide-react"

export function AdminTicketDetail() {
  const { id } = useParams()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [developers, setDevelopers] = useState<Profile[]>([])
  const [activeCounts, setActiveCounts] = useState<Record<string, number>>({})
  const [activity, setActivity] = useState<TicketActivity[]>([])
  const [selected, setSelected] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function load() {
    setError("")
    const { data, error: ticketError } = await supabase.from("tickets").select(ticketSelect).eq("id", id).maybeSingle()
    if (ticketError || !data) { setError(ticketError?.message ?? "Ticket not found."); setLoading(false); return }
    const nextTicket = mapTicket(data as never)
    setTicket(nextTicket)
    setSelected(nextTicket.assigned_to ?? "")

    const { data: category } = await supabase.from("categories").select("department_id").eq("id", nextTicket.category_id).single()
    if (category) {
      const { data: profiles } = await supabase.from("profiles").select("*").eq("role", "developer").eq("is_active", true).eq("department_id", category.department_id).order("full_name")
      const devList = (profiles ?? []) as Profile[]
      setDevelopers(devList)

      const { data: activeTickets } = await supabase.from("tickets").select("assigned_to, status").neq("status", "resolved")
      const counts: Record<string, number> = {}
      devList.forEach((d) => { counts[d.id] = 0 })
      ;(activeTickets ?? []).forEach((t: any) => {
        if (t.assigned_to && counts[t.assigned_to] !== undefined) {
          counts[t.assigned_to] += 1
        }
      })
      setActiveCounts(counts)
    }

    const { data: events } = await supabase.from("ticket_activity").select("*").eq("ticket_id", id).order("created_at")
    setActivity((events ?? []) as TicketActivity[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [id])

  async function executeAssign() {
    if (!ticket || !selected) return
    setSaving(true); setError("")
    const payload: { assigned_to: string | null; status?: "open" | "in_progress" } = { assigned_to: selected }
    if (ticket.statusDb === "open") payload.status = "in_progress"
    const { error: updateError } = await supabase.from("tickets").update(payload).eq("id", id)
    if (updateError) setError(updateError.message)
    else { await load(); window.dispatchEvent(new Event("notifications-updated")) }
    setSaving(false)
  }

  if (loading) return <AppShell role="admin"><PageLoading /></AppShell>
  if (error || !ticket) return <AppShell role="admin"><PageError message={error || "Not found"} /></AppShell>

  const isLocked = Boolean(ticket.assigned_to) || ticket.statusDb === "resolved"

  const timeline = activity.length > 0
    ? activity.map((act) => {
        const t = act.activity_type.toLowerCase()
        const label = t === "created" ? "Ticket Submitted by " + ticket.requestor : t === "assigned" ? "Assigned to " + (ticket.assignedTo || "Developer") : t === "status_changed" ? "Status Changed to " + ticket.status : t.includes("resolve") ? "Ticket Resolved & Completed" : act.activity_type.replace(/_/g, " ")
        const icon = t.includes("resolve") ? Star : t.includes("assign") || t.includes("status") ? ArrowRight : Check
        return { id: act.id, label, date: formatDateTime(act.created_at), icon }
      })
    : [
        { id: "1", label: "Ticket Submitted by " + ticket.requestor, date: formatDateTime(ticket.created_at), icon: Check },
        ...(ticket.assignedTo ? [{ id: "2", label: "Assigned to " + ticket.assignedTo, date: formatDateTime(ticket.updated_at), icon: ArrowRight }] : []),
        ...(ticket.statusDb === "resolved" ? [{ id: "3", label: "Ticket Resolved & Completed", date: formatDateTime(ticket.resolved_at ?? ticket.updated_at), icon: Star }] : []),
      ]

  return (
    <AppShell role="admin">
      <div className="space-y-5">
        <BackLink to="/admin/tickets" label="Back to Support Tickets" />
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-indigo-600">#{ticket.ticket_number}</span>
              <CategoryBadge category={ticket.category} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{ticket.subject}</h1>
          </div>
          <StatusBadge status={ticket.status} />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Requestor</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{ticket.requestor} <span className="font-normal text-slate-500">({ticket.requestorEmail})</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Submitted</p>
                  <p className="mt-0.5 text-xs text-slate-600 font-medium">{formatDateTime(ticket.created_at)}</p>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">{ticket.description}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Activity History</h2>
              <div className="space-y-3.5 border-l-2 border-indigo-100 ml-3 pl-4">
                {timeline.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.id} className="relative">
                      <span className="absolute -left-[25px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                        <Icon className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                      <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.date}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3.5">
              <h2 className="text-base font-bold text-slate-900">Developer Assignment</h2>
              <p className="text-xs text-slate-500">Routed to specialists in this ticket&apos;s department queue.</p>
              <Select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                disabled={isLocked}
                className={isLocked ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}
              >
                <option value="">Select a developer...</option>
                {developers.map((dev) => {
                  const count = activeCounts[dev.id] ?? 0
                  const loadText = count === 0 ? "0 active (Available)" : count === 1 ? "1 active ticket" : count + " active tickets"
                  return (
                    <option key={dev.id} value={dev.id}>
                      {dev.full_name} — ({loadText})
                    </option>
                  )
                })}
              </Select>

              {isLocked ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-semibold text-slate-500">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{ticket.statusDb === "resolved" ? "Ticket Resolved — Assignment Locked" : "Developer Assigned — Assignment Locked"}</span>
                </div>
              ) : (
                <Button className="w-full" disabled={saving || !selected} onClick={() => void executeAssign()}>
                  {saving ? "Assigning..." : "Save Assignment"}
                </Button>
              )}
            </div>

            {ticket.resolution_comment && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Resolution Note</h2>
                  {ticket.resolved_at && <span className="text-[11px] text-emerald-700 font-medium">{formatDateTime(ticket.resolved_at)}</span>}
                </div>
                <p className="text-sm text-emerald-950 whitespace-pre-wrap leading-relaxed">{ticket.resolution_comment}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}