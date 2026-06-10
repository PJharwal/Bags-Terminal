import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import FeeLeadersSection from "@/components/bags/FeeLeadersSection";

export const metadata: Metadata = {
  title: "Fee Leaders",
  description:
    "Solana creators ranked by lifetime creator fees earned on Bags.",
};

export default function FeeLeadersPage() {
  return (
    <div className="min-h-[calc(100vh-92px)] bg-[#050505] text-[#EDEDED] font-mono max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3">
        <Trophy size={20} className="text-[#FFD700]" />
        <h1 className="text-xl font-bold tracking-tight text-display">
          FEE<span className="text-[#39FF14]">_</span>LEADERS
        </h1>
      </div>
      <p className="label mt-2">
        Solana creators ranked by lifetime creator fees earned on Bags.
      </p>

      <div className="mt-8">
        <FeeLeadersSection />
      </div>
    </div>
  );
}
