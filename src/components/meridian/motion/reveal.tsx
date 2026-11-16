'use client';

import { motion, MotionConfig, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

const EASE_OUT = [0.19, 1, 0.22, 1] as const;

/** Site-wide motion settings: honours the visitor's reduced-motion preference. */
export function MeridianMotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

const VARIANTS: Record<'up' | 'fade' | 'mask', Variants> = {
  up: {
    hidden: { opacity: 0, y: 32 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.9, ease: EASE_OUT, delay },
    }),
  },
  fade: {
    hidden: { opacity: 0 },
    visible: (delay: number) => ({
      opacity: 1,
      transition: { duration: 1.1, ease: EASE_OUT, delay },
    }),
  },
  mask: {
    hidden: { clipPath: 'inset(12% 0% 12% 0%)', opacity: 0.4 },
    visible: (delay: number) => ({
      clipPath: 'inset(0% 0% 0% 0%)',
      opacity: 1,
      transition: { duration: 1.3, ease: EASE_OUT, delay },
    }),
  },
};

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: keyof typeof VARIANTS;
  as?: 'div' | 'li' | 'article' | 'figure' | 'section';
}

/** Scroll-triggered entrance for below-the-fold content. Plays once. */
export function Reveal({ children, className, delay = 0, variant = 'up', as = 'div' }: RevealProps) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      variants={VARIANTS[variant]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      custom={delay}
    >
      {children}
    </Component>
  );
}

/** Parent that staggers its `StaggerItem` children as they scroll into view. */
export function Stagger({
  children,
  className,
  gap = 0.08,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  as?: 'div' | 'ul' | 'ol';
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'article';
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT } },
      }}
    >
      {children}
    </Component>
  );
}
