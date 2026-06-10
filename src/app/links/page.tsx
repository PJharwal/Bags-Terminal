import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Github, ShieldAlert, ArrowUpRight, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Official Links",
  description:
    "The only official BAGS Terminal links. We never DM first and never ask for your seed phrase. Beware of impersonators and fake airdrops.",
  openGraph: {
    title: "Official Links — BAGS Terminal",
    description:
      "Our only official surfaces. Verify before you click. We never DM first, never ask for your seed phrase.",
    url: "/links",
  },
};

const officialLinks: {
  label: string;
  url: string;
  display: string;
  icon: typeof Globe;
  color: string;
}[] = [
  {
    label: "Website",
    url: "https://www.bagsterminal.fm",
    display: "www.bagsterminal.fm",
    icon: Globe,
    color: "#39FF14",
  },
  {
    label: "GitHub (open source)",
    url: "https://github.com/PJharwal/Bags-Terminal",
    display: "github.com/PJharwal/Bags-Terminal",
    icon: Github,
    color: "#00F0FF",
  },
];

const pendingSocials: string[] = [
  "Official X / Twitter: (to be added)",
  "Official Telegram: (to be added)",
];

export default function LinksPage() {
  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#050505] text-[#EDEDED] font-mono max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold tracking-tight text-display">
        OFFICIAL<span className="text-[#39FF14]">_</span>LINKS
      </h1>
      <p className="label mt-2">
        The only surfaces we control. Verify before you click.
      </p>

      {/* Security warning */}
      <div className="mt-8 card p-5 border border-[#FF003C]/30 bg-[#FF003C]/5">
        <div className="flex items-start gap-3">
          <ShieldAlert size={20} className="text-[#FF003C] flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-[#FF003C] uppercase tracking-widest">
              Stay safe
            </h2>
            <p className="text-[12px] leading-relaxed text-[#FF8b9c] mt-2">
              These are our only official links. We never DM first. We never ask
              for your seed phrase. Beware of impersonators and fake airdrops.
            </p>
          </div>
        </div>
      </div>

      {/* Official surfaces */}
      <section className="mt-8">
        <h2 className="label-gold uppercase tracking-widest">Verified surfaces</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {officialLinks.map((l) => {
            const Icon = l.icon;
            return (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-5 flex items-center gap-4 group"
              >
                <div
                  className="w-10 h-10 flex items-center justify-center border bg-black/30 flex-shrink-0"
                  style={{ borderColor: `${l.color}33` }}
                >
                  <Icon size={18} style={{ color: l.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-[#666]">
                    {l.label}
                  </div>
                  <div
                    className="text-sm font-bold truncate"
                    style={{ color: l.color }}
                  >
                    {l.display}
                  </div>
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-[#555] flex-shrink-0 group-hover:text-[#EDEDED] transition-colors"
                />
              </a>
            );
          })}
        </div>
      </section>

      {/* Pending socials — honest placeholders */}
      <section className="mt-8">
        <h2 className="label uppercase tracking-widest">Social channels</h2>
        <p className="text-[11px] text-[#666] mt-2 leading-relaxed">
          We have not published verified social handles yet. We will list them
          here once confirmed. If an account claims to be us before then, it is
          not.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {pendingSocials.map((s) => (
            <div
              key={s}
              className="card p-4 flex items-center gap-3 border-dashed border-white/10"
            >
              <Clock size={16} className="text-[#666] flex-shrink-0" />
              <span className="text-[12px] text-[#888]">{s}</span>
              <span className="badge-blue ml-auto text-[9px] px-2 py-0.5">
                PENDING
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* What we actually are */}
      <section className="mt-8">
        <h2 className="label uppercase tracking-widest">What we are</h2>
        <p className="text-[12px] leading-relaxed text-[#aaa] mt-3 max-w-2xl">
          BAGS Terminal is a non-custodial interface for the creator-fee
          lifecycle on Solana: discover tokens, launch them no-code with fee
          sharing across up to 100 claimers, and claim your fees — all from one
          Solana wallet you control.
        </p>
        <p className="text-[12px] leading-relaxed text-[#39FF14] mt-3 font-bold">
          Discover it. Launch it. Get paid on it.
        </p>
        <p className="text-[11px] leading-relaxed text-[#666] mt-3 max-w-2xl">
          We never take custody of your funds or keys. Anything outside the
          links above — DMs, "support" accounts, airdrop forms, or seed-phrase
          requests — is not us.
        </p>
        <div className="mt-5">
          <Link href="/" className="btn-ghost btn-press text-[11px]">
            ← Back to terminal
          </Link>
        </div>
      </section>
    </div>
  );
}
