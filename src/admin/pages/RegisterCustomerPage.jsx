import { useMemo, useState } from 'react'
import { Plus, UserPlus } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { mockApi } from '../mock/mockApi'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, PaginatedTable } from '../ui/Ui'
import { ReasonDialog } from '../ui/ReasonDialog'

export function RegisterCustomerPage() {
  const { actor } = useRbac()

  const { data, loading, error, refresh } = usePolling('customers', () => mockApi.getCustomers(), {
    intervalMs: 15_000,
  })

  const customers = data || []

  const [dialog, setDialog] = useState(null)
  const createOpen = dialog?.type === 'create'

  const columns = useMemo(
    () => [
      {
        key: 'identity',
        header: 'Customer',
        exportValue: (c) => `${c.fullName} (${c.id})`,
        cell: (c) => (
          <div className="max-w-[420px] whitespace-normal">
            <div className="text-sm font-semibold text-slate-900">{c.fullName || '—'}</div>
            <div className="text-xs text-slate-600">{c.id}</div>
          </div>
        ),
      },
      {
        key: 'contact',
        header: 'Contact',
        exportValue: (c) => `${c.email || ''} ${c.mobile || ''}`.trim(),
        cell: (c) => (
          <div className="max-w-[420px] whitespace-normal text-xs text-slate-700">
            <div>{c.email || '—'}</div>
            <div className="text-slate-500">{c.mobile || '—'}</div>
          </div>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        exportValue: () => 'Walk-in',
        cell: () => <Badge tone="slate">Walk-in</Badge>,
      },
    ],
    []
  )

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Failed to load customers.</div>
      ) : null}

      <Card
        title="Register customer"
        subtitle="Create a walk-in customer (demo)"
        accent="amber"
        right={
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={() => setDialog({ type: 'create' })} title={'Register customer'}>
              <UserPlus className="h-4 w-4" />
              Register
            </Button>
            <Button onClick={refresh}>Refresh</Button>
          </div>
        }
      >
        <div className={loading && !data ? 'opacity-60' : ''}>
          <PaginatedTable
            columns={columns}
            rows={customers}
            rowKey={(c) => c.id}
            initialRowsPerPage={10}
            rowsPerPageOptions={[5, 10, 20, 'all']}
            enableSearch
            searchPlaceholder="Search customers…"
            enableExport
            exportFilename="customers.csv"
            getSearchText={(c) => `${c.fullName} ${c.email} ${c.mobile} ${c.id}`}
          />
        </div>
      </Card>

      <ReasonDialog
        open={createOpen}
        title="Register customer"
        description="Customer changes are audited. Reason is mandatory."
        submitLabel="Create"
        onClose={() => setDialog(null)}
        showReason={true}
        requireReason={true}
        fields={[
          { name: 'fullName', label: 'Full name', type: 'text', defaultValue: '' },
          { name: 'email', label: 'Email', type: 'text', defaultValue: '' },
          { name: 'mobileDigits', label: 'Mobile number', type: 'phone_in', defaultValue: '' },
          { name: 'password', label: 'Password', type: 'text', defaultValue: '' },
          { name: 'password2', label: 'Confirm password', type: 'text', defaultValue: '' },
        ]}
        onSubmit={async (form) => {
          try {
            const p1 = String(form.password || '')
            const p2 = String(form.password2 || '')
            if (!p1 || !p2) throw new Error('Password is required')
            if (p1 !== p2) {
              throw new Error('Passwords do not match')
            }

            const digits = String(form.mobileDigits || '').replace(/\D+/g, '')
            if (!/^\d{10}$/.test(digits)) throw new Error('Mobile number must be 10 digits')
            const normalizedMobile = `+91${digits}`

            await mockApi.createCustomer({
              actor,
              customer: {
                fullName: form.fullName,
                email: form.email,
                mobile: normalizedMobile,
                password: p1,
              },
              reason: form.reason,
            })

            setDialog(null)
            await refresh()
          } catch (e) {
            // eslint-disable-next-line no-alert
            alert(e.message || 'Action failed')
          }
        }}
      />
    </div>
  )
}
