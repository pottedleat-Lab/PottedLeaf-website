const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatPrice = (n: number) => inr.format(Number(n));

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Turn any YouTube URL into an embeddable URL; returns null for other links. */
export function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    let id = '';
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    else if (u.pathname.startsWith('/shorts/') || u.pathname.startsWith('/embed/')) id = u.pathname.split('/')[2];
    else id = u.searchParams.get('v') ?? '';
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

export const PAYMENT_LABEL: Record<string, string> = {
  upi_qr: 'UPI QR',
  credit_card: 'Credit card',
  debit_card: 'Debit card',
};
