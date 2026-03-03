import { motion } from "framer-motion";
import { Mail, Phone, Globe, ExternalLink, X } from "lucide-react";

interface ContactModalProps {
  email?: string;
  phone?: string;
  profileUrl?: string;
  onClose: () => void;
}

export function ContactModal({
  email,
  phone,
  profileUrl,
  onClose,
}: ContactModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-gray-900">
            联系方式
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {email && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Mail className="w-5 h-5 text-primary-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">邮箱</p>
                <a
                  href={`mailto:${email}`}
                  className="text-sm text-primary-600 hover:underline break-all"
                >
                  {email}
                </a>
              </div>
            </div>
          )}

          {phone && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Phone className="w-5 h-5 text-primary-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">电话</p>
                <a
                  href={`tel:${phone}`}
                  className="text-sm text-primary-600 hover:underline break-all"
                >
                  {phone}
                </a>
              </div>
            </div>
          )}

          {profileUrl && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <Globe className="w-5 h-5 text-primary-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">个人主页</p>
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:underline break-all flex items-center gap-1"
                >
                  {profileUrl}
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            </div>
          )}

          {!email && !phone && !profileUrl && (
            <p className="text-sm text-gray-500 text-center py-6">
              暂无联系方式
            </p>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            关闭
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
