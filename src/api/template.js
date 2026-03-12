import api from '../api';

// List all templates
export const listTemplates = async () => {
  const response = await api.get('/api/inspection/templates/');
  return response.data;
};

// Create new template (nested structure)
export const createTemplate = async (templateData) => {
  const response = await api.post('/api/inspection/templates/', templateData);
  return response.data;
};

// Get specific template detail
export const getTemplate = async (templateId) => {
  const response = await api.get(`/api/inspection/templates/${templateId}/`);
  return response.data;
};

// Update template (replaces nested sections)
export const updateTemplate = async (templateId, templateData) => {
  const response = await api.put(`/api/inspection/templates/${templateId}/`, templateData);
  return response.data;
};

// Delete template
export const deleteTemplate = async (templateId) => {
  const response = await api.delete(`/api/inspection/templates/${templateId}/`);
  return response.data;
};
