import type { Metadata } from 'next';
import TerminalTokenClient from './TerminalTokenClient';

async function fetchTokenMeta(mint: string) {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const pairs = (data?.pairs || []).filter(
      (p: { chainId?: string }) => p.chainId === 'solana'
    );
    if (pairs.length === 0) return null;
    const p = pairs.sort(
      (a: { liquidity?: { usd?: number } }, b: { liquidity?: { usd?: number } }) =>
        (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    )[0];
    return {
      symbol: p.baseToken?.symbol || null,
      name: p.baseToken?.name || null,
      priceUsd: p.priceUsd as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ tokenId: string }> }
): Promise<Metadata> {
  const { tokenId } = await params;
  const meta = await fetchTokenMeta(tokenId);
  const ogImage = `/api/og?mint=${encodeURIComponent(tokenId)}`;

  const sym = meta?.symbol ? `$${meta.symbol}` : 'Token';
  const priceBit = meta?.priceUsd ? ` · $${meta.priceUsd}` : '';
  const title = `${sym} on BAGS Terminal`;
  const description = meta?.name
    ? `${meta.name} (${sym})${priceBit} — live chart, holders, and risk intelligence on BAGS Terminal.`
    : `Live chart, holders, and risk intelligence on BAGS Terminal.`;

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url: `/terminal/${tokenId}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default function TerminalTokenPage() {
  return <TerminalTokenClient />;
}
