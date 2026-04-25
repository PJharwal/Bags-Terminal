"use client";

import { FC, useEffect, useState } from "react";
import { Key, Loader2, Check } from "lucide-react";
import { useTurnkey } from "./TurnkeyProvider";
import {
  Dialog,
  DialogContent,
  DialogClose,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

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
  const [walletNameError, setWalletNameError] = useState<string | null>(null);
  const [privateKeyError, setPrivateKeyError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Reset state whenever modal closes — sync local form state to the open prop.
  useEffect(() => {
    if (isOpen) return;
    /* eslint-disable react-hooks/set-state-in-effect -- intentional: clearing form state when modal closes is a single sync point with no cascade. */
    setStep("input");
    setWalletName("");
    setPrivateKey("");
    setWalletNameError(null);
    setPrivateKeyError(null);
    setGlobalError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isOpen]);

  // Auto-close on success after 1.5s
  useEffect(() => {
    if (step !== "success") return;
    const t = setTimeout(() => onClose(), 1500);
    return () => clearTimeout(t);
  }, [step, onClose]);

  const handleImport = async () => {
    setWalletNameError(null);
    setPrivateKeyError(null);
    setGlobalError(null);

    let valid = true;
    if (!walletName.trim()) {
      setWalletNameError("Wallet name is required");
      valid = false;
    }
    if (!privateKey.trim()) {
      setPrivateKeyError("Private key is required");
      valid = false;
    }
    if (!valid) return;

    setStep("loading");
    const result = await importWallet(walletName, privateKey.trim());

    if (result.success) {
      setStep("success");
    } else {
      setGlobalError(result.error || "Import failed");
      setStep("input");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="!max-w-md p-6">
        <ModalHeader
          icon={<Key className="w-4 h-4" aria-hidden="true" />}
          title="Import Private Key"
          description={<span className="sr-only">Import an existing Solana wallet by providing a name and base58 private key.</span>}
        />

        {step === "success" && (
          <div role="status" className="py-8 flex flex-col items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center border border-acid-green/30 bg-acid-green/10">
              <Check className="w-6 h-6 text-acid-green" aria-hidden="true" />
            </div>
            <p className="text-xs text-acid-green font-mono">
              Wallet imported successfully!
            </p>
          </div>
        )}

        {step === "loading" && (
          <div role="status" aria-busy="true" className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-acid-green animate-spin" aria-hidden="true" />
            <p className="text-meta text-fg-soft">Importing wallet...</p>
          </div>
        )}

        {step === "input" && (
          <ModalBody>
            <Field label="Wallet Name" error={walletNameError ?? undefined}>
              <Input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="My Imported Wallet"
                autoComplete="off"
              />
            </Field>

            <Field label="Private Key (Base58)" error={privateKeyError ?? undefined}>
              <Textarea
                textareaSize="md"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Input your private key..."
                autoComplete="off"
                spellCheck={false}
              />
            </Field>

            {globalError && (
              <div role="alert" className="p-3 bg-error/10 border border-error/30 text-error text-meta font-mono">
                {globalError}
              </div>
            )}

            <ModalFooter
              cancel={
                <DialogClose asChild>
                  <Button variant="ghost" size="md" fullWidth>Cancel</Button>
                </DialogClose>
              }
              confirm={
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={handleImport}
                  disabled={!walletName || !privateKey}
                >
                  Import Wallet
                </Button>
              }
            />
          </ModalBody>
        )}
      </DialogContent>
    </Dialog>
  );
};
