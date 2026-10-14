import { useEffect, useState } from "react"
import { AppShell } from "@/layouts/Sidebar"
import { PageHeader } from "@/layouts/PageHeader"
import { Input, Label, SearchInput, Select } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { RoleBadge } from "@/components/ui/Badge"
import { PageError, PageLoading } from "@/components/ui/PageState"
import { useDepartments, useProfiles } from "@/hooks/useData"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { formatDate, type Department, type Profile, type UserRole } from "@/lib/tickets"

interface PendingChange {
  id: string
  fullName: string
  oldRole: UserRole
  newRole: UserRole
  oldDeptId: string | null
  newDeptId: string | null
  isActive: boolean
}

export function AdminUsers() {
  const { profiles, loading, error, reload } = useProfiles()
  const { departments } = useDepartments()
  const { profile: adminProfile } = useAuth()
  const [search, setSearch] = useState("")
  const [message, setMessage] = useState("")

  // Multi-Auth Verification Modal State
  const [pending, setPending] = useState<PendingChange | null>(null)
  const [adminPassword, setAdminPassword] = useState("")
  const [reason, setReason] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState("")

  function requestUpdate(change: PendingChange) {
    setMessage("")
    if (change.newRole === "developer" && !change.newDeptId) {
      setMessage("Choose a department before granting the developer role.")
      return
    }
    setAdminPassword("")
    setReason("")
    setVerifyError("")
    setPending(change)
  }

  async function confirmVerifiedUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!pending || !adminProfile?.email) return

    setVerifying(true)
    setVerifyError("")

    // Step 1: Multi-Auth Verification (Re-authenticate current Admin via password)
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: adminProfile.email,
      password: adminPassword,
    })

    if (authErr) {
      setVerifyError("Verification failed: Incorrect Admin password.")
      setVerifying(false)
      return
    }

    // Step 2: Execute atomic user access update
    const { error: updateError } = await supabase.rpc("admin_update_user_access", {
      target_user_id: pending.id,
      target_role: pending.newRole,
      target_department_id: pending.newRole === "developer" ? pending.newDeptId : null,
      target_is_active: pending.isActive,
      target_category_ids: [],
    })

    if (updateError) {
      setVerifyError(updateError.message)
      setVerifying(false)
      return
    }

    // Step 3: Record verification audit log (ignores error if migration 0009 isn't applied yet)
    await supabase.from("role_change_logs").insert({
      target_user_id: pending.id,
      changed_by: adminProfile.id,
      old_role: pending.oldRole,
      new_role: pending.newRole,
      old_department_id: pending.oldDeptId,
      new_department_id: pending.newRole === "developer" ? pending.newDeptId : null,
      reason: reason.trim() || "Role/access update verified by administrator",
      verified_method: "password_reauth",
    })

    setVerifying(false)
    setPending(null)
    await reload()
    setMessage(`Verified and updated access for \${pending.fullName}.`)
  }

  if (loading) return <AppShell role="admin"><PageLoading /></AppShell>
  if (error) return <AppShell role="admin"><PageError message={error} /></AppShell>

  const rows = profiles.filter((profile) =>
    profile.full_name.toLowerCase().includes(search.toLowerCase())
    || profile.email.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <AppShell role="admin">
      <div className="max-w-7xl px-8 py-8">
        <PageHeader title="Users" subtitle="Manage help desk users and developer departments (with Admin verification)." />
        <SearchInput
          className="mb-5"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search users..."
        />
        {message && (
          <p className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">{message}</p>
        )}
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full min-w-[850px]">
            <thead>
              <tr>
                {["User", "Role", "Department", "Status", "Joined", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs uppercase text-[#aeaeb2]">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((profile) => (
                <UserRow
                  key={profile.id}
                  profile={profile}
                  departments={departments}
                  onRequestSave={requestUpdate}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={confirmVerifiedUpdate} className="w-full max-w-md rounded-2xl border border-[#e5e5ea] bg-white p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-[#1d1d1f]">Admin Verification Required</h3>
              <p className="mt-1 text-xs text-[#6e6e73]">
                You are modifying role/department permissions for <strong>{pending.fullName}</strong> (
                <span className="uppercase">{pending.oldRole}</span> → <span className="uppercase text-[#0071e3] font-semibold">{pending.newRole}</span>).
                Please re-enter your Admin password to authorize this change.
              </p>
            </div>

            {verifyError && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{verifyError}</p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="change-reason">Reason / Verification Note</Label>
              <Input
                id="change-reason"
                placeholder="e.g., Assigned as Developer for Midterm release"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-pass">Confirm Admin Password ({adminProfile?.email})</Label>
              <Input
                id="admin-pass"
                type="password"
                placeholder="Enter your password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setPending(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={verifying}>
                {verifying ? "Verifying…" : "Verify & Save"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  )
}

function UserRow({
  profile,
  departments,
  onRequestSave,
}: {
  profile: Profile
  departments: Department[]
  onRequestSave: (change: PendingChange) => void
}) {
  const [role, setRole] = useState<UserRole>(profile.role)
  const [departmentId, setDepartmentId] = useState(profile.department_id ?? "")
  const [active, setActive] = useState(profile.is_active)
  const isAdmin = profile.role === "admin"

  useEffect(() => {
    setRole(profile.role)
    setDepartmentId(profile.department_id ?? "")
    setActive(profile.is_active)
  }, [profile.role, profile.department_id, profile.is_active])

  function changeRole(next: UserRole) {
    setRole(next)
    if (next === "user") setDepartmentId("")
  }

  return (
    <tr className="border-t align-top">
      <td className="px-4 py-3">
        <p className="text-sm font-medium">{profile.full_name}</p>
        <p className="text-xs text-[#6e6e73]">{profile.email}</p>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={profile.role[0].toUpperCase() + profile.role.slice(1)} />
        {!isAdmin && (
          <Select className="mt-2" value={role} onChange={(event) => changeRole(event.target.value as UserRole)}>
            <option value="user">User</option>
            <option value="developer">Developer</option>
          </Select>
        )}
      </td>
      <td className="px-4 py-3">
        <Select
          disabled={isAdmin || role !== "developer"}
          value={departmentId}
          onChange={(event) => setDepartmentId(event.target.value)}
        >
          <option value="">No department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
        </Select>
        {role === "developer" && departmentId && (
          <p className="mt-1 max-w-64 text-[11px] text-[#6e6e73]">
            This developer can be assigned to all ticket categories under this department.
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        {isAdmin ? (
          <span className="text-sm">Active</span>
        ) : (
          <Select value={active ? "active" : "inactive"} onChange={(event) => setActive(event.target.value === "active")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        )}
      </td>
      <td className="px-4 py-3 text-sm">{formatDate(profile.created_at)}</td>
      <td className="px-4 py-3">
        {!isAdmin && (
          <Button
            size="sm"
            onClick={() =>
              onRequestSave({
                id: profile.id,
                fullName: profile.full_name,
                oldRole: profile.role,
                newRole: role,
                oldDeptId: profile.department_id,
                newDeptId: role === "developer" ? departmentId || null : null,
                isActive: active,
              })
            }
          >
            Save
          </Button>
        )}
      </td>
    </tr>
  )
}