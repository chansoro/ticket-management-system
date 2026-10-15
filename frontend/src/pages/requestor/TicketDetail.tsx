import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { AppShell } from "@/layouts/Sidebar"
import { BackLink } from "@/layouts/PageHeader"
import { CategoryBadge, PriorityBadge, StatusBadge } from "@/components/ui/Badge"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { supabase } from "@/lib/supabase"
import { formatDateTime, mapTicket, ticketSelect, type Ticket, type TicketActivity } from "@/lib/tickets"
import { Check, ArrowRight, Star } from "lucide-react"

export function RequestorTicketDetail() {
  const { id } = useParams()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [activity, setActivity] = useState<TicketActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      const { data, error: ticketError } = await supabase.from("tickets").select(ticketSelect).eq("id", id).maybeSingle()
      if (ticketError || !data) { setError(ticketError?.message ?? "Ticket not found."); setLoading(false); return }
      setTicket(mapTicket(data as never))
      const { data: events } = await supabase.from("ticket_activity").select("*").eq("ticket_id", id).order("created_at")
      setActivity((events ?? []) as TicketActivity[])
      setLoading(false)
    }
    void load()
  }, [id])

  if (loading) return <AppShell role="requestor"><PageLoading /></AppShell>
  if (error || !ticket) return <AppShell role="requestor"><PageError message={error || "Not found"} /></AppShell>

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
    <AppShell role="requestor">
      <div className="space-y-5">
        <BackLink to="/requestor/tickets" label="Back to My Requests" />

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
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ticket Information</h2>
                <span className="text-xs font-medium text-slate-500">Submitted {formatDateTime(ticket.created_at)}</span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Issue Description</p>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</div>
              </div>
            </div>

            {ticket.resolution_comment && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Official Resolution Note</h2>
                  {ticket.resolved_at && <span className="text-xs text-emerald-700 font-medium">{formatDateTime(ticket.resolved_at)}</span>}
                </div>
                <p className="text-sm text-emerald-950 whitespace-pre-wrap leading-relaxed">{ticket.resolution_comment}</p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Specialist</p>
              <p className="text-sm font-bold text-slate-900">{ticket.assignedTo ?? "Awaiting specialist assignment"}</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">Activity History</h2>
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
        </div>
      </div>
    </AppShell>
  )
}
