'use client';

import { useRef } from 'react';
import { useLaunchStore } from '@/store/launch.store';
import { Upload, Image as ImageIcon, Link, Heart, Handshake } from 'lucide-react';
import { BAGS_CONFIG_TYPES } from '@/lib/bags-types';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Field } from '@/components/ui/Field';

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
    twitterUrl,
    websiteUrl,
    telegramUrl,
    bagsConfigType,
    setTwitterUrl,
    setWebsiteUrl,
    setTelegramUrl,
    setBagsConfigType,
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
      <h2 className="text-sm font-bold text-fg uppercase tracking-widest text-display">Token Metadata</h2>

      {/* Name */}
      <Field label="Name" helper={`${metadata.name.length}/32`}>
        <Input
          type="text"
          value={metadata.name}
          onChange={(e) => updateMetadata({ name: e.target.value.slice(0, 32) })}
          placeholder="My Token"
          maxLength={32}
        />
      </Field>

      {/* Symbol */}
      <Field label="Symbol" helper={`${metadata.symbol.length}/10`}>
        <Input
          type="text"
          value={metadata.symbol}
          onChange={(e) => updateMetadata({ symbol: e.target.value.toUpperCase().slice(0, 10) })}
          className="uppercase"
          placeholder="TKN"
          maxLength={10}
        />
      </Field>

      {/* Description */}
      <Field label="Description" helper={`${metadata.description.length}/200`}>
        <Textarea
          textareaSize="sm"
          value={metadata.description}
          onChange={(e) => updateMetadata({ description: e.target.value.slice(0, 200) })}
          placeholder="A brief description of your token..."
          maxLength={200}
        />
      </Field>

      {/* Social Links */}
      <div className="space-y-3">
        <label className="label">Social Links (Optional)</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-meta text-muted-high w-16 shrink-0 font-mono">Twitter</span>
            <Input
              type="url"
              placeholder="https://x.com/yourproject"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              inputSize="sm"
              aria-label="Twitter URL"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-meta text-muted-high w-16 shrink-0 font-mono">Website</span>
            <Input
              type="url"
              placeholder="https://yourproject.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              inputSize="sm"
              aria-label="Website URL"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-meta text-muted-high w-16 shrink-0 font-mono">Telegram</span>
            <Input
              type="url"
              placeholder="https://t.me/yourgroup"
              value={telegramUrl}
              onChange={(e) => setTelegramUrl(e.target.value)}
              inputSize="sm"
              aria-label="Telegram URL"
            />
          </div>
        </div>
      </div>

      {/* Bonding Curve Config */}
      <div className="space-y-3">
        <label className="label">Fee Config</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: BAGS_CONFIG_TYPES.DEFAULT, label: 'Standard', desc: '2% pre + 2% post' },
            { id: BAGS_CONFIG_TYPES.LOW_PRE_HIGH_POST, label: 'Growth', desc: '0.25% pre + 1% post' },
            { id: BAGS_CONFIG_TYPES.HIGH_PRE_LOW_POST, label: 'Early', desc: '1% pre + 0.25% post' },
            { id: BAGS_CONFIG_TYPES.HIGH_BOTH, label: 'Max Earn', desc: '10% pre + 10% post' },
          ].map((config) => (
            <button
              key={config.id}
              type="button"
              onClick={() => setBagsConfigType(config.id)}
              aria-pressed={bagsConfigType === config.id}
              className={`p-2 border text-left transition-colors active:scale-[0.98] focus-ring ${
                bagsConfigType === config.id
                  ? 'border-acid-green/40 bg-acid-green/5'
                  : 'border-default hover:border-strong'
              }`}
            >
              <div className="text-meta font-bold text-fg">{config.label}</div>
              <div className="text-meta text-muted-high font-mono">{config.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Image Source Toggle */}
      <div className="flex flex-col gap-1.5">
        <label className="label">Token Image</label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setImageSourceMode('upload')}
            aria-pressed={imageSourceMode === 'upload'}
            className={`btn-ghost btn-press flex items-center gap-1.5 px-3 py-1.5 text-meta font-bold uppercase focus-ring ${
              imageSourceMode === 'upload'
                ? '!border-acid-green !text-acid-green bg-acid-green/10'
                : ''
            }`}
          >
            <Upload size={12} aria-hidden="true" />
            Upload
          </button>
          <button
            type="button"
            onClick={() => setImageSourceMode('url')}
            aria-pressed={imageSourceMode === 'url'}
            className={`btn-ghost btn-press flex items-center gap-1.5 px-3 py-1.5 text-meta font-bold uppercase focus-ring ${
              imageSourceMode === 'url'
                ? '!border-acid-green !text-acid-green bg-acid-green/10'
                : ''
            }`}
          >
            <Link size={12} aria-hidden="true" />
            URL
          </button>
        </div>

        {imageSourceMode === 'upload' ? (
          <div className="flex items-center gap-3">
            {imagePreviewUrl ? (
              <div className="w-16 h-16 border border-acid-green/30 overflow-hidden">
                <img src={imagePreviewUrl} alt="Token" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 border border-line flex items-center justify-center">
                <ImageIcon size={20} aria-hidden="true" className="text-muted" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-ghost btn-press flex items-center gap-2 px-3 py-2 text-meta font-bold uppercase tracking-wider focus-ring"
            >
              <Upload size={12} aria-hidden="true" />
              {imagePreviewUrl ? 'Change' : 'Upload'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleImageSelect}
              className="hidden"
              aria-label="Select token image file"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/token-image.png"
              aria-label="Token image URL"
            />
            <span className="text-meta text-muted-high font-mono">
              Direct URL skips IPFS upload — no upload fees
            </span>
            {imageUrl && (
              <div className="w-16 h-16 border border-acid-green/30 overflow-hidden mt-1">
                <img src={imageUrl} alt="Token preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Initial Buy Amount */}
      <div className="flex flex-col gap-1.5">
        <label className="label" htmlFor="launch-initial-buy">Initial Buy (SOL)</label>
        <div className="grid grid-cols-4 gap-2">
          {BUY_PRESETS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setInitialBuyAmount(amount)}
              aria-pressed={initialBuyAmount === amount}
              className={`btn-ghost btn-press py-2 text-meta font-mono font-bold focus-ring ${
                initialBuyAmount === amount
                  ? '!border-acid-green !text-acid-green bg-acid-green/10'
                  : ''
              }`}
            >
              {amount}
            </button>
          ))}
        </div>
        <Input
          id="launch-initial-buy"
          type="number"
          value={initialBuyAmount}
          onChange={(e) => setInitialBuyAmount(parseFloat(e.target.value) || 0)}
          placeholder="0.1"
          step="0.1"
          min="0"
          suffix="SOL"
          className="mt-1"
        />
      </div>

      {/* Tip Configuration */}
      <div className="flex flex-col gap-1.5 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <label className="label flex items-center gap-1.5" htmlFor="launch-tip-toggle">
            <Heart size={10} aria-hidden="true" />
            Optional Tip
          </label>
          <button
            id="launch-tip-toggle"
            type="button"
            role="switch"
            aria-checked={tipEnabled}
            aria-label="Enable optional tip"
            onClick={() => setTipEnabled(!tipEnabled)}
            className="relative inline-flex items-center justify-center w-12 h-6 -my-1 focus-ring"
          >
            <span
              aria-hidden="true"
              className={`block w-8 h-4 rounded-full transition-colors ${tipEnabled ? 'bg-acid-green' : 'bg-line'}`}
            />
            <span
              aria-hidden="true"
              className={`block w-3 h-3 rounded-full bg-white absolute top-1/2 -translate-y-1/2 transition-transform ${
                tipEnabled ? 'translate-x-2' : 'translate-x-[-10px]'
              }`}
            />
          </button>
        </div>

        {tipEnabled && (
          <div className="flex flex-col gap-2 mt-1">
            <Input
              type="text"
              value={tipWallet}
              onChange={(e) => setTipWallet(e.target.value)}
              placeholder="Tip wallet address..."
              aria-label="Tip wallet address"
            />
            <div className="grid grid-cols-3 gap-2">
              {TIP_PRESETS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setTipAmountSol(amount)}
                  aria-pressed={tipAmountSol === amount}
                  className={`btn-ghost btn-press py-1.5 text-meta font-mono font-bold focus-ring ${
                    tipAmountSol === amount
                      ? '!border-gold !text-gold bg-gold/10'
                      : ''
                  }`}
                >
                  {amount} SOL
                </button>
              ))}
            </div>
            <Input
              type="number"
              value={tipAmountSol}
              onChange={(e) => setTipAmountSol(parseFloat(e.target.value) || 0)}
              placeholder="0.01"
              step="0.01"
              min="0"
              suffix="SOL"
              aria-label="Tip amount in SOL"
            />
          </div>
        )}
      </div>

      {/* Partner Key (Optional) */}
      <div className="pt-3 border-t border-white/10">
        <Field
          label={(
            <span className="flex items-center gap-1.5">
              <Handshake size={10} aria-hidden="true" />
              Partner Key (Optional)
            </span>
          )}
          helper="Attribute launch fees to a partner wallet"
        >
          <Input
            type="text"
            value={partnerKey}
            onChange={(e) => setPartnerKey(e.target.value)}
            placeholder="Partner key for fee attribution..."
          />
        </Field>
      </div>
    </div>
  );
}
