const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// "7d" → 밀리초 변환 (쿠키 maxAge에 사용)
const parseDurationToMs = (duration) => {
  const units = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  const match = String(duration).match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // 기본 7일
  return parseInt(match[1]) * units[match[2]];
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// 토큰을 HTTP-only 쿠키로 설정
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,                                    // JS에서 접근 불가 (XSS 방어)
    secure: process.env.NODE_ENV === 'production',     // HTTPS에서만 전송 (프로덕션)
    sameSite: 'strict',                                // CSRF 방어
    maxAge: parseDurationToMs(JWT_EXPIRES_IN),
  });
};

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  user_type: user.user_type,
  address: user.address || null,
  createdAt: user.createdAt,
});

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, user_type, address } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: '이미 사용 중인 이메일입니다.' });
    }

    const user = await User.create({ name, email, password, user_type, address });
    const token = generateToken(user._id);

    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      token,
      expiresIn: JWT_EXPIRES_IN,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // password 필드는 select: false 이므로 명시적으로 포함
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = generateToken(user._id);

    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: '로그인에 성공했습니다.',
      token,
      expiresIn: JWT_EXPIRES_IN,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ success: true, message: '로그아웃되었습니다.' });
};

exports.getMe = async (req, res, next) => {
  try {
    // protect 미들웨어가 이미 req.user를 채워두므로 추가 DB 조회 없이 반환
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' });
    }
    res.status(200).json({ success: true, user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};
