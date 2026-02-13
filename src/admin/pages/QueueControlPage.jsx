import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpDown,
  BadgeCheck,
  Clock,
  Eye,
  FileDown,
  Gauge,
  Hourglass,
  HandCoins,
  MoreVertical,
  SplitSquareVertical,
  UserPlus,
  Zap,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { usePolling } from '../hooks/usePolling'
import { mockApi } from '../mock/mockApi'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, PaginatedTable, Select, cx } from '../ui/Ui'
import { ReasonDialog } from '../ui/ReasonDialog'
import { ViewDetailsDialog } from '../ui/ViewDetailsDialog'
import { formatDate, formatDateTime, formatInr, formatMinutes, minutesSince } from '../utils/format'

function priorityTone(p) {
  if (p === 'P0') return 'rose'
  if (p === 'P1') return 'amber'
  if (p === 'P2') return 'cyan'
  return 'slate'
}

function vehicleTone(t) {
  return t === 'new' ? 'cyan' : 'slate'
}

function scoreTone(pct) {
  const n = Number(pct)
  if (!Number.isFinite(n)) return 'slate'
  if (n >= 80) return 'emerald'
  if (n >= 50) return 'cyan'
  if (n >= 30) return 'amber'
  return 'rose'
}

function CircularScore({ pct }) {
  const v = Number(pct)
  const safe = Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0
  const r = 18
  const c = 2 * Math.PI * r
  const dash = (safe / 100) * c
  const tone = scoreTone(safe)
  const stroke =
    tone === 'emerald'
      ? '#059669'
      : tone === 'cyan'
        ? '#0891B2'
        : tone === 'amber'
          ? '#D97706'
          : '#E11D48'

  return (
    <div className="relative h-12 w-12">
      <svg viewBox="0 0 48 48" className="h-12 w-12">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#E2E8F0" strokeWidth="6" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 24 24)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-900">{Math.round(safe)}%</div>
    </div>
  )
}

function downloadDummyChecklistPdf({ queueItem, inspector, location }) {
  const it = queueItem || {}
  const checklist = it.checklist || {}

  const checkedCount = Number.isFinite(Number(checklist.checkedCount)) ? Number(checklist.checkedCount) : 76
  const totalCount = Number.isFinite(Number(checklist.totalCount)) ? Number(checklist.totalCount) : 83
  const scorePct =
    checklist.scorePct === null || checklist.scorePct === undefined
      ? totalCount > 0
        ? Math.round((checkedCount / totalCount) * 10000) / 100
        : null
      : checklist.scorePct

  const clientName = it.customerName || 'ASWAIN SWAIN'
  const clientPhone = String(it.customerPhone || '6370166632')

  const conductedOn = formatDate(it.createdAt)
  const submittedOn = formatDate(
    it.submittedAt || new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  )
  const preparedBy = inspector?.name || 'Surajit'
  const locName = location?.name || 'Carnalysys, Bhubaneswar'

  const vehicleType = it.vehicleType === 'new' ? 'NEW' : 'PRE-OWNED'
  const vehicleReg = it.vehicleNumber || 'OD02AU5487'
  const vehicleMake = String(it.vehicleSummary || 'Honda City').split(' ')[0] || 'Honda'
  const vehicleModel = it.vehicleSummary || 'City CVT'
  const vin = 'MAKGM662AJN302323'
  const odometer = '25000'

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  const header = () => {
    pdf.setFontSize(13)
    pdf.setTextColor(0)
    pdf.text(`CARNALYSYS'S Vehicle Inspection Report`, 40, 44)
    pdf.setFontSize(9)
    pdf.setTextColor(100)
    pdf.text(`Private & confidential`, 40, 60)
    pdf.setTextColor(0)
  }

  header()

  autoTable(pdf, {
    startY: 76,
    theme: 'grid',
    head: [['Score', 'Flagged items', 'Actions']],
    body: [[`${checkedCount} / ${totalCount} (${scorePct == null ? '—' : `${scorePct}%`})`, '0', 'Incomplete: 0']],
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [15, 118, 110] },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) header()
      pdf.setFontSize(8)
      pdf.setTextColor(120)
      pdf.text(`Page ${data.pageNumber}`, pageW - 70, pageH - 22)
      pdf.text('safetyculture.com/report-recipients/?utm_source=report_pdf', 40, pageH - 22)
      pdf.setTextColor(0)
    },
  })

  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 10,
    theme: 'grid',
    head: [
      [
        'Client Name',
        'Client contact',
        'Conducted on',
        'Submitted on',
        'Document No.',
        'Prepared by',
        'Location',
        'Vehicle type',
      ],
    ],
    body: [[clientName, clientPhone, conductedOn || '—', submittedOn || '—', it.id || '1', preparedBy, locName, vehicleType]],
    styles: { fontSize: 7, cellPadding: 6 },
    headStyles: { fillColor: [226, 232, 240], textColor: 30 },
  })

  pdf.setFontSize(11)
  pdf.text('INSPECTION', 40, pdf.lastAutoTable.finalY + 28)

  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 38,
    theme: 'grid',
    head: [['Vehicle Information', `${Math.min(checkedCount, 74)} / ${Math.min(totalCount, 81)} (${scorePct == null ? '—' : `${Math.min(99.99, Number(scorePct)).toFixed(2)}%`})`]],
    body: [
      ['Vehicle Registration', vehicleReg],
      ['Vehicle Make', vehicleMake],
      ['Vehicle Model', vehicleModel],
      ['VIN / MotorNumber', vin],
      ['Odometer / Milage Reading', odometer],
    ],
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [15, 118, 110] },
    columnStyles: { 0: { cellWidth: 190 }, 1: { cellWidth: pageW - 40 - 40 - 190 } },
  })

  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 14,
    theme: 'grid',
    head: [['Vehicle Inspection', `${Math.min(checkedCount, 55)} / ${Math.min(totalCount, 61)} (${scorePct == null ? '—' : `${Math.min(99.99, Number(scorePct)).toFixed(2)}%`})`]],
    body: [
      ['Do you wish to check the exterior of this vehicle in this inspection?', 'Yes'],
      ['External Check', `${Math.min(checkedCount, 30)} / ${Math.min(totalCount, 30)} (100%)`],
      ['Front Windscreen free from damage?', 'Yes'],
      ['Front Lights free from damage?', 'Yes'],
      ['Front Bumper in good condition?', 'Yes'],
      ['Front Hood/Bonnet in good condition?', 'Yes'],
      ['Front right hand side Fender in good condition?', 'Yes'],
      ['Front left hand side Fender in good condition?', 'Yes'],
      ['Rear Windshield in good condition?', 'Yes'],
    ],
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [15, 118, 110] },
    columnStyles: { 0: { cellWidth: 360 }, 1: { cellWidth: pageW - 40 - 40 - 360 } },
  })

  const buildSectionRows = (prefix, count, yesCount) => {
    const rows = []
    const n = Math.max(0, Math.floor(count))
    const y = Math.max(0, Math.floor(yesCount))
    for (let i = 1; i <= n; i++) {
      rows.push([`${prefix}${i}`, i <= y ? 'Yes' : 'No'])
    }
    return rows
  }

  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 14,
    theme: 'grid',
    head: [['External Check', `${Math.min(checkedCount, 30)} / ${Math.min(totalCount, 30)} (100%)`]],
    body: buildSectionRows('Front item ', 45, 41),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [15, 118, 110] },
    columnStyles: { 0: { cellWidth: 380 }, 1: { cellWidth: pageW - 40 - 40 - 380 } },
  })

  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 14,
    theme: 'grid',
    head: [['Tyres & Wheels', `18 / 20 (90%)`]],
    body: buildSectionRows('Tyre item ', 40, 36),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [15, 118, 110] },
    columnStyles: { 0: { cellWidth: 380 }, 1: { cellWidth: pageW - 40 - 40 - 380 } },
  })

  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 14,
    theme: 'grid',
    head: [['Engine & Transmission', `28 / 33 (84.85%)`]],
    body: buildSectionRows('Engine item ', 55, 47),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [15, 118, 110] },
    columnStyles: { 0: { cellWidth: 380 }, 1: { cellWidth: pageW - 40 - 40 - 380 } },
  })

  const filename = `inspection-report-${String(it.id || 'pdi').replace(/[^a-z0-9_-]+/gi, '-')}.pdf`
  pdf.save(filename)
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

  useLayoutEffect(() => {
    if (!actionsMenu) return
    if (!actionsMenuRef.current) return

    const menuRect = actionsMenuRef.current.getBoundingClientRect()
    const gap = 8
    const padding = 8

    const nextTop = actionsMenu.shouldOpenUp
      ? Math.max(padding, actionsMenu.anchorTop - menuRect.height - gap)
      : actionsMenu.anchorBottom + gap

    actionsMenuRef.current.style.top = `${nextTop}px`
  }, [actionsMenu])

  const viewOpen = dialog?.type === 'view'
  const customerOpen = dialog?.type === 'viewCustomer'

  const viewItems = useMemo(() => {
    if (!dialog || dialog.type !== 'view') return []
    const it = dialog.item
    const insp = it?.assignedInspectorId ? inspectorById.get(it.assignedInspectorId) : null
    const loc = it?.locationId ? locationById.get(it.locationId) : null

    const scorePct = it?.checklist?.scorePct
    const checked = it?.checklist?.checkedCount
    const total = it?.checklist?.totalCount
    const scoreDisplay =
      scorePct === null || scorePct === undefined
        ? '—'
        : `${scorePct}%${checked != null && total != null ? ` (${checked}/${total})` : ''}`

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
      { key: 'score', label: 'PDI score', value: scoreDisplay },
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

    const totalPdiBookingInr = Number(it?.priceInr) || 0
    const advancePaymentInr = Number(it?.advancePaymentInr)
    const safeAdvanceInr = Number.isFinite(advancePaymentInr)
      ? advancePaymentInr
      : it?.paymentAt
        ? totalPdiBookingInr
        : Math.min(500, totalPdiBookingInr)
    const remainingInr = Math.max(0, totalPdiBookingInr - safeAdvanceInr)

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
      { key: 'totalPdiBooking', label: 'Total PDI booking payment (INR)', value: formatInr(totalPdiBookingInr) },
      { key: 'advancePayment', label: 'Advance payment (INR)', value: formatInr(safeAdvanceInr) },
      { key: 'remainingAmount', label: 'Remaining amount (INR)', value: formatInr(remainingInr) },
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
        key: 'date',
        header: 'Date',
        exportValue: (r) =>
          r.submittedAt || new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        cell: (r) => (
          <div className="text-xs text-slate-600">
            {formatDate(
              r.submittedAt || new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            )}
          </div>
        ),
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
        <Card accent={capacityForecast.waiting >= 8 ? 'amber' : 'cyan'} className="p-0" kpi>
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
        <Card accent="emerald" className="p-0" kpi>
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-emerald-700" />
              <div className="text-xs text-slate-600">In progress</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{capacityForecast.inProgress}</div>
            <div className="mt-1 text-xs text-slate-500">Active inspections</div>
          </div>
        </Card>
        <Card accent="cyan" className="p-0" kpi>
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-cyan-700" />
              <div className="text-xs text-slate-600">Capacity / hour</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{capacityForecast.effectiveCapacityPerHour}</div>
            <div className="mt-1 text-xs text-slate-500">Based on inspectors</div>
          </div>
        </Card>
        <Card accent={capacityForecast.projectedWaitMinutes >= 45 ? 'amber' : 'slate'} className="p-0" kpi>
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

      {dialog?.type === 'scorePdf' ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDialog(null)} />
          <div className="absolute inset-3 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-semibold">Score & checklist report</div>
              <div className="mt-1 text-xs text-slate-500">Preview then download a multi-page PDF report</div>
            </div>

            {(() => {
              const it = dialog?.item || {}
              const score = it?.checklist?.scorePct
              const checked = it?.checklist?.checkedCount
              const total = it?.checklist?.totalCount
              const insp = it?.assignedInspectorId ? inspectorById.get(it.assignedInspectorId) : null
              const loc = it?.locationId ? locationById.get(it.locationId) : null
              const scoreLine =
                score === null || score === undefined
                  ? '—'
                  : `${Number(score)}%${checked != null && total != null ? ` (${checked}/${total})` : ''}`

              return (
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">PDI ID</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{it.id || '—'}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">Score</div>
                      <div className="mt-1">
                        {score === null || score === undefined ? (
                          <div className="text-sm font-semibold text-slate-700">—</div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <CircularScore pct={score} />
                            <Badge tone={scoreTone(score)}>{Number(score)}%</Badge>
                            {checked != null && total != null ? (
                              <div className="text-xs text-slate-600">({checked}/{total})</div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-900">Customer info</div>
                    <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">Client name</div>
                        <div className="mt-0.5 font-semibold text-slate-900">{it.customerName || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">Client contact</div>
                        <div className="mt-0.5 font-semibold text-slate-900">{it.customerPhone || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">Conducted on</div>
                        <div className="mt-0.5 font-semibold text-slate-900">{formatDate(it.createdAt) || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">Submitted on</div>
                        <div className="mt-0.5 font-semibold text-slate-900">
                          {formatDate(
                            it.submittedAt || new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                          ) || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">Prepared by</div>
                        <div className="mt-0.5 font-semibold text-slate-900">{insp?.name || '—'}</div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">Location</div>
                        <div className="mt-0.5 font-semibold text-slate-900">{loc?.name || it.locationId || '—'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-900">Vehicle info</div>
                    <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">Vehicle type</div>
                        <div className="mt-0.5 font-semibold text-slate-900">{it.vehicleType === 'new' ? 'NEW' : 'PRE-OWNED'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">Vehicle number</div>
                        <div className="mt-0.5 font-semibold text-slate-900">{it.vehicleNumber || '—'}</div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">Vehicle summary</div>
                        <div className="mt-0.5 font-semibold text-slate-900">{it.vehicleSummary || '—'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-900">Checklist info</div>
                    <div className="mt-2 text-sm text-slate-800">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-slate-600">Summary</div>
                        <div className="font-semibold">{scoreLine}</div>
                      </div>
                      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                        Sections (preview):
                        <div className="mt-1">- Vehicle Information</div>
                        <div>- Vehicle Inspection</div>
                        <div>- External Check</div>
                        <div>- Tyres & Wheels</div>
                        <div>- Engine & Transmission</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {(() => {
              const it = dialog?.item || {}
              const insp = it?.assignedInspectorId ? inspectorById.get(it.assignedInspectorId) : null
              const loc = it?.locationId ? locationById.get(it.locationId) : null
              return (
                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
                  <Button variant="ghost" onClick={() => setDialog(null)}>
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      downloadDummyChecklistPdf({ queueItem: it, inspector: insp, location: loc })
                    }}
                  >
                    <FileDown className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              )
            })()}
          </div>
        </div>
      ) : null}

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
              setDialog({ type: 'scorePdf', item: actionsMenu.row })
              setActionsMenu(null)
            }}
          >
            <FileDown className="h-4 w-4" />
            Score & Download report
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
        open={!!dialog && !viewOpen && !customerOpen && dialog?.type !== 'scorePdf'}
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
