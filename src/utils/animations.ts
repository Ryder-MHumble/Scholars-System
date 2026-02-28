import type { Variants } from "framer-motion";

// 统一的动画配置
export const ANIMATION_CONFIG = {
  duration: 0.4,
  ease: [0.25, 0.1, 0.25, 1] as const,
  staggerChildren: 0.08,
  delayChildren: 0.1,
};

// 淡入动画
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: ANIMATION_CONFIG.duration,
      ease: ANIMATION_CONFIG.ease,
    },
  },
};

// 从下方滑入
export const slideInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration,
      ease: ANIMATION_CONFIG.ease,
    },
  },
};

// 从左侧滑入
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration,
      ease: ANIMATION_CONFIG.ease,
    },
  },
};

// 从右侧滑入
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration,
      ease: ANIMATION_CONFIG.ease,
    },
  },
};

// 缩放淡入
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ANIMATION_CONFIG.duration,
      ease: ANIMATION_CONFIG.ease,
    },
  },
};

// 容器动画（用于stagger效果）
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: ANIMATION_CONFIG.staggerChildren,
      delayChildren: ANIMATION_CONFIG.delayChildren,
    },
  },
};

// 列表项动画
export const listItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration,
      ease: ANIMATION_CONFIG.ease,
    },
  },
};

// Hover效果配置
export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2, ease: "easeOut" as const },
};

export const hoverLift = {
  y: -4,
  transition: { duration: 0.2, ease: "easeOut" as const },
};

export const tapScale = {
  scale: 0.98,
  transition: { duration: 0.1 },
};
