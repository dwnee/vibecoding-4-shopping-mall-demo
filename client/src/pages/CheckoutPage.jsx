import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Lock, CreditCard, Landmark, ShoppingBag } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { ordersApi } from '../api/orders';
import toast from 'react-hot-toast';

const DELIVERY_NOTES = [
  '문 앞에 놓아주세요',
  '경비실에 맡겨주세요',
  '택배함에 넣어주세요',
  '배송 전 연락 주세요',
];

const schema = z
  .object({
    ordererName: z.string().min(1, '주문자 이름을 입력해주세요.'),
    ordererPhone: z
      .string()
      .min(1, '주문자 연락처를 입력해주세요.')
      .regex(/^[0-9]{10,11}$/, '숫자만 10~11자리로 입력해주세요.'),
    sameAsOrderer: z.boolean(),
    recipient: z.string().optional(),
    recipientPhone: z.string().optional(),
    zipCode: z.string().min(1, '우편번호를 입력해주세요.'),
    city: z.string().min(1, '시/도를 입력해주세요.'),
    street: z.string().min(1, '주소를 입력해주세요.'),
    detail: z.string().optional(),
    deliveryNote: z.string().optional(),
    paymentMethod: z.enum(['card', 'bank_transfer', 'kakao_pay']),
  })
  .superRefine((data, ctx) => {
    if (!data.sameAsOrderer) {
      if (!data.recipient?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '수령인 이름을 입력해주세요.',
          path: ['recipient'],
        });
      }
      if (!data.recipientPhone?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '수령인 연락처를 입력해주세요.',
          path: ['recipientPhone'],
        });
      }
    }
  });

const fieldClass = (hasError) =>
  `w-full border-b pb-2 text-sm outline-none transition-colors bg-transparent ${
    hasError ? 'border-red-400' : 'border-gray-300 focus:border-gray-900'
  }`;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const itemsPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingPrice = 0;
  const totalPrice = itemsPrice + shippingPrice;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      ordererName: user?.name || '',
      ordererPhone: '',
      sameAsOrderer: true,
      recipient: '',
      recipientPhone: '',
      zipCode: user?.address?.zipCode || '',
      city: user?.address?.city || '',
      street: user?.address?.street || '',
      detail: '',
      deliveryNote: '',
      paymentMethod: 'card',
    },
  });

  const sameAsOrderer = watch('sameAsOrderer');
  const paymentMethod = watch('paymentMethod');

  const orderDoneRef = useRef(false);


  // 장바구니 비었으면 /cart로 리다이렉트 (주문 완료 후는 제외)
  useEffect(() => {
    if (!orderDoneRef.current && items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [items.length, navigate]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data) => ordersApi.create(data),
  });

  const onSubmit = async (data) => {
    const PortOne = window.PortOne;
    if (!PortOne) {
      toast.error('결제 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
      return;
    }

    const orderName =
      items.length > 1 ? `${items[0].name} 외 ${items.length - 1}건` : items[0].name;

    const payMethodMap = { card: 'CARD', bank_transfer: 'TRANSFER', kakao_pay: 'EASY_PAY' };

    let response;
    try {
      response = await PortOne.requestPayment({
        storeId: 'store-e3781a77-ba23-4e18-a9df-bfbf7bb5b246',
        channelKey: 'channel-key-532b7128-abc2-42fd-8f3e-1fa444eb7fc1',
        paymentId: `payment-${Date.now()}`,
        orderName,
        totalAmount: totalPrice,
        currency: 'CURRENCY_KRW',
        payMethod: payMethodMap[data.paymentMethod],
        customer: {
          fullName: data.ordererName,
          phoneNumber: data.ordererPhone,
          email: user?.email || '',
        },
      });
    } catch (err) {
      console.error('PortOne 오류:', err);
      navigate('/order/fail', {
        replace: true,
        state: { message: err?.message || '결제 중 오류가 발생했습니다.', canRetry: true },
      });
      return;
    }

    // code 필드가 있으면 취소 또는 실패 (paymentId 유무와 무관)
    if (response?.code) {
      const CANCEL_CODES = ['USER_CANCEL', 'PAYMENT_CANCELLED'];
      if (CANCEL_CODES.includes(response.code)) {
        toast('결제가 취소되었습니다.', { icon: 'ℹ️' });
      } else {
        navigate('/order/fail', {
          replace: true,
          state: { message: response.message || '결제에 실패했습니다.', canRetry: true },
        });
      }
      return;
    }

    // paymentId 없으면 알 수 없는 오류
    if (!response?.paymentId) {
      navigate('/order/fail', {
        replace: true,
        state: { message: '결제 처리 중 알 수 없는 오류가 발생했습니다.', canRetry: true },
      });
      return;
    }

    // 결제 성공 → 서버에 주문 저장
    try {
      const result = await mutateAsync({
        items: items.map((item) => ({
          product: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.images?.[0] || '',
        })),
        ordererName: data.ordererName,
        ordererPhone: data.ordererPhone,
        shippingAddress: {
          recipient: data.sameAsOrderer ? data.ordererName : data.recipient,
          phone: data.sameAsOrderer ? data.ordererPhone : data.recipientPhone,
          zipCode: data.zipCode,
          city: data.city,
          street: data.street,
          detail: data.detail || '',
          deliveryNote: data.deliveryNote || '',
        },
        paymentMethod: data.paymentMethod,
        itemsPrice,
        shippingPrice,
        totalPrice,
        impUid: response.paymentId,
        merchantUid: response.paymentId,
      });

      // 성공: 빈 장바구니 → useEffect 리다이렉트 방지 후 성공 페이지로 이동
      orderDoneRef.current = true;
      clearCart();
      navigate('/order/success', { replace: true, state: { order: result.data.order } });
    } catch (err) {
      console.error('주문 저장 오류:', err);
      const msg = err.response?.data?.message || err.message || '주문 저장에 실패했습니다.';
      navigate('/order/fail', { replace: true, state: { message: msg, canRetry: true } });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate('/cart')}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">주문하기</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ── 왼쪽: 입력 폼 ── */}
          <form
            id="checkout-form"
            onSubmit={handleSubmit(onSubmit)}
            className="lg:col-span-2 flex flex-col gap-5"
          >
            {/* 1. 주문자 정보 */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <SectionTitle step={1} title="주문자 정보" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <FieldWrap label="이름" required error={errors.ordererName?.message}>
                  <input
                    className={fieldClass(!!errors.ordererName)}
                    placeholder="홍길동"
                    {...register('ordererName')}
                  />
                </FieldWrap>
                <FieldWrap label="연락처" required error={errors.ordererPhone?.message}>
                  <input
                    className={fieldClass(!!errors.ordererPhone)}
                    placeholder="01012345678"
                    {...register('ordererPhone')}
                  />
                </FieldWrap>
              </div>
            </section>

            {/* 2. 배송지 정보 */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <SectionTitle step={2} title="배송지 정보" />
                <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 accent-gray-900"
                    {...register('sameAsOrderer')}
                  />
                  주문자와 동일
                </label>
              </div>

              {!sameAsOrderer && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 pb-5 mb-5 border-b border-gray-100">
                  <FieldWrap label="수령인 이름" required error={errors.recipient?.message}>
                    <input
                      className={fieldClass(!!errors.recipient)}
                      placeholder="홍길동"
                      {...register('recipient')}
                    />
                  </FieldWrap>
                  <FieldWrap label="수령인 연락처" required error={errors.recipientPhone?.message}>
                    <input
                      className={fieldClass(!!errors.recipientPhone)}
                      placeholder="01012345678"
                      {...register('recipientPhone')}
                    />
                  </FieldWrap>
                </div>
              )}

              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-5 gap-3">
                  <FieldWrap label="우편번호" required error={errors.zipCode?.message} className="col-span-2">
                    <input
                      className={fieldClass(!!errors.zipCode)}
                      placeholder="12345"
                      {...register('zipCode')}
                    />
                  </FieldWrap>
                  <FieldWrap label="시/도" required error={errors.city?.message} className="col-span-3">
                    <input
                      className={fieldClass(!!errors.city)}
                      placeholder="서울특별시"
                      {...register('city')}
                    />
                  </FieldWrap>
                </div>
                <FieldWrap label="주소" required error={errors.street?.message}>
                  <input
                    className={fieldClass(!!errors.street)}
                    placeholder="강남구 테헤란로 123"
                    {...register('street')}
                  />
                </FieldWrap>
                <FieldWrap label="상세주소">
                  <input
                    className={fieldClass(false)}
                    placeholder="101동 202호 (선택)"
                    {...register('detail')}
                  />
                </FieldWrap>
                <FieldWrap label="배송 요청사항">
                  <select
                    className="w-full border-b pb-2 text-sm outline-none transition-colors bg-transparent border-gray-300 focus:border-gray-900 text-gray-700"
                    {...register('deliveryNote')}
                  >
                    <option value="">선택 안함</option>
                    {DELIVERY_NOTES.map((note) => (
                      <option key={note} value={note}>
                        {note}
                      </option>
                    ))}
                  </select>
                </FieldWrap>
              </div>
            </section>

            {/* 3. 결제 수단 */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <SectionTitle step={3} title="결제 수단" />
              <div className="flex flex-col gap-3">
                <PaymentOption
                  value="card"
                  current={paymentMethod}
                  label="신용/체크카드"
                  icon={<CreditCard className="w-5 h-5 text-gray-700" />}
                  register={register}
                />
                <PaymentOption
                  value="bank_transfer"
                  current={paymentMethod}
                  label="계좌이체"
                  icon={<Landmark className="w-5 h-5 text-gray-700" />}
                  register={register}
                />
                <PaymentOption
                  value="kakao_pay"
                  current={paymentMethod}
                  label="카카오페이"
                  icon={
                    <span className="w-5 h-5 bg-[#FEE500] rounded text-[10px] font-extrabold text-[#3C1E1E] flex items-center justify-center flex-shrink-0">
                      K
                    </span>
                  }
                  register={register}
                />
              </div>
            </section>

            {/* 모바일 전용 결제 버튼 */}
            <button
              type="submit"
              disabled={isPending}
              className="lg:hidden w-full bg-gray-900 text-white py-4 rounded-xl text-sm font-medium tracking-wide hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {isPending ? '처리 중...' : `₩${totalPrice.toLocaleString()} 결제하기`}
            </button>
          </form>

          {/* ── 오른쪽: 주문 요약 ── */}
          <aside className="lg:col-span-1 sticky top-20">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                주문 요약
              </h2>

              {/* 상품 목록 */}
              <ul className="flex flex-col gap-3 mb-4">
                {items.map((item) => (
                  <li key={item._id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">
                            📦
                          </div>
                        )}
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 bg-gray-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">₩{item.price.toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                      ₩{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>

              {/* 금액 요약 */}
              <div className="border-t border-gray-100 pt-4 flex flex-col gap-2 text-sm mb-4">
                <div className="flex justify-between text-gray-500">
                  <span>상품금액</span>
                  <span>₩{itemsPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>배송비</span>
                  <span>
                    {shippingPrice === 0 ? (
                      <span className="text-green-600 font-medium">무료</span>
                    ) : (
                      `₩${shippingPrice.toLocaleString()}`
                    )}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-5">
                <div className="flex justify-between items-center font-bold text-base">
                  <span>총 결제금액</span>
                  <span>₩{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* 데스크탑 결제 버튼 */}
              <button
                type="submit"
                form="checkout-form"
                disabled={isPending}
                className="hidden lg:flex w-full bg-gray-900 text-white py-4 rounded-xl text-sm font-medium tracking-wide hover:bg-black transition-colors disabled:opacity-50 items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {isPending ? '처리 중...' : `₩${totalPrice.toLocaleString()} 결제하기`}
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <Lock className="w-3 h-3" />
                SSL 암호화로 안전하게 보호됩니다
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ step, title }) {
  return (
    <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2.5">
      <span className="w-6 h-6 bg-gray-900 text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">
        {step}
      </span>
      {title}
    </h2>
  );
}

function FieldWrap({ label, required, error, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs text-gray-500">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function PaymentOption({ value, current, label, icon, register }) {
  const isSelected = current === value;
  return (
    <label
      className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
        isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <input
        type="radio"
        value={value}
        className="accent-gray-900 w-4 h-4 flex-shrink-0"
        {...register('paymentMethod')}
      />
      {icon}
      <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
        {label}
      </span>
    </label>
  );
}
