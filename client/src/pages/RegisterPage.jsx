import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다.'),
  email: z.string().email('유효한 이메일을 입력해주세요.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
  confirmPassword: z.string(),
  user_type: z.enum(['customer', 'admin'], { message: '유저 타입을 선택해주세요.' }),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { user_type: 'customer' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: ({ name, email, password, user_type, address }) =>
      authApi.register({ name, email, password, user_type, address }),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.token);
      toast.success('회원가입이 완료되었습니다!');
      navigate('/');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || '회원가입에 실패했습니다.');
    },
  });

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">회원가입</h1>
        <form onSubmit={handleSubmit(mutate)} className="flex flex-col gap-4">

          <Input
            label="이름"
            placeholder="홍길동"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="이메일"
            type="email"
            placeholder="example@email.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="비밀번호 확인"
            type="password"
            placeholder="••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">유저 타입</label>
            <select
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white ${
                errors.user_type ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              {...register('user_type')}
            >
              <option value="customer">Customer (일반 고객)</option>
              <option value="admin">Admin (관리자)</option>
            </select>
            {errors.user_type && (
              <p className="text-xs text-red-500">{errors.user_type.message}</p>
            )}
          </div>

          <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-700">주소 <span className="text-gray-400 font-normal">(선택)</span></p>
            <Input
              placeholder="도로명 주소"
              error={errors.address?.street?.message}
              {...register('address.street')}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="도시"
                error={errors.address?.city?.message}
                {...register('address.city')}
              />
              <Input
                placeholder="우편번호"
                error={errors.address?.zipCode?.message}
                {...register('address.zipCode')}
              />
            </div>
          </div>

          <Button type="submit" isLoading={isPending} className="w-full mt-2">
            회원가입
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}
