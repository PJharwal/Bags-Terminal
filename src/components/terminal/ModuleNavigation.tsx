"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const modules = [
  { name: "DISCOVER", href: "/discover" },
  { name: "ANALYZE", href: "/analyze" },
  { name: "TRACK", href: "/track" },
  { name: "EXECUTE", href: "/execute" },
];

export default function ModuleNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-center gap-1 bg-[#0A0A0A] p-2 border-b border-[rgba(255,255,255,0.12)]">
      {modules.map((module) => {
        const isActive = pathname.startsWith(module.href);
        return (
          <Link
            key={module.name}
            href={module.href}
            className={cn(
              "px-6 py-2 text-sm font-bold tracking-[0.2em] transition-all duration-200 border border-transparent font-sans",
              isActive
                ? "bg-[#39FF14] text-black border-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.4)]"
                : "text-[#888888] hover:text-[#39FF14] hover:bg-white/5 hover:border-white/10"
            )}
          >
            {module.name}
          </Link>
        );
      })}
    </nav>
  );
}
