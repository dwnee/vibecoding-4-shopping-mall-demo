const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('주문 항목이 없습니다.'),
  body('items.*.product').isMongoId().withMessage('유효하지 않은 상품 ID입니다.'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('수량은 1 이상이어야 합니다.'),
  body('items.*.price').isNumeric({ min: 0 }).withMessage('유효하지 않은 가격입니다.'),
  body('ordererPhone').notEmpty().withMessage('주문자 연락처를 입력해주세요.'),
  body('shippingAddress.recipient').notEmpty().withMessage('수령인 이름을 입력해주세요.'),
  body('shippingAddress.phone').notEmpty().withMessage('수령인 연락처를 입력해주세요.'),
  body('shippingAddress.zipCode').notEmpty().withMessage('우편번호를 입력해주세요.'),
  body('shippingAddress.street').notEmpty().withMessage('주소를 입력해주세요.'),
  body('shippingAddress.city').notEmpty().withMessage('도시를 입력해주세요.'),
  body('paymentMethod')
    .isIn(['card', 'bank_transfer', 'kakao_pay'])
    .withMessage('유효하지 않은 결제 방법입니다.'),
  body('itemsPrice').isNumeric({ min: 0 }).withMessage('유효하지 않은 상품 금액입니다.'),
  body('totalPrice').isNumeric({ min: 0 }).withMessage('유효하지 않은 총 금액입니다.'),
];

const updateStatusValidation = [
  param('id').isMongoId().withMessage('유효하지 않은 주문 ID입니다.'),
  body('status')
    .isIn(['pending', 'paid', 'shipping', 'delivered', 'cancelled'])
    .withMessage('유효하지 않은 주문 상태입니다.'),
];

const getAllOrdersValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('page는 1 이상의 정수여야 합니다.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit는 1~100 사이여야 합니다.'),
  query('status')
    .optional()
    .isIn(['pending', 'paid', 'shipping', 'delivered', 'cancelled'])
    .withMessage('유효하지 않은 상태입니다.'),
];

// 모든 주문 라우트는 로그인 필요
router.use(protect);

// 일반 유저
router.post('/', createOrderValidation, validate, createOrder);
router.get('/my', getMyOrders);
router.get('/:id', param('id').isMongoId(), validate, getOrder);
router.patch('/:id/cancel', param('id').isMongoId(), validate, cancelOrder);

// 관리자 전용
router.get('/', adminOnly, getAllOrdersValidation, validate, getAllOrders);
router.patch('/:id/status', adminOnly, updateStatusValidation, validate, updateOrderStatus);

module.exports = router;
