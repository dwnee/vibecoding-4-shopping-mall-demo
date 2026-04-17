import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminPage from './pages/admin/AdminPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderFailPage from './pages/OrderFailPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';

const queryClient = new QueryClient();

function AppRoutes() {
  const location = useLocation();
  // 헤더 로그인 버튼 클릭 시 state로 전달된 배경 페이지
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <>
      {/* 배경 라우트: backgroundLocation이 있으면 그 페이지를 유지, 없으면 현재 경로 정상 렌더링 */}
      <Routes location={backgroundLocation || location}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order/success" element={<OrderSuccessPage />} />
          <Route path="/order/fail" element={<OrderFailPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        {/* URL 직접 접근 시 (/login) 단독 페이지로 표시 */}
        {!backgroundLocation && <Route path="/login" element={<LoginPage />} />}
        {/* 어드민 페이지 - 자체 헤더 사용 */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path="/admin/products/new" element={<AdminProductsPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
      </Routes>

      {/* 배경 페이지 위에 로그인 패널 오버레이 */}
      {backgroundLocation && (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      )}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-center" />
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
