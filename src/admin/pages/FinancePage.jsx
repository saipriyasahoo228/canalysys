import { useMemo, useState } from 'react'
import { CheckCircle2, Eye, IndianRupee, ReceiptText, Search, Settings2, Wallet } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { mockApi } from '../mock/mockApi'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, Input, PaginatedTable, Select } from '../ui/Ui'
import { CustomDatePicker } from '../ui/CustomDatePicker'
import { ReasonDialog } from '../ui/ReasonDialog'
import { ViewDetailsDialog } from '../ui/ViewDetailsDialog'
import { formatDateTime, formatInr } from '../utils/format'

export function FinancePage() {
  const { locationId, permissions, actor } = useRbac()
  const { data, loading, error, refresh } = usePolling(
    ['finance', locationId].join(':'),
    () => mockApi.getCommissions({ locationId: locationId || undefined }),
    { intervalMs: 12_000 }
  )

  const items = data?.items || []
  const inspectors = data?.inspectors || []
  const pricing = data?.pricing

  const inspectorById = useMemo(() => {
    const m = new Map()
    for (const i of inspectors) m.set(i.id, i)
    return m
  }, [inspectors])

  const total = items.reduce((acc, c) => acc + (c.amountInr || 0), 0)
  const pending = items.filter((c) => c.status === 'pending').reduce((acc, c) => acc + (c.amountInr || 0), 0)

  const [defaultFeeDraft, setDefaultFeeDraft] = useState('')
  const [dialog, setDialog] = useState(null)

  const viewOpen = dialog?.type === 'view'

  const viewItems = useMemo(() => {
    if (!dialog || dialog.type !== 'view') return []
    const it = dialog.item
    const insp = it?.inspectorId ? inspectorById.get(it.inspectorId) : null
    const loc = it?.locationId ? (data?.locations || []).find((l) => l.id === it.locationId) : null
    return [
      { key: 'id', label: 'Commission ID', value: it?.id || '—' },
      { key: 'pdiId', label: 'PDI ID', value: it?.pdiId || '—' },
      { key: 'inspector', label: 'Inspector', value: insp?.name || it?.inspectorId || '—' },
      { key: 'location', label: 'Location', value: loc?.name || it?.locationId || '—' },
      { key: 'amountInr', label: 'Amount (INR)', value: formatInr(it?.amountInr) },
      { key: 'status', label: 'Status', value: it?.status || '—' },
      { key: 'visitAt', label: 'Visit at', value: formatDateTime(it?.visitAt) },
      { key: 'paymentAt', label: 'Payment at', value: formatDateTime(it?.paymentAt) },
    ]
  }, [data?.locations, dialog, inspectorById])

  const [nameQuery, setNameQuery] = useState('')
  const [dateMode, setDateMode] = useState('visitAt')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const filtered = useMemo(() => {
    const q = String(nameQuery || '').trim().toLowerCase()

    const from = fromDate ? new Date(fromDate).getTime() : null
    const to = toDate ? new Date(toDate).getTime() : null

    return items.filter((c) => {
      const inspName = String(inspectorById.get(c.inspectorId)?.name || '').toLowerCase()
      if (q && !inspName.includes(q)) return false

      const tIso = dateMode === 'paymentAt' ? c.paymentAt : c.visitAt
      if (!tIso) return false
      const t = new Date(tIso).getTime()

      if (from != null && t < from) return false
      if (to != null && t > to + 24 * 60 * 60 * 1000 - 1) return false
      return true
    })
  }, [dateMode, fromDate, inspectorById, items, nameQuery, toDate])

  const columns = useMemo(
    () => [
      {
        key: 'pdiId',
        header: 'PDI ID',
        exportValue: (r) => r.pdiId,
        cell: (r) => <span className="font-semibold">{r.pdiId}</span>,
      },
      {
        key: 'inspector',
        header: 'Inspector',
        exportValue: (r) => inspectorById.get(r.inspectorId)?.name || r.inspectorId,
        cell: (r) => <span className="text-slate-700">{inspectorById.get(r.inspectorId)?.name || r.inspectorId}</span>,
      },
      {
        key: 'commission',
        header: 'Commission',
        exportValue: (r) => r.amountInr,
        cell: (r) => <span className="text-slate-700">{formatInr(r.amountInr)}</span>,
        className: 'text-right',
        tdClassName: 'text-right',
      },
      {
        key: 'status',
        header: 'Status',
        exportValue: (r) => r.status,
        cell: (r) => (
          <Badge tone={r.status === 'approved' ? 'emerald' : r.status === 'pending' ? 'amber' : 'slate'}>
            {r.status}
          </Badge>
        ),
      },
      {
        key: 'visitAt',
        header: 'Visit at',
        exportValue: (r) => new Date(r.visitAt).toISOString(),
        cell: (r) => formatDateTime(r.visitAt),
      },
      {
        key: 'paymentAt',
        header: 'Payment at',
        cell: (r) => formatDateTime(r.paymentAt),
      },
      {
        key: 'actions',
        header: 'Actions',
        cell: (r) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="icon" size="icon" onClick={() => setDialog({ type: 'view', item: r })} title={'View'}>
              <Eye className="h-4 w-4 text-slate-700" />
            </Button>
            <Button
              variant="icon"
              size="icon"
              disabled={!permissions.managePricing}
              onClick={() => setDialog({ type: 'overrideCommission', item: r })}
              title={permissions.managePricing ? 'Override commission amount' : 'Finance/Super Admin only'}
            >
              <Settings2 className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="icon"
              size="icon"
              disabled={!permissions.managePricing || r.status === 'approved'}
              onClick={() => setDialog({ type: 'approveCommission', item: r })}
              title={permissions.managePricing ? 'Approve commission' : 'Finance/Super Admin only'}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        className: 'text-right',
        tdClassName: 'text-right',
      },
    ],
    [inspectorById, permissions.managePricing]
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card accent="cyan" className="p-0">
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-cyan-700" />
              <div className="text-xs text-slate-600">Default fee</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">
              {loading && !pricing ? '—' : formatInr(pricing?.defaultInr ?? mockApi.COMMISSION_DEFAULT_INR)}
            </div>
            <div className="mt-1 text-xs text-slate-500">Used for new items</div>
          </div>
        </Card>
        <Card accent="emerald" className="p-0">
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-700" />
              <div className="text-xs text-slate-600">Commission total</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{loading && !data ? '—' : formatInr(total)}</div>
            <div className="mt-1 text-xs text-slate-500">Selected scope</div>
          </div>
        </Card>
        <Card accent={pending > 0 ? 'amber' : 'slate'} className="p-0">
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <CheckCircle2
                className={pending > 0 ? 'h-4 w-4 text-amber-700' : 'h-4 w-4 text-slate-700'}
              />
              <div className="text-xs text-slate-600">Pending</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{loading && !data ? '—' : formatInr(pending)}</div>
            <div className="mt-1 text-xs text-slate-500">Needs approval</div>
          </div>
        </Card>
        <Card accent="violet" className="p-0">
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-violet-700" />
              <div className="text-xs text-slate-600">Entries</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{loading && !data ? '—' : items.length}</div>
            <div className="mt-1 text-xs text-slate-500">Ledger records</div>
          </div>
        </Card>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          Failed to load finance.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card
          title="Commission ledger"
          subtitle="Per visit, default INR 500"
          className="lg:col-span-2"
          right={
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ReceiptText className="h-4 w-4" />
              Demo
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-2 pb-2 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <div className="text-xs font-medium text-slate-900">Inspector name</div>
              <div className="mt-1">
                <Input
                  value={nameQuery}
                  onChange={(e) => setNameQuery(e.target.value)}
                  placeholder="Search…"
                />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-900">Date field</div>
              <div className="mt-1">
                <Select value={dateMode} onChange={(e) => setDateMode(e.target.value)}>
                  <option value="visitAt">Visit date</option>
                  <option value="paymentAt">Payment date</option>
                </Select>
              </div>
            </div>
            <div className="flex items-end justify-end sm:justify-start">
              <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                <Search className="h-4 w-4" />
                {filtered.length} results
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-900">From</div>
              <div className="mt-1">
                <CustomDatePicker value={fromDate} onChange={(iso) => setFromDate(iso)} />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-900">To</div>
              <div className="mt-1">
                <CustomDatePicker value={toDate} onChange={(iso) => setToDate(iso)} />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                className="w-full justify-center"
                onClick={() => {
                  setNameQuery('')
                  setFromDate('')
                  setToDate('')
                  setDateMode('visitAt')
                }}
              >
                Clear
              </Button>
            </div>
          </div>

          <PaginatedTable
            columns={columns}
            rows={filtered}
            rowKey={(r) => r.id}
            initialRowsPerPage={10}
            enableSearch
            searchPlaceholder="Search ledger…"
            enableExport
            exportFilename="commissions.csv"
          />
        </Card>

        <Card
          title="Pricing controls"
          subtitle="Manual overrides are audited"
          right={
            <div className="text-xs text-slate-500">
              <IndianRupee className="inline h-4 w-4" />
            </div>
          }
        >
          <div className="space-y-2">
            <div className="rounded-md border border-slate-200 bg-white p-2">
              <div className="text-xs font-medium text-slate-900">Default inspection price</div>
              <div className="mt-1 text-sm font-semibold">{formatInr(pricing?.defaultInr ?? 500)}</div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-2">
              <div className="text-xs font-medium text-slate-900">Set new default (INR)</div>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="number"
                  value={defaultFeeDraft}
                  onChange={(e) => setDefaultFeeDraft(e.target.value)}
                  placeholder="e.g. 500"
                />
                <Button
                  variant="primary"
                  disabled={!permissions.managePricing || !String(defaultFeeDraft).trim()}
                  onClick={() => setDialog({ type: 'defaultPricing' })}
                  title={permissions.managePricing ? 'Set default pricing' : 'Finance-only'}
                >
                  <Settings2 className="h-4 w-4 text-blue-100" />
                  Apply
                </Button>
              </div>
              {!permissions.managePricing ? (
                <div className="mt-2 text-xs text-slate-500">Only Finance/Super Admin can update pricing.</div>
              ) : null}
            </div>

            <div className="text-xs text-slate-500">
              Per-inspection price overrides are done from Queue Control (Finance-only action).
            </div>
          </div>
        </Card>
      </div>

      <ViewDetailsDialog open={viewOpen} title="View commission" onClose={() => setDialog(null)} items={viewItems} accent="cyan" />

      <ReasonDialog
        open={!!dialog && !viewOpen}
        title={
          dialog?.type === 'overrideCommission'
              ? 'Override commission'
              : dialog?.type === 'approveCommission'
                ? 'Approve commission'
                : dialog?.type === 'defaultPricing'
                  ? 'Set default pricing'
                  : ''
        }
        description={
          dialog?.type === 'overrideCommission'
              ? 'Overrides the commission amount for this inspection (audited).'
              : dialog?.type === 'approveCommission'
                ? 'Approves this commission entry for payout.'
                : dialog?.type === 'defaultPricing'
                  ? 'This updates the default inspection price used for new queue items.'
                  : ''
        }
        submitLabel={
          dialog?.type === 'approveCommission'
              ? 'Approve'
              : dialog?.type === 'overrideCommission'
                ? 'Apply'
                : dialog?.type === 'defaultPricing'
                  ? 'Save'
                  : 'Apply'
        }
        onClose={() => setDialog(null)}
        showReason={true}
        requireReason={true}
        fields={(() => {
          if (dialog?.type === 'overrideCommission') {
            return [
              {
                name: 'amountInr',
                label: 'Commission amount (INR)',
                type: 'number',
                defaultValue: dialog?.item?.amountInr ?? mockApi.COMMISSION_DEFAULT_INR,
              },
            ]
          }

          if (dialog?.type === 'defaultPricing') {
            return [
              {
                name: 'defaultInr',
                label: 'Default price (INR)',
                type: 'number',
                defaultValue: defaultFeeDraft || pricing?.defaultInr || 500,
              },
            ]
          }

          return []
        })()}
        onSubmit={async (form) => {
          try {
            if (!dialog) return

            if (!permissions.managePricing) throw new Error('Insufficient permission')

            if (dialog.type === 'defaultPricing') {
              await mockApi.setDefaultPricing({
                actor,
                defaultInr: Number(form.defaultInr),
                reason: form.reason,
              })
            }

            if (dialog?.type === 'overrideCommission') {
              await mockApi.overrideCommission({
                actor,
                pdiId: dialog.item.pdiId,
                amountInr: Number(form.amountInr),
                reason: form.reason,
              })
            }

            if (dialog?.type === 'approveCommission') {
              await mockApi.approveCommission({
                actor,
                commissionId: dialog.item.id,
                reason: form.reason,
              })
            }

            setDialog(null)
            setDefaultFeeDraft('')
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
