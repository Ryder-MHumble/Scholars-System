import { motion } from "framer-motion";

interface Props {
  scholarName: string;
  researchFields: string[];
}

export function ImpactBanner({ scholarName, researchFields }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-500 rounded-xl overflow-hidden shadow-lg"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="relative px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-3">
              全面呈现【{scholarName}】的学术影响力
            </h2>
            <p className="text-blue-100 text-sm mb-4">
              深度挖掘高质量数据与权威引用，让优秀者得见
            </p>

            {/* Research Fields */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white/90 text-sm font-medium">
                研究兴趣
              </span>
              {researchFields.map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full border border-white/30"
                >
                  <div className="w-2 h-2 rounded-full bg-current" />
                  {field}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0">
            <button className="px-6 py-2.5 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-md">
              查看完整报告
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
