import api from '../api'

export const getAvailabilities = async (params = {}) => {
  try {
    const response = await api.get('/api/availabilities/', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getAvailabilityById = async (id) => {
  try {
    const response = await api.get(`/api/availabilities/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const createAvailability = async (payload) => {
  try { 
    const response = await api.post('/api/availabilities/bulk/create/', payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updateAvailability = async (id, payload) => {
  try {
    const response = await api.put(`/api/availabilities/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updateAvailabilityStatus = async (id, status, remarks = null) => {
  try {
    const payload = { availability_status: status }
    if (remarks !== null) payload.remarks = remarks
    const response = await api.patch(`/api/availabilities/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const patchAvailability = async (id, payload) => {
  try {
    const response = await api.patch(`/api/availabilities/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteAvailability = async (id) => {
  try {
    const response = await api.delete(`/api/availabilities/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getInspectorAvailability = async (inspectorId) => {
  try {
    const response = await api.get(`/api/availability/${inspectorId}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getInspectorAvailabilityByDate = async (date = null) => {
  try {
    const params = date ? { date } : {}
    const response = await api.get('/api/staff/inspectors/availability/status/', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}
