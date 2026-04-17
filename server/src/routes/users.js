const express = require('express');
const { body } = require('express-validator');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, adminOnly, getAllUsers);

router.get('/:id', protect, getUserById);

router.post(
  '/',
  protect,
  adminOnly,
  [
    body('name').trim().notEmpty().withMessage('이름을 입력해주세요.'),
    body('email').isEmail().withMessage('유효한 이메일을 입력해주세요.'),
    body('password').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다.'),
    body('user_type').isIn(['customer', 'admin']).withMessage('유저 타입은 customer 또는 admin이어야 합니다.'),
  ],
  createUser
);

router.put(
  '/:id',
  protect,
  [
    body('name').optional().trim().notEmpty().withMessage('이름을 입력해주세요.'),
    body('email').optional().isEmail().withMessage('유효한 이메일을 입력해주세요.'),
    body('user_type').optional().isIn(['customer', 'admin']).withMessage('유저 타입은 customer 또는 admin이어야 합니다.'),
  ],
  updateUser
);

router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
