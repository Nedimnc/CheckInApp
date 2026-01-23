// mobile/config.example.js
// INSTRUCTIONS:
// 1. Duplicate this file and rename it to "config.js"
// 2. Run "ipconfig" (Windows) or "ifconfig" (Mac) to find your IP.
// 3. Replace "YOUR_LOCAL_IP" below with that number.

const IP_ADDRESS = 'YOUR_LOCAL_IP';

export default {
  API_URL: `http://${IP_ADDRESS}:3000/api`,
};