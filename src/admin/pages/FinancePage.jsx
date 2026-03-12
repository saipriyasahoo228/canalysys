import { useMemo, useState } from 'react'
import { CheckCircle2, Eye, IndianRupee, ReceiptText, Search, Settings2, Wallet, Plus, Percent, Calendar, XCircle } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, Input, PaginatedTable, Select } from '../ui/Ui'
import { CustomDatePicker } from '../ui/CustomDatePicker'
import { ReasonDialog } from '../ui/ReasonDialog'
import { ViewDetailsDialog } from '../ui/ViewDetailsDialog'
import { formatDateTime, formatInr } from '../utils/format'
import { listCommissionRules, createGlobalCommissionRule, createInspectorCommissionRule, getCommissionReport, getMyCommissionReport } from '../../api/commission'
import { listInspectors } from '../../api/inspectoronboard'

export function FinancePage() {
  const { locationId, permissions, actor } = useRbac()
  
  // Commission rules data
  const { data: rulesData, loading: rulesLoading, error: rulesError, refresh: refreshRules } = usePolling(
    'commission-rules',
    () => listCommissionRules(),
    { intervalMs: 30_000 }
  )
  
  // Inspectors data for dropdowns
  const { data: inspectorsData, loading: inspectorsLoading } = usePolling(
    'inspectors-list',
    () => listInspectors({ locationId: locationId || undefined }),
    { intervalMs: 60_000 }
  )
  
  const commissionRules = rulesData?.items || []
  const inspectors = inspectorsData?.inspectors || []

  const inspectorById = useMemo(() => {
    const m = new Map()
    for (const i of inspectors) m.set(i.id, i)
    return m
  }, [inspectors])

  // Commission report state
  const [reportFilters, setReportFilters] = useState({
    from: '',
    to: '',
    inspector_id: ''
  })
  const [reportData, setReportData] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState(null)
  
  // Dialog states
  const [dialog, setDialog] = useState(null)
  const [snack, setSnack] = useState({ open: false, tone: 'info', title: '', message: '' })
  
  const viewOpen = dialog?.type === 'view'
  const globalRuleOpen = dialog?.type === 'globalRule'
  const inspectorRuleOpen = dialog?.type === 'inspectorRule'

  const showSnack = (next) => {
    setSnack({ open: true, tone: next?.tone || 'info', title: next?.title || '', message: next?.message || '' })
  }
  
  const responseToMessage = (res) => {
    if (!res) return ''
    if (typeof res === 'string') return res
    if (typeof res?.error === 'string') return res.error
    if (typeof res?.msg === 'string') return res.msg
    if (typeof res?.message === 'string') return res.message
    if (typeof res?.detail === 'string') return res.detail
    return ''
  }

  // Fetch commission report
  const fetchCommissionReport = async () => {
    if (!reportFilters.from || !reportFilters.to) {
      showSnack({ tone: 'danger', title: 'Error', message: 'From and To dates are required' })
      return
    }
    
    setReportLoading(true)
    setReportError(null)
    try {
      const data = actor?.role === 'inspector' 
        ? await getMyCommissionReport(reportFilters.from, reportFilters.to)
        : await getCommissionReport(reportFilters.from, reportFilters.to, reportFilters.inspector_id || null)
      setReportData(data)
    } catch (error) {
      setReportError(error)
      setReportData(null)
      showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(error) || 'Failed to load commission report' })
    } finally {
      setReportLoading(false)
    }
  }

  // Commission rules columns
  const rulesColumns = useMemo(
    () => [
      {
        key: 'scope',
        header: 'Scope',
        exportValue: (r) => r.scope,
        cell: (r) => (
          <Badge tone={r.scope === 'global' ? 'cyan' : 'violet'}>
            {r.scope === 'global' ? 'Global' : `Inspector: ${r.inspector_name}`}
          </Badge>
        ),
      },
      {
        key: 'commission_type',
        header: 'Type',
        exportValue: (r) => r.commission_type,
        cell: (r) => (
          <div className="flex items-center gap-1">
            {r.commission_type === 'percent' ? <Percent className="h-4 w-4" /> : <IndianRupee className="h-4 w-4" />}
            <span className="capitalize">{r.commission_type}</span>
          </div>
        ),
      },
      {
        key: 'amount',
        header: 'Commission',
        exportValue: (r) => r.commission_type === 'percent' ? `${r.percent}%` : formatInr(r.fixed_amount_paise),
        cell: (r) => (
          <span className="font-semibold">
            {r.commission_type === 'percent' ? `${r.percent}%` : formatInr(r.fixed_amount_paise)}
          </span>
        ),
      },
      {
        key: 'effective_from',
        header: 'Effective From',
        exportValue: (r) => r.effective_from,
        cell: (r) => <div className="text-sm text-slate-600">{formatDateTime(r.effective_from)}</div>,
      },
      {
        key: 'effective_to',
        header: 'Effective To',
        exportValue: (r) => r.effective_to,
        cell: (r) => <div className="text-sm text-slate-600">{r.effective_to ? formatDateTime(r.effective_to) : 'Ongoing'}</div>,
      },
      {
        key: 'status',
        header: 'Status',
        exportValue: (r) => r.is_active ? 'Active' : 'Inactive',
        cell: (r) => (
          <Badge tone={r.is_active ? 'emerald' : 'slate'}>
            {r.is_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: <div className="w-full pr-6 text-right">Actions</div>,
        cell: (r) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="icon" size="icon" onClick={() => setDialog({ type: 'view', item: r })} title={'View'}>
              <Eye className="h-4 w-4 text-slate-700" />
            </Button>
          </div>
        ),
        className: 'text-right',
        tdClassName: 'text-right',
      },
    ],
    []
  )
  
  // Commission report columns
  const reportColumns = useMemo(
    () => [
      {
        key: 'inspector',
        header: 'Inspector',
        exportValue: (r) => `${r.inspector_name} (${r.inspector_id})`,
        cell: (r) => (
          <div>
            <div className="text-sm font-semibold">{r.inspector_name}</div>
            <div className="text-xs text-slate-500">{r.inspector_id}</div>
          </div>
        ),
      },
      {
        key: 'completed_count',
        header: 'Completed Inspections',
        exportValue: (r) => r.completed_count,
        cell: (r) => <div className="text-sm text-slate-700">{r.completed_count}</div>,
        className: 'text-right',
        tdClassName: 'text-right',
      },
      {
        key: 'total_amount_paise',
        header: 'Total Amount',
        exportValue: (r) => formatInr(r.total_amount_paise),
        cell: (r) => <div className="text-sm font-semibold">{formatInr(r.total_amount_paise)}</div>,
        className: 'text-right',
        tdClassName: 'text-right',
      },
      {
        key: 'total_commission_paise',
        header: 'Total Commission',
        exportValue: (r) => formatInr(r.total_commission_paise),
        cell: (r) => <div className="text-sm font-semibold text-emerald-600">{formatInr(r.total_commission_paise)}</div>,
        className: 'text-right',
        tdClassName: 'text-right',
      },
    ],
    []
  )

  // View items for commission rules
  const viewItems = useMemo(() => {
    if (!dialog || dialog.type !== 'view') return []
    const it = dialog.item
    return [
      { key: 'id', label: 'Rule ID', value: it?.id || '—' },
      { key: 'scope', label: 'Scope', value: it?.scope === 'global' ? 'Global' : `Inspector: ${it?.inspector_name}` },
      { key: 'commission_type', label: 'Commission Type', value: it?.commission_type || '—' },
      { key: 'amount', label: 'Commission Amount', value: it?.commission_type === 'percent' ? `${it?.percent}%` : formatInr(it?.fixed_amount_paise) },
      { key: 'effective_from', label: 'Effective From', value: formatDateTime(it?.effective_from) },
      { key: 'effective_to', label: 'Effective To', value: it?.effective_to ? formatDateTime(it?.effective_to) : 'Ongoing' },
      { key: 'status', label: 'Status', value: it?.is_active ? 'Active' : 'Inactive' },
      { key: 'inspector', label: 'Inspector', value: it?.inspector_name || '—' },
      { key: 'created_by', label: 'Created By', value: it?.created_by_name || '—' },
      { key: 'created_at', label: 'Created At', value: formatDateTime(it?.created_at) },
    ]
  }, [dialog])

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Commission Management</h1>
            <p className="mt-1 text-sm sm:text-base text-slate-600">Configure commission rules and generate reports</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={async () => refreshRules()} variant="outline" size="sm">
              <Settings2 className="h-4 w-4 mr-2" />
              Refresh Rules
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-50 to-cyan-100">
            <div className="relative p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-cyan-600">Commission Rules</p>
                  <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-cyan-900">
                    {rulesLoading && !rulesData ? '—' : commissionRules.length}
                  </p>
                  <p className="mt-1 text-xs text-cyan-700">Active rules configured</p>
                </div>
                <div className="ml-3 sm:ml-4 rounded-full bg-cyan-200 p-2 sm:p-3">
                  <Settings2 className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-700" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
            <div className="relative p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-emerald-600">Report Total</p>
                  <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-emerald-900">
                    {reportLoading ? '—' : formatInr(reportData?.items ? reportData.items.reduce((acc, r) => acc + (r.total_commission_paise || 0), 0) : 0)}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">Commission amount</p>
                </div>
                <div className="ml-3 sm:ml-4 rounded-full bg-emerald-200 p-2 sm:p-3">
                  <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-700" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-violet-100">
            <div className="relative p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-violet-600">Report Entries</p>
                  <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-violet-900">
                    {reportLoading ? '—' : (reportData?.items ? reportData.items.reduce((acc, r) => acc + (r.completed_count || 0), 0) : 0)}
                  </p>
                  <p className="mt-1 text-xs text-violet-700">Completed inspections</p>
                </div>
                <div className="ml-3 sm:ml-4 rounded-full bg-violet-200 p-2 sm:p-3">
                  <ReceiptText className="h-5 w-5 sm:h-6 sm:w-6 text-violet-700" />
                </div>
              </div>
            </div>
          </Card>
        </div>

      {rulesError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-sm">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-rose-600" />
            Failed to load commission rules. Please try again.
          </div>
        </div>
      ) : null}
      
      {reportError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-sm">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-rose-600" />
            Failed to load commission report. Please check your filters and try again.
          </div>
        </div>
      ) : null}

      <div className="space-y-6">
        {/* Commission Rules Section */}
        <Card className="border-0 shadow-xl bg-white">
          <div className="border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">Commission Rules</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">Global and inspector-specific configurations</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                {permissions.managePricing && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setDialog({ type: 'globalRule' })}
                      className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Global Rule
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDialog({ type: 'inspectorRule' })}
                      className="border-violet-200 text-violet-700 hover:bg-violet-50 w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Inspector Rule
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className={rulesLoading && !rulesData ? 'opacity-60' : ''}>
              {commissionRules.length === 0 && !rulesLoading ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Settings2 className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">No commission rules</h3>
                  <p className="text-sm text-slate-600 mb-4">Create your first commission rule to get started</p>
                  {permissions.managePricing && (
                    <Button
                      variant="primary"
                      onClick={() => setDialog({ type: 'globalRule' })}
                      className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Global Rule
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <PaginatedTable
                    columns={rulesColumns}
                    rows={commissionRules}
                    rowKey={(r) => r.id}
                    initialRowsPerPage={10}
                    rowsPerPageOptions={[10, 20, 50, 'all']}
                    enableSearch
                    searchPlaceholder="Search commission rules…"
                    enableExport
                    exportFilename="commission-rules.csv"
                    className="border-0 min-w-[600px]"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Commission Report Section */}
        <Card className="border-0 shadow-xl bg-white">
          <div className="border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">Commission Report</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">Generate reports based on completed inspections</p>
              </div>
              <Button 
                onClick={fetchCommissionReport} 
                disabled={reportLoading}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 w-full sm:w-auto"
              >
                {reportLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <ReceiptText className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {/* Report Filters */}
            <div className="mb-4 sm:mb-6 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center">
                  <Search className="h-4 w-4 mr-2" />
                  Report Filters
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-700">From Date *</label>
                  <CustomDatePicker
                    value={reportFilters.from}
                    onChange={(value) => setReportFilters(prev => ({ ...prev, from: value }))}
                    placeholder="dd/mm/yyyy"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-700">To Date *</label>
                  <CustomDatePicker
                    value={reportFilters.to}
                    onChange={(value) => setReportFilters(prev => ({ ...prev, to: value }))}
                    placeholder="dd/mm/yyyy"
                    className="w-full"
                  />
                </div>
                {actor?.role !== 'inspector' && (
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-700">Inspector (Optional)</label>
                    <select
                      value={reportFilters.inspector_id}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, inspector_id: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">All Inspectors</option>
                      {inspectors.map(i => (
                        <option key={i.user_id} value={i.user_id}>{i.name} ({i.user_id})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className={reportLoading ? 'opacity-60' : ''}>
              {reportData ? (
                <div className="overflow-x-auto">
                  <PaginatedTable
                    columns={reportColumns}
                    rows={Array.isArray(reportData) ? reportData : (reportData.items || [])}
                    rowKey={(r, index) => r.inspector_id || index}
                    initialRowsPerPage={10}
                    rowsPerPageOptions={[10, 20, 50, 'all']}
                    enableSearch
                    searchPlaceholder="Search report…"
                    enableExport
                    exportFilename="commission-report.csv"
                    className="border-0 min-w-[600px]"
                  />
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <ReceiptText className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">No Report Data</h3>
                  <p className="text-sm text-slate-600 mb-4">Set date filters and click "Generate Report" to view commission data</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <ViewDetailsDialog open={viewOpen} title="View commission rule" onClose={() => setDialog(null)} items={viewItems} accent="cyan" />

      {/* Global Commission Rule Dialog */}
      <ReasonDialog
        open={globalRuleOpen}
        title="Create Global Commission Rule"
        description="Create a global commission rule that applies to all inspectors unless overridden."
        submitLabel="Create Rule"
        onClose={() => setDialog(null)}
        showReason={false}
        requireReason={false}
        fields={[
          {
            name: 'commission_type',
            label: 'Commission Type *',
            type: 'select',
            defaultValue: 'percent',
            options: [
              { value: 'percent', label: 'Percentage' },
              { value: 'fixed', label: 'Fixed Amount' },
            ],
          },
          {
            name: 'percent',
            label: 'Percentage (%) *',
            type: 'number',
            defaultValue: '',
            placeholder: 'e.g. 12.5',
            step: '0.01',
            min: '0',
            max: '100',
            condition: (form) => form.commission_type === 'percent',
          },
          {
            name: 'fixed_amount_paise',
            label: 'Fixed Amount (INR) *',
            type: 'number',
            defaultValue: '',
            placeholder: 'e.g. 500',
            step: '0.01',
            min: '0',
            condition: (form) => form.commission_type === 'fixed',
          },
          {
            name: 'effective_from',
            label: 'Effective From (Optional)',
            type: 'datetime-local',
            defaultValue: '',
          },
          {
            name: 'is_active',
            label: 'Active',
            type: 'checkbox',
            defaultValue: true,
            checkboxLabel: 'Enable this commission rule',
            className: 'flex items-start space-x-2',
          },
        ]}
        onSubmit={async (form) => {
          try {
            if (!permissions.managePricing) throw new Error('Insufficient permission')
            
            const payload = {
              commission_type: form.commission_type,
              is_active: form.is_active,
            }
            
            if (form.commission_type === 'percent') {
              if (!form.percent || parseFloat(form.percent) <= 0) {
                showSnack({ tone: 'danger', title: 'Error', message: 'Percentage must be greater than 0' })
                return
              }
              payload.percent = parseFloat(form.percent)
            } else {
              if (!form.fixed_amount_paise || parseFloat(form.fixed_amount_paise) <= 0) {
                showSnack({ tone: 'danger', title: 'Error', message: 'Fixed amount must be greater than 0' })
                return
              }
              payload.fixed_amount_paise = Math.round(parseFloat(form.fixed_amount_paise) * 100) // Convert INR to paise
            }
            
            if (form.effective_from) {
              payload.effective_from = form.effective_from
            }
            
            const result = await createGlobalCommissionRule(payload)
            showSnack({ tone: 'success', title: 'Success', message: result.message || 'Global commission rule created successfully' })
            refreshRules()
            setDialog(null)
          } catch (e) {
            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Failed to create global commission rule' })
          }
        }}
      />

      {/* Inspector Commission Rule Dialog */}
      <ReasonDialog
        open={inspectorRuleOpen}
        title="Create Inspector Commission Rule"
        description="Create a commission rule override for a specific inspector. This takes priority over global rules."
        submitLabel="Create Rule"
        onClose={() => setDialog(null)}
        showReason={false}
        requireReason={false}
        fields={[
          {
            name: 'inspector_id',
            label: 'Inspector *',
            type: 'select',
            defaultValue: '',
            options: inspectors.map(i => ({ value: i.user_id, label: `${i.name} (${i.user_id})` })),
          },
          {
            name: 'commission_type',
            label: 'Commission Type *',
            type: 'select',
            defaultValue: 'percent',
            options: [
              { value: 'percent', label: 'Percentage' },
              { value: 'fixed', label: 'Fixed Amount' },
            ],
          },
          {
            name: 'percent',
            label: 'Percentage (%) *',
            type: 'number',
            defaultValue: '',
            placeholder: 'e.g. 12.5',
            step: '0.01',
            min: '0',
            max: '100',
            condition: (form) => form.commission_type === 'percent',
          },
          {
            name: 'fixed_amount_paise',
            label: 'Fixed Amount (INR) *',
            type: 'number',
            defaultValue: '',
            placeholder: 'e.g. 500',
            step: '0.01',
            min: '0',
            condition: (form) => form.commission_type === 'fixed',
          },
          {
            name: 'effective_from',
            label: 'Effective From (Optional)',
            type: 'datetime-local',
            defaultValue: '',
          },
          {
            name: 'is_active',
            label: 'Active',
            type: 'checkbox',
            defaultValue: true,
            checkboxLabel: 'Enable this commission rule',
            className: 'flex items-start space-x-2',
          },
        ]}
        onSubmit={async (form) => {
          try {
            if (!permissions.managePricing) throw new Error('Insufficient permission')
            
            if (!form.inspector_id) {
              showSnack({ tone: 'danger', title: 'Error', message: 'Please select an inspector' })
              return
            }
            
            const payload = {
              commission_type: form.commission_type,
              is_active: form.is_active,
            }
            
            if (form.commission_type === 'percent') {
              if (!form.percent || parseFloat(form.percent) <= 0) {
                showSnack({ tone: 'danger', title: 'Error', message: 'Percentage must be greater than 0' })
                return
              }
              payload.percent = parseFloat(form.percent)
            } else {
              if (!form.fixed_amount_paise || parseFloat(form.fixed_amount_paise) <= 0) {
                showSnack({ tone: 'danger', title: 'Error', message: 'Fixed amount must be greater than 0' })
                return
              }
              payload.fixed_amount_paise = Math.round(parseFloat(form.fixed_amount_paise) * 100) // Convert INR to paise
            }
            
            if (form.effective_from) {
              payload.effective_from = form.effective_from
            }
            
            const result = await createInspectorCommissionRule(form.inspector_id, payload)
            showSnack({ tone: 'success', title: 'Success', message: result.message || 'Inspector commission rule created successfully' })
            refreshRules()
            setDialog(null)
          } catch (e) {
            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Failed to create inspector commission rule' })
          }
        }}
      />

      {/* Enhanced Snackbar for notifications */}
      {snack.open && (
        <div className="fixed bottom-6 right-6 z-50 animate-pulse">
          <div className={`rounded-lg shadow-2xl border p-4 min-w-[280px] sm:min-w-[320px] transform transition-all duration-300 ${
            snack.tone === 'success' ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200' :
            snack.tone === 'danger' ? 'bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200' :
            'bg-gradient-to-r from-cyan-50 to-cyan-100 border-cyan-200'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {snack.tone === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                ) : snack.tone === 'danger' ? (
                  <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-rose-600" />
                ) : (
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <div className={`font-semibold text-sm ${
                  snack.tone === 'success' ? 'text-emerald-900' :
                  snack.tone === 'danger' ? 'text-rose-900' :
                  'text-cyan-900'
                }`}>
                  {snack.title}
                </div>
                <div className={`mt-1 text-sm ${
                  snack.tone === 'success' ? 'text-emerald-700' :
                  snack.tone === 'danger' ? 'text-rose-700' :
                  'text-cyan-700'
                }`}>
                  {snack.message}
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => setSnack((s) => ({ ...s, open: false }))}
                  className={`inline-flex rounded-md p-1 hover:bg-opacity-20 ${
                    snack.tone === 'success' ? 'hover:bg-emerald-200' :
                    snack.tone === 'danger' ? 'hover:bg-rose-200' :
                    'hover:bg-cyan-200'
                  }`}
                >
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
