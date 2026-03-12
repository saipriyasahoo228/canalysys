import api from '../api';

//register a new inspector

export const registerInspector = async ({ name, email, mobile_number, password, role } = {}) => {
  try {
    const payload = {
      name: String(name || '').trim(),
      password: String(password || ''),
      role: String(role || '').trim() || 'Inspector',
    }

    const em = String(email || '').trim()
    const mn = String(mobile_number || '').trim()
    if (em) payload.email = em
    if (mn) payload.mobile_number = mn

    console.log('Register payload:', payload)
    const response = await api.post('/api/auth/register/', payload)
    console.log('Register response:', response.data)
    return response.data
  } catch (error) {
    console.error('Register error:', error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

export const verifyEmailLink = async (token) => {
  try {
    const t = String(token || '').trim()
    const response = await api.get('/api/auth/verify-email/', { params: { token: t } })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const verifyEmailOtp = async ({ email, email_otp } = {}) => {
  try {
    const payload = {
      email: String(email || '').trim(),
      email_otp: String(email_otp || '').trim(),
    }
    console.log('Verify Email OTP payload:', payload)
    const response = await api.post('/api/auth/verify-email-otp/', payload)
    console.log('Verify Email OTP response:', response.data)
    return response.data
  } catch (error) {
    console.error('Verify Email OTP error:', error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

export const verifySmsOtp = async ({ mobile_number, sms_otp } = {}) => {
  try {
    const payload = {
      mobile_number: String(mobile_number || '').trim(),
      sms_otp: String(sms_otp || '').trim(),
    }
    console.log('Verify SMS OTP payload:', payload)
    const response = await api.post('/api/auth/verify-sms-otp/', payload)
    console.log('Verify SMS OTP response:', response.data)
    return response.data
  } catch (error) {
    console.error('Verify SMS OTP error:', error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

export const resendOtp = async ({ mobile_number, email } = {}) => {
  try {
    const payload = {}
    const em = String(email || '').trim()
    const mn = String(mobile_number || '').trim()
    if (em) payload.email = em
    if (mn) payload.mobile_number = mn
    console.log('Resend OTP payload:', payload)
    const response = await api.post('/api/auth/resend-otp/', payload)
    console.log('Resend OTP response:', response.data)
    return response.data
  } catch (error) {
    console.error('Resend OTP error:', error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

export const passwordResetRequestOtp = async ({ email, mobile_number } = {}) => {
  try {
    const payload = {}
    const em = String(email || '').trim()
    const mn = String(mobile_number || '').trim()
    if (em) payload.email = em
    if (mn) payload.mobile_number = mn
    const response = await api.post('/api/auth/password-reset/request-otp/', payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const passwordResetVerifyOtp = async ({ identifier, otp } = {}) => {
  try {
    const response = await api.post('/api/auth/password-reset/verify-otp/', {
      identifier: String(identifier || '').trim(),
      otp: String(otp || '').trim(),
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const passwordResetConfirm = async ({ identifier, new_password } = {}) => {
  try {
    const response = await api.post('/api/auth/password-reset/confirm/', {
      identifier: String(identifier || '').trim(),
      new_password: String(new_password || ''),
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const changePassword = async ({ current_password, new_password } = {}) => {
  try {
    const payload = {
      current_password: String(current_password || ''),
      new_password: String(new_password || ''),
    }
    console.log('Change password payload:', payload)
    const response = await api.post('/api/auth/change-password/', payload)
    console.log('Change password response:', response.data)
    return response.data
  } catch (error) {
    console.error('Change password error:', error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

export const listInspectors = async ({ page = 1, locationId } = {}) => {
  try {
    const params = { page }
    if (locationId !== undefined && locationId !== null && String(locationId).trim()) params.locationId = String(locationId).trim()
    const response = await api.get('/api/auth/register/', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deleteAccount = async ({ password } = {}) => {
  try {
    const payload = {
      password: String(password || ''),
    }
    console.log('Delete account payload:', payload)
    const response = await api.post('/api/auth/delete-account/', payload)
    console.log('Delete account response:', response.data)
    return response.data
  } catch (error) {
    console.error('Delete account error:', error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

export const createInspectorProfile = async ({ inspector_id, date_of_joining, employment_type, status, profile_photo } = {}) => {
  try {
    let response
    
    if (profile_photo instanceof File) {
      // For file upload, use FormData
      const formData = new FormData()
      formData.append('inspector_id', String(inspector_id || '').trim())
      formData.append('date_of_joining', String(date_of_joining || '').trim())
      formData.append('employment_type', String(employment_type || '').trim())
      formData.append('status', String(status || '').trim())
      formData.append('profile_photo', profile_photo)
      
      console.log('Create inspector profile with FormData:', Object.fromEntries(formData.entries()))
      response = await api.post('/api/inspectors/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    } else {
      // For JSON-only fields
      const payload = {
        inspector_id: String(inspector_id || '').trim(),
        date_of_joining: String(date_of_joining || '').trim(),
        employment_type: String(employment_type || '').trim(),
        status: String(status || '').trim(),
      }
      console.log('Create inspector profile payload:', payload)
      response = await api.post('/api/inspectors/', payload)
    }
    
    console.log('Create inspector profile response:', response.data)
    return response.data
  } catch (error) {
    console.error('Create inspector profile error:', error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

export const getInspectorProfile = async ({ inspector_id } = {}) => {
  try {
    const response = await api.get(`/api/inspectors/${String(inspector_id || '').trim()}/`)
    console.log('Get inspector profile response:', response.data)
    return response.data
  } catch (error) {
    console.error('Get inspector profile error:', error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}

export const updateInspectorProfile = async ({ inspector_id, profile_photo, date_of_joining, employment_type, status } = {}) => {
  try {
    let response
    
    if (profile_photo instanceof File) {
      // For file upload, use FormData
      const formData = new FormData()
      formData.append('inspector_id', String(inspector_id || '').trim())
      formData.append('date_of_joining', String(date_of_joining || '').trim())
      formData.append('employment_type', String(employment_type || '').trim())
      formData.append('status', String(status || '').trim())
      formData.append('profile_photo', profile_photo)
      
      console.log('Update inspector profile with FormData:', Object.fromEntries(formData.entries()))
      response = await api.patch(`/api/inspectors/${String(inspector_id || '').trim()}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    } else {
      // For JSON-only fields
      const payload = {}
      if (profile_photo !== undefined) payload.profile_photo = profile_photo
      if (date_of_joining !== undefined) payload.date_of_joining = String(date_of_joining || '').trim()
      if (employment_type !== undefined) payload.employment_type = String(employment_type || '').trim()
      if (status !== undefined) payload.status = String(status || '').trim()
      console.log('Update inspector profile payload:', payload)
      response = await api.patch(`/api/inspectors/${String(inspector_id || '').trim()}/`, payload)
    }
    
    console.log('Update inspector profile response:', response.data)
    return response.data
  } catch (error) {
    console.error('Update inspector profile error:', error.response?.data || error.message)
    throw error.response?.data || error.message
  }
}