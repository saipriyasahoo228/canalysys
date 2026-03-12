import api from '../api'

export const listLocations = async (params = {}) => {
  try {
    const response = await api.get('/api/locations/', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const createLocation = async (payload) => {
  try {
    const response = await api.post('/api/locations/', payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const retrieveLocation = async (id) => {
  try {
    const response = await api.get(`/api/locations/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updateLocation = async (id, payload) => {
  try {
    const response = await api.put(`/api/locations/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const patchLocation = async (id, payload) => {
  try {
    const response = await api.patch(`/api/locations/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteLocation = async (id) => {
  try {
    const response = await api.delete(`/api/locations/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}
