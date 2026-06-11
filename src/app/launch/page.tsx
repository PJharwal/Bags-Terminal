import type { Metadata } from 'next';
import LaunchPageClient from './LaunchPageClient';

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ ref?: string }> }
): Promise<Metadata> {
  const { ref } = await searchParams;

  if (ref) {
    const shortRef = ref.length > 10 ? `${ref.slice(0, 4)}…${ref.slice(-4)}` : ref;
    const ogImage = `/api/og?ref=${encodeURIComponent(ref)}&v=2`;
    const title = `Launch a token on BAGS — referred by ${shortRef}`;
    const description =
      'Launch on bags.fm with built-in fee sharing. Use this referral link to get started.';
    return {
      title: { absolute: title },
      description,
      openGraph: {
        title,
        description,
        url: `/launch?ref=${ref}`,
        images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      },
      twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
    };
  }

  const title = 'Launch a token on BAGS';
  const description =
    'No-code token launch on bags.fm with built-in fee sharing — up to 100 claimers, no API fees.';
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: '/launch',
      images: [{ url: '/api/og?v=2', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/api/og?v=2'] },
  };
}

export default function LaunchPage() {
  return <LaunchPageClient />;
}
