import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import PageTransition from '@/layouts/PageTransition';

export default function NotFoundPage() {
  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-6xl font-bold text-gray-200 mb-4">404</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">页面未找到</h1>
        <p className="text-sm text-gray-500 mb-6">您访问的页面不存在或已被移除</p>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Home className="w-4 h-4" /> 返回首页
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> 返回上页
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
