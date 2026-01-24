'use client';

import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { useTerminalStore } from '@/store/terminal.store';

const SLIPPAGE_PRESETS = [50, 100, 200, 500]; // in bps (0.5%, 1%, 2%, 5%)
const PRIORITY_PRESETS = [
  { label: 'NONE', value: 0 },
  { label: 'LOW', value: 10000 },
  { label: 'MED', value: 50000 },
  { label: 'HIGH', value: 200000 },
];

export function SlippageSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const { slippageBps, priorityFee, setSlippage, setPriorityFee } = useTerminalStore();
  const [customSlippage, setCustomSlippage] = useState('');

  const handleCustomSlippage = (value: string) => {
    setCustomSlippage(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
      setSlippage(Math.round(parsed * 100));
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-[9px] text-[#666] hover:text-[#EDEDED] transition-colors font-mono"
      >
        <Settings size={10} />
        Slippage: {(slippageBps / 100).toFixed(1)}% · Priority: {PRIORITY_PRESETS.find(p => p.value === priorityFee)?.label || 'NONE'}
      </button>
    );
  }

  return (
    <div className="p-3 bg-[#0A0A0A] border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-[#EDEDED] uppercase tracking-widest">Settings</span>
        <button onClick={() => setIsOpen(false)} className="text-[#666] hover:text-[#EDEDED]">
          <X size={12} />
        </button>
      </div>

      {/* Slippage */}
      <div className="mb-3">
        <span className="text-[9px] text-[#666] uppercase tracking-widest">Slippage Tolerance</span>
        <div className="grid grid-cols-4 gap-1 mt-1">
          {SLIPPAGE_PRESETS.map((bps) => (
            <button
              key={bps}
              onClick={() => { setSlippage(bps); setCustomSlippage(''); }}
              className={`py-1.5 text-[10px] font-mono font-bold border transition-colors ${
                slippageBps === bps
                  ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
                  : 'border-[#333] text-[#888] hover:border-[#666]'
              }`}
            >
              {(bps / 100).toFixed(1)}%
            </button>
          ))}
        </div>
        <input
          type="number"
          value={customSlippage}
          onChange={(e) => handleCustomSlippage(e.target.value)}
          placeholder="Custom %"
          className="mt-1 w-full bg-[#1A1A1A] border border-[#333] px-2 py-1.5 text-[10px] font-mono text-[#EDEDED] focus:border-[#39FF14] focus:outline-none"
          step="0.1"
          min="0.1"
          max="50"
        />
      </div>

      {/* Priority Fee */}
      <div>
        <span className="text-[9px] text-[#666] uppercase tracking-widest">Priority Fee</span>
        <div className="grid grid-cols-4 gap-1 mt-1">
          {PRIORITY_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setPriorityFee(preset.value)}
              className={`py-1.5 text-[9px] font-bold uppercase border transition-colors ${
                priorityFee === preset.value
                  ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
                  : 'border-[#333] text-[#888] hover:border-[#666]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
