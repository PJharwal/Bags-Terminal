"use client";

import { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet } from "lucide-react";

interface TurnkeyLoginProps {
  onSuccess?: () => void;
}

export const TurnkeyLogin: FC<TurnkeyLoginProps> = ({ onSuccess }) => {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  const handleConnect = () => {
    setVisible(true);
    if (connected && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-meta text-fg-soft">
        Connect your Phantom wallet to create a one-click trading wallet.
      </p>
      <button
        onClick={handleConnect}
        className="w-full py-3 text-xs font-bold uppercase tracking-wider text-black bg-acid-green hover:brightness-110 transition-all flex items-center justify-center gap-2"
      >
        <Wallet size={14} />
        Connect Phantom
      </button>
    </div>
  );
};
