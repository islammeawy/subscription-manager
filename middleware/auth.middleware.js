import {JWT_SECRET} from '../config/env.js';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const authorize = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    req.user = user;

    next();

  } catch(err){
    res.status(401).json({ success: false, error: 'Unauthorized' });
    next(err);
  }
}

export default authorize;