import type { CSSProperties, SVGProps } from "react";

/**
 * Hand-drawn racing icons in the same style as the lucide set (24×24, 2px
 * round strokes in currentColor), for things lucide doesn't have.
 */
type IconProps = { className?: string; style?: CSSProperties; "aria-hidden"?: boolean | "true" | "false" };

function Svg({ children, ...props }: IconProps & { children: React.ReactNode }) {
  const svgProps: SVGProps<SVGSVGElement> = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    width: 24,
    height: 24,
  };
  return (
    <svg {...svgProps} {...props}>
      {children}
    </svg>
  );
}

/** Formula 1 car, side view: front wing, low nose, cockpit with halo, tall rear wing. */
export function F1CarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M1.5 15.5h3l1.5-2h3.5l1.5-2.5h2.5l1 2.5h5l1.5 2" />
      <path d="M19.5 13.5V9" />
      <path d="M18 9h4" />
      <path d="M1.5 17h2" />
      <circle cx="6.5" cy="16.5" r="2.5" />
      <circle cx="17" cy="16.5" r="2.5" />
    </Svg>
  );
}

/** Checkered flag on a pole. */
export function CheckeredFlagIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 22V3" />
      <rect x="4" y="4" width="16" height="10" rx="0.5" />
      <path d="M8 4v10M12 4v10M16 4v10M4 9h16" strokeWidth={1} />
      <path d="M4 4h4v5H4zM12 4h4v5h-4zM8 9h4v5H8zM16 9h4v5h-4z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Racing helmet, side view, with visor. */
export function HelmetIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 15a9 9 0 0 1 18-1v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M12 11h8.5" />
      <path d="M12 11v4h9" />
    </Svg>
  );
}

/** Steering wheel with hub and three spokes. */
export function SteeringWheelIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 14.5V21" />
      <path d="M9.6 11.3 3.3 9.6" />
      <path d="m14.4 11.3 6.3-1.7" />
    </Svg>
  );
}

/** Racing tyre with rim and tread marks. */
export function TyreIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" strokeWidth={1.5} />
    </Svg>
  );
}

/** Start lights: a gantry of five red lights. */
export function StartLightsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="1.5" y="8" width="21" height="8" rx="2" />
      <path d="M12 8V4" />
      <circle cx="5" cy="12" r="1.3" fill="currentColor" />
      <circle cx="8.5" cy="12" r="1.3" fill="currentColor" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="15.5" cy="12" r="1.3" fill="currentColor" />
      <circle cx="19" cy="12" r="1.3" fill="currentColor" />
    </Svg>
  );
}
