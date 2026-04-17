import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Truck, CreditCard, Calendar } from 'lucide-react';
import { ordersApi } from '../api/orders';

const STATUS_LABEL = {
  pending: { text: '결제 대기', color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
  paid: { text: '결제 완료', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  shipping: { text: '배송 중', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  delivered: { text: '배송 완료', color: 'text-green-600 bg-green-50 border-green-100' },
  cancelled: { text: '취소됨', color: 'text-red-500 bg-red-50 border-red-100' },
};

const PAY_METHOD_LABEL = {
  card: '신용/체크카드',
  bank_transfer: '계좌이체',
  kakao_pay: '카카오페이',
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SectionCard({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getOne(id).then((res) => res.data.order),
    enabled: !!id,
  });

  const order = data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-4">
          <div className="h-5 bg-gray-100 rounded w-40 animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">주문 정보를 불러올 수 없습니다.</p>
          <button
            onClick={() => navigate('/orders')}
            className="mt-4 text-sm text-gray-600 underline underline-offset-2"
          >
            주문 내역으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const status = STATUS_LABEL[order.status] || STATUS_LABEL.pending;
  const { shippingAddress } = order;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">주문 상세</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-4">
        {/* 주문 번호 + 상태 */}
        <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">주문 번호</p>
            <p className="text-sm font-bold text-gray-900">{order.orderNumber}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${status.color}`}>
            {status.text}
          </span>
        </div>

        {/* 주문 상품 */}
        <SectionCard icon={<Package className="w-4 h-4 text-gray-500" />} title="주문 상품">
          <ul className="flex flex-col gap-4">
            {order.items.map((item, idx) => {
              const image = item.image || null;
              const name = item.name;
              const price = item.price;
              return (
                <li key={item._id || idx} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {image ? (
                      <img src={image} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ₩{price.toLocaleString()} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                    ₩{(price * item.quantity).toLocaleString()}
                  </p>
                </li>
              );
            })}
          </ul>

          {/* 금액 요약 */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>상품금액</span>
              <span>₩{order.itemsPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>배송비</span>
              <span>
                {order.shippingPrice === 0 ? (
                  <span className="text-green-600 font-medium">무료</span>
                ) : (
                  `₩${order.shippingPrice.toLocaleString()}`
                )}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t border-gray-100">
              <span>총 결제금액</span>
              <span>₩{order.totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </SectionCard>

        {/* 배송 정보 */}
        <SectionCard icon={<Truck className="w-4 h-4 text-gray-500" />} title="배송 정보">
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex gap-4">
              <dt className="w-20 text-gray-400 flex-shrink-0">수령인</dt>
              <dd className="text-gray-800 font-medium">{shippingAddress?.recipient}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-20 text-gray-400 flex-shrink-0">연락처</dt>
              <dd className="text-gray-800">{shippingAddress?.phone}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-20 text-gray-400 flex-shrink-0">주소</dt>
              <dd className="text-gray-800 leading-relaxed">
                ({shippingAddress?.zipCode}) {shippingAddress?.city} {shippingAddress?.street}
                {shippingAddress?.detail ? ` ${shippingAddress.detail}` : ''}
              </dd>
            </div>
            {shippingAddress?.deliveryNote && (
              <div className="flex gap-4">
                <dt className="w-20 text-gray-400 flex-shrink-0">요청사항</dt>
                <dd className="text-gray-800">{shippingAddress.deliveryNote}</dd>
              </div>
            )}
          </dl>
        </SectionCard>

        {/* 결제 정보 */}
        <SectionCard icon={<CreditCard className="w-4 h-4 text-gray-500" />} title="결제 정보">
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex gap-4">
              <dt className="w-20 text-gray-400 flex-shrink-0">결제 수단</dt>
              <dd className="text-gray-800 font-medium">
                {PAY_METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-20 text-gray-400 flex-shrink-0 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                주문일
              </dt>
              <dd className="text-gray-800">{formatDate(order.createdAt)}</dd>
            </div>
            {order.paidAt && (
              <div className="flex gap-4">
                <dt className="w-20 text-gray-400 flex-shrink-0">결제일</dt>
                <dd className="text-gray-800">{formatDate(order.paidAt)}</dd>
              </div>
            )}
            {order.merchantUid && (
              <div className="flex gap-4">
                <dt className="w-20 text-gray-400 flex-shrink-0">주문 ID</dt>
                <dd className="text-gray-500 text-xs break-all">{order.merchantUid}</dd>
              </div>
            )}
          </dl>
        </SectionCard>

        {/* 버튼 */}
        <button
          onClick={() => navigate('/orders')}
          className="w-full border border-gray-200 text-gray-700 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          주문 내역으로 돌아가기
        </button>
      </div>
    </div>
  );
}
