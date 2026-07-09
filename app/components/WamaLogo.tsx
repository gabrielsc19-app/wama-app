type WamaLogoProps = {
  variant?: "dark" | "light";
  type?: "principal" | "horizontal" | "isotipo";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: { mark: 30, word: 18, tagline: 7, gap: 9 },
  md: { mark: 42, word: 24, tagline: 8, gap: 12 },
  lg: { mark: 72, word: 44, tagline: 10, gap: 18 },
};

function Mark({
  size,
  primary,
  accent,
}: {
  size: number;
  primary: string;
  accent: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="WAMA"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path
        d="M25 17H95V61L60 102L25 61V17Z"
        stroke={primary}
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path
        d="M35 78L49 47L60 67L71 47L85 78"
        stroke={primary}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M52 59H68L62 67H58L52 59Z"
        fill={accent}
      />
    </svg>
  );
}

export default function WamaLogo({
  variant = "dark",
  type = "horizontal",
  size = "md",
  className = "",
}: WamaLogoProps) {
  const s = sizes[size];
  const primary = variant === "dark" ? "#F5F6F7" : "#0B0C0E";
  const accent = "#00E5D6";

  if (type === "isotipo") {
    return (
      <span className={className} style={{ display: "inline-flex", alignItems: "center" }}>
        <Mark size={s.mark} primary={primary} accent={accent} />
      </span>
    );
  }

  if (type === "principal") {
    return (
      <span
        className={className}
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 14,
          lineHeight: 1,
        }}
      >
        <Mark size={s.mark * 1.25} primary={primary} accent={accent} />
        <span
          style={{
            color: primary,
            fontSize: s.word,
            letterSpacing: "0.32em",
            fontWeight: 300,
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          WAMA
        </span>
        <span
          style={{
            color: accent,
            fontSize: s.tagline,
            letterSpacing: "0.42em",
            fontWeight: 800,
            textTransform: "uppercase",
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          WARN AND MANAGE
        </span>
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        lineHeight: 1,
      }}
    >
      <Mark size={s.mark} primary={primary} accent={accent} />
      <span style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            color: primary,
            fontSize: s.word,
            letterSpacing: "0.32em",
            fontWeight: 300,
            fontFamily: "Arial, Helvetica, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          WAMA
        </span>
        <span
          style={{
            color: accent,
            fontSize: s.tagline,
            letterSpacing: "0.34em",
            fontWeight: 800,
            textTransform: "uppercase",
            fontFamily: "Arial, Helvetica, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          WARN AND MANAGE
        </span>
      </span>
    </span>
  );
}
