'use client';

import { LaunchTokenForm } from '@/components/launch/LaunchTokenForm';
import { FeeShareConfigurator } from '@/components/launch/FeeShareConfigurator';
import { TokenPreviewCard } from '@/components/launch/TokenPreviewCard';
import { TransactionSummary } from '@/components/launch/TransactionSummary';

export default function LaunchPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[#EDEDED] tracking-tight font-mono">
          LAUNCH<span className="text-[#39FF14]">_</span>TOKEN
        </h1>
        <p className="text-[11px] text-[#666] font-mono mt-1">
          Create a Solana token with built-in fee sharing
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="p-5 bg-[#0A0A0A] border border-white/10">
            <LaunchTokenForm />
          </div>
          <div className="p-5 bg-[#0A0A0A] border border-white/10">
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
