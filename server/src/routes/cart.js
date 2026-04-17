const express = require('express');
const { body, param } = require('express-validator');
const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const addItemValidation = [
  body('productId')
    .notEmpty().withMessage('productId를 입력해주세요.')
    .isMongoId().withMessage('유효하지 않은 productId입니다.'),
  body('quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('수량은 1 이상의 정수여야 합니다.'),
];

const updateItemValidation = [
  param('productId')
    .isMongoId().withMessage('유효하지 않은 productId입니다.'),
  body('quantity')
    .notEmpty().withMessage('수량을 입력해주세요.')
    .isInt({ min: 1 }).withMessage('수량은 1 이상의 정수여야 합니다.'),
];

// 모든 장바구니 라우트는 로그인 필요
router.use(protect);

router.get('/', getCart);
router.post('/items', addItemValidation, addItem);
router.put('/items/:productId', updateItemValidation, updateItem);
router.delete('/items/:productId', removeItem);
router.delete('/', clearCart);

module.exports = router;
