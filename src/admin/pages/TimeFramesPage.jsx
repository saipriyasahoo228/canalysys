// import { useState, useEffect } from 'react'
// import { Clock, Plus, Edit2, Trash2, Settings, Save, Ban, CheckCircle } from 'lucide-react'
// import { Card, Button } from '../ui/Ui'
// import { CustomDatePicker } from '../ui/CustomDatePicker'
// import { ReasonDialog } from '../ui/ReasonDialog'
// import { Snackbar } from '../ui/Snackbar'
// import { formatDate } from '../utils/format'
// import { 
//   getTimeSlotConfigurations, 
//   updateTimeSlotConfiguration,
//   getSlots,
//   getWeeklyPatterns,
//   createWeeklyPattern,
//   updateWeeklyPattern,
//   deleteWeeklyPattern,
//   disableTimeSlot,
//   updateSlotAvailability
// } from '../../api/timeSlotConfigurations'

// const WEEKDAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// export function TimeFramesPage() {
//   const [config, setConfig] = useState({
//     slot_interval_minutes: 60,
//     start_time: '09:00:00',
//     end_time: '17:00:00',
//     cooldown_minutes: 60
//   })
//   const [slots, setSlots] = useState({
//     date: '',
//     interval_minutes: 60,
//     slots: []
//   })
//   const [weeklyPatterns, setWeeklyPatterns] = useState([])
//   const [weeklyPatternsLoading, setWeeklyPatternsLoading] = useState(false)
//   const [weeklyDialogOpen, setWeeklyDialogOpen] = useState(false)
//   const [editingPattern, setEditingPattern] = useState(null)
//   const [weeklyDialogErrors, setWeeklyDialogErrors] = useState({})
//   const [loading, setLoading] = useState(true)
//   const [slotsLoading, setSlotsLoading] = useState(false)
//   const [configLoading, setConfigLoading] = useState(false)
//   const [configErrors, setConfigErrors] = useState({})
//   const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
//   const [snack, setSnack] = useState({ open: false, tone: 'info', title: '', message: '' })
//   const [slotDialogOpen, setSlotDialogOpen] = useState(false)
//   const [selectedSlot, setSelectedSlot] = useState(null)
//   const [slotActionLoading, setSlotActionLoading] = useState(false)

//   const showSnack = (next) => {
//     setSnack({ open: true, tone: next?.tone || 'info', title: next?.title || '', message: next?.message || '' })
//   }

//   // Convert 12-hour format to 24-hour format for API
//   const convertTo24Hour = (timeStr) => {
//     if (!timeStr) return '';
    
//     // If it's already in HH:MM format (24-hour)
//     if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
//       return timeStr;
//     }
    
//     // If it has AM/PM (e.g., "09:00 AM" or "09:00AM")
//     const match = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
//     if (match) {
//       let hours = parseInt(match[1]);
//       const minutes = match[2];
//       const meridiem = match[3].toUpperCase();
      
//       if (meridiem === 'PM' && hours !== 12) {
//         hours += 12;
//       } else if (meridiem === 'AM' && hours === 12) {
//         hours = 0;
//       }
      
//       return `${hours.toString().padStart(2, '0')}:${minutes}`;
//     }
    
//     // If it's in HH:MM:SS format
//     if (timeStr.includes(':')) {
//       const parts = timeStr.split(':');
//       return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
//     }
    
//     return timeStr;
//   }

//   // Convert 24-hour format to 12-hour format for UI display
//   const convertTo12Hour = (timeStr) => {
//     if (!timeStr) return '';
    
//     let hours = 0;
//     let minutes = 0;
    
//     if (timeStr.includes(':')) {
//       const parts = timeStr.split(':');
//       hours = parseInt(parts[0]);
//       minutes = parseInt(parts[1]);
//     }
    
//     const ampm = hours >= 12 ? 'PM' : 'AM';
//     const hour12 = hours % 12 || 12;
//     return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
//   }

//   useEffect(() => {
//     // Fetch configuration from API on component mount
//     const fetchData = async () => {
//       try {
//         setLoading(true)
//         const data = await getTimeSlotConfigurations()
//         setConfig(data)

//         // Fetch slots for today using the current global interval
//         await fetchSlots(selectedDate, data.slot_interval_minutes)
//         await fetchWeeklyPatterns()
//       } catch (error) {
//         showSnack({ tone: 'danger', title: 'Error', message: 'Failed to load configuration' })
//       } finally {
//         setLoading(false)
//       }
//     }
    
//     fetchData()
//   }, []) // Empty dependency array - only runs on mount

//   const fetchSlots = async (date, interval = null) => {
//     try {
//       setSlotsLoading(true)
//       const queryInterval = interval ?? config.slot_interval_minutes
//       const slotsData = await getSlots(date, queryInterval)
//       setSlots(slotsData)
//     } catch (error) {
//       showSnack({ tone: 'danger', title: 'Error', message: 'Failed to load time slots' })
//     } finally {
//       setSlotsLoading(false)
//     }
//   }

//   const fetchWeeklyPatterns = async () => {
//     try {
//       setWeeklyPatternsLoading(true)
//       const patterns = await getWeeklyPatterns()
//       const list = Array.isArray(patterns)
//         ? patterns
//         : Array.isArray(patterns.results)
//         ? patterns.results
//         : []
//       setWeeklyPatterns(list)
//     } catch (error) {
//       showSnack({ tone: 'danger', title: 'Error', message: 'Failed to load weekly patterns' })
//     } finally {
//       setWeeklyPatternsLoading(false)
//     }
//   }

//   const openWeeklyDialog = (pattern = null) => {
//     setEditingPattern(pattern)
//     setWeeklyDialogErrors({})
//     setWeeklyDialogOpen(true)
//   }

//   const closeWeeklyDialog = () => {
//     setWeeklyDialogOpen(false)
//     setEditingPattern(null)
//     setWeeklyDialogErrors({})
//   }

//   const handleWeeklySubmit = async (form) => {
//     try {
//       const payload = {
//         day_of_week: Number(form.day_of_week),
//         is_available: form.is_available === false || form.is_available === 'false' ? false : true,
//         reason_unavailable: form.reason?.trim() || null,
//       }

//       if (editingPattern?.id) {
//         await updateWeeklyPattern(editingPattern.id, payload)
//         showSnack({ tone: 'success', title: 'Updated', message: 'Weekly availability pattern updated' })
//       } else {
//         await createWeeklyPattern(payload)
//         showSnack({ tone: 'success', title: 'Created', message: 'Weekly availability pattern created' })
//       }

//       closeWeeklyDialog()
//       await fetchWeeklyPatterns()
//       await fetchSlots(selectedDate)
//     } catch (error) {
//       const message = error.response?.data?.message || error.message || 'Failed to save weekly pattern'
//       setWeeklyDialogErrors(error.response?.data || {})
//       showSnack({ tone: 'danger', title: 'Error', message })
//       throw error
//     }
//   }

//   const handleDeleteWeeklyPattern = async (id) => {
//     try {
//       await deleteWeeklyPattern(id)
//       showSnack({ tone: 'success', title: 'Deleted', message: 'Weekly availability pattern removed' })
//       await fetchWeeklyPatterns()
//       await fetchSlots(selectedDate)
//     } catch (error) {
//       const message = error.response?.data?.message || error.message || 'Failed to delete weekly pattern'
//       showSnack({ tone: 'danger', title: 'Error', message })
//     }
//   }

//   const openSlotDialog = (slot) => {
//     setSelectedSlot(slot)
//     setSlotDialogOpen(true)
//   }

//   const closeSlotDialog = () => {
//     setSlotDialogOpen(false)
//     setSelectedSlot(null)
//     setSlotActionLoading(false)
//   }

//   // Unified handler for both disabling and enabling slots
//   const handleSlotToggle = async (form, isDisabling) => {
//     try {
//       setSlotActionLoading(true)
      
//       const payload = {
//         date: selectedDate,
//         start_time: convertTo24Hour(selectedSlot.start),
//         end_time: convertTo24Hour(selectedSlot.end),
//         is_available: !isDisabling, // If disabling -> false, if enabling -> true
//         reason: isDisabling ? (form.reason?.trim() || 'Manually disabled by admin') : null
//       }

//       if (isDisabling) {
//         // Use POST to create a new disable override
//         await disableTimeSlot(payload)
//         showSnack({ tone: 'success', title: 'Success', message: 'Time slot disabled successfully' })
//       } else {
//         // Use PATCH to update/enable the slot
//         await updateSlotAvailability(payload)
//         showSnack({ tone: 'success', title: 'Success', message: 'Time slot enabled successfully' })
//       }
      
//       closeSlotDialog()
//       await fetchSlots(selectedDate)
//     } catch (error) {
//       const message = error.response?.data?.message || error.message || 
//         (isDisabling ? 'Failed to disable time slot' : 'Failed to enable time slot')
//       showSnack({ tone: 'danger', title: 'Error', message })
//       throw error
//     } finally {
//       setSlotActionLoading(false)
//     }
//   }

//   const handleDisableSlot = async (form) => {
//     return handleSlotToggle(form, true)
//   }

//   const handleEnableSlot = async (form) => {
//     return handleSlotToggle(form, false)
//   }

//   const handleDateChange = (date) => {
//     setSelectedDate(date)
//     fetchSlots(date)
//   }

//   const handleConfigUpdate = async () => {
//     try {
//       setConfigLoading(true)
//       setConfigErrors({})
      
//       // Validate configuration
//       const errors = {}
//       if (!config.slot_interval_minutes || config.slot_interval_minutes <= 0) {
//         errors.slot_interval_minutes = 'Slot interval must be greater than 0'
//       }
//       if (!config.start_time) {
//         errors.start_time = 'Start time is required'
//       }
//       if (!config.end_time) {
//         errors.end_time = 'End time is required'
//       }
//       if (config.cooldown_minutes !== undefined && config.cooldown_minutes < 0) {
//         errors.cooldown_minutes = 'Cooldown minutes must be 0 or greater'
//       }
      
//       if (Object.keys(errors).length > 0) {
//         setConfigErrors(errors)
//         return
//       }
      
//       const updatedConfig = await updateTimeSlotConfiguration({
//         slot_interval_minutes: parseInt(config.slot_interval_minutes),
//         start_time: config.start_time,
//         end_time: config.end_time,
//         cooldown_minutes: config.cooldown_minutes ? parseInt(config.cooldown_minutes) : 0
//       })
      
//       setConfig(updatedConfig)
//       showSnack({ tone: 'success', title: 'Success', message: 'Configuration updated successfully' })
      
//       // Immediately refresh slots after config update
//       await fetchSlots(selectedDate, updatedConfig.slot_interval_minutes)
//     } catch (error) {
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to update configuration'
//       showSnack({ tone: 'danger', title: 'Error', message: errorMessage })
//     } finally {
//       setConfigLoading(false)
//     }
//   }

//   const handleConfigChange = (field, value) => {
//     setConfig(prev => ({ ...prev, [field]: value }))
//     if (configErrors[field]) {
//       setConfigErrors(prev => ({ ...prev, [field]: '' }))
//     }
//   }

//   if (loading) {
//     return (
//       <div className="flex min-h-[40vh] items-center justify-center">
//         <div className="text-sm text-slate-500">Loading time slot configuration...</div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       {/* Configuration Card */}
//       <Card
//         title="Global Configuration"
//         subtitle="Manage slot intervals, working hours, and booking cooldown"
//         accent="blue"
//         icon={<Settings className="h-5 w-5" />}
//         right={
//           <Button
//             variant="primary"
//             size="sm"
//             onClick={handleConfigUpdate}
//             disabled={configLoading}
//           >
//             <Save className="h-4 w-4" />
//             {configLoading ? 'Saving...' : 'Save Configuration'}
//           </Button>
//         }
//       >
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1">
//               Slot Interval (minutes) *
//             </label>
//             <input
//               type="number"
//               value={config.slot_interval_minutes}
//               onChange={(e) => handleConfigChange('slot_interval_minutes', e.target.value)}
//               className={`w-full h-10 rounded-md border bg-white px-3 text-sm focus:outline-none focus:ring-2 ${
//                 configErrors.slot_interval_minutes
//                   ? 'border-red-300 focus:ring-red-500'
//                   : 'border-slate-300 focus:ring-cyan-500'
//               }`}
//               placeholder="60"
//               min="1"
//             />
//             {configErrors.slot_interval_minutes && (
//               <p className="mt-1 text-sm text-red-600">{configErrors.slot_interval_minutes}</p>
//             )}
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1">
//               Start Time *
//             </label>
//             <input
//               type="time"
//               value={config.start_time}
//               onChange={(e) => handleConfigChange('start_time', e.target.value)}
//               className={`w-full h-10 rounded-md border bg-white px-3 text-sm focus:outline-none focus:ring-2 ${
//                 configErrors.start_time
//                   ? 'border-red-300 focus:ring-red-500'
//                   : 'border-slate-300 focus:ring-cyan-500'
//               }`}
//             />
//             {configErrors.start_time && (
//               <p className="mt-1 text-sm text-red-600">{configErrors.start_time}</p>
//             )}
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1">
//               End Time *
//             </label>
//             <input
//               type="time"
//               value={config.end_time}
//               onChange={(e) => handleConfigChange('end_time', e.target.value)}
//               className={`w-full h-10 rounded-md border bg-white px-3 text-sm focus:outline-none focus:ring-2 ${
//                 configErrors.end_time
//                   ? 'border-red-300 focus:ring-red-500'
//                   : 'border-slate-300 focus:ring-cyan-500'
//               }`}
//             />
//             {configErrors.end_time && (
//               <p className="mt-1 text-sm text-red-600">{configErrors.end_time}</p>
//             )}
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1">
//               Cooldown (minutes)
//             </label>
//             <input
//               type="number"
//               value={config.cooldown_minutes}
//               onChange={(e) => handleConfigChange('cooldown_minutes', e.target.value)}
//               className={`w-full h-10 rounded-md border bg-white px-3 text-sm focus:outline-none focus:ring-2 ${
//                 configErrors.cooldown_minutes
//                   ? 'border-red-300 focus:ring-red-500'
//                   : 'border-slate-300 focus:ring-cyan-500'
//               }`}
//               placeholder="60"
//               min="0"
//             />
//             {configErrors.cooldown_minutes && (
//               <p className="mt-1 text-sm text-red-600">{configErrors.cooldown_minutes}</p>
//             )}
//           </div>
//         </div>
        
//         {config.updated_at && (
//           <div className="mt-4 text-xs text-slate-500">
//             Last updated: {new Date(config.updated_at).toLocaleString()}
//           </div>
//         )}
//       </Card>

//       {/* Weekly Availability Patterns Card */}
//       <Card
//         title="Weekly Availability Patterns"
//         subtitle="Set recurring availability rules for each weekday"
//         accent="cyan"
//         right={
//           <Button
//             variant="primary"
//             size="sm"
//             onClick={() => openWeeklyDialog(null)}
//           >
//             <Plus className="h-4 w-4" />
//             Add Rule
//           </Button>
//         }
//       >
//         {weeklyPatternsLoading ? (
//           <div className="flex items-center justify-center py-8">
//             <div className="text-sm text-slate-500">Loading weekly patterns...</div>
//           </div>
//         ) : weeklyPatterns.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-8 text-center">
//             <div className="text-sm text-slate-500">No weekly availability rules configured yet.</div>
//             <div className="mt-2 text-xs text-slate-400">Create a rule to mark a weekday available or unavailable.</div>
//           </div>
//         ) : (
//           <div className="space-y-3">
//             {weeklyPatterns.map((pattern) => (
//               <div key={pattern.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
//                 <div>
//                   <div className="text-sm font-semibold text-slate-900">{WEEKDAY_LABELS[pattern.day_of_week]}</div>
//                   <div className="mt-1 text-xs text-slate-600">
//                     {pattern.is_available ? 'Available' : 'Unavailable'}
//                   </div>
//                   {(pattern.reason_unavailable || pattern.reason) && (
//                     <div className="mt-2 text-xs text-slate-500">{pattern.reason_unavailable || pattern.reason}</div>
//                   )}
//                 </div>
//                 <div className="flex flex-wrap gap-2">
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => openWeeklyDialog(pattern)}
//                   >
//                     <Edit2 className="h-4 w-4" />
//                     Edit
//                   </Button>
//                   <Button
//                     variant="danger"
//                     size="sm"
//                     onClick={() => handleDeleteWeeklyPattern(pattern.id)}
//                   >
//                     <Trash2 className="h-4 w-4" />
//                     Delete
//                   </Button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </Card>

//       {/* Time Slots Display */}
//       <Card
//         title="Generated Time Slots"
//         subtitle={`Available slots for ${formatDate(slots.date || selectedDate)}`}
//         accent="green"
//       >
//         <div className="space-y-4">
//           {/* Date Selector */}
//           <div className="flex items-center gap-4">
//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1">
//                 Select Date
//               </label>
//               <CustomDatePicker
//                 value={selectedDate}
//                 onChange={(value) => handleDateChange(value)}
//                 placeholder="dd/mm/yyyy"
//                 className="w-full"
//               />
//             </div>
//           </div>

//           {/* Slots Grid */}
//           {slotsLoading ? (
//             <div className="flex items-center justify-center py-8">
//               <div className="text-sm text-slate-500">Loading time slots...</div>
//             </div>
//           ) : slots.slots?.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-8">
//               <Clock className="h-12 w-12 text-slate-300 mb-3" />
//               <div className="text-sm text-slate-500">No time slots available for this date</div>
//             </div>
//           ) : (
//             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
//               {slots.slots.map((slot, index) => (
//                 <div
//                   key={index}
//                   className={`p-3 rounded-lg border text-center transition-colors ${
//                     slot.is_available
//                       ? 'border-green-200 bg-green-50 hover:bg-green-100'
//                       : 'border-red-200 bg-red-50 opacity-60'
//                   }`}
//                 >
//                   <div className="text-sm font-medium text-slate-900">
//                     {convertTo12Hour(slot.start)}
//                   </div>
//                   <div className="text-xs text-slate-600">
//                     {convertTo12Hour(slot.end)}
//                   </div>
//                   <div className="mt-1">
//                     <span
//                       className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
//                         slot.is_available
//                           ? 'bg-green-100 text-green-800'
//                           : 'bg-red-100 text-red-800'
//                       }`}
//                     >
//                       {slot.is_available ? 'Available' : 'Unavailable'}
//                     </span>
//                   </div>
//                   {!slot.is_available && (slot.reason_unavailable || slot.reason) && (
//                     <div className="mt-2 text-xs text-slate-500">
//                       {slot.reason_unavailable || slot.reason}
//                     </div>
//                   )}
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => openSlotDialog(slot)}
//                     className={`mt-2 w-full text-xs ${
//                       slot.is_available 
//                         ? 'text-red-600 hover:text-red-700' 
//                         : 'text-green-600 hover:text-green-700'
//                     }`}
//                   >
//                     {slot.is_available ? (
//                       <>
//                         <Ban className="h-3 w-3 mr-1" />
//                         Disable
//                       </>
//                     ) : (
//                       <>
//                         <CheckCircle className="h-3 w-3 mr-1" />
//                         Enable
//                       </>
//                     )}
//                   </Button>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </Card>

//       {/* Snackbar for notifications */}
//       <Snackbar
//         open={snack.open}
//         tone={snack.tone}
//         title={snack.title}
//         message={snack.message}
//         onClose={() => setSnack({ open: false, tone: 'info', title: '', message: '' })}
//       />

//       {/* Weekly Pattern Dialog */}
//       <ReasonDialog
//         open={weeklyDialogOpen}
//         title={editingPattern ? 'Edit Weekly Pattern' : 'Add Weekly Pattern'}
//         description="Create or update a recurring weekday availability rule."
//         submitLabel={editingPattern ? 'Update' : 'Create'}
//         onClose={closeWeeklyDialog}
//         showReason={false}
//         requireReason={false}
//         fields={[
//           {
//             name: 'day_of_week',
//             label: 'Weekday *',
//             type: 'select',
//             defaultValue: editingPattern?.day_of_week ?? '',
//             options: WEEKDAY_LABELS.map((label, index) => ({ value: index, label })),
//           },
//           {
//             name: 'is_available',
//             label: 'Availability *',
//             type: 'select',
//             defaultValue: editingPattern?.is_available ?? true,
//             options: [
//               { value: true, label: 'Available' },
//               { value: false, label: 'Unavailable' },
//             ],
//           },
//           {
//             name: 'reason',
//             label: 'Reason (optional)',
//             type: 'textarea',
//             rows: 3,
//             defaultValue: editingPattern?.reason_unavailable || editingPattern?.reason || '',
//             placeholder: 'Enter a reason for this rule, if needed',
//           },
//         ]}
//         fieldErrors={weeklyDialogErrors}
//         onSubmit={handleWeeklySubmit}
//       />

//       {/* Slot Action Dialog - Dynamic for both Disable and Enable */}
//       <ReasonDialog
//         open={slotDialogOpen}
//         title={selectedSlot?.is_available ? "Disable Time Slot" : "Enable Time Slot"}
//         description={
//           selectedSlot?.is_available
//             ? `Disable slot from ${selectedSlot ? convertTo12Hour(selectedSlot.start) : ''} to ${selectedSlot ? convertTo12Hour(selectedSlot.end) : ''} on ${formatDate(selectedDate)}`
//             : `Enable slot from ${selectedSlot ? convertTo12Hour(selectedSlot.start) : ''} to ${selectedSlot ? convertTo12Hour(selectedSlot.end) : ''} on ${formatDate(selectedDate)}`
//         }
//         submitLabel={selectedSlot?.is_available ? "Disable Slot" : "Enable Slot"}
//         onClose={closeSlotDialog}
//         showReason={selectedSlot?.is_available ?? false}
//         requireReason={selectedSlot?.is_available ?? false}
//         fields={[]}
//         fieldErrors={{}}
//         onSubmit={selectedSlot?.is_available ? handleDisableSlot : handleEnableSlot}
//         isLoading={slotActionLoading}
//       />
//     </div>
//   )
// }
















import { useState, useEffect } from 'react'
import { Clock, Plus, Edit2, Trash2, Settings, Save, Ban, CheckCircle } from 'lucide-react'
import { Card, Button } from '../ui/Ui'
import { CustomDatePicker } from '../ui/CustomDatePicker'
import { ReasonDialog } from '../ui/ReasonDialog'
import { Snackbar } from '../ui/Snackbar'
import { formatDate } from '../utils/format'
import { 
  getTimeSlotConfigurations, 
  updateTimeSlotConfiguration,
  getSlots,
  getWeeklyPatterns,
  createWeeklyPattern,
  updateWeeklyPattern,
  deleteWeeklyPattern,
  disableTimeSlot,
  updateSlotAvailability
} from '../../api/timeSlotConfigurations'

const WEEKDAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function TimeFramesPage() {
  const [config, setConfig] = useState({
    slot_interval_minutes: 60,
    start_time: '09:00:00',
    end_time: '17:00:00',
    cooldown_minutes: 60
  })
  const [slots, setSlots] = useState({
    date: '',
    interval_minutes: 60,
    slots: []
  })
  const [weeklyPatterns, setWeeklyPatterns] = useState([])
  const [weeklyPatternsLoading, setWeeklyPatternsLoading] = useState(false)
  const [weeklyDialogOpen, setWeeklyDialogOpen] = useState(false)
  const [editingPattern, setEditingPattern] = useState(null)
  const [weeklyDialogErrors, setWeeklyDialogErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)
  const [configErrors, setConfigErrors] = useState({})
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [snack, setSnack] = useState({ open: false, tone: 'info', title: '', message: '' })
  const [slotDialogOpen, setSlotDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [slotActionLoading, setSlotActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('slots') // 'slots' or 'patterns'

  const showSnack = (next) => {
    setSnack({ open: true, tone: next?.tone || 'info', title: next?.title || '', message: next?.message || '' })
  }

  // Convert 12-hour format to 24-hour format for API
  const convertTo24Hour = (timeStr) => {
    if (!timeStr) return '';
    
    // If it's already in HH:MM format (24-hour)
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
      return timeStr;
    }
    
    // If it has AM/PM (e.g., "09:00 AM" or "09:00AM")
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const meridiem = match[3].toUpperCase();
      
      if (meridiem === 'PM' && hours !== 12) {
        hours += 12;
      } else if (meridiem === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
    
    // If it's in HH:MM:SS format
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    
    return timeStr;
  }

  // Convert 24-hour format to 12-hour format for UI display
  const convertTo12Hour = (timeStr) => {
    if (!timeStr) return '';
    
    let hours = 0;
    let minutes = 0;
    
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      hours = parseInt(parts[0]);
      minutes = parseInt(parts[1]);
    }
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  useEffect(() => {
    // Fetch configuration from API on component mount
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await getTimeSlotConfigurations()
        setConfig(data)

        // Fetch slots for today using the current global interval
        await fetchSlots(selectedDate, data.slot_interval_minutes)
        await fetchWeeklyPatterns()
      } catch (error) {
        showSnack({ tone: 'danger', title: 'Error', message: 'Failed to load configuration' })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, []) // Empty dependency array - only runs on mount

  const fetchSlots = async (date, interval = null) => {
    try {
      setSlotsLoading(true)
      const queryInterval = interval ?? config.slot_interval_minutes
      const slotsData = await getSlots(date, queryInterval)
      setSlots(slotsData)
    } catch (error) {
      showSnack({ tone: 'danger', title: 'Error', message: 'Failed to load time slots' })
    } finally {
      setSlotsLoading(false)
    }
  }

  const fetchWeeklyPatterns = async () => {
    try {
      setWeeklyPatternsLoading(true)
      const patterns = await getWeeklyPatterns()
      const list = Array.isArray(patterns)
        ? patterns
        : Array.isArray(patterns.results)
        ? patterns.results
        : []
      setWeeklyPatterns(list)
    } catch (error) {
      showSnack({ tone: 'danger', title: 'Error', message: 'Failed to load weekly patterns' })
    } finally {
      setWeeklyPatternsLoading(false)
    }
  }

  const openWeeklyDialog = (pattern = null) => {
    setEditingPattern(pattern)
    setWeeklyDialogErrors({})
    setWeeklyDialogOpen(true)
  }

  const closeWeeklyDialog = () => {
    setWeeklyDialogOpen(false)
    setEditingPattern(null)
    setWeeklyDialogErrors({})
  }

  const handleWeeklySubmit = async (form) => {
    try {
      const payload = {
        day_of_week: Number(form.day_of_week),
        is_available: form.is_available === false || form.is_available === 'false' ? false : true,
        reason_unavailable: form.reason?.trim() || null,
      }

      if (editingPattern?.id) {
        await updateWeeklyPattern(editingPattern.id, payload)
        showSnack({ tone: 'success', title: 'Updated', message: 'Weekly availability pattern updated' })
      } else {
        await createWeeklyPattern(payload)
        showSnack({ tone: 'success', title: 'Created', message: 'Weekly availability pattern created' })
      }

      closeWeeklyDialog()
      await fetchWeeklyPatterns()
      await fetchSlots(selectedDate)
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to save weekly pattern'
      setWeeklyDialogErrors(error.response?.data || {})
      showSnack({ tone: 'danger', title: 'Error', message })
      throw error
    }
  }

  const handleDeleteWeeklyPattern = async (id) => {
    try {
      await deleteWeeklyPattern(id)
      showSnack({ tone: 'success', title: 'Deleted', message: 'Weekly availability pattern removed' })
      await fetchWeeklyPatterns()
      await fetchSlots(selectedDate)
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete weekly pattern'
      showSnack({ tone: 'danger', title: 'Error', message })
    }
  }

  const openSlotDialog = (slot) => {
    setSelectedSlot(slot)
    setSlotDialogOpen(true)
  }

  const closeSlotDialog = () => {
    setSlotDialogOpen(false)
    setSelectedSlot(null)
    setSlotActionLoading(false)
  }

  // Unified handler for both disabling and enabling slots
  const handleSlotToggle = async (form, isDisabling) => {
    try {
      setSlotActionLoading(true)
      
      const payload = {
        date: selectedDate,
        start_time: convertTo24Hour(selectedSlot.start),
        end_time: convertTo24Hour(selectedSlot.end),
        is_available: !isDisabling, // If disabling -> false, if enabling -> true
        reason: isDisabling ? (form.reason?.trim() || null) : null // Make reason optional
      }

      if (isDisabling) {
        // Use POST to create a new disable override
        await disableTimeSlot(payload)
        showSnack({ tone: 'success', title: 'Success', message: 'Time slot disabled successfully' })
      } else {
        // Use PATCH to update/enable the slot
        await updateSlotAvailability(payload)
        showSnack({ tone: 'success', title: 'Success', message: 'Time slot enabled successfully' })
      }
      
      closeSlotDialog()
      // Immediately refresh slots to show updated status
      await fetchSlots(selectedDate)
    } catch (error) {
      const message = error.response?.data?.message || error.message || 
        (isDisabling ? 'Failed to disable time slot' : 'Failed to enable time slot')
      showSnack({ tone: 'danger', title: 'Error', message })
      throw error
    } finally {
      setSlotActionLoading(false)
    }
  }

  const handleDisableSlot = async (form) => {
    return handleSlotToggle(form, true)
  }

  const handleEnableSlot = async (form) => {
    return handleSlotToggle(form, false)
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
    fetchSlots(date)
  }

  const handleConfigUpdate = async () => {
    try {
      setConfigLoading(true)
      setConfigErrors({})
      
      // Validate configuration
      const errors = {}
      if (!config.slot_interval_minutes || config.slot_interval_minutes <= 0) {
        errors.slot_interval_minutes = 'Slot interval must be greater than 0'
      }
      if (!config.start_time) {
        errors.start_time = 'Start time is required'
      }
      if (!config.end_time) {
        errors.end_time = 'End time is required'
      }
      if (config.cooldown_minutes !== undefined && config.cooldown_minutes < 0) {
        errors.cooldown_minutes = 'Cooldown minutes must be 0 or greater'
      }
      
      if (Object.keys(errors).length > 0) {
        setConfigErrors(errors)
        return
      }
      
      const updatedConfig = await updateTimeSlotConfiguration({
        slot_interval_minutes: parseInt(config.slot_interval_minutes),
        start_time: config.start_time,
        end_time: config.end_time,
        cooldown_minutes: config.cooldown_minutes ? parseInt(config.cooldown_minutes) : 0
      })
      
      setConfig(updatedConfig)
      showSnack({ tone: 'success', title: 'Success', message: 'Configuration updated successfully' })
      
      // Immediately refresh slots after config update
      await fetchSlots(selectedDate, updatedConfig.slot_interval_minutes)
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update configuration'
      showSnack({ tone: 'danger', title: 'Error', message: errorMessage })
    } finally {
      setConfigLoading(false)
    }
  }

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }))
    if (configErrors[field]) {
      setConfigErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-slate-500">Loading time slot configuration...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <Card
        title="Global Configuration"
        subtitle="Manage slot intervals, working hours, and booking cooldown"
        accent="blue"
        icon={<Settings className="h-5 w-5" />}
        right={
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfigUpdate}
            disabled={configLoading}
          >
            <Save className="h-4 w-4" />
            {configLoading ? 'Saving...' : 'Save Configuration'}
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Slot Interval (minutes) *
            </label>
            <input
              type="number"
              value={config.slot_interval_minutes}
              onChange={(e) => handleConfigChange('slot_interval_minutes', e.target.value)}
              className={`w-full h-10 rounded-md border bg-white px-3 text-sm focus:outline-none focus:ring-2 ${
                configErrors.slot_interval_minutes
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-cyan-500'
              }`}
              placeholder="60"
              min="1"
            />
            {configErrors.slot_interval_minutes && (
              <p className="mt-1 text-sm text-red-600">{configErrors.slot_interval_minutes}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              value={config.start_time}
              onChange={(e) => handleConfigChange('start_time', e.target.value)}
              className={`w-full h-10 rounded-md border bg-white px-3 text-sm focus:outline-none focus:ring-2 ${
                configErrors.start_time
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-cyan-500'
              }`}
            />
            {configErrors.start_time && (
              <p className="mt-1 text-sm text-red-600">{configErrors.start_time}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              End Time *
            </label>
            <input
              type="time"
              value={config.end_time}
              onChange={(e) => handleConfigChange('end_time', e.target.value)}
              className={`w-full h-10 rounded-md border bg-white px-3 text-sm focus:outline-none focus:ring-2 ${
                configErrors.end_time
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-cyan-500'
              }`}
            />
            {configErrors.end_time && (
              <p className="mt-1 text-sm text-red-600">{configErrors.end_time}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cooldown (minutes)
            </label>
            <input
              type="number"
              value={config.cooldown_minutes}
              onChange={(e) => handleConfigChange('cooldown_minutes', e.target.value)}
              className={`w-full h-10 rounded-md border bg-white px-3 text-sm focus:outline-none focus:ring-2 ${
                configErrors.cooldown_minutes
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-cyan-500'
              }`}
              placeholder="60"
              min="0"
            />
            {configErrors.cooldown_minutes && (
              <p className="mt-1 text-sm text-red-600">{configErrors.cooldown_minutes}</p>
            )}
          </div>
        </div>
        
        {config.updated_at && (
          <div className="mt-4 text-xs text-slate-500">
            Last updated: {new Date(config.updated_at).toLocaleString()}
          </div>
        )}
      </Card>

      {/* Pills/Tabs Navigation */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('slots')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
            activeTab === 'slots'
              ? 'bg-cyan-50 text-cyan-700 border-b-2 border-cyan-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Time Slots
        </button>
        <button
          onClick={() => setActiveTab('patterns')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
            activeTab === 'patterns'
              ? 'bg-cyan-50 text-cyan-700 border-b-2 border-cyan-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Weekly Patterns
        </button>
      </div>

      {/* Time Slots Tab Content */}
      {activeTab === 'slots' && (
        <Card
          title="Generated Time Slots"
          subtitle={`Available slots for ${formatDate(slots.date || selectedDate)}`}
          accent="green"
        >
          <div className="space-y-4">
            {/* Date Selector */}
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Date
                </label>
                <CustomDatePicker
                  value={selectedDate}
                  onChange={(value) => handleDateChange(value)}
                  placeholder="dd/mm/yyyy"
                  className="w-full"
                />
              </div>
            </div>

            {/* Slots Grid */}
            {slotsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-slate-500">Loading time slots...</div>
              </div>
            ) : slots.slots?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Clock className="h-12 w-12 text-slate-300 mb-3" />
                <div className="text-sm text-slate-500">No time slots available for this date</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {slots.slots.map((slot, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      slot.is_available
                        ? 'border-green-200 bg-green-50 hover:bg-green-100'
                        : 'border-red-200 bg-red-50 opacity-60'
                    }`}
                  >
                    <div className="text-sm font-medium text-slate-900">
                      {convertTo12Hour(slot.start)}
                    </div>
                    <div className="text-xs text-slate-600">
                      {convertTo12Hour(slot.end)}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          slot.is_available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {slot.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    {!slot.is_available && (slot.reason_unavailable || slot.reason) && (
                      <div className="mt-2 text-xs text-slate-500">
                        {slot.reason_unavailable || slot.reason}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openSlotDialog(slot)}
                      className={`mt-2 w-full text-xs ${
                        slot.is_available 
                          ? 'text-red-600 hover:text-red-700' 
                          : 'text-green-600 hover:text-green-700'
                      }`}
                    >
                      {slot.is_available ? (
                        <>
                          <Ban className="h-3 w-3 mr-1" />
                          Disable
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Enable
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Weekly Patterns Tab Content */}
      {activeTab === 'patterns' && (
        <Card
          title="Weekly Availability Patterns"
          subtitle="Set recurring availability rules for each weekday"
          accent="cyan"
          right={
            <Button
              variant="primary"
              size="sm"
              onClick={() => openWeeklyDialog(null)}
            >
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          }
        >
          {weeklyPatternsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-slate-500">Loading weekly patterns...</div>
            </div>
          ) : weeklyPatterns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-sm text-slate-500">No weekly availability rules configured yet.</div>
              <div className="mt-2 text-xs text-slate-400">Create a rule to mark a weekday available or unavailable.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {weeklyPatterns.map((pattern) => (
                <div key={pattern.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{WEEKDAY_LABELS[pattern.day_of_week]}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      {pattern.is_available ? 'Available' : 'Unavailable'}
                    </div>
                    {(pattern.reason_unavailable || pattern.reason) && (
                      <div className="mt-2 text-xs text-slate-500">{pattern.reason_unavailable || pattern.reason}</div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openWeeklyDialog(pattern)}
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteWeeklyPattern(pattern.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snack.open}
        tone={snack.tone}
        title={snack.title}
        message={snack.message}
        onClose={() => setSnack({ open: false, tone: 'info', title: '', message: '' })}
      />

      {/* Weekly Pattern Dialog */}
      <ReasonDialog
        open={weeklyDialogOpen}
        title={editingPattern ? 'Edit Weekly Pattern' : 'Add Weekly Pattern'}
        description="Create or update a recurring weekday availability rule."
        submitLabel={editingPattern ? 'Update' : 'Create'}
        onClose={closeWeeklyDialog}
        showReason={false}
        requireReason={false}
        fields={[
          {
            name: 'day_of_week',
            label: 'Weekday *',
            type: 'select',
            defaultValue: editingPattern?.day_of_week ?? '',
            options: WEEKDAY_LABELS.map((label, index) => ({ value: index, label })),
          },
          {
            name: 'is_available',
            label: 'Availability *',
            type: 'select',
            defaultValue: editingPattern?.is_available ?? true,
            options: [
              { value: true, label: 'Available' },
              { value: false, label: 'Unavailable' },
            ],
          },
          {
            name: 'reason',
            label: 'Reason',
            type: 'textarea',
            rows: 3,
            defaultValue: editingPattern?.reason_unavailable || editingPattern?.reason || '',
            placeholder: 'Enter a reason (optional)',
          },
        ]}
        fieldErrors={weeklyDialogErrors}
        onSubmit={handleWeeklySubmit}
      />

      {/* Slot Action Dialog - Dynamic for both Disable and Enable */}
      <ReasonDialog
        open={slotDialogOpen}
        title={selectedSlot?.is_available ? "Disable Time Slot" : "Enable Time Slot"}
        description={
          selectedSlot?.is_available
            ? `Disable slot from ${selectedSlot ? convertTo12Hour(selectedSlot.start) : ''} to ${selectedSlot ? convertTo12Hour(selectedSlot.end) : ''} on ${formatDate(selectedDate)}`
            : `Enable slot from ${selectedSlot ? convertTo12Hour(selectedSlot.start) : ''} to ${selectedSlot ? convertTo12Hour(selectedSlot.end) : ''} on ${formatDate(selectedDate)}`
        }
        submitLabel={selectedSlot?.is_available ? "Disable Slot" : "Enable Slot"}
        onClose={closeSlotDialog}
        showReason={selectedSlot?.is_available ?? false}
        requireReason={false}
        reasonLabel="Reason"
        fields={[]}
        fieldErrors={{}}
        onSubmit={selectedSlot?.is_available ? handleDisableSlot : handleEnableSlot}
        isLoading={slotActionLoading}
      />
    </div>
  )
}