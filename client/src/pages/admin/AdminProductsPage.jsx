import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Package, Upload, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productsApi } from '../../api/products';
import useAuthStore from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const CATEGORIES = ['상의', '하의', '악세사리'];

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const schema = z.object({
  sku: z
    .string()
    .min(1, 'SKU를 입력해주세요.')
    .regex(/^[a-zA-Z0-9]+$/, 'SKU는 영문자와 숫자만 사용 가능합니다.'),
  name: z.string().min(1, '상품명을 입력해주세요.'),
  price: z.coerce
    .number({ invalid_type_error: '숫자를 입력해주세요.' })
    .min(0, '가격은 0 이상이어야 합니다.'),
  category: z.enum(['상의', '하의', '악세사리'], { message: '카테고리를 선택해주세요.' }),
  description: z.string().optional(),
});

export default function AdminProductsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(
    location.pathname === '/admin/products/new' ? 'register' : 'list'
  );
  const [listPage, setListPage] = useState(1);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.user_type !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products-list', listPage],
    queryFn: () => productsApi.getAll({ page: listPage }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const { mutate: createProduct, isPending: isCreating } = useMutation({
    mutationFn: (data) => productsApi.create(data),
    onSuccess: () => {
      toast.success('상품이 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
      reset();
      setImageUrl('');
      setListPage(1);
      setActiveTab('list');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || '상품 등록에 실패했습니다.');
    },
  });

  const { mutate: deleteProduct, isPending: isDeleting } = useMutation({
    mutationFn: (id) => productsApi.remove(id),
    onSuccess: () => {
      toast.success('상품이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
    },
    onError: () => toast.error('상품 삭제에 실패했습니다.'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { price: 0, category: '', description: '' },
  });

  const openCloudinaryWidget = useCallback(() => {
    if (!window.cloudinary) {
      toast.error('이미지 업로더를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    if (!CLOUD_NAME || CLOUD_NAME === 'your_cloud_name') {
      toast.error('.env에 VITE_CLOUDINARY_CLOUD_NAME을 설정해주세요.');
      return;
    }

    setIsUploading(true);

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        multiple: false,
        maxFiles: 1,
        sources: ['local', 'url', 'camera'],
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxFileSize: 5_000_000,
        language: 'ko',
        text: {
          ko: {
            or: '또는',
            back: '뒤로',
            advanced: '고급',
            close: '닫기',
            no_results: '결과 없음',
            search_placeholder: '파일 검색',
            about_uw: 'Upload Widget 정보',
            menu: { files: '내 파일', web: 'URL', camera: '카메라' },
            selection_counter: { file: '파일' },
            actions: { upload: '업로드', next: '다음', processing: '처리 중...' },
            local: {
              browse: '파일 선택',
              dd_title_single: '이미지를 여기에 드래그하거나',
              dd_title_multi: '이미지들을 여기에 드래그하거나',
              drop_title_single: '파일을 드롭하세요',
              drop_title_multiple: '파일들을 드롭하세요',
            },
          },
        },
        styles: {
          palette: {
            window: '#FFFFFF',
            windowBorder: '#E5E7EB',
            tabIcon: '#111827',
            menuIcons: '#6B7280',
            textDark: '#111827',
            textLight: '#FFFFFF',
            link: '#111827',
            action: '#111827',
            inactiveTabIcon: '#9CA3AF',
            error: '#EF4444',
            inProgress: '#111827',
            complete: '#10B981',
            sourceBg: '#F9FAFB',
          },
          fonts: { default: null, "'Inter', sans-serif": { url: 'https://fonts.googleapis.com/css?family=Inter', active: true } },
        },
      },
      (error, result) => {
        setIsUploading(false);
        if (error) {
          toast.error('이미지 업로드에 실패했습니다.');
          return;
        }
        if (result?.event === 'success') {
          setImageUrl(result.info.secure_url);
          toast.success('이미지가 업로드되었습니다.');
        }
      }
    );

    widget.open();
  }, []);

  const onSubmit = (formData) => {
    createProduct({ ...formData, images: imageUrl ? [imageUrl] : [] });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`"${name}" 상품을 삭제하시겠습니까?`)) {
      deleteProduct(id);
    }
  };

  const handleReset = () => {
    reset();
    setImageUrl('');
  };

  const products   = data?.products   ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </Link>
            <h1 className="text-sm font-bold text-gray-900">상품 관리</h1>
          </div>
          <button
            onClick={() => setActiveTab('register')}
            className="flex items-center gap-2 bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            새상품 등록
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8">

        {/* Tabs */}
        <div className="flex bg-gray-200 rounded-lg p-1 mb-8 w-64">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 text-xs font-semibold py-2 rounded-md transition-colors ${
              activeTab === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            상품 목록
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 text-xs font-semibold py-2 rounded-md transition-colors ${
              activeTab === 'register'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            상품 등록
          </button>
        </div>

        {/* ── 상품 등록 탭 ── */}
        {activeTab === 'register' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">새 상품 등록</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">

                {/* Left */}
                <div className="flex flex-col gap-5">
                  <Input
                    label="SKU"
                    placeholder="예: TOP001"
                    error={errors.sku?.message}
                    {...register('sku')}
                  />
                  <Input
                    label="상품명"
                    placeholder="상품명을 입력하세요"
                    error={errors.name?.message}
                    {...register('name')}
                  />
                  <Input
                    label="판매가격"
                    type="number"
                    min={0}
                    placeholder="0"
                    error={errors.price?.message}
                    {...register('price')}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">카테고리</label>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-indigo-500 bg-white ${
                        errors.category ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                      {...register('category')}
                    >
                      <option value="">카테고리 선택</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-xs text-red-500">{errors.category.message}</p>
                    )}
                  </div>
                </div>

                {/* Right */}
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      상품 설명{' '}
                      <span className="text-gray-400 font-normal">(선택)</span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder="상품에 대한 자세한 설명을 입력하세요"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      {...register('description')}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      대표 이미지{' '}
                      <span className="text-gray-400 font-normal">(선택)</span>
                    </label>

                    {imageUrl ? (
                      <div className="relative w-full aspect-square max-w-[200px] rounded-xl overflow-hidden border border-gray-200 group">
                        <img src={imageUrl} alt="미리보기" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={openCloudinaryWidget}
                            className="bg-white text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            변경
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="bg-white text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={openCloudinaryWidget}
                        disabled={isUploading}
                        className="flex flex-col items-center justify-center gap-2 w-full aspect-square max-w-[200px] border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-gray-400 hover:text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? (
                          <Spinner />
                        ) : (
                          <>
                            <Upload className="w-6 h-6" />
                            <span className="text-xs font-medium">이미지 업로드</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </div>

              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
                <Button type="submit" isLoading={isCreating} className="!bg-gray-900 hover:!bg-gray-700">
                  상품 등록
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  취소
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ── 상품 목록 탭 ── */}
        {activeTab === 'list' && (
          <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="py-20 flex justify-center"><Spinner /></div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">등록된 상품이 없습니다.</p>
                <button
                  onClick={() => setActiveTab('register')}
                  className="mt-4 text-xs text-gray-500 underline hover:text-gray-700"
                >
                  새 상품 등록하기
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">이미지</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">상품명</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">카테고리</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">가격</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">재고</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{product.sku ?? '—'}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">₩{product.price?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-700">{product.stock}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          disabled={isDeleting}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-400">
                {data?.total}개 상품 · {listPage} / {totalPages} 페이지
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setListPage((p) => Math.max(1, p - 1))}
                  disabled={!data?.hasPrevPage}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setListPage(p)}
                    className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                      p === listPage
                        ? 'bg-gray-900 text-white'
                        : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setListPage((p) => Math.min(totalPages, p + 1))}
                  disabled={!data?.hasNextPage}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                </button>
              </div>
            </div>
          )}
          </>
        )}

      </div>
    </div>
  );
}
