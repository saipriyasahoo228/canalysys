import api from '../api'

// Get payment stages dashboard data
export const getPaymentStages = async (params = {}) => {
  try {
    const response = await api.get('/api/dashboard/payment-stages/', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

// Get vehicle types dashboard data
export const getVehicleTypes = async (params = {}) => {
  try {
    const response = await api.get('/api/dashboard/vehicle-types/', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

// Get vehicle brands dashboard data
export const getVehicleBrands = async (params = {}) => {
  try {
    const response = await api.get('/api/dashboard/vehicle-brands/', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}