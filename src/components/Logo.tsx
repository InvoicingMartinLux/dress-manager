const NAVY = "#1E2B3C";
const TAN = "#C0A98D";
const CREAM = "#FAF8F4";

/** Hanging garment silhouette with its hanger hook. */
function Garment({ cx, fill }: { cx: number; fill: string }) {
  const hw = 8.5;
  return (
    <g>
      {/* hanger hook over the rail */}
      <path
        d={`M${cx} 41V34.5q0-3.4 3.4-3.4t3.4 3.4`}
        stroke={NAVY}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* body: sloped shoulders tapering to the hem */}
      <path
        d={`M${cx - hw} 46.5C${cx - hw} 41 ${cx + hw} 41 ${cx + hw} 46.5L${cx + hw - 1.6} 74H${cx - hw + 1.6}Z`}
        fill={fill}
        stroke={NAVY}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {/* opening down the front */}
      <path
        d={`M${cx} 47.5V72.5`}
        stroke={fill === NAVY ? CREAM : NAVY}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity={fill === NAVY ? 0.55 : 0.5}
      />
    </g>
  );
}

/** The wardrobe mark from the Dress Manager logo. */
export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 122"
      className={className}
      role="img"
      aria-label="Dress Manager"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* cabinet body */}
      <rect
        x="10"
        y="6"
        width="100"
        height="104"
        rx="9"
        fill="#fff"
        stroke={NAVY}
        strokeWidth="4.5"
      />

      {/* rail the garments hang from */}
      <path d="M17 34h46" stroke={NAVY} strokeWidth="2.6" strokeLinecap="round" />

      <Garment cx={25.5} fill={TAN} />
      <Garment cx={40} fill={CREAM} />
      <Garment cx={54.5} fill={NAVY} />

      <g stroke={NAVY} strokeWidth="3.6" strokeLinecap="round">
        {/* divider between hanging space and door */}
        <path d="M70 8v100" />
        {/* top strip, shelf above the drawers, and the drawer split */}
        <path d="M12 26h56" />
        <path d="M12 78h56" />
        <path d="M12 94h56" />
        {/* drawer handles */}
        <path d="M31 86h18" />
        <path d="M31 102h18" />
        {/* door handle */}
        <path d="M78 54v12" />
        {/* feet */}
        <path d="M23 110v8" />
        <path d="M97 110v8" />
      </g>
    </svg>
  );
}
