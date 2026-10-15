import { useNavigate } from "react-router-dom"
import type { Ticket } from "@/lib/tickets"
import { StatusBadge, PriorityBadge, CategoryBadge } from "./Badge"
import { ListTodo } from "lucide-react"

interface Column { key: keyof Ticket; label: string; width?: string; render?: (ticket: Ticket) => React.ReactNode }
interface TicketTableProps { tickets: Ticket[]; columns?: Column[]; detailRoute?: (id: string) => string }

const defaultColumns: Column[] = [
  {
    key: "ticket_number",
    label: "Ticket ID",
    width: "w-32 whitespace-nowrap",
    render: (t) => <span className="font-mono text-xs font-bold text-indigo-600 whitespace-nowrap">#{t.ticket_number}</span>,
  },
  {
    key: "subject",
    label: "Subject",
    render: (t) => (
      <div className="min-w-0 pr-3">
        <p className="font-semibold text-slate-900 text-sm truncate">{t.subject}</p>
        <p className="text-xs text-slate-500 truncate">{t.description}</p>
      </div>
    ),
  },
  {
    key: "category",
    label: "Category",
    width: "w-64 whitespace-nowrap",
    render: (t) => <CategoryBadge category={t.category} />,
  },
  {
    key: "priority",
    label: "Priority",
    width: "w-28 whitespace-nowrap",
    render: (t) => <PriorityBadge priority={t.priority} />,
  },
  {
    key: "status",
    label: "Status",
    width: "w-28 whitespace-nowrap",
    render: (t) => <StatusBadge status={t.status} />,
  },
  {
    key: "updated",
    label: "Updated",
    width: "w-32 whitespace-nowrap",
    render: (t) => <span className="text-xs text-slate-500 whitespace-nowrap">{t.updated}</span>,
  },
]

export function TicketTable({ tickets, columns = defaultColumns, detailRoute }: TicketTableProps) {
  const navigate = useNavigate()
  return (
    <div className="w-full rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/80">
            {columns.map((col) => (
              <th key={String(col.key)} className={"px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 " + (col.width ?? "")}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tickets.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-14 text-center">
                <div className="flex flex-col items-center gap-2">
                  <ListTodo className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-slate-400">No tickets found</p>
                </div>
              </td>
            </tr>
          ) : (
            tickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => detailRoute && navigate(detailRoute(ticket.id))}
                className={"transition-colors " + (detailRoute ? "cursor-pointer hover:bg-slate-50/80" : "")}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className={"px-4 py-3.5 truncate " + (col.width ?? "")}>
                    {col.render ? col.render(ticket) : String(ticket[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}