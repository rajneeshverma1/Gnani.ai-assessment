'use client';

import React, { useState } from 'react';
import {
  Mic,
  RotateCcw,
  Languages,
  Cpu,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NavbarProps {
  language: 'hi-IN' | 'en-IN' | 'hinglish';
  onLanguageChange: (lang: 'hi-IN' | 'en-IN' | 'hinglish') => void;
  onReseed: () => void;
  isReseeding: boolean;
}

export default function Navbar({
  language,
  onLanguageChange,
  onReseed,
  isReseeding,
}: NavbarProps) {
  const [showArchModal, setShowArchModal] = useState(false);

  const handleReset = async () => {
    if (
      confirm(
        'Are you sure you want to reset demo data? This will restore 8 customers and 12 realistic invoices.'
      )
    ) {
      onReseed();
      confetti({
        particleCount: 50,
        spread: 45,
        origin: { y: 0.15 },
        colors: ['#f6f3eb', '#ecc06f', '#68c99e', '#dcd5c9'],
      });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full px-3 pt-3 sm:px-6 sm:pt-4">
        <div className="mx-auto flex h-[52px] max-w-6xl items-center justify-between rounded-full border border-[#3a3834] bg-[#1f1d1b]/90 px-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md">
          {/* Logo & Brand matching TryClean.ai warm paper & cream identity */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#282623] text-[#f6f3eb] border border-[#3a3834]">
              <Mic className="h-3.5 w-3.5 text-[#ecc06f]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-[17px] font-semibold tracking-[-0.02em] text-[#f6f3eb]">
                  Vyapar<span className="text-[#ecc06f]">Voice</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#295441] bg-[#172b22] px-2 py-0.5 text-[10px] font-mono text-[#68c99e]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#68c99e] animate-pulse" />
                  Gnani Active
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Architecture Pill */}
            <button
              onClick={() => setShowArchModal(true)}
              className="hidden md:flex items-center gap-1.5 rounded-full border border-[#3a3834] bg-[#282623] px-3 py-1 text-xs text-[#c3beb7] hover:border-white/20 hover:text-[#f6f3eb] transition-colors"
              title="View Gnani AI Model Stack"
            >
              <Cpu className="h-3 w-3 text-[#ecc06f]" />
              <span className="text-[11px] font-medium tracking-wide">Prisma • Evon • Timbre</span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="flex items-center rounded-full border border-[#3a3834] bg-[#282623] px-2.5 py-1 text-xs">
              <Languages className="mr-1 h-3 w-3 text-[#948e87]" />
              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as any)}
                className="bg-transparent text-[#f6f3eb] focus:outline-none cursor-pointer pr-1 text-[11px] font-medium"
              >
                <option value="hi-IN" className="bg-[#161513] text-[#f6f3eb]">
                  🇮🇳 हिन्दी (Hindi)
                </option>
                <option value="hinglish" className="bg-[#161513] text-[#f6f3eb]">
                  🇮🇳 Hinglish
                </option>
                <option value="en-IN" className="bg-[#161513] text-[#f6f3eb]">
                  🇮🇳 English (India)
                </option>
              </select>
            </div>

            {/* Reset Demo Data Button - TryClean pill style */}
            <button
              onClick={handleReset}
              disabled={isReseeding}
              className="flex items-center gap-1.5 rounded-full border border-[#594726] bg-[#2e2617] px-3 py-1 text-xs font-semibold text-[#ecc06f] hover:bg-[#3d321d] transition-all disabled:opacity-50"
              title="Reseed database with 8 customers and 12 invoices"
            >
              <RotateCcw className={`h-3 w-3 ${isReseeding ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline text-[11px]">Reset Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Architecture Modal */}
      {showArchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#3a3834] bg-[#1f1d1b] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#3a3834] pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-[#2e2617] p-2 text-[#ecc06f] border border-[#594726]">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-[#f6f3eb]">Gnani AI Model Pipeline</h3>
                  <p className="text-[11px] text-[#948e87]">Zero-exposure server-side architecture</p>
                </div>
              </div>
              <button
                onClick={() => setShowArchModal(false)}
                className="rounded-full p-1 text-[#948e87] hover:bg-[#282623] hover:text-[#f6f3eb]"
              >
                ✕
              </button>
            </div>

            <div className="mt-3.5 space-y-2.5 text-xs text-[#c3beb7]">
              <div className="flex items-start gap-2.5 rounded-xl border border-[#295441] bg-[#172b22]/50 p-2.5">
                <span className="rounded-full bg-[#172b22] px-2 py-0.5 font-mono text-[9px] font-bold text-[#68c99e] border border-[#295441]">
                  Prisma v2.5
                </span>
                <p className="text-[11px] leading-relaxed">
                  Converts speech input (WebM/WAV) to accurate Hindi, Hinglish, or Indian English transcripts.
                </p>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-[#594726] bg-[#2e2617]/50 p-2.5">
                <span className="rounded-full bg-[#2e2617] px-2 py-0.5 font-mono text-[9px] font-bold text-[#ecc06f] border border-[#594726]">
                  Evon v3.3
                </span>
                <p className="text-[11px] leading-relaxed">
                  Performs structured reasoning with Indian date/currency awareness and outputs validated JSON actions.
                </p>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-[#3a3834] bg-[#282623]/60 p-2.5">
                <span className="rounded-full bg-[#282623] px-2 py-0.5 font-mono text-[9px] font-bold text-[#f6f3eb] border border-[#3a3834]">
                  Timbre v2.5
                </span>
                <p className="text-[11px] leading-relaxed">
                  Generates natural voice confirmations strictly under 20 words in the merchant&apos;s spoken language.
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowArchModal(false)}
                className="rounded-full border border-[#3a3834] bg-[#282623] px-4 py-1.5 text-xs font-semibold text-[#f6f3eb] hover:bg-[#34312c] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
