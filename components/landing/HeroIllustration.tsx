/** Isometric line drawing of a small house. Pure SVG: zero JS, instant paint. */
export function HeroIllustration() {
  return (
    <svg
      viewBox="-110 100 760 460"
      className="h-auto w-full"
      role="img"
      aria-label="Isometric drawing of a house"
    >
      <defs>
        <pattern
          id="hero-grid"
          width="22.5"
          height="13"
          patternUnits="userSpaceOnUse"
          patternTransform="skewX(-60)"
        >
          <path d="M0 0H22.5" stroke="var(--grid-major)" strokeWidth="0.6" />
        </pattern>
      </defs>
      <g className="hero-draw" fill="none" stroke="var(--fg)" strokeWidth="1.3" strokeLinejoin="round">
        <path
          d="M209.9 120.0 L637.7 367.0 L322.5 549.0 L-105.3 302.0 Z"
          fill="url(#hero-grid)"
          stroke="var(--line-strong)"
          strokeDasharray="4 5"
        />
        <path
          d="M-71.5 308.5 L322.5 536.0"
          stroke="var(--fg-subtle)"
          strokeDasharray="1 7"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        {/* annex */}
        <path d="M153.6 149.9 L255.0 208.4 L131.1 279.9 L29.8 221.4 Z" fill="var(--bg-elevated)" />
        <path d="M29.8 289.0 L131.1 347.5 L131.1 279.9 L29.8 221.4 Z" fill="var(--panel-solid)" />
        <path d="M164.9 328.0 L131.1 347.5 L131.1 279.9 L164.9 260.4 Z" fill="var(--bg)" />
        <path d="M47.8 276.0 L113.1 313.7 L113.1 285.1 L47.8 247.4 Z" fill="var(--accent-soft)" />
        {/* main volume */}
        <path d="M164.9 328.0 L345.0 432.0 L345.0 354.0 L164.9 250.0 Z" fill="var(--panel-solid)" />
        <path d="M480.1 354.0 L345.0 432.0 L345.0 354.0 L480.1 276.0 Z" fill="var(--bg)" />
        <path d="M480.1 276.0 L345.0 354.0 L412.6 257.8 Z" fill="var(--bg)" />
        <path d="M155.9 261.7 L345.0 370.9 L421.6 263.0 L232.5 153.8 Z" fill="var(--bg-elevated)" />
        <path d="M187.4 315.0 L223.4 335.8 L223.4 304.6 L187.4 283.8 Z" fill="var(--accent-soft)" />
        <path d="M282.0 369.6 L322.5 393.0 L322.5 361.8 L282.0 338.4 Z" fill="var(--accent-soft)" />
        <path d="M446.4 347.5 L378.8 386.5 L378.8 355.3 L446.4 316.3 Z" fill="var(--accent-soft)" />
        <path
          d="M239.2 370.9 L264.0 385.2 L264.0 328.0 L239.2 313.7 Z"
          fill="var(--accent)"
          stroke="var(--accent)"
        />
        {/* outdoor shower + tree */}
        <path d="M545 420 L545 352 L560 343" strokeWidth="2" strokeLinecap="round" />
        <circle cx="560" cy="347" r="1.5" fill="var(--accent)" stroke="none" />
        <path d="M534 426 L558 412 L572 420 L548 434 Z" fill="var(--bg-elevated)" />
        <path d="M600 470 L600 430" strokeWidth="2" strokeLinecap="round" />
        <circle cx="600" cy="412" r="24" fill="var(--bg-elevated)" />
      </g>
      {/* dimension line */}
      <g stroke="var(--accent)" strokeWidth="1" className="hero-dim">
        <path d="M150 342 L330 446" />
        <path d="M150 336 L150 348 M330 440 L330 452" />
        <text
          x="226"
          y="414"
          fill="var(--accent)"
          stroke="none"
          fontSize="12"
          fontWeight="500"
          transform="rotate(30 226 414)"
          className="tnum"
        >
          8.00 m
        </text>
      </g>
      <style>{`
        .hero-draw path, .hero-draw circle { stroke-dasharray: 1400; stroke-dashoffset: 1400; animation: hero-line 1.6s var(--ease-out) forwards; }
        .hero-draw path[stroke-dasharray] { animation: none; stroke-dashoffset: 0; }
        .hero-dim { opacity: 0; animation: fade-only .6s 1.2s var(--ease-out) forwards; }
        @keyframes hero-line { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) { .hero-draw path, .hero-draw circle { stroke-dashoffset: 0; animation: none; } .hero-dim { opacity: 1; } }
      `}</style>
    </svg>
  );
}
