const Order = require('../models/Order');
const Cart = require('../models/Cart');

// PortOne V2 결제 조회
const getPortOnePayment = async (paymentId) => {
  const res = await fetch(
    `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: `PortOne ${process.env.PORTONE_API_SECRET}`,
      },
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PortOne API 오류 (${res.status}): ${body}`);
  }
  return res.json();
};

// POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const {
      items,
      ordererName,
      ordererPhone,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
      impUid,
      merchantUid,
    } = req.body;

    // 1. 주문 항목 확인
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: '주문 항목이 없습니다.' });
    }

    // 2. 필수 배송 정보 확인
    const { recipient, phone, zipCode, street, city } = shippingAddress || {};
    if (!recipient || !phone || !zipCode || !street || !city) {
      return res.status(400).json({ success: false, message: '필수 배송 정보가 누락되었습니다.' });
    }

    // 3. 결제 방법 확인
    const allowedMethods = ['card', 'bank_transfer', 'kakao_pay'];
    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 결제 방법입니다.' });
    }

    // 4. 결제 데이터 확인
    if (!impUid) {
      return res.status(400).json({ success: false, message: '결제 정보가 없습니다.' });
    }

    // 5. 주문 중복 체크 (동일 impUid로 이미 주문된 경우 차단)
    const duplicateOrder = await Order.findOne({ impUid });
    if (duplicateOrder) {
      return res.status(409).json({
        success: false,
        message: '이미 처리된 결제입니다. (중복 주문 차단)',
      });
    }

    // 6. PortOne V2 결제 진위 검증 (금액 위변조 방지)
    if (process.env.PORTONE_API_SECRET) {
      const paymentData = await getPortOnePayment(impUid);

      if (paymentData.status !== 'PAID') {
        return res.status(400).json({
          success: false,
          message: `결제가 완료되지 않았습니다. (상태: ${paymentData.status})`,
        });
      }

      const paidAmount = paymentData.amount?.total ?? paymentData.amount;
      if (paidAmount !== totalPrice) {
        console.error(`[createOrder] 금액 불일치 - 결제: ${paidAmount}, 주문: ${totalPrice}`);
        return res.status(400).json({
          success: false,
          message: '결제 금액이 주문 금액과 일치하지 않습니다.',
        });
      }
    } else {
      console.warn('[createOrder] PORTONE_API_SECRET 미설정 - 결제 진위 검증 건너뜀');
    }

    // 7. 주문 생성
    const newOrder = await Order.create({
      user: req.user._id,
      ordererName: ordererName || req.user.name,
      ordererPhone,
      items,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
      impUid,
      merchantUid,
      isPaid: true,
      paidAt: new Date(),
      status: 'paid',
    });

    // 8. 장바구니 비우기
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // 9. 상품 정보와 함께 반환 (populate)
    const order = await Order.findById(newOrder._id)
      .populate('items.product', 'name price images');

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('[createOrder] 에러:', error.message, error.errors || '');
    next(error);
  }
};

// GET /api/orders/my
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name price images');
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name price images');
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.user_type === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: '접근 권한이 없습니다.' });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/orders/:id/cancel  (본인 주문 취소)
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: '접근 권한이 없습니다.' });
    }

    const cancellableStatuses = ['pending', 'paid'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: '배송이 시작된 주문은 취소할 수 없습니다.',
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders  (관리자 전체 주문 조회, 페이지네이션)
exports.getAllOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      orders,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/orders/:id/status  (관리자 주문 상태 변경)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    order.status = status;
    if (status === 'paid') {
      order.isPaid = true;
      order.paidAt = Date.now();
    }
    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};
