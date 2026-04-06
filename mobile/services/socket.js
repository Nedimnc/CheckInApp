import { io } from 'socket.io-client';
import config from '../config';

// Build socket URL from the configured API_URL (strip the /api path)
const SOCKET_URL = config.API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
console.log(`Initializing Socket.IO connection at:`, SOCKET_URL, `(not connecting yet, waiting for auth)`);

const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export default socket;