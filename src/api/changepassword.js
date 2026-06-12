import api from '../api'

export async function changePassword(formData) {
  try {
    const response = await api.post('api/auth/change-password/', formData)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to change password'
  }
}


// 1. Request OTP for resetting inspector password
export async function requestResetInspectorPassword(inspectorId, formData) {
  try {
    const response = await api.post(
      `api/admin/inspectors/${inspectorId}/reset-password/request/`,
      formData
    )
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to request password reset'
  }
}

// 2. Verify OTP for inspector password reset
export async function verifyResetInspectorPasswordOTP(inspectorId, formData) {
  try {
    const response = await api.post(
      `api/admin/inspectors/${inspectorId}/reset-password/verify-otp/`,
      formData
    )
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to verify OTP'
  }
}

// 3. Confirm and reset inspector password
export async function confirmResetInspectorPassword(inspectorId, formData) {
  try {
    const response = await api.post(
      `api/admin/inspectors/${inspectorId}/reset-password/confirm/`,
      formData
    )
    return response.data
  } catch (error) {
    throw error.response?.data || error.message || 'Failed to reset password'
  }
}