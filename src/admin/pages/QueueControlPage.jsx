import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpDown, BadgeCheck, Clock, Eye, Gauge, Hourglass, HandCoins, MoreVertical, SplitSquareVertical, UserPlus, Zap } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { mockApi } from '../mock/mockApi'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, PaginatedTable, Select, cx } from '../ui/Ui'
import { ReasonDialog } from '../ui/ReasonDialog'
import { ViewDetailsDialog } from '../ui/ViewDetailsDialog'
import { formatDateTime, formatInr, formatMinutes, minutesSince } from '../utils/format'

function priorityTone(p) {
  if (p === 'P0') return 'rose'
  if (p === 'P1') return 'amber'
  if (p === 'P2') return 'cyan'
  return 'slate'
}

function vehicleTone(t) {
  return t === 'new' ? 'cyan' : 'slate'
}

export function QueueControlPage() {
  const { locationId, permissions, actor } = useRbac()
  const [vehicleType, setVehicleType] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')

  const { data, loading, error, refresh } = usePolling(
    ['queue', locationId, vehicleType].join(':'),
    () => mockApi.getQueue({ locationId, vehicleType: vehicleType || undefined }),
    { intervalMs: 8_000 }
  )

  const items = data?.items || []
  const inspectors = data?.inspectors || []
  const locations = data?.locations || []

  const [dialog, setDialog] = useState(null)
  const [actionsMenu, setActionsMenu] = useState(null)
  const actionsBoxRef = useRef(null)
  const actionsMenuRef = useRef(null)

  const locationById = useMemo(() => {
    const m = new Map()
    for (const l of locations) m.set(l.id, l)
    return m
  }, [locations])

  const inspectorById = useMemo(() => {
    const m = new Map()
    for (const i of inspectors) m.set(i.id, i)
    return m
  }, [inspectors])

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

  const viewOpen = dialog?.type === 'view'
  const customerOpen = dialog?.type === 'viewCustomer'

  const viewItems = useMemo(() => {
    if (!dialog || dialog.type !== 'view') return []
    const it = dialog.item
    const insp = it?.assignedInspectorId ? inspectorById.get(it.assignedInspectorId) : null
    const loc = it?.locationId ? locationById.get(it.locationId) : null

    return [
      { key: 'id', label: 'PDI ID', value: it?.id || '—' },
      { key: 'customerName', label: 'Customer name', value: it?.customerName || '—' },
      { key: 'customerPhone', label: 'Customer phone', value: it?.customerPhone || '—' },
      { key: 'vehicleSummary', label: 'Vehicle', value: it?.vehicleSummary || '—' },
      { key: 'vehicleNumber', label: 'Vehicle number', value: it?.vehicleNumber || '—' },
      { key: 'vehicleType', label: 'Vehicle Type', value: it?.vehicleType === 'new' ? 'New' : 'Pre-owned' },
      { key: 'location', label: 'Location', value: loc?.name || it?.locationId || '—' },
      { key: 'priority', label: 'Priority', value: it?.priority || '—' },
      { key: 'status', label: 'Status', value: it?.status || '—' },
      { key: 'inspector', label: 'Inspector', value: insp?.name || 'Unassigned' },
      { key: 'price', label: 'Price (INR)', value: formatInr(it?.priceInr) },
      {
        key: 'createdAt',
        label: 'Created at',
        value: formatDateTime(it?.createdAt),
      },
      {
        key: 'paymentAt',
        label: 'Payment at',
        value: formatDateTime(it?.paymentAt),
      },
      {
        key: 'closedAt',
        label: 'Closed at',
        value: formatDateTime(it?.closedAt),
      },
    ]
  }, [dialog, inspectorById, locationById])

  const customerItems = useMemo(() => {
    if (!dialog || dialog.type !== 'viewCustomer') return []
    const it = dialog.item

    const safeName = String(it?.customerName || '').trim() || 'Customer'
    const safeSlug = safeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/(^\.|\.$)/g, '')
    const dummyEmail = safeSlug ? `${safeSlug}@example.com` : 'customer@example.com'

    return [
      { key: 'customerName', label: 'Customer', value: it?.customerName || '—' },
      { key: 'customerPhone', label: 'Customer phone', value: it?.customerPhone || '—' },
      { key: 'customerEmail', label: 'Customer email', value: it?.customerEmail || dummyEmail },
      { key: 'vehicle', label: 'Vehicle', value: it?.vehicleSummary || '—' },
      { key: 'vehicleNumber', label: 'Vehicle number', value: it?.vehicleNumber || '—' },
      { key: 'vehicleType', label: 'Vehicle type', value: it?.vehicleType === 'new' ? 'New' : 'Pre-owned' },
      {
        key: 'pickupAddress',
        label: 'Pickup address',
        value: it?.pickupAddress || 'Demo: 12, Main Road, Near City Mall',
        fullWidth: true,
      },
    ]
  }, [dialog])

  const capacityForecast = useMemo(() => {
    const waiting = items.filter((q) => q.status === 'pending')
    const inProgress = items.filter((q) => q.status === 'in_progress')

    const scopeInspectors = inspectors.filter((i) => (locationId ? i.locationIds.includes(locationId) : true))
    const active = scopeInspectors.filter((i) => i.active)

    const avgDuration = waiting.length
      ? Math.round(waiting.reduce((acc, q) => acc + (q.expectedDurationMinutes || 25), 0) / waiting.length)
      : 25

    const effectiveCapacityPerHour = active.length ? Math.round((60 / avgDuration) * active.length) : 0

    const projectedWait = effectiveCapacityPerHour
      ? Math.round((waiting.length / effectiveCapacityPerHour) * 60)
      : waiting.length
        ? 999
        : 0

    return {
      waiting: waiting.length,
      inProgress: inProgress.length,
      activeInspectors: active.length,
      avgDurationMinutes: avgDuration,
      effectiveCapacityPerHour,
      projectedWaitMinutes: projectedWait,
    }
  }, [items, inspectors, locationId])

  const columns = useMemo(
    () => [
      {
        key: 'id',
        header: 'PDI ID',
        exportValue: (r) => r.id,
        cell: (r) => <span className="font-semibold">{r.id}</span>,
      },
      {
        key: 'vehicleType',
        header: 'Vehicle',
        exportValue: (r) => (r.vehicleType === 'new' ? 'New' : 'Pre-owned'),
        cell: (r) => <Badge tone={vehicleTone(r.vehicleType)}>{r.vehicleType === 'new' ? 'New' : 'Pre-owned'}</Badge>,
      },
      {
        key: 'location',
        header: 'Location',
        exportValue: (r) => locationById.get(r.locationId)?.name || r.locationId,
        cell: (r) => <span className="text-slate-600">{locationById.get(r.locationId)?.name || r.locationId}</span>,
      },
      {
        key: 'priority',
        header: 'Priority',
        cell: (r) => <Badge tone={priorityTone(r.priority)}>{r.priority}</Badge>,
      },
      {
        key: 'age',
        header: 'Age',
        exportValue: (r) => minutesSince(r.createdAt),
        cell: (r) => {
          const age = minutesSince(r.createdAt)
          const sla = locationById.get(r.locationId)?.slaMinutes || 45
          const warn = age > sla
          return <Badge tone={warn ? 'rose' : 'slate'}>{formatMinutes(age)}</Badge>
        },
      },
      {
        key: 'status',
        header: 'Status',
        exportValue: (r) => r.status,
        cell: (r) => (
          <Badge
            tone={
              r.status === 'in_progress'
                ? 'emerald'
                : r.status === 'pending'
                  ? 'slate'
                  : r.status === 'postponed'
                    ? 'amber'
                    : r.status === 'closed'
                      ? 'cyan'
                      : 'slate'
            }
          >
            {r.status === 'in_progress'
              ? 'In progress'
              : r.status === 'pending'
                ? 'Pending'
                : r.status === 'postponed'
                  ? 'Postponed'
                  : r.status === 'closed'
                    ? 'Closed'
                    : r.status}
          </Badge>
        ),
      },
      {
        key: 'inspector',
        header: 'Inspector',
        exportValue: (r) => {
          const insp = r.assignedInspectorId ? inspectorById.get(r.assignedInspectorId) : null
          return insp ? insp.name : ''
        },
        cell: (r) => {
          const insp = r.assignedInspectorId ? inspectorById.get(r.assignedInspectorId) : null
          return <span className="text-slate-700">{insp ? insp.name : '—'}</span>
        },
      },
      {
        key: 'price',
        header: 'Price',
        exportValue: (r) => r.priceInr,
        cell: (r) => <span className="text-slate-700">{formatInr(r.priceInr)}</span>,
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
        className: 'text-center',
        tdClassName: 'text-right',
      },
    ],
    [inspectorById, locationById, permissions.managePricing, permissions.manageQueue]
  )

  const splitHint = vehicleType ? (vehicleType === 'new' ? 'New-only lane' : 'Pre-owned-only lane') : 'All'

  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') return items
    if (statusFilter === 'active') return items.filter((q) => q.status !== 'closed')
    return items.filter((q) => q.status === statusFilter)
  }, [items, statusFilter])

  return (
    <div className="space-y-3" ref={actionsBoxRef}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card accent={capacityForecast.waiting >= 8 ? 'amber' : 'cyan'} className="p-0">
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <Hourglass
                className={cx('h-4 w-4', capacityForecast.waiting >= 8 ? 'text-amber-700' : 'text-cyan-700')}
              />
              <div className="text-xs text-slate-600">Waiting</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{capacityForecast.waiting}</div>
            <div className="mt-1 text-xs text-slate-500">Pending</div>
          </div>
        </Card>
        <Card accent="emerald" className="p-0">
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-emerald-700" />
              <div className="text-xs text-slate-600">In progress</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{capacityForecast.inProgress}</div>
            <div className="mt-1 text-xs text-slate-500">Active inspections</div>
          </div>
        </Card>
        <Card accent="cyan" className="p-0">
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-cyan-700" />
              <div className="text-xs text-slate-600">Capacity / hour</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{capacityForecast.effectiveCapacityPerHour}</div>
            <div className="mt-1 text-xs text-slate-500">Based on inspectors</div>
          </div>
        </Card>
        <Card accent={capacityForecast.projectedWaitMinutes >= 45 ? 'amber' : 'slate'} className="p-0">
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <Clock
                className={cx(
                  'h-4 w-4',
                  capacityForecast.projectedWaitMinutes >= 45 ? 'text-amber-700' : 'text-slate-700'
                )}
              />
              <div className="text-xs text-slate-600">Projected wait</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{formatMinutes(capacityForecast.projectedWaitMinutes)}</div>
            <div className="mt-1 text-xs text-slate-500">Forecast</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Card
          title="Queue"
          subtitle={`Real-time (polling) · ${splitHint}`}
          className="w-full"
          right={
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="active">Active (non-closed)</option>
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="postponed">Postponed</option>
                <option value="closed">Closed</option>
              </Select>

              <Button
                variant={vehicleType === '' ? 'primary' : 'default'}
                onClick={() => setVehicleType('')}
                className="hidden sm:inline-flex"
              >
                <SplitSquareVertical className="h-4 w-4" />
                All
              </Button>
              <Button
                variant={vehicleType === 'new' ? 'primary' : 'default'}
                onClick={() => setVehicleType('new')}
                className="hidden sm:inline-flex"
              >
                New
              </Button>
              <Button
                variant={vehicleType === 'pre_owned' ? 'primary' : 'default'}
                onClick={() => setVehicleType('pre_owned')}
                className="hidden whitespace-nowrap sm:inline-flex"
              >
                Pre-Owned
              </Button>
              <Button
                variant="default"
                disabled={!permissions.manageQueue}
                onClick={() => setDialog({ type: 'autoAssign' })}
                title={permissions.manageQueue ? 'Auto-assign inspectors' : 'Insufficient permission'}
                className="whitespace-nowrap"
              >
                Auto-Assign
              </Button>
              <Button onClick={refresh}>Refresh</Button>
            </div>
          }
        >
          <div className="flex items-center gap-2 pb-2 sm:hidden">
            <Select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
              <option value="">All vehicle types</option>
              <option value="new">New only</option>
              <option value="pre_owned">Pre-owned only</option>
            </Select>
          </div>

          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              Failed to load queue.
            </div>
          ) : null}

          <div className={cx(loading && !data ? 'opacity-60' : '')}>
            <PaginatedTable
              columns={columns}
              rows={filteredItems}
              rowKey={(r) => r.id}
              initialRowsPerPage={10}
              enableSearch
              searchPlaceholder="Search queue…"
              enableExport
              exportFilename="queue.csv"
            />
          </div>
        </Card>
      </div>

      <ViewDetailsDialog open={viewOpen} title="View queue item" onClose={() => setDialog(null)} items={viewItems} accent="cyan" />

      <ViewDetailsDialog
        open={customerOpen}
        title="Customer details"
        onClose={() => setDialog(null)}
        items={customerItems}
        accent="cyan"
      />

      {actionsMenu ? (
        <div
          ref={actionsMenuRef}
          className="fixed z-50 min-w-[240px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          style={{ left: actionsMenu.left, top: actionsMenu.top }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-100"
            onClick={() => {
              setDialog({ type: 'view', item: actionsMenu.row })
              setActionsMenu(null)
            }}
          >
            <Eye className="h-4 w-4" />
            View details
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-100"
            onClick={() => {
              setDialog({ type: 'viewCustomer', item: actionsMenu.row })
              setActionsMenu(null)
            }}
          >
            <Eye className="h-4 w-4" />
            View customer details
          </button>

          <button
            type="button"
            className={cx(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100',
              permissions.manageQueue ? 'text-slate-900' : 'cursor-not-allowed text-slate-400'
            )}
            disabled={!permissions.manageQueue}
            onClick={() => {
              if (!permissions.manageQueue) return
              setDialog({ type: 'priority', item: actionsMenu.row })
              setActionsMenu(null)
            }}
          >
            <ArrowUpDown className="h-4 w-4" />
            Set priority
          </button>

          <button
            type="button"
            className={cx(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100',
              permissions.manageQueue ? 'text-slate-900' : 'cursor-not-allowed text-slate-400'
            )}
            disabled={!permissions.manageQueue}
            onClick={() => {
              if (!permissions.manageQueue) return
              setDialog({ type: 'assign', item: actionsMenu.row })
              setActionsMenu(null)
            }}
          >
            <UserPlus className="h-4 w-4" />
            Assign inspector
          </button>

          <button
            type="button"
            className={cx(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100',
              permissions.manageQueue ? 'text-slate-900' : 'cursor-not-allowed text-slate-400'
            )}
            disabled={!permissions.manageQueue}
            onClick={() => {
              if (!permissions.manageQueue) return
              setDialog({ type: 'payment', item: actionsMenu.row })
              setActionsMenu(null)
            }}
          >
            <HandCoins className="h-4 w-4" />
            Record payment
          </button>

          <button
            type="button"
            className={cx(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100',
              permissions.managePricing ? 'text-slate-900' : 'cursor-not-allowed text-slate-400'
            )}
            disabled={!permissions.managePricing}
            onClick={() => {
              if (!permissions.managePricing) return
              setDialog({ type: 'commission', item: actionsMenu.row })
              setActionsMenu(null)
            }}
          >
            <BadgeCheck className="h-4 w-4" />
            Override commission (per PDI)
          </button>

          <button
            type="button"
            className={cx(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100',
              permissions.managePricing ? 'text-slate-900' : 'cursor-not-allowed text-slate-400'
            )}
            disabled={!permissions.managePricing}
            onClick={() => {
              if (!permissions.managePricing) return
              setDialog({ type: 'price', item: actionsMenu.row })
              setActionsMenu(null)
            }}
          >
            <Zap className="h-4 w-4" />
            Override inspection price
          </button>

          <button
            type="button"
            className={cx(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100',
              permissions.manageQueue ? 'text-slate-900' : 'cursor-not-allowed text-slate-400'
            )}
            disabled={!permissions.manageQueue}
            onClick={() => {
              if (!permissions.manageQueue) return
              setDialog({ type: 'status', item: actionsMenu.row })
              setActionsMenu(null)
            }}
          >
            <SplitSquareVertical className="h-4 w-4" />
            Update status
          </button>
        </div>
      ) : null}

      <ReasonDialog
        open={!!dialog && !viewOpen && !customerOpen}
        title={
          dialog?.type === 'priority'
            ? 'Set priority'
            : dialog?.type === 'assign'
              ? 'Manual inspector allocation'
              : dialog?.type === 'price'
                ? 'Override inspection price'
                : dialog?.type === 'payment'
                  ? 'Record payment'
                  : dialog?.type === 'commission'
                    ? 'Override commission (per PDI)'
                    : dialog?.type === 'status'
                      ? 'Update queue status'
                      : dialog?.type === 'autoAssign'
                        ? 'Auto-assign inspectors'
                : ''
        }
        description={dialog?.type === 'view' ? null : 'Manual overrides are audited. Reason is mandatory.'}
        submitLabel="Apply"
        onClose={() => setDialog(null)}
        showReason={true}
        requireReason={true}
        fields={
          dialog?.type === 'priority'
            ? [
                {
                  name: 'priority',
                  label: 'Priority',
                  type: 'select',
                  defaultValue: dialog?.item?.priority || 'P2',
                  options: [
                    { value: 'P0', label: 'P0 (highest)' },
                    { value: 'P1', label: 'P1' },
                    { value: 'P2', label: 'P2' },
                    { value: 'P3', label: 'P3 (lowest)' },
                  ],
                },
              ]
            : dialog?.type === 'assign'
              ? [
                  {
                    name: 'inspectorId',
                    label: 'Inspector',
                    type: 'select',
                    defaultValue: dialog?.item?.assignedInspectorId || '',
                    options: [
                      { value: '', label: 'Unassigned' },
                      ...inspectors
                        .filter((i) => (dialog?.item?.locationId ? i.locationIds.includes(dialog.item.locationId) : true))
                        .filter((i) => i.active)
                        .map((i) => ({ value: i.id, label: `${i.name} · ${i.state} · ${i.utilizationPct}%` })),
                    ],
                  },
                ]
              : dialog?.type === 'price'
                ? [
                    {
                      name: 'newPriceInr',
                      label: 'New price (INR)',
                      type: 'number',
                      defaultValue: dialog?.item?.priceInr ?? 500,
                      placeholder: 'e.g. 650',
                    },
                  ]
                : dialog?.type === 'payment'
                  ? [
                      {
                        name: 'paymentAt',
                        label: 'Payment time',
                        type: 'text',
                        defaultValue: dialog?.item?.paymentAt ? formatDateTime(dialog.item.paymentAt) : 'Now',
                        placeholder: 'Recorded automatically',
                      },
                    ]
                  : dialog?.type === 'commission'
                    ? [
                        {
                          name: 'amountInr',
                          label: 'Commission amount (INR)',
                          type: 'number',
                          defaultValue: dialog?.item?.commissionOverrideInr ?? mockApi.COMMISSION_DEFAULT_INR,
                          placeholder: 'e.g. 500',
                        },
                      ]
                    : dialog?.type === 'status'
                      ? [
                          {
                            name: 'status',
                            label: 'New status',
                            type: 'select',
                            defaultValue: dialog?.item?.status || 'pending',
                            options: [
                              { value: 'pending', label: 'Pending' },
                              { value: 'in_progress', label: 'In progress' },
                              { value: 'postponed', label: 'Postponed' },
                              { value: 'closed', label: 'Closed (requires payment)' },
                            ],
                          },
                        ]
                : []
        }
        onSubmit={async (form) => {
          try {
            if (!dialog) return
            if (dialog.type === 'priority') {
              await mockApi.setPriority({
                actor,
                pdiId: dialog.item.id,
                priority: form.priority,
                reason: form.reason,
              })
            }
            if (dialog.type === 'assign') {
              await mockApi.assignInspector({
                actor,
                pdiId: dialog.item.id,
                inspectorId: form.inspectorId || null,
                reason: form.reason,
              })
            }
            if (dialog.type === 'price') {
              await mockApi.overridePrice({
                actor,
                pdiId: dialog.item.id,
                newPriceInr: Number(form.newPriceInr),
                reason: form.reason,
              })
            }
            if (dialog.type === 'payment') {
              await mockApi.recordPayment({
                actor,
                pdiId: dialog.item.id,
                reason: form.reason,
              })
            }
            if (dialog.type === 'commission') {
              await mockApi.overrideCommission({
                actor,
                pdiId: dialog.item.id,
                amountInr: Number(form.amountInr),
                reason: form.reason,
              })
            }
            if (dialog.type === 'status') {
              await mockApi.setQueueStatus({
                actor,
                pdiId: dialog.item.id,
                status: form.status,
                reason: form.reason,
              })
            }
            if (dialog.type === 'autoAssign') {
              await mockApi.autoAssign({
                actor,
                locationId: locationId || null,
                vehicleType: vehicleType || null,
                reason: form.reason,
              })
            }
            setDialog(null)
            refresh()
          } catch (e) {
            // keep simple for demo
            // eslint-disable-next-line no-alert
            alert(e.message || 'Action failed')
          }
        }}
      />

      <Card title="Operational notes" subtitle="Controls & logging">
        <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-white p-2">
            <div className="font-semibold">Priority assignment</div>
            <div className="mt-1 text-slate-600">P0–P3 with mandatory reason (audited).</div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-2">
            <div className="font-semibold">Manual inspector allocation</div>
            <div className="mt-1 text-slate-600">Assign/unassign; auto switches to In progress on assign.</div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-2">
            <div className="font-semibold">Queue split</div>
            <div className="mt-1 text-slate-600">Toggle New / Pre-owned lanes.</div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-2">
            <div className="font-semibold">Pricing overrides</div>
            <div className="mt-1 text-slate-600">Finance role can override per PDI item (audited).</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
