export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M14 38h36l-4 20H18z" fill="#c4663a" />
      <path d="M12 36h40v5H12z" fill="#a9532c" />
      <path d="M32 37C32 22 40 10 54 8c0 16-8 28-22 29z" fill="#2f5d45" />
      <path d="M32 37C30 26 22 18 10 18c0 12 8 19 22 19z" fill="#6d9a78" />
    </svg>
  );
}
