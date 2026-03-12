import api from '../api'

export const listCategoryPricing = async (params = {}) => {
  try {
    const response = await api.get('/api/category-pricing/', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const createCategoryPricing = async (payload) => {
  try {
    const response = await api.post('/api/category-pricing/', payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const retrieveCategoryPricing = async (id) => {
  try {
    const response = await api.get(`/api/category-pricing/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updateCategoryPricing = async (id, payload) => {
  try {
    const response = await api.put(`/api/category-pricing/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const patchCategoryPricing = async (id, payload) => {
  try {
    const response = await api.patch(`/api/category-pricing/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteCategoryPricing = async (id) => {
  try {
    const response = await api.delete(`/api/category-pricing/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}
