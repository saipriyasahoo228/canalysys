import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Eye, Gauge, MapPin, MoreVertical, Plus, User, UserCheck, UserX, XCircle } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { mockApi } from '../mock/mockApi'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, PaginatedTable, cx } from '../ui/Ui'
import { ReasonDialog } from '../ui/ReasonDialog'
import { ViewDetailsDialog } from '../ui/ViewDetailsDialog'
import { InspectorProfileDialog } from '../ui/InspectorProfileDialog'
import { formatDate, formatDateTime, formatMinutes, minutesSince } from '../utils/format'

function leaveStatusTone(s) {
  if (s === 'approved') return 'emerald'
  if (s === 'rejected') return 'rose'
  return 'amber'
}

function statusLabel(v) {
  if (v === 'active') return 'Active'
  if (v === 'inactive') return 'Inactive'
  if (v === 'suspended') return 'Suspended'
  return '—'
}

export function InspectorsPage() {
  const { locationId, permissions, actor } = useRbac()

  useEffect(() => {
    document.title = 'Inspector Onboarding · PDI Admin'
  }, [])

  const { data, loading, error } = usePolling(
    ['inspectors', locationId].join(':'),
    () => mockApi.getInspectors({ locationId: locationId || undefined }),
    { intervalMs: 10_000 }
  )

  const { data: leaveData, loading: leaveLoading, error: leaveError, refresh: refreshLeave } = usePolling(
    'inspector-leave-requests',
    () => mockApi.getInspectorLeaveRequests(),
    { intervalMs: 15_000 }
  )

  const inspectors = data?.items || []
  const locations = data?.locations || []

  const leaveRequests = leaveData?.items || []

  const locationById = useMemo(() => {
    const m = new Map()
    for (const l of locations) m.set(l.id, l)
    return m
  }, [locations])

  const active = inspectors.filter((i) => i.active)
  const idle = active.filter((i) => i.state === 'idle')
  const avgUtil = active.length
    ? Math.round(active.reduce((acc, i) => acc + (i.utilizationPct || 0), 0) / active.length)
    : 0

  const [dialog, setDialog] = useState(null)
  const [leaveDialog, setLeaveDialog] = useState(null)
  const [actionsMenu, setActionsMenu] = useState(null)
  const actionsBoxRef = useRef(null)
  const actionsMenuRef = useRef(null)

  const profileOpen = dialog?.type === 'profile'
  const createOpen = dialog?.type === 'create'
  const toggleActiveOpen = dialog?.type === 'toggleActive'

  const leaveViewOpen = leaveDialog?.type === 'view'
  const leaveApproveOpen = leaveDialog?.type === 'approve'
  const leaveRejectOpen = leaveDialog?.type === 'reject'

  useEffect(() => {
    const onDown = (e) => {
      if (!actionsBoxRef.current) return
      if (!actionsBoxRef.current.contains(e.target)) setActionsMenu(null)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => {
    const onScroll = () => setActionsMenu(null)
    const onResize = () => setActionsMenu(null)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useEffect(() => {
    if (dialog) setActionsMenu(null)
  }, [dialog])

  useLayoutEffect(() => {
    if (!actionsMenu) return
    if (!actionsMenuRef.current) return

    const menuRect = actionsMenuRef.current.getBoundingClientRect()
    const gap = 8
    const padding = 8

    const nextTop = actionsMenu.shouldOpenUp
      ? Math.max(padding, actionsMenu.anchorTop - menuRect.height - gap)
      : actionsMenu.anchorBottom + gap

    if (Math.abs((actionsMenu.top || 0) - nextTop) < 1) return
    setActionsMenu((s) => (s ? { ...s, top: nextTop } : s))
  }, [actionsMenu])

  const inspectorById = useMemo(() => new Map(inspectors.map((i) => [i.id, i])), [inspectors])

  const leaveColumns = useMemo(
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
        key: 'dates',
        header: 'Leave dates',
        exportValue: (r) => `${r.fromDate} -> ${r.toDate}`,
        cell: (r) => (
          <div className="text-sm text-slate-700">
            {formatDate(r.fromDate)}
            <span className="mx-1 text-slate-400">→</span>
            {formatDate(r.toDate)}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        exportValue: (r) => r.status,
        cell: (r) => <Badge tone={leaveStatusTone(r.status)}>{r.status}</Badge>,
      },
      {
        key: 'requestedAt',
        header: 'Requested at',
        exportValue: (r) => r.requestedAt,
        cell: (r) => <div className="text-xs text-slate-600">{formatDateTime(r.requestedAt)}</div>,
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
            <Button variant="icon" size="icon" onClick={() => setLeaveDialog({ type: 'view', item: r })} title={'View'}>
              <Eye className="h-4 w-4 text-slate-700" />
            </Button>
            <Button
              disabled={!permissions.manageInspectors || r.status !== 'pending'}
              onClick={() => setLeaveDialog({ type: 'approve', item: r })}
              title={permissions.manageInspectors ? 'Approve' : 'Insufficient permission'}
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </Button>
            <Button
              disabled={!permissions.manageInspectors || r.status !== 'pending'}
              onClick={() => setLeaveDialog({ type: 'reject', item: r })}
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

  const leaveViewItems = useMemo(() => {
    if (!leaveDialog || leaveDialog.type !== 'view') return []
    const it = leaveDialog.item
    return [
      { key: 'id', label: 'Request ID', value: it?.id || '—' },
      { key: 'inspector', label: 'Inspector', value: inspectorById.get(it?.inspectorId)?.name || it?.inspectorId || '—' },
      { key: 'from', label: 'From date', value: formatDate(it?.fromDate) },
      { key: 'to', label: 'To date', value: formatDate(it?.toDate) },
      { key: 'reason', label: 'Reason', value: it?.reason || '—', fullWidth: true },
      { key: 'status', label: 'Status', value: it?.status || '—' },
      { key: 'requestedAt', label: 'Requested at', value: formatDateTime(it?.requestedAt) },
      { key: 'decidedAt', label: 'Decided at', value: formatDateTime(it?.decidedAt) },
      { key: 'rejectionReason', label: 'Rejection reason', value: it?.rejectionReason || '—', fullWidth: true },
    ]
  }, [inspectorById, leaveDialog])

  const columns = useMemo(
    () => [
      {
        key: 'identity',
        header: 'Inspector',
        exportValue: (r) => `${r.name} (${r.id})`,
        cell: (r) => (
          <div>
            <div className="text-sm font-semibold">{r.name}</div>
            <div className="text-xs text-slate-500">{r.id}</div>
          </div>
        ),
      },
      {
        key: 'joinDate',
        header: 'Date of joining',
        exportValue: (r) => r.joinDate,
        cell: (r) => <div className="text-xs text-slate-600">{formatDate(r.joinDate)}</div>,
      },
      {
        key: 'state',
        header: 'State',
        cell: (r) => (
          <Badge tone={r.state === 'busy' ? 'emerald' : r.state === 'idle' ? 'amber' : 'slate'}>
            {r.state}
          </Badge>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        exportValue: (r) => statusLabel(r.status),
        cell: (r) => (
          <Badge tone={r.status === 'active' ? 'emerald' : r.status === 'suspended' ? 'rose' : 'slate'}>
            {statusLabel(r.status)}
          </Badge>
        ),
      },
      {
        key: 'util',
        header: 'Utilization',
        cell: (r) => `${r.utilizationPct}%`,
      },
      {
        key: 'idle',
        header: 'Idle for',
        cell: (r) => {
          if (r.state !== 'idle') return '—'
          return formatMinutes(minutesSince(r.lastStateChangeAt))
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        cell: (r, rowIndex, visibleRows) => (
          <div className="flex items-center justify-end">
            <Button
              variant="icon"
              size="icon"
              title="Actions"
              onClick={(e) => {
                const el = e.currentTarget
                const rect = el.getBoundingClientRect()

                const menuW = 240
                const gap = 8
                const totalVisible = Array.isArray(visibleRows) ? visibleRows.length : 0
                const shouldOpenUp = totalVisible > 0 ? rowIndex >= totalVisible - 2 : false

                const left = Math.min(
                  Math.max(8, rect.right - menuW),
                  Math.max(8, window.innerWidth - menuW - 8)
                )
                const top = rect.bottom + gap

                setActionsMenu((s) => {
                  if (s?.row?.id === r.id) return null
                  return {
                    row: r,
                    left,
                    top,
                    anchorTop: rect.top,
                    anchorBottom: rect.bottom,
                    shouldOpenUp,
                  }
                })
              }}
            >
              <MoreVertical className="h-4 w-4 text-slate-700" />
            </Button>
          </div>
        ),
        className: 'text-right',
        tdClassName: 'text-right',
      },
    ],
    [permissions.manageInspectors]
  )

  return (
    <div className="space-y-3" ref={actionsBoxRef}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card accent="emerald" className="p-0" kpi>
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-700" />
              <div className="text-xs text-slate-600">Active</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{loading && !data ? '—' : active.length}</div>
            <div className="mt-1 text-xs text-slate-500">Currently enabled</div>
          </div>
        </Card>
        <Card accent={idle.length >= 2 ? 'amber' : 'slate'} className="p-0" kpi>
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <UserX className={cx('h-4 w-4', idle.length >= 2 ? 'text-amber-700' : 'text-slate-700')} />
              <div className="text-xs text-slate-600">Idle</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{loading && !data ? '—' : idle.length}</div>
            <div className="mt-1 text-xs text-slate-500">Potentially re-allocatable</div>
          </div>
        </Card>
        <Card accent={avgUtil >= 85 ? 'amber' : 'cyan'} className="p-0" kpi>
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <Gauge className={cx('h-4 w-4', avgUtil >= 85 ? 'text-amber-700' : 'text-cyan-700')} />
              <div className="text-xs text-slate-600">Avg utilization</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{loading && !data ? '—' : `${avgUtil}%`}</div>
            <div className="mt-1 text-xs text-slate-500">Workload</div>
          </div>
        </Card>
        <Card accent="violet" className="p-0" kpi>
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-violet-700" />
              <div className="text-xs text-slate-600">Coverage</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">
              {loading && !data ? '—' : `${new Set(active.flatMap((i) => i.locationIds)).size}`}
            </div>
            <div className="mt-1 text-xs text-slate-500">Locations staffed</div>
          </div>
        </Card>
      </div>

      <Card
        title="Leave requests"
        subtitle="Requested from the mobile app · Approve or reject (rejection requires reason)"
        accent="cyan"
        right={
          <Button onClick={async () => refreshLeave()} className="ml-1">
            Refresh
          </Button>
        }
      >
        {leaveError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Failed to load leave requests.</div>
        ) : null}

        <div className={leaveLoading && !leaveData ? 'opacity-60' : ''}>
          <PaginatedTable
            columns={leaveColumns}
            rows={leaveRequests}
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

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          Failed to load inspectors.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card
          title="Inspector roster"
          subtitle="Profiles + utilization + idle monitoring"
          className="lg:col-span-2"
          right={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <User className="h-4 w-4" />
                Demo
              </div>
              <Button
                variant="primary"
                size="sm"
                disabled={!permissions.manageInspectors}
                onClick={() => {
                  if (!permissions.manageInspectors) return
                  const id = mockApi.generateInspectorId()
                  setDialog({ type: 'create', inspectorId: id })
                }}
              >
                <Plus className="h-4 w-4" />
                Add inspector
              </Button>
            </div>
          }
        >
          <div className={loading && !data ? 'opacity-60' : ''}>
            <PaginatedTable
              columns={columns}
              rows={inspectors}
              rowKey={(r) => r.id}
              initialRowsPerPage={10}
              enableSearch
              searchPlaceholder="Search inspectors…"
              enableExport
              exportFilename="inspectors.csv"
            />
          </div>
        </Card>

        <Card title="Idle watch" subtitle="Investigate idle time">
          <div className="space-y-2">
            {idle.length === 0 ? <div className="text-sm text-slate-500">No idle inspectors.</div> : null}
            {idle.slice(0, 8).map((i) => (
              <div key={i.id} className="rounded-md border border-slate-200 bg-white p-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 truncate text-sm font-semibold">{i.name}</div>
                  <Badge tone="amber">Idle {formatMinutes(minutesSince(i.lastStateChangeAt))}</Badge>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="h-4 w-4" />
                  {i.locationIds.map((id) => locationById.get(id)?.name || id).join(', ')}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <Gauge className="h-4 w-4" />
                  Utilization {i.utilizationPct}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <ViewDetailsDialog
        open={leaveViewOpen}
        title="View leave request"
        onClose={() => setLeaveDialog(null)}
        items={leaveViewItems}
        accent="cyan"
      />

      <ReasonDialog
        open={leaveApproveOpen}
        title="Approve leave request"
        description="This will approve the inspector leave request."
        submitLabel="Approve"
        onClose={() => setLeaveDialog(null)}
        showReason={false}
        requireReason={false}
        fields={[]}
        onSubmit={async () => {
          try {
            if (!permissions.manageInspectors) throw new Error('Insufficient permission')
            await mockApi.approveInspectorLeaveRequest({ actor, requestId: leaveDialog?.item?.id })
            setLeaveDialog(null)
          } catch (e) {
            // eslint-disable-next-line no-alert
            alert(e.message || 'Action failed')
          }
        }}
      />

      <ReasonDialog
        open={leaveRejectOpen}
        title="Reject leave request"
        description="This reason will be shown to the inspector in the mobile app."
        submitLabel="Reject"
        onClose={() => setLeaveDialog(null)}
        showReason={true}
        requireReason={true}
        reasonLabel="Rejection reason (shown to inspector)"
        reasonPlaceholder="Eg: Leave not possible due to high workload"
        fields={[]}
        onSubmit={async (form) => {
          try {
            if (!permissions.manageInspectors) throw new Error('Insufficient permission')
            await mockApi.rejectInspectorLeaveRequest({ actor, requestId: leaveDialog?.item?.id, reason: form.reason })
            setLeaveDialog(null)
          } catch (e) {
            // eslint-disable-next-line no-alert
            alert(e.message || 'Action failed')
          }
        }}
      />

      {actionsMenu ? (
        <div
          ref={actionsMenuRef}
          className="fixed z-50 min-w-[240px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          style={{ left: actionsMenu.left, top: actionsMenu.top }}
        >
          <button
            type="button"
            disabled={!permissions.manageInspectors}
            className={cx(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100',
              permissions.manageInspectors ? 'text-slate-900' : 'text-slate-400'
            )}
            onClick={() => {
              if (!permissions.manageInspectors) return
              setDialog({ type: 'profile', item: actionsMenu.row })
              setActionsMenu(null)
            }}
          >
            <User className="h-4 w-4" />
            Manage Profile
          </button>

          <button
            type="button"
            disabled={!permissions.manageInspectors}
            className={cx(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100',
              permissions.manageInspectors ? 'text-slate-900' : 'text-slate-400'
            )}
            onClick={() => {
              if (!permissions.manageInspectors) return
              setDialog({ type: 'toggleActive', item: actionsMenu.row })
              setActionsMenu(null)
            }}
          >
            {actionsMenu.row.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            {actionsMenu.row.active ? 'Deactivate account' : 'Activate account'}
          </button>
        </div>
      ) : null}

      <InspectorProfileDialog
        open={profileOpen}
        inspector={dialog?.item || null}
        onClose={() => setDialog(null)}
        onSave={async (form) => {
          if (!permissions.manageInspectors) throw new Error('Insufficient permission')
          await mockApi.updateInspector({
            actor,
            inspectorId: form.id,
            patch: {
              name: form.name,
              phone: form.phone,
              email: form.email,
              profilePhotoUrl: form.profilePhotoUrl,
              joinDate: form.joinDate,
              employmentType: form.employmentType,
              status: form.status,
            },
            reason: form.reason,
          })
        }}
      />

      <ReasonDialog
        open={createOpen}
        title="Add inspector"
        description="Create inspector credentials. You can complete the remaining profile details later in Manage Profile."
        submitLabel="Create"
        onClose={() => setDialog(null)}
        showReason={true}
        requireReason={true}
        reasonLabel="Audit reason"
        reasonPlaceholder="Required for audit log"
        fields={[
          {
            name: 'id',
            label: 'Inspector ID (Auto-generated)',
            type: 'text',
            defaultValue: dialog?.inspectorId || '—',
            disabled: true,
          },
          { name: 'name', label: 'Full Name', type: 'text', defaultValue: '' },
          { name: 'phone', label: 'Phone Number', type: 'text', defaultValue: '' },
          { name: 'joinDate', label: 'Date of Joining', type: 'date', defaultValue: '' },
          {
            name: 'employmentType',
            label: 'Employment Type',
            type: 'select',
            defaultValue: 'full_time',
            options: [
              { value: 'full_time', label: 'Full-time' },
              { value: 'contract', label: 'Contract' },
              { value: 'freelancer', label: 'Freelancer' },
            ],
          },
        ]}
        onSubmit={async (form) => {
          try {
            if (!permissions.manageInspectors) throw new Error('Insufficient permission')
            await mockApi.createInspector({
              actor,
              inspector: {
                id: dialog?.inspectorId,
                name: form.name,
                phone: form.phone,
                joinDate: form.joinDate,
                employmentType: form.employmentType,
                status: 'active',
              },
              reason: form.reason,
            })
            setDialog(null)
          } catch (e) {
            // eslint-disable-next-line no-alert
            alert(e.message || 'Action failed')
          }
        }}
      />

      <ReasonDialog
        open={toggleActiveOpen}
        title={dialog?.item?.status === 'active' ? 'Deactivate inspector account' : 'Activate inspector account'}
        description={'Inspector profile changes are audited. Reason is mandatory.'}
        submitLabel={dialog?.item?.status === 'active' ? 'Deactivate' : 'Activate'}
        onClose={() => setDialog(null)}
        showReason={true}
        requireReason={true}
        reasonLabel="Audit reason"
        reasonPlaceholder="Required for audit log"
        fields={[]}
        onSubmit={async (form) => {
          try {
            if (!dialog || dialog.type !== 'toggleActive') return
            if (!permissions.manageInspectors) throw new Error('Insufficient permission')
            await mockApi.updateInspector({
              actor,
              inspectorId: dialog.item.id,
              patch: { status: dialog.item.status === 'active' ? 'inactive' : 'active' },
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
