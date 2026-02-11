import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Eye, Gauge, MapPin, MoreVertical, Pencil, Plus, User, UserCheck, UserX } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { mockApi } from '../mock/mockApi'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, PaginatedTable, cx } from '../ui/Ui'
import { ReasonDialog } from '../ui/ReasonDialog'
import { ViewDetailsDialog } from '../ui/ViewDetailsDialog'
import { formatMinutes, minutesSince } from '../utils/format'

export function InspectorsPage() {
  const { locationId, permissions, actor } = useRbac()
  const { data, loading, error } = usePolling(
    ['inspectors', locationId].join(':'),
    () => mockApi.getInspectors({ locationId: locationId || undefined }),
    { intervalMs: 10_000 }
  )

  const inspectors = data?.items || []
  const locations = data?.locations || []

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
  const [actionsMenu, setActionsMenu] = useState(null)
  const actionsBoxRef = useRef(null)
  const actionsMenuRef = useRef(null)

  const viewOpen = dialog?.type === 'view'
  const toggleActiveOpen = dialog?.type === 'toggleActive'

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

  const viewItems = useMemo(() => {
    if (!dialog || dialog.type !== 'view') return []
    const it = dialog.item
    return [
      { key: 'id', label: 'Inspector ID', value: it?.id || '—' },
      { key: 'name', label: 'Name', value: it?.name || '—' },
      {
        key: 'locations',
        label: 'Locations',
        value: (it?.locationIds || []).map((id) => locationById.get(id)?.name || id).join(', ') || '—',
        fullWidth: true,
      },
      { key: 'skills', label: 'Skills', value: (it?.skills || []).join(', ') || '—', fullWidth: true },
      { key: 'active', label: 'Active', value: it?.active ? 'Yes' : 'No' },
      { key: 'state', label: 'State', value: it?.state || '—' },
      { key: 'util', label: 'Utilization (%)', value: it?.utilizationPct ?? '—' },
      {
        key: 'idleFor',
        label: 'Idle for',
        value: it?.state === 'idle' ? formatMinutes(minutesSince(it.lastStateChangeAt)) : '—',
      },
    ]
  }, [dialog, locationById])

  const locationOptions = useMemo(
    () => locations.map((l) => ({ value: l.id, label: l.name })),
    [locations]
  )

  const columns = useMemo(
    () => [
      {
        key: 'locations',
        header: 'Locations',
        exportValue: (r) => (r.locationIds || []).map((id) => locationById.get(id)?.name || id).join(' | '),
        cell: (r) => (
          <div className="max-w-[280px] whitespace-normal text-xs text-slate-700">
            {(r.locationIds || []).map((id) => (
              <div key={id}>{locationById.get(id)?.name || id}</div>
            ))}
          </div>
        ),
      },
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
        key: 'skills',
        header: 'Skills',
        cell: (r) => (
          <div className="flex flex-wrap gap-1">
            {r.skills.map((s) => (
              <Badge key={s} tone={s === 'new' ? 'cyan' : 'slate'}>
                {s === 'new' ? 'New' : 'Pre-owned'}
              </Badge>
            ))}
          </div>
        ),
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
        key: 'active',
        header: 'Active',
        cell: (r) => <Badge tone={r.active ? 'emerald' : 'slate'}>{r.active ? 'Yes' : 'No'}</Badge>,
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
    [locationById, permissions.manageInspectors]
  )

  return (
    <div className="space-y-3" ref={actionsBoxRef}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card accent="emerald" className="p-0">
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-700" />
              <div className="text-xs text-slate-600">Active</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{loading && !data ? '—' : active.length}</div>
            <div className="mt-1 text-xs text-slate-500">Currently enabled</div>
          </div>
        </Card>
        <Card accent={idle.length >= 2 ? 'amber' : 'slate'} className="p-0">
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <UserX className={cx('h-4 w-4', idle.length >= 2 ? 'text-amber-700' : 'text-slate-700')} />
              <div className="text-xs text-slate-600">Idle</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{loading && !data ? '—' : idle.length}</div>
            <div className="mt-1 text-xs text-slate-500">Potentially re-allocatable</div>
          </div>
        </Card>
        <Card accent={avgUtil >= 85 ? 'amber' : 'cyan'} className="p-0">
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <Gauge className={cx('h-4 w-4', avgUtil >= 85 ? 'text-amber-700' : 'text-cyan-700')} />
              <div className="text-xs text-slate-600">Avg utilization</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{loading && !data ? '—' : `${avgUtil}%`}</div>
            <div className="mt-1 text-xs text-slate-500">Workload</div>
          </div>
        </Card>
        <Card accent="violet" className="p-0">
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
                className="ml-2"
                disabled={!permissions.manageInspectors}
                onClick={() => setDialog({ type: 'create' })}
                title={permissions.manageInspectors ? 'Create inspector' : 'Insufficient permission'}
              >
                <Plus className="h-4 w-4" />
                Add
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

      <ViewDetailsDialog open={viewOpen} title="View inspector" onClose={() => setDialog(null)} items={viewItems} accent="cyan" />

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
            View
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
              setDialog({ type: 'edit', item: actionsMenu.row })
              setActionsMenu(null)
            }}
          >
            <Pencil className="h-4 w-4" />
            Update
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

      <ReasonDialog
        open={!!dialog && !viewOpen}
        title={
          dialog?.type === 'create'
            ? 'Create inspector'
            : dialog?.type === 'edit'
              ? 'Edit inspector'
              : dialog?.type === 'toggleActive'
                ? dialog?.item?.active
                  ? 'Deactivate inspector account'
                  : 'Activate inspector account'
                : ''
        }
        description={'Inspector profile changes are audited. Reason is mandatory.'}
        submitLabel={
          dialog?.type === 'create'
            ? 'Create'
            : dialog?.type === 'edit'
              ? 'Update'
              : dialog?.type === 'toggleActive'
                ? dialog?.item?.active
                  ? 'Deactivate'
                  : 'Activate'
                : 'Submit'
        }
        onClose={() => setDialog(null)}
        showReason={true}
        requireReason={true}
        fields={
          dialog?.type === 'create'
            ? [
                { name: 'name', label: 'Name', type: 'text', defaultValue: '' },
                {
                  name: 'locationId',
                  label: 'Primary location',
                  type: 'select',
                  defaultValue: locationOptions[0]?.value || '',
                  options: locationOptions.length ? locationOptions : [{ value: '', label: 'No locations' }],
                },
                {
                  name: 'skills',
                  label: 'Skills',
                  type: 'select',
                  defaultValue: 'both',
                  options: [
                    { value: 'both', label: 'New + Pre-owned' },
                    { value: 'new', label: 'New only' },
                    { value: 'pre_owned', label: 'Pre-owned only' },
                  ],
                },
                {
                  name: 'active',
                  label: 'Active',
                  type: 'select',
                  defaultValue: 'true',
                  options: [
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' },
                  ],
                },
              ]
            : dialog?.type === 'edit'
              ? [
                  { name: 'name', label: 'Name', type: 'text', defaultValue: dialog?.item?.name || '' },
                  {
                    name: 'locationId',
                    label: 'Primary location',
                    type: 'select',
                    defaultValue: dialog?.item?.locationIds?.[0] || locationOptions[0]?.value || '',
                    options: locationOptions.length ? locationOptions : [{ value: '', label: 'No locations' }],
                  },
                  {
                    name: 'skills',
                    label: 'Skills',
                    type: 'select',
                    defaultValue:
                      dialog?.item?.skills?.includes('new') && dialog?.item?.skills?.includes('pre_owned')
                        ? 'both'
                        : dialog?.item?.skills?.includes('new')
                          ? 'new'
                          : 'pre_owned',
                    options: [
                      { value: 'both', label: 'New + Pre-owned' },
                      { value: 'new', label: 'New only' },
                      { value: 'pre_owned', label: 'Pre-owned only' },
                    ],
                  },
                  {
                    name: 'active',
                    label: 'Active',
                    type: 'select',
                    defaultValue: dialog?.item?.active ? 'true' : 'false',
                    options: [
                      { value: 'true', label: 'Yes' },
                      { value: 'false', label: 'No' },
                    ],
                  },
                ]
              : dialog?.type === 'toggleActive'
                ? []
              : []
        }
        onSubmit={async (form) => {
          try {
            if (!dialog) return
            if (!permissions.manageInspectors) throw new Error('Insufficient permission')

            const skillsArr =
              form.skills === 'both' ? ['new', 'pre_owned'] : form.skills === 'new' ? ['new'] : ['pre_owned']

            if (dialog.type === 'create') {
              await mockApi.createInspector({
                actor,
                inspector: {
                  name: form.name,
                  locationIds: form.locationId ? [form.locationId] : [],
                  skills: skillsArr,
                  active: form.active === 'true',
                },
                reason: form.reason,
              })
            }

            if (dialog.type === 'edit') {
              await mockApi.updateInspector({
                actor,
                inspectorId: dialog.item.id,
                patch: {
                  name: form.name,
                  locationIds: form.locationId ? [form.locationId] : [],
                  skills: skillsArr,
                  active: form.active === 'true',
                },
                reason: form.reason,
              })
            }

            if (dialog.type === 'toggleActive') {
              await mockApi.updateInspector({
                actor,
                inspectorId: dialog.item.id,
                patch: { active: !dialog.item.active },
                reason: form.reason,
              })
            }

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
