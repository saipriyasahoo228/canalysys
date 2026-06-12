import api from '../api'

export async function getTimeSlotConfigurations() {
  try {
    const response = await api.get('/api/config/')
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to fetch configuration'
  }
}

export async function updateTimeSlotConfiguration(data) {
  try {
    const response = await api.patch('/api/config/', data)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to update configuration'
  }
}

export async function getSlots(date = null, interval = null) {
  try {
    const params = {}
    if (date) params.date = date
    if (interval !== null && interval !== undefined) params.interval_minutes = interval

    const response = await api.get('/api/slots/', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to fetch time slots'
  }
}

export async function getPDIAvailableSlots(date) {
  try {
    if (!date) {
      throw new Error('Date parameter is required')
    }

    const response = await api.get('/api/pdi-slots/available-times/', {
      params: { date }
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to fetch PDI available slots'
  }
}

export async function getWeeklyPatterns() {
  try {
    const response = await api.get('/api/slot-availability-patterns/')
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to fetch weekly patterns'
  }
}

export async function updateWeeklyPattern(id, data) {
  try {
    const response = await api.patch(`/api/slot-availability-patterns/${id}/`, data)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to update weekly pattern'
  }
}

export async function deleteWeeklyPattern(id) {
  try {
    const response = await api.delete(`/api/slot-availability-patterns/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to delete weekly pattern'
  }
}

// Create a weekly pattern (mark a day as available/unavailable)
export async function createWeeklyPattern(data) {
  try {
    const response = await api.post('/api/slot-availability-patterns/', data)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to create weekly pattern'
  }
}

// Disable a specific time slot (mark as unavailable)
export async function disableTimeSlot(data) {
  try {
    const response = await api.post('/api/pdi-slots/slot-availability/', data)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to disable time slot'
  }
}

// Update the API function to not require an ID
export async function updateSlotAvailability(updateData) {
  try {
    const response = await api.patch('/api/pdi-slots/slot-availability/', updateData)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to update slot availability'
  }
}