import { useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { mockApi } from '../mock/mockApi'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, Input, PaginatedTable } from '../ui/Ui'
import { ReasonDialog } from '../ui/ReasonDialog'
import { ViewDetailsDialog } from '../ui/ViewDetailsDialog'

export function UserOnboardPage() {
  const { actor } = useRbac()

  const { data, loading, error, refresh } = usePolling('user-onboard', () => mockApi.getAccessControl(), {
    intervalMs: 15_000,
  })

  const users = data?.users || []
  const roles = data?.roles || []

  const roleById = useMemo(() => {
    const m = new Map()
    for (const r of roles) m.set(r.id, r)
    return m
  }, [roles])

  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r.id, label: r.name || r.id })),
    [roles]
  )

  const [dialog, setDialog] = useState(null)

  const viewOpen = dialog?.type === 'view'

  const viewItems = useMemo(() => {
    if (!dialog || dialog.type !== 'view') return []
    const u = dialog.user
    return [
      { key: 'userId', label: 'User ID', value: u?.userId || '—' },
      { key: 'name', label: 'Full name', value: u?.name || '—' },
      { key: 'email', label: 'Email', value: u?.email || '—' },
      { key: 'phone', label: 'Phone', value: u?.phone || '—' },
      { key: 'role', label: 'Role', value: roleById.get(u?.role)?.name || u?.role || '—' },
      { key: 'active', label: 'Active', value: u?.active ? 'Yes' : 'No' },
    ]
  }, [dialog, roleById])

  const columns = useMemo(
    () => [
      {
        key: 'identity',
        header: 'User',
        exportValue: (u) => `${u.name} (${u.userId})`,
        cell: (u) => (
          <div className="max-w-[360px] whitespace-normal">
            <div className="text-sm font-semibold text-slate-900">{u.name}</div>
            <div className="text-xs text-slate-600">{u.userId}</div>
          </div>
        ),
      },
      {
        key: 'contact',
        header: 'Contact',
        exportValue: (u) => `${u.email || ''} ${u.phone || ''}`.trim(),
        cell: (u) => (
          <div className="max-w-[360px] whitespace-normal text-xs text-slate-700">
            <div>{u.email || '—'}</div>
            <div className="text-slate-500">{u.phone || '—'}</div>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        exportValue: (u) => roleById.get(u.role)?.name || u.role,
        cell: (u) => <Badge tone="slate">{roleById.get(u.role)?.name || u.role}</Badge>,
      },
      {
        key: 'active',
        header: 'Active',
        cell: (u) => <Badge tone={u.active ? 'emerald' : 'slate'}>{u.active ? 'Yes' : 'No'}</Badge>,
      },
      {
        key: 'actions',
        header: 'Actions',
        cell: (u) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="icon" size="icon" onClick={() => setDialog({ type: 'view', user: u })} title={'View'}>
              <Eye className="h-4 w-4 text-slate-700" />
            </Button>
            <Button
              variant="icon"
              size="icon"
              onClick={() => setDialog({ type: 'edit', user: u })}
              title={'Edit user'}
            >
              <Pencil className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="icon"
              size="icon"
              disabled={u.userId === 'USR-SA-1'}
              onClick={() => setDialog({ type: 'delete', user: u })}
              title={'Delete user'}
            >
              <Trash2 className="h-4 w-4 text-rose-600" />
            </Button>
          </div>
        ),
        className: 'text-right',
        tdClassName: 'text-right',
      },
    ],
    [roleById]
  )

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Failed to load users.</div>
      ) : null}

      <Card
        title="User onboard"
        subtitle="Create users with login credentials (demo)"
        accent="cyan"
        right={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => setDialog({ type: 'create' })}
              title={'Create user'}
            >
              <Plus className="h-4 w-4" />
              New user
            </Button>
            <Button onClick={refresh}>Refresh</Button>
          </div>
        }
      >
        <div className={loading && !data ? 'opacity-60' : ''}>
          <PaginatedTable
            columns={columns}
            rows={users}
            rowKey={(u) => u.userId}
            initialRowsPerPage={10}
            enableSearch
            searchPlaceholder="Search users…"
            enableExport
            exportFilename="users.csv"
          />
        </div>
      </Card>

      <ViewDetailsDialog open={viewOpen} title="View user" onClose={() => setDialog(null)} items={viewItems} accent="cyan" />

      <ReasonDialog
        open={!!dialog && !viewOpen}
        title={
          dialog?.type === 'create'
              ? 'Create user'
              : dialog?.type === 'edit'
                ? 'Edit user'
                : dialog?.type === 'delete'
                  ? 'Delete user'
                  : ''
        }
        description={'User changes are audited. Reason is mandatory.'}
        submitLabel={dialog?.type === 'delete' ? 'Delete' : dialog?.type === 'create' ? 'Create' : 'Update'}
        onClose={() => setDialog(null)}
        showReason={true}
        requireReason={true}
        fields={(() => {
          if (dialog?.type === 'create') {
            return [
              { name: 'name', label: 'Full name', type: 'text', defaultValue: '' },
              { name: 'email', label: 'Email', type: 'text', defaultValue: '' },
              { name: 'phone', label: 'Phone', type: 'text', defaultValue: '' },
              { name: 'password', label: 'Password', type: 'text', defaultValue: '' },
              { name: 'password2', label: 'Verify password', type: 'text', defaultValue: '' },
            ]
          }

          if (dialog?.type === 'edit') {
            return [
              { name: 'name', label: 'Full name', type: 'text', defaultValue: dialog?.user?.name || '' },
              { name: 'email', label: 'Email', type: 'text', defaultValue: dialog?.user?.email || '' },
              { name: 'phone', label: 'Phone', type: 'text', defaultValue: dialog?.user?.phone || '' },
              { name: 'password', label: 'Password', type: 'text', defaultValue: dialog?.user?.password || '' },
              { name: 'password2', label: 'Verify password', type: 'text', defaultValue: dialog?.user?.password || '' },
            ]
          }

          return []
        })()}
        onSubmit={async (form) => {
          try {
            if (!dialog) return

            if (dialog.type === 'create' || dialog.type === 'edit') {
              if (String(form.password || '') !== String(form.password2 || '')) {
                throw new Error('Passwords do not match')
              }
            }

            if (dialog.type === 'create') {
              const base = String(form.email || form.name || '').trim()
              const slug = base
                ? base
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')
                : ''
              const gen = `USR-${Date.now().toString(36).toUpperCase()}`
              const userId = `USR-${(slug || gen).slice(0, 18).toUpperCase()}`

              await mockApi.createUser({
                actor,
                userId,
                name: form.name,
                email: form.email,
                phone: form.phone,
                password: form.password,
                roleId: mockApi.roles.READ_ONLY,
                active: true,
                reason: form.reason,
              })
            }

            if (dialog.type === 'edit') {
              await mockApi.updateUser({
                actor,
                userId: dialog.user.userId,
                patch: {
                  name: form.name,
                  email: form.email,
                  phone: form.phone,
                  password: form.password,
                },
                reason: form.reason,
              })
            }

            if (dialog.type === 'delete') {
              await mockApi.deleteUser({
                actor,
                userId: dialog.user.userId,
                reason: form.reason,
              })
            }

            setDialog(null)
            refresh()
          } catch (e) {
            // eslint-disable-next-line no-alert
            alert(e.message || 'Action failed')
          }
        }}
      />
    </div>
  )
}
