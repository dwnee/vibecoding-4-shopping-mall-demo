import { memo, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/products';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';

const categories = [
  { name: 'Dresses', emoji: '👗', bg: 'bg-pink-50 hover:bg-pink-100' },
  { name: 'Tops', emoji: '👚', bg: 'bg-purple-50 hover:bg-purple-100' },
  { name: 'Bottoms', emoji: '👖', bg: 'bg-sky-50 hover:bg-sky-100' },
  { name: 'Outerwear', emoji: '🧥', bg: 'bg-indigo-50 hover:bg-indigo-100' },
];
 
const STAR_INDICES = [0, 1, 2, 3, 4];
const SKELETON_ITEMS = [0, 1, 2, 3, 4, 5];

const stopPropagation = (e) => e.preventDefault();

const ProductBadge = memo(function ProductBadge({ index }) {
  if (index % 5 === 0) return (
    <div className="absolute top-3 left-3 z-10 flex gap-1">
      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>
      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SALE</span>
    </div>
  );
  if (index % 5 === 2) return (
    <div className="absolute top-3 left-3 z-10">
      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SALE</span>
    </div>
  );
  if (index % 5 === 1) return (
    <div className="absolute top-3 left-3 z-10">
      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>
    </div>
  );
  return null;
});

const ProductCard = memo(function ProductCard({ product, index, onAddToCart }) {
  return (
    <Link
      to={`/products/${product._id}`}
      className="group relative bg-gray-50 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <ProductBadge index={index} />

      <button
        onClick={stopPropagation}
        className="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
      >
        <Heart className="w-4 h-4 text-gray-400" />
      </button>

      <div className="aspect-[3/4] bg-gray-200 overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">
            👗
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm truncate mb-1.5">{product.name}</h3>
        <div className="flex items-center gap-0.5 mb-3">
          {STAR_INDICES.map((i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < Math.round(product.averageRating ?? 0)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-200'
              }`}
            />
          ))}
          <span className="text-xs text-gray-400 ml-1.5">({product.numReviews ?? 0})</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900">
            ₩{product.price?.toLocaleString()}
          </span>
          <button
            onClick={(e) => onAddToCart(e, product)}
            className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
});

export default function HomePage() {
  const addItem = useCartStore((s) => s.addItem);

  const { data } = useQuery({
    queryKey: ['products-home'],
    queryFn: () => productsApi.getAll({ page: 1 }).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const products = useMemo(() => data?.products?.slice(0, 6) ?? [], [data]);

  const handleAddToCart = useCallback((e, product) => {
    e.preventDefault();
    addItem(product);
    toast.success(`${product.name}이(가) 장바구니에 담겼습니다.`);
  }, [addItem]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-28 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-gray-400 mb-4">Spring / Summer 2025</p>
        <h1 className="text-5xl md:text-7xl font-black tracking-widest uppercase text-gray-900 mb-5">
          NEW ARRIVALS
        </h1>
        <p className="text-sm text-gray-500 mb-10 tracking-wide max-w-xs mx-auto leading-relaxed">
          Discover the latest trends and express your unique style
        </p>
        <Link
          to="/products"
          className="inline-block bg-gray-900 text-white text-xs font-bold tracking-[0.2em] uppercase px-12 py-3.5 hover:bg-gray-700 transition-colors"
        >
          SHOP NOW
        </Link>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(({ name, emoji, bg }) => (
            <Link
              key={name}
              to="/products"
              className={`${bg} rounded-2xl p-8 flex flex-col items-center gap-4 transition-colors group cursor-pointer`}
            >
              <span className="text-5xl group-hover:scale-110 transition-transform duration-200">{emoji}</span>
              <span className="text-sm font-semibold text-gray-700 tracking-wide">{name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Now */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-black tracking-[0.2em] uppercase text-gray-900">TRENDING NOW</h2>
          <p className="text-sm text-gray-400 mt-2 tracking-wide">Curated pieces that define this season</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.length > 0
            ? products.map((product, idx) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  index={idx}
                  onAddToCart={handleAddToCart}
                />
              ))
            : SKELETON_ITEMS.map((i) => (
                <div key={i} className="bg-gray-100 rounded-2xl overflow-hidden">
                  <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-4 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded-full w-24 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded-full w-20 animate-pulse" />
                  </div>
                </div>
              ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/products"
            className="inline-block border border-gray-900 text-gray-900 text-xs font-bold tracking-[0.2em] uppercase px-12 py-3.5 hover:bg-gray-900 hover:text-white transition-colors"
          >
            VIEW ALL
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-xl mx-auto text-center px-6">
          <h2 className="text-2xl font-black tracking-[0.2em] uppercase mb-3">STAY IN THE LOOP</h2>
          <p className="text-sm text-gray-400 mb-10 leading-relaxed">
            Be the first to know about new arrivals, exclusive offers, and style tips.
          </p>
          <form className="flex gap-2" onSubmit={stopPropagation}>
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm outline-none focus:border-white/60 transition-colors rounded-sm"
            />
            <button
              type="submit"
              className="bg-white text-gray-900 text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-gray-100 transition-colors rounded-sm shrink-0"
            >
              SUBSCRIBE
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
