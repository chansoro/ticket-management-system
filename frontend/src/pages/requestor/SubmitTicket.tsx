import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/layouts/Sidebar'
import { PageHeader } from '@/layouts/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { PageError, PageLoading } from '@/components/ui/PageState'
import { useAuth } from '@/contexts/AuthContext'
import { useCategories, useDepartments } from '@/hooks/useData'
import { supabase } from '@/lib/supabase'
import type { TicketPriority } from '@/lib/tickets'

export function SubmitTicket() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { categories, loading: cLoading, error: cError } = useCategories()
  const { departments } = useDepartments()
  const [subject, setSubject] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (cLoading) return <AppShell role="requestor"><PageLoading /></AppShell>
  if (cError) return <AppShell role="requestor"><PageError message={cError} /></AppShell>

  const activeCategories = categories.filter((c) => c.is_active)
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]))
  const selectedCategory = activeCategories.find((c) => c.id === categoryId)
  const routedDeptName = selectedCategory ? (deptMap[selectedCategory.department_id] ?? 'Assigned Department Queue') : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    if (!categoryId) { setError('Please select an issue category.'); return }
    setSubmitting(true)
    setError('')

    const { data: newTicket, error: insertError } = await supabase
      .from('tickets')
      .insert({
        requestor_id: profile.id,
        category_id: categoryId,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        status: 'open',
      })
      .select('id')
      .single()

    if (insertError || !newTicket) {
      setError(insertError?.message ?? 'Failed to submit ticket.')
      setSubmitting(false)
      return
    }

    window.dispatchEvent(new Event('notifications-updated'))
    navigate('/requestor/tickets/' + newTicket.id)
  }

  return (
    <AppShell role="requestor">
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Submit a Support Request"
          subtitle="Provide details about your issue and our system will automatically route it to the appropriate specialist department."
        />

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Subject / Summary</label>
            <Input
              required
              placeholder="Brief summary of the issue (e.g., Unable to connect to laboratory VPN)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Issue Category</label>
              <Select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Select category...</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              {routedDeptName && (
                <p className="mt-1.5 text-xs font-medium text-indigo-600">
                  ✓ Auto-routes to: <strong>{routedDeptName}</strong>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Priority Level</label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
                <option value="low">Low — Minor inquiry or non-urgent request</option>
                <option value="medium">Medium — Standard issue affecting work</option>
                <option value="high">High — Urgent issue blocking core tasks</option>
                <option value="critical">Critical — System-wide outage or security incident</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Detailed Description</label>
            <Textarea
              required
              rows={5}
              placeholder="Describe the steps leading to the issue, any error messages shown, and the device or portal affected..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => navigate('/requestor/tickets')}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting Request...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
