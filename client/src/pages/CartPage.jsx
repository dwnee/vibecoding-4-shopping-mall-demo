import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingPrice = 0;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">장바구니가 비어있습니다</h2>
        <p className="text-gray-500 mb-6">원하는 상품을 장바구니에 담아보세요!</p>
        <Link to="/products"><Button>상품 보러가기</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">장바구니</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {items.map((item) => (
            <div key={item._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                <p className="text-indigo-600 font-semibold">₩{item.price?.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <p className="font-semibold text-gray-900 w-24 text-right">₩{(item.price * item.quantity).toLocaleString()}</p>
              <button onClick={() => removeItem(item._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-fit sticky top-24">
          <h2 className="font-semibold text-gray-900 mb-4">주문 요약</h2>
          <div className="flex flex-col gap-2 text-sm mb-4">
            <div className="flex justify-between"><span className="text-gray-600">상품금액</span><span>₩{totalPrice.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">배송비</span><span>{shippingPrice === 0 ? '무료' : `₩${shippingPrice.toLocaleString()}`}</span></div>
          </div>
          <div className="border-t border-gray-200 pt-4 mb-6">
            <div className="flex justify-between font-bold text-lg">
              <span>총 합계</span>
              <span className="text-indigo-600">₩{(totalPrice + shippingPrice).toLocaleString()}</span>
            </div>
          </div>
          <Button className="w-full" size="lg" onClick={handleCheckout}>주문하기</Button>
          <button onClick={clearCart} className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600 transition-colors py-2">장바구니 비우기</button>
        </div>
      </div>
    </div>
  );
}
