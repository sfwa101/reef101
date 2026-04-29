/**
 * MeshTile — ultra-lightweight mesh gradient backgrounds (zero images).
 *
 * Each motif maps to:
 *  - a CSS-only mesh (3 radial-gradients layered over a base color)
 *  - an "ink" foreground color tuned for legibility on the mesh
 *  - an inline SVG icon glyph
 *
 * Everything renders instantly — no network requests, no decoding.
 */

import type { SVGProps } from "react";

export type MotifId =
  | "village" | "supermarket" | "kitchen" | "produce"
  | "dairy" | "meat" | "restaurants" | "sweets" | "baskets" | "recipes"
  | "pharmacy" | "library" | "home" | "gifts"
  | "subs" | "wholesale";

type Mesh = {
  /** background CSS — three radial gradients on top of a base */
  bg: string;
  /** foreground ink color (HSL string without hsl()) */
  ink: string;
  /** soft chip tint behind the title */
  chip: string;
};

/* Pastel mesh palettes — soft, premium, GPU-cheap */
const MESH: Record<MotifId, Mesh> = {
  village: {
    bg:
      "radial-gradient(at 20% 18%, hsl(40 78% 86%) 0px, transparent 55%)," +
      "radial-gradient(at 82% 12%, hsl(28 70% 80%) 0px, transparent 55%)," +
      "radial-gradient(at 65% 88%, hsl(45 65% 88%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(42 70% 92%), hsl(35 60% 86%))",
    ink: "28 50% 24%",
    chip: "40 80% 96%",
  },
  supermarket: {
    bg:
      "radial-gradient(at 18% 22%, hsl(150 55% 84%) 0px, transparent 55%)," +
      "radial-gradient(at 78% 14%, hsl(140 50% 80%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 90%, hsl(155 50% 88%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(145 55% 92%), hsl(155 45% 84%))",
    ink: "150 40% 20%",
    chip: "150 60% 96%",
  },
  kitchen: {
    bg:
      "radial-gradient(at 22% 18%, hsl(22 80% 86%) 0px, transparent 55%)," +
      "radial-gradient(at 80% 16%, hsl(14 75% 82%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 88%, hsl(28 70% 90%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(22 82% 93%), hsl(12 70% 84%))",
    ink: "16 50% 24%",
    chip: "22 80% 96%",
  },
  produce: {
    bg:
      "radial-gradient(at 18% 18%, hsl(95 60% 84%) 0px, transparent 55%)," +
      "radial-gradient(at 82% 14%, hsl(85 55% 78%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 90%, hsl(100 55% 88%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(98 65% 92%), hsl(85 55% 82%))",
    ink: "100 40% 20%",
    chip: "98 70% 96%",
  },
  dairy: {
    bg:
      "radial-gradient(at 20% 20%, hsl(48 88% 90%) 0px, transparent 55%)," +
      "radial-gradient(at 80% 14%, hsl(38 80% 84%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 88%, hsl(45 75% 92%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(48 85% 94%), hsl(38 70% 86%))",
    ink: "32 45% 24%",
    chip: "48 90% 97%",
  },
  meat: {
    bg:
      "radial-gradient(at 18% 18%, hsl(8 70% 86%) 0px, transparent 55%)," +
      "radial-gradient(at 82% 14%, hsl(355 60% 82%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 88%, hsl(12 65% 90%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(10 70% 93%), hsl(0 55% 84%))",
    ink: "5 45% 26%",
    chip: "10 80% 97%",
  },
  restaurants: {
    bg:
      "radial-gradient(at 20% 18%, hsl(200 55% 86%) 0px, transparent 55%)," +
      "radial-gradient(at 82% 12%, hsl(190 50% 80%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 90%, hsl(205 55% 90%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(200 55% 92%), hsl(190 45% 82%))",
    ink: "210 40% 22%",
    chip: "200 65% 96%",
  },
  sweets: {
    bg:
      "radial-gradient(at 18% 20%, hsl(335 80% 90%) 0px, transparent 55%)," +
      "radial-gradient(at 82% 14%, hsl(310 65% 84%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 90%, hsl(345 70% 92%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(335 80% 94%), hsl(310 65% 84%))",
    ink: "325 45% 28%",
    chip: "335 80% 97%",
  },
  baskets: {
    bg:
      "radial-gradient(at 20% 18%, hsl(42 85% 88%) 0px, transparent 55%)," +
      "radial-gradient(at 80% 14%, hsl(28 70% 80%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 90%, hsl(42 80% 92%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(42 85% 92%), hsl(28 70% 82%))",
    ink: "32 50% 24%",
    chip: "42 85% 97%",
  },
  recipes: {
    bg:
      "radial-gradient(at 18% 18%, hsl(15 80% 88%) 0px, transparent 55%)," +
      "radial-gradient(at 82% 14%, hsl(5 65% 82%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 90%, hsl(20 70% 92%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(15 80% 92%), hsl(5 65% 82%))",
    ink: "10 45% 24%",
    chip: "15 80% 97%",
  },
  pharmacy: {
    bg:
      "radial-gradient(at 20% 18%, hsl(195 75% 88%) 0px, transparent 55%)," +
      "radial-gradient(at 82% 14%, hsl(180 60% 82%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 90%, hsl(195 70% 92%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(195 75% 93%), hsl(180 60% 84%))",
    ink: "200 45% 22%",
    chip: "195 80% 97%",
  },
  library: {
    bg:
      "radial-gradient(at 18% 20%, hsl(260 65% 90%) 0px, transparent 55%)," +
      "radial-gradient(at 82% 14%, hsl(245 55% 84%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 88%, hsl(265 60% 92%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(260 65% 93%), hsl(245 55% 84%))",
    ink: "260 40% 26%",
    chip: "260 70% 97%",
  },
  home: {
    bg:
      "radial-gradient(at 18% 18%, hsl(180 55% 86%) 0px, transparent 55%)," +
      "radial-gradient(at 82% 14%, hsl(195 50% 82%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 90%, hsl(185 55% 90%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(180 55% 92%), hsl(195 50% 84%))",
    ink: "190 40% 22%",
    chip: "185 65% 97%",
  },
  gifts: {
    bg:
      "radial-gradient(at 20% 20%, hsl(345 70% 90%) 0px, transparent 55%)," +
      "radial-gradient(at 80% 14%, hsl(325 60% 84%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 88%, hsl(350 65% 92%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(345 75% 93%), hsl(325 60% 84%))",
    ink: "335 45% 28%",
    chip: "345 80% 97%",
  },
  subs: {
    bg:
      "radial-gradient(at 20% 18%, hsl(265 65% 88%) 0px, transparent 55%)," +
      "radial-gradient(at 82% 12%, hsl(280 55% 82%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 90%, hsl(255 60% 92%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(265 70% 93%), hsl(280 55% 84%))",
    ink: "270 42% 26%",
    chip: "265 75% 97%",
  },
  wholesale: {
    bg:
      "radial-gradient(at 18% 18%, hsl(215 55% 86%) 0px, transparent 55%)," +
      "radial-gradient(at 82% 14%, hsl(225 50% 80%) 0px, transparent 55%)," +
      "radial-gradient(at 60% 90%, hsl(45 70% 88%) 0px, transparent 55%)," +
      "linear-gradient(135deg, hsl(218 60% 92%), hsl(225 50% 82%))",
    ink: "220 40% 22%",
    chip: "218 70% 97%",
  },
};

export const motifInk = (id: MotifId): string => `hsl(${MESH[id].ink})`;
export const motifChip = (id: MotifId): string => `hsl(${MESH[id].chip} / 0.78)`;

export const MeshBg = ({ motif }: { motif: MotifId }) => (
  <div
    aria-hidden
    className="absolute inset-0"
    style={{ background: MESH[motif].bg }}
  />
);

/* ------------------------------------------------------------------ */
/* Inline SVG glyphs — tiny, currentColor                             */
/* ------------------------------------------------------------------ */

type GlyphProps = SVGProps<SVGSVGElement>;
const G = (props: GlyphProps & { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {props.children}
  </svg>
);

const Glyphs: Record<MotifId, (p: GlyphProps) => JSX.Element> = {
  village: (p) => (
    <G {...p}>
      <path d="M3 21V10l9-6 9 6v11" />
      <path d="M9 21v-6h6v6" />
      <path d="M3 21h18" />
    </G>
  ),
  supermarket: (p) => (
    <G {...p}>
      <path d="M3 5h2l2.5 11h11L21 8H6.5" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
    </G>
  ),
  kitchen: (p) => (
    <G {...p}>
      <path d="M5 11c0-3.5 3-6 7-6s7 2.5 7 6H5z" />
      <path d="M5 11h14v3a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-3z" />
      <path d="M3 21h18" />
    </G>
  ),
  produce: (p) => (
    <G {...p}>
      <path d="M12 21c-5 0-8-3.5-8-8 0-3 2-5 5-5 1.5 0 2.5.5 3 1 .5-.5 1.5-1 3-1 3 0 5 2 5 5 0 4.5-3 8-8 8z" />
      <path d="M12 8c0-2 1-4 3-5" />
    </G>
  ),
  dairy: (p) => (
    <G {...p}>
      <path d="M8 3h8l-1 4v3l1.5 4v6a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-6L9 10V7L8 3z" />
      <path d="M9 7h6" />
    </G>
  ),
  meat: (p) => (
    <G {...p}>
      <path d="M16 4c2.5 0 4 1.5 4 4 0 2-1.5 3-3 3 0 4-3 8-8 8-4 0-7-3-7-7 0-5 4-8 9-8 1.5 0 3 .3 4 1z" />
      <circle cx="9" cy="13" r="1.3" />
    </G>
  ),
  restaurants: (p) => (
    <G {...p}>
      <path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10" />
      <path d="M17 3c-2 0-3 2-3 5s1 4 3 4v9" />
    </G>
  ),
  sweets: (p) => (
    <G {...p}>
      <path d="M12 4c-3 0-5 2-5 5 0 1 .3 2 .8 3l-1 5 5-1c.5.2 1.2.3 2 .3 3 0 5-2 5-5s-2-5-5-5c-.7 0-1.4.1-2 .4" />
      <circle cx="11" cy="10" r="0.7" fill="currentColor" />
      <circle cx="14" cy="13" r="0.7" fill="currentColor" />
    </G>
  ),
  baskets: (p) => (
    <G {...p}>
      <path d="M3 9h18l-2 11H5L3 9z" />
      <path d="M8 9l3-5M16 9l-3-5" />
      <path d="M3 9h18" />
    </G>
  ),
  recipes: (p) => (
    <G {...p}>
      <path d="M6 4h10l3 3v13H6z" />
      <path d="M9 9h7M9 13h7M9 17h5" />
    </G>
  ),
  pharmacy: (p) => (
    <G {...p}>
      <rect x="3" y="9" width="18" height="6" rx="3" />
      <path d="M12 9v6" />
      <path d="M9 6V3M15 6V3M9 21v-3M15 21v-3" />
    </G>
  ),
  library: (p) => (
    <G {...p}>
      <path d="M4 5h6a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H4z" />
      <path d="M20 5h-6a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h6z" />
    </G>
  ),
  home: (p) => (
    <G {...p}>
      <path d="M14 4l6 6-7 7-6 1 1-6z" />
      <path d="M3 21h18" />
    </G>
  ),
  gifts: (p) => (
    <G {...p}>
      <rect x="4" y="9" width="16" height="11" rx="1.5" />
      <path d="M4 13h16M12 9v11" />
      <path d="M8.5 9c-1.5 0-2.5-1-2.5-2.5S7 4 8.5 4 12 6 12 9c0-3 2-5 3.5-5S18 5 18 6.5 17 9 15.5 9" />
    </G>
  ),
  subs: (p) => (
    <G {...p}>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v5h-5" />
    </G>
  ),
  wholesale: (p) => (
    <G {...p}>
      <path d="M3 8l9-4 9 4-9 4-9-4z" />
      <path d="M3 8v8l9 4 9-4V8" />
      <path d="M12 12v8" />
    </G>
  ),
};

export const MotifIcon = ({
  motif,
  className,
}: {
  motif: MotifId;
  className?: string;
}) => {
  const Icon = Glyphs[motif];
  return <Icon className={className} />;
};
