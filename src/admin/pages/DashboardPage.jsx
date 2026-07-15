import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, ClipboardCheck, ClipboardList, Clock, Gauge, Layers, UserX, IndianRupeeIcon } from 'lucide-react'
import { Card, Badge, Button, cx } from '../ui/Ui'
import { CustomDatePicker } from '../ui/CustomDatePicker'
import { usePolling } from '../hooks/usePolling'
import { mockApi } from '../mock/mockApi'
import { useRbac } from '../rbac/RbacContext'
import { formatMinutes, formatDate } from '../utils/format'
import { listPDIRequests } from '../../api/inspection'
import { getPaymentStages, getVehicleTypes, getVehicleBrands } from '../../api/dashboard'
import { DrilldownDialog } from '../ui/DrilldownDialog'

function kpiTone(label, value) {
  if (label === 'SLA met') {
    if (value >= 92) return 'good'
    if (value >= 85) return 'warn'
    return 'bad'
  }
  return 'default'
}

// listPDIRequests() only returns a single page of items. The trend/city/customer
// charts below need every request in the selected date range (not just page 1),
// so page through the endpoint until all items matching `count` are collected.
async function fetchAllPdiRequests(params) {
  const items = []
  let page = 1
  let total = Infinity

  while (items.length < total) {
    const res = await listPDIRequests({ ...params, page, page_size: 200 })
    const pageItems = Array.isArray(res?.items) ? res.items : []
    total = typeof res?.count === 'number' ? res.count : pageItems.length
    items.push(...pageItems)
    if (pageItems.length === 0 || page > 200) break
    page += 1
  }

  return { count: total, items }
}

export function DashboardPage() {
  const { locationId } = useRbac()

  const { data, loading, error } = usePolling(
    ['dashboard', locationId].join(':'),
    () => mockApi.getDashboard({ locationId }),
    { intervalMs: 10_000 }
  )

  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })

  // /api/pdi-requests/ doesn't support date filtering at all — confirmed it returns the
  // same all-time set regardless of start_date/end_date/from_date/to_date. It's only used
  // below to build the trend/city/customer-assignment charts, which filter the (complete,
  // unfiltered) item list client-side by slot_date. The "Total PDI Requests" KPI itself is
  // sourced from /api/dashboard/payment-stages/ instead, since that endpoint does filter.
  const pdiDateParams = {
    start_date: dateFilter.from || undefined,
    end_date: dateFilter.to || undefined,
    from_date: dateFilter.from || undefined,
    to_date: dateFilter.to || undefined,
  }

  const { data: pdiData } = usePolling(
    ['pdi-requests-dashboard', dateFilter.from, dateFilter.to].join(':'),
    () => fetchAllPdiRequests(pdiDateParams),
    { intervalMs: 20_000 }
  )
  const cardValueClass = 'mt-1 text-lg font-semibold tracking-tight text-slate-900'
  const cardHintClass = 'mt-1 text-xs text-slate-500'
  const pdiItems = pdiData?.items ?? []
  const filteredPdiItems = pdiItems.filter((item) => {
    const date = item?.slot_date
    if (!date) return true
    if (dateFilter.from && date < dateFilter.from) return false
    if (dateFilter.to && date > dateFilter.to) return false
    return true
  })

  const dateParams = { from_date: dateFilter.from || undefined, to_date: dateFilter.to || undefined }

  const {
    data: paymentStagesResp,
    loading: paymentStagesLoading,
    error: paymentStagesError,
  } = usePolling(
    ['payment-stages', dateFilter.from, dateFilter.to].join(':'),
    () => getPaymentStages(dateParams),
    { intervalMs: 20_000 }
  )

  const {
    data: vehicleTypesResp,
    loading: vehicleTypesLoading,
    error: vehicleTypesError,
  } = usePolling(
    ['vehicle-types', dateFilter.from, dateFilter.to].join(':'),
    () => getVehicleTypes(dateParams),
    { intervalMs: 20_000 }
  )

  const {
    data: vehicleBrandsResp,
    loading: vehicleBrandsLoading,
    error: vehicleBrandsError,
  } = usePolling(
    ['vehicle-brands', dateFilter.from, dateFilter.to].join(':'),
    () => getVehicleBrands(dateParams),
    { intervalMs: 20_000 }
  )

  const [drilldown, setDrilldown] = useState({
    open: false,
    loading: false,
    error: null,
    title: '',
    subtitle: '',
    items: [],
  })

  const openDrilldown = async (title, subtitle, fetcher, params) => {
    setDrilldown({ open: true, loading: true, error: null, title, subtitle, items: [] })
    try {
      const res = await fetcher(params)
      setDrilldown({ open: true, loading: false, error: null, title, subtitle, items: res.items || [] })
    } catch (e) {
      const message = (e && e.detail) || 'Failed to load details.'
      setDrilldown({ open: true, loading: false, error: message, title, subtitle, items: [] })
    }
  }

  const closeDrilldown = () => setDrilldown((prev) => ({ ...prev, open: false }))

  // Payment stage counts from the payment-stages drill-down API
  const paymentStageCounts = paymentStagesResp?.payment_stage_counts ?? { advance_paid: 0, fully_paid: 0, unpaid: 0 }
  const fullyPaidCount = paymentStageCounts.fully_paid
  const advancePaidCount = paymentStageCounts.advance_paid

  // Total PDI Requests comes from /api/dashboard/payment-stages/'s own `count` field —
  // the authoritative total for the current date filter (per applied_filters in its
  // response). It's higher than summing payment_stage_counts' three buckets, since those
  // don't cover every payment_stage value (e.g. remaining_due) — so don't derive it from
  // the buckets, use `count` directly.
  const totalCount = paymentStagesResp?.count ?? 0

  const paymentStagesData = [
    { name: 'Unpaid', value: paymentStageCounts.unpaid, color: '#ef4444', stage: 'unpaid' },
    { name: 'Advance Paid', value: paymentStageCounts.advance_paid, color: '#f59e0b', stage: 'advance_paid' },
    { name: 'Fully Paid', value: paymentStageCounts.fully_paid, color: '#10b981', stage: 'fully_paid' },
  ]

  // Vehicle type counts from the vehicle-types drill-down API
  const vehicleTypeCounts = vehicleTypesResp?.vehicle_type_counts ?? { new: 0, owned: 0 }
  const vehicleTypesData = [
    { name: 'New Vehicles', value: vehicleTypeCounts.new, type: 'new' },
    { name: 'Pre-owned Vehicles', value: vehicleTypeCounts.owned, type: 'owned' },
  ]

  // Vehicle brand counts from the vehicle-brands drill-down API
  const vehicleBrandsData = (vehicleBrandsResp?.vehicle_brand_counts ?? []).slice(0, 6).map((b) => ({
    name: b.brand,
    count: b.count,
    brand: b.brand,
  }))

  // Calculate date-wise trend data
  const dateWiseTrend = (() => {
    const dateCounts = {}
    filteredPdiItems.forEach(item => {
      const date = item.slot_date
      if (!dateCounts[date]) {
        dateCounts[date] = { date, total: 0, fullyPaid: 0, advancePaid: 0, unpaid: 0 }
      }
      dateCounts[date].total++
      if (item.payment_stage === 'fully_paid') dateCounts[date].fullyPaid++
      if (item.payment_stage === 'advance_paid') dateCounts[date].advancePaid++
      if (item.payment_stage === 'unpaid') dateCounts[date].unpaid++
    })
    return Object.values(dateCounts).sort((a, b) => a.date.localeCompare(b.date))
  })()

  // Calculate location-wise data
  const locationData = (() => {
    const locations = {}
    filteredPdiItems.forEach(item => {
      const location = item.city || 'Unknown'
      if (!locations[location]) {
        locations[location] = { name: location, total: 0, assigned: 0, unassigned: 0 }
      }
      locations[location].total++
      if (item.assigned_inspector) {
        locations[location].assigned++
      } else {
        locations[location].unassigned++
      }
    })
    return Object.values(locations)
  })()

  // Calculate customer-inspector assignments
  const customerAssignments = (() => {
    return filteredPdiItems
      .filter(item => item.assigned_inspector)
      .slice(0, 8) // Show top 8 assignments
      .map(item => ({
        customer: item.name,
        inspector: item.assigned_inspector_name,
        inspectorId: item.assigned_inspector_id,
        date: item.slot_date,
        vehicle: `${item.brand_name} ${item.model_name}`
      }))
  })()

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Date filter</h2>
            <p className="text-xs text-slate-500">Filter dashboard data by slot date.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
            <div className="grid w-full gap-3 sm:grid-cols-2 sm:w-auto">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-700">From date</label>
                <CustomDatePicker
                  value={dateFilter.from}
                  onChange={(value) => setDateFilter(prev => ({ ...prev, from: value }))}
                  placeholder="dd/mm/yyyy"
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-700">To date</label>
                <CustomDatePicker
                  value={dateFilter.to}
                  onChange={(value) => setDateFilter(prev => ({ ...prev, to: value }))}
                  placeholder="dd/mm/yyyy"
                  className="w-full"
                />
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => setDateFilter({ from: '', to: '' })}
              disabled={!dateFilter.from && !dateFilter.to}
            >
              Clear Filter
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-3">
        <Card accent="cyan" className="p-0" kpi>
          <div
            className="relative cursor-pointer p-3"
            role="button"
            tabIndex={0}
            onClick={() =>
              openDrilldown('Total PDI Requests', 'All payment stages', getPaymentStages, dateParams)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ')
                openDrilldown('Total PDI Requests', 'All payment stages', getPaymentStages, dateParams)
            }}
          >
            <div className="mb-1 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-cyan-700" />
              <div className="text-xs text-slate-600">Total PDI Requests</div>
            </div>
            <div className={cardValueClass}>{paymentStagesLoading ? '—' : totalCount}</div>
            <div className={cardHintClass}>All requests</div>
          </div>
        </Card>

        <Card accent="emerald" className="p-0" kpi>
          <div
            className="relative cursor-pointer p-3"
            role="button"
            tabIndex={0}
            onClick={() =>
              openDrilldown('Fully Paid Requests', 'Payment complete', getPaymentStages, {
                ...dateParams,
                payment_stage: 'fully_paid',
              })
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ')
                openDrilldown('Fully Paid Requests', 'Payment complete', getPaymentStages, {
                  ...dateParams,
                  payment_stage: 'fully_paid',
                })
            }}
          >
            <div className="mb-1 flex items-center gap-2">
              <IndianRupeeIcon className="h-4 w-4 text-emerald-700" />
              <div className="text-xs text-slate-600">Fully Paid</div>
            </div>
            <div className={cardValueClass}>{paymentStagesLoading ? '—' : fullyPaidCount}</div>
            <div className={cardHintClass}>Payment complete</div>
          </div>
        </Card>

        <Card accent="amber" className="p-0" kpi>
          <div
            className="relative cursor-pointer p-3"
            role="button"
            tabIndex={0}
            onClick={() =>
              openDrilldown('Advance Paid Requests', 'Partial payment', getPaymentStages, {
                ...dateParams,
                payment_stage: 'advance_paid',
              })
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ')
                openDrilldown('Advance Paid Requests', 'Partial payment', getPaymentStages, {
                  ...dateParams,
                  payment_stage: 'advance_paid',
                })
            }}
          >
            <div className="mb-1 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-700" />
              <div className="text-xs text-slate-600">Advance Paid</div>
            </div>
            <div className={cardValueClass}>{paymentStagesLoading ? '—' : advancePaidCount}</div>
            <div className={cardHintClass}>Partial payment</div>
          </div>
        </Card>
      </div>

      {error || paymentStagesError || vehicleTypesError || vehicleBrandsError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          Failed to load dashboard data.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card
          title="Inspection trend"
          
          className="lg:col-span-2"
          accent="cyan"
          
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dateWiseTrend} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="advancePaidFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fullyPaidFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="unpaidFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => {
                    return formatDate(value)
                  }}
                />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    color: '#0f172a',
                    fontSize: 12,
                  }}
                  labelFormatter={(value) => {
                    return formatDate(value)
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#22d3ee"
                  fill="url(#totalFill)"
                  name="Total Requests"
                />
                <Area
                  type="monotone"
                  dataKey="advancePaid"
                  stroke="#f59e0b"
                  fill="url(#advancePaidFill)"
                  name="Advance Paid"
                />
                <Area
                  type="monotone"
                  dataKey="fullyPaid"
                  stroke="#10b981"
                  fill="url(#fullyPaidFill)"
                  name="Fully Paid"
                />
                <Area
                  type="monotone"
                  dataKey="unpaid"
                  stroke="#ef4444"
                  fill="url(#unpaidFill)"
                  name="Unpaid"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Queue load by city" subtitle="Assigned vs unassigned inspections" accent="cyan">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={locationData} layout="horizontal" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} width={90} />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    color: '#0f172a',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, textAlign: 'right' }} />
                <Line type="monotone" dataKey="assigned" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', r: 4 }} name="Assigned" />
                <Line type="monotone" dataKey="unassigned" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} name="Unassigned" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Payment Stages" subtitle="Distribution of payment status" accent="violet">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">Payment breakdown</div>
            {/* <Badge tone="violet">Live data</Badge> */}
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    color: '#0f172a',
                    fontSize: 12,
                  }}
                />
                <Pie
                  data={paymentStagesData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  cursor="pointer"
                  onClick={(entry) =>
                    openDrilldown(`${entry.name} Requests`, 'Payment stage breakdown', getPaymentStages, {
                      ...dateParams,
                      payment_stage: entry.stage,
                    })
                  }
                >
                  {paymentStagesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Vehicle Types" subtitle="New vs pre-owned vehicles" accent="emerald">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">Vehicle category</div>
            {/* <Badge tone="emerald">Realtime</Badge> */}
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    color: '#0f172a',
                    fontSize: 12,
                  }}
                />
                <Pie
                  data={vehicleTypesData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  cursor="pointer"
                  onClick={(entry) =>
                    openDrilldown(`${entry.name}`, 'Vehicle category', getVehicleTypes, {
                      ...dateParams,
                      vehicle_type: entry.type,
                    })
                  }
                >
                  {vehicleTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#22d3ee' : '#10b981'} style={{ cursor: 'pointer' }} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Vehicle Brands" subtitle="Top vehicle brands" accent="violet">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">Brand distribution</div>
            {/* <Badge tone="violet">Realtime</Badge> */}
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    color: '#0f172a',
                    fontSize: 12,
                  }}
                />
                <Pie
                  data={vehicleBrandsData}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  cursor="pointer"
                  onClick={(entry) =>
                    openDrilldown(`${entry.name} Requests`, 'Vehicle brand', getVehicleBrands, {
                      ...dateParams,
                      brand: entry.brand,
                    })
                  }
                >
                  {vehicleBrandsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={['#22d3ee', '#a78bfa', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'][index % 6]}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        </div>

      <DrilldownDialog
        open={drilldown.open}
        title={drilldown.title}
        subtitle={drilldown.subtitle}
        loading={drilldown.loading}
        error={drilldown.error}
        items={drilldown.items}
        onClose={closeDrilldown}
      />
    </div>
  )
}
