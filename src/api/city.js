import api from '../api'

export const listDistricts = async (params = {}) => {
  try {
    const response = await api.get('/api/districts/', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const createDistrict = async (payload) => {
  try {
    const response = await api.post('/api/districts/', payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const retrieveDistrict = async (id) => {
  try {
    const response = await api.get(`/api/districts/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updateDistrict = async (id, payload) => {
  try {
    const response = await api.put(`/api/districts/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const patchDistrict = async (id, payload) => {
  try {
    const response = await api.patch(`/api/districts/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteDistrict = async (id) => {
  try {
    const response = await api.delete(`/api/districts/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const listCities = async (params = {}) => {
  try {
    const response = await api.get('/api/cities/', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const createCities = async (payload) => {
  try {
    const response = await api.post('/api/cities/', payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const retrieveCity = async (id) => {
  try {
    const response = await api.get(`/api/cities/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updateCity = async (id, payload) => {
  try {
    const response = await api.put(`/api/cities/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const patchCity = async (id, payload) => {
  try {
    const response = await api.patch(`/api/cities/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteCity = async (id) => {
  try {
    const response = await api.delete(`/api/cities/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}
