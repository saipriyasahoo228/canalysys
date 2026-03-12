import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, FilePlus2, MoreVertical, X } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
import { listCategoryPricing } from '../../api/categorypricing'
import { listBrands, listModels, listVariants, listCategoryValues } from '../../api/vehiclemaster'
import { createPDIRequest, listPDIRequests, getPDIRequestById, assignInspector, createRazorpayOrder, verifyRazorpayPayment, confirmManualPayment, createRazorpayOrderForRemaining, verifyRazorpayRemainingPayment, confirmManualRemainingPayment } from '../../api/inspection'
import { listCustomers, createCustomer, deleteCustomer, getCustomerBookings } from '../../api/customer'
import { getAvailabilities, getInspectorAvailabilityByDate } from '../../api/inspectoravailibility'
import { listInspectors } from '../../api/inspectoronboard'
import { useRbac } from '../rbac/RbacContext'
import { Badge, Button, Card, Input, PaginatedTable, Select, cx } from '../ui/Ui'
import { ViewDetailsDialog } from '../ui/ViewDetailsDialog'
import { CustomDatePicker } from '../ui/CustomDatePicker'
import { formatDate } from '../utils/format'

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

const PAYMENT_PROVIDER_OPTIONS = [
  { value: 'razorpay', label: 'Razorpay' },
  { value: 'payu', label: 'PayU' },
]

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

export function NewInspectionPage() {
  console.log('🔍 Debug - NewInspectionPage component rendering')
  
  const { actor } = useRbac()

  // State for availability data
  const [availabilityData, setAvailabilityData] = useState([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [availabilityFetched, setAvailabilityFetched] = useState(false)
  
  // State for inspector availability by date (busy/free status)
  const [inspectorAvailabilityByDate, setInspectorAvailabilityByDate] = useState({})
  const [loadingInspectorAvailability, setLoadingInspectorAvailability] = useState(false)
  
  // State for date filtering
  const [selectedFilterDate, setSelectedFilterDate] = useState('')
  const [showDateFilter, setShowDateFilter] = useState(false)
  
  // State for Razorpay payment
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [showRazorpay, setShowRazorpay] = useState(false)
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false)
  const [manualPaymentMode, setManualPaymentMode] = useState('Cash')
  const [manualReferenceNo, setManualReferenceNo] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('online') // 'online' or 'cash'
  
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

  const { data: customers, loading: loadingCustomers, error: customersError, refresh: refreshCustomers } = usePolling(
    'customers',
    () => listCustomers(),
    { intervalMs: 15_000 }
  )

  const { data: pdiRequestsData, loading: loadingPDIRequests, error: pdiRequestsError, refresh: refreshPDIRequests } = usePolling(
    'pdi-requests',
    () => listPDIRequests({ page: 1 }),
    { intervalMs: 15_000 }
  )

  // Function to generate date slots inside component
  const generateDateSlots = (availabilityData = [], inspectorAvailabilityByDate = {}) => {
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
  const handleDateFilter = async (date) => {
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
      
      if (!wizardForm.category) {
        alert('This field is required.')
        setPaymentLoading(false)
        return
      }
      
      if (!wizardForm.slotDate) {
        alert('This field is required.')
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
        category_id: parseInt(wizardForm.category),
        address: wizardForm.locationId || '', // Send as string, not address_id
        slot_date: wizardForm.slotDate,
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
      
      if (!wizardForm.category) {
        alert('This field is required.')
        setPaymentLoading(false)
        return
      }
      
      if (!wizardForm.slotDate) {
        alert('This field is required.')
        setPaymentLoading(false)
        return
      }
      
      // Step 1: Create PDI request first
      const pdiData = {
        customer_id: '', // Will be updated after customer creation
        name: customerName,
        mobile_number: customerPhone,
        email: customerEmail,
        vehicle_type: wizardForm.vehicleType === 'pre_owned' ? 'owned' : 'new',
        brand_id: parseInt(wizardForm.makeId),
        model_id: parseInt(wizardForm.modelId),
        variant_id: parseInt(wizardForm.variantId),
        category_id: parseInt(wizardForm.category),
        address: wizardForm.locationId || '', // Send as string, not address_id
        slot_date: wizardForm.slotDate,
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
      
      // Step 2: Create Razorpay order (use clientRequestId string, not requestId number)
      const orderResponse = await createRazorpayOrder(clientRequestId, clientRequestId)
      console.log('✅ Razorpay order created with clientRequestId:', clientRequestId)
      console.log('📦 Razorpay Order Response:', orderResponse)
      
      // Load Razorpay script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)
      
      script.onload = () => {
        const options = {
          key: orderResponse.key_id,
          order_id: orderResponse.razorpay_order_id,
          amount: orderResponse.amount_paise,
          currency: orderResponse.currency,
          name: 'PDI Advance Payment',
          description: `Advance payment of ₹500 for PDI request ${clientRequestId}`,
          image: '/logo.png',
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone,
          },
          theme: {
            color: '#3399cc',
          },
          modal: {
            ondismiss: function() {
              console.log('Payment modal dismissed')
              setShowRazorpay(false)
              setPaymentLoading(false)
            }
          },
          handler: async function (response) {
            try {
              console.log('Payment successful:', response)
              
              // Step 3: Verify payment with backend
              const verificationResponse = await verifyRazorpayPayment(
                clientRequestId, // Use string request_id instead of numeric
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature
              )
              
              console.log('✅ Payment verified:', verificationResponse)
              
              if (verificationResponse.message === 'Advance payment verified and request confirmed') {
                alert('Payment successful! Your PDI request has been confirmed.')
                setShowRazorpay(false)
                
                // Refresh customers and availability data, then close all dialogs
                await refreshCustomers()
                setAvailabilityFetched(false) // Reset to force refresh
                await fetchAvailabilityData()
                setDialog(null)
              } else {
                alert('Payment verification failed. Please contact support.')
                setShowRazorpay(false)
              }
            } catch (error) {
              console.error('Payment handler error:', error)
              alert('Payment processing failed. Please try again.')
              setShowRazorpay(false)
            }
          }
        }
        
        console.log('💰 Razorpay Options Amount:', orderResponse.amount_paise, 'INR:', orderResponse.amount_paise / 100)
        
        const rzp = new window.Razorpay(options)
        rzp.open()
        setShowRazorpay(true)
      }
      
      script.onerror = () => {
        console.error('Failed to load Razorpay SDK')
        alert('Payment gateway is currently unavailable. Please try again later.')
        setPaymentLoading(false)
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
      setPaymentLoading(false)
    }
  }

  // Handler for remaining payment via Razorpay
  const handleRemainingRazorpayPayment = async () => {
    if (!remainingPaymentData || !remainingPaymentRequestId) {
      alert('Payment details not available. Please try again.')
      return
    }

    setRemainingPaymentLoading(true)
    
    try {
      const clientRequestId = remainingPaymentData.request_id
      const remainingAmount = remainingPaymentData.remaining_amount_paise
      
      console.log('🔍 Processing remaining payment:', {
        clientRequestId,
        remainingAmount,
        customerName: remainingPaymentData.name,
        customerPhone: remainingPaymentData.mobile_number
      })
      
      // Step 1: Create Razorpay order for remaining payment
      const orderResponse = await createRazorpayOrderForRemaining(remainingPaymentRequestId, clientRequestId)
      console.log('✅ Razorpay order created for remaining payment:', orderResponse)
      
      // Load Razorpay script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)
      
      script.onload = () => {
        const options = {
          key: orderResponse.key_id,
          order_id: orderResponse.razorpay_order_id,
          amount: orderResponse.amount_paise,
          currency: orderResponse.currency,
          name: 'PDI Remaining Payment',
          description: `Remaining payment of ₹${(remainingAmount / 100).toFixed(2)} for PDI request ${clientRequestId}`,
          image: '/logo.png',
          prefill: {
            name: remainingPaymentData.name,
            email: remainingPaymentData.email,
            contact: remainingPaymentData.mobile_number,
          },
          theme: {
            color: '#f97316', // Orange color for remaining payment
          },
          modal: {
            ondismiss: function() {
              console.log('Remaining payment modal dismissed')
              setRemainingPaymentLoading(false)
            }
          },
          handler: async function (response) {
            try {
              console.log('Remaining payment successful:', response)
              
              // Step 2: Verify remaining payment with backend
              const verificationResponse = await verifyRazorpayRemainingPayment(
                remainingPaymentRequestId,
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature
              )
              
              console.log('✅ Remaining payment verified:', verificationResponse)
              
              if (verificationResponse.message === 'Remaining payment verified and request fully paid') {
                alert('Remaining payment successful! Your payment is now complete.')
                setShowRemainingPaymentModal(false)
                setRemainingPaymentLoading(false)
                
                // Refresh PDI requests to show updated payment status
                refreshPDIRequests()
              } else {
                alert('Remaining payment verification failed. Please contact support.')
                setRemainingPaymentLoading(false)
              }
            } catch (error) {
              console.error('Remaining payment handler error:', error)
              alert('Remaining payment processing failed. Please try again.')
              setRemainingPaymentLoading(false)
            }
          }
        }
        
        console.log('💰 Remaining Razorpay Options Amount:', orderResponse.amount_paise, 'INR:', orderResponse.amount_paise / 100)
        
        const rzp = new window.Razorpay(options)
        rzp.open()
      }
      
      script.onerror = () => {
        console.error('Failed to load Razorpay SDK for remaining payment')
        alert('Payment gateway is currently unavailable. Please try again later.')
        setRemainingPaymentLoading(false)
      }
    } catch (error) {
      console.error('Remaining payment error:', error)
      alert('Remaining payment failed. Please try again.')
      setRemainingPaymentLoading(false)
    }
  }

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
        remainingPaymentRequestId,
        remainingManualPaymentMode,
        remainingManualReferenceNo
      )
      
      console.log('✅ Manual remaining payment confirmed:', manualResponse)
      
      if (manualResponse.message === 'Manual remaining payment confirmed and request fully paid') {
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
      alert('Manual remaining payment failed. Please try again.')
      setRemainingPaymentLoading(false)
    }
  }

  const dateSlots = useMemo(() => generateDateSlots(availabilityData, inspectorAvailabilityByDate, selectedFilterDate), [availabilityData, inspectorAvailabilityByDate, selectedFilterDate])

  // Hardcoded locations since API endpoint doesn't exist yet
  const hardcodedLocations = [
    { id: 'LOC-BLR-01', name: 'Bangalore' },
    { id: 'LOC-HYD-01', name: 'Hyderabad' },
    { id: 'LOC-PUN-01', name: 'Pune' }
  ]
  
  const locations = hardcodedLocations
  const loadingLocations = false
  const locationsError = null

  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [variants, setVariants] = useState([])
  const [categoryValues, setCategoryValues] = useState([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)

  // Fetch all brands and category values on component mount
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

  const categoryOptions = useMemo(() => {
    return categoryValues.map((category) => ({
      value: category.id,
      label: category.name
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
        if (!mounted) return
        setBookingLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [bookingOpen, dialog?.customer?.id, dialog?.pdiId])

  const wizardStep = raiseOpen ? Number(dialog?.step || 1) : 1

  const wizardForm = useMemo(() => {
    if (!raiseOpen) return {}
    return dialog?.form || {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      vehicleType: '',
      makeId: '',
      modelId: '',
      variantId: '',
      category: '',
      locationId: '',
      slotDate: '',
    }
  }, [raiseOpen, dialog?.form])

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
  const [loadingPricing, setLoadingPricing] = useState(false)

  useEffect(() => {
    const fetchPricing = async () => {
      if (!wizardForm?.category) {
        setCategoryPricing([])
        return
      }
      try {
        setLoadingPricing(true)
        console.log('Fetching pricing for category:', wizardForm.category, 'vehicle type:', wizardForm.vehicleType)
        const currentVehicleType = wizardForm.vehicleType === 'pre_owned' ? 'owned' : 'new'
        const pricingData = await listCategoryPricing({ 
          category: wizardForm.category,
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
  }, [wizardForm?.category, wizardForm?.vehicleType])

  const priceInr = useMemo(() => {
    if (!raiseOpen) return 0
    
    // Ensure categoryPricing is an array
    const pricingArray = Array.isArray(categoryPricing) ? categoryPricing : []
    console.log('Available pricing array:', pricingArray)
    
    // Only use category pricing API - no fallback
    const currentVehicleType = wizardForm?.vehicleType === 'pre_owned' ? 'owned' : 'new'
    console.log('Looking for category:', Number(wizardForm?.category), 'vehicle type:', currentVehicleType)
    
    const categoryPrice = pricingArray.find(p => 
      p.category === Number(wizardForm?.category) && 
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
  }, [raiseOpen, locationExtraInr, wizardForm?.category, wizardForm?.vehicleType, categoryPricing])

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
      {key: 'createdAt', label: 'Booked at', value: b?.createdAt ? formatDateDisplay(String(b.createdAt).slice(0, 10)) : '—', fullWidth: true },
      { key: 'slot', label: 'Selected slot', value: b?.requestedSlotAt ? formatDateDisplay(String(b.requestedSlotAt).slice(0, 10)) : '—', fullWidth: true },
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
        { key: 'createdAt', label: 'Created At', value: detailData.created_at ? new Date(detailData.created_at).toLocaleString() : '—', fullWidth: true },
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
        { key: 'slotTime', label: 'Slot Time', value: `${detailData.slot_start_time || '09:00:00'} - ${detailData.slot_end_time || '18:00:00'}` },
        { key: 'address', label: 'Address', value: detailData.address || '—', fullWidth: true },
        { key: 'amount', label: 'Total Amount', value: `₹${(detailData.amount_paise / 100).toFixed(2)}` },
        { key: 'advancePaid', label: 'Advance Paid', value: `₹${(detailData.advance_amount_paise / 100).toFixed(2)}` },
        { key: 'remainingAmount', label: 'Remaining Amount', value: `₹${(detailData.remaining_amount_paise / 100).toFixed(2)}` },
        { key: 'paymentStage', label: 'Payment Stage', value: detailData.payment_stage || '—' },
        { key: 'status', label: 'Status', value: detailData.status || '—' },
        { key: 'assignedInspectorId', label: 'Assigned Inspector ID', value: detailData.assigned_inspector_id || '—' },
        { key: 'assignedInspectorName', label: 'Assigned Inspector Name', value: detailData.assigned_inspector_name || '—' },
        { key: 'createdAt', label: 'Created At', value: detailData.created_at ? new Date(detailData.created_at).toLocaleString() : '—', fullWidth: true },
      ]
    }
    
    return []
  }, [detailData, detailType])

  const locationOptions = useMemo(() => {
    return (locations || []).map((l) => ({ value: l.id, label: l.name }))
  }, [locations])

  const customerRows = Array.isArray(customers) ? customers : (customers?.results || [])

  // Process PDI requests data
  const pdiRequests = useMemo(() => {
    const items = pdiRequestsData?.items
    if (!Array.isArray(items)) return []
    return items.map((pdi) => ({
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
    }))
  }, [pdiRequestsData])

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
      {
        key: 'payment_stage',
        header: 'Payment Stage',
        exportValue: (r) => r.payment_stage || '—',
        cell: (r) => (
          <Badge tone={r.payment_stage === 'advance_paid' ? 'blue' : r.payment_stage === 'fully_paid' ? 'emerald' : 'slate'}>
            {r.payment_stage === 'advance_paid' ? 'Advance Paid' : r.payment_stage === 'fully_paid' ? 'Fully Paid' : r.payment_stage || '—'}
          </Badge>
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
                const rect = e.currentTarget.getBoundingClientRect()
                setActionsMenu({
                  requestId: r.request_id,
                  top: rect.bottom + window.scrollY + 4,
                  left: rect.left + window.scrollX - 150, // Position to the left
                })
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
                    vehicleType: 'new',
                    makeId: '',
                    modelId: '',
                    variantId: '',
                    category: '',
                    locationId: '',
                    slotDate: '',
                  },
                })
              }
            >
              Raise PDI
            </Button>
            <Button onClick={async () => refreshCustomers()}>Refresh</Button>
          </div>
        }
      />

      {/* PDI Requests Table */}
      <Card
        title="PDI Requests"
        subtitle="All PDI requests with details and status"
        accent="cyan"
        right={
          <Button onClick={() => refreshPDIRequests()}>
            Refresh
          </Button>
        }
      >
        {pdiRequestsError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            Failed to load PDI requests.
          </div>
        ) : (
          <PaginatedTable
            columns={pdiRequestsColumns}
            rows={pdiRequests}
            loading={loadingPDIRequests}
            emptyMessage="No PDI requests found"
            pageSize={10}
            rowKey={(row) => row.id}
          />
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
          <div className="absolute inset-0" onClick={() => setActionsMenu(null)} />
          <div
            ref={actionsMenuRef}
            className="absolute w-[220px] rounded-xl border border-slate-200 bg-white shadow-lg"
            style={{ top: actionsMenu.top, left: actionsMenu.left }}
          >
            {/* PDI Request Actions */}
            {actionsMenu.requestId && (
              <>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 rounded-t-xl"
                  onClick={() => {
                    fetchAndShowDetails(actionsMenu.requestId, 'customer')
                  }}
                >
                  View Customer Details
                </button>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => {
                    fetchAndShowDetails(actionsMenu.requestId, 'vehicle')
                  }}
                >
                  View Vehicle Details
                </button>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => {
                    fetchAndShowDetails(actionsMenu.requestId, 'booking')
                  }}
                >
                  View Booking Details
                </button>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => {
                    console.log('🔍 Debug - Assign Inspector button clicked!', { actionsMenu, requestId: actionsMenu?.requestId })
                    openAssignInspector(actionsMenu.requestId)
                  }}
                >
                  Assign Inspector
                </button>
                {/* Show Remaining Pay option only if advance is paid and remaining amount is due */}
                {(() => {
                  const request = pdiRequests.find(r => r.request_id === actionsMenu.requestId)
                  const isEligible = request && 
                    request.payment_stage === 'advance_paid' && 
                    request.remaining_amount_paise > 0
                  return isEligible ? (
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 text-green-700"
                      onClick={() => {
                        openRemainingPayment(actionsMenu.requestId)
                      }}
                    >
                      Remaining Pay
                    </button>
                  ) : null
                })()}
              </>
            )}
            
            {/* Existing Customer Actions */}
            {actionsMenu.customer && (
              <>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 rounded-t-xl"
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
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
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
                  className="w-full px-3 py-2 text-left text-sm hover:bg-rose-50 text-rose-700 rounded-b-xl"
                  onClick={async () => {
                    const c = actionsMenu.customer
                    setActionsMenu(null)
                    if (!c?.id) return
                    // eslint-disable-next-line no-alert
                    const ok = confirm(`Delete customer ${c.fullName || c.id}? This will also remove their bookings.`)
                    if (!ok) return
                try {
                  await deleteCustomer(c.id)
                  await refreshCustomers()
                } catch (e) {
                  // eslint-disable-next-line no-alert
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
                          <div className="text-xs font-medium text-slate-900">Brand *</div>
                          <div className="mt-1">
                            <Select
                              value={wizardForm.makeId}
                              onChange={(e) => {
                                const nextMakeId = e.target.value
                                setDialog((s) => {
                                  if (!s || s.type !== 'raise') return s
                                  if (!nextMakeId) return { ...s, form: { ...s.form, makeId: '', modelId: '', variantId: '' } }
                                  const nextModelId = models?.[0]?.id || ''
                                  return {
                                    ...s,
                                    form: { ...s.form, makeId: nextMakeId, modelId: nextModelId, variantId: '' },
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
                                  if (!nextModelId) return { ...s, form: { ...s.form, modelId: '', variantId: '' } }
                                  const nextVariantId = variants?.[0]?.id || ''
                                  return {
                                    ...s,
                                    form: { ...s.form, modelId: nextModelId, variantId: nextVariantId },
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
                          <div className="mt-1">
                            <Select
                              value={wizardForm.variantId}
                              onChange={(e) => {
                                const nextVariantId = e.target.value
                                setDialog((s) => {
                                  if (!s || s.type !== 'raise') return s
                                  return { ...s, form: { ...s.form, variantId: nextVariantId } }
                                })
                              }}
                            >
                              <option value="">Select</option>
                              {(() => {
                                const list = variants
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
                          <div className="text-xs font-medium text-slate-900">Category *</div>
                          <div className="mt-1">
                            <Select
                              value={wizardForm.category}
                              onChange={(e) =>
                                setDialog((s) =>
                                  s && s.type === 'raise' ? { ...s, form: { ...s.form, category: e.target.value } } : s
                                )
                              }
                            >
                              <option value="">Select category</option>
                              {categoryOptions.map((o) => (
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
                            <Input
                              value={wizardForm.locationId || ''}
                              onChange={(e) =>
                                setDialog((s) =>
                                  s && s.type === 'raise' ? { ...s, form: { ...s.form, locationId: e.target.value } } : s
                                )
                              }
                              placeholder="Enter location"
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

                      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Calendar Section */}
                        <div>
                          <div className="text-xs font-medium text-slate-900">Select from calendar</div>
                          <div className="mt-2">
                            <CustomDatePicker
                              value={wizardForm.slotDate}
                              onChange={(iso) =>
                                setDialog((s) =>
                                  s && s.type === 'raise' ? { ...s, form: { ...s.form, slotDate: iso } } : s
                                )
                              }
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
                          <div className="text-xs font-medium text-slate-900">Select date slot</div>
                          <button
                            type="button"
                            onClick={() => setShowDateFilter(!showDateFilter)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {showDateFilter ? 'Hide Filter' : 'Date Filter'}
                          </button>
                        </div>
                        
                        {showDateFilter && (
                          <div className="mt-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                            <div className="flex items-center gap-3">
                              <div className="text-xs font-medium text-slate-700">Filter by date:</div>
                              <input
                                type="date"
                                value={selectedFilterDate}
                                onChange={(e) => handleDateFilter(e.target.value)}
                                className="text-xs px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {selectedFilterDate && (
                                <button
                                  type="button"
                                  onClick={() => handleDateFilter('')}
                                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            {loadingInspectorAvailability && (
                              <div className="mt-2 text-xs text-slate-600">Loading filtered availability...</div>
                            )}
                          </div>
                        )}
                        
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                          {dateSlots.map((slot) => {
                            const active = wizardForm.slotDate === slot.value
                            const isAvailable = slot.isAvailable
                            return (
                              <button
                                key={slot.value}
                                type="button"
                                disabled={!isAvailable}
                                className={cx(
                                  'rounded-xl border px-3 py-3 text-xs font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-950/30',
                                  active
                                    ? 'border-green-600 bg-green-600 text-white cursor-pointer'
                                    : isAvailable
                                    ? 'border-green-200 bg-green-50 text-green-900 hover:bg-green-100 cursor-pointer'
                                    : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                                )}
                                onClick={() =>
                                  isAvailable && setDialog((s) => (s && s.type === 'raise' ? { ...s, form: { ...s.form, slotDate: slot.value } } : s))
                                }
                              >
                                <div className="font-semibold">{slot.display.split(',')[0]}</div>
                                <div className="mt-1 text-xs opacity-75">{slot.display.split(',')[1]?.trim()}</div>
                                {isAvailable && (
                                  <div className="mt-1 text-xs font-medium">
                                    {slot.freeInspectorCount} free inspector{slot.freeInspectorCount > 1 ? 's' : ''} available
                                    {slot.busyInspectorCount > 0 && (
                                      <span className="ml-1 text-orange-600">
                                        ({slot.busyInspectorCount} busy)
                                      </span>
                                    )}
                                  </div>
                                )}
                                {!isAvailable && (
                                  <div className="mt-1 text-xs">
                                    {slot.busyInspectorCount > 0 
                                      ? `${slot.busyInspectorCount} busy inspector${slot.busyInspectorCount > 1 ? 's' : ''}`
                                      : 'No inspectors'
                                    }
                                  </div>
                                )}
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
                          {wizardForm.slotDate
                            ? formatDateDisplay(wizardForm.slotDate)
                            : '—'}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">{wizardForm.locationId || '—'}</div>
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
                          {wizardForm.vehicleType === 'pre_owned' ? 'Pre-Owned' : 'New'} · {wizardForm.category}
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
                          {String(wizardForm.locationId || '').trim() || '—'}
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
                              <div className="font-medium text-slate-900">Online Payment</div>
                              <div className="text-xs text-slate-600">Pay securely via Razorpay (Card, UPI, Net Banking)</div>
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
                              <div className="text-xs text-slate-600">Pay cash at the inspection center</div>
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
                          if (!String(wizardForm.category || '').trim()) return
                          
                          // Check if pricing data is available
                          const pricingArray = Array.isArray(categoryPricing) ? categoryPricing : []
                          const currentVehicleType = wizardForm?.vehicleType === 'pre_owned' ? 'owned' : 'new'
                          const categoryPrice = pricingArray.find(p => 
                            p.category === Number(wizardForm?.category) && 
                            p.vehicle_type === currentVehicleType
                          )
                          
                          if (!categoryPrice) {
                            alert('Pricing data not available for selected category and vehicle type. Please select different options or contact support.')
                            return
                          }
                          
                          // Fetch availability data before moving to step 2
                          console.log('✅ Pricing validation passed, calling fetchAvailabilityData...')
                          await fetchAvailabilityData()
                          
                          setDialog((s) => (s && s.type === 'raise' ? { ...s, step: 2 } : s))
                          return
                        }
                        if (wizardStep === 2) {
                          if (!wizardForm.slotDate) return
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
                            !String(wizardForm.category || '').trim())) ||
                        (wizardStep === 2 && !wizardForm.slotDate)
                      }
                    >
                      {wizardStep === 1 ? 'Select Date' : wizardStep === 2 ? 'Proceed to Checkout' : 'Next'}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={async () => {
                        if (!raiseOpen) return
                        if (paymentMethod === 'online') {
                          await handleRazorpayPayment()
                        } else {
                          // Handle cash payment - use manual payment confirmation
                          await handleManualPayment()
                        }
                      }}
                    >
                      {paymentLoading ? 'Processing...' : paymentMethod === 'online' ? `Pay ₹500 Advance Online` : 'Book & Pay Cash'}
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
                      <div className="font-medium text-slate-900">Online Payment</div>
                      <div className="text-xs text-slate-600">Pay securely via Razorpay (Card, UPI, Net Banking)</div>
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
                      <div className="text-xs text-slate-600">Pay cash at the inspection center</div>
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
                  {remainingPaymentLoading ? 'Processing...' : remainingPaymentMethod === 'online' ? `Pay ₹${(remainingPaymentData.remaining_amount_paise / 100).toFixed(2)} Online` : 'Confirm Cash Payment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
