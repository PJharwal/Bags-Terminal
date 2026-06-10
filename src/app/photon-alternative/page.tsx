import type { Metadata } from "next";
import Link from "next/link";
import { Rocket, Users, Wallet, Search, ArrowRight, Coins } from "lucide-react";

export const metadata: Metadata = {
  title: "BAGS Terminal — a Photon alternative",
  description:
    "Photon is a charts-and-execution terminal. BAGS Terminal is the creator-fee lifecycle: discover, launch with fee sharing up to 100 claimers, and get paid — on one Solana wallet.",
  openGraph: {
    title: "BAGS Terminal — a Photon alternative",
    description:
      "Compete on the payout axis, not speed. Launch with built-in fee sharing and claim creator fees on one Solana wallet.",
    url: "/photon-alternative",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "BAGS Terminal — a Photon alternative" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BAGS Terminal — a Photon alternative",
    description:
      "Compete on the payout axis, not speed. Launch with built-in fee sharing and claim creator fees on one Solana wallet.",
    images: ["/api/og"],
  },
};

const lifecycle: { icon: typeof Rocket; step: string; title: string; body: string }[] = [
  {
    icon: Search,
    step: "01",
    title: "DISCOVER",
    body: "Watch tokens move across their lifecycle in the live Pulse feed — new pairs, final stretch, migrated.",
  },
  {
    icon: Rocket,
    step: "02",
    title: "LAUNCH",
    body: "No-code launch on bags.fm. Set name, symbol, image, and a fee-share split across up to 100 claimers.",
  },
  {
    icon: Wallet,
    step: "03",
    title: "GET PAID",
    body: "Creator fees accrue on the token you launched. Claim them from one Solana wallet in the Creator dashboard.",
  },
];

const compare: { axis: string; incumbent: string; bags: string }[] = [
  {
    axis: "Primary job",
    incumbent: "Charts, discovery and execution — a terminal for trading Solana tokens.",
    bags: "The discover → launch → get-paid lifecycle for token creators.",
  },
  {
    axis: "Trade fees",
    incumbent: "Mainstream Solana terminals typically charge a ~1% trade fee with no rebate to users (industry norm).",
    bags: "We don't compete on spot execution. The model is creator-fee sharing on tokens you launch.",
  },
  {
    axis: "Who gets paid",
    incumbent: "The platform earns on your trades.",
    bags: "Up to 100 claimers split the creator fee on a token, settled to one Solana wallet.",
  },
  {
    axis: "Fee setup",
    incumbent: "Not part of the product — it's a trading interface.",
    bags: "Configure the split at launch by wallet or social handle. No code.",
  },
];

export default function PhotonAlternativePage() {
  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#050505] text-[#EDEDED] font-mono max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold tracking-tight text-display">
        BAGS Terminal — a Photon<span className="text-[#39FF14]">_</span>alternative
      </h1>
      <p className="label mt-2">Discover it. Launch it. Get paid on it.</p>

      <p className="text-[13px] leading-relaxed text-[#aaa] mt-6 max-w-2xl">
        Photon is built around charts and execution for trading Solana tokens. BAGS Terminal is built for
        the other side of the trade: the creator. We don&apos;t claim to be faster or to have live spot
        execution. We compete on one axis only — the creator-fee lifecycle. Launch a token with fee sharing
        baked in, then claim what it earns from a single Solana wallet.
      </p>

      {/* Lifecycle */}
      <div className="mt-10">
        <div className="label-gold mb-4">THE LIFECYCLE</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {lifecycle.map((s) => (
            <div key={s.step} className="card p-5 relative overflow-hidden">
              <div className="absolute top-3 right-3 text-[32px] font-bold opacity-[0.05] text-white">{s.step}</div>
              <s.icon size={18} className="text-[#39FF14] mb-3" />
              <h2 className="text-xs font-bold font-mono text-[#39FF14] tracking-widest mb-2">{s.title}</h2>
              <p className="text-[11px] text-[#888] leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison on the payout axis */}
      <div className="mt-10">
        <div className="label-gold mb-4">PAYOUT AXIS — HONEST COMPARISON</div>
        <div className="card p-0 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_1fr] text-[10px] uppercase tracking-widest text-[#666] border-b border-white/5 px-4 py-3 gap-3">
            <span>Axis</span>
            <span>Photon (incumbent)</span>
            <span className="text-[#39FF14]">BAGS Terminal</span>
          </div>
          {compare.map((row) => (
            <div
              key={row.axis}
              className="grid grid-cols-1 sm:grid-cols-[140px_1fr_1fr] gap-3 px-4 py-3 border-b border-white/5 last:border-b-0 text-[11px] leading-relaxed"
            >
              <span className="text-[#EDEDED] font-bold">{row.axis}</span>
              <span className="text-[#888]">{row.incumbent}</span>
              <span className="text-[#aaa]">{row.bags}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#555] mt-3 leading-relaxed max-w-2xl">
          The ~1% trade-fee figure reflects the general industry norm for mainstream Solana terminals, not a
          claim about any specific competitor&apos;s current pricing. BAGS Terminal does not offer live on-chain spot
          execution by default.
        </p>
      </div>

      {/* Fee-share highlight */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5 flex gap-4 items-start">
          <Users size={18} className="text-[#FFD700] mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="text-xs font-bold font-mono text-[#FFD700] tracking-widest mb-1">UP TO 100 CLAIMERS</h2>
            <p className="text-[11px] text-[#888] leading-relaxed">
              Split a token&apos;s creator fee across as many as 100 wallets or social handles, configured at launch.
            </p>
          </div>
        </div>
        <div className="card p-5 flex gap-4 items-start">
          <Coins size={18} className="text-[#00F0FF] mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="text-xs font-bold font-mono text-[#00F0FF] tracking-widest mb-1">ONE SOLANA WALLET</h2>
            <p className="text-[11px] text-[#888] leading-relaxed">
              Discover, launch, and claim from a single connected Solana wallet — no separate accounts to manage.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 flex items-center gap-4 flex-wrap">
        <Link href="/launch" className="btn-ghost btn-press px-5 py-2.5 text-xs flex items-center gap-2">
          Launch a token with fee sharing
          <ArrowRight size={14} />
        </Link>
        <span className="text-[10px] text-[#555]">No code. Configure your split in under a minute.</span>
      </div>
    </div>
  );
}
