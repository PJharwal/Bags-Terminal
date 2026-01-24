'use client';

import { useState } from 'react';
import { SocialLinkList } from './SocialLinkList';
import { AddSocialLink } from './AddSocialLink';
import { Link2, Plus, X } from 'lucide-react';

export function SocialLinkManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 border border-[#333] text-[10px] font-bold text-[#888] uppercase tracking-wider hover:border-[#39FF14] hover:text-[#39FF14] transition-all"
      >
        <Link2 size={12} />
        Social Links
      </button>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-[#050505] border-l border-white/10 z-50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-[11px] font-bold text-[#EDEDED] uppercase tracking-widest">Social Accounts</h3>
        <button
          onClick={() => { setIsOpen(false); setShowAddForm(false); }}
          className="text-[#666] hover:text-[#EDEDED] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <SocialLinkList />

        {showAddForm ? (
          <AddSocialLink onClose={() => setShowAddForm(false)} />
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 py-2 border border-dashed border-[#333] text-[10px] font-bold text-[#888] uppercase tracking-wider hover:border-[#39FF14] hover:text-[#39FF14] transition-all"
          >
            <Plus size={12} />
            Link New Account
          </button>
        )}
      </div>
    </div>
  );
}
