import { io } from 'socket.io-client';
import { IP_ADDRESS } from '../config';

const SOCKET_URL = `http://${IP_ADDRESS}:3000`; // ensure this matches your backend URL
console.log(`Connecting to Socket.IO at:`, SOCKET_URL);

const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export default socket;