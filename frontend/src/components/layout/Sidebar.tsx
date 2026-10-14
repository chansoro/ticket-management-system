import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Ticket,
  BarChart3,
  Code2,
  Users,
  Tags,
  Bell,
  PlusCircle,
  Settings,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { AccountSettingsModal } from './AccountSettingsModal'

export function Sidebar() {
  const { profile } = useAuth()
  const { unreadCount } = useNotifications()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  if (!profile) return null

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/tickets', label: 'Tickets', icon: Ticket },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/admin/developers', label: 'Departments & Devs', icon: Code2 },
    { to: '/admin/users', label: 'Users & Roles', icon: Users },
    { to: '/admin/categories', label: 'Categories', icon: Tags },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
  ]

  const devLinks = [
    { to: '/dev/workbench', label: 'Workbench', icon: LayoutDashboard },
    { to: '/dev/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
  ]

  const userLinks = [
    { to: '/my-tickets', label: 'My Tickets', icon: Ticket },
    { to: '/submit-ticket', label: 'Submit Ticket', icon: PlusCircle },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
  ]

  const links =
    profile.role === 'admin' ? adminLinks : profile.role === 'developer' ? devLinks : userLinks

  const initials = profile.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const navContent = (
    <div className="flex h-full flex-col bg-[#0f172a] text-slate-200 select-none">
      <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/25">
            <ShieldCheck className="h-5 w-5" />
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
          <X className="h-5 w-5" />
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
        {links.map((item) => {
          const Icon = item.icon
          return (
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
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
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
          )
        })}
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
                {profile.role === 'user' ? 'Requestor' : profile.role} Account
              </p>
            </div>
          </div>
          <Settings className="h-4 w-4 shrink-0 text-slate-400 hover:text-white" />
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-[#0f172a] px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <ShieldCheck className="h-4 w-4" />
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
          className="rounded-lg bg-slate-800 p-2 text-slate-200 hover:bg-slate-700"
        >
          <Menu className="h-5 w-5" />
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
