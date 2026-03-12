import api from '../api';

// List leave requests with optional filters
export const listLeaveRequests = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.inspector_id) params.append('inspector_id', filters.inspector_id);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  
  const queryString = params.toString();
  const url = queryString ? `/api/staff/leaves/?${queryString}` : '/api/staff/leaves/';
  
  const response = await api.get(url);
  return response.data;
};

// Approve leave request
export const approveLeaveRequest = async (leaveId, adminComment = '') => {
  const response = await api.post(`/api/staff/leaves/${leaveId}/approve/`, {
    admin_comment: adminComment
  });
  return response.data;
};

// Reject leave request
export const rejectLeaveRequest = async (leaveId, adminComment = '') => {
  const response = await api.post(`/api/staff/leaves/${leaveId}/reject/`, {
    admin_comment: adminComment
  });
  return response.data;
};
