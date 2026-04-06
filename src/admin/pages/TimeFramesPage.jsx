import { useState, useEffect, useMemo } from 'react'
import { Clock, Plus, Edit2, Trash2, Search, Settings, Save } from 'lucide-react'
import { Card, Badge, Button, cx } from '../ui/Ui'
import { ReasonDialog } from '../ui/ReasonDialog'
import { Snackbar } from '../ui/Snackbar'
import { 
  getTimeSlotConfigurations, 
  updateTimeSlotConfiguration,
  getSlots
} from '../../api/timeSlotConfigurations'

export function TimeFramesPage() {
  const [config, setConfig] = useState({
    slot_interval_minutes: 60,
    start_time: '09:00:00',
    end_time: '17:00:00'
  })
  const [slots, setSlots] = useState({
    date: '',
    interval_minutes: 60,
    slots: []
  })
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)
  const [configErrors, setConfigErrors] = useState({})
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [snack, setSnack] = useState({ open: false, tone: 'info', title: '', message: '' })

  // Auto-refresh interval (30 seconds)
  const AUTO_REFRESH_INTERVAL = 30000

  const showSnack = (next) => {
    setSnack({ open: true, tone: next?.tone || 'info', title: next?.title || '', message: next?.message || '' })
  }

  useEffect(() => {
    // Fetch configuration from API
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await getTimeSlotConfigurations()
        setConfig(data)
        
        // Fetch slots for today
        await fetchSlots(selectedDate)
      } catch (error) {
        showSnack({ tone: 'danger', title: 'Error', message: 'Failed to load configuration' })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Auto-refresh slots
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSlots(selectedDate)
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [selectedDate])

  const fetchSlots = async (date, interval = null) => {
    try {
      setSlotsLoading(true)
      const slotsData = await getSlots(date, interval)
      setSlots(slotsData)
    } catch (error) {
      showSnack({ tone: 'danger', title: 'Error', message: 'Failed to load time slots' })
    } finally {
      setSlotsLoading(false)
    }
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
      
      if (Object.keys(errors).length > 0) {
        setConfigErrors(errors)
        return
      }
      
      const updatedConfig = await updateTimeSlotConfiguration({
        slot_interval_minutes: parseInt(config.slot_interval_minutes),
        start_time: config.start_time,
        end_time: config.end_time
      })
      
      setConfig(updatedConfig)
      showSnack({ tone: 'success', title: 'Success', message: 'Configuration updated successfully' })
      
      // Immediately refresh slots after config update
      await fetchSlots(selectedDate)
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

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <Card
        title="Global Configuration"
        subtitle="Manage slot intervals and working hours"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>
        
        {config.updated_at && (
          <div className="mt-4 text-xs text-slate-500">
            Last updated: {new Date(config.updated_at).toLocaleString()}
          </div>
        )}
      </Card>

      {/* Time Slots Display */}
      <Card
        title="Generated Time Slots"
        subtitle={`Available slots for ${slots.date || selectedDate}`}
        accent="green"
      >
        <div className="space-y-4">
          {/* Date Selector */}
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            
            <div className="text-sm text-slate-600">
              <div>Interval: <span className="font-medium">{slots.interval_minutes} minutes</span></div>
              <div>Total Slots: <span className="font-medium">{slots.slots?.length || 0}</span></div>
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
                    {slot.start}
                  </div>
                  <div className="text-xs text-slate-600">
                    {slot.end}
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        slot.is_available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {slot.is_available ? 'Available' : 'Booked'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snack.open}
        tone={snack.tone}
        title={snack.title}
        message={snack.message}
        onClose={() => setSnack({ open: false, tone: 'info', title: '', message: '' })}
      />
    </div>
  )
}
