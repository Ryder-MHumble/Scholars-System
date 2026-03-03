/**
 * 高校院系侧边栏骨架加载器
 */
import { motion } from "framer-motion";

export function UniversitySidebarSkeleton() {
  return (
    <div className="w-full space-y-1">
      {/* Search bar skeleton */}
      <div className="px-3 pt-4 pb-2">
        <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
        <div className="h-8 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>

      {/* Tree items skeleton */}
      <nav className="space-y-1 px-3">
        {/* "全部院校" button skeleton */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="h-8 bg-gray-100 rounded-md"
        />

        {/* University items skeleton */}
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            {/* University skeleton */}
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.1,
              }}
              className="h-7 bg-gray-100 rounded-md flex items-center gap-2"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-gray-300 ml-1" />
              <div className="flex-1 h-4 bg-gray-200 rounded w-24" />
            </motion.div>

            {/* Department items skeleton */}
            {[0, 1].map((j) => (
              <motion.div
                key={j}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: (i + j) * 0.08,
                }}
                className="h-6 bg-gray-50 rounded-md ml-4 flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded bg-gray-300 ml-1" />
                <div className="flex-1 h-3 bg-gray-200 rounded w-20" />
              </motion.div>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
}
