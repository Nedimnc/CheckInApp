import jwt from 'jsonwebtoken';

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  console.log('Authenticating socket with token');
  if (!token) {
    return next(new Error('No token provided'));
  };
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    console.log('WebSocket Authenticated')
    next();
  } catch (err) {
    console.error('WebSocket Authentication Error:', err.message);
    next(new Error('Invalid token (WS authMiddleware)'));
    }
};

export default authenticateSocket;