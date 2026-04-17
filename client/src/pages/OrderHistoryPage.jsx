import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { ordersApi } from '../api/orders';
import useAuthStore from '../store/authStore';

const STATUS_LABEL = {
  pending:   { text: '결제 대기', color: 'text-yellow-600 bg-yellow-50' },
  paid:      { text: '결제 완료', color: 'text-blue-600 bg-blue-50' },
  shipping:  { text: '배송 중',   color: 'text-indigo-600 bg-indigo-50' },
  delivered: { text: '배송 완료', color: 'text-green-600 bg-green-50' },
  cancelled: { text: '취소됨',   color: 'text-red-500 bg-red-50' },
};

const TABS = [
  { key: 'all',       label: '전체' },
  { key: 'pending',   label: '결제 대기' },
  { key: 'paid',      label: '결제 완료' },
  { key: 'shipping',  label: '배송 중' },
  { key: 'delivered', label: '배송 완료' },
  { key: 'cancelled', label: '취소됨' },
];

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
  });
}

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['myOrders', user?._id],
    queryFn: () => ordersApi.getMyOrders().then((res) => res.data.orders),
    enabled: !!user,
  });

  const allOrders = data || [];
  const filteredOrders =
    activeTab === 'all' ? allOrders : allOrders.filter((o) => o.status === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <Package className="w-5 h-5" />
          주문 내역
        </h1>

        {/* 상태 탭 */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {TABS.map((tab) => {
            const count =
              tab.key === 'all'
                ? allOrders.length
                : allOrders.filter((o) => o.status === tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 로딩 스켈레톤 */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/4 mb-4" />
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 에러 */}
        {isError && (
          <div className="text-center py-16 text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">주문 내역을 불러오는 중 오류가 발생했습니다.</p>
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && !isError && filteredOrders.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <ShoppingBag className="w-12 h-12 text-gray-200" />
            <p className="text-sm text-gray-400">
              {activeTab === 'all'
                ? '아직 주문 내역이 없습니다.'
                : `'${TABS.find((t) => t.key === activeTab)?.label}' 상태의 주문이 없습니다.`}
            </p>
            {activeTab === 'all' && (
              <Link
                to="/products"
                className="mt-1 px-5 py-2.5 bg-gray-900 text-white text-sm rounded-xl hover:bg-black transition-colors"
              >
                쇼핑 시작하기
              </Link>
            )}
          </div>
        )}

        {/* 주문 목록 */}
        {!isLoading && !isError && filteredOrders.length > 0 && (
          <div className="flex flex-col gap-3">
            {filteredOrders.map((order) => {
              const status = STATUS_LABEL[order.status] || STATUS_LABEL.pending;
              const firstItem = order.items?.[0];
              const image = firstItem?.image || null;
              const extraCount = order.items.length - 1;

              return (
                <button
                  key={order._id}
                  onClick={() => navigate(`/orders/${order._id}`)}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left hover:border-gray-300 transition-colors w-full"
                >
                  {/* 주문번호 + 상태 + 화살표 */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">{order.orderNumber}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>

                  {/* 주문 날짜 */}
                  <p className="text-xs text-gray-400 mb-3">{formatDate(order.createdAt)}</p>

                  {/* 상품 썸네일 + 이름 */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {image ? (
                        <img src={image} alt={firstItem?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {firstItem?.name}
                        {extraCount > 0 && (
                          <span className="text-gray-400 font-normal"> 외 {extraCount}건</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {PAY_METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                      ₩{order.totalPrice.toLocaleString()}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
