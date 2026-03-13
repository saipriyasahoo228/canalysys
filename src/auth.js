
import axios from 'axios';
import { API_BASE_URL } from "./constant";
import { jwtDecode } from "jwt-decode";

// Store tokens in localStorage
const storeToken = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

// Retrieve tokens from localStorage
const getToken = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  return { accessToken, refreshToken };
};

// Remove tokens from localStorage
const removeToken = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};


const login = async (mobile_number, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login/`, {
      mobile_number,
      password
    });

    const data = response?.data || {};
    const access =
      data.access ??
      data.access_token ??
      data.accessToken ??
      data?.Token?.access ??
      data?.Token?.access_token ??
      data?.tokens?.access ??
      data?.token?.access;
    const refresh =
      data.refresh ??
      data.refresh_token ??
      data.refreshToken ??
      data?.Token?.refresh ??
      data?.Token?.refresh_token ??
      data?.tokens?.refresh ??
      data?.token?.refresh;
    const user = data.user ?? data.userInfo ?? data.profile ?? null;

    if (!access || !refresh) {
      console.error('Login response missing access/refresh tokens. Response data:', data);
      throw new Error('Login failed: server did not return auth tokens.');
    }

    storeToken(access, refresh); // Store tokens
    localStorage.setItem("userInfo", JSON.stringify(user)); // Store user info immediately
    window.dispatchEvent(new Event("userInfoUpdated")); // Notify other components

    console.log("Login Successful. User Data:", data);
    return data;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};



const logout = () => {
  removeToken(); // Remove access & refresh tokens
  localStorage.removeItem("userInfo"); // Remove user role & permissions
  localStorage.removeItem("userRole"); // Remove any other user-related data
  
  // Dispatch event to update components
  window.dispatchEvent(new Event("userInfoUpdated"));

  console.log("All user data cleared. Logging out...");

  window.location = "/"; // Redirect to login or home page
};


// Get a new access token using refresh token
const getNewAccessToken = async () => {
  try {
    const { refreshToken } = getToken();
    if (!refreshToken) {
      console.warn("No refresh token found. Logging out...");
      logout();
      return;
    }

    // Don't check refresh token expiration here - let the server handle it
    // The server will return 401 if refresh token is truly expired

    const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
      refresh: refreshToken
    });

    const newAccessToken = response.data.access;
    const newRefreshToken = response.data.refresh;
    
    // Store both new tokens
    if (newAccessToken && newRefreshToken) {
      storeToken(newAccessToken, newRefreshToken);
      console.log("✅ Both tokens refreshed successfully");
    } else if (newAccessToken) {
      // Only access token returned, keep existing refresh token
      const { refreshToken: currentRefreshToken } = getToken();
      storeToken(newAccessToken, currentRefreshToken);
      console.log("✅ Access token refreshed successfully");
    } else {
      console.error("❌ No access token received in refresh response:", response.data);
      logout();
      return;
    }

    return newAccessToken;
  } catch (error) {
    console.error('Refresh token error:', error);
    // Handle different error scenarios
    if (error.response?.status === 401) {
      console.warn("Refresh token invalid/expired/blacklisted. Logging out...");
      logout();
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.warn("Network timeout during refresh, not logging out");
      throw error; // Don't logout on network issues
    } else {
      console.warn("Refresh failed, but not logging out immediately");
      throw error; // Let the API interceptor handle retry
    }
  }
};

//Get logged-in user info from the JWT token
const getLoggedInUserInfo = () => {
  try {
    const { accessToken } = getToken();
    if (!accessToken) {
      console.error("No access token found.");
      return null;
    }

    const decodedToken = jwtDecode(accessToken);
    console.log("Decoded Token:", decodedToken); // Debugging output

    return { user_id: decodedToken.user_id 
    }; // Ensure this matches token structure
  } catch (error) {
    console.error("Error decoding user info:", error);
    return null;
  }
};




// Check if user is authenticated
const isUserAuthenticated = () => {
  const { accessToken } = getToken();
  if (!accessToken) return false;

  try {
    const decodedToken = jwtDecode(accessToken);
    const isExpired = decodedToken.exp <= Date.now() / 1000;
    
    // If token is expired or will expire in next 2 minutes, try to refresh
    if (isExpired) {
      console.log("Access token expired, attempting refresh...");
      getNewAccessToken().catch(err => {
        console.error("Failed to refresh expired token:", err);
      });
      return false;
    }
    
    // Check if token will expire in next 2 minutes
    const timeUntilExpiry = decodedToken.exp * 1000 - Date.now();
    if (timeUntilExpiry < 2 * 60 * 1000) { // 2 minutes
      console.log("Token expiring soon, refreshing...");
      getNewAccessToken().catch(err => {
        console.error("Failed to refresh expiring token:", err);
      });
    }
    
    return true;
  } catch (error) {
    console.error("Invalid token:", error);
    return false;
  }
};

export {
  login,
  logout,
  getNewAccessToken,
  getToken,
  removeToken,
  storeToken,
  getLoggedInUserInfo,
  isUserAuthenticated,
};
