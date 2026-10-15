import { useState } from "react"
import { AppShell } from "@/layouts/Sidebar"
import { PageHeader } from "@/layouts/PageHeader"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { TicketTable } from "@/components/ui/TicketTable"
import { SearchInput } from "@/components/ui/Input"
import { useTickets } from "@/hooks/useData"
import { useAuth } from "@/contexts/AuthContext"

export function DeveloperResolved() {
  const { profile } = useAuth()
  const { tickets, loading, error } = useTickets()
  const [search, setSearch] = useState("")

  if (loading) return <AppShell role="developer"><PageLoading /></AppShell>
  if (error) return <AppShell role="developer"><PageError message={error} /></AppShell>

  const resolved = tickets.filter(
    (t) => t.assigned_to === profile?.id && t.statusDb === "resolved"
  )

  const filtered = resolved.filter((t) => {
    const term = search.toLowerCase()
    return t.ticket_number.toLowerCase().includes(term) || t.subject.toLowerCase().includes(term)
  })

  return (
    <AppShell role="developer">
      <div className="space-y-6">
        <PageHeader
          title="Resolved Tickets"
          subtitle="View support requests you have successfully completed with resolution notes."
        />

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search completed tickets by subject or #..."
            className="w-full"
          />
        </div>

        <TicketTable tickets={filtered} detailRoute={(id) => `/developer/tickets/\${id}`} />
      </div>
    </AppShell>
  )
}
