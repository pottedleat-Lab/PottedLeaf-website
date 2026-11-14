import { Logo } from './Logo';

/** Product photo, or a soft placeholder when none was uploaded. */
export function ProductImage({ src, alt, className = '' }: { src: string | null; alt: string; className?: string }) {
  if (src) return <img src={src} alt={alt} loading="lazy" className={`product-img ${className}`} />;
  return (
    <div className={`product-img placeholder ${className}`} role="img" aria-label={alt}>
      <Logo size={56} />
    </div>
  );
}
