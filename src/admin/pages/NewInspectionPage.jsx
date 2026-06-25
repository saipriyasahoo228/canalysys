import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, FilePlus2, MoreVertical, X, Download } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { listCategoryPricing } from '../../api/categorypricing'
import { listBrands, listModels, listVariants, listCategoryValues } from '../../api/vehiclemaster'
import { listVehicleCategoryMappings } from '../../api/categorymapping'
import { createPDIRequest, listPDIRequests, getPDIRequestById, assignInspector, confirmManualPayment, confirmManualRemainingPayment, createPaymentLink, getPaymentStatus, verifyPaymentLink, deletePdiRequest, refundPdiRequest, updatePdiBookingStatus, updatePdiPaymentStatus } from '../../api/inspection'
import { listCustomers, deleteCustomer, getCustomerBookings } from '../../api/customer'
import { getAvailabilities, getInspectorAvailabilityByDate, getAvailablePdiSlots } from '../../api/inspectoravailibility'
import { listInspectors } from '../../api/inspectoronboard'
import { getPDIReportByRequestId, downloadPDIReportPDF } from '../../api/inspectionreport'
import { listCities } from '../../api/city'
import { Badge, Button, Card, Input, PaginatedTable, Select, cx } from '../ui/Ui'
import { ViewDetailsDialog } from '../ui/ViewDetailsDialog'
import { CustomDatePicker } from '../ui/CustomDatePicker'
import { formatDate, formatDateTime } from '../utils/format'

const VEHICLE_TYPE_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'pre_owned', label: 'Pre-Owned' },
]

const PAYMENT_METHOD_OPTIONS = [
  { value: 'card', label: 'Credit/Debit Cards' },
  { value: 'net_banking', label: 'Net Banking' },
  { value: 'upi', label: 'UPI Payments' },
  { value: 'wallet', label: 'Wallets (Paytm, Amazon Pay)' },
]

const INDIAN_STATE_OPTIONS = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
]

function getPagedItems(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.items)) return response.items
  if (Array.isArray(response?.results)) return response.results
  if (Array.isArray(response?.data)) return response.data
  return []
}

function normalizeVehicleTypeForMapping(vehicleType) {
  const value = String(vehicleType || '').trim()
  if (!value) return ''
  if (value === 'pre_owned') return 'owned'
  return value
}

function getMappingVehicleType(item) {
  return normalizeVehicleTypeForMapping(item?.vehicle_type || item?.vehicle_type_label)
}

function doesMappingVehicleTypeMatch(item, selectedVehicleType) {
  const selectedType = normalizeVehicleTypeForMapping(selectedVehicleType)
  if (!selectedType) return false
  return getMappingVehicleType(item) === selectedType
}

function formatDateDisplay(dateIso) {
  const d = String(dateIso || '').trim()
  if (!d) return ''
  const date = new Date(`${d}T00:00:00`)
  if (!Number.isFinite(date.getTime())) return d
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  const dayName = dayNames[date.getDay()]
  const monthName = monthNames[date.getMonth()]
  const dd = String(date.getDate()).padStart(2, '0')
  
  return `${dayName}, ${monthName} ${dd}`
}

function formatAddress(form) {
  const parts = [
    form.houseNumber,
    form.areaStreet,
    form.city,
    form.district,
    form.state,
    form.pincode
  ].filter(Boolean)
  
  return parts.join(', ')
}

function formatAddressDisplay(addressString) {
  if (!addressString) return '—'
  
  // Split by comma and clean up
  const parts = addressString.split(',').map(part => part.trim()).filter(Boolean)
  
  if (parts.length === 0) return '—'
  
  // Format with line breaks for better readability
  let formatted = parts[0] // House Number
  
  if (parts.length >= 2) {
    formatted += ', ' + parts[1] // Area/Street
  }
  
  if (parts.length >= 3) {
    formatted += '\n' + parts[2] // City
  }
  if (parts.length >= 4) {
    formatted += ', ' + parts[3] // District
  }
  
  if (parts.length >= 5) {
    formatted += '\n' + parts[4] // State
  }
  if (parts.length >= 6) {
    formatted += ', ' + parts[5] // Pin Code
  }
  
  return formatted
}

function formatTimeToAMPM(timeString) {
  if (!timeString) return '—'
  
  // Parse time string like "14:00:00"
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours)
  const minute = parseInt(minutes)
  
  // Convert to 12-hour format
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12 // Convert 0 to 12
  
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
}

function isSlotInPast(slot, selectedDate) {
  if (!slot || !selectedDate) return false
  
  const now = new Date()
  const today = now.toDateString()
  const slotDate = new Date(selectedDate).toDateString()
  
  // Only check time for today's slots
  if (today !== slotDate) return false
  
  // Parse slot start time (e.g., "11:00:00")
  const [startHours, startMinutes] = slot.start_24h.split(':')
  const slotStartTime = new Date()
  slotStartTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0)
  
  // If current time is past slot start time, slot is unavailable (in progress or completed)
  return now >= slotStartTime
}

export function NewInspectionPage() {
  console.log('🔍 Debug - NewInspectionPage component rendering')
  
  // State for time slots
  const [timeSlots, setTimeSlots] = useState([])
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  
  // State for availability data
  const [, setAvailabilityData] = useState([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [availabilityFetched, setAvailabilityFetched] = useState(false)
  
  // State for inspector availability by date (busy/free status)
  const [, setInspectorAvailabilityByDate] = useState({})
  const [, setLoadingInspectorAvailability] = useState(false)
  const [selectedFilterDate, setSelectedFilterDate] = useState('')
  
  // State for date filtering
  // State for payment processing
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false)
  const [manualPaymentMode, setManualPaymentMode] = useState('Cash')
  const [manualReferenceNo, setManualReferenceNo] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('online') // 'online' or 'cash'
  
  // State for QR code display
  const [showPaymentQRModal, setShowPaymentQRModal] = useState(false)
  const [paymentQRData, setPaymentQRData] = useState(null)
  const [paymentStatusLoading, setPaymentStatusLoading] = useState(false)
  const [verifyPaymentLoading, setVerifyPaymentLoading] = useState(false)
  
  // State for remaining payment
  const [showRemainingPaymentModal, setShowRemainingPaymentModal] = useState(false)
  const [remainingPaymentRequestId, setRemainingPaymentRequestId] = useState(null)
  const [remainingPaymentData, setRemainingPaymentData] = useState(null)
  const [remainingPaymentMethod, setRemainingPaymentMethod] = useState('online') // 'online' or 'cash'
  const [remainingManualPaymentMode, setRemainingManualPaymentMode] = useState('Cash')
  const [remainingManualReferenceNo, setRemainingManualReferenceNo] = useState('')
  const [remainingPaymentLoading, setRemainingPaymentLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [detailType, setDetailType] = useState(null) // 'customer', 'vehicle', 'booking'
  const [showAssignInspector, setShowAssignInspector] = useState(false)
  const [assignRequestId, setAssignRequestId] = useState(null)
  const [inspectors, setInspectors] = useState([])
  const [selectedInspector, setSelectedInspector] = useState('')
  const [assignmentReason, setAssignmentReason] = useState('')
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  
  // State for PDI Report
  const [showPDIReport, setShowPDIReport] = useState(false)
  const [pdiReportData, setPdiReportData] = useState(null)
  const [pdiReportPdfUrl, setPdiReportPdfUrl] = useState(null)
  const [pdiReportLoading, setPdiReportLoading] = useState(false)
  const [loadingReportRequestId, setLoadingReportRequestId] = useState(null)

  // State for Refund modal
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundRequestId, setRefundRequestId] = useState(null)
  const [refundModalData, setRefundModalData] = useState(null)
  const [refundModalFetchLoading, setRefundModalFetchLoading] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [refundLoading, setRefundLoading] = useState(false)

  // State for Update Booking Status modal
  const [showUpdateBookingStatusModal, setShowUpdateBookingStatusModal] = useState(false)
  const [updateBookingStatusRequestId, setUpdateBookingStatusRequestId] = useState(null)
  const [updateBookingStatusValue, setUpdateBookingStatusValue] = useState('')
  const [updateBookingStatusReason, setUpdateBookingStatusReason] = useState('')
  const [updateBookingStatusLoading, setUpdateBookingStatusLoading] = useState(false)

  // State for Update Payment Status modal
  const [showUpdatePaymentStatusModal, setShowUpdatePaymentStatusModal] = useState(false)
  const [updatePaymentStatusRequestId, setUpdatePaymentStatusRequestId] = useState(null)
  const [updatePaymentModalData, setUpdatePaymentModalData] = useState(null)
  const [updatePaymentModalFetchLoading, setUpdatePaymentModalFetchLoading] = useState(false)
  const [updatePaymentStatusValue, setUpdatePaymentStatusValue] = useState('')
  const [updatePaymentStatusReason, setUpdatePaymentStatusReason] = useState('')
  const [updatePaymentStatusLoading, setUpdatePaymentStatusLoading] = useState(false)

  // State for advanced PDI filters
  const [selectedInspectorFilter, setSelectedInspectorFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [inspectorsList, setInspectorsList] = useState([])
  const [, setLoadingInspectorsList] = useState(false)

  // State for cities and districts from API
  const [cities, setCities] = useState([])
  const [districts, setDistricts] = useState([])
  const [, setLoadingCities] = useState(false)

  // Fetch cities and districts on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingCities(true)
        const data = await listCities()
        const items = Array.isArray(data) ? data : data?.items || data?.results || []
        setCities(items)
        
        // Extract unique districts from cities
        const uniqueDistricts = {}
        items.forEach(city => {
          if (city.district && city.district_name) {
            uniqueDistricts[city.district] = city.district_name
          }
        })
        const districtList = Object.entries(uniqueDistricts).map(([id, name]) => ({
          id: Number(id),
          name: name
        }))
        setDistricts(districtList)
      } catch (error) {
        console.error('Failed to load cities:', error)
      } finally {
        setLoadingCities(false)
      }
    }
    fetchCities()
  }, [])

  // Function to fetch inspectors list for filters
  const fetchInspectorsList = async () => {
    try {
      setLoadingInspectorsList(true)
      const response = await listInspectors()
      console.log('✅ Inspectors list fetched for filters:', response.inspectors)
      console.log('✅ Inspector IDs and names:', response.inspectors?.map(i => ({ 
        user_id: i.user_id, 
        user_idType: typeof i.user_id,
        name: i.name,
        allFields: Object.keys(i)
      })))
      setInspectorsList(response.inspectors || [])
    } catch (error) {
      console.error('❌ Failed to fetch inspectors list:', error)
      setInspectorsList([])
    } finally {
      setLoadingInspectorsList(false)
    }
  }

  // Function to fetch and show PDI report
  const fetchAndShowPDIReport = async (requestId) => {
    try {
      setLoadingReportRequestId(requestId)
      setPdiReportLoading(true)
      const [reportData, pdfBlob] = await Promise.all([
        getPDIReportByRequestId(requestId),
        downloadPDIReportPDF(requestId)
      ])
      console.log('✅ PDI report fetched:', reportData)
      setPdiReportData(reportData)
      const pdfUrl = URL.createObjectURL(pdfBlob)
      setPdiReportPdfUrl(pdfUrl)
      setShowPDIReport(true)
      setActionsMenu(null)
    } catch (error) {
      console.error('❌ Failed to fetch PDI report:', error)
      alert(error.response?.data?.detail || error.message || 'Failed to load PDI report. Please try again.')
    } finally {
      setPdiReportLoading(false)
      setLoadingReportRequestId(null)
    }
  }

  // Function to download PDI report as PDF
  const downloadPDIReport = () => {
    if (!pdiReportPdfUrl || !pdiReportData) return

    const link = document.createElement('a')
    link.href = pdiReportPdfUrl
    link.download = `PDI_Report_${pdiReportData.request_id}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Function to fetch and show PDI request details
  const fetchAndShowDetails = async (requestId, type) => {
    try {
      setDetailLoading(true)
      setDetailType(type)
      const details = await getPDIRequestById(requestId)
      console.log(`✅ ${type} details fetched:`, details)
      setDetailData(details)
      setActionsMenu(null)
    } catch (error) {
      console.error(`❌ Failed to fetch ${type} details:`, error)
      alert(`Failed to load ${type} details. Please try again.`)
    } finally {
      setDetailLoading(false)
    }
  }

  // Function to fetch inspectors
  const fetchInspectors = async () => {
    try {
      const response = await listInspectors()
      console.log('✅ Inspectors fetched:', response.inspectors)
      setInspectors(response.inspectors || [])
    } catch (error) {
      console.error('❌ Failed to fetch inspectors:', error)
      alert('Failed to load inspectors. Please try again.')
    }
  }

  // Function to open assign inspector dialog
  const openAssignInspector = async (requestId) => {
    console.log('🔍 Debug - openAssignInspector called with:', requestId, typeof requestId)
    console.log('🔍 Debug - Raw requestId:', requestId, typeof requestId)
    const requestIdString = typeof requestId === 'string' ? requestId : String(requestId?.requestId || requestId || '')
    console.log('🔍 Debug - Processed requestId:', requestIdString)
    
    setAssignRequestId(requestIdString)
    setSelectedInspector('')
    setAssignmentReason('')
    setShowAssignInspector(true)
    setActionsMenu(null)
    
    console.log('🔍 Debug - Dialog opened with states:', {
      assignRequestId: requestIdString,
      selectedInspector: '',
      assignmentReason: '',
      showAssignInspector: true
    })
    
    // Fetch inspectors if not already loaded
    if (inspectors.length === 0) {
      console.log('🔍 Debug - Fetching inspectors...')
      await fetchInspectors()
    } else {
      console.log('🔍 Debug - Inspectors already loaded:', inspectors.length)
    }
  }

  // Function to open remaining payment modal
  const openRemainingPayment = async (requestId) => {
    console.log('🔍 Debug - openRemainingPayment called with:', requestId)
    
    try {
      // Fetch PDI request details to get payment information
      const details = await getPDIRequestById(requestId)
      console.log('✅ PDI details fetched for remaining payment:', details)
      
      // Use the internal database ID for API calls, not the request_id
      setRemainingPaymentRequestId(details.id) // Use details.id instead of requestId
      setRemainingPaymentData(details)
      setRemainingPaymentMethod('online')
      setRemainingManualPaymentMode('Cash')
      setRemainingManualReferenceNo('')
      setShowRemainingPaymentModal(true)
      setActionsMenu(null)
    } catch (error) {
      console.error('❌ Failed to fetch PDI details for remaining payment:', error)
      alert('Failed to load payment details. Please try again.')
    }
  }

  // Function to assign inspector
  const handleAssignInspector = async () => {
    console.log('🔍 Debug - assignRequestId:', assignRequestId, typeof assignRequestId)
    console.log('🔍 Debug - selectedInspector:', selectedInspector, typeof selectedInspector)
    console.log('🔍 Debug - assignmentReason:', assignmentReason, typeof assignmentReason)
    
    // Ensure we have proper string values
    const requestIdStr = String(assignRequestId || '').trim()
    const inspectorIdStr = selectedInspector ? String(selectedInspector).trim() : ''
    
    try {
      setAssignmentLoading(true)
      
      // Construct payload in UI - only include inspector_id if selected
      const payload = {
        force: true
      }
      
      // Only add inspector_id if one is selected (using the ID value)
      if (selectedInspector && selectedInspector.trim() !== '') {
        payload.inspector_id = inspectorIdStr
      }
      
      // Add reason only if provided
      if (assignmentReason && assignmentReason.trim() !== '') {
        payload.reason = assignmentReason.trim()
      }
      
      console.log('🔍 Debug - Final API payload:', payload)
      
      const result = await assignInspector(requestIdStr, payload)
      console.log('✅ Inspector assigned:', result)
      alert('Inspector assigned successfully!')
      setShowAssignInspector(false)
      setSelectedInspector('')
      setAssignmentReason('')
      setAssignRequestId(null)
      
      // Refresh PDI requests to show updated assignment
      refreshPDIRequests()
    } catch (error) {
      console.error('❌ Failed to assign inspector:', error)
      alert(error.message || 'Failed to assign inspector. Please try again.')
    } finally {
      setAssignmentLoading(false)
    }
  }

  const { data: customers, error: customersError, refresh: refreshCustomers } = usePolling(
    'customers',
    () => listCustomers(),
    { intervalMs: 15_000 }
  )

  const { data: pdiRequestsData, loading: loadingPDIRequests, error: pdiRequestsError, refresh: refreshPDIRequests } = usePolling(
    'pdi-requests',
    () => {
      const params = { page: 1 }
      
      // Add inspector filter to API call
      if (selectedInspectorFilter) {
        params.inspector_id = selectedInspectorFilter
        console.log('🔍 Adding inspector filter:', selectedInspectorFilter)
      }
      
      // Add date range filters to API call (convert dd/mm/yyyy to yyyy-mm-dd)
      if (startDate) {
        const [day, month, year] = startDate.split('/')
        params.start_date = `${year}-${month}-${day}`
        console.log('🔍 Adding start_date filter:', params.start_date)
      }
      
      if (endDate) {
        const [day, month, year] = endDate.split('/')
        params.end_date = `${year}-${month}-${day}`
        console.log('🔍 Adding end_date filter:', params.end_date)
      }
      
      console.log('🔍 Final API params:', params)
      return listPDIRequests(params)
    },
    { intervalMs: 15_000, dependencies: [selectedInspectorFilter, startDate, endDate] }
  )

  // Function to fetch time slots for a selected date
  const fetchTimeSlots = async (date) => {
    if (!date) {
      setTimeSlots([])
      setSelectedTimeSlot('')
      return
    }

    try {
      setLoadingTimeSlots(true)
      const response = await getAvailablePdiSlots(date)
      setTimeSlots(response.slots || [])
      setSelectedTimeSlot('')
    } catch (error) {
      console.error('❌ Failed to fetch PDI time slots:', error)
      setTimeSlots([])
      setSelectedTimeSlot('')
    } finally {
      setLoadingTimeSlots(false)
    }
  }
  const _generateDateSlots = (availabilityData = [], inspectorAvailabilityByDate = {}) => {
    console.log('🗓️ generateDateSlots called with:', { availabilityData, inspectorAvailabilityByDate, selectedFilterDate })
    const slots = []
    const today = new Date()
    
    // Group availability data by date and count available inspectors
    const availabilityByDate = {}
    availabilityData.forEach(item => {
      if (item.date) {
        if (!availabilityByDate[item.date]) {
          availabilityByDate[item.date] = {
            present: [],
            absent: []
          }
        }
        
        if (item.availability_status === 'present') {
          availabilityByDate[item.date].present.push({
            id: item.id,
            inspector_id: item.inspector_id,
            inspector_name: item.inspector_name
          })
        } else {
          availabilityByDate[item.date].absent.push({
            id: item.id,
            inspector_id: item.inspector_id,
            inspector_name: item.inspector_name
          })
        }
      }
    })
    
    console.log('📅 Grouped availability by date:', availabilityByDate)
    
    // Determine which dates to show
    let datesToShow = []
    if (selectedFilterDate) {
      // Show only the filtered date
      datesToShow = [selectedFilterDate]
    } else {
      // Show next 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        const yyyy = date.getFullYear()
        const mm = String(date.getMonth() + 1).padStart(2, '0')
        const dd = String(date.getDate()).padStart(2, '0')
        datesToShow.push(`${yyyy}-${mm}-${dd}`)
      }
    }
    
    // Generate slots for the determined dates
    datesToShow.forEach((iso, index) => {
      const date = new Date(`${iso}T00:00:00`)
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      
      const dayName = dayNames[date.getDay()]
      const monthName = monthNames[date.getMonth()]
      const dd = String(date.getDate()).padStart(2, '0')
      
      const display = `${dayName}, ${monthName} ${dd}`
      const dayAvailability = availabilityByDate[iso] || { present: [], absent: [] }
      const availableInspectors = dayAvailability.present
      const totalInspectors = availableInspectors.length
      
      // Get inspector availability for this date with busy/free status
      const inspectorStatusForDate = inspectorAvailabilityByDate[iso] || []
      
      // Count free inspectors (present + not busy)
      const freeInspectors = inspectorStatusForDate.filter(inspector => 
        inspector.availability_status === 'present' && !inspector.is_busy && inspector.is_free
      )
      
      // Count busy inspectors
      const busyInspectors = inspectorStatusForDate.filter(inspector => 
        inspector.is_busy && !inspector.is_free
      )
      
      const freeInspectorCount = freeInspectors.length
      const busyInspectorCount = busyInspectors.length
      
      console.log(`📅 Date ${iso}: Total inspectors: ${totalInspectors}, Free: ${freeInspectorCount}, Busy: ${busyInspectorCount}`)
      
      // Slot is available only if there are free inspectors
      const isSlotAvailable = freeInspectorCount > 0
      
      slots.push({
        value: iso,
        display: display,
        isToday: !selectedFilterDate && index === 0,
        isTomorrow: !selectedFilterDate && index === 1,
        totalInspectors: totalInspectors,
        availableInspectors: availableInspectors,
        inspectorCount: totalInspectors,
        totalInspectorCount: totalInspectors,
        freeInspectorCount: freeInspectorCount,
        busyInspectorCount: busyInspectorCount,
        bookedCount: busyInspectorCount, // Use busy count as booked count
        isAvailable: isSlotAvailable, // Available only if free inspectors > 0
        inspectorStatus: inspectorStatusForDate // Store detailed status for debugging
      })
    })
    
    console.log('🎯 Final date slots generated:', slots)
    return slots
  }

  // Function to handle date filtering
  const _handleDateFilter = async (date) => {
    console.log('🔄 handleDateFilter called with date:', date)
    
    try {
      setLoadingInspectorAvailability(true)
      setSelectedFilterDate(date)
      
      if (date) {
        // Fetch availability for specific date
        const response = await getInspectorAvailabilityByDate(date)
        const availabilityByDate = { [date]: response?.items || [] }
        setInspectorAvailabilityByDate(availabilityByDate)
        console.log('✅ Filtered availability fetched for date:', date, availabilityByDate)
      } else {
        // Reset to show all dates (fetch for next 30 days)
        const today = new Date()
        const dates = []
        for (let i = 0; i < 30; i++) {
          const date = new Date(today)
          date.setDate(today.getDate() + i)
          const yyyy = date.getFullYear()
          const mm = String(date.getMonth() + 1).padStart(2, '0')
          const dd = String(date.getDate()).padStart(2, '0')
          dates.push(`${yyyy}-${mm}-${dd}`)
        }
        await fetchInspectorAvailabilityByDate(dates)
      }
    } catch (error) {
      console.error('❌ Failed to fetch filtered availability:', error)
      setInspectorAvailabilityByDate({})
    } finally {
      setLoadingInspectorAvailability(false)
    }
  }

  // Function to fetch inspector availability by date (busy/free status)
  const fetchInspectorAvailabilityByDate = async (dates) => {
    console.log('🔄 fetchInspectorAvailabilityByDate called with dates:', dates)
    
    try {
      setLoadingInspectorAvailability(true)
      const availabilityPromises = dates.map(date => getInspectorAvailabilityByDate(date))
      const responses = await Promise.all(availabilityPromises)
      
      const availabilityByDate = {}
      responses.forEach((response, index) => {
        const date = dates[index]
        if (response && response.items) {
          availabilityByDate[date] = response.items
        } else {
          availabilityByDate[date] = []
        }
      })
      
      console.log('✅ Inspector availability by date fetched:', availabilityByDate)
      setInspectorAvailabilityByDate(availabilityByDate)
    } catch (error) {
      console.error('❌ Failed to fetch inspector availability by date:', error)
      setInspectorAvailabilityByDate({})
    } finally {
      setLoadingInspectorAvailability(false)
    }
  }

  // Function to fetch availability data
  const fetchAvailabilityData = async () => {
    console.log('🔄 fetchAvailabilityData called, availabilityFetched:', availabilityFetched)
    if (availabilityFetched) return // Avoid multiple fetches
    
    try {
      console.log('📡 Starting availability API call...')
      setLoadingAvailability(true)
      
      // Fetch availability data
      let allAvailabilityResults = []
      let page = 1
      let hasNext = true
      
      while (hasNext) {
        console.log(`📡 Fetching availability page ${page}...`)
        const availabilityResponse = await getAvailabilities({ page })
        const results = availabilityResponse?.results || []
        allAvailabilityResults = [...allAvailabilityResults, ...results]
        
        console.log(`✅ Page ${page} results:`, results.length, 'items')
        console.log(`📊 Total so far:`, allAvailabilityResults.length)
        
        // Check if there's a next page
        hasNext = !!availabilityResponse?.next
        if (hasNext) {
          page++
        }
      }
      
      console.log('✅ All availability API responses:', allAvailabilityResults)
      console.log('📊 Total availability records fetched:', allAvailabilityResults.length)
      const availabilityResults = allAvailabilityResults
      console.log('📊 Processed availability results:', availabilityResults)
      setAvailabilityData(Array.isArray(availabilityResults) ? availabilityResults : [])
      
      // Generate dates for the next 30 days to fetch inspector availability
      const today = new Date()
      const dates = []
      for (let i = 0; i < 30; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        const yyyy = date.getFullYear()
        const mm = String(date.getMonth() + 1).padStart(2, '0')
        const dd = String(date.getDate()).padStart(2, '0')
        dates.push(`${yyyy}-${mm}-${dd}`)
      }
      
      // Fetch inspector availability for these dates
      await fetchInspectorAvailabilityByDate(dates)
      
      setAvailabilityFetched(true)
      console.log('✅ fetchAvailabilityData completed successfully')
    } catch (error) {
      console.error('❌ Failed to fetch availability data:', error)
      setAvailabilityData([])
      setInspectorAvailabilityByDate({})
    } finally {
      setLoadingAvailability(false)
      console.log('🏁 fetchAvailabilityData finished, loading set to false')
    }
  }

  // Function to handle manual payment
  const handleManualPayment = async () => {
    setShowManualPaymentModal(true)
  }

  const handleManualPaymentSubmit = async () => {
    setPaymentLoading(true)
    setShowManualPaymentModal(false)
    
    try {
      // Validate required fields first
      const customerName = String(wizardForm.customerName || '').trim()
      const customerEmail = String(wizardForm.customerEmail || '').trim()
      const customerPhone = String(wizardForm.customerPhone || '').trim()
      
      if (!customerName) {
        alert('This field is required.')
        setPaymentLoading(false)
        return
      }
      
      if (!customerPhone) {
        alert('This field is required.')
        setPaymentLoading(false)
        return
      }
      
      if (customerPhone.length !== 10) {
        alert('Mobile number must be exactly 10 digits')
        setPaymentLoading(false)
        return
      }
      
      if (!/^\d{10}$/.test(customerPhone)) {
        alert('Mobile number must contain only numbers')
        setPaymentLoading(false)
        return
      }
      
      if (!wizardForm.makeId) {
        alert('This field is required.')
        setPaymentLoading(false)
        return
      }
      
      if (!wizardForm.modelId) {
        alert('This field is required.')
        setPaymentLoading(false)
        return
      }
      
      if (!wizardForm.variantId) {
        alert('This field is required.')
        setPaymentLoading(false)
        return
      }
      
      if (!selectedCategoryId) {
        alert('This field is required.')
        setPaymentLoading(false)
        return
      }
      
      if (!wizardForm.slotDate) {
        alert('Please select a date for the inspection.')
        setPaymentLoading(false)
        return
      }
      
      if (!wizardForm.slotTime) {
        alert('Please select a time slot for the inspection.')
        setPaymentLoading(false)
        return
      }
      
      // Step 1: Create PDI request first
      const pdiData = {
        name: customerName,
        mobile_number: customerPhone,
        email: customerEmail,
        vehicle_type: wizardForm.vehicleType === 'pre_owned' ? 'owned' : 'new',
        brand_id: parseInt(wizardForm.makeId),
        model_id: parseInt(wizardForm.modelId),
        variant_id: parseInt(wizardForm.variantId),
        category_id: parseInt(selectedCategoryId),
        address: formatAddress(wizardForm),
        city: wizardForm.city || '',
        state: wizardForm.state || '',
        country: wizardForm.country || 'India',
        pincode: wizardForm.pincode || '',
        slot_date: wizardForm.slotDate,
        slot_time: wizardForm.slotTime,
        slot_start_time: wizardForm.slotStart,
        slot_end_time: wizardForm.slotEnd,
        amount_paise: priceInr * 100, // Send full amount
        advance_amount_paise: 50000, // But specify advance is 500
        remaining_amount_paise: (priceInr - 500) * 100 // Calculate remaining
      }
      
      console.log('💰 PDI Amount being sent:', priceInr, 'paise:', priceInr * 100)
      
      const pdiResponse = await createPDIRequest(pdiData)
      console.log('✅ PDI request created:', pdiResponse)
      console.log('📋 PDI Data sent:', pdiData)
      console.log('📋 PDI Response:', pdiResponse.data)
      
      const requestId = pdiResponse.data.id
      const clientRequestId = pdiResponse.data.request_id
      
      console.log('🔍 Request ID:', requestId)
      console.log('🔍 Client Request ID:', clientRequestId)
      
      // Step 2: Confirm manual payment
      const manualResponse = await confirmManualPayment(clientRequestId, manualPaymentMode, manualReferenceNo)
      console.log('✅ Manual payment confirmed:', manualResponse)
      
      if (manualResponse.message === 'Manual advance confirmed and request confirmed') {
        alert('Manual payment confirmed! Your PDI request has been confirmed.')
        
        // Refresh customers and availability data, then close all dialogs
        await refreshCustomers()
        setAvailabilityFetched(false) // Reset to force refresh
        await fetchAvailabilityData()
        setDialog(null)
      } else {
        alert('Manual payment confirmation failed. Please contact support.')
      }
      
    } catch (error) {
      console.error('Manual payment error:', error)
      alert('Manual payment failed. Please try again.')
    } finally {
      setPaymentLoading(false)
      setManualReferenceNo('')
    }
  }

  const handleRazorpayPayment = async () => {
    setPaymentLoading(true)
    
    try {
      // Validate required fields
      const customerName = String(wizardForm.customerName || '').trim()
      const customerEmail = String(wizardForm.customerEmail || '').trim()
      const customerPhone = String(wizardForm.customerPhone || '').trim()
      
      if (!customerName) {
        alert('This field is required.')
        setPaymentLoading(false)
        return
      }
      
      if (!customerPhone) {
        alert('This field is required.')
        setPaymentLoading(false)
        return
      }
      
      if (customerPhone.length !== 10) {
        alert('Mobile number must be exactly 10 digits')
        setPaymentLoading(false)
        return
      }
      
      if (!/^\d{10}$/.test(customerPhone)) {
        alert('Mobile number must contain only numbers')
        setPaymentLoading(false)
        return
      }
      
      if (!wizardForm.makeId) {
        alert('This field is required.')
        setPaymentLoading(false)
        return
      }
      
      if (!wizardForm.modelId) {
        alert('This field is required.')
        setPaymentLoading(false)
        return
      }
      
      if (!wizardForm.variantId) {
        alert('This field is required.')
        setPaymentLoading(false)
        return
      }
      
      if (!selectedCategoryId) {
        alert('This field is required.')
        setPaymentLoading(false)
        return
      }
      
      if (!wizardForm.slotDate) {
        alert('Please select a date for the inspection.')
        setPaymentLoading(false)
        return
      }
      
      if (!wizardForm.slotTime) {
        alert('Please select a time slot for the inspection.')
        setPaymentLoading(false)
        return
      }
      
      // Step 1: Create PDI request
      const pdiData = {
        name: customerName,
        mobile_number: customerPhone,
        email: customerEmail,
        vehicle_type: wizardForm.vehicleType === 'pre_owned' ? 'owned' : 'new',
        brand_id: parseInt(wizardForm.makeId),
        model_id: parseInt(wizardForm.modelId),
        variant_id: parseInt(wizardForm.variantId),
        category_id: parseInt(selectedCategoryId),
        address: formatAddress(wizardForm),
        city: wizardForm.city || '',
        state: wizardForm.state || '',
        country: wizardForm.country || 'India',
        pincode: wizardForm.pincode || '',
        slot_date: wizardForm.slotDate,
        slot_time: wizardForm.slotTime,
        slot_start_time: wizardForm.slotStart,
        slot_end_time: wizardForm.slotEnd,
        amount_paise: priceInr * 100,
        advance_amount_paise: 50000,
        remaining_amount_paise: (priceInr - 500) * 100
      }
      
      console.log('💰 PDI Amount being sent:', priceInr, 'paise:', priceInr * 100)
      
      const pdiResponse = await createPDIRequest(pdiData)
      console.log('✅ PDI request created:', pdiResponse)
      
      const requestId = pdiResponse.data.id
      const clientRequestId = pdiResponse.data.request_id
      
      console.log('🔍 Request ID:', requestId)
      console.log('🔍 Client Request ID:', clientRequestId)
      
      // Step 2: Create payment link using new API
      const paymentLinkResponse = await createPaymentLink(clientRequestId, 'advance')
      console.log('✅ Payment link created:', paymentLinkResponse)
      
      const paymentLinkUrl = paymentLinkResponse.payment_link_url
      const paymentLinkId = paymentLinkResponse.payment_link_id
      
      // Show QR code modal instead of alert
      setPaymentQRData({
        requestId: clientRequestId,
        url: paymentLinkUrl,
        linkId: paymentLinkId,
        amount: '₹500',
        type: 'advance',
        status: 'unpaid',
        amountPaid: 0
      })
      setShowPaymentQRModal(true)
      
      // Refresh and close dialog after short delay
      setTimeout(async () => {
        await refreshCustomers()
        setAvailabilityFetched(false)
        await fetchAvailabilityData()
        setDialog(null)
      }, 2000)
      
    } catch (error) {
      console.error('Payment link error:', error)
      alert(error.response?.data?.detail || error.message || 'Failed to generate payment link. Please try again.')
      setPaymentLoading(false)
    } finally {
      setPaymentLoading(false)
    }
  }

  // Handler for remaining payment via payment link
  const handleRemainingRazorpayPayment = async () => {
    if (!remainingPaymentData || !remainingPaymentRequestId) {
      alert('Payment details not available. Please try again.')
      return
    }

    setRemainingPaymentLoading(true)
    
    try {
      const clientRequestId = remainingPaymentData.request_id
      const remainingAmount = remainingPaymentData.remaining_amount_paise
      const paymentStage = remainingPaymentData.payment_stage
      
      console.log('🔍 Processing remaining payment:', {
        clientRequestId,
        remainingAmount,
        paymentStage,
        customerName: remainingPaymentData.name,
        customerPhone: remainingPaymentData.mobile_number
      })
      
      // Check if payment stage allows remaining payment
      if (paymentStage !== 'remaining_due' && paymentStage !== 'advance_paid') {
        alert('Remaining payment is not available for this request. Current payment stage: ' + (paymentStage || 'unknown'))
        setRemainingPaymentLoading(false)
        return
      }
      
      // Step 1: Create payment link for remaining payment
      const paymentLinkResponse = await createPaymentLink(clientRequestId, 'remaining')
      console.log('✅ Remaining payment link created:', paymentLinkResponse)
      
      const paymentLinkUrl = paymentLinkResponse.payment_link_url
      const paymentLinkId = paymentLinkResponse.payment_link_id
      
      // Show QR code modal instead of alert
      setPaymentQRData({
        requestId: clientRequestId,
        url: paymentLinkUrl,
        linkId: paymentLinkId,
        amount: `₹${(remainingAmount / 100).toFixed(2)}`,
        type: 'remaining',
        status: paymentStage || 'unpaid',
        amountPaid: 0
      })
      setShowPaymentQRModal(true)
      
      // Keep modal open for customer to scan
      setShowRemainingPaymentModal(false)
      setRemainingPaymentLoading(false)
      
      // Refresh PDI requests to show updated payment status
      setTimeout(() => {
        refreshPDIRequests()
      }, 2000)
      
    } catch (error) {
      console.error('Remaining payment link error:', error)
      alert(error.response?.data?.detail || error.message || 'Failed to generate remaining payment link. Please try again.')
      setRemainingPaymentLoading(false)
    }
  }

  const fetchPaymentStatusForRequest = async (requestId) => {
    try {
      const statusData = await getPaymentStatus(requestId)
      setPaymentQRData((prev) => prev ? {
        ...prev,
        status: statusData.payment_stage,
        amountPaid: statusData.amount_paid_paise,
        transactions: statusData.transactions
      } : prev)
      return statusData
    } catch (error) {
      console.error('Failed to fetch payment status:', error)
      return null
    }
  }

  const refreshPaymentStatus = async () => {
    if (!paymentQRData?.requestId) return
    setPaymentStatusLoading(true)
    try {
      await fetchPaymentStatusForRequest(paymentQRData.requestId)
    } finally {
      setPaymentStatusLoading(false)
    }
  }

  const handleVerifyPaymentLink = async () => {
    if (!paymentQRData?.requestId) {
      alert('Payment request information is missing.')
      return
    }

    setVerifyPaymentLoading(true)
    try {
      const verifyResponse = await verifyPaymentLink(paymentQRData.requestId, paymentQRData.type)
      console.log('✅ Payment link verify response:', verifyResponse)

      setPaymentQRData((prev) => prev ? {
        ...prev,
        status: verifyResponse.payment_stage || prev.status,
        transactionStatus: verifyResponse.transaction_status || prev.transactionStatus,
        amountPaid: prev.amountPaid
      } : prev)

      alert(verifyResponse.message || 'Payment verification completed.')
      await fetchPaymentStatusForRequest(paymentQRData.requestId)
    } catch (error) {
      console.error('Payment link verify error:', error)
      alert(error.response?.data?.detail || error.message || 'Verification failed. Please try again.')
    } finally {
      setVerifyPaymentLoading(false)
    }
  }

  useEffect(() => {
    if (!showPaymentQRModal || !paymentQRData?.requestId) return undefined

    const startPolling = async () => {
      await fetchPaymentStatusForRequest(paymentQRData.requestId)
    }

    startPolling()
    const intervalId = window.setInterval(() => {
      fetchPaymentStatusForRequest(paymentQRData.requestId)
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [showPaymentQRModal, paymentQRData?.requestId])

  // Handler for remaining manual payment
  const handleRemainingManualPayment = async () => {
    if (!remainingPaymentData || !remainingPaymentRequestId) {
      alert('Payment details not available. Please try again.')
      return
    }

    if (!remainingManualReferenceNo.trim()) {
      alert('Reference number is required for manual payment.')
      return
    }

    setRemainingPaymentLoading(true)
    
    try {
      const clientRequestId = remainingPaymentData.request_id
      
      console.log('🔍 Processing remaining manual payment:', {
        clientRequestId,
        paymentMode: remainingManualPaymentMode,
        referenceNo: remainingManualReferenceNo
      })
      
      // Confirm manual remaining payment
      const manualResponse = await confirmManualRemainingPayment(
        clientRequestId,
        remainingManualPaymentMode,
        remainingManualReferenceNo
      )
      
      console.log('✅ Manual remaining payment confirmed:', manualResponse)
      
      if (manualResponse.message === 'Manual remaining payment confirmed and request fully paid' || manualResponse.message === 'Manual payment confirmed') {
        alert('Manual remaining payment confirmed! Your payment is now complete.')
        setShowRemainingPaymentModal(false)
        setRemainingPaymentLoading(false)
        setRemainingManualReferenceNo('')
        
        // Refresh PDI requests to show updated payment status
        refreshPDIRequests()
      } else {
        alert('Manual remaining payment confirmation failed. Please contact support.')
        setRemainingPaymentLoading(false)
      }
      
    } catch (error) {
      console.error('Manual remaining payment error:', error)
      // Show backend error message directly
      alert(error.response?.data?.detail || error.message || 'Manual remaining payment failed. Please try again.')
      setRemainingPaymentLoading(false)
    }
  }

  // Handler for refund
  const handleRefund = async () => {
    const transactions = refundModalData?.transactions || []
    const txn = transactions[0]
    if (!txn) { alert('No transaction found for this request.'); return }
    setRefundLoading(true)
    try {
      await refundPdiRequest(refundRequestId, txn.transaction_id || txn.id, txn.amount_paise || refundModalData?.amount_paid_paise, refundReason.trim())
      alert('Refund initiated successfully!')
      setShowRefundModal(false)
      setRefundReason('')
      setRefundModalData(null)
      refreshPDIRequests()
    } catch (error) {
      alert(error?.detail || error?.message || 'Refund failed. Please try again.')
    } finally {
      setRefundLoading(false)
    }
  }

  // Handler for update booking status
  const handleUpdateBookingStatus = async () => {
    if (!updateBookingStatusValue) { alert('Status is required.'); return }
    setUpdateBookingStatusLoading(true)
    try {
      await updatePdiBookingStatus(updateBookingStatusRequestId, updateBookingStatusValue, updateBookingStatusReason.trim())
      alert('Booking status updated successfully!')
      setShowUpdateBookingStatusModal(false)
      setUpdateBookingStatusValue('')
      setUpdateBookingStatusReason('')
      refreshPDIRequests()
    } catch (error) {
      alert(error?.detail || error?.message || 'Update failed. Please try again.')
    } finally {
      setUpdateBookingStatusLoading(false)
    }
  }

  // Handler for update payment status
  const handleUpdatePaymentStatus = async () => {
    const transactions = updatePaymentModalData?.transactions || []
    const txn = transactions[0]
    if (!txn) { alert('No transaction found for this request.'); return }
    if (!updatePaymentStatusValue) { alert('Status is required.'); return }
    setUpdatePaymentStatusLoading(true)
    try {
      await updatePdiPaymentStatus(updatePaymentStatusRequestId, txn.transaction_id || txn.id, updatePaymentStatusValue, updatePaymentStatusReason.trim())
      alert('Payment status updated successfully!')
      setShowUpdatePaymentStatusModal(false)
      setUpdatePaymentModalData(null)
      setUpdatePaymentStatusValue('')
      setUpdatePaymentStatusReason('')
      refreshPDIRequests()
    } catch (error) {
      alert(error?.detail || error?.message || 'Update failed. Please try again.')
    } finally {
      setUpdatePaymentStatusLoading(false)
    }
  }

  // Hardcoded locations since API endpoint doesn't exist yet
  const hardcodedLocations = [
    { id: 'LOC-BLR-01', name: 'Bangalore' },
    { id: 'LOC-HYD-01', name: 'Hyderabad' },
    { id: 'LOC-PUN-01', name: 'Pune' }
  ]
  
  const locations = hardcodedLocations
  const locationsError = null

  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [variants, setVariants] = useState([])
  const [categoryValues, setCategoryValues] = useState([])
  const [vehicleCategoryMappings, setVehicleCategoryMappings] = useState([])
  const [loadingVehicleCategoryMappings, setLoadingVehicleCategoryMappings] = useState(false)
  const [, setLoadingVehicles] = useState(false)

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingVehicles(true)
        const [brandsData, categoryValuesData] = await Promise.all([
          listBrands(),
          listCategoryValues()
        ])
        const brandsArray = Array.isArray(brandsData) ? brandsData : (brandsData?.items || [])
        const categoryValuesArray = Array.isArray(categoryValuesData) ? categoryValuesData : (categoryValuesData?.items || [])
        setBrands(brandsArray)
        setCategoryValues(categoryValuesArray)
        
        // Fetch inspectors list for filters
        await fetchInspectorsList()
      } catch (error) {
        console.error('Failed to fetch initial data:', error)
        setBrands([])
        setCategoryValues([])
      } finally {
        setLoadingVehicles(false)
      }
    }
    fetchInitialData()
  }, [])

  const makeById = useMemo(() => new Map(brands.map((x) => [x.id, x])), [brands])
  const modelById = useMemo(() => new Map(models.map((x) => [x.id, x])), [models])
  const variantById = useMemo(() => new Map(variants.map((x) => [x.id, x])), [variants])
  const categoryById = useMemo(() => new Map(categoryValues.map((x) => [x.id, x])), [categoryValues])

  const _categoryOptions = useMemo(() => {
    return categoryValues.map((category) => ({
      value: category.id,
      label: `${category.name} (${category.category_type_detail?.name || '—'})`
    }))
  }, [categoryValues])

  const [dialog, setDialog] = useState(null)

  const [actionsMenu, setActionsMenu] = useState(null)
  const actionsMenuRef = useRef(null)

  const viewOpen = dialog?.type === 'viewCustomer'
  const raiseOpen = dialog?.type === 'raise'
  const bookingOpen = dialog?.type === 'bookingSummary'
  const reportOpen = dialog?.type === 'pdiReport'

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
        const list = await getCustomerBookings(customerId)
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
        if (mounted) setBookingLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [bookingOpen, dialog?.customer?.id, dialog?.pdiId])

  const wizardStep = raiseOpen ? Number(dialog?.step || 1) : 1

  const wizardForm = useMemo(() => {
    if (!raiseOpen) return {}
    
    const defaultForm = {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      vehicleType: '',
      makeId: '',
      modelId: '',
      variantId: '',
      category: '',
      locationId: '',
      houseNumber: '',
      areaStreet: '',
      city: '',
      district: '',
      state: '',
      pincode: '',
      country: 'India',
      slotDate: new Date().toISOString().split('T')[0], // Set today's date as default
      slotTime: '',
      slotStart: '',
      slotEnd: '',
    }
    
    const form = dialog?.form || defaultForm
    
    // Ensure slotDate is always set to today's date if not provided
    if (!form.slotDate) {
      form.slotDate = defaultForm.slotDate
    }
    
    console.log('🔍 WizardForm generated:', { slotDate: form.slotDate, hasDialogForm: !!dialog?.form })
    return form
  }, [raiseOpen, dialog?.form])

  useEffect(() => {
    if (!raiseOpen) return
    const modelId = String(wizardForm?.modelId || '').trim()
    if (!modelId) return

    let mounted = true
    ;(async () => {
      try {
        setLoadingVehicleCategoryMappings(true)

        const allItems = []
        let page = 1
        let totalCount = null

        while (true) {
          const response = await listVehicleCategoryMappings(page)
          const items = getPagedItems(response)

          if (typeof response?.count === 'number') totalCount = response.count
          allItems.push(...items)

          if (items.length === 0) break
          if (Array.isArray(response)) break
          if (typeof totalCount === 'number' && allItems.length >= totalCount) break

          page += 1
          if (page > 50) break
        }

        if (!mounted) return
        setVehicleCategoryMappings(allItems)
      } catch (error) {
        console.error('Failed to fetch vehicle category mappings:', error)
        if (!mounted) return
        setVehicleCategoryMappings([])
      } finally {
        if (mounted) setLoadingVehicleCategoryMappings(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [raiseOpen, wizardForm?.modelId])

  const mappedRowsForSelectedModel = useMemo(() => {
    const modelId = String(wizardForm?.modelId || '').trim()
    if (!modelId) return []

    const makeId = String(wizardForm?.makeId || '').trim()

    return (vehicleCategoryMappings || []).filter((item) => {
      if (!doesMappingVehicleTypeMatch(item, wizardForm?.vehicleType)) return false
      if (String(item?.model) !== modelId) return false
      if (makeId && String(item?.brand) !== makeId) return false
      return true
    })
  }, [wizardForm?.modelId, wizardForm?.makeId, wizardForm?.vehicleType, vehicleCategoryMappings])

  const mappedVariantOptions = useMemo(() => {
    const unique = new Map()
    for (const item of mappedRowsForSelectedModel) {
      const variantId = item?.variant
      if (!variantId || unique.has(String(variantId))) continue

      const fromMaster = variantById.get(variantId)
      const fuelType = item?.variant_detail?.fuel_type_display || item?.variant_detail?.fuel_type || fromMaster?.fuel_type_display || fromMaster?.fuel_type
      const name = item?.variant_name || fromMaster?.name || 'Variant'
      const label = fuelType ? `${name} (${fuelType})` : name
      unique.set(String(variantId), { value: variantId, label })
    }

    return Array.from(unique.values())
      .filter((x) => x.value)
      .sort((a, b) => String(a.label).localeCompare(String(b.label)))
  }, [mappedRowsForSelectedModel, variantById])

  const mappedCategoryOptions = useMemo(() => {
    const variantId = String(wizardForm?.variantId || '').trim()
    if (!variantId) return []

    const filtered = mappedRowsForSelectedModel.filter((item) => String(item?.variant) === variantId)

    const unique = new Map()
    for (const item of filtered) {
      const categoryId = item?.category
      const categoryTypeId = item?.category_type_id
      const key = `${categoryId || ''}::${categoryTypeId || ''}`
      if (!categoryId) continue
      if (unique.has(key)) continue

      const fromMappingLabel = item?.category_name
      const fromMappingType = item?.category_type_name
      const fromMaster = categoryById.get(categoryId)
      const label = fromMappingLabel
        ? `${fromMappingLabel} (${fromMappingType || fromMaster?.category_type_detail?.name || '—'})`
        : `${fromMaster?.name || '—'} (${fromMaster?.category_type_detail?.name || '—'})`

      unique.set(key, { value: item?.id, label })
    }

    return Array.from(unique.values())
      .filter((x) => x.value)
      .sort((a, b) => String(a.label).localeCompare(String(b.label)))
  }, [wizardForm?.variantId, mappedRowsForSelectedModel, categoryById])

  const selectedVehicleCategoryMapping = useMemo(() => {
    const selectedMappingId = String(wizardForm?.category || '').trim()
    if (!selectedMappingId) return null
    return mappedRowsForSelectedModel.find((x) => String(x?.id) === selectedMappingId) || null
  }, [mappedRowsForSelectedModel, wizardForm?.category])

  const selectedCategoryId = selectedVehicleCategoryMapping?.category ? String(selectedVehicleCategoryMapping.category) : ''

  useEffect(() => {
    if (!raiseOpen) return
    const selectedCategory = String(wizardForm?.category || '').trim()
    if (!selectedCategory) return
    const allowed = mappedCategoryOptions.some((o) => String(o.value) === selectedCategory)
    if (allowed) return

    setDialog((s) => (s && s.type === 'raise' ? { ...s, form: { ...s.form, category: '' } } : s))
  }, [raiseOpen, wizardForm?.category, mappedCategoryOptions])

  useEffect(() => {
    if (!raiseOpen) return
    const selectedVariant = String(wizardForm?.variantId || '').trim()
    if (!selectedVariant) return
    if (loadingVehicleCategoryMappings) return

    const allowed = mappedVariantOptions.some((o) => String(o.value) === selectedVariant)
    if (allowed) return

    setDialog((s) => (s && s.type === 'raise' ? { ...s, form: { ...s.form, variantId: '', category: '' } } : s))
  }, [raiseOpen, wizardForm?.variantId, mappedVariantOptions, loadingVehicleCategoryMappings])

  // Fetch time slots when dialog opens with default date
  useEffect(() => {
    console.log('🔄 useEffect triggered - raiseOpen:', raiseOpen, 'slotDate:', wizardForm.slotDate)
    if (raiseOpen && wizardForm.slotDate) {
      // Fetch time slots whenever dialog opens and there's a date selected
      console.log('🚀 Calling fetchTimeSlots for:', wizardForm.slotDate)
      fetchTimeSlots(wizardForm.slotDate)
    }
  }, [raiseOpen, wizardForm.slotDate])

  // Also fetch time slots when component first loads with default date
  useEffect(() => {
    if (wizardForm.slotDate && !dialog?.form?.slotDate) {
      // Only fetch on initial load if using default date
      console.log('🎯 Initial load - Calling fetchTimeSlots for:', wizardForm.slotDate)
      fetchTimeSlots(wizardForm.slotDate)
    }
  }, [dialog?.form?.slotDate, wizardForm.slotDate])

  // Fetch models when brand is selected
  useEffect(() => {
    const fetchModels = async () => {
      if (!wizardForm?.makeId) {
        setModels([])
        return
      }
      try {
        setLoadingVehicles(true)
        const modelsData = await listModels({ brand_id: wizardForm.makeId })
        const modelsArray = Array.isArray(modelsData) ? modelsData : (modelsData?.items || [])
        setModels(modelsArray)
      } catch (error) {
        console.error('Failed to fetch models:', error)
        setModels([])
      } finally {
        setLoadingVehicles(false)
      }
    }
    fetchModels()
  }, [wizardForm?.makeId])

  // Fetch variants when model is selected
  useEffect(() => {
    const fetchVariants = async () => {
      if (!wizardForm?.modelId) {
        setVariants([])
        return
      }
      try {
        setLoadingVehicles(true)
        const variantsData = await listVariants({ model_id: wizardForm.modelId })
        const variantsArray = Array.isArray(variantsData) ? variantsData : (variantsData?.items || [])
        setVariants(variantsArray)
      } catch (error) {
        console.error('Failed to fetch variants:', error)
        setVariants([])
      } finally {
        setLoadingVehicles(false)
      }
    }
    fetchVariants()
  }, [wizardForm?.modelId])


  const locationExtraInr = useMemo(() => {
    if (!raiseOpen) return 0
    const locId = String(wizardForm?.locationId || '').trim()
    if (!locId) return 0
    if (locId === 'LOC-BLR-01') return 0
    if (locId === 'LOC-HYD-01') return 50
    if (locId === 'LOC-PUN-01') return 75
    return 0
  }, [raiseOpen, wizardForm?.locationId])

  const [categoryPricing, setCategoryPricing] = useState([])
  const [, setLoadingPricing] = useState(false)

  useEffect(() => {
    const fetchPricing = async () => {
      if (!selectedCategoryId) {
        setCategoryPricing([])
        return
      }
      try {
        setLoadingPricing(true)
        console.log('Fetching pricing for category:', selectedCategoryId, 'vehicle type:', wizardForm.vehicleType)
        const currentVehicleType = wizardForm.vehicleType === 'pre_owned' ? 'owned' : 'new'
        const pricingData = await listCategoryPricing({ 
          category: selectedCategoryId,
          vehicle_type: currentVehicleType 
        })
        console.log('Pricing API response:', pricingData)
        
        // Handle different response structures
        if (pricingData?.data) {
          // Single item response in data property
          console.log('Setting pricing from data property:', pricingData.data)
          setCategoryPricing([pricingData.data])
        } else if (pricingData?.category) {
          // Single item response directly
          console.log('Setting pricing from direct response:', pricingData)
          setCategoryPricing([pricingData])
        } else {
          // Array response
          const pricingArray = Array.isArray(pricingData) ? pricingData : (pricingData?.items || [])
          console.log('Setting pricing from array:', pricingArray)
          setCategoryPricing(pricingArray)
        }
      } catch (error) {
        console.error('Failed to fetch category pricing:', error)
        setCategoryPricing([])
      } finally {
        setLoadingPricing(false)
      }
    }

    fetchPricing()
  }, [selectedCategoryId, wizardForm?.vehicleType])

  const priceInr = useMemo(() => {
    if (!raiseOpen) return 0
    
    // Ensure categoryPricing is an array
    const pricingArray = Array.isArray(categoryPricing) ? categoryPricing : []
    console.log('Available pricing array:', pricingArray)
    
    // Only use category pricing API - no fallback
    const currentVehicleType = wizardForm?.vehicleType === 'pre_owned' ? 'owned' : 'new'
    console.log('Looking for category:', Number(selectedCategoryId), 'vehicle type:', currentVehicleType)
    
    const categoryPrice = pricingArray.find(p => 
      p.category === Number(selectedCategoryId) && 
      p.vehicle_type === currentVehicleType
    )
    
    console.log('Found category price:', categoryPrice)
    
    if (categoryPrice) {
      const basePrice = Number(categoryPrice.price) || 0
      const locAdd = Number(locationExtraInr) || 0
      const finalPrice = basePrice + locAdd
      console.log('Using API pricing - base:', basePrice, 'location:', locAdd, 'final:', finalPrice)
      return finalPrice
    }
    
    // No fallback - return 0 if no pricing data available
    console.log('No pricing data found, returning 0')
    return 0
  }, [raiseOpen, locationExtraInr, selectedCategoryId, wizardForm?.vehicleType, categoryPricing])

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

  const _locationNameById = useMemo(() => {
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
      {key: 'createdAt', label: 'Booked at', value: b?.createdAt ? formatDate(String(b.createdAt).slice(0, 10)) : '—', fullWidth: true },
      { key: 'slot', label: 'Selected slot', value: b?.slot_date ? `${formatDateDisplay(b.slot_date)}\n${formatTimeToAMPM(b.slot_start_time)} - ${formatTimeToAMPM(b.slot_end_time)}` : '—', fullWidth: true },
      { key: 'location', label: 'Address', value: formatAddressDisplay(b?.address) || '—', fullWidth: true },
      { key: 'vehicleType', label: 'Vehicle type', value: b?.vehicle_type === 'pre_owned' ? 'Pre-Owned' : 'New' },
      { key: 'vehicle', label: 'Vehicle', value: `${b?.brand_name || '—'} ${b?.model_name || '—'} ${b?.variant_name || '—'}`.trim() || '—', fullWidth: true },
      { key: 'category', label: 'Category', value: b?.category_name || '—' },
      { key: 'total', label: 'Total price (INR)', value: b?.amount_paise ? `₹${(b.amount_paise / 100).toFixed(2)}` : '—' },
      { key: 'advance', label: 'Advance paid (INR)', value: b?.advance_amount_paise ? `₹${(b.advance_amount_paise / 100).toFixed(2)}` : '—' },
      { key: 'due', label: 'Remaining due (INR)', value: b?.remaining_amount_paise ? `₹${(b.remaining_amount_paise / 100).toFixed(2)}` : '—' },
      { key: 'status', label: 'Status', value: b?.status || 'pending' },
      { key: 'assignedInspectorName', label: 'Assigned Inspector', value: b?.assigned_inspector_name || '—' },
      { key: 'assignedInspectorMobile', label: 'Assigned Inspector Mobile', value: b?.assigned_inspector_mobile_number || '—' },
    ]
  }, [booking, bookingOpen, dialog?.customer])

  // Format date function for dd/mm/yyyy
  const formatDateDMY = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
  }

  // Detail dialog items based on type
  const detailItems = useMemo(() => {
    if (!detailData) return []
    
    if (detailType === 'customer') {
      return [
        { key: 'requestId', label: 'Request ID', value: detailData.request_id || '—' },
        { key: 'customerName', label: 'Customer Name', value: detailData.name || '—' },
        { key: 'mobileNumber', label: 'Mobile Number', value: detailData.mobile_number || '—' },
        { key: 'email', label: 'Email', value: detailData.email || '—', fullWidth: true },
        { key: 'createdBy', label: 'Created By', value: detailData.created_by_name || '—' },
        { key: 'createdAt', label: 'Created At', value: detailData.created_at ? formatDateTime(detailData.created_at) : '—', fullWidth: true },
      ]
    }
    
    if (detailType === 'vehicle') {
      return [
        { key: 'requestId', label: 'Request ID', value: detailData.request_id || '—' },
        { key: 'vehicleType', label: 'Vehicle Type', value: detailData.vehicle_type === 'new' ? 'New' : 'Pre-Owned' },
        { key: 'brandName', label: 'Brand', value: detailData.brand_name || '—' },
        { key: 'modelName', label: 'Model', value: detailData.model_name || '—' },
        { key: 'variantName', label: 'Variant', value: detailData.variant_name || '—' },
        { key: 'categoryName', label: 'Category', value: detailData.category_name || '—' },
      ]
    }
    
    if (detailType === 'booking') {
      return [
        { key: 'requestId', label: 'Request ID', value: detailData.request_id || '—' },
        { key: 'slotDate', label: 'Slot Date', value: detailData.slot_date ? formatDateDMY(detailData.slot_date) : '—' },
        { key: 'slotTime', label: 'Slot Time', value: `${formatTimeToAMPM(detailData.slot_start_time || '09:00:00')} - ${formatTimeToAMPM(detailData.slot_end_time || '18:00:00')}` },
        { key: 'address', label: 'Address', value: formatAddressDisplay(detailData.address) || '—', fullWidth: true },
        { key: 'amount', label: 'Total Amount', value: `₹${(detailData.amount_paise / 100).toFixed(2)}` },
        { key: 'advancePaid', label: 'Advance Paid', value: `₹${(detailData.advance_amount_paise / 100).toFixed(2)}` },
        { key: 'remainingAmount', label: 'Remaining Amount', value: `₹${(detailData.remaining_amount_paise / 100).toFixed(2)}` },
        // { key: 'paymentStage', label: 'Payment Stage', value: detailData.payment_stage || '—' },
        { 
  key: 'paymentStage', 
  label: 'Payment Stage', 
  value: detailData.payment_stage 
    ? detailData.payment_stage.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '—' 
},
        // { key: 'status', label: 'Status', value: detailData.status || '—' },
        { 
  key: 'status', 
  label: 'Status', 
  value: detailData.status 
    ? detailData.status.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '—' 
},
        { key: 'assignedInspectorId', label: 'Assigned Inspector ID', value: detailData.assigned_inspector_id || '—' },
        { key: 'assignedInspectorName', label: 'Assigned Inspector Name', value: detailData.assigned_inspector_name || '—' },
        { key: 'assignedInspectorMobile', label: 'Assigned Inspector Mobile', value: detailData.assigned_inspector_mobile_number || '—' },
        { key: 'createdAt', label: 'Created At', value: detailData.created_at ? formatDateTime(detailData.created_at) : '—', fullWidth: true },
      ]
    }
    
    return []
  }, [detailData, detailType])

  const _locationOptions = useMemo(() => {
    return (locations || []).map((l) => ({ value: l.id, label: l.name }))
  }, [locations])

  const _customerRows = Array.isArray(customers) ? customers : (customers?.results || [])

  // Process PDI requests data
  const pdiRequests = useMemo(() => {
    const items = pdiRequestsData?.items
    if (!Array.isArray(items)) return []
    
    console.log(' Raw PDI data sample:', items[0])
    
    const processedItems = items.map((pdi) => ({
      id: pdi.id,
      request_id: pdi.request_id,
      created_by_name: pdi.created_by_name,
      mobile_number: pdi.mobile_number,
      name: pdi.name,
      email: pdi.email,
      vehicle_type: pdi.vehicle_type,
      brand_name: pdi.brand_name,
      model_name: pdi.model_name,
      variant_name: pdi.variant_name,
      category_name: pdi.category_name,
      slot_date: pdi.slot_date,
      amount_paise: pdi.amount_paise,
      advance_amount_paise: pdi.advance_amount_paise,
      remaining_amount_paise: pdi.remaining_amount_paise,
      status: pdi.status,
      payment_stage: pdi.payment_stage,
      created_at: pdi.created_at,
      assigned_inspector_id: pdi.assigned_inspector_id || pdi.assigned_inspector, // Add assigned_inspector_id for filtering
      assigned_inspector_name: pdi.assigned_inspector_name, // Add assigned inspector name
      assigned_inspector_mobile_number: pdi.assigned_inspector_mobile_number, // Add assigned inspector mobile
    }))

    // Apply advanced filters
    return processedItems.filter((pdi) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const searchableText = `${pdi.request_id} ${pdi.name} ${pdi.mobile_number} ${pdi.brand_name} ${pdi.model_name} ${pdi.variant_name} ${pdi.status} ${pdi.payment_stage}`.toLowerCase()
        if (!searchableText.includes(searchLower)) {
          return false
        }
      }

      // Inspector filter
      if (selectedInspectorFilter) {
        console.log('🔍 Comparing:', {
          selectedFilter: selectedInspectorFilter,
          selectedFilterType: typeof selectedInspectorFilter,
          pdiInspectorId: pdi.assigned_inspector_id,
          pdiInspectorIdType: typeof pdi.assigned_inspector_id,
          pdiInspectorName: pdi.assigned_inspector_name,
          match: String(pdi.assigned_inspector_id) === String(selectedInspectorFilter)
        })
        if (String(pdi.assigned_inspector_id) !== String(selectedInspectorFilter)) {
          return false
        }
      }

      // Date range filter
      if (startDate || endDate) {
        const pdiDate = new Date(pdi.created_at)
        
        if (startDate) {
          // Parse dd/mm/yyyy format
          const [day, month, year] = startDate.split('/')
          const start = new Date(`${year}-${month}-${day}`)
          if (pdiDate < start) return false
        }
        
        if (endDate) {
          // Parse dd/mm/yyyy format
          const [day, month, year] = endDate.split('/')
          const end = new Date(`${year}-${month}-${day}`)
          end.setHours(23, 59, 59, 999) // Include entire end day
          if (pdiDate > end) return false
        }
      }

      return true
    })
  }, [pdiRequestsData, searchTerm, selectedInspectorFilter, startDate, endDate])

  // PDI requests table columns
  const pdiRequestsColumns = useMemo(
    () => [
      {
        key: 'request_id',
        header: 'Request ID',
        exportValue: (r) => r.request_id || '—',
        cell: (r) => <div className="text-sm font-medium text-slate-900">{r.request_id || '—'}</div>,
      },
      {
        key: 'name',
        header: 'Customer Name',
        exportValue: (r) => r.name || '—',
        cell: (r) => <div className="text-sm text-slate-700">{r.name || '—'}</div>,
      },
      {
        key: 'created_by_name',
        header: 'Created By',
        exportValue: (r) => r.created_by_name || '—',
        cell: (r) => <div className="text-sm text-slate-700">{r.created_by_name || '—'}</div>,
      },
      {
        key: 'mobile_number',
        header: 'Mobile',
        exportValue: (r) => r.mobile_number || '—',
        cell: (r) => <div className="text-sm text-slate-700">{r.mobile_number || '—'}</div>,
      },
      {
        key: 'vehicle_details',
        header: 'Vehicle Details',
        exportValue: (r) => `${r.brand_name || ''} ${r.model_name || ''} ${r.variant_name || ''}`.trim(),
        cell: (r) => (
          <div className="text-sm text-slate-700">
            <div className="font-medium">{r.brand_name || '—'}</div>
            <div className="text-xs text-slate-600">{r.model_name || '—'} {r.variant_name || '—'}</div>
          </div>
        ),
      },
      {
        key: 'slot_date',
        header: 'Slot Date',
        exportValue: (r) => formatDateDMY(r.slot_date),
        cell: (r) => <div className="text-sm text-slate-700">{formatDateDMY(r.slot_date)}</div>,
      },
      {
        key: 'amount_details',
        header: 'Amount',
        exportValue: (r) => `₹${(r.amount_paise / 100).toFixed(2)}`,
        cell: (r) => (
          <div className="text-sm text-slate-700">
            <div className="font-medium">₹{(r.amount_paise / 100).toFixed(2)}</div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        exportValue: (r) => r.status || '—',
        cell: (r) => (
          <Badge tone={r.status === 'confirmed' ? 'emerald' : r.status === 'payment_pending' ? 'amber' : 'rose'}>
            {r.status === 'confirmed' ? 'Confirmed' : r.status === 'payment_pending' ? 'Payment Pending' : r.status || '—'}
          </Badge>
        ),
      },
      // {
      //   key: 'payment_stage',
      //   header: 'Payment Stage',
      //   exportValue: (r) => r.payment_stage ? r.payment_stage.charAt(0).toUpperCase() + r.payment_stage.slice(1) : '—',
      //   cell: (r) => (
      //     <Badge tone={r.payment_stage === 'advance_paid' ? 'blue' : r.payment_stage === 'fully_paid' ? 'emerald' : 'slate'}>
      //       {r.payment_stage === 'advance_paid' ? 'Advance Paid' : r.payment_stage === 'fully_paid' ? 'Fully Paid' : r.payment_stage ? r.payment_stage.charAt(0).toUpperCase() + r.payment_stage.slice(1) : '—'}
      //     </Badge>
      //   ),
      // },
      {
        key: 'payment_stage',
        header: 'Payment Stage',
        exportValue: (r) => r.payment_stage ? r.payment_stage.replace(/_/g, ' ').charAt(0).toUpperCase() + r.payment_stage.replace(/_/g, ' ').slice(1) : '—',
        cell: (r) => (
          <Badge tone={r.payment_stage === 'advance_paid' ? 'blue' : r.payment_stage === 'fully_paid' ? 'emerald' : 'slate'}>
            {r.payment_stage ? r.payment_stage.replace(/_/g, ' ').charAt(0).toUpperCase() + r.payment_stage.replace(/_/g, ' ').slice(1) : '—'}
          </Badge>
        ),
      },
      {
        key: 'assigned_inspector_name',
        header: 'Assigned Inspector',
        exportValue: (r) => r.assigned_inspector_name || '—',
        cell: (r) => (
          <div className="text-sm text-slate-700">
            {r.assigned_inspector_name || '—'}
            {r.assigned_inspector_mobile_number && (
              <div className="text-xs text-slate-500">{r.assigned_inspector_mobile_number}</div>
            )}
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        exportValue: () => '—',
        cell: (r) => (
          <div className="flex items-center justify-center">
            <button
              type="button"
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setActionsMenu({ requestId: r.request_id })
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  )

  const _columns = useMemo(
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
            <Button
              variant="primary"
              onClick={() =>
                setDialog({
                  type: 'raise',
                  step: 1,
                  customer: null,
                  form: {
                    customerName: '',
                    customerEmail: '',
                    customerPhone: '',
                    vehicleType: '',
                    makeId: '',
                    modelId: '',
                    variantId: '',
                    category: '',
                    locationId: '',
                    houseNumber: '',
                    areaStreet: '',
                    city: '',
                    district: '',
                    state: '',
                    pincode: '',
                    country: 'India',
                    slotDate: '',
                    slotTime: '',
                    slotStart: '',
                    slotEnd: '',
                  },
                })
              }
            >
              Raise PDI
            </Button>
            {/* <Button onClick={async () => refreshCustomers()}>Refresh</Button> */}
          </div>
        }
      />

      {/* PDI Requests Table */}
      <Card
        title="PDI Requests"
        subtitle="All PDI requests with details and status"
        accent="cyan"
        // right={
        //   <Button onClick={() => refreshPDIRequests()}>
        //     Refresh
        //   </Button>
        // }
      >
        {pdiRequestsError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            Failed to load PDI requests.
          </div>
        ) : (
          <>
            {/* Search, Filters and Clear Button in one row */}
            <div className="flex flex-col sm:flex-row gap-3 items-end mb-4">
              {/* Search Bar */}
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Search</label>
                <Input
                  type="text"
                  id="pdi-table-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by Request ID, Name, Mobile, Vehicle..."
                  className="w-full"
                />
              </div>

              {/* Inspector Filter */}
              <div className="w-full sm:w-40">
                <label className="block text-xs font-medium text-slate-600 mb-1">Inspector</label>
                <Select
                  value={selectedInspectorFilter}
                  onChange={(e) => {
                    console.log('🔍 Selected inspector:', e.target.value)
                    setSelectedInspectorFilter(e.target.value)
                  }}
                  className="w-full"
                >
                  <option value="">All Inspectors</option>
                  {inspectorsList.map((inspector) => {
                    console.log('🔍 Inspector data:', inspector)
                    return (
                      <option key={inspector.user_id || inspector.name} value={inspector.user_id || inspector.name}>
                        {inspector.name}
                      </option>
                    )
                  })}
                </Select>
              </div>

              {/* Start Date Filter */}
              <div className="w-full sm:w-32">
                <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
                <CustomDatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="dd/mm/yyyy"
                  dateFormat="dd/mm/yyyy"
                  className="w-full"
                />
              </div>

              {/* End Date Filter */}
              <div className="w-full sm:w-32">
                <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
                <CustomDatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="dd/mm/yyyy"
                  dateFormat="dd/mm/yyyy"
                  className="w-full"
                />
              </div>

              {/* Clear Filters Button */}
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedInspectorFilter('')
                  setStartDate('')
                  setEndDate('')
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors whitespace-nowrap"
              >
                Clear Filters
              </button>
            </div>

            <PaginatedTable
            columns={pdiRequestsColumns}
            rows={pdiRequests}
            loading={loadingPDIRequests}
            emptyMessage="No PDI requests found"
            pageSize={10}
            rowKey={(row) => row.id}
            enableSearch={false}
          />
          </>
        )}
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

      {/* PDI Request Details Dialog */}
      <ViewDetailsDialog
        open={!!detailData && !!detailType}
        title={`${detailType === 'customer' ? 'Customer' : detailType === 'vehicle' ? 'Vehicle' : 'Booking'} Details`}
        subtitle={
          detailLoading
            ? 'Loading details…'
            : detailData
              ? `Request ID: ${detailData.request_id || '—'}`
              : 'No details found.'
        }
        onClose={() => {
          setDetailData(null)
          setDetailType(null)
        }}
        items={detailItems}
        accent={detailType === 'customer' ? 'blue' : detailType === 'vehicle' ? 'amber' : 'violet'}
      />

      {/* Debug Button State */}
      {(() => {
        console.log('🔍 Debug - Simplified button state:', {
          assignmentLoading,
          selectedInspector,
          assignRequestId,
          isDisabled: !selectedInspector || assignmentLoading,
          hasSelectedInspector: !!selectedInspector,
          selectedInspectorValue: selectedInspector,
          selectedInspectorType: typeof selectedInspector
        })
        return null
      })()}

      {/* Assign Inspector Dialog */}
      {(() => {
        console.log('🔍 Debug - Dialog render check:', { showAssignInspector, assignRequestId, inspectorsLength: inspectors.length })
        return showAssignInspector ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAssignInspector(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="relative border-b border-slate-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-slate-900">Assign Inspector</h3>
              <Button
                variant="icon"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => setShowAssignInspector(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Inspector ID <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedInspector}
                  onChange={(e) => {
                    const value = e.target.value
                    console.log('🔍 Debug - Inspector selected:', value, typeof value)
                    setSelectedInspector(value)
                  }}
                  className="w-full"
                  placeholder="Choose inspector"
                >
                  <option value="">Choose inspector</option>
                  {inspectors.map((inspector) => (
                    <option key={inspector.user_id} value={inspector.user_id}>
                      {inspector.name} ({inspector.user_id})
                    </option>
                  ))}
                </Select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason
                </label>
                <Input
                  value={assignmentReason}
                  onChange={(e) => {
                    const value = e.target.value
                    console.log('🔍 Debug - Reason input change:', value, typeof value)
                    setAssignmentReason(value)
                  }}
                  className="w-full"
                  placeholder="Enter reason for assignment..."
                />
              </div>
              
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowAssignInspector(false)}
                  disabled={assignmentLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    console.log('🔍 Debug - Submit button clicked!')
                    handleAssignInspector()
                  }}
                >
                  {assignmentLoading ? 'Assigning...' : 'Assign Inspector'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null})()}

      {reportOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDialog(null)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
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
              <div className="text-sm font-semibold">PDI raised successfully</div>
              <div className="mt-1 text-xs text-slate-500">PDI {dialog?.pdiId || '—'} · {dialog?.customer?.fullName || 'Customer'}</div>
            </div>

            <div className="p-4">
              <Card accent="violet" className="p-0">
                <div className="p-3">
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-xs font-medium text-slate-600">Customer</div>
                      <div className="mt-1 font-semibold text-slate-900">{dialog?.customer?.fullName || '—'}</div>
                      <div className="mt-1 text-xs text-slate-600">{dialog?.customer?.mobile || '—'}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-xs font-medium text-slate-600">Booking / PDI ID</div>
                      <div className="mt-1 font-semibold text-slate-900">{dialog?.pdiId || '—'}</div>
                      <div className="mt-1 text-xs text-slate-600">Advance paid: ₹500</div>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const c = dialog?.customer
                    if (!c) return
                    setDialog({ type: 'viewCustomer', customer: c })
                  }}
                >
                  View customer details
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const c = dialog?.customer
                    if (!c) return
                    setDialog({ type: 'bookingSummary', customer: c, pdiId: dialog?.pdiId })
                  }}
                >
                  View booking summary
                </Button>
                <Button variant="primary" onClick={() => setDialog(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {actionsMenu ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setActionsMenu(null)} />
          <div
            ref={actionsMenuRef}
            className="absolute left-1/2 top-1/2 w-[92vw] max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <span className="text-sm font-semibold text-slate-700">Actions</span>
              <button
                type="button"
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                onClick={() => setActionsMenu(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* PDI Request Actions */}
            {actionsMenu.requestId && (
              <>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50"
                  onClick={() => {
                    fetchAndShowDetails(actionsMenu.requestId, 'customer')
                  }}
                >
                  View Customer Details
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50"
                  onClick={() => {
                    fetchAndShowDetails(actionsMenu.requestId, 'vehicle')
                  }}
                >
                  View Vehicle Details
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50"
                  onClick={() => {
                    fetchAndShowDetails(actionsMenu.requestId, 'booking')
                  }}
                >
                  View Booking Details
                </button>
                {/* Assign Inspector - disabled when payment stage is fully_paid or remaining_due */}
                {(() => {
                  const pdiRequest = pdiRequests.find(p => p.request_id === actionsMenu.requestId)
                  const isFullyPaid = pdiRequest?.payment_stage === 'fully_paid'
                  const isRemainingDue = pdiRequest?.payment_stage === 'remaining_due'
                  const isDisabled = isFullyPaid || isRemainingDue
                  return (
                    <button
                      type="button"
                      className={`w-full px-4 py-3 text-left text-sm ${
                        isDisabled
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'hover:bg-slate-50'
                      }`}
                      onClick={() => {
                        if (!isDisabled) {
                          console.log('🔍 Debug - Assign Inspector button clicked!', { actionsMenu, requestId: actionsMenu?.requestId })
                          openAssignInspector(actionsMenu.requestId)
                        }
                      }}
                      disabled={isDisabled}
                    >
                      Assign Inspector
                    </button>
                  )
                })()}
                {/* Remaining Pay option - enabled only when payment stage is remaining_due */}
                {(() => {
                  const pdiRequest = pdiRequests.find(p => p.request_id === actionsMenu.requestId)
                  const isRemainingDue = pdiRequest?.payment_stage === 'remaining_due'
                  return (
                    <button
                      type="button"
                      className={`w-full px-4 py-3 text-left text-sm ${
                        isRemainingDue
                          ? 'hover:bg-green-50 text-green-700 cursor-pointer'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      onClick={() => {
                        if (isRemainingDue) {
                          openRemainingPayment(actionsMenu.requestId)
                        }
                      }}
                      disabled={!isRemainingDue}
                    >
                      Remaining Pay
                    </button>
                  )
                })()}
                {/* Generate PDI Report button - enabled only when payment stage is fully_paid */}
                {(() => {
                  const pdiRequest = pdiRequests.find(p => p.request_id === actionsMenu.requestId)
                  const isFullyPaid = pdiRequest?.payment_stage === 'fully_paid'
                  const isLoading = loadingReportRequestId === actionsMenu.requestId
                  return (
                    <button
                      type="button"
                      className={`w-full px-4 py-3 text-left text-sm flex items-center gap-2 ${
                        isFullyPaid
                          ? 'hover:bg-blue-50 text-blue-700 cursor-pointer'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      onClick={() => {
                        if (isFullyPaid) {
                          fetchAndShowPDIReport(actionsMenu.requestId)
                        }
                      }}
                      disabled={!isFullyPaid || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Preparing...
                        </>
                      ) : (
                        'Generate PDI Report'
                      )}
                    </button>
                  )
                })()}
                {(() => {
                  const pdiRequest = pdiRequests.find(p => p.request_id === actionsMenu.requestId)
                  const isFullyPaid = pdiRequest?.payment_stage === 'fully_paid'
                  return (
                    <button
                      type="button"
                      disabled={isFullyPaid}
                      className={`w-full px-4 py-3 text-left text-sm ${isFullyPaid ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'hover:bg-amber-50 text-amber-700'}`}
                      onClick={async () => {
                        if (isFullyPaid) return
                        const reqId = actionsMenu.requestId
                        setRefundRequestId(reqId)
                        setRefundReason('')
                        setRefundModalData(null)
                        setRefundModalFetchLoading(true)
                        setShowRefundModal(true)
                        setActionsMenu(null)
                        try {
                          const data = await getPaymentStatus(reqId)
                          setRefundModalData(data)
                        } catch (e) {
                          console.error('Failed to fetch payment status for refund:', e)
                        } finally {
                          setRefundModalFetchLoading(false)
                        }
                      }}
                    >
                      Refund
                    </button>
                  )
                })()}
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50"
                  onClick={() => {
                    setUpdateBookingStatusRequestId(actionsMenu.requestId)
                    setUpdateBookingStatusValue('')
                    setUpdateBookingStatusReason('')
                    setShowUpdateBookingStatusModal(true)
                    setActionsMenu(null)
                  }}
                >
                  Update Booking Status
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50"
                  onClick={async () => {
                    const reqId = actionsMenu.requestId
                    setUpdatePaymentStatusRequestId(reqId)
                    setUpdatePaymentStatusValue('')
                    setUpdatePaymentStatusReason('')
                    setUpdatePaymentModalData(null)
                    setUpdatePaymentModalFetchLoading(true)
                    setShowUpdatePaymentStatusModal(true)
                    setActionsMenu(null)
                    try {
                      const data = await getPaymentStatus(reqId)
                      setUpdatePaymentModalData(data)
                    } catch (e) {
                      console.error('Failed to fetch payment status:', e)
                    } finally {
                      setUpdatePaymentModalFetchLoading(false)
                    }
                  }}
                >
                  Update Payment Status
                </button>
                      {(() => {
                        const pdiRequest = pdiRequests.find(p => p.request_id === actionsMenu.requestId)
                        const isFullyPaid = pdiRequest?.payment_stage === 'fully_paid'
                        return (
                          <button
                            type="button"
                            disabled={isFullyPaid}
                            className={`w-full px-4 py-3 text-left text-sm rounded-b-xl ${isFullyPaid ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'hover:bg-rose-50 text-rose-700'}`}
                            onClick={async () => {
                              if (isFullyPaid) return
                              const ok = window.confirm('Are you sure you want to delete this request? This action cannot be undone.')
                              if (!ok) return
                              try {
                                await deletePdiRequest(actionsMenu.requestId)
                                if (typeof refreshPDIRequests === 'function') refreshPDIRequests()
                                setActionsMenu(null)
                                window.alert('Request deleted')
                              } catch (e) {
                                window.alert(e?.message || e || 'Delete failed')
                              }
                            }}
                          >
                            Delete Request
                          </button>
                        )
                      })()}
              </>
            )}
            
            {/* Existing Customer Actions */}
            {actionsMenu.customer && (
              <>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50"
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
                  className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50"
                  onClick={() => {
                    const c = actionsMenu.customer
                    setActionsMenu(null)
                    setDialog({ type: 'bookingSummary', customer: c })
                  }}
                >
                  View booking summary
                </button>

                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm hover:bg-rose-50 text-rose-700 rounded-b-xl"
                  onClick={async () => {
                    const c = actionsMenu.customer
                    setActionsMenu(null)
                    if (!c?.id) return
                    const ok = confirm(`Delete customer ${c.fullName || c.id}? This will also remove their bookings.`)
                    if (!ok) return
                try {
                  await deleteCustomer(c.id)
                  await refreshCustomers()
                } catch (e) {
                  alert(e.message || 'Delete failed')
                }
              }}
            >
              Delete
            </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowRefundModal(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="relative border-b border-slate-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-slate-900">Refund Payment</h3>
              <Button variant="icon" size="icon" className="absolute right-2 top-2" onClick={() => setShowRefundModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              {refundModalFetchLoading ? (
                <div className="text-sm text-slate-500 text-center py-4">Loading payment details...</div>
              ) : refundModalData ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  {refundModalData.transactions?.length > 0 ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Transaction ID</span>
                        <span className="font-medium text-slate-800">{refundModalData.transactions[0].transaction_id || refundModalData.transactions[0].id || '—'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Amount</span>
                        <span className="font-medium text-slate-800">₹{((refundModalData.transactions[0].amount_paise || refundModalData.amount_paid_paise || 0) / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Payment Stage</span>
                        <span className="font-medium text-slate-800">{refundModalData.payment_stage?.replace(/_/g, ' ') || '—'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-rose-600">No transactions found for this request.</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-rose-600 text-center py-2">Failed to load payment details.</div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <Input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Enter reason for refund" className="w-full" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="secondary" onClick={() => setShowRefundModal(false)} disabled={refundLoading}>Cancel</Button>
                <Button variant="primary" onClick={handleRefund} disabled={refundLoading || refundModalFetchLoading || !refundModalData?.transactions?.length}>
                  {refundLoading ? 'Processing...' : 'Initiate Refund'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Booking Status Modal */}
      {showUpdateBookingStatusModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowUpdateBookingStatusModal(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="relative border-b border-slate-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-slate-900">Update Booking Status</h3>
              <Button variant="icon" size="icon" className="absolute right-2 top-2" onClick={() => setShowUpdateBookingStatusModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status <span className="text-red-500">*</span></label>
                <Select value={updateBookingStatusValue} onChange={(e) => setUpdateBookingStatusValue(e.target.value)} className="w-full">
                  <option value="">Select status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <Input value={updateBookingStatusReason} onChange={(e) => setUpdateBookingStatusReason(e.target.value)} placeholder="Enter reason (optional)" className="w-full" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="secondary" onClick={() => setShowUpdateBookingStatusModal(false)} disabled={updateBookingStatusLoading}>Cancel</Button>
                <Button variant="primary" onClick={handleUpdateBookingStatus} disabled={updateBookingStatusLoading}>
                  {updateBookingStatusLoading ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Payment Status Modal */}
      {showUpdatePaymentStatusModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowUpdatePaymentStatusModal(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="relative border-b border-slate-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-slate-900">Update Payment Status</h3>
              <Button variant="icon" size="icon" className="absolute right-2 top-2" onClick={() => setShowUpdatePaymentStatusModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              {updatePaymentModalFetchLoading ? (
                <div className="text-sm text-slate-500 text-center py-4">Loading payment details...</div>
              ) : updatePaymentModalData ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  {updatePaymentModalData.transactions?.length > 0 ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Transaction ID</span>
                        <span className="font-medium text-slate-800">{updatePaymentModalData.transactions[0].transaction_id || updatePaymentModalData.transactions[0].id || '—'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Current Payment Stage</span>
                        <span className="font-medium text-slate-800">{updatePaymentModalData.payment_stage?.replace(/_/g, ' ') || '—'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-rose-600">No transactions found for this request.</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-rose-600 text-center py-2">Failed to load payment details.</div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Status <span className="text-red-500">*</span></label>
                <Select value={updatePaymentStatusValue} onChange={(e) => setUpdatePaymentStatusValue(e.target.value)} className="w-full">
                  <option value="">Select status</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <Input value={updatePaymentStatusReason} onChange={(e) => setUpdatePaymentStatusReason(e.target.value)} placeholder="Enter reason (optional)" className="w-full" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="secondary" onClick={() => setShowUpdatePaymentStatusModal(false)} disabled={updatePaymentStatusLoading}>Cancel</Button>
                <Button variant="primary" onClick={handleUpdatePaymentStatus} disabled={updatePaymentStatusLoading || updatePaymentModalFetchLoading || !updatePaymentModalData?.transactions?.length}>
                  {updatePaymentStatusLoading ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                Step {wizardStep} of 4 · {String(wizardForm.customerName || '').trim() || 'Customer'}
              </div>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-4">
              {wizardStep === 1 ? (
                <div className="space-y-3">
                  <Card accent="slate" className="p-0">
                    <div className="p-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-xs font-medium text-slate-900">Customer Name *</div>
                          <div className="mt-1">
                            <Input
                              value={wizardForm.customerName || ''}
                              onChange={(e) =>
                                setDialog((s) =>
                                  s && s.type === 'raise'
                                    ? { ...s, form: { ...s.form, customerName: e.target.value } }
                                    : s
                                )
                              }
                              placeholder="Customer name"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">Email</div>
                          <div className="mt-1">
                            <Input
                              value={wizardForm.customerEmail || ''}
                              onChange={(e) =>
                                setDialog((s) =>
                                  s && s.type === 'raise'
                                    ? { ...s, form: { ...s.form, customerEmail: e.target.value } }
                                    : s
                                )
                              }
                              placeholder="Email"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">Phone *</div>
                          <div className="mt-1">
                            <Input
                              value={wizardForm.customerPhone || ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                                setDialog((s) =>
                                  s && s.type === 'raise'
                                    ? { ...s, form: { ...s.form, customerPhone: value } }
                                    : s
                                )
                              }}
                              placeholder="Phone"
                              maxLength={10}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">Vehicle type *</div>
                          <div className="mt-1">
                            <Select
                              value={wizardForm.vehicleType}
                              onChange={(e) =>
                                setDialog((s) =>
                                  s && s.type === 'raise'
                                    ? { ...s, form: { ...s.form, vehicleType: e.target.value, variantId: '', category: '' } }
                                    : s
                                )
                              }
                            >
                              <option value="">Select vehicle type</option>
                              {VEHICLE_TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">Brand *</div>
                          <div className="mt-1">
                            <Select
                              value={wizardForm.makeId}
                              onChange={(e) => {
                                const nextMakeId = e.target.value
                                setDialog((s) => {
                                  if (!s || s.type !== 'raise') return s
                                  if (!nextMakeId) return { ...s, form: { ...s.form, makeId: '', modelId: '', variantId: '', category: '' } }
                                  return {
                                    ...s,
                                    form: { ...s.form, makeId: nextMakeId, modelId: '', variantId: '', category: '' },
                                  }
                                })
                              }}
                            >
                              <option value="">Select</option>
                              {brands.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">Model *</div>
                          <div className="mt-1">
                            <Select
                              value={wizardForm.modelId}
                              onChange={(e) => {
                                const nextModelId = e.target.value
                                setDialog((s) => {
                                  if (!s || s.type !== 'raise') return s
                                  if (!nextModelId) return { ...s, form: { ...s.form, modelId: '', variantId: '', category: '' } }
                                  return {
                                    ...s,
                                    form: { ...s.form, modelId: nextModelId, variantId: '', category: '' },
                                  }
                                })
                              }}
                            >
                              <option value="">Select</option>
                              {(() => {
                                const list = models
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
                          <div className="text-xs font-medium text-slate-900">Variant *</div>
                          <div className="relative mt-1">
                            <Select
                              value={wizardForm.variantId}
                              onChange={(e) => {
                                const nextVariantId = e.target.value
                                setDialog((s) => {
                                  if (!s || s.type !== 'raise') return s
                                  return { ...s, form: { ...s.form, variantId: nextVariantId, category: '' } }
                                })
                              }}
                              disabled={!wizardForm.vehicleType || !wizardForm.modelId}
                            >
                              {loadingVehicleCategoryMappings ? (
                                <option value="">Loading...</option>
                              ) : (
                                <>
                                  <option value="">Select</option>
                                  {mappedVariantOptions.map((v) => (
                                    <option key={v.value} value={v.value}>
                                      {v.label}
                                    </option>
                                  ))}
                                </>
                              )}
                            </Select>
                            {loadingVehicleCategoryMappings && (
                              <div className="pointer-events-none absolute inset-y-0 right-8 flex items-center">
                                <svg className="h-4 w-4 animate-spin text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">Category *</div>
                          <div className="relative mt-1">
                            <Select
                              value={wizardForm.category}
                              onChange={(e) =>
                                setDialog((s) =>
                                  s && s.type === 'raise' ? { ...s, form: { ...s.form, category: e.target.value } } : s
                                )
                              }
                              disabled={!wizardForm.vehicleType || !wizardForm.variantId}
                            >
                              {loadingVehicleCategoryMappings ? (
                                <option value="">Loading...</option>
                              ) : (
                                <>
                                  <option value="">Select category</option>
                                  {mappedCategoryOptions.map((o) => (
                                    <option key={o.value} value={o.value}>
                                      {o.label}
                                    </option>
                                  ))}
                                </>
                              )}
                            </Select>
                            {loadingVehicleCategoryMappings && (
                              <div className="pointer-events-none absolute inset-y-0 right-8 flex items-center">
                                <svg className="h-4 w-4 animate-spin text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">House Number <span className="text-red-500">*</span></div>
                          <div className="mt-1">
                            <Input
                              value={wizardForm.houseNumber || ''}
                              onChange={(e) =>
                                setDialog((s) =>
                                  s && s.type === 'raise' ? { ...s, form: { ...s.form, houseNumber: e.target.value } } : s
                                )
                              }
                              placeholder="Enter house number"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">Area/Street <span className="text-red-500">*</span></div>
                          <div className="mt-1">
                            <Input
                              value={wizardForm.areaStreet || ''}
                              onChange={(e) =>
                                setDialog((s) =>
                                  s && s.type === 'raise' ? { ...s, form: { ...s.form, areaStreet: e.target.value } } : s
                                )
                              }
                              placeholder="Enter area/street"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">District <span className="text-red-500">*</span></div>
                          <div className="mt-1">
                            <Select
                              value={wizardForm.district || ''}
                              onChange={(e) => {
                                setDialog((s) =>
                                  s && s.type === 'raise' ? { ...s, form: { ...s.form, district: e.target.value, city: '' } } : s
                                )
                              }}
                              required
                            >
                              <option value="">Select district</option>
                              {districts.map((district) => (
                                <option key={district.id} value={district.id}>
                                  {district.name}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">City <span className="text-red-500">*</span></div>
                          <div className="mt-1">
                            <Select
                              value={wizardForm.city || ''}
                              onChange={(e) =>
                                setDialog((s) =>
                                  s && s.type === 'raise' ? { ...s, form: { ...s.form, city: e.target.value } } : s
                                )
                              }
                              required
                              disabled={!wizardForm.district}
                            >
                              <option value="">Select city</option>
                              {cities
                                .filter(city => city.district === Number(wizardForm.district))
                                .map((city) => (
                                  <option key={city.id} value={city.name}>
                                    {city.name}
                                  </option>
                                ))}
                            </Select>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">State <span className="text-red-500">*</span></div>
                          <div className="mt-1">
                            <Select
                              value={wizardForm.state || ''}
                              onChange={(e) =>
                                setDialog((s) =>
                                  s && s.type === 'raise' ? { ...s, form: { ...s.form, state: e.target.value } } : s
                                )
                              }
                              required
                            >
                              <option value="">Select state</option>
                              {INDIAN_STATE_OPTIONS.map((state) => (
                                <option key={state} value={state}>
                                  {state}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">Pin Code <span className="text-red-500">*</span></div>
                          <div className="mt-1">
                            <Input
                              value={wizardForm.pincode || ''}
                              onChange={(e) =>
                                setDialog((s) =>
                                  s && s.type === 'raise' ? { ...s, form: { ...s.form, pincode: e.target.value } } : s
                                )
                              }
                              placeholder="Enter pin code"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-900">Country <span className="text-red-500">*</span></div>
                          <div className="mt-1">
                            <Input
                              value={wizardForm.country || 'India'}
                              onChange={(e) =>
                                setDialog((s) =>
                                  s && s.type === 'raise' ? { ...s, form: { ...s.form, country: e.target.value } } : s
                                )
                              }
                              placeholder="Enter country"
                              required
                            />
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
                      </div>

                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date().toISOString().split('T')[0]
                            setDialog((s) =>
                              s && s.type === 'raise' ? { ...s, form: { ...s.form, slotDate: today } } : s
                            )
                            fetchTimeSlots(today)
                          }}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          Today - {formatDateDisplay(new Date().toISOString().split('T')[0])}
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Calendar Section */}
                        <div>
                          <div className="text-xs font-medium text-slate-900">Select from calendar</div>
                          <div className="mt-2">
                            {console.log('📅 CustomDatePicker value:', wizardForm.slotDate)}
                            <CustomDatePicker
                              value={wizardForm.slotDate}
                              onChange={(iso) => {
                                console.log('📅 Date changed to:', iso)
                                setDialog((s) =>
                                  s && s.type === 'raise' ? { ...s, form: { ...s.form, slotDate: iso } } : s
                                )
                                // Fetch time slots for the selected date
                                fetchTimeSlots(iso)
                              }}
                            />
                          </div>
                        </div>

                        {/* Selected Date Display */}
                        <div>
                          <div className="text-xs font-medium text-slate-900">Selected date</div>
                          <div className="mt-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                              {wizardForm.slotDate
                                ? formatDateDisplay(wizardForm.slotDate)
                                : '—'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium text-slate-900">Select time slot</div>
                          {loadingTimeSlots && (
                            <div className="text-xs text-blue-600">Loading time slots...</div>
                          )}
                        </div>
                        
                        {wizardForm.slotDate && (
                          <div className="mt-3">
                            {console.log('🔍 Display check - slotDate:', wizardForm.slotDate, 'timeSlots.length:', timeSlots.length, 'loading:', loadingTimeSlots)}
                            {timeSlots.length > 0 ? (
                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                {timeSlots.map((slot) => {
                                  const active = selectedTimeSlot === slot.timestamp
                                  const isAvailable = slot.is_available
                                  const freeInspectors = slot.free_inspectors || 0
                                  const isPast = isSlotInPast(slot, wizardForm.slotDate)
                                  const isSlotActive = isAvailable && !isPast
                                  
                                  return (
                                    <button
                                      key={slot.timestamp}
                                      type="button"
                                      disabled={!isSlotActive}
                                      className={cx(
                                        'relative rounded-xl border-2 p-3 text-center transition-all duration-200 shadow-sm hover:shadow-md',
                                        active
                                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-blue-200 shadow-lg transform scale-105'
                                          : isSlotActive
                                          ? 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-blue-100 cursor-pointer transform hover:scale-102'
                                          : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                                      )}
                                      onClick={() => {
                                        if (isSlotActive) {
                                          setSelectedTimeSlot(slot.timestamp)
                                          setDialog((s) => 
                                            s && s.type === 'raise' ? { ...s, form: { ...s.form, slotTime: slot.timestamp, slotStart: slot.start_24h, slotEnd: slot.end_24h } } : s
                                          )
                                        }
                                      }}
                                    >
                                      {/* Status indicator dot */}
                                      <div className="absolute top-2 right-2">
                                        <div className={cx(
                                          'w-2 h-2 rounded-full',
                                          active ? 'bg-blue-500' : isPast ? 'bg-gray-400' : isAvailable ? 'bg-green-500' : 'bg-red-400'
                                        )} />
                                      </div>
                                      
                                      {/* Time display */}
                                      <div className="mb-2">
                                        <div className="text-sm font-bold text-slate-900">
                                          {slot.start}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                          {slot.end}
                                        </div>
                                      </div>
                                      
                                      {/* Inspector availability */}
                                      <div className="border-t border-slate-100 pt-2">
                                        {isPast ? (
                                          <div className="flex items-center justify-center space-x-1">
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                            <span className="text-xs font-medium text-gray-500">
                                              Unavailable
                                            </span>
                                          </div>
                                        ) : isAvailable ? (
                                          <div className="flex items-center justify-center space-x-1">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                            <span className="text-xs font-semibold text-green-600">
                                              {freeInspectors} {freeInspectors === 1 ? 'inspector' : 'inspectors'}
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-center space-x-1">
                                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                                            <span className="text-xs font-medium text-red-500">
                                              Unavailable
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Selected indicator */}
                                      {active && (
                                        <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-sm text-slate-500">
                                {loadingTimeSlots ? 'Loading time slots...' : 'No time slots available for this date'}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {!wizardForm.slotDate && (
                          <div className="text-center py-4 text-sm text-slate-500">
                            Please select a date first to see available time slots
                          </div>
                        )}
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
                          {wizardForm.vehicleType === 'pre_owned' ? 'Pre-Owned' : 'New'} · {selectedVehicleCategoryMapping?.category_name || '—'}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-medium text-slate-600">Inspection Slot</div>
                        <div className="mt-1 font-semibold text-slate-900">
                          {wizardForm.slotDate
                            ? formatDateDisplay(wizardForm.slotDate)
                            : '—'}
                          {wizardForm.slotStart && wizardForm.slotEnd && (
                            <div className="text-sm text-slate-600">
                              {wizardForm.slotStart} - {wizardForm.slotEnd}
                            </div>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">{formatAddress(wizardForm) || '—'}</div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-slate-600">Category pricing</div>
                        <div className="font-semibold text-slate-900">₹{Math.max(0, priceInr - Math.max(0, locationExtraInr))}</div>
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

              {wizardStep === 3 ? (
                <div className="space-y-3">
                  <Card title="Checkout" subtitle="Complete your booking" accent="violet">
                    <div className="space-y-4">
                      {/* Customer Details */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-medium text-slate-600">Customer Details</div>
                        <div className="mt-2 font-semibold text-slate-900">
                          {String(wizardForm.customerName || '').trim() || dialog?.customer?.fullName || '—'}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {String(wizardForm.customerPhone || '').trim() || dialog?.customer?.mobile || '—'}
                        </div>
                        {String(wizardForm.customerEmail || '').trim() || dialog?.customer?.email ? (
                          <div className="mt-1 text-xs text-slate-600">
                            {String(wizardForm.customerEmail || '').trim() || dialog?.customer?.email}
                          </div>
                        ) : null}
                      </div>

                      {/* Vehicle Details */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-medium text-slate-600">Vehicle Details</div>
                        <div className="mt-2 font-semibold text-slate-900">
                          {(wizardForm.makeId ? makeById.get(wizardForm.makeId)?.name : '') || '—'}{' '}
                          {(wizardForm.modelId ? modelById.get(wizardForm.modelId)?.name : '') || ''}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {wizardForm.vehicleType === 'pre_owned' ? 'Pre-Owned' : 'New'} · {selectedVehicleCategoryMapping?.category_name || '—'}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {(wizardForm.variantId ? variantById.get(wizardForm.variantId)?.name : '') || ''}
                        </div>
                      </div>

                      {/* Slot Details */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-medium text-slate-600">Inspection Slot</div>
                        <div className="mt-2 font-semibold text-slate-900">
                          {wizardForm.slotDate
                            ? formatDateDisplay(wizardForm.slotDate)
                            : '—'}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {formatAddress(wizardForm) || '—'}
                        </div>
                      </div>

                      {/* Payment Summary */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-medium text-slate-600">Payment Summary</div>
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Category pricing</span>
                            <span className="font-medium text-slate-900">₹{Math.max(0, priceInr - Math.max(0, locationExtraInr))}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Location extra charge</span>
                            <span className="font-medium text-slate-900">₹{Math.max(0, locationExtraInr)}</span>
                          </div>
                          <div className="mt-2 h-px w-full bg-slate-200" />
                          <div className="flex justify-between">
                            <span className="font-semibold text-slate-900">Total amount</span>
                            <span className="font-extrabold text-lg text-slate-900">₹{priceInr}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Method Selection */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-medium text-slate-600">Payment Method</div>
                        <div className="mt-3 space-y-2">
                          <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="online"
                              checked={paymentMethod === 'online'}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-slate-900">Online Payment Link</div>
                              <div className="text-xs text-slate-600">Generate & share payment link with customer</div>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cash"
                              checked={paymentMethod === 'cash'}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-slate-900">Cash Payment</div>
                              <div className="text-xs text-slate-600">Collect cash from customer at counter</div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-500">
                  {wizardStep === 2 ? 'Select a date to continue.' : null}
                  {wizardStep === 1 && wizardForm?.category && priceInr === 0 ? (
                    <span className="text-rose-600 font-medium">
                      ⚠️ Pricing not available for selected category and vehicle type
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (!raiseOpen) return
                      if (wizardStep <= 1) setDialog(null)
                      else if (wizardStep === 3) setDialog((s) => (s && s.type === 'raise' ? { ...s, step: 2 } : s)) // From page 3 go to page 2
                      else setDialog((s) => (s && s.type === 'raise' ? { ...s, step: Math.max(1, wizardStep - 1) } : s))
                    }}
                  >
                    Back
                  </Button>

                  {wizardStep < 3 ? (
                    <Button
                      onClick={async () => {
                        if (!raiseOpen) return
                        if (wizardStep === 1) {
                          if (!String(wizardForm.customerName || '').trim()) return
                          if (!String(wizardForm.customerPhone || '').trim()) return
                          if (!String(wizardForm.makeId || '').trim()) return
                          if (!String(wizardForm.modelId || '').trim()) return
                          if (!String(wizardForm.variantId || '').trim()) return
                          if (!String(selectedCategoryId || '').trim()) return
                          
                          // Check if pricing data is available
                          const pricingArray = Array.isArray(categoryPricing) ? categoryPricing : []
                          const currentVehicleType = wizardForm?.vehicleType === 'pre_owned' ? 'owned' : 'new'
                          const categoryPrice = pricingArray.find(p => 
                            p.category === Number(selectedCategoryId) && 
                            p.vehicle_type === currentVehicleType
                          )
                          
                          if (!categoryPrice) {
                            alert('Pricing data not available for selected category and vehicle type. Please select different options or contact support.')
                            return
                          }
                          
                          const dateToFetch = wizardForm.slotDate || new Date().toISOString().split('T')[0]
                          await fetchTimeSlots(dateToFetch)

                          setDialog((s) => (s && s.type === 'raise' ? { ...s, step: 2 } : s))
                          return
                        }
                        if (wizardStep === 2) {
                          if (!wizardForm.slotDate) {
                            alert('Please select a date for the inspection.')
                            return
                          }
                          if (!wizardForm.slotTime) {
                            alert('Please select a time slot for the inspection.')
                            return
                          }
                          setDialog((s) => (s && s.type === 'raise' ? { ...s, step: 3 } : s)) // Go to page 3
                          return
                        }
                        // Removed page 3 logic - go directly from page 2 to page 4
                      }}
                      disabled={
                        (wizardStep === 1 &&
                          (!String(wizardForm.customerName || '').trim() ||
                            !String(wizardForm.customerPhone || '').trim() ||
                            !String(wizardForm.makeId || '').trim() ||
                            !String(wizardForm.modelId || '').trim() ||
                            !String(wizardForm.variantId || '').trim() ||
                            !String(selectedCategoryId || '').trim() ||
                            !String(wizardForm.houseNumber || '').trim() ||
                            !String(wizardForm.areaStreet || '').trim() ||
                            !String(wizardForm.city || '').trim() ||
                            !String(wizardForm.district || '').trim() ||
                            !String(wizardForm.state || '').trim() ||
                            !String(wizardForm.pincode || '').trim() ||
                            !String(wizardForm.country || '').trim())) ||
                        (wizardStep === 2 && !wizardForm.slotDate)
                      }
                    >
                      {wizardStep === 1 ? (loadingAvailability ? 'Loading...' : 'Select Date') : wizardStep === 2 ? 'Proceed to Checkout' : 'Next'}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={async () => {
                        if (!raiseOpen) return
                        if (paymentMethod === 'online') {
                          await handleRazorpayPayment()
                        } else {
                          await handleManualPayment()
                        }
                      }}
                    >
                      {paymentLoading ? 'Processing...' : paymentMethod === 'online' ? 'Generate Payment Link' : 'Book & Collect Cash'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Manual Payment Modal */}
      {showManualPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Manual Payment Details</h3>
              <button
                onClick={() => setShowManualPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment mode
                </label>
                <Input
                  value={manualPaymentMode}
                  onChange={(e) => setManualPaymentMode(e.target.value)}
                  placeholder="e.g., Cash, Bank Transfer, UPI"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference number
                </label>
                <Input
                  value={manualReferenceNo}
                  onChange={(e) => setManualReferenceNo(e.target.value)}
                  placeholder="Enter reference number"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowManualPaymentModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleManualPaymentSubmit}
                  disabled={paymentLoading || !manualReferenceNo.trim()}
                >
                  {paymentLoading ? 'Processing...' : 'Confirm Payment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remaining Payment Modal */}
      {showRemainingPaymentModal && remainingPaymentData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Remaining Payment Checkout</h3>
              <button
                onClick={() => setShowRemainingPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Payment Summary */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-medium text-slate-600 mb-3">Payment Summary</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Request ID</span>
                    <span className="font-medium text-slate-900">{remainingPaymentData.request_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Customer</span>
                    <span className="font-medium text-slate-900">{remainingPaymentData.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Amount</span>
                    <span className="font-medium text-slate-900">₹{(remainingPaymentData.amount_paise / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Advance Paid</span>
                    <span className="font-medium text-green-600">₹{(remainingPaymentData.advance_amount_paise / 100).toFixed(2)}</span>
                  </div>
                  <div className="mt-2 h-px w-full bg-slate-200" />
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-900">Remaining Amount Due</span>
                    <span className="font-extrabold text-lg text-orange-600">₹{(remainingPaymentData.remaining_amount_paise / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-medium text-slate-600 mb-3">Payment Method</div>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50">
                    <input
                      type="radio"
                      name="remainingPaymentMethod"
                      value="online"
                      checked={remainingPaymentMethod === 'online'}
                      onChange={(e) => setRemainingPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">Online Payment Link</div>
                      <div className="text-xs text-slate-600">Generate & share payment link with customer</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50">
                    <input
                      type="radio"
                      name="remainingPaymentMethod"
                      value="cash"
                      checked={remainingPaymentMethod === 'cash'}
                      onChange={(e) => setRemainingPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">Cash Payment</div>
                      <div className="text-xs text-slate-600">Collect cash from customer at counter</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Cash Payment Details (only shown when cash is selected) */}
              {remainingPaymentMethod === 'cash' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-medium text-slate-600 mb-3">Cash Payment Details</div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment mode
                      </label>
                      <Input
                        value={remainingManualPaymentMode}
                        onChange={(e) => setRemainingManualPaymentMode(e.target.value)}
                        placeholder="e.g., Cash, Bank Transfer, UPI"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reference number
                      </label>
                      <Input
                        value={remainingManualReferenceNo}
                        onChange={(e) => setRemainingManualReferenceNo(e.target.value)}
                        placeholder="Enter reference number"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowRemainingPaymentModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (remainingPaymentMethod === 'online') {
                      handleRemainingRazorpayPayment()
                    } else {
                      handleRemainingManualPayment()
                    }
                  }}
                  disabled={remainingPaymentLoading || (remainingPaymentMethod === 'cash' && !remainingManualReferenceNo.trim())}
                >
                  {remainingPaymentLoading ? 'Processing...' : remainingPaymentMethod === 'online' ? `Generate Payment Link - ₹${(remainingPaymentData.remaining_amount_paise / 100).toFixed(2)}` : 'Confirm Cash Payment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDI Report Dialog */}
      {showPDIReport && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => { if (pdiReportPdfUrl) URL.revokeObjectURL(pdiReportPdfUrl); setPdiReportPdfUrl(null); setShowPDIReport(false); }} />
          <div className="absolute left-1/2 top-1/2 w-[85vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 border-b border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">PDI Inspection Report</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {pdiReportLoading ? 'Loading report...' : `Report #${pdiReportData?.document_no} for ${pdiReportData?.request_id}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!pdiReportLoading && pdiReportData && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadPDIReport}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  )}
                  <Button
                    variant="icon"
                    size="icon"
                    onClick={() => { if (pdiReportPdfUrl) URL.revokeObjectURL(pdiReportPdfUrl); setPdiReportPdfUrl(null); setShowPDIReport(false); }}
                    aria-label="Close"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4">
              {pdiReportLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-slate-600">Loading PDI report...</div>
                </div>
              ) : pdiReportPdfUrl ? (
                <iframe
                  src={pdiReportPdfUrl}
                  title={`PDI Report ${pdiReportData?.request_id || ''}`}
                  className="w-full rounded-lg border border-slate-200"
                  style={{ height: '70vh' }}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="text-sm text-slate-600">No report data available</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment QR Code Modal */}
      {showPaymentQRModal && paymentQRData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[85vh] shadow-xl flex flex-col overflow-hidden">
            <div className="p-8 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Payment Link QR Code</h3>
                <button
                  onClick={() => {
                    setShowPaymentQRModal(false)
                    setPaymentQRData(null)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4 pb-8">
                {/* QR Code Display */}
                <div className="flex justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentQRData.url)}`}
                    alt="Payment Link QR Code"
                    className="border-2 border-slate-200 rounded-lg p-2 bg-white"
                  />
                </div>

                {/* Payment Details */}
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Amount:</span>
                    <span className="text-lg font-bold text-slate-900">{paymentQRData.amount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Type:</span>
                    <span className="text-sm font-semibold text-slate-900 capitalize">{paymentQRData.type}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-xs font-medium text-slate-600">Link ID:</span>
                    <p className="text-xs text-slate-700 break-all font-mono mt-1">{paymentQRData.linkId}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Payment Status:</span>
                    <span className="text-sm font-semibold text-slate-900 capitalize">{paymentQRData.status || 'unpaid'}</span>
                  </div>
                  {paymentQRData.amountPaid != null ? (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">Amount Paid:</span>
                      <span className="text-sm font-semibold text-slate-900">₹{(paymentQRData.amountPaid / 100).toFixed(2)}</span>
                    </div>
                  ) : null}
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    <strong>📱 Instructions:</strong>
                    <br />
                    1. Show this QR code to the customer
                    <br />
                    2. Customer scans with phone
                    <br />
                    3. Customer completes payment
                    <br />
                    4. You can verify payment status afterward
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-8 py-4">
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {/* <Button
                  variant="secondary"
                  onClick={refreshPaymentStatus}
                  disabled={paymentStatusLoading}
                  className="w-full"
                >
                  {paymentStatusLoading ? 'Refreshing...' : 'Refresh Status'}
                </Button> */}
                <Button
                  variant="outline"
                  onClick={handleVerifyPaymentLink}
                  disabled={verifyPaymentLoading}
                  className="w-full"
                >
                  {verifyPaymentLoading ? 'Verifying...' : 'Verify Status'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(paymentQRData.url)
                    alert('Payment link copied to clipboard!')
                  }}
                  className="w-full"
                >
                  Copy Link
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowPaymentQRModal(false)
                    setPaymentQRData(null)
                  }}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}