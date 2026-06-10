import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How BAGS Terminal handles data. Non-custodial: we never hold your funds or private keys.",
};

const sections: { h: string; body: string[] }[] = [
  {
    h: "1. Who we are",
    body: [
      "BAGS Terminal (\"the Interface\") is a non-custodial, client-side interface for discovering and launching Solana tokens, built on bags.fm. We are an interface only — we never take custody of your funds, private keys, or seed phrases.",
    ],
  },
  {
    h: "2. What we collect",
    body: [
      "Public wallet data: when you connect a wallet, we read your public address and on-chain activity needed to render the app (balances, tokens you created, claimable fees). This is public blockchain data.",
      "Usage analytics: we may collect privacy-light, aggregate analytics (page views and product events such as launch/claim/share) to improve the product. We do not attach this to real-world identity and do not run cross-site advertising trackers.",
      "Local storage: referral attribution (the ?ref= value) and UI preferences are stored in your browser, not on our servers.",
    ],
  },
  {
    h: "3. What we do NOT collect",
    body: [
      "We never collect or store private keys or seed phrases. We never take custody of assets. We do not require KYC or personal identity documents. We do not sell your data.",
    ],
  },
  {
    h: "4. Third-party services",
    body: [
      "The Interface reads data from and routes requests to third parties including DexScreener, GeckoTerminal, the Bags API (bags.fm), and public Solana RPC providers. Their handling of data is governed by their own policies.",
    ],
  },
  {
    h: "5. Your choices",
    body: [
      "You can disconnect your wallet at any time, clear your browser local storage to remove referral/preference data, and use standard browser controls to block analytics where applicable.",
    ],
  },
  {
    h: "6. Contact",
    body: ["Questions about this policy can be directed to the team via the official channels listed on bagsterminal.fm."],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#050505] text-[#EDEDED] font-mono max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6 border border-[#FF003C]/30 bg-[#FF003C]/5 p-3 text-[10px] text-[#FF8b9c]">
        DRAFT — pending review by legal counsel. This document is provided for transparency and is not yet a binding legal agreement.
      </div>
      <h1 className="text-xl font-bold tracking-tight text-display">
        PRIVACY<span className="text-[#39FF14]">_</span>POLICY
      </h1>
      <p className="text-[10px] text-[#666] mt-2">Effective date: pending publication</p>

      <div className="mt-8 flex flex-col gap-6">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-[12px] font-bold text-[#EDEDED] uppercase tracking-widest">{s.h}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="text-[12px] leading-relaxed text-[#aaa] mt-2">{p}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
