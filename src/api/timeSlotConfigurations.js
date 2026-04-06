import api from '../api'

export async function getTimeSlotConfigurations() {
  try {
    const response = await api.get('api/config/')
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to fetch configuration'
  }
}

export async function updateTimeSlotConfiguration(data) {
  try {
    const response = await api.patch('api/config/', data)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to update configuration'
  }
}

export async function getSlots(date = null) {
  try {
    const params = new URLSearchParams()
    if (date) params.append('date', date)
    
    const url = `api/slots/${params.toString() ? '?' + params.toString() : ''}`
    console.log('🌐 API Call - URL:', url)
    console.log('🌐 API Call - Params:', { date })
    
    const response = await api.get(url)
    console.log('🌐 API Response:', response.data)
    return response.data
  } catch (error) {
    console.error('🌐 API Error:', error)
    throw error.response?.data || error.message || 'Failed to fetch time slots'
  }
}

export async function getPDIAvailableSlots(date) {
  try {
    if (!date) {
      throw new Error('Date parameter is required')
    }
    
    const url = `api/pdi-slots/available-times/?date=${date}`
    console.log('🌐 PDI Slots API Call - URL:', url)
    console.log('🌐 PDI Slots API Call - Params:', { date })
    
    const response = await api.get(url)
    console.log('🌐 PDI Slots API Response:', response.data)
    return response.data
  } catch (error) {
    console.error('🌐 PDI Slots API Error:', error)
    throw error.response?.data || error.message || 'Failed to fetch PDI available slots'
  }
}
