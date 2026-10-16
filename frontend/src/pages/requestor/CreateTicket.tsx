import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppShell } from "@/layouts/Sidebar"
import { PageHeader } from "@/layouts/PageHeader"
import { Input, Select, Textarea } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { useCategories, useDepartments } from "@/hooks/useData"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import type { TicketPriorityDb } from "@/lib/tickets"

export function CreateTicket() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { categories, loading, error } = useCategories()
  const { departments } = useDepartments()

  const [subject, setSubject] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [priority, setPriority] = useState<TicketPriorityDb>("medium")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState("")

  if (loading) return <AppShell role="requestor"><PageLoading /></AppShell>
  if (error) return <AppShell role="requestor"><PageError message={error} /></AppShell>

  const selectedCat = categories.find((c) => c.id === categoryId)
  const routedDept = selectedCat ? departments.find((d) => d.id === selectedCat.department_id) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSubmitting(true)
    setErr("")

    const { data: ticketNumData } = await supabase.rpc("generate_ticket_number")
    const generatedNumber = (ticketNumData as string) ?? `${Math.floor(1000 + Math.random() * 9000)}`

    const { data: newTicket, error: insertError } = await supabase
      .from("tickets")
      .insert({
        ticket_number: generatedNumber,
        subject: subject.trim(),
        description: description.trim(),
        category_id: categoryId,
        priority,
        status: "open",
        requestor_id: profile.id,
      })
      .select("id")
      .single()

    if (insertError) {
      setErr(insertError.message)
      setSubmitting(false)
    } else {
      window.dispatchEvent(new Event("notifications-updated"))
      navigate("/requestor/tickets/" + newTicket.id)
    }
  }

  return (
    <AppShell role="requestor">
      <div className="space-y-6">
        <PageHeader
          title="Submit Request"
          subtitle="Tell us what you need help with. Your ticket will be auto-routed to the responsible technical team."
        />

        {err && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{err}</div>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form onSubmit={handleSubmit} className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Subject
              </label>
              <Input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Category
                </label>
                <Select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Select a category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Priority
                </label>
                <Select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriorityDb)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Description
              </label>
              <Textarea
                required
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => navigate("/requestor/tickets")}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !subject || !categoryId || !description}>
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Automatic Routing</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              When you choose a category, your ticket automatically joins the assigned department queue without manual triage delays.
            </p>
            {routedDept ? (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                <p className="text-xs font-bold uppercase text-indigo-700">Target Department</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{routedDept.name}</p>
                <p className="text-xs text-slate-500">{routedDept.email}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                Select a category to preview its routing department.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
