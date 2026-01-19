"use client";

import { FC, useState } from "react";
import { Key, Copy, Check, AlertTriangle, X, Loader2 } from "lucide-react";
import { generateP256KeyPair, decryptExportBundle } from "@turnkey/crypto";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";

interface ExportKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  walletAddress: string;
  publicKey: string | PublicKey;
}

export const ExportKeyModal: FC<ExportKeyModalProps> = ({
  isOpen,
  onClose,
  userId,
  walletAddress,
  publicKey,
}) => {
  const [step, setStep] = useState<"warning" | "loading" | "result">("warning");
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    setStep("loading");
    setError(null);

    const generateUncompressedP256KeyPair = async () => {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "ECDH",
          namedCurve: "P-256",
        },
        true,
        ["deriveBits"]
      );

      const rawPublicKey = await window.crypto.subtle.exportKey(
        "raw",
        keyPair.publicKey
      );
      const publicKeyHex = Buffer.from(rawPublicKey).toString("hex");

      const jwkPrivateKey = await window.crypto.subtle.exportKey(
        "jwk",
        keyPair.privateKey
      );
      const dBase64Url = jwkPrivateKey.d!;
      const dBase64 = dBase64Url.replace(/-/g, "+").replace(/_/g, "/");
      const padding = "=".repeat((4 - (dBase64.length % 4)) % 4);
      const dHex = Buffer.from(dBase64 + padding, "base64").toString("hex");

      return {
        publicKey: publicKeyHex,
        privateKey: dHex,
      };
    };

    try {
      const keyPair = await generateUncompressedP256KeyPair();
      const targetPublicKey = keyPair.publicKey;

      const phantomKey = publicKey.toString();

      console.log("Exporting for user (Phantom):", phantomKey);
      console.log(
        "Using ephemeral encryption key (Hex, Uncompressed):",
        targetPublicKey
      );

      const response = await fetch("/api/turnkey/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phantomAddress: phantomKey,
          targetPublicKey: targetPublicKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Export failed");
      }

      const decrypted = await decryptExportBundle({
        exportBundle: data.exportBundle,
        embeddedKey: keyPair.privateKey,
        organizationId: data.organizationId || "",
        returnMnemonic: false,
      });

      const mnemonic = Buffer.from(decrypted, "hex").toString("utf8").trim();
      const bip39 = await import("bip39");
      const seed = await bip39.mnemonicToSeed(mnemonic);

      const { derivePath } = await import("ed25519-hd-key");
      const path = "m/44'/501'/0'/0'";
      const derivedSeed = derivePath(
        path,
        Buffer.from(seed).toString("hex")
      ).key;

      const { Keypair } = await import("@solana/web3.js");
      const solKeypair = Keypair.fromSeed(derivedSeed);

      const privateKeyBase58 = bs58.encode(solKeypair.secretKey);
      setPrivateKey(privateKeyBase58);
      setStep("result");
    } catch (err) {
      console.error("Export error:", err);
      setError(err instanceof Error ? err.message : "Export failed");
      setStep("warning");
    }
  };

  const handleCopy = async () => {
    if (privateKey) {
      await navigator.clipboard.writeText(privateKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setStep("warning");
    setPrivateKey(null);
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
      <div className="relative z-10 w-full max-w-md p-6 rounded-xl bg-surface border border-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Key className="w-5 h-5" />
            Export Private Key
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Warning Step */}
        {step === "warning" && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-400">
                    Warning: This is extremely sensitive!
                  </p>
                  <ul className="text-xs text-red-400/80 space-y-1">
                    <li>• Anyone with your private key can steal your funds</li>
                    <li>• Never share it with anyone</li>
                    <li>• Do not store it in cloud services</li>
                    <li>• Make sure no one is watching your screen</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-background border border-border">
              <p className="text-xs text-muted-foreground mb-1">
                Wallet Address
              </p>
              <code className="text-sm text-white font-mono break-all">
                {walletAddress}
              </code>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-lg border border-border hover:bg-white/5 text-muted-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
              >
                I Understand, Export
              </button>
            </div>
          </div>
        )}

        {/* Loading Step */}
        {step === "loading" && (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Exporting and decrypting...
            </p>
          </div>
        )}

        {/* Result Step */}
        {step === "result" && privateKey && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-background border border-border">
              <p className="text-xs text-muted-foreground mb-2">
                Your Private Key / Mnemonic
              </p>
              <div className="relative">
                <code className="block text-sm text-white font-mono break-all p-3 rounded bg-black/50 pr-12">
                  {privateKey}
                </code>
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-400 mt-2">
                  Copied to clipboard!
                </p>
              )}
            </div>

            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-xs text-yellow-400">
                ⚠️ Store this securely and never share it with anyone!
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
