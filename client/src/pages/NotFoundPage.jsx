import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center py-24">
      <h1 className="text-8xl font-bold text-indigo-100 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">페이지를 찾을 수 없습니다</h2>
      <p className="text-gray-500 mb-8">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
      <Link to="/"><Button>홈으로 돌아가기</Button></Link>
    </div>
  );
}
