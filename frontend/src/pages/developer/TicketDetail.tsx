import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { AppShell } from "@/layouts/Sidebar"
import { BackLink } from "@/layouts/PageHeader"
import { Button } from "@/components/ui/Button"
import { CategoryBadge, PriorityBadge, StatusBadge } from "@/components/ui/Badge"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { Textarea } from "@/components/ui/Input"
import { supabase } from "@/lib/supabase"
import { formatDateTime, mapTicket, ticketSelect, type Ticket, type TicketActivity } from "@/lib/tickets"
import { Check, ArrowRight, Star } from "lucide-react"

export function DeveloperTicketDetail() {
  const { id } = useParams()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [activity, setActivity] = useState<TicketActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolutionComment, setResolutionComment] = useState("")
  const [saving, setSaving] = useState(false)

  async function load() {
    setError("")
    const { data, error: ticketError } = await supabase.from("tickets").select(ticketSelect).eq("id", id).maybeSingle()
    if (ticketError || !data) { setError(ticketError?.message ?? "Ticket not found."); setLoading(false); return }
    const nextTicket = mapTicket(data as never)
    setTicket(nextTicket)
    setResolutionComment(nextTicket.resolution_comment ?? "")
    const { data: events } = await supabase.from("ticket_activity").select("*").eq("ticket_id", id).order("created_at")
    setActivity((events ?? []) as TicketActivity[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [id])

  const confirmResolve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolutionComment.trim()) return
    setSaving(true)
    const { error: updateError } = await supabase.from("tickets").update({ status: "resolved", resolution_comment: resolutionComment.trim(), resolved_at: new Date().toISOString() }).eq("id", id)
    setSaving(false)
    if (updateError) setError(updateError.message)
    else { setShowResolveModal(false); await load(); window.dispatchEvent(new Event("notifications-updated")) }
  }

  if (loading) return <AppShell role="developer"><PageLoading /></AppShell>
  if (error || !ticket) return <AppShell role="developer"><PageError message={error || "Not found"} /></AppShell>

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
    <AppShell role="developer">
      <div className="space-y-5">
        <BackLink to="/developer/tickets" label="Back to My Tickets" />
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
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Issue Description</p>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</div>
              </div>
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

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3.5">
              <h2 className="text-base font-bold text-slate-900">Workbench Action</h2>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs text-indigo-900">Assigned to: <strong>{ticket.assignedTo ?? "You"}</strong></div>
              {ticket.statusDb !== "resolved" ? (
                <Button className="w-full" onClick={() => setShowResolveModal(true)}>✓ Mark as Resolved</Button>
              ) : (
                <div className="text-center text-xs font-bold text-emerald-700 bg-emerald-50 py-2.5 rounded-xl border border-emerald-200">Ticket Completed & Closed</div>
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
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <form onSubmit={confirmResolve} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Mark Ticket as Resolved</h3>
            <Textarea rows={4} placeholder="Describe the technical resolution..." value={resolutionComment} onChange={(e) => setResolutionComment(e.target.value)} required />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowResolveModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !resolutionComment.trim()}>{saving ? "Saving..." : "Confirm Resolution"}</Button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  )
}