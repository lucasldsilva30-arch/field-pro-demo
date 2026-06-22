"use client";

type BrandLogoProps = {
  compact?: boolean;
  showSubtitle?: boolean;
};

function FieldProMark({ size = 56 }: { size?: number }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 120 120" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id="fieldpro-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f9e7a6" />
            <stop offset="38%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#8f6a00" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="49" fill="none" stroke="url(#fieldpro-gold)" strokeWidth="4.5" />
        <path d="M60 21 L86 91 H76 L68 69 H52 L44 91 H34 L60 21 Z" fill="url(#fieldpro-gold)" />
        <path d="M47 79 C59 74, 69 66, 83 47" fill="none" stroke="url(#fieldpro-gold)" strokeWidth="8" strokeLinecap="round" />
        <path d="M49 60 H72" fill="none" stroke="url(#fieldpro-gold)" strokeWidth="7" strokeLinecap="round" />
        <path d="M59.8 27 L64 38.5" fill="none" stroke="#f9e7a6" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
      </svg>
      <div className="sr-only">Field Pro</div>
    </div>
  );
}

export function BrandLogo({ compact = false, showSubtitle = true }: BrandLogoProps) {
  const iconSize = compact ? 48 : 56;
  const titleSize = compact ? "text-2xl" : "text-3xl";
  const subtitleSize = compact ? "text-[10px]" : "text-[11px]";

  return (
    <div className={compact ? "inline-flex items-center gap-3" : "inline-flex items-center gap-4 rounded-3xl border border-zinc-800 bg-zinc-950/90 px-4 py-3"}>
      <FieldProMark size={iconSize} />

      <div className="leading-none">
        <div className={`${titleSize} font-black tracking-[0.12em] text-white`}>FIELD PRO</div>
        {showSubtitle ? (
          <div className={`fieldpro-logo-subtitle mt-1 ${subtitleSize} font-semibold uppercase tracking-[0.48em]`}>
            Operations Suite
          </div>
        ) : null}
      </div>
    </div>
  );
}
