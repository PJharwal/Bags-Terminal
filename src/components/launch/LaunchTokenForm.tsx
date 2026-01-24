'use client';

import { useRef } from 'react';
import { useLaunchStore } from '@/store/launch.store';
import { Upload, Image as ImageIcon } from 'lucide-react';

const BUY_PRESETS = [0.1, 0.5, 1, 2];

export function LaunchTokenForm() {
  const {
    metadata,
    initialBuyAmount,
    imagePreviewUrl,
    updateMetadata,
    setUploadedImage,
    setInitialBuyAmount,
  } = useLaunchStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-sm font-bold text-[#EDEDED] uppercase tracking-widest">Token Metadata</h2>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[9px] text-[#666] uppercase tracking-widest">Name</label>
        <input
          type="text"
          value={metadata.name}
          onChange={(e) => updateMetadata({ name: e.target.value.slice(0, 32) })}
          className="bg-[#1A1A1A] border border-[#333] px-3 py-2 text-sm font-mono text-[#EDEDED] focus:border-[#39FF14] focus:outline-none"
          placeholder="My Token"
          maxLength={32}
        />
        <span className="text-[8px] text-[#444] font-mono text-right">{metadata.name.length}/32</span>
      </div>

      {/* Symbol */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[9px] text-[#666] uppercase tracking-widest">Symbol</label>
        <input
          type="text"
          value={metadata.symbol}
          onChange={(e) => updateMetadata({ symbol: e.target.value.toUpperCase().slice(0, 10) })}
          className="bg-[#1A1A1A] border border-[#333] px-3 py-2 text-sm font-mono text-[#EDEDED] focus:border-[#39FF14] focus:outline-none uppercase"
          placeholder="TKN"
          maxLength={10}
        />
        <span className="text-[8px] text-[#444] font-mono text-right">{metadata.symbol.length}/10</span>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[9px] text-[#666] uppercase tracking-widest">Description</label>
        <textarea
          value={metadata.description}
          onChange={(e) => updateMetadata({ description: e.target.value.slice(0, 200) })}
          className="bg-[#1A1A1A] border border-[#333] px-3 py-2 text-sm font-mono text-[#EDEDED] focus:border-[#39FF14] focus:outline-none resize-none h-20"
          placeholder="A brief description of your token..."
          maxLength={200}
        />
        <span className="text-[8px] text-[#444] font-mono text-right">{metadata.description.length}/200</span>
      </div>

      {/* Image Upload */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[9px] text-[#666] uppercase tracking-widest">Token Image</label>
        <div className="flex items-center gap-3">
          {imagePreviewUrl ? (
            <div className="w-16 h-16 border border-[#39FF14]/30 overflow-hidden">
              <img src={imagePreviewUrl} alt="Token" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 border border-[#333] flex items-center justify-center">
              <ImageIcon size={20} className="text-[#444]" />
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 border border-[#333] text-[10px] font-bold text-[#888] uppercase tracking-wider hover:border-[#39FF14] hover:text-[#39FF14] transition-all"
          >
            <Upload size={12} />
            {imagePreviewUrl ? 'Change' : 'Upload'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Initial Buy Amount */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[9px] text-[#666] uppercase tracking-widest">Initial Buy (SOL)</label>
        <div className="grid grid-cols-4 gap-2">
          {BUY_PRESETS.map((amount) => (
            <button
              key={amount}
              onClick={() => setInitialBuyAmount(amount)}
              className={`py-2 text-[10px] font-mono font-bold border transition-colors ${
                initialBuyAmount === amount
                  ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
                  : 'border-[#333] text-[#888] hover:border-[#666]'
              }`}
            >
              {amount}
            </button>
          ))}
        </div>
        <div className="relative mt-1">
          <input
            type="number"
            value={initialBuyAmount}
            onChange={(e) => setInitialBuyAmount(parseFloat(e.target.value) || 0)}
            className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-sm font-mono text-[#EDEDED] focus:border-[#39FF14] focus:outline-none"
            placeholder="0.1"
            step="0.1"
            min="0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#666] font-mono">SOL</span>
        </div>
      </div>
    </div>
  );
}
