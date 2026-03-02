/**
 * 通用加载旋转器组件
 * 三个页面各自实现了相同的 animate-spin 旋转器，现统一提取
 */
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}
