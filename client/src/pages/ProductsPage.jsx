import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, Star } from 'lucide-react';
import { productsApi } from '../api/products';
import useCartStore from '../store/cartStore';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const { data, isLoading } = useQuery({
    queryKey: ['products', keyword, page],
    queryFn: () => productsApi.getAll({ keyword, page, limit: 3 }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    addItem(product);
    toast.success(`${product.name}이(가) 장바구니에 담겼습니다.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="상품 검색..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data?.products?.map((product) => (
              <Link
                key={product._id}
                to={`/products/${product._id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">📦</div>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">{product.category}</span>
                  <h3 className="font-semibold text-gray-900 mt-2 mb-1 truncate">{product.name}</h3>
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-500">{product.averageRating?.toFixed(1) ?? '0.0'} ({product.numReviews})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">₩{product.price?.toLocaleString()}</span>
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {data?.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    p === page ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

