import api from '../api';

// Create global commission rule
export const createGlobalCommissionRule = async (ruleData) => {
  const response = await api.post('/api/staff/commissions/global/', ruleData);
  return response.data;
};

// Create inspector override commission rule
export const createInspectorCommissionRule = async (inspectorId, ruleData) => {
  const response = await api.post(`/api/staff/commissions/inspectors/${inspectorId}/`, ruleData);
  return response.data;
};

// List commission rules
export const listCommissionRules = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.scope) params.append('scope', filters.scope);
  if (filters.inspector_id) params.append('inspector_id', filters.inspector_id);
  
  const queryString = params.toString();
  const url = queryString ? `/api/staff/commissions/?${queryString}` : '/api/staff/commissions/';
  
  const response = await api.get(url);
  return response.data;
};

// Get commission report (admin)
export const getCommissionReport = async (fromDate, toDate, inspectorId = null) => {
  const params = new URLSearchParams();
  params.append('from', fromDate);
  params.append('to', toDate);
  if (inspectorId) params.append('inspector_id', inspectorId);
  
  const response = await api.get(`/api/staff/commissions/report/?${params.toString()}`);
  return response.data;
};

// Get my commission report (inspector)
export const getMyCommissionReport = async (fromDate, toDate) => {
  const params = new URLSearchParams();
  params.append('from', fromDate);
  params.append('to', toDate);
  
  const response = await api.get(`/api/staff/commissions/report/me/?${params.toString()}`);
  return response.data;
};
