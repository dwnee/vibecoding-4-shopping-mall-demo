const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('이름을 입력해주세요.'),
    body('email').isEmail().normalizeEmail().withMessage('유효한 이메일을 입력해주세요.'),
    body('password').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다.'),
    body('user_type')
      .optional()
      .isIn(['customer', 'admin'])
      .withMessage('유저 타입은 customer 또는 admin이어야 합니다.'),
  ],
  register
);

// POST /api/auth/login - 로그인 및 JWT 토큰 발급
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('유효한 이메일을 입력해주세요.'),
    body('password').notEmpty().withMessage('비밀번호를 입력해주세요.'),
  ],
  login
);

// POST /api/auth/logout - 로그아웃 (쿠키 삭제)
router.post('/logout', logout);

// GET /api/auth/me - 로그인한 유저 정보 조회 (토큰 필요)
router.get('/me', protect, getMe);

module.exports = router;
