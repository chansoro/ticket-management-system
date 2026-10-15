import { useState } from "react"
import { AppShell } from "@/layouts/Sidebar"
import { PageHeader } from "@/layouts/PageHeader"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { TicketTable } from "@/components/ui/TicketTable"
import { SearchInput, Select } from "@/components/ui/Input"
import { useTickets, useCategories } from "@/hooks/useData"
import { useAuth } from "@/contexts/AuthContext"

export function DeveloperMyTickets() {
  const { profile } = useAuth()
  const { tickets, loading, error } = useTickets()
  const { categories } = useCategories()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  if (loading) return <AppShell role="developer"><PageLoading /></AppShell>
  if (error) return <AppShell role="developer"><PageError message={error} /></AppShell>

  const assigned = tickets.filter((t) => t.assigned_to === profile?.id)

  const filtered = assigned.filter((t) => {
    const term = search.toLowerCase()
    const matchesSearch = t.ticket_number.toLowerCase().includes(term) || t.subject.toLowerCase().includes(term)
    const matchesStatus = statusFilter === "all" || t.statusDb === statusFilter
    const matchesCategory = categoryFilter === "all" || t.category_id === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <AppShell role="developer">
      <div className="space-y-6">
        <PageHeader
          title="My Tickets"
          subtitle="Support requests currently assigned to your workbench."
        />

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assigned tickets by subject or #..."
            className="flex-1 min-w-[260px]"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">Assigned</option>
            <option value="resolved">Resolved</option>
          </Select>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-56"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>

        <TicketTable tickets={filtered} detailRoute={(id) => `/developer/tickets/\${id}`} />
      </div>
    </AppShell>
  )
}
