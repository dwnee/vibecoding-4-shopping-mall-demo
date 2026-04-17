const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'SKU를 입력해주세요.'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, '상품명을 입력해주세요.'],
      trim: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: [true, '가격을 입력해주세요.'],
      min: 0,
    },
    category: {
      type: String,
      required: [true, '카테고리를 입력해주세요.'],
      enum: {
        values: ['상의', '하의', '악세사리'],
        message: '카테고리는 상의, 하의, 악세사리 중 하나여야 합니다.',
      },
    },
    images: [{ type: String }],
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reviews: [reviewSchema],
    averageRating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
