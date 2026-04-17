import { useLocation, useNavigate } from 'react-router-dom';
import { XCircle, RotateCcw, Home, Mail, Phone } from 'lucide-react';

export default function OrderFailPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const message = state?.message || '알 수 없는 오류가 발생했습니다.';
  const canRetry = state?.canRetry !== false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-center">
          <h1 className="text-sm font-semibold text-gray-700 tracking-widest uppercase">
            Order Failed
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-5">
        {/* 실패 아이콘 + 타이틀 */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">주문이 실패했습니다.</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            결제 처리 중 문제가 발생하여 주문을 완료하지 못했습니다.<br />
            아래 오류 내용을 확인하고 다시 시도해주세요.
          </p>
        </div>

        {/* 오류 내용 */}
        <div className="bg-red-50 rounded-2xl border border-red-100 px-5 py-4">
          <p className="text-xs font-semibold text-red-400 mb-1">오류 내용</p>
          <p className="text-sm text-red-700 font-medium">{message}</p>
        </div>

        {/* 안내 사항 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">이런 경우 확인해보세요</h3>
          <ul className="flex flex-col gap-3">
            {[
              '카드 한도 또는 잔액이 충분한지 확인해주세요.',
              '결제 정보(카드번호, 유효기간 등)가 정확한지 확인해주세요.',
              '결제사 서버 점검 중일 수 있습니다. 잠시 후 다시 시도해주세요.',
              '문제가 반복되면 고객센터로 문의해주세요.',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-gray-300 text-sm flex-shrink-0 mt-0.5">•</span>
                <p className="text-sm text-gray-600">{text}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* 버튼 */}
        <div className="flex flex-col gap-3">
          {canRetry && (
            <button
              onClick={() => navigate('/checkout')}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-xl text-sm font-medium hover:bg-black transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              다시 주문하기
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 py-4 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            홈으로 돌아가기
          </button>
        </div>

        {/* 문의 */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 px-5 py-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">문의사항이 있으신가요?</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">이메일</p>
                <p className="text-xs text-gray-700 font-medium">support@shop.com</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">전화</p>
                <p className="text-xs text-gray-700 font-medium">1588-0000</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
