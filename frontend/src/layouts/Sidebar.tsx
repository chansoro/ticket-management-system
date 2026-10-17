import { useCallback, useEffect, useState, type ReactNode } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { BarChart3, Bell, CheckCircle2, Code2, House, ShieldCheck, ListTodo, LogOut, Plus, Tags, Users, type LucideIcon } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"

type Role = "requestor" | "admin" | "developer"
interface NavItem { label: string; to: string; icon: LucideIcon }

const roleNavItems: Record<Role, NavItem[]> = {
  requestor: [
    { label: "Dashboard", to: "/requestor", icon: House },
    { label: "My Requests", to: "/requestor/tickets", icon: ListTodo },
    { label: "Submit Request", to: "/requestor/create", icon: Plus },
    { label: "Notifications", to: "/requestor/notifications", icon: Bell },
  ],
  admin: [
    { label: "Dashboard", to: "/admin", icon: House },
    { label: "Tickets", to: "/admin/tickets", icon: ListTodo },
    { label: "Reports", to: "/admin/reports", icon: BarChart3 },
    { label: "Developers", to: "/admin/developers", icon: Code2 },
    { label: "Users", to: "/admin/users", icon: Users },
    { label: "Categories", to: "/admin/categories", icon: Tags },
    { label: "Notifications", to: "/admin/notifications", icon: Bell },
  ],
  developer: [
    { label: "Dashboard", to: "/developer", icon: House },
    { label: "My Tickets", to: "/developer/tickets", icon: ListTodo },
    { label: "Resolved", to: "/developer/resolved", icon: CheckCircle2 },
    { label: "Notifications", to: "/developer/notifications", icon: Bell },
  ],
}

export function Sidebar({ role, userName, unreadCount = 0 }: { role: Role; userName?: string; unreadCount?: number }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()
  const displayName = profile?.full_name ?? userName ?? "User"
  const roleLabel = role === "user" ? "Requestor" : role[0].toUpperCase() + role.slice(1)
  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-slate-800 bg-[#0f172a] text-slate-200">
      <div className="border-b border-slate-800/80 px-5 pb-5 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-extrabold tracking-tight text-white leading-none">Resolvr</p>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 whitespace-nowrap">
              Ticket Management System
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {role === "admin" ? "Administration" : role === "developer" ? "Developer Portal" : "Requestor Portal"}
        </p>
        {roleNavItems[role].map(({ label, to, icon: Icon }) => {
          const cleanCur = location.pathname.replace(/\/+$/, "")
          const cleanTar = to.replace(/\/+$/, "")
          const isRoot = cleanTar === "/" + role
          const isActive = isRoot ? cleanCur === cleanTar : cleanCur === cleanTar || cleanCur.startsWith(cleanTar + "/")
          return (
            <NavLink
              key={to}
              to={to}
              className={"group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all " + (isActive ? "bg-indigo-600 text-white font-semibold shadow-md" : "text-slate-400 hover:bg-slate-800/75 hover:text-slate-100")}
            >
              {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-white" />}
              <Icon className={"h-[18px] w-[18px] " + (isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")} strokeWidth={1.75} />
              <span className="flex-1">{label}</span>
              {label === "Notifications" && unreadCount > 0 && (
                <span className="min-w-5 rounded-full bg-indigo-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>
      <div className="border-t border-slate-800/80 px-3 pb-4 pt-3">
        <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 px-3 py-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="truncate text-xs capitalize text-slate-400">{roleLabel}</p>
          </div>
          <button type="button" onClick={async () => { await supabase.auth.signOut(); navigate("/login", { replace: true }) }} className="text-slate-400 hover:text-rose-400">
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export function AppShell({ children, role, userName }: { children: ReactNode; role: Role; userName?: string }) {
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [latest, setLatest] = useState<any>(null)
  const reload = useCallback(async () => {
    const { data, count } = await supabase.from("notifications").select("id,title,body,ticket_id,created_at", { count: "exact" }).is("read_at", null).order("created_at", { ascending: false }).limit(1)
    setUnreadCount(count ?? 0)
    setLatest((data ?? [])[0] ?? null)
  }, [])
  useEffect(() => { void reload() }, [reload])
  return (
    <div className="flex h-screen w-screen bg-[#f8fafc] text-slate-900 overflow-hidden">
      <Sidebar role={role} userName={userName} unreadCount={unreadCount} />
      <main className="flex-1 overflow-y-auto">
        {latest && (
          <div className="no-print flex items-center gap-3 border-b border-indigo-100 bg-indigo-50 px-8 py-3 text-sm text-indigo-900">
            <Bell className="h-4 w-4 flex-shrink-0 text-indigo-600" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold">{latest.title}</span>
              <span className="ml-2 text-indigo-700">{latest.body}</span>
            </div>
            <button type="button" className="font-semibold text-indigo-600 hover:underline" onClick={() => navigate("/" + role + "/notifications")}>
              View notifications
            </button>
          </div>
        )}
        <div className="w-full px-6 py-6">{children}</div>
      </main>
    </div>
  )
}