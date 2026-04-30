'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useTerminalStore } from '@/store/terminal.store';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';

const SLIPPAGE_PRESETS = [50, 100, 200, 500]; // in bps (0.5%, 1%, 2%, 5%)
const PRIORITY_PRESETS = [
  { label: 'NONE', value: 0 },
  { label: 'LOW', value: 10000 },
  { label: 'MED', value: 50000 },
  { label: 'HIGH', value: 200000 },
];

export function SlippageSettings() {
  const [open, setOpen] = useState(false);
  const { slippageBps, priorityFee, setSlippage, setPriorityFee } = useTerminalStore();
  const [customSlippage, setCustomSlippage] = useState('');

  const handleCustomSlippage = (value: string) => {
    setCustomSlippage(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
      setSlippage(Math.round(parsed * 100));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-meta text-muted-high hover:text-fg transition-colors font-mono focus-ring"
          aria-label="Open slippage and priority fee settings"
        >
          <Settings size={10} aria-hidden="true" />
          Slippage: {(slippageBps / 100).toFixed(1)}% · Priority: {PRIORITY_PRESETS.find(p => p.value === priorityFee)?.label || 'NONE'}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-72 max-w-[calc(100vw-1rem)] p-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-meta font-bold text-fg uppercase tracking-widest">Settings</span>
        </div>

        <div className="mb-3">
          <span className="text-meta text-muted-high uppercase tracking-widest">Slippage Tolerance</span>
          <div className="grid grid-cols-2 gap-1 mt-1 sm:grid-cols-4">
            {SLIPPAGE_PRESETS.map((bps) => (
              <button
                key={bps}
                type="button"
                onClick={() => { setSlippage(bps); setCustomSlippage(''); }}
                aria-pressed={slippageBps === bps}
                className={`py-1.5 text-[10px] font-mono font-bold border transition-colors active:scale-95 focus-ring sm:text-meta ${
                  slippageBps === bps
                    ? 'border-acid-green text-acid-green bg-acid-green/10'
                    : 'border-line text-fg-soft hover:border-muted-high hover:text-fg'
                }`}
              >
                {(bps / 100).toFixed(1)}%
              </button>
            ))}
          </div>
          <div className="mt-2">
            <Field label="Custom (%)" helper="0.1 – 50">
              <Input
                inputSize="sm"
                type="number"
                value={customSlippage}
                onChange={(e) => handleCustomSlippage(e.target.value)}
                placeholder="0.5"
                step="0.1"
                min="0.1"
                max="50"
              />
            </Field>
          </div>
        </div>

        <div>
          <span className="text-meta text-muted-high uppercase tracking-widest">Priority Fee</span>
          <div className="grid grid-cols-2 gap-1 mt-1 sm:grid-cols-4">
            {PRIORITY_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setPriorityFee(preset.value)}
                aria-pressed={priorityFee === preset.value}
                className={`py-1.5 text-[10px] font-bold uppercase border transition-colors active:scale-95 focus-ring sm:text-meta ${
                  priorityFee === preset.value
                    ? 'border-acid-green text-acid-green bg-acid-green/10'
                    : 'border-line text-fg-soft hover:border-muted-high hover:text-fg'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
