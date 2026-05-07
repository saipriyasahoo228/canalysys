import api from '../api'

export const getInspectorDashboardData = async () => {
  try {
    const response = await api.get('/api/inspection/admin/inspectors/dashboard/')
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const getPDIReportByRequestId = async (requestId) => {
  try {
    const response = await api.get(`/api/inspection/reports/pdi-requests/${requestId}/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const downloadPDIReportPDF = async (requestId) => {
  try {
    const response = await api.get(`/api/inspection/reports/pdi-requests/${requestId}/pdf/`, {
      responseType: 'blob',
    })
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}
