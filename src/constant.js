// let API_URI = 'http://127.0.0.1:8000/';
// if (process.env.NODE_ENV === 'development') {
//   API_URI = 'http://127.0.0.1:8000/';
// }
// export const API_BASE_URL = API_URI;





// You can set different defaults based on environment

const DEFAULT_API = {
  development: 'https://carnalysis001.pythonanywhere.com',
  production: 'https://carnalysis001.pythonanywhere.com'
};

// Vite uses import.meta.env instead of process.env
const API_URI = import.meta.env.VITE_API_URL || 
                DEFAULT_API[import.meta.env.MODE] || 
                DEFAULT_API.development;

export const API_BASE_URL = API_URI;