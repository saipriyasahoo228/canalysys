




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







// const DEFAULT_API = {
//   development: 'http://127.0.0.1:8000',
//   production: 'http://127.0.0.1:8000'
// };

// // Vite uses import.meta.env instead of process.env
// const API_URI = import.meta.env.VITE_API_URL || 
//                 DEFAULT_API[import.meta.env.MODE] || 
//                 DEFAULT_API.development;

// export const API_BASE_URL = API_URI;