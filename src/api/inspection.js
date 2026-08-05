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

// export const assignInspector = async (requestId, payload) => {
//   try {
//     const response = await api.post(`/api/pdi-requests/${requestId}/assign/`, payload)
//     return response.data
//   } catch (error) {
//     throw error.response?.data || error.message
//   }
// }

export const assignInspector = async (requestId, payload) => {
  try {
    const response = await api.post(`/api/pdi-requests/${requestId}/assign/`, payload)
    return response.data
  } catch (error) {
    // Keep the original error but add the data for easier access
    if (error.response?.data) {
      error.responseData = error.response.data
    }
    throw error
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

export const verifyRazorpayRemainingPayment = async (requestId, razorpayOrderId, razorpayPaymentId, razorpaySignature, clientRequestId) => {
  try {
    const response = await api.post(`/api/pdi-requests/${requestId}/payments/razorpay/verify/?purpose=remaining`, {
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

export const deleteInspector = async (inspectorId) => {
  try {
    const response = await api.post(`/api/admin/accounts/inspectors/${inspectorId}/delete/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const createPaymentLink = async (requestId, purpose = 'advance') => {
  try {
    const response = await api.post(`/api/pdi-requests/${requestId}/payments/payment-link/`, {
      purpose
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getPaymentStatus = async (requestId) => {
  try {
    const response = await api.get(`/api/pdi-requests/${requestId}/payments/status/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const verifyPaymentLink = async (requestId, purpose = '') => {
  try {
    const response = await api.post(`/api/pdi-requests/${requestId}/payments/verify-payment-link/`, {
      purpose
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const deletePdiRequest = async (requestId) => {
  try {
    const response = await api.delete(`/api/pdi-requests/${requestId}/delete/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

// Refund API
export const refundPdiRequest = async (requestId, transactionId, amountPaise, reason) => {
  try {
    const response = await api.post(
      `/api/pdi-requests/${requestId}/admin/refund/`,
      {
        transaction_id: transactionId,
        amount_paise: amountPaise,
        reason: reason
      }
    )
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

// Update booking status API
export const updatePdiBookingStatus = async (requestId, status, reason) => {
  try {
    const response = await api.patch(
      `/api/pdi-requests/${requestId}/admin/booking-status/`,
      {
        status: status,
        reason: reason
      }
    )
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

// Update payment status API
export const updatePdiPaymentStatus = async (requestId, transactionId, status, reason) => {
  try {
    const response = await api.patch(
      `/api/pdi-requests/${requestId}/admin/payment-status/`,
      {
        transaction_id: transactionId,
        status: status,
        reason: reason
      }
    )
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

// Override remaining payment API
export const overrideRemainingPayment = async (requestId, remainingAmountPaise, reason) => {
  try {
    const payload = { remaining_amount_paise: remainingAmountPaise }
    if (reason) payload.reason = reason
    const response = await api.patch(
      `/api/pdi-requests/${requestId}/admin/override-remaining-payment/`,
      payload
    )
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}