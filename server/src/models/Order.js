const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  image: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ordererName: { type: String, required: true },
    ordererPhone: { type: String, required: true },
    items: [orderItemSchema],
    shippingAddress: {
      recipient: { type: String, required: true },
      phone: { type: String, required: true },
      zipCode: { type: String, required: true },
      street: { type: String, required: true },
      detail: { type: String, default: '' },
      city: { type: String, required: true },
      deliveryNote: { type: String, default: '' },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['card', 'bank_transfer', 'kakao_pay'],
      default: 'card',
    },
    itemsPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipping', 'delivered', 'cancelled'],
      default: 'pending',
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    impUid: { type: String },
    merchantUid: { type: String },
  },
  { timestamps: true }
);

// 저장 전 주문번호 자동 생성: ORD-YYYYMMDD-XXXXX (랜덤 5자리 영숫자)
orderSchema.pre('save', async function () {
  if (this.isNew && !this.orderNumber) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.orderNumber = `ORD-${date}-${rand}`;
  }
});

module.exports = mongoose.model('Order', orderSchema);
