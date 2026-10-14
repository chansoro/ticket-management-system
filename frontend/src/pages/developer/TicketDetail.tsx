import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { CheckCircle2, Play } from "lucide-react"
import { AppShell } from "@/layouts/Sidebar"
import { BackLink } from "@/layouts/PageHeader"
import { Button } from "@/components/ui/Button"
import { StatusBadge, PriorityBadge, CategoryBadge } from "@/components/ui/Badge"
import { Label, Textarea } from "@/components/ui/Input"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { supabase } from "@/lib/supabase"
import { formatDateTime, mapTicket, ticketSelect, type Ticket, type TicketActivity } from "@/lib/tickets"
import { useAuth } from "@/contexts/AuthContext"

export function DeveloperTicketDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [t, setT] = useState<Ticket | null>(null)
  const [activity, setActivity] = useState<TicketActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  // Resolution Comment Modal state
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolutionComment, setResolutionComment] = useState("")

  async function load() {
    const { data, error: e } = await supabase.from("tickets").select(ticketSelect).eq("id", id).maybeSingle()
    if (e) setError(e.message)
    else if (!data) setError("Ticket not found or no longer assigned to you.")
    else {
      const mapped = mapTicket(data as never)
      setT(mapped)
      setResolutionComment(mapped.resolution_comment ?? "")
      const { data: a } = await supabase.from("ticket_activity").select("*").eq("ticket_id", id).order("created_at")
      setActivity((a ?? []) as TicketActivity[])
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [id])

  async function status(value: "in_progress" | "resolved") {
    if (value === "resolved") {
      setShowResolveModal(true)
      return
    }
    setSaving(true)
    const { error: e } = await supabase.from("tickets").update({ status: value }).eq("id", id)
    if (e) setError(e.message)
    else {
      await load()
      window.dispatchEvent(new Event("notifications-updated"))
    }
    setSaving(false)
  }

  async function submitResolution(e: React.FormEvent) {
    e.preventDefault()
    if (!resolutionComment.trim()) return
    setSaving(true)
    const { error: updateErr } = await supabase
      .from("tickets")
      .update({
        status: "resolved",
        resolution_comment: resolutionComment.trim(),
      })
      .eq("id", id)

    setSaving(false)
    if (updateErr) {
      setError(updateErr.message)
    } else {
      setShowResolveModal(false)
      await load()
      window.dispatchEvent(new Event("notifications-updated"))
    }
  }

  if (loading) return <AppShell role="developer"><PageLoading /></AppShell>
  if (error || !t) return <AppShell role="developer"><PageError message={error || "Not found"} /></AppShell>

  return (
    <AppShell role="developer">
      <div className="max-w-5xl px-8 py-8">
        <BackLink to="/developer/tickets" label="Back to My Tickets" />
        <div className="mb-5 rounded-2xl border bg-white p-6">
          <p className="font-mono text-xs">#{t.ticket_number}</p>
          <div className="flex justify-between">
            <h1 className="text-xl font-semibold">{t.subject}</h1>
            <StatusBadge status={t.status} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-5">
            <div className="rounded-2xl border bg-white p-6">
              <div className="space-y-3">
                <p><CategoryBadge category={t.category} /></p>
                <p><PriorityBadge priority={t.priority} /></p>
                <p className="text-sm">Requestor: {t.requestor}</p>
                <p className="border-t pt-4 text-sm">{t.description}</p>
              </div>
            </div>

            {t.resolution_comment && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                    Resolution Note (Seen by Requestor)
                  </h2>
                  {t.resolved_at && (
                    <span className="text-xs text-emerald-700">{formatDateTime(t.resolved_at)}</span>
                  )}
                </div>
                <p className="text-sm text-emerald-950 whitespace-pre-wrap">{t.resolution_comment}</p>
              </div>
            )}

            <div className="rounded-2xl border bg-white p-6">
              <h2 className="mb-4 font-semibold">Activity</h2>
              {activity.map((a) => (
                <div key={a.id} className="mb-3 border-l-2 pl-4 text-sm">
                  <p>{a.activity_type.replaceAll("_", " ")}</p>
                  <p className="text-xs text-[#aeaeb2]">{formatDateTime(a.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-4 rounded-2xl border bg-white p-5 text-sm">Assigned to {profile?.full_name}</div>
            {t.statusDb === "open" && (
              <Button className="w-full" disabled={saving} onClick={() => void status("in_progress")}>
                <Play className="h-4 w-4" /> Start Progress
              </Button>
            )}
            {t.statusDb === "in_progress" && (
              <Button className="w-full" disabled={saving} onClick={() => void status("resolved")}>
                <CheckCircle2 className="h-4 w-4" /> Mark as Resolved
              </Button>
            )}
            {t.statusDb === "resolved" && (
              <p className="rounded-2xl bg-emerald-50 p-4 text-center text-sm text-emerald-700">Ticket Resolved</p>
            )}
          </div>
        </div>
      </div>

      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={submitResolution} className="w-full max-w-lg rounded-2xl border border-[#e5e5ea] bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-[#1d1d1f]">Resolve Ticket #{t.ticket_number}</h3>
            <p className="text-xs text-[#6e6e73]">
              Please enter a resolution comment explaining what was done. This comment will be visible to the Requestor ({t.requestor}).
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="dev-res-comment">Resolution / Comment</Label>
              <Textarea
                id="dev-res-comment"
                rows={4}
                placeholder="Describe the fix or resolution details..."
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
                {saving ? "Resolving…" : "Submit & Mark Resolved"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  )
}