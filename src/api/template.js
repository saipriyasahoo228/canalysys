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

// Update template metadata only (PATCH)
export const patchTemplate = async (templateId, templateData) => {
  const response = await api.patch(`/api/inspection/templates/${templateId}/`, templateData);
  return response.data;
};

// Update section (PATCH)
export const patchSection = async (sectionId, sectionData) => {
  const response = await api.patch(`/api/inspection/templates/sections/${sectionId}/`, sectionData);
  return response.data;
};

// Update question (PATCH)
export const patchQuestion = async (questionId, questionData) => {
  const response = await api.patch(`/api/inspection/templates/questions/${questionId}/`, questionData);
  return response.data;
};

// Create section under template
export const createSection = async (templateId, sectionData) => {
  const response = await api.post(`/api/inspection/templates/${templateId}/sections/`, sectionData);
  return response.data;
};

// Create question under section
export const createQuestion = async (sectionId, questionData) => {
  const response = await api.post(`/api/inspection/templates/sections/${sectionId}/questions/`, questionData);
  return response.data;
};

// Create sub-section under a section (section must not itself be a sub-section)
export const createSubSection = async (sectionId, sectionData) => {
  const response = await api.post(`/api/inspection/templates/sections/${sectionId}/sub-sections/`, sectionData);
  return response.data;
};

// Create sub-question under a question (question must not itself be a sub-question)
export const createSubQuestion = async (questionId, questionData) => {
  const response = await api.post(`/api/inspection/templates/questions/${questionId}/sub-questions/`, questionData);
  return response.data;
};

// Delete section (DELETE)
export const deleteSection = async (sectionId) => {
  const response = await api.delete(`/api/inspection/templates/sections/${sectionId}/`);
  return response.data;
};

// Delete question (DELETE)
export const deleteQuestion = async (questionId) => {
  const response = await api.delete(`/api/inspection/templates/questions/${questionId}/`);
  return response.data;
};