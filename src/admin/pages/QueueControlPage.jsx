import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock, Eye, Gauge, Search, User, UserCheck, AlertTriangle, RefreshCw, LayoutGrid, Table, X } from 'lucide-react'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, Input, PaginatedTable, cx } from '../ui/Ui'
import { formatDate, formatDateTime } from '../utils/format'
import { getInspectorDashboardData } from '../../api/inspectionreport'

function statusTone(status) {
  if (status === 'completed') return 'emerald'
  if (status === 'in_progress') return 'cyan'
  if (status === 'pending') return 'amber'
  if (status === 'cancelled') return 'rose'
  return 'slate'
}

function statusLabel(status) {
  if (status === 'completed') return 'Completed'
  if (status === 'in_progress') return 'In Progress'
  if (status === 'pending') return 'Pending'
  if (status === 'cancelled') return 'Cancelled'
  return status || '—'
}

function priorityTone(priority) {
  if (priority === 'high') return 'rose'
  if (priority === 'medium') return 'amber'
  return 'slate'
}

function StarRating({ rating, size = 'sm' }) {
  if (!rating) {
    return <div className="text-xs text-slate-400">No rating</div>
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const starSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className={`${starSize[size]} text-amber-500`}>
            {'★'}
          </span>
        ))}
        {/* Half star */}
        {hasHalfStar && (
          <span className={`${starSize[size]} text-amber-500 relative`}>
            {'★'}
            <span className="absolute inset-0 text-slate-300 overflow-hidden" style={{ width: '50%' }}>
              {'★'}
            </span>
          </span>
        )}
        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className={`${starSize[size]} text-slate-300`}>
            {'★'}
          </span>
        ))}
      </div>
      <span className={`${sizeClasses[size]} text-slate-600 ml-1`}>
        {rating.toFixed(1)}
      </span>
    </div>
  )
}

export function QueueControlPage() {
  const { locationId } = useRbac()

  useEffect(() => {
    document.title = 'Inspector Report · PDI Admin'
  }, [])

  // State for API data
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getInspectorDashboardData()
      console.log('✅ Dashboard data fetched:', response)
      setDashboardData(response)
    } catch (err) {
      console.error('❌ Failed to fetch dashboard data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Process inspector data from API response
  const inspectorStats = useMemo(() => {
    if (!dashboardData?.items) return []

    return dashboardData.items.map(inspector => {
      const inspections = [
        ...(inspector.assigned_pdi_requests || []).map(request => ({
          ...request,
          status: request.status === 'confirmed' ? 'pending' : request.status,
          rating: null,
          customer_feedback: null,
          vehicle_make: request.brand_name || 'N/A',
          vehicle_model: request.model_name || 'N/A',
          vehicle_variant: request.variant_name || 'N/A',
          vehicle_category: request.category_name || 'N/A',
          vehicle_year: request.vehicle_year || 'N/A',
          vehicle_fuel_type: request.vehicle_fuel_type || 'N/A'
        })),
        ...(inspector.completed_inspections || []).map(inspection => {
          const feedback = inspector.feedbacks?.find(f => f.execution_id === inspection.execution_id)
          return {
            ...inspection,
            status: 'completed',
            rating: feedback?.rating || null,
            customer_feedback: feedback?.feedback || null,
            request_id: inspection.request_id,
            vehicle_make: inspection.brand_name || 'N/A',
            vehicle_model: inspection.model_name || 'N/A',
            vehicle_variant: inspection.variant_name || 'N/A',
            vehicle_category: inspection.category_name || 'N/A',
            vehicle_year: inspection.vehicle_year || 'N/A',
            vehicle_fuel_type: inspection.vehicle_fuel_type || 'N/A',
            customer_name: inspection.customer_name
          }
        })
      ]

      const totalInspections = inspector.assigned_pdi_requests_count || 0
      const completedInspections = inspector.completed_inspections_count || 0
      const pendingInspections = inspector.pending_inspections_count || 0
      const inProgressInspections = 0 // Not available in API response

      return {
        user_id: inspector.inspector_id,
        name: inspector.inspector_name,
        email: inspector.email || 'N/A', // Available in API response
        mobile_number: inspector.mobile_number || 'N/A', // Available in API response
        active: true,
        totalInspections,
        completedInspections,
        inProgressInspections,
        pendingInspections,
        completionRate: totalInspections > 0 ? Math.round((completedInspections / totalInspections) * 100) : 0,
        avgRating: inspector.avg_rating || 0,
        ratingsCount: inspector.ratings_count || 0,
        inspections
      }
    })
  }, [dashboardData])

  // Get all PDI requests from all inspectors
  const pdiRequests = useMemo(() => {
    if (!inspectorStats.length) return []
    
    return inspectorStats.flatMap(inspector => inspector.inspections || [])
  }, [inspectorStats])

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const total = pdiRequests.length
    const completed = pdiRequests.filter(r => r.status === 'completed').length
    const inProgress = pdiRequests.filter(r => r.status === 'in_progress').length
    const pending = pdiRequests.filter(r => r.status === 'pending').length
    const avgCompletionRate = inspectorStats.length > 0 
      ? Math.round(inspectorStats.reduce((sum, i) => sum + i.completionRate, 0) / inspectorStats.length)
      : 0

    return {
      total,
      completed,
      inProgress,
      pending,
      avgCompletionRate
    }
  }, [pdiRequests, inspectorStats])

  const [selectedInspector, setSelectedInspector] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('cards') // 'cards' or 'table'
  const [inspectionsModal, setInspectionsModal] = useState({ open: false, inspector: null })

  // Filter inspector stats based on search
  const filteredInspectorStats = useMemo(() => {
    if (!searchQuery) return inspectorStats
    const query = searchQuery.toLowerCase()
    return inspectorStats.filter(inspector => 
      inspector.name?.toLowerCase().includes(query) ||
      inspector.user_id?.toLowerCase().includes(query)
    )
  }, [inspectorStats, searchQuery])

  // Prepare table data for selected inspector's inspections
  const selectedInspectorInspections = useMemo(() => {
    if (!selectedInspector) return []
    return selectedInspector.inspections || []
  }, [selectedInspector])

  // Inspector table columns
  const inspectorTableColumns = useMemo(
    () => [
      {
        key: 'inspector_info',
        header: 'Inspector',
        exportValue: (r) => `${r.name} (${r.user_id})`,
        cell: (r) => (
          <div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-600" />
              <div className="text-sm font-semibold">{r.name}</div>
            </div>
            <div className="text-xs text-slate-500">{r.user_id}</div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        exportValue: (r) => r.active ? 'Active' : 'Inactive',
        cell: (r) => <Badge tone={r.active ? 'emerald' : 'rose'}>{r.active ? 'Active' : 'Inactive'}</Badge>,
      },
      {
        key: 'total_inspections',
        header: 'Total',
        exportValue: (r) => r.totalInspections,
        cell: (r) => <div className="text-sm font-semibold">{r.totalInspections}</div>,
      },
      {
        key: 'completed_inspections',
        header: 'Completed',
        exportValue: (r) => r.completedInspections,
        cell: (r) => <div className="text-sm font-semibold text-emerald-700">{r.completedInspections}</div>,
      },
      {
        key: 'in_progress_inspections',
        header: 'In Progress',
        exportValue: (r) => r.inProgressInspections,
        cell: (r) => <div className="text-sm font-semibold text-cyan-700">{r.inProgressInspections}</div>,
      },
      {
        key: 'pending_inspections',
        header: 'Pending',
        exportValue: (r) => r.pendingInspections,
        cell: (r) => <div className="text-sm font-semibold text-amber-700">{r.pendingInspections}</div>,
      },
      {
        key: 'completion_rate',
        header: 'Completion Rate',
        exportValue: (r) => `${r.completionRate}%`,
        cell: (r) => (
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold">{r.completionRate}%</div>
            <div className="h-2 w-12 rounded-full bg-slate-200">
              <div 
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${r.completionRate}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        key: 'workload_alert',
        header: 'Alert',
        exportValue: (r) => r.inProgressInspections >= 3 ? 'High workload' : 'Normal',
        cell: (r) => (
          r.inProgressInspections >= 3 ? (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              <Badge tone="amber">High workload</Badge>
            </div>
          ) : (
            <div className="text-xs text-slate-500">Normal</div>
          )
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        exportValue: () => '',
        cell: (r) => (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setInspectionsModal({ open: true, inspector: r })}
          >
            <Eye className="h-3 w-3" />
            View Inspections
          </Button>
        ),
      },
    ],
    []
  )

  const inspectionColumns = useMemo(
    () => [
      {
        key: 'request_id',
        header: 'Request ID',
        exportValue: (r) => r.request_id,
        cell: (r) => <div className="text-sm font-mono">{r.request_id}</div>,
      },
      {
        key: 'vehicle_info',
        header: 'Vehicle',
        exportValue: (r) => `${r.brand_name || r.vehicle_make} ${r.model_name || r.vehicle_model} ${r.variant_name || ''} (${r.category_name || 'N/A'}) - ${r.vehicle_type || 'N/A'}`,
        cell: (r) => (
          <div>
            <div className="text-sm font-semibold">
              {r.brand_name || r.vehicle_make} {r.model_name || r.vehicle_model}
            </div>
            <div className="text-xs text-slate-500">
              {r.variant_name || 'N/A'} • {r.category_name || 'N/A'} • {r.vehicle_type || 'N/A'}
            </div>
          </div>
        ),
      },
      {
        key: 'customer_name',
        header: 'Customer',
        exportValue: (r) => r.customer_name,
        cell: (r) => <div className="text-sm">{r.customer_name || '—'}</div>,
      },
      {
        key: 'status',
        header: 'Status',
        exportValue: (r) => r.status,
        cell: (r) => <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge>,
      },
      {
        key: 'priority',
        header: 'Priority',
        exportValue: (r) => r.priority || 'normal',
        cell: (r) => <Badge tone={priorityTone(r.priority)}>{r.priority || 'Normal'}</Badge>,
      },
      {
        key: 'rating',
        header: 'Rating',
        exportValue: (r) => r.rating ? `${r.rating.toFixed(1)}` : 'No rating',
        cell: (r) => <StarRating rating={r.rating} size="sm" />,
      },
      {
        key: 'customer_feedback',
        header: 'Feedback',
        exportValue: (r) => r.customer_feedback || '—',
        cell: (r) => (
          <div className="max-w-xs">
            <div className="text-xs text-slate-600 truncate" title={r.customer_feedback || 'No feedback'}>
              {r.customer_feedback || '—'}
            </div>
          </div>
        ),
      },
      {
        key: 'created_at',
        header: 'Created',
        exportValue: (r) => r.created_at,
        cell: (r) => <div className="text-xs text-slate-600">{formatDateTime(r.created_at)}</div>,
      },
      {
        key: 'updated_at',
        header: 'Updated',
        exportValue: (r) => r.updated_at,
        cell: (r) => <div className="text-xs text-slate-600">{formatDateTime(r.updated_at)}</div>,
      },
    ],
    []
  )

  const handleRefresh = () => {
    fetchDashboardData()
  }

  return (
    <div className="space-y-3">
      {/* Error State */}
      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <div className="text-sm text-rose-800">Failed to load inspector data</div>
            <Button variant="primary" size="sm" onClick={fetchDashboardData}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-slate-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading inspector data...</span>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Overall Statistics */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card accent="cyan" className="p-0" kpi>
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-cyan-700" />
              <div className="text-xs text-slate-600">Active Inspectors</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">
              {inspectorStats.length}
            </div>
            <div className="mt-1 text-xs text-slate-500">Currently available</div>
          </div>
        </Card>

        <Card accent="emerald" className="p-0" kpi>
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              <div className="text-xs text-slate-600">Completed</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">
              {overallStats.completed}
            </div>
            <div className="mt-1 text-xs text-slate-500">Inspections done</div>
          </div>
        </Card>

        <Card accent="amber" className="p-0" kpi>
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-700" />
              <div className="text-xs text-slate-600">In Progress</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">
              {overallStats.inProgress}
            </div>
            <div className="mt-1 text-xs text-slate-500">Currently working</div>
          </div>
        </Card>

        <Card accent="violet" className="p-0" kpi>
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-violet-700" />
              <div className="text-xs text-slate-600">Avg Completion</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">
              {overallStats.avgCompletionRate}%
            </div>
            <div className="mt-1 text-xs text-slate-500">Success rate</div>
          </div>
        </Card>
      </div>

      {/* Inspector List */}
      <Card
        title="PDI Inspectors"
        subtitle="View inspection workload and performance metrics for each inspector"
        accent="cyan"
        right={
          <div className="flex items-center gap-2">
            {/* View Toggle Buttons */}
            <div className="flex items-center rounded-lg border border-slate-300 bg-slate-50 p-1">
              <Button
                variant={viewMode === 'cards' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-7 px-2 text-xs"
              >
                <LayoutGrid className="h-3 w-3" />
                Cards
              </Button>
              <Button
                variant={viewMode === 'table' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-7 px-2 text-xs"
              >
                <Table className="h-3 w-3" />
                Table
              </Button>
            </div>
            <Button onClick={handleRefresh} className="ml-1">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        }
      >
        {/* Search */}
        <div className="mb-4">
          <Input
            placeholder="Search inspectors by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Conditional Rendering: Cards or Table View */}
        {viewMode === 'cards' ? (
          /* Card View */
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredInspectorStats.map((inspector) => (
              <Card
                key={inspector.user_id}
                accent={selectedInspector?.user_id === inspector.user_id ? 'emerald' : 'slate'}
                className="cursor-pointer transition hover:shadow-md"
                onClick={() => setSelectedInspector(inspector)}
              >
                <div className="space-y-3">
                  {/* Inspector Info */}
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-600" />
                        <div className="text-sm font-semibold truncate">{inspector.name}</div>
                      </div>
                      <div className="text-xs text-slate-500">{inspector.user_id}</div>
                      {inspector.email && (
                        <div className="text-xs text-slate-600 truncate">{inspector.email}</div>
                      )}
                    </div>
                    <Badge tone={inspector.active ? 'emerald' : 'rose'}>
                      {inspector.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                      <div className="font-semibold text-slate-900">{inspector.totalInspections}</div>
                      <div className="text-slate-600">Total</div>
                    </div>
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2">
                      <div className="font-semibold text-emerald-900">{inspector.completedInspections}</div>
                      <div className="text-emerald-600">Completed</div>
                    </div>
                    <div className="rounded-md border border-cyan-200 bg-cyan-50 p-2">
                      <div className="font-semibold text-cyan-900">{inspector.inProgressInspections}</div>
                      <div className="text-cyan-600">In Progress</div>
                    </div>
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-2">
                      <div className="font-semibold text-amber-900">{inspector.pendingInspections}</div>
                      <div className="text-amber-600">Pending</div>
                    </div>
                  </div>

                  {/* Completion Rate */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-600">Completion Rate</div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold">{inspector.completionRate}%</div>
                      <div className="h-2 w-16 rounded-full bg-slate-200">
                        <div 
                          className="h-2 rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${inspector.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Alert for high workload */}
                  {inspector.inProgressInspections >= 3 && (
                    <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-2">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                      <div className="text-xs text-amber-800">High workload</div>
                    </div>
                  )}

                  {/* View Inspections Button */}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setInspectionsModal({ open: true, inspector })
                    }}
                    className="w-full"
                  >
                    <Eye className="h-3 w-3" />
                    View Inspections
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Table View */
          <PaginatedTable
            columns={inspectorTableColumns}
            rows={filteredInspectorStats}
            rowKey={(r) => r.user_id}
            initialRowsPerPage={10}
            rowsPerPageOptions={[10, 20, 50, 'all']}
            enableSearch={false} // Search is handled above
            enableExport
            exportFilename="inspectors-workload.csv"
            exportBaseName="inspectors-workload"
          />
        )}

        {filteredInspectorStats.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No inspectors found matching your search.
          </div>
        )}
      </Card>

      {/* Selected Inspector's Inspections */}
      {selectedInspector && (
        <Card
          title={`Inspections - ${selectedInspector.name}`}
          subtitle={`Detailed view of all inspections assigned to ${selectedInspector.name}`}
          accent="emerald"
          right={
            <Button
              variant="ghost"
              onClick={() => setSelectedInspector(null)}
            >
              <Eye className="h-4 w-4" />
              Clear Selection
            </Button>
          }
        >
          <PaginatedTable
            columns={inspectionColumns}
            rows={selectedInspectorInspections}
            rowKey={(r) => r.id}
            initialRowsPerPage={10}
            rowsPerPageOptions={[10, 20, 50]}
            enableSearch
            searchPlaceholder="Search inspections..."
            enableExport
            exportFilename={`inspections-${selectedInspector.user_id}.csv`}
          />
        </Card>
      )}

      {/* Inspections Modal */}
      {inspectionsModal.open && inspectionsModal.inspector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Inspection Requests - {inspectionsModal.inspector.name}
                </h2>
                <p className="text-sm text-slate-600">
                  {inspectionsModal.inspector.user_id} {inspectionsModal.inspector.email && inspectionsModal.inspector.email !== 'N/A' ? `• ${inspectionsModal.inspector.email}` : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setInspectionsModal({ open: false, inspector: null })}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
              {/* Summary Stats */}
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-medium text-slate-600">Total</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {inspectionsModal.inspector.totalInspections}
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="text-xs font-medium text-emerald-700">Completed</div>
                  <div className="mt-1 text-lg font-semibold text-emerald-900">
                    {inspectionsModal.inspector.completedInspections}
                  </div>
                </div>
                <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
                  <div className="text-xs font-medium text-cyan-700">In Progress</div>
                  <div className="mt-1 text-lg font-semibold text-cyan-900">
                    {inspectionsModal.inspector.inProgressInspections}
                  </div>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="text-xs font-medium text-amber-700">Pending</div>
                  <div className="mt-1 text-lg font-semibold text-amber-900">
                    {inspectionsModal.inspector.pendingInspections}
                  </div>
                </div>
              </div>

              {/* Inspections Table */}
              {inspectionsModal.inspector.inspections?.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-700">Request ID</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-700">Vehicle</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-700">Customer</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-700">Priority</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-700">Rating</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-700">Customer Feedback</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-700">Created</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-700">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {inspectionsModal.inspector.inspections.map((inspection) => (
                        <tr key={inspection.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-xs">{inspection.request_id}</td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">
                                {inspection.brand_name || inspection.vehicle_make} {inspection.model_name || inspection.vehicle_model}
                              </div>
                              <div className="text-xs text-slate-500">
                                {inspection.variant_name || 'N/A'} • {inspection.category_name || 'N/A'} • {inspection.vehicle_type || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{inspection.customer_name || '—'}</td>
                          <td className="px-4 py-3">
                            <Badge tone={statusTone(inspection.status)}>
                              {statusLabel(inspection.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={priorityTone(inspection.priority)}>
                              {inspection.priority || 'Normal'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <StarRating rating={inspection.rating} size="sm" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="max-w-xs" title={inspection.customer_feedback || 'No feedback'}>
                              <div className="text-xs text-slate-600 truncate">
                                {inspection.customer_feedback || '—'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            {formatDateTime(inspection.created_at)}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            {formatDateTime(inspection.updated_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No inspection requests found for this inspector.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 p-6">
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => setInspectionsModal({ open: false, inspector: null })}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}