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
