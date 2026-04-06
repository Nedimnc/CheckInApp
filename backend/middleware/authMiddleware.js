import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log('API Call Authenticated');
    next();
  } catch (err) {
    console.error(err.message);
    res.status(403).json({ message: 'Invalid token (authMiddleware)' });
  }
};

export default authenticateToken;