import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { AppShell } from "@/layouts/Sidebar"
import { BackLink } from "@/layouts/PageHeader"
import { Button } from "@/components/ui/Button"
import { CategoryBadge, PriorityBadge, StatusBadge } from "@/components/ui/Badge"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { Input, Label, Select, Textarea } from "@/components/ui/Input"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { formatDateTime, mapTicket, ticketSelect, type Profile, type Ticket, type TicketActivity } from "@/lib/tickets"

export function AdminTicketDetail() {
  const { id } = useParams()
  const { profile: adminProfile } = useAuth()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [developers, setDevelopers] = useState<Profile[]>([])
  const [activity, setActivity] = useState<TicketActivity[]>([])
  const [selected, setSelected] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolutionComment, setResolutionComment] = useState("")
  const [showReassignVerify, setShowReassignVerify] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [verifyError, setVerifyError] = useState("")

  async function load() {
    setError("")
    const { data, error: ticketError } = await supabase
      .from("tickets")
      .select(ticketSelect)
      .eq("id", id)
      .maybeSingle()

    if (ticketError || !data) {
      setError(ticketError?.message ?? "Ticket not found.")
      setLoading(false)
      return
    }

    const nextTicket = mapTicket(data as never)
    setTicket(nextTicket)
    setSelected(nextTicket.assigned_to ?? "")
    setResolutionComment(nextTicket.resolution_comment ?? "")

    const { data: category } = await supabase
      .from("categories")
      .select("department_id")
      .eq("id", nextTicket.category_id)
      .single()

    if (category) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "developer")
        .eq("is_active", true)
        .eq("department_id", category.department_id)
        .order("full_name")

      setDevelopers((profiles ?? []) as Profile[])
    }

    const { data: events } = await supabase
      .from("ticket_activity")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at")

    setActivity((events ?? []) as TicketActivity[])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [id])

  async function executeAssign() {
    if (!ticket) return
    setSaving(true)
    setError("")

    const payload: { assigned_to: string | null; status?: "open" | "in_progress" } = {
      assigned_to: selected || null,
    }
    if (selected && ticket.statusDb === "open") payload.status = "in_progress"
    if (!selected && ticket.statusDb === "in_progress") payload.status = "open"

    const { error: updateError } = await supabase.from("tickets").update(payload).eq("id", id)

    if (updateError) setError(updateError.message)
    else {
      await load()
      window.dispatchEvent(new Event("notifications-updated"))
    }
    setSaving(false)
  }

  const handleSaveAssignmentClick = () => {
    if (!ticket) return
    if (ticket.assigned_to && ticket.assigned_to !== selected) {
      setAdminPassword("")
      setVerifyError("")
      setShowReassignVerify(true)
      return
    }
    void executeAssign()
  }

  const confirmVerifiedReassign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminProfile?.email) return
    setSaving(true)
    setVerifyError("")

    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: adminProfile.email,
      password: adminPassword,
    })

    if (authErr) {
      setVerifyError("Verification failed: Incorrect Admin password.")
      setSaving(false)
      return
    }

    setShowReassignVerify(false)
    await executeAssign()
  }

  const changeStatus = async (value: string) => {
    if (value === "resolved") {
      setResolutionComment(ticket?.resolution_comment ?? "")
      setShowResolveModal(true)
      return
    }
    const { error: updateError } = await supabase.from("tickets").update({ status: value }).eq("id", id)
    if (updateError) setError(updateError.message)
    else {
      await load()
      window.dispatchEvent(new Event("notifications-updated"))
    }
  }

  const confirmResolveWithComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolutionComment.trim()) {
      setError("Please enter a resolution comment for the requestor.")
      return
    }
    setSaving(true)
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        status: "resolved",
        resolution_comment: resolutionComment.trim(),
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id)

    setSaving(false)
    if (updateError) setError(updateError.message)
    else {
      setShowResolveModal(false)
      await load()
      window.dispatchEvent(new Event("notifications-updated"))
    }
  }

  if (loading) return <AppShell role="admin"><PageLoading /></AppShell>
  if (error || !ticket) return <AppShell role="admin"><PageError message={error || "Not found"} /></AppShell>

  // Timeline synthesizer: guarantees no ticket has an empty activity card
  const timeline = activity.length > 0
    ? activity.map((act) => ({
        id: act.id,
        label: act.activity_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        date: formatDateTime(act.created_at),
        badge: "●",
      }))
    : [
        { id: "1", label: `Ticket Submitted by \${ticket.requestor}`, date: formatDateTime(ticket.created_at), badge: "✓" },
        ...(ticket.assignedTo
          ? [{ id: "2", label: `Assigned to \${ticket.assignedTo}`, date: formatDateTime(ticket.updated_at), badge: "→" }]
          : []),
        ...(ticket.statusDb === "resolved"
          ? [{ id: "3", label: "Ticket Resolved & Verification Completed", date: formatDateTime(ticket.resolved_at ?? ticket.updated_at), badge: "★" }]
          : []),
      ]

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <BackLink to="/admin/tickets" label="Back to Support Tickets" />

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Requestor Information</h2>
                <span className="text-xs text-slate-500">Submitted on {formatDateTime(ticket.created_at)}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {ticket.requestor} <span className="font-normal text-slate-500">({ticket.requestorEmail})</span>
              </p>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {ticket.description}
                </p>
              </div>
            </div>

            {ticket.resolution_comment && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Official Resolution Comment
                  </h2>
                  {ticket.resolved_at && (
                    <span className="text-xs text-emerald-700 font-medium">{formatDateTime(ticket.resolved_at)}</span>
                  )}
                </div>
                <p className="text-sm text-emerald-950 whitespace-pre-wrap leading-relaxed">{ticket.resolution_comment}</p>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Lifecycle & Activity History</h2>
              <div className="space-y-4 border-l-2 border-indigo-100 ml-2 pl-4">
                {timeline.map((item) => (
                  <div key={item.id} className="relative">
                    <span className="absolute -left-[23px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                      {item.badge}
                    </span>
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900">Developer Assignment</h2>
              <p className="text-xs text-slate-500">
                Routed to specialists in this ticket&apos;s department queue.
              </p>
              <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
                <option value="">Unassigned</option>
                {developers.map((dev) => (
                  <option key={dev.id} value={dev.id}>{dev.full_name}</option>
                ))}
              </Select>
              <Button className="w-full" disabled={saving} onClick={handleSaveAssignmentClick}>
                Save Assignment
              </Button>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900">Ticket Lifecycle Status</h2>
              <Select value={ticket.statusDb} onChange={(e) => void changeStatus(e.target.value)}>
                <option value="open">Open</option>
                <option value="in_progress">Assigned</option>
                <option value="resolved">Resolved</option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <form onSubmit={confirmResolveWithComment} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Mark Ticket as Resolved</h3>
            <p className="text-xs text-slate-500">
              Provide a clear resolution note for requestor <strong>{ticket.requestor}</strong>.
            </p>
            <Textarea
              rows={4}
              placeholder="Explain how the technical issue was resolved..."
              value={resolutionComment}
              onChange={(e) => setResolutionComment(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowResolveModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !resolutionComment.trim()}>Confirm Resolution</Button>
            </div>
          </form>
        </div>
      )}

      {showReassignVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <form onSubmit={confirmVerifiedReassign} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Reassign Developer Authorization</h3>
            <p className="text-xs text-slate-600">
              Changing assigned specialist for <strong>#{ticket.ticket_number}</strong>. Confirm admin password:
            </p>
            {verifyError && <p className="text-xs text-rose-600">{verifyError}</p>}
            <Input
              type="password"
              placeholder="Admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowReassignVerify(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>Verify & Save</Button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  )
}
