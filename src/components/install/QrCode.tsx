import { useMemo } from "react";
import { encode } from "uqr";

interface QrCodeProps {
  value: string;
  size?: number;
  color?: string;
  background?: string;
}

/** QR code drawn as one SVG path (no canvas, no inline HTML). */
export default function QrCode({
  value,
  size = 168,
  color = "#1A1033",
  background = "#FFFFFF",
}: QrCodeProps) {
  const { path, modules } = useMemo(() => {
    // A 4-module quiet zone is required by the QR specification for scanners.
    const { data, size: count } = encode(value, { ecc: "M", border: 4 });
    const segments: string[] = [];
    data.forEach((row, y) =>
      row.forEach((dark, x) => {
        if (dark) segments.push(`M${x} ${y}h1v1h-1z`);
      }),
    );
    return { path: segments.join(""), modules: count };
  }, [value]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${modules} ${modules}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code pour ouvrir ${value}`}
    >
      <rect width={modules} height={modules} fill={background} />
      <path d={path} fill={color} />
    </svg>
  );
}
