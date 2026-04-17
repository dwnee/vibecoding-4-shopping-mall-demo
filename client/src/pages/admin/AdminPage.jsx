import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, Users, TrendingUp, Plus, Eye, BarChart2, UserCog } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ordersApi } from '../../api/orders';
import { productsApi } from '../../api/products';
import { usersApi } from '../../api/users';
import useAuthStore from '../../store/authStore';

const STATUS_LABEL = {
  pending: '대기중',
  paid: '결제완료',
  shipping: '배송중',
  delivered: '배송완료',
  cancelled: '취소됨',
};

const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  shipping: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        {sub && <p className="text-xs text-green-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.user_type !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => ordersApi.getAll().then((r) => r.data),
    enabled: isAuthenticated && user?.user_type === 'admin',
  });

  const { data: productsData } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsApi.getAll({ page: 1 }).then((r) => r.data),
    enabled: isAuthenticated && user?.user_type === 'admin',
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => usersApi.getAll().then((r) => r.data),
    enabled: isAuthenticated && user?.user_type === 'admin',
  });

  const orders = ordersData?.orders ?? [];
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice ?? 0), 0);
  const recentOrders = orders.slice(0, 3);

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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">CIDER 쇼핑몰 관리 시스템에 오신 것을 환영합니다.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="총 주문"
            value={orders.length.toLocaleString()}
            sub="+12% from last month"
            icon={ShoppingCart}
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
          />
          <StatCard
            label="총 상품"
            value={productsData?.total?.toLocaleString() ?? productsData?.products?.length?.toLocaleString()}
            sub="+3% from last month"
            icon={Package}
            iconBg="bg-green-50"
            iconColor="text-green-500"
          />
          <StatCard
            label="총 고객"
            value={usersData?.count?.toLocaleString()}
            sub="+8% from last month"
            icon={Users}
            iconBg="bg-purple-50"
            iconColor="text-purple-500"
          />
          <StatCard
            label="총 매출"
            value={`₩${totalRevenue.toLocaleString()}`}
            sub="+15% from last month"
            icon={TrendingUp}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
          />
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">빠른 작업</h2>
            <div className="flex flex-col gap-2">
              <Link
                to="/admin/products/new"
                className="flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                새 상품 등록
              </Link>
              <Link
                to="/admin/orders"
                className="flex items-center gap-3 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4 text-gray-500" />
                주문 관리
              </Link>
              <button className="flex items-center gap-3 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-left">
                <BarChart2 className="w-4 h-4 text-gray-500" />
                매출 분석
              </button>
              <button className="flex items-center gap-3 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-left">
                <UserCog className="w-4 h-4 text-gray-500" />
                고객 관리
              </button>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">최근 주문</h2>
              <Link to="/admin/orders" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                전체보기
              </Link>
            </div>
            <div className="flex flex-col divide-y divide-gray-100">
              {recentOrders.length > 0 ? recentOrders.map((order) => (
                <div key={order._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {`ORD-${order._id.slice(-6).toUpperCase()}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.user?.name ?? '알 수 없음'} · {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      ₩{order.totalPrice?.toLocaleString()}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-400 py-4 text-center">주문 내역이 없습니다.</p>
              )}
            </div>
          </div>

        </div>

        {/* Bottom Navigation Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Link
            to="/admin/products"
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-3 hover:shadow-md transition-shadow group"
          >
            <Package className="w-12 h-12 text-blue-500 group-hover:scale-110 transition-transform" />
            <h3 className="text-base font-bold text-gray-900">상품 관리</h3>
            <p className="text-xs text-gray-500 text-center">상품 등록, 수정, 삭제 및 재고 관리</p>
          </Link>
          <Link
            to="/admin/orders"
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-3 hover:shadow-md transition-shadow group"
          >
            <ShoppingCart className="w-12 h-12 text-green-500 group-hover:scale-110 transition-transform" />
            <h3 className="text-base font-bold text-gray-900">주문 관리</h3>
            <p className="text-xs text-gray-500 text-center">주문 조회, 상태 변경 및 배송 관리</p>
          </Link>
        </div>

      </div>
    </div>
  );
}
