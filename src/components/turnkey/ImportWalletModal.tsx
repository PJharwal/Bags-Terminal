"use client";

import { FC, useState } from "react";
import { Key, X, Loader2, Check } from "lucide-react";
import { useTurnkey } from "./TurnkeyProvider";

interface ImportWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportWalletModal: FC<ImportWalletModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { importWallet } = useTurnkey();
  const [step, setStep] = useState<"input" | "loading" | "success">("input");
  const [walletName, setWalletName] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!walletName.trim() || !privateKey.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setStep("loading");
    setError(null);

    const result = await importWallet(walletName, privateKey.trim());

    if (result.success) {
      setStep("success");
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      setError(result.error || "Import failed");
      setStep("input");
    }
  };

  const handleClose = () => {
    setStep("input");
    setWalletName("");
    setPrivateKey("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative z-10 w-full max-w-md p-6 bg-[#0A0A0A] border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#EDEDED] flex items-center gap-2">
            <Key className="w-4 h-4 text-[#39FF14]" />
            Import Private Key
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-[#666]" />
          </button>
        </div>

        {/* Success Step */}
        {step === "success" && (
          <div className="py-8 flex flex-col items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center border border-[#39FF14]/30 bg-[#39FF14]/10">
              <Check className="w-6 h-6 text-[#39FF14]" />
            </div>
            <p className="text-xs text-[#39FF14] font-mono">
              Wallet imported successfully!
            </p>
          </div>
        )}

        {/* Loading Step */}
        {step === "loading" && (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#39FF14] animate-spin" />
            <p className="text-[10px] text-[#888]">Importing wallet...</p>
          </div>
        )}

        {/* Input Step */}
        {step === "input" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] text-[#666] uppercase tracking-widest">
                Wallet Name
              </label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="My Imported Wallet"
                className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] text-sm font-mono text-[#EDEDED] placeholder:text-[#444] focus:border-[#39FF14] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] text-[#666] uppercase tracking-widest">
                Private Key (Base58)
              </label>
              <textarea
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Input your private key..."
                className="w-full h-24 px-3 py-2 bg-[#1A1A1A] border border-[#333] text-sm font-mono text-[#EDEDED] placeholder:text-[#444] focus:border-[#39FF14] focus:outline-none resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-[#FF003C]/10 border border-[#FF003C]/30 text-[#FF003C] text-[10px] font-mono">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 border border-white/10 text-[10px] text-[#888] hover:bg-white/5 transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!walletName || !privateKey}
                className="flex-1 py-2.5 bg-[#39FF14] text-black text-[10px] font-bold uppercase tracking-wider hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Import Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
