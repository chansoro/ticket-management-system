import { useState } from "react"
import { AppShell } from "@/layouts/Sidebar"
import { PageHeader } from "@/layouts/PageHeader"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { TicketTable } from "@/components/ui/TicketTable"
import { SearchInput, Select } from "@/components/ui/Input"
import { useTickets, useCategories } from "@/hooks/useData"
import { useAuth } from "@/contexts/AuthContext"

export function MyTickets() {
  const { profile } = useAuth()
  const { tickets, loading, error } = useTickets()
  const { categories } = useCategories()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  if (loading) return <AppShell role="requestor"><PageLoading /></AppShell>
  if (error) return <AppShell role="requestor"><PageError message={error} /></AppShell>

  const myTickets = tickets.filter((t) => t.requestor_id === profile?.id)

  const filtered = myTickets.filter((t) => {
    const term = search.toLowerCase()
    const matchesSearch = t.ticket_number.toLowerCase().includes(term) || t.subject.toLowerCase().includes(term)
    const matchesStatus = statusFilter === "all" || t.statusDb === statusFilter
    const matchesCategory = categoryFilter === "all" || t.category_id === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <AppShell role="requestor">
      <div className="space-y-6">
        <PageHeader
          title="My Requests"
          subtitle="View and track your submitted support requests."
        />

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets by subject or #..."
            className="flex-1"
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

        <TicketTable tickets={filtered} detailRoute={(ticketId) => "/requestor/tickets/" + ticketId} />
      </div>
    </AppShell>
  )
}
