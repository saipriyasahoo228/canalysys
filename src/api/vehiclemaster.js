import api from '../api'

export const listBrands = async (page = 1) => {
  try {
    const response = await api.get('/api/brands/', { params: { page } })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const listModels = async ({ page = 1, brand_id } = {}) => {
  try {
    const params = { page }
    if (brand_id !== undefined && brand_id !== null && String(brand_id).trim()) params.brand_id = brand_id
    const response = await api.get('/api/models/', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const listVariants = async ({ page = 1, model_id } = {}) => {
  try {
    const params = { page }
    if (model_id !== undefined && model_id !== null && String(model_id).trim()) params.model_id = model_id
    const response = await api.get('/api/variants/', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const createBrand = async (payload) => {
  try {
    const response = await api.post('/api/brands/', payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const createModel = async (payload) => {
  try {
    const response = await api.post('/api/models/', payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const createVariant = async (payload) => {
  try {
    const response = await api.post('/api/variants/', payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const retrieveBrand = async (id) => {
  try {
    const response = await api.get(`/api/brands/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const retrieveModel = async (id) => {
  try {
    const response = await api.get(`/api/models/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const retrieveVariant = async (id) => {
  try {
    const response = await api.get(`/api/variants/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updateBrand = async (id, payload) => {
  try {
    const response = await api.put(`/api/brands/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updateModel = async (id, payload) => {
  try {
    const response = await api.put(`/api/models/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updateVariant = async (id, payload) => {
  try {
    const response = await api.put(`/api/variants/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const patchBrand = async (id, payload) => {
  try {
    const response = await api.patch(`/api/brands/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const patchModel = async (id, payload) => {
  try {
    const response = await api.patch(`/api/models/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const patchVariant = async (id, payload) => {
  try {
    const response = await api.patch(`/api/variants/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteBrand = async (id) => {
  try {
    const response = await api.delete(`/api/brands/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteModel = async (id) => {
  try {
    const response = await api.delete(`/api/models/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteVariant = async (id) => {
  try {
    const response = await api.delete(`/api/variants/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

// Category Types API
export const listCategoryTypes = async (page = 1) => {
  try {
    const response = await api.get('/api/categories/types/', { params: { page } })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const createCategoryType = async (payload) => {
  try {
    const response = await api.post('/api/categories/types/', payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getCategoryType = async (id) => {
  try {
    const response = await api.get(`/api/categories/types/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updateCategoryType = async (id, payload) => {
  try {
    const response = await api.put(`/api/categories/types/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const patchCategoryType = async (id, payload) => {
  try {
    const response = await api.patch(`/api/categories/types/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteCategoryType = async (id) => {
  try {
    const response = await api.delete(`/api/categories/types/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

// Category Values API
export const listCategoryValues = async ({ page = 1, category_type_id } = {}) => {
  try {
    const params = { page }
    if (category_type_id !== undefined && category_type_id !== null && String(category_type_id).trim()) params.category_type_id = category_type_id
    const response = await api.get('/api/categories/values/', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const createCategoryValue = async (payload) => {
  try {
    const response = await api.post('/api/categories/values/', payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getCategoryValue = async (id) => {
  try {
    const response = await api.get(`/api/categories/values/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updateCategoryValue = async (id, payload) => {
  try {
    const response = await api.put(`/api/categories/values/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const patchCategoryValue = async (id, payload) => {
  try {
    const response = await api.patch(`/api/categories/values/${id}/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteCategoryValue = async (id) => {
  try {
    const response = await api.delete(`/api/categories/values/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}