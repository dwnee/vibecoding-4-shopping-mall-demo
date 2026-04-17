const Cart = require('../models/Cart');
const Product = require('../models/Product');

// GET /api/cart
exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name price images stock');
    if (!cart) {
      return res.json({ success: true, items: [], totalItems: 0, totalPrice: 0 });
    }
    res.json({
      success: true,
      items: cart.items,
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cart/items
exports.addItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existing = cart.items.find((item) => item.product.toString() === productId);
    if (existing) {
      existing.quantity = existing.quantity + quantity;
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] ?? '',
        quantity,
      });
    }

    await cart.save();
    res.status(201).json({
      success: true,
      message: '장바구니에 담겼습니다.',
      items: cart.items,
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/cart/items/:productId
exports.updateItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: '수량은 1 이상이어야 합니다.' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: '장바구니가 없습니다.' });
    }

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) {
      return res.status(404).json({ success: false, message: '해당 상품이 장바구니에 없습니다.' });
    }

    item.quantity = quantity;
    await cart.save();

    res.json({
      success: true,
      items: cart.items,
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart/items/:productId
exports.removeItem = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: '장바구니가 없습니다.' });
    }

    const before = cart.items.length;
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);

    if (cart.items.length === before) {
      return res.status(404).json({ success: false, message: '해당 상품이 장바구니에 없습니다.' });
    }

    await cart.save();
    res.json({
      success: true,
      message: '상품이 삭제되었습니다.',
      items: cart.items,
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ success: true, message: '장바구니가 비워졌습니다.', items: [], totalItems: 0, totalPrice: 0 });
  } catch (error) {
    next(error);
  }
};
