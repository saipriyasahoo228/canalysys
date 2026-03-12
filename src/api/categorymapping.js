import api from '../api'

export const createVehicleCategoryMapping = async (payload) => {
  try {
    const response = await api.post('/api/vehicle-category-mappings/', payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const listVehicleCategoryMappings = async (page = 1) => {
  try {
    const response = await api.get('/api/vehicle-category-mappings/', { params: { page } })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getVehicleCategoryMapping = async (id) => {
  try {
    const response = await api.get(`/api/vehicle-category-mappings/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updateVehicleCategoryMapping = async (id, payload) => {
  try {
    const response = await api.put(`/api/vehicle-category-mappings/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteVehicleCategoryMapping = async (id) => {
  try {
    const response = await api.delete(`/api/vehicle-category-mappings/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}
