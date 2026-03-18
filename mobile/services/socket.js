import { io } from 'socket.io-client';
import { IP_ADDRESS } from '../config';

const SOCKET_URL = `http://${IP_ADDRESS}:3000`; // ensure this matches your backend URL
console.log(`Initializing Socket.IO connection at:`, SOCKET_URL, `(not connecting yet, waiting for auth)`);

const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export default socket;