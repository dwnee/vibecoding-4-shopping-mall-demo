const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    // 1순위: Authorization 헤더, 2순위: 쿠키
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.user_type === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' });
};

module.exports = { protect, adminOnly };
