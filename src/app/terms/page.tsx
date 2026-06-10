import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using BAGS Terminal — a non-custodial Solana interface. Not financial advice.",
};

const sections: { h: string; body: string[] }[] = [
  {
    h: "1. Acceptance",
    body: [
      "By accessing BAGS Terminal (\"the Interface\") you agree to these Terms. If you do not agree, do not use the Interface.",
    ],
  },
  {
    h: "2. Non-custodial interface",
    body: [
      "The Interface is non-custodial. You retain sole control of your wallet, keys, and assets at all times. All transactions (token launches, fee claims) are constructed for you and signed by your own connected wallet. We never hold, move, or have access to your funds.",
    ],
  },
  {
    h: "3. Feature status (no misrepresentation)",
    body: [
      "Live today: live market data and the token feed, no-code token launch with fee sharing, and creator fee claims — all signed by your wallet.",
      "Not live: on-chain spot trade execution is disabled by default unless a backend is configured; perps and prediction markets are clearly marked \"In Testing\" / \"Coming Soon\" and are not tradable. Nothing in the Interface should be read as a claim that these are functional today.",
    ],
  },
  {
    h: "4. No financial advice; assumption of risk",
    body: [
      "Nothing in the Interface is financial, investment, legal, or tax advice. Trading and launching tokens on Solana is high-risk and may result in total loss. You are solely responsible for your decisions, your wallet security, and compliance with the laws of your jurisdiction.",
    ],
  },
  {
    h: "5. Eligibility & restricted use",
    body: [
      "You must be of legal age in your jurisdiction and not located in, or acting on behalf of anyone in, a jurisdiction subject to comprehensive sanctions. You may not use the Interface for unlawful activity. (Specific geographic restrictions to be finalized with counsel.)",
    ],
  },
  {
    h: "6. Third-party services & no warranty",
    body: [
      "The Interface relies on third parties (bags.fm / Bags API, DexScreener, GeckoTerminal, Solana RPC). It is provided \"as is\" without warranties of any kind. We do not guarantee uptime, data accuracy, or transaction success.",
    ],
  },
  {
    h: "7. Limitation of liability",
    body: [
      "To the maximum extent permitted by law, the Interface and its contributors are not liable for any losses arising from your use of the Interface, third-party services, or the underlying blockchain.",
    ],
  },
  {
    h: "8. Intellectual property",
    body: [
      "BAGS Terminal is built on the Bags SDK and brand under their applicable terms. The Bags name and marks belong to their respective owners.",
    ],
  },
  {
    h: "9. Changes & contact",
    body: [
      "We may update these Terms; continued use constitutes acceptance. Reach the team via the official channels listed on bagsterminal.fm.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#050505] text-[#EDEDED] font-mono max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6 border border-[#FF003C]/30 bg-[#FF003C]/5 p-3 text-[10px] text-[#FF8b9c]">
        DRAFT — pending review by legal counsel. This document is provided for transparency and is not yet a binding legal agreement.
      </div>
      <h1 className="text-xl font-bold tracking-tight text-display">
        TERMS<span className="text-[#39FF14]">_</span>OF_SERVICE
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
