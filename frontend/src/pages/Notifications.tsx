import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AppShell } from "@/layouts/Sidebar"
import { PageHeader } from "@/layouts/PageHeader"
import { Button } from "@/components/ui/Button"
import { supabase } from "@/lib/supabase"
import { formatRelative } from "@/lib/tickets"

interface NotificationItem {
  id: string
  ticket_id: string | null
  title: string
  body: string
  read_at: string | null
  created_at: string
}

export function Notifications({ role }: { role: "requestor" | "admin" | "developer" }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [loading, setLoading] = useState(true)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("notifications")
      .select("id, ticket_id, title, body, read_at, created_at")
      .order("created_at", { ascending: false })

    setNotifications((data ?? []) as NotificationItem[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id)
    window.dispatchEvent(new Event("notifications-updated"))
    await loadNotifications()
  }

  const markAllRead = async () => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null)
    window.dispatchEvent(new Event("notifications-updated"))
    await loadNotifications()
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length
  const displayed = filter === "unread" ? notifications.filter((n) => !n.read_at) : notifications

  const getTicketPath = (ticketId: string | null) => {
    if (!ticketId) return "#"
    if (role === "admin") return `/admin/tickets/${ticketId}`
    if (role === "developer") return `/developer/tickets/${ticketId}`
    return `/requestor/tickets/${ticketId}`
  }

  return (
    <AppShell role={role}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader
            title="Notifications"
            subtitle="Real-time alerts for ticket submissions, developer assignments, and resolutions."
          />

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${filter === "all" ? "bg-indigo-600 text-white" : "text-slate-600"}`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${filter === "unread" ? "bg-indigo-600 text-white" : "text-slate-600"}`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <Button size="sm" variant="secondary" onClick={() => void markAllRead()}>
                ✓ Mark all read
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {displayed.map((n) => {
            const isUnread = !n.read_at
            return (
              <div
                key={n.id}
                onClick={() => { if (isUnread) void markRead(n.id) }}
                className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 transition sm:flex-row sm:items-center ${
                  isUnread ? "border-indigo-200 bg-indigo-50/40 shadow-xs" : "border-slate-200/80 bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                    {isUnread && (
                      <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                  <p className="mt-1.5 text-xs text-slate-400">{formatRelative(n.created_at)}</p>
                </div>

                {n.ticket_id && (
                  <Link
                    to={getTicketPath(n.ticket_id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 shrink-0"
                  >
                    Open Ticket →
                  </Link>
                )}
              </div>
            )
          })}

          {!displayed.length && !loading && (
            <div className="rounded-2xl border border-slate-200/80 bg-white py-14 text-center text-sm text-slate-400">
              No notifications to display.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
