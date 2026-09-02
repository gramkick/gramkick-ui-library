import { createIcon } from "../create-icon";

/**
 * The GramKick brand mark — a "G" ring, open at the lower right, with an inward
 * crossbar. Monochrome and driven by `currentColor` like every other icon, so it
 * tints with `text-*`. For a filled app-icon (favicon / PWA tile) set it in white
 * on a `leaf` → `leaf-dark` gradient square.
 */
export const GramKickIcon = createIcon(
  "GramKickIcon",
  <>
    <path d="M20 12A8 8 0 1 0 17.6 17.7" />
    <path d="M20 12h-5" />
  </>,
);
