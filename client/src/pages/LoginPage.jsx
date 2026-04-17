import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { cartApi } from '../api/cart';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

const SAVED_EMAIL_KEY = 'saved_email';

const schema = z.object({
  email: z.string().min(1, '아이디 형식은 필수 입력값입니다.').email('올바른 이메일 형식을 입력해주세요.'),
  password: z.string().min(1, '패스워드 형식은 필수 입력값입니다.'),
  rememberEmail: z.boolean().optional(),
});

const KakaoIcon = () => (
  <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9 0.5C4.03 0.5 0 3.74 0 7.74c0 2.62 1.74 4.93 4.36 6.22L3.3 16.1c-.1.3.23.54.5.37L7.56 14c.47.07.95.1 1.44.1 4.97 0 9-3.24 9-7.24C18 3.74 13.97.5 9 .5z"
      fill="#3C1E1E"
    />
  </svg>
);

const NaverIcon = () => (
  <span className="text-base font-extrabold leading-none">N</span>
);

const AppleIcon = () => (
  <svg width="15" height="18" viewBox="0 0 15 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.47 9.54c-.02-2.17 1.77-3.22 1.85-3.27-1.01-1.48-2.58-1.68-3.14-1.7-1.33-.14-2.6.78-3.28.78-.68 0-1.72-.76-2.83-.74C3.62 4.63 2.28 5.45 1.53 6.74.02 9.36 1.14 13.24 2.61 15.37c.72 1.04 1.57 2.2 2.69 2.16 1.08-.04 1.49-.7 2.8-.7 1.3 0 1.67.7 2.81.68 1.16-.02 1.89-1.06 2.6-2.1.82-1.2 1.16-2.37 1.17-2.43-.03-.01-2.23-.85-2.21-3.44zM10.12 3.15c.58-.71.98-1.69.86-2.69-.86.04-1.9.57-2.51 1.28-.55.64-1.01 1.64-.87 2.61.95.07 1.93-.46 2.52-1.2z" />
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, setAuth } = useAuthStore();
  const syncFromServer = useCartStore((s) => s.syncFromServer);

  // 이미 로그인된 상태면 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // 이전에 저장된 이메일 불러오기
  const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY) || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: savedEmail,
      rememberEmail: !!savedEmail,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: ({ email, password }) => authApi.login({ email, password }),
    onSuccess: async ({ data }, variables) => {
      // 아이디 저장 처리
      if (variables.rememberEmail) {
        localStorage.setItem(SAVED_EMAIL_KEY, variables.email);
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }

      setAuth(data.user, data.token);
      toast.success(`${data.user.name}님, 환영합니다!`);

      // 서버 장바구니 동기화 (서버에 담긴 항목이 있으면 로컬에 반영)
      try {
        const { data: cartData } = await cartApi.getCart();
        if (cartData.items?.length > 0) {
          syncFromServer(cartData.items);
        }
      } catch (_) {}

      // 오버레이로 열렸을 때는 배경 페이지로, 직접 접근했을 때는 홈으로
      const from = location.state?.backgroundLocation?.pathname || '/';
      navigate(from, { replace: true });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || '로그인에 실패했습니다.');
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 왼쪽 디밍 영역 */}
      <div
        className="flex-1 bg-black/40 backdrop-blur-sm"
        onClick={() => navigate(-1)}
      />

      {/* 우측 패널 */}
      <div className="w-full max-w-[400px] bg-white flex flex-col shadow-2xl overflow-y-auto">
        {/* 패널 헤더 */}
        <div className="flex items-center justify-between px-8 pt-8 pb-2">
          <h1 className="text-lg font-medium tracking-wide text-gray-900">Log in</h1>
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 px-8 pb-10 pt-4">
          <form onSubmit={handleSubmit((data) => mutate(data))} className="flex flex-col gap-5">
            {/* 이메일 */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">
                아이디 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                autoComplete="email"
                className={`w-full border-b pb-2 text-sm outline-none transition-colors bg-transparent ${
                  errors.email
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-gray-800'
                }`}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">
                패스워드 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                autoComplete="current-password"
                className={`w-full border-b pb-2 text-sm outline-none transition-colors bg-transparent ${
                  errors.password
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-gray-800'
                }`}
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* 아이디 저장 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberEmail"
                className="w-3.5 h-3.5 border-gray-400 accent-gray-800 cursor-pointer"
                {...register('rememberEmail')}
              />
              <label htmlFor="rememberEmail" className="text-xs text-gray-500 cursor-pointer select-none">
                아이디 저장
              </label>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gray-900 text-white py-3.5 text-sm font-medium tracking-wide hover:bg-black transition-colors disabled:opacity-50 mt-1"
            >
              {isPending ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 아이디/비밀번호 찾기 */}
          <div className="flex items-center gap-2 mt-4">
            <button className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              아이디찾기
            </button>
            <span className="text-gray-300 text-xs">|</span>
            <button className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              비밀번호찾기
            </button>
          </div>

          {/* 소셜 로그인 */}
          <div className="flex flex-col gap-2.5 mt-7">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 bg-[#FEE500] py-3.5 text-sm font-medium text-[#3C1E1E] hover:brightness-95 transition-all"
            >
              <KakaoIcon />
              카카오로 시작하기
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 bg-[#03C75A] py-3.5 text-sm font-medium text-white hover:brightness-95 transition-all"
            >
              <NaverIcon />
              네이버로 시작하기
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 border border-gray-300 bg-white py-3.5 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <AppleIcon />
              APPLE로 로그인
            </button>
          </div>

          {/* 회원가입 */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400">아직 회원이 아니신가요?</span>
              <button className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                비회원 주문조회
              </button>
            </div>
            <Link
              to="/register"
              className="block w-full text-center border border-gray-900 py-3.5 text-sm font-medium text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
            >
              회원가입 후 쇼핑하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
