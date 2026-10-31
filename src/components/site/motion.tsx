'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

const easeOut = [0.19, 1, 0.22, 1] as const;

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: easeOut, delay },
  }),
};

const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    transition: { duration: 1, ease: easeOut, delay },
  }),
};

const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease: easeOut, delay },
  }),
};

const clipRevealVariants: Variants = {
  hidden: { clipPath: 'inset(100% 0 0 0)' },
  visible: (delay: number = 0) => ({
    clipPath: 'inset(0% 0 0 0)',
    transition: { duration: 1.1, ease: easeOut, delay },
  }),
};

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: 'fadeUp' | 'fadeIn' | 'scaleIn' | 'clipReveal';
  as?: 'div' | 'section' | 'article' | 'span';
}

export function Reveal({
  children,
  className,
  delay = 0,
  variant = 'fadeUp',
  as = 'div',
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const variants =
    variant === 'fadeIn'
      ? fadeInVariants
      : variant === 'scaleIn'
        ? scaleInVariants
        : variant === 'clipReveal'
          ? clipRevealVariants
          : fadeUpVariants;

  const MotionComponent = motion[as];

  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionComponent
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      custom={delay}
    >
      {children}
    </MotionComponent>
  );
}

interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerChildren({ children, className, staggerDelay = 0.1 }: StaggerChildrenProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    const Tag = 'div' as const;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, ease: easeOut },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
