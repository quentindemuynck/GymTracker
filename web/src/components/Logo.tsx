export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" className="logo-mark">
      <rect x="56" y="136" width="60" height="240" rx="28" />
      <rect x="126" y="176" width="40" height="160" rx="20" />
      <rect x="166" y="236" width="180" height="40" rx="20" />
      <rect x="346" y="176" width="40" height="160" rx="20" />
      <rect x="396" y="136" width="60" height="240" rx="28" />
    </svg>
  )
}
