'use client';

import { useState, useRef, useEffect } from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useBagsWallet } from '@/hooks/useWallet';
import { Wallet, Copy, ExternalLink, LogOut, ChevronDown } from 'lucide-react';

export function WalletButton() {
  const { connected, connecting, balance, shortenedAddress, publicKey, disconnect } = useBagsWallet();
  const { setVisible } = useWalletModal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleCopyAddress = async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewSolscan = () => {
    if (!publicKey) return;
    window.open(`https://solscan.io/account/${publicKey}`, '_blank');
    setDropdownOpen(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setDropdownOpen(false);
  };

  if (connecting) {
    return (
      <button
        className="px-4 py-1.5 bg-transparent border border-[#39FF14]/50 text-[#39FF14] text-[10px] font-bold tracking-widest animate-pulse"
        disabled
      >
        CONNECTING...
      </button>
    );
  }

  if (!connected) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="btn-press px-4 py-1.5 bg-transparent border border-white/20 text-[#888] text-[10px] font-bold tracking-widest hover:border-[#39FF14] hover:text-[#39FF14] hover:shadow-[0_0_10px_rgba(57,255,20,0.15)]"
      >
        CONNECT_WALLET
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="btn-press flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1A] border border-[#39FF14]/30 text-[#39FF14] text-[10px] font-bold tracking-wider hover:border-[#39FF14] hover:shadow-[0_0_10px_rgba(57,255,20,0.12)]"
      >
        <Wallet size={12} />
        <span className="font-mono">{shortenedAddress}</span>
        {balance !== null && (
          <span className="text-[#888] font-mono">
            {balance.toFixed(2)} SOL
          </span>
        )}
        <ChevronDown size={10} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <div className="dropdown-enter absolute right-0 top-full mt-1 w-48 bg-[#0A0A0A] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50">
          <button
            onClick={handleCopyAddress}
            className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold tracking-wider text-[#888] hover:bg-[#1A1A1A] hover:text-[#EDEDED] transition-all duration-100 hover:pl-4"
          >
            <Copy size={12} />
            {copied ? 'COPIED!' : 'COPY_ADDRESS'}
          </button>
          <button
            onClick={handleViewSolscan}
            className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold tracking-wider text-[#888] hover:bg-[#1A1A1A] hover:text-[#EDEDED] transition-all duration-100 hover:pl-4"
          >
            <ExternalLink size={12} />
            VIEW_SOLSCAN
          </button>
          <div className="border-t border-white/10" />
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold tracking-wider text-[#FF003C] hover:bg-[#1A1A1A] transition-all duration-100 hover:pl-4"
          >
            <LogOut size={12} />
            DISCONNECT
          </button>
        </div>
      )}
    </div>
  );
}
