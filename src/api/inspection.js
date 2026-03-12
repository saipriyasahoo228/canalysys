import api from '../api'

export const createPDIRequest = async (data) => {
  try {
    const response = await api.post('/api/pdi-requests/', data)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const listPDIRequests = async (params = {}) => {
  try {
    const response = await api.get('/api/pdi-requests/', { params })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getPDIRequestById = async (requestId) => {
  try {
    const response = await api.get(`/api/pdi-requests/${requestId}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const assignInspector = async (requestId, payload) => {
  try {
    const response = await api.post(`/api/pdi-requests/${requestId}/assign/`, payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const createRazorpayOrder = async (requestId, clientRequestId, purpose = 'advance') => {
  try {
    const response = await api.post(`/api/pdi-requests/${requestId}/payments/razorpay/order/?purpose=${purpose}`, {
      client_request_id: clientRequestId
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const verifyRazorpayPayment = async (requestId, razorpayOrderId, razorpayPaymentId, razorpaySignature, clientRequestId) => {
  try {
    const response = await api.post(`/api/pdi-requests/${requestId}/payments/razorpay/verify/`, {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      client_request_id: clientRequestId
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const confirmManualPayment = async (requestId, manualPaymentMode, manualReferenceNo, purpose = 'advance') => {
  try {
    const response = await api.post(`/api/pdi-requests/${requestId}/payments/manual/confirm/?purpose=${purpose}`, {
      manual_payment_mode: manualPaymentMode,
      manual_reference_no: manualReferenceNo
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const createRazorpayOrderForRemaining = async (requestId, clientRequestId) => {
  try {
    const response = await api.post(`/api/pdi-requests/${requestId}/payments/razorpay/order/?purpose=remaining`, {
      client_request_id: clientRequestId
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const verifyRazorpayRemainingPayment = async (requestId, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const response = await api.post(`/api/pdi-requests/${requestId}/payments/razorpay/verify/?purpose=remaining`, {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const confirmManualRemainingPayment = async (requestId, manualPaymentMode, manualReferenceNo) => {
  try {
    const response = await api.post(`/api/pdi-requests/${requestId}/payments/manual/confirm/?purpose=remaining`, {
      manual_payment_mode: manualPaymentMode,
      manual_reference_no: manualReferenceNo
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}