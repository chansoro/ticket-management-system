import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { useTickets } from '../context/TicketContext'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'

export function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useTickets()
  const { profile } = useAuth()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = notifications.filter((n) => !n.readAt).length
  const displayed =
    filter === 'unread' ? notifications.filter((n) => !n.readAt) : notifications

  const getTicketPath = (ticketId: string) => {
    if (profile?.role === 'admin') return `/admin/tickets/${ticketId}`
    if (profile?.role === 'developer') return `/dev/tickets/${ticketId}`
    return `/my-tickets/${ticketId}`
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
            <p className="text-sm text-slate-500">
              Real-time alerts for ticket submissions, developer assignments, and resolutions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  filter === 'unread' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <Button
                onClick={() => void markAllNotificationsRead()}
                variant="secondary"
                className="inline-flex items-center gap-1.5 text-xs"
              >
                <span>✓ Mark all read</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {displayed.map((n) => {
            const isUnread = !n.readAt
            return (
              <div
                key={n.id}
                onClick={() => {
                  if (isUnread) void markNotificationRead(n.id)
                }}
                className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 transition sm:flex-row sm:items-center ${
                  isUnread
                    ? 'border-indigo-200 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200/80 bg-white hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                      isUnread ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    🔔
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                      {isUnread && (
                        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                    <p className="mt-1.5 text-xs text-slate-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Link
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-indigo-600 shadow-2xs hover:bg-indigo-50"
                    to={getTicketPath(n.ticketId)}
                  >
                    <span>Open Ticket →</span>
                  </Link>
                </div>
              </div>
            )
          })}

          {!displayed.length && (
            <div className="rounded-2xl border border-slate-200/80 bg-white py-14 text-center">
              <p className="text-sm font-medium text-slate-500">No notifications to display.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
