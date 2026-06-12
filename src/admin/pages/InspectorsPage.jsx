// TODO: Temporary fix for React development error with X icon
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Eye, EyeOff, Gauge, MapPin, MoreVertical, Plus, Search, Trash2, User, UserCheck, UserX, XCircle, Users, CalendarCheck, CalendarX, ChevronDown, ChevronRight, Home ,Edit} from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, Input, PaginatedTable, cx } from '../ui/Ui'
import { CustomDatePicker } from '../ui/CustomDatePicker'
import { ReasonDialog } from '../ui/ReasonDialog'
import { Snackbar } from '../ui/Snackbar'
import { ViewDetailsDialog } from '../ui/ViewDetailsDialog'
import { InspectorProfileDialog } from '../ui/InspectorProfileDialog'
import { ViewProfileDialog } from '../ui/ViewProfileDialog'
import { formatDate, formatDateTime, formatMinutes, formatTime, minutesSince } from '../utils/format'
import { registerInspector, resendOtp, verifyEmailOtp, verifySmsOtp, listInspectors, getInspectorProfile, createInspectorProfile, updateInspectorProfile, getInspectorAddresses, createInspectorAddress, updateInspectorAddress, deleteInspectorAddress } from '../../api/inspectoronboard'
import { requestResetInspectorPassword, verifyResetInspectorPasswordOTP, confirmResetInspectorPassword } from '../../api/changepassword'
import { deleteInspector } from '../../api/inspection'
import { getAvailabilities, updateAvailabilityStatus, createAvailability, deleteAvailability, patchAvailability, getInspectorAvailability } from '../../api/inspectoravailibility'
import { listLeaveRequests, approveLeaveRequest, rejectLeaveRequest } from '../../api/leave'

function leaveStatusTone(s) {
  if (s === 'approved') return 'emerald'
  if (s === 'rejected') return 'rose'
  return 'amber'
}

function availabilityStatusTone(s) {
  if (s === 'present') return 'emerald'
  if (s === 'absent') return 'rose'
  if (s === 'half_day') return 'amber'
  if (s === 'on_leave') return 'slate'
  return 'slate'
}

function availabilityStatusLabel(s) {
  if (s === 'present') return 'Present'
  if (s === 'absent') return 'Absent'
  if (s === 'half_day') return 'Half Day'
  if (s === 'on_leave') return 'On Leave'
  return s || '—'
}

function statusLabel(v) {
  if (v === 'active') return 'Active'
  if (v === 'inactive') return 'Inactive'
  if (v === 'suspended') return 'Suspended'
  return '—'
}

function todayIso() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function InspectorsPage() {
  const { locationId, permissions } = useRbac()

  useEffect(() => {
    document.title = 'Inspector Onboarding · PDI Admin'
  }, [])

  const { data, loading, error, refresh } = usePolling(
    ['inspectors', locationId].join(':'),
    () => listInspectors({ locationId: locationId || undefined }),
    { intervalMs: 30_000 } // Increased from 10s to 30s to reduce continuous calls
  )

  const inspectors = data?.inspectors || []
  const locations = data?.locations || []

  const { data: leaveData, loading: leaveLoading, error: leaveError, refresh: refreshLeave } = usePolling(
    'inspector-leave-requests',
    () => listLeaveRequests(leaveFilters),
    { intervalMs: 15_000 }
  )

  const leaveRequests = leaveData?.pending_requests || []

  const [availabilityData, setAvailabilityData] = useState(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState(null)

  const fetchAvailabilities = async (filters = availabilityFilters) => {
    setAvailabilityLoading(true)
    setAvailabilityError(null)
    try {
      const data = await getAvailabilities(filters)
      setAvailabilityData(data)
    } catch (error) {
      setAvailabilityError(error)
      setAvailabilityData(null)
    } finally {
      setAvailabilityLoading(false)
    }
  }

  const refreshAvailability = () => fetchAvailabilities()

  const fetchInspectorAvailability = async (inspectorId) => {
    try {
      const data = await getInspectorAvailability(inspectorId)
      setInspectorAvailability(data)
    } catch (error) {
      showSnack({ tone: 'danger', title: 'Error', message: 'Failed to load inspector availability' })
    }
  }

  // Initial load
  useEffect(() => {
    fetchAvailabilities()
  }, [])

  const availabilities = availabilityData?.results || []

  const unavailableInspectorIdsToday = useMemo(() => {
    const t = todayIso()
    const set = new Set()
    for (const r of leaveRequests) {
      if (r.status !== 'approved') continue
      const dates = Array.isArray(r.dates) ? r.dates : []
      for (const date of dates) {
        if (date === t) set.add(r.inspector_id)
      }
    }
    return set
  }, [leaveRequests])

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
  const [recentCreated, setRecentCreated] = useState(null)
  const [tableNonce, setTableNonce] = useState(0)
  const [leaveDialog, setLeaveDialog] = useState(null)
  const [availabilityDialog, setAvailabilityDialog] = useState(null)
  const [inspectorAvailabilityDialog, setInspectorAvailabilityDialog] = useState(null)
  const [addressDialog, setAddressDialog] = useState(null)
  const [addressDataReady, setAddressDataReady] = useState(false)
  const [inspectorAvailability, setInspectorAvailability] = useState({
    inspector_id: '',
    status: '',
    date_from: '',
    date_to: '',
    page: 1,
    page_size: 20
  })
  const [availabilityFilters, setAvailabilityFilters] = useState({
    inspector_id: '',
    status: '',
    date_from: '',
    date_to: '',
    page: 1,
    page_size: 20
  })
  const [leaveFilters, setLeaveFilters] = useState({
    status: '',
    inspector_id: '',
    date_from: '',
    date_to: ''
  })
  const [actionsMenu, setActionsMenu] = useState(null)
  const actionsBoxRef = useRef(null)
  const actionsMenuRef = useRef(null)

  const [snack, setSnack] = useState({ open: false, tone: 'info', title: '', message: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [availabilityFieldErrors, setAvailabilityFieldErrors] = useState({})
  const [addressFieldErrors, setAddressFieldErrors] = useState({})
  const [expandedInspectors, setExpandedInspectors] = useState(new Set())
  const [profileForm, setProfileForm] = useState({
    inspector_id: '',
    date_of_joining: '',
    employment_type: 'full_time',
    status: 'active',
  })
  const [addressForm, setAddressForm] = useState({
    address_type: 'permanent',
    street_address: '',
    landmark: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    status: 'active',
    is_primary: true,
  })
  const [existingAddresses, setExistingAddresses] = useState([])
  const [editingAddress, setEditingAddress] = useState(null)

  const profileOpen = dialog?.type === 'profile'
  const createOpen = dialog?.type === 'create'
  const toggleActiveOpen = dialog?.type === 'toggleActive'
  const verifyOpen = dialog?.type === 'verify'
  const manageAccountOpen = dialog?.type === 'manageAccount'
  const manageProfileOpen = dialog?.type === 'manageProfile'
  const viewProfileOpen = dialog?.type === 'viewProfile'

  const leaveViewOpen = leaveDialog?.type === 'view'
  const leaveApproveOpen = leaveDialog?.type === 'approve'
  const leaveRejectOpen = leaveDialog?.type === 'reject'

  const availabilityViewOpen = availabilityDialog?.type === 'view'
  const availabilityUpdateOpen = availabilityDialog?.type === 'update'
  const availabilityCreateOpen = availabilityDialog?.type === 'create'
  const availabilityDeleteOpen = availabilityDialog?.type === 'delete'

  const addressManageOpen = addressDialog?.type === 'manage' && addressDataReady

  // Reset addresses when dialog closes
  useEffect(() => {
    if (!addressManageOpen) {
      setExistingAddresses([])
      setEditingAddress(null)
      setAddressDataReady(false)
    }
  }, [addressManageOpen])

  // Pre-populate form when dialog is about to open
  useEffect(() => {
    if (addressDialog?.type === 'manage' && addressDialog?.item?.user_id) {
      // Dialog is set to manage, fetch addresses immediately
      const fetchAddresses = async () => {
        try {
          const response = await getInspectorAddresses({ inspector_id: addressDialog.item.user_id })
          
          let addresses = response?.data || response || []
          if (addresses && !Array.isArray(addresses)) {
            addresses = [addresses]
          }
          
          if (addresses.length === 1) {
            const address = addresses[0]
            // If address status is active, show the address data in form fields
            if (address.status === 'active') {
              console.log('Address is active, populating form with address data:', address)
              const newForm = {
                address_type: address.address_type || 'permanent',
                street_address: address.street_address || '',
                landmark: address.landmark || '',
                city: address.city || '',
                state: address.state || '',
                country: address.country || 'India',
                pincode: address.pincode || '',
                status: address.status || 'active',
                is_primary: address.is_primary || false,
              }
              console.log('Setting form with data:', newForm)
              setAddressForm(newForm)
              setExistingAddresses(addresses)
              setAddressDataReady(true)
              console.log('Form data set immediately:', newForm)
            } else {
              // If address status is inactive, show fresh form for new address
              console.log('Address is inactive, showing fresh form')
              setAddressForm({
                address_type: 'permanent',
                street_address: '',
                landmark: '',
                city: '',
                state: '',
                country: 'India',
                pincode: '',
                status: 'active',
                is_primary: true,
              })
              // Don't show inactive addresses in the existing addresses list
              setExistingAddresses([])
              setAddressDataReady(true)
            }
          } else {
            setExistingAddresses(addresses)
            setAddressDataReady(true)
          }
        } catch (error) {
          setExistingAddresses([])
          setAddressDataReady(true)
        }
      }
      fetchAddresses()
    }
  }, [addressDialog?.type, addressDialog?.item?.user_id])


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

  useEffect(() => {
    if (createOpen) setFieldErrors({})
  }, [createOpen])

  const [verifyForm, setVerifyForm] = useState({ email_otp: '', sms_otp: '' })
  const [resetPasswordForm, setResetPasswordForm] = useState({ contact_method: 'email', otp: '', new_password: '', confirm_password: '' })
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const resetPasswordOpen = dialog?.type === 'resetPassword'

  useEffect(() => {
    if (!verifyOpen) return
    setVerifyForm({ email_otp: '', sms_otp: '' })
  }, [verifyOpen])

  useEffect(() => {
    if (!resetPasswordOpen) return
    const contactMethod = dialog?.item?.email ? 'email' : dialog?.item?.mobile_number ? 'sms' : 'email'
    setResetPasswordForm({ contact_method: contactMethod, otp: '', new_password: '', confirm_password: '' })
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }, [resetPasswordOpen, dialog?.item?.email, dialog?.item?.mobile_number])

  useEffect(() => {
    if (manageProfileOpen && dialog?.item?.user_id) {
      getInspectorProfile({ inspector_id: dialog.item.user_id })
        .then((profile) => {
          setProfileForm({
            inspector_id: profile.inspector_id || '',
            date_of_joining: profile.date_of_joining || '',
            employment_type: profile.employment_type || 'full_time',
            status: profile.status || 'active',
          })
        })
        .catch(() => {
          // Profile not found, keep empty form
        })
    }
  }, [manageProfileOpen, dialog?.item?.user_id])

  const showSnack = (next) => {
    setSnack({ open: true, tone: next?.tone || 'info', title: next?.title || '', message: next?.message || '' })
  }

  const toggleInspectorExpanded = (inspectorId) => {
    setExpandedInspectors(prev => {
      const newSet = new Set(prev)
      if (newSet.has(inspectorId)) {
        newSet.delete(inspectorId)
      } else {
        newSet.add(inspectorId)
      }
      return newSet
    })
  }

  // Group availability data by inspector
  const availabilityByInspector = useMemo(() => {
    const grouped = {}
    for (const record of availabilities) {
      const key = `${record.inspector_id}-${record.inspector_name}`
      if (!grouped[key]) {
        grouped[key] = {
          inspector_id: record.inspector_id,
          inspector_name: record.inspector_name,
          records: [],
          presentCount: 0,
          absentCount: 0,
          halfDayCount: 0,
          onLeaveCount: 0
        }
      }
      grouped[key].records.push(record)
      // Count by status
      if (record.availability_status === 'present') grouped[key].presentCount++
      else if (record.availability_status === 'absent') grouped[key].absentCount++
      else if (record.availability_status === 'half_day') grouped[key].halfDayCount++
      else if (record.availability_status === 'on_leave') grouped[key].onLeaveCount++
    }
    return grouped
  }, [availabilities])

  // Create flattened rows for the table
  const flattenedAvailabilityRows = useMemo(() => {
    const rows = []
    for (const [key, group] of Object.entries(availabilityByInspector)) {
      // Add summary row
      rows.push({
        id: `summary-${key}`,
        isSummary: true,
        inspector_id: group.inspector_id,
        inspector_name: group.inspector_name,
        presentCount: group.presentCount,
        absentCount: group.absentCount,
        halfDayCount: group.halfDayCount,
        onLeaveCount: group.onLeaveCount,
        totalRecords: group.records.length
      })
      
      // Add detail rows if expanded
      if (expandedInspectors.has(group.inspector_id)) {
        for (const record of group.records) {
          rows.push({
            ...record,
            isDetail: true,
            parentId: `summary-${key}`
          })
        }
      }
    }
    return rows
  }, [availabilityByInspector, expandedInspectors])

  const responseToMessage = (res) => {
    if (!res) return ''
    if (typeof res === 'string') return res
    if (typeof res?.error === 'string') return res.error
    if (typeof res?.msg === 'string') return res.msg
    if (typeof res?.message === 'string') return res.message
    if (typeof res?.detail === 'string') return res.detail
    return ''
  }

  const extractFieldErrors = (e) => {
    if (!e || typeof e !== 'object') return {}
    const out = {}
    for (const [k, v] of Object.entries(e)) {
      if (!k) continue
      if (typeof v === 'string') out[k] = v
      else if (Array.isArray(v)) out[k] = v.filter(Boolean).join(' ')
      else if (v && typeof v === 'object' && typeof v.message === 'string') out[k] = v.message
    }
    return out
  }

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

  const inspectorById = useMemo(() => new Map(inspectors.map((i) => [i.user_id, i])), [inspectors])

  const displayInspectors = useMemo(() => {
    if (!recentCreated) return inspectors
    const exists = inspectors.some((i) => i.user_id === recentCreated.user_id)
    if (exists) return inspectors
    return [recentCreated, ...inspectors]
  }, [inspectors, recentCreated])

  const leaveColumns = useMemo(
    () => [
      {
        key: 'inspector',
        header: 'Inspector',
        exportValue: (r) => inspectorById.get(r.inspector_id)?.name || r.inspector_id,
        cell: (r) => (
          <div>
            <div className="text-sm font-semibold">{inspectorById.get(r.inspector_id)?.name || '—'}</div>
            <div className="text-xs text-slate-500">{r.inspector_id}</div>
          </div>
        ),
      },
      {
        key: 'dates',
        header: 'Leave dates',
        exportValue: (r) => Array.isArray(r.dates) ? r.dates.map((date) => formatDate(date)).join(', ') : '',
        cell: (r) => (
          <div className="text-sm text-slate-700">
            {Array.isArray(r.dates) ? r.dates.map(date => formatDate(date)).join(', ') : '—'}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        exportValue: (r) => r.status,
        cell: (r) => <Badge tone={leaveStatusTone(r.status)}>{r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : ''}</Badge>,
      },
      {
        key: 'requestedAt',
        header: 'Requested at',
        exportValue: (r) => (r.created_at ? formatDate(r.created_at) : ''),
        cell: (r) => <div className="text-xs text-slate-600">{formatDateTime(r.created_at)}</div>,
      },
      {
        key: 'decision',
        header: 'Decision',
        exportValue: (r) => (r.status === 'rejected' ? r.admin_comment || '' : ''),
        cell: (r) => {
          if (r.status !== 'rejected') return <div className="text-xs text-slate-500">—</div>
          return <div className="max-w-[260px] whitespace-normal text-xs text-rose-700">{r.admin_comment || '—'}</div>
        },
      },
      {
        key: 'actions',
        header: <div className="w-full pr-6 text-right">Actions</div>,
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
      { key: 'inspector', label: 'Inspector', value: inspectorById.get(it?.inspector_id)?.name || it?.inspector_id || '—' },
      { key: 'dates', label: 'Leave Dates', value: Array.isArray(it?.dates) ? it?.dates.map(date => formatDate(date)).join(', ') : '—', fullWidth: true },
      { key: 'reason', label: 'Reason', value: it?.reason || '—', fullWidth: true },
      { key: 'status', label: 'Status', value: it?.status || '—' },
      { key: 'createdAt', label: 'Requested at', value: formatDateTime(it?.created_at) },
      { key: 'decidedAt', label: 'Decided at', value: formatDateTime(it?.decided_at) },
      { key: 'adminComment', label: 'Admin Comment', value: it?.admin_comment || '—', fullWidth: true },
    ]
  }, [inspectorById, leaveDialog])

  const availabilityColumns = useMemo(
    () => [
      {
        key: 'inspector',
        header: 'Inspector',
        exportValue: (r) => r.isSummary ? `${r.inspector_name} (${r.inspector_id})` : `${r.inspector_name} (${r.inspector_id})`,
        cell: (r) => {
          if (r.isSummary) {
            return (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleInspectorExpanded(r.inspector_id)}
                  className="flex items-center gap-1 text-slate-600 hover:text-slate-900"
                >
                  {expandedInspectors.has(r.inspector_id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <div>
                  <div className="text-sm font-semibold">{r.inspector_name}</div>
                  <div className="text-xs text-slate-500">{r.inspector_id}</div>
                </div>
              </div>
            )
          } else {
            return (
              <div className="ml-6">
                <div className="text-sm text-slate-700">{formatDate(r.date)}</div>
                <div className="text-xs text-slate-500">{r.inspector_id}</div>
              </div>
            )
          }
        },
      },
      {
        key: 'summary',
        header: 'Summary',
        exportValue: (r) => r.isSummary ? `Present: ${r.presentCount}, Absent: ${r.absentCount}` : '',
        cell: (r) => {
          if (r.isSummary) {
            return (
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Badge tone="emerald" className="text-xs">Present: {r.presentCount}</Badge>
                </span>
                <span className="flex items-center gap-1">
                  <Badge tone="rose" className="text-xs">Absent: {r.absentCount}</Badge>
                </span>
                <span className="flex items-center gap-1">
                  <Badge tone="amber" className="text-xs">Half Day: {r.halfDayCount}</Badge>
                </span>
                <span className="flex items-center gap-1">
                  <Badge tone="slate" className="text-xs">On Leave: {r.onLeaveCount}</Badge>
                </span>
                <span className="text-xs text-slate-500">Total: {r.totalRecords}</span>
              </div>
            )
          } else {
            return (
              <div className="ml-6">
                <Badge tone={availabilityStatusTone(r.availability_status)}>
                  {availabilityStatusLabel(r.availability_status)}
                </Badge>
              </div>
            )
          }
        },
      },
      {
        key: 'time',
        header: 'Time',
        exportValue: (r) => r.isSummary ? '' : `${formatTime(r.start_time)} - ${formatTime(r.end_time)}`,
        cell: (r) => {
          if (r.isSummary) {
            return <div className="text-sm text-slate-500">—</div>
          } else {
            return (
              <div className="ml-6 text-sm text-slate-700">
                {r.start_time && r.end_time ? (
                  <div>
                    <div className="text-xs text-slate-500">Time:</div>
                    <div className="font-medium">
                      {formatTime(r.start_time)} - {formatTime(r.end_time)}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">—</div>
                )}
              </div>
            )
          }
        },
      },
      {
        key: 'remarks',
        header: 'Remarks',
        exportValue: (r) => r.isSummary ? '' : (r.remarks || ''),
        cell: (r) => {
          if (r.isSummary) {
            return <div className="text-sm text-slate-500">—</div>
          } else {
            return (
              <div className="ml-6 max-w-[200px] truncate text-sm text-slate-600">
                {r.remarks || '—'}
              </div>
            )
          }
        },
      },
      {
        key: 'submitted_date',
        header: 'Submitted',
        exportValue: (r) => r.isSummary ? '' : (r.submitted_date ? formatDate(r.submitted_date) : ''),
        cell: (r) => {
          if (r.isSummary) {
            return <div className="text-sm text-slate-500">—</div>
          } else {
            return (
              <div className="ml-6 text-xs text-slate-600">
                {formatDateTime(r.submitted_date)}
              </div>
            )
          }
        },
      },
      {
        key: 'actions',
        header: <div className="w-full pr-6 text-right">Actions</div>,
        cell: (r) => {
          if (r.isSummary) {
            return <div className="text-sm text-slate-500">—</div>
          } else {
            return (
              <div className="ml-6 flex items-center justify-end gap-2">
                <Button 
                  variant="icon" 
                  size="icon" 
                  onClick={() => setAvailabilityDialog({ type: 'view', item: r })} 
                  title={'View Details'}
                >
                  <Eye className="h-4 w-4 text-slate-700" />
                </Button>
                <Button
                  variant="icon"
                  size="icon"
                  disabled={!permissions.manageInspectors}
                  onClick={() => setAvailabilityDialog({ type: 'update', item: r })}
                  title={permissions.manageInspectors ? 'Update Status' : 'Insufficient permission'}
                >
                  <Edit className="h-4 w-4 text-slate-700" />
                </Button>
                <Button
                  variant="icon"
                  size="icon"
                  disabled={!permissions.manageInspectors}
                  onClick={() => setAvailabilityDialog({ type: 'delete', item: r })}
                  title={permissions.manageInspectors ? 'Delete Record' : 'Insufficient permission'}
                  className="text-rose-600 hover:text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          }
        },
        className: 'text-right',
        tdClassName: 'text-right',
      },
    ],
    [expandedInspectors, permissions.manageInspectors]
  )

  const availabilityViewItems = useMemo(() => {
    if (!availabilityDialog || availabilityDialog.type !== 'view') return []
    const it = availabilityDialog.item
    return [
      { key: 'id', label: 'Availability ID', value: it?.id || '—' },
      { key: 'inspector_id', label: 'Inspector ID', value: it?.inspector_id || '—' },
      { key: 'inspector_name', label: 'Inspector Name', value: it?.inspector_name || '—' },
      { key: 'date', label: 'Date', value: formatDate(it?.date) || '—' },
      { key: 'time_range', label: 'Time Range', value: (it?.start_time && it?.end_time) ? `${formatTime(it.start_time)} - ${formatTime(it.end_time)}` : '—' },
      { key: 'availability_status', label: 'Availability Status', value: availabilityStatusLabel(it?.availability_status) || '—' },
      { key: 'remarks', label: 'Remarks', value: it?.remarks || '—', fullWidth: true },
      { key: 'submitted_date', label: 'Submitted Date', value: formatDateTime(it?.submitted_date) || '—' },
      { key: 'updated_date', label: 'Updated Date', value: formatDateTime(it?.updated_date) || '—' },
    ]
  }, [availabilityDialog])

  const columns = useMemo(
    () => [
      {
        key: 'identity',
        header: 'Inspector',
        exportValue: (r) => `${r.name} (${r.user_id})`,
        cell: (r) => (
          <div>
            <div className="text-sm font-semibold">{r.name}</div>
            <div className="text-xs text-slate-500">{r.user_id}</div>
          </div>
        ),
      },
      {
        key: 'email',
        header: 'Email',
        exportValue: (r) => r.email || '',
        cell: (r) => <div className="text-xs text-slate-600">{r.email || '—'}</div>,
      },
      {
        key: 'mobile_number',
        header: 'Mobile',
        exportValue: (r) => r.mobile_number || '',
        cell: (r) => <div className="text-xs text-slate-600">{r.mobile_number || '—'}</div>,
      },
      // {
      //   key: 'joinDate',
      //   header: 'Date of joining',
      //   exportValue: (r) => r.joinDate,
      //   cell: (r) => <div className="text-xs text-slate-600">{formatDate(r.joinDate)}</div>,
      // },
      // {
      //   key: 'state',
      //   header: 'Availability',
      //   exportValue: (r) => (unavailableInspectorIdsToday.has(r.id) ? 'Unavailable' : 'Available'),
      //   cell: (r) => (
      //     <Badge tone={unavailableInspectorIdsToday.has(r.id) ? 'rose' : 'emerald'}>
      //       {unavailableInspectorIdsToday.has(r.id) ? 'Unavailable' : 'Available'}
      //     </Badge>
      //   ),
      // },
      // {
      //   key: 'status',
      //   header: 'Status',
      //   exportValue: (r) => statusLabel(r.status),
      //   cell: (r) => (
      //     <Badge tone={r.status === 'active' ? 'emerald' : r.status === 'suspended' ? 'rose' : 'slate'}>
      //       {statusLabel(r.status)}
      //     </Badge>
      //   ),
      // },
      // {
      //   key: 'util',
      //   header: 'Utilization',
      //   cell: (r) => `${r.utilizationPct}%`,
      // },
      // {
      //   key: 'idle',
      //   header: 'Idle for',
      //   cell: (r) => {
      //     if (r.state !== 'idle') return '—'
      //     return formatMinutes(minutesSince(r.lastStateChangeAt))
      //   },
      // },
      {
        key: 'actions',
        header: <div className="w-full pr-6 text-right">Actions</div>,
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
                  if (s?.row?.user_id === r.user_id) return null
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
        <Card accent="blue" className="p-0" kpi>
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-700" />
              <div className="text-xs text-slate-600">Total Inspectors</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{loading && !data ? '—' : inspectors.length}</div>
            <div className="mt-1 text-xs text-slate-500">All registered inspectors</div>
          </div>
        </Card>
        <Card accent="cyan" className="p-0" kpi>
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-cyan-700" />
              <div className="text-xs text-slate-600">Leave Requests</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{leaveLoading && !leaveData ? '—' : leaveRequests.length}</div>
            <div className="mt-1 text-xs text-slate-500">Pending and processed</div>
          </div>
        </Card>
        <Card accent="emerald" className="p-0" kpi>
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-700" />
              <div className="text-xs text-slate-600">Total Present</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">
              {availabilityLoading && !availabilityData ? '—' : new Set(availabilities.filter(a => a.availability_status === 'present' && a.date === todayIso()).map(a => a.inspector_id)).size}
            </div>
            <div className="mt-1 text-xs text-slate-500">Available </div>
          </div>
        </Card>
        <Card accent="rose" className="p-0" kpi>
          <div className="relative p-3">
            <div className="mb-1 flex items-center gap-2">
              <UserX className="h-4 w-4 text-rose-700" />
              <div className="text-xs text-slate-600">Total Absent</div>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">
              {availabilityLoading && !availabilityData ? '—' : new Set(availabilities.filter(a => a.availability_status === 'absent' && a.date === todayIso()).map(a => a.inspector_id)).size}
            </div>
            <div className="mt-1 text-xs text-slate-500">Not available </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Card
          title="Inspector roster"
          className="col-span-1"
          right={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <User className="h-4 w-4" />
                Inspectors
              </div>
              <Button
                variant="primary"
                size="sm"
                disabled={!permissions.manageInspectors}
                onClick={() => {
                  if (!permissions.manageInspectors) return
                  setDialog({ type: 'create' })
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
              key={`inspectors-${tableNonce}`}
              columns={columns}
              rows={displayInspectors}
              rowKey={(r) => r.user_id}
              initialRowsPerPage={10}
              enableSearch
              searchPlaceholder="Search inspectors…"
              enableExport
              exportFilename="inspectors.csv"
            />
          </div>
        </Card>
      </div>

      <Card
        title="Leave requests"
        accent="cyan"
        // right={
        //   <Button onClick={async () => refreshLeave()} className="ml-1">
        //     Refresh
        //   </Button>
        // }
      >
        {leaveError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Failed to load leave requests.</div>
        ) : null}

        {/* Filter Controls */}
        <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 text-sm font-semibold text-slate-700">Filters</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Inspector</label>
              <select
                value={leaveFilters.inspector_id}
                onChange={(e) => setLeaveFilters(prev => ({ ...prev, inspector_id: e.target.value }))}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">All Inspectors</option>
                {inspectors.map(i => (
                  <option key={i.user_id} value={i.user_id}>{i.name} ({i.user_id})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
              <select
                value={leaveFilters.status}
                onChange={(e) => setLeaveFilters(prev => ({ ...prev, status: e.target.value }))}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">From Date</label>
              <CustomDatePicker
                value={leaveFilters.date_from}
                onChange={(value) => setLeaveFilters(prev => ({ ...prev, date_from: value }))}
                placeholder="dd/mm/yyyy"
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">To Date</label>
              <CustomDatePicker
                value={leaveFilters.date_to}
                onChange={(value) => setLeaveFilters(prev => ({ ...prev, date_to: value }))}
                placeholder="dd/mm/yyyy"
                className="w-full"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => refreshLeave()}
                className="h-9 flex-1"
              >
                <Search className="h-4 w-4" />
                Apply
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const clearedFilters = {
                    status: '',
                    inspector_id: '',
                    date_from: '',
                    date_to: ''
                  }
                  setLeaveFilters(clearedFilters)
                  setTimeout(() => refreshLeave(), 0)
                }}
                className="h-9 flex-1"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

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

      <Card
        title="Inspector Availability"
        subtitle="Daily availability status of inspectors · Present, Absent, Half Day, On Leave"
        accent="emerald"
        right={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={!permissions.manageInspectors}
              onClick={() => setAvailabilityDialog({ type: 'create' })}
            >
              <Plus className="h-4 w-4" />
              Create Availability
            </Button>
            {/* <Button onClick={async () => refreshAvailability()} className="ml-1">
              Refresh
            </Button> */}
          </div>
        }
      >
        {availabilityError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Failed to load availability data.</div>
        ) : null}

        {/* Filter Controls */}
        <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 text-sm font-semibold text-slate-700">Filters</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Inspector</label>
              <select
                value={availabilityFilters.inspector_id}
                onChange={(e) => setAvailabilityFilters(prev => ({ ...prev, inspector_id: e.target.value }))}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">All Inspectors</option>
                {inspectors.map(i => (
                  <option key={i.user_id} value={i.user_id}>{i.name} ({i.user_id})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
              <select
                value={availabilityFilters.status}
                onChange={(e) => setAvailabilityFilters(prev => ({ ...prev, status: e.target.value }))}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">From Date</label>
              <CustomDatePicker
                value={availabilityFilters.date_from}
                onChange={(value) => setAvailabilityFilters(prev => ({ ...prev, date_from: value }))}
                placeholder="dd/mm/yyyy"
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">To Date</label>
              <CustomDatePicker
                value={availabilityFilters.date_to}
                onChange={(value) => setAvailabilityFilters(prev => ({ ...prev, date_to: value }))}
                placeholder="dd/mm/yyyy"
                className="w-full"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setAvailabilityFilters(prev => ({ ...prev, page: 1 }))
                  fetchAvailabilities()
                }}
                className="h-9 flex-1"
              >
                <Search className="h-4 w-4" />
                Apply
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const clearedFilters = {
                    inspector_id: '',
                    status: '',
                    date_from: '',
                    date_to: '',
                    page: 1,
                    page_size: 20
                  }
                  setAvailabilityFilters(clearedFilters)
                  fetchAvailabilities(clearedFilters)
                }}
                className="h-9 flex-1"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        <div className={availabilityLoading && !availabilityData ? 'opacity-60' : ''}>
          <PaginatedTable
            columns={availabilityColumns}
            rows={flattenedAvailabilityRows}
            rowKey={(r) => r.id}
            initialRowsPerPage={availabilityFilters.page_size}
            rowsPerPageOptions={[10, 20, 50, 100]}
            enableSearch
            searchPlaceholder="Search availability records…"
            enableExport
            exportFilename="inspector-availability.csv"
            paginationInfo={availabilityData}
            onPageChange={(page) => {
              const newFilters = { ...availabilityFilters, page }
              setAvailabilityFilters(newFilters)
              fetchAvailabilities(newFilters)
            }}
            onRowsPerPageChange={(pageSize) => {
              const newFilters = { ...availabilityFilters, page_size: pageSize, page: 1 }
              setAvailabilityFilters(newFilters)
              fetchAvailabilities(newFilters)
            }}
          />
        </div>
      </Card>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          Failed to load inspectors.
        </div>
      ) : null}

      <ViewDetailsDialog
        open={leaveViewOpen}
        title="View leave request"
        onClose={() => setLeaveDialog(null)}
        items={leaveViewItems}
        accent="cyan"
      />

      <ViewDetailsDialog
        open={availabilityViewOpen}
        title="View availability details"
        onClose={() => setAvailabilityDialog(null)}
        items={availabilityViewItems}
        accent="emerald"
      />

      <ReasonDialog
        open={availabilityUpdateOpen}
        title="Update Availability Status"
        description="Update the availability status for this inspector. You can also add remarks."
        submitLabel="Update Status"
        onClose={() => setAvailabilityDialog(null)}
        showReason={true}
        requireReason={false}
        reasonLabel="Remarks (optional)"
        reasonPlaceholder="Eg: Updated due to emergency leave"
        fields={[
          {
            name: 'date',
            label: 'Date *',
            type: 'date',
            defaultValue: availabilityDialog?.item?.date || '',
          },
          {
            name: 'availability_status',
            label: 'Availability Status *',
            type: 'select',
            defaultValue: availabilityDialog?.item?.availability_status || 'present',
            options: [
              { value: 'present', label: 'Present' },
              { value: 'absent', label: 'Absent' },
              { value: 'half_day', label: 'Half Day' },
              { value: 'on_leave', label: 'On Leave' },
            ],
          },
          {
            name: 'start_time',
            label: 'Start Time',
            type: 'time',
            defaultValue: availabilityDialog?.item?.start_time || '',
            condition: (form) => ['present', 'half_day'].includes(form.availability_status),
          },
          {
            name: 'end_time',
            label: 'End Time',
            type: 'time',
            defaultValue: availabilityDialog?.item?.end_time || '',
            condition: (form) => ['present', 'half_day'].includes(form.availability_status),
          },
        ]}
        onSubmit={async (form) => {
          try {
            if (!permissions.manageInspectors) throw new Error('Insufficient permission')
            
            const payload = {
              availability_status: form.availability_status,
              date: form.date || availabilityDialog.item.date
            }
            
            if (form.reason) {
              payload.remarks = form.reason
            }
            
            // Add start_time and end_time for present or half_day status
            if (['present', 'half_day'].includes(form.availability_status)) {
              if (form.start_time) payload.start_time = form.start_time
              if (form.end_time) payload.end_time = form.end_time
            }
            
            const result = await patchAvailability(availabilityDialog.item.id, payload)
            
            showSnack({ tone: 'success', title: 'Success', message: responseToMessage(result) || 'Availability updated successfully' })
            refreshAvailability()
            setAvailabilityDialog(null)
          } catch (e) {
            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Failed to update availability' })
          }
        }}
      />

      <ReasonDialog
        open={availabilityDeleteOpen}
        title="Delete Availability Record"
        description={`Are you sure you want to delete the availability record for ${availabilityDialog?.item?.inspector_name} on ${formatDate(availabilityDialog?.item?.date)}? This action cannot be undone.`}
        submitLabel="Delete Record"
        submitVariant="danger"
        onClose={() => setAvailabilityDialog(null)}
        showReason={false}
        requireReason={false}
        fields={[]}
        onSubmit={async () => {
          try {
            if (!permissions.manageInspectors) throw new Error('Insufficient permission')
            
            const result = await deleteAvailability(availabilityDialog.item.id)
            showSnack({ tone: 'success', title: 'Success', message: responseToMessage(result) || 'Availability record deleted successfully' })
            refreshAvailability()
            setAvailabilityDialog(null)
          } catch (e) {
            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Failed to delete availability record' })
          }
        }}
      />

      <ReasonDialog
        open={availabilityCreateOpen}
        title="Create Availability Record"
        description="Create a new availability record for an inspector. This will override any existing record for the same date."
        submitLabel="Create Record"
        onClose={() => setAvailabilityDialog(null)}
        showReason={false}
        requireReason={false}
        fieldErrors={availabilityFieldErrors}
        fields={[
          {
            name: 'inspector_id',
            label: 'Inspector *',
            type: 'select',
            defaultValue: '',
            options: inspectors.map(i => ({ value: i.user_id, label: `${i.name} (${i.user_id})` })),
          },
          {
            name: 'dates',
            label: 'Dates *',
            type: 'multi_date_calendar',
            defaultValue: [todayIso()],
            min: todayIso(),
          },
          {
            name: 'availability_status',
            label: 'Availability Status *',
            type: 'select',
            defaultValue: 'present',
            options: [
              { value: 'present', label: 'Present' },
              { value: 'absent', label: 'Absent' },
              { value: 'half_day', label: 'Half Day' },
              { value: 'on_leave', label: 'On Leave' },
            ],
          },
          {
            name: 'remarks',
            label: 'Remarks',
            type: 'textarea',
            defaultValue: '',
          },
          {
            name: 'start_time',
            label: 'Start Time',
            type: 'time',
            defaultValue: '',
            condition: (form) => ['present', 'half_day'].includes(form.availability_status),
          },
          {
            name: 'end_time',
            label: 'End Time',
            type: 'time',
            defaultValue: '',
            condition: (form) => ['present', 'half_day'].includes(form.availability_status),
          },
        ]}
        onSubmit={async (form) => {
          try {
            if (!permissions.manageInspectors) throw new Error('Insufficient permission')

            const inspectorId = String(form.inspector_id || '').trim()
            if (!inspectorId) {
              setAvailabilityFieldErrors({ inspector_id: 'This Field is Required' })
              return
            }

            const dates = Array.isArray(form.dates) ? form.dates.filter(Boolean) : []
            if (!dates.length) {
              setAvailabilityFieldErrors({ dates: 'This Field is Required' })
              return
            }

            const remarks = String(form.remarks || '').trim()

            setAvailabilityFieldErrors({})

            const payload = {
              inspector_id: inspectorId,
              availability: dates.map((date) => {
                const availabilityEntry = {
                  date,
                  status: form.availability_status,
                  remarks,
                }
                
                // Add start_time and end_time only for present or half_day status
                if (['present', 'half_day'].includes(form.availability_status)) {
                  if (form.start_time) availabilityEntry.start_time = form.start_time
                  if (form.end_time) availabilityEntry.end_time = form.end_time
                }
                
                return availabilityEntry
              }),
            }

            const result = await createAvailability(payload)
            showSnack({
              tone: 'success',
              title: 'Success',
              message: responseToMessage(result) || `Availability record(s) created successfully (${dates.length})`,
            })
            refreshAvailability()
            setAvailabilityDialog(null)
          } catch (e) {
            const fe = extractFieldErrors(e)
            if (Object.keys(fe).length) {
              setAvailabilityFieldErrors(fe)
              const first =
                fe.inspector_id ||
                fe.dates ||
                fe.remarks ||
                Object.values(fe)[0]
              showSnack({ tone: 'danger', title: 'Error', message: String(first || 'Failed to create availability record') })
              return
            }
            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Failed to create availability record' })
          }
        }}
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
        onSubmit={async (form) => {
          try {
            if (!permissions.manageInspectors) throw new Error('Insufficient permission')
            
            const result = await approveLeaveRequest(leaveDialog.item.id, form.reason || '')
            showSnack({ tone: 'success', title: 'Success', message: result.message || 'Leave request approved successfully' })
            refreshLeave()
            setLeaveDialog(null)
          } catch (e) {
            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Failed to approve leave request' })
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
            
            const result = await rejectLeaveRequest(leaveDialog.item.id, form.reason || '')
            showSnack({ tone: 'success', title: 'Success', message: result.message || 'Leave request rejected successfully' })
            refreshLeave()
            setLeaveDialog(null)
          } catch (e) {
            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Failed to reject leave request' })
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
              setDialog({ type: 'manageAccount', item: actionsMenu.row })
              setActionsMenu(null)
            }}
          >
            <User className="h-4 w-4" />
            Manage account
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
              setDialog({ type: 'profile', item: actionsMenu.row })
              setActionsMenu(null)
            }}
          >
            <User className="h-4 w-4" />
            Update Profile
          </button>

          <button
            type="button"
            disabled={!permissions.manageInspectors}
            className={cx(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100',
              permissions.manageInspectors ? 'text-slate-900' : 'text-slate-400'
            )}
            onClick={async () => {
              if (!permissions.manageInspectors) return
              
              // Check if profile exists before opening View Profile dialog
              try {
                const profile = await getInspectorProfile({ inspector_id: actionsMenu.row.user_id })
                if (profile) {
                  setDialog({ type: 'viewProfile', item: actionsMenu.row })
                } else {
                  // Show friendly message if no profile exists
                  showSnack({ 
                    tone: 'info', 
                    title: 'Profile Not Available', 
                    message: 'Kindly Update Your Profile' 
                  })
                }
              } catch (error) {
                // If profile fetch fails (likely because profile doesn't exist), show friendly message
                showSnack({ 
                  tone: 'info', 
                  title: 'Profile Not Available', 
                  message: 'Kindly Update Your Profile' 
                })
              }
              setActionsMenu(null)
            }}
          >
            <User className="h-4 w-4" />
            View Profile
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
              setInspectorAvailabilityDialog({ inspector: actionsMenu.row })
              fetchInspectorAvailability(actionsMenu.row.user_id)
              setActionsMenu(null)
            }}
          >
            <Eye className="h-4 w-4" />
            View Availability
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
              setDialog({ type: 'resetPassword', item: actionsMenu.row, step: 'request' })
              setActionsMenu(null)
            }}
          >
            <UserCheck className="h-4 w-4" />
            Reset Password
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
              setAddressDialog({ type: 'manage', item: actionsMenu.row })
              setActionsMenu(null)
            }}
          >
            <Home className="h-4 w-4" />
            Manage Address
          </button>
          
          <button
            type="button"
            disabled={!permissions.manageInspectors}
            className={cx(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-red-50',
              permissions.manageInspectors ? 'text-red-600' : 'text-slate-400'
            )}
            onClick={async () => {
              if (!permissions.manageInspectors) return
              
              if (window.confirm(`Are you sure you want to delete inspector ${actionsMenu.row.name} (${actionsMenu.row.user_id})? This action cannot be undone.`)) {
                try {
                  await deleteInspector(actionsMenu.row.user_id)
                  showSnack({ tone: 'success', title: 'Success', message: 'Inspector deleted successfully' })
                  refresh() // Refresh the inspectors list
                } catch (error) {
                  showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(error) || 'Failed to delete inspector' })
                }
              }
              setActionsMenu(null)
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete Inspector
          </button>
        </div>
      ) : null}

      <InspectorProfileDialog
        open={profileOpen}
        inspector={dialog?.item || null}
        onClose={() => setDialog(null)}
        onSave={async (result) => {
          if (!permissions.manageInspectors) throw new Error('Insufficient permission')
          // Profile created/updated successfully
          showSnack({ tone: 'success', title: 'Success', message: result.message || 'Profile saved successfully' })
          refresh()
        }}
      />

      <ViewProfileDialog
        open={viewProfileOpen}
        inspector={dialog?.item || null}
        onClose={() => setDialog(null)}
      />

      {inspectorAvailabilityDialog ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setInspectorAvailabilityDialog(null)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="relative border-b border-slate-200 px-4 py-3">
              <Button
                variant="icon"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => setInspectorAvailabilityDialog(null)}
                aria-label="Close"
                title="Close"
              >
                <XCircle className="h-4 w-4" />
              </Button>
              <div className="text-sm font-semibold">
                Availability - {inspectorAvailability?.inspector_name} ({inspectorAvailability?.inspector_id})
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Total Records: {inspectorAvailability?.total_records || 0}
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-4">
              {inspectorAvailability?.availability?.length > 0 ? (
                <div className="space-y-2">
                  {inspectorAvailability.availability.map((record) => (
                    <div key={record.id} className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                        <div>
                          <div className="text-xs font-medium text-slate-600">Date</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">
                            {formatDate(record.date)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-600">Time</div>
                          <div className="mt-1 text-sm text-slate-700">
                            {record.start_time && record.end_time ? (
                              <div className="font-medium">
                                {formatTime(record.start_time)} - {formatTime(record.end_time)}
                              </div>
                            ) : (
                              <div className="text-slate-500">—</div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-600">Status</div>
                          <div className="mt-1">
                            <Badge tone={availabilityStatusTone(record.status?.toLowerCase().replace(' ', '_'))}>
                              {record.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <div className="text-xs font-medium text-slate-600">Remarks</div>
                          <div className="mt-1 text-sm text-slate-700">
                            {record.remarks || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No availability records found for this inspector.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3">
              <Button variant="ghost" onClick={() => setInspectorAvailabilityDialog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ReasonDialog
        open={createOpen}
        title="Add inspector"
        description="Create inspector credentials. You can complete the remaining profile details later in Update Profile."
        submitLabel="Create"
        onClose={() => setDialog(null)}
        showReason={false}
        requireReason={false}
        reasonLabel=""
        reasonPlaceholder=""
        fieldErrors={fieldErrors}
        fields={[
          {
            name: 'name',
            label: 'Name *',
            type: 'text',
            defaultValue: '',
            onChange: (value, next) => {
              const v = String(value || '').replace(/[^A-Za-z .]+/g, '')
              return { ...next, name: v }
            },
          },
          {
            name: 'email',
            label: 'Email',
            type: 'text',
            defaultValue: '',
          },
          {
            name: 'mobile_number',
            label: 'Mobile number *',
            type: 'text',
            defaultValue: '',
            onChange: (value, next) => {
              const digits = String(value || '').replace(/\D+/g, '').slice(0, 10)
              return { ...next, mobile_number: digits }
            },
          },
          {
            name: 'password',
            label: 'Password *',
            type: 'password',
            defaultValue: '',
          },
          {
            name: 'role',
            label: 'Role *',
            type: 'select',
            defaultValue: 'Inspector',
            options: [
              { value: 'Inspector', label: 'Inspector' },
            ],
          },
        ]}
        onSubmit={async (form) => {
          try {
            if (!permissions.manageInspectors) throw new Error('Insufficient permission')

            const errors = {}
            const name = String(form.name || '').trim()
            const email = String(form.email || '').trim()
            const mobile = String(form.mobile_number || '').replace(/\s+/g, '')
            const password = String(form.password || '')

            if (!name) errors.name = 'This Field is Required'
            else if (!/^[A-Za-z .]+$/.test(name)) errors.name = 'Only alphabets, space and dot are allowed'

            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format'

            if (!mobile) errors.mobile_number = 'This Field is Required'
            else if (!/^\d{10}$/.test(mobile)) errors.mobile_number = 'Mobile number must be 10 digits'

            if (!String(password || '').trim()) errors.password = 'This Field is Required'
            else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
              errors.password = 'Password must be at least 8 characters with uppercase, lowercase, number and special character'
            }

            if (Object.keys(errors).length) {
              setFieldErrors(errors)
              return
            }

            setFieldErrors({})
            const res = await registerInspector({
              name,
              email,
              mobile_number: mobile,
              password,
              role: form.role,
            })

            showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
            if (res?.user) setRecentCreated(res.user)

            const nextEmail = String(form.email || '').trim()
            const nextMobile = String(form.mobile_number || '').trim()
            if (nextEmail || nextMobile) {
              setDialog({ type: 'verify', email: nextEmail, mobile_number: nextMobile })
            } else {
              setDialog(null)
            }
          } catch (e) {
            const fe = extractFieldErrors(e)
            if (Object.keys(fe).length) setFieldErrors(fe)
            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Action failed' })
          }
        }}
      />

      {verifyOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDialog(null)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="px-4 py-3">
              <div className="text-sm font-semibold">Verify inspector</div>
              <div className="mt-1 text-xs text-slate-500">Verify email/mobile with OTP, or resend OTP.</div>
            </div>
            <div className="space-y-3 px-4 pb-4">
              {dialog?.email ? (
                <div>
                  <div className="text-xs font-medium text-slate-900">Email</div>
                  <div className="mt-1 text-xs text-slate-600">{dialog.email}</div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input
                      value={verifyForm.email_otp}
                      onChange={(e) => setVerifyForm((s) => ({ ...s, email_otp: e.target.value }))}
                      placeholder="Email OTP"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          try {
                            const res = await verifyEmailOtp({ email: dialog.email, email_otp: verifyForm.email_otp })
                            showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
                          } catch (e) {
                            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Verification failed' })
                          }
                        }}
                      >
                        Verify
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          try {
                            const res = await resendOtp({ email: dialog.email })
                            showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
                          } catch (e) {
                            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Resend failed' })
                          }
                        }}
                      >
                        Resend
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {dialog?.mobile_number ? (
                <div>
                  <div className="text-xs font-medium text-slate-900">Mobile number</div>
                  <div className="mt-1 text-xs text-slate-600">{dialog.mobile_number}</div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input
                      value={verifyForm.sms_otp}
                      onChange={(e) => setVerifyForm((s) => ({ ...s, sms_otp: e.target.value }))}
                      placeholder="SMS OTP"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          try {
                            const res = await verifySmsOtp({ mobile_number: dialog.mobile_number, sms_otp: verifyForm.sms_otp })
                            showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
                          } catch (e) {
                            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Verification failed' })
                          }
                        }}
                      >
                        Verify
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          try {
                            const res = await resendOtp({ mobile_number: dialog.mobile_number })
                            showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) })
                          } catch (e) {
                            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Resend failed' })
                          }
                        }}
                      >
                        Resend
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setDialog(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {resetPasswordOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDialog(null)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="px-4 py-3">
              <div className="text-sm font-semibold">Reset inspector password</div>
              <div className="mt-1 text-xs text-slate-500">Use OTP verification and confirm a new password.</div>
            </div>
            <div className="space-y-3 px-4 pb-4">
              <div>
                <div className="text-xs font-medium text-slate-900">Inspector</div>
                <div className="mt-1 text-xs text-slate-600">{dialog?.item?.name || '—'} ({dialog?.item?.user_id || '—'})</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-medium text-slate-900">Email</div>
                  <div className="mt-1 text-xs text-slate-600">{dialog?.item?.email || '—'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-900">Mobile</div>
                  <div className="mt-1 text-xs text-slate-600">{dialog?.item?.mobile_number || '—'}</div>
                </div>
              </div>

              {dialog?.step === 'request' ? (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs text-slate-600">Request a reset OTP to the inspector's registered contact.</div>
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-slate-900">Contact method</div>
                    <div className="flex flex-wrap gap-2">
                      {dialog?.item?.email ? (
                        <button
                          type="button"
                          className={cx(
                            'rounded-full border px-3 py-1 text-xs font-medium',
                            resetPasswordForm.contact_method === 'email'
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-300 bg-white text-slate-700'
                          )}
                          onClick={() => setResetPasswordForm((s) => ({ ...s, contact_method: 'email' }))}
                        >
                          Email
                        </button>
                      ) : null}
                      {dialog?.item?.mobile_number ? (
                        <button
                          type="button"
                          className={cx(
                            'rounded-full border px-3 py-1 text-xs font-medium',
                            resetPasswordForm.contact_method === 'sms'
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-300 bg-white text-slate-700'
                          )}
                          onClick={() => setResetPasswordForm((s) => ({ ...s, contact_method: 'sms' }))}
                        >
                          SMS
                        </button>
                      ) : null}
                    </div>
                    <div className="text-xs text-slate-500">Selected: {resetPasswordForm.contact_method === 'email' ? 'Email' : 'SMS'}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      onClick={async () => {
                        if (!resetPasswordForm.contact_method) {
                          showSnack({ tone: 'danger', title: 'Error', message: 'Select a contact method' })
                          return
                        }
                        try {
                          const res = await requestResetInspectorPassword(dialog.item.user_id, {
                            contact_method: resetPasswordForm.contact_method,
                          })
                          showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) || 'OTP sent' })
                          setDialog((prev) => prev ? { ...prev, step: 'verify' } : null)
                        } catch (e) {
                          showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'OTP request failed' })
                        }
                      }}
                    >
                      Request OTP
                    </Button>
                    <Button variant="secondary" onClick={() => setDialog(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}

              {dialog?.step === 'verify' ? (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs text-slate-600">Enter the OTP received by the inspector, or resend if needed.</div>
                  <div>
                    <div className="text-xs font-medium text-slate-900">OTP</div>
                    <Input
                      value={resetPasswordForm.otp}
                      onChange={(e) => setResetPasswordForm((s) => ({ ...s, otp: e.target.value }))}
                      placeholder="Enter OTP"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      onClick={async () => {
                        try {
                          const res = await verifyResetInspectorPasswordOTP(dialog.item.user_id, {
                            otp: resetPasswordForm.otp,
                          })
                          showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) || 'OTP verified' })
                          setDialog((prev) => prev ? { ...prev, step: 'confirm' } : null)
                        } catch (e) {
                          showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Verification failed' })
                        }
                      }}
                    >
                      Verify OTP
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          const res = await resendOtp({
                            email: dialog.item.email,
                            mobile_number: dialog.item.mobile_number,
                          })
                          showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) || 'OTP resent' })
                        } catch (e) {
                          showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Resend failed' })
                        }
                      }}
                    >
                      Resend OTP
                    </Button>
                  </div>
                </div>
              ) : null}

              {dialog?.step === 'confirm' ? (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs text-slate-600">Enter a new password and confirm it.</div>
                  <div>
                    <div className="text-xs font-medium text-slate-900">New Password</div>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={resetPasswordForm.new_password}
                        onChange={(e) => setResetPasswordForm((s) => ({ ...s, new_password: e.target.value }))}
                        placeholder="New password"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-900">Confirm Password</div>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={resetPasswordForm.confirm_password}
                        onChange={(e) => setResetPasswordForm((s) => ({ ...s, confirm_password: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      onClick={async () => {
                        if (!resetPasswordForm.new_password) {
                          showSnack({ tone: 'danger', title: 'Error', message: 'New password is required' })
                          return
                        }
                        if (resetPasswordForm.new_password !== resetPasswordForm.confirm_password) {
                          showSnack({ tone: 'danger', title: 'Error', message: 'Passwords do not match' })
                          return
                        }
                        try {
                          const res = await confirmResetInspectorPassword(dialog.item.user_id, {
                            otp: resetPasswordForm.otp,
                            password: resetPasswordForm.new_password,
                            new_password: resetPasswordForm.new_password,
                          })
                          showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) || 'Password reset successfully' })
                          setDialog(null)
                        } catch (e) {
                          showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Password reset failed' })
                        }
                      }}
                    >
                      Reset Password
                    </Button>
                    <Button variant="secondary" onClick={() => setDialog(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setDialog(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Snackbar open={snack.open} tone={snack.tone} title={snack.title} message={snack.message} onClose={() => setSnack((s) => ({ ...s, open: false }))} />

      <ReasonDialog
        open={toggleActiveOpen}
        title={dialog?.item?.is_active ? 'Deactivate inspector account' : 'Activate inspector account'}
        description={'Inspector profile changes are audited. Reason is mandatory.'}
        submitLabel={dialog?.item?.is_active ? 'Deactivate' : 'Activate'}
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
            throw new Error('Inspector status toggle API not integrated')
          } catch (e) {
            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Action failed' })
          }
        }}
      />

      {manageProfileOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDialog(null)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="px-4 py-3">
              <div className="text-sm font-semibold">Manage inspector profile</div>
              <div className="mt-1 text-xs text-slate-500">Create or update inspector profile details.</div>
            </div>
            <div className="space-y-3 px-4 pb-4">
              <div>
                <div className="text-xs font-medium text-slate-900">Inspector ID</div>
                <Input
                  value={profileForm.inspector_id}
                  onChange={(e) => setProfileForm((s) => ({ ...s, inspector_id: e.target.value }))}
                  placeholder="Enter inspector ID (e.g., A1B2)"
                  disabled={!!dialog?.item?.inspector_id}
                />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-900">Date of Joining</div>
                <Input
                  type="date"
                  value={profileForm.date_of_joining}
                  onChange={(e) => setProfileForm((s) => ({ ...s, date_of_joining: e.target.value }))}
                  disabled={!!dialog?.item?.date_of_joining}
                />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-900">Employment Type</div>
                <select
                  value={profileForm.employment_type}
                  onChange={(e) => setProfileForm((s) => ({ ...s, employment_type: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  disabled={!!dialog?.item?.employment_type}
                >
                  <option value="full_time">Full Time</option>
                  {/* <option value="contract">Contract</option> */}
                  <option value="freelancer">Freelancer</option>
                </select>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-900">Status</div>
                <select
                  value={profileForm.status}
                  onChange={(e) => setProfileForm((s) => ({ ...s, status: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  disabled={!!dialog?.item?.status}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    try {
                      if (!permissions.manageInspectors) throw new Error('Insufficient permission')
                      setFieldErrors({})
                      const res = dialog?.item?.inspector_id 
                      ? await updateInspectorProfile({
                          inspector_id: profileForm.inspector_id,
                          date_of_joining: profileForm.date_of_joining,
                          employment_type: profileForm.employment_type,
                          status: profileForm.status,
                        })
                      : await createInspectorProfile({
                          inspector_id: profileForm.inspector_id,
                          date_of_joining: profileForm.date_of_joining,
                          employment_type: profileForm.employment_type,
                          status: profileForm.status,
                        })
                      showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) || (dialog?.item?.inspector_id ? 'Profile updated' : 'Profile created') })
                      setDialog(null)
                      refresh()
                    } catch (e) {
                      const fe = extractFieldErrors(e)
                      if (Object.keys(fe).length) setFieldErrors(fe)
                      showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || (dialog?.item?.inspector_id ? 'Update failed' : 'Create failed') })
                    }
                  }}
                >
                  {dialog?.item?.inspector_id ? 'Update Profile' : 'Create Profile'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {manageAccountOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDialog(null)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="px-4 py-3">
              <div className="text-sm font-semibold">Manage account</div>
              <div className="mt-1 text-xs text-slate-500">View inspector details and verify email/SMS.</div>
            </div>
            <div className="space-y-3 px-4 pb-4">
              <div>
                <div className="text-xs font-medium text-slate-900">Name</div>
                <div className="mt-1 text-xs text-slate-600">{dialog?.item?.name || '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-900">Email</div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="text-xs text-slate-600">{dialog?.item?.email || '—'}</div>
                  <div className="flex items-center gap-1">
                    <Badge tone={dialog?.item?.is_email_verified ? 'emerald' : 'amber'}>
                      {dialog?.item?.is_email_verified ? 'Verified' : 'Not verified'}
                    </Badge>
                    {!dialog?.item?.is_email_verified && dialog?.item?.email ? (
                      <Button
                        size="xs"
                        onClick={async () => {
                          try {
                            const res = await resendOtp({ email: dialog.item.email })
                            showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) || 'Email OTP sent' })
                          } catch (e) {
                            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Resend failed' })
                          }
                        }}
                      >
                        Resend OTP
                      </Button>
                    ) : null}
                  </div>
                </div>
                {!dialog?.item?.is_email_verified && dialog?.item?.email ? (
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-medium text-slate-900">Email OTP</div>
                      <Input
                        value={verifyForm.email_otp}
                        onChange={(e) => setVerifyForm((s) => ({ ...s, email_otp: e.target.value }))}
                        placeholder="Enter email OTP"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={async () => {
                          try {
                            const res = await verifyEmailOtp({ email: dialog.item.email, email_otp: verifyForm.email_otp })
                            showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) || 'Email verified' })
                            setVerifyForm((s) => ({ ...s, email_otp: '' }))
                            refresh()
                          } catch (e) {
                            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Verification failed' })
                          }
                        }}
                      >
                        Verify
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
              <div>
                <div className="text-xs font-medium text-slate-900">Mobile number</div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="text-xs text-slate-600">{dialog?.item?.mobile_number || '—'}</div>
                  <div className="flex items-center gap-1">
                    <Badge tone={dialog?.item?.is_mobile_verified ? 'emerald' : 'amber'}>
                      {dialog?.item?.is_mobile_verified ? 'Verified' : 'Not verified'}
                    </Badge>
                    {/* Debug: {JSON.stringify({ mobile: dialog?.item?.mobile_number, is_mobile_verified: dialog?.item?.is_mobile_verified })} */}
                    {!dialog?.item?.is_mobile_verified && dialog?.item?.mobile_number ? (
                      <Button
                        size="xs"
                        onClick={async () => {
                          try {
                            const res = await resendOtp({ mobile_number: dialog.item.mobile_number })
                            showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) || 'SMS OTP sent' })
                          } catch (e) {
                            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Resend failed' })
                          }
                        }}
                      >
                        Resend OTP
                      </Button>
                    ) : null}
                  </div>
                </div>
                {!dialog?.item?.is_mobile_verified && dialog?.item?.mobile_number ? (
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-medium text-slate-900">SMS OTP</div>
                      <Input
                        value={verifyForm.sms_otp}
                        onChange={(e) => setVerifyForm((s) => ({ ...s, sms_otp: e.target.value }))}
                        placeholder="Enter SMS OTP"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={async () => {
                          try {
                            const res = await verifySmsOtp({ mobile_number: dialog.item.mobile_number, sms_otp: verifyForm.sms_otp })
                            showSnack({ tone: 'success', title: 'Success', message: responseToMessage(res) || 'Mobile verified' })
                            setVerifyForm((s) => ({ ...s, sms_otp: '' }))
                            refresh()
                          } catch (e) {
                            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Verification failed' })
                          }
                        }}
                      >
                        Verify
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
              <div>
                <div className="text-xs font-medium text-slate-900">Role</div>
                <div className="mt-1 text-xs text-slate-600">{dialog?.item?.role || '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-900">User ID</div>
                <div className="mt-1 text-xs text-slate-600">{dialog?.item?.user_id || '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-900">Status</div>
                <div className="mt-1">
                  <Badge tone={dialog?.item?.is_active ? 'emerald' : 'slate'}>
                    {dialog?.item?.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setDialog(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Address Management Dialog */}
      <ReasonDialog
        key={`address-dialog-${addressDialog?.item?.user_id}-${editingAddress?.id || 'new'}`}
        open={addressManageOpen}
        title={editingAddress ? "Edit Address" : "Manage Address"}
        description={
          <div>
            <div>{`Manage address for ${addressDialog?.item?.name || 'Inspector'} (${addressDialog?.item?.user_id || ''})`}</div>
            {editingAddress && (
              <button
                type="button"
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                onClick={() => {
                  setEditingAddress(null)
                  setAddressForm({
                    address_type: 'permanent',
                    street_address: '',
                    landmark: '',
                    city: '',
                    state: '',
                    country: 'India',
                    pincode: '',
                    status: 'active',
                    is_primary: true,
                  })
                }}
              >
                + Add New Address
              </button>
            )}
          </div>
        }
        submitLabel={editingAddress ? "Update Address" : (existingAddresses.length > 0 ? "Update Address" : "Save Address")}
        onClose={() => {
          setAddressDialog(null)
          setAddressFieldErrors({})
          setAddressForm({
            address_type: 'permanent',
            street_address: '',
            landmark: '',
            city: '',
            state: '',
            country: 'India',
            pincode: '',
            status: 'active',
            is_primary: true,
          })
          setExistingAddresses([])
          setEditingAddress(null)
        }}
        showReason={false}
        requireReason={false}
        fieldErrors={addressFieldErrors}
        additionalActions={existingAddresses.length > 0 && !editingAddress ? [
          {
            label: "Delete Address",
            tone: "danger",
            onClick: async () => {
              try {
                if (!confirm('Are you sure you want to delete this address?')) return
                const address = existingAddresses[0]
                await deleteInspectorAddress({ 
                  inspector_id: String(addressDialog.item.user_id || '').trim(), 
                  address_id: String(address.id || '').trim() 
                })
                showSnack({
                  tone: 'success',
                  title: 'Success',
                  message: 'Address deleted successfully',
                })
                // Reset form and close dialog
                setAddressDialog(null)
                setAddressForm({
                  address_type: 'permanent',
                  street_address: '',
                  landmark: '',
                  city: '',
                  state: '',
                  country: 'India',
                  pincode: '',
                  status: 'active',
                  is_primary: true,
                })
                setExistingAddresses([])
              } catch (error) {
                showSnack({
                  tone: 'danger',
                  title: 'Error',
                  message: responseToMessage(error) || 'Failed to delete address',
                })
              }
            }
          }
        ] : []}
        fields={[
          {
            name: 'address_type',
            label: 'Address Type *',
            type: 'select',
            value: addressForm.address_type,
            options: [
              { value: 'permanent', label: 'Permanent' },
              { value: 'temporary', label: 'Temporary' },
              { value: 'office', label: 'Office' },
            ],
            onChange: (value) => setAddressForm(prev => ({ ...prev, address_type: value })),
          },
          {
            name: 'street_address',
            label: 'Street Address *',
            type: 'textarea',
            value: addressForm.street_address,
            placeholder: 'Enter complete street address',
            onChange: (value) => setAddressForm(prev => ({ ...prev, street_address: value })),
          },
          {
            name: 'landmark',
            label: 'Landmark',
            type: 'text',
            value: addressForm.landmark,
            placeholder: 'Opposite Railway Station',
            onChange: (value) => setAddressForm(prev => ({ ...prev, landmark: value })),
          },
          {
            name: 'city',
            label: 'City *',
            type: 'text',
            value: addressForm.city,
            placeholder: 'Enter city name',
            onChange: (value) => setAddressForm(prev => ({ ...prev, city: value })),
          },
          {
            name: 'state',
            label: 'State *',
            type: 'text',
            value: addressForm.state,
            placeholder: 'Enter state name',
            onChange: (value) => setAddressForm(prev => ({ ...prev, state: value })),
          },
          {
            name: 'country',
            label: 'Country *',
            type: 'text',
            value: addressForm.country,
            placeholder: 'Enter country name',
            onChange: (value) => setAddressForm(prev => ({ ...prev, country: value })),
          },
          {
            name: 'pincode',
            label: 'Pincode *',
            type: 'text',
            value: addressForm.pincode,
            placeholder: 'Enter 6-digit pincode',
            onChange: (value) => {
              const digits = String(value || '').replace(/\D+/g, '').slice(0, 6)
              setAddressForm(prev => ({ ...prev, pincode: digits }))
            },
          },
          {
            name: 'status',
            label: 'Status *',
            type: 'select',
            value: addressForm.status,
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ],
            onChange: (value) => setAddressForm(prev => ({ ...prev, status: value })),
          },
          {
            name: 'is_primary',
            label: 'Primary Address',
            type: 'checkbox',
            value: addressForm.is_primary,
            onChange: (value) => setAddressForm(prev => ({ ...prev, is_primary: value })),
          },
        ]}
        onSubmit={async (form) => {
          try {
            if (!permissions.manageInspectors) throw new Error('Insufficient permission')

            // Debug: Log the addressDialog to see what data we have
            console.log('Address dialog data:', addressDialog)
            
            // Try multiple possible field names for inspector ID
            const inspectorId = String(
              addressDialog?.item?.user_id || 
              addressDialog?.item?.id || 
              addressDialog?.item?.inspector_id || 
              ''
            ).trim()
            console.log('Extracted inspectorId:', inspectorId)
            console.log('Available fields:', Object.keys(addressDialog?.item || {}))
            
            if (!inspectorId) {
              setAddressFieldErrors({ 
                general: `Inspector ID is required. Available fields: ${Object.keys(addressDialog?.item || {}).join(', ')}` 
              })
              return
            }

            // Validate required fields
            const errors = {}
            if (!form.address_type?.trim()) errors.address_type = 'This field is required'
            if (!form.street_address?.trim()) errors.street_address = 'This field is required'
            if (!form.city?.trim()) errors.city = 'This field is required'
            if (!form.state?.trim()) errors.state = 'This field is required'
            if (!form.country?.trim()) errors.country = 'This field is required'
            if (!form.pincode?.trim()) errors.pincode = 'This field is required'
            else if (form.pincode.length !== 6) errors.pincode = 'Pincode must be exactly 6 digits'

            if (Object.keys(errors).length > 0) {
              setAddressFieldErrors(errors)
              return
            }

            setAddressFieldErrors({})

            // Start with only the required fields
            const payload = {
              street_address: form.street_address,
              city: form.city,
              state: form.state,
              pincode: form.pincode,
            }
            
            // Add optional fields only if they have values
            if (form.address_type && form.address_type.trim()) {
              payload.address_type = form.address_type.trim()
            }
            if (form.landmark && form.landmark.trim()) {
              payload.landmark = form.landmark.trim()
            }
            if (form.country && form.country.trim()) {
              payload.country = form.country.trim()
            }
            if (form.status && form.status.trim()) {
              payload.status = form.status.trim()
            }
            if (form.is_primary !== undefined) {
              payload.is_primary = Boolean(form.is_primary)
            }

            let result
            const existingAddress = existingAddresses[0]
            if (existingAddress && existingAddress.id) {
              result = await updateInspectorAddress({ 
                inspector_id: inspectorId, 
                address_id: existingAddress.id, 
                ...payload 
              })
              showSnack({
                tone: 'success',
                title: 'Success',
                message: responseToMessage(result) || 'Address updated successfully',
              })
            } else {
              result = await createInspectorAddress({ inspector_id: inspectorId, ...payload })
              showSnack({
                tone: 'success',
                title: 'Success',
                message: responseToMessage(result) || 'Address created successfully',
              })
            }
            
            setAddressDialog(null)
            setAddressFieldErrors({})
            setEditingAddress(null)
            setAddressForm({
              address_type: 'permanent',
              street_address: '',
              landmark: '',
              city: '',
              state: '',
              country: 'India',
              pincode: '',
              status: 'active',
              is_primary: true,
            })
            setExistingAddresses([])
          } catch (e) {
            const fe = extractFieldErrors(e)
            if (Object.keys(fe).length) {
              setAddressFieldErrors(fe)
              const first = Object.values(fe)[0]
              showSnack({ tone: 'danger', title: 'Error', message: String(first || 'Failed to save address') })
              return
            }
            showSnack({ tone: 'danger', title: 'Error', message: responseToMessage(e) || 'Failed to save address' })
          }
        }}
      />

      {/* Existing Addresses Section */}
      {addressManageOpen && existingAddresses.length > 0 && (
        <div className="mt-4 border rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Existing Addresses</h3>
          <div className="space-y-3">
            {existingAddresses.map((address) => (
              <div key={address.id} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium capitalize">{address.address_type}</span>
                      {address.is_primary && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Primary</span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded ${
                        address.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {address.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{address.street_address}</p>
                      {address.landmark && <p className="text-xs">Landmark: {address.landmark}</p>}
                      <p>{address.city}, {address.state}, {address.country} - {address.pincode}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      type="button"
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => {
                        console.log('Editing address:', address)
                        setEditingAddress(address)
                        const newForm = {
                          address_type: address.address_type,
                          street_address: address.street_address,
                          landmark: address.landmark || '',
                          city: address.city,
                          state: address.state,
                          country: address.country,
                          pincode: address.pincode,
                          status: address.status,
                          is_primary: address.is_primary,
                        }
                        console.log('Setting address form to:', newForm)
                        setAddressForm(newForm)
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      onClick={async () => {
                        try {
                          await deleteInspectorAddress({ 
                            inspector_id: String(addressDialog.item.user_id || '').trim(), 
                            address_id: String(address.id || '').trim() 
                          })
                          showSnack({
                            tone: 'success',
                            title: 'Success',
                            message: 'Address deleted successfully',
                          })
                          // Refresh addresses list
                          const response = await getInspectorAddresses({ inspector_id: String(addressDialog.item.user_id || '').trim() })
                          let addresses = response?.data || response || []
                          // If it's a single object, wrap it in an array
                          if (addresses && !Array.isArray(addresses)) {
                            addresses = [addresses]
                          }
                          setExistingAddresses(addresses)
                        } catch (error) {
                          showSnack({
                            tone: 'danger',
                            title: 'Error',
                            message: responseToMessage(error) || 'Failed to delete address',
                          })
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
