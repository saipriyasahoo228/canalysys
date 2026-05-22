import api from '../api'

export async function changePassword(formData) {
  try {
    const response = await api.post('api/auth/change-password/', formData)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to change password'
  }
}