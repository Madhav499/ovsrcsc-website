'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * Hairline reading-progress rail along the top edge of the viewport.
 * A single scaleX transform, so it costs nothing per frame. Decorative.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5 origin-left bg-[linear-gradient(90deg,var(--mx-cyan),var(--mx-teal),var(--mx-amber))] motion-reduce:hidden"
    />
  );
}
