'use client';

import { useRef } from 'react';
import { useLaunchStore } from '@/store/launch.store';
import { Upload, Image as ImageIcon, Link, Heart, Handshake } from 'lucide-react';

const BUY_PRESETS = [0.1, 0.5, 1, 2];
const TIP_PRESETS = [0.01, 0.05, 0.1];

export function LaunchTokenForm() {
  const {
    metadata,
    initialBuyAmount,
    imagePreviewUrl,
    imageSourceMode,
    imageUrl,
    tipEnabled,
    tipWallet,
    tipAmountSol,
    updateMetadata,
    setUploadedImage,
    setImageSourceMode,
    setImageUrl,
    setInitialBuyAmount,
    setTipEnabled,
    setTipWallet,
    setTipAmountSol,
    partnerKey,
    setPartnerKey,
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
      <h2 className="text-sm font-bold text-[#EDEDED] uppercase tracking-widest text-display">Token Metadata</h2>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="label">Name</label>
        <input
          type="text"
          value={metadata.name}
          onChange={(e) => updateMetadata({ name: e.target.value.slice(0, 32) })}
          className="input px-3 py-2 text-sm"
          placeholder="My Token"
          maxLength={32}
        />
        <span className="label text-right" style={{ fontSize: '8px' }}>{metadata.name.length}/32</span>
      </div>

      {/* Symbol */}
      <div className="flex flex-col gap-1.5">
        <label className="label">Symbol</label>
        <input
          type="text"
          value={metadata.symbol}
          onChange={(e) => updateMetadata({ symbol: e.target.value.toUpperCase().slice(0, 10) })}
          className="input px-3 py-2 text-sm uppercase"
          placeholder="TKN"
          maxLength={10}
        />
        <span className="label text-right" style={{ fontSize: '8px' }}>{metadata.symbol.length}/10</span>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="label">Description</label>
        <textarea
          value={metadata.description}
          onChange={(e) => updateMetadata({ description: e.target.value.slice(0, 200) })}
          className="input px-3 py-2 text-sm resize-none h-20"
          placeholder="A brief description of your token..."
          maxLength={200}
        />
        <span className="label text-right" style={{ fontSize: '8px' }}>{metadata.description.length}/200</span>
      </div>

      {/* Image Source Toggle */}
      <div className="flex flex-col gap-1.5">
        <label className="label">Token Image</label>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setImageSourceMode('upload')}
            className={`btn-ghost btn-press flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold uppercase ${
              imageSourceMode === 'upload'
                ? '!border-[#39FF14] !text-[#39FF14] bg-[#39FF14]/10'
                : ''
            }`}
          >
            <Upload size={10} />
            Upload
          </button>
          <button
            onClick={() => setImageSourceMode('url')}
            className={`btn-ghost btn-press flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold uppercase ${
              imageSourceMode === 'url'
                ? '!border-[#39FF14] !text-[#39FF14] bg-[#39FF14]/10'
                : ''
            }`}
          >
            <Link size={10} />
            URL
          </button>
        </div>

        {imageSourceMode === 'upload' ? (
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
              className="btn-ghost btn-press flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider"
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
        ) : (
          <div className="flex flex-col gap-1.5">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="input px-3 py-2 text-[11px]"
              placeholder="https://example.com/token-image.png"
            />
            <span className="text-[8px] text-[#444] font-mono">
              Direct URL skips IPFS upload — no upload fees
            </span>
            {imageUrl && (
              <div className="w-16 h-16 border border-[#39FF14]/30 overflow-hidden mt-1">
                <img src={imageUrl} alt="Token preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Initial Buy Amount */}
      <div className="flex flex-col gap-1.5">
        <label className="label">Initial Buy (SOL)</label>
        <div className="grid grid-cols-4 gap-2">
          {BUY_PRESETS.map((amount) => (
            <button
              key={amount}
              onClick={() => setInitialBuyAmount(amount)}
              className={`btn-ghost btn-press py-2 text-[10px] font-mono font-bold ${
                initialBuyAmount === amount
                  ? '!border-[#39FF14] !text-[#39FF14] bg-[#39FF14]/10'
                  : ''
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
            className="w-full input px-3 py-2 text-sm"
            placeholder="0.1"
            step="0.1"
            min="0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#666] font-mono">SOL</span>
        </div>
      </div>

      {/* Tip Configuration */}
      <div className="flex flex-col gap-1.5 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <label className="label flex items-center gap-1.5">
            <Heart size={10} />
            Optional Tip
          </label>
          <button
            onClick={() => setTipEnabled(!tipEnabled)}
            className={`w-8 h-4 rounded-full transition-colors relative ${
              tipEnabled ? 'bg-[#39FF14]' : 'bg-[#333]'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                tipEnabled ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {tipEnabled && (
          <div className="flex flex-col gap-2 mt-1">
            <input
              type="text"
              value={tipWallet}
              onChange={(e) => setTipWallet(e.target.value)}
              className="input px-3 py-2 text-[11px]"
              placeholder="Tip wallet address..."
            />
            <div className="grid grid-cols-3 gap-2">
              {TIP_PRESETS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTipAmountSol(amount)}
                  className={`btn-ghost btn-press py-1.5 text-[9px] font-mono font-bold ${
                    tipAmountSol === amount
                      ? '!border-[#FFD700] !text-[#FFD700] bg-[#FFD700]/10'
                      : ''
                  }`}
                >
                  {amount} SOL
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number"
                value={tipAmountSol}
                onChange={(e) => setTipAmountSol(parseFloat(e.target.value) || 0)}
                className="w-full input px-3 py-2 text-[11px]"
                placeholder="0.01"
                step="0.01"
                min="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#666] font-mono">SOL</span>
            </div>
          </div>
        )}
      </div>

      {/* Partner Key (Optional) */}
      <div className="flex flex-col gap-1.5 pt-3 border-t border-white/10">
        <label className="label flex items-center gap-1.5">
          <Handshake size={10} />
          Partner Key (Optional)
        </label>
        <input
          type="text"
          value={partnerKey}
          onChange={(e) => setPartnerKey(e.target.value)}
          className="input px-3 py-2 text-[11px]"
          placeholder="Partner key for fee attribution..."
        />
        <span className="label" style={{ fontSize: '8px' }}>
          Attribute launch fees to a partner wallet
        </span>
      </div>
    </div>
  );
}
