import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface SuccessOverlayProps {
  title?: string;
  message?: string;
  buttonText?: string;
  onAction: () => void;
}

export function SuccessOverlay({
  title = "添加成功",
  message = "学者信息已成功提交，等待后端服务同步。",
  buttonText = "返回学者列表",
  onAction,
}: SuccessOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full mx-4 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <button
          onClick={onAction}
          className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {buttonText}
        </button>
      </div>
    </motion.div>
  );
}
