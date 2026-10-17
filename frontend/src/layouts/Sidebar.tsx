import { SidebarThemeToggle } from '@/components/ui/SidebarThemeToggle'
﻿import React, { useState, useEffect } from "react"
import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { 
  LayoutDashboard, 
  Ticket, 
  BarChart3, 
  Users, 
  FolderKanban, 
  Tag, 
  Bell, 
  LogOut,
  ShieldAlert
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface SidebarProps {
  role: "admin" | "developer" | "user"
}

export function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [userName, setUserName] = useState("User")
  const [userEmail, setUserEmail] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || "")
        setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "User")
      }
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  const adminNav = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Tickets", href: "/admin/tickets", icon: Ticket },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
    { name: "Developers", href: "/admin/developers", icon: FolderKanban },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Categories", href: "/admin/categories", icon: Tag },
    { name: "Notifications", href: "/admin/notifications", icon: Bell, badge: unreadCount },
  ]

  const devNav = [
    { name: "Dashboard", href: "/developer/dashboard", icon: LayoutDashboard },
    { name: "My Tickets", href: "/developer/tickets", icon: Ticket },
    { name: "Resolved", href: "/developer/resolved", icon: FolderKanban },
    { name: "Notifications", href: "/developer/notifications", icon: Bell, badge: unreadCount },
  ]

  const userNav = [
    { name: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
    { name: "Submit Request", href: "/user/create", icon: Ticket },
    { name: "My Tickets", href: "/user/tickets", icon: FolderKanban },
    { name: "Notifications", href: "/user/notifications", icon: Bell, badge: unreadCount },
  ]

  const navItems = role === "admin" ? adminNav : role === "developer" ? devNav : userNav

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 select-none border-r border-slate-800">
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-md">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-white font-black text-base tracking-tight leading-none">Resolvr</h1>
          <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 mt-1">TICKET MANAGEMENT SYSTEM</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition \${
                isActive ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge ? (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          )
        })}
      </nav>

      {/* Profile & Logout Section */}
      <div className="p-3 border-t border-slate-800">
        <SidebarThemeToggle />
        <div className="flex items-center justify-between rounded-2xl bg-slate-950/40 p-3 border border-slate-800/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{userName}</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">{role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

interface AppShellProps {
  children: React.ReactNode
  role: "admin" | "developer" | "user"
}

export function AppShell({ children, role }: AppShellProps) {
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("resolvr_theme") === "dark";
    }
    return false;
  });

  React.useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("resolvr_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("resolvr_theme", "light");
    }
  }, [isDark]);

  const toggleAppTheme = () => setIsDark((prev) => !prev);
    
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar role={role} />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative">
        <div className="no-print flex items-center justify-end gap-2.5 mb-4">
          <button
            type="button"
            onClick={() => {
              const asideEl = document.querySelector("aside");
              if (asideEl) {
                asideEl.classList.toggle("mobile-aside-open");
              }
              setMobileMenuOpen((v) => !v);
            }}
            className="lg:hidden mr-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
          >
            <span>{mobileMenuOpen ? "✕ Close Menu" : "☰ Menu"}</span>
          </button>
          <button
            type="button"
            onClick={toggleAppTheme}
            style={{
              backgroundColor: isDark ? "#0f172a" : "#ffffff",
              borderColor: isDark ? "#334155" : "#cbd5e1",
              color: isDark ? "#fbbf24" : "#334155"
            }}
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold shadow-xs transition hover:opacity-90 cursor-pointer"
          >
            <span>{isDark ? "☀ Light Mode" : "🌙 Dark Mode"}</span>
          </button>
        </div>
        
        {children}
      </main>
    </div>
  )
}




