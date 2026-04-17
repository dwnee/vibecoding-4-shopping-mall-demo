import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Heart, Share2, Star, Minus, Plus,
  Truck, RefreshCw, ShieldCheck, ShoppingBag
} from 'lucide-react';
import { productsApi } from '../api/products';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const COLORS = ['#4A6FA5', '#1A1A1A', '#87CEEB'];
const STAR_INDICES = [0, 1, 2, 3, 4];
const TABS = ['Description', 'Reviews', 'Shipping & Returns'];

function SkeletonDetail() {
  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10 animate-pulse">
      <div className="flex gap-12">
        <div className="flex-1">
          <div className="aspect-[3/4] bg-gray-200 rounded-2xl" />
          <div className="flex gap-3 mt-4">
            {[0,1,2,3].map((i) => (
              <div key={i} className="w-20 h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-4 pt-4">
          <div className="h-5 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-6 bg-gray-200 rounded w-32" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

function RelatedProducts({ currentId }) {
  const { data } = useQuery({
    queryKey: ['products-related'],
    queryFn: () => productsApi.getAll({ page: 1, limit: 6 }).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const related = data?.products?.filter((p) => p._id !== currentId).slice(0, 4) ?? [];

  if (related.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-lg font-bold text-gray-900 mb-6">You might also like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {related.map((product) => (
          <Link
            key={product._id}
            to={`/products/${product._id}`}
            className="group"
          >
            <div className="aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden mb-3">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">👗</div>
              )}
            </div>
            <p className="font-semibold text-sm text-gray-900 truncate">{product.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-bold text-sm text-gray-900">₩{product.price?.toLocaleString()}</span>
              {product.price > 50000 && (
                <span className="text-xs text-gray-400 line-through">
                  ₩{Math.round(product.price * 1.35).toLocaleString()}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getOne(id).then((r) => r.data),
  });

  const product = data?.product;

  const discountedPrice = product ? Math.round(product.price * 1.35) : 0;
  const discountRate = product ? Math.round((1 - product.price / discountedPrice) * 100) : 0;

  const images = product?.images?.length
    ? product.images
    : [null, null, null, null];

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('사이즈를 선택해주세요.');
      return;
    }
    addItem(product, quantity);
    toast.success(`${product.name}이(가) 장바구니에 담겼습니다.`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('링크가 복사되었습니다.');
  };

  if (isLoading) return <SkeletonDetail />;

  if (isError || !product) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-gray-500 text-lg mb-6">상품을 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-semibold underline text-gray-700"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
      {/* Top Nav */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        <p className="text-sm font-semibold text-gray-800 truncate max-w-xs">{product.name}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={() => setWishlisted((v) => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left: Images */}
        <div className="flex-1 min-w-0">
          <div className="aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden">
            {images[selectedImage] ? (
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl text-gray-200">👗</div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            {images.slice(0, 4).map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-colors shrink-0 ${
                  selectedImage === i ? 'border-gray-900' : 'border-transparent'
                }`}
              >
                {img ? (
                  <img src={img} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xl text-gray-300">👗</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex gap-2 mb-3">
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">NEW</span>
            <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">SALE</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-4">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-gray-800">
              {product.averageRating?.toFixed(1) ?? '0.0'}
            </span>
            <span className="text-sm text-gray-400">
              ({product.numReviews ?? 0} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-black text-gray-900">
              ₩{product.price?.toLocaleString()}
            </span>
            <span className="text-base text-gray-400 line-through">
              ₩{discountedPrice.toLocaleString()}
            </span>
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
              {discountRate}% OFF
            </span>
          </div>

          {/* Size */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-2.5">Size</p>
            <div className="flex gap-2 flex-wrap">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    selectedSize === size
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-2.5">Color:</p>
            <div className="flex gap-2.5">
              {COLORS.map((color, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedColor(i)}
                  style={{ backgroundColor: color }}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === i ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-2.5">Quantity</p>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden w-fit">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <span className="w-10 text-center text-sm font-semibold text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 mb-8">
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-2xl text-sm font-bold tracking-wide hover:bg-gray-700 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              ADD TO BAG — ₩{(product.price * quantity).toLocaleString()}
            </button>
            <button
              onClick={() => setWishlisted((v) => !v)}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold tracking-wide border transition-colors ${
                wishlisted
                  ? 'bg-red-50 border-red-300 text-red-500'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              {wishlisted ? 'ADDED TO WISHLIST' : 'ADD TO WISHLIST'}
            </button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-3 py-6 border-t border-gray-100">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders over ₩100,000' },
              { icon: RefreshCw, title: 'Easy Returns', desc: '30-day return policy' },
              { icon: ShieldCheck, title: 'Secure Payment', desc: 'SSL encrypted' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center gap-1.5">
                <Icon className="w-5 h-5 text-gray-500" />
                <p className="text-xs font-semibold text-gray-700">{title}</p>
                <p className="text-[10px] text-gray-400 leading-tight">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12 border-b border-gray-200">
        <div className="flex gap-0">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === i
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}{i === 1 ? ` (${product.numReviews ?? 0})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="py-8">
        {activeTab === 0 && (
          <div className="max-w-2xl text-sm text-gray-600 leading-relaxed">
            <p className="mb-5">
              {product.description || '이 상품에 대한 설명이 없습니다.'}
            </p>
            <h3 className="font-bold text-gray-900 mb-3">Features:</h3>
            <ul className="space-y-2">
              {['프리미엄 소재 사용', '편안한 핏', '관리가 쉬운 소재', '지속 가능한 생산'].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 1 && (
          <div className="max-w-2xl">
            {product.reviews?.length > 0 ? (
              <div className="space-y-6">
                {product.reviews.map((review, i) => (
                  <div key={i} className="border-b border-gray-100 pb-6 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        {review.name?.[0] ?? 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{review.name}</p>
                        <div className="flex items-center gap-0.5">
                          {STAR_INDICES.map((si) => (
                            <Star
                              key={si}
                              className={`w-3 h-3 ${si < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">아직 리뷰가 없습니다.</p>
            )}
          </div>
        )}

        {activeTab === 2 && (
          <div className="max-w-2xl text-sm text-gray-600 space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">배송 안내</h3>
              <p>₩100,000 이상 구매 시 무료 배송. 일반 배송은 3~5 영업일 이내 도착합니다.</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">반품 / 교환</h3>
              <p>수령 후 30일 이내 미착용 상품에 한해 반품 및 교환이 가능합니다. 고객센터로 문의 주세요.</p>
            </div>
          </div>
        )}
      </div>

      {/* Related Products */}
      <RelatedProducts currentId={id} />
    </div>
  );
}
