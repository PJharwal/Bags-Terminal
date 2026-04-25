'use client';

import { useState } from 'react';
import { SocialLinkList } from './SocialLinkList';
import { AddSocialLink } from './AddSocialLink';
import { Link2, Plus } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogPortal, DialogOverlay } from '@/components/ui/Dialog';
import * as RadixDialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

export function SocialLinkManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setIsOpen(next);
    if (!next) setShowAddForm(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 border border-line text-meta font-bold text-fg-soft uppercase tracking-wider hover:border-acid-green hover:text-acid-green transition-all focus-ring"
        >
          <Link2 size={12} aria-hidden="true" />
          Social Links
        </button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <RadixDialog.Content
          style={{ zIndex: "var(--z-modal)" }}
          className={cn(
            "dialog-content fixed inset-y-0 right-0 w-80 max-w-[90vw] !translate-x-0 !translate-y-0 !left-auto !top-0 flex flex-col focus:outline-none",
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-default">
            <DialogTitle className="text-meta font-bold text-fg uppercase tracking-widest">Social Accounts</DialogTitle>
            <DialogDescription className="sr-only">
              Manage and link your social accounts.
            </DialogDescription>
            <RadixDialog.Close
              type="button"
              aria-label="Close social accounts panel"
              className="flex items-center justify-center w-7 h-7 text-muted-high hover:text-fg transition-colors focus-ring"
            >
              <span aria-hidden="true">×</span>
            </RadixDialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <SocialLinkList />

            {showAddForm ? (
              <AddSocialLink onClose={() => setShowAddForm(false)} />
            ) : (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex items-center justify-center gap-2 py-2 border border-dashed border-line text-meta font-bold text-fg-soft uppercase tracking-wider hover:border-acid-green hover:text-acid-green transition-all focus-ring"
              >
                <Plus size={12} aria-hidden="true" />
                Link New Account
              </button>
            )}
          </div>
        </RadixDialog.Content>
      </DialogPortal>
    </Dialog>
  );
}
