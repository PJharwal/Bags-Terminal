'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { LaunchTokenForm } from '@/components/launch/LaunchTokenForm';
import { FeeShareConfigurator } from '@/components/launch/FeeShareConfigurator';
import { TokenPreviewCard } from '@/components/launch/TokenPreviewCard';
import { TransactionSummary } from '@/components/launch/TransactionSummary';
import { BagsLogo } from '@/components/ui/BagsLogo';
import { TokenLaunchCard } from '@/components/share/TokenLaunchCard';
import { useLaunchStore } from '@/store/launch.store';

function LaunchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const { partnerKey, setPartnerKey, status, result, metadata, feeClaimers, initialBuyAmount } = useLaunchStore();

  useEffect(() => {
    if (ref && !partnerKey) {
      setPartnerKey(ref);
    }
  }, [ref, partnerKey, setPartnerKey]);

  const shortenedRef = ref ? `${ref.slice(0, 4)}...${ref.slice(-4)}` : null;

  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#050505] text-[#EDEDED] font-mono max-w-6xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[#EDEDED] tracking-tight text-display">
          <BagsLogo size={18} className="inline-block mr-1" />LAUNCH<span className="text-[#39FF14]">_</span>TOKEN
        </h1>
        <p className="label mt-2">
          Create a token on bags.fm with built-in fee sharing — no API fees, up to 100 claimers
        </p>
        {shortenedRef && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 border border-[#39FF14]/10 bg-[#39FF14]/5">
            <span className="text-[10px] font-mono text-[#888]">Referred by</span>
            <span className="text-[10px] font-mono text-[#39FF14]">{shortenedRef}</span>
          </div>
        )}
      </div>

      {/* Launch Success Card */}
      {status === 'success' && result && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <TokenLaunchCard
              tokenName={metadata.name}
              tokenSymbol={metadata.symbol}
              tokenImage={metadata.imageUrl || metadata.image}
              initialBuyAmount={initialBuyAmount}
              tokenMint={result.tokenMint}
              feeClaimersCount={feeClaimers.length}
            />
            <button
              onClick={() => router.push(`/terminal/${result.tokenMint}`)}
              className="w-full mt-3 px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-white/10 text-[#888] hover:text-white hover:border-white/20 transition-colors"
            >
              Open in Terminal →
            </button>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="card p-5">
            <LaunchTokenForm />
          </div>
          <div className="card p-5">
            <FeeShareConfigurator />
          </div>
        </div>

        {/* Right Column - Preview & Summary */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <TokenPreviewCard />
          <TransactionSummary />
        </div>
      </div>
    </div>
  );
}

export default function LaunchPageClient() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="skeleton-shimmer h-8 w-48 mb-4" />
        <div className="skeleton-shimmer h-4 w-96 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 skeleton-shimmer h-96" />
          <div className="lg:col-span-2 skeleton-shimmer h-64" />
        </div>
      </div>
    }>
      <LaunchPageContent />
    </Suspense>
  );
}
