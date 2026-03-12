// Razorpay Configuration
// Update these values for production

export const RAZORPAY_CONFIG = {
  // Test Key (for development)
  TEST_KEY: 'rzp_test_S6qCIp2zlZlXCH',
  
  // Production Key (replace with your live key)
  PRODUCTION_KEY: 'rzp_live_your_live_key_here',
  
  // Key Secret (for backend verification if needed)
  KEY_SECRET: 'Cp2cMaMQbfpWpUt1nHWHTt4v',
  
  // Current mode: 'test' or 'production'
  MODE: 'test',
  
  // Get current key based on mode
  getKey() {
    return this.MODE === 'production' ? this.PRODUCTION_KEY : this.TEST_KEY;
  },
  
  // Get secret for backend operations
  getSecret() {
    return this.MODE === 'production' ? this.PRODUCTION_SECRET : this.KEY_SECRET;
  }
};

// Export current key for easy access
export const RAZORPAY_KEY = RAZORPAY_CONFIG.getKey();
