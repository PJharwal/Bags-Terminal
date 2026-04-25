'use client';

import { useState, useRef, useEffect } from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useBagsWallet } from '@/hooks/useWallet';
import { useTurnkey } from '@/components/turnkey/TurnkeyProvider';
import { Wallet, Copy, ExternalLink, LogOut, ChevronDown, Zap, Key, User, Loader2, AlertTriangle } from 'lucide-react';

export function WalletButton() {
  const { connected, connecting, balance, shortenedAddress, publicKey, disconnect } = useBagsWallet();
  const { isAuthenticated, turnkeyAddress, balance: turnkeyBalance, logout } = useTurnkey();
  const { setVisible } = useWalletModal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [copied, setCopied] = useState<'phantom' | 'turnkey' | 'key' | null>(null);
  const [exportStep, setExportStep] = useState<'idle' | 'warning' | 'loading' | 'result'>('idle');
  const [exportedKey, setExportedKey] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleCopy = async (type: 'phantom' | 'turnkey' | 'key', address: string) => {
    await navigator.clipboard.writeText(address);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDisconnect = () => {
    disconnect();
    logout();
    setDropdownOpen(false);
    setShowProfile(false);
  };

  const handleExport = async () => {
    setExportStep('loading');
    setExportError(null);

    try {
      // Generate ephemeral P-256 key pair for encrypted export
      const keyPair = await window.crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveBits"],
      );

      const rawPublicKey = await window.crypto.subtle.exportKey("raw", keyPair.publicKey);
      const publicKeyHex = Buffer.from(rawPublicKey).toString("hex");

      const jwkPrivateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
      const dBase64Url = jwkPrivateKey.d!;
      const dBase64 = dBase64Url.replace(/-/g, "+").replace(/_/g, "/");
      const padding = "=".repeat((4 - (dBase64.length % 4)) % 4);
      const embeddedKeyHex = Buffer.from(dBase64 + padding, "base64").toString("hex");

      // Call server to get encrypted export bundle
      const response = await fetch("/api/turnkey/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phantomAddress: publicKey,
          targetPublicKey: publicKeyHex,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Export failed");

      // Decrypt the export bundle client-side
      const { decryptExportBundle } = await import("@turnkey/crypto");
      const decrypted = await decryptExportBundle({
        exportBundle: data.exportBundle,
        embeddedKey: embeddedKeyHex,
        organizationId: data.organizationId || "",
        returnMnemonic: false,
      });

      // Derive Solana keypair from mnemonic
      const mnemonic = Buffer.from(decrypted, "hex").toString("utf8").trim();
      const bip39 = await import("bip39");
      const seed = await bip39.mnemonicToSeed(mnemonic);

      const { derivePath } = await import("ed25519-hd-key");
      const derivedSeed = derivePath("m/44'/501'/0'/0'", Buffer.from(seed).toString("hex")).key;

      const { Keypair } = await import("@solana/web3.js");
      const bs58 = (await import("bs58")).default;
      const solKeypair = Keypair.fromSeed(derivedSeed);
      const privateKeyBase58 = bs58.encode(solKeypair.secretKey);

      setExportedKey(privateKeyBase58);
      setExportStep('result');
    } catch (err) {
      console.error("Export error:", err);
      setExportError(err instanceof Error ? err.message : "Export failed");
      setExportStep('warning');
    }
  };

  const closeProfile = () => {
    setShowProfile(false);
    setExportStep('idle');
    setExportedKey(null);
    setExportError(null);
  };

  if (connecting) {
    return (
      <button className="px-4 py-1.5 bg-transparent border border-[#39FF14]/50 text-acid-green text-meta font-bold tracking-widest animate-pulse" disabled>
        CONNECTING...
      </button>
    );
  }

  if (!connected) {
    return (
      <button onClick={() => setVisible(true)}
        className="btn-press px-4 py-1.5 bg-transparent border border-white/20 text-fg-soft text-meta font-bold tracking-widest hover:border-[#39FF14] hover:text-acid-green hover:shadow-[0_0_10px_rgba(57,255,20,0.15)]">
        CONNECT_WALLET
      </button>
    );
  }

  // Profile Modal
  if (showProfile) {
    return (
      <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={closeProfile} />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0A0A0A] border border-white/10 z-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-fg flex items-center gap-2">
              <User size={14} className="text-acid-green" /> Wallet Profile
            </h2>
            <button onClick={closeProfile} className="text-muted-high hover:text-fg text-xs">CLOSE</button>
          </div>

          {/* Phantom Wallet */}
          <div className="mb-4 p-3 bg-elevated border border-white/10">
            <div className="text-meta text-muted-high uppercase tracking-widest mb-2">Identity Wallet (Phantom)</div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-meta font-mono text-fg break-all">{publicKey}</code>
              <button onClick={() => handleCopy('phantom', publicKey!)} className="p-1 hover:bg-white/10 flex-shrink-0">
                {copied === 'phantom' ? <span className="text-meta text-acid-green">Copied!</span> : <Copy size={12} className="text-muted-high" />}
              </button>
            </div>
            {balance !== null && <div className="text-meta text-muted-high font-mono mt-1">Balance: {balance.toFixed(4)} SOL</div>}
          </div>

          {/* Turnkey Trading Wallet */}
          {isAuthenticated && turnkeyAddress ? (
            <div className="mb-4 p-3 bg-elevated border border-[#39FF14]/20">
              <div className="flex items-center justify-between mb-2">
                <div className="text-meta text-muted-high uppercase tracking-widest flex items-center gap-1">
                  <Zap size={10} className="text-acid-green" /> Trading Wallet (Turnkey)
                </div>
                <span className="text-meta text-acid-green font-mono">Active</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-meta font-mono text-fg break-all">{turnkeyAddress}</code>
                <button onClick={() => handleCopy('turnkey', turnkeyAddress)} className="p-1 hover:bg-white/10 flex-shrink-0">
                  {copied === 'turnkey' ? <span className="text-meta text-acid-green">Copied!</span> : <Copy size={12} className="text-muted-high" />}
                </button>
              </div>
              {turnkeyBalance !== null && <div className="text-meta text-muted-high font-mono mt-1">Balance: {turnkeyBalance.toFixed(4)} SOL</div>}
              <a href={`https://solscan.io/account/${turnkeyAddress}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 mt-2 text-meta text-fg-soft hover:text-fg transition-colors">
                <ExternalLink size={10} /> View on Solscan
              </a>
              {(turnkeyBalance === null || turnkeyBalance === 0) && (
                <div className="mt-3 p-2 bg-[#FF003C]/10 border border-[#FF003C]/30 text-meta text-error font-mono">
                  This wallet has no SOL. Send SOL to the address above to start trading.
                </div>
              )}
            </div>
          ) : (
            <div className="mb-4 p-3 bg-elevated border border-white/10 text-meta text-muted-high">
              No trading wallet linked yet. Visit the terminal to auto-create one.
            </div>
          )}

          {/* Export Private Key */}
          {isAuthenticated && turnkeyAddress && (
            <div className="mb-4">
              {exportStep === 'idle' && (
                <button onClick={() => setExportStep('warning')}
                  className="w-full py-2.5 text-meta font-bold uppercase tracking-wider border border-[#FF003C]/30 text-error hover:bg-[#FF003C]/10 transition-colors flex items-center justify-center gap-2">
                  <Key size={12} /> Export Private Key
                </button>
              )}

              {exportStep === 'warning' && (
                <div className="p-3 bg-elevated border border-[#FF003C]/30">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle size={14} className="text-error flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-meta font-bold text-error mb-1">Warning: Extremely sensitive!</p>
                      <ul className="text-meta text-error/80 space-y-0.5">
                        <li>Anyone with your private key can steal your funds</li>
                        <li>Never share it with anyone</li>
                        <li>Do not store it in cloud services</li>
                      </ul>
                    </div>
                  </div>
                  {exportError && <p className="text-meta text-error mb-2 font-mono">{exportError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setExportStep('idle'); setExportError(null); }}
                      className="flex-1 py-2 text-meta border border-white/10 text-fg-soft hover:bg-white/5">Cancel</button>
                    <button onClick={handleExport}
                      className="flex-1 py-2 text-meta bg-[#FF003C] text-white font-bold hover:brightness-110">I Understand, Export</button>
                  </div>
                </div>
              )}

              {exportStep === 'loading' && (
                <div className="p-4 bg-elevated border border-white/10 flex flex-col items-center gap-2">
                  <Loader2 size={20} className="text-acid-green animate-spin" />
                  <p className="text-meta text-fg-soft">Exporting and decrypting...</p>
                </div>
              )}

              {exportStep === 'result' && exportedKey && (
                <div className="p-3 bg-elevated border border-[#FF003C]/30">
                  <div className="text-meta text-error uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Key size={10} /> Your Private Key
                  </div>
                  <div className="relative">
                    <code className="block text-meta font-mono text-fg break-all bg-black/50 p-2 pr-8">{exportedKey}</code>
                    <button onClick={() => handleCopy('key', exportedKey)} className="absolute top-1 right-1 p-1 hover:bg-white/10">
                      {copied === 'key' ? <span className="text-meta text-acid-green">Copied!</span> : <Copy size={10} className="text-muted-high" />}
                    </button>
                  </div>
                  <p className="text-meta text-error/70 mt-2">Store this securely. Never share it with anyone.</p>
                  <button onClick={() => { setExportStep('idle'); setExportedKey(null); }}
                    className="mt-2 text-meta text-fg-soft hover:text-fg">Hide Key</button>
                </div>
              )}
            </div>
          )}

          {/* Disconnect */}
          <button onClick={handleDisconnect}
            className="w-full py-2.5 text-meta font-bold uppercase tracking-wider border border-white/10 text-error hover:bg-[#FF003C]/10 transition-colors flex items-center justify-center gap-2">
            <LogOut size={12} /> Disconnect All Wallets
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setDropdownOpen(!dropdownOpen)}
        className="btn-press flex items-center gap-2 px-3 py-1.5 bg-elevated border border-[#39FF14]/30 text-acid-green text-meta font-bold tracking-wider hover:border-[#39FF14] hover:shadow-[0_0_10px_rgba(57,255,20,0.12)]">
        {isAuthenticated ? <Zap size={12} /> : <Wallet size={12} />}
        <span className="font-mono">{shortenedAddress}</span>
        {turnkeyBalance !== null && <span className="text-fg-soft font-mono">{turnkeyBalance.toFixed(2)} SOL</span>}
        <ChevronDown size={10} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <div className="dropdown-enter absolute right-0 top-full mt-1 w-56 bg-[#0A0A0A] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50">
          <div className="px-3 py-2 border-b border-white/5">
            <div className="text-meta text-muted-high uppercase tracking-widest">Phantom</div>
            <div className="text-meta font-mono text-fg-soft">{shortenedAddress}</div>
          </div>
          {isAuthenticated && turnkeyAddress && (
            <div className="px-3 py-2 border-b border-white/5">
              <div className="text-meta text-acid-green uppercase tracking-widest flex items-center gap-1"><Zap size={8} /> Trading Wallet</div>
              <div className="text-meta font-mono text-fg">{turnkeyAddress.slice(0, 4)}...{turnkeyAddress.slice(-4)}</div>
              <div className="text-meta font-mono text-muted-high">{turnkeyBalance !== null ? `${turnkeyBalance.toFixed(4)} SOL` : '--'}</div>
            </div>
          )}
          <button onClick={() => { setShowProfile(true); setDropdownOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-meta font-bold tracking-wider text-fg-soft hover:bg-elevated hover:text-fg transition-all duration-100 hover:pl-4">
            <User size={12} /> PROFILE
          </button>
          {turnkeyAddress && (
            <button onClick={() => handleCopy('turnkey', turnkeyAddress)}
              className="w-full flex items-center gap-2 px-3 py-2 text-meta font-bold tracking-wider text-fg-soft hover:bg-elevated hover:text-fg transition-all duration-100 hover:pl-4">
              <Copy size={12} /> {copied === 'turnkey' ? 'COPIED!' : 'COPY_TRADE_WALLET'}
            </button>
          )}
          <button onClick={() => { window.open(`https://solscan.io/account/${turnkeyAddress || publicKey}`, '_blank'); setDropdownOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-meta font-bold tracking-wider text-fg-soft hover:bg-elevated hover:text-fg transition-all duration-100 hover:pl-4">
            <ExternalLink size={12} /> VIEW_SOLSCAN
          </button>
          <div className="border-t border-white/10" />
          <button onClick={handleDisconnect}
            className="w-full flex items-center gap-2 px-3 py-2 text-meta font-bold tracking-wider text-error hover:bg-elevated transition-all duration-100 hover:pl-4">
            <LogOut size={12} /> DISCONNECT
          </button>
        </div>
      )}
    </div>
  );
}
