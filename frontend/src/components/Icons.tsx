// ---------------------------------------------------------------------------
// Shared inline SVG icon set. Kept as small, professional-line icons with no
// external dependency. All icons inherit currentColor so they can be tinted.
// ---------------------------------------------------------------------------

type IconProps = {
  size?: number;
  className?: string;
};

const base = (size?: number) => ({
  width: size ?? 20,
  height: size ?? 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
});

export const WalletIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

export const LockIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const CheckIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const ShieldIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const BoltIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
  </svg>
);

export const KeyIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
);

export const ArrowRightIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export const XIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const MenuIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </svg>
);

export const AlertIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);

export const InfoIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

export const FingerprintIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 11a5 5 0 0 1 5 5v1" />
    <path d="M7 16v-3a5 5 0 0 1 3.5-4.75" />
    <path d="M12 3a9 9 0 0 0-9 9v1" />
    <path d="M21 12v1a9 9 0 0 1-3 6.7" />
    <path d="M7.5 14.5V16" />
    <path d="M16.5 11V16" />
  </svg>
);

export const SparkleIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
    <path d="M12 8 13.5 12 17 13.5 13.5 15 12 18.5 10.5 15 7 13.5 10.5 12Z" />
  </svg>
);

export const GridIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const HistoryIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

export const FileTextIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </svg>
);

export const UserIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const RefreshIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </svg>
);

export const ClockIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export const DatabaseIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);

export const EyeOffIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M10.6 5.1A10.93 10.93 0 0 1 12 5c7 0 10 7 10 7a15.6 15.6 0 0 1-3.1 4.1" />
    <path d="M6.6 6.6A13.9 13.9 0 0 0 2 12s3 7 10 7a10 10 0 0 0 4.3-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="m2 2 20 20" />
  </svg>
);

export const LinkIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export const ServerIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="2" y="2" width="20" height="8" rx="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" />
    <path d="M6 6h.01" />
    <path d="M6 18h.01" />
  </svg>
);

export const GlobeIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
  </svg>
);

export const ExternalLinkIcon = ({ size, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M21 14v7H3V3h7" />
  </svg>
);

export const BrandMark = ({ size = 28, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden focusable="false" className={className}>
    <rect width="32" height="32" rx="9" fill="url(#credifi-brand)" />
    <path d="M10 21 13.2 12.6 17 20l3.8-5.4H24" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="credifi-brand" x1="0" y1="0" x2="32" y2="32">
        <stop stopColor="#5b7cfa" />
        <stop offset="1" stopColor="#8b7bff" />
      </linearGradient>
    </defs>
  </svg>
);
