import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTickets } from '../../context/TicketContext'
import { AccountSettingsModal } from './AccountSettingsModal'

export function Sidebar() {
  const { profile } = useAuth()
  const { notifications } = useTickets()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  if (!profile) return null

  const unreadCount = notifications.filter((n) => !n.readAt).length

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/admin/tickets', label: 'Tickets', icon: 'tickets' },
    { to: '/admin/reports', label: 'Reports', icon: 'reports' },
    { to: '/admin/developers', label: 'Departments & Devs', icon: 'devs' },
    { to: '/admin/users', label: 'Users & Roles', icon: 'users' },
    { to: '/admin/categories', label: 'Categories', icon: 'categories' },
    { to: '/admin/notifications', label: 'Notifications', icon: 'bell', badge: unreadCount },
  ]

  const devLinks = [
    { to: '/dev/workbench', label: 'Workbench', icon: 'dashboard' },
    { to: '/dev/notifications', label: 'Notifications', icon: 'bell', badge: unreadCount },
  ]

  const userLinks = [
    { to: '/my-tickets', label: 'My Tickets', icon: 'tickets' },
    { to: '/submit-ticket', label: 'Submit Ticket', icon: 'plus' },
    { to: '/notifications', label: 'Notifications', icon: 'bell', badge: unreadCount },
  ]

  const links =
    profile.role === 'admin' ? adminLinks : profile.role === 'developer' ? devLinks : userLinks

  const initials = (profile.fullName || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const renderIcon = (name: string, active: boolean) => {
    const cls = `h-4 w-4 shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`
    switch (name) {
      case 'dashboard':
        return (
          <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      case 'tickets':
        return (
          <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      case 'reports':
        return (
          <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      case 'devs':
        return (
          <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        )
      case 'users':
        return (
          <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      case 'categories':
        return (
          <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        )
      case 'plus':
        return (
          <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        )
      default:
        return (
          <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )
    }
  }

  const navContent = (
    <div className="flex h-full flex-col bg-[#0f172a] text-slate-200 select-none">
      <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/25 font-black text-base">
            R
          </div>
          <div>
            <p className="text-base font-extrabold tracking-tight text-white leading-none">
              Resolvr
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              Ticket Management System
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 space-y-1.5 px-3 py-5 overflow-y-auto">
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {profile.role === 'admin'
            ? 'Administration'
            : profile.role === 'developer'
            ? 'Developer Portal'
            : 'Requestor Portal'}
        </p>
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800/75 hover:text-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-white" />
                  )}
                  {renderIcon(item.icon, isActive)}
                  <span>{item.label}</span>
                </div>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                      isActive
                        ? 'bg-white text-indigo-700'
                        : 'bg-indigo-500/20 text-indigo-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800/80 p-3">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex w-full items-center justify-between rounded-xl bg-slate-800/60 p-3 text-left transition hover:bg-slate-800"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300 ring-1 ring-indigo-400/30">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{profile.fullName}</p>
              <p className="truncate text-xs capitalize text-slate-400">
                {profile.role === 'user' ? 'Requestor' : profile.role} • Settings
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400">⚙</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-[#0f172a] px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
            R
          </div>
          <div>
            <span className="font-bold tracking-tight">Resolvr</span>
            <span className="ml-2 text-[10px] uppercase tracking-widest text-indigo-400">
              Ticket Management System
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:bg-slate-700"
        >
          ☰ Menu
        </button>
      </div>

      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw]">{navContent}</div>
        </div>
      )}

      <aside className="no-print hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
        {navContent}
      </aside>

      <AccountSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
