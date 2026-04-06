import api from '../api'

export async function getBanners() {
  try {
    const response = await api.get('api/banners/')
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to fetch banners'
  }
}

export async function getBanner(id) {
  try {
    const response = await api.get(`api/banners/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to fetch banner'
  }
}

export async function createBanner(formData) {
  try {
    const response = await api.post('api/banners/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to create banner'
  }
}

export async function updateBanner(id, formData) {
  try {
    const response = await api.patch(`api/banners/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to update banner'
  }
}

export async function patchBanner(id, formData) {
  try {
    const response = await api.patch(`api/banners/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to update banner'
  }
}

export async function deleteBanner(id) {
  try {
    const response = await api.delete(`api/banners/${id}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to delete banner'
  }
}
