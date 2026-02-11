import { useMemo } from 'react'
import { Filter, Shield } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { mockApi } from '../mock/mockApi'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Card, PaginatedTable } from '../ui/Ui'

function actionTone(action) {
  if (action === 'override_price') return 'amber'
  if (action === 'record_payment') return 'emerald'
  if (action === 'override_commission') return 'violet'
  if (action === 'approve_commission') return 'emerald'
  if (action === 'set_priority') return 'cyan'
  if (action === 'manual_assign' || action === 'manual_unassign') return 'emerald'
  if (action === 'auto_assign') return 'cyan'
  if (action === 'set_status') return 'amber'
  if (action === 'create_inspector' || action === 'update_inspector') return 'violet'
  return 'slate'
}

export function AuditLogsPage() {
  const { locationId } = useRbac()

  const { data, loading, error } = usePolling(
    ['audit', locationId].join(':'),
    () => mockApi.getAudit({ locationId: locationId || undefined }),
    { intervalMs: 12_000 }
  )

  const items = data?.items || []

  const columns = useMemo(
    () => [
      {
        key: 'at',
        header: 'When',
        exportValue: (r) => new Date(r.at).toISOString(),
        cell: (r) => new Date(r.at).toLocaleString(),
      },
      {
        key: 'actor',
        header: 'Actor',
        exportValue: (r) => `${r.actor?.name || ''} (${r.actor?.role || ''})`.trim(),
        cell: (r) => (
          <div>
            <div className="text-xs font-semibold">{r.actor?.name}</div>
            <div className="text-[11px] text-slate-500">{r.actor?.role}</div>
          </div>
        ),
      },
      {
        key: 'entity',
        header: 'Entity',
        exportValue: (r) => `${r.entity?.type || ''}:${r.entity?.id || ''}`,
        cell: (r) => (
          <div>
            <div className="text-xs font-semibold">{r.entity?.type}</div>
            <div className="text-[11px] text-slate-500">{r.entity?.id}</div>
          </div>
        ),
      },
      {
        key: 'action',
        header: 'Action',
        cell: (r) => <Badge tone={actionTone(r.action)}>{r.action}</Badge>,
      },
      {
        key: 'diff',
        header: 'Change',
        exportValue: (r) => {
          try {
            return JSON.stringify(r.diff || {})
          } catch {
            return ''
          }
        },
        cell: (r) => (
          <div className="max-w-[420px] whitespace-normal text-[11px] text-slate-600">
            {Object.entries(r.diff || {}).map(([k, v]) => (
              <div key={k}>
                <span className="text-slate-500">{k}</span>: {String(v?.from)} →{' '}
                <span className="font-semibold text-slate-900">{String(v?.to)}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        key: 'reason',
        header: 'Reason',
        cell: (r) => <div className="max-w-[320px] whitespace-normal text-xs text-slate-700">{r.reason}</div>,
      },
    ],
    []
  )

  return (
    <div className="space-y-3">
      <Card
        title="Audit logs"
        subtitle="All manual overrides are recorded"
        right={
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="h-4 w-4" />
            Immutable (demo)
          </div>
        }
      >
        <div className="flex items-center justify-between gap-2 pb-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter by location using the topbar.
          </div>
          <div>{loading && !data ? 'Loading…' : `${items.length} events`}</div>
        </div>

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            Failed to load audit logs.
          </div>
        ) : null}

        <PaginatedTable
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          initialRowsPerPage={10}
          enableSearch
          searchPlaceholder="Search audit logs…"
          enableExport
          exportFilename="audit-logs.csv"
        />
      </Card>
    </div>
  )
}
