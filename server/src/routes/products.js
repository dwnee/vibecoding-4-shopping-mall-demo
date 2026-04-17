const express = require('express');
const { body, query } = require('express-validator');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createReview,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

const CATEGORIES = ['상의', '하의', '악세사리'];

const createValidation = [
  body('sku')
    .trim()
    .notEmpty().withMessage('SKU를 입력해주세요.')
    .isAlphanumeric().withMessage('SKU는 영문자와 숫자만 사용할 수 있습니다.'),
  body('name')
    .trim()
    .notEmpty().withMessage('상품명을 입력해주세요.'),
  body('price')
    .notEmpty().withMessage('가격을 입력해주세요.')
    .isFloat({ min: 0 }).withMessage('가격은 0 이상이어야 합니다.'),
  body('category')
    .notEmpty().withMessage('카테고리를 선택해주세요.')
    .isIn(CATEGORIES).withMessage(`카테고리는 ${CATEGORIES.join(', ')} 중 하나여야 합니다.`),
  body('description')
    .optional()
    .trim(),
  body('images')
    .optional()
    .isArray().withMessage('이미지는 배열 형태여야 합니다.'),
  body('images.*')
    .optional()
    .isURL().withMessage('이미지는 유효한 URL이어야 합니다.'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('재고는 0 이상의 정수여야 합니다.'),
];

const updateValidation = [
  body('sku')
    .optional()
    .trim()
    .isAlphanumeric().withMessage('SKU는 영문자와 숫자만 사용할 수 있습니다.'),
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('상품명은 비워둘 수 없습니다.'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('가격은 0 이상이어야 합니다.'),
  body('category')
    .optional()
    .isIn(CATEGORIES).withMessage(`카테고리는 ${CATEGORIES.join(', ')} 중 하나여야 합니다.`),
  body('description')
    .optional()
    .trim(),
  body('images')
    .optional()
    .isArray().withMessage('이미지는 배열 형태여야 합니다.'),
  body('images.*')
    .optional()
    .isURL().withMessage('이미지는 유효한 URL이어야 합니다.'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('재고는 0 이상의 정수여야 합니다.'),
];

const listValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page는 1 이상의 정수여야 합니다.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit은 1~100 사이의 정수여야 합니다.'),
  query('keyword')
    .optional()
    .trim(),
  query('category')
    .optional()
    .isIn(['상의', '하의', '악세사리']).withMessage('유효하지 않은 카테고리입니다.'),
];

// Public
router.get('/', listValidation, getProducts);
router.get('/:id', getProduct);

// Admin only
router.post('/', protect, adminOnly, createValidation, createProduct);
router.put('/:id', protect, adminOnly, updateValidation, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

// Authenticated users
router.post('/:id/reviews', protect, createReview);

module.exports = router;
