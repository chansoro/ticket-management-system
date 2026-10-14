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

const cardClass = "rounded-2xl border border-[#e5e5ea] bg-white p-6 shadow-sm"

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

  // Resolution comment modal state
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolutionComment, setResolutionComment] = useState("")

  // Developer reassignment verification modal state
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

    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("department_id")
      .eq("id", nextTicket.category_id)
      .single()

    if (categoryError || !category) {
      setError(categoryError?.message ?? "Ticket category not found.")
      setLoading(false)
      return
    }

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "developer")
      .eq("is_active", true)
      .eq("department_id", category.department_id)
      .order("full_name")

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    setDevelopers((profiles ?? []) as Profile[])

    const { data: events, error: activityError } = await supabase
      .from("ticket_activity")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at")

    if (activityError) setError(activityError.message)
    setActivity((events ?? []) as TicketActivity[])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [id])

  function handleSaveAssignmentClick() {
    if (!ticket) return
    // If ticket already has an assigned developer and Admin is switching to another developer, require verification
    if (ticket.assigned_to && ticket.assigned_to !== selected) {
      setAdminPassword("")
      setVerifyError("")
      setShowReassignVerify(true)
      return
    }
    void executeAssign()
  }

  async function executeAssign() {
    if (!ticket) return
    setSaving(true)
    setError("")

    const payload: { assigned_to: string | null; status?: "open" | "in_progress" } = {
      assigned_to: selected || null,
    }

    if (selected && ticket.statusDb === "open") payload.status = "in_progress"
    if (!selected && ticket.statusDb === "in_progress") payload.status = "open"

    const { error: updateError } = await supabase
      .from("tickets")
      .update(payload)
      .eq("id", id)

    if (updateError) setError(updateError.message)
    else {
      await load()
      window.dispatchEvent(new Event("notifications-updated"))
    }
    setSaving(false)
  }

  async function confirmVerifiedReassign(e: React.FormEvent) {
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

  async function changeStatus(value: string) {
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

  async function confirmResolveWithComment(e: React.FormEvent) {
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
      })
      .eq("id", id)

    setSaving(false)
    if (updateError) {
      setError(updateError.message)
    } else {
      setShowResolveModal(false)
      await load()
      window.dispatchEvent(new Event("notifications-updated"))
    }
  }

  if (loading) return <AppShell role="admin"><PageLoading /></AppShell>
  if (error || !ticket) return <AppShell role="admin"><PageError message={error || "Not found"} /></AppShell>

  const nextStatuses = ticket.statusDb === "open"
    ? (ticket.assigned_to ? ["open", "in_progress", "resolved"] : ["open", "resolved"])
    : ticket.statusDb === "in_progress"
      ? ["in_progress", "resolved"]
      : ["resolved", "open"]

  return (
    <AppShell role="admin">
      <div className="max-w-4xl px-8 py-8">
        <BackLink to="/admin/tickets" label="Back to Tickets" />
        <div className={`\${cardClass} mb-5`}>
          <p className="font-mono text-xs">#{ticket.ticket_number}</p>
          <div className="flex justify-between">
            <h1 className="text-xl font-semibold">{ticket.subject}</h1>
            <StatusBadge status={ticket.status} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-5">
            <div className={cardClass}>
              <CategoryBadge category={ticket.category} />
              <div className="mt-3"><PriorityBadge priority={ticket.priority} /></div>
              <p className="mt-4 text-sm">Requestor: {ticket.requestor} · {ticket.requestorEmail}</p>
              <p className="mt-4 border-t pt-4 text-sm">{ticket.description}</p>
            </div>

            {ticket.resolution_comment && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                    Resolution / Comment (Visible to Requestor)
                  </h2>
                  {ticket.resolved_at && (
                    <span className="text-xs text-emerald-700">{formatDateTime(ticket.resolved_at)}</span>
                  )}
                </div>
                <p className="text-sm text-emerald-950 whitespace-pre-wrap">{ticket.resolution_comment}</p>
              </div>
            )}

            <div className={cardClass}>
              <h2 className="mb-4 font-semibold">Activity</h2>
              {activity.map((item) => (
                <div key={item.id} className="mb-3 border-l-2 pl-4 text-sm">
                  {item.activity_type.replaceAll("_", " ")}
                  <p className="text-xs text-[#aeaeb2]">{formatDateTime(item.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className={`\${cardClass} p-5`}>
              <h2 className="mb-3 font-semibold">Assign Developer</h2>
              <Select value={selected} onChange={(event) => setSelected(event.target.value)}>
                <option value="">Unassigned</option>
                {developers.map((developer) => (
                  <option key={developer.id} value={developer.id}>{developer.full_name}</option>
                ))}
              </Select>
              {!developers.length && (
                <p className="mt-2 text-sm text-[#6e6e73]">No active developers are assigned to this ticket department.</p>
              )}
              <Button className="mt-3 w-full" disabled={saving} onClick={handleSaveAssignmentClick}>
                Save Assignment
              </Button>
            </div>
            <div className={`\${cardClass} p-5`}>
              <h2 className="mb-3 font-semibold">Status</h2>
              <Select value={ticket.statusDb} onChange={(event) => void changeStatus(event.target.value)}>
                {nextStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "in_progress" ? "Assigned" : status.replace(/^./, (character) => character.toUpperCase())}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Comment Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={confirmResolveWithComment} className="w-full max-w-lg rounded-2xl border border-[#e5e5ea] bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-[#1d1d1f]">Mark Ticket as Resolved</h3>
            <p className="text-xs text-[#6e6e73]">
              Provide a resolution note or comment below. This will be visible to the Requestor ({ticket.requestor}).
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="admin-res-comment">Resolution Comment</Label>
              <Textarea
                id="admin-res-comment"
                rows={4}
                placeholder="Explain how the issue was resolved..."
                value={resolutionComment}
                onChange={(e) => setResolutionComment(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowResolveModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !resolutionComment.trim()}>
                {saving ? "Saving…" : "Confirm Resolution"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Developer Switch Verification Modal */}
      {showReassignVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={confirmVerifiedReassign} className="w-full max-w-md rounded-2xl border border-[#e5e5ea] bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-[#1d1d1f]">Verify Developer Reassignment</h3>
            <p className="text-xs text-[#6e6e73]">
              You are changing the assigned developer for ticket <strong>#{ticket.ticket_number}</strong>. Please enter your Admin password to verify.
            </p>
            {verifyError && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{verifyError}</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="reassign-pass">Admin Password</Label>
              <Input
                id="reassign-pass"
                type="password"
                placeholder="Enter your password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowReassignVerify(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Verifying…" : "Verify & Reassign"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  )
}