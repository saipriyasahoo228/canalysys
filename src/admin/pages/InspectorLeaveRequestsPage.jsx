import { useMemo, useState } from 'react'
import { CheckCircle2, Eye, XCircle } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { mockApi } from '../mock/mockApi'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, PaginatedTable, cx } from '../ui/Ui'
import { ReasonDialog } from '../ui/ReasonDialog'
import { ViewDetailsDialog } from '../ui/ViewDetailsDialog'

function statusTone(s) {
  if (s === 'approved') return 'emerald'
  if (s === 'rejected') return 'rose'
  return 'amber'
}

export function InspectorLeaveRequestsPage() {
  const { actor, permissions } = useRbac()
  const { data, loading, error, refresh } = usePolling('inspector-leave-requests', () => mockApi.getInspectorLeaveRequests(), {
    intervalMs: 15_000,
  })

  const requests = data?.items || []
  const inspectors = data?.inspectors || []

  const inspectorById = useMemo(() => new Map(inspectors.map((i) => [i.id, i])), [inspectors])

  const [dialog, setDialog] = useState(null)

  const viewOpen = dialog?.type === 'view'
  const approveOpen = dialog?.type === 'approve'
  const rejectOpen = dialog?.type === 'reject'

  const rows = requests

  const columns = useMemo(
    () => [
      {
        key: 'inspector',
        header: 'Inspector',
        exportValue: (r) => inspectorById.get(r.inspectorId)?.name || r.inspectorId,
        cell: (r) => (
          <div>
            <div className="text-sm font-semibold">{inspectorById.get(r.inspectorId)?.name || '—'}</div>
            <div className="text-xs text-slate-500">{r.inspectorId}</div>
          </div>
        ),
      },
      {
        key: 'range',
        header: 'Leave dates',
        exportValue: (r) => `${r.fromDate} → ${r.toDate}`,
        cell: (r) => (
          <div className="text-sm text-slate-700">
            {r.fromDate}
            <span className="mx-1 text-slate-400">→</span>
            {r.toDate}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        exportValue: (r) => r.status,
        cell: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
      },
      {
        key: 'requestedAt',
        header: 'Requested at',
        exportValue: (r) => r.requestedAt,
        cell: (r) => <div className="text-xs text-slate-600">{r.requestedAt || '—'}</div>,
      },
      {
        key: 'decision',
        header: 'Decision',
        exportValue: (r) => (r.status === 'rejected' ? r.rejectionReason || '' : ''),
        cell: (r) => {
          if (r.status !== 'rejected') return <div className="text-xs text-slate-500">—</div>
          return <div className="max-w-[260px] whitespace-normal text-xs text-rose-700">{r.rejectionReason || '—'}</div>
        },
      },
      {
        key: 'actions',
        header: <div className="w-full text-right">Actions</div>,
        cell: (r) => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="icon" size="icon" onClick={() => setDialog({ type: 'view', item: r })} title={'View'}>
              <Eye className="h-4 w-4 text-slate-700" />
            </Button>
            <Button
              disabled={!permissions.manageInspectors || r.status !== 'pending'}
              onClick={() => setDialog({ type: 'approve', item: r })}
              title={permissions.manageInspectors ? 'Approve' : 'Insufficient permission'}
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </Button>
            <Button
              disabled={!permissions.manageInspectors || r.status !== 'pending'}
              onClick={() => setDialog({ type: 'reject', item: r })}
              title={permissions.manageInspectors ? 'Reject' : 'Insufficient permission'}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </div>
        ),
        className: 'text-right',
        tdClassName: 'text-right',
      },
    ],
    [inspectorById, permissions.manageInspectors]
  )

  const viewItems = useMemo(() => {
    if (!dialog || dialog.type !== 'view') return []
    const it = dialog.item
    return [
      { key: 'id', label: 'Request ID', value: it?.id || '—' },
      { key: 'inspector', label: 'Inspector', value: inspectorById.get(it?.inspectorId)?.name || it?.inspectorId || '—' },
      { key: 'from', label: 'From date', value: it?.fromDate || '—' },
      { key: 'to', label: 'To date', value: it?.toDate || '—' },
      { key: 'reason', label: 'Reason', value: it?.reason || '—', fullWidth: true },
      { key: 'status', label: 'Status', value: it?.status || '—' },
      { key: 'requestedAt', label: 'Requested at', value: it?.requestedAt || '—' },
      { key: 'decidedAt', label: 'Decided at', value: it?.decidedAt || '—' },
      { key: 'rejectionReason', label: 'Rejection reason', value: it?.rejectionReason || '—', fullWidth: true },
    ]
  }, [dialog, inspectorById])

  return (
    <div className="space-y-3">
      <Card
        title="Inspector Leave Requests"
        subtitle="View and approve/reject leave requests from the mobile app"
        accent="cyan"
        right={
          <Button onClick={async () => refresh()} className="ml-1">
            Refresh
          </Button>
        }
      >
        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Failed to load.</div>
        ) : null}

        <div className={cx(loading && !data ? 'opacity-60' : '')}>
          <PaginatedTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            initialRowsPerPage={10}
            rowsPerPageOptions={[10, 20, 50, 'all']}
            enableSearch
            searchPlaceholder="Search leave requests…"
            enableExport
            exportFilename="inspector-leave-requests.csv"
          />
        </div>
      </Card>

      <ViewDetailsDialog
        open={viewOpen}
        title="View leave request"
        onClose={() => setDialog(null)}
        items={viewItems}
        accent="cyan"
      />

      <ReasonDialog
        open={approveOpen}
        title="Approve leave request"
        description="This will approve the inspector leave request."
        submitLabel="Approve"
        onClose={() => setDialog(null)}
        showReason={false}
        requireReason={false}
        fields={[]}
        onSubmit={async () => {
          try {
            if (!permissions.manageInspectors) throw new Error('Insufficient permission')
            await mockApi.approveInspectorLeaveRequest({ actor, requestId: dialog?.item?.id })
            setDialog(null)
          } catch (e) {
            // eslint-disable-next-line no-alert
            alert(e.message || 'Action failed')
          }
        }}
      />

      <ReasonDialog
        open={rejectOpen}
        title="Reject leave request"
        description="If you reject, you must provide a reason."
        submitLabel="Reject"
        onClose={() => setDialog(null)}
        showReason={true}
        requireReason={true}
        fields={[]}
        onSubmit={async (form) => {
          try {
            if (!permissions.manageInspectors) throw new Error('Insufficient permission')
            await mockApi.rejectInspectorLeaveRequest({
              actor,
              requestId: dialog?.item?.id,
              reason: form.reason,
            })
            setDialog(null)
          } catch (e) {
            // eslint-disable-next-line no-alert
            alert(e.message || 'Action failed')
          }
        }}
      />
    </div>
  )
}
