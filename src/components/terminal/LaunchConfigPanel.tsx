'use client';

import { Globe, MessageCircle, Users, Percent, Clock, ExternalLink, Copy, Check, Shield } from 'lucide-react';
import { useState } from 'react';
import type { TerminalToken } from '@/lib/types';

function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

function formatDate(ts?: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncateWallet(addr?: string): string {
  if (!addr) return '—';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

interface Props {
  token: TerminalToken;
}

export function LaunchConfigPanel({ token }: Props) {
  const [copiedWallet, setCopiedWallet] = useState(false);
  const config = token.launchConfig;
  const earners = token.feeEarners || [];
  const hasSocials = config?.twitterUrl || config?.websiteUrl || config?.telegramUrl;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    } catch {}
  };

  return (
    <div className="flex flex-col gap-0 card">
      <div className="flex items-center justify-between px-3 py-2 border-b border-default">
        <span className="text-meta font-mono font-bold text-fg uppercase tracking-wider">
          Launch Config
        </span>
        <Shield size={10} className="text-acid-green" />
      </div>

      {config?.creatorWallet && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-default">
          <span className="text-meta text-muted-high font-mono">Creator</span>
          <div className="flex items-center gap-1.5">
            <span className="text-meta text-fg font-mono">{truncateWallet(config.creatorWallet)}</span>
            <button onClick={() => handleCopy(config.creatorWallet!)} className="text-muted-high hover:text-acid-green transition-colors">
              {copiedWallet ? <Check size={9} className="text-acid-green" /> : <Copy size={9} />}
            </button>
            <a href={`https://solscan.io/account/${config.creatorWallet}`} target="_blank" rel="noopener noreferrer" className="text-muted-high hover:text-fg transition-colors">
              <ExternalLink size={9} />
            </a>
          </div>
        </div>
      )}

      {config?.createdAt && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-default">
          <span className="text-meta text-muted-high font-mono">Launched</span>
          <div className="flex items-center gap-1.5">
            <Clock size={9} className="text-muted-high" />
            <span className="text-meta text-fg font-mono">{formatDate(config.createdAt)}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-2 border-b border-default">
        <span className="text-meta text-muted-high font-mono">Fee Claimers</span>
        <div className="flex items-center gap-1.5">
          <Users size={9} className="text-acid-green" />
          <span className="text-meta text-fg font-mono">{earners.length}</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-b border-default">
        <span className="text-meta text-muted-high font-mono">Total Royalty</span>
        <div className="flex items-center gap-1.5">
          <Percent size={9} className="text-acid-green" />
          <span className="text-meta text-acid-green font-mono font-bold">
            {config ? formatBps(config.totalRoyaltyBps) : '—'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-b border-default">
        <span className="text-meta text-muted-high font-mono">Lifetime Fees</span>
        <span className="text-meta text-gold font-mono font-bold">
          {token.lifetimeFees > 0 ? `${token.lifetimeFees.toFixed(4)} SOL` : '—'}
        </span>
      </div>

      {hasSocials && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-default">
          <span className="text-meta text-muted-high font-mono">Socials</span>
          <div className="flex items-center gap-2">
            {config?.twitterUrl && (
              <a href={config.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-high hover:text-fg transition-colors" title="Twitter/X">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            )}
            {config?.websiteUrl && (
              <a href={config.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-muted-high hover:text-fg transition-colors" title="Website">
                <Globe size={10} />
              </a>
            )}
            {config?.telegramUrl && (
              <a href={config.telegramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-high hover:text-fg transition-colors" title="Telegram">
                <MessageCircle size={10} />
              </a>
            )}
          </div>
        </div>
      )}

      {earners.length > 0 && (
        <div className="px-3 py-2">
          <div className="text-meta text-muted font-mono uppercase tracking-wider mb-1.5">Fee Distribution</div>
          <div className="flex flex-col gap-1">
            {earners.slice(0, 5).map((earner, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {earner.pfp ? (
                    <img src={earner.pfp} alt="" className="w-3.5 h-3.5 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full bg-line" />
                  )}
                  <span className="text-meta text-fg-soft font-mono">
                    {earner.providerUsername ? `@${earner.providerUsername}` : truncateWallet(earner.wallet)}
                  </span>
                  {earner.isCreator && (
                    <span className="text-[7px] bg-acid-green/10 text-acid-green px-1 py-0.5 font-mono uppercase">Creator</span>
                  )}
                </div>
                <span className="text-meta text-acid-green font-mono font-bold">{formatBps(earner.royaltyBps)}</span>
              </div>
            ))}
            {earners.length > 5 && (
              <span className="text-meta text-muted font-mono">+{earners.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      {!token.hasBagsFees && earners.length === 0 && (
        <div className="px-3 py-3 text-center">
          <span className="text-meta text-muted font-mono">Not a BAGS token or no fee data available</span>
        </div>
      )}
    </div>
  );
}
