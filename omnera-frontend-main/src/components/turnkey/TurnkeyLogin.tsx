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
    // onSuccess will be called by parent when wallet auto-creates
    if (connected && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connect your Phantom wallet to create a one-click trading wallet.
      </p>
      <button
        onClick={handleConnect}
        className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium flex items-center justify-center gap-2"
      >
        <Wallet size={18} />
        Connect Phantom
      </button>
    </div>
  );
};
