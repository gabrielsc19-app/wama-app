type WamaLogoProps = {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
};

export default function WamaLogo({
  variant = "dark",
  size = "md",
  showTagline = true,
}: WamaLogoProps) {
  const isDark = variant === "dark";

  const sizes = {
    sm: {
      mark: 38,
      word: "text-lg",
      tagline: "text-[9px]",
      gap: "gap-2",
    },
    md: {
      mark: 54,
      word: "text-2xl",
      tagline: "text-[10px]",
      gap: "gap-3",
    },
    lg: {
      mark: 82,
      word: "text-4xl",
      tagline: "text-xs",
      gap: "gap-4",
    },
  };

  const current = sizes[size];

  return (
    <div className={`flex items-center ${current.gap}`}>
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: current.mark, height: current.mark }}
      >
        <div
          className={`absolute inset-0 rounded-xl border-2 ${
            isDark ? "border-[#0B0C0E]" : "border-[#F5F6F7]"
          }`}
        />

        <div
          className={`absolute h-[45%] w-[54%] rotate-45 border-b-2 border-r-2 ${
            isDark ? "border-[#0B0C0E]" : "border-[#F5F6F7]"
          }`}
          style={{ bottom: "8%", left: "23%" }}
        />

        <div
          className={`absolute text-[22px] font-black leading-none ${
            isDark ? "text-[#0B0C0E]" : "text-[#F5F6F7]"
          }`}
        >
          W
        </div>

        <div className="absolute h-2 w-7 rounded-full bg-[#00E5D6]" />
      </div>

      <div className="leading-none">
        <p
          className={`${current.word} font-black tracking-[0.45em] ${
            isDark ? "text-[#0B0C0E]" : "text-[#F5F6F7]"
          }`}
        >
          WAMA
        </p>

        {showTagline && (
          <p
            className={`mt-2 ${current.tagline} font-black uppercase tracking-[0.35em] text-[#00E5D6]`}
          >
            Warn and manage
          </p>
        )}
      </div>
    </div>
  );
}
