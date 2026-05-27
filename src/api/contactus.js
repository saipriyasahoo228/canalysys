import api from '../api';

// Submit contact form
export const submitContactForm = async (contactData) => {
  const response = await api.post('/api/contact-us/', contactData);
  return response.data;
};

// Send contact info with individual parameters
export const sendContactInfo = async (fullName, mobileNumber, emailAddress, description) => {
  const contactData = {
    full_name: fullName,
    mobile_number: mobileNumber,
    email_address: emailAddress,
    description: description
  };
  
  const response = await api.post('/api/contact-us/', contactData);
  return response.data;
};

// Get contact data
export const getContactData = async () => {
  const response = await api.get('/api/contact-us/');
  return response.data;
};

// Get inspectors data
export const getInspectorsData = async () => {
  const response = await api.get('/api/public/inspectors/');
  return response.data;
};

// Get inspection process feedback data
export const getInspectionProcessFeedback = async () => {
  const response = await api.get('/api/public/inspection/process-feedback/');
  return response.data;
};


// Simple connection to the /api/callbacks/ endpoint
export const getCallbacks = async () => {
  try {
    const response = await api.get('/api/callbacks/');
    return response.data;
  } catch (error) {
    console.error('Error fetching callbacks:', error);
    throw error;
  }
};


// Complete a callback request (mark as completed)
export const completeCallback = async (callbackId) => {
  try {
    const response = await api.patch(`/api/callbacks/${callbackId}/complete/`);
    return response.data;
  } catch (error) {
    console.error('Error completing callback:', error);
    throw error;
  }
};