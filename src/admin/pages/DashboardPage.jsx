import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, ClipboardCheck, ClipboardList, Clock, Gauge, Layers, UserX } from 'lucide-react'
import { Card, Badge, cx } from '../ui/Ui'
import { usePolling } from '../hooks/usePolling'
import { mockApi } from '../mock/mockApi'
import { useRbac } from '../rbac/RbacContext'
import { formatMinutes } from '../utils/format'

function kpiTone(label, value) {
  if (label === 'SLA met') {
    if (value >= 92) return 'good'
    if (value >= 85) return 'warn'
    return 'bad'
  }
  return 'default'
}

export function DashboardPage() {
  const { locationId } = useRbac()

  const { data, loading, error } = usePolling(
    ['dashboard', locationId].join(':'),
    () => mockApi.getDashboard({ locationId }),
    { intervalMs: 10_000 }
  )

  const k = data?.kpi
  const cardValueClass = 'mt-1 text-lg font-semibold tracking-tight text-slate-900'
  const cardHintClass = 'mt-1 text-xs text-slate-500'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Card accent="cyan" className="p-0">
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-cyan-700" />
              <div className="text-xs text-slate-600">Inspections today</div>
            </div>
            <div className={cardValueClass}>{loading && !k ? '—' : k?.totalInspectionsToday ?? '—'}</div>
            <div className={cardHintClass}>Across selected scope</div>
          </div>
        </Card>

        <Card accent={k?.queueLength >= 8 ? 'amber' : 'slate'} className="p-0">
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <ClipboardList className={cx('h-4 w-4', k?.queueLength >= 8 ? 'text-amber-700' : 'text-slate-700')} />
              <div className="text-xs text-slate-600">Vehicles in queue</div>
            </div>
            <div className={cardValueClass}>{loading && !k ? '—' : k?.queueLength ?? '—'}</div>
            <div className={cardHintClass}>Pending</div>
          </div>
        </Card>

        <Card accent={k?.avgWaitMinutes >= 40 ? 'amber' : 'slate'} className="p-0">
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <Clock className={cx('h-4 w-4', (k?.avgWaitMinutes ?? 0) >= 40 ? 'text-amber-700' : 'text-slate-700')} />
              <div className="text-xs text-slate-600">Avg wait</div>
            </div>
            <div className={cardValueClass}>{loading && !k ? '—' : formatMinutes(k?.avgWaitMinutes ?? 0)}</div>
            <div className={cardHintClass}>Arrival → start</div>
          </div>
        </Card>

        <Card accent={k?.inspectorUtilizationPct >= 85 ? 'amber' : 'emerald'} className="p-0">
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <Gauge
                className={cx(
                  'h-4 w-4',
                  (k?.inspectorUtilizationPct ?? 0) >= 85 ? 'text-amber-700' : 'text-emerald-700'
                )}
              />
              <div className="text-xs text-slate-600">Utilization</div>
            </div>
            <div className={cardValueClass}>{loading && !k ? '—' : `${k?.inspectorUtilizationPct ?? 0}%`}</div>
            <div className={cardHintClass}>Inspector load</div>
          </div>
        </Card>

        <Card accent={k?.idleInspectorsCount >= 2 ? 'amber' : 'slate'} className="p-0">
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <UserX className={cx('h-4 w-4', k?.idleInspectorsCount >= 2 ? 'text-amber-700' : 'text-slate-700')} />
              <div className="text-xs text-slate-600">Idle inspectors</div>
            </div>
            <div className={cardValueClass}>{loading && !k ? '—' : k?.idleInspectorsCount ?? 0}</div>
            <div className={cardHintClass}>20m+ idle rule</div>
          </div>
        </Card>

        <Card
          accent={(k?.slaBreachesCount ?? 0) + (k?.postponedCount ?? 0) >= 3 ? 'amber' : 'slate'}
          className="p-0"
        >
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <AlertTriangle
                className={cx(
                  'h-4 w-4',
                  (k?.slaBreachesCount ?? 0) + (k?.postponedCount ?? 0) >= 3 ? 'text-amber-700' : 'text-slate-700'
                )}
              />
              <div className="text-xs text-slate-600">Delayed</div>
            </div>
            <div className={cardValueClass}>
              {loading && !k ? '—' : (k?.slaBreachesCount ?? 0) + (k?.postponedCount ?? 0)}
            </div>
            <div className={cardHintClass}>
              {(k?.slaBreachesCount ?? 0) + (k?.postponedCount ?? 0) === 0
                ? 'SLA + postponed'
                : `${k?.slaBreachesCount ?? 0} SLA + ${k?.postponedCount ?? 0} postponed`}
            </div>
          </div>
        </Card>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          Failed to load dashboard.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card
          title="Inspection trend"
          subtitle="Throughput + wait (last ~12 mins, demo)"
          className="lg:col-span-2"
          accent="cyan"
          right={
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-4 w-4" />
              Polling
            </div>
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trends || []} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="inspectionsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="waitFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis dataKey="t" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    color: '#0f172a',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="inspections"
                  stroke="#22d3ee"
                  fill="url(#inspectionsFill)"
                  name="Inspections"
                />
                <Area
                  type="monotone"
                  dataKey="avgWait"
                  stroke="#f59e0b"
                  fill="url(#waitFill)"
                  name="Avg wait (m)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Alerts" subtitle="Queue overloads + idle inspectors" accent="amber">
          <div className="space-y-2">
            {(data?.alerts || []).length === 0 ? (
              <div className="text-sm text-slate-500">No alerts right now.</div>
            ) : null}
            {(data?.alerts || []).slice(0, 6).map((a) => (
              <div
                key={a.id}
                className={cx(
                  'rounded-md border p-2',
                  a.severity === 'critical'
                    ? 'border-rose-200 bg-rose-50'
                    : a.severity === 'warning'
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-slate-200 bg-white'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold">{a.title}</div>
                    <div className="mt-0.5 text-xs text-slate-600">{a.message}</div>
                  </div>
                  {a.severity === 'critical' ? (
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                  ) : a.severity === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  ) : (
                    <Gauge className="h-4 w-4 text-slate-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card title="Queue load by location" subtitle="Waiting vs in-progress" accent="cyan">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.queueLoad || []} margin={{ left: 8, right: 8, top: 10, bottom: 10 }}>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} interval={0} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    color: '#0f172a',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="waiting" stackId="a" fill="#f59e0b" name="Waiting" />
                <Bar dataKey="inProgress" stackId="a" fill="#22d3ee" name="In progress" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Vehicle mix" subtitle="New vs pre-owned" accent="violet">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">Ratio of active items</div>
            <Badge tone="cyan">Realtime (demo)</Badge>
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
                  data={data?.vehicleRatio || []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {(data?.vehicleRatio || []).map((_, idx) => (
                    <Cell
                      // eslint-disable-next-line react/no-array-index-key
                      key={`slice-${idx}`}
                      fill={idx === 0 ? '#22d3ee' : '#a78bfa'}
                    />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Layers className="h-4 w-4 text-cyan-600" />
              New
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <UserX className="h-4 w-4 text-violet-600" />
              Pre-owned
            </div>
          </div>
        </Card>

        <Card title="SLA watch" subtitle="Arrival → start (by location)" accent="slate">
          <div className="space-y-2 text-xs">
            {(data?.queueLoad || []).map((l) => (
              <div key={l.locationId} className="rounded-md border border-slate-200 bg-white p-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 truncate font-semibold">{l.name}</div>
                  <Badge tone={l.waiting >= 8 ? 'amber' : 'slate'}>{l.waiting} waiting</Badge>
                </div>
                <div className="mt-1 text-slate-600">In progress: {l.inProgress}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
