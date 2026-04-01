'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EarlyAccessPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    
    // Simulate API request
    setTimeout(() => {
      setStatus('success');
    }, 1500);
  };

  return (
    <div className="min-h-[100vh] w-full flex flex-col p-6 sm:p-12 lg:p-24 font-sans relative overflow-hidden" style={{ backgroundColor: '#F2EFE9' }}>
      
      {/* Outer Blue Vignette Effect */}
      <div 
        className="fixed inset-0 pointer-events-none" 
        style={{
          boxShadow: 'inset 0 0 160px 20px rgba(96, 165, 250, 0.15)'
        }} 
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto my-auto pt-12 md:pt-0">
        
        <motion.div 
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
           className="w-full"
        >
          {/* Header */}
          <div className="mb-20">
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#888] mb-2">
              PRETEXT
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 lg:gap-24">
            
            {/* Left Column: Copy directly on background */}
            <div className="flex flex-col">
              <h1 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] text-[#111] leading-[1.05] tracking-tight mb-6">
                The future of multiline text geometry.
              </h1>
              
              <p className="text-[17px] text-[#555] mb-12 leading-relaxed max-w-lg">
                Pretext is a pure JavaScript/TypeScript library implementing its own text measurement logic. Bypass expensive DOM reflows and render directly to Canvas, SVG, or server-side flawlessly.
              </p>

              {/* Unique Features List - formatted like Pretext Demo cards */}
              <div className="grid gap-4 w-full">
                <div className="bg-[#fdfcf9] border border-[#e5e3de] rounded-2xl p-6 shadow-sm shadow-black/5">
                  <h3 className="text-base font-bold text-[#111] mb-2">Zero Reflows</h3>
                  <p className="text-sm text-[#555] leading-relaxed">Side-steps getBoundingClientRect entirely, preventing layout thrashing.</p>
                </div>
                <div className="bg-[#fdfcf9] border border-[#e5e3de] rounded-2xl p-6 shadow-sm shadow-black/5">
                  <h3 className="text-base font-bold text-[#111] mb-2">AI-Friendly Iteration</h3>
                  <p className="text-sm text-[#555] leading-relaxed">Uses the browser's font engine as source of ground truth, isolated from DOM coupling.</p>
                </div>
                <div className="bg-[#fdfcf9] border border-[#e5e3de] rounded-2xl p-6 shadow-sm shadow-black/5">
                  <h3 className="text-base font-bold text-[#111] mb-2">Language Support</h3>
                  <p className="text-sm text-[#555] leading-relaxed">Fully supports complex scripts, emojis, and mixed-bidi right out of the box.</p>
                </div>
              </div>

            </div>

            {/* Right Column: Waitlist form inside a card */}
            <div className="flex flex-col relative w-full pt-2">
               
               <div className="bg-[#fcfcfa] rounded-3xl p-8 border border-[#e5e3de] shadow-lg shadow-black/[0.03]">
                 <h2 className="font-serif text-2xl mb-3 text-[#111] leading-tight font-medium">Join the waitlist</h2>
                 <p className="text-sm text-[#666] mb-8 leading-relaxed">
                   We are opening early access to select developers. Register your <strong>public Gmail listing</strong> to request API access.
                 </p>

                 <AnimatePresence mode="wait">
                   {status === 'success' ? (
                     <motion.div
                       key="success"
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="bg-[#f0f9f4] text-[#126b41] rounded-2xl p-6 text-center border border-[#cbebdd]"
                     >
                       <div className="text-3xl mb-3">✨</div>
                       <h3 className="font-serif text-xl mb-2 text-[#0f5333]">You're on the list</h3>
                       <p className="text-sm text-[#27865c] leading-relaxed">
                         Keep an eye on <br/><strong className="font-medium text-[#0f5333]">{email}</strong><br/> for your invite.
                       </p>
                     </motion.div>
                   ) : (
                     <motion.form 
                       key="form"
                       exit={{ opacity: 0 }}
                       onSubmit={handleSubmit}
                       className="flex flex-col gap-4"
                     >
                       <div className="relative">
                         <label htmlFor="email" className="sr-only">Gmail Address</label>
                         <input 
                           type="email" 
                           id="email"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           placeholder="developer@gmail.com" 
                           className="w-full bg-transparent border border-[#d5d3ce] text-[#111] rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all placeholder:text-[#aaa] text-sm"
                           required
                         />
                       </div>
                       
                       <button 
                         disabled={status === 'loading'}
                         type="submit" 
                         className="w-full bg-[#111] hover:bg-[#333] text-white rounded-xl px-4 py-3.5 font-medium transition-all flex items-center justify-center disabled:opacity-70 text-sm"
                       >
                         {status === 'loading' ? (
                           <div className="w-5 h-5 flex items-center justify-center">
                             <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                           </div>
                         ) : (
                           "Request Early Access"
                         )}
                       </button>

                       <div className="text-center mt-2">
                         <p className="text-[10px] text-[#888] uppercase tracking-widest font-medium">
                           No spam. Unsubscribe at any time.
                         </p>
                       </div>
                     </motion.form>
                   )}
                 </AnimatePresence>
               </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
