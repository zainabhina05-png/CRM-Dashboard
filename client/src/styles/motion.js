/**
 * LeadFlow CRM — Framer Motion preset variants
 *
 * Rules (from design-system.md):
 *  • Purposeful only — enhances UX, never decorates
 *  • Respect prefers-reduced-motion via the `reducedMotion` prop on <MotionConfig>
 *  • Durations: micro 150 ms, standard 250 ms, page 400 ms, stagger 60 ms/item
 *  • Easing: custom spring for entrance, ease-out for exit
 */

/** ─── shared easing ─────────────────────────────────────── */
const ease = {
  out:    [0.16, 1, 0.30, 1],
  in:     [0.40, 0, 1.00, 1],
  spring: [0.34, 1.56, 0.64, 1],
};

/** ─── page / route transitions ─────────────────────────── */
export const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: ease.in },
  },
};

/** ─── modal / drawer ────────────────────────────────────── */
export const modalVariants = {
  initial: { opacity: 0, scale: 0.94, y: 12 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: ease.out },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.18, ease: ease.in },
  },
};

export const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};

/** ─── side panel (detail panel, reminders drawer) ──────── */
export const panelVariants = {
  initial: { opacity: 0, x: 32 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: ease.out },
  },
  exit: {
    opacity: 0,
    x: 32,
    transition: { duration: 0.2, ease: ease.in },
  },
};

/** ─── staggered list container ─────────────────────────── */
export const listContainer = {
  animate: {
    transition: {
      staggerChildren:  0.06,
      delayChildren:    0.05,
    },
  },
};

/** ─── individual list / table row item ─────────────────── */
export const listItem = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.15 },
  },
};

/** ─── Kanban card ───────────────────────────────────────── */
export const kanbanCard = {
  initial:   { opacity: 0, scale: 0.95 },
  animate:   { opacity: 1, scale: 1, transition: { duration: 0.2, ease: ease.out } },
  exit:      { opacity: 0, scale: 0.92, transition: { duration: 0.15 } },
  whileHover: {
    y: -2,
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
    transition: { duration: 0.15 },
  },
  whileTap:  { scale: 0.98, transition: { duration: 0.08 } },
};

/** ─── toast notification ────────────────────────────────── */
export const toastVariants = {
  initial: { opacity: 0, y: 16, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: ease.spring },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.95,
    transition: { duration: 0.18 },
  },
};

/** ─── analytics / stat card entrance ───────────────────── */
export const statCard = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: ease.out },
  },
};

/** ─── analytics grid stagger container ─────────────────── */
export const statGrid = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren:   0.1,
    },
  },
};

/** ─── skeleton → content fade ──────────────────────────── */
export const skeletonFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.35, ease: ease.out } },
};

/** ─── alert / banner ────────────────────────────────────── */
export const alertVariants = {
  initial: { opacity: 0, height: 0, marginBottom: 0 },
  animate: {
    opacity: 1,
    height: 'auto',
    marginBottom: '0.75rem',
    transition: { duration: 0.2, ease: ease.out },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    transition: { duration: 0.15 },
  },
};
