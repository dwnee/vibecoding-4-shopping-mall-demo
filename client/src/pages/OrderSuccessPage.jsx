import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Mail, Phone, Calendar } from 'lucide-react';
import { useEffect } from 'react';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getEstimatedDelivery() {
  const date = new Date();
  date.setDate(date.getDate() + 4);
  const from = new Date();
  from.setDate(from.getDate() + 3);
  return `${from.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} ~ ${date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}`;
}

export default function OrderSuccessPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order;

  useEffect(() => {
    if (!order) {
      navigate('/', { replace: true });
    }
  }, [order, navigate]);

  if (!order) return null;

  const { shippingAddress } = order;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-center">
          <h1 className="text-sm font-semibold text-gray-700 tracking-widest uppercase">
            Order Confirmation
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-5">
        {/* 성공 아이콘 + 타이틀 */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">주문이 성공적으로 완료되었습니다!</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            주문해 주셔서 감사합니다.<br />
            주문 확인 이메일을 곧 받으실 수 있습니다.
          </p>
        </div>

        {/* 주문 정보 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">주문 정보</h3>
          </div>

          {/* 주문 번호 / 날짜 */}
          <div className="grid grid-cols-2 gap-4 px-5 py-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-1">주문 번호</p>
              <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">주문 날짜</p>
              <p className="text-sm font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          {/* 주문 상품 */}
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs text-gray-400 mb-3">주문 상품</p>
            <ul className="flex flex-col gap-3">
              {order.items.map((item, idx) => {
                const product = item.product;
                const image =
                  product?.images?.[0] || item.image || null;
                const name = product?.name || item.name;
                const price = product?.price ?? item.price;
                return (
                  <li key={item._id || idx} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {image ? (
                        <img src={image} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                      <p className="text-xs text-gray-400">수량: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                      ₩{(price * item.quantity).toLocaleString()}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 총 결제 금액 */}
          <div className="px-5 py-4 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-900">총 결제 금액</span>
            <span className="text-base font-bold text-gray-900">
              ₩{order.totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 배송 정보 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">배송 정보</h3>
          </div>

          <div className="px-5 py-4 flex flex-col gap-4">
            {/* 예상 배송일 */}
            <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-blue-500 font-medium">예상 배송일</p>
                <p className="text-sm font-semibold text-blue-700">{getEstimatedDelivery()}</p>
              </div>
            </div>

            {/* 배송 주소 */}
            <div>
              <p className="text-xs text-gray-400 mb-1">배송 주소</p>
              <p className="text-sm text-gray-800 leading-relaxed">
                {shippingAddress?.recipient}<br />
                {shippingAddress?.street}
                {shippingAddress?.detail ? ` ${shippingAddress.detail}` : ''}<br />
                {shippingAddress?.city} {shippingAddress?.zipCode}
              </p>
              {shippingAddress?.deliveryNote && (
                <p className="text-xs text-gray-400 mt-1">📝 {shippingAddress.deliveryNote}</p>
              )}
            </div>
          </div>
        </div>

        {/* 다음 단계 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">다음 단계</h3>
          <ol className="flex flex-col gap-3">
            {[
              { title: '주문 확인 이메일', desc: '주문 세부 정보가 포함된 확인 이메일을 받으실 수 있습니다.' },
              { title: '주문 처리', desc: '1~2 영업일 내에 주문을 처리하고 포장합니다.' },
              { title: '배송 시작', desc: '배송이 시작되면 추적 번호를 이메일로 보내드립니다.' },
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* 버튼 */}
        <div className="flex flex-col gap-3">
          <Link
            to="/products"
            className="w-full bg-gray-900 text-white py-4 rounded-xl text-sm font-medium text-center hover:bg-black transition-colors"
          >
            계속 쇼핑하기
          </Link>
          <Link
            to="/orders"
            className="w-full border border-gray-200 text-gray-700 py-4 rounded-xl text-sm font-medium text-center hover:bg-gray-50 transition-colors"
          >
            주문 내역 보기
          </Link>
        </div>

        {/* 문의 */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 px-5 py-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">문의사항이 있으신가요?</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">이메일</p>
                <p className="text-xs text-gray-700 font-medium">support@shop.com</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">전화</p>
                <p className="text-xs text-gray-700 font-medium">1588-0000</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
