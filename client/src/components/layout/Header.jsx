import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, Search, LogOut, Package, ChevronDown } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const items = useCartStore((s) => s.items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${searchQuery.trim()}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">

          {/* Logo */}
          <Link to="/" className="text-xl font-black tracking-widest text-gray-900 uppercase shrink-0">
            CIDER
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-gray-700 tracking-widest uppercase shrink-0">
            <Link to="/products" className="hover:text-gray-400 transition-colors">NEW IN</Link>
            <Link to="/products" className="hover:text-gray-400 transition-colors">CLOTHING</Link>
            <Link to="/products" className="hover:text-gray-400 transition-colors">ACCESSORIES</Link>
            <Link to="/products" className="hover:text-gray-400 transition-colors text-red-500">SALE</Link>
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-xs border border-gray-300 rounded-full px-4 py-1.5 gap-2 bg-gray-50">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search for items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs outline-none w-full placeholder-gray-400 text-gray-700"
            />
          </form>

          {/* Right Icons */}
          <div className="flex items-center gap-1 shrink-0">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Heart className="w-5 h-5 text-gray-700" />
            </button>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1">
                {/* 사용자 드롭다운 */}
                <div className="relative hidden md:block" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-1 text-xs font-medium text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {user?.name}님 환영합니다
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <Link
                        to="/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        주문 내역
                      </Link>
                      <div className="h-px bg-gray-100 mx-3 my-1" />
                      <button
                        onClick={() => { setDropdownOpen(false); handleLogout(); }}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>

                {user?.user_type === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-xs font-bold text-gray-700 hover:text-gray-400 transition-colors tracking-widest uppercase px-3 py-2"
                  >
                    Admin Page
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                state={{ backgroundLocation: location }}
                className="text-xs font-bold text-gray-700 hover:text-gray-400 transition-colors tracking-widest uppercase px-3 py-2"
              >
                로그인
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
