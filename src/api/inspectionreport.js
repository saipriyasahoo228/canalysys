import api from '../api'

export const getInspectorDashboardData = async () => {
  try {
    const response = await api.get('/api/inspection/admin/inspectors/dashboard/')
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}
