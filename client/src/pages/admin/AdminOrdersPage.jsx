import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, Filter, Eye, Truck, XCircle, CheckCircle, Package } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const STATUS_META = {
  pending:   { text: '결제 대기', badge: 'bg-yellow-100 text-yellow-700' },
  paid:      { text: '처리중',   badge: 'bg-blue-100 text-blue-700' },
  shipping:  { text: '배송중',   badge: 'bg-indigo-100 text-indigo-700' },
  delivered: { text: '배송완료', badge: 'bg-green-100 text-green-700' },
  cancelled: { text: '취소됨',  badge: 'bg-red-100 text-red-600' },
};

const TABS = [
  { key: 'all',       label: '전체' },
  { key: 'pending',   label: '결제 대기' },
  { key: 'paid',      label: '처리중' },
  { key: 'shipping',  label: '배송중' },
  { key: 'delivered', label: '배송완료' },
  { key: 'cancelled', label: '취소됨' },
];

const PAY_METHOD = {
  card: '카드',
  bank_transfer: '계좌이체',
  kakao_pay: '카카오페이',
};

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.user_type !== 'admin') navigate('/');
  }, [isAuthenticated, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-all-orders'],
    queryFn: () => ordersApi.getAll().then((r) => r.data.orders),
    enabled: isAuthenticated && user?.user_type === 'admin',
  });

  const { mutate: changeStatus, isPending: isChanging } = useMutation({
    mutationFn: ({ id, status }) => ordersApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      const label = STATUS_META[status]?.text ?? status;
      toast.success(`주문 상태가 '${label}'으로 변경되었습니다.`);
      queryClient.invalidateQueries({ queryKey: ['admin-all-orders'] });
    },
    onError: () => toast.error('상태 변경에 실패했습니다.'),
  });

  const allOrders = data ?? [];

  const filtered = allOrders.filter((o) => {
    const matchTab = activeTab === 'all' || o.status === activeTab;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      o.orderNumber?.toLowerCase().includes(q) ||
      o.ordererName?.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.user?.email?.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const tabCount = (key) => {
    if (key === 'all') return allOrders.length;
    return allOrders.filter((o) => o.status === key).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-widest uppercase text-gray-900">CIDER</span>
            <span className="text-[10px] font-bold bg-gray-900 text-white px-2 py-0.5 rounded tracking-widest uppercase">
              ADMIN
            </span>
          </div>
          <Link
            to="/"
            className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 px-4 py-1.5 rounded-lg"
          >
            쇼핑몰로 돌아가기
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8">

        {/* 페이지 타이틀 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">주문 관리</h1>
        </div>

        {/* 검색 + 필터 */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="주문번호 또는 고객명으로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            필터
          </button>
        </div>

        {/* 상태 탭 */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = tabCount(tab.key);
            const isCancelledActive = tab.key === 'cancelled' && isActive;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-colors border ${
                  isActive
                    ? isCancelledActive
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 로딩 */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">해당 조건의 주문이 없습니다.</p>
          </div>
        )}

        {/* 주문 목록 */}
        {!isLoading && filtered.length > 0 && (
          <div className="flex flex-col gap-3">
            {filtered.map((order) => {
              const meta = STATUS_META[order.status] ?? STATUS_META.pending;
              const customerName = order.ordererName ?? order.user?.name ?? '알 수 없음';
              const customerEmail = order.user?.email ?? '-';
              const addr = order.shippingAddress;
              const addrText = addr
                ? `${addr.city} ${addr.street}${addr.detail ? ' ' + addr.detail : ''}`
                : '-';

              return (
                <div key={order._id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* 상단 */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">{order.orderNumber}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>
                          {meta.text}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {customerName} · {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-base font-bold text-gray-900">
                        ₩{order.totalPrice?.toLocaleString()}
                      </span>
                      <Link
                        to={`/orders/${order._id}`}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors border border-gray-200 px-2.5 py-1.5 rounded-lg"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        상세보기
                      </Link>
                    </div>
                  </div>

                  {/* 중단 */}
                  <div className="grid grid-cols-3 gap-4 px-5 py-3 text-xs border-b border-gray-50">
                    <div>
                      <p className="text-gray-400 mb-1 font-medium">고객 정보</p>
                      <p className="text-gray-700">{customerEmail}</p>
                      <p className="text-gray-700">{order.ordererPhone ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1 font-medium">주문 상품</p>
                      <p className="text-gray-700">
                        {order.items?.length > 0 ? `${order.items.length}개 상품` : '-'}
                      </p>
                      <p className="text-gray-400">{PAY_METHOD[order.paymentMethod] ?? order.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1 font-medium">배송 주소</p>
                      <p className="text-gray-700 truncate">{addrText}</p>
                      {addr?.recipient && <p className="text-gray-400">{addr.recipient}</p>}
                    </div>
                  </div>

                  {/* 하단: 액션 */}
                  <div className="px-5 py-3">
                    {order.status === 'cancelled' ? (
                      <p className="text-xs text-gray-400">
                        주문번호:{' '}
                        <span className="font-medium text-gray-600 select-all">
                          {order.merchantUid ?? order.impUid ?? '-'}
                        </span>
                      </p>
                    ) : (
                      <div className="flex items-center gap-2">
                        {(order.status === 'pending' || order.status === 'paid') && (
                          <button
                            disabled={isChanging}
                            onClick={() => changeStatus({ id: order._id, status: 'shipping' })}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            배송 시작
                          </button>
                        )}
                        {order.status === 'shipping' && (
                          <button
                            disabled={isChanging}
                            onClick={() => changeStatus({ id: order._id, status: 'delivered' })}
                            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            배송 완료
                          </button>
                        )}
                        {order.status !== 'delivered' && (
                          <button
                            disabled={isChanging}
                            onClick={() => {
                              if (confirm('주문을 취소하시겠습니까?')) {
                                changeStatus({ id: order._id, status: 'cancelled' });
                              }
                            }}
                            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            주문 취소
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            배송이 완료된 주문입니다.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
