const { validationResult } = require('express-validator');
const Product = require('../models/Product');

const ALLOWED_CREATE_FIELDS = ['sku', 'name', 'description', 'price', 'category', 'images', 'stock'];
const ALLOWED_UPDATE_FIELDS = ['sku', 'name', 'description', 'price', 'category', 'images', 'stock'];

const handleMongoError = (error, res) => {
  // 중복 키 에러 (sku unique 제약 위반)
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    return res.status(409).json({
      success: false,
      message: `이미 사용 중인 ${field.toUpperCase()} 값입니다: ${value}`,
    });
  }
  return null;
};

exports.getProducts = async (req, res, next) => {
  try {
    const { keyword, category } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 3));

    const query = {};
    if (keyword) query.name = { $regex: keyword, $options: 'i' };
    if (category) query.category = category;

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      total,
      page,
      limit,
      totalPages,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
      products,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    }
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // 허용된 필드만 추출
    const data = {};
    ALLOWED_CREATE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });

    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (error) {
    const handled = handleMongoError(error, res);
    if (!handled) next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // 허용된 필드만 추출
    const data = {};
    ALLOWED_UPDATE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });

    const product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    }

    res.json({ success: true, product });
  } catch (error) {
    const handled = handleMongoError(error, res);
    if (!handled) next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    }
    res.json({ success: true, message: '상품이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: '이미 리뷰를 작성하셨습니다.' });
    }

    product.reviews.push({ user: req.user._id, name: req.user.name, rating, comment });
    product.numReviews = product.reviews.length;
    product.averageRating =
      product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

    await product.save();
    res.status(201).json({ success: true, message: '리뷰가 등록되었습니다.' });
  } catch (error) {
    next(error);
  }
};
