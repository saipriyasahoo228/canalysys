import api from '../api'

export const listCustomers = async (params = {}) => {
  try {
    const response = await api.get('/api/customers/', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const createCustomer = async (payload) => {
  try {
    const response = await api.post('/api/customers/', payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const retrieveCustomer = async (id) => {
  try {
    const response = await api.get(`/api/customers/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updateCustomer = async (id, payload) => {
  try {
    const response = await api.put(`/api/customers/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const patchCustomer = async (id, payload) => {
  try {
    const response = await api.patch(`/api/customers/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteCustomer = async (id) => {
  try {
    const response = await api.delete(`/api/customers/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getCustomerBookings = async (customerId) => {
  try {
    const response = await api.get(`/api/customers/${customerId}/bookings/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}
