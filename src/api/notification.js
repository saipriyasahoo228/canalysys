import api from '../api'

export const getNotifications = async () => {
  try {
    const response = await api.get('/api/notifications/')
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/api/notifications/${notificationId}/read/`)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const markMultipleNotificationsAsRead = async (notificationIds) => {
  const promises = notificationIds.map(id => markNotificationAsRead(id))
  try {
    const results = await Promise.allSettled(promises)
    const failures = results.filter(result => result.status === 'rejected')
    if (failures.length > 0) {
      console.error(`Failed to mark ${failures.length} notifications as read`)
    }
    return results
  } catch (error) {
    throw error.response?.data || error.message
  }
}
