import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, FilePlus2, MoreVertical, X } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { mockApi } from '../mock/mockApi'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, Input, PaginatedTable, Select, cx } from '../ui/Ui'
import { ViewDetailsDialog } from '../ui/ViewDetailsDialog'
import { CustomDatePicker } from '../ui/CustomDatePicker'
import { formatDate } from '../utils/format'

const VEHICLE_TYPE_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'pre_owned', label: 'Pre-Owned' },
]

const CATEGORY_OPTIONS = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'suv', label: 'SUV' },
  { value: 'premium', label: 'Premium' },
]

const PAYMENT_METHOD_OPTIONS = [
  { value: 'card', label: 'Credit/Debit Cards' },
  { value: 'net_banking', label: 'Net Banking' },
  { value: 'upi', label: 'UPI Payments' },
  { value: 'wallet', label: 'Wallets (Paytm, Amazon Pay)' },
]

const PAYMENT_PROVIDER_OPTIONS = [
  { value: 'razorpay', label: 'Razorpay' },
  { value: 'payu', label: 'PayU' },
]

const slotTimes = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
]

function joinDateTimeLocal(dateIso, timeHHmm) {
  const d = String(dateIso || '').trim()
  const t = String(timeHHmm || '').trim()
  if (!d || !t) return ''
  return `${d}T${t}`
}

function slotDisplay(dateIso, timeHHmm) {
  const d = String(dateIso || '').trim()
  const t = String(timeHHmm || '').trim()
  if (!d || !t) return ''
  return `${formatDate(d)} ${t}`
}

function computePriceInr({ vehicleType, category, locationExtraInr }) {
  const base = 500
  const vehicleAdd = vehicleType === 'pre_owned' ? 150 : 0
  const catAdd = category === 'premium' ? 300 : category === 'suv' ? 150 : category === 'sedan' ? 100 : 0
  const locAdd = Number.isFinite(Number(locationExtraInr)) ? Number(locationExtraInr) : 0
  return base + vehicleAdd + catAdd + locAdd
}

function addDaysIso(d, days) {
  const dt = new Date(`${d}T00:00:00`)
  if (!Number.isFinite(dt.getTime())) return ''
  dt.setDate(dt.getDate() + Number(days || 0))
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function todayIso() {
  const dt = new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function NewInspectionPage() {
  const { actor } = useRbac()

  const { data: customers, loading: loadingCustomers, error: customersError, refresh: refreshCustomers } = usePolling(
    'customers',
    () => mockApi.getCustomers(),
    { intervalMs: 15_000 }
  )

  const { data: locations, loading: loadingLocations, error: locationsError } = usePolling(
    'locations',
    () => mockApi.getLocations(),
    { intervalMs: 30_000 }
  )

  const { data: vmData } = usePolling('vehicle-master-mini', () => mockApi.getVehicleMaster(), { intervalMs: 60_000 })

  const vm = vmData || { makes: [], models: [], variants: [] }

  const makeById = useMemo(() => new Map((vm.makes || []).map((x) => [x.id, x])), [vm.makes])
  const modelById = useMemo(() => new Map((vm.models || []).map((x) => [x.id, x])), [vm.models])
  const variantById = useMemo(() => new Map((vm.variants || []).map((x) => [x.id, x])), [vm.variants])

  const modelsForMake = useMemo(() => {
    const m = new Map()
    for (const md of vm.models || []) {
      const key = md.makeId || '__NONE__'
      const arr = m.get(key) || []
      arr.push(md)
      m.set(key, arr)
    }
    return m
  }, [vm.models])

  const variantsForModel = useMemo(() => {
    const m = new Map()
    for (const v of vm.variants || []) {
      const key = v.modelId || '__NONE__'
      const arr = m.get(key) || []
      arr.push(v)
      m.set(key, arr)
    }
    return m
  }, [vm.variants])

  const [dialog, setDialog] = useState(null)

  const [actionsMenu, setActionsMenu] = useState(null)
  const actionsMenuRef = useRef(null)

  const viewOpen = dialog?.type === 'viewCustomer'
  const raiseOpen = dialog?.type === 'raise'
  const bookingOpen = dialog?.type === 'bookingSummary'

  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState(null)
  const [booking, setBooking] = useState(null)

  useEffect(() => {
    const onDown = (e) => {
      if (!actionsMenuRef.current) return
      if (!actionsMenuRef.current.contains(e.target)) setActionsMenu(null)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => {
    if (!bookingOpen) {
      setBooking(null)
      setBookingError(null)
      setBookingLoading(false)
      return
    }

    const customerId = dialog?.customer?.id
    if (!customerId) return

    let mounted = true
    ;(async () => {
      try {
        setBookingLoading(true)
        setBookingError(null)
        const list = await mockApi.getCustomerBookings({ customerId })
        const sorted = (list || []).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        const preferredId = String(dialog?.pdiId || '').trim()
        const preferred = preferredId ? sorted.find((x) => x.id === preferredId) : null
        const pick = preferred || sorted[0] || null
        if (!mounted) return
        setBooking(pick)
      } catch (e) {
        if (!mounted) return
        setBookingError(e)
      } finally {
        if (!mounted) return
        setBookingLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [bookingOpen, dialog?.customer?.id, dialog?.pdiId])

  const wizardStep = raiseOpen ? Number(dialog?.step || 1) : 1

  const wizardForm = raiseOpen
    ? dialog?.form || {
        vehicleType: 'new',
        makeId: '',
        modelId: '',
        variantId: '',
        category: 'suv',
        locationId: locationOptions?.[0]?.value || 'LOC-DUMMY',
        slotDate: '',
        slotTime: '',
      }
    : null

  const slotAvailability = useMemo(() => {
    if (!raiseOpen) return new Map()
    const map = new Map()
    for (const t of slotTimes) {
      const mm = Number(String(t || '').split(':')[1] || 0)
      const available = mm !== 30
      map.set(t, available)
    }
    return map
  }, [raiseOpen])

  const availableTimes = useMemo(() => {
    if (!raiseOpen) return []
    return slotTimes.filter((t) => slotAvailability.get(t))
  }, [raiseOpen, slotAvailability])

  const locationExtraInr = useMemo(() => {
    if (!raiseOpen) return 0
    const locId = String(wizardForm?.locationId || '').trim()
    if (!locId) return 0
    if (locId === 'LOC-BLR-01') return 0
    if (locId === 'LOC-HYD-01') return 50
    if (locId === 'LOC-PUN-01') return 75
    return 0
  }, [raiseOpen, wizardForm?.locationId])

  const priceInr = useMemo(() => {
    if (!raiseOpen) return 0
    return computePriceInr({
      vehicleType: wizardForm?.vehicleType,
      category: wizardForm?.category,
      locationExtraInr,
    })
  }, [raiseOpen, locationExtraInr, wizardForm?.category, wizardForm?.vehicleType])

  const viewItems = useMemo(() => {
    if (!dialog || dialog.type !== 'viewCustomer') return []
    const c = dialog.customer
    return [
      { key: 'id', label: 'Customer ID', value: c?.id || '—' },
      { key: 'fullName', label: 'Full name', value: c?.fullName || '—' },
      { key: 'email', label: 'Email', value: c?.email || '—' },
      { key: 'mobile', label: 'Mobile', value: c?.mobile || '—' },
    ]
  }, [dialog])

  const locationNameById = useMemo(() => {
    const m = new Map()
    for (const l of locations || []) m.set(l.id, l.name)
    return m
  }, [locations])

  const bookingItems = useMemo(() => {
    if (!bookingOpen) return []
    const c = dialog?.customer
    const b = booking

    return [
      { key: 'customerId', label: 'Customer ID', value: c?.id || '—' },
      { key: 'customerName', label: 'Customer name', value: c?.fullName || '—' },
      { key: 'customerMobile', label: 'Mobile', value: c?.mobile || '—' },
      { key: 'pdiId', label: 'Booking / PDI ID', value: b?.id || '—' },
      { key: 'createdAt', label: 'Booked at', value: b?.createdAt ? slotDisplay(String(b.createdAt).slice(0, 10), String(b.createdAt).slice(11, 16)) : '—' },
      { key: 'slot', label: 'Selected slot', value: b?.requestedSlotAt ? b.requestedSlotAt : '—', fullWidth: true },
      { key: 'location', label: 'Location', value: locationNameById.get(b?.locationId) || b?.locationId || '—' },
      { key: 'vehicleType', label: 'Vehicle type', value: b?.vehicleType === 'pre_owned' ? 'Pre-Owned' : 'New' },
      { key: 'vehicle', label: 'Vehicle', value: b?.vehicleSummary || '—', fullWidth: true },
      { key: 'category', label: 'Category', value: b?.requestedCategory || b?.requestedVehicle?.category || '—' },
      { key: 'total', label: 'Total price (INR)', value: b?.priceInr ?? '—' },
      { key: 'advance', label: 'Advance paid (INR)', value: b?.advancePaidInr ?? 500 },
      { key: 'due', label: 'Remaining due (INR)', value: b?.dueInr ?? (Number.isFinite(Number(b?.priceInr)) ? Math.max(0, Number(b.priceInr) - 500) : '—') },
      { key: 'status', label: 'Status', value: b?.status || 'pending' },
    ]
  }, [booking, bookingOpen, dialog?.customer, locationNameById])

  const locationOptions = useMemo(() => {
    return (locations || []).map((l) => ({ value: l.id, label: l.name }))
  }, [locations])

  const customerRows = customers || []

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
      {
        key: 'actions',
        header: <div className="w-full text-right">Actions</div>,
        cell: (c) => (
          <div className="flex items-center justify-end">
            <Button
              variant="icon"
              size="icon"
              title="Actions"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                setActionsMenu({
                  customer: c,
                  top: rect.bottom + 8,
                  left: Math.max(8, rect.right - 220),
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
    []
  )

  return (
    <div className="space-y-3">
      {customersError || locationsError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Failed to load.</div>
      ) : null}

      <Card
        title="New inspection"
        subtitle="Select a walk-in customer and raise a PDI request"
        accent="violet"
        right={
          <div className="flex items-center gap-2">
            <Button onClick={async () => refreshCustomers()}>Refresh</Button>
          </div>
        }
      >
        <div className={loadingCustomers && !customers ? 'opacity-60' : ''}>
          <PaginatedTable
            columns={columns}
            rows={customerRows}
            rowKey={(c) => c.id}
            initialRowsPerPage={10}
            rowsPerPageOptions={[5, 10, 20, 'all']}
            enableSearch
            searchPlaceholder="Search customers…"
            enableExport
            exportFilename="customers-for-inspection.csv"
            getSearchText={(c) => `${c.fullName} ${c.email} ${c.mobile} ${c.id}`}
          />
        </div>

        {loadingLocations && !locations ? <div className="mt-2 text-xs text-slate-500">Loading locations…</div> : null}
        {locationOptions.length === 0 && !loadingLocations ? (
          <div className="mt-2 text-xs text-slate-500">No locations available.</div>
        ) : null}
      </Card>

      <ViewDetailsDialog open={viewOpen} title="View customer" onClose={() => setDialog(null)} items={viewItems} accent="slate" />

      <ViewDetailsDialog
        open={bookingOpen}
        title="Booking summary"
        subtitle={
          bookingLoading
            ? 'Loading booking…'
            : bookingError
              ? 'Failed to load booking.'
              : booking
                ? `PDI ${booking.id}`
                : 'No bookings found.'
        }
        onClose={() => setDialog(null)}
        items={bookingItems}
        accent="violet"
      />

      {actionsMenu ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0" onClick={() => setActionsMenu(null)} />
          <div
            ref={actionsMenuRef}
            className="absolute w-[220px] rounded-xl border border-slate-200 bg-white shadow-lg"
            style={{ top: actionsMenu.top, left: actionsMenu.left }}
          >
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 rounded-t-xl"
              onClick={() => {
                const c = actionsMenu.customer
                setActionsMenu(null)
                setDialog({
                  type: 'raise',
                  step: 1,
                  customer: c,
                  form: {
                    vehicleType: 'new',
                    makeId: '',
                    modelId: '',
                    variantId: '',
                    category: 'suv',
                    locationId: locationOptions?.[0]?.value || 'LOC-DUMMY',
                    slotDate: '',
                    slotTime: '',
                  },
                })
              }}
            >
              Raise PDI
            </button>
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              onClick={() => {
                const c = actionsMenu.customer
                setActionsMenu(null)
                setDialog({ type: 'viewCustomer', customer: c })
              }}
            >
              View customer details
            </button>
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 rounded-b-xl"
              onClick={() => {
                const c = actionsMenu.customer
                setActionsMenu(null)
                setDialog({ type: 'bookingSummary', customer: c })
              }}
            >
              View booking summary
            </button>
          </div>
        </div>
      ) : null}

      {raiseOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDialog(null)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="relative border-b border-slate-200 px-4 py-3">
              <Button
                variant="icon"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => setDialog(null)}
                aria-label="Close"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="text-sm font-semibold">Raise PDI request</div>
              <div className="mt-1 text-xs text-slate-500">
                Step {wizardStep} of 4 · {dialog?.customer?.fullName || 'Customer'}
              </div>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-4">
              {wizardStep === 1 ? (
                <div className="space-y-3">
                  <Card accent="slate" className="p-0">
                    <div className="p-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-xs font-medium text-slate-900">Vehicle type</div>
                          <div className="mt-1">
                            <Select
                              value={wizardForm.vehicleType}
                              onChange={(e) =>
                                setDialog((s) =>
                                  s && s.type === 'raise' ? { ...s, form: { ...s.form, vehicleType: e.target.value } } : s
                                )
                              }
                            >
                              {VEHICLE_TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">Make</div>
                          <div className="mt-1">
                            <Select
                              value={wizardForm.makeId}
                              onChange={(e) => {
                                const nextMakeId = e.target.value
                                setDialog((s) => {
                                  if (!s || s.type !== 'raise') return s
                                  if (!nextMakeId) return { ...s, form: { ...s.form, makeId: '', modelId: '', variantId: '' } }
                                  const models = modelsForMake.get(nextMakeId) || []
                                  const nextModelId = models?.[0]?.id || ''
                                  const variants = variantsForModel.get(nextModelId) || []
                                  return {
                                    ...s,
                                    form: { ...s.form, makeId: nextMakeId, modelId: nextModelId, variantId: variants?.[0]?.id || '' },
                                  }
                                })
                              }}
                            >
                              <option value="">Select</option>
                              {(vm.makes || []).map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">Model</div>
                          <div className="mt-1">
                            <Select
                              value={wizardForm.modelId}
                              onChange={(e) => {
                                const nextModelId = e.target.value
                                setDialog((s) => {
                                  if (!s || s.type !== 'raise') return s
                                  if (!nextModelId) return { ...s, form: { ...s.form, modelId: '', variantId: '' } }
                                  const model = vm.models?.find((m) => m.id === nextModelId)
                                  const makeId = model?.makeId || s.form.makeId
                                  const variants = variantsForModel.get(nextModelId) || []
                                  return {
                                    ...s,
                                    form: { ...s.form, makeId, modelId: nextModelId, variantId: variants?.[0]?.id || '' },
                                  }
                                })
                              }}
                            >
                              <option value="">Select</option>
                              {(() => {
                                const list = wizardForm.makeId ? modelsForMake.get(wizardForm.makeId) || [] : vm.models || []
                                return list.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))
                              })()}
                            </Select>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">Variant</div>
                          <div className="mt-1">
                            <Select
                              value={wizardForm.variantId}
                              onChange={(e) => {
                                const nextVariantId = e.target.value
                                setDialog((s) => {
                                  if (!s || s.type !== 'raise') return s
                                  if (!nextVariantId) return { ...s, form: { ...s.form, variantId: '' } }
                                  const variant = vm.variants?.find((v) => v.id === nextVariantId)
                                  const modelId = variant?.modelId || s.form.modelId
                                  const model = vm.models?.find((m) => m.id === modelId)
                                  const makeId = model?.makeId || s.form.makeId
                                  return { ...s, form: { ...s.form, makeId, modelId, variantId: nextVariantId } }
                                })
                              }}
                            >
                              <option value="">Select</option>
                              {(() => {
                                const list = wizardForm.modelId ? variantsForModel.get(wizardForm.modelId) || [] : vm.variants || []
                                return list.map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.name}
                                  </option>
                                ))
                              })()}
                            </Select>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">Category</div>
                          <div className="mt-1">
                            <Select
                              value={wizardForm.category}
                              onChange={(e) =>
                                setDialog((s) =>
                                  s && s.type === 'raise' ? { ...s, form: { ...s.form, category: e.target.value } } : s
                                )
                              }
                            >
                              {CATEGORY_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">Location</div>
                          <div className="mt-1">
                            <Select
                              value={wizardForm.locationId}
                              onChange={(e) =>
                                setDialog((s) =>
                                  s && s.type === 'raise' ? { ...s, form: { ...s.form, locationId: e.target.value } } : s
                                )
                              }
                            >
                              <option value="">Location</option>
                              {locationOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : null}

              {wizardStep === 2 ? (
                <div className="space-y-3">
                  <Card accent="slate" className="p-0">
                    <div className="p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-medium text-slate-900">Quick select</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const d = todayIso()
                              const t = availableTimes?.[0] || ''
                              setDialog((s) => (s && s.type === 'raise' ? { ...s, form: { ...s.form, slotDate: d, slotTime: t } } : s))
                            }}
                          >
                            Today
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const d = addDaysIso(todayIso(), 1)
                              const t = availableTimes?.[0] || ''
                              setDialog((s) => (s && s.type === 'raise' ? { ...s, form: { ...s.form, slotDate: d, slotTime: t } } : s))
                            }}
                          >
                            Tomorrow
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const d = todayIso()
                              const t = availableTimes?.[0] || ''
                              setDialog((s) => (s && s.type === 'raise' ? { ...s, form: { ...s.form, slotDate: d, slotTime: t } } : s))
                            }}
                          >
                            Next available
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-xs font-medium text-slate-900">Select date</div>
                          <div className="mt-1">
                            <CustomDatePicker
                              value={wizardForm.slotDate}
                              onChange={(iso) =>
                                setDialog((s) =>
                                  s && s.type === 'raise' ? { ...s, form: { ...s.form, slotDate: iso, slotTime: '' } } : s
                                )
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">Selected slot</div>
                          <div className="mt-1">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                              {wizardForm.slotDate && wizardForm.slotTime
                                ? slotDisplay(wizardForm.slotDate, wizardForm.slotTime)
                                : '—'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-xs font-medium text-slate-900">Available time slots</div>
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {slotTimes.map((t) => {
                            const active = wizardForm.slotTime === t
                            const isAvailable = !!slotAvailability.get(t)
                            return (
                              <button
                                key={t}
                                type="button"
                                disabled={!wizardForm.slotDate || !isAvailable}
                                className={cx(
                                  'cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-950/30 disabled:cursor-not-allowed disabled:opacity-50',
                                  active
                                    ? 'border-amber-950/30 bg-amber-950 text-amber-50'
                                    : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
                                )}
                                onClick={() =>
                                  setDialog((s) => (s && s.type === 'raise' ? { ...s, form: { ...s.form, slotTime: t } } : s))
                                }
                              >
                                {t}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : null}

              {wizardStep === 3 ? (
                <div className="space-y-3">
                  <Card title="Price summary" subtitle="Review pricing before payment" accent="amber">
                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-medium text-slate-600">Vehicle</div>
                        <div className="mt-1 font-semibold text-slate-900">
                          {(wizardForm.makeId ? makeById.get(wizardForm.makeId)?.name : '') || '—'}{' '}
                          {(wizardForm.modelId ? modelById.get(wizardForm.modelId)?.name : '') || ''}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {wizardForm.vehicleType === 'pre_owned' ? 'Pre-Owned' : 'New'} · {wizardForm.category}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-medium text-slate-600">Slot</div>
                        <div className="mt-1 font-semibold text-slate-900">
                          {wizardForm.slotDate && wizardForm.slotTime
                            ? slotDisplay(wizardForm.slotDate, wizardForm.slotTime)
                            : '—'}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">{wizardForm.locationId || '—'}</div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-slate-600">Base</div>
                        <div className="font-semibold text-slate-900">₹500</div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <div className="text-slate-600">Vehicle/Category add-ons</div>
                        <div className="font-semibold text-slate-900">₹{Math.max(0, priceInr - 500 - Math.max(0, locationExtraInr))}</div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <div className="text-slate-600">Location extra charge</div>
                        <div className="font-semibold text-slate-900">₹{Math.max(0, locationExtraInr)}</div>
                      </div>
                      <div className="mt-2 h-px w-full bg-slate-200" />
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <div className="font-semibold text-slate-900">Total price</div>
                        <div className="font-extrabold text-slate-900">₹{priceInr}</div>
                      </div>

                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
                        <div className="font-semibold text-amber-950">Advance payment (mandatory)</div>
                        <div className="mt-1 text-amber-900">Pay ₹500 now to confirm booking. Remaining amount can be paid later.</div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-amber-900">Pay now</div>
                          <div className="font-extrabold text-amber-950">₹500</div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-amber-900">Pay later</div>
                          <div className="font-semibold text-amber-950">₹{Math.max(0, priceInr - 500)}</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : null}

              {wizardStep === 4 ? (
                <div className="space-y-3">
                  <Card title="Booking summary" subtitle="Confirm details and create booking" accent="violet">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-medium text-slate-600">Customer</div>
                        <div className="mt-1 font-semibold text-slate-900">{dialog?.customer?.fullName || '—'}</div>
                        <div className="mt-1 text-xs text-slate-600">{dialog?.customer?.mobile || '—'}</div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-medium text-slate-600">Payment</div>
                        <div className="mt-1 font-semibold text-slate-900">Advance: ₹500</div>
                        <div className="mt-1 text-xs text-slate-600">
                          Remaining: ₹{Math.max(0, priceInr - 500)} · Pay later
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
                        <div className="text-xs font-medium text-slate-600">Slot</div>
                        <div className="mt-1 font-semibold text-slate-900">
                          {wizardForm.slotDate && wizardForm.slotTime
                            ? slotDisplay(wizardForm.slotDate, wizardForm.slotTime)
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-500">
                  {wizardStep === 2 ? 'Select a date first to enable time slots.' : null}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (!raiseOpen) return
                      if (wizardStep <= 1) setDialog(null)
                      else setDialog((s) => (s && s.type === 'raise' ? { ...s, step: Math.max(1, wizardStep - 1) } : s))
                    }}
                  >
                    Back
                  </Button>

                  {wizardStep < 4 ? (
                    <Button
                      onClick={() => {
                        if (!raiseOpen) return
                        if (wizardStep === 1) {
                          if (!String(wizardForm.makeId || '').trim()) return
                          if (!String(wizardForm.modelId || '').trim()) return
                          if (!String(wizardForm.variantId || '').trim()) return
                          if (!String(wizardForm.category || '').trim()) return
                          setDialog((s) => (s && s.type === 'raise' ? { ...s, step: 2 } : s))
                          return
                        }
                        if (wizardStep === 2) {
                          if (!wizardForm.slotDate || !wizardForm.slotTime) return
                          setDialog((s) => (s && s.type === 'raise' ? { ...s, step: 3 } : s))
                          return
                        }
                        if (wizardStep === 3) {
                          setDialog((s) => (s && s.type === 'raise' ? { ...s, step: 4 } : s))
                        }
                      }}
                      disabled={
                        (wizardStep === 1 &&
                          (!String(wizardForm.makeId || '').trim() ||
                            !String(wizardForm.modelId || '').trim() ||
                            !String(wizardForm.variantId || '').trim() ||
                            !String(wizardForm.category || '').trim())) ||
                        (wizardStep === 2 && (!wizardForm.slotDate || !wizardForm.slotTime))
                      }
                    >
                      {wizardStep === 1 ? 'Select Date & Time' : wizardStep === 3 ? 'Review & Pay' : 'Next'}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={async () => {
                        try {
                          const c = dialog?.customer
                          if (!c?.id) throw new Error('Customer missing')
                          if (!wizardForm.slotDate || !wizardForm.slotTime) throw new Error('Slot is required')

                          const makeName = wizardForm.makeId ? makeById.get(wizardForm.makeId)?.name : ''
                          const modelName = wizardForm.modelId ? modelById.get(wizardForm.modelId)?.name : ''
                          const variantName = wizardForm.variantId ? variantById.get(wizardForm.variantId)?.name : ''
                          const slotAt = joinDateTimeLocal(wizardForm.slotDate, wizardForm.slotTime)

                          const res = await mockApi.createPdiRequestFromCustomer({
                            actor,
                            customerId: c.id,
                            priceInr,
                            advancePaidInr: 500,
                            dueInr: Math.max(0, priceInr - 500),
                            vehicleType: wizardForm.vehicleType,
                            make: makeName,
                            model: modelName,
                            variant: variantName,
                            category: wizardForm.category,
                            slotAt,
                            locationId: String(wizardForm.locationId || '').trim() || 'LOC-DUMMY',
                            paymentMethod: 'advance',
                            paymentProvider: 'advance',
                            address: '',
                            reason: 'Advance payment booking',
                          })

                          setDialog({ type: 'bookingSummary', customer: c, pdiId: res?.id })
                        } catch (e) {
                          // eslint-disable-next-line no-alert
                          alert(e.message || 'Action failed')
                        }
                      }}
                    >
                      Pay ₹500 & Book Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
